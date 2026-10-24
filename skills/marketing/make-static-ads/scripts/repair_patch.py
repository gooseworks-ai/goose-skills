#!/usr/bin/env python3
"""Copy a verified official label into a compatible rendered label band. No model or network calls.

Usage: python3 repair_patch.py manifest.json
Requires numpy and OpenCV in the existing Python environment. This is a manually configured label repair,
not a cutout, product reconstruction or automatic pose matcher. The source/base files are never overwritten.
"""
import hashlib
import json
import math
import sys
from pathlib import Path

import cv2
import numpy as np


class RepairError(ValueError):
    pass


def quadratic(values, u):
    a, b, c = values
    return a * (2*u*u - 3*u + 1) + b * (4*u - 4*u*u) + c * (2*u*u - u)


def extrema(values):
    a, b, c = values
    aa, bb = 2*a - 4*b + 2*c, -3*a + 4*b - c
    points = [a, c]
    if aa and 0 < -bb/(2*aa) < 1:
        points.append(quadratic(values, -bb/(2*aa)))
    return min(points), max(points)


def validate_band(band, width, height):
    if not isinstance(band, dict):
        raise RepairError("Each band needs left/right x endpoints and top/bottom y guides.")
    for key, count in (("left", 2), ("right", 2), ("top", 3), ("bottom", 3)):
        values = band.get(key)
        if not isinstance(values, list) or len(values) != count or any(
            isinstance(x, bool) or not isinstance(x, (int, float)) or not math.isfinite(x) for x in values
        ):
            raise RepairError("%s must contain %d finite pixel coordinates." % (key, count))
    if min(band["left"] + band["right"]) < 0 or max(band["left"] + band["right"]) > width-1:
        raise RepairError("Label x coordinates lie outside the image.")
    if min(extrema(band["top"])[0], extrema(band["bottom"])[0]) < 0 or max(
        extrema(band["top"])[1], extrema(band["bottom"])[1]
    ) > height-1:
        raise RepairError("Label y curve lies outside the image.")
    widths = [r-l for l, r in zip(band["left"], band["right"])]
    gap = [b-t for t, b in zip(band["top"], band["bottom"])]
    if min(widths) < 4 or extrema(gap)[0] < 4:
        raise RepairError("Label boundaries cross or have less than four pixels of area.")
    if max(abs(band[side][1]-band[side][0]) for side in ("left", "right")) > min(widths)/2:
        raise RepairError("Pose is too oblique for this conservative label-only repair.")
    # The Jacobian is linear in v and quadratic in u, so its exact minimum is at
    # a v endpoint and a u endpoint or quadratic vertex. Check both source and target.
    def derivative(values, u):
        a, b, c = values
        return a*(4*u-3) + b*(4-8*u) + c*(4*u-1)
    left_slope = band["left"][1]-band["left"][0]
    width_slope = widths[1]-widths[0]
    for v in (0, 1):
        determinants = []
        for u in (0, .5, 1):
            dx_du = widths[0] + width_slope*v
            dx_dv = left_slope + width_slope*u
            dy_du = derivative(band["top"], u) + v*derivative(gap, u)
            determinants.append(dx_du*quadratic(gap, u)-dx_dv*dy_du)
        if extrema(determinants)[0] <= .001:
            raise RepairError("The label mapping folds or inverts; inspect the manual geometry.")


def coordinates(band, u, v):
    left = band["left"][0]*(1-v) + band["left"][1]*v
    right = band["right"][0]*(1-v) + band["right"][1]*v
    return left*(1-u) + right*u, quadratic(band["top"], u)*(1-v) + quadratic(band["bottom"], u)*v


def composite_label(source, base, source_band, target_band, feather_px=1.5):
    for image in (source, base):
        if image is None or image.dtype != np.uint8 or image.ndim != 3 or image.shape[2] != 3:
            raise RepairError("Use readable 8-bit RGB images; alpha/cutout handling is outside this helper.")
    if not isinstance(feather_px, (int, float)) or not math.isfinite(feather_px) or not 0 < feather_px <= 3:
        raise RepairError("feather_px must be above zero and at most three pixels.")
    validate_band(source_band, source.shape[1], source.shape[0])
    validate_band(target_band, base.shape[1], base.shape[0])
    band = target_band
    yy, xx = np.indices(base.shape[:2], dtype=np.float32)
    top_min = extrema(band["top"])[0]
    bottom_max = extrema(band["bottom"])[1]
    u = (xx-min(band["left"]))/(max(band["right"])-min(band["left"]))
    v = (yy-top_min)/(bottom_max-top_min)
    for _ in range(12):
        left = band["left"][0]*(1-v) + band["left"][1]*v
        right = band["right"][0]*(1-v) + band["right"][1]*v
        u = np.clip((xx-left)/np.maximum(right-left, 1), -.5, 1.5)
        top, bottom = quadratic(band["top"], u), quadratic(band["bottom"], u)
        v = np.clip((yy-top)/np.maximum(bottom-top, 1), -.5, 1.5)
    roi = (xx >= min(band["left"])) & (xx <= max(band["right"])) & (yy >= top_min) & (yy <= bottom_max)
    inside = roi & (u >= 0) & (u <= 1) & (v >= 0) & (v <= 1)
    if not np.any(inside):
        raise RepairError("The target band covers no pixels.")
    tx, ty = coordinates(band, u, v)
    error = float(np.max(np.maximum(np.abs(tx[inside]-xx[inside]), np.abs(ty[inside]-yy[inside]))))
    if error > .1:
        raise RepairError("The band inverse did not converge; inspect the manual geometry.")
    sx, sy = coordinates(source_band, u, v)
    source_width = sum(r-l for l, r in zip(source_band["left"], source_band["right"]))/2
    source_height = sum(b-t for b, t in zip(source_band["bottom"], source_band["top"]))/3
    width = sum(r-l for l, r in zip(band["left"], band["right"]))/2
    height = sum(b-t for b, t in zip(band["bottom"], band["top"]))/3
    scale = min(1, width/source_width, height/source_height)
    if min(source.shape[:2])*scale < 1:
        raise RepairError("Source dimensions are too thin for this label scale.")
    small = cv2.resize(source, None, fx=scale, fy=scale, interpolation=cv2.INTER_AREA)
    scale_x, scale_y = small.shape[1]/source.shape[1], small.shape[0]/source.shape[0]
    pixels = cv2.remap(small, ((sx+.5)*scale_x-.5).astype(np.float32),
                       ((sy+.5)*scale_y-.5).astype(np.float32), cv2.INTER_LANCZOS4,
                       borderMode=cv2.BORDER_CONSTANT)
    distance = np.minimum.reduce([u*width, (1-u)*width, v*height, (1-v)*height])
    alpha = np.where(inside, np.clip(distance/feather_px, 0, 1), 0).astype(np.float32)
    mask = np.round(alpha*255).astype(np.uint8)
    # Quantize before compositing, so the saved mask exactly defines every changed pixel.
    alpha = mask.astype(np.float32)/255
    result = np.round(pixels*alpha[:, :, None] + base*(1-alpha[:, :, None])).astype(np.uint8)
    if np.any(result[mask == 0] != base[mask == 0]):
        raise RepairError("Outside-mask preservation failed.")
    return result, mask, {"antialias_scale": [scale_x, scale_y], "inverse_error_px": error,
                          "pixels_touched": int(np.count_nonzero(mask)), "outside_mask_changed_channels": 0}


def run(manifest_path):
    path = Path(manifest_path).resolve()
    data = json.loads(path.read_text())
    if not isinstance(data, dict):
        raise RepairError("The repair manifest must be an object.")
    if data.get("source_rights_confirmed") is not True or data.get("compatible_pose_reviewed") is not True:
        raise RepairError("Confirm source rights and compatible pose by eye before using this manual repair.")
    def local(key):
        value = Path(data[key])
        return (path.parent/value).resolve() if not value.is_absolute() else value.resolve()
    source_path, base_path = local("source_image"), local("base_image")
    output, mask_path, evidence_path = local("output_image"), local("mask_image"), local("evidence_json")
    destinations = [output, mask_path, evidence_path]
    if len(set(destinations)) != 3 or any(p in (source_path, base_path, path) for p in destinations):
        raise RepairError("Output, mask and evidence need distinct new paths; never overwrite source/base/manifest.")
    if output.suffix.lower() != ".png" or mask_path.suffix.lower() != ".png":
        raise RepairError("Save output and mask as lossless PNG.")
    result, mask, details = composite_label(cv2.imread(str(source_path), cv2.IMREAD_UNCHANGED),
        cv2.imread(str(base_path), cv2.IMREAD_UNCHANGED), data["source_band"], data["target_band"],
        data.get("feather_px", 1.5))
    for destination in destinations:
        destination.parent.mkdir(parents=True, exist_ok=True)
    if not cv2.imwrite(str(output), result) or not cv2.imwrite(str(mask_path), mask):
        raise RepairError("Could not save the candidate or its mask.")
    digest = lambda p: hashlib.sha256(p.read_bytes()).hexdigest()
    evidence = dict(data, source_image=str(source_path), base_image=str(base_path), output_image=str(output),
                    mask_image=str(mask_path), source_sha256=digest(source_path), base_sha256=digest(base_path),
                    output_sha256=digest(output), mask_sha256=digest(mask_path), **details,
                    model_calls=0, credits=0, method="manual curved-band label pixel remap; AREA + Lanczos4")
    evidence_path.write_text(json.dumps(evidence, indent=2)+"\n")
    return evidence


if __name__ == "__main__":
    try:
        print(json.dumps(run(sys.argv[1]), indent=2))
    except (RepairError, KeyError, OSError, ValueError, IndexError) as error:
        sys.exit("repair_patch.py: " + str(error))

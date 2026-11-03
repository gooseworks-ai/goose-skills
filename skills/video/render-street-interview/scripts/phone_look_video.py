#!/usr/bin/env python3
"""Colour-match generated street footage to REAL reference footage. Free.

    python phone_look_video.py <in.mp4> <out.mp4> [--ref <real.mp4|.png>]

Generated video sits in the wrong part of the colour space: lighter and flatter than real phone
footage. This fits a per-channel linear map from a frame of OUR clip to a frame of a REAL
reference and applies it, so the grade is measured rather than guessed.

Deliberately does NOT sharpen or grain much, and that is a correction of an earlier mistake:
  * MEASURED, the raw generation already sits at 534 laplacian sharpness against 495 for the real
    reference. A 0.4 unsharp "phone ISP halo" pushed the finished cut to 695, so the finishing
    pass was itself adding an AI tell.
  * build_full.py grains PER SHOT with a varying amount, which is what real footage does. Graining
    here as well stacked two passes.

Keeps: a barely-there halo, a modest bitrate (a pristine encode is its own tell), and audio
normalised to -14 LUFS through a limiter.
"""
import argparse
import re
import subprocess
import tempfile
from pathlib import Path

import numpy as np
from PIL import Image

import paths

ap = paths.add_run_arg(argparse.ArgumentParser())
ap.add_argument("src", type=Path)
ap.add_argument("dst", type=Path)
# The colour reference is a REAL piece of footage in the run folder's refs/, not something next
# to the script: `parents[1]/refs/` resolved inside the skill directory, where nothing exists.
ap.add_argument("--ref", type=Path, default=None,
                help="real footage to fit the colour map from "
                     "(default <run>/refs/tools/arcads-1.mp4)")
ap.add_argument("--grain", type=float, default=0.0, help="0: build_full.py grains per shot")
ap.add_argument("--black-lift", type=float, default=0.030,
                help="lift crushed blacks into the real band; measured 0.030 -> 9.7, 0.040 -> 12.0. "
                     "MEASURED ON SEED 4806, which is not the shipped take: solve it per take with "
                     "fit_grade.py rather than inheriting this number")
# Added 2026-09-30. There was no saturation control at all, so the only way to move the finished
# render's colour was the fitted LUT, which also moves the black point and has already been
# measured swinging it from 16.1 to 26.6 depending on which reference it was handed. A scalar
# here changes saturation and nothing else, and fit_grade.py solves it by measuring the render.
ap.add_argument("--saturation", type=float, default=1.0,
                help="scalar on saturation, applied after the black lift and the LUT. 1.0 = "
                     "untouched. Solve it with fit_grade.py; do not guess it.")
ap.add_argument("--unsharp", type=float, default=0.12, help="ISP halo; 0.4 over-sharpened")
# DEFAULT 0, changed 2026-09-30 from 0.8. The fitted LUT swings the black point wildly depending
# on which reference it is handed, and both directions are wrong: matching seed 4804 to Klemens
# gave a 1st-percentile of 16.1, matching 4806 to Salary Transparent gave 26.6, against a real
# band of 7.0 to 10.3. The measured black lift alone lands at 9.0. Raise this only after checking
# the result with check-cut.py; a reference darker or brighter than the take will push it out.
ap.add_argument("--strength", type=float, default=0.0, help="0..1 blend toward the reference; see note above")
A = ap.parse_args()
if not 0 <= A.strength <= 1:
    ap.error("--strength must be between 0 and 1")
if A.ref is None:
    A.ref = paths.layout(A.run)["refs"] / "tools" / "arcads-1.mp4"
if A.strength > 0 and not A.ref.exists():
    raise SystemExit(
        f"no colour reference at {A.ref}. The grade is FITTED to real footage rather than "
        "guessed, so there is no sane fallback: put a real reference clip there (see "
        "references/REFERENCES.md) or pass --ref.")


def frame(path, t, out):
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-ss", str(t), "-i", str(path),
                    "-frames:v", "1", str(out)], check=True)
    return out


def stats(p):
    a = np.asarray(Image.open(p).convert("RGB"), dtype=np.float64) / 255
    f = a.reshape(-1, 3)
    return f.mean(0), f.std(0)


def duration(p):
    return float(subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration",
                                 "-of", "csv=p=0", str(p)], capture_output=True,
                                text=True).stdout.strip())


with tempfile.TemporaryDirectory() as td:
    td = Path(td)
    gain, off = np.ones(3), np.zeros(3)
    # At zero strength the reference contributes nothing. Fresh runs need no reference asset.
    if A.strength > 0:
        mo, so = stats(frame(A.src, duration(A.src) * 0.4, td / "a.png"))
        if A.ref.suffix.lower() in (".mp4", ".webm", ".mkv", ".mov"):
            rp = frame(A.ref, duration(A.ref) * 0.4, td / "b.png")
        else:
            rp = A.ref
        ma, sa = stats(rp)

        gain = np.clip(sa / np.maximum(so, 1e-6), 0.6, 1.6)
        off = ma - gain * mo
        gain = 1 + A.strength * (gain - 1)
        off = A.strength * off
    print("colour match gain", gain.round(3), "offset", off.round(3))

    lut = ":".join(f"{c}='clip(val*{gain[i]:.4f}+{off[i] * 255:.2f},0,255)'"
                   for i, c in enumerate("rgb"))
    # BLACK LIFT, measured 2026-09-30. The raw generation comes back with crushed blacks: seed
    # 4806 sat at a 1st-percentile of 3.1 where real reference footage sits at 7.0 to 10.3. A
    # 0.030 lift puts it at 9.7, the middle of that band; 0.040 overshoots to 12.0.
    # Applied BEFORE the fitted LUT so the colour match works off a sane black. The fitted LUT
    # alone is not enough and can go the wrong way: matching seed 4804 to the Klemens reference
    # pushed it to 16.1, washed out, because Klemens is darker than our footage. check-cut.py now
    # has a ceiling as well as a floor for exactly that.
    vf = f"curves=all=0/{A.black_lift:.3f} 0.5/0.5 1/0.98,lutrgb={lut}"
    if abs(A.saturation - 1.0) > 1e-3:
        vf += f",eq=saturation={A.saturation:.4f}"
    vf += ",scale=1080:1920:flags=lanczos"
    if A.unsharp > 0:
        vf += f",unsharp=5:5:{A.unsharp:.2f}:5:5:0.0"
    if A.grain > 0:
        vf += f",noise=c0s={A.grain:.0f}:c0f=t+u"
    vf += ",fps=30"

    subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", str(A.src), "-vf", vf,
                    "-c:v", "libx264", "-b:v", "3200k", "-maxrate", "3600k", "-bufsize", "6400k",
                    "-pix_fmt", "yuv420p", "-preset", "medium",
                    "-af", "alimiter=limit=0.9:level=false,loudnorm=I=-14:TP=-2.0:LRA=11",
                    "-c:a", "aac", "-b:a", "160k", str(A.dst)], check=True)

r = subprocess.run(["ffmpeg", "-hide_banner", "-nostats", "-i", str(A.dst),
                    "-af", "loudnorm=print_format=summary", "-f", "null", "-"],
                   capture_output=True, text=True)
out = r.stderr + r.stdout
g = lambda k: re.search(k + r":\s*([-+]?\d+\.?\d*)", out)
print("wrote", A.dst)
print("  integrated", g("Input Integrated").group(1) if g("Input Integrated") else "?", "LUFS",
      "| true peak", g("Input True Peak").group(1) if g("Input True Peak") else "?", "dBTP")

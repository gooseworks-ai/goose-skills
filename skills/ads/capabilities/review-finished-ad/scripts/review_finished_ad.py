#!/usr/bin/env python3
"""review-finished-ad: the finished-ad + brand-fidelity gate for a rendered video ad.

Runs the checks a machine can decide on a finished master, and builds one contact
sheet for the checks that need eyes (font, product likeness, safe zones):

  ratio        output is exactly the expected size (9:16 = 1080x1920)
  hook         sound starts within --hook-audio-s, and the opening is not a still frame
  pacing       no frozen stretch longer than --max-freeze-s (end card excluded)
  dead_air     no silence longer than --max-silence-s mid-video
  black_frames no black stretch longer than 0.3s
  logo_asset   the kit logo file is big enough to be a real logo (not a favicon)
  logo         the kit logo is found on the end card (multi-scale match, colour-blind)
  palette      the end card's main colours sit near the kit palette (warn only)

--format-profile silent-text is for a declared silent, text-led format (kinetic text). It
changes three checks and nothing else:
  hook         no audio track is needed. The first beat must arrive with motion (a still first
               frame held > 1.5s fails) and the opening may then hold no longer than a planned
               beat (max(1.5, --max-freeze-s)). Audible audio must start within --hook-audio-s
  dead_air     becomes an audio-integrity check: not applicable with no audio or an inaudible
               track (peak below -45 dB); an audible track must not drop out or stop before the
               picture ends (the CTA is a beat, not a silent end card)
  black_frames judges blank frames (black, or one flat colour with no readable text) instead of
               dark pixels: a blank beat between two text beats may last up to 1.0s, the opening
               and the ending keep the 0.3s bound, and all blank beats together stay under 25%
--max-freeze-s is capped at 10s (the longest text beat) in this profile. Every other check,
and every check in the default profile, is unchanged.

Exit codes: 0 PASS, 2 FAIL (a machine check failed), 3 ERROR (could not run).
Needs ffmpeg/ffprobe on PATH and Python packages numpy + pillow.
"""
from __future__ import annotations

import argparse
import json
import math
import os
import re
import shutil
import subprocess
import sys
import tempfile
from dataclasses import asdict, dataclass, field
from pathlib import Path

try:
    import numpy as np
    from PIL import Image, ImageDraw, ImageFont
except ImportError as exc:  # pragma: no cover - environment guard
    print(f"ERROR: {exc}. Install with: pip install --quiet numpy pillow", file=sys.stderr)
    sys.exit(3)

PASS, FAIL, WARN, NA = "pass", "fail", "warn", "not_applicable"

# Platform UI covers these bands on TikTok / Reels / Shorts at 1080x1920 (px).
SAFE_TOP, SAFE_BOTTOM, SAFE_RIGHT = 220, 400, 140

# Per match mode: (pass at or above, fail below). Measured 2026-09-30: the right logo scores
# 0.91-0.99 at any size and polarity; a different brand's wordmark 0.42-0.49; a different
# mascot photo on a similar background 0.52-0.62; a same-font near-copy lands ~0.8 (warn).
LOGO_THRESHOLDS = {"mark": (0.85, 0.75), "image": (0.85, 0.70)}
# Favicon guard: a logo file this small goes blurry when it is shown big. Judge by the
# long side AND the pixel area so a wide, short wordmark (400x120) is not called a favicon.
MIN_LOGO_LONG_SIDE = 256
MIN_LOGO_AREA = 40_000
PALETTE_WARN_DELTA_E = 25.0

# --format-profile silent-text. Fixed bounds, not flags, so the profile can never become a
# blanket skip. A "blank" frame is black or one flat colour with no text on it.
DEFAULT_PROFILE, SILENT_TEXT = "default", "silent-text"
FORMAT_PROFILES = (DEFAULT_PROFILE, SILENT_TEXT)
BLANK_INTERIOR_MAX_S = 1.0   # one intentional blank beat between two text beats
BLANK_EDGE_MAX_S = 0.3       # a blank opening or ending keeps the default black-frame bound
BLANK_MAX_SHARE = 0.25       # all blank beats together, as a share of the video
BLANK_FPS = 10               # blank-frame sampling rate
BLANK_WORK_WIDTH = 270       # frames are area-averaged to this width (light grain does not read as text)
BLANK_PIXEL_DELTA = 48       # a pixel this far (max RGB channel) from the dominant colour is content
BLANK_MIN_CONTENT_ROWS = 0.015  # a frame with text has content on >= 1.5% of its rows
SILENT_PEAK_DB = -45.0       # a track whose peak stays below this is inaudible (silencedetect's floor)
OPENING_ARRIVAL_S = 0.1      # a still run starting this early means the opening never moved
SILENT_TEXT_MAX_FREEZE_S = 10.0  # the longest text beat; --max-freeze-s may not exceed it here


@dataclass
class Check:
    status: str
    note: str = ""
    data: dict = field(default_factory=dict)


# ---------------------------------------------------------------- ffmpeg helpers

def run(cmd: list[str]) -> subprocess.CompletedProcess:
    return subprocess.run(cmd, capture_output=True, text=True)


def probe(video: str) -> dict:
    out = run([
        "ffprobe", "-v", "error", "-show_entries",
        "stream=codec_type,width,height:format=duration", "-of", "json", video,
    ])
    if out.returncode != 0:
        raise RuntimeError(f"ffprobe failed: {out.stderr.strip()[:300]}")
    info = json.loads(out.stdout)
    v = next((s for s in info.get("streams", []) if s.get("codec_type") == "video"), None)
    if not v:
        raise RuntimeError("no video stream")
    has_audio = any(s.get("codec_type") == "audio" for s in info.get("streams", []))
    return {
        "width": int(v["width"]),
        "height": int(v["height"]),
        "duration": float(info.get("format", {}).get("duration") or 0),
        "has_audio": has_audio,
    }


def analyse(video: str, has_audio: bool, silence_d: float, scene_threshold: float = 0.3) -> str:
    """ONE decode pass: freeze, black and scene-cut detection on a small copy of the
    picture, silence detection on the audio. Returns ffmpeg's log."""
    vf = (f"scale=270:-2,freezedetect=n=-60dB:d=1.0,blackdetect=d=0.2:pix_th=0.10,"
          f"select='gt(scene,{scene_threshold})',showinfo")
    cmd = ["ffmpeg", "-hide_banner", "-nostats", "-i", video, "-filter:v", vf]
    if has_audio:
        cmd += ["-filter:a", f"silencedetect=n=-45dB:d={silence_d:.2f}"]
    cmd += ["-f", "null", "-"]
    out = run(cmd)
    if out.returncode != 0:
        raise RuntimeError(f"ffmpeg could not decode the video: {out.stderr.strip()[-300:]}")
    return out.stderr


NUM = r"-?\d+(?:\.\d+)?(?:e-?\d+)?"


def load_image(path: str) -> Image.Image:
    """Open an image; an SVG (kits often have one) is rasterised to a 1024px-wide PNG first."""
    head = Path(path).read_bytes()[:512].lower()
    if path.lower().endswith(".svg") or b"<svg" in head:
        png = Path(tempfile.mkdtemp(prefix="rfa-svg-")) / "logo.png"
        try:
            import cairosvg  # type: ignore
            cairosvg.svg2png(url=path, write_to=str(png), output_width=1024)
        except Exception:  # not installed, or installed without its cairo library (OSError)
            if shutil.which("rsvg-convert"):
                run(["rsvg-convert", "-w", "1024", "-o", str(png), path])
        if not png.exists():
            raise RuntimeError(f"{path} is an SVG and no rasteriser is available: "
                               "pip install cairosvg (or install rsvg-convert), or pass a PNG of the logo")
        return Image.open(png)
    return Image.open(path)


def spans(log: str, key: str, duration: float) -> list[tuple[float, float]]:
    """Parse ffmpeg *detect start/end pairs (silence_, freeze_, black_)."""
    out: list[tuple[float, float]] = []
    start = None
    for line in log.splitlines():
        m = re.search(rf"{key}_start:\s*({NUM})", line)
        if m:
            start = float(m.group(1))
        m = re.search(rf"{key}_end:\s*({NUM})", line)
        if m and start is not None:
            out.append((start, float(m.group(1))))
            start = None
    if start is not None:
        out.append((start, duration))
    return out


def probe_audio(video: str) -> dict:
    """The first audio stream's peak level (dB, -inf for digital silence), where it starts
    relative to the picture (s) and its length (s). The length is the stream's own duration,
    or the decoded sample count when the container does not say (WebM/MKV), so an early stop
    is caught in any container; the start catches a track muxed with a delay."""
    info = run(["ffprobe", "-v", "error", "-show_entries",
                "stream=codec_type,start_time,duration,sample_rate,channels", "-of", "json", video])
    streams = json.loads(info.stdout).get("streams") or [] if info.returncode == 0 else []
    stream = next((x for x in streams if x.get("codec_type") == "audio"), {})
    picture = next((x for x in streams if x.get("codec_type") == "video"), {})

    def start_of(x: dict) -> float:
        try:
            return float(x["start_time"])
        except (KeyError, TypeError, ValueError):
            return 0.0
    out = run(["ffmpeg", "-hide_banner", "-nostats", "-i", video, "-map", "0:a:0",
               "-af", "volumedetect", "-f", "null", "-"])
    if out.returncode != 0:
        raise RuntimeError(f"ffmpeg could not decode the audio: {out.stderr.strip()[-300:]}")
    # volumedetect can report more than once (a probe pass first); the last report is the stream.
    peaks = re.findall(rf"max_volume:\s*(-?inf|{NUM}) dB", out.stderr)
    samples = re.findall(r"n_samples:\s*(\d+)", out.stderr)
    length = None
    try:
        length = float(stream["duration"])
    except (KeyError, TypeError, ValueError):
        try:
            length = int(samples[-1]) / (int(stream["sample_rate"]) * int(stream["channels"]))
        except (IndexError, KeyError, TypeError, ValueError, ZeroDivisionError):
            length = None
    peak_db = float("-inf") if not peaks or "inf" in peaks[-1] else float(peaks[-1])
    return {"peak_db": peak_db, "length": length,
            "start": max(0.0, start_of(stream) - start_of(picture)), "pts_start": start_of(stream)}


def content_share(rgb: np.ndarray) -> float:
    """Share of a frame's rows that hold content: pixels clearly off the frame's dominant colour.
    A text line covers several percent of the rows; a thin progress bar or codec noise does not."""
    q = rgb.astype(np.int32) >> 4
    keys = (q[..., 0] << 8) | (q[..., 1] << 4) | q[..., 2]
    dominant = int(np.bincount(keys.ravel(), minlength=4096).argmax())
    bg = rgb[keys == dominant].astype(np.float64).mean(axis=0)
    off = np.abs(rgb.astype(np.float64) - bg).max(axis=2) > BLANK_PIXEL_DELTA
    return float((off.sum(axis=1) >= 2).sum()) / rgb.shape[0]


def blank_spans(video: str, meta: dict, fps: int = BLANK_FPS) -> tuple[list[tuple[float, float]], int]:
    """Blank stretches (black, or one flat colour with no text), as (start, end) seconds, and
    the number of frames sampled. One extra decode, only for the silent-text profile."""
    w = BLANK_WORK_WIDTH
    h = max(2, int(round(w * meta["height"] / meta["width"] / 2)) * 2)
    size = w * h * 3
    blank: list[bool] = []
    # Frames are read as they decode (a long video never sits in memory); stderr goes to a
    # file so a chatty decoder cannot fill a pipe and stall the read.
    with tempfile.TemporaryFile() as log:
        proc = subprocess.Popen(
            ["ffmpeg", "-hide_banner", "-loglevel", "error", "-i", video, "-an",
             "-vf", f"fps={fps},scale={w}:{h}:flags=area,format=rgb24", "-f", "rawvideo", "-"],
            stdout=subprocess.PIPE, stderr=log)
        assert proc.stdout is not None
        while True:
            buf = proc.stdout.read(size)
            if len(buf) < size:
                break
            frame = np.frombuffer(buf, dtype=np.uint8).reshape(h, w, 3)
            blank.append(content_share(frame) < BLANK_MIN_CONTENT_ROWS)
        proc.stdout.close()
        code = proc.wait()
        log.seek(0)
        err = log.read().decode(errors="replace")
    if code != 0 or not blank:
        raise RuntimeError(f"ffmpeg could not sample frames for the blank check: {err.strip()[-300:]}")
    out: list[tuple[float, float]] = []
    start = None
    for i, b in enumerate(blank + [False]):
        if b and start is None:
            start = i
        elif not b and start is not None:
            out.append((start / fps, i / fps))
            start = None
    return out, len(blank)


def grab(video: str, t: float, dest: Path) -> Path:
    """One frame at t. The container can run longer than the picture (an audio tail past the
    last frame), so a grab near the end steps back until a frame exists."""
    for back in (0.0, 0.3, 0.8, 1.5, 3.0):
        run(["ffmpeg", "-hide_banner", "-loglevel", "error", "-y", "-ss", f"{max(t - back, 0):.3f}",
             "-i", video, "-frames:v", "1", str(dest)])
        if dest.exists():
            return dest
    raise RuntimeError(f"could not grab a frame at {t:.2f}s")


# ---------------------------------------------------------------- image helpers

def gray(img: Image.Image) -> np.ndarray:
    return np.asarray(img.convert("L"), dtype=np.float64)


def flatten(img: Image.Image, bg: tuple[int, int, int]) -> Image.Image:
    img = img.convert("RGBA")
    base = Image.new("RGBA", img.size, bg + (255,))
    base.alpha_composite(img)
    return base.convert("RGB")


def trim_to_content(img: Image.Image) -> Image.Image:
    """Crop transparent (or flat) padding around a logo so it matches tightly."""
    rgba = img.convert("RGBA")
    alpha = np.asarray(rgba)[:, :, 3]
    if alpha.min() < 250:
        ys, xs = np.nonzero(alpha > 16)
    else:
        g = gray(rgba)
        corner = np.median([g[0, 0], g[0, -1], g[-1, 0], g[-1, -1]])
        ys, xs = np.nonzero(np.abs(g - corner) > 12)
    if len(xs) == 0:
        return rgba
    return rgba.crop((int(xs.min()), int(ys.min()), int(xs.max()) + 1, int(ys.max()) + 1))


def fast_len(n: int) -> int:
    """Smallest 2^a*3^b*5^c >= n: pocketfft is slow on sizes with large prime factors."""
    while True:
        m = n
        for p in (2, 3, 5):
            while m % p == 0:
                m //= p
        if m == 1:
            return n
        n += 1


class Matcher:
    """Normalised cross-correlation of many templates over ONE image. The image's FFT
    and running sums are computed once, so a multi-scale search stays fast."""

    def __init__(self, image: np.ndarray, max_th: int, max_tw: int):
        self.image = image
        ih, iw = image.shape
        self.shape = (fast_len(ih + max_th), fast_len(iw + max_tw))
        self.fft = np.fft.rfft2(image, self.shape)
        self.ii = np.pad(image, ((1, 0), (1, 0))).cumsum(0).cumsum(1)
        self.ii2 = np.pad(image ** 2, ((1, 0), (1, 0))).cumsum(0).cumsum(1)

    def ncc(self, tpl: np.ndarray) -> np.ndarray:
        ih, iw = self.image.shape
        th, tw = tpl.shape
        if th > ih or tw > iw or th < 4 or tw < 4:
            return np.zeros((1, 1))
        t0 = tpl - tpl.mean()
        tnorm = math.sqrt(float((t0 ** 2).sum()))
        if tnorm < 1e-6:
            return np.zeros((1, 1))
        corr = np.fft.irfft2(self.fft * np.fft.rfft2(t0[::-1, ::-1], self.shape), self.shape)
        corr = corr[th - 1:ih, tw - 1:iw]
        n = th * tw

        def window(s: np.ndarray) -> np.ndarray:
            return s[th:, tw:] - s[:-th, tw:] - s[th:, :-tw] + s[:-th, :-tw]

        s1, s2 = window(self.ii), window(self.ii2)
        denom = np.sqrt(np.maximum(s2 - s1 ** 2 / n, 0)) * tnorm
        with np.errstate(divide="ignore", invalid="ignore"):
            return np.where(denom > 1e-6 * tnorm, corr / denom, 0.0)


def has_transparency(img: Image.Image) -> bool:
    return img.mode in ("RGBA", "LA", "P") and np.asarray(img.convert("RGBA"))[:, :, 3].min() < 250


def _search(f: np.ndarray, tpl_gray: np.ndarray, aspect: float, work_width: int,
            keep: int = 2, min_width: int = 40, polarity_free: bool = False):
    """Placements of the template over f (work-width pixels), best first, as (score, box).
    Grayscale normalised correlation; with polarity_free the score is |ncc|, so a white
    version of a dark mark (or the reverse) still counts. A coarse pass over 16 sizes,
    then a fine pass (+-15% in 2% steps, aspect +-3%) around the `keep` best sizes: a thin
    wordmark's score collapses when the size is off by the ~10% a coarse step leaves."""
    coarse = [int(w) for w in np.unique(np.geomspace(min_width, work_width * 0.9, 16).astype(int))]
    max_w = int(max(coarse) * 1.2) + 1
    matcher = Matcher(f, max(4, round(max_w * aspect * 1.05)) + 1, max_w)
    tpl_img = Image.fromarray(tpl_gray.astype(np.uint8))

    def score_at(width: int, asp: float):
        height = max(4, round(width * asp))
        if width < 4 or height >= f.shape[0] or width >= f.shape[1]:
            return None
        tpl = np.asarray(tpl_img.resize((width, height), Image.BILINEAR), dtype=np.float64)
        m = matcher.ncc(tpl)
        if polarity_free:
            m = np.abs(m)
        y, x = np.unravel_index(int(np.argmax(m)), m.shape)
        return float(m[y, x]), (int(x), int(y), width, height)

    found = [c for c in (score_at(w, aspect) for w in coarse) if c]
    found.sort(key=lambda c: -c[0])
    fine = []
    for _, box in found[:keep]:
        for k in np.arange(0.85, 1.151, 0.02):
            for a in (aspect * 0.97, aspect, aspect * 1.03):
                c = score_at(int(round(box[2] * k)), a)
                if c:
                    fine.append(c)
    return sorted(found + fine, key=lambda c: -c[0])


def find_logo(frame: Image.Image, logo: Image.Image, work_width: int = 540) -> dict:
    """Find the kit logo in a frame by grayscale normalised correlation. `score` is 0-1.

    - An OPAQUE logo file (a JPEG, a mascot photo, a square app icon) is composited as the
      whole image, so the whole image is matched as-is.
    - A TRANSPARENT mark (PNG/SVG) is trimmed to its content, laid on white and matched
      polarity-free (|ncc|), so the same mark in white on a dark card still counts.
    Correlation, not edges or silhouettes: thin wordmark strokes from two resamplings rarely
    land on the same pixels, which made edge/silhouette scores swing with the logo's size.
    """
    scale = work_width / frame.width
    f = gray(frame.resize((work_width, max(1, round(frame.height * scale))), Image.BILINEAR))
    opaque = not has_transparency(logo)
    src = logo.convert("RGB") if opaque else flatten(trim_to_content(logo), (255, 255, 255))
    found = _search(f, gray(src), src.height / src.width, work_width, polarity_free=not opaque)
    mode = "image" if opaque else "mark"
    if not found:
        return {"score": 0.0, "mode": mode, "bbox": None}
    score, (x, y, w, h) = found[0]
    return {"score": round(max(score, 0.0), 3), "mode": mode,
            "bbox": [round(x / scale), round(y / scale), round(w / scale), round(h / scale)]}


def hex_to_rgb(h: str) -> tuple[int, int, int]:
    h = h.strip().lstrip("#")
    if len(h) == 3:
        h = "".join(c * 2 for c in h)
    return tuple(int(h[i:i + 2], 16) for i in (0, 2, 4))  # type: ignore[return-value]


def rgb_to_lab(rgb: tuple[int, int, int]) -> tuple[float, float, float]:
    def lin(c: float) -> float:
        c /= 255
        return c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4

    r, g, b = (lin(c) for c in rgb)
    x = (r * 0.4124 + g * 0.3576 + b * 0.1805) / 0.95047
    y = r * 0.2126 + g * 0.7152 + b * 0.0722
    z = (r * 0.0193 + g * 0.1192 + b * 0.9505) / 1.08883

    def f(t: float) -> float:
        return t ** (1 / 3) if t > 0.008856 else 7.787 * t + 16 / 116

    fx, fy, fz = f(x), f(y), f(z)
    return 116 * fy - 16, 500 * (fx - fy), 200 * (fy - fz)


def delta_e(a: tuple[int, int, int], b: tuple[int, int, int]) -> float:
    la, lb = rgb_to_lab(a), rgb_to_lab(b)
    return math.dist(la, lb)


def dominant_colours(img: Image.Image, k: int = 5) -> list[tuple[tuple[int, int, int], float]]:
    small = img.convert("RGB").resize((160, 284))
    q = small.quantize(colors=k, method=Image.Quantize.MEDIANCUT)
    pal = q.getpalette()[: k * 3]
    counts = sorted(q.getcolors(), reverse=True)
    total = sum(c for c, _ in counts)
    return [((pal[i * 3], pal[i * 3 + 1], pal[i * 3 + 2]), c / total) for c, i in counts]


# ---------------------------------------------------------------- checks

def check_ratio(meta: dict, expect: tuple[int, int]) -> Check:
    w, h = meta["width"], meta["height"]
    if (w, h) == expect:
        return Check(PASS, f"{w}x{h}")
    return Check(FAIL, f"{w}x{h}, expected {expect[0]}x{expect[1]}: scale and pad every clip before the concat")


def check_hook(meta: dict, silences, freezes, hook_audio_s: float) -> Check:
    problems = []
    lead = max((e for s, e in silences if s <= 0.3), default=0.0)
    if meta["has_audio"] and lead > hook_audio_s:
        problems.append(f"no sound for the first {lead:.1f}s")
    if not meta["has_audio"]:
        problems.append("no audio track")
    still = next((e - s for s, e in freezes if s <= 0.3), 0.0)
    if still > 1.5:
        problems.append(f"opening frame is still for {still:.1f}s")
    if problems:
        return Check(FAIL, "; ".join(problems) + ": the first 2s must move and speak", {"lead_silence_s": lead})
    return Check(PASS, f"sound at {lead:.1f}s, opening moves", {"lead_silence_s": lead})


def check_pacing(meta: dict, freezes, cuts, max_freeze_s: float, endcard_s: float) -> Check:
    body_end = meta["duration"] - endcard_s
    if body_end < 1.0:
        return Check(WARN, f"video is {meta['duration']:.1f}s, too short to judge pacing before a {endcard_s:.1f}s end card")
    long_freezes = [(s, e) for s, e in freezes if s < body_end and (min(e, body_end) - s) > max_freeze_s]
    shots = [b - a for a, b in zip([0.0] + cuts, cuts + [meta["duration"]])]
    data = {"cuts": len(cuts), "longest_shot_s": round(max(shots), 2) if shots else None,
            "frozen_spans": [[round(s, 2), round(e, 2)] for s, e in long_freezes]}
    if long_freezes:
        s, e = long_freezes[0]
        return Check(FAIL, f"picture frozen {s:.1f}-{e:.1f}s ({e - s:.1f}s): add motion or cut it", data)
    return Check(PASS, f"{len(cuts)} cuts, longest shot {data['longest_shot_s']}s", data)


def check_dead_air(meta: dict, silences, max_silence_s: float, endcard_s: float) -> Check:
    if not meta["has_audio"]:
        return Check(FAIL, "no audio track")
    # A silent end card is normal (most recipes append one), so silence that starts inside
    # the end-card window is not dead air. Anything that starts earlier is.
    body_end = meta["duration"] - endcard_s
    gaps = [(s, e) for s, e in silences if s > 0.3 and s < body_end and (min(e, body_end) - s) > max_silence_s]
    if gaps:
        s, e = gaps[0]
        return Check(FAIL, f"silence {s:.1f}-{e:.1f}s: tighten the VO or extend the music bed",
                     {"gaps": [[round(a, 2), round(b, 2)] for a, b in gaps]})
    return Check(PASS, "no dead air")


def check_black(blacks) -> Check:
    bad = [(s, e) for s, e in blacks if e - s > 0.3]
    if bad:
        s, e = bad[0]
        return Check(FAIL, f"black frames {s:.1f}-{e:.1f}s")
    return Check(PASS, "no black frames")


def audio_state(meta: dict, audio: dict | None) -> str:
    """none (no audio stream), silent (inaudible throughout: peak below -45 dB) or audible."""
    if not meta["has_audio"] or audio is None:
        return "none"
    return "silent" if audio["peak_db"] < SILENT_PEAK_DB else "audible"


def check_hook_silent_text(silences, freezes, hook_audio_s: float, audio: str, max_freeze_s: float,
                           track: dict | None = None) -> Check:
    """A text-led opening is the first beat ARRIVING (punch, rise, typewriter), then a reading
    hold. It fails when nothing arrives (the picture is still from the first frames for > 1.5s)
    or when the opening then holds longer than a planned beat (max(1.5, --max-freeze-s)),
    measured over the whole still run, end card included."""
    problems = []
    # Silence timestamps are the audio stream's own; a track muxed with a delay starts late too.
    track_start, pts0 = (track or {}).get("start", 0.0), (track or {}).get("pts_start", 0.0)
    lead = track_start + max((e - pts0 for s, e in silences if s - pts0 <= 0.3), default=0.0)
    if audio == "audible" and lead > hook_audio_s:
        problems.append(f"no sound for the first {lead:.1f}s of the audio track")
    first = next(((s, e) for s, e in freezes if s <= 0.3), None)
    hold_limit = max(1.5, max_freeze_s)
    if first and first[0] < OPENING_ARRIVAL_S and first[1] - first[0] > 1.5:
        problems.append(f"opening frame is still for {first[1] - first[0]:.1f}s (nothing arrives)")
    elif first and first[1] - first[0] > hold_limit:
        problems.append(f"the opening holds still for {first[1] - first[0]:.1f}s, longer than a planned beat "
                        f"({hold_limit:.1f}s; set --max-freeze-s to the longest beat)")
    data = {"lead_silence_s": lead, "audio": audio}
    if problems:
        return Check(FAIL, "; ".join(problems) + ": the opening must move, and any audio must start with it", data)
    if audio == "audible":
        return Check(PASS, f"silent-text: sound at {lead:.1f}s, opening moves", data)
    return Check(PASS, "silent-text: no audio needed, opening moves", data)


def check_audio_silent_text(meta: dict, silences, audio: str, track: dict | None,
                            max_silence_s: float) -> Check:
    """Silent-text formats need no audio, so there is no speech to judge. An audible track
    (a supplied or approved music bed) must still play through to the end of the picture: the
    CTA is a beat, not a silent end card, so --endcard-s does not excuse a drop-out here."""
    if audio == "none":
        return Check(NA, "silent-text: no audio track, none needed", {"audio": "none"})
    if audio == "silent":
        return Check(NA, "silent-text: the audio track is inaudible throughout, the same as no audio",
                     {"audio": "silent"})
    body_end = meta["duration"]
    track = track or {}
    shift = track.get("start", 0.0) - track.get("pts_start", 0.0)  # audio pts -> picture time
    timeline = [(s + shift, e + shift) for s, e in silences]
    # The opening silence belongs to `hook`; any silence that starts after sound is a drop-out.
    gaps = [(s, e) for s, e in timeline
            if s > track.get("start", 0.0) + 0.05 and s < body_end and (min(e, body_end) - s) > max_silence_s]
    end = track["start"] + track["length"] if track.get("length") is not None else None
    data = {"audio": "audible", "gaps": [[round(a, 2), round(b, 2)] for a, b in gaps],
            "audio_start_s": round(track.get("start", 0.0), 2),
            "audio_end_s": round(end, 2) if end is not None else None}
    problems = []
    if gaps:
        s, e = gaps[0]
        problems.append(f"the audio drops out {s:.1f}-{min(e, body_end):.1f}s")
    if end is not None and end < body_end - max_silence_s:
        problems.append(f"the audio stops at {end:.1f}s, {body_end - end:.1f}s before the picture ends")
    if problems:
        return Check(FAIL, "; ".join(problems) + ": the audio track is broken. Fix the mix, or leave the "
                           "ad silent if no audio was asked for", data)
    return Check(PASS, "silent-text: the audio track plays through", data)


def check_blank_silent_text(blanks, n_samples: int, blacks, fps: int = BLANK_FPS) -> Check:
    """Short blank beats between text beats are allowed; a blank opening or ending, a long
    blank beat, too much blank time or a blank video is not."""
    problems = []
    for s, e in blanks:
        first, last = round(s * fps) == 0, round(e * fps) >= n_samples
        limit = BLANK_EDGE_MAX_S if (first or last) else BLANK_INTERIOR_MAX_S
        where = "at the opening" if first else ("at the ending" if last else "between text beats")
        if e - s > limit + 1e-6:
            problems.append(f"blank {s:.1f}-{e:.1f}s ({e - s:.1f}s {where}, limit {limit:.1f}s)")
    total = sum(e - s for s, e in blanks)
    picture = n_samples / fps  # the sampled picture; the container can run longer (audio tail)
    data = {"blank_spans": [[round(s, 2), round(e, 2)] for s, e in blanks],
            "blank_total_s": round(total, 2),
            "dark_spans": [[round(s, 2), round(e, 2)] for s, e in blacks],
            "limits": {"between_beats_s": BLANK_INTERIOR_MAX_S, "opening_or_ending_s": BLANK_EDGE_MAX_S,
                       "share": BLANK_MAX_SHARE}}
    if n_samples and round(total * fps) >= n_samples:
        return Check(FAIL, "the whole video is blank (black or one flat colour, no readable text)", data)
    if picture > 0 and total > BLANK_MAX_SHARE * picture:
        problems.append(f"blank for {total:.1f}s of {picture:.1f}s (limit {BLANK_MAX_SHARE:.0%})")
    if problems:
        return Check(FAIL, "; ".join(problems) + ": missing or unreadably faint text, or a dead stretch; "
                           "shorten the blank beat or put the text back", data)
    if blanks:
        return Check(PASS, f"silent-text: {len(blanks)} short blank beat(s), {total:.1f}s in all", data)
    return Check(PASS, "silent-text: no blank frames", data)


def check_logo_asset(logo: Image.Image | None) -> Check:
    if logo is None:
        return Check(NA, "no logo given")
    # An opaque logo (a JPEG mascot, an app icon) is used as the whole image; only a
    # transparent mark has padding to trim before judging its real size.
    trimmed = trim_to_content(logo) if has_transparency(logo) else logo
    if max(trimmed.size) < MIN_LOGO_LONG_SIDE or trimmed.width * trimmed.height < MIN_LOGO_AREA:
        return Check(FAIL, f"logo file is {trimmed.width}x{trimmed.height}: favicon-grade, it will be blurry. "
                           "Ask the user for a real logo, or set the wordmark as text in the brand font",
                     {"size": list(trimmed.size)})
    return Check(PASS, f"logo {trimmed.width}x{trimmed.height}", {"size": list(trimmed.size)})


def check_logo(frames: list[tuple[float, Image.Image]], logo: Image.Image | None) -> Check:
    if logo is None:
        return Check(NA, "no logo given")
    best = {"score": 0.0}
    for t, img in frames:
        m = find_logo(img, logo)
        if m["score"] > best["score"]:
            best = {**m, "t": round(t, 2)}
    s = best["score"]
    LOGO_PASS, LOGO_FAIL = LOGO_THRESHOLDS[best.get("mode", "mark")]
    if s >= LOGO_PASS:
        return Check(PASS, f"logo found at {best['t']}s (match {s:.2f})", best)
    if s < LOGO_FAIL:
        return Check(FAIL, f"kit logo not found on the end card (best match {s:.2f}): "
                           "composite the uploaded logo file, never a generated one", best)
    return Check(WARN, f"weak logo match {s:.2f}: check the sheet for a warped, cropped or redrawn logo", best)


def check_palette(frames: list[tuple[float, Image.Image]], palette: list[str]) -> Check:
    if not palette:
        return Check(NA, "no palette given")
    kit = []
    for h in palette:
        try:
            kit.append(hex_to_rgb(h))
        except ValueError:
            continue
    if not kit:
        return Check(NA, "no readable hex colours in --palette")
    img = frames[-1][1]
    dom = [c for c in dominant_colours(img) if c[1] >= 0.05][:4]
    dists = [min(delta_e(c, k) for k in kit) for c, _ in dom]
    nearest = min(dists) if dists else 999.0
    data = {"end_card_colours": ["#%02x%02x%02x" % c for c, _ in dom], "nearest_delta_e": round(nearest, 1)}
    if nearest <= PALETTE_WARN_DELTA_E:
        return Check(PASS, f"end card uses a kit colour (dE {nearest:.0f})", data)
    return Check(WARN, f"no kit colour on the end card (nearest dE {nearest:.0f}): check the sheet", data)


# ---------------------------------------------------------------- contact sheet

def safe_zone_overlay(img: Image.Image) -> Image.Image:
    img = img.convert("RGB").copy()
    w, h = img.size
    sx, sy = w / 1080, h / 1920
    over = Image.new("RGBA", img.size, (0, 0, 0, 0))
    d = ImageDraw.Draw(over)
    red = (255, 40, 40, 70)
    d.rectangle([0, 0, w, SAFE_TOP * sy], fill=red)
    d.rectangle([0, h - SAFE_BOTTOM * sy, w, h], fill=red)
    d.rectangle([w - SAFE_RIGHT * sx, 0, w, h], fill=red)
    return Image.alpha_composite(img.convert("RGBA"), over).convert("RGB")


def font_specimen(font_path: str | None, text: str) -> Image.Image | None:
    if not font_path:
        return None
    try:
        font = ImageFont.truetype(font_path, 64)
    except OSError:
        return None
    img = Image.new("RGB", (540, 200), "white")
    ImageDraw.Draw(img).text((20, 60), text or "Aa Bb 123", font=font, fill="black")
    return img


def build_sheet(frames: list[tuple[float, Image.Image]], refs: list[tuple[str, Image.Image]], dest: Path) -> None:
    tw, th = 216, 384
    cols = min(6, max(1, len(frames)))
    rows = math.ceil(len(frames) / cols)
    ref_h = 200 if refs else 0
    sheet = Image.new("RGB", (cols * tw, rows * (th + 22) + ref_h + (22 if refs else 0)), "white")
    d = ImageDraw.Draw(sheet)
    for i, (t, img) in enumerate(frames):
        x, y = (i % cols) * tw, (i // cols) * (th + 22)
        sheet.paste(safe_zone_overlay(img).resize((tw, th)), (x, y + 22))
        d.text((x + 4, y + 4), f"{t:.1f}s", fill="black")
    y0 = rows * (th + 22)
    if refs:
        d.text((4, y0 + 4), "REFERENCE (logo / product / font)", fill="black")
        x = 0
        for label, img in refs:
            im = img.convert("RGB")
            im.thumbnail((tw * 2 - 8, ref_h - 8))
            sheet.paste(im, (x + 4, y0 + 22 + 4))
            x += im.width + 12
            if x > sheet.width - 40:
                break
    sheet.save(dest)


# ---------------------------------------------------------------- main

def sample_times(duration: float, cuts: list[float], endcard_s: float, cap: int = 17) -> list[float]:
    """Cover the body throughout time, then add shot samples within the existing cap."""
    body = max(0.0, duration - min(max(0.0, endcard_s), duration))
    if body <= 0.05 or cap <= 0:
        return []
    edge = min(0.1, body / 4)
    count = min(cap, max(1, min(6, int(body / 0.25))))
    required = [round(edge + (body - 2 * edge) * i / max(1, count - 1), 3)
                for i in range(count)]
    bounds = [0.0] + sorted({c for c in cuts if 0 < c < body}) + [body]
    shots = [(a + b) / 2 for a, b in zip(bounds, bounds[1:]) if b - a > 0.2]
    candidates = [t for t in shots if all(abs(t - s) >= 0.15 for s in required)]
    remaining = cap - len(required)
    if len(candidates) > remaining:
        candidates = [candidates[round(i * (len(candidates) - 1) / max(1, remaining - 1))]
                      for i in range(remaining)]
    return sorted(set(required + candidates))


def review(args: argparse.Namespace) -> dict:
    meta = probe(args.video)
    dur = meta["duration"]
    expect = tuple(int(v) for v in args.expect_size.lower().split("x"))
    log = analyse(args.video, meta["has_audio"], args.max_silence_s / 2)
    silences = spans(log, "silence", dur)
    freezes = spans(log, "freeze", dur)
    blacks = spans(log, "black", dur)
    cuts = [float(m) for m in re.findall(rf"pts_time:({NUM})", log)]

    logo = load_image(args.logo) if args.logo else None
    tmp = Path(tempfile.mkdtemp(prefix="rfa-"))
    # Time coverage prevents a continuous chat from producing only one body frame.
    shot_times = sample_times(dur, cuts, args.endcard_s)
    end_times = [max(0.0, dur - s) for s in (1.6, 0.9, 0.3)]
    frames = [(t, Image.open(grab(args.video, t, tmp / f"f{i:02d}.png")).convert("RGB"))
              for i, t in enumerate(shot_times)]
    end_frames = [(t, Image.open(grab(args.video, t, tmp / f"e{i}.png")).convert("RGB"))
                  for i, t in enumerate(end_times)]
    extra = [(t, Image.open(grab(args.video, t, tmp / f"x{i}.png")).convert("RGB"))
             for i, t in enumerate(args.logo_at or [])]

    checks = {
        "ratio": check_ratio(meta, expect),  # type: ignore[arg-type]
        "hook": check_hook(meta, silences, freezes, args.hook_audio_s),
        "pacing": check_pacing(meta, freezes, cuts, args.max_freeze_s, args.endcard_s),
        "dead_air": check_dead_air(meta, silences, args.max_silence_s, args.endcard_s),
        "black_frames": check_black(blacks),
        "logo_asset": check_logo_asset(logo),
        "logo": check_logo(end_frames + extra, logo),
        "palette": check_palette(end_frames, [p for p in (args.palette or "").split(",") if p.strip()]),
    }
    silent_text = args.format_profile == SILENT_TEXT
    if silent_text:
        # Declared silent, text-led format: replaces three checks in place (same keys, same
        # order). --no-speech is implied and does not switch off the audio-integrity check.
        track = probe_audio(args.video) if meta["has_audio"] else None
        audio = audio_state(meta, track)
        blanks, n_samples = blank_spans(args.video, meta)
        checks["hook"] = check_hook_silent_text(silences, freezes, args.hook_audio_s, audio, args.max_freeze_s,
                                                track)
        checks["dead_air"] = check_audio_silent_text(meta, silences, audio, track, args.max_silence_s)
        checks["black_frames"] = check_blank_silent_text(blanks, n_samples, blacks)
    elif args.speech is False:
        checks["dead_air"] = Check(NA, "--no-speech: music-only format")

    refs: list[tuple[str, Image.Image]] = []
    if logo is not None:
        refs.append(("logo", flatten(trim_to_content(logo), (255, 255, 255))))
    for p in (args.product_images or "").split(","):
        if p.strip() and Path(p.strip()).exists():
            try:
                refs.append(("product", Image.open(p.strip())))
            except OSError:
                continue
    spec = font_specimen(args.font, args.brand_name or "")
    if spec is not None:
        refs.append(("font", spec))
    sheet = Path(args.sheet)
    sheet.parent.mkdir(parents=True, exist_ok=True)
    build_sheet(frames + end_frames[-1:], refs, sheet)

    shutil.rmtree(tmp, ignore_errors=True)
    failed = [k for k, c in checks.items() if c.status == FAIL]
    return {
        "verdict": "FAIL" if failed else "PASS",
        "failed": failed,
        "format_profile": args.format_profile,
        "video": {**meta, "cuts": [round(c, 2) for c in cuts],
                  "sheet_samples": shot_times + end_times[-1:]},
        "checks": {k: asdict(c) for k, c in checks.items()},
        "sheet": str(sheet),
        "judge_on_sheet": [
            "safe_zones: no caption, CTA, price, logo or product name inside the red bands",
            "font: on-screen text uses the font in the reference specimen",
            "product_likeness: every product shot matches the reference product images (shape, label, colour)",
            "product_consistency: the product looks the same in every scene",
            "logo_unaltered: the logo is not warped, recoloured, cropped or redrawn "
            "(with no --logo, e.g. a text wordmark: the brand name is set in the brand font)",
        ] + ([
            "text_beats: every text beat is complete, spelled as approved, held long enough to read "
            "and not cut off at the edges; any blank beat is intentional",
        ] if silent_text else []) + ([
            "audio: the audible track is the user's supplied or approved one (silent-text formats are silent by default)",
        ] if silent_text and checks["dead_air"].data.get("audio") == "audible" else []),
    }


def main(argv: list[str] | None = None) -> int:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--video", required=True)
    ap.add_argument("--json", required=True, help="verdict JSON path")
    ap.add_argument("--sheet", default="working/review/finished-ad-sheet.png")
    ap.add_argument("--logo", help="the kit logo FILE the ad must show")
    ap.add_argument("--logo-at", type=float, action="append", help="extra timestamp(s) where the logo appears")
    ap.add_argument("--palette", help="comma-separated kit hex colours")
    ap.add_argument("--product-images", help="comma-separated product image files")
    ap.add_argument("--font", help="the brand font file (.ttf/.otf), for the specimen")
    ap.add_argument("--brand-name", help="text for the font specimen")
    ap.add_argument("--expect-size", default="1080x1920")
    ap.add_argument("--hook-audio-s", type=float, default=1.0)
    ap.add_argument("--max-freeze-s", type=float, default=2.5)
    ap.add_argument("--max-silence-s", type=float, default=1.0)
    ap.add_argument("--endcard-s", type=float, default=3.0)
    ap.add_argument("--no-speech", dest="speech", action="store_false",
                    help="format has no VO/dialogue (skip the dead-air check)")
    ap.add_argument("--format-profile", choices=FORMAT_PROFILES, default=DEFAULT_PROFILE,
                    help="silent-text: a declared silent, text-led format (kinetic text). No audio "
                         "track needed, an audible track must play through, and short blank beats "
                         "between text beats are allowed within fixed bounds. Default: every check as-is")
    args = ap.parse_args(argv)

    if not Path(args.video).exists():
        print(f"ERROR: video not found: {args.video}", file=sys.stderr)
        return 3
    if args.format_profile == SILENT_TEXT and args.max_freeze_s > SILENT_TEXT_MAX_FREEZE_S:
        print(f"ERROR: --max-freeze-s {args.max_freeze_s:g} is longer than a text beat can hold "
              f"({SILENT_TEXT_MAX_FREEZE_S:g}s) in the silent-text profile", file=sys.stderr)
        return 3
    try:
        result = review(args)
    except Exception as exc:  # noqa: BLE001 - surface any environment failure as ERROR
        print(f"ERROR: {exc}", file=sys.stderr)
        return 3
    Path(args.json).parent.mkdir(parents=True, exist_ok=True)
    Path(args.json).write_text(json.dumps(result, indent=2))
    profile = "" if result["format_profile"] == DEFAULT_PROFILE else f"  profile={result['format_profile']}"
    print(f"{result['verdict']}  failed={result['failed']}  sheet={result['sheet']}{profile}")
    for k, c in result["checks"].items():
        print(f"  {k:13s} {c['status']:15s} {c['note']}")
    return 2 if result["failed"] else 0


if __name__ == "__main__":
    sys.exit(main())

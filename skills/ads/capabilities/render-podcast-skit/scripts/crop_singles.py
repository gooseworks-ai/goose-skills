#!/usr/bin/env python3
"""Crop one single per host out of the two-shot plate. Free, no generation.

    crop_singles.py --config config.json --run-dir <run> [--preset ...]

WHY THIS EXISTS
The plate is the only thing that makes the set hold: a still generated per host
puts the two hosts in two different rooms, every time. Something then has to
turn one wide plate into the per-host singles the lipsync step needs, and on
the first two renders that something was a person typing ffmpeg coordinates.

WHY THE CROP IS DECLARED, NOT DETECTED
Finding the two heads automatically was tried and does not work here. Three
signals were measured against the real head centres on the demo plate
(0.138 and 0.914):

    high-frequency centre of mass   0.249 / 0.754
    smoothed high-frequency peak    0.249 / 0.727
    skin-tone column peak           0.359 / 0.961

A warm room of wood, terracotta and a shelf of boxes carries more fine detail
and more skin-like colour than a face does, so every cheap proxy finds
furniture. A real face detector would settle it, and the ones available here
need a model file fetched at runtime, which an offline reproducible step
should not depend on.

So the centres are config values, `characters.single_crop.<host>.cx`, with
defaults that suit a standard LEFT/RIGHT two-shot. One look at the plate per
brand sets them, and `--probe` prints what the discarded heuristics would have
guessed so nobody re-derives them believing they work.
"""
from __future__ import annotations

import argparse
import json
import pathlib
import subprocess
import sys

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
import config_io  # noqa: E402

def luma(path, w=256):
    r = subprocess.run(["ffmpeg", "-v", "error", "-i", str(path), "-frames:v", "1",
                        "-vf", f"scale={w}:-2,format=gray", "-f", "rawvideo", "-"],
                       capture_output=True)
    buf = r.stdout
    h = len(buf) // w
    if h < 16:
        sys.exit(f"[err] could not read {path}")
    return [list(buf[y * w:(y + 1) * w]) for y in range(h)], w, h


def probe(path):
    """What the rejected heuristics guess. Printed for information only."""
    rows, w, h = luma(path)
    y0, y1 = int(h * 0.12), int(h * 0.62)
    e = [0.0] * w
    for y in range(y0, y1):
        r = rows[y]
        for x in range(1, w - 1):
            e[x] += abs(r[x] - r[x - 1]) + abs(r[x] - r[x + 1])
    win = max(3, int(w * 0.10))
    sm = [sum(e[max(0, i - win // 2):i + win // 2 + 1]) for i in range(w)]
    out = []
    for lo, hi in ((0, w // 2), (w // 2, w)):
        seg = sm[lo:hi]
        out.append((lo + max(range(len(seg)), key=seg.__getitem__)) / w)
    return out


def crop(src, dst, cx, pw, ph, W, H, y_off):
    cw, chh = int(W * pw), int(H * ph)
    x = max(0, min(W - cw, int(cx * W - cw / 2)))
    y = max(0, min(H - chh, int(H * y_off)))
    subprocess.run(["ffmpeg", "-y", "-v", "error", "-i", str(src), "-vf",
                    f"crop={cw}:{chh}:{x}:{y},scale=1080:1920:flags=lanczos",
                    str(dst)], check=True)
    return x, y, cw, chh


def size_of(path):
    r = subprocess.run(["ffprobe", "-v", "error", "-select_streams", "v:0",
                        "-show_entries", "stream=width,height", "-of", "csv=p=0",
                        str(path)], capture_output=True, text=True)
    w, h = r.stdout.strip().split(",")[:2]
    return int(w), int(h)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--config", required=True)
    config_io.add_arg(ap)
    ap.add_argument("--run-dir", required=True)
    ap.add_argument("--probe", action="store_true",
                    help="print what the rejected heuristics would guess, "
                         "then stop. They do not work; see the module docstring.")
    a = ap.parse_args()

    cfg = config_io.load(a.config, a.preset)
    run = pathlib.Path(a.run_dir)
    ch = cfg["characters"]
    plate = run / "stills" / (ch.get("plate_file") or "plate.png")
    if not plate.exists():
        sys.exit(f"[err] no plate at {plate}. Run `gen_paid.py plate` first.")

    if a.probe:
        g = probe(plate)
        print(f"heuristic guess: left {g[0]:.3f}  right {g[1]:.3f}")
        print("On the demo plate the real head centres are 0.138 and 0.914, so "
              "these are information only. Set characters.single_crop.<host>.cx "
              "from the picture.")
        return 0

    W, H = size_of(plate)
    spec = ch.get("single_crop") or {}
    who = sorted(cfg["hosts"])
    files = {b["who"]: b["file"] for b in ch["bases"]}
    default_cx = {who[0]: 0.21, who[1]: 0.82}
    for k in who:
        s = spec.get(k, {})
        cx = float(s.get("cx", default_cx[k]))
        pw = float(s.get("w", spec.get("w", 0.42)))
        ph = float(s.get("h", spec.get("h", 0.426)))
        y = float(s.get("y", spec.get("y", 0.28)))
        dst = run / "stills" / files.get(k, f"{k}-base.png")
        x0, y0, cw, chh = crop(plate, dst, cx, pw, ph, W, H, y)
        src = "config" if "cx" in s else "default"
        print(f"  {k}  cx {cx:.3f} ({src})  crop {cw}x{chh}+{x0}+{y0}  -> {dst.name}")
    print()
    print(f"  {len(who)} singles cropped from {plate.name}. $0.")
    print("  Look at both: whole head in frame, mic still in it, nothing with "
          "printed lettering behind them. Adjust characters.single_crop.<host>.cx "
          "and re-run; it costs nothing.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

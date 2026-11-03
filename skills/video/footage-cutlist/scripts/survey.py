#!/usr/bin/env python3
"""Survey a piece of footage so an agent can WATCH it: timestamped contact sheets, scene
cuts, and per-second motion. Free, local, deterministic.

    survey.py --video footage.mp4 --out work/survey
    survey.py --video footage.mp4 --out work/survey-12-18 --from 12 --to 18 --every 0.25

The whole-clip pass samples every ~1s (denser for short clips). It is for finding where
things happen, not for judging a moment: before you commit a window, re-survey that range
at --every 0.25 and look at every frame of it. A 1fps glance misses the click, the load
and the half-typed field, which is exactly what a user then points out.

Writes <out>/survey.json and <out>/sheet-NN.png (a grid of frames, each labelled with its
time). --frames also saves every sampled frame at full size (frame-<t>.png) for reading
small UI text.

survey.json:
  {video, duration, width, height, fps, every, range:[a,b],
   cuts:[t...],                       scene changes (ffmpeg scene score > 0.25)
   motion:[{t, value}],               mean frame-to-frame change per second, 0-255
   still:[[a,b]...],                  runs >= 1.5s with almost no change (dead screen)
   sheets:[{path, from, to}]}
"""
import argparse
import math
import pathlib
import re
import subprocess

from PIL import Image, ImageDraw

from _common import font, grab, probe, save

STILL_T = 0.6       # mean change below this is a still screen
STILL_MIN = 1.5     # seconds


def scene_cuts(path, a, b):
    err = subprocess.run(["ffmpeg", "-v", "info", "-ss", "%.3f" % a, "-t", "%.3f" % (b - a),
                          "-i", str(path), "-vf", "scale=320:-2,select='gt(scene,0.25)',showinfo",
                          "-f", "null", "-"], capture_output=True, text=True).stderr
    return [round(a + float(m), 2) for m in re.findall(r"pts_time:([0-9.]+)", err)]


def motion(path, a, b):
    """Mean absolute change between consecutive 4fps grey thumbnails, bucketed per second."""
    import numpy as np
    w, h = 96, 54
    raw = subprocess.run(["ffmpeg", "-v", "error", "-ss", "%.3f" % a, "-t", "%.3f" % (b - a),
                          "-i", str(path), "-vf", "fps=4,scale=%d:%d,format=gray" % (w, h),
                          "-f", "rawvideo", "-"], capture_output=True).stdout
    n = len(raw) // (w * h)
    if n < 2:
        return []
    f = np.frombuffer(raw[: n * w * h], np.uint8).reshape(n, h, w).astype(np.float32)
    d = np.abs(np.diff(f, axis=0)).mean(axis=(1, 2))
    out = []
    for s in range(int(math.ceil((b - a)))):
        seg = d[s * 4:(s + 1) * 4]
        if len(seg):
            out.append({"t": round(a + s, 2), "value": round(float(seg.mean()), 2)})
    return out


def still_runs(mo):
    runs, start = [], None
    for m in mo + [{"t": None, "value": 99}]:
        if m["value"] < STILL_T and start is None:
            start = m["t"]
        elif m["value"] >= STILL_T and start is not None:
            end = m["t"] if m["t"] is not None else mo[-1]["t"] + 1
            if end - start >= STILL_MIN:
                runs.append([start, end])
            start = None
    return runs


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--video", required=True)
    ap.add_argument("--out", required=True)
    ap.add_argument("--from", dest="a", type=float, default=0.0)
    ap.add_argument("--to", dest="b", type=float)
    ap.add_argument("--every", type=float, help="seconds between frames (default ~1s)")
    ap.add_argument("--cols", type=int, help="default 3 (landscape) / 5 (portrait)")
    ap.add_argument("--rows", type=int, help="default 3 (landscape) / 2 (portrait)")
    ap.add_argument("--tile", type=int, help="tile width in px; default 600 (landscape) / 360 (portrait)")
    ap.add_argument("--frames", action="store_true", help="also save each frame full size")
    x = ap.parse_args()

    info = probe(x.video)
    portrait = info["height"] > info["width"]
    # keep a sheet around 1800px wide so small UI text survives being viewed as an image
    x.cols = x.cols or (5 if portrait else 3)
    x.rows = x.rows or (2 if portrait else 3)
    x.tile = x.tile or (360 if portrait else 600)
    a = max(0.0, x.a)
    b = min(x.b if x.b is not None else info["duration"], info["duration"])
    if b <= a:
        raise SystemExit("empty range %.2f-%.2f (clip is %.2fs)" % (a, b, info["duration"]))
    every = x.every or max(0.5, min(2.0, (b - a) / 60.0))
    times = [round(a + i * every, 3) for i in range(int((b - a) / every) + 1) if a + i * every < b - 0.04]

    out = pathlib.Path(x.out)
    out.mkdir(parents=True, exist_ok=True)
    per = x.cols * x.rows
    th = int(x.tile * info["height"] / info["width"])
    label = font(max(18, x.tile // 18))
    sheets = []
    for si in range(0, len(times), per):
        chunk = times[si:si + per]
        sheet = Image.new("RGB", (x.cols * x.tile, x.rows * th), (18, 18, 18))
        for k, t in enumerate(chunk):
            im = grab(x.video, t)
            if x.frames:
                im.save(out / ("frame-%07.2f.png" % t))
            im = im.resize((x.tile, th))
            d = ImageDraw.Draw(im)
            txt = "%.2fs" % t
            bb = d.textbbox((0, 0), txt, font=label)
            d.rectangle([0, 0, bb[2] + 16, bb[3] + 10], fill=(0, 0, 0))
            d.text((8, 4), txt, font=label, fill=(255, 220, 40))
            sheet.paste(im, ((k % x.cols) * x.tile, (k // x.cols) * th))
        p = out / ("sheet-%02d.png" % (len(sheets) + 1))
        sheet.save(p)
        sheets.append({"path": str(p), "from": chunk[0], "to": chunk[-1]})

    mo = motion(x.video, a, b)
    res = {"video": str(x.video), **info, "every": every, "range": [a, b],
           "cuts": scene_cuts(x.video, a, b), "motion": mo, "still": still_runs(mo),
           "sheets": sheets}
    save(out / "survey.json", res)
    print("[survey] %s  %.2f-%.2fs every %.2fs  %d frames on %d sheets  %d cuts  %d still runs"
          % (x.video, a, b, every, len(times), len(sheets), len(res["cuts"]), len(res["still"])))
    for s in sheets:
        print("  %s  %.2f-%.2fs" % (s["path"], s["from"], s["to"]))
    if res["still"]:
        print("  still (dead screen): " + ", ".join("%.1f-%.1f" % tuple(r) for r in res["still"]))


if __name__ == "__main__":
    main()

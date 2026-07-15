#!/usr/bin/env python3
"""render.py — free/deterministic assembly for the "search-grid" format.

Pipeline: build_html.py (config -> index.html) -> capture.js (Chromium frame-step -> PNGs)
-> ffmpeg (encode). If --music is given, it is muxed (map v:0 + a:0). NO paid calls here;
the music bed comes from create-music-elevenlabs upstream and is passed in via --music.

Prereqs: node + `npm i playwright-core` (or a cached Playwright chromium), ffmpeg on PATH.

Usage:
  python3 render.py --config config.json --out master.mp4 [--music bed.m4a] [--fps 30]
"""
import argparse, json, subprocess, sys, tempfile
from pathlib import Path

HERE = Path(__file__).parent


def run(cmd, **kw):
    print("+", " ".join(str(c) for c in cmd)); subprocess.run(cmd, check=True, **kw)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--config", required=True)
    ap.add_argument("--out", default="master.mp4")
    ap.add_argument("--music", help="optional audio bed (from create-music-elevenlabs), muxed on")
    ap.add_argument("--fps", type=int)
    ap.add_argument("--exe", help="path to a Chromium binary (else auto-discovered)")
    args = ap.parse_args()

    cfg = json.loads(Path(args.config).read_text())
    canvas = cfg.get("canvas", {})
    W, Hh = canvas.get("width", 1080), canvas.get("height", 1920)
    fps = args.fps or canvas.get("fps", 30)
    dur = canvas.get("duration_ms", 18000)

    work = Path(tempfile.mkdtemp(prefix="search-grid-"))
    html = work / "index.html"; frames = work / "frames"

    run([sys.executable, str(HERE / "build_html.py"), "--config", args.config, "--out", str(html)])
    cap = ["node", str(HERE / "capture.js"), "--html", str(html), "--out", str(frames),
           "--fps", str(fps), "--duration", str(dur), "--width", str(W), "--height", str(Hh)]
    if args.exe:
        cap += ["--exe", args.exe]
    run(cap)

    enc = ["ffmpeg", "-y", "-framerate", str(fps), "-i", str(frames / "f%04d.png")]
    if args.music:
        enc += ["-i", args.music, "-map", "0:v:0", "-map", "1:a:0", "-c:a", "aac", "-b:a", "192k", "-shortest"]
    enc += ["-c:v", "libx264", "-profile:v", "high", "-pix_fmt", "yuv420p", "-crf", "18",
            "-preset", "slow", "-movflags", "+faststart", args.out]
    run(enc)
    print("wrote", args.out)


if __name__ == "__main__":
    main()

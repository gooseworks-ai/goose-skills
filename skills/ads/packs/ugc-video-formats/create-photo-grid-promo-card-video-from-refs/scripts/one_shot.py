#!/usr/bin/env python3
"""End-to-end driver for one photo-grid promo card.

build_card (HTML) → render (Playwright frame-step → silent mp4) → gen_music (PAID,
ElevenLabs) → mux. The card + render are FREE/deterministic; only the music bed
costs. `--no-music` produces a silent master with zero spend.

Usage:
  one_shot.py --config config.json --run-dir <run>            # full (1 paid music call)
  one_shot.py --config config.json --run-dir <run> --no-music # silent, $0
"""
import argparse
import pathlib
import subprocess
import sys

HERE = pathlib.Path(__file__).resolve().parent


def run(script, *a):
    cmd = [sys.executable, str(HERE / script), *a]
    print(f"\n$ {' '.join(str(c) for c in cmd)}", flush=True)
    subprocess.run(cmd, check=True)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--config", required=True)
    ap.add_argument("--run-dir", required=True)
    ap.add_argument("--no-music", action="store_true", help="silent master, no paid call")
    args = ap.parse_args()
    cfg, rd = args.config, pathlib.Path(args.run_dir)
    rd.mkdir(parents=True, exist_ok=True)
    html = rd / "hyperframe.html"
    silent = rd / "master-silent.mp4"
    out = rd / "master-final.mp4"

    run("build_card.py", "--config", cfg, "--out", str(html))
    run("render.py", "--config", cfg, "--html", str(html), "--out", str(silent))

    if args.no_music:
        silent.replace(out)
        print(f"\n[done] silent master at {out} — /watch it before shipping.")
        return

    run("gen_music.py", "--config", cfg, "--run-dir", str(rd))
    music = rd / "music-bed.m4a"
    import json
    dur = json.loads(pathlib.Path(cfg).read_text()).get("duration_sec", 10.0)
    subprocess.run([
        "ffmpeg", "-y", "-hide_banner", "-loglevel", "error",
        "-i", str(silent), "-i", str(music),
        "-map", "0:v:0", "-map", "1:a:0", "-c:v", "copy", "-c:a", "aac", "-b:a", "192k",
        "-t", str(dur), "-movflags", "+faststart", str(out),
    ], check=True)
    print(f"\n[done] master at {out} — /watch it before shipping.")


if __name__ == "__main__":
    main()

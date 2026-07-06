#!/usr/bin/env python3
"""Generate the music bed (ElevenLabs Music). Prompt from config.music. Energetic
from t=0 (no sparse intro), loudnorm, fade the tail.

Usage:  gen_music.py --config config.json --run-dir <run>  [--total-sec N]
Output: <run>/generated/music-bed.m4a
"""
import argparse
import json
import os
import pathlib
import subprocess

import requests


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--config", required=True)
    ap.add_argument("--run-dir", required=True)
    ap.add_argument("--total-sec", type=float, default=None,
                    help="target bed length (defaults to config.music.length_ms)")
    args = ap.parse_args()
    cfg = json.loads(pathlib.Path(args.config).read_text())
    m = cfg["music"]
    run = pathlib.Path(args.run_dir)
    gen = run / "generated"
    gen.mkdir(parents=True, exist_ok=True)
    raw = gen / "music-raw.mp3"
    out = gen / "music-bed.m4a"
    total = args.total_sec if args.total_sec else m.get("length_ms", 16000) / 1000.0

    api = os.environ["ELEVENLABS_API_KEY"]
    r = requests.post(
        "https://api.elevenlabs.io/v1/music",
        headers={"xi-api-key": api, "Content-Type": "application/json"},
        json={"prompt": m["prompt"], "music_length_ms": int((total + 0.5) * 1000),
              "force_instrumental": m.get("force_instrumental", True)},
        timeout=180,
    )
    r.raise_for_status()
    raw.write_bytes(r.content)
    subprocess.run([
        "ffmpeg", "-y", "-hide_banner", "-loglevel", "error",
        "-ss", str(m.get("trim_intro_sec", 0.0)), "-i", str(raw),
        "-af", f"loudnorm=I=-16:TP=-1.5:LRA=11,afade=t=out:st={total - 0.5}:d=0.5",
        "-t", str(total), "-c:a", "aac", "-b:a", "192k", str(out),
    ], check=True)
    print(f"[music] bed: {out}  ({total:.1f}s)")


if __name__ == "__main__":
    main()

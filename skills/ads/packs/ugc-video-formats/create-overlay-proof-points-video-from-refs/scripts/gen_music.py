#!/usr/bin/env python3
"""Generate + trim the UGC music bed (ElevenLabs Music). Prompt from config.json.

ElevenLabs Music has a 2-3s sparse intro; we generate raw_length_ms then trim
trim_intro_sec so the bed kicks in immediately, loudnorm, and fade the tail.

Usage:  gen_music.py --config config.json --run-dir <run>
Output: <run>/generated/music-bed.m4a  (length = duration_sec)
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
    args = ap.parse_args()

    cfg = json.loads(pathlib.Path(args.config).read_text())
    m = cfg["music"]
    run = pathlib.Path(args.run_dir)
    gen = run / "generated"
    gen.mkdir(parents=True, exist_ok=True)
    raw = gen / "music-raw.mp3"
    out = gen / "music-bed.m4a"
    dur = cfg.get("duration_sec", 10)
    trim = m.get("trim_intro_sec", 2.5)

    api = os.environ["ELEVENLABS_API_KEY"]
    r = requests.post(
        "https://api.elevenlabs.io/v1/music",
        headers={"xi-api-key": api, "Content-Type": "application/json"},
        json={"prompt": m["prompt"], "music_length_ms": m.get("raw_length_ms", 13000)},
        timeout=180,
    )
    r.raise_for_status()
    raw.write_bytes(r.content)
    print(f"[music] raw: {raw} ({raw.stat().st_size // 1024} KB)")

    # trim sparse intro -> loudnorm -> fade out last 0.5s -> clamp to duration
    subprocess.run([
        "ffmpeg", "-y", "-hide_banner", "-loglevel", "error",
        "-ss", str(trim), "-i", str(raw),
        "-af", f"loudnorm=I=-18:TP=-1.5:LRA=11,afade=t=out:st={dur - 0.5}:d=0.5",
        "-t", str(dur), "-c:a", "aac", "-b:a", "192k", str(out),
    ], check=True)
    print(f"[music] bed: {out}")


if __name__ == "__main__":
    main()

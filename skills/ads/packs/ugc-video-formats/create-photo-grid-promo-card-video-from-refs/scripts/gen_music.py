#!/usr/bin/env python3
"""Generate the promo-card music bed (ElevenLabs Music). Prompt from config.json.

The bed must be energetic from t=0 (a promo card is 10s — no room for a sparse
2-3s intro), so the prompt says so and we hard-trim any lead-in, loudnorm, and
fade the tail.

Usage:  gen_music.py --config config.json --run-dir <run>
Output: <run>/music-bed.m4a  (length = duration_sec)
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
    run.mkdir(parents=True, exist_ok=True)
    raw = run / "music-raw.mp3"
    out = run / "music-bed.m4a"
    dur = cfg.get("duration_sec", 10.0)

    api = os.environ["ELEVENLABS_API_KEY"]
    r = requests.post(
        "https://api.elevenlabs.io/v1/music",
        headers={"xi-api-key": api, "Content-Type": "application/json"},
        json={"prompt": m["prompt"],
              "music_length_ms": m.get("length_ms", int((dur + 0.5) * 1000)),
              "force_instrumental": m.get("force_instrumental", True)},
        timeout=180,
    )
    r.raise_for_status()
    raw.write_bytes(r.content)
    print(f"[music] raw: {raw} ({raw.stat().st_size // 1024} KB)")

    subprocess.run([
        "ffmpeg", "-y", "-hide_banner", "-loglevel", "error",
        "-ss", str(m.get("trim_intro_sec", 0.0)), "-i", str(raw),
        "-af", f"loudnorm=I=-16:TP=-1.5:LRA=11,afade=t=out:st={dur - 0.5}:d=0.5",
        "-t", str(dur), "-c:a", "aac", "-b:a", "192k", str(out),
    ], check=True)
    print(f"[music] bed: {out}")


if __name__ == "__main__":
    main()

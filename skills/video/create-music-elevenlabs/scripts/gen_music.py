#!/usr/bin/env python3
"""ElevenLabs Music bed ROUTED THROUGH THE PROXY (bills the Ads agent). Trims any sparse
intro, loudnorm, fades the tail. Prompt + length from the template recipe.

  gen_music.py --prompt "..." --length-ms 10500 --duration 10 --trim-intro 0 --out music.m4a
"""
import argparse, subprocess, tempfile, pathlib
from media_proxy import eleven_music

ap = argparse.ArgumentParser()
ap.add_argument("--prompt", required=True)
ap.add_argument("--length-ms", type=int, default=None)
ap.add_argument("--duration", type=float, required=True)
ap.add_argument("--trim-intro", type=float, default=0.0)
ap.add_argument("--loudnorm-i", default="-16")
ap.add_argument("--out", required=True)
a = ap.parse_args()
raw = pathlib.Path(tempfile.mktemp(suffix=".mp3"))
eleven_music(a.prompt, a.length_ms or int((a.duration + 0.5) * 1000), str(raw))
subprocess.run(["ffmpeg", "-y", "-hide_banner", "-loglevel", "error", "-ss", str(a.trim_intro),
    "-i", str(raw), "-af", f"loudnorm=I={a.loudnorm_i}:TP=-1.5:LRA=11,afade=t=out:st={a.duration-0.5}:d=0.5",
    "-t", str(a.duration), "-c:a", "aac", "-b:a", "192k", a.out], check=True)
print(a.out)

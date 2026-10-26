#!/usr/bin/env python3
"""Surgically replace one segment of a master UGC clip with a re-rendered
replacement clip, preserving the master's continuous audio.

This is the deterministic core of the create-ugc-product-video-from-refs fix
loop. The master is a single Seedance reference-to-video render with native
lip-synced audio. When one internal beat drifts (a bad swing, a morphing
product, a contorted body), we re-render JUST that beat as a short silent clip
and swap it in on the VIDEO TRACK ONLY — the master's audio (VO + ambience)
plays straight through, so lip-sync on the talking beats is never touched.

Two ways to choose the window to replace:
  1. Explicit:   --window-start S --window-end E   (seconds)
  2. By beat:    --replace-beat N                    (1-indexed segment between
                 scene cuts; cuts are auto-detected with --scene-threshold)

The replacement is almost never exactly the hole length. --fit reconciles it:
  stretch (default) — time-scale the replacement to fill the hole exactly
                      (slight slow/fast motion; flatters athletic motion)
  trim              — cut the replacement to the hole length (drops the tail)
  freeze            — play the replacement, then hold its last frame to fill

Output is re-encoded H.264 / yuv420p at the master's fps and resolution so the
seams are clean and the file plays everywhere.

Usage:
  stitch_replacement.py --master M.mp4 --replacement R.mp4 --output O.mp4 \
      --replace-beat 2
  stitch_replacement.py --master M.mp4 --replacement R.mp4 --output O.mp4 \
      --window-start 4.21 --window-end 8.75 --fit stretch
"""
from __future__ import annotations

import argparse
import json
import subprocess
import sys


def run(cmd: list[str]) -> str:
    p = subprocess.run(cmd, capture_output=True, text=True)
    if p.returncode != 0:
        sys.exit(f"FATAL: command failed: {' '.join(cmd)}\n{p.stderr}")
    return p.stdout


def probe(path: str) -> dict:
    out = run([
        "ffprobe", "-v", "error", "-select_streams", "v:0",
        "-show_entries", "stream=width,height,r_frame_rate",
        "-show_entries", "format=duration", "-of", "json", path,
    ])
    d = json.loads(out)
    s = d["streams"][0]
    num, den = s["r_frame_rate"].split("/")
    return {
        "w": int(s["width"]),
        "h": int(s["height"]),
        "fps": float(num) / float(den),
        "dur": float(d["format"]["duration"]),
    }


def scene_cuts(path: str, threshold: float) -> list[float]:
    """Return sorted internal cut timestamps (excludes 0 and end)."""
    p = subprocess.run(
        ["ffmpeg", "-nostdin", "-hide_banner", "-i", path,
         "-filter_complex", f"select='gt(scene,{threshold})',metadata=print:file=-",
         "-an", "-f", "null", "-"],
        capture_output=True, text=True,
    )
    out = (p.stdout or "") + "\n" + (p.stderr or "")  # file=- can land on either
    cuts = []
    for line in out.splitlines():
        if "pts_time:" in line:
            try:
                cuts.append(float(line.split("pts_time:")[1].split()[0]))
            except (IndexError, ValueError):
                pass
    return sorted(cuts)


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--master", required=True)
    ap.add_argument("--replacement", required=True)
    ap.add_argument("--output", required=True)
    ap.add_argument("--window-start", type=float)
    ap.add_argument("--window-end", type=float)
    ap.add_argument("--replace-beat", type=int,
                    help="1-indexed segment between detected scene cuts")
    ap.add_argument("--scene-threshold", type=float, default=0.3)
    ap.add_argument("--fit", choices=["stretch", "trim", "freeze"], default="stretch")
    ap.add_argument("--dry-run", action="store_true")
    args = ap.parse_args()

    m = probe(args.master)
    r = probe(args.replacement)
    total = m["dur"]

    # Resolve the replacement window.
    if args.window_start is not None and args.window_end is not None:
        start, end = args.window_start, args.window_end
    elif args.replace_beat is not None:
        cuts = scene_cuts(args.master, args.scene_threshold)
        bounds = [0.0] + cuts + [total]
        n = args.replace_beat
        if n < 1 or n >= len(bounds):
            sys.exit(f"FATAL: --replace-beat {n} out of range; "
                     f"detected {len(bounds)-1} segments at cuts {cuts}")
        start, end = bounds[n - 1], bounds[n]
        print(f"[stitch] detected cuts {', '.join(f'{c:.2f}' for c in cuts)}")
        print(f"[stitch] beat {n} → window {start:.2f}-{end:.2f}s")
    else:
        sys.exit("FATAL: pass --window-start/--window-end or --replace-beat")

    hole = end - start
    if hole <= 0:
        sys.exit(f"FATAL: empty window {start:.2f}-{end:.2f}")
    print(f"[stitch] hole={hole:.3f}s  replacement={r['dur']:.3f}s  fit={args.fit}")

    # Build the replacement video filter to fit the hole exactly.
    if args.fit == "stretch":
        factor = hole / r["dur"]
        rep = f"trim=0:{r['dur']:.3f},setpts=(PTS-STARTPTS)*{factor:.5f}"
    elif args.fit == "trim":
        rep = f"trim=0:{min(hole, r['dur']):.3f},setpts=PTS-STARTPTS"
    else:  # freeze
        rep = (f"trim=0:{min(hole, r['dur']):.3f},setpts=PTS-STARTPTS,"
               f"tpad=stop_mode=clone:stop_duration={max(0.0, hole - r['dur']):.3f}")

    W, H, FPS = m["w"], m["h"], m["fps"]
    sc = f"scale={W}:{H},setsar=1,fps={FPS:g}"
    fc = (
        f"[0:v]trim=0:{start:.3f},setpts=PTS-STARTPTS,{sc}[a];"
        f"[1:v]{rep},{sc}[b];"
        f"[0:v]trim={end:.3f}:{total:.3f},setpts=PTS-STARTPTS,{sc}[c];"
        f"[a][b][c]concat=n=3:v=1:a=0[outv]"
    )

    cmd = [
        "ffmpeg", "-nostdin", "-loglevel", "error", "-y",
        "-i", args.master, "-i", args.replacement,
        "-filter_complex", fc,
        "-map", "[outv]", "-map", "0:a?",
        "-c:v", "libx264", "-pix_fmt", "yuv420p", "-r", f"{FPS:g}",
        "-c:a", "aac", "-b:a", "192k",
        args.output,
    ]
    if args.dry_run:
        print("[stitch] DRY RUN — would run:\n  " + " ".join(cmd))
        return 0

    run(cmd)
    o = probe(args.output)
    print(f"[stitch] wrote {args.output}  {o['w']}x{o['h']} {o['fps']:g}fps {o['dur']:.2f}s")
    if abs(o["dur"] - total) > 0.15:
        print(f"[stitch] WARNING: output {o['dur']:.2f}s vs master {total:.2f}s "
              f"(>0.15s drift — check audio sync)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

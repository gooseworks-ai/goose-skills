#!/usr/bin/env python3
"""Assemble the master (deterministic, free): speed each Veo beat by beat_speed
(4s → ~2.67s), HARD-CUT concat all beats, optionally insert the Father's-Day-style
card (fade in/hold/out), append the brand end-card, then mux the music bed.

Hard cuts, no dissolves — the listicle rhythm. All clips are normalized to the same
fps/codec so concat-copy is safe.

Usage:  build_master.py --config config.json --run-dir <run>  [--no-music] [--no-insert]
Output: <run>/master-final.mp4
"""
import argparse
import json
import pathlib
import subprocess
import tempfile


def run(cmd):
    subprocess.run(cmd, check=True)


def norm(src, dst, fps, speed=1.0):
    # normalize to one fps/codec (+ optional speed-up) so concat-copy is safe
    run(["ffmpeg", "-y", "-hide_banner", "-loglevel", "error", "-i", str(src), "-an",
         "-vf", f"setpts=PTS/{speed}", "-r", str(fps),
         "-c:v", "libx264", "-pix_fmt", "yuv420p", "-crf", "18", "-preset", "medium", str(dst)])


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--config", required=True)
    ap.add_argument("--run-dir", required=True)
    ap.add_argument("--no-music", action="store_true")
    ap.add_argument("--no-insert", action="store_true")
    args = ap.parse_args()
    cfg = json.loads(pathlib.Path(args.config).read_text())
    run_dir = pathlib.Path(args.run_dir)
    gen = run_dir / "generated"
    fps = cfg.get("fps", 30)
    speed = cfg.get("beat_speed", 1.5)
    tmp = pathlib.Path(tempfile.mkdtemp(prefix="flatlay_"))

    seq = []
    for i, b in enumerate(cfg["beats"], 1):
        beat = gen / "beats" / f"{b['slug']}.mp4"
        fast = tmp / f"beat{i}.mp4"
        norm(beat, fast, fps, speed)
        seq.append(fast)

    # optional insert card (a pre-built fade-in/hold/out mp4 from gen_fd_card.py)
    fd = gen / "insert-card.mp4"
    if cfg.get("insert_card", {}).get("enabled") and not args.no_insert and fd.exists():
        fdn = tmp / "insert.mp4"
        norm(fd, fdn, fps)
        seq.append(fdn)

    # end card
    ec = gen / "end-card.mp4"
    ecn = tmp / "endcard.mp4"
    norm(ec, ecn, fps)
    seq.append(ecn)

    concat = tmp / "concat.txt"
    concat.write_text("".join(f"file '{p}'\n" for p in seq))
    silent = gen / "master-silent.mp4"
    run(["ffmpeg", "-y", "-hide_banner", "-loglevel", "error",
         "-f", "concat", "-safe", "0", "-i", str(concat), "-c", "copy", str(silent)])

    dur = float(subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration",
                                "-of", "csv=p=0", str(silent)], capture_output=True, text=True).stdout.strip())
    out = run_dir / "master-final.mp4"
    music = gen / "music-bed.m4a"
    if args.no_music or not music.exists():
        silent.replace(out)
    else:
        run(["ffmpeg", "-y", "-hide_banner", "-loglevel", "error",
             "-i", str(silent), "-i", str(music),
             "-map", "0:v:0", "-map", "1:a:0", "-c:v", "copy", "-c:a", "aac", "-b:a", "192k",
             "-t", f"{dur:.3f}", "-movflags", "+faststart", str(out)])
    print(f"[master] {out}  ({dur:.2f}s, {len(seq)} segments)")


if __name__ == "__main__":
    main()

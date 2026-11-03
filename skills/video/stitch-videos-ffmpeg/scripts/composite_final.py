#!/usr/bin/env python3
"""Final two-pass composite: xfade-concat → burn ASS subtitles + music duck.

Reads edit_plan.json to find normalized segments at <workdir>/segments/<beat>.mp4,
xfade-concats them, muxes VO with atempo if needed, mixes music with a volume
curve (0.15 baseline → 0.5 swell in the last 2.5s).

Usage:
  composite_final.py <edit_plan.json> <vo.mp3> <subtitles.ass> <music.wav> <out.mp4> [target_duration]

Requires ffmpeg with libass.
"""
import json, os, subprocess, sys
from pathlib import Path


def ffprobe_duration(path):
    out = subprocess.run(
        ["ffprobe", "-v", "error", "-show_entries", "format=duration",
         "-of", "default=noprint_wrappers=1:nokey=1", str(path)],
        capture_output=True, text=True, check=True,
    ).stdout.strip()
    return float(out)


def build_pass1(plan, segments_dir, vo_path, music_path, target, out_path):
    cuts = plan["cuts"]
    n = len(cuts)
    xfade_dur = 0.4

    inputs = []
    for c in cuts:
        seg = Path(segments_dir) / f"{c['beat']}.mp4"
        inputs += ["-i", str(seg)]
    inputs += ["-i", str(vo_path), "-i", str(music_path)]
    vo_idx, music_idx = n, n + 1

    # Build xfade chain
    filters = []
    prev = "[0:v]"
    cum = cuts[0]["out"] - cuts[0]["in"]
    for i in range(1, n):
        out_label = f"[v{i}]" if i < n - 1 else "[vfinal]"
        offset = cum
        filters.append(f"{prev}[{i}:v]xfade=transition=fade:duration={xfade_dur}:offset={offset:.3f}{out_label}")
        prev = out_label
        cum += cuts[i]["out"] - cuts[i]["in"]
    final_v = prev

    # Audio: VO with atempo + music with end-card swell
    vo_dur = ffprobe_duration(vo_path)
    atempo = max(0.75, min(1.25, vo_dur / target))
    swell_start = max(0, target - 2.5)
    filters.append(
        f"[{vo_idx}:a]atempo={atempo:.4f},apad[vo_a]"
    )
    filters.append(
        f"[{music_idx}:a]volume='if(gte(t,{swell_start:.2f}),0.5,0.18)':eval=frame[music_a]"
    )
    filters.append("[vo_a][music_a]amix=inputs=2:duration=first:weights=1 0.5[a_out]")

    filter_complex = ";".join(filters)

    cmd = [
        "ffmpeg", "-y", "-loglevel", "warning",
        *inputs,
        "-filter_complex", filter_complex,
        "-map", final_v, "-map", "[a_out]",
        "-c:v", "libx264", "-crf", "18", "-preset", "medium", "-pix_fmt", "yuv420p",
        "-c:a", "aac", "-b:a", "192k",
        "-t", f"{target}",
        str(out_path),
    ]
    print(f"[pass1] atempo={atempo:.3f}, target={target}s, music swell @ {swell_start}s")
    subprocess.run(cmd, check=True)


def build_pass2(nosubs, ass_path, out_path):
    cmd = [
        "ffmpeg", "-y", "-loglevel", "warning",
        "-i", str(nosubs),
        "-vf", f"ass={ass_path}",
        "-c:v", "libx264", "-crf", "18", "-preset", "medium", "-pix_fmt", "yuv420p",
        "-c:a", "copy",
        str(out_path),
    ]
    print(f"[pass2] burn ASS → {out_path}")
    subprocess.run(cmd, check=True)


if __name__ == "__main__":
    if len(sys.argv) < 6:
        print(__doc__)
        sys.exit(1)
    plan_path = Path(sys.argv[1])
    vo = Path(sys.argv[2])
    ass = Path(sys.argv[3])
    music = Path(sys.argv[4])
    out = Path(sys.argv[5])
    plan = json.loads(plan_path.read_text())
    target = float(sys.argv[6]) if len(sys.argv) > 6 else float(plan["duration"])

    workdir = out.parent
    segments_dir = workdir / "segments"
    nosubs = workdir / "nosubs.mp4"

    build_pass1(plan, segments_dir, vo, music, target, nosubs)
    build_pass2(nosubs, ass, out)
    print(f"Done: {out}")

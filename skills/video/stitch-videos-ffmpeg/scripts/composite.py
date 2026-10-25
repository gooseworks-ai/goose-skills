#!/usr/bin/env python3
"""Composite the final UGC ad from an edit map JSON.

Two-pass pipeline:
  Pass 1: concat clips per cut map, normalize to 720x1280, layer VO.
  Pass 2: burn ASS subtitles + mix music with end-card swell.

Requires ffmpeg with libass support. Many minimal builds lack it — verify with
`ffmpeg -filters | grep subtitles`. The script tries (in order):
  1. macOS Homebrew ffmpeg-full at /opt/homebrew/Cellar/ffmpeg-full/*/bin/ffmpeg
  2. `ffmpeg-full` on PATH
  3. `ffmpeg` on PATH (assumes the install includes libass)

Edit map shape (edit_plan.json):
{
  "duration": 18.0,
  "aspect": "9:16",
  "audio": "assets/vo_full.mp3",
  "subtitles": "assets/subtitles.ass",
  "music": "assets/music.wav",
  "cuts": [
    {"in": 0.0, "out": 4.71, "video": "assets/talking_head.mp4", "trim": [0, 4.71]},
    {"in": 4.71, "out": 7.0, "video": "assets/broll_pills.mp4", "trim": [0, 2.29]},
    ...
  ]
}

Usage: composite.py <edit_plan.json> <output.mp4>
"""
import argparse, json, glob, os, subprocess, sys
from pathlib import Path


def find_ffmpeg_full():
    """Locate an ffmpeg build with libass.

    Strategy:
      1. macOS Homebrew ffmpeg-full Cellar path
      2. `ffmpeg-full` on PATH
      3. `ffmpeg` on PATH (assumes libass-enabled — verify with
         `ffmpeg -filters | grep subtitles` before relying on this)
    """
    import shutil
    candidates = sorted(glob.glob("/opt/homebrew/Cellar/ffmpeg-full/*/bin/ffmpeg"))
    if candidates:
        return candidates[-1]
    if shutil.which("ffmpeg-full"):
        return "ffmpeg-full"
    return "ffmpeg"


def composite(plan_path, out_path):
    plan = json.loads(Path(plan_path).read_text())
    work_dir = Path(plan_path).parent

    cuts = plan["cuts"]
    duration = float(plan["duration"])
    audio = plan["audio"]
    subtitles = plan.get("subtitles")
    music = plan.get("music")

    ffmpeg = "ffmpeg"  # Pass 1 doesn't need libass
    ffmpeg_full = find_ffmpeg_full()  # Pass 2 needs libass

    # Pass 1: concat
    inputs = []
    for c in cuts:
        inputs.extend(["-i", str(work_dir / c["video"])])
    inputs.extend(["-i", str(work_dir / audio)])

    filters = []
    for i, c in enumerate(cuts):
        t_in, t_out = c["trim"]
        filters.append(
            f"[{i}:v]trim={t_in}:{t_out},setpts=PTS-STARTPTS,"
            f"scale=720:1280:force_original_aspect_ratio=increase,"
            f"crop=720:1280,setsar=1,fps=30[v{i}]"
        )
    chain = "".join(f"[v{i}]" for i in range(len(cuts))) + f"concat=n={len(cuts)}:v=1[outv]"
    filters.append(chain)
    filters.append(f"[{len(cuts)}:a]apad=pad_dur=2[outa]")

    nosubs = work_dir / "nosubs.mp4"
    subprocess.run([
        ffmpeg, "-y", *inputs,
        "-filter_complex", ";".join(filters),
        "-map", "[outv]", "-map", "[outa]",
        "-c:v", "libx264", "-pix_fmt", "yuv420p", "-crf", "18", "-preset", "medium",
        "-c:a", "aac", "-b:a", "192k",
        "-t", str(duration),
        str(nosubs)
    ], check=True)

    # Pass 2: subtitles + music mix
    pass2_args = [ffmpeg_full, "-y", "-i", str(nosubs)]
    if music:
        pass2_args.extend(["-i", str(work_dir / music)])

    if subtitles and music:
        # Music swell at end card: hold at 15% bg, ramp to 50% at 16.5-17.5s
        end_swell_start = duration - 1.5
        end_swell_end = duration - 0.5
        vol_expr = (
            f"if(lt(t,0.5),t*0.30,"
            f"if(lt(t,{end_swell_start}),0.15,"
            f"if(lt(t,{end_swell_end}),0.15+(t-{end_swell_start})*0.35,0.5)))"
        )
        pass2_args.extend([
            "-vf", f"subtitles={work_dir / subtitles}",
            "-filter_complex", f"[1:a]volume='{vol_expr}':eval=frame[m];[0:a][m]amix=inputs=2:duration=first:dropout_transition=0:normalize=0[mixed]",
            "-map", "0:v", "-map", "[mixed]"
        ])
    elif subtitles:
        pass2_args.extend(["-vf", f"subtitles={work_dir / subtitles}"])
    elif music:
        end_swell_start = duration - 1.5
        end_swell_end = duration - 0.5
        vol_expr = (
            f"if(lt(t,0.5),t*0.30,"
            f"if(lt(t,{end_swell_start}),0.15,"
            f"if(lt(t,{end_swell_end}),0.15+(t-{end_swell_start})*0.35,0.5)))"
        )
        pass2_args.extend([
            "-filter_complex", f"[1:a]volume='{vol_expr}':eval=frame[m];[0:a][m]amix=inputs=2:duration=first:dropout_transition=0:normalize=0[mixed]",
            "-map", "0:v", "-map", "[mixed]"
        ])

    pass2_args.extend([
        "-c:v", "libx264", "-pix_fmt", "yuv420p", "-crf", "18", "-preset", "medium",
        "-c:a", "aac", "-b:a", "192k",
        out_path
    ])
    subprocess.run(pass2_args, check=True)
    print(f"Done: {out_path}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("plan_json")
    parser.add_argument("output_mp4")
    args = parser.parse_args()
    composite(args.plan_json, args.output_mp4)

#!/usr/bin/env python3
"""Composite the pill overlays onto the base clip in a diagonal cascade, mux the
music bed, apply the anti-AI grain pass -> master-final.mp4. Config-driven so it
handles any 3-4 proof-point count.

Assumes overlays already built into <run>/generated/overlays by build_overlays.py
(the one_shot.py driver runs that first). Positions + reveal times from config.layout.

Cascade signature: pills alternate LEFT / RIGHT down the frame, each revealed at
its own time via overlay enable='gte(t,T)' — eye follows L->R->L->R on the beat.

Usage:  compose_master.py --config config.json --run-dir <run>
Output: <run>/master-final.mp4
"""
import argparse
import json
import pathlib
import subprocess


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--config", required=True)
    ap.add_argument("--run-dir", required=True)
    ap.add_argument("--no-music", action="store_true", help="skip music mux (silent master)")
    args = ap.parse_args()

    cfg = json.loads(pathlib.Path(args.config).read_text())
    run = pathlib.Path(args.run_dir)
    gen = run / "generated"
    ov = gen / "overlays"
    lay = cfg["layout"]
    dur = cfg.get("duration_sec", 10)

    clip = gen / "clip-handheld.mp4"
    header = ov / "01-header-white.png"
    subhead = ov / "02-header-orange.png"
    pills = sorted(ov.glob("[0-9][0-9]-check-*.png"))
    if not pills:
        raise SystemExit("no proof pills found in generated/overlays — run build_overlays.py first")

    rows = lay["pill_rows_y"]
    times = lay["reveal_times"]
    left_x = lay.get("pill_left_x", 40)
    right_margin = lay.get("pill_right_margin", 40)

    inputs = ["-i", str(clip), "-i", str(header), "-i", str(subhead)]
    for p in pills:
        inputs += ["-i", str(p)]

    # base scale/crop to 1080x1920 @ 30fps
    fc = [
        "[0:v]scale=1080:1920:force_original_aspect_ratio=increase,"
        "crop=1080:1920,setsar=1,fps=30[base]",
        f"[base][1]overlay={lay['header_x']}:{lay['header_y']}[v1]",
        f"[v1][2]overlay={lay['header_x']}:{lay['subhead_y']}[v2]",
    ]
    prev = "v2"
    for i, _p in enumerate(pills):
        idx = 3 + i             # ffmpeg input index for this pill
        y = rows[i % len(rows)]
        t = times[i % len(times)]
        x = str(left_x) if i % 2 == 0 else f"(W-w-{right_margin})"
        out = f"vp{i}"
        fc.append(f"[{prev}][{idx}]overlay={x}:{y}:enable='gte(t,{t})'[{out}]")
        prev = out

    composite = gen / "composite-no-audio.mp4"
    subprocess.run([
        "ffmpeg", "-y", "-hide_banner", "-loglevel", "error", *inputs,
        "-filter_complex", ";".join(fc), "-map", f"[{prev}]",
        "-c:v", "libx264", "-pix_fmt", "yuv420p", "-crf", "18", "-preset", "medium",
        "-movflags", "+faststart", "-t", str(dur), str(composite),
    ], check=True)
    print(f"[composite] {composite}")

    # grain master + music mux. grain: eq + hqdn3d + noise; re-encode crf23/maxrate12M
    # (noise inflates bitrate — see memory feedback_grain_pass_inflates_bitrate).
    out = run / "master-final.mp4"
    grain = "[0:v]eq=contrast=1.06:saturation=0.93,hqdn3d=1.5:1.5:3:3,noise=alls=9:allf=t+u[v]"
    music = gen / "music-bed.m4a"
    if args.no_music or not music.exists():
        subprocess.run([
            "ffmpeg", "-y", "-hide_banner", "-loglevel", "error", "-i", str(composite),
            "-filter_complex", grain, "-map", "[v]",
            "-c:v", "libx264", "-pix_fmt", "yuv420p", "-crf", "23",
            "-maxrate", "12M", "-bufsize", "24M", "-preset", "medium",
            "-movflags", "+faststart", "-t", str(dur), str(out),
        ], check=True)
    else:
        subprocess.run([
            "ffmpeg", "-y", "-hide_banner", "-loglevel", "error",
            "-i", str(composite), "-i", str(music),
            "-filter_complex", grain, "-map", "[v]", "-map", "1:a:0",
            "-c:v", "libx264", "-pix_fmt", "yuv420p", "-crf", "23",
            "-maxrate", "12M", "-bufsize", "24M", "-preset", "medium",
            "-c:a", "aac", "-b:a", "192k",
            "-movflags", "+faststart", "-t", str(dur), str(out),
        ], check=True)
    print(f"[master] {out}")
    subprocess.run([
        "ffprobe", "-v", "error", "-show_entries",
        "stream=codec_name,width,height,r_frame_rate,duration",
        "-show_entries", "format=duration,bit_rate", "-of", "default=nw=1", str(out),
    ])


if __name__ == "__main__":
    main()

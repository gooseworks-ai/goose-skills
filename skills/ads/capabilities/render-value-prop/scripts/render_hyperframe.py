#!/usr/bin/env python3
"""Render an HTML hyperframe to MP4 via Playwright + ffmpeg.

Frame-by-frame screencast: scrubs the page's animation timeline by calling
``window.renderAt(t_seconds)`` once per frame, then encodes the screenshots
via ffmpeg. Deterministic and pixel-perfect.

The HTML composition MUST expose a global ``window.renderAt(t_seconds)`` that
sets every animation's ``currentTime`` to the supplied time. See the skill's
SKILL.md for the contract. (Older versions of this script mutated
``document.timeline.currentTime`` directly, which is read-only in modern
Chromium and silently no-ops — that bug shipped klarify/run-04 with
identical frames at every time step before being caught in run-05's review.)

Usage:
    render_hyperframe.py <input.html> <output.mp4> <duration_sec>
        [--fps=25] [--width=736] [--height=1312] [--font-wait=300]
"""
import argparse, os, subprocess, tempfile, shutil
from pathlib import Path
from playwright.sync_api import sync_playwright


def render(html_path, out_mp4, duration, fps=25, width=736, height=1312,
           font_wait=300, with_audio_track=True):
    html_path = os.path.abspath(html_path)
    out_mp4 = os.path.abspath(out_mp4)
    tmp = Path(tempfile.mkdtemp(prefix="hyperframe_"))
    frames_dir = tmp / "frames"
    frames_dir.mkdir()

    with sync_playwright() as p:
        browser = p.chromium.launch()
        ctx = browser.new_context(
            viewport={"width": width, "height": height},
            device_scale_factor=1,
        )
        page = ctx.new_page()
        page.goto(f"file://{html_path}")
        page.wait_for_load_state("networkidle")

        # Wait for web fonts to settle. CDN-loaded fonts (Bricolage Grotesque,
        # Inter) only finish layout *after* networkidle on Linux Chromium —
        # without this, the first few hundred ms of every render show
        # system-fallback fonts.
        page.evaluate("document.fonts.ready")
        if font_wait > 0:
            page.wait_for_timeout(font_wait)

        n_frames = int(round(duration * fps))
        for i in range(n_frames):
            t_sec = i / fps
            # Contract: HTML composition exposes window.renderAt(t_seconds)
            # that scrubs document.getAnimations() to t.
            page.evaluate(f"window.renderAt({t_sec})")
            page.screenshot(
                path=str(frames_dir / f"frame_{i:05d}.png"),
                full_page=False,
                # Clip enforces viewport bounds so Bricolage Grotesque 900,
                # which occasionally renders past the body width on Linux
                # Chromium, gets trimmed instead of expanding the canvas.
                clip={"x": 0, "y": 0, "width": width, "height": height},
            )
        browser.close()

    ffmpeg_args = [
        "ffmpeg", "-y", "-loglevel", "error",
        "-framerate", str(fps),
        "-i", str(frames_dir / "frame_%05d.png"),
    ]
    # Mux a silent stereo AAC track when requested so the output mp4 is
    # concat-compatible with scene clips that have audio (the assembly
    # atoms expect every input to either have audio or none have audio).
    if with_audio_track:
        ffmpeg_args += [
            "-f", "lavfi", "-t", str(duration),
            "-i", "anullsrc=channel_layout=stereo:sample_rate=44100",
        ]
    ffmpeg_args += [
        "-c:v", "libx264",
        "-pix_fmt", "yuv420p",
        "-crf", "18",
        "-preset", "medium",
        "-r", str(fps),
    ]
    if with_audio_track:
        ffmpeg_args += ["-c:a", "aac", "-shortest"]
    ffmpeg_args += ["-movflags", "+faststart", out_mp4]

    subprocess.run(ffmpeg_args, check=True)
    shutil.rmtree(tmp)
    print(f"rendered {out_mp4} ({duration}s @ {fps}fps, {width}x{height})")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("html")
    parser.add_argument("output_mp4")
    parser.add_argument("duration", type=float)
    parser.add_argument("--fps", type=int, default=25)
    parser.add_argument("--width", type=int, default=736)
    parser.add_argument("--height", type=int, default=1312)
    parser.add_argument("--font-wait", type=int, default=300,
                        help="Extra ms to wait after document.fonts.ready (default 300)")
    parser.add_argument("--no-audio-track", action="store_true",
                        help="Skip muxing a silent stereo AAC track")
    args = parser.parse_args()
    render(args.html, args.output_mp4, args.duration,
           fps=args.fps, width=args.width, height=args.height,
           font_wait=args.font_wait,
           with_audio_track=not args.no_audio_track)

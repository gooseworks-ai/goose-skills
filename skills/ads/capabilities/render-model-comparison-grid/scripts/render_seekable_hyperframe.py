#!/usr/bin/env python3
"""Render a seekable HTML hyperframe to MP4 (video-cell aware).

The HTML must expose:
  window.renderAt(seconds) -> may return a Promise (awaited per frame; this is
                              how <video> cells seek deterministically)
  window.mediaReady()      -> optional Promise; awaited once before the frame loop

Usage:
  python3 render_seekable_hyperframe.py <input.html> <out.mp4> <duration> \
      [--fps 30] [--width 1280] [--height 720]
"""
import argparse
import os
import subprocess
import tempfile
from pathlib import Path

from playwright.sync_api import sync_playwright


def render(html_path, out_mp4, duration, fps, width, height):
    html_path = os.path.abspath(html_path)
    out_mp4 = os.path.abspath(out_mp4)
    tmp = Path(tempfile.mkdtemp(prefix="cmpgrid_hyperframe_"))
    frames_dir = tmp / "frames"
    frames_dir.mkdir()

    with sync_playwright() as p:
        browser = p.chromium.launch()
        ctx = browser.new_context(viewport={"width": width, "height": height},
                                  device_scale_factor=1)
        page = ctx.new_page()
        page.goto(f"file://{html_path}")
        page.wait_for_load_state("networkidle")
        page.evaluate("document.fonts && document.fonts.ready")
        # Wait for all <video>/<img> cells to be decodable before frame-stepping.
        page.evaluate("window.mediaReady ? window.mediaReady() : null")

        n_frames = int(round(duration * fps))
        for i in range(n_frames):
            t = i / fps
            # page.evaluate awaits a returned Promise, so video seeks settle
            # before the screenshot.
            page.evaluate("(t) => window.renderAt(t)", t)
            page.screenshot(path=str(frames_dir / f"frame_{i:05d}.png"), full_page=False)

        browser.close()

    subprocess.run(
        ["ffmpeg", "-y", "-loglevel", "warning",
         "-framerate", str(fps), "-i", str(frames_dir / "frame_%05d.png"),
         "-c:v", "libx264", "-pix_fmt", "yuv420p", "-crf", "18", "-preset", "medium",
         out_mp4],
        check=True,
    )
    print(f"Rendered {out_mp4} ({duration}s @ {fps}fps, {width}x{height})")


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("html")
    ap.add_argument("out_mp4")
    ap.add_argument("duration", type=float)
    ap.add_argument("--fps", type=int, default=30)
    ap.add_argument("--width", type=int, default=1280)
    ap.add_argument("--height", type=int, default=720)
    a = ap.parse_args()
    render(a.html, a.out_mp4, a.duration, a.fps, a.width, a.height)

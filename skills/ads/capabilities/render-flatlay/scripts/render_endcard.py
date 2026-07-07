#!/usr/bin/env python3
"""Render the brand end-card HTML to a static-dwell mp4 (Playwright screenshot →
ffmpeg loop). Free/deterministic. The end-card HTML is the brand's own template
(wordmark + trust icons + CTA pill).

Usage:  render_endcard.py --config config.json --run-dir <run>
Output: <run>/generated/end-card.mp4  (dwell_sec, canvas size)
Fallback (no Playwright): screenshot the HTML via the chrome-devtools MCP → the
ffmpeg loop below.
"""
import argparse
import asyncio
import json
import pathlib
import subprocess

from playwright.async_api import async_playwright


async def shot(html, png, W, H):
    async with async_playwright() as p:
        b = await p.chromium.launch()
        ctx = await b.new_context(viewport={"width": W, "height": H}, device_scale_factor=1)
        page = await ctx.new_page()
        await page.goto(pathlib.Path(html).resolve().as_uri())
        await page.evaluate("document.fonts.ready")
        await page.wait_for_timeout(400)
        await page.screenshot(path=str(png), clip={"x": 0, "y": 0, "width": W, "height": H})
        await b.close()


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--config", required=True)
    ap.add_argument("--run-dir", required=True)
    args = ap.parse_args()
    cfg = json.loads(pathlib.Path(args.config).read_text())
    run = pathlib.Path(args.run_dir)
    W, H = cfg.get("width", 1080), cfg.get("height", 1920)
    fps = cfg.get("fps", 30)
    ec = cfg["end_card"]
    dwell = ec.get("dwell_sec", 3.0)
    gen = run / "generated"
    gen.mkdir(parents=True, exist_ok=True)
    png = gen / "end-card-frame.png"
    out = gen / "end-card.mp4"

    asyncio.run(shot(run / ec["html"], png, W, H))
    subprocess.run([
        "ffmpeg", "-y", "-hide_banner", "-loglevel", "error",
        "-loop", "1", "-i", str(png), "-t", str(dwell),
        "-r", str(fps), "-c:v", "libx264", "-pix_fmt", "yuv420p", "-crf", "18",
        "-movflags", "+faststart", str(out),
    ], check=True)
    print(f"[endcard] {out}  ({dwell}s @ {fps}fps)")


if __name__ == "__main__":
    main()

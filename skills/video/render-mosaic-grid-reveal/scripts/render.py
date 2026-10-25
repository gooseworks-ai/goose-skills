#!/usr/bin/env python3
"""Frame-step a promo-card hyperframe.html → silent mp4 (Playwright + ffmpeg).

Pure-function-of-time: calls window.renderAt(t) per frame and screenshots — fully
deterministic, no paid calls. Reads dims/fps/duration from config.json.

Usage:  render.py --config config.json --html <run>/hyperframe.html --out <run>/master-silent.mp4
Fallback (no Playwright): screenshot the HTML at N frame times via the chrome-devtools
MCP (evaluate window.renderAt(t) → screenshot) and encode with the ffmpeg block below.
"""
import argparse
import asyncio
import json
import pathlib
import shutil
import subprocess

from playwright.async_api import async_playwright


async def run(cfg, html_path, out_path):
    fps = cfg.get("fps", 25)
    dur = cfg.get("duration_sec", 10.0)
    W, H = cfg.get("width", 1080), cfg.get("height", 1920)
    scratch = out_path.parent / "_scratch_frames"
    if scratch.exists():
        shutil.rmtree(scratch)
    scratch.mkdir(parents=True)

    async with async_playwright() as p:
        b = await p.chromium.launch(args=["--autoplay-policy=no-user-gesture-required"])
        ctx = await b.new_context(viewport={"width": W, "height": H}, device_scale_factor=1)
        page = await ctx.new_page()
        await page.goto(html_path.resolve().as_uri())
        await page.wait_for_function("window.__driverReady === true", timeout=15000)
        await page.evaluate("document.fonts.ready")
        n = round(dur * fps)
        for i in range(n):
            t = i / fps
            await page.evaluate(f"window.renderAt({t})")
            await page.evaluate("new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)))")
            await page.screenshot(path=str(scratch / f"frame_{i:04d}.png"),
                                  clip={"x": 0, "y": 0, "width": W, "height": H})
        await b.close()

    subprocess.run(["ffmpeg", "-y", "-framerate", str(fps),
                    "-i", str(scratch / "frame_%04d.png"),
                    "-c:v", "libx264", "-pix_fmt", "yuv420p", "-crf", "18", "-r", str(fps),
                    "-movflags", "+faststart", str(out_path)], check=True)
    shutil.rmtree(scratch)
    print(f"[render] {out_path}")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--config", required=True)
    ap.add_argument("--html", required=True)
    ap.add_argument("--out", required=True)
    args = ap.parse_args()
    cfg = json.loads(pathlib.Path(args.config).read_text())
    asyncio.run(run(cfg, pathlib.Path(args.html), pathlib.Path(args.out)))


if __name__ == "__main__":
    main()

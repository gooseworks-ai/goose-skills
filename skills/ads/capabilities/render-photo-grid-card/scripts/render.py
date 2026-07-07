#!/usr/bin/env python3
"""Frame-step a scrolling promo-card hyperframe.html -> silent mp4 (Playwright + ffmpeg).

The card scrolls continuously and its tiles contain clips. Playwright's bundled Chromium
can't decode <video> H.264 over file:// (open-source build, no proprietary codecs) and hangs
on `canplay`, so we DON'T use <video>: build_card emits each clip tile as an <img class=
"vidframe" data-clip=... data-src=...>, and this renderer pre-extracts every clip to PNG
frames with ffmpeg (which decodes fine), preloads them, and swaps each vidframe's src per
output frame — codec-independent AND deterministic (a pure function of time). Reads
dims/fps/duration from config.json. FREE (no paid calls).

Usage:  render.py --config config.json --html hyperframe.html --out master-silent.mp4
"""
import argparse, asyncio, json, pathlib, shutil, subprocess
from playwright.async_api import async_playwright

async def run(cfg, html_path, out_path):
    fps = cfg.get("fps",25); dur = cfg.get("duration_sec",10.0)
    W,H = cfg.get("width",1080), cfg.get("height",1920)
    html_dir = html_path.resolve().parent

    # 1) pre-extract each unique clip to PNG frames at fps (ffmpeg decodes; Chromium doesn't)
    srcs = {pathlib.Path(t["src"]).stem: t["src"]
            for t in cfg.get("tiles",[]) if t.get("type") == "video"}
    cliproot = html_dir / "_clipframes"
    if cliproot.exists(): shutil.rmtree(cliproot)
    clips = {}
    for stem, src in srcs.items():
        d = cliproot / stem; d.mkdir(parents=True)
        subprocess.run(["ffmpeg","-v","error","-i", str(html_dir / src),
                        "-vf", f"fps={fps}", str(d / "f_%04d.png")], check=True)
        clips[stem] = len(list(d.glob("f_*.png")))

    scratch = out_path.parent / "_scratch_frames"
    if scratch.exists(): shutil.rmtree(scratch)
    scratch.mkdir(parents=True)
    async with async_playwright() as p:
        b = await p.chromium.launch(args=["--autoplay-policy=no-user-gesture-required"])
        ctx = await b.new_context(viewport={"width":W,"height":H}, device_scale_factor=1)
        page = await ctx.new_page()
        await page.goto(html_path.resolve().as_uri())
        await page.wait_for_function("window.__driverReady === true", timeout=15000)
        await page.evaluate("document.fonts.ready")
        if clips:
            # warm the cache: preload every clip frame so per-frame swaps decode instantly
            await page.evaluate("""(clips)=>{
                window.__clips = clips;
                window.__pre = Promise.all(Object.entries(clips).flatMap(([c,n]) =>
                    Array.from({length:n}, (_,k) => new Promise(r => {
                        const im = new Image(); im.onload = im.onerror = r;
                        im.src = `_clipframes/${c}/f_${String(k+1).padStart(4,'0')}.png`;
                    }))));
            }""", clips)
            await page.evaluate("window.__pre")
        n = round(dur*fps)
        for i in range(n):
            t = i/fps
            await page.evaluate(f"window.renderAt({t})")
            if clips:
                await page.evaluate("""(i)=>{
                    document.querySelectorAll('.vidframe').forEach(v => {
                        const c = v.dataset.clip, n = window.__clips && window.__clips[c];
                        if (!n) return;
                        const s = `_clipframes/${c}/f_${String((i%n)+1).padStart(4,'0')}.png`;
                        if (v.getAttribute('src') !== s) v.src = s;
                    });
                }""", i)
                await page.evaluate("Promise.all(Array.from(document.querySelectorAll('.vidframe')).map(v=>v.decode?v.decode().catch(()=>{}):0))")
            await page.evaluate("new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)))")
            await page.screenshot(path=str(scratch/f"frame_{i:04d}.png"),
                                  clip={"x":0,"y":0,"width":W,"height":H})
        await b.close()
    subprocess.run(["ffmpeg","-y","-framerate",str(fps),"-i",str(scratch/"frame_%04d.png"),
        "-c:v","libx264","-pix_fmt","yuv420p","-crf","18","-r",str(fps),
        "-movflags","+faststart",str(out_path)], check=True)
    shutil.rmtree(scratch)
    shutil.rmtree(cliproot, ignore_errors=True)
    print(f"[render] {out_path}")

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--config", required=True); ap.add_argument("--html", required=True)
    ap.add_argument("--out", required=True)
    a = ap.parse_args()
    cfg = json.loads(pathlib.Path(a.config).read_text())
    asyncio.run(run(cfg, pathlib.Path(a.html), pathlib.Path(a.out)))

if __name__ == "__main__":
    main()

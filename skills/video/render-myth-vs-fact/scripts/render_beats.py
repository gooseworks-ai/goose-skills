#!/usr/bin/env python3
"""render_beats.py — deterministically render each myth-vs-fact beat to an mp4.

Ports the validated Playwright + ffmpeg renderer from the Clinikally "acne myths" run,
generalized to be config-driven and portable (no hardcoded /Users or clients/ paths).

For every `mg` beat the renderer:
  1. picks the role template under hyperframes/ (hook | myth-fact | turn | proof | punch),
  2. injects the beat's spec + palette + fonts as `window.BEAT` (so ONE template renders
     any myth/fact pair — the copy + cue times all come from config),
  3. drives `window.renderAt(t)` frame-by-frame via Playwright, screenshots each frame,
  4. pipes the frames to ffmpeg at EXACTLY the configured fps (default 25/1 — a mismatch
     makes the concat demuxer silently drop frames), muxing a silent AAC placeholder track
     so the concat demuxer is happy.

The final `end-card` beat is NOT rendered from HTML — it is built from the pre-supplied
brand end_card_png (scaled/cropped to the canvas with a short fade-up). NEVER generate the
end card per run.

Animation is a PURE function of beat-local time (no setTimeout / CSS keyframes), so seeks
are frame-exact and the render is fully reproducible.

Usage:
  render_beats.py --config config.json --work-dir /path/to/work [--only 01 02]

Requires: Playwright (chromium) + ffmpeg/ffprobe.  pip install playwright && playwright install chromium
"""
import argparse, json, os, subprocess, sys, tempfile, shutil
from pathlib import Path

HERE = Path(__file__).resolve().parent
HF = HERE / "hyperframes"

# role -> template filename under hyperframes/
ROLE_TEMPLATE = {
    "hook": "beat-hook.html",
    "myth-fact": "beat-myth-fact.html",
    "turn": "beat-turn.html",
    "proof": "beat-proof.html",
    "punch": "beat-punch.html",
}


def ffprobe_rate(path):
    r = subprocess.run(
        ["ffprobe", "-v", "error", "-select_streams", "v:0",
         "-show_entries", "stream=r_frame_rate", "-of", "csv=p=0", str(path)],
        capture_output=True, text=True)
    return r.stdout.strip()


def render_html_beat(template, out_mp4, duration, beat_spec, fps, w, h):
    """Playwright: inject window.BEAT, step renderAt(t) per frame, screenshot -> ffmpeg."""
    from playwright.sync_api import sync_playwright

    # Copy the template + shared assets into an isolated dir so relative _shared.* resolve
    # and window.BEAT is injected before the page's own script runs.
    tmp = Path(tempfile.mkdtemp(prefix="mvf_"))
    frames_dir = tmp / "frames"
    frames_dir.mkdir()
    for asset in ("_shared.css", "_shared.js"):
        shutil.copy(HF / asset, tmp / asset)
    page_html = tmp / "page.html"
    src = (HF / template).read_text()
    inject = f"<script>window.BEAT = {json.dumps(beat_spec)};</script>\n"
    # inject BEFORE _shared.js so loadBeatSpec() picks up window.BEAT.
    src = src.replace('<script src="_shared.js"></script>',
                      inject + '<script src="_shared.js"></script>')
    page_html.write_text(src)

    with sync_playwright() as p:
        browser = p.chromium.launch()
        ctx = browser.new_context(viewport={"width": w, "height": h}, device_scale_factor=1)
        page = ctx.new_page()
        page.goto(f"file://{page_html}")
        page.wait_for_load_state("networkidle")
        page.evaluate("document.fonts.ready")
        page.wait_for_timeout(300)  # let web fonts settle after networkidle
        n_frames = int(round(duration * fps))
        for i in range(n_frames):
            page.evaluate(f"window.renderAt({i / fps})")
            page.screenshot(path=str(frames_dir / f"frame_{i:05d}.png"),
                            clip={"x": 0, "y": 0, "width": w, "height": h})
        browser.close()

    subprocess.run([
        "ffmpeg", "-y", "-loglevel", "error",
        "-framerate", str(fps), "-i", str(frames_dir / "frame_%05d.png"),
        "-f", "lavfi", "-t", f"{duration}", "-i",
        "anullsrc=channel_layout=stereo:sample_rate=44100",
        "-c:v", "libx264", "-pix_fmt", "yuv420p", "-crf", "18", "-preset", "medium",
        "-r", str(fps), "-c:a", "aac", "-shortest", "-movflags", "+faststart",
        str(out_mp4),
    ], check=True)
    shutil.rmtree(tmp)


def build_end_card(png, out_mp4, duration, fps, w, h, fade=0.35):
    """Static end card: scale/crop the pre-built brand PNG to the canvas + a short fade-up."""
    vf = (f"scale={w}:{h}:force_original_aspect_ratio=increase,crop={w}:{h},"
          f"format=yuv420p,fade=t=in:st=0:d={fade}")
    subprocess.run([
        "ffmpeg", "-y", "-loglevel", "error",
        "-loop", "1", "-framerate", str(fps), "-t", f"{duration}", "-i", str(png),
        "-f", "lavfi", "-t", f"{duration}", "-i",
        "anullsrc=channel_layout=stereo:sample_rate=44100",
        "-vf", vf, "-r", str(fps),
        "-c:v", "libx264", "-pix_fmt", "yuv420p", "-crf", "18", "-preset", "medium",
        "-c:a", "aac", "-shortest", "-movflags", "+faststart", str(out_mp4),
    ], check=True)


def main():
    ap = argparse.ArgumentParser(description="Render each myth-vs-fact beat to mp4.")
    ap.add_argument("--config", required=True)
    ap.add_argument("--work-dir", required=True)
    ap.add_argument("--only", nargs="*", help="render only these beat ids (e.g. 01 02)")
    a = ap.parse_args()

    cfg = json.load(open(a.config))
    fps = int(cfg.get("fps", 25))
    w = int(cfg.get("width", 1080))
    h = int(cfg.get("height", 1920))
    palette = cfg.get("palette", {})
    fonts = cfg.get("fonts", {})
    display_font = cfg.get("display_font")
    brand_name = cfg.get("brand_name", "")
    end_card_png = cfg.get("end_card_png")

    work = Path(a.work_dir)
    frames = work / "frames"
    frames.mkdir(parents=True, exist_ok=True)

    failed = []
    for b in cfg["beats"]:
        n = b["n"]
        if a.only and n not in a.only:
            continue
        role = b.get("role")
        dur = float(b["duration"])
        out = frames / f"beat-{n}.mp4"

        if role == "end-card":
            if not end_card_png or not os.path.exists(end_card_png):
                print(f"  FAILED beat-{n}: end_card_png missing ({end_card_png})")
                failed.append(n); continue
            print(f"[end-card] beat-{n} ({dur}s)")
            build_end_card(end_card_png, out, dur, fps, w, h,
                           fade=float(cfg.get("end_card_fade", 0.35)))
            continue

        template = ROLE_TEMPLATE.get(role)
        if not template:
            print(f"  FAILED beat-{n}: unknown role '{role}'")
            failed.append(n); continue

        # Build the per-beat window.BEAT spec: palette + fonts + duration + the beat's copy.
        spec = dict(b)
        spec["palette"] = palette
        spec["brand_name"] = spec.get("brand_name", brand_name)
        if display_font:
            spec["display_font"] = display_font
        if fonts:
            spec["fonts"] = fonts

        print(f"[render] beat-{n} ({role}, {dur}s) -> {template}")
        try:
            render_html_beat(template, out, dur, spec, fps, w, h)
        except Exception as e:
            print(f"  FAILED beat-{n}: {e}")
            failed.append(n); continue

        rate = ffprobe_rate(out)
        if rate != f"{fps}/1":
            print(f"  WARN beat-{n} r_frame_rate={rate} (expected {fps}/1)")

    if failed:
        print(f"\nFailed beats: {failed}")
        sys.exit(1)
    print("\nAll requested beats rendered.")


if __name__ == "__main__":
    main()

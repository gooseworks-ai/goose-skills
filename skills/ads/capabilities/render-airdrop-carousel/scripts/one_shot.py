#!/usr/bin/env python3
"""one_shot.py — end-to-end AirDrop product-carousel ad from a single config.

Reads a JSON config, then: build_card.py -> headless-Chrome screenshot of both
card states -> compose_carousel.py. One call, one MP4. Portable: every path comes
from --config, everything is written under --work-dir (defaults next to --out).

Config schema (see scripts/config.example.json):
{
  "brand": "acme.",
  "message": "would like to share a candle",
  "tagline": "The bestselling collection - 4.9 stars",
  "wordmark_svg": "/abs/path/logo.svg",     # optional; else text wordmark = brand
  "accent": "#d98695",                       # Accept-button / brand accent
  "band_color": "#f5e9da",
  "images": ["/abs/p1.png", "/abs/p2.png", ...],   # ordered carousel (real product photos)
  "final_image": "/abs/lineup.jpg",          # payoff held at the end
  "width": 1080, "height": 1920,             # optional (default 9:16 1080x1920)
  "timing": {"per": 0.34, "first_hold": 1.0, "final_hold": 2.1, "slide": 0.72}
}

Duration is DERIVED: first_hold + (N-1)*per + final_hold. Add images or raise
`per` to lengthen; never trim the audio short.

The screenshot step uses Playwright if installed (`pip install playwright &&
playwright install chromium`). If Playwright is unavailable, run build_card.py
yourself, screenshot chrome.html / chrome-pressed.html (fullPage) to
chrome-green.png / chrome-green-pressed.png via the chrome-devtools MCP, then call
compose_carousel.py directly — see SKILL.md Phase 3.
"""
import argparse, json, os, subprocess, sys

HERE = os.path.dirname(os.path.abspath(__file__))


def shoot(html_path, out_png, width, height):
    """Screenshot a card HTML (fullPage) via Playwright chromium."""
    try:
        from playwright.sync_api import sync_playwright
    except ImportError:
        sys.exit("Playwright not installed. Either `pip install playwright && playwright "
                 "install chromium`, or screenshot the HTML via the chrome-devtools MCP "
                 "(see SKILL.md Phase 3) and run compose_carousel.py directly.")
    with sync_playwright() as pw:
        b = pw.chromium.launch()
        pg = b.new_page(viewport={"width": width, "height": height}, device_scale_factor=2)
        pg.goto("file://" + os.path.abspath(html_path))
        pg.wait_for_timeout(300)
        pg.screenshot(path=out_png, full_page=True)
        b.close()


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--config", required=True)
    ap.add_argument("--out", required=True)
    ap.add_argument("--work-dir", default="")
    ap.add_argument("--no-audio", action="store_true")
    a = ap.parse_args()
    cfg = json.load(open(a.config))
    work = a.work_dir or os.path.join(os.path.dirname(a.out) or ".", "airdrop_work")
    os.makedirs(work, exist_ok=True)
    W, H = int(cfg.get("width", 1080)), int(cfg.get("height", 1920))

    # 1. card HTML
    cmd = [sys.executable, os.path.join(HERE, "build_card.py"),
           "--brand", cfg["brand"], "--message", cfg["message"],
           "--tagline", cfg.get("tagline", ""), "--accent", cfg.get("accent", "#d98695"),
           "--band-color", cfg.get("band_color", "#f5e9da"), "--out-dir", work]
    if cfg.get("wordmark_svg"):
        cmd += ["--wordmark-svg", cfg["wordmark_svg"]]
    if cfg.get("wordmark_text"):
        cmd += ["--wordmark-text", cfg["wordmark_text"]]
    subprocess.run(cmd, check=True)

    # 2. screenshot both states
    shoot(os.path.join(work, "chrome.html"), os.path.join(work, "chrome-green.png"), W, H)
    shoot(os.path.join(work, "chrome-pressed.html"), os.path.join(work, "chrome-green-pressed.png"), W, H)

    # 3. compose
    tm = cfg.get("timing", {})
    cmd = [sys.executable, os.path.join(HERE, "compose_carousel.py"),
           "--chrome", os.path.join(work, "chrome-green.png"),
           "--chrome-pressed", os.path.join(work, "chrome-green-pressed.png"),
           "--images", ",".join(cfg["images"]), "--final-image", cfg["final_image"],
           "--out", a.out, "--width", str(W), "--height", str(H),
           "--per", str(tm.get("per", 0.34)), "--first-hold", str(tm.get("first_hold", 1.0)),
           "--final-hold", str(tm.get("final_hold", 2.1)), "--slide", str(tm.get("slide", 0.72))]
    if a.no_audio:
        cmd.append("--no-audio")
    subprocess.run(cmd, check=True)
    print(f"DONE -> {a.out}")


if __name__ == "__main__":
    main()

#!/usr/bin/env python3
"""one_shot.py — end-to-end AirDrop product-carousel ad from a single config.

Reads a JSON config, then: build_card.py -> headless-Chrome screenshot of both
card states -> compose_carousel.py. One call, one MP4.

Config schema (see demo/working/config.json):
{
  "brand": "dibs.",
  "message": "would like to share a blush",
  "tagline": "The viral Desert Island Duo - 1M+ sold",
  "wordmark_svg": "/abs/path/logo.svg",     # optional; else text wordmark = brand
  "accent": "#d98695",                       # Accept-button / brand accent
  "band_color": "#f5e9da",
  "images": ["/abs/p1.png", "/abs/p2.png", ...],   # ordered carousel (real product photos)
  "final_image": "/abs/lineup.jpg",          # payoff held at the end
  "timing": {"per": 0.34, "first_hold": 1.0, "final_hold": 2.1, "slide": 0.72}
}

The screenshot step uses Playwright if installed (`pip install playwright &&
playwright install chromium`). If Playwright is unavailable, run build_card.py
yourself, screenshot chrome.html / chrome-pressed.html (fullPage) to
chrome-green.png / chrome-green-pressed.png via another headless Chrome, then call
compose_carousel.py directly — see SKILL.md Phase 3.
"""
import argparse, json, os, subprocess, sys

HERE = os.path.dirname(os.path.abspath(__file__))


def shoot(html_path, out_png):
    """Screenshot a card HTML (fullPage) via Playwright chromium."""
    try:
        from playwright.sync_api import sync_playwright
    except ImportError:
        sys.exit("Playwright not installed. Either `pip install playwright && playwright "
                 "install chromium`, or screenshot the HTML via another headless Chrome "
                 "(see SKILL.md Phase 3) and run compose_carousel.py directly.")
    with sync_playwright() as pw:
        b = pw.chromium.launch()
        pg = b.new_page(viewport={"width": 1080, "height": 1920}, device_scale_factor=2)
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

    # 1. card HTML
    cmd = [sys.executable, os.path.join(HERE, "build_card.py"),
           "--brand", cfg["brand"], "--message", cfg["message"],
           "--tagline", cfg.get("tagline", ""), "--accent", cfg.get("accent", "#d98695"),
           "--band-color", cfg.get("band_color", "#f5e9da"), "--out-dir", work]
    if cfg.get("wordmark_svg"):
        cmd += ["--wordmark-svg", cfg["wordmark_svg"]]
    subprocess.run(cmd, check=True)

    # 2. screenshot both states
    shoot(os.path.join(work, "chrome.html"), os.path.join(work, "chrome-green.png"))
    shoot(os.path.join(work, "chrome-pressed.html"), os.path.join(work, "chrome-green-pressed.png"))

    # 3. compose
    tm = cfg.get("timing", {})
    cmd = [sys.executable, os.path.join(HERE, "compose_carousel.py"),
           "--chrome", os.path.join(work, "chrome-green.png"),
           "--chrome-pressed", os.path.join(work, "chrome-green-pressed.png"),
           "--images", ",".join(cfg["images"]), "--final-image", cfg["final_image"],
           "--out", a.out,
           "--per", str(tm.get("per", 0.34)), "--first-hold", str(tm.get("first_hold", 1.0)),
           "--final-hold", str(tm.get("final_hold", 2.1)), "--slide", str(tm.get("slide", 0.72))]
    if a.no_audio:
        cmd.append("--no-audio")
    subprocess.run(cmd, check=True)
    print(f"DONE -> {a.out}")


if __name__ == "__main__":
    main()

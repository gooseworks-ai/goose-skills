#!/usr/bin/env python3
"""build_endcard.py — the deterministic Beat-4 brand close (FREE, no AI text).

Composites a typographic end card: the stilled Beat-1 last frame + a scrim +
a Playfair Display headline + the brand's REAL wordmark (recolored for
contrast). Renders at 1080x1920 via Playwright, then ffmpeg-scales to 720x1280
(matching the viewport to the output dims clips the right edge). The brand text
is NEVER AI-rendered — a diffusion model garbles a wordmark, so the lockup is
composited from the real asset every time.

  build_endcard.py --bg beat1_last_frame.png --headline "YOUR SANCTUARY AT HOME" \
      --wordmark casablui-logo.svg --out endcard.png \
      [--headline-size 86] [--headline-color auto|#F6F1E7|#2A1F26] [--bg-is dark|light]

Requires: a Playwright Chromium (via scripts/shoot.js) and ffmpeg. If the npx
Playwright wants an uninstalled browser build, export PW_CHROME=<installed
Chromium binary> — shoot.js honours it.
"""
import argparse
import base64
import html as htmlmod
import os
import pathlib
import subprocess
import sys
import tempfile

HERE = pathlib.Path(__file__).resolve().parent
LIGHT = "#F6F1E7"   # warm white — for dark/saturated brand backgrounds
DARK = "#2A1F26"    # ink — for light/pastel brand backgrounds


def _avg_luma(png_path):
    """Rough mean luminance (0-255) of the bg, to auto-pick a legible text color."""
    try:
        from PIL import Image
        im = Image.open(png_path).convert("RGB").resize((32, 32))
        px = list(im.getdata())
        return sum(0.299 * r + 0.587 * g + 0.114 * b for r, g, b in px) / len(px)
    except Exception:
        return 60.0  # assume dark -> warm-white text


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--bg", required=True, help="background image (Beat 1 last frame)")
    ap.add_argument("--headline", required=True)
    ap.add_argument("--wordmark", required=True, help="brand wordmark .svg or .png")
    ap.add_argument("--out", required=True, help="output PNG (scaled to 720x1280)")
    ap.add_argument("--headline-size", type=int, default=86)
    ap.add_argument("--headline-color", default="auto", help="'auto' | hex")
    ap.add_argument("--width", type=int, default=1080)
    ap.add_argument("--height", type=int, default=1920)
    ap.add_argument("--scale-w", type=int, default=720)
    ap.add_argument("--scale-h", type=int, default=1280)
    a = ap.parse_args()

    color = a.headline_color
    if color == "auto":
        color = LIGHT if _avg_luma(a.bg) < 128 else DARK

    b64 = base64.b64encode(pathlib.Path(a.bg).read_bytes()).decode()
    wm_path = pathlib.Path(a.wordmark)
    if wm_path.suffix.lower() == ".svg":
        svg = wm_path.read_text()
        # recolor common wordmark fills to the headline color; force a sane box
        for stock in ("#000000", "#000", "#153429", "#2A1F26", "#1a1a1a", "#111111"):
            svg = svg.replace(f'fill="{stock}"', f'fill="{color}"')
        svg = svg.replace('fill="none"', 'fill="none" style="width:340px;height:auto;display:block"', 1)
        wordmark_html = f'<div class="wordmark">{svg}</div>'
    else:
        wm_b64 = base64.b64encode(wm_path.read_bytes()).decode()
        mime = "image/png" if wm_path.suffix.lower() == ".png" else "image/jpeg"
        wordmark_html = f'<img class="wordmark" src="data:{mime};base64,{wm_b64}">'

    # scrim: darken bottom for legibility regardless of headline color
    doc = f"""<!doctype html><html><head><meta charset="utf-8">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700&display=swap" rel="stylesheet">
<style>
  * {{ margin:0; padding:0; box-sizing:border-box; }}
  html,body {{ width:{a.width}px; height:{a.height}px; overflow:hidden; }}
  .stage {{ position:relative; width:{a.width}px; height:{a.height}px; }}
  .bg {{ position:absolute; inset:0; width:100%; height:100%; object-fit:cover; }}
  .scrim {{ position:absolute; inset:0; background:linear-gradient(180deg,
      rgba(10,14,12,.30) 0%, rgba(10,14,12,0) 34%, rgba(6,10,8,.12) 60%, rgba(4,8,6,.82) 100%); }}
  .lockup {{ position:absolute; left:0; right:0; bottom:150px; display:flex; flex-direction:column;
      align-items:center; gap:52px; padding:0 90px; }}
  .headline {{ font-family:'Playfair Display', Georgia, serif; font-weight:600; text-transform:uppercase;
      color:{color}; font-size:{a.headline_size}px; line-height:1.16; letter-spacing:.09em;
      text-align:center; text-shadow:0 3px 30px rgba(0,0,0,.55); max-width:900px; }}
  .wordmark {{ width:340px; opacity:.98; filter:drop-shadow(0 2px 14px rgba(0,0,0,.5)); }}
  .rule {{ width:64px; height:2px; background:{color}; opacity:.7; }}
</style></head>
<body><div class="stage">
  <img class="bg" src="data:image/png;base64,{b64}">
  <div class="scrim"></div>
  <div class="lockup">
    <div class="headline">{htmlmod.escape(a.headline)}</div>
    <div class="rule"></div>
    {wordmark_html}
  </div>
</div></body></html>"""

    tmp_html = pathlib.Path(tempfile.mktemp(suffix=".html"))
    tmp_html.write_text(doc)
    raw_png = pathlib.Path(tempfile.mktemp(suffix=".png"))

    subprocess.run(
        ["node", str(HERE / "shoot.js"), tmp_html.as_uri(), str(raw_png),
         str(a.width), str(a.height), "2000"],
        check=True,
    )
    subprocess.run(
        ["ffmpeg", "-y", "-hide_banner", "-loglevel", "error", "-i", str(raw_png),
         "-vf", f"scale={a.scale_w}:{a.scale_h}", a.out],
        check=True,
    )
    print(a.out)


if __name__ == "__main__":
    sys.exit(main())

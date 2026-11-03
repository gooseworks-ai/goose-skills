#!/usr/bin/env python3
"""Generate transparent text-overlay PNGs for Variants 2 + 3 motion compositing.

Each PNG is 1080x1080 with:
  - Top 380px: white BG + headline + sub-sentence (matches static layout's text zone)
  - Bottom 700px: TRANSPARENT (motion clip shows through)

Beat 7 (endcard) is FULL frame (no transparency — replaces the motion clip entirely
for the endcard duration).

Brand colours / name / logo come from shot-list.yml `project:` or the project's
config.json (see load_theme) — nothing is baked in for one brand.
"""
import json
import sys
from pathlib import Path

try:
    import yaml
except ImportError:
    sys.exit("ERROR: pip install pyyaml")
try:
    from playwright.sync_api import sync_playwright
except ImportError:
    sys.exit("ERROR: pip install playwright && playwright install chromium")

PROJECT = Path(__file__).resolve().parent.parent
SHOT_LIST = PROJECT / "shot-list.yml"
BEATS_DIR = PROJECT / "working" / "beats-overlay"
OVERLAY_DIR = PROJECT / "assets" / "hyperframes" / "overlay"
BEATS_DIR.mkdir(parents=True, exist_ok=True)
OVERLAY_DIR.mkdir(parents=True, exist_ok=True)


# ---- brand theme (NO baked-in brand) --------------------------------------
# Colours, brand name, logo and hero image come from shot-list.yml `project:`
# (ink / bg / brand_name / logo / hero_image), falling back to the project's
# config.json (palette.ink, palette.bg, brand_name, logo). The background is the
# recipe's choices.background; ink comes from the brand kit. Neutral defaults
# only when neither says anything.
NEUTRAL_THEME = {"ink": "#111111", "bg": "#FFFFFF", "brand_name": "",
                 "logo": "source/logo.png", "hero_image": "source/hero.png"}


def load_theme(project):
    cfg = {}
    for cand in (PROJECT / "config.json", PROJECT / "scripts" / "config.json"):
        if cand.exists():
            try:
                cfg = json.loads(cand.read_text())
            except Exception:
                cfg = {}
            break
    pal = cfg.get("palette", {}) or {}
    t = dict(NEUTRAL_THEME)
    for key, val in (("ink", pal.get("ink")), ("bg", pal.get("bg")),
                     ("brand_name", cfg.get("brand_name")), ("logo", cfg.get("logo"))):
        if val and not str(val).startswith("<"):
            t[key] = val
    for key in NEUTRAL_THEME:
        if project.get(key):
            t[key] = project[key]
    h = t["ink"].lstrip("#")
    if len(h) == 3:
        h = "".join(c * 2 for c in h)
    t["ink_rgb"] = ", ".join(str(int(h[i:i + 2], 16)) for i in (0, 2, 4))
    t["logo_src"] = "../../" + str(t["logo"]).lstrip("/")
    t["hero_src"] = "../../" + str(t["hero_image"]).lstrip("/")
    return t


TEXT_OVERLAY_TEMPLATE = """<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>Overlay Beat {id}</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Instrument+Sans:ital,wght@0,400..700;1,400..700&display=swap" rel="stylesheet">
<style>
  * {{ margin: 0; padding: 0; box-sizing: border-box; }}
  html, body {{ background: transparent !important; }}
  .frame {{
    width: {width}px; height: {height}px;
    position: relative;
    background: transparent;
    font-family: "Instrument Sans", sans-serif;
    color: {ink};
  }}
  .text-zone {{
    position: absolute;
    top: 0; left: 0; right: 0;
    height: 380px;
    padding: 56px 70px 24px;
    text-align: center;
    background: {bg};
    display: flex;
    flex-direction: column;
    justify-content: center;
  }}
  .headline {{
    font-weight: {headline_weight};
    font-size: {headline_size_px}px;
    letter-spacing: {headline_letter_spacing};
    line-height: {headline_line_height};
    color: {ink};
    text-transform: {headline_text_transform};
    margin: 0;
  }}
  .sub-sentence {{
    font-weight: {sub_weight};
    font-size: {sub_size_px}px;
    letter-spacing: {sub_letter_spacing};
    line-height: 1.35;
    color: rgba({ink_rgb}, 0.78);
    margin-top: 22px;
    text-transform: {sub_text_transform};
  }}
</style>
</head>
<body>
<div class="frame">
  <div class="text-zone">
    <h1 class="headline">{headline}</h1>
    {sub_html}
  </div>
</div>
</body>
</html>
"""


ENDCARD_FULL_TEMPLATE = """<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>Overlay Endcard</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Instrument+Sans:ital,wght@0,400..700;1,400..700&display=swap" rel="stylesheet">
<style>
  * {{ margin: 0; padding: 0; box-sizing: border-box; }}
  html, body {{ background: {bg}; }}
  .frame {{
    width: {width}px; height: {height}px;
    background: {bg};
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    padding: 80px;
    font-family: "Instrument Sans", sans-serif;
  }}
  .logo {{
    width: 380px;
    margin-bottom: 80px;
  }}
  .tagline {{
    font-weight: 500;
    font-size: 124px;
    letter-spacing: -0.015em;
    line-height: 1.0;
    color: {ink};
    text-align: center;
    margin: 0;
  }}
  .cta {{
    font-weight: 500;
    font-size: 32px;
    letter-spacing: 0.18em;
    text-transform: uppercase;
    color: rgba({ink_rgb}, 0.65);
    margin-top: 80px;
  }}
</style>
</head>
<body>
<div class="frame">
  <img class="logo" src="{logo_src}" alt="{brand_name}">
  <h1 class="tagline">{tagline}</h1>
  <div class="cta">{cta}</div>
</div>
</body>
</html>
"""


def write_overlay_html(beat, project, theme):
    colours = dict(ink=theme["ink"], ink_rgb=theme["ink_rgb"], bg=theme["bg"])
    if beat.get("canvas") == "endcard":
        html = ENDCARD_FULL_TEMPLATE.format(
            **colours, logo_src=theme["logo_src"], brand_name=theme["brand_name"],
            width=project["width"],
            height=project["height"],
            tagline=beat["headline"],
            cta=beat["sub_sentence"],
        )
    else:
        sub_html = ""
        if beat.get("sub_sentence"):
            sub_html = f'<div class="sub-sentence">{beat["sub_sentence"]}</div>'
        html = TEXT_OVERLAY_TEMPLATE.format(
            **colours,
            id=beat["id"],
            width=project["width"],
            height=project["height"],
            headline=beat["headline"],
            sub_html=sub_html,
            headline_weight=beat.get("headline_weight", 600),
            headline_size_px=beat.get("headline_size_px", 124),
            headline_letter_spacing=beat.get("headline_letter_spacing_em", "-0.02em"),
            headline_line_height=beat.get("headline_line_height", 0.95),
            headline_text_transform=beat.get("headline_text_transform", "uppercase"),
            sub_weight=beat.get("sub_weight", 400),
            sub_size_px=beat.get("sub_size_px", 36) or 36,
            sub_letter_spacing=beat.get("sub_letter_spacing_em", "normal"),
            sub_text_transform=beat.get("sub_text_transform", "none"),
        )
    out = BEATS_DIR / f"overlay-{beat['id']}-{beat['slug']}.html"
    out.write_text(html)
    return out


def render(html_path, png_path, width, height, with_alpha):
    with sync_playwright() as p:
        browser = p.chromium.launch()
        ctx = browser.new_context(
            viewport={"width": width, "height": height},
            device_scale_factor=1,
        )
        page = ctx.new_page()
        page.goto(f"file://{html_path.resolve()}")
        page.wait_for_load_state("networkidle")
        page.evaluate("document.fonts.ready")
        page.wait_for_timeout(400)
        page.screenshot(
            path=str(png_path),
            full_page=False,
            clip={"x": 0, "y": 0, "width": width, "height": height},
            omit_background=with_alpha,
        )
        browser.close()


def main():
    data = yaml.safe_load(SHOT_LIST.read_text())
    project = data["project"]
    beats = data["beats"]
    theme = load_theme(project)

    print(f"Rendering {len(beats)} overlay PNGs at {project['width']}x{project['height']}...")
    for beat in beats:
        html_path = write_overlay_html(beat, project, theme)
        png_path = OVERLAY_DIR / f"overlay-{beat['id']}-{beat['slug']}.png"
        is_endcard = beat.get("canvas") == "endcard"
        render(html_path, png_path, project["width"], project["height"], with_alpha=not is_endcard)
        mode = "FULL (no alpha)" if is_endcard else "with alpha (transparent below text-zone)"
        print(f"  rendered overlay beat {beat['id']} [{mode}] → {png_path.relative_to(PROJECT)}")


if __name__ == "__main__":
    main()

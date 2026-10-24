#!/usr/bin/env python3
"""Generate beat HTMLs + render preview PNGs + assemble storyboard.html.

Reads shot-list.yml. Writes:
  working/beats/beat-N-<slug>.html        — one per beat (full-res 1080x1080)
  assets/hyperframes/preview/beat-N-<slug>.png  — Playwright-rendered preview
  storyboard.html (project root)          — gallery view of all 7 previews

Brand colours / name / logo / hero image come from shot-list.yml `project:` or the
project's config.json (see load_theme) — nothing is baked in for one brand.

Run:
  python3 scripts/build_storyboard_preview.py

Phase 2 will re-use the beat HTMLs and feed them to ffmpeg for the final mp4.
"""
import json
import subprocess
import sys
from pathlib import Path

# yaml is optional — fall back to minimal inline parser if not installed
try:
    import yaml
except ImportError:
    print("ERROR: pip install pyyaml", file=sys.stderr)
    sys.exit(1)

try:
    from playwright.sync_api import sync_playwright
except ImportError:
    print("ERROR: pip install playwright && playwright install chromium", file=sys.stderr)
    sys.exit(1)


PROJECT = Path(__file__).resolve().parent.parent
SHOT_LIST = PROJECT / "shot-list.yml"
BEATS_DIR = PROJECT / "working" / "beats"
PREVIEW_DIR = PROJECT / "assets" / "hyperframes" / "preview"
STORYBOARD = PROJECT / "storyboard.html"


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


BEAT_HTML_TEMPLATE = """<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>Beat {id} — {slug}</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Instrument+Sans:ital,wght@0,400..700;1,400..700&display=swap" rel="stylesheet">
<style>
  * {{ margin: 0; padding: 0; box-sizing: border-box; }}
  html, body {{ background: {bg}; }}
  .frame {{
    width: {width}px; height: {height}px;
    position: relative;
    background: {bg};
    overflow: hidden;
    font-family: "Instrument Sans", sans-serif;
    color: {ink};
    display: flex;
    flex-direction: column;
  }}
  .text-zone {{
    flex: 0 0 380px;
    padding: 56px 70px 24px;
    text-align: center;
    background: {bg};
    display: flex;
    flex-direction: column;
    justify-content: center;
    z-index: 2;
  }}
  .hero-bg-container {{
    flex: 1 1 auto;
    background: {bg};
    display: flex;
    align-items: flex-end;
    justify-content: center;
    overflow: hidden;
    padding: 0 40px 30px;
  }}
  .hero-bg {{
    width: 100%;
    height: 100%;
    object-fit: contain;
    object-position: center bottom;
  }}
  .headline {{
    font-family: "Instrument Sans", sans-serif;
    font-weight: {headline_weight};
    font-size: {headline_size_px}px;
    letter-spacing: {headline_letter_spacing};
    line-height: {headline_line_height};
    color: {ink};
    text-transform: {headline_text_transform};
    margin: 0;
  }}
  .sub-sentence {{
    font-family: "Instrument Sans", sans-serif;
    font-weight: {sub_weight};
    font-size: {sub_size_px}px;
    letter-spacing: {sub_letter_spacing};
    line-height: 1.35;
    color: rgba({ink_rgb}, 0.78);
    margin-top: 22px;
    text-transform: {sub_text_transform};
  }}
  /* End card composition (beat 7) */
  .endcard {{
    position: absolute;
    inset: 0;
    background: {bg};
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    text-align: center;
    padding: 80px;
  }}
  .endcard-logo {{
    width: 380px;
    margin-bottom: 80px;
  }}
  .endcard-tagline {{
    font-family: "Instrument Sans", sans-serif;
    font-weight: 500;
    font-size: 124px;
    letter-spacing: -0.015em;
    line-height: 1.0;
    color: {ink};
    margin: 0;
  }}
  .endcard-cta {{
    font-family: "Instrument Sans", sans-serif;
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
{body_html}
</div>
</body>
</html>
"""


def render_beat_body(beat, theme):
    """Render the per-beat <body> content."""
    if beat.get("canvas") == "endcard":
        return f"""<div class="endcard">
  <img class="endcard-logo" src="{theme['logo_src']}" alt="{theme['brand_name']}">
  <h1 class="endcard-tagline">{beat['headline']}</h1>
  <div class="endcard-cta">{beat['sub_sentence']}</div>
</div>"""
    # Hero canvas beats
    sub = ""
    if beat.get("sub_sentence"):
        sub = f'<div class="sub-sentence">{beat["sub_sentence"]}</div>'
    return f"""<div class="text-zone">
  <h1 class="headline">{beat['headline']}</h1>
  {sub}
</div>
<div class="hero-bg-container">
  <img class="hero-bg" src="{theme['hero_src']}" alt="">
</div>"""


def write_beat_html(beat, project, theme):
    body = render_beat_body(beat, theme)
    html = BEAT_HTML_TEMPLATE.format(
        ink=theme["ink"], ink_rgb=theme["ink_rgb"], bg=theme["bg"],
        id=beat["id"],
        slug=beat["slug"],
        width=project["width"],
        height=project["height"],
        headline_weight=beat.get("headline_weight", 600),
        headline_size_px=beat.get("headline_size_px", 124),
        headline_letter_spacing=beat.get("headline_letter_spacing_em", "-0.02em"),
        headline_line_height=beat.get("headline_line_height", 0.95),
        headline_text_transform=beat.get("headline_text_transform", "uppercase"),
        sub_weight=beat.get("sub_weight", 400),
        sub_size_px=beat.get("sub_size_px", 36) or 36,
        sub_letter_spacing=beat.get("sub_letter_spacing_em", "normal"),
        sub_text_transform=beat.get("sub_text_transform", "none"),
        body_html=body,
    )
    out = BEATS_DIR / f"beat-{beat['id']}-{beat['slug']}.html"
    out.write_text(html)
    return out


def render_preview(html_path, png_path, width, height):
    """Render an HTML file to PNG via Playwright. Returns the file path."""
    with sync_playwright() as p:
        browser = p.chromium.launch()
        ctx = browser.new_context(
            viewport={"width": width, "height": height},
            device_scale_factor=1,
        )
        page = ctx.new_page()
        page.goto(f"file://{html_path.resolve()}")
        page.wait_for_load_state("networkidle")
        # Wait for web fonts to settle (Instrument Sans from Google CDN)
        page.evaluate("document.fonts.ready")
        page.wait_for_timeout(400)
        page.screenshot(
            path=str(png_path),
            full_page=False,
            clip={"x": 0, "y": 0, "width": width, "height": height},
        )
        browser.close()
    return png_path


STORYBOARD_TEMPLATE = """<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>{brand_name} Value Prop Storyboard</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Instrument+Sans:ital,wght@0,400..700;1,400..700&display=swap" rel="stylesheet">
<style>
  * {{ margin: 0; padding: 0; box-sizing: border-box; }}
  body {{
    font-family: "Instrument Sans", sans-serif;
    background: #f5f5f7;
    color: {ink};
    padding: 40px;
    line-height: 1.4;
  }}
  h1 {{ font-size: 32px; font-weight: 600; margin-bottom: 8px; }}
  .meta {{ font-size: 14px; color: #6b6b7b; margin-bottom: 28px; }}
  .meta strong {{ color: {ink}; }}
  .grid {{
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(360px, 1fr));
    gap: 24px;
  }}
  .beat {{
    background: #fff;
    border-radius: 12px;
    overflow: hidden;
    box-shadow: 0 4px 16px rgba({ink_rgb},0.06);
  }}
  .beat-img {{
    width: 100%;
    aspect-ratio: 1/1;
    display: block;
    background: #fff;
  }}
  .beat-meta {{
    padding: 16px 20px;
    border-top: 1px solid #eef0f3;
  }}
  .beat-id {{
    font-size: 11px;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: #6b6b7b;
    margin-bottom: 4px;
  }}
  .beat-headline {{
    font-size: 16px;
    font-weight: 600;
    margin-bottom: 4px;
  }}
  .beat-sub {{
    font-size: 13px;
    color: rgba({ink_rgb},0.7);
    margin-bottom: 8px;
  }}
  .beat-notes {{
    font-size: 12px;
    color: #6b6b7b;
    font-style: italic;
  }}
  .timeline {{
    margin-top: 28px;
    padding: 20px 24px;
    background: #fff;
    border-radius: 8px;
    font-size: 13px;
    line-height: 1.6;
  }}
  .timeline strong {{ color: {ink}; }}
</style>
</head>
<body>
<h1>{brand_name} Value Prop Storyboard</h1>
<div class="meta">
  <strong>Format:</strong> Value Prop ad (silent) ·
  <strong>Aspect:</strong> {width}x{height} ·
  <strong>Duration:</strong> {total_duration}s ·
  <strong>FPS:</strong> {fps} ·
  <strong>Beats:</strong> {beat_count}
</div>
<div class="grid">
{cards}
</div>
<div class="timeline">
{timeline}
</div>
</body>
</html>
"""


def render_storyboard(project, beats, preview_paths, theme):
    cards = []
    for beat, png_path in zip(beats, preview_paths):
        rel = png_path.relative_to(PROJECT)
        sub = beat.get("sub_sentence") or "&nbsp;"
        notes = beat.get("notes", "").strip().replace("\n", " ")
        # Strip HTML <br> for storyboard text
        headline_text = beat["headline"].replace("<br>", " · ")
        cards.append(f"""<div class="beat">
  <img class="beat-img" src="{rel}" alt="Beat {beat['id']}">
  <div class="beat-meta">
    <div class="beat-id">Beat {beat['id']} · {beat['slug']} · {beat['start_s']}–{beat['end_s']}s · {beat['duration_s']}s</div>
    <div class="beat-headline">{headline_text}</div>
    <div class="beat-sub">{sub}</div>
    {'<div class="beat-notes">' + notes + '</div>' if notes else ''}
  </div>
</div>""")

    timeline_rows = []
    for beat in beats:
        timeline_rows.append(
            f'<div><strong>{beat["start_s"]:>5.1f}s – {beat["end_s"]:>5.1f}s</strong> '
            f'(beat {beat["id"]}/{beat["slug"]}) — {beat["headline"].replace("<br>", " · ")}</div>'
        )

    html = STORYBOARD_TEMPLATE.format(
        ink=theme["ink"], ink_rgb=theme["ink_rgb"], brand_name=theme["brand_name"],
        width=project["width"],
        height=project["height"],
        total_duration=beats[-1]["end_s"],
        fps=project["fps"],
        beat_count=len(beats),
        cards="\n".join(cards),
        timeline="\n".join(timeline_rows),
    )
    STORYBOARD.write_text(html)


def main():
    data = yaml.safe_load(SHOT_LIST.read_text())
    project = data["project"]
    beats = data["beats"]
    theme = load_theme(project)

    BEATS_DIR.mkdir(parents=True, exist_ok=True)
    PREVIEW_DIR.mkdir(parents=True, exist_ok=True)

    print(f"Generating {len(beats)} beat HTMLs...")
    beat_htmls = [write_beat_html(b, project, theme) for b in beats]

    print(f"Rendering {len(beats)} preview PNGs via Playwright @ {project['width']}x{project['height']}...")
    preview_paths = []
    for beat, html_path in zip(beats, beat_htmls):
        png_path = PREVIEW_DIR / f"beat-{beat['id']}-{beat['slug']}.png"
        render_preview(html_path, png_path, project["width"], project["height"])
        print(f"  rendered beat {beat['id']} → {png_path.relative_to(PROJECT)}")
        preview_paths.append(png_path)

    print(f"Assembling storyboard.html...")
    render_storyboard(project, beats, preview_paths, theme)
    print(f"  storyboard at {STORYBOARD.relative_to(PROJECT)}")
    print(f"\nopen {STORYBOARD}")


if __name__ == "__main__":
    main()

"""Render 9:16 (1080×1920) transparent overlay PNGs for the composite:
  - cold-open-card-9x16.png       config.cold_open_text lines, dead-center (cold_open_font)
  - end-card-annotated-9x16.png   specimen-sheet end card: config.end_card.lines[0] above the
                                  brand logo SVG, the remaining lines stacked below it

All copy comes from config.json (bound from the brand kit — never invented). The demo build
(Mother Science: "100% / PROVEN / RESULTS", "EST 2023 … 10× MORE POWERFUL…") lives only in
scripts/config.example.json as a worked example.
"""
import subprocess
import sys
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

PROJECT_ROOT = Path(__file__).resolve().parent.parent
FONTS = PROJECT_ROOT / "assets" / "fonts"
OUT = PROJECT_ROOT / "assets" / "text-overlays"
OUT.mkdir(parents=True, exist_ok=True)

# ── CONFIG ──────────────────────────────────────────────────────────────
# Creative values come from config.json (copy scripts/config.example.json and fill it from the
# recipe's `choices` + the brand kit). Lookup order: --config <path>, $VIGNETTE_CONFIG,
# <project>/config.json, scripts/config.json.


def load_config() -> dict:
    import json
    import os
    candidates = []
    if "--config" in sys.argv:
        i = sys.argv.index("--config")
        if i + 1 < len(sys.argv):
            candidates.append(Path(sys.argv[i + 1]))
    if os.environ.get("VIGNETTE_CONFIG"):
        candidates.append(Path(os.environ["VIGNETTE_CONFIG"]))
    candidates += [PROJECT_ROOT / "config.json", Path(__file__).resolve().parent / "config.json"]
    for c in candidates:
        if c.exists():
            return json.loads(c.read_text())
    sys.exit(
        "No config.json found. Copy scripts/config.example.json to <project>/config.json and fill the "
        "creative fields from the recipe's choices + the brand kit (or pass --config <path>)."
    )


def require(cfg: dict, dotted: str):
    cur = cfg
    for part in dotted.split("."):
        if not isinstance(cur, dict) or cur.get(part) in (None, "", []):
            sys.exit(f"config.{dotted} is missing — it comes from the recipe's choices / brand kit; set it in config.json.")
        cur = cur[part]
    return cur


CFG = load_config()
W, H = int(CFG.get("width", 1080)), int(CFG.get("height", 1920))
END = CFG.get("end_card", {})

# Text colour follows the logo variant (the recipe's bg_palette choice sets it):
# light logo/text on a dark BG, dark logo/text on a light BG. Override with end_card.text_rgb.
_VARIANT_RGB = {"cream": (249, 247, 239), "white": (255, 255, 255), "black": (17, 17, 17), "dark": (17, 17, 17)}
_rgb = tuple(END.get("text_rgb") or _VARIANT_RGB.get(END.get("logo_variant", "cream"), (249, 247, 239)))
TEXT = (*_rgb, 255)
TEXT_DIM = (*_rgb, 180)  # ~70% opacity for small annotations


def _font(name: str, size: int):
    p = FONTS / name
    if not p.exists():
        sys.exit(f"font {p} not found — put the brand/format fonts in assets/fonts/ (see PIPELINE.md)")
    return ImageFont.truetype(str(p), size)


def render_cold_open_card_9x16():
    """Stacked config.cold_open_text lines, dead-center."""
    im = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    draw = ImageDraw.Draw(im)

    lines = require(CFG, "cold_open_text")
    if isinstance(lines, str):
        lines = [lines]
    font_size = int(CFG.get("cold_open_size_px", 240))
    font = _font(CFG.get("cold_open_font", "Boska-Black.ttf"), font_size)

    line_height_mult = 0.92
    line_height_px = int(font_size * line_height_mult)
    total_height = line_height_px * len(lines)
    start_y = (H - total_height) // 2

    for i, line in enumerate(lines):
        bbox = draw.textbbox((0, 0), line, font=font)
        text_w = bbox[2] - bbox[0]
        x = (W - text_w) // 2
        y = start_y + i * line_height_px
        draw.text((x, y), line, font=font, fill=TEXT)

    dst = OUT / "cold-open-card-9x16.png"
    im.save(dst, "PNG", optimize=True)
    print(f"✓ cold-open-card-9x16: {dst.relative_to(PROJECT_ROOT)} ({dst.stat().st_size // 1024} KB)")


def autocrop_alpha(im):
    bbox = im.split()[-1].getbbox()
    return im.crop(bbox) if bbox else im


def render_end_card_annotated_9x16():
    """Specimen-sheet end card (never a bare logo).

    Layout (top → bottom centered):
      end_card.lines[0]                  (small tracking, annotation font)
      ─────────────────                  (subtle horizontal rule)
      BRAND LOGO (end_card.logo_svg)     (logo_width_pct of frame width)
      ─────────────────                  (subtle horizontal rule)
      end_card.lines[1]                  (larger, annotation_font_strong)
      end_card.lines[2:]                 (smaller, annotation font)
    """
    im = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    draw = ImageDraw.Draw(im)
    lines = list(require(CFG, "end_card.lines"))

    # ── Render brand logo SVG at target width ──
    svg = PROJECT_ROOT / require(CFG, "end_card.logo_svg")
    target_logo_w = int(W * float(END.get("logo_width_pct", 0.80)))
    tmp = OUT / "_logo_raw.png"
    subprocess.run(
        ["rsvg-convert", "-w", "2400", str(svg), "-o", str(tmp)],
        check=True, capture_output=True,
    )
    logo = autocrop_alpha(Image.open(tmp).convert("RGBA"))
    logo_h = int(logo.height * (target_logo_w / logo.width))
    logo = logo.resize((target_logo_w, logo_h), Image.LANCZOS)

    # ── Layout positions ──
    center_y = H // 2
    logo_y = center_y - logo_h // 2
    logo_x = (W - target_logo_w) // 2
    ann = END.get("annotation_font", "SpaceGrotesk-Medium.ttf")
    ann_strong = END.get("annotation_font_strong", "SpaceGrotesk-SemiBold.ttf")

    # ── Top annotation ──
    f_top = _font(ann, 26)
    top_text = lines[0]
    bbox = draw.textbbox((0, 0), top_text, font=f_top)
    top_w = bbox[2] - bbox[0]
    top_y = logo_y - 130
    draw.text(((W - top_w) // 2, top_y), top_text, font=f_top, fill=TEXT_DIM)

    # ── Rule line above logo ──
    rule_w = 200
    rule_x = (W - rule_w) // 2
    rule_y_top = logo_y - 60
    draw.line([(rule_x, rule_y_top), (rule_x + rule_w, rule_y_top)], fill=TEXT_DIM, width=2)

    # ── Logo ──
    im.paste(logo, (logo_x, logo_y), logo)

    # ── Rule line below logo ──
    rule_y_bot = logo_y + logo_h + 60
    draw.line([(rule_x, rule_y_bot), (rule_x + rule_w, rule_y_bot)], fill=TEXT_DIM, width=2)

    # ── Annotation block below: first line larger, the rest smaller ──
    y = rule_y_bot + 35
    for i, text in enumerate(lines[1:]):
        if i == 0:
            f, fill, step = _font(ann_strong, 38), TEXT, 60
        else:
            f, fill, step = _font(ann, 22 if i == 1 else 24), TEXT_DIM, 50
        bbox = draw.textbbox((0, 0), text, font=f)
        draw.text(((W - (bbox[2] - bbox[0])) // 2, y), text, font=f, fill=fill)
        y += step

    tmp.unlink()
    dst = OUT / "end-card-annotated-9x16.png"
    im.save(dst, "PNG", optimize=True)
    print(f"✓ end-card-annotated-9x16: {dst.relative_to(PROJECT_ROOT)} ({dst.stat().st_size // 1024} KB)")


def main():
    render_cold_open_card_9x16()
    render_end_card_annotated_9x16()


if __name__ == "__main__":
    main()

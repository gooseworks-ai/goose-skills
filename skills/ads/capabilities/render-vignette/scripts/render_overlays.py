"""Render 9:16 (1080×1920) transparent overlay PNGs for the composite:
  - cold-open-card-9x16.png   '100% / PROVEN / RESULTS'  Boska Black, dead-center
  - end-card-annotated-9x16.png  EST 2023 / MOTHER SCIENCE logo / MAL•UH•SAY•ZIN / 10× tagline
                                  Pinterest-inspired specimen-sheet style
"""
from pathlib import Path
import subprocess
from PIL import Image, ImageChops, ImageDraw, ImageFont

PROJECT_ROOT = Path(__file__).resolve().parent.parent
BOSKA = PROJECT_ROOT / "assets" / "fonts" / "Boska-Black.ttf"
SG_MED = PROJECT_ROOT / "assets" / "fonts" / "SpaceGrotesk-Medium.ttf"
SG_SB = PROJECT_ROOT / "assets" / "fonts" / "SpaceGrotesk-SemiBold.ttf"
OUT = PROJECT_ROOT / "assets" / "text-overlays"
OUT.mkdir(parents=True, exist_ok=True)

W, H = 1080, 1920
CREAM = (249, 247, 239, 255)  # #f9f7ef
CREAM_DIM = (249, 247, 239, 180)  # 70% opacity cream for small annotations


def render_cold_open_card_9x16():
    """3 stacked lines: 100% / PROVEN / RESULTS, dead-center, Boska Black."""
    im = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    draw = ImageDraw.Draw(im)

    lines = ["100%", "PROVEN", "RESULTS"]
    font_size = 240
    font = ImageFont.truetype(str(BOSKA), font_size)

    line_height_mult = 0.92
    line_height_px = int(font_size * line_height_mult)
    total_height = line_height_px * len(lines)
    start_y = (H - total_height) // 2

    for i, line in enumerate(lines):
        bbox = draw.textbbox((0, 0), line, font=font)
        text_w = bbox[2] - bbox[0]
        x = (W - text_w) // 2
        y = start_y + i * line_height_px
        draw.text((x, y), line, font=font, fill=CREAM)

    dst = OUT / "cold-open-card-9x16.png"
    im.save(dst, "PNG", optimize=True)
    print(f"✓ cold-open-card-9x16: {dst.relative_to(PROJECT_ROOT)} ({dst.stat().st_size // 1024} KB)")


def autocrop_alpha(im):
    bbox = im.split()[-1].getbbox()
    return im.crop(bbox) if bbox else im


def render_end_card_annotated_9x16():
    """Pinterest-inspired specimen-sheet style end card.

    Layout (top → bottom centered):
      EST. 2023                          (small tracking, Space Grotesk Med)
      ─────────────────                  (subtle horizontal rule)
                                          (gap)
      MOTHER SCIENCE                     (large cream wordmark from brand SVG)
                                          (gap)
      ─────────────────                  (subtle horizontal rule)
      MAL · UH · SAY · ZIN               (small tracking, Space Grotesk Med)
      NOVEL MOLECULE                     (smaller still, Space Grotesk Med)
      10× MORE POWERFUL THAN VITAMIN C   (smaller, Space Grotesk Med)
    """
    im = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    draw = ImageDraw.Draw(im)

    # ── Render brand logo SVG at target width ──
    svg = PROJECT_ROOT / "assets" / "end-cards" / "mother-science-logo-cream.svg"
    target_logo_w = int(W * 0.80)  # 80% frame width
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

    # ── Top annotation ──
    f_top = ImageFont.truetype(str(SG_MED), 26)
    top_text = "E S T   2 0 2 3"  # extra-tracking via spaces
    bbox = draw.textbbox((0, 0), top_text, font=f_top)
    top_w = bbox[2] - bbox[0]
    top_y = logo_y - 130
    draw.text(((W - top_w) // 2, top_y), top_text, font=f_top, fill=CREAM_DIM)

    # ── Rule line above logo ──
    rule_w = 200
    rule_x = (W - rule_w) // 2
    rule_y_top = logo_y - 60
    draw.line([(rule_x, rule_y_top), (rule_x + rule_w, rule_y_top)], fill=CREAM_DIM, width=2)

    # ── Logo ──
    im.paste(logo, (logo_x, logo_y), logo)

    # ── Rule line below logo ──
    rule_y_bot = logo_y + logo_h + 60
    draw.line([(rule_x, rule_y_bot), (rule_x + rule_w, rule_y_bot)], fill=CREAM_DIM, width=2)

    # ── Annotation block below ──
    f_mal = ImageFont.truetype(str(SG_SB), 38)
    mal = "M A L · U H · S A Y · Z I N"
    bbox = draw.textbbox((0, 0), mal, font=f_mal)
    mal_w = bbox[2] - bbox[0]
    mal_y = rule_y_bot + 35
    draw.text(((W - mal_w) // 2, mal_y), mal, font=f_mal, fill=CREAM)

    f_sub = ImageFont.truetype(str(SG_MED), 22)
    sub1 = "N O V E L   M O L E C U L E"
    bbox = draw.textbbox((0, 0), sub1, font=f_sub)
    sub1_w = bbox[2] - bbox[0]
    sub1_y = mal_y + 60
    draw.text(((W - sub1_w) // 2, sub1_y), sub1, font=f_sub, fill=CREAM_DIM)

    f_claim = ImageFont.truetype(str(SG_MED), 24)
    claim = "10× MORE POWERFUL ANTIOXIDANT THAN VITAMIN C"
    bbox = draw.textbbox((0, 0), claim, font=f_claim)
    claim_w = bbox[2] - bbox[0]
    claim_y = sub1_y + 50
    draw.text(((W - claim_w) // 2, claim_y), claim, font=f_claim, fill=CREAM_DIM)

    tmp.unlink()
    dst = OUT / "end-card-annotated-9x16.png"
    im.save(dst, "PNG", optimize=True)
    print(f"✓ end-card-annotated-9x16: {dst.relative_to(PROJECT_ROOT)} ({dst.stat().st_size // 1024} KB)")


def main():
    render_cold_open_card_9x16()
    render_end_card_annotated_9x16()


if __name__ == "__main__":
    main()

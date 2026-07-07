#!/usr/bin/env python3
"""v4 9:16 rebuild — Bristle-architecture hyperframes for Som Value Prop.

Architecture:
  • 1080×1920 (9:16 vertical for Reels/Stories/TikTok/Meta vertical-first)
  • Cabinet Grotesk display + Switzer body (Fontshare)
  • initRenderer(duration, renderFn) pattern from Bristle/Everself v4
  • tw_lin + easeOut + springScale animations
  • Per-sachet PNGs (no flat variety pack canvas)
  • Editorial scaffolding: top-strip ("SOM SLEEP · ISSUE 01" / brand) + bottom-strip
  • Render via skills/atoms/motion-graphics/create-motion-graphics-hyperframes/scripts/render_hyperframe.py

Output: finals/master-v4-916.mp4
"""
import subprocess
import sys
from pathlib import Path

PROJECT = Path(__file__).resolve().parent.parent
HF_DIR = PROJECT / "working" / "hyperframes-v5"
CLIPS_DIR = PROJECT / "working" / "beat-clips-v5"
FINALS = PROJECT / "finals"
for d in (HF_DIR, CLIPS_DIR, FINALS):
    d.mkdir(parents=True, exist_ok=True)
OUTPUT = FINALS / "master-v5-clean.mp4"
W = 1080
H = 1920
FPS = 30

RENDER_SCRIPT = PROJECT.parent.parent.parent / "skills" / "atoms" / "motion-graphics" \
    / "create-motion-graphics-hyperframes" / "scripts" / "render_hyperframe.py"

# Per-flavor accents
COLORS = {
    "berry":     "#5BB4D9",
    "cherry":    "#4A2871",
    "mango":     "#F0C234",
    "tangerine": "#E8853A",
}


def prop_beat_html(beat_num, total_props, eyebrow_label, accent_color,
                   headline_html, sub_html,
                   layout="hero", hero_sachet=None):
    """Emit a prop-beat HTML.

    layout:
      "row"  — all 4 sachets in a horizontal row
      "hero" — one hero sachet centered large + others faded flanking
    """
    # Sachet zone HTML
    sachets_html = ""
    sachets_anim = ""

    if layout == "row":
        # All 4 sachets evenly spaced. Frame width 1080. 4 sachets at 230px each = 920 +
        # gaps. Positions:
        positions = [110, 350, 590, 830]  # left edge of each sachet
        names = ["berry", "cherry", "mango", "tangerine"]
        for i, (name, x) in enumerate(zip(names, positions)):
            sachets_html += (
                f'<img id="s-{name}" class="sachet" '
                f'src="../../source/sachets/{name}.png" '
                f'style="left:{x}px; width:230px; bottom:280px; opacity:0;">\n  '
            )
            delay = 0.10 + i * 0.06
            sachets_anim += (
                f"  {{ const u = tw_lin(t, {delay:.2f}, {delay+0.40:.2f}); "
                f"const e = easeOut(u); "
                f"const el = document.getElementById('s-{name}'); "
                f"el.style.opacity = e; "
                f"el.style.transform = `translateY(${{(1-e)*60}}px) scale(${{0.96+0.04*e}})`; }}\n"
            )

    elif layout == "hero" and hero_sachet:
        # Hero centered, large. Two supporters on the sides faded.
        # Sachet aspect ratio 416:1620 ≈ 1:3.89, so width×3.89 ≈ height.
        # Frame text-zone occupies top ~240-700px. Hero must start below ~720px.
        # width:280 → height ≈1090 → top = 1920-170-1090 = 660. ✓
        others = [n for n in ["berry", "cherry", "mango", "tangerine"] if n != hero_sachet]
        left_support = others[0]
        right_support = others[-1]
        sachets_html += (
            f'<img id="s-left" class="sachet" src="../../source/sachets/{left_support}.png" '
            f'style="left:80px; width:180px; bottom:280px; opacity:0;">\n  '
            f'<img id="s-right" class="sachet" src="../../source/sachets/{right_support}.png" '
            f'style="right:80px; width:180px; bottom:280px; opacity:0;">\n  '
            f'<img id="s-hero" class="sachet" '
            f'src="../../source/sachets/{hero_sachet}.png" '
            f'style="left:50%; width:280px; bottom:170px; opacity:0;">\n  '
        )
        sachets_anim += (
            "  { const u = tw_lin(t, 0.10, 0.50); const e = easeOut(u); "
            "const el = document.getElementById('s-left'); "
            "el.style.opacity = e * 0.40; "
            "el.style.transform = `translateY(${(1-e)*50}px)`; }\n"
            "  { const u = tw_lin(t, 0.16, 0.56); const e = easeOut(u); "
            "const el = document.getElementById('s-right'); "
            "el.style.opacity = e * 0.40; "
            "el.style.transform = `translateY(${(1-e)*50}px)`; }\n"
            "  { const u = tw_lin(t, 0.20, 0.70); const e = easeOut(u); "
            "const el = document.getElementById('s-hero'); "
            "el.style.opacity = e; "
            "const sc = u < 1 ? springScale(u) * 0.94 + 0.06 : 1; "
            "el.style.transform = `translateX(-50%) translateY(${(1-e)*70}px) scale(${sc})`; }\n"
        )

    # Text-zone HTML
    text_html = f"""
  <div class="text-zone" style="position:absolute; top:240px; left:0; right:0; padding:0 70px; text-align:center;">
    <div id="eyebrow" class="eyebrow" style="opacity:0;">{eyebrow_label}</div>
    <div id="rule" class="accent-rule" style="background:{accent_color}; opacity:0; transform:scaleX(0.3); transform-origin:center;"></div>
    <h1 id="headline" class="h-display" style="opacity:0; transform:translateY(28px);">{headline_html}</h1>
    <div id="sub" class="body" style="opacity:0; transform:translateY(16px); margin-top:36px;">{sub_html}</div>
  </div>
"""

    return f"""<!DOCTYPE html>
<html lang="en"><head>
<meta charset="utf-8">
<title>Som v5 · beat-{beat_num}</title>
<link rel="stylesheet" href="_shared.css">
</head><body>
<div class="stage">
  {text_html}
  {sachets_html}
</div>
<script src="_shared.js"></script>
<script>
  initRenderer(2.4, function (t) {{
    // Eyebrow → rule → headline → sub stagger
    {{ const u = tw_lin(t, 0.10, 0.45); const e = easeOut(u);
       document.getElementById('eyebrow').style.opacity = e; }}
    {{ const u = tw_lin(t, 0.20, 0.55); const e = easeOut(u);
       const el = document.getElementById('rule');
       el.style.opacity = e;
       el.style.transform = `scaleX(${{0.3 + 0.7*e}})`; }}
    {{ const u = tw_lin(t, 0.30, 0.75); const e = easeOut(u);
       const el = document.getElementById('headline');
       el.style.opacity = e;
       el.style.transform = `translateY(${{(1-e)*28}}px)`; }}
    {{ const u = tw_lin(t, 0.45, 0.90); const e = easeOut(u);
       const el = document.getElementById('sub');
       el.style.opacity = e;
       el.style.transform = `translateY(${{(1-e)*16}}px)`; }}
    // Sachet entrance
{sachets_anim}
  }});
</script>
</body></html>
"""


def hook_html():
    """Hook beat — 3s. Cherry hero + sticker overlay + brand badge."""
    return """<!DOCTYPE html>
<html lang="en"><head>
<meta charset="utf-8">
<title>Som v4 · beat-1 hook</title>
<link rel="stylesheet" href="_shared.css">
<style>
  body { background: var(--bg-cream); }
  .hook-sachet {
    position: absolute;
    left: 50%;
    bottom: -120px;
    height: 1750px;
    transform-origin: bottom center;
  }
  .sticker {
    position: absolute;
    top: 380px;
    left: 50%;
    background: var(--ink);
    color: #fff;
    padding: 44px 68px;
    border-radius: 20px;
    box-shadow: 0 28px 70px rgba(11,37,60,0.4);
    text-align: center;
    max-width: 900px;
  }
  .sticker .eye {
    font-family: var(--f-body);
    font-size: 22px;
    font-weight: 600;
    letter-spacing: 0.38em;
    text-transform: uppercase;
    color: rgba(255,255,255,0.72);
    margin-bottom: 18px;
  }
  .sticker .h {
    font-family: var(--f-display);
    font-weight: 800;
    font-style: italic;
    font-size: 108px;
    line-height: 0.98;
    letter-spacing: -0.025em;
    color: #fff;
  }
  .badge {
    position: absolute;
    bottom: 240px;
    left: 50%;
    transform: translateX(-50%);
    font-family: var(--f-body);
    font-size: 22px;
    font-weight: 600;
    letter-spacing: 0.36em;
    text-transform: uppercase;
    color: var(--ink-55);
    text-align: center;
  }
</style></head><body>
<div class="stage" style="padding:0;">
  <img id="sachet" class="hook-sachet" src="../../source/sachets/cherry.png">
  <div id="sticker" class="sticker"><div class="eye">🌙 &nbsp; The Sleep Drink &nbsp; 🌙</div><div class="h">Better Sleep.<br>Better Mornings.</div></div>
  <div id="badge" class="badge">Som Sleep · Why It Works</div>
</div>
<script src="_shared.js"></script>
<script>
  initRenderer(3.0, function (t) {
    const e1 = tw_lin(t, 0.00, 0.80);
    const eo1 = easeOut(e1);
    const sc = 0.94 + 0.06 * eo1;
    const sachet = document.getElementById('sachet');
    sachet.style.opacity = eo1;
    sachet.style.transform = `translateX(-50%) translateY(${(1 - eo1) * 80}px) scale(${sc})`;

    const e2 = tw_lin(t, 0.40, 1.10);
    const u2 = clamp(e2, 0, 1);
    const stickerScale = u2 < 1 ? springScale(u2) : 1.0;
    const stickerRot = -2.5 + (1 - u2) * -4;
    const sticker = document.getElementById('sticker');
    sticker.style.opacity = easeOut(u2);
    sticker.style.transform = `translateX(-50%) rotate(${stickerRot}deg) scale(${stickerScale})`;

    const e3 = tw(t, 1.20, 1.60);
    document.getElementById('badge').style.opacity = e3;
  });
</script>
</body></html>
"""


def endcard_html():
    """End card — 2s. Massive wordmark + RGB-shift shadow + tagline + CTA."""
    return """<!DOCTYPE html>
<html lang="en"><head>
<meta charset="utf-8">
<title>Som v4 · endcard</title>
<link rel="stylesheet" href="_shared.css">
<style>
  .endcard-stage {
    position: absolute; inset: 0;
    display: flex; flex-direction: column;
    align-items: center; justify-content: center;
    padding: 80px;
  }
  .logo-stack {
    position: relative;
    width: 780px;
  }
  .logo-stack img {
    width: 100%;
    display: block;
  }
  /* v5: chromatic aberration removed — was making the wordmark feel pixelated */
  .tag {
    margin-top: 60px;
    font-family: var(--f-display);
    font-weight: 700;
    font-style: italic;
    font-size: 64px;
    line-height: 1.04;
    letter-spacing: -0.02em;
    color: var(--ink);
    text-align: center;
  }
  .cta {
    margin-top: 80px;
    font-family: var(--f-body);
    font-weight: 600;
    font-size: 22px;
    letter-spacing: 0.38em;
    text-transform: uppercase;
    color: var(--ink-55);
  }
</style></head><body>
<div class="endcard-stage">
  <div id="logo" class="logo-stack" style="opacity:0; transform:scale(0.94);">
    <img src="../../source/logo-som-blue.png">
  </div>
  <div id="tag" class="tag" style="opacity:0; transform:translateY(16px);">Better Sleep. Better Mornings.</div>
  <div id="cta" class="cta" style="opacity:0;">Click to See More</div>
</div>
<script src="_shared.js"></script>
<script>
  initRenderer(2.0, function (t) {
    { const u = tw_lin(t, 0.00, 0.70); const e = easeOut(u);
      const sc = 0.94 + 0.06 * (u < 1 ? springScale(u) - 0.94 : 0.06);
      const el = document.getElementById('logo');
      el.style.opacity = e;
      el.style.transform = `scale(${sc})`; }
    { const u = tw_lin(t, 0.30, 0.80); const e = easeOut(u);
      const el = document.getElementById('tag');
      el.style.opacity = e;
      el.style.transform = `translateY(${(1-e)*16}px)`; }
    { const e = tw(t, 0.80, 1.20);
      document.getElementById('cta').style.opacity = e; }
  });
</script>
</body></html>
"""


# ---------- BEAT SPECS ----------

BEATS = [
    {"id": 1, "slug": "hook",          "dur": 3.0, "html": hook_html},
    {"id": 2, "slug": "nsf",           "dur": 2.4, "html": lambda: prop_beat_html(
        1, 5, "Pro-Team Tested", COLORS["berry"],
        "NSF <em>Certified</em><br>for Sport.",
        "Independently tested — trusted by 100+ pro sports teams.",
        layout="row")},
    {"id": 3, "slug": "drug-free",     "dur": 2.4, "html": lambda: prop_beat_html(
        2, 5, "Built Safer", COLORS["berry"],
        "<em>Drug</em>-Free.",
        "Works without the pharma-class side effects.",
        layout="hero", hero_sachet="berry")},
    {"id": 4, "slug": "non-habit",     "dur": 2.4, "html": lambda: prop_beat_html(
        3, 5, "No Strings", COLORS["cherry"],
        "Non-<em>habit</em><br>forming.",
        "Take it when you need it — no dependency.",
        layout="hero", hero_sachet="cherry")},
    {"id": 5, "slug": "zero-sugar",    "dur": 2.4, "html": lambda: prop_beat_html(
        4, 5, "Lean Formula", COLORS["mango"],
        "<em>Zero</em> Sugar.",
        "10 calories per stick — no bedtime sugar crash.",
        layout="hero", hero_sachet="mango")},
    {"id": 6, "slug": "no-artificial", "dur": 2.4, "html": lambda: prop_beat_html(
        5, 5, "What's Inside", COLORS["tangerine"],
        "No <em>Artificial</em><br>Flavors.",
        ('Naturally flavored — '
         f'<strong style="color:{COLORS["berry"]};">Berry</strong>, '
         f'<strong style="color:{COLORS["cherry"]};">Cherry</strong>, '
         f'<strong style="color:{COLORS["mango"]};">Mango</strong>, '
         f'<strong style="color:{COLORS["tangerine"]};">Tangerine</strong>.'),
        layout="row")},
    {"id": 7, "slug": "endcard",       "dur": 2.0, "html": endcard_html},
]


def main():
    print(f"Building {len(BEATS)} v4 9:16 beats @ {W}x{H} {FPS}fps...")
    beat_clips = []
    for beat in BEATS:
        html_path = HF_DIR / f"beat-{beat['id']}-{beat['slug']}.html"
        html_path.write_text(beat["html"]())
        clip_path = CLIPS_DIR / f"beat-{beat['id']}-{beat['slug']}.mp4"
        print(f"  beat {beat['id']} '{beat['slug']}' ({beat['dur']}s) rendering...")
        # Render via the existing render_hyperframe.py atom (seekable, frame-by-frame)
        subprocess.run([
            "/usr/bin/python3", str(RENDER_SCRIPT),
            str(html_path), str(clip_path), str(beat["dur"]),
            "--width", str(W), "--height", str(H),
            "--fps", str(FPS),
            "--no-audio-track",  # we'll mux silent stereo at concat
        ], check=True)
        print(f"    → {clip_path.relative_to(PROJECT)}")
        beat_clips.append(clip_path)

    # Concat + silent stereo
    concat_file = CLIPS_DIR / "concat.txt"
    concat_file.write_text("\n".join(f"file '{p.resolve()}'" for p in beat_clips) + "\n")
    total = sum(b["dur"] for b in BEATS)
    print(f"\nConcat + silent audio ({total:.1f}s)...")
    subprocess.run([
        "/opt/homebrew/bin/ffmpeg", "-y", "-loglevel", "error",
        "-f", "concat", "-safe", "0", "-i", str(concat_file),
        "-f", "lavfi", "-t", f"{total:.3f}",
        "-i", "anullsrc=channel_layout=stereo:sample_rate=44100",
        "-map", "0:v", "-map", "1:a",
        "-c:v", "copy",
        "-c:a", "aac", "-b:a", "128k",
        "-shortest", "-movflags", "+faststart",
        str(OUTPUT),
    ], check=True)
    size = OUTPUT.stat().st_size / 1024 / 1024
    print(f"\n✓ {OUTPUT.relative_to(PROJECT)} — {size:.1f} MB ({total:.1f}s) — 1080x1920 9:16")


if __name__ == "__main__":
    main()

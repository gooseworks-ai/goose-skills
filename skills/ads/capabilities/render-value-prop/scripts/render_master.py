#!/usr/bin/env python3
"""Config-driven value-prop renderer — deterministic, FREE, brand-agnostic.

Reads a brand `config.json` (the `ad_sample.recipe.config` schema) and renders
a value-prop spot: hook sticker -> one beat per short benefit claim (the hero
product rotates beat to beat) -> brand end card. Text + product carry the spot;
built to be legible sound-off. Every beat is a pure function of beat-local time
`t` (Playwright frame-step via the BUNDLED render_hyperframe.py + FFmpeg). No
paid calls; music is added separately (create-music-elevenlabs) or ship silent.

Nothing here is hardcoded to one brand: palette, copy, SKUs, pacing, logo, hook
and end card all come from the config. Product widths auto-scale from each
image's aspect ratio, so the same renderer handles tall sachets and wide
packshots alike.

Usage:
    render_master.py --config config.json --project <project_dir> [--out master.mp4]

- `--project` is the folder holding the source assets the config references
  (SKU pngs, logo) and where working/ + finals/ outputs are written. Asset
  paths in the config resolve relative to it. Defaults to the config's folder.
- Interpreter: run this with a Python that has Playwright installed. Override
  the frame-render interpreter with RENDER_PYTHON if needed.
- ffmpeg: auto-discovered (FFMPEG env > PATH > common install prefixes).

Config schema (see config.example.json):
    width,height,fps,duration_s
    brand_name, hook_line, hook_eyebrow?, hook_sku?, tagline, cta
    logo?                      # path to a wordmark image (>=1200x600); if
                               # missing/absent, a typographic brand_name wordmark is used
    skus: [{slug, png}]
    palette: { bg, ink, bg_cream?, sku_accents: {slug: hex} }
    pacing: { hook_s, prop_s, endcard_s }
    value_props: [{ label, eyebrow, benefit_sentence?, accent, layout('row'|'hero'), hero_sku?, headline_html? }]
    layout?: { text_top, headline_size, hero_h, hero_bottom, support_h, support_bottom,
               support_opacity, row_h, row_bottom }   # all optional; sane defaults below
"""
import argparse
import json
import os
import shutil
import subprocess
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent


# ---------------------------------------------------------------- environment
def find_ffmpeg():
    if os.environ.get("FFMPEG"):
        return os.environ["FFMPEG"]
    found = shutil.which("ffmpeg")
    if found:
        return found
    for p in ("/opt/homebrew/bin/ffmpeg", "/usr/local/bin/ffmpeg", "/usr/bin/ffmpeg"):
        if Path(p).exists():
            return p
    return "ffmpeg"  # last resort; will error clearly if truly absent


def render_python():
    # The interpreter that drives Playwright. Default = the one running us
    # (so `playwright-python render_master.py ...` just works); override with env.
    return os.environ.get("RENDER_PYTHON") or sys.executable


def find_shared(name):
    """_shared.css / _shared.js ship in the capability's shared/. Tolerate the
    few layouts `gooseworks fetch` / installers produce."""
    for cand in (HERE / name, HERE / "shared" / name, HERE.parent / "shared" / name, HERE.parent / name):
        if cand.exists():
            return cand
    raise FileNotFoundError(f"{name} not found near {HERE}")


def hyperframe_script():
    for cand in (HERE / "render_hyperframe.py", HERE / "scripts" / "render_hyperframe.py"):
        if cand.exists():
            return cand
    raise FileNotFoundError("render_hyperframe.py not bundled next to render_master.py")


def img_aspect(path, default=0.8):
    """width/height of an image, for auto-scaling product widths. Falls back to
    a portrait-packshot default if PIL is unavailable or the file is missing."""
    try:
        from PIL import Image
        with Image.open(path) as im:
            w, h = im.size
            return w / h if h else default
    except Exception:
        return default


# ------------------------------------------------------------------- palette
def _hex_rgb(h):
    h = h.lstrip("#")
    if len(h) == 3:
        h = "".join(c * 2 for c in h)
    return tuple(int(h[i:i + 2], 16) for i in (0, 2, 4))


def palette_style(pal):
    """Override the shared stylesheet's :root tokens from config so the renderer
    carries no baked-in brand color."""
    ink = pal.get("ink", "#111111")
    r, g, b = _hex_rgb(ink)
    bg = pal.get("bg", "#FFFFFF")
    cream = pal.get("bg_cream", bg)
    return (
        "<style>:root{"
        f"--ink:{ink};"
        f"--ink-72:rgba({r},{g},{b},0.72);--ink-55:rgba({r},{g},{b},0.55);"
        f"--ink-30:rgba({r},{g},{b},0.30);--ink-15:rgba({r},{g},{b},0.14);"
        f"--bg-white:{bg};--bg-cream:{cream};}}"
        f"html,body{{background:{bg};}}"
        f".prop-h{{font-family:var(--f-display);font-weight:700;line-height:0.98;"
        f"letter-spacing:-0.028em;color:var(--ink);}} .prop-h em{{font-style:italic;font-weight:600;}}"
        "</style>"
    )


def accent_of(vp, pal):
    a = vp.get("accent", "")
    if isinstance(a, str) and a.startswith("#"):
        return a
    return pal.get("sku_accents", {}).get(a, pal.get("ink", "#111111"))


# --------------------------------------------------------------- beat markup
LAYOUT_DEFAULTS = dict(text_top=210, headline_size=96, hero_h=680, hero_bottom=200,
                       support_h=300, support_bottom=360, support_opacity=0.38,
                       row_h=300, row_bottom=320)


def html_doc(head_extra, body, dur_s, render_js):
    return (
        "<!DOCTYPE html><html lang=\"en\"><head><meta charset=\"utf-8\">"
        "<link rel=\"stylesheet\" href=\"_shared.css\">" + head_extra + "</head><body>"
        + body + "<script src=\"_shared.js\"></script><script>initRenderer("
        + f"{dur_s}, function(t){{{render_js}}});</script></body></html>"
    )


def prop_beat(vp, pal, sku_src, lay):
    accent = accent_of(vp, pal)
    eyebrow = vp.get("eyebrow", "")
    headline = vp.get("headline_html") or vp.get("label", "")
    sub = vp.get("benefit_sentence", "")
    imgs, anim = "", ""

    if vp.get("layout") == "row":
        items = list(sku_src.items())
        n = len(items)
        gap = 1080 / (n + 1)
        for i, (slug, src) in enumerate(items):
            w = int(lay["row_h"] * img_aspect(src))
            cx = gap * (i + 1)
            imgs += (f'<img id="s{i}" class="sachet" src="file://{src}" '
                     f'style="left:{cx:.0f}px; width:{w}px; bottom:{lay["row_bottom"]}px; '
                     f'transform:translateX(-50%); opacity:0;">')
            d = 0.10 + i * 0.07
            anim += (f"{{const u=tw_lin(t,{d:.2f},{d + 0.42:.2f});const e=easeOut(u);"
                     f"const el=document.getElementById('s{i}');el.style.opacity=e;"
                     f"el.style.transform=`translateX(-50%) translateY(${{(1-e)*55}}px) scale(${{0.96+0.04*e}})`;}}")
    else:  # hero
        hero = vp.get("hero_sku") or next(iter(sku_src))
        hero_src = sku_src.get(hero, next(iter(sku_src.values())))
        others = [s for s in sku_src if s != hero] or [hero]
        lsrc, rsrc = sku_src[others[0]], sku_src[others[-1]]
        hw = int(lay["hero_h"] * img_aspect(hero_src))
        sw = int(lay["support_h"] * img_aspect(lsrc))
        so = lay["support_opacity"]
        imgs = (
            f'<img id="sl" class="sachet" src="file://{lsrc}" style="left:40px; width:{sw}px; bottom:{lay["support_bottom"]}px; opacity:0;">'
            f'<img id="sr" class="sachet" src="file://{rsrc}" style="right:40px; width:{sw}px; bottom:{lay["support_bottom"]}px; opacity:0;">'
            f'<img id="sh" class="sachet" src="file://{hero_src}" style="left:50%; width:{hw}px; bottom:{lay["hero_bottom"]}px; opacity:0;">'
        )
        anim = (
            f"{{const u=tw_lin(t,0.10,0.50);const e=easeOut(u);const el=document.getElementById('sl');"
            f"el.style.opacity=e*{so};el.style.transform=`translateY(${{(1-e)*45}}px)`;}}"
            f"{{const u=tw_lin(t,0.16,0.56);const e=easeOut(u);const el=document.getElementById('sr');"
            f"el.style.opacity=e*{so};el.style.transform=`translateY(${{(1-e)*45}}px)`;}}"
            "{const u=tw_lin(t,0.20,0.72);const e=easeOut(u);const el=document.getElementById('sh');"
            "el.style.opacity=e;const sc=u<1?springScale(u)*0.94+0.06:1;"
            "el.style.transform=`translateX(-50%) translateY(${(1-e)*60}px) scale(${sc})`;}"
        )

    body = (
        f'<div class="stage">'
        f'<div class="text-zone" style="position:absolute; top:{lay["text_top"]}px; left:0; right:0; padding:0 70px; text-align:center;">'
        f'<div id="eyebrow" class="eyebrow" style="opacity:0;">{eyebrow}</div>'
        f'<div id="rule" class="accent-rule" style="background:{accent}; opacity:0; transform:scaleX(0.3); transform-origin:center;"></div>'
        f'<h1 id="headline" class="prop-h" style="font-size:{lay["headline_size"]}px; opacity:0; transform:translateY(28px);">{headline}</h1>'
        f'<div id="sub" class="body" style="opacity:0; transform:translateY(16px); margin-top:34px;">{sub}</div>'
        f'</div>{imgs}</div>'
    )
    js = (
        "{const u=tw_lin(t,0.10,0.45);const e=easeOut(u);document.getElementById('eyebrow').style.opacity=e;}"
        "{const u=tw_lin(t,0.20,0.55);const e=easeOut(u);const el=document.getElementById('rule');"
        "el.style.opacity=e;el.style.transform=`scaleX(${0.3+0.7*e})`;}"
        "{const u=tw_lin(t,0.30,0.75);const e=easeOut(u);const el=document.getElementById('headline');"
        "el.style.opacity=e;el.style.transform=`translateY(${(1-e)*28}px)`;}"
        "{const u=tw_lin(t,0.45,0.90);const e=easeOut(u);const el=document.getElementById('sub');"
        "el.style.opacity=e;el.style.transform=`translateY(${(1-e)*16}px)`;}"
        + anim
    )
    return html_doc(pal["_style"], body, 2.4, js)


def hook_beat(cfg, pal, sku_src, dur):
    hero = cfg.get("hook_sku") or next(iter(sku_src))
    hero_src = sku_src.get(hero, next(iter(sku_src.values())))
    hw = int(760 * img_aspect(hero_src))
    eyebrow = cfg.get("hook_eyebrow", "")
    line = cfg.get("hook_line", cfg.get("tagline", "")).replace("\n", "<br>")
    badge = cfg.get("brand_name", "")
    head = pal["_style"] + (
        "<style>"
        f".hook-prod{{position:absolute;left:50%;bottom:120px;width:{hw}px;transform-origin:bottom center;}}"
        ".sticker{position:absolute;top:250px;left:50%;background:var(--ink);color:#fff;padding:42px 62px;"
        "border-radius:22px;box-shadow:0 26px 64px rgba(0,0,0,0.28);text-align:center;max-width:900px;}"
        ".sticker .eye{font-family:var(--f-body);font-size:22px;font-weight:600;letter-spacing:0.34em;"
        "text-transform:uppercase;color:rgba(255,255,255,0.72);margin-bottom:18px;}"
        ".sticker .h{font-family:var(--f-display);font-weight:700;font-style:italic;font-size:96px;"
        "line-height:1.0;letter-spacing:-0.028em;color:#fff;}"
        ".badge{position:absolute;bottom:60px;left:50%;transform:translateX(-50%);font-family:var(--f-body);"
        "font-size:22px;font-weight:600;letter-spacing:0.34em;text-transform:uppercase;color:var(--ink-55);}"
        "</style>"
    )
    eyebrow_html = f'<div class="eye">{eyebrow}</div>' if eyebrow else ""
    body = (
        '<div class="stage" style="padding:0;">'
        f'<img id="prod" class="hook-prod" src="file://{hero_src}">'
        f'<div id="sticker" class="sticker">{eyebrow_html}<div class="h">{line}</div></div>'
        f'<div id="badge" class="badge">{badge}</div></div>'
    )
    js = (
        "const e1=easeOut(tw_lin(t,0.00,0.80));const sc=0.94+0.06*e1;const p=document.getElementById('prod');"
        "p.style.opacity=e1;p.style.transform=`translateX(-50%) translateY(${(1-e1)*80}px) scale(${sc})`;"
        "const u2=clamp(tw_lin(t,0.40,1.10),0,1);const ss=u2<1?springScale(u2):1.0;const rot=-2.0+(1-u2)*-4;"
        "const s=document.getElementById('sticker');s.style.opacity=easeOut(u2);"
        "s.style.transform=`translateX(-50%) rotate(${rot}deg) scale(${ss})`;"
        "document.getElementById('badge').style.opacity=tw(t,1.20,1.60);"
    )
    return html_doc(head, body, dur, js)


def endcard_beat(cfg, pal, logo_src, dur):
    tag = cfg.get("tagline", "").replace("\n", "<br>")
    cta = cfg.get("cta", "")
    # Wordmark: use a hi-res logo image if one is available; else fall back to a
    # crisp typographic brand_name wordmark (many brands only have a favicon).
    if logo_src and Path(logo_src).exists() and img_aspect(logo_src, 0) >= 1.2:
        mark = f'<div id="logo" class="mark-img" style="opacity:0; transform:scale(0.94);"><img src="file://{logo_src}"></div>'
    else:
        mark = f'<div id="logo" class="mark-txt" style="opacity:0; transform:scale(0.94);">{cfg.get("brand_name", "")}</div>'
    head = pal["_style"] + (
        "<style>"
        ".endcard-stage{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:80px;}"
        ".mark-img{width:780px;} .mark-img img{width:100%;display:block;}"
        ".mark-txt{font-family:var(--f-display);font-weight:700;font-size:150px;letter-spacing:-0.04em;color:var(--ink);line-height:1;}"
        ".tag{margin-top:48px;font-family:var(--f-display);font-weight:700;font-style:italic;font-size:60px;"
        "line-height:1.06;letter-spacing:-0.02em;color:var(--ink);text-align:center;}"
        ".cta{margin-top:76px;font-family:var(--f-body);font-weight:600;font-size:24px;letter-spacing:0.34em;"
        "text-transform:uppercase;color:#fff;background:var(--ink);padding:22px 44px;border-radius:14px;}"
        "</style>"
    )
    body = (
        '<div class="endcard-stage">' + mark
        + f'<div id="tag" class="tag" style="opacity:0; transform:translateY(16px);">{tag}</div>'
        + f'<div id="cta" class="cta" style="opacity:0;">{cta}</div></div>'
    )
    js = (
        "{const u=tw_lin(t,0.00,0.70);const e=easeOut(u);const sc=u<1?springScale(u)*0.94+0.06:1;"
        "const el=document.getElementById('logo');el.style.opacity=e;el.style.transform=`scale(${sc})`;}"
        "{const u=tw_lin(t,0.30,0.80);const e=easeOut(u);const el=document.getElementById('tag');"
        "el.style.opacity=e;el.style.transform=`translateY(${(1-e)*16}px)`;}"
        "document.getElementById('cta').style.opacity=tw(t,0.80,1.20);"
    )
    return html_doc(head, body, dur, js)


# ----------------------------------------------------------------------- main
def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--config", required=True, help="brand config.json (recipe.config schema)")
    ap.add_argument("--project", help="asset root + output dir (default: config's folder)")
    ap.add_argument("--out", help="output mp4 (default: <project>/finals/master-clean.mp4)")
    a = ap.parse_args()

    cfg = json.loads(Path(a.config).read_text())
    project = Path(a.project).resolve() if a.project else Path(a.config).resolve().parent
    hf_dir = project / "working" / "hyperframes"
    clips_dir = project / "working" / "beat-clips"
    finals = project / "finals"
    for d in (hf_dir, clips_dir, finals):
        d.mkdir(parents=True, exist_ok=True)
    out = Path(a.out).resolve() if a.out else finals / "master-clean.mp4"

    W = int(cfg.get("width", 1080))
    H = int(cfg.get("height", 1920))
    FPS = int(cfg.get("fps", 30))
    pal = dict(cfg.get("palette", {}))
    pal["_style"] = palette_style(pal)
    lay = {**LAYOUT_DEFAULTS, **cfg.get("layout", {})}

    def resolve(p):
        return str((project / p).resolve()) if p else None

    sku_src = {s["slug"]: resolve(s["png"]) for s in cfg.get("skus", [])}
    if len(sku_src) < 3:
        print(f"WARNING: value-prop leans on >=3 per-SKU visuals; got {len(sku_src)}", file=sys.stderr)
    logo_src = resolve(cfg.get("logo"))
    pacing = cfg.get("pacing", {})
    hook_s = float(pacing.get("hook_s", 3.0))
    prop_s = float(pacing.get("prop_s", 2.4))
    end_s = float(pacing.get("endcard_s", 2.0))

    # copy the shared runtime next to the generated HTML (paths are relative)
    for name in ("_shared.css", "_shared.js"):
        shutil.copy(find_shared(name), hf_dir / name)

    beats = [("hook", hook_s, hook_beat(cfg, pal, sku_src, hook_s))]
    for i, vp in enumerate(cfg.get("value_props", []), 1):
        slug = vp.get("label", f"prop{i}").lower().replace(" ", "-")[:24]
        beats.append((f"{i:02d}-{slug}", prop_s, prop_beat(vp, pal, sku_src, lay)))
    beats.append(("endcard", end_s, endcard_beat(cfg, pal, logo_src, end_s)))

    py, hf, ff = render_python(), str(hyperframe_script()), find_ffmpeg()
    print(f"Rendering {len(beats)} beats @ {W}x{H} {FPS}fps  (py={py}, ffmpeg={ff})")
    clips = []
    for slug, dur, html in beats:
        hp = hf_dir / f"beat-{slug}.html"
        hp.write_text(html)
        cp = clips_dir / f"beat-{slug}.mp4"
        subprocess.run([py, hf, str(hp), str(cp), str(dur),
                        "--width", str(W), "--height", str(H), "--fps", str(FPS),
                        "--no-audio-track"], check=True)
        clips.append(cp)

    concat = clips_dir / "concat.txt"
    concat.write_text("\n".join(f"file '{c.resolve()}'" for c in clips) + "\n")
    total = sum(d for _, d, _ in beats)
    subprocess.run([ff, "-y", "-loglevel", "error", "-f", "concat", "-safe", "0",
                    "-i", str(concat), "-f", "lavfi", "-t", f"{total:.3f}",
                    "-i", "anullsrc=channel_layout=stereo:sample_rate=44100",
                    "-map", "0:v", "-map", "1:a", "-c:v", "copy", "-c:a", "aac",
                    "-b:a", "128k", "-shortest", "-movflags", "+faststart", str(out)], check=True)
    print(f"OK {out} ({total:.1f}s, {out.stat().st_size / 1024 / 1024:.1f}MB) {W}x{H}")


if __name__ == "__main__":
    main()

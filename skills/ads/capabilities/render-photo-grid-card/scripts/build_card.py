#!/usr/bin/env python3
"""Generate the promo-card HTML from a config.json — a designed feed card:
brand wordmark + big headline + sub + a 2x3 grid of 6 tiles + feature chips,
with the signature staggered slide-in motion (brand fade → headline drop → sub →
tiles slide in from the right → chips fade up, then hold).

Tiles are typed: "product" (real product on a soft band), "photo" (a lifestyle
image, cover-cropped), "off" (a big serif % OFF), "code" (a dark promo-code tile).
Everything is real DOM — NO AI-rendered text — so the wordmark, %, and code stay
pixel-crisp. Reuses _shared.js (the pure-function-of-time renderer scaffold).

Usage:  build_card.py --config config.json --out <run>/hyperframe.html
"""
import argparse
import html
import json
import pathlib

TILE_RENDERERS = {}


def esc(s):
    return html.escape(str(s), quote=True)


def tile_html(t, i):
    kind = t.get("type", "photo")
    if kind == "product":
        return f'<div class="tile band-product" data-i="{i}"><img src="{esc(t["image"])}" /></div>'
    if kind == "photo":
        img = t.get("image")
        if img:
            return f'<div class="tile" data-i="{i}"><img src="{esc(img)}" /></div>'
        # graceful fallback so the card renders without a lifestyle photo present
        return f'<div class="tile photo-placeholder" data-i="{i}"></div>'
    if kind == "off":
        return (f'<div class="tile type-off" data-i="{i}">'
                f'<div class="pct">{esc(t.get("pct", "25%"))}</div>'
                f'<div class="off">{esc(t.get("label", "OFF"))}</div></div>')
    if kind == "code":
        val = t.get("value", "DAD25")
        accent = t.get("accent_prefix", "")
        if accent and val.startswith(accent):
            rest = val[len(accent):]
            val_html = f'<span class="accent">{esc(accent)}</span>{esc(rest)}'
        else:
            val_html = esc(val)
        return (f'<div class="tile code" data-i="{i}">'
                f'<div class="lbl">{esc(t.get("label", "CODE"))}</div>'
                f'<div class="val">{val_html}</div></div>')
    raise SystemExit(f"unknown tile type: {kind}")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--config", required=True)
    ap.add_argument("--out", required=True)
    args = ap.parse_args()

    cfg = json.loads(pathlib.Path(args.config).read_text())
    W, H = cfg.get("width", 1080), cfg.get("height", 1920)
    p = {**DEFAULT_PALETTE, **cfg.get("palette", {})}
    dur = cfg.get("duration_sec", 10.0)

    tiles = cfg["tiles"]
    if len(tiles) != 6:
        raise SystemExit(f"expected 6 tiles, got {len(tiles)}")
    chips = cfg.get("chips", [])

    # vertical rhythm scales with canvas height (base tuned on 1920)
    grid_top = cfg.get("grid_top", int(H * 0.30))
    grid_h = cfg.get("grid_height", int(H * 0.42))

    tiles_html = "\n".join(tile_html(t, i) for i, t in enumerate(tiles))
    chips_html = "\n".join(
        f'<div class="chip" data-i="{i}">{esc(c)}</div>' for i, c in enumerate(chips)
    )
    shared_js = (pathlib.Path(__file__).resolve().parent / "_shared.js").read_text()

    doc = TEMPLATE.format(
        W=W, H=H, dur=dur, shared_js=shared_js,
        wordmark=esc(cfg["wordmark"]),
        headline=cfg["headline"],  # may contain <br/>
        sub=esc(cfg.get("sub", "")),
        tiles=tiles_html, chips=chips_html,
        grid_top=grid_top, grid_h=grid_h,
        **{f"c_{k}": v for k, v in p.items()},
    )
    out = pathlib.Path(args.out)
    out.write_text(doc)
    print(f"[card] wrote {out}  ({W}x{H}, {len(tiles)} tiles, {len(chips)} chips)")


DEFAULT_PALETTE = {
    "ink": "#0E1B22", "ink_soft": "#4A5961", "bg": "#E6EEF3",
    "bg_tile": "#F4F8FB", "bg_band": "#DCE6EC", "accent": "#31ABE8",
}

TEMPLATE = """<!doctype html>
<html lang="en"><head><meta charset="utf-8" />
<link href="https://api.fontshare.com/v2/css?f[]=cabinet-grotesk@500,700,800&f[]=zodiak@500,700&display=swap" rel="stylesheet" />
<style>
:root {{ --ink:{c_ink}; --ink-soft:{c_ink_soft}; --bg:{c_bg}; --bg-tile:{c_bg_tile}; --bg-band:{c_bg_band}; --accent:{c_accent}; }}
* {{ margin:0; padding:0; box-sizing:border-box; }}
html,body {{ width:{W}px; height:{H}px; background:var(--bg); font-family:'Cabinet Grotesk',system-ui,sans-serif; color:var(--ink); overflow:hidden; -webkit-font-smoothing:antialiased; }}
.frame {{ position:relative; width:{W}px; height:{H}px; }}
.brand-mark {{ position:absolute; top:56px; left:0; right:0; display:flex; justify-content:center; align-items:center; }}
.brand-mark img {{ height:44px; opacity:.92; }}
.headline {{ position:absolute; top:150px; left:0; right:0; text-align:center; font-weight:800; font-size:132px; line-height:.96; letter-spacing:-3.6px; color:var(--ink); }}
.sub {{ position:absolute; top:430px; left:0; right:0; text-align:center; font-weight:500; font-size:34px; letter-spacing:-.2px; color:var(--ink-soft); }}
.grid {{ position:absolute; left:64px; right:64px; top:{grid_top}px; display:grid; grid-template-columns:repeat(3,1fr); grid-template-rows:repeat(2,1fr); gap:16px; height:{grid_h}px; }}
.tile {{ position:relative; border-radius:22px; overflow:hidden; background:var(--bg-tile); box-shadow:0 1px 0 rgba(14,27,34,.03); }}
.tile img {{ width:100%; height:100%; object-fit:cover; }}
.tile.photo-placeholder {{ background:linear-gradient(135deg,var(--bg-tile),var(--bg-band)); }}
.tile.type-off {{ display:flex; align-items:center; justify-content:center; flex-direction:column; padding:18px; }}
.tile.type-off .pct {{ font-family:'Zodiak',serif; font-weight:700; font-size:142px; letter-spacing:-4px; line-height:.9; }}
.tile.type-off .off {{ font-family:'Zodiak',serif; font-weight:700; font-size:104px; letter-spacing:-3px; line-height:1; }}
.tile.code {{ background:var(--ink); color:#fff; display:flex; flex-direction:column; align-items:center; justify-content:center; padding:18px; }}
.tile.code .lbl {{ font-weight:700; letter-spacing:5px; font-size:22px; color:rgba(255,255,255,.65); text-transform:uppercase; margin-bottom:12px; }}
.tile.code .val {{ font-weight:800; font-size:96px; letter-spacing:-3px; color:#fff; }}
.tile.code .val .accent {{ color:var(--accent); }}
.tile.band-product {{ background:var(--bg-band); display:flex; align-items:center; justify-content:center; padding:14px; }}
.tile.band-product img {{ width:105%; height:auto; object-fit:contain; }}
.chips {{ position:absolute; left:0; right:0; bottom:110px; display:flex; justify-content:center; gap:18px; flex-wrap:wrap; }}
.chip {{ background:transparent; border:2px solid var(--ink); border-radius:999px; padding:18px 36px; font-weight:700; font-size:26px; letter-spacing:1.5px; color:var(--ink); text-transform:uppercase; }}
</style></head>
<body><div class="frame">
<div class="brand-mark" id="brand"><img src="{wordmark}" /></div>
<div class="headline" id="headline">{headline}</div>
<div class="sub" id="sub">{sub}</div>
<div class="grid">
{tiles}
</div>
<div class="chips" id="chips">
{chips}
</div>
</div>
<script>{shared_js}</script>
<script>
const brand=document.getElementById('brand'),headline=document.getElementById('headline'),sub=document.getElementById('sub');
const tiles=Array.from(document.querySelectorAll('.tile')),chips=Array.from(document.querySelectorAll('.chip'));
initRenderer({dur}, function(t){{
  brand.style.opacity=easeOut(clamp01(tw(t,0.00,0.40)));
  const hx=clamp01(tw(t,0.10,0.70)); headline.style.opacity=easeOut(hx);
  headline.style.transform=`translateY(${{(1-easeOut(hx))*28}}px)`;
  sub.style.opacity=easeOut(clamp01(tw(t,0.50,0.90)));
  const t0=0.80, per=0.10;
  tiles.forEach((el)=>{{ const i=parseInt(el.dataset.i,10); const x=clamp01(tw(t,t0+i*per,t0+i*per+0.50)); const e=easeOut(x); el.style.opacity=e; el.style.transform=`translateX(${{(1-e)*120}}px)`; }});
  const ct0=1.50;
  chips.forEach((el)=>{{ const i=parseInt(el.dataset.i,10); const cx=clamp01(tw(t,ct0+i*0.08,ct0+i*0.08+0.40)); const ce=easeOut(cx); el.style.opacity=ce; el.style.transform=`translateY(${{(1-ce)*12}}px)`; }});
}});
</script></body></html>
"""


if __name__ == "__main__":
    main()

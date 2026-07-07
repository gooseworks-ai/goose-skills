#!/usr/bin/env python3
"""Generate the 'photo-grid promo card' HTML from a config.json — a designed feed card
whose signature is a CONTINUOUSLY SCROLLING 2-row grid (NOT a static hold): a fixed header
(brand wordmark + big headline + sub) and fixed feature chips, with a middle grid-viewport
that scrolls horizontally left across the whole ~10s while its tiles play.

Tiles are typed and MIXED-MEDIA (this is the whole point of the format):
  - "video"        a clip playing inside the tile (autoplay/muted/loop; cover-cropped)
  - "band-product" a real product hero on a soft band (contain)
  - "photo"/"image" a still photo (cover)
  - "pct"/"off"/"text" a big serif type tile (e.g. "25%", "OFF") — pixel-crisp DOM
  - "code"         a dark promo-code tile (CODE + accent-prefixed value)
  - "cta"          a dark call-to-action tile (title + sub) when there is no promo code

The grid is `grid-template-columns: repeat(cols, tile_w)` × `rows` rows, filled row-major,
faded at both edges with a CSS mask so tiles don't pop in. Motion is a pure function of time
(window.renderAt(t)); the <video> tiles play in real time (render.py paces to wall-clock).
Reuses _shared.js (the initRenderer scaffold). NO AI-rendered text — wordmark/%/code stay crisp.

Usage:  build_card.py --config config.json --out hyperframe.html
"""
import argparse, html, json, pathlib

def esc(s): return html.escape(str(s), quote=True)

def tile_html(t):
    kind = t.get("type", "photo")
    if kind == "band-product" or kind == "product":
        return f'<div class="tile band-product"><img src="{esc(t["image"])}" /></div>'
    if kind in ("photo", "image"):
        img = t.get("image")
        if img:
            return f'<div class="tile"><img src="{esc(img)}" /></div>'
        return '<div class="tile photo-placeholder"></div>'
    if kind == "video":
        cap = f'<div class="cap">{esc(t["caption"])}</div>' if t.get("caption") else ""
        stem = pathlib.Path(t["src"]).stem
        # Played by FRAME-SWAP, not <video>: render.py pre-extracts the clip to PNG frames and
        # swaps this <img>'s src per output frame. Playwright's bundled Chromium can't decode
        # <video> H.264 over file:// (open-source build lacks proprietary codecs) — it hangs on
        # canplay — so we let ffmpeg do the decode and drive frames deterministically.
        return (f'<div class="tile"><img class="vidframe" data-clip="{esc(stem)}" '
                f'data-src="{esc(t["src"])}" alt="" '
                f'src="data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7" />'
                f'{cap}</div>')
    if kind in ("pct", "off", "text"):
        size = t.get("size", 162 if kind == "off" else 156)
        txt = t.get("text", t.get("pct", t.get("label", "")))
        return (f'<div class="tile type-big"><div class="big" style="font-size:{size}px">'
                f'{esc(txt)}</div></div>')
    if kind == "code":
        val = t.get("value", "CODE"); accent = t.get("accent_prefix", "")
        if accent and val.startswith(accent):
            val_html = f'<span class="accent">{esc(accent)}</span>{esc(val[len(accent):])}'
        else:
            val_html = esc(val)
        return (f'<div class="tile code"><div class="lbl">{esc(t.get("label","CODE"))}</div>'
                f'<div class="val">{val_html}</div></div>')
    if kind == "cta":
        return (f'<div class="tile cta"><div class="cta-t">{esc(t.get("title","SHOP"))}</div>'
                f'<div class="cta-s">{esc(t.get("sub",""))}</div></div>')
    raise SystemExit(f"unknown tile type: {kind}")

DEFAULT_PALETTE = {"ink":"#0E1B22","ink_soft":"#4A5961","bg":"#E6EEF3",
                   "bg_tile":"#F4F8FB","bg_band":"#DCE6EC","accent":"#31ABE8"}

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--config", required=True)
    ap.add_argument("--out", required=True)
    a = ap.parse_args()
    cfg = json.loads(pathlib.Path(a.config).read_text())
    W, H = cfg.get("width",1080), cfg.get("height",1920)
    dur = cfg.get("duration_sec",10.0)
    p = {**DEFAULT_PALETTE, **cfg.get("palette",{})}
    sc = cfg.get("scroll",{})
    tw_ = sc.get("tile_w",360); th_ = sc.get("tile_h",380); gap = sc.get("gap",24)
    pad_x = sc.get("pad_x",60); cols = sc.get("cols",5); rows = sc.get("rows",2)
    entry_off = sc.get("entry_offset",80); soft = sc.get("soft_entry",0.80)

    tiles = cfg["tiles"]
    if len(tiles) != cols*rows:
        raise SystemExit(f"expected {cols*rows} tiles ({cols}x{rows}), got {len(tiles)}")
    track_total = cols*tw_ + (cols-1)*gap + 2*pad_x
    scroll_range = max(0, track_total - W)

    tiles_html = "\n".join(tile_html(t) for t in tiles)
    chips_html = "\n".join(f'<div class="chip">{esc(c)}</div>' for c in cfg.get("chips",[]))
    shared = (pathlib.Path(__file__).resolve().parent / "_shared.js").read_text()
    doc = TEMPLATE.format(
        W=W,H=H,dur=dur,shared_js=shared,
        wordmark=esc(cfg["wordmark"]), headline=cfg["headline"], sub=esc(cfg.get("sub","")),
        tiles=tiles_html, chips=chips_html,
        tile_w=tw_, tile_h=th_, gap=gap, pad_x=pad_x, cols=cols, rows=rows,
        grid_top=sc.get("band_top",640), grid_h=sc.get("band_height",800),
        head_top=sc.get("head_top",200), head_size=sc.get("head_size",154),
        brand_top=sc.get("brand_top",110), sub_top=sc.get("sub_top",528),
        chips_bottom=sc.get("chips_bottom",240),
        scroll_range=scroll_range, entry_off=entry_off, soft=soft,
        **{f"c_{k}":v for k,v in p.items()},
    )
    pathlib.Path(a.out).write_text(doc)
    print(f"[card] wrote {a.out} ({W}x{H}, {cols}x{rows} scrolling grid, "
          f"track={track_total}px, scroll_range={scroll_range}px)")

TEMPLATE = """<!doctype html>
<html lang="en"><head><meta charset="utf-8" />
<link href="https://api.fontshare.com/v2/css?f[]=cabinet-grotesk@500,700,800&f[]=zodiak@500,700&display=swap" rel="stylesheet" />
<script>{shared_js}</script>
<style>
:root {{ --ink:{c_ink}; --ink-soft:{c_ink_soft}; --bg:{c_bg}; --bg-tile:{c_bg_tile}; --bg-band:{c_bg_band}; --accent:{c_accent}; }}
* {{ margin:0; padding:0; box-sizing:border-box; }}
html,body {{ width:{W}px; height:{H}px; background:var(--bg); font-family:'Cabinet Grotesk',system-ui,sans-serif; color:var(--ink); overflow:hidden; -webkit-font-smoothing:antialiased; }}
.frame {{ position:relative; width:{W}px; height:{H}px; }}
.brand-mark {{ position:absolute; top:{brand_top}px; left:0; right:0; display:flex; justify-content:center; align-items:center; z-index:10; }}
.brand-mark img {{ height:44px; opacity:.92; }}
.headline {{ position:absolute; top:{head_top}px; left:0; right:0; text-align:center; font-weight:800; font-size:{head_size}px; line-height:.94; letter-spacing:-4.2px; color:var(--ink); z-index:10; }}
.sub {{ position:absolute; top:{sub_top}px; left:0; right:0; text-align:center; font-weight:500; font-size:38px; letter-spacing:-.2px; color:var(--ink-soft); z-index:10; }}
.grid-viewport {{ position:absolute; left:0; right:0; top:{grid_top}px; height:{grid_h}px; overflow:hidden; mask-image:linear-gradient(90deg,transparent 0,#000 4%,#000 96%,transparent 100%); -webkit-mask-image:linear-gradient(90deg,transparent 0,#000 4%,#000 96%,transparent 100%); }}
.grid-track {{ position:absolute; top:0; left:0; display:grid; grid-template-columns:repeat({cols},{tile_w}px); grid-template-rows:repeat({rows},{tile_h}px); gap:{gap}px; padding:0 {pad_x}px; width:max-content; will-change:transform; }}
.tile {{ position:relative; width:{tile_w}px; height:{tile_h}px; border-radius:26px; overflow:hidden; background:var(--bg-tile); box-shadow:0 1px 0 rgba(14,27,34,.03); }}
.tile img, .tile video {{ width:100%; height:100%; object-fit:cover; display:block; }}
.tile.photo-placeholder {{ background:linear-gradient(135deg,var(--bg-tile),var(--bg-band)); }}
.tile.band-product {{ background:var(--bg-band); display:flex; align-items:center; justify-content:center; padding:16px; }}
.tile.band-product img {{ width:105%; height:auto; object-fit:contain; }}
.tile .cap {{ position:absolute; left:16px; bottom:16px; background:#fff; color:#111; font-weight:600; font-size:24px; line-height:1; padding:10px 13px; border-radius:9px; box-shadow:0 1px 3px rgba(0,0,0,.12); }}
.tile.type-big {{ background:var(--bg-tile); display:flex; align-items:center; justify-content:center; padding:20px; }}
.tile.type-big .big {{ font-family:'Zodiak',serif; font-weight:700; letter-spacing:-5px; line-height:.9; color:var(--ink); }}
.tile.code {{ background:var(--ink); color:#fff; display:flex; flex-direction:column; align-items:center; justify-content:center; padding:22px; }}
.tile.code .lbl {{ font-weight:700; letter-spacing:6px; font-size:26px; color:rgba(255,255,255,.65); text-transform:uppercase; margin-bottom:14px; }}
.tile.code .val {{ font-weight:800; font-size:104px; letter-spacing:-3px; color:#fff; }}
.tile.code .val .accent {{ color:var(--accent); }}
.tile.cta {{ background:var(--ink); color:#fff; display:flex; flex-direction:column; align-items:center; justify-content:center; text-align:center; padding:22px; }}
.tile.cta .cta-t {{ font-weight:800; font-size:60px; line-height:.98; letter-spacing:-2px; }}
.tile.cta .cta-s {{ font-weight:600; font-size:26px; letter-spacing:1px; color:rgba(255,255,255,.72); margin-top:14px; }}
.chips {{ position:absolute; left:0; right:0; bottom:{chips_bottom}px; display:flex; justify-content:center; gap:22px; z-index:10; }}
.chip {{ background:var(--bg); border:2px solid var(--ink); border-radius:999px; padding:22px 42px; font-weight:700; font-size:30px; letter-spacing:1.8px; color:var(--ink); text-transform:uppercase; }}
</style></head>
<body><div class="frame">
<div class="brand-mark" id="brand"><img src="{wordmark}" /></div>
<div class="headline" id="headline">{headline}</div>
<div class="sub" id="sub">{sub}</div>
<div class="grid-viewport"><div class="grid-track" id="track">
{tiles}
</div></div>
<div class="chips" id="chips">
{chips}
</div>
</div>
<script>{shared_js}</script>
<script>
const brand=document.getElementById('brand'),headline=document.getElementById('headline'),sub=document.getElementById('sub'),track=document.getElementById('track');
const SCROLL_RANGE={scroll_range}, ENTRY_OFF={entry_off}, DUR={dur};
initRenderer(DUR, function(t){{
  brand.style.opacity=easeOut(clamp01(tw(t,0.00,0.40)));
  const hx=clamp01(tw(t,0.10,0.70)); headline.style.opacity=easeOut(hx);
  headline.style.transform=`translateY(${{(1-easeOut(hx))*32}}px)`;
  sub.style.opacity=easeOut(clamp01(tw(t,0.50,0.90)));
  const entry=easeOut(clamp01(tw(t,0.00,{soft}))); const entryOffset=ENTRY_OFF*(1-entry);
  const scrollOffset=-SCROLL_RANGE*clamp01(t/DUR);
  track.style.transform=`translateX(${{scrollOffset+entryOffset}}px)`;
}});
</script></body></html>
"""

if __name__ == "__main__":
    main()

#!/usr/bin/env python3
"""Build hyperframe.html for the `mosaic-grid-reveal` video format from a config.json.

Mechanic: a FULL-BLEED N×N mosaic of real product tiles pops in one tile at a time
(scatter order, ease-out-back overshoot), the grid holds then clears, and a clean
brand end card builds line-by-line — wordmark → sub → tagline → CTA. Deterministic:
window.renderAt(t) drives every element as a pure function of time (Playwright frame-step).

Usage:  build_html.py --config config.json [--out hyperframe.html]
Side effect: writes the computed `duration_sec` back into the config so render.py
reads the right length. Paths in the config (wordmark, tile images) are resolved
relative to the current working directory.
"""
import argparse
import json
import pathlib
import re


def load_wordmark(path, default_viewbox):
    """Return (viewBox, inner_svg). Accepts a full <svg>…</svg> or bare <path> markup."""
    raw = pathlib.Path(path).read_text()
    if "<svg" in raw:
        vb = re.search(r'viewBox="([^"]+)"', raw)
        inner = re.sub(r"(?s)^.*?<svg[^>]*>", "", raw)
        inner = re.sub(r"(?s)</svg>.*$", "", inner)
        return (vb.group(1) if vb else default_viewbox), inner.strip()
    return default_viewbox, raw.strip()


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--config", required=True)
    ap.add_argument("--out", default="hyperframe.html")
    args = ap.parse_args()

    cfgp = pathlib.Path(args.config)
    cfg = json.loads(cfgp.read_text())

    W = cfg.get("width", 1080)
    H = cfg.get("height", 1920)
    pal = cfg["palette"]
    grid = cfg.get("grid", {})
    cols = grid.get("cols", 3)
    rows = grid.get("rows", 3)
    inset = grid.get("inset", 20)
    gap = grid.get("gap", 14)
    n = cols * rows
    tiles = cfg["tiles"]
    assert len(tiles) == n, f"need {n} tiles for a {cols}x{rows} grid, got {len(tiles)}"
    pop_order = cfg.get("pop_order") or list(range(n))
    ec = cfg["end_card"]
    vb, wm_inner = load_wordmark(cfg["wordmark"], cfg.get("wordmark_viewbox", "0 0 170 92"))
    wm_w = cfg.get("wordmark_width", 430)
    eyebrow = cfg.get("eyebrow", "")  # optional top kicker held during the grid

    # ---- timeline (seconds) — computed here so render.py gets the right duration_sec ----
    tm = cfg.get("timing", {})
    g0 = tm.get("grid_in0", 0.35)
    cad = tm.get("cadence", 0.42)
    pop = tm.get("pop", 0.44)
    hold = tm.get("hold", 0.80)
    clear = tm.get("clear", 0.50)
    last_pop = g0 + (n - 1) * cad
    HOLD_END = last_pop + pop + hold
    T = {
        "GRID_IN0": g0, "CAD": cad, "POP": pop,
        "CLEAR0": HOLD_END, "CLEAR1": HOLD_END + clear,
        "END_IN0": HOLD_END + 0.33,
    }
    T["WM0"] = T["END_IN0"] + 0.20; T["WM1"] = T["WM0"] + 0.45
    T["EY0"] = T["WM0"] + 0.32;     T["EY1"] = T["EY0"] + 0.40
    T["TAG0"] = T["EY0"] + 0.28;    T["TAG1"] = T["TAG0"] + 0.45
    T["CTA0"] = T["TAG0"] + 0.42;   T["CTA1"] = T["CTA0"] + 0.45
    DURATION = round(T["CTA1"] + 1.75, 3)

    tile_divs = "\n".join(
        f'''<div class="tile" data-i="{i}" style="--tbg:{t['bg']};--tink:{t['ink']}">
              <div class="frame"><img src="{t['image']}" alt=""></div>
              <div class="cap">{t['name']}</div>
            </div>'''
        for i, t in enumerate(tiles)
    )
    eyebrow_div = f'<div id="eyebrow">{eyebrow}</div>' if eyebrow else ""

    HTML = f"""<!doctype html>
<html><head><meta charset="utf-8">
<style>
  * {{ margin:0; padding:0; box-sizing:border-box; }}
  :root {{
    --accent:{pal['accent']}; --accent-deep:{pal['accent_deep']}; --ink:{pal['ink']};
    --bg:{pal['bg']}; --cap:{pal.get('cap', '#9A948A')};
  }}
  html,body {{ width:{W}px; height:{H}px; }}
  body {{ background:var(--bg);
          font-family:-apple-system,'Helvetica Neue','Segoe UI',Arial,sans-serif;
          -webkit-font-smoothing:antialiased; overflow:hidden; }}
  #stage {{ position:relative; width:{W}px; height:{H}px; }}

  /* ---------- grid phase : FULL-BLEED mosaic ---------- */
  #gridwrap {{ position:absolute; inset:0; }}
  #eyebrow {{ position:absolute; top:70px; left:0; right:0; text-align:center;
              font-size:30px; font-weight:600; letter-spacing:11px;
              color:var(--accent-deep); text-transform:uppercase; }}
  #grid {{ position:absolute; inset:{inset}px; display:grid;
           grid-template-columns:repeat({cols},1fr); grid-template-rows:repeat({rows},1fr);
           gap:{gap}px; transform-origin:center; }}
  .tile {{ position:relative; background:var(--tbg); border-radius:26px;
           overflow:hidden; display:flex; flex-direction:column;
           align-items:center; justify-content:center; will-change:transform,opacity; }}
  .tile .frame {{ width:94%; height:52%; display:flex; align-items:center;
                  justify-content:center; }}
  .tile .frame img {{ max-width:100%; max-height:100%; object-fit:contain;
                      filter:drop-shadow(0 10px 14px rgba(0,0,0,.16)); }}
  .tile .cap {{ position:absolute; bottom:34px; font-size:25px; font-weight:700;
                letter-spacing:.4px; color:var(--tink); opacity:.92; }}

  /* ---------- end card ---------- */
  #end {{ position:absolute; inset:0; display:flex; flex-direction:column;
          align-items:center; justify-content:center; opacity:0; }}
  #wordmark {{ color:var(--ink); width:{wm_w}px; }}
  #wordmark svg {{ width:100%; height:auto; display:block; }}
  #sub {{ margin-top:20px; font-size:34px; font-weight:600; letter-spacing:17px;
          color:var(--accent-deep); text-transform:uppercase; }}
  #tagline {{ margin-top:70px; font-size:41px; font-weight:400; letter-spacing:.3px;
              color:var(--ink); text-align:center; }}
  #tagline b {{ font-weight:700; }}
  #cta {{ margin-top:78px; display:flex; flex-direction:column; align-items:center; }}
  #shop {{ background:var(--accent); color:#12210F; font-size:34px; font-weight:700;
           letter-spacing:.5px; padding:26px 66px; border-radius:100px;
           box-shadow:0 10px 24px rgba(0,0,0,.16); }}
  #url {{ margin-top:26px; font-size:28px; font-weight:500; letter-spacing:3px;
          color:var(--cap); }}
</style></head>
<body>
  <div id="stage">
    <div id="gridwrap">
      {eyebrow_div}
      <div id="grid">
        {tile_divs}
      </div>
    </div>
    <div id="end">
      <div id="wordmark"><svg viewBox="{vb}" fill="currentColor" xmlns="http://www.w3.org/2000/svg">{wm_inner}</svg></div>
      <div id="sub">{ec.get('sub','')}</div>
      <div id="tagline">{ec.get('tagline_top','')}<br><b>{ec.get('tagline_bottom','')}</b></div>
      <div id="cta">
        <div id="shop">{ec.get('cta','Shop Now')}</div>
        <div id="url">{ec.get('url','')}</div>
      </div>
    </div>
  </div>

<script src="_shared.js"></script>
<script>
  const POP_ORDER = {json.dumps(pop_order)};
  const T = {json.dumps({k: round(v, 3) for k, v in T.items()})};
  const tiles = [...document.querySelectorAll('.tile')];
  const popRank = {{}};
  POP_ORDER.forEach((cell, seq) => popRank[cell] = seq);

  const grid = document.getElementById('grid');
  const gridwrap = document.getElementById('gridwrap');
  const eyebrow = document.getElementById('eyebrow');
  const end = document.getElementById('end');
  const wm = document.getElementById('wordmark');
  const sub = document.getElementById('sub');
  const tag = document.getElementById('tagline');
  const cta = document.getElementById('cta');

  function fadeUp(el, p, dist){{ el.style.opacity=p; el.style.transform=`translateY(${{(1-p)*dist}}px)`; }}

  function render(t){{
    if (eyebrow) {{
      let eb = clamp01(tw(t,0.12,0.55));
      if (t>T.CLEAR0) eb *= (1-clamp01(tw(t,T.CLEAR0,T.CLEAR1)));
      eyebrow.style.opacity = eb;
    }}
    // per-tile pop
    tiles.forEach((tile,cell)=>{{
      const seq = popRank[cell];
      const t0 = T.GRID_IN0 + seq*T.CAD;
      const p = clamp01(tw(t, t0, t0+T.POP));
      const s = p<=0 ? 0.0 : easeOutBack(p, 1.15);
      tile.style.opacity = clamp01(tw(t, t0, t0+T.POP*0.45));
      tile.style.transform = `scale(${{s}})`;
    }});
    // grid clears
    const clr = clamp01(tw(t, T.CLEAR0, T.CLEAR1));
    gridwrap.style.opacity = 1 - clr;
    grid.style.transform = `scale(${{1 + 0.06*easeOut(clr)}})`;
    // end card build
    end.style.opacity = clamp01(tw(t, T.END_IN0, T.END_IN0+0.45));
    const wp = clamp01(tw(t, T.WM0, T.WM1));
    wm.style.opacity = wp;
    wm.style.transform = `scale(${{0.86 + 0.14*easeOut(wp)}})`;
    fadeUp(sub, clamp01(tw(t, T.EY0, T.EY1)), 16);
    fadeUp(tag, clamp01(tw(t, T.TAG0, T.TAG1)), 24);
    fadeUp(cta, clamp01(tw(t, T.CTA0, T.CTA1)), 26);
  }}

  window.__DURATION = {DURATION};
  initRenderer({DURATION}, render);
</script>
</body></html>
"""

    pathlib.Path(args.out).write_text(HTML)
    cfg["duration_sec"] = DURATION
    cfgp.write_text(json.dumps(cfg, indent=2))
    print(f"wrote {args.out}  (duration_sec={DURATION}, {n} tiles, {cols}x{rows})")


if __name__ == "__main__":
    main()

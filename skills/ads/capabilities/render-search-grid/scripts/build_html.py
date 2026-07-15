#!/usr/bin/env python3
"""build_html.py — config-driven renderer for the "search-grid" video ad format.

Reads a config.json (see config.example.json) and emits a single self-contained
index.html that exposes `window.seek(tMs)` for deterministic frame capture. All
images are base64-embedded so load is synchronous.

Four beats (mirrors the Pinterest search-moodboard reference):
  1. SEARCH  — masonry grid (side columns drift down / middle up) behind a Pinterest
               search bar; the hook types in letter-by-letter.
  2. CARDS   — 3 room cards slide in from the right and stack over a warm blurred backdrop.
  3. FEATURES— the TOP card physically expands (box-grows) to fill the screen, then
               swipe-left -> swipe-left through the same 3 rooms, each captioned.
  4. END     — hero card + wordmark + tagline + CTA on a warm background.

NOTE (free/deterministic renderer — no paid calls). The music bed (optional) is a
separate paid step (create-music-elevenlabs); render.py muxes it on.

Usage: python3 build_html.py --config config.json --out index.html
"""
import argparse, base64, json, mimetypes
from pathlib import Path


def datauri(path, base):
    p = (base / path) if not Path(path).is_absolute() else Path(path)
    mime = mimetypes.guess_type(str(p))[0] or "image/jpeg"
    return f"data:{mime};base64," + base64.b64encode(Path(p).read_bytes()).decode()


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--config", required=True)
    ap.add_argument("--out", default="index.html")
    args = ap.parse_args()

    cfg_path = Path(args.config).resolve()
    base = cfg_path.parent
    cfg = json.loads(cfg_path.read_text())

    C = cfg.get("canvas", {})
    W, H = C.get("width", 1080), C.get("height", 1920)
    DUR = C.get("duration_ms", 18000)
    hook = cfg["hook"]
    placeholder = cfg.get("placeholder", "Search for anything")
    caret_color = cfg.get("caret_color", "#c8102e")

    # 3 columns of masonry tiles (side cols drift down, middle up)
    cols = cfg["grid_cols"]
    assert len(cols) == 3, "grid_cols must be exactly 3 columns"
    rooms = cfg["rooms"]           # [{image, caption}] x3 — the cards AND the features
    assert len(rooms) == 3, "exactly 3 rooms required"
    stack_bg = cfg["stack_bg"]
    ec = cfg["endcard"]

    U = {}  # de-dup base64 by path
    def uri(path):
        if path not in U:
            U[path] = datauri(path, base)
        return U[path]

    cols_html = ""
    for ci, col in enumerate(cols):
        cls = "up" if ci == 1 else "down"
        tiles = "\n".join(f'<div class="tile"><img src="{uri(t)}"></div>' for t in col)
        cols_html += f'<div class="col {cls}">{tiles}</div>\n'

    stack_html = "\n".join(
        f'<div class="stackcard" id="sc{i}"><img src="{uri(r["image"])}"></div>'
        for i, r in enumerate(rooms))
    feat_html = "\n".join(
        f'<div class="feat" id="feat{i}"><div class="feat-img"><img src="{uri(r["image"])}"></div>'
        f'<div class="feat-scrim"></div><div class="feat-cap" id="cap{i}">{r["caption"]}</div></div>'
        for i, r in enumerate(rooms))

    ec_bg = ec.get("bg", "radial-gradient(120% 82% at 50% 42%, #ecdfce 0%, #d9c6ac 100%)")

    html = f"""<!DOCTYPE html><html lang="en"><head><meta charset="utf-8">
<style>
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600&display=swap');
  * {{ margin:0; padding:0; box-sizing:border-box; }}
  html,body {{ width:{W}px; height:{H}px; overflow:hidden; background:#efece7; }}
  #stage {{ position:relative; width:{W}px; height:{H}px; overflow:hidden; background:#efece7; }}
  .layer {{ position:absolute; inset:0; }}

  /* beat 1: search grid */
  #gridwrap {{ position:absolute; inset:0; overflow:hidden; }}
  .col {{ position:absolute; top:0; width:330px; display:flex; flex-direction:column; gap:22px; will-change:transform; }}
  .col:nth-of-type(1) {{ left:22px; }} .col:nth-of-type(2) {{ left:375px; }} .col:nth-of-type(3) {{ left:728px; }}
  .tile {{ width:100%; border-radius:22px; overflow:hidden; box-shadow:0 10px 30px rgba(40,30,20,.14); background:#fff; }}
  .tile img {{ display:block; width:100%; height:auto; }}
  #scrim {{ position:absolute; inset:0; pointer-events:none;
    background:radial-gradient(120% 55% at 50% 33%, rgba(245,242,237,.80) 0%, rgba(245,242,237,.44) 34%, rgba(245,242,237,0) 62%); }}
  #vignette {{ position:absolute; inset:0; pointer-events:none;
    background:linear-gradient(180deg, rgba(60,45,35,.10) 0%, rgba(0,0,0,0) 16%, rgba(0,0,0,0) 84%, rgba(60,45,35,.16) 100%); }}
  #searchwrap {{ position:absolute; top:33%; left:50%; transform:translate(-50%,-50%); width:840px; }}
  #searchbar {{ display:flex; align-items:center; gap:18px; height:118px; padding:0 30px 0 40px; background:#fff; border-radius:60px; box-shadow:0 18px 50px rgba(40,25,15,.22); }}
  #query {{ flex:1; font-family:'DM Sans',sans-serif; font-weight:500; font-size:44px; color:#2b2622; white-space:nowrap; overflow:hidden; }}
  #query .ph {{ color:#b7ada3; }}
  #caret {{ display:inline-block; width:3px; height:50px; margin-left:2px; background:{caret_color}; vertical-align:middle; transform:translateY(6px); }}
  #mag svg {{ width:52px; height:52px; }}

  /* beat 2: card stack */
  #beat-stack {{ opacity:0; overflow:hidden; background:#6f432b; }}
  #stack-bg {{ position:absolute; inset:-80px; background-image:url('{uri(stack_bg)}'); background-size:cover; background-position:center;
    filter:blur(42px) brightness(.72) saturate(1.25); transform:scale(1.25); }}
  #stack-tint {{ position:absolute; inset:0; background:radial-gradient(122% 82% at 50% 45%, rgba(96,58,36,.20) 0%, rgba(48,26,15,.66) 100%); }}
  #stack-cards {{ position:absolute; inset:0; }}
  .stackcard {{ position:absolute; left:90px; width:900px; height:392px; border-radius:26px; overflow:hidden;
    box-shadow:0 26px 60px rgba(30,18,10,.34); will-change:transform,opacity,width,height; }}
  #sc0 {{ top:342px; z-index:3; }} #sc1 {{ top:764px; z-index:2; }} #sc2 {{ top:1186px; z-index:1; }}
  .stackcard img {{ width:100%; height:100%; object-fit:cover; display:block; }}

  /* beat 3: features (grow -> swipe -> swipe) */
  #beat-features {{ opacity:0; background:#000; overflow:hidden; }}
  #feat-track {{ position:absolute; inset:0; }}
  .feat {{ position:absolute; inset:0; }}
  .feat-img {{ position:absolute; inset:0; overflow:hidden; }}
  .feat-img img {{ width:100%; height:100%; object-fit:cover; display:block; transform-origin:center; will-change:transform; }}
  .feat-scrim {{ position:absolute; inset:0; background:linear-gradient(180deg, rgba(0,0,0,.14) 0%, rgba(0,0,0,0) 26%, rgba(0,0,0,0) 50%, rgba(20,12,8,.64) 100%); }}
  .feat-cap {{ position:absolute; left:0; right:0; bottom:196px; text-align:center; opacity:0;
    font-family:'DM Sans',sans-serif; font-weight:600; font-size:66px; letter-spacing:.4px; color:#fff; text-shadow:0 3px 26px rgba(0,0,0,.44); }}
  #feat-url {{ position:absolute; bottom:80px; left:0; right:0; text-align:center; opacity:0;
    font-family:'DM Sans',sans-serif; font-weight:600; font-size:28px; letter-spacing:2px; text-transform:uppercase; color:#fff; text-shadow:0 2px 14px rgba(0,0,0,.55); }}

  /* beat 4: end card */
  #beat-end {{ opacity:0; display:flex; flex-direction:column; align-items:center; justify-content:center; padding:0 90px; background:{ec_bg}; }}
  #ec-inner {{ display:flex; flex-direction:column; align-items:center; will-change:transform; }}
  #ec-hero {{ width:704px; height:1054px; border-radius:34px; overflow:hidden; box-shadow:0 30px 80px rgba(40,25,15,.32); margin-bottom:58px; }}
  #ec-hero img {{ width:100%; height:100%; object-fit:cover; display:block; }}
  #ec-logo {{ height:64px; margin-bottom:34px; }}
  #ec-tagline {{ font-family:'Fraunces',serif; font-weight:400; font-size:46px; color:#3a332c; text-align:center; line-height:1.25; }}
  #ec-cta {{ margin-top:52px; font-family:'DM Sans',sans-serif; font-weight:600; font-size:30px; letter-spacing:2px; text-transform:uppercase; color:#8a7f73; }}
</style></head>
<body>
<div id="stage">
  <div id="beat-search" class="layer">
    <div id="gridwrap">{cols_html}</div>
    <div id="scrim"></div><div id="vignette"></div>
    <div id="searchwrap"><div id="searchbar">
      <div id="query"><span id="typed"></span><span id="caret"></span></div>
      <div id="mag"><svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="10.5" cy="10.5" r="7" stroke="#2b2622" stroke-width="2.4"/>
        <line x1="15.8" y1="15.8" x2="21" y2="21" stroke="#2b2622" stroke-width="2.8" stroke-linecap="round"/></svg></div>
    </div></div>
  </div>
  <div id="beat-stack" class="layer">
    <div id="stack-bg"></div><div id="stack-tint"></div>
    <div id="stack-cards">{stack_html}</div>
  </div>
  <div id="beat-features" class="layer">
    <div id="feat-track">{feat_html}</div>
    <div id="feat-url">{ec.get("cta_short", "")}</div>
  </div>
  <div id="beat-end" class="layer">
    <div id="ec-inner">
      <div id="ec-hero"><img src="{uri(ec["hero"])}"></div>
      <img id="ec-logo" src="{uri(ec["wordmark"])}">
      <div id="ec-tagline">{ec["tagline"]}</div>
      <div id="ec-cta">{ec["cta"]}</div>
    </div>
  </div>
</div>
<script>
  const HOOK={json.dumps(hook)}, PLACEHOLDER={json.dumps(placeholder)}, DUR={DUR};
  const $=id=>document.getElementById(id);
  const typed=$('typed'), caret=$('caret');
  const bSearch=$('beat-search'), bStack=$('beat-stack'), bFeat=$('beat-features'), bEnd=$('beat-end');
  const cols=Array.from(document.querySelectorAll('.col'));
  const scards=[0,1,2].map(i=>$('sc'+i));
  const feats=[0,1,2].map(i=>$('feat'+i)); const featImgs=feats.map(f=>f.querySelector('img'));
  const caps=[0,1,2].map(i=>$('cap'+i));
  const clamp01=x=>Math.max(0,Math.min(1,x)), lerp=(a,b,t)=>a+(b-a)*t, smooth=t=>{{t=clamp01(t);return t*t*(3-2*t);}};
  const ramp=(t,a,b)=>smooth((t-a)/(b-a));
  const base=[]; function measure(){{ cols.forEach((c,i)=>base[i]=-((c.scrollHeight-{H})/2)); }}
  function seek(t){{
    t=Math.max(0,Math.min(DUR,t));
    const TS=480, TE=3350, n=HOOK.length;
    let ch = t<TS?0 : t>=TE?n : Math.round(n*(t-TS)/(TE-TS));
    typed.innerHTML = ch===0 ? '<span class="ph">'+PLACEHOLDER+'</span>' : '';
    if(ch>0) typed.textContent=HOOK.slice(0,ch);
    caret.style.opacity=((t>=TS&&t<TE)||(Math.floor(t/450)%2)===0)?'1':'0';
    const gp=clamp01(t/5000), ge=gp*(2-gp);
    cols.forEach((c,i)=>{{ const d=(i===1)?-1:1; c.style.transform='translateY('+(base[i]+d*ge*96).toFixed(2)+'px)'; }});

    bSearch.style.opacity=(1-ramp(t,4500,5000)).toFixed(3);
    bSearch.style.transform='scale('+lerp(1,1.04,ramp(t,4500,5000)).toFixed(4)+')';
    bStack.style.opacity=(ramp(t,4650,5150)*(1-ramp(t,7560,7680))).toFixed(3);
    bFeat.style.opacity=(ramp(t,7500,7620)*(1-ramp(t,14000,14500))).toFixed(3);
    bEnd.style.opacity=ramp(t,14100,14650).toFixed(3);
    $('ec-inner').style.transform='scale('+lerp(1.05,1,smooth(ramp(t,14100,15000))).toFixed(4)+')';

    scards.forEach((el,i)=>{{ const st=5050+i*160, p=smooth(ramp(t,st,st+640));
      el.style.transform='translateX('+lerp(1250,0,p).toFixed(1)+'px)'; el.style.opacity=p.toFixed(3); }});
    const ex=smooth(ramp(t,6750,7550)), s0=scards[0];   // top card grows to fill
    s0.style.left=lerp(90,0,ex).toFixed(1)+'px'; s0.style.top=lerp(342,0,ex).toFixed(1)+'px';
    s0.style.width=lerp(900,{W},ex).toFixed(1)+'px'; s0.style.height=lerp(392,{H},ex).toFixed(1)+'px';
    s0.style.borderRadius=lerp(26,0,ex).toFixed(1)+'px';

    const pos=ramp(t,9500,9850)+ramp(t,11900,12250);
    feats.forEach((el,i)=>{{ el.style.transform='translateX('+((i-pos)*{W}).toFixed(1)+'px)'; }});
    featImgs.forEach((im,i)=>{{ const a=Math.max(0,1-Math.abs(i-pos)); im.style.transform='scale('+(1+0.06*a).toFixed(4)+')'; }});
    caps.forEach((el,i)=>{{ let o=smooth(clamp01(1.25-Math.abs(i-pos)*1.9)); if(i===0)o*=ramp(t,7700,8050); el.style.opacity=o.toFixed(3); }});
    $('feat-url').style.opacity=clamp01(Math.min(ramp(t,7650,8000),1-ramp(t,13800,14200))).toFixed(3);
  }}
  window.seek=seek;
  window.addEventListener('load',()=>{{ measure(); seek(0); document.title='ready'; }});
  measure(); seek(0);
</script>
</body></html>
"""
    Path(args.out).write_text(html)
    print(f"wrote {args.out} ({len(html)//1024} KB)")


if __name__ == "__main__":
    main()

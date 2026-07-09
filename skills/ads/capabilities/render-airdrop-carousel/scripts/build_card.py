#!/usr/bin/env python3
"""build_card.py — generate the keyable iOS "AirDrop" share-sheet card HTML.

Writes two HTML files (normal + Accept-pressed) sized to the target frame. Each
renders a native-looking AirDrop card on a GREEN page (#00e000, keyed out in
compose_carousel.py) with a MAGENTA preview window (#ff00ff, replaced per-product
in compose_carousel.py) and a SOLID brand band (wordmark + tagline). Text is real
DOM text, never AI-rendered, so it stays pixel-crisp.

Render these two HTML files to PNG (fullPage) with any headless Chrome — Playwright
(see one_shot.py) or the chrome-devtools MCP — then feed the PNGs to
compose_carousel.py.

The two chroma colors are load-bearing and must not appear in the card art:
  GREEN   #00e000 = page background  -> keyed to transparency (the card's alpha)
  MAGENTA #ff00ff = preview window   -> replaced by each product image
"""
import argparse, html, os

GREEN = "#00e000"
MAGENTA = "#ff00ff"


def build(brand, message, tagline, wordmark_svg, wordmark_text, accent,
          band_color, card_width, pressed):
    accept_bg = "background:rgba(0,0,0,.06);" if pressed else ""
    if wordmark_svg and os.path.exists(wordmark_svg):
        wm = open(wordmark_svg).read()
    else:
        wm = f'<div style="font-size:56px;font-weight:800;letter-spacing:-1px;color:#1a1a1a">{html.escape(wordmark_text)}</div>'
    tag = html.escape(tagline).replace("(R)", "&reg;").replace(" - ", " &middot; ")
    return f"""<!doctype html><html><head><meta charset="utf-8"><style>
*{{margin:0;padding:0;box-sizing:border-box;-webkit-font-smoothing:antialiased;}}
html,body{{background:{GREEN};}}
.frame{{position:relative;width:1080px;height:1920px;overflow:hidden;background:{GREEN};
  font-family:-apple-system,"SF Pro Display","SF Pro Text","Helvetica Neue",Arial,sans-serif;}}
.card{{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);
  width:{card_width}px;background:#fafafa;border-radius:42px;overflow:hidden;box-shadow:none;}}
.pad{{padding:42px 46px 10px;}}
.title{{text-align:center;font-size:45px;font-weight:700;letter-spacing:.3px;color:#111;}}
.sub{{text-align:center;font-size:30px;font-weight:400;color:#3a3a3c;margin-top:13px;line-height:1.35;}}
.sub b{{font-weight:800;color:#111;letter-spacing:-.5px;}}
.preview{{margin:30px 46px 36px;border-radius:28px;overflow:hidden;position:relative;
  aspect-ratio:928/1010;background:{MAGENTA};}}
.band{{position:absolute;left:0;right:0;bottom:0;padding:22px 30px 26px;
  background:{band_color};border-top:1px solid rgba(0,0,0,.06);}}
.wm{{display:flex;justify-content:center;align-items:center;}}
.wm svg{{height:50px;width:auto;}}
.tagline{{color:#1a1a1a;font-size:18px;font-weight:600;letter-spacing:2.2px;text-align:center;
  margin-top:10px;text-transform:uppercase;opacity:.82;}}
.btns{{display:flex;border-top:1px solid rgba(0,0,0,.12);}}
.btn{{flex:1;text-align:center;padding:36px 0;font-size:35px;font-weight:500;}}
.decline{{color:#8a8a8e;}}
.accept{{color:{accent};font-weight:800;border-left:1px solid rgba(0,0,0,.12);{accept_bg}}}
</style></head><body>
<div class="frame"><div class="card">
  <div class="pad"><div class="title">AirDrop</div>
    <div class="sub"><b>{html.escape(brand)}</b> {html.escape(message)}</div></div>
  <div class="preview"><div class="band"><div class="wm">{wm}</div>
    <div class="tagline">{tag}</div></div></div>
  <div class="btns"><div class="btn decline">Decline</div><div class="btn accept">Accept</div></div>
</div></div></body></html>"""


def main():
    ap = argparse.ArgumentParser(description="Generate keyable AirDrop card HTML (normal + pressed).")
    ap.add_argument("--brand", required=True, help='sender name, bold in the line, e.g. "dibs."')
    ap.add_argument("--message", required=True, help='rest of the line, e.g. "would like to share a blush"')
    ap.add_argument("--tagline", default="", help='band tagline, e.g. "The viral Desert Island Duo - 1M+ sold"')
    ap.add_argument("--wordmark-svg", default="", help="path to brand wordmark SVG (inlined); falls back to --wordmark-text")
    ap.add_argument("--wordmark-text", default="", help="text wordmark when no SVG (defaults to --brand)")
    ap.add_argument("--accent", default="#d98695", help="Accept-button color (brand accent)")
    ap.add_argument("--band-color", default="#f5e9da", help="brand band background color")
    ap.add_argument("--card-width", type=int, default=672)
    ap.add_argument("--out-dir", required=True)
    a = ap.parse_args()
    os.makedirs(a.out_dir, exist_ok=True)
    wt = a.wordmark_text or a.brand
    for pressed, name in ((False, "chrome.html"), (True, "chrome-pressed.html")):
        htmlstr = build(a.brand, a.message, a.tagline, a.wordmark_svg, wt, a.accent,
                        a.band_color, a.card_width, pressed)
        open(os.path.join(a.out_dir, name), "w").write(htmlstr)
    print(f"wrote {a.out_dir}/chrome.html + chrome-pressed.html")


if __name__ == "__main__":
    main()

#!/usr/bin/env python3
"""build_assets.py — deterministic PIL builder for the iMessage notification-cascade ad.

Reads the same config.json as one_shot.py / compose.py and writes, into --work-dir:
  nb-1.png .. nb-N.png   one transparent banner per notification (full-1080-wide canvas)
  pill.png               the right-aligned "v Show less / X" grouped-notification control
  endcard.png            the serif CTA + brand wordmark lockup (transparent 1080x1920)

Every banner is an AUTHENTIC iMessage notification: green Apple Messages icon, bold
title, message body, "NOW", italic sender handle bottom-right. The background is a
warm TRANSLUCENT greige (NOT white) with a soft dark drop shadow (NOT a white bloom)
— sampled from the source trend (fill composites to ~RGB 220,197,186 over a warm
desk). ALL text is composited here, never AI-rendered (LEARNINGS L4).

Geometry constants MUST stay in sync with compose.py (BODY_W, BANNER_H, PAD, SIDE).
"""
import argparse, json, os
from PIL import Image, ImageDraw, ImageFont, ImageFilter

# ---- geometry (keep in sync with compose.py) ----
CANVAS_W = 1080
BODY_W = 810
BANNER_H = 176
SIDE = (CANVAS_W - BODY_W) // 2      # 135
PAD = 60
ROW_CANVAS_H = BANNER_H + PAD * 2    # 296
RADIUS = 40
# warm cream, TRANSLUCENT — over a warm desk this reads as the source greige (~220,197,186)
FILL = (246, 228, 219, 205)
SHADOW = (30, 22, 16)                # warm-dark soft box-shadow

# ---- fonts (macOS; SF Pro with Arial fallback, Times for the serif CTA) ----
SF = "/System/Library/Fonts/SFNS.ttf"
ARIAL_B = "/System/Library/Fonts/Supplemental/Arial Bold.ttf"
ARIAL = "/System/Library/Fonts/Supplemental/Arial.ttf"
ARIAL_I = "/System/Library/Fonts/Supplemental/Arial Italic.ttf"
TIMES = "/System/Library/Fonts/Times.ttc"

def font(kind, size):
    try:
        if kind in ("bold", "reg", "semibold", "medium"):
            f = ImageFont.truetype(SF, size)
            f.set_variation_by_name({"bold": "Bold", "reg": "Regular", "semibold": "Semibold", "medium": "Medium"}[kind])
            return f
    except Exception:
        pass
    return ImageFont.truetype({"bold": ARIAL_B, "semibold": ARIAL_B, "medium": ARIAL_B, "reg": ARIAL, "italic": ARIAL_I}.get(kind, ARIAL), size)

def serif(size):
    try:
        return ImageFont.truetype(TIMES, size, index=1)
    except Exception:
        return ImageFont.truetype("/System/Library/Fonts/Supplemental/Times New Roman Bold.ttf", size)

def rounded(size, radius, fill):
    im = Image.new("RGBA", size, (0, 0, 0, 0))
    ImageDraw.Draw(im).rounded_rectangle([0, 0, size[0]-1, size[1]-1], radius=radius, fill=fill)
    return im

def hex_rgb(s, default=(240, 95, 34)):
    if not s:
        return default
    s = s.lstrip("#")
    return tuple(int(s[i:i+2], 16) for i in (0, 2, 4))

# ---- Apple Messages green icon (drawn, not AI) ----
def messages_icon(px=100):
    grad = Image.new("RGBA", (px, px), (0, 0, 0, 0))
    top, bot = (99, 232, 92), (28, 199, 62)
    for y in range(px):
        f = y / (px - 1)
        c = tuple(int(top[i] + (bot[i]-top[i]) * f) for i in range(3))
        for x in range(px):
            grad.putpixel((x, y), c + (255,))
    mask = Image.new("L", (px, px), 0)
    ImageDraw.Draw(mask).rounded_rectangle([0, 0, px-1, px-1], radius=int(px*0.235), fill=255)
    icon = Image.new("RGBA", (px, px), (0, 0, 0, 0)); icon.paste(grad, (0, 0), mask)
    d = ImageDraw.Draw(icon); bw, bh = int(px*0.60), int(px*0.50); bx = (px-bw)//2; by = int(px*0.20)
    d.rounded_rectangle([bx, by, bx+bw, by+bh], radius=int(bh*0.42), fill=(255, 255, 255, 255))
    tx, ty = bx+int(bw*0.16), by+bh-2
    d.polygon([(tx, ty-6), (tx+18, ty-6), (tx-2, ty+14)], fill=(255, 255, 255, 255))
    return icon

def icon_from_path(path, px=100):
    im = Image.open(path).convert("RGBA")
    g = min(im.size)
    im = im.crop(((im.width-g)//2, (im.height-g)//2, (im.width+g)//2, (im.height+g)//2)).resize((px, px), Image.LANCZOS)
    mask = Image.new("L", (px, px), 0)
    ImageDraw.Draw(mask).rounded_rectangle([0, 0, px-1, px-1], radius=int(px*0.235), fill=255)
    out = Image.new("RGBA", (px, px), (0, 0, 0, 0)); out.paste(im, (0, 0), mask)
    return out

def get_icon(cfg, px=100):
    ic = cfg.get("app_icon", "messages")
    if ic and ic != "messages" and os.path.exists(ic):
        return icon_from_path(ic, px)
    return messages_icon(px)

# ---- one notification banner ----
def build_banner(cfg, title, body, handle, out):
    canvas = Image.new("RGBA", (CANVAS_W, ROW_CANVAS_H), (0, 0, 0, 0))
    bx0, by0 = SIDE, PAD; bx1, by1 = SIDE+BODY_W, PAD+BANNER_H
    # soft dark drop shadow (real box-shadow; diffuse, low opacity) — NOT a white bloom
    sh = Image.new("RGBA", (CANVAS_W, ROW_CANVAS_H), (0, 0, 0, 0))
    ImageDraw.Draw(sh).rounded_rectangle([bx0-4, by0-2, bx1+4, by1+10], radius=RADIUS+4, fill=SHADOW+(120,))
    sh = sh.filter(ImageFilter.GaussianBlur(26)); canvas = Image.alpha_composite(canvas, sh)
    # translucent frosted body
    canvas.alpha_composite(rounded((BODY_W, BANNER_H), RADIUS, tuple(cfg.get("fill", FILL))), (bx0, by0))
    d = ImageDraw.Draw(canvas)
    icon = get_icon(cfg, 100); ix = bx0+24; iy = by0+(BANNER_H-100)//2; canvas.alpha_composite(icon, (ix, iy))
    text_x = ix+100+24
    f_title, f_body, f_now, f_handle = font("bold", 38), font("reg", 36), font("reg", 25), font("italic", 25)
    ty = by0+34
    d.text((text_x, ty), title, font=f_title, fill=(20, 20, 22, 255))
    d.text((text_x, ty+50), body, font=f_body, fill=(70, 68, 72, 255))
    now_w = d.textlength("NOW", font=f_now); d.text((bx1-26-now_w, by0+30), "NOW", font=f_now, fill=(140, 138, 140, 255))
    h_w = d.textlength(handle, font=f_handle); d.text((bx1-26-h_w, by1-42), handle, font=f_handle, fill=(150, 146, 146, 255))
    canvas.save(out)

# ---- right-aligned "v Show less / X" control pill ----
def build_pill(out):
    H = 140; canvas = Image.new("RGBA", (CANVAS_W, H), (0, 0, 0, 0)); d0 = ImageDraw.Draw(canvas)
    f = font("reg", 31); label = "Show less"; lw = d0.textlength(label, font=f)
    pill_w = int(40+30+lw+38); pill_h = 72; x_circle = 72; gap = 18
    group_w = pill_w+gap+x_circle; right_edge = SIDE+BODY_W; gx = right_edge-group_w; gy = (H-pill_h)//2
    sh = Image.new("RGBA", (CANVAS_W, H), (0, 0, 0, 0))
    ImageDraw.Draw(sh).rounded_rectangle([gx-2, gy, gx+pill_w+2, gy+pill_h+8], radius=pill_h//2, fill=SHADOW+(110,))
    ImageDraw.Draw(sh).ellipse([gx+pill_w+gap-2, gy, gx+pill_w+gap+x_circle+2, gy+pill_h+8], fill=SHADOW+(110,))
    sh = sh.filter(ImageFilter.GaussianBlur(20)); canvas = Image.alpha_composite(canvas, sh)
    d = ImageDraw.Draw(canvas)
    d.rounded_rectangle([gx, gy, gx+pill_w, gy+pill_h], radius=pill_h//2, fill=(247, 244, 240, 210))
    cxx = gx+32; cyy = gy+pill_h//2
    d.line([(cxx-11, cyy-6), (cxx, cyy+6), (cxx+11, cyy-6)], fill=(90, 88, 90, 255), width=5)
    d.text((cxx+20, gy+pill_h//2-21), label, font=f, fill=(70, 68, 72, 255))
    ox = gx+pill_w+gap; d.ellipse([ox, gy, ox+x_circle, gy+pill_h], fill=(247, 244, 240, 210))
    cx2 = ox+x_circle//2; cy2 = gy+pill_h//2; r = 16
    d.line([(cx2-r, cy2-r), (cx2+r, cy2+r)], fill=(90, 88, 90, 255), width=6)
    d.line([(cx2-r, cy2+r), (cx2+r, cy2-r)], fill=(90, 88, 90, 255), width=6)
    canvas.save(out)

# ---- serif CTA + brand wordmark end card ----
def build_endcard(ec, out):
    W, Hh = 1080, 1920; card = Image.new("RGBA", (W, Hh), (0, 0, 0, 0)); d = ImageDraw.Draw(card)
    accent = hex_rgb(ec.get("accent", "#f05f22"))
    def center(txt, fnt, y, fill, sh=True):
        w = d.textlength(txt, font=fnt); x = (W-w)//2
        if sh: d.text((x+2, y+3), txt, font=fnt, fill=(0, 0, 0, 150))
        d.text((x, y), txt, font=fnt, fill=fill)
    center(ec.get("line1", "MEET YOUR"), serif(92), 690, (245, 240, 235, 255))
    center(ec.get("line2", "AI COWORKER"), serif(70), 802, accent+(255,))
    # wordmark lockup: optional brand icon + "Word"+"mark" split (bold + light)
    wm = ec.get("wordmark_text", "")
    f1, f2 = font("bold", 66), font("reg", 66)
    icon_w = 0; wm_icon = None
    if ec.get("wordmark_icon") and os.path.exists(ec["wordmark_icon"]):
        wm_icon = rounded((78, 78), 18, accent+(255,))
        gi = Image.open(ec["wordmark_icon"]).convert("RGBA"); g = min(gi.size)
        gi = gi.crop(((gi.width-g)//2, (gi.height-g)//2, (gi.width+g)//2, (gi.height+g)//2)).resize((64, 64), Image.LANCZOS)
        m = Image.new("L", (64, 64), 0); ImageDraw.Draw(m).ellipse([0, 0, 63, 63], fill=255)
        wm_icon.paste(gi, (7, 7), m); icon_w = 78+20
    split = max(1, len(wm)*3//5)
    a, b = wm[:split], wm[split:]
    w1 = d.textlength(a, font=f1); w2 = d.textlength(b, font=f2)
    total = icon_w + w1 + w2; x0 = int((W-total)//2); wm_y = 1010
    if wm_icon is not None:
        card.alpha_composite(wm_icon, (x0, wm_y-6))
    tx = x0 + icon_w
    d.text((tx, wm_y), a, font=f1, fill=(247, 244, 240, 255)); d.text((tx+w1, wm_y), b, font=f2, fill=(196, 188, 180, 255))
    url = ec.get("url", "")
    if url:
        fu = font("semibold", 38); uw = d.textlength(url, font=fu)
        r, g, bl = accent; d.text(((W-uw)//2, 1140), url, font=fu, fill=(min(255, r+30), g+55, bl+86, 255))
    card.save(out)

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--config", required=True)
    ap.add_argument("--work-dir", required=True)
    a = ap.parse_args()
    cfg = json.load(open(a.config))
    os.makedirs(a.work_dir, exist_ok=True)
    notifs = cfg["notifications"]
    for i, n in enumerate(notifs, 1):
        build_banner(cfg, n["title"], n["body"], n.get("handle", ""), os.path.join(a.work_dir, f"nb-{i}.png"))
    build_pill(os.path.join(a.work_dir, "pill.png"))
    build_endcard(cfg.get("end_card", {}), os.path.join(a.work_dir, "endcard.png"))
    print(f"built {len(notifs)} banners + pill + endcard -> {a.work_dir}")

if __name__ == "__main__":
    main()

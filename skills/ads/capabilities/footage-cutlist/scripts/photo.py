"""A photo treatment shared by preview and render. The selected region stays visible."""
from PIL import Image, ImageFilter
import math
import statistics


def validate(b):
    cfg = b.get("photo") or {}
    for key in ("start_scale", "end_scale"):
        v = cfg.get(key, .94 if key == "start_scale" else 1)
        if not isinstance(v, (int, float)) or not math.isfinite(v) or not .85 <= v <= 1:
            raise ValueError("photo scale must be 0.85–1.0; the selected region must stay visible")
    for key in ("start_pan", "end_pan"):
        v = cfg.get(key, [0, 0])
        if not isinstance(v, list) or len(v) != 2 or any(not isinstance(x, (int, float)) or not math.isfinite(x) or abs(x) > 1 for x in v):
            raise ValueError("photo pan must be [x,y] between -1 and 1")
    crop = b.get("crop", [0, 0, 1, 1])
    region = cfg.get("box", [0, 0, 1, 1])
    for name, rect in (("crop", crop), ("photo.box", region)):
        if not isinstance(rect, list) or len(rect) != 4 or not 0 <= rect[0] < rect[2] <= 1 or not 0 <= rect[1] < rect[3] <= 1:
            raise ValueError(name + " must be an ordered normalized rectangle")
    for rect in cfg.get("protected", []):
        if not isinstance(rect, list) or len(rect) != 4 or not crop[0] <= rect[0] < rect[2] <= crop[2] or not crop[1] <= rect[1] < rect[3] <= crop[3]:
            raise ValueError("photo crop would remove a protected product/text region")
    return cfg


def render(im, W, H, b, progress, bg="auto"):
    cfg = validate(b)
    im = im.convert("RGB")
    c = b.get("crop", [0, 0, 1, 1])
    im = im.crop((round(c[0]*im.width), round(c[1]*im.height), round(c[2]*im.width), round(c[3]*im.height)))
    if bg == "blur":
        fill = im.resize((W, H)).filter(ImageFilter.GaussianBlur(30))
    else:
        corners = [im.getpixel(p) for p in ((0,0),(im.width-1,0),(0,im.height-1),(im.width-1,im.height-1))]
        color = tuple(round(statistics.median(p[i] for p in corners)) for i in range(3)) if bg == "auto" else bg
        fill = Image.new("RGB", (W, H), color)
    box = cfg.get("box", [0, 0, 1, 1])
    x, y = round(box[0]*W), round(box[1]*H)
    bw, bh = round((box[2]-box[0])*W), round((box[3]-box[1])*H)
    p = min(1, max(0, progress))
    p = p*p*(3-2*p)
    scale = cfg.get("start_scale", .94)*(1-p) + cfg.get("end_scale", 1)*p
    s = min(bw/im.width, bh/im.height)*scale
    rw, rh = max(1, min(bw, round(im.width*s))), max(1, min(bh, round(im.height*s)))
    a, z = cfg.get("start_pan", [0,0]), cfg.get("end_pan", [0,0])
    pan = [a[i]*(1-p)+z[i]*p for i in range(2)]
    ox, oy = round((bw-rw)*(pan[0]+1)/2), round((bh-rh)*(pan[1]+1)/2)
    fill.paste(im.resize((rw, rh), Image.Resampling.LANCZOS), (x+ox, y+oy))
    return fill

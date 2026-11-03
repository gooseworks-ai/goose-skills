#!/usr/bin/env python3
"""Draw the cut list as a review sheet: one row per beat, the line on the left and the
chosen window's first, middle and last frame on the right, framed the way it will render.
Free, local. This is what the user looks at every round.

    preview.py --cutlist cutlist.json --out review.png

Long cut lists split into review-1.png, review-2.png, ... (6 beats a sheet). Rows are
labelled with the beat id so the user can say "b4 is wrong, use the part where ...".

The thumbnails show the FRAMED result (fit/crop applied, letterbox visible), not the raw
source, because "the text is cut off" is only visible after framing.
"""
import argparse
import pathlib
import textwrap

from PIL import Image, ImageDraw

from _common import font, grab, sample_bg
from cutlist import box_for, check_or_die, zones

ROWS = 6
TW = 300           # thumbnail width


def framed(spec, b, t):
    """The frame at source time t, framed into the beat's box, scaled to thumbnail size."""
    W, H = spec["size"]
    y, bh = box_for(spec, b)
    src = spec["_sources"][b["source"]]
    if src.get("still"):
        from PIL import Image as _I
        im = _I.open(src["path"]).convert("RGB")
    else:
        im = grab(src["path"], t)
    if b.get("look") == "photo":
        from photo import render
        fr = render(im, W, bh, b, (t-b["in"])/(b["out"]-b["in"]), b.get("bg") or spec.get("bg", "auto"))
        canvas = Image.new("RGB", (W, H), (26,26,26))
        canvas.paste(fr, (0,y))
        return canvas.resize((TW, int(TW*H/W)))
    if b.get("look") == "screen":
        from filmed import ScreenLook
        fr = ScreenLook(W, bh, b.get("screen")).render(im, 0.0, 0, crop=b.get("crop"), masks=b.get("mask"))
        canvas = Image.new("RGB", (W, H), (26, 26, 26))
        canvas.paste(fr, (0, y))
        if b["state"] == "split":
            d = ImageDraw.Draw(canvas)
            cy, ch = zones(spec)["creator"]
            d.rectangle([0, cy, W, cy + ch], fill=(60, 60, 64))
        return canvas.resize((TW, int(TW * H / W)))
    fit = b.get("fit", "width")
    if fit == "crop":
        x0, y0, x1, y1 = b["crop"]
        im = im.crop((int(x0 * im.width), int(y0 * im.height), int(x1 * im.width), int(y1 * im.height)))
        fit = "width"
    bg = b.get("bg") or spec.get("bg", "auto")
    col = (40, 40, 44)
    if bg == "auto" and not src.get("still"):
        hx = sample_bg(src["path"], b["in"] + 0.1)
        col = tuple(int(hx[i:i + 2], 16) for i in (2, 4, 6))
    elif bg == "auto":
        import statistics
        corners = [im.getpixel(p) for p in ((0,0),(im.width-1,0),(0,im.height-1),(im.width-1,im.height-1))]
        col = tuple(round(statistics.median(p[i] for p in corners)) for i in range(3))
    elif bg != "blur":
        hx = bg.lstrip("#")
        col = tuple(int(hx[i:i + 2], 16) for i in (0, 2, 4))
    box = Image.new("RGB", (W, bh), col)
    if fit == "cover":
        s = max(W / im.width, bh / im.height)
        r = im.resize((int(im.width * s + 0.5), int(im.height * s + 0.5)))
        fx, fy = b.get("focus", [0.5, 0.5])
        ox = min(max(int(fx * r.width - W / 2), 0), r.width - W)
        oy = min(max(int(fy * r.height - bh / 2), 0), r.height - bh)
        box.paste(r.crop((ox, oy, ox + W, oy + bh)))
    else:
        s = min(W / im.width, bh / im.height)
        r = im.resize((max(1, int(im.width * s)), max(1, int(im.height * s))))
        box.paste(r, ((W - r.width) // 2, (bh - r.height) // 2))
    canvas = Image.new("RGB", (W, H), (26, 26, 26))
    canvas.paste(box, (0, y))
    if b["state"] == "split":
        d = ImageDraw.Draw(canvas)
        cy, ch = zones(spec)["creator"]
        d.rectangle([0, cy, W, cy + ch], fill=(60, 60, 64))
        d.text((W // 2 - 90, cy + ch // 2 - 30), "creator", font=font(60), fill=(150, 150, 150))
    return canvas.resize((TW, int(TW * H / W)))


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--cutlist", required=True)
    ap.add_argument("--out", required=True)
    ap.add_argument("--caption-footprint", help="JSON from caption-burn footprint.py with the final style/font")
    x = ap.parse_args()
    spec = check_or_die(x.cutlist)
    import json
    footprints = json.loads(pathlib.Path(x.caption_footprint).read_text()) if x.caption_footprint else None
    W, H = spec["size"]
    if footprints:
        import hashlib
        obj={"size":[W,H],"seam":spec.get("seam"),
             "beats":[{k:b.get(k,"split" if k=="state" else None) for k in ("id","vo","start","end","state")} for b in spec["beats"]]}
        if footprints.get("cutlist_sha256") != hashlib.sha256(json.dumps(obj,sort_keys=True).encode()).hexdigest():
            raise SystemExit("cut list changed; regenerate caption footprint")
    if footprints and footprints["size"] != [W,H]:
        raise SystemExit("caption footprint size does not match cut list")
    th = int(TW * H / W)
    txt_w = 560
    f_id, f_txt, f_meta = font(34), font(24), font(20)
    beats = spec["beats"]
    outs = []
    for page in range(0, len(beats), ROWS):
        rows = beats[page:page + ROWS]
        sheet = Image.new("RGB", (txt_w + 3 * (TW + 10) + 10, len(rows) * (th + 16) + 10), (14, 14, 16))
        d = ImageDraw.Draw(sheet)
        for r, b in enumerate(rows):
            y = 10 + r * (th + 16)
            d.text((14, y), b["id"], font=f_id, fill=(255, 220, 40))
            d.text((110, y + 8), "%.2f-%.2fs  %s" % (b["start"], b["end"], b["state"]), font=f_meta,
                   fill=(170, 170, 170))
            yy = y + 52
            for line in textwrap.wrap('"%s"' % b.get("vo", ""), 40)[:8]:
                d.text((14, yy), line, font=f_txt, fill=(255, 255, 255))
                yy += 30
            if b["state"] != "creator":
                meta = "%s @ %.2f-%.2f  %s  %.2fx" % (b["source"], b["in"], b["out"], b["fit"], b["speed"])
                d.text((14, yy + 8), meta, font=f_meta, fill=(120, 200, 255))
                for line in textwrap.wrap(b.get("why", ""), 50)[:3]:
                    yy += 26
                    d.text((14, yy + 12), line, font=f_meta, fill=(150, 150, 150))
                a, o = b["in"], b["out"]
                for k, t in enumerate((a + 0.05, (a + o) / 2, o - 0.08)):
                    fr = framed(spec, b, t).convert("RGBA")
                    fp = footprints["beats"].get(b["id"]) if footprints else None
                    if fp and fp.get("bbox"):
                        overlay = Image.new("RGBA", fr.size)
                        od = ImageDraw.Draw(overlay)
                        rect = [round(v*TW/W) for v in fp["bbox"]]
                        od.rectangle(rect, fill=(255,180,0,95), outline=(255,180,0,255), width=2)
                        fr = Image.alpha_composite(fr, overlay)
                    sheet.paste(fr.convert("RGB"), (txt_w + 10 + k * (TW + 10), y))
            else:
                d.text((txt_w + 20, y + th // 2 - 20), "creator full frame (no footage)", font=f_txt,
                       fill=(150, 150, 150))
        p = pathlib.Path(x.out)
        if len(beats) > ROWS:
            p = p.with_name("%s-%d%s" % (p.stem, page // ROWS + 1, p.suffix))
        p.parent.mkdir(parents=True, exist_ok=True)
        sheet.save(p)
        outs.append(p)
    print("[preview] %d beats, %.2fs -> %s" % (len(beats), spec["duration"], ", ".join(map(str, outs))))


if __name__ == "__main__":
    main()

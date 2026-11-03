#!/usr/bin/env python3
"""Burn per-beat caption BLOCKS for a format with no voice (a screen walkthrough): each
beat's `caption` lines on one black block, white bold, placed in the emptiest band of that
beat's frame. Free, local.

    plates.py --video walk.mp4 --beats cutlist.json --out captioned.mp4 [--logo logo.png]

Every beat with a `caption` (a string or a list of lines) gets it for the whole beat.
`cap_y` (0-1, the block's centre) pins a beat; otherwise the block goes in the emptiest
horizontal band of the beat's middle frame inside the safe zone. Placing by eye put
several captions over content and some out of frame. `logo: true` on a beat hangs the
brand logo tile under its block (the hook, as the reference does).

Geometry measured off the reference (fractions of the frame, so it scales):
  plate height 0.0508 H per line, cap height 0.0269 H, side padding 0.0347 W,
  pure black, pure white bold text.
  ONE background per caption: every line's rectangle goes into a single mask with square
  corners, then blur-and-threshold rounds the whole silhouette. Rounding each line
  separately leaves seams. Lines are left-aligned inside the block, the block centred on
  its widest line, which gives the stepped right edge.
  No emoji twice across the reel.
"""
import argparse
import json
import pathlib
import subprocess
import tempfile

import numpy as np
from PIL import Image, ImageDraw, ImageFilter

from _fonts import emoji, font

CAP_H, PLATE_OVER_CAP, PAD_X, RADIUS, MAX_W = 0.0269, 1.89, 0.0347, 0.0087, 0.88
SAFE = (0.15, 0.85)
LOGO_W, LOGO_GAP = 0.28, 0.012


def is_emoji(ch):
    o = ord(ch)
    return 0x1F300 <= o <= 0x1FAFF or 0x2600 <= o <= 0x27BF


def runs(text):
    out, cur, flag = [], "", None
    for ch in text:
        f = is_emoji(ch)
        if flag is None or f == flag:
            cur += ch
            flag = f
        else:
            out.append((cur, flag))
            cur, flag = ch, f
    if cur:
        out.append((cur, flag))
    return out


def width(d, text, f, fe):
    return sum(d.textlength(t, font=f) if not e or not fe else cap_px_emoji(f) * len(t) for t, e in runs(text))


def cap_px_emoji(f):
    return f.size * 1.05


def wrap(d, text, f, fe, max_px):
    out, cur = [], ""
    for w in text.split():
        trial = (cur + " " + w).strip()
        if width(d, trial, f, fe) <= max_px or not cur:
            cur = trial
        else:
            out.append(cur)
            cur = w
    if cur:
        out.append(cur)
    return out


def emptiest(frame, block_h, H):
    g = np.asarray(frame.convert("L").resize((120, H // 16))).astype(float)
    busy = np.abs(np.diff(g, axis=1)).mean(1)
    h = len(busy)
    win = max(2, int(block_h / H * h))
    lo, hi = int(SAFE[0] * h), int(SAFE[1] * h) - win
    if hi <= lo:
        return 0.62
    k = lo + int(np.argmin([busy[y:y + win].sum() for y in range(lo, hi)]))
    return (k + win / 2.0) / h


def block(W, H, lines, y_centre, logo=None):
    im = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    cap = CAP_H * H
    size = int(round(cap / 0.72))
    f, fe = font(size), emoji(size)
    ph, pad, rad = int(round(cap * PLATE_OVER_CAP)), int(round(PAD_X * W)), int(round(RADIUS * W))
    wrapped = []
    for ln in lines:
        wrapped += wrap(d, ln, f, fe, MAX_W * W - 2 * pad)
    laid = [(ln, width(d, ln, f, fe)) for ln in wrapped]
    total = len(laid) * ph + ((int(LOGO_W * W) + int(LOGO_GAP * H)) if logo else 0)
    y0 = int(min(max(y_centre * H - total / 2, SAFE[0] * H), SAFE[1] * H - total))
    widest = max(int(t) + 2 * pad for _, t in laid)
    bx = (W - widest) // 2
    mask = Image.new("L", (W, H), 0)
    md = ImageDraw.Draw(mask)
    for i, (_, tw) in enumerate(laid):
        md.rectangle([bx, y0 + i * ph, bx + int(tw) + 2 * pad, y0 + (i + 1) * ph], fill=255)
    mask = mask.filter(ImageFilter.GaussianBlur(rad * 0.85)).point(lambda v: 255 if v > 128 else 0)
    im.paste(Image.new("RGBA", (W, H), (0, 0, 0, 255)), (0, 0), mask)
    for i, (ln, _) in enumerate(laid):
        ty = y0 + i * ph + (ph - cap) / 2 - (size - cap) * 0.34
        x = bx + pad
        for txt, em in runs(ln):
            if em and fe:
                g = Image.new("RGBA", (fe.size * len(txt) + 8, fe.size + 8), (0, 0, 0, 0))
                ImageDraw.Draw(g).text((0, 0), txt, font=fe, embedded_color=True)
                g = g.resize((int(g.width * size * 1.05 / fe.size), int(g.height * size * 1.05 / fe.size)), Image.LANCZOS)
                im.alpha_composite(g, (int(x), int(ty - size * 0.05)))
                x += size * 1.05 * len(txt)
            else:
                d.text((x, ty), txt, font=f, fill=(255, 255, 255, 255))
                x += d.textlength(txt, font=f)
    if logo:
        lw = int(LOGO_W * W)
        tile = Image.open(logo).convert("RGBA").resize((lw, lw), Image.LANCZOS)
        im.alpha_composite(tile, ((W - lw) // 2, y0 + len(laid) * ph + int(LOGO_GAP * H)))
    return im


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--video", required=True)
    ap.add_argument("--beats", required=True)
    ap.add_argument("--out", required=True)
    ap.add_argument("--logo", help="logo tile for beats with logo: true")
    a = ap.parse_args()
    spec = json.loads(pathlib.Path(a.beats).read_text(encoding="utf-8"))
    W, H = spec.get("size", [1080, 1920])
    fps = int(spec.get("fps", 30))
    dur = float(subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0",
                                a.video], capture_output=True, text=True).stdout)
    with tempfile.TemporaryDirectory() as td:
        td = pathlib.Path(td)
        blank = td / "blank.png"
        Image.new("RGBA", (W, H), (0, 0, 0, 0)).save(blank)
        lines, t, n = [], 0.0, 0
        for b in spec["beats"]:
            s, e = b["start"], min(b["end"], dur)
            cap = b.get("caption")
            if not cap or e <= s:
                continue
            cap = [cap] if isinstance(cap, str) else cap
            if s - t > 1e-3:
                lines += ["file '%s'" % blank, "duration %.4f" % (s - t)]
            y = b.get("cap_y")
            if y is None:
                fr = subprocess.run(["ffmpeg", "-v", "error", "-ss", "%.3f" % ((s + e) / 2), "-i", a.video,
                                     "-frames:v", "1", "-f", "image2pipe", "-vcodec", "png", "-"],
                                    capture_output=True).stdout
                import io
                y = emptiest(Image.open(io.BytesIO(fr)), len(cap) * PLATE_OVER_CAP * CAP_H * H * 1.2, H)
            im = block(W, H, cap, y, a.logo if b.get("logo") and a.logo else None)
            p = td / ("b%03d.png" % n)
            n += 1
            im.save(p)
            lines += ["file '%s'" % p, "duration %.4f" % (e - s)]
            t = e
            print("  %-4s %6.2f-%6.2f  y=%.3f  %s" % (b.get("id", ""), s, e, y, " / ".join(cap)))
        if dur - t > 1e-3:
            lines += ["file '%s'" % blank, "duration %.4f" % (dur - t)]
        lines.append(lines[-2])
        (td / "cues.txt").write_text("\n".join(lines))
        subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", a.video, "-f", "concat", "-safe", "0",
                        "-i", str(td / "cues.txt"), "-filter_complex",
                        "[1:v]fps=%d,format=rgba[c];[0:v][c]overlay=0:0:format=auto:shortest=1,format=yuv420p[v]" % fps,
                        "-map", "[v]", "-map", "0:a?", "-c:v", "libx264", "-crf", "14", "-c:a", "copy",
                        "-movflags", "+faststart", a.out], check=True)
    print("[plates] %d captioned beats -> %s" % (n, a.out))


if __name__ == "__main__":
    main()

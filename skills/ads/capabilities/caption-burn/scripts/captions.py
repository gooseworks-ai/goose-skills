#!/usr/bin/env python3
"""Burn word-timed captions, one to three words at a time. Free, local (PIL + ffmpeg, no
libass needed).

    captions.py --video reel.mp4 --beats cutlist.aligned.json --words reel.words.json \
        --out final.mp4 [--style plate|outline] [--anchor seam|fixed] [--highlight Gooseworks]

--beats gives the lines (`vo`), their timing and, for split layouts, the `seam`, `size` and
each beat's `state`. --words is transcribe.py on the SAME video (reel time). Without
--words, timing falls back to a syllable estimate inside each line: good enough to judge
placement, not to ship.

Placement:
  seam   (default when the beats have a seam) split beats: the PLATE is pinned to the seam,
         25% of it above and 75% below, whatever the text length. Positioning by the text
         instead makes a two-word and a three-word caption sit differently on the line.
         Full-frame beats (state creator/product) use --full-y.
  fixed  every caption at --y (fraction of the height, the plate's centre).

Styles (measured off the reference builds, not chosen):
  plate       white bold on a dark grey rounded plate, 1-2 words. Cap ~0.019 of the height.
  outline     white bold with a dark outline, no plate, 1-3 words. Cap ~0.034 of the height.
  serif-word  ONE word at a time, heavy serif (Georgia Bold), white with a black outline, on
              a fixed baseline at 0.77 of the height. The highlight word is quoted, yellow.

--card "LINE ONE|LINE TWO" --card-until 4.7 adds the hook card: a white rounded box of two
lines of heavy red capitals, near the top, held for the opening seconds. Keep each line
near 14 characters; the box hugs its type, so longer lines render smaller.

Nothing is drawn outside the 4:5 feed-crop safe zone (y 0.148-0.852).

The last caption holds to the end of the video: it is the call to action and the viewer
must still see it when the voice stops. A word Whisper spelled differently ("200" for
"two hundred") is interpolated between its neighbours rather than dropped.
"""
import argparse
import json
import pathlib
import re
import subprocess
import tempfile

from PIL import Image, ImageDraw

from _fonts import font, serif

STYLES = {
    "plate": dict(cap=0.019, per=2, plate=(58, 58, 60, 214), stroke=0, pad_y=0.22),
    "outline": dict(cap=0.034, per=3, plate=None, stroke=0.085, pad_y=0.0),
    # screen-insert look: ONE word, heavy serif, white with a black outline, on a fixed
    # baseline (0.7703 of the height, cap 0.0367, measured off the reference)
    "serif-word": dict(cap=0.0367, per=1, plate=None, stroke=0.0047, pad_y=0.0, serif=True,
                       baseline=0.7703),
}
# The 4:5 feed crop of 1080x1920 keeps y 285..1635; nothing is drawn outside it.
SAFE_TOP, SAFE_BOTTOM = 285 / 1920.0, 1635 / 1920.0
# Hook card (screen-insert): white rounded box, two lines of heavy red caps, measured.
CARD_Y0, CARD_H, CARD_CAP, CARD_PITCH, CARD_FILL = 0.1550, 0.1109, 0.0305, 0.0500, 0.905
CARD_RED = (250, 0, 43, 255)
ABOVE_SEAM = 0.25
YELLOW = (255, 209, 26, 255)
WHITE = (255, 255, 255, 255)


def bare(w):
    return re.sub(r"[^A-Za-z0-9']", "", w).lower()


def syl(w):
    w = re.sub(r"[^a-z]", "", w.lower())
    n = len(re.findall(r"[aeiouy]+", w)) if w else 1
    return max(1, n - (1 if w.endswith("e") and n > 1 else 0))


def cues_for(beats, heard, per):
    cues, hi = [], 0
    for b in beats:
        words = re.sub(r"<[^>]*>", " ", b.get("vo", "")).split()
        if not words:
            continue
        span = b["end"] - b["start"]
        n = max(1, min(per, round(len(words) / max(1.0, span / 0.60))))
        groups = [words[i:i + n] for i in range(0, len(words), n)]
        if len(groups) > 1 and len(groups[-1]) == 1 and len(groups[-2]) < per + 1:
            tail = groups.pop()          # pop to a temporary FIRST: `g[-2] += g.pop()` merges wrong
            groups[-1] = groups[-1] + tail
        assert [w for g in groups for w in g] == words, "grouping lost a word"
        placed = False
        if heard:
            j, spans = hi, []
            for w in words:
                k = bare(w)
                m = next((x for x in range(j, min(j + 5, len(heard))) if heard[x][0] == k), None)
                spans.append(heard[m] if m is not None else None)
                if m is not None:
                    j = m + 1
            known = [i for i, x in enumerate(spans) if x is not None]
            if len(known) >= max(1, len(words) * 2 // 3):
                for i, x in enumerate(spans):
                    if x is None:
                        lo = max([k for k in known if k < i], default=None)
                        up = min([k for k in known if k > i], default=None)
                        t0 = spans[lo][2] if lo is not None else b["start"]
                        t1 = spans[up][1] if up is not None else b["end"]
                        gap = (up if up is not None else len(words)) - (lo if lo is not None else -1) - 1
                        pos = i - (lo if lo is not None else -1)
                        step = (t1 - t0) / max(gap, 1)
                        spans[i] = ("", t0 + step * (pos - 1), t0 + step * pos)
                hi, idx = j, 0
                for g in groups:
                    got = spans[idx:idx + len(g)]
                    idx += len(g)
                    cues.append([g, got[0][1], got[-1][2], b])
                placed = True
        if not placed:
            tot = sum(sum(syl(w) for w in g) for g in groups)
            t = b["start"]
            for g in groups:
                d = span * sum(syl(w) for w in g) / tot
                cues.append([g, t, min(t + d, b["end"]), b])
                t += d
    for i in range(len(cues) - 1):          # close small gaps so captions do not flicker off
        cues[i][2] = max(cues[i][2], min(cues[i + 1][1], cues[i][2] + 0.5))
        cues[i][2] = min(cues[i][2], cues[i + 1][1])
    return cues


def draw(W, H, words, y_center, style, px, fnt, hl, plate_top=None):
    im = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    if not words:
        return im
    d = ImageDraw.Draw(im)
    if style.get("serif"):
        w = words[0]
        hit = bare(w) in hl
        show = '"%s"' % w.strip('.,!?"') if hit else w
        r = max(2, int(round(style["stroke"] * H)))
        bb = d.textbbox((0, 0), show, font=fnt, stroke_width=r)
        x = (W - (bb[2] - bb[0])) / 2 - bb[0]
        y = style["baseline"] * H - bb[3]
        if y + bb[3] > SAFE_BOTTOM * H:
            y = SAFE_BOTTOM * H - bb[3]
        d.text((x, y), show, font=fnt, fill=YELLOW if hit else WHITE, stroke_width=r, stroke_fill=(0, 0, 0, 255))
        return im
    txt = " ".join(words)
    sw = int(px * style["stroke"])
    bb = d.textbbox((0, 0), txt, font=fnt, stroke_width=sw)
    tw, th = bb[2] - bb[0], bb[3] - bb[1]
    padx, pady = int(px * 0.46), int(px * style["pad_y"])
    ph = th + 2 * pady
    top = plate_top(ph) if plate_top else int(y_center - ph / 2)
    top = int(min(max(top, SAFE_TOP * H), SAFE_BOTTOM * H - ph))
    x0 = (W - tw) // 2 - bb[0]
    y0 = top + pady - bb[1]
    if style["plate"]:
        d.rounded_rectangle([x0 + bb[0] - padx, top, x0 + bb[0] + tw + padx, top + ph],
                            radius=int(px * 0.30), fill=style["plate"])
    cx = x0
    for w in words:
        col = YELLOW if hl and bare(w) in hl else WHITE
        d.text((cx, y0), w, font=fnt, fill=col, stroke_width=sw, stroke_fill=(0, 0, 0, 200))
        cx += d.textlength(w + " ", font=fnt)
    return im


def card_layer(W, H, lines):
    """The hook card, sized so the box hugs the type (type at the measured cap height)."""
    im = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    cap = CARD_CAP * H
    px = int(cap / 0.72)
    f = font(px)
    while px > 20 and max(d.textlength(l, font=f) for l in lines) > 0.90 * W * CARD_FILL:
        px -= 2
        f = font(px)
    widest = max(d.textlength(l, font=f) for l in lines)
    cw = min(widest / CARD_FILL, 0.90 * W)
    x0, x1 = (W - cw) / 2, (W + cw) / 2
    y0 = max(CARD_Y0, SAFE_TOP) * H
    y1 = y0 + max(CARD_H * H, CARD_PITCH * H * len(lines) + cap)
    d.rounded_rectangle([x0, y0, x1, y1], radius=int(0.02 * W), fill=(255, 255, 255, 255))
    block = CARD_PITCH * H * (len(lines) - 1) + cap
    top = y0 + ((y1 - y0) - block) / 2
    for k, line in enumerate(lines):
        bb = d.textbbox((0, 0), line, font=f)
        d.text(((W - (bb[2] - bb[0])) / 2 - bb[0], top + k * CARD_PITCH * H - bb[1]), line, font=f, fill=CARD_RED)
    return im


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--video", required=True)
    ap.add_argument("--beats", required=True)
    ap.add_argument("--out", required=True)
    ap.add_argument("--words")
    ap.add_argument("--style", choices=sorted(STYLES), default="plate")
    ap.add_argument("--anchor", choices=["seam", "fixed"])
    ap.add_argument("--y", type=float, default=0.62, help="fixed anchor: plate centre, fraction of height")
    ap.add_argument("--full-y", type=float, default=0.62, help="seam anchor: full-frame beats")
    ap.add_argument("--highlight", action="append", default=[], help="word to colour (repeatable)")
    ap.add_argument("--card", help='hook card, two lines: "LINE ONE|LINE TWO"')
    ap.add_argument("--card-until", type=float, default=4.7)
    ap.add_argument("--font")
    a = ap.parse_args()

    spec = json.loads(pathlib.Path(a.beats).read_text(encoding="utf-8"))
    W, H = spec.get("size", [1080, 1920])
    fps = int(spec.get("fps", 30))
    seam = spec.get("seam")
    anchor = a.anchor or ("seam" if seam else "fixed")
    st = STYLES[a.style]
    px = int(round(st["cap"] * H * 1.38))
    if a.font and not pathlib.Path(a.font).is_file():
        raise SystemExit("supplied caption font is missing")
    fnt = serif(px) if st.get("serif") else font(px, a.font)
    heard = []
    if a.words:
        for w in json.loads(pathlib.Path(a.words).read_text(encoding="utf-8")):
            k = bare(w.get("text", ""))
            if k and w.get("start") is not None:
                heard.append((k, float(w["start"]), float(w["end"])))
    dur = float(subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0",
                                a.video], capture_output=True, text=True).stdout)
    cues = cues_for(spec["beats"], heard, st["per"])
    if not cues:
        raise SystemExit("no lines to caption")
    cues[-1][2] = max(cues[-1][2], dur)
    hl = {bare(h) for h in a.highlight}
    card = card_layer(W, H, [l.strip() for l in a.card.split("|") if l.strip()]) if a.card else None
    until = a.card_until if card else 0.0

    cuts = sorted({0.0, dur, *(c[1] for c in cues), *(c[2] for c in cues)} | ({until} if card else set()))
    cuts = [t for t in cuts if 0 <= t <= dur]
    with tempfile.TemporaryDirectory() as td:
        td = pathlib.Path(td)
        cache, lines = {}, []
        for t0, t1 in zip(cuts, cuts[1:]):
            if t1 - t0 < 1e-3:
                continue
            mid = (t0 + t1) / 2
            ci = next((i for i, c in enumerate(cues) if c[1] <= mid < c[2]), None)
            key = (ci, bool(card) and mid < until)
            if key not in cache:
                im = Image.new("RGBA", (W, H), (0, 0, 0, 0))
                if key[1]:
                    im.alpha_composite(card)
                if ci is not None:
                    words, _, _, b = cues[ci]
                    if anchor == "seam" and b.get("state", "split") == "split" and seam:
                        cap = draw(W, H, words, 0, st, px, fnt, hl, plate_top=lambda ph: int(seam - ABOVE_SEAM * ph))
                    else:
                        cap = draw(W, H, words, (a.y if anchor == "fixed" else a.full_y) * H, st, px, fnt, hl)
                    im.alpha_composite(cap)
                pth = td / ("c%04d.png" % len(cache))
                im.save(pth)
                cache[key] = pth
            lines += ["file '%s'" % cache[key], "duration %.4f" % (t1 - t0)]
        lines.append(lines[-2])
        (td / "cues.txt").write_text("\n".join(lines))
        subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", a.video, "-f", "concat", "-safe", "0",
                        "-i", str(td / "cues.txt"), "-filter_complex",
                        "[1:v]fps=%d,format=rgba[c];[0:v][c]overlay=0:0:format=auto:shortest=1,format=yuv420p[v]" % fps,
                        "-map", "[v]", "-map", "0:a?", "-c:v", "libx264", "-crf", "14", "-preset", "medium",
                        "-c:a", "copy", "-movflags", "+faststart", a.out], check=True)
    print("[captions] %s, %s, %s anchor, %d cues%s -> %s" % (
        "word-timed" if heard else "ESTIMATED (no --words)", a.style, anchor, len(cues),
        ", hook card to %.2fs" % until if card else "", a.out))
    for c in cues[:6]:
        print("   %6.2f-%6.2f  %s" % (c[1], c[2], " ".join(c[0])))


if __name__ == "__main__":
    main()

#!/usr/bin/env python3
"""Caption and end-card PNG overlays.  FREE, deterministic, no network.

PIL overlays rather than an ASS burn, for three reasons: the host ffmpeg may
have no libass; the same PNG renders identically on every machine; and a PNG can
be MEASURED -- `gates.gate_caption_safe_zone` opens the alpha channel and reads
the real ink box, so the safe-zone check tests what the viewer sees instead of
trusting the anchor number in the config.

Caption windows come from the voiceover's own character-level timestamps when
they exist. When they do not (the $0 preview), they are divided across the beat
by word count and the plan is marked estimated.

The end card composites the brand wordmark from a real file. It never draws
brand text through a generator.

Usage: build_overlays.py --config config.json --run-dir <run>
"""
from __future__ import annotations

import argparse
import json
import pathlib

from PIL import Image, ImageDraw, ImageFont
import sys as _sys, pathlib as _pl
_sys.path.insert(0, str(_pl.Path(__file__).resolve().parent))
import config_io  # noqa: E402

FONT_CANDIDATES = [
    "C:/Windows/Fonts/segoeuib.ttf", "C:/Windows/Fonts/arialbd.ttf",
    "/System/Library/Fonts/Supplemental/Arial Bold.ttf",
    "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
]


def load_font(size: int, extra: list[str] | None = None):
    for p in (extra or []) + FONT_CANDIDATES:
        if p and pathlib.Path(p).exists():
            return ImageFont.truetype(p, size)
    return ImageFont.load_default(size)


def wrap(draw, text, font, max_w):
    """Greedy wrap, then BALANCE it so no line is left holding one word.

    The greedy pass fills line one to the limit and dumps the remainder, which
    put "meals" and "in" alone on a second line under a full-width first line
    in the 720p render. A viewer reads that as the caption breaking, and it was
    the defect reported as captions getting distorted.

    Balancing walks the break point back one word at a time while the result
    still fits, choosing the split whose two lines are closest in width. Only
    two-line captions are balanced; three or more are left to the greedy pass,
    because this format's cues are short enough that three lines means the cue
    itself is wrong.
    """
    words, lines, cur = text.split(), [], []
    for w in words:
        trial = " ".join(cur + [w])
        if draw.textlength(trial, font=font) <= max_w or not cur:
            cur.append(w)
        else:
            lines.append(" ".join(cur))
            cur = [w]
    if cur:
        lines.append(" ".join(cur))

    if len(lines) == 2 and len(words) >= 3:
        best, best_cost = None, None
        for k in range(1, len(words)):
            a, b = " ".join(words[:k]), " ".join(words[k:])
            wa, wb = draw.textlength(a, font=font), draw.textlength(b, font=font)
            if wa > max_w or wb > max_w:
                continue
            cost = abs(wa - wb)
            if best_cost is None or cost < best_cost:
                best, best_cost = [a, b], cost
        if best:
            lines = best
    return lines


def caption_png(text, cfg, out: pathlib.Path):
    c = cfg["captions"]
    W, H = cfg["width"], cfg["height"]
    img = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    size = int(c.get("font_size", 62))
    font = load_font(size, [c.get("font_file")])
    lines = wrap(d, text.upper() if c.get("uppercase") else text, font,
                 int(c.get("wrap_max_width_px", 900)))
    lh = int(size * 1.18)
    total = lh * len(lines)
    # bottom_anchor_px is the BASELINE of the last line; the block grows upward
    y = int(c.get("bottom_anchor_px", 1560)) - total
    sw = int(c.get("stroke_width", 6))
    for ln in lines:
        w = d.textlength(ln, font=font)
        d.text(((W - w) / 2, y), ln, font=font, fill=c.get("color_hex", "#FFFFFF"),
               stroke_width=sw, stroke_fill=c.get("stroke_hex", "#000000"))
        y += lh
    img.save(out)
    return out


def _track(d, xy, txt, font, fill, tr):
    """Draw text with explicit letter-spacing and return the end x.

    PIL has no tracking. A wordmark set at default spacing is one of the
    things that makes a card read as system default rather than as type
    somebody chose.
    """
    x, y = xy
    for ch in txt:
        d.text((x, y), ch, font=font, fill=fill)
        x += d.textlength(ch, font=font) + tr
    return x


def _track_w(d, txt, font, tr):
    if not txt:
        return 0
    return sum(d.textlength(c, font=font) for c in txt) + tr * (len(txt) - 1)


def end_card_png(cfg, run: pathlib.Path, out: pathlib.Path):
    """The show end card, composed from the brand block.

    Two layouts, chosen by `brand.layout`:

    `editorial` (default) - the url small and tracked, the wordmark large in a
    real serif, a hairline rule, the tagline tracked beneath, all left-aligned
    on a generous margin. Type carries the identity and there is no mark.

    `stack` - mark over wordmark over url, centred. Kept for a brand that has a
    real logo file worth showing.

    Why the default changed: the first version centred a line-art leaf in a
    circle over a wordmark set in the OS system font. Three clichés at once -
    the system face, the circle-enclosed botanical mark, and a dead-centre
    stack on flat colour - and it read as a template with the colour swapped.
    A brand card is mostly typography, so the font is now a config value and
    the layout has an opinion.

    Returns (path, assets_are_real). False when a brand supplied no wordmark
    file AND no font, so the PREVIEW stamp still fires for a real client who
    has handed nothing over.
    """
    ec = cfg["end_card"]
    br = cfg.get("brand", {})
    W, H = cfg["width"], cfg["height"]
    bg = br.get("bg_hex", ec.get("background", "#000000"))
    ink = br.get("ink_hex", "#FFFFFF")
    dim = br.get("dim_hex", ink)
    img = Image.new("RGBA", (W, H), bg)
    d = ImageDraw.Draw(img)

    def load_img(key):
        f = br.get(key) or ec.get(key)
        if not f:
            return None
        fp = (run / f) if not pathlib.Path(f).is_absolute() else pathlib.Path(f)
        if fp.exists() and fp.suffix.lower() in (".png", ".webp"):
            return Image.open(fp).convert("RGBA")
        return None

    def font(key, size):
        cand = br.get(key)
        return load_font(size, [cand] if cand else None)

    name = br.get("name") or cfg["brand_name"]
    url = br.get("url_text") or ec.get("url_text", "")
    tag = br.get("tagline", "")
    layout = br.get("layout", "editorial")
    real = bool(br.get("display_font") or load_img("wordmark_file"))

    if layout == "brandkit":
        # A real brand's end card: mark, wordmark, rule, tagline, a call to
        # action, and the url. The editorial layout before this put four lines
        # of type in the top third and left the lower half of a 1080x1920
        # frame empty, which reads as an unfinished slate rather than a card.
        #
        # Everything is centred and the whole cluster sits on the optical
        # centre, a little above the middle, and inside the caption safe zone
        # (y 285 to 1635) so nothing collides with the platform's own UI.
        cta = br.get("cta_text", "")
        fd = font("display_font", int(W * 0.105))
        ftag = font("text_font", int(W * 0.0245))
        fcta = font("text_font", int(W * 0.0290))
        furl = font("text_font", int(W * 0.0215))

        mark = load_img("logo_file")
        mark_h = int(H * 0.098) if mark else 0
        if mark:
            mark = mark.resize((max(1, int(mark.width * mark_h / mark.height)), mark_h))

        wb = d.textbbox((0, 0), name, font=fd)
        word_h = wb[3] - wb[1]
        rule_w = int(W * 0.50)
        tag_h = int(W * 0.0245) if tag else 0
        cta_h = int(W * 0.075) if cta else 0        # pill height
        url_h = int(W * 0.0215) if url else 0

        GAP_MARK, GAP_RULE, GAP_TAG, GAP_CTA, GAP_URL = (
            int(H * 0.030), int(H * 0.022), int(H * 0.018),
            int(H * 0.050), int(H * 0.024))
        total = (mark_h + (GAP_MARK if mark else 0) + word_h + GAP_RULE + 2
                 + (GAP_TAG + tag_h if tag else 0)
                 + (GAP_CTA + cta_h if cta else 0)
                 + (GAP_URL + url_h if url else 0))
        y = int(H * 0.46) - total // 2
        y = max(y, 300)

        if mark:
            img.alpha_composite(mark, ((W - mark.width) // 2, y))
            y += mark_h + GAP_MARK
        d.text(((W - (wb[2] - wb[0])) // 2 - wb[0], y - wb[1]), name,
               font=fd, fill=ink)
        y += word_h + GAP_RULE
        d.line([((W - rule_w) // 2, y), ((W + rule_w) // 2, y)], fill=dim, width=2)
        y += 2
        if tag:
            y += GAP_TAG
            tw = _track_w(d, tag.upper(), ftag, 3.0)
            _track(d, ((W - tw) / 2, y), tag.upper(), ftag, dim, 3.0)
            y += tag_h
        if cta:
            y += GAP_CTA
            cw = int(d.textlength(cta, font=fcta))
            pad_x = int(W * 0.052)
            x0 = (W - (cw + pad_x * 2)) // 2
            d.rounded_rectangle([x0, y, x0 + cw + pad_x * 2, y + cta_h],
                                radius=cta_h // 2, outline=ink, width=3)
            cb = d.textbbox((0, 0), cta, font=fcta)
            d.text((x0 + pad_x - cb[0],
                    y + (cta_h - (cb[3] - cb[1])) // 2 - cb[1]),
                   cta, font=fcta, fill=ink)
            y += cta_h
        if url:
            y += GAP_URL
            uw = _track_w(d, url.upper(), furl, 4.0)
            _track(d, ((W - uw) / 2, y), url.upper(), furl, dim, 4.0)
            y += url_h
        if y > 1635:
            print(f"  [warn] end card cluster ends at y={y}, past the "
                  f"1635 safe-zone floor")
    elif layout == "editorial":
        M = int(W * 0.096)
        fd = font("display_font", int(W * 0.108))
        fs = font("text_font", int(W * 0.025))
        fsm = font("text_font", int(W * 0.0222))
        y = int(H * 0.40)
        if url:
            _track(d, (M, y - int(H * 0.034)), url.upper(), fsm, dim, 4.0)
        d.text((M, y), name, font=fd, fill=ink)
        bb = d.textbbox((M, y), name, font=fd)
        rule = bb[3] + int(H * 0.024)
        d.line([(M, rule), (W - M, rule)], fill=dim, width=2)
        if tag:
            _track(d, (M, rule + int(H * 0.017)), tag.upper(), fs, dim, 3.2)
    else:
        blocks, gap = [], int(H * 0.030)
        mark = load_img("logo_file")
        if mark:
            mw = int(W * 0.17)
            blocks.append(mark.resize((mw, max(1, int(mark.height * mw / mark.width)))))
        word = load_img("wordmark_file")
        if word:
            ww = int(W * 0.46)
            blocks.append(word.resize((ww, max(1, int(word.height * ww / word.width)))))
        else:
            fd = font("display_font", int(W * 0.096))
            tile = Image.new("RGBA", (int(d.textlength(name, font=fd)) + 8,
                                      int(W * 0.13)), (0, 0, 0, 0))
            ImageDraw.Draw(tile).text((0, 0), name, font=fd, fill=ink)
            blocks.append(tile)
        total = sum(b.height for b in blocks) + gap * max(0, len(blocks) - 1)
        y = int(H * 0.46) - total // 2
        for b in blocks:
            img.alpha_composite(b, ((W - b.width) // 2, y))
            y += b.height + gap
        if url:
            fu = font("text_font", int(W * 0.026))
            w = _track_w(d, url, fu, 2.0)
            _track(d, ((W - w) / 2, y + int(H * 0.025)), url, fu, dim, 2.0)

    if not real:
        d.text((40, H - 60), "PREVIEW STAND-IN: no wordmark and no brand font",
               font=load_font(28), fill="#FF4444")
    img.convert("RGB").save(out)
    return out, real


def cue_windows(beat, run: pathlib.Path, t0: float) -> list[tuple[float, float]]:
    """Master-timeline window per caption cue for one beat.

    Prefers the VO's own character-level timestamps; falls back to a word-count
    division of the beat. Returns windows already offset by the beat's start.
    """
    cues = beat["captions"]
    ts = run / "voiceovers" / f"beat-{beat['n']:02d}.timestamps.json"
    if ts.exists():
        j = json.loads(ts.read_text(encoding="utf-8"))
        al = j.get("alignment", j)
        chars = al["characters"]
        st = al["character_start_times_seconds"]
        en = al["character_end_times_seconds"]
        # walk the cue text through the character stream
        pos, out = 0, []
        flat = "".join(chars)
        for cue in cues:
            probe = cue.strip()
            k = flat.find(probe, pos)
            if k < 0:
                out = []
                break
            out.append((t0 + st[k], t0 + en[min(k + len(probe) - 1, len(en) - 1)]))
            pos = k + len(probe)
        if len(out) == len(cues):
            return out
    counts = [max(1, len(c.split())) for c in cues]
    tot = sum(counts)
    out, acc = [], 0.0
    for c in counts:
        d = beat["dur_sec"] * c / tot
        out.append((t0 + acc, t0 + acc + d))
        acc += d
    return out


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--config", required=True)
    config_io.add_arg(ap)
    ap.add_argument("--run-dir", required=True)
    a = ap.parse_args()

    cfg = config_io.load(a.config, a.preset)
    run = pathlib.Path(a.run_dir)
    beats = json.loads((run / "beats.json").read_text(encoding="utf-8"))["beats"]
    ov = run / "overlays"
    ov.mkdir(parents=True, exist_ok=True)

    min_dur = float(cfg["captions"].get("min_dur_sec", 0.85))
    entries, t0, k = [], 0.0, 0
    for b in beats:
        wins = cue_windows(b, run, t0)
        for cue, (w0, w1) in zip(b["captions"], wins):
            k += 1
            png = ov / f"cap-{k:03d}.png"
            caption_png(cue, cfg, png)
            entries.append({"png": png.name, "text": cue,
                            "w0": round(w0, 3),
                            "w1": round(max(w1, w0 + min_dur), 3)})
        t0 += b["dur_sec"]

    # min_dur above can push a cue's end PAST the next cue's start. ffmpeg
    # draws each overlay with its own between(t,w0,w1), so two captions then
    # render on the same frame and the text doubles up: fifteen of twenty-eight
    # pairs overlapped by up to 0.37s in the 720p render, which is what was
    # reported as the captions getting distorted. Clamp every cue to end one
    # frame before the next one starts. A cue squeezed below min_dur is said
    # out loud rather than silently left overlapping.
    fps = float(cfg.get("fps", 30))
    frame = 1.0 / fps
    squeezed = []
    for a, b2 in zip(entries, entries[1:]):
        if a["w1"] > b2["w0"] - frame:
            a["w1"] = round(max(a["w0"] + frame, b2["w0"] - frame), 3)
            if a["w1"] - a["w0"] < min_dur - 1e-6:
                squeezed.append((a["text"], a["w1"] - a["w0"]))
    if squeezed:
        print(f"[overlays] {len(squeezed)} cue(s) clamped below "
              f"min_dur_sec={min_dur} so they do not overlap the next cue; "
              f"shortest {min(d for _, d in squeezed):.2f}s "
              f"({squeezed[0][0][:34]!r})")

    ec_png, real_mark = end_card_png(cfg, run, ov / "end-card.png")
    (ov / "captions.json").write_text(
        json.dumps({"cues": entries, "wordmark_is_real": real_mark}, indent=2),
        encoding="utf-8")
    print(f"[overlays] {len(entries)} caption cues + end card -> {ov}")
    if not real_mark:
        print("[overlays] WARN end card used a type stand-in; bind "
              "end_card.wordmark_file to the real asset before shipping")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

#!/usr/bin/env python3
"""Hand lettering and marks in the W3 manner, drawn as pixels rather than set as type.

Measured off `refs/whiteboard/W3`, blown up:

  TITLE      fat blobby letterforms, outlined then FILLED, with the marker's own streaks
             visible inside the fill. Letters tilt, vary in width, touch, and the baseline
             wanders. No two letters share a size.
  CAPS       single-weight marker caps, wide and UNEVEN spacing, baseline wavering
  ROWS       an almond eye with a hatched or solid pupil, then caps. Rows are not on a grid.
  MARKS      short radiating dashes beside anything emphatic, small arrows to annotations
  COLOUR     none. W3 is pure black marker throughout.

Type set flat from a font is the single clearest tell that a board was not lettered by hand,
so every routine here jitters per LETTER, not per line.
"""
import math
import random
from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter, ImageFont

# Both faces ship in assets/fonts. They used to be read from C:/Windows/Fonts, so the renderer
# only ran on a Windows machine that happened to have them installed.
FONTS = Path(__file__).resolve().parent.parent / "assets" / "fonts"
MARKER = str(FONTS / "PermanentMarker-Regular.ttf")
# The TITLE has its own face, chosen by testing four against the reference. Permanent Marker's
# letterforms are narrow and squarish and no amount of dilation rounds them; Comic Sans Black
# is rounder but still reads as a marker font; Baloo is too light once jittered. Titan One is
# already a fat rounded display face, so it needs almost no dilation - the roundness comes from
# the letterform rather than from growing a narrow one, which is the whole trick.
TITLE = str(FONTS / "TitanOne-Regular.ttf")
# The caption pill was set in Segoe Script Bold, which is Microsoft's and cannot be bundled.
# Keep it where Windows has it, so shipped videos do not change; fall back to the marker face.
_SEGOE = Path("C:/Windows/Fonts/segoescb.ttf")
CAPTION = str(_SEGOE) if _SEGOE.exists() else MARKER


def _glyph(ch, font, pad=40):
    im = Image.new("L", (font.size * 2 + pad * 2, font.size * 2 + pad * 2), 0)
    ImageDraw.Draw(im).text((pad, pad), ch, font=font, fill=255)
    return im.crop(im.getbbox() or (0, 0, 1, 1))


def hand_caps(layer, text, x, y, size, rnd, jitter=1.0, track=0.06, anchor="lt",
              reveal=1.0):
    """Marker caps, jittered per letter. Returns the width drawn."""
    font = ImageFont.truetype(MARKER, size)
    text = text.upper()
    pieces, total = [], 0
    for ch in text:
        if ch == " ":
            pieces.append((None, int(size * 0.34)))
            total += int(size * 0.34)
            continue
        s = rnd.uniform(0.92, 1.10)
        f = ImageFont.truetype(MARKER, max(8, int(size * s)))
        g = _glyph(ch, f)
        rot = rnd.uniform(-5.5, 5.5) * jitter
        g = g.rotate(rot, resample=Image.BICUBIC, expand=True)
        adv = g.width + int(size * track) + rnd.randint(-2, 4)
        pieces.append((g, adv))
        total += adv
    cx = x - total / 2 if anchor == "ct" else x
    x0, y0, x1, y1 = 1e9, 1e9, -1e9, -1e9
    # letters arrive one at a time, the way they are written
    shown = int(round(len([g for g, _ in pieces if g is not None]) * max(0.0, min(1.0, reveal))))
    drawn = 0
    for g, adv in pieces:
        if g is not None and drawn >= shown:
            break
        if g is not None:
            drawn += 1
            dy = rnd.uniform(-1, 1) * size * 0.055 * jitter
            layer.paste(255, (int(cx), int(y + dy)), g)
            x0, y0 = min(x0, cx), min(y0, y + dy)
            x1, y1 = max(x1, cx + g.width), max(y1, y + dy + g.height)
        cx += adv
    # the BOX, not just the width: an arrow or an emphasis mark placed against a guessed
    # coordinate points the wrong way or lands on the text, which is exactly what happened
    return (x0, y0, x1, y1)


def bubble_title(layer, text, x, y, size, rnd, fatten=2, overlap=(0.99, 1.06),
                 reveal=1.0):
    """The fat filled title. A marker font is JITTERED, then dilated until the letterforms go
    blobby and start touching, then given streaks so the fill reads as laid down by a pen
    rather than as solid vector black."""
    text = text.upper()
    glyphs, total = [], 0
    for ch in text:
        if ch == " ":
            glyphs.append((None, int(size * 0.16)))
            total += int(size * 0.16)
            continue
        # wide per-letter variance: in the reference no two letters are the same size
        f = ImageFont.truetype(TITLE, max(8, int(size * rnd.uniform(0.90, 1.10))))
        g = _glyph(ch, f).rotate(rnd.uniform(-9, 9), resample=Image.BICUBIC, expand=True)
        # A fraction of the glyph's OWN width is not enough spacing for a narrow letter: an I
        # is a few pixels wide, so 1.0x its width put the next letter on top of it and IN ONE
        # came out as a blob. A fixed minimum tracking, scaled to the type size, fixes it.
        adv = int(max(g.width * rnd.uniform(*overlap), g.width + size * 0.05))
        glyphs.append((g, adv))
        total += adv
    pad = fatten * 4
    strip = Image.new("L", (total + pad * 2, int(size * 2.4) + pad * 2), 0)
    cx = pad
    shown = int(round(len([g for g, _ in glyphs if g is not None]) * max(0.0, min(1.0, reveal))))
    drawn = 0
    for g, adv in glyphs:
        if g is not None and drawn >= shown:
            break
        if g is not None:
            drawn += 1
            dy = pad + rnd.uniform(-1, 1) * size * 0.06
            strip.paste(255, (int(cx), int(dy)), g)
        cx += adv
    # An ALREADY-FAT face needs almost no dilation: TitanOne and Baloo at fatten=9 closed their
    # own counters and merged into mush. The roundness comes from the letterform, not from
    # growing a narrow one. A closing, not a plain dilation, so what counters there are survive.
    for _ in range(fatten):
        strip = strip.filter(ImageFilter.MaxFilter(3))
    for _ in range(max(0, fatten // 2)):
        strip = strip.filter(ImageFilter.MinFilter(3))
    strip = strip.filter(ImageFilter.GaussianBlur(1.3)).point(lambda v: 255 if v > 120 else 0)

    # Streaks are drawn on their own layer and MASKED BY THE LETTERS. Drawn straight onto the
    # strip they scattered grey marks across the empty board around the title.
    st = Image.new("L", strip.size, 0)
    sd = ImageDraw.Draw(st)
    for _ in range(int(total / 7)):
        sx, sy = rnd.randint(0, strip.width), rnd.randint(0, strip.height)
        ln = rnd.randint(int(size * 0.14), int(size * 0.38))
        a = rnd.uniform(-0.55, -0.15)
        sd.line([(sx, sy), (sx + math.cos(a) * ln, sy + math.sin(a) * ln)],
                fill=rnd.randint(70, 130), width=rnd.randint(2, 4))
    st = Image.composite(st, Image.new("L", strip.size, 0), strip)
    strip = Image.composite(Image.new("L", strip.size, 255), strip,
                            strip).point(lambda v: v)
    strip = Image.eval(strip, lambda v: v)
    strip.paste(st, (0, 0), st)
    bb = strip.getbbox()
    strip = strip.crop(bb)
    layer.paste(strip, (int(x - strip.width / 2), int(y)), strip)
    return strip.width


def bullet(layer, x, y, w, rnd):
    """A plain marker dash in front of a list row.

    The reference bullets its rows with a drawn EYE, but that is the brand's own motif - the
    board belongs to a company called Radiant Eye - not a feature of the format. Copying it
    onto an ingredients list put a row of eyes on screen that meant nothing.
    """
    d = ImageDraw.Draw(layer)
    pen = max(3, int(w * 0.16))
    d.line([(x, y + rnd.uniform(-1.5, 1.5)), (x + w, y + rnd.uniform(-1.5, 1.5))],
           fill=255, width=pen)


def measure_caps(text, size, track=0.06):
    """Width of a row WITHOUT drawing it, so a layout can fit before it commits."""
    total = 0
    for ch in text.upper():
        if ch == " ":
            total += int(size * 0.34)
            continue
        f = ImageFont.truetype(MARKER, size)
        g = _glyph(ch, f)
        total += g.width + int(size * track) + 1
    return total


def eye(layer, x, y, w, rnd, hatched=None):
    """W3's row bullet: a pointed almond with a pupil, hatched about half the time."""
    d = ImageDraw.Draw(layer)
    h = w * 0.52
    pen = max(3, int(w * 0.055))
    top = [(x - w / 2, y)] + [(x - w / 2 + w * t / 12,
                               y - math.sin(math.pi * t / 12) * h / 2 * rnd.uniform(0.95, 1.05))
                              for t in range(1, 13)]
    bot = [(x - w / 2, y)] + [(x - w / 2 + w * t / 12,
                               y + math.sin(math.pi * t / 12) * h / 2 * rnd.uniform(0.95, 1.05))
                              for t in range(1, 13)]
    d.line(top, fill=255, width=pen, joint="curve")
    d.line(bot, fill=255, width=pen, joint="curve")
    r = w * 0.17
    px = x - w * 0.09
    if hatched is None:
        hatched = rnd.random() < 0.5
    if hatched:
        d.ellipse([px - r, y - r, px + r, y + r], outline=255, width=pen)
        for k in range(-4, 5):
            ox = px + k * r * 0.42
            dy = math.sqrt(max(0.0, r * r - (ox - px) ** 2))
            d.line([(ox, y - dy), (ox, y + dy)], fill=255, width=max(2, pen - 1))
    else:
        d.ellipse([px - r, y - r, px + r, y + r], fill=255)


def emphasis(layer, box, side, rnd, n=5, length=58, pen=5, gap=5):
    """W3's radiating marks, fanning AWAY from the edge of the text they emphasise.

    These used to take a random base angle, so which way they fanned was luck and they
    regularly landed across the words they were meant to be pointing out."""
    x0, y0, x1, y1 = box
    cy = (y0 + y1) / 2
    base = {"right": 0.0, "left": math.pi, "up": -math.pi / 2, "down": math.pi / 2}[side]
    ax = {"right": x1 + gap, "left": x0 - gap}.get(side, (x0 + x1) / 2)
    ay = {"up": y0 - gap, "down": y1 + gap}.get(side, cy)
    d = ImageDraw.Draw(layer)
    for i in range(n):
        a = base + (i - (n - 1) / 2) * 0.30 + rnd.uniform(-0.04, 0.04)
        # They start WELL OUT from the origin. Running them from a single point turned the fan
        # into a tight starburst; in the reference they are separate dashes with clear air
        # between them and the word.
        r0 = length * rnd.uniform(0.16, 0.27)
        r1 = length * rnd.uniform(0.92, 1.18)
        d.line([(ax + math.cos(a) * r0, ay + math.sin(a) * r0),
                (ax + math.cos(a) * r1, ay + math.sin(a) * r1)], fill=255, width=pen)


def rule(layer, x, y, w, rnd, pen=5):
    """The short flanking dashes either side of a subtitle."""
    d = ImageDraw.Draw(layer)
    d.line([(x, y + rnd.uniform(-2, 2)), (x + w, y + rnd.uniform(-2, 2))], fill=255, width=pen)


def annotate(layer, text, size, target, side, rnd, gap=30):
    """A small caps note placed clear of `target`, with an arrow running FROM the target TO
    the note. The arrow direction is derived, never passed in: a hardcoded delta pointed the
    arrow away from the very word it was annotating."""
    tx, ty = target
    dx, dy = {"upright": (1, -1), "upleft": (-1, -1),
              "downright": (1, 1), "downleft": (-1, 1)}[side]
    lx = tx + dx * gap * 2.0
    ly = ty + dy * gap * 1.25 - size / 2
    box = hand_caps(layer, text, lx if dx > 0 else lx, ly, size, rnd,
                    anchor="lt" if dx > 0 else "rt")
    if dx < 0:                                    # right-aligned: shift it back by its width
        w = box[2] - box[0]
        layer_w = box
        lx -= w
        box = (box[0] - w, box[1], box[2] - w, box[3])
    # start just outside the target, stop just short of the note, so neither is touched
    sx = tx + dx * gap * 0.5
    sy = ty + dy * gap * 0.5
    ex = (box[0] - 12) if dx > 0 else (box[2] + 12)
    ey = box[3] if dy < 0 else box[1]
    d = ImageDraw.Draw(layer)
    d.line([(sx, sy), (ex, ey)], fill=255, width=4)
    th = math.atan2(ey - sy, ex - sx)
    for s2 in (+1, -1):
        a = th + math.pi + s2 * 0.5
        d.line([(ex, ey), (ex + math.cos(a) * 16, ey + math.sin(a) * 16)], fill=255, width=4)
    return box

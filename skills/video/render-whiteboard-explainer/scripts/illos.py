#!/usr/bin/env python3
"""W3's illustrations, drawn as ordered stroke paths rather than traced from photographs.

Measured off `refs/whiteboard/W3`: every drawing on that board is a SIMPLE CONTINUOUS OUTLINE.
One weight, no fill, no hatching except inside a pupil, no shading, no perspective tricks. An
open hand is about nine strokes. A phone is a rounded rectangle and four lines.

Our existing art is traced from generated photographs, which is why it reads as clip-art next
to the reference: a traced photo carries every contour the photo had, so it has ten times the
detail and none of the confidence. These are drawn instead.

Every builder returns a list of polylines in a 0..100 x 0..100 box, which is the same shape
`strokes_for` produces, so they drop straight into the board renderer.
"""
import math
import random


def _cr(P, step):
    """Catmull-Rom through one run of points."""
    if len(P) < 3:
        return list(P)
    Q = [P[0]] + list(P) + [P[-1]]
    out = []
    for i in range(len(Q) - 3):
        p0, p1, p2, p3 = Q[i], Q[i + 1], Q[i + 2], Q[i + 3]
        seg = max(2, int(math.hypot(p2[0] - p1[0], p2[1] - p1[1]) / step))
        for j in range(seg):
            t = j / seg
            t2, t3 = t * t, t * t * t
            out.append((
                0.5 * ((2 * p1[0]) + (-p0[0] + p2[0]) * t
                       + (2 * p0[0] - 5 * p1[0] + 4 * p2[0] - p3[0]) * t2
                       + (-p0[0] + 3 * p1[0] - 3 * p2[0] + p3[0]) * t3),
                0.5 * ((2 * p1[1]) + (-p0[1] + p2[1]) * t
                       + (2 * p0[1] - 5 * p1[1] + 4 * p2[1] - p3[1]) * t2
                       + (-p0[1] + 3 * p1[1] - 3 * p2[1] + p3[1]) * t3)))
    out.append(P[-1])
    return out


def _smooth(pts, step=2.2, corner=0.8):
    """Resample through a spline, but KEEP REAL CORNERS.

    Authoring every shape as a handful of points and drawing it as a polyline gives a chain of
    straight segments with a visible kink at each one, which is what "the line breaks" is.
    Splining all of it fixed that and then rounded off the corners that were meant to be there:
    a tumbler became a test tube and the jars became pills. So the run is split wherever the
    direction turns hard, each piece is splined on its own, and the corners survive.
    """
    if len(pts) < 3:
        return pts
    runs, cur = [], [pts[0]]
    for i in range(1, len(pts) - 1):
        ax, ay = pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]
        bx, by = pts[i + 1][0] - pts[i][0], pts[i + 1][1] - pts[i][1]
        la, lb = math.hypot(ax, ay), math.hypot(bx, by)
        cur.append(pts[i])
        if la > 1e-6 and lb > 1e-6:
            d = max(-1.0, min(1.0, (ax * bx + ay * by) / (la * lb)))
            # 0.8 rad is about 46 deg of TURN. At 1.9 a square corner (a 90 deg
            # turn, 1.57 rad) fell under the threshold and got rounded away.
            if math.acos(d) > corner:          # a hard turn: end the run here
                runs.append(cur)
                cur = [pts[i]]
    cur.append(pts[-1])
    runs.append(cur)
    out = []
    for r in runs:
        out += _cr(r, step)
    return out


def _wob(pts, amp, rnd):
    """A drawn line is never straight. A slow wander along the run, not per-point noise, which
    reads as a shaky hand rather than a confident one."""
    if amp <= 0 or len(pts) < 2:
        return pts
    ph = rnd.uniform(0, 6.28)
    out = []
    for i, (x, y) in enumerate(pts):
        u = i / max(1, len(pts) - 1)
        d = math.sin(ph + u * 3.1) * amp + math.sin(ph * 1.7 + u * 7.3) * amp * 0.4
        if i == 0 or i == len(pts) - 1:
            d *= 0.3
        nx, ny = (0.0, 0.0)
        if i < len(pts) - 1:
            dx, dy = pts[i + 1][0] - x, pts[i + 1][1] - y
            ln = max(1e-6, math.hypot(dx, dy))
            nx, ny = -dy / ln, dx / ln
        out.append((x + nx * d, y + ny * d))
    return out


def _arc(cx, cy, rx, ry, a0, a1, n=26):
    return [(cx + math.cos(a0 + (a1 - a0) * i / (n - 1)) * rx,
             cy + math.sin(a0 + (a1 - a0) * i / (n - 1)) * ry) for i in range(n)]


def _circle(cx, cy, r, n=30):
    return _arc(cx, cy, r, r, 0, 2 * math.pi, n)


def _rrect(x, y, w, h, r, n=7):
    p = []
    for (cx, cy, a0) in ((x + w - r, y + r, -math.pi / 2), (x + w - r, y + h - r, 0),
                         (x + r, y + h - r, math.pi / 2), (x + r, y + r, math.pi)):
        p += _arc(cx, cy, r, r, a0, a0 + math.pi / 2, n)
    return p + [p[0]]


def _poly(*pts):
    return list(pts)


def _leaf(bx, by, tx, ty, w, n=12):
    """A leaf as a LENS: two curves bowing opposite ways from base to tip. Built from straight
    segments it comes out as a diamond, which is what made the greens read as origami."""
    dx, dy = tx - bx, ty - by
    ln = max(1e-6, math.hypot(dx, dy))
    ux, uy = dx / ln, dy / ln
    nx, ny = -uy, ux
    out = []
    for sgn in (1, -1):
        cx = bx + ux * ln * 0.5 + nx * w * sgn * 1.9
        cy = by + uy * ln * 0.5 + ny * w * sgn * 1.9
        for i in range(n):
            t = i / (n - 1)
            u = 1 - t
            out.append((u * u * bx + 2 * u * t * cx + t * t * tx,
                        u * u * by + 2 * u * t * cy + t * t * ty))
    return out


def _finger(bx, by, tx, ty, w, n=11):
    """One finger: up one side, a half-turn round the tip, back down the other.

    The first version built the two sides separately and reversed one of them in place, which
    interleaved the points and drew the finger as a scribble."""
    dx, dy = tx - bx, ty - by
    ln = max(1e-6, math.hypot(dx, dy))
    ux, uy = dx / ln, dy / ln
    nx, ny = -uy, ux
    cx, cy = tx - ux * w * 0.8, ty - uy * w * 0.8      # centre of the tip's half-circle
    pts = [(bx + nx * w, by + ny * w),
           (bx + ux * ln * 0.55 + nx * w, by + uy * ln * 0.55 + ny * w),
           (cx + nx * w, cy + ny * w)]
    a0 = math.atan2(ny, nx)
    pts += [(cx + math.cos(a0 - math.pi * i / (n - 1)) * w,
             cy + math.sin(a0 - math.pi * i / (n - 1)) * w) for i in range(n)]
    pts += [(bx + ux * ln * 0.55 - nx * w, by + uy * ln * 0.55 - ny * w),
            (bx - nx * w, by - ny * w)]
    return pts


def hand(rnd, w=1.4):
    """W3's open palm, traced as ONE CONTINUOUS OUTLINE: down the arm, round the thumb, then
    out and back for each finger in turn, and away along the other side of the arm.

    Two earlier versions drew the palm and the fingers as separate strokes. However good the
    individual fingers were, the palm lines then cut straight across them and the whole thing
    read as a bundle of loops rather than a hand. A hand has no internal edges - the fingers
    ARE the outline.
    """
    # each digit: (base on the leading side, tip, base on the trailing side, half-width)
    digits = [((52, 30), (40, 6), (46, 36), 5.0),       # thumb
              ((44, 38), (4, 26), (42, 48), 4.6),       # index
              ((42, 49), (0, 48), (41, 60), 4.8),       # middle
              ((41, 61), (4, 70), (42, 71), 4.5),       # ring
              ((43, 72), (16, 90), (50, 80), 4.0)]      # little
    out = [(100, 24), (74, 27), (56, 30)]               # arm, leading edge
    for lead, tip, trail, hw in digits:
        mid = ((lead[0] + trail[0]) / 2, (lead[1] + trail[1]) / 2)
        ux, uy = tip[0] - mid[0], tip[1] - mid[1]
        ln = max(1e-6, math.hypot(ux, uy))
        ux, uy = ux / ln, uy / ln
        nx, ny = -uy, ux
        # +n must lie on the LEAD side, or the finger folds over itself
        if (lead[0] - mid[0]) * nx + (lead[1] - mid[1]) * ny < 0:
            nx, ny = -nx, -ny
        cx, cy = tip[0] - ux * hw, tip[1] - uy * hw
        # The half-turn is measured from the SIDES of the finger, not from its base. Taking the
        # angles to the palm-side points made both ends face back down the finger, so the sweep
        # collapsed to nothing and every finger came to a spike.
        a0 = math.atan2(ny, nx)
        out.append(lead)
        out.append((cx + nx * hw, cy + ny * hw))
        out += [(cx + math.cos(a0 - math.pi * i / 12) * hw,
                 cy + math.sin(a0 - math.pi * i / 12) * hw) for i in range(13)]
        out.append(trail)
    out += [(58, 84), (78, 78), (100, 72)]              # arm, trailing edge
    return [_wob(out, 0.35, rnd)]


def sprig(rnd):
    """A stem with paired leaves, the small filler plant W3 dots around the board."""
    o = [_poly((50, 98), (50, 62), (52, 30), (50, 8))]
    for i, y in enumerate((82, 66, 50, 34)):
        sz = 18 - i * 2
        for sgn in (1, -1):
            o.append(_leaf(50, y, 50 + sgn * sz, y - sz * 0.75, sz * 0.30))
    return [_wob(p, 0.5, rnd) for p in o]


def thought_cloud(rnd):
    """A scalloped cloud plus its two trailing puffs."""
    o, pts, n = [], [], 11
    for i in range(n + 1):
        a_ = i * 2 * math.pi / n
        rr = 1 + 0.1 * math.sin(i * 2.7)
        pts.append((50 + math.cos(a_) * 40 * rr, 44 + math.sin(a_) * 26 * rr))
    for i in range(n):
        m = ((pts[i][0] + pts[i + 1][0]) / 2, (pts[i][1] + pts[i + 1][1]) / 2)
        a_ = math.atan2(m[1] - 44, m[0] - 50)
        o.append(_arc(m[0] + math.cos(a_) * 3, m[1] + math.sin(a_) * 3, 9, 9,
                      a_ - 2.2, a_ + 2.2, 10))
    o.append(_circle(20, 80, 8, 14))
    o.append(_circle(9, 94, 5, 12))
    return [_wob(p, 0.5, rnd) for p in o]


def speech_bubble(rnd):
    """A rounded bubble with a tail, for the short interjections W3 scatters about."""
    o = [_rrect(8, 12, 84, 56, 26, 9), _poly((36, 66), (30, 88), (54, 68))]
    return [_wob(p, 0.6, rnd) for p in o]


def heart(rnd):
    o = []
    for sgn in (1, -1):
        o.append(_arc(50 + sgn * 15, 38, 16, 15, math.pi * 0.95, math.pi * 2.05, 16))
    o.append(_poly((19, 44), (50, 86), (81, 44)))
    return [_wob(p, 0.6, rnd) for p in o]


def face(rnd):
    """The small smiling head W3 uses as a reaction."""
    o = [_arc(50, 52, 30, 36, 0, 2 * math.pi, 34),
         _poly((30, 40), (40, 36)), _poly((58, 36), (70, 40)),
         _arc(50, 58, 16, 13, 0.25, math.pi - 0.25, 14),
         _poly((36, 22), (44, 12), (58, 16))]
    return [_wob(p, 0.6, rnd) for p in o]


def watering_can(rnd):
    """A can with a spout and falling drips."""
    o = [_poly((22, 40), (26, 84), (66, 84), (70, 40), (22, 40)),
         _arc(46, 40, 24, 7, 0, 2 * math.pi, 22),
         _poly((70, 52), (88, 44), (96, 30)),
         _arc(90, 26, 9, 7, 0.4, math.pi + 0.9, 12),
         _arc(46, 34, 17, 14, math.pi * 1.1, math.pi * 1.9, 14)]
    for x, y in ((92, 44), (86, 56), (95, 60)):
        o.append(_arc(x, y, 3.5, 5, 0, 2 * math.pi, 12))
    return [_wob(p, 0.6, rnd) for p in o]


def dots(rnd, n=14):
    """The scattered specks W3 puts around anything active."""
    r2 = random.Random(9)
    return [_circle(r2.uniform(6, 94), r2.uniform(6, 94), r2.uniform(1.4, 2.6), 9)
            for _ in range(n)]


def glass(rnd):
    """A tumbler with a powder line in it, as the scoop beat needs."""
    o = [_poly((28, 26), (33, 92), (67, 92), (72, 26)),
         _arc(50, 26, 22, 5, 0, 2 * math.pi, 26),
         _poly((36, 74), (42, 68), (50, 73), (58, 67), (64, 74))]
    return [_wob(p, 0.5, rnd) for p in o]


def scoop(rnd):
    """A scoop tipped over a glass, pouring. The first version was an arc and a stick and read
    as nothing at all; the glass underneath is what makes the beat legible."""
    o = [_arc(30, 26, 17, 13, 0.35, math.pi + 0.35, 22),        # the bowl
         _poly((45, 20), (74, 10), (80, 15), (50, 27)),         # the handle
         _poly((22, 36), (24, 50), (28, 58)),                   # the pour
         _poly((38, 36), (37, 50), (34, 58))]
    o += [_poly((x, y), (x + 1, y + 4)) for x, y in
          ((26, 42), (33, 46), (23, 52), (31, 56))]
    o += [_poly((26, 62), (30, 96), (62, 96), (66, 62)),        # the glass
          _arc(46, 62, 20, 5, 0, 2 * math.pi, 24),
          _poly((34, 86), (40, 81), (46, 86), (52, 80), (60, 86))]
    return [_wob(p, 0.45, rnd) for p in o]


def capsules(rnd):
    """The vitamins beat: a tipped bottle and a scatter of capsules."""
    o = [_rrect(10, 30, 44, 26, 12), _poly((52, 34), (66, 30), (66, 52), (52, 50))]
    for cx, cy, a in ((66, 66, 0.3), (80, 58, -0.5), (74, 80, 0.9),
                      (88, 74, 0.1), (60, 84, -0.3)):
        dx, dy = math.cos(a) * 7, math.sin(a) * 7
        o.append(_rrect(cx - dx - 4, cy - dy - 4, 16, 9, 4.5))
        o.append(_poly((cx - dy * 0.5, cy + dx * 0.5), (cx + dy * 0.5, cy - dx * 0.5)))
    return [_wob(p, 0.4, rnd) for p in o]


def greens(rnd):
    """The superfood beat: a leafy bunch with a tie, every leaf a lens on its own stalk."""
    o = []
    for a_, ln, wd, base in ((-2.3, 36, 9, (45, 76)), (-1.9, 44, 10, (47, 75)),
                             (-1.35, 48, 11, (50, 74)), (-0.85, 40, 10, (53, 75)),
                             (-0.45, 31, 8, (56, 77))):
        tx = base[0] + math.cos(a_) * ln
        ty = base[1] + math.sin(a_) * ln
        o.append(_leaf(base[0], base[1], tx, ty, wd))
        o.append(_poly(base, (tx, ty)))
    o += [_poly((41, 78), (60, 78)), _poly((43, 85), (58, 85)),
          _poly((47, 78), (46, 97)), _poly((54, 78), (55, 97))]
    return [_wob(p, 0.4, rnd) for p in o]


def mushrooms(rnd):
    """The plants beat: two mushrooms and a sprig. Stems are CLOSED at the foot; leaving them
    open left the second mushroom floating on two detached lines."""
    o = [_arc(32, 52, 21, 15, math.pi, 2 * math.pi, 22), _poly((11, 52), (53, 52)),
         _poly((25, 52), (24, 82), (40, 82), (39, 52)),
         _arc(70, 42, 14, 10, math.pi, 2 * math.pi, 18), _poly((56, 42), (84, 42)),
         _poly((65, 42), (64, 70), (77, 70), (76, 42)),
         _poly((8, 92), (92, 92))]
    for x in (52, 88):
        o.append(_poly((x, 92), (x - 5, 82), (x - 1, 74)))
        o.append(_poly((x - 4, 84), (x - 11, 80)))
    return [_wob(p, 0.5, rnd) for p in o]


def cells(rnd):
    """The probiotics beat: a round field with squiggles, the way W3 draws 'lots of small
    things' rather than drawing each one accurately."""
    o = [_circle(50, 50, 38)]
    r2 = random.Random(4)
    for _ in range(13):
        a = r2.uniform(0, 6.28)
        d = math.sqrt(r2.uniform(0.04, 1.0)) * 28
        cx, cy = 50 + math.cos(a) * d, 50 + math.sin(a) * d
        th = r2.uniform(0, 3.14)
        o.append(_poly((cx - math.cos(th) * 6, cy - math.sin(th) * 6),
                       (cx + math.sin(th) * 2, cy - math.cos(th) * 2),
                       (cx + math.cos(th) * 6, cy + math.sin(th) * 6)))
    return [_wob(p, 0.45, rnd) for p in o]


def jars(rnd):
    """The 'replaces six products' beat: a shelf of bottles, all different."""
    o = [_poly((4, 88), (96, 88))]
    x = 10
    for w, h in ((13, 30), (11, 38), (15, 26), (10, 34), (14, 32), (12, 24)):
        o.append(_poly((x, 88), (x, 88 - h), (x + w, 88 - h), (x + w, 88)))
        o.append(_poly((x + w * 0.3, 88 - h), (x + w * 0.3, 88 - h - 5),
                       (x + w * 0.7, 88 - h - 5), (x + w * 0.7, 88 - h)))
        x += w + 3
    return [_wob(p, 0.4, rnd) for p in o]


def phone_stats(rnd):
    """W3's analytics vignette: a phone, a bar chart, a couple of ticks."""
    o = [_rrect(26, 8, 48, 84, 8), _poly((40, 14), (60, 14))]
    for i, h in enumerate((14, 26, 20, 34)):
        x = 34 + i * 10
        o.append(_poly((x, 74), (x, 74 - h), (x + 6, 74 - h), (x + 6, 74)))
    o.append(_poly((32, 78), (72, 78)))
    return [_wob(p, 0.45, rnd) for p in o]


BUILDERS = {
    "hand": hand, "glass": glass, "scoop": scoop, "capsules": capsules,
    "greens": greens, "mushrooms": mushrooms, "cells": cells, "jars": jars,
    "phone": phone_stats, "sprig": sprig, "cloud": thought_cloud,
    "bubble": speech_bubble, "heart": heart, "face": face, "can": watering_can,
    "dots": dots,
}


def build(name, box, seed=0):
    """Return the named illustration as polylines scaled into `box` = (x, y, w, h)."""
    if name not in BUILDERS:
        raise SystemExit(f"no illustration {name!r}. Known: {', '.join(BUILDERS)}")
    bx, by, bw, bh = box
    rnd = random.Random(seed or (hash(name) & 0xFFFF))
    return [[(bx + px / 100 * bw, by + py / 100 * bh) for px, py in _smooth(poly)]
            for poly in BUILDERS[name](rnd)]

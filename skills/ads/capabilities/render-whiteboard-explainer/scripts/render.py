#!/usr/bin/env python3
"""Whiteboard explainer matched to W3: marker ink laid onto a REAL board in a REAL room.

    python render-w3.py --project <dir> [--episode episode-w3.json] [--still] [--frame 7]

`refs/whiteboard/W3` is the current vertical version of this format, and it is FILMED: a board
on an easel in a lived-in room, warm daylight, a real hand, the drawing time-lapsed under a
normal-speed voice. Two rendered attempts failed for the same reason - drawing a board object
reads as a drawn board, and drawing on plain white reads as a sketch film.

So the board is a PHOTOGRAPH (`art/plate/`) and the ink is rendered onto it. A deliberate
exception to the repo's never-composite rule, taken with the user's approval: the rule exists
because composited marks slide against a real camera's motion, and here there is no real camera
to track - the plate is a still and the handheld drift is generated over both layers at once.

The layout is W3's own: a bubble title, a subtitle between flanking dashes, eye-bulleted rows
down the left, and one large drawing filling the right.

  LETTERING  `lettering.py` - drawn per letter with its own size, rotation and baseline, never
             set as flat type, which is the clearest tell that a board was not hand-lettered
  DRAWINGS   `art/line/paths.json` - generated AS LINE ART and traced to ordered strokes. Art
             traced from painterly images carries every contour the photo had and reads as
             clip-art; art generated as a marker drawing traces to a handful of confident paths
  INK        MULTIPLIED onto the plate, so the board's sheen and the window light come through
             the strokes rather than sitting on top as flat black
  COLOUR     none. W3 is pure black marker throughout
"""
import argparse
import importlib.util
import json
import math
import random
import re
import subprocess
import sys
import tempfile
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageFont

HERE = Path(__file__).resolve().parent


def _load(name, fn):
    sp = importlib.util.spec_from_file_location(name, HERE / fn)
    m = importlib.util.module_from_spec(sp)
    sp.loader.exec_module(m)
    return m


L = _load("lettering", "lettering.py")
A_ = _load("anchors", "anchors.py")
I = _load("illos", "illos.py")

W, H = 1080, 1920
SAFE_T, SAFE_B = 285, 1635


def perspective_coeffs(src, dst):
    """PIL's PERSPECTIVE transform maps DESTINATION pixels back to SOURCE."""
    A = []
    for (x, y), (u, v) in zip(dst, src):
        A.append([x, y, 1, 0, 0, 0, -u * x, -u * y])
        A.append([0, 0, 0, x, y, 1, -v * x, -v * y])
    return np.linalg.solve(np.array(A, dtype=float), np.array(src, dtype=float).reshape(8))


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--project", required=True, type=Path)
    ap.add_argument("--episode", default="episode-w3.json")
    ap.add_argument("--out", type=Path, default=None)
    ap.add_argument("--fps", type=int, default=30)
    ap.add_argument("--still", action="store_true")
    ap.add_argument("--frame", type=float, default=None)
    A = ap.parse_args()
    P = A.project.resolve()
    EP = json.loads((P / A.episode).read_text(encoding="utf-8"))
    INK = tuple(EP.get("ink", [26, 26, 28]))

    plate = Image.open(P / "art" / "plate" / EP["plate"]).convert("RGB")
    PW, PH = plate.size
    QUAD = [tuple(p) for p in EP["quad"]]
    qw = (QUAD[1][0] - QUAD[0][0] + QUAD[2][0] - QUAD[3][0]) / 2
    qh = (QUAD[3][1] - QUAD[0][1] + QUAD[2][1] - QUAD[1][1]) / 2
    DW = 1000
    DH = int(round(DW * qh / qw))      # design space carries the BOARD's aspect, so a circle
    S = DW / 1000.0                    # drawn square stays square once it is on the board

    paths = json.loads((P / "art" / "line" / "paths.json").read_text(encoding="utf-8"))
    words = json.loads((P / "voice" / "words.json").read_text(encoding="utf-8"))
    words = words["words"] if isinstance(words, dict) else words
    words = [w for w in words if w["w"].strip()]
    # ONE resolver, shared with solve-layout.py. Two implementations disagreed on the same
    # episode: the solver read "In" as 22.48s and the renderer as "ingredients" at 19.49s.
    def at(anchor, k=None):
        return A_.resolve(words, anchor, k)[0]

    acts = []
    for act in EP["acts"]:
        items = [dict(it, t=at(it["anchor"], it.get("anchor_n", 1))) for it in act["items"]]
        items.sort(key=lambda i: i["t"])
        acts.append({"items": items, "t": items[0]["t"]})
    acts.sort(key=lambda a: a["t"])
    dur = words[-1]["e"] + EP.get("hold_s", 1.6)
    n = int(dur * A.fps)
    WIPE = EP.get("wipe_s", 0.35)

    def _order(strokes):
        """Draw in the order a person would: start at the top-left and always move to the
        nearest unused stroke. The tracer emits strokes in scan order, so a half-drawn picture
        jumped around the frame and read as unrelated marks rather than as work in progress."""
        if not strokes:
            return strokes
        rest = list(strokes)
        first = min(rest, key=lambda p: p[0][1] * 2 + p[0][0])
        rest.remove(first)
        out, cur = [first], first[-1]
        while rest:
            nxt = min(rest, key=lambda p: (p[0][0] - cur[0]) ** 2 + (p[0][1] - cur[1]) ** 2)
            rest.remove(nxt)
            out.append(nxt)
            cur = nxt[-1]
        return out

    def art_strokes(name, box):
        # FIT, never stretch. The paths are normalised to a 0-100 square, so filling a box of a
        # different aspect distorts the drawing - a 480x930 box turned the tumbler into a pipe.
        bx, by, bw, bh = box
        side = min(bw, bh)
        bx += (bw - side) / 2
        by += (bh - side) / 2
        bw = bh = side
        out = []
        for d in paths[name]:
            pts = [(bx + float(a) / 100 * bw, by + float(b) / 100 * bh)
                   for a, b in re.findall(r"[ML] ([\d.]+) ([\d.]+)", d)]
            if len(pts) >= 2:
                out.append(pts)
        return _order(out)

    def ink_layer(act, t, wipe=0.0):
        lay = Image.new("L", (DW, DH), 0)
        d = ImageDraw.Draw(lay)
        boxes = {}
        for i, it in enumerate(act["items"]):
            nxt = act["items"][i + 1]["t"] if i + 1 < len(act["items"]) else it["t"] + 1.8
            span = max(0.28, (nxt - it["t"]) * EP.get("draw_frac", 0.8))
            # Text is CAPPED so it always finishes. Stretching a row across the whole gap to the
            # next beat meant the last row of an act was still being written when the board
            # wiped, and it went out half-lettered.
            if it["kind"] in ("row", "title", "subtitle"):
                span = min(span, EP.get("text_s", 0.85))
            elif it["kind"] in ("art", "mark"):
                span = min(span, EP.get("art_s", 1.5))
            p = min(1.0, max(0.0, (t - it["t"]) / span))
            if p <= 0:
                continue
            rnd = random.Random(i * 977 + 13)
            k = it["kind"]
            if k == "art":
                st = art_strokes(it["art"], it["box"])
                pen = max(2, int(it.get("pen", 5) * S))
                for poly in st[:int(len(st) * p)]:
                    d.line(poly, fill=255, width=pen, joint="curve")
                    for e in (poly[0], poly[-1]):
                        d.ellipse([e[0] - pen / 2, e[1] - pen / 2,
                                   e[0] + pen / 2, e[1] + pen / 2], fill=255)
            elif k == "title":
                L.bubble_title(lay, it["text"], it["at"][0], it["at"][1],
                               int(it.get("size", 96) * S), rnd, reveal=p)
            elif k == "subtitle":
                b = L.hand_caps(lay, it["text"], it["at"][0], it["at"][1],
                                int(it.get("size", 46) * S), rnd, anchor="ct", reveal=p)
                if p > 0.98:
                    L.rule(lay, b[0] - 86 * S, it["at"][1] + 30 * S, 72 * S, rnd)
                    L.rule(lay, b[2] + 14 * S, it["at"][1] + 30 * S, 72 * S, rnd)
            elif k == "row":
                bw = 34 * S
                if p > 0.12:
                    L.bullet(lay, it["at"][0], it["at"][1] + 26 * S, bw, rnd)
                # FIT the row into the space actually left beside the art. Rows and drawings
                # were both placed at coordinates chosen independently, so sooner or later a
                # long label ran straight into a drawing - which is what happened to
                # "GINGER AND RHODIOLA" and the greens.
                x0 = it["at"][0] + bw + 18 * S
                avail = it.get("max_x", DW - 30) * S - x0
                size = int(it.get("size", 44) * S)
                while size > 16 and L.measure_caps(it["text"], size) > avail:
                    size -= 2
                boxes[it.get("id", i)] = L.hand_caps(
                    lay, it["text"], x0, it["at"][1], size, rnd,
                    reveal=max(0.0, (p - 0.15) / 0.85))
            elif k == "mark":
                # FILLER. A real scribe never stops drawing: between the beats that carry a
                # word they are adding sprigs, dots and small marks, which is most of why the
                # reference board fills up while ours stayed empty.
                st = I.build(it["shape"], it["box"], seed=i + 7)
                pen = max(2, int(it.get("pen", 4) * S))
                for poly in st[:int(len(st) * p)]:
                    d.line(poly, fill=255, width=pen, joint="curve")
            elif k == "ring":
                # drawn as a real ellipse would be: from one point, round, and slightly past
                # where it started, which is what stops it reading as a vector oval
                bx, by, bw, bh = it["box"]
                cx, cy, rx, ry = bx + bw / 2, by + bh / 2, bw / 2, bh / 2
                steps = max(3, int(74 * p))
                pts = [(cx + math.cos(-1.9 + 6.9 * j / 73) * rx * (1 + 0.02 * math.sin(j * 0.7)),
                        cy + math.sin(-1.9 + 6.9 * j / 73) * ry * (1 + 0.02 * math.cos(j * 0.9)))
                       for j in range(steps)]
                if len(pts) > 1:
                    d.line(pts, fill=255, width=max(3, int(it.get("pen", 7) * S)), joint="curve")
            elif k == "note" and p > 0.3:
                tgt = boxes.get(it["of"])
                if tgt:
                    L.annotate(lay, it["text"], int(it.get("size", 30) * S),
                               (tgt[2], tgt[1]), it.get("side", "upright"), rnd)
            elif k == "emphasis" and p > 0.3:
                tgt = boxes.get(it["of"])
                if tgt:
                    L.emphasis(lay, tgt, it.get("side", "right"), rnd,
                               length=int(it.get("length", 52) * S))
        if wipe > 0:
            lay.paste(0, (0, 0, DW, int(DH * wipe)))
        return lay

    # Every item must COMPLETE before its act ends, or it is wiped half-drawn.
    for ai, a in enumerate(acts):
        end = acts[ai + 1]["t"] - WIPE if ai + 1 < len(acts) else dur
        for j, it in enumerate(a["items"]):
            nx = a["items"][j + 1]["t"] if j + 1 < len(a["items"]) else it["t"] + 1.8
            sp = max(0.28, (nx - it["t"]) * EP.get("draw_frac", 0.85))
            if it["kind"] in ("row", "title", "subtitle"):
                sp = min(sp, EP.get("text_s", 0.85))
            elif it["kind"] in ("art", "mark"):
                sp = min(sp, EP.get("art_s", 1.5))
            if it["t"] + sp > end + 0.01:
                print(f"  ACT {ai+1} {it['kind']} {it.get('text') or it.get('art') or ''} "
                      f"finishes {it['t']+sp:.2f} but the board wipes at {end:.2f}")
        if a["items"][0]["t"] - (acts[ai - 1]["t"] if ai else 0) and ai:
            gap = a["t"] - (acts[ai - 1]["items"][-1]["t"])
    # The darkened plate never changes, so it is computed ONCE. Recomputing it per frame cost
    # 164 ms a frame - about two minutes of pure waste on a 772-frame render.
    _tint = Image.new("RGB", (PW, PH), INK)
    _mult = Image.fromarray(
        (np.array(plate).astype(float) * (np.array(_tint).astype(float) / 255.0)).astype("uint8"))
    _inked = Image.blend(_mult, _tint, EP.get("ink_strength", 0.8))

    co = perspective_coeffs([(0, 0), (DW, 0), (DW, DH), (0, DH)], QUAD)

    def compose(f):
        t = f / A.fps
        cur = acts[0]
        for a in acts:
            if t >= a["t"] - WIPE:
                cur = a
        idx = acts.index(cur)
        lay = (ink_layer(acts[idx - 1], t, wipe=1 - (cur["t"] - t) / WIPE)
               if idx > 0 and t < cur["t"] else ink_layer(cur, t))
        m = lay.transform((PW, PH), Image.PERSPECTIVE, co, Image.BICUBIC)
        m = m.filter(ImageFilter.GaussianBlur(0.8))
        out = Image.composite(_inked, plate, m)

        amp = EP.get("handheld", 6)
        ax = math.sin(t * 1.7) * amp + math.sin(t * 0.63) * amp * 0.6
        ay = math.cos(t * 1.31) * amp + math.sin(t * 0.47) * amp * 0.5
        rot = math.sin(t * 0.83) * EP.get("handheld_rot", 0.26)
        z = 1.05 + 0.012 * math.sin(t * 0.4)
        # ONE affine, not rotate then crop then resize. Three resamples cost 369 ms a frame;
        # composed into a single matrix it is one. Verified sub-half-pixel against the old path.
        th = -math.radians(rot)
        cs, sn = math.cos(th), math.sin(th)
        Cx, Cy = PW / 2, PH / 2
        c0 = Cx - cs * Cx - sn * Cy
        f0 = Cy + sn * Cx - cs * Cy
        cw, ch = PW / z, PH / z
        pq, qq = cw / W, PW / 2 + ax - cw / 2
        rr, ss = ch / H, PH / 2 + ay - ch / 2
        out = out.transform((W, H), Image.AFFINE,
                            (cs * pq, sn * rr, cs * qq + sn * ss + c0,
                             -sn * pq, cs * rr, -sn * qq + cs * ss + f0),
                            resample=Image.BICUBIC)

        d = ImageDraw.Draw(out)
        if EP.get("headline") and t < EP.get("headline_s", 3.0):   # off unless set
            size = EP.get("headline_size", 60)
            fh = ImageFont.truetype(L.TITLE, size)
            for j, l in enumerate(EP["headline"].split("|")):
                lw = d.textlength(l, font=fh)
                x0, yy = (W - lw) / 2, SAFE_T + 40 + j * (size + 20)
                d.rounded_rectangle([x0 - 26, yy - 12, x0 + lw + 26, yy + size + 16],
                                    radius=18, fill=(12, 12, 14))
                d.text((x0, yy), l, font=fh, fill=(255, 255, 255))
        # Nothing before the voice is actually audible. At t=0 the first word
        # technically starts, so a caption was baked into the poster frame and
        # showed on a blank board before the video was even played.
        sub = (next((w for w in words if w["s"] <= t < w["e"]), None)
               if t >= EP.get("caption_from", 0.45) else None)
        if sub:
            i = words.index(sub)
            # up to the word being spoken, never past it. Including i+2 put the
            # next two words on screen before they were said, so the caption was
            # reading out ahead of the voiceover.
            phrase = " ".join(x["w"] for x in words[max(0, i - 4):i + 1])
            fs = ImageFont.truetype("C:/Windows/Fonts/segoescb.ttf", 36)
            tw = d.textlength(phrase, font=fs)
            cy = EP.get('caption_y', SAFE_B - 150)
            d.rounded_rectangle([(W - tw) / 2 - 20, cy, (W + tw) / 2 + 20, cy + 60],
                                radius=12, fill=(12, 12, 14))
            d.text(((W - tw) / 2, cy + 8), phrase, font=fs, fill=(250, 250, 250))
        return out

    if A.frame is not None:
        out = P / "working" / f"w3-{A.frame:.1f}s.png"
        out.parent.mkdir(parents=True, exist_ok=True)
        compose(min(n - 1, int(A.frame * A.fps))).save(out)
        print(f"wrote {out}")
        return

    if A.still:
        peaks = []
        for i, a in enumerate(acts):
            end = acts[i + 1]["t"] - WIPE - 0.1 if i + 1 < len(acts) else dur - 0.2
            peaks.append(min(a["items"][-1]["t"] + 2.0, end))
        tiles = [compose(min(n - 1, int(pk * A.fps))).resize((W // 3, H // 3), Image.LANCZOS)
                 for pk in peaks]
        sheet = Image.new("RGB", (tiles[0].width * len(tiles), tiles[0].height), "white")
        for i, tl in enumerate(tiles):
            sheet.paste(tl, (i * tl.width, 0))
        out = P / "working" / "w3-still.png"
        out.parent.mkdir(parents=True, exist_ok=True)
        sheet.save(out)
        print(f"wrote {out}  {len(acts)} acts")
        return

    out = A.out or (P / "working" / "w3.mp4")
    out.parent.mkdir(parents=True, exist_ok=True)
    # Raw frames down a pipe. Encoding and writing a PNG per frame, for ffmpeg to decode again,
    # cost 30 ms a frame against 6 ms to hand over the bytes.
    enc = subprocess.Popen(
        ["ffmpeg", "-v", "error", "-y", "-f", "rawvideo", "-pix_fmt", "rgb24",
         "-s", f"{W}x{H}", "-framerate", str(A.fps), "-i", "-",
         "-c:v", "libx264", "-crf", "18", "-pix_fmt", "yuv420p", str(out)],
        stdin=subprocess.PIPE)
    for f in range(n):
        enc.stdin.write(compose(f).tobytes())
        if f % 60 == 0:
            print(f"  {f / A.fps:.1f}s", end="\r", flush=True)
    enc.stdin.close()
    if enc.wait():
        sys.exit("ffmpeg failed")
    print(f"\nwrote {out}  {n} frames")


if __name__ == "__main__":
    main()

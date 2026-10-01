#!/usr/bin/env python3
"""Turn a flat list of beats into a laid-out episode.json. Free, local, no model call.

    python solve-layout.py --project <dir> --beats beats.json [--boards 3] [--write]

WHY THIS EXISTS. Hand-authoring the layout was the slowest part of building an episode and the
source of nearly every defect: labels running into drawings, notes colliding with the line
above, a ring cutting its own caption, a mark still being drawn when its board was wiped, and an
anchor that silently resolved to the wrong word and made the video play its ending first.

Every one of those is a constraint a solver can hold. The author writes WHAT is said and WHAT is
drawn; this works out where it all goes and refuses to emit a layout that breaks.

`beats.json`:

    {
      "title":    "ONE SCOOP OF AG1",      # lettered on the first board
      "subtitle": "WHAT IS IN IT",
      "payoff":   "IN ONE SCOOP",          # lettered on the last board, on its own anchor
      "payoff_say": "In", "payoff_n": 3,
      "ring_on":  "75+",                   # a hand-drawn ring closes around this beat's text
      "beats": [
        {"say": "First",    "art":  "scoop"},
        {"say": "vitamins", "text": "VITAMINS"},
        {"say": "hundred",  "text": "500mg VIT C", "art": "capsules"},
        ...
      ]
    }

Boards are split at the LARGEST PAUSES in the voiceover, which is where a scribe would wipe.
"""
import argparse
import importlib.util
import json
import sys
from pathlib import Path

def _load(name, fn):
    sp = importlib.util.spec_from_file_location(name, Path(__file__).parent / fn)
    m = importlib.util.module_from_spec(sp)
    sp.loader.exec_module(m)
    return m


L = _load("lettering", "lettering.py")
A_ = _load("anchors", "anchors.py")

# the design space is the board's, not the frame's, so a circle drawn square stays square
DW = 1000
COL_X, COL_MAX = 60, 430          # rows live here
ART_X, ART_W = 470, 470           # drawings live here; the gap between is the gutter
GUTTER = ART_X - COL_MAX          # 40px, enforced, not hoped for


def load_words(P):
    w = json.loads((P / "voice" / "words.json").read_text(encoding="utf-8"))
    w = w["words"] if isinstance(w, dict) else w
    return [x for x in w if x["w"].strip()]


def resolver(words):
    """The shared resolver, bound to this voiceover. See anchors.py for why there is only one."""
    return lambda anchor, n=None: A_.resolve(words, anchor, n)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--project", required=True, type=Path)
    ap.add_argument("--beats", required=True, type=Path)
    ap.add_argument("--base", default="episode.json",
                    help="existing episode for plate/quad/timing keys")
    ap.add_argument("--boards", type=int, default=3)
    ap.add_argument("--write", action="store_true", help="write it; otherwise print the plan")
    A = ap.parse_args()
    P = A.project.resolve()
    B = json.loads(A.beats.read_text(encoding="utf-8"))

    base_path = P / A.base
    EP = json.loads(base_path.read_text(encoding="utf-8")) if base_path.exists() else {}
    EP.setdefault("plate", "board.png")
    EP.setdefault("quad", [[115, 305], [1005, 300], [1008, 1605], [78, 1610]])
    for k, v in (("ink", [26, 26, 28]), ("ink_strength", 0.8), ("hold_s", 2.4),
                 ("draw_frac", 0.85), ("text_s", 0.85), ("art_s", 1.2), ("wipe_s", 0.35),
                 ("handheld", 2.2), ("handheld_rot", 0.09), ("caption_from", 0.45),
                 ("caption_y", 1520)):
        EP.setdefault(k, v)

    q = EP["quad"]
    qw = (q[1][0] - q[0][0] + q[2][0] - q[3][0]) / 2
    qh = (q[3][1] - q[0][1] + q[2][1] - q[1][1]) / 2
    DH = int(round(DW * qh / qw))

    words = load_words(P)
    at = resolver(words)
    dur = words[-1]["e"] + EP["hold_s"]

    beats = []
    for b in B["beats"]:
        t, word = at(b["say"], b.get("say_n"))
        beats.append(dict(b, t=t, word=word))
    beats.sort(key=lambda b: b["t"])

    # Split the boards at a pause NEAR each balanced boundary.
    #
    # Taking the K-1 largest gaps outright put 16 of 18 beats on the first board and two on the
    # last: the biggest pauses in a script are not evenly spread. So each boundary starts from
    # an even division and then slides to the largest gap within a window of it - the boards
    # come out balanced AND the wipes still land in a break in the talking.
    n = len(beats)
    cuts = []
    if A.boards > 1 and n >= A.boards:
        win = max(1, n // (2 * A.boards))
        for k in range(1, A.boards):
            ideal = round(n * k / A.boards)
            lo, hi = max(1, ideal - win), min(n - 1, ideal + win)
            best = max(range(lo, hi + 1),
                       key=lambda i: beats[i]["t"] - beats[i - 1]["t"])
            if best - 1 not in cuts:
                cuts.append(best - 1)
    cuts = sorted(set(cuts))
    groups, start = [], 0
    for c in cuts:
        groups.append(beats[start:c + 1])
        start = c + 1
    groups.append(beats[start:])
    groups = [g for g in groups if g]

    acts, report = [], []
    for gi, g in enumerate(groups):
        items = []
        rows = [b for b in g if b.get("text")]
        arts = [b for b in g if b.get("art")]
        first, last = gi == 0, gi == len(groups) - 1

        top = 330 if first else 120          # the first board carries the title block
        bot = DH - (300 if last else 90)     # the last board leaves room for the payoff
        if first:
            t0, w0 = at(B.get("title_say", B["beats"][0]["say"]), B.get("title_n"))
            items.append({"kind": "title", "anchor": B.get("title_say", B["beats"][0]["say"]),
                          "text": B["title"], "at": [DW // 2, 50], "size": 76})
            if B.get("subtitle"):
                items.append({"kind": "subtitle", "anchor": B.get("subtitle_say", g[0]["say"]),
                              "text": B["subtitle"], "at": [DW // 2, 205], "size": 46})

        # rows down the left column, evenly spaced through the board's usable height
        n = max(1, len(rows))
        step = (bot - top) / n
        for i, b in enumerate(rows):
            y = int(top + step * i)
            if b.get("big"):
                # a hero number is lettered large and centred in the left column, not set as
                # another list row - it is the thing the board is about
                items.append({"kind": "title", "anchor": b["say"],
                              **({"anchor_n": b["say_n"]} if b.get("say_n") else {}),
                              "text": b["text"], "at": [(COL_X + COL_MAX) // 2, y],
                              "size": 110, "hero": True})
            else:
                items.append({"kind": "row", "id": f"r{i}", "anchor": b["say"],
                              **({"anchor_n": b["say_n"]} if b.get("say_n") else {}),
                              "text": b["text"], "at": [COL_X, y],
                              "size": 52, "max_x": COL_MAX})
        # drawings down the right column, tracking the row they belong to
        m = max(1, len(arts))
        astep = (bot - top) / m
        side = min(ART_W, int(astep * 0.95))
        for i, b in enumerate(arts):
            cy = top + astep * i + astep / 2
            items.append({"kind": "art", "anchor": b["say"],
                          **({"anchor_n": b["say_n"]} if b.get("say_n") else {}),
                          "art": b["art"],
                          "box": [ART_X, int(cy - side / 2), side, side], "pen": 5})
        if last:
            if B.get("ring_on"):
                tgt = next((b for b in rows if b["text"] == B["ring_on"]), None)
                anc = next((it for it in items if it.get("text") == B["ring_on"]), None)
                if anc:
                    x, y = anc["at"]
                    sz = anc.get("size", 52)
                    # MEASURE the text. Sized to the column it came out as a wide flat ellipse
                    # with the number floating inside one end of it.
                    tw = L.measure_caps(anc["text"], sz)
                    if anc.get("hero"):
                        x -= tw / 2
                    items.append({"kind": "ring", "anchor": anc["anchor"],
                                  **({"anchor_n": anc["anchor_n"]} if "anchor_n" in anc else {}),
                                  "box": [int(x - sz * 0.45), int(y - sz * 0.35),
                                          int(tw + sz * 0.9), int(sz * 1.75)], "pen": 7})
            if B.get("payoff"):
                items.append({"kind": "title", "anchor": B.get("payoff_say", "In"),
                              **({"anchor_n": B["payoff_n"]} if B.get("payoff_n") else {}),
                              "text": B["payoff"], "at": [DW // 2, DH - 230], "size": 74})
        acts.append({"items": items})

    EP["acts"] = acts

    # ---- the checks that used to be my eyes -------------------------------------------------
    problems = []
    resolved = []
    for ai, act in enumerate(acts):
        its = sorted(((at(i["anchor"], i.get("anchor_n"))[0], i) for i in act["items"]),
                     key=lambda z: z[0])
        resolved.append(its)
    resolved.sort(key=lambda a: a[0][0])
    for ai, its in enumerate(resolved):
        if ai and its[0][0] <= resolved[ai - 1][0][0]:
            problems.append(f"board {ai+1} starts at {its[0][0]:.2f}, not after board {ai}")
        end = resolved[ai + 1][0][0] - EP["wipe_s"] if ai + 1 < len(resolved) else dur
        for j, (t, it) in enumerate(its):
            nxt = its[j + 1][0] if j + 1 < len(its) else t + 1.8
            sp = max(0.28, (nxt - t) * EP["draw_frac"])
            sp = min(sp, EP["text_s"]) if it["kind"] in ("row", "title", "subtitle") \
                else (min(sp, EP["art_s"]) if it["kind"] == "art" else sp)
            if t + sp > end + 0.01:
                problems.append(f"board {ai+1}: {it['kind']} "
                                f"{it.get('text') or it.get('art') or ''} finishes "
                                f"{t+sp:.2f} but the board wipes at {end:.2f}")
        for it in its:
            if it[1]["kind"] == "row" and it[1]["max_x"] + GUTTER > ART_X:
                problems.append(f"board {ai+1}: row {it[1]['text']} reaches the art column")

    print(f"design space {DW}x{DH}   {len(groups)} boards   gutter {GUTTER}px")
    for ai, its in enumerate(resolved):
        print(f"\nBOARD {ai+1}   {its[0][0]:.2f}s")
        for t, it in its:
            w = at(it["anchor"], it.get("anchor_n"))[1]
            what = it.get("text") or it.get("art") or ""
            print(f"   {t:6.2f}  {it['kind']:9s} {str(what):22s} on '{w}'")
    if problems:
        print("\nPROBLEMS:")
        for p in problems:
            print("  " + p)
        sys.exit(1)
    print("\nno problems")

    if A.write:
        out = P / "episode.json"
        out.write_text(json.dumps(EP, indent=2) + "\n", encoding="utf-8")
        print(f"wrote {out}")
    else:
        print("(dry run; pass --write to save)")


if __name__ == "__main__":
    main()

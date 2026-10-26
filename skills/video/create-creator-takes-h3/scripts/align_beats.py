#!/usr/bin/env python3
"""Move every line's start/end onto the words the creator actually speaks. Free, local.

    align_beats.py --beats cutlist.json --words creator.words.json --out cutlist.aligned.json

--words is caption-burn's transcribe.py output for the JOINED creator track (reel time):
[{"text", "start", "end"}, ...].

A line's timing comes from the script's estimate until the takes exist, and a generated
voice never speaks at the estimated pace. Unaligned, the reference build cut to its closing
card while the creator was still mid-list, and clipped the last word.

The script's words are matched to the heard words with a sequence match, so one misheard
or dropped word cannot shift everything after it. Each boundary goes midway between the
last word of one line and the first word of the next; the last line ends HOLD seconds after
the final word. Under 70% of the script heard means the takes do not say the script: stop.

The output keeps every other field (footage windows etc.). A window whose slot changed
keeps its `in`; its `out` is re-derived at the same speed, so re-run footage-cutlist
preview.py + cut.py on the aligned list and look at it again.
"""
import argparse
import difflib
import json
import pathlib
import re

HOLD = 0.45


def bare(w):
    return re.sub(r"[^a-z0-9]", "", w.lower())


def align(beats, words):
    script, owner = [], []
    for i, b in enumerate(beats):
        for w in re.sub(r"<[^>]*>", " ", b.get("vo", "")).split():
            if bare(w):
                script.append(bare(w))
                owner.append(i)
    sm = difflib.SequenceMatcher(None, script, [w for w, _, _ in words], autojunk=False)
    t_of = {}
    for blk in sm.get_matching_blocks():
        for k in range(blk.size):
            t_of[blk.a + k] = words[blk.b + k]
    first, last = {}, {}
    for idx in sorted(t_of):
        _, s, e = t_of[idx]
        i = owner[idx]
        first.setdefault(i, s)
        last[i] = e
    for i, b in enumerate(beats):
        if i == 0:
            b["start"] = 0.0
        if i + 1 < len(beats) and i in last and (i + 1) in first:
            cut = round((last[i] + first[i + 1]) / 2, 2)
            b["end"] = cut
            beats[i + 1]["start"] = cut
        if i == len(beats) - 1 and i in last:
            b["end"] = round(last[i] + HOLD, 2)
    return len(t_of) / max(len(script), 1)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--beats", required=True)
    ap.add_argument("--words", required=True)
    ap.add_argument("--out", required=True)
    ap.add_argument("--max-end", type=float, help="clamp the last line to this (the creator track length)")
    a = ap.parse_args()
    spec = json.loads(pathlib.Path(a.beats).read_text(encoding="utf-8"))
    raw = json.loads(pathlib.Path(a.words).read_text(encoding="utf-8"))
    words = [(bare(w["text"]), float(w["start"]), float(w["end"])) for w in raw
             if bare(w.get("text", "")) and w.get("start") is not None and w.get("end") is not None]
    beats = spec["beats"]
    before = [(b["start"], b["end"]) for b in beats]
    heard = align(beats, words)
    print("[align] %.0f%% of script words heard" % (100 * heard))
    if heard < 0.7:
        raise SystemExit("under 70% of the script was heard; the takes do not say the script")
    if a.max_end:
        beats[-1]["end"] = round(min(beats[-1]["end"], a.max_end - 0.05), 2)
    for (s0, e0), b in zip(before, beats):
        if "in" in b and "speed" in b:
            b["out"] = round(b["in"] + (b["end"] - b["start"]) * b["speed"], 3)
        elif "in" in b and "out" in b:
            b["out"] = round(b["in"] + (b["end"] - b["start"]) * ((b["out"] - b["in"]) / max(e0 - s0, 1e-6)), 3)
        print("  %-4s %6.2f-%6.2f  ->  %6.2f-%6.2f" % (b["id"], s0, e0, b["start"], b["end"]))
    spec["aligned"] = True
    pathlib.Path(a.out).write_text(json.dumps(spec, indent=2, ensure_ascii=False), encoding="utf-8")
    print("[align] %s" % a.out)


if __name__ == "__main__":
    main()

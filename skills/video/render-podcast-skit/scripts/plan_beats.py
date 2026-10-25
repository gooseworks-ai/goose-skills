#!/usr/bin/env python3
"""script.json -> beats.json.  FREE, deterministic, no network.

A "beat" is one unit of voiceover: one ElevenLabs call, one lipsync clip. A
script LINE may become several beats, because a line long enough to sit on
screen past `edit.multicut.max_beat_sec` is the single biggest cause of a skit
that reads as a slideshow. Splitting the line at its own punctuation costs the
same number of VO seconds and the same number of lipsync seconds -- only the
call count goes up -- and it buys a real cut on the speaker's face.

Durations:
  * if <run>/voiceovers/manifest.json exists, the REAL measured per-beat
    durations are used and `estimated` is false;
  * otherwise durations are estimated from the word count and the plan is
    marked `estimated: true`. An estimated plan is fine for the $0 preview and
    for cost arithmetic; it is not a timeline.

Usage: plan_beats.py --config config.json --script script.json --run-dir <run>
"""
from __future__ import annotations

import argparse
import json
import math
import pathlib
import re
import sys as _sys, pathlib as _pl
_sys.path.insert(0, str(_pl.Path(__file__).resolve().parent))
import config_io  # noqa: E402

SPLIT_RE = re.compile(r"(?<=\.\.\.)\s+|(?<=[.!?])\s+")


def est_dur(text: str, wps: float, floor: float) -> float:
    return max(floor, round(len(text.split()) / wps, 3))


def split_line(text: str, wps: float, floor: float, max_beat: float,
               min_words: int) -> list[str]:
    """Split at the line's own sentence boundaries until every piece fits
    under max_beat. Never splits mid-clause and never produces a stub."""
    pieces = [text]
    changed = True
    while changed:
        changed = False
        nxt: list[str] = []
        for p in pieces:
            if est_dur(p, wps, floor) <= max_beat:
                nxt.append(p)
                continue
            parts = [s.strip() for s in SPLIT_RE.split(p) if s.strip()]
            if len(parts) < 2 or any(len(s.split()) < min_words for s in parts):
                nxt.append(p)          # no clean seam: leave it whole
                continue
            # fold back into two halves so we split evenly, not 1 + N
            half = math.ceil(len(parts) / 2)
            nxt += [" ".join(parts[:half]), " ".join(parts[half:])]
            changed = True
        pieces = nxt
    return pieces


def caption_cues(text: str, max_words: int) -> list[str]:
    """Break spoken text into <=max_words cues at punctuation first."""
    chunks, cur = [], []
    for w in text.split():
        cur.append(w)
        ends = w.endswith((".", "!", "?", ",")) or w.endswith("...")
        if len(cur) >= max_words or (ends and len(cur) >= 2):
            chunks.append(" ".join(cur))
            cur = []
    if cur:
        if chunks and len(cur) == 1:
            chunks[-1] += " " + cur[0]
        else:
            chunks.append(" ".join(cur))
    return chunks or [text]


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--config", required=True)
    config_io.add_arg(ap)
    ap.add_argument("--script", required=True)
    ap.add_argument("--run-dir", required=True)
    a = ap.parse_args()

    cfg = config_io.load(a.config, a.preset)
    sc = json.loads(pathlib.Path(a.script).read_text(encoding="utf-8"))
    run = pathlib.Path(a.run_dir)

    mc = cfg["edit"]["multicut"]
    wps = float(cfg["edit"].get("words_per_sec", 2.6))
    floor = float(mc.get("min_cut_sec", 0.55))
    max_beat = float(mc.get("max_beat_sec", 2.6))
    min_words = int(mc.get("split_min_words", 3))
    cap_max = int(cfg["captions"].get("max_words_per_cue", 5))

    ch = cfg["characters"]
    pool: dict[str, list[str]] = {}
    for b in ch["bases"]:
        pool.setdefault(b["who"], []).append(b["file"])
    for v in ch["expression_variants"]:
        pool.setdefault(v["who"], []).append(v["out_name"])

    manifest = run / "voiceovers" / "manifest.json"
    real = {}
    if manifest.exists():
        real = {int(k): float(v) for k, v in
                json.loads(manifest.read_text(encoding="utf-8")).items()}

    beats: list[dict] = []
    n = 0
    for ln in sc["lines"]:
        texts = [ln["text"]]
        if mc.get("split_long_lines", True):
            texts = split_line(ln["text"], wps, floor, max_beat, min_words)
        # `hold` MERGES this line into the previous beat instead of cutting to
        # a new one. Two consecutive lines by the same host do not need a cut
        # between them: cutting there puts two clips of one person back to
        # back, which is a visible join and reads as a freeze, and it is why
        # the edit was cutting on every beat rather than on the speaker. One
        # beat means one voiceover and one clip, so the shot simply holds
        # while they keep talking. It removes a cut without removing a word.
        if ln.get("hold") and beats and len(texts) == 1:
            prev = beats[-1]
            if prev["who"] != ln["who"]:
                _sys.exit(f"[err] line {ln['n']} is marked hold but the line "
                         f"before it is host {prev['who']}, not {ln['who']}. "
                         f"A hold continues ONE person's shot; across a "
                         f"speaker change there is nothing to hold.")
            prev["text"] = f"{prev['text']} {texts[0]}".strip()
            prev["captions"] = caption_cues(prev["text"], cap_max)
            prev["held_lines"] = prev.get("held_lines", [prev["line"]]) + [ln["n"]]
            prev["payoff"] = prev["payoff"] or bool(ln.get("payoff"))
            prev["dur_sec"] = real.get(prev["n"],
                                       est_dur(prev["text"], wps, floor))
            continue

        for j, t in enumerate(texts):
            n += 1
            who = ln["who"]
            # a line's own still choice wins; otherwise walk that host's pool
            # deterministically so consecutive beats never reuse a frame
            still = ln.get("still") if j == 0 and ln.get("still") else \
                pool[who][(n + j) % len(pool[who])]
            beats.append({
                "n": n,
                "line": ln["n"],
                "part": j + 1,
                "of_parts": len(texts),
                "who": who,
                "text": t,
                "still": still,
                "captions": caption_cues(t, cap_max),
                "split": bool(ln.get("split", False)) and j == 0,
                # the payoff marker rides the LAST part of its line, because a
                # line split in two lands its emphasis on the second half
                "payoff": bool(ln.get("payoff", False)) and j == len(texts) - 1,
                "dur_sec": real.get(n, est_dur(t, wps, floor)),
            })

    out = {
        "estimated": not bool(real),
        "words_per_sec": wps,
        "total_sec": round(sum(b["dur_sec"] for b in beats), 3),
        "n_lines": len(sc["lines"]),
        "n_beats": len(beats),
        "beats": beats,
    }
    run.mkdir(parents=True, exist_ok=True)
    p = run / "beats.json"
    p.write_text(json.dumps(out, indent=2), encoding="utf-8")
    src = "MEASURED from voiceovers/manifest.json" if real else "ESTIMATED from word count"
    print(f"[beats] {len(sc['lines'])} lines -> {len(beats)} beats, "
          f"{out['total_sec']:.2f}s ({src}) -> {p}")
    over = [b["n"] for b in beats if b["dur_sec"] > max_beat + 1e-6]
    if over:
        print(f"[beats] WARN beats over max_beat_sec={max_beat}: {over} "
              f"(no clean punctuation seam; shorten the line in script.json)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

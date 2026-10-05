#!/usr/bin/env python3
"""beats.json -> cutplan.json.  FREE, deterministic, no network.

This is the multicut. The audio timeline is fixed: it is the per-beat voiceover,
concatenated, and nothing here changes it by a millisecond. What varies is the
PICTURE, and because it is only a picture edit over clips that were already
paid for, every re-cut costs $0.

Three segment kinds, and the reason each exists:

  speaker   the beat's own lipsync clip, trimmed to this cut's window. The only
            kind allowed to show the speaking host full frame, because it is the
            only kind whose mouth tracks the audio.
  listener  the OTHER host, full frame, muted, sampled from one of their own
            clips at a seeded offset (a blink, a nod, a small settle). This is
            what makes a cut inside a beat possible at all: cutting to another
            still of the SPEAKER would show a mouth that does not move.
  insert    a short image-to-video cutaway. The only kind that costs extra, so
            it is budgeted (`edit.inserts.count`) and off by default.

and one whole-beat mode:

  split     both hosts on screen at once, speaker and listener stacked. Picture
            only, so it is free, and it recurs on a cadence rather than at
            random: `edit.split_screen.auto_every`, plus any beat the script
            marks `"split": true`.

Pattern choice is a cursor walk over `edit.cut_patterns`, started at
`edit.seed % len(patterns)`. No RNG: the same seed and the same beats always
produce the same plan, which is what makes a re-run reproducible and a
regression diffable.

THE SECOND DIMENSION: FRAMING
-----------------------------
A segment kind says WHAT the viewer looks at. It does not say how big it is in
the frame, and that omission is the one measured gap in this format. With four
kinds and a single geometry, a 49-second piece produced TWO distinct pictures
and cut back to the same one half the time: 0.41 distinct framings per 10
seconds against a reference band of 2.9 to 7.1, and a 50% biggest-framing share
against a ceiling of 17% (references/REFERENCES.md, "The single biggest gap").

So every segment now also carries a FRAMING: a normalised crop rect on its own
source plate, which `compose_master.py` applies inside the same ffmpeg call it
already makes. Nothing is generated and nothing is re-rolled.

  singles and reactions  one of `edit.framing.sizes`, each a different crop of
                         the same plate (reference technique 13: reframe the
                         same person at a different size between consecutive
                         cuts, wf-apple 39s to 52s)
  splits                 a seam ratio from `split_screen.seam_ratios` crossed
                         with a bottom panel source. Moving the seam is itself a
                         framing change (technique 2, dod-blender 0.62 -> 0.37),
                         and the bottom panel may carry a supplied product still
                         instead of the listener while the top stays on the
                         speaker (technique 3, dod-blender 6-11s and 15-19s).
  payoff                 one full-frame single on the payoff beat, with the
                         split dropped (technique 4, dod-blender at 19s). Only
                         applied when the piece is split somewhere earlier,
                         because a single reads as emphasis only against a
                         split.

Framings are assigned least-used-first, so the usage histogram flattens and the
biggest-framing share falls out of the construction rather than being hoped for.
Two consecutive cuts never share a framing. `gates.gate_framing_variety`
measures both numbers FROM THIS PLAN and fails outside the reference band,
before anything renders.

Usage: plan_cuts.py --config config.json --run-dir <run>
"""
from __future__ import annotations

import argparse
import json
import pathlib
import sys as _sys, pathlib as _pl
_sys.path.insert(0, str(_pl.Path(__file__).resolve().parent))
import config_io  # noqa: E402

FULL_FRAME = {"x": 0.0, "y": 0.0, "w": 1.0, "h": 1.0}


def split_window(beat: dict, cfg: dict, idx: int, prev_split: int) -> bool:
    """Is this beat allowed to carry a split at all?

    Factored out of `eligible` because the pattern ORDER needs it too. A beat
    inside the window prefers a split-carrying pattern, which is what
    `auto_every` has always read as and did not previously do: the cursor
    usually reached a non-split pattern first, so the demo plan produced one
    split in fifteen beats and the seam and bottom-panel machinery below was
    never exercised.
    """
    ss = cfg["edit"]["split_screen"]
    if not ss.get("enabled", False):
        return False
    every = int(ss.get("auto_every", 0))
    if not (beat["split"] or (every > 0 and idx % every == 0)):
        return False
    if prev_split >= int(ss.get("max_consecutive", 1)):
        return False
    if beat["dur_sec"] < float(ss.get("min_beat_sec", 0.8)):
        return False
    return True


def eligible(pat: dict, beat: dict, cfg: dict, idx: int, ins_left: int,
             prev_split: int) -> bool:
    segs = pat["segments"]
    mc = cfg["edit"]["multicut"]
    ins = cfg["edit"].get("inserts", {})
    dur = beat["dur_sec"]
    min_cut = float(mc.get("min_cut_sec", 0.55))
    max_cut = float(mc.get("max_cut_sec", 1.8))

    if not mc.get("enabled", True) and len(segs) > 1:
        return False
    if "split" in segs and not split_window(beat, cfg, idx, prev_split):
        return False
    if "insert" in segs:
        if not ins.get("enabled", False) or ins_left <= 0:
            return False
    # geometry: every segment must clear the floor and the ceiling
    if len(segs) * min_cut > dur + 1e-9:
        return False
    wts = pat["weights"]
    if max(w * dur for w in wts) > max_cut + 1e-9:
        return False
    if min(w * dur for w in wts) < min_cut - 1e-9:
        return False
    return True


def listener_of(who: str, hosts: list[str]) -> str:
    return hosts[1] if who == hosts[0] else hosts[0]


def nearest_clip(beats: list[dict], i: int, who: str) -> int | None:
    """Beat index whose clip shows `who`, nearest to beat i. Used as the
    listener's picture source so the reaction has real motion instead of a
    held frame."""
    best, bd = None, 10**9
    for j, b in enumerate(beats):
        if b["who"] != who:
            continue
        d = abs(j - i)
        if d < bd or (d == bd and j < (best if best is not None else 10**9)):
            best, bd = j, d
    return best


# --------------------------------------------------------------------- payoff
def payoff_pattern(dur: float, mc: dict) -> dict | None:
    """One full-frame single on the payoff beat, geometry permitting.

    A whole beat as one shot can breach `max_cut_sec`, and the cut-plan ceiling
    gate would rightly fail it. So when the beat is longer than the ceiling the
    payoff becomes the SECOND of two speaker segments: still a full-frame
    single, still no split, and the emphasis lands at the end of the line where
    it belongs. Returns None when the beat cannot carry it at all.
    """
    min_c = float(mc.get("min_cut_sec", 0.55))
    max_c = float(mc.get("max_cut_sec", 1.8))
    if dur <= max_c + 1e-9:
        return {"id": "P", "segments": ["speaker"], "weights": [1.0],
                "payoff_idx": 1}
    tail = min(max_c, dur - min_c)
    if tail < min_c - 1e-9:
        return None
    head = dur - tail
    return {"id": "P2", "segments": ["speaker", "speaker"],
            "weights": [round(head / dur, 9), round(tail / dur, 9)],
            "payoff_idx": 2}


# -------------------------------------------------------------------- framing
def framing_options(cut: dict, cfg: dict) -> list[dict]:
    """Every framing this cut could legally take, in a fixed order.

    A framing id is what `gate_framing_variety` counts, so two options must
    share an id only when they would genuinely look the same. A different crop
    of the same plate is a different picture; so is a different seam ratio; so
    is a different bottom panel.
    """
    fr = cfg["edit"].get("framing", {})
    crops = fr.get("crops", {})

    if cut["mode"] == "split":
        ss = cfg["edit"]["split_screen"]
        seams = [float(s) for s in ss.get("seam_ratios", [0.62])]
        bottoms = list(ss.get("bottom_sources", ["listener"]))
        opts = []
        for s in seams:
            for bt in bottoms:
                if bt == "listener" and cut.get("listener_clip_beat") is None:
                    continue       # no second host clip to put down there
                # The speaker belongs IN the label. Two consecutive splits
                # with different hosts on top are two completely different
                # pictures, but both used to read as "split:0.50:listener",
                # so the no-repeat gate called a legitimate swap a freeze and
                # the variety count was short by one framing per host.
                spk = cut.get("show") or cut.get("speaker") or "?"
                opts.append({"framing": f"split:{spk}:{s:.2f}:{bt}",
                             "seam": s, "bottom": bt,
                             "crop": dict(crops.get("wide", FULL_FRAME))})
        if not opts:
            opts = [{"framing": f"split:{cut.get('show') or cut.get('speaker') or '?'}"
                                f":0.62:listener", "seam": 0.62,
                     "bottom": "listener", "crop": dict(FULL_FRAME)}]
        return opts

    if cut["mode"] == "insert":
        return [{"framing": f"insert:{cut['insert_idx']}",
                 "crop": dict(crops.get("wide", FULL_FRAME))}]

    who = cut.get("show") or cut.get("speaker")
    sizes = [s for s in fr.get("sizes", ["wide"]) if s in crops] or ["wide"]
    return [{"framing": f"{who}:{sz}", "size": sz,
             "crop": dict(crops.get(sz, FULL_FRAME))} for sz in sizes]


def _pick(cands: list[dict], use: dict, seed: int, ordinal: int) -> dict:
    """Least-used framing wins. The tie-break is a seeded rotation so a tie
    does not always resolve to the first option, and it is arithmetic on the
    seed rather than an RNG so the plan stays reproducible."""
    return min(
        enumerate(cands),
        key=lambda t: (use.get(t[1]["framing"], 0),
                       (seed * 31 + ordinal * 7 + t[0] * 13) % 997, t[0]),
    )[1]


def assign_framings(cuts: list[dict], cfg: dict, seed: int) -> None:
    """Give every cut a framing, in place.

    Two rules, both from the reference set: no two consecutive cuts share a
    framing, and the usage histogram is kept flat by always spending the
    least-used option first. The flat histogram is what holds the
    biggest-framing share under the 17% ceiling without tuning.
    """
    use: dict[str, int] = {}
    picks: list[dict] = []

    for i, c in enumerate(cuts):
        opts = framing_options(c, cfg)
        if c.get("payoff"):
            full = [o for o in opts if o["framing"].endswith(":wide")]
            opts = full or opts          # the payoff is full frame or nothing

        prev = picks[i - 1]["framing"] if i else None

        # A forced single-option cut (the payoff) can collide with what the
        # previous cut already took. The previous cut is the flexible one, so
        # move IT rather than giving up the no-repeat rule.
        if i and all(o["framing"] == prev for o in opts):
            pprev = picks[i - 2]["framing"] if i >= 2 else None
            alts = [o for o in framing_options(cuts[i - 1], cfg)
                    if o["framing"] not in (prev, pprev)]
            if alts:
                use[prev] -= 1
                alt = _pick(alts, use, seed, i - 1)
                picks[i - 1] = alt
                use[alt["framing"]] = use.get(alt["framing"], 0) + 1
                _apply(cuts[i - 1], alt)
                prev = alt["framing"]

        cands = [o for o in opts if o["framing"] != prev] or opts
        chosen = _pick(cands, use, seed, i)
        picks.append(chosen)
        use[chosen["framing"]] = use.get(chosen["framing"], 0) + 1
        _apply(c, chosen)


def _apply(cut: dict, opt: dict) -> None:
    cut["framing"] = opt["framing"]
    cut["crop"] = opt["crop"]
    if "size" in opt:
        cut["framing_size"] = opt["size"]
    if cut["mode"] == "split":
        cut["seam"] = opt["seam"]
        cut["bottom"] = opt["bottom"]
        if opt["bottom"] != "listener":
            # the lower panel is not a host any more, so stop claiming one;
            # gates.gate_cutplan reads these two fields to decide whether the
            # two-distinct-hosts rule applies to this cut
            cut["listener"] = None
            cut["listener_clip_beat"] = None


def framing_stats(cuts: list[dict], total_sec: float) -> dict:
    use: dict[str, int] = {}
    for c in cuts:
        use[c.get("framing", "?")] = use.get(c.get("framing", "?"), 0) + 1
    big = max(use.items(), key=lambda kv: (kv[1], kv[0]))
    return {
        "n_framings": len(use),
        "total_sec": round(total_sec, 3),
        "per_10s": round(len(use) / total_sec * 10, 3) if total_sec > 0 else 0.0,
        "biggest": big[0],
        "biggest_count": big[1],
        "biggest_share": round(big[1] / len(cuts), 4),
        "use": dict(sorted(use.items())),
    }


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--config", required=True)
    config_io.add_arg(ap)
    ap.add_argument("--run-dir", required=True)
    a = ap.parse_args()

    cfg = config_io.load(a.config, a.preset)
    run = pathlib.Path(a.run_dir)
    bj = json.loads((run / "beats.json").read_text(encoding="utf-8"))
    beats = bj["beats"]
    hosts = list(cfg["hosts"].keys())

    ed = cfg["edit"]
    pats = ed["cut_patterns"]
    seed = int(ed.get("seed", 0))
    cursor = seed % len(pats)
    ins_left = int(ed.get("inserts", {}).get("count", 0)) \
        if ed.get("inserts", {}).get("enabled") else 0

    # which beat carries the payoff single: the script's marker if it set one,
    # otherwise the last beat
    pf = ed.get("payoff_single", {})
    payoff_beat = None
    if pf.get("enabled", True) and beats:
        marked = [b["n"] for b in beats if b.get("payoff")]
        payoff_beat = marked[-1] if marked else beats[-1]["n"]

    cuts: list[dict] = []
    t = 0.0
    prev_pat = None
    prev_split = 0
    used = {}
    n_split = 0
    prev_single_who = None
    split_by_who: dict[str, int] = {}
    ss_plan = cfg["edit"].get("split_screen", {})

    for i, b in enumerate(beats):
        dur = b["dur_sec"]
        who = b["who"]
        other = listener_of(who, hosts)

        chosen = None
        # --- the payoff beat drops the split, but only against a split that
        #     actually happened earlier; otherwise there is nothing to contrast
        if payoff_beat is not None and b["n"] == payoff_beat and n_split > 0:
            chosen = payoff_pattern(dur, ed["multicut"])

        # --- otherwise pick a pattern: first eligible from the cursor,
        #     skipping a repeat
        if chosen is None:
            order = [pats[(cursor + k) % len(pats)] for k in range(len(pats))]
            # The beat BEFORE the payoff wants a split, because the payoff is a
            # full-frame single and a single only reads as emphasis when the
            # thing before it was not one. Left to chance they can both come
            # out as the same framing on the same host, which the render then
            # shows as a freeze across the cut rather than a cut.
            before_payoff = (payoff_beat is not None
                             and i + 1 < len(beats)
                             and beats[i + 1]["n"] == payoff_beat)
            # The same host speaking twice in a row, both as plain singles,
            # is the SAME PICTURE either side of a cut: the viewer sees a
            # freeze, not an edit. With one framing available there is no
            # other single to reach for, so the split is the way out.
            same_as_prev = (prev_single_who is not None
                            and b["who"] == prev_single_who)
            # Speakers alternate A/B/A/B and the planner alternates
            # split/single, so the two lock in phase and ONE host ends up in
            # every split while the other is in none. Coppice came out 7 of 7
            # splits on A and 7 of 7 singles on B: B was the listener in the
            # lower panel every single time and never once the speaker in a
            # split. Prefer a split for whichever host is behind on them.
            behind = (split_by_who.get(b["who"], 0)
                      < split_by_who.get(other, 0))
            # A ceiling on how much of the episode is split. Balancing the
            # splits across the two hosts adds alternation, and alternation is
            # picture change: one brand went from 5.38 to 6.15 detected cuts
            # per 10s, past the 5.74 the nine real clips top out at. This caps
            # the share without touching the balance -- the `behind` rule
            # still decides WHICH host gets the splits that remain.
            share = float(ss_plan.get("target_share", 1.0))
            at_cap = n_split >= max(1, int(round(share * len(beats))))
            # inside the split window, a split-carrying pattern goes first
            if ((before_payoff or same_as_prev or behind) and not at_cap
                    or split_window(b, cfg, i, prev_split)):
                order = [p for p in order if "split" in p["segments"]] + \
                        [p for p in order if "split" not in p["segments"]]
            if at_cap and not (before_payoff or same_as_prev):
                order = [p for p in order if "split" not in p["segments"]] or order
            for p in order:
                if not eligible(p, b, cfg, i, ins_left, prev_split):
                    continue
                # Normally a pattern does not run twice in a row. But when
                # the alternative is two identical singles either side of a
                # cut -- the same host, the same framing, which the viewer
                # reads as a freeze -- repeating the split is the lesser
                # fault, and the reference that splits throughout does exactly
                # that. The payoff beat is forced to a full-frame single, so
                # the beat before it is the common case.
                if (p["id"] == prev_pat
                        and not (before_payoff or same_as_prev or behind)
                        and any(q["id"] != prev_pat and
                                eligible(q, b, cfg, i, ins_left, prev_split)
                                for q in order)):
                    continue
                chosen = p
                break
        if chosen is None:
            chosen = {"id": "A", "segments": ["speaker"], "weights": [1.0]}
        cursor = (cursor + 1) % len(pats)
        used[chosen["id"]] = used.get(chosen["id"], 0) + 1
        prev_split = prev_split + 1 if "split" in chosen["segments"] else 0
        if "split" in chosen["segments"]:
            split_by_who[who] = split_by_who.get(who, 0) + 1
        prev_single_who = (None if "split" in chosen["segments"]
                           else b["who"])
        prev_pat = chosen["id"]
        n_split += chosen["segments"].count("split")

        # --- lay the segments across the beat, exactly filling it
        segs, wts = chosen["segments"], chosen["weights"]
        raw = [dur * w for w in wts]
        # absorb float drift into the last segment so the beat tiles exactly
        raw[-1] = round(dur - sum(raw[:-1]), 6)
        lst = nearest_clip(beats, i, other)
        pay_idx = chosen.get("payoff_idx")

        off = 0.0
        for k, (kind, seglen) in enumerate(zip(segs, raw)):
            cut = {
                "beat": b["n"], "idx": k + 1, "pattern": chosen["id"],
                "start": round(t + off, 6), "end": round(t + off + seglen, 6),
                "speaker": who,
                # where in the beat's own clip this window sits
                "src_start": round(off, 6), "src_end": round(off + seglen, 6),
            }
            if pay_idx == k + 1:
                cut["payoff"] = True
            if kind == "speaker":
                cut.update(mode="single", source="clip", show=who,
                           still=b["still"], clip_beat=b["n"])
            elif kind == "listener":
                if lst is None:
                    cut.update(mode="reaction", source="still", show=other,
                               still=None)
                else:
                    lb = beats[lst]
                    # seeded sample point inside the listener's clip, kept a
                    # safe distance from its own edges
                    pick = ((seed + b["n"] * 7 + k) % 5) / 6.0 + 0.08
                    ls = round(min(max(0.0, lb["dur_sec"] - seglen),
                                   pick * lb["dur_sec"]), 6)
                    cut.update(mode="reaction", source="clip_muted",
                               show=other, still=lb["still"],
                               clip_beat=lb["n"],
                               src_start=ls, src_end=round(ls + seglen, 6))
            elif kind == "insert":
                ins_left -= 1
                cut.update(mode="insert", source="insert", show="insert",
                           still=None, insert_idx=int(
                               ed["inserts"]["count"]) - ins_left)
            elif kind == "split":
                cut.update(mode="split", source="clip", show=who,
                           listener=other, still=b["still"], clip_beat=b["n"],
                           listener_clip_beat=(beats[lst]["n"] if lst is not None
                                               else None),
                           layout=cfg["edit"]["split_screen"].get(
                               "layout", "vstack"))
            cuts.append(cut)
            off += seglen
        t += dur

    # --- the second dimension, assigned over the finished cut list so the
    #     no-repeat rule can see both neighbours
    assign_framings(cuts, cfg, seed)

    end_card = float(cfg["end_card"].get("duration_sec", 2.5))
    stats = framing_stats(cuts, t + end_card)

    plan = {
        "seed": seed,
        "estimated_durations": bj["estimated"],
        "dialogue_sec": round(t, 3),
        "end_card_sec": end_card,
        "n_beats": len(beats),
        "n_cuts": len(cuts),
        "avg_cut_sec": round(t / max(1, len(cuts)), 3),
        "pattern_use": used,
        "inserts_planned": int(ed.get("inserts", {}).get("count", 0)) - ins_left,
        "framing_stats": stats,
        "cuts": cuts,
    }
    p = run / "cutplan.json"
    p.write_text(json.dumps(plan, indent=2), encoding="utf-8")
    print(f"[cuts] {len(beats)} beats -> {len(cuts)} cuts, "
          f"avg {plan['avg_cut_sec']:.2f}s, dialogue {t:.2f}s")
    print(f"[cuts] patterns: " +
          ", ".join(f"{k}x{v}" for k, v in sorted(used.items())))
    bands = ed.get("framing", {}).get("bands", {})
    print(f"[cuts] framings: {stats['n_framings']} distinct over "
          f"{stats['total_sec']:.2f}s = {stats['per_10s']:.2f} per 10s "
          f"(reference band {bands.get('per_10s_min', '?')} to "
          f"{bands.get('per_10s_max', '?')})")
    print(f"[cuts] biggest framing {stats['biggest']} is "
          f"{stats['biggest_count']}/{len(cuts)} cuts = "
          f"{stats['biggest_share'] * 100:.1f}% "
          f"(reference ceiling {float(bands.get('max_share', 0)) * 100:.0f}%)")
    print(f"[cuts] -> {p}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

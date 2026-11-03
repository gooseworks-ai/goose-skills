#!/usr/bin/env python3
"""Score a finished episode against the nine real reference clips.

    grade_episode.py --master <run>/master.mp4 [--json]

WHY THIS EXISTS, AND WHAT IT IS NOT
The 21 gates answer "is this broken". They are pass/fail and they are mostly
about correctness: did two captions land on one frame, does the voice match the
host, did the picture drift. None of them answers "is this any good", and the
one thing a person keeps catching by eye is pace.

So this is the other half: four numbers measured on the RENDER and compared
with the same four measured on the nine real clips in
`projects/goose-video-qa/podcast-refs/`. It is a scorecard, not a gate. It does
not block anything and it is not run by `gates.py`.

WHY THE BANDS ARE WIDE, AND WHY THAT IS HONEST
They are the observed min and max across nine real clips, not a target someone
invented. Real podcast clips genuinely disagree: one is a live theatre piece in
a dark room and another is a lit studio, so mean luma runs from 55 to 141. A
narrow band would be a preference dressed up as a measurement. Being inside the
band means "a real podcast does this". The distance from the median is printed
separately, because sitting at the very edge of what nine clips do is worth
knowing even when it passes.

DERIVED 2026-10-02, from all nine clips:

    cuts per 10s     2.35 ..   5.74   median   3.39
    median shot      1.33 ..   3.93   median   2.00
    mean luma       55.40 .. 140.60   median 101.35
    % above 150      2.39 ..  50.50   median  23.93

Re-derive with the block at the bottom of this file if the reference set
changes. Do not hand-edit the numbers.

ONE THING TO READ CAREFULLY: cuts_per_10s IS WHAT THE DETECTOR SEES
It counts scene changes ffmpeg finds in the finished file, which is exactly how
the same number was measured on the nine references, so the comparison is
like for like. It is NOT the plan's cut count. The shipped demo plans 17 cuts
over 31.8s, which is 5.35 per 10s, and the detector finds 3.46, because a cut
between two framings of the same host is not a scene change anyone can see.

That gap is the point. The viewer sees what the detector sees. When the dynamic
layer was running at 8.5 detected cuts per 10s it was above all nine references
on the measure that corresponds to what a person notices.

WHAT THIS CANNOT SEE
Whether the faces read as real. Whether the script is worth hearing. Whether
the room suits the brand. Whether anyone would watch it. Every one of those has
been caught by a person and never by a measurement, and three times in this
format's history a number said one thing and the picture said another. Watch it
end to end. This scorecard is the floor, not the verdict.
"""
from __future__ import annotations

import argparse
import json
import pathlib
import re
import statistics
import subprocess
import sys

# min, median, max over the nine real clips. See the module docstring.
BANDS = {
    "cuts_per_10s":  (2.35, 3.39, 5.74),
    "median_shot_s": (1.33, 2.00, 3.93),
    "mean_luma":     (55.40, 101.35, 140.60),
    "pct_above_150": (2.39, 23.93, 50.50),
    # Derived from the FOUR references the gap detector can read, not all nine.
    # The other five returned 0.0% silence, which is false: they carry music or
    # room tone, so nothing in them ever drops 18dB under their own mean. Same
    # rule as `shots()` -- a measure the detector cannot see is not a zero.
    "pct_quiet":     (2.19, 3.32, 5.48),
}


def _changes(master: pathlib.Path, thresh: float):
    r = subprocess.run(["ffmpeg", "-v", "error", "-i", str(master), "-vf",
                        f"select='gt(scene,{thresh})',metadata=print:file=-",
                        "-fps_mode", "vfr", "-f", "null", "-"],
                       capture_output=True, text=True)
    return [float(l.split("pts_time:")[1].split()[0])
            for l in r.stdout.splitlines() if "pts_time:" in l]


def shots(master: pathlib.Path, dur: float):
    """Shot lengths, or None when the detector cannot see this render's cuts.

    The 0.30 threshold is the one the nine references were measured at, so it
    is the right one for a like-for-like comparison. It is NOT reliable on a
    low-contrast render: a dark-room episode where both hosts sit against the
    same unlit background in dark clothes returned ZERO changes at 0.30 and
    TEN at 0.20, while a person watching sees it alternate throughout. Scored
    naively that came out as 0.31 cuts per 10s and a 32 second median shot,
    which is a false failure on a real piece.

    So the count is cross-checked against a looser threshold. If 0.30 finds
    less than half of what 0.15 finds, the pace measures are not readable on
    this render and are reported as such rather than scored.
    """
    strict, loose = _changes(master, 0.30), _changes(master, 0.15)
    if len(loose) >= 4 and len(strict) < len(loose) / 2:
        return None
    ts = [0.0] + strict + [dur]
    return [b - a for a, b in zip(ts, ts[1:]) if b - a > 0.05]


def quiet(master: pathlib.Path, dur: float, rel_db=18.0, mind=0.25):
    """Share of the running time that is silence, judged at this file's level.

    The threshold has to be RELATIVE. At a fixed -32dB five of the nine real
    references read as 0.0% silent, because a room recording never drops that
    far, while a clean synthetic file sits at digital silence between every
    phrase. The two were not being measured the same way at all.

    Relative fixes the arithmetic but not the underlying difference: our audio
    IS silent between phrases and a real podcast's is not. Read this measure as
    directional, not as a target to hit.
    """
    info = subprocess.run(["ffmpeg", "-v", "info", "-i", str(master), "-af",
                           "volumedetect", "-f", "null", "-"],
                          capture_output=True, text=True).stderr
    m = re.search(r"mean_volume: (-?[\d.]+) dB", info)
    if not m:
        return None
    th = float(m.group(1)) - rel_db
    out = subprocess.run(["ffmpeg", "-v", "info", "-i", str(master), "-af",
                          f"silencedetect=noise={th:.1f}dB:d={mind}",
                          "-f", "null", "-"], capture_output=True, text=True).stderr
    runs = [float(x) for x in re.findall(r"silence_duration: ([\d.]+)", out)]
    return sum(runs) / dur * 100 if dur else None


def exposure(master: pathlib.Path, dur: float, w=320, h=568):
    out = []
    for f in (0.2, 0.4, 0.6, 0.8):
        raw = subprocess.run(["ffmpeg", "-v", "error", "-ss", f"{dur * f:.3f}",
                              "-i", str(master), "-frames:v", "1", "-vf",
                              f"scale={w}:{h},format=gray", "-f", "rawvideo", "-"],
                             capture_output=True).stdout
        if len(raw) < w * h:
            continue
        g = list(raw[:w * h])
        out.append((sum(g) / len(g), sum(1 for v in g if v > 150) / len(g) * 100))
    if not out:
        return None, None
    return (statistics.median(x[0] for x in out),
            statistics.median(x[1] for x in out))


def background_gap(run: pathlib.Path, cfg: dict) -> float | None:
    """How far apart the two hosts' backgrounds look, above the shoulders.

    Both singles are cropped from ONE plate, so they are the same room by
    construction. The question is whether they READ as it: two crops from
    opposite ends of a wide two-shot gave each host a different wall, and a
    viewer asked for them to match. Measured 19.5, 46.5 and 26.2 between the
    three pairs before the plate was reshot against one continuous backdrop.

    READ THIS BEFORE BELIEVING THE NUMBER. It compares the mean colour of the
    top third of each single, so it measures wall CONTENT, not room identity.
    One brand measured 40.3 while being visibly one continuous pinboard,
    because one host had dense white paper where the other had bare cork. It is
    reported as a score and must never be a gate: as a gate it would have
    failed a correct plate.

    Under about 12 the two read as one room. Over about 25, look at the plate.
    In between, look anyway.
    """
    ch = cfg.get("characters") or {}
    bases = {b.get("who"): b.get("file") for b in (ch.get("bases") or [])
             if isinstance(b, dict)}
    files = [run / "stills" / f for f in bases.values() if f]
    if len(files) != 2 or not all(f.exists() for f in files):
        return None
    means = []
    for f in files:
        raw = subprocess.run(
            ["ffmpeg", "-v", "error", "-i", str(f), "-vf",
             "crop=iw:ih/3:0:0,scale=64:64,format=rgb24",
             "-frames:v", "1", "-f", "rawvideo", "-"],
            capture_output=True).stdout
        if len(raw) < 64 * 64 * 3:
            return None
        px = [raw[i:i + 3] for i in range(0, 64 * 64 * 3, 3)]
        means.append([sum(c[k] for c in px) / len(px) for k in range(3)])
    return sum(abs(a - b) for a, b in zip(*means)) / 3


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--master", required=True)
    ap.add_argument("--json", action="store_true")
    a = ap.parse_args()

    m = pathlib.Path(a.master)
    if not m.exists():
        sys.exit(f"[err] no master at {m}")
    if m.name.endswith("-preview.mp4"):
        sys.exit("[err] that is the $0 preview. Score the real render.")

    dur = float(subprocess.run(
        ["ffprobe", "-v", "error", "-show_entries", "format=duration",
         "-of", "csv=p=0", str(m)], capture_output=True, text=True
    ).stdout.strip() or 0)
    if dur <= 0:
        sys.exit(f"[err] could not read a duration from {m}")

    sh = shots(m, dur)
    unreadable = sh is None
    mean, bright = exposure(m, dur)
    q = quiet(m, dur)
    got = {
        "cuts_per_10s": len(sh) / dur * 10 if sh else 0.0,
        "median_shot_s": statistics.median(sh) if sh else 0.0,
        "mean_luma": mean or 0.0,
        "pct_above_150": bright or 0.0,
        "pct_quiet": q or 0.0,
    }

    rows, failed = [], 0
    PACE = ("cuts_per_10s", "median_shot_s")
    for k, v in got.items():
        if unreadable and k in PACE:
            rows.append((k, None, *BANDS[k], None, 0.0))
            continue
        lo, md, hi = BANDS[k]
        ok = lo <= v <= hi
        if not ok:
            failed += 1
        # how far from the middle of what nine real clips do
        half = max(md - lo, hi - md) or 1.0
        rows.append((k, v, lo, md, hi, ok, abs(v - md) / half))

    if a.json:
        print(json.dumps({"master": str(m), "duration_sec": round(dur, 3),
                          "values": {k: round(v, 3) for k, v in got.items()},
                          "bands": BANDS,
                          "fails": failed}, indent=1))
        return 1 if failed else 0

    print(f"\n  {m.name}  {dur:.2f}s\n")
    print(f"  {'measure':16} {'this':>8} {'real min':>9} {'median':>8} "
          f"{'real max':>9}   {'':4} from median")
    for k, v, lo, md, hi, ok, dist in rows:
        if ok is None:
            print(f"  {k:16} {'n/a':>8} {lo:9.2f} {md:8.2f} {hi:9.2f}   "
                  f"NOT ASSESSED")
            continue
        mark = "ok  " if ok else "OUT "
        edge = "" if dist < 0.6 else ("  (near the edge)" if ok else "")
        print(f"  {k:16} {v:8.2f} {lo:9.2f} {md:8.2f} {hi:9.2f}   {mark} "
              f"{dist:4.2f}{edge}")
    if unreadable:
        print()
        print("  pace NOT ASSESSED: the scene detector cannot see this render's")
        print("  cuts at the threshold the references were measured at. That is")
        print("  what a low-contrast room does, and it is not evidence the cuts")
        print("  are missing. Count them by eye, or light the room.")
    print()
    if failed:
        print(f"  {failed} measure(s) outside what any of the nine real clips do.")
    else:
        print("  every measure sits inside the range of the nine real clips.")
    cfg_p = m.parent / "config.json"
    if cfg_p.exists():
        try:
            gap = background_gap(m.parent, json.loads(
                cfg_p.read_text(encoding="utf-8")))
        except (ValueError, OSError):
            gap = None
        if gap is not None:
            verdict = ("the two read as one room" if gap < 12 else
                       "look at the plate" if gap > 25 else "borderline, look")
            print(f"  {'background_gap':16} {gap:8.2f}   not banded        "
                  f"{verdict}")
            print("  background_gap is NOT a band and NOT a gate: it reads wall")
            print("  CONTENT, not room identity. One brand measured 40.3 while")
            print("  being visibly one continuous pinboard. Trust the picture.")

    print()
    print("  NOT ASSESSED, and a person has to: do the faces read as real, is")
    print("  the script worth hearing, does the room suit the brand, would")
    print("  anyone watch it. Watch it end to end before calling it done.")
    return 1 if failed else 0


# ---------------------------------------------------------------------------
# Re-derive the bands. Run this, do not hand-edit BANDS.
#
#   python - <<'EOF'
#   import glob, statistics, subprocess, pathlib, sys
#   sys.path.insert(0, "scripts"); import grade_episode as G
#   rows = []
#   for p in sorted(glob.glob("projects/goose-video-qa/podcast-refs/*.mp4")):
#       d = float(subprocess.run(["ffprobe","-v","error","-show_entries",
#           "format=duration","-of","csv=p=0",p],
#           capture_output=True,text=True).stdout.strip() or 0)
#       sh = G.shots(pathlib.Path(p), d); mn, br = G.exposure(pathlib.Path(p), d)
#       rows.append((len(sh)/d*10, statistics.median(sh), mn, br))
#   for i, k in enumerate(G.BANDS):
#       v = [r[i] for r in rows]
#       print(k, round(min(v),2), round(statistics.median(v),2), round(max(v),2))
#   EOF
# ---------------------------------------------------------------------------

if __name__ == "__main__":
    raise SystemExit(main())

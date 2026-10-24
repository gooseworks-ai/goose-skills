#!/usr/bin/env python3
"""Trim the dead air off every voiceover beat, and add any declared pause. Free.

    shape_vo.py --config config.json --run-dir <run> [--probe]

WHY THIS EXISTS, AND WHY IT IS THE OPPOSITE OF WHAT IT WAS BUILT FOR
A listener said the hosts were too expressive and that real podcast hosts take
pauses. That is TWO complaints, and only one of them was true of this material.

Expressiveness was `style`: this recipe shipped 0.45 and 0.35 against the
repo's own recommended 0.05. Fixed, and the same listener picked the new take.

Pace was measured and the complaint did not survive it. Nine real podcast
clips in `projects/goose-video-qa/podcast-refs/`, each judged against its OWN
mean level minus 18dB so a clean synthetic file and a room recording are
compared like for like:

    real clips     2.2 .. 5.5 % silence   median gap 0.31s    4.1 .. 8.6 gaps/min
    ours, before  21.8 .. 32.0 %          median gap 0.45s   26.4 .. 33.8 gaps/min

Six times the silence of the quietest real reference, and five times the gaps.
Every beat arrives from ElevenLabs with roughly a quarter second of lead-in and
another of tail, and with one beat per turn that becomes dead air at EVERY
speaker change. The episodes were not short of pauses. They were mostly pause.

A first pass added `...` to the scripts and 0.45 to 0.55s of silence per
thought. Both were wrong: `...` does nothing on `eleven_multilingual_v2`
(25.50s -> 25.17s with three added), and the silence pushed a measure that was
already six times the reference further out. It is recorded in TAKES.md.

WHAT IT DOES NOW
Trims each beat to `vo.trim.lead_sec` / `vo.trim.tail_sec` of air, measured
against that beat's own level, then adds any `vo.pauses` entry on top. A
declared pause is now an EXCEPTION you argue for on one beat, not the default.

IDEMPOTENT
The untouched generation is kept in `voiceovers/raw/` and every run works from
THERE, so running it twice does not trim twice. `--probe` prints what it would
do and changes nothing.
"""
from __future__ import annotations

import argparse
import json
import pathlib
import re
import shutil
import subprocess
import sys

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
import config_io  # noqa: E402

DEFAULT_TRIM = {"lead_sec": 0.08, "tail_sec": 0.14, "rel_db": 18.0}


def dur(p: pathlib.Path) -> float:
    return float(subprocess.run(
        ["ffprobe", "-v", "error", "-show_entries", "format=duration",
         "-of", "csv=p=0", str(p)], capture_output=True, text=True
    ).stdout.strip() or 0)


def speech_span(p: pathlib.Path, rel_db: float):
    """First and last moment this file is above its own noise floor.

    The threshold is relative because a synthetic beat sits near digital
    silence between words while a room recording never does, and a fixed dB
    figure silently measures two different things on the two.
    """
    info = subprocess.run(["ffmpeg", "-v", "info", "-i", str(p), "-af",
                           "volumedetect", "-f", "null", "-"],
                          capture_output=True, text=True).stderr
    m = re.search(r"mean_volume: (-?[\d.]+) dB", info)
    th = (float(m.group(1)) if m else -30.0) - rel_db
    out = subprocess.run(["ffmpeg", "-v", "info", "-i", str(p), "-af",
                          f"silencedetect=noise={th:.1f}dB:d=0.05",
                          "-f", "null", "-"], capture_output=True, text=True).stderr
    d = dur(p)
    starts = [float(x) for x in re.findall(r"silence_start: (-?[\d.]+)", out)]
    ends = [float(x) for x in re.findall(r"silence_end: ([\d.]+)", out)]
    # A trailing run is one whose END is the end of the file. ffmpeg closes it
    # at EOF, so testing `starts[-1] > ends[-1]` finds nothing and silently
    # reports every beat as already tight: the first version of this script
    # trimmed 0.34s across fifteen beats that were carrying 0.33s EACH.
    lead = ends[0] if ends and starts and starts[0] <= 0.02 else 0.0
    tail = (d - starts[-1]) if (starts and ends and ends[-1] >= d - 0.03
                                and starts[-1] > lead) else 0.0
    return d, max(lead, 0.0), max(tail, 0.0)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--config", required=True)
    config_io.add_arg(ap)
    ap.add_argument("--run-dir", required=True)
    ap.add_argument("--probe", action="store_true",
                    help="print what would change and write nothing")
    a = ap.parse_args()

    cfg = config_io.load(a.config, a.preset)
    vo_cfg = cfg.get("vo") or {}
    trim = {**DEFAULT_TRIM, **(vo_cfg.get("trim") or {})}
    pauses = {str(k): float(v) for k, v in (vo_cfg.get("pauses") or {}).items()}

    vo = pathlib.Path(a.run_dir) / "voiceovers"
    man = vo / "manifest.json"
    if not man.exists():
        sys.exit(f"[err] no {man}. Generate the voiceover first.")
    beats = json.loads(man.read_text(encoding="utf-8"))

    raw = vo / "raw"
    raw.mkdir(exist_ok=True)
    for n in beats:
        src, keep = vo / f"beat-{int(n):02d}.mp3", raw / f"beat-{int(n):02d}.mp3"
        if not src.exists():
            sys.exit(f"[err] manifest lists beat {n} but {src.name} is missing")
        if not keep.exists():
            shutil.copy2(src, keep)

    bad = sorted(set(pauses) - set(beats))
    if bad:
        sys.exit(f"[err] vo.pauses names beat(s) {', '.join(bad)}; this script "
                 f"has beats 1 to {len(beats)}.")

    out, cut, added = {}, 0.0, 0.0
    for n in beats:
        src, keep = vo / f"beat-{int(n):02d}.mp3", raw / f"beat-{int(n):02d}.mp3"
        d, lead, tail = speech_span(keep, trim["rel_db"])
        ss = max(lead - trim["lead_sec"], 0.0)
        to = d - max(tail - trim["tail_sec"], 0.0)
        pad = pauses.get(n, 0.0)
        gained = (d - (to - ss))
        cut += gained
        added += pad
        if a.probe:
            print(f"  beat {int(n):>2}  {d:5.2f}s  lead {lead:4.2f} tail {tail:4.2f}"
                  f"  -> trim {gained:4.2f}s" + (f", pause +{pad:.2f}s" if pad else ""))
            out[n] = round(to - ss + pad, 3)
            continue
        af = f"apad=pad_dur={pad}" if pad > 0 else "anull"
        tmp = vo / f"_shape-{int(n):02d}.mp3"
        subprocess.run(["ffmpeg", "-v", "error", "-y", "-ss", f"{ss:.3f}",
                        "-to", f"{to:.3f}", "-i", str(keep), "-af", af, str(tmp)],
                       check=True)
        tmp.replace(src)
        out[n] = round(dur(src), 3)

    total = sum(out.values())
    if a.probe:
        print(f"\n  PROBE ONLY, nothing written. Would remove {cut:.2f}s of air, "
              f"add {added:.2f}s of pause, leaving {total:.2f}s.")
        return 0
    man.write_text(json.dumps(out, indent=1), encoding="utf-8")
    print(f"  {len(beats)} beats shaped: {cut:.2f}s of dead air removed, "
          f"{added:.2f}s of declared pause added, dialogue now {total:.2f}s.")
    print(f"  That is ${cut * 0.15:.2f} of lipsync NOT bought.")
    print("  Re-run plan_beats.py: the manifest changed.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

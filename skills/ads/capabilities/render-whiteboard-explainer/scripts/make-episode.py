#!/usr/bin/env python3
"""Build a whiteboard episode end to end, stopping where a human is actually needed.

    python make-episode.py --project <dir> --beats beats.json            # up to the storyboard
    python make-episode.py --project <dir> --beats beats.json --render   # and the full cut
    python make-episode.py --project <dir> --beats beats.json --yes      # allow the paid calls

Stages, in order. Each is skipped if its output already exists, so a re-run after a beats edit
only redoes what changed:

    1  voice      supplied as an input  (create-vo-elevenlabs + word timings)
    2  plate      gen-art.py --plate   PAID, $0.07     -> art/plate/board.png
    3  prep       prep-plate.py                        -> board-final.png + the quad
    4  art        gen-art.py --art     PAID, $0.07 ea  -> art/line/*.png
    5  trace      trace.py                           -> art/line/paths.json
    6  layout     solve-layout.py                      -> episode.json
    7  still      render.py --still                    -> working/w3-still.png   <-- REVIEW
    8  render     render.py                            -> working/w3.mp4
    9  master     the audio chain                      -> output/<slug>.mp4      <-- REVIEW

THE TWO REVIEWS ARE THE POINT. Stage 7 costs seconds and is where relevance is judged: whether
a mark is about the line it sits under, whether the filler earns its place, whether the payoff
says the closing line. No check can decide any of that, and three of the nine defects caught on
the first build were exactly those. Stage 9 is the finished cut, watched end to end.

Nothing between them needs a person. The layout is solved and asserted, not authored.
"""
import argparse
import json
import subprocess
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[3]


def run(args, label):
    print(f"\n=== {label} ===")
    r = subprocess.run([sys.executable] + [str(a) for a in args])
    if r.returncode:
        sys.exit(f"{label} failed")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--project", required=True, type=Path)
    ap.add_argument("--beats", required=True, type=Path)
    ap.add_argument("--boards", type=int, default=3)
    ap.add_argument("--render", action="store_true", help="go past the storyboard review")
    ap.add_argument("--yes", action="store_true", help="allow the paid calls")
    ap.add_argument("--slug", default=None)
    A = ap.parse_args()
    P = A.project.resolve()
    B = json.loads(A.beats.read_text(encoding="utf-8"))
    slug = A.slug or P.name

    # 1 voice
    missing_vo = [f for f in ("voice/vo.mp3", "voice/words.json") if not (P / f).exists()]
    if missing_vo:
        sys.exit(
            "missing " + ", ".join(missing_vo) + ".\n"
            "The voiceover is the clock: every mark is pinned to a word timing.\n"
            "Generate the audio with the create-vo-elevenlabs capability, which routes\n"
            "through the media proxy so the call is attributed. It returns audio only, so\n"
            "the word-level timings have to come with it - see this skill's Inputs.\n"
            "Do not regenerate the voiceover once the layout is solved: a new read\n"
            "silently moves everything on the board.")
    print("voice: ok")

    # 2 plate
    if not (P / "art" / "plate" / "board.png").exists():
        if not A.yes:
            sys.exit("no board plate. Re-run with --yes to buy one ($0.07), or drop your own "
                     "photo at art/plate/board.png")
        run([HERE / "gen-art.py", "--project", P, "--plate", "--yes"], "plate")
    else:
        print("plate: already there")

    # 3 prep
    if not (P / "art" / "plate" / "board-final.png").exists():
        run([HERE / "prep-plate.py", "--project", P, "--write"], "prep plate")
    else:
        print("prep: already done")

    # 4 art
    need = sorted({b["art"] for b in B["beats"] if b.get("art")})
    missing = [n for n in need if not (P / "art" / "line" / f"{n}.png").exists()]
    if missing:
        if not A.yes:
            sys.exit(f"missing drawings: {', '.join(missing)}. Re-run with --yes "
                     f"(${0.07 * len(missing):.2f})")
        subj = P / "working" / "subjects.json"
        subj.parent.mkdir(parents=True, exist_ok=True)
        allsub = B.get("subjects", {})
        gaps = [n for n in missing if n not in allsub]
        if gaps:
            sys.exit(f"no description in beats.json 'subjects' for: {', '.join(gaps)}")
        subj.write_text(json.dumps({n: allsub[n] for n in missing}, indent=2), encoding="utf-8")
        run([HERE / "gen-art.py", "--project", P, "--art", subj, "--yes"], "drawings")
    else:
        print("drawings: all there")

    # 5 trace
    paths = P / "art" / "line" / "paths.json"
    if not paths.exists() or paths.stat().st_mtime < max(
            (P / "art" / "line" / f"{n}.png").stat().st_mtime for n in need):
        run([HERE / "trace.py", "--project", P / "art"], "trace")
        src = P / "art" / "art" / "paths.json"
        if src.exists():
            paths.write_text(src.read_text(encoding="utf-8"), encoding="utf-8")
    else:
        print("trace: up to date")

    # 6 layout
    run([HERE / "solve-layout.py", "--project", P, "--beats", A.beats,
         "--boards", A.boards, "--write"], "layout")

    # 7 storyboard
    run([HERE / "render.py", "--project", P, "--episode", "episode.json", "--still"],
        "storyboard")
    print(f"\nREVIEW 1: {P / 'working' / 'w3-still.png'}")
    print("  Is every mark ABOUT the line it sits under? Does the payoff say the closing line?")
    if not A.render:
        print("\nStopping here. Re-run with --render once the storyboard is right.")
        return

    # 8 render  9 master
    run([HERE / "render.py", "--project", P, "--episode", "episode.json"], "render")
    run([HERE / "master.py", "--project", P, "--slug", slug], "master")
    print(f"\nREVIEW 2: {P / 'output' / (slug + '.mp4')}  - watch it end to end")


if __name__ == "__main__":
    main()

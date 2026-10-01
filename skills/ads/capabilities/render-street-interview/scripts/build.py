#!/usr/bin/env python3
"""Build a finished street-interview cut with one command. Generation is the only paid step.

    python build.py                 # dry run: prints every stage and what it will cost
    python build.py --yes           # generate, grade, re-cut, gate
    python build.py --yes --seed 4814
    python build.py --from-take working/takes/ld-single-seed4812.mp4   # free, skip generation

WHY THIS FILE EXISTS

Before it, the recipe was six scripts and a person who had to know the right order, the right
flags and the right reference clip. That is not a recipe. Every defect this format has shipped
came from a step being skipped or run with the wrong argument, not from the model:

  * the finishing pass was run with its default --strength 0.8 and colour-matched a take to a
    reference darker than itself, pushing the black point to 16.1 against a real band of 7 to 10
  * the re-cut was a one-off ffmpeg command in a shell, so the ambience fix existed for exactly
    one video and could not be repeated
  * a take was judged on a 1fps contact sheet rather than watched, and shipped with 4.5 seconds
    of invented dialogue in it

So the stages are chained here, in order, with the gate at the end, and the dry run prints the
whole plan before anything is billed.

THE STAGES
  1. single_gen.py       generate one 12s take            PAID, ~$3.64
  2. phone_look_video.py grade to the real-footage bands   free
  3. recut.py            strip dead air, match ambience    free
  4. check-cut.py        the ship gate                     free (Whisper is local)

WHAT THIS CANNOT DO, and you should know before you run it: it cannot tell you whether the take
looks real. The gate measures detail, black point, ambience, safe zone, speech and provenance,
and seed 4813 passed every one of them while rendering visibly soft and plasticky with malformed
hands. A person still has to WATCH the output end to end before it ships. That is not a gap to
be closed later, it is the honest state of this format.
"""
import argparse
import json
import subprocess
import sys
from pathlib import Path

import brandkit
import paths

HERE = Path(__file__).resolve().parent
TAKE_COST = 3.64


def run(cmd, label):
    print(f"\n-- {label}")
    print("   " + " ".join(str(c) for c in cmd))
    r = subprocess.run([sys.executable, *[str(c) for c in cmd]])
    if r.returncode != 0:
        sys.exit(f"FAILED at: {label}")


def main():
    ap = paths.add_run_arg(argparse.ArgumentParser())
    ap.add_argument("--yes", action="store_true", help=f"SPENDS ~${TAKE_COST:.2f} on generation")
    ap.add_argument("--seed", type=int, default=None, help="override the seed in single_gen.py")
    ap.add_argument("--from-take", type=Path, default=None,
                    help="skip generation and finish an existing take; free")
    ap.add_argument("--ref", default="refs/sts.webm",
                    help="real reference for the colour match, relative to the run folder")
    ap.add_argument("--brand", default=None,
                    help="brand slug in brands/ (default liquid-death). Supplies the seed and "
                         "the take's name.")
    a = ap.parse_args()

    L = paths.layout(a.run)
    run_dir = Path(L["run"])
    takes = run_dir / "working" / "takes"
    looks = run_dir / "output" / "looks"
    looks.mkdir(parents=True, exist_ok=True)

    if a.from_take:
        take = a.from_take if a.from_take.is_absolute() else run_dir / a.from_take
        if not take.exists():
            sys.exit(f"no such take: {take}")
        cost = 0.0
    else:
        # The seed and the take's name come from the BRAND CONFIG, via brandkit, which is the
        # one place either lives. This used to grep single_gen.py for a line starting "SEED = ";
        # that constant was removed by the 2026-09-30 format/brand split, so the lookup raised
        # IndexError and the paid path could not start without an explicit --seed.
        cfg = brandkit.load(a.brand)
        seed = a.seed or cfg["generation"]["seed"]
        take = takes / f"{brandkit.take_name(cfg, seed)}.mp4"
        cost = TAKE_COST

    stem = take.stem.replace("ld-single-", "")
    graded = looks / f"street-{stem}-graded.mp4"
    final = looks / f"street-{stem}-final.mp4"

    print(f"run folder   {run_dir}")
    print(f"take         {take.name}   {'(existing, free)' if cost == 0 else f'to generate, ~${cost:.2f}'}")
    print(f"graded       {graded.name}")
    print(f"final        {final.name}")
    print(f"\nTOTAL COST   ${cost:.2f}")
    if not a.yes and cost:
        print("\ndry run. Nothing sent. Re-run with --yes to generate.")
        return
    if not a.yes and not cost:
        print("\ndry run. Re-run with --yes to build from the existing take.")
        return

    if cost:
        cmd = [HERE / "single_gen.py", "--yes"]
        if a.run:
            cmd += ["--run", a.run]
        run(cmd, f"1/4  generate  (PAID ~${cost:.2f})")
        if not take.exists():
            sys.exit(f"generation reported success but {take} does not exist. "
                     "Never trust the exit status here: a shell pipeline reports the LAST "
                     "command's status, and a dropped network mid-poll has already billed you "
                     "(recover with media_proxy.resume_fal(request_id), do not re-fire).")

    # --strength 0 is deliberate and is NOT a default worth changing without measuring: the
    # fitted LUT swings the black point by reference (16.1 against Klemens, 26.6 against Salary
    # Transparent, both outside the 7-10.3 real band). The measured black lift does the work.
    run([HERE / "phone_look_video.py", take, graded, "--ref", run_dir / a.ref, "--strength", "0"],
        "2/4  grade to the real-footage bands  (free)")
    run([HERE / "recut.py", graded, final], "3/4  strip dead air, match ambience  (free)")
    # --render, not --look. --look gates one of the five stored treatments, which is a DIFFERENT
    # file from the one this build just produced; wiring it that way made the gate report on a
    # stale artefact and fail for reasons that had nothing to do with this run.
    #
    # --no-brand-layer, because THIS FILE IS NOT A DELIVERABLE. Nothing in this chain draws a
    # caption, a title or an end card: that is build_looks.py, and it runs from the un-recut
    # take. So the gate's E and F have nothing to measure here, and `--control graded` is the
    # un-recut grade, a different EDIT from the re-cut render. Handed that pair without the
    # flag, F differenced two different edits, flagged every row, and reported "graphics span
    # y=0..1920" -- a failure caused entirely by the wiring. The flag makes the gate say the two
    # checks did not run, and the gate then exits non-zero, which is the honest answer: this
    # path produces a graded, re-cut take and not a finished ad.
    run([HERE / "check-cut.py", "--render", final, "--take", take, "--control", graded,
         "--no-brand-layer", "--allow-unrun"],
        "4/4  ship gate on the re-cut take  (free; E and F cannot run, see below)")

    print(f"\ndone: {final}")
    print("This is a graded, re-cut TAKE, not a finished ad: nothing here drew a caption, a "
          "title or an end card. The brand layer is build_looks.py, and its caption spans are "
          "measured against the take's ORIGINAL timeline, so they do not survive the re-cut -- "
          f"{final.with_suffix('.plan.json').name} records which source span each finished "
          "second came from, which is what a re-timed caption schedule would be derived from.")
    print("NOW WATCH IT END TO END. The gate cannot see a soft or plasticky render: seed 4813 "
          "passed every check and was visibly wrong.")


if __name__ == "__main__":
    main()

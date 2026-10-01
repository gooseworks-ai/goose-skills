#!/usr/bin/env python3
"""Generate the two paid assets a whiteboard explainer needs. DRY RUN BY DEFAULT.

    python gen-art.py --project <dir> --plate                  # price the board plate
    python gen-art.py --project <dir> --plate --yes            # buy it
    python gen-art.py --project <dir> --art subjects.json      # price the drawings
    python gen-art.py --project <dir> --art subjects.json --yes

Two assets, both one-time per brand:

  PLATE     one photograph of a real blank whiteboard in a real room. The ink is multiplied
            onto this, so the board's sheen and the room's light come through the strokes.
            A DRAWN board reads as a drawn board; this is the whole reason the plate exists.
  DRAWINGS  one black line drawing per subject the script names, generated AS LINE ART and
            then traced. Art traced from painterly images carries every contour the photograph
            had and reads as clip-art.

`subjects.json` is `{"<name>": "<what to draw>", ...}`. The first drawing generated becomes the
style reference for the rest, so the line weight matches across the set.

Nothing here runs without `--yes`, because these are the only calls in this recipe that spend.
"""
import argparse
import json
import subprocess
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[3]
GEN = ROOT / "skills" / "atoms" / "image-generation" / "create-image-gpt-image-fal" / \
    "scripts" / "generate.py"

MODEL, QUALITY = "gpt-image-2", "medium"
COST = {"low": 0.02, "medium": 0.07, "high": 0.19}[QUALITY]

# Do NOT over-specify wear. Asking for ghosting and wiped smears returns a grubby grey board;
# ask for a clean one and lift it in code if it needs it.
PLATE_PROMPT = (
    "Handheld phone photo taken standing directly in front of a large blank whiteboard on an "
    "easel in a warm lived-in home studio. The camera faces the board SQUARE ON and level, so "
    "the frame edges are parallel to the picture edges with no tilt. The board fills almost the "
    "whole vertical frame and is cropped by it, with only a narrow band of room down each side. "
    "The writing surface is completely empty of any text, letters or drawings. Slim aluminium "
    "frame, black plastic corner caps, a small maker's badge in one corner. Soft daylight with "
    "one broad window reflection across the upper board. Behind and beside the board a warm "
    "cluttered room strongly out of focus. Realistic amateur snapshot, no people, no hands."
)

# The style every drawing shares. "No text" is not optional: an image model cannot hold a
# letter, and every word on this board is drawn locally instead.
ART_STYLE = (
    "A simple black marker line drawing on a plain white background, in the style of a "
    "whiteboard scribe or graphic recorder. Drawn with a single even fine black line of "
    "constant thickness, confident continuous outlines, gently tapering forms with rounded "
    "ends. Absolutely no shading, no hatching, no fill, no grey, no colour, no texture, no "
    "background, no shadow, no border, no text, no labels, no numbers. Just clean black "
    "outlines on pure white. "
)


def run(dest, prompt, size, ref=None):
    cmd = [sys.executable, str(GEN), "--model", MODEL, "--quality", QUALITY,
           "--image-size", size, "--output", str(dest), "--prompt", prompt]
    if ref and Path(ref).exists():
        cmd += ["--ref-image", str(ref)]
    r = subprocess.run(cmd, capture_output=True, text=True)
    if r.returncode:
        print((r.stderr or r.stdout)[-600:])
    return r.returncode == 0


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--project", required=True, type=Path)
    ap.add_argument("--plate", action="store_true")
    ap.add_argument("--art", type=Path, help="subjects.json")
    ap.add_argument("--yes", action="store_true", help="actually spend")
    A = ap.parse_args()
    P = A.project.resolve()

    jobs = []
    if A.plate:
        jobs.append(("plate", P / "art" / "plate" / "board.png", PLATE_PROMPT, "1080x1920"))
    if A.art:
        subjects = json.loads(A.art.read_text(encoding="utf-8"))
        for name, desc in subjects.items():
            jobs.append((name, P / "art" / "line" / f"{name}.png",
                         ART_STYLE + desc, "1024x1024"))
    if not jobs:
        sys.exit("nothing to do: pass --plate and/or --art subjects.json")

    print(f"{MODEL} {QUALITY}  ${COST:.2f} each")
    for name, dest, _, size in jobs:
        print(f"  {name:12s} {size:10s} -> {dest}")
    print(f"TOTAL ${COST * len(jobs):.2f} for {len(jobs)} image(s)")
    if not A.yes:
        print("\nDRY RUN. Re-run with --yes to spend.")
        return

    ref = None
    for name, dest, prompt, size in jobs:
        dest.parent.mkdir(parents=True, exist_ok=True)
        ok = run(dest, prompt, size, ref)
        print(f"  {name}: {'ok' if ok else 'FAILED'}")
        # the first drawing anchors the style for the rest, so the weight matches
        if ok and ref is None and size == "1024x1024":
            ref = dest
    print("done")


if __name__ == "__main__":
    main()

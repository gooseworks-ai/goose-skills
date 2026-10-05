#!/usr/bin/env python3
"""The three framing views a person has to look at, before any lipsync. Free.

    preview_framing.py --config config.json --run-dir <run>

WHY THIS EXISTS
Three separate framing defects reached a reviewer on this format: the singles
were too zoomed in, a head was cut off at the top in every one of that host's
beats, and the two split panels sat at different heights so one face was
against the top edge while the other had a third of a panel of ceiling.

None of them is detectable. Face detection was tried on these plates and finds
furniture (see `crop_singles.py`), and the one thing that caught all three was
rendering them and looking. So this is not a check, it is a contact sheet: it
builds the three pictures and tells you what to look for in each.

It costs nothing and reads only the stills, so it runs BEFORE the lipsync.
Every defect above was found after the lipsync was paid for.

WHAT IT BUILDS
  framing-singles.png   the two singles side by side, full height
  framing-split.png     the split at the configured per-host panel bias
  framing-full.png      one single filling the 9:16 frame, as a full-frame cut
"""
from __future__ import annotations

import argparse
import pathlib
import subprocess
import sys

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
import config_io  # noqa: E402


def ff(args: list[str]) -> None:
    subprocess.run(["ffmpeg", "-v", "error", "-y", *args], check=True)


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--config", required=True)
    config_io.add_arg(ap)
    ap.add_argument("--run-dir", required=True)
    a = ap.parse_args()

    cfg = config_io.load(a.config, a.preset)
    run = pathlib.Path(a.run_dir)
    out = run / "framing"
    out.mkdir(parents=True, exist_ok=True)

    ch = cfg["characters"]
    bases = {b["who"]: b["file"] for b in ch["bases"]}
    who = sorted(bases)
    if len(who) != 2:
        sys.exit(f"[err] need exactly two hosts, found {who}")
    files = [run / "stills" / bases[w] for w in who]
    for f in files:
        if not f.exists():
            sys.exit(f"[err] {f} is missing. Crop the singles first; this step "
                     f"is free and reads only stills.")

    W, H = cfg["width"], cfg["height"]
    ss = cfg["edit"]["split_screen"]
    gap = int(ss.get("gap_px", 0))
    top_h = int(round((H - gap) * float((ss.get("seam_ratios") or [0.5])[0]) / 2)) * 2
    pbias = ss.get("panel_bias_y") or {}
    bias = float(ss.get("crop_bias_y", 0.25))
    cover = (lambda w, h, b:
             f"scale={w}:{h}:force_original_aspect_ratio=increase,"
             f"crop={w}:{h}:(iw-{w})/2:(ih-{h})*{b}")

    ff(["-i", str(files[0]), "-i", str(files[1]), "-filter_complex",
        "[0:v]scale=420:-1[a];[1:v]scale=420:-1[b];[a][b]hstack",
        str(out / "framing-singles.png")])
    ff(["-i", str(files[0]), "-i", str(files[1]), "-filter_complex",
        f"[0:v]{cover(W, top_h, float(pbias.get(who[0], bias)))}[t];"
        f"[1:v]{cover(W, H - gap - top_h, float(pbias.get(who[1], bias)))}[b];"
        f"[t][b]vstack=2,setsar=1",
        "-frames:v", "1", str(out / "framing-split.png")])
    ff(["-i", str(files[0]), "-vf", f"{cover(W, H, bias)},setsar=1",
        "-frames:v", "1", str(out / "framing-full.png")])

    print(f"  wrote three views to {out}")
    print()
    print("  LOOK AT ALL THREE. None of this is checkable automatically.")
    print(f"  framing-singles  whole head on BOTH, with headroom. The lipsync")
    print(f"                   engine zooms in, so a single that is already")
    print(f"                   tight comes back tighter and loses the crown.")
    print(f"  framing-split    both faces at a SIMILAR height. One shared bias")
    print(f"                   put one face on the top edge and gave the other")
    print(f"                   a third of a panel of ceiling.")
    print(f"  framing-full     not cramped. Too much torso and no room behind")
    print(f"                   reads as zoomed in even when the crop is wide.")
    print()
    print("  All free. Adjust characters.single_crop and")
    print("  edit.split_screen.panel_bias_y and re-run; it costs nothing until")
    print("  the lipsync, and every framing defect on this format was found")
    print("  after that was paid for.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

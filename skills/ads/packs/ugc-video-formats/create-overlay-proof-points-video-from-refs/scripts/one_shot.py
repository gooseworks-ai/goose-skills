#!/usr/bin/env python3
"""End-to-end driver for one "perfect-score + proof-points" ad.

Runs: fetch_icons -> gen_base_clip (PAID) -> build_overlays -> gen_music (PAID) ->
compose_master. Honors the spend gate: with --no-paid it renders overlays + a
silent composite off an EXISTING base clip, so you can preview the design for
free before approving the two paid model calls.

Usage:
  one_shot.py --config config.json --run-dir <run>            # full pipeline (2 paid calls)
  one_shot.py --config config.json --run-dir <run> --no-paid  # overlays + silent composite only
"""
import argparse
import pathlib
import subprocess
import sys

HERE = pathlib.Path(__file__).resolve().parent


def run(script, *a):
    cmd = [sys.executable, str(HERE / script), *a]
    print(f"\n$ {' '.join(cmd)}", flush=True)
    subprocess.run(cmd, check=True)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--config", required=True)
    ap.add_argument("--run-dir", required=True)
    ap.add_argument("--no-paid", action="store_true",
                    help="skip the paid keyframe/i2v + music; composite off an existing clip, silent")
    args = ap.parse_args()
    cfg, rd = args.config, args.run_dir

    run("fetch_icons.py", "--run-dir", rd)

    if not args.no_paid:
        run("gen_base_clip.py", "--config", cfg, "--run-dir", rd)

    run("build_overlays.py", "--config", cfg, "--out-dir", str(pathlib.Path(rd) / "generated" / "overlays"))

    if args.no_paid:
        run("compose_master.py", "--config", cfg, "--run-dir", rd, "--no-music")
    else:
        run("gen_music.py", "--config", cfg, "--run-dir", rd)
        run("compose_master.py", "--config", cfg, "--run-dir", rd)

    print("\n[done] master at <run>/master-final.mp4 — /watch it before shipping.")


if __name__ == "__main__":
    main()

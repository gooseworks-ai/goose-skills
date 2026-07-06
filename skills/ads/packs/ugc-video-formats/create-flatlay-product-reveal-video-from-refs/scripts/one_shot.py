#!/usr/bin/env python3
"""End-to-end driver for one flat-lay product-reveal ad.

Pipeline (per beat, 2 paid model calls):
  gen_flat_covers (PAID) → build_start_frames → gen_beats (PAID Veo) →
  [gen_fd_card (PAID)] → render_endcard → gen_music (PAID) → build_master

The assembly (start frames, endcard render, concat/master) is FREE. `--assemble-only`
skips ALL paid gen and just re-assembles from existing generated/ beats+endcard —
useful to iterate the cut for $0.

Usage:
  one_shot.py --config config.json --run-dir <run>                 # full (paid)
  one_shot.py --config config.json --run-dir <run> --assemble-only # $0 re-cut
"""
import argparse
import pathlib
import subprocess
import sys

HERE = pathlib.Path(__file__).resolve().parent


def step(script, *a):
    cmd = [sys.executable, str(HERE / script), *a]
    print(f"\n$ {' '.join(str(c) for c in cmd)}", flush=True)
    subprocess.run(cmd, check=True)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--config", required=True)
    ap.add_argument("--run-dir", required=True)
    ap.add_argument("--assemble-only", action="store_true",
                    help="skip paid gen; re-assemble master from existing beats/endcard")
    ap.add_argument("--no-music", action="store_true")
    args = ap.parse_args()
    cfg, rd = args.config, args.run_dir
    common = ["--config", cfg, "--run-dir", rd]

    if not args.assemble_only:
        step("gen_flat_covers.py", *common)          # PAID
        step("build_start_frames.py", *common)
        step("gen_beats.py", *common)                # PAID (Veo)
        step("gen_fd_card.py", *common)              # PAID (optional; skips if disabled)
        step("render_endcard.py", *common)
        if not args.no_music:
            step("gen_music.py", *common)            # PAID

    master = ["build_master.py", *common]
    if args.no_music:
        master.append("--no-music")
    step(*master)
    print("\n[done] master at <run>/master-final.mp4 — /watch it before shipping.")


if __name__ == "__main__":
    main()

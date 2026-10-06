#!/usr/bin/env python3
"""Driver. Never spends.

    one_shot.py --config config.json --script script.json --run-dir <run> [--no-paid]

--no-paid  plan -> cut -> overlays -> stand-in composite -> gates.  $0, and the
           result is watchable: the real beat count, the real cadence, the real
           split-screen positions, the real captions in the real safe zone.

default    the same free steps, but it requires the paid artefacts to already be
           on disk and refuses to continue without them. The paid steps are run
           by hand, one at a time, between operator approvals:

    gen_paid.py vo      --config c.json --run-dir <run>            (prints cost)
    gen_paid.py vo      --config c.json --run-dir <run> --confirm --execute
    plan_beats.py ...                       (timeline becomes MEASURED)
    gen_paid.py stills  ...
    gen_paid.py clips   ...
    one_shot.py ...
"""
from __future__ import annotations

import argparse
import pathlib
import subprocess
import sys
import sys as _sys, pathlib as _pl
_sys.path.insert(0, str(_pl.Path(__file__).resolve().parent))
import config_io  # noqa: E402

HERE = pathlib.Path(__file__).resolve().parent


def step(script, *extra):
    print(f"\n[one-shot] {script}", flush=True)
    subprocess.run([sys.executable, str(HERE / script)] + [str(x) for x in extra],
                   check=True)


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--config", required=True)
    config_io.add_arg(ap)
    ap.add_argument("--script", required=True)
    ap.add_argument("--run-dir", required=True)
    ap.add_argument("--no-paid", action="store_true")
    a = ap.parse_args()
    run = pathlib.Path(a.run_dir)
    base = ["--config", a.config, "--run-dir", a.run_dir]

    step("plan_beats.py", *base, "--script", a.script)

    if not a.no_paid:
        missing = [p.name for p in
                   [run / "voiceovers" / "manifest.json"] if not p.exists()]
        clips = run / "clips"
        if not clips.exists() or not any(clips.glob("beat-*.mp4")):
            missing.append("clips/beat-*.mp4")
        if missing:
            raise SystemExit(
                f"[err] missing paid artefacts {missing}. Run the gated paid "
                f"steps (gen_paid.py vo -> plan_beats.py -> gen_paid.py stills "
                f"-> gen_paid.py clips), or pass --no-paid for the $0 preview.")

    step("plan_cuts.py", *base)
    step("build_overlays.py", *base)
    step("compose_master.py", *base, *(["--no-paid"] if a.no_paid else []))
    step("gates.py", "--config", a.config, "--script", a.script,
         "--beats", run / "beats.json", "--cutplan", run / "cutplan.json",
         "--overlays", run / "overlays",
         "--master", run / ("master-preview.mp4" if a.no_paid else "master.mp4"),
         "--recipe", HERE.parent / "recipe.json")
    name = "master-preview.mp4" if a.no_paid else "master.mp4"
    print(f"\n[one-shot] {run / name} -- now watch it end to end, "
          f"then run selftest.py")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

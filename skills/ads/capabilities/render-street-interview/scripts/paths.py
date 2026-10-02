#!/usr/bin/env python3
"""Where the repo is, and where this run's folder is. Imported by every script here.

Why this file exists: every script in this skill was lifted out of
`projects/street-interview/working/`, where `Path(__file__).parents[2]` happened to be the repo
root and `./takes/` happened to be the take folder. Inside
`skills/molecules/create-street-interview-video/scripts/` both of those are wrong -- parents[2]
is `skills/`, and `./takes/` does not exist -- so three of the four scripts crashed on their
own dry run. Never derive the repo root from a fixed number of parents; walk up to the marker.

The run folder follows the repo convention: `projects/<slug>/` with `working/` for
intermediates and `output/` for deliverables. It is resolvable three ways, in order:
  1. `--run <path>` on the script (see `add_run_arg`)
  2. `$STREET_INTERVIEW_RUN`
  3. the default, `projects/street-interview/`
"""
import os
from pathlib import Path

HERE = Path(__file__).resolve().parent
SKILL = HERE.parent

# Markers that exist only at the repo root. `.git` is not usable: a worktree has a .git FILE and
# no projects/, which is the documented reason earlier sessions in this repo produced nothing
# (CLAUDE.md, "Build videos in the main checkout").
# Deliberately NOT SYNC_LEDGER.json or SYNC.md: both went missing from the working tree while
# this skill was being written, because other sessions run in this checkout at the same time.
# A root marker has to be something nobody is editing.
# In goose-skills this is a capability fetched into someone else's project, so the "repo root"
# is THEIR project: the folder you run from, or $STREET_INTERVIEW_ROOT. Brand-asset paths in
# the brand and episode configs (logos, product photos, the end-card sting) resolve against it.
ROOT = Path(os.environ.get("STREET_INTERVIEW_ROOT") or os.getcwd()).expanduser().resolve()
SHARED = HERE   # media_proxy.py ships beside these scripts; no repo-wide helpers are needed
DEFAULT_RUN = ROOT / "projects" / "street-interview"


def run_dir(arg=None) -> Path:
    if arg:
        return Path(arg).expanduser().resolve()
    env = os.environ.get("STREET_INTERVIEW_RUN")
    return Path(env).expanduser().resolve() if env else DEFAULT_RUN


def add_run_arg(ap):
    ap.add_argument("--run", default=None,
                    help="run folder (default projects/street-interview, or "
                         "$STREET_INTERVIEW_RUN). working/ for intermediates, output/ for "
                         "deliverables.")
    return ap


def layout(arg=None):
    """The five paths every script here needs. Nothing is created; callers mkdir what they write."""
    run = run_dir(arg)
    return {
        "run": run,
        "working": run / "working",
        "takes": run / "working" / "takes",
        "graded": run / "working" / "graded",     # caption-free controls for the gate
        "output": run / "output",
        "looks": run / "output" / "looks",
        "refs": run / "refs",
    }

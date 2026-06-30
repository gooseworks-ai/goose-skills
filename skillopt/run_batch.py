#!/usr/bin/env python3
"""
Batch-run the SkillOpt loop over many skills.

For each selected skill it runs the same three steps the README documents
per-skill — generate questions (from the CONTRACT only) → optimize (tutor /
examiner loop) → render the local HTML report — but across a whole category (or
an explicit list, or everything) in one resumable pass.

Design:
  - RESUMABLE: a skill whose outputs/<slug>/best_skill.md already exists is
    skipped unless --force. Questions are reused if present unless --regen.
  - CONTINUE-ON-ERROR: one skill failing never aborts the batch; the error tail
    is captured and the run moves on.
  - All roles use the harness defaults (claude-opus-4-8) unless overridden via
    the usual env vars (GEN_MODEL / OPTIMIZER_MODEL / TARGET_MODEL / JUDGE_MODEL).

Each skill's full stdout/stderr lands in outputs/<slug>/batch.log; a machine
summary lands in outputs/_batch_<selector>.json.

Usage:
  ./skillopt-venv/bin/python skillopt/run_batch.py --category ads
  ./skillopt-venv/bin/python skillopt/run_batch.py --skills ad-angle-miner,brand-research
  ./skillopt-venv/bin/python skillopt/run_batch.py --all
  ./skillopt-venv/bin/python skillopt/run_batch.py --category ads --smoke   # cheap dry pass
  ./skillopt-venv/bin/python skillopt/run_batch.py --category ads --force --regen
"""
from __future__ import annotations

import argparse
import json
import re
import shutil
import subprocess
import sys
import threading
import time
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

HERE = Path(__file__).resolve().parent
ROOT = HERE.parent
SKILLS = ROOT / "skills"
PY = sys.executable  # the venv python that launched us


def slug_of(skill_md: Path) -> str:
    """Slug used by the per-skill scripts: frontmatter name if present, else dir name."""
    m = re.search(r"^name:\s*(.+)$", skill_md.read_text(encoding="utf-8"), re.M)
    name = (m.group(1).strip().strip("'\"") if m else "")
    return name or skill_md.parent.name


def discover(category: str | None, skills_csv: str | None, do_all: bool) -> list[str]:
    if skills_csv:
        return [s.strip() for s in skills_csv.split(",") if s.strip()]
    base = SKILLS / category if category else SKILLS
    if not base.is_dir():
        raise SystemExit(f"No such category dir: {base}")
    slugs = sorted({slug_of(md) for md in base.rglob("SKILL.md")})
    if not slugs:
        raise SystemExit(f"No SKILL.md found under {base}")
    return slugs


def run_step(cmd: list[str], log) -> tuple[bool, str]:
    """Run a subprocess, stream into the per-skill log, return (ok, tail)."""
    log.write(f"\n$ {' '.join(cmd)}\n")
    log.flush()
    proc = subprocess.run(cmd, capture_output=True, text=True)
    out = (proc.stdout or "") + (proc.stderr or "")
    log.write(out)
    log.flush()
    tail = "\n".join(out.strip().splitlines()[-12:])
    return proc.returncode == 0, tail


def questions_exist(slug_us: str) -> bool:
    d = HERE / "data" / slug_us
    return all((d / split / "items.json").is_file() for split in ("train", "val", "test"))


def process_skill(slug: str, idx: int, total: int, args, cal_splits: list[str]) -> dict:
    """Run the full per-skill pipeline. Returns the result record. Never raises —
    failures are captured in rec['status'] so one skill can't abort the batch."""
    slug_us = slug.replace("-", "_")
    out_dir = HERE / "outputs" / slug_us
    out_dir.mkdir(parents=True, exist_ok=True)
    best = out_dir / "best_skill.md"
    rec = {"skill": slug, "status": "", "secs": 0, "steps": {}, "error": ""}
    t0 = time.time()
    head = f"[{idx}/{total}] {slug}"

    if best.exists() and not args.force and not args.smoke:
        print(f"{head}: SKIP (best_skill.md exists — use --force to redo)", flush=True)
        rec["status"] = "skipped"
        return rec

    # A forced re-run must start CLEAN: the trainer resumes from any existing
    # out_dir (runtime_state.json + steps/), so without wiping it, --force would
    # reuse stale pre-fix predictions and only re-run the final test evals. Blow
    # the whole skill output dir away so the optimization step is redone fresh.
    # (Questions live under data/<slug>, not here, so they're preserved.)
    if args.force and not args.smoke and out_dir.exists():
        shutil.rmtree(out_dir, ignore_errors=True)
    out_dir.mkdir(parents=True, exist_ok=True)

    print(f"{head}: running…", flush=True)
    with (out_dir / "batch.log").open("w", encoding="utf-8") as log:
        log.write(f"=== batch run for {slug} ===\n")

        # 1) questions
        if args.regen or not questions_exist(slug_us):
            ok, tail = run_step(
                [PY, str(HERE / "generate_questions.py"), "--skill", slug,
                 "--n-train", str(args.n_train), "--n-val", str(args.n_val),
                 "--n-test", str(args.n_test)], log)
            rec["steps"]["questions"] = "ok" if ok else "fail"
            if not ok:
                rec["status"] = "fail:questions"; rec["error"] = tail
                rec["secs"] = round(time.time() - t0, 1)
                print(f"{head}: FAIL at questions", flush=True)
                return rec
        else:
            rec["steps"]["questions"] = "reused"

        # 1b) calibrate rubrics so the test discriminates — without this the
        # optimizer trains against too-easy rubrics and scores collapse to 1.0.
        if args.calibrate:
            cal_ok, tail = True, ""
            for split in cal_splits:
                ok, tail = run_step(
                    [PY, str(HERE / "calibrate_rubrics.py"), "--skill", slug, "--split", split], log)
                cal_ok = cal_ok and ok
            rec["steps"]["calibrate"] = ("ok:" + "+".join(cal_splits)) if cal_ok else "fail"
            if not cal_ok:
                rec["status"] = "fail:calibrate"; rec["error"] = tail
                rec["secs"] = round(time.time() - t0, 1)
                print(f"{head}: FAIL at calibrate", flush=True)
                return rec

        # 1c) discrimination diagnostic (does the val test separate full from junk?)
        if args.discriminate:
            ok, _ = run_step([PY, str(HERE / "discriminate.py"), "--skill", slug, "--split", "val"], log)
            rec["steps"]["discriminate"] = "ok" if ok else "fail"

        # 2) optimize
        run_cmd = [PY, str(HERE / "run.py"), "--skill", slug]
        if args.weak_seed:
            run_cmd.append("--weak-seed")
        if args.smoke:
            run_cmd.append("--smoke")
        ok, tail = run_step(run_cmd, log)
        rec["steps"]["optimize"] = "ok" if ok else "fail"
        if not ok:
            rec["status"] = "fail:optimize"; rec["error"] = tail
            rec["secs"] = round(time.time() - t0, 1)
            print(f"{head}: FAIL at optimize", flush=True)
            return rec

        # 3) report (skip for smoke — nothing to render)
        if not args.smoke:
            ok, tail = run_step([PY, str(HERE / "report.py"), str(out_dir)], log)
            rec["steps"]["report"] = "ok" if ok else "fail"

    rec["status"] = "ok"
    rec["secs"] = round(time.time() - t0, 1)
    print(f"{head}: OK ({rec['secs']}s)", flush=True)
    return rec


def main():
    ap = argparse.ArgumentParser()
    sel = ap.add_mutually_exclusive_group(required=True)
    sel.add_argument("--category", help="run every skill under skills/<category>/")
    sel.add_argument("--skills", help="comma-separated skill slugs")
    sel.add_argument("--all", action="store_true", help="every skill in the repo")
    ap.add_argument("--n-train", type=int, default=6)
    ap.add_argument("--n-val", type=int, default=3)
    ap.add_argument("--n-test", type=int, default=3)
    ap.add_argument("--force", action="store_true", help="re-optimize even if best_skill.md exists")
    ap.add_argument("--regen", action="store_true", help="regenerate questions even if present")
    ap.add_argument("--calibrate", action="store_true",
                    help="strengthen rubrics before optimizing (recommended — avoids too-easy 1.0 scores)")
    ap.add_argument("--cal-splits", default="train,val",
                    help="which splits to calibrate (default train,val; e.g. 'val' to halve calibration cost)")
    ap.add_argument("--discriminate", action="store_true",
                    help="after calibration, run the full-vs-weak discrimination check on val (diagnostic only)")
    ap.add_argument("--jobs", type=int, default=1, help="number of skills to process in parallel")
    ap.add_argument("--weak-seed", action="store_true", help="pass --weak-seed to run.py")
    ap.add_argument("--smoke", action="store_true", help="pass --smoke to run.py (no optimization)")
    args = ap.parse_args()

    slugs = discover(args.category, args.skills, args.all)
    cal_splits = [s.strip() for s in args.cal_splits.split(",") if s.strip()]
    selector = args.category or ("all" if args.all else "custom")
    print(f"Batch '{selector}': {len(slugs)} skill(s), jobs={args.jobs}"
          + (f", calibrate={'+'.join(cal_splits)}" if args.calibrate else ""))
    for s in slugs:
        print(f"  - {s}")
    print(flush=True)

    summary_path = HERE / "outputs" / f"_batch_{selector}.json"
    summary_path.parent.mkdir(parents=True, exist_ok=True)
    summary_path.write_text("[]")  # reset stale summary so monitors start clean
    results: list[dict] = []
    lock = threading.Lock()
    t_batch = time.time()
    total = len(slugs)

    def worker(args_tuple):
        idx, slug = args_tuple
        rec = process_skill(slug, idx, total, args, cal_splits)
        with lock:
            results.append(rec)
            summary_path.write_text(json.dumps(results, indent=2))
        return rec

    with ThreadPoolExecutor(max_workers=max(1, args.jobs)) as ex:
        list(ex.map(worker, enumerate(slugs, 1)))

    # final summary
    dur = round(time.time() - t_batch, 1)
    ok = sum(1 for r in results if r["status"] == "ok")
    sk = sum(1 for r in results if r["status"] == "skipped")
    fail = [r for r in results if r["status"].startswith("fail")]
    print(f"\n=== BATCH '{selector}' DONE in {dur}s ===")
    print(f"  ok={ok}  skipped={sk}  failed={len(fail)}")
    for r in fail:
        print(f"  FAIL {r['skill']} ({r['status']}): {r['error'].splitlines()[-1] if r['error'] else ''}")
    summary_path.write_text(json.dumps(results, indent=2))
    print(f"\nSummary: {summary_path}", flush=True)


if __name__ == "__main__":
    main()

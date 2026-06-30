#!/usr/bin/env python3
"""
Discrimination check — is a skill's test actually any good?

Runs each question TWICE: once with the FULL skill, once with a WEAK 2-line seed,
and judges both. A good (discriminating) test makes the full skill PASS and the
weak seed FAIL. If both pass, the test is too easy / the rubric too lenient — a
1.0 score means nothing.

Use this to explain "half my skills already score 1.0": run it and see how many
of those 1.0s survive when the skill is replaced with junk.

Usage:
  ./skillopt-venv/bin/python skillopt/discriminate.py --skill meta-ads-analyzer
  ./skillopt-venv/bin/python skillopt/discriminate.py --skill <slug> --split test --limit 5
"""
from __future__ import annotations

import sys, json, argparse
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))

import run  # find_skill_md, strip_frontmatter, WEAK_SEED, configure_backend
run.configure_backend()
import tempfile  # noqa: E402
from envs.meta_ads_analyzer.adapter import _run_target, _judge  # noqa: E402


def answer_and_judge(skill_content: str, item: dict) -> dict:
    """Run the skill in a temp workspace (captures files), then judge with artifacts."""
    with tempfile.TemporaryDirectory(prefix="discrim_") as wd:
        try:
            resp, artifacts = _run_target(skill_content, item, wd, timeout=600)
        except Exception as e:  # noqa: BLE001
            return {"hard": 0, "soft": 0.0, "reasoning": f"target error: {e}"}
        return _judge(resp, item.get("rubric", ""), item.get("prompt", ""), workdir=wd, artifacts=artifacts)


def classify(full_hard: int, weak_hard: int) -> str:
    if full_hard and not weak_hard:
        return "DISCRIMINATES"      # good test
    if full_hard and weak_hard:
        return "TOO EASY"           # junk also passes → useless test / weak rubric
    if not full_hard and not weak_hard:
        return "TOO HARD/SKILL?"    # both fail → test too hard or skill genuinely weak
    return "INVERTED"               # weak beats full → noisy judge/rubric


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--skill", required=True)
    ap.add_argument("--split", default="val", choices=["train", "val", "test"])
    ap.add_argument("--limit", type=int, default=0)
    ap.add_argument("--workers", type=int, default=3)
    args = ap.parse_args()

    slug_us = args.skill.replace("-", "_")
    items_path = HERE / "data" / slug_us / args.split / "items.json"
    if not items_path.is_file():
        raise SystemExit(f"No items at {items_path}. Generate questions first.")
    items = json.loads(items_path.read_text())
    if args.limit:
        items = items[: args.limit]

    full = run.strip_frontmatter(run.find_skill_md(args.skill).read_text())
    weak = run.WEAK_SEED.format(name=args.skill)
    print(f"Discrimination check: {args.skill} [{args.split}] — {len(items)} questions × (full vs weak)\n")

    def check(it):
        fv = answer_and_judge(full, it)
        wv = answer_and_judge(weak, it)
        return {"id": it["id"], "full": fv["soft"], "weak": wv["soft"],
                "full_hard": fv["hard"], "weak_hard": wv["hard"],
                "verdict": classify(fv["hard"], wv["hard"])}

    with ThreadPoolExecutor(max_workers=args.workers) as ex:
        rows = list(ex.map(check, items))

    print(f"{'id':<28}{'full':>6}{'weak':>6}   verdict")
    print("-" * 60)
    for r in rows:
        print(f"{r['id']:<28}{r['full']:>6.2f}{r['weak']:>6.2f}   {r['verdict']}")

    from collections import Counter
    c = Counter(r["verdict"] for r in rows)
    print("-" * 60)
    print("Summary:", dict(c))
    good = c.get("DISCRIMINATES", 0)
    print(f"\n{good}/{len(rows)} questions actually discriminate (full passes, junk fails).")
    if c.get("TOO EASY"):
        print(f"⚠ {c['TOO EASY']} question(s) are TOO EASY — a junk skill also passes. "
              f"Strengthen their rubrics:  skillopt/calibrate_rubrics.py --skill {args.skill} --split {args.split}")

    out = HERE / "outputs" / slug_us / f"discriminate_{args.split}.json"
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(json.dumps(rows, indent=2) + "\n")
    print(f"\nWritten: {out}")


if __name__ == "__main__":
    main()

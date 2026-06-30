#!/usr/bin/env python3
"""
Rubric calibration — make answer-keys actually discriminating.

A rubric is only good if it FAILS a shallow answer. For each question this:
  1. generates a shallow answer (the weak 2-line seed = "no real skill"),
  2. judges it against the current rubric,
  3. if the shallow answer PASSES, the rubric is too lenient → an LLM rewrites it
     to add CRITICAL items the shallow answer violates → repeat until it fails.

It ALSO folds in HUMAN expectations: if you (a) put an "expect" field on an item
in items.json, or (b) pass --item <id> --expect "<what the output must contain>",
that requirement is encoded into the rubric as a CRITICAL item.

Updates data/<slug>/<split>/items.json in place (originals are gitignored anyway).

Usage:
  ./skillopt-venv/bin/python skillopt/calibrate_rubrics.py --skill meta-ads-analyzer
  ./skillopt-venv/bin/python skillopt/calibrate_rubrics.py --skill <slug> --split test
  # add a human requirement to one question's rubric:
  ./skillopt-venv/bin/python skillopt/calibrate_rubrics.py --skill <slug> \
      --item meta-ads-analyzer-1 --expect "must give a concrete daily budget number to exit Learning"
"""
from __future__ import annotations

import sys, json, argparse
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))

import tempfile  # noqa: E402
import run  # configure_backend, find_skill_md, WEAK_SEED
run.configure_backend()
from skillopt.model import chat_target                          # noqa: E402  (strengthen)
from envs.meta_ads_analyzer.adapter import _run_target, _judge  # noqa: E402


def strengthen(item: dict, shallow_ans: str, expect: str = "") -> str:
    system = ("You tighten evaluation rubrics (answer-keys). A good rubric PASSES a correct "
              "expert answer but FAILS a shallow/generic one. Add specific 'CRITICAL: ...' "
              "items about correctness (not length). Keep existing valid items.")
    user = f"""QUESTION:
{item['prompt']}

DATA (excerpt):
{item.get('csv','')[:1200]}

CURRENT RUBRIC:
{item.get('rubric','')}

A SHALLOW ANSWER THAT WRONGLY PASSED THIS RUBRIC (the rubric must now FAIL it):
{shallow_ans[:3500]}
{f'''
THE HUMAN REVIEWER REQUIRES THIS IN A CORRECT ANSWER — encode it as a CRITICAL item:
{expect}''' if expect else ''}

Rewrite the rubric so a correct expert answer passes but the shallow answer above fails.
Output ONLY the new rubric text (no preamble, no fences)."""
    resp, _ = chat_target(system=system, user=user, max_completion_tokens=1500,
                          retries=2, stage="rollout", timeout=180)
    return (resp or "").strip()


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--skill", required=True)
    ap.add_argument("--split", default="val", choices=["train", "val", "test"])
    ap.add_argument("--max-rounds", type=int, default=2)
    ap.add_argument("--item", help="only calibrate this item id")
    ap.add_argument("--expect", help="human requirement to encode into the item's rubric (use with --item)")
    args = ap.parse_args()

    slug_us = args.skill.replace("-", "_")
    items_path = HERE / "data" / slug_us / args.split / "items.json"
    if not items_path.is_file():
        raise SystemExit(f"No items at {items_path}")
    items = json.loads(items_path.read_text())
    weak = run.WEAK_SEED.format(name=args.skill)

    changed = 0
    for it in items:
        if args.item and it["id"] != args.item:
            continue
        expect = (args.expect if (args.item and it["id"] == args.item and args.expect) else "") or it.get("expect", "")
        if expect:
            it["expect"] = expect  # persist the human requirement

        print(f"\n[{it['id']}] generating a shallow answer…")
        with tempfile.TemporaryDirectory(prefix="calib_") as wd:
            try:
                shallow, artifacts = _run_target(weak, it, wd, timeout=600)
            except Exception as e:  # noqa: BLE001
                print(f"  target error: {e}; skipping"); continue
            v = _judge(shallow, it.get("rubric", ""), it.get("prompt", ""), workdir=wd, artifacts=artifacts)
            print(f"  shallow answer scores: hard={v['hard']} soft={v['soft']:.2f} (artifacts: {', '.join(artifacts) or 'none'})")

            needs_work = v["hard"] == 1 or bool(expect)
            if not needs_work:
                print("  ✓ rubric already fails the shallow answer — discriminating, left as-is.")
                continue

            for rnd in range(args.max_rounds):
                reason = "human requirement" if (expect and v["hard"] == 0) else "shallow answer passed"
                print(f"  round {rnd+1}: strengthening rubric ({reason})…")
                it["rubric"] = strengthen(it, shallow, expect)
                expect = ""  # only inject the human requirement once
                v = _judge(shallow, it["rubric"], it.get("prompt", ""), workdir=wd, artifacts=artifacts)
                print(f"    re-judged shallow: hard={v['hard']} soft={v['soft']:.2f}")
                if v["hard"] == 0:
                    print("    ✓ rubric now fails the shallow answer.")
                    break
            else:
                print("    ⚠ still passes after max rounds — review this rubric by hand.")
            changed += 1

    items_path.write_text(json.dumps(items, indent=2) + "\n")
    print(f"\nUpdated {changed} rubric(s) → {items_path}")
    if changed:
        print(f"Re-check:  skillopt/discriminate.py --skill {args.skill} --split {args.split}")


if __name__ == "__main__":
    main()

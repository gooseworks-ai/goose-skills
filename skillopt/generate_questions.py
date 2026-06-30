#!/usr/bin/env python3
"""
Generate eval/training questions for a skill — from its CONTRACT ONLY.

An LLM agent reads the skill's contract (name, when-to-use, inputs) — NOT its
method — and writes realistic, varied, HARD tasks plus an answer-key (rubric)
derived from its own domain expertise. This avoids test leakage: the question
writer never sees how the skill solves the task.

Writes data/<slug>/{train,val,test}/items.json (gitignored).

Usage:
  ./skillopt-venv/bin/python skillopt/generate_questions.py --skill meta-ads-analyzer
  ./skillopt-venv/bin/python skillopt/generate_questions.py --skill meta-ads-analyzer \
      --n-train 6 --n-val 3 --n-test 3
"""
from __future__ import annotations

import os, re, sys, json, argparse, subprocess
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))
from extract_contract import get_contract  # noqa: E402

CLAUDE_BIN = os.environ.get("CLAUDE_CLI_BIN", "claude")
GEN_MODEL = os.environ.get("GEN_MODEL", "claude-opus-4-8")


def gen_prompt(contract: dict, split: str, n: int) -> str:
    purpose = {
        "train": "These TRAIN the skill — the optimizer reads failures on them to improve the skill.",
        "val": "These are the EXAMINER's check — used to decide whether an edit is kept. Keep them distinct from train.",
        "test": "These are the SEALED FINAL EXAM — the most realistic and hardest; never used to train or decide.",
    }[split]
    return f"""You are writing evaluation questions for an AI "skill". You can see the skill's
CONTRACT (what it is for and what it takes as input) but you do NOT and must NOT
know HOW it solves tasks. Write questions blind to its method.

SKILL CONTRACT
- name: {contract['name']}
- category: {contract.get('category','')}
- description (MARKETING — may hint at the method; IGNORE any methodology hints,
  do NOT test for its buzzwords): {contract.get('description','')}
- when to use:
{contract.get('when_to_use','')}
- inputs it expects:
{contract.get('inputs','')}

WRITE {n} {split.upper()} QUESTIONS. {purpose}

Rules:
- Each question = a realistic task a real user would bring, WITH realistic input
  data matching the "inputs" spec above (invent plausible numbers; vary the
  scenarios widely — different shapes, edge cases, traps).
- Make them DISCRIMINATING and HARD: a weak/generic skill should get them wrong,
  a genuinely expert one should get them right.
- For each, write a RUBRIC = an answer-key of what a CORRECT EXPERT answer MUST
  contain, derived from YOUR OWN domain knowledge of this field — NOT from the
  skill's description. Mark must-haves as "CRITICAL: ...". A good rubric makes
  the judge fail a shallow or wrong answer.
- Vary task_type across the set.

Output ONLY a JSON array of exactly {n} objects, no prose, no fences:
[{{"id":"<slug>-<n>","task_type":"<category>","prompt":"<user task>","csv":"<input data as CSV/table text>","rubric":"CRITICAL: ... ; ..."}}]"""


def call_claude(prompt: str, timeout: int = 300) -> list[dict]:
    proc = subprocess.run([CLAUDE_BIN, "--print", "--model", GEN_MODEL, prompt],
                          capture_output=True, text=True, timeout=timeout)
    out = (proc.stdout or "").strip()
    m = re.search(r"\[.*\]", out, re.S)
    if not m:
        raise RuntimeError(f"generator returned no JSON array:\n{out[:400]}")
    return json.loads(m.group(0))


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--skill", required=True)
    ap.add_argument("--n-train", type=int, default=6)
    ap.add_argument("--n-val", type=int, default=3)
    ap.add_argument("--n-test", type=int, default=3)
    args = ap.parse_args()

    contract = get_contract(args.skill)
    slug_us = args.skill.replace("-", "_")
    data_dir = HERE / "data" / slug_us
    print(f"Generating questions for '{args.skill}' (contract-only) → data/{slug_us}/")

    for split, n in (("train", args.n_train), ("val", args.n_val), ("test", args.n_test)):
        print(f"  {split}: asking the generator for {n} questions…")
        items = call_claude(gen_prompt(contract, split, n))
        out = data_dir / split
        out.mkdir(parents=True, exist_ok=True)
        (out / "items.json").write_text(json.dumps(items, indent=2) + "\n")
        print(f"    ✓ wrote {len(items)} → {out/'items.json'}")

    print(f"\nDone. Now optimize against them:")
    print(f"  ./skillopt-venv/bin/python skillopt/run.py --skill {args.skill}")


if __name__ == "__main__":
    main()

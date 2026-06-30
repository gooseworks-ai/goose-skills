#!/usr/bin/env python3
"""
Extract a skill's CONTRACT — and ONLY the contract — for question generation.

The contract is the skill's *interface*: what it's for and what it takes in.
It deliberately EXCLUDES the skill's method/instructions (how it solves the
task), because a question-generator that sees the method writes questions the
skill is guaranteed to pass (test leakage / teaching-to-the-test).

Contract = { name, description, tags, category, when_to_use, inputs }
Sources, in order of preference:
  1. skill.meta.json  (structured fields if present: when_to_use, inputs)
  2. SKILL.md frontmatter (name/description/tags)
  3. SKILL.md sections "When to Use" and the inputs/intake section ONLY

Usage:
  ./skillopt-venv/bin/python skillopt/extract_contract.py --skill meta-ads-analyzer
"""
from __future__ import annotations

import re
import sys
import json
import argparse
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SKILLS = ROOT / "skills"

# Headings that describe INPUTS (safe). Anything else after them is the METHOD.
INPUT_HEADING = re.compile(r"(intake|input|what you.?ll need|prerequisite|provide)", re.I)
WHENTOUSE_HEADING = re.compile(r"when to use", re.I)


def find_skill_dir(slug: str) -> Path | None:
    for md in SKILLS.rglob("SKILL.md"):
        m = re.search(r"^name:\s*(.+)$", md.read_text(encoding="utf-8"), re.M)
        name = (m.group(1).strip() if m else "").strip("'\"")
        if name == slug or md.parent.name == slug:
            return md.parent
    return None


def parse_frontmatter(md: str) -> dict:
    fm = re.match(r"^---\n(.*?)\n---\n", md, re.S)
    out = {"name": "", "description": "", "tags": []}
    if not fm:
        return out
    block = fm.group(1)
    for key in ("name", "description"):
        m = re.search(rf"^{key}:\s*(.+)$", block, re.M)
        if m:
            out[key] = m.group(1).strip().strip("'\"")
    tm = re.search(r"^tags:\s*\[(.*?)\]", block, re.M)
    if tm:
        out["tags"] = [t.strip().strip("'\"") for t in tm.group(1).split(",") if t.strip()]
    return out


def section(md: str, heading_re: re.Pattern) -> str:
    """Return the text under the first matching '## heading' up to the next '## '."""
    lines = md.splitlines()
    out, capturing = [], False
    for ln in lines:
        if re.match(r"^#{2,3}\s", ln):
            if capturing:
                break
            if heading_re.search(re.sub(r"^#{2,3}\s*", "", ln)):
                capturing = True
                continue
        elif capturing:
            out.append(ln)
    return "\n".join(out).strip()


def get_contract(slug: str) -> dict:
    sd = find_skill_dir(slug)
    if not sd:
        raise SystemExit(f"Skill not found: {slug}")
    md = (sd / "SKILL.md").read_text(encoding="utf-8")
    meta = {}
    mp = sd / "skill.meta.json"
    if mp.is_file():
        meta = json.loads(mp.read_text())

    fm = parse_frontmatter(md)
    contract = {
        "name": meta.get("slug") or fm["name"] or slug,
        "description": meta.get("description") or fm["description"],
        "tags": meta.get("tags") or fm["tags"],
        "category": meta.get("category", ""),
        # Prefer explicit structured fields if a skill author added them to meta.json:
        "when_to_use": meta.get("when_to_use") or section(md, WHENTOUSE_HEADING),
        "inputs": meta.get("inputs") or section(md, INPUT_HEADING),
        "_source": "meta.json+SKILL.md(contract sections only — method excluded)",
    }
    return contract


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("--skill", required=True)
    args = ap.parse_args()
    print(json.dumps(get_contract(args.skill), indent=2))

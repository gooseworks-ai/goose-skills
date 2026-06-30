#!/usr/bin/env python3
"""
Workaround for a packaging bug in skillopt 0.1.0: the wheel ships NO prompt
.md files (only prompts/__init__.py). Without them, the reflect/aggregate/
optimizer stages raise FileNotFoundError. This downloads the generic prompts
from the GitHub repo into the installed package's prompts/ dir.

Run once after `pip install skillopt`:
  ./skillopt-venv/bin/python skillopt/fetch_prompts.py
"""
import os
import urllib.request

import skillopt

PROMPTS = [
    "analyst_error", "analyst_error_full_rewrite", "analyst_error_rewrite",
    "analyst_success", "analyst_success_full_rewrite", "analyst_success_rewrite",
    "lr_autonomous", "merge_failure", "merge_failure_full_rewrite", "merge_failure_rewrite",
    "merge_final", "merge_final_full_rewrite", "merge_final_rewrite",
    "merge_success", "merge_success_full_rewrite", "merge_success_rewrite",
    "meta_skill", "ranking", "ranking_rewrite", "rewrite_skill", "slow_update",
]
BASE = "https://raw.githubusercontent.com/microsoft/SkillOpt/main/skillopt/prompts"


def main():
    dest = os.path.join(os.path.dirname(skillopt.__file__), "prompts")
    os.makedirs(dest, exist_ok=True)
    got = 0
    for name in PROMPTS:
        url = f"{BASE}/{name}.md"
        out = os.path.join(dest, f"{name}.md")
        if os.path.isfile(out):
            got += 1
            continue
        try:
            with urllib.request.urlopen(url, timeout=30) as r:
                data = r.read()
            with open(out, "wb") as f:
                f.write(data)
            got += 1
            print(f"  ✓ {name}.md ({len(data)} bytes)")
        except Exception as e:  # noqa: BLE001
            print(f"  ✗ {name}.md — {e}")
    print(f"\n{got}/{len(PROMPTS)} prompts present in {dest}")


if __name__ == "__main__":
    main()

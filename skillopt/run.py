#!/usr/bin/env python3
"""
Run SkillOpt on the meta-ads-analyzer skill (tiny POC).

Optimizer + target both run through the already-authenticated Claude CLI
(no API key needed). The skill document is the trainable artifact; the loop
proposes bounded edits and keeps them only if a held-out split improves.

Usage:
  ./skillopt-venv/bin/python skillopt/run.py            # full tiny run
  ./skillopt-venv/bin/python skillopt/run.py --smoke    # 1 rollout + 1 judge, no optimization
"""
from __future__ import annotations

import os
import re
import sys
import json
import argparse
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))  # make `envs.*` importable


def find_skill_md(slug: str) -> Path:
    for md in (HERE.parent / "skills").rglob("SKILL.md"):
        m = re.search(r"^name:\s*(.+)$", md.read_text(encoding="utf-8"), re.M)
        name = (m.group(1).strip().strip("'\"") if m else "")
        if name == slug or md.parent.name == slug:
            return md
    raise SystemExit(f"SKILL.md not found for skill: {slug}")


def strip_frontmatter(md: str) -> str:
    return re.sub(r"^---\n.*?\n---\n", "", md, count=1, flags=re.S).strip()


# Deliberately weak baseline — SkillOpt must re-derive the methodology from
# rollout failures. Use with --weak-seed to demonstrate a measurable gain.
WEAK_SEED = """# {name}

You are an assistant for this task. Read what the user gives you and answer
as best you can. Be helpful.
"""


def configure_backend():
    """Route optimizer + target to the Claude CLI backend."""
    # Let the target use Write/WebSearch. The backend defaults to
    # CLAUDE_PERMISSION_MODE="dontAsk", which DISABLES those tools — so skills
    # that write a report file (or search the web) fail and score 0. Must be set
    # BEFORE claude_backend is imported (it reads the env once at import time).
    os.environ.setdefault("CLAUDE_PERMISSION_MODE", "bypassPermissions")

    # NOTE: router.set_backend("claude") is broken upstream (it normalizes
    # "claude"→"claude_chat" then rejects it). _backend_module() requires the
    # literal "claude", so set the active backend global directly.
    import skillopt.model.router as router
    router._ACTIVE_BACKEND = "claude"
    os.environ["REFLACT_MODEL_BACKEND"] = "claude"
    from skillopt.model import set_optimizer_backend, set_target_backend
    set_optimizer_backend("claude_chat")  # backend_config names use *_chat
    set_target_backend("claude_chat")
    # Belt-and-suspenders: claude_backend already cached the mode at import, so
    # override the module global too.
    import skillopt.model.claude_backend as _cb
    _cb.CLAUDE_PERMISSION_MODE = os.environ["CLAUDE_PERMISSION_MODE"]
    os.environ.setdefault("OPTIMIZER_DEPLOYMENT", os.environ.get("OPTIMIZER_MODEL", "claude-opus-4-8"))
    os.environ.setdefault("TARGET_DEPLOYMENT", os.environ.get("TARGET_MODEL", "claude-opus-4-8"))


def split_count(data_dir: Path, split: str) -> int:
    """Number of items in a generated split (0 if absent)."""
    p = data_dir / split / "items.json"
    if not p.is_file():
        return 0
    return len(json.loads(p.read_text()))


def build_cfg(seed_skill: Path, out_root: Path, env_name: str, data_dir: Path) -> dict:
    # Flat cfg (the trainer consumes flattened keys). Sizes are derived from the
    # actual generated splits so the trainer's strict train_size==split-size check
    # passes regardless of --n-train/--n-val/--n-test used at generation time.
    n_train = split_count(data_dir, "train") or 3
    n_val = split_count(data_dir, "val") or 2
    n_test = split_count(data_dir, "test") or 1
    return {
        "env": env_name,
        "skill_init": str(seed_skill),
        "out_root": str(out_root),
        "model_backend": "claude_chat",
        "optimizer_backend": "claude_chat",
        "target_backend": "claude_chat",
        "optimizer_model": os.environ.get("OPTIMIZER_MODEL", "claude-opus-4-8"),
        "target_model": os.environ.get("TARGET_MODEL", "claude-opus-4-8"),
        # train
        "num_epochs": 1,
        "steps_per_epoch": 1,
        "batch_size": n_train,
        "train_size": n_train,
        "accumulation": 1,
        "seed": 42,
        # gradient / reflect
        "minibatch_size": 2,
        "merge_batch_size": 4,
        "analyst_workers": 2,
        "failure_only": False,
        "max_analyst_rounds": 1,
        # optimizer
        "edit_budget": 2,            # learning_rate
        "min_edit_budget": 1,
        "lr_scheduler": "constant",
        "lr_control_mode": "fixed",
        "skill_update_mode": "patch",
        "use_slow_update": False,
        "use_meta_skill": False,
        # evaluation gate (soft = partial credit, useful when hard is sparse early)
        "use_gate": True,
        "gate_metric": "soft",
        "sel_env_num": n_val,        # validation split size
        "test_env_num": n_test,
        "eval_test": True,
    }


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--skill", default="meta-ads-analyzer", help="skill slug to optimize")
    ap.add_argument("--smoke", action="store_true", help="run 1 rollout + 1 judge, skip optimization")
    ap.add_argument("--weak-seed", action="store_true", help="start from a deliberately weak skill to show optimization gain")
    args = ap.parse_args()

    slug_us = args.skill.replace("-", "_")
    skill_md = find_skill_md(args.skill)
    data_dir = HERE / "data" / slug_us
    out_root = HERE / "outputs" / slug_us
    if not data_dir.is_dir():
        raise SystemExit(f"No questions at {data_dir}. Run: skillopt/generate_questions.py --skill {args.skill}  (or make_dataset.py)")

    configure_backend()
    from envs.meta_ads_analyzer.adapter import MetaAdsAdapter

    out_root.mkdir(parents=True, exist_ok=True)
    seed_skill = out_root / "seed_skill.md"
    seed_skill.write_text(WEAK_SEED.format(name=args.skill) if args.weak_seed else strip_frontmatter(skill_md.read_text()))
    print(f"Skill: {args.skill} | seed ({'WEAK' if args.weak_seed else 'full'}): {len(seed_skill.read_text())} chars | data: {data_dir}")

    adapter = MetaAdsAdapter(split_dir=str(data_dir), split_mode="split_dir",
                             minibatch_size=2, edit_budget=2, analyst_workers=2, workers=3)
    cfg = build_cfg(seed_skill, out_root, slug_us, data_dir)
    adapter.setup(cfg)

    if args.smoke:
        env = adapter.build_eval_env(env_num=1, split="train", seed=42)
        print(f"Smoke: rolling out 1 task ({env[0]['id']})…")
        results = adapter.rollout(env[:1], seed_skill.read_text(), str(out_root / "smoke"))
        r = results[0]
        print(f"\nSMOKE RESULT: hard={r['hard']} soft={r['soft']:.2f}")
        print(f"fail_reason: {r['fail_reason'][:300]}")
        print(f"report head:\n{r['response'][:600]}")
        return

    from skillopt.engine.trainer import ReflACTTrainer
    trainer = ReflACTTrainer(cfg, adapter)
    summary = trainer.train()
    print("\n=== TRAIN SUMMARY ===")
    print(summary)
    best = out_root / "best_skill.md"
    print(f"\nbest_skill.md: {best} (exists={best.exists()})")
    print(f"View: ./skillopt-venv/bin/python skillopt/report.py {out_root.relative_to(HERE.parent)} --open")


if __name__ == "__main__":
    main()

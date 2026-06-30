"""SkillOpt environment adapter for the `meta-ads-analyzer` skill.

The skill document being optimized is used as the TARGET's system prompt. For
each task we run the target (Claude CLI via SkillOpt's claude backend) on the
campaign CSV, then score the report with an LLM judge against the scenario's
rubric → hard (0/1 pass) + soft (0-1 score). reflect() delegates to SkillOpt's
generic minibatch reflection, which proposes bounded edits to the skill.
"""
from __future__ import annotations

import json
import os
import re
import shutil
import subprocess
import sys
from concurrent.futures import ThreadPoolExecutor

from skillopt.envs.base import EnvAdapter
from skillopt.datasets.base import BatchSpec
from skillopt.gradient.reflect import run_minibatch_reflect

from .dataloader import MetaAdsLoader

CLAUDE_BIN = os.environ.get("CLAUDE_CLI_BIN", "claude")
JUDGE_MODEL = os.environ.get("JUDGE_MODEL", "claude-opus-4-8")
TARGET_MODEL = os.environ.get("TARGET_MODEL") or os.environ.get("TARGET_DEPLOYMENT", "claude-opus-4-8")

IMAGE_EXT = {".png", ".jpg", ".jpeg", ".gif", ".webp", ".svg"}
TEXT_EXT = {".md", ".txt", ".json", ".csv", ".tsv", ".yaml", ".yml", ".log", ".html"}

# Write-jail: the target runs with bypassPermissions (so it never blocks on a
# prompt headlessly), which means Claude's own permission layer will NOT stop a
# skill that names an absolute path to a real repo from writing to it. So we
# ALSO confine writes at the OS level on macOS via sandbox-exec: deny writes
# anywhere under the protected projects root, re-allow only the per-run workdir
# (and leave reads, network, and ~/.claude config writes untouched). Without
# this, a skill like `extract-source-sample` (which hardcodes content-goose
# paths) overwrites real client files. Override the protected root with
# SKILLOPT_PROTECT_ROOT; set SKILLOPT_NO_SANDBOX=1 to disable (not recommended).
_ENV_DIR = os.path.dirname(os.path.abspath(__file__))
PROTECT_ROOT = os.environ.get("SKILLOPT_PROTECT_ROOT") or os.path.realpath(
    os.path.join(_ENV_DIR, "..", "..", "..", "..", "..")  # → the dir holding all sibling repos
)


def _sandbox_wrap(cmd: list[str], workdir: str) -> list[str]:
    """Prefix `cmd` with sandbox-exec so its file WRITES are confined to `workdir`
    (+ temp + home config); everything under PROTECT_ROOT is read-only to it.
    No-op off macOS, if sandbox-exec is missing, or if SKILLOPT_NO_SANDBOX=1."""
    if (os.environ.get("SKILLOPT_NO_SANDBOX") == "1"
            or sys.platform != "darwin" or not shutil.which("sandbox-exec")):
        return cmd
    wd = os.path.realpath(workdir)
    profile = (
        "(version 1)\n"
        "(allow default)\n"
        f'(deny file-write* (subpath "{PROTECT_ROOT}"))\n'
        f'(allow file-write* (subpath "{wd}"))\n'
    )
    return ["sandbox-exec", "-p", profile, *cmd]


def _collect_artifacts(workdir: str) -> list[str]:
    """Relative paths of files the skill wrote into its workspace."""
    out = []
    for root, _, files in os.walk(workdir):
        for fn in files:
            if fn.startswith("."):
                continue
            out.append(os.path.relpath(os.path.join(root, fn), workdir))
    return sorted(out)


def _run_target(skill_content: str, item: dict, workdir: str, timeout: int = 600) -> tuple[str, list[str]]:
    """Run the skill (as system prompt) in a PERSISTENT workdir and capture the
    text reply PLUS any files it wrote (so the judge can read them)."""
    os.makedirs(workdir, exist_ok=True)
    system = (
        (skill_content.strip() or "You are an expert assistant.")
        + "\n\nFollow the skill above exactly. Write any output files (reports, images, "
          "etc.) into the current working directory. ALSO include your full answer in your reply."
    )
    user = f"{item['prompt']}\n\n## Data\n{item.get('csv','')}"
    cmd = [
        CLAUDE_BIN, "-p", "--output-format", "json",
        "--permission-mode", "bypassPermissions", "--add-dir", workdir,
        "--model", TARGET_MODEL, "--append-system-prompt", system, user,
    ]
    proc = subprocess.run(_sandbox_wrap(cmd, workdir), cwd=workdir, capture_output=True, text=True, timeout=timeout)
    text = ""
    try:
        data = json.loads(proc.stdout or "{}")
        text = data.get("result") or data.get("response") or ""
    except Exception:  # noqa: BLE001
        text = (proc.stdout or "").strip()
    if not text and proc.returncode != 0:
        text = f"(target error: {(proc.stderr or '').strip()[:200]})"
    return text, _collect_artifacts(workdir)


def _artifact_section(workdir: str, artifacts: list[str]) -> tuple[str, bool]:
    """Describe produced files for the judge. Text files are inlined; images are
    referenced for the judge to VIEW via the Read tool. Returns (text, has_images)."""
    if not artifacts:
        return "", False
    lines = ["\nFILES THE SKILL PRODUCED — grade these too, not just the text reply:"]
    has_images = False
    for rel in artifacts:
        ext = os.path.splitext(rel)[1].lower()
        ap = os.path.join(workdir, rel)
        if ext in IMAGE_EXT:
            has_images = True
            lines.append(f"- IMAGE `{rel}` — use the Read tool to VIEW it, then judge it visually.")
        elif ext in TEXT_EXT:
            try:
                content = open(ap, encoding="utf-8", errors="replace").read()[:6000]
            except Exception:  # noqa: BLE001
                content = "(unreadable)"
            lines.append(f"- FILE `{rel}`:\n\"\"\"\n{content}\n\"\"\"")
        else:
            sz = os.path.getsize(ap) if os.path.exists(ap) else 0
            lines.append(f"- FILE `{rel}` ({sz} bytes, binary — note its presence; cannot open directly).")
    return "\n".join(lines), has_images


def _judge(report: str, rubric: str, prompt: str, workdir: str | None = None,
           artifacts: list[str] | None = None, timeout: int = 240) -> dict:
    """LLM-as-judge via the Claude CLI. Reads produced files (incl. images) when
    given a workdir. Returns {hard, soft, reasoning}."""
    art_text, has_images = _artifact_section(workdir, artifacts or []) if workdir else ("", False)
    judge_prompt = f"""You are a strict evaluator grading an AI skill's output.

TASK GIVEN TO THE SKILL:
{prompt}

RUBRIC (grade against this exactly; any CRITICAL item unmet = fail):
{rubric}

THE SKILL'S TEXT REPLY:
\"\"\"
{report[:14000]}
\"\"\"
{art_text}

Respond with ONLY a JSON object, no prose, no fences:
{{"verdict": "pass"|"fail", "score": <0-5 number>, "reasoning": "<2-3 sentences>"}}"""
    cmd = [CLAUDE_BIN, "--print", "--model", JUDGE_MODEL]
    if workdir and has_images:
        # let the judge open image artifacts with its vision via the Read tool
        cmd += ["--permission-mode", "bypassPermissions", "--add-dir", workdir]
    # Deliver the prompt via STDIN, NOT as a trailing argv positional: when
    # --add-dir/--permission-mode are present, claude does not recognize the
    # positional prompt → it falls back to reading stdin and (since stdin is
    # inherited and open) blocks forever, which looked like a judge "timeout".
    # stdin delivery fixes that and also avoids argv-length limits on the large
    # judge prompt. Applies uniformly to the text-only and vision judge paths.
    try:
        run_cmd = _sandbox_wrap(cmd, workdir) if workdir else cmd
        proc = subprocess.run(run_cmd, input=judge_prompt, capture_output=True, text=True,
                              timeout=timeout, cwd=workdir or None)
        out = (proc.stdout or "").strip()
        m = re.search(r"\{.*\}", out, re.S)
        if not m:
            return {"hard": 0, "soft": 0.0, "reasoning": f"judge: no JSON ({out[:120]})"}
        data = json.loads(m.group(0))
        score = float(data.get("score", 0))
        return {
            "hard": 1 if str(data.get("verdict")).lower() == "pass" else 0,
            "soft": max(0.0, min(1.0, score / 5.0)),
            "reasoning": str(data.get("reasoning", "")),
        }
    except Exception as e:  # noqa: BLE001
        return {"hard": 0, "soft": 0.0, "reasoning": f"judge error: {e}"}


class MetaAdsAdapter(EnvAdapter):
    def __init__(
        self,
        split_dir: str = "",
        split_mode: str = "split_dir",
        workers: int = 3,
        analyst_workers: int = 2,
        failure_only: bool = False,
        minibatch_size: int = 2,
        edit_budget: int = 2,
        seed: int = 42,
        max_completion_tokens: int = 8000,
        target_timeout: int = 600,
    ) -> None:
        self.workers = workers
        self.analyst_workers = analyst_workers
        self.failure_only = failure_only
        self.minibatch_size = minibatch_size
        self.edit_budget = edit_budget
        self.max_completion_tokens = max_completion_tokens
        self.target_timeout = target_timeout
        self.dataloader = MetaAdsLoader(split_dir=split_dir, split_mode=split_mode, seed=seed)

    # ── lifecycle ──────────────────────────────────────────────────────────
    def setup(self, cfg: dict) -> None:
        super().setup(cfg)
        self.dataloader.setup(cfg)

    def get_dataloader(self):
        return self.dataloader

    # ── batch → env manager ────────────────────────────────────────────────
    def build_env_from_batch(self, batch: BatchSpec, **kwargs):
        return list(batch.payload or [])

    def build_train_env(self, batch_size: int, seed: int, **kwargs):
        return self.build_env_from_batch(self.dataloader.build_train_batch(batch_size=batch_size, seed=seed))

    def build_eval_env(self, env_num: int, split: str, seed: int, **kwargs):
        return self.build_env_from_batch(self.dataloader.build_eval_batch(env_num=env_num, split=split, seed=seed))

    # ── rollout ────────────────────────────────────────────────────────────
    def _run_one(self, item: dict, skill_content: str, out_dir: str) -> dict:
        item_id = str(item["id"])
        pred_dir = os.path.join(out_dir, "predictions", item_id)
        workdir = os.path.join(pred_dir, "workspace")   # persistent → files survive for the judge
        os.makedirs(workdir, exist_ok=True)

        result = {"id": item_id, "task_type": item.get("task_type", "meta_ads_analysis"),
                  "question": item.get("prompt", ""), "hard": 0, "soft": 0.0,
                  "response": "", "artifacts": [], "fail_reason": ""}
        try:
            resp, artifacts = _run_target(skill_content, item, workdir, timeout=self.target_timeout)
            result["response"] = resp
            result["artifacts"] = artifacts
            verdict = _judge(resp, item.get("rubric", ""), item.get("prompt", ""),
                             workdir=workdir, artifacts=artifacts)
            result["hard"] = verdict["hard"]
            result["soft"] = verdict["soft"]
            if not result["hard"]:
                result["fail_reason"] = verdict["reasoning"]

            eval_detail = (
                f"[JUDGE VERDICT] {'PASS' if result['hard'] else 'FAIL'} (score={result['soft']:.2f})\n"
                f"Artifacts: {', '.join(artifacts) or '(none)'}\n"
                f"Rubric: {item.get('rubric','')}\nReasoning: {verdict['reasoning']}"
            )
            conversation = [
                {"type": "message", "turn": 1, "content": resp},
                {"role": "system", "content": eval_detail},
            ]
            with open(os.path.join(pred_dir, "target_user_prompt.txt"), "w") as f:
                f.write(f"{item['prompt']}\n\n## Data\n{item.get('csv','')}")
            with open(os.path.join(pred_dir, "conversation.json"), "w") as f:
                json.dump(conversation, f, ensure_ascii=False, indent=2)
        except Exception as e:  # noqa: BLE001
            result["fail_reason"] = f"rollout error: {e}"
        return result

    def rollout(self, env_manager, skill_content: str, out_dir: str, **kwargs) -> list[dict]:
        items: list[dict] = env_manager
        os.makedirs(out_dir, exist_ok=True)
        results: list[dict] = []
        with ThreadPoolExecutor(max_workers=self.workers) as ex:
            futs = [ex.submit(self._run_one, it, skill_content, out_dir) for it in items]
            for i, fut in enumerate(futs):
                r = fut.result()
                results.append(r)
                print(f"    [rollout] {i+1}/{len(items)} id={r['id']} hard={r['hard']} soft={r['soft']:.2f}", flush=True)
        acc = sum(r["hard"] for r in results) / max(1, len(results))
        print(f"    [rollout] mean hard={acc:.3f}", flush=True)
        return results

    # ── reflect ────────────────────────────────────────────────────────────
    def reflect(self, results: list[dict], skill_content: str, out_dir: str, **kwargs) -> list[dict | None]:
        return run_minibatch_reflect(
            results=results,
            skill_content=skill_content,
            prediction_dir=kwargs.get("prediction_dir", os.path.join(out_dir, "predictions")),
            patches_dir=kwargs.get("patches_dir", os.path.join(out_dir, "patches")),
            workers=self.analyst_workers,
            failure_only=self.failure_only,
            minibatch_size=self.minibatch_size,
            edit_budget=self.edit_budget,
            random_seed=kwargs.get("random_seed"),
            error_system=self.get_error_minibatch_prompt(),
            success_system=self.get_success_minibatch_prompt(),
            step_buffer_context=kwargs.get("step_buffer_context", ""),
            meta_skill_context=kwargs.get("meta_skill_context", ""),
            update_mode=getattr(self, "_cfg", {}).get("skill_update_mode", "patch"),
        )

    def get_task_types(self) -> list[str]:
        seen: list[str] = []
        for it in (self.dataloader.train_items + self.dataloader.val_items + self.dataloader.test_items):
            tt = str(it.get("task_type") or "meta_ads_analysis")
            if tt not in seen:
                seen.append(tt)
        return seen or ["meta_ads_analysis"]

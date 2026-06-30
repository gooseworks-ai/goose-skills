"""Data loader for the meta-ads-analyzer optimization env.

Preserves the scenario fields (`csv`, `rubric`, `prompt`) that rollout() needs,
in addition to the `id`/`task_type` SkillOpt requires.
"""
from __future__ import annotations

import json
from pathlib import Path

from skillopt.datasets.base import SplitDataLoader


def _normalize_item(raw: dict) -> dict:
    return {
        "id": str(raw.get("id") or ""),
        "task_type": str(raw.get("task_type") or "meta_ads_analysis"),
        "prompt": str(raw.get("prompt") or ""),
        "csv": str(raw.get("csv") or ""),
        "rubric": str(raw.get("rubric") or ""),
        # `question` is what the generic reflect prompt prints as the task.
        "question": str(raw.get("prompt") or ""),
    }


class MetaAdsLoader(SplitDataLoader):
    def load_split_items(self, split_path: str) -> list[dict]:
        path = Path(split_path)
        files = sorted(path.glob("*.json"))
        if not files:
            raise FileNotFoundError(f"No items.json in {split_path}")
        payload = json.loads(files[0].read_text(encoding="utf-8"))
        if not isinstance(payload, list):
            raise ValueError(f"Expected a JSON array in {files[0]}")
        return [_normalize_item(r) for r in payload]

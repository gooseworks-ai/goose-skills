#!/usr/bin/env python3
"""One config file, named variants inside it.

WHY THIS EXISTS
This recipe briefly carried three config files: `config.example.json`,
`config.bases-only.json` and `config.plain.json`. They differed in 23 of 143
keys, and the differences were not one concern but four tangled together: the
brand block existed in only one, the lipsync engine was 480p in one and 720p in
the others, the caption and lockup styling had been tuned in only the newest,
and the dynamic layer was switched off in only the newest. Nothing recorded
which file was authoritative for which key. Every fix landed in one file and
silently did not land in the other two, which is how a 480p run and a stale
voice list both survived longer than they should have.

So: ONE file. Anything that genuinely varies is a named preset inside it, under
`presets`, as a sparse overlay that is deep-merged over the base. A preset may
only override keys that already exist in the base, so a typo in a preset is an
error rather than a new setting nobody reads.

    cfg = config_io.load("config.example.json", ["plain"])

A preset's `_note` says what it is for. Presets compose left to right.
"""
from __future__ import annotations

import json
import pathlib


def _merge(base: dict, over: dict, path: str, errors: list[str]) -> dict:
    out = dict(base)
    for k, v in over.items():
        if k.startswith("_"):
            continue
        here = f"{path}.{k}" if path else k
        if k not in base:
            errors.append(here)
            continue
        if isinstance(v, dict) and isinstance(base[k], dict):
            out[k] = _merge(base[k], v, here, errors)
        else:
            out[k] = v
    return out


def load(path, presets=None) -> dict:
    """Read the config and apply named presets over it, in order."""
    cfg = json.loads(pathlib.Path(path).read_text(encoding="utf-8"))
    names = [p for p in (presets or []) if p]
    if not names:
        cfg.pop("presets", None)
        return cfg

    available = {k: v for k, v in (cfg.get("presets") or {}).items()
                 if not k.startswith("_")}
    errors: list[str] = []
    for name in names:
        if name not in available:
            raise SystemExit(
                f"[config] no preset {name!r} in {path}. "
                f"Available: {', '.join(sorted(available)) or 'none'}")
        cfg = _merge(cfg, available[name], "", errors)
    if errors:
        raise SystemExit(
            "[config] preset(s) {} set key(s) that do not exist in the base "
            "config: {}. A preset overrides, it does not introduce; a key only "
            "a preset knows about is a typo nobody would ever read."
            .format(", ".join(names), ", ".join(sorted(set(errors)))))
    cfg.pop("presets", None)
    return cfg


def add_arg(ap) -> None:
    """Register --preset on an argparse parser. Repeatable."""
    ap.add_argument("--preset", action="append", default=[],
                    help="named preset from the config's `presets` block. "
                         "Repeatable; applied in order.")

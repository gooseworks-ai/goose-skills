#!/usr/bin/env python3
"""Create complete labelled hook alternatives against one frozen source.

Successful siblings survive a failed alternative. This is local assembly only;
project/batch identity and approvals are owned by the caller.
"""
import argparse
import copy
import json
from pathlib import Path
import re
import sys
from replace_hook import file_hash, replace, resolve


def replace_pack(config, base):
    source = config.get("source")
    variants = config.get("variants")
    if not isinstance(source, dict) or not isinstance(variants, list) or not variants:
        raise ValueError("pack needs source and one or more labelled variants")
    frozen = copy.deepcopy(source)
    path = resolve(base, frozen.get("path"), "source.path")
    actual_hash = file_hash(path)
    if frozen.get("sha256") and frozen["sha256"] != actual_hash:
        raise ValueError("source SHA256 mismatch; selected original changed")
    frozen["sha256"] = actual_hash
    output_dir = resolve(base, config.get("output_dir"), "output_dir")
    manifest_path = output_dir / "pack-manifest.json"
    if manifest_path.exists():
        raise ValueError("pack manifest exists; resume individual targets or choose a new output directory")
    slugs = []
    for variant in variants:
        label = variant.get("label") if isinstance(variant, dict) else None
        if not isinstance(label, str) or not label.strip():
            raise ValueError("each variant needs a label")
        slug = re.sub(r"[^a-z0-9]+", "-", label.lower()).strip("-")
        if not slug or slug in slugs:
            raise ValueError("variant labels must have unique file-safe names")
        slugs.append(slug)
    output_dir.mkdir(parents=True, exist_ok=True)
    results = []
    for index, (variant, slug) in enumerate(zip(variants, slugs)):
        candidate = {key: copy.deepcopy(config[key]) for key in ["hook_end_sec", "words", "word_times", "captions"] if key in config}
        candidate.update(source=frozen, hook=variant.get("hook"), output={"path": str(output_dir / (slug + ".mp4"))})
        if candidate.get("captions"):
            suffix = Path(candidate["captions"]["path"]).suffix
            candidate["captions"]["output_path"] = str(output_dir / (slug + suffix))
        try:
            manifest = replace(candidate, base)
            results.append({"variant_index": index, "label": variant["label"], "status": "needs_review",
                            "output": manifest["output"], "manifest_path": str(output_dir / (slug + ".mp4.manifest.json"))})
        except (ValueError, OSError, KeyError, TypeError) as error:
            results.append({"variant_index": index, "label": variant["label"], "status": "failed", "error": str(error)})
    summary = {"version": 1, "source": frozen, "hook_end_sec": config.get("hook_end_sec"), "variants": results,
               "status": "partial_failure" if any(r["status"] == "failed" for r in results) else "needs_review",
               "media_generation_cost_usd": 0}
    manifest_path.write_text(json.dumps(summary, indent=2) + "\n")
    return summary


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--config", required=True, type=Path)
    args = parser.parse_args()
    try:
        path = args.config.resolve()
        summary = replace_pack(json.loads(path.read_text()), path.parent)
        print(json.dumps(summary, indent=2))
        sys.exit(2 if summary["status"] == "partial_failure" else 0)
    except (ValueError, OSError, KeyError, TypeError) as error:
        print(f"Hook pack blocked: {error}", file=sys.stderr)
        sys.exit(2)

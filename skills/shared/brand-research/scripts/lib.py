"""Shared helpers for the brand-research pipeline scripts.

Loads .env from the skill folder root, exposes brand-root path helpers, an
HTTP downloader with retries, and the asset-manifest read/upsert/write logic
so every script registers assets the same way.
"""
from __future__ import annotations

import json
import os
import pathlib
import sys
import time
import uuid
from typing import Any

try:
    from dotenv import load_dotenv

    SKILL_ROOT = pathlib.Path(__file__).resolve().parent.parent
    load_dotenv(SKILL_ROOT / ".env")
except Exception:
    pass

# fal_client reads FAL_KEY, not FAL_API_KEY. Alias if needed.
if "FAL_KEY" not in os.environ and "FAL_API_KEY" in os.environ:
    os.environ["FAL_KEY"] = os.environ["FAL_API_KEY"]

ASSET_KINDS = {
    "logo",
    "wordmark",
    "product_photo",
    "lifestyle",
    "video_ref",
    "style_ref",
    "ui_ref",
    "song",
    "asset",
}


def iso_now() -> str:
    return time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())


def info(msg: str) -> None:
    print(f"[{time.strftime('%H:%M:%S')}] {msg}", flush=True)


def die(msg: str) -> None:
    sys.exit(f"ERROR: {msg}")


def require_env(name: str) -> str:
    val = os.environ.get(name, "").strip()
    if not val:
        die(f"{name} is not set. Copy .env.example to .env and fill it in.")
    return val


def brand_root(brand_dir: str) -> pathlib.Path:
    p = pathlib.Path(brand_dir).expanduser().resolve()
    p.mkdir(parents=True, exist_ok=True)
    return p


def manifest_path(brand_dir: str) -> pathlib.Path:
    return brand_root(brand_dir) / "brand-assets" / "manifest.json"


def load_manifest(brand_dir: str) -> dict[str, Any]:
    mp = manifest_path(brand_dir)
    if mp.exists():
        try:
            return json.loads(mp.read_text())
        except json.JSONDecodeError:
            die(f"{mp} is not valid JSON — fix or delete it before re-running.")
    return {
        "schemaVersion": "1.0.0",
        "updatedAt": iso_now(),
        "projectId": brand_root(brand_dir).name,
        "assets": [],
    }


def save_manifest(brand_dir: str, manifest: dict[str, Any]) -> pathlib.Path:
    mp = manifest_path(brand_dir)
    mp.parent.mkdir(parents=True, exist_ok=True)
    manifest["updatedAt"] = iso_now()
    mp.write_text(json.dumps(manifest, indent=2) + "\n")
    return mp


def register_asset(
    brand_dir: str,
    rel_path: str,
    kind: str,
    name: str,
    description: str,
) -> dict[str, Any]:
    """Upsert one asset into brand-assets/manifest.json, keyed by rel_path.

    `rel_path` is relative to the brand root (e.g. "brand-assets/logos/x.svg").
    """
    if kind not in ASSET_KINDS:
        die(f"kind '{kind}' not in {sorted(ASSET_KINDS)}")
    if not name.strip() or not description.strip():
        die("both --name and --description are required and must be non-empty")

    root = brand_root(brand_dir)
    abs_path = (root / rel_path).resolve()
    if not abs_path.is_file():
        die(f"asset not found on disk: {abs_path}")
    if root not in abs_path.parents:
        die(f"asset must live under the brand root: {abs_path}")

    manifest = load_manifest(brand_dir)
    entry = {
        "id": f"brand-asset-{uuid.uuid4().hex[:12]}",
        "path": rel_path,
        "kind": kind,
        "name": name.strip(),
        "description": description.strip(),
        "addedAt": iso_now(),
    }
    assets = manifest.setdefault("assets", [])
    for i, a in enumerate(assets):
        if a.get("path") == rel_path:
            entry["id"] = a.get("id", entry["id"])  # keep stable id on update
            entry["addedAt"] = a.get("addedAt", entry["addedAt"])
            assets[i] = entry
            break
    else:
        assets.append(entry)
    save_manifest(brand_dir, manifest)
    return entry

"""Shared helpers for FAL.ai SDK calls.

Used by every FAL-wrapping script in skills/atoms/* to keep env-loading,
upload, subscribe-with-retry, meta-json, and error-detection consistent.

Pattern:
    from fal_helpers import load_fal_key, subscribe, upload_file, write_meta

    load_fal_key()  # sets FAL_KEY env var or exits
    import fal_client  # safe to import after load_fal_key

    image_url = upload_file(Path("anchor.png"))
    result = subscribe("fal-ai/nano-banana", {"prompt": "...", "image_urls": [image_url]})
    write_meta(output_path, gateway="fal", model="fal-ai/nano-banana", ...)
"""
from __future__ import annotations

import json
import os
import sys
import time
import urllib.request
from pathlib import Path
from typing import Any, Callable


def load_fal_key() -> str:
    """Resolve FAL_API_KEY or FAL_KEY from env or any .env up the tree.

    Sets FAL_KEY in os.environ (fal_client looks for that specifically).
    Exits with a clear message if no key is found.
    """
    for var in ("FAL_API_KEY", "FAL_KEY"):
        val = os.environ.get(var)
        if val:
            os.environ["FAL_KEY"] = val
            return val
    cwd = Path.cwd()
    for parent in [cwd, *cwd.parents]:
        env = parent / ".env"
        if env.exists():
            for line in env.read_text().splitlines():
                line = line.strip()
                for prefix in ("FAL_API_KEY=", "FAL_KEY="):
                    if line.startswith(prefix):
                        val = line.split("=", 1)[1].strip().strip('"').strip("'")
                        if val:
                            os.environ["FAL_KEY"] = val
                            return val
    sys.exit(
        "ERROR: FAL_API_KEY (or FAL_KEY) not set. Add it to .env or export it.\n"
        "Get a key at https://fal.ai/dashboard/keys."
    )


def upload_file(path: Path) -> str:
    """Upload a local file to FAL storage; return public URL.

    Caller must have run load_fal_key() first. 50 MB limit enforced
    (matches Seedance reference-to-video's combined files cap).
    """
    import fal_client  # imported lazily so load_fal_key runs first

    if not path.exists():
        raise FileNotFoundError(f"upload target missing: {path}")
    size = path.stat().st_size
    if size > 50 * 1024 * 1024:
        raise ValueError(f"file > 50 MB (fal seedance combined-files cap): {path} ({size} bytes)")
    return fal_client.upload_file(str(path))


def subscribe(
    model: str,
    arguments: dict[str, Any],
    *,
    with_logs: bool = False,
    on_log: Callable[[Any], None] | None = None,
    timeout_sec: int = 2400,
) -> dict[str, Any]:
    """Synchronous fal_client.subscribe with consistent error surface.

    Returns the result dict on success. Raises RuntimeError with the
    truncated error message on failure (so callers can catch and fall back).
    """
    import fal_client

    def _on_update(update):
        if on_log and hasattr(update, "logs"):
            for line in update.logs or []:
                msg = line.get("message", "") if isinstance(line, dict) else str(line)
                on_log(msg)

    start = time.time()
    try:
        result = fal_client.subscribe(
            model,
            arguments=arguments,
            with_logs=with_logs,
            on_queue_update=_on_update,
        )
    except Exception as e:
        elapsed = time.time() - start
        raise RuntimeError(f"fal subscribe failed for {model} after {elapsed:.1f}s: {e}") from e

    elapsed = time.time() - start
    if elapsed > timeout_sec:
        raise RuntimeError(f"fal subscribe exceeded timeout for {model}: {elapsed:.1f}s > {timeout_sec}s")
    return result


def download(url: str, output_path: Path, *, min_bytes: int = 1024) -> int:
    """Download URL to output_path; return byte count. Fails if < min_bytes."""
    output_path.parent.mkdir(parents=True, exist_ok=True)
    with urllib.request.urlopen(url) as resp, open(output_path, "wb") as f:
        while True:
            chunk = resp.read(1 << 16)
            if not chunk:
                break
            f.write(chunk)
    size = output_path.stat().st_size
    if size < min_bytes:
        body = output_path.read_text(errors="replace")[:500]
        raise RuntimeError(f"downloaded file too small ({size} bytes); likely error JSON: {body}")
    return size


def write_meta(output_path: Path, **fields: Any) -> Path:
    """Write a .meta.json sidecar next to output_path.

    Always stamps `gateway`, `model`, and `wrote_at` if caller supplies them
    or sensible defaults. Callers pass whatever request/response/cost fields
    are relevant to that model.
    """
    fields.setdefault("wrote_at", time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()))
    meta_path = output_path.with_suffix(output_path.suffix + ".meta.json")
    meta_path.write_text(json.dumps(fields, indent=2, default=str))
    return meta_path


def is_error_response(result: dict[str, Any] | None) -> tuple[bool, str]:
    """Detect FAL responses that succeeded HTTP-wise but contain an error payload.

    Returns (is_error, reason). Caller decides whether to fall back.
    """
    if not result:
        return True, "empty result"
    if isinstance(result, dict):
        if "error" in result and result.get("error"):
            return True, f"error field present: {str(result['error'])[:200]}"
        if result.get("status") == "FAILED":
            return True, f"status=FAILED: {str(result)[:200]}"
    return False, ""

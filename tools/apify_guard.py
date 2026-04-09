"""
Apify Guard — Shared cost-protection wrapper for Apify actor runs.

Tracks run count against a configurable limit and optionally prompts
for cost confirmation before each batch of runs.
"""

import json
import os
import urllib.request

GOOSEWORKS_API_BASE = os.environ.get("GOOSEWORKS_API_BASE", "https://api.gooseworks.ai")
GOOSEWORKS_API_KEY = os.environ.get("GOOSEWORKS_API_KEY")

if GOOSEWORKS_API_KEY:
    _APIFY_BASE = f"{GOOSEWORKS_API_BASE}/v1/proxy/apify"
else:
    _APIFY_BASE = "https://api.apify.com/v2"

# ── Module-level state ──────────────────────────────────────────────────────

_run_count = 0
_run_limit = 50
_auto_confirm = False


class ApifyLimitReached(Exception):
    """Raised when the run-count limit is hit."""
    pass


# ── Configuration ───────────────────────────────────────────────────────────

def set_limit(limit):
    """Set maximum number of Apify actor runs allowed in this session."""
    global _run_limit
    _run_limit = limit


def set_auto_confirm(auto):
    """If True, skip interactive cost-confirmation prompts."""
    global _auto_confirm
    _auto_confirm = auto


def get_run_count():
    """Return number of Apify runs executed so far."""
    return _run_count


def get_run_limit():
    """Return the current run limit."""
    return _run_limit


# ── Cost confirmation ───────────────────────────────────────────────────────

def confirm_cost(phase_name, num_runs=1, est_cost=0.0):
    """
    Print estimated cost and optionally prompt user for confirmation.

    Skipped when auto-confirm is enabled (--yes flag).
    """
    if _auto_confirm:
        return
    print(f"\n  {phase_name}")
    print(f"  Estimated runs: {num_runs}  |  Est. cost: ~${est_cost:.2f}")
    try:
        answer = input("  Proceed? [Y/n] ").strip().lower()
    except EOFError:
        answer = "y"
    if answer and answer not in ("y", "yes"):
        raise ApifyLimitReached(f"User declined {phase_name}")


# ── Guarded run ─────────────────────────────────────────────────────────────

def guarded_apify_run(actor_id, run_input, token, timeout=300):
    """
    Start an Apify actor run with cost-guard bookkeeping.

    Returns the run ID on success.
    Raises ApifyLimitReached if the session limit is exceeded.
    """
    global _run_count

    if _run_count >= _run_limit:
        raise ApifyLimitReached(
            f"Apify run limit reached ({_run_count}/{_run_limit}). "
            "Use --max-runs to increase."
        )

    url = f"{_APIFY_BASE}/acts/{actor_id}/runs?token={token}"
    data = json.dumps(run_input).encode("utf-8")
    req = urllib.request.Request(url, data=data, method="POST")
    req.add_header("Content-Type", "application/json")

    resp = urllib.request.urlopen(req, timeout=timeout)
    result = json.loads(resp.read().decode("utf-8"))
    run_id = result["data"]["id"]
    status = result["data"]["status"]

    # Poll until terminal state
    import time
    poll_url = f"{_APIFY_BASE}/actor-runs/{run_id}?token={token}"
    deadline = time.time() + timeout
    while status in ("READY", "RUNNING") and time.time() < deadline:
        time.sleep(5)
        poll_resp = urllib.request.urlopen(poll_url, timeout=30)
        poll_data = json.loads(poll_resp.read().decode("utf-8"))
        status = poll_data["data"]["status"]

    if status != "SUCCEEDED":
        raise RuntimeError(f"Apify run {run_id} ended with status: {status}")

    _run_count += 1
    return run_id

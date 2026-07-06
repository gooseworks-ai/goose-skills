#!/usr/bin/env python3
"""Promote a remix session's improvements back into the DB TEMPLATE recipe.

When you remix a video template in Claude Code and iterate (ask Claude to fix the
copy, tweak a prompt, adjust timings), those improvements live in the PROJECT's
working `config.json` — NOT in the template. This script writes them back to the
template's `ad_sample.recipe` so every FUTURE remix of that template starts from the
better version. This is the template-editing path from the video-templates plan:
templates are DB data, so improving one is a single PATCH — no skill re-publish.

  update_template_recipe.py --sample-id <ad_sample id> \
      --config working/config.json \            # the improved config from the session
      [--instructions working/how-to.md] \      # optional: an improved playbook
      [--api-base http://localhost:5999] \      # default: $GOOSEWORKS_API_BASE_URL or localhost
      [--dry-run]

Auth: $GOOSEWORKS_API_TOKEN (admin-or-token). Locally you can reuse the CLI's token
(`eval $(gooseworks env)`), or the running MCP server's `cal_*` token. The recipe
must stay <= 64 KB; large playbooks/assets go to S3 and are linked, not inlined.
"""
import argparse
import json
import os
import subprocess
import sys


def curl(method, url, token, body=None):
    cmd = ["curl", "-sS", "-X", method, url, "-H", f"Authorization: Bearer {token}"]
    if body is not None:
        cmd += ["-H", "Content-Type: application/json", "-d", json.dumps(body)]
    return json.loads(subprocess.run(cmd, capture_output=True, text=True).stdout or "{}")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--sample-id", required=True)
    ap.add_argument("--config", required=True, help="the improved config.json from the session")
    ap.add_argument("--instructions", help="optional improved playbook (md) → recipe.instructions.inline")
    ap.add_argument("--api-base", default=os.environ.get("GOOSEWORKS_API_BASE_URL", "http://localhost:5999"))
    ap.add_argument("--dry-run", action="store_true")
    a = ap.parse_args()

    token = os.environ.get("GOOSEWORKS_API_TOKEN")
    if not token:
        sys.exit("set GOOSEWORKS_API_TOKEN (admin-or-token). Locally: eval $(gooseworks env), or the MCP cal_ token.")

    # fetch the current sample (list endpoint → find by id; keeps everything else intact)
    data = curl("GET", f"{a.api_base}/api/ads-library/samples?remixable=true&format=video&limit=200", token).get("data", [])
    sample = next((s for s in data if s["id"] == a.sample_id), None)
    if not sample:
        sys.exit(f"sample {a.sample_id} not found (is it remixable? try the admin list).")

    recipe = dict(sample["recipe"])
    recipe["config"] = json.loads(open(a.config).read())          # promote the improved config
    if a.instructions:
        recipe.setdefault("instructions", {})
        recipe["instructions"] = {**(recipe.get("instructions") or {}), "inline": open(a.instructions).read()}

    size = len(json.dumps({"recipe": recipe}))
    print(f"[update] sample={a.sample_id} format={recipe.get('format')} new-recipe={size}b (cap 65536)")
    if size > 64 * 1024:
        sys.exit("recipe > 64 KB — move the playbook/assets to S3 and link them instead of inlining.")
    if a.dry_run:
        print("[dry-run] would PATCH recipe.config" + (" + instructions" if a.instructions else ""))
        return
    resp = curl("PATCH", f"{a.api_base}/api/ads-library/samples/{a.sample_id}", token, {"recipe": recipe})
    ok = resp.get("status") == "success"
    print(f"[update] {'OK — template recipe updated' if ok else 'ERR: ' + json.dumps(resp)[:200]}")
    if not ok:
        sys.exit(1)


if __name__ == "__main__":
    main()

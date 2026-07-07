#!/usr/bin/env python3
"""Cross-model review of a Seedance 2.0 reference-to-video prompt by GPT — a
deliberately NON-Claude second opinion before you spend the render.

Portable: routes through the GooseWorks **openai-proxy** (bills the Ads agent, real
key never touches this machine) — never a direct api.openai.com call. Reads creds
from ~/.gooseworks/credentials.json (the CLI writes it). Takes the prompt to review
as an ARGUMENT (nothing baked in).

  vet_seedance_prompt.py --prompt-file working/seedance-prompt.txt \
      [--brief "one-line intent"] [--refs "@Image1=avatar; @Image2=product; @Image3=env"] \
      [--words 28] [--model gpt-5.5] [--out working/seedance-review.md]

Exit 0 + prints/saves the review. Exit 3 if the proxy/creds are unavailable (so the
recipe can fall back to an inline self-review — the review is advisory, not a gate).
"""
import argparse
import json
import os
import pathlib
import sys
import urllib.request
import urllib.error
from urllib.parse import urlencode

SYSTEM_PROMPT = """\
You are a senior AI-video prompt engineer who has shipped hundreds of short-form UGC
ads on ByteDance Seedance 2.0, Kling, and Veo. You know Seedance 2.0 reference-to-video
intimately: how it binds reference images addressed as @Image1/@Image2/@Image3, native
lip-synced dialogue (generate_audio=true), where it drifts (identity, product geometry,
small text, multi-cut consistency over a single ~15s render), and how spoken-word budget
maps to clip duration. You have strong opinions and you don't hedge — when you spot a
problem you name it and give the specific rewrite, not vague encouragement."""

USER_TEMPLATE = """\
Review this Seedance 2.0 reference-to-video prompt for a single vertical (9:16) UGC ad
before we render it. {brief}{refs}Native lip-sync means a tight spoken-word budget —
our rule of thumb is ~{words} words for a ~15s clip; push back if you disagree.

# The Seedance prompt to review
---
{prompt}
---

# What I want (be concrete; don't soft-pedal — if it will produce mush, say why)
1. **Verdict** — ship-as-is / ship-with-tweaks / needs-rewrite, one sentence.
2. **Specific line edits** — quote the phrase, give the replacement, why in <=15 words. Focus on
   what changes Seedance's output: @Image ref binding, camera-switch language, how hard cuts are
   signalled, consistency anchors, wording that invites drift. 0-8 edits.
3. **Word/duration budget** — will every spoken line land at ~15s with the cuts, or cut a line? which?
4. **Consistency risk** — rank the top 3 things most likely to drift across cuts (face, colors,
   product geometry, small text, camera switch) + the single best prompt-side mitigation for each.
5. **Reusability note** — 1-2 rules to bake into the general prompt recipe so the next brief inherits them."""


def _cfg():
    p = pathlib.Path(os.path.expanduser("~/.gooseworks/credentials.json"))
    if not p.exists():
        sys.exit(3)  # no creds → recipe falls back to inline self-review
    c = json.loads(p.read_text())
    return c["api_base"].rstrip("/"), c["api_key"], c.get("agent_id")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--prompt-file", help="path to the Seedance prompt to review")
    ap.add_argument("--prompt", help="the Seedance prompt inline (alternative to --prompt-file)")
    ap.add_argument("--brief", default="")
    ap.add_argument("--refs", default="")
    ap.add_argument("--words", type=int, default=28)
    ap.add_argument("--model", default="gpt-5.5")
    ap.add_argument("--out", default="working/seedance-review.md")
    a = ap.parse_args()

    prompt = a.prompt or (pathlib.Path(a.prompt_file).read_text() if a.prompt_file else "")
    if not prompt.strip():
        sys.exit("give the prompt via --prompt-file or --prompt")

    api_base, tok, agent = _cfg()
    user = USER_TEMPLATE.format(
        prompt=prompt.strip(), words=a.words,
        brief=(a.brief.strip() + " ") if a.brief else "",
        refs=("Reference slots: " + a.refs.strip() + ". ") if a.refs else "",
    )
    body = {"model": a.model, "messages": [
        {"role": "system", "content": SYSTEM_PROMPT},
        {"role": "user", "content": user},
    ]}
    q = urlencode({"token": tok, **({"agent_id": agent} if agent else {})})
    url = f"{api_base}/api/internal/openai-proxy/v1/chat/completions?{q}"
    req = urllib.request.Request(url, data=json.dumps(body).encode(),
                                 headers={"Content-Type": "application/json"}, method="POST")
    try:
        with urllib.request.urlopen(req, timeout=180) as resp:
            out = json.loads(resp.read().decode())
    except urllib.error.HTTPError as e:
        print(f"HTTP {e.code} {e.reason}\n{e.read().decode(errors='replace')}", file=sys.stderr)
        sys.exit(3)  # proxy error → advisory step, let the recipe self-review inline
    except Exception as e:
        print(f"openai-proxy unreachable: {e}", file=sys.stderr)
        sys.exit(3)

    review = out["choices"][0]["message"]["content"]
    outp = pathlib.Path(a.out)
    outp.parent.mkdir(parents=True, exist_ok=True)
    outp.write_text(review)
    print(f"[vet] model={out.get('model')} usage={out.get('usage', {})} saved={outp}\n")
    print(review)


if __name__ == "__main__":
    main()

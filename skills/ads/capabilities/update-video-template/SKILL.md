---
name: update-video-template
description: Promote a remix session's improvements back into the DB video TEMPLATE recipe — after you remix a template in Claude Code and iterate (fix copy, tweak a prompt, adjust timings), write the improved config (and optional playbook) back to the template's ad_sample.recipe so every FUTURE remix starts from the better version. Templates are DB data, so this is a single PATCH — no skill re-publish. Use at the END of a remix session when the output is better than the template's current defaults.
status: active
---

# update-video-template

The template-editing path — closes the feedback loop from a remix session to the template.

## Run
```
update_template_recipe.py --sample-id <id> --config working/config.json [--instructions working/how-to.md] [--dry-run]
```
- `--config` — the improved config.json from the session (promoted to recipe.config).
- `--instructions` — optional improved playbook (md) → recipe.instructions.inline.
- Auth — $GOOSEWORKS_API_TOKEN (admin-or-token). Locally reuse the CLI token (`eval $(gooseworks env)`) or the MCP cal_ token. Recipe must stay <= 64 KB (large playbooks/assets → S3, linked not inlined).

## When to use
At the end of a remix where you iterated to something better than the template's defaults — so the NEXT person's remix of that template starts from your improvements. Do NOT use it to store one brand's specifics; the template is generic, the brand-specific values come from the project. Promote only genuinely reusable improvements (better prompts, layout, timings, clearer instructions).

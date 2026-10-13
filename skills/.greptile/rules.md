# Skill authoring review rules (skills/)

These enforce the conventions in `CONTRIBUTING.md` and the metadata schemas.

## WAF-safe SKILL.md prose (high severity)
The body of every `SKILL.md` is fetched at runtime and replayed verbatim into the next LLM API call, passing through an upstream WAF that blocks common RCE/RFI patterns. To avoid 403s, the prose body must NOT contain:
- shell-variable forms (dollar-prefixed names, brace-expansion),
- literal absolute filesystem paths,
- backtick-wrapped shell-ish tokens,
- dependency-folder names commonly used in exploits,
- install-command keywords,
- code-host URLs.

Concrete paths and commands belong in the install template, tool wrappers, or scripts — not the SKILL.md body. Refer to locations descriptively instead.

## Metadata + description
- `skill-meta` / `pack-meta` must conform to `schemas/*.schema.json` so `scripts/validate-skills.js` passes.
- The `description` field must lead with what the skill does and when to use it — it is the agent's matching signal.
- Prefer plain prose over code blocks in the body; keep tool plumbing in scripts, not the prose.

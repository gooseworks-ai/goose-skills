# Contributing to goose-skills

## Authoring SKILL.md files — prose constraints

The body of every `SKILL.md` is fetched at runtime and replayed verbatim into the next LLM API call. The request body passes through an upstream WAF that blocks common RCE/RFI patterns. To avoid 403s, keep the prose body free of:

- shell-variable forms (e.g. dollar-prefixed names, brace-expansion)
- literal absolute filesystem paths
- backtick-wrapped shell-ish tokens
- dependency-folder names commonly used in exploits
- install-command keywords
- code-host URLs

Concrete paths and shell commands belong in the install template, tool wrappers, or scripts — **not** in the SKILL.md body. When you need to refer to a location, describe it ("the project directory under the sandbox home", "the dependency folder") rather than typing the literal path or command.

## Other authoring rules

- Lead with what the skill does and when to use it (the `description` field is the agent's matching signal).
- Use plain prose over code blocks where possible — the agent reads this, not a build tool.
- Keep the body focused on agent behaviour: decision flow, non-negotiables, troubleshooting. Tool plumbing belongs elsewhere.
- After editing a skill, run the local sync to update your dev DB:
  - `cd backend && npx tsx src/scripts/sync-predefined-skills-catalog.ts --local ../goose-skills`

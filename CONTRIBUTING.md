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
- (Optional) Set `example_prompt` in `skill.meta.json` to a short, copyable prompt that shows the skill in action. It's surfaced in the catalog and docs; if omitted, one is generated from the description.
- Use plain prose over code blocks where possible — the agent reads this, not a build tool.
- Keep the body focused on agent behaviour: decision flow, non-negotiables, troubleshooting. Tool plumbing belongs elsewhere.
- After editing a skill, rebuild the local index and run the skill validation and tests.
- The GooseWorks backend sync reads the catalog from GitHub; it does not accept a local-directory flag. To test catalog ingestion against a dev database, push a draft branch, set the backend's predefined-skills source ref to that branch, and run the forced catalog sync.

## Video atoms

Video atoms are the skills under `skills/ads/capabilities/` and `skills/ads/packs/<pack>/`. They hold craft: how to drive a model or tool and how to check the piece. CI runs three checks on every pull request:

- **Version.** Each atom has a semver `version` in `skill.meta.json` (and the same number in any SKILL.md frontmatter `version`). A pull request that changes any file in an atom raises it: patch for a fix, minor for a new option, mode or model, major for a removed or renamed input or a new requirement. A new atom starts at `1.0.0`. Run `node scripts/check-atom-versions.js --base origin/<base branch>`.
- **What an atom may say.** No dollar or credit amounts, no approval or spend-gate steps, no install or sign-in lines, no requests for provider keys, no AI app names, no removed action names, no retired model ids, no full copy of the billing helper, and SKILL.md under 16 KB. Old text warns; text a pull request adds fails. A true finding that is creative content (a mockup that draws a named app) goes in the atom's `lint_allow` with a reason. Run `node scripts/atom-lint.js --base origin/<base branch>`.
- **Parts.** Published part versions under `parts/<id>/<x.y.z>/` never change, and `parts/index.json` is rebuilt with `node scripts/build-parts-index.js`. Run `node scripts/check-parts.js --base origin/<base branch>`.

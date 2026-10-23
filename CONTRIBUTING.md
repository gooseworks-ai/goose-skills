# Contributing to goose-skills

## Adding a skill

**Where it goes.** One folder per skill, named by its slug:

| It is… | Put it in | Notes |
|---|---|---|
| A new marketing job (a marketer's want, done end to end) | `skills/marketing/<slug>/` | A playbook: `tier: playbook`, `category: playbooks`. Read `docs/marketing/AGENTS.md` first. Prefer a new mode or output of an existing playbook over a new playbook. |
| One step a playbook loads | `skills/marketing/<playbook>-<step>/` | `tier: atom`. Steps several playbooks share get a plain name (`claims-gate`). List it in the playbook's `requires_skills`. |
| A video atom or format renderer | `skills/video/<slug>/` | Starts at `version: 1.0.0`; see "Video atoms" below. To ship it in a bundle, add its slug to a `packs/<pack>.json`. |
| A change to what every install starts with | `skills/entry/<slug>/` | The six entry skills. Raise `version` in both SKILL.md and skill.meta.json; `test/entry-skills.test.js` enforces real action names, credits only, no install lines and the size budgets. |
| Anything else | Ask first | `skills/shared/` holds only older skills something still uses; new skills don't go there. |

**Names never change.** Recipes, the GooseWorks app, routes and installed copies refer to skills by slug, so a published slug is permanent. To replace a skill, add the new one, then retire the old one in `retired-skills.json` with its `replacement` (or `null` and a `reason`).

**Then run:**

```bash
node scripts/build-index.js && node scripts/validate-skills.js && node scripts/check-marketing-agent-links.js && npm test
```

Commit the regenerated `skills-index.json` with your change. Open the PR into `dev`: merging publishes to staging; promoting `dev` to `main` publishes to production ([DEPLOYMENT.md](DEPLOYMENT.md)).

**To make a marketing playbook use it,** reference it from the playbook's SKILL.md as `` the `<slug>` skill (`../<slug>/SKILL.md`) `` and list it in `requires_skills`. **To make GooseWorks route customers to it,** add its row to `skills/entry/gooseworks/routes.json` and run `node scripts/build-router.js`, which rewrites the router's tables and the Brand Growth collection's routes (CI checks they match).

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

Video atoms are the skills under `skills/video/` whose `category` is not `composites` or `playbooks`. They hold craft: how to drive a model or tool and how to check the piece. CI runs these checks on every pull request:

- **Version.** Each atom has a semver `version` in `skill.meta.json` (and the same number in any SKILL.md frontmatter `version`). A pull request that changes any file in an atom raises it: patch for a fix, minor for a new option, mode or model, major for a removed or renamed input or a new requirement. A new atom starts at `1.0.0`. Run `node scripts/check-atom-versions.js --base origin/<base branch>`.
- **What an atom may say.** No dollar or credit amounts, no approval or spend-gate steps, no install or sign-in lines, no requests for provider keys, no AI app names, no removed action names, no retired model ids, no full copy of the billing helper, and SKILL.md under 16 KB. Old text warns; text a pull request adds fails. An atom marked `status: superseded` (replaced by a part) is skipped only when its frontmatter's `superseded_by` names published, not-withdrawn parts as `id@x.y.z` and its body opens with a one-paragraph `> **Superseded` note naming each of them. A true finding that is creative content (a mockup that draws a named app) goes in the atom's `lint_allow` with a reason. Run `node scripts/atom-lint.js --base origin/<base branch>`.
- **Parts.** Published part versions under `parts/<id>/<x.y.z>/` never change, and `parts/index.json` is rebuilt with `node scripts/build-parts-index.js`. A part never carries or imports the billing helper: it orders paid pieces only through `ctx.line.order`. Run `node scripts/check-parts.js --base origin/<base branch>`.
- **Moving approved videos to a fix.** A free part reaches approved videos at its newest patch of the same minor by itself. A paid part reaches them only when the new version's `part.json` lists the older versions in `reuses_pieces_of` (same major, same models and kit range) and orders exactly the same pieces: add the part's `tests/pieces.fixture.mjs` cases, and `parts/_tools/reuses-pieces.test.mjs` runs both versions on them and compares every paid request byte for byte. Declare it only when the fix never touches a request (a local join, say), never to skip a re-buy.

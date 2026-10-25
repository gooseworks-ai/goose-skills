# Contributing to goose-skills

**In short**
- One folder per skill under `skills/<family>/<slug>/`, with a `SKILL.md` and a `skill.meta.json`. Slugs never change.
- Run `npm run ci` before you push: it runs the same checks as CI's `validate` job. Video atoms also need the atom checks below.
- Open the PR into `dev` (staging). Promoting `dev` to `main` releases to every customer ([DEPLOYMENT.md](DEPLOYMENT.md)).
- **Questions?** Ask the GooseWorks team: open a GitHub issue, or a draft PR into `dev` with the question in its description.
- **Outside contributors:** fork, branch from `dev`, run `npm run ci`, and open the PR into `dev`. You don't need any GooseWorks access. Some docs (`docs/marketing/AGENTS.md`) mention the team's private planning repo; you can ignore those paths.

## Adding a skill

**Start from the template.** Copy [`docs/skill-template/`](docs/skill-template/README.md) into the right family folder and fill it in.

**Where it goes.** One folder per skill, named by its slug:

| It is… | Put it in | Notes |
|---|---|---|
| A new marketing job (a marketer's want, done end to end) | `skills/marketing/<slug>/` | A playbook: `tier: playbook`, `category: playbooks`. Read `docs/marketing/AGENTS.md` first. Prefer a new mode or output of an existing playbook over a new playbook. |
| One step a playbook loads | `skills/marketing/<playbook>-<step>/` | `tier: atom`. Steps several playbooks share get a plain name (`claims-gate`). List it in the playbook's `requires_skills`. |
| A video atom or format renderer | `skills/video/<slug>/` | Starts at `version: 1.0.0`; see "Video atoms" below. |
| A change to what every install starts with | `skills/entry/<slug>/` | The six entry skills. Raise `version` in both SKILL.md and skill.meta.json **and** the plugin `version` in `skills/entry/.claude-plugin/plugin.json` and `.codex-plugin/plugin.json`. `test/entry-skills.test.js` enforces real action names, credits only, no install lines and the size budgets. Test on staging before it reaches `main` ([DEPLOYMENT.md](DEPLOYMENT.md#test-an-entry-skill-change-on-staging-first)). |
| A skill two families use | Ask first | `skills/shared/` holds skills used across families (goose-graphics and the older skills listed in `retired-skills.json`). |

**Every skill has a semver `version`.** Raise it on every change: patch for a fix, minor for a new option, major for a removed input or a new requirement.

**Names never change.** Recipes, the GooseWorks app, routes and installed copies refer to skills by slug, so a published slug is permanent. To replace a skill, add the new one, then retire the old one in `retired-skills.json` with its `replacement` (or `null` and a `reason`).

**Where tests go.** A skill's `tests/` folder stays in this repo and is never published to an install, so a SKILL.md never tells the agent to run it. What CI finds on its own:

- **Python tests** in a skill's `tests/` folder: CI runs `python3 -m pytest -q skills test`, which finds every `test_*.py`.
- **Node tests** run from three places: the repo's `test/` folder (`npm test` runs `test/*.test.js`), a skill's `tests/` folder when the file is named `*.test.js` or `*.test.mjs` (`npm test` runs them through `scripts/run-skill-node-tests.js`), and `parts/<id>/tests/` (`npm run test:parts`). Keep a test next to the skill it checks.
- **Hand tests and fixtures** (`tests/*.md`, sample inputs) can live in the skill's `tests/` folder.

**Then run:**

```bash
npm run ci
```

It runs what CI's `validate` job runs: validate every meta, rebuild `skills-index.json`, check that every link in every skill resolves as installed (`node scripts/check-skill-links.js`), check every tool name (below), and the Node tests. `npm run check:all` runs every CI job that works offline, the atom checks and the part, browser and media tests included; it reports a job whose tools are missing as skipped, and a skip fails it. Commit the regenerated `skills-index.json` with your change. For a video skill, also run the atom checks (below) and `python3 -m pytest -q skills/video/<slug>`.

**A merge conflict in `skills-index.json`: never hand-merge it.** The file is generated, so a hand merge almost always leaves it wrong. Resolve every other conflicted file first, take either side of `skills-index.json`, then rebuild it with `node scripts/build-index.js`, run `npm run ci`, and commit the rebuilt file.

## GooseWorks tool names

A skill may name only the tools the GooseWorks server lists to customers. The list is [`scripts/lib/action-names.json`](scripts/lib/action-names.json):

- `actions`: the listed tools. Name only these.
- `renamed`: old names the server still answers but hides, each with the listed tool to use.
- `removed`: names that are gone.
- `other_tools`: tools of other servers a skill may name, each with its reason. `not_tools`: words that look like old tool names but mean something else.

`npm run check:tools` (in `npm run ci`) reads every file under `skills/` and `docs/` (not test folders). It fails on:

- a renamed or removed name, anywhere, with the listed tool to use;
- `gooseworks:<name>` or `mcp__<any server with goose in its name>__<name>` for an unlisted name;
- in Markdown, an unlisted name phrased as a tool call: "call `<name>`" (any case) or "`<name>` tool"; and, for a name that starts like a GooseWorks tool (`brand_`, `ads_`, `video_`…), "use/run/invoke `<name>`", `<name>(` and a backticked name alone in a table cell.

It reads words, not meaning, so a tool named some other way (plain prose with no backticks, say) can still slip through: name tools in backticks. **When the server's tools change,** the GooseWorks team rebuilds the list from a gooseworks-app checkout:

```bash
node scripts/refresh-action-names.js --app ../gooseworks-app --ref origin/dev
GOOSEWORKS_APP_DIR=../gooseworks-app node --test scripts/__tests__/check-tool-names.test.js   # is the list current?
```

## Skills published from another repo

Some video and shared skills are written in another GooseWorks repo and copied here by a publish step: video skills from **goose-studio**, some shared and older skills from **goose-lab**. The next publish overwrites a change made only here. Change those skills at their source instead, or ask the GooseWorks team first. How to tell:

- **goose-lab** lists the skills it publishes, by slug, in `coworkers/shared/publish-to-goose-skills/published-skills.json`.
- **goose-studio** marks a skill it publishes whole with `source_commit` and `source_hash` in its `skill.meta.json` and a `release.json` beside it (today: `video-production-harness`; CI checks its files against `release.json`, so don't edit them here).
- **Also in goose-studio** (24 Oct 2026), with a different copy there: brand-research, create-apple-notes-mockup, create-chatgpt-mockup, create-image-gpt-image-fal, create-imessage-mockup, create-kinetic-typography, create-music-elevenlabs, create-video-seedance-2-fal, mix-master, remix-graphic-ad-from-reference, render-ios-keyboard, stitch-videos-ffmpeg and watch. A fix to one of these here should also go to goose-studio, or the next publish from there undoes it.

**To make a marketing playbook use it,** reference it from the playbook's SKILL.md as `` the `<slug>` skill (`../<slug>/SKILL.md`) `` and list it in `requires_skills`. **To make GooseWorks route customers to it,** add its row to `skills/entry/gooseworks/routes.json` and run `node scripts/build-router.js`, which rewrites the router's tables and the Brand Growth collection's routes (CI checks they match).

## Keep SKILL.md bodies free of shell

Hosted agents fetch a SKILL.md body through the GooseWorks API and send it on in their next model call, and that traffic passes a web firewall that blocks text that looks like an exploit. So in the **body** of a SKILL.md, prefer plain words to:

- shell-variable forms (a dollar sign before a name, brace expansion)
- literal absolute filesystem paths
- install commands and code-host URLs
- names of dependency folders often used in exploits

Concrete paths and commands belong in scripts, their READMEs and tool wrappers. When a body must refer to a location, describe it ("the project folder", "the dependency folder").

**What is checked today:** entry skills (`test/entry-skills.test.js`: no install lines) and video atoms (`scripts/atom-lint.js`: no install or sign-in lines, no key requests). Marketing and shared skills are not linted for this yet, and a few older ones still carry install lines; don't add new ones.

## Other authoring rules

- Lead with what the skill does and when to use it (the `description` field is the agent's matching signal).
- (Optional) Set `example_prompt` in `skill.meta.json` to a short, copyable prompt that shows the skill in action. It's surfaced in the catalog and docs; if omitted, one is generated from the description.
- Use plain prose over code blocks where possible — the agent reads this, not a build tool.
- Keep the body focused on agent behaviour: decision flow, non-negotiables, troubleshooting. Tool plumbing belongs elsewhere.
- After editing a skill, run `npm run ci`.
- The GooseWorks backend sync reads the catalog from GitHub; it does not accept a local-directory flag. To test catalog ingestion against a dev database, push a draft branch, set the backend's predefined-skills source ref to that branch, and run the forced catalog sync.

## Video atoms

Video atoms are the skills under `skills/video/` whose `category` is not `composites` or `playbooks`. They hold craft: how to drive a model or tool and how to check the piece. CI runs these checks on every pull request:

- **Version.** Each atom has a semver `version` in `skill.meta.json` (and the same number in any SKILL.md frontmatter `version`). A pull request that changes any file in an atom raises it: patch for a fix, minor for a new option, mode or model, major for a removed or renamed input or a new requirement. A new atom starts at `1.0.0`. Run `node scripts/check-atom-versions.js --base origin/<base branch>`.
- **What an atom may say.** No dollar or credit amounts, no approval or spend-gate steps, no install or sign-in lines, no requests for provider keys, no AI app names, no removed action names, no retired model ids, no full copy of the billing helper (`media_proxy.py`; a skill that still carries a copy keeps it byte-identical to `skills/video/media-proxy`'s, which `test/media-proxy-copies.test.js` checks), and SKILL.md under 16 KB. CI runs it with `--strict`: every finding fails. An atom marked `status: superseded` (replaced by a part) is skipped only when its frontmatter's `superseded_by` names published, not-withdrawn parts as `id@x.y.z` and its body opens with a one-paragraph `> **Superseded` note naming each of them. A true finding that is creative content (a mockup that draws a named app) goes in the atom's `lint_allow` with a reason. Run `node scripts/atom-lint.js --base origin/<base branch> --strict`.
- **Parts.** Published part versions under `parts/<id>/<x.y.z>/` never change, and `parts/index.json` is rebuilt with `node scripts/build-parts-index.js`. A part never carries or imports the billing helper: it orders paid pieces only through `ctx.line.order`. Run `node scripts/check-parts.js --base origin/<base branch>`.
- **Moving approved videos to a fix.** A free part reaches approved videos at its newest patch of the same minor by itself. A paid part reaches them only when the new version's `part.json` lists the older versions in `reuses_pieces_of` (same major, same models and kit range) and orders exactly the same pieces: add the part's `tests/pieces.fixture.mjs` cases, and `parts/_tools/reuses-pieces.test.mjs` runs both versions on them and compares every paid request byte for byte. Declare it only when the fix never touches a request (a local join, say), never to skip a re-buy.

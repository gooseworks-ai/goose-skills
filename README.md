<div align="center">
<img width="3148" height="1828" alt="CleanShot 2026-07-13 at 20 15 47@2x" src="https://github.com/user-attachments/assets/4984e98c-d53e-4191-a64a-59533cbc0847" />
<img width="3350" height="1802" alt="CleanShot 2026-07-13 at 20 16 54@2x" src="https://github.com/user-attachments/assets/2e912363-8f86-4754-adc9-d6b23f798abd" />

# AI Skills for Brand Growth

**Put your AI agent on the growth team.**

Research customers and competitors, analyze what is working, create the next campaign, and learn from the result. Goose Skills gives Claude Code, Cursor, Codex, and other coding agents 14 marketing playbooks and the video-ad skills behind GooseWorks.

Browse all skills at https://skills.gooseworks.ai

Works with [Claude Code](https://claude.ai/claude-code) &middot; [Cursor](https://cursor.sh) &middot; [Codex](https://openai.com/codex)

[![npm version](https://img.shields.io/npm/v/goose-skills?color=blue)](https://www.npmjs.com/package/goose-skills)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
[![Skills](https://img.shields.io/badge/skills-marketing-orange)]()

</div>

---

## What's in the catalog

| Folder | What it holds | Count |
|---|---|---:|
| `skills/marketing/` | **14 marketing playbooks** (one marketer job each, end to end), the 70 steps they load, and 2 foundation skills. Every folder is published | 86 |
| `skills/video/` | **Video-ad skills**: render atoms, format renderers, mockups, voice, music and the production harness | 67 |
| `skills/shared/` | Skills used across families: the 3 current goose-graphics skills, and 24 older skills that a video skill, a playbook or the GooseWorks app still uses. [retired-skills.json](retired-skills.json) lists each one and its user | 27 |
| `skills/entry/` | **The entry skills** `gooseworks install` puts in every agent: the `gooseworks` router, `goose-ads`, `goose-video`, `make-custom-video`, `goose-video-local`, `goose-product-photos`. Routing lives in `skills/entry/gooseworks/routes.json`. The same folder is the Claude Code and Codex plugin (see [Entry skills and the plugin](#entry-skills-and-the-plugin)) | 6 |

The old GTM library was deleted on 23 Oct 2026. [retired-skills.json](retired-skills.json) maps every retired name to the playbook that replaced it (or says why none did), and the old source stays readable at tag `legacy-gtm-final`.

## Contents

- [Quick Start](#quick-start)
- [Brand Growth collection](#brand-growth-collection)
- [Commands](#commands)
- [Repo layout](#repo-layout)
- [Usage Examples](#usage-examples)
- [Building from Source](#building-from-source)
- [Entry skills and the plugin](#entry-skills-and-the-plugin)
- [Skill Metadata Contract](#skill-metadata-contract)
- [Security & Trust](#security--trust)
- [Agent catalog releases](#agent-catalog-releases)
- [License](#license)

---

## Quick Start


### AI Coding Agents (Claude Code, Cursor, Codex, etc)
**Paste this into your coding agent** and it sets everything up:

```
Install gooseworks: https://gooseworks.ai/install.md
```

Your agent reads that page and follows it: it **asks you before installing anything**, installs the skills and the `gooseworks` MCP server with the right flag for your agent, opens a browser for Google sign-in, checks the install with `npx gooseworks@latest doctor`, and (after you restart the agent) offers to set up your company. The page only ever runs `npx gooseworks@latest …` and touches your agent's skills folder, its MCP config and `~/.gooseworks/credentials.json`, nothing else.

Want one skill in particular? Add it to the line: `Install gooseworks: https://gooseworks.ai/install.md, including the goose-graphics skill.`

After the install, use the skills with `/gooseworks <prompt>`.

### Claude Cowork

Paste the same line into Cowork while working inside a local folder on your machine:

```
Install gooseworks: https://gooseworks.ai/install.md
```

Then use the skills like this:
```
Use /gooseworks skill to generate some ad creatives
```

### Chat apps (claude.ai, ChatGPT)

Chat apps cannot run the install. Add `https://mcp.gooseworks.ai/mcp` as a custom connector in the app's settings and sign in with Google. The same line above also works: the agent will give you those instructions.

### Run it yourself
Prefer the terminal? The same thing, typed by hand (keep `--mcp`; `--all` includes it):

```bash
npx gooseworks@latest install --claude --mcp   # or --cursor --mcp, --codex --mcp
npx gooseworks@latest install --all            # every detected agent
```

This gives your coding agent access to the **current skills catalog**. After installing, just ask your agent to use any skill by name.

> If you want a cloud-based AI coworker that already knows all these skills and more, sign up to [Gooseworks](https://app.gooseworks.ai)

---

## Brand Growth collection

The **Brand Growth** collection is the 14 marketing playbooks, grouped by stage. It is not a separate package or command: install GooseWorks once, then ask `/gooseworks` for the outcome you need.

| Stage | What your agent can do | Playbooks |
|---|---|---|
| **Research** | Decide where to start; read the market, competitors and buyers; plan the campaign | `where-to-start`, `research-market`, `research-competitors`, `research-audience`, `plan-campaign` |
| **Analyze** | See what worked on every channel, run the paid accounts week to week, and show up in search and AI answers | `analyze-performance`, `run-paid-campaigns`, `improve-search-visibility` |
| **Create** | Make static ads, content, organic social, email flows, creator briefs and outreach | `make-static-ads`, `make-content`, `run-organic-social`, `email-lifecycle`, `work-with-creators`, `write-outreach` |

Video ads and product photos go through the `goose-video` and `goose-product-photos` GooseWorks skills, which use the video skills in `skills/video/`.

[Browse the Brand Growth collection](https://skills.gooseworks.ai/?collection=brand-growth#library)

After installation, start with:

```text
/gooseworks onboard me
```

The agent will collect the useful company context for future growth work and finish by asking what you want to do first. Existing users can skip onboarding and keep using `/gooseworks` exactly as they do today.

---

## Commands

Two command-line tools work with this catalog.

**`gooseworks`** is the GooseWorks CLI: it installs the entry skills and the MCP server, and works with your account.

```bash
npx gooseworks search "reddit scraping"   # Search the skill catalog
npx gooseworks credits                     # Check your credit balance
npx gooseworks update                      # Update to latest skill version
```

**`goose-skills`** is this repo's own npm package. It installs one catalog skill, and every skill it requires, without a GooseWorks account. It reads `skills-index.json` from the `main` branch on GitHub, so it always installs what production serves.

```bash
npx goose-skills list                          # Every published skill
npx goose-skills info make-static-ads          # One skill's details and dependencies
npx goose-skills install make-static-ads       # Into ~/.claude/skills/<slug>/ (default: Claude Code)
npx goose-skills install make-static-ads --codex
npx goose-skills install make-static-ads --cursor --project-dir /path/to/project
```

A retired slug is refused with its replacement's install command. Most skills still need the GooseWorks MCP server for paid media and live data.

---

## Repo layout

```
skills/
  marketing/<slug>/    marketing playbooks, their steps, foundation skills
  video/<slug>/        video-ad skills
  shared/<slug>/       skills used across families (see retired-skills.json)
  entry/<slug>/        the skills every GooseWorks install starts with; routes.json is the routing source
  entry/.claude-plugin/, entry/.codex-plugin/   the plugin manifests for those same skills
parts/<id>/<x.y.z>/    versioned video building blocks the GooseWorks kit loads (never edited once published)
collections/           curated paths through the catalog (Brand Growth)
docs/marketing/        the marketing build guide and backlog
evals/marketing/       routing and behaviour evals for the playbooks
drafts/marketing/      playbooks built but not released yet
schemas/               the skill.meta.json schema
scripts/, test/        index builder, validators and tests
bin/                   the goose-skills npm CLI
skills-index.json      the generated catalog every consumer reads
retired-skills.json    retired names, their replacements, and why kept skills stay
```

A skill's own `tests/` folder is for builders: it stays in this repo and is never published to an install.

One flat folder per skill, so a link to another skill is always `../<slug>/SKILL.md`. Skill names are unique across the whole catalog and never change: recipes, the GooseWorks app and installed copies refer to skills by name. See [CONTRIBUTING.md](CONTRIBUTING.md) to add one.

Browse and search every skill at **[skills.gooseworks.ai](https://skills.gooseworks.ai)**.

---

## Usage Examples

After installing, just ask your coding agent naturally:

```
"/gooseworks Make ten fresh static ads for my brand this week"
"/gooseworks What are my competitors running right now, and what works for them?"
"/gooseworks Find 100 heads of marketing at DTC skincare brands"
"/gooseworks Make a video ad for our new serum"
"/gooseworks Use the goose-graphics skill to create a LinkedIn carousel about our launch"
```

Your agent will search the GooseWorks catalog, download the skill, and run it automatically.

---

## Building from Source

```bash
git clone https://github.com/gooseworks-ai/goose-skills.git
cd goose-skills
node scripts/build-index.js      # Generate skills-index.json
node scripts/validate-skills.js  # Validate SKILL.md + skill.meta.json contract
node scripts/check-skill-links.js     # Every link in every skill resolves as installed
npm test
npm run ci                       # The checks above in one command (see CONTRIBUTING.md)
node bin/goose-skills.js list    # List the published catalog (reads main on GitHub)
npm run test:parts               # Part tests (needs ffmpeg; browser tests need playwright-core)
```

The part tests run on the GooseWorks kit's own ffmpeg build when it is installed (`~/.gooseworks/kit/bin/ffmpeg-b<version>`), else the one on your PATH; set `KIT_FFMPEG` to a binary path (or `ffmpeg` for the PATH one, with `KIT_FFPROBE` if ffprobe is elsewhere) to choose. Every run prints the ffmpeg it used. The browser tests take `PLAYWRIGHT_CORE_PATH` (a playwright-core folder) and `KIT_CHROMIUM` (a Chromium binary). CI sets `KIT_FFMPEG=ffmpeg`.

---

## Entry skills and the plugin

`skills/entry/` is published two ways:

- **The catalog.** `gooseworks install` and `gooseworks update` read the entry skills from `skills-index.json` on `main`, and the GooseWorks app serves the synced copy.
- **The plugin.** `skills/entry/.claude-plugin/plugin.json` and `skills/entry/.codex-plugin/plugin.json` make the folder a Claude Code and Codex plugin. The GooseWorks plugin marketplace points at this folder on `main`.

**When you change an entry skill, raise the plugin `version` in both manifests** (and the skill's own `version`). Plugin hosts only update when that number rises. `test/entry-skills.test.js` checks that both manifests list exactly the entry skills and carry a valid version.

---

## Skill Metadata Contract

Each skill folder (`skills/<family>/<slug>/`) must include:

- **`SKILL.md`** — the instructions, with `name` and `description` frontmatter (description at most 1,024 characters)
- **`skill.meta.json`** — machine-readable metadata

`skill.meta.json` fields:

| Field | Required | Description |
|-------|----------|-------------|
| `slug` | Yes | Unique kebab-case identifier; the folder name |
| `category` | Yes | `capabilities`, `composites`, or `playbooks` (the GooseWorks app only syncs these) |
| `domain` | `shared` only | Catalog grouping; marketing skills default to `marketing-agent`, video skills to `ads`, entry skills to `gooseworks` |
| `tier` | Marketing and entry | `playbook`, `atom` (a step) or `foundation`; `entry` for skills/entry |
| `version` | Yes | Semver; marketing and entry skills repeat it in SKILL.md frontmatter; raise it on every change |
| `requires_skills` | No | Slugs this skill loads; each must exist |
| `tags` | Yes | String array of category tags |
| `installation.base_command` | Yes | Install command |
| `installation.supports` | Yes | Array: `claude`, `codex`, `cursor` |
| `features` | No | Feature flags |
| `github_url` | No | Source repository URL |
| `author` | No | Skill author |
| `example_prompt` | No | Copyable prompt shown in the catalog and docs for trying the skill |

---

## Security & Trust

These skills run inside your coding agent, so it's worth knowing exactly what they do:

- **Open source & inspectable.** Every skill — its `SKILL.md` instructions and all scripts — lives in this repo under the MIT license. The `gooseworks` CLI fetches skills at runtime so recipes stay current, but the source you'd run is right here to read, diff, or pin before you run it.
- **Scripts run locally.** Skill scripts execute on your machine and write to `/tmp/gooseworks-scripts/`, never into your project directory. Only API requests go through GooseWorks servers; review any script before letting your agent run it.
- **Your agent stays in control.** The skills are a tool your agent reaches for when it fits the task (data at scale, sources behind auth, a specific provider) — not a replacement for its built-in web search or fetch on quick lookups. You can read or edit any installed `SKILL.md` to tune that behavior.
- **Credentials stay local.** Auth is a Bearer token stored at `~/.gooseworks/credentials.json` (file mode `0600`). Third-party provider keys are held server-side — your token never touches them. All network calls are HTTPS.
- **The MCP server is part of the install.** The install registers the GooseWorks MCP server in your agent's config, because the skills call it for your account. To disconnect it, remove the `gooseworks` entry from that config (`~/.claude.json`, `~/.codex/config.toml` or `~/.cursor/mcp.json`).

Found something that looks off? [Open an issue](https://github.com/gooseworks-ai/goose-skills/issues) — we'd rather fix it in public.

---

## Agent catalog releases

Feature PRs target `dev` and update staging after CI passes. Promote tested changes to `main` for production; that switches every customer's entry skills and the plugin too. See [DEPLOYMENT.md](DEPLOYMENT.md).

---

## License

MIT &mdash; see [LICENSE](LICENSE) for details.

The skill files and CLI in this repository are MIT-licensed. The GooseWorks API they connect to is a separate paid service governed by its own [terms](https://gooseworks.ai/terms).

<div align="center">

**Built by [GooseWorks](https://gooseworks.ai)**

[Get Started](https://app.gooseworks.ai) &middot; [Report an Issue](https://github.com/gooseworks-ai/goose-skills/issues)

</div>

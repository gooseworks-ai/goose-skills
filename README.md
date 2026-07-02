<div align="center">

> 🎬 **New:** Check out [**goose-video**](https://github.com/gooseworks-ai/goose-video) — our library of AI video generation skills.

<img width="1270" height="760" alt="1" src="https://github.com/user-attachments/assets/60212c5c-e372-455c-a937-2ff16e235ee6" />


# Goose Skills

**Growth & GTM skills for AI coding agents. Ready-to-use skills for sales, marketing, competitive intelligence, SEO, and lead generation.**

Browse all skills at https://skills.gooseworks.ai

Works with [Claude Code](https://claude.ai/claude-code) &middot; [Cursor](https://cursor.sh) &middot; [Codex](https://openai.com/codex)

[![npm version](https://img.shields.io/npm/v/goose-skills?color=blue)](https://www.npmjs.com/package/goose-skills)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
[![Skills](https://img.shields.io/badge/skills-200%2B-orange)]()

<br />

[<img src="https://img.shields.io/badge/Get%20Started%20on%20GooseWorks-%E2%86%92-black?style=for-the-badge&labelColor=000000" alt="Get Started on GooseWorks" />](https://app.gooseworks.ai)

</div>

---

## Contents

- [Quick Start](#-quick-start)
- [Commands](#-commands)
- [Skills Catalog](#-skills-catalog)
- [Usage Examples](#-usage-examples)
- [Building from Source](#-building-from-source)
- [Skill Metadata Contract](#-skill-metadata-contract)
- [Security & Trust](#-security--trust)
- [License](#-license)

---

## Quick Start

**Paste this into your coding agent** (Claude Code, Cursor, or Codex) and it'll set everything up:

> Install the Gooseworks skills for yourself: in the terminal, run `npx gooseworks install` with the flag for your agent — `--claude`, `--cursor`, or `--codex`. It'll open a browser to sign in and set up the tools, then confirm it worked.

Prefer to run it yourself? Use the command directly:

```bash
npx gooseworks install --claude    # Claude Code
npx gooseworks install --cursor    # Cursor
npx gooseworks install --codex     # Codex
npx gooseworks install --all       # All detected agents
```

This gives your coding agent access to the **full catalog of 200+ skills**. After installing, just ask your agent to use any skill by name.

> If you want a cloud-based AI coworker that already knows all these skills and more, sign up to [Gooseworks](https://app.gooseworks.ai)

---

## Commands

```bash
npx gooseworks search "reddit scraping"   # Search the skill catalog
npx gooseworks credits                     # Check your credit balance
npx gooseworks update                      # Update to latest skill version
```

---

## Skills Catalog

200+ skills across the growth stack, grouped by focus area:

| Category | What's inside |
|----------|---------------|
| **Ads** | Research, build, and analyze paid campaigns across Meta and Google |
| **SEO** | Keyword research, content gaps, SERP analysis, technical audits |
| **Lead generation** | Find, enrich, and qualify prospects for your pipeline |
| **Outreach** | Draft, personalize, and run outbound across email and social |
| **Content** | Blog posts, social content, carousels, video scripts, newsletters |
| **Research** | Company, market, and prospect deep-dives |
| **Competitive intel** | Track competitor pricing, launches, positioning, and ads |
| **Monitoring** | Watch for mentions, signals, and changes across the web |
| **Social** | Scrape and analyze social platforms and audiences |
| **Brand** | Voice, positioning, and visual brand assets |

Browse and search every skill at **[skills.gooseworks.ai](https://skills.gooseworks.ai)**.

---

## Usage Examples

After installing, just ask your coding agent naturally:

```
"Use the reddit-post-finder skill to search r/startups"
"Use the apollo-lead-finder skill to find CTOs at AI companies"
"Use the competitor-intel skill to research Acme Corp"
"Use the goose-graphics skill to create a LinkedIn carousel about our launch"
```

Your agent will search the GooseWorks catalog, download the skill, and run it automatically.

---

## Building from Source

```bash
git clone https://github.com/gooseworks-ai/goose-skills.git
cd goose-skills
node scripts/validate-skills.js  # Validate SKILL.md + skill.meta.json contract
node scripts/build-index.js      # Generate skills-index.json
node bin/goose-skills.js list    # Test locally
```

---

## Skill Metadata Contract

Each skill directory must include:

- **`SKILL.md`** — Skill documentation and usage guide
- **`skill.meta.json`** — Machine-readable metadata

`skill.meta.json` fields:

| Field | Required | Description |
|-------|----------|-------------|
| `slug` | Yes | Unique kebab-case identifier |
| `category` | Yes | `capabilities`, `composites`, or `playbooks` |
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
- **Credentials stay local.** Auth is a Bearer token stored at `~/.gooseworks/credentials.json` (file mode `0600`). Third-party provider keys (Apify, Apollo, etc.) are held server-side — your token never touches them. All network calls are HTTPS.
- **The MCP server is opt-in.** Registering the GooseWorks MCP server is off by default; it only happens if you explicitly run `gooseworks install --mcp`.

Found something that looks off? [Open an issue](https://github.com/gooseworks-ai/goose-skills/issues) — we'd rather fix it in public.

---

## License

MIT &mdash; see [LICENSE](LICENSE) for details.

<div align="center">

**Built by [GooseWorks](https://gooseworks.sh)**

[Get Started](https://app.gooseworks.ai) &middot; [Report an Issue](https://github.com/gooseworks-ai/goose-skills/issues)

</div>

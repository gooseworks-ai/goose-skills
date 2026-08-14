<div align="center">
<img width="3148" height="1828" alt="CleanShot 2026-07-13 at 20 15 47@2x" src="https://github.com/user-attachments/assets/4984e98c-d53e-4191-a64a-59533cbc0847" />
<img width="3350" height="1802" alt="CleanShot 2026-07-13 at 20 16 54@2x" src="https://github.com/user-attachments/assets/2e912363-8f86-4754-adc9-d6b23f798abd" />

# AI Skills for Brand Growth

**Put your AI agent on the growth team.**

Research customers and competitors, analyze what is working, create the next campaign, and learn from the result. Goose Skills gives Claude Code, Cursor, Codex, and other coding agents ready-to-use workflows for ads, social media, content, competitive intelligence, SEO, lead generation, and GTM.

Browse all skills at https://skills.gooseworks.ai

Works with [Claude Code](https://claude.ai/claude-code) &middot; [Cursor](https://cursor.sh) &middot; [Codex](https://openai.com/codex)

[![npm version](https://img.shields.io/npm/v/goose-skills?color=blue)](https://www.npmjs.com/package/goose-skills)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
[![Skills](https://img.shields.io/badge/skills-200%2B-orange)]()

</div>

---

## Contents

- [Quick Start](#-quick-start)
- [Brand Growth collection](#-brand-growth-collection)
- [Commands](#-commands)
- [Skills Catalog](#-skills-catalog)
- [Usage Examples](#-usage-examples)
- [Building from Source](#-building-from-source)
- [Skill Metadata Contract](#-skill-metadata-contract)
- [Security & Trust](#-security--trust)
- [License](#-license)

---

## Quick Start


### AI Coding Agents (Claude Code, Cursor, Codex, etc)
**Paste this into your coding agent** (Claude Code, Cursor, or Codex) and it'll set everything up:

```
Install the Gooseworks skills:

In the terminal, run `npx gooseworks install --all`.

Then run `npx gooseworks login` and it'll open a browser to sign in and set up the tools, then confirm it worked.

The skills can be used with /gooseworks <prompt>
```

### Claude Cowork

Run this command in a terminal first:
```
npx gooseworks install --all
```

Then authenticate:
```
npx gooseworks login
```

Then make sure you're working inside a local folder on your machine, and then you can use the skills in Cowork like this:
```
Use /gooseworks skill to generate some ad creatives
```


### Install manually
Prefer to run it yourself? Use the command directly:

```bash
npx gooseworks install --all       # All detected agents
```

This gives your coding agent access to the **full catalog of 200+ skills**. After installing, just ask your agent to use any skill by name.

> If you want a cloud-based AI coworker that already knows all these skills and more, sign up to [Gooseworks](https://app.gooseworks.ai)

---

## Brand Growth collection

The **Brand Growth** collection is a curated path through the normal Goose Skills catalog for consumer and ecommerce brand work. It is not a separate package or command: install GooseWorks once, then ask `/gooseworks` for the outcome you need.

| Stage | What your agent can do | Example skills |
|---|---|---|
| **Research** | Understand the brand, customers, competitors, audiences, creators, trends, comments, and product demand | `brand-research`, `audience-research`, `comment-mining`, `competitor-social-research`, `influencer-prospecting`, `trend-discovery`, `product-demand-research` |
| **Analyze** | Diagnose ads, creator profiles, transcripts, policy risk, landing-page message match, and unusual social performance | `competitor-ad-intelligence`, `creator-profile-teardown`, `transcript-intelligence`, `meta-ads-analyzer`, `meta-ad-policy-checker`, `ad-to-landing-page-auditor`, `outlier-post-finder` |
| **Create** | Repurpose research, remix graphic ads, make product photography and social graphics, and animate static images | `content-repurposing`, `remix-graphic-ad-from-reference`, `product-photoshoot`, `goose-graphics`, `animate-image` |
| **Learn and iterate** | Bring results back into research and analysis, then decide the next test | Re-run the relevant analysis skill with current performance and audience evidence |

ScrapeCreators powers structured public social and ad-library research behind several workflows. Signed-in GooseWorks users access it through the managed first-party proxy and do not need a separate ScrapeCreators key. The user-facing skills turn that source data into a brief, shortlist, analysis, or recommendation instead of returning raw API output.

[Browse the Brand Growth collection](https://skills.gooseworks.ai/?collection=brand-growth#library)

After installation, start with:

```text
/gooseworks onboard me
```

The agent will collect the useful company context for future growth work and finish by asking what you want to do first. Existing users can skip onboarding and keep using `/gooseworks` exactly as they do today.

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
"/gooseworks Generate static ad creatives for my brand"
"/gooseworks Use the reddit-post-finder skill to search r/startups"
"/gooseworks Use the apollo-lead-finder skill to find CTOs at AI companies"
"/gooseworks Use the competitor-intel skill to research Acme Corp"
"/gooseworks Use the goose-graphics skill to create a LinkedIn carousel about our launch"
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

The skill files and CLI in this repository are MIT-licensed. The GooseWorks API they connect to is a separate paid service governed by its own [terms](https://gooseworks.ai/terms).

<div align="center">

**Built by [GooseWorks](https://gooseworks.sh)**

[Get Started](https://app.gooseworks.ai) &middot; [Report an Issue](https://github.com/gooseworks-ai/goose-skills/issues)

</div>

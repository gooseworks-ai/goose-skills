# Goose Skills

GTM skills for [Claude Code](https://claude.ai/claude-code). Ready-to-use skills for sales, marketing, competitive intelligence, SEO, and lead generation.

## Quick Install

```bash
npx goose-skills install <slug>
```

This installs to `~/.claude/skills/<slug>/` by default (Claude Code target).

## Platform Targets

Use one target flag per install:

```bash
npx goose-skills install google-ad-scraper --claude
npx goose-skills install google-ad-scraper --codex
npx goose-skills install google-ad-scraper --cursor --project-dir /path/to/repo
```

- `--claude` (default): installs under `~/.claude/skills/<slug>/`
- `--codex`: installs under `~/.claude/skills/<slug>/`, then copies to `~/.codex/skills/<slug>/`
- `--cursor`: installs under `~/.claude/skills/<slug>/`, then writes a project-local Cursor rule file at `.cursor/rules/goose-<slug>.mdc`

Notes:
- Only one target flag is allowed per command.
- `--cursor` requires `--project-dir`.

## Available Skills

### Capabilities (31)

Atomic, single-purpose tools that do one thing well.

#### Research & Monitor
| Skill | Description |
|-------|-------------|
| `reddit-scraper` | Scrape Reddit posts/comments by keyword, subreddit, or time range |
| `twitter-scraper` | Search Twitter/X posts with date filtering |
| `linkedin-post-research` | Search LinkedIn posts by keyword, output to Google Sheet |
| `linkedin-profile-post-scraper` | Scrape recent posts from specific LinkedIn profiles |
| `linkedin-commenter-extractor` | Extract commenters from LinkedIn posts |
| `linkedin-influencer-discovery` | Find LinkedIn thought leaders in any space |
| `blog-scraper` | Monitor blogs via RSS feeds with Apify fallback |
| `hacker-news-scraper` | Search HN stories/comments via free Algolia API |
| `product-hunt-scraper` | Scrape trending Product Hunt launches |
| `review-scraper` | Scrape reviews from G2, Capterra, Trustpilot |
| `youtube-watcher` | YouTube channel monitoring via yt-dlp |
| `youtube-apify-transcript` | YouTube transcript extraction via Apify |
| `web-archive-scraper` | Wayback Machine scraper for archived sites |
| `newsletter-sponsorship-finder` | Find newsletters for sponsorship opportunities |

#### Find People & Leads
| Skill | Description |
|-------|-------------|
| `company-contact-finder` | Find decision-makers at companies |
| `luma-event-attendees` | Scrape event attendee lists from Luma |
| `conference-speaker-scraper` | Extract speakers from conference websites |
| `job-posting-intent` | Detect hiring signals from job postings |

#### SEO & Content Analysis
| Skill | Description |
|-------|-------------|
| `seo-domain-analyzer` | Domain SEO metrics via Semrush/Ahrefs |
| `seo-traffic-analyzer` | Website traffic estimation |
| `site-content-catalog` | Full website content inventory |
| `aeo-visibility` | AI answer engine visibility testing |
| `google-ad-scraper` | Google Ads Transparency scraper |
| `meta-ad-scraper` | Meta Ad Library scraper |

#### Brand & Messaging
| Skill | Description |
|-------|-------------|
| `brand-voice-extractor` | Extract tone/style from published content |
| `visual-brand-extractor` | Extract visual brand (colors, fonts, layout) |
| `icp-persona-builder` | Build synthetic ICP buyer personas |
| `icp-website-review` | Score a website through ICP eyes |

#### Content Creation
| Skill | Description |
|-------|-------------|
| `content-asset-creator` | Generate branded HTML reports and pages |
| `create-html-slides` | Create HTML slide presentations |
| `brainstorming-partner` | Structured brainstorming frameworks |

### Composites (5)

Multi-skill chains that combine capabilities into pipelines.

| Skill | Description |
|-------|-------------|
| `competitor-intel` | Multi-source competitor tracking (Reddit, Twitter, LinkedIn, blogs, reviews) |
| `seo-content-audit` | Full SEO audit: content inventory + metrics + gaps + voice |
| `industry-scanner` | Daily industry intelligence briefing |
| `company-current-gtm-analysis` | Comprehensive GTM scoring with white space map |
| `icp-website-audit` | End-to-end website audit through ICP eyes |

## CLI Commands

```bash
npx goose-skills list             # List all available skills
npx goose-skills install <slug>   # Install for Claude Code (default)
npx goose-skills install <slug> --codex
npx goose-skills install <slug> --cursor --project-dir /path/to/repo
npx goose-skills info <slug>      # Show skill details
```

## Using Skills with Claude Code

After installing a skill, add it to your Claude Code project:

```bash
# Copy the SKILL.md to your project's skills directory
mkdir -p .claude/skills
cp ~/.claude/skills/<slug>/SKILL.md .claude/skills/<slug>.md
```

The skill's SKILL.md file contains instructions that Claude Code will follow when you reference the skill.

## Building from Source

```bash
git clone https://github.com/athina-ai/goose-skills.git
cd goose-skills
node scripts/build-index.js   # Generate skills-index.json
node bin/goose-skills.js list  # Test locally
```

## License

MIT

## Author

[Athina AI](https://athina.ai)

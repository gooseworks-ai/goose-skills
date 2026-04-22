# Goose Skills

GTM skills for [Claude Code](https://claude.ai/claude-code), [Cursor](https://cursor.sh), and [Codex](https://openai.com/codex). Ready-to-use skills for sales, marketing, competitive intelligence, SEO, and lead generation.

## Quick Install

```bash
npx gooseworks install --claude    # Claude Code
npx gooseworks install --cursor    # Cursor
npx gooseworks install --codex     # Codex
npx gooseworks install --all       # All detected agents
```

This installs the GooseWorks master skill, which gives your coding agent access to the full catalog of 100+ skills. After installing, ask your agent to use any skill by name (e.g., "Use the reddit-post-finder skill").

## Other Commands

```bash
npx gooseworks search "reddit scraping"   # Search the skill catalog
npx gooseworks credits                     # Check your credit balance
npx gooseworks update                      # Update to latest skill version
```

## Available Skills (108)

**51 Capabilities** (atomic, single-purpose tools) | **52 Composites** (multi-skill chains) | **5 Playbooks** (end-to-end workflows)

### Ads (9)
| Skill | Type | Description |
|-------|------|-------------|
| `ad-angle-miner` | Comp | Mine converting ad angles from reviews, Reddit, competitor ads |
| `ad-campaign-analyzer` | Comp | Analyze ad campaign performance (Google, Meta, LinkedIn) |
| `ad-to-landing-page-auditor` | Comp | Audit message match between ads and landing pages |
| `competitor-ad-intelligence` | Comp | Scrape competitor ads from Meta Ad Library and Google Ads Transparency Center, analyze creative patterns |
| `google-ad-scraper` | Cap | Scrape Google Ads Transparency Center |
| `google-search-ads-builder` | Comp | End-to-end Google Search Ads campaign builder |
| `meta-ads-campaign-builder` | Comp | End-to-end Meta Ads campaign builder |
| `paid-channel-prioritizer` | Comp | Recommend which paid channels to start with |
| `trending-ad-hook-spotter` | Comp | Monitor social for trending narratives to map to ad hooks |

### Brand (4)
| Skill | Type | Description |
|-------|------|-------------|
| `brand-voice-extractor` | Cap | Extract tone/style from published content |
| `launch-positioning-builder` | Comp | Research competitors, generate positioning document |
| `messaging-ab-tester` | Comp | Generate messaging variants, deploy as LinkedIn/email tests |
| `visual-brand-extractor` | Cap | Extract visual branding (colors, fonts, layout) |

### Competitive Intel (9)
| Skill | Type | Description |
|-------|------|-------------|
| `battlecard-generator` | Comp | Research competitor, produce structured sales battlecard |
| `company-current-gtm-analysis` | Comp | Comprehensive GTM scoring with white space map |
| `competitive-pricing-intel` | Comp | Monitor competitor pricing pages and changes |
| `competitor-intel` | Comp | Multi-source competitor tracking |
| `competitor-monitoring-system` | Play | Set up ongoing competitive intelligence monitoring |
| `industry-scanner` | Comp | Daily industry intelligence briefing |
| `seo-domain-analyzer` | Cap | Domain SEO metrics via Semrush/Ahrefs |
| `seo-traffic-analyzer` | Cap | Website traffic and keyword analysis |
| `tech-stack-teardown` | Cap | Reverse-engineer a company's sales/marketing tech stack |

### Content (15)
| Skill | Type | Description |
|-------|------|-------------|
| `blog-feed-monitor` | Cap | Scrape blogs via RSS feeds with Apify fallback |
| `campaign-brief-generator` | Comp | Generate complete marketing campaign brief |
| `content-asset-creator` | Cap | Generate branded HTML reports and pages |
| `content-brief-factory` | Comp | Detailed content briefs at scale with SERP analysis |
| `create-html-carousel` | Cap | *(deprecated — use `goose-graphics`)* Create LinkedIn carousel posts as PNG images |
| `create-html-slides` | Cap | *(deprecated — use `goose-graphics`)* Create animation-rich HTML presentations |
| `create-linkedin-content` | Cap | Draft voice-tuned LinkedIn post variants from a brief, with LinkedIn defaults and banned-phrase self-check |
| `create-workflow-diagram` | Cap | Create FigJam/Miro-style workflow diagrams as PNGs |
| `create-x-content` | Cap | Draft voice-tuned X/Twitter post variants with distinct framings and banned-phrase self-check |
| `feature-launch-playbook` | Comp | Generate full launch kit from a feature/update |
| `generate-voice-guide` | Cap | Generate a personal voice guide for X and/or LinkedIn from past posts via iterative sample-and-feedback loops |
| `goose-graphics` | Comp | 36 aesthetic presets across 7 formats (carousel, story, infographic, slides, poster, chart, tweet) with Unsplash/ASCII sourcing and Playwright PNG export |
| `help-center-article-generator` | Comp | Generate structured help center articles |
| `site-content-catalog` | Cap | Full website content inventory |
| `social-kit` | Comp | One command → voice-tuned X + LinkedIn drafts + matching graphic, orchestrating create-x-content, create-linkedin-content, and goose-graphics |

### Lead Generation (23)
| Skill | Type | Description |
|-------|------|-------------|
| `apollo-lead-finder` | Cap | Two-phase Apollo.io prospecting with enrichment |
| `champion-tracker` | Cap | Track product champions for job changes |
| `company-contact-finder` | Cap | Find decision-makers at companies |
| `competitor-post-engagers` | Cap | Find leads from competitor LinkedIn post engagers |
| `conference-speaker-scraper` | Cap | Extract speakers from conference websites |
| `contact-cache` | Cap | CSV-backed contact database with dedup |
| `event-prospecting-pipeline` | Play | End-to-end event prospecting pipeline |
| `expansion-signal-spotter` | Comp | Monitor accounts for upsell/cross-sell signals |
| `funding-signal-monitor` | Comp | Monitor for Series A-C funding announcements |
| `get-qualified-leads-from-luma` | Comp | End-to-end lead prospecting from Luma events |
| `inbound-lead-enrichment` | Comp | Fill missing data for inbound leads |
| `inbound-lead-qualification` | Comp | Qualify inbound leads against ICP criteria |
| `inbound-lead-triage` | Comp | Triage all inbound leads from a given period |
| `job-posting-intent` | Cap | Detect buying intent from job postings |
| `job-scraper` | Cap | Search for job postings across LinkedIn and Indeed |
| `kol-engager-icp` | Cap | Find ICP-fit leads from KOL audiences on LinkedIn |
| `lead-qualification` | Cap | Lead qualification engine with conversational intake |
| `linkedin-job-scraper` | Cap | Scrape LinkedIn job postings via python-jobspy |
| `luma-event-attendees` | Cap | Scrape event attendee lists from Luma |
| `pain-language-engagers` | Cap | Find leads from LinkedIn pain-language posts |
| `signal-detection-pipeline` | Play | Detect buying signals, qualify leads, generate outreach |
| `signal-scanner` | Cap | Detect buying signals across TAM companies |
| `tam-builder` | Cap | Build scored TAM using Apollo + Supabase |

### Monitoring (10)
| Skill | Type | Description |
|-------|------|-------------|
| `hacker-news-scraper` | Cap | Search HN stories/comments via Algolia API |
| `kol-content-monitor` | Comp | Track KOL posts on LinkedIn and Twitter/X |
| `newsletter-monitor` | Comp | Scan AgentMail inbox for newsletter signals |
| `newsletter-signal-scanner` | Comp | Subscribe to and scan industry newsletters |
| `product-hunt-scraper` | Cap | Scrape trending Product Hunt launches |
| `reddit-post-finder` | Cap | Scrape and search Reddit posts using Apify |
| `review-site-scraper` | Cap | Scrape product reviews from G2, Capterra, and Trustpilot using Apify |
| `sponsored-newsletter-finder` | Comp | Discover newsletters for sponsorship opportunities |
| `twitter-mention-tracker` | Cap | Search Twitter/X posts with date filtering |
| `web-archive-scraper` | Cap | Wayback Machine scraper for archived sites |

### Outreach (18)
| Skill | Type | Description |
|-------|------|-------------|
| `champion-move-outreach` | Comp | Champion job change signal outreach |
| `cold-email-outreach` | Cap | End-to-end cold email outreach orchestration |
| `customer-win-back-sequencer` | Comp | Research churned accounts, generate win-back sequences |
| `disqualification-handling` | Comp | Handle disqualified/near-miss leads gracefully |
| `email-drafting` | Cap | Cold email writing with frameworks and personalization |
| `funding-signal-outreach` | Comp | Funding signal detection + outreach |
| `hiring-signal-outreach` | Comp | Hiring signal detection + outreach |
| `kol-discovery` | Cap | Find KOLs via web research + LinkedIn |
| `leadership-change-outreach` | Comp | Leadership change signal + outreach |
| `linkedin-commenter-extractor` | Cap | Extract commenters from LinkedIn posts |
| `linkedin-influencer-discovery` | Cap | Find LinkedIn thought leaders in any space |
| `linkedin-message-writer` | Cap | Research LinkedIn profiles and write personalized messages |
| `linkedin-outreach` | Cap | End-to-end LinkedIn outreach campaign builder |
| `linkedin-post-research` | Cap | Search LinkedIn posts by keyword |
| `linkedin-profile-post-scraper` | Cap | Scrape recent posts from LinkedIn profiles |
| `news-signal-outreach` | Comp | News-triggered signal outreach |
| `outbound-prospecting-engine` | Play | End-to-end outbound prospecting engine |
| `tiktok-influencer-finder` | Cap | Find TikTok influencers using Apify |

### Research (12)
| Skill | Type | Description |
|-------|------|-------------|
| `buyer-persona-generator` | Cap | Research ideal customer profiles and build detailed synthetic buyer personas |
| `churn-risk-detector` | Comp | Scan for early churn indicators, produce risk scorecard |
| `icp-identification` | Cap | Research company, define ICP, route to next step |
| `icp-website-audit` | Comp | End-to-end website audit through ICP eyes |
| `meeting-brief` | Comp | Daily meeting prep with deep attendee research |
| `pipeline-review` | Comp | Pipeline analysis from CRM/tracking data |
| `review-intelligence-digest` | Comp | Scrape reviews, extract themes and proof points |
| `sales-call-prep` | Comp | Pre-sales-call intelligence composite |
| `sales-coaching` | Comp | AI sales coach analyzing all sales data |
| `sequence-performance` | Comp | Email campaign/sequence performance review |
| `voice-of-customer-synthesizer` | Comp | Aggregate customer feedback into unified VoC report |
| `youtube-apify-transcript` | Cap | YouTube transcript extraction via Apify API |

### SEO (8)
| Skill | Type | Description |
|-------|------|-------------|
| `aeo-visibility` | Cap | AI answer engine visibility testing |
| `aeo-visibility-monitor` | Comp | Recurring AEO checks across ChatGPT, Perplexity, Gemini |
| `programmatic-seo-planner` | Comp | Identify programmatic SEO page patterns worth building |
| `programmatic-seo-spy` | Comp | Reverse-engineer competitor programmatic SEO |
| `seo-content-audit` | Comp | Full SEO audit: content inventory + metrics + gaps |
| `seo-content-engine` | Play | Build and run an SEO content engine |
| `seo-opportunity-finder` | Comp | Find quick-win SEO content opportunities |
| `topical-authority-mapper` | Comp | Map complete topic clusters with hub/spoke architecture |

## Using Skills

After installing GooseWorks, ask your coding agent to use any skill by name:

- "Use the reddit-post-finder skill to search r/startups"
- "Use the apollo-lead-finder skill to find CTOs at AI companies"
- "Use the competitor-intel skill to research Acme Corp"

Your agent will search the GooseWorks catalog, download the skill, and run it automatically.

## Building from Source

```bash
git clone https://github.com/gooseworks-ai/goose-skills.git
cd goose-skills
node scripts/validate-skills.js # Validate SKILL.md + skill.meta.json contract
node scripts/build-index.js   # Generate skills-index.json
node bin/goose-skills.js list  # Test locally
```

## Skill Metadata Contract

Each skill directory must include:

- `SKILL.md`
- `skill.meta.json`

`skill.meta.json` fields:

- `slug`
- `category` (`capabilities`, `composites`, or `playbooks`)
- `tags` (string array)
- `installation.base_command`
- `installation.supports` (`claude`, `codex`, `cursor`)
- optional `features`, `github_url`, `author`

## License

MIT

## Author

[Gooseworks](https://gooseworks.sh)

![goose4](https://github.com/user-attachments/assets/2bca27a7-7dc7-41da-b579-6a46f1152277)

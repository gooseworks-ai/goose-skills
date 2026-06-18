---
name: buyer-persona-generator
description: >
  Research a company's ideal customer profiles and build detailed synthetic buyer personas.
  Identifies 4-6 distinct buyer segments through web research, then creates rich,
  realistic personas with demographics, motivations, skepticism profiles, decision
  criteria, and language patterns. Use when you need to understand who your buyers are
  at a deep level — their motivations, objections, and how they evaluate solutions.
tags: [research]
---

# ICP Persona Builder

Research a company's buyer segments and build detailed synthetic personas that model their ideal customers. These personas become a reusable client asset — once built, any skill can load them to evaluate content, messaging, websites, or campaigns through buyer eyes.

## Quick Start

```
Build ICP personas for [company]. Their site is [url].
```

With known ICPs:
```
Build personas for [company]. Their ICPs are: [ICP 1], [ICP 2], [ICP 3].
```

## Inputs

| Input | Required | Source |
|-------|----------|--------|
| **Company name** | Yes | User provides |
| **Company URL** | Recommended | Helps with research |
| **Known ICPs** | No | User provides, or discovered via research |
| **Client context file** | No | Any existing company context file, if available |

## Process

### Phase 1: Company Research

Understand what the company does and who they serve:

1. **WebFetch their website** — homepage, product/solutions pages, pricing, "who it's for" pages
2. **WebSearch** for:
   - "[company] customers" / "[company] case studies"
   - "[company] reviews" (G2, Capterra, TrustRadius)
   - "[company] vs" (comparison searches reveal buyer segments)
   - "[company] jobs" (who they're hiring to sell to / support)
3. **Extract signals:**
   - What problem do they solve?
   - What's their pricing/packaging? (Signals ACV and buyer type)
   - What industries/verticals do they serve?
   - What company sizes do they target?
   - What roles/titles appear in case studies and testimonials?
   - What's their go-to-market motion? (Self-serve, sales-led, hybrid)

### Phase 2: Identify ICP Segments

From the research, identify **4-6 distinct buyer segments**. Each segment should represent a meaningfully different type of buyer — different role, different company profile, or different buying motivation.

For each segment, define:

| Attribute | Description |
|-----------|-------------|
| **Segment name** | Short label (e.g., "Enterprise IT Leader", "Startup Founder", "Agency Operator") |
| **Role/titles** | Typical job titles in this segment |
| **Company profile** | Size, stage, industry, tech stack |
| **Core pain point** | The #1 problem driving them to look for a solution |
| **Buying trigger** | What event makes them start searching NOW |
| **Decision criteria** | What matters most when evaluating (ranked) |
| **Sophistication** | How well they understand the problem space and solution landscape |
| **Alternatives** | What else they'd consider (competitors, DIY, status quo) |
| **Segment size estimate** | Rough sense of how big this segment is for the company (primary, secondary, emerging) |

**Segment diversity rules:**
- At least one **technical** buyer (evaluates capabilities, architecture, integrations)
- At least one **business** buyer (evaluates ROI, outcomes, competitive advantage)
- At least one **skeptical** profile (has been burned before, hard to convince)
- At least one **junior/researcher** (doing initial research for a decision-maker)
- Try to cover different company sizes if the company serves multiple tiers

### Phase 3: Build Synthetic Personas

For each segment, create a detailed synthetic persona. The persona should feel like a real, specific person — not a marketing abstraction.

**Persona structure:**

```json
{
  "id": "persona-slug",
  "name": "Jordan Chen",
  "segment": "Enterprise IT Leader",
  "title": "VP of Engineering",
  "company": {
    "type": "Mid-market SaaS company",
    "size": "200-500 employees",
    "stage": "Series B, scaling fast",
    "industry": "Financial services technology"
  },
  "demographics": {
    "experience_years": 12,
    "reports_to": "CTO",
    "team_size": 35,
    "budget_authority": "$50K-200K without board approval"
  },
  "situation": "Jordan's team is growing faster than their tooling can support. They've been using a patchwork of internal scripts and are losing engineering hours to maintenance. The CTO has asked Jordan to evaluate modern solutions before next quarter's planning cycle.",
  "pain_points": [
    "Team productivity is dropping as they scale",
    "Current tools don't integrate well",
    "Onboarding new engineers takes too long"
  ],
  "buying_trigger": "CTO mandate to evaluate solutions before Q3 planning",
  "decision_criteria_ranked": [
    "Enterprise security and compliance (SOC2, SSO)",
    "Integration with existing stack (GitHub, Jira, Datadog)",
    "Scalability — will this work at 2x team size?",
    "Total cost of ownership, not just sticker price",
    "Implementation timeline — needs to be live in 6 weeks"
  ],
  "skepticism_profile": {
    "trust_level": "Low — has been burned by vendor promises before",
    "research_style": "Deep dive. Reads docs, checks GitHub issues, asks peers in Slack communities",
    "key_objections": [
      "Will this actually scale or will we outgrow it in a year?",
      "What's the real implementation cost beyond the license?",
      "How good is the support when things break at 2am?"
    ]
  },
  "technical_sophistication": "High — understands the technical landscape well, can evaluate architecture decisions, wants to see under the hood",
  "language": {
    "describes_problem_as": "We need to consolidate our toolchain and reduce operational overhead",
    "searches_for": ["engineering productivity platform", "developer tools consolidation", "[competitor] alternative enterprise"],
    "red_flag_words": ["revolutionary", "AI-powered", "seamless" — overpromising triggers skepticism],
    "trust_signals": ["SOC2 badge", "customer logos in their industry", "transparent pricing", "public changelog"]
  },
  "evaluation_behavior": {
    "first_visit": "Scans headline, checks if it's for their company size, looks for enterprise/security page",
    "deep_evaluation": "Reads docs, checks integrations list, looks for case studies from similar companies",
    "social_proof_needs": "Wants to see companies their size in their industry, not just FAANG logos",
    "deal_breakers": ["No SSO/SAML", "No self-hosted option", "Pricing only available via sales call"]
  }
}
```

### Phase 4: Save Persona Assets

Save to the client directory as reusable assets:

**`personas.json`** — Machine-readable, all personas in an array. Save to the current working directory or wherever the user prefers:
```json
{
  "company": "Acme Corp",
  "url": "https://acme.com",
  "created": "2026-02-26",
  "segment_count": 5,
  "personas": [ ... ]
}
```

**`personas.md`** — Human-readable Markdown with all personas written out in prose form, easy to review and share.

**`segments.md`** — Summary table of all segments with key attributes, useful as a quick reference.

## Output Summary

After building, present:
1. **Segment overview table** — All segments with key attributes at a glance
2. **Persona summaries** — 2-3 sentence summary of each persona
3. **Coverage check** — Confirm diversity rules are met (technical, business, skeptical, researcher)
4. **Next steps** — Suggest running `icp-website-audit` or other skills that can use the personas

## Tips

- **Research depth matters.** Spend real time in Phase 1. The better you understand the company's actual customers, the more realistic the personas. Don't just read the homepage — dig into reviews, case studies, job postings.
- **Make personas specific.** "Marketing Manager" is too generic. "Sarah, Senior Demand Gen Manager at a 50-person B2B SaaS startup who just lost her SDR team to budget cuts" tells you exactly how she'll evaluate a tool.
- **Include the language dimension.** How the persona describes their problem is often completely different from how the vendor describes their solution. This gap is where messaging fails.
- **Skepticism is the most important trait.** Every persona needs a clear skepticism profile. What would make them NOT buy? What's their default assumption about vendors?
- **This skill has no code script.** It's agent-executed using WebSearch and WebFetch. The structured process above guides the research and persona creation.

## Dependencies

- Web search capability (for company and ICP research)
- Web fetch capability (for reading website pages)
- No API keys or paid tools required

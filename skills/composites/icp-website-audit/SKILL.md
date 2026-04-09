---
name: icp-website-audit
description: >
  End-to-end website audit through ICP eyes. Builds synthetic personas (if they don't
  already exist), runs a structured scorecard review of the client's site, then runs
  a head-to-head competitive comparison against top competitors. Produces a single
  consolidated report with persona feedback, competitive positioning, and prioritized
  recommendations. The complete "how do our buyers actually experience our site vs
  the competition?" workflow.
tags: [research]
---

# ICP Website Audit

The complete "how do buyers experience our site vs the competition?" workflow. Chains persona building, website evaluation, and competitive comparison into a single end-to-end audit.

## Quick Start

```
Run an ICP website audit for [company]. Site: [url]. Compare against [competitor 1] and [competitor 2].
```

With existing personas:
```
Run an ICP website audit for [client]. Personas already exist. Compare against [competitor urls].
```

## Inputs

| Input | Required | Source |
|-------|----------|--------|
| **Company name** | Yes | User provides |
| **Company URL** | Yes | User provides |
| **Competitor URLs** | Yes (1-3) | User provides, or discovered in Phase 1 |
| **Client context file** | Optional | `clients/<client>/context.md` |
| **Existing personas** | Optional | `clients/<client>/personas/personas.json` |

## Step-by-Step Process

### Phase 1: Persona Setup

**Check if personas already exist:**

```
clients/<client>/personas/personas.json
```

**If personas exist:** Load them, confirm they look current, and list them for the user. Skip to Phase 2.

**If no personas exist:** Run `buyer-persona-generator`:

1. Research the company — what they sell, who they serve, pricing model, stage
2. Identify 4-6 ICP segments from website, case studies, reviews, job postings
3. Build detailed synthetic personas with full profiles
4. Save to `clients/<client>/personas/`

**Output from this phase:**
- `clients/<client>/personas/personas.json` (machine-readable)
- `clients/<client>/personas/personas.md` (human-readable)
- `clients/<client>/personas/segments.md` (summary table)

### Phase 2: Website Scorecard Review

Run `icp-website-audit` in **scorecard mode** against the client's own site.

1. **Crawl the client's site** — homepage, pricing, product, solutions, about, case studies, blog, docs
2. **Check external presence** — search results, review sites, social proof
3. **Run each persona through the site**, scoring on:
   - First Impression (1-10)
   - Messaging Relevance (1-10)
   - Trust & Credibility (1-10)
   - Clarity & Navigation (1-10)
   - Objection Handling (1-10)
   - Overall (1-10)
4. **Cross-persona synthesis** — consensus issues, segment-specific gaps, messaging disconnects

**Output from this phase:**
- Per-persona scored reviews
- Cross-persona analysis
- Initial recommendations

### Phase 3: Competitive Head-to-Head

Run `icp-website-audit` in **head-to-head mode** against each competitor.

For each competitor (1-3):

1. **Crawl the competitor's site** — same pages as the client site
2. **Run each persona through BOTH sites**
3. **Per-persona comparison:**
   - Quick takes on each site
   - Dimension-by-dimension scoring for both
   - "If I had to choose today..." verdict
   - What the client should steal from the competitor
   - What the client does better
4. **Cross-persona competitive summary:**
   - Where the client wins across personas
   - Where the competitor wins across personas
   - At-risk segments (personas who lean toward competitor)
   - Priority competitive moves

**Output from this phase:**
- Per-competitor, per-persona head-to-head reviews
- Competitive positioning map
- At-risk segments identified

### Phase 4: Consolidated Report

Merge all findings into a single audit report. This is the deliverable.

**Synthesis work:**

1. **Combine scorecard + competitive findings** — scorecard shows absolute quality, head-to-head shows relative positioning. Both perspectives matter.
2. **Identify the "so what"** — what are the 3-5 moves that would make the biggest difference?
3. **Rank recommendations by:**
   - How many personas it affects (breadth)
   - How much it would change conversion likelihood (depth)
   - Whether competitors already do it better (urgency)
   - Estimated effort (feasibility)
4. **Flag at-risk segments** — ICPs where competitors are winning. These need immediate attention.

---

## Output

Save to the current working directory as `icp-website-audit.md` (or user-specified path).

Also save the sub-reports to the current working directory:
- `personas/` (persona assets, reusable)
- `icp-reviews/<date>-scorecard.md` (site review)
- `icp-reviews/<date>-head-to-head-<competitor>.md` (per competitor)

### Consolidated Report Template

```markdown
# ICP Website Audit: [Company Name]

**Date:** [Date]
**Website:** [url]
**Competitors:** [competitor 1], [competitor 2], [competitor 3]
**Personas used:** [N] (from `clients/<client>/personas/`)

---

## Executive Summary

[5-7 sentences. How do buyers actually experience this site? What's working, what's
broken, where are competitors winning? Top 3 things to fix and why.]

### Scorecard Overview

**Average score across personas: [X/10]**

| Persona | Segment | Own Site Score | Would Convert? |
|---------|---------|:-:|:-:|
| [Name] | [Segment] | [X/10] | [Yes/Maybe/No] |
| ... | ... | ... | ... |

### Competitive Overview

| Persona | Own Site | [Comp 1] | [Comp 2] | Pick |
|---------|:-------:|:--------:|:--------:|:----:|
| [Name] | [X/10] | [X/10] | [X/10] | [Winner] |
| ... | ... | ... | ... | ... |

**Personas at risk:** [Names of personas who preferred a competitor — these represent ICP segments you may be losing]

---

## Part 1: ICP Segments & Personas

### Segments Identified

| # | Segment | Description | Priority |
|---|---------|-------------|----------|
| 1 | [Name] | [One line] | Primary |
| 2 | [Name] | [One line] | Primary |
| 3 | [Name] | [One line] | Secondary |
| ... | | | |

### Persona Summaries

[2-3 sentence summary of each persona — who they are, what they care about, how they evaluate. Link to full profiles in `personas/personas.md`.]

---

## Part 2: Website Scorecard

### Score Matrix

| Dimension | [P1] | [P2] | [P3] | [P4] | [P5] | Avg |
|-----------|:----:|:----:|:----:|:----:|:----:|:---:|
| First Impression | | | | | | |
| Messaging Relevance | | | | | | |
| Trust & Credibility | | | | | | |
| Clarity & Navigation | | | | | | |
| Objection Handling | | | | | | |
| **Overall** | | | | | | |

### Persona-by-Persona Highlights

For each persona, include:
- **[Persona Name]** ([Score]/10) — [One sentence summary]. Liked: [key positive]. Frustrated by: [key negative]. Blocker: [#1 thing stopping conversion].

### Cross-Persona Findings

#### Consensus Issues (All Personas)
1. [Issue] — [Why it matters]
2. ...

#### Segment-Specific Gaps
| Gap | Personas Affected | Impact |
|-----|------------------|--------|
| [Gap] | [Names] | [H/M/L] |

#### Messaging Disconnects
| Site says | Buyers say | Personas |
|-----------|-----------|----------|
| "[quote]" | "[quote]" | [Names] |

---

## Part 3: Competitive Analysis

### vs [Competitor 1]

**Overall: [Company wins / Competitor wins / Split]**

| Dimension | [Company] | [Competitor] | Winner |
|-----------|:---------:|:------------:|:------:|
| First Impression | [avg] | [avg] | |
| Messaging | [avg] | [avg] | |
| Trust | [avg] | [avg] | |
| Clarity | [avg] | [avg] | |
| Objections | [avg] | [avg] | |
| **Overall** | **[avg]** | **[avg]** | |

**Where competitor wins:**
- [Specific advantage, which personas care]

**Where we win:**
- [Specific advantage, which personas care]

**Personas who'd choose competitor:** [Names — these are at-risk segments]

---

### vs [Competitor 2]
[Same structure]

---

### Competitive Position Map

| Persona | Best Experience | Worst Experience | Notes |
|---------|:-:|:-:|---|
| [P1] | [Company/Comp] | [Company/Comp] | [Why] |
| [P2] | ... | ... | ... |

### At-Risk Segments

[Personas who preferred competitors. For each: which competitor, why, and what it would take to win them back.]

### Competitive Advantages to Amplify

[Things the company does better than ALL competitors — lean into these.]

### Gaps to Close

[Things competitors do better across most personas — neutralize these.]

---

## Part 4: Prioritized Recommendations

### Tier 1: High Impact, Do Now

These affect the most personas and/or address competitive gaps.

1. **[Recommendation]**
   - **Why:** [Evidence from scorecard + competitive analysis]
   - **Personas affected:** [Names]
   - **Competitive context:** [Do competitors already do this better?]
   - **Expected impact:** [What changes — conversion, trust, clarity]
   - **Effort:** [Low/Med/High]

2. **[Recommendation]**
   ...

### Tier 2: Medium Impact, Plan For

3. **[Recommendation]**
   ...

### Tier 3: Segment-Specific Optimizations

These improve experience for specific ICP segments.

5. **[Recommendation]** — For [persona/segment]
   ...

### Quick Wins

- [Small change] → Benefits [persona]
- [Small change] → Benefits [persona]

---

## Appendix

### A. Full Persona Profiles
→ `clients/<client>/personas/personas.md`

### B. Detailed Scorecard Review
→ `clients/<client>/icp-reviews/<date>-scorecard.md`

### C. Detailed Competitive Reviews
→ `clients/<client>/icp-reviews/<date>-head-to-head-<competitor>.md`

### D. Persona Data (JSON)
→ `clients/<client>/personas/personas.json`
```

---

## Parallelization

Some phases can run in parallel to save time:

```
Phase 1: Build personas (if needed)
    ↓
Phase 2 + Phase 3 can partially overlap:
  - Crawl all sites (client + competitors) at once
  - Run scorecard first (client site only)
  - Then run head-to-heads (reuse client crawl data)
    ↓
Phase 4: Consolidate (needs all prior phases)
```

If personas already exist, the whole workflow is just:
```
Crawl all sites → Scorecard → Head-to-heads → Consolidate
```

## Tips

- **Start with 1-2 competitors, not 5.** Each competitor adds a full head-to-head evaluation pass. Start focused, add more if needed.
- **The at-risk segments are the most actionable finding.** If a persona consistently prefers a competitor, that's an ICP segment you're actively losing deals in. That should drive urgency.
- **Reuse this quarterly.** Run personas once, then re-run the audit after site changes or quarterly to track improvement. Compare scores across dates.
- **Combine with SEO content audit for the full picture.** ICP audit tells you "does the messaging work for buyers?" SEO audit tells you "are buyers finding you in the first place?" Together they cover the full funnel.
- **This makes a great client deliverable.** The consolidated report is structured for sharing. Use `content-asset-creator` to make it into a polished HTML report.
- **Don't skip the competitive analysis.** The scorecard alone is useful, but the head-to-head is where the real insights are. Buyers always compare — your audit should too.

## Dependencies

- Skills: `buyer-persona-generator`, `icp-website-audit`
- Web search capability (for research, external presence checks)
- Web fetch capability (for reading website pages)
- No API keys or paid tools required

## Cost

Free — no paid APIs. All research and evaluation is done via web search and web fetch.

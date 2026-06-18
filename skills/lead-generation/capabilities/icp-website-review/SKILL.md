---
name: icp-website-review
description: >
  Evaluate a website, landing page, content, or any online asset through the eyes of
  pre-built synthetic ICP personas. Loads personas from buyer-persona-generator output,
  then runs them against target URLs. Supports three modes: structured scorecard,
  freeform focus group, and head-to-head competitive comparison. Reusable — run
  against the same site after changes, or against new content anytime.
tags: [research]
---

# ICP Website Review

Evaluate any online asset through the eyes of pre-built synthetic ICP personas. This is the evaluation engine — it loads personas created by `buyer-persona-generator` and runs them against whatever you point it at.

## Prerequisites

Personas must exist at `clients/<client>/personas/personas.json`. If they don't, run `buyer-persona-generator` first.

## Quick Start

**Structured scorecard (default):**
```
Review [company]'s website using their ICP personas. Site: [url].
```

**Freeform focus group:**
```
Run a focus group on [company]'s new landing page: [url]. Use focus-group mode.
```

**Head-to-head competitive:**
```
Compare [company]'s site ([url]) against [competitor] ([url]) through ICP personas.
```

## Inputs

| Input | Required | Source |
|-------|----------|--------|
| **Personas** | Yes | `clients/<client>/personas/personas.json` |
| **Target URL(s)** | Yes | User provides |
| **Mode** | No | `scorecard` (default), `focus-group`, or `head-to-head` |
| **Competitor URL(s)** | For head-to-head | User provides |
| **Specific pages** | No | Default: homepage + key pages discovered during crawl |
| **Scope** | No | `full-site` (default) or specific page URL for a single-page review |

## Modes

### Mode 1: Structured Scorecard (Default)

Rigorous, dimension-by-dimension evaluation with numerical scores. Best for:
- Pre-redesign audits
- Conversion optimization
- Tracking improvement over time (comparable scores across runs)
- Stakeholder presentations (data-driven)

### Mode 2: Freeform Focus Group

Each persona reacts naturally — stream of consciousness, emotional reactions, questions they'd have, things that confuse them. No rigid scoring. Best for:
- Early-stage feedback on a draft or concept
- Understanding emotional reactions and gut feelings
- Surfacing unexpected issues the scorecard dimensions might miss
- More natural, human-sounding feedback

### Mode 3: Head-to-Head Competitive

Each persona evaluates your site AND a competitor's site, then picks a winner with reasoning. Best for:
- Competitive positioning
- Understanding why prospects choose competitors
- Finding specific areas where competitors outperform you
- Sales battlecard input

---

## Process

### Step 1: Load Personas

Read `clients/<client>/personas/personas.json`. Confirm:
- Personas exist and are well-formed
- List the personas that will be used (name, title, segment)
- If the user wants to use only specific personas, filter accordingly

### Step 2: Crawl Target Pages

Fetch the key pages each persona would realistically visit:

1. **Homepage** (everyone starts here)
2. **Pricing page** (if public)
3. **Product/features page** (technical buyers)
4. **Solutions/use-cases page** (business buyers)
5. **About page** (trust/credibility check)
6. **Case studies or testimonials** (social proof)
7. **Blog** (1-2 recent posts, for content quality signal)
8. **Documentation or resources** (if relevant for technical buyers)

Use `WebFetch` for each page. Extract main content, headlines, CTAs, and overall structure. Note what's present and what's missing.

Also check external presence:
- **Search results**: WebSearch "[company name]" and "[company name] reviews"
- **Review sites**: Quick G2/Capterra check
- **Social proof signals**: Notable logos, press, trust badges

For **head-to-head mode**, crawl the same pages on the competitor site.

### Step 3: Run Evaluations (Mode-Dependent)

---

#### Scorecard Mode

For each persona, evaluate on these dimensions:

**A) First Impression (10 seconds)**
- What do they think this company does?
- Is it clear this is for them?
- Does the headline speak to their pain point?
- Trust level at first glance?
- **Rating: 1-10**

**B) Messaging Relevance**
- Does the value proposition resonate with their specific pain?
- Is the language familiar or alienating?
- Do they see themselves in the messaging?
- Are benefits framed in terms they care about?
- **Rating: 1-10**

**C) Trust & Credibility**
- Social proof relevant to them? (Same industry, size, role)
- Claims backed by evidence?
- Team/about page build confidence?
- Any red flags?
- **Rating: 1-10**

**D) Clarity & Information Architecture**
- Can they find what they need quickly?
- Is the product easy to understand?
- Is pricing clear?
- Are next steps obvious?
- **Rating: 1-10**

**E) Objection Handling**
- Does the site address their likely objections?
- Comparison pages or differentiators available?
- Enough depth for their decision process?
- **Rating: 1-10**

**F) Overall Verdict**
- Would they take the next step?
- What's the #1 blocker?
- Single most impactful improvement?
- **Overall score: 1-10**

---

#### Focus Group Mode

For each persona, produce a natural, first-person reaction. No rigid structure — let the persona talk.

**Prompt each persona with:**
> You are [persona name], [title] at [company type]. [Situation summary]. You just landed on this website. React naturally — what do you notice first? What confuses you? What excites you? What makes you skeptical? Would you keep exploring or bounce? If you stayed, where would you go next? What questions do you need answered before you'd take action?

**Guidelines:**
- Write in first person as the persona
- Let their personality and skepticism level come through
- Include emotional reactions ("this immediately makes me nervous because...")
- Reference specific things on the page ("the headline says X but I was looking for Y")
- Note what they'd do next ("I'd probably Google '[competitor] vs [company]' after seeing this")
- End with a gut-level verdict: interested, skeptical, confused, or gone

After all personas react, synthesize common themes and divergent opinions.

---

#### Head-to-Head Mode

For each persona, evaluate BOTH sites, then compare.

**Structure per persona:**

1. **Quick take on Site A** (3-5 bullet reactions)
2. **Quick take on Site B** (3-5 bullet reactions)
3. **Dimension-by-dimension comparison:**

| Dimension | Site A | Site B | Winner |
|-----------|:------:|:------:|:------:|
| First Impression | [X/10] | [X/10] | [A/B/Tie] |
| Messaging Relevance | [X/10] | [X/10] | [A/B/Tie] |
| Trust & Credibility | [X/10] | [X/10] | [A/B/Tie] |
| Clarity & Navigation | [X/10] | [X/10] | [A/B/Tie] |
| Objection Handling | [X/10] | [X/10] | [A/B/Tie] |
| **Overall** | **[X/10]** | **[X/10]** | **[A/B/Tie]** |

4. **"If I had to choose today..."** — Which site wins and why, in this persona's own words
5. **What Site A could steal from Site B** — Specific things the competitor does better
6. **What Site A does better** — Don't lose these advantages

After all personas, produce a cross-persona competitive summary:
- Where does each site win across most personas?
- Which persona segments lean toward the competitor? (These are at-risk segments)
- What are the competitor's key advantages to neutralize?
- What are your unique advantages to amplify?

---

### Step 4: Cross-Persona Synthesis

Regardless of mode, always produce:

1. **Consensus issues** — Flagged by ALL personas (urgent)
2. **Segment-specific gaps** — Only certain personas noticed (targeted fixes)
3. **Messaging disconnects** — Site language vs. buyer language
4. **Missing content** — Pages, sections, or proof points personas wanted
5. **Strengths to preserve** — Don't break what works
6. **Priority matrix** — Ranked by impact (personas affected) and effort

## Output

Save to `clients/<client-name>/icp-reviews/<date>-<mode>.md`

This path allows multiple reviews over time — tracking improvements, comparing before/after redesigns, or accumulating competitive intel.

### Scorecard Output Template

```markdown
# ICP Website Review: [Company Name]
**Date:** [Date] | **Mode:** Scorecard | **URL:** [website]
**Pages analyzed:** [N] | **Personas used:** [N]
**Personas from:** `clients/<client>/personas/personas.json` (created [date])

---

## Executive Summary

[3-5 sentences: overall assessment, biggest strengths, biggest gaps, top 3 recs]

**Average score: [X/10]**

| Persona | Segment | Score | Would Convert? |
|---------|---------|:-----:|:-:|
| [Name] | [Segment] | [X/10] | [Yes/Maybe/No] |
| ... | ... | ... | ... |

---

## Persona Reviews

### [Persona Name]'s Review

**Arriving with:** [Their situation and buying trigger]

| Dimension | Score | Summary |
|-----------|:-----:|---------|
| First Impression | [X/10] | [One line] |
| Messaging Relevance | [X/10] | [One line] |
| Trust & Credibility | [X/10] | [One line] |
| Clarity & Navigation | [X/10] | [One line] |
| Objection Handling | [X/10] | [One line] |
| **Overall** | **[X/10]** | **[One line]** |

**Liked:**
- [Specific, with reference from the site]

**Frustrated by:**
- [Specific, with explanation of why THIS persona cares]

**Wished they could find:**
- [Missing content/info, why they need it]

**Verdict:** [Would they convert? #1 blocker?]

---

[Repeat for each persona]

---

## Cross-Persona Analysis

### Consensus Issues
1. [Issue] — [Why it matters]

### Segment-Specific Gaps
| Gap | Affected Personas | Impact |
|-----|------------------|--------|
| [Gap] | [Names] | [High/Med/Low] |

### Messaging Disconnects
| Site says | Buyers say | Affected |
|-----------|-----------|----------|
| "[quote]" | "[quote]" | [Names] |

### Strengths to Preserve
- [What works]

---

## Prioritized Recommendations

### High Impact
1. **[Rec]** — Affects: [personas]. Current: [X]. Target: [Y].

### Medium Impact
2. **[Rec]**

### Quick Wins
- [Small changes]

---

## Score Matrix

| Dimension | [P1] | [P2] | [P3] | [P4] | Avg |
|-----------|:----:|:----:|:----:|:----:|:---:|
| First Impression | | | | | |
| Messaging | | | | | |
| Trust | | | | | |
| Clarity | | | | | |
| Objections | | | | | |
| **Overall** | | | | | |
```

### Focus Group Output Template

```markdown
# ICP Focus Group: [Company Name]
**Date:** [Date] | **Mode:** Focus Group | **URL:** [website]
**Personas used:** [N]

---

## Executive Summary

[What the group collectively thought — 3-5 sentences]

---

## Persona Reactions

### [Persona Name] — [Title]

> [First-person narrative reaction, 200-400 words. Natural voice, emotional, specific.]

**Gut verdict:** [One sentence — interested/skeptical/confused/gone]

---

[Repeat for each persona]

---

## Group Synthesis

### What everyone noticed
- [Theme]

### Where opinions split
| Topic | [P1] take | [P2] take |
|-------|-----------|-----------|

### Strongest reactions (positive)
- [What got the most enthusiasm, from whom]

### Strongest reactions (negative)
- [What got the most criticism, from whom]

### What nobody could answer
- [Questions the site left unanswered]

---

## Recommendations
[Prioritized, grouped by theme]
```

### Head-to-Head Output Template

```markdown
# Competitive Review: [Company] vs [Competitor]
**Date:** [Date] | **Mode:** Head-to-Head
**Site A:** [url] | **Site B:** [url]
**Personas used:** [N]

---

## Executive Summary

**Overall winner: [A/B/Split]**
[3-5 sentences on where each site wins and loses]

| Persona | Segment | Site A | Site B | Pick |
|---------|---------|:------:|:------:|:----:|
| [Name] | [Segment] | [X/10] | [X/10] | [A/B] |
| ... | ... | ... | ... | ... |

---

## Persona Comparisons

### [Persona Name]

**Site A quick take:** [3-5 bullets]
**Site B quick take:** [3-5 bullets]

| Dimension | A | B | Winner |
|-----------|:-:|:-:|:------:|
| ... | | | |

**"If I had to choose..."** [Persona's verdict in their own words]

**What A should steal from B:** [Specific]
**What A does better:** [Specific]

---

[Repeat for each persona]

---

## Competitive Summary

### Where [Company] wins across personas
- [Advantage, which personas care]

### Where [Competitor] wins across personas
- [Advantage, which personas care]

### At-risk segments
[Personas who lean toward competitor — these ICPs may be churning or not converting]

### Priority moves
1. **Neutralize:** [Competitor advantage to close the gap on]
2. **Amplify:** [Your advantage to lean into harder]
3. **Differentiate:** [Unique angle neither site owns yet]
```

## Running Repeat Reviews

Since personas are saved separately, you can re-run this skill anytime:

```
Re-run the ICP website review for [client]. Use the existing personas.
```

Compare results across dates to track improvement:
```
Compare today's ICP review for [client] against the one from [date].
```

The dated output path (`icp-reviews/<date>-<mode>.md`) makes it easy to see the history of reviews and how scores change over time.

## Tips

- **Don't be nice.** Personas should be honest and critical. A persona that says "everything looks great" is useless.
- **Vary the voices.** A CTO's review should read differently than a marketing manager's. Use different vocabulary, different focus, different emotional register.
- **Ground in specifics.** Not "messaging is unclear" but "the headline 'Accelerate Your Workflow' doesn't tell me what this product does — I had to scroll to the third fold."
- **Check the competition.** If personas mention alternatives, quickly check 1-2 competitor sites to see if they handle the same issues better.
- **External presence matters.** What shows up when a persona Googles the company? Reviews? Press? That shapes trust before they even hit the site.
- **Focus group mode is underrated.** The freeform reactions often surface things the scorecard misses — emotional reactions, unexpected confusion, things people wouldn't flag in a survey.
- **Head-to-head is the killer use case.** Nothing clarifies your positioning gaps faster than seeing your site through a buyer's eyes right next to the competitor's.
- **This skill has no code script.** It's agent-executed using WebSearch and WebFetch.

## Dependencies

- Pre-built personas (`buyer-persona-generator` output)
- Web search capability (for external presence checks, competitor research)
- Web fetch capability (for reading website pages)
- No API keys or paid tools required

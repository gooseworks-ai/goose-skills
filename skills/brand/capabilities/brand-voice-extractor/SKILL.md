---
name: brand-voice-extractor
description: >
  Analyze a company's published content to extract their brand voice, writing style,
  and tone guidelines. Reads 10-20 of their best content pieces and produces a
  brand voice profile covering tone, vocabulary level, sentence structure, formatting
  patterns, CTAs, and target persona. Useful before writing outreach, content, or
  campaigns that should match a client's existing voice.
tags: [brand]
---

# Brand Voice Extractor

Analyze a company's published content to extract their brand voice and writing style. Reads their top content pieces and produces actionable guidelines for matching their voice in future content, outreach, or campaigns.

## Quick Start

```
Extract brand voice for [company]. Use their blog at [url].
```

Or with content already cataloged:
```
Extract brand voice for [client]. Use the content inventory at clients/[client]/research/content-inventory.json.
```

## Inputs

| Input | Required | Source |
|-------|----------|--------|
| **Content URLs** | Yes | User provides, or pulled from site-content-catalog output |
| **Company name** | Yes | For context in the analysis |
| **Number of pages** | No | Default: 15. How many pages to analyze. |

## Process

### Phase 1: Select Content to Analyze

If content URLs are provided directly, use those. Otherwise:

1. Read the content inventory from `site-content-catalog` output
2. Select a diverse sample of 10-20 pages, prioritizing:
   - **Blog posts** (primary voice indicator)
   - **Landing pages** (marketing voice)
   - **Case studies** (storytelling voice)
   - Mix of recent and older content (to detect voice evolution)
   - Mix of topics (to see consistency across subjects)

**Selection heuristic:**
- 8-10 blog posts (mix of how-to, opinion, product updates)
- 2-3 landing pages (homepage, product page, solutions page)
- 2-3 case studies or customer stories (if available)
- 1-2 comparison/vs pages (if available)

### Phase 2: Fetch and Extract Text

For each selected URL:
1. WebFetch the page
2. Extract the main content body (strip nav, footer, sidebar)
3. Store: title, URL, raw text, word count

### Phase 3: Analyze Voice Dimensions

Analyze across these dimensions:

#### A) Tone
- **Formality spectrum:** Casual ↔ Professional ↔ Academic
- **Emotional register:** Excited ↔ Measured ↔ Dry
- **Authority stance:** Peer/friend ↔ Expert/teacher ↔ Institution
- **Humor usage:** Frequent ↔ Occasional ↔ None
- **Directness:** Direct/bold ↔ Hedged/diplomatic

#### B) Vocabulary & Language
- **Reading level:** Approximate grade level (simple vs. complex)
- **Jargon usage:** Heavy industry jargon ↔ Plain language
- **Technical depth:** Assumes expertise ↔ Explains everything
- **Power words:** Common persuasion/action words they favor
- **Banned patterns:** Words or phrases they conspicuously avoid
- **Unique vocabulary:** Distinctive terms or phrases they use repeatedly

#### C) Sentence Structure
- **Average sentence length:** Short/punchy ↔ Long/complex
- **Paragraph length:** 1-2 sentences ↔ 3-4 ↔ 5+
- **Opening patterns:** How they start articles (question, stat, story, bold claim)
- **Transition style:** How they connect ideas
- **Use of fragments:** Do they use incomplete sentences for emphasis?

#### D) Formatting Patterns
- **Headers:** Frequency, style (question-based, how-to, numbered)
- **Lists:** Bullets vs. numbered, frequency
- **Bold/italic:** How they use emphasis
- **Images/media:** Frequency, types (screenshots, illustrations, photos)
- **CTAs:** Placement, style, frequency, language used
- **Pull quotes/callouts:** Do they use them?

#### E) Content Structure
- **Typical article length:** Short (<800), Medium (800-1500), Long (1500+)
- **Introduction style:** Hook type, length
- **Conclusion style:** Summary, CTA, open question
- **Use of data/stats:** Frequent ↔ Rare
- **Use of examples:** Frequent ↔ Rare
- **Storytelling:** Narrative-driven ↔ Information-driven

#### F) Persona & Audience
- **Who they write for:** Inferred target reader (role, seniority, industry)
- **Assumed knowledge level:** Beginner ↔ Intermediate ↔ Expert
- **Point of view:** First person singular (I) ↔ First person plural (we) ↔ Second person (you) ↔ Third person
- **Reader relationship:** Peer ↔ Teacher ↔ Service provider

### Phase 4: Generate Brand Voice Profile

Produce a Markdown document with this structure:

```markdown
# Brand Voice Profile: [Company Name]
**Analyzed:** [Date] | **Content pieces analyzed:** [N]
**Sources:** [list of URLs analyzed]

---

## Voice Summary (2-3 sentences)

[Company] writes in a [tone] voice that [description]. Their content targets
[audience] and assumes [knowledge level]. The overall feel is [adjectives].

---

## Tone Profile

| Dimension | Position | Evidence |
|-----------|----------|----------|
| Formality | [e.g., Professional-casual] | [Example quote] |
| Emotional Register | [e.g., Measured, occasionally excited] | [Example] |
| Authority | [e.g., Expert/teacher] | [Example] |
| Humor | [e.g., Rare, dry when used] | [Example] |
| Directness | [e.g., Very direct, bold claims] | [Example] |

---

## Language & Vocabulary

### Reading Level
[Grade level estimate and what that means]

### Signature Phrases
- "[phrase 1]" — used frequently to [purpose]
- "[phrase 2]" — recurring pattern in [context]

### Jargon & Technical Depth
[How much industry jargon they use, how they handle technical concepts]

### Words They Love
[List of frequently used power words, adjectives, verbs]

### Words They Avoid
[Notable absences or patterns they steer away from]

---

## Structure & Formatting

### Typical Article Structure
[Outline of how their articles are typically organized]

### Sentence & Paragraph Style
- Average sentence length: [X words]
- Typical paragraph: [X sentences]
- Notable patterns: [fragments, rhetorical questions, etc.]

### Formatting Habits
- Headers: [style]
- Lists: [frequency and style]
- Emphasis: [bold/italic patterns]
- CTAs: [where, how often, what language]

---

## Audience & Persona

### Target Reader
[Role, seniority, industry, pain points they address]

### Knowledge Assumptions
[What they assume the reader already knows]

### Point of View
[I/we/you usage and what it signals]

---

## Writing Guidelines (Actionable)

Use these guidelines when writing content, outreach, or campaigns for [Company]:

### Do
- [Guideline 1 with example]
- [Guideline 2 with example]
- [Guideline 3 with example]

### Don't
- [Anti-pattern 1]
- [Anti-pattern 2]
- [Anti-pattern 3]

### Voice Samples

**Their style:**
> [2-3 representative quotes from their content that exemplify the voice]

**How to match it:**
> [2-3 example sentences written in their voice about a neutral topic]
```

## Tips

- **15 pages is the sweet spot.** Fewer than 10 won't capture enough variation. More than 25 adds cost without much signal.
- **Blog posts are the best voice signal.** Landing pages are more formulaic. Blog posts show the authentic voice.
- **Look for consistency AND inconsistency.** If their tone shifts dramatically between content types, note it — they may have multiple voice modes.
- **Check for ghost-written content.** If some posts feel dramatically different, they may use external writers. Flag this in the analysis.
- **This skill has no code script.** It's an agent-executed skill — the AI agent reads the content via WebFetch and performs the analysis directly. The structured output template above guides the analysis.

## Dependencies

- Web fetch capability (for reading content pages)
- Optional: `site-content-catalog` output (for selecting which content to analyze)
- No API keys or paid tools required

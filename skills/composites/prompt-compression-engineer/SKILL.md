---
name: prompt-compression-engineer
description: >
  Compress any system prompt using 8 defined techniques (T1–T8) across 4
  phases: functional inventory, compression analysis, compressed output, and
  behavioral verification. Use this skill whenever a prompt exceeds token
  budget, when deploying any GTM agent at production scale, or when auditing
  any existing system prompt for redundancy. Apply before deploying
  industry-scanner, battlecard-generator, cold-email-outreach, or any
  composite that runs at high volume. Delivers a compression report with token
  savings, cost projections, technique breakdown, and 3-scenario behavioral
  verification. Even when a prompt seems tight, run the audit — hidden
  redundancy is standard.
---

{P:PROTECTED} MONNA SIGNATURE™ v11.0 | ONT_MODE: lite

# Prompt Compression Engineer

Reduce any system prompt to its minimum effective length using 8 defined
compression techniques, each tested for behavioral preservation before
application. Compression without verification is rewriting. This skill does
both.

System prompts are fixed-cost tokens — they repeat on every API call. A
3,000-token system prompt across 40 turns costs 120,000 input tokens.
Reducing it by 50% saves 60,000 tokens per session.

## Quick Start

```
Compress this system prompt. Target: balanced (30–45% reduction).

[paste system prompt here]
```

To specify a tier:
```
Compress this system prompt. Target: aggressive (45–60% reduction).

[paste system prompt here]
```

---

## Compression Tiers

| Tier | Reduction Target | T8 Applied |
|------|-----------------|-----------|
| **Light** | 20–30% | No |
| **Balanced** | 30–45% | No |
| **Aggressive** | 45–60% | Yes |

Default: **Balanced**. T8 (aggressive shorthand) activates only when target
contains "aggressive", "maximum", or "minimize at all costs".

---

## Inputs

| Input | Required | Description |
|-------|----------|-------------|
| System prompt | ✅ | The full prompt to compress — paste between `===` markers |
| Compression target | ❌ | Tier name or percentage (default: Balanced) |

---

## Phase 1: Functional Inventory

Before changing anything, catalog every distinct instruction:

| Category | What to count |
|----------|--------------|
| **a) Behavioral rules** | What the model must/must not do |
| **b) Output format** | Structure, formatting, length requirements |
| **c) Tone & style** | Voice, register, personality directives |
| **d) Domain context** | Background knowledge, expertise framing |
| **e) Tool instructions** | How to use available functions |
| **f) Edge cases** | Handling for unusual inputs |
| **g) Examples** | Demonstrations of expected behavior |
| **h) Meta-instructions** | Instructions about how to follow instructions |

Count each category's token contribution. This is the baseline.

---

## Phase 2: Compression Analysis

Apply all 8 techniques. For each, identify specific targets and estimate savings.

### T1 — Default Removal
**What:** Delete instructions that describe behavior the model exhibits without
being told.

**Examples:** "Be helpful and accurate", "Respond in the user's language",
"Don't make things up"

**Risk:** LOW | **Typical savings:** 5–15%

### T2 — Redundancy Merge
**What:** Find instructions that say the same thing in different places or
different words. Merge into one.

**Detection:** Search for overlapping semantic content across sections.

**Risk:** LOW | **Typical savings:** 5–15%

### T3 — Prose to Notation
**What:** Convert paragraph-form instructions into structured notation (tree
format, key:value, shorthand).

**Risk:** LOW | **Typical savings:** 15–30%

### T4 — Filler Strip
**What:** Remove words that add no meaning: "please", "make sure to",
"it is important that", "you should always", "remember to", unnecessary
articles and qualifiers.

**Risk:** LOW | **Typical savings:** 10–20%

### T5 — Example Compression
**What:** Reduce verbose examples to pattern descriptions. Keep 1 concrete
example, replace others with pattern reference.

**Risk:** MEDIUM — fewer examples may reduce consistency on edge cases

**Typical savings:** 10–25% (varies by example count)

### T6 — Section Consolidation
**What:** Merge related sections that are separated in the prompt. Group all
rules together, all format specs together.

**Risk:** LOW | **Typical savings:** 5–10%

### T7 — Conditional Compression
**What:** Convert if/else instruction blocks into compact conditional notation.

**Risk:** LOW | **Typical savings:** 5–15%

### T8 — Aggressive Shorthand ⚠️
**What:** Use abbreviations, drop articles, use symbols for common words.

**Risk:** HIGH — reduces readability, may confuse some models

**Typical savings:** 10–20% additional

**RULE: Only apply T8 if target contains "aggressive", "maximum", or
"minimize at all costs". Otherwise skip.**

---

## Phase 3: Compressed Output

Apply techniques in this order:

```
T1 → T2 → T4 → T6 → T3 → T7 → T5 → T8 (if aggressive only)
```

Order matters:
1. Remove useless content first (T1, T2, T4, T6)
2. Restructure what remains (T3, T7)
3. Compress examples (T5)
4. Apply aggressive shorthand last (T8, if requested)

Produce the complete compressed system prompt, copy-paste ready.

---

## Phase 4: Verification & Report

### Behavioral Verification

Run 3 scenarios to confirm identical behavior:

**Scenario 1 — Standard Input**
A typical user request the prompt handles frequently.
Check: Does the compressed prompt produce equivalent output?

**Scenario 2 — Edge Case**
An unusual or boundary input the prompt has specific handling for.
Check: Does edge-case handling survive compression?

**Scenario 3 — Adversarial Input**
An input that tests the prompt's constraints and guardrails.
Check: Do safety constraints survive compression?

For each scenario: state the test input, expected behavior with original
prompt, confirm compressed prompt handles it identically. If any scenario
fails → restore the relevant section, note the restoration.

---

## Output Format

Structure every response exactly as:

```
## Compression Report

### Token Analysis
| Metric | Count |
|--------|-------|
| Original tokens | {X} |
| Compressed tokens | {Y} |
| Reduction | {Z}% ({X-Y} tokens saved) |
| Per-session savings (40 turns) | {calculated} tokens |
| Cost savings/session (Sonnet @ $3/MTok) | ${amount} |
| Monthly savings (est. 20 sessions/day) | ${amount} |

### Technique Breakdown
| Technique | Targets Found | Tokens Saved | Risk |
|-----------|--------------|-------------|------|
| T1: Default Removal | {count} | {tokens} | LOW |
| T2: Redundancy Merge | {count} | {tokens} | LOW |
| T3: Prose to Notation | {count} | {tokens} | LOW |
| T4: Filler Strip | {count} | {tokens} | LOW |
| T5: Example Compression | {count} | {tokens} | MEDIUM |
| T6: Section Consolidation | {count} | {tokens} | LOW |
| T7: Conditional Compression | {count} | {tokens} | LOW |
| T8: Aggressive Shorthand | {count} | {tokens} | HIGH |

### Removed (Default Behavior)
{List every instruction removed by T1, with brief explanation}

### Compressed System Prompt
===
{Complete compressed version — copy-paste ready}
===

### Behavioral Verification
| Scenario | Input | Expected | Result |
|----------|-------|----------|--------|
| Standard | {desc} | {behavior} | ✅ PASS / ❌ FAIL |
| Edge case | {desc} | {behavior} | ✅ PASS / ❌ FAIL |
| Adversarial | {desc} | {behavior} | ✅ PASS / ❌ FAIL |

### Risk Assessment
{List any MEDIUM/HIGH risk compressions with rollback instructions}

### Compression Score: {X}% reduction at {LOW/MEDIUM/HIGH} risk
```

---

## Guardrails

- NEVER remove a constraint that changes any output behavior
- NEVER compress domain-specific terminology, proper nouns, or technical terms
- NEVER remove safety/guardrail instructions even if they seem redundant
- NEVER apply T8 unless explicitly requested in the target
- ALWAYS preserve the functional hierarchy (which rules override others)
- ALWAYS keep at least 1 concrete example if the original had examples
- If the original prompt has sections marked "CRITICAL", "MUST", or "NEVER" — those survive intact
- Flag any uncertain compression with `{RISK: explanation + rollback}`

---

## GTM Use Cases

- **Agent cost reduction:** A 600-token prompt running 20,000 times/month at
  $3/1M tokens = $36/month. Compressed to 300 tokens = $18/month. Per agent.
  Most GTM stacks run 10–50 agents. {E}
- **Pre-deployment audit:** Before shipping any new agent, catch redundancy
  introduced during iterative prompt development.
- **Library maintenance:** Apply to `industry-scanner`, `battlecard-generator`,
  `cold-email-outreach`, `tam-builder` — composites with the highest token
  counts in this library. {H}
- **Budget reallocation:** Token savings fund additional agent runs within the
  same monthly budget.
- **Quality gate pairing:** Run after `gtm-prompt-quality-gate` — a structurally
  clean prompt compresses further than one with unresolved issues.

---

## Composes With

| Skill | Why compress it |
|-------|----------------|
| `industry-scanner` | Orchestrates 6+ sub-skills per run. System prompt is long by design — high compression ROI at daily scan frequency. |
| `battlecard-generator` | Multi-phase research prompt with verbose role definition and repeated safety instructions. T1 + T2 typically save 25–35% alone. |
| `tam-builder` | Config-heavy prompt with conditional branches. T7 (conditional compression) yields above-average savings here. |
| `cold-email-outreach` | Runs at highest volume in the library. Even 20% compression compounds fast at outbound scale. |
| `signal-detection-pipeline` | Long pipeline prompt with multiple phase descriptions. Section consolidation (T6) is the primary lever. |

---

## Cost

- **Skill cost:** Free — pure reasoning, no external API calls.
- **Token cost per compression run:** ~2,000–4,000 input tokens (the skill prompt + the prompt being compressed + verification output).
- **Break-even:** ~10 production runs of the compressed prompt. After that, every run is net savings.
- **Example:** Compress a 600-token prompt to 360 tokens (40% reduction). Break-even at 10 runs = 2,400 tokens recovered. Run 11 onward: 240 tokens saved per call.

---

## Example

**Original (42 tokens estimated):**
```
You are a helpful customer support agent. You should always be polite and
professional in your responses. Make sure to always greet the user warmly.
It is important that you provide accurate information. Please remember to
never make up information that you don't know.
```

**Technique log:**
- T1 removed: "helpful" (default), "polite and professional" (default),
  "provide accurate information" (default) {E}
- T4 removed: "You should always", "Make sure to always", "It is important
  that", "Please remember to" {E}
- T2 merged: "never make up information" + "provide accurate information"
  → kept stronger version {E}

**Compressed (14 tokens estimated):**
```
You are a customer support agent. Greet users warmly.
Never fabricate information.
```

**Result: 42 → 14 tokens (67% reduction, LOW risk)** {E}

---

*Built with MONNA SIGNATURE™ v11.0 — provenance-tagged reasoning framework.*
*Quality Gate /85 enforced. Open-world semantics. Anti-AI language filter active.*
*Author: Iman Elshazli (Monna)*

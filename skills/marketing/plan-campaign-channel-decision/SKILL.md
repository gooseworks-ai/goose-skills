---
name: plan-campaign-channel-decision
description: >-
  Step of the plan-campaign playbook: marks each candidate channel Run, Test, Later or No with a
  brand-fact reason and founder hours. Run plan-campaign instead; not for direct use.
version: 0.1.1
---

# Channel decision (atom)

**Load:** `../plan-campaign/references/channel-decision.md`.

**Inputs:** brand type and distribution footprint (where the product is sold); buyer groups and demand read (`research/audience/buyer-groups.md`, `research/market/demand.md`); landscape and where competitors invest (`research/competitors/landscape.md`, competitor files, `competitor_read` roster); the economics box and per-leg minimums; creative capacity (which makers and how much volume; past creative in `ads_creative_read`); tracking state; email list size; learnings log; the founder's hours; channels already committed or off-limits; existing campaign concepts (`campaign_read`).

**Do:**
1. Write every mandatory row, then the rows live for this brand type; one line "not relevant: <reason>" for conditional rows that are not.
2. For each row answer the seven lenses in your head; write the **deciding** reason in plain words with a brand fact, the evidence, how sure you are in words, and, unless kept, what would change it.
3. Prefer one or two channels done properly. A judgment-only Run becomes a Test. Novelty is never a reason. No default channel.
4. Mark execution per leg: GooseWorks levers (Meta objects it creates or pushes into) or written instructions / human hands. Add founder hours per leg; if the total exceeds what the founder has, cut a leg and say which.
5. Zero paid is allowed: state it in the paid rows with the numbers.

**Output:** the brief's `### Channel decisions` section and founder-hours line.

**Never:** a row without a brand-fact reason; "doesn't fit our audience" without saying who the audience is and where they are.

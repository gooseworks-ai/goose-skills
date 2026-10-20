---
name: plan-campaign-budget-and-tests
description: >-
  Step of the plan-campaign playbook: splits the budget across chosen channels, checks per-channel
  minimums, and writes the test plan and paid structure. Run plan-campaign instead; not for direct
  use.
version: 0.1.1
---

# Budget split, test plan, paid structure (atom)

**Load:** `../plan-campaign/references/budget-and-tests.md`.

**Inputs:** Run/Test legs and their minimums; economics box; per-leg targets; the learnings log (`knowledge_search` `source_types: ["learning"]`) so no paid-for test is re-bought; the brief's calendar phases.

**Do:**
1. Lay out every budget line; ~70/20/10 proven/promising/experiments as the default shape (rule of thumb), 10–20% held reserve with its release rule. No proven channel → say the plan is mostly tests.
2. For each paid leg: $ and %, its learning minimum, clears yes/no. A leg that does not clear is cut, merged, moved to a higher-funnel event, or labelled directional.
3. Phase the spend (pre-launch / launch week / sustain, or by week).
4. Write tests: one variable, cells, $/cell, readable threshold, end date, primary business metric, Win / Lose / Unclear actions. Small budgets test big swings.
5. One paid-structure line per paid leg (objective/event, campaigns/ad sets, audience approach, budget type and amount, creative count, destination with UTMs, applied by GooseWorks levers or written instructions).
6. Reconcile: lines sum to the budget; leg spend ÷ expected CPA = leg target in the goal chain.

**Output:** the brief's `### Budget split`, `### Paid structure`, `### Test plan` sections.

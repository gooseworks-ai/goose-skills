# Calling tests and keeping the learnings log

Load at step 5 and at step 7 (write-back). This playbook is the one owner of the learn leg; the log is what every planner and maker reads (`brand_read` learnings, `knowledge_search` `source_types: ["learning"]`), and it feeds creative generation directly — a noisy "do" steers every future ad.

## Calling a test

Read the test's row in the campaign brief's **Test plan** (hypothesis, variable, cells, readable threshold, end date, primary metric, win/lose/unclear actions). Call it only when it has ended or reached its readable threshold.

| Test | Success criteria (from the brief) | Result | Call | Confidence | Action (from the brief's rule) |
|---|---|---|---|---|---|
| T1 hidden-cloggers vs award-proof hooks | CPA ≥ 20% lower, ≥ 40 purchases/arm | −34%; 94 vs 45 purchases; store new orders rose with it | **Win** | Medium (one SKU, Goose ads only) | Release reserve to the winning angle → run-paid-campaigns |

- **Win / Loss / Unclear** — against the written criteria only. Under ~30 conversions per arm, Unclear unless the gap exceeds ~50%; reliably detecting a ~20% lift needs ~100+ per arm (rules of thumb).
- Use the primary metric the brief named, on store-joined data where available; a platform-only read caps confidence at medium.
- A messy result: say whether it is enough to act on or the test should run again (the brief's Unclear rule) — the human decides.
- Negative results are learnings too.

## Calls carried forward (calibration)

Every report opens its calls section with last week's calls and what happened: *"Scale UGC-2 (we said, high) → done 7 Oct, CPA held at $31 — right." "Kill award statics (med) → not done; still losing."* Without this nobody can tell whether the calls are any good.

## Confidence labels (on every claim and call)

- **High** — mature data, n large enough, store-joined, cause confirmed, no conflicting signal.
- **Medium** — one of: platform-only, modest n, single segment, cause partly confirmed.
- **Low** — immature, small n, claims-only mode, or conflicting stories. Low-confidence kill/scale calls are labelled "watch", not acted on.
Each call also carries **"would change if"** — the evidence that would reverse it.

## The learnings log

Written through the shared atom `../../../atoms/save-learning/ATOM.md`: the human's own words as `user_statement` with `knowledge_intent: "user_correction"`, one idea per learning, read back to confirm, own superseded learnings retired in the same call.

**One fact = one line**, starting `[learning YYYY-MM-DD]` (plus ` A-NN` when it is about an angle-bank angle):

```
[learning 2026-10-13 A-07] Open cold Meta hooks for Unplug strips (US) with hidden pore-cloggers, not awards · medium · review 2027-01-13
```

The full evidence (test, dates, ads, spend, CPAs, scope, what it supersedes) stays in the weekly report's Tests section, which is the long-form record — the fact points back to it by date.

**Kind:** `insight` by default; `do` / `dont` only for a rule the human states as a rule in their reply; low confidence is never written.

**What qualifies** (anything else stays in the report, not the log):
- an **ended test**, called; or a pattern holding **2+ weeks that clears the same n floors as a test call** (≥ ~30 conversions per arm, and for DTC with UTM-joined store orders or the account-level new-customer number moving with it; or a gap > ~50%) — B2B's one or two SQLs a week and app CPI never qualify; or a confirmed channel surprise; or a confirmed failure with its reason.
- Never weekly snapshots ("CTR was 1.2%" is a metric, not a learning).
- One rule per fact, scoped narrowly (channel, product, audience, market).
- **It must have appeared in a report the human saw.** Learnings are *proposed* in the report's decisions block and written only after the human's reply — and not those they strike.

**Show what it would retire.** Each proposed learning carries "retires: <old fact>" when it supersedes one, so a yes to it is a yes to the retirement too.

**Hygiene:**
- Before writing, `knowledge_search` with `source_types: ["learning"]` for the same claim: replicate or update the existing entry (edit by `id`) rather than add a near-duplicate.
- When a new learning contradicts an old one, retire the old one (`active: false`) in the same call.
- When a fact's review date has passed, propose re-confirm / retire in the next decisions block.
- Promote `insight` → `do`/`dont` only when the human states it as a rule.

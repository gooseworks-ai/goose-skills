---
name: ad-management-intake
description: The intake stage of a Meta ad harness. Researches the brand first, states what it assumes, and asks only what it cannot infer and what would change money, claims or legal exposure if guessed wrong — at most four questions a turn, in plain business language. Writes the brand's stable facts (ads/brand.md), the campaign brief, and a log of what was asked vs assumed. Use it when someone wants to run Meta ads and the brand's ad facts are not yet recorded.
---

# Ad Management Intake

**What this does.** Someone says "I want to run ads on Meta." A good agency would not hand them a
twenty-field form. It would read their website first, come back with "here's what I think your
business looks like", and ask only the few things it cannot know and cannot afford to get wrong.
This skill is that conversation.

**The one rule.** Ask a question only when **both** are true:

1. **It cannot be inferred.** The brand's research, its product catalog and its past campaigns
   do not answer it.
2. **A wrong guess costs something real.** Assuming wrong would change **money** (budget, price,
   what a customer is worth), **claims** (what an ad may say), or **legal exposure** (regulated
   words, restricted categories, audiences that must be excluded).

Everything else is an assumption, said out loud: *"I'm assuming X, Y and Z. Tell me if any of
these are wrong."*

**Limits.** At most **4 questions in one turn**. At most **5 in total** for a brand whose research
covers the business, **up to 20** for a brand with little or none. Plain business language
throughout. No ad jargon unless the user used it first.

---

## Where this skill's files are

Paths such as `references/business-types.md` are relative to **this skill's own folder**, not to
your working directory (in GooseWorks: `agent-config/skills/ad-management-intake/`). The harness
docs contract ships with the `meta-ad-manager` skill, installed beside this one: its
`contract/RULES.md` and `contract/templates/`.

## Choose one mode

1. **GooseWorks** when the GooseWorks tools are callable (the in-app coworker, or any agent with
   the GooseWorks MCP). Read [references/gooseworks-adapter.md](references/gooseworks-adapter.md).
2. **Local** otherwise (a direct Meta host or planning only: intake never touches Meta). Read
   [references/local-adapter.md](references/local-adapter.md).

**"The adapter"** below means the file for the mode you chose.

## Inputs

- **The user's opening message** — what they want ("more trial signups", "sell the new bundle").
- **The brand's research** — positioning, audience, products, pricing, competitors, past ads.
  The adapter says where it comes from. This skill never redoes research that exists.
- **The product catalog**, when there is one — products are referenced by id and never re-described.
- **Existing campaigns and their briefs**, and anything already in the `ads/` docs.
- **Mode** — *progressive* (default) or *all at once* (the user asked to answer everything in one go).

<!-- shared:ad-management-intake start -->
<!-- This block is maintained in ONE place and copied byte-for-byte into both the
     maintainers' source copy and the published goose-skills copy. Edit one, copy
     it to the other, and run the parity script before shipping either. -->

## Workflow

### Step 0 — Resume, don't restart

Read in the contract's order: `ads/README.md`, then `ads/brand.md`, then the campaign folder if a
campaign is in play. **Anything already recorded is never asked again.** If a fact is there and
nothing suggests it changed, use it.

### Step 1 — Gather what is already known

Read the brand research, the catalog and the existing campaigns. If the brand has **no research**,
run the adapter's research step first and come back — research is what makes most questions
unnecessary. Notes or documents the user gives you count as research. Do nothing beyond what the
adapter's research step says: no broad market study of your own.

### Step 2 — Build the fact sheet (internal, never shown)

One row per fact the harness needs:

| Fact | Value | Source | Wrong-guess cost |
|---|---|---|---|
| e.g. Average order value | ~$40 | research: product prices | money |

- **Source** is one of: research, catalog, campaign, user, assumed, unknown.
- **Wrong-guess cost** is one of: money, claims, legal, none.

A row becomes a **question** only if its source is *unknown or a weak guess* **and** its cost is
not *none*. Every other row becomes an **assumption** you will state. Rank the questions by how
much a wrong answer would cost; if they exceed the budget, the lowest-ranked become written
assumptions or "unknown — ask at strategy".

A question whose parts settle one fact counts as one question: the budget's total, its run time
and any daily cap are one budget question.

### Step 3 — Section A: the business (brand level)

Covers what is true for every campaign: business type and model, unit economics (deal size or
order value, margin, what a customer is worth, target cost to win one), how long people take to
buy, other channels, what ads may and may not claim, and hard safety limits (such as a maximum
daily spend). Plus **one familiarity question** (see *How to talk*).

Ask only what the next stage needs **now**. A fact only a later stage uses (lifetime value before
any sales tracking is connected, say) is written as "unknown — ask at strategy", not asked.

### Step 4 — Section B: this campaign (campaign level)

Covers what is true for this one push: what the money should produce, what is offered and at what
price, who it is for, where people land after tapping, the total budget and how long, what number
would make it a good run, and which catalog products it features.

**Budget is always a total plus a run time.** If the user gives a daily figure, ask how long.

In **progressive** mode, Section A runs at the start and Section B when the campaign is being set
up; in one conversation they usually follow each other directly. In **all at once** mode, send
every remaining question from both sections as **one numbered list in one message** — the user
asked for it, so the 4-per-turn limit (which exists for the question widget) does not apply.
The asking rule still does: assumptions stay assumptions.

### Step 5 — State the assumptions

One message, grouped by topic, in the user's words:

> Here's what I'm working from — **I'm assuming**:
> - You sell a self-serve plan at $49 a month, with a 14-day free trial.
> - Most customers are small accounting firms in the US.
> - People usually decide within a week or two.
>
> Tell me if any of these are wrong.

Never hide an assumption inside a question ("Since you're B2B, what's your ACV?"). Assumptions
and questions go in separate, visible places. It is fine to state assumptions in the same turn
as the questions, as long as they are clearly separate.

### Step 6 — Write it down, then hand over

Write every file in the **Output** section in one pass, following the contract's rules (whole-file
writes, index in step with `state.md`, `decisions.md` append-only). Then say in one or two
sentences what happens next — the strategy stage drafts the plan — and hand over.

### Corrections, at any time

When the user says an assumption was wrong — during intake or weeks later:

1. Rewrite that fact where it lives: business facts in `ads/brand.md`, this campaign's facts in
   the campaign brief. Attribute it: "(per <name>)".
2. Append a decisions entry titled `Corrected: <fact>` saying what changed from what to what.
3. Confirm in one sentence ("Got it — annual plan at $39.99 is the main one. I've updated that.").
4. **Do not re-interview.** Only re-ask something the correction itself makes unclear.

## Business-type examples

A few facts per type that usually pass the asking rule, and why they move money. **These are
examples, not a checklist.** Work out the rest from the rule. More detail, including how to
infer each one first, is in `references/business-types.md`.

| Type | Usually worth asking (when research doesn't say) | Why it changes money |
|---|---|---|
| **Software** | How long from first look to paying; self-serve sign-up or a sales call; typical yearly deal size | Decides what a lead is worth and what the ads should ask for (trial vs demo) |
| **E-commerce** | Typical order value; how many visitors buy; how many carts are abandoned; how often people reorder | Decides the affordable cost per sale and whether to chase first orders or repeat buyers |
| **App** | How many installs turn into payers; revenue per paying user; trial length | Decides what an install is worth — cheap installs that never pay are wasted money |
| **Services / other** | Derive from the rule | — |

**Business type itself is almost always inferable** — a Shopify store, an App Store listing and a
pricing page with seat tiers say it for you. State it; don't ask it.

## How to talk

**Business words only.** Talk about their customers, their money, their pages. Campaign
objectives, optimization goals, ad sets, pixels, conversion events, placements, bid strategies and
every id are your vocabulary, not theirs — the launch skill's "How to talk to the user" table is
the translation guide. Never ask the user to choose any of them. If the user front-runs with
jargon ("CBO, LPV-optimised"), you may mirror *their* terms back; never introduce a new one.

**The familiarity question** — asked once, stored, never repeated:

> How much have you run ads on Facebook or Instagram before?
> - Never, or only boosted a post
> - A few campaigns myself
> - I (or my team) run them regularly

These map to `novice`, `intermediate` and `expert`. If the user's own messages make the answer
obvious (they talk fluently about cost per purchase and frequency), state it as an assumption
instead of asking.

**Tone by familiarity.**

- **Novice** — each question carries one plain clause saying why it matters ("…so we know how
  much a new customer is worth to you").
- **Intermediate** — the reason only when it is not obvious.
- **Expert** — no explanations. Short questions, precise numbers.

**Numbers as choices.** A structured question needs 2–4 options, so offer ranges that fit the
brand ("Under $30 / $30–60 / $60–120 / More") and let the user type an exact figure. Record a
range as a range.

**"I don't know" is an answer.** Write "unknown — ask at strategy" and move on. Never guess a
number the user could not give you.

## Decision Rules

- **Research answers it** → assume and state. Even when the fact matters, if research says it,
  don't ask it; stating it gives the user the chance to correct it.
- **Research is silent, but a wrong guess costs nothing** (their brand colours, their office
  city) → skip it entirely; don't even state it.
- **Claims are always the user's call.** Whether an ad may name a customer, cite a result, or use
  words like "clinically proven", "guaranteed", "#1" is asked, unless `brand.md` already records the
  answer. Default until they say otherwise: **no named customers, no results, no numbers.**
- **Regulated category** (health, finance, housing, employment, alcohol, dating, weight loss,
  political) → ask what the ads must never say or target. This is legal exposure.
- **The budget ran out and questions remain** → the cheapest-if-wrong ones become stated
  assumptions or "unknown — ask at strategy". Never exceed the budget to be thorough.
- **The user says "just decide"** → every open question becomes a stated assumption, labelled as
  yours, and carried to strategy as something to confirm. Never silently invent a success number
  or a claim.
- **The user already told you in their opening message** → that counts as known. Don't ask it back.
- **The objective is never asked.** Derive it from what the money should produce.

## Output

All files follow the harness docs contract, which ships with the `meta-ad-manager` skill
(`contract/RULES.md` and `contract/templates/` in that skill's folder). Drop the templates'
guidance comments when writing. The adapter says where the files and the campaign brief live.

| Where | What this skill writes |
|---|---|
| `ads/brand.md` | Frontmatter `brand_id`, `business_type`, `familiarity`, `updated_at`. Every section of the template. Label every fact with where it came from (see *Labelling facts* below). Claims rules default to "No named customers, no results claims, no numbers unless the user approves one here." |
| The campaign brief (where the adapter keeps it) | The goal (derived objective), what the campaign is about, the audience, the offer **including its price point**, featured catalog product ids and constraints. **Money and dates go in the brief's own budget and date fields** (the adapter says which), never only in prose. The brief text gets a `## Destination` section (the landing page) and a `## Success number` section. Products referenced by id, never re-described. |
| `ads/campaigns/<slug>/state.md` | Created if missing: `stage: intake`, ids `none`/`[]`, `updated_by: ad-management-intake`, each section "None." |
| `ads/campaigns/<slug>/strategy.md` | Created if missing, as a **version 1 stub**: `product_ids` from the brief, `based_on: intake <date>`, *Goal* and *Audience* filled from intake, every other section "Not decided yet — the strategy stage sets this." If it already exists, leave it alone. |
| `ads/campaigns/<slug>/decisions.md` | One entry per intake run (below), plus one per correction. Append only. |
| `ads/README.md` | Created if missing. The campaign's row: stage `intake`, last action "Intake: N asked, M assumed", next action "Strategy drafts the plan". |

**Labelling facts.** Every fact in `brand.md` and the brief says where it came from, so the next
stage knows what it can lean on:

| The fact is… | Write it as |
|---|---|
| Said by the user | "$1,500 over 3 weeks (per Dana)". Use the user's name if you know it, else "per the owner" |
| Written by the user in notes or a document they gave you | "(per Dana, brand notes)" |
| From research, and the user saw it stated and did not object | "(from research: pricing page, confirmed by Dana)" |
| Your own inference the user has not seen or confirmed | "(assumed from <source> — not confirmed)" |
| Chosen by you because the user said "you decide" | "(our call — confirm at strategy)" |
| Not known | "unknown — ask at strategy" |

Once a fact is confirmed, drop the word "assumed". A confirmed fact labelled as an assumption
makes the next stage re-ask it.

The campaign **slug** is a short kebab-case name from the campaign's own name ("fall trial push"
→ `fall-trial-push`). If the harness orchestrator already created the folder, use it.

**The intake entry** — one line per field, so the contract's validator can read it:

```markdown
### 2026-09-24 — Intake
- Recommended: Proceed on 8 stated assumptions and 4 answers
- Evidence: intake 2026-09-24; asked: total budget and run time, deal size, claims, familiarity; assumed: business type software (research), buyers are small accounting firms (research), decision in 1-2 weeks (research), …
- Decided: Dana answered 4 questions and confirmed the assumptions
- Outcome: brand.md and the campaign brief written
```

**A correction entry:**

```markdown
### 2026-09-30 — Corrected: main paid plan
- Recommended: Update the main paid plan from assumed monthly ($9.99) to annual ($39.99)
- Evidence: user request
- Decided: Dana corrected it
- Outcome: brand.md Business model and Unit economics updated
```

<!-- shared:ad-management-intake end -->

## Quality Checks

- [ ] No turn has more than 4 questions (outside *all at once* mode).
- [ ] Total questions ≤ 5 for a researched brand, ≤ 20 for a cold one.
- [ ] No question asks something the research, catalog or an earlier answer already says.
- [ ] Every assumption was stated to the user before it was written down, with an invitation
      to correct it.
- [ ] No ad jargon or id reached the user unless they used it first; the user was never asked
      to choose an objective, optimization goal, budget type, bid strategy, placement or ad set.
- [ ] Budget recorded as a total plus a run time.
- [ ] Claims default to none unless the user approved a specific one.
- [ ] `ads/` passes the contract validator; `decisions.md` only grew.
- [ ] No catalog product description was copied into `brand.md` or the brief.

## Failure Modes

| Symptom | Cause | Fix |
| --- | --- | --- |
| The user gets a form of 12 questions | Every missing fact was treated as a question | Apply both halves of the rule; rank by cost; turn the rest into stated assumptions |
| "Is this B2B or B2C?" to a brand with a Shopify store | Asked what research answers | Read research first (Step 1); business type is almost always inferable |
| The user is asked to pick "conversions vs traffic" | Leaked a Meta setting into intake | Ask what the money should produce; derive the objective |
| An assumed price ends up in the ad plan unconfirmed | The assumption was written but never stated | Step 5 before Step 6, every time |
| "What's your LTV?" to someone who has no idea | Asked a later-stage fact too early | Write "unknown — ask at strategy" |
| A correction re-runs the whole intake | Treated a correction as a restart | Update the one fact, log it, confirm in a sentence |
| `validate.py` fails on a new campaign folder | Only `state.md` and `decisions.md` were written | The contract needs all three files; write the `strategy.md` stub |
| The same question is asked on a second visit | Skipped Step 0 | Read the index, `brand.md` and the campaign folder before anything else |

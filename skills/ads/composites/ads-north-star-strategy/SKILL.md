---
name: ads-north-star-strategy
description: Turn a brand's facts, a campaign brief and the product into a one-minute Meta ad strategy with its reasoning — goal, audience, objective and placements, budget split, how many ads and how different they must be (generate 3x so the user can choose), the test frame, the success metric, and safety rules for the user to accept. Decides what launch-meta-ad-campaign then executes, and re-reads the strategy after a deep check to show which assumption changed. Use it after intake and before any creative is generated or any campaign is built.
---

# Ads North Star Strategy

**What this is for.** Intake produced facts: what the business sells, what a customer is
worth, how long they take to buy, what the user wants from this money. This skill turns them
into a strategy the user can read in a minute. Each choice comes with its reason, because
the deep check re-reads this file weeks later and has to see what was assumed.

**This skill decides. `launch-meta-ad-campaign` executes.** The launch skill already holds
the rules for what to optimize for, how big a test the budget buys, and how to structure the
campaign. This skill **applies** those rules and records the answer. It does not restate
them. When they change, they change in one place.

**The three things most strategies get wrong:**

1. **Optimizing for a cheaper action than the real goal.** Traffic is cheaper than leads.
   Clicks are cheaper than both. A strategy that picks the cheap action because it is
   available has decided to buy the wrong people.
2. **Splitting a small budget.** One audience with 2–3 genuinely different ads beats three
   audiences that each starve.
3. **Ads that differ in colour, not in argument.** Three versions of one message teach
   nothing. The angles have to differ in *what they say*.

---

## Where this skill's files are

Paths are relative to **this skill's own folder**, not your working directory (in GooseWorks:
`agent-config/skills/ads-north-star-strategy/`). The harness docs contract ships with the
`meta-ad-manager` skill and the Stage 2 and Stage 4 rules with `launch-meta-ad-campaign`; both
are installed beside this one.

## Choose one mode

Use the first mode that is available:

1. **GooseWorks** when the GooseWorks tools are callable. Read
   [references/gooseworks-adapter.md](references/gooseworks-adapter.md).
2. **Direct Meta** when there is no GooseWorks, but a Meta token and ad account are available.
   Read [references/direct-meta-adapter.md](references/direct-meta-adapter.md).
3. **Planning only** when neither is available. Read
   [references/planning-only.md](references/planning-only.md).

**"The adapter"** below means the file for the mode you chose.

## Purpose

Write `strategy.md` for one campaign: goal, audience, objective and placements, budget,
creative plan, test frame, success metric and reasoning. Then propose safety rules for the
user to accept. Use it after intake and before any creative is generated. Use it again
after a deep check, to revise the strategy and say what changed.

<!-- shared:ads-north-star-strategy start -->
<!-- This block is maintained in ONE place and copied byte-for-byte into both the
     maintainers' source copy and the published goose-skills copy. Edit one, copy
     it to the other, and run the parity script before shipping either. -->

## Inputs

| Input | Where it comes from | If missing |
|---|---|---|
| **Brand facts**: business type, unit economics (ACV or AOV, margin, LTV, CAC target), sales cycle, other channels, claims rules, safety limits, the user's familiarity with Meta | the brand file intake wrote | read brand research; ask only per the asking rule below |
| **Campaign brief**: the goal in the user's words, the offer, the ICP, the destination, total budget and duration | the campaign brief | ask |
| **Product**: what is sold, price point | the catalog, by product id | ask which product |
| **Account facts**: lifetime spend, tracking present, weekly volume of the target event | read from the ad account (launch skill, Stage 2) | assume a cold account with no tracking, and say so |
| **Existing customers** (a customer list or custom audience) | the ad account's audiences | no exclusion; say so |
| **Brand record ids**: brand id, the coworker agent that owns the files | the brand record | ask the host; never invent one |
| **What the executing host can launch**: which objectives, and how many ads per ad set | the host's launch tool | assume Traffic only, 2–3 ads |
| **Deep-check findings** (re-read only) | the deep check's report | not a re-read |

**The asking rule.** Ask only when both are true: the answer cannot be inferred from
research, the catalog or existing campaigns, **and** a wrong guess changes money, claims or
legal exposure. State everything else as an assumption: "I'm assuming X, Y, Z. Tell me if
any are wrong." Ask at most four questions per turn, in plain words.

Things that usually pass the rule at strategy time: the budget ceiling, what a lead or sale
is worth (when the brief has no ACV/AOV), and whether a named result may be claimed.
Things that never pass it: the objective, the optimization goal, the structure and the
placements. Those are yours to decide.

**Facts that came from intake, not from a tool.** An account fact the user or intake stated
(lifetime spend, weekly events) has no sync time. Write it as an assumption ("per intake,
not yet read from the account"), never as an `- Observed:` line with an invented sync
time. Once the account is read, the observation replaces the assumption.

## Composed Atoms

- `launch-meta-ad-campaign`: its Stage 2 tables (choose the optimization goal, size the
  test honestly, structure follows the budget) and its Stage 4 test design. **Read them
  before deciding. Do not copy them.**
- `meta-ads-analyzer`: produces the deep-check findings that trigger a re-read.
- The host's campaign-planning and creative-generation tools (the adapter names them).

## Workflow

1. **Read** the brand file, the campaign brief and the product. On a re-read, also read the
   current `strategy.md`, the deep-check findings and the campaign's decision log.
2. **Fill the gaps** with the asking rule. Record every assumption. It goes into Reasoning
   and, if it matters, into the launch brief's "what I'm unsure about".
3. **Decide**, in the order of the decision rules below. Write the "because" for each.
4. **Write `strategy.md`** in the contract format (below). Increment `version` on any change.
5. **Show the user a one-minute summary** in their words. For a novice, explain each term
   the first time. For an expert, drop the explanations and show the numbers.
6. **Propose the safety rules** (decision rule 6) and ask the user to accept, change or
   decline each. Save the accepted ones as pre-approved rules in the campaign state.
   Record the proposal and the answer in the decision log, including declined rules.
7. **Hand off**: concepts carry the angles → request creatives sized by the plan (3x)
   → the judge loop and the user pick the ads that run → `launch-meta-ad-campaign`.

## Decision Rules

Apply them in order. Each writes its reason into the strategy.

### 1. Goal → objective (the honest-objective rule)

Decide the objective from the **business outcome**, not from what is easiest to buy:

| The business | The outcome that pays | Right objective |
|---|---|---|
| Software, sales-led, cycle over ~30 days or ACV over ~$2k | qualified pipeline: demo requests, sales calls | **Leads** |
| Software, self-serve with a free trial | trial starts that activate | Leads (a signup event), or Sales if paid checkout is the first step |
| E-commerce | purchases | **Sales** |
| App | installs that pay | App promotion |
| "Does this work at all?" | learning, not revenue | Traffic, as a stated plumbing test |

Say **why the cheaper objective is wrong** for this business. For a long-cycle software
brand, Traffic buys people who tap ads. Those people rarely book a call and never become
a $10k contract. A low cost per click hides the fact that nothing in the pipeline moved.

**When the host cannot launch the right objective**, do not quietly downgrade. Write three
things, in this order:

1. The right objective and why (above).
2. **The bridge** the host *can* launch: a Traffic campaign that pays for landing-page
   views (people who arrive, not just tap) to the page where the real action happens. It is
   **judged on cost per lead from the tracking, never on cost per click**. Give it a
   stopping point: after the evidence threshold, if leads cost more than the target, stop.
3. The limit, in one line: "To have Meta optimize for leads directly, the campaign has to
   be created in Ads Manager until the host can launch it."

Never write a strategy whose success metric is a click for a business that makes money on
a lead or a sale.

**The right objective and the right optimization goal are two different claims.** Sales can
be the right objective while the account is still too thin to optimize for purchases (under
~50 a week, launch Stage 2). Write both: "the right objective is Sales; at 6 purchases a
week Meta could not optimize for them yet, so this run pays for landing-page views and is
judged on cost per purchase."

**Bridge stopping point.** Stop the bridge early when it has spent 3× the target cost per
result with zero results. Otherwise, judge cost per result against the target at the end of
the run, or at the test frame's threshold if that comes first.

### 2. Optimization goal, test size, structure

Apply the three tables in `launch-meta-ad-campaign` Stage 2: "choose the optimization goal
from those numbers", "size the test honestly" and "structure follows the budget". Record:

- the optimization goal and the account fact that decided it (tracking present? weekly
  event volume?);
- what this budget **honestly** buys (plumbing test, traffic test, or real-action
  optimization). The table has gaps between its rows. A spend that falls between two rows
  gets the **lower** row: $20–50 a day is still a traffic test for comparing ads, though it
  counts results for the campaign as a whole. If the budget cannot measure the success metric, say so in the strategy.
  Don't let the launch brief discover it;
- **one ad set** unless there is a concrete business reason to split, such as prospecting
  versus remarketing, or countries that need separate money. Write the reason for one, or
  the reason for two.

### 3. Audience and placements

- **Audience:** broad (location, age band, exclusions) on a cold or small account, and let
  delivery find the buyers. Limits the user stated, such as an age range, a gender or a
  country, are business choices: keep them. "Broad" means no interest targeting inside them. Use interests or lookalikes only when the account has the
  history to seed them. Always exclude existing customers when that list exists.
- **Placements:** automatic placements by default. Restrict them only for a reason, such
  as no vertical (9:16) creative, a linked Instagram account that is wrong, or a claims
  rule that one surface breaks. The creative formats follow from the placements: 1:1 or
  4:5 for feeds, 9:16 for Stories and Reels.

### 4. Creative plan: count, diversity, and the 3x rule

- **Ads that run** = what the structure supports. At small budgets that is **2–3 per ad
  set**. More ads split the learning. Fewer leave nothing to compare. If the host caps it,
  cap to the host.
- **Diversity:** each running ad argues something different. Use a different **angle**
  (the reason to care: speed, cost, fear of missing out, proof, identity), not a different
  colour or crop. Name the angles. Keep format and destination the same, so the test has
  one variable.
- **Generate 3x.** Creatives requested = **3 × ads that run**. The judge loop throws out the
  weak ones, and the user chooses from the rest. Request it as *the plan's count*, so the
  tripling is explicit. **If the user named a number of creatives, use their number as is
  and never triple it.** Write both numbers, e.g. "3 ads run, chosen from 9 generated
  (3x rule)", or "user asked for 12; used as is".
- Each angle becomes a campaign concept (person, message, proof). A claim goes into an ad
  only if it passes the brand's claims rules. When those rules allow no results or named
  customers, **proof** is a verifiable product fact from the rendered page: the price,
  what is included, how long it takes, the guarantee. Never a result.

### 5. Test frame and success metric

Apply `launch-meta-ad-campaign` Stage 4: what is being compared, the single variable, how
the budget splits, the metric that decides, and the evidence needed before judging. The
**success metric follows the goal from rule 1**: cost per qualified lead, cost per
purchase, cost per paying install. Measure it with what the tracking actually counts,
e.g. a booked demo. When quality is judged downstream, e.g. the sales team qualifies demos,
say how the two are reconciled: "cost per booked demo, checked weekly against the demos
sales marked qualified". Give a threshold drawn from the unit economics, e.g.
"a lead is worth it at up to $150, because at a 10% close rate and a $12k ACV, a
customer at $1,500 pays back in the first two months." If the budget cannot reach the
evidence threshold, the test frame says so.

### 6. Safety rules to propose

Propose these. Save them only after the user accepts:

| Rule | Default threshold | Why |
|---|---|---|
| Pause everything if the destination is down | the page fails to load on two checks in a row | every tap on a broken page is paid for and lost |
| Pause an ad set that has spent X with zero results | X = the **larger** of 2× the target cost per result and 3 days of its budget | past that point the money is not buying learning; the 3-day floor stops a small budget from pausing before a normal gap between results |

With one ad set, pausing the ad set pauses the campaign. Say so when you propose the rule.
Stay inside the brand's safety limits, such as the maximum daily budget and excluded
audiences. **Budget changes are never pre-approved**; they always go back to the user.

### Re-reading after a deep check

The deep check brings evidence. The strategy says which **assumption** the evidence
overturned, not just which number moved.

1. Bump `version`, and set `based_on: deep check YYYY-MM-DD`.
2. **Judge each comparison against its own threshold.** The test frame's evidence bar
   applies per comparison, not to the whole check. Two angles past the bar can be judged
   while a third that is below it stays unjudged. Change only what the evidence reaches.
3. Add **`## What changed`** after Reasoning. A bullet belongs there for **either** of two
   reasons: the evidence overturned an assumption v*N* stated, or it answered a question the
   test frame said this run would answer. Each bullet has four parts: the assumption or
   question, what version N said, the evidence (a tagged `- Observed:` line), and the new
   decision. A finding that only confirms the plan working does not belong here. Neither does
   a finding still below its bar: put it under a short "could not judge yet" line instead.
4. **Never cut an audience on a segment's average cost.** "9 of 11 purchases came from
   45–54" from a handful of results is the breakdown effect (see `meta-ads-analyzer`).
   Delivery was already concentrating on the buyers. Narrowing to that segment usually
   raises the cost. Leave the audience alone unless the segment finding clears the bar
   *and* a business reason agrees.
5. **A budget change is its own recommendation.** Put it in the campaign state as a
   separate open recommendation (awaiting). It is never part of the strategy revision and
   never decided inside it.
6. Append a decision-log entry for the revision. The user approves the new version like
   the first one.

If no comparison clears its bar, change nothing, and say what the check could not yet judge.

## Output

`ads/campaigns/<slug>/strategy.md`, in the contract format (the `meta-ad-manager` skill's
`contract/templates/campaign/strategy.md`), where the adapter keeps the `ads/` files:

- Frontmatter: `campaign`, `product_ids` (catalog references, never copies), `version`,
  `updated_at`, `based_on`.
- Sections: Goal · Audience · Objective and placements · Budget · Creative plan · Test frame
  · Success metric · Reasoning, plus `## What changed` on a re-read.
- Goose's plan numbers are written plainly ("$20 per day for 14 days", "3 ads from 9").
  Anything read from a tool goes on an `- Observed:` line with its window, sync time and
  source. Never call an observation current.
- At most 8 KB. It is read in a minute, not studied.

The skill also writes, in the same turn:

- **The campaign state file**: an open recommendation `R<next free n>: approve strategy vN
  — awaiting`, and, only once accepted, the safety rules under `## Pre-approved rules`.
  On a first run, set stage `strategy`. On a re-read, leave the stage as it is: a live
  campaign stays `live`.
- **The decision log**, which is append-only: one entry for the strategy
  (`Decided: shown to the user; awaiting approval`, `Outcome: pending`) and one for the
  safety-rule proposal and its answers. When the user answers, record it by filling that
  entry's `- Outcome: pending` line (the only line that may change), e.g. "approved v1 on
  2026-09-28; launched". Never edit the Decided line afterwards. A re-read that finds the v1
  entry still pending fills in its Outcome in the same way.
- **The campaign index row**: its stage and next action. It creates the index or the
  campaign folder only when the orchestrator has not.
- **The brand file**: only the facts the user answered during this skill. Other brand
  facts are intake's.

<!-- shared:ads-north-star-strategy end -->

## Quality Checks

- [ ] The objective follows the business outcome. If the host can't launch it, the bridge
      and the limit are written out.
- [ ] Reasoning explains why the obvious cheaper alternative is wrong.
- [ ] One ad set, or a written business reason for more.
- [ ] 2–3 running ads with named angles that differ in message; the generated count is 3x,
      or the user's own number, and the strategy says which.
- [ ] The success metric is the goal's result, with a threshold from the unit economics.
- [ ] The budget's honest limit is stated when it cannot measure the metric.
- [ ] Every assumption made in place of an answer is listed.
- [ ] No safety rule was written as pre-approved before the user accepted it.
- [ ] The file passes the contract validator.
- [ ] On a re-read: the version is bumped, `## What changed` names the assumption, and there
      is a decision-log entry.

## Failure Modes

| Symptom | Cause | Fix |
| --- | --- | --- |
| The strategy for a B2B brand optimizes for clicks and reports a great CPC | The objective was chosen from what the host can launch | Apply rule 1: name Leads, write the bridge judged on cost per lead, and state the limit |
| Three ad sets at $10/day each | Splitting by audience "to test audiences" | Rule 2: one ad set; the test is between angles |
| Nine generated ads, all the same headline in different colours | Diversity read as visual variety | Rule 4: angles differ in message; name them |
| Thirty creatives when the user asked for ten | The 3x rule was applied to the user's own number | Triple only the plan's count; a user's number is used as is |
| A safety rule in state before the user said yes | Proposal treated as acceptance | Save only accepted rules; log the answer |
| The re-read strategy just has new numbers | Evidence recorded, assumption not named | `## What changed`: assumption → old → Observed evidence → new decision |
| The strategy promises an answer the budget can't produce | Test size not checked | Launch skill Stage 2 "size the test honestly"; write the limit |

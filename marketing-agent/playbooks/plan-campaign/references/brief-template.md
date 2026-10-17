# The campaign brief — fixed shape

Load at step 7; the Write-back section at the end is used after the human's yes. The brief is saved as the campaign record's `brief_md` with **these headings, in this order**, so the sibling playbooks can find their section by name. Keep headings exact; fill every section or write "none — <reason>".

```markdown
# <Campaign name>

## Decision
Do this first, because <the one reason that matters most>: <the first action this week>.
- Goal: <number, metric, date> — the expected scenario delivers <n> (<hits / misses by n>).
- Where we run: <channels, with budget each>. Where we don't: <the 2–3 rejections that matter, one reason each>.
- Split: <proven / tests / reserve>. First test: <hypothesis> — readable by <date>.
- Needed from you this week: <approvals, inputs, assets>.
(One screen. Everything below is the working detail.)

## Status
Draft for approval | Approved <date> by <name> · version N · written YYYY-MM-DD · mode: launch | goal push | always-on | replan (month) | trigger replan (<trigger>)
<!-- change-log slug: <campaign-slug> -->
Inputs: goal ✓ (human) · budget ✓ · date ✓ · margins ✓/assumed · stock ✓/unknown · customer research ✓/missing · competitor research ✓/missing · signed-off claims: N
Assumptions to confirm: 1) … 2) …

## Audience and message
Primary segment (from the customer research) · anti-persona · headline message (the founder approves it) — map to `intake.audience` and `intake.core_message`.

## Goal chain
North Star: <number, metric, date> — agreed by <founder>.
Baseline (no campaign): … · Incremental target: …
| Leg | Target | Derived from | Readable by |
Scenarios: conservative / expected / optimistic → <outcome each>. <If only optimistic hits: say so here.>

## Economics
| Line | Value | Source |   ← the economics box (unit-economics.md)
Allowable CAC: $X · Target CAC: $Y · Break-even ROAS/MER: Z

## Renegotiation case
none — the expected scenario meets the goal.   OR   gap / levers / recommendation

## Channel decisions
| Channel | Verdict | Binding lens | Reason (brand fact) | Evidence | Confidence | Flip condition |
(a row for every mandatory channel that is plausible for this brand and the conditional rows live for its type; mandatory channels that clearly don't apply fold into **one line** — "Not relevant: LinkedIn (consumer buyer), CTV (a readable flight costs more than the budget), retail media (not stocked)" — each still with its reason; zero-paid plans state it here)
Founder hours this plan needs: ~N h/week (by leg).

## Budget split
| Line | Pre-launch | Launch wk | Sustain | Total | % | Leg minimum | Clears? |
Reserve: $X (released on: <test win / miss>).

## Paid structure
One line per paid leg (objective, structure, audience, budget, creative count, destination with UTMs, applied by product levers | written instructions).

## Test plan
| # | Hypothesis | Variable | Cells | $/cell | Readable when | Ends | Primary metric | Win / Lose / Unclear → action |

## Angles per channel
| Channel | Angle (from the angle bank) | Customer words it rests on (from the customer research) | Approved claim (exact text, from the sign-off) | Hook direction | Policy / regulated-claim risk |

## Offer
none / existing <offer> / needs an offer designed (not covered yet). Margin impact: … Collisions: …

## Calendar
| Date | What | Owner (role) |

## Asset list
| ID | Leg | Placement | Spec (format, ratio, length) | Angle | Message / hook | Claim (verbatim) | CTA → destination | Producer (role) | Due | Depends on |

## Measurement plan
Per leg: conversion event, UTMs (`utm_source=<platform>&utm_medium=<paid_social|cpc|email|organic|creator>&utm_campaign=<campaign-slug>&utm_content=<angle>-<src id>` — one convention across planning, paid and analysis), promo code (if any), attribution window, the store/CRM number it is judged on, blended MER target, "how did you hear" question (yes/no).

## Hand-offs
| Leg | Goes to (role) | What they take | Human-executed? |

## Replan triggers
| Trigger | Threshold | What happens |

## Risks and unknowns
```

## Writing each section well

- **Goal chain** rows say where every number came from (own history / human / base rate / assumption).
- **Angles** rest on the angle bank (research-competitors) and the customer's own words (research-market's voice-of-customer bank). Name the source line. Every claim used is one learn-my-brand signed off (the "Claims you may use" `must` facts named by the "Claims sign-off" marker and the dated Brand record), quoted exactly, within its scope and before its review date. With no sign-off on file every claim and proof point is a candidate: the message is marked **needs proof (sign-off)** — never filled in. A product with no approved claim gets a calendar row "claims signed off" (owner: claims) by T-30.
- **Same angle, adapted per channel.** Meta: a scroll-stopping first 2 seconds; Google: the searcher's words; email: the story; LinkedIn: the business outcome with proof. Copy-pasting one line everywhere is a failure.
- **Asset list** is complete enough that a designer could start today: every row has format and ratio, the message, the claim, the destination, a producer and a due date. Count check: creative volume per paid leg matches the channel's need (e.g. Meta at ~$10k/month ≈ 8–15 net-new creatives a month).
- **Hand-offs**: one row per leg, no silent legs. The brief names **roles**, never playbooks (the marketer reads it): `static ads` · `video ads` · `photos` · `content` · `paid` · `email` · `organic social` · `creators` · `claims` · `human`. Behind each role (for the agent):
  - static ads → make-static-ads (from the asset list and campaign concepts)
  - video ads → make-video-ads
  - photos → make-product-photos
  - paid → run-paid-campaigns (launches from this campaign record)
  - email → email-lifecycle (this calendar drives its broadcasts)
  - content → make-content (articles and long-form)
  - claims → learn-my-brand (sign-off for a new product)
  - **human** → landing / product-page copy, sales or retailer enablement (one-pager, battlecard, demo script), PR and press lists, outreach, events — no maker covers them yet
  - **search ad copy, keyword lists, PDP / landing-page copy** → **human-executed** until a maker covers them: the asset row carries the angle, the searcher's words (voc-bank id) and the exact signed-off claims; run-paid-campaigns' Google launch card takes the copy from that row once the human confirms it, and may propose keywords from research-market's demand read (keywords are not claims)
  - organic posts → run-organic-social (drafts; the human posts)
  - creators → work-with-creators (research half; the human contacts and closes)
  - outreach, PR, events, retail, anything with no playbook → **human-executed**, measured as a row in analyze-performance's channel table
- **Policy risk** per angle: personal-attributes wording ("your acne", "your debt"), before/after, health or financial outcomes, special ad categories — flag it; make-static-ads and make-video-ads run the full policy check.
- **Replan triggers** (pre-committed, cheap): stock cover < ~3 weeks on a featured SKU; CAC > allowable +30% after the learning period; account restriction or a hero asset disapproved; a competitor launch or price cut on the date; a tracking break; the date slipping; a budget cut; an early clear winner (pull the reserve forward).

## Excellent vs. passable (the reviewer's eye)

| Passable | Excellent |
|---|---|
| "Run Meta and email." | Every mandatory channel row with verdict, binding lens, brand fact, flip condition. |
| "$5k budget: 60% Meta, 40% Google." | Lines incl. production, creators, offer cost and reserve; each paid leg checked against its learning minimum. |
| "Test different creatives." | T1–T3 with one variable, $/cell, readable threshold, end date and a rule for Unclear. |
| "Launch March 1." | Backwards calendar with lead times; late items flagged. |
| "Make 10 ads." | 10 rows: placement, ratio, angle, hook, claim id, destination, producer, due. |
| Hits the goal. | Says which scenario hits the goal and hands over the renegotiation case when it doesn't. |

## Write-back (after the human's yes)

1. Re-check `ads_creative_read view: "approvals"` for plans waiting on this campaign; if any, ask before saving (saving discards them).
2. `campaign_upsert` with `campaign_id` (the draft saved at step 9, or the matching campaign): `brief_md` = the approved brief with the Status line set to "Approved <date> by <name>" and the version bumped; `status: "planned"` only when the campaign was `draft` (an `active` campaign stays `active`); `name`; `goal` (the closest allowed value — the real metric is in the brief); `budget_cents` = the total budget; `starts_on` / `ends_on`; `hero_product_ids`; `channels: ["paid_social"]` only when a paid-social leg is Run/Test; `intake` fields in the human's own words (about, audience, core_message, offer, situation, constraints, objective) — show drafted audience/core message to the human as part of the approval.
3. Concepts for paid static/video angles: `update_campaign_concept` for existing ones (it discards that concept's un-started plans — check first), `add_campaign_concept` for new ones; proof only from a claim that is both signed off and server-accepted for that product.
4. Business facts the human stated (margin, list size, capacity, founder hours) stay in the brief's Economics and Status sections — there is no brain field for them yet.

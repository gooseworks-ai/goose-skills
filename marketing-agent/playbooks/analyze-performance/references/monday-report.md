# The Monday report — fixed shape

Load at step 6. Same report, same day, same shape every week: consistency is what makes movement visible. Saved to `reports/performance/<YYYY-MM-DD>.md` in the brand's coworker workspace and shown in chat. Numbers below are illustrative.

```markdown
# Performance read — week of 6–12 Oct · <brand>

Since last time: <3–5 lines from the run-memory outcome check — what was done since the last read and what it did; e.g. "The 40% raise on Sales – Broad (applied 1 Oct) is too early to read until 15 Oct; store orders are flat so far.">
Compared with: last week · trailing 4-week avg · same week last year
Data maturity: Fri–Sun platform conversions still landing; restated next Monday.
Referee (DTC): store net + new-customer revenue ✓ (Shopify export) · Ulta sell-through — not measured (send the weekly portal report)
Coverage over the roster: Meta ✓ (export; Goose ads in detail = 62% of Meta spend) · Google ✓ · email — not measured (send the Klaviyo flow + campaign CSVs) · Instagram/TikTok organic ✓ · Not used: apps, local · Future rows: creator codes, outreach, WhatsApp
Missing this week: none | <list, with the one export that would fix it>

## Plumbing
✓ No breaks detected (overclaim ratio 1.26×, 4-wk 1.22–1.30×).   OR   🔴 <break, symptom, likely location, check, fix, what it blocks>

## Headline
(The lines above it say what we looked at and what's missing; the move comes after the numbers it rests on.)
1. Spend rose 30% with no new revenue (store net, confirmed); the top two Meta ads are wearing out — click rate down 35% in two weeks (likely).
2. New-customer orders 412 vs 450/week target (−8%); new-customer MER 1.9 vs break-even 2.5 (blended 3.3, 4-wk 4.1).
So, do this first (because of 1 and 2): hold Meta scaling and fix the fatiguing creative — you, this week.

## Business truth
| | This wk | Last wk | 4-wk avg | Same wk LY |  ← revenue-join.md table

## Channels   (one row per rostered channel; columns labelled claimed)
| Channel | Spend | Claimed conv. / revenue | Claimed ROAS/CPA | vs target | Source | Confidence |
| Meta | … | … | … | … | export | med |
| Google | … | … | … | … | export | med |
| Email/SMS | — | used — not measured (send Klaviyo CSVs) | | | | |
| Organic IG/TikTok | — | top post 4.1× median | | | GooseWorks | n/a |
Claimed purchases ÷ store orders = 1.26× (4-wk 1.22–1.30×) — a floor: email not provided. Pacing: $6.1k of $12k month-to-date at day 12/31 (51%) — ahead of plan.

## Two stories   (only when they disagree)
Platform story … · Blended story … · Recommendation … · What would settle it … · Your call.

## Why it moved
1. <cause> (<confidence>): <evidence>.  …  Ruled out: …  Unconfirmed: …

## Creative ranking
| Angle | Hook | Format | Ads | Spend | Purch. | CPA | CTR (trend) | Weeks won (of last 4) | Verdict |
Coverage: …

## Email & SMS · Organic · Google · Apps · Local   (one short block each, or "not measured / not used")

## Tests
| Test | Criteria | Result | Call | Confidence | Action |

## Recommendations   (acted on only after your yes, in the paid run)
Last week's recommendations → what was done (decision log) → what happened (worked / didn't work / too early / can't tell, with the paid run's numbers and the store check).
| # | Call | Object | Why | Confidence | Would change if |
| C1 | Hold Meta budget | account | marginal aMER 0.1 | med | step-down shows < 15% new-revenue loss |
| C2 | Kill 3 award statics | ads … | 2.4× target CPA after $2.1k | high | — |
| C3 | Add 6 negatives (Google) | Search – Non-brand | $347 on 0-conversion terms | high | — |

## What to make next
| What | Why | Producer | By |
| 4 new hooks on "hidden pore-cloggers" (2 video, 2 static) | won 3 of the last 4 weeks; CTR 1.6% → 1.1% since 29 Sep | video and static ads | 20 Oct |
| Turn post "<…>" into a paid test | 4.1× median engagement | static ads | 17 Oct |

## Learnings proposed (written to the brand brain after you've seen them — strike any you disagree with)
1. [learning 2026-10-13 A-07] Open cold Meta hooks for Unplug strips (US) with hidden pore-cloggers, not awards · medium · review 2027-01-13 (evidence: Tests section above)

## For next week
Asks: <the exports needed> · Nudges: <visibility re-check if organic search moved sharply> · Replan triggers fired: <none | list — flagged for the replan>

## Your decisions (reply in one line)
1. Story: run on **blended** (recommended) or platform?
2. Learnings: keep 1, 2, 3 — or strike any (2 would retire: "<old entry>")
3. Re-run test T2 for 7 more days? yes / no
```

On the reply: re-save the report with a `## Decisions` section (their words), record the story pick in `definitions.md`, write the kept learnings with their words as `user_statement`.

## Rules for the report

- Order: header → plumbing → headline → business truth → channel table → the rest. The channel table has one row per **rostered** channel (a rostered channel without numbers is "used — not measured (send X)"); "Not used" and "Future rows" are one line each in the header.
- Label per section or column — **truth** (referee), **claimed** (platform) or **derived** — not per number.
- Every claim and call carries a confidence label; every call carries "would change if".
- Platform revenue is never quoted as truth; the two stories are never averaged.
- The headline is three lines the marketer can act on before reading further.
- "What to make next" is in angle-and-hook terms with a producer and a date, and rests on the history (`run-memory.md`); "what worked" means it held 2+ runs or won a test.
- If a replan trigger from the campaign brief fired (CAC breach, stock-out, tracking break…), say so in plain words ("this is worth replanning").
- Plain words for the marketer: no tool, playbook or internal ids; recommendations are labelled as such — acting on them is a separate, approved step.

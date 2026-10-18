# The campaign plan — fixed shape

Load at step 7; the Write-back section at the end is used after the marketer's yes. One text, three homes (versions continue from the campaign record's brief version — the first replan of an approved v2 is v3): the readable file (`gooseworks-reports/<brand-slug>/<YYYY-MM-DD>-campaign-plan.md`), the brand copy (`plans/<slug>/<YYYY-MM-DD>-plan-v<N>.md`) and the campaign record's `brief_md`. It follows `../../../atoms/write-report/ATOM.md` §1 — title, In short, the story, what to do, what we couldn't check, sources — while keeping the **section headings below exactly**, because the paid run, the weekly analysis, the ad makers and the email sends find their section by heading. Each section opens with its point in one plain sentence, then the detail. No internal ids, codes, file paths, tool or playbook names anywhere; rows are numbered 1, 2, 3.

```markdown
# <Brand> — campaign plan: <campaign name>, <D Mon YYYY>

## In short
- **Do this first:** <the one move this week> — because <the reason that matters most>.
- **The goal:** <number, metric, date>. The expected case gets <n> (<hits / misses by n>); the cautious case gets <n>.
- **What this plan covers:** every channel that could work — <ads / email / organic / creators…> — kept: <list with budget each>, because <brand facts>; dropped: <the 2–3 that matter, one reason each>.
- **The money:** <proven / tests / reserve, in dollars>. **First test:** <what we'll learn> — readable by <date>.
- **Needed from you this week:** <approvals, inputs, assets>.

## Audience and message
<Point sentence: who this is for and the one thing every piece says.> Primary group (from the customer research) · who it's not for · the headline message (you approve it).

## Goal chain
<Point sentence: whether the money gets there.>
The goal: <number, metric, date> — agreed by <founder>. Without the campaign: … · What the campaign must add: …
| Channel | Target | Where the number comes from | Readable by |
Cautious / expected / hopeful → <outcome each>. <If only the hopeful case hits the goal, say so here.>

## Economics
<Point sentence: what one new customer may cost and still make money.>
| Line | Value | Where it comes from |
Most a customer may cost: $X · aim: $Y · break-even: Z

## If the goal needs changing
none — the expected case meets the goal.   OR   the gap / what each lever buys / what I recommend

## Channel decisions
<Point sentence: where we run, where we don't.>
| Channel | Keep? | Why (the deciding reason, with a brand fact) | Evidence | How sure | What would change it |
Not relevant: <channel (reason)>, <channel (reason)>, …
Your hours this plan needs: ~N h/week (by channel).

## Budget split
<Point sentence.>
| Line | Before launch | Launch week | After | Total | % | Smallest amount that teaches us anything | Enough? |
Reserve: $X — released when <a test wins / a miss>.

## Paid structure
One line per paid channel: what it optimises for, how it's set up, who it reaches, budget, how many ads, where the ads link (with link tags), and whether GooseWorks makes the change or you do from written steps.

## Test plan
<Point sentence: what we'll learn first.>
| # | What we think | What changes | Versions | $ each | Readable when | Ends | Judged on | If it wins / loses / unclear |

## Angles per channel
| Channel | Angle | The customer words it rests on | Approved claim (exact words) or "needs proof" | Opening idea | Ad-rule risk |

## Offer
none / <the offer you named> / needs an offer designed (not covered yet). What it costs in margin: … Clashes: …

## Calendar
<Point sentence: the date everything works back from.>
| Date | What | Who (role) |

## Asset list
<Point sentence: how many pieces, and the first due date.>
| # | Channel | Placement | Format, size, length | Angle | Message / opening | Claim (exact) or "needs proof" | Button → page it links to (plain, e.g. "pricing page") | Made by (role) | Due | Needs first |
(Link tags are not pasted into rows — one rule in the Measurement plan covers every link.)

## Measurement plan
<Point sentence: how we'll know it worked.> Per channel: what counts as a result, the real number it's judged on (store / CRM, not the platform's claim), any code, and the "how did you hear about us?" question. Link tags, one rule for every link (for whoever builds the ads; the piece number is the asset-list row): `utm_source=<platform>&utm_medium=<paid_social|cpc|email|organic|creator>&utm_campaign=<campaign-slug>&utm_content=<angle>-<row>`.

## Hand-offs
| Channel | Who takes it (role) | What they take | Done by you? |

## Replan triggers
| If this happens | Threshold | Then |

## What we couldn't check
One line each, with why: assumptions to confirm, unknowns, risks.

## Sources
Dated links for every outside fact (benchmarks, competitor ads, prices).

## Status
Draft for approval | Approved <date> by <name> · version N · written YYYY-MM-DD · mode: launch | goal push | always-on | replan (month) | trigger replan (<trigger>)
<!-- change-log slug: <campaign-slug> -->
```

## Writing each section well

- **Goal chain** rows say where every number came from (own history / human / base rate / assumption).
- **Angles** rest on the angle bank (research-competitors) and the customer's own words (research-market's voice-of-customer bank). Name the source line. Every claim used is one learn-my-brand signed off (the "Claims you may use" `must` facts named by the "Claims sign-off" marker and the dated Brand record), quoted exactly, within its scope and before its review date. With no sign-off on file every claim and proof point is a candidate: the message is marked **needs proof (sign-off)** — never filled in. A product with no approved claim gets a calendar row "claims signed off" (owner: claims) by T-30.
- **Same angle, adapted per channel.** Meta: a scroll-stopping first 2 seconds; Google: the searcher's words; email: the story; LinkedIn: the business outcome with proof. Copy-pasting one line everywhere is a failure.
- **Asset list** is complete enough that a designer could start today: every row has format and ratio, the message, the claim, the destination, a producer and a due date. Count check: creative volume per paid leg matches the channel's need (e.g. Meta at ~$10k/month ≈ 8–15 net-new creatives a month).
- **Hand-offs**: one row per channel, no silent legs. The plan names **roles**, never playbooks (the marketer reads it): `static ads` · `video ads` · `photos` · `content` · `paid` · `email` · `organic social` · `creators` · `claims` · `human`. Behind each role (for the agent):
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
| "Run Meta and email." | Every channel that could work, kept or dropped with its deciding reason, a brand fact and what would change it. |
| "$5k budget: 60% Meta, 40% Google." | Lines incl. production, creators, offer cost and reserve; each paid leg checked against its learning minimum. |
| "Test different creatives." | Tests 1–3, one change each, money per version, when it can be read, an end date and what an unclear result means. |
| "Launch March 1." | Backwards calendar with lead times; late items flagged. |
| "Make 10 ads." | 10 rows: placement, size, angle, opening, exact claim or "needs proof", destination, who makes it, due. |
| Hits the goal. | Says which case hits the goal and hands over the case for changing it when it doesn't. |
| A form-like brief full of codes. | Reads like a good marketer wrote it: In short first, plain words, every fact sourced and dated. |

## Write-back (after the human's yes)

1. Re-check `ads_creative_read view: "approvals"` for plans waiting on this campaign; if any, ask before saving (saving discards them).
2. `campaign_upsert` with `campaign_id` (the draft saved at step 9, or the matching campaign): `brief_md` = the approved plan with the Status line set to "Approved <date> by <name>" and the version bumped; `status: "planned"` only when the campaign was `draft` (an `active` campaign stays `active`); `name`; `goal` (the closest allowed value — the real metric is in the brief); `budget_cents` = the total budget; `starts_on` / `ends_on`; `hero_product_ids`; `channels: ["paid_social"]` only when a paid-social leg is Run/Test; `intake` fields in the human's own words (about, audience, core_message, offer, situation, constraints, objective) — show drafted audience/core message to the human as part of the approval.
3. Concepts for paid static/video angles: `update_campaign_concept` for existing ones (it discards that concept's un-started plans — check first), `add_campaign_concept` for new ones; proof only from a claim that is both signed off and server-accepted for that product.
4. Re-save the readable file and the brand copy (`save-to-brain`, `versioned: supersede`) with the approved status, and give the marketer the link.
5. Business facts the human stated (margin, list size, capacity, founder hours) stay in the brief's Economics and Status sections — there is no brain field for them yet.

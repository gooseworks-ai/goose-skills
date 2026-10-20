# The campaign plan — fixed shape

Load at step 7; the Write-back section at the end is used after the marketer's yes. One text, three homes (versions continue from the campaign record's brief version — the first replan of an approved v2 is v3): the readable file (`gooseworks-reports/<brand-slug>/<YYYY-MM-DD>-campaign-plan.md`), the brand copy (`plans/<slug>/<YYYY-MM-DD>-plan-v<N>.md`) and the campaign record's `brief_md`. It follows the `write-report` skill (`../../write-report/SKILL.md`) §1 — title, In short (≤ 150 words), Decisions for you, the story, What to do (≤ 6 moves), What we're not doing, What we couldn't check, Sources with a source-skew line; body under 3,000 words, the long working tables in an appendix — while keeping the **section headings below exactly**, because the paid run, the weekly analysis, the ad makers and the email sends find their section by heading. The working sections sit as `###` under The story and the Appendix, Sources comes last, and the Status line sits under the title. Each section opens with its point in one plain sentence, then the detail. No internal ids, codes, file paths, tool or playbook names anywhere; rows are numbered 1, 2, 3.

```markdown
# <Brand> — campaign plan: <campaign name>, <D Mon YYYY>
Status: Draft for approval | Approved <date> by <name> · version N · written YYYY-MM-DD
<!-- mode: launch | goal push | always-on | replan | trigger replan · change-log slug: <campaign-slug> -->

## In short
(At most 150 words, in write-report §1's order; nothing stronger than the plan's own sections.)
**What this plan rests on:** <the research and numbers it uses, with dates (audience research 18 Oct, today's prices, your last 90 days of results), and the main gap — e.g. "no conversion history, so the forecast uses base rates">.
1. **The goal:** <number, business result, date>. The expected case gets <n> (<hits / misses by n>); the cautious case gets <n> (<how sure>).
2. **Who it's for:** <new people / people who already know you / both — how many>. **When:** <the buyer's moment, if it differs from your date>. **What this plan covers:** kept: <channels with budget each>; dropped: <the 2–3 that matter>.
3. **The money:** <proven / tests / reserve>. **First test:** <what we'll learn> — readable by <date>.
**So, do this first (because of <1 and 3>):** <the one move this week, who, by when>. It assumes nothing unconfirmed — no budget, customer proof, offer or asset the marketer hasn't confirmed; if it needs one, the move is "confirm X".

## Decisions for you
| Decision | My recommendation | Needed by |
(goal and forecast · channels · split · asset list · tier and headline message · anything else)

## The story
(The plan's reasoning, each section opening with its point in one sentence.)

### Audience and message
<Point sentence: who this is for and the one thing every piece says.> **Who:** new people, people who already know you (past customers, free or lapsed users, the list), or both — with how many we can reach (the number assumed if unknown). **Is this the buyer?** One line on whether the people these channels reach are the ones who buy. Primary group (from the customer research) · who it's not for · the headline message (you approve it).

### Goal chain
<Point sentence: whether the money gets there, in the business result (signups, paid accounts, orders, bookings).>
The goal: <number, metric, date> — agreed by <marketer>. Without the campaign: … · What the campaign must add: …
| Channel | Target | Where the number comes from | Readable by |
Cautious / expected / hopeful → <outcome each>. <If only the hopeful case hits the goal, say so here.>

### Economics
<Point sentence: what one new customer may cost and still make money.>
| Line | Value | Where it comes from |
Most a customer may cost: $X · aim: $Y · break-even: Z

### If the goal needs changing
none — the expected case meets the goal.   OR   the gap / what each lever buys / what I recommend

### Channel decisions
<Point sentence: where we run, where we don't.>
| Channel | Keep? | Why (the deciding reason, with a brand fact) | Evidence | How sure | What would change it |
Not relevant: <channel (reason)>, <channel (reason)>, …
Your hours this plan needs: ~N h/week (by channel).

### Budget split
<Point sentence.>
| Line | Before launch | Launch week | After | Total | % | Smallest amount that teaches us anything | Enough? |
Reserve: $X — released when <a test wins / a miss>.
Any leg aimed at a known list or retargeting: audience size, expected weekly frequency, and the cap that keeps it near ~5 a week (`budget-and-tests.md` §2b).

### Test plan
<Point sentence: what we'll learn first.>
| # | What we think | What changes | Versions | $ each | Readable when | Ends | Judged on | If it wins / loses / unclear |

### Angles per channel
| Channel | Angle | The customer words it rests on | Approved claim (exact words) or "needs proof" | Opening idea | Ad-rule risk |

### Offer
none / <the offer you named> / needs an offer designed (not covered yet). What it costs in margin: … Clashes: …

## What to do
At most 6 numbered moves, each with who does it, what it needs, and how we'll know it worked.

## What we're not doing, and why
One line each: the tempting moves the plan decided against (e.g. cold ads at a goal they can't reach, a channel that reaches peers instead of buyers, a discount nobody asked for).

## What we couldn't check
One line each, with why: assumptions to confirm, unknowns, risks.

## Appendix — working detail
(The plan reads without these; makers, the paid run and the weekly read use them.)

### Paid structure
One line per paid channel: what it optimises for, how it's set up, who it reaches, budget, how many ads, where the ads link (with link tags), and whether GooseWorks makes the change or you do from written steps.

### Calendar
<Point sentence: the date everything works back from, and the buyer's busy moments in the window.>
| Date | What | Who (role) |

### Asset list
<Point sentence: how many pieces, and the first due date.>
| # | Channel | Placement | Format, size, length | Angle | Message / opening | Claim (exact) or "needs proof" | Button → page it links to (plain, e.g. "pricing page") | Made by (role) | Due | Needs first |
(Link tags are not pasted into rows — one rule in the Measurement plan covers every link.)

### Measurement plan
<Point sentence: how we'll know it worked.> Per channel: what counts as a result, the real number it's judged on (store / CRM, not the platform's claim), any code, and the "how did you hear about us?" question. Link tags, one rule for every link (for whoever builds the ads; the piece number is the asset-list row): `utm_source=<platform>&utm_medium=<paid_social|cpc|email|organic|creator>&utm_campaign=<campaign-slug>&utm_content=<angle>-<row>`.

### Hand-offs
| Channel | Who takes it (role) | What they take | Done by you? |

### Replan triggers
| If this happens | Threshold | Then |

## Sources
Dated links for every outside fact (benchmarks, competitor ads, prices). One line on source skew (e.g. "benchmarks are mostly from DTC brands, not SaaS").
```

## Writing each section well

- **No research codes or internal labels** in anything the marketer reads: theme, quote, angle or test ids from the research files (T-06, V-112, A-07, T1) are translated into words ("the complaint that every fix costs a full re-render, from about 40 reviews of rival tools"). Tests and assets are numbered 1, 2, 3.
- **A refresh is a new plan, not a copy.** When a matching plan exists, every number is re-derived from today's facts (live prices first); In short carries one line "What changed since the last plan" (or "nothing material — the plan stands, prices re-checked").
- **Goal chain** rows say where every number came from (own history / marketer / base rate / assumption).
- **Angles** rest on the angle bank (research-competitors) and the customer's own words (research-market's voice-of-customer bank). Name the source line. Every claim used is one that is usable through the claims gate (the `claims-gate` skill (`../../claims-gate/SKILL.md`): the "Claims you may use" `must` facts named by the "Claims sign-off" marker and the dated Brand record, or a confirmed brain claim), quoted exactly, within its scope and before its review date. With no sign-off on file every claim and proof point is a candidate: the message is marked **needs proof (sign-off)** — never filled in. A product with no approved claim gets a calendar row "claims signed off" (owner: claims) by T-30.
- **Same angle, adapted per channel.** Meta: a scroll-stopping first 2 seconds; Google: the searcher's words; email: the story; LinkedIn: the business outcome with proof. Copy-pasting one line everywhere is a failure.
- **Asset list** is complete enough that a designer could start today: every row has format and ratio, the message, the claim, the destination, a producer and a due date. Count check: creative volume per paid leg matches the channel's need (e.g. Meta at ~$10k/month ≈ 8–15 net-new creatives a month).
- **Hand-offs**: one row per channel, no silent legs. The plan names **roles**, never playbooks (the marketer reads it): `static ads` · `video ads` · `photos` · `content` · `paid` · `email` · `organic social` · `creators` · `claims` · `human`. Behind each role (for the agent):
  - static ads → make-static-ads (from the asset list and campaign concepts)
  - video ads → the goose-video skill (a GooseWorks skill, offered as the next job, never started from here): the asset row carries the angle, the hook, the spec and the exact signed-off claims. Real creators filming → creators. Without GooseWorks (local mode) the same row goes to whoever makes the brand's video
  - photos → the goose-product-photos skill (made from the brand's real product photos, offered the same way): the row lists the shots needed (hero, angles, in use, lifestyle). Without GooseWorks, the row goes to the marketer's photographer; static ads use the brand's existing product photos
  - paid → run-paid-campaigns (launches from this campaign record)
  - email → email-lifecycle (this calendar drives its broadcasts)
  - content → make-content (articles and long-form)
  - claims → the claims gate's scoped sign-off, run inside the maker job that needs the lines (the marketer approves them there; when the Brand Brain is on, they confirm them in the GooseWorks app)
  - **human** → landing / product-page copy, sales or retailer enablement (one-pager, battlecard, demo script), PR and press lists, outreach, events — no maker covers them yet
  - **search ad copy, keyword lists, PDP / landing-page copy** → **human-executed** until a maker covers them: the asset row carries the angle, the searcher's words (voc-bank id) and the exact signed-off claims; run-paid-campaigns' Google launch card takes the copy from that row once the marketer confirms it, and may propose keywords from research-market's demand read (keywords are not claims)
  - organic posts → run-organic-social (drafts; the marketer posts)
  - creators → work-with-creators (research half; the marketer contacts and closes)
  - outreach, PR, events, retail, anything with no playbook → **human-executed**, measured as a row in analyze-performance's channel table
- **Policy risk** per angle: personal-attributes wording ("your acne", "your debt"), before/after, health or financial outcomes, special ad categories — flag it; make-static-ads runs the full policy check (for video made outside GooseWorks, the flag goes to the marketer).
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

## Write-back (after the marketer's yes)

1. Re-check `ads_creative_read view: "approvals"` for plans waiting on this campaign; if any, ask before saving (saving discards them).
2. `campaign_upsert` with `campaign_id` (the draft saved at step 9, or the matching campaign): `brief_md` = the approved plan with the Status line set to "Approved <date> by <name>" and the version bumped; `status: "planned"` only when the campaign was `draft` (an `active` campaign stays `active`); `name`; `goal` (the closest allowed value — the real metric is in the brief); `budget_cents` = the total budget; `starts_on` / `ends_on`; `hero_product_ids`; `channels: ["paid_social"]` only when a paid-social leg is Run/Test; `intake` fields in the marketer's own words (about, audience, core_message, offer, situation, constraints, objective) — show drafted audience/core message to the marketer as part of the approval.
3. Concepts for paid static/video angles: `update_campaign_concept` for existing ones (it discards that concept's un-started plans — check first), `add_campaign_concept` for new ones; proof only from a claim that is both signed off and server-accepted for that product.
4. Re-save the readable file and the brand copy (`save-to-brain`, `versioned: supersede`) with the approved status, and give the marketer the link.
5. Business facts the marketer stated (margin, list size, capacity, founder hours) stay in the brief's Economics section and Status line — there is no brain field for them yet.

**Local mode** (no GooseWorks, marketing-guide §5): steps 1–4 are replaced by the three below (no creative check, campaign record, concepts or server link); step 5 holds.
1. Save the approved plan as the next version, `plans/<slug>/<YYYY-MM-DD>-plan-v<N+1>.md`, with the Status line set to "Approved <date> by <name>" and the marketer's words for the yes, through save-to-brain's local branch. Earlier versions stay; the newest file with an Approved Status line is the plan run-paid-campaigns and analyze-performance read.
2. Re-save the run record with the approval (run-memory's local branch).
3. Tell the marketer in one line: "Approved and saved in this folder." Never "saved to your brand", and no link but the local file.
In a hosted chat with no files, give the approved plan in chat to paste back, and say it isn't saved anywhere.

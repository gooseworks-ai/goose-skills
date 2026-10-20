---
name: work-with-creators
description: >-
  Real creators and influencers, researched, priced and briefed. Use when the marketer says "find
  influencers", "which creators are worth paying, at what price?", "find real UGC creators to film for
  our ads", "who should we seed product to", "is this creator's engagement real", "what should I pay
  this creator" or "write a creator brief". Free research first; one credit yes only to vet deeper.
  Drafts only: contacts nobody, agrees nothing, moves no money. Not for AI-made UGC-style video —
  use goose-video; if unsure, ask: a real person filming, or AI-made?
version: 0.4.1
---

# work-with-creators

Creator research answers three things for the marketer: who is worth paying, at what price, and what they should make for *us*. The craft is in the references (`vetting.md`, `pricing-and-deals.md`, `creator-brief.md`); this file is the order of work. Research half only: it drafts; the marketer sends, negotiates, ships and pays.

**The rule that matters most: free pass first, report once** (`../marketing-guide/research-pattern.md` (in the `marketing-guide` skill) — read it before the first search). Before the first message, find real creators and read their public pages — web search, the host browser on TikTok, Instagram and YouTube, competitors' posts and partnership ads — and build a draft shortlist with public engagement numbers and a rough price range. The marketer's first message from you is that report plus the few decisions that change the answer. Paid reads only deepen the vetting, with one credit yes. Never ask a fact the free pass could find.

## What you get

1. **A readable report** (`creators/<YYYY-MM-DD>/report.md`, opened on request): "In short" (write-report §1) — timely openings (a creator already posting about the category this week, a rival's creator deal ending), the shortlist — each pick with public numbers read from real posts, dated and linked, and how sure (confirmed / likely / first look), a price range with the math, a deal call, and **For you** ("this creator's format fits your <product> because…; what they'd make; the approved claim behind it, or 'you'd need proof of X first'") — **You vs them** (rivals' creator programmes vs yours), wave 1 and how it will be judged, near-misses, Decisions for you (budget, names, claims, a deeper vet), and "what we could not read". Shape: [references/roster-format.md](references/roster-format.md).
2. **The roster** (`creators/roster.csv`, kept with the outcomes ledger) and **a brief and a first message per top pick** (`creators/<D>/briefs/<handle>.md`) — claims-safe, disclosure-ready, for the marketer to send: [references/creator-brief.md](references/creator-brief.md), [references/first-message.md](references/first-message.md), [references/wave-criteria.md](references/wave-criteria.md).

## Before you start

1. **Setup first:** do [the `marketing-guide` skill](../marketing-guide/SKILL.md) §1–2 (connect, brand, brain read) before anything else; the job line is "I find and check creators through it." (`get_started` with `wants: "more"`; when it asks which brand, ask in one line and call it again.) Then, for this playbook:
   - Brain path: the chapters the map points to for products, audience and rivals, plus 14 (rules — every `[creators …]` one), 22 and 23; `gooseworks:brain_search` for creators in talks, past deals and rates, the persona.
   - Fallback path: `gooseworks:brand_read` (summary, kit, products with prices, competitors, organic — the brand's and rivals' recent posts, where collabs show — accounts, learnings) and `gooseworks:knowledge_search` for the same.
2. **Read the roster and siblings — free.** `gooseworks:social_inspiration_library` / `gooseworks:social_inspiration_search`; `gooseworks:campaign_read` if a campaign has a creator leg; workspace: `creators/roster.csv`, the newest report and `lessons/*.md`, `research/audience/buyer-groups.md`, `research/competitors/` records. Run [the `outcomes-ledger` skill](../outcomes-ledger/SKILL.md) (`entity: creator`) for declines, never-agains and stale picks — its updates question waits for step 7. Then **since last time:** the Start steps of [the `run-memory` skill](../run-memory/SKILL.md) ([references/run-memory.md](references/run-memory.md), job `creator programme`, subject `wave-<n>` — the wave this run plans or reads): wave results by role and tier from the roster, last run's picks and price bands checked against what came back — 3–5 lines that open the report and steer this run. Claims: only the read step of [the `claims-gate` skill](../claims-gate/SKILL.md) now.
3. **Ask nothing before the report.** The only question allowed first: "UGC" or "content for ads" with no word on who films → "A real person filming, or AI-made?" (AI-made video goes to the goose-video skill: offer it as the next job; real people filming stay here). Everything else — goal, budget, platforms — is assumed from the brand and the ask, stated in the report, and corrected in step 7.

## Steps

1. **Frame.** From the brand, its product pages (host browser: price, what it is, who it's for) and the ask: the product, the likely goal (DTC: reach + content for ads; app: installs + UGC; B2B: pipeline), platforms, roles and what "gift" means ([references/creators-by-company-type.md](references/creators-by-company-type.md)). Each assumption is labelled. No budget → plan three wave sizes (pricing §7).

2. **Free pass — discovery.** [the `work-with-creators-creator-discovery` skill](../work-with-creators-creator-discovery/SKILL.md) with [references/discovery.md](references/discovery.md): the brand's and rivals' recent posts and collabs (free in the brain); rivals' partnership ads in the Meta Ad Library in the browser; web search ("<category> creator tiktok", "best <concern> creators", roundups, "#ad <rival>"); TikTok, Instagram and YouTube search and hashtag pages and public profiles in the host browser, read as a person would; creators already tagging or mentioning the brand (sentiment read); saved Inspiration outliers. **B2B: read X and LinkedIn in the host browser first** (posts, who comments, headlines) — that's where these buyers are; YouTube alone is not enough. If X or LinkedIn can't be read, say so and label the top pick "weak — not read where the buyer is". Long list → screen → 10–25 finalists.

3. **Free pass — public vetting.** [the `work-with-creators-creator-vetting` skill](../work-with-creators-creator-vetting/SKILL.md) with [references/vetting.md](references/vetting.md), from each finalist's public page: followers, views on the last 12 posts where the platform shows them (median, not mean), sponsored vs organic posts (#ad, partnership labels), cadence, a read of the visible comments on 2–3 posts, competitor deals, safety in captions and a name search, regulated-claim and minors checks. Every number dated and linked, labelled "public-page read". Where a page hides a number, say so — that is what the paid top-up deepens.

4. **Price and deal.** [the `work-with-creators-rate-and-deal` skill](../work-with-creators-rate-and-deal/SKILL.md) with [references/pricing-and-deals.md](references/pricing-and-deals.md): a rough floor / target from the public median × dated bands, rights priced separately, a walk-away from the goal (labelled "rough" until the marketer confirms budget and unit cost), gift / paid / affiliate / hybrid per pick with the reason.

5. **Synthesize.** The mix and wave 1 with its criteria ([references/wave-criteria.md](references/wave-criteria.md)); **For you** per pick — the format that fits our product and why, what they'd make (format, hook, which product), the signed-off claim behind it or "you'd need proof of X first", who makes it (the creator, briefed); **You vs them** — who rivals pay, in what formats, what we already have (our own creator posts and tags); don't follow the herd: if every rival uses the same kind of creator, weigh what buyers say over what rivals do. Then [the `work-with-creators-brief-writer` skill](../work-with-creators-brief-writer/SKILL.md): a brief and a first message for the top 3–5 picks now (claims lines awaiting sign-off marked so), the rest after names are approved.

6. **Write and deliver** through [the `write-report` skill](../write-report/SKILL.md), as `gooseworks-reports/<brand-slug>/<D>-creators.md`; the roster, near-misses and briefs under `creators/` (paths below). Then run-memory's End steps ([references/run-memory.md](references/run-memory.md)): the run record with the counts, wave 1 (or the renew / cut calls) as recommendations with their wave criteria as the test — no creator names or handles.

7. **One message: the draft and the decisions.** Three lines — the best pick and why, the first move, the link. Then only what changes the answer: the budget (it changes the mix; the report shows three sizes); gift unit cost if the plan gifts; names to strike; the claims lines the briefs need (claims-gate scoped sign-off); a **paid top-up** to vet deeper — say what it adds (full post history and views where pages hide them, comment reads at volume, transcripts for claims and safety, audience countries for the top picks, public business contacts for approved names), the estimate, and one yes to "up to N credits" ([the `spend-gate` skill](../spend-gate/SKILL.md) branch B, the probe inside it); roster updates since last time (asked once, never required); a repeat only if it would help this brand (step 9).

8. **On their answers.** Re-price on the real budget and unit cost, run the top-up inside its ceiling (log every charge), finish briefs and first messages for the approved names, re-deliver the report. Wave results come back through the outcomes ledger (and, once a wave's read window is over, the next run — same job `creator programme`, same `wave-<n>` subject — judges each recommendation by its id against its criterion); a rule the marketer states goes through [the `save-learning` skill](../save-learning/SKILL.md) as `[creators YYYY-MM-DD]`.

9. **Offer a repeat only when it helps** (marketing-guide §3, "Schedules"). Judge it: a monthly roster refresh helps when a creator programme is running or about to (waves going out, rates being quoted, a seeding list to keep filling) — say why ("your wave 1 posts this month; a monthly refresh re-vets the picks and adds new creators in your niche"). A one-off shortlist, a single brief or a one-time vet of one creator: no offer. When offered and accepted: created paused, per spend-gate §C, each run's report opening with what changed.

## Approval gates

- The free pass needs no yes. A paid top-up needs one yes to a ceiling; it stops there.
- **Boundary:** the marketer decides who represents the brand (names approved, all or strike any) and sends every message. Every price and deal is a recommendation — nothing is agreed, shipped, paid or messaged by this playbook.

## Output and write-back

| Artifact | Where (save mode) | Read by |
|---|---|---|
| Report | `creators/<D>/report.md` → `Creator report — <Brand> — <D>` (keep-history) | the marketer, the next run |
| Roster | `creators/roster.csv` (outcomes-ledger schema) | every later run, analyze-performance (roster seeding), plan-campaign (creator leg) |
| Roster summary | `creators/roster-summary.md` → `Creator roster — <Brand> — <D>` (supersede; no contact details) | later runs, plan-campaign |
| Briefs + first messages, wave 1, near-misses | `creators/<D>/briefs/<handle>.md`, `wave-1.md`, `near-misses.csv` | the marketer |
| Lessons | `creators/lessons/<D>.md` → `Creator lessons — <Brand> — <D>` (keep-history, via outcomes-ledger) | later runs |
| Run records | `runs/work-with-creators/creator-programme/wave-<n>/<D>.md` → `Run record — creator programme — wave-<n> — <Brand> — <D>` (keep-history, via run-memory; counts and links only, no creator names or handles) | the next run |
| Paid charges | `research/credits-log/<YYYY-MM>.md` (spend-gate) | every playbook's estimates |

Creator posts are not saved to the Inspiration library (no usage rights yet). See [server-needs.md](server-needs.md).

## Done when

"Since last time" opened the report (or "no earlier run"), and the run record was saved with counts and links only. The report arrived with no question asked before it beyond Before you start #3, passing write-report §3, naming real creators with dated, linked public numbers — never follower counts alone — a price range with the math per pick, For you per pick, You vs them, wave-1 criteria, briefs and first messages for the top picks, and what could not be read. Nobody was contacted.

## Out of scope

Sending messages, negotiation, contracts, gifting, codes, payouts — the marketer (backlog: the ops half) · measuring results across channels — **analyze-performance** · approving finished creator content — the marketer · AI-made UGC-style video — the goose-video skill · turning creator content into ads once rights are contracted — image ads with **make-static-ads**, launched by **run-paid-campaigns**; video ads from creator footage — the goose-video skill · UGC marketplaces, affiliate programmes, celebrity deals, podcast guesting, communities, events — not covered · legal advice.

---
name: work-with-creators
description: >-
  Real creators, researched and briefed. Use when the marketer says "which creators are worth paying, at what price, and what should they make?", "find influencers", "find real UGC creators to film for our ads", "who should we seed product to", "is this creator's engagement real", "what should I pay this creator", "write a creator brief". For any company type: finds creators already close to the brand and category, vets real engagement from median views and read comments (never follower counts), checks audience fit, brand safety and competitor deals, prices each pick as a range with the math (usage rights, walk-away), recommends gift, paid, affiliate or hybrid, and writes a claims-safe brief plus a first message for you to send. Sets how wave 1 will be judged. Contacts nobody, agrees nothing, moves no money. Not for AI-made UGC-style video — that's the video ad maker (make-video-ads); unsure which, ask: a real person filming, or AI-made? Podcast guesting is not covered.
---

# work-with-creators

One want: a vetted shortlist you would actually pay, at a price you can defend, with a brief and a first message ready per creator. This ships the **research half only** (D4): it drafts, the human sends. Gifting, shipping, codes, sending messages, negotiation, contracts, payment and approving finished content stay with the human until a sending/ops layer exists — say so plainly when asked. Speak to the marketer in plain words; never name playbooks, tools, ids or vendors.

## What you get

1. **The plan** — goal, budget (gift cost and shipping included), platforms, the roles the goal needs (reach, UGC-for-ads, ambassador/affiliate, B2B voice, newsletter, podcast), tier mix, total spend vs budget, and wave 1.
2. **The roster** — per creator: handle, platform, tier, role, *why them* with dated numbers linked to real posts (median views, engagement on the right basis, comment read, sponsored vs organic, cadence — or, for UGC-for-ads, hook craft and past brand-ad work), audience fit with a confidence level, safety and competitor conflicts, **price as floor / target with a walk-away and the math**, rights add-on, deal structure and why, vetted-on date. Shape: [references/roster-format.md](references/roster-format.md).
3. **Per pick: a one-page brief and a first message** for the human to send (gift and paid versions where both fit) — claims-safe, disclosure-ready: [references/creator-brief.md](references/creator-brief.md), [references/first-message.md](references/first-message.md).
4. **Wave-1 success criteria** — per role, what counts as a win, the window it's judged in, and the renew / cut rule, so results reweight the roster: [references/wave-criteria.md](references/wave-criteria.md).
5. **Near-misses** with the reason and the number behind each.

## Before you start

1. **Connection and brand.** First GooseWorks call of the conversation: `gooseworks:get_started` with the marketer's words (`wants: "more"`); it settles setup and the brand only — when it asks which brand, ask in one line and call it again. A needed tool not listed → one `gooseworks:tools_load` (`brand`, `social`, `campaigns`, `files`, `media`, `data`, `automation`). Still no GooseWorks tools → say only: "Connect GooseWorks first — I find and check creators through it." Send `client` on every call that takes it.
2. **Ask which kind, if the words don't say.** "UGC" or "creator content for ads" without saying who films → one question: "A real person filming, or AI-made?" AI-made is the video ad maker's job, not this.
3. **Workspace.** Brand coworker scope (`coworker_agent_id` from the `brand_read` list) for every file, under `creators/`. No coworker → the default workspace with paths prefixed `brands/<brand-slug>/`, and tell the human teammates won't see the roster. `gooseworks:account_whoami` once for the balance.
4. **Brain read.** `gooseworks:brand_read` with summary, kit, products (full records for giftable items), competitors, organic (the brand's and competitors' recent posts — free collab and mention evidence), accounts, learnings. `gooseworks:knowledge_search` for: creators or partners in talks or under contract, the persona, past creator deals and quoted rates, the newest `Creator roster — <Brand>` and `Creator lessons — <Brand>` documents (`file_read` `creators/roster-summary.md` and the newest `creators/lessons/*.md` first). `gooseworks:campaign_read` if a campaign calls for a creator leg. `gooseworks:social_inspiration_library` / `gooseworks:social_inspiration_search` for saved outliers. Who approves spend and unit cost are usually not on file — ask.
5. **Ledger.** Run [`../../atoms/outcomes-ledger/ATOM.md`](../../atoms/outcomes-ledger/ATOM.md) with `entity: creator` on `creators/roster.csv`: stale picks flagged, updates asked once (never required) — including wave results against the criteria — declines and never-agains excluded.
6. **Claims.** Every claim-like line in a brief or message goes through [`../../atoms/claims-gate/ATOM.md`](../../atoms/claims-gate/ATOM.md) (it reads the sign-off; with none, it puts the few lines this job needs to the human). Kit value props and search snippets are never claims. Always apply every `dont` and `must`.
7. **Ask only the gaps**, once, tailored to the company type ([references/creators-by-company-type.md](references/creators-by-company-type.md)): the goal; the budget and whether it covers gifts and shipping; platforms; creators in talks; geography and go-live date. DTC/CPG: gift unit cost. Apps: target cost per install or trial. B2B: contract value and target cost per demo. Sales goals that buy usage: target CAC, current CPA, planned media. Never guess any of them.

## Steps

**1. Frame the plan.** Goal sets the roles and what vetting weighs; budget sets tier mix and wave size; company type sets platforms and what "gift" means. No budget → priced test waves to pick from (pricing §7). Ask to spend per [`../../atoms/spend-gate/ATOM.md`](../../atoms/spend-gate/ATOM.md) (proxy branch); the credits log is the only basis for an estimate. **With history** for every kind of read discovery needs: a yes to "up to N credits", labelled an estimate, from logged charges and the counts in [references/data-sources.md](references/data-sources.md). **Without**: one yes for a single probe read ("one quick read; GooseWorks tells us its cost after it runs"); the "up to N" ask follows in the next message, estimated from the probe's per-call charge; pricier reads (profiles, audience countries, creator emails) count their first call as their own probe inside that ceiling. → **Gate 1**.

**2. Discover.** Run [atoms/creator-discovery](atoms/creator-discovery/ATOM.md) with [references/discovery.md](references/discovery.md): free sources first, then positive existing fans, creators proven in the category, problem-phrase search, commenters under category leaders, lookalikes → quick screen → finalists. Stops at the ceiling.

**3. Ask to spend on vetting.** The finalists, which get full vs light vetting, the lookups that takes and what discovery charged; a yes to "up to N credits". → **Gate 2**.

**4. Vet.** Run [atoms/creator-vetting](atoms/creator-vetting/ATOM.md) with [references/vetting.md](references/vetting.md): by role (reach/affiliate: engagement, comments, cadence, audience fit; UGC-for-ads: hooks, past brand-ad work, portfolio, delivery "not watched" with links for the human; B2B branch), plus safety, conflicts, regulated and minors checks. No numbers, no verdict.

**5. Price and deal.** Run [atoms/rate-and-deal](atoms/rate-and-deal/ATOM.md) with [references/pricing-and-deals.md](references/pricing-and-deals.md): floor / target from the role's basis, rights priced separately, walk-away from the goal and the brand's numbers, deal structure with the reason. Fees are the human's deal money — never credits.

**6. Build the mix and wave 1.** Portfolio check (tiers, roles, spend vs budget, expected pieces, seeding post rate ~20–40%), then wave 1 and its success criteria per role from [references/wave-criteria.md](references/wave-criteria.md): win metric, read window, renew / cut rule, and the `[LINK]` / `[CODE]` placeholders the human fills.

**7. Briefs and first messages.** Run [atoms/brief-writer](atoms/brief-writer/ATOM.md) for every shortlisted pick (the human approves names at step 8, before any message is sent): one brief per pick (seeding, standard or UGC-for-ads variant) and a first message per pick (gift and paid versions where both fit), every claim-like line through the claims gate. Disclosure lines from `../../atoms/ad-policy-check/disclosure.md`.

**8. Hand over.** Write the files (below); present the plan, wave 1, the shortlist, and one brief and message in full (the rest linked). The human approves the names — all, or strike any — and sends every message themselves. After their yes, offer to find the public business contact route for the approved names only, within the remaining ceiling or a small new one.

**9. Re-vet and refresh.** `revet_by` (vetted-on + 30 days) on every pick and in the summary. Offer once: a monthly roster refresh or a re-vet before contact. Only with a yes, create it with `gooseworks:automation_upsert` per the spend-gate automation rule: `enabled: false` (paused) until the human switches it on; the yes names a standing per-run data ceiling and hears that the run itself uses credits (shown after the first run via `gooseworks:automation_list`); no data spend in a scheduled run without one. The `agent_prompt` carries the roster path, the plan and wave criteria paths, the exclusion rule, the ceiling, and "contact nobody". Needs a brand coworker; without one, offer only the free re-vet reminder in the summary.

## Approval gates

1. **Plan + discovery spend** — no paid lookup before a yes.
2. **Vetting spend** — finalists, full vs light, a yes to the ceiling.

Spend stops at each ceiling and asks. **The boundary at handover (D4):** the human decides **who represents the brand** (names approved, all or strike any) and sends every message; **every rate and deal** is a recommendation — nothing is agreed, shipped, paid or messaged by this playbook.

## Output and write-back

Files (brand coworker scope, `creators/`), read before write:
- `roster.csv` — the living roster, kept with `../../atoms/outcomes-ledger/ATOM.md` (its required columns first, then the creator columns — see roster-format).
- `<YYYY-MM-DD>/summary.md` (opens "Do this first, because…"), `wave-1.md` (criteria per role), `near-misses.csv`, `briefs/<handle>.md` (brief + first message drafts).
- Paid lookups logged per the spend-gate in `research/credits-log/<YYYY-MM>.md`.
- Hosted chat: `gooseworks:file_url` download links (they expire within the hour — offer fresh ones); with a shell, also local copies.

Brand documents through [`../../atoms/save-to-brain/ATOM.md`](../../atoms/save-to-brain/ATOM.md):
- `creators/roster-summary.md` → `Creator roster — <Brand> — <YYYY-MM-DD>` (`versioned: supersede`; tags `[work-with-creators, roster]`): opens "Do this first, because…", then the plan, wave-1 criteria, each pick's handle, role, verdict numbers, price range and deal; near-miss reasons. No contact routes or personal details.
- `creators/lessons/<YYYY-MM-DD>.md` → `Creator lessons — <Brand> — <YYYY-MM-DD>` (written by the outcomes-ledger, `keep-history`): wave results vs criteria, quoted rates vs range — numbers only.
- Learnings only through [`../../atoms/save-learning/ATOM.md`](../../atoms/save-learning/ATOM.md), in the human's own words, text starting `[creators YYYY-MM-DD]`.

Creator posts are not saved to the Inspiration library (it feeds ad making, and no usage rights exist yet). See [server-needs.md](server-needs.md).

## Done when

"A vetted shortlist you would actually pay — real engagement checked, price benchmarked, a brief and first message ready per creator, and wave 1's yardstick set." Check: the operator would pay at least half the shortlist inside the stated range; every pick's evidence links to real posts with dated numbers (spot-check two); no pick rests on follower count; one brief and message pass someone who has briefed creators; wave 1 has a win metric, window and renew/cut rule per role; nobody was contacted.

## Out of scope

- Sending messages, negotiation, contracts — backlog paid-deal outreach (D4). The human sends the drafted messages.
- Gifting, shipping, issuing codes and links, tracking redemptions, payouts — backlog gifting half. Measuring results across channels — **analyze-performance** (creators are a future row there today); wave results come back through the roster here.
- Approving a creator's finished content — the human's call today.
- AI-made UGC-style video — **make-video-ads**. Turning real creator content into ads once rights are contracted — **make-static-ads / make-video-ads**; running it as paid — **run-paid-campaigns**.
- UGC marketplaces, affiliate-programme setup, celebrity deals, podcast guesting and PR, communities, events — not covered.
- Legal advice — the playbook states disclosure and claims requirements; contracts and legal sign-off are the human's.

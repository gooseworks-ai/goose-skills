# Test by hand: where-to-start

## Setup
1. Connect GooseWorks **staging** to your agent.
2. Link every marketing skill side by side (the playbook needs its steps and the shared steps): see "How to test a playbook" in `marketing-agent/README.md`.
3. Open a fresh session for each case.

## Cases

Run at least the first five. Each uses a brand the reviewer knows first-hand where possible.

| # | Case | Say | Must happen | Fails if |
|---|---|---|---|---|
| 1 | Early brand, thin brain (ideally pre-launch or just launched) | "Help me with marketing." | Opens with what it knows; asks ≤ 5 plain questions (only gaps); names one constraint with evidence; recommends 1–2 moves (in plain words) in the output shape; offers a hand-off and stops. | Re-asks a known fact; recommends 3+; runs a playbook; reads more than three of the brand's own pages, or any competitor, ad-library or paid data; names a playbook or tool to the founder. |
| 2 | Stalled DTC brand with ads running (staging's Personal Day; the reviewer plays the founder: about $40k/month revenue, $8k/month on Meta, Klaviyo used only for an occasional newsletter, two people, unsure tracking is right) | "Help me with marketing. Sales have been flat for two months." | Asks what changed when it flattened; names one constraint with evidence; uses the calendar (Black Friday is six weeks out on 16 Oct 2026); doesn't jump to new ads or more spend; OK-ing a few claim lines under "Bring" for any pick that writes copy (no Claims sign-off exists). | New ads or more spend as the first move; ignores the calendar; names a tool or platform the founder didn't (e.g. a store platform). |
| 3 | Fix-the-basics: a founder with no paying customers yet, or no tracking at all, who wants to run ads | "I want to start running ads, where do I start?" | Says plainly that ads are not the first move and why; the first move may be a human step (talk to customers, set up tracking) with at most one playbook alongside. | Recommends make-static-ads / run-paid-campaigns as the first move. |
| 4 | Off-map type: a snack brand selling mostly through 120 grocery stores, wanting more sell-through | "How do we sell more in stores?" | Names retail and trade marketing as off the map, gives the human first step (e.g. in-store demos, retailer promotions), and at most one playbook that helps; does not dress up an ad or outbound playbook as the answer. | Routes to the nearest playbook as if it covered retail. |
| 5 | Rich brain: a brand with signed-off claims on file and an earlier where-to-start visit | "What should I focus on this month?" | Asks 0–2 questions; reads back what it knows; treats it as a return visit (asks how the last recommendation went). | Asks the five questions from scratch. |
| 6 | Direct ask | "Make me ten ads for our new serum." | Hands straight to make-static-ads without the situation questions. | Runs the where-to-start interview. |
| 7 | B2B SaaS, five design partners, $0, founder sells, wants "LinkedIn and ads" | "We just launched, how do we get customers?" | Asks whether the partners use it weekly and would pay; constraint follows from that answer; picks are free or within credits the founder accepts; "not yet" covers ads with a reason; positioning-from-scratch gap named if relevant. | DTC logic (ads, photos) applied to B2B; a paid pick for a $0 founder without saying it costs credits. |
| 8 | Multi-brand organization, brand not named (staging org has 8 brands) | "Help me with marketing." | Asks which brand, by name, before any research; never defaults to one or silently picks the latest. | Diagnoses the wrong brand. |
| 9 | Return visit, didn't act (run case 2 first, then a month later) | "I didn't do any of it, too busy." | Opens from the saved block; doesn't re-ask why (they said); cuts the same move to the smallest slice before the next date. | Restarts the five questions; recommends something new just to be different. |
| 10 | Pre-launch app with an audience and no brand set up (habit tracker, TestFlight only, launch in three weeks, $2k, solo founder, 4k followers) | "Where do I start?" | Uses the existing audience before anything cold; respects the launch date; no paid installs before retention is known; says plainly the answers can't be saved until the brand is set up, and saves them if that happens in the same conversation. | Weeks of research while ignoring the 4k followers. |
| 11 | Earlier work saved on the brand by another session (e.g. a campaign plan with Meta ads and "claims not signed off"), founder with 1,000+ free sign-ups who mostly never come back, goal 20 paying by end of November, ~$1k/month, a few hours a week | "Help me with marketing." | Mentions the saved plan in one line with its date and asks whether it still stands; still asks where it's stuck, what they can put in, and the goal; names activation as the constraint; ads under "not yet"; a "worked if" with an outcome number and a date; says "saved" only after the save returns. | Builds on the saved plan unasked; names claims sign-off or account setup as the constraint; asks no situation questions; "worked if" is task completion; claims a save that didn't happen. |
| 12 | Agent-written brain (setup flags, a saved strategy, "claims not signed off"), one founding engineer, sign-ups who stall after trying it once; the founder says "people who left over price aren't our audience" but names solo founders as the best customers | "Where do we start with marketing?" | Treats the saved strategy and flags as proposals and checks them; ≤ 5 asks counting every sub-ask, including "any notes from user or cancel calls? paste them"; names activation, not acquisition, as the constraint; asks who the churners were before saving anything; product-scope calls shown as the founders' decision; moves sequenced to one person's hours; nothing saved before the founder agrees | Calls a setup step the constraint; asks 5 numbered questions holding 10+ asks; recommends social + cold email + creators at once; saves the buyer or strategy before a yes |

Also run at least one held-out case the reviewer invents on the day, unlike any example in `references/output-shape.md`, to check the answer comes from reasoning rather than the nearest example.

Round-2 additions to every case: the opening reads back what a short look at up to three of the brand's own pages showed (or says the host can't fetch pages); the recommendation names moves in plain words, never playbook or tool names; fails if it asks something the homepage answers.

## Scoring (the reviewer's rubric)

Pass a case only if every MUST is yes:
1. **Constraint (MUST):** names one binding constraint that matches the reviewer's own reading; the picks serve it.
2. **Stage (MUST):** the first move fits the stage; no buying attention before fit; no new traffic into a known leak.
3. **Specific (MUST):** cites at least two facts the founder gave; could not be pasted onto another company.
4. **Feasible (MUST):** every pick's inputs can be supplied this week within the stated budget and hours.
5. **Focused (MUST):** at most two playbooks, clear order, every idea the founder raised that wasn't picked appears under "not yet" with a reason.
6. **Measurable (MUST):** a "worked if" with a number and a timeframe.
7. **Honest (MUST):** no invented facts, no research done, nothing run, off-map human steps named as such, assumptions stated.
8. **Efficient (MUST):** ≤ 5 questions, ≤ 1 follow-up round, nothing known re-asked, answer at most 250 words.
9. **Leverage (nice):** uses an existing advantage (list, audience, network) and respects the next big date.
10. **Regret test (MUST):** would a senior advisor be embarrassed if the founder spent the next three weeks exactly here? If yes, fail.

Also check after each run: `brand/situation.md` (brand coworker scope) holds a new "Latest" entry, the previous one under History, and is findable as the brand document `Situation — <Brand> — <date>`, with the founder's words separate from the agent's read; the brand's onboarding profile holds only values the founder stated.

## Staging run log
See the bottom of this file (filled in by the builder session).

---

## Staging run log — 2026-10-16 (builder session, GooseWorks staging)

Case 2 setup (Personal Day), steps 1–2 for real (all free reads); stopped before step 6's write (it would change the staging brand's onboarding profile and its situation file, which other sessions use).

**Step 1 reads:**
- `brand_read` sections summary, kit, products, onboarding, learnings, accounts (lean) → ~10 KB. Gives: sells acne-safe skincare (own site personalday.com), `brandType: beauty`, audience (women 20s–30s with acne-prone skin), 20 products with 3 tagged bestseller, voice, value props, tagline. Onboarding profile empty: role, ad spend, goals, platforms all missing. Accounts: none. Learnings: 1. `existingAds` is not in the lean kit (it appears with `detail: full`); own-ad presence also shows in summary as `ad_library_ad_count: 11` in the brand list.
- `account_whoami` → `user_context` null (first visit). (Round 2: the situation now lives in `brand/situation.md`; this read is no longer made.)
- `campaign_read` (list) → no campaigns.
- Claims check (regulated category): `knowledge_search ["claim"]` → 7 research-created "approved" claims and no "Claims sign-off" rule in learnings → OK-ing a few claim lines goes under "Bring" for any pick that writes copy.

**What the brain answered of the five questions:** Q1 fully (what, to whom, where: its own site). Q2 partly (ads running: 11 in the ad library; no revenue, no customer counts). Q3 not really (lean `messagingAngles` is empty; the ads/offers search returned nothing). Q4 and Q5 not at all. So the opening message reads back Q1, and asks Q2–Q5 (four questions).

**Would have run (writes, not executed):** `brand_update` `patch.onboarding` {role, ad_spend band, goals, platforms} as `user_correction` with the founder's words; the situation file `brand/situation.md` (brand coworker scope) through the `save-to-brain` skill (`../../save-to-brain/SKILL.md`) (round 2; earlier rounds used `user_context`, which is now dropped).

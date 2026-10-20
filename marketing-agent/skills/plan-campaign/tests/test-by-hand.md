# plan-campaign — test by hand

## Setup
Connect GooseWorks **staging**. Link the playbook into your agent's skills folder. Pick a brand you know first-hand whose market and competitor research is done and whose claims are approved (this playbook only reads that work).

## Test 1 — Akhil's ask (GooseWorks, 18 Oct)
Say only: "I want to plan a campaign." When asked, answer as Akhil did: GooseWorks; Thanksgiving; start 1 Nov, end Thanksgiving; at least 20 paying accounts; $1,000 total; you don't know funnel numbers; GooseWorks makes the ads; you'd post on LinkedIn, X and Meta; more than 1,000 free users, most did a trial and never came back.

Pass if:
1. **Looks first.** Before the first question it has read the brand, products and prices, onboarding, what's connected (Meta, social accounts), existing campaigns, research files and the site's pricing page — and says what it found in two or three lines.
2. **Asks like a person.** One short message, at most ~4 questions, no form: product/plan and offer first, **then who it's for — new people or people who already know you, and how many** — then goal + dates + budget in one sentence, then at most one more plan-changing gap (a plain "can you see what brought an upgrade?" is allowed). No funnel-rate, churn, margin, pixel/link-tag or "who makes the ads" questions.
3. **Says what the plan covers** up front: every channel that could work (ads, email, organic, creators), kept only if it fits, "say if you want ads only".
4. The plan passes write-report §3 (its In short in §1's shape), says which channels it covers and why, where we run and where we don't, and reads like a good marketer wrote it; every outside fact has a dated source.
5. Delivered so it opens: a clickable local file, a copy saved to the brand with a link, and — because an approved Thanksgiving plan already exists — the live brief is not overwritten before the yes.
6. The plan names the buyer's busy moment in the window (for a tool sold to ecommerce marketers, their November sales crunch) where it differs from the seller's date; any retargeting leg states audience size and weekly frequency and is capped near ~5/week; founder outreach is weighed for win-back; every leg says how it moves paying accounts.
7. Spends nothing, makes no ads, fills no concept proof with unsigned text. Asked for an ad quote, it says making the ads is the next step (starting with a claims check) and stops.
8. Say "start from scratch" after giving a total user count, then a daily number that can't fit it ("100 sign-ups a day" against "over 1,000 users"). Pass: one line "Starting fresh: I won't use earlier plans or notes.", no earlier plan or record used, and the clash between your two numbers flagged before it plans on either.

Telltale failures: a seven-part question form; asking what it could have looked up; a technical question; going into email without having said the plan covers it; a plan full of codes; a report left only on the server.

## Test 1b — launch with a withheld number
Say: "We're launching the new flavour on March 1st with $5,000 — what should we run, and where?" Hold back the goal number. Pass if it offers 2–3 concrete goal options from the brand's numbers instead of inventing one, shows the case for changing the goal when it needs a miracle, and stops for approval.

## Test 2 — zero-paid is allowed
"We have $600 and a new candle drop in three weeks." Pass if the paid rows are Later/No with the numbers (e.g. cannot exit learning) and the plan is organic + email + creators, with run-paid-campaigns told there is nothing to run.

## Test 3 — B2B SaaS cycle vs date
"We're a new B2B SaaS, $8k for Q1, we need 20 new customers by March." Pass if it asks for ACV and the sales cycle, and — with a 60-day cycle — reframes the goal to pipeline and qualified meetings, and scores LinkedIn against ACV.

## Test 4 — replan
After a month of weekly reads exist: "Replan next month." Pass if it reads the reads, the change log and the learnings, scores the ended tests on store-joined numbers, stages each reallocation with from → to, $, evidence and what would reverse it, and versions the same campaign record.

## Test 4b — monthly replan with run memory
With a plan record (its bets), four weekly performance records, a monthly record and run-paid records holding one raise that worked, one that was too early and one leg that never ran: "Replan next month." Pass if it scores every bet from a source (the never-run leg is neither credited nor blamed; the paid verdict is labelled claimed unless the store check confirms it), moves money only with from → to, amount, the verdict and what would reverse it, keeps the too-early leg's money with its read date, saves a new plan record with next month's bets, and proposes the target and tests to the brain only after the marketer approves.

## Test 4c — no GooseWorks: approve and save locally
Disconnect GooseWorks. Ask for a plan for one product with a budget and a date, then approve it, then accept a monthly replan.
Pass if: it says once that it keeps notes in this folder; no `gooseworks:` tool is called from setup to write-back; the plan opens from a local link and the chat says "saved in this folder", never "saved to your brand"; after the yes, `gooseworks-local/<brand-slug>/plans/<slug>/` holds a new version whose Status line reads "Approved <date> by <name>", and the run record is re-saved; the replan is created with the host's scheduler (off until you say so), or it says scheduling isn't available here.
Fail if: any campaign record, concept, server link or automation call; any "saved to your brand".

## Staging run — 2026-10-16 (brand: Personal Day, DTC acne-safe skincare)

Ask simulated: "We're launching a new serum on March 1st with $8,000 — what should we run, and where?" (goal number withheld).

| Step | Call | What came back | Playbook consequence |
|---|---|---|---|
| Start | `get_started` wants campaign, `client.cards:false` | setup done; "go on with their request"; generic campaign next_step (save brief, propose concepts, generation) | Playbook keeps its own steps; it authors concepts itself (the propose tool's own description says to). |
| Brain | `brand_read` summary, products, learnings, onboarding, competitors, kit | 20 products (3 tagged bestseller), brandType beauty, voice + 6 proof points; **1 learning** (video-script style); onboarding profile empty (no ad spend, platforms, goals) | Goal, budget split inputs, margin, stock, list size, past channel results all missing → one ask message. |
| Claims | `knowledge_search` source_types claim | 7 approved claims, **all applicability `unknown`** (press quotes, free returns, free shipping $45+, 4.9★/234 reviews) | Angles can quote them in the brief, but concepts can't use them as proof (see write test). |
| VoC | `knowledge_search` evidence + learning | Only press quotes and the review-count metric — **no customer words** | Step "check the research is done" fires: recommend research-market first; angles labelled starting point. |
| Competitors | `competitor_read` | 5 tracked (Paula's Choice, The Ordinary, CLEARSTEM, CeraVe, Prequel) with positioning, proof points, content themes, audience segments; roster already carries full profiles | Angle bank available without opening dossiers by slug. |
| Campaigns | `campaign_read` | none | New campaign on approval. |
| Pending plans | `ads_creative_read` view approvals | none pending | Safe to save. |
| Write test (free, archived after) | `campaign_upsert` create, `channels: []`, status draft, fixed-heading brief | accepted; brief stored verbatim | Write-back shape works. |
| Write test | `add_campaign_concept` with an `unknown`-applicability approved claim as proof | **refused** `concept_proof_mismatch` | Playbook fixed: such claims → proof empty, "needs proof (scope unconfirmed)". |
| Write test | same concept, proof empty | accepted, no templates picked | — |
| Cleanup | `campaign_archive` | archived | — |

Stopped before: nothing paid exists in this playbook. Generation (`request_campaign_generation`) is deliberately out of scope.

## Re-run — 18 Oct 2026, Sonnet, Akhil's exact ask (GooseWorks, staging, 0 credits)

- **Before the first question (17 calls):** get_started, brand list + full read, campaign_read (found the approved Thanksgiving v2), meta_read pages (not connected), social_account_list (none), approvals view (none), knowledge_search ×3 (no claims, evidence or learnings), workspace file_list/file_read (market read, customer-words bank), competitor_read, WebFetch gooseworks.ai + /pricing (live plans Lite $29 / Starter $59 / Pro $149, no offer), WebSearch ×3 benchmarks.
- **First message:** what it found, then: paid plans + offer? · goal, dates, budget? · "I'll look at every channel that could work — ads, email to people who've signed up, LinkedIn and X posts, creators — say if you want ads only" · how many past users could you email (default stated) · research first or plan now. One message, no form, no technical question. (Found paragraph ran ~7 lines — guidance tightened to 2–3.)
- **Plan:** `gooseworks-reports/gooseworks/2026-10-18-campaign-plan.md` + brand copy `plans/thanksgiving-win-back/2026-10-18-plan-v3.md` (document imported, searchable). Opened with In short / Do this first (the shape before 20 Oct; write-report §1 now puts what we looked at and the findings first); expected case ~15 of 20 with the case for changing the goal; email to 1,000+ lapsed users as the core leg, Meta retargeting + a capped Meta test, organic LinkedIn/X; LinkedIn ads, X ads, creators, Google dropped with reasons; 23-row asset list; every outside number dated and sourced.
- **Campaign record not written:** the approved v2 is live; the draft stayed in the file and brand copy, as the playbook says.
- **Grade vs write-report §3:** pass on top lines, plain story, no ids/tool names, local link; fixed afterwards: link-tag strings in asset rows, a jargon heading, one-hour brand link noted.
- Results file: `/Users/akhil/projects/marketing-agent-test/results/2026-10-18-plan-campaign-sonnet-rerun.md`.

## Test 8 — a matching plan already exists (refresh, not copy)
On a brand that already has an approved plan for the same occasion, ask for "a new Thanksgiving campaign". Pass if it says in one line that a plan exists and it will refresh it; fetches the live pricing page; re-derives the money math from today's prices (no stale price copied from the old plan); writes the plan in the current shape (In short first, no research codes, no "mode:" line); has one "What changed since the last plan" line; and closes with the three-line chat message only.

# plan-campaign — test by hand

## Setup
Connect GooseWorks **staging**. Link the playbook into your agent's skills folder. Pick a brand you know first-hand whose market and competitor research is done and whose claims are approved (this playbook only reads that work).

## Test 1 — launch with a withheld number (the spec's test)
Say: "We're launching the new flavour on March 1st with $5,000 — what should we run, and where?" Hold back the goal number.

Pass if:
1. It reads the brand, claims, research and existing campaigns before asking anything, then asks **one** message for only what is missing — including the goal number — and does not plan until you give it.
2. It flags early that the goal looks out of reach, and when you give a goal that needs a miracle (e.g. 1,000 new customers on $5k at a $30 historical CAC), it shows the renegotiation case first (gap, what each lever buys, a recommendation) and lets you choose.
3. The brief opens with a one-page decision (do this first, because…). Every mandatory channel (Meta, Google Search, Shopping/PMax, LinkedIn, TikTok, CTV, retail media, AI-assistant ads, organic social, email/SMS, content/SEO, creators) is decided: plausible ones as rows with verdict, binding reason citing a brand fact and a flip condition; clearly irrelevant ones in one "Not relevant:" line, each with its reason. No playbook or tool names anywhere you read.
4. The split includes production, creators, offer cost and a reserve; each paid leg says whether it clears its learning minimum.
5. Each test has one variable, $/cell, a readable threshold, an end date and a rule for Unclear.
6. The asset list is complete: you would hand it to a designer and they could start today.
7. It stops for approval and spends nothing. A new campaign may be saved as a draft for you to read; an approved live campaign's brief is not changed until your yes (the draft goes to the workspace).

Telltale failures: a channel without a why; the withheld goal invented; Meta assumed; platform ROAS as the target; a calendar built forwards with assets due after their slot.

## Test 2 — zero-paid is allowed
"We have $600 and a new candle drop in three weeks." Pass if the paid rows are Later/No with the numbers (e.g. cannot exit learning) and the plan is organic + email + creators, with run-paid-campaigns told there is nothing to run.

## Test 3 — B2B SaaS cycle vs date
"We're a new B2B SaaS, $8k for Q1, we need 20 new customers by March." Pass if it asks for ACV and the sales cycle, and — with a 60-day cycle — reframes the goal to pipeline and qualified meetings, and scores LinkedIn against ACV.

## Test 4 — replan
After a month of weekly reads exist: "Replan next month." Pass if it reads the reads, the change log and the learnings, scores the ended tests on store-joined numbers, stages each reallocation with from → to, $, evidence and what would reverse it, and versions the same campaign record.

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

# Test by hand — research-market

## The test (from the spec, sharpened after critique)

Pick a brand the reviewer knows first-hand, with real customers and public reviews (and, for the second pass, one with almost none). Ask: **"Who actually buys this, and what do they say in their own words?"**

You should see, in order:
1. It reads the brand first and asks only what the brand record does not answer — always including the founder's own belief about the buyer and whether private evidence (tickets, surveys, returns, sales notes) can be shared.
2. A source plan with reachability marks and, before anything paid, a credit total to say yes to (or, when no price is on record, one yes for a single probe call). Nothing paid runs before the yes.
3. The read: one screen first, with method note (n read, sources, star mix, gaps), at least one finding that surprises the founder, 2–4 segments plus an anti-persona, typed competitors and alternatives, a labelled demand read.
4. The four recognition questions (incl. which competitors to track), asked without leading.
5. Saved artifacts named with their paths and document titles; the audience summary waiting as a proposal; competitors tracked only if the founder confirmed them by name.

Pass:
- The reviewer says "yes", or "partly" with the fixes applied, and names something they did not know.
- Open 10 random public quote links (where a browser exists): every one opens and contains the quote verbatim; in a host without one, the method note says "links not re-opened".
- Pick 3 persona traits: each cites quote ids that support it.
- Every demand line is labelled measured / proxy / prior / unknown.
- `knowledge_search` for a kept quote returns the bank document.
- Credits charged ≤ the approved total; the endpoint log is in `research/credits-log/<YYYY-MM>.md`, not in the read.

Fail: an untraceable or paraphrased quote, an evidence-free persona trait, invented seasonality, a competitor tracked without the founder's yes, anything paid before the yes, a customer contacted.

Cold-start pass (second brand, few reviews): the read's first line says the evidence floor was not met, nothing is padded, and the survey + switch-interview kit is handed over.

## Staging run — 2026-10-16 (GooseWorks staging, brand "Personal Day", acne-safe skincare)

Ran every free step up to the first paid call. Nothing paid was called.

| Step | Call | What came back |
|---|---|---|
| Connection | `brand_read` (list) | 8 brands; Personal Day `0e5b2fb0…`, coworker `9d554b73…` |
| Brain read | `brand_read` sections summary, competitors, learnings, onboarding, accounts, sources | 1 learning (a video-script "dont"); onboarding profile mostly empty (role, ad spend, goals missing); saved sources = organic_social (own IG/TikTok + 5 rivals), meta_ads (own + 5 rivals), google_ads (own). **No review source** (no Trustpilot) saved. |
| Evidence | `knowledge_search` "customer reviews pains objections what buyers say" | Only 2 hits: an AI-generated "what customers are saying" box from a Google ad page (context, not quotable) and a site metric "4.9 out of 5 stars, 234 reviews". → The bank must be built from public sources; the brain has almost no verbatim customer evidence. |
| Competitors | `competitor_read` + `view: "suggestions"` | 5 tracked (Paula's Choice, The Ordinary, CLEARSTEM, CeraVe, Prequel) with dossiers; 5 suggestions (Skinfix, Naturium, Sofie Pavitt Face CONFIRMED pages; La Roche-Posay, Topicals UNSURE). |
| Demand proxy | `ads_template_read` mode competitor | Rival ads with `ad_started_at` (e.g. Paula's Choice "Pick 3 and save" from 2026-08-24) — usable for the ad-rhythm proxy. |
| Previous run | `file_list` coworker workspace | Only `agent-config/` — first run, no previous bank. |
| Write path | `file_write` → `media_upload` (scope brand, kind document, source workspace) → `knowledge_import` → `job_get` knowledge_ingest → `knowledge_search` document | Tested on the QA brand "MCP Video QA Alpha" with a one-row test bank: import `ready` in ~10 s, 1 chunk, found by search; free. `media_upload` with source `bytes` **rejects markdown** (images/audio/video only) → the atom uses the workspace source. Deleting the media asset (`media_update` delete) removed its knowledge too; test file and media cleaned up. |

**First paid step (not run):** the pull plan would have been — Reddit `/v1/reddit/search` for "personal day skincare", "acne safe moisturizer", "hypochlorous spray" (1 page each); Reddit `/v1/reddit/post/comments` on the top 5 threads; TikTok `/v1/tiktok/search/keyword` "personal day skincare review" + `/v1/tiktok/video/comments` on the top 5; competitor product-page reviews by browser (free). No ScrapeCreators price on record → the run would ask one yes for a single probe (the Reddit search), keep its results, show its real charge, then ask for the stage A total (and later a stage B total for comments).

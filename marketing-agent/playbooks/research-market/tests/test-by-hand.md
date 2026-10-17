# Test by hand — research-market

## The test (rebuilt 2026-10-17 on the AGENTS §8 research pattern)

Pick a brand the reviewer knows first-hand, with real customers and public reviews (and, for a second pass, one with almost none). Ask: **"Who actually buys this, and what do they say in their own words?"**

Pass, all without being asked:
1. **No question before the report** (beyond picking the brand when there are several) — not the founder's belief, not "where do customers talk", not private material, not credits.
2. **News first** for the brand and category.
3. **The free pass read public evidence itself:** the brand's own reviews (G2/Capterra/TrustRadius for B2B; on-site, Trustpilot, app stores for consumer brands) page by page in the host browser, the closest rivals' reviews, and community threads found by web search — with n read per source and a couldn't-read list. It never asks the founder to copy public reviews.
4. **A readable report** (`research/market/<date>-read.md`, a local file offered or an artifact in hosted chat) opening "Do this first, because…" with the primary segment, its job and what to lead with; 2–4 ranked segments and an anti-persona; 5–8 themes with counts and quotes; **"For you" on every finding** and a **"You vs them"** section; typed alternatives; a labelled demand read.
5. **One closing message** with only decisions: the recognition check (is this your buyer, what didn't you know, which quote for an ad), specific private material that would change the answer, claims sign-off, a paid top-up with one yes, rivals to track, rules to keep, refresh cadence.

Also pass:
- Open 10 random quote links: each opens and contains the quote verbatim.
- Pick 3 persona traits: each cites quote ids that support it.
- Every demand line is labelled measured / proxy / prior / unknown.
- `knowledge_search` for a kept quote returns the bank document.

Fail: any question before the report; asking the founder to paste public reviews; ending at "cold start" without having read public reviews and communities; a chat summary instead of a document; an untraceable or paraphrased quote; a vendor's "alternatives" page used as buyer evidence; anything paid before the yes; a customer contacted.

Cold-start pass (a brand with few reviews): the report says the floor was not met **after** showing what the free pass read, nothing is padded, and the survey and interview kit is in it.

**The Juicebox case (dry run, 17 Oct, before the rebuild):** the old version's first output was a question asking the founder to hand-copy 15–20 G2 reviews; it refused to open public G2 pages, ran 3 web searches and would have ended at "cold start" with a chat summary. The rebuilt version's Sonnet re-run is recorded in `critique.md`.

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

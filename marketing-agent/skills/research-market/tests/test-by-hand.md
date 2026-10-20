# Test by hand — research-market

## The test (rebuilt 18 Oct after the senior-marketer review)

Use the GooseWorks server the test folder names (staging). Asks, exactly as the founder typed them: **"i want to do the market research for gooseworks"**; later, **"What are people saying about me and my category this week?"**; and **"watch my brand"**.

Pass, all without being asked:
1. **No question before the report** (beyond picking or creating the brand). No change to the host's settings.
2. **It decides which market** — 2–3 candidate categories, the one buyers use, a recommendation — and **sizes it top-down and bottom-up** (likely buyers × price per buyer group, from research-audience's buyer groups, or provisional groups with "run audience research" as a decision).
3. It covers change (dated, primary-checked or marked), buying, pricing (8+ products with units), attention, demand and what people are saying; rivals stay in one short section; it never builds its own buyer groups or quote bank.
4. **It reads the sibling reports** and states any disagreement; it ends the story with **what this means for positioning**.
5. **The report passes write-report §3** (check its list: the top says what was looked at and the findings before the first move). Also: a baselines table; "For you" only where a finding matters; a local file with a clickable link plus the brand copy.
6. **The closing message:** three lines, at most five decisions, a repeat only with a reason (monthly pulse plus quarterly report; brand watch weekly or daily).
7. **"Watch my brand"** runs the listening alone, risk first, and says nothing beyond one line when nothing crosses a threshold; an alert has what, reach, separate people, what we know, who handles it, and a hold list for serious risks.

Fail (20 Oct hand test): "Do this first" before the reader knows what was researched; a same-week sibling report with a different first move or lead buyer, not named or settled; a report delivered over its word budget.

Fail: questions before the report; a report about rivals' complaints instead of the market; no market decision or no bottom-up size; buyer groups invented here that contradict research-audience's buyer groups without saying so; a report saved only on the server; ids or jargon; a brand watch that sends a full report when nothing happened.

**The 18 Oct hand test (before this rebuild)** turned into rival research, lost the brand's own Product Hunt comments when a worker stalled on a browser prompt for 52 minutes, used the website's prices over the brain's, and produced a report full of ids and agent terms. See `critique.md`.

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

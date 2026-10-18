# Test by hand — research-market

## The test (rebuilt 18 Oct on market research, listening folded in, write-report)

Use a brand the reviewer knows, on the GooseWorks server the test folder names (staging). Ask, exactly as the founder did on 18 Oct: **"i want to do the market research for gooseworks"**. Second ask, later: **"What are people saying about me and my category this week?"**

Pass, all without being asked:
1. **No question before the report** (beyond picking a brand when several match; a named brand not in the account is created from its site). No change to the host's settings or permissions.
2. **It is market research:** the category in buyers' words, size and growth with whose estimates, what's changing, how and where buyers find and buy, pricing norms across the category, where attention is, demand and seasonality, who buys and why in their own words, what people are saying now — and rivals in one short section pointing to competitor research.
3. **News first**; the worker briefs were handed over in full; workers' rows were kept (a stopped worker's included); pages needing the browser were opened by the main run, with one line to the founder first, and nothing sat waiting on an approval silently.
4. **Brand facts from the brain**, not the website, and contradictions flagged, never used as claims.
5. **The report passes write-report §3:** "In short" first with "Do this first"; a story that flows; plain words; no ids, paths, tool names or jargon; "For you" as a plain sentence on each finding; "You vs them"; a local file with a clickable link plus the brand copy with its link.
6. **The closing message:** at most three lines, then at most five decisions, including a repeat only if it would help, with the reason and a cadence.
7. The second ask covers only "what people are saying", with the window stated, name collisions excluded, counts called samples, trends with post-by dates, and any serious risk sent to chat at once.

Fail: questions before the report; a report about rivals' complaints instead of the market; a report saved only on the server; ids or jargon in the report; buyer evidence read and thrown away; an hour waiting on a browser prompt without a word.

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

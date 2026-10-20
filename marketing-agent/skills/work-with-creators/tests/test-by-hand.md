# Test by hand — work-with-creators

## Setup

1. Connect GooseWorks **staging** to your agent and link this folder into your agent's skills folder (see the marketing-agent README).
2. Use a brand in a creator-heavy niche. On staging: **Personal Day** (acne-safe skincare, 7 server-"approved" claims and no sign-off marker, 5 tracked competitors with organic feeds). A pet-supplements brand is the spec's example; any creator-heavy DTC brand works.

## The test

Ask: **"Which creators are worth paying to promote our acne serum, at what price?"** — with no budget or goal.

It passes if:

1. **No question before research.** The first thing you get is the report (the only allowed first question: "a real person filming, or AI-made?" when you say "UGC" without saying who films).
2. **Web research happened, for free.** The report names real creators found by web search and on public TikTok / Instagram / YouTube pages and rivals' collabs or partnership ads, with numbers read from real posts, dated and linked, labelled "public-page read" — never follower counts alone. What a page hid is listed, not guessed.
3. **One message, one credit yes.** After the report: three lines (best pick, first move, link), then only what changes the answer — budget (the report shows three wave sizes), gift unit cost if gifting, names to strike, claims lines to sign off, and **one** yes to "up to N credits" for a deeper vetting top-up that says what it adds.
4. **A document, not a chat summary.** `report.md` passes write-report §3 (its In short in §1's shape; Decisions for you holding the budget, names, claims lines and the top-up; at most six moves in What to do; What we're not doing; Sources with source skew; how sure as confirmed / likely / first look, never fact / inference; no file paths), has timely openings, the assumptions to correct, the shortlist with price range and math and **For you** per pick ("this creator's format fits your serum because…"), **You vs them**, wave 1 and its criteria, near-misses, "what we could not read" — and briefs plus first messages for the top picks. Offered to open (host with files) or shown as an artifact/document.
5. **Claims-safe.** No efficacy line for the serum unless signed off; lines needing proof say "you'd need proof of X first"; first messages carry no price and no claims.
6. **It contacts nobody**, and asks you to approve the names (all, or strike any) before anything is sent by you.

Then: give a budget and say "yes, up to 200 credits" → it re-prices, deepens vetting inside the ceiling (logs every charge), finishes the remaining briefs, re-delivers. You'd pay at least half the shortlist inside the stated range after spot-checking two picks.

Edge tests:
- Repeats: a monthly roster refresh is offered only when a programme is running or about to (with the reason); after a one-off shortlist or a single vet, no repeat is offered.
- "I need UGC for my ads" → asks "a real person filming, or AI-made?" first; AI-made goes elsewhere.
- B2B SaaS asking for LinkedIn creators and newsletters → LinkedIn and newsletter pages read in the browser, sponsor pages and media kits found, no gift-first, per-placement prices.
- On a re-run, paste fake wave-1 results → scored against `wave-1.md`, `wave_result` set, a roster change proposed for your yes.

## Staging run log

### 2026-10-16 — Personal Day (0e5b2fb0…), up to the first paid step

What ran (all free):
- `brand_read` summary, accounts, organic, competitors → own accounts @personalday (IG), @personaldayskin (TikTok) with recent posts and numbers (e.g. IG reel 40,397 views / 1,462 likes / 31 comments); competitors Prequel Skin, CeraVe, CLEARSTEM, The Ordinary, Paula's Choice. **Competitor collabs visible for free** in the competitors' organic captions: The Ordinary × @recess_therapy (10th-anniversary series), Paula's Choice × @hannah_waddingham. Both are celebrity/large accounts — conflict notes for discovery, not picks for a micro wave.
- `knowledge_search` claims → 7 "approved" (server research approves them without review — the claims gate's contract treats them as candidates until a sign-off marker exists; `knowledge_search` learning "Claims sign-off" → empty, so no marker on Personal Day yet): four are **press quotes** (Allure, Byrdie, NewBeauty), plus "Free Returns", "Free Shipping on Orders $45+", "Rated 4.9 out of 5 stars 234 Reviews". The kit's value props ("100% free of acne-triggering ingredients", "dermatologist-developed") are **context, not approved claims**.
- `knowledge_search` creators / disclosure / banned words → nothing on file: no creators in talks, no disclosure rules, no banned-word list beyond the kit voice "don'ts".
- `brand_read` kit, products, learnings → 20 products; the spray's record has **price $12.00, no unit cost or margin**; one learning (a video-script "don't").
- `brand_read` product record → the product description carries efficacy language ("bacteria-fighting", "daily defense against breakouts").
- `social_inspiration_library` → **empty** (research-market has not saved outliers yet).
- `campaign_read` → no campaigns. `file_list` query `work-with-creators` → no earlier roster.

What Gate 1 would ask and play back:
> Goal? (awareness, content for ads, or tracked sales) · budget for this wave? · platforms (TikTok + IG Reels suggested from your own channels) · creators already in talks? · unit cost of the spray and lip balm (gift cost) — not in the brand records · US only?
> Plan once answered: ~30 micro creators (acne / sensitive-skin routine niche) seeded with a routine bundle, gift-first (~6–12 posts expected) + 2–3 UGC-for-ads creators paid per asset; a credit ceiling for discovery (about 60–90 lookups; the first answer's charge shown before continuing).

Stopped here: the next call is paid.

First paid calls it would make (not run): `data_call_provider` scrapecreators `/v1/instagram/user/tagged-posts` on @personalday (existing fans first), `/v1/tiktok/search/keyword` "acne safe skincare routine", `/v1/facebook/adLibrary/company/ads` for CLEARSTEM and Prequel (partnership ads).

Findings from this run, fixed in the playbook:
- Workspace files are per user, not per brand → files go to the brand coworker workspace (the sibling convention).
- Server-"approved" claims include press quotes and a star rating → with no sign-off marker they are candidates and are cut from briefs; once signed off, press quotes are cited as the publication's words, not lines a creator says as their own experience; product descriptions are **not** a claims source — brief facts are neutral (format, size, key ingredients, how to use), never efficacy words, unless signed off.
- No unit cost in product records → the gift-vs-paid call must ask for it (already in "Before you start").
- Empty Inspiration library → discovery falls back to fans, competitor collabs and search; the playbook must not stall on it.

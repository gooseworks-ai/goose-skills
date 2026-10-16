# Test by hand — work-with-creators

## Setup

1. Connect GooseWorks **staging** to your agent and link this folder into your agent's skills folder (see the marketing-agent README).
2. Use a brand in a creator-heavy niche. On staging: **Personal Day** (acne-safe skincare, 7 server-"approved" claims and no sign-off marker, 5 tracked competitors with organic feeds). A pet-supplements brand is the spec's example; any creator-heavy DTC brand works.

## The test

Ask: **"Which creators are worth paying for this brand, at what price, and what should they make?"** — first *without* a goal or budget.

It passes if, in order:

1. It reads the brand (claims, products, competitors' organic posts, Inspiration, any earlier roster) and **asks** for the goal, budget, platforms, creators already in talks, and gift unit cost/margin — in one message. It does not guess any of them.
2. It plays back the plan (roles, tier mix, shortlist size) and asks a yes to spend: on a first run one yes for a single probe read and the "up to N credits" discovery ask in the next message from its charge; with price history, "up to N credits" straight away, labelled an estimate; no paid lookup before your yes. It never names a tool, vendor or playbook to you.
3. It shows the finalists (full vs light vetting) with what discovery actually charged and asks a yes to "up to N credits" for vetting.
4. What comes back: the plan with total target spend vs budget and a first wave; a shortlist where every pick shows median views, engagement by the right basis, sponsored-vs-organic, a comment-quality read, cadence, audience fit with a confidence level, safety and conflicts — all dated, linked to real posts; a price as floor / target with a walk-away ceiling and the math; the rights add-on; gift / paid / affiliate / hybrid with a reason; one one-page brief **and a first-message draft** (gift and/or paid) per creator; `wave-1.md` with a win metric, read window and renew/cut rule per role; near-misses with reasons.
5. **It contacts nobody** — no DMs, no emails, no codes, no offers — asks you to approve the names (all, or strike any) first, and labels every message "draft, you send it".
6. Briefs: must-says are signed-off claims in exact words — on Personal Day (no marker) the claims check puts the 3–5 lines the briefs need to you for a yes; lines you don't approve are cut and listed; first messages carry no price and no claims; never-says present; disclosure lines for the platform; rights ask marked "proposed, pending contract"; two examples, one the creator's own post; no script.

It passes if you would genuinely pay at least half of the shortlist inside the stated range after spot-checking two picks' engagement yourself, and one brief passes someone who has briefed creators before. **Telltale failure:** picks justified by follower counts, or a single price with no math.

Edge tests:
- Routing: "I need UGC for my ads" → it asks "a real person filming, or AI-made?" before starting; AI-made goes elsewhere. "Find podcasts I can go on as a guest" → not covered, said plainly.
- Wave read-back: on a re-run, paste fake wave-1 results (two wins, one miss) → it scores them against `wave-1.md`, marks `wave_result`, and proposes a roster change for your yes.
- Schedules: "refresh this monthly" → an opt-in, paused schedule whose yes names a per-run credit ceiling.
- B2B SaaS asking for LinkedIn creators and newsletters: platforms switch to LinkedIn/newsletters/podcasts, "gift-first" is not recommended, commenter headlines are the fit evidence, media kits are asked for.
- A consumer app asking for UGC creators: roles are UGC-for-ads, priced per asset + usage, audience size matters little.
- Asking it to "DM them" or "send them product": it says plainly this is out of scope until a sending layer exists and gives the roster for the human to act on.

## Staging run log

### 2026-10-16 — Personal Day (0e5b2fb0…), up to the first paid step

What ran (all free):
- `brand_read` summary, accounts, organic, competitors → own accounts @personalday (IG), @personaldayskin (TikTok) with recent posts and numbers (e.g. IG reel 40,397 views / 1,462 likes / 31 comments); competitors Prequel Skin, CeraVe, CLEARSTEM, The Ordinary, Paula's Choice. **Competitor collabs visible for free** in the competitors' organic captions: The Ordinary × @recess_therapy (10th-anniversary series), Paula's Choice × @hannah_waddingham. Both are celebrity/large accounts — conflict notes for discovery, not picks for a micro wave.
- `knowledge_search` claims → 7 "approved" (server research approves them without review — learn-my-brand's contract treats them as candidates until its sign-off marker exists; `knowledge_search` learning "Claims sign-off" → empty, so no marker on Personal Day yet): four are **press quotes** (Allure, Byrdie, NewBeauty), plus "Free Returns", "Free Shipping on Orders $45+", "Rated 4.9 out of 5 stars 234 Reviews". The kit's value props ("100% free of acne-triggering ingredients", "dermatologist-developed") are **context, not approved claims**.
- `knowledge_search` creators / disclosure / banned words → nothing on file: no creators in talks, no disclosure rules, no banned-word list beyond the kit voice "don'ts".
- `brand_read` kit, products, learnings → 20 products; the spray's record has **price $12.00, no unit cost or margin**; one learning (a video-script "don't").
- `brand_read` product record → the product description carries efficacy language ("bacteria-fighting", "daily defense against breakouts").
- `social_inspiration_library` → **empty** (listen-social has not saved outliers yet).
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

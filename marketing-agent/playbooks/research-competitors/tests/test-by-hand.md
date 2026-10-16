# Test by hand — research-competitors

## The test (from the spec, sharpened after critique)

Use a brand with competitors the team can name. Ask: **"What are my competitors running right now, and what works for them?"**

You should see, in order:
1. The set played back — tracked rivals, server suggestions (with whether each Meta page was confirmed), research-market's named competitors — and a question before anyone is added or dropped. A removal only happens on your own press of the server's card.
2. Free reads first; before anything paid (Google/LinkedIn/TikTok ad libraries, proxy social, search), a credit total to say yes to.
3. One file per deep rival (3–5), each section dated and sourced or marked "not read: <why>"; a landscape with the reasons-to-buy matrix; an angle bank with `A-NN` ids.
4. Other questions only where they apply: the Meta page link for an UNSURE rival; whether to find out what buyers say first or continue without buyer evidence (in plain words — no playbook names); pasted page text in a host without web access; the credit total for any paid pull; saving top angles as learnings; and whether to turn on the weekly watch (free sources only; its own run cost shown after the first run).

Pass:
- The hand-over opens with "Do this first, because…" and names one angle to brief now.
- The top 3 rivals' full active ad libraries were read (host browser, or one paid read per rival after the spend gate's yes) — or the files say "partial — sample only" and why.
- No rival came from the agent's own memory; every candidate shows its source.
- Angle tags in hand-off examples are lower-case (`angle:a-07`).
- Open every ad link in one rival's file: each is a real ad, and the "active as of" date (the ad source's scrape date) is no more than 7 days old. Dead ones are marked ended, not hidden.
- No line states a rival's spend, ROAS, CTR or conversion; every "what works" line says it is an inference and why.
- Hand one `briefable` angle to make-static-ads as the brief: it works without extra research (reason to buy, segment, proof mapped to approved claims, formats, guardrails all present).
- Every gap in the landscape has buyer evidence (voice-of-customer ids) — no invented white space.
- Saved and findable with `knowledge_search`; credits ≤ approved.

Watch pass (a week later, "what changed this week?"): one screen, only threshold-crossing changes with links, top three with owners, a "no material change" list; quiet week reported as quiet.

React pass ("<rival> just cut prices 40%"): verifies with a dated source first, refreshes that rival, gives 2–3 options including "do nothing", routes each to its owner, never recommends matching the price by reflex.

Fail: dead or stale ads presented as live, a rival added or removed without asking, a spend/results claim, an angle that is reworded rival copy, a claim not on the approved list, anything paid before a yes.

## Staging run — 2026-10-16 (GooseWorks staging, brand "Personal Day")

Ran every free step up to the first paid call. Nothing paid was called.

| Step | Call | What came back |
|---|---|---|
| Set | `competitor_read` (roster) | 5 tracked rivals with dossiers (positioning, pricing tier, proof points, content themes, differentiators, audience segments with evidence, socials, `ad_count` 24, `last_researched_at` 2026-10-13). |
| Set | `competitor_read` `view: "suggestions"` | Skinfix (166 ads), Naturium (115), Sofie Pavitt Face (107) with CONFIRMED pages; La Roche-Posay and Topicals UNSURE with two possible pages each → step 1 must show the verdict before saving. |
| Dossier | `competitor_read` `slug: "clearstem-com"` | Full profile; no individual ads, no prices, no landing-page quotes → those come from steps 3, 5, 6. |
| Ads | `ads_template_read` mode competitor | Rows with `source_ad_id`, primary text, CTA, destination URL, `ad_started_at`, `ad_ended_at` = 2026-10-13 (the scrape date) and platforms. Example: Paula's Choice "Pick 3 and save 20%… 30%" running since 2026-08-24 → build-a-routine page. Last scrape 3 days old → "active as of 2026-10-13" is allowed (≤7 days). |
| Video ads | `media_list` tags `ad_library`, `competitor_ad`, kind reference | Rival video ads stored as reference-only media with the Ad Library link in `metadata.source_url` (e.g. Vue Skin). |
| Social | `brand_read` section `organic` | `competitor_top_posts` with views/likes/comments (e.g. The Ordinary × Recess Therapy anniversary video, 1.22M views) — free input for step 8. |
| Freshness | `brand_read` competitors → source `last_scraped_at` | Ad sources were last scraped 2026-10-13 (3 days) — matches the latest `ad_ended_at`; no refresh needed. The sample includes ended ads (e.g. a Prequel ad last seen 2026-10-07), which is why "active" means last-seen = scrape date. `competitor_research` refresh is free but was not called (it writes server research). |
| Automations | `automation_list` | None exist; the watch would be the first. |

**First paid step (not run):** a Google Ads Transparency import for the two closest rivals (`ads_library_scrape`, `library_provider: "google"`, confirmed advertiser, `max_ads` 10, `max_spend_usd` cap) — skipped; for a DTC brand Meta is the main library, so the run would offer it as optional with its cap and wait for a yes.

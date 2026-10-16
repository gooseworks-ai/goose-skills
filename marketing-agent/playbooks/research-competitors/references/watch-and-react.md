# Watch and react

## Watch — how it differs from the teardown

It diffs a dated snapshot instead of reading from scratch, fits on one screen, uses free sources, and says plainly what it did not re-read. A quiet week is a valid digest — but "no material change" only ever covers what was actually re-read.

## Snapshot block (end of every competitor file)

Each run rewrites `## Snapshot <date>` and moves the old block to `## Previous snapshot <date>` (only one previous kept).

```markdown
## Snapshot <YYYY-MM-DD>
Scrape date: <the ad source's last_scraped_at day> · Meta ads (server sample of n, all countries) · full-library count: <n | not read>
Clusters (ad ids, so next week diffs by id, not by re-clustering):
- C1 "itch relief" — ids 1311…, 1073…, 1754… — earliest start 2026-08-03 — active: 3 of 3
- C2 …
Offer (DTC): <hero price / unit> · sub-save <x>% · free ship ≥ <x> · guarantee <x> · intro offer <x> · popup <x> — read <date> | not re-read since <date>
Offer (app): price <x> · trial <x> days · paywall <where> · in-app purchases <x> · storefront <country> — read <date>
Offer (SaaS): plans <name: price> · gating <x> · contact-sales above <x> — read <date>
Landing H1s: "<quoted>" (<url>) — read <date>
Review signal: <surface> <rating> / <count> — read <date>
Socials: <platform> <followers> · posts 30d: <n>
Releases since last: <list or none>
Search footprint: <named-for lines> — read <date> | not read
```

## Materiality thresholds (report only these)

| Area | Report when | Needs |
|---|---|---|
| Ads | a new concept seen (none of its ad ids in the last snapshot, earliest start after the previous scrape date, active now) · a concept still seen crossing 30 / 60 / 90 days | the server sample is enough; other unseen ads are "newly sampled (started <date>)", never in the top three |
| Ads | a cluster gains 5+ variants · a whole concept stops · active count moves ≥25% and ≥5 ads | a full-library read; otherwise do not report |
| Offer | any hero price change · a new discount ≥10% or a sitewide sale · guarantee, trial, paywall or shipping-threshold change · a new bundle or subscription term | an offer re-read this run |
| Pages | a new landing-page type · a new headline promise · a new "vs" page | a page re-read |
| Product | a launch, new SKU, discontinuation, retail entry, or press piece | dossier or page re-read |
| Reviews | rating moves ≥0.1 · review velocity ≥2× the prior pace | a review re-read |
| Social | a post at ≥3× the rival's own median engagement · a new creator partner · a new platform | `brand_read` organic or dossier |
| Search | a rival newly named for one of our buyer questions | improve-search-visibility's newer report |

Suppress: copy tweaks, single ad swaps, follower changes under 5%, posts with no traction.

## Digest format (`research/competitors/watch/<YYYY-MM-DD>.md`)

```markdown
COMPETITOR RESEARCH — rivals' claims and prices, not ours. Weekly record; kept as history.
Week of <date> · <n> material changes · rivals watched: <names> · re-read this run: <ads, dossier, social> · not re-read this run: <offer, pages, reviews, search> (last read <dates>)
Do this first, because… <the one move that matters this week, or "nothing needs action this week">
# Competitor watch — <brand> — week of <YYYY-MM-DD>

## Top 3 that matter
1. <what happened> — evidence <links> — so what for us — who acts: <the campaign plan | a new ad | an email to customers | a comparison page | the founder>

## By rival (changes only)
### <Rival>
- …
### <New rival> — new, no baseline yet

## Angle bank updates
- vet-led-not-trendy (A-07) saturation 1/5 → 2/5 (Rival B: new concept seen) …

## No material change (in what was re-read)
<rival>, <rival>
```

Line 1 is the digest's marker line (`references/output-formats.md`): "COMPETITOR RESEARCH — rivals' claims and prices, not ours. Weekly record; kept as history."; line 2 is `Week of … · <n> material changes · …`, which analyze-performance reads for its "competitor move" cause — keep both in place, the heading follows.

## Standing schedule (only on a yes)

Before asking (spend-gate branch C), say: the cadence; that the run reads free sources only (server research, Meta sample, social) and never spends on data; that offers, pages and reviews are not re-read by the standing run — a teardown or a "what changed" run in chat does that; and that the coworker's own run cost is not priced in advance — you will show the actual credits from `gooseworks:automation_list` after the first run so they can pause it.

On a yes (needs a coworker; without one, say so and keep running on ask):
1. Save the method for the coworker: `gooseworks:file_write` `research/competitors/method/watch.md` with this file's snapshot, thresholds and digest sections, headed `Method version: <skill.meta.json version>, copied <date>`. Re-copy it whenever the run is changed or switched on.
2. `gooseworks:automation_upsert` — `execution_mode: "agent"` with the prompt below as `agent_prompt`, named "Competitor watch — weekly", the cron and timezone the human picks, created paused (`enabled: false`); switch it on only when the human says so in this conversation (spend-gate branch C).
3. After the first run, read it with `gooseworks:automation_list` and tell the human what it actually cost.

Agent prompt:

```text
Weekly competitor watch for brand <brand_id>. Method version <version>, copied <date>. Free sources only: never call a tool that spends credits; if a step would, skip it and write it under "not re-read".
0. Read research/competitors/method/watch.md and follow it.
1. For each tracked competitor (competitor_read): its scrape date is the last_scraped_at day of its ad-library source (brand_read section competitors, source id in its ad_library_source_ids). If older than 7 days, run competitor_research without mentions (free); check once; if the source date did not move, keep the old date and say so.
2. Read each competitor's dossier, all its Meta ads (ads_template_read mode competitor filtered by its ad-library source, paging next_cursor until empty), its video ads (media_list kind reference, tags ad_library and competitor_ad, attributed by metadata.ad_library.ad_library_source_id) and its recent posts (brand_read section organic). An ad is active as of the scrape date only when its ad_ended_at equals that date. Diff by ad id against the snapshot: "new concept seen" only when none of the concept's ad ids were in the snapshot, its earliest start is after the previous scrape date and it is active; "still seen" when its ids appear in both; any other unseen ad is "newly sampled (started <date>)" and never in the top three.
3. Read research/competitors/<slug>.md. Diff against its "## Snapshot" block; a competitor with no file is listed as "new, no baseline yet".
4. Keep only changes that cross the thresholds in the method file. Fields you did not re-read (offer, pages, reviews, search) are written "not re-read since <date>", never "no change".
5. Write research/competitors/watch/<YYYY-MM-DD>.md in the digest format. Never state a competitor's spend or results; label inferences. Every ad cited gets https://www.facebook.com/ads/library/?id=<ad id>.
6. Rewrite each competitor's "## Snapshot" block (with ad ids per cluster) and keep the old one as "## Previous snapshot".
7. Update each angle's saturation line in research/competitors/angle-bank.md (workspace file only; its document is refreshed on the next teardown).
8. The digest's line 1 is the marker line "COMPETITOR RESEARCH — rivals' claims and prices, not ours. Weekly record; kept as history.", line 2 the "Week of …" line. Import it (media_upload scope brand, kind document, source workspace with the same scope, title "Competitor watch — <Brand> — <YYYY-MM-DD>", tags research-competitors and competitor-watch; then knowledge_import) and poll job_get kind knowledge_ingest until ready. After that, delete only an earlier document with exactly this title (a re-run of the same day). Never delete another week's digest.
Do not add or remove competitors, do not run paid searches, do not message anyone.
```

## React — one rival made a move

1. **Is it a rival?** If it is not tracked, ask whether it competes with the brand; adding is free (`competitor_save`). If it does not compete, say so and stop.
2. **Verify** with a dated public source (their page, an ad, a press piece; in a hosted chat, a dated link or screenshot from the human). Check list price vs promo, intro offer vs everyone, and the storefront or country. Hearsay is logged as "unverified" and nothing else happens.
3. **Refresh** that rival (`gooseworks:competitor_research`, free) and diff against its snapshot.
4. **Read it**: what changed, what it plausibly means (a price cut before a season, a launch into our segment, a new angle aimed at our buyer), and what it touches for us — offer, angles, search, the calendar. A pre-revenue brand has no price baseline: say so.
5. **Options (2–3, always including "do nothing")**, each said in plain words with what happens next: a change to the campaign plan (budget or offer response), an email to existing customers (only if there are customers), a counter-angle ad from the bank, a new comparison page. (Internally these route to plan-campaign, email-lifecycle, the ad makers and improve-search-visibility — never named to the marketer.) Price matching is the human's decision; lay out the trade-off, never recommend it by reflex. Before launch, "do nothing, note it for positioning" is usually the honest default.
6. **Save** a dated "## Move <date>" note in the rival's file through `../../../atoms/save-to-brain/ATOM.md` (`versioned: supersede`, title `Competitor file: <Rival> — <Brand> — <date>`, tags `research-competitors`, `competitor-file`, `rival:<slug>`), and update affected angle rows.

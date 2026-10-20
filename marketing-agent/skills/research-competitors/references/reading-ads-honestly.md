# Reading competitor ads honestly

Load in the rival pass (§2 ads) and at step 5. The free ad libraries read in the host's browser — LinkedIn, Google, Meta, TikTok — are the primary source; the server's Meta sample is a free extra. Public ad libraries show what a rival runs, when it started, where it runs and what it says. They never show spend, results or targeting (EU-delivered ads aside). Everything you say about "what works" is an inference from survival and iteration — say so every time.

## Where the ads come from

| Source | How | Cost | What it is |
|---|---|---|---|
| **Every public library — the default** | LinkedIn Ad Library, Google Ads Transparency Center, Meta Ad Library, TikTok Commercial Content Library, X Ads Repository, read in the host browser for **every main rival, every run** (rival-craft §2) | free | The full active library as the public sees it: counts, every concept, dates, formats |
| Server sample, static | `gooseworks:ads_template_read` `mode: "competitor"`, filtered by the rival's ad-library source | free | About two dozen ads per rival chosen by the server's research (selection rule unknown): ad id, copy, CTA, destination, start date, last-seen date, platforms, image |
| Server sample, video | `gooseworks:media_list` kind `reference`, tags `ad_library` + `competitor_ad` | free | Reference-only video files; a row belongs to a rival only when `metadata.ad_library.ad_library_source_id` is one of its sources (dates and library link in that block). Rows without it were saved by the team — dates unknown, never counted as active; `gooseworks:media_analyze` (free) reads transcript and on-screen text when the hook is not clear from the copy. Never footage for our ads. |
| Re-import of the sample | `gooseworks:ads_library_scrape` with the rival's `source_id` and no `library_provider` — unverified on staging (server-needs #14); do not count on it | unverified | The same capped sample again (about two dozen statics, up to ~20 videos; the source's `import_result` shows how many were found and skipped) — never a full-library read. `import_result.video_found` may be cited as "video ads found at scrape time". |
| Paid bulk read (top-up) | `../../spend-gate/proxy-endpoints.md` (in the `spend-gate` skill) (Meta full read with `status: ACTIVE` and the market's `country`; Google, LinkedIn, TikTok), through the spend gate | paid | Only where the browser could not render a library, and only as the top-up the founder said yes to after the report |

The link for a Meta ad is `https://www.facebook.com/ads/library/?id=<ad id>`. Put it on every ad you cite. The server sample covers all countries — say "server sample, all countries". For browser or paid full reads, set the library's country to the brand's main market and say which; counts differ by country.

## Dates and "active"

- **Scrape date** = the `last_scraped_at` day of the rival's ad-library source (`brand_read` `competitors`, the source whose id is in the rival's `ad_library_source_ids`), cross-checked against the latest `ad_ended_at` in its sample. The dossier's `last_researched_at` dates the profile, not the ads.
- **Active as of the scrape date** = the ad's last-seen date (`ad_ended_at`, stored as a date) equals the scrape date. Anything else was last seen earlier: "last seen <date>" — the sample does include ended ads.
- **Days running** = last-seen date − start date (not today − start date).
- A server scrape older than 7 days is refreshed with `gooseworks:competitor_research` (free) during the rival pass, or labelled stale; it is never called live. The browser read of the library is the live view.
- Open the landing page of every top ad; spot-check the rest, and record "links checked n". Without a browser, "links not checked (no browser here)". A dead link is marked "ended by <date>", never silently deleted.

## What the sample can and cannot show

The rival pass reads every library, for every main rival, in the browser. Where a library could not be read in full and only the server sample exists, the profile and the report say **partial — sample only**, and these rules apply.

From the server sample alone, report only:
- **New concept seen** — all three must hold: none of its ad ids is in the last snapshot, its earliest `ad_started_at` is after the previous scrape date, and it is active at the current scrape;
- **Still seen** — a concept whose ad ids appear in both snapshots;
- **Newly sampled** — any other ad not in the last snapshot (an old ad the sample picked up), listed under its rival as "newly sampled (started <date>)", never in the top three.

Never report from the sample alone: "stopped", "killed", "tested and lost", active-count changes, variant growth, or share of ads by format. The sample's selection can change between scrapes; these claims need the full library (the "Full library" row above).

## Dates by library

- **Meta:** start date and "active"/"inactive"; EU-delivered ads add reach and targeting.
- **Google Ads Transparency:** first shown and last shown dates per ad, by format (Search, YouTube, Display) and region.
- **LinkedIn Ad Library:** run dates per ad and, for EU-delivered ads, impression ranges and targeting; formats (single image, video, document, carousel, conversation, Thought Leader Ad) are shown.
- **TikTok / X:** EU-delivered ads only, with first and last shown dates and reach.
Days running = last seen − first seen in every library. Say which country or region each library was read for.

**Counts are not comparable across libraries.** Meta's count is ads active now; Google's is every ad shown in the date range the page is set to (often all time); others differ again. Never put them side by side as one measure, in a table or a sentence: label every count with what it counts ("Meta: 14 active now", "Google: 220 shown since 2023"). And an ad count is creative volume, never spend or reach — say so wherever counts are compared.

## Inference rules (full-library reads, or clearly labelled sample observations)

| Signal | What it suggests | Discount it when |
|---|---|---|
| Ad running 30+ days | Survived — probably not losing money | always-on brand or retargeting ads, regional or language variants, dynamic/catalogue ads, small advertisers that never turn anything off |
| Several near-duplicate variants started over several weeks (same concept, new hooks, crops, creators) | **Strongest public signal**: a winner being iterated | the variants are only sizes or languages of one ad |
| Many new ads per 30 days (full library) | Creative budget and testing velocity — not spend | — |
| A concept many variants deep that stopped (full library) | Probably tested and lost | it was seasonal (a sale ended) |
| Same message across many rivals | Category convention: table stakes, not a differentiator | — |
| Creator / paid-partnership ads (seen in the library) | Whitelisted creator content is part of their mix | — |
| A rival's Google search ad whose copy names our brand | Suggests they bid on our name (inference — the library shows ads by advertiser, not keywords) | the ad names us only in a comparison page title |

Always state: which libraries and country were read, sample or full, scrape date, "no spend or results are public". Never write spend, ROAS, CTR, CPA, conversion rate or "their best-performing ad" as fact.

## Breaking an ad into parts

For each cluster record:
- **Reason to buy** it leads with (the promise, one line, buyer language).
- **Hook type**: problem call-out · us-vs-them · demo/how it works · social proof/testimonial · founder story · myth-bust · offer-led · curiosity/pattern-interrupt · identity ("for people who…") · B2B: screen-record demo · ROI or time-saved number · analyst or award badge · "how <customer> did X". In health, condition or other personal-attribute categories, a rival's "you have X" hook is evidence of their approach, never a hook type we brief (ad platforms reject ads that assert or imply a viewer's condition).
- **Awareness level** it speaks to (Schwartz): unaware, problem-aware, solution-aware, product-aware, most aware.
- **Offer** (discount, bundle, trial, guarantee, free shipping) and CTA.
- **Proof type**: clinical stat, reviews/stars, before/after, expert, press, numbers, none · B2B: logo wall, G2 badge or rating, analyst report, case-study metric, ROI calculator.
- **Format**: image, video, carousel, UGC, talking head, demo, creator-whitelisted; B2B: document ad, conversation ad, Thought Leader Ad (a boosted founder post — tie it to the founder's organic voice).
- **Destination page type** (from the destination URL).

Their headline is evidence, never output. Our angle is written from the reason to buy, not from their words.

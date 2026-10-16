# Reading competitor ads honestly

Load at steps 3–4. Public ad libraries show what a rival runs, when it started, where it runs and what it says. They never show spend, results or targeting (EU-delivered ads aside). Everything you say about "what works" is an inference from survival and iteration — say so every time.

## Where the ads come from

| Source | How | Cost | What it is |
|---|---|---|---|
| Server sample, static | `gooseworks:ads_template_read` `mode: "competitor"`, filtered by the rival's ad-library source | free | About two dozen ads per rival chosen by the server's research (selection rule unknown): ad id, copy, CTA, destination, start date, last-seen date, platforms, image |
| Server sample, video | `gooseworks:media_list` kind `reference`, tags `ad_library` + `competitor_ad` | free | Reference-only video files; a row belongs to a rival only when `metadata.ad_library.ad_library_source_id` is one of its sources (dates and library link in that block). Rows without it were saved by the team — dates unknown, never counted as active; `gooseworks:media_analyze` (free) reads transcript and on-screen text when the hook is not clear from the copy. Never footage for our ads. |
| Re-import of the sample | `gooseworks:ads_library_scrape` with the rival's `source_id` and no `library_provider` (platform-funded per its description) | free | The same capped sample again (about two dozen statics, up to ~20 videos; the source's `import_result` shows how many were found and skipped) — never a full-library read. `import_result.video_found` may be cited as "video ads found at scrape time". |
| Full library | the rival's library page in the host browser, or the paid full read with `status: ACTIVE` and the market's `country` (`../../../atoms/spend-gate/proxy-endpoints.md`, through the spend gate) | free / paid | The only way to see counts, every concept, carousels and creator partnerships |
| Google, LinkedIn, TikTok libraries | `../../../atoms/spend-gate/proxy-endpoints.md` | paid | Only where the company type needs them, on a yes |

The link for a Meta ad is `https://www.facebook.com/ads/library/?id=<ad id>`. Put it on every ad you cite. The server sample covers all countries — say "server sample, all countries". For browser or paid full reads, set the library's country to the brand's main market and say which; counts differ by country.

## Dates and "active"

- **Scrape date** = the `last_scraped_at` day of the rival's ad-library source (`brand_read` `competitors`, the source whose id is in the rival's `ad_library_source_ids`), cross-checked against the latest `ad_ended_at` in its sample. The dossier's `last_researched_at` dates the profile, not the ads.
- **Active as of the scrape date** = the ad's last-seen date (`ad_ended_at`, stored as a date) equals the scrape date. Anything else was last seen earlier: "last seen <date>" — the sample does include ended ads.
- **Days running** = last-seen date − start date (not today − start date).
- A scrape older than 7 days is refreshed before hand-over (SKILL step 2) or labelled stale; it is never called live.
- With a browser, spot-open at least 5 links (and every link in the top three clusters) and record "links spot-checked n". Without one, "links not checked (no browser here)". A dead link is marked "ended by <date>", never silently deleted.

## What the sample can and cannot show

The teardown reads the full active library of the top 3 rivals by default (SKILL step 3). When it could not, the file and the hand-over say **partial — sample only**, and these rules apply.

From the server sample alone, report only:
- **New concept seen** — all three must hold: none of its ad ids is in the last snapshot, its earliest `ad_started_at` is after the previous scrape date, and it is active at the current scrape;
- **Still seen** — a concept whose ad ids appear in both snapshots;
- **Newly sampled** — any other ad not in the last snapshot (an old ad the sample picked up), listed under its rival as "newly sampled (started <date>)", never in the top three.

Never report from the sample alone: "stopped", "killed", "tested and lost", active-count changes, variant growth, or share of ads by format. The sample's selection can change between scrapes; these claims need the full library (the "Full library" row above).

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
- **Hook type**: problem call-out · us-vs-them · demo/how it works · social proof/testimonial · founder story · myth-bust · offer-led · curiosity/pattern-interrupt · identity ("for people who…"). In health, condition or other personal-attribute categories, a rival's "you have X" hook is evidence of their approach, never a hook type we brief (ad platforms reject ads that assert or imply a viewer's condition).
- **Awareness level** it speaks to (Schwartz): unaware, problem-aware, solution-aware, product-aware, most aware.
- **Offer** (discount, bundle, trial, guarantee, free shipping) and CTA.
- **Proof type**: clinical stat, reviews/stars, before/after, expert, press, numbers, none.
- **Format**: image or video from the server data; carousel, UGC, talking head, demo, creator-whitelisted only when seen.
- **Destination page type** (from the destination URL).

Their headline is evidence, never output. Our angle is written from the reason to buy, not from their words.

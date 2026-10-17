# Test by hand — research-competitors

## The test

Use a brand whose market the reviewer follows. Ask, exactly: **"What are my competitors running right now, and what works for them?"** The run must not ask anything before the report — not the rival list, not "go deeper?", not "shall I continue?", not credits.

Pass — all of these, without being asked:
1. **News first**, for every rival and for our own brand, last 90 days; any shutdown, acquisition, launch, price change or funding from the last 30 days leads the report as a timely opening, with its window and a drafted move.
2. **Every main rival covered on every dimension** (`../references/research-spec.md` §6 checklist), weighted by company type — for B2B: LinkedIn ads and posts, founder and exec posts, G2/Capterra, pricing, launches with demos, hiring, integrations, comparison searches and AI answers. Empty libraries recorded as "none found".
3. **Founder and exec voice** read for 1–3 people per rival, with links.
4. **Launches** in the last 90 days, with the biggest demo and its best third-party posts broken into hook · setup · reveal · proof · CTA, and a format brief per demo (each beat → our feature and approved proof), and a counter-position kit where we already do it better (our demo, not their name by default). Each breakdown says whether it came from the video or the transcript.
5. **A readable document** at `research/competitors/<date>-report.md` (published as a page or document where the host can; otherwise a local file offered) that opens with "Do this first", then openings, landscape, same-shape profiles, swipe file, angles, triggers and a "couldn't read" list. The chat reply is three lines.
6. Every fact linked and dated; every "works" line labelled inferred with its reason; no copied words; no disparaging.
7. **"For you" closes every finding** (fits us or not, from our facts; what to make, the approved claim, who makes it; "you'd need proof of X first" where a claim isn't approved), and a **"You vs them"** section (ahead, behind, everyone sounds the same). Our own ads, posts, product and pricing were read in the free pass. Nothing is made.
8. Only decisions asked at the end, in one message: which openings to act on, the rivals covered (add or drop), claims sign-off, a paid top-up with one yes to a ceiling, the weekly watch, saving rules.

Fail: any question before the report; stopping after one source; reading only Meta for a B2B brand; missing a recent rival shutdown or launch that a news search finds; a chat summary instead of a document; facts without links or dates.

## The Juicebox case (the run that failed on 16 Oct and set this bar)

Brand: Juicebox (AI recruiting search). Rivals: Loxo, hireEZ, Findem, Eightfold, Fetcher. A good run must reach, unprompted:
- Fetcher's shutdown (platform closed 16 Oct 2026) and Juicebox's purchase of Fetcher's assets → a time-boxed switch campaign at the top, with its "For you";
- the recent hireEZ and Eightfold launches, with demos and third-party posts;
- what the rivals' founders and execs are posting;
- LinkedIn and Google ads (Meta matters less for this B2B category), pricing, G2 reviews, hiring and AI-answer presence;
- "For you" lines such as the Fetcher switch campaign, or Juicebox's free tier against Loxo's trial, and a "You vs them" section.

The old run read only Meta ad libraries, asked "go deeper?", found the Fetcher story only when pushed, and ended in a chat summary. The rebuilt playbook's Sonnet re-run is recorded in `critique.md`.

## Earlier staging facts still true (2026-10-16, brand "Personal Day")

- `competitor_read` returns server dossiers (positioning, pricing tier, socials, ad counts, `last_researched_at`) and `view: "suggestions"` with Meta page checks (CONFIRMED / UNSURE).
- `ads_template_read` mode `competitor` returns a capped sample (~24 per rival) with ad id, start date, last-seen date, copy, CTA and destination; `media_list` tags `ad_library` + `competitor_ad` hold rival video ads.
- `brand_read` section `organic` returns rival top posts with views.
These are free extras; the free web pass (search, fetch, browser) is the main source.

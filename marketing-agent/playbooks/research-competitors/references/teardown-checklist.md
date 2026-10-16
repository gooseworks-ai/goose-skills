# Teardown checklist — what to capture per rival, and where it comes from

Load at steps 5–11. Every section of a competitor file carries a status: **read** (source + date), **read-by-fetch** (the host's own browser, its web-fetch tool, or a shell `curl` of a public page — no vendor key, no login), **pasted** (the human supplied the text or link), **from server research** (the dossier — say so), or **not read: <reason>** (no web access in this host, declined spend, blocked page). Never fill a section from the dossier's summary as if you had read the page, and never from memory.

## Reachability

- **Free, server:** `competitor_read` dossier (positioning, pricing tier, proof points, content themes, differentiators, audience segments with evidence, socials with followers), `ads_template_read` competitor mode and `media_list` competitor ads (Meta), `brand_read` `organic` (rivals' recent posts).
- **Paid, proxy** (the spend gate `../../../atoms/spend-gate/ATOM.md`, paths in `../../../atoms/spend-gate/proxy-endpoints.md`): full Meta reads, Google/LinkedIn/TikTok ad libraries, account posts and comments, Google results.
- **read-by-fetch:** landing pages, pricing pages, changelogs, blogs, press pages, app-store pages (shell hosts: Apple's public lookup returns rating, count, version and release notes — `../../../atoms/spend-gate/proxy-endpoints.md`), marketplace listings, Google Business profiles. G2 forbids automated collection — G2 only by the human's paste.
- **Hosted chat with MCP only:** none of the read-by-fetch items. Ask once for pasted text or links (SKILL Before you start, 5); otherwise mark "not read: no web access here".

## Sections

**Identity** — name, website, Meta page id and whether the server's check confirmed it (wrong page = every angle built on someone else's ads; an UNSURE page's ads are not read until confirmed), tier (direct / indirect / status-quo), confirmed by the human on <date>.

**Positioning** — their H1 and subhead quoted with URL and date; the segment they speak to; the one thing they want to be known for; how it differs from ours (our positioning from the brain).

**Offer architecture** (DTC) — hero SKU price and size, unit price, bundles and their discount, subscribe-and-save %, free-shipping threshold, guarantee and returns, first-order offer, popup capture offer (email/SMS, discount), loyalty. (B2B SaaS) — plan names, prices, what is gated per tier, seat vs usage pricing, free trial or freemium terms, "contact sales" threshold, annual discount. (App) — price, trial length, paywall placement, lifetime option. Each line with source and date; changes since the last snapshot flagged.

**Funnel** — for each big ad cluster: ad → page type (PDP, advertorial, listicle, quiz, comparison, demo request, app store) → capture → proof stack on the page (reviews count, press logos, expert, clinical, guarantee). What the page does that ours does not.

**Ads** — see `reading-ads-honestly.md`.

**Content** — blog topics and cadence (last 90 days), guides and lead magnets, comparison and "vs / alternatives" pages (theirs about us is especially important), newsletter, podcast/YouTube. Which pieces carry: visible engagement, rank where the light search read shows it.

**Social** — platforms, cadence, formats that overperform against the rival's own median (not raw views), recurring series, creators and ambassadors, community (Discord, Facebook group). From `organic` and the dossier first.

**Releases** — changelog, product launches, new SKUs or drops, collabs, retail entries, press and funding (B2B and venture-backed), hiring signals worth noting (a first "head of growth", a field sales team).

**Search and AI footprint (light)** — which buyer questions they get named for (from improve-search-visibility's report, or a few approved Google-results reads); whether a Google ad of theirs names our brand (an inference of brand bidding, labelled). Full audits belong to improve-search-visibility.

**Review signal** — rating and count per main surface (site widget, Amazon, G2, App Store, Google), velocity vs last snapshot (first run: "n/a — first snapshot"); complaint themes cited from the voice-of-customer bank by id.

**Our read (labelled inference)** — what they are betting on, their attack surface (weaknesses buyers name, promises they cannot back), what not to copy, confidence.

**Not read** — every section skipped, and why.

## Company-type branches

| Type | Add | Expect |
|---|---|---|
| DTC | Offer architecture in full, popup capture, subscription, Amazon/retail presence, creator ads | Meta is the main ad library |
| B2B SaaS | LinkedIn and Google ads, pricing-tier anatomy, G2 category and grid position (human-paced read), sales motion (self-serve vs demo), vs pages, integrations, case-study logos, job posts | Fewer ads; content and comparison pages carry more |
| Consumer app | Store listing (title, subtitle, screenshot story, rating and count, last update, "what's new" — say which storefront), paywall, trial and in-app purchase prices, TikTok presence and ad library | Apple Search Ads are not public — say so |
| Marketplace seller | Listing title, bullets, images, A+ content, price and coupon, rating and count, best-seller rank as a sales proxy | Deep listing work → optimize-listings (backlog) |
| Local business | Google Business profile (rating, count, categories, photos, posts, offers), map-pack presence, local Meta/Google ads, service menu and prices | Ads are often absent; reviews and listings carry |
| Services firm | Packages and rates where public, case studies and logos, Clutch, founder LinkedIn content, speaking | "No paid presence" is a finding, not a gap in the research |
| Pre-revenue | Rivals may be unknown — start from research-market's alternatives and the server's suggestions | Most angles will be "needs proof"; that is correct |

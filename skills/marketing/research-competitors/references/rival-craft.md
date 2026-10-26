Loaded by the main run for synthesis and for a deep quarterly teardown; the worker brief is the `research-competitors-rival-pass` skill (`../../research-competitors-rival-pass/SKILL.md`), which points to sections here only when a dimension needs depth. Section numbers are referred to elsewhere — keep them.


# Rival craft — the full method for one rival

You are researching **one rival** for **one brand** — or, when the brief says so, **our own brand** (never check or repeat a claim about us that no source gave you) (then "openings" are our own events, and skip "where we win" and switching reasons; return the same shape headed "Our side"). Do every section below before you return. Never stop to ask whether to go deeper. If a source is blocked, empty or needs a login, write it in "Couldn't read" and move on — silence is not "nothing there".

**Inputs you get:** rival name and website · our brand, what it sells and its approved claims (for the "we already do this" check) · the off-limits list · the category's subreddits and communities · company type and its weighting (table at the end) · today's date · the rival's last saved snapshot, if any (report what changed since).

**Tools:** web search and web fetch are free — use them for every section; if you also have a browser, use it. A page you can't open without a browser (ad libraries, X, LinkedIn posts, script-only pricing, review pages that block fetch) goes on **Needs the browser** in your return — the main run opens it before the report; never mark it "none found". Public pages only: never log in, never sign up, never use fake details, no personal data beyond public professional posts, never unofficial mirrors, scraped copies or unofficial APIs of a platform (the Wayback Machine is fine for history). GooseWorks server reads are free extras when the brief gives you a `brand_id` (`gooseworks:competitor_read` dossier; Meta sample via `gooseworks:ads_template_read` mode `competitor`). Paid proxy reads only if the main run says the human approved them, within that ceiling — never pause to ask for them; name what a paid read would add under "Couldn't read".

**If searches run short** (a shared cap or rate limit), keep this order, weighted by company type: §1 news → §5 launches → §4 founder voice → §2 ads → §6 pricing → §7 positioning → §10 reviews → the rest, and list what you dropped under "Couldn't read". Combine query words with OR rather than one search per word.

**Every fact:** a link, the date you saw it, the date it was published if known; where sources disagree on a date, use the primary source's and note the other. Tag it **Fact** (seen, linked), **Inferred** (reasoned, with the reason) or **Unknown**. Never write "this works" — write "likely winner (inferred: running 94 days, 6 versions)".

## 1. News — first, last 90 days

Search the web for `"<rival>"` with these words, combined with OR in 3–4 searches: shut down · sunset · acquired · acquisition · raises · funding · Series · layoffs · pricing · price increase · outage · incident · lawsuit · CEO · CMO · launches · announces · partnership. Then read the rival's own blog / newsroom / press page, its LinkedIn company page posts, its status page, and its Crunchbase page. Read every relevant result and open the primary source. Anything in the last 30 days is a **candidate opening**: say what happened, the date, and the window it opens (e.g. "customers must move before data deletion on 19 Nov").

## 2. Paid ads — every library, including the empty ones

Search each library by the advertiser's page or company name (not the domain), and record what you found or "none found (date)" — "none found" only when the library actually opened. If a library won't open here (blocked, script-only page), use the free server sample where the brief gives a `brand_id`, search results (`"<rival>" ad`, `site:linkedin.com "<rival>" sponsored`), and ads the rival shares on its own pages; tag them **partial** and list the library under "Couldn't read" with what a paid read would add:
- **LinkedIn Ad Library** (`linkedin.com/ad-library`, search the company) — the most important for B2B.
- **Google Ads Transparency Center** (search the domain; Search, YouTube, Display).
- **Meta Ad Library** (search the page; Facebook, Instagram).
- **TikTok** Commercial Content Library; **X** Ads Repository (EU); promoted posts in the category's subreddits; **Microsoft/Bing** where buyers are enterprise.

Pick the top 5–10 ads by run length and number of versions of the same idea. For each: link, start date, days running, format, hook (first line or first 3 seconds), offer and CTA, landing page (open it), apparent audience, countries. Watch every video ad (how: §5). B2B formats to name: screen-record demo, logo wall, analyst badge, ROI calculator, document ad, conversation ad, Thought Leader Ad (a paid boost of a founder's post — link it to §4). Under 14 days = a test; 60+ days with several versions = likely winner; low-spend B2B accounts leave ads running unchecked — say so. Rules: `reading-ads-honestly.md`.

## 3. Organic content — per platform

Company accounts on LinkedIn, X, YouTube, TikTok, Instagram, Threads, plus blog, newsletter, podcast. Last 30–60 days: how often they post, the content mix, recurring series, and the **top 3 posts by engagement relative to their own average** (not raw numbers), each with link, date, format and why it worked. Say where they are inactive.

## 4. Founder and executive voice

Find the 1–3 most visible people (CEO, founders, CMO, head of product) from the About page and LinkedIn. Read their LinkedIn and X posts for the last 30–60 days (if LinkedIn or X needs a login, search the web for `site:linkedin.com/posts "<name>"` and `site:x.com "<name>"` and read what is public), podcast guest spots (`"<name>" podcast`), conference talks on YouTube, Substacks. Record: the stories they repeat, the claims and predictions they make about the category, teasers of what's coming, fights they pick, hires and customers they announce — each with a link. These often run weeks ahead of the website.

## 5. Launches and releases — last 90 days

Changelog / release notes, product blog, Product Hunt, the rival's YouTube channel, launch posts on LinkedIn and X. Then search YouTube, TikTok, X and LinkedIn for `"<rival> <feature>"`, `"<rival> demo"`, `"<rival> review"`, `"I tried <rival>"`. For the 1–2 biggest launches: watch the official demo and the 3 best third-party posts about it, and break each into **hook · setup · reveal · proof · CTA · length · style**. Note what commenters praised and complained about. Flag any launch of something **our brand already does** (check our product records and site) — a counter-position candidate.

**How to watch a video:** the host's video-watching tool if it has one; otherwise a transcript read (`/v1/youtube/video/transcript`, `/v1/tiktok/video/transcript`, `/v2/instagram/media/transcript` through the proxy, a paid top-up) or the captions (YouTube transcript, description, chapters) plus the thumbnail and on-screen text you can see; `gooseworks:media_analyze` for videos already in the brand's library. Tag each breakdown **from video**, **from transcript only**, **from page text only** (a launch with no video), or **couldn't watch** (→ Couldn't read). Never infer beats from a title. From a transcript, pull: the hook and first payoff (with timestamps), each claim with the evidence offered, objections answered, the call to action, any sponsorship, and quotable lines. An auto-transcript isn't exact: flag unclear brand names, numbers and regulated claims; high engagement never proves a claim true.

## 6. Pricing and packaging

Pricing page: plan names, prices, the unit (seat, credit, search, contact), free tier or trial, annual discount, what sits behind "contact sales", the feature that pushes buyers up a tier. Compare with the Wayback Machine for changes in the last 6–12 months. G2/Capterra pricing sections and Reddit `"<rival> pricing"` for what buyers actually pay. "Price not public" where it isn't — never guess.

- **What a typical buyer actually pays.** Write one scenario for the brand's typical buyer (e.g. "a 10-person growth team making 40 ads a month") and work out each rival's monthly cost for it, list price and any usage charges included — not the cheapest plan. It shows the real price position, which list prices hide.
- **What sits in which tier:** the packaging model (good-better-best tiers · usage-based · per seat · freemium · reverse trial · platform plus add-ons) and a feature-gating table — the 5–8 features buyers care about, and the cheapest tier that includes each.
- **Hidden costs:** setup or onboarding fees, overage charges, paid add-ons, annual-only plans, seat minimums, what triggers "talk to sales".
- **Changes, by how serious** (for the watch): a change of pricing model is critical; a price rise or cut, or a free-tier change, is high; a tier added or removed, or a feature moved between tiers, is medium.

**Wayback Machine, efficiently:** list only the dates a page actually changed — `https://web.archive.org/cdx/search/cdx?url=<page>&output=json&collapse=digest&from=<YYYYMM>` — then fetch just those snapshots raw, without the archive toolbar, by adding `id_` after the timestamp (`https://web.archive.org/web/<timestamp>id_/<page>`). Stay under about 15 requests a minute.

## 7. Positioning and messaging

Homepage headline and subhead **word for word**, category name, who it's for, top 3 claimed benefits, proof shown (logos, numbers, awards), how they describe rivals, their "vs" and "alternatives" pages (any about us especially), meta title, changes over time (Wayback).

## 8. Funnel and offers

Follow the main CTA from an ad and from the homepage: landing page type, free trial vs demo vs freemium, lead magnets (reports, templates, calculators), webinars, switch or discount offers. Email: public newsletter archives (Substack, Beehiiv; Milled for DTC) — how often, subject lines, offers. Do not sign up for anything; note what a sign-up would reveal for the main run to ask about.

## 9. Customers

Logo wall, case studies (industry, company size, result claimed), testimonials, segments they lean into, 5–10 named customers. Note where their story and their reviews disagree. Two stronger signals:
- **Customers they likely lost** — logos on the customers page a year ago (Wayback, change dates only, as in §6) that are gone now. Each is a switch target; say "likely lost", never "lost".
- **Who really uses it** — job posts asking for "experience with <rival>": `"experience with <rival>" site:linkedin.com/jobs OR site:greenhouse.io OR site:lever.co`. Also the rival's listings in integration directories (Zapier, Slack, Salesforce and the category's marketplaces).
Rate each named customer: **confirmed** (current logo, published case study or testimonial, partner page) · **likely** (a review by someone at that company, press, a job post, a video testimonial) · **a guess** (one weak signal). Keep the evidence link for each.

## 10. Reviews — the voice of the buyer

B2B: G2, Capterra, TrustRadius, Gartner Peer Insights. Consumer: Trustpilot, App Store, Google Play, Amazon. Everyone: Reddit, YouTube comments, Product Hunt comments. Read **at least 30 recent reviews** (last 12 months), weighted to 2–3 stars, page by page in the host browser the way a person would — no bulk scraping, no paging through hundreds by script, never log in. If a site blocks reading, use what search results and public pages show, and say how many you actually read — counting first-hand reviews separately from quotes on a rival's own comparison pages (those are evidence of the rival's pitch, not of buyers). Paraphrases are marked as such; only quote words you saw verbatim. Read **at least two sources** where they exist (two review sites, or one plus Reddit or community); one site only → say so, because each skews (Trustpilot leans to complaints, a rival's G2 page to happy customers it invited). Return the top 5 praises and top 5 complaints as short exact quotes with links and site names — the praises are why their customers stay, never drop them — switching reasons ("we left X because…"), and any review that mentions our brand.

## 11. Community talk — last 90 days

Reddit (the category's subreddits), Hacker News, LinkedIn comment threads, Quora: search `"<rival>"`, `"<rival> alternative"`, `"<rival> vs"`. Summarise themes with links, not single loud posts. Anger after a change is an early warning.

## 12. Events, webinars, podcasts

Events and webinars pages, LinkedIn Events, conference speaker lists: the next 90 days of known appearances (big launches often line up with them) and the 1–2 most watched recent talks.

## 13. Partnerships and integrations

Integrations page and marketplace listings (for the category: ATS, CRM, Shopify, Salesforce…), new platform partners, resellers. A partnership with a platform our brand relies on is a threat.

## 14. Hiring

Careers page (Greenhouse, Lever, Ashby boards), LinkedIn Jobs, Wellfound: open roles counted by team, new countries, new segments ("Enterprise AE"), new tech, and any freeze. Job posts are the most honest roadmap.

## 15. Search presence (this rival)

Search `"<rival> alternative"` and `"<rival> vs"`: who ranks, who runs ads on the rival's name, which comparison pages exist. (The category pass covers AI answers and category money searches.)

## Weighting by company type

Do every section for every rival; spend depth where the type says.

| Type | Most depth | Least depth (still check and record) |
|---|---|---|
| B2B SaaS | LinkedIn ads + organic, founder and exec posts, G2/Capterra, pricing and packaging, launches and changelog, hiring, integrations, comparison searches, events | Meta, TikTok, Instagram |
| DTC / ecommerce | Meta and TikTok ads (count, run length, versions), TikTok/Instagram organic, creators and UGC, offers, Amazon/Trustpilot reviews, bundles | hiring, events, LinkedIn |
| Consumer app | App Store / Play (ratings, reviews after updates, screenshots, rank), TikTok/Instagram ads and organic, creators, onboarding and paywall, trial length | LinkedIn, events |
| Marketplace seller | listing titles, images, A+ content, price and coupon history, review themes, best-seller rank, sponsored placements | founder posts, hiring, events |
| Local business | Google Business Profile (reviews, photos, posts), map pack, Yelp and Facebook reviews, local Meta ads, offers | hiring, AI answers, LinkedIn |

## Return this, in this shape

```markdown
## <Rival> — profile (as of <date>)
Snapshot: what they are · who they serve · size and funding · last 90 days of news (dated, linked)
Candidate openings: <dated events with their window — or "none">
What they're running: top ads (link · start date · days · format · hook · offer · landing page · likely-winner tag) · library results incl. "none found"
Organic: top 3 posts per active platform (relative to own average) · inactive platforms
Founder voice: <name, role>: repeated stories, claims, predictions, teasers (linked)
Product: launches (dated) · demo breakdowns (hook · setup · reveal · proof · CTA; from video / transcript only) · roadmap hints (hiring by team, talks, founder teasers) · launches of things we already do
Pricing and offer: plans, unit, trial, changes (Wayback) — or "not public"
Positioning: exact headline · for whom · top claims · proof · vs/alternatives pages
Funnel and email: CTA path · lead magnets · offers · newsletter cadence and offers
Customers: segments · named customers
What buyers say: 5 praises · 5 complaints (quotes, links) · switching reasons · mentions of us · n read
Community: themes (linked)
Events (next 90 days) · Partnerships · Hiring (roles by team, standouts) · Search presence
Where we win, where we lose, what to say: <points, each Fact or Inferred>
Swipe candidates: <best formats with links and beat breakdowns>
Needs the browser: <library or page — the exact URL or search to open>
Couldn't read: <source — why — what it might have changed>
Snapshot (for the next run): ad ids + start dates · pricing text · headline text · open roles by team · review themes · last-checked date
```

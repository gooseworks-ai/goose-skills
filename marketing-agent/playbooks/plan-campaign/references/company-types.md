# What changes by company type — and what to ask

Load at step 1, after the look-first pass (`intake.md`). The lists below are **what the plan may need** — look each up first; ask the marketer only the one or two that would change the plan's shape, in plain words; default the rest as labelled assumptions ("a typical 3–5% of free users become paid — replace with yours"). Never ask technical items (tracking, events, attribution). The process is the same for every type; the goal chain, the binding constraints, the live channels and the questions differ.

## Mapping the server's `brandType`

`brandType` is a hint, not the answer — confirm from the products and where they are sold:
- ecommerce, product, beauty, fashion, fitness (products), health (products), food, beverage, home, pets → **DTC / e-commerce** (or **DTC + retail** if stocked in stores, or **marketplace seller** if mostly Amazon/Etsy).
- saas, ai → **B2B SaaS** — then decide **self-serve** (signup, card, low price per seat) or **sales-led** (demo, contract) — or a **consumer app** if sold to individuals in app stores.
- app, gaming, media → **consumer app** (or creator/media).
- restaurant, hospitality, fitness (studios), health (clinics), realestate, automotive (dealers) → **local / multi-location**.
- agency, service, finance (advisers), education (courses) → **services** (education with an app or course store may be consumer).
- nonprofit, travel → use the closest of the above and say which.

## Needed for every type (look first; ask only what changes the plan)

**Ask (plain words):** the product or plan, the offer, the goal, the dates, the budget. **Look up, don't ask:** baseline for the window, past results per channel, creative capacity (onboarding), platforms (onboarding, connected accounts), list size (email-lifecycle's program), the promo calendar (email-lifecycle's calendar), tracking state (the weekly read — never asked). **Ask only if it changes the plan:** how many past or free users they could email; founder hours for organic, creators and outreach (else assume ~2 h/week and say so); channels committed or off-limits.

## DTC / e-commerce
- **Needed (look first):** AOV; contribution margin or COGS + shipping per order (per featured SKU if margins differ); repeat rate / orders per customer in 90–180 days (replenishable products change the allowable CAC); stock and inbound on featured SKUs; free-shipping threshold; current offer, if any.
- **Goal chain:** new customers (and first-order contribution) → sessions → CVR → AOV; repeat contribution only from shown repeat behaviour.
- **Binding constraints:** stock / days of cover; margin per SKU; review count and social proof before scaling paid; feed health for Shopping; promo collisions.
- **Live channels:** Meta, Google Shopping + Search, TikTok, Pinterest, email/SMS, creators/UGC, affiliates, marketplaces where stocked.
- **DTC + retail (e.g. own site + Ulta/Target):** ask which retailers and whether sell-through data is shared; put retailer sell-through in the goal chain (or say it is unmeasured); decide the ad destination per leg ("shop now" on site vs "find it at <retailer>" — retail legs earn wholesale margin, so give them their own allowable cost or label them halo / unmeasured); read the retailer's marketing calendar and any co-op/retail-media offer; the measurement plan names the halo.

## B2B SaaS — self-serve
- **Needed (look first):** price per seat and seats per account (→ ARPA); signup → activated → trial → paid rates; trial length; monthly churn; gross margin.
- **Goal chain:** signups → activated (the aha event) → paid accounts; cost per activated signup and per paying account. Allowable CAC = ARPA × gross margin × payback months accepted (often ≤ 12, rule of thumb).
- **Live channels:** email and in-app messages to free and lapsed users, **founder one-to-one outreach** to the most active lapsed accounts (win-back), Google Search (problem, competitor and "alternatives" terms), content/SEO and comparison pages, review sites, Product Hunt and directories, communities (Reddit, Slack groups), founder LinkedIn/X, integrations/partners, LinkedIn ads only if ARPA carries the CPL.
- **The business result:** signups → activated → paid accounts; every leg (posts included) carries a tagged link so its signups can be counted.
- **The buyer's season:** the season of the people the product serves (e.g. a tool for ecommerce marketers is busiest for its buyers in the November sales crunch) — plan around it.

## B2B SaaS — sales-led
- **Needed (look first):** ACV; sales cycle length; lead → qualified (MQL/SQL) → opportunity → won rates; sales capacity to follow up; whether the CRM records lead source.
- **Goal chain:** pipeline, not revenue, when the cycle is longer than the campaign — a 60–120-day cycle means "customers by March" is a renegotiation to qualified pipeline and meetings. Target cost per qualified lead or per opportunity.
- **Live channels:** LinkedIn, Google Search intent terms, webinars/events, outbound (human-executed), review sites, partners, newsletter/podcast sponsorships. Enablement assets (one-pager, battlecard, demo script) go on the asset list for any launch.

## Consumer app
- **Needed (look first):** live in which stores; ratings count and score; the activation event; D1/D7/D30 retention; trial → paid, price; analytics or attribution tool (MMP, RevenueCat, Firebase); iOS tracking opt-in rate if known; waitlist size and how it was built.
- **Goal chain:** install → activation → D7/D30 retained → trial → paid. Cost per retained user or per payer, never cost per install.
- **Pre-revenue:** no allowable CAC exists. The marketer sets a provisional cap per activated user (labelled provisional), and the brief says plainly that unit economics cannot yet justify paid; **zero paid is the default** unless the marketer chooses a capped learning budget. The goal is usually what the next milestone (e.g. a fundraise) needs: activated or retained users, not installs.
- **Binding constraints:** measurement (SKAN/AdAttributionKit delays and aggregation; no MMP = installs optimised blind); store-page readiness (screenshots, ratings) before paid; event optimisation needs volume.
- **Live channels:** waitlist email, Apple Search Ads, Google App campaigns, Meta and TikTok app campaigns (written instructions — no install levers in GooseWorks), creators, organic short video, referral loops, Product Hunt.

## Marketplace seller (Amazon and similar)
- **Needed (look first):** ACoS/TACoS today; organic rank on key terms; reviews and rating; Buy Box share; fulfilment-centre stock; deals calendar.
- **Goal chain:** sales and organic rank, judged in TACoS (ad spend ÷ total sales).
- **Live channels:** Sponsored Products/Brands/Display (human-executed), off-Amazon traffic to the listing as a test. Two-sided marketplaces: plan to the side that constrains liquidity first.

## Local business / multi-location
- **Needed (look first):** open capacity per week (slots, tables, appointments); average first-visit value and repeat visits; service radius; booking/call tracking; Google Business Profile state and reviews.
- **Goal chain:** calls, bookings, direction requests, footfall → booked revenue; offline attribution (codes, "how did you hear", call tracking).
- **Binding constraints:** **capacity**; geo radius (GooseWorks' Meta launches target whole countries only — radius campaigns are written instructions); $10–50/day never exits learning on purchases — optimise for leads or calls.
- **Live channels:** Google Business Profile, Local Services Ads, Search "near me", geo-radius Meta, reviews, referrals, local partners and events, flyers/OOH, WhatsApp.

## Services (agency, consultant, professional firm)
- **Needed (look first):** average engagement value; close rate; delivery capacity; where past clients came from.
- **Goal chain:** qualified conversations → proposals → signed work, read monthly (tiny numbers).
- **Live channels:** referrals and partners, speaking and podcasts, founder LinkedIn and thought leadership, case studies, outbound; paid is often a valid "No" or a small retargeting test.

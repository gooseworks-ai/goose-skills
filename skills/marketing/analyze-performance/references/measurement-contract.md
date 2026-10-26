# The measurement contract, the referee and the weekly inputs

Load in Before you start. Arguments about definitions mid-quarter kill trust: agree them once, write them down, change them only through the amend path below.

## 1. The referee — by company type

The referee is the business number the platforms are judged against. It is not always "store revenue".

| Type | Referee (truth) | Where it comes from | Ranking metric for creative and calls |
|---|---|---|---|
| **DTC** | Net revenue and **new-customer** orders/revenue, own site; retail/marketplace sell-through separately | Store (Shopify etc.) — connector, export or paste; retailer reports | Purchase CPA within each platform (claimed, verdicts capped at likely); confirmed only when store new-customer orders moved with it |
| **DTC + retail** | Same, plus sell-through by retailer (or "unmeasured — halo") | Store + retailer portal | Same; Meta cuts capped at likely while retail is unmeasured |
| **B2B SaaS (sales-led) / services** | Leads → qualified (SQL) → opportunities → won, **by original source**, plus the self-reported "how did you hear" field | CRM (HubSpot etc.) | Cost per qualified lead / per opportunity; CPL is a leading signal only |
| **Self-serve SaaS** | New paid accounts and activated sign-ups (the product's "aha" event), **by source**; trial → paid when there is a trial | Billing (Stripe etc.) for paid accounts; product analytics for activation; sign-up source from tagged links or a "how did you hear" field | Cost per activated sign-up and per new paid account; cost per sign-up is a leading signal only |
| **Consumer app** | First-time downloads by source (App Store Connect / Play Console), activation and D7 retention (product analytics), trials/payers (RevenueCat etc. when live) | Store consoles + analytics | Cost per activated / retained user; CPI is a cost line, never a winner |
| **Marketplace seller (Amazon etc.)** | Total sales and units by ASIN, ad-attributed sales, TACoS (ad spend ÷ total sales), organic rank on key terms | Seller Central Business Report + Amazon Ads campaign / search-term reports | TACoS and total sales lift; ACoS is the platform's view only |
| **Local / services with bookings** | Bookings, calls, visits, code redemptions | Booking / POS / call tracking export | Cost per booking |

Claims-only mode fires when **that type's** referee is missing — and its notice names that type's export.

**Measurement absent by design** (e.g. an app with no attribution or analytics tool, a lead form that doesn't record source): this is a plumbing flag, not a footnote — the report leads with it and gives the setup steps (what to install or turn on, by whom, why it matters for the next spend decision).

## 2. The contract (written once, stored, re-read every week)

Draft it from the brain, the briefs and the onboarding profile with sensible defaults pre-filled; ask the marketer only what can't be defaulted (usually: the number and target, margin %, timezone). Save it at `reports/performance/definitions.md` in the brand's coworker workspace and register it as a brand document (atom the `save-to-brain` skill (`../../save-to-brain/SKILL.md`) (`versioned: supersede`)).

```markdown
# Measurement contract — <brand> · agreed <date> with <name> · amended <date: what>
Company type: <type> → referee: <…>
The number marketing owns: <…> · target <n> by <date> (campaign brief)
Reporting week: Mon–Sun, <store timezone>.
Revenue (DTC): net = gross − refunds − discounts, excluding tax and shipping. New customer = first order ever, by email.
Excluded from new revenue: test, staff and wholesale orders; subscription renewals.
Lead stages (B2B): lead … → SQL … → opportunity … → won … ; source field: <CRM field>.
Activation (apps/SaaS): <event>.
Margin: contribution margin % before ads = <x%> (marketer, <date>) → break-even MER = 1 ÷ <x>.
Economics: from the campaign brief's Economics section (allowable CAC, break-even MER) — the brief wins if they differ.
Attribution: platforms' defaults unless the marketer knows otherwise (Meta 7-day click / 1-day view) — these are claims, never truth.
Channels we run (the roster — see §3).
Story we run the business on when platform and blended disagree: <blended | platform> (picked <date>).
Weekly inputs and who sends them (see §4).
```

**Amend path:** when the business changes (a new retailer, RevenueCat goes live, a new channel), propose the amendment in the decisions block, and on the marketer's yes update the file with "amended <date>: <what>".

## 3. The channel roster

Seed it from: onboarding `platforms`, `brand_read` accounts, every live campaign brief's channel decisions (Run/Test rows), run-paid-campaigns' `state.md`, email-lifecycle's `lifecycle/program.md`, run-organic-social's calendar, work-with-creators' roster (`creators/roster.csv`), and anything the marketer mentions. Confirm it once with the contract. For each channel record: source of numbers · truth or claim · who provides it.

The weekly channel table iterates over the roster. A rostered channel with no numbers this week is **"used — not measured (send <X>)"**, never "not used". Channels not on the roster go in one line ("Not used: …"); channels whose playbook half hasn't shipped go in one line ("Future rows: creator codes, outreach, WhatsApp").

## 4. The weekly inputs — one message, once

**The minimum useful read** (ask for this first; everything else is optional this week): this week's and last week's referee totals (DTC: store sales by new vs returning — one Shopify report; B2B: new SQLs and opportunities by source; self-serve SaaS: new paid accounts and activated sign-ups by source; apps: downloads and activations by source) plus **one ad export per paid platform** (spend and results by ad). That alone gives MER / new-customer cost, the marginal read and a creative ranking. Say plainly which sections the missing inputs leave thin.

Ask once, at the start, for everything the tools can't give. Accept connectors the marketer already has connected to this agent (read-only: never their write tools), export files, dashboard screenshots or pasted numbers. A connector that gives an input replaces asking for that export. No mid-run asks: anything not provided is marked "not checked this week".

**History, once:** on the first run ask for as many weeks of referee totals as the marketer has, up to ~13 months, in one report (kept in `inputs/` so the 4-week and same-week-last-year columns stay real every week). Less is fine: the comparisons say what span they rest on, and a just-launched brand is compared with its plan only. A just-launched brand has no baseline: compare against the plan only, and say so. **Later runs:** this week plus last week restated (late conversions and refunds).

Export cheat sheet (name the exact one):
- **Shopify:** Analytics › Reports › "Sales by customer type" (new vs returning), weekly; orders export with UTM/landing-site for angle joins; sales by product (for AOV and SKU mix against per-SKU margins).
- **Meta Ads Manager:** ad-level export (last 14 days weekly; last 5 weeks on a first run), columns: spend, results, cost per result, purchases + purchase value, CTR, frequency, CPM; with attribution comparison columns (1-day vs 7-day click) when available.
- **Google Ads:** campaign report (cost, conversions, conv. value) + search terms report (Shopping/PMax show limited terms).
- **TikTok / LinkedIn:** campaign-level export with spend, results, cost per result.
- **Klaviyo (or similar):** flow performance and campaign performance CSVs for the week.
- **HubSpot (or CRM):** contacts and deals created this week by original source, with lifecycle stage and the "how did you hear" field.
- **Billing (Stripe or similar) + product analytics:** new paid subscriptions and cancellations this week; sign-ups and activated sign-ups by source (from tagged links).
- **App Store Connect / Play Console:** acquisition by source (first-time downloads); product analytics: activation and D7 by install week.
- **Retailer portals:** weekly sell-through by SKU, if shared.
- **Amazon:** Seller Central › Reports › Business Reports (sales and traffic by ASIN, weekly); Amazon Ads › Reports (campaign + search term, last 7 days).

**Big exports in a hosted chat** (no shell): ask for the platform's summary view or totals by week / campaign / ad instead of row-level files. If a large file or paste arrives anyway **and there is no code tool**, don't total it by eye — beyond a few hundred rows that produces plausible but wrong MER and new-customer numbers. Ask for the summary report instead (e.g. Shopify "Sales by customer type", a couple of rows per week) and, until it arrives, mark the referee "not measured this week" and run claims-only or partial. Never derive new vs returning customers from an orders export (it has no such flag). With a shell or code tool, parse the file and total it in code. Either way, keep only the totals in the input summary and never echo raw rows (they can carry customer data).

Save what was provided as `reports/performance/inputs/<YYYY-MM-DD>.md` (a summary: what arrived, totals, ad-level rows needed for joins) so run-paid-campaigns reuses it instead of asking again.

## 5. Claims-only mode

If the type's referee is missing, the report still runs, but every outcome number is labelled **claimed (platform)**, there is no MER / CAC / overclaim ratio, no call above **first look**, and the first line says: "<Referee> not provided — these are the platforms' claims, which overcount. Send <the export> and I'll restate." A scheduled (automated) run cannot collect exports, so it will run in this mode unless a connector exists — say so before anyone schedules it.

## 6. Hygiene and maturity

- Strip test, staff and wholesale orders and subscription renewals from new revenue; net out refunds (restate last week when they land late — apparel returns commonly 20–30%); align timezones and currencies.
- The **exports are the source for the week's numbers**; `meta_read` (trailing windows, Goose ads only) identifies Goose ads, joins their angles and cross-checks — it is never added on top of an export that already contains those ads (de-duplicate by ad id).
- Maturity: compare this week as first reported with last week **as first reported** (equal lag), then show last week restated separately. Never mix a matured week with an immature one.

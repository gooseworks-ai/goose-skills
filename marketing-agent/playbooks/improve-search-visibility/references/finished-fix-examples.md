# Finished fixes — the quality bar

Load at step 4 (atom fix-writer); the finished versions go in the report's last section. Brands are fictional; in a live run every factual value is a "Claims you may use" fact, a product record field, a plain product fact from the live page (name, price, size, listed ingredients, how to use), or comes through the claims gate's scoped sign-off — nothing else. Every fix carries: the gap it closes (question ids and the observed result), the exact text or code, where it goes, who ships it and minutes to apply, the claims check, time to show, risk and undo, and how to verify once live.

## (a) Category page rewrite — Halden `/collections/moisturizers`
Gap: Q1, Q3 lost on every surface; title "Shop Moisturizers – Halden", H1 "Hydration Heroes"; no text above the product grid.
In Shopify (Products → Collections → Moisturizers):
- **Title** (renders as the H1): `Moisturizers for Sensitive Skin` — renaming also changes menus and breadcrumbs that use the collection name; check them.
- **Search engine listing → Page title** (55 chars): `Moisturizer for Sensitive Skin, Fragrance-Free | Halden`
- **Search engine listing → Meta description**: `Fragrance-free ceramide moisturizer for sensitive, reactive skin. No essential oils. Free returns within 60 days.`
- **Description** (shows above the product grid in most themes) — the opening paragraph:
> Halden makes two fragrance-free moisturizers for sensitive and reactive skin. **Barrier Cream** ($34, 50 ml) is a rich cream with 3% ceramides and 5% panthenol for dry, tight or stinging skin. **Gel Cream** ($30, 50 ml) is a lighter, oil-free option for combination skin. Neither contains fragrance, essential oils or drying alcohol.

Why: the first sentence names the entity, category and audience; numbers an engine can quote without context; differences stated as checkable facts, not adjectives; H1 matches the query; head term first in the title. Claims: "3% ceramides", "5% panthenol", prices, sizes → product records; "free returns within 60 days" → the approved claim "Free returns within 60 days of delivery" (shown in its exact wording). Who: the store admin, 15 minutes. Time to show: days after recrawl. Risk: none; undo by restoring the old text. Verify: view-source shows the paragraph without JavaScript.

## (b) Visible Q&A block on a product page (+ markup)
Liftable form: the question in the buyer's words as an `<h3>`; the answer's first sentence stands alone and repeats the product name (never starts with "It"); 40–80 words; numbers; visible HTML, not an accordion loaded by script.
> **Which Halden moisturizer is best for sensitive skin?**
> Halden Barrier Cream suits dry, sensitive or stinging skin: it is fragrance-free, essential-oil-free and uses 3% ceramides with 5% panthenol. For oily or combination sensitive skin, Halden Gel Cream is lighter and oil-free. Both cost under $35 for 50 ml.
>
> **Can I return Halden Barrier Cream if it doesn't suit my skin?**
> Yes. Halden accepts returns of opened products within 60 days of delivery for a full refund, and US return shipping is free.

Product markup. **First read the theme's existing JSON-LD** (most Shopify themes already output Product): give the change as an edit to that block, never a second hard-coded Product block. On Shopify that is a Liquid edit in the theme file that outputs it (e.g. `sections/main-product.liquid` or a `json-ld` snippet), with live values — `{{ product.selected_or_first_available_variant.price | money_without_currency }}`, `{{ shop.currency }}`, `{{ product.url }}` — so price changes and variants stay right. On Webflow: Page settings → Custom code, with CMS fields bound. The static block below shows the target shape only (keep values identical to the visible page; `aggregateRating` only when real reviews are shown on the page; a real GTIN or none):
```json
<script type="application/ld+json">
{"@context":"https://schema.org","@type":"Product","@id":"https://halden.com/products/barrier-cream#product",
 "name":"Halden Barrier Cream","brand":{"@type":"Brand","name":"Halden"},
 "description":"Fragrance-free ceramide moisturizer for sensitive, reactive skin. 3% ceramides, 5% panthenol, 50 ml.",
 "image":"https://halden.com/img/barrier-cream-front.jpg","sku":"HLD-BC-50",
 "offers":{"@type":"Offer","price":"34.00","priceCurrency":"USD","availability":"https://schema.org/InStock",
  "url":"https://halden.com/products/barrier-cream",
  "hasMerchantReturnPolicy":{"@type":"MerchantReturnPolicy","applicableCountry":"US",
   "returnPolicyCategory":"https://schema.org/MerchantReturnFiniteReturnWindow","merchantReturnDays":60,
   "returnFees":"https://schema.org/FreeReturn"}}}
</script>
```
Say plainly: Google no longer shows FAQ rich results (May 2026); the visible Q&A is the fix; FAQPage markup is optional. Never sell markup as a way to get cited. Health-adjacent wording ("safe for eczema") only from an approved claim, with "not a treatment" language where relevant.

## (c) Organization markup for entity building — Shiftwise (home and About page only)
```json
<script type="application/ld+json">
{"@context":"https://schema.org","@type":"Organization","@id":"https://www.shiftwise.com/#organization",
 "name":"Shiftwise","legalName":"Shiftwise Labs, Inc.","url":"https://www.shiftwise.com/",
 "logo":"https://www.shiftwise.com/assets/shiftwise-logo-512.png",
 "description":"Shiftwise is staff scheduling and time-tracking software for independent restaurants and groups of up to 50 locations.",
 "foundingDate":"2021-03","founder":[{"@type":"Person","name":"Maya Ortiz"}],
 "address":{"@type":"PostalAddress","addressLocality":"Denver","addressRegion":"CO","addressCountry":"US"},
 "sameAs":["https://www.linkedin.com/company/shiftwise","https://www.crunchbase.com/organization/shiftwise",
  "https://www.g2.com/products/shiftwise","https://www.youtube.com/@shiftwise"]}
</script>
```
`description` is the canonical one-liner, word for word, matching every profile in (d). `sameAs` lists only profiles that exist, resolve and describe the company.

## (d) Profile corrections as field values — Shiftwise
Observed: Crunchbase says "AI-powered workforce platform", founded 2019, HQ Austin; brand question Q11 repeats that phrase in 3 of 3 ChatGPT runs and cites the Crunchbase page. G2 lists only "Workforce Management".
| Surface (how to edit) | Field | Change to |
|---|---|---|
| Crunchbase (claim the profile → Edit) | Short description | Staff scheduling and time-tracking software for independent restaurants. |
| | Founded / HQ | March 2021 / Denver, Colorado, United States |
| | Website | https://www.shiftwise.com |
| G2 (vendor portal) | Product description | the canonical one-liner, then: scheduling, shift swaps, time clock, labor forecasting, Toast and Square integrations |
| | Categories | primary Employee Scheduling; add Restaurant Management, Time Tracking |
| | Pricing | [from the live pricing page — never typed from memory] |
| LinkedIn page | Tagline / Founded | canonical one-liner / 2021 |
Wikidata only with ≥ 2 independent published sources; otherwise skip and say why. Never draft a Wikipedia article.

## (e) App Store listing rewrite — see `app-store-listing.md` (Driftly example).

## (f) robots.txt line (a proposal, with risk)
Observed: `User-agent: *` allowed, but `User-agent: OAI-SearchBot / Disallow: /` present (added by a plugin); ChatGPT cites only third-party pages for the brand.
Change: remove the two OAI-SearchBot lines (keep any GPTBot block if the brand chose to refuse training). Risk: none for Google; the site becomes eligible for ChatGPT search citations within about a day. Undo: restore the lines. Requires the human's explicit yes (a policy setting).

## (g) Retiring old pages — Halden's discontinued "Classic" range
Observed: `/collections/classic` and three `/products/classic-*` pages still indexed; they say "made in Switzerland" (no longer true) and two live Meta ads still send clicks there.
- **Default: 301 redirect** each page to its nearest current page (`/products/classic-cream` → `/products/barrier-cream`; the collection → `/collections/moisturizers`). In Shopify: Online Store → Navigation → URL Redirects. Then update internal links and the sitemap so nothing links to the old URLs.
- **Ads first:** list the live ads, emails and profiles pointing at the old URLs; the redirect keeps them working, and the owner of the ads repoints them at the new page. Never leave an old page live "for ads" with claims that are no longer true.
- **noindex** only for a page with no equivalent (e.g. a one-off event page someone still needs), and only after its wrong claims are removed.
Who: the store admin, 20 minutes. Risk: a redirect to an unrelated page reads as a soft 404 — always the matching page. Undo: delete the redirect. Verify: each old URL returns 301 to the new one; the ads land on the new page.

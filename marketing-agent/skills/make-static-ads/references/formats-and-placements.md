# Formats and placements — archetypes, company types, specs

Specs below are conventions as of 2026; platforms change them — when a number decides whether an ad works, say "check the live ads guide". Never state performance numbers (CTR, CPA, ROAS) as facts.

## 1. Static ad archetypes

A set rotates through archetypes, because format often matters more than polish and feeds punish ten ads with one look — Meta's ad retrieval also groups near-identical images, so visual variety is a delivery reason, not only a test reason. Carousels: make each card here as a single image and let the human assemble the carousel in the ads manager. No archetype above ~40% of a set. "Native" archetypes should look native — the review rubric judges each archetype by its own standard.

| Archetype | Works for | Needs | `ads_template_read` static_library query hint |
|---|---|---|---|
| Product hero | Product-aware, retargeting, clear category | Real product imagery (the brand's own photos, or ones made with goose-product-photos) | "clean product hero on brand colour" |
| Benefit stack / listicle ("3 reasons…") | Solution-aware; complex products | 3 traceable benefits | "benefit list with product" |
| Review / testimonial card | Product-aware; risk reduction | A real review, verbatim, with source | "customer review quote card" |
| Us vs them / old way vs new | Solution-aware; trade-off angles | Contrast with the old way (a habit, a routine), not with other products — "most X are greasy" is a comparative and needs a comparative claim the brain marks `confirmed`, as does any named rival | "two-column comparison" |
| Before/after | Only where the category and platform allow it | Real, typical, same-conditions imagery; human OK | — (gated) |
| UGC-style text over photo | Cold prospecting on Meta/TikTok | A native-looking photo; hook in customer words | "UGC handheld photo with text overlay" |
| Notes-app / tweet / text-message native | Cold; problem-aware | The brand's own voice — never a fake customer DM | "notes app screenshot", "tweet screenshot" |
| Founder note | Trust, story, B2B services | The founder's real words from the brain | "handwritten note" |
| Offer / promo | Most-aware, retargeting, sales moments | A live offer with terms and end date | "promo offer banner" |
| Stat / proof card | B2B; claims-led | A number the brain marks `confirmed` or `found` on the brand's own site or kit, with its qualifier | "big number stat card" |
| Press quote / "as seen in" | Credibility | A real press quote about this product from the brain, the outlet's exact words, attributed | "press quote" |
| Problem / agitate | Problem-aware | The pain in customer words; policy-safe phrasing | "bold problem statement" |
| Flat lay / unboxing | Gifting, kits, bundles | Exactly the real contents | "flat lay" |
| Meme / native post | Cold, younger audiences, playful brands | Brand voice permits humour | "meme format" |
| Feature callout / annotated product | Considered purchases, gadgets, SaaS | Real features, real UI | "annotated product callouts" |

If no template fits an archetype, look for more (Meta, the library) before using the nearest, and say so in the hand-off.

## 2. By company type

**DTC (beauty, apparel, food, home).** Product imagery is the anchor; the brand's kept product photos first (its own, or made with goose-product-photos). Offers and the promo calendar drive volume (BFCM, Mother's Day, Diwali, launches). Stock and price must be current.

**B2B SaaS.** There is no product to photograph: "product visible" becomes "the product or the proof is visible". Archetypes: POV / contrarian text ad, gated-asset cover (guide, webinar, demo), stat card, logo wall, and UI screenshot with callouts — the engine **redraws** a screenshot passed as a reference image, so a UI ad ships only if the render matches the real screenshot letter by letter (otherwise it shows fabricated product UI; drop it); never invent UI. Integration names may appear as plain words when true ("works with Slack"), never their logos without permission; stat card (a customer result the brain marks `confirmed`, the customer named only if permission is recorded), logo wall (only logos with permission), contrarian/POV text ad, gated-asset cover (guide, webinar, demo — the "offer"). Platforms: LinkedIn single image (1:1 or 1.91:1), document/carousel ads, Meta. CTA: Learn more / Sign up / Download / Request demo / lead-gen form. Copy is read more but skimmed the same way.

**Consumer app.** Device-frame screenshots of the real app; store badges only per Apple/Google badge rules; a rating claim only if real and current; "Download"/"Install" CTA; no UI or features the app does not have.

**Local business / multi-location.** The place, the area, the hours and a real local offer on the asset; the brand's real location photos (never a generated "your clinic" or "your staff"); one version per location when there are several; destination = booking page, call or directions. Clinics fall under the health rules.

**Services (agency, consultant, firm).** Founder/expert face (real photo, with consent), case-result stat (brain `confirmed`, client permission), POV text. Testimonial rules are strict for legal, financial and medical services in many markets — flag.

**Marketplace sellers (Amazon, Flipkart, Etsy).** Retail-media creative has its own specs and stricter claims (no "best seller" or "#1" without the marketplace's badge). Not covered by this playbook yet — say so and stop for that destination, rather than produce off-spec creative.

**International.** Language, currency, local price and local claim rules per market. A translated ad is a new ad for the claims check.

## 3. Placements, ratios, safe zones

| Platform / placement | Ratio | Notes |
|---|---|---|
| Meta feed (FB/IG) | 4:5 preferred, 1:1 OK | Min 1080 px short side |
| Meta Stories / Reels | 9:16 | Keep text and product out of the top ~14% and bottom ~20% (Stories) / ~35% plus the right rail (Reels). Re-lay out for 9:16 — never just centre-crop a 4:5 |
| TikTok image ads | 9:16 | Right rail and bottom caption zone are covered |
| LinkedIn single image | 1:1, 1.91:1 (4:5 also on mobile) | 1.91:1 is not a render ratio — use 16:9 and flag |
| Google Demand Gen / Display | 1.91:1, 1:1, 4:5 | Google's image rules: no text/logo overlay over ~20% of the image, no gimmicky caps or symbols |
| Pinterest | 2:3 | Not a render ratio — use 3:4 and flag |
| Email header (graphic request) | ~600–1200 px wide, roughly 2:1 or 3:1 | Not a render ratio — use 16:9 and flag (the email tool crops or scales); mobile-legible; check dark mode |
| Blog / OG image | 1200×630 (~1.91:1) | Use 16:9 and flag |

**Render ratios** (`gooseworks:ads_render`): `1:1`, `4:5`, `9:16`, `16:9`, `3:4`. Each ratio other than the template's own gets the composer's CANVAS ADAPTATION block, so it is its own base prompt and its own call (`composer.md` §10–11) — one dry run per ad and ratio. For a Meta-only set ask whether 1:1 is needed. Extra placements on an approved render (LinkedIn or Google landscape, a 9:16 added later): a new composed base prompt for that ratio and a quoted `ads_render` call, judged like any render (the `make-static-ads-render-review` skill (`../../make-static-ads-render-review/SKILL.md`) step 7). `resize` and `precision_edit` are not used until their own dry run returns credits.

## 4. Copy limits (visible before truncation, approximate)

| Platform | Primary / intro text | Headline | Description |
|---|---|---|---|
| Meta | ~125 characters | ~27–40 | ~25–30 (often hidden) |
| LinkedIn | ~150 | ~70 | — |
| Google Demand Gen | — | 40 | 90 |
| TikTok | ~100 | — | — |

On-image text: a hook of six to eight words, at most one support line; body text tall enough to read at 375 px wide; qualifiers legible.

Meta flexible ads take up to ~10 media and ~5 primary texts/headlines per ad, so a set can be handed over as one flexible ad per angle — mention it to run-paid-campaigns as an option; the structure is theirs to choose.

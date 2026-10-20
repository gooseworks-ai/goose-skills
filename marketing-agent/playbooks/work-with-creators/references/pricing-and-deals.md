# Pricing and deal structure

Load at step 5. Every dollar figure here is the human's deal money in their own currency — never credits, never a GooseWorks price. No rate database exists on the server. So every price is a **range with its math shown**, built from public numbers and dated assumptions, and cross-checked against any real rate evidence. Never present a single number as "the rate".

## 1. Output per creator

**Floor / target** (what the market will likely ask), the **walk-away ceiling** (what the goal can justify — from section 6), the usage-rights add-on, the deal structure, and one line of math. When the target is above the ceiling, the paid deal fails and the recommendation changes. Example (fictional numbers):

> "Market: floor $275, target $500 for 1 TikTok video (median organic views 21k × $10–25 CPM = $210–525, × 1.3 beauty premium for proven sponsored performance ≈ $275–680). Paid usage (Spark Ads, 30 days) +$125–250. Walk-away, **organic first order**: 21k × 0.3% action × 4% CVR × $38 AOV (brand number) × 68% margin (brand number) ≈ **$65** — organic payback never justifies the fee. Walk-away, **rights-amplified**: running the video as a Spark ad for 30 days at $1,000 media (assumption) and an expected $22 CPA on this asset (assumption; the brand's current CPA is $30, its target CAC $30 — brand numbers) → ~45 conversions; ceiling = ($30 − $22) × 45 ≈ **$360 all-in** for asset + usage. Spark runs on the creator's live post, so the deal buys both: walk-away ≈ $65 + $360 ≈ **$425 all-in**. Market target $500 + usage fails; the floor $275 + 30-day usage ~$70–140 = $345–415 fits under it. (The floor sits below the micro flat band because the CPM math runs on a 21k median at a 34% view rate — price on views, not followers.) **Recommend: offer the floor with 30-day Spark usage and walk away above ~$425 all-in, or hybrid ($250–350 + 15% commission); gift + affiliate if the human only wants organic.**" (Fictional numbers.)

## 2. Benchmark CPMs (approximate US 2025–26; per 1,000 median organic views)

| Placement | CPM band |
|---|---|
| TikTok video | $10–25 |
| Instagram Reel | $15–35 |
| YouTube integration (60–90s) | $20–50 on 30-day views; a dedicated video ~2–3× an integration |
| X post | $5–15 |
| LinkedIn post | CPM-equivalent ~$30–100+; flat fees ~$500–3k for 5–30k followers, ~$2–10k for top B2B voices |
| Newsletter (per 1k subscribers per send) | ~$20–50 consumer; ~$50–150 niche B2B |
| Podcast host-read mid-roll | ~$18–30; B2B higher |

Flat-rate sanity check for one IG/TikTok post: nano ~$50–500, micro ~$500–5k, mid ~$5–15k, macro ~$15–35k, mega $35k+. If the CPM math lands outside the tier band, say why.

## 3. Modifiers (approximate)

| Modifier | Effect |
|---|---|
| Organic repost by the brand, 30 days | included, or +10–20% |
| Paid usage / whitelisting / Spark Ads / partnership-ad access | +25–50% per 30 days, or ~+100% for 3–6 months |
| Perpetual usage | 2–3× |
| Category exclusivity | +10–30% per month |
| Raw footage | +15–30% |
| Rush (under ~7 days) | +20–50% |
| Bundles (several deliverables) | −10–25% |
| Niche premium (finance, B2B, medical, legal) | 1.5–3× |
| Beauty / skincare with proven sponsored performance | ~1.2–1.5× |
| UK / AU creators | ~0.7–0.9× US |
| India / LatAm / SEA creators | ~0.2–0.5× US |

**Usage rights are where the long-term value is** (reusing creator content in ads). Always price the rights ask separately so the human can negotiate it, and put it in the brief as "proposed, pending contract".

## 4. Real rate evidence beats benchmarks

In this order: (a) the brand's own past deals and quoted rates (brain learnings, the roster's `quoted_rate` column from earlier runs); (b) the creator's public media kit or "work with me" / advertise page (link-in-bio, newsletter sponsor pages often list prices); (c) the benchmark. Partnership ads in the ad library show a brand paid to amplify them, not the price. A recommended rate above ~1.5× the benchmark is flagged with its reason (proven sales, scarce niche, rights bundled).

## 5. Which deal to recommend (per creator, with the reason)

- **Gift-first**: nano/micro under ~50k, a gift worth ≥ ~$30–50 retail with a margin that survives it, goal = awareness or content volume. Low-price catalogues: gift a routine bundle, costed as bundle unit cost + shipping. Expect ~20–40% of creators who accept a gift to post — size the seeding list for it. Gifted posts still need disclosure.
- **Paid**: mid tier and above; a guaranteed deliverable, date or usage rights is needed; regulated claims are involved (paid gives approval control); creators with a manager or agency (they rarely accept gift-only); most B2B (a free account is not payment).
- **Affiliate / commission**: **only** for a creator who already runs codes, affiliate storefronts or links; the goal is tracked sales. For a brand buyers don't know yet (a new SaaS, an unknown DTC brand), mid-tier creators and up get **paid or hybrid**, never commission-only: 25% of a $59 plan is ~$15 a month per sale, which no 87k–150k creator takes from a brand their audience hasn't heard of. Norms: ~10–20% DTC (~20–30% for high-margin), ~20–30% recurring for ~12 months for SaaS. The playbook recommends; programme setup and codes are out of scope.
- **Hybrid**: ~50–70% of the benchmark fee plus commission, for mid-tier creators — or micro creators with proven category conversion (partnership ads, codes) — who have already converted for the category.
- **UGC-for-ads creators** (content, not reach): price **per asset** (~$150–500 covers one concept, one finished cut and 30-day paid usage, approximate US); extra hook variants ~$50–150 each; raw footage +15–30%; 90-day and perpetual usage priced with the modifiers table — never on their audience size or a CPM.

**Near-misses, not deals:** an employee, founder, "evangelist" or ambassador of a rival or adjacent tool (their bio, LinkedIn headline or pinned post says so). Their audience trusts them for that tool; list them under near-misses with the reason — never "ask about exclusivity".

## 6. Money rules — the ceiling

- **Sales goal — two ceilings, show both**:
  - *Organic first order* = median views × action rate × CVR × AOV × gross margin. Approximate inputs: action rate ~0.1–0.5% (link-in-bio or code), ~0.5–2% (YouTube description link), ~1–5% (newsletter click); CVR ~2–5% for warm creator traffic. Multiply by an LTV multiple **only** with the brand's repeat-purchase data, labelled. This rarely justifies a fee at a low AOV — say so plainly rather than turning every creator into affiliate-only.
  - *Rights-amplified* = (target CAC − expected CPA on this asset) × expected conversions over the usage term, where expected conversions = planned media behind the asset ÷ expected CPA. The media still has to be paid for, so only the **improvement** over target pays the creator. Needs target CAC and planned media (ask); the expected CPA is an assumption — label it (a creator asset expected to beat the brand's current CPA by 10–30% is a common working range). If the asset is not expected to beat target, the paid fee has no rights-amplified case.
  - When a deal buys both the organic post and paid usage, the two ceilings **add**.
  - If both fail, recommend affiliate or hybrid; many micro creators decline commission-only, so say that too.
- **Awareness goal**: pay up to ~2× the brand's paid-social CPM (Meta ~$8–15 as a placeholder unless the brain has the brand's own).
- **Content goal**: compare to the brand's own cost per tested creative or per winning ad if the brain or the human has it; otherwise say "no independent ceiling — priced on the market band" rather than pretending the band is a ceiling.
- **B2B**: compare to the brand's target cost per demo or qualified lead and its average contract value — ask for both; never default them. Answer "none yet" → write "walk-away: not set — needs target cost per demo", and recommend the smallest test wave instead. LinkedIn: price per post from the flat-fee bands (views are not public there). Newsletters and podcasts: per placement from their own advertise page or media kit when public; otherwise a conditional range ("if the media kit confirms ~20k subscribers: $1,000–3,000").
- **Apps**: compare to the target cost per install or trial if the brain or the human has it; for UGC-for-ads, the content ceiling only. Never ask apps for unit cost or margin.
- Gifting cost is unit cost + shipping, not retail price, and it counts against the budget. No unit cost or margin → ask, never assume.

Show every input and say which are the brand's numbers and which are placeholders.

**When typical views weren't read** (fetch-only free pass, hidden counts): give a **conditional range** — "if her typical post gets 10–30k views: $100–750 + usage" — and say the top-up turns it into a real range. Never price on followers alone, and never on a top post.

## 7. No budget given

When the human has no budget yet (common for new B2B brands), do not leave prices blank. Offer two or three **test waves priced from the bands**, each labelled with its assumptions — for example "Wave A: 2 newsletter placements + 2 LinkedIn posts ≈ $X–Y; Wave B: 4 LinkedIn posts ≈ $X–Y; Wave C: affiliate-only at 20–30% recurring, $0 upfront" — and let the human pick. The pick becomes the budget for step 6.

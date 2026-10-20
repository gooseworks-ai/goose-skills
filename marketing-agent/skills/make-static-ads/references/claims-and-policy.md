# Claims and policy — what counts in a static ad, where claims hide

Load at Step 5 (Pass A) and Step 9 (Pass B on renders). The verdicts come from the shared the `claims-gate` skill (`../../claims-gate/SKILL.md`) (claims) and the `ad-policy-check` skill (`../../ad-policy-check/SKILL.md`) (platform and category rules); this file is the static-ad craft that feeds them — what to extract and where claims hide in an image ad. Craft knowledge, not legal advice; when a category is regulated and the brand has no approved line for something, the answer is "cut it and show the human", never "rephrase until it sounds safe".

## 1. What counts as a claim

A claim is any statement a reasonable customer could rely on as fact about the product, the brand or the outcome. It does not matter whether it sits in the headline, the image, the primary text, a badge, a sticker, a fake review card or the alt text. **Implied claims are claims.** A picture of clear skin next to "Day 1 / Day 28" is a claim even with no words.

Treat each of these as a claim that must trace to the approved-claims list (or to a verified product fact — see §2):

| Type | Examples | Why it is risky |
|---|---|---|
| Numbers and stats | "4.9 stars", "92% saw…", "10,000 customers", "2x faster" | Must be current, from the named source, about this product |
| Superlatives | "#1", "best", "most effective", "only" | Need ranking proof; "only" needs category-wide proof |
| Comparatives | "better than CeraVe", "half the price of…" | Need head-to-head proof; naming a competitor adds legal exposure |
| Efficacy / outcome | "clears acne", "fall asleep faster", "cuts onboarding time" | The core substantiation risk; health outcomes are regulated |
| Time-bound results | "in 7 days", "overnight", "instantly" | Needs a study with that timeframe |
| Authority | "dermatologist-developed", "clinically tested", "doctor-recommended", "award-winning" | Must name the real basis; "clinically proven" ≠ "clinically tested" |
| Endorsement / testimonial | a review quote, "as seen in Allure", a press quote | Must be real, attributed, not edited to change meaning, and typical of results (FTC) |
| Ingredient / formulation | "100% free of X", "non-comedogenic", "vegan", "clean" | Absolutes need proof; "clean" is undefined puffery-risk |
| Offer and commercial terms | "free shipping", "20% off", "$16", "free returns", "limited stock" | Must be live today, on this product, with real terms; fake scarcity is deceptive |
| Safety / environmental | "safe for kids", "eco-friendly", "carbon neutral" | Green claims are now actively enforced (FTC Green Guides, EU) |

**Puffery** — vague, unmeasurable praise ("you'll love it", "a little luxury", "rethink your ritual") — is not a claim and may stay. The test: could someone prove it false? If yes, it is a claim.

## 2. Where proof may come from

The claims gate decides; the static-ad points it relies on:
- **Signed-off claims** verbatim or a listed variant; any paraphrase of your own, even a faithful shortening, is a new claim. No sign-off → the gate's scoped sign-off for the lines this batch needs; declined → plain product facts only.
- **A plain product fact** from the product record or the real label: name, price with currency, size, listed ingredients, what's in the box, how to use. Efficacy language in a product description or on a label ("repairs skin at the molecular level", "Dermatologist Developed") is a claim needing sign-off.
- **Sensory and texture words** describing the feel ("lightweight", "sinks in", "rich") are puffery; "never oily", "absorbs instantly", "all-day" are claims.
- **Lists that are not claims:** the video engine's `may_claim` lists, kit proof points, and the brand's own past ad copy (`ads_template_read` `mode: "mine"`) can hold lines about other products or lines never approved ("your daily defense against bacteria & breakouts").
- **Scope:** a rating with no product scope ("Rated 4.9 out of 5 stars, 234 reviews") may belong to one product page; press quotes keep the outlet's name and are never shortened to say more; numbers that go stale (ratings, counts, awards, offers) are flagged "verify current". `["claim"]` status fields only ever narrow a signed claim (on staging every Personal Day claim came back `approved_scope_unknown` for the moisturiser).

### Tiers — classify every claim-bearing span

| Tier | Example | Rule |
|---|---|---|
| T1 Approved, verbatim | the approved line with its qualifier | Use as is. Its qualifier travels with it, legibly — an illegible qualifier counts as missing |
| T2 Approved, listed variant | a variant listed on the sign-off (e.g. "Up to 72h hydration*" listed under "increases hydration for up to 72 hours") | Use as listed, qualifier kept. An unlisted rewording — even a narrower one — is T5: cut, restore-proof "add it as a listed variant on the claims sign-off" |
| T3 Puffery | "feels like a hug", "our favourite", "sinks in" | Unmeasurable. If in doubt, treat as a claim |
| T4 Implied | "Skip steps 2–9", a dull-vs-glowing split, "your skin will thank you" | Is a claim — check it as if written out |
| T5 Unapproved | anything with no approved line or product fact behind it | Cut; list with its restore-proof |
| Never | drug/medical language for a non-drug ("treats eczema", "heals", "boosts collagen", "cures") | Cut, and tell the human it is a regulatory line, not just a proof gap |

**Rewording.** Only verbatim or a listed variant; never a paraphrase of your own, however faithful. **No fusion.** Two approved claims cannot be combined into a stronger third ("dermatologist-proven 72h" from "dermatologist tested" + "up to 72 hours").

### Trigger words — a span is claim-bearing if it contains any of these

Numbers (%, hours, counts, ratings, "2 years", "3×") · superlatives and absolutes (best, #1, only, first, most, never, always, guaranteed, 100%) · comparatives (better than, unlike, vs, "the only X that…") · authority (clinically, proven, tested, studies show, science-backed, dermatologist, doctor, expert, lab) · time-bound results (overnight, instantly, in 7 days, all day, 72h) · efficacy verbs (hydrates, repairs, restores, reduces, firms, brightens, clears, prevents, protects, boosts, saves you X, cuts Y) · suitability and free-from (for sensitive skin, hypoallergenic, non-comedogenic, safe for, fragrance-free, clean, non-toxic, natural, vegan) · environmental (sustainable, recyclable, carbon-neutral) · origin and awards (made in, award-winning, as seen in) · social proof (stars, review counts, customer counts, "sold out", "viral", "loved by") · commercial terms (price, % off, was/now, free shipping, code, limited, countdown, guarantee, returns) · endorsements (any customer, creator or founder quote — its implied claim is checked as if the brand said it) · visual implications (before/after-like pairs, sparkle "results", magnified improved skin, lab coats, seal or badge shapes).

### Four doors claims sneak through

1. **Customer quotes.** A review that says "cleared my redness" is the brand claiming it clears redness. Customer words may supply the *pain*; the *benefit* must be approved. Quote only real reviews, verbatim, from the brand's own customers, with their source.
2. **The source template.** A remixed competitor or community ad can carry its badges, seals, stars and numbers into the render.
3. **The visual.** Split screens, glow effects, measuring devices and lab coats imply outcomes and authority.
4. **The image model.** It invents "#1", "Dermatologist approved", 4.9★, prices and laurels. Fence it in the prompt — *render only this text: "…"; no other text, badges, ratings, seals, prices or logos except the brand's* — and read every render afterwards.

### Run it twice

- **Pass A, before spend:** on the planned copy, the on-image text and the generation prompt (on the campaign path, on the composed prompt itself).
- **Pass B, after render:** on every rendered ratio — the text the model actually drew, any marks it added, dropped qualifiers, what the picture implies.

Offers, prices and stock are checked against the **product record and the marketer's words**, not the claims list: price and currency exact, terms not narrowed ("first order" ≠ "first jar"), end date shown, no "was" price without a real prior price, no "limited" without a real limit. Re-read the product record just before handing over.

Anything that fails: **cut it before the human sees the ad**, and list it in the hand-off as `cut line → the proof that would restore it` (e.g. "'clears breakouts in 7 days' → a study or approved claim stating the 7-day result for this product"). Approving a new claim is the human's call through learn-my-brand.

## 3. Platform, category and disclosure rules

Moved to the shared the `ad-policy-check` skill (`../../ad-policy-check/SKILL.md`) (paid ads: Meta, TikTok, Google, LinkedIn and others; category rules; on-asset disclosures; reporting). Organic use of a graphic → `../../ad-policy-check/disclosure.md` (in the `ad-policy-check` skill).

## 4. How to report the checks

Each ad carries two short lines, in plain words in chat and in full in the batch file:
- **Claims:** `pass` (every factual line traced — claim or "product fact: price"), or `pass with cuts` (what was cut and what restores it). With no sign-off, one set-level note: "claims not signed off — facts only".
- **Policy:** `pass (Meta)`, `fixed` (what, why) or `flag` (risk, rule, decision needed); never "pass" a rule you could not check.

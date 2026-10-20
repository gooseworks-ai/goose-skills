# Claims and policy — what counts in a static ad, where claims hide

Claims are decided by the rule in §2 (hard rule 1); platform and category rules by the shared the `ad-policy-check` skill (`../../ad-policy-check/SKILL.md`). This file is the static-ad craft — what counts, where claims hide in an image ad. Craft knowledge, not legal advice; when a category is regulated and the brand has nothing on file for something, the answer is "cut it and show the human", never "rephrase until it sounds safe".

## 1. What counts as a claim

A claim is any statement a reasonable customer could rely on as fact about the product, the brand or the outcome. It does not matter whether it sits in the headline, the image, the primary text, a badge, a sticker, a fake review card or the alt text. **Implied claims are claims.** A picture of clear skin next to "Day 1 / Day 28" is a claim even with no words.

Treat each of these as a claim that must trace to a usable brain fact or a plain product fact (§2):

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

## 2. Usable facts — where proof may come from

A **usable fact** is a fact the table below allows, worded as recorded. Every factual line in an ad — copy, on-image text, badge, implied by the picture — is a usable fact or is cut. This playbook follows the **server composer's claims rule** ("any factual claim may appear ONLY if it is present in the brand context — proof points, value props, brand facts, product details; never invent, round up or embellish"), checked against the **brand brain's status** for each fact:

| Brain status (`gooseworks:brain_search` `statuses`) | Source | Use it? |
|---|---|---|
| `confirmed` | any | **Yes**, worded as recorded |
| `found` | the brand's own website, the brand kit (proof points, value props), the product record | **Yes**, worded as recorded |
| `found` | press, third-party pages, reviews | Only as a quoted, attributed line (press quote, review) |
| `guess`, `unknown` | any | **No** — cut, and list it with what would confirm it |

- Read the brain once at Step 1: `gooseworks:brain_map` (`brand_id`), then `gooseworks:brain_search` for the product's claims and proof (`source_types: ["claim","brand_kit","fact","product"]`, `product_id`). On a server without the brain tools, the brand kit's proof points and value props and the product record count as `found`.
- The composer may write headlines in the brand's voice **from** these facts ("Wool up top" from "Merino wool upper"). It may not add a fact, a number, a result or a promise that isn't there ("feet stay dry" from "water-repellent finish" adds a result — cut it). Numbers, ratings, guarantees, qualifiers and regulated wording stay exactly as recorded.
- Numbers that go stale (ratings, review counts, awards, offers) are flagged "verify current".
- **Plain product facts** (name, price with currency, sizes, colours, materials, what's in the box, how to use) are always usable.
- Drug or medical language for a non-drug ("treats", "heals", "cures") is never usable, whatever its status.

### Tiers — classify every claim-bearing span

| Tier | Example | Rule |
|---|---|---|
| T1 Usable, as recorded | a `confirmed` fact, or one `found` on the brand's website, kit or product record, with its qualifier | Use as recorded. Its qualifier travels with it, legibly — an illegible qualifier counts as missing |
| T2 Usable as a quote only | a press line or review the brain holds as `found` | Quoted verbatim and attributed, never restated as the brand's own claim |
| T3 Puffery | "feels like a hug", "our favourite", "sinks in" | Unmeasurable. If in doubt, treat as a claim |
| T4 Implied | "Skip steps 2–9", a dull-vs-glowing split, "your skin will thank you" | Is a claim — check it as if written out |
| T5 Not usable | `guess`, `unknown`, or nothing on file — including a reworded, shortened or merged version of a usable fact | Cut; list with what would confirm it |
| Never | drug/medical language for a non-drug ("treats eczema", "heals", "boosts collagen", "cures") | Cut, and tell the human it is a regulatory line, not just a proof gap |

**Rewording.** Only as recorded; never a paraphrase of your own, however faithful — the composer's rule says the same ("never invent, round up or embellish"). **No fusion.** Two usable claims cannot be combined into a stronger third ("dermatologist-proven 72h" from "dermatologist tested" + "up to 72 hours").

### Trigger words — a span is claim-bearing if it contains any of these

Numbers (%, hours, counts, ratings, "2 years", "3×") · superlatives and absolutes (best, #1, only, first, most, never, always, guaranteed, 100%) · comparatives (better than, unlike, vs, "the only X that…") · authority (clinically, proven, tested, studies show, science-backed, dermatologist, doctor, expert, lab) · time-bound results (overnight, instantly, in 7 days, all day, 72h) · efficacy verbs (hydrates, repairs, restores, reduces, firms, brightens, clears, prevents, protects, boosts, saves you X, cuts Y) · suitability and free-from (for sensitive skin, hypoallergenic, non-comedogenic, safe for, fragrance-free, clean, non-toxic, natural, vegan) · environmental (sustainable, recyclable, carbon-neutral) · origin and awards (made in, award-winning, as seen in) · social proof (stars, review counts, customer counts, "sold out", "viral", "loved by") · commercial terms (price, % off, was/now, free shipping, code, limited, countdown, guarantee, returns) · endorsements (any customer, creator or founder quote — its implied claim is checked as if the brand said it) · visual implications (before/after-like pairs, sparkle "results", magnified improved skin, lab coats, seal or badge shapes).

### Four doors claims sneak through

1. **Customer quotes.** A review that says "cleared my redness" is the brand claiming it clears redness. Customer words may supply the *pain*; the *benefit* must be a usable brain fact. Quote only real reviews, verbatim, from the brand's own customers, with their source.
2. **The source template.** A remixed competitor or community ad can carry its badges, seals, stars and numbers into the render.
3. **The visual.** Split screens, glow effects, measuring devices and lab coats imply outcomes and authority.
4. **The image model.** It invents "#1", "Dermatologist approved", 4.9★, prices and laurels. The composer's own rules fence it (`composer.md` §5: grounded claims, coherent copy, text density); the judge's `claims_grounded` and `legible_text` checks catch what slips through (`judge.md` §4), and the agent reads every render afterwards.

### Run it twice

- **Pass A, before spend:** on the copy rows and on each composed prompt — every on-image word it asks for and what its scene implies.
- **Pass B, after render:** on every rendered ratio — the text the model actually drew, any marks it added, dropped qualifiers, what the picture implies.

Offers, prices and stock are checked against the **product record and the marketer's words**, not the claims list: price and currency exact, terms not narrowed ("first order" ≠ "first jar"), end date shown, no "was" price without a real prior price, no "limited" without a real limit. Re-read the product record just before handing over.

Anything that fails: **cut it before the human sees the ad**, and list it in the hand-off as `cut line → the proof that would restore it` (e.g. "'clears breakouts in 7 days' → a study or confirmed claim stating the 7-day result for this product"). Confirming a new claim is the human's call: a claim the marketer confirms in this chat is saved in their words through the `save-learning` skill (`../../save-learning/SKILL.md`) before it is used.

## 3. Platform, category and disclosure rules

the `ad-policy-check` skill (`../../ad-policy-check/SKILL.md`) (paid ads: Meta, TikTok, Google, LinkedIn and others; category rules; on-asset disclosures; reporting). Organic use of a graphic → `../../ad-policy-check/disclosure.md`.

## 4. How to report the checks

Each ad carries two short lines, in plain words in chat and in full in the batch file:
- **Claims:** `pass` (every factual line traced — the fact and its brain status, or "product fact: price"), or `pass with cuts` (what was cut and what would confirm it). With nothing usable on file, one set-level note: "nothing confirmed on file — product facts only".
- **Policy:** `pass (Meta)`, `fixed` (what, why) or `flag` (risk, rule, decision needed); never "pass" a rule you could not check.

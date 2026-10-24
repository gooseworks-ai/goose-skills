# Claims and policy — what counts in a static ad, where claims hide

Which lines are usable is the `claims-gate` skill's call (§2 says how that applies in an image ad); platform and category rules are the `ad-policy-check` skill's (`../../ad-policy-check/SKILL.md`). This file is the static-ad craft — what counts, where claims hide in an image ad. Craft knowledge, not legal advice; when a category is regulated and the brand has nothing on file for something, the answer is "cut it and show the human", never "rephrase until it sounds safe".

## 1. What counts as a claim

A claim is any statement a reasonable customer could rely on as fact about the product, the brand or the outcome. It does not matter whether it sits in the headline, the image, the primary text, a badge, a sticker, a fake review card or the alt text. **Implied claims are claims.** A picture of clear skin next to "Day 1 / Day 28" is a claim even with no words.

Claim types and the proof each needs: `../../claims-gate/claim-types.md`. What follows is only what an image adds.

**Authored metaphor.** A visibly imagined scene or relationship may express a supported product role without being a factual claim that the scene happened. State the likely factual takeaway, then check that against §2. A visual analogy does not by itself promise measured control, saved time or a better outcome; words, staging or comparison can turn it into that promise. Keep expressive meaning when the takeaway is supported. A metaphor label never excuses an unsupported result, endorsement or product capability.

**Puffery** (no proof needed): the test in the `claims-gate` skill §2.1.

## 2. Usable facts — where proof may come from

A **usable fact** is a claim the `claims-gate` skill passes, or a plain product fact (its §1.7). Every factual line in an ad — copy, on-image text, badge, or implied by the picture — is a usable fact or is cut. The rules that matter most in an image ad:
- A brand-voice headline may say a plain product fact's meaning if it adds nothing (claims-gate §1.7): "Wool up top" from "Merino wool upper" is fine; "feet stay dry" from "water-repellent finish" adds a result, so cut it.
- **Price and offers, the one rule:** on an ad only when the marketer confirmed it in this job (Step 2, claims-gate §1.8) and it matches the live product page (re-read in this run). If they differ, it is a Step 2 conflict.
- Numbers that go stale (ratings, review counts, awards) are flagged "verify current".
- Drug or medical language for a non-drug ("treats", "heals", "cures") is never usable.
- **No fusion.** Two usable claims never combine into a stronger third ("dermatologist-proven 72h" from "dermatologist tested" + "up to 72 hours").

- **Press lines and reviews:** quoted verbatim and attributed, never restated as the brand's own claim, and only when the claim inside them passes too (claims-gate §2.3) or they are puffery ("my new favourite").
- **Implied claims** ("Skip steps 2–9", a dull-vs-glowing split) are checked as if written out.
- A qualifier travels with its claim, legibly; an illegible qualifier counts as missing.

### Trigger words — a span is claim-bearing if it contains any of these

Numbers (%, hours, counts, ratings, "2 years", "3×") · superlatives and absolutes (best, #1, only, first, most, never, always, guaranteed, 100%) · comparatives (better than, unlike, vs, "the only X that…") · authority (clinically, proven, tested, studies show, science-backed, dermatologist, doctor, expert, lab) · time-bound results (overnight, instantly, in 7 days, all day, 72h) · efficacy verbs (hydrates, repairs, restores, reduces, firms, brightens, clears, prevents, protects, boosts, saves you X, cuts Y) · suitability and free-from (for sensitive skin, hypoallergenic, non-comedogenic, safe for, fragrance-free, clean, non-toxic, natural, vegan) · environmental (sustainable, recyclable, carbon-neutral) · origin and awards (made in, award-winning, as seen in) · social proof (stars, review counts, customer counts, "sold out", "viral", "loved by") · commercial terms (price, % off, was/now, free shipping, code, limited, countdown, guarantee, returns) · endorsements (any customer, creator or founder quote — its implied claim is checked as if the brand said it) · visual implications (before/after-like pairs, sparkle "results", magnified improved skin, lab coats, seal or badge shapes).

### Four doors claims sneak through

1. **Customer quotes.** A review that says "cleared my redness" is the brand claiming it clears redness. Customer words may supply the *pain*; the *benefit* must be a usable brain fact. Quote only real reviews, verbatim, from the brand's own customers, with their source.
2. **The source template.** A remixed competitor or community ad can carry its badges, seals, stars and numbers into the render.
3. **The visual.** Split screens, glow effects, measuring devices and lab coats imply outcomes and authority.
4. **The image model.** It invents "#1", "Dermatologist approved", 4.9★, prices and laurels. The prompt's text-control line fences it (`prompts.md` §2); the judge and Pass B catch what slips through.

### Run it twice

Pass A (before spend, on the copy and each finished prompt) and Pass B (after render, on what was drawn): the `make-static-ads-claims-extract` skill (`../../make-static-ads-claims-extract/SKILL.md`).

Offers, prices and stock follow the price rule above, then: price and currency exact, terms not narrowed ("first order" ≠ "first jar"), end date shown, no "was" price without a real prior price, no "limited" without a real limit. Re-read the live product page just before handing over; a changed price or offer: hold that ad and tell the marketer; a remake needs copy checks and a new quote (playbook Other modes, Price or stock change).

Anything that fails: **cut it before the human sees the ad**, and list it in the hand-off as `cut line → the proof that would restore it` (e.g. "'clears breakouts in 7 days' → a study or confirmed claim stating the 7-day result for this product"). Confirming a new claim is the human's call, through the `claims-gate` skill's sign-off (`../../claims-gate/SKILL.md` §4): a yes in chat counts only as that skill records it.

## 3. Platform, category and disclosure rules

the `ad-policy-check` skill (`../../ad-policy-check/SKILL.md`) (paid ads: Meta, TikTok, Google, LinkedIn and others; category rules; on-asset disclosures; reporting). Organic use of a graphic → `../../ad-policy-check/disclosure.md`.

## 4. How to report the checks

Each ad carries two short lines, in plain words in chat and in full in the batch file:
- **Claims:** `pass` (every factual line traced — the fact and its brain status, or "product fact: price"), or `pass with cuts` (what was cut and what would confirm it). With nothing usable on file, one set-level note: "nothing confirmed on file — product facts only".
- **Policy:** as the `ad-policy-check` skill (`../../ad-policy-check/SKILL.md`) §5 says.

# Claims, policy and people — video

Load at Steps 2, 4 and 5 (and Step 11 for a disapproval). Craft knowledge, not legal advice: when a regulated category has no approved line for something, cut it and show the human — never rephrase until it "sounds safe".

## 1. Two traces for every script

1. **Idea trace:** every hook and body idea → the angle bank (`A-NN`), a voice-of-customer row, or a **labelled brand source** — the kit audience or positioning, the brand's own top organic posts, the marketer's words in this chat ("brand-stated, not customer-tested"). A hook "inspired by customers" that no customer said fails; engine-drafted angles are labelled "untested".
2. **Claim trace:** every claim-bearing word → a signed-off claim through the shared claims gate (`../../../skills/claims-gate/SKILL.md`, including its scoped sign-off), or a plain product fact (a line okayed in chat is not a sign-off — it goes through the claims gate's scoped sign-off, §4 of that atom) (ingredients, dose, size, price with currency, how to use). Kit proof points, the `approvedClaims` list, the engine's `buyer_brief.may_claim` and product-page efficacy wording are **candidates**, not proof — on staging the moisturiser's `may_claim` held press quotes about a mist and a toner, and "calms skin" / "balances moisture" passed the engine's warnings.

**Secondary check:** search `["claim"]` with the `product_id`; these fields only narrow a signed claim — `approved_scope_unknown` → not for this product unless the claims gate's scoped sign-off records it.

**Text inside images and clips counts.** A product image or clip used in a scene carries its printed words onto the screen. Read them (`media_analyze` / `media_search` visible text): the moisturiser's catalogue images say "97% of test subjects agreed their skin felt instantly hydrated" and "boosts… collagen". Prefer clean packshots; printed results can be put through the claims gate's scoped sign-off.

**Customer words carry the pain, never the benefit.** "My brain replays every awkward thing at 3am" is safe texture. "I finally sleep through the night" in an ad is the brand claiming it — it needs that claim approved, and a typicality basis.

What counts as a claim, the tiers (verbatim / listed variant / puffery / implied / unapproved / never — an unlisted rewording, even a narrower one, is unapproved), the trigger words and the "no fusion" rule are the same as for statics — numbers, superlatives, comparatives, authority words, time-bound results, efficacy verbs, free-from and suitability, environmental, origin and awards, social proof, commercial terms, endorsements.

## 2. Pictures and on-screen text make claims

Run the check over every scene's **line, on_screen and picture**:
- Results pictures: someone springing out of bed energised; a grey face then a glowing face; a clock jumping from 11:02 to 11:09 "asleep"; a magnified "improved" skin patch.
- Authority pictures: lab coats, measuring devices, seals and badges.
- Supers that drift from the voice-over ("knocks you out" on screen while the voice says "supports restful sleep").
- Intensifiers the writer adds to make it punchy: "deep", "instantly", "finally", "in 20 minutes".

The engine also checks words against the product facts and approved claims and returns `warnings` and a `claims_note` — read and resolve every one, and say how at the gate.

## 3. The speaker test — the one definition (every other file points here)

Apply it to every scene of every style, ready-made or custom:

- **A generated person saying "I / my / me" about using or experiencing the product — spoken, on screen or in captions over that person ("POV: I finally found…") — is a dramatisation.** It may stay only with a visible "Dramatization" (or "AI-generated") label that the style actually renders (confirm from the template that it shows persistent on-screen text — some styles render only captions of the spoken line, so an `on_screen` label silently disappears) and **no results** ("my skin cleared", "I sleep through the night"); otherwise the line moves to a narrator or becomes the brand speaking ("we made…"). A generated person never presents as a real customer or reviewer — no "honestly, I've used it for a month". Under the US FTC rule on fake reviews and testimonials (2024) a testimonial from a person who does not exist is a violation per ad; the UK and EU treat it as misleading.
- **Customer words** appear only as real, verbatim, attributed quotes (on screen, or read by the narrator: "Here's what Priya wrote…"), from the brand's own customers, used as the review terms allow, not edited to change meaning.
- **Real people** — founder, staff, creators, customers — their face, cloned voice, **name, story or endorsement** only with consent and, for paid ads, paid-usage rights on record (a celebrity founder's name and story included). Ask if unknown. Never a real or famous person's likeness the brand has no rights to; never children.
- **Fake social proof:** comments, chats, reactions, interviews, a chatbot's answer or a publication's praise are clearly fiction in the brand's own voice, or real and attributed — never invented praise posing as real people, and never a third party shown endorsing the product unless that endorsement is real and approved.
- **Disclosure:** a realistic generated person or voice → an on-screen AI label where the style renders on-screen text, and always a launch note for run-paid-campaigns to switch on the platform's AI label (Meta "AI info", TikTok AIGC, YouTube altered/synthetic). A disclosure never cures a fake testimonial.

Styles that lean on generated people or social proof (creator review, narrated creator montage, day-in-the-life with a creator, split-screen or talking creator, street interview, podcast skit, Instagram Live with comments, chatbot or text-message reveal) are usable only when every line passes this test. If a style cannot be scripted that way, say so in its fit line.

## 4. Platform and category rules

The paid-ad platform and category rules (personal attributes, before/after, supplements and cosmetics wording, regulated categories, special ad categories, trademarks, AI labels, on-asset disclosures) are the shared `../../../skills/ad-policy-check/SKILL.md`. Video-specific points it leaves to this playbook:
- **Hooks:** situational ("3:07am") and identity-by-behaviour ("for people who rehearse conversations in bed") pass; first person passes the platform rule but, from a generated person, must also pass the speaker test (§3).
- **Supplements and melatonin:** know the market before writing (prescription-only in the UK and Australia); no children, no "candy"/"treat"; TikTok is stricter than Meta on ingestibles — flag it at the gate when TikTok is a placement.
- **Music:** engine-generated or licensed only; never "the song from the reference" or a sound-alike; a trending TikTok sound is added in-platform from the Commercial Music Library at launch — note it in the launch notes.
- **Material connections:** paid creators, gifted product, affiliates → "#ad" / "Paid partnership" (`../../../skills/ad-policy-check/disclosure.md`).

## 5. keep_claims

The engine lets the marketer keep a flagged phrase (`keep_claims`). Use it only when the wording restates a signed claim or a plain product fact (§1) exactly. A founder saying "it's true" about a new efficacy or health claim is not approval — cut it, and run the claims gate's scoped sign-off (§4) for that line; declined → cut it with the proof that would restore it. Log every kept claim in the hand-off.

## 6. Reporting

At the script gate and in the hand-off: claim trace per claim-bearing phrase (claim id or product fact), the cut list (`line → why → proof that would restore it`), disclosures planned, policy flags per placement, and anything marked "not checked: <rule>, <why>".

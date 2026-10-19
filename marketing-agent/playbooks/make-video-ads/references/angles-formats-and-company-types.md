# Angles, formats and company types

Load at Steps 2–4.

## 1. Angle types — when each wins

The engine's `angle_type` values. Use the same names in tags and learnings so statics and video are compared on one scale.

| angle_type | Usual `brief_field` | Wins when | Hook family examples | Watch-outs |
|---|---|---|---|---|
| problem_fix | in_their_way, customer_words | Pain is vivid and common; cold audiences | Situation POV, "the worst part of…" | Personal-attribute wording; disease words |
| story | customer_words, for_whom | A real customer or founder story is on file | "I didn't think…", founder origin | Never a fabricated customer; AI actor = labelled dramatisation, no results |
| curiosity | why_this | A surprising true fact or mechanism; saturated categories | "Nobody talks about…" | Must pay off inside the ad; competitor disparagement needs proof |
| identity | for_whom | A tribe self-identifies | "For the people who…" | Identity by behaviour, not by condition, age or finances |
| desire | they_want | An aspirational outcome is approvable; premium | Ritual, mood, "imagine…" | Desire pictures easily imply unapproved results |
| demo | why_this | The product is visual, tactile, satisfying; sound-on | ASMR, unboxing, "watch this" | Product fidelity; a demo can't show results it can't prove |
| how_it_works | why_this, may_claim | The mechanism is approved and different | "3 things inside" | Mechanism drifts into efficacy fast |
| old_vs_new | instead | A clear switch from the alternative | Split routine, "used to… now…" (brand voice) | Never before/after of a body or face |
| proof | may_claim | Strong approved proof (ratings, awards, press); retargeting | Review montage, rating card | Exact wording; no rounding up |
| offer | may_claim | A real promo, guarantee or bundle; warm audiences | "Try 30 nights" | Must exist and be current; no fake scarcity |
| objection | in_their_way, customer_words | The top barrier is known from evidence | Real-quote card + answer | The answer must be an approved claim |
| news | why_this | Genuinely new (launch, reformulation) | "New:" | "New" generally means the last ~6 months; must be true |

Choosing the lead when the brief has no angle: (1) the angle-bank entry most supported by customer evidence, (2) not a hook family fatiguing in the account, (3) what competitors are *not* saying. Write the reason down.

## 2. Format by message

| Format | Best for | Raw material | Note |
|---|---|---|---|
| Product demo / hands-only | how_it_works, demo | Real product images; hands generated or real | Safest native look |
| UGC-style creator review | proof, story | A presenter speaking **as the brand** or reading a real, attributed review | Never "I tried it and…" from a generated person |
| Talking head / founder | story, identity, B2B, services | The real founder with consent; or a labelled presenter for the brand | Consent on record for any real likeness or voice clone |
| Problem / solution | problem_fix | Situation shots, product | Policy-safe phrasing |
| Listicle ("3 reasons") | how_it_works, proof | Traceable benefits | Each reason an approved claim |
| Unboxing | demo, desire, gifting | Exactly the real contents | No extras |
| Motion graphics / text-only | proof, news, B2B stats | Approved numbers | Cheapest; perfect for sound-off |
| Screen recording | SaaS, apps | **Real** screen recordings | Never generated UI |
| Reaction / green-screen | old_vs_new, news, curiosity | A reference to react to (structure only) | No competitor footage on screen without rights |
| Social-proof gallery | proof | Real reviews, real photos | Real rating only |
| Before/after | — | Only routines, never bodies or faces, unless category and platform allow and the human approves | Policy-gated |

The engine's ready-made styles map onto these; some carry conditions (e.g. a style that needs "a real score or rating the brand states") — respect them. Ready-made styles are 9:16 with their own length range; a few show no product at all (kinetic text, whiteboard) — wrong for a physical product's first ad. Styles built on generated people or social proof must pass the speaker test (`claims-policy-and-people.md` §3).

## 3. By company type

- **DTC (beauty, food, supplements, apparel, home):** product imagery and real photos anchor detail shots; offers and the promo calendar matter; stock and price must be current; category rules (supplements, cosmetics) drive the claims check.
- **B2B SaaS:** the product is a screen. Ask for real screen recordings or screenshots (upload with `media_upload`, use as footage); formats: screen demo, founder explainer, motion-graphic stats, customer story only with an approved, permissioned case study. LinkedIn placements: 1:1 / 4:5 / 16:9 on the custom path (shell host); LinkedIn also takes 9:16, so a ready-made style is a valid deliverable in a chat host. Often muted, 30–90s fine. A demo screen recording must be this brand's own product — check before use. Never show UI that does not exist.
- **Consumer app:** real app footage in a device frame, the first in-app moment shown, a store rating only if real and current, "Download" CTA.
- **Local business:** the real place, real staff (with consent), a real current offer with an end date, the area named in the hook; no generated storefronts or rooms. One video per location only if asked (cost).
- **Services (agency, consultant, clinic):** the expert is the product — real founder or expert on camera with consent; proof only from approved case results with client permission; testimonial rules are strict for legal, financial and medical services.
- **Marketplace sellers:** retail-media video (Amazon Sponsored Brands etc.) has its own specs and bans off-platform CTAs — not covered yet; say so rather than make off-spec video.
- **Regulated categories** (supplements, alcohol, finance, weight loss, kids): see `claims-policy-and-people.md` §4; ask the market first.

## 4. From your own footage

When the brand has raw clips, an old ad or creator footage (with rights): `gooseworks:media_search` / `media_list` to find it, `gooseworks:media_analyze` to read its scenes and transcript (free), `gooseworks:media_excerpt` to inspect and attach exact trims to a custom draft, or `gooseworks:video_import` to bring a finished video in for checks. Propose hooks and cuts from what exists; the same script, claims and speaker rules apply. Creator footage needs signed paid-usage rights: `creators/roster.csv` and creator briefs record only proposed rights (pending contract), so always ask the human whether the contract grants paid use. Owned organic posts with strong views (`brand_read` `organic`) are the first candidates for a paid cut-down — on the custom path (shell host). Check every clip: it shows this brand's product, carries no "not for publishing"/fixture flag, and any real person in it has consent.

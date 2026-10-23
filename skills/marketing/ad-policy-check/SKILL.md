---
name: ad-policy-check
description: >-
  Checks paid ads against the ad platform's rules (Meta, TikTok, Google, LinkedIn and others) and the
  brand's category rules: the copy, on-image or on-screen text, pictures and people. Rewrites what can
  be fixed honestly, adds the disclosures that are needed, and flags anything that needs a human or
  legal review, with one pass, fixed or flag line per ad and platform. Use alone when you already have
  the ad text or images and know where they will run; otherwise run the playbook for the job (e.g.
  make-static-ads, make-content, email-lifecycle).
version: 0.1.1
---

# ad-policy-check

Used by: make-static-ads (paid ads) and run-paid-campaigns (creative it checks at launch). Organic, email and creator content: load `disclosure.md` instead (or as well, when a paid ad uses a creator).

Craft knowledge, not legal advice. Policies change: when a rule decides whether an ad ships, tell the human to confirm it on the platform's live policy page. Claims are a separate check (the `claims-gate` skill, `../claims-gate/SKILL.md`); run that first — a line cut there is not reworded here.

**Reads:** the ad's planned or rendered text (copy, on-image or on-screen words, end cards, captions), what the picture shows, the people in it, the platforms and placements from the brief, the brand's category, and the brand's `dont` / `must` learnings (past disapprovals).
**Writes:** one policy line per ad and platform, and any set-level flag.

## 1. Category first

Regulated (health, supplements, cosmetics with efficacy language, alcohol, cannabis/CBD, tobacco/vape, financial products, crypto, weight loss, kids' products, regulated professions, gambling, dating, political) or a special ad category on Meta (housing, employment, credit, social issues)?

- No brand rule on file for it → flag the whole set "needs legal review before launch".
- A special ad category → write it in the hand-off so whoever launches sets the flag; copy may not target protected traits.
- Gambling, dating, political → most platforms need pre-authorisation: flag and stop.
- Market matters (melatonin is prescription-only in the UK and Australia; the EU allows only authorised health-claim wordings; Canada needs licensed claims) — know the market before writing.

| Category | Rule of thumb |
|---|---|
| Health, supplements | Structure/function wording only with substantiation ("supports restful sleep"); never disease language ("treats", "cures", "for insomnia", "anxiety relief") |
| Cosmetics with efficacy | "Treats acne", "heals", "boosts collagen" are drug-like; approved wording only |
| Alcohol, cannabis/CBD, tobacco/vape | Age-gated; often banned or pre-approved; no health benefits |
| Financial products, crypto | Certification, risk disclosures, no guaranteed returns |
| Weight loss | No before/after, no time-bound promises; banned on Pinterest |
| Kids' products | No direct appeals to children; no children in melatonin ads, no "candy"/"treat" |
| Regulated professions | Local rules (e.g. no patient testimonials for some medical services) |

## 2. Per ad, per platform

**Meta (Facebook, Instagram)**
- **Personal attributes:** no assertion or implication that the viewer has a trait — health condition, body, age, finances, religion, orientation, ethnicity. "Struggling with your acne?", "Can't sleep?" → rejected. Situational ("11am, and skin already feels tight") and identity-by-behaviour ("for people who rehearse conversations in bed") pass. First person passes the platform rule but, from a generated person, must also pass the speaker test of the maker playbook.
- **Body image and before/after:** nothing that makes people feel bad about their body; no before/after for weight loss; for beauty and health treat it as needing the human's OK — same conditions, no retouch, typical result; prefer old-vs-new routines, never faces or bodies.
- **Misleading and sensational:** no fake play buttons, close-X, notification badges, fake DMs; no shocking imagery.
- **Branded content:** a real creator's face or name needs their permission and the paid-partnership label.
- Text-heavy images get less delivery — keep image words to a hook and at most one proof line.

**TikTok** — stricter on supplements, weight management and "too good to be true" results, varies by market; no exaggerated before/after; must not imitate organic UI (fake "For You" chrome, fake like counts). Music: only TikTok's Commercial Music Library or generated/licensed music.

**Google (Display, Demand Gen, Shopping, Performance Max)** — misrepresentation (unclear pricing, missing terms, unavailable offers), healthcare and finance certification, trademarks in text; no gimmicky caps or symbols; Shopping/PMax product images carry no promotional text, watermark or border; image text and logos kept under about a fifth of the image.

**LinkedIn** — professional claims need the customer and the study behind them; no sensational images; no targeting language on protected traits.

**Pinterest, Snapchat, X, Reddit** — the same core rules; Pinterest bans weight-loss ads; Reddit punishes ads that pose as user posts.

**Every platform**
- Third-party trademarks and likenesses: no rival logos or celebrity lookalikes without permission; integration names in plain words only when true.
- Music: generated or licensed only — never "the song from the reference" or a sound-alike.
- Realistic generated people or voices: plan the platform's AI label (Meta "AI info", TikTok AIGC, YouTube altered/synthetic) in the launch notes.

## 3. Disclosures on the asset

- Offer terms that change the meaning ("Free shipping on orders $45+", not "Free shipping"); an end date on any time-limited offer.
- Material connection: paid creator, gifted product, affiliate → "Paid partnership" / "#ad".
- Required category disclaimers when the brand's rules say so (e.g. a supplement statement).
- A disclaimer never rescues an unsubstantiated outcome claim and never cures a fake testimonial — cut the claim instead.

## 4. Fix honestly

Rewrite the phrasing to the rule (situation framing instead of "you have…"), remove the fake element, add the disclosure. Never disguise a violation to get past review.

**Disapproval fix:** map the platform's stated reason to the exact line or element (it may be the ad's text, not the image or video); fix that; re-run the claims check and this check; offer to save the lesson as a brand rule through the `save-learning` skill (`../save-learning/SKILL.md`) (only with the human's own words).

## 5. Report

Per ad: `pass (Meta, TikTok)` · `fixed (what, why)` · `flag (risk, rule, decision needed)`. Never "pass" a rule you could not check — say "not checked: <rule>, <why>". In chat, plain words ("rewritten for Meta's rule on personal traits"); rule names stay in the hand-off file.

---
name: script-check
description: Internal step of make-video-ads. Extracts every claim-bearing span from a video plan — spoken lines, on-screen text, pictures, end-card and grid text, launch copy, and text inside images or clips — hands them to the shared claims gate and ad-policy check, and applies the video-only speaker test and idea trace, before the plan is saved.
---

# script-check

Claims verdicts (keep, rewrite, cut, the scoped sign-off when nothing is signed): `../../../../skills/claims-gate/SKILL.md`. Platform and category rules: `../../../../skills/ad-policy-check/SKILL.md`. This atom is the video extract step plus the checks only video needs.

**Reads:** the candidates (write-script) and the plan's `answers`; the engine's `warnings`, `claims_note`, `product_facts`, `buyer_brief`; `gooseworks:media_analyze` / `media_search` visible text for every `image_asset_id`, clip and cast image; `references/claims-policy-and-people.md`.
**Writes:** fixes to the candidates; the claim trace, source trace, cut list, people and disclosure notes for the gate.

1. **Extract** every claim-bearing span from each scene's `line`, `on_screen`, `picture` and `extra` fields, the plan's `answers` (tagline, offer, offer line, product-line name, strapline), the end card's brand fields (CTA, tagline, website), the launch copy, and the text printed inside any image or clip used.
2. **Claims gate** on the spans. Candidates that are not claims (`approvedClaims`, proof points, `may_claim`, product-page efficacy wording) are cut with their restore-proof unless the gate's sign-off covers them; only verbatim or a listed variant, never your own rewording.
3. **Idea trace** (`claims-policy-and-people.md` §1): angle bank, voice-of-customer row, or a labelled brand source; engine-drafted angles labelled "untested".
4. **Speaker test** (§3) on every line a person says and every first-person on-screen or caption line over a generated person; check from the template that the style renders a label before relying on one.
5. **Ad-policy check** on the plan: personal-attribute hooks (including the engine's own suggestions), before/after of bodies or faces, category and market rules, music rights, child appeal, disclosures; TikTok as a placement → its stricter rules.
6. **Footage and images:** this brand's product, no "not for publishing" flag, rights acceptable, consent for real people; printed claims inside images either signed or the image swapped for a clean packshot.
7. **Engine warnings:** resolve each — rewrite, cut, or `keep_claims` only for an exact restatement of a signed claim or a plain product fact. Never `keep_claims` a new health or efficacy claim.

Output for the gate: claim trace, source trace, cut list (`line → why → proof that would restore it`), people and disclosures, policy flags per placement, "not checked" items.

# Human version

- **What this is:** the quality check every new image gets before anyone sees it. The server's judge looks at the finished ad next to the reference ad and the brand's real logo and product photos, fills in a fixed yes/no checklist, and orders one redo when something serious is wrong.
- **Copied from the server.** The judge's instructions, every checklist item with its exact wording, the rule for which failures force a redo, the number of tries and the redo messages are verbatim from gooseworks-app `origin/dev` (commit `42a3dec20`, read 2026-10-19).
- **Sources:** `apps/api/src/services/ad-remix-pipeline.service.ts` — `judgeSchema` 3123–3207, `buildCreativeTargetJudgeInstruction` 3223, `judgeRenderImage` 3463–3684 (pass rule 3649), attempt loop 5069–5555 (`maxAttempts` 5069, judge call 5478, redo notes 5544–5555), `makeCreativeTarget` 746.
- **Two tries per image.** If the first image fails, the agent re-renders once with the server's exact redo note. If the second still fails, it ships flagged "needs review"; the server does the same.
- **The agent is the judge.** On the server a separate, strict model (Sonnet 4.6, temperature 0, no thinking) judges. The agent judges its own image, so it should hand the judging to a fresh subagent when the host allows, and judge strictly by the checklist, never by taste.
- **Differences:** a server redo is free to the customer; an agent redo is a new paid render, so the agent quotes it first. And the judge's verdict is kept in tags and the batch record, not in "feedback": feedback is the human's channel and it trains the brand's learned rules.

---

# Agent version

## 1. When to judge, and how many tries (`processCreative` 5069, 5459)

| Server mode | Tries | Judged by | Applies here |
|---|---|---|---|
| variation (new ad from a template) | **2** | this rubric (`judgeRenderImage`) | **yes** — every ad made with `composer.md` |
| exact (prompt sent verbatim) | 1 | not judged | no: `ads_render` is technically exact mode, but the agent is reproducing variation, so it applies variation's judge and tries |
| edit / resize | 2 | other rubrics (`judgeEditApplied`, `judgeResize`) | not ported here |
| blueprint POC | 3 | layout reviewer | not used |

Judge **every** render, including the last try, so a lasting failure is flagged. Each ratio is judged and retried on its own.

## 2. What the judge sees, in this order

1. **The generated ad** (the image under review).
2. **Normal path only:** the source template image. Structure-only: never.
3. Each reference that actually reached the image model for this render (the slots of `composer.md` §8.3 after the engine cap), **excluding** the template and the font specimen, in slot order.

Labels, verbatim, each placed right before its image:
```text
GENERATED AD (the image under review):
SOURCE TEMPLATE: the generated ad should reuse this LAYOUT, but its product/branding must be REPLACED with the brand's — not kept and relabeled. If the generated ad still shows this template's original product, set product_ok=false.
TARGET REFERENCE «id» — REAL BRAND LOGO: reproduce this mark exactly.
TARGET REFERENCE «id» — REAL PRODUCT SCREENSHOT: any depicted software UI must faithfully use this interface and remain on a real display surface.
TARGET REFERENCE «id» — SCALE ONLY: use this only to judge the product's true real-world size, never its setting or people.
TARGET REFERENCE «id» — USER-PROVIDED AUTHORITY: the output must follow the prompt's stated use of this exact asset.
TARGET REFERENCE «id» — REAL PRODUCT PHOTO: the featured product must match its shape, parts, proportions, packaging, and label.
```
Roles → labels: `logo`, `screenshot`, `size_reference`, `user_upload`; every other role (`product`, and also `own_ad`) gets the REAL PRODUCT PHOTO label — that is the server's code, keep it.

If the agent cannot view the generated image: the render is **unjudged** (§6).

## 3. The judge instruction (verbatim, assembled)

The server joins these pieces with no separator; each piece after the first starts with its own space. Include each conditional piece only when its condition holds.

1. Always:
```text
Judge this generated ad for the brand "«kit.name»"
```
2. Colour piece — exactly one, or none:
   - applyBrandColors AND the ad has an assigned scheme:
```text
 (this ad was deliberately assigned the colour scheme background «scheme.background», text «scheme.ink», accent «scheme.accent» — judge brand_colors_ok against THAT scheme, and do NOT fault the ad for not using the brand's primary colour. ALL text should be «scheme.ink»: set brand_colors_ok=false if the headline or body is set in a different colour, and text_contrast_ok=false if any text reads weakly against what sits behind it)
```
   - applyBrandColors, no scheme, and `kit.primaryColor` exists:
```text
 (palette «kit.primaryColor»«, kit.accentColor if any»)
```
   - otherwise: nothing.
3. Always:
```text
. Judge strictly on the rubric. The first image is the generated ad; any further images are references to compare against (labeled before each).
```
4. IF NOT applyBrandColors:
```text
 IMPORTANT: this ad intentionally KEEPS the source template's own COLORS (brand color restyling is OFF) — do NOT fault color differences from the brand, and set brand_colors_ok=true. Still judge the logo and the product against the brand.
```
5. IF NOT applyBrandFont:
```text
 IMPORTANT: this ad intentionally KEEPS the source template's own TYPOGRAPHY (brand font restyling is OFF) — do NOT fault font/typography differences from the brand.
```
6. Always:
```text
 Also: reject INVENTED facts not supported by the references — fabricated stats, percentages, guarantees, integrations, or product names (claims_grounded=false); reject any fabricated or illegible app/software UI that is not a provided screenshot (no_invented_ui=false); and verify the ad reproduces the SOURCE's composition and the product's depicted state/action — open vs closed, contents spilling, same arrangement (replicates_source).
```
7. Always:
```text
 CRITICAL — also hunt for image-generation artifacts (these are common and must block the ad): malformed anatomy — wrong finger/hand count, twisted or fused hands, extra/missing limbs, distorted faces (anatomy_ok=false); physically impossible scenes — objects floating or defying gravity, wrong placement or orientation (e.g. a product upside-down or the wrong size/scale for the hand or scene) (physically_plausible=false); a screen/UI on the WRONG surface — any display, app, or image painted on the BACK or closed exterior of a phone/tablet/laptop, or onto a device the source template showed blank/off/from-behind (its screen must stay blank) (screen_placement_ok=false); and hallucinated backgrounds — melted, warped, garbled, duplicated, or nonsensical background regions or objects (background_coherent=false). Inspect the whole frame, not just the product and logo.
```
8. The creative target contract (`buildCreativeTargetJudgeInstruction` 3223), its own pieces joined with no separator:
```text
 CREATIVE TARGET CONTRACT (authoritative): judge the output against this saved target, not against a generic ad pattern.
```
   then, structure-only:
```text
 The source pixels are intentionally unavailable. Do not ask for or infer the competitor's identity, exact photo, palette, typeface, logo, or wording.
```
   or, normal path:
```text
 The source template image is attached separately and remains the visual structure reference.
```
   then:
```text
 Template family: «template_id». Variant: «variant label, or default».
```
   then one of: structure-only with the effective blueprint (`structure-blueprint.md` §6) —
```text
 Required abstract structure: «compact JSON of {layout_archetype, signature_mechanic, text_slots, media_slot, media_position, logo_position, scene, treatment}, absent keys left out».
```
   — or structure-only with only the rendered text: ` Required abstract structure: «rendered blueprint text».` — or normal path:
```text
 Required structure is represented by the attached source template.
```
   then:
```text
 Required brand substitution: «adapted_subject, or: replace the source subject with the brand's appropriate subject while preserving the structural role». Source media=«source_media or unknown»; target media=«target_media or unknown». A valid subject substitution is expected and is not source drift.
```
   then, only if the ad has an assigned scheme:
```text
 Required color roles: background «scheme.background», text «scheme.ink», accent «scheme.accent».
```
   then:
```text
 Set layout_intact=false or replicates_source=false when the output flattens or changes the saved scene/activity, subject framing, spatial arrangement, text placement, media placement, or signature visual device. Different colors or copy alone do not establish fidelity. A generic laptop/device hero is a failure when the saved target calls for a different action, scene, crop, or device treatment.
```

Values come from the ad's own record: `adapted_subject`, `source_media` (structure-only: the blueprint's media slot), `target_media` from `composer.md` §7; the variant label from `composer.md` §6.7 (`hook-question`, … or `default` for variant 0); `template_id` from the template read.

## 4. The checklist the judge fills (`judgeSchema` 3123, verbatim descriptions)

Return one object with every field. Booleans are true/false; set `false` only for a real failure.

| Field | Server description |
|---|---|
| `legible_text` | "All visible text is real, correctly spelled, and readable — no garbled glyphs or lorem ipsum" |
| `text_contrast_ok` (optional) | "Every headline and body text reads with strong contrast against whatever sits directly behind it. Set FALSE for light text over a light photo or light field, dark text over a dark field, a headline in a colour close to its background, or text whose hue nearly matches its backdrop (teal on teal, green on green). True when all text is crisp against its backdrop." |
| `brand_colors_ok` | "Colors plausibly match the brand palette. If the prompt says the source template's styling is intentionally preserved (brand restyle OFF), set this true regardless of the brand palette — the source's own colors are correct." |
| `logo_ok` | "The logo in the generated ad matches the REAL brand logo reference — same wordmark/mark, correctly spelled, not warped, recolored, or invented — AND sits fully inside the canvas: set FALSE if the wordmark or mark is cut off by any edge. If NO logo reference is attached, this is true unless an obviously broken/garbled or edge-clipped logo is shown." |
| `product_ok` | "EVERY visible instance of the featured product matches the attached REAL product photo(s) — same overall shape, parts, structure, AND proportions (e.g. a band's sensor module, adjuster ring, and wordmark; a device's exact form). Set FALSE if ANY single copy of the product is simplified, malformed, missing parts, structurally different, or DISTORTED in shape/proportion from the reference — stretched, squashed, bloated, or with parts resized out of proportion — even when other copies look correct. Also FALSE if the ad carries over the SOURCE template's original product (kept and relabeled as the brand's). Only true when no product photo AND no source template is attached." |
| `layout_intact` | "Composition reads as a finished, professional ad and follows the source template's layout" |
| `no_source_artifacts` | "No text belonging to the SOURCE template's own product/brand/photo/production survives in the generated ad. Set FALSE if any of these appear verbatim from the source (they should have been replaced with the brand's own messaging or dropped): watermarks or source/creator attribution or handles; draft, sample, or sequence labels; certification, compliance, regulatory, or origin marks; or the source product's specific feature, spec, measurement, claim, or packaging callouts. True only when none of that source-specific text remains." |
| `claims_grounded` | "Every factual claim in the ad — statistics, percentages, prices, money-back/satisfaction GUARANTEES, awards, and named integrations or product/feature names — is supported by the brand references or the source ad. Set FALSE if the ad INVENTS specific numbers, guarantees, integration partners, or product names not present in the brand kit or source (a brand/legal risk). Generic benefit language with no specific unverified claim is fine." |
| `no_invented_ui` | "If the ad depicts an app, dashboard, or software UI, it reproduces a REAL provided product screenshot — not a fabricated or illegible interface. Set FALSE if a UI is shown that was NOT provided as a reference, or whose text is garbled/placeholder. True when no UI is shown, or the UI matches a provided screenshot reference." |
| `screen_placement_ok` | "Any screen, UI, or image content sits ONLY on a device's real display face. Set FALSE if a screen/UI is painted onto a NON-display surface — the back of a phone/tablet/laptop, the closed exterior of a laptop lid, a device edge or side — OR onto a device the SOURCE template shows powered-off, blank, or from behind (that screen must stay blank, not be filled with an invented display). This is the 'screen on the back of the iPad' failure. True when every device screen is on the correct face, or no device is shown." |
| `replicates_source` | "The ad reproduces the SOURCE template's composition AND the featured product's depicted STATE/action — e.g. an open vs closed lid, contents spilling/pouring, the same arrangement — with the brand's product swapped in. Set FALSE if the scene only loosely resembles the source or changes the product's state (e.g. source shows pills pouring from an open bottle but the output shows a closed bottle, or unrelated props). Only meaningful when a source template is attached; true otherwise." |
| `anatomy_ok` | "Any people/body parts are anatomically correct. Set FALSE for the classic generation-artifact failures: wrong number of fingers or hands (extra/missing/fused digits), malformed or twisted hands, extra/missing/bent-wrong limbs, distorted or asymmetric faces, or impossible body poses. True when no people are shown, or all anatomy is natural and correct." |
| `physically_plausible` | "The scene is physically plausible. Set FALSE if objects float unsupported / defy gravity, cast impossible or missing shadows, are placed or oriented wrong (e.g. a laptop's SCREEN rendered on the back of the lid while someone types on it, a product upside-down or embedded in a surface, a hand gripping nothing), or the featured product's SIZE/SCALE is wrong relative to the scene or the hand/person holding it (too large, expanded, or shrunken). True when placement, orientation, scale, and grounding all read as real." |
| `background_coherent` | "The background and surrounding scene are coherent and real-looking. Set FALSE for hallucinated backgrounds: melted/warped/smeared regions, nonsensical or garbled objects and textures, repeated/duplicated fragments, structures that don't connect, or gibberish signage/patterns. True when the background is clean and believable (a plain or blurred backdrop counts as true)." |
| `context_fit` | "The featured product makes sense in this scene at a believable real-world scale: the staging fits the product and the product is the correctly-sized, dominant subject. Set FALSE if the pairing reads as nonsensical or off-context (a product forced into a layout meant for a different object), OR the product looks miniature/toy-sized relative to surrounding props even when it is individually undistorted. True when the product sits naturally, in-context, and correctly scaled. This is diagnostic — it captures the 'makes zero sense' / 'not contextually aligned' failure the other dimensions miss." |
| `verdict` | `pass` or `retry` (the judge's own overall call) |
| `notes` | "If retry: one short sentence naming exactly which dimension failed and what to fix" |

**Agent adaptation (strictness).** The server's judge runs at temperature 0 with thinking turned off, because a judge that thinks at length was found lenient (the server code notes "27/38 vs 7/38 caught"). Judge each field on what is visible; do not argue a failure away. If the host can start a subagent, give it only §2–§4 and the images, not the composing conversation.

## 5. The pass rule (`judgeRenderImage` 3649)

```
hardFail =  legible_text == false
         OR text_contrast_ok == false        (an omitted value does not fail)
         OR logo_ok == false
         OR product_ok == false
         OR no_source_artifacts == false
         OR claims_grounded == false
         OR no_invented_ui == false
         OR screen_placement_ok == false
         OR anatomy_ok == false
         OR physically_plausible == false
         OR background_coherent == false
         OR layout_intact == false           (because every ad here has a creative target)
         OR replicates_source == false       (same)

final verdict = "retry" if hardFail, else the judge's own verdict
```

`brand_colors_ok` and `context_fit` never force a retry by themselves; they count only through the judge's own `verdict`.

## 6. After each judgement (attempt loop 5459–5555)

| Situation | What happens |
|---|---|
| final verdict `pass` | Stop. This image is the ad. |
| `retry` on try 1 | Re-render once (§7). |
| `retry` on try 2 (the last) | Stop. The **last** image ships, flagged `needs_review`. |
| Unjudged (image could not be viewed, or the judge step failed) | Treated as pass, **no retry**, flagged `needs_review`. |

The server always ships the most recent try. **Improvement, not server behaviour:** when try 2 fails more checklist items than try 1, show both and say which the server would have kept.

## 7. The retry (5544–5555)

Same images, same engine (if a content-policy fallback happened, stay on the fallback), same ratio. The prompt is that render's **base prompt** (the final prompt for that ratio, including any CANVAS ADAPTATION block, `composer.md` §10) plus one note.

`copyFailed` = `claims_grounded == false` OR `legible_text == false`.

IF copyFailed:
```text
«base prompt»

The previous attempt's COPY failed review: «notes». REWRITE the ad copy to fix exactly this: delete any fabricated claim, statistic, percentage, guarantee, or superlative and any garbled/unreadable text, and replace it with grounded, benefit-driven wording (or drop that line entirely). Do NOT reproduce the flagged wording anywhere. Keep the layout, product, colors, and composition identical.
```
ELSE:
```text
«base prompt»

Previous attempt failed review: «notes». Fix exactly that; change nothing else.
```
(`«notes»` is the judge's `notes` field as written.)

**Cost (Agent adaptation).** On the server, retries are paid by GooseWorks. With `gooseworks:ads_render` every retry is a new paid render. Before the first render, tell the user one retry per image may be needed at the same price. Before each retry, run `ads_render` with `dry_run: true`, and render only within a total the user agreed to; otherwise stop and ask.

## 8. What to record

The server keeps the judge's full trace on the render itself (`input_snapshot.attempts[].judge`, `judge_verdict`, `judge_notes`, `quality_flag`); it never writes the judge into user feedback. An agent cannot write the render record, so:

1. **Batch record (the record of truth).** Per render: try number, the exact prompt sent, the image URLs in order, the engine, the render id, every checklist value, `hard_fail`, the final verdict, the notes, and `needs_review` or `unjudged` with its reason. Mark try 1 as superseded when try 2 exists.
2. **Tags on the creative**, with `gooseworks:ads_creative_update { brand_id, creative_id, patch: { tags } }`. Tags **replace** the whole set, so read the current tags with `gooseworks:ads_creative_read` first and add to them. Lower-case only: `judge:pass`, `judge:needs-review`, `judge:unjudged`, `try:1`, `try:2`, `superseded` (on a try-1 creative that was redone). The batch record still holds everything.
3. **Do not write the judge into `patch.feedback`.** Feedback is the human's channel: its comments and reason chips are distilled into the brand's learned rules (`feedback-learning.service.ts`), and its reason chips drive the recurring-rejection directives (`composer.md` §6.5). Writing the agent's own verdict there would teach the brand rules from the judge, which the server never does.
4. **When the human gives a verdict**, record it in their words:
```json
{
  "brand_id": "«brand_id»",
  "creative_id": "«creative_id»",
  "patch": {
    "feedback": {
      "render_id": "«render_id»",
      "rating": "happy | neutral | sad",
      "comment": "«the human's words»",
      "reasons": ["wrong_product", "brand_or_logo_wrong", "off_brand", "text_garbled", "weak_copy", "ai_or_distorted"]
    }
  }
}
```
(`reasons` only those the human named; `happy` only on the human's explicit approval.)

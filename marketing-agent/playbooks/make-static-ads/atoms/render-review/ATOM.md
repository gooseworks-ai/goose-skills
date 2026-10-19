---
name: render-review
description: Internal step of make-static-ads. Reviews every generated ad render against the static rubric, following the shared honest-review principles; proposes quoted remakes for weak ones (made only on a yes), drops what still fails, and records each verdict.
---

# render-review

How to review and report — by eye vs automatic read, unseen items, remakes, records — is `../../../../atoms/honest-review/ATOM.md`. This atom adds the static specifics.

**Reads:** each render (`gooseworks:ads_creative_read` with `creative_id`, `include: ["renders","plan"]`), the product photos, the copy rows and prompt fences, `references/review-rubric.md`.
**Writes:** a verdict per render; feedback on each creative; the drop list.

1. **Look** at each render at full size where the host can show it (a shell host can download it); read every word letter by letter; compare the product with the real product photos. Otherwise use its automatic read (`gooseworks:media_analyze` `action: "read"` where the render is a registered asset) and label the ad "not checked by eye" with a three-item checklist.
2. **Pass B** (`claims-extract`) on what was drawn, then rubric checks 2–21 in order; stop at the first BLOCK.
3. **Remakes:** a wrong render or a single garbled word → an `gooseworks:ads_generate` remix with `source.creative_ids` (+ `render_id`) and the corrected prompt fence, dry-run first, quote shown as given, made on a yes. Two tries, then drop the ad and say why.
4. **Extra placements** on approved renders: the same quoted remix with the new ratio on the item.
5. **Record** with `gooseworks:ads_creative_update` feedback per honest-review §5; tag each surviving creative once (read its tags, merge, write the full set, lower-case — `references/handoff-format.md` §2).

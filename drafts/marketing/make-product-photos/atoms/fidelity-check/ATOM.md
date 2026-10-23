---
name: fidelity-check
description: Internal step of make-product-photos. Checks every passed or flagged output against the curated real photos with a fixed rubric (honesty first), using the engine's own output fields, labels who checked what, and gives a keep / maybe / reject verdict with a named reason.
---

# fidelity-check

**Reads:** outputs (`gooseworks:photos_read` `generation_id`: `status`, `final_image_url`, `quality_score`, `final_defect_code` / `final_defect_message`, `suggested_control_change`, `credits_charged`, `media_asset_id`; generation `ratio`, `overridden_controls`), the reference inventory, the style card or anchor, `references/fidelity-rubric.md`.
**Writes:** a verdict per photo, a three-item checklist where not checked by eye, re-shoot proposals; after the human's pick, `photos_update` actions.

1. **Calibrate** on one real product-only photo (would you reject it? then loosen).
2. **Engine fields first:** show `flagged` outputs with their defect message; note the `quality_score`; a `workflow_error` with nothing charged is infrastructure, not quality.
3. **Rubric** for each `passed` and `flagged` output against the same-angle usable photo: F12 honesty → F2 parts → F3 logo → F4 text (by eye) → F1 silhouette → F5 colour → F7 scale → F9 hands/bodies → F8 physics → F10 background → F6 finish → F11 AI look → F13 house style. Stop at the first blocker.
4. **Seeing vs not:** "can see" → view `final_image_url` beside the reference, zoom on logo, label and hands, record "checked by eye". "Cannot see" → `gooseworks:media_analyze` on the output's `media_asset_id` and on the same-angle reference; compare field by field (counts, label text, colour words, product and size, extra things in frame — `references/fidelity-rubric.md` §4); report each mismatch specifically; label "not checked by eye"; a three-item checklist for what the reads could not settle. Principles: `../../../../skills/honest-review/SKILL.md`.
5. **Verdict:** keep (fills slot n) · maybe (minor issue named) · reject (named reason + specific note).
6. **Re-shoot:** a new priced call, offering the engine's `suggested_control_change`; quote and ask.
7. **After the human picks:** approve only their keepers; archive rejects with **no** reason (a reason becomes a brand-wide "dont"); a rule the human states goes through `../../../../skills/save-learning/SKILL.md`; unpicked photos left alone.

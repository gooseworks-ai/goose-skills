---
name: video-production-harness
description: Full video production sequence with script review, actual ingredient choices, controlled generation, editing, evidence-based quality review, polish, captions and delivery. A host binding supplies project storage, authentic approvals, provider access and billing.
owner: team
status: active
version: "3.1.0"
level: orchestrator
category: video
---

## Non-negotiables (every state, every host)

1. **Copy the reference.** Study the whole reference, picture and sound. Keep its people, action, camera, hook, length (±25%) and its shot and setup counts (±30%, from `scripts/reference_shots.py`); list every change in `changes_from_reference`, shown first at the script approval.
2. **Match its sound and pace.** Speech, music and effects follow the reference. Silence only when the reference is silent or the owner asks for it. Never a sine tone, a drone or an empty track. `scripts/reference_rate.py` measures the reference's words per second (never estimate it); a voice more than 10% slower is regenerated or sped up (at most 1.25×) before lip-sync and picture timing.
3. **People and demos stay people and demos.** Plan a person, hands or a live demonstration in the reference as one; never plan a text card, dots or a still in its place. One that ends up on screen anyway is an `ask` finding you recommend fixing.
4. **The script comes from write-video-ad-script.** Fetch it with catalog_fetch; never write the script inline.
5. **Use the real product.** Its real photos, its real size and its usage steps. A still packshot gets the real photo through `overlay`. A pack held or used on screen is made with `openai/gpt-image-2/edit`, the real product photo as reference image 1, front label facing the camera. A blank, unprinted or label-less brand pack is must_fix. Every use step and product state (dry contents, cooked dish, strip on the nose) comes from a real brand photo sent as a reference.
6. **Keep the approved look.** Camera, focus, lighting, texture, setting and finishing follow the brief/reference. Phone realism belongs to phone footage; studio, cinematic, stylized and animated formats keep their own look. Preserve product truth and plausible anatomy in every format. Use [libraries, look and rubric](references/libraries-look-and-rubric.md).
7. **Review the final against the reference,** listened or measured, never claimed. `scripts/qc_evidence.py` must exit 0 on the exact final bytes (it fails only a broken file); then mark the video complete and read the host's final check.
8. **Two owner approvals, both in this chat:** the script and the ingredients. In `review_mode: auto` one yes to the full total covers both (see [check severity](references/check-severity.md)). Agent checks add no other approval step.
9. **Quality warns, never blocks.** Every finding is `must_fix` (always redone, never delivered), `ask` (shown with the price of the fix; in `review_mode: auto` you decide) or `fine` (kept). Only money, consent, safety and broken files stop the run. A redo is paid from the approved total when it fits, otherwise after a new yes to its price; never drop a scene. See [check severity](references/check-severity.md).

**Reading rule.** Read one file per call. If the output says it was truncated, re-read that file in parts before acting.

# Human version

Make and revise videos from a sourced brief and a reference, with real product assets, a deliberate voice and visible proof. Review the script, the ingredients and the exact final file. Keep earlier cuts and the decisions needed to resume.

---

# Agent version

This is the full production sequence used by Studio and customer video hosts. The host supplies its connection instructions; the production decisions and steps live here once.

Read `capabilities.md`, the host binding and `orchestrator.md` before starting. The host binding is the entry skill that loaded this package (for GooseWorks: make-custom-video). `orchestrator.md` is an index; it links one file per group of states. Read each step file when the sequence enters it. A missing capability, approval or dependency blocks that operation; do not invent a tool or a successful status.

Before planning scenes, open [the shot-routing guide](references/shot-routing.md) and the genre card it names for the brief (AI creator UGC, narrator over a montage, motion graphics, hypermotion, chat UI or product demo). Open them again when making or re-rolling a clip. Use [Creator Grammar](references/creator-grammar.md) for cuts, pacing, captions and sound.

Before reference study, handoff and final review, read [creative contract and review](references/creative-contract-and-review.md). Before choosing a voice or model, or editing speaking footage, read [speech and route qualification](references/speech-and-route-qualification.md). Read [product scale and world](references/product-scale-and-world.md) when product size, use or capacity matters, and [libraries, look and rubric](references/libraries-look-and-rubric.md) for people, sound, camera, light and overlays. Read [the editorial review guide](references/editorial-review.md) before reviewing or revising a cut. Read [check severity](references/check-severity.md) before acting on any check, review note or redo.

For generated people speaking to camera, read [talking-actor production](references/talking-actor.md): three new actor options when needed, playable voice auditions before selection, and a qualified speaking route. Other scenes keep their own format and sound. Show ambiguous deliverable choices briefly before paid work; report one short status line per milestone.

The portable scripts give local assembly and measured evidence. `scripts/qc_evidence.py` fails only a broken final and reports every other measurement as a graded finding; its pass never approves the creative.

For an existing-footage request, use the host's search and real-frame inspection, freeze the original identity, revision, excerpt and audio in the script and ingredients, and follow the same approvals. Read the stored-footage contract in `capabilities.md` first. A selected original does not authorize buying a generated replacement.

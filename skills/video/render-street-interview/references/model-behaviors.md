# Human version

**Summary.** These are the model lessons needed to prepare and review a street-interview take. Use the current recipe for its single-take or episode mode, question, product facts and generation settings. Model notes and historical seeds cannot certify new faces, props, continuity or audio.

This file is bundled with `render-street-interview`. It distils Studio's shared model notes and street take history at source revision `1db6399e0cb75f52cd876a818475abdc6cf09c23`; the private Studio files and original experiment footage are not execution prerequisites.

---

# Agent version

## Required reading and approval

Read this guide and the renderer entry before any paid generation. If a required package/file cannot be opened, stop and name it. The current recipe and approved project brief govern production; `REFERENCE.md` and `READINESS.md` retain historical experiments that may describe older modes or untested proposals.

Use the recipe's product reference and declared reference bindings. Do not add an avatar/person reference. A scene reference, when the selected mode supports one, must follow the current recipe's face-cropping and review rules. Earlier successes do not guarantee provider-policy acceptance. Terminal rejection stops the run; recover existing requests after transport timeouts instead of resubmitting.

## Prompt lessons

- **State the place per shot.** People, light, the corner and props can drift across cuts or takes. Explicit restatement reduces drift but is not a continuity guarantee.
- **Assign hands and objects separately.** Keep the microphone and product physically supported. Constrain each hand; inspect for fused props or extra limbs.
- **Define scale and framing.** An occlusion described as covering the camera can become a full-frame obstacle. State its position, size and duration. Small subjects in reference frames can be reinvented rather than preserved.
- **Name cuts plainly.** Words such as "morph", "split" or "dissolve" can become visible transformations. Use the selected format's cut grammar instead of accidental transition language.
- **Deep focus fits this format.** Keep the street legible; cinematic blur and a sustained near-still pose can undermine the intended phone-footage register.
- **Product facts belong to this project.** Questions, correct answers, dimensions and label claims must come from the bound product and its supporting evidence. Never copy another brand's take into the current defaults.

## Prompt length guidance

[BytePlus recommends at most 1,000 English words](https://docs.byteplus.com/en/docs/modelark/create-video-generation-task-api)
because longer prompts may miss details. [Fal's current reference-to-video schema](https://fal.ai/api/openapi/queue/openapi.json?endpoint_id=bytedance%2Fseedance-2.0%2Freference-to-video)
does not declare a maximum prompt length. These sources were checked on 2026-10-03;
absence of a declared limit does not establish unlimited acceptance.

The renderer prints an advisory above the recommendation, without refusing solely on
length. The former 1,200-word gate came from a historical observation, not a demonstrated
failure boundary. Keep mandatory constraints and exact approved speech. Do not silently
shorten the brief or buy a retry to hit a count. Structural validation and spend approval
still apply; inspect the actual generated result for missed instructions.

## Resolution and reference limits

Historical Studio runs observed different likeness-policy outcomes at different resolutions. Do not state that 720p bypasses a classifier or that a successful preview certifies 1080p. Use the approved recipe tier; do not add a paid test or tier change without approval.

The documented product-reference approach avoids uploading a person's identity as a reference for this format. It does not remove the provider's policy or prove that every generated face looks natural.

## Review the rendered result

Check the actual shots for product scale and print, hands, gestures, cast, microphone, location, light and continuity. For episodes, review every join and its ambience. Keep project-specific successes and limitations in that project's take ledger; a seed is evidence, not a guarantee.

Run the local gate on the final timeline and then watch/listen to the complete cut. Automated timing, loudness and safe-zone checks do not establish face realism, intelligibility or natural performance. An unlistened-to output must not be described as audio-reviewed.

Use a real project reference only when opting into positive-strength colour matching. The default zero-strength finishing path does not require Studio's experiment files. Grading and local tests cannot prove generated-video quality.

## Billing and recovery

Use the current estimate and the user's existing spend approval. Dated source-run dollar figures are not current credit estimates. Keep the request ID, approved prompt hash and seed. Resume a submitted request after a timeout; do not fire a duplicate to recover a missing result. Do not assume policy failures are free.

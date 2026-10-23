---
name: review-render
description: Internal step of make-video-ads. Reviews a finished video against the approved script, following the shared honest-review principles — transcript, sampled scenes, on-screen text, key frames and the engine's check — reports findings for the human to confirm, and proposes priced, targeted fixes only for confirmed defects.
---

# review-render

How to review and report — what was perceived, findings to confirm, unseen items, remakes, records — is `../../../../skills/honest-review/SKILL.md`. This atom adds the video specifics.

**Reads:** `gooseworks:video_read` `include: ["renders","recipe","scenes"]`; `gooseworks:media_analyze` `action: "read"` on the final render's `asset_id` with the `project_id`; the approved script and claim trace; `references/review-rubric.md`.
**Writes:** the review note; fix proposals; fixes via `gooseworks:video_fix` after a yes.

1. **Wait for the analysis** if it is queued or processing (free; read again later); failed → `action: "retry"` (free).
2. **Transcript vs approved lines:** list differences; a mismatch may be the speech-to-text — flag it for listening, not as proven.
3. **Scene walk:** each sampled shot shows what its line is about (the right product for the right line); on-screen text spelled right; no picture implying a result; a generated person speaking about using the product carries a label that rendered (speaker test); end card and grid text match what was approved. Supers absent from the read are "not seen in sampled frames".
4. **Frames:** look at key frames when the host can show them (a shell host can download the render); say when you could not.
5. **Engine check:** translate its result into plain words; "passed" covers files, not taste or claims.
6. **Note to the human:** each finding as "the automatic read shows X at <time> — please confirm", then what only they can judge (motion, voice, pacing, music, overall feel) and "please watch the first three seconds and every product shot".
7. **Fixes:** only for defects the human confirms, with the new words shown and the price as the engine gives it, made on a yes; two rounds. `video_fix` changes scenes (`line` / `on_screen` / `picture`), remakes a bad take, or changes voice or music; end-card or grid text from the plan's `answers` cannot be changed on a finished video — that needs a new draft (`video_create` `like` or `video_batch` `more_like`) and `video_change` `answers`, priced.

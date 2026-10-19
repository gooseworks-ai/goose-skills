---
name: video-production-harness/states/edit-to-delivery
description: States 7 to 11 of the shared video production sequence — assembly, opening review, full review against the reference, polish, captions and delivery, and wrap.
---

# Human version

The end of the run: assemble the cut on a source-linked timeline, check the opening, review the whole final against the reference, polish, burn captions, check the exact final file and deliver. Then write the recipe and the learnings.

---

# Agent version

Part of [the orchestrator](../orchestrator.md). Its non-negotiables, approvals and decision policies apply. Read one file per call; if the output says it was truncated, re-read it in parts before acting.

### State 7 — Edit video
1. Follow [edit-video.md](../edit-video.md) and assemble a labeled candidate from the current clips (no open `must_fix`, or the best flagged take the customer is deciding on) with `../scripts/assemble.py` and an `assembly_timeline` ([recipe format](../references/recipe-format.md)). A custom video has no other stitcher.
2. Branch on the resolved speech_mode and soundtrack_modes before any source selection, retiming or mix. Keep native speech and exact audio-driven performance; no-speech work keeps its separately planned sound.
3. Keep intended emphasis, timing, grade, SFX limits and revisions such as music level or cue changes. Measure the output instead of trusting gain constants.
4. Follow [promote.md](../promote.md) to register the candidate, asset and version lineage through the binding. Keep earlier versions. Completion and pinning wait for the final check.
5. Validate the binding's render, asset and version links and save the true state. The binding supplies the pick transaction; never simulate it with a local master copy.

### State 7.5 — Opening and compatibility review
1. Run on the first stitch and on every changed opening, including visual-only changes. It may share the saved review with State 8 but cannot be skipped because the old script passed.
2. Follow [hook compatibility](../references/hook-compatibility.md): save the baseline promise, proof and payoff, and classify a same-promise opening swap versus a changed-promise recut before any new spend.
3. Review the opening muted and with sound at normal speed when your tools can, then its link to the body and ending. Hook scores are hypotheses, not measured performance.
4. Route an unsupported promise to concept or script, missing proof to production, sequence problems to edit and local defects to repair. Never auto-select the highest score.

### State 8 — Review against the reference
1. Follow [review-video.md](../review-video.md) on the selected candidate id and checksum, with the rough or fine stage recorded. Save what the cut actually says before comparing it with the brief and the reference.
   - **7a:** technical evidence plus product, action, text and source-alignment checks. Real people, worlds and sound switch their checks on.
   - **7b:** intended versus received story, pacing, brand and platform fit, creator shotcraft and performance. Required voice, product, action and sync checks cannot be switched off by genre or an aggregate score.
   - **7c:** merge every report into `review-notes/<idx>-<timestamp>.md` with P0/P1/P2 sections, the shape auto-fix consumes.
   - **7d:** for every visual claim, re-extract the frame at its timecode and verify it; unverified claims are `claim:unverified`.
   - **7e, complete-cut review.** Required before APPROVED. Run `python3 ../scripts/qc_evidence.py master.mp4 evidence-review-N --timeline <receipt> --words <words> --script <script> --reference <reference.mp4>`. It exits 1 only on a broken file (unplayable, wrong length, no sound when sound is planned), so fix that first; grade its other `findings` by [check severity](../references/check-severity.md). Compare the whole cut with the reference beat table and the storyboard. Record `listened`/`watched` only when you did; otherwise `measured`. Bind the review to the current output, source, timeline and contract hashes.
2. Branch on the result:
   - **APPROVED:** a rough cut moves to fine-cut questions; after the fine cut passes, go to State 9.
   - **NEEDS REVISION:** follow the diagnosis: State 1/2.5 for concept or script, State 3/5 for missing coverage or performance, State 7 for sequence, State 6 for local defects. Use [auto-fix-from-review-notes.md](../auto-fix-from-review-notes.md) only for deterministic local repairs, then review the new candidate against the original conditions.
   - **INCOMPLETE:** the file is broken or the source is missing. Save the evidence, fix the file, and never call it approved.
3. **Loop guard:** loop only while a `must_fix` is open, at most 3 rounds. Then show the customer the best version with its open finding and the price of another redo; they choose another paid redo or keep it.

### State 9 — Polish
1. Follow [polish.md](../polish.md) in `polish-and-fix` mode: technical evidence and the end-card readability check first, then polish notes on loudness, captions, music and VO balance, end card, tail, hook, colour, brand fit and VO intelligibility; must_fix (P0) and free ask (P1) fixes go through auto-fix and produce `edits/master-polished.mp4`.
2. Check the full performance and mix, mouth and source alignment, exact words and joins, product and action, and the planned sound. An ASR or loudness result never replaces missing perception.
3. Show before and after with each note's outcome on the existing candidate surface.

### State 10 — Deliver
1. Burn approved captions on the polished picture as the last visual step: `caption-burn` (superseded; agent-built path; the kit path uses captions-layer), which needs no libass, or the packaged ASS path with verified libass and fonts. The style comes from the brand brief.
2. Check caption spelling, word timing, safe areas, text-heavy scenes and collisions with the end card, offer or logo. Probe the final file: a 9:16 delivery is 1080×1920 at both tiers (Standard's 768P picture is scaled up with lanczos, [edit-video](../edit-video.md) Phase 8).
3. Export MP4 (H.264 + AAC). `../scripts/qc_evidence.py` must exit 0 on the exact bytes (the file is not broken). Bind the hash and revisions.
4. Build each ratio, cutdown or language from editable sources with its own caption layout, and review each output at destination size, ending included. A parent master's check does not clear a derivative.
5. Show the captioned master and variants for the host's delivery decision; follow [promote.md](../promote.md) to complete and select. Mark the video complete and read the host's final check (never send the final or its frames to a vision model yourself). Act on its findings by severity: fix a `must_fix` (a redo is paid from the approved total when it fits, otherwise after a new yes), settle `ask` items, keep `fine` ones. A `must_fix` the customer chose to keep is recorded with their words.
6. Publishing to an outside channel needs explicit authorization through an available publishing capability.

### State 11 — Wrap session
1. After delivery, follow [wrap-session.md](../wrap-session.md) and save as reviewable artifacts: **reproduction_recipe** (how to remake this kind of video), **learnings** (one entry per iteration that changed the master, TL;DR of 3 lessons) and **improvement_proposals** (concrete diffs; never auto-applied to shared skills).
2. A failed run still produces learnings and proposals, but no recipe.
3. The operator picks which proposals to apply. The run then ends.

## Output

- A populated host project and temporary folder with registered media, review evidence and provenance.
- An updated `## Decision log` in `implementation_brief`.
- A status file `<video_folder>/project_state`:

```json
{
  "current_state": "REVIEW",
  "completed_states": ["PREFLIGHT", "BRAINSTORM", "DESIGN_BRIEF", "SCRIPT_LOCK", "STORYBOARD", "CHARACTER_LOCK", "CREATE_CLIPS", "EDIT_VIDEO", "SCROLL_TEST"],
  "review_iterations": 1,
  "last_human_gate": "STORYBOARD",
  "blockers": [],
  "preflight_status": "PASS",
  "character_lock_method": "anchor-ref",
  "provider_events": [
    {"state": "CREATE_CLIPS", "scene": "07", "primary": "fal", "primary_model": "fal-ai/veo3.1/fast/image-to-video", "fallback_used": true, "fallback_model": "bytedance/seedance-2.0/image-to-video", "reason": "job_status=failed: dark plate rejected", "ts": "..."}
  ]
}
```

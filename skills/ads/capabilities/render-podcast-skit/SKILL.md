---
name: render-podcast-skit
description: Render a two-host podcast ad from a brand config and dialogue script. Includes the working planner, full-frame and split-screen assembly, captions from measured character timings, brand end card, approved paid-step adapters, and 65 quality-check falsification cases. Use for short conversational ads with two stable hosts in one room.
owner: team
status: active
version: 2
updated: 2026-10-05
---

# Human version

This package contains the working two-host podcast pipeline, examples and
quality checks. It plans and renders the edit for free. Voice, image and
lip-sync generation use the separately installed provider capabilities.

---

# Agent version

## Inputs and prerequisites

Read the bundled scripts README first. All relative paths in that guide refer
to this installed skill folder. Keep the brand config, dialogue script and
outputs in the brand project outside the package. Never edit the examples in
place. Install the required sibling capabilities and prepare Python, Pillow,
requests, ffmpeg, ffprobe, a caption font and the real brand wordmark or font.

Choose the conversation's tone, room, host dynamic and host appearances with
the user. Write fresh dialogue for the brand and respect its claim guardrails.
Choose an arc from the bundled menu and actually write that turn structure.
Match each confirmed voice to its host before generation; save the voice's
name and gender with its ID. The voice picker accepts an exported library so
it can propose matches without reading account credentials.

## Workflow

1. Copy the examples into the brand project and replace their fictional
   product, cast and dialogue. Supply the brand assets, or disable optional
   supplied-asset layers until those files exist.
2. Use the bundled driver for a free preview. Review the script, caption
   layout, cut pace and full-frame or split choice before generation.
3. Generate each approved voiceover beat with character timings. Measure the
   audio and re-plan the timeline before lip-sync. Timing files must share the
   audio's stem; guessed caption times are unsuitable for delivery.
4. Lock one wide two-host plate and crop both singles from it. Review the
   plate before spending on clips. Hold the approved cast through reference
   edits; independent host generations can drift into different rooms.
5. Generate each beat's lip-sync with its own audio. Split edits also require
   a silent idle clip per host, so the listener does not visibly speak.
6. Assemble and check the finished render, then watch it end to end. Run the
   bundled self-test to prove the checks reject their known-bad inputs.

## Non-negotiables

Paid commands print cost by default. Both confirmation and execution flags
are required after explicit approval. Preserve completed audio and timing
responses when resuming. Never re-bill a completed beat to recover a missing
local file. Motion inserts are unimplemented and fail explicitly if enabled.

Captions follow the voiceover's own character timings. Brand type comes from
real files. Review identity, voice fit, room continuity, lip-sync, caption
safety and the brand card on the finished video. A preview or package check
alone does not establish final creative quality.

## Related

[[composes::create-vo-elevenlabs]], [[composes::create-image-gpt-image-fal]],
[[composes::create-video-fal]], [[composes::watch]].

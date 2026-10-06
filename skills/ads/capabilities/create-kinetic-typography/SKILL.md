---
name: create-kinetic-typography
description: Render a deterministic text-only video ad from approved copy, font, colors, timing and CTA. Use when a brand needs an animated message without product photography or a creator.
tags:
  - ads
---

# Kinetic typography

Render approved text as a silent video using the bundled renderer. No generation service is required. Review the complete copy and motion before delivery.

## Inputs

The configuration contains an even canvas size, frame rate, local font file or automatic system font, background/text/accent colors, text beats and a final CTA. Each beat has text, duration in seconds and an animation: punch, typewriter or rise. The renderer's help describes its arguments. The example configuration is a neutral layout sample; replace every creative value with the approved brief.

## Workflow

1. Lock supported copy, CTA and brand styling. Ask only for unresolved creative choices.
2. Write the configuration. Hold every beat for 1.5–10 seconds and allow at least three seconds for the CTA. Long copy is wrapped; excessive lines or an oversized word are rejected. Split copy into more beats instead of shrinking it.
3. Render the video and optional contact sheet with the bundled renderer. It uses Pillow and ffmpeg and makes no paid calls.
4. Inspect the full video and sheet: readable holds, safe text, intact letters, correct colors/font and complete ending. Review motion as well as held frames.
5. If audio is requested, use a supplied cleared track or separately approved generation. Its cost and final audio check are additional to this silent format.

## Output and checks

The output is an H.264 video, a render manifest and an optional contact sheet. Text stays in the central safe region. Verify dimensions, duration, beginning, animation settles and final CTA. A rendered manifest establishes media production; final creative acceptance requires viewing.

## Failure modes

Missing fonts fail clearly; an explicitly supplied font is never substituted. Short or crowded beats fail before rendering. Provide shorter copy or more beats. This complete-video renderer supports three motions; the canonical overlay workflow also describes other effects, which are not promised by this command.

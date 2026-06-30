---
name: stitch-videos-ffmpeg
description: stitch video segments with ffmpeg concat, xfade, overlay, audio mux, and export settings.
---

# stitch-videos-ffmpeg

## Purpose

Stitch video segments with ffmpeg concat, xfade, overlay, audio mux, and export settings.

Implementation status: refactored from existing repository skills. The workflow consolidates behavior that previously lived across larger skills.

Sources: ad-studio, voiceover-product-ad, ugc-product-video, voiceless-music-transformation-reel, product-stopmotion-ad.

Extraction notes: assembly and composite scripts.

## Inputs

- A clear user brief or source asset path.
- Brand, product, audience, platform, and approval constraints when relevant.
- Required credentials or provider access for any external service used by this skill.
- Output directory or test-run directory where artifacts should be saved.

## Workflow

1. Read the brief and confirm all required inputs are present.
2. Load any referenced files in this skill folder only when they are needed.
3. Run the provider, script, or planning workflow described by this skill.
4. Save outputs under the requested output folder or `skills/test-runs/<timestamp>/<skill-name>/` during tests.
5. Write or update a `manifest.json` for executable runs with status, provider, outputs, warnings, and errors.

## Output

- Primary artifact or written plan requested by the skill.
- `manifest.json` for executable runs.
- `verification.md` or a short verification summary that names the checks performed.
- Any generated source assets, intermediate files, or final exports in the run folder.

## Quality Checks

- Required files exist and paths in the manifest are valid.
- Output matches the requested format, platform, duration, dimensions, or text structure.
- Brand claims, captions, on-screen text, and CTAs follow the provided brand rules.
- Provider failures, skipped integrations, and human-review needs are explicit.

## Failure Modes

- Missing credentials, provider access, or source files.
- Output does not match requested dimensions, duration, structure, or brand constraints.
- Generated media contains artifacts, unreadable text, unsafe claims, or caption collisions.
- Scaffolded skills cannot run production workflows until implementation details are added.

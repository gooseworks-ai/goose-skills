---
name: video-production-harness/preflight-audit
description: Verify every asset, capability and brand-vars token resolves correctly BEFORE any generation runs. Catches the LFS-pointer / .avif / unresolved-token failures that cascade through the pipeline. Step 0 of the pipeline.
---

# preflight-audit

Follow the [orchestrator](orchestrator.md)'s host contract and [creative contract and review](references/creative-contract-and-review.md).

## Purpose

Files that look fine can be 132-byte Git LFS pointers, `.avif` images an API rejects, or briefs with unrendered `{brand_token}` placeholders. This step runs every free, deterministic check before generation. Any P0 blocks; P1 warns.

## When to use

- **State 0**: before brainstorm if `<video_folder>` already has assets, or after `create-design-brief` once `assets_manifest` exists.
- Again in `create-clips` Phase 0, since new assets land between states.
- Whenever new brand assets are added to the host catalog.

Use real media probes, image decoding and host capability checks. No audit script is assumed installed.

## Inputs

- `<video_folder>` (required).
- `<assets_manifest>`: the `design_brief` section listing every image and video the pipeline uses. If absent, scan the host's registered assets.
- The capabilities the approved plan needs: generation, voice, transcription, media inspection, storage and local rendering.

## Checks

### P0: block on any failure

| Check | What it does | Why |
|---|---|---|
| `lfs-pointer-check` | Inspect bytes for the Git LFS pointer signature and decode each raster image. Parse SVG as SVG; text output is expected. | A pointer ref makes an image model fall back to prompt-only output, invisibly. |
| `avif-rejection-check` | Fail on any `.avif` ref. | Image APIs return 400 on `.avif`. |
| `capabilities-ready` | Confirm host authentication and each required operation without printing credentials. | Otherwise the run fails halfway with a vague "unauthorized". |
| `brand-vars-unresolved` | Render each brief and brand-vars file once and search for `{[a-z_]+}` placeholders. | "DARK CHARCOAL #{shirt_hex}" in an image prompt causes silent drift. |
| `review-perception-ready` | Resolve a reviewer that can watch and hear, or plan a `measured` review backed by `scripts/qc_evidence.py` and the host's final check. Extraction or speech-to-text is not listening. | A review marked `listened` without listening is false; a `measured` review is honest and needs no such claim. |
| `product-photo-binding` | The real product photo (and each use-state photo) is attached after provider caps and filtering. | A correct logo in prose cannot replace the real product reference. |

### P1: warn, don't block

| Check | What it does |
|---|---|
| `image-dimensions-sanity` | Every ref is at least 512×512; smaller refs degrade output. |
| `creative-contract-consistent` | Match reference_map, adapted copy, picture and direction, proof and action, sound and the current host revision. A contradiction or a missing essential beat is an `ask` finding for the script approval. |
| `product-scale-known` | Resolve real dimensions, use and capacity. Unknown size is an `ask` finding: ask the customer, or use a sourced size, before scenes that show scale. |
| `gitattributes-lfs-tracked` | Report which extensions `.gitattributes` tracks in LFS, so the operator knows when to pull. |
| `vo-script-length-vs-target` | Estimate speech duration from the word count at the reference's rate from `scripts/reference_rate.py` (2.8–3.2 words/s when it has no speech). Warn when it is over or under the design-brief target by more than 25%. Also warn when that target is more than 25% off the reference's length and `changes_from_reference` has no `length` entry: list a `length` change if this is intended. |
| `approved-voice-check` | Warn if the design brief names a voice ID not in the host-approved voice catalog. (The hard fail is in create-design-brief.) |

## Executable readiness

Before paid work, run the selected FFmpeg and FFprobe binaries on one real planned input; a binary that exists can still fail at startup. Record the executable, version and result. For a selected specialist, run its documented free dry run or browser launch and close in its own environment. A failed probe blocks that route before spending. Never silently install or change global media tools.

## Workflow

1. Read `assets_manifest` from `design_brief`; if absent, scan the host's registered source and brand assets.
2. Inspect real bytes, FFprobe and image metadata, required capabilities and unresolved brief variables. Use `scripts/qc_evidence.py` for video evidence where it applies.
3. Save each check and its observed result in the host audit artifact.
4. Write `<video_folder>/preflight/audit-<ts>.md`:

```markdown
# Pre-flight audit — <video name>

- **Run:** <ISO timestamp>
- **Status:** PASS | FAIL
- **P0 failures:** N
- **P1 warnings:** M

## P0 — must fix before any generation

- `clips/raw-materials/marcus-anchor.png` — Git LFS pointer (132 bytes). Run `git lfs pull` or replace with a real PNG.
- `source/logo.avif` — `.avif` rejected by the image API. Convert to PNG/JPG.

## P1 — warnings

- `source/headshot.jpg` is 320×320 (< 512×512 recommended).

## Resolution

Fix every P0 item and repeat this audit before generation.
```

5. **Block on every P0.** Local override flags and agent-written decisions cannot bypass missing capabilities, broken media, authentication, ownership or paid approvals. A revised plan may drop a blocked dependency only with the owner's approval.

## Output

- `<video_folder>/preflight/audit-<ts>.md` (always).
- `<video_folder>/preflight/manifest.json`, machine-readable, read by the orchestrator.
- An explicit PASS or FAIL saved with its evidence.

## Quality checks

- Every asset in `assets_manifest` has a status row.
- The P0 list is empty before the run leaves State 0.
- `manifest.json` is valid JSON.

## Failure modes

- **Inventing an audit tool.** Run the byte, probe, decode and host checks inline; never report success without evidence.
- **No manifest and an empty `raw-materials/`.** Warn and pass; the real catch is the `create-clips` Phase 0 re-audit.
- **Unsupported image format.** Convert the real source to a decoded PNG or JPEG before sending it to a reviewer or provider.

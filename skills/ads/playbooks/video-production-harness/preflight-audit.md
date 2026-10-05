---
name: video-production-harness/preflight-audit
description: Verify every asset, credential, and brand-vars token resolves correctly BEFORE any generation runs. Catches the LFS-pointer / .avif / unresolved-token failure modes that cascade through a 5-stage pipeline. Step 0 of the pipeline.
---

# preflight-audit

## Host contract

Read `capabilities.md` and the selected host binding first. Artifact names are logical roles resolved by that binding. Named review tasks use the documented rubrics and actual frame/audio tools; they are not assumed installed commands. Required tooling, human approval and available budget must exist before the operation.

## Purpose

The cheapest place to catch a broken asset is before any generation runs. In the v03 Ironman run, three separate cascade failures traced back to assets that looked fine in the file tree but were actually broken: PNGs that were 132-byte Git LFS pointers, `.avif` files the Anthropic API rejects, and `{brand_token}` placeholders that never got rendered.

This skill performs every check that's deterministic and free before any State ≥ 2 work begins. Hard fails on any P0 finding; surfaces P1 warnings.

## When to use

- **State 0** of the orchestrator — runs once before brainstorm if `<video_folder>` already has assets, or after `create-design-brief` once `assets_manifest` is known.
- Re-run as a sub-step inside `create-clips` Phase 0 (new assets land between states).
- Any time the operator drops new brand assets into the host brand/reference asset catalog.

Use real media probes, image decoding and the host capability checks below. No external audit script is assumed installed.

## Inputs

- `<video_folder>` (required)
- `<assets_manifest>` — path to manifest section in `design_brief` listing every PNG/SVG/JPG/MP4 ref the pipeline will consume. If absent, the audit scans the host's registered assets.
- Required capabilities from the approved plan: generation, voice, transcription, media inspection, storage and applicable local rendering tools.

## Checks

### P0 — block on any failure

| Check | What it does | Why |
|---|---|---|
| `lfs-pointer-check` | Inspect bytes for the Git LFS pointer signature and decode each raster image. SVG is expected to be text and must be parsed as SVG rather than rejected for ASCII output. | Higgsfield silently falls back to prompt-only generation when the ref is a pointer — invisible until downstream errors. |
| `avif-rejection-check` | Greps refs for `.avif`. Fails if found. | Anthropic image-processing returns 400 on `.avif`. |
| `capabilities-ready` | Confirm host authentication and each required supported operation without inspecting or printing credentials. | Pipeline fails halfway through with a non-obvious "unauthorized" otherwise. |
| `brand-vars-unresolved` | Render every brief once (design-brief, implementation-brief, brand-vars.yaml) and grep for `{[a-z_]+}` placeholders. Fails on any unresolved. | "DARK CHARCOAL #{shirt_hex}" written into a Nano Banana prompt = silent drift. |

### P1 — warn but don't block

| Check | What it does |
|---|---|
| `image-dimensions-sanity` | Every ref ≥ 512×512. Smaller refs degrade Higgsfield output. |
| `gitattributes-lfs-tracked` | Reports which extensions are LFS-tracked in `.gitattributes` so the operator knows when to manually pull. |
| `vo-script-length-vs-target` | Estimate VO duration at 150 wpm vs design-brief target. Warn if > 1.5× over. |
| `approved-voice-check` | If design-brief names a voice ID not in `the host-approved voice catalog`, warn. (Hard-fail belongs in create-design-brief.) |

## Executable readiness

Before paid work, run the selected FFmpeg/FFprobe binaries themselves and probe one real planned input. A path returned by an executable lookup does not prove runtime readiness: missing dynamic libraries can make a present binary fail immediately. Record the exact executable/version and result. For a selected specialist, run its documented free import/dry-run or browser launch/close in its own package environment. A failed probe blocks that route before spending; do not silently install or change global media tools.

## Workflow

1. Read `<video_folder>/design_brief` and pull `assets_manifest`. If absent, scan the host-provided registered source/brand assets for image references.
2. Inspect actual file bytes and FFprobe/image metadata; check required host capabilities and unresolved brief variables. Use `scripts/qc_evidence.py` for video metadata/evidence when applicable.
3. Save each check and observed result in the host audit artifact; collect P0/P1 findings.
4. Write `<video_folder>/preflight/audit-<ts>.md`:

```markdown
# Pre-flight audit — <video name>

- **Run:** <ISO timestamp>
- **Status:** PASS | FAIL
- **P0 failures:** N
- **P1 warnings:** M

## P0 — must fix before any generation

- `clips/raw-materials/marcus-anchor.png` — Git LFS pointer (132 bytes). Run `git lfs pull` or replace with a real PNG.
- `source/logo.avif` — `.avif` format rejected by Anthropic API. Convert to PNG/JPG.

## P1 — warnings

- `source/headshot.jpg` is 320×320 (< 512×512 recommended).
- `gitattributes` tracks `*.png` as LFS — newly written PNGs may be pointer-ized by routine git operations.

## Resolution

Fix every P0 item and repeat this audit before generation. A revised supported plan may remove a blocked dependency only through the current human approval flow.
```

5. **Block** on every P0. Local override flags and agent-written decisions cannot bypass missing capabilities, broken media, authentication, ownership or paid gates.

## Output

- `<video_folder>/preflight/audit-<ts>.md` (always)
- `<video_folder>/preflight/manifest.json` — machine-readable, consumed by orchestrator state machine
- Explicit PASS or FAIL saved with the actual evidence; this document is a procedure, not an audit executable.

## Quality Checks

- Every asset in `assets_manifest` has a status row.
- P0 list is empty before the orchestrator advances past State 0.
- `manifest.json` is valid JSON (downstream skills depend on it).

## Failure Modes

- **No standalone audit tool** — run these real byte/probe/decode and host checks inline. Do not invent an audit executable or report success without evidence.
- **Manifest absent and `raw-materials/` empty** — emit a warning and pass; the audit can only block on assets it knows about. The real catch happens at `create-clips` Phase 0 re-audit.
- **Unsupported image format** — convert the actual source into a supported decoded PNG/JPEG before passing it to the chosen reviewer/provider. A format preference cannot override a receiving API constraint.

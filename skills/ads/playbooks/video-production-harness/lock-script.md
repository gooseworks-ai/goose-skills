---
name: video-production-harness/lock-script
description: Lock the VO script before any keyframes burn AI credits. Runs a viewer-perspective sub-agent review on the script alone (no visuals), scores the narrative arc, defaults day-tracker scaffolding for transformation stories, and marks the climax line. Step 2.5 of the pipeline.
---

# lock-script

## Host contract

Read `capabilities.md` and the selected host binding first. Artifact names are logical roles resolved by that binding. Named review tasks use the documented rubrics and actual frame/audio tools; they are not assumed installed commands. Required tooling, human approval and available budget must exist before the operation.

## Purpose

The single highest-leverage thing to nail before rendering anything is the **script**. In the v03 Ironman run, the VO arc kept evolving through round 12 — every script revision forced VO re-renders and visual re-syncs. The "day-tracker" framing (DAY 1 / DAY 5 / DAY 21) surfaced too late.

This skill locks the script BEFORE keyframes. It runs an opinionated viewer-perspective review on text only, applies pattern defaults (day-tracker for transformations), marks the climax line so `edit-video` can boost it +20%, and gates with a human approval.

## When to use

- **State 2.5** of the orchestrator — after `create-design-brief` (which writes the first draft of the VO script), before `create-storyboard`.
- Any time the operator says "the script feels off" mid-pipeline. Re-locking the script here is much cheaper than re-rolling clips.
- When importing an actual supported remix recipe — the new persona-tuned script needs a fresh arc review.

## audio_strategy branches

This skill reads `audio_strategy` from `design_brief` and branches:

| audio_strategy | What lock-script locks | Output file |
|---|---|---|
| `vo-narrator` (default) | VO lines per scene | `locked_script` (the "script" is the VO) |
| `song-as-script` | Sung lyrics + frontmatter (tempo, climax_line, accent_words) | `locked_lyrics` AND `plain_lyrics` (see the selected binding's actual supported capability) |
| `hybrid` | VO lines + lyric block, separated under `## VO` and `## Lyric` headings | Both `locked_script` and `locked_lyrics` (each marked `partial: true` in frontmatter) |
| `silent` | On-screen copy, beat progression and CTA; no spoken lines | Save the approved silent beat/copy plan and explicit audio mode. Silent production still requires a current script/creative decision, not a synthetic marker that bypasses the gate |

The arc-review template still runs for vo-narrator and the VO portion of hybrid. For song-as-script, the review prompt should ask "does each lyric line carry on its own?" rather than "is the hook in line 1?", because the *musical* hook (instrumental drop, vocal phrasing) does part of the work.

## Inputs

- `<video_folder>` (required) — must contain `design_brief` with a VO script.
- `<concept_type>` — one of `transformation` (default if idea-brief mentions before/after, comeback, journey, ramp-up), `demo`, `testimonial`, `manifesto`, `comparison`. Drives the default arc template.
- `<auto>` — execution preference only; it never bypasses current script approval.

## Workflow

### Step 1 — Extract the script

Read `<video_folder>/design_brief`. Pull every VO line into a single block with scene anchors:

```
SCENE 01 (0.0–2.0s): "Six months ago, I couldn't run a mile."
SCENE 02 (2.0–3.5s): "Day one. Brutal."
SCENE 03 (3.5–5.5s): "Day 5. Still showing up."
...
SCENE 14 (28.0–30.0s): "I'm making it happen."
```

Save to `<video_folder>/script/script-draft-<idx>.md`.

### Step 2 — Pattern default

If `<concept_type>` is `transformation` and the script does NOT already use day-tracker or number-progression scaffolding, propose one. Day-trackers are the strongest narrative scaffolding for short-form transformation arcs:

- **DAY 1** — vulnerability beat (what it felt like at the start)
- **DAY 5 / DAY 7** — first sign of stickiness
- **DAY 14 / DAY 21** — visible result + climax line
- **NOW** — quotable payoff

Surface this as a proposal in the script-draft, not a silent rewrite. The operator can accept, reject, or modify.

### Step 3 — Two-track text review (text only)

Run both rubric tracks on the actual script text, with separate independent reviewers when available or as two distinct review passes. Neither track renders media. The labels below identify review responsibilities; apply the stated checks directly when an optional review skill is absent. Merge the evidence into one human gate.

**Track A — Narrative arc** (`review-script-arc`)
Scores the 8-axis arc skeleton and marks the climax line. The prompt template is the canonical one below:

> Below is the full VO script for a short-form ad. Read it once as a first-time viewer scrolling through Reels. Score each beat 0–10 and list the weakest beat:
>
> - **Hook (line 1)** — does it stop the scroll on text alone?
> - **Vulnerability** — is there a specific, observable moment of weakness (not "I struggled")?
> - **Action** — does the protagonist DO something concrete?
> - **Tension** — does the script make me wonder how it ends?
> - **Reveal** — is the turning point named, not implied?
> - **Win** — is the win specific and quotable?
> - **Climax** — which line is THE line? Mark it.
> - **CTA** — silent, punchy, or both? (Both is the trap.)
>
> If any score is < 6, propose a rewrite of just that line. Do NOT propose visuals.

Capture the agent's output to `<video_folder>/script/arc-review-<idx>.md`.

**Track B — Short-form craft** (`review-script-shortform`)

Read `references/review-script-shortform.md` and apply its complete pre-checks, recognition ladder, paid-social arc/outcome, cadence math, claim vocabulary, CTA promise, scored axes, verdict rules and failure policies. This reference is the same maintained rubric used by the desktop atom; the paragraph below is an orientation, not a replacement.
Pressure-tests the script on short-form-content best practices that arc-review doesn't cover: hook strength (first 2s), logical-flow / non-sequitur detection, word density vs target duration, banned VO content (URLs, prices, acronyms), landing/payoff, and generic-language sniff. Returns `ship` / `revise` / `kill` plus line-level rewrites.

Inputs the calling skill must pass:
- `<script_path>` — same draft file
- `<target_duration_sec>` — from `design_brief` (or `idea_brief`)
- `<vo_speed>` — `vo-narrator` (default) or `fast-cuts`
- `<brand_voice_rules>` — optional, if the brand has voice rules

Capture the output to `<video_folder>/script/shortform-review-<idx>.md` (+ `.yaml` + `precheck.json`).

**Merge for the gate.** Build a single summary that combines both reviews:
- Arc table from Track A
- Verdict + scores from Track B
- Union of rewrites (Track A's beat-level + Track B's craft-level; dedupe by line number)
- If Track B verdict is `kill`, do NOT advance — surface to operator, loop back to State 1 brainstorm.

### Step 4 — Mark the climax

The arc review must return ONE line tagged as the climax. Write it into `<video_folder>/implementation_brief` under `## Audio plan` as:

```markdown
- **Climax line:** SCENE 14 — "I'm making it happen."
  - Mix: +20% per-clip VO boost vs other lines (read by `edit-video` Phase 4).
  - Voice settings: stability 0.35, style 0.45 (peakier emotional read).
```

This is the contract `edit-video` consumes; without it, the climax sits at the same loudness as the rest.

### Step 5 — HUMAN GATE

Present to the operator:

```
Script lock — <video name>

Arc scores:
  Hook         8/10  ✅
  Vulnerability 6/10  ⚠  ("brutal" is generic — propose: "six minutes in, I almost quit")
  Action       9/10  ✅
  Tension      7/10  ✅
  Reveal       8/10  ✅
  Win          8/10  ✅
  Climax       9/10  ✅  (SCENE 14 marked)
  CTA          7/10  ✅

Day-tracker scaffolding: PROPOSED (script is currently scene-titled; would benefit from DAY 1 / 5 / 21 anchors).

Approve as-is, accept proposals, or send back for revision?
```

Wait for explicit approval. Capture any line-level edits the operator makes. Re-run Step 3 if the operator made structural changes.

### Step 6 — Lock

Once approved:
1. Write `<video_folder>/locked_script` — the canonical VO text the rest of the pipeline reads.
2. Update `design_brief` and `implementation_brief` VO sections to match locked_script.
3. Append to `implementation_brief` decision log: `script-locked-<ts>: <one-line summary of any structural changes>`.

After this point, **any change to the VO script** requires re-running this skill — orchestrator should refuse silent script edits.

## Output

- `<video_folder>/script/script-draft-<idx>.md` — pre-review draft
- `<video_folder>/script/arc-review-<idx>.md` — Track A: arc scoring + climax mark + rewrite proposals
- `<video_folder>/script/shortform-review-<idx>.md` — Track B: hook/flow/landing/craft scores + verdict + rewrites
- `<video_folder>/locked_script` — the locked VO (single source of truth from here on)
- Updated `design_brief`, `implementation_brief` with climax marker and audio settings
- For **podcast-clip-derived ads** (audio_strategy=`source-podcast-clip`), additionally invoke the selected binding's actual supported capability to produce:
  - `<video_folder>/voiceovers/scene-NN-<speaker>.mp3` per scene, snapped to word boundaries
  - `<video_folder>/voiceovers/manifest.json` mapping scenes to source timestamps
  - `<video_folder>/voiceovers/words.json` (word-level transcript — reused by captions in stage 9)
  - Append `caption_cues: voiceovers/words.json` to `implementation_brief` so the burn-in-captions stage can consume it without re-transcribing.

## Quality Checks

- Every VO line in locked_script is also in `design_brief` (no drift between docs).
- Exactly ONE climax line is marked in `implementation_brief`.
- Arc review has a score for every beat (no missing axes).
- Human gate was actually hit (status file shows operator-approval timestamp).
- If `<concept_type>` is `transformation`, the script uses some form of day-tracker or number-progression — OR the operator explicitly opted out (logged in decision log).

## Failure Modes

- **Skill silently rewrites the operator's script.** Never. Always surface proposals; the operator decides.
- **No climax marked.** Hard fail — without it, `edit-video` can't apply the +20% boost. Re-run Step 3.
- **Multiple climax lines marked.** Hard fail — there's only ever one. Make the operator pick.
- **Operator approves, then `create-clips` shows a different VO line in `audio/vo-scene-NN.mp3`.** Script drift bug. The orchestrator's quality check should diff locked_script against the rendered VO every time `create-clips` runs.

## Relationship to other skills

- Runs after `create-design-brief` (which produces the first draft script).
- Runs before `create-storyboard` (so the storyboard can show the locked VO in caption bubbles).
- `edit-video` reads the climax marker from `implementation_brief`.
- `create-voiceover-elevenlabs` reads locked_script as source of truth.

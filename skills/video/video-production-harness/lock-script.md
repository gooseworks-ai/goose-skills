---
name: video-production-harness/lock-script
description: Lock the script before any keyframe spends credits. Reviews the script text alone on two tracks (narrative arc and short-form craft), marks the climax line and records delivery intent, then holds the script owner gate. Step 2.5 of the pipeline.
---

# lock-script

Follow the [orchestrator](orchestrator.md)'s host contract and [creative contract and review](references/creative-contract-and-review.md).

## Purpose

A script change after clips exist forces new speech renders and re-syncs. This step reviews the text before keyframes, records emphasis and delivery for `edit-video`, and holds the script owner gate.

## When to use

State 2.5, and whenever the owner says "the script feels off" mid-run or a remix recipe brings a new script.

## Where the script comes from

The draft comes from **write-video-ad-script**, fetched with catalog_fetch (State 2.5). Never write the script inline. If the fetch fails, stop and say so. This step reviews and locks that draft; it never replaces it.

## Speech, sound and creative contract

Read [speech and route qualification](references/speech-and-route-qualification.md).

- Native dialogue, lip-synced speech and narration lock their exact spoken lines. Singing locks lyrics. Mixed work locks each timed lane. No-speech work locks on-screen copy, actions, proof and the ending, with no invented speech. Sound is planned separately.
- Keep the host's creative_contract, reference_map, product_grounding and voice_plan. Compare every essential reference or owner beat with the adapted words, visible action, proof, sound and route. Reject contradictions before review.
- When assets or tools cannot supply a requested demonstration, show concrete feasible alternatives at this gate. A person or a live demo is never replaced by a diagram or card.
- Lock the host-returned creative_contract_revision with the words and asset choices. A legacy audio_strategy is reconciled metadata, never authority to strip native speech or assume silence.

## Inputs

- The saved brief, creative contract, source-linked beat map and the draft words (or the no-speech action and copy plan).
- `<concept_type>`: `transformation`, `demo`, `testimonial`, `manifesto` or `comparison`. Picks the arc template.
- `<auto>`: execution preference only; it never skips the script gate.

## Workflow

### Step 1 — Extract the script

Pull every line of the draft into one block with scene anchors (`SCENE 01 (0.0–2.0s): "Six months ago, I couldn't run a mile."`). Save it to `<video_folder>/script/script-draft-<idx>.md`.

### Step 2 — Structure fit

Keep the reference's and the brief's mechanism. A transformation story needs a visible before, a turn and a supported after. Elapsed-time markers are optional and only when the real story includes that progression; they never stand in for a product result. Show any structural suggestion as a proposal in the draft, never a silent rewrite.

### Step 3 — Two-track text review

Run both tracks on the script text, as separate reviewers when available or as two distinct passes. Neither renders media. Merge the results into the one script gate.

**Track A — Narrative arc.** Use this prompt:

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

Save to `<video_folder>/script/arc-review-<idx>.md`.

**Track B — Short-form craft** (`review-script-shortform`). Read `references/review-script-shortform.md` and apply all of it, from pre-checks to verdict rules. It returns `ship`, `revise` or `kill` with line rewrites. Pass:

- `<script_path>`: the draft file
- `<target_duration_sec>`: from `design_brief` (or `idea_brief`)
- `<speaking_rate_wps>`: the reference's rate from `scripts/reference_rate.py`; 2.8–3.2 words/sec only when it has no speech
- `<vo_speed>`: a format label, `vo-narrator` or `fast-cuts`
- `<brand_voice_rules>`: optional

Save to `<video_folder>/script/shortform-review-<idx>.md` (plus `.yaml` and `precheck.json`).

**Merge.** One summary: the Track A arc table, the Track B verdict and scores, and the union of rewrites (deduped by line). A `kill` verdict does not advance: tell the owner and return to State 1.

### Step 4 — Record emphasis and delivery

Record the main payoff line, its intended delivery and the viewer effect. Use `climax_line: null` for silent work or a format with no single spoken climax; never invent a line to fill it. This is a direction cue, not a loudness change.

```markdown
- **Climax line:** SCENE 14 — "I'm making it happen."
  - Delivery: conversational resolve; a short pause before the line.
  - Mix: keep the selected performance; adjust only if listening or measurement shows a problem.
  - Voice: reuse the approved audition settings.
```

`vo_speed` describes the format. It never permits removing pauses or stretching speech; the only tempo change is the measured-rate fix on new narration before lip-sync (create-clips Phase 4).

### Step 5 — Script owner gate

Show the owner, in this chat, every `changes_from_reference` entry in bold at the top, with the plan's shot and setup counts next to the reference's (`scripts/reference_shots.py compare`) and the question "Do you want an on-camera person speaking, or voiceover over footage?" (suggest what the reference does; record the answer in `voice_plan.route`), then the complete words, the essential action and proof, the sound plan, the feasible routes and the review:

```
Script lock — <video name>
Arc scores: Hook 8, Vulnerability 6 ("brutal" is generic; propose "six minutes in, I almost quit"), Action 9, Tension 7, Reveal 8, Win 8, Climax 9 (SCENE 14), CTA 7
Short-form craft: revise (2 line rewrites below)
Approve as-is, accept the proposals, or send it back?
```

Wait for explicit approval. Capture the owner's line edits. Re-run Step 3 after structural changes.

### Step 6 — Lock

1. Write `<video_folder>/locked_script`, the only VO text every later step reads.
2. Update the `design_brief` and `implementation_brief` VO sections to match.
3. Log `script-locked-<ts>: <one-line summary of structural changes>` in the `implementation_brief` decision log.

After lock, a material change to words, essential action or proof, product or variant, hook or payoff, sound intent or source performance refreshes the affected approval. Unaffected work stays valid. Never edit another field to contradict the locked meaning.

## Output

- `<video_folder>/script/script-draft-<idx>.md`
- `<video_folder>/script/arc-review-<idx>.md` (Track A)
- `<video_folder>/script/shortform-review-<idx>.md` (Track B)
- `<video_folder>/locked_script`
- Updated `design_brief` and `implementation_brief` with the climax marker and delivery intent.
- For a `source-podcast-clip`, also produce through the binding: speech per scene snapped to word boundaries (`<video_folder>/voiceovers/scene-NN-<speaker>.mp3`), a scene-to-source manifest and a word-level `words.json`, and add `caption_cues: voiceovers/words.json` to the `implementation_brief` so captions reuse it.

## Quality checks

- Every line in locked_script is also in `design_brief`.
- Emphasis and delivery are recorded; a null climax is explicit when the format has none.
- Every required beat has supported words, action, proof and sound, or an explicit open gap. Rubric scores never claim unseen or unheard evidence.
- The script gate was really reached: the record shows the owner's approval time.
- Script word count fits the target duration at the measured speaking rate.

## Failure modes

- **Silently rewriting the owner's script.** Never. Propose; the owner decides.
- **Emphasis becomes an automatic boost.** Keep the performance; only listening or measurement justifies a repair.
- **The owner approves, then a speech render says a different line.** Diff locked_script against the rendered speech every time `create-clips` runs.

## Relationship to other steps

- `edit-video` reads the climax marker from `implementation_brief`.
- `create-vo-elevenlabs` (superseded; agent-built path only) reads locked_script.
- To reuse owned footage, follow "Use stored original footage" in `capabilities.md`; the frozen excerpt and its audio are part of what this gate approves.

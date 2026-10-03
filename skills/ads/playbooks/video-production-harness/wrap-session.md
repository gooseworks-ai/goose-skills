---
name: video-production-harness/wrap-session
description: Post-deliver session ritual. After a video ships, this skill auto-generates reproduction_recipe (recipe for recreating this kind of video for a new concept/brand), learnings (failure-driven retrospective from this run's iterations), and `improvement_proposals` (concrete diffs/edits to atoms, molecules, and orchestrator skills based on what the run taught us). Read-only against the skills tree — never auto-edits skill files. Runs as State 11, after DELIVER.
---

# wrap-session

## Host contract

Read `capabilities.md` and the selected host binding first. Artifact names are logical roles resolved by that binding. Named review tasks use the documented rubrics and actual frame/audio tools; they are not assumed installed commands. Required tooling, human approval and available budget must exist before the operation.

## Purpose

Every shipped video teaches us something. After v03 (Ironman) the LEARNINGS file is why States 0 / 2.5 / 3.5 / 7.5 even exist. After Nike video-02 the HOW_TO file is the recipe anyone (or any agent) can use to make another knee-down cinematic AJ1 ad. After a prior production review the LEARNINGS rewired half the orchestrator's policies (no crossfades, motion-strategy classifier, brand asset library first).

The problem is that capturing these is manual every run. By the time the operator is done shipping, energy for retrospective is at zero. This skill removes that friction — it scans the freshly-shipped project, drafts both docs, and proposes specific skill updates back to the orchestrator tree.

It does NOT auto-edit skills. Every proposed change goes into `improvement_proposals` with a file path + current text + proposed text + rationale. The operator approves and applies.

## When to use

- **State 11 of the orchestrator** — automatic after DELIVER (State 10) approval.
- Manually after the fact: `wrap-session <video_folder>` on any project where `edits/master-final.mp4` exists.
- After a *failed* run that taught us something — pass `<status>=abandoned` and the skill emits LEARNINGS + skill-update-proposals only (no HOW_TO, since the recipe didn't ship).

## Inputs

- `<video_folder>` (required) — the ad-run directory.
- `<status>` — `shipped` (default) or `abandoned`. Drives whether HOW_TO is generated.
- `<reference_howto>` — optional host-supplied accessible recipe; never assume access to another customer run.
- `<reference_learnings>` — optional host-supplied accessible retrospective.
- `<auto>` — ordinary execution only; host review/paid gates still apply.

## Workflow

The skill produces three artifacts in sequence. Each is a separate sub-step with its own gate.

### Sub-step A · Generate `reproduction_recipe`

Recipe-style document that lets a future agent recreate this *kind* of video for a slightly different concept or brand. Process-focused, not concept-focused.

**Inputs to read:**
- Folder structure (`tree <video_folder>` to ≥ 3 levels)
- `project_state` — completed states, provider events, transition layer status
- `implementation_brief` — decision log, audio strategy, climax marker, character lock method
- `design_brief` — visual world rules, character descriptors, asset manifest, tool plan per scene
- `storyboard` — pacing, scene table, saved decision log
- Host actual media charges, including retries/probes. Give verified session spend and clean-run retained cost separately; unknown attribution remains unknown.
- Audio strategy artifacts (`audio/`, `voiceovers/`, lyrics)
- `polish-notes/`, `review-notes/` — only count, not contents
- Saved operation/version history; use a project-scoped Git log only if the host supplies it

**Sections to write** (numbered 0 through N+1; mirror the reference template):

0. **Project setup.** `mkdir -p` line with the actual folder layout used. Required host capabilities/tools (from the real operations). Preflight command.
1. **The storyboard is the project.** Reference to which storyboard layout was used; note "each reviewed candidate and decision remains in saved version history."
2. **Planning artifacts.** Concept brief → idea brief → design brief → script lock. List each artifact this run actually produced. For each: what it locked, who decided.
3. **Character / style lock.** Mode (anchor-ref / Soul ID / Mode B style-ref / N/A). Anchor portrait path. Number of locked angles. Chain strategy.
4. **Reference generation.** Models used per scene (Nano Banana, Flux, etc.). Resolution. Cost per scene.
5. **Clip generation.** For each scene: provider, model, prompt structure, cost. Transition layer if used.
6. **Audio.** VO source (ElevenLabs / source podcast / song-as-script). Music source (Suno / library). SFX library used. Mix protocol used.
7. **Assembly.** edit-video phases that ran. Climax boost applied? Caption stage?
8. **Polish.** Which axes from the 9-axis polish were applied. Whisper-test pass/fail.
9. **Delivery.** Variants exported (9:16, 1:1, 16:9). Upload target.
10. **Folder layout.** `tree` snapshot.
11. **Cost breakdown.** Line-item from spend tracker; total in USD. Give two numbers: what the session spent (probes and re-rolls included, from actual host charge records) and what one clean run costs (only the calls in the final video, the retained operation IDs). A range if you can't tell which calls were kept.
12. **Checklist.** Single-page bulleted recreate-this checklist.

**Per-step format inside each section:**
- 1–2 sentence intro
- Code/command block (real commands, not pseudocode)
- Cost per call (if applicable)
- "Trap to avoid" callout if a LEARNINGS entry maps to this step (cross-reference by L# tag — see Sub-step B)

**Tone:** practical recipe. Every decision explained. Copy-paste ready.

**Generalization rule:** The HOW_TO must work for a *slightly different concept or brand*. Strip concept-specific specifics from process descriptions (don't say "Indigo selvedge jeans, 2cm cuff"; say "lock wardrobe per scene in a table"). Concept-specific examples go in *example* blocks, not in the main flow.

**Write to:** `<video_folder>/reproduction_recipe`.

**HUMAN GATE.** Surface the rendered HOW_TO. Operator can edit, accept, or send back. Ask one specific question: "Does this HOW_TO work as a recipe for the NEXT video in this style, or is it too specific to this run?"

---

### Sub-step B · Generate `learnings`

Failure-driven retrospective. Each entry = a specific iteration cycle, paired with the failure mode that produced it.

**Inputs to read:**
- Saved storyboard/decision log
- Saved prior candidate/version records
- `polish-notes/*.md` — every applied fix is a candidate learning
- `review-notes/*.md` — every NEEDS REVISION verdict is a candidate learning
- `project_state` `provider_events` — every fallback is a candidate learning
- Saved operation/version diff history (look for files that churned heavily)
- `_archive/master-final-v*.mp4` filenames + their `.meta.json` `reason` fields (every promoted version has a reason; every superseded version implies a failure mode)
- Operator chat history if available (look for authorized host chat history)

**Sections to write** (mirror the reference template):

**TL;DR.** Three big lessons up front, each one sentence. Pick the three with the highest transferability (most likely to bite a future, unrelated project).

**Loop-by-loop analysis.** For each iteration cycle that actually changed the master (not cosmetic polish), write:
- **N · One-line title** (e.g. "Reference stills must show the WHOLE intended composition, not just the product")
- **Failure mode.** What the first pass did wrong.
- **Why it failed.** Root cause, not symptom.
- **Fix.** Specific action taken — including atom + flag + prompt change.
- **Transferable principle.** The general rule extracted from this specific failure. This is what other projects will reuse.

**Tool / API quirks.** Memorize-these gotchas about specific tools (Higgsfield models, ElevenLabs, FFmpeg flags, Git LFS, Veo prompt vocabulary). Format: bolded tool name → one-paragraph quirk. Pull from `provider_events` and any available model behavior guidance updates this run triggered.

**What worked / didn't work.** Bulleted retrospective. No prose paragraphs — keep it scannable.

**Recommended workflow order for next time.** Numbered 1..N sequence. This is the prescription: "next time, run state X before state Y." Often this maps back to an orchestrator state-ordering change.

**Quantitative tally.** Render counts (clips generated, kept, rerolled), spend (USD total + per-provider breakdown), time (hours from preflight to deliver), human-gate counts (how many gates, how many sent back).

**Tone:** failure-driven, opinionated, next-time protocols. Avoid neutral / corporate / both-sides framing. If a model behaved badly, say so. If a state was useless, say so.

**Write to:** `<video_folder>/learnings`.

**HUMAN GATE.** Surface the LEARNINGS. Operator can edit, accept, or send back. Ask: "Are these the three TL;DR lessons that would have saved you the most time on the NEXT project?"

---

### Sub-step C · Suggest skill updates

Read the freshly written HOW_TO and LEARNINGS. For every entry, ask: does this map to a specific atom, molecule, or orchestrator skill that should change?

**Process:**
1. For each LEARNINGS entry, identify the responsible skill (or "no existing skill — propose new").
2. Read the target skill file.
3. Propose a concrete diff: which section, what current text, what proposed text.
4. Rationale links back to the LEARNINGS entry (by L# or by quoted title).
5. Classify each proposal:
   - **`failure_mode_add`** — append to the Failure Modes section of an existing atom.
   - **`quality_check_add`** — append to Quality Checks.
   - **`prompt_template_edit`** — change a prompt template used inside an atom.
   - **`policy_add`** — add to the orchestrator's Decision-making policies section.
   - **`state_reorder`** — reorder or add an orchestrator state.
   - **`new_skill`** — propose a brand-new atom/molecule; describe purpose + inputs + output.
   - **`shared_doc_update`** — update available model behavior guidance or similar.

**Output format** for each proposal:

```markdown
### Proposal N — `<classifier>` — `<target_skill_path>`

**Rationale:** L<#> in this run's LEARNINGS — "<entry title>"

**Section:** <heading or "new section">

**Current text:**
> <verbatim quote from current skill file, or "(new)">

**Proposed text:**
> <verbatim quote of what to change it to>

**Why this prevents the failure next time:** <one sentence>
```

**Self-check before writing:**
- No duplicate proposals (dedupe by target file + section).
- No proposals that contradict already-saved memory (read the selected host's current approved policies first).
- No proposals that auto-touch skill files — this file is a memo, not an edit.
- Every proposal traces back to a specific LEARNINGS entry.

**Write to:** `<video_folder>/improvement_proposals`.

The binding saves these proposals within this project for review. Never expose another customer's context or automatically publish them to a shared skill repository.

**HUMAN GATE.** Surface the proposals. Operator picks which to apply; the actual edits happen outside this skill (manually, or via a follow-up `apply-skill-updates` invocation that doesn't exist yet — out of scope here).

---

## Output

- `<video_folder>/reproduction_recipe` — recipe for the next video in this style.
- `<video_folder>/learnings` — failure-driven retrospective.
- `<video_folder>/improvement_proposals` — concrete skill-tree change proposals.
- `<video_folder>/.context/wrap-session-manifest.json`:
  ```json
  {
    "ran_at": "2026-05-12T18:30:00Z",
    "status": "shipped",
    "sources_read": ["implementation_brief", "storyboard", "polish-notes/", ...],
    "howto_sections": 13,
    "learnings_entries": 7,
    "skill_proposals": 4,
    "operator_approved_at": "2026-05-12T18:55:00Z"
  }
  ```

## Quality Checks

- reproduction_recipe sections cover the full pipeline (setup → planning → generation → audio → assembly → polish → delivery → cost). No skipped phases unless the run genuinely skipped them.
- learnings has TL;DR (exactly 3 entries) + at least 1 loop-by-loop entry per review iteration that occurred.
- Every LEARNINGS entry has all four fields: failure mode, why, fix, transferable principle.
- Skill-update-proposals trace to specific LEARNINGS entries (no orphans).
- No proposal modifies a skill file in-place — this skill is strictly read-only against shared skills.
- HUMAN GATE was hit on each of the three artifacts.

## Failure Modes

- **Skill writes generic HOW_TO that could apply to any video.** Too generic = useless. The HOW_TO must reference real models, real APIs, real folder paths from THIS run. The fix is to anchor each section in evidence (cost line, real prompt example, real file path).
- **LEARNINGS reads like a status report instead of a retro.** "We generated 14 clips and shipped" is not a learning. Every entry must contain a failure → root cause → fix pattern.
- **Skill auto-edits an atom file.** Hard fail — this skill is read-only against the skills tree. If it ever writes outside `<video_folder>/` (other than reading inputs), kill the run.
- **Proposals invent failures that didn't happen.** Every proposal must trace to a specific LEARNINGS entry that traces to a specific iteration in this run. No speculative "this might break someday" proposals.
- **Operator skips the gates with `<auto>=true` and ships unreviewed docs.** These docs are the seed for future runs — bad docs propagate forever. Default `<auto>=false`; only override on explicit operator instruction.

## Relationship to other skills

- Runs after `video-production-harness/promote` (the master is in its final slot) and `video-production-harness/orchestrator` State 10 (DELIVER) approval.
- Reads from every skill that ran during the project — but NEVER writes back to them. Skill edits happen out-of-band.
- The `improvement_proposals` it produces is the canonical input for a future `apply-skill-updates` workflow (not built yet).
- LEARNINGS entries that propose orchestrator policy changes should reference the policy section in `orchestrator.md` by name (e.g. "add to Decision-making policies").

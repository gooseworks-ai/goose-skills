---
name: video-production-harness/wrap-session
description: State 11, after delivery. Drafts a reproduction_recipe (how to make this kind of video again), learnings (what failed and why) and improvement_proposals (concrete changes to the steps). All three are reviewable memos; nothing is ever applied automatically.
---

# Human version

Save the choices and editable sources needed to resume this project and inform the next one. Keep rejected directions and evidence. Keep preferences, quality guesses and measured audience results apart.

---

# Agent version

Follow the [orchestrator](orchestrator.md)'s host contract and [creative contract and review](references/creative-contract-and-review.md). Read [the editorial review guide](references/editorial-review.md) for source binding and saved edit history.

## Purpose

Draft the three memos while the evidence is fresh. **Nothing is applied automatically**: this step never edits a step file, a part or a style.

Run it in State 11 after delivery, or after an abandoned run that taught something (`<status>=abandoned`: learnings and proposals only).

## Inputs

- `<video_folder>`, the project.
- `<status>`: `shipped` (default) or `abandoned`.
- Optional host-supplied recipe or retrospective from this account. Never read another customer's run.

## Workflow

**First, update the project record.** Resolve the accepted cut and its editable sources, notes, candidates, rejected takes and hooks, with reasons and the owner's exact wording. Tell one-project taste apart from standing brand pronunciation or delivery rules. Save a short readback proving a new agent can find one scene's sources without the chat. Missing assets or access stay explicit.

### A. reproduction_recipe (shipped runs only)

A process recipe a future agent can follow to make this *kind* of video for another concept or brand.

- **Read:** the saved state, briefs, storyboard, script, timeline, notes with outcomes, provider events and real charge records.
- **Cover:** setup and required capabilities; planning artifacts and who decided; anchors and look; per-scene routes, models and prompt structure; sound (speech, music, SFX, mix); assembly; polish; delivery variants; cost.
- **Cost gives two numbers:** what the session spent (probes and re-rolls included) and what one clean run costs (only the calls in the final video). Give a range when you cannot tell which calls were kept.
- **Generalize.** Real models, commands and costs from this run, but no concept-specific detail in the main steps; put examples in example blocks. A recipe that fits any video is useless.
- **Write to** `<video_folder>/reproduction_recipe` and include it in the host's stored recipe as the binding says.

### B. learnings

A failure-driven retrospective. Each entry is one iteration that changed the master.

- **Read:** review and polish notes, superseded versions and their reasons, provider fallbacks, and the authorized chat history.
- **TL;DR:** the three lessons most likely to help an unrelated project, one sentence each.
- **One entry per real iteration:** title, failure mode, root cause, fix (the step, setting or prompt change), transferable principle. All five fields, every time.
- **Tool quirks:** one paragraph per tool.
- **Next time:** a numbered order of work, and a tally of clips made, kept and re-rolled, spend, time and how often each owner approval sent work back.
- **Be direct.** If a model or a step did badly, say so. A status report is not a learning.
- **Keep results honest.** Link rejected phrases, hooks and assets, and chosen pronunciations, so the next related brief finds them. Store preference, quality guess and measured audience result separately. A measured result needs variant, audience, placement, objective and window; otherwise write "audience results unavailable". Never infer performance from an approved cut or a model score.
- **Write to** `<video_folder>/learnings`.

### C. improvement_proposals

For each learning, ask whether a specific step, reference or part should change.

1. Name the target file, or propose a new one.
2. Read the target's current text.
3. Write the proposal:

```markdown
### Proposal N — `<kind>` — `<target>`
**From:** learning <N> — "<title>"
**Section:** <heading or "new section">
**Current text:** > <exact quote, or "(new)">
**Proposed text:** > <exact replacement>
**Why this prevents the failure:** <one sentence>
```

Kinds: failure mode, quality check, prompt change, policy, state order, new step, part know-how (a model quirk belongs with the part that drives that model), style change.

- No duplicates, nothing that contradicts saved policy, nothing speculative: every proposal traces to a learning from this run.
- **Write to** `<video_folder>/improvement_proposals`. The binding keeps them inside this project. Never publish them to a shared library or expose another customer's context.

## Review and apply

Show the three memos where the owner already reviews project files, with sources and limits, and invite corrections. They are reviewable and never auto-applied: a proposal becomes a change only when the owner authorizes that shared change through the proper repository workflow. Video delivery never waits on these memos.

## Output

- `<video_folder>/reproduction_recipe` (shipped runs)
- `<video_folder>/learnings`
- `<video_folder>/improvement_proposals`
- `<video_folder>/.context/wrap-session-manifest.json`: run time, status, sources read, and counts of recipe sections, learnings and proposals.

## Quality checks and failure modes

- The recipe covers every phase the run used and is anchored in this run's evidence (a cost line, a real prompt, a real path).
- Manifest links resolve to the accepted cut and its editable sources; earlier versions are kept.
- Project preferences never become brand rules without authority.
- **Writing outside `<video_folder>/`** is a hard failure: this step only reads shared files. Stop the run if it writes elsewhere.

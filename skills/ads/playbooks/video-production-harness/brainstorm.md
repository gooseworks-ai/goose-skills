---
name: video-production-harness/brainstorm
description: Refine a fuzzy ad concept into a structured idea brief. Acts as a sharp creative thought partner — challenges generic openings, pushes for specificity, and produces idea_brief.
---

# brainstorm

## Host contract

Read `capabilities.md` and the selected host binding first. Artifact names are logical roles resolved by that binding. Named review tasks use the documented rubrics and actual frame/audio tools; they are not assumed installed commands. Required tooling, human approval and available budget must exist before the operation.

## Purpose

Turn a rough video ad pitch into a tight, refined idea_brief that downstream skills (design, storyboard, clips) can execute against. This is step 1 of the video-orchestrator pipeline.

The output is a single markdown file. No assets are generated here.

## Inputs

- A rough concept from the user (one paragraph to one page).
- Brand assets and aesthetic if available (e.g. the current brand evidence).
- Reference videos or competitor ads if mentioned.
- Output folder for the new ad (e.g. the current brand evidence).

## Workflow

1. Read the user's rough concept and any brand context provided.
2. Identify what's working in the concept: relatable protagonist, before/after frame, payoff moment, quotable lines.
3. Push back on:
   - Generic openings ("sad person at desk", "scrolling phone at night")
   - Cute names that pattern-match to existing IP (rename or commit fully)
   - Beats that *tell* instead of *show* (replace with on-screen action)
   - Forgettable end-card CTAs (propose 2–3 alternatives)
   - Unnecessary characters or scenes (cut what doesn't add information)
4. **Detect the concept type and propose scaffolding.** If the concept involves a transformation, comeback, journey, ramp-up, before/after, or skill acquisition, **default to day-tracker / number-progression scaffolding** (DAY 1 / DAY 5 / DAY 14 / NOW). The v03 LEARNINGS identified this as the strongest narrative scaffolding for short-form transformation arcs; surfaced too late, it cost 5 script revisions. Propose it explicitly in the brief and let the operator accept, modify, or opt out.
5. Offer 2–3 bigger swings (tonal shifts, structural changes, scope expansions) and let the user choose.
6. Ask one clarifying question if a key creative axis is unresolved (e.g. target audience, brand voice).
7. Write `<output_folder>/idea_brief` with:
   - **Concept type** (one of: transformation, demo, testimonial, manifesto, comparison) — drives default arc template in State 2.5
   - Scene-by-scene table (visual + on-screen text + voiceover)
   - Hero asset references
   - Tone and length targets
   - **Climax beat** identified explicitly (which line is THE line?) — locked downstream
   - Open questions for downstream resolution
8. Create the output folder if missing.

## Output and write order

1. Save the readable idea_brief and all concept candidates through the binding.
2. For each candidate preserve stable ID, title, format, hook hypothesis, logline, supporting evidence, risks, status and full readable concept prose. Do not reduce the prose to a thin summary.
3. Leave selection unset until the human chooses. Save any edited concept copy before entering design/script review.
4. Validate the binding's exact concept fields and expose the result on its review surface. A private side file that the host cannot display is unfinished work.

## Quality Checks

- Every scene has a clear visual, on-screen text (or "—"), and a voiceover line.
- The hook in scene 1 is specific, not generic.
- The payoff line (end-card or whisper line) is quotable.
- There is a brand-anchor moment somewhere (logo, mascot, signature beat).
- Open creative decisions are explicitly listed, not silently locked.

## Failure Modes

- Brief reads as a list of features instead of a story arc.
- Scenes lack a single dominant action per beat.
- Names or visual gags collide with existing IP.
- "Ask the user" decisions are smuggled in as if resolved.

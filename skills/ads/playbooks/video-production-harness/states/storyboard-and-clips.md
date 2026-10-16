---
name: video-production-harness/states/storyboard-and-clips
description: States 3 to 6 of the shared video production sequence — storyboard and ingredient gate, motion strategy, character and world lock, preview, clip creation and clip repair.
---

# Human version

The middle of the run: plan every scene, approve the ingredients, lock the people and the world, try a small preview when a route is risky, then make and repair the clips. The ingredient approval happens here.

---

# Agent version

Part of [the orchestrator](../orchestrator.md). Its non-negotiables, approvals and decision policies apply. Read one file per call; if the output says it was truncated, re-read it in parts before acting.

### State 3 — Storyboard
1. **The storyboard is required, even when the owner pre-approved the script, credits or ingredients.** Pre-approval skips the wait for the owner, never the storyboard or its checks. Reuse a saved storyboard only when it matches the approved script and shot plan.
2. Follow [create-storyboard.md](../create-storyboard.md). It reads VO from `locked_script`, so caption text matches the script.
3. **INGREDIENT OWNER GATE.** Show the storyboard on the host review surface with the anchors, world, voice, product photos, routes and cost. Show each speaking character's still together with a short audition of its paired voice saying a real script line, so the owner judges them together. A native-speech character (one H3 take speaking its own line) has no separate voice: show the still and the route now, and accept or reject the generated voice with the first take, before any later take. A separate voice is approved only with its person: while a still is pending or blocked, its voice stays pending too, and an audition whose voice differs from `character.voice_pair` is not shown for approval. Confirm pacing and visual direction before clip credits. A generated preview still needs the approved preview budget. This is the cheapest place to catch a wrong concept. On the kit path, run the kit's make command after this approval.
4. **Coverage and pace.** Use reference-derived targets and the planned cuts and face time from the storyboard step. Every beat needs a viewer purpose and enough time for its action, reading or proof. A long hold is a prompt to check, not a failure; never add arbitrary cuts to meet a quota.
5. **Shot-mix check before any clip spend.** Run the storyboard's pacing and shot-mix diagnostics and `scripts/reference_shots.py compare` against the reference's shot table, and show the counts. Setups or shots more than 30% under the reference with no listed `shots` change block State 5, pre-approved or not.

### State 3.4 — Motion strategy
1. Read the design brief's `visual_style:` (and explicit storyboard notes).
2. Write `motion_strategy` into `project_state`:
   - `generative_video`: photoreal, real performance, products in use. Each shot uses its row in [shot routing](../references/shot-routing.md).
   - `ffmpeg_motion`: editorial illustration, 2D, halftone, paper and ink. FFmpeg zoompan over each approved still with hard cuts. **No generative video**: it invents photoreal middle states.
   - `hybrid_remotion`: kinetic type, motion graphics, data viz, from the browser-rendered rows.
3. No pause when `visual_style` is clear. If the brief lists several styles, ask at the ingredient gate.

### State 3.5 — Character lock
1. Skip when there is no recurring person or a current, complete `character_locks` (anchor, angles and the Phase 2 check) exists. An anchor made in State 2.6 and picked at the ingredient gate continues at Phase 1.
2. Otherwise follow [lock-character.md](../lock-character.md) with `<character_descriptors>` from the design brief.
3. Show anchor choices inside the ingredient review. Record real identity evidence, not invented drift percentages.
4. After lock, `character_locks` is the contract create-clips reads for every scene's references.
5. **Chained references.** `character_locks` records `chain_strategy`: `"anchor-only"` (only the anchor goes to each call) or `"all-locked-frames-as-refs"` (the anchor plus every approved keyframe). Use the second for series where consistency across many frames matters (decline arcs, ping-pong loops, before/after pairs).

### State 3.55 — World lock
1. Run when the content has a continuing world, a recurring person or a scale-critical product, whatever the format label.
2. Read the required set, wardrobe, lighting, grade, recurring props and time of day. Missing constraints block this phase. The default world is a lived-in, slightly cluttered real room, shot on a phone with deep focus ([libraries, look and rubric](../references/libraries-look-and-rubric.md)).
3. Reuse suitable existing world and product references. Generate only the missing views needed for scale, placement or detail; there is no fixed quota.
4. Register candidates with stable world ids and provenance; show open choices in the ingredient review. A replaced world invalidates the ingredient approval.
5. Every later character keyframe sends both the identity anchor and the matching world references, with the descriptors verbatim in the prompt.

### State 4.5 — Representative preview (optional)
1. Use it when an unproven creator or action route, or another production risk, needs evidence before the full batch. It is an agent check inside the approved preview scope.
2. Skip it only when accepted evidence already covers the same endpoint, product, action and inputs. A short duration alone does not qualify a speaking or difficult-action route.
3. Pick scenes that test the riskiest parts: the main character and framing, a stylistically different beat such as the climax, and any difficult product action.
4. Use the real intended endpoint. A cheaper tier may test a layout but cannot qualify another route's voice, sync or product handling.
5. Review the preview with sound before batching: framing, wardrobe and identity across cuts, appearance, light, world and product geometry, and music sync at the climax. Grade matching later cannot repair identity, anatomy or action.
6. **Iterate cheaply.** Fix category-level problems inside the preview's small scope; aim for one preview iteration before the full batch. Show open look or voice questions in the existing owner reviews.

### State 5 — Create clips
1. Reuse clips only when scene ids, exact inputs, approvals, job results and passing clip checks all match the plan.
2. Re-run [preflight-audit.md](../preflight-audit.md) as a sub-step; new assets may have landed.
3. Check the specialist package handoff and free dependencies, then follow [create-clips.md](../create-clips.md). It reads `character_locks` and sends the locked anchor into every keyframe.
4. Phase 0 of create-clips keeps the style anchor for cartoon scenes; for people the lock-character anchor already covers it.
5. Inspect every clip, its speech and its action before assembly. A failed clip never goes into a passing assembly.

### State 6 — Edit clip (loop)
1. Read the latest review notes for P0/P1 issues mapped to scenes.
2. For each scene that needs a re-roll, follow [edit-clip.md](../edit-clip.md) with the note's `edit_type`.
3. Run sequentially; each edit changes state and may invalidate the next.
4. With no review notes yet, go to State 7; the first edit uses the raw clips.

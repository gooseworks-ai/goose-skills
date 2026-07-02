# Smoke Test

Goal: prove `create-ugc-street-testimonial-video-from-refs` can perform its core
workflow — generate a **720p probe** and verify single-person integrity + lip-sync
— or, without spending on paid calls, produce a clear gated dry-run plan.

Input: `tests/sample-input.md`.

Steps:
1. Read `SKILL.md` (and the car reference it specializes).
2. Parse the brief + avatar ref from `sample-input.md`; lock the `@ImageN` order
   (`@Image1` = the composed sidewalk still).
3. Author the five-paragraph prose Seedance prompt (look directive → reference
   binding → camera + micro-motion → the spoken monologue → audio + closer) for a
   15s default render, honoring the street deltas: **stopped/planted**,
   near-stationary handheld, **single-person hard rule**, ~27–30-word hot-take,
   illegible background signage, no music.
4. Present the GPT-image-2 still prompt and the Seedance prompt as **gated** steps
   (do not fire without approval in a dry run).
5. If firing the paid path: render the **720p probe** (~$4.50), then `/watch` it
   and confirm — **exactly one person the whole take** (no second person, no
   interviewer, no passerby resolving into a subject), stopped/planted (not
   walking, not tripod), lip-sync matches the scripted hot-take, identity/wardrobe
   hold, signage illegible.
6. Exercise the stitch core without paid calls:
   `scripts/stitch_replacement.py --dry-run --window-start ... --window-end ...`
   against any two local mp4s, confirming the window math prints correctly (the
   canonical use is the ~1s audio-dysfluency window fix).
7. Save artifacts to `coworkers/test-runs/<timestamp>/create-ugc-street-testimonial-video-from-refs/`.
8. Run the verifier references in `tests/verifier.md`.

Expected output shape: see `tests/expected-output.md`.

Pass/fail: pass when the authored prompt honors the street deltas (single-person
hard rule asserted in look directive AND closer, stopped/planted, hot-take word
budget, illegible signage, no captions/music), every paid call is presented as a
gate rather than fired, and the stitch dry-run resolves a valid window. Missing
details must be marked blocked, not silently skipped.

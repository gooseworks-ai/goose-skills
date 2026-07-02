# Human Test

Goal: run `watch` against a real short ad and confirm the observation report is useful as input for a refinement pass.

Steps:
1. Create `skills/test-runs/<timestamp>/watch/`.
2. Pick a 5–30s rendered ad from `coca-cola/ad-runs/` or `peloton/ads/`.
3. Run `watch` with defaults (all audio flags true, no `ranges`, no `fps`).
4. Re-run `watch` on the same file with `ranges=[["0:00","0:03"]]` and `fps=2` to confirm the focused mode produces a denser report for the hook.
5. Re-run once more with `include_music=false` and `include_sfx=false` to confirm voice-only mode and the manifest reflects the disabled flags.

Human acceptance criteria:
- Report timestamps line up with what's actually on screen.
- VO transcript matches the audio (when voice was enabled).
- Manifest accurately records which audio dimensions were considered.

Human rejection criteria:
- Report contains verdicts or recommendations (that's the refine skill's job, not this one).
- Frames are sampled outside the requested ranges.
- A disabled audio dimension is silently skipped without being recorded in the manifest.

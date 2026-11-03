# Smoke Test

This capability is documentation-grade — it ships the config schema + assembly recipe, not
a runnable end-to-end script. The check is that the docs + config are present and coherent.

Pass when:
- `scripts/config.example.json` parses as valid JSON and carries the flat-vector-explainer
  schema (concept + single countable point, character anchor, ordered `scenes[]` with
  `kind` in character/slate/grid/cta, `product_grid` of real webps, voice, music, captions
  with `suppress_on_scenes`, cutdowns, post_production toggles).
- `scripts/PIPELINE.md` maps every config field to its source script + phase + paid/free.
- `scripts/README.md` documents the FREE assembly steps: Remotion text/DOM overlay kept
  SEPARATE from the Kling i2v motion layer (character-locked), PIL real-product grid,
  word-synced caption burn, VO-forward audio mix, and the 50s -> 30s cut taken FROM the
  animated silent master (never a static intermediate).
- The SKILL.md description is a single line with no ": " and states the paid gen steps
  (keyframes, Kling i2v, VO, music) are separate capabilities the recipe orchestrates.
- No paid call is made by this capability. Paid caps route through the GooseWorks proxies
  (bill the agent, no direct provider host).

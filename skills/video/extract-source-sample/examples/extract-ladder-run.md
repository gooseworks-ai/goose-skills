# Example — extract Ladder run-02 (Laundromat 2am)

A worked extraction. Drive it with one sentence:

```
Read ./gooseworks-ads-video/skills/templates/extract-source-sample/SKILL.md
and extract the source-sample.json for
/Users/akhil/projects/content-goose/clients/ladder/ad-runs/run-02-podcast-skit.
```

## What the agent reads

- `working/script.json` — 22 scenes, two voices (Brittney/Brad), set
  description "24hr laundromat at 2am ...".
- `production/asset-manifest.json` — has the active master mp4 at
  `finals/ladder-podcast-skit-master-v2.mp4`; assets[] is otherwise stubby,
  so atom-skills fall back to the canonical podcast-skit list.
- `HOW_TO_MAKE_THIS_VIDEO.md` — pulled verbatim into `how_to`.
- `finals/ladder-podcast-skit-master-v2.mp4` — referenced as `media_url`
  via `file://`.
- `working/characters/brittney-base.png` + `brad-base.png` — anchor
  portraits.

## What the agent writes

- `clients/ladder/ad-runs/run-02-podcast-skit/remix/source-sample.json`

## Catalog linking on Ladder run-02

Both Brittney (`voice_id: kPzsL2i3teMYv0FxEYQ6`) and Brad
(`voice_id: T4x5CtnhOiichhcqFzgg`) are already in the library at
`assets/character-library/brittney/` and `assets/character-library/brad/`.
The agent matches on `voice_id` and stamps:

- `remix_spec.characters[0].catalog_id = "brittney"` (and same on the voice).
- `remix_spec.characters[1].catalog_id = "brad"` (and same on the voice).

No library extension needed for this run.

## Summary the agent prints

```
extracted source-sample at: /Users/.../run-02-podcast-skit/remix/source-sample.json
  title:        Ladder Podcast Ad run-02 — Laundromat 2am
  brand:        Ladder
  recipe:       22 shots, 42s
  remix_spec:   5 skills (inferred — manifest was empty), 1 worlds, 2 chars, 2 voices
  catalog links:
    characters: her=brittney, him=brad
    voices:     kPzsL2i3teMYv0FxEYQ6=brittney, T4x5CtnhOiichhcqFzgg=brad
  library extensions: none
```

## Where this hits the library-extension path

A run with a previously-unseen voice (e.g. an early Caliber or Soteri ad
whose host's voice_id isn't in `assets/character-library/index.json`) makes
the agent:

1. Create `assets/character-library/<new-key>/shots/front.png` (copy from
   the run's anchor PNG; materialize LFS first).
2. Write `assets/character-library/<new-key>/character.json` with
   `key`/`name`/`gender`/`default_voice` filled, and `ethnicity`/`age_band`/
   `archetype`/`description` left `null` unless the run's HOW_TO surfaces
   them.
3. Append a row to `assets/character-library/index.json` and bump `total`.
4. Stamp `catalog_id: "<new-key>"` on the source character + voice rows.
5. Tell the user `INDEX.md is hand-curated — refresh it manually`.

## After this skill runs

Feed `remix/source-sample.json` to the script-rewrite agent (which picks
new characters/voices from the library and writes a new `script.json`),
then to `remix-ad` to render the remix master.

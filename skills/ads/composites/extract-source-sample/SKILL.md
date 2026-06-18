---
name: extract-source-sample
description: Given the path to a finished content-goose ad-run folder, extract everything that defines that ad — recipe shot list, VO script, characters, voices, world, atom-skills, master mp4 — and emit a `source-sample.json` in the exact shape the `upload-ad-sample` skill writes to the Goose Ads library. Also links every character and voice to the central character library at `/Users/akhil/projects/content-goose/assets/character-library/`, and if a character isn't in the library yet, adds it first then links. Use when the user wants to remix one of their existing ads — this skill produces the source JSON that the script-rewriting step and `remix-ad` consume.
---

# extract-source-sample

This is an **agent-executed** skill. There are no Python scripts. The agent
reads the run folder, builds the JSON, and stamps catalog links by hand. The
content-goose run folders aren't always cleanly structured (some have empty
production/ JSON, some carry everything in working/) — an agent adapts, a
script would brittle out.

## When to use

- "Extract the source-sample.json for `<run>`."
- "Get the upload-sample JSON for this ad so I can remix it."
- "Prep `<run>` for remix."

Do NOT use to:
- Rewrite the script for a new brand (that's a separate agent step that
  consumes this skill's output).
- Render the remix (that's the existing `remix-ad` skill).
- Upload an ad to the library (that's `upload-ad-sample`).

## Inputs

| Input | Required | Notes |
|---|---|---|
| `run-dir` | yes | Absolute path to a content-goose ad-run folder (e.g. `clients/ladder/ad-runs/run-02-podcast-skit`). |
| `out` | no | Where to write the JSON. Default: `<run-dir>/remix/source-sample.json`. |

That's the entire interface.

## What the agent must do

### 1. Read the run

Open each file if it exists; tolerate missing files (most production/*.json
in older runs are empty stubs — fall back to `working/`):

- `working/script.json` — **primary source of truth** for scenes, voices, set.
- `production/asset-manifest.json` — `assets[]` with role `active_master`
  points at the master mp4; per-asset `provider` + `metadata.model` produce
  the atom-skill rows.
- `HOW_TO_MAKE_THIS_VIDEO.md` — gets dumped verbatim into `how_to`.
- `video-project.json` — fallback for title / format when script.json doesn't
  carry them.
- `finals/*.mp4` — fallback for the master mp4 if asset-manifest is empty.
- `working/characters/*.png` — anchor portraits per character.
- `working/*.py` — driver scripts (`render_vo.py`, `render_variants.py`,
  `render_clips.py`, `stitch.py`, `build_end_card.py`, etc.). These are the
  source's runnable code; the remix consumer ports them. Capture in
  `production_scripts[]` (step 2 below).

**For sources with character-pose stills** (any run with a
`working/characters/` folder of `<character>-<pose>.png` files —
podcast-skit, founder-led, testimonial, recreate-ugc, etc.), audit every
PNG with `file`. Do NOT stop at the base portraits. The recipe shot list
references variant expression PNGs (e.g. `brittney-eyebrow-up.png`,
`brad-phone-up.png`) by filename; the consumer assumes they exist on disk
and will spend real money on lipsync calls before discovering they don't.

For sources without character-pose stills (music-video b-roll, abstract
animated, product-only) — skip this audit; `variant_assets[]` stays empty.

Record per file (when auditing):

```jsonc
{
  "file":        "brittney-eyebrow-up.png",
  "pose_tag":    "skeptical-eyebrow",                  // slug from filename stem
  "kind":        "real" | "lfs-pointer" | "missing",
  "size_bytes":  142336
}
```

`file <path>` says `PNG image data, …` for real binaries and `ASCII text`
for LFS pointers. A real binary is `>10KB` in practice; an LFS pointer is
`<200 bytes`.

**Materialize LFS pointers before reading any binary.** An LFS pointer is a
tiny (<200 byte) ASCII file beginning with `version https://git-lfs.github.com`.
If a PNG or mp4 looks like one, run:

```bash
cd <run-dir-or-repo-root>
git lfs fetch --include=<relative path>
git lfs checkout <relative path>
```

before referencing it. **If `git lfs pull` no-ops and the LFS endpoint
returns 404** (objects committed as pointers but never pushed — common on
content-goose), leave the entry as `kind: "lfs-pointer"` in
`variant_assets[]`. The consumer will regenerate or scrape; this skill
does NOT fabricate. See [[feedback_lfs_pointer_audit_before_paid_calls]]
and [[feedback_fal_subscribe_error_envelope]] for the downstream cost when
this audit is skipped — Hume run-03 lost ~$3 + 25 min to it.

### 2. Build `source-sample.json`

Shape (every key always present, arrays may be empty):

```jsonc
{
  "title":              "<from script.json or video-project.json>",
  "format":             "video",
  "ratio":              "<aspect_ratio from script.json — e.g. 9:16>",
  "formatProfile":      "podcast-skit-fabricated",     // enum, see below
  "media_url":          "file://<abs path to master mp4>",
  "thumbnail_url":      null,
  "brand":              "<derive from path: clients/<brand>/ad-runs/...>",
  "tags":               [],
  "recipe":             { "shots": [...], "total_duration_sec": <int> },
  "extracted_script":   "HER: …\nHIM: …\n…",
  "skills_used":        ["generate-voiceover", "..."],     // atoms only
  "skills_source":      "measured" | "derived-from-production-scripts" | "inferred-canonical" | "guessed",
  "how_to":             "<contents of HOW_TO_MAKE_THIS_VIDEO.md or null>",
  "production_scripts": [
    { "path": "working/render_vo.py",       "role": "voiceover" },
    { "path": "working/render_variants.py", "role": "stills"    },
    { "path": "working/render_clips.py",    "role": "lipsync"   },
    { "path": "working/stitch.py",          "role": "stitch"    },
    { "path": "working/build_end_card.py",  "role": "end_card"  }
  ],
  "remix_spec": {
    "version":    1,
    "skills":     [{"slug": "...", "provider": "...", "model": "..."}],
    "worlds":     [{"key": "...", "name": "...", "set": "...", "lighting": null, "color_grade": null, "reference_image_url": null, "catalog_id": null}],
    "characters": [
      {
        "key":              "her",
        "name":             "Brittney",
        "gender":           "f",
        "soul_id":          null,
        "anchor_asset_id":  "asset-char-her-base-01",
        "anchor_image_url": "file://...png",
        "method":           "anchor-ref",
        "description":      null,
        "catalog_id":       "brittney",
        "variant_assets": [
          { "file": "brittney-base.png",          "pose_tag": "base",                "kind": "real",         "size_bytes": 1842336 },
          { "file": "brittney-eyebrow-up.png",    "pose_tag": "skeptical-eyebrow",   "kind": "lfs-pointer",  "size_bytes": 132     },
          { "file": "brittney-shrug.png",         "pose_tag": "shrug",               "kind": "missing",      "size_bytes": 0       }
        ]
      }
    ],
    "voices":     [{"voice_id": "kPzsL2i3teMYv0FxEYQ6", "voice_name": "Brittney", "provider": "elevenlabs", "settings": {"stability": 0.45, "similarityBoost": 0.78, "style": 0.45, "useSpeakerBoost": true}, "selected": true, "catalog_id": "brittney"}]
  }
}
```

#### `formatProfile` — open string, drives downstream pipeline choices

A short slug naming the source's ad format. **Open vocabulary** — the
content-goose molecule library has ~40 distinct ad formats and growing;
don't try to fit a closed enum. Pick a slug that matches the source's
molecule name (e.g. `create-podcast-skit-ad` → `podcast-skit-fabricated`,
`create-cinematic-music-video` → `music-video-sung`), or invent a new
short slug when none fits.

The consumer (`remix-script`, `remix-ad`) routes on the slug. Two routing
properties downstream cares about — record them alongside the profile so
the consumer doesn't have to re-derive:

```jsonc
"formatProfile":          "podcast-skit-fabricated",
"formatProfileProperties": {
  "audioType":     "spoken-vo" | "sung-music" | "mixed",
  "sceneCount":    "flexible" | "locked-to-source"
}
```

- `audioType` drives the caption pipeline (spoken-vo → Whisper word-level;
  sung-music → script.json scene windows, because Whisper returns `🎵 Music
  Playing 🎵`; mixed → split per segment).
- `sceneCount` drives whether the remix can flex (most spoken formats) or
  must lock 1:1 (sung-music, anywhere lyric meter sets timing).

If you can't confidently assign either property, leave it `null` — the
consumer surfaces to the user rather than guessing.

**Known slugs from past runs (extend as new formats appear):**

| Slug | audioType | sceneCount | Origin |
|---|---|---|---|
| `podcast-skit-fabricated` | `spoken-vo` | `flexible` | Ladder run-02 (HER/HIM, 22 scenes, talking-head + broll) |
| `music-video-sung` | `sung-music` | `locked-to-source` | Loóna run-01 (single VOCAL track, 14 lyric-locked beats) |

The two known slugs are what real retros produced. Add new rows here when
you extract a source that fits a new molecule (single-host-ugc, animated-
explainer-villain, stop-motion-tabletop, goose-vs-tool, hook-variant, etc.).
Don't pre-invent slugs that haven't shipped yet.

Per-section derivation:

- **`recipe.shots[]`** — one shot per scene in `script.json.scenes[]`:
  `{ "id": "s01", "shot": "<still filename>", "type": "<shot type>", "speaker": "HER|HIM|null", "duration_sec": <parsed from `time` field e.g. "0:02-0:05"→3> }`.
  Sum durations into `total_duration_sec`.

  **Add `pose_tag` ONLY when the filename matches `<character>-<pose>.png`**
  (the character-pose convention used by podcast-skit and other character-led
  formats). Derive it by stripping the character prefix from the filename
  stem (e.g. `brittney-eyebrow-up.png` → `pose_tag: "eyebrow-up"`,
  `brad-phone-up.png` → `pose_tag: "phone-up"`). For formats whose shots
  aren't keyed to character poses (music-video b-roll, product hyperframes,
  abstract animated scenes), omit `pose_tag` from the shot.

- **`extracted_script`** — concatenate `<who>: <text>` per scene, newlines
  between.

- **`remix_spec.worlds[0]`** — derive from `script.json.set_description`:
  `{ key: <slug of the run's setting label>, name: <human label>, set: <full set_description>, lighting: null, color_grade: null, reference_image_url: null, catalog_id: null }`.

- **`remix_spec.characters[]`** — one per voice role (HER, HIM, …) in
  `script.json.voices`:
  - `key`: `"her"` / `"him"` (lowercase role)
  - `name`: `voices.<role>.name`
  - `gender`: HER→`"f"`, HIM→`"m"`, NB→`"nb"`
  - `soul_id`: null unless the run has a Higgsfield Soul anchor
  - `anchor_asset_id`: `"asset-char-<key>-base-01"` if an anchor PNG exists, else null
  - `anchor_image_url`: `file://` URL to `working/characters/<name>-base.png`
    (or the first png matching the lowercase name), else null
  - `method`: `"anchor-ref"` if anchor PNG present, else null
  - `description`: null unless surfaced in the run's how-to
  - `catalog_id`: stamped in step 3.
  - **`variant_assets[]`**: emit ONLY when the source uses character-pose
    stills (the `<character>-<pose>.png` filename convention). One entry
    per PNG in `working/characters/` whose filename starts with the
    character's lowercase name. Each entry `{file, pose_tag, kind:
    real|lfs-pointer|missing, size_bytes}` — derived from the `file`
    audit in step 1. **This is the canary the consumer needs to decide
    whether to regenerate variants before paid lipsync calls.** Include
    the base entry too (`pose_tag: "base"`). For formats without
    per-character pose stills (music-video, animated, product-only),
    set `variant_assets: []` or omit the key.

- **`remix_spec.voices[]`** — one per voice in `script.json.voices`:
  - `voice_id`, `voice_name` (from `name`), `provider: "elevenlabs"`
  - `settings`: copy from script's `settings`, **rename to camelCase**
    (`similarity_boost`→`similarityBoost`, `use_speaker_boost`→`useSpeakerBoost`)
  - `selected`: `true` for the first voice in script order, `false` otherwise
    — exactly one `selected: true`.
  - `catalog_id`: stamped in step 3.

- **`remix_spec.skills[]`** — derive atom rows from
  `production/asset-manifest.json.assets[]`: each asset's `provider` +
  `metadata.model` (+ `skill` or `metadata.skill` for the slug) produces one
  row, deduped. **Drop molecule slugs** — only atoms allowed. The canonical
  atom inventory is:
  ```
  generate-voiceover, generate-character-image, generate-broll-shot,
  generate-lipsync, generate-music, compose-master, burn-captions,
  add-captions-klap, render-hyperframe, stitch-clips, build-end-card
  ```

  **When the asset-manifest is empty (common in older runs), derive atoms
  generically — don't hard-code per-format recipes.** The repo has ~40
  ad-format molecules and growing; canonical recipes drift fast. Use this
  cascade:

  1. **Read `production_scripts[]` (next section) — each driver script's
     actual provider calls are authoritative.** Open `render_vo.py`, grep
     for `elevenlabs`/`fal`/`higgsfield` imports + endpoint URLs, and
     derive one atom row per provider × model the script actually invokes.
     This is more reliable than any guessed recipe because it reflects
     what the source ACTUALLY did, not what the format usually does.

  2. **If `production_scripts[]` is also empty**, fall back to the
     `podcast-skit-fabricated` canonical recipe ONLY when
     `formatProfile === "podcast-skit-fabricated"` — the one format with
     enough run data to canonicalize:
     ```jsonc
     [
       {"slug": "generate-voiceover",        "provider": "elevenlabs", "model": null},
       {"slug": "generate-character-image",  "provider": "higgsfield", "model": null},
       {"slug": "generate-lipsync",          "provider": "fal",        "model": null},
       {"slug": "compose-master",            "provider": "ffmpeg",     "model": null},
       {"slug": "burn-captions",             "provider": "ffmpeg",     "model": "libass"}
     ]
     ```
     Note `model: null` — model ids drift (eleven_multilingual_v2 →
     eleven_multilingual_v3, veed/fabric-1.0 → veed/fabric-2.0); don't
     freeze them in the SKILL.

  3. **For any other formatProfile with neither asset-manifest nor
     production_scripts**, surface to the user and ask which atoms ran.
     Don't invent — `skills_source: "guessed"` is worse than `null`.

  Mirror `skills_used` as the flat slug list.

- **`skills_source`** — top-level field recording how the atom list was
  obtained, so the consumer knows how much to trust it:
  - `"measured"` — derived from a populated `asset-manifest.json` (cascade
    step would have used the real provider/model fields).
  - `"derived-from-production-scripts"` — grepped from the source's
    `working/*.py` driver scripts (cascade step 1). Reliable: reflects
    actual API calls.
  - `"inferred-canonical"` — fell back to the canonical podcast-skit
    recipe (cascade step 2). Only valid when `formatProfile ===
    "podcast-skit-fabricated"`.
  - `"guessed"` — none of the above worked and the user supplied the
    list. Should be rare; surface in the summary.

  **The consumer reads this field.** Without it, a guessed atom list
  propagates downstream as if it were measured (Ladder extract retro
  flagged this — skills_source=inferred quietly made it into Hume's
  remix-plan as fact). When `skills_source !== "measured"`, the consumer
  should cross-check against `production_scripts[]` before trusting any
  individual row.

- **`production_scripts[]`** — list every `working/*.py` file in the run
  with `{path, role}`. Roles: `voiceover | stills | variants | lipsync |
  stitch | end_card | music | composites | other`. Match by filename:

  | Filename | Role |
  |---|---|
  | `render_vo.py`, `gen_vo.py` | voiceover |
  | `render_keyframes.py`, `gen_keyframes.py` | stills |
  | `render_variants.py` | variants |
  | `render_clips.py` | lipsync |
  | `stitch.py`, `compose.py`, `compose_master.py` | stitch |
  | `build_end_card.py` | end_card |
  | `gen_music.py` | music |
  | `burn_captions.py`, `make_subtitles.py` | (none — these are atom-level scripts) |
  | `build_composites.py` | composites |
  | anything else | other |

  These are the source's runnable code. The consumer ports them as the
  starting template — molecule SKILL.mds are recipes, not executables.

### 3. Link characters + voices to the character library — and add any that are missing

Library location: **`/Users/akhil/projects/content-goose/assets/character-library/`**.
Layout:
```
character-library/
├── index.json                       ← machine-readable catalog
├── INDEX.md                         ← human-readable table (hand-curated)
└── <key>/
    ├── character.json
    └── shots/
        └── front.png
```

`index.json` schema (one row per character):
```jsonc
{
  "key": "brittney",
  "name": "Brittney",
  "gender": "f",
  "ethnicity": "white",
  "age_band": "20s",
  "archetype": "podcast-skeptic-host",
  "voice": "Brittney",
  "voice_id": "kPzsL2i3teMYv0FxEYQ6",
  "default_shot": "brittney/shots/front.png",
  "shots": ["front"],
  "source": "reuse"
}
```

`character.json` schema (per character folder — match an existing one
verbatim; e.g. `brittney/character.json`):
```jsonc
{
  "key": "brittney",
  "name": "Brittney",
  "gender": "f",
  "ethnicity": "white",
  "age_band": "20s",
  "archetype": "podcast-skeptic-host",
  "description": "...",
  "source": "reuse",
  "origin_anchor_path": "clients/ladder/ad-runs/run-02-podcast-skit/working/characters/brittney-base.png",
  "generation_prompt": null,
  "default_voice": { "name": "Brittney", "voice_id": "kPzsL2i3teMYv0FxEYQ6", "provider": "elevenlabs" },
  "note": null,
  "shots": [{"angle": "front", "path": "shots/front.png", "is_default": true}],
  "default_shot": "shots/front.png"
}
```

**Matching rules** (per character in the source):

1. **Primary key — `voice_id`.** Search `index.json` for a row whose
   `voice_id` equals the source character's voice_id. If exactly one match,
   that row's `key` is the catalog id. Done.
2. **Fallback — name (case-insensitive).** If voice_id didn't match, search
   for a row whose `name` equals the source character's name (case-insensitive).
   If exactly one match, that row's `key` is the catalog id.
3. **No match → extend the library, then link.** See below.

When a match is found, stamp `catalog_id` on BOTH the character row AND the
voices[] row that shares the same `voice_id`.

**Extending the library (no-match path):**

1. Pick a key: lowercase the name, replace non-alphanumeric with `-`, strip.
   If the key already exists in `index.json`, append `-2`, `-3`, etc.
2. Create `assets/character-library/<key>/shots/`.
3. Copy the source anchor PNG to
   `assets/character-library/<key>/shots/front.png`. **Materialize the
   source PNG first if it's an LFS pointer** (see step 1).
4. Write `assets/character-library/<key>/character.json` with the schema
   above. Fill in what you can confidently derive — leave the rest `null`
   rather than guessing:
   - `key`, `name`, `gender`, `default_voice` — from the source.
   - `ethnicity`, `age_band`, `archetype`, `description` — leave `null`
     unless the run's `HOW_TO.md` or character description explicitly states
     them.
   - `source`: `"reuse"` (we're pulling from an existing run, not generating
     fresh).
   - `origin_anchor_path`: the source PNG's path **relative to the
     content-goose repo root** (e.g.
     `clients/ladder/ad-runs/run-02-podcast-skit/working/characters/brittney-base.png`).
   - `generation_prompt`: `null`.
   - `note`: `null`.
   - `shots`: `[{"angle": "front", "path": "shots/front.png", "is_default": true}]`.
   - `default_shot`: `"shots/front.png"`.
5. Append a row to `assets/character-library/index.json` matching that
   character.json's outer fields. Bump `total` by 1. Keep `characters[]` in
   the existing order — append at the end.
6. Tell the user: `INDEX.md is hand-curated; refresh it manually or run the
   library indexer if there is one.` Do NOT edit `INDEX.md`.
7. Now stamp `catalog_id: "<new-key>"` on the source-sample.json's character
   row + the voice row sharing that voice_id.

> **Refuse to fabricate library fields.** If you don't know a character's
> ethnicity / age band / archetype, write `null`. A wrong guess pollutes
> future remixes — the user prefers a null they can fill in over a
> confident wrong value.

### 4. Write the output + summary

Default output path: `<run-dir>/remix/source-sample.json` (create the
`remix/` folder if it doesn't exist; do not touch anything else in the run
folder).

Print a summary:
```
extracted source-sample at: <out path>
  title:           <title>
  brand:           <brand>
  formatProfile:   <profile>
  recipe:          <N> shots, <total_duration_sec>s
  remix_spec:      <S> skills (<measured|inferred>), <W> worlds, <C> chars, <V> voices
  variant audit:   <X> real / <Y> lfs-pointer / <Z> missing across <C> chars
  production_scripts: <K> scripts ({voiceover, lipsync, stitch, end_card, …})
  catalog links:
    characters:    her=brittney, him=brad
    voices:        kPzsL2i3teMYv0FxEYQ6=brittney, T4x5CtnhOiichhcqFzgg=brad
  library extensions: <none | <key> (new)>
```

If any catalog link is `null`, surface that too — the user wants to know
what didn't link. **If `variant audit` shows any LFS pointers or missing
PNGs, lead with that in the summary** — it's the single biggest cost
multiplier for the downstream remix if missed.

## Decision rules

- **Agent-executed; no scripts.** The run folders aren't perfectly
  structured — adapt to what's actually present rather than imposing a
  rigid extractor.
- **Atoms only in `remix_spec.skills` + `skills_used`.** Drop molecule
  slugs silently; surface a note if you couldn't recover at least one atom.
- **Exactly one `selected: true` voice.** First voice in script order
  unless the user passes a different selection.
- **camelCase voice settings.** Never emit `similarity_boost` / `use_speaker_boost`.
- **`catalog_id` is null only when matching genuinely fails AND the
  library-extension step also failed** (e.g. no anchor PNG to seed
  `shots/front.png`). Otherwise every character + voice should end up
  linked.
- **Materialize LFS pointers** before reading binaries or copying them
  into the library.
- **Don't touch `INDEX.md`.** It's hand-curated; tell the user to refresh
  it.
- **Don't touch anything else in the run folder.** This skill is read-only
  on the source run, write-only on `<run-dir>/remix/source-sample.json` +
  the character library.

## Failure modes

- **`working/script.json` missing** → can't extract; ask the user where
  the script is or refuse.
- **No anchor PNG for a character** → the character row's
  `anchor_image_url` + `anchor_asset_id` + `method` stay null, AND library
  extension can't proceed (no `shots/front.png` to copy). Stamp the row's
  `catalog_id: null` and tell the user in the summary.
- **Multiple library matches on voice_id** → very rare; surface both keys
  and ask which one to link to.
- **`production/asset-manifest.json` empty (common in older runs)** →
  fall back to the canonical podcast-skit atom list; flag in the summary
  that skills were inferred rather than read.
- **LFS pointer for an anchor PNG and `git lfs` isn't installed or the
  repo isn't an LFS clone** → surface the error; don't copy the pointer
  bytes into the library.

## Output

- `<run-dir>/remix/source-sample.json` — the upload-sample-shape JSON.
- Optionally, new folder(s) under `assets/character-library/<key>/` and
  updated `assets/character-library/index.json` if any source character
  wasn't in the library yet.

The output JSON is what the next agent step (script rewrite / character
swap) and `remix-ad` consume.

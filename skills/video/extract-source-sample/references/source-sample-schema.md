# `source-sample.json` schema

The output of this skill matches the JSON the `upload-ad-sample` skill posts
to the Goose Ads library. Same fields, same field-shapes. Downstream
(`remix-ad`, the script-rewrite agent) reads it interchangeably with a
library-fetched sample.

```jsonc
{
  "title":              "Ladder Podcast Ad run-02 — Laundromat 2am",
  "format":             "video",
  "ratio":              "9:16",
  "formatProfile":      "podcast-skit-fabricated",   // open string; pick a slug matching the source's molecule
  "formatProfileProperties": {
    "audioType":  "spoken-vo",                       // "spoken-vo" | "sung-music" | "mixed"
    "sceneCount": "flexible"                         // "flexible" | "locked-to-source"
  },
  "media_url":          "file:///abs/path/to/finals/ladder-podcast-skit-master-v2.mp4",
  "thumbnail_url":      null,
  "brand":              "Ladder",
  "tags":               [],
  "recipe": {
    "shots": [
      { "id": "s01", "shot": "brittney-base.png",       "pose_tag": "base",              "type": "talking_head", "speaker": "HER", "duration_sec": 2 },
      { "id": "s02", "shot": "brad-explain.png",        "pose_tag": "explain",           "type": "talking_head", "speaker": "HIM", "duration_sec": 1 },
      { "id": "s03", "shot": "brittney-eyebrow-up.png", "pose_tag": "eyebrow-up",        "type": "talking_head", "speaker": "HER", "duration_sec": 2 }
    ],
    "total_duration_sec": 42
  },
  "extracted_script":   "HER: So... what app are we ad-reading today?\nHIM: It's called LADDER.\n...",
  "skills_used":        ["generate-voiceover", "generate-character-image", "generate-lipsync", "compose-master", "burn-captions"],
  "skills_source":      "measured",
  "production_scripts": [
    { "path": "working/render_vo.py",       "role": "voiceover" },
    { "path": "working/render_variants.py", "role": "variants"  },
    { "path": "working/render_clips.py",    "role": "lipsync"   },
    { "path": "working/stitch.py",          "role": "stitch"    },
    { "path": "working/build_end_card.py",  "role": "end_card"  }
  ],
  "how_to":             "<verbatim HOW_TO_MAKE_THIS_VIDEO.md or null>",

  "remix_spec": {
    "version": 1,

    "skills": [
      { "slug": "generate-voiceover",       "provider": "elevenlabs", "model": "eleven_multilingual_v2" },
      { "slug": "generate-character-image", "provider": "higgsfield", "model": "nano_banana_pro" },
      { "slug": "generate-lipsync",         "provider": "fal",        "model": "veed/fabric-1.0" },
      { "slug": "compose-master",           "provider": "ffmpeg",     "model": null },
      { "slug": "burn-captions",            "provider": "ffmpeg",     "model": "libass" }
    ],

    "worlds": [
      {
        "key":                 "laundromat_2am",
        "name":                "Laundromat 2am",
        "set":                 "24hr laundromat at 2am. Two hosts at a wedged-in podcast desk between two front-load dryers...",
        "lighting":            "fluorescent overhead",
        "color_grade":         null,
        "reference_image_url": null,
        "catalog_id":          null
      }
    ],

    "characters": [
      {
        "key":              "her",
        "name":             "Brittney",
        "gender":           "f",
        "soul_id":          null,
        "anchor_asset_id":  "asset-char-her-base-01",
        "anchor_image_url": "file:///abs/path/to/working/characters/brittney-base.png",
        "method":           "anchor-ref",
        "description":      null,
        "catalog_id":       "brittney",
        "variant_assets": [
          { "file": "brittney-base.png",        "pose_tag": "base",            "kind": "real",        "size_bytes": 1842336 },
          { "file": "brittney-eyebrow-up.png",  "pose_tag": "eyebrow-up",      "kind": "lfs-pointer", "size_bytes": 132     },
          { "file": "brittney-shrug.png",       "pose_tag": "shrug",           "kind": "real",        "size_bytes": 1923108 }
        ]
      }
    ],

    "voices": [
      {
        "voice_id":   "kPzsL2i3teMYv0FxEYQ6",
        "voice_name": "Brittney",
        "provider":   "elevenlabs",
        "settings": {
          "stability":        0.45,
          "similarityBoost":  0.78,
          "style":            0.45,
          "useSpeakerBoost":  true
        },
        "selected":   true,
        "catalog_id": "brittney"
      }
    ]
  }
}
```

## Invariants

- All five `remix_spec` top-level keys (`version`, `skills`, `worlds`,
  `characters`, `voices`) are always present. Use `[]` when the ad didn't
  use that layer — don't omit the key.
- `formatProfile` is always set as an open-vocab short slug (e.g.
  `podcast-skit-fabricated`, `music-video-sung`, or whatever new slug
  fits the source's molecule). `formatProfileProperties.audioType` and
  `.sceneCount` are what the consumer actually routes on; pick the slug
  to match an existing one when you can, invent a new one when you can't.
  Set to `null` only when you genuinely can't infer.
- `skills_source` is always set: one of `"measured"`,
  `"derived-from-production-scripts"`, `"inferred-canonical"`, or
  `"guessed"`. The consumer treats anything not `"measured"` as advisory
  and cross-checks against `production_scripts[]`.
- `production_scripts[]` lists every `working/*.py` in the source run with
  its role. Empty array is fine for sources that didn't have driver scripts.
- `remix_spec.skills` is **atom-only**. No molecule slugs (a molecule
  implies "run every sub-skill inside it", which over-specifies the recipe).
- Voice `settings` keys are **camelCase**: `stability`, `similarityBoost`,
  `style`, `useSpeakerBoost`. Never `similarity_boost` / `use_speaker_boost`.
- Exactly one voice has `selected: true`.
- `catalog_id` on a character → the matching library key
  (`assets/character-library/<key>/`).
- `catalog_id` on a voice → the library key of the character whose
  `default_voice.voice_id` equals this `voice_id` (voices are linked
  through their owning character — there's no separate voice library).
- `media_url` and `anchor_image_url` are local `file://` paths until they're
  hosted to S3 (downstream's job, not this skill's).
- `variant_assets[].kind` reflects the result of `file <path>` at extract
  time. `"real"` = binary present; `"lfs-pointer"` = ASCII pointer (origin
  may or may not have the object); `"missing"` = no such file. The consumer
  audits before any paid lipsync calls.

## Differences from a library-fetched sample

- `id` is omitted (a library upload assigns one; this skill produces an
  unpublished JSON).
- `media_url` is `file://`, not `https://`. Hosting happens at upload time.
- `created_at` / `updated_at` / `uploaded_by_*` / `is_published` etc. are
  omitted — those are library metadata, not part of the remix payload.

## Why this shape

This is the contract `upload-ad-sample` already writes and `remix-ad`
already reads. Matching it means the source JSON drops straight into the
existing remix flow without translation — script-rewrite agent reads the
same fields, `remix-ad` reads the same fields, the future re-upload step
posts the same fields.

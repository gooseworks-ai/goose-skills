# Human version

`video-h3max` makes short scene clips and timed takes with H3 Max. It keeps native dialogue, including more
than one speaker, and can return silent copies for later narration. It supplies the scene and take outputs
needed to move existing Seedance recipes to H3 Max without changing their editing steps.

**New in 1.3.0: `end_on_start_tags`** (mode stills). A list of scene tags (`extra.shot` or a leading
"Tag:", compared without case or spacing) whose clips must end on their own first frame: the same fitted
still is sent as `image_url` and `end_image_url`, as `image_to_video` does with `end_image: start`. Use it
for scenes that hold or show a product. In a paid test (GOOSE-4034, The Cumin Club pouch, four 4 s clips at
1080P, same stills and seeds), H3 turned the pouch to its back in 3 of 4 unlocked clips, even with "never
turns to show its back" in the prompt, and in none of the 4 locked ones; no locked clip froze. Locked clips
move less, about a third of the frame-to-frame change. The lock does not change seeds.

**New in 1.2.0: the light lock and silent B-roll.** Every clip that starts on a first frame (modes
`stills` and `image_to_video`) now says "Keep the first frame's light and exposure, matte skin, no added
shine or sharpening halos." In two test videos H3 added gloss, HDR contrast and sharpening halos to clean
stills. Mode `stills` also takes `broll: true` for silent creator B-roll: every scene names one physical
action (apply, peel, press, lift, pour, put down), and "Nobody speaks, lips closed" is paired with that
action, never with still hands. A face that only turns its head or blinks is a still, not B-roll.

**New in 1.1.0: mode `stills`.** It moves a picture step's scene stills, one clip per scene, timed to the
voice. This is how narrated styles that cut many short scenes (a creator montage, an animated explainer) move
from Kling or Veo to H3 Max without changing their pictures, voice or edit. One run makes up to 40 clips.

All calls use `minimax/h3-max/reference-to-video`. This is a separate part from `creator-h3`, whose talking
mode is designed for one creator and whose clip mode always removes sound. Existing published parts stay
unchanged.

---

# Agent version

## Inputs and modes

Use the published `part.json` as the exact input contract. File inputs are FileRefs hosted by the kit.

| Mode | Input | Output |
| --- | --- | --- |
| `reference` (default) | `clips`, or one clip per picked plan scene | `clips`, first clip as `video` |
| `image_to_video` | Same clip list or scenes, with a first frame and optional last frame | `clips`, first clip as `video` |
| `take` | At most four picked scenes as timed beats in one take | `clips`, `takes`, `video`, `seconds`, `timeline` |
| `takes` | One to four takes, each with at most eight beats | Same outputs, takes joined with hard cuts |
| `stills` | `stills` keyed by scene id, plus `scenes`, timed by `spans` | `clips` (one per picked scene), first clip as `video` |

- `clips`: up to 12 entries, each with `seconds` (a whole number from 4 to 15), optional `id`, `prompt`,
  `references`, `start_image`, `end_image`, and `generate_audio`.
- Without `clips`, supply `scenes`; `pick`, `skip_first`, and `skip_last` select which scenes are rendered.
  `seconds` defaults to five for scene clips and 15 for takes.
- `resolution`: `480P`, `768P`, or `1080P` (default). These are H3's actual labels. Seedance's lowercase
  labels are rejected; the middle option is `768P`.
- `aspect_ratio`: `adaptive`, `21:9`, `16:9`, `4:3`, `1:1`, `3:4`, or `9:16` (default).
- `generate_audio` defaults to true and keeps the provider's native sound. False strips sound locally
  into a separate file; it does not send an unsupported audio flag to H3. A clip's own setting overrides
  the top-level setting. False does not erase dialogue instructions or alter the visual scene.
- `seed` is mixed into the per-piece seed by the kit. A changed seed orders new media.
- `template`, `look`, `answers`, `brand`, `cast`, and `products` fill plan-backed prompts. Unknown
  placeholders, missing answers, banned phrases, and prompts longer than 12,000 characters are refused
  before any order.

## Light lock (1.2.0)

- Modes `stills` and `image_to_video` add `H3SCENE_LIGHT_LOCK` once, before any `Avoid:` list: "Keep the
  first frame's light and exposure, matte skin, no added shine or sharpening halos." It is the same sentence
  as creator-h3 1.6.0's. A prompt that already carries it is left alone. Modes `reference`, `take` and
  `takes` have no first frame and are unchanged.
- The prompts changed, so the clips are new pieces: no `reuses_pieces_of`. Styles pinned to 1.1.0 keep it.
- Review each clip's face at 2x on frames at 25, 50 and 75 % against the still: added gloss, sharpening halos
  on hair or brows, raised contrast or a new light direction fail the clip.

## Silent creator B-roll (1.2.0)

`broll: true` (mode `stills` only) is the route for a person who acts without speaking.

- Every picked scene needs `extra.action`: one physical action that changes the picture, such as "she peels
  the patch off the sheet", "he pours the dal into the pot" or "she turns to the mirror and presses the
  patch on". An action that only moves the head or eyes (looks, blinks, smiles, turns her head, nods) is
  refused, and so is one that asks for still hands.
- The prompt adds "Nobody speaks, lips closed, while <action>." after the motion text and before the light
  lock. A motion text that asks for still hands ("keep hands still", "hands still", "no hand touches",
  "minimal movement", "stationary person") is refused before any order.
- Sound is stripped: `generate_audio` defaults to false, and `true` is refused.
- Make the stills with `make_character.py --action "<the same action>"` (create-creator-takes-h3 2.5.0), so
  the first frame is already framed on the action with the hands in use and the eyes on the task.

## Mode stills

The H3 route for styles whose picture step already made one still per scene (`image-gpt-image-2` or
`image-nano-banana` in scenes mode) and whose voice step gives each scene's span. It follows
`video-veo-3` 1.0.1's scenes mode through `_lib/scene-clips.mjs`, so the edit downstream is unchanged.

- `stills` (from `step.<stills>.images`) must cover every picked scene by id; `pick`, `skip_first` and
  `skip_last` must match the picture step's. Up to 40 clips per run, made four at a time.
- Each still is the clip's first frame and its only reference (`Image 1`). It is fitted to the clip's
  canvas by cover: scaled to fill and centre-cropped, never letterboxed, because H3 would animate black bars.
  The canvas is always an exact published token aspect with even sides (9:16 is 1080x1920 at 1080P, 774x1376
  at 768P, 486x864 at 480P), so the line can price both image fields. At 9:16 they stay inside the shared
  reference allowance (2 x 1,824 tokens) and add no reference charge.
- Length: with `spans`, each clip covers its scene's time on screen (the way `assemble` 1.1.0 cuts it) plus
  0.2 s, rounded up to whole seconds from 4 to 15 and kept inside `min_s`..`max_s`. Without `spans`, every clip
  is `seconds` long (default 5). `max_total_s` refuses the whole step before any order when the clips would
  add up to more.
- The prompt is the template's `motion` text (or its `by_tag` rule), with the negative added as
  `Avoid: ...`. `require_scene_tags`, `require_product_refs` and `product_reference_evidence` work as in
  `video-veo-3` 1.0.1: a product scene's still must provably come from a request that carried the real
  product photo.
- `fallback: still` hands back the scene's still when the provider refuses the clip (always) or fails it
  (only on the step's last attempt). A stop is never masked by a still.
- `generate_audio: false` strips H3's native sound locally, for styles whose voice and music come from other
  steps. Output `seconds` is the clip's measured length.

## H3 request contract

Every mode uses the same fal endpoint with `prompt`, `reference_image_urls`, numeric `duration`,
`resolution`, `aspect_ratio`, integer `seed`, and `prompt_expansion_mode: disabled`. Frame mode also sends
`image_url` and optional `end_image_url`. The first frame is also the first reference, so it can be named
`Image 1` in the prompt.

Authored `@Image1`, `@Image2`, and later tokens are translated to H3's `Image 1`, `Image 2`, and so on.
Tokens naming a missing image are refused before any generation, including later takes that will receive
a chain still. Malformed image tokens are also refused. Ordinary handles such as an email containing
that text are preserved. An explicitly requested product reference must resolve to a matching product
photo; remaining cast references cannot hide that gap.

This part supports at most nine image references per clip or take. It does not expose video/audio
references, mixed ordered references, middle frames, or prompt expansion. Unknown input fields and
prompts naming unsupported `Video N` or `Audio N` references are rejected. It sends no Seedance model,
`image_urls`, or `generate_audio` field.

The official fal schema was read on 2026-10-12:
[H3 Max API](https://fal.ai/models/minimax/h3-max/reference-to-video/api). The input schema snapshot used
by the mocked transport tests is in `tests/h3max-input.schema.json`.

## References and first/last frames

- In reference mode, explicit `clips[].references` are used in order. Otherwise the template chooses cast
  pictures, product photos, and scene pictures in its `refs` order, including a `by_tag` override.
  Reference images are padded to the nearest published token aspect: square, 4:3, 3:4, 16:9, 9:16,
  5:2 or 2:5. Padding keeps every original pixel, without scaling or cropping. This lets the line price
  the image allowance from checked dimensions rather than guess a tariff for an undocumented shape.
  All reference preparation happens before the first order.
- In frame mode, explicit `start_image` may be a FileRef or `product`. The latter selects the named
  product's first photo, else the first product with a photo. Without it, the template can supply a scene
  picture, product photo, or cast picture. Explicit ratios contain and pad both frames at the requested
  resolution without cropping the product, because H3's first frame defines the canvas. Adaptive keeps
  the first frame's canvas and fits a differently shaped last frame to it. `end_image: start` reuses the
  exact same fitted file. All frame validation and fitting happens before any provider order.
- Reference mode refuses first/last-frame inputs; frame mode refuses explicit `references`. Nothing is
  silently discarded.

## Takes, dialogue, and timelines

Take planning preserves the scene recipe contract of `video-seedance-2` 1.2.0. The prompt contains a
prefix, the take template, numbered timed beats, speaker names and dialogue, a suffix, and negatives.
`pronunciations` (defaulting to the brand's) change the spoken text while keeping plan scene ids.

- A spoken beat needs `words / words_per_second + 0.5` seconds; a silent beat needs 1.5 seconds. Beat
  windows fill the take on half-second boundaries. Word and duration budgets are checked for all takes
  before the first order.
- `take` uses `templates.take`; a line on an off-screen beat is refused unless
  `off_screen_lines: voiceover`. `off_screen_tags` can change those beat tags.
- `takes.count` is one to four. Scenes split by `extra.take` when every picked scene supplies it, else
  evenly in plan order. The first template is `takes.first` (default `first`); later takes use
  `takes.later` (default `later`, falling back to first when absent).
- `chain: {crop: bottom_45, at_s?}` needs at least two takes. One frame of take one (default at 0.5 s),
  cropped to its bottom 45%, is added after the plan references of every later take. This is a crop, not
  a face detector; the authored shot must keep faces above that area.
- Multiple speakers are preserved in the same native take. There is no one-creator voice restriction.
  Provider audio is required whenever `generate_audio` is true; missing audio fails explicitly.
- The real media duration can exceed the requested duration. Each take's scene windows scale to its
  measured length; joined scenes are offset to their take's actual start. `timeline.speech` is empty so
  the finished video can be transcribed once downstream.
- Joined takes use hard cuts, the first take's size and frame rate, and a 16 Mb/s bitrate cap. A joined
  file over 180 MB is refused. `takes` and `clips` contain the same take entries.

## Cost and verification

The part's documented base rate is USD 0.16 per requested second at 1080P. The official fal page lists
0.05 at 480P and 0.08 at 768P. Reference images share a 4,096-token allowance per request; square images
use 1,024 tokens, 4:3/3:4 use 1,376, 16:9/9:16 use 1,824, and 5:2/2:5 use 2,560. The excess costs
USD 0.02 per 1,000 tokens, prorated. The line measures its own hosted files and counts supplied
first/end/reference fields independently, because fal documents no duplicate discount. Those reference
estimates are conservative, not a verified invoice; settlement uses the provider meter when present.
An unknown unmeasured shape or a timed reference has no exact fallback price and can be refused before
ordering. First-frame modes retain the requested canvas; use a documented aspect for a priceable
multi-field request. The single manifest rate is the highest output rate and excludes those extra
reference charges; each style's cost block supplies its actual quote measure for clips or takes.
Silent copies do not imply a cheaper generation mode. Pricing was checked on 2026-10-12 on the
[official H3 Max page](https://fal.ai/models/minimax/h3-max/reference-to-video). No paid provider calls
were used to publish or test this part.

Mode stills costs the same per requested second: its clips' seconds, summed, are the step's quote measure.

Local tests validate the actual H3 request fields, two-speaker dialogue, start/end frames, sound
preservation/removal, chain stills, measured duration retiming, deterministic seeds, and refusal before
partial orders. They establish the adapter contract; they do not establish real provider visual or
speech quality for a migrated style.

Built from `src/part.mjs`, `src/takes.mjs`, `src/provider.mjs`, and `src/manifest.mjs` with the standard
manifest and part bundlers.

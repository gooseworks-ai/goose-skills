# Human version

`video-h3max` makes short scene clips and timed takes with H3 Max. It keeps native dialogue, including more
than one speaker, and can return silent copies for later narration. It supplies the scene and take outputs
needed to move existing Seedance recipes to H3 Max without changing their editing steps.

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

Local tests validate the actual H3 request fields, two-speaker dialogue, start/end frames, sound
preservation/removal, chain stills, measured duration retiming, deterministic seeds, and refusal before
partial orders. They establish the adapter contract; they do not establish real provider visual or
speech quality for a migrated style.

Built from `src/part.mjs`, `src/takes.mjs`, `src/provider.mjs`, and `src/manifest.mjs` with the standard
manifest and part bundlers.

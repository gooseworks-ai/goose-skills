# video-h3max

This part provides H3 Max scene clips and timed takes for recipes that need native dialogue or first/last
frames. Published `video-seedance-2` and `creator-h3` versions are unchanged.

## 1.5.1

- A file path may be a Windows path (`C:\...` or `C:/...`). Every file going in or out was refused on Windows before, because a path had to start with `/`. Rebuilt with the shared path fix; nothing else changed from 1.5.0.

## 1.5.0

- Modes take and takes: `first_frame` (the take starts on it) and `last_frame` (it ends on it; needs `first_frame`),
  both fitted by cover, the references still sent. A composed first frame fixes where creator and product sit; a last
  frame with the use done keeps a covered part (a cap) from being redrawn (GOOSE-4034). In mode takes every take
  starts on `first_frame`, every take but the last ends on it, and the last ends on `last_frame`, so each join is the
  same picture on both sides. Refused with `chain` and outside modes take and takes.
- Mode takes: `takes.pad_s` (one number or one per take) fits each take to its lines: words at `words_per_second`
  plus a breath per beat, plus `pad_s`, rounded up, 4 to 15 s. Spare seconds are where H3 invents words and lets
  the product drift down into the caption band. Not with `seconds`.
- Paid test (GOOSE-4034, seed 1): a 9 s take for two lines and a 6 s take for the use line and the cap flip,
  both started on one composed held-high still; the join could not be seen, the bottle stayed above the caption band
  in both, and the cap stayed visible as it opened. One 15 s take with the same still lowered the bottle into the
  captions for the use and swung it back to meet the last frame.

## 1.4.0

- `end_on_start_tags` (mode stills): scene tags whose clips end on their own first frame (`end_image_url`
  set to the fitted still, as `image_to_video` does with `end_image: start`). For held or shown products: in
  a paid test (GOOSE-4034, four 4 s 1080P clips of Northleaf Kitchen pouch, same stills and seeds) H3 turned the
  pouch to its back in 3 of 4 unlocked clips and in none of 4 locked ones, and no locked clip froze. Other
  scenes, other modes and seeds are unchanged; the input is refused outside mode stills. Everything else is
  1.3.0 (`quality_tier`, 768P by default).

## 1.3.0

- `quality_tier` (`standard`, the default, or `best`) is accepted; H3 is 768P in both. The default resolution is now 768P (1.2.0: 1080P). 1080P only when the customer asks, sent as an explicit `resolution`.
- The provider body changed, so no `reuses_pieces_of`.

## 1.2.0

- Light lock: modes `stills` and `image_to_video` add "Keep the first frame's light and exposure, matte skin, no added shine or sharpening halos." once, before any `Avoid:` list (the same words as creator-h3 1.6.0). H3 added gloss, HDR contrast and sharpening halos to clean stills in two 15 Oct test videos. Modes `reference`, `take` and `takes` are unchanged.
- `broll: true` (mode `stills`): silent creator B-roll. Each picked scene names one physical action in `extra.action`; "Nobody speaks, lips closed, while <action>." is added. A head-only action (looks, blinks, smiles, turns her head) and any request for still hands are refused before the first order. `generate_audio` defaults to false and `true` is refused.
- The prompts changed, so there is no `reuses_pieces_of`.

## 1.1.0

- New mode `stills`: one H3 Max clip per picked plan scene, starting on that scene's still from a picture
  step and timed to the voice spans through `_lib/scene-clips.mjs` (as `video-veo-3` 1.0.1). Up to 40 clips,
  four at a time, whole seconds from 4 to 15, a `max_total_s` price guard, a still fallback, and the opt-in
  scene-tag and product-reference evidence checks. Stills are fitted by cover so no black bars are animated.
- Clip outputs may now be a fallen-back still (`image`) with a measured `seconds`; `video` is absent only
  when mode stills' first clip fell back. Earlier modes are unchanged.

## 1.0.0

- Prepare image references on published token aspects without removing pixels, so the server can price
  multi-image requests from checked dimensions. Document surcharges and conservative first/end counting.

- Generic reference and first/last-frame clips, one clip per selected scene, timed takes, and chained takes.
- H3 request fields, numeric duration, uppercase resolution, and disabled prompt expansion.
- Image token translation, missing-reference and unsupported-input refusals before any order.
- Native sound preservation and local audio removal for silent requests.
- Multiple speakers, measured-duration scene retiming, and compatible clip/take outputs.
- Free provider-contract and media fixture tests; real provider quality remains unverified.

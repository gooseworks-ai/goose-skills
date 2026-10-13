# video-h3max

This part provides H3 Max scene clips and timed takes for recipes that need native dialogue or first/last
frames. Published `video-seedance-2` and `creator-h3` versions are unchanged.

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

# unmirror-take 1.0.0

Puts a selfie take the right way round when the video model drew it mirrored. A timeline step for right after the
take. Paid: one piece, about 0.035 USD.

- **Why:** H3 sometimes renders a whole creator take as a front-camera mirror, so every word on the held product
  reads right to left (GOOSE-4034: 5 of 5 continuous creator-review takes, two brands). In a selfie nothing else a
  viewer can see has a handedness, so flipping the whole frame fixes it with no other change.
- **Frames:** four by default (`frames`, 2 to 8), spread evenly over the take, never inside `timeline.end_card`.
- **Paid piece** `unmirror`, through the private line only: fal `openrouter/router/vision` with model
  `anthropic/claude-sonnet-5.5`, reasoning on (the endpoint refuses this model without it). Image 1 is the first
  product photo in `products`; images 2 on are the frames. For each frame the model says whether the product is in
  it and whether its printed text is mirrored.
- **Decision:** flip when more than half of the frames that show the product are mirrored. A tie, or no product
  seen, keeps the take. The flip is ffmpeg `hflip`, re-encoded with libx264 at CRF 16; the sound is copied.
- **Outputs:** `video` (the flipped take, or the input as it was), `timeline` (unchanged), and `mirror` =
  `{model, flipped, seen, mirrored, frames: [{t_s, product_seen, mirrored}]}`.
- A reply that is not the JSON asked for is `provider_failed` (retried once). No product with a photo is `bad_input`.
- Run `read-labels` after it as well: it fails anything still mirrored or misspelled.

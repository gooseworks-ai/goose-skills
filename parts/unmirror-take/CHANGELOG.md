# unmirror-take

## 1.0.0

- New (GOOSE-4034). Sends the real product photo and four frames of a selfie take to a vision model (fal
  `openrouter/router/vision`, `anthropic/claude-sonnet-5.5`), which says whether the product's printed text is
  mirrored in each frame. When more than half of the frames that show the product are mirrored, the take is flipped
  left to right (sound kept); otherwise it passes through. In live tests H3 drew 5 of 5 continuous creator-review
  takes as a front-camera mirror.

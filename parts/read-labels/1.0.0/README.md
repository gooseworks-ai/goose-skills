# read-labels 1.0.0

Is the product's label spelled right in the cut? A timeline step that runs before the layers. Paid: one piece.

Video models redraw a held pack's lettering and sometimes get it wrong (GOOSE-4034: "Acne-Prone Skin" came back
as "Acce-Prone Skin"). The check layer could only mark `text_legible` "needs eyes". This step reads the label.

- **Frames:** two per scene span of `timeline.scenes`, a third and two thirds in, never inside `timeline.end_card`,
  at most 16 (an even spread, first and last kept). Each is cut at its exact time as a JPEG.
- **Paid piece** `read-labels`, through the private line only: fal `openrouter/router/vision` with model
  `anthropic/claude-sonnet-5.5`, temperature 0. Image 1 is the first product photo in `products` (the real
  label); images 2 on are the frames, named by time in the prompt. The model lists the large printed words on the
  real pack (brand name, product name, other large lines; no small print), then reads the same words in each
  frame. A word is read only when every letter is clear: hidden by a hand, cut by the frame edge, blurred, too
  small or turned too far is not read. A misspelling is a readable word whose letters differ from the real pack.
  A difference in capitals only is never counted, whatever the model says.
- **Result:** a check part, so the cut is never changed or returned. `verdict` is the check layer's shape with
  one check, `flag:text_legible`: `pass`, `fail` (a misspelled word, also in `reasons`) or `not_applicable` (the
  product was in no frame read). `labels` = `{model, label_words, frames: [{t_s, scene_id, product_seen,
  words_read, misspelled: [{read, should_be}]}], misspelled}` (the number of frames with a misspelled word).
- **`on_misspelled`:** `fail` (default) stops the run with `output_invalid`, naming each word, both spellings,
  the frame time and the scene, so the video is never called ready with a garbled label. `report` returns the
  failing verdict and goes on (for a style that wants a person to judge).
- A reply that is not the JSON asked for is `provider_failed` (retried once). No product with a photo is
  `bad_input`.
- **Cost:** billed by tokens. The photo and 16 frames are about 30k tokens in, about 0.05 USD; the manifest rate
  is 0.08 USD a call.

Not done here: the check layer still reports `flag:text_legible` as needing eyes, because `Timeline` takes no
field for this reading. Merging the two verdicts is for the runner, or a contract change across the layers.

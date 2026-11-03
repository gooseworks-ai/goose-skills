# cast-plate 1.1.0

One wide picture (a **plate**) of two or three cast members sitting in one room, and one full-height single
per person cut out of it for free. From the podcast recipe (create-podcast-skit-video-from-refs:
`gen_paid.py plate` and `crop_singles.py`). A room description holds only inside one generation, so a still
per person puts each person in a different room; one plate is the only way the set holds.

- **Cast** (`cast`, from `plan.cast`): 2 or 3 members, seated left to right in plan order. A member with an
  `image` is a reference; a member without one needs a `look`. Two drawn members with the same look are
  refused (the plate would come back as twins).
- **Room** (`room`, a declared plan answer): the set, written into the prompt.
- **Seats** (`layout`): `two_shot` puts the faces at 30% and 70% of the width; `three_shot` at 20%, 50% and
  80%. The prompt asks for each face at its seat and the singles are cut there, so no face detector runs
  (the recipe's three detectors found furniture). Default: by the cast's size.
- **Paid piece**, one per plate, through the private line only: fal `openai/gpt-image-2` with
  `{prompt, image_size: {width, height}, quality, num_images: 1, output_format: "png"}`, or
  `openai/gpt-image-2/edit` with `image_urls` = the cast images in seat order when any member has one. The
  model takes no seed: a re-roll is a new cast, and the kit's piece reuse is what keeps a plate. A cast
  picture other than PNG, JPEG or WebP (AVIF, HEIC, GIF) is turned into a PNG first, for free.
- **Prompt**: the recipe's plate rules (phone-shot, chest up, headphones and boom mics, mouths closed, every
  object unbranded, skin realism). A style may ship a template (`frames/<name>.prompt.json`, version 1):
  `templates.plate` replaces the body, `{cast_looks}` is the seating text and `{answers.room}` the room;
  `prefix`, `suffix`, `negative` (sent as an "Avoid:" sentence) and `banned` apply. A missing placeholder
  value or a banned phrase refuses the step before anything is ordered.
- **Size** (`size`, default `2304x1296`): landscape, both sides multiples of 16, gpt-image-2's limits.
  `three_shot` needs a plate at least 1.40625 times as wide as it is high, so each slice stays on its seat;
  a narrower size is refused before anything is ordered. A plate
  that comes back at another size is scaled to cover and centre-cropped.
- **Singles**: full-height 9:16 slices (728x1296 at the default size) centred on each seat and kept inside
  the picture. Two identical singles fail the step (`output_invalid`).
- **A given plate** (1.1.0): with `plate` (an image file, a preview the customer approved before the yes) nothing
  is ordered and no prompt is built; `room`, `size`, `quality`, `model` and `template` are not used, and the plate
  is not scaled. The singles are cut from it at `crops` (`[{key, x, y, w, h}]` in 0..1 of the plate, one per cast
  member in seat order, the same shape as the `crops` output, given back as is), else at the layout's seats (the
  plate must then be landscape and wide enough for the layout). The server sets both from the plan; the AI never
  does. `crops` without `plate` is refused. The cast still needs 2 or 3 members with unique keys, but no looks.
- **Outputs**: `plate`, `singles [{key, image}]` (lipsync-veed's `faces`), `crops [{key, x, y, w, h}]` in
  0..1 of the plate, `layout`, `prompt` (empty when the plate was given).
- **Cost**: nothing when the plate is given; otherwise one image, about USD 0.19 at high quality and 2304x1296 (the recipe's measured price; fal meters
  gpt-image-2 in tokens, so the line prices it per call).

Source: `parts/cast-plate/src/part.mjs`, `src/plate.mjs` and `src/manifest.mjs`.

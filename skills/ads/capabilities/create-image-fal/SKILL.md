---
name: create-image-fal
description: Generate or edit an image via any FAL image model (nano-banana edit, gpt-image, flux, ...), ROUTED THROUGH THE fal-proxy so it bills the Ads agent. image_urls must be public URLs; --image puts a local file on the fal CDN first. The recipe names the model + prompt. Use for keyframes, flat-cover transforms, product hero edits. (For the OpenAI gpt-image family specifically, create-image-gpt-image-fal also exists.)
status: active
---

# create-image-fal

Generate or edit an image via any FAL image model (nano-banana edit, gpt-image, flux, ...), ROUTED THROUGH THE fal-proxy so it bills the Ads agent. image_urls must be public URLs; --image puts a local file on the fal CDN first. The recipe names the model + prompt. Use for keyframes, flat-cover transforms, product hero edits. (For the OpenAI gpt-image family specifically, create-image-gpt-image-fal also exists.)

## Run
gen_image.py --model fal-ai/nano-banana/edit --payload '{...}' --out keyframe.png — bills the agent; returns the *.fal.media URL.

## Contract
- Paid calls route through the GooseWorks proxies (bills the Ads agent) via the
  bundled `media_proxy.py` — never a provider SDK's default host.
- The template recipe (DB) supplies the model + params; this capability is generic.

## Edit an image (Nano Banana edit)

`fal-ai/nano-banana/edit` is the default editor for a prompt-driven edit: a restage or scene swap,
a subject swap in the same pose, a product placed into a scene. It keeps subject geometry, the room
and the light. Use create-image-gpt-image-fal instead when lettering is the point of the edit
(logos, wordmarks, signage) or for a transparent cutout. Small text inside the source can come back
mangled with either model; check it.

```bash
gen_image.py --model fal-ai/nano-banana/edit --image product.png --image https://.../scene.jpg \
    --payload '{"prompt": "Put the bottle on the counter; keep everything else unchanged", "aspect_ratio": "9:16"}' \
    --out edit.png
```

- `--image` is repeatable and keeps its order; a public url passes through, a local file is put on
  the fal CDN through the GooseWorks storage proxy (free). Urls already in the payload's
  `image_urls` come first.
- Payload: `prompt` (required); `aspect_ratio` `auto` (the input's), `21:9`, `16:9`, `3:2`, `4:3`,
  `5:4`, `1:1`, `4:5`, `3:4`, `2:3` or `9:16`; `output_format` `png`, `jpeg` or `webp`; `seed`. The
  script saves the first image, so leave `num_images` at 1.
- There is no mask. For a region-locked edit, say "keep everything else unchanged" in the prompt.
- Keep the long edge of each input at about 2048 px or less.
- Check the result: it decodes, its size matches the asked aspect, and no watermark, garbled text
  or extra fingers appear.

## Creator references

Whenever the image will contain a person (creator, presenter, interviewee or any face in
focus), with or without a template recipe, read the bundled
[avatar-generation guide](references/avatar-generation.md) before any paid call. Unless the
selected recipe prescribes its own creator still, make the person with
create-creator-takes-h3's scripts/make_character.py, which calls this skill. Never hand-write
a person prompt here and never use a Flux route (fal-ai/flux/dev, fal-ai/flux/schnell) for a face.
When the selected video route forbids person references (for example the street-interview
format), make no person still at all.
If a required guide cannot be fetched or opened, stop and name the missing file.
Use the current project's creator choices and approved model binding; fetching
this guide does not authorize another image, a retry or a different render engine.

## Model notes

How the image models behave, measured on shipped projects. Each note lives here once; recipes
point here instead of repeating it.

- **Nano Banana: a reference anchors identity and style, not layout.** It keeps a product's
  colourway, materials and proportions, and takes framing, background and pose from the prompt.
  For a photo-faithful product, composite the real photo instead.
- **Nano Banana does not lock a face.** With one reference or four real frames, it matched the room
  and the clothes and returned a lookalike. Never use it to re-pose or re-light a person already in
  published work, and compare faces side by side at the same scale before anything downstream spends
  on the result.
- **Nano Banana redraws wordmarks** with wrong glyphs. For product lettering use gpt-image-2 edit
  (create-image-gpt-image-fal) or composite the real packshot.
- **Nano Banana paths** are `fal-ai/nano-banana` and `fal-ai/nano-banana/edit`. The engine label
  `nano_banana_2` is not a fal path, and the proxy refuses it as one.
- **Seedream 4.5 fills the canvas with a same-shaped subject:** a wide monitor in a 9:16 canvas came
  back turned portrait three times in four. Generate at the subject's own aspect and crop.
- **Seedream 4.5 draws the device you name.** "Shot on a phone camera" put a phone and a hand in the
  frame despite the negatives. Describe the artefacts (close range, wide lens, mild barrel
  distortion, sensor noise), never the device.
- **No image model holds a caption safe zone** from framing words. Generate loose, then crop or pad
  to the zone and check it by drawing the band on the frame.
- **Hard constraints:** see the note in create-video-fal; it applies to image prompts too.

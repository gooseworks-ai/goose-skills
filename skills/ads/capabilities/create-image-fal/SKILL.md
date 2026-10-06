---
name: create-image-fal
description: Generate or edit an image via any FAL image model (nano-banana edit, gpt-image, flux, ...), ROUTED THROUGH THE fal-proxy so it bills the Ads agent. image_urls must be public URLs (orchestrator hosts local product refs via MCP upload->presign). The recipe names the model + prompt. Use for keyframes, flat-cover transforms, product hero edits. (For the OpenAI gpt-image family specifically, create-image-gpt-image-fal also exists.)
status: active
---

# create-image-fal

Generate or edit an image via any FAL image model (nano-banana edit, gpt-image, flux, ...), ROUTED THROUGH THE fal-proxy so it bills the Ads agent. image_urls must be public URLs (orchestrator hosts local product refs via MCP upload->presign). The recipe names the model + prompt. Use for keyframes, flat-cover transforms, product hero edits. (For the OpenAI gpt-image family specifically, create-image-gpt-image-fal also exists.)

## Run
gen_image.py --model fal-ai/nano-banana/edit --payload '{...}' --out keyframe.png — bills the agent; returns the *.fal.media URL.

## Contract
- Paid calls route through the GooseWorks proxies (bills the Ads agent) via the
  bundled `media_proxy.py` — never a provider SDK's default host.
- The template recipe (DB) supplies the model + params; this capability is generic.

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

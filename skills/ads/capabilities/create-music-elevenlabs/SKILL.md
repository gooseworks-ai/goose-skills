---
name: create-music-elevenlabs
description: Generate an instrumental music bed via ElevenLabs Music, ROUTED THROUGH THE elevenlabs-proxy so it bills the Ads agent. Trims any sparse intro, loudnorm, fades the tail. Prompt + length from the template recipe. Use for the music layer of any video-ad format.
status: superseded
superseded_by: music-elevenlabs@1.0.1
---

> **Superseded:** the video kit now does this with the music-elevenlabs part, version 1.0.1, in the parts folder of this repository. It orders the bed through the private line and levels and fades it the same way. This atom stays, unchanged in behaviour, for skills outside the kit until they move; its scripts still run.

# create-music-elevenlabs

Generate an instrumental music bed via ElevenLabs Music, ROUTED THROUGH THE elevenlabs-proxy so it bills the Ads agent. Trims any sparse intro, loudnorm, fades the tail. Prompt + length from the template recipe. Use for the music layer of any video-ad format.

## Run
gen_music.py --prompt '...' --duration 10 --out music.m4a — bills the agent; writes a duration-clamped, loudnorm'd bed.

## Contract
- Paid calls route through the GooseWorks proxies (bills the Ads agent) via the
  bundled `media_proxy.py` — never a provider SDK's default host.
- The template recipe (DB) supplies the model + params; this capability is generic.

## Model notes

How ElevenLabs Music behaves, measured on shipped projects. Each note lives here once.

- **Prompts over about 1,000 characters return HTTP 400** with no reason. Keep the prompt short and
  structure it with timestamped sections.
- **`music_length_ms` is a suggestion:** a 32.9 second request came back 59 seconds, and a stated
  ending was ignored. Measure the energy curve, find the natural ending and keep the window that
  ends there, so the video closes on the music's own finish.
- **Through fal** (`fal-ai/elevenlabs/music` with a `composition_plan` and
  `respect_sections_durations`) the total length holds, but sections snap to bar lines and a
  silent section plays at full level. Cut silences in the edit. `force_instrumental` with a
  `composition_plan` returns 422.

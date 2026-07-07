---
name: create-music-elevenlabs
description: Generate an instrumental music bed via ElevenLabs Music, ROUTED THROUGH THE elevenlabs-proxy so it bills the Ads agent. Trims any sparse intro, loudnorm, fades the tail. Prompt + length from the template recipe. Use for the music layer of any video-ad format.
status: active
---

# create-music-elevenlabs

Generate an instrumental music bed via ElevenLabs Music, ROUTED THROUGH THE elevenlabs-proxy so it bills the Ads agent. Trims any sparse intro, loudnorm, fades the tail. Prompt + length from the template recipe. Use for the music layer of any video-ad format.

## Run
gen_music.py --prompt '...' --duration 10 --out music.m4a — bills the agent; writes a duration-clamped, loudnorm'd bed.

## Contract
- Paid calls route through the GooseWorks proxies (bills the Ads agent) via the
  bundled `media_proxy.py` — never a provider SDK's default host.
- The template recipe (DB) supplies the model + params; this capability is generic.

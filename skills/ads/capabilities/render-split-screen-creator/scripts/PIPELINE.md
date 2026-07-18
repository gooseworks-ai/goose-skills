# Pipeline — split-screen creator

How `config.example.json` maps to the real production steps. This capability
ships a **config + this map** — the FREE assembly + captions stage. The worked
example (Perplexity concept-10 "Bloomberg terminal") was produced by the per-scene
paid steps plus the split-screen assembler + the caption burn.

The steps run **in order** because each depends on the last: the script sets the
scene count, the VO + its per-scene timing drive the bottom-zone slices, the
locked voice + anchor drive the ONE VEED Fabric lip-sync take, the brand clips
fill the top zone, assembly stitches the two zones, and captions come from the
ASSEMBLED cut (not the raw VO).

## Field → source-step map

| Config field | Phase | Source step | Paid? |
|---|---|---|---|
| `voiceover.*`, `scenes[].vo` | 1 VO | ElevenLabs `eleven_v3` with-timestamps (`create-vo-elevenlabs`) → vo mp3 + timestamp JSON | **PAID** (~$0.06) |
| `scenes[].start/end`, `voiceover.outputs.timing` | 1 VO | slice per-scene start/end from the char timestamps → `timing.json` | free |
| `creator.anchor` | 2 Creator | gpt-image neutral portrait (`create-image-gpt-image-fal`) | **PAID** (~$0.10) |
| `creator.lipsync_*` | 2 Creator | **VEED Fabric 1.0 @ 720p — a NO-ATOM paid step** (`image_url` = anchor, `audio_url` = vo mp3) → creator lip-sync mp4 | **PAID** (~$5.90 / 39s) |
| `scenes[].top_clip` + `top_start/top_end` | 3 Top | brand-owned 16:9 UI screen-recordings (S02–SN) + the scene-1 hook graphic | (brand-supplied) |
| `layout.*`, `endcard.*`, assembly | 4 Assembly | the split-screen assembler — two-zone composite + hard-concat + end card → `master-precaption.mp4` | free |
| `captions.*` | 5 Captions | transcribe the ASSEMBLED cut (local `faster-whisper`) → word-level ASS burn → `concept-<n>-final-ad.mp4` | free |

## 1. Voiceover (config `voiceover`, `scenes[].vo`) — PAID

**Lock the script first** — ~6 scenes, one VO sentence per scene, each naming one
claim. Call ElevenLabs `eleven_v3` on the **with-timestamps** endpoint → the vo
mp3 + character-level timestamps. Slice per-scene start/end boundaries into
`timing.json` (`{"scenes":[{"scene":N,"start":s,"end":e}]}`). Creator-native VO
reads ~1.15–1.2×; apply `atempo` if it runs fast. **Lock the voice here** — a
second voice doubles the VEED spend downstream. This is upstream of the capability.

## 2. Creator anchor + lip-sync (config `creator`) — PAID, no-atom VEED step

A gpt-image neutral head-and-shoulders portrait (centered, plain background), then
the **whole VO** lip-synced in **one VEED Fabric 1.0 take @ 720p** (`veed/fabric-1.0`,
`image_url` = the portrait, `audio_url` = the vo mp3) → the creator lip-sync mp4.
**VEED Fabric is a no-atom paid step** — there is no `create-lipsync-*` atom; it's
an external FAL call (~$0.15/sec, ~$5.90 for a 39s VO). Always 720p — 480p reads
soft in the bottom zone. Run the lip-sync call(s) **sequentially with a `sleep`** —
`veed/fabric-1.0` storage-auths 403 under parallel load. Upstream of the capability;
the lip-sync take is a supplied input.

## 3. Top-zone clips + hook graphic (config `scenes[].top_clip`)

One brand-owned 16:9 UI screen-recording per demo scene (≥1920×1080), each showing
exactly what its VO line says (the #1 quality lever). Render the scene-1 hook
graphic (kinetic title-card / stat claim) separately. Confirm the end-card clip;
note the last **sharp** second before any fade-to-black as `endcard.clip_end`.

## 4. Ad-spec + assembly (config `layout`, `scenes[].top_*`, `endcard`) — FREE

Author the ad-spec (canvas 1080×1920, `top_height` ~998, `divider_color`, per-scene
`top_clip` + `top_start`/`top_end`, `endcard.clip` + `clip_end`) and run the
split-screen assembler. Per scene: TOP zone = the clip **contain-fit** + a darkened
**blurred cover-scale of the same clip** filling the letterbox margins (never
charcoal/black bars); a 3px brand-color divider; BOTTOM zone = the creator lip-sync
slice per `timing.json` (cover-fit, crop toward the top). **Never loop a short clip**
— window it and the assembler speed-fits it. Hard-concat the scenes; body audio =
the concatenated creator VO slices; append the end card holding the last sharp frame
~3s → `master-precaption.mp4`. Deterministic, $0.

## 5. Captions (config `captions`) — FREE

**Caption the ASSEMBLED cut, not the raw VO** — concat drops inter-scene silence, so
the ad timeline ≠ the VO timeline; only the final cut's audio yields correct caption
timing. Transcribe `master-precaption.mp4` with local `faster-whisper`, build
word-level cues (sentence-aware chunking), and burn the ASS in the chosen style
(`serif-accent`, `kinetic-pop`, `neon-glow`, `clean-bubble`) → `concept-<n>-final-ad.mp4`.
Keep the `-precaption` cut + the `.ass` sidecar so captions restyle without
re-rendering the composite. If the host ffmpeg lacks libass, render the cues as timed
PIL PNG overlays composited with ffmpeg `overlay=…:enable='between(t,st,en)'` instead.

Re-cuts (re-timed windows, a swapped blurred-fill, new caption chunking, a restyle, a
longer end-card hold) reuse the existing VO / lip-sync / clips and cost **$0** — only
steps 1–2 spend.

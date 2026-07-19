---
name: render-cartoon-music-video
description: Assemble a cartoon / animated / hand-crafted music-video ad from a config — a sung song carries the whole narrative while N per-bar i2v clips (one recurring animated character, one look pack) are each cut to their BAR window from librosa beat-tracking and hard-concatenated on the bar, VEED-whisper white bold-sans captions in the BOTTOM third (Alignment 2, above the logo bug, no pill) burned from the song's word timings re-spelled against the locked lyrics, a persistent brand logo bug held over the body (suppressed on the end card), and closed on a solid-brand-color PIL end card with the song still playing under it — never AI-rendered text. This is the FREE deterministic assembly stage (cut-to-bar + hard concat + logo bug + captions + end card + song mux); the song, character, keyframes, and clips come from create-music-elevenlabs / create-image-fal / create-video-fal. Use for the cartoon-music-video format.
status: active
---

# render-cartoon-music-video

Assemble a **cartoon music-video** ad from a config: an animated / illustrated / hand-crafted
story (stop-motion felt-and-foam, claymation, 2D toon, cut-out) where a sung song is the entire
script and one recurring animated character carries every shot, cut to the bar with the climax
line on the drop. This capability is the **FREE, deterministic assembly** — cut-to-bar,
hard-concat, the logo bug + captions burn, and the solid-color end card.

`scripts/config.example.json` is the worked example (Coinbase "Bet on anything", ~55s 1080×1920
9:16, 16 body bars + a 3s end card); `scripts/PIPELINE.md` maps every config block to its source
step and `scripts/README.md` documents the free assembly.

## Run

This is the **FREE, deterministic** assembly stage — it spends nothing. The paid inputs are
separate capabilities: the sung song (`create-music-elevenlabs`, or a user-supplied mp3 + Whisper
word timings) beat-tracked with librosa so the BAR GRID sets the timeline; one locked recurring
character + one keyframe per bar in one look pack (`create-image-fal`, Nano Banana); and one
Seedance i2v clip per bar (`create-video-fal`). Given the song + `word-timestamps.json` +
`bars.json` + one clip per bar + the brand wordmark SVG, `render-cartoon-music-video` cuts each
clip to its bar window, hard-concats on the bar, burns the logo bug + captions, appends the
solid-color end card, and muxes the song under it → the master. Re-cuts reuse the existing song /
keyframes / clips and cost **$0**.

## Contract (the free assembly)

- **The sung song carries the narrative — no separate VO.** The generated/supplied track IS the
  bed (no VO to duck under); do not add a spoken voiceover or a second bed.
- **Plan the timeline AROUND the delivered song's BAR GRID.** Beat-track the song with librosa
  (assume 4/4); one bar = one shot (default). Snap every tableau window to the bar boundaries —
  never trim the song to a pre-planned grid.
- **Captions from the song's word timings, re-spelled against the locked lyrics.** Whisper
  mishears shouted accents ("BETS" → "Hearts"); re-spell the timed tokens against the locked
  lyric file (never edit lyrics to match Whisper). VEED-whisper white **bold sans** in the
  **BOTTOM third** (Alignment 2, `margin_v` above the bottom-left logo bug), ~4–5 words per cue,
  NO background pill; captions STOP at the end-card boundary. Never mid-frame — it covers the
  character (fixed 2026-07). If the host ffmpeg lacks libass, render the cues as timed PIL PNG
  overlays (ffmpeg `overlay=…:enable='between(t,st,en)'`) at the same bottom placement.
- **Land the climax line on the drop.** The climax tableau is timed so the payoff line sits on
  the sub-bass drop; accent that line.
- **Persistent logo bug, suppressed on the end card.** Burn a white brand wordmark bottom-left
  over the body bars (cairosvg → PIL from the real SVG), suppressed on the end card where the big
  wordmark dominates.
- **End card via cairosvg + PIL from the real wordmark — never AI-render brand text.** Solid
  brand-color card + white wordmark + subhead, holding ~3s WITH the song still playing under it
  (afade-out over the tail — no silent tail). A diffusion model garbles a wordmark.
- **FFmpeg composite, deterministic, FREE.** Cut each clip to its bar window, hard-concat, burn
  the logo bug + captions, append the end card, mux the song over the whole video with a 0.5s
  afade tail, `loudnorm I=-14` → a 1080×1920 h264+aac master. No paid calls, no keys. When the host
  ffmpeg lacks libass/drawtext, BOTH the captions and the logo bug are timed **PIL PNG overlays**
  (`overlay=x:y:enable='between(t,st,en)'`), not an ASS burn.
- **QC PER SCENE, never just the master — the two failure modes are content, not assembly.** The
  upstream keyframe/i2v steps can (a) drift the character **felt → smooth-3D "man"** partway
  through and (b) hallucinate hands — realistic fingers in a hand macro, a **pointing finger** on a
  "tap the phone" shot, or a **disembodied hand** sliding in from the frame edge. Both hide at
  thumbnail size. Extract a **2 fps** contact sheet + a per-bar **FACE** crop and **HAND** crop
  (across each clip's full duration), confirm every bar is matte felt with the ONE character and no
  human/floating hands, and re-check the **served** bytes after publish. A drifted bar means
  regenerating that bar's **KEYFRAME** (not re-cutting) — see the recipe STEP 3/6.

---
name: render-song-mv
description: Assemble a song-driven music-video ad from a config — a generated sung track carries the whole narration across N tableaux (one keyframe -> one i2v clip per lyric beat) with NO separate voiceover, captions synced to the song's OWN word timings (script-window, never Whisper) and the hook word landing on the chorus drop, closed on a PIL brand end card. This is the FREE deterministic assembly stage (clip cut-to-timeline + captions + end card + FFmpeg composite); the song, keyframes, and clips come from create-music-elevenlabs / create-image-fal / create-video-fal. Use for the song-driven-music-video format.
status: active
---

# render-song-mv

Assemble a song-driven music-video ad from a config: a purpose-written, **sung** song is
the entire narration (no separate voiceover), and every visual beat is timed to the lyrics.
The delivered song sets the timeline; N tableaux (one keyframe → one image-to-video clip per
lyric beat, all in a single look pack) are cut to their lyric windows and hard-concatenated
on the beat, captions are built from the song's OWN word timings with the hook line landing
on the chorus drop, and the spot closes on a PIL brand end card. It reads like a tiny animated
music video, not a demo. `scripts/config.example.json` is the worked example (Loóna "Fall In
Love With Sleep Again", 28s paper-craft 9:16); `scripts/PIPELINE.md` maps every config block
to its step and `scripts/README.md` documents the free assembly.

## Run

This is the **FREE, deterministic** assembly stage — it spends nothing. The three paid
inputs are separate capabilities: the sung song (`create-music-elevenlabs`, music_v1,
force_instrumental FALSE — the lyrics ARE the script, returns mp3 + `words.json`), one
keyframe per tableau (`create-image-fal`), and one Kling 3.0 i2v clip per tableau
(`create-video-fal`). Given the delivered song + `words.json` + one clip per beat,
`render-song-mv` cuts each clip to its lyric window, hard-concats on the beat, builds the
lyric-synced captions, composites the PIL end card, and muxes → the master. Re-cuts reuse
the existing song / keyframes / clips and cost **$0**.

## Contract (the free assembly)

- **The sung song carries the narration — no separate VO.** The generated ElevenLabs track
  IS the bed and the script (`force_instrumental` false); do not add a spoken voiceover or a
  second music bed.
- **Plan the timeline AROUND the delivered song.** The song is generated first and reshapes/
  overshoots length; snap every tableau boundary to the lyric-phrase edges in the returned
  word timings (`timeline.json`) — never trim the song to a pre-planned grid.
- **Captions from the song's OWN word timings, not Whisper (script-window).** Chunk
  `audio/words.json` (~3 words at lyric boundaries); accent words get the warm-glow color.
  Whisper on sung audio returns "🎵 Music Playing 🎵", so it can't caption lyrics.
- **Land the hook on the chorus drop.** Exactly ONE hero tableau (`is_hook`) is timed so the
  payoff word (`song.hook_word`) sits on the chorus drop; accent that word in the captions.
- **One look pack for consistency.** A single `style_opener` + `negative_tail` + palette drives
  every keyframe so N beats read as one film; no morph within a clip.
- **Hard cuts on the beat.** Cut each clip to its lyric window and hard-concat — no dissolves
  (one optional match-cut into the hero reveal).
- **PIL end card from the real app icon — never AI-render brand text.** The lockup is
  composited deterministically (brand gradient + circular app icon + wordmark + tagline + CTA)
  from the brand's real asset; a diffusion model garbles a wordmark.
- **FFmpeg composite, deterministic, FREE.** Burn the caption ASS, overlay the end-card PNG on
  the final window, mux the song, boost the climax beat, loudnorm to −14 LUFS → 1080×1920
  h264+aac. No paid calls, no keys.

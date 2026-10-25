---
name: render-cinematic-music-video
description: Assemble a cinematic live-action-style music-video ad from a config — an original sung anthem carries the whole narrative while N 35mm-film-look i2v clips are each cut to their lyric window and hard-concatenated on the beat as a 3-act arc, the anthem muxed at loudnorm I=-14, cinematic lower-third serif captions built from the song's OWN word timings (never Whisper) with the hook line landing on the chorus drop, and closed on a brand end card composited from the real asset — never AI-rendered text. This is the FREE deterministic assembly stage (cut-to-window + hard concat + anthem mux + captions + end card); the anthem, keyframes, and clips come from create-music-elevenlabs / create-image-gpt-image-fal / create-video-fal. Use for the cinematic-music-video format.
status: active
---

# render-cinematic-music-video

Assemble a **cinematic music-video** ad from a config: a live-action-STYLE short film where an
original sung anthem is the score and every visual beat is a shot-on-film tableau (Kodak Portra
grain, light leaks, natural light, handheld imperfection) timed to the lyrics, arranged as a
3-act arc (its shape is the user's `story_arc` choice) with the hook line on the chorus drop. This capability is
the **FREE, deterministic assembly** — cut-to-window, hard-concat, anthem mux, caption burn,
and the brand end card.

`scripts/config.example.json` is the worked example (Sundrift "Roll On", ~28s
1080×1920 9:16, 14 tableaux) — copy its structure, never its creative values; `scripts/PIPELINE.md` maps every config block to its source step
and `scripts/README.md` documents the free assembly.

## Run

This is the **FREE, deterministic** assembly stage — it spends nothing. The paid inputs are
separate capabilities: the sung anthem (`create-music-elevenlabs`, `force_instrumental` false —
the lyrics ARE the script, returns mp3 + `words_timestamps`); one 35mm-film keyframe per beat
in one look pack (`create-image-gpt-image-fal`); and one Kling 3.0 i2v clip per beat (`create-video-fal`).
Given the delivered anthem + `words.json` + one clip per beat + the brand end-card asset,
`render-cinematic-music-video` cuts each clip to its lyric window, hard-concats on the beat,
muxes the anthem, burns the cinematic lower-third captions, and overlays the end card → the
master. Re-cuts reuse the existing anthem / keyframes / clips and spend nothing.

This skill ships no assembler script of its own. Do the cuts and captions with the
`stitch-videos-ffmpeg` skill's `montage.py` (`../stitch-videos-ffmpeg/SKILL.md`) and the anthem
mux with one ffmpeg pass; `scripts/PIPELINE.md` step 4 lists each step.

## Choices

The creative content this stage assembles is decided upstream by the format's `choices`, asked
of the user before any paid step. The worked example's values are examples, never defaults:

- **song_style** — the anthem's genre, mood, BPM and arrangement. The demo used a sunny
  120-BPM indie surf-pop anthem.
- **vocalist** — who sings it. The demo used a bright, warm female lead.
- **cast** — who is on screen in the tableaux. The demo used four young women roller skaters.
- **setting** — place + time of day (drives the look pack's light and palette). The demo used a
  seaside boardwalk town in late summer, golden hour.
- **story_arc** — the 3-act shape of the tableaux and lyrics. The demo used one summer day,
  morning → skate-bowl peak → twilight, with an origin-story wink.

This assembly reads them only through the config (`tableaux[]` windows + captions, the anthem,
`captions.accent_words`, `end_card.*`); it hardcodes none of them.

## Contract (the free assembly)

- **The sung anthem carries the story — no separate VO.** The generated ElevenLabs track IS
  the bed and the script (`force_instrumental` false); do not add a spoken voiceover or a
  second bed.
- **Plan the timeline AROUND the delivered anthem.** The anthem is generated first and
  reshapes/overshoots length; snap every tableau boundary to the lyric-phrase edges in the
  returned word timings — never trim the anthem to a pre-planned grid.
- **Captions from the anthem's OWN word timings, not Whisper.** Derive `words.json` from the
  music model's `words_timestamps`, chunk ~4 words at lyric boundaries, and burn cinematic
  lower-third serif captions (low on the frame) with the hook line and accent words in the accent colour.
  Whisper on sung audio returns "🎵 Music Playing 🎵".
- **Land the hook on the chorus drop.** The hero tableau (`is_hook`) is timed so the
  load-bearing line sits on the chorus drop; accent that line in the captions.
- **One cinematic look pack + hard cuts on the beat.** The look pack (named film stock + grain +
  flares + handheld) plus a continuity anchor holds every clip together; cut each clip to its
  lyric window and hard-concat (one optional match-cut into the hero reveal) — no dissolves.
- **End card from the real brand asset — never AI-render the wordmark as diffusion text.**
  Composite the lockup (PIL/ffmpeg) from the real asset or use a designed keyframe base;
  diffusion garbles a wordmark.
- **FFmpeg composite, deterministic, FREE.** Normalize each clip to its beat-locked window,
  hard-concat, mux the anthem (`afade` in/out + `loudnorm I=-14`), burn the captions, overlay
  the end card → a 1080×1920 h264+aac master. No paid calls, no keys.

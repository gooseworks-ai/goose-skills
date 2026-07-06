---
name: create-song-driven-music-video-from-refs
description: >-
  Produce a single vertical "song ad" (≈28s, 9:16) — a paper-craft / claymation-style
  MUSIC VIDEO where a purpose-written, sung song carries the entire narrative and there
  is NO separate voiceover. First generate the song (ElevenLabs music_v1) from a
  structured brief (intro / verse / pre-chorus / chorus / outro) with locked lyrics, so
  the model returns the audio PLUS word-level timestamps. Then build N tableaux (one per
  lyric beat) — a Higgsfield GPT-image-2 keyframe per beat in one consistent look pack,
  each animated by a Higgsfield Kling 3.0 image-to-video clip — cut each clip to its
  lyric window, and burn captions synced to the song's WORD timings so the hook line
  lands exactly on the chorus drop. Close on a brand end card. Use when a brand wants an
  emotional, story-driven, stylized reveal set to an original song (sleep/wellness/toy/
  storybook brands, personified-world ads). NOT for a talking-head UGC video, NOT for a
  spoken-VO explainer, and NOT for a product-demo listicle.
status: active
---

# create-song-driven-music-video-from-refs

## Purpose

Recreate the **song-driven music-video ad**: a short, stylized story (paper-craft
diorama, claymation, Aardman, cut-paper storybook) where an **original sung song is the
narration** and every visual beat is timed to the lyrics. There is no voiceover — the
verse/chorus lines ARE the script, and the emotional turn lands on the chorus drop. It
reads like a tiny animated music video, not an ad. The canonical worked example is
Loóna's "Fall In Love With Sleep Again" — a 28s paper-craft dreamscape where a
paper-doll sleeper trades a 2AM doomscroll for a moonlit paper village, and the hook
"fall in love with sleep again" lands on the word "fall" at the chorus drop (`demo/`).

The reusable IP is **the song-first pipeline**: (1) generate the song from a structured
composition brief so the model returns audio **plus word-level timestamps**, (2) plan the
scene count + every scene boundary AROUND the real song length and its lyric windows,
(3) one keyframe per beat in a single **look pack** for consistency → one i2v clip per
beat, and (4) captions built from the song's own word timings, with the hook line
composited to hit the chorus drop.

**Why a generated sung song (not spoken VO + a bed):** for character/claymation/mascot
and emotional narrative ads, putting the narration *inside* the sung track reads warmer
and never fights a separate VO. The song also overshoots or reshapes the requested
length, so the timeline is planned around the delivered track — not the other way round.
Word-level timestamps come back with the song, so captions sync to the actual sung
words (script-window), never Whisper.

Use this when the brand wants:
- An **emotional, story-driven** spot (sleep, wellness, toys, storybook, "a little
  world" brands) rather than a demo or testimonial.
- A **stylized, consistent look** (paper-craft, claymation, cut-paper, soft 3D) held
  across every beat by one look pack.
- A **hook line that lands on the music** — the payoff word on the chorus drop.

## Inputs

Required (one `config.json` — copy `config.example.json`, the Loóna example):
- **Song** — `song.prompt` (the vibe/instrumentation), `song.structure` (intro / verse /
  pre-chorus / chorus / outro, each with `duration_ms` + the exact `lines`), `song.hook_line`
  and `song.hook_word` (the load-bearing word that must land on the chorus drop). Locked
  lyrics live in `song.lyrics_md`. No artist names in the vibe (ElevenLabs ToS filter).
- **Look pack** — `look_pack.name` + `palette_anchors` + a `style_opener` (prepended to
  every keyframe prompt) + a `negative_tail`. One pack drives all N keyframes so the
  sequence reads as one film.
- **Tableaux** — N beats (Loóna used 14), each `{id, role, lyric_anchor, keyframe_prompt,
  motion_hint, caption}`. One keyframe + one i2v clip per beat.
- **End card** — the brand lockup, composited deterministically (PIL/ffmpeg) from a real
  brand asset — **never AI-rendered text**.

Optional (defaults in `config.example.json`):
- **Keyframe / clip models + prompts** — Higgsfield `gpt_image_2` (keyframes, 2k 9:16)
  and `kling3_0` (i2v); tuned motion opener provided.
- **Caption style** — lower-third serif italic, accent words in the warm-glow color,
  chunked ~3 words at lyric boundaries.
- **dims** (1080×1920 master), **fps** (30), **duration** (planned around the delivered song).

Assets are git-LFS in brand folders — **fetch + checkout each first** (pointers are
~131-byte stubs).

## Engine (scripts/)

This molecule ships a **config + a pipeline map**, not a bundled runner — the worked
example was produced by the control-plane orchestrator's step scripts. `scripts/PIPELINE.md`
maps every config field to its source step + script (in
`clients/loona/ad-runs/run-01-run1/working/`).

| Config block | Source step | Script (in the run's `working/`) |
|---|---|---|
| `song` | **PAID.** ElevenLabs `music_v1` from the composition brief → mp3 + `words.json` | (music-gen atom; brief = `song.structure`) |
| `tableaux[].keyframe_prompt` | **PAID.** Higgsfield `gpt_image_2`, 2k 9:16, one per beat | `render_keyframes.py` |
| `tableaux[].motion_hint` | **PAID (Kling 3.0 i2v).** Each keyframe → a ~5s clip | `render_clips.py` |
| `captions` | Captions from `audio/words.json` word timings → ASS | `build_captions_v2.py` |
| `end_card` | PIL composite from the real brand asset | `build_end_card.py` |
| assembly | Cut each clip to its lyric window, hard-concat, burn captions, overlay end card, mux song, loudnorm | `promote_master*.py` |

Requires `higgsfield` CLI (on PATH), an ElevenLabs `music_v1` call, `Pillow`, `ffmpeg`;
keys `ELEVENLABS_API_KEY` from `gtm-goose/.env` (Higgsfield uses the CLI's own auth —
set the Gooseworks workspace first).

## Workflow

### Phase 0 — Intake (song brief first)
Derive the checklist: the song vibe + structure + locked lyrics + hook word, the look
pack (style + palette), N tableaux (prompt + lyric anchor + motion), the brand end-card
asset. Ask only the true taste calls (vibe, look pack, hook line, scene beats). Write
`config.json`. **Never invent brand claims; the end card uses the brand's real asset.**

### Phase 1 — Generate the song [PAID — GATE]
ElevenLabs `music_v1` from `song.structure` (per-section styles + lines). It returns the
mp3 **and** `words.json` (word-level timestamps). **Wait for approval before firing.**
`/watch`-listen: confirm the sung lyrics match the lock and the hook word lands on the
chorus drop. **This song, not the plan, sets the timeline** — read the real word timings
and snap every scene boundary to lyric-phrase edges (see the delivered `timeline.json`).

### Phase 2 — Keyframes [PAID, 1 image/beat — GATE]
Higgsfield `gpt_image_2`, 2k 9:16, `style_opener + keyframe_prompt + negative_tail` per
beat, in parallel batches of 3 (Higgsfield burst-credit reserve). **Review all N before
the i2v step** — every keyframe must read in the one look pack (same paper/claymation
register, palette, character-face discipline). Re-roll any that drift.

### Phase 3 — i2v clips [PAID Kling call/beat — GATE]
`render_clips.py`: each keyframe → a ~5s Kling 3.0 clip with the beat's `motion_hint`
(subtle diorama motion, no CGI swoop). **Wait for approval — the largest spend.** `/watch`
each; the look and character must hold from frame 0 (no morph). Re-anchor off the clean
keyframe on any drift.

### Phase 4 — Captions + assembly + end card
`build_captions_v2.py` chunks `audio/words.json` (~3 words at lyric boundaries; accent
words get the warm-glow color) → ASS. Assembly cuts each clip to its lyric window,
hard-concats on the beat, burns the captions, overlays the PIL end card on the final
window, muxes the song, and loudnorms to −14 LUFS. Iterate the cut for free.

### Phase 5 — Watch / QC (mandatory before ship)
`/watch` the whole master. Confirm: the hook word lands exactly on the chorus drop; every
caption tracks the sung word; the look pack holds across all N beats; hard cuts on the
beat; the end card + brand lockup land; the song carries with no separate VO.

## Decision Rules

- **The song carries the narrative — no separate VO.** The sung verse/chorus lines ARE
  the script. Do not add a spoken voiceover or a separate music bed.
- **Plan the timeline AROUND the delivered song.** Generate the song first; the model
  reshapes/overshoots length. Snap scene count + every boundary to the real lyric windows
  in the returned word timings — never trim the song to a pre-planned grid.
- **Captions from the song's word timings, not Whisper.** ElevenLabs `music_v1` returns
  `words.json`; chunk THAT (script-window). Whisper on sung audio returns "🎵 Music 🎵".
- **Land the hook on the chorus drop.** The payoff word (`song.hook_word`, "fall" for
  Loóna at ~15.2s) must sit on the chorus drop, and the hero tableau (the world-reveal
  beat) is timed to it. Accent that word in the captions.
- **One look pack for consistency.** A single `style_opener` + `negative_tail` + palette
  drives every keyframe so N beats read as one film. Lock the character-face discipline
  once (Loóna: closed paper eyes, no mouth/nose) and hold it.
- **Hard cuts on the beat.** Cut each clip to its lyric window and hard-concat — no
  dissolves (one optional match-cut into the hero reveal).
- **Never AI-render the brand lockup.** The end card is composited via PIL from the
  brand's real asset (the app icon/wordmark), never text-in-diffusion.

## Output

- `master-v3.mp4` — 1080×1920, ≈28s, h264 + aac (the song). N beats + a composited brand
  end card, captions burned, −14 LUFS. No VO.
- A poster still (the hero-reveal frame).
- `keyframes/`, `clips/`, `audio/` (song mp3 + `words.json`), the end-card PNG — kept for
  re-cuts.

## Quality Checks

- Canvas 1080×1920 at `fps`; duration ≈ the delivered song length (~28s), scene boundaries
  on lyric-phrase edges.
- The hook word lands on the chorus drop; the hero tableau is timed to it.
- Every caption tracks the actual sung word (from `words.json`), accent words colored.
- The look pack holds across all N beats (same style/palette/face discipline); no morph
  within a clip.
- Hard cuts on the beat (no dissolves bar the one hero match-cut); brand end card lands;
  the song carries with no separate VO.

## Failure Modes

- **Timeline planned before the song** → scenes don't sit on the beat / hook misses the
  drop. Generate the song FIRST, then snap boundaries to the returned word timings.
- **Captions only cover the chorus** → the lyric file didn't match the sung
  phoneticization (e.g. "loóna" sung "loo-nah"). Build captions from `audio/words.json`
  directly, not from the pre-written lyric md.
- **Whisper on the sung track returns "Music Playing"** → use the `words.json` the
  music model returns; never Whisper sung audio for captions.
- **A keyframe/clip drifts out of the look pack** → re-roll with the shared `style_opener`
  + `negative_tail`; re-anchor i2v off the clean keyframe (not a drifted frame).
- **Brand text garbled ("therapits")** → never AI-render the lockup; composite the end
  card in PIL from the real brand asset.
- **ElevenLabs Music rejects the prompt** → strip artist names from `song.prompt` (ToS
  filter); describe the vibe/instrumentation only.
- **Higgsfield `not_enough_credits` on a burst** → submit in batches of 3 (burst-credit
  reserve); switch the Gooseworks workspace before the run or spill over to fal.ai.

## Related

- The remix twin — `remix-song-driven-music-video-from-sample` — is what the app's format tab calls; it swaps
  the brand into this builder's `config.json` and publishes back through the
  goose-video runtime. Format link: `recipe.format: "song-driven-music-video"`.

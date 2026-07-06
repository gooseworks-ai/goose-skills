# Expected Output

## Artifacts
- `renders/master-v3.mp4` — 1080×1920, ≈28s, **h264 + aac** (the sung song). N beats
  (one per lyric window) + a composited brand end card, captions burned, −14 LUFS. **No VO.**
- `audio/music.mp3` + `audio/words.json` — the generated song and its word-level timings.
- `keyframes/<id>/v1.png` — the N look-pack keyframes (2k 9:16).
- `clips/<id>/v1.mp4` — the N Kling 3.0 i2v clips.
- `working/end-card.png` — the PIL brand lockup.
- `finals/master-final-v2.ass` — the word-synced captions.
- A poster still (the hero-reveal frame, T08).

## Visual shape (whole spot)
- One consistent look pack (paper-craft DREAMSCAPE_NIGHT) across all N tableaux; same
  palette + character-face discipline; no morph within a clip.
- The story runs on the song: intro → doomscroll verse → tap + suspension → **hero world-
  reveal on the chorus drop** → village peak → product hero → montage → outro → end card.
- Hard cuts on the beat (one match-cut into the hero reveal). Camera motion stays subtle.

## Audio + captions
- The generated sung song is the ONLY audio — no separate voiceover, no second music bed.
- The hook word ("fall") lands on the chorus drop (~15.24s); the HOOK_HERO tableau is
  timed to it and boosted +2dB at the climax.
- Captions are built from the song's OWN word timings (`audio/words.json`), ~3-word chunks,
  lower-third Georgia italic, accent words in warm-glow #FFD89C.
- Brand end card (wordmark + tagline + real app icon), composited via PIL on the final window.

## Non-goals
- No talking head, no spoken voiceover, no separate music bed.
- No Whisper captions on the sung track (use the returned `words.json`).
- No AI-rendered brand text — the lockup is composited from the real brand asset.
- No timeline planned before the song — the delivered song sets the boundaries.
- No dissolves (bar the one hero match-cut); no look-pack drift across beats.

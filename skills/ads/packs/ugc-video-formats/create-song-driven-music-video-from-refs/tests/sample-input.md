# Sample Input

## Brief
A song-driven music-video ad for **Loóna** (a sleep app) — a ~28s paper-craft
DREAMSCAPE_NIGHT dream where an original SUNG song carries the whole story: a paper-doll
sleeper trades a 2AM doomscroll for a moonlit paper village. NO separate voiceover. The
hook "fall in love with sleep again" lands on the word "fall" at the chorus drop. Vertical
9:16, ~28s, closing on the Loóna brand end card.

## Song (generated FIRST — sets the timeline)
Dreamy synthwave lullaby, breathy female vocal, 80 BPM. Structure: 3s instrumental intro,
7s verse, 5s pre-chorus build, 8s atmospheric chorus drop (hook on "fall"), 5s stripped
outro. Locked lyrics: `source/lyrics-locked.md`. ElevenLabs `music_v1` returns the mp3 +
word-level timings (`audio/words.json`). No artist names in the prompt.

## Look pack (one, for consistency)
DREAMSCAPE_NIGHT — cut-paper diorama at night, cool moonlight, pastel palette (lavender
night / moonlight silver / dusty pink / mint / cream / deep night blue / warm window glow).
Character-face discipline: paper-doll figure, closed paper eyes, NO mouth/nose/eyebrows.

## Tableaux (14 beats, one keyframe + one i2v clip each)
S01 intro (phone glow) → S02–S04 the doomscroll verse → S05–S07 the tap + suspension →
**S08 HOOK_HERO (world reveal, on the chorus drop)** → S09 village peak → S10 product hero →
S11 catalog montage → S12 origin wink (luna) → S13 asleep outro → S14 brand end card.

## Captions + end card
- Captions from `audio/words.json` (the sung words — NOT Whisper); ~3-word chunks, lower-
  third Georgia italic, accent words (fall/love/sleep/again/tap/soft/color/worlds/dreaming/
  loo-nah) in warm glow #FFD89C.
- End card: Loóna wordmark + tagline + real app icon, composited via PIL (never AI-rendered).

Full config: `scripts/config.example.json`. Reference render:
`demo/finals/loona-fall-in-love-with-sleep.mp4`.

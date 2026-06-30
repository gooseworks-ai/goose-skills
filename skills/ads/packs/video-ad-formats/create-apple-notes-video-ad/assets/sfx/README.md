# Keyboard SFX

The three files in this folder drive the per-keystroke audio in the typing video:

| File | Triggered on | Notes |
|---|---|---|
| `kb-tick.mp3` | Every letter / number / punctuation keystroke | ~25ms transient |
| `kb-space.mp3` | Space key | ~40ms, slightly heavier than tick |
| `kb-return.mp3` | Carriage return between paragraphs | ~60ms, lowest pitch |

## What ships

The bundled files are **real iPhone keyboard taps** sliced out of BigSoundBank's
[iPhone Touch Sound #1](https://bigsoundbank.com/detail-0447-iphone-touch-sound.html) (CC0 / public domain — free for commercial use).

The source is a ~4.7s recording of 7 individual taps. We extract:

| File | Source offset | Trim length | Use |
|---|---|---|---|
| `kb-tick.mp3`   | 0.840s | 90ms  | Every letter / punctuation keystroke |
| `kb-space.mp3`  | 1.445s | 110ms | Space bar |
| `kb-return.mp3` | 2.954s | 130ms | Carriage return between paragraphs |

All three are the same recording, just different taps from the sequence — so they sound subtly different (mic position drift, fingertip angle) while staying consistent with the iPhone source.

## Re-source if you need different feel

If a brand voice calls for a slightly different keyboard, alternatives:

1. **iOS device screen recording**: capture from your own iPhone with Keyboard Clicks enabled (`Settings → Sounds & Haptics → Keyboard Feedback → Sound`), then extract the transients via Audacity. Trim each to <130ms.
2. **CC0 alternatives**: Pixabay or Freesound under CC0 — search for "iphone keyboard click" or "ios tap". Loudness-normalize to **-9 LUFS, peak 0dB** so they cut through the music bed without further tweaking.

After replacing the files, re-run `bash edits/stitch.sh` — no other changes needed. The cue list (`clips/master-typing.sfx.json`) doesn't change; the stitch step references these MP3s by filename.

## LFS

These files are git-lfs-tracked (per the repo's `.gitattributes`). If `ffmpeg` reports `Invalid data found when processing input`, you have a 130-byte pointer file instead of the audio. Recover with:

```bash
git lfs pull --include="skills/molecules/create-apple-notes-video-ad/assets/sfx/*"
```

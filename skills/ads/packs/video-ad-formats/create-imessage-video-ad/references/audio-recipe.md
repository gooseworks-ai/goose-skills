# Audio recipe — exact ffmpeg parameters

The audio mix is what separates "fake DM ad" from "feels like an actual iMessage thread". Get it wrong and viewers tune out in the first 3 seconds.

## SFX sources

Pre-bundled in this skill at `assets/sfx/`. They came from BigSoundBank (CC0):

| File | Source | Trim/Process |
|---|---|---|
| `imessage-send.mp3` | https://bigsoundbank.com/UPLOAD/mp3/1313.mp3 | `loudnorm=I=-9:TP=-1:LRA=7,volume=1.2` |
| `imessage-receive.mp3` | https://bigsoundbank.com/UPLOAD/mp3/1111.mp3 | `-t 1.4 -af "afade=t=out:st=1.0:d=0.4,loudnorm=I=-9:TP=-1:LRA=7,volume=1.1"` |

Both end up at peak 0dB / mean roughly -9 to -11dB. Reusing the bundled copies is faster and guarantees the levels match across ads in the same brand family.

## Music bed

A lofi/hip-hop instrumental, ~80–95bpm, no vocals. The bed sits **under** the SFX — its job is to fill silence and set tempo, not to perform.

Reusable beds already in the repo:
- `coca-cola/ad-runs/video-01-museum-painting/audio/variants/A_hiphop/music.mp3` — 35s lofi hip-hop, the canonical pick
- `peloton/ads/video-01-new-mom-comeback/audio/music-bed.mp3` — alternative

Generate a new bed only if the brand voice demands a different vibe (e.g. high-energy electronic for a gaming product).

## Mix recipe

Inside `stitch.sh`, the audio filter graph for a chat with N SFX cues:

```python
inputs = [
    "-f", "lavfi", "-t", str(total), "-i", "anullsrc=r=44100:cl=stereo",   # silent base
    "-i", music,                                                           # bed
    *sum(([f"-i", f"<sfx_dir>/imessage-{c['name']}.mp3"] for c in cues), [])
]

filter = ";".join([
    # Music: loop, trim to total, kill rumble below 60Hz, sit at -10dB,
    # fade out 1.5s before the end so the FREEPACK CTA can land in (relative) silence.
    f"[1:a]aloop=loop=-1:size=2147483647,atrim=duration={total},highpass=f=60,volume=0.30,afade=t=out:st={total-1.5}:d=1.5[mus]",

    # SFX: each cue gets adelay'd to its t in ms.
    *[f"[{i+2}:a]adelay={int(c['t']*1000)}|{int(c['t']*1000)},volume=0.95[s{i}]" for i, c in enumerate(cues)],

    # Mix: normalize=0 disables amix's auto-divide-by-N (this is the #1 audio mistake).
    f"[0:a][mus]{''.join(f'[s{i}]' for i in range(len(cues)))}amix=inputs={2+len(cues)}:duration=first:dropout_transition=0:normalize=0,volume=2.5,alimiter=limit=0.95[aout]"
])
```

## Why each parameter

- **`normalize=0`** — without this, every input gets divided by N. With 13 inputs (silence + music + 11 SFX), everything becomes -22dB and sounds whisper-quiet.
- **`volume=2.5` after the mix** — compensates for individual inputs being below 0dB; brings the mix up to a usable level before the limiter.
- **`alimiter=limit=0.95`** — catches any peaks that try to exceed -0.5dBFS so you don't get audible clipping on phones with low-cost DACs.
- **`highpass=f=60` on music** — kills sub-bass rumble that would muddy the SFX. The phone speakers can't reproduce it anyway.
- **`afade=t=out:st={total-1.5}:d=1.5`** — fades the music *before* the end card lands. Critical: the brand sting + CTA needs (relative) silence to register.
- **SFX `volume=0.95`** — slightly under unity so the limiter has headroom. The SFX files are already loudness-normalized to -9 LUFS in this skill's `assets/sfx/`, so 0.95 is just safety margin.

## Validation

After stitching:

```bash
ffmpeg -i edits/master-final.mp4 -af volumedetect -vn -f null - 2>&1 | grep -E "mean|max"
```

Expected: `mean_volume: -9 to -12 dB`, `max_volume: 0.0 dB`.

If `max_volume < -3 dB` → mix too quiet, bump `volume=2.5` higher.
If `max_volume = 0.0 dB` and you hear distortion → mix is clipping pre-limiter; drop `volume=2.5` to 2.2 or lower individual SFX `volume=` values.

## SFX timing

Cues come from `master-chat.sfx.json` which is written by `record-master.js` from the deterministic `TIMELINE` array. Do **not** capture cues from `performance.now()` inside the page — there's a race with the page's `load` event that drops 2–3 cues in every 14-cue run. The bundled `record-master.template.js` does it correctly.

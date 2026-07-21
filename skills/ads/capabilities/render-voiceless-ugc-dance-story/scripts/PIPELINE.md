# Pipeline — voiceless UGC dance-story

How `config.example.json` maps to the real production steps. This capability ships a
**config + this map**, not a bundled runner: the worked example (Bioma "dance story") was produced
by four per-project drivers in the source run
(`gen_shot_stills.py`, `gen_dance_clips.py`, `gen_overlays.py`, `compose.py`, `beat-grid.json`).
Reference those directly, or drive the whole run via `video-orchestrator-with-control-plane`.

The six steps run **in order** because each depends on the last: the music sets the timeline (via
its BEAT GRID), the beat grid drives the segment durations, the locked creator + look pack drive the
stills, the stills seed the dance clips, the narrative beats drive the overlays, and assembly
stitches all of it with the overlays + end card.

## Field → source-step map

| Config field | Phase | Source step / script | Paid? |
|---|---|---|---|
| `music.prompt`, `music.model`, `music.structure`, `music.length_ms` | 1 Music | ElevenLabs `music_v1` → `music.mp3` (create-music-elevenlabs) | **PAID** |
| `beat_grid`, `music.bpm`, `beat_grid.downbeats` | 1 Beat grid | `librosa.beat.beat_track` + `librosa.onset.onset_detect` → `beat-grid.json` | free |
| `character.descriptor`, `character.wardrobe_lock`, `character.world_lock`, `character.anchor` | 2 Creator | gpt-image-2 anchor (1024×1536, quality high), 4 candidates → `LOCKED.json` (create-image-gpt-image-fal) | **PAID** |
| `look_pack.style_descriptor`, `look_pack.negative_tail`, `look_pack.aesthetic` | 3 Stills | threaded verbatim into every still prompt | (defines cost) |
| `tableaux[].still_prompt`, `tableaux[].uses_product`, `keyframe_engine` | 3 Stills | `nano-banana-pro/edit`, 9:16, one per shot (anchor primary ref; bottle 2nd ref on s04/s08) → `shot-NN-still.png` (create-image-fal) | **PAID** |
| `tableaux[].motion_hint`, `clip_engine` | 4 Clips | Seedance 2.0 i2v, ~4s, 720p, `generate_audio: false` → `shot-NN.mp4` (create-video-fal) | **PAID** |
| `overlays`, `tableaux[].overlay_text`, `overlays.progress_bar`, `overlays.disclaimer` | 5 Overlays | Playwright + Chromium → transparent PNGs (`gen_overlays.py`) | free |
| `overlay_windows` | 5 Assembly | `compose.py` step 3 (`overlay=0:0:enable='between(t,st,en)'`, hard pop) | free |
| `tableaux[].t_start/t_end/src_in`, `audio_mix` | 5 Assembly | `compose.py` (segment-normalize → concat → overlays → music mux) | free |

## 1. Music → ElevenLabs `music_v1`  (config: `music`)  [PAID — separate capability]

`create-music-elevenlabs` generates the 18s track from `music.prompt` (+ the soft-intro → drop →
groove → resolve structure), `music_length_ms: 18000`, `force_instrumental: false` — but the vocals
are **sparse female hooks only** (the overlays carry the message). No artist names in the prompt
(ElevenLabs ToS filter). Deliver → `music.mp3`.

## 1b. Beat grid → librosa  (config: `beat_grid`)  [free — this capability]

`librosa.beat.beat_track` + `librosa.onset.onset_detect` on the delivered `music.mp3` →
`beat-grid.json` (beats + downbeats + onsets, assume 4/4). **THE BEAT GRID IS GOSPEL** — the
DOWNBEATS set the segment durations (`tableaux[].t_end - t_start`), not the plan. The worked example
landed at **123.0469 BPM**, downbeats `[0.0348, 2.2175, 4.1564, 6.0952, 8.0341, 9.973, 11.9002]`. If
the music changes, re-extract.

## 2. Creator → gpt-image-2 anchor  (config: `character`)  [PAID — separate capability]

`create-image-gpt-image-fal` fires one gpt-image-2 call at **1024×1536** 9:16 (`quality: high`) with
the verbatim `character.descriptor` — **4 candidate anchors**, lock ONE → `LOCKED.json` with the
wardrobe HARD-LOCK + world_lock. `chain_strategy: anchor-only`. Drift < 5% → `method: anchor-ref`;
drift > 15% → escalate to face-swap-then-Soul-ID. The locked anchor PNG is threaded as the **PRIMARY**
media ref into every per-shot still.

## 3. Per-shot stills → `nano-banana-pro/edit`  (config: `tableaux[].still_prompt`, `look_pack`, `keyframe_engine`)  [PAID — separate capability]

`create-image-fal` fires 8 stills on `fal-ai/nano-banana-pro/edit` (fallback `fal-ai/nano-banana/edit`),
9:16 png. Each passes the LOCKED anchor as the **FIRST (primary)** `image_url`; the two product shots
(s04, s08) pass the real product bottle as a **SECOND** `image_url`. Prompt = `still_prompt` + the
identity/wardrobe hard-lock + `look_pack.style_descriptor` (+ the bottle-lock on s04/s08).
`nano-banana-pro` is the **permissive primary** — plain `gpt-image-2/edit` false-flags benign
athleisure/dance/movement prompts via its content checker. Never let the second product ref override
identity. Review all 8 before step 4. → `shot-NN-still.png`.

## 4. Clips → Seedance 2.0 i2v  (config: `tableaux[].motion_hint`, `clip_engine`)  [PAID — separate capability]

`create-video-fal` fires 8 clips on `bytedance/seedance-2.0/image-to-video` (fallback
`fal-ai/bytedance/seedance/v1/pro/image-to-video`), off each clean still, **~4s each, 720p, 9:16,
`generate_audio: false`** (the ad uses our own ElevenLabs track). Build the prompt as
`clip_engine.motion_opener` + `tableaux[i].motion_hint` + `clip_engine.negative_tail`. **Lead with
the SUBJECT + ACTION VERB, not the camera.** Seedance distorts HANDS and garbles the product LABEL —
the hand/label negative is critical on s04/s08 (hold those shots nearly still, `src_in` low). **NO
slow-mo freeze** — "holds / stands / minimal motion", never "freezes / pauses". → `shot-NN.mp4`.

## 5. Overlays → `gen_overlays.py`  (config: `overlays`, `tableaux[].overlay_text`)  [free — this capability]

Playwright + Chromium renders the **7 transparent text-overlay PNGs** from HTML at 1080×1920 —
**these ARE the ad copy** (voiceless, no VO, no auto-captions). Bold white (**~104px**, 84px on the
two long mechanism/proof lines), `font-weight: 800`, a soft dark `text-shadow` stack, **upper-third**
placement (`padding: 300px 110px 0`) within the **88% safe area**, one line per beat. The proof
overlay carries a **brand-accent green progress bar** (`fill_color #00a66f`, 78%); the CTA overlay
carries the **`Results vary.` disclaimer** (compliance). `omit_background: true`. Font note: the
source spec said Lexend, the real render used **Plus Jakarta Sans** — either bold geometric sans
works; the load-bearing rule is weight 800 + the soft dark shadow + upper-third placement.

## 6. Assembly → `compose.py`  (config: `overlay_windows`, `tableaux[].t_start/t_end/src_in`, `audio_mix`)  [free — this capability]

5-stage ffmpeg pipeline:
1. **segment-normalize** each dance clip → trim `-ss src_in -t (t_end - t_start)`, then
   `scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,setsar=1,fps=30`, `-an`,
   libx264 crf18 → `seg-NN.mp4`; durations **beat-snapped** from `beat-grid.json`.
2. build the **2.5s end-card segment** from the brand end-card PNG (`-loop 1 -t 2.5`, same
   scale/crop/fps).
3. **concat-demux** the 8 segments + end card (`-f concat -safe 0 -c copy`) → `base.mp4`.
4. **time-gated overlays** — one `overlay=0:0:enable='between(t,st,en)'` per `overlay_windows` entry,
   a **HARD POP** on/off on the beat, output capped `-t 18` → `video.mp4`.
5. **music mux** — `[1:a]atrim=0:18,afade=t=out:st=17.2:d=0.8,aresample=44100[a]`, `-map 0:v -map
   [a]`, `-c:a aac -b:a 192k`, `-t 18` → `master-final.mp4` (1080×1920, 30fps, h264 + aac, **18.0s**).

Segment durations sum to 15.5s + a 2.5s end card = **18.0s**. This format is **naturally libass-free**:
the overlays are already PNGs composited via `overlay=…:enable`, so no `subtitles`/`drawtext` filter
is needed. Re-cuts (new overlay windows, re-timed segments, a swapped end card) reuse the existing
music/stills/clips and cost **$0** — only steps 1–4 spend.

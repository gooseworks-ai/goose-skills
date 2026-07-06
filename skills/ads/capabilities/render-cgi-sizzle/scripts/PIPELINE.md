# PIPELINE — config → source steps

This molecule ships the **recipe** (`config.example.json`), not a re-built runnable
pipeline. The engine is the working scripts from the source run
`clients/masterclass/ad-runs/run-03-run-03/working/` (plus its `edits/` finalize).
This maps each config field to the step that consumes it.

## Order of operations

VO first (locks the timeline) → CGI plates → PIL screen composites → burst-climax →
Kling clips (Ken-Burns fallback per garbled beat) → end card → captions → mix → 1.15x + grain.

## Field → step map

| config field | source step | what it does |
|---|---|---|
| `voiceover.*` (voice_id, model_id, voice_settings, beats[].vo) | `render_eryn_vo.sh` | One curl per beat → MP3 → `ffprobe` duration. The measured durations become `beats[].vo_actual_duration_sec` and drive the beat windows. |
| `studio_look.*`, `cgi_plate.*`, `beats[].plate_element_layer` | `gen_plates.py` | nano_banana_2: beat-1 plate first (blank warm-glow phone in a smoky-black + amaranth studio), then beats 2-6 `--anchor`ed on it, each appending its per-beat burst-out placeholder layer. Screen is left blank on purpose. |
| `beats[].screen`, `screen_composite.*` | `composite_screens.py` | PIL: auto-detect the bright phone-screen bbox in each plate, resize + warm-tint + brightness-bump + feather the **real** App Store screenshot into the bezel → `scene-NN-composite.png`. Never AI-render the UI. |
| `beats[].burst_out` where `burst_out_source: real_screenshot_pil` (climax portraits) | `build_burst_climax.py` | PIL: real instructor portrait tiles with rim-light baked BEFORE rotation (so frame + portrait rotate as one unit) + amaranth glow + drop shadow, ringed around the climax plate. |
| `beats[].kling_motion`, `cgi_plate.provider` | `gen_clips.py` | Kling 3.0 i2v (fal): each composite → a steady-float clip; burst-out pops/settles while the phone + screen stay locked (`--mode std`, no-shake negative prompt). PAID, largest spend. |
| `beats[].kenburns_fallback`, `fps` | `build_v2_clips.py` | FFmpeg `zoompan` Ken-Burns push-in per beat (heavier zoom on the climax) — the **fallback** for any beat Kling garbles. This is the path the shipped demo master used. |
| `end_card.*` | PIL end-card composite (in `build_v2_clips.py` / edits) | Smoky-black canvas + amaranth bar + wordmark SVG (480px) + tagline (Montserrat 56px) + vignette → a static `end-card.png` held for `dwell_sec`. Captions suppressed here. |
| `captions.*` | `build_captions.py` | Restrained line-by-line ASS: one cue per beat, offsets from the measured VO windows, fade in +0.05s / out +0.20s, no karaoke pills, suppressed on the end card. |
| `music.*`, `audio_mix.*` | ElevenLabs Music + FFmpeg mix (`audio/`) | Premium-tech bed → trim the sparse intro → loudnorm → sidechain-duck under VO (+2dB VO on the climax) → master loudnorm -14 LUFS. |
| `finalize.*` (`speed`, `grain`, `codec`) | FFmpeg finalize (`edits/`) | Concat the beat clips + end card, then `setpts=PTS/1.15` (video) + `atempo=1.15` (audio, pitch preserved) → ~22.6s, plus the anti-AI grain pass → `master-final-v4-compressed.mp4`. |

## Notes

- **Two model surfaces only:** nano_banana_2 (plates) + Kling 3.0 (float clips). Everything
  else (screen composites, burst-climax, end card, captions, mix, finalize) is free/deterministic.
- **The demo master is the Ken-Burns cut.** `build_v2_clips.py` (push-in on the real screens +
  CGI climax plate) is what shipped as `master-final-v4-compressed.mp4`; `gen_clips.py` is the
  intended Kling primary, kept for beats that hold up under i2v.
- **Anchor discipline:** all six plates share the beat-1 phone/studio via `--anchor`, so the
  sequence reads as one continuous product film.

# PIPELINE — config → source steps

This molecule ships the **recipe** (`config.example.json`), not a re-built runnable
pipeline. The engine is the working scripts from the source run
`clients/dibsbeauty/concept-9-3d-product-showcase/` (the batch-level `working/` scripts, applied
to the `desert-island-duo/` product). This maps each config field to the step that consumes it.

## Order of operations

Register product (identity lock) → prompts approved (Gate 1) → probe one MS call → Beats 1+2 MS
Hyper Motion in parallel → extract Beat 1 last frame → Veo3 Beat 3 reveal seeded on it → Beat 4
Playwright hyperframe → music → normalize + concat + mix → 720×1280 master.

## Field → step map

| config field | source step | phase | what it does | paid? |
|---|---|---|---|---|
| `product.hero_png`, `product.pdp_url`, `product_import.*` | `higgsfield upload create` + `marketing-studio products fetch --url` | Register | Upload the hero PNG (→ upload_id) and import the PDP product into Marketing Studio (→ product_id) so its real label + geometry are identity-locked. **`fetch --url`, never `create --image` (405s).** | **free** |
| `beats[0].prompt`, `beats[0].ms_mode`, `beats[0].duration_sec`, `studio_look.*` | `higgsfield generate create marketing_studio_video --mode product_showcase` | Beat 1 | MS Hyper Motion 360 hero rotation off the imported product. Min duration 4s. Result JSON → `working/clips/beat1_hero_rotation.json` → download mp4. | **PAID** (~25 cr / 4s) |
| `beats[1].prompt`, `beats[1].ms_mode`, `beats[1].duration_sec` | `higgsfield generate create marketing_studio_video --mode product_showcase` | Beat 2 | MS Hyper Motion macro push-in along the surface (same product_id as Beat 1). | **PAID** (~25 cr / 4s) |
| `beats[0].produces_anchor` | `ffmpeg -sseof -0.1 -i beat1.mp4 -frames:v 1 beat1_last_frame.png` | Beat 1→3 | Extract Beat 1's **last frame** — the shared anchor: Veo3 Beat-3 seed AND the Beat-4 hyperframe background. | free |
| `beats[2].prompt`, `beats[2].start_image`, `beats[2].veo3_model`, `beats[2].generate_audio`, `reveal_variant` | `create-video-veo3/scripts/generate-fal.py --fast` (`fal-ai/veo3/fast/image-to-video`) | Beat 3 | Veo3 i2v physics reveal seeded on `beat1_last_frame.png`, `generate_audio:false`. Skip when `reveal_variant == rotation_only`. The reveal prompt must name **where** the reveal happens. | **PAID** (~$1.00 / 4s fast) |
| `end_card.*`, `beats[3].headline`, `beats[3].headline_size_px` | `working/build_endcard.py <slug> "<HEADLINE>" --duration <2-3> --headline-size <80-110>` | Beat 4 | Playwright hyperframe: Beat 1 last frame + scrim + Playfair SemiBold headline (spring-rise) + the **real** wordmark SVG (fade-in) → render 1080×1920 → ffmpeg-scale to 720×1280. | free |
| `music.*` | `create-music-elevenlabs/scripts/compose.sh --instrumental` | Music | One ElevenLabs instrumental bed (genre + BPM + drop at 7s), `force_instrumental`, no artist names → `working/music/music.mp3`. | **PAID** (~$0.40) |
| `finalize.*`, `audio_mix.*`, `beats[].duration_sec` | `working/build_masters.py` | Assemble | Normalize each beat (`-an`, scale 720×1280 pad-to-`bg`, 24fps, yuv420p, crf 18) → concat demuxer → mix the music bed (`afade` in 0.3s / out 0.5s + `loudnorm I=-16 TP=-1.5 LRA=11`, atrimmed to master duration) → `finals/<brand>-<slug>-3d-showcase-v1.mp4`. | free |

## Notes

- **Three model surfaces:** Higgsfield Marketing Studio Hyper Motion (Beats 1+2), Veo3 i2v fast
  (Beat 3 reveal), ElevenLabs Music (bed). Everything else (last-frame extract, Playwright
  hyperframe, normalize/concat/mix) is free/deterministic.
- **Identity discipline:** Beats 1+2 are locked to the real product via the MS PDP import; Beat 3 is
  seeded on Beat 1's *last frame*; Beat 4 sits over Beat 1's stilled last frame — so the product +
  lighting carry across all four beats and the label is never AI-invented.
- **Reveal-prompt spatial clause is load-bearing.** The shipped DID Beat 3 used a prompt that didn't
  say *where* the creams should show; Veo3 cap-popped and smeared ambient swatches (a P1, shipped
  as-is). The `config.example.json` `beats[2].prompt` is the proposed fix (spatial clause); the
  weaker `shipped_prompt` is kept for provenance.
- **MS gotchas** (from the source LEARNINGS): register with `products fetch --url` not
  `create --image` (405); the CLI wants the slug `product_showcase` not the label `Hyper Motion`;
  MS min duration is 4s not 3 (so 4+4+4+3 ≈ 15s → ~14s after normalize); strip the MS auto-audio
  (`-an`) or it propagates into the master; if a PDP fetch fails, route all beats through Veo3.
- **End-card render dims:** render at 1080×1920 then ffmpeg-scale to 720×1280 — matching the
  Playwright viewport to the output dims clips the right edge.

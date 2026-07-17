# PIPELINE — config → source steps

This capability ships the **recipe** (`config.example.json`) **and** the runnable free-assembly
scripts (`build_endcard.py`, `build_masters.py`, `shoot.js`). The paid stages (styled hero, i2v
beats, music) are separate media capabilities. This maps each config field to the step that
consumes it.

## Order of operations

Styled hero (identity lock) → prompts approved (Gate 1) → probe one i2v call → Beats 1+2 i2v
seeded on the styled hero → extract Beat 1 last frame → Veo3 Beat 3 reveal seeded on it → Beat 4
`build_endcard.py` → music → `build_masters.py` (trim + normalize + concat + mix) → 720×1280 master.

## Field → step map

| config field | source step | phase | what it does | paid? |
|---|---|---|---|---|
| `product.hero_png`, `product_identity.*`, `studio_look.*` | `create-image-fal` (`fal-ai/nano-banana/edit`) | Hero | Restyle the brand's REAL product photo onto the seamless brand-color studio set → `hero_styled.png`; host it (MCP get_upload_url → get_download_url) so i2v can seed off a public url. Locks the product's real geometry — no Marketing Studio, no PDP import. | **PAID** (cheap, ~1 image) |
| `beats[0].prompt`, `beats[0].model`, `beats[0].start_image`, `beats[0].duration_sec` | `create-video-fal` i2v (`beats[].model` — Seedance Lite default) | Beat 1 | i2v hero rotation seeded on `hero_styled.png`. A single i2v is a partial arc, not a literal 360. Result mp4 → `working/clips/beat1.mp4`. | **PAID** |
| `beats[1].prompt`, `beats[1].model`, `beats[1].start_image` | `create-video-fal` i2v (same model) | Beat 2 | i2v macro push-in seeded on the SAME `hero_styled.png` so the product reads identical. → `working/clips/beat2.mp4`. | **PAID** |
| `beats[0].produces_anchor` | `ffmpeg -sseof -0.1 -i beat1.mp4 -frames:v 1 beat1_last_frame.png` | Beat 1→3 | Extract Beat 1's **last frame** — the shared anchor: Veo3 Beat-3 seed AND the Beat-4 hyperframe background. | free |
| `beats[2].prompt`, `beats[2].start_image`, `beats[2].model`, `beats[2].generate_audio`, `reveal_variant` | `create-video-fal` Veo3 i2v (`fal-ai/veo3/fast/image-to-video`) | Beat 3 | Veo3 i2v physics reveal seeded on `beat1_last_frame.png`, `generate_audio:false`. Defaults to an 8s take (trimmed later). Skip when `reveal_variant == rotation_only`. The reveal prompt must name **where** the reveal happens. | **PAID** (priciest single call) |
| `end_card.*`, `beats[3].headline`, `beats[3].headline_size_px` | `build_endcard.py --bg beat1_last_frame.png --headline "<H>" --wordmark <wm> --out endcard.png` | Beat 4 | Playwright hyperframe: Beat 1 last frame + scrim + Playfair SemiBold headline + the **real** wordmark (recolored for contrast) → render 1080×1920 → ffmpeg-scale to 720×1280. | free |
| `music.*` | `create-music-elevenlabs` | Music | One ElevenLabs instrumental bed (genre + BPM + drop at 7s), `force_instrumental`, no artist names → `working/music.mp3` (~15s). | **PAID** |
| `finalize.*`, `audio_mix.*`, `beats[].duration_sec`, `beats[].trim_start`, `studio_look.bg` | `build_masters.py --config config.json` | Assemble | Trim each beat to its window, normalize (`-an`, scale 720×1280 pad-to-`bg`, 24fps, yuv420p, crf 18) → concat demuxer → mix the bed (`afade` in 0.3s / out 0.6s + `loudnorm I=-16 TP=-1.5 LRA=11`, apad + atrimmed to master duration) → master mp4 (~15s). | free |

## Notes

- **Model surfaces:** `create-image-fal` (styled hero), `create-video-fal` i2v ×2 (Beats 1+2),
  `create-video-fal` Veo3 i2v (Beat 3 reveal), `create-music-elevenlabs` (bed). Everything else
  (last-frame extract, `build_endcard.py`, `build_masters.py`) is free/deterministic. **No
  Marketing Studio / Higgsfield** — there is no such capability, and it would not bill the Ads
  agent; Beats 1+2 are FAL i2v seeded on the styled hero.
- **Identity discipline:** the styled hero is built from the brand's REAL product photo, so Beats
  1+2 carry the real geometry; Beat 3 is seeded on Beat 1's *last frame*; Beat 4 sits over Beat 1's
  stilled last frame — the product + lighting carry across all four beats and are never AI-invented.
- **Reveal-prompt spatial clause is load-bearing.** The shipped DID Beat 3 used a prompt that
  didn't say *where* the creams should show; Veo3 cap-popped and smeared ambient swatches (a P1).
  The `config.example.json` `beats[2].prompt` is the spatial-clause fix.
- **Reveal-variant taxonomy:** cosmetic/liquid/fragrance → particle_disintegration; beverage OR a
  water product (spa/tub/fountain) → liquid_splash; dual-ended/structural → exploded_view;
  large/featureless no-reveal (a tool, a solid appliance) → rotation_only (skip Beat 3).
- **Duration:** beats are 4+4+4+3 = **15s**. Veo3 fast is an 8s take → `build_masters` trims it to
  the 4s window (`trim_start` default 1.0s). i2v auto-audio is stripped (`-an`) or it leaks into
  the master.
- **End-card render dims:** render at 1080×1920 then ffmpeg-scale to 720×1280 — matching the
  Playwright viewport to the output dims clips the right edge.

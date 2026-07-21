# Pipeline — mascot genre-film

How `config.example.json` maps to the real production steps. This capability ships a **config + this
map**, not a bundled runner: the worked example (Duolingo "Don't Skip" horror short) was produced by
four per-project drivers that live in the source run
(`clients/duolingo/video-01-dont-skip-horror/working/`):

- `render_hyperframes.py` — Chrome-headless HTML → transparent notification-banner PNGs + title +
  end card + mascot-head app-icon. **FREE (this capability owns it).**
- `gen_sfx.py` — 4 ffmpeg-synth SFX (notif / heartbeat / riser / sting). **FREE (this capability owns it).**
- `kling_v3_pro.py` — the Kling V3 Pro i2v reveal off the locked close still. **PAID (`create-video-fal`).**
- `build_master.py` — per-beat grade + zoom + eased banner overlays → concat → 8-track amix →
  2-pass loudnorm → mux. **FREE (this capability owns it).**

The steps run **in order** because each depends on the last: the mascot anchor is locked FIRST (the
#1 risk — drift compounds from a loose keyframe), the plates give the POV world, the HTML hyperframes
carry every on-screen word, the close reveal still seeds the i2v, the audio is scored, and
`build_master.py` grades + zooms + overlays + concats + mixes it all.

## Field → source-step map

| Config block | Phase | Source step / script | Paid? |
|---|---|---|---|
| `mascot` (`ref_image`, `keep_exact_descriptor`, `anchor_prompt`, `anchor_engine`) | 1 Anchor | `create-image-fal` → `fal-ai/nano-banana-2/edit`, `num_images=4`, 9:16 → distant + close LOCKED stills | **PAID** |
| `plates` (`cozy_prompt`, `hallway_prompt`, `engine`) | 2 Plates | `create-image-fal` → `fal-ai/nano-banana` text-only, 2k, ×2 | **PAID** |
| `hyperframes`, `banner_messages` | 3 Hyperframes | `render_hyperframes.py` (Chrome headless → 4 banners + title + end card + icon) | **FREE** |
| `i2v` | 4 Reveal | `create-video-fal` → `fal-ai/kling-video/v3/pro/image-to-video`, 5s, audio off → trim 4.4s | **PAID** |
| `music`, `vo` | 5 Audio | `create-music-elevenlabs` (instrumental bed) + `create-vo-elevenlabs` (one whispered line) | **PAID** |
| `sfx` | 5 Audio | `gen_sfx.py` (ffmpeg synth — the FAL SFX endpoint is broken) | **FREE** |
| `beats[].grade/zoom_max/grain`, `grade_fn`, `still_render` | 6 Assembly | `build_master.py` `grade()` + `still()` (pre-upscale → zoompan → grade → setsar) | **FREE** |
| `beats[].banner`, `hyperframes.banners` | 6 Assembly | `build_master.py` eased overlay (`overlay=0:'by-(300+by)*exp(-13*max(0,t-tin))'`) | **FREE** |
| `audio_mix`, `beats[].audio` | 6 Assembly | `build_master.py` 8-track amix (per-track adelay + music-drop automation) + 2-pass loudnorm | **FREE** |
| `encode` | 6 Assembly | `build_master.py` ENC (`libx264 slow crf20 maxrate10M`) + mux | **FREE** |

## 1. Mascot anchor → `nano-banana-2/edit`  [PAID — lock FIRST]

`create-image-fal` → `fal-ai/nano-banana-2/edit`, the official mascot ref as the multi-ref,
`num_images=4`, 9:16, prompt = `mascot.keep_exact_descriptor` + the genre re-light (brand-color
rim-light, dead-eyed, A24). Lock a DISTANT silhouette + a CLOSE reveal from the fan-out. NB2-edit
re-lights while preserving identity — **keep the mascot 100% on-model, never redesign.** Lock here
before anything else (starting i2v from a loose keyframe is where drift happens).

## 2. Plates → `nano-banana` v1  [PAID, cheap]

`create-image-fal` → `fal-ai/nano-banana` text-only (no ref, no people, no text), `resolution 2k`,
9:16, ×2: a cozy-dark POV environment + a hallway with a brand-color glow under a door.

## 3. Hyperframes → `render_hyperframes.py`  [FREE — this capability owns it]

Chrome headless (`--headless=new --virtual-time-budget=3500`, transparent bg for banners, the brand
font): 4 iOS notification banners (1080×300 transparent PNGs from `banner_messages`), the title card,
the end card, and a square mascot-head app-icon crop (PIL) tinted onto the brand primary. **All
on-screen text is HTML — never AI text.**

## 4. Reveal → Kling V3 Pro i2v  [PAID]

`create-video-fal` → `fal-ai/kling-video/v3/pro/image-to-video`, start_image = the close reveal still,
`duration 5`, `generate_audio false`. CHARACTER+VERB in the first 8 words; sparse + glacial motion
(head-tilt → single blink → stare + slow push-in). Render 5s (the sweet spot; >10s drifts), trim to
4.4s.

## 5. Audio → music + VO + `gen_sfx.py`  [PAID music/VO, FREE SFX]

- **Music** (`create-music-elevenlabs`): `force_instrumental=true`, ~24s, the genre bed. The
  drop-to-silence at the reveal is mixed in post, not the prompt.
- **VO** (`create-vo-elevenlabs`, `[whispering]`): one line; pitch + reverb applied in the MIX.
- **SFX** (`gen_sfx.py`, ffmpeg synth — the FAL SFX endpoint is broken): notif ping, loopable
  heartbeat, riser, reveal sting.

## 6. Grade + assemble → `build_master.py`  [FREE]

- Per graded still: scale/crop → pre-upscale 2160×3840 → `zoompan` push-in → `grade()` → `setsar=1`,
  banner eased via exponential settle. The reveal (b6) uses `video_seg()` (no zoompan). Cards are HTML
  over black (NO grain).
- Grade descent: b1 warm-cozy → b2 green creeps → b3–b4 sickly teal-green → b5 near-black → b6 reveal
  light-touch → b7 clean black.
- Concat 8 hard-cut segments → `master-silent.mp4`.
- 8-track amix (`normalize=0`): the bed (piecewise `volume` — 0.82 → 0.07 at the 13.6s reveal → 0.47
  for the button, afade in 1.6 / out st21.2 d0.8) + 3 notif pings (adelay 550/3450/12150) + heartbeat
  (loop 7, adelay 6000) + riser (adelay 10600) + sting (adelay 13560) + VO (adelay 15250,
  pitch/reverb chain). Then 2-pass `loudnorm I=-14`.
- Mux `-map 0:v:0 -map 1:a:0 -c:a aac -b:a 192k -t 22 -movflags +faststart` → the 1080×1920 h264+aac
  master (~22s). Encode `libx264 preset slow crf20 maxrate10M bufsize20M`.

Re-cuts (new grade, re-timed banners, a swapped end card, a re-balanced mix) reuse the existing
stills / clip / audio and cost **$0** — only steps 1, 2, 4, 5 (music/VO) spend.

# Pipeline — product hypermotion + specs

The source format has **no runnable driver**: the pipeline is prose + referenced atoms +
inline PIL/ffmpeg. This doc is the step-by-step recipe, naming the atom/tool each step
uses. Config lives in `config.example.json`. The Soundboks reference implementations are
`clients/soundboks/video-02-hypermotion/working/scripts/` (`gen_kinetic_v6.py`,
`gen_endcard_v10.py`, `assemble_v10.py`) — copy + adapt them; they are not vendored here.

Two PAID calls total (Seedance i2v + ElevenLabs Music). Everything else is free
PIL/ffmpeg. Guard **both** paid calls with skip-if-exists so a re-run never re-bills.

Keys: `FAL_API_KEY` from `gtm-goose/.env`; alias `FAL_KEY=$FAL_API_KEY` (fal_client reads
`FAL_KEY`).

---

## Phase 0 — Brand asset gathering (autonomous, $0)

1. **Hero product PNG.** Scrape the highest-res PDP shot (Shopify: `curl -sL
   "${product_url}.json" | jq -r '.product.images[0].src'`). Real photo, NOT AI-gen. This
   is the Seedance start frame. → `assets/product/`.
2. **Brand logo PNG.** Most brand SVGs wrap a base64 PNG — decode it out:
   ```python
   import re, base64
   svg = open('logo.svg').read()
   m = re.search(r'data:image?/png;base64,([A-Za-z0-9+/=]+)', svg)
   open('logo.png', 'wb').write(base64.b64decode(m.group(1)))
   ```
   Pure-vector SVG (rare) → `rsvg-convert -w 2400 logo.svg -o logo.png`. Validated on
   Soundboks → 865×135 real wordmark. → `assets/logo/`.
3. **Palette.** Count `#xxxxxx` in the homepage CSS; map the dominant accent →
   `accent_color_hex`.
4. **Font.** Download the **static** Space Grotesk Bold (variable TTF renders as Regular in
   PIL):
   `curl -sSL -o assets/fonts/SpaceGrotesk-Bold.ttf https://raw.githubusercontent.com/floriankarsten/space-grotesk/master/fonts/ttf/static/SpaceGrotesk-Bold.ttf`
5. Write `config.json` + `brief.md`. **GATE 1** — show the brief + 5-block Seedance prompt
   + spec callouts + ~$5 estimate.

---

## Phase 1 — Hypermotion + music, in parallel [PAID — GATE]

Fire both concurrently; each behind a skip-if-exists guard.

### 1a. Seedance i2v hypermotion — atom `create-video-seedance-2-fal` (~$4.54 / 15s)

The prompt MUST carry all **5 blocks** in order (see `config.hypermotion_i2v.prompt_blocks`).
The 5th block (ABSOLUTE CONSTRAINTS) is what stops geometry drift — Soundboks V2, run
without it, morphed the speaker into a cowbell at t=8s. Rules for block 4: ONE camera move
per beat (Seedance fails on stacked moves), 3–5 beats, first beat high-energy, last beat a
settle.

```python
import fal_client, os
os.environ["FAL_KEY"] = os.environ.get("FAL_API_KEY", "")
prompt = "\n\n".join(cfg["hypermotion_i2v"]["prompt_blocks"].values())
image_url = fal_client.upload_file(cfg["product_image"])
if not os.path.exists("working/hypermotion-raw.mp4"):     # skip-if-exists
    r = fal_client.subscribe("fal-ai/bytedance/seedance/v2/pro/image-to-video",
        arguments={"prompt": prompt, "image_url": image_url,
                   "duration": "15", "resolution": "1080p",
                   "aspect_ratio": "1:1", "generate_audio": False})
    # download r["video"]["url"] -> working/hypermotion-raw.mp4
```

### 1b. ElevenLabs Music — atom `create-music-elevenlabs` (~$0.45)

`fal-ai/elevenlabs/music`, generate at target length, `output_format: mp3_44100_192`.
Bake the sync points into the prompt (kick at 1s for the first cut, build 10–20s, peak +
lyric hook at 20s for the CTA, lyric land at ~22s for the end-card inversion flash). Music
with a single rallying lyric is a feature here — no VO competes.

---

## Phase 2 — Kinetic-typography cards (autonomous, $0)

Render each card 1080×1920 via PIL **frame-by-frame** → PNG sequence
(`working/kinetic-frames/<label>/f%04d.png`) → ffmpeg-encode (yuv420p, libx264) →
`working/kinetic-movs/<label>.mp4`. Reference impl: `gen_kinetic_v6.py` (spec/CTA cards),
`gen_endcard_v10.py` (end card).

### The 11 validated PIL techniques

| Technique | Helper | Use | Note |
|---|---|---|---|
| Italic skew | `italicize(img, 6)` — affine shear | faux italic | 6° = subtle; 10°+ cartoony |
| Outline echo | transparent fill + colored stroke | ambient shadow behind text | scale **1.08×** bleed-safe sweet spot |
| 3D extrusion | stack 18–28 offset copies + solid face | hero stat / CTA pop | side color = brand accent; shadow_dx/dy=(2,2) |
| Repetition stack | same word at multiple Y | layered look | 4 echoes around 1 solid |
| Slam-with-shake | scale 0.3→1.10 cubic-ease + sin/cos shake | killer-stat reveal | shake × (1−p) decay over 0.20s |
| Drop-in staggered | per-char entry + motion blur | letters fall from above | char_in 0.30s, stagger 0.04s |
| Mask wipe | cover unwiped part with BG | reveal by wipe | colored leading edge |
| Letterbox slide | line1 from left / line2 from right | two-line entry | x_off = ±W·(1−ease) |
| Color flash | BG transition 0.15s + type invert | CTA energy | invert type too or legibility drops |
| Inversion flash | full-frame BG/type swap 0.3s | mid-clip art moment | Soundboks: black↔orange |
| Dark grain BG | `dark_grain_bg(w,h,(12,12,12),grain=12)` | industrial base | (paper_texture for editorial only — off-brand here) |

### Cards to render (per `config.text_cards` + `config.end_card`)

- `intro` (1.0s) — "INTRODUCING", italic + outline echo on the dark grain BG.
- `spec_1` … `spec_N` (1.5s each) — **hero stat = 3D extrusion in accent color**; the rest
  cycle italic + outline-echo / white-slam / sparkle / shadow-stack.
- `cta` (1.5s) — 3D extrusion + accent→black color flash.
- `endcard` (3.5s) — the **real logo PNG** with a slam-motion-blur entry, settle,
  **continuous micro-motion** (±1% scale pulse + ±3px drift — never freeze), an inversion
  flash at ~60% of the card, and a cascade reveal of the spec-dot subtitle
  ("126 dB · 40 HRS · IP65") + CTA. Composite the logo scaled to `logo_target_w` (leaves
  ~80px margin), LANCZOS resize, GaussianBlur the motion-blur frames.

Entry-motion timing (kept across all V1–V10):
```python
if t < 0.40:   p=t/0.40; ease=1-(1-p)**4; scale=0.5+(1.18-0.5)*ease; blur=(1-p)*22
elif t < 0.70: p=(t-0.40)/0.30; scale=1.18-0.18*p; blur=0
else:          d=t-0.70; scale=1.0+0.010*math.sin(d*1.4); x_off=int(3*math.sin(d*1.1)); blur=0
```

---

## Phase 3 — Dice + intercut + mux (autonomous, $0)

1. **Center-crop** the hypermotion 1:1 → 9:16:
   ```bash
   ffmpeg -i working/hypermotion-raw.mp4 -vf "scale=-1:1920,crop=1080:1920:(iw-1080)/2:0,fps=30" -c:v libx264 -crf 18 working/hypermotion-9x16.mp4
   ```
2. **Dice into 5–6 segments** at beat boundaries via `-ss/-t` (see
   `config.beat_structure.hypermotion_segments_s`). Decreasing lengths build energy; cut on
   Seedance's natural beats (crash-zoom → orbit → settle), inspected via /watch:watch — NOT
   at uniform intervals.
3. **Concat** cards + segments in `config.beat_structure.concat_order`
   (intro → segA → spec1 → segB → spec2 → segC → spec3 → segD → spec4 → segE → spec5 →
   segF → cta → endcard). Build `concat.txt` with absolute paths, then:
   ```bash
   ffmpeg -y -f concat -safe 0 -i concat.txt -c copy working/master-silent.mp4
   ```
4. **Mux music as a SEPARATE pass** with explicit maps (default mapping silently yields
   1 kbps garbage audio):
   ```bash
   ffmpeg -y -i working/master-silent.mp4 -i working/music.mp3 \
     -c:v copy -c:a aac -b:a 192k -ar 44100 -map 0:v -map 1:a -shortest \
     -movflags +faststart master-final.mp4
   ```
   Verify `ffprobe` audio bit_rate ≈ 192000 (NOT 1000).

### Beat-structure variants

- **25s (5 specs, default):** 15s hypermotion → 6 segments (2.5/2.5/2.0/1.5/1.5/1.5s).
- **20s (4 specs):** 5 segments (2.0×3, 1.5×2), CTA 1.0s, endcard 3.0s.
- **30s (6 specs):** needs a 20s hypermotion source > Seedance's 15s cap — chain 2 calls or
  reuse one segment.
- BPM alignment: at 124 BPM, 4 beats ≈ 2.0s (segment), 3 beats ≈ 1.5s (spec card). Sport/
  utility at 100 BPM → round segments up to 2.5s, spec cards to 1.8s.

---

## Phase 4 — Watch / QC (mandatory before ship)

`/watch:watch master-final.mp4`. Confirm: duration ±0.5s, 1080×1920; every card readable
(echoes ≤1.08×); product holds identity across every segment (label sharp, no morph);
no people/hands/text inside the hypermotion clip; end-card **real logo** sharp +
micro-moving (not frozen); inversion flash on beat (~60%); music holds to the tail (no
decay), aligned to cuts; audio ≈192 kbps aac. Re-render cards / re-cut for $0; only re-fire
Seedance ($4.54) if the clip itself drifted.

## Spend (validated Soundboks V10, 2026-05-28)

| Item | Per-unit | Note |
|---|---|---|
| Seedance 2.0 i2v 15s (1080p, audio off) | $4.54 | one call, diced into 6 |
| ElevenLabs Music 25s | $0.45 | |
| PIL cards + ffmpeg dice/concat/mux + logo extract | $0.00 | |
| **V1 marginal** | **~$4.99** | full V1→V10 run = $17.43 |

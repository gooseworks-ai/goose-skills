# Pipeline — stop-motion hand-swatch-cycle

How `config.example.json` maps to the real production steps. This capability ships a **config + this
map**, not a bundled runner: the worked example (DIBS Beauty "Pick Your Match") was produced by the
shared stop-motion template scripts plus a per-project plate spec — `generate_plates.py`,
`build_video.py`, `render_endcard.py`, `finalize_video.py` / `add_endcard_and_music.py` — driven by
a plate spec (`plates-v3.json`). Reference those directly, or drive the whole run via the video
orchestrator.

The steps run **in order** because each depends on the last: the master-anchor plate sets the locked
frame, every shade / motion / finale plate is EDIT-anchored back to it, the plates set the hold
cadence, the plate mp4s concat into a silent master, and the end card + music close it.

## Field → source-script map

| Config field | Phase | Source step / script | Paid? |
|---|---|---|---|
| `anchor`, `background`, `plate_engine` | 1 Master-anchor | `generate_plates.py` → `gpt-image-2` hand + barrel + EMPTY cream-patch on the brand BG (`plates-v3.json` `v2-p01`) | **PAID** |
| `plates[].prompt`, `plates[].anchors` (shade) | 2 Shade plates | `generate_plates.py` → `gpt-image-2` EDIT, each anchored to `[master-anchor, shade-swatch, shade-hero]` | **PAID** |
| `plates[].prompt` (half-painted / motion) | 2 Motion plates | `generate_plates.py` → `gpt-image-2` EDIT mid-swipe plates, anchored to the master-anchor only | **PAID** |
| `plates[]` (hand-exits / all-swatches / hero-pick) | 3 Finale | `generate_plates.py` → `gpt-image-2` EDIT anchored to master-anchor + the all-variants family ref | **PAID** |
| `plates[].pose_hold_ms`, `.cut_type`, `cadence` | 4 Encode | `build_video.py` PNG→mp4 loop encode (`-loop 1 -t <hold>`, scale/crop 1080×1920 @ 30fps crf18) | free |
| assembly (concat) | 4 Assemble | `build_video.py` concat-demuxer over the ordered plate mp4s → silent master | free |
| `end_card` | 5 End card | `render_endcard.py` → `gpt-image-2` hero BG + Playwright HTML template render → 3s clip | **PAID** (BG) + free (render) |
| `music`, `audio_mix` | 5 Music | `finalize_video.py` / `add_endcard_and_music.py` → append end card + mux the brand track (vol 0.4, fade) → the master | free (track pre-sourced) |

## 1. Master-anchor plate → `gpt-image-2`  (config: `anchor`, `background`, `plate_engine`)  [PAID]

**Generate the master-anchor FIRST — it locks the frame.** One `gpt-image-2` render: the fair hand
in the lower-left third holding the barrel, the EMPTY cream skin-patch in the upper-right third, on
the saturated brand background, grounded on a product-hero ref. The `background.hand` + `.skin_patch`
+ `.lighting` + `.camera` constants are held **verbatim** here and in every subsequent plate so the
frame never moves. This plate is the LOCK for the whole cycle.

## 2. Shade + motion plates → `gpt-image-2` EDIT  (config: `plates[]`, `plate_engine`)  [PAID]

Per variant, one `gpt-image-2` **EDIT** call anchored to `[master-anchor, that shade's swatch ref,
that shade's hero ref]`. The prompt changes ONLY the barrel shade + the painted swatch stripe;
everything else is held verbatim. Interleave the half-painted / mid-swipe motion plates (anchored to
the master-anchor only). **ANCHOR EVERY PLATE TO THE SAME MASTER-ANCHOR — NEVER chain plate N off
plate N-1.** Chaining compounds hand / crop / background-hue drift and breaks the locked-frame
illusion (the format's load-bearing rule). Review all plates before step 4; re-roll any whose hand /
crop / patch drifted (off the master-anchor).

## 3. Finale plates → `gpt-image-2` EDIT  (config: `plates[]` phase finale)  [PAID]

The hand-exits plate (the hand leaves frame revealing all N swatches, anchored to the master-anchor +
the all-variants family ref), the all-swatches reveal, and the hero-pick plate (the hand returns
holding the chosen variant, other swatches visible). Same lock. This phase also renders the end-card
hero BG.

## 4. Encode + assemble → `build_video.py`  (config: `plates[].pose_hold_ms`, `cadence`) [FREE]

Encode each plate PNG→mp4 at its own `pose_hold_ms` (`ffmpeg -loop 1 -t <hold>`, scale/crop to
1080×1920 @ 30fps crf18) — motion / half-painted plates 150–250ms, per-shade ~380ms (or ~1000ms for a
slower cycle), hero / bookend beats 1100–1800ms — then concat-**demux** the plate mp4s in order
(`ffmpeg -f concat`) into the silent master. HARD cuts between plates, no dissolves. DIBS v3 ran 27
plate clips (15 unique plates, some reused across the cycle). Concat-demux (not `filter_complex`) is
correct because the plates are silent stills. Free — a re-cut reuses the existing plate PNGs.

## 5. End card + music → `render_endcard.py` + `finalize_video.py`  (config: `end_card`, `music`, `audio_mix`) [FREE assembly]

- `render_endcard.py`: a `gpt-image-2` hero BG + a Playwright render of the end-card HTML template
  (serif tagline + sans subtitle + the real logo SVG) → a silent ~3s end-card mp4. **Never AI-render
  the tagline / logo** — the HTML template composites the real logo SVG over the hero BG.
- `finalize_video.py` / `add_endcard_and_music.py`: append the end card after the silent master, mux
  the pre-sourced brand music track (`music.track`, volume 0.4, `music.fade_in_sec` / `.fade_out_sec`)
  OVER the whole video including the end card with a fade at the tail (`audio_over_end_card` — no
  silent tail) → the master (1080×1920, 30fps, h264+aac, ~16.6s).

Re-cuts (new holds, a re-ordered cycle, a swapped end card, a different track) reuse the existing
plates and cost **$0** — only steps 1–3 + the end-card BG spend.

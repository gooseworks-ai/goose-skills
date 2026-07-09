---
name: render-myth-vs-fact
description: Assemble a myth-vs-fact kinetic-typography explainer video ad (≈29.5s, 9:16) from N myth/fact pairs + hook / turn / punch copy + palette + a brand end-card PNG + a VO track — a hook, 3 red-strike MYTH cards that flip to teal-check FACT cards (per-line strikethrough that crosses EVERY wrapped line), a "what actually works" turn, an optional proof reveal, a punch line, and a static end card. DETERMINISTIC assembly with ZERO AI-gen visuals — HTML hyperframes rendered frame-exact via Playwright (`window.renderAt(t)`, animation a pure function of beat-local time), Whisper beat-snap to VO word onsets, concat at a uniform fps, karaoke `.ass` captions burned last (suppressed on the proof + end-card beats), and a VO + optional music mix (music −20 dB, `amix normalize=0`, tail fade). FREE (Python + Playwright + ffmpeg); the recipe supplies the copy / palette / end-card / VO and gates the paid VO / music / Whisper calls to their own capabilities. Use for the myth-vs-fact format.
status: active
---

# render-myth-vs-fact

The free, deterministic renderer for the **myth-vs-fact** video ad format — the calm,
sound-off-safe kinetic-typography explainer that busts N common myths and hands the viewer
a credible resolution. Red-strike **MYTH** cards flip to teal-check **FACT** cards over a
calm-authority VO, then a "what actually works" **turn** + an optional **proof reveal** + a
**punch** line + a static brand **end card**.

Every on-screen word is a **deterministic HTML hyperframe** — **no AI image/video gen, no
b-roll, no character**. Visuals cost **$0**. The only metered spend is upstream (VO +
Whisper word-timestamps + an optional music bed), gated to its own capabilities. This
capability OWNS the whole FREE assembly: beat-snap → render → captions → mix → burn →
master. Iterate the cut for free; re-roll only the offending paid audio beat.

It ports the validated build from the Clinikally "acne myths" run — brand-neutralised,
config-driven, and portable (no `/Users`, no `clients/`; everything via `--config` +
`--work-dir`).

**SOUND-OFF SAFE is the whole point:** every claim is legible on-screen and the VO only
reinforces it. **VO-FIRST:** render the VO, extract Whisper word onsets on the RENDERED
audio, then snap every beat boundary + strike wipe + reveal to those onsets.

## The 8-beat spine (roles)

`hook` → 3× `myth-fact` (the flip triad — identical grammar so it reads as a pattern) →
`turn` (the "what actually works" pivot) → `proof` (optional actives/proof reveal, omit if
empty) → `punch` (full-frame closer) → `end-card` (the static brand PNG). Each beat carries
its `role`, `duration`, and its copy; ONE role template renders any pair.

## Scripts (free — Python + Playwright + ffmpeg, no paid calls)

- `scripts/beat_snap.py` — VO-first alignment. FAL Whisper word-timestamps on the RENDERED
  VO → re-snap every beat boundary to the nearest word onset. Writes
  `beat-manifest.json` + `whisper/words-flat.json` into the work dir. `--no-whisper` keeps
  the config durations un-snapped for a fully offline run.
- `scripts/render_beats.py` — the deterministic renderer. Per `mg` beat: pick the role
  template under `hyperframes/`, inject the beat's copy + palette + fonts as `window.BEAT`,
  drive `window.renderAt(t)` frame-by-frame via Playwright, screenshot each frame → ffmpeg
  at EXACTLY the configured fps (default 25/1). The `end-card` beat is built from the
  pre-supplied brand PNG (scale/crop + a ~0.35s fade-up) — **never generated per run**.
- `scripts/make_captions.py` — karaoke `.ass` from the manifest + Whisper words. ≤3 words
  per cue; close on a >0.4s gap / beat-window edge / sentence-ending punctuation. Captions
  are burned ONLY in caption-allowed windows; the proof + end-card beats are suppressed.
- `scripts/compose.py` — the assembler: concat the beats → mix VO + optional music (music
  −20 dB, `amix normalize=0`, ~0.8s tail fade) → burn the `.ass` LAST → master mp4.
- `scripts/config.example.json` — the shape of the brand `config` the recipe binds (the
  brand-neutralised Clinikally values as a worked reference).
- `scripts/hyperframes/` — the bundled hyperframe scaffold: `_shared.css` (palette-tokened
  tokens + card/tag/fact/pill/chain type), `_shared.js` (the `initRenderer` /
  `springScale` / `buildLineStrikes` + `strikeLines` per-line-strike / `popIn` /
  `revealWords` helpers + config injection), and one template per role (`beat-hook.html`,
  `beat-myth-fact.html`, `beat-turn.html`, `beat-proof.html`, `beat-punch.html`).

## Inputs (all via `--config` + a runtime work dir — NO hardcoded paths)

`config.json` carries: `fps` (25) / `width` / `height`; `vo` + optional `music` +
`mix{music_db:-20, tail_fade:0.8}`; `palette` (the five CSS-var tokens `bg`, `myth_strike`,
`fact_accent`, `headline_ink`, `accent`); `brand_name`; `display_font`; `end_card_png` +
`end_card_fade`; `caption_style`; `suppress_beats`; and `beats[]` — each `{n, role,
duration, captions, cues{...}}` plus the role's copy:
- **hook:** `eyebrow`, `hook_line`, `emphasis`, `strike_word`
- **myth-fact:** `myth_index`, `myth_line`, and either `fact_line` (a `[bracketed]` phrase
  becomes the accented payload) OR `fact_clauses[]` (a staggered clause chain)
- **turn:** `turn_slate`, `turn_sub` (`[brackets]` → emphasis)
- **proof:** `proof_eyebrow`, `proof_items[]` (`{name, badge}`), `proof_footnote`
- **punch:** `punch_line`
- **end-card:** none (built from `end_card_png`)

The recipe's `myth_fact_pairs`, `hook_line`, `turn_slate`, `punch_line`, `palette`,
`end_card_png`, and optional `actives_or_proof` map onto these beats 1:1. See
`config.example.json`.

## Craft rules (load-bearing — faithful to the source molecule)

- **MYTH strikethrough is PER-LINE.** Measure each wrapped line box (`Range.getClientRects`,
  deduped to one rect per visual line) and lay one red bar at each line's vertical MIDDLE,
  driven as ONE continuous L→R sweep. A single fixed-Y rule reads as an underline the moment
  the headline wraps.
- **The end card is the pre-built brand PNG — NEVER generated per run.** Scale/crop to the
  canvas with a short fade-up; it carries its own baked logo + claim + CTA.
- **Animation is a pure function of beat-local time** — no `setTimeout`, no CSS keyframes —
  so Playwright seeks frame-exact and the render is fully reproducible.
- **Every beat mp4 is exactly the configured fps (25/1).** `render_beats.py` enforces +
  warns; a mismatch makes the concat demuxer silently drop frames.
- **All text fits the 88% safe area at the ~15% spring-overshoot PEAK**, not at rest.
- **Captions burned LAST**, ≤3 words/cue, closing on >0.4s gap / window edge / sentence end.
  The ASS `Events Format:` line MUST carry the `Name` field or every cue gets a
  leading-comma artifact. Suppress the proof/footnote + end-card beats (two text layers at
  one spot both go unreadable).
- **Mix constants are validated** — music `−20 dB` under the VO, `amix normalize=0` (with
  normalize on the bed pumps), ~0.8s tail fade. Sound-off must still work without the bed.
- **Keep the MYTH triad's flip grammar + internal timing identical** so it reads as a
  pattern (anaphora).

## Requires

- **Python 3** + **Playwright chromium** (`pip install playwright && playwright install
  chromium`) for the frame-exact hyperframe render, and **ffmpeg/ffprobe** on PATH. If
  Playwright is unavailable, `compose.py` + `make_captions.py` (the concat / mix / caption
  path) still run; only `render_beats.py` needs the browser.
- `watch` (QC the final master — the red strike crosses the vertical MIDDLE of EVERY wrapped
  myth line, the VO is intelligible, captions are legible with no card collision,
  suppression is correct on the proof + end-card beats, framerate is uniform 25/1, no
  clipping, every claim is legible sound-off). The recipe gates the paid `create-vo-eleven`
  (VO), `create-music-elevenlabs` (bed), and FAL Whisper calls — this capability itself
  makes NO paid calls.

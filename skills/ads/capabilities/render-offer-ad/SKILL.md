---
name: render-offer-ad
description: Render a punchy ~12s vertical (9:16) music-only direct-response OFFER ad as a 4-beat kinetic-typography film — HEADLINE slam → real PRODUCT drop → CLAIM/proof → CTA pill — from one config of copy slots, a real product photo, a brand palette, fonts, bpm, and beat split. DETERMINISTIC + FREE (a bundled Remotion project; springs + interpolate, no AI-gen for visuals). Backgrounds are engine gradient divs off the palette, props are inline SVG, the ONLY composited bitmap is the REAL product photo (objectFit:contain, never stretched), and ALL headline/claim/CTA/URL/wordmark text is typeset in the engine — never AI-rendered (the format's credibility guard). A driver binds the config to Remotion input props, renders the 9:16 master, and derives a 1:1 center-crop with ffmpeg. Two gating checks run before render (claim verbs must match the product's physical format; the claim beat needs an edge-entry mechanism prop). Use for the motion-graphics-offer-ad format.
status: active
---

# render-offer-ad

The free, deterministic renderer for the **motion-graphics-offer-ad** format — the
punchy ~12s vertical, music-only, direct-response offer ad built as a **4-beat kinetic
-typography film**: a HEADLINE slams in word-by-word → the real PRODUCT drops in →
the CLAIM/proof lands → a CTA pill resolves. No character, no VO, no captions — the
on-screen **typeset** text IS the message.

This is a bundled **Remotion project** (`project/`) driven by a thin Python driver. The
shipping master is **100% engine-rendered** (springs + `interpolate`): backgrounds are
gradient divs off the `brand_palette`, props are inline SVG, and the ONLY composited
bitmap is the REAL product photo (`objectFit:contain`, **never stretched**). ALL
headline/claim/CTA/URL/wordmark text is typeset in the engine — **never AI-rendered**;
that is the format's credibility guard. Render cost is **~$0**; the only paid step is an
optional music bed, gated upstream in the recipe to `create-music-elevenlabs`.

The whole ad is **data**: copy strings, product photo, palette, fonts, bpm, and beat
split all arrive as `config.json` and are bound to Remotion **input props** — nothing is
hardcoded in the scenes (the source run's Spoiled Child strings are generalised into
`project/src/props.ts`). Deterministic → **iterate the cut for free**.

## The 4 beats (the spine)

1. **HEADLINE** — primary-color radial ground; `headline_words` slam in WORD-BY-WORD
   (`slamIn`, ~7-frame stagger, scale-overshoot + motion-blur smear, settling on the
   downbeat); `subline` + an animated bobbing down-arrow drop in.
2. **PRODUCT** — light radial ground; the REAL product photo drops in (`dropIn`) and
   idle-bobs (`bob`), `objectFit:contain` (never stretch); the `motif_chip` pops in
   (`popIn`); optional GENERIC competitor shape + strike-through (`wipe`) — never a
   named competitor.
3. **CLAIM** — light radial ground; the `mechanism_prop` slides in from a frame edge
   (`flyIn` overshoot, ~20% from the bottom) to add motion AND show the mechanism; the
   3-line claim drops in staggered; product held bottom-right.
4. **CTA** — primary-color radial ground; the `wordmark` slams (`slamIn`); the CTA pill
   pops in as the motif-chip handoff resolving (`popIn`) with an arrow nudge; the
   `cta_url` fades up.

Scene boundaries are **derived** from `beat_split_sec` (default `[3.0, 3.5, 3.0, 2.5]`s →
cuts at frames 0/90/195/285/360 @30fps) so the hard cuts land on the beat downbeats. The
motion kit — `slamIn / dropIn / bob / flyIn / popIn / wipe` — lives in
`project/src/lib/anim.ts` and is kept intact from the source run.

## Two gating checks (run before any render — from the recipe)

- **(a) CLAIM-MATCHES-FORMAT** — the claim/proof verbs MUST match the product's physical
  format: liquid → `spoon / sip / drink / 0 mess`; powder → `scoop / mix / no clumps`;
  capsule → `1 a day`; gummy → `chew`. `render.py` rejects foreign-format vocabulary
  (e.g. a liquid product must not borrow powder grammar like `scoop / no clumps`). Set
  `product_format` in the config to arm this gate.
- **(b) CLAIM-BEAT MECHANISM PROP** — the claim beat must include an edge-entry
  `mechanism_prop` (`spoon` for drinkable liquids, or `accent` for a neutral edge-entry
  accent bar) that supplies motion AND shows the mechanism. A text-only claim beat is too
  static — `render.py` rejects an unsupported/missing prop.

## Run

```bash
# 1) install the bundled Remotion project's deps (one-time; render.py auto-runs
#    this if node_modules is absent).
cd project && npm install && cd ..

# 2) bind config → Remotion input props, render the 9:16 master, derive the 1:1 crop.
python3 scripts/render.py \
  --config path/to/config.json \
  --work-dir <work> \
  --out <work>/master
# → <work>/master-9x16.mp4  (1080x1920)  and  <work>/master-1x1.mp4  (1080x1080 crop)
```

`render.py` copies the config's `product_hero_image` (+ optional `music.bed`) into
`project/public/`, maps every config key onto the `OfferAdProps` shape `props.ts` reads,
writes the input props to `<work>/props.json`, runs `npx remotion render offer-ad --props
<work>/props.json`, then center-crops the 9:16 master to 1:1 with ffmpeg (no 2nd
composition). NO hardcoded `/Users` or `clients` paths — every asset arrives via the
config and a runtime `--work-dir`.

## Scripts

- `scripts/render.py` — the driver: gating checks → stage assets into `project/public/`
  → bind config to Remotion input props → `npx remotion render` (9:16) → ffmpeg 1:1
  center-crop.
- `scripts/config.example.json` — the shape of the `config` the recipe binds
  (brand-neutral worked defaults from the source run; replace every `/abs/...` placeholder).
- `project/` — the bundled Remotion project. `src/props.ts` (the input-props schema +
  beat-layout math + safe defaults), `src/lib/anim.ts` (the `slamIn/dropIn/bob/flyIn/
  popIn/wipe` motion kit — kept intact), `src/scenes/Scene01–04.tsx` (the four beats,
  all copy/palette/fonts from props), `src/Main.tsx` (the beat spine + audio bed),
  `src/Root.tsx` (the `offer-ad` composition; duration derived from `beat_split_sec`).

## Config → props mapping (what binds to what)

| config key | Remotion prop (`props.ts`) | scene that reads it |
|---|---|---|
| `product_hero_image` | `product_image` (staged to `public/`) | Scene02 (drop), Scene03 (anchor) |
| `brand_palette{primary_ground,light_ground,ink,highlight_chip}` (dict OR ≥4-hex list) | `palette` | all 4 (grounds/type/chip) |
| `fonts{display,body}` | `fonts` (resolved in `fonts.ts`) | all 4 |
| `copy.headline_words[]` / `copy.subline` | `copy.headline_words` / `copy.subline` | Scene01 |
| `copy.motif_chip` | `copy.motif_chip` | Scene02 |
| `copy.claim_lines[]{big,small}` | `copy.claim_lines` | Scene03 |
| `copy.cta_label` / `copy.cta_url` / `copy.wordmark` | same | Scene04 |
| `mechanism_prop` (`spoon`\|`accent`) | `mechanism_prop` | Scene03 (inline-SVG prop) |
| `bpm` | `bpm` | beat grid |
| `beat_split_sec` [4] | `beat_split_sec` | derives cut frames + total duration |
| `music.bed` / `music.fade_out_frames` | `music.src` (staged) / `music.fade_out_frames` | `Main` audio bed |
| `show_competitor_strike` | `show_competitor_strike` | Scene02 |
| `aspects` | (driver) | 9:16 always; 1:1 = ffmpeg crop |

## Craft rules (load-bearing — faithful to the source run)

- **The composited bitmap is the REAL product photo — never an AI packshot.** Clean /
  transparent bg; `objectFit:contain`, never stretched.
- **Never AI-render text.** Headline, claim, CTA, URL, wordmark — all typeset in the
  engine. AI never draws a letter in this format.
- **Never Ken-Burns/zoompan over stills** — the engine springs carry the motion; a
  static/zoompan cut was rejected as "too static" on the source run.
- **Music-only, beat-locked** — the cuts + big slams land on the 0.0/3.0/6.5/9.5s
  downbeats; the bed volume ramps to 0 over the last `music.fade_out_frames` inside the
  render. No VO, no captions.
- **Never name/jab a competitor** — any comparison shape on the product beat is a GENERIC
  silhouette (`show_competitor_strike`), not a named brand.
- **The two gating checks are non-optional** — a liquid product must not borrow powder
  grammar; the claim beat must have real prop motion, not a static text stack.

## Requires

- **Node.js** (≥18) + **Remotion** (`@remotion/cli` ≥4.0, installed via the bundled
  `project/package.json` — `render.py` runs `npm install` in `project/` on first use).
  This capability legitimately needs a node runtime — the renderer IS a Remotion project.
- **ffmpeg** on PATH (for the 1:1 center-crop).
- `watch` (QC the final master — confirm the headline slams WORD-BY-WORD on the beat, the
  real product photo drops in + idle-bobs and is NOT stretched, the mechanism prop enters
  from a frame edge on the claim beat, the claim lines drop in staggered, the CTA label +
  URL are readable at 1080×1920, the hard cuts land on the downbeats, and the music ramps
  out; re-confirm both gating checks visually). The recipe gates the only optional paid
  step (music bed → `create-music-elevenlabs`) — this capability itself makes NO paid calls.

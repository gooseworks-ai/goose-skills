# PIPELINE — multiworld-product-tour

How each `config.example.json` field maps to the source generation step. This molecule
ships as **config + documentation**, not a rebuilt runnable Higgsfield harness — the six
clips are fired through Higgsfield Marketing Studio (CLI/MCP), which reserves credits
server-side. The real render/assembly scripts live in the source project:
`clients/Primally pure/ad-runs/run-03-run-03/working/` (`render_clips.py`,
`render_endcard.py`, `build_master.py`) and `production/` (`scene-contract.json`,
`generation-jobs.json`, `audio-plan.json`).

> **Worked example, not the format.** Everything named below — Primally Pure, the three
> scents, the pilates / spa / farmers-market worlds, the "FIND YOUR DAILY." headline, the
> acoustic music — is the demo's build. For a new video the worlds, look and music come from
> the recipe's `choices` (`worlds`, `visual_style`, `music`); product names, copy and URL
> come from the brand kit. Copy the structure, never the creative values.
>
> **Provider note.** The demo fired its clips through Higgsfield Marketing Studio (hence
> `higgsfield.*` + `product_uuid` in `config.example.json`). The current recipe makes the
> same six clips with `create-image-fal` (nano_banana_2 keyframe edit grounded on the real
> `product_image`) → `create-video-fal` (Kling 3.0 i2v); its `config.keyframe` / `config.i2v`
> / `config.worlds[*].*_keyframe_prompt` / `*_i2v_prompt` fields are the live schema.

## The 3×3 grid — worked example (Primally Pure, from `idea-brief.md`)

The format's core IP: three products/variants, each locked to its own **world + palette +
companion prop**, so variant identity is carried by the *set*, not by product color. The
worlds and palette come from `choices.worlds` / `choices.visual_style`; the table below is
the demo's grid.

| Scent (product) | Third place (world) | Palette | Botanical companion | Bottle color |
|---|---|---|---|---|
| Lavender | Sunrise reformer pilates studio | Mauve sunrise + cream linen + blonde pine | fresh lavender sprig | cream/beige |
| Blue Tansy | Spa anteroom / sauna threshold | Sage-teal + bone + warm cedar | blue tansy flower + eucalyptus bundle | cream/beige |
| Bergamot + Eucalyptus | Saturday outdoor farmers-market stall | Citrus yellow + linen + sage | bergamot fruit + eucalyptus stems | matte black |

Note: eucalyptus appears in BOTH the Blue Tansy and B+E worlds (a connective brand
thread) — differentiate via the *other* botanical (blue tansy flower vs bergamot fruit)
so the two worlds don't read as the same scent.

## Field → generation step

### `worlds[]` → six Higgsfield Marketing Studio clips (`render_clips.py`, PAID)
- Each world produces **two** `marketing_studio_video/product_showcase` clips grounded on
  its `product_uuid` (the brand's imported Higgsfield product):
  - `arrival_prompt` → the WIDE kinetic-calm arrival (renders `higgsfield.arrival_duration_sec` = 5s; trimmed to 4.5s at master).
  - `macro_prompt` → the top-down macro product moment (renders `macro_duration_sec` = 4s; trimmed to 3.5s).
- `higgsfield.safety_block` is appended to **every** prompt: sealed-bottle discipline +
  no smoke/vapor/aerosol + no whip-pans/shake + label-match + no on-screen text.
- Six clips fired in parallel (ThreadPoolExecutor); per-job result JSON + mp4 land in
  `working/clips/`. Job ledger → `production/generation-jobs.json`.
- **Gotchas seen on the demo** (all in `generation-jobs.json`):
  - S03 (Blue Tansy arrival) v1 rendered the bottle **cap-off** → P0 sealed-bottle
    violation → re-rolled as v2 with "BOTTLE STAYS SEALED, CAP STAYS ON" front-loaded.
  - S05 (B+E arrival) mid-clip showed a gloved leather hand vs the called-for bare
    fingertips — minor, accepted.
  - S06 (B+E macro) first submission failed HTTP 502 (transient) → retried; and the
    label misrendered "Eucalyptus"→"Eucaiyptus" at the upright tilt extreme — not
    visible in the top-down portion the trim dominates.

### `end_card.nb2_*` → NB2 flat-lay background (`render_endcard.py`, PAID) + HTML overlay
- `nb2_prompt` + the 3 `nb2_input_product_uuids` → one `nano_banana_2` render of the
  **text-free** editorial flat-lay: all three sealed bottles + their botanicals on a
  cream-blush gradient, generous negative space at top. Prompt explicitly forbids
  text/typography (`No text overlays, no typography, no captions`). Output → `working/endcard/layer1.png`; job → `generation-jobs.json` (`job-endcard-001`, model `nano_banana_2`).
- `end_card.html` (the overlay layer) is screenshotted by Playwright over that
  background, then encoded to a `dwell_sec` (3.0s) mp4:
  - `overlay.headline` (demo: "FIND YOUR DAILY.") — Inter 900, one key word outlined via
    `-webkit-text-stroke`, rise-in animation. Approved brand copy only.
  - `overlay.scent_labels[]` — three handwritten Caveat-font product/variant labels, each with a
    hand-drawn SVG arrow (staggered `drawArrow` animation) pointing to its bottle.
  - `overlay.wordmark` (demo: "PRIMALLY / PURE") (Playfair Display, two rows) + `url`.
  - Text animates across ~0–2.4s, then a ~0.6s hold (`scene-contract.json` S07).
- **Rule:** the end-card text is HTML-composited, NEVER AI-rendered. NB2 = background only.

### `music` → one ElevenLabs bed (curl → ElevenLabs, PAID)
- `music.prompt` (genre/mood from `choices.music`) → a single instrumental bed (`force_instrumental: true`), `length_ms`
  = 27000. Trimmed to `working/music/music_trimmed.mp3`. Job → `generation-jobs.json`
  (`job-music-001`, provider `elevenlabs`).
- No VO, no captions anywhere in the scenes — the whole tour is silent-but-music-led
  (`audio-plan.json` has no VO auditions; `scene-contract.json` every scene
  `captionStyle: none`). `audio-plan.json` sets `climaxBeatId: beat-07-endcard`.

### `scene_grid` + `master` → FFmpeg stitch (`build_master.py`, FREE/deterministic)
- Trims each clip to its grid `duration_sec` (arrival 4.5 / macro 3.5 / end card 3.0),
  re-encodes each to the master spec (`width`×`height` = 720×1280, `fps` = 24, yuv420p,
  scale+pad, no audio).
- Hard-cut concat via the concat demuxer → a silent master (S06→S07 is the one
  whip-pan-to-end-card transition; the rest are hard cuts, per `scene-contract.json`
  `transitionPlan`).
- Muxes the music: `afade` in `master.fade_in_sec` / out `master.fade_out_sec` +
  `loudnorm master.loudnorm` (I=-16:TP=-1.5:LRA=11), AAC `master.audio_bitrate`, clamped
  to `duration_sec` (27.0s).
- Output → `finals/master-v2.mp4`. Total = `3×(4.5+3.5) + 3.0 = 27.0s`.

## Source-of-truth files (in the demo project)

- `production/scene-contract.json` — the 7-scene contract (worldLock, per-scene shot +
  frameDescription, transitionPlan, `visualVarietyAudit`).
- `production/generation-jobs.json` — the job ledger (models, costs, re-rolls, the
  sealed-bottle P0).
- `production/audio-plan.json` — silent/music-led config.
- `working/<variant>_product.json` (demo: `lavender`, `blue_tansy`, `bergamot_eucalyptus`) —
  the imported product refs (UUIDs + CloudFront media).
- `working/endcard/{endcard.html, nb2_result.json}` — the overlay + the NB2 background job.
- `working/{render_clips,render_endcard,build_master}.py` — the real render/assembly code.
- `idea-brief.md` — the 3×3 grid + guardrails + the Touchland-departure table.

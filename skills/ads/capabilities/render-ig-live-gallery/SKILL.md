---
name: render-ig-live-gallery
description: Render an 'Instagram-Live social-proof gallery' video from a config — ~5 real brand product stills each framed as an Instagram-LIVE card (IG gradient-ring avatar, username, verified check, red LIVE badge, viewer count, close X, a short claim-free live-comment feed, an empty 'Add a comment…' bar, and reaction hearts floating up the right edge), with a brand-approved benefit sentence building one phrase per slide and a clean logo endcard, rendered deterministically with PIL frames plus FFmpeg — FREE (the music bed comes from create-music-elevenlabs), products and wordmark stay crisp. Use for the ig-live-gallery format.
status: active
---

# render-ig-live-gallery

Render the **ig-live-gallery** format from a config. Each of the brand's REAL hero product
stills is presented as the "live video" inside an authentic Instagram-Live card — dark
gradient scrims top & bottom over the bright product, an IG gradient-ring avatar + username +
verified check + red LIVE badge + viewer count + close X across the top, a short live-comment
feed + an EMPTY "Add a comment…" bar + heart/share icons across the bottom, and pink/red
reaction hearts floating up the right edge. A benefit sentence builds one short phrase per
slide as the top overlay, and it closes on a clean brand logo card with the payoff line + CTA.

Deterministic and FREE — no generative image/video, no AI-rendered text. The paid music bed is
a separate capability (`create-music-elevenlabs`) muxed on afterward.

## Run

```bash
python3 scripts/build.py --config config.json --assets <stills-dir> --out master-silent.mp4
# quick check — one frame per slide:
python3 scripts/build.py --config config.json --assets <stills-dir> --stills <dir>
```

`config.example.json` is a full worked config (Glossier). Config shape:

- `username`, `verified`, `palette`, `slide_dur`, `endcard_dur`, `crossfade`
- `slides[]` — `{ image, phrase, viewers, comments: [[handle, text], …] }` per product
- `endcard` — `{ logo, logo_is_white, payoff, handle, cta }`
- `music` — `{ prompt, length_ms, trim_intro_sec }` (consumed by `create-music-elevenlabs`)

Image paths in the config resolve against `--assets`.

## Craft rules (baked into the renderer)

- **Center each product on its TOP-HALF silhouette**, never the full non-white bbox — the base
  drop-shadow otherwise inflates the box and the product reads shifted sideways. The renderer
  measures the top 50% of the silhouette with an `L<246` threshold (catches white-product edge
  shading too) and centers that midpoint.
- **Reaction hearts float up the right edge as a full column** and may overlap the centered
  product — that's fine; don't shrink them to a thin edge ribbon.
- **Comments must be claim-free brand-descriptor vibe** (2-3 words, generic handles, NO emoji —
  PIL can't render color emoji); the comment INPUT bar stays empty. LIVE badge + viewer count +
  hearts are ambient live-stream chrome, not proof claims.
- **Endcard is the clean logo card** (bg + wordmark + @handle + CTA + payoff), never a model face.
- Real product stills + real wordmark only. Music bed only, no VO.

## Output

A silent `WxH` (default 1080x1920) H.264 master. Generate + mux the `create-music-elevenlabs`
bed with a short fade in/out + loudnorm (`-map 0:v:0 -map 1:a:0`), then QC with `watch`.

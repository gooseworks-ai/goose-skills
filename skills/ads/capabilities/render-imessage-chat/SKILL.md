---
name: render-imessage-chat
description: Assemble an iMessage chat-reveal video ad from a thread JSON — one continuous Playwright recording of the conversation animating in (typing dots, composer typing, bubble pops, auto-scroll) crossfaded into a designed end card, with iMessage send/receive SFX and an optional ducked music bed. FREE assembly (Playwright + ffmpeg); the recipe supplies the per-brand thread + product + end-card config and gates the paid product-image/music calls to their own capabilities. Use for the imessage-chat format.
status: active
---

# render-imessage-chat

The free renderer for the **imessage-chat** video ad format — a texting-thread
reveal where a friend-to-friend conversation animates in on a phone (typing
indicators, composer typing, bubble pops, smooth auto-scroll) and lands on a
designed brand end card. Deterministic Playwright + ffmpeg assembly; no
generative video of the UI, so bubble text and the wordmark stay pixel-crisp.

This capability is the generic assembler — the template recipe (DB) supplies the
per-brand `thread`, product image, and `end_card` config, and gates the paid
calls (product image → create-image-fal, music bed → create-music-elevenlabs) to
their own capabilities. It bundles the iMessage-mockup HTML generator + the
send/receive SFX so a chat render is self-contained and $0.

## The three defects it fixes (QA GOOSE-2481)

1. **Rich-link attachment** — a product/link renders as a REAL iMessage URL
   preview: the image (top-rounded corners) flush against a gray meta card with a
   bold title + domain subtitle + chevron. NOT a bare image with a distorted
   caption floating centered below it (the mockup's default `.attachment-meta`).
   The fix is baked into `record-chat.js`'s injected style, theme-aware.
2. **No text bleed** — every bubble fits. This is an AUTHORING rule the recipe
   enforces: split any long line into multiple short bubbles (see the two `spec`
   lines in `config.example.json`). The renderer honors the thread it's given.
3. **A designed end card** — wordmark + ⭐ proof row + trust trio + CTA pill
   (`render-end-card.js` + `end-card.template.html`), not a bare logo.

## Run

```bash
cd scripts && npm install            # once — installs Playwright for the recorders
node record-chat.js    --config config.json --out-dir <work>   # → master-chat.mp4 + .sfx.json
node render-end-card.js --config config.json --out-dir <work>  # → scene-end-endcard.mp4
bash stitch.sh --chat <work>/master-chat.mp4 --end <work>/scene-end-endcard.mp4 \
     --sfx <work>/master-chat.sfx.json --out <work>/master-final.mp4 \
     [--music <work>/music-bed.mp3] [--also-1x1]
```

1. **`record-chat.js`** — reads `config.json` (`thread` + `theme` + geometry +
   optional `background_image`), derives a believable per-message timeline
   (received bubbles pop after an optional `…`; sent bubbles are typed out in the
   composer then popped + Delivered; attachments dwell so a rich link lands),
   records it as one continuous MP4, and emits a deterministic SFX cue list.
2. **`render-end-card.js`** — fills `end-card.template.html` from `config.end_card`
   (wordmark/`logo_svg`, stars, proof text, trust trio, CTA, colors) → still MP4.
3. **`stitch.sh`** — crossfades chat → end card, layers the send/receive SFX (from
   the cue list; the mp3s ship in `assets/sfx`), optionally ducks a music bed
   under it, and optionally derives a 1:1 variant. All FREE ffmpeg.

## Contract

- FREE assembly: Playwright record + ffmpeg composite/mux + the bundled SFX. No
  AI-rendered text — the bubbles, rich-link title/domain, and end-card copy are
  all real HTML/PIL, never invented by a model.
- The recipe (DB) supplies the per-brand config: the `thread` (kept short — split
  long lines), the product image bound into the attachment, the `end_card`
  (prefer a real `logo_svg` wordmark), theme (dark default), and an optional
  `background_image` (a flat-lay behind the phone) + optional music bed.
- Craft rules preserved from the reference build (Wonderbly Concept E):
  - Rich-link attachment card (image top-rounded, flush on the gray meta card).
  - Keep messages SHORT — split long thoughts into multiple bubbles (no bleed).
  - You never see your own typing dots — sent messages type in the composer.
  - Attachment dwell (~3.6s) so the product/link registers.
  - Designed end card (wordmark + proof + trust trio + CTA), not a bare logo.

## Gaps / routing notes

- **Product image** (the attachment) and the optional **music bed** are inputs,
  not generated here — the recipe gates them to `create-image-fal` /
  `create-music-elevenlabs` (paid, proxy-routed, billed to the Ads agent). Pass
  the resulting files into the config / `stitch.sh --music`.
- **Background flat-lay** is optional; omit it for a clean neutral gradient behind
  the phone, or generate one via `create-image-fal` and point `background_image`
  at it.
- Requires **ffmpeg/ffprobe** on PATH and Playwright Chromium (`npx playwright
  install chromium`) — `gooseworks doctor` checks both.

---
name: render-imessage-chat
description: Assemble an iMessage chat-reveal video ad from a thread JSON — one continuous Playwright recording of the conversation animating in (typing dots, composer typing, bubble pops, auto-scroll) crossfaded into a designed end card, with iMessage send/receive SFX and an optional ducked music bed. FREE assembly (Playwright + ffmpeg); the recipe supplies the per-brand thread + product + end-card config and gates the paid product-image/music calls to their own capabilities. Use for the imessage-chat format.
status: active
---

# render-imessage-chat

The free renderer for the **imessage-chat** video ad format — a texting-thread
reveal where a two-person conversation animates in on a phone (typing
indicators, composer typing, bubble pops, smooth auto-scroll) and lands on a
designed brand end card. Deterministic Playwright + ffmpeg assembly; no
generative video of the UI, so bubble text and the wordmark stay pixel-crisp.

This capability is the generic assembler — the template recipe (DB) supplies the
per-brand `thread`, product image, and `end_card` config, and gates the paid
calls (product image → create-image-fal, music bed → create-music-elevenlabs) to
their own capabilities. It bundles the iMessage-mockup HTML generator + the
send/receive SFX so a chat render is self-contained and $0.

## Choices

The calling recipe asks the user these before any paid step; this capability only renders
the config it is given. The Wonderbly values in `config.example.json` are a worked example,
never defaults.

- **relationship** — who is texting whom (friends, siblings, parent + adult kid, coworkers,
  a couple) → `thread.participants` + the voice of `thread.messages`.
- **story** — the micro-story in the thread → `thread.messages`.
- **tone** — casual, funny, sincere, deadpan, hype → the wording of `thread.messages`.
- **theme** — dark or light iMessage → `theme` (renderer falls back to dark if unset).
- **music** — none (SFX only) or a bed genre → `stitch.sh --music` (optional).

End-card colours, wordmark, proof, trust trio and CTA are brand facts (brand kit, approved
copy only). Missing end-card colours fall back to a neutral white/black card.

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
cd scripts && npm install && npx playwright install chromium   # once
bash render.sh --config config.json --out <work>/final.mp4 [--music bed.mp3] [--also-1x1]
```

One command: `record-chat.js` -> `render-end-card.js` -> `stitch.sh` -> `check-render.py`.
It exits non-zero on any failure, so a bad video never looks finished. The steps can still
be run one by one (same flags as before).

**What it guarantees (and checks on the finished file):**
- **Sound on the bubble.** A magenta sync curtain is shown until the chat starts and the
  capture is trimmed at its first missing frame. Each sound is placed by its measured
  onset and leads its bubble by 40 ms (`stitch.sh --sfx-lead`). A sound is cut (40 ms
  fade) where the next one starts, as a phone restarts the alert. `check-render.py`
  fails the render if any cue's onset is outside -150..+20 ms of its bubble. Per-cue gain and a
  -2 dBFS limiter keep the mix below -1 dBTP, so back-to-back chimes never clip.
- **Real-phone details.** Apple Color Emoji glyphs (not Segoe/Noto); "Delivered" only under
  the newest sent message (text or link); 1-3 emoji alone render large; sent bubbles rise
  from the text field; the status-bar clock follows the thread's timestamp line; light
  theme header icons are dark; link images sit on a grey card.
- **Authoring guards (fail before recording):** em/en dashes, self typing dots, duplicate
  ids, attachment files under 2 KB (git-LFS pointers), text overflowing its bubble. Over
  16 messages warns (each adds ~1.6 s; 10-16 lands at 20-27 s).
- **End card:** `logo_svg` / `logo_svg_path`, or `logo_image_path` (PNG/JPG) for brands
  with no SVG; `wordmark_width` (default 560); a logo under 3:1 contrast with the card is
  recoloured to `fg`; `url_text` under the CTA; `footnote` for legal lines (the FDA
  disclaimer every supplement benefit claim needs), kept inside the 4:5 safe zone.

**Grammar and punctuation are enforced** (iPhones auto-capitalise and add apostrophes, so
correct text is also the realistic text): every message starts with a capital, ends with
`. ! ? …` or an emoji, has no texting shorthand (u, ur, im, dont, tmrw, rn...), no lowercase
"i", and clean spacing around punctuation. A sentence sent as two bubbles marks the first
half `"continues": true` (it may skip end punctuation; the second half may start lowercase).
Straight apostrophes render curly, as iOS Smart Punctuation does.

**Texture without typos:** `{ "type": "tapback", "from": "<id>", "target": "<message id>",
"emoji": "😂" }` lands an iOS reaction on an earlier bubble: a round badge mostly above the message on its outer top corner (left on your blue bubbles, right on theirs), grey for theirs and blue for yours, with a two-dot tail touching the corner; the message steps down to make room; split sentences as above.
Short threads sit under the header and
auto-scroll once the screen fills, as in Messages.

**Editorial end card** (`end_card.layout: "editorial"`): the brand's own type system instead
of the badge template. `fonts.{headline,body,mono} = { family, weight, style, google }`
(`google` = a Google Fonts family spec, the free stand-in when the brand's font is
licensed), `headline: [line, line]` (second line in `accent`), `headline_case`, `points`
+ `points_case` + `points_sep`, optional `cta_text`, `url_text`, `footnote`. The render fails
if any requested font does not load.

Put `{ "type": "timestamp", "bold": "iMessage", "light": "Today 7:12 AM" }` first in the
thread; real conversations open with it and the clock is read from it.

### Where the SFX come from

The two real iMessage sounds ship twice: as mp3s in `assets/sfx` and as base64 text
in `scripts/sfx-embedded.json`. A catalog fetch delivers text files only, so a
fetched copy has no `assets/` folder. `stitch.sh` handles that by itself, in this order:

1. `--sfx-dir <dir>` if passed (must hold `imessage-send.mp3` + `imessage-receive.mp3`).
2. `assets/sfx`, if both mp3s are real audio (not git-LFS pointers).
3. Otherwise it decodes `scripts/sfx-embedded.json` (sha256-checked) into a temp dir.

If none is there it stops and names what it looked for. **Never substitute
made-up pops** — keep `sfx-embedded.json` byte for byte when saving fetched files:
write it with a program from the fetch output (e.g. a short Python loop over the
fetched files), never by re-typing it. A damaged copy stops the render with a
"re-fetch" message.
After changing an mp3, run `python3 tests/test_stitch.py --write-embedded`.

## Contract

- FREE assembly: Playwright record + ffmpeg composite/mux + the bundled SFX. No
  AI-rendered text — the bubbles, rich-link title/domain, and end-card copy are
  all real HTML/PIL, never invented by a model.
- The recipe (DB) supplies the per-brand config: the `thread` (kept short — split
  long lines), the product image bound into the attachment, the `end_card`
  (prefer a real `logo_svg` wordmark), theme (the user's choice; dark if unset), and an optional
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

## Critical knowledge

1. **Never trim the capture by a clock guess.** `Date.now()` around `newContext()` put every
   sound a median 204 ms late (range -450..+236 ms) on the Graza audit run. The sync
   curtain + first-missing-frame trim fixed it; the curtain must be held ~600 ms or the
   screencast (it only emits frames on change) never records it.
2. **Measure each SFX file's onset.** `imessage-send.mp3` has 99 ms of lead-in; placing the
   file at the cue made the send sound late even with perfect video sync.
3. **The receive tone is ~1.4 s at full level.** Two received messages 0.75 s apart blurred
   into one sound until each sound was cut where the next begins.
4. **`scrollWidth` is not a text-bleed test.** Bubble tails are pseudo-elements that stick out
   by design; compare the text's Range box with the bubble box instead.
5. **Chromium on Windows/Linux draws Segoe/Noto emoji** and the render reads fake instantly.
6. **BSD `mktemp -t name`** (no XXXXXX) fails on GNU/Git Bash; use a template.
7. **Short threads were bottom-aligned** with an empty screen above; Messages top-aligns them.
8. **Sounds snap to the picture, not the plan.** The page fires on time, but the screencast
   delivered a tapback ~0.6 s late in one capture. `record-chat.js` now finds the frame where
   each bubble/reaction appears (changed-pixel count in the chat area) and moves its sound there.
9. **No push-in on the link.** It read as a camera move a phone recording can't make; removed.
10. **The generic badge end card looked the same for every brand.** Use the editorial layout
   with the brand's fonts (or named free stand-ins).
11. **Keep the receive chime; shorten it only when another message follows fast.** Its loud
    second note lands ~0.3 s in, so with two received messages ~0.8 s apart it rang just
    before the second bubble (Som Sleep). Cutting every chime to one note changed the tone
    everywhere and was rejected; `stitch.sh` now cuts only a chime followed within 1.3 s.
12. **Typed text must equal sent text.** Cumulative random keystroke sleeps overran the send,
    and the composer truncated long lines with an ellipsis. Keystrokes now run on an absolute
    seeded schedule ending at 90% of the window, the composer wraps like Messages, the caret
    follows the last character, and the render fails (`TYPED != SENT`) on any mismatch.
13. **Embed end-card fonts.** Loading Google Fonts live during capture failed intermittently;
    they are downloaded once (with retries), cached, and inlined as data URIs.
14. **Take end-card colours from the brand's live CSS variables**, not the product photo
    (Graza: `--color-background #F6E6D9`, `--color-text #3C422E`, `--color-brand #D1E030`).
15. **The mix was clipping** (-4.8 LUFS, peaks above 0 dBFS, limiter squashing every chime).
    Now ~-11.4 LUFS, peaks ~-1.2 dBFS.
16. **The real-time capture can stall under CPU load** (a sync marker missed; bubbles bunched
    by 637 ms). `record-chat.js` exits 4 when the marker is missing or any bubble is >250 ms
    off plan, and `render.sh` re-records up to 3 times.

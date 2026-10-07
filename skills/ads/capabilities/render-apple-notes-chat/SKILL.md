---
name: render-apple-notes-chat
description: Assemble an Apple Notes list video ad from a note + end-card JSON — a frame-accurate fake iPhone screen recording of a short list being typed into Apple Notes (character by character, key pops, blinking caret, the note scrolling up as it fills) crossfaded into a checklist end card (the note's picks as ticked rows, real product photos, logo, CTA, in the brand's colours and fonts), with an optional music bed. FREE assembly (Playwright + ffmpeg); the recipe supplies the per-brand note + end card and gates the paid music call to its own capability. The Apple Notes sibling of render-imessage-chat and render-chatgpt-chat. Use for the apple-notes format.
status: active
---

# render-apple-notes-chat

The free renderer for the **apple-notes** video ad format: someone types a short,
honest list into Apple Notes ("my chai cheat sheet", "chai for every mood") and
every line points to a real product. It ends on a checklist end card with the
products and the CTA. Deterministic Playwright + ffmpeg; no generative video of the
UI, so every typed character stays pixel-crisp.

Siblings: `render-imessage-chat` (a peer's reply is the punchline) and
`render-chatgpt-chat` (an AI answer is the punchline). Reach for this one when the
creative is **a list someone keeps for themselves**.

## Choices

The recipe asks these before any paid step; this renderer only draws what the config says.

- **`list_angle`** — what the list is (a "which one should I get" cheat sheet, one pick per
  personality, one per mood or moment, a routine, a gift guide). Sets `note.title`,
  `note.lines` and `end_card.head1/head2`.
- **`voice`** — how the writer types (lowercase and casual, tidy, deadpan). Sets the wording
  and capitalisation of `note.lines`.
- **`clock`** — the time on the status bar (a 2 AM list reads differently from a 9 AM one).
  Sets `note.status_bar.time`.
- **`music`** — the bed passed to `stitch.sh --music`, or none (silent).

Brand facts (logo, colours, fonts, product photos, CTA, claims) come from the brand kit.

## What it renders

1. **The note** (`record-notes.js`) — one PNG per visual state, each held for its own
   duration, concatenated into a 1080×1920 30fps MP4:
   - the note opens on its title with a blinking caret and the keyboard up;
   - each line types character by character at `type_seconds`, with a key pop on every
     letter, a darker space/return key, and a human rhythm (slower after spaces and
     punctuation);
   - between lines: return key, then `pre_pause_seconds` of blinking "thinking";
   - the note eases up so the caret never goes under the keyboard;
   - after `post_hold_seconds` the writer taps Done: the keyboard drops, the note
     settles back to the top and the whole list holds for `finish_hold_seconds`
     (default 2). With the keyboard up there is room for the title and about three
     lines, so without this the title and first lines have scrolled away by the
     end and the viewer never sees the list in one piece. `finish_hold_seconds: 0`
     keeps the old ending.
2. **The end card** (`render-end-card.js`) — a paper card slides and tilts in over the
   brand colour; the heading has a hand-drawn underline; each row's check draws in turn.
   Real product cut-outs sit above the rows; the logo (or a wordmark) and CTA pill sit below.
3. **The master** (`stitch.sh`) — ~0.3 s crossfade into the end card, music faded in and
   out and normalised to −14 LUFS (peaks ≤ −1.5 dBFS). No music → silent master.

## Run

```bash
cd scripts && npm install            # once — installs Playwright
npx playwright install chromium      # once
node record-notes.js    --config config.json --out-dir <work> --still-only   # free review stills
node record-notes.js    --config config.json --out-dir <work>                # → notes.mp4
node render-end-card.js --config config.json --out-dir <work>                # → endcard.png + endcard.mp4
bash stitch.sh --notes <work>/notes.mp4 --end <work>/endcard.mp4 \
     --out <work>/master.mp4 [--music <work>/music-bed.mp3]
```

`--still-only` writes `note-hook.png` (the opening frame), `note-still.png` (the last
typed frame) and `note-finish.png` (the whole list after Done) for the review, without
recording the video.

## Config

See `scripts/config.example.json`. Two blocks:

| Block | Fields |
|---|---|
| `note` | `title`, `lines[]` (`text`, `type_seconds`, `pre_pause_seconds`), `post_hold_seconds`, `finish_hold_seconds`, `status_bar` (`time`, `battery_pct`), `keyboard_state` |
| `end_card` | `head1`, `head2`, `underline` (a word in `head2`), `rows[]` (`label`, `value`; max 4), `products[]` (`src`, `h` = height %, `wide`), `logo` (file) or `wordmark`, `cta`, `fine_print`, `theme` (`bg`, `bg2`, `paper`, `ink`, `accent`, `label`), `fonts` (`heading`, `label` — Google Fonts family names), `seconds` |

Image paths are resolved relative to the config file. Pacing that reads well: ~1.6–2.8 s
per line (about 18 characters a second), 1.0 s before the first line, 0.55 s between
lines, 0.9 s before the last line.

## Contract

- FREE: Playwright frame capture + ffmpeg. No model draws text: the note, the end-card
  copy and the logo are real HTML and real files.
- `record-notes.js` refuses a line with an em or en dash (people don't type them in Notes)
  or over 80 characters.
- `render-end-card.js` refuses an end card with no rows or no logo/wordmark, and fails if the
  chosen fonts don't load.
- The Apple Notes chat body is the bundled `create-apple-notes-mockup` generator
  (`scripts/mockup/`), so this runs standalone with no sibling fetch.
- Requires **ffmpeg/ffprobe** on PATH, Node 18+, and Playwright Chromium.

## Gaps

- The phone UI uses the system font stack (`-apple-system`, SF Pro). It's exact on macOS;
  on Linux/Windows it falls back to the nearest sans.
- No typing sound effects: Notes is silent, and the chai test ads shipped with music only.
- Product photos must be clean cut-outs (transparent PNG). The recipe decides what to do
  when a product has none; this renderer only places what it's given.

## Self-QC (always /watch the master)

- The caret never sits under the keyboard; the note scrolls smoothly, never jumps.
- Every line is fully typed before the next return; no text is cut off.
- The end card: every check draws, nothing overlaps the logo or CTA, fonts are the brand's
  (not a fallback), the pad under the card matches `theme.bg`.
- Audio (if any) fades in and out; no clipping.

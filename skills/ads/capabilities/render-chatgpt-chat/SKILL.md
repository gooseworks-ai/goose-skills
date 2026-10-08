---
name: render-chatgpt-chat
description: Assemble a ChatGPT chat-reveal video ad from a thread + timeline JSON — one continuous Playwright recording of a ChatGPT mobile chat (user types with the iOS keyboard up → taps send → keyboard slides down + header cluster swaps in one beat → one gray loading dot → the assistant answer streams in word-by-word) crossfaded into a designed end card, with subliminal ChatGPT SFX and an optional ducked music bed. FREE assembly (Playwright + ffmpeg); the recipe supplies the per-brand thread + timeline + end-card config and gates the paid music call to its own capability. The ChatGPT sibling of render-imessage-chat. Use for the chatgpt-chat format.
status: superseded
superseded_by: phone-chat@1.1.4
---

> **Superseded:** the video kit now does this with the phone-chat part, version 1.1.4, in the parts folder of this repository. Every phone-chat style is a style file that draws the same screen frame by frame from the plan's scenes, with the original sounds, in the kit's browser. This atom stays, unchanged in behaviour, for skills outside the kit until they move; its scripts still run.

# render-chatgpt-chat

The free renderer for the **chatgpt-chat** video ad format — the "I just asked
ChatGPT…" creative, where someone asks ChatGPT a question and the *streamed
assistant answer is the punchline* (the brand surfacing as the natural response).
Deterministic Playwright + ffmpeg assembly; no generative video of the UI, so the
bubble text and streamed answer stay pixel-crisp.

This is the **ChatGPT sibling of `render-imessage-chat`**. Reach for this one when
ChatGPT is the more credible host for the answer; reach for iMessage when the
punchline is a peer's reaction in a DM. The template recipe (DB) supplies the
per-brand `thread` + `timeline` + `end_card` config and gates the paid music call
(music bed → `create-music-elevenlabs`) to its own capability.

## Choices

The recipe asks these before any paid step; this renderer only draws what the config says. The
demo's value is an example, never a default:

- **`question_angle`** — the kind of question (symptom "why is this happening", how-to,
  recommendation, comparison). Sets the `user-text` message, the matching `composer-type` text
  in the timeline, and the `assistant` answer. Demo: a "why is my stomach so bloated at 47?"
  symptom question.
- **`asker`** — whose voice the question is in (the core customer, a busy parent, a
  first-timer, a skeptic). Sets the `user-text` wording + `keyboard.suggestions`. Demo: a woman
  in perimenopause.
- **`product_in_thread`** — whether a real product photo appears in the chat after the answer.
  Demo: no (text only; the product lands on the end card). The mockup has a `user-image`
  message type but no assistant-side image yet — a product image after the answer is a gap.
- **`music`** — the bed passed to `stitch.sh --music` (or none → SFX only). Demo: an
  instrumental bed.

## What it renders

One continuous take — never scene-by-scene (every reload flickers):

1. **User types** in the composer with the iOS keyboard up (`composer-type`).
2. **Send-tap is ONE beat** — the user bubble pops, the keyboard slides down, and
   the header right-cluster swaps (`personPlus/dottedCircle` → `edit/more`) all on
   the same `t`. Never sequence them across frames.
3. **One gray loading dot** holds ~500ms (never three — three reads as iMessage
   typing, wrong app), silently (no SFX on the dot).
4. **The assistant answer streams in word-by-word** (`stream-words`, ~7 wps) with a
   soft opacity ramp; the conversation auto-scrolls to keep it in view.
5. **Crossfade to a designed end card** (wordmark + ⭐ proof row + trust trio + CTA
   pill) and **mux a ducked music bed** → master MP4.

The chat records at the ChatGPT-native **~9:19.5 (default 750×1624)** to match a real
iPhone screen recording. **Never stretch the chat to a different aspect ratio** — the
end card is scaled-to-fit + padded to the chat's dimensions in stitch, so the chat
is never touched.

## Run

```bash
cd scripts && npm install            # once — installs Playwright
npx playwright install chromium      # once
node record-chat.js     --config config.json --out-dir <work>   # → master-chat.mp4 + .sfx.json
node render-end-card.js --config config.json --out-dir <work>   # → scene-end-endcard.mp4
bash stitch.sh --chat <work>/master-chat.mp4 --end <work>/scene-end-endcard.mp4 \
     --sfx <work>/master-chat.sfx.json --out <work>/master-final.mp4 \
     --pad-color "#ffffff" [--music <work>/music-bed.mp3] [--also-1x1]
```

1. **`record-chat.js`** — reads `config.json` (`thread` + `timeline` + geometry),
   renders the bundled `create-chatgpt-mockup` HTML once with every message
   pending, walks the timeline on `requestAnimationFrame` inside the page, records
   it as one continuous MP4, and emits the deterministic SFX cue list.
2. **`render-end-card.js`** — fills `end-card.template.html` from `config.end_card`
   (wordmark/`logo_svg`, stars, proof, trust trio, CTA, colors) → still MP4. This is
   the SAME generic end card as `render-imessage-chat` (copied verbatim).
3. **`stitch.sh`** — normalizes the end card to the chat's dimensions, crossfades
   chat → end card, layers the subliminal ChatGPT SFX, optionally ducks a music bed
   under it, and optionally derives a 1:1 crop. All FREE ffmpeg. Pass
   `--pad-color` = `end_card.bg` (default `#ffffff`, ChatGPT light mode) so the pad
   under the end card is seamless.

## The chat body: bundled create-chatgpt-mockup

The ChatGPT chat HTML comes from **`create-chatgpt-mockup`** (its `generate.js` +
`templates/` produce the light-mode ChatGPT iOS HTML — status bar, header, message
rows, streaming word-spans, composer, and the inline iOS keyboard). Those files are
**bundled into `scripts/mockup/`** so this capability renders the chat body
**standalone** — no sibling fetch of `create-chatgpt-mockup` is required. `record-chat.js`
does `require('./mockup/generate.js')`.

The keyboard is inlined by the mockup (`renderKeyboard`) — no separate keyboard atom.

## Timeline events (consumed by record-chat.js)

| Kind | Meaning |
|---|---|
| `composer-type` | `{ text, dur_sec }` — type into the composer. SFX = one key-tap per word. |
| `composer-clear` | Wipe the composer instantly (fire at send-tap). |
| `keyboard-show` / `keyboard-hide` | Slide the iOS keyboard up / down. |
| `send-tap` | Pulse the send button. SFX = send-tap. |
| `pop` | `{ target: <msg-id> }` — reveal a message row. |
| `header-swap` | `{ value: "alt" }` — swap the header right-cluster. |
| `loading-dot-show` / `loading-dot-hide` | `{ target: <dot-id> }` — the single gray dot. |
| `send-state` | `{ value: "streaming"\|"active" }` — composer send-button state. |
| `stream-words` | `{ target, dur_sec, wps }` — reveal the assistant answer word-by-word. SFX = stream-tick every 12 words + response-done at the end. |
| `scroll-to` | `{ target, dur_ms }` — smooth-scroll a row into view. |

See `scripts/config.example.json` for the canonical thread + timeline (the "one
beat" send-tap and the streamed list answer are both wired there).

## Contract

- FREE assembly: Playwright record + ffmpeg composite/mux + the bundled SFX. No
  AI-rendered text — the bubbles, the streamed answer, and the end-card copy are all
  real HTML/PIL, never invented by a model.
- The recipe (DB) supplies the per-brand config: the `thread` (light-mode ChatGPT,
  assistant message set `stream: true`), the `timeline`, the `end_card` (prefer a
  real `logo_svg` wordmark), and an optional music bed.
- SFX are **subliminal by design** (ChatGPT has no native chime): key-tap -28dB,
  send-tap -20dB, stream-tick -32dB, response-done -22dB, and **never a cue on the
  loading dot**. Set `"sfx": false` in the config to ship the chat silent.

## Gaps / routing notes

- **Music bed** is an input, not generated here — the recipe gates it to
  `create-music-elevenlabs` (paid, proxy-routed, billed to the Ads agent) and passes
  the file into `stitch.sh --music`.
- **Bundled SFX are synthesized stand-ins.** The original four wavs
  (`key-tap`/`send-tap`/`stream-tick`/`response-done`) were lost from Git LFS (the
  objects 404 on the server), so `assets/sfx/*.wav` are freshly synthesized
  subliminal clicks/ticks. They work as-is; swap in real wavs (same filenames) for
  tuned SFX.
- **Portability:** everything runs from the fetched
  `/tmp/gooseworks-scripts/render-chatgpt-chat/scripts/…` — the chatgpt-mockup
  generator + templates are bundled under `scripts/mockup/`, and the generic end
  card is bundled under `scripts/`. No `/Users/…` or repo-relative paths, and no
  required sibling fetch.
- Requires **ffmpeg/ffprobe** on PATH and Playwright Chromium (`npx playwright
  install chromium`).

## Self-QC (per project rule — always /watch the master)

- Keyboard is up the whole time the user types, and slides down only on the
  send-tap beat (never visible while the answer streams).
- Send-tap is one beat: user bubble + keyboard-down + header-swap on the same frame.
- Exactly one gray loading dot for ~500ms (not three), and no SFX on the dot.
- The answer streams word-by-word, left-to-right / top-to-bottom, not all-at-once.
- No OpenAI spiral logo above any assistant title (the spiral is empty-state only).
- No micro-flicker / scene cuts; the end-card pad color matches `end_card.bg`.

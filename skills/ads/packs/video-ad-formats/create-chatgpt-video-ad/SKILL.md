---
name: create-chatgpt-video-ad
description: Produce a 9:16 social-native ad that recreates a ChatGPT mobile chat — user types in the composer with the iOS keyboard visible, taps send, keyboard slides down, header right-cluster swaps (personPlus/dotted → edit/more), one gray loading dot appears, then the assistant response streams in word-by-word with a soft opacity ramp. Continuous Playwright recording, subtle SFX (key-tap / send-tap / stream-tick / response-done), assembled into a master MP4 plus 9:16 / 1×1 exports. No music bed and no end card by default.
---

# create-chatgpt-video-ad

Use this skill when an ad concept calls for an authentic ChatGPT mobile chat: someone asks ChatGPT something, the response streams in, and the *content of the response* is the punchline (the brand answer, a surprising bullet list, a recommendation). It's the "I just asked ChatGPT…" creative format.

## Purpose

Animate a ChatGPT mobile conversation into a 9:16 social-native video ad where the *streamed assistant response is the punchline* — the brand surfacing as the natural answer to "I just asked ChatGPT…". The molecule composes the `create-chatgpt-mockup` renderer (driven via Playwright) with the `stitch-videos-ffmpeg` assembly step to choreograph the full beat: the user types in the iOS composer with the keyboard up, taps send (bubble pops + keyboard slides down + header right-cluster swaps in one frame), a single gray loading dot holds ~500ms, then the assistant answer streams in word-by-word with a soft opacity ramp. Everything is captured as ONE continuous Playwright recording (no scene cuts / micro-flicker), assembled into a master MP4 plus 9:16 and 1×1 exports. It is the ChatGPT-host sibling of `create-imessage-video-ad`: reach for this one when ChatGPT is the more credible host for the answer; reach for the `create-chatgpt-mockup` atom directly when you only need a still screenshot rather than the typing + streaming + auto-scroll choreography animated to video. By default the molecule ships **silent** — the recorder emits an empty SFX cue list and stitch passes the video straight through; the four bundled SFX wavs and the cue-derivation logic exist for an optional subliminal pass (see Critical knowledge #4).

## When to use

- "Ask ChatGPT" → punchline-as-response ads (brand wins by being the natural answer)
- Anything you'd build with the `create-imessage-video-ad` molecule but where ChatGPT is the more credible host
- Recreating a real ChatGPT screenshot as a video, with the streaming animation that makes it read as live

If the brief just needs a still ChatGPT screenshot, reach for the atom `create-chatgpt-mockup` directly. Use *this* molecule only when you need the **typing + streaming + auto-scroll choreography animated to video**.

## Composed Atoms

- `create-chatgpt-mockup` — renders the light-mode ChatGPT iOS HTML (`renderHTML(thread)`); this molecule loads it once with every message `popState: "pending"` and drives the reveal via Playwright. (`create-chatgpt-mockup`)
- `render-ios-keyboard` — the iOS QWERTY keyboard fragment (suggestion bar + alpha/shift/backspace/123/space/return rows) that gets mounted at the bottom of the stage and slid up on `keyboard-show` / down on `keyboard-hide`. The chatgpt-mockup atom inlines this same `.kbd` block, so the molecule slides it via `data-state` rather than importing it separately. (`render-ios-keyboard`)
- `stitch-videos-ffmpeg` — the assembly/ffmpeg step (`edits/stitch.sh`) that takes the silent `master-chat.mp4`, layers the deterministic `master-chat.sfx.json` cue list (when cues exist) over the four bundled SFX wavs, and muxes/exports `master-final.mp4`. (`stitch-videos-ffmpeg`)

## Inputs

1. **`brief`** (required) — what the ad is selling, the question the user types, the response ChatGPT gives
2. **`output_folder`** — usually `<brand>/ads/video-NN-chatgpt-<slug>/`
3. **`thread`** — JSON matching the create-chatgpt-mockup schema, **with these animation extensions**:
   - Each `messages[].id` must be set so the timeline can reference it
   - Each `messages[].popState` defaults to `"pending"` (hidden); the driver flips it to `"now"` at the right t
   - The assistant message should set `stream: true` so its body words are wrapped in `<span class="word" data-stream="0">`
   - `header.rightIconsAlt` is the active-chat alt cluster (typically `["edit", "more"]`)
   - `keyboard: { layout: "qwerty-lower", suggestions: ["I","The","I'm"], state: "shown" }` mounts the keyboard
4. **`timeline`** — array of events; see "Timeline" below

## Critical knowledge — read before producing your first ad

### 0. Continuous recording, not scene-by-scene

Same rule as the iMessage molecule. Render the full HTML once with all messages pending, walk a `TIMELINE` on `requestAnimationFrame` inside the page, and record the whole thing as ONE Playwright session. Do not concat scene clips — every page reload causes a micro-flicker at the cut.

### 0.5. 9:19.5, not 9:16

The atom renders at **750×1624** (ratio 0.461) which matches iPhone 14/16 Pro screen recordings. The older 9:16 ratio (750×1334) reads as proportionally squat next to a real iPhone capture — the keyboard dominates and the chat zone feels stubby. When uploading via `upload-ad-sample`, tag as `9:16` (Meta accepts both; no transcode needed).

### 1. Word streaming, not character-by-character

Real ChatGPT streams **words** with a 200ms opacity+blur ramp on each. The atom's `wrapWordsForStreaming` pre-wraps every visible word in a span; the driver flips `data-stream="1"` on a schedule. Default cadence: **7 words/sec** (~140ms between word reveals). Slow it down for short responses, speed up for very long ones.

### 2. The header cluster swap is part of the send-tap, not separate

The frame that the user bubble lands in is also the frame the header right-icons swap and the keyboard starts sliding down. Three things in one beat. Pulling them apart over multiple frames reads as glitchy.

### 3. The loading dot is ONE dot, not three

Real ChatGPT shows a single small dark-gray solid dot below the user bubble for ~500ms before the response starts streaming. Three dots would read as iMessage typing — wrong app.

### 4. SFX are felt, not heard

This is the inverse of the iMessage rule. iMessage SFX are the Apple chime — they're a feature. ChatGPT has no native SFX, so anything we play has to be **subliminal**. The pre-bundled levels are:

| Cue | Level | Where it sits |
|---|---|---|
| `key-tap` | -28 dB | Once per word (not per char — too busy) during composer typing |
| `send-tap` | -20 dB | On the `send-tap` event only |
| `stream-tick` | -32 dB | Every ~12 words during streaming, as a "still working" pulse |
| `response-done` | -22 dB | After the final word of the response lands |

No music bed by default. If the brief asks for one, lofi at -18dB.

### 5. No SFX on the loading dot

The dot is a silent state change. Same rule as the iMessage typing-pop — adding a "thinking" sound makes the chat feel fake. Skip it.

### 6. The keyboard slide and bubble pop are choreographed

When the user taps send: the bubble pops in (220ms), the keyboard starts sliding down (280ms), the composer rides up by -518px (the keyboard's height) over the same 280ms. The slide and the bubble overlap — the bubble lands fully visible just before the keyboard finishes hiding. Don't sequence them — let them run concurrently.

## Timeline

The driver consumes an array of events. Each event has `{ t: <seconds>, kind, target?, value? }`.

| Kind | Meaning | Notes |
|---|---|---|
| `composer-type` | Type chars over a duration | `{ text, dur_sec }`. Caret remains visible. SFX = one key-tap per word boundary. |
| `composer-clear` | Wipe composer text instantly | Used after send-tap |
| `keyboard-show` | Set keyboard `data-state="shown"` + stage `data-keyboard-shown="1"` | CSS handles the slide |
| `keyboard-hide` | Set keyboard `data-state="hidden"` + clear `data-keyboard-shown` | CSS handles the slide |
| `send-tap` | Pulse send button (scale 0.9 → 1.0 over 120ms) | SFX = send-tap |
| `pop` | Flip a row from `data-pending="1"` → `pop-now` class | `{ target: <msg-id> }` |
| `header-swap` | Set header `right[data-active]` to `"primary"` or `"alt"` | `{ value: "alt" }` |
| `loading-dot-show` | Pop the loading-dot row | `{ target: <dot-id> }` |
| `loading-dot-hide` | Hide the loading-dot row | `{ target: <dot-id> }` |
| `send-state` | Switch composer send button class to `disabled / active / streaming` | `{ value: "streaming" }` |
| `stream-words` | Reveal an assistant message word-by-word | `{ target: <msg-id>, dur_sec, wps?: 7 }`. SFX = stream-tick every 12 words, response-done at the end. |
| `scroll-to` | Smooth-scroll the conversation so a target row's bottom aligns with the visible-area bottom | `{ target: <msg-id>, dur_ms: 250 }` |

Pacing for the canonical example (Q="Hey what's happening in this app?", short list response):

```
t=0.0   keyboard-show
t=0.5   composer-type   text="Hey what's happening in this app?"  dur_sec=2.4
t=3.2   send-tap
t=3.20  pop             target=msg-user-1
t=3.20  composer-clear
t=3.20  header-swap     value="alt"
t=3.20  keyboard-hide
t=3.20  send-state      value="streaming"
t=3.55  loading-dot-show target=dot-1
t=4.10  loading-dot-hide target=dot-1
t=4.10  pop             target=msg-assistant-1
t=4.15  stream-words    target=msg-assistant-1  dur_sec=6.0  wps=7
t=4.50  scroll-to       target=msg-assistant-1
t=10.5  send-state      value="active"
```

Total: ~11s. Pad with a 1s hold at the end so the response can breathe before the cut.

## Workflow

### State 0 — Compose `thread.json`

```json
{
  "statusBar": { "time": "9:41" },
  "header": {
    "style": "plain-title",
    "title": "ChatGPT",
    "rightIcons":    ["personPlus", "dottedCircle"],
    "rightIconsAlt": ["edit", "more"]
  },
  "keyboard": { "layout": "qwerty-lower", "suggestions": ["I", "The", "I'm"], "state": "hidden" },
  "messages": [
    { "type": "user-text", "id": "msg-user-1", "text": "Hey what's happening in this app?", "popState": "pending" },
    { "type": "loading-dot", "id": "dot-1", "popState": "pending" },
    {
      "type": "assistant",
      "id": "msg-assistant-1",
      "stream": true,
      "popState": "pending",
      "feedback": false,
      "text": "Could you tell me what you mean by \"this app\"?\n\nIf you're referring to the ChatGPT app itself, I can explain:\n\n* How conversations work\n* Memory and personalization\n* Tools (web search, calendars, email, file analysis, image generation, etc.)\n* Why certain UI elements appear\n* What data is saved vs. not saved\n* How tasks/reminders work"
    }
  ],
  "composer": { "placeholder": "Ask ChatGPT" }
}
```

### State 1 — Record

```bash
NODE_PATH=<repo>/create-chatgpt-mockup/node_modules \
  node clips/record-master.js
```

Writes `master-chat.mp4` (no audio) and `master-chat.sfx.json` (the deterministic SFX cue list).

### State 2 — Stitch SFX onto the video

```bash
bash edits/stitch.sh
```

Consumes `master-chat.sfx.json` and the four SFX wavs in `assets/sfx/`. Writes `master-final.mp4`.

### State 3 — Export variants

**HARD RULE: never export a width×height whose ratio differs from the master's 750:1624
(≈0.4618).** `scale=1080:1920` (16:9) on this format stretches the UI ~22% horizontally —
this shipped once (2026-06-11, Alitu) and reads as "fat" iPhone chrome immediately. The
9:16-tagged deliverable is either the native master or an aspect-true upscale; only the 1×1
crop changes shape (by cropping, never by scaling).

```bash
# 9:16-tagged deliverable — aspect-true upscale (1080×2338 keeps 750:1624 exactly).
# Shipping the native 750×1624 master unscaled is equally fine.
ffmpeg -y -i edits/master-final.mp4 -vf "scale=1080:-2:flags=lanczos" \
  -c:v libx264 -pix_fmt yuv420p -c:a copy -movflags +faststart \
  meta-upload/master-9x16-1080.mp4

# 1×1 — CROP a square from the master (centered on the chat zone; adjust y to
# frame the response), then upscale. Cropping changes shape legitimately; scaling must not.
ffmpeg -y -i edits/master-final.mp4 -vf "crop=750:750:0:437,scale=1080:1080:flags=lanczos" \
  -c:v libx264 -pix_fmt yuv420p -c:a copy -movflags +faststart \
  meta-upload/master-1x1-1080.mp4
```

### State 4 — Self-QC with /watch

Per project rule (`CLAUDE.md` #3), always `/watch:watch master-final.mp4` and confirm:
- Keyboard is visible the whole time the user is typing
- Send tap → bubble + keyboard-down + header-swap happen in one beat
- One gray dot for ~500ms (not three)
- Words fade in left-to-right, top-to-bottom
- No OpenAI spiral logo appears before any assistant message title (the spiral only belongs in the empty-state hero — `renderAssistant` should not emit it)
- No SFX on the loading dot
- No micro-flicker / scene cuts

## Output

```
<output_folder>/
  thread.json                 # the script as data
  clips/
    record-master.js          # adapted from this skill's template
    master-chat.mp4           # ~12s continuous chat recording (silent)
    master-chat.sfx.json      # deterministic SFX cue list
  edits/
    stitch.sh                 # adapted from this skill's template
    master-final.mp4          # 750×1624 (native ~9:19.5), h.264
  meta-upload/
    master-9x16-1080.mp4      # 1080×2338 aspect-true upscale (or ship the native master)
    master-1x1-1080.mp4       # square CROP of the master, then upscale
```

## Quality Checks

Run these before declaring the ad shippable. Most map directly to the State 4 `/watch:watch` pass above.

- [ ] **One continuous take** — no scene-by-scene boundaries or micro-flicker anywhere in the chat; the whole thing is a single Playwright recording (`master-chat.page.html` rendered once, timeline walked on `requestAnimationFrame`).
- [ ] **Keyboard is up the entire time the user is typing** and only slides down on the send-tap beat. It must never be visible while the assistant response is streaming (`keyboard-hide` fires at the same `t` as `send-tap`).
- [ ] **Send-tap is one beat, not three** — the user bubble pop, the keyboard slide-down, and the header right-cluster swap (`personPlus/dottedCircle` → `edit/more`) all land on the same frame. Pulling them apart reads as glitchy.
- [ ] **Exactly one gray loading dot** holds for ~500ms before streaming — not three (three dots reads as an iMessage typing indicator, wrong app), and no SFX on the dot (silent state change).
- [ ] **Response streams word-by-word**, left-to-right then top-to-bottom, with the soft opacity ramp — never character-by-character and never all-at-once (the assistant message has `stream: true` so the atom pre-wraps every word in a `.word[data-stream]` span).
- [ ] **Conversation auto-scrolls** so the streaming response stays in view — a `scroll-to` after the assistant pop and a mid-stream scroll around the halfway mark.
- [ ] **No OpenAI spiral logo** appears above any assistant message title (the spiral belongs only to the empty-state hero).
- [ ] **Master dimensions are 750×1624** (modern iPhone Pro ~9:19.5 — the atom's native viewport with `deviceScaleFactor: 2`), h.264, and the 9:16 / 1×1 variants are present under `meta-upload/`. Confirm with `ffprobe -v error -show_entries stream=width,height -of default=nw=1 edits/master-final.mp4`.
- [ ] **Every export preserves the master's aspect ratio** (w/h ≈ 0.4618; the 1×1 crop is the only legitimate shape change). `ffprobe` each file under `meta-upload/` and do the division — a 1080×1920 output from this format is ALWAYS a horizontal stretch (live incident 2026-06-11, Alitu).
- [ ] **Audio matches the intent.** By default the molecule is **silent**: `master-chat.sfx.json` contains `{"cues": []}` and `master-final.mp4` is a stream-copy of the silent master (no audio track is expected). If you opted into the subliminal SFX pass, every cue must sit at the bundled level (key-tap -28dB, send-tap -20dB, stream-tick -32dB, response-done -22dB), with **no cue on the loading dot**, and audio should peak at 0dB after stitch's `volume=2.5,alimiter` pass.

## Failure Modes

| Symptom | Cause | Fix |
|---|---|---|
| Keyboard visible during streaming | Forgot `keyboard-hide` at send-tap | Add the event at the same t as `send-tap` |
| Keyboard half-clipped at bottom of stage | Translated the composer up by a hardcoded pixel value that didn't match the keyboard's actual rendered height | Use the apple-notes `.kbd` pattern: keyboard is `position: absolute; bottom: 0; transform: translateY(0\|100%)`; composer rides above it via `position: absolute; bottom: 498px` when the stage has `data-keyboard-shown="1"`. Don't reinvent keyboard layout — port the working pattern. |
| Header right-cluster doesn't swap | `rightIconsAlt` missing in thread.json | Add `header.rightIconsAlt` array |
| Assistant text appears all at once | Forgot `stream: true` on the assistant message | Set it; the atom wraps words for you |
| Edits to `working/thread.json` don't take effect | Recorder reads `thread.json` from the *project root*, not from `working/` | Either copy both `thread.json` and `timeline.json` to the project root after every edit, or use the `resolveSpec` fallback shipped in the template (root → working/) |
| SFX too loud | Default levels were overridden | The bundled wavs are pre-normalized; if you must adjust, do it in stitch.sh, not by re-recording |
| Bubble pops in but conversation doesn't scroll | Skipped `scroll-to` events | Add a scroll-to after every pop and again at the end of stream-words |
| Loading dot still visible after response starts | Forgot `loading-dot-hide` | Add it at the same t as the assistant pop |
| Micro-flicker between scenes | Recorded scene-by-scene with reloads | Use the single-session pattern in `scripts/record-master.template.js` — same architecture as the iMessage molecule |
| UI looks horizontally fat / stretched | Export forced 1080×1920 (16:9) onto the 750×1624 (~9:19.5) master | Aspect-true export only: ship native or `scale=1080:-2` (→1080×2338); never scale to a different ratio (State 3 hard rule) |

## Decision Rules

- Use this molecule when you need the **typing + streaming + auto-scroll choreography animated to video**; for a single still ChatGPT screenshot, use the `create-chatgpt-mockup` atom directly.
- **Host choice:** pick ChatGPT (this molecule) over `create-imessage-video-ad` when the punchline is the *answer to a question* and ChatGPT is the credible source of that answer; pick iMessage when the punchline is a *peer's reaction/discovery* in a DM.
- **Record once, never scene-by-scene** — render the full thread with every message `popState: "pending"` and walk the timeline inside the page; every page reload introduces a cut/flicker.
- **Stream words, not characters** — set `stream: true` on the assistant message and pace at ~7 words/sec (`stream-words` `wps`), slowing for short responses and speeding up for long ones; ChatGPT does not reveal text char-by-char.
- **The send-tap is one frame** — fire `pop` (user bubble), `composer-clear`, `header-swap value="alt"`, `keyboard-hide`, and `send-state value="streaming"` all at the send-tap `t`; never sequence them across frames.
- **One loading dot, ~500ms, silent** — use a single `loading-dot` row (never three), and never attach SFX to it.
- **SFX are subliminal or absent** — ship silent by default (empty cue list, stitch stream-copies the video). Only opt into the bundled key-tap / send-tap / stream-tick / response-done wavs at their pre-normalized levels; add a music bed (lofi, -18dB) only if the brief explicitly asks.
- **Tag the export as `9:16`** even though it records at 750×1624 (~9:19.5) — Meta accepts both and needs no transcode. If you upscale, preserve the ratio (`scale=1080:-2`); **never export 1080×1920 from this format** — that's a horizontal stretch, not a resize.
- **Keep `thread.json` and `timeline.json` in sync at the project root** (or rely on the template's `resolveSpec` root→`working/` fallback); the recorder reads them from the project root, so a stale root copy silently wins over a `working/` edit.

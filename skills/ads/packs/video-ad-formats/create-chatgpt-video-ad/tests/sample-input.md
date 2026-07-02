# Sample input — create-chatgpt-video-ad

The molecule consumes two JSON files at the project root: a `thread.json` (the
ChatGPT screen as data, matching the `create-chatgpt-mockup` schema with
animation extensions) and a `timeline.json` (the event schedule the recorder
walks). See the canonical pair in `examples/smoke-app-question/`.

## `thread.json` — the screen as data

`examples/smoke-app-question/thread.json` recreates a ChatGPT iOS chat: a user
asks "Hey what's happening in this app?" and the assistant streams a short
bulleted explanation.

Schema highlights (extensions over the `create-chatgpt-mockup` atom in **bold**):

- `statusBar.time` — clock in the status bar (e.g. `"9:41"`).
- `header` — `{ style: "plain-title", title: "ChatGPT", rightIcons, rightIconsAlt }`.
  **`rightIconsAlt`** is the active-chat cluster swapped in on send-tap (typically
  `["edit", "more"]`).
- **`keyboard`** — `{ suggestions: ["I","The","I'm"], state: "hidden", id: "kb" }`
  mounts the iOS QWERTY keyboard at the bottom of the stage; the driver slides it
  via `data-state`.
- `messages[]` — each carries an **`id`** (so the timeline can target it) and a
  **`popState`** (defaults to `"pending"` = hidden until the driver pops it):
  - `{ type: "user-text", id: "msg-user-1", text }` — the typed question.
  - `{ type: "loading-dot", id: "dot-1" }` — the single gray "thinking" dot.
  - `{ type: "assistant", id: "msg-assistant-1", `**`stream: true`**`, feedback: false, text }`
    — the answer; `stream: true` makes the atom wrap every word in a
    `.word[data-stream="0"]` span so the driver can reveal them one at a time.
    `text` may contain `\n\n` paragraphs and `* ` markdown bullets.
- `composer.placeholder` — the composer pill text (`"Ask ChatGPT"`).

## `timeline.json` — the event schedule

`examples/smoke-app-question/timeline.json` is an array of
`{ t: <seconds>, kind, target?, value?, ... }` events. The canonical flow (~11s):

```
t=0.0   keyboard-show
t=0.6   composer-type   text="Hey what's happening in this app?"  dur_sec=2.4
t=3.2   send-tap
t=3.20  pop             target=msg-user-1
t=3.20  composer-clear
t=3.20  header-swap     value="alt"
t=3.20  keyboard-hide
t=3.20  send-state      value="streaming"
t=3.55  loading-dot-show target=dot-1
t=4.10  loading-dot-hide target=dot-1
t=4.10  pop             target=msg-assistant-1
t=4.20  stream-words    target=msg-assistant-1  dur_sec=6.5  wps=7
t=4.50  scroll-to       target=msg-assistant-1  dur_ms=250
t=10.8  send-state      value="active"
```

The send-tap beat (everything at `t=3.20`) is deliberately one frame: bubble pop
+ composer clear + header swap + keyboard slide-down + send-state all together.

## To customize for a real brand

Swap the user `text` (the question), the assistant `text` (the answer that is the
punchline), and re-pace the `composer-type` and `stream-words` durations to match
their lengths. Everything else — the recorder, the stitch, the SFX wavs — stays
as-is. Output usually lands in `<brand>/ads/video-NN-chatgpt-<slug>/`.

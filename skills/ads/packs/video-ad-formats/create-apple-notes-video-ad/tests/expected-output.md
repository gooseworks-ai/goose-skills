# Expected output

For the canonical `examples/full-note.example.json`:

| File | Dim / dur | What you'll see |
|---|---|---|
| `clips/master-typing.mp4` | 1180×2556 / ~8.9s | Title + pre-typed paragraph visible at t=0. At t≈0.3s the cursor appears at the start of paragraph 2. Three typed paragraphs progressively fill in, finishing mid-word `how th\|`. |
| `clips/master-typing.sfx.json` | — | 78 cues (one per character + one per inter-paragraph return), all named `kb-tick`, `kb-space`, or `kb-return`. |
| `clips/end-card.mp4` | 1180×2556 / 3.5s | Light-mode end card: large bold "your brand" wordmark, gray tagline, yellow FREEDEMO pill, "use code at checkout" subtext. Static, no Ken-Burns. |
| `edits/master-final.mp4` | 1180×2556 / ~12s | Typing video → 300ms crossfade → end card. Audio: anywhere music+ticks line up; if no music supplied, just the 78 ticks. Peaks at 0dB. |
| `meta-upload/master-9x16-1080.mp4` | 1080×1920 / ~12s | Same content, scaled and center-cropped for social delivery. Keyboard fully visible; status bar partially cropped. |

Visual identity checks (eyeball any frame of `master-typing.mp4`):

- Title "Hello" is bold but NOT heavy (matches the atom's `font-weight: 700` after the v0.2 tuning).
- Yellow `#FFCC00` cursor sits flush at the end of the currently-typing paragraph; only one cursor visible at a time.
- Smart curly `'` in `Let's` and `I'm`.
- Lowercase `this` and `how` get yellow underlines after typing finishes; capital `This` does NOT (case-sensitive).
- No Dynamic Island at top.
- Bigger status-bar / toolbar / format-toolbar icons (v0.2 tuning).
- Keyboard keys rounded (border-radius 18px), well-spaced (18px gap), height 118px.

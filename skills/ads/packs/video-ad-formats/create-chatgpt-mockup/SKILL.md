---
name: create-chatgpt-mockup
description: Render pixel-accurate ChatGPT mobile (iOS) screen mockups in light mode from a thread JSON. Supports user text bubbles, user image attachments, assistant markdown prose, citation chips, the OpenAI spiral logo, the Apps-SDK GPT chip in the composer, and three header styles (model-tag, plain title, "Get Plus"). Fixed 9:16 viewport. Outputs HTML + PNG.
---

# create-chatgpt-mockup

## Purpose

Generate single-frame ChatGPT mobile screens that read as real iOS captures — accurate header chrome, user/assistant message styling, composer pill, status bar, and the OpenAI spiral mark. Designed for use inside ad creatives, social posts, video storyboards, and product mockups.

If you need an **animated, video-recorded chat reveal** (bubbles popping over time, SFX, music bed, end card), use the molecule `skills/molecules/create-chatgpt-video-ad`. This atom only produces a single still frame.

## Inputs

Compose a `thread.json` matching the schema below, then pass it to `render.js`.

### Thread JSON schema

```json
{
  "statusBar": {
    "time": "9:41",
    "dnd": false
  },
  "header": {
    "style": "model-tag",
    "title": "ChatGPT",
    "model": "5.1",
    "rightIcons": ["personPlus", "dottedCircle"]
  },
  "messages": [
    { "type": "user-image", "src": "assets/photo.jpg", "aspect": "square" },
    { "type": "user-text",  "text": "Make this face sunscreen better" },
    {
      "type": "assistant",
      "title": "Optional H1 with spiral logo",
      "feedback": true,
      "text": "Markdown-ish prose. **bold**, *italic*, ## H2, * bullet, 1. ordered, [[cite:Source +1]], [[icon:💡]] inline-icon."
    }
  ],
  "composer": {
    "placeholder": "Ask anything",
    "text": "Typed text to show with caret",
    "cursor": true,
    "streaming": false,
    "chip": { "name": "SeatGeek" }
  }
}
```

### Field reference

**`statusBar`**
- `time` — string shown top-left (e.g. `"9:41"`, `"08:18"`).
- `dnd` — when `true`, renders a small moon glyph next to the time (matches iOS Focus-on indicator).

**`header.style`** — one of:
- `"model-tag"` — `≡   ChatGPT 5.1 ▾   ●●` — used when a specific model is active.
- `"title-only"` — `≡   ChatGPT ›   ●●` — the plain in-chat header.
- `"plain-title"` — `≡   Get Plus ✦   ●●` — for the upsell/empty-state title.

**`header.rightIcons`** — array of icon keys, rendered left-to-right on the right side. Available: `"personPlus"`, `"dottedCircle"`, `"edit"`, `"more"`. Default is `["personPlus", "dottedCircle"]` for `model-tag`, `["edit"]` for `title-only`.

**`messages[]`** — one of:
- `{ "type": "user-image", "src": <path>, "aspect": "square"? }` — relative `src` paths resolve against the thread.json directory.
- `{ "type": "user-text", "text": <string> }` — right-aligned soft-gray bubble.
- `{ "type": "assistant", "text": <markdown>, "title"?: <string>, "feedback"?: <bool> }` — left-aligned plain prose. If `title` is set, an OpenAI spiral logo + bold title is rendered above the body. `feedback: false` hides the thumbs-up/down chips.

**Assistant `text` markdown** — supported syntax:
- `**bold**`, `*italic*`
- `# H1`, `## H2`, `### H3`
- `* item` / `- item` bullet lists
- `1. item` ordered lists
- `---` horizontal rule
- `[[cite:Some Source +1]]` — pill citation chip
- `[[icon:💡]]` — inline emoji prefix (kept un-escaped)
- Single `\n` → soft line break (`<br>`); double `\n\n` → new paragraph

**`composer`**
- `placeholder` — shown when `text` is empty (default `"Ask anything"`).
- `text` — typed-in text. When present, the send button activates (black bg).
- `cursor` — whether to render the blinking caret after `text` (default `true`).
- `streaming` — when `true`, replaces the send arrow with a stop square (matches "response generating" state).
- `chip` — optional GPT chip in the composer. `chip.name` is the GPT name. Sets `placeholder` to `"Ask ChatGPT"` if you don't override it.

## CLI

```bash
node render.js --thread examples/01-sunscreen-image.json
node render.js --thread my-thread.json --output ./exports --name nightly
```

### Flags

| Flag | Effect |
|---|---|
| `--thread <path>` | (required) JSON file matching the schema above |
| `--output <dir>`  | parent dir for the dated output folder; default `./chatgpt-mockup-exports/` |
| `--name <slug>`   | override the output folder slug |

## Output

```
<output>/<YYYY-MM-DD>-<slug>/
  index.html       # standalone HTML (CSS inlined)
  screenshot.png   # 2250 × 4002 PNG (DPR 3, 9:16)
  thread.json      # copy of the input for reproducibility
```

## Workflow

1. Receive a brief or existing thread JSON.
2. If only a brief is given, compose `thread.json` matching the schema above.
3. Run `node render.js --thread <path>`.
4. Open the PNG. If anything looks off (header alignment, bubble width, missing icon), edit the JSON or `templates/chat.css` and re-render.

## Setup (one-time)

```bash
cd create-chatgpt-mockup
npm install
npx playwright install chromium
```

## Quality checks

- [ ] Renders in **light mode only** (white background, dark text). Dark-mode rendering is out of scope for v1.
- [ ] Status bar time and right cluster (signal / wifi / battery) sit at the very top, no clipping under the iOS status-bar safe area.
- [ ] Header chrome icons (hamburger / personPlus / dottedCircle / edit / more) all visually weigh the same as a real ChatGPT iOS screenshot at the same display size — **eyeball, don't pixel-match**. Sub-reading-weight icons read as broken even when their pixel dimensions "match the spec."
- [ ] Header model tag (`5.1`, `5.2`) sits inline with `ChatGPT` and its chevron — no wrapping.
- [ ] User bubble is **right-aligned**, soft-gray (`#F4F4F4`), `border-radius: 28px`, max-width 78% of stage.
- [ ] User image attachments use the same `28px` corner radius and sit right-aligned above the text bubble.
- [ ] Assistant body is plain prose (no bubble), left-aligned, full-width within the gutter.
- [ ] **Composer corner radius is 999px** (full pill), `1px` border `#E5E5E5`, send button is `44 × 44` round.
- [ ] When `composer.text` is set: send button is **solid black** with a white up-arrow. Caret sits right after the last character of typed text.
- [ ] When `composer.streaming: true`: send button shows a **black square stop icon**.
- [ ] When a citation marker `[[cite:Foo +1]]` is in the assistant text, it renders as a pill chip inline at the end of the sentence.

## Failure modes

| Symptom | Cause | Fix |
|---|---|---|
| `Thread file not found` | Wrong path or running from a different cwd | Use absolute paths or run from the skill directory |
| Image attachment shows broken-image glyph | `src` is relative but the renderer couldn't resolve it | render.js resolves relative `src` against the thread.json's directory — make sure the asset exists at that path |
| Send button stays light gray after typing | `composer.text` is empty string `""` instead of unset | Either omit `text` entirely or set it to a real string |
| Caret renders as a stray `\|` separated from the text | Caret span is being treated as a flex child | The CSS rule for `.composer .input` uses inline content flow — do not switch it to `display: flex` |
| Streamed list-item words render with no spaces ("Howconversationswork") | `.word { display: inline-block }` collapses inter-span text-node whitespace inside `<div>` parents (works fine inside `<p>`) | Use `display: inline` for `.word` — modern browsers honor `filter: blur()` + opacity transitions on inline elements too |
| Bullets visible while list-item text is still hidden during streaming | CSS `list-style` markers are browser-painted; the word-stream wrapper only sees text nodes | The atom auto-converts `<ul><li>X</li></ul>` to `<div class="md-list"><div class="md-li">• X</div></div>` when `stream: true` — keep that pass; don't regress it. Any new markdown that emits browser-painted glyphs (`::marker`, `quotes`, `counter-content`) needs the same text-conversion treatment. |
| Markdown `---` doesn't render an `<hr>` | The `---` line isn't on a line by itself, or the surrounding text didn't end its paragraph | Surround `---` with blank lines on both sides |
| Stanzas of a poem joined into single paragraphs | Lines separated by single `\n` get joined as a single paragraph but with `<br>` between them — this **is** the intended behavior. If you want stanza breaks, use `\n\n` between stanzas. |
| Header right cluster overlaps the model tag on long titles | Title text is too wide for the centered slot | Shorten `header.title`, drop the `model` tag, or switch `header.style` to `"title-only"` |

## Files

| File | Purpose |
|---|---|
| `render.js` | CLI entry — parses flags, generates HTML, takes screenshot, writes outputs |
| `generate.js` | Thread JSON → standalone HTML page (markdown-ish parser inside) |
| `screenshot.js` | HTML → PNG via Playwright (chromium headless) at fixed 750×1334 / DPR 3 |
| `templates/chat.css` | All visual styling |
| `templates/icons.js` | Inline SVG icons (hamburger, chevrons, spiral logo, mic, plus, send arrow, stop square, signal/wifi/battery, thumbs up/down) |
| `examples/*.json` | 6 reference threads exercising every variant |
| `examples/assets/` | Placeholder image assets used by image examples |
| `tests/run-all.sh` | Render every example into `tests/output/` for visual review |

## Known limitations

- **Light mode only.** Dark mode would require a separate theme block and is out of scope for v1.
- **No carousel / horizontal-scroll cards.** The Apps-SDK SeatGeek reference shows a horizontal card carousel inside the assistant response; not modeled here.
- **No live keyboard rendering.** The composer is the bottom pill only — no on-screen keyboard chrome, suggestion bar, or QWERTY grid. (If you need the keyboard, scale the screen down 50% and overlay a separate keyboard image.)
- **Markdown is intentionally minimal** — no tables, no fenced code blocks with syntax highlighting, no nested lists. Add to `generate.js#renderMarkdown` if a brief requires more.
- **Emoji rendering** depends on system fonts. Chromium on macOS ships Apple Color Emoji; on Linux ships Noto Color Emoji.

## Quality Checks

Run `bash tests/run-all.sh` and open the PNGs in `tests/output/`, then confirm:

- **Every example renders without error.** All six `examples/*.json` produce an `index.html` + `screenshot.png` + `thread.json` triplet; `render.js` exits `0`.
- **Dimensions are stable.** Each `screenshot.png` is **2250 × 4872** (the `.stage` is `750 × 1624` and `screenshot.js` captures at `deviceScaleFactor: 3`). A wrong size means the stage box or DPR changed.
- **Light mode, white background.** Background is white, text near-black. This atom does not render dark mode.
- **Status bar.** Time sits top-left; the signal / wifi / battery cluster sits top-right, unclipped. When `statusBar.dnd: true` (see `02-sleep-apnea-long.json`, `05-seatgeek-gpt-chip.json`) a moon glyph renders next to the time.
- **Header style matches the JSON.** `model-tag` shows `ChatGPT 5.1 ▾` (`01-sunscreen-image.json`, `06-short-howto.json`); `title-only` shows the plain title + right chevron (`02`, `03`, `05`); `plain-title` shows the upsell title with no chevron (`04-empty-typing.json`). The center cluster never wraps and the right icons never overlap it.
- **User turns.** User text is a right-aligned soft-gray bubble (`#F4F4F4`, `28px` radius). A `user-image` (see `01-sunscreen-image.json`) renders the attachment right-aligned, same `28px` corners, above the text bubble.
- **Assistant turns.** Assistant prose is left-aligned plain text with no bubble. Markdown renders: bold/italic, `##` headings, bullet and ordered lists (`06-short-howto.json`), `---` horizontal rules and the `[[cite:…]]` pill chip (`02-sleep-apnea-long.json`), an `[[icon:💡]]` inline prefix, and `title` as bold heading text (`03-poem-iphone-mac.json`, `05-seatgeek-gpt-chip.json`). `feedback: false` hides the thumbs chips.
- **Empty state.** When `messages` is empty (`04-empty-typing.json`) the centered OpenAI spiral hero renders instead of a conversation.
- **Composer.** Default is the full-pill (`999px`) bar with `+`, input, mic, and a round `44×44` send button. With `composer.text` set (`04-empty-typing.json`) the send button is solid black and a caret follows the typed text. With `streaming: true` (`02`, `03`) the send button shows the black stop square. With `composer.chip` (`05-seatgeek-gpt-chip.json`) the Apps-SDK GPT chip renders inside the composer above the input row.

## Failure Modes

| Symptom | Likely cause | What to do |
|---|---|---|
| `Thread file not found: …` then exit `1` | `--thread` path is wrong or the cwd is not the skill dir | Pass an absolute path or `cd` into the skill directory first (`render.js` resolves the path against cwd) |
| `Error: playwright not installed` | `npm install` never ran in the skill dir | Run `npm install`, then `npx playwright install chromium` (see Setup) |
| Run hangs ~15s then `page.goto … timeout` | `screenshot.js` is waiting on `networkidle` for an asset that never loads (e.g. a remote/`http` image `src`) | Use a local relative `src` that resolves under the thread.json dir, or an inline SVG asset like `examples/assets/sunscreen-sky.svg` |
| Image attachment shows the broken-image glyph | `user-image.src` is relative but the file is missing on disk | `render.js` rewrites a relative `src` to `file://<threadDir>/<src>`; make sure the asset actually exists there |
| Send button stays gray after setting text | `composer.text` is `""` (empty string) rather than a real value | Set `composer.text` to a non-empty string, or omit it to keep the placeholder state |
| PNG comes out the wrong size | `.stage` width/height in `templates/chat.css` or `DEVICE_SCALE`/`VIEWPORT` in `screenshot.js` was changed | Keep `.stage` at `750 × 1624` and `deviceScaleFactor` at `3` so output stays `2250 × 4872` |
| Header right icons overlap the model tag on a long title | `header.title` is too wide for the centered slot | Shorten the title, drop the `model` tag, or switch `header.style` to `"title-only"` |
| `[[cite:…]]` or `[[icon:…]]` prints literally instead of rendering | The marker is mistyped (missing double brackets / colon) | Match the exact `[[cite:Source +1]]` / `[[icon:💡]]` form parsed by `formatInline` in `generate.js` |
| Markdown `---` shows as text, not an `<hr>` | The `---` line is not on its own line between blank lines | Put a blank line above and below the `---`, as in `02-sleep-apnea-long.json` |

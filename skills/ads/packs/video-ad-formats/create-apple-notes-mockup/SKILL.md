---
name: create-apple-notes-mockup
description: Render pixel-accurate Apple Notes (iPhone, light mode) screenshot mockups from a JSON note spec. Outputs HTML + PNG at the iPhone 16/15 Pro native 1180×2556. Supports paragraphs, images, checklists, dividers, autocorrect underline, smart quotes, and an optional iOS keyboard chrome overlay used by the parent video-ad molecule.
---

# create-apple-notes-mockup

Generate Apple Notes screens that look like real iPhone screenshots — correct status bar, floating toolbar pill, bold title, body text with paragraph spacing, yellow text cursor, autocorrect underline, optional embedded images and checklists, and an optional iOS keyboard.

## Purpose

Turn a JSON note spec into a pixel-accurate Apple Notes (iPhone, light mode) screenshot — HTML + PNG at the native 1180×2556 (DPR 2). It is the deterministic, no-LLM renderer that the `create-apple-notes-video-ad` molecule drives frame-by-frame to fake a typing animation, and a standalone tool for one-off "noted to self" beats in ads, social posts, and storyboards. The orchestrating agent owns the copy; this atom owns the fidelity (status bar, smart punctuation, cursor, autocorrect underline, toolbar, keyboard chrome).

## When to use

- Need a fake Apple Notes screenshot for an ad, social post, video scene, or product mockup.
- Need a sequence of Apple Notes frames (title-only → adding paragraphs → cursor moves) to drive a typing-animation video — used by `create-apple-notes-video-ad`.
- Need a static "noted to self" beat in a storyboard.

If you're rendering an iMessage thread, use `skills/atoms/messaging/create-imessage-mockup` instead.

## Inputs

The skill is deterministic — it does not embed an LLM. The orchestrating agent composes a note JSON matching the schema below, then invokes the renderer.

### Note JSON schema

```json
{
  "title": "Hello",
  "body": [
    { "type": "paragraph", "text": "This is a screen recording of me typing on apple notes app." },
    { "type": "paragraph", "text": "Let's see how this feels." }
  ],
  "cursor": "end",
  "autocorrect_underline": ["this", "how"],
  "status_bar": {
    "time": "9:41",
    "battery_pct": 87,
    "battery_low": false,
    "show_focus_glyph": false
  },
  "show_keyboard": false,
  "keyboard_state": {
    "suggestions": ["see", "go", "do"],
    "shift": "lower",
    "letters_row1": "qwertyuiop",
    "letters_row2": "asdfghjkl",
    "letters_row3": "zxcvbnm"
  },
  "with_iphone_frame": false
}
```

- `title` — string. Bold display headline, single line.
- `body[]` — block list. Supported block types:
  - `paragraph` — `{ "text": "..." }`. Smart punctuation is auto-applied (`'` → `'`, `"` → `"`, `...` → `…`, `--` → `–`, `---` → `—`).
  - `image` — `{ "src": "<path|url>", "caption": "optional" }`. Relative paths are resolved against the spec file's directory and inlined as data URIs.
  - `checklist` — `{ "items": [{ "text": "...", "checked": true|false }] }`. Checked items get yellow filled circles with strikethrough; unchecked get gray-outlined circles.
  - `divider` — horizontal rule.
- `cursor` — `"title" | "end" | null`. `"title"` places the yellow caret at the end of the title; `"end"` places it at the end of the last paragraph; `null` hides it.
- `autocorrect_underline[]` — exact-case word list. Each occurrence gets the Apple Notes mid-typing yellow underline (`<span class="spell">`).
- `status_bar` — `time`, `battery_pct` (0–100), `battery_low` (color battery red), `show_focus_glyph` (DND/car icon next to time). The Dynamic Island is not rendered.
- `show_keyboard` — `true` overlays the iOS QWERTY + formatting toolbar.
- `keyboard_state` — only consulted when `show_keyboard` is true. `shift` = `"lower" | "upper"`.
- `with_iphone_frame` — adds a thin dark bezel inset (for hero compositions).

## CLI

```bash
node render.js --note examples/mid.json
node render.js --note examples/long.json --output ./my-exports/ --name todays-note
node render.js --note my-note.json --with-keyboard
node render.js --note my-note.json --viewport 1080x1920   # 9:16 ad delivery size
```

### Flags

| Flag | Effect |
|---|---|
| `--note <path>` | (required) JSON file matching the schema above |
| `--with-keyboard` | force-enables `show_keyboard` (overrides spec) |
| `--with-iphone-frame` | force-enables hardware bezel |
| `--no-frame` | force-disables hardware bezel |
| `--output <dir>` | parent dir for the dated output folder; default `./apple-notes-mockup-exports/` |
| `--name <slug>` | override the output folder slug |
| `--out-html <path>` / `--out-png <path>` | write directly to explicit paths (skip dated folder) |
| `--viewport WxH` | override the render viewport (default `1180x2556`) |
| `--dpr N` | device-pixel ratio (default `2`) |

## Output

```
<output>/<YYYY-MM-DD>-<slug>/
  index.html       # full standalone HTML (images inlined as data URIs)
  screenshot.png   # rendered PNG at the chosen viewport × DPR
  spec.json        # copy of the input for reproducibility
```

Default `<output>` is `./apple-notes-mockup-exports/` in the cwd.

## Workflow

1. Receive a prompt or existing note JSON.
2. If only a prompt was given: compose a `note.json` matching the schema, save it.
3. Run `node render.js --note <path> [--with-keyboard]`.
4. Open the resulting PNG to verify the layout. If something looks wrong (wrong wrap, wrong cursor position, wrong battery color), edit the JSON and re-render.

## Setup (one-time)

```bash
cd create-apple-notes-mockup
npm install
npx playwright install chromium
```

A symlink to `create-imessage-mockup/node_modules` ships with the repo, so on a fresh clone `npm install` is only needed if you want this skill to be self-contained.

## Files

| File | Purpose |
|---|---|
| `render.js` | CLI entry — parses flags, resolves image paths, generates HTML, takes screenshot |
| `generate.js` | Note JSON → standalone HTML page (smart-punctuation + autocorrect underline applied here) |
| `screenshot.js` | HTML → PNG via Playwright (chromium headless) at 1180×2556, DPR 2 |
| `templates/note.css` | All visual styling (status bar, toolbar, body, checklist, image, keyboard) |
| `templates/icons.js` | Inline SVG icons (back chevron, undo, share, more, done check, signal, wifi, battery, format toolbar icons, keyboard glyphs) |
| `assets/samples/sample-landscape.jpg` | Sample image used by `examples/with-image.json` |
| `examples/*.json` | 6 reference notes covering every variation (title-only, mid-typing, long multi-paragraph, with checklist, with image, frame-1 lowercase-keyboard) |
| `tests/run-all.sh` | Render every example into `tests/output/` for visual review |
| `apple-notes-skill-build.html` | Side-by-side review board comparing reference video frames to generated PNGs |

## Quality Checks

Before declaring a note shippable:

- [ ] Title renders as bold display headline, not regular weight.
- [ ] Body text uses Apple's smart punctuation — `'` is curly, `"` is curly, `…` is a single character.
- [ ] Yellow cursor (`#FFCC00`) sits flush at the end of the target text, ~5px wide.
- [ ] Body paragraphs are separated by one empty visual line (no manual `<br>`).
- [ ] Autocorrect underlines are short yellow lines flush under the flagged token, with case-sensitive matching.
- [ ] Status bar: time left, signal/wifi/battery right. Battery is red iff `battery_low: true`. No Dynamic Island.
- [ ] **Scroll mask:** status bar and toolbar have opaque white backgrounds so body content scrolled by the molecule's driver doesn't bleed through. Verify by translating `.note` by `-300px` in DevTools and confirming the title is fully masked by the toolbar — not visible behind/through it.
- [ ] Toolbar: floating back-chevron pill (left), white capsule with undo/share/more, yellow Done circle (right). All cast soft shadows.
- [ ] Keyboard (when enabled): QWERTY layout matches `shift` casing, suggestion strip shows 3 words, formatting toolbar pill above keys, mic + globe at bottom.
- [ ] Image blocks render with rounded corners (~18px) and respect the body left padding.
- [ ] Checklist: filled yellow circles + strikethrough on checked items; gray outline circles otherwise.

## Failure Modes

| Symptom | Cause | Fix |
|---|---|---|
| Body text wraps a word too early or too late | Font width differs from reference (Chromium picked up a non-SF fallback) | Adjust `font-size` on `.note-body` in steps of 2px, or widen `.note` by reducing left/right padding |
| Title looks thin / not bold enough | Host doesn't have SF Pro Display; system falls back to a lighter face | Set `font-weight: 900` (already the default) and check `fc-list | grep -i "SF Pro"` |
| "Hello's", "Let's" render with straight quote | Smart-punctuation pre-processor disabled | Verify `smartQuotes()` is called in `generate.js` before `escapeHtml` |
| Image doesn't render (blank space) | Remote URL blocked or relative path didn't resolve | Use a local file path; render.js inlines local images as base64 |
| Autocorrect underline also matches "This" when only "this" was intended | Regex was case-insensitive | The regex is case-sensitive by default. Pass exact-case strings in `autocorrect_underline` |
| Empty paragraph collapses (no cursor space) | `<p class="note-paragraph"></p>` with no content has zero height | The CSS sets `margin: 0 0 84px 0` so an empty paragraph still occupies one paragraph gap; ensure you didn't strip the trailing margin |
| Yellow Done circle looks orange | CSS color drift | Pure Apple yellow is `#FFCC00`. Cursor + Done share the value; do not change to `#FFC107` (Material amber) |
| Keyboard suggestion `Hello's` renders with straight apostrophe | Smart quotes not applied to suggestions | Confirmed applied via `smartQuotes(s)` in `generate.js` |

## Reference

The visual spec was extracted from `apple-notes-typing.MP4` (a 36-second iPhone screen recording of typing into Apple Notes in light mode). See `apple-notes-skill-build.html` in this folder for the side-by-side proof — each example is shown alongside the reference frame it targets.

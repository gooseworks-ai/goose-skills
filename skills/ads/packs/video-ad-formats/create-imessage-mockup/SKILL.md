---
name: create-imessage-mockup
description: Render pixel-accurate iMessage screenshot mockups (DM or group) from a thread JSON. Supports minimal, with-keyboard, and full iPhone 15 Pro frame variants. Outputs HTML + PNG.
---

# create-imessage-mockup

Generate iMessage screenshots that look like real iOS captures — correct bubbles with tails, typing indicators, timestamps, "Delivered" captions, group avatars + sender names, keyboard chrome, and an optional iPhone 15 Pro bezel with Dynamic Island and status bar.

## Purpose

Turn a structured thread JSON into a believable iMessage screenshot — first as standalone HTML (`generate.js` + `templates/chat.css`), then rasterized to PNG with headless Chromium (`screenshot.js`/`render.js` via Playwright). It is the atom you reach for when an ad, social post, or video scene needs a fake-but-convincing iOS message capture.

What it gets right, grounded in the renderer:

- **Bubble runs and tails** — blue `sent` bubbles (right) and gray `received` bubbles (left), with a curved tear-drop tail drawn only on the *last* bubble of each consecutive sender run (`isLastOfRun` in `generate.js`).
- **Dark-themed iOS chrome** — `theme: "dark"` flips the page to the iOS dark conversation look; the status bar, Dynamic Island, and keyboard match iPhone 15 Pro.
- **Group affordances** — group threads (`mode: "group"`) add per-sender colored avatar circles, sender names above the first bubble of a run, and a 4-tile group-header badge.
- **Beats for storyboards** — `timestamp` pills, a static-but-mid-animation `typing` three-dot bubble, `attachment` cards, and "Delivered"/"Read" captions let you stage individual frames of a conversation.
- **Three crops** — `--minimal` (bubbles only), `--with-keyboard` (header + iOS keyboard), and `--with-iphone-frame` (full bezel + Dynamic Island + status bar over a gradient backdrop).

The atom embeds **no LLM** — it is deterministic. The orchestrating agent is responsible for composing the thread JSON; the renderer only draws exactly what the JSON says.

## When to use

- Need a fake iMessage screenshot for an ad, social post, video scene, or product mockup.
- Want a side-by-side hero image showing a conversation in an iPhone frame.
- Need a typing indicator or "Delivered" beat for a video storyboard.

If you're rendering programmatic graphic frames more broadly (cards, posters, infographics), use `create-goose-graphics` instead.

## Inputs

The skill is deterministic — it does not embed an LLM. To translate a free-form prompt into a thread, the orchestrating agent (you) composes a JSON file matching the schema below, then invokes the renderer.

### Thread JSON schema

```json
{
  "mode": "dm" | "group",
  "title": "Karaoke Crew",
  "participants": [
    { "id": "me",    "name": "Me",    "self": true },
    { "id": "sarah", "name": "Sarah", "color": "#FF9500", "initials": "S" }
  ],
  "messages": [
    { "type": "timestamp", "label": "iMessage\nToday 9:41 AM" },
    { "type": "timestamp", "bold": "Sat, Jan 2", "light": "11:07" },
    { "type": "text",      "from": "sarah", "text": "Did we crash it?" },
    { "type": "text",      "from": "me",    "text": "Couldn't withstand our friendship", "delivered": true, "read": false },
    { "type": "typing",    "from": "sarah" }
  ],
  "keyboard": { "leftIcon": "plus" }
}
```

- `mode` — `dm` or `group`. If omitted, auto-detected from the participant count.
- `participants[].self: true` marks the user (sent bubbles, no avatar).
- `participants[].color` is the avatar background; defaults from a 6-color palette.
- `participants[].initials` defaults to the first letter of `name`.
- `messages[]`:
  - `timestamp` — centered pill. Use `label` (newline-separated bold/light) or explicit `bold` and `light` fields.
  - `text` — text bubble. `delivered: true` on the last sent bubble in a run renders the "Delivered" caption (or "Read" if `read: true`).
  - `typing` — animated three-dot bubble (rendered as a static mid-animation frame for screenshot determinism).
- `keyboard.leftIcon` — `"plus"` (default) or `"camera"`.

## CLI

```bash
node render.js --thread examples/group-with-frame.json --with-iphone-frame
node render.js --thread examples/dm-with-keyboard.json --with-keyboard
node render.js --thread examples/dm-minimal.json       --minimal
node render.js --thread my-thread.json --with-keyboard --output ./my-exports/ --name nightout
```

### Flags

| Flag | Effect |
|---|---|
| `--thread <path>` | (required) JSON file matching the schema above |
| `--prompt "<brief>"` | prints the schema and exits — agent must compose a thread.json and re-invoke |
| `--minimal` | bubbles + timestamps only (no header, no keyboard, no frame) |
| `--with-keyboard` | bubbles + iOS keyboard chrome (default) |
| `--with-iphone-frame` | full iPhone 15 Pro bezel + Dynamic Island + status bar + soft gradient backdrop |
| `--dm` / `--group` | force chat mode (otherwise auto-detected from participants) |
| `--name <slug>` | override the output folder slug |
| `--output <dir>` | parent dir for the dated output folder; default `./imessage-mockup-exports/` |

Frame flags are mutually exclusive.

## Output

```
<output>/<YYYY-MM-DD>-<slug>/
  index.html       # full standalone HTML
  screenshot.png   # rendered PNG (DPR 3, "Retina")
  thread.json      # copy of the input for reproducibility
```

Default `<output>` is `./imessage-mockup-exports/` in the cwd.

## Workflow

1. Receive a prompt or existing thread JSON.
2. If only a prompt was given: compose a thread.json matching the schema, save it.
3. Run `node render.js --thread <path> [flag]`.
4. Open the resulting PNG to verify the layout. If something looks wrong (clipping, wrong tail side, missing avatar), edit the thread JSON or the relevant template under `templates/` and re-render.

## Setup (one-time)

```bash
cd skills/ads/capabilities/create-imessage-mockup
npm install
npx playwright install chromium
```

## Files

| File | Purpose |
|---|---|
| `render.js` | CLI entry — parses flags, generates HTML, takes screenshot, writes outputs |
| `generate.js` | Thread JSON → standalone HTML page |
| `screenshot.js` | HTML → PNG via Playwright (chromium headless) |
| `templates/chat.css` | All visual styling (bubbles, tails, keyboard, iPhone frame) |
| `templates/icons.js` | Inline SVG icons (plus, camera, mic, signal, wifi, battery, chevron) |
| `examples/*.json` | 6 reference threads exercising every flag combination |
| `tests/run-all.sh` | Render every example into `tests/output/` for visual review |

## Testing

```bash
bash tests/run-all.sh
# inspect tests/output/<case>/<date-slug>/screenshot.png
```

The 6 cases cover: dm-minimal, dm-with-keyboard, dm-with-typing (camera-keyboard variant), dm-with-frame, group-with-frame, group-minimal.

## Implementation pitfalls — do not re-introduce these bugs

These are mistakes that have already been made and fixed. If you modify the templates, do not undo them.

### Bubble tail painting order

The iMessage tail in `templates/chat.css` is drawn with **two pseudo-elements that both sit behind the bubble's background** (`z-index: -1` inside an `isolation: isolate` stacking context on `.bubble`):

- `::before` is the **colored bulge** that extends past the tail-side edge.
- `::after` is the **page-color cutout** that overlaps the bulge from outside, with a rounded corner that "carves" the tear-drop curve.

This works because `::after` paints **on top of** `::before` (later in source order = higher in paint order). In the overlap region the cutout wins, leaving only the curved tail tip of the bulge visible.

**Do not swap these roles.** If `::after` is used for the bulge and `::before` for the cutout, the cutout paints behind the bulge, so it does nothing — and the tail renders as a chunky rectangle with one rounded corner, not a curved tear-drop. This is how tails initially looked broken.

**Do not remove `isolation: isolate` from `.bubble`** without replacing it with another stacking-context trigger (`z-index: 0`, `transform`, etc.). Without a stacking context, `z-index: -1` on the pseudo-elements will push them behind the page background, not just behind the bubble's own background, and the tail disappears entirely.

### Tail vs. avatar overlap (group chats)

`.avatar-slot` has `z-index: 3` and `position: relative` so it paints on top of the bubble next to it. This is required: without it, the bubble's tail (which extends ~7px to the left of the bubble for received messages) overlaps the avatar circle.

The avatar is a sibling of the bubble in the `.row` flex container, **not** a child of the bubble. The bubble's `isolation: isolate` does not contain it, so this stacking still works.

### "Last bubble in a run" rule

Tails appear only on the **last** consecutive bubble from the same sender. Adding a tail to every bubble (or the first instead of the last) does not match iOS. The logic in `generate.js` walks the message list and sets `isLastOfRun` based on whether the next message is from the same `from`; do not change that without checking iOS reference screenshots.

### Screenshot viewport

Modes use `fullPage: true` with a small initial viewport `height` (100px). This is intentional: Playwright extends the viewport to fit content but never shrinks it, so a small initial height + `fullPage` produces a tightly-cropped screenshot. **Do not raise the viewport height** to "make sure the screenshot fits" — that creates dead vertical space below the content.

The `with-iphone-frame` mode uses a fixed viewport (525×980) with `fullPage: false` because the frame itself defines the visible area; here we *want* the viewport to bound the screenshot to a single phone-sized rect.

## Known limitations

- **Image avatars not supported** in v1 — only colored circle initials. Add an `avatarUrl` field and update `templates/chat.css` if needed.
- **Typing animation is static** — captured as a mid-animation frame. The HTML itself does animate; only the PNG is frozen.
- **No tapback reactions** in v1 — schema reserves `{type: "reaction", target: <index>, kind: "heart"|...}` but the renderer ignores it for now.
- **Emoji rendering depends on system fonts** — Chromium ships with Noto Color Emoji on Linux/macOS; emoji should render but visually differ slightly from Apple Color Emoji.

## Quality Checks

Before treating a render as final, verify against the iOS look:

- **Output manifest** — the output folder contains `index.html`, `screenshot.png`, and a copied `thread.json` (written by `render.js`).
- **PNG dimensions** — `minimal` and `with-keyboard` are 750px wide × DPR 3 = **2250px wide**, with height growing to fit content (`fullPage: true`). `with-iphone-frame` is the fixed phone rect: 525×980 × DPR 3 = **1575×2940**. Confirm with `sips -g pixelWidth -g pixelHeight <png>` (macOS) or any image tool.
- **Bubble sides + tails** — `sent` (self) bubbles hug the right and are blue; `received` bubbles hug the left and are gray. A tail appears **only** on the last bubble of each sender run — never on the middle bubbles, never on the first-of-run.
- **Group rendering** — in `group` threads each received run shows the sender's name above its first bubble and a colored avatar circle beside its last bubble; the group header shows up to 4 avatar tiles plus the title.
- **Captions** — the final `sent` bubble in a run with `delivered: true` shows a "Delivered" caption ("Read" if `read: true`), and only that bubble.
- **Frame chrome (framed mode)** — Dynamic Island is centered at the top, the status bar reads `9:41` with signal/wifi/battery, and the phone sits on the soft gradient backdrop.
- **Typing / emoji / link beats** — `typing` renders three dots in a received bubble; emoji-only messages render enlarged; `[[link:CODE]]` markers render as an underlined iOS link-detector span.
- **No renderer errors** — the process exits 0 and prints the `✓ <png path>` line.

The canonical visual review is `bash tests/run-all.sh`, which renders all six example fixtures into `tests/output/` for side-by-side inspection.

## Failure Modes

Known ways this atom breaks, and what they look like:

- **Dependencies not installed** — `screenshot.js` exits with `playwright not installed. Run npm install in the skill directory`. Fix: run the one-time `npm install` + `npx playwright install chromium` from Setup.
- **Missing `--thread`** — `render.js` prints help and exits non-zero; `--prompt` alone prints the schema and exits `2` by design (the agent must compose a `thread.json` and re-invoke). The atom never invents a conversation on its own.
- **Bad thread JSON** — invalid JSON throws on `JSON.parse`; a `from` that doesn't match any participant `id` yields a bubble with no avatar/name (in groups) because the participant lookup misses. Keep `messages[].from` in sync with `participants[].id`.
- **Broken bubble tails** — swapping the `::before`/`::after` roles or removing `isolation: isolate` from `.bubble` in `templates/chat.css` makes tails render as a chunky rectangle or vanish entirely (see Implementation pitfalls). Do not re-introduce.
- **Tail / avatar overlap in groups** — dropping the `z-index: 3` / `position: relative` on `.avatar-slot` lets a received bubble's tail bleed over the avatar circle.
- **Dead vertical space** — raising the small initial viewport height for `minimal`/`with-keyboard` defeats the `fullPage` tight-crop and leaves empty space below the content.
- **Mutually exclusive frame flags** — passing more than one of `--minimal` / `--with-keyboard` / `--with-iphone-frame` is ambiguous; the last one parsed wins. Pass exactly one.
- **Emoji/font drift** — emoji render via the system emoji font (Noto on Linux/macOS), so glyphs differ slightly from Apple Color Emoji; this is a fidelity limit, not a crash.

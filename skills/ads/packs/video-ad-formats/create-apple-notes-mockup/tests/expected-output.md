# Expected output

For each example, `render.js` should produce a folder containing `index.html`, `screenshot.png`, and `spec.json`.

The PNG must visually match the reference frames from `apple-notes-typing.MP4`:

| Example | Reference frame | What should match |
|---|---|---|
| `frame-1-title-only.json` | `frame_0001.jpg` (t=00:00) | "Hello" title + yellow cursor flush at end of title; lowercase keyboard with `Helloo / Hello's / Hellooo` suggestions |
| `mid.json` | `frame_0015.jpg` (t=00:13) | "Hello" + first body paragraph wrapping at `typing on / apple notes app.`; yellow cursor on empty paragraph below |
| `long.json` | `frame_0035.jpg` (t=00:31) | Four-paragraph note; lowercase `this` and `how` get yellow underline; capital `This` does NOT |

PNG dimensions: 2360×5112 (1180×2556 viewport × DPR 2).

Visual identity checks (eyeball against reference frames):

- Title boldness, body weight, body wrap point.
- Yellow `#FFCC00` cursor + Done circle (NOT amber/gold).
- Smart-quote `'`, `'`, `…` in body text.
- Battery icon is red when `battery_low: true`.
- Dynamic Island sits at top center with a red dot only if `show_island_dot: true`.
- Format-toolbar pill above the keyboard contains: Aa, checklist, table, paperclip, pen, AI atom.

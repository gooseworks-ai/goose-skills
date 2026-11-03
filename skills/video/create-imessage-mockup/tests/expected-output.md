# Expected output

For each example, `render.js` produces an output folder containing `index.html`, `screenshot.png`, and a copied `thread.json` (the input, kept for reproducibility).

PNG dimensions by mode:

- `--minimal` and `--with-keyboard`: **2250px wide** (750px viewport × DPR 3), height grows to fit the content (`fullPage: true`).
- `--with-iphone-frame`: fixed **1575×2940** (525×980 phone rect × DPR 3).

What each case should look like:

| Example | Mode | What should match |
|---|---|---|
| `dm-minimal.json` | minimal | One blue right-aligned bubble with a tail; "Delivered" caption underneath; no header, keyboard, or frame |
| `dm-with-keyboard.json` | with-keyboard | Same single sent bubble, now over the iOS keyboard chrome with the `iMessage` placeholder and mic icon |
| `dm-with-typing.json` | with-keyboard | Received → timestamp pill → sent ("Delivered") → emoji bubble (enlarged) → three-dot typing bubble; keyboard left icon is the camera |
| `dm-with-frame.json` | with-iphone-frame | DM inside the iPhone 15 Pro bezel: Dynamic Island centered, `9:41` status bar, soft gradient backdrop; the 🐶 / 💕 emoji bubbles enlarged |
| `group-with-frame.json` | with-iphone-frame | "Karaoke Crew" header with 4 avatar tiles; received runs show sender names + colored avatars; sent bubbles blue on the right; framed |
| `group-minimal.json` | minimal | "Studio Crew" group, sender names above first-of-run bubbles, colored avatar circles beside last-of-run received bubbles; one sent "Delivered" bubble |

Visual identity checks (eyeball each PNG):

- **Bubble color + side** — `sent`/self is blue and right-aligned; `received` is gray and left-aligned.
- **Tails** — exactly one tear-drop tail per sender run, on the last bubble only; never a chunky rectangle (that's the broken-tail regression).
- **Group avatars** — colored circles with initials, painted on top of the adjacent bubble's tail (no overlap); sender name shown once per run.
- **Delivered/Read** — caption appears only under the final sent bubble of a run with `delivered: true`.
- **Typing** — three gray dots inside a received bubble with a tail.
- **Emoji-only** — single/short emoji messages render larger than normal text.
- **Frame chrome** (framed cases) — Dynamic Island top-center, status bar `9:41` with signal/wifi/battery, gradient backdrop around the phone.

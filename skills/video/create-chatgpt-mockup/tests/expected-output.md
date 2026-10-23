# Expected output

For each example, `render.js` produces a dated folder under the output dir (or `tests/output/<date>-<slug>/` via `run-all.sh`) containing `index.html`, `screenshot.png`, and a copied `thread.json`.

PNG dimensions: **2250×4872** (the `750×1624` stage captured at `deviceScaleFactor: 3`).

Each PNG should read as a real ChatGPT iOS screen in light mode. What each example must show:

| Example | What should match |
|---|---|
| `01-sunscreen-image.json` | `model-tag` header `ChatGPT 5.1 ▾` with personPlus + dottedCircle on the right; square image attachment right-aligned, then the right-aligned gray text bubble "Make this face sunscreen better", then assistant prose "It can't get any better." with thumbs feedback; default "Ask anything" composer pill |
| `02-sleep-apnea-long.json` | `title-only` header "ChatGPT 5.2 ›" with edit/personPlus/more, DND moon next to `08:18`; long assistant answer with a `💡` inline-icon `##` heading, **bold** and *italic* runs, a horizontal rule, a bullet list, and a "Johns Hopkins Medicine +1" cite pill; no thumbs feedback; composer send button is the black stop square (`streaming`) |
| `03-poem-iphone-mac.json` | `title-only` header; assistant bold title "Ode to iPhone and Mac" above a four-stanza poem where lines inside a stanza are soft `<br>` breaks and stanzas are separated by blank space; no feedback; composer is the streaming (stop-square) state |
| `04-empty-typing.json` | `plain-title` "Get Plus ✦" header; centered OpenAI spiral hero (empty state, no conversation); composer shows typed text "Write me a poem about loving iPhone and Mac" with a caret and a solid-black active send button |
| `05-seatgeek-gpt-chip.json` | `title-only` header, DND moon next to `9:41`; assistant bold title "Cheapest Upcoming Mets Games" + a short reply with bold price runs; the "SeatGeek ×" GPT chip sits inside the composer above the "Ask ChatGPT" input row |
| `06-short-howto.json` | `model-tag` header `ChatGPT 5.1 ▾`; assistant reply opening with a **bold** lead and a clean 1./2./3. ordered list; thumbs feedback; default "Ask anything" composer |

Visual identity checks (eyeball against the `references/*.png` captures):

- White background, near-black text (light mode only).
- User bubble is right-aligned soft gray (`#F4F4F4`), `28px` corners; image attachments share the same corner radius.
- Assistant body is plain prose with no bubble, full width within the gutter.
- Composer is a `999px` full pill, `1px` `#E5E5E5` border, with a round `44×44` send button; black + up-arrow when text is typed, black stop square when `streaming`.
- Citation markers render as inline pill chips at the end of the sentence; `[[icon:…]]` renders as an emoji prefix, not literal brackets.
- Header center cluster never wraps; right-icon cluster never overlaps the title/model tag.

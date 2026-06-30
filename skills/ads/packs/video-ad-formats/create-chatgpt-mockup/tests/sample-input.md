# Sample input

See `examples/01-sunscreen-image.json` — the canonical thread that exercises all three message types (user image attachment, user text bubble, assistant prose) on the default `model-tag` header.

```json
{
  "statusBar": { "time": "9:41" },
  "header": {
    "style": "model-tag",
    "title": "ChatGPT",
    "model": "5.1",
    "rightIcons": ["personPlus", "dottedCircle"]
  },
  "messages": [
    { "type": "user-image", "src": "assets/sunscreen-sky.svg", "aspect": "square" },
    { "type": "user-text", "text": "Make this face sunscreen better" },
    { "type": "assistant", "text": "It can't get any better." }
  ],
  "composer": { "placeholder": "Ask anything" }
}
```

Render it with:

```bash
node render.js --thread examples/01-sunscreen-image.json
```

The other examples in `examples/` each isolate a different variant:

| File | Covers |
|---|---|
| `01-sunscreen-image.json` | `model-tag` header; user-image attachment + user text + short assistant reply |
| `02-sleep-apnea-long.json` | `title-only` header, DND moon, long assistant markdown with `##` heading, `[[icon:💡]]`, `[[cite:…]]` chip, `---` rule, bullet list; composer `streaming: true`; `feedback: false` |
| `03-poem-iphone-mac.json` | `title-only` header; assistant `title` heading + multi-stanza poem (single-`\n` soft breaks, blank-line stanza breaks); composer `streaming: true` |
| `04-empty-typing.json` | `plain-title` "Get Plus" header; empty `messages` → OpenAI spiral empty state; composer with typed `text` + caret (active black send button) |
| `05-seatgeek-gpt-chip.json` | `title-only` header; assistant `title`; Apps-SDK GPT chip (`composer.chip.name: "SeatGeek"`) inside the composer |
| `06-short-howto.json` | `model-tag` header; assistant reply with a **bold** lead-in and an ordered list |

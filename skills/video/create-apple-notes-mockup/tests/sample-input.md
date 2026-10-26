# Sample input

See `examples/mid.json` — the canonical "mid-typing" state used to track parity with the reference video `apple-notes-typing.MP4` at the 14-second mark.

```json
{
  "title": "Hello",
  "body": [
    { "type": "paragraph", "text": "This is a screen recording of me typing on apple notes app." },
    { "type": "paragraph", "text": "" }
  ],
  "cursor": "end",
  "status_bar": { "time": "9:41", "battery_pct": 13, "battery_low": true },
  "show_keyboard": true,
  "keyboard_state": {
    "suggestions": ["And", "For", "On"],
    "shift": "upper"
  }
}
```

Other examples in `examples/`:

| File | Covers |
|---|---|
| `frame-1-title-only.json` | Title-only state with cursor on title + lowercase keyboard |
| `short.json` | Title-only, no body, lowercase keyboard |
| `mid.json` | Two body paragraphs + empty paragraph holding the cursor, keyboard up |
| `long.json` | Multi-paragraph note with autocorrect underlines, no keyboard |
| `with-checklist.json` | Checklist block with mixed checked/unchecked states |
| `with-image.json` | Embedded image block with caption |

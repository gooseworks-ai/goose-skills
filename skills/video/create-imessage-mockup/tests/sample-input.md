# Sample input

See `examples/dm-with-typing.json` — the canonical multi-bubble DM that exercises the most features in one render: a received bubble, a `timestamp` pill, a sent bubble with a "Delivered" caption, an emoji message, and a `typing` indicator, using the `camera` keyboard variant.

```json
{
  "mode": "dm",
  "participants": [
    { "id": "me",   "name": "Me",  "self": true },
    { "id": "them", "name": "Jordan", "color": "#5AC8FA", "initials": "J" }
  ],
  "keyboard": { "leftIcon": "camera" },
  "messages": [
    { "type": "text", "from": "them", "text": "Oh good cause your computer is locked haha" },
    { "type": "timestamp", "bold": "Sat, Jan 2", "light": "11:07" },
    { "type": "text", "from": "me",   "text": "Congrats man! Enjoy!!!!!", "delivered": true },
    { "type": "text", "from": "them", "text": "Thanks dude!! 😎" },
    { "type": "typing", "from": "them" }
  ]
}
```

The six reference threads in `examples/`:

| File | Covers |
|---|---|
| `dm-minimal.json` | One sent bubble + "Delivered" caption; `--minimal` crop (no header/keyboard/frame) |
| `dm-with-keyboard.json` | Same single sent bubble, rendered with the iOS keyboard chrome |
| `dm-with-typing.json` | Mixed sent/received run, timestamp pill, emoji bubble, typing dots, `camera` keyboard |
| `dm-with-frame.json` | Sent + received DM with emoji, rendered inside the full iPhone 15 Pro frame |
| `group-with-frame.json` | 4-person group with sender names + avatars, inside the iPhone frame |
| `group-minimal.json` | 3-person group with avatars + names, `--minimal` crop |

Threads always pair `messages[].from` with a `participants[].id`; the participant flagged `self: true` is rendered as the sent (blue, right-aligned, no avatar) side.

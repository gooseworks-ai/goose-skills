# TIMELINE schema reference

Every iMessage ad in this format has a single source-of-truth `TIMELINE` array inside `clips/record-master.js`. The recorder walks it in real time; the stitch script consumes it (via `master-chat.sfx.json`) to layer SFX. Keep the two in sync by deriving the cue list from the array — never by hand.

## Event shape

```ts
type TimelineEvent =
  | { t: number; kind: 'pop';           id: string;           sfx?: 'send' | 'receive' | null }
  | { t: number; kind: 'typing-pop';    id: string;           sfx: null /* always */ }
  | { t: number; kind: 'typing-swap';   id: string; toId: string; sfx?: 'send' | 'receive' }
  | { t: number; kind: 'composer';      text: string; dur: number /* seconds */ }
  | { t: number; kind: 'composer-clear' }
  | { t: number; kind: 'scroll';        dur: number /* milliseconds */ }
  | { t: number; kind: 'noop' }
```

`t` is **absolute seconds from recording start**. The driver computes `target = t0 + ev.t * 1000` and `await sleep(target - performance.now())` — there's no relative offset.

## Patterns

### Sent message after composer typing
```js
{ t: 6.40, kind: 'composer', text: 'cat', dur: 0.30 },
{ t: 6.85, kind: 'pop', id: 'm09-cb', sfx: 'send' },
{ t: 6.85, kind: 'composer-clear' },
{ t: 6.95, kind: 'scroll', dur: 250 },
```

`composer` and `composer-clear` are paired — the clear happens at the same `t` as the bubble pop so the composer empties exactly when the bubble flies out.

### Peer reply with typing indicator
```js
{ t: 1.95, kind: 'typing-pop',  id: 'm03-typ', sfx: null },     // dots appear, NO sfx
{ t: 2.05, kind: 'scroll',      dur: 280 },
{ t: 2.85, kind: 'typing-swap', id: 'm03-typ', toId: 'm04-no', sfx: 'receive' }, // swap → text, sfx fires
{ t: 2.95, kind: 'scroll',      dur: 250 },
```

The 900ms gap between `typing-pop` and `typing-swap` lets the dots animate visibly. Going below ~700ms means the dots show for 1-2 frames before the text replaces them — feels glitchy.

### Peer reply with NO typing (rapid-fire reaction)
```js
{ t: 3.30, kind: 'pop',    id: 'm05-app', sfx: 'receive' },
{ t: 3.40, kind: 'scroll', dur: 220 },
```

For one-word reactions ("bet", "lol", "fr") that follow immediately, skip the typing indicator entirely — the typing-then-1-word feels staged.

## Pacing cheat sheet

| Beat type | Gap from previous event |
|---|---|
| One-word reaction → next one-word reaction | 250–450ms |
| Sentence reveal → sentence reveal | 600–900ms |
| Composer typing duration | ~70–120ms per char |
| Typing-pop → typing-swap | 700–1000ms |
| Bubble pop → scroll | ~100ms (give layout a frame to settle) |
| Final bubble → end-card crossfade start | ~600ms (let it breathe) |

## Always

- `typing-pop` events: `sfx: null`. ALWAYS. iOS does not chime when someone starts typing.
- `pop` of a sent bubble: `sfx: 'send'`
- `pop` of a received bubble: `sfx: 'receive'`
- `typing-swap`: `sfx: 'receive'` (this is the *real* receive moment)
- `pop` of an attachment from the user: `sfx: null` (the swoosh hits on the next bubble; pre-pinned context shouldn't chime)

The canonical flow in `scripts/record-master.template.js` exemplifies all of these.

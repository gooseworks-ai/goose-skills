# brand-layer 1.0.1

The brand layer (slot 1 of 4): ends the video on the brand. Free; needs the kit's browser.

- When `expect.end_card` is true and no timeline step drew a card (`timeline.end_card` is absent), it appends
  the brand end card (the same renderer as the `end-card` part: the logo file as-is, never recoloured; a
  low-contrast logo sits on a plate; brand colours and fonts; the brand's call to action and URL) for 2.5 s,
  crossfaded in over 0.3 s, at the cut's size and frame rate.
- **Sound under the card**: the cut's sound plays to its end and fades out over the crossfade; the card holds
  in silence. A style that wants its music to run under the card draws the card with `end-card` before
  `audio-mix` (then this layer passes the cut through).
- Otherwise the cut passes through untouched (the same file). The card clip is drawn in scratch; only the
  branded cut is left as output.
- **Outputs**: `video`, `timeline` (longer by the card, with an `end-card` scene and `end_card` set).

Source: `parts/brand-layer/src/part.mjs` with `parts/_lib/end-card.mjs`.

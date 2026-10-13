# brand-layer 1.0.2

The brand layer (slot 1 of 4): ends the video on the brand. Free; needs the kit's browser.

- When `expect.end_card` is true and no timeline step drew a card (`timeline.end_card` is absent), it appends
  the brand end card (the same renderer as the `end-card` part's `classic` layout: the logo fitted to the card,
  brand colours and fonts, the brand's call to action and URL) for 2.5 s, crossfaded in over 0.3 s, at the
  cut's size and frame rate.
- **Logo (1.0.2)**: never recoloured or redrawn, but fitted. A flat white, grey or black background the file
  carries is made transparent (only the part touching the edge; the mark is kept), empty margins are trimmed,
  and the mark is scaled, up as well as down, into its box: a wide mark (2:1 or wider) is min(640 px, 0.58 W)
  wide, any other min(320 px, 0.17 H) tall, at 1080x1920. When the mark still reads under 3:1 on the card, the
  card changes colour (the logo file's own background, else the brand colour with the most contrast, else
  #111111 or #F5F3EE) and its text and CTA colours follow; there is no plate any more. A logo drawn at more
  than 1.5 times its file size is logged as a warning (it may look soft: the brand needs a bigger logo file).
- **Sound under the card**: the cut's sound plays to its end and fades out over the crossfade; the card holds
  in silence. A style that wants its music to run under the card draws the card with `end-card` before
  `audio-mix` (then this layer passes the cut through).
- Otherwise the cut passes through untouched (the same file). The card clip is drawn in scratch; only the
  branded cut is left as output.
- **keep_clear (1.0.2)**: a timeline's `keep_clear` (where a step drew the product) is taken and passed on
  unchanged to the captions layer, which reads it.
- **Outputs**: `video`, `timeline` (longer by the card, with an `end-card` scene and `end_card` set, and in
  1.0.2 `safe_zones` use `logo`: the box the logo file covers on the card, so the final check looks for it
  there).

Source: `parts/brand-layer/src/part.mjs` with `parts/_lib/end-card.mjs`.

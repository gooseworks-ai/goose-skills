# end-card 1.0.1

The brand end card as a clip, for styles that draw the card in their own timeline (for example so the music runs
under it: put this step before `audio-mix`). The brand layer uses the same renderer to append the card when no
step drew one. Free; needs the kit's browser.

- **Logo**: the brand's logo file as-is, never recoloured, redrawn or stretched. A logo that barely contrasts
  with the card (under 3:1) sits on a plate of the opposite tone instead. No logo: the brand name in its font.
- **Colours**: card background from `background`, else the brand's background, else white; text from
  `foreground`, else the brand's text colour, else black or white for contrast; the call-to-action pill from
  `cta_background`, else the brand's primary colour.
- **Fonts**: the brand's heading and body fonts; without them the bundled Montserrat Bold (SIL Open Font
  License). Never a system font.
- **Copy** (approved copy only): `cta_text` (default the brand's call to action; required), `url_text`
  (default the brand's URL), `headline`, `proof` (stars only with proof text), up to three `benefits`,
  `footnote`. `image` replaces the drawn card with approved complete artwork.
- **Clip**: `seconds` (default 2.5) at `width` x `height`, `fps` (default 30), with a silent stereo track so
  it joins and mixes like any clip.
- **Outputs**: `video`, `seconds`, `timeline` with `end_card` set.

Source: `parts/end-card/src/part.mjs` with `parts/_lib/end-card.mjs`.

# end-card 1.1.0

The brand end card as a clip, for styles that draw the card in their own timeline (for example so the music runs
under it: put this step before `audio-mix`). The brand layer uses the 1.0.1 renderer to append the card when no
step drew one. Free; needs the kit's browser.

## Layouts (`layout`, default `classic`)

| Layout | Draws | Call to action |
|---|---|---|
| `classic` | The 1.0.1 card, unchanged: logo, headline, proof, benefits, CTA pill, URL, footnote. `image` replaces it. | required |
| `brandkit` | Logo (mark), brand name (wordmark), rule, tagline (`headline`), `rows`, CTA pill, URL. | required |
| `editorial` | Type only, left aligned: brand name, rule, tagline, `rows`, URL. No logo. | optional; shown as text only when `cta_text` is given |
| `stack` | Logo (or the brand name) over the URL. | none |
| `statement` | Logo over 1 to 3 `rows` (or the `headline` as one row): the first row in the text colour, the rest in the accent. URL only when `url_text` is given. | optional; shown only when `cta_text` is given |
| `none` | Nothing. **The step returns no outputs**, so every input bound to them is left out (a style's "no card" answer). The brand layer still appends its classic card when the style sets `traits.end_card: true`, so a style that offers `none` must leave that trait off. | - |

- **Rows**: up to 3 approved lines, up to 60 characters each, as a list or one `' | '`-joined text answer
  (`"Don't be scared. | It's just water."`).
- **Refusals** (`bad_input`): a layout given copy it does not draw (for example `proof` with `brandkit`, `rows`
  with `classic` or `stack`), more than 3 rows, a `statement` with no rows and no headline (or with both), a
  `classic` or `brandkit` card with no call to action.
- **Logo**: the brand's logo file as-is, never recoloured, redrawn or stretched. A logo that barely contrasts
  with the card (under 3:1) sits on a plate of the opposite tone instead. No logo: the brand name in its font.
- **Colours**: card background from `background`, else the brand's background, else white. In the 1.1.0
  layouts the text is `foreground`, else the brand's text colour **when it reads on the card (4.5:1)**, else
  black or white; the `accent` (rule, statement rows after the first) is `accent`, else the brand's primary or
  secondary colour when it reads (3:1), else the text colour. `classic` keeps the 1.0.1 colour rules.
- **Fonts**: the brand's heading and body fonts; without them the bundled Montserrat Bold (SIL Open Font
  License). Never a system font.
- **Clip**: `seconds` (default 2.5) at `width` x `height`, `fps` (default 30), with a silent stereo track so
  it joins and mixes like any clip.
- **Outputs**: `video`, `seconds`, `timeline` with `end_card` set; none at all with `layout: none`.

Source: `parts/end-card/src/part.mjs` and `src/layouts.mjs`, with `parts/_lib/end-card.mjs` for `classic`.

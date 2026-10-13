# end-card 1.1.1

The brand end card as a clip, for styles that draw the card in their own timeline (for example so the music runs
under it: put this step before `audio-mix`). The brand layer uses the `classic` renderer to append the card when no
step drew one. Free; needs the kit's browser.

## Layouts (`layout`, default `classic`)

| Layout | Draws | Call to action |
|---|---|---|
| `classic` | The 1.0.1 card: logo, headline, proof, benefits, CTA pill, URL, footnote. `image` replaces it. | required |
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
- **Logo (1.1.1, every layout that draws one)**: never recoloured, redrawn or stretched, but fitted. A flat
  white, grey or black background the file carries is made transparent (only the part touching the edge; the
  mark is kept, its anti-aliased rim feathered), empty margins are trimmed, and the mark is scaled, up as well
  as down, into the layout's box by its shape (at 1080x1920, scaled with the card):

  | Layout | Wide mark (2:1 or wider) | Any other mark |
  |---|---|---|
  | `classic` | min(640 px, 0.58 W) wide | min(320 px, 0.17 H) tall |
  | `brandkit` | min(520 px, 0.50 W) wide | min(300 px, 0.16 H) tall |
  | `stack` | min(720 px, 0.66 W) wide | min(420 px, 0.22 H) tall |
  | `statement` | min(720 px, 0.66 W) wide | min(300 px, 0.16 H) tall |

  When the mark still reads under 3:1 on the card, the whole card changes colour instead of the 1.1.0 plate:
  the logo file's own background, else the brand colour with the most contrast, else #111111 or #F5F3EE. The
  text, accent and CTA colours are then kept only where they read on the new card. A logo drawn at more than
  1.5 times its file size is logged as a warning (it may look soft: the brand needs a bigger logo file). An SVG logo is drawn from its vector, so it stays sharp at any size.
  Background the file left inside the mark (the counters of o, e, a) is cleared too when the card ends up another colour, so no white shows inside the letters; a large enclosed patch, or any in a solid mark (a badge, white letters on a coloured box), is the mark's own and kept. No logo: the brand name in its font.
- **Colours**: card background from `background`, else the brand's background, else white. In the 1.1.0
  layouts the text is `foreground`, else the brand's text colour **when it reads on the card (4.5:1)**, else
  black or white; the `accent` (rule, statement rows after the first) is `accent`, else the brand's primary or
  secondary colour when it reads (3:1), else the text colour. `classic` keeps the 1.0.1 colour rules.
- **Fonts**: the brand's heading and body fonts; without them the bundled Montserrat Bold (SIL Open Font
  License). Never a system font.
- **Clip**: `seconds` (default 2.5) at `width` x `height`, `fps` (default 30), with a silent stereo track so
  it joins and mixes like any clip.
- **Outputs**: `video`, `seconds`, `timeline` with `end_card` set and, when a logo is drawn (1.1.1),
  `safe_zones` use `logo`: the box the logo file covers, its trimmed margins included, which `assemble` carries
  onto the cut so the final check looks for the logo there. The box is declared only when the whole file (its trimmed margins too) sits on the card and the card's other text barely touches it; a file with wider margins declares none (logged), and the final check searches the whole frame for it. None at all with `layout: none`.

Source: `parts/end-card/src/part.mjs` and `src/layouts.mjs`, with `parts/_lib/end-card.mjs` for `classic`.

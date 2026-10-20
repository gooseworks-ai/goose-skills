# Fonts and colour — pick type that looks like an ad, not a default

**In short**
- The composer sets type and colour the server's way: the kit's font in its `Typography:` line plus a font specimen (`composer.md` §6.3, `font-specimen.md`), and a colour scheme dealt per ad from the kit (`composer.md` §3). This file does not replace that.
- **One improvement:** when the brand font resolves to a plain system face (Inter, Arial, Helvetica, Roboto, a generic sans) for a designed headline, offer 2–3 pairings from §2 at Step 2, one suggested; the chosen pairing goes into the composer's `Typography:` line and the specimen (the `make-static-ads-compose` skill (`../../make-static-ads-compose/SKILL.md`)).
- The same pairings are the font options for copy variants (the `make-static-ads-copy-variants` skill (`../../make-static-ads-copy-variants/SKILL.md`)). Every font here is free on Google Fonts, so the specimen and the layers method can set it exactly.


## 1. The font question (Step 2) and what each answer does

| Answer | What the composer gets (`composer.md` §6.3, `font-specimen.md`) |
|---|---|
| **Brand font** — offered only when it is on Google Fonts or has a metric clone (`font-specimen.md` §3), the only faces the specimen can set | The family in the `Typography:` line and a font specimen rendered in it |
| **Pick one of 2–3 fonts** that suit the brand (§2, one suggested) | The pairing in the `Typography:` line and a specimen rendered in it (all are Google Fonts) |
| **No specific font** | No family named and no specimen: replace the composer's TYPOGRAPHY instruction with "set all text in a clean, legible typeface that suits the brand and the layout" |

A brand font with no Google Fonts match or metric clone is never named to the image model: it cannot draw a font it doesn't know, and naming it produces a lookalike. Offer a pairing or no specific font instead. Never Inter, Arial, Helvetica or Roboto as a designed headline unless the marketer chose it; never more than two families; no light weights for the hook.

## 2. Pairings by brand type (headline / body)

| Brand type | Pairing A | Pairing B | Pairing C | Feel |
|---|---|---|---|---|
| **Wellness, supplements, clean beauty** | Fraunces / DM Sans | Playfair Display / Manrope | Young Serif / Work Sans | Warm, trustworthy, a little editorial |
| **Luxury beauty, fashion, jewellery** | Cormorant Garamond / Jost | Bodoni Moda / Montserrat | Italiana / Lato | Thin-thick contrast, quiet, premium |
| **Fitness, sport, energy, men's grooming** | Anton / Barlow | Bebas Neue / Inter Tight | Archivo Black / Archivo | Condensed, loud, high contrast |
| **Food, drink, snacks, CPG** | Bricolage Grotesque / Nunito Sans | Rubik / Karla | Lilita One / Poppins | Round, friendly, appetising |
| **Kids, pets, playful brands** | Baloo 2 / Quicksand | Fredoka / Nunito | Chewy / Open Sans | Soft, bouncy |
| **B2B SaaS, fintech, developer tools** | Space Grotesk / IBM Plex Sans | Sora / Inter Tight | Manrope / Source Sans 3 | Precise, modern, calm |
| **Home, furniture, lifestyle** | DM Serif Display / DM Sans | Libre Caslon Display / Mulish | Gloock / Figtree | Editorial, homely |
| **Streetwear, music, Gen-Z** | Unbounded / Space Mono | Syne / Outfit | Rubik Mono One / Rubik | Wide, graphic, a bit raw |
| **Health clinics, finance, legal (trust first)** | Source Serif 4 / Source Sans 3 | Merriweather / Lato | Lora / Plus Jakarta Sans | Steady, readable, no gimmicks |
| **Handwritten accents** (founder note, sticky note, annotations) | Caveat | Kalam | Permanent Marker (shouty only) | Personal — one short line, never body text |

Pick by the ad's visual style too: a lo-fi native ad wants a plain or system-like face; a hi-fi polished ad wants a serif or a refined sans; a designed graphic can carry the loudest display face.

## 3. Close free matches for common paid brand fonts

For the layers method of copy variants only (the font specimen follows its own server alias rules, `font-specimen.md` §3).

| Paid font | Free match |
|---|---|
| Futura | Jost |
| Gotham, Proxima Nova | Montserrat |
| Helvetica Neue, SF Pro (as headline) | Inter Tight |
| Avenir | Nunito Sans |
| GT America, Graphik | Figtree |
| Canela, Recoleta | Fraunces, Young Serif |
| Didot, Bodoni | Bodoni Moda |
| Garamond | EB Garamond |
| Circular | DM Sans |
| Brandon Grotesque | Josefin Sans |

## 4. Colour — the colour question (Step 2) and what each answer does

| Answer | What the composer gets |
|---|---|
| **Brand colours** (default) | `apply_brand_colors` on; the scheme dealt per ad from the kit (`composer.md` §3) |
| **The template's colours** | The brand's own template: `apply_brand_colors` off (KEEP SOURCE). Another brand's template: GooseWorks never copies another brand's exact colours, so the agent keeps the template's light/dark structure and mood and picks a close palette of its own — say so once |
| **A fresh palette** | The agent picks a new palette per ad (background, text, accent as hex), different on every ad, text-to-background contrast at least 4.5:1, logo placed on an area where its real colours read; it goes in the composer's COLORS line as the assigned scheme |

Across a set, at least two background tones (light and dark) so the ads don't blur together. Never imitate a platform's UI colours, never lead with a competitor's signature colour.

## 5. Logo — the logo question (Step 2)

With logo → the kit logo is attached and placed where the template's logo sits, or a calm corner when the template has none; it keeps its own colours — when the assigned background would hide it, the agent moves it to a contrasting area or changes that ad's scheme, never recolours it. No logo → `no_logo` on. A brand `must` ("wordmark in every ad") beats the answer; say so.

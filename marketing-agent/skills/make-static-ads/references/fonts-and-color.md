# Fonts and colour — pick type that looks like an ad, not a default

**In short**
- Type and colour go into the prompt's shared foundation (`prompts.md` §2) as words: the font family by name plus a description of its look, and the palette as named colours or hex.
- When the brand font is a plain system face (Inter, Arial, Helvetica, Roboto) for a designed headline, or a paid font the image model won't know, offer 2–3 pairings from §2 at Step 2, one suggested.
- The same pairings are the font options for copy variants (the `make-static-ads-copy-variants` skill (`../../make-static-ads-copy-variants/SKILL.md`)).

## 1. The font question (Step 2) and what each answer does

| Answer | What goes in the prompt |
|---|---|
| **Brand font**, when it is a Google Font or has a close free match (§3) | The family by name and its look ("a heavy condensed serif, black") |
| **One of 2–3 pairings** (§2, one suggested) | The pairing's families and its "feel" |
| **No specific font** | "Set all text in a clean, legible typeface that suits the brand and the scene" |

Never name a font the model can't know; describe its look instead. Never Inter, Arial, Helvetica or Roboto as a designed headline unless the marketer chose it; never more than two families; no light weights for the hook.

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

The Step 2 suggestion when the brand's font isn't on Google Fonts, and the layers method of copy variants.

| Paid font | Free match |
|---|---|
| Futura | Jost |
| Gotham, Proxima Nova | Montserrat |
| Helvetica Neue, SF Pro (as headline) | Inter Tight |
| Avenir | Nunito Sans |
| GT America, Graphik | Figtree |
| Canela, Recoleta | Fraunces, Young Serif |
| Didot, Bodoni | Bodoni Moda |
| Garamond, ITC Garamond (incl. Condensed) | EB Garamond |
| Circular | DM Sans |
| Brandon Grotesque | Josefin Sans |

## 4. Colour — the colour question (Step 2) and what each answer does

| Answer | What goes in the prompt |
|---|---|
| **Brand colours** (default) | The kit's colours, used selectively; vary the background across ads |
| **The brand's running-ads colours** | The palette read from the running ads (background, text, accent). Offer once to save it as a look rule through the `save-learning` skill |
| **A fresh palette** | A palette per ad, text-to-background contrast at least 4.5:1, logo on an area where its real colours read |

The product's own packaging colours often make the best palette: the scenes then feel like the brand without a template.

Across a set, at least two background tones (light and dark) so the ads don't blur together. Never imitate a platform's UI colours, never lead with a competitor's signature colour.

## 5. Logo — the logo question (Step 2)

With logo → attach the kit logo file and say where it sits (a calm corner or the footer); it keeps its own colours. When the background would hide it, move it or change that ad's background, never recolour it. No logo → say "no logo" in the prompt; the product's own label still shows the brand. A brand `must` ("wordmark in every ad") beats the answer; say so.

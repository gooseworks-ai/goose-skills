# End-card recipe — what makes the brand slate land

The end card is the 3.5s payoff at the end of every iMessage ad. Get it wrong and the entire conversational setup feels like it was for nothing. Three hard rules and a small set of taste calls.

## Hard rules

1. **Use the real brand wordmark, never styled text.** CSS approximations look amateur even when typeface and kerning are close. Drop the official SVG (Wikimedia Commons, brandfetch.com/<brand>.com, or the brand's press kit) at `assets/<brand>-logo.svg`. The bundled `render-end-card.template.js` strips the XML prolog and injects via the `<!--{{BRAND_LOGO_SVG}}-->` placeholder. Your only job is to color the paths (`.logo svg path { fill: #fff }` or `#000`).
2. **Static. No Ken-Burns.** The brand slate must land hard. A drifting end card reads as filler and undercuts the punch of the CTA reveal. The bundled template's ffmpeg invocation is `-vf "scale=720:1280,format=yuv420p"` — no zoompan.
3. **≤3 lines of text.** Logo + 1-line offer + code. Anything more reads as a media-buy template and not an iMessage payoff. If you have legal copy, shrink it well below the CTA and treat it as fine print.

## End-card variants — which to pick

The molecule ships two templates. Pick by brand voice, not by aesthetic preference.

| Template | When to pick |
|---|---|
| `end-card.template.html` (abstract glow + product) | Brand voice is playful or product-led. Hook is a *thing* (a card, a product, a UI). CatchBack is the canonical example. |
| `end-card-photo-bg.template.html` (athlete/persona photo) | Brand voice is grounded or lifestyle-led. Hook is a *person* doing the activity. Peloton is the canonical example. |

You can also write your own. The only hard rules are above.

## CTA pill — color from the brand primary

The pill containing the offer code should be the brand's **primary color**, not a neutral black/grey.

- Peloton red `#E1251B` → red pill, white text, `box-shadow: 0 12px 40px rgba(225,37,27,0.45)`
- CatchBack gold `#f5c842` → black pill with gold text (one notable inversion: when the brand color is *yellow*, white-on-yellow has insufficient contrast; flip to dark pill + brand text)

Default to `box-shadow: 0 12px 40px rgba(<brand_rgb>, 0.45), 0 4px 16px rgba(0,0,0,0.5)`. No border.

## Logo contrast — the two-trick combo

White logo on a photo background is the most common contrast hazard. Either trick alone is insufficient; you need both:

1. **Top scrim gradient** that's nearly opaque at the top edge:

   ```css
   .scrim {
     background: linear-gradient(180deg,
       rgba(0,0,0,0.98) 0%,
       rgba(0,0,0,0.92) 8%,
       rgba(0,0,0,0.55) 18%,
       rgba(0,0,0,0.10) 35%,
       rgba(0,0,0,0.0) 50%,
       rgba(0,0,0,0.50) 78%,
       rgba(0,0,0,0.96) 100%);
   }
   ```

2. **Drop-shadow filter** on the SVG itself:

   ```css
   .logo { filter: drop-shadow(0 2px 12px rgba(0,0,0,0.95)); }
   ```

Without the drop-shadow the logo washes out wherever the underlying photo is light. Without the scrim the photo's natural contrast eats the SVG strokes.

## Photo background — composition rules

When using the photo-bg template:

- The hero subject should be in the **middle third** of the photo. Top and bottom of the frame must have negative space the scrim can darken without destroying the subject.
- **Desaturate slightly** (`filter: saturate(0.85) brightness(0.78)`) so the text always wins. Original-saturation photos compete with the CTA pill.
- Anchor `background-position: center 30%` for portrait-oriented athletic shots — head/face above center, legs/equipment below. Adjust per photo.

## CTA copy

- **One offer line above the code.** "30 days free trial. No commitment." > "Try Peloton at home for 30 days. No commitment, cancel anytime."
- **Code is ALL CAPS, monospace-feeling, letter-spaced wide.** `letter-spacing: 6px–8px`, `font-feature-settings: "tnum" 1`.
- **No URL on the card** unless the brand insists. The code is enough — the viewer remembers it. URLs read as media-buy template energy.

## Things to NEVER do on an end card

- Animate the logo
- Ken-Burns on the background photo
- Multiple CTAs (one code, one offer, period)
- Border around the pill
- Sub-headlines that aren't the offer line
- Watermarks, hashtags, or @-mentions
- "Available on the App Store" badges

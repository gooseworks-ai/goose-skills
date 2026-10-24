---
name: render-logo-equation-card
description: Render the logo-equation card ad (7s, 9:16) — partner icon + brand icon joined by a plus sign as an equation, a two-line "= outcome" headline, four numbered steps, and a CTA that hard-cuts in at 2s, on a static black card over timelapse b-roll, no voice. render_card.py draws the two card plates with measured geometry and hard guardrails (the user must confirm the integration is real, no partnership/endorsement/ranking words, no comment-bait CTA, no dashes); compose.py lays the card over the b-roll sped up to read as a timelapse, with an optional bed; measure_motion.py gates the b-roll (a real-time shot reads as a photo). Free, local.
status: active
---

# render-logo-equation-card

A card-led format: everything the viewer reads is on a static black card in the top third;
under it, b-roll moves like a timelapse to stop the scroll. One animated event: the CTA line
hard-cuts in at 2.0s. No voice, no captions, no cuts.

## Run

```bash
python render_card.py card.json --out-dir work/            # card-no-cta.png, card-with-cta.png
python compose.py --broll broll.mp4 --cards work/ --out ad.mp4 --in 3 --speed 4 [--bed bed.mp3]
python measure_motion.py ad.mp4 --cta-at 2.0              # exit 1 = reject
```

`card.json`:

```json
{"logos": ["partner-icon.png", "brand-icon.png"],
 "partner": {"name": "Slack", "integration_confirmed": true},
 "headline": ["= your standup, written", "before anyone opens Slack"],
 "steps": ["1. Connect your Slack workspace", "2. ...", "3. ...", "4. ..."],
 "cta": "Try it free at example.com"}
```

The Slack standup card above is an illustration of the schema, not a default: the headline,
the partner and the steps come from the user's brand and choices.

## Choices

The recipe asks these before any paid step; this renderer only draws what `card.json` and the
flags say. The demo's value is an example, never a default:

- **`headline_angle`** — what the "= …" headline promises (time saved, a pain removed, a new
  ability, one workflow in one place). Sets `card.json` `headline` + `steps`. Demo: time saved
  ("= your standup, written before anyone opens Slack").
- **`broll_subject`** — what the timelapse b-roll shows (the product in use, the team working,
  a workspace, customers). Picks the `--broll` clip and window. Demo: the brand's own footage of
  work happening.
- **`music`** — the optional `--bed` (built from the music choice, instrumental, no artist
  names) or none (ship silent). Demo: driving minimal electronic, ~144 BPM.

## Guardrails (enforced by render_card.py)

Two logos side by side already imply a link between the companies. The platform names
another brand only as plain co-existence ("works with"), never as an endorsement,
partnership or ranking. So:

1. **`partner.integration_confirmed: true` or no card.** Only when the user confirms the
   product really works with the partner (an integration, a plugin, an import).
2. **No relationship words**: partner, partnership, official, endorsed, certified,
   approved by, recommended by, #1, best. Say what the product does with the partner.
3. **The CTA is the brand's own**, never names the partner, and is never comment-bait
   ("comment X and I'll send the link"): nothing replies to comments.
4. **Exactly two logos (square app icons, partner left), two headline lines starting "= ",
   four steps of 5-8 words, no em or en dashes.** The renderer fails on any of these and on
   copy that does not fit the card at its real size.
5. **Icons are real files the user supplied or confirmed**: the partner's own app icon
   (from their site or press kit), the brand's from its kit. Never draw or generate a logo.

## Rules for the b-roll

1. **It is a TIMELAPSE.** A locked-off real-time shot measures ~18x less motion than the
   reference and reads as a still photo. Use `--speed` (3-8x) on real footage: the brand's
   own clip of the product in use, a team at work, a workspace. `measure_motion.py` rejects
   a mean under 1.5.
2. **Never use footage lifted from another company's ad**, and never restyle one.
3. **Text-to-video cannot make this shot**: it renders one moment, so screens and people
   never change over the clip. If there is no real footage, ask the user for some.
4. **Cover the band** (`--fit cover`, the default); `width` leaves black around a landscape
   clip.
5. **Flat, high-contrast screens survive; photographic wallpapers and thumbnail grids
   smear** if the clip was ever generated or restyled.

## Audio

Optional `--bed` (e.g. create-music-elevenlabs, instrumental, 8s), normalised to -15 LUFS
with a short fade. An organic post can go out silent and take a track in-platform.

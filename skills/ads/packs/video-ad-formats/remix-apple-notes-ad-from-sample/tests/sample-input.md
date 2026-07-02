# Sample input — remix-apple-notes-ad-from-sample

Paste-prompt shape (what the app generates):

> Use the ads-remix skill to finish video ad project `c2a7…` : read the project and its source
> template, make sure the brand is researched, then produce the final video ad and save it.

Backing rows the skill fetches:

- **Project**: `{ id: "c2a7…", brand_id: "b1…", source_sample_id: "s9d…", format_key: "apple-notes", status: "draft" }`
- **Sample** (`get_ad_template`): `recipe.note` (grounded in the Bioma "subscriptions to cancel"
  reference build) =
  ```json
  {
    "title": "Subscriptions to cancel",
    "pre_typed_body": [
      { "type": "paragraph", "text": "• Seed: $50/mo" },
      { "type": "paragraph", "text": "• Athletic Greens: $79/mo" }
    ],
    "typed_body": [
      { "type": "paragraph", "text": "• AG1", "type_seconds": 0.8, "pre_pause_seconds": 0.9 },
      { "type": "paragraph", "text": "Replacing all 3 with:", "type_seconds": 1.4, "pre_pause_seconds": 0.7 },
      { "type": "paragraph", "text": "Bioma — $26/bottle on the 6-month plan.", "type_seconds": 2.4, "pre_pause_seconds": 0.5 },
      { "type": "paragraph", "text": "probiotic. prebiotic. postbiotic.", "type_seconds": 2.0, "pre_pause_seconds": 0.7, "autocorrect_underline": ["postbiotic"] },
      { "type": "paragraph", "text": "one delayed-release capsule.", "type_seconds": 1.7, "pre_pause_seconds": 0.4 },
      { "type": "paragraph", "text": "doing the math.", "type_seconds": 0.9, "pre_pause_seconds": 0.8 }
    ],
    "post_hold_seconds": 1.2,
    "status_bar": { "time": "9:41", "battery_pct": 73, "battery_low": false },
    "keyboard_state": { "suggestions": ["The", "I", "•"], "shift": "upper" },
    "music_bed_path": "audio/music-bed.mp3",
    "end_card": {
      "headline_pre": "THE POWER OF", "headline_underlined": "POWER",
      "headline_main": "1 CAPSULE", "headline_circled": "1",
      "product_image": "assets/product-bottle.png",
      "checklist": [
        { "label": "PROBIOTIC",  "value": "boosted" },
        { "label": "PREBIOTIC",  "value": "fed" },
        { "label": "POSTBIOTIC", "value": "repaired" }
      ],
      "background_color": "#eee3d6", "ink_color": "#1d3d39"
    }
  }
  ```
- **Brand**: researched pack for `acme-supps` (voice: calm, considered; wordmark SVG + product
  bottle in `brand-assets/`; code `ACME10`).
- **Optional `angle`**: "frame it as a money-saving memo to self, code ACME10".

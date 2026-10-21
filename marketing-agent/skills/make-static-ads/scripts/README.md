# Scripts

- **`compose.py`** builds the composer input for one ad and turns the composer's answer into the final prompt and image list per ratio. It does the copying and bookkeeping of `../references/composer.md` §5, §6, §8, §9 (insertion only) and §10, so no agent re-types that text by hand.
- **The agent still writes the answer.** It reads the input and answers it as the composer would (`composer.md` §7). `compose.py` never writes the ad.
- **`schemes.py`** deals the colour scheme per ad (`composer.md` §3). **`specimen.py`** renders the font card (`font-specimen.md`).
- All three are Python 3, standard library only (`specimen.py` also needs Pillow).

## compose.py in four steps

| Step | Command | Writes |
|---|---|---|
| 1. Fill `ad.json` for the ad | (by hand, schema below) | `ad.json` |
| 2. Build the composer input | `python3 compose.py input ad.json > compose-input.txt` | the exact text the server would send |
| 3. Answer it as the composer | (the agent; normal path: view `template.source_image_url` first) | `answer.json` |
| 4. Build the final prompts | `python3 compose.py final ad.json answer.json > final.json` | per ratio: `prompt`, `image_urls`, ready `ads_render` arguments with `dry_run: true` |

- **Font specimen.** When `final.json` says `font_specimen.eligible` and nothing is inserted yet, make the card from `specimen_input_prompt` (`font-specimen.md`), put its URL in `ad.json` as `font_specimen_url`, and run step 4 again.
- **Errors stop the ad, as on the server.** A `{{ref:ID}}` that is not in `reference_ids`, or that the reference gate removed, exits with a message. Fix `answer.json` and run step 4 again.
- **Warnings** (in `final.json` and on stderr) say where the server would quietly change something: a forced brand colour or font, a dropped reference, a too-long prompt.

## ad.json

One ad. Copy tool answers in as they come back; do not rewrite them. The full field list is at the top of `compose.py`.

| Field | From | Notes |
|---|---|---|
| `brand_id` | the brand | copied into `ads_render` |
| `kit` | `brand_read` kit, `detail: "full"` | camelCase, as returned |
| `learnings` | `brand_read` learnings | rows in the order returned |
| `template` | `ads_template_read` | add `brand_owned: false` for any other brand's ad (departure 5) |
| `structure` | `structure-blueprint.md` | structure-only only: `blueprint_instruction`, `media_slot`, `reduced_mechanic` (departure 2) |
| `product_name`, `product` | the pick; `brand_read` products item | `product` fields win over the kit's product entry |
| `user_uploads` | images from chat, after `media_upload` | public https URLs |
| `no_logo`, `apply_brand_colors` | Step 2 answers | |
| `scheme` | `schemes.py` output for this ad, or a fresh palette | `null` for no scheme |
| `font` | Step 2 answer | `brand`, `template`, `pairing` (+ `font_pairing`, departure 3) or `none` (departure 4) |
| `proof_points` | the featured product's usable facts | departure 1 (product-led brands only) |
| `user_instructions` | the marketer's own chat words | unchanged |
| `variant` | `{"brief": {"angle": "problem", "message": "..."}}` | `angle` is a `VARIANT_BRIEF_ANGLE_COPY` key |
| `ratios` | the ad's placements | `1:1`, `4:5`, `9:16`, `16:9`, `3:4` |
| `engine`, `font_specimen_url`, `unavailable_reference_ids`, `content_policy_recompose` | later steps | departure 6 is recorded only |

Worked example (a made-up brand): `example-ad.json` and `example-answer.json`.

```bash
python3 compose.py input example-ad.json
python3 compose.py final example-ad.json example-answer.json
```

## Tests

```bash
python3 -m unittest      # run in this folder
```

`test_compose.py` reads every fenced block of `composer.md` §5, §6, §8 and §10, fills in its values, and checks the block appears word for word in the output when its condition holds and is absent when it does not. A new or changed block in `composer.md` fails the test until it has a checker.

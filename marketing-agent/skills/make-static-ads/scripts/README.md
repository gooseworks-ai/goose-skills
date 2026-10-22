# Scripts

- **`compose.py`** prepares bounded input files with a receipt, then builds the composer input for one ad and turns the composer's answer into the final prompt and image list per ratio. It does the copying and bookkeeping of `../references/composer.md` §5, §6, §8, §9 (insertion only) and §10, so no agent re-types that text by hand.
- **The agent still writes the answer.** It reads the input and answers it as the composer would (`composer.md` §7). `compose.py` never writes the ad.
- **`schemes.py`** deals the colour scheme per ad (`composer.md` §3). **`specimen.py`** renders the font card (`font-specimen.md`).
- Compose/schemes use Python 3 standard library; specimen also needs Pillow. The optional local `repair_patch.py` uses numpy and OpenCV. Use an existing authorized environment; if unavailable, leave the image unapproved and use the playbook's quoted-remake path rather than silently adding a service or spending.

## compose.py in four steps

| Step | Command | Writes |
|---|---|---|
| 1. Fill `ad.json` for the ad | (by hand, schema below) | `ad.json` |
| 2. Build the composer input | `python3 compose.py prepare ad.json --output-dir prepared > prepared.json` | a manifest of input parts, each at most 6,000 characters |
| 3. Answer it as the composer | (read every `files_to_read` part in manifest order; on the normal layout path also view the source image) | `answer.json` |
| 4. Build the final prompts | `python3 compose.py final ad.json answer.json > final.json` | per ratio: `prompt`, `image_urls`, ready `ads_render` arguments with `dry_run: true` |

- **Reading once safely.** Later ads may use `--reuse-rules <shared_rules_sha256>` only when that exact rules hash was already read in this conversation. New or changed rules are returned in full. Every ad context is returned in full, split into parts; read every part. This avoids silent truncation of huge kits and does not ask the agent to diff large prompts by hand. In a fresh conversation, read the rules again.
- **Input receipt.** Copy `input_sha256` from the prepared manifest into `answer.json`. `final` rejects stale or missing receipts and unknown template ownership. This proves which input an answer belongs to; it cannot prove reading, judgment, claim truth, or image quality. `input` remains the legacy plain-text/parity inspection command.
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
| `template` | `ads_template_read` | explicit `brand_owned: true` only with confirmed ownership; false for other or uncertain sources (departure 5) |
| `structure` | `structure-blueprint.md` | structure-only only: `blueprint_instruction`, `media_slot`, `reduced_mechanic` (departure 2) |
| `product_name`, `product` | the pick; `brand_read` products item | `product` fields win over the kit's product entry |
| `user_uploads` | images from chat, after `media_upload` | public https URLs |
| `no_logo`, `apply_brand_colors` | Step 2 answers | |
| `scheme` | `schemes.py` output for this ad, or a fresh palette | `null` for no scheme |
| `font` | Step 2 answer | `brand`, `template`, `pairing` (+ `font_pairing`, departure 3) or `none` (departure 4) |
| `proof_points` | the featured product's usable facts | departure 1 (product-led brands only) |
| `user_instructions` | the marketer's own chat words | unchanged |
| `creative_direction` | the selected concept and approved copy | required for a fresh concept; schema below |
| `variant` | `{"brief": {"angle": "problem", "message": "..."}}` | `angle` is a `VARIANT_BRIEF_ANGLE_COPY` key |
| `ratios` | the ad's placements | `1:1`, `4:5`, `9:16`, `16:9`, `3:4` |
| `engine`, `font_specimen_url`, `unavailable_reference_ids`, `content_policy_recompose` | later steps | departure 6 is recorded only |

## Creative direction

Build the idea before choosing its finish. Record these fields as `ad.json.creative_direction`:

| Field | Meaning |
|---|---|
| `product_truth`, `truth_source` | One usable product fact and the exact source/record supporting it. The claims check still decides whether it may be said. |
| `human_situation`, `situation_basis` | The situation and `research` or `creative_hypothesis`. Research also needs `situation_source`. An imagined situation is never customer evidence. |
| `premise`, `relationship` | One event and why its physical or visual relationship explains the message. |
| `scene` | Camera, action, meaningful props, product position and scale, materials, lighting. This is the authored blueprint for mechanism/craft. Set `structure.media_slot` to `product`, `screen` or `none` for this scene. |
| `protected_decision` | One concrete sentence naming what must remain visible; carry it verbatim into the final prompt. |
| `reference_role`, `reference_contribution` | `layout`, `mechanism` or `craft`, and precisely what this source contributes. A mechanism can be a direct device or a broader relationship; craft alone may influence lighting/materials while the product supplies the metaphor. |
| `direct_competitor` | Explicit boolean. True accepts layout only. Other brands' images stay out of generation inputs in every role. |
| `exact_copy` | List of exact on-image lines (`[]` explicitly requests no added campaign text), written in Step 5. Compose must carry each verbatim, then the claims check clears them before quoting. |

For example, an unsweetened mix supplies a fact about choice. An optional guest makes that choice drawable: the blend's ingredients occupy the table, sugar has a separate extra chair. The chair explains the headline; miniature furniture alone is decoration. A familiar preparation ritual can connect a present kitchen with remembered home; an ordinary domestic window gives the connection a boundary and personal meaning. These are explanations of the Kolkata Chai experiment, not claims about its customers or a recipe to repeat for other brands.

A layout reference may suit a clear product demonstration. A different category's reference may offer a physical device without its layout, or only convincing photographic craft. Select the useful contribution; do not force every reference object into every ad. Preserve real product proportions even when surrounding props change scale. A generated recreation is not pixel-exact packaging.

Worked example (a made-up brand): `example-ad.json` and `example-answer.json`.

```bash
python3 compose.py input example-ad.json
python3 compose.py prepare example-ad.json --output-dir prepared
# Read the files, then add the returned input_sha256 to your answer.
python3 compose.py final example-ad.json answer.json
```

## Tests

```bash
python3 -m unittest      # run in this folder
```

`test_compose.py` reads every fenced block of `composer.md` §5, §6, §8 and §10, fills in its values, and checks the block appears word for word in the output when its condition holds and is absent when it does not. A new or changed block in `composer.md` fails the test until it has a checker.


## Free official-label pixel repair

`repair_patch.py` copies a real label into a manually verified compatible label band. It makes no model or network call. It does not remove backgrounds, match poses, reconstruct a product, invent lettering or fix a wrong silhouette. Review the actual source and candidate by eye; a passed numerical invariant is not an image-quality verdict.

Write a manifest with distinct new paths and explicit confirmations based on the brand's media rights and your visual inspection:

```json
{
  "source_image": "official-product.jpg",
  "base_image": "failed-render.png",
  "output_image": "repair/candidate.png",
  "mask_image": "repair/mask.png",
  "evidence_json": "repair/evidence.json",
  "source_rights_confirmed": true,
  "compatible_pose_reviewed": true,
  "source_band": {"left": [120, 120], "right": [360, 360], "top": [200, 205, 200], "bottom": [600, 605, 600]},
  "target_band": {"left": [80, 75], "right": [200, 195], "top": [150, 153, 150], "bottom": [350, 353, 350]},
  "feather_px": 1.5
}
```

Coordinates are pixels in the full source/base image. `left`/`right` are x coordinates at the top and bottom ends. `top`/`bottom` are y coordinates across the label at left, center and right. The three y guides define each curved boundary; inspect them against the real label edges. The example numbers are illustrative, not a usable brand preset. Use near-front-facing, unoccluded labels with compatible shape and lighting; a severely oblique or differently wrapped label needs another approach.

```bash
python3 repair_patch.py repair-manifest.json
```

The helper validates finite in-bounds, non-crossing geometry and inverse convergence, anti-aliases the source before remapping, feathers within the target boundary and saves a lossless candidate, mask and provenance. It refuses to overwrite the original/source/manifest paths. Every pixel outside the saved mask must remain identical. RGB inputs only; transparent-cutout handling is outside this helper. The agent still checks lettering, edge seams, geometry and lighting at full size.

After a fresh judge passes the full image, upload and save it through the existing GooseWorks tools with its failed creative as parent. Keep both versions and the repair evidence; verify saved media bytes and lineage. This is free local processing plus a free save. Any paid extraction/edit/generation still needs its own applicable quote and approval. An exhausted generation ceiling does not authorize another paid attempt.

# Human version

- **What this is:** a small picture of the ad's own words, set in the brand's real font on a plain white card, attached to the image model as a typing sample. Image models draw a font name in the prompt badly; a sample image works far better.
- **Copied from the server.** The copy-extraction instructions, the font choice per line, the "is this the real font?" test, the card layout and the prompt line are the server's own, from gooseworks-app `origin/dev` (commit `42a3dec20`, read 2026-10-19).
- **Sources:** `apps/api/src/services/ad-font-reference.service.ts` — `FONT_REFERENCE_PROMPT_LINE` 55, `familyForRole` 69, `plannerSchema` 92, `planFontReferenceItems` 112, `renderFontSpecimenPng` 144, `buildFontReferenceImages` 230. `ad-blueprint-composite.service.ts` — `GOOGLE_FONT_ALIASES` 277, `METRIC_CLONES` 326, font lookup 422–560, `createBrandFontResolver` 1883. `ad-remix-pipeline.service.ts` — eligibility and insertion 4697–4758. `lib/fal-image-client.ts` — `engineReadsFontSpecimen` 172.
- **When it runs:** brand font on, an engine that reads samples (GPT Image or nano_banana_pro), and fewer than 6 images already attached.
- **Honest only:** a line goes on the card only if the agent holds the real typeface (an exact Google Fonts match, or a metric-identical clone of Arial, Helvetica, Times, Courier or Georgia). A look-alike never goes on the card; with no real face at all, no card is attached.
- **Gap:** the server prefers the brand's own uploaded font file. No MCP read returns it, so brands with a custom uploaded font get no card from an agent (the prompt still names the font).
- **How:** the agent picks the lines, runs `scripts/specimen.py` (Python + Pillow, downloads the font from Google), uploads the PNG with `gooseworks:media_upload`, and inserts it as Image 2.

---

# Agent version

## 1. Eligibility (`processCreative` 4697–4712)

Make a specimen only when all hold:
1. `applyBrandFont` is true after the source override (`composer.md` §2.1).
2. The engine reads specimens: `gpt_image_2`, `gpt_image_2_5_flare` (the default), `gpt_image_2_5_sunburst`, or `nano_banana_pro`.
3. The image list from `composer.md` §8.3 has **fewer than 6** images (`min(cap(engine), cap(fallback engine))`, which is 6 for every GPT engine and for nano_banana_pro).
4. This is a new ad, not an edit of an existing render.

Otherwise skip; the `Typography:` line alone names the font.

## 2. Extract the copy lines (`planFontReferenceItems` 112)

Input: the **full final prompt** from `composer.md` §8.5 (manifest included). Answer this instruction with the object below. **Agent adaptation:** the server runs this as a separate model call (Sonnet 4.6); the agent answers it itself, literally.

System instruction (verbatim):
```text
You extract the literal on-image TEXT from an ad-generation prompt so it can be pre-rendered in the brand's real font. Return ONLY text that will actually appear ON the ad (headline, subtitle, offer/CTA, short body). Use the copy VERBATIM — exact spelling, casing, punctuation. Do NOT invent copy, and do NOT include descriptions, colors, or layout notes. If the ad has no visible text, return an empty items array.
```

Output schema (`plannerSchema` 92):

| Field | Values | Server description |
|---|---|---|
| `items[].text` | string | "The EXACT on-ad copy for this text element, verbatim." |
| `items[].role` | `headline`, `subtitle`, `cta`, `body`, `other` | — |
| `items[].font` | `heading`, `body`, `accent` | "Which brand face this copy uses." |
| `items[].weight` | number 100–900 | "Font weight 100–900 (e.g. 700 for a bold headline)." |

Then, for each item, in order, keeping at most **6**:
- trim `text`; skip it if empty;
- `family = familyForRole(font)` (rules in `composer.md` §6.3, unsanitized); skip the item if null;
- `weight` as given; if missing, 700 for `headline`/`cta`, else 400.

No items → no specimen.

## 3. Which lines may go on the card (`buildFontReferenceImages` 230, resolver 422–560, 1883)

The server resolves each line's family in this order and keeps the line only for sources `brand-upload`, `google-fonts` or `metric-clone`:

1. **Brand upload** — the brand's own font file. **Not reachable by an agent** (no MCP read). Skip this source.
2. **Google Fonts.** `clean = sanitize(family)` (else the raw name trimmed). `mapped = GOOGLE_FONT_ALIASES[clean lower-case]` or `clean`.
   - `mapped` equals `clean` (case-insensitive) and the family exists on Google Fonts → `google-fonts` (keep).
   - `METRIC_CLONES[clean lower-case] == mapped` → `metric-clone` (keep).
   - Anything else (a look-alike such as Futura → Jost, Didot → Playfair Display, or a family Google does not have, which falls back to Inter) → **drop the line**.
3. Weight: try the 4 nearest weights (ties toward bolder) on `fonts.googleapis.com/css2`; if none exists, the best-scoring static `.ttf` in the `google/fonts` GitHub repo, reported at the requested weight (variable files report their default weight).

Aliases (`GOOGLE_FONT_ALIASES`): avenir next / avenir → Montserrat; futura → Jost; helvetica / helvetica neue / arial → Arimo; neue haas / söhne / sohne → Archivo; didot → Playfair Display; georgia → Gelasio; times new roman → Tinos; din condensed / arial narrow → Oswald; menlo → IBM Plex Mono; courier new → Cousine; brush script mt / snell roundhand → Dancing Script.
Metric clones (`METRIC_CLONES`): courier new / courier → Cousine; arial / helvetica / helvetica neue → Arimo; times new roman / times → Tinos; georgia → Gelasio.

No line kept → no specimen ("name-only surgical prompt").

## 4. The card (`renderFontSpecimenPng` 144)

White `#ffffff`, 1200 px wide. Padding 72 px left/right, 64 px top/bottom, 52 px between lines. Per line: a caption `«ROLE» · «resolved family» «served weight»` at 26 px, `#9aa0a6`, in the same face; 12 px below it the copy at 92 px, `#111111`, line height 1.15, word-wrapped to 1056 px. Height cropped to the content. One PNG for all lines (it uses one reference slot).

Run (Python 3 + Pillow; needs network for Google Fonts):

```bash
cat > items.json <<'JSON'
[{"text": "«copy»", "role": "headline", "family": "«familyForRole result»", "weight": 700}]
JSON
python3 scripts/specimen.py items.json specimen.png   # exit 3 = no real face: attach nothing
```

The script is `scripts/specimen.py` in this playbook, byte-for-byte as ported (its header names the server source).

**Chat host without code execution:** an HTML page cannot be screenshotted there either. Skip the specimen and say so; the `Typography:` line still names the font. (A shell host without Pillow may use an HTML page that loads the same Google Fonts family, laid out to §4, screenshotted with a headless browser at 1200 px wide.)

**Look at the PNG before uploading.** It must show every kept line, correctly spelled, in the named face, and nothing else.

## 5. Upload

```json
{
  "brand_id": "«brand_id»",
  "scope": "brand",
  "scope_id": "«brand_id»",
  "kind": "image",
  "source": {"type": "bytes", "filename": "font-specimen-«ad title slug».png", "content_base64": "«base64 of specimen.png»"},
  "title": "Font specimen — «ad title»",
  "tags": ["font-specimen"]
}
```
- `gooseworks:media_upload`. Use `kind: "image"`, **never** `reference`: a brand `reference` joins the kit's reference images, and the composer could later pick the card as a product photo.
- Use the returned `media.url`. It must be a public https URL (`ads_render` takes only those). If it is not, attach no specimen.

## 6. Insert and rebuild (`processCreative` 4724–4748)

1. Insert the URL at index `at = min(1, image_urls.length)` in `image_urls` and a `font_reference` slot at the same index (`composer.md` §8.3). Normal path: Image 2, right after the template. Structure-only: right after the first brand image.
2. Its manifest line (verbatim, from `buildFinalImageManifest`):
```text
Image «n»: FONT SPECIMEN (typography authority) — the ad's exact text copy pre-rendered in the brand's REAL typeface on a plain white card. Every piece of on-image text MUST use this exact typeface — copy its letterforms, proportions, and weight; do not substitute or default to another style. Its white background and gray captions are guides only, never render them.
```
3. Rebuild the final prompt: manifest, blank line, `FONT_REFERENCE_PROMPT_LINE`, blank line, the prompt body with every `{{ref:ID}}` resolved again against the **new** positions (`composer.md` §8.5). `FONT_REFERENCE_PROMPT_LINE` (verbatim, `ad-font-reference.service.ts` 55):
```text
TYPOGRAPHY IS SET BY THE FONT SPECIMEN. One attached reference (labeled FONT SPECIMEN in the image list) shows the ad's exact copy in the brand's real typeface. Every piece of on-image text — headline, subheadline, body, CTA, badges — MUST be set in that EXACT typeface: reproduce its letterforms, proportions, and weight. Do NOT substitute a different or generic font, and do NOT default to a decorative or serif style just because the scene looks premium — match the FONT SPECIMEN. Its plain background and any small gray captions are guides only; never render them into the ad.
```
4. The judge never sees the specimen (`judge.md`).

## 7. Record

In the batch record per ad: the kept lines with resolved family, served weight and source; the dropped families; the specimen URL; or the reason none was made (not eligible, no copy, no real face, brand-upload font not reachable, upload not public).

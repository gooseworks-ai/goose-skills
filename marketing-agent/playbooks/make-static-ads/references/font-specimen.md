# Human version

- **What this is:** a small picture of the ad's own words, set in the brand's real font on a plain white card, attached to the image model as a typing sample. Image models draw a font name in the prompt badly; a sample image works far better.
- **Copied from the server.** The copy-extraction instructions, the font choice per line, the "is this the real font?" test, the card layout and the prompt line are the server's own, from gooseworks-app `origin/dev` (commit `42a3dec20`, read 2026-10-19).
- **Sources:** `apps/api/src/services/ad-font-reference.service.ts` — `FONT_REFERENCE_PROMPT_LINE` 55, `familyForRole` 69, `plannerSchema` 92, `planFontReferenceItems` 112, `renderFontSpecimenPng` 144, `buildFontReferenceImages` 230. `ad-blueprint-composite.service.ts` — `GOOGLE_FONT_ALIASES` 277, `METRIC_CLONES` 326, font lookup 422–560, `createBrandFontResolver` 1883. `ad-remix-pipeline.service.ts` — eligibility and insertion 4697–4758. `lib/fal-image-client.ts` — `engineReadsFontSpecimen` 172.
- **When it runs:** brand font on, an engine that reads samples (GPT Image or nano_banana_pro), and fewer than 6 images already attached.
- **Honest only:** a line goes on the card only if the agent holds the real typeface (an exact Google Fonts match, or a metric-identical clone of Arial, Helvetica, Times, Courier or Georgia). A look-alike never goes on the card; with no real face at all, no card is attached.
- **Gap:** the server prefers the brand's own uploaded font file. No MCP read returns it, so brands with a custom uploaded font get no card from an agent (the prompt still names the font).
- **How:** the agent picks the lines, runs the script below (Python + Pillow, downloads the font from Google), uploads the PNG with `gooseworks:media_upload`, and inserts it as Image 2.

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
python3 specimen.py items.json specimen.png   # exit 3 = no real face: attach nothing
```

```python
#!/usr/bin/env python3
"""Font specimen, ported from gooseworks-app ad-font-reference.service.ts renderFontSpecimenPng (origin/dev, 2026-10-19).
Usage: python3 specimen.py items.json out.png
items.json: [{"text": "...", "role": "headline|subtitle|cta|body|other", "family": "Bebas Neue", "weight": 700}, ...]
Each family is resolved the server's way (Google Fonts exact match or metric clone); lines with no real face are dropped.
Exit code 3 = no line has a real face: attach no specimen."""
import json, re, sys, urllib.request, urllib.parse, urllib.error, io
from PIL import Image, ImageDraw, ImageFont

GOOGLE_FONT_ALIASES = {"avenir next": "Montserrat", "avenir": "Montserrat", "futura": "Jost", "helvetica": "Arimo",
    "helvetica neue": "Arimo", "neue haas": "Archivo", "söhne": "Archivo", "sohne": "Archivo", "arial": "Arimo",
    "didot": "Playfair Display", "georgia": "Gelasio", "times new roman": "Tinos", "din condensed": "Oswald",
    "arial narrow": "Oswald", "menlo": "IBM Plex Mono", "courier new": "Cousine", "brush script mt": "Dancing Script",
    "snell roundhand": "Dancing Script"}
METRIC_CLONES = {"courier new": "Cousine", "courier": "Cousine", "arial": "Arimo", "helvetica": "Arimo",
    "helvetica neue": "Arimo", "times new roman": "Tinos", "times": "Tinos", "georgia": "Gelasio"}
GENERIC = {"sans-serif", "serif", "monospace", "cursive", "fantasy", "system-ui", "ui-sans-serif", "ui-serif",
    "ui-monospace", "ui-rounded", "-apple-system", "blinkmacsystemfont", "math", "emoji", "inherit", "initial", "unset"}

def sanitize(raw):
    if not raw: return None
    name = raw.split(",")[0].strip()
    if not name or name.startswith("var("): return None
    name = re.sub(r"^['\"]+|['\"]+$", "", name).strip()
    if name.lower() in GENERIC: return None
    name = re.sub(r"^__", "", name); name = re.sub(r"_Fallback(?=_|$)", "", name, flags=re.I)
    name = re.sub(r"_[0-9a-f]{4,8}$", "", name, flags=re.I)
    name = re.sub(r"[-_]v?\d+$", "", name, flags=re.I); name = re.sub(r"[-_]+", " ", name).strip()
    if not name or name.lower() in GENERIC: return None
    return " ".join(w if (w == w.upper() and len(w) <= 3) else w[0].upper() + w[1:].lower() for w in name.split())

def resolve(family, weight):
    """Returns (ttf_bytes, resolved_family, served_weight, source) or None when the server would drop the line."""
    clean = sanitize(family) or (family or "").strip()
    mapped = GOOGLE_FONT_ALIASES.get(clean.lower(), clean or "Inter")
    if mapped.lower() == clean.lower(): source = "google-fonts"
    elif METRIC_CLONES.get(clean.lower()) == mapped: source = "metric-clone"
    else: return None  # loose substitute: the server drops this line
    w = max(100, min(900, round(weight / 100) * 100))
    get = lambda u, h=None: urllib.request.urlopen(urllib.request.Request(u, headers=h or {"User-Agent": "Mozilla/5.0"}), timeout=20)
    for cand in sorted(range(100, 1000, 100), key=lambda a: (abs(a - w), -a))[:4]:
        url = "https://fonts.googleapis.com/css2?family=%s:wght@%d" % (urllib.parse.quote(mapped), cand)
        try:
            css = get(url, {"Accept": "text/css", "User-Agent": "Mozilla/5.0"}).read().decode()
        except Exception:
            continue
        m = re.search(r"url\((https://[^)]+\.ttf)\)", css, re.I) or re.search(r"url\((https://[^)]+)\)", css, re.I)
        if m:
            return get(m.group(1)).read(), mapped, cand, source
    # css2 has no probed weight: the google/fonts repo, best-scoring static .ttf (server scoreFontFile)
    slug = re.sub(r"[^a-z0-9]", "", mapped.lower())
    terms = {100: r"(?:^|[-_])thin(?:[._-]|$)", 200: r"(?:extra|ultra)[-_]?light", 300: r"(?:^|[-_])light(?:[._-]|$)",
             400: r"(?:regular|normal)", 500: r"(?:^|[-_])medium(?:[._-]|$)", 600: r"semi[-_]?bold",
             700: r"(?:^|[-_])bold(?:[._-]|$)", 800: r"extra[-_]?bold", 900: r"(?:black|heavy)"}
    def score(name):
        n = name.lower()
        if not n.endswith(".ttf") or "italic" in n: return -1
        sc = 5 if ("[" in n or "variable" in n) else 0
        if re.search(terms[w], n): sc += 100
        if w >= 700 and re.search(r"(bold|black|heavy)", n): sc += 20
        if w <= 500 and re.search(r"(regular|medium|light|thin)", n): sc += 20
        return sc
    for lic in ("ofl", "apache", "ufl"):
        for suffix in ("static", ""):
            api = "https://api.github.com/repos/google/fonts/contents/%s/%s%s" % (lic, slug, "/" + suffix if suffix else "")
            try:
                files = json.loads(get(api).read())
            except urllib.error.HTTPError as e:
                if e.code == 404: continue
                return None  # server: lookup error, line dropped
            ranked = sorted((f for f in files if f.get("type") == "file" and f.get("download_url") and score(f["name"]) >= 0),
                            key=lambda f: -score(f["name"]))
            if ranked:
                data = get(ranked[0]["download_url"]).read()
                n = ranked[0]["name"].lower(); served = w
                if "[" in n or "variable" in n:  # renders its default instance; report that weight
                    try:
                        axes = ImageFont.truetype(io.BytesIO(data), 20).get_variation_axes()
                        served = int(next(a["default"] for a in axes if str(a.get("name", b"")).lower().find("weight") >= 0))
                    except Exception:
                        pass
                return data, mapped, max(100, min(900, round(served / 100) * 100)), source
    return None  # not on Google Fonts: the server falls back to Inter and drops the line

def wrap(draw, text, font, width):
    lines = []
    for para in text.split("\n"):
        cur = ""
        for word in para.split(" "):
            trial = word if not cur else cur + " " + word
            if draw.textlength(trial, font=font) <= width or not cur: cur = trial
            else: lines.append(cur); cur = word
        lines.append(cur)
    return lines

def main():
    items = json.load(open(sys.argv[1]))[:6]
    W, PX, PY, GAP, CAP, TXT = 1200, 72, 64, 52, 26, 92
    inner = W - PX * 2
    prepared = []
    for it in items:
        if not it.get("text", "").strip(): continue
        r = resolve(it["family"], it.get("weight") or (700 if it.get("role") in ("headline", "cta") else 400))
        if r: prepared.append((it, r))
        else: print("dropped (no real face):", it["family"], file=sys.stderr)
    if not prepared: sys.exit(3)
    canvas = Image.new("RGB", (W, PY * 2 + len(prepared) * 460), "#ffffff")
    d = ImageDraw.Draw(canvas)
    y = PY
    for it, (data, fam, wt, _src) in prepared:
        cap_font = ImageFont.truetype(io.BytesIO(data), CAP)
        txt_font = ImageFont.truetype(io.BytesIO(data), TXT)
        cap_lines = wrap(d, "%s · %s %d" % (it["role"].upper(), fam, wt), cap_font, inner)
        for i, ln in enumerate(cap_lines): d.text((PX, y + i * CAP), ln, font=cap_font, fill="#9aa0a6")
        cap_h = len(cap_lines) * CAP
        body = wrap(d, it["text"].strip(), txt_font, inner)
        by = y + cap_h + 12
        for i, ln in enumerate(body): d.text((PX, by + i * TXT * 1.15), ln, font=txt_font, fill="#111111")
        y += cap_h + 12 + len(body) * TXT * 1.15 + GAP
    used = min(canvas.height, round(y - GAP + PY))
    canvas.crop((0, 0, W, used)).save(sys.argv[2], "PNG")
    print(json.dumps({"out": sys.argv[2], "lines": [[it["role"], r[1], r[2], r[3]] for it, r in prepared]}))

if __name__ == "__main__":
    main()
```

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

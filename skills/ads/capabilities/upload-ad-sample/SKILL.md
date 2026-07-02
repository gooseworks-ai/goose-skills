---
name: upload-ad-sample
description: Upload a finished Meta or video ad creative (image or video) to the Goose Ads sample library and fill its remix payload — recipe, script, render variant, and (for video formats like iMessage) the source conversation thread — so the sample is remixable in the app. Use after a creative is finalized and approved for showcasing on the public ads pages.
tags: [ads, marketing, internal]
---

# Upload Ad Sample

Publish a finished ad creative (video or image) into the Goose Ads sample
library, and — when the upload comes from a real ad build — fill the **remix
payload** so the sample is remixable in the app, not just a static showcase.
This is the canonical way to add new samples; the admin panel uses the same
endpoints under the hood.

**This is an agent-executed skill.** No external script. The agent does the
upload and registration inline using curl (or any HTTP client available in its
environment).

**Access:** the write endpoints require an API token whose owner is on the
admin allowlist (or an admin session). A regular user/API token is rejected with
403. If you get a 403, the token isn't admin-allowlisted — tell the user.

## When to use

- A creative video or image has just finished and is approved for public
  showcasing on the marketing library page.
- You want a sample to also feature on the homepage ads grid — set
  `is_featured: true`.
- **You want the sample to be remixable.** Two remix shapes exist:
  - **Video formats (iMessage, etc.)** — pass `format_key` + `thread_json` so
    the format tab can show the sample AND the remix recipe can run it. See
    [Filling the video remix payload](#filling-the-video-remix-payload-imessage-and-other-video-formats).
  - **Meta UGC ads from a content-goose project** — pass the project's
    production JSON so worlds/characters/voices are parsed into `remix_spec`.
    See [Filling the remix payload from a content-goose project](#filling-the-remix-payload-from-a-content-goose-project).

## Inputs

| Field | Required | Default | Notes |
|---|---|---|---|
| `title` | yes | — | Short headline, e.g. "Friend-asks-friend SPF reveal". |
| `format` | yes | — | `video` or `image`. |
| `ratio` | yes | — | `9:16`, `1:1`, `4:5`, or `16:9`. |
| `file_path` | yes (or `media_url`) | — | Local path to the video/image file. |
| `media_url` | yes (or `file_path`) | — | Public https URL of an already-hosted file. |
| `thumbnail_url` | no | — | Poster image URL. **Required for video** — auto-generated from a poster frame if absent (see below). |
| `brand` | no | — | Brand name shown on the card, e.g. "Clinikally". |
| `tags` | no | `[]` | Free-form tags array, e.g. `["imessage", "ugc"]`. |
| `is_published` | no | `false` | When `true` the sample is publicly visible immediately. Otherwise it's a draft, only visible in the admin panel. |
| `is_featured` | no | `false` | When `true` the sample also appears on the homepage ads grid (subject to ordering). |
| `is_remixable` | no | auto | When `true` the sample appears in the app's **create / remix picker** — INDEPENDENT of `is_published` (which gates the landing-page showcase). Defaults to `true` when a `recipe` is provided, else `false`. Set it explicitly to keep the remixable set separate from the showcase set (`is_published:true, is_remixable:false` = showcase-only; `is_published:false, is_remixable:true` = remixable but not on the landing page). |
| `sort_order` | no | `0` | Higher numbers appear earlier inside the featured grid. |
| `slug` | no | auto | Readable handle (e.g. `clinikally-imessage-spf`). The server auto-generates one from brand + title if omitted. Lowercase, hyphenated. |
| **`format_key`** | no | — | **Ad-format key for video formats**, e.g. `imessage`. Set this when the sample should be remixable through a format tab. Lowercase, hyphenated. |
| **`thread_json`** | no | — | **Path to the build's conversation thread JSON** (the file the renderer used, e.g. the build's `threads/full-thread.json`). Required to build a video `recipe`. |
| **`render_variant`** | no | `iphone-frame` (imessage) | **How the source was rendered:** `iphone-frame` (phone bezel) or `plain` (full-screen chat). The remix keeps the source's variant, so record it truthfully. |
| **`duration_sec`** | no | ffprobe | **Master video length in seconds.** Stored in `metadata`. If omitted, derive it with ffprobe on the master. |
| `recipe` | no | — | Built automatically from `format_key` + `thread_json` for video; a shot-list JSON object for other formats. |
| `extracted_script` | no | — | The source ad's script (plain text). Built automatically from the thread for video. |
| `skills_used` | no | `[]` | Flat atom slug list. **Atom slugs only — never a molecule** (see note below). Superseded by `remix_spec.skills` for UGC ads — prefer `remix_spec`. |
| `how_to` | no | — | Agent-facing production notes (the project's how-to). |
| `remix_spec` | no | — | Structured `{ version, skills[], worlds[], characters[], voices[] }` for Meta UGC ads. Build it with the parse endpoint below. |

> **`skills` and `skills_used` are ATOM slugs, never a molecule.** Record the
> atomic capability skills the ad actually used (`generate-voiceover`,
> `generate-broll-shot`, `compose-master`, …) — not the parent molecule that
> orchestrated them. A molecule slug is ambiguous on the remix side: it implies
> "run every sub-skill inside it," which over-specifies the recipe. The parse
> endpoint already returns atoms; if you set `skills_used` by hand, keep it
> atom-level too.

If both `file_path` and `media_url` are provided, prefer `file_path` (we
re-host the file under our own bucket).

**Fill the remix payload whenever the sample comes from a real ad build** — for
video formats that means `format_key`, `recipe`, and `extracted_script`; for
Meta UGC ads it means `recipe`, `extracted_script`, `skills_used`, `how_to`,
and `remix_spec`. Omit them only for a bare showcase upload that won't be
remixed.

## Environment

The skill resolves the API base from the first of:

1. `$GOOSEWORKS_API_BASE_URL`
2. `$GOOSEWORKS_API_URL`
3. Default: `https://app.gooseworks.ai`

Auth uses `$GOOSEWORKS_API_TOKEN` as a Bearer token (it must belong to an
admin-allowlisted user — see Access above).

If neither env var is set, ask the user where the API lives before proceeding.

## How to run

The flow is **3 HTTP calls** when uploading a local file, or **1 call** when
the asset is already hosted. For video, add a small thumbnail upload (below).

### Flow A — local file

#### 1. Request a presigned PUT URL

```bash
curl -sS -X POST "$API_BASE/api/ads-library/samples/upload-url" \
  -H "Authorization: Bearer $GOOSEWORKS_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "filename": "<basename of file_path>",
    "content_type": "<derived MIME>",
    "kind": "media"
  }'
```

Derive the MIME from the file extension:

| Extension | content_type |
|---|---|
| `.mp4` | `video/mp4` |
| `.mov` | `video/quicktime` |
| `.webm` | `video/webm` |
| `.png` | `image/png` |
| `.jpg`, `.jpeg` | `image/jpeg` |
| `.webp` | `image/webp` |
| `.gif` | `image/gif` |

Response:

```json
{
  "status": "success",
  "data": {
    "upload_url": "https://<bucket>.s3.<region>.amazonaws.com/...",
    "public_url": "https://<bucket>.s3.<region>.amazonaws.com/ads/samples/<uuid>/media-<filename>",
    "key": "ads/samples/<uuid>/media-<filename>",
    "expires_in_seconds": 900,
    "required_headers": {
      "content-type": "<MIME>",
      "cache-control": "public, max-age=31536000, immutable"
    }
  }
}
```

The presigned URL expires in 15 minutes — do step 2 promptly.

#### 2. PUT the file bytes to S3

**Send every header in `required_headers` from step 1 exactly.** The presigner
signs both `content-type` AND `cache-control` into the signature, so a PUT that
omits the `Cache-Control` header is rejected by S3 with `SignatureDoesNotMatch`
(403). Mirror the response's `required_headers`:

```bash
curl -sS -X PUT "<upload_url>" \
  -H "Content-Type: <MIME>" \
  -H "Cache-Control: public, max-age=31536000, immutable" \
  --data-binary "@<file_path>"
```

A `200` response means the file is uploaded.

#### 3. Register the sample

```bash
curl -sS -X POST "$API_BASE/api/ads-library/samples" \
  -H "Authorization: Bearer $GOOSEWORKS_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "<title>",
    "format": "<format>",
    "ratio": "<ratio>",
    "media_url": "<public_url from step 1>",
    "thumbnail_url": "<required for video — see Thumbnails>",
    "brand": "<optional>",
    "tags": ["..."],
    "is_published": false,
    "is_featured": false,

    "slug": "<optional readable handle>",
    "format_key": "<optional, e.g. imessage>",
    "recipe": <optional recipe object — see the remix sections>,
    "extracted_script": "<optional script>",
    "metadata": <optional object, e.g. { "duration_sec": 24 }>,
    "skills_used": ["..."],
    "how_to": "<optional production notes>",
    "remix_spec": <optional UGC remix_spec from the parse endpoint>
  }'
```

A `201` response with `data.id` confirms the sample was registered. The remix
fields are all optional and nullable — include whatever you have. Assemble the
**full** body and POST it **once** (see the one-POST rule below); don't create a
bare sample and PATCH the remix fields in afterwards.

### Flow B — already-hosted media

Skip steps 1 and 2. Call step 3 directly with `media_url` set to the existing
public URL. (Video still needs a `thumbnail_url`.)

### Fallback if step 1/2 hit CORS or the bucket isn't public-PUT-enabled

There's a server-side proxy upload that streams through the API:

```bash
curl -sS -X POST "$API_BASE/api/ads-library/samples/upload" \
  -H "Authorization: Bearer $GOOSEWORKS_API_TOKEN" \
  -F "file=@<file_path>" \
  -F "kind=media"
```

Returns `{ data: { public_url, key, content_type, size_bytes } }`. Use the
`public_url` in step 3. Prefer the presigned flow when it works — this proxy
limits files to 250 MB and pushes bytes through Express memory.

### Thumbnails (required for video)

Every **video** sample needs a `thumbnail_url` — the library and format-tab
cards render a poster, and a video with no thumbnail shows a blank tile. If the
caller didn't supply one, grab a poster frame from the master and upload it as a
thumbnail:

```bash
# 1. Extract a poster frame (1s in) from the master
ffmpeg -y -ss 1 -i "<file_path>" -frames:v 1 -q:v 2 "<tmp>/poster.jpg"

# 2. Presign with kind: "thumbnail" (thumbnails must be an image MIME)
curl -sS -X POST "$API_BASE/api/ads-library/samples/upload-url" \
  -H "Authorization: Bearer $GOOSEWORKS_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{ "filename": "poster.jpg", "content_type": "image/jpeg", "kind": "thumbnail" }'

# 3. PUT the poster with BOTH required headers (content-type + cache-control)
curl -sS -X PUT "<thumbnail upload_url>" \
  -H "Content-Type: image/jpeg" \
  -H "Cache-Control: public, max-age=31536000, immutable" \
  --data-binary "@<tmp>/poster.jpg"
```

Use the thumbnail's `public_url` as `thumbnail_url` in the step-3 register call.
Images don't need this — only video.

## Filling the video remix payload (iMessage and other video formats)

When the sample is a video built for a format tab (iMessage today), pass
`format_key` and `thread_json` so the app can both **show** it under the format
tab and **remix** it. The remix recipe reads `recipe.thread`,
`recipe.render_variant`, and `extracted_script` to rebuild the conversation for
a new brand, so build them exactly as below.

### 1. Build the `recipe`

Read and parse the thread JSON file at `thread_json` (the conversation the
renderer used — typically the build's `threads/full-thread.json`). Then build:

```jsonc
{
  "format": "<format_key>",          // e.g. "imessage"
  "render_variant": "<iphone-frame|plain>", // how this source was rendered; default "iphone-frame" for imessage
  "thread": <the parsed thread JSON, verbatim>
}
```

`recipe.thread` is stored **verbatim** — keep whatever the build emitted. The
iMessage thread schema is the conversation the renderer drives: a top-level
object with `participants[]` (each `{ id, name, self? }`) and an ordered
`messages[]` array of `{ id, type: "text"|"typing"|"attachment", from, text?,
src?, … }`. Some older builds use a flatter `{ peer_persona, bubbles[],
end_card }` shape — either is fine; store what the build produced. Don't
hand-rewrite or trim it.

`recipe` must be a JSON **object** and serialize to ≤ 64 KB. A normal iMessage
thread is a couple KB; if a thread is unusually large (many inline data-URL
attachments), host the attachments and reference them by URL rather than
inlining the bytes.

### 2. Derive `extracted_script` from the thread

Produce a plain-text transcript — **one line per message that has text** — so a
remix can reconstruct the beats even without `recipe.thread`. Prefix each line
with the speaker's role, not their name:

- `me` if the sender is the self participant (the one with `self: true`, or
  whose id is `me`).
- `peer` for every other sender.

Skip `typing` and `attachment` messages (they carry no `text`). Preserve order
and the original wording verbatim (emoji included). Example:

```
peer: how were u not BURNT 😭
me: bro! u looked like a tandoori prawn
peer: 😭😭😭
peer: goa in 12 days btw
peer: what do u use pls
me: clinikally sunprotect spf 50
me: this one is really good. try it.
```

The `me:`/`peer:` prefixes are what the remix recipe uses to reconstruct sender
alternation when it falls back from `recipe.thread`.

### 3. Put `duration_sec` in `metadata`

Set `metadata.duration_sec` to the master's length in seconds (round to the
nearest second). If `duration_sec` wasn't supplied, derive it:

```bash
ffprobe -v error -show_entries format=duration -of default=nk=1:nw=1 "<file_path>"
```

### 4. Register

POST once with `format: "video"`, `format_key`, the `recipe`,
`extracted_script`, `metadata`, the `thumbnail_url` (poster frame), `ratio`
(`9:16` for the vertical master), and `is_published`. Example body:

```jsonc
{
  "title": "Friend-asks-friend SPF reveal",
  "format": "video",
  "format_key": "imessage",
  "ratio": "9:16",
  "brand": "Clinikally",
  "media_url": "<public_url of the master mp4>",
  "thumbnail_url": "<public_url of the poster frame>",
  "tags": ["imessage"],
  "metadata": { "duration_sec": 24 },
  "recipe": {
    "format": "imessage",
    "render_variant": "iphone-frame",
    "thread": { /* parsed full-thread.json, verbatim */ }
  },
  "extracted_script": "peer: how were u not BURNT 😭\nme: bro! u looked like a tandoori prawn\n…",
  "is_published": false
}
```

After registering, **the sample appears under
`GET /api/ads-library/samples?format_key=imessage`** with `recipe.thread`
populated — that's what the format tab lists and the remix recipe runs.

## Filling the remix payload from a content-goose project

When the sample is a Meta UGC ad from a content-goose ad project (e.g.
`clients/<brand>/ad-runs/<run>/`), populate the remix payload so the ad is
**remixable in the app** — not just a static showcase. The app provides a parser
endpoint that turns the project's production JSON into the structured
`remix_spec`, so you don't reimplement the parsing.

### 1. Parse the production JSON into a `remix_spec`

Read the project's `production/` files and POST their **contents** (parsed JSON,
not strings) to the parse endpoint. Any subset is accepted — pass what exists.

**Also include each character's anchor PNG.** `character-locks.json` references
the locked portrait by `anchorAssetId`, and `asset-manifest.json` maps that
asset id to a **local path** (`url` is null in raw runs — content-goose stores
paths, not hosted URLs). The parse endpoint hosts those PNGs to S3 and wires the
resulting URL onto the character — without this, the picker has nothing to
display and every imported character looks blank.

For each entry in `character_locks.characters[]`:
1. Read `anchorAssetId`.
2. Look it up in `asset_manifest.assets[]` to get `path`.
3. Read the file from the project directory.
4. Base64-encode it.
5. Include `{ "asset_id": "<anchorAssetId>", "data_url": "data:image/png;base64,<…>" }` in the `character_anchor_images` array of the parse request.

```bash
curl -sS -X POST "$API_BASE/api/ads-library/samples/parse-remix-spec" \
  -H "Authorization: Bearer $GOOSEWORKS_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "scene_contract":      <contents of production/scene-contract.json>,
    "voiceover_auditions": <contents of production/voiceover-auditions.json>,
    "asset_manifest":      <contents of production/asset-manifest.json>,
    "character_locks":     <contents of production/character-locks.json, if present>,
    "character_anchor_images": [
      { "asset_id": "asset-char-subject-cand-01", "data_url": "data:image/png;base64,iVBORw0KG..." }
    ]
  }'
```

If the character's anchor PNG isn't available locally, omit that entry — the
parser returns `anchor_image_url: null` for it and the picker falls back to
initials. Don't fabricate a placeholder.

Pass the response `data` straight through as `remix_spec` in step 3. It maps
from:

| Source file | Produces |
|---|---|
| `scene-contract.json` → `worldLock` | `remix_spec.worlds[]` |
| `scene-contract.json` → `characterCast[]` (+ `character-locks.json`) | `remix_spec.characters[]` |
| `voiceover-auditions.json` → `auditions[]` | `remix_spec.voices[]` (selected one flagged) |
| `asset-manifest.json` → asset `provider`/`metadata.model` | `remix_spec.skills[]` (deduped) |

**The parse endpoint also reconciles the global catalog.** Before returning, it
links each character to a global `ad_character` by `soul_id` (creating a global
stock row when the `soul_id` is new) and links worlds to a global `ad_world` by
`name`. So the `data` it returns already has `catalog_id` populated on linked
entries — pass it through unchanged. Pass `"link_catalog": false` in the request
body if you want the raw parse without touching the catalog (rare).

### Canonical `remix_spec` schema (always emit this exact shape)

The backend stores `remix_spec` as a free-form JSON blob (size-capped) — it does
**not** enforce the shape, so **the skill is responsible for emitting this exact
structure every time**. The parse endpoint already returns this shape; if you
assemble `remix_spec` by hand, match it field-for-field. **All arrays are
optional and may be empty** — include only what the ad actually used.

```jsonc
{
  "version": 1,
  "skills": [
    { "slug": "generate-talking-head", "provider": "fal", "model": "fal-ai/nano-banana" }
  ],
  "worlds": [
    {
      "key": "bedroom_warm_oat", "name": "Bedroom Warm Oat",
      "set": "oat walls, taupe sheets", "lighting": "soft morning",
      "color_grade": "warm honey", "reference_image_url": null, "catalog_id": null
    }
  ],
  "characters": [
    {
      "key": "founder", "name": "Avery", "gender": "f", "soul_id": "soul_abc123",
      "anchor_asset_id": "asset-char-founder-01",
      "anchor_image_url": "https://...portrait.png",
      "method": "anchor-ref", "description": "kitchen, confessional", "catalog_id": null
    }
  ],
  "voices": [
    {
      "voice_id": "FUfBrNit0NNZAwb58KWH", "voice_name": "Angela", "provider": "elevenlabs",
      "settings": { "stability": 0.4, "similarityBoost": 0.75, "style": 0.05, "useSpeakerBoost": true },
      "selected": true
    }
  ]
}
```

Rules that keep it consistent across uploads:
- Always include the top-level keys `version`, `skills`, `worlds`, `characters`,
  `voices` — use `[]` for sections the ad didn't use (don't omit the key).
- `catalog_id` is `null` unless the entry is a confirmed match to an existing
  global catalog row.
- Keep ElevenLabs `settings` keys exactly as content-goose emits them
  (camelCase: `similarityBoost`, `useSpeakerBoost`).
- Don't invent fields.

> **`catalog_id: null` is the NORMAL case — do not treat it as a failure or
> retry.** The parse endpoint only sets it when it can link an entry to global
> stock: **characters only when they have a real `soul_id`**, **worlds only when
> their name already matches an existing global world**. A generated avatar
> (`soul_id: null`) and a fresh ad-specific world both stay `null` — working as
> designed. Don't re-call the endpoint trying to "fix" these nulls.

### 2. Gather the rest from the project

- **`extracted_script`** — concatenate the `vo` lines from the locked draft in
  `production/script-drafts.json` (the draft whose `id === activeDraftId`), in
  beat order.
- **`how_to`** — the contents of the project's `HOW_TO.md` (append `LEARNINGS.md`
  too if useful).
- **`recipe`** — if the project has a structured shot recipe, include it.
  content-goose doesn't always have one separate from `scene-contract`; omit if
  absent.
- **`skills_used`** — optional. `remix_spec.skills` already covers this.

### 3. Register with everything in one call

Include `remix_spec`, `extracted_script`, `how_to` (and `recipe` if present) in
the step-3 registration body.

> **One POST, not create-then-PATCH.** Assemble the full body — metadata +
> media_url + the entire remix payload — and `POST /samples` **once**. Do NOT
> create a bare sample and then PATCH the remix fields in; that's two round
> trips and can leave a half-populated row if the second call fails.
> `PATCH /samples/:id` exists only for *editing an already-registered sample by
> id* later — not as part of the initial upload.

If you only have a hosted asset and no build context, skip the remix sections —
the sample uploads fine without a remix payload, it just won't be remixable
until an admin fills it in via the admin panel.

### Older backends — fallback is ERROR-TRIGGERED, never preemptive

ALWAYS send the FULL payload first. Only if the register call actually returns
`400 validation_failed` complaining about `Unrecognized keys` (an older backend
that predates `slug`/`format_key`/the remix fields — e.g. prod before the
format-registry deploy) re-register with the minimal payload — and then
EXPLICITLY report every dropped field and that it must be backfilled via
`/admin/ad-samples` → Edit once the backend updates. Never fall back silently
or in advance: a sample registered without `format_key` will not appear under
any format tab (this exact failure shipped on 2026-06-11 — an agent followed a
stale legacy warning, sent the minimal payload against a backend that accepts
everything, and the upload was invisible in the app).

## Output

When done, output:

```
Uploaded sample <id>
  title: <title>
  format: <format>            (format_key: <format_key> when set)
  ratio: <ratio>
  slug: <slug>
  media_url: <public_url>
  thumbnail_url: <public_url | none>
  is_published: <true|false>
  is_featured: <true|false>
  remixable: <yes|no>
  recipe: <thread: N messages, render_variant: <variant>>   (video)
  remix_spec: <N skills, M worlds, K characters, J voices>  (UGC)
  view: <API_BASE>/ads/library
```

Then remind the user:

- If `is_published: false`, the sample is a **draft** — only visible in the
  admin panel until published. **Set `is_published: true`** (or toggle it in the
  admin panel) when it's ready to go live.
- **Verify the `slug` and `format_key` in the admin ad-samples panel** — for a
  video format sample, confirm it lists under the right format tab and that the
  poster thumbnail renders.
- If no remix payload was attached, note the sample isn't remixable yet and can
  be completed in the admin panel.

### Optional project-local manifest

If the upload originated from an ad project folder, append the upload metadata to
the project's `uploads.md` so future agents can trace which sample ID maps to
which artifact. One Markdown line per upload:

```markdown
- `<sample_id>` · **<title>** · `<format>/<ratio>` · `<media_url>` · uploaded <iso-date> · `is_published=<bool>`
```

Skip when uploading from a non-project context.

## Edge cases

- **Validation errors** (`400` with `code: validation_failed`): surface the
  `issues` array verbatim. Common: missing `title`, invalid `format`/`ratio`,
  malformed `media_url`, a `slug`/`format_key` that isn't lowercase-hyphenated.
- **`SignatureDoesNotMatch` (403) on the PUT**: you omitted a signed header —
  send **both** `Content-Type` and `Cache-Control` from `required_headers`.
- **Auth errors** (`401`/`403`): the token is missing, invalid, or not on the
  admin allowlist. A `403` means the token owner isn't an allowlisted admin.
- **`bad_mime`** (`400`): the file extension doesn't match a supported MIME. For
  unsupported video, transcode to `.mp4` (H.264 + AAC) with
  `ffmpeg -i input.<ext> -c:v libx264 -c:a aac -movflags +faststart output.mp4`.
- **`s3_not_configured`** (`500`): the backend is missing AWS credentials — a
  server-side config issue, not user-recoverable from the skill.
- **`too_large`** (`413`): file exceeds 250 MB. Compress or trim.
- **`.mov` files**: Chrome and Firefox don't reliably play QuickTime; upload as
  `.mp4` for best browser compatibility.
- **Video with no thumbnail**: don't register it bare — extract and upload a
  poster frame first (see Thumbnails).
- **`recipe` rejected** (`400`): it must be a JSON object (not an array) and
  serialize to ≤ 64 KB. Oversized threads usually mean inlined attachment bytes
  — host the attachments and reference them by URL.
- **`remix_spec` rejected** (`400`): it must be a JSON object (the parse
  endpoint's `data`), not an array, and serialize to ≤ 128 KB.
- **`parse-remix-spec` returns empty arrays**: the production JSON was missing or
  malformed — the parser is defensive and never throws. Check you passed file
  **contents** (parsed JSON), not paths or stringified JSON.
- **`PATCH /samples/:id` returns `404`**: the sample id doesn't exist. Don't
  loop — just `POST /samples` to register a fresh row.

## Defaults to apply when the user is vague

- "publish" / "ship it" → `is_published: true`.
- "draft" / unspecified → `is_published: false`.
- "feature it" / "homepage" → `is_published: true` AND `is_featured: true`.
- `ratio` unspecified and `format` is `video` → `9:16` (vertical, the dominant
  Meta ad format).
- `ratio` unspecified and `format` is `image` → `4:5`.
- `format_key` is `imessage` and `render_variant` unspecified → `iphone-frame`.
- Derive `title` from the filename if the user didn't provide one (strip
  extension, replace dashes/underscores with spaces, title-case).
- If the upload is from a real ad build, **always** fill the matching remix
  payload (video: `format_key` + thread; UGC: parse step + script/how-to) —
  don't ask; it's the expected behavior. Only skip when there's genuinely no
  build context.

## Verification

After upload, the sample appears at:

- `<API_BASE>/admin/ad-samples` — always (drafts + published).
- `<API_BASE>/ads/library` — only if `is_published: true` (cached for 60s).
- `<API_BASE>/ads` — only if `is_published: true` AND `is_featured: true`.
- `GET <API_BASE>/api/ads-library/samples?format_key=<key>` — video format
  samples list here with `recipe.thread` populated; this is what the format tab
  and remix recipe read.

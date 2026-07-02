---
name: create-video-seedance-2-fal
description: Generate a single 4-15s vertical video clip with ByteDance Seedance 2.0 reference-to-video via fal.ai. Multi-image reference (avatar + product + setting), native lip-synced VO + ambient audio via `generate_audio: true`, internal multi-cut handling within one render. The default clip atom for AI-creator UGC ads built on the NB2 + Seedance architecture. Validated on `beauty-by-earth/video-01`.
owner: team
status: active
version: 1
created: 2026-05-26
updated: 2026-06-22
---

# create-video-seedance-2-fal

> ⚠️ **REQUIRED PREFLIGHT (2026-06-04): every Seedance prompt that names a branded product MUST be paired with a real reference image of that exact product** as one of the `--image-ref` inputs. Text-only product description without a ref invites Seedance to invent geometry that does not match the real SKU. If no reference exists locally, find one via brand-assets → existing-ads → PDP harvest → promote to `clients/<brand>/brand-assets/reference-photos/`. Optionally clean an occluded ref via a quick GPT-image-2 edit pass first. **Always get user review of the reference + final prompt before firing the paid call.** See `feedback_product_reference_required.md`.

## Purpose

Wraps the FAL endpoint `bytedance/seedance-2.0/reference-to-video`. Pass 1-N image references (typically: portrait + product + optional setting) + a structured prompt → get back a 4-15s clip with native lip-synced VO and ambient audio.

Seedance 2.0 renders **multiple internal cuts within a single 15s call** when the prompt specifies sub-scene structure (e.g. WIDE HOOK / PRODUCT HERO / SIDESTEP / REACTION). This is the architectural win over the older NB2 + i2v multi-keyframe approach — fewer calls, native lip-sync, no Soul ID required.

Use this atom when:
- The clip needs a talking-head avatar reviewing or demonstrating a product
- Native lip-synced dialogue is required (set `--generate-audio`)
- Identity must hold via image reference, not video reference (see Decision Rule 1)
- Length 4-15s, vertical 9:16 (or other aspect ratios)
- Multi-image conditioning (face + product, or face + multiple products for a hook scene)

**Do NOT use** for:
- > 15s clips → split across multiple calls and stitch (`assembly/stitch-videos-ffmpeg`)
- Pure cinematic camera moves without an on-screen person → `create-video-veo3` is often better
- Product-only B-roll with no person → `create-product-videos-higgsfield-ms` or text-to-video Seedance
- Clips that need video reference for continuity from a prior AI-gen scene → not supported (content_policy_violation)

## Inputs

Required:
- `--prompt` — structured prompt block (see "Prompt template" below). Long, multi-block. Reference run example: `beauty-by-earth/video-01-three-product-grwm/working/fire_seedance_facewash.py`.
- `--output` — local MP4 destination.
- `--image-ref` — at least one reference image (repeatable). The atom uploads each and passes as `image_urls`. Order matters — first ref = `@Image1` in prompt addressing.

Optional:
- `--resolution` — `480p` | `720p` | `1080p` (default). 1080p meaningfully better for product label fidelity.
- `--duration` — `4`–`15` seconds (default `15`). Passed as **string** per FAL schema.
- `--aspect-ratio` — `9:16` (default), `16:9`, `1:1`, etc.
- `--generate-audio` — bool, default true. Set false for silent B-roll where VO is added post.
- `--seed` — integer for deterministic re-runs (FAL returns a seed; pass it back to reproduce).
- `--with-logs` — stream FAL queue updates to stdout.

Credentials:
- `FAL_API_KEY` (or `FAL_KEY`) in `.env`.

## Decision Rules

**0. Prefer FEWER, LONGER calls with internal multi-scene prompting over many short calls.** Every new Seedance call drifts character, wardrobe, lighting, and background slightly — even with the same portrait reference. 5 short calls = 5 drift points the viewer registers as continuity breaks. Use the proven multi-scene template inside ONE 10-15s call to get internal hard-feeling cuts from a single render:

```
SCENE 1 (0-3s) — WIDE HOOK [framing + action + dialogue]
SCENE 2 (3-7s) — PRODUCT HERO [framing + camera move + dialogue]
SCENE 3 (7-11s) — SIDESTEP / PROOF [framing + action + dialogue]
SCENE 4 (11-15s) — REACTION + CTA [framing + action + dialogue]
```

**Setting CAN vary across internal sub-scenes within one Seedance call.** Character identity is locked by the portrait reference image, not by the setting. Validated reference (ref-01 Bristle UGC, 26s) shows the same creator across 5+ different room/background settings within a single multi-scene render. Don't artificially split into multiple calls just to change rooms — bake the setting changes INTO the SCENE N (X-Ys) sub-scene structure of a single call. Distribute calls based on STORY ARC and the 15s max-duration cap, not setting count. See `prompt-example.md` for the validated template. Memory: `feedback_seedance_long_calls_not_short.md`.

**0a. WARDROBE must be FULLY specified — top + bottom + hair + accessories.** Validated 2026-05-23 (Bristle): if only the top is specified ("cream sweatshirt"), Seedance hallucinates the bottom (denim shorts appeared from nowhere). Every prompt must lock all of:
- Top (with negations)
- Bottom (with negations) — "light denim cuffed shorts, mid-thigh, NOT jeans, NOT pajama shorts"
- Hair (specific styling — "loose low ponytail at the nape with face-framing strands" works better than vague "bun")
- Accessories (e.g. "thin gold hoop earrings, nothing else")

For confessional / single-sitting UGC, wardrobe should be IDENTICAL across all calls of the same ad (validated user preference + ref-01 + ad-03 patterns). Vary wardrobe across calls ONLY for GRWM / transformation / multi-day formats. Memory: `feedback_seedance_long_calls_not_short.md`.

**0b. PASS A BACKGROUND REFERENCE IMAGE as `image_urls[2]` for locked settings.** Validated 2026-05-23 (Bristle). Text-only setting description yields generic-rental aesthetic — Seedance fills with its own room prior. A background hero image (generated via NB2 Pro at `fal-ai/nano-banana-pro`, $0.15/1K, text-to-image with "no bokeh, infinite focus, no people, no faces" directives) LOCKS the room across all sub-scenes. Use the SAME background image across all calls of the same ad — different bg image per call reads as "she moved." Memory: `feedback_seedance_long_calls_not_short.md`.

**0c. PRE-CLEAN PRODUCT REFERENCE IMAGES via NB2 edit if they contain accessories.** Validated 2026-05-23 (Bristle hi_res-12 had vials + funnel beside the box; Seedance fused them onto the box face). Inspect source product images at intake. If accessories / secondary products / score badges / lifestyle elements visible, route through `fal-ai/nano-banana-2/edit` ($0.08) to isolate the hero product before passing to Seedance. Cheaper than rerolling a $4.50-$10.20 Seedance render. Memory: `feedback_nb2_clean_product_refs.md`.

**0d. SEQUENTIAL CALL CONTINUITY — use seed reuse, NOT video_urls.** Validated 2026-05-23 (Bristle Variant A/B test). For Call N>1 in a multi-call ad, pass the prior call's `seed` (via `--seed`) with the same `image_urls`. NEVER pass the prior call's mp4 as `video_urls` for sequential continuity — it HURTS continuity (model tries to "continue" prior video; wardrobe/product drift more than they otherwise would). `video_urls` is ONLY for style transfer from a REAL HUMAN reference video (e.g. take a real-creator UGC ad and recreate with AI creator). Memory: `feedback_seedance_video_urls_vs_seed.md`.

**0e. WHEN USING `video_urls` (style transfer from real reference): set client timeout to 30+ min AND trim reference to ≤15s.** Validated 2026-05-23:
- Render time: ~18-20 min (vs ~10 min for image-only). The default `fal_client.subscribe()` 10-min timeout will fail. Use `fal_client.submit()` + manual polling.
- **Combined `video_urls` duration cap: 15s.** FAL rejects with `input_value_error: Combined video duration must not exceed 15.0s`. Trim reference videos with ffmpeg `-t 15` before upload.
- **Combined files cap: 50 MB total.** Our `fal_helpers.upload_file()` cap bumped from 10 MB to 50 MB on 2026-05-23.
- Detect validation errors (`input_value_error` / "must not exceed") in polling exceptions and bail after 1-2 retries — terminal errors don't surface via `status=Failed`.
- **Video reference transfers MORE than style/pacing — it transfers wardrobe styling, accessories, hair to a non-trivial degree** (validated 2026-05-23 Probiotic Recreation: hair flipped to match reference; tablets appeared despite cleaned product image). Text-side overrides are PARTIALLY effective; pick a reference whose visuals already align with your target.
- FAL DOES accept AI-gen video as input (the old "instant content_policy_violation" assumption from BBE 2026-05 early is outdated). Memory: `feedback_seedance_video_urls_vs_seed.md`.

**1. NEVER pass AI-generated video as `video_urls`.** FAL's content-policy validator rejects this with `partner_validation_failed`. The 60% video-input discount is real but only applies to REAL HUMAN reference video. For AI-avatar continuity across multiple scenes, use the same identity portrait as `image_urls` in every scene. Validated on BBE.

**2. NSFW reject → STOP and surface, do not auto-retry.** Body-application + female + water/lather hits the classifier reliably. If FAL returns `content_policy_violation` or `status: failed` with `nsfw` reason, do NOT retry the same prompt. Surface to the caller with 3 options: rewrite the application beat as smell-test / fingertips-show, reframe as POV (no face), or skip the scene. Follows the project-wide moderation policy (see memory `feedback_hf_moderation_surface.md`).

**3. `duration` as string.** Pass `"15"`, not `15`. FAL schema accepts string only.

**4. Single product per call (except hook).** Multi-product hero scenes within a single Seedance call degrade label fidelity. The exception is the hook/intro scene where all products appear together but no single label is hero.

**5. 1080p for hero quality.** Skin texture and product label crispness scale noticeably with resolution. Use 720p only for budget/probe calls.

## Workflow

```bash
python3 coworkers/video/atoms/video-generation/create-video-seedance-2-fal/scripts/generate.py \
  --prompt "$(cat prompt-scene-1.txt)" \
  --output /path/to/scene-1.mp4 \
  --image-ref /path/to/portrait.png \
  --image-ref /path/to/product.png \
  --resolution 1080p \
  --duration 15 \
  --aspect-ratio 9:16 \
  --generate-audio
```

The script:
1. Loads FAL key via shared `fal_helpers.load_fal_key()`.
2. Uploads each `--image-ref` to FAL storage (returns `https://v3.fal.media/...` URLs).
3. Calls `fal_client.subscribe("bytedance/seedance-2.0/reference-to-video", arguments={...})` with:
   ```python
   {
       "prompt": <prompt>,
       "image_urls": [<refs>],
       "resolution": <res>,
       "duration": "<dur>",  # string
       "aspect_ratio": <ar>,
       "generate_audio": <bool>,
       "seed": <optional int>,
   }
   ```
4. Downloads the result MP4 to `--output`.
5. Writes `<output>.meta.json` with prompt, refs, video URL, seed, duration, cost estimate.
6. On `content_policy_violation` or NSFW failure: surfaces the error and exits non-zero (no silent retry).

## Output

- `<output>` — MP4 clip at requested duration, resolution, aspect ratio.
- `<output>.meta.json` — request + result metadata + seed for reproducibility + cost estimate.

## Pricing (2026-05)

| Resolution | Duration | Cost per call |
|---|---|---|
| 720p std | 15s | ~$4.54 |
| 1080p std | 15s | ~$10.20 |
| 1080p std | 8s | ~$5.44 |
| 1080p std | 4s | ~$2.72 |

Fast tier is ~20% cheaper but caps at 720p.

## Prompt template

The prompt is the single biggest quality lever. Use the proven BBE template structure:

```
📱 UGC INFLUENCER [PRODUCT] REVIEW REEL (SELFIE-STYLE, NOT A COMMERCIAL)

[BLOCK 0 — anti-pattern opener]
This is NOT a cinematic commercial, NOT a [category] ad, NOT an editorial campaign.
This is a real Instagram Reel filmed by a 20-something [demographic] creator on her
iPhone front camera, talking directly to her followers in a relaxed, confiding tone...

[IMAGE REF ASSIGNMENTS]
Use @Image1 as the influencer's face/identity. Use @Image2 as the exact [product]
she is reviewing — it is a [VISUAL DESCRIPTION]. It is NOT a [common confusion].
The product and label MUST be clearly identifiable.

[FORMAT block]
- Vertical 9:16 phone-shot selfie aesthetic, slight handheld micro-shake
- WARDROBE (STRICT): [wardrobe]. ABSOLUTELY NOT [list of negations].
- Setting: [setting]
- Lighting: [lighting]
- Real, slightly imperfect skin (natural barely-any makeup), light golden tan

[IDENTITY block]
Same young woman as @Image1 — [age range, hair, eyes, skin tone]

[DYNAMIC FRAMING block]
The video must vary its framing across scenes like a real Reel — do NOT stay
on one focal length the whole time. Mix wide / medium / close-ups.

[SCENE 1 (0-3s)] WIDE HOOK — [script line] + [emotion + action]
[SCENE 2 (3-7s)] PRODUCT HERO with rotation — [script line] + [emotion + action]
[SCENE 3 (7-11s)] SIDESTEP application or smell-test — [script line] + [emotion + action]
[SCENE 4 (11-15s)] REACTION + recommendation — [script line] + [emotion + action]

[AUDIO DIRECTION]
[Voice character: tone, accent, pace per DELIVERY_STYLES.md]
NO music in the audio (we add music in post).

[GLOBAL RULES]
- Wardrobe identical across the scene
- Product stays identical and clearly visible in her hand
- Lips remain CLOSED between dialogue beats
- [NSFW sidestep negations if relevant]

[STRICT REALISM RULES — Block F]
- Tiny natural imperfections, subtle peach fuzz, faint fine lines
- NOT plastic, NOT airbrushed, NOT doll-like, NOT porcelain
- Skin highlights ONLY on nose tip, cheekbones, cupid's bow
- Hair: individual flyaway strands, slight frizz
- Image grain matches iPhone front camera
```

Full template reference: `prompt-example.md` at the repo root, plus all four scripts in `beauty-by-earth/video-01-three-product-grwm/working/fire_seedance_*.py`.

## Quality Checks

- Output MP4 exists, plays end-to-end, duration within ±0.5s of `--duration`.
- Aspect ratio and resolution match the request.
- Avatar identity matches `--image-ref` portrait reference (visual check).
- Product label readable in the hero sub-scene (zoom in on the t=mid frame).
- Lip-sync within ~100ms of the audio.
- No NSFW visual leaked (no water/lather/body-application unless explicitly approved).
- `meta.json` records `gateway: "fal"`, `model: "bytedance/seedance-2.0/reference-to-video"`, and the FAL seed.

## Failure Modes

| Failure | Cause | Recovery |
|---|---|---|
| FAL 422 `content_policy_violation: partner_validation_failed` | AI-gen scene passed as `video_urls` | Remove `video_urls`. Use `image_urls` only for identity continuity. |
| FAL response `status: failed`, `nsfw` reason | Body-application + female + water/lather hit classifier | STOP. Surface to caller. Rewrite sidestep beat as smell-test or fingertips-show. NEVER auto-retry. |
| FAL 404 on endpoint path | Wrong endpoint slug | Use `bytedance/seedance-2.0/reference-to-video` exactly — no `fal-ai/` prefix. |
| Output longer than requested | `duration` sent as int not string | Send as string: `"duration": "15"`. |
| Product label garbled / wrong | Multi-image refs drifted, or 720p | Move to 1080p, ensure product ref is sharp + correctly cropped, add "label MUST be sharp and clearly readable" to the hero sub-scene. |
| Mouth moving when not speaking | Default Seedance behavior | Add to Global Rules: "Lips remain CLOSED between dialogue beats — no mouth movement when not speaking." |
| Cinematic slow pacing despite "iPhone selfie" prompt | Seedance prior leans cinematic | Strengthen anti-pattern block: "Casual real-time pace, NOT slow-motion, NOT dolly moves, NOT cinematic." Optionally post-process with `ffmpeg setpts=0.66*PTS` for 1.5x speed. |
| Heavy freckles / blotchy skin | Block B language too aggressive | Use v8 soft-skin language. Drop "freckles prominent", "real-person imperfections". Replace with "tiny natural imperfections, subtle peach fuzz, faint fine lines". |
| Wrapper RuntimeError "fal subscribe exceeded timeout" AFTER long elapse (>600s on 1080p) | Shared `fal_helpers.subscribe()` post-call timeout check raises even when the result returned successfully (latent bug; default bumped to 2400s on 2026-05-26 but recovery still applies for older runs) | **The render likely completed on FAL — DO NOT re-fire.** See Recovery Workflow below. |
| FAL `downstream_service_unavailable` after long wait (~30 min) | Seedance backend overloaded / transient infra issue | Not billed (FAL bills on completion). Retry once. If retry also fails, wait 30 min then retry. Don't change prompt — it's infra, not your input. |
| **Brand name mispronounced in native-audio output** (validated 2026-06-08 on Alitu A3: rendered "Alitu" as "al-too" instead of "ah-LEE-too") | Seedance picks its own voice + interprets non-English / made-up brand names phonetically without dictionary knowledge | **Preflight:** use phonetic spelling directly in the dialogue (NOT a parenthetical). E.g. `SPOKEN LINE: "Ali-too does the engineering for you."` Avoid `Dialogue: "Alitu (pronounced ah-LEE-too)"` — Seedance reads the parenthetical out loud (see next row). **Post-render QC:** /watch:watch and confirm the Whisper transcript matches expected pronunciation. **Recovery:** re-roll the affected sub-scene with phonetic spelling baked into the line, OR splice an ElevenLabs reading of the brand-name beat over the Seedance visual. |
| **Prompt metadata leaks into spoken line** (validated 2026-06-08 on Alitu A3 v2: rendered "Alitu, pronounced Ali-tu, three syllables, does the engineering for you" — Seedance read the parenthetical voice-coaching out loud as if it were part of the dialogue) | Seedance does not distinguish "spoken text" from "voice coaching" inside a `Dialogue:` field. Parentheticals, notes, "(pronounced X)", "(softly)", "(stage whisper)" all get verbalized. | **Prevention:** keep voice-coaching OUTSIDE the dialogue field entirely. Use a separate `SPOKEN LINE:` heading whose content is the EXACT verbatim utterance, no parens, no notes. Put coaching under `NEGATIONS:` as "DO NOT say X / DO NOT explain pronunciation". Bake phonetic intent into the dialogue spelling itself (`Ali-too` not `Alitu`). |

## Recovery Workflow — recover a lost result via FAL share URL

When a Seedance render is paid for but the result was discarded by the wrapper / shell / timeout, the mp4 is still accessible via FAL's dashboard for 24-48+ hours.

1. **Ask the user** to open `https://fal.ai/dashboard/requests` (or the share-link view of the model: `https://fal.ai/models/bytedance/seedance-2.0/reference-to-video?share=<uuid>`) signed in to the FAL account that holds `FAL_API_KEY`.
2. Filter by model = `bytedance/seedance-2.0/reference-to-video` and look for the request matching the lost run's timestamp.
3. The user copies the share URL (contains `?share=<uuid>`) and pastes it back.
4. `WebFetch` the share URL extracting "the v3.fal.media/files/.../*.mp4 URL plus the seed and any other metadata". The page renders all of this verbatim.
5. `curl -sSL -o <output>.mp4 "<extracted-mp4-url>"` to grab the file. Zero extra cost.
6. Save metadata to `<output>.mp4.meta.json` (seed, share URL, mp4 URL, recovery note) so downstream calls can use the seed for continuity.

**Prevention:** Fire long Seedance calls with `--with-logs` so queue-update messages including the request_id stream to the atom's stdout. If the wrapper later errors, the request_id is recoverable from the background task output file at `/private/tmp/claude-501/.../tasks/<id>.output` and can be passed to `fal_client.result(request_id)` directly.

Memory: `feedback_fal_helpers_timeout_bug.md`. Validated: Lineage Video 01 Call 1 (2026-05-26) — recovered $8.83 render via share URL.

## References

- FAL model page: https://fal.ai/models/bytedance/seedance-2.0/reference-to-video
- Reference runs: `beauty-by-earth/video-01-three-product-grwm/working/fire_seedance_{facewash,deo_probe,hook,tanner}.py`
- Proven prompt template: `prompt-example.md`
- Sibling NB2 atom (avatar / product stills): `coworkers/video/atoms/image-generation/create-image-nano-banana-2-fal`
- Composing molecule: `coworkers/video/molecules/ugc-ad/create-ugc-style-video`
- Shared helpers: `coworkers/video/atoms/_shared/fal_helpers.py`

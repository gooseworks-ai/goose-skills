# Human version

**Summary.** Use this guide whenever a generated image will contain a person: a recipe's creator reference, or any person in a custom video. Outside a recipe that prescribes its own still, the person comes from create-creator-takes-h3's `make_character.py`, never a hand-written prompt. The current brief supplies the person, wardrobe and setting; this guide supplies the photographic craft and checks. Model availability and a previous successful face do not guarantee that the video provider will accept a new reference.

This reference travels with `create-image-fal`. It requires no Studio checkout. It is derived from the Studio avatar guide at source revision `1db6399e0cb75f52cd876a818475abdc6cf09c23`; historical experiments are observations, not defaults.

---

# Agent version

## Read before spending

Read this file before generating any image that contains a person, with or without a recipe. If a required guide or capability cannot be fetched or opened, identify the missing package/file and stop before any paid call. Do not invent its instructions.

Use the image model and render engine specified by the current approved recipe. Confirm the exact model ID and payload against current provider documentation and the GooseWorks proxy's supported path. Quote current costs through the existing estimate flow. This guide does not authorize a different engine, another avatar, a test clip or a retry.

When the recipe does not prescribe its own creator still, including custom videos, generate the person with create-creator-takes-h3's scripts/make_character.py. It fills the realism formula from six required choices and defaults to fal-ai/nano-banana-pro, 4K and a phone-camera capture with deep focus. A hand-filled prompt is not a substitute: hand-filled runs left slots blank and produced the composite face this guide warns about. Never use Flux dev or schnell for a person. When the selected video route forbids person references (for example render-street-interview), make no person still at all.

The Studio guide recorded a Seedream v5/pro proxy failure in July 2026, while later recipes name that model. That dated failure is not a current availability rule. Neither a Seedream nor a GPT-image portrait is a guaranteed pass through a video's likeness policy.

## Bind the creator to the brief

- Fill gender, age range, look, hair, face, voice, wardrobe and setting from the recipe's creator choices and the approved brief.
- If the user says "you pick", choose for this brand's audience and state the selection in the brief they review.
- Examples from previous brands are evidence only. Do not reuse their people, clothes or settings as defaults.
- Keep the chosen wardrobe explicit so the still and subsequent scenes agree.

## Build an identity reference

Use vertical framing, a clear frontal gaze into the lens and an unobstructed face. Start with a plain neutral background when the portrait is an identity-only reference; describe the actual environment separately in the video prompt. Keep hands empty unless the recipe deliberately requires a worn or held product composite.

Use concrete photographic language: matte natural skin, visible pores, no retouching, physically plausible light and visible hair detail. Avoid abstract perfection words such as "beautiful", "perfect", "8k" and "hyperrealistic".

Choose the photographic register from the approved style:

| Register | Prompt details |
|---|---|
| Phone-native UGC | Front-camera framing, face large in frame, deep depth of field, sharp background, even light, slight sensor texture; avoid bokeh. |
| Cinematic brand portrait | A specific camera/lens, light direction, restrained film grain and documentary framing. Use shallow focus only when the approved style calls for it. |

Reference only. This shows what a recipe-prescribed still must contain; do not hand-fill it for a paid call when make_character.py applies:

> A vertical [phone-native / documentary] portrait of [approved creator description], wearing [approved wardrobe], against [identity-only background]. They look directly into the lens. Their skin is matte and natural, with visible pores and no retouching. [Approved light direction] produces physically plausible shadows. [Hands empty / approved product composite]. [Approved photographic register and framing].

## Person references and the video route

Never send a generated photoreal person as a reference image to bytedance/seedance-2.0/reference-to-video; its likeness gate refuses uploaded images of people. Describe people in text for Seedance, or use a route that accepts an approved still, such as create-creator-takes-h3 or a recipe that prescribes a creator still.

## Preserve the product

Source the exact product from approved brand assets. A standalone product reference on a plain background prevents an on-body photo from introducing a second person's hands or limbs. Keep the real product's silhouette, logo, materials and colour; do not redraw them from a text description.

For a worn small item, follow the recipe's composition step and inspect the resulting product on the creator. For a held product, retain the recipe's separate identity/product references and their declared order. Do not add reference slots or an environment image automatically.

## Review the still before video

Check gaze, framing, wardrobe, hands, skin treatment, product fidelity and the correspondence between every reference slot and its prompt binding. Crop each face, enlarge it 2× and inspect it: reject waxy or glossy skin, missing pores, a blurred or bokeh background (unless the approved style explicitly calls for shallow focus), garbled lettering, or a face under about 300 px tall. A slightly off-lens gaze can carry into the take. Fix or seek approval for a defective reference before submitting video.

Keep the canonical avatar as actual PNG bytes. For Seedream v5 Pro, request `output_format: "png"` (its documented default is JPEG); otherwise inspect the returned format and convert it locally to PNG. Renaming a `.jpg` file to `.png` does not convert it. Lossy conversion changes its pixels. Any optional watermark must be separately approved; this guide requires no new watermark operation.

## Policy rejection and recovery

A sufficiently realistic generated face can be rejected by a likeness policy regardless of the image model. A previous seed, resolution or successful brand does not guarantee acceptance for this run. Do not disguise a person or weaken provider safety checks.

On a terminal policy rejection, save the request ID and error, stop and explain the failure. Do not auto-resubmit, generate a second face or silently switch to a video engine with different audio or duration support. Propose an appropriate alternative with its changed output and cost for approval.

For a transport/poll timeout, recover the existing request before considering a new submission. Do not assume a rejected or interrupted call was free; rely on attributed charge records.

## Historical observations and limits

Studio's July avatar comparisons informed the matte-skin, frontal-gaze and identity-only-background guidance. Its August recurring-creator feedback favoured sharp phone-camera framing over cinematic blur. These observations explain the craft choices; they do not select a brand's creator or prove acceptance by a current model.

Render tier affects product detail. Follow the recipe's approved resolution and inspect the actual result. A cheap preview is not proof of the final tier's fidelity or policy acceptance, and this guide does not add another paid preview.

## Endpoint evidence (checked 2026-10-03)

Fal documents [Seedream v4](https://fal.ai/models/fal-ai/bytedance/seedream/v4/text-to-image/api) as `fal-ai/bytedance/seedream/v4/text-to-image` and [Seedream v5 Pro](https://fal.ai/models/bytedance/seedream/v5/pro/text-to-image/api) as `bytedance/seedream/v5/pro/text-to-image`. Keep the exact provider ID selected by the recipe; do not add a `fal-ai/` prefix to the bare v5 ID. A documented endpoint is not proof of a fresh GooseWorks proxy call or likeness-policy acceptance.

There is no automatic fallback engine: an older recovery note named a Kling model fal has since retired. Switching engines needs a current availability check and the recipe's own engine choice, including any loss of native audio.

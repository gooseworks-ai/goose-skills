---
name: create-video-fal
description: Image-to-video (or text-to-video) via any FAL video model (Kling, Seedance, Veo), ROUTED THROUGH THE GooseWorks fal-proxy so the call bills the Ads agent. The template recipe names the model + params; image_url inputs must be public URLs (the orchestrator hosts local frames via MCP get_upload_url -> get_download_url). Returns the result video URL and downloads it. Use for the generative base clip of any video-ad format.
status: active
---

# create-video-fal

Image-to-video (or text-to-video) via any FAL video model (Kling, Seedance, Veo), ROUTED THROUGH THE GooseWorks fal-proxy so the call bills the Ads agent. The template recipe names the model + params; image_url inputs must be public URLs (the orchestrator hosts local frames via MCP get_upload_url -> get_download_url). Returns the result video URL and downloads it. Use for the generative base clip of any video-ad format.

## Run
gen_video.py --model fal-ai/kling-video/v2.1/standard/image-to-video --payload '{...}' --out clip.mp4 — bills the agent; host-swaps the FAL queue URLs; downloads the result.

## Contract
- Paid calls route through the GooseWorks proxies (bills the Ads agent) via the
  bundled `media_proxy.py` — never a provider SDK's default host.
- The template recipe (DB) supplies the model + params; this capability is generic.

## Rejection, physical constraints and cast planning

A provider likeness/policy rejection stops the attempt. Preserve the provider's reason, request id and charged/uncharged/unknown state. Do not resubmit an identical rejected payload. Offer a permitted original character, user-cleared reference, or a supported non-likeness route only when allowed by that provider. A different model is not a policy bypass. Review changed inputs and extra spend through the normal approval flow.

Before generation, write a scene checklist from the brief: each wearable's exact count and body location; which hand holds each object; allowed gestures; object contacts and movement; cast identities and reference ownership. Keep unnecessary hands still, use one simple action per shot, and review the whole generated take against the checklist. A prompt is prevention, not proof: reject extra/missing products, impossible contacts or identity drift.

For multiple characters, compare a shared scene with pinned references, fewer people per shot, and separately generated/composed plates. The first preserves interaction but risks identity drift; separate plates improve control but add composition work and may weaken interaction. Lock an approved reference per person and map who speaks each line. No six-character/two-attempt guarantee is supported. A future paid benchmark must state cast size, attempts, budget, model/settings and pass criteria (identity, speaker, counts, gestures and complete dialogue) and retain every failure.

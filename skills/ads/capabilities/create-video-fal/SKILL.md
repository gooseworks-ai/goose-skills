---
name: create-video-fal
description: Image-to-video (or text-to-video) via any FAL video model (Kling, Seedance, Veo), ROUTED THROUGH THE GooseWorks fal-proxy so the call bills the Ads agent. The template recipe names the model + params; image_url inputs must be public URLs (the orchestrator hosts local frames with the MCP media_upload). Returns the result video URL and downloads it. Use for the generative base clip of any video-ad format.
status: active
---

# create-video-fal

Image-to-video (or text-to-video) via any FAL video model (Kling, Seedance, Veo), ROUTED THROUGH THE GooseWorks fal-proxy so the call bills the Ads agent. The template recipe names the model + params; image_url inputs must be public URLs (the orchestrator hosts local frames with the MCP media_upload). Returns the result video URL and downloads it. Use for the generative base clip of any video-ad format.

## Run
gen_video.py --model fal-ai/kling-video/v3/pro/image-to-video --payload '{...}' --out clip.mp4 — bills the agent; host-swaps the FAL queue URLs; downloads the result.

## Contract
- Paid calls route through the GooseWorks proxies (bills the Ads agent) via the
  bundled `media_proxy.py` — never a provider SDK's default host.
- The template recipe (DB) supplies the model + params; this capability is generic.

## Rejection, physical constraints and cast planning

A provider likeness/policy rejection stops the attempt. Preserve the provider's reason, request id and charged/uncharged/unknown state. Do not resubmit an identical rejected payload. Offer a permitted original character, user-cleared reference, or a supported non-likeness route only when allowed by that provider. A different model is not a policy bypass. Review changed inputs and extra spend through the normal approval flow.

Before generation, write a scene checklist from the brief: each wearable's exact count and body location; which hand holds each object; allowed gestures; object contacts and movement; cast identities and reference ownership. Keep unnecessary hands still, use one simple action per shot, and review the whole generated take against the checklist. A prompt is prevention, not proof: reject extra/missing products, impossible contacts or identity drift.

For multiple characters, compare a shared scene with pinned references, fewer people per shot, and separately generated/composed plates. The first preserves interaction but risks identity drift; separate plates improve control but add composition work and may weaken interaction. Lock an approved reference per person and map who speaks each line. No six-character/two-attempt guarantee is supported. A future paid benchmark must state cast size, attempts, budget, model/settings and pass criteria (identity, speaker, counts, gestures and complete dialogue) and retain every failure.

## Model notes

How the video models behave, measured on shipped projects. Each note lives here once; recipes
point here instead of repeating it. Seedance and the talking-creator models keep their notes in
their own atoms.

- **Veo 3.1 reads states as stills.** "Legs in jeans on a wet curb" gives a near-static clip. Name
  actions with verbs (steps off, pivots, taps) when the clip has to move.
- **Veo 3.1 keeps the start image's composition** (angle, distance, what is cropped) for the whole
  clip. The start image is the framing, not just a reference.
- **Veo 3.1 takes 4, 6 or 8 seconds only.** It paces speech to fill the length, so ask for about 6
  rather than 8 and keep the tail short; defects live in the tail. Handheld motion and a music bed
  are luck per seed, so plan several seeds for a shot that needs them.
- **Veo 3.1 Fast ad-libs words** and, from about 4 seconds, the eyes can widen and stare. Ask for 4
  seconds for a one-line clip.
- **Kling v3 for flat 2D or editorial illustration:** at `cfg_scale` 0.5 or lower, with motion-only
  prompts, it adds on-style motion where Seedance and Veo invent photoreal middle states.
- **Kling v3 holds one state per clip.** Staged "first, then, finally" prompts change only in the
  last half-second, and a neutral face drifts to a smile and then to mouthing words. Ask for one
  state per clip and build the arc in the edit.
- **Kling v3 standard returns 2:3** (784x1176) when asked for 9:16. Check the returned size and give
  the start image side margin when Kling is the engine.
- **Hard constraints need saying three ways** (image and video). A single "no face" holds about
  half the time. State it as a positive rule near the top, a negation in the middle and a scope
  rule at the end.
- **Failures:** an NSFW false positive needs the visual trigger words removed; a timeout with no
  detail gets one unchanged retry, then a simpler prompt; a rate limit means wait. A policy
  refusal is final (above).
- **Realism comes from real pixels.** Prompted "grainy, shot on a phone" still reads as generated.
  When a shot must look filmed, restyle real footage, and narrow what the model invents: a blank
  glowing screen generates well, a legible interface does not, so composite the real UI in.
- **Change over a long period cannot be generated.** A shot defined by change longer than one clip
  (screens changing through a work session) needs real footage; the model renders one moment.

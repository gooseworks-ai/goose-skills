# Human version

Select reviewed characters, voices, sound and styles from existing collections. Give
camera, light and text a purpose, then judge the video against examples and the brief.
Measurements support that judgment; they do not replace it.

---

# Agent version

## Reuse existing libraries

Use the host's current catalogs; extend them rather than build competing ones. Every
selection has a stable ID, version/hash, files, provenance and usage limits, routes and
accepted examples. No unreviewed generated material.

| Collection | What selection preserves |
|---|---|
| Characters | Appearance/reference angles, wardrobe, accepted moving performance, identity and compatible world/route |
| Voices | Voice ID, language/accent, audition, delivery range, supported settings and pronunciation sheet |
| Music | Actual track/rights, usable section, mood/energy curve, cues and mix notes |
| SFX/foley | Actual sound/rights, action/context, clean excerpt and cue guidance |
| Overlay/caption styles | Accepted frames/motion, font/colour/hierarchy, copy density, safe areas and working composition |
| Camera/world setups | Accepted framing/light/set/props, measured product scale, useful coverage and use conditions |

Acceptance is specific to its use: a portrait does not clear animation, and a track
does not guarantee a good mix. Compare changed outputs with the accepted example.

## Camera, light and overlays

Plan shot purpose, size, angle, focus target and movement: wide for scale and world,
medium for use, close for a needed detail, as the brief needs. Inspect the delivery crop
at phone size. Reject blurred proof, unreadable labels, accidental face cuts and
distortion.

**Realism default.** Capture is a phone (`phone_counter`, `phone_selfie` or
`phone_observer`) with deep focus and no bokeh, in a lived-in, slightly cluttered real
room, never a plain wall or a white void. Every person prompt says "no retouching, no
skin smoothing, no beauty filter, no cinematic grade"; skin keeps pores and slight
asymmetry. Wardrobe and setting fit the activity.

**Light and realism block.** Every photoreal still prompt (people, products, B-roll)
ends with these words, verbatim:

> One window or lamp lights the scene from one side, with a darker shadow side and
> gentle falloff; normal phone exposure, highlights not clipped, no HDR; matte skin with
> no added shine; no over-sharpening or halos.

Every H3 or other video motion prompt, B-roll included, ends with: "Keep the first
frame's light and exposure, matte skin, no added shine or sharpening halos." (creator-h3
1.6.0 and video-h3max 1.2.0 add it on the kit path.) Name the window or lamp in the
scene. A shot with flat shadowless light, HDR contrast, gloss or halos is a repair. Studio light or shallow focus only when the approved style comes from a studio-shot
reference, listed in `changes_from_reference` as `camera` when it differs. A phone on a
counter can be steady. Record main light, contrast, exposure, white balance and the
continuing set. Check skin, eyes, teeth, hands, contact, shadows and reflections, still
and moving. Smooth skin, a blurred background or unmotivated light is a repair.

Choose an accepted overlay style or explicit references before rendering, with
typography, hierarchy, placement, density and motion. Keep speech captions apart from
proof labels. Opaque cards never hide the action. Exact copy and logo composition does
not repair wrong product footage.

## Sound and pacing

Audition owned, licensed or approved generated music in context, choosing its section
around hook, reveal, proof and ending. Keep intended quiet. Sine tones, drones and noise are never music; the
`tone_only` final measurement fails them. Add believable foley
selectively; whooshes cannot hide bad timing. Hear the full mix for masking, pumping,
clipped endings and joins.

Use Creator Grammar: purposeful cuts, a clear opening, payoff holds, readable captions
and speech continuing under B-roll. No universal cut intervals, fixed ducking ratios or
fake phone shake. Fast cuts cannot fix incoherent actions or bullet cadence.

## Calibrated content review

Use accepted and rejected examples with exact source, interval and rationale. Keep
user judgments as attributed feedback, never as the agent's own listening. Record the
reviewer's real perception (`listened`/`watched` or `measured`).

For each applicable dimension record pass, needs_revision or incomplete:

- Concept/script: intelligible opening, buyer/product explanation and connected payoff.
- Reference/brief: retained mechanism and required beats, with trustworthy mapping.
- Product/use: exact variant, parts, shape, scale, claims, use and capacity evidence.
- Physical action/world: complete plausible action, state/order/contact and continuity.
- Creator: identity, anatomy, skin/light, gaze, expressions and object interaction.
- Voice: heard words, pronunciation, natural role/delivery, consistency and clean endings.
- Lip-sync: source-clock alignment plus perceived mouth matching across the performance.
- Camera/light: purposeful framing, sharp required detail and coherent scene illumination.
- Text: accurate, readable, timed and unobstructive overlays/captions.
- Sound: appropriate music/foley, intelligible speech and intentional gaps/peaks.
- Pacing: each shot adds information, with enough proof time and no accidental dead air.
- Delivery/evidence: exact reviewed bytes, current revisions and complete duties.

A taste score cannot average away a blocking defect or missing duty, and metrics alone
do not prove believability. Recheck affected dimensions after repair.

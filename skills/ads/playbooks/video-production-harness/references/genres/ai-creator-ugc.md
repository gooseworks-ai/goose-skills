# AI creator UGC

An AI creator talks to the phone about one product, with handheld product shots between lines. Routing rows are named as in the shot-routing guide.

## Shot list skeleton
1. 0-1 s cold open: the payoff moment, lifted from later.
2. 1-4 s hook, selfie: product by the face, line 1.
3. 4-8 s rear camera, no face: one handling move under the voice.
4. 8-12 s macro in hand: the only beat where small print shows.
5. 12-15 s selfie: product up, names the brand.
6. 15-17.5 s end card: real logo, one CTA; the last words run over it.

## Routing rows
Talking creator, exact script · Talking creator, single native take · Cast anchor portrait · Set / world reference still · Creator B-roll, no speech · Product in hand / motion from a keyframe · Photoreal keyframe / product hero · End card · Captions.

## Voice
Follow [speech and route qualification](../speech-and-route-qualification.md) and [talking-actor production](../talking-actor.md). Show three actors when casting is new, then playable voice choices beside the selected actor. Prefer qualified joint voice-and-picture generation for a realistic performer needing the selected timbre, with the actual route quoted and approved. Exact supplied audio uses `exact_audio_lipsync` (`speech_mode: audio_driven_lipsync`), one accepted voice line per clip. Voice-reference H3 is `native_dialogue`, keeps its generated audio and must be compared with the audition. Unconditioned native H3 speech has no voice pair; this remains a separate single-take interface without a promised ElevenLabs voice. Set `soundtrack_modes` independently and record generated speech as `voiceover_strategy: synthetic_vo`.

## Pacing
- Size the words from the reference's rate from `../../scripts/reference_rate.py`; 2.8-3.2 words/s only when it has no speech.
- 3-4 hard cuts per take, a new framing each; no expression held over 2 s.
- Longer ads: use approved line-sized performances on the selected qualified route; the voice continues under B-roll on linked source clocks.

## Nearest template
`ugc-product`

## Top 5 failures and fixes
- Plastic skin or lost background proof → repair against the approved look. Tune phone finishing only for a phone brief; do not add a grain pass automatically.
- Product redrawn or mirrored → a clean product-only photo as reference, and the size facts in [product scale and world](../product-scale-and-world.md); check the label; flip a mirrored take only when no text or asymmetric part shows.
- Filler speech or the mouth moving between lines → size each take to its words; "lips closed when not speaking".
- Hands morph or the product floats → hold, tilt and turn only; nothing poured or sprayed.
- Brand word misspoken → respell it phonetically in the line; captions keep the real spelling.

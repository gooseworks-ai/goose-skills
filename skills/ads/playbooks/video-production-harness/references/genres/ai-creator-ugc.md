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
Follow [speech and route qualification](../speech-and-route-qualification.md). **Voice first is the default** when the creator talks across several clips: the final ElevenLabs line is made and accepted first, then one lip-sync per line, one line per clip (`exact_audio_lipsync`, recorded as `speech_mode: audio_driven_lipsync`). Native H3 speech (`native_dialogue`) is only for a single take of 15 s or less, at most 3.2 words/s, cut only between sentences and never retimed. Set `soundtrack_modes` on their own. The speech is generated, so record `voiceover_strategy: synthetic_vo` (not the UGC default `real_voice`) For voice first, show the paired voice (`character.voice_pair`) beside the creator's still at the ingredient review, so the owner approves the two together; native H3 speech has no voice pair and its voice is accepted with the first take.

## Pacing
- Size the words from the reference's rate from `../../scripts/reference_rate.py`; 2.8-3.2 words/s only when it has no speech.
- 3-4 hard cuts per take, a new framing each; no expression held over 2 s.
- Longer ads: voice first, one line per clip; the voice continues under B-roll.

## Nearest template
`ugc-product`

## Top 5 failures and fixes
- Plastic skin or a blurred background → phone capture, deep focus, no bokeh, a lived-in room, natural skin with pores, no retouching or beauty filter; one grain pass on every clip.
- Product redrawn or mirrored → a clean product-only photo as reference, and the size facts in [product scale and world](../product-scale-and-world.md); check the label; flip a mirrored take only when no text or asymmetric part shows.
- Filler speech or the mouth moving between lines → size each take to its words; "lips closed when not speaking".
- Hands morph or the product floats → hold, tilt and turn only; nothing poured or sprayed.
- Brand word misspoken → respell it phonetically in the line; captions keep the real spelling.

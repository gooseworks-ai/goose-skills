# Narrator over a montage

A narrator (a voiceover or a cartoon cutout) talks over a fast montage of different people using the product: picking, applying, peeling, pouring, stirring. Nobody on screen talks to the lens. Routing rows are named as in the shot-routing guide. Plan the shots from the reference's cut list (`../../scripts/reference_shots.py`), not from the script's beats; a long narration sentence runs across several shots.

## Shot list skeleton
1. 0-2 s hook: a person mid-action on the problem (a hand at a spot, a mirror check), never a still face.
2. A new setup every 1.5-3.5 s: another person, room, framing or action. At least 3 people for 45 s or more; match the reference's setups within 30%.
3. Every B-roll clip has one physical action with the product or the face: apply, peel, press, pour, stir, cut, stick on. "Nobody speaks" always comes with that named action.
4. Product beats: the real pack in a hand, front label to the camera; each use step as the brand's directions say it.
5. A dropped reference action (a claim, a competitor jab, an offer) gets a replacement visible action for the same seconds.
6. End card: real logo, one CTA; the narrator's last words run over it.

## Routing rows
Voiceover · Cast anchor portrait · Creator B-roll, no speech · Product in hand or in use (still) · Product in hand / motion from a keyframe · Photoreal keyframe / product hero · Cartoon keyframe · Lipsync onto an existing take or still · Captions · End card.

## People
Make every on-screen person with create-creator-takes-h3's make_character.py `--capture phone_observer` (or `--action "<task>"`) and `--no-voice-pair`, never the talking-head defaults: hands busy, eyes on the task, off-centre, the head 20-40% of the frame. When the product treats a visible condition the reference shows (acne, blackheads, redness), pass `--skin-condition`; a patch never sits on clear skin. A narrator cutout is a cartoon (Nano Banana) lip-synced to the voice, at the reference's size and corner; it is the only lip-sync here. The montage people never speak and are never lip-synced: voiceover over B-roll stays voiceover ([speech and route qualification](../speech-and-route-qualification.md)).

## Pacing
- Voice at the reference's measured rate; the voice continues across cuts.
- A hands-on action in at least half the shots; gaze on the action, not the lens.
- At most one punch-in per take, on a spoken emphasis; never alternate punch-in and out to make cuts.
- A setup that fails its redo is replaced by a different approved setup, never by reusing an accepted clip.

## Nearest template
`narrated-ugc-wardrobe-stitch`

## Top 5 failures and fixes
- Two faces cut back and forth → plan from the cut list; new people and rooms, not new crops of one take.
- Staring faces with nothing happening → `phone_observer` stills and one named action per B-roll clip.
- AI light and gloss → the light and realism block in every still and motion prompt.
- A blank or sticker-flat pack → the real product photo as reference image 1, front label to the camera.
- A dropped beat becomes a still face → write a replacement visible action for those seconds.

# Reviewing a finished video — honestly

Load at Step 8.

## 1. Rubric

Items 1–4 block handing over; the rest are fixed or labelled. Nothing here makes a video "ready" — it becomes "ready for your watch-through".

1. **Words = approved script.** Rendered transcript matches the approved voice lines word for word; captions match; brand and product names pronounced right; no new words.
2. **Claims and disclosures.** No on-screen text, end card, grid card or picture implies an unapproved claim or result (staging: an end card read "acne-safe skincare", unsigned, and the engine's check passed it); disclaimers and AI/dramatisation labels present, legible, held long enough; the offer correct and current.
3. **Product fidelity.** Each scene shows the product its line names; label legible and correct; colour, shape and scale plausible; no morphing between shots; right variant.
4. **Speaker test** (`claims-policy-and-people.md` §3): no generated person presents as a real customer; any first-person usage line — spoken, on screen or in captions — carries a visible label that actually rendered, and no results.
5. **Hook.** Frame 1 reads as a still; hook text readable in under a second and inside safe zones; the hook pays off.
6. **Sound-off.** The story lands from picture and text alone.
7. **Pacing.** No dead air over ~1s; voice not clipped at cuts; duration within ~1s of target.
8. **Audio.** Voice intelligible over music; no artefacts; music generated or licensed.
9. **Visual quality.** No AI artefacts (hands, faces, teeth, garbled background text), no flicker, cast looks consistent between scenes.
10. **Brand.** Colours, type, logo, end card; voice and banned words.
11. **Spec.** Ratio, resolution, captions inside safe zones.
12. **The real bar:** would this brand post it exactly as it is?

## 2. Evidence you can actually get (verified on staging)

- `gooseworks:video_read` `include: ["renders","recipe"]` — the final render's `asset_id` and URL, each scene's parts and credits, and what the engine's check found ("Check: passed" covers files, not taste).
- `gooseworks:media_analyze` `action: "read"` on the render's `asset_id` with the `project_id` — the full transcript with word timings, each detected shot with a description, its on-screen text and a key frame, duration, ratio and whether there is audio. This works in chat hosts with no shell.
- Key frames: look at them yourself when the host can show images.

**What this catches that "Check: passed" does not** — a real staging render that passed the engine's check had a voice line about one product ("Full Clarity cleans without stripping moisture") playing over shots of two other products, on-screen text naming the wrong product over a mist spray, and the transcript reading "Unplugged" for the product "Unplug". A transcript-and-scene read pointed at all three in a minute — as things for the human to confirm (the third may be the speech-to-text). The same video also has a generated creator speaking in the first person about her routine with no dramatisation label: a speaker-test failure the engine's check does not look for.

**What the reads cannot tell you.** `media_analyze` samples one key frame per shot, and its visible text holds what was in those frames — supers shown between samples are not there. Text absent from the read is "not seen in sampled frames", never "missing". A transcript difference ("Unplugged" vs "Unplug") may be the speech-to-text, not the voice. The engine itself says a review without real playback is incomplete.

## 3. Procedure

1. Diff the transcript against the approved voice lines. List every difference (missing, added, mispronounced words).
2. Walk the scenes: for each, does the picture show what the line is about? Is the on-screen text the approved text, spelled right? Does any picture imply a result?
3. Check the first frame, the product shots and the end card in the key frames.
4. Read the engine's check notes; translate failures into plain words.
5. Write each finding as "the automatic read shows X at <time> — please confirm". Propose a targeted, priced `video_fix` only for a defect the human confirms; otherwise label it or leave it to their watch-through.

## 4. Saying what you checked

Always, at the final gate:

> "I can't watch or listen to video here. I checked: the spoken words against the approved script (match / 2 differences: …), what each scene shows and its on-screen text, the opening and product frames, and the automatic quality check (passed / flagged …). Only you can judge: motion glitches, voice tone and pacing, the music, and the overall feel. Please watch the first three seconds and every product shot before you run it."

Never say "it looks great" about motion or audio you did not perceive. A shell agent that extracted frames still did not judge motion.

## 5. Fixes and the record

- Fixes are targeted: a scene rewritten (`scenes` with the new line, on-screen text or picture), a scene remade as is (`remake`), a new voice or music mood. Each has a price and is made only for a defect the human confirmed, on their yes; new words are shown even when the earlier yes covers the money. Two rounds at most.
- The human's decision: `gooseworks:video_review` `kept` / `rejected` with `reasons` (`off_brand`, `bad_hook`, `glitch`, `wrong_product`, `boring`) and their words as the `note` (claim problems, wrong words, unreadable text, bad voice, fake-looking person and pacing have no reason code yet — put them in the note).
- A brand correction the human makes while reviewing (a name said wrong, a claim never to make) → saved through the shared save-learning atom (`../../../skills/save-learning/SKILL.md`) in the same turn, in their words.

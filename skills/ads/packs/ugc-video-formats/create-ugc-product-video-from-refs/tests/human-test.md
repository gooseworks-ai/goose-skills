# Human Test

Run the full molecule against `tests/sample-input.md` (or a real brief + refs)
and judge the delivered video by eye.

## Procedure
1. Provide a brief + at least one product and one avatar reference.
2. Approve the Phase 1 (GPT-image-2) and Phase 3 (Seedance) prompts at the gates.
3. Let the review-loop report issues; or point out a beat that looks wrong.
4. Approve a fix re-render; confirm the stitch lands the new beat in place.

## Acceptance criteria (judge the final mp4)
- [ ] Reads as authentic selfie UGC, not a polished spec ad.
- [ ] All beats land in order; hard cuts are clean (no black-frame flashes).
- [ ] Dialogue is intelligible and lip-sync is believable on front-cam beats.
- [ ] The product is recognizably the SAME object in every shot (no morph).
- [ ] Distinct colors stay distinct (e.g. lime outfit vs mint frame).
- [ ] No contorted limbs, duplicate objects, or stray items in any beat.
- [ ] The repaired beat looks at least as good as the rest of the take.
- [ ] Duration matches the request; no captions burned in.
- [ ] Every paid call was shown and approved before it fired.

## Red flags (fail)
- A beat re-render was fired without approval.
- Captions were burned in.
- The fix replaced a beat that itself drifts.
- Audio drifts out of sync after stitching.

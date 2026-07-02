# Human Test

Run the full molecule against `tests/sample-input.md` (or a real brief + refs)
and judge the delivered video by eye.

## Procedure
1. Provide a brief + a skincare product reference and an avatar reference.
2. Approve the Phase 1 (GPT-image-2) and Phase 3 (Seedance) prompts at the gates.
3. Let the review-loop report issues; or point out a beat that looks wrong.
4. Approve a fix re-render; confirm the stitch lands the new beat in place.

## Acceptance criteria (judge the final mp4)
- [ ] Reads as authentic, intimate skincare UGC — a real girl filming for
      friends, not a polished spec ad.
- [ ] **NO phone, camera, hands-holding-a-phone, or mirror-of-a-device appears
      in ANY frame.** (The make-or-break check.)
- [ ] All beats land in order; hard cuts are clean (no black-frame flashes).
- [ ] Dialogue is intelligible and lip-sync is believable on the talking beats;
      the application beat is silent.
- [ ] The product is recognizably the SAME bottle in every shot (no morph); the
      label is legible in the hero close-up.
- [ ] No extra/warped fingers in the application close-up.
- [ ] Audio is her voice + bathroom room tone only — no music, no SFX.
- [ ] Duration matches the request; no captions burned in.
- [ ] Every paid call was shown and approved before it fired.

## Red flags (fail)
- A phone, mirror-selfie, or device reflection appears anywhere.
- A beat re-render was fired without approval.
- Captions, music, or SFX were added.
- The fix replaced a beat that itself drifts or shows a device.
- Audio drifts out of sync after stitching.

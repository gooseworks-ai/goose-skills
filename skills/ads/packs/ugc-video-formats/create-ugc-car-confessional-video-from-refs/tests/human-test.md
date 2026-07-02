# Human Test

Run the full skill against `tests/sample-input.md` (or a real brief) and judge the
delivered video by eye.

## Procedure
1. Give a brief. Confirm Phase 0 proactively offered avatar / location / product
   (take defaults, or supply your own persona / setting / product image).
2. Approve the Phase 1 (GPT-image-2 still) and Phase 4 (Seedance) prompts at the gates.
3. Let the review-loop report issues; or point out a second that looks wrong.
4. If needed, approve a surgical window fix; confirm the stitch preserves audio sync.

## Acceptance criteria (judge the final mp4)
- [ ] Reads as an authentic phone selfie confession in a parked car, not a spec ad.
- [ ] ONE continuous take — no cuts, no second person appears.
- [ ] The car stays parked (no scenery moving past the windows).
- [ ] The creator is alive — natural head/hand micro-motion, not a frozen mannequin.
- [ ] Dialogue is intelligible; lip-sync is believable; transcript matches the script.
- [ ] Identity, wardrobe, and car interior are consistent throughout (no morph).
- [ ] (Product build) the product is the SAME object, label legible when held; no
      warped hands; no contact physics.
- [ ] Duration matches the request; NO captions, NO music.
- [ ] Every paid call was shown and approved; iteration was probed at 720p first.

## Red flags (fail)
- The car appears to be driving / background scenery scrolls.
- The creator is a static mannequin (mouth moves, nothing else).
- A second person or a reflected/extra face appears.
- Captions or music were added.
- A render was fired without approval, or 1080p fired before a 720p probe.
- Audio drifts out of sync after a stitch fix.

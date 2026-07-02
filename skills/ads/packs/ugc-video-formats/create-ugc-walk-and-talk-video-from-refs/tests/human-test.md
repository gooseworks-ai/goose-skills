# Human Test

Run the full skill against `tests/sample-input.md` (or a real brief) and judge
the delivered video by eye. Phases are inherited from
`create-ugc-car-confessional-video-from-refs`; the acceptance below adds the
walk-and-talk deltas.

## Procedure
1. Provide a brief (topic + energy + any must-say lines); pick avatar / location
   / product in Phase 0 (default = demo persona + walkable street + testimonial).
2. Approve the Phase 1 (GPT-image-2 composed arm-out still) and Phase 3
   (Seedance) prompts at the gates.
3. Probe at 720p; let the review-loop report issues, or point out a bad window.
4. If needed, approve a silent fix re-render; confirm the stitch lands the new
   window over the master audio. Upgrade the winner to 1080p.

## Acceptance criteria (judge the final mp4)
- [ ] Reads as authentic selfie walk-vlog UGC, not a polished spec ad.
- [ ] **Genuine locomotion** — she is clearly walking forward; the background
      drifts past with real parallax (not walking on the spot, not floating).
- [ ] **No background warp/melt** — scenery and any pedestrians hold shape.
- [ ] Framed a little wider than a car confessional so the moving street reads;
      face upper-center.
- [ ] Walk-native micro-motion — step-and-breeze hair, a gesture, one glance over
      the shoulder; she reads as alive, not a mannequin.
- [ ] Dialogue is intelligible and lip-sync is believable; brisk/upbeat pace.
- [ ] Identity + wardrobe + hair are the SAME start to finish (no morph).
- [ ] Single continuous take — no cuts, no second person appearing.
- [ ] Duration matches the request; no captions burned in; no music.
- [ ] Every paid call was shown and approved before it fired.

## Red flags (fail)
- She walks on the spot / floats on a static background (no real parallax).
- The busy background melts or pedestrians distort and it was shipped anyway.
- A render was fired without approval, or captions/music were added.
- The fix replaced a window that itself drifts, or audio drifts after stitching.

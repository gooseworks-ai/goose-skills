# Street interview: format rules (Critical knowledge, part 1)

**Summary.** The sixteen headline rules of the format: one generation per video, one stated location, deep focus, local lettering, the loudness chain, the gate, and where realism tops out.

Part of the street-interview development record, split out of [`REFERENCE.md`](../REFERENCE.md). It is history, not today's runbook: `SKILL.md` and the selected recipe win where they differ. Brands, seeds and props are those experiments' (fictional brand names), never another brand's defaults. File names in backticks (`TAKES.md`, `selftest.py`, `brands/...`) are relative to the skill folder.

---

## Critical knowledge

### 1. ONE generation for the whole video. Never assemble separate ones.
This is the finding the whole recipe rests on. An earlier build assembled nine generations and
was rejected five times running, for: six strangers on six different streets, two different
seasons in one video, a room-tone jump at every cut, a hook that walked up to one man and cut
to another, and a dubbed interviewer who never sat in the scene. Every one of those faults is
*caused by stitching* and none of them can exist in a single call.

MEASURED: per-shot ambience floor -35 to -39 dB in the single take, against -13 to -27 dB in the
assembled cut. The real reference sits at -32 to -52 dB.

Everything the assembled version needed - per-shot colour matching, an ambience bed, edge fades,
a dubbed interviewer, per-line level normalisation, VO placed against measured boundaries -
existed only to paper over stitching. The single take needs colour and captions.

### 2. The cost of one call is length. The idea has to fit in 12-15s.
Seedance caps at 15s. Four people, not six. Write to that before generating, not after.

### 3. State ONE location, then refer back to it in every shot description.
"EVERY SHOT IS FILMED ON THE SAME CORNER: <place>. The same scaffolding, the same bus shelter
and the same parked cars are visible behind every person, and the light never changes." Without
the repetition the model still invents a new street per shot inside a single call.

### 4. The likeness gate fires on uploaded IMAGES of people, not on generated faces.
`reference-to-video` with a photoreal stranger as a reference is refused
(`content_policy_violation`, "likenesses of real people"). The same endpoint with a PRODUCT
reference passes, and the product keeps its real label. So: the can is a reference image, the
people are text.

### 5. Two hands, stated separately, or the model merges the mic into the can.
Seed 4801 produced no microphone at all: the prompt asked for a mic and a can in the
interviewer's hand and the model made one object. The wording that works names the right hand,
the left hand, and then says "they are two different objects in two different hands and are
never merged".

### 6. A single take still needs an ambience bed.
One call fixes the LOCATION but not the room tone: Seedance changes ambience across its own
internal cuts too, by a mean 18.0 dB on our take against 5.9 dB for the real reference. The bed
must come from the take's OWN speech-free gap, so it is literally the same street on the same
afternoon. A bed built from interview audio carries speech and loops it under the video, which
is what "random background noises" turned out to be.

### 7. Captions must be clamped to the take's own internal cuts.
The model lets a line run ~0.3s past its own cut. An uncaptioned-clamp printed the previous
person's words over the next person's face, which is the exact fault the assembled cut was
rejected for, reproduced inside a single take.

### 8. Deep focus. "Cinematic shallow depth of field" is the AI tell here.
Real phone footage keeps the street sharp behind the subject. MEASURED: real reference footage
is stabilised at 0.00px drift, so the usual "make it handheld and shaky" advice is backwards.

Prompt version 3 (2026-10-06): the operator rejects blurred backgrounds. v1/v2 ask for "the
background is softer than the person", which the model can read as permission to blur. v3 keeps
the natural falloff needle ("detail falls away behind the subject") but bounds it: only slightly,
the street stays in focus, "never blurred and never bokeh". It does not return to the plain
"deep depth of field" clause, which measured over-sharp (15.92 against 4.76-9.60 for real
footage). v3 is draft until one 720p take measures inside that band with no bokeh.

### 9. Do not sharpen or grain in the finishing pass.
MEASURED: the raw generation already sits at 534 laplacian sharpness against 530 for the real
reference. An 0.4 unsharp "phone ISP halo" pushed the finished cut to 695, so the finishing pass
was itself adding the AI tell it was meant to remove. unsharp 0.12, grain 0.

### 10. Do not add randomness for "realism".
Per-shot audio gain jitter and per-shot exposure jitter were both added to make the cut feel
less synthetic. Both made it feel MORE disjointed, because the thing being simulated (a single
camera in a single place) has no such variation. Removed.

### 11. The limiter goes AFTER loudnorm, and loudness needs a corrective pass.
`linear=true` applies a fixed gain and does not itself cap peaks; true peak reached -0.1 dBTP.
Linear loudnorm also undershoots ~0.4 LU on this stack every time, so the finished file is
measured once more and a corrective gain applied. Videos shown back to back must not step.

### 12. No model renders a letter. Ever.
Every caption, title, pill and end card is drawn locally with PIL. The can is the real product
photo, the logo is the real file. The prompt bans signage, posters and subtitles, because
generated text is garbled and it is on screen long enough to screenshot.

### 13. Run `check-cut.py`, and falsify a check before believing its failure.
Three separate detectors written for this format were themselves the bug:
 - a brightness threshold "found text" in the sky, a white can and a sheet of paper;
 - frame differencing against the raw take flagged the whole frame, because the grade and the
   handheld motion differ too;
 - the frame sampler ran past the source's end, got empty frames, and **silently passed a file
   it had never looked at**.
The gate now differences against a control built through the *identical encode chain* with the
captions left out, and counts a row as graphics only when many of its pixels differ. It is
falsified against a planted out-of-zone caption before use.

### 14. Generated faces are the ceiling, and it is a purchase decision, not a technique.
Four rounds of generated strangers were rejected as "AI slop" before the single-generation
finding. What remains will not survive a close look at a face. Arcads-grade realism comes from
~1,000 licensed REAL actors on a paid tier (needed for API access). That is the honest shape
of the gap: not a prompt, a licence.

### 15. Two measured gaps against the reference bar, both free to close.
Median shot length is 2.61s against 1.54-1.62s for all three real references, and the final shot
runs 5.18s. Both are a function of how many internal shots one call is asked for, not of spend.

### 16. Path resolution: never assume a script sits next to its take.
Three of these four scripts once crashed on their own dry run because they were lifted out of the
run folder, where `parents[2]` was the repo root and `./takes/` held the take. `scripts/paths.py`
finds the repo root by marker and the run folder by `--run`. Its markers are deliberately not
`SYNC.md` or `SYNC_LEDGER.json`: both vanished from the working tree mid-session, because other
sessions run in this checkout at the same time.

---
name: create-street-interview-video
description: Produce a 12-15s 9:16 street interview where strangers guess wrong about a product and the last one gets it right. ONE generation, not an assembled cut - one location, one light, one room tone, and the interviewer's question generated inside the clip. Brand layer (captions, title, end card) drawn locally so no model renders a letter. Built as a Goose Video recipe for DTC brands.
owner: apoorv
status: draft
version: 2
created: 2026-09-29
updated: 2026-09-29
---

# create-street-interview-video

## Purpose

The vox pop, as a repeatable recipe. Someone asks strangers a question about a product, they
guess wrong in an escalating way, and the last answer is the truth. It is the highest-reach
short-form format in this niche and the most dangerous to build, because it needs believable
human faces.

**Closest siblings:** `molecules/create-avatar-reel` for generated people, and
`molecules/create-goose-host-list-reel` for the caption and mastering machinery. Read
`skills/atoms/_shared/MODEL_BEHAVIORS.md` and `one-shot-videos/AVATAR_GENERATION.md` before
generating.

**Read `READINESS.md` first.** It states what is proven, what is not, and what the next
experiment is. The short version: the scripts run unattended, and whether the generated faces
clear the realism bar has never been ruled on. Four earlier rounds did not. `TAKES.md` has every
rejected take and seed; `references/REFERENCES.md` has the measured bar.

NOT the right molecule for: a single talking head to camera (`create-avatar-reel`), a product
demo (`product-video/`), or anything where the faces must be a specific real person.

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
~1,000 licensed REAL actors at ~$11/video (Pro tier for API access). That is the honest shape
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

## Pipeline

```
brand-research        real facts and real assets              [required first]
write 4 beats         question, two wrong, one right          [fits 12-15s or it does not ship]
brands/<slug>.json    the creative, as data; copy the demo    [free; brandkit.py validates it]
selftest.py           the format survived the split           [free; no network, no ffmpeg]
single_gen.py         ONE call; dry run prints price + prompt  [PAID ~$3.64 at 12s/720p]
  or variants_gen.py  six alternative grammars                [REFUSES: all six fail the lint]
fit_grade.py          SOLVE the grade for THIS take            [free; --write-brand stores it]
build_looks.py        grade + brand layer, 5 treatments        [free; --dry-run needs no ffmpeg]
recut.py              drop the dead air; pace                  [free; writes a .plan.json map]
check-cut.py          the ship gate; --falsify first           [free]
falsify-all.py        plant a fault for EVERY check            [free; run it after touching one]
measure-pace.py       shot lengths off the render              [free; the gate does not see pace]
bench.py              every take AND every real reference,     [free; no network]
                      same axes, same code, one table
```

`build.py` chains generate -> grade -> recut -> gate in one command, and its output is a graded
re-cut TAKE, not a finished ad: nothing in that chain draws a caption, a title or an end card.
The brand layer is `build_looks.py`, and it runs from the UN-recut take. Two pipelines, and only
one of them finishes a video. See Critical knowledge 20-22.

`bench.py` is the benchmark, and it exists because every realism number this format has quoted
was measured by a different ad-hoc command on a different subset of files. It measures our takes
and the real references on one set of axes -- shot-length distribution, cuts per second, detail at
a FIXED pixel width, black point, face-region saturation, per-shot ambience floor, LUFS, true peak
-- and prints the band each row is in or out of, plus the band **re-derived from the reference rows
in that same run**, so an inherited band that does not reproduce is visible instead of applied.
Run it before believing any claim in this file.

Two layers, and neither holds the other's job:

| | |
|---|---|
| `scripts/format_spec.py` | the prompt scaffold, the shot grammar, and the clause list the gate lints for. Format knowledge. No brand appears in it. |
| `brands/<slug>.json` | product and its reference photo, location, question, cast, dialogue, props, seed, caption copy, series header, logo, end card, measured cuts, measured ambience window. |

`check-cut.py` imports its clause list from `format_spec` rather than keeping a copy, so a clause
cannot be deleted from the prompt without the gate noticing, and `single_gen.py`'s dry run runs
the identical lint before any spend.

Every script takes `--brand <slug>` (default `liquid-death`, or `$STREET_INTERVIEW_BRAND`).

Every script resolves the repo root by marker and the run folder by `--run`
(default `projects/street-interview/`, or `$STREET_INTERVIEW_RUN`). See `scripts/paths.py`:
none of them may assume they sit next to the take, which is what broke all of them once.

Reference build: `projects/street-interview/`. Copy it, do not blank-page a new one. **Note that
`projects/` is gitignored**, so a fresh checkout has this skill's `TAKES.md` and
`references/REFERENCES.md` but none of the footage, the approved take or the colour target. Those
have to be re-fetched before a paid run; `READINESS.md` says what.

## Critical knowledge

1. **Ask for ONE object in the interviewer's hand, never two.** The prompt asked for a microphone
   in one hand and a drink can in the other, in every shot, from an unseen interviewer. Seed 4803
   then produced three different object failures in one clip: no microphone at all in shot 1, no
   can in shots 2 and 3, and a can standing in for the microphone in shot 4. Seed 4801 merged the
   same two objects. **Not one of the three real references contains two objects.** Salary
   Transparent Street, Chris Klemens, SubwayTakes and the Arcads clip all have exactly one
   microphone in one hand. The interviewer holds a microphone and nothing else; the can belongs in
   the subject's own hand, in the shots where they actually hold it. Fixed at seed 4804.

2. **Whatever leads the prompt wins, and whatever is pushed down gets dropped.** Promoting the
   object rule to the top of the prompt fixed the objects and broke the one-location rule, which
   had held fine one seed earlier. Restate a constraint that must hold in every shot INSIDE each
   shot description, not once at the top.

3. **The real references are 30fps; this model returns 24.** 24fps is a film convention and reads
   as produced, which is the tell the prompt bans in words ("no cinematic") while the output
   delivers it in motion cadence. Convert to 30 before judging or shipping. Measured on all three
   references: 30000/1001, 30000/1001, 30/1.

4. **Degrading the render is cosmetic and cannot fix a generation failure.** A phone-capture pass
   (30fps, lifted blacks, softening, real compression) moved seed 4803 from detail 12.05 / black
   2.1 to 8.12 / 12.2 and into the measured bands. It did not, and could not, fix a can that turns
   into a microphone or two people who look like one person. Fix the prompt first, grade second.

5. **`check-cut.py`'s clause checks are a PROMPT LINT, not a picture check.** They verify the
   prompt contains the words that were paid for. Seed 4802 passed every one of them and was
   rejected on sight. `check_realism()` is the first check in this gate that measures the render:
   detail and black point against real footage. Bands were derived from single frames on
   2026-09-30 and compare our RAW take against finished re-uploaded references, which is not
   like-for-like; re-derive them against raw takes before trusting a marginal fail.

6. **The skip guard tests the filename, not the payload.** `single_gen.py` refused to run after a
   complete prompt rewrite, reporting "same payload+seed reproduces it", because
   `ld-single-seed4802.mp4` existed. After any prompt change it will silently hand back the old
   clip and tell you it is the same thing. Bump the seed, and do not trust the message.

7. **Never pipe the paid run through `tail` or `head`.** A shell pipeline reports the LAST
   command's status, so `single_gen.py --yes | tail -3` returns 0 even when the script exits 1.
   Twice this looked like "exit 0 and no file" and was misread as a bug in the script; the script
   is correct, `sys.exit("FAILED: ...")` does exit 1. Run it unpiped, or check the output text
   rather than the status. And confirm the mp4 and its manifest exist on disk regardless.

8. **A dropped network mid-poll has already billed you. Recover, do not re-fire.** Seed 4808 died
   with `getaddrinfo failed` after a successful submit. `fal_helpers.fetch_result(model,
   request_id)` returns the finished video at zero extra cost; the request id is printed in the
   failure message. Call `load_fal_key()` first or it reports "No credentials found" and looks
   like a dead end.

9. **The prompt is BUILT, not written. Never edit prompt text by hand.**
   `scripts/format_spec.py` holds the scaffold and the shot grammar (format knowledge, each
   clause paid for by a named take); `brands/<slug>.json` holds the creative (product, location,
   question, cast, dialogue, seed, caption copy, end card). Editing the composed prompt puts a
   brand's choice back into the format, which is the failure Linear GOOSE-3680 names. Copy
   `brands/demo-tallgrass-oat.json`, which is an invented brand that exists to be copied, and
   never `brands/liquid-death.json`'s creative values.

10. **`scripts/selftest.py` is the proof the split changed nothing. Run it after touching either
    layer.** Free, no network, no ffmpeg. It asserts the Liquid Death config through the scaffold
    reproduces the approved seed-4815 prompt byte for byte (sha256 stored in the test, so it runs
    on a checkout without `projects/`), that every required clause survives for every brand, and
    that removing any one clause FAILS the lint.

11. **A substring lint cannot see a per-shot rule, and the per-shot restatement is a per-shot
    rule.** `format_spec.REQUIRED_PER_SHOT` is counted inside every numbered shot, not found once
    in the prompt. Seed 4804 still contained the location clause and still changed street between
    shot 1 and shot 2, so a `find()` test would have passed the take that was rejected. The first
    version of the falsification test made the same mistake in reverse: it deleted ONE of the
    seven copies of "on that same corner" and the lint still passed, which is exactly the 4804
    shape.

12. **Check D was DEAD for every take ever gated, and reported a warning instead.** It split the
    prompt on `"shot "` looking for `Shot N:` labels. This format has never written them: the
    shot list is numbered `1. `, `2. `. So it found ZERO shots, the product-in-the-opening check
    never ran, and the one check that answers "couldn't understand what it's about" was
    decoration. It also looked for the literal `@image1`, which appears once in the product
    paragraph and in no shot description, so even with the labels fixed it would have failed a
    correct prompt. Fixed 2026-09-30: `format_spec.split_shots()` reads the numbering the format
    actually writes, and the check looks for the product's own noun.

13. **The ambience bed's speech-free window belongs to a TAKE, not to the code.** It was two
    constants, 8.0s and 7.6s, measured on seed 4802. On the shipped seed 4815, 7.6s is the middle
    of "something that's gonna kill me", so those constants would have looped a spoken line under
    the whole video, which is the documented "random background noises" fault reintroduced by a
    number that outlived the take it was measured on. It is now
    `brand_layer.ambience_gap` per brand, and `build_looks.py` refuses to run without it.

14. **All six priced variants fail the format lint and cannot be sent.** Measured 2026-09-30:
    each of `variants_gen.py`'s six prompt bodies fails 12 to 15 of the 15 required clauses,
    because every one of them was written before the 4804-to-4815 fixes. Sending the $21.84 sweep
    would have re-bought every defect already bought once. `variants_gen.py` now refuses to spend
    while any body fails the lint. A variant is a change of GRAMMAR (night, hard sun, mic cube,
    indoor, walk-along, single host), not a licence to drop the guards: port each body onto
    `format_spec.build_prompt` first.

15. **The pace was solved at seed 4809 and thrown away in the same edit that fixed the objects.**
    Measured 2026-09-30 across all fifteen single-generation takes with `scripts/bench.py`: only
    **4808 (median 1.35s) and 4809 (1.38s)** cut at the real-reference pace of 1.54-1.62s. Every
    other take, the shipped 4815 included, sits at **2.46-6.05s**. The two fast takes are the
    only two whose prompt carried a `CUTTING AND PACE` block asking for *two shots per person, a
    wider one and a closer one from a marginally different angle, cut mid-sentence*. That block
    was deleted in the 684-word cut-down at seed 4812 and never restored, because it was never in
    `REQUIRED_CLAUSES` -- the same edit that introduced the per-shot handover grammar which fixed
    the object failures. **The format traded its pace for its objects and nothing noticed.**
    Restored as `format_spec.PACE_BLOCK`, additive and off by default (`--pace`), so the approved
    seed-4815 payload still reproduces byte for byte.

16. **Asking for eight shots does not get eight shots; asking for a reframe does.** The shipped
    prompt writes eight numbered shots and says "each about one and a half seconds", and seed
    4815 has exactly **three** cuts (scene scores 0.47 / 0.42 / 0.39, nothing else above the
    ~0.07 the handheld motion itself produces). The two beats belonging to one person render as
    one continuous shot, because the same prompt forbids the visual change that makes a cut
    visible: *"EVERY PERSON STANDS IN THE SAME PLACE IN THE FRAME ... the same size in frame ...
    The camera does not reframe between people."* That pin is load-bearing BETWEEN people and is
    what suppresses the cut WITHIN a person. Split the two: same spot between people, a
    deliberate wider/closer pair within a person (`format_spec._PIN_PACE`).

17. **`check_realism()` was defined, documented as the gate's render check, and never called.**
    It is the function `SKILL.md` describes as "the first check in this gate that measures the
    render" and `build.py`'s docstring lists among what the gate measures. `main()` never
    invoked it, so for its entire life it could not fail on any input: the ONE check that looked
    at pixels rather than at the payload was decoration, and every "the gate passed" on this
    format was a payload-and-levels pass only. This is the second time this format has shipped a
    check that could not run (item 12, check D's `Shot N:` labels). **Grep for the CALL, not the
    `def`.** Wired in 2026-09-30 as check R, and `check-cut.py --falsify` now plants an
    over-sharpened frame and asserts R catches it.

18. **Falsify the falsifier: two of the first eleven planted faults were too weak, not undetected.**
    `scripts/falsify-all.py` plants a fault for every check and records whether the check that
    owns it fires. The first run reported G (ambience floor) and I (speech) as dead. Both were
    my plants: pink noise at 0.25 amplitude lifted the floor to **-29.5 dB against a -28 dB
    ceiling**, just inside; and attenuating the whole file by 40 dB does not hide speech from
    Whisper, which **normalises its input** -- it only tripped H on loudness. A plant that does
    not actually violate the rule proves nothing about the check. Measure the plant.

19. **A WARN is a PASS, and this gate had two of them.** Whisper missing and astats returning
    nothing were `warns`, printed above the word `PASS` with exit code 0. So a run on a machine
    without Whisper cleared a file whose dialogue had never been checked -- on a stack where
    nobody has ever listened to one of these cuts, that was the largest hole in the gate. A
    check that did not run is now a `skip`, printed as `NOT RUN`, and the gate exits NON-ZERO.
    `--allow-unrun` exists for a deliberately partial check and says so in the output.

20. **Re-cutting closes most of the pace gap for $0, and it can only change shot LENGTH.**
    MEASURED on the approved seed 4815 with `scripts/measure-pace.py` (same detector and
    threshold the gate uses): the take and the shipped looks sit at a **2.69s median with a
    2.72s final shot**; `recut.py` with dead air dropped brings the render to a **1.73s median
    with a 1.30s final shot**, 12.10s down to 6.90s, with all four scripted lines still clearing
    the Whisper check. Against the 1.54-1.62s reference band that is ~86% of the median gap
    closed and the final shot overshot slightly short. **The remaining ~0.1s needs a take with
    more internal shots** -- see item 16, and `READINESS.md` for the priced experiment.
    The dead end, because it looks obviously right: splitting a shot in the plan does NOT add a
    shot. The two halves are contiguous source, there is no picture change at the join, and a
    scene detector correctly counts one shot. Measured three ways, all 4 shots on the render:
    no split 1.87s, contiguous splits 1.87s (identical file to the eye), a 0.25s jump gap at
    each split 1.71s -- and that last gain is the file being shorter, not a new cut.
    So: **the number of visible shots is the number of people the generation put in the clip.**

21. **The re-cut is a different edit, and three things were still timed to the old one.**
    (a) `recut.py`'s ambience window was `default=(0.05, 1.90)`, a constant measured on an
    earlier take. On seed 4815 that window IS the interviewer's question (speech at 0.10-1.70),
    so the "room tone" bed was that line looped under the whole edit: Whisper came back with
    "quick question, what's in this can" three times and all three answers missing, which reads
    exactly like a duplicated segment and is not one. The identical bug had already been fixed
    once in `build_looks.py` (item 13) and nobody checked the second file. It now comes from
    `brand_layer.ambience_gap` and is verified speech-free against the file in hand.
    (b) `auto_plan` produced OVERLAPPING segments: a 0.3s envelope blip padded to a 1.10s shot
    that ran into the next line's shot, splicing 0.4s of audio in twice. Clamped, with an
    assertion, plus a `min_speech` floor so a breath is not treated as a line.
    (c) Dropping dead air RAISES integrated loudness (there is less quiet in the file): the
    re-cut measured -12.6 LUFS against a -14 target and correctly failed H. `recut.py` now
    masters the finished re-cut, limiter after loudnorm.
    And the one that is NOT fixed: `build_looks.py`'s caption spans are measured against the
    take's ORIGINAL timeline, so they do not survive a re-cut. `recut.py` writes a
    `<output>.plan.json` mapping every source span to its output span, which is what a re-timed
    schedule would be derived from. **Nothing consumes it yet, so the fast cut has no brand
    layer and the branded looks are still the slow cut.** That is the next free job on this
    format.

22. **`build.py` gated its own output against the wrong file, and the gate reported it as a
    picture fault.** `build.py` produces a graded, RE-CUT take with no captions, and handed
    `check-cut.py` the un-recut grade as the "caption-free control". F differences the two, so
    it was differencing two different EDITS: every row flagged and it reported "graphics span
    y=0..1920, outside 285..1635", which reads as a caption in the wrong place and was entirely
    the wiring. The gate now refuses a control whose duration differs from the render by more
    than one end card, and `build.py` passes `--no-brand-layer` so E and F report NOT RUN.
    **`build.py`'s output is not a deliverable** -- nothing in that chain draws a caption, a
    title or an end card. Two pipelines exist and only `build_looks.py` finishes a video.

23. **`build.py`'s paid path could not start.** It read the seed by grepping `single_gen.py` for
    a line beginning `SEED = `. The 2026-09-30 format/brand split deleted that constant, so the
    lookup raised `IndexError` and `build.py --yes` without an explicit `--seed` died before
    submitting. It fails before spending, so it cost nothing, but it means the one-command paid
    path had been broken since the split and no dry run covers it (`--from-take` skips that
    branch). Now read from the brand config through `brandkit`.

17. **Neither 4808 nor 4809 can be shipped, and the reason names the next take.** Both put the
    can in the INTERVIEWER's hand, beside the microphone -- the exact object failure that seeds
    4803 and 4804 paid to fix -- and 4809 is also close framing, not the wide head-to-hips the
    references use. So the repo holds two half-solutions: 4808/4809 have the pace, the correct
    small microphone and the best location lock; 4812-4815 have the objects, the wide framing and
    the handover grammar. **Nobody has ever run both sets of clauses in one prompt.** That is the
    next generation, and it is why it is a real experiment rather than a re-roll.

18. **Size the microphone against the SPEAKER, never against the hand holding it.** "About the
    size of a small fist" is the wording in the approved payload, and seed 4815 rendered exactly
    that, at the hand's distance from the lens: a foam ball filling roughly a fifth of the frame
    in the foreground, which reads as a composited object. Seeds 4808 and 4809 sized it against
    the speaker ("no thicker than a thumb", "held low, near the speaker's chest") and got it
    right. `format_spec.MIC_SCALE` replaces the phrase rather than adding to it: two contradictory
    size statements are worse than either.

19. **A grade CONSTANT measured on one take goes stale exactly like the ambience gap did.**
    `phone_look_video.py`'s black lift of 0.030 was measured on seed **4806**. On the shipped seed
    4815 it lands the finished render at a 1st-percentile of **10.0 against a real band of
    7.0-10.3** -- inside, but hard against the ceiling, so a re-encode tips it out. Solved per take
    by measuring the render (`fit_grade.py --write-brand`) it is 0.0240 -> **8.78**, the middle of
    the band. Stored in `brand_layer.grade`, which is where a per-take number belongs (see 13).

20. **Three of the five shipped looks on disk were stale and badly out of band, and nothing said
    so.** Measured 2026-09-30: `clean`, `karaoke` and `doc` sat at a 1st-percentile of **1.7**
    against 7.0-10.3, and at detail 10.4-10.7 against a 4.76-9.60 ceiling, because they were
    rendered before `--strength` was defaulted to 0 and were never rebuilt. Only `bare` and
    `subway` were current. A look that is not rebuilt after a grade change is a deliverable
    carrying a fixed bug. Rebuild all five, or ship none of them.

21. **`doc` got its mute from the one filter already measured to wreck the black point.** It
    passed `--strength 0.95`, i.e. the fitted per-channel LUT -- the thing that put seed 4804 at
    16.1 and seed 4806 at 26.6 and is why `--strength` defaults to 0 everywhere else. So the one
    look with a LUT blend was the one look out of band, and had been since it was written. The
    mute is now `--saturation 0.78`, which moves colour and nothing else: black 2.0 -> **8.2**.

22. **Two of the inherited "real bands" do not reproduce, and one of them is not a discriminator
    at all.** Re-derived from the five real references with one piece of code (`bench.py`):
    *face-region saturation* measures **0.168-0.311**, so four of the five real references fall
    outside the quoted 0.140-0.228 -- a band that appears to have been taken from the Arcads clip
    alone. Our finished looks sit at 0.198-0.200, i.e. LESS saturated than every real reference
    but one. The real set spans 1.9x, which is wider than our gap to it, so saturation cannot
    separate real footage from generated and must not be graded toward. The *per-shot ambience
    floor* is the other: measured per shot as the 20th-percentile RMS, the references run
    **-47..-15 dB**, so `check-cut.py` check G's "fail above -28 dB" would fail three of the five
    real references. The check still catches the real defect (the rejected assembled cut is the
    loudest thing measured, -27..-13) but its threshold is not the references' band.

23. **A PROP CANNOT BE PINNED ACROSS TAKES BY PROMPT TEXT, and episode 2 paid $10.92 to prove
    it.** Episode 1's three takes produced three different microphones. The fix written for it
    was the tightest prop clause this format has ever carried -- object type, body, head, grip,
    cable, height, side of frame, four explicit negations, a frame-relative size bound, an
    explicit depth ordering, and the sentence "THE MICROPHONE IS THE IDENTICAL MICROPHONE IN
    EVERY SHOT AND NEVER CHANGES shape, size, colour or head" -- and it was **byte-for-byte
    identical in all three payloads**, verified on the stored prompts rather than on intent.
    Seed 4820 rendered it exactly right. Seed 4821 rendered a large tapered black shape with no
    visible head, close to the lens, at roughly three to four times the frame area, which that
    same paragraph's own size bound forbids. Seed 4822 rendered a third variant, small and
    correct in scale but with a different head.
    **"The same in every shot" is a WITHIN-clip constraint and the model has no between-clip
    channel.** Each call re-derives the object from the words. So: do not promise a pinned prop
    across an episode. The only two mechanisms that could actually couple takes are a shared
    reference image (this endpoint takes exactly one and it is spent on the product) and putting
    every person in one call, which is the single-generation rule and is capped at 15s. Recorded
    in `skills/atoms/_shared/MODEL_BEHAVIORS.md` because it is a model property, not a prompt
    weakness. Corollary for judging any fix: **a prop that comes back right in one take of three
    is not evidence the clause worked.** Check every take before crediting the prompt.

24. **A blanket "no lettering" clause does not beat a garment whose prior IS lettering.** The
    `plain` grammar bans text and logos on every person and everything they carry, and it worked
    everywhere except one place: seed 4821's hi-vis vest came back with a garbled printed chest
    logo, despite the clause and despite the config itself saying "unmarked yellow hi-vis vest".
    Plain coats, plain knitwear, plain hoodies and plain bags all rendered clean in the same
    three takes. A hi-vis vest is a garment the model has essentially never seen without
    printing and reflective banding on it. **The rule belongs in the CONFIG, not only in the
    prompt: do not name a garment type that is almost always printed** -- hi-vis, workwear with a
    company patch, team kit, race bibs, uniforms, delivery gear. Naming one is asking the model
    to resolve an argument between the clause and its own prior, and it resolves it the way it
    has seen most often.

25. **The abrupt join was the QUESTION, and removing it worked -- but a join has three causes and
    only one of them is now fixed.** Episode 1 asked the interviewer's question in all three
    takes, at 0:00, 0:09 and 0:18, and Whisper on the render read "Motor oil. Quick question. Any
    idea what is in this can?" running together in one breath. `handover_cold` plus the
    `ANSWERS_ONLY` block remove it completely: measured on the episode-2 render, check I hears
    the question exactly once, at the top, and takes B and C carry answers only. That fault is
    gone and it will not come back.
    The joins are still visibly abrupt, for the other two reasons, and they should be named
    separately rather than lumped together as "the cut is rough": **the microphone changes at
    each join (item 23) and the street changes at each join (item 26).** Fixing the question was
    worth doing and it is not the same thing as fixing the join.

26. **Location drift got WORSE with more takes, not better, and it can cross a country.** Every
    episode-2 payload carried the identical location clause -- a London-shaped description: red
    brick, green scaffolding, a bus shelter, parked cars, bare plane trees. Takes A and B
    rendered London (right-hand drive, UK road markings, London bus shelters) on two different
    corners. **Take C rendered New York**: brownstones with fire escapes, US street signage, a
    yellow cab, an American crosswalk. That is a bigger drift than episode 1 produced, from the
    same clause, which is the honest shape of it: separate calls do not share a location and the
    clause is a *description*, not a place. A description that is satisfiable on two continents
    will be satisfied on two continents. If a future run needs one street, the lever is naming
    the city in the clause, and even that is a hope rather than a guarantee -- the only guarantee
    is one generation, which is what Critical knowledge 1 says and is capped at 15s.

27. **A SECOND REFERENCE IMAGE IS THE ONLY CHANNEL BETWEEN TWO CALLS, and it must be cropped
    below every face.** Item 23 says a prompt clause cannot pin a prop across takes. This is the
    thing that can. `single_gen.py --scene-ref PATH` passes a still from the episode's FIRST take
    alongside the product, and seed 4823 proved it for $3.64: 4823's microphone and street match
    take A (4820), and seed 4821 -- the same prompt, no scene ref -- did not. It is the same
    mechanism that has kept the can from ever drifting, pointed at the scene instead of the
    product.
    Two constraints, both paid for at submit time:
    (a) **fal's likeness gate refuses an uploaded image containing a person.** The full frame was
    refused, free, before billing. The reference must be **cropped below every face**. Cropping
    costs nothing: it only has to carry objects and place, and the people are supposed to differ.
    (b) **The landmarks that identify a street live above the faces.** Measured on seeds 4820 and
    4824: the scaffolding, the bus shelter and the building are all behind people's heads, i.e.
    in exactly the band the crop removes. What survives is pavement, kerb, bollards, road
    markings and vehicle shapes, and on 4823 that was enough. So a scene reference carries the
    GROUND and the PROPS reliably and the skyline not at all. Plan the crop for the objects.
    And the corollary that costs the most: **whatever is wrong in take A is inherited by every
    take that references it.** Take A is not a draft. Watch it before referencing it.

28. **A SEALED CAN IS A PROMPT-RESISTANT PRIOR, like the hi-vis vest in item 24.** Episode 3's
    take A (seed 4824) carried the new can grammar: "EVERY CAN IS CLOSED, SEALED AND UNOPENED,
    ring pull whole and intact, in every shot", the required "nobody opens a" clause, a per-shot
    restatement ("the sealed can") inside every shot description, and a product reference photo
    that is itself a sealed can. **The model rendered an open can with a punched lid and a bent
    tab in every shot where the top is visible.** The words were all present and linted -- the
    selftest asserts each can clause is individually load-bearing and that the prompt never asks
    for a tab being pulled -- so this is not a missing clause. The model has seen this product
    open far more often than shut and resolves the argument the way it has seen most often.
    One take is not three, so this is evidence and not yet a rule; but do not promise a client a
    sealed can on the strength of a clause. The lever that has not been tried is the scene
    reference (item 27) carrying a sealed can from a take that happened to render one.
    NOTE the companion finding, which is free and worth having: the `reach` + `payoff` pair that
    opens the can IN THE CUT is the right structure regardless, because it never asks for the
    action seed 4806 proved unrenderable. That part is untested on a render.

29. **The model will put a REAL BRAND on the microphone, legibly, and no negation in the prompt
    stopped it.** Seed 4824's mic is a foam-windscreen stick mic with **"RODE" printed on the
    windscreen**, cleanly readable at 9.4s and 11.3s. The payload contained MIC_PINNED ("NO foam
    windscreen, NO foam ball, NO flag, NO cube, NO logo, NO branding" and "a small round dark
    metal mesh head") and NO_LETTERING ("the only lettering in frame is the label on the {prod}")
    -- two clauses, six explicit negations, both linted present. A branded reporter's mic is what
    the training data is full of, so this is item 24's shape again on a different object: **the
    prompt loses to a strong prior, and naming the ban does not beat naming the object.** For a
    client video this is worse than a garbled logo, because it is a genuine third-party mark
    rendered well enough to screenshot. The fix that has actually worked once is a reference
    image: seed 4820 rendered the correct unbranded stick mic, and its crop is on disk at
    `refs/scene/sceneref-4820-t5-noface.png`.

30. **SHOWING AN OBJECT BEATS DESCRIBING IT, and it is the cheapest fix this format has found.**
    Seed 4827 tested items 27 and 29 together: the `mic_ref` grammar DELETES the mic description
    paragraph and MIC_SCALE entirely and replaces them with one sentence pointing at @Image2,
    with `refs/scene/sceneref-4820-t5-noface.png` as the reference. The result, verified across
    four people and the whole 12s: **a slim plain black stick mic with a small dark tip and a
    thin cable, no lettering anywhere, the same object at the same scale in every shot.** Three
    rounds of description had produced three wrong microphones and then a legible RODE mark; one
    cropped still fixed it on the first try. The same reference also carried the street -- 4827's
    corner is 4820's corner, from a different seed.
    Two things follow. **A description of an object is a liability once a reference exists**:
    delete it rather than keeping both, because two statements about one object are worse than
    either. And **it freed ~150 words**, which on a format living against a 1200-word ceiling is
    the difference between three grammars and five.
    Do it properly, not by loosening the gate: `mic_ref` is its own grammar with its own linted
    clauses, MIC_SCALE's two needles moved out of `PACE_CLAUSES` into `MIC_SCALE_CLAUSES` so
    they are still demanded of a paced prompt that has no scene reference, and `mic` and
    `mic_ref` are refused together. The lint immediately earned it: it caught that deleting the
    mic paragraph silently removed the REQUIRED_CLAUSE "is in the same place in every shot",
    which the product paragraph does NOT supply (it says "IS HELD IN THE SAME PLACE"). Free, on
    the dry run, before the call.

31. **THE CAN WILL NOT RENDER SEALED. Two takes, and stop paying for a third.** Seed 4827
    repeated 4824's can grammar unchanged and rendered the can open again -- this time with the
    ring pull tab drawn *next to* a punched-open aperture, so the model took the words about the
    tab and opened the can anyway. Between them the two takes ran the clause, a per-shot
    restatement inside every numbered shot, a product reference photo that is itself a sealed
    can, and (on 4827) a scene reference; 4824 had no scene reference and failed identically, so
    the reference is not the cause. This is item 28 promoted from evidence to a rule: **a sealed
    can is not purchasable on this endpoint by prompting.** Either accept an open can, or do not
    put the lid in shot. Do not write a third clause.
    The `reach` + `payoff` pair stays regardless: it is the right structure for an opening,
    because it never asks for the action seed 4806 proved unrenderable, and it costs nothing.

32. **Cast size is NOT the pace lever, and no lever for pace has held twice.** The hypothesis was
    that four people and eight configured shots buy the reference pace, on the evidence of seed
    4816 (four people, eight shots, pace grammar, 1136 words, **eight rendered shots at a 1.35s
    median**). Seed 4827 ran the same cast, the same eight shots, the same pace grammar and 1139
    words, and rendered **four shots at 2.82s** -- worse than the two-person seed 4824's 2.26s,
    measured at both scene thresholds so it is not a detector artefact. The difference between
    them is the other grammars 4827 carries (guards, plain, can, mic_ref) and the seed.
    So the honest state is: the only takes that ever hit the band (4808, 4809, 4816) all had
    THIN prompts, and every guard added since has come with a pace cost that nobody attributed
    to it. Pace is a property of how loaded the prompt is, not of the cast list. **The reliable
    lever remains `recut.py`, which closes ~86% of the gap for $0** (item 20). Do not buy
    another take for pace.
    **CORRECTED BY ITEM 33.** The answer was not prompt load. Seed 4828 carries MORE grammar
    than 4827 and cut nearly twice as fast. What was suppressing the cuts was an ACTION in the
    shot descriptions. Read 33 instead; this item is kept because the measurement in it is
    real and the conclusion drawn from it was not.

33. **WHAT YOU ASK A PERSON TO DO WITH THE PRODUCT IS FOUR DEFECTS AT ONCE, AND IT WAS ONE
    SENTENCE.** Every handover in this format said the subject "takes it and looks at it". On
    seed 4827 the can is upright, label to the lens and correctly tallboy-sized at 1.0s --
    before anyone has examined anything -- and horizontal, lid-to-lens, label hidden and
    hand-length from 5.0s on. Deleting that clause, stating the orientation and the label inside
    every numbered shot, and moving reactions to the face fixed **four separate things** on seed
    4828, measured and seen:
     - the label faces the lens in every frame of all four people (it was away two thirds of
       4827);
     - the lid is never in view, so the can's open/shut state is no longer on screen to be
       wrong -- which is how item 31 gets solved without a word about sealing;
     - the can holds tallboy scale throughout, because nothing lifts it toward the lens;
     - **the median shot went 2.82s to 1.61s, INSIDE the 1.54-1.62s reference band for the first
       time with a full guard set.** A person examining a can is one long continuous action, so
       the model renders one long shot. Give them a short facial reaction and it cuts.
    A fifth thing came free: the can's small print ("MOUNTAIN WATER", "MURDER YOUR THIRST", the
    volume line) is legible on 4828 and was mush on both earlier takes. **A product held square
    on, still and at a constant distance renders its own small print; a product being rotated
    does not.** That is a cheaper answer to garbled packaging than any prompt clause.
    The general rule, and it is the one to carry to other formats: **before adding a clause to
    control how an object looks, read the shot descriptions for a verb that is fighting it.**
    Three product clauses had been arguing with one stage direction for four takes.

34. **SAY WHO MAY HOLD A MICROPHONE, NOT JUST WHAT THE INTERVIEWER HOLDS.** Every prompt up to
    episode 2 described the interviewer's microphone in detail and never said it was the ONLY
    one. The model filled the gap: in episode 2 a woman is holding **a second handheld mic of
    her own** at 7.5s, and there is a dark object at a subject's chest at 21s. The user found
    both; no check did, and no check can -- the gate lints the prompt and measures the render's
    levels, neither of which knows how many microphones are in shot.
    The fix is the `one_mic` grammar: the only microphone anywhere in frame is the single one
    in the interviewer's hand, nobody being interviewed holds, wears or carries a microphone of
    any kind, no clip mic, no lapel mic, no second mic, restated inside every numbered shot.
    Episode 4 and the episode-2 repair both came back clean across nine people.
    **The general rule: a clause that describes one instance of a thing does not bound how many
    exist.** Wherever this format says what a prop IS, check whether it also says who may have
    one. The same hole is why item 24's garment labels keep appearing.

35. **A MINIMUM SHOT LENGTH IS A SEPARATE RULE FROM SHOT-ALIGNED CUTTING, AND YOU NEED BOTH.**
    Snapping every re-cut boundary to one of the take's own cuts (item 21's successor) removed
    the mid-shot splices, and the cut still stuttered: episode 3b cut from one person to the
    next WIDE and then 0.10s later to the same person CLOSER, because the pace grammar's
    within-person reframe fired straight after a person change. Three frames is not an edit.
    The floor is **0.40s**, derived from the tightest real EDIT in the reference set, Salary
    Transparent Street's 0.43s. SubwayTakes' 0.04s is one frame and is the detector firing twice
    on a single transition, so it is an artefact and not a bound -- taking the minimum across
    all three references would have given the wrong number.
    When two cuts fall closer than the floor, DROP THE SHORTER FRAGMENT and let the previous
    shot run into the next, so the change lands on the closer framing. Never shorten the longer
    side to make room and never cross-fade to hide it. Applied after the snap-to-cut pass, and
    the two rules must not fight: dropping a fragment may not create a mid-shot splice.
    Measured on episode 3: splices under 0.40s went 3 -> 1 -> 0 across the two passes, tightest
    gap 0.13s -> 0.67s, and both are gated by checks S and T which are falsified by planting a
    mid-shot boundary and a short fragment.


36. **THE STAGING SAMPLE SHIPPED WITH THREE FAULTS THE OPERATOR SAW AND TWO GATE FAILURES.**
    Episode 2 v2 went to the ad-sample library while `check-cut.py` failed G and I on it.
    Reviewed Oct 1, fixed in `liquid-death-ep2fix-v3`: (a) the opening caption read
    "WHAT'S / IN CAN?" because Whisper heard "this can" as "the scan" and `spell_from_script`
    dropped the unmatched "the" and never placed "this"; a same-length run of up to 3 words now
    pairs at a 0.4 similarity bar, and a scripted word Whisper skipped inside a sentence is
    restored between its neighbours. (b) "Turpentine." was spoken as "Terpenstein" (two
    transcriptions agree) under a TURPENTINE caption, so that woman's three shots in take B are
    dropped; `drop_shots` only matches WHOLE shots (edges within 0.05s of real cuts), so list
    each shot, not one span. (c) the end card ended on 1.9s of silence; `brand_layer.end_card_music`
    now mixes a short sting under it (2 credits). Still open: check G, the "Definitely alcohol"
    and "Battery acid" shots carry a street bed only ~5 dB under the speech (-19 dB floor).
    **Run the gate on the exact file before it goes to staging, and do not publish a FAIL.**

## The five looks

One take, five finished treatments, all free. Each is a published grammar, not a palette:

| look | grammar |
|---|---|
| `clean` | title, two burned answers, a gold payoff, a dark end card |
| `subway` | SubwayTakes: a brand bar up the whole video, an occupation pill, sentence-case captions on a plate. The strongest "this is a series" signal |
| `karaoke` | TikTok-native: two or three words at a time, huge, centred, ~4 changes/sec |
| `bare` | no captions under the speech at all. The honest control |
| `doc` | documentary lower third, muted grade, no shouting |

## Cost

**~$3.64** per generation (12s, 720p, Seedance 2.0 at $0.3034/s). `--fast` is $0.2419/s, so
$2.90. The five looks on top of a take cost nothing, which is why the cheap axis of variation
is the brand layer and not the generation.

Development cost to get here: ~$27 across the whole exploration, most of it on the assembled
approach that this skill now exists to stop anyone repeating.

## Quality checks

1. `check-cut.py` passes. TEN checks, A to I plus R, each one tied to something that was
   actually rejected: format; length inside the 15s single-call cap; **provenance** (exactly one
   generation manifest, and the render is the take plus one end card, so a stitched cut fails);
   **prompt lint** (the clauses that were paid for are present, the vocabulary that was rejected
   is absent, and the product is in shot 1 and the final shot); no caption across a cut;
   graphics inside y=285..1635; **per-shot ambience floor** inside the real reference's band;
   -14 LUFS +/-0.7 with true peak under -1.5 dBTP; every scripted line audible under Whisper;
   and **R**, detail and black point on the render against the real-footage bands, measured at a
   fixed 720px width so the number is not a function of the scaler.
   A check that could not run prints `NOT RUN` and the gate exits non-zero. A WARN used to print
   above `PASS` with exit 0 -- see Critical knowledge 19.
2. `check-cut.py --falsify` first. It plants an out-of-zone caption and asserts F reports it,
   then an over-sharpened frame and asserts R reports it. A gate that has never failed is not a
   gate, and five detectors written for this format were themselves the bug -- see `TAKES.md`.
3. `falsify-all.py` for the whole gate, not just those two. It plants a fault for every check
   and reports which check caught it; anything that cannot fail is not a check. Free. Last full
   run 2026-09-30: all eleven plants caught by their own check (A, B, C, C2, D, E, F, G, H, I,
   R) -- and read Critical knowledge 18 before believing a MISSED, because two of the first
   eleven plants were simply too weak.
4. `measure-pace.py` on the render. The gate does not look at pace. Reference band 1.54-1.62s.
5. Watched end to end (`/watch`). The gate cannot tell whether a face reads as AI or whether a
   viewer can follow the video; every metric in an earlier scorecard passed while the cut was
   incomprehensible. The gate now prints what it did NOT assess on every run, pass or fail,
   because a PASS here has been read as "this is good" before.
6. Nobody has listened to the audio on this stack. Every audio judgement here is measured, and
   that limit should be stated when handing a cut over.

## Status

The single-generation take **`ld-single-seed4815`** is the current base: `brands/liquid-death.json`
and `selftest.py`'s stored sha256 are both built on it, and it is what the five looks are rendered
from. This paragraph said `ld-single-seed4802` until 2026-09-30 -- 4802 was the base when it was
written and was superseded by the 4803-to-4815 realism pass, so anyone reading it went looking for
the wrong file. Per the repo's lock rule the base is never re-rolled to fix one element; a change
means a new variant with its own seed, recorded in `TAKES.md` (and, in full, in
`projects/street-interview/TAKES.md`).

**THE FACES PASSED, 2026-10-01.** The user watched seed 4816 and said "the faces look fine",
then authorised a longer episode on the strength of it. That closes a question that had been
open through five rejections and it changes what this format is allowed to do: **do not reopen
the Arcads licensing route (~1,000 licensed actors, ~$11/video) as though faces are blocking,
and do not build a stills-then-animate pipeline.** Every one of the five rejected rounds
animated a still; the single-generation reference-to-video route is the one that passed. What
remains wrong is objects and framing, never faces.

**The shipped episode is `episode-ld-ep2fix-v2-seed4820-4834-4835`**, 27.8s, published to the
staging sample library on 2026-10-01 as `gooseworks-street-interview-liquid-death-ep2` with its
recipe attached. Take A is seed 4820, kept frame for frame because the user approved its mic,
cast, grading and naturalness; takes B and C are seeds 4834 and 4835, generated against a
face-cropped still of take A so they inherit its microphone, street and light. That repair cost
$7.28 against $10.92 for a full rebuild, and it is the pattern to follow: **fix the take the
user approved, do not replace it.** Three earlier episodes were built and rejected because that
was not done.

## Sync

Studio-authored. Needs back-porting to the lab or it is silently overwritten on the next
promote. See `SYNC.md`.

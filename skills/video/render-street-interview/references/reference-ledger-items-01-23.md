# Street interview: findings ledger, items 1-23

**Summary.** The first run of measured findings (2026-09-29 to 2026-09-30): one object per hand, prompt order, frame rate, the prompt lint and selftest, priced variants, re-cutting for pace, and the `build.py` repairs.

Part of the street-interview development record, split out of [`REFERENCE.md`](../REFERENCE.md). It is history, not today's runbook: `SKILL.md` and the selected recipe win where they differ. Brands, seeds and props are those experiments' (fictional brand names), never another brand's defaults. File names in backticks (`TAKES.md`, `selftest.py`, `brands/...`) are relative to the skill folder.

---

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
   `gw-single-seed4802.mp4` existed. After any prompt change it will silently hand back the old
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
   brand's choice back into the format, the failure the format audit found. Copy
   `brands/demo-tallgrass-oat.json`, which is an invented brand that exists to be copied, and
   never `brands/grimwater.json`'s creative values.

10. **`scripts/selftest.py` is the proof the split changed nothing. Run it after touching either
    layer.** Free, no network, no ffmpeg. It asserts the Grimwater config through the scaffold
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
    because every one of them was written before the 4804-to-4815 fixes. Sending the paid six-variant sweep
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

20. **Re-cutting closes most of the pace gap for free, and it can only change shot LENGTH.**
    MEASURED on the approved seed 4815 with `scripts/measure-pace.py` (same detector and
    threshold the gate uses): the take and the shipped looks sit at a **2.69s median with a
    2.72s final shot**; `recut.py` with dead air dropped brings the render to a **1.73s median
    with a 1.30s final shot**, 12.10s down to 6.90s, with all four scripted lines still clearing
    the Whisper check. Against the 1.54-1.62s reference band that is ~86% of the median gap
    closed and the final shot overshot slightly short. **The remaining ~0.1s needs a take with
    more internal shots** -- see item 16.
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

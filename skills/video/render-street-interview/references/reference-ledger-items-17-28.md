# Street interview: findings ledger, items 17-28

**Summary.** The second run of findings, numbered on from 17 (the record was merged, so 17-23 appear twice: see [items 1-23](reference-ledger-items-01-23.md) for the first set). Covers microphone sizing, stale grades and looks, props across takes, lettering on garments, joins, location drift, scene references and the sealed can.

Part of the street-interview development record, split out of [`REFERENCE.md`](../REFERENCE.md). It is history, not today's runbook: `SKILL.md` and the selected recipe win where they differ. Brands, seeds and props are those experiments' (fictional brand names), never another brand's defaults. File names in backticks (`TAKES.md`, `selftest.py`, `brands/...`) are relative to the skill folder.

---

## Critical knowledge (continued)

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

23. **A PROP CANNOT BE PINNED ACROSS TAKES BY PROMPT TEXT, and episode 2 paid three takes to
    prove it.** Episode 1's three takes produced three different microphones. The fix written for it
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
    alongside the product, and seed 4823 proved it with one take: 4823's microphone and street match
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

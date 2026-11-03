# Street interview: findings ledger, items 29-42

**Summary.** The latest findings (from 2026-10-01): brands on microphones, showing beats describing, the can that will not render sealed, pace levers, what a person does with the product, who holds a microphone, shot lengths, the staging sample's faults, and the opt-in hold and handover grammar.

Part of the street-interview development record, split out of [`REFERENCE.md`](../REFERENCE.md). It is history, not today's runbook: `SKILL.md` and the selected recipe win where they differ. Brands, seeds and props are those experiments' (fictional brand names), never another brand's defaults. File names in backticks (`TAKES.md`, `selftest.py`, `brands/...`) are relative to the skill folder.

---

## Critical knowledge (continued)

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
    lever remains `recut.py`, which closes ~86% of the gap for free** (item 20). Do not buy
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
    A fifth thing came free: the can's small print ("GLACIER WATER", "DROWN YOUR THIRST", the
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
    Reviewed Oct 1, fixed in `grimwater-ep2fix-v3`: (a) the opening caption read
    "WHAT'S / IN CAN?" because Whisper heard "this can" as "the scan" and `spell_from_script`
    dropped the unmatched "the" and never placed "this"; a same-length run of up to 3 words now
    pairs at a 0.4 similarity bar, and a scripted word Whisper skipped inside a sentence is
    restored between its neighbours. (b) "Turpentine." was spoken as "Terpenstein" (two
    transcriptions agree) under a TURPENTINE caption, so that woman's three shots in take B are
    dropped; `drop_shots` only matches WHOLE shots (edges within 0.05s of real cuts), so list
    each shot, not one span. (c) the end card ended on 1.9s of silence; `brand_layer.end_card_music`
    now mixes a short sting under it. Still open: check G, the "Definitely alcohol"
    and "Battery acid" shots carry a street bed only ~5 dB under the speech (-19 dB floor).
    **Run the gate on the exact file before it goes to staging, and do not publish a FAIL.**

37. **A HANDOVER ASKED FOR IN THE SHOT AND FORBIDDEN IN THE PRODUCT CLAUSE NEVER HAPPENS.** Fizzroot
    seed 6101: every person was already holding the can on their first frame. The shot said the
    interviewer holds it out; the product clause said it is "in the hand of the person being
    interviewed, never the interviewer's", and the clause won. `generation.handover_grammar` makes
    the shot OPEN on the pass and rewrites the product clause to allow it. 6102, 6111-6113,
    6121-6123, 6131-6133 and Oleara 6211-6214: the pass is on screen for every person. Keep the
    head of each take in the episode (`extra_head_s` on the episode file, and `--max-gap 3.0`), or
    the builder trims the pass off as silence: the first Fizzroot episode showed 3 of 7 handovers.

38. **THE LID-TO-LENS TILT IS CAUSED BY THE GLANCE, NOT BY THE HOLD WORDING.** The can came back
    tipped with its lid to the lens on 4 of 7 people (Fizzroot episode 1) and 5 of 7 (episode 2)
    across two rewrites of the hold sentence. Same seed, one change: removing "glances down and
    back up" from the speaking shot (`generation.level_camera`) took it to 1 of 7 (6131-6133), and
    7 of 7 upright on Oleara after one re-take. The "camera at chest height" sentence that ships
    with the flag did NOT lower the camera; it is the missing glance that does the work. Do not
    put the glance back to get "naturalness".

39. **NOBODY READS THE PRODUCT ON CAMERA.** A person asked to read a can tips it toward their
    face, which puts the lid to the lens, and they read the lid (6123, both wordings). The payoff
    line works without the beat: "Hang on, it says four grams right here" was delivered upright
    on 6133. The `reads` shot key still exists; with `level_camera` it reads "the side that faces
    her". Leave it off.

40. **THE RELAXED HOLD IS A PLACE THE HAND RESTS, AND THE SCENE REFERENCE CARRIES IT.**
    `natural_grammar` + `real_grammar` describe a sealed can at chest height in one relaxed hand,
    one interviewer (black sleeve, mic always lower right) and nothing printed in anyone's hands.
    The scene reference for takes B and C should be a frame of take A's UPRIGHT hold cropped
    below the face. On Oleara the take whose reference showed the upright bottle came back 5 of 5
    upright; the take that used the bare mic reference had one diagonal bottle (6211).
    `can_sealed_grammar` DOES hold on this stack with these flags: 16 of 16 people across seven Fizzroot takes held a sealed can,
    against item 31's two failures on Grimwater. A bottle is not a can: with a non-can noun
    the hold block is kept and its cap may be seen ("never shown from above").

41. **A SPOKEN NUMBER COMES BACK AS DIGITS, AND A LINE CAN BE SAID TWICE, HALF OR INVENTED.**
    Whisper returns "40 grams" for a scripted "forty grams"; `build_episode._norm` and check I in
    `check-cut.py` now spell 0-99 out before aligning, or the number words go uncaptioned and
    the gate fails a line that was said. Across the last eight fast takes: one line said twice (6123 retake),
    one line said twice with neither attempt whole (Oleara 6212), one invented sentence in a
    silent shot (Oleara 6213), one slurred line (6132). All four were caught by transcribing every
    take with word timestamps BEFORE assembly and repaired by cutting on the take's own shot
    boundaries. Transcribe first; nobody has listened to these by ear.

42. **THE CAPTION PLATE BELONGS WHERE THE PRODUCT IS NOT, MEASURED ON THE RENDER.**
    `brand_layer.caption_centre_y` moves the subway plate. A 12oz can at chest height clears a
    plate centred at y=985 (between chin and can) on every close shot; the question stays at
    1540 on the wide opening. A tall bottle fills y=800..1650, so no band is free: put the plate
    on the plain body between cap and label, found per line from the render. The framing
    sentence ("each person in the upper two thirds") was ignored on every take, so do not rely
    on the prompt to make room.

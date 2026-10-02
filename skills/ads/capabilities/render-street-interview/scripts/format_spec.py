#!/usr/bin/env python3
"""THE FORMAT LAYER. Everything here is format knowledge and belongs to no brand.

Split out of `single_gen.py` on 2026-09-30. Before the split, one sample run's creative choices
were frozen into the prompt as structural requirements: four specific lines of dialogue, four
specific people, one named product, one street corner. Changing brand meant editing Python,
which is the failure Linear GOOSE-3680 names and the format audit found in 44 of 61 recipes.

The division of labour:

  format_spec.py (this file)   the prompt scaffold, the shot grammar, and the clause list the
                               gate lints for. Paid for by rejected takes. Never brand-specific.
  brands/<slug>.json           the creative: product, reference image, location, question, cast,
                               dialogue, caption copy, seed. Swapping this swaps the video.

EVERY CLAUSE BELOW WAS PAID FOR. `REQUIRED_CLAUSES` names the rejection each one answers, and
`check-cut.py` imports that dict rather than keeping its own copy, so a clause cannot be deleted
from the prompt without the gate noticing. Do NOT shorten the scaffold to make it tidy: cutting
the prompt from 1379 to 684 words on 2026-09-30 (seed 4812) silently deleted six of these guards
and they had to be restored. There is a real ceiling at ~1200 words, where the model starts
dropping rules; the scaffold plus a four-person cast lands at ~950. If a new rule is needed, put
it inside the shot grammar and delete something else.

`build_prompt(cfg)` is deterministic: the same config produces the same prompt, byte for byte.
`selftest.py` asserts that the Liquid Death config reproduces the approved seed-4815 prompt
exactly, so this refactor is provably not a rewrite of the thing that was paid for.
"""

# Number words. The prompt states its own shot count and cast size in words, because digits in
# that position read as timecode to the model.
_WORDS = {1: "one", 2: "two", 3: "three", 4: "four", 5: "five", 6: "six", 7: "seven",
          8: "eight", 9: "nine", 10: "ten", 11: "eleven", 12: "twelve"}


def word(n: int) -> str:
    if n not in _WORDS:
        raise ValueError(f"no number word for {n}: this format runs 4 to 10 shots")
    return _WORDS[n]


# ── the shot grammar ───────────────────────────────────────────────────────────────────────
# Five kinds of shot, and every one of them RESTATES THE LOCATION. That restatement is the only
# thing that has ever held one location inside one generation: stating the corner once at the top
# and letting the shot list run free lost it for two of four people on seed 4804, and the cause
# was a straight ordering mistake -- whatever leads the prompt wins and whatever is pushed down
# gets dropped. So the corner is named in every shot by the grammar, not by the brand's copy.
#
# A shot's `subject` string is used verbatim, trailing punctuation included: shot 5 of the
# approved take reads "...across her chest, on that same corner" and shot 3 reads "...work jacket
# on that same corner". That comma is an authoring inconsistency in the approved payload and it is
# kept in the DATA rather than smoothed away in the grammar, so the approved prompt reproduces
# byte for byte and nobody has to wonder whether the refactor changed what was paid for.
SHOT_KINDS = ("handover_first", "handover_cold", "handover", "react", "speak", "sip", "reach",
              "payoff")


def _shot(n, s, cfg, can=False, prev_kind=None, upright=False, one_mic=False):
    kind = s["kind"]
    prod = cfg["product"]["noun"]
    # PER-SHOT RESTATEMENT OF THE THING THAT MUST HOLD IN EVERY SHOT. Critical knowledge 2: a
    # constraint stated once at the top gets dropped, and restating it inside each numbered shot
    # is the only mechanism that has ever held one in this format. With the sealed grammar it was
    # one word ("sealed"). With the upright grammar it is the orientation and the label, because
    # those are what seed 4827 lost: upright and label-forward at 1.0s, horizontal and
    # lid-to-lens from 5.0s on.
    held = (f"{prod} UPRIGHT, label to the lens" if upright
            else f"sealed {prod}" if can else prod)
    # `only` is the per-shot half of NO_SUBJECT_MIC: their hands hold the product and nothing
    # else, so there is no room in the shot for a second microphone. One word per shot.
    if one_mic:
        held = f"only the {held}"
    # In a handover the object is being passed, so it reads better as a verb phrase than as a
    # noun phrase. Same three facts.
    # THE HANDOVER IS NOW ONLY THE HANDOVER. Episode 3 removed "takes it and looks at it"
    # wholesale and the operator's verdict was that people then held the can at arm's length
    # like a product shot -- the naturalness episode 2 had was gone. So the looking comes BACK,
    # but as its own beat after a hard cut (see `glance` below) rather than fused into the
    # handover, because fusing them is what made the model lift and rotate the can.
    took = ((f"takes only the {prod} and holds it UPRIGHT, label to the lens" if one_mic
             else "takes it and holds it UPRIGHT, label to the lens")
            if upright else "takes it and looks at it")
    # The glance, prefixed to whatever the person does next. Eyes and head only: the can does
    # not move, which is what keeps the label forward, the lid out of shot and the scale honest.
    # NOTE the history, because this phrasing has burned this format once: seed 4802 was
    # rejected eyes-down and REQUIRED_CLAUSES records the cause as a shot direction reading
    # "glances down at the can". The difference here is "and back up," immediately followed by
    # "looks at the interviewer", so the glance resolves before the line is spoken and the
    # eyeline clause still governs the delivery. If a take comes back eyes-down, this is the
    # first thing to suspect.
    glance = ("glances down and back up, " if (upright and one_mic) else "")
    # In a handover the object is still in the interviewer's hand, so the orientation rule rides
    # on `took` and the noun stays bare. Without the upright grammar it keeps whatever the
    # sealed grammar put on it, so a rebuilt 4824/4827 prompt still matches its own manifest.
    offered = prod if upright else held
    if kind == "handover_cold":
        # `handover_first` WITHOUT the interviewer's question. Paid for by episode 1: the
        # interviewer's question was generated inside all three takes, so the finished episode
        # asked it at 0:00, 0:09 and 0:18 and the transcript reads "Motor oil. Quick question.
        # Any idea what is in this can?" in one breath. A real episode asks once, at the top, and
        # every take after the first is answers only. See ANSWERS_ONLY, which is the clip-level
        # half of this: this kind removes the line, that block forbids anyone re-inventing it.
        return (f"{n}. The interviewer holds the {offered} out to {s['subject']}; {s['pronoun']} "
                f"{took}, SILENT, on that corner. Nobody speaks in this shot "
                f"and no question is asked. ")
    if kind == "handover_first":
        # The ask-and-answer guard. Without "does not say this line" the subject speaks the
        # interviewer's question back at the camera.
        return (f"{n}. The interviewer holds the {offered} out to {s['subject']}; {s['pronoun']} "
                f"{took}, SILENT, on that corner. The interviewer asks from "
                f"off camera, unseen: \"{cfg['question']}\" The {s['noun']} in frame does not "
                f"say this line. ")
    if kind == "handover":
        return (f"{n}. The interviewer holds the {offered} out to {s['subject']} on that same "
                f"corner; {s['pronoun']} {took}. Silent. ")
    if kind == "react":
        return (f"{n}. The same {s['noun']} on that same corner, holding the {held}, looks at "
                f"the interviewer and {s['reaction']}. Silent. ")
    if kind == "speak":
        manner = f" {s['manner']}" if s.get("manner") else ""
        return (f"{n}. The same {s['noun']} on that same corner, holding the {held}, "
                f"{glance}looks at the interviewer, {s['reaction']} and says{manner}: "
                f"\"{s['line']}\" ")
    if kind == "sip":
        return (f"{n}. {s['subject']} on that same corner, holding the {held}, raises it and "
                f"takes one sip. Silent. ")
    if kind == "reach":
        # THE FIRST HALF OF AN OPENING THAT HAPPENS IN THE CUT. Seed 4806 spent $3.64 asking the
        # model to render a ring pull being pulled and the action was unrenderable, which is why
        # "nobody opens a" has been a required clause ever since. An editor does not need the
        # action: the shot ENDS as the hands arrive, the next shot is already drinking, and the
        # viewer supplies the pull. So this shot asks for the hands MOVING TOWARD the can and
        # explicitly forbids the tab, the finger-hook and the pull -- the three things that come
        # back as melted metal.
        # The three negations that used to sit here -- no tab, no finger hooked under the ring
        # pull, nothing opened on camera -- are in _SEALED_CUT, which every can-grammar prompt
        # carries and the lint requires by needle. Stating them twice is the duplication
        # _MIC_SCALE_TAIL was deleted for, and the word budget has none to spare.
        return (f"{n}. {s['subject']} on that same corner, holding the {held}, brings the other "
                f"hand up to its top and the shot CUTS AWAY. Nothing is opened on camera. "
                f"Silent. ")
    if kind == "payoff":
        manner = f", {s['manner']}" if s.get("manner") else ""
        # THE SECOND HALF. With the can grammar on and a `reach` immediately before, the payoff
        # opens ALREADY DRINKING: the can is open because the cut happened, not because anything
        # was rendered opening it.
        if can and prev_kind == "reach":
            return (f"{n}. The same {s['noun']} on that same corner is ALREADY DRINKING from the "
                    f"now-open {prod}, tipped to their mouth mid-swallow, then lowers it and says "
                    f"to the interviewer{manner}: \"{s['line']}\" ")
        # THE PAYOFF ON THE FACE, which is what the upright grammar forces and what this format
        # should arguably always have done. The two older wordings both move the can: one drinks
        # from it, the other "lowers" it, which implies it was raised. Raising a can to a mouth
        # puts the LID in shot, and the lid being out of shot is the only thing that has ever
        # kept this product's open/shut state off screen (Critical knowledge 31 and 33). It also
        # costs nothing dramatically: the format's own premise is that the strangers guess wrong
        # and THE LAST ONE GETS IT RIGHT, so the payoff is a correct answer, not a discovery by
        # tasting. Episode 2 only tasted because the can was already open.
        if upright:
            # Same shape as `speak`, so the payoff reads as one of the answers rather than as a
            # different kind of shot. `payoff` stays a distinct kind because brandkit and
            # build_episode both use it structurally: exactly one take pays off, and it is last.
            said = f" {s['manner']}" if s.get("manner") else ""
            return (f"{n}. The same {s['noun']} on that same corner, holding the {held}, "
                    f"{glance}looks at the interviewer, {s['reaction']} and says{said}: "
                    f"\"{s['line']}\" ")
        return (f"{n}. The same {s['noun']} on that same corner lowers the {held} and says to "
                f"the interviewer{manner}: \"{s['line']}\" ")
    raise ValueError(f"unknown shot kind {kind!r}. Known: {', '.join(SHOT_KINDS)}")


# ── the prompt ─────────────────────────────────────────────────────────────────────────────
# ── the pace grammar, restored from seed 4809 ──────────────────────────────────────────────
# ADDITIVE, and off by default, so `build_prompt(cfg)` still reproduces the approved seed-4815
# prompt byte for byte and `selftest.py`'s stored sha256 still holds. Turn it on with
# `build_prompt(cfg, pace=True)` / `single_gen.py --pace`.
#
# WHAT IT IS AND WHAT IT COST. Measured 2026-09-30 across all fifteen single-generation takes:
# only TWO of them cut at the reference pace, seeds 4808 and 4809, at a median shot of 1.35s and
# 1.38s against a real-reference band of 1.54-1.62s. Every other take, including the shipped
# 4815, sits at 2.46-6.05s. The two fast takes are the only two whose prompt carried this block,
# and it was deleted in the 684-word cut-down at seed 4812 and never restored -- the same edit
# that introduced the per-shot handover grammar which fixed the object failures. So the format
# traded its pace for its objects in one edit and nobody noticed, because the pace clause was
# never in REQUIRED_CLAUSES.
#
# WHY IT WORKS, and why asking for eight shots does not. The shipped prompt already writes EIGHT
# numbered shots and says "each about one and a half seconds", and the model delivered FOUR:
# measured on seed 4815 there are exactly three cuts, at scene scores 0.47 / 0.42 / 0.39, with
# nothing else above the 0.07 the handheld motion itself produces. The two beats belonging to one
# person render as ONE continuous shot, because the prompt simultaneously forbids the visual
# change that makes a cut visible: "EVERY PERSON STANDS IN THE SAME PLACE IN THE FRAME ... the
# same size in frame ... The camera does not reframe between people." That clause is load-bearing
# BETWEEN people -- without it, cutting from one person to the next reframes and the single take
# reads as a stitch -- and it is the thing suppressing the cut WITHIN a person. 4809's wording
# separates the two: same place between people, a deliberate wider/closer pair within a person.
PACE_BLOCK = (
    "CUTTING AND PACE: this clip is cut fast. Each person gets TWO separate shots, one after the "
    "other, and there is a HARD CUT between them: the first a little wider, the second a little "
    "closer and from a marginally different angle, both on that same corner with the same "
    "background behind them. The cut falls in the middle of what they are saying and their "
    "speech runs straight through it without pausing. No shot lasts longer than two seconds. "
    "These are fast hard jump cuts, the way a real street interview is edited. ")

# The position-pinning sentence, in two versions. The default is the approved wording. The pace
# version keeps the between-people pin (which is what stops a cut reading as a stitch) and drops
# only the camera-never-reframes half, which is what was suppressing the within-person cut.
_PIN_DEFAULT = ("EVERY PERSON STANDS IN THE SAME PLACE "
                "IN THE FRAME, slightly left of centre, at the same distance from the camera and "
                "the same size in frame, so cutting from one to the next does not move them. The "
                "camera does not reframe between people. ")
_PIN_PACE = ("EVERY PERSON STANDS IN THE SAME PLACE ON THE PAVEMENT, slightly left of centre, so "
             "cutting from one person to the next does not move them to a different spot. Within "
             "one person's two shots the camera DOES change: the second is closer and from a "
             "marginally different angle, which is what makes the cut visible. Between one person "
             "and the next it does not. ")

# The microphone's SCALE, and it is new. Paid for by looking at the shipped seed-4815 render:
# the mic renders as a foam ball in a bare fist at lens distance, occupying roughly a fifth of
# the frame and much closer to camera than the subject, which reads as a foreground object
# composited in. The existing wording sizes it against the hand holding it ("about the size of a
# small fist"), and the model rendered exactly that, at exactly that distance. Seeds 4808 and
# 4809 sized it against the SPEAKER ("no thicker than a thumb", "held low, near the speaker's
# chest") and rendered it correctly. So the size reference has to be the speaker, not the hand.
# STRENGTHENED 2026-09-30 after looking at the seed-4816 render (the first take built with this
# block). MIC_SCALE moved the mic off the lens but only part of the way: it still reads as a big
# black shape low-right in nearly every shot. Two things were missing and both are named in
# MODEL_BEHAVIORS.md ("occlusions render at the scale you imply, not the scale you'd film" --
# constrain LOCATION, SIZE and NEGATION, or the model makes the occluding object the subject).
#   (a) a bound against the FRAME, not only against the speaker. "No taller than the speaker's
#       head is wide" is satisfiable by a mic that is also enormous, if the speaker is close.
#   (b) an explicit depth ordering. "NOT close to the lens" is a negation with nothing positive
#       behind it; "the smallest object in frame and never the nearest thing to the lens" is.
# The redundant tail came out: the base prompt already says "with a thin black cable from the
# base" and "entering from the lower RIGHT of the frame", so repeating both here bought nothing.
# That is the only deletion, and it is provably a duplicate of text that is still in the prompt.
MIC_SCALE = (
    "THE MICROPHONE IS SMALL IN FRAME. It is no taller than the speaker's head is wide and no "
    "wider than a tenth of the frame, and it is held out near the speaker's chest, at the "
    "speaker's distance from the camera and NOT close to the lens. It is the smallest object in "
    "frame and never the nearest thing to the lens. It never fills a corner of the frame and "
    "never reads as a large dark object in the foreground. The hand holding it enters from the "
    "lower right in a plain dark jacket sleeve. ")

# Linted only when the pace grammar is on, so the existing lint is untouched. Same shape as
# REQUIRED_CLAUSES: needle -> the rejection it answers.
PACE_CLAUSES = {
    "hard cut between them": "the within-person cut. The shipped prompt asks for eight shots and "
                             "gets four: the two beats belonging to one person render as one "
                             "continuous shot. Measured on seed 4815, three cuts, nothing else "
                             "above handheld motion noise.",
    "no shot lasts longer than two seconds": "the shot-length ceiling. Seed 4815's opening shot "
                                            "runs 4.04s, a third of the video on one person, "
                                            "against a longest-shot of 2.79s on seed 4809.",
    "the camera does change": "the reframe permission. Without it the position-pinning clause "
                              "suppresses the cut it is not meant to suppress.",
}

# The two clauses above that belong to MIC_SCALE rather than to the cutting rhythm. They were
# inside PACE_CLAUSES until 2026-10-01, which was fine while MIC_SCALE was always in a paced
# prompt and became wrong the moment `mic_ref` suppressed it: the lint would have demanded two
# needles the prompt deliberately no longer contains, and the only ways out would have been to
# weaken the lint or to keep a block the take had just proved useless. A clause belongs to the
# grammar that writes it. Required when `pace` is on and `mic_ref` is off.
MIC_SCALE_CLAUSES = {
    "no taller than the speaker's head is wide": "the microphone's SCALE. Sized against the hand "
                                                 "holding it, the model rendered a foam ball at "
                                                 "lens distance filling a fifth of the frame.",
    "never the nearest thing to the lens": "the microphone's DEPTH ORDER. Seed 4816 carried the "
                                           "first version of MIC_SCALE and the mic still read as "
                                           "a big black shape low-right in nearly every shot: "
                                           "'NOT close to the lens' is a negation with nothing "
                                           "positive behind it, and the model needs the ordering "
                                           "stated as a fact.",
}


# ── the object/framing guards, paid for by the seed-4816 render ─────────────────────────────
# ADDITIVE and off by default (`build_prompt(cfg, guards=True)` / `single_gen.py --guards`), for
# the same reason PACE_BLOCK is: `selftest.py` asserts the approved seed-4815 payload still
# reproduces byte for byte, and a guard bolted into the default scaffold would silently change
# the one payload this repo has agreed not to change.
#
# TWO DEFECTS, both observed on the seed-4816 RENDER rather than measured by any check, which is
# why they are here and not in check-cut.py:
#
#  1. THE CAN ROTATES LABEL-AWAY. In two of seed 4816's eight internal shots the can shows a
#     blank white side with a gold top: no blackletter, no logo, no wordmark. Every existing
#     product clause pins the can's POSITION, SIZE and COLOUR and not one of them says which way
#     round it is, so a can that is in the right place, the right size and the right colour and
#     facing backwards satisfies all of them. For a brand video that is the expensive defect --
#     the whole reason the product is passed as a reference image is to keep a real label on
#     screen, and a label pointing away from the camera is the same as no reference at all.
#  2. FRAMING LANDS CHEST-UP. The prompt has asked for "head to hips or below" since seed 4805
#     and seed 4816 still came back chest-up. This does not add a second, contradictory framing
#     rule (see MIC_SCALE for why two size statements are worse than either): it REPLACES the
#     framing sentence with a version that says the same thing in terms the model can fail
#     visibly -- space above the head, the waist in frame -- and adds the negation that was
#     missing. Both required needles ("every shot is wide", "detail falls away behind the
#     subject") survive the replacement, which `selftest.py` and the gate both re-check.
# Kept deliberately short. The ~1200-word ceiling is real (seed 4811) and the pace grammar
# already spends 214 words of it, so a guard that has to survive has to be one sentence.
LABEL_FACING = (
    "THE LABEL FACES THE CAMERA: whenever the {prod} is visible its front label is turned toward "
    "the lens, never rotated away and never showing a blank unprinted side. ")

_FRAME_DEFAULT = (
    "Every shot is WIDE: each person seen from head to hips or below, with the street open behind "
    "them, and detail falls away behind the subject so the background is softer than the person. "
    "No close-ups, nobody's face fills the frame. ")
_FRAME_WIDER = (
    "Every shot is WIDE: each person seen from head to hips or below, with space above their "
    "head and their waist in frame, the street open behind them, and detail falls away behind "
    "the subject so the background is softer than the person. No close-ups, never chest-up, "
    "nobody's face fills the frame. ")

GUARD_CLAUSES = {
    "front label is turned toward the lens": "the label's FACING. Seed 4816 turned the can "
                                             "label-away in two of its eight shots: a blank "
                                             "white side with a gold top, no blackletter and no "
                                             "logo. Every other product clause pins position, "
                                             "size and colour and none of them says which way "
                                             "round it is.",
    "never chest-up": "the framing NEGATION. 'Head to hips or below' has been in the prompt "
                      "since seed 4805 and seed 4816 still came back chest-up; the positive "
                      "instruction alone has never held.",
}


# ── the EPISODE grammars, paid for by the episode-1 watch ───────────────────────────────────
# Three grammars, one per defect the operator named after watching episode 1 end to end. Additive
# and off by default for the same reason PACE_BLOCK and the guards are: `selftest.py` asserts the
# approved seed-4815 payload reproduces byte for byte, and a block bolted into the default
# scaffold would silently change the one payload this repo has agreed not to change.
#
# The verdict was "rest looks fine" -- faces, pace, framing, captions and the small mic are all
# APPROVED and none of them is touched here. Four defects, and nothing else changes.
#
# DEFECT 1: THE MICROPHONE CHANGED BETWEEN TAKES. Three generations produced three different
# microphones. Nothing in the prompt had ever said the mic is the SAME mic, because until episode
# 1 there was only ever one generation and "the same in every shot" was a within-clip rule that
# the model could satisfy three different ways in three separate calls. The description it was
# satisfying was also wrong for the reference: the scaffold asks for "a matte black elongated oval
# FOAM WINDSCREEN", and a foam blob is a shape the model has a lot of latitude inside. The Chris
# Klemens reference (refs/klemens-frame.png, "plain cable mic" in REFERENCES.md) was looked at
# directly for this: it is a plain black stick mic, slim straight body, a SMALL ROUND DARK MESH
# head, no foam, no flag, no logo, with a thin black cable hanging straight down out of frame,
# held upright at chest height. That is a much more constrained object than a foam oval, which is
# the point. The other two references use BRANDED MIC CUBES and are deliberately not copied: a
# branded surface is a surface with lettering on it, and lettering is defect 3.
#
# MIC_PINNED REPLACES the description sentences rather than adding to them -- see MIC_SCALE for
# why two size statements are worse than either, and the same is true of two shape statements.
# MIC_SCALE itself is KEPT and unchanged: the operator approved the small mic and losing it would
# trade an approved element for a fix, which is not what was asked for.
#
# WORD COST. This REPLACES rather than adds, so the mic grammar costs +24 words on the Liquid
# Death cast, which is the only reason all four grammars fit under the 1200-word ceiling at all.
# The first draft stated the never-changes rule in its own sentence and the description in
# another; they are merged here because that was a duplicate I had written myself, and the lint
# refused all three episode-2 payloads until it came out. Measured, not guessed.
MIC_PINNED = (
    "THE MICROPHONE IS THE IDENTICAL MICROPHONE IN EVERY SHOT AND NEVER CHANGES shape, size, "
    "colour or head between shots or between people: a plain black handheld stick microphone, "
    "slim straight black body, a small round dark metal mesh head on top, held upright in one "
    "bare hand in a plain dark sleeve, a thin black cable hanging straight down from the base and "
    "out of frame. NO foam windscreen, NO foam ball, NO flag, NO cube, NO logo, NO branding. IT "
    "IS IN THE SAME PLACE IN EVERY SHOT: entering from the lower RIGHT at the speaker's chest "
    "height, never crossing to the left. NOT a clip-on lapel mic and NOT a fluffy grey "
    "windshield, and it never becomes a {prod}. ")

# MIC_SCALE's closing sentence, dropped when MIC_PINNED is in the prompt. It reads "The hand
# holding it enters from the lower right in a plain dark jacket sleeve", and MIC_PINNED says
# "entering from the lower RIGHT ... held upright in one bare hand in a plain dark sleeve". That
# is the same fact twice, which is the thing MIC_SCALE's own comment warns about. The sleeve was
# carried over into MIC_PINNED rather than lost, so nothing this sentence said goes missing --
# that is the proof required before deleting a guard, and it is the only deletion here.
_MIC_SCALE_TAIL = "The hand holding it enters from the lower right in a plain dark jacket sleeve. "

# DEFECT 3: TEXT AND LOGOS ON CLOTHING AND GEAR GARBLE. Episode 1 put a slogan hoodie, a branded
# cap, a printed carrier bag and a backpack with lettering on screen, all rendering as mush. The
# prompt already bans generated signage ("never sharp and never legible") and that clause is kept
# -- but it is about the BACKGROUND, and every garbled word in episode 1 was in the foreground, on
# a person, sharp and central. The two rules are about different surfaces and both are needed.
# Note the reference itself shows this is not a realism cost: the Klemens frame has a slogan tee
# in it, and a real camera renders it as words while this model renders it as mush.
NO_LETTERING = (
    "NO TEXT AND NO LOGO ON ANY PERSON OR ANYTHING THEY CARRY: every garment plain and "
    "unbranded, no slogan tops, no printed hoodies, no branded caps, no sports logos, no "
    "lettering on bags or backpacks, no lanyards, no badges. The only lettering in frame is the "
    "label on the {prod}. ")

# DEFECT 4: A MINOR HELD THE PRODUCT. Episode 1's middle take put a teenager with a skateboard
# holding the can at about 0:10. The product is branded to look like beer, so a minor holding it
# is a brand-safety problem regardless of how the clip reads. The cast sentence is REPLACED
# rather than extended, again so there is one statement about who these people are and not two.
# The brand configs lose the teenager as well; a prompt rule and a config that contradicts it is
# the model being asked to resolve an argument.
_CAST_DEFAULT = ("clearly different people, differing in age, build and clothing, ordinary "
                 "members of the public, ordinary healthy people, nobody unwell and nobody a "
                 "model, each carrying something real: ")
_CAST_ADULTS = ("clearly different people, ALL CLEARLY ADULT, in their twenties to sixties, no "
                "children, no teenagers, nobody who could read as under eighteen, differing in "
                "build and clothing, ordinary members of the public, ordinary healthy people, "
                "nobody unwell and nobody a model, each carrying something real: ")

# DEFECT 2: THE QUESTION WAS ASKED THREE TIMES. Every take carried `handover_first`, which is the
# shot that generates the interviewer's question inside the clip, so the finished episode asked it
# at 0:00, 0:09 and 0:18 and the joins read as three separate videos rather than one interview.
# The fix is structural and it is the one that removes the abrupt cut: take A asks, takes B and C
# are ANSWERS ONLY. `handover_cold` takes the line out of the shot; this block takes it out of the
# clip, because a model handed a stranger, a microphone and a product invents the question if
# nothing forbids it -- seed 4808 filled 4.5 unscripted seconds with gibberish under exactly that
# pressure, which is why "no invented speech" exists at all.
#
# It also carries "does not say this line", which is a REQUIRED_CLAUSE supplied by
# `handover_first` in a take that has one. That is not needle-satisfying: the guard is the same
# guard (nobody in frame speaks the interviewer's part) and an answers-only take needs it MORE,
# because the question is the obvious thing for the model to put in a stranger's mouth once the
# interviewer has stopped saying it.
# "there is no interviewer line at all" came out on 2026-10-01: it is the same fact as "THE
# INTERVIEWER NEVER SPEAKS", eight words earlier in the same sentence, and the needle the lint
# checks is that capitalised phrase. Both distinct rules are kept -- the interviewer says nothing,
# and nobody in frame asks a question either -- because those are two different mouths. The eight
# words went to episode 3's can grammar, which had none spare under the 1200-word ceiling.
# "Each person is already reacting to a {prod} just put into their hand." came out on
# 2026-10-01. It was context explaining why nobody asks anything -- and the shot list SHOWS it:
# every handover in an answers-only take reads "The interviewer holds the {prod} out to X; X
# takes it and holds it...". A sentence describing what the numbered shots already stage is the
# _MIC_SCALE_TAIL case, and episode 3's takes B and C needed the thirteen words to fit the
# eight-shot cast under the 1200-word ceiling.
ANSWERS_ONLY = (
    "NO QUESTION IS ASKED IN THIS CLIP AND THE INTERVIEWER NEVER SPEAKS: the interviewer does not "
    "say this line, \"{question}\", and nobody in frame asks a question either. ")

# ── the microphone, carried by the SCENE REFERENCE instead of by words (2026-10-01) ─────────
# WHY THIS EXISTS. Words have now failed to pin this microphone three times, and each attempt
# was longer than the last. Episode 1: three takes, three mics, from a loose "matte black
# elongated oval foam windscreen". Episode 2: MIC_PINNED, the tightest prop clause this format
# has carried, byte-identical in three payloads -- three mics again. Episode 3 take A (seed
# 4824): MIC_PINNED plus MIC_SCALE plus NO_LETTERING, six explicit negations including "NO foam
# windscreen" and "NO branding" -- and the model rendered a foam windscreen with a legible RODE
# brand mark on it. On a client video a real third-party logo is worse than a garble.
#
# The pattern across all three is Critical knowledge 29: a negation does not beat a prior, it
# only narrows the space when the prior is weak. A branded reporter's mic is what the training
# data is full of. So stop describing the object and SHOW it: the scene reference (Critical
# knowledge 27) is a real channel, and seed 4820 already rendered the correct unbranded slim
# black stick mic on the correct corner. Pointing at @Image2 is the same move that has kept the
# can's label faithful in every take since seed 4801.
#
# This REPLACES the whole mic description paragraph AND MIC_SCALE. It is not a weakening of the
# lint: `mic_ref` is its own grammar with its own clauses, `mic` is untouched and still
# available, and the two are refused together. The required clause "is in the same place in
# every shot" is supplied by the PRODUCT paragraph, which every prompt carries, so nothing that
# was paid for goes missing -- that is the same proof _MIC_SCALE_TAIL needed before deletion.
#
# It is also worth ~150 words, which is what pays for a four-person cast under the 1200-word
# ceiling, and cast size is the pace lever (see MIC_REF_CLAUSES' note and TAKES.md).
# NOTE the position pin in the middle of this sentence, and why it is there. The first draft of
# this block left it out, and the lint immediately refused the payload for missing "is in the
# same place in every shot" -- a REQUIRED_CLAUSE whose docstring says it covers BOTH objects and
# which, it turns out, was only ever WRITTEN by the mic paragraph: the product paragraph says
# "THE CAN IS HELD IN THE SAME PLACE", which does not match the needle. So the clause really was
# load-bearing and really would have gone missing, and the gate caught it for free before a
# $3.64 call. It is restated here positively, as a fact about where the object sits, which is
# the one thing a cropped reference image cannot carry.
MIC_FROM_REF = (
    "The microphone is exactly the microphone in @Image2: the same object, and IT IS IN THE SAME "
    "PLACE IN EVERY SHOT, held out at the speaker's chest, at the speaker's distance from the "
    "camera. ")

MIC_REF_CLAUSES = {
    "exactly the microphone in @image2": "the mic's SOURCE. Three rounds of describing this "
                                         "object in words produced three wrong microphones and "
                                         "then a legible RODE brand mark (seed 4824). The "
                                         "reference image is the only channel that has ever "
                                         "held a prop across calls; this clause is what points "
                                         "the model at it.",
    "at the speaker's distance from the camera": "the mic's DEPTH, which the reference image "
                                                 "cannot carry because a crop has no scale. It "
                                                 "is stated positively rather than as 'NOT "
                                                 "close to the lens': the negation is what seed "
                                                 "4816 ignored.",
}

MIC_CLAUSES = {
    "plain black handheld stick microphone": "the mic's SHAPE, taken from the Chris Klemens "
                                             "reference. The scaffold asked for 'a matte black "
                                             "elongated oval foam windscreen' and a foam blob is "
                                             "a shape with a lot of latitude inside it; episode "
                                             "1's three takes used that latitude three ways.",
    "small round dark metal mesh head": "the mic's HEAD. The head is the part that differed most "
                                        "between episode 1's three takes, and it is the part the "
                                        "old description left most open.",
    "no foam windscreen": "the NEGATION of the old description. Replacing a clause is not enough "
                          "when the model has seen the old shape a hundred thousand times; the "
                          "thing it must not draw has to be named.",
    "the identical microphone in every shot": "the CROSS-TAKE pin, which is the actual episode-1 "
                                              "defect. 'The same in every shot' was a within-clip "
                                              "rule and three separate calls satisfied it three "
                                              "different ways. This says the object itself is "
                                              "fixed, not merely consistent.",
}

PLAIN_CLAUSES = {
    "no text and no logo on any person": "the foreground lettering ban. Episode 1 garbled a "
                                         "slogan hoodie, a branded cap, a printed carrier bag and "
                                         "a lettered backpack. The existing signage clause is "
                                         "about the BACKGROUND and does not reach a garment.",
    "the only lettering in frame is the label": "the single exception. Without it the ban reads "
                                                "as covering the product too, and the product's "
                                                "label is the whole reason the can is passed as a "
                                                "reference image.",
    "all clearly adult": "the ADULTS-ONLY rule. Episode 1's middle take had a teenager with a "
                         "skateboard holding a can branded to look like beer at about 0:10.",
}

ANSWERS_CLAUSES = {
    "no question is asked in this clip": "the answers-only rule. Every episode-1 take carried the "
                                         "interviewer's question, so the episode asked it three "
                                         "times, at 0:00, 0:09 and 0:18, and the joins read as "
                                         "three videos.",
    "the interviewer never speaks": "the same rule stated as a fact about the interviewer. A "
                                    "negation about the question alone leaves the interviewer "
                                    "free to say something else, and a second voice at a join is "
                                    "the thing that sounds abrupt.",
}


# ── the can grammar, paid for by the episode-1 and episode-2 watches ────────────────────────
# Two defects, both about the product itself rather than about the people, and both REPLACEMENTS
# rather than additions for the reason MIC_SCALE, MIC_PINNED and _FRAME_WIDER all are: two size
# statements about one object are worse than either, and so are two statements about its state.
# Additive and off by default (`build_prompt(cfg, can=True)` / `single_gen.py --can`), so the
# approved seed-4815 payload still reproduces byte for byte and selftest.py's sha256 holds.
#
# DEFECT A: THE CAN WAS OPEN, AND IT WAS OPEN BECAUSE OF A DEAD END. Seed 4806 asked for a ring
# pull being pulled on camera, the model could not render it, and the standing fix has been "every
# unit is already open" -- a REQUIRED_CLAUSE ("nobody opens a") plus a brand-config `open_state` of
# "open". That is a product shot of an opened can for the whole video, which is not what the
# product looks like when someone is handed it. The right answer is an editor's, not a
# prompt-writer's: every can is CLOSED and SEALED, and where the episode needs it open the opening
# happens BETWEEN two shots. `reach` ends as the hands arrive, the `payoff` opens already drinking,
# and the pull -- the one action measured to be unrenderable -- is never asked for at all.
_SEALED = (
    "Nobody opens a {prod} on camera and no ring pull is ever pulled, hooked or touched: EVERY "
    "{PROD} IS CLOSED, SEALED AND UNOPENED, ring pull whole and intact, in every shot. ")
# The same sentence for a take that pays off on a drink. It keeps the unrenderable action banned
# and moves the exception to where it belongs: a cut, not a shot.
_SEALED_CUT = (
    "Nobody opens a {prod} on camera and no ring pull is ever pulled, hooked or touched: EVERY "
    "{PROD} IS CLOSED, SEALED AND UNOPENED, ring pull whole and intact, in every shot but the "
    "last. It is open only in the last shot and the opening itself is NEVER SHOWN. ")

# DEFECT B: THE CAN DRIFTED IN SCALE, in both episodes. Every existing product clause pins its
# POSITION, its COLOUR and its FACING, and the only thing it says about size is "the same size and
# shape in every frame" -- which is a WITHIN-clip relation between frames and says nothing about
# how big the object is. A can that is soda-sized in all four shots satisfies it completely. This
# REPLACES that phrase with a real-world size, bound against the hand holding it because the hand
# is the only other object in frame at a known size, exactly as MIC_SCALE binds the microphone
# against the speaker rather than against the hand (Critical knowledge 18). The measurement itself
# is the brand's (`product.size`), because 19oz is a fact about Liquid Death and not about this
# format.
CAN_SIZE = (
    "IT IS ALWAYS ITS REAL SIZE: {size}, the same size against the hand holding it in every shot, "
    "never shrinking and never growing. ")
_SIZE_DEFAULT = "the same size and shape in every frame"

# ── the upright grammar, paid for by watching seed 4827 shot by shot ────────────────────────
# THE OBSERVATION. In 4827 the can is upright, label to the lens and correctly tallboy-sized at
# 1.0s -- BEFORE anyone has examined it -- and from 5.0s on it is horizontal, lid to the lens,
# label hidden and about hand-length. Three separate defects (label facing, lid visible, can
# reads short) turned out to be ONE cause, and the cause was in the shot grammar rather than in
# any product clause: every handover said the person "takes it and looks at it". Examining a can
# means lifting and rotating it. The model was doing exactly what it was told.
#
# So this does not add a fourth product clause. It deletes the instruction that was fighting the
# three that already existed, and restates the orientation per shot, which is the only mechanism
# that has ever held a rule in this format (Critical knowledge 2). Reactions move to the face and
# the free hand, which is where a real vox pop puts them anyway.
#
# It REPLACES the position sentence rather than adding to it, and it SUPERSEDES the guards'
# LABEL_FACING, which said the same thing in its own sentence. The guard's needle ("front label
# is turned toward the lens") is carried verbatim here, so `guards` still lints and nothing that
# was paid for goes missing -- the same proof _MIC_SCALE_TAIL needed.
# Kept tight on purpose. The per-shot restatement below repeats the orientation and the label
# inside all eight numbered shots, so this sentence states each fact ONCE and the shots carry
# the repetition -- which is the arrangement that has actually held a rule in this format. Two
# phrases came out for being duplicates of their own neighbours: "the top of the {prod} is not
# visible in any shot" says what "THE LID IS NEVER SHOWN" says, and "lifts it toward the camera"
# says what "brings it near the lens" says.
UPRIGHT = (
    "THE {PROD} IS HELD IN THE SAME PLACE IN EVERY SHOT: UPRIGHT AND VERTICAL, base down, in the "
    "person's own hand at chest height on the LEFT of the frame, at the same distance from "
    "camera every time. Its front label is turned toward the lens in every shot. Nobody tilts "
    "it, rotates it, turns it to read it or brings it near the lens, and THE LID IS NEVER SHOWN. "
    "They react with their face, never by handling the {prod}. ")

UPRIGHT_CLAUSES = {
    "upright and vertical": "the ORIENTATION. Seed 4827 held the can horizontal from 5.0s on, "
                            "which is what turned the label away and pointed the lid at the "
                            "lens. Nothing in the prompt had ever said which way up it is.",
    "the lid is never shown": "the LID. Two takes have now rendered an open can under a sealed "
                              "clause, so the lid is kept out of shot instead of argued with. "
                              "This is the mechanism that replaces the sealed wording.",
    "never by handling": "the REACTION rule. Every handover used to say the person 'takes it and "
                         "looks at it', and examining a can means lifting and rotating it. The "
                         "instruction that caused the defect had to be deleted, not "
                         "counterbalanced by a fourth product clause.",
}

# Counted inside EVERY numbered shot, not found once. Same reasoning as the location
# restatement: seed 4804 kept the location clause and still changed street, so a substring test
# would have passed the take that was rejected. The orientation is now in the same category.
UPRIGHT_PER_SHOT = {
    "upright": "the per-shot orientation restatement. Stating it once at the top is what the "
               "location clause did on seed 4804, and it lost the location for two of four "
               "people. Whatever must hold in every shot is written in every shot.",
    "label to the lens": "the per-shot label restatement, for the same reason. Seed 4827 carried "
                         "the guards' label-facing clause once, at the top, and the label was "
                         "away from the lens for roughly two thirds of the clip.",
}

CAN_SIZE_CLAUSES = {
    "always its real size": "the can's ABSOLUTE scale. Episodes 1 and 2 both drifted in can "
                            "scale. Every other product clause pins position, colour and facing, "
                            "and the only size words in the prompt were 'the same size and shape "
                            "in every frame', which is a relation between frames: a can that is "
                            "soda-sized in all four shots satisfies it completely.",
}

# The sealed half, split out on 2026-10-01. It is OFF for episode 3 take A: two takes ran
# it with a per-shot restatement and a sealed product reference photo, with and without a
# scene reference, and both rendered an open can (SKILL.md 31). Keeping the lid out of shot
# is the mechanism now, and that is the UPRIGHT grammar. The wording stays here because take
# C still pays off on a drink and the reach/payoff pair needs the exception sentence; it is
# a separate flag so a take can buy the SIZE rule without re-buying the argument.
CAN_SEALED_CLAUSES = {
    "closed, sealed and unopened": "the SEALED state. The standing wording was 'every can is "
                                   "already open', which came from seed 4806's unrenderable "
                                   "ring pull and left an opened can on screen for the whole "
                                   "video.",
    "no ring pull is ever pulled, hooked or touched": "the UNRENDERABLE ACTION ban, which is the "
                                                      "reason the cans were open in the first "
                                                      "place. Seed 4806 spent $3.64 on a tab "
                                                      "being pulled on camera and the model "
                                                      "could not draw it. A sealed can must NOT "
                                                      "reintroduce the request.",
}


# The legacy name, kept so a manifest recorded before the split (`can_grammar: true`, seeds
# 4824 and 4827) lints exactly as it did. `can=True` means both halves.
CAN_CLAUSES = dict(CAN_SIZE_CLAUSES, **CAN_SEALED_CLAUSES)


# ── nobody but the interviewer has a microphone (2026-10-01) ────────────────────────────────
# NEW, and it is a defect nobody had ever written a clause against. Watching episode 2 the
# operator found a woman at 7.5s holding a SECOND handheld microphone of her own, and a dark
# object at a subject's chest at 21s. Every mic clause this format has carried describes the
# interviewer's microphone -- its shape, its scale, its position, its branding -- and not one
# of them says how many microphones exist. A reporter's mic in frame makes "someone else with a
# mic" a high-prior object, so the model supplies one.
# Stated as a COUNT and as a negation of each form it takes, because naming the ban is what the
# hi-vis and the RODE mark both taught (Critical knowledge 24, 29), and restated per shot via
# `only`, because a per-shot restatement is the only thing that has ever held a rule here.
NO_SUBJECT_MIC = (
    "THE ONLY MICROPHONE IN FRAME IS THE INTERVIEWER'S: nobody being interviewed holds, wears "
    "or carries a microphone of any kind, and nothing is clipped to a collar or a lapel. ")

ONE_MIC_CLAUSES = {
    "the only microphone in frame is the interviewer's": "the mic COUNT. Episode 2 put a second "
        "handheld microphone in a subject's hand at 7.5s and a dark object at a chest at 21s. "
        "Every mic clause before this described the interviewer's microphone and none of them "
        "said how many microphones there are.",
    "nothing is clipped to a collar or a lapel": "the LAPEL form of it, named separately. A "
        "clip-on is not a microphone the model thinks of as a microphone, and the chest object "
        "at 21s is what that looks like.",
}

ONE_MIC_PER_SHOT = {
    "only the": "the per-shot sole-microphone restatement. Stating it once at the top is what "
                "the location clause did on seed 4804, and it lost the location for two of four "
                "people.",
}


def build_prompt(cfg: dict, pace: bool = False, guards: bool = False, mic: bool = False,
                 plain: bool = False, answers_only: bool = False, can: bool = False,
                 mic_ref: bool = False, can_size: bool = False, can_sealed: bool = False,
                 upright: bool = False, one_mic: bool = False) -> str:
    if cfg.get("mode") == "conversation":
        import conversation
        if any((guards, answers_only, can, mic_ref, can_size, can_sealed, upright)):
            raise ValueError("product/episode grammars cannot be applied to conversation")
        return conversation.build_prompt(cfg)
    # `can` is the pre-split name and means BOTH halves, so seeds 4824 and 4827 reproduce.
    can_size, can_sealed = can_size or can, can_sealed or can
    p = cfg["product"]
    prod, phrase = p["noun"], p["phrase"]
    shots = cfg["shots"]
    n_shots = word(len(shots))
    # `handover_cold` counts as a handover here. Leaving it out made the cast size fall by one
    # on every answers-only take, so the prompt would have said "One clearly different people".
    cast = sorted({s.get("noun") or s.get("subject") for s in shots if s.get("kind") in
                   ("handover_first", "handover_cold", "handover", "sip")})
    n_cast = word(cfg.get("cast_size") or len(cast))

    return (
        # capture grammar. "cinematic" and "shallow depth of field" are BANNED_VOCAB below: both
        # pull a commercial grade, which is the first thing that reads as AI here.
        "Raw unedited phone footage of a street interview, filmed vertically, handheld, "
        f"{cfg['location'].get('light', 'flat grey overcast daylight')}, "
        "30 frames per second. Fast hard jump cuts. "

        # The pace block sits HIGH on purpose: whatever leads the prompt wins (Critical knowledge
        # 2), it is about cutting so it belongs with the capture grammar, and on seed 4809 -- the
        # only take that ever hit the reference pace -- it sat in the same place, above the shot
        # list and below the opening line.
        + (PACE_BLOCK if pace else "")

        # eyeline: seed 4802 had the subject eyes-down because the shot direction said so
        # "Every person is looking at the interviewer, and " is the same fact as the
        # capitalised needle it introduces, in the same sentence. Dropped with one_mic on,
        # where the glance beat describes the eyeline in the shots as well.
        + ("" if one_mic else "Every person is looking at the interviewer, and ")
        + "THEY LOOK AT THE INTERVIEWER WHILE THEY SPEAK, eyes open and level, fixed on "
        "someone just outside the frame. Nobody looks at the camera or down at the ground. Each "
        "person is turned three quarters toward that interviewer. "

        # live street: 4802's corner was empty, which read as a set
        "The street is busy: other passers-by walk through the background of every shot, blurred by "
        "their own movement, and traffic moves along the road. This corner is never empty. "

        # one object per hand: asking for two in the interviewer's hands caused every object
        # failure up to seed 4803, and asking for one merged them on 4801
        f"THE INTERVIEWER HAS BOTH HANDS IN FRAME AND ONE OBJECT IN EACH. The LEFT hand holds out "
        f"the {phrase}; the RIGHT hand holds a classic handheld reporter's microphone. "
        # The simultaneity sentence ("Both hands and both objects are visible AT THE SAME TIME
        # in the handover shots: one arm extending the can, the other already holding the
        # microphone up") comes out when one_mic is on. It was the seed-4803 guard against the
        # two objects not co-existing, and both of its linted needles -- "one object in each"
        # and "two different objects in two different hands" -- are in the sentences either
        # side of it. What it adds beyond them is that the handover STAGES both at once, and
        # the handover shots now stage exactly that in words ("The interviewer holds the can
        # out to X; X takes it and holds it UPRIGHT"), with one_mic additionally stating that
        # the subject's hands hold only the can. 26 words, and episode 4 has none to spare.
        + ("" if one_mic else
           f"Both hands and both objects are visible AT THE SAME TIME in the handover shots: "
           f"one arm extending the {prod}, the other already holding the microphone up. ")
        + f"The {prod} is never in the "
        f"microphone hand and the microphone is never in the {prod} hand. The two objects never "
        f"touch, never swap and never merge into one: they are two different objects in two "
        f"different hands. "
        # MIC_PINNED REPLACES this description rather than adding to it. Both versions keep the
        # position pin and the two negations; what changes is the OBJECT, from a foam oval to the
        # Klemens stick mic, plus the statement that it is the SAME object in every shot -- the
        # cross-take defect, which no version of this paragraph has ever carried.
        # mic_ref REPLACES this entire paragraph, and suppresses MIC_SCALE below it. See
        # MIC_FROM_REF: the object comes from @Image2 rather than from a description, because
        # three rounds of description produced three wrong microphones and then a brand mark.
        + (MIC_FROM_REF if mic_ref else MIC_PINNED.format(prod=prod) if mic else (
        "The microphone is a matte "
        "black elongated oval foam windscreen, "
        # "about the size of a small fist" sizes the microphone against the HAND HOLDING IT, and
        # on seed 4815 the model rendered exactly that, at the hand's distance from the lens: a
        # foam ball filling roughly a fifth of the frame in the foreground. MIC_SCALE sizes it
        # against the SPEAKER instead, which is how seeds 4808 and 4809 got it right. Two
        # contradictory size statements are worse than either, so with the pace grammar on this
        # phrase comes out and MIC_SCALE is the only size rule. Untouched by default.
        + ("" if pace else "about the size of a small fist, ") +
        "on a short plain black "
        "handle, with a thin black cable from the base. Plain matte black, no branding or logo flag. "
        "Held upright in one bare hand, pointed up toward the speaker, at chest height. THE MICROPHONE "
        "IS IN THE SAME PLACE IN EVERY SHOT: entering from the lower RIGHT of the frame, at the same "
        "height just below the speaker's chin, never crossing to the left and never rising or "
        "dropping between shots. NOT a clip-on "
        f"lapel mic and NOT a fluffy grey windshield. The interviewer never holds anything else, and "
        f"the microphone never becomes a {prod}. "))
        + ("" if mic_ref else
           (MIC_SCALE.replace(_MIC_SCALE_TAIL, "") if mic else MIC_SCALE) if pace else "")

        # Answers only: no interviewer line anywhere in this clip. It sits directly under the
        # microphone paragraph because it is a fact about the interviewer, and it sits HIGH
        # because whatever leads the prompt wins (Critical knowledge 2) and this is the clause
        # that removes the abrupt join.
        + (ANSWERS_ONLY.format(prod=prod, question=cfg["question"]) if answers_only else "") +

        # the product: pinned in frame (so it does not jump on a cut), never opened on camera
        # (seed 4806's tab-pull was unrenderable), never drifting in colour or size
        f"The {phrase} from @Image1 is in the hand of the person being interviewed, never the "
        f"interviewer's. It appears exactly as the reference: {p['appearance']}, "
        # CAN_SIZE REPLACES the size phrase rather than adding to it. See the can grammar above.
        + (CAN_SIZE.format(size=p["size"]) if can_size else _SIZE_DEFAULT + ". ")
        # UPRIGHT REPLACES this whole sentence. See its comment: the position was never the
        # problem, the ORIENTATION was, and nothing had ever stated which way up the can is.
        + (NO_SUBJECT_MIC if one_mic else "")
        + (UPRIGHT.format(prod=prod, PROD=prod.upper()) if upright else
           f"THE {prod.upper()} IS HELD "
           f"IN THE SAME PLACE IN EVERY SHOT: in the person's own hand, raised to chest height "
           f"on the LEFT side of the frame, "
        # TWO DUPLICATES INSIDE THIS SENTENCE, removed only when the can grammar is on, so the
        # approved seed-4815 payload still reproduces byte for byte. "the same height and" is the
        # same fact as "raised to chest height" eight words earlier, and ", so it never jumps
        # position when the shot changes" is a RATIONALE for the capitalised head of the sentence
        # it is attached to, not an instruction. The precedent for deleting a guard is
        # _MIC_SCALE_TAIL: it is allowed when what it said is provably still in the prompt, and
        # both of these are. The thirteen words buy the can grammar's real-size statement.
           + ("at the same distance from camera every time. " if can_size else
              "the same height and the same distance from camera every time, so it never jumps "
              "position when the shot changes. "))
        + f"{p['colour_ban']} "
        # ...and so does the state sentence. `opening_extra` / `open_state` are the ungrammared
        # wording and are ignored when the can grammar is on: one statement about the can's state,
        # not two.
        + ((_SEALED_CUT if any(s["kind"] == "reach" for s in shots) else _SEALED).format(
            prod=prod, PROD=prod.upper()) if can_sealed else
           f"Nobody opens a {prod} on camera{p.get('opening_extra', '')}; every {prod} is "
           f"already {p.get('open_state', 'open')}. ")

        # the label's FACING, which no other product clause states. See LABEL_FACING.
        # LABEL_FACING is SUPERSEDED by UPRIGHT, which carries its needle verbatim
        # ("front label is turned toward the lens"), so `guards` still lints and the
        # prompt does not say the same thing in two sentences.
        + (LABEL_FACING.format(prod=prod) if (guards and not upright) else "") +

        # framing, wide: 4802 was a tight close-up, which also forced every pore to render.
        # _FRAME_WIDER is a REPLACEMENT, not an addition: seed 4816 came back chest-up with
        # _FRAME_DEFAULT in the prompt, and two framing sentences would contradict each other.
        (_FRAME_WIDER if guards else _FRAME_DEFAULT)
        + (_PIN_PACE if pace else _PIN_DEFAULT) +
        f"{n_cast.capitalize()} "
        # _CAST_ADULTS REPLACES this sentence. One statement about who these people are, not two:
        # the adults-only rule is a property of the cast and belongs in the cast sentence.
        + (_CAST_ADULTS if plain else _CAST_DEFAULT) +
        f"{cfg['props']}. Their free hand is "
        "occupied or relaxed, never held up open and empty. "

        # signage: banning ALL text was itself a tell, a real street is covered in it.
        # NO_LETTERING is a SECOND rule about a DIFFERENT surface and does not replace this one:
        # this clause is about the background, and every word episode 1 garbled was in the
        # foreground, on a person, sharp and central.
        "Street signs and shopfronts are present far behind the subject but small, distant and out of "
        "focus, never sharp and never legible. "
        + (NO_LETTERING.format(prod=prod) if plain else "") +

        # invented speech: 4808 filled 4.5 unscripted seconds with gibberish
        f"The microphone is visible in EVERY one of the {n_shots} shots, never absent. NOBODY SAYS "
        f"ANY WORD THAT IS NOT WRITTEN BELOW. No mumbling, no invented speech, no filler, "
        "and no talking after the last written line. When a person is not speaking their line, they "
        "are silent. "

        # the shot list. Each entry restates the corner, because restating per shot is the only
        # thing that has ever held the location.
        f"THE {n_shots.upper()} SHOTS, each about one and a half seconds. EVERY SHOT IS FILMED on "
        f"ONE corner: {cfg['location']['description']}. "
        f"{cfg['location']['landmarks']} are behind every person in all {n_shots}. "

        + "".join(_shot(i, s, cfg, can=can_sealed, upright=upright, one_mic=one_mic,
                        prev_kind=(shots[i - 2]["kind"] if i >= 2 else None))
                  for i, s in enumerate(shots, start=1)) +

        "Sound: the voices close on the microphone and one continuous street ambience across the "
        "cuts, traffic, footsteps and a distant horn. No music, no score, no logo, no on-screen text, "
        "no subtitles.")


# ── what the gate lints for ────────────────────────────────────────────────────────────────
# `check-cut.py` imports these two dicts instead of keeping its own copy. That is the whole point
# of the split: the required clauses are a property of the FORMAT, not of one brand's payload, and
# a gate that reads them from the brand's own copy can only ever confirm that the brand said what
# the brand said. Every needle here is lowercased substring and is brand-INDEPENDENT: it must
# survive `build_prompt` for any config, which `selftest.py` asserts against both configs.
REQUIRED_CLAUSES = {
    "every shot is filmed": "the ONE-location restatement (without it the model invents a new "
                            "street per shot inside a single call)",
    "on that same corner": "the PER-SHOT location restatement. Stating the corner once at the "
                           "top is not enough: seed 4804 lost the location for two of four "
                           "people because the object rule was promoted above it. Whatever "
                           "leads the prompt wins and whatever is pushed down gets dropped.",
    "this corner is never empty": "the live-street clause. Seed 4802's corner was empty of "
                                  "passers-by and traffic, which read as a set rather than a "
                                  "street.",
    "one object in each": "one object per HAND. Asking for a microphone and the product in the "
                          "same hand produced three separate object failures on seed 4803.",
    "two different objects in two different hands": "the mic/product separation (seed 4801 "
                                                    "merged them and produced no microphone at "
                                                    "all)",
    "is in the same place in every shot": "object-position pinning, for BOTH the microphone and "
                                         "the product. Without it the objects jump across the "
                                         "frame on every internal cut and the four shots stop "
                                         "reading as one afternoon.",
    "stands in the same place": "subject-position pinning. If people are not the same size in "
                                "the same part of the frame, cutting between them reframes and "
                                "the single take reads as a stitch.",
    "nobody opens a": "the no-opening rule. Seed 4806 was asked for a ring pull being pulled on "
                      "camera and the model could not render it; every unit is already open.",
    "no invented speech": "the no-invented-dialogue rule. Seed 4808 filled 4.5 unscripted "
                          "seconds with gibberish.",
    "never sharp and never legible": "signage kept distant and defocused. The blanket ban on\n                                      all text was itself a tell: a real street is covered in\n                                      text, and one with none reads as a set. Distant and out\n                                      of focus is what stops the garbling.",
    "they look at the interviewer while they speak": "the eyeline. The rejected 4802 take had\n                                      the subject eyes-down because the old shot direction said\n                                      \"glances down at the can\". The defect was authored, not\n                                      model drift.",
    "every shot is wide": "wide framing. Every real reference shows head to hips or further;\n                                      the rejected take was a tight head and shoulders, which\n                                      also forced every pore to render.",
    "does not say this line": "the ask-and-answer guard (otherwise the subject speaks the "
                              "interviewer's question)",
    "ordinary healthy": "the cast direction, after 'people aren't normal'",
    "detail falls away behind the subject": "background falloff. NOTE this replaced a plain "
                           "'deep depth of field' clause: real street footage is deep focus "
                           "but NOT uniformly micro-sharp, and reading those as the same thing "
                           "is what produced detail 15.92 against 4.76-9.60 for real footage",
}

# Vocabulary that produced a rejection. Any hit fails. Also brand-independent by construction:
# a brand config that smuggles one of these in through its own copy fails the same lint.
BANNED_VOCAB = {
    "cinematic": "'cinematic' pulls shallow DOF and a commercial grade, the first AI tell here",
    "shallow depth of field": "the AI tell; real phone footage keeps the street sharp",
    "flawless skin": "banned model vocabulary",
    "eye bags": "the 'realism is imperfection' over-correction that produced unwell-looking "
                "caricatures and the 'people aren't normal' rejection",
    "blotchy": "same over-correction",
    "thinning hair": "same over-correction",
    "uneven teeth": "same over-correction",
}

# Engineering, not creative. A brand config may not change these; they are here so the recipe has
# one place to read them from.
MODEL = "bytedance/seedance-2.0/reference-to-video"
MODEL_FAST = "bytedance/seedance-2.0/fast/reference-to-video"
RATE = 0.3034          # $/s
RATE_FAST = 0.2419
GEN_CAP_S = 15.0       # Seedance single-call ceiling; the idea has to fit inside it
RESOLUTION = "720p"    # MODEL_BEHAVIORS.md: the classifier sweeps harder at 1080p
ASPECT = "9:16"
WORD_CEILING = 1200    # past this the model starts dropping rules (measured on seed 4811)


# Clauses that must appear in EVERY numbered shot, not merely somewhere in the prompt. The
# per-shot location restatement is the only one so far, and it has to be counted rather than
# found: seed 4804 lost the corner for two of four people while the phrase was still present
# further up the prompt, so a substring test would have passed the take that was rejected.
REQUIRED_PER_SHOT = {
    # "corner", not "that same corner": shot 1 reads "on that corner" and shots 2 onward read
    # "on that same corner". A needle that only matches the longer form reported seven false
    # failures the first time this was written.
    "corner": "the per-shot location restatement. Counted per shot, not found once: seed "
                   "4804 still contained the location clause and still changed street between "
                   "shot 1 and shot 2, because the clause had been pushed above the object rule "
                   "and crowded out. One afternoon on one corner is the whole premise.",
}


def lint(prompt: str, pace: bool = False, guards: bool = False, mic: bool = False,
         plain: bool = False, answers_only: bool = False, can: bool = False,
         mic_ref: bool = False, can_size: bool = False, can_sealed: bool = False,
         upright: bool = False, one_mic: bool = False, mode: str = "product-guess"):
    """The prompt lint, as a function, so `check-cut.py` and `single_gen.py --dry-run` apply the
    SAME rule to the same text. Returns a list of failure strings.

    `pace=True` adds PACE_CLAUSES and `guards=True` adds GUARD_CLAUSES. Both are additive and
    off by default: a prompt built without them lints exactly as it did before, so nothing that
    has already been gated changes verdict. Callers that do not know about either flag keep
    working.

    A caller that does not know which grammars a prompt was built with must not guess: pass the
    flags recorded in the generation manifest. `check-cut.py` reads `pace_grammar` and
    `guard_grammar` out of the manifest for exactly this reason -- linting a pace prompt with
    `pace=False` would report a PASS while the four clauses the pace grammar paid for went
    unchecked, which is how the pace block was deleted at seed 4812 and nothing noticed."""
    if mode == "conversation":
        import conversation
        if any((guards, answers_only, can, mic_ref, can_size, can_sealed, upright)):
            return ["product/episode grammars cannot be applied to conversation"]
        return conversation.lint(prompt, split_shots, WORD_CEILING)
    if mode != "product-guess":
        return ["unknown street execution mode"]
    can_size, can_sealed = can_size or can, can_sealed or can
    if mic and mic_ref:
        return ["`mic` and `mic_ref` are two different answers to the same question and the "
                "prompt may not hold both: one describes the microphone in words, the other "
                "points at @Image2 and says nothing else about it. Two descriptions of one "
                "object are worse than either (see MIC_SCALE's comment)."]
    pr = prompt.lower()
    need = dict(REQUIRED_CLAUSES, **(PACE_CLAUSES if pace else {}),
                **(MIC_SCALE_CLAUSES if (pace and not mic_ref) else {}),
                **(MIC_REF_CLAUSES if mic_ref else {}),
                **(GUARD_CLAUSES if guards else {}), **(MIC_CLAUSES if mic else {}),
                **(PLAIN_CLAUSES if plain else {}),
                **(ANSWERS_CLAUSES if answers_only else {}),
                **(CAN_SIZE_CLAUSES if can_size else {}),
                **(CAN_SEALED_CLAUSES if can_sealed else {}),
                **(UPRIGHT_CLAUSES if upright else {}),
                **(ONE_MIC_CLAUSES if one_mic else {}))
    out = [f'the prompt is missing "{n}" -- {why}' for n, why in need.items()
           if n not in pr]
    out += [f'the prompt contains "{n}" -- {why}' for n, why in BANNED_VOCAB.items() if n in pr]
    shots = split_shots(prompt)
    per_shot = dict(REQUIRED_PER_SHOT, **(UPRIGHT_PER_SHOT if upright else {}),
                    **(ONE_MIC_PER_SHOT if one_mic else {}))
    for n, why in per_shot.items():
        bare = [i for i, s in enumerate(shots, start=1) if n not in s.lower()]
        if not shots:
            out.append(f'no numbered shot list, so "{n}" cannot be counted per shot -- {why}')
        elif bare:
            out.append(f'shot(s) {bare} do not restate "{n}" -- {why}')
    if len(prompt.split()) > WORD_CEILING:
        out.append(f"the prompt is {len(prompt.split())} words, over the {WORD_CEILING}-word "
                   f"ceiling where seed 4811 started dropping rules")
    return out


# ── reading a prompt back ──────────────────────────────────────────────────────────────────
import re  # noqa: E402  (kept at the bottom: this block is the read-back half of the module)

_SHOT_RE = re.compile(r"(?:(?<=\s)|^)(\d{1,2})\. ")


def split_shots(prompt: str):
    """The shot descriptions inside a prompt this module built, in order.

    `check-cut.py` used to look for "Shot N:" labels. THE FORMAT HAS NEVER WRITTEN THEM: the shot
    list is numbered "1. ", "2. ", so the split returned ZERO shots, the product-in-the-opening
    check never ran, and it reported a warning instead of a result on every take ever gated.
    Found 2026-09-30 while splitting this module out. That check is the one that answers
    "couldn't understand what it's about", so an unrunnable version of it is worse than none.
    """
    hits = list(_SHOT_RE.finditer(prompt))
    # Only the run of ascending numbers that starts at 1 is the shot list; a stray "1. " earlier
    # in the prompt would otherwise open a phantom shot.
    seq, expect = [], 1
    for m in hits:
        if int(m.group(1)) == expect:
            seq.append(m)
            expect += 1
    return [prompt[m.start():(seq[i + 1].start() if i + 1 < len(seq) else len(prompt))]
            for i, m in enumerate(seq)]


_LOC_RE = re.compile(r"EVERY SHOT IS FILMED on ONE corner: (.*?)\. ", re.S)


def location_clause(prompt: str):
    """The one-location sentence, read back out of a prompt. Brand-independent by construction:
    the wording around it belongs to the format and the brand only fills in the description.

    This is what `check-cut.py`'s multi-take provenance check compares across an episode's
    manifests, and it deliberately stops at the description. The NEXT sentence is
    "<landmarks> are behind every person in all <n>", where <n> is the shot count spelled out --
    so three takes of the same shoot with five, six and five shots have three different strings
    there and a whole-paragraph comparison reports a location change that did not happen. The
    first version of the episode check did exactly that. Compare the thing that has to match.
    """
    m = _LOC_RE.search(prompt)
    return m.group(1).strip() if m else None


def product_noun(prompt: str):
    """The product's noun, read back out of a prompt. Brand-independent by construction: it comes
    from the no-opening clause, which the format writes and the brand only fills in."""
    m = re.search(r"Nobody opens a ([a-z]+) on camera", prompt)
    return m.group(1) if m else None

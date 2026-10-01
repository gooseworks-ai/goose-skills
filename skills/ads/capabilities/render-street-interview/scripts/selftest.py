#!/usr/bin/env python3
"""Free. No network, no ffmpeg, no key. Proves the format/brand split did not change the format.

    python selftest.py

Four assertions, in order of how much they would cost to discover the hard way:

  1. The approved payload is UNCHANGED. `brands/liquid-death.json` through `format_spec.py`
     reproduces the prompt recorded in the seed-4815 manifest byte for byte. Checked against a
     sha256 that lives in THIS file, so it still runs on a fresh checkout where `projects/` (and
     therefore the manifest) does not exist. If the manifest IS on disk, the full text is compared
     too. This is the assertion that makes the refactor reviewable: the prompt was not reworded,
     it was re-sourced.
  2. Every required clause survives for EVERY brand on disk. A clause that only holds for one
     config is brand copy masquerading as format knowledge, which is the whole bug being fixed.
  3. Every brand's prompt can be read back: the numbered shot list parses, and the product is in
     the opening and the payoff shot.
  4. Deleting a clause FAILS the lint. A lint that has never rejected anything is decoration, and
     five detectors written for this format were themselves the bug. See TAKES.md.
"""
import hashlib
import json
import sys

import brandkit
import format_spec
import paths

# sha256 of the prompt recorded in projects/street-interview/working/takes/ld-single-seed4815.json,
# the approved base. 948 words, 5306 characters. Recorded here on 2026-09-30 so the assertion
# survives a checkout without projects/, which is gitignored.
APPROVED = {
    "brand": "liquid-death",
    "seed": 4815,
    "sha256": "1ce00e2fd91e2476dacaa754910958aab22d7ee4d062047ec1faca9aa9edfbee",
    "words": 948,
    "chars": 5306,
}

def _strip_all(text, needle):
    """Remove every case-insensitive occurrence of `needle`."""
    import re as _re
    return _re.sub(_re.escape(needle), "", text, flags=_re.I)


fails = []


_GRAMMARS = (("pace", "pace_grammar"), ("guards", "guard_grammar"), ("mic", "mic_grammar"),
             ("plain", "plain_grammar"), ("answers_only", "answers_only"),
             ("can", "can_grammar"), ("mic_ref", "mic_ref_grammar"),
             ("can_size", "can_size_grammar"), ("can_sealed", "can_sealed_grammar"),
             ("upright", "upright_grammar"), ("one_mic", "one_mic_grammar"))


def _declared(cfg):
    """The grammar flags a config declares, as build_prompt/lint kwargs. The same mapping
    single_gen.py reads, so the selftest lints the payload that would actually be sent."""
    gen = cfg.get("generation", {})
    return {arg: bool(gen.get(key)) for arg, key in _GRAMMARS}


def _n_clauses(G):
    return len(format_spec.REQUIRED_CLAUSES) + sum(
        len(d) for d, flag in ((format_spec.PACE_CLAUSES, G.get("pace")),
                               (format_spec.GUARD_CLAUSES, G.get("guards")),
                               (format_spec.MIC_CLAUSES, G.get("mic")),
                               (format_spec.PLAIN_CLAUSES, G.get("plain")),
                               (format_spec.ANSWERS_CLAUSES, G.get("answers_only")),
                               (format_spec.CAN_SIZE_CLAUSES,
                                G.get("can_size") or G.get("can")),
                               (format_spec.CAN_SEALED_CLAUSES,
                                G.get("can_sealed") or G.get("can")),
                               (format_spec.UPRIGHT_CLAUSES, G.get("upright")),
                               (format_spec.ONE_MIC_CLAUSES, G.get("one_mic")),
                               (format_spec.MIC_SCALE_CLAUSES,
                                G.get("pace") and not G.get("mic_ref")),
                               (format_spec.MIC_REF_CLAUSES, G.get("mic_ref"))) if flag)


def _refuses(cfg):
    """True when brandkit.validate REFUSES this config. A validator that has never rejected
    anything is decoration -- five detectors written for this format were themselves the bug."""
    try:
        brandkit.validate(cfg)
    except SystemExit:
        return True
    return False


def ok(label, cond, detail=""):
    print(("  ok   " if cond else "  FAIL ") + label + (f"  {detail}" if detail else ""))
    if not cond:
        fails.append(label + (f" -- {detail}" if detail else ""))


def main():
    brands = brandkit.available()
    print(f"brand configs: {', '.join(brands)}\n")

    print("1. the approved payload is unchanged")
    cfg = brandkit.load(APPROVED["brand"])
    pr = format_spec.build_prompt(cfg)
    got = hashlib.sha256(pr.encode()).hexdigest()
    ok(f"seed {APPROVED['seed']} prompt sha256", got == APPROVED["sha256"],
       f"{got[:16]}... expected {APPROVED['sha256'][:16]}...")
    ok("word count", len(pr.split()) == APPROVED["words"], f"{len(pr.split())}")
    ok("character count", len(pr) == APPROVED["chars"], f"{len(pr)}")
    man = (paths.layout()["takes"] /
           f"{brandkit.take_name(cfg, APPROVED['seed'])}.json")
    if man.exists():
        old = json.loads(man.read_text(encoding="utf-8"))["prompt"]
        ok("full text against the manifest on disk", old == pr,
           "identical" if old == pr else "DIFFERS")
    else:
        print(f"  SKIPPED (not a pass) full text against the manifest on disk: {man} is not "
              f"there. projects/ is gitignored, so a fresh checkout has no manifest. The "
              f"sha256, word and character assertions above cover the same claim and DID run; "
              f"this line exists so a reader is never left guessing which of the two happened.")

    print("\n2. every brand passes the lint under the grammars ITS OWN config declares")
    # This used to build every config with NO grammars, which was right when the grammars were
    # decoration on top of a complete prompt. It is wrong now: `answers_only` REPLACES the
    # ask-and-answer guard rather than adding to it (ANSWERS_ONLY carries "does not say this
    # line" for a take whose shot 1 is `handover_cold`), so building an answers-only config with
    # the grammar off lints a payload that can never be sent and reports a missing clause that is
    # not missing. Lint what would actually be sent -- which is also exactly what single_gen.py
    # and check-cut.py do, from the same flags.
    for slug in brands:
        c = brandkit.load(slug)
        G = _declared(c)
        p = format_spec.build_prompt(c, **G)
        problems = format_spec.lint(p, **G)
        tag = "+".join(sorted(k for k, v in G.items() if v)) or "none"
        ok(f"{slug} [{tag}]: {_n_clauses(G)} clauses, no banned vocabulary, "
           f"{len(p.split())} of {format_spec.WORD_CEILING} words", not problems,
           "; ".join(problems)[:300])

    # The pace and guard grammars are ADDITIVE, which means nothing above this line looks at
    # them: `build_prompt(cfg)` builds neither, so their clauses and, more importantly, their
    # WORD COST were invisible to every assertion in this file. Measured 2026-09-30: the
    # four-person Liquid Death cast lands at 948 words plain, 1162 with the pace grammar and
    # 1190 with both -- 10 words under the 1200-word ceiling where seed 4811 started dropping
    # rules. A fifth person, or one more sentence anywhere, blows it. That has to fail here, for
    # free, and not in a paid dry run someone types `--yes` past.
    print("\n2b. every grammar combination is CLAUSE-clean, and the word headroom is printed")
    # The WORD COST is the thing this section exists for, and it matters more with five grammars
    # than it did with two. The episode-2 combination (pace+guards+mic+plain, and +answers_only
    # for a non-opening take) is the largest prompt this format has ever built. Measured
    # 2026-09-30 it lands under the 1200-word ceiling where seed 4811 started dropping rules --
    # and the margin is small, so a sixth person or one more sentence blows it. That has to fail
    # here, for free, and not in a paid dry run someone types `--yes` past.
    # WHAT THIS ASSERTS AND WHAT IT ONLY REPORTS, because the difference is the whole point.
    #
    # CLAUSES are asserted for every combination: a grammar that drops a guard when combined with
    # another is a defect in the format layer and has to fail here, for free.
    #
    # The WORD CEILING is asserted in section 2, against the grammars each config DECLARES --
    # i.e. against the payload that would actually be sent -- and is only REPORTED here. Measured
    # 2026-09-30: the six-shot three-person episode-1 casts (liquid-death, -4816, -4818,
    # demo-tallgrass-oat) run 1219-1259 words under all four grammars, over the ceiling. That is
    # a true and useful fact -- a three-person cast cannot carry all four -- and it is printed
    # rather than hidden. It is not a hole: `single_gen.py` lints unconditionally before any
    # spend and refuses an over-ceiling prompt whatever this file says, which is what actually
    # stopped the first draft of the episode-2 payloads reaching a paid call.
    combos = [dict(pace=True), dict(guards=True), dict(pace=True, guards=True),
              dict(mic=True), dict(plain=True),
              dict(pace=True, guards=True, mic=True, plain=True),
              dict(pace=True, guards=True, mic=True, plain=True, answers_only=True)]
    tight = []
    for slug in brands:
        c = brandkit.load(slug)
        cold = c["shots"][0]["kind"] == "handover_cold"
        for G in combos:
            # answers_only and `handover_first` contradict each other by construction, in both
            # directions, and brandkit refuses both pairings. Skipping them here is not a hole:
            # section 6 is where those refusals are proved.
            if bool(G.get("answers_only")) != cold:
                continue
            p = format_spec.build_prompt(c, **G)
            n = len(p.split())
            over = f"the prompt is {n} words"
            problems = [x for x in format_spec.lint(p, **G) if not x.startswith(over)]
            tag = "+".join(sorted(G))
            ok(f"{slug} [{tag}]: {_n_clauses(G)} clauses clean, {n} words", not problems,
               "; ".join(problems)[:300])
            if n > format_spec.WORD_CEILING:
                tight.append(f"{slug} [{tag}] {n}")
    if tight:
        print(f"  NOTE (not a failure) these combinations exceed the {format_spec.WORD_CEILING}"
              f"-word ceiling and so cannot be sent for those configs; single_gen.py refuses "
              f"them before spending: {', '.join(tight)}")

    print("\n3. every brand's prompt reads back")
    for slug in brands:
        c = brandkit.load(slug)
        p = format_spec.build_prompt(c)
        shots = format_spec.split_shots(p)
        noun = format_spec.product_noun(p)
        ok(f"{slug}: shot list parses", len(shots) == len(c["shots"]),
           f"read {len(shots)} of {len(c['shots'])}")
        ok(f"{slug}: product noun reads back", noun == c["product"]["noun"], repr(noun))
        ok(f"{slug}: the {noun} is in the opening and the payoff",
           bool(shots) and noun in shots[0].lower() and noun in shots[-1].lower())

    print("\n4. the lint rejects a prompt with a clause removed")
    # Falsification, not decoration. One clause at a time, so a lint that has quietly stopped
    # looking at any single needle is caught rather than averaged away.
    base = format_spec.build_prompt(brandkit.load(APPROVED["brand"]))
    missed = []
    for needle in format_spec.REQUIRED_CLAUSES:
        # Every occurrence, not the first: several clauses are stated more than once on purpose,
        # and deleting one copy leaves the lint satisfied. Removing one copy of "on that same
        # corner" is exactly the seed-4804 failure, and the first version of this test passed it.
        holed = _strip_all(base, needle)
        if not format_spec.lint(holed):
            missed.append(needle)
    ok(f"all {len(format_spec.REQUIRED_CLAUSES)} clauses are individually load-bearing",
       not missed, f"lint still passed without: {missed}")
    # And the per-shot count, which is not a substring test: leave the clause in the prompt but
    # take it out of ONE shot. This is the seed-4804 shape and a find() lint cannot see it.
    for needle in format_spec.REQUIRED_PER_SHOT:
        shots = format_spec.split_shots(base)
        holed = base.replace(shots[1], _strip_all(shots[1], needle), 1)
        problems = format_spec.lint(holed)
        ok(f"the lint rejects a prompt where shot 2 alone drops {needle!r}", bool(problems),
           "; ".join(problems)[:160])
        ok(f"{needle!r} is still elsewhere in that prompt, so a substring lint would pass it",
           needle in holed.lower())
    for word in ("cinematic", "shallow depth of field"):
        ok(f"the lint rejects {word!r}", bool(format_spec.lint(base + " " + word)))

    # And the same falsification for the additive grammars, one clause at a time. PACE_BLOCK was
    # deleted at seed 4812 and nobody noticed for four seeds, precisely because its clauses were
    # not in any list the lint read. Being in a list is only half of it: the list has to be
    # proved load-bearing, or it is the `check_realism()` shape again -- present, documented,
    # and unable to fail.
    print("\n5. the lint rejects a prompt with an additive-grammar clause removed")
    ALL = dict(pace=True, guards=True, mic=True, plain=True)
    both = format_spec.build_prompt(brandkit.load(APPROVED["brand"]), **ALL)
    for label, clauses in (("pace", format_spec.PACE_CLAUSES),
                           ("guard", format_spec.GUARD_CLAUSES),
                           ("mic", format_spec.MIC_CLAUSES),
                           ("plain", format_spec.PLAIN_CLAUSES)):
        missed = [n for n in clauses
                  if not format_spec.lint(_strip_all(both, n), **ALL)]
        ok(f"all {len(clauses)} {label} clauses are individually load-bearing", not missed,
           f"lint still passed without: {missed}")
        # ...and that they are only checked when the grammar is ON, which is what "additive"
        # means. A prompt with no pace grammar must NOT fail for missing pace clauses.
        ok(f"{label} clauses are not demanded of a prompt built without them",
           not format_spec.lint(base))
    # answers_only needs a config whose shot 1 is `handover_cold`, so it is falsified against
    # one. Without this it would be the only grammar in the file whose clauses were never proved
    # load-bearing, which is the PACE_BLOCK shape exactly: in a list, and never checked.
    cold = next((s for s in brands
                 if brandkit.load(s)["shots"][0]["kind"] == "handover_cold"), None)
    if cold:
        AO = dict(ALL, answers_only=True)
        ao = format_spec.build_prompt(brandkit.load(cold), **AO)
        missed = [n for n in format_spec.ANSWERS_CLAUSES
                  if not format_spec.lint(_strip_all(ao, n), **AO)]
        ok(f"all {len(format_spec.ANSWERS_CLAUSES)} answers_only clauses are load-bearing "
           f"(on {cold})", not missed, f"lint still passed without: {missed}")
        # ...and the base REQUIRED_CLAUSE that `handover_first` normally supplies is supplied by
        # ANSWERS_ONLY instead, not quietly dropped. An answers-only take needs it MORE: the
        # question is the obvious thing to put in a stranger's mouth once nobody else says it.
        ok("an answers-only prompt still carries \"does not say this line\"",
           "does not say this line" in ao.lower())
        ok("...and the lint fails when it is removed",
           bool(format_spec.lint(_strip_all(ao, "does not say this line"), **AO)))
        ok(f"{cold}: the interviewer's question text is absent from every shot",
           not any(brandkit.load(cold)["question"].lower() in s.lower()
                   for s in format_spec.split_shots(ao)))
    else:
        ok("a `handover_cold` config exists to falsify the answers_only clauses against", False,
           "no brand config uses handover_cold, so ANSWERS_CLAUSES is never proved load-bearing")
    # The can grammar, same treatment. It needs a config carrying `product.size`, so it is
    # falsified against the first config that declares it rather than against the approved one.
    canned = next((s for s in brands
                   if brandkit.load(s)["generation"].get("can_grammar")), None)
    if canned:
        ccfg = brandkit.load(canned)
        CG = dict(_declared(ccfg))
        cp = format_spec.build_prompt(ccfg, **CG)
        missed = [n for n in format_spec.CAN_CLAUSES
                  if not format_spec.lint(_strip_all(cp, n), **CG)]
        ok(f"all {len(format_spec.CAN_CLAUSES)} can clauses are load-bearing (on {canned})",
           not missed, f"lint still passed without: {missed}")
        # The can grammar REPLACES the two statements it supersedes rather than adding to them.
        # Two size statements about one object are worse than either (Critical knowledge 18), and
        # so are two statements about its state: "every can is already open" sitting next to
        # "every can is closed and sealed" is the model being asked to resolve an argument.
        ok("the superseded size phrase is gone", "same size and shape in every frame"
           not in cp.lower())
        ok("the superseded 'already open' wording is gone", "already open" not in cp.lower())
        ok("...and the no-opening required clause survives the replacement",
           "nobody opens a" in cp.lower() and not format_spec.lint(cp, **CG))
        # The whole point of the sealed grammar is that it does NOT reintroduce seed 4806's
        # unrenderable action. Assert it by looking for the request, not by trusting the comment.
        for banned in ("pulls the tab", "pulling the tab", "pulls the ring pull",
                       "hooks a finger under"):
            ok(f"the prompt never asks for {banned!r}", banned not in cp.lower())
    else:
        ok("a can_grammar config exists to falsify CAN_CLAUSES against", False,
           "no brand config sets can_grammar, so CAN_CLAUSES is never proved load-bearing")
    # mic_ref, same treatment, and with one extra assertion that is the whole reason it needs
    # one. mic_ref DELETES the mic description paragraph, and that paragraph turned out to be
    # the only place the REQUIRED_CLAUSE "is in the same place in every shot" was ever written
    # -- the product paragraph says "IS HELD IN THE SAME PLACE", which does not match the
    # needle. The lint caught it on the first dry run, for free, before a $3.64 call. This test
    # is what stops it coming back the next time someone trims that block.
    micref = next((s for s in brands
                   if brandkit.load(s)["generation"].get("mic_ref_grammar")), None)
    if micref:
        mcfg = brandkit.load(micref)
        MG = dict(_declared(mcfg))
        mp = format_spec.build_prompt(mcfg, **MG)
        missed = [n for n in format_spec.MIC_REF_CLAUSES
                  if not format_spec.lint(_strip_all(mp, n), **MG)]
        ok(f"all {len(format_spec.MIC_REF_CLAUSES)} mic_ref clauses are load-bearing "
           f"(on {micref})", not missed, f"lint still passed without: {missed}")
        ok("mic_ref still supplies the base clause the deleted paragraph used to write",
           "is in the same place in every shot" in mp.lower())
        ok("...and the lint fails when it is removed",
           bool(format_spec.lint(_strip_all(mp, "is in the same place in every shot"), **MG)))
        # The point of mic_ref is that the description and its negations are GONE. Assert the
        # absence, not the intent: seed 4824 proved the negations do not work, so carrying them
        # alongside the reference would be paying words for nothing.
        for gone in ("foam windscreen", "no branding or logo flag", "fluffy grey windshield",
                     "no taller than the speaker's head is wide"):
            ok(f"the mic description phrase {gone!r} is gone", gone not in mp.lower())
        # MIC_SCALE's clauses are demanded only when MIC_SCALE is actually written. Making
        # mic_ref optional must not mean the OTHER grammars' clauses stopped being checked.
        ok("MIC_SCALE clauses are still demanded of a paced prompt WITHOUT mic_ref",
           bool(format_spec.lint(mp, **dict(MG, mic_ref=False))))
        ok("mic and mic_ref together are refused by the lint",
           bool(format_spec.lint(mp, **dict(MG, mic=True))))
    # The upright grammar, and the assertion that matters most is the ABSENCE one: this grammar
    # exists to delete "takes it and looks at it", which was the single instruction causing the
    # label to turn away, the lid to face the lens and the can to read short. A clause list
    # cannot see a deletion, so the deletion is asserted directly.
    upr = next((s for s in brands
                if brandkit.load(s)["generation"].get("upright_grammar")), None)
    if upr:
        ucfg = brandkit.load(upr)
        UG = dict(_declared(ucfg))
        up = format_spec.build_prompt(ucfg, **UG)
        missed = [n for n in format_spec.UPRIGHT_CLAUSES
                  if not format_spec.lint(_strip_all(up, n), **UG)]
        ok(f"all {len(format_spec.UPRIGHT_CLAUSES)} upright clauses are load-bearing (on {upr})",
           not missed, f"lint still passed without: {missed}")
        for gone in ("looks at it", "turns it over", "reads the label", "sniffs it",
                     "examines it"):
            ok(f"no shot tells anyone to {gone!r}", gone not in up.lower())
        # The per-shot needles are COUNTED per shot, not found once. Falsify by holing exactly
        # one shot, which is the seed-4804 shape: the phrase is still in the prompt and the take
        # is still wrong.
        ushots = format_spec.split_shots(up)
        for needle in format_spec.UPRIGHT_PER_SHOT:
            ok(f"every one of the {len(ushots)} shots restates {needle!r}",
               all(needle in s.lower() for s in ushots))
            # Case-INSENSITIVE removal. The first version used str.replace with the lowercase
            # needle, and the shot text writes "UPRIGHT" in capitals, so it removed nothing and
            # then reported the check as dead. That is the falsify-all lesson exactly: a plant
            # that does not actually violate the rule proves nothing about the check.
            holed = up.replace(ushots[1], _strip_all(ushots[1], needle), 1)
            ok(f"...and the lint fails when shot 2 alone drops {needle!r}",
               bool(format_spec.lint(holed, **UG)))
        # UPRIGHT supersedes the guards' LABEL_FACING. The guard's needle must survive, or
        # making one grammar optional has quietly stopped another being checked.
        ok("the guards' label needle survives the supersession",
           "front label is turned toward the lens" in up.lower())
        ok("...and LABEL_FACING's own sentence is not ALSO in the prompt",
           "whenever the can is visible its front label" not in up.lower())
        # The can grammar's two halves are independent: this config buys SIZE without SEALED.
        ok("can_size without can_sealed keeps the real-size rule",
           "always its real size" in up.lower())
        ok("...and does not ask for a sealed can", "closed, sealed and unopened" not in up.lower())
        ok("...and still carries the no-opening required clause", "nobody opens a" in up.lower())
    else:
        ok("an upright_grammar config exists to falsify UPRIGHT_CLAUSES against", False,
           "no brand config sets upright_grammar, so UPRIGHT_CLAUSES is never proved "
           "load-bearing")
    if not micref:
        ok("a mic_ref_grammar config exists to falsify MIC_REF_CLAUSES against", False,
           "no brand config sets mic_ref_grammar, so MIC_REF_CLAUSES is never proved "
           "load-bearing")

    print("\n6. the config validator refuses the contradictions")
    import copy
    c = copy.deepcopy(brandkit.load(APPROVED["brand"]))
    c["generation"]["answers_only"] = True          # shot 1 is still handover_first
    ok("answers_only with a `handover_first` shot is refused",
       _refuses(c), "the prompt would forbid the question and script it in the same breath")
    c2 = copy.deepcopy(brandkit.load(APPROVED["brand"]))
    c2["shots"][0]["kind"] = "handover_cold"        # standalone video, nobody asks
    ok("a standalone video whose shot 1 is `handover_cold` is refused",
       _refuses(c2), "a vox pop with no question is not one")

    print()
    if fails:
        print("FAIL")
        for f in fails:
            print("  - " + f)
        return 1
    print("PASS  the format survives the split, and the lint can fail")
    return 0


if __name__ == "__main__":
    sys.exit(main())

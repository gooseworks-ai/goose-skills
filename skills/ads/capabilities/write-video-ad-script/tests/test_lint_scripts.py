"""Tests for lint_scripts.py.

Run: python3 -m pytest tests/   (standard library + pytest; no network)
Each test plants one defect in an otherwise clean script and checks the code it raises.
"""
import copy
import json
import os
import subprocess
import sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "scripts"))

import lint_scripts as ls  # noqa: E402

SCRIPT = os.path.join(os.path.dirname(__file__), "..", "scripts", "lint_scripts.py")

SHAPE = {
    "format": "ugc-talking-head",
    "words_per_second": 3.0,
    "total_seconds": 20,
    "cta_beat": "cta",
    "beats": [
        {"id": "hook", "seconds": 3, "kind": "spoken"},
        {"id": "pain", "seconds": 5, "kind": "spoken"},
        {"id": "proof", "seconds": 7, "kind": "spoken"},
        {"id": "cta", "seconds": 4, "kind": "spoken"},
    ],
}
RULES = {
    "name": "Driftwell",
    "never_say": [{"text": "Never claim it cures insomnia"}, {"text": "Never use red in the background"}],
    "products": [{"name": "Driftwell Sleep Mist", "facts": ["30 ml bottle", "lavender and magnesium", "$24"]}],
}
BANK = {"quotes": [
    {"id": "q1", "text": "I was waking up at 3am every single night and staring at the ceiling", "source": "https://example.com/r/1"},
    {"id": "q2", "text": "the smell is calm, not fake spa lavender", "source": "https://example.com/r/2"},
]}
GOOD = {"concepts": [{
    "id": "c1", "angle": "3am wake-ups", "quote_ids": ["q1"],
    "hooks": [
        {"id": "c1h1", "family": "confession", "text": "I was waking up at 3am every single night."},
        {"id": "c1h2", "family": "named-enemy", "text": "The 3am ceiling stare. I'm done with it."},
    ],
    "beats": [
        {"id": "hook", "text": "I was waking up at 3am every single night."},
        {"id": "pain", "text": "Just lying there, staring at the ceiling, doing math on how tired I'd be."},
        {"id": "proof", "text": "Two sprays on the pillow. Lavender and magnesium. I don't remember the ceiling anymore."},
        {"id": "cta", "text": "It's twenty-four bucks. Link's below."},
    ],
}]}


def codes(rep, cid="c1", kind="errors"):
    return [x["code"] for x in next(c for c in rep["concepts"] if c["id"] == cid)[kind]]


def run(cands, shape=SHAPE, rules=RULES, bank=BANK):
    return ls.lint(cands, shape, rules, bank)


def test_clean_script_passes():
    rep = run(GOOD)
    assert rep["ok"], rep
    assert codes(rep) == []
    assert "W_NOT_THEIR_WORDS" not in codes(rep, kind="warnings")
    assert "W_UNSOURCED_NUMBER" not in codes(rep, kind="warnings")  # 3 comes from the quote


def test_dead_opener_is_an_error():
    c = copy.deepcopy(GOOD)
    c["concepts"][0]["hooks"][0]["text"] = "Introducing the mist that fixes your nights."
    assert "E_DEAD_OPENER" in codes(run(c))
    c["concepts"][0]["hooks"][0]["text"] = "Have you ever woken up at 3am?"
    assert "E_DEAD_OPENER" in codes(run(c))


def test_specific_question_is_only_a_warning():
    c = copy.deepcopy(GOOD)
    c["concepts"][0]["hooks"][0]["text"] = "Why do I wake up at exactly 3am?"
    rep = run(c)
    assert "E_DEAD_OPENER" not in codes(rep)
    assert "W_QUESTION_HOOK" in codes(rep, kind="warnings")


def test_over_budget_beat_is_an_error():
    c = copy.deepcopy(GOOD)
    c["concepts"][0]["beats"][1]["text"] = " ".join(["word"] * 30)
    assert "E_BUDGET" in codes(run(c))


def test_missing_beat_and_cta_not_last():
    c = copy.deepcopy(GOOD)
    beats = c["concepts"][0]["beats"]
    beats.append(beats.pop(0))  # hook moved after the CTA
    rep = run(c)
    assert "E_CTA_NOT_LAST" in codes(rep)
    c2 = copy.deepcopy(GOOD)
    c2["concepts"][0]["beats"].pop(2)
    assert "E_BEAT_MISSING" in codes(run(c2))


def test_never_say_claim_is_a_warning_in_any_word_form_and_visual_rule_is_ignored():
    for line in ("Honestly it cured my insomnia in a week.", "This will cure your insomnia.",
                 "It's the cure for my insomnia."):
        c = copy.deepcopy(GOOD)
        c["concepts"][0]["beats"][2]["text"] = line
        rep = run(c)
        assert "W_NEVER_SAY" in codes(rep, kind="warnings"), line
        assert "E_NEVER_SAY" not in codes(rep), line  # wording rules warn; a human decides
    c2 = copy.deepcopy(GOOD)
    c2["concepts"][0]["beats"][1]["text"] = "Lying there in my red hoodie, staring at the ceiling."
    assert "W_NEVER_SAY" not in codes(run(c2), kind="warnings")


def with_rule(text, line, beat=2):
    c = copy.deepcopy(GOOD)
    c["concepts"][0]["beats"][beat]["text"] = line
    return run(c, rules=dict(RULES, never_say=[{"text": text}]))


def test_apostrophes_are_not_quote_marks_and_quoted_phrases_are_errors():
    rep = with_rule("Don't say it's a cure", "Two sprays and it's a cure. Lavender and magnesium.")
    assert "W_NEVER_SAY" in codes(rep, kind="warnings")      # the claim check still runs
    rep = with_rule("We don't say 'cure'", "Two sprays and it cured my nights. Lavender and magnesium.")
    assert "E_NEVER_SAY" in codes(rep)                        # quoted word, any word form
    rep = with_rule('Don\'t use the word "natural"', "All natural. Lavender and magnesium.")
    assert "E_NEVER_SAY" in codes(rep)
    rep = with_rule("Claims: never say it cures insomnia", "It cures insomnia, honestly.")
    assert "W_NEVER_SAY" in codes(rep, kind="warnings")      # "never say" stripped after the colon


def test_never_say_does_not_block_an_innocent_persona_line():
    rep = with_rule("Never claim it works overnight", "I work overnights in the ER, so sleep is a joke.", beat=1)
    assert rep["ok"], rep                                     # a warning to read, never a block


def test_customer_words_required_when_a_bank_exists():
    c = copy.deepcopy(GOOD)
    c["concepts"][0]["quote_ids"] = []
    assert "E_NO_QUOTE" in codes(run(c))
    c["concepts"][0]["quote_ids"] = ["q9"]
    assert "E_BAD_QUOTE_ID" in codes(run(c))
    rep = run(GOOD, bank=None)
    assert rep["ok"]
    assert "W_NO_CUSTOMER_WORDS" in codes(rep, kind="warnings")


def test_not_their_words_warning():
    c = copy.deepcopy(GOOD)
    c["concepts"][0]["quote_ids"] = ["q2"]  # cites the smell quote, never uses its wording
    assert "W_NOT_THEIR_WORDS" in codes(run(c), kind="warnings")


def test_ai_tells_stiffness_and_unsourced_numbers_warn():
    c = copy.deepcopy(GOOD)
    c["concepts"][0]["beats"][2]["text"] = (
        "It's not a spray, it's a ritual. I do not miss those nights. 87% of people slept better.")
    w = codes(run(c), kind="warnings")
    assert "W_AI_TELL" in w
    assert "W_STIFF" in w
    assert "W_UNSOURCED_NUMBER" in w


def test_brand_first_and_duplicate_hooks():
    c = copy.deepcopy(GOOD)
    c["concepts"][0]["hooks"][1]["text"] = "Driftwell fixed my 3am wake-ups."
    c["concepts"].append(copy.deepcopy(c["concepts"][0]))
    c["concepts"][1]["id"] = "c2"
    rep = run(c)
    assert "W_BRAND_FIRST" in codes(rep, kind="warnings")
    assert any(w["code"] == "W_DUP_HOOK" for w in rep["set_warnings"])


def test_cli_exit_codes(tmp_path):
    bad = copy.deepcopy(GOOD)
    bad["concepts"][0]["hooks"][0]["text"] = "Introducing Driftwell."
    files = {}
    for name, data in (("c.json", bad), ("s.json", SHAPE), ("r.json", RULES), ("b.json", BANK)):
        p = tmp_path / name
        p.write_text(json.dumps(data))
        files[name] = str(p)
    base = [sys.executable, SCRIPT, "--candidates", files["c.json"], "--shape", files["s.json"],
            "--rules", files["r.json"], "--customer-words", files["b.json"], "--out", str(tmp_path / "lint.json")]
    assert subprocess.run(base, capture_output=True).returncode == 2
    assert subprocess.run(base + ["--report-only"], capture_output=True).returncode == 0
    assert json.loads((tmp_path / "lint.json").read_text())["ok"] is False


def test_end_card_after_the_cta_is_fine_but_speech_after_it_is_not():
    shape = copy.deepcopy(SHAPE)
    shape["beats"].append({"id": "endcard", "kind": "on_screen", "max_words": 6})
    c = copy.deepcopy(GOOD)
    c["concepts"][0]["beats"].append({"id": "endcard", "text": "Driftwell Sleep Mist"})
    assert "E_CTA_NOT_LAST" not in codes(run(c, shape=shape))
    shape["beats"].append({"id": "outro", "kind": "spoken", "seconds": 2, "optional": True})
    c["concepts"][0]["beats"].append({"id": "outro", "text": "Seriously, go get it."})
    assert "E_CTA_NOT_LAST" in codes(run(c, shape=shape))


def test_beats_out_of_order():
    c = copy.deepcopy(GOOD)
    b = c["concepts"][0]["beats"]
    b[1], b[2] = b[2], b[1]
    assert "E_BEAT_ORDER" in codes(run(c))


def test_openers_are_judged_by_where_they_are_said():
    shape = copy.deepcopy(SHAPE)
    shape["beats"][0]["kind"] = "bubble"
    c = copy.deepcopy(GOOD)
    c["concepts"][0]["hooks"][0]["text"] = "Did you know Sam's been up at 3am again"
    assert "E_DEAD_OPENER" not in codes(run(c, shape=shape))   # a chat message, not an ad voice
    for line, soft in (("Looking for my glasses at 3am.", False), ("Meet my roommate.", True),
                       ("Imagine Dragons was blasting at 3am.", True), ("Looking for a better sleep spray?", True)):
        c = copy.deepcopy(GOOD)
        c["concepts"][0]["hooks"][0]["text"] = line
        rep = run(c)
        assert "E_DEAD_OPENER" not in codes(rep), line          # a real line is never blocked
        assert ("W_SOFT_OPENER" in codes(rep, kind="warnings")) == soft, line


def test_null_text_and_bare_list_do_not_crash():
    c = copy.deepcopy(GOOD)
    c["concepts"][0]["beats"].append({"id": "card", "text": None})
    run(c)
    rep = run(copy.deepcopy(GOOD["concepts"]))
    assert rep["ok"]


def test_curly_apostrophes_brand_case_and_shape_numbers():
    c = copy.deepcopy(GOOD)
    c["concepts"][0]["beats"][2]["text"] = "It’s not a spray, it’s a ritual. Lavender and magnesium."
    assert "W_AI_TELL" in codes(run(c), kind="warnings")
    c = copy.deepcopy(GOOD)
    c["concepts"][0]["hooks"][0]["text"] = "I couldn't calm down at 3am."
    assert "W_BRAND_FIRST" not in codes(run(c, rules=dict(RULES, name="Calm")), kind="warnings")
    c = copy.deepcopy(GOOD)
    c["concepts"][0]["beats"][2]["text"] = "Asleep in 7 minutes. Lavender and magnesium."
    assert "W_UNSOURCED_NUMBER" in codes(run(c), kind="warnings")  # 7 is only a beat length


def test_report_only_skips_quote_checks():
    c = copy.deepcopy(GOOD)
    c["concepts"][0]["quote_ids"] = []
    rep = ls.lint(c, SHAPE, RULES, BANK, report_only=True)
    assert "E_NO_QUOTE" not in codes(rep)


def test_quoted_phrase_matches_word_forms_not_lookalikes():
    for rule, line, hit in (('Never say "fat"', "It felt like fate. Lavender and magnesium.", False),
                            ('Never say "cut"', "The bottle is so cute. Lavender and magnesium.", False),
                            ('Never say "car"', "I take care of everyone. Lavender and magnesium.", False),
                            ('Never say "natural"', "It's naturally calming. Lavender and magnesium.", True),
                            ('Never say "cure"', "It cured my nights. Lavender and magnesium.", True),
                            ('Never say "cut"', "Cutting caffeine didn't help. Lavender and magnesium.", True)):
        rep = with_rule(rule, line)
        assert ("E_NEVER_SAY" in codes(rep)) == hit, (rule, line)


def test_repeated_beat_ids_in_a_chat_shape():
    shape = {"words_per_second": 3.0, "cta_beat": "cta", "beats": [
        {"id": "them", "kind": "bubble", "max_words": 12}, {"id": "me", "kind": "bubble", "max_words": 12},
        {"id": "them", "kind": "bubble", "max_words": 12}, {"id": "me", "kind": "bubble", "max_words": 12},
        {"id": "cta", "kind": "on_screen", "max_words": 6}]}
    c = {"concepts": [{"id": "c1", "quote_ids": ["q1"], "hooks": [], "beats": [
        {"id": "them", "text": "you up? it's 3am again"}, {"id": "me", "text": "staring at the ceiling, every single night"},
        {"id": "them", "text": "try the lavender mist"}, {"id": "me", "text": "ok ordering it"},
        {"id": "cta", "text": "Driftwell Sleep Mist"}]}]}
    rep = run(c, shape=shape)
    assert "E_BEAT_ORDER" not in codes(rep), rep
    c["concepts"][0]["beats"].insert(0, c["concepts"][0]["beats"].pop(4))  # CTA first
    assert "E_BEAT_ORDER" in codes(run(c, shape=shape))


# Hook-first checks. Each new code has one fixture that fires it and one clean fixture.

def opened(on_screen="3am. Again.", picture="Creator awake in bed at 3am, staring at the ceiling"):
    c = copy.deepcopy(GOOD)
    c["concepts"][0]["beats"][0]["on_screen"] = on_screen
    c["concepts"][0]["beats"][0]["visual"] = {"description": picture, "mode": "text"}
    return c


def warns(rep, cid="c1"):
    return codes(rep, cid, kind="warnings")


def test_clean_opening_has_none_of_the_hook_warnings():
    w = warns(run(opened()))
    for code in ("W_TIRED_OF_LIST", "W_FEATURE_STACK", "W_BEAT1_NO_TEXT", "W_PICTURE_HOOK_MISMATCH",
                 "W_ON_SCREEN_LONG", "W_ANGLE_TYPE"):
        assert code not in w, code


def test_tired_of_list_opener_warns():
    c = opened()
    c["concepts"][0]["hooks"][0]["text"] = "Tired of the noise, the light and the 3am alarms."
    rep = run(c)
    assert "W_TIRED_OF_LIST" in warns(rep)
    assert "E_DEAD_OPENER" not in codes(rep)          # no question mark: a warning, not a dead opener
    c["concepts"][0]["hooks"][0]["text"] = "Tired of waking at 3am?"
    assert "E_DEAD_OPENER" in codes(run(c))           # the question form stays an error
    assert "W_TIRED_OF_LIST" not in warns(run(opened()))


def test_feature_stack_warns_on_facts_or_a_list_in_the_body():
    c = opened()
    c["concepts"][0]["beats"][2]["text"] = "A 30 ml bottle. Lavender and magnesium. All for $24."
    assert "W_FEATURE_STACK" in warns(run(c))         # three product facts in the body
    c = opened()
    c["concepts"][0]["beats"][1]["text"] = "The cap, the strap and the lid all click shut."
    assert "W_FEATURE_STACK" in warns(run(c))         # a list of three in one line
    assert "W_FEATURE_STACK" not in warns(run(opened()))  # one fact, shown


def test_spoken_opening_without_on_screen_words_warns():
    assert "W_BEAT1_NO_TEXT" in warns(run(opened(on_screen="")))
    assert "W_BEAT1_NO_TEXT" not in warns(run(opened()))
    shape = dict(SHAPE, words_on_screen="none")
    assert "W_BEAT1_NO_TEXT" not in warns(run(opened(on_screen=""), shape=shape))


def test_picture_that_shares_nothing_with_the_hook_warns():
    assert "W_PICTURE_HOOK_MISMATCH" in warns(run(opened(picture="A bottle on a white table, soft light")))
    assert "W_PICTURE_HOOK_MISMATCH" not in warns(run(opened()))


def test_on_screen_words_must_fit_read_time():
    rep = run(opened(on_screen="Up at 3am every single night, staring at the ceiling"))
    assert "W_ON_SCREEN_LONG" in warns(rep)           # 10 words in the opening beat
    c = opened()
    c["concepts"][0]["beats"][1]["on_screen"] = " ".join(["ceiling"] * 14)
    assert "W_ON_SCREEN_LONG" in warns(run(c))        # 14 words in a later beat
    c["concepts"][0]["beats"][1]["on_screen"] = " ".join(["ceiling"] * 13)
    assert "W_ON_SCREEN_LONG" not in warns(run(c))


def test_angle_type_must_be_on_the_list():
    c = opened()
    c["concepts"][0]["angle_type"] = "pain"
    assert "W_ANGLE_TYPE" in warns(run(c))
    c["concepts"][0]["angle_type"] = "problem_fix"
    assert "W_ANGLE_TYPE" not in warns(run(c))


FIVE_OPENINGS = [
    ("story", "Last winter my roommate found me awake at 3am."),
    ("curiosity", "One thing on my pillow ended the ceiling stare."),
    ("problem_fix", "Staring at the ceiling every single night? Two sprays."),
    ("demo", "Watch me spray this before lights out."),
    ("proof", "Lavender and magnesium, and nothing else in the bottle."),
]


def five_concepts():
    out = {"concepts": []}
    for n, (angle_type, line) in enumerate(FIVE_OPENINGS, 1):
        c = copy.deepcopy(opened()["concepts"][0])
        c["id"], c["angle_type"] = f"c{n}", angle_type
        c["hooks"] = [{"id": f"c{n}h1", "family": "confession", "text": line}]
        c["beats"][0]["text"] = line
        c["beats"][0]["on_screen"] = ""
        out["concepts"].append(c)
    return out


def test_five_distinct_concepts_pass_the_sameness_check():
    rep = run(five_concepts())
    assert rep["set_errors"] == [], rep["set_errors"]
    assert rep["ok"], rep


def test_mixed_duplicate_angle_types_are_a_set_error():
    c = five_concepts()
    c["concepts"][3]["angle_type"] = "story"
    rep = run(c)
    assert [e["code"] for e in rep["set_errors"]] == ["E_SAME_ANGLE"]
    assert "c1, c4" in rep["set_errors"][0]["msg"]
    assert not rep["ok"]


def test_selected_angle_flow_with_five_executions_of_one_type_passes():
    c = five_concepts()
    families = ["confession", "relatable-moment", "demo-first", "result-first", "cold-open"]
    for concept, family in zip(c["concepts"], families):
        concept["angle_type"] = "problem_fix"
        concept["hooks"][0]["family"] = family
    rep = run(c)
    assert rep["set_errors"] == [] and rep["ok"], rep["set_errors"]


def test_openings_that_share_the_angle_words_do_not_error():
    lines = ["3am wake-ups ruined my sleep schedule.", "My 3am wake-ups stopped after one sleep trick.",
             "Watch me fix 3am wake-ups.", "Proof: no 3am wake-ups in a month.", "Old me: 3am wake-ups. New me: asleep."]
    c = five_concepts()
    for concept, line in zip(c["concepts"], lines):
        concept["beats"][0]["text"] = concept["hooks"][0]["text"] = line
        concept["beats"][0]["on_screen"] = "Driftwell Sleep Mist"   # a fixed brand line on screen
    rep = run(c)
    assert rep["set_errors"] == [] and rep["ok"], rep["set_errors"]
    assert not any(w["code"] == "W_SIMILAR_OPENING" for w in rep["set_warnings"]), rep["set_warnings"]


def test_a_near_copy_opening_warns_but_does_not_fail(tmp_path):
    c = five_concepts()
    c["concepts"][1]["beats"][0]["text"] = "Last winter my roommate caught me awake again."
    rep = run(c)
    assert rep["set_errors"] == [] and rep["ok"]
    similar = [w for w in rep["set_warnings"] if w["code"] == "W_SIMILAR_OPENING"]
    assert len(similar) == 1 and "c1 and c2" in similar[0]["msg"]


def test_a_users_own_variants_never_error_on_sameness():
    c = five_concepts()
    c["concepts"][3]["angle_type"] = "story"
    rep = ls.lint(c, SHAPE, RULES, BANK, report_only=True)
    assert rep["set_errors"] == []
    assert any(w["code"] == "W_SAME_ANGLE" for w in rep["set_warnings"])


def test_mixed_angle_types_fail_the_cli(tmp_path):
    c = five_concepts()
    c["concepts"][3]["angle_type"] = "story"
    files = {}
    for name, data in (("c.json", c), ("s.json", SHAPE), ("r.json", RULES), ("b.json", BANK)):
        (tmp_path / name).write_text(json.dumps(data))
        files[name] = str(tmp_path / name)
    out = subprocess.run([sys.executable, SCRIPT, "--candidates", files["c.json"], "--shape", files["s.json"],
                          "--rules", files["r.json"], "--customer-words", files["b.json"],
                          "--out", str(tmp_path / "lint.json")], capture_output=True, text=True)
    assert out.returncode == 2 and "E_SAME_ANGLE" in out.stdout


def test_facts_that_only_share_the_product_name_are_not_a_stack():
    rules = dict(RULES, products=[{"name": "Driftwell Sleep Mist", "facts": [
        "Driftwell Sleep Mist is a 30 ml bottle", "Driftwell Sleep Mist contains lavender",
        "Driftwell Sleep Mist contains magnesium", "Driftwell Sleep Mist costs 24"]}])
    c = opened()
    c["concepts"][0]["beats"][2]["text"] = "Two sprays of Driftwell Sleep Mist on the pillow. I sleep now."
    assert "W_FEATURE_STACK" not in warns(run(c, rules=rules))


def test_a_non_string_picture_does_not_crash():
    c = opened()
    c["concepts"][0]["beats"][0]["visual"]["description"] = ["a", "b"]
    rep = run(c)
    assert "W_PICTURE_HOOK_MISMATCH" not in warns(rep)


# Sound like a person (references/voice.md). The bad lines are a real 14 Oct customer run;
# the good ones are the same ad rewritten the way a person would say it.
CUMIN_SHAPE = {
    "format": "ugc-product", "words_per_second": 3.0, "total_seconds": 22, "cta_beat": "cta",
    "beats": [{"id": "hook", "seconds": 5}, {"id": "make", "seconds": 5}, {"id": "serve", "seconds": 5},
              {"id": "payoff", "seconds": 4}, {"id": "cta", "seconds": 3}],
}
CUMIN_RULES = {"name": "The Cumin Club", "products": [{"name": "Paneer Tikka Masala", "facts": [
    "the curry comes ready-made", "cook the paneer in boiling water", "about five minutes", "serve with rice"]}]}
CUMIN_BAD = [
    "Tonight, I want curry worth sitting down for.",
    "Look at those paneer cubes. That rich, creamy sauce.",
    "Boil water. Cook the paneer. Turn off the heat.",
    "That's the night I wanted.",
    "Build your box at The Cumin Club.",
]
CUMIN_GOOD = [
    "I've been passing off this paneer tikka masala as homemade, and nobody's caught on yet.",
    "The curry comes ready from The Cumin Club, so I just cook the paneer,",
    "stir the curry through, and five minutes later it's on the table with rice",
    "like I spent the whole evening at the stove.",
    "Build your box before your friends work it out.",
]
VOICE_CODES = ("W_FRAGMENT_CHAIN", "W_STEPS_ALOUD", "W_MOOD_OPENER", "W_AD_SPEAK")


def cumin(lines, hooks=(), shape=CUMIN_SHAPE):
    beats = [{"id": sb["id"], "text": line} for sb, line in zip(shape["beats"], lines)]
    concept = {"id": "c1", "angle": "passing it off as homemade", "beats": beats,
               "hooks": [{"id": f"c1h{n}", "family": "confession", "text": t} for n, t in enumerate(hooks, 1)]}
    rep = ls.lint({"concepts": [concept]}, shape, CUMIN_RULES)
    return [w for w in rep["concepts"][0]["warnings"] if w["code"] in VOICE_CODES]


def voice(found, code):
    return [w for w in found if w["code"] == code]


def test_the_good_rewrite_raises_no_voice_warning():
    assert cumin(CUMIN_GOOD, hooks=[CUMIN_GOOD[0]]) == []


def test_clipped_fragments_across_scenes_fire():
    [w] = voice(cumin(CUMIN_BAD), "W_FRAGMENT_CHAIN")
    assert w["msg"] == ("Scenes 2-4 read as clipped fragments; "
                        "join them into sentences a person would say.")
    assert w["beat"] == "make"
    assert voice(cumin(CUMIN_GOOD), "W_FRAGMENT_CHAIN") == []


def test_a_sentence_can_run_across_two_scenes():
    # Three short beats that are one sentence, not three fragments.
    lines = list(CUMIN_GOOD)
    lines[1:4] = ["I cook the paneer,", "stir the curry in,", "and dinner is done in five minutes."]
    assert voice(cumin(lines), "W_FRAGMENT_CHAIN") == []


def test_steps_read_aloud_fire():
    [w] = voice(cumin(CUMIN_BAD), "W_STEPS_ALOUD")
    assert w["msg"] == ("Scene 3 reads steps aloud; show them on screen "
                        "and say what they mean for the viewer.")
    assert voice(cumin(CUMIN_GOOD), "W_STEPS_ALOUD") == []


def test_a_mood_opener_fires_on_scene_one_and_hooks():
    found = voice(cumin(CUMIN_BAD, hooks=["Craving curry tonight?", "Want curry tonight?",
                                          "I'm craving curry after a long day."]), "W_MOOD_OPENER")
    assert [w["beat"] for w in found] == ["hook", "hook c1h1", "hook c1h2", "hook c1h3"]
    assert found[0]["msg"] == ("Scene 1 states a mood; open on a confession, a surprise, "
                               "a specific moment or an opinion instead.")
    assert voice(cumin(CUMIN_GOOD, hooks=[CUMIN_GOOD[0]]), "W_MOOD_OPENER") == []


def test_ad_speak_fires_per_scene_with_the_phrase():
    found = voice(cumin(CUMIN_BAD), "W_AD_SPEAK")
    assert [w["msg"] for w in found] == [
        "Scene 2 uses ad-speak ('Look at those'); say it the way a customer would.",
        "Scene 4 uses ad-speak ('That's the night I wanted'); say it the way a customer would.",
    ]
    assert voice(cumin(CUMIN_GOOD), "W_AD_SPEAK") == []


def test_ad_speak_covers_on_screen_words_narration_and_the_old_ai_vocabulary():
    lines = list(CUMIN_GOOD)
    lines[1] = "Check out the paneer, it cooks in the curry pack while I set the table."
    lines[3] = "Honestly a game-changer for weeknights."
    rep = ls.lint({"concepts": [{"id": "c1", "beats": [
        dict({"id": sb["id"], "text": t}, **({"on_screen": "Irresistible curry"} if sb["id"] == "hook" else {}))
        for sb, t in zip(CUMIN_SHAPE["beats"], lines)]}]}, CUMIN_SHAPE, CUMIN_RULES)
    warns = rep["concepts"][0]["warnings"]
    msgs = [w["msg"] for w in warns if w["code"] == "W_AD_SPEAK"]
    assert msgs == ["Scene 1 uses ad-speak ('Irresistible'); say it the way a customer would.",
                    "Scene 2 uses ad-speak ('Check out'); say it the way a customer would.",
                    "Scene 4 uses ad-speak ('game-changer'); say it the way a customer would."]
    assert not any(w["code"] == "W_AI_TELL" for w in warns)   # one code, not two


def test_silent_styles_skip_the_spoken_checks_but_read_the_opening_card():
    shape = dict(CUMIN_SHAPE, speech="none")
    beats = [{"id": sb["id"], "text": t} for sb, t in zip(shape["beats"], CUMIN_BAD)]
    beats[0]["on_screen"] = "Tonight I need something cozy"
    rep = ls.lint({"concepts": [{"id": "c1", "beats": beats}]}, shape, CUMIN_RULES)
    found = [w["code"] for w in rep["concepts"][0]["warnings"]]
    assert "W_FRAGMENT_CHAIN" not in found and "W_STEPS_ALOUD" not in found
    assert "W_MOOD_OPENER" in found and "W_AD_SPEAK" in found


def test_a_status_update_opener_is_a_mood():
    for line in ("It's a work night and I'm having curry", "Home late from work and still had curry"):
        lines = [line + "."] + CUMIN_GOOD[1:]
        assert [w["beat"] for w in voice(cumin(lines, hooks=[line]), "W_MOOD_OPENER")] == ["hook", "hook c1h1"], line


def test_a_claim_or_a_fact_opener_is_not_a_mood():
    for line in ("Someone told me extra-virgin olive oil isn't for cooking",
                 "One olive is behind this whole bottle"):
        lines = [line + "."] + CUMIN_GOOD[1:]
        assert voice(cumin(lines, hooks=[line]), "W_MOOD_OPENER") == [], line


def test_text_only_on_the_end_card_skips_the_beat_one_text_check():
    assert "W_BEAT1_NO_TEXT" in warns(run(opened(on_screen="")))
    shape = dict(SHAPE, words_on_screen="end_card")
    assert "W_BEAT1_NO_TEXT" not in warns(run(opened(on_screen=""), shape=shape))
    c = opened(on_screen="")
    c["concepts"][0]["words_on_screen"] = "end_card"     # this concept's style only
    assert "W_BEAT1_NO_TEXT" not in warns(run(c))

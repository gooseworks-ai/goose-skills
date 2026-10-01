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

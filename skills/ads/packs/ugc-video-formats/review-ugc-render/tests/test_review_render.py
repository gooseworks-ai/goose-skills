"""Unit tests for the pre-publish review gate.

Run: python3 -m pytest tests/  (or) python3 tests/test_review_render.py
No real audio, network or paid call: review_transcript() is pure, and the CLI test
stubs out audio extraction and transcription.
"""
import json
import os
import sys
import tempfile

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "scripts"))

import review_render  # noqa: E402
from review_render import (  # noqa: E402
    build_aliases, load_pronunciations, parse_alias_arg, render_report, review_transcript, tokenize,
)


def _check(cases):
    """cases: (script, heard, kwargs, expect_pass). Fails with every wrong case listed."""
    wrong = []
    for script, heard, kw, expect in cases:
        v = review_transcript(script, heard, **kw)
        if v.passed != expect:
            wrong.append(f"{script!r} vs {heard!r} {kw}: expected {'PASS' if expect else 'FAIL'}, "
                         f"got ratio {v.ratio:.2f} {[(i.severity, i.script_text, i.heard_text) for i in v.issues]}")
    assert not wrong, "\n".join(wrong)


def _high(v):
    return [i for i in v.issues if i.severity == "high"]


# ── Original behaviour (kept) ───────────────────────────────────────────────
def test_tokenize_strips_punctuation_and_hyphens():
    assert tokenize("Human-Vetted, and DONE!") == ["human", "vetted", "and", "done"]


def test_exact_match_passes():
    script = "Okay real talk my agent does the grunt work now"
    v = review_transcript(script, script)
    assert v.passed
    assert v.ratio == 1.0
    assert not v.issues


def test_misvoiced_word_fails_high_severity():
    # The real defect: approved "vetted", Seedance audio said "witted".
    script = "Every lead is human-vetted before it reaches you"
    heard = "Every lead is human witted before it reaches you"
    v = review_transcript(script, heard)
    assert not v.passed, "a mis-voiced word must fail the gate"
    subs = [i for i in v.issues if i.kind == "substitution"]
    assert subs and subs[0].severity == "high"
    assert subs[0].script_words == ["vetted"] and subs[0].heard_words == ["witted"]


def test_minor_extra_filler_word_passes():
    script = "My campaigns are running and leads keep coming in"
    heard = "So my campaigns are running and leads keep coming in"  # benign leading filler
    v = review_transcript(script, heard)
    assert v.passed
    assert all(i.severity == "low" for i in v.issues)


def test_dropped_phrase_fails_on_ratio():
    script = "This quiet is the first time in months and it is still working for me"
    heard = "This quiet is the first time in months"  # whole tail dropped
    v = review_transcript(script, heard)
    assert not v.passed
    assert any(i.kind == "dropped" for i in v.issues)


def test_no_script_is_advisory_pass():
    v = review_transcript("", "anything at all")
    assert v.passed
    assert any(i.kind == "no_script" for i in v.issues)


def test_brand_name_misvoicing_flagged_high():
    # Classic Seedance brand mis-voicing (documented: Hume→Hune, Alitu→al-too).
    script = "Hume makes the band that reads your mood"
    heard = "Hune makes the band that reads your mood"
    v = review_transcript(script, heard)
    assert not v.passed
    assert v.issues[0].severity == "high"


# ── QA-71 audit fixture table (evidence/A07-audio-creator.md) ──────────────
# (script, heard, kwargs, expected verdict). Before this change every "True" row FAILED
# and the Hume→Hune row PASSED.
AUDIT_CASES = [
    ("Take 5mg daily", "Take five milligrams daily", {}, True),
    ("Visit braxleybands.com today", "Visit braxleybands dot com today", {}, True),
    ("Only 15 dollars", "Only fifteen dollars", {}, True),
    ("Get 30% off now", "Get thirty percent off now", {}, True),
    ("Don't miss it", "Do not miss it", {}, True),
    ("Meet Braxleybands today", "Meet Braxley Bands today", {"brand_terms": ["Braxleybands"]}, True),
    ("Meet Drinkag1 now", "Meet drink AG1 now", {"brand_terms": ["Drinkag1"]}, True),
    ("Hume makes the band", "Hune makes the band", {"brand_terms": ["Hume"]}, False),
    ("It costs 49 dollars", "It costs 59 dollars", {}, False),
    ("Visit braxleybands.com today", "Visit braxley bands dot com today", {}, True),
    ("Our bands never slip", "Our bands slip", {}, False),
]


def test_audit_fixture_table():
    _check(AUDIT_CASES)


def test_audit_failures_are_high_severity():
    for script, heard, kw, expect in AUDIT_CASES:
        if not expect:
            v = review_transcript(script, heard, **kw)
            assert _high(v), f"{script!r} vs {heard!r} must fail HIGH, got {v.issues}"


# ── Numbers ─────────────────────────────────────────────────────────────────
def test_number_words_equal_digits():
    _check([
        ("It costs 49 dollars", "It costs forty-nine dollars", {}, True),
        ("It costs 49 dollars", "It costs forty nine dollars", {}, True),
        ("Over 105 reviews", "Over one hundred and five reviews", {}, True),
        ("Over 100 reviews", "Over a hundred reviews", {}, True),
        ("Join 2,500 teams", "Join two thousand five hundred teams", {}, True),
        ("Join 10k teams", "Join ten thousand teams", {}, True),
        ("Since 2026", "Since twenty twenty six", {}, True),
        ("Add 2.5 scoops", "Add two point five scoops", {}, True),
        ("Add 1.5 scoops", "Add one and a half scoops", {}, True),
        ("Your 1st order", "Your first order", {}, True),
        ("Open 24/7", "Open twenty four seven", {}, True),
    ])


def test_wrong_number_fails_high_even_when_similar():
    for script, heard in [
        ("Our team takes 5mg every day after a big breakfast", "Our team takes 6mg every day after a big breakfast"),
        ("Over 105 reviews", "Over one hundred and fifteen reviews"),
        ("Add 2.5 scoops", "Add 25 scoops"),
    ]:
        v = review_transcript(script, heard)
        assert not v.passed and _high(v), (script, heard, v.issues)


def test_wrong_price_fails_high():
    v = review_transcript("Get it for only $49 today", "Get it for only fifty nine dollars today")
    assert not v.passed
    assert _high(v) and "number" in _high(v)[0].note


def test_prices_with_cents():
    _check([
        ("It costs $49.99", "It costs forty nine dollars and ninety nine cents", {}, True),
        ("It costs $49.99", "It costs forty nine dollars ninety nine", {}, True),
        ("It costs $49", "It costs forty nine dollars", {}, True),
    ])


# ── Units and percent ───────────────────────────────────────────────────────
def test_units_after_a_quantity():
    _check([
        ("Take 5mg daily", "Take five milligrams daily", {}, True),
        ("Add 30g of protein", "Add thirty grams of protein", {}, True),
        ("Lift 20kg today", "Lift twenty kilograms today", {}, True),
        ("Drink 500ml daily", "Drink five hundred milliliters daily", {}, True),
        ("Drink 2l daily", "Drink two liters daily", {}, True),
        ("A 12oz can", "A twelve ounce can", {}, True),
        ("Lose 10 lbs fast", "Lose ten pounds fast", {}, True),
        ("Take 5 mg daily", "Take 5mg daily", {}, True),
    ])


def test_percent():
    _check([
        ("Get 30% off now", "Get thirty percent off now", {}, True),
        ("Get 30% off now", "Get 30 percent off now", {}, True),
        ("Get 30% off now", "Get thirty per cent off now", {}, True),
        ("Get 30% off now", "Get forty percent off now", {}, False),
    ])


def test_unit_change_fails_high():
    v = review_transcript("Take 5mg daily", "Take five grams daily")
    assert not v.passed and _high(v)


def test_unit_abbreviation_not_after_a_quantity_is_not_rewritten():
    # A brand or initialism "MG" must never turn into "milligrams".
    v = review_transcript("Meet MG today", "Meet milligrams today")
    assert not v.passed


# ── URLs ────────────────────────────────────────────────────────────────────
def test_urls():
    _check([
        ("Visit example.com today", "Visit example dot com today", {}, True),
        ("Visit www.example.com today", "Visit w w w dot example dot com today", {}, True),
        ("Visit www.example.com today", "Visit www dot example dot com today", {}, True),
        ("Visit www.example.com today", "Visit example dot com today", {}, True),
        ("Visit https://example.com/shop", "Visit example dot com slash shop", {}, True),
        ("Try juicebox.ai", "Try juicebox dot a i", {}, True),
    ])


def test_url_component_change_fails():
    _check([
        ("Visit example.com today", "Visit other dot com today", {}, False),
        ("Visit shop.example.com", "Visit example dot com", {}, False),
        ("Visit example.com today", "Visit example dot net today", {}, False),
    ])


# ── Contractions and negation ───────────────────────────────────────────────
def test_contractions_pass():
    _check([
        ("Don't miss it", "Do not miss it", {}, True),
        ("It's here", "It is here", {}, True),
        ("You're going to love it", "You are going to love it", {}, True),
        ("I'm obsessed", "I am obsessed", {}, True),
        ("We'll ship today", "We will ship today", {}, True),
        ("You can't lose", "You cannot lose", {}, True),
        ("You can't lose", "You can not lose", {}, True),
        ("It won't fade", "It will not fade", {}, True),
        ("It doesn't fade", "It does not fade", {}, True),
        ("Let's go", "Let us go", {}, True),
        ("It’s here", "It's here", {}, True),
    ])


def test_negation_flip_fails_high():
    for script, heard in [
        ("This really does help", "This really doesn't help"),
        ("You do need this", "You don't need this"),
        ("You can stop anytime", "You can't stop anytime"),
        ("It does not fade", "It does fade"),
        ("Made with sugar", "Made without sugar"),
        ("Our bands never slip", "Our bands slip"),
    ]:
        v = review_transcript(script, heard)
        assert not v.passed, (script, heard)
        assert _high(v) and "negation" in _high(v)[0].note, (script, heard, v.issues)


# ── Fused / split words ─────────────────────────────────────────────────────
def test_fused_and_split_words_are_equal():
    _check([
        ("Meet Braxleybands today", "Meet Braxley Bands today", {}, True),
        ("Try Gooseworks today", "Try goose works today", {}, True),
        ("Try Goose Works today", "Try Gooseworks today", {}, True),
        ("Meet Drinkag1 now", "Meet drink AG1 now", {}, True),
    ])


def test_fusion_is_exact_not_fuzzy():
    _check([
        ("Meet Braxleybands today", "Meet Braxly Bands today", {"brand_terms": ["Braxleybands"]}, False),
        ("Try Gooseworks today", "Try goose work today", {"brand_terms": ["Gooseworks"]}, False),
    ])


# ── Brand terms ─────────────────────────────────────────────────────────────
def test_brand_term_is_not_stripped_hume_hune_fails():
    # Before QA-71 the fuzzy brand strip removed "Hune" and this PASSED with ratio 1.00.
    v = review_transcript("Hume makes the band", "Hune makes the band", brand_terms=["Hume"])
    assert not v.passed
    assert _high(v) and "brand" in _high(v)[0].note


def test_dropped_brand_fails_high():
    v = review_transcript("Hume makes the band that reads your mood every single day",
                          "makes the band that reads your mood every single day", brand_terms=["Hume"])
    assert not v.passed and _high(v)


def test_brand_term_fused_split_forms_pass():
    _check([("Try Gooseworks today", "Try goose works today", {"brand_terms": ["Gooseworks"]}, True),
            ("Try Gooseworks today", "Try Gooseworks today", {"brand_terms": ["Goose Works"]}, True)])


# ── Confirmed aliases ───────────────────────────────────────────────────────
def test_ag1_alias_passes_only_when_confirmed():
    script = "Meet AG1 now"
    # Not confirmed: a spelled-out "A G one" is not assumed, even with --brand-term.
    assert not review_transcript(script, "Meet A G one now").passed
    assert not review_transcript(script, "Meet A G one now", brand_terms=["AG1"]).passed
    confirmed = {"aliases": [("AG1", "A G one")]}
    for heard in ["Meet AG1 now", "Meet AG one now", "Meet A G 1 now", "Meet A.G. one now", "Meet A G one now"]:
        v = review_transcript(script, heard, **confirmed)
        assert v.passed, (heard, v.issues)


def test_alias_does_not_hide_a_wrong_number_or_misvoice():
    confirmed = {"aliases": {"AG1": "A G one"}}
    assert not review_transcript("Meet AG1 now", "Meet A G two now", **confirmed).passed
    assert not review_transcript("Meet AG1 now", "Meet A B one now", **confirmed).passed


def test_alias_cannot_rewrite_quantities_units_or_negations():
    for bad in [{"AG1": "A G two"}, {"AG1": "A G one not"}, {"Decagon": "five"}, {"Decagon": "5"},
                {"Gold": "five milligrams"}, {"Hume": "not"}, {"Nope": "no"},
                [("A", "same thing"), ("B", "same thing")], [("AG1", "")]]:
        try:
            build_aliases(bad)
        except ValueError:
            continue
        raise AssertionError(f"alias {bad!r} should be rejected")


def test_saved_pronunciations_with_number_like_syllables_are_accepted():
    # Review P1-1: real saved pronunciations sound like numbers/negations; they must not error.
    good = [("Notion", "NO-shun"), ("OneSkin", "one skin"), ("Tenzing", "ten-zing"),
            ("Sevenly", "seven-lee"), ("Nomad", "no-mad"), ("Norwex", "nor-wex"),
            ("Fourthwall", "fourth wall"), ("Wonderbly", "one-der-blee"), ("AG1", "A G one")]
    build_aliases(good)
    _check([
        ("OneSkin changed my skin", "One Skin changed my skin", {"aliases": [("OneSkin", "one skin")]}, True),
        ("Tenzing keeps me going", "Ten zing keeps me going", {"aliases": [("Tenzing", "ten-zing")]}, True),
        # the term is not even in the script: still no error
        ("Our gummies help you sleep", "Our gummies help you sleep", {"aliases": [("Notion", "NO-shun")]}, True),
    ])


def test_alias_cli_and_pronunciations_file_parsing():
    assert parse_alias_arg("AG1=A G one") == ("AG1", "A G one")
    for bad in ["AG1", "=A G one", "AG1="]:
        try:
            parse_alias_arg(bad)
        except ValueError:
            continue
        raise AssertionError(f"--alias {bad!r} should be rejected")
    with tempfile.TemporaryDirectory() as td:
        path = os.path.join(td, "pronunciations.json")
        with open(path, "w") as fh:
            json.dump({"brand_id": "b1", "basis": "fresh user-authored brand learnings read",
                       "pronunciations": [{"term": "AG1", "say_as": "A G one", "fact_id": "f1"}]}, fh)
        pairs = load_pronunciations(path)
    assert pairs == [("AG1", "A G one")]
    v = review_transcript("Meet AG1 now", "Meet A G one now", aliases=pairs)
    assert v.passed and v.aliases == [{"term": "AG1", "say_as": "A G one"}]
    # a confirmed term is also a brand term: mis-voicing it is HIGH
    v = review_transcript("Meet AG1 now", "Meet A G now", aliases=pairs)
    assert not v.passed and _high(v)


# ── Review fixes: units, CLI-style brand terms, joins, number forms ─────────
_TAIL = "and honestly it has been the best part of my morning routine for the last few weeks"


def test_dropped_or_added_unit_fails_high_even_in_a_long_line():
    # Review P1-2: a long line keeps the similarity above 0.90, so the unit itself must fail.
    for script, heard in [
        (f"Take 5mg of melatonin every night {_TAIL}", f"Take five of melatonin every night {_TAIL}"),
        (f"Get 30% off your first order today {_TAIL}", f"Get thirty off your first order today {_TAIL}"),
        (f"Take 5 every night {_TAIL}", f"Take five grams every night {_TAIL}"),
        (f"Contains 200 calories per serving {_TAIL}", f"Contains 200 per serving {_TAIL}"),
    ]:
        v = review_transcript(script, heard)
        assert not v.passed and _high(v) and "unit" in _high(v)[0].note, (heard, v.issues)


def test_dropped_currency_word_alone_is_not_high():
    # "$9.99" is routinely read "nine ninety-nine"
    v = review_transcript(f"It is just $9.99 a month {_TAIL}", f"It is just nine ninety nine a month {_TAIL}")
    assert v.passed and not _high(v), v.issues
    v = review_transcript(f"It is just $9.99 a month {_TAIL}", f"It is just nine dollars eighty nine a month {_TAIL}")
    assert not v.passed and _high(v)


def test_unit_words_count_only_after_a_number():
    # "minutes" with no number before it is an ordinary word: dropping it is medium, not a unit error
    v = review_transcript(f"It saves you minutes every single day {_TAIL}", f"It saves you every single day {_TAIL}")
    assert v.passed and [i.severity for i in v.issues] == ["medium"], v.issues


def test_cli_style_brand_terms_accept_spoken_form_script():
    # Review P1-3: goose-video-local writes the script in the SPOKEN form and passes --brand-term
    # for the brand and for each word of its say_as. That must keep passing.
    terms = {"brand_terms": ["Acme", "ak", "mee"]}
    _check([
        ("Try ak-mee today", "Try Acme today", terms, True),
        ("Try ak-mee today", "Try ak mee today", terms, True),
        ("Try Acme today", "Try ak-mee today", terms, True),
    ])
    # ...but a mis-voicing whose heard word is not a declared term still fails HIGH
    v = review_transcript("Hume makes the band", "Hune makes the band", brand_terms=["Hume", "hyoom"])
    assert not v.passed and _high(v)
    v = review_transcript("Try ak-mee today", "Try ak-moo today", **terms)
    assert not v.passed and _high(v)
    # ...and a dropped brand is still HIGH
    v = review_transcript("Try ak-mee today and feel the difference", "Try today and feel the difference", **terms)
    assert not v.passed and _high(v)


def test_joined_words_never_swallow_a_negation():
    _check([
        ("There is no table in the room", "There is notable in the room", {}, False),
        ("It is a notable change", "It is a no table change", {}, False),
        ("You are not able to stop", "You are notable to stop", {}, False),
        ("There is nothing to lose", "There is no thing to lose", {}, True),
    ])


def test_number_words_join_into_words():
    _check([
        ("Every one of them works", "Everyone of them works", {}, True),
        ("I need someone now", "I need some one now", {}, True),
        ("OneSkin changed my skin", "One Skin changed my skin", {}, True),
    ])


def test_more_number_forms():
    _check([
        ("This is my 2nd bottle", "This is my second bottle", {}, True),
        ("This is my 1st bottle", "This is my second bottle", {}, False),
        ("It is only two-forty-nine", "It is only 249", {}, True),
        ("Over a million people use it", "Over one million people use it", {}, True),
        ("It is the No. 1 pick", "It is the number one pick", {}, True),
        ("It is the No.1 pick", "It is the number one pick", {}, True),
        ("It is the #1 pick", "It is the number one pick", {}, True),
        ("It is the No. 1 pick", "It is the number two pick", {}, False),
    ])
    # "no one" is still a negation
    v = review_transcript("No one beats it", "One beats it")
    assert not v.passed and _high(v)


def test_ag1_without_alias_written_forms():
    # Whisper writing "AG one" or "A.G. one" for AG1 passes without an alias; spaced letters do not.
    _check([
        ("Drink AG1 daily", "Drink AG one daily", {}, True),
        ("Drink AG1 daily", "Drink A.G. one daily", {}, True),
        ("Drink AG1 daily", "Drink A G one daily", {}, False),
    ])


# ── Omission and extra speech ───────────────────────────────────────────────
def test_omission_fails():
    v = review_transcript("Take two capsules every morning with water", "Take two capsules every morning")
    assert not v.passed
    assert any(i.kind == "dropped" for i in v.issues)


def test_unexpected_extra_speech_fails():
    script = "Take two capsules every morning"
    heard = "Take two capsules every morning and tell all your friends about it today"
    assert not review_transcript(script, heard).passed


# ── Report ──────────────────────────────────────────────────────────────────
def test_report_quotes_original_words_and_new_pin_wording():
    v = review_transcript("Take 5mg daily", "Take six milligrams daily")
    report = render_report(v)
    assert '"5mg"' in report and '"six"' in report, report
    assert "video_project_upsert patch.final_render_id" in report
    assert "set_final" + "_render" not in report


# ── CLI (no audio, no network: extraction + transcription are stubbed) ─────
def _run_cli(transcript, *extra):
    saved = (review_render.extract_audio, review_render.mean_volume_db,
             review_render.transcribe, review_render.ffmpeg_available)
    calls = []
    review_render.extract_audio = lambda video, out: None
    review_render.mean_volume_db = lambda audio: -20.0
    review_render.transcribe = lambda audio: calls.append(audio) or transcript
    review_render.ffmpeg_available = lambda: True
    try:
        with tempfile.TemporaryDirectory() as td:
            video = os.path.join(td, "final.mp4")
            open(video, "wb").close()
            out = os.path.join(td, "verdict.json")
            code = review_render.main(["--video", video, "--json", out, *extra])
            verdict = json.load(open(out)) if os.path.exists(out) else None
        return code, verdict, calls
    finally:
        (review_render.extract_audio, review_render.mean_volume_db,
         review_render.transcribe, review_render.ffmpeg_available) = saved


def test_cli_pass_fail_and_error_exit_codes():
    code, verdict, _ = _run_cli("Take five milligrams daily", "--script", "Take 5mg daily")
    assert code == 0 and verdict["passed"]
    code, verdict, _ = _run_cli("Hune makes the band", "--script", "Hume makes the band", "--brand-term", "Hume")
    assert code == 2 and not verdict["passed"]
    assert verdict["issues"][0]["severity"] == "high" and verdict["issues"][0]["heard_text"] == "Hune"
    code, verdict, _ = _run_cli("Meet A G one now", "--script", "Meet AG1 now", "--alias", "AG1=A G one")
    assert code == 0 and verdict["aliases"] == [{"term": "AG1", "say_as": "A G one"}]


def test_cli_bad_alias_errors_before_transcribing():
    code, verdict, calls = _run_cli("anything", "--script", "Meet AG1 now", "--alias", "AG1=A G two")
    assert code == 3 and verdict is None and not calls
    code, _, calls = _run_cli("anything", "--script", "x", "--pronunciations", "/nonexistent/p.json")
    assert code == 3 and not calls
    with tempfile.TemporaryDirectory() as td:   # a directory is not a pronunciations file
        code, _, calls = _run_cli("anything", "--script", "x", "--pronunciations", td)
    assert code == 3 and not calls


def test_cli_unusable_saved_pronunciation_is_skipped_not_fatal():
    with tempfile.TemporaryDirectory() as td:
        path = os.path.join(td, "brand-rules.json")   # create-vo-elevenlabs brand-rules.json shape
        with open(path, "w") as fh:
            json.dump({"name": "Acme", "pronunciations": [
                {"term": "Decagon", "say_as": "five"},            # unusable: skipped with a warning
                {"term": "OneSkin", "say_as": "one skin", "learning_id": "1"}]}, fh)
        code, verdict, calls = _run_cli("One Skin changed my skin", "--script", "OneSkin changed my skin",
                                        "--pronunciations", path)
    assert code == 0 and calls, verdict
    assert verdict["aliases"] == [{"term": "OneSkin", "say_as": "one skin"}]


if __name__ == "__main__":
    fns = [v for k, v in sorted(globals().items()) if k.startswith("test_") and callable(v)]
    failed = 0
    for fn in fns:
        try:
            fn()
            print(f"ok   {fn.__name__}")
        except AssertionError as e:
            failed += 1
            print(f"FAIL {fn.__name__}: {e}")
    print(f"\n{len(fns) - failed}/{len(fns)} passed")
    sys.exit(1 if failed else 0)

"""Unit tests for the pre-publish review gate's pure verdict logic.

Run: python3 -m pytest tests/  (or) python3 tests/test_review_render.py
No audio, ffmpeg, or network needed — these exercise review_transcript() only.
"""
import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "scripts"))

from review_render import review_transcript, tokenize  # noqa: E402


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

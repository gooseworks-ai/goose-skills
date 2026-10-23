"""Run: python3 -m pytest tests/  (no network; tests the pronunciation swap only)."""
import json
import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "scripts"))

from gen_vo import apply_say_as, load_pairs  # noqa: E402


def test_swaps_whole_word_any_case():
    pairs = [("Drinkag1", "drink A G one")]
    assert apply_say_as("Try DRINKAG1 tonight. drinkag1!", pairs) == "Try drink A G one tonight. drink A G one!"


def test_leaves_longer_words_alone():
    assert apply_say_as("Gooseworksify it", [("Gooseworks", "goose works")]) == "Gooseworksify it"


def test_longest_term_wins():
    pairs = [("Goose", "gooss"), ("Goose Works", "goose werks")]
    assert apply_say_as("Goose Works rocks", pairs) == "goose werks rocks"


def test_rules_file_and_flag_merge(tmp_path):
    rules = tmp_path / "r.json"
    rules.write_text(json.dumps({"pronunciations": [{"term": "AGZ", "say_as": "A G Z"}]}))
    assert load_pairs(["Drinkag1=drink A G one"], str(rules)) == [("Drinkag1", "drink A G one"), ("AGZ", "A G Z")]

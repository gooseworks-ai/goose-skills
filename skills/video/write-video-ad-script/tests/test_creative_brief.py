"""Offline run-context regression: provenance, scope, history and user copy."""
import copy
import json
import subprocess
import sys
from pathlib import Path

import pytest

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "scripts"))
from prepare_angle_context import select_context, validate_bank
from lint_scripts import lint
from critique_scripts import build_prompt
from test_angle_handoff import BANK, fixture


def brief():
    result = {
        "brand_id": "brand", "product_id": "bottle",
        "sources": [{"id": "run", "source": "fixture://project/brief/3"},
                    {"id": "feedback", "source": "fixture://project/history/2"}],
        "prior_decisions": [{"text": "Game changer was rejected as generic.",
                             "avoid_phrase": "game changer", "source_ids": ["feedback"],
                             "scope": "project", "applies_to": "same campaign"}],
        "locked_copy": [{"text": "Shop the bottle.", "source_ids": ["run"]}],
        "unknowns": ["Leak resistance is unknown; show closure without claiming leak-proof."],
    }
    for key, text in {
        "product_variant": "Blue 500 ml screw-top variant", "audience_situation": "A commuter packing a drink",
        "objective": "Let the buyer inspect the closure", "offer": "No offer supplied",
        "cta": "Shop the bottle.", "constraints": "No leak-proof claim",
        "delivery_intent": "Plain demonstration with time to see the lid close",
    }.items():
        result[key] = {"text": text, "source_ids": ["run"]}
    result["mechanism"] = {"text": "Screw lid closes visibly", "source_ids": ["f1"], "fact_ids": ["f1"]}
    return result


def inputs():
    c, s, _ = fixture()
    s["requires_creative_brief"] = True
    x = select_context(copy.deepcopy(BANK), "brand", "bottle", "demo", ["a1"], brief())
    return c, s, x


def codes(result):
    return {e["code"] for c in result["concepts"] for e in c["errors"]}


def test_sourced_brief_reaches_critic_without_mutating_reusable_bank():
    c, s, x = inputs()
    assert "creative_brief" not in BANK
    assert lint(c, s, context=x, strict=True)["ok"]
    prompt = build_prompt(c["concepts"], {}, {}, s, "", context=x)
    assert "Blue 500 ml" in prompt and "Game changer was rejected" in prompt
    assert "pronunciation/delivery intent" in prompt


def test_new_run_requires_brief_but_legacy_remains_readable():
    c, s, x = inputs()
    del x["creative_brief"]
    assert not lint(c, s, context=x, strict=True)["ok"]
    del s["requires_creative_brief"]
    assert lint(c, s, context=x, strict=True)["ok"]


@pytest.mark.parametrize("key,value", [
    ("product_id", "other-variant"), ("sources", "bad"), ("cta", None),
    ("prior_decisions", None), ("locked_copy", None), ("unknowns", None),
])
def test_bad_scope_and_malformed_input_fail_without_traceback(key, value):
    b = brief()
    b[key] = value
    with pytest.raises(ValueError):
        select_context(BANK, "brand", "bottle", "demo", brief=b)


def test_user_preference_source_cannot_substantiate_product_mechanism():
    b = brief()
    b["mechanism"]["fact_ids"] = ["feedback"]
    with pytest.raises(ValueError, match="product facts"):
        select_context(BANK, "brand", "bottle", "demo", brief=b)


def test_honest_unknown_mechanism_remains_a_visible_gap():
    b = brief()
    b["mechanism"].update(text="Unknown; explain only the visible closure", status="unknown", fact_ids=[])
    x = select_context(BANK, "brand", "bottle", "demo", brief=b)
    assert x["creative_brief"]["mechanism"]["status"] == "unknown"


def test_unknown_mechanism_requires_an_explicit_gap_record():
    b = brief()
    b["mechanism"].update(text="Unknown", status="unknown", fact_ids=[])
    b["unknowns"] = []
    with pytest.raises(ValueError, match="unknown mechanism needs a nonempty unknowns"):
        select_context(BANK, "brand", "bottle", "demo", brief=b)


def test_missing_source_and_duplicate_source_rejected():
    for change in ("unknown", "duplicate"):
        b = brief()
        if change == "unknown":
            b["cta"]["source_ids"] = ["missing"]
        else:
            b["sources"].append({"id": "f1", "source": "fixture://impostor"})
        with pytest.raises(ValueError):
            select_context(BANK, "brand", "bottle", "demo", brief=b)


def test_rejected_phrase_and_locked_copy_are_checked_in_body_and_hook():
    c, s, x = inputs()
    c["concepts"][0]["hooks"][0]["text"] = "A GAME  CHANGER."
    c["concepts"][0]["beats"][1]["text"] = "Buy it."
    assert {"E_PRIOR_REJECTION", "E_LOCKED_COPY"} <= codes(lint(c, s, context=x, strict=True))
    # The user's exact words remain report-only, never silently rewritten.
    assert lint(c, s, context=x, strict=True, report_only=True)["ok"]


def test_rejection_matches_words_not_unrelated_substrings():
    c, s, x = inputs()
    x["creative_brief"]["prior_decisions"][0]["avoid_phrase"] = "shop"
    c["concepts"][0]["beats"][1]["text"] = "A shopper closes it."
    x["creative_brief"]["locked_copy"] = []
    assert "E_PRIOR_REJECTION" not in codes(lint(c, s, context=x, strict=True))


def test_numeric_fact_in_handoff_does_not_require_duplicate_brand_rules():
    c, s, x = inputs()
    x["facts"][0]["text"] = "The bottle holds 500 ml."
    c["concepts"][0]["beats"][0]["text"] = "This bottle holds 500 ml."
    report = lint(c, s, context=x, strict=True)
    assert "W_UNSOURCED_NUMBER" not in {w["code"] for row in report["concepts"] for w in row["warnings"]}


def test_brief_cli_round_trip(tmp_path):
    folder = Path(__file__).resolve().parents[1] / "scripts"
    (tmp_path / "bank.json").write_text(json.dumps(BANK))
    (tmp_path / "brief.json").write_text(json.dumps(brief()))
    command = [sys.executable, str(folder / "prepare_angle_context.py"), "--bank", "bank.json",
               "--brand-id", "brand", "--product-id", "bottle", "--template-id", "demo", "--brief", "brief.json"]
    result = subprocess.run(command, cwd=tmp_path, capture_output=True, text=True)
    assert result.returncode == 0, result.stderr
    context = json.loads((tmp_path / "working/script/angle-context.json").read_text())
    assert context["creative_brief"] == brief()
    assert validate_bank(context) == []

"""Offline regressions for research reuse, selected angles and real recipe limits."""
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


BANK = {
    "schema_version": "video-angle-bank.v1", "brand_id": "brand", "product_id": "bottle",
    "researched_at": "2026-10-02", "audience": "commuters packing beside a laptop",
    "objective": "purchase", "offer": None, "cta": "Shop the bottle",
    "facts": [{"id": "f1", "product_id": "bottle", "text": "A screw-top lid",
               "source": "https://example.com/bottle", "verified_at": "2026-10-02"}],
    "quotes": [], "references": [],
    "angles": [{"id": "a1", "angle": "Show the closure before packing", "promise": "A visible screw closure",
                "evidence_ids": ["f1"], "compatible_template_ids": ["demo"]},
               {"id": "a2", "angle": "See the lid up close", "promise": "A visible screw closure",
                "evidence_ids": ["f1"], "compatible_template_ids": ["chat"]}],
}


def fixture():
    context = select_context(copy.deepcopy(BANK), "brand", "bottle", "demo", ["a1"])
    shape = {"template_id": "demo", "format": "product-demo", "total_seconds": 6,
             "requires_visuals": True, "allowed_visual_modes": ["existing", "text"],
             "available_asset_ids": ["bottle-clip"], "cta_beat": "cta",
             "beats": [{"id": "hook", "seconds": 3, "kind": "spoken", "speaker": "narrator", "max_words": 8},
                       {"id": "cta", "seconds": 3, "kind": "spoken", "speaker": "narrator", "max_words": 8}]}
    visual = {"description": "Show the screw lid closing", "mode": "existing", "asset_ids": ["bottle-clip"]}
    candidates = {"brand_id": "brand", "product_id": "bottle", "template_id": "demo", "concepts": [{
        "id": "c1", "angle_id": "a1", "angle": BANK["angles"][0]["angle"], "evidence_ids": ["f1"],
        "claims": [{"text": "A screw-top lid", "fact_ids": ["f1"]}],
        "hooks": [{"id": "h1", "text": "Watch this screw-top lid close.", "family": "demo"}],
        "beats": [{"id": "hook", "speaker": "narrator", "text": "Watch this screw-top lid close.", "visual": copy.deepcopy(visual)},
                  {"id": "cta", "speaker": "narrator", "text": "Shop the bottle.", "visual": copy.deepcopy(visual)}]}]}
    return candidates, shape, context


def report(candidates, shape, context):
    return lint(candidates, shape, context=context, strict=True)


def codes(result):
    return {e["code"] for c in result["concepts"] for e in c["errors"]}


def test_reuses_selected_angle_and_accepts_product_led_script_without_reviews():
    c, s, x = fixture()
    assert report(c, s, x)["ok"]
    assert x["locked_angle_ids"] == ["a1"]
    assert [a["id"] for a in x["angles"]] == ["a1"]


def dialogue_reference(mode="podcast"):
    return {"id": "r-dialogue", "url": "https://publisher.example/interview",
            "dialogue_mode": mode, "observed": True, "observed_scope": "transcript",
            "speaker_turns": [{"speaker": "host", "does": "asks about one specific habit"},
                              {"speaker": "guest", "does": "answers with a concrete example"},
                              {"speaker": "host", "does": "clarifies that example"}],
            "transfer_rule": "Use the turn dependency, not wording or claims."}


def test_generated_podcast_needs_observed_and_cited_conversation():
    c, s, x = fixture()
    s["format"] = "podcast-clip"
    s["dialogue_mode"] = "podcast"
    assert not lint(c, s, context=x, strict=True)["ok"]
    c["concepts"][0]["reference_id"] = "r-dialogue"
    assert lint(c, s, context=x, strict=True, references=[dialogue_reference()])["ok"]


@pytest.mark.parametrize("change", [
    {"observed": False}, {"url": ""}, {"speaker_turns": []},
    {"dialogue_mode": "street-interview"}, {"transfer_rule": ""},
])
def test_product_facts_or_unobserved_map_cannot_replace_conversation_reference(change):
    c, s, x = fixture()
    s["format"] = "podcast"
    s["dialogue_mode"] = "podcast"
    c["concepts"][0]["reference_id"] = "r-dialogue"
    ref = dialogue_reference()
    ref.update(change)
    assert not lint(c, s, context=x, strict=True, references=[ref])["ok"]


def test_user_dialogue_remains_report_only_without_references():
    c, s, x = fixture()
    s["format"] = "street-interview"
    assert lint(c, s, context=x, strict=True, report_only=True)["ok"]


def street_reference():
    r = dialogue_reference('street-interview')
    r.update({"observed_scope":"video", "commercial":True, "commercial_evidence":"Named sponsor offers help.",
              "limitations":"Authorship, performance and vocal delivery unverified.",
              "allowed_offering_types":["physical"],"interaction_types":["product-sample"],
              "inspection":{"coverage":"complete-clip","modalities":["visual","transcript"],
                            "duration_s":12,"method":"Complete frame timeline and transcript."},
              "ad_interaction":{k:'Observed description or explicitly unknown setup.' for k in
                                ('edited_opening','visible_setup','participant_reason','viewer_hook',
                                 'product_connection','payoff','unseen_setup')}})
    for i,t in enumerate(r['speaker_turns']):
        t.update({'start':i*3,'end':(i+1)*3,'text':'Recorded observed content.'})
    return r


def test_street_generation_requires_complete_commercial_words_and_actions():
    c,s,x=fixture();s['format']='street-interview'
    c['concepts'][0]['reference_id']='r-dialogue'
    assert not lint(c,s,context=x,strict=True,references=[dialogue_reference('street-interview')])['ok']
    assert lint(c,s,context=x,strict=True,references=[street_reference()])['ok']


def test_selector_reference_wrapper_and_single_record_are_accepted_without_rewriting():
    c,s,x=fixture();s['format']='street-interview'
    c['concepts'][0]['reference_id']='r-dialogue'
    r=street_reference()
    envelope={'schema_version':'street-script-context.v2','references':[r]}
    assert lint(c,s,context=x,strict=True,references=envelope)['ok']
    assert lint(c,s,context=x,strict=True,references=r)['ok']
    r['inspection']['coverage']='partial'
    assert not lint(c,s,context=x,strict=True,references=envelope)['ok']


@pytest.mark.parametrize('change',[
    {'commercial':False}, {'use_status':'excluded'}, {'ad_interaction':{}},
    {'inspection':{'coverage':'partial'}}, {'inspection':None},
])
def test_street_editorial_and_partial_records_are_rejected(change):
    c,s,x=fixture();s['format']='street-interview';c['concepts'][0]['reference_id']='r-dialogue'
    r=street_reference();r.update(change)
    assert not lint(c,s,context=x,strict=True,references=[r])['ok']


def test_street_function_only_or_impossible_timestamps_are_rejected():
    c,s,x=fixture();s['format']='street-interview';c['concepts'][0]['reference_id']='r-dialogue'
    r=street_reference();del r['speaker_turns'][0]['text']
    assert not lint(c,s,context=x,strict=True,references=[r])['ok']
    r=street_reference();r['speaker_turns'][0]['end']=90
    assert not lint(c,s,context=x,strict=True,references=[r])['ok']


def test_street_critic_receives_situation_and_causal_checks():
    c,s,x=fixture();s['format']='street-interview'
    c['concepts'][0]['situation_brief']={'participant_reason':'Invited to taste a prepared sample.'}
    prompt=build_prompt(c['concepts'],{}, {},s,'',context=x,references=[street_reference()])
    assert 'Invited to taste a prepared sample.' in prompt
    assert "problem survive an ordinary person's obvious next action" in prompt
    assert 'reaction\ncold open may precede a question' in prompt


def test_single_host_ad_read_does_not_need_a_two_person_reference():
    c, s, x = fixture()
    s["format"] = "podcast-ad-read"
    assert lint(c, s, context=x, strict=True)["ok"]


@pytest.mark.parametrize("brand,product,template,angles", [
    ("other", "bottle", "demo", ["a1"]), ("brand", "other", "demo", ["a1"]),
    ("brand", "bottle", "demo", ["missing"]), ("brand", "bottle", "demo", ["a2"]),
])
def test_handoff_rejects_cross_scope_unknown_and_incompatible_selections(brand, product, template, angles):
    with pytest.raises(ValueError):
        select_context(BANK, brand, product, template, angles)


def test_no_matching_angle_does_not_invent_one():
    with pytest.raises(ValueError, match="no angle fits"):
        select_context(BANK, "brand", "bottle", "nonexistent")


def test_handoff_rejects_broken_sources_and_cross_product_facts():
    b = copy.deepcopy(BANK)
    b["facts"][0]["source"] = ""
    b["facts"][0]["product_id"] = "other"
    b["angles"][0]["evidence_ids"] = ["missing"]
    errors = " ".join(validate_bank(b))
    assert "real source" in errors and "another product" in errors and "unknown evidence" in errors


def test_strict_mode_rejects_missing_inputs_and_empty_candidates():
    r = lint({"concepts": []}, strict=True)
    assert not r["ok"] and len(r["input_errors"]) >= 3


def test_selected_angle_and_template_cannot_drift():
    c, s, x = fixture()
    c["template_id"] = "chat"
    c["concepts"][0]["angle"] = "An unrelated convenience angle"
    r = report(c, s, x)
    assert not r["ok"] and "E_ANGLE_CHANGED" in codes(r) and r["input_errors"]


def test_product_claims_cannot_use_a_customer_quote_as_general_substantiation():
    c, s, x = fixture()
    x["quotes"] = [{"id": "q1", "text": "Mine never spilled", "source": "https://example.com/review"}]
    c["concepts"][0]["claims"] = [{"text": "Never spills", "fact_ids": ["q1"]}]
    assert "E_CLAIM_SOURCE" in codes(report(c, s, x))


def test_visuals_require_available_assets_and_permitted_production_mode():
    c, s, x = fixture()
    c["concepts"][0]["beats"][0]["visual"]["asset_ids"] = ["invented-footage"]
    c["concepts"][0]["beats"][1]["visual"]["mode"] = "generate"
    assert {"E_ASSET", "E_VISUAL_MODE"} <= codes(report(c, s, x))


def test_repeated_required_slots_cannot_be_omitted():
    c, s, x = fixture()
    s["beats"] = [{"id": "turn", "seconds": 1, "kind": "bubble", "speaker": "me"},
                  {"id": "turn", "seconds": 1, "kind": "bubble", "speaker": "them"}]
    c["concepts"][0]["beats"] = [{"id": "turn", "speaker": "me", "text": "A screw lid.",
                                   "visual": {"description": "A message", "mode": "text"}}]
    assert "E_BEAT_MISSING" in codes(report(c, s, x))


def test_chat_character_limit_and_speaker_are_actual_constraints():
    c, s, x = fixture()
    s["beats"][0].update(kind="bubble", max_chars=8, speaker="them")
    assert {"E_CHAR_BUDGET", "E_SPEAKER"} <= codes(report(c, s, x))


def test_explicit_word_limit_is_not_softened_by_spoken_tolerance():
    c, s, x = fixture()
    s["beats"][0]["max_words"] = 9
    c["concepts"][0]["beats"][0]["text"] = "Watch how this screw top lid closes before packing today."
    assert "E_BUDGET" in codes(report(c, s, x))


def test_silent_product_action_does_not_require_invented_speech():
    c, s, x = fixture()
    s["beats"][0].update(kind="visual", speaker=None)
    c["concepts"][0]["beats"][0]["text"] = ""
    c["concepts"][0]["hooks"] = []
    s["beats"][1].update(kind="on_screen", speaker=None)
    assert report(c, s, x)["ok"]


def test_malformed_context_fails_as_input_error_without_traceback():
    c, s, x = fixture()
    x["facts"] = None
    r = report(c, s, x)
    assert not r["ok"] and "facts must be a list" in r["input_errors"]


def test_raw_bank_cannot_bypass_template_compatibility():
    c, s, x = fixture()
    x["angles"][0]["compatible_template_ids"] = ["chat"]
    assert "E_TEMPLATE_FIT" in codes(report(c, s, x))


def test_context_quotes_are_validated_without_a_second_bank_file():
    c, s, x = fixture()
    x["quotes"] = [{"id": "q1", "text": "I keep it beside my laptop", "source": "https://example.com/review"}]
    c["concepts"][0]["quote_ids"] = ["unknown"]
    assert "E_BAD_QUOTE_ID" in codes(report(c, s, x))


def test_critic_receives_strategy_recipe_visuals_and_reference_persuasion():
    c, s, x = fixture()
    prompt = build_prompt(c["concepts"], {}, {}, s, "commuter demo", context=x,
                          references=[{"id": "r1", "proof_device": "close lid then pack"}])
    for text in ("commuters packing", "allowed_visual_modes", "bottle-clip", "screw-top lid",
                 "close lid then pack", "claim_support", "template_fit"):
        assert text in prompt


def test_preparation_cli_round_trip_and_wrong_product_exit(tmp_path):
    script = Path(__file__).resolve().parents[1] / "scripts" / "prepare_angle_context.py"
    bank = tmp_path / "bank.json"
    bank.write_text(json.dumps(BANK))
    args = [sys.executable, str(script), "--bank", str(bank), "--brand-id", "brand",
            "--product-id", "bottle", "--template-id", "demo", "--angle-id", "a1"]
    done = subprocess.run(args, cwd=tmp_path, capture_output=True, text=True)
    assert done.returncode == 0, done.stderr
    out = json.loads((tmp_path / "working/script/angle-context.json").read_text())
    assert out["template_id"] == "demo" and out["locked_angle_ids"] == ["a1"]
    args[args.index("bottle")] = "another-product"
    assert subprocess.run(args, cwd=tmp_path, capture_output=True).returncode == 2

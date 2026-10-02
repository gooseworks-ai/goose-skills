"""Tests for critique_scripts.py: prompt building, answer parsing, merging two passes, and
the MCP relay round trip.

Run: python3 -m pytest tests/   (no network: the model is never called. The relay path is
forced with GW_MEDIA_VIA=mcp and the model's answers are written by the test.)
"""
import copy
import json
import os
import subprocess
import sys

import pytest

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "scripts"))

import critique_scripts as cs  # noqa: E402
from test_lint_scripts import BANK, GOOD, RULES, SHAPE  # noqa: E402

SCRIPT = os.path.join(os.path.dirname(__file__), "..", "scripts", "critique_scripts.py")
IDS = ["c1", "c2"]
HOOKS = ["c1h1", "c1h2", "c2h1"]


def test_prompt_carries_quotes_facts_rules_and_budgets():
    quotes = {q["id"]: q for q in BANK["quotes"]}
    p = cs.build_prompt(GOOD["concepts"], quotes, RULES, SHAPE, "sleep mist for 3am wake-ups")
    assert "staring at the ceiling" in p          # the cited customer quote
    assert "lavender and magnesium" in p          # brand facts an edit may use
    assert "Never claim it cures insomnia" in p   # what the brand never says
    assert "hook (3s)" in p                       # per-beat timing from the shape
    assert "c1h2 [named-enemy]" in p              # every hook, with its family
    assert p.rstrip().endswith('"why_top": "..."}')


def test_parse_json_strips_fences_and_prose():
    assert cs.parse_json('```json\n{"ranking": ["c1"]}\n```') == {"ranking": ["c1"]}
    assert cs.parse_json('Here you go: {"a": 1} hope it helps') == {"a": 1}
    with pytest.raises(cs.BadAnswer):
        cs.parse_json("no json here")


def answer(fresh, ranking, kill_c2, best="c1h2", ids=("c1", "c2")):
    return {"concepts": [
        {"id": ids[0], "scores": {"hook": 8, "fresh": fresh}, "best_hook_id": best,
         "edits": [{"beat": "cta", "from": "x", "to": "y", "why": "z"}], "kill": None},
        {"id": ids[1], "scores": {"hook": 4, "fresh": 3}, "best_hook_id": "c2h1", "edits": [],
         "kill": "generic" if kill_c2 else None}],
        "ranking": ranking, "why_top": "because"}


def norm(run):
    return cs.normalize_run(run, IDS, HOOKS)


def test_merge_averages_and_needs_both_passes_to_kill():
    m = cs.merge([norm(answer(6, ["c1", "c2"], True)), norm(answer(4, ["c2", "c1"], False))], IDS)
    c1 = next(c for c in m["concepts"] if c["id"] == "c1")
    c2 = next(c for c in m["concepts"] if c["id"] == "c2")
    assert c1["scores"] == {"hook": 8.0, "fresh": 5.0}
    assert len(c1["edits"]) == 1                    # same edit from both passes, kept once
    assert c2["kill"] is None and c2["kill_split"]  # only one pass wanted it gone
    assert c2["kill_reasons"] == ["generic"]      # preserve the defect for resolution
    assert m["ranking"][0] == "c1"                   # Borda tie broken by the higher average
    assert m["needs_review"] and m["top_choice_agreement"] is False
    assert m["pass_rankings"] == [["c1", "c2"], ["c2", "c1"]]


def test_split_kill_requires_review_even_when_rankings_agree():
    m = cs.merge([norm(answer(6, IDS, True)), norm(answer(6, IDS, False))], IDS)
    assert m["top_choice_agreement"] is True
    assert m["needs_review"]
    assert any("fatal defect" in reason for reason in m["review_reasons"])


def test_agreement_does_not_request_extra_review_and_single_pass_has_no_agreement_claim():
    m = cs.merge([norm(answer(6, IDS, False)), norm(answer(6, IDS, False))], IDS)
    assert m["top_choice_agreement"] is True and not m["needs_review"]
    m = cs.merge([norm(answer(6, IDS, False))], IDS)
    assert m["top_choice_agreement"] is None and not m["needs_review"]


def test_dialogue_floor_cannot_be_averaged_away():
    first, second = norm(answer(9, IDS, False)), norm(answer(9, IDS, False))
    for run in (first, second):
        for concept in run["concepts"]:
            concept["scores"].update(spoken=9, template_fit=9)
    first["concepts"][0]["scores"]["spoken"] = 7
    result = cs.merge([first, second], IDS, dialogue_required=True)
    c1 = next(c for c in result["concepts"] if c["id"] == "c1")
    assert c1["scores"]["spoken"] == 8.0 and not c1["dialogue_ready"]
    assert result["needs_review"]
    assert next(c for c in result["concepts"] if c["id"] == "c2")["dialogue_ready"]


def test_missing_dialogue_judgment_is_unresolved():
    result = cs.merge([norm(answer(9, IDS, False))], IDS, dialogue_required=True)
    assert result["needs_review"] and all(not c["dialogue_ready"] for c in result["concepts"])


def test_merge_kills_when_every_pass_agrees():
    m = cs.merge([norm(answer(6, ["c1", "c2"], True)), norm(answer(6, ["c1", "c2"], True))], IDS)
    assert next(c for c in m["concepts"] if c["id"] == "c2")["kill"] == "generic"


def test_loose_ids_are_mapped_and_a_foreign_answer_is_rejected():
    run = norm(answer(6, ["Concept C2", "concept c1"], False, best="C1H1", ids=("Concept c1", "C2")))
    assert [c["id"] for c in run["concepts"]] == ["c1", "c2"]
    assert run["ranking"] == ["c2", "c1"]
    assert run["concepts"][0]["best_hook_id"] == "c1h1"
    with pytest.raises(cs.BadAnswer):
        norm(answer(6, ["A", "B"], False, ids=("Concept A", "Concept B")))


def test_best_hook_tie_goes_to_the_first_pass():
    m = cs.merge([norm(answer(6, IDS, False, best="c1h2")), norm(answer(6, IDS, False, best="c1h1"))], IDS)
    c1 = next(c for c in m["concepts"] if c["id"] == "c1")
    assert c1["best_hook_id"] == "c1h2" and not c1["hook_agreement"]


def test_answer_text_unwraps_what_an_agent_may_save():
    fal = {"output": '{"ranking": []}', "usage": {"cost": 0.007}}
    assert cs.answer_text(fal)[0] == '{"ranking": []}'
    assert cs.answer_text({"status": "complete", "result": {"output": fal}})[0] == '{"ranking": []}'
    assert cs.answer_text({"result": fal})[0] == '{"ranking": []}'
    with pytest.raises(cs.BadAnswer):
        cs.answer_text({"output": "cut", "partial": True})
    with pytest.raises(cs.BadAnswer):
        cs.answer_text({"error": "model not found"})


def two_concepts():
    c = copy.deepcopy(GOOD)
    c2 = copy.deepcopy(c["concepts"][0])
    c2["id"] = "c2"
    c2["hooks"] = [{"id": "c2h1", "family": "result-first", "text": "Two sprays, and the 3am wake-ups stopped."}]
    c["concepts"].append(c2)
    return c


def run_cli(tmp_path, *extra):
    env = dict(os.environ, GW_MEDIA_VIA="mcp", GW_PROJECT_ID="proj-test", GW_CLI_LOG_DISABLED="1")
    return subprocess.run([sys.executable, SCRIPT, "--candidates", "c.json", *extra],
                          cwd=tmp_path, env=env, capture_output=True, text=True)


def requests_in(tmp_path):
    d = tmp_path / "working" / "mcp-requests"
    return sorted(p for p in d.iterdir() if not p.name.endswith(".result.json")) if d.exists() else []


def test_refuses_a_claude_critic(tmp_path):
    (tmp_path / "c.json").write_text(json.dumps(two_concepts()))
    r = run_cli(tmp_path, "--model", "anthropic/claude-opus-5.5")
    assert r.returncode != 0 and "different model family" in r.stderr


def test_codex_writer_cannot_use_an_openai_critic(tmp_path):
    (tmp_path / "c.json").write_text(json.dumps(two_concepts()))
    r = run_cli(tmp_path, "--writer-family", "openai", "--model", "openai/gpt-6-sol")
    assert r.returncode != 0 and "different model family" in r.stderr


def test_codex_writer_can_use_a_different_family_in_relay(tmp_path):
    (tmp_path / "c.json").write_text(json.dumps(GOOD))
    r = run_cli(tmp_path, "--writer-family", "openai", "--model", "anthropic/claude-sonnet-4.6")
    assert r.returncode == 3, r.stderr


def test_relay_round_trip_writes_both_passes_at_once_then_finishes(tmp_path):
    (tmp_path / "c.json").write_text(json.dumps(two_concepts()))
    first = run_cli(tmp_path)
    assert first.returncode == 3
    reqs = requests_in(tmp_path)
    assert len(reqs) == 2                                   # both passes in one round
    for p in reqs:
        req = json.loads(p.read_text())
        assert req["tool"] == "data_post_provider"
        assert req["args"]["provider"] == "fal" and req["args"]["path"] == "openrouter/router"
        assert req["args"]["project_id"] == "proj-test"
        assert not req["args"]["body"]["model"].startswith("anthropic/")
        # what the agent saves: job_get's whole reply (the script unwraps it)
        text = json.dumps(answer(6, ["c1", "c2"], False))
        pathlib_res = p.with_name(p.name.replace(".json", ".result.json"))
        pathlib_res.write_text(json.dumps({"status": "complete", "result": {"output": {"output": text}}}))
    second = run_cli(tmp_path)
    assert second.returncode == 0, second.stderr
    out = json.loads((tmp_path / "working" / "script" / "critique.json").read_text())
    assert out["ranking"][0] == "c1" and out["orders"] == 2


def test_one_concept_gets_one_pass(tmp_path):
    (tmp_path / "c.json").write_text(json.dumps(GOOD))
    assert run_cli(tmp_path).returncode == 3
    assert len(requests_in(tmp_path)) == 1


def test_a_garbage_saved_result_exits_4(tmp_path):
    (tmp_path / "c.json").write_text(json.dumps(GOOD))
    run_cli(tmp_path)
    p = requests_in(tmp_path)[0]
    p.with_name(p.name.replace(".json", ".result.json")).write_text(json.dumps({"hello": "world"}))
    r = run_cli(tmp_path)
    assert r.returncode == 4 and "result.output" in r.stderr

"""Free timing checks and real CLI runs; no generated delivery is claimed."""
import copy
import json
import pathlib
import subprocess
import sys

import pytest

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parents[1] / "scripts"))
import lint_scripts as ls
from critique_scripts import build_prompt

SOURCE = {"kind": "brief", "detail": "A brisk creator read for this ad."}


def candidates(shape, counts):
    return {"concepts": [{"id": "c1", "beats": [
        {"id": beat["id"], "speaker": beat.get("speaker"), "text": " ".join(["detail"] * count)}
        for beat, count in zip(shape["beats"], counts)]}]}


def check(shape, counts, **kwargs):
    return ls.lint(candidates(shape, counts), shape, **kwargs)


def profile(beats, **kwargs):
    return {"words_per_second": 3.0, "pacing_source": SOURCE, "beats": beats, **kwargs}


def codes(report, group="errors"):
    return {item["code"] for item in report["concepts"][0][group]}


def test_templates_keep_distinct_rates():
    for rate, budget in [(1.9, 28), (3.4, 51)]:
        shape = profile([{"id": "creator", "kind": "spoken", "seconds": 15}], words_per_second=rate)
        assert check(shape, [budget])["concepts"][0]["timing"][0]["word_budget"] == budget


def test_pauses_and_silent_visuals_do_not_add_spoken_capacity():
    shape = profile([
        {"id": "hook", "seconds": 4, "pause_seconds": 3},
        {"id": "demo", "kind": "visual", "seconds": 8},
        {"id": "endcard", "kind": "on_screen", "seconds": 3, "max_words": 6},
    ], total_seconds=15)
    good = check(shape, [2, 0, 6])
    assert good["ok"], good
    assert good["concepts"][0]["spoken_words"] == 2
    assert good["concepts"][0]["timing"][0]["speech_seconds"] == 1
    assert "W_UNDER_BUDGET" not in codes(good, "warnings")
    bad = check(shape, [6, 0, 6])
    assert "E_BUDGET" in codes(bad)
    assert any("silent visuals" in e["msg"] for e in bad["concepts"][0]["errors"])


def test_repeated_speakers_get_distinct_windows_and_rates():
    shape = profile([
        {"id": "turn", "speaker": "host", "seconds": 3, "words_per_second": 3.4},
        {"id": "turn", "speaker": "guest", "seconds": 6, "speech_seconds": 4, "words_per_second": 1.9},
    ])
    rows = check(shape, [9, 7])["concepts"][0]["timing"]
    assert [r["word_budget"] for r in rows] == [10, 8]
    assert [r["slot"] for r in rows] == [0, 1]
    assert rows[1]["required_words_per_second"] == 1.75


def test_reference_target_keeps_guidance_and_hard_limit():
    refs = [{"id": "r1", "source": "Chosen creator clip", "observed": True, "observed_scope": "audio"}]
    shape = profile([{"id": "proof", "seconds": 15, "max_words": 28}],
                    words_per_second=3.4,
                    pacing_source={"kind": "reference", "detail": "Measured chosen creator read.", "reference_id": "r1"},
                    delivery_guidance={"words_per_second": 1.9, "basis": "recipe_estimate", "detail": "Existing untested recipe guidance."})
    before = copy.deepcopy(shape)
    report = check(shape, [40], strict=True, report_only=True, references=refs)
    row = report["concepts"][0]["timing"][0]
    assert row["target_words"] == 51 and row["word_budget"] == 28
    assert row["pacing_source"]["reference_id"] == "r1"
    assert row["delivery_guidance"]["basis"] == "recipe_estimate"
    assert "E_BUDGET" in codes(report)
    assert {"W_PACING_EXPERIMENT", "W_PACING_LIMIT"} <= codes(report, "warnings")
    assert shape == before


def test_guidance_is_not_claimed_as_an_engine_ceiling():
    shape = profile([{"id": "creator", "seconds": 15}],
                    delivery_guidance={"words_per_second": 1.9, "basis": "observed_render", "detail": "Prior render request; baseline only."})
    report = check(shape, [40])
    assert report["ok"]
    assert "W_PACING_EXPERIMENT" in codes(report, "warnings")
    assert report["concepts"][0]["timing"][0]["word_budget"] == 45


@pytest.mark.parametrize("scope", ["transcript", None])
def test_reference_cadence_requires_observed_audio(scope):
    shape = profile([{"id": "hook", "seconds": 3}], pacing_source={"kind": "reference", "detail": "Reference.", "reference_id": "r1"})
    report = check(shape, [8], references=[{"id": "r1", "observed": True, "observed_scope": scope}])
    assert not report["ok"] and "observed audio/video" in report["input_errors"][0]


@pytest.mark.parametrize("patch", [
    {"pause_seconds": -1}, {"pause_seconds": 4}, {"speech_seconds": 4},
    {"speech_seconds": 2, "pause_seconds": 2}, {"seconds": -1},
    {"words_per_second": 0}, {"words_per_second": float("nan")},
    {"words_per_second": True}, {"speech_seconds": "2"}, {"max_words": 2.5},
])
def test_invalid_timing_returns_input_error(patch):
    beat = {"id": "hook", "seconds": 3, **patch}
    report = check(profile([beat]), [8])
    assert not report["ok"] and report["input_errors"]


def test_missing_beat_duration_cannot_hide_a_pause():
    report = check(profile([{"id": "hook", "pause_seconds": 1}]), [8])
    assert not report["ok"] and report["input_errors"]


def test_zero_speech_window_rejects_words_and_hook_alternatives():
    shape = profile([{"id": "hook", "seconds": 3, "pause_seconds": 3}])
    cands = candidates(shape, [1])
    cands["concepts"][0]["hooks"] = [{"id": "h1", "text": "Pocket proof"}]
    report = ls.lint(cands, shape)
    assert len([e for e in report["concepts"][0]["errors"] if e["code"] == "E_BUDGET"]) == 3


def test_chat_and_lyrics_keep_separate_text_budgets():
    shape = profile([
        {"id": "chat", "kind": "bubble", "max_words": 10},
        {"id": "song", "kind": "lyric", "max_words": 10},
        {"id": "cta", "kind": "spoken", "seconds": 2},
    ])
    report = check(shape, [10, 10, 6])
    assert report["ok"]
    assert report["concepts"][0]["spoken_words"] == 6
    assert len(report["concepts"][0]["timing"]) == 1


def test_speech_profile_does_not_change_legacy_chat_reading_tolerance():
    shape = profile([{"id": "chat", "kind": "bubble", "seconds": 3}, {"id": "cta", "seconds": 2}])
    report = check(shape, [10, 6], strict=True, report_only=True)
    assert report["ok"]
    assert report["concepts"][0]["spoken_words"] == 6


def test_legacy_shape_keeps_explicit_override_and_provisional_provenance():
    shape = {"words_per_second": 3, "beats": [{"id": "hook", "seconds": 3, "max_words": 20}]}
    report = check(shape, [20])
    assert report["ok"]
    assert report["concepts"][0]["timing"][0]["word_budget"] == 20
    assert report["concepts"][0]["timing"][0]["pacing_source"]["kind"] == "legacy"
    fallback = check({"beats": [{"id": "hook", "seconds": 3}]}, [8])
    assert fallback["concepts"][0]["timing"][0]["pacing_source"]["kind"] == "fallback"


def test_cli_strict_checks_timing_preserves_lines_and_report_only(tmp_path):
    shape = profile([
        {"id": "hook", "seconds": 4, "speech_seconds": 1},
        {"id": "proof", "seconds": 5, "words_per_second": 2},
        {"id": "cta", "seconds": 3},
        {"id": "endcard", "kind": "on_screen", "seconds": 3, "max_words": 6},
    ], cta_beat="cta", total_seconds=15)
    cands = candidates(shape, [4, 10, 7, 6])
    for name, value in [("shape", shape), ("candidates", cands)]:
        (tmp_path / f"{name}.json").write_text(json.dumps(value))
    script = pathlib.Path(ls.__file__)
    cmd = [sys.executable, str(script), "--candidates", str(tmp_path / "candidates.json"),
           "--shape", str(tmp_path / "shape.json"), "--strict", "--out", str(tmp_path / "lint.json")]
    # report-only bypasses research requirements for verbatim user copy, but still reports defects.
    result = subprocess.run(cmd + ["--report-only"], capture_output=True, text=True)
    assert result.returncode == 0, result.stderr
    report = json.loads((tmp_path / "lint.json").read_text())
    assert not report["ok"] and "E_BUDGET" in codes(report)
    assert report["concepts"][0]["timing"][0]["word_budget"] == 3
    assert json.loads((tmp_path / "candidates.json").read_text()) == cands
    cands["concepts"][0]["beats"][0]["text"] = "Pocket proof stays"
    (tmp_path / "candidates.json").write_text(json.dumps(cands))
    repaired = subprocess.run(cmd + ["--report-only"], capture_output=True, text=True)
    assert repaired.returncode == 0
    assert json.loads((tmp_path / "lint.json").read_text())["ok"]
    # The real generated-script exit remains nonzero for invalid timing.
    shape["beats"][0]["speech_seconds"] = 6
    (tmp_path / "shape.json").write_text(json.dumps(shape))
    failed = subprocess.run(cmd, capture_output=True, text=True)
    assert failed.returncode == 2 and "speech_seconds" in failed.stdout


def test_generated_strict_cli_rejects_excess_then_passes_supported_plan(tmp_path):
    shape = profile([{"id": "hook", "seconds": 3}, {"id": "proof", "seconds": 5}, {"id": "cta", "seconds": 3}], cta_beat="cta")
    cands = candidates(shape, [5, 10, 7])
    shape["pacing_source"] = SOURCE
    shape["beats"][0]["speech_seconds"] = 1
    cmd = [sys.executable, ls.__file__, "--strict", "--out", str(tmp_path / "lint.json")]
    for name, value in [("candidates", cands), ("shape", shape)]:
        file = tmp_path / f"{name}.json"
        file.write_text(json.dumps(value))
        cmd.extend([f"--{name}", str(file)])
    result = subprocess.run(cmd, capture_output=True, text=True)
    assert result.returncode == 2, result.stderr
    report = json.loads((tmp_path / "lint.json").read_text())
    assert not report["input_errors"] and "E_BUDGET" in codes(report)
    # Extend only this run's speech window within the existing three-second beat.
    shape["beats"][0]["speech_seconds"] = 2
    (tmp_path / "shape.json").write_text(json.dumps(shape))
    repaired = subprocess.run(cmd, capture_output=True, text=True)
    assert repaired.returncode == 0, repaired.stdout + repaired.stderr
    assert json.loads((tmp_path / "candidates.json").read_text()) == cands


def test_critic_receives_resolved_windows_sources_and_preservation_rule():
    shape = profile([{"id": "hook", "seconds": 6, "speech_seconds": 2}],
                    delivery_guidance={"words_per_second": 1.9, "basis": "recipe_estimate", "detail": "Untested recipe estimate."})
    prompt = build_prompt(candidates(shape, [6])["concepts"], {}, {}, shape, "Creator demo")
    assert '"speech_seconds": 2.0' in prompt and '"word_budget": 6' in prompt
    assert '"required_words_per_second": 3.0' in prompt and "Untested recipe estimate" in prompt
    assert "Keep recipe limits and proof/CTA intact" in prompt


def test_total_runtime_rejects_inflated_windows_in_real_cli(tmp_path):
    shape = profile([{"id": "hook", "seconds": 10}, {"id": "proof", "seconds": 10}], total_seconds=10)
    cands = candidates(shape, [30, 30])
    for name, value in [("candidates", cands), ("shape", shape)]:
        (tmp_path / f"{name}.json").write_text(json.dumps(value))
    result = subprocess.run([sys.executable, ls.__file__, "--strict", "--candidates", str(tmp_path / "candidates.json"),
                             "--shape", str(tmp_path / "shape.json"), "--out", str(tmp_path / "lint.json")], capture_output=True, text=True)
    assert result.returncode == 2, result.stdout + result.stderr
    assert "E_TIMELINE" in codes(json.loads((tmp_path / "lint.json").read_text()))


def test_timeline_reserves_pause_visual_and_endcard_windows():
    shape = profile([{"id": "hook", "seconds": 3, "pause_seconds": 1},
                     {"id": "demo", "kind": "visual", "seconds": 4},
                     {"id": "card", "kind": "on_screen", "seconds": 4}], total_seconds=10)
    assert "E_TIMELINE" in codes(check(shape, [6, 0, 3], strict=True))
    shape["total_seconds"] = 11
    assert check(shape, [6, 0, 3], strict=True)["ok"]


def test_timeline_skips_unselected_optional_beats_and_keeps_variable_rates():
    shape = profile([{"id": "hook", "seconds": 2, "words_per_second": 4},
                     {"id": "optional", "seconds": 20, "optional": True},
                     {"id": "proof", "seconds": 4, "words_per_second": 1.5}], total_seconds=6)
    cands = candidates({"beats": [shape["beats"][0], shape["beats"][2]]}, [8, 6])
    report = ls.lint(cands, shape, strict=True)
    assert report["ok"], report
    assert [r["words_per_second"] for r in report["concepts"][0]["timing"]] == [4, 1.5]


def test_total_runtime_still_limits_legacy_explicit_override():
    shape = {"words_per_second": 3, "beats": [{"id": "hook", "seconds": 3, "max_words": 20}], "total_seconds": 3}
    assert "E_TIMELINE" in codes(check(shape, [20], strict=True))

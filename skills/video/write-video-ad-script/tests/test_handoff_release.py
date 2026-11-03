"""Exercise saved packages as fetched, including stale or mixed dependency files."""
import copy
import json
from pathlib import Path
import shutil
import subprocess
import sys

import pytest

SCRIPTS = Path(__file__).resolve().parents[1] / "scripts"
sys.path.insert(0, str(SCRIPTS))
from verify_handoff import fixture_inputs, verify_package, verify_catalog_response
from prepare_angle_context import select_context


def package_copy(tmp_path):
    package = tmp_path / "saved-writer"
    (package / "scripts").mkdir(parents=True)
    for name in ("prepare_angle_context.py", "lint_scripts.py"):
        shutil.copyfile(SCRIPTS / name, package / "scripts" / name)
    return package


def test_real_package_cli_contract_round_trip_and_negative_cases():
    report = verify_package(SCRIPTS.parent)
    assert report["ok"], report
    assert len(report["checks"]) == 11
    assert all(check["pass"] for check in report["checks"])
    assert set(report["sha256"]) == {"scripts/prepare_angle_context.py", "scripts/lint_scripts.py"}


def test_smoke_rejects_stale_prepare_with_no_brief_flag(tmp_path):
    package = package_copy(tmp_path)
    # A tiny old-parser stand-in: unsupported --brief must fail before any writing.
    (package / "scripts/prepare_angle_context.py").write_text(
        "import argparse\np=argparse.ArgumentParser()\n"
        "for flag in ('bank','brand-id','product-id','template-id','angle-id','out'):\n"
        " p.add_argument('--'+flag)\np.parse_args()\n")
    report = verify_package(package)
    assert not report["ok"]
    assert report["checks"][0]["name"] == "sourced_brief_round_trip"
    assert "unrecognized arguments: --brief" in report["checks"][0]["stderr"]


def test_smoke_rejects_mixed_new_prepare_and_lint_that_ignores_brief(tmp_path):
    package = package_copy(tmp_path)
    # Simulate a fetched linter that reports every fixture valid, as the older
    # missing-brief behavior does. Positive-only smoke would miss this mismatch.
    (package / "scripts/lint_scripts.py").write_text(
        "import json,pathlib,sys\n"
        "pathlib.Path(sys.argv[sys.argv.index('--out')+1]).write_text(json.dumps({'ok':True}))\n")
    report = verify_package(package)
    assert not report["ok"]
    failed = [c for c in report["checks"] if not c["pass"]]
    assert failed[0]["name"] == "strict_missing_brief_rejected"


def test_smoke_missing_dependency_is_explicit(tmp_path):
    report = verify_package(tmp_path)
    assert not report["ok"] and "missing scripts/prepare_angle_context.py" in report["error"]


def test_smoke_malformed_cli_output_returns_a_failed_report(tmp_path):
    package = package_copy(tmp_path)
    (package / "scripts/prepare_angle_context.py").write_text(
        "import pathlib,sys\npathlib.Path(sys.argv[sys.argv.index('--out')+1]).write_text('[]')\n")
    report = verify_package(package)
    assert not report["ok"] and "must be a JSON object" in report["error"]
    assert report["checks"][0]["pass"] is False


@pytest.mark.parametrize("bad_brief", [None, [], "not an object", 5, True])
def test_explicit_malformed_brief_cli_fails_without_creating_output(tmp_path, bad_brief):
    bank, _, _, _ = fixture_inputs()
    (tmp_path / "bank.json").write_text(json.dumps(bank))
    (tmp_path / "brief.json").write_text(json.dumps(bad_brief))
    result = subprocess.run([sys.executable, str(SCRIPTS / "prepare_angle_context.py"),
        "--bank", "bank.json", "--brand-id", "fixture-brand", "--product-id", "fixture-bottle",
        "--template-id", "fixture-demo", "--brief", "brief.json", "--out", "context.json"],
        cwd=tmp_path, capture_output=True, text=True)
    assert result.returncode == 2
    assert "creative_brief must be an object" in result.stderr and "Traceback" not in result.stderr
    assert not (tmp_path / "context.json").exists()


@pytest.mark.parametrize("bad_bank", [None, [], "not an object", 5])
def test_malformed_bank_stays_a_validation_error_when_brief_is_supplied(bad_bank):
    _, brief, _, _ = fixture_inputs()
    with pytest.raises(ValueError, match="angle bank must be an object"):
        select_context(bad_bank, "fixture-brand", "fixture-bottle", "fixture-demo", brief=brief)


def test_legacy_programmatic_none_and_input_immutability():
    bank, brief, _, _ = fixture_inputs()
    original = copy.deepcopy(bank)
    context = select_context(bank, "fixture-brand", "fixture-bottle", "fixture-demo", brief=brief)
    assert bank == original and context["creative_brief"] == brief
    legacy = select_context(bank, "fixture-brand", "fixture-bottle", "fixture-demo", brief=None)
    assert "creative_brief" not in legacy


def test_report_cli_writes_machine_readable_result(tmp_path):
    output = tmp_path / "results/writer.json"
    result = subprocess.run([sys.executable, str(SCRIPTS / "verify_handoff.py"),
        "--package-dir", str(SCRIPTS.parent), "--out", str(output)], capture_output=True, text=True)
    assert result.returncode == 0, result.stderr
    assert json.loads(output.read_text())["ok"] is True


def test_saved_catalog_response_checks_actual_contents_not_advertised_version(tmp_path):
    response = {"slug": "write-video-ad-script", "version": "1.0.0", "contentHash": "fixture-advertised-hash",
                "scripts": {name: (SCRIPTS / name).read_text() for name in ("prepare_angle_context.py", "lint_scripts.py")}}
    saved = tmp_path / "catalog.json"
    saved.write_text(json.dumps(response))
    report = verify_catalog_response(saved)
    assert report["ok"], report
    assert report["advertised_version"] == "1.0.0" and len(report["response_sha256"]) == 64
    assert report["package_dir"] is None
    assert report["advertised_content_hash"] == "fixture-advertised-hash"


@pytest.mark.parametrize("response", [None, {}, {"slug": "other"},
    {"slug": "write-video-ad-script", "scripts": []},
    {"slug": "write-video-ad-script", "scripts": {"../../prepare_angle_context.py": "print('unsafe')"}},
    {"slug": "write-video-ad-script", "scripts": {"prepare_angle_context.py": {"content": "not text"}}},
])
def test_malformed_catalog_response_fails_without_materializing_arbitrary_paths(tmp_path, response):
    saved = tmp_path / "catalog.json"
    saved.write_text(json.dumps(response))
    report = verify_catalog_response(saved)
    assert not report["ok"] and report["error"] and not report["checks"]

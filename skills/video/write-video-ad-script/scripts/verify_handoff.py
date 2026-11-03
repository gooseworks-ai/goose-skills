#!/usr/bin/env python3
"""Verify an actual saved writer package through its CLIs; no network or providers.

Run this checker from a reviewed release against the materialized package returned
by each intended connection. It detects an older prepare script and a stale lint
script, even when the package still calls itself the same version. The authored
fixture checks compatibility, not product truth or natural spoken performance.
"""
import argparse
import copy
from datetime import datetime, timezone
import hashlib
import json
from pathlib import Path
import subprocess
import sys
import tempfile


def fixture_inputs():
    bank = {
        "schema_version": "video-angle-bank.v1", "brand_id": "fixture-brand",
        "product_id": "fixture-bottle", "researched_at": "2026-10-06",
        "audience": "a fixture shopper inspecting a cap", "objective": "inspect closure",
        "offer": None, "cta": "Shop the bottle.",
        "facts": [{"id": "f1", "product_id": "fixture-bottle", "text": "A cap settles flat",
                   "source": "fixture://authored-product/f1"}],
        "quotes": [], "references": [],
        "angles": [{"id": "a1", "angle": "Inspect the cap", "promise": "See the cap settle",
                    "evidence_ids": ["f1"], "compatible_template_ids": ["fixture-demo"]}],
    }
    brief = {
        "brand_id": "fixture-brand", "product_id": "fixture-bottle",
        "sources": [{"id": "run", "source": "fixture://authored-brief"},
                    {"id": "feedback", "source": "fixture://authored-history"}],
        "mechanism": {"text": "The cap settles flat", "source_ids": ["f1"], "fact_ids": ["f1"]},
        "prior_decisions": [{"text": "Do not say game changer.", "avoid_phrase": "game changer",
                             "source_ids": ["feedback"], "scope": "project", "applies_to": "same fixture"}],
        "locked_copy": [{"text": "Shop the bottle.", "source_ids": ["run"]}],
        "unknowns": ["No leak evidence: explain only the visible closure."],
    }
    for key, text in {
        "product_variant": "Blue fixture bottle", "audience_situation": "Inspecting the cap",
        "objective": "Recognize the closure", "offer": "No offer supplied",
        "cta": "Shop the bottle.", "constraints": "No leak claim",
        "delivery_intent": "A plain explanation with a hold for the cap",
    }.items():
        brief[key] = {"text": text, "source_ids": ["run"]}
    shape = {
        "template_id": "fixture-demo", "format": "product-demo", "total_seconds": 6,
        "requires_visuals": True, "requires_creative_brief": True,
        "allowed_visual_modes": ["existing"], "available_asset_ids": ["fixture-clip"],
        "cta_beat": "cta", "words_per_second": 3,
        "pacing_source": {"kind": "brief", "detail": "Authored compatibility fixture; no heard speech."},
        "beats": [{"id": name, "seconds": 3, "kind": "spoken", "speaker": "narrator", "max_words": 8}
                  for name in ("hook", "cta")],
    }
    visual = {"description": "Authored fixture cap settles flat", "mode": "existing", "asset_ids": ["fixture-clip"]}
    candidates = {
        "brand_id": "fixture-brand", "product_id": "fixture-bottle", "template_id": "fixture-demo",
        "concepts": [{"id": "fixture-concept", "angle_id": "a1", "angle": "Inspect the cap",
                      "evidence_ids": ["f1"], "claims": [{"text": "Cap settles flat", "fact_ids": ["f1"]}],
                      "hooks": [{"id": "h1", "family": "demo", "text": "Watch the cap settle into place."}],
                      "beats": [{"id": name, "speaker": "narrator", "text": text, "visual": copy.deepcopy(visual)}
                                for name, text in (("hook", "Watch the cap settle into place."),
                                                   ("cta", "Shop the bottle."))]}],
    }
    return bank, brief, shape, candidates


def verify_package(package_dir):
    package = Path(package_dir).resolve()
    report = {"ok": False, "scope": "authored fixture CLI compatibility only",
              "checked_at": datetime.now(timezone.utc).isoformat(), "package_dir": str(package),
              "sha256": {}, "checks": []}
    names = ("prepare_angle_context.py", "lint_scripts.py")
    scripts = {name: package / "scripts" / name for name in names}
    try:
        for name, path in scripts.items():
            if not path.is_file():
                raise ValueError(f"Fetched package is missing scripts/{name}")
            report["sha256"]["scripts/" + name] = hashlib.sha256(path.read_bytes()).hexdigest()
        with tempfile.TemporaryDirectory(prefix="writer-handoff-") as temp:
            work = Path(temp)

            def save(name, data):
                (work / name).write_text(json.dumps(data), encoding="utf-8")

            def read(name):
                value = json.loads((work / name).read_text(encoding="utf-8"))
                if not isinstance(value, dict):
                    raise ValueError(f"{name} must be a JSON object")
                return value

            def run(name, script, args, expected):
                result = subprocess.run([sys.executable, str(scripts[script]), *args], cwd=work,
                                        capture_output=True, text=True, timeout=30)
                check = {"name": name, "exit_code": result.returncode, "expected_exit": expected,
                         "stdout": result.stdout[-4000:], "stderr": result.stderr[-4000:],
                         "pass": result.returncode == expected and "Traceback" not in result.stderr}
                report["checks"].append(check)
                if not check["pass"]:
                    raise ValueError(f"{name} failed; the fetched writer is incompatible or malformed")
                return check

            def require(check, condition, detail):
                if not condition:
                    check["pass"] = False
                    raise ValueError(detail)

            bank, brief, shape, candidates = fixture_inputs()
            for name, data in (("bank.json", bank), ("brief.json", brief), ("shape.json", shape), ("candidates.json", candidates)):
                save(name, data)
            prepare = ["--bank", "bank.json", "--brand-id", "fixture-brand", "--product-id", "fixture-bottle",
                       "--template-id", "fixture-demo", "--angle-id", "a1"]
            lint_args = ["--candidates", "candidates.json", "--shape", "shape.json", "--strict", "--out", "lint.json"]
            check = run("sourced_brief_round_trip", "prepare_angle_context.py",
                        prepare + ["--brief", "brief.json", "--out", "context.json"], 0)
            context = read("context.json")
            require(check, context.get("creative_brief") == brief and context.get("locked_angle_ids") == ["a1"],
                    "Prepared context lost the sourced brief or selected angle")
            check = run("strict_sourced_script", "lint_scripts.py", lint_args + ["--angle-context", "context.json"], 0)
            require(check, read("lint.json").get("ok") is True, "Positive lint did not return ok=true")

            check = run("legacy_no_brief_preparation", "prepare_angle_context.py", prepare + ["--out", "legacy.json"], 0)
            require(check, "creative_brief" not in read("legacy.json"), "Legacy preparation invented a brief")
            check = run("strict_missing_brief_rejected", "lint_scripts.py", lint_args + ["--angle-context", "legacy.json"], 2)
            result = read("lint.json")
            require(check, result.get("ok") is False and any("creative_brief" in str(e) for e in result.get("input_errors", [])),
                    "Missing brief must fail for the brief requirement, not an unrelated error")
            legacy_shape = dict(shape)
            del legacy_shape["requires_creative_brief"]
            save("shape.json", legacy_shape)
            check = run("legacy_shape_remains_readable", "lint_scripts.py", lint_args + ["--angle-context", "legacy.json"], 0)
            require(check, read("lint.json").get("ok") is True, "Legacy shape did not remain readable")
            save("shape.json", shape)

            for name, change, expected_code in (
                ("retrieved_rejection_enforced", "rejected", "E_PRIOR_REJECTION"),
                ("locked_copy_enforced", "locked", "E_LOCKED_COPY"),
            ):
                changed = copy.deepcopy(candidates)
                if change == "rejected":
                    changed["concepts"][0]["hooks"][0]["text"] = "A game changer."
                else:
                    changed["concepts"][0]["beats"][1]["text"] = "Buy this bottle."
                save("candidates.json", changed)
                check = run(name, "lint_scripts.py", lint_args + ["--angle-context", "context.json"], 2)
                require(check, expected_code in {e.get("code") for c in read("lint.json").get("concepts", []) for e in c.get("errors", [])},
                        f"Fetched lint did not enforce {expected_code}")

            for name, malformed in (("null_brief_rejected", None), ("array_brief_rejected", []),
                                    ("wrong_scope_rejected", dict(brief, product_id="another-product"))):
                save("bad-brief.json", malformed)
                run(name, "prepare_angle_context.py", prepare + ["--brief", "bad-brief.json", "--out", "bad-output.json"], 2)
            (work / "bad-brief.json").write_text("{invalid JSON", encoding="utf-8")
            run("invalid_json_brief_rejected", "prepare_angle_context.py",
                prepare + ["--brief", "bad-brief.json", "--out", "bad-output.json"], 2)
            report["ok"] = True
    except (OSError, ValueError, TypeError, AttributeError, subprocess.TimeoutExpired) as exc:
        report["error"] = str(exc)
        if report["checks"] and all(check["pass"] for check in report["checks"]):
            report["checks"][-1]["pass"] = False
            report["checks"][-1]["validation_error"] = str(exc)
    return report


def verify_catalog_response(response_path):
    """Materialize only the named offline helpers; never use response keys as paths."""
    path = Path(response_path).resolve()
    origin = {"catalog_response": str(path)}
    try:
        raw = path.read_bytes()
        response = json.loads(raw)
        if not isinstance(response, dict) or response.get("slug") != "write-video-ad-script":
            raise ValueError("catalog response must be the write-video-ad-script result payload")
        origin.update({"response_sha256": hashlib.sha256(raw).hexdigest(),
                       "advertised_version": response.get("version"),
                       "advertised_content_hash": response.get("contentHash")})
        scripts = response.get("scripts")
        if not isinstance(scripts, dict):
            raise ValueError("catalog response scripts must be a basename-to-content map")
        with tempfile.TemporaryDirectory(prefix="fetched-writer-") as temp:
            package = Path(temp)
            (package / "scripts").mkdir()
            for name in ("prepare_angle_context.py", "lint_scripts.py"):
                content = scripts.get(name)
                if not isinstance(content, str) or not content.strip():
                    raise ValueError(f"catalog response is missing scripts.{name} text")
                (package / "scripts" / name).write_text(content, encoding="utf-8")
            report = verify_package(package)
            report["package_dir"] = None  # temporary; the response and hashes are the durable provenance
            report.update(origin)
            return report
    except (OSError, ValueError, TypeError) as exc:
        return {"ok": False, "scope": "authored fixture CLI compatibility only", **origin,
                "sha256": {}, "checks": [], "error": str(exc)}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    source = parser.add_mutually_exclusive_group()
    source.add_argument("--package-dir", type=Path, help="Actual saved writer package root, containing scripts/")
    source.add_argument("--catalog-response", type=Path,
                        help="Saved catalog_fetch writer result payload with the scripts map")
    parser.add_argument("--out", type=Path, help="Save full report including hashes and CLI outcomes")
    args = parser.parse_args()
    report = (verify_catalog_response(args.catalog_response) if args.catalog_response
              else verify_package(args.package_dir or Path(__file__).resolve().parents[1]))
    if args.out:
        args.out.parent.mkdir(parents=True, exist_ok=True)
        args.out.write_text(json.dumps(report, indent=2) + "\n", encoding="utf-8")
    print(json.dumps(report, indent=2))
    return 0 if report["ok"] else 2


if __name__ == "__main__":
    raise SystemExit(main())

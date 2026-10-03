"""Free prompt-length regressions; no media binaries, provider keys or paid calls."""
import contextlib
import copy
import hashlib
import importlib.util
import io
import json
import os
from pathlib import Path
import re
import subprocess
import sys
import tempfile
import types
import unittest
from unittest.mock import patch

PACKAGE = Path(__file__).resolve().parents[1]
SCRIPTS = PACKAGE / "scripts"
sys.path.insert(0, str(SCRIPTS))
import brandkit
import format_spec

FLAGS = dict(pace=True, guards=True, mic=True, plain=True)
BASELINE_SHA256 = "4707108e8208386bff7b8c3f733c4105fabcc9dd634d68338db4da2512ab8a50"


class PromptBudgetTests(unittest.TestCase):
    def setUp(self):
        self.cfg = brandkit.load("demo-tallgrass-oat")
        self.prompt = format_spec.build_prompt(self.cfg, **FLAGS, prompt_version=2)

    def test_original_1259_words_warn_without_failing_or_rewriting(self):
        self.assertEqual(len(self.prompt.split()), 1259)
        self.assertEqual(hashlib.sha256(self.prompt.encode()).hexdigest(), BASELINE_SHA256)
        self.assertEqual(format_spec.lint(self.prompt, **FLAGS, prompt_version=2), [])
        advice = format_spec.prompt_warnings(self.prompt)
        self.assertEqual(len(advice), 1)
        self.assertIn("1259", advice[0])
        self.assertIn("1000-English-word guideline", advice[0])
        self.assertIn("Advisory only", advice[0])

    def test_guideline_boundary_is_advice_not_a_maximum(self):
        for count in (999, 1000, 1001, 1200, 1201, 1259, 2500):
            with self.subTest(words=count):
                text = " ".join(["detail"] * count)
                self.assertEqual(bool(format_spec.prompt_warnings(text)), count > 1000)
        extended = self.prompt + " " + " ".join(["detail"] * 2000)
        self.assertEqual(format_spec.lint(extended, **FLAGS, prompt_version=2), [])
        self.assertTrue(format_spec.prompt_warnings(extended))

    def test_long_prompt_still_fails_missing_location_and_bad_inputs(self):
        broken = re.sub("on that same corner", "", self.prompt, flags=re.I)
        broken += " " + " ".join(["detail"] * 100)
        self.assertGreater(len(broken.split()), 1200)
        errors = format_spec.lint(broken, **FLAGS, prompt_version=2)
        self.assertTrue(any("shot(s)" in error and "corner" in error for error in errors))
        self.assertTrue(format_spec.prompt_warnings(broken))
        incompatible = format_spec.lint(self.prompt, **FLAGS, mic_ref=True, prompt_version=2)
        self.assertTrue(any("may not hold both" in error for error in incompatible))
        banned = format_spec.lint(self.prompt + " cinematic", **FLAGS, prompt_version=2)
        self.assertTrue(any('contains "cinematic"' in error for error in banned))

    def test_all_bundled_legacy_prompt_snapshots_remain_identical(self):
        snapshots = json.loads((PACKAGE / "tests/fixtures/prompt-snapshots.json").read_text())
        self.assertEqual({row["config"] for row in snapshots}, set(brandkit.available()))
        for row in snapshots:
            with self.subTest(config=row["config"], version=row["version"]):
                cfg = brandkit.load(row["config"])
                prompt = format_spec.build_prompt(cfg, **row["flags"],
                                                  prompt_version=row["version"])
                self.assertEqual(hashlib.sha256(prompt.encode()).hexdigest(), row["sha256"])
                self.assertEqual(len(prompt.split()), row["words"])

    def run_cli(self, directory, brand=None, yes=False):
        # The real entry point runs in an empty project. Import/network guards make an
        # accidental provider call fail this test before any request can be sent.
        bootstrap = """
import builtins, runpy, sys
original_import = builtins.__import__
def guarded_import(name, *args, **kwargs):
    if name.split('.')[0] in {'media_proxy', 'fal_client'}:
        raise AssertionError('FORBIDDEN_PROVIDER_IMPORT: ' + name)
    return original_import(name, *args, **kwargs)
builtins.__import__ = guarded_import
def audit(event, args):
    if event in {'socket.connect', 'socket.getaddrinfo', 'urllib.Request'}:
        raise AssertionError('FORBIDDEN_NETWORK: ' + event)
sys.addaudithook(audit)
script = sys.argv[1]
sys.path.insert(0, str(__import__('pathlib').Path(script).parent))
sys.argv = sys.argv[1:]
runpy.run_path(script, run_name='__main__')
"""
        args = [sys.executable, "-c", bootstrap, str(SCRIPTS / "single_gen.py"),
                "--brand", str(brand) if brand else "demo-tallgrass-oat",
                "--pace", "--guards", "--mic", "--plain"]
        if yes:
            args.append("--yes")
        env = {key: value for key, value in os.environ.items()
               if not any(word in key.upper() for word in ("TOKEN", "API_KEY", "FAL_KEY"))}
        return subprocess.run(args, cwd=directory, env=env, text=True,
                              capture_output=True, timeout=20)

    def test_real_cli_dry_run_succeeds_from_empty_project_without_provider(self):
        with tempfile.TemporaryDirectory() as directory:
            result = self.run_cli(directory)
            self.assertEqual(result.returncode, 0, result.stdout + result.stderr)
            self.assertIn("PROMPT ADVISORY:", result.stdout)
            self.assertIn("1259 words", result.stdout)
            self.assertIn("prompt lint OK", result.stdout)
            self.assertIn(self.prompt, result.stdout)
            self.assertIn("dry run. Nothing sent.", result.stdout)
            self.assertEqual(list(Path(directory).iterdir()), [])

    def test_long_invalid_cli_prompt_fails_before_provider_even_with_yes(self):
        cfg = copy.deepcopy(self.cfg)
        cfg["question"] += " cinematic"
        cfg.pop("_path", None)
        with tempfile.TemporaryDirectory() as directory:
            brand = Path(directory) / "invalid.json"
            brand.write_text(json.dumps(cfg))
            result = self.run_cli(directory, brand, yes=True)
            self.assertNotEqual(result.returncode, 0)
            self.assertIn("PROMPT ADVISORY:", result.stdout)
            self.assertIn("PROMPT LINT FAILED", result.stdout)
            self.assertIn('contains "cinematic"', result.stdout)
            self.assertNotIn("FORBIDDEN_PROVIDER", result.stderr)

    def test_length_warning_cannot_bypass_missing_product_reference(self):
        with tempfile.TemporaryDirectory() as directory:
            result = self.run_cli(directory, yes=True)
            self.assertNotEqual(result.returncode, 0)
            self.assertIn("PROMPT ADVISORY:", result.stdout)
            self.assertIn("refusing to spend without the product reference", result.stderr)
            self.assertNotIn("FORBIDDEN_PROVIDER", result.stderr)

    def test_finished_cut_length_advice_does_not_weaken_failed_or_unrun_gate(self):
        # Import only the gate's reporting path; media analysis is outside this test.
        spec = importlib.util.spec_from_file_location("prompt_budget_cut_gate",
                                                     SCRIPTS / "check-cut.py")
        gate = importlib.util.module_from_spec(spec)
        with patch.dict(sys.modules, {name: types.ModuleType(name)
                                     for name in ("numpy", "build_looks")}):
            spec.loader.exec_module(gate)
        gate.record_prompt_advice(self.prompt, "[take-a] ")
        self.assertEqual(gate.warns, [])
        self.assertEqual(gate.fails, [])
        output = io.StringIO()
        with contextlib.redirect_stdout(output):
            self.assertEqual(gate.report(), 0)
        self.assertIn("D ADVISORY [take-a]", output.getvalue())
        self.assertIn("PASS", output.getvalue())
        gate.fails.extend(format_spec.lint(self.prompt + " cinematic", **FLAGS,
                                          prompt_version=2))
        with contextlib.redirect_stdout(io.StringIO()):
            self.assertEqual(gate.report(), 1)
            gate.fails.clear()
            gate.skips.append("I NOT RUN")
            self.assertEqual(gate.report(), 1)
            gate.skips.clear()
            gate.warns.append("unrelated blocking warning")
            self.assertEqual(gate.report(), 1)


if __name__ == "__main__":
    unittest.main()

"""Standard or Best (16 Oct 2026): the tier sets the still's quality and the takes' resolution,
and anything above the tier's default is an upgrade with a recorded reason. Free: dry runs and
planning only, nothing is generated."""
import json
from pathlib import Path
import subprocess
import sys
import tempfile
import unittest

SCRIPTS = Path(__file__).resolve().parents[1] / "scripts"
IDENTITY = ["--age", "34", "--gender", "woman", "--ethnicity", "South Asian",
            "--hair", "shoulder-length black hair", "--wardrobe", "plain charcoal crew-neck t-shirt",
            "--scene", "a lived-in home office, a full bookshelf behind her, in focus", "--no-voice-pair"]
CHARACTER = {"image": "character.png", "identity": "a White woman aged 28, long dark brown hair",
             "environment": "a lived-in bedroom", "capture": "phone", "recording": "counter"}
BEATS = {"beats": [{"id": 1, "start": 0.0, "end": 9.0, "vo": " ".join(["word"] * 20)},
                   {"id": 2, "start": 9.0, "end": 18.0, "vo": " ".join(["word"] * 20)}]}


def run(script, *args):
    return subprocess.run([sys.executable, str(SCRIPTS / script), *args], capture_output=True, text=True)


class StillQualityTests(unittest.TestCase):
    def quote(self, tmp, *extra):
        payload = Path(tmp) / "payload.json"
        r = run("make_character.py", *IDENTITY, "--out", str(Path(tmp) / "c"), "--dry-run",
                "--payload-out", str(payload), *extra)
        return r, (json.loads(payload.read_text()) if payload.exists() else None)

    def test_standard_is_medium_and_best_is_high(self):
        with tempfile.TemporaryDirectory() as tmp:
            r, quoted = self.quote(tmp)
            self.assertEqual(r.returncode, 0, r.stderr)
            self.assertEqual((quoted["body"]["quality"], quoted["quality_tier"]), ("medium", "standard"))
            saved = json.loads((Path(tmp) / "c" / "character.json").read_text())
            self.assertEqual((saved["quality_tier"], saved["quality"]), ("standard", "medium"))
            self.assertNotIn("upgrade", saved)
        with tempfile.TemporaryDirectory() as tmp:
            r, quoted = self.quote(tmp, "--tier", "best")
            self.assertEqual(r.returncode, 0, r.stderr)
            self.assertEqual(quoted["body"]["quality"], "high")
            self.assertNotIn("upgrade", quoted)

    def test_high_under_standard_needs_a_reason(self):
        with tempfile.TemporaryDirectory() as tmp:
            r, quoted = self.quote(tmp, "--quality", "high")
            self.assertNotEqual(r.returncode, 0)
            self.assertIn("--upgrade-reason", r.stderr)
            self.assertIsNone(quoted)
            r, _ = self.quote(tmp, "--quality", "high", "--upgrade-reason", "failed_attempt", "--upgrade-attempt", "op-still-3")
            self.assertNotEqual(r.returncode, 0)
            self.assertIn("--upgrade-why", r.stderr)

    def test_an_upgrade_cites_the_failed_attempt(self):
        with tempfile.TemporaryDirectory() as tmp:
            r, quoted = self.quote(tmp, "--quality", "high", "--upgrade-reason", "failed_attempt",
                                   "--upgrade-attempt", "op-still-3", "--upgrade-why", "the label text came out garbled twice at medium")
            self.assertEqual(r.returncode, 0, r.stderr)
            self.assertEqual(quoted["body"]["quality"], "high")
            self.assertEqual(quoted["upgrade"], {"setting": "image_quality", "from": "medium", "to": "high",
                                                 "reason": "failed_attempt", "failed_attempt_id": "op-still-3",
                                                 "why": "the label text came out garbled twice at medium",
                                                 # what the paid call adds, in the server's query names
                                                 "query": {"upgrade_reason": "failed_attempt", "upgrade_attempt": "op-still-3",
                                                           "upgrade_why": "the label text came out garbled twice at medium"}})
            saved = json.loads((Path(tmp) / "c" / "character.json").read_text())
            self.assertEqual(saved["upgrade"], quoted["upgrade"])
        with tempfile.TemporaryDirectory() as tmp:
            r, quoted = self.quote(tmp, "--quality", "high", "--upgrade-reason", "customer_asked",
                                   "--upgrade-quote", "make her picture as sharp as you can")
            self.assertEqual(r.returncode, 0, r.stderr)
            self.assertEqual(quoted["upgrade"]["user_quote"], "make her picture as sharp as you can")
            self.assertEqual(quoted["upgrade"]["query"], {"upgrade_reason": "customer_asked",
                                                          "upgrade_quote": "make her picture as sharp as you can"})

    def test_a_reason_without_an_upgrade_is_refused(self):
        with tempfile.TemporaryDirectory() as tmp:
            r, _ = self.quote(tmp, "--tier", "best", "--quality", "high", "--upgrade-reason", "customer_asked",
                              "--upgrade-quote", "sharp please")
            self.assertNotEqual(r.returncode, 0)
            self.assertIn("not above", r.stderr)


class TakeResolutionTests(unittest.TestCase):
    def plan(self, tmp, *extra):
        cut, ch, out = Path(tmp) / "cut.json", Path(tmp) / "character.json", Path(tmp) / "takes"
        cut.write_text(json.dumps(BEATS))
        ch.write_text(json.dumps(CHARACTER))
        r = run("plan_takes.py", "--beats", str(cut), "--character", str(ch), "--out", str(out), "--plan-only", *extra)
        return r, (json.loads((out / "takes.json").read_text()) if (out / "takes.json").exists() else None)

    def test_768p_in_both_tiers(self):
        for tier in ("standard", "best"):
            with tempfile.TemporaryDirectory() as tmp:
                r, spec = self.plan(tmp, "--tier", tier)
                self.assertEqual(r.returncode, 0, r.stderr)
                self.assertEqual((spec["resolution"], spec["quality_tier"]), ("768P", tier))
                self.assertNotIn("upgrade", spec)

    def test_1080p_is_only_for_a_detail_shot(self):
        with tempfile.TemporaryDirectory() as tmp:
            # Best: a detail shot (a skin close-up) starts at 1080P, no upgrade.
            r, spec = self.plan(tmp, "--tier", "best", "--detail")
            self.assertEqual(r.returncode, 0, r.stderr)
            self.assertEqual(spec["resolution"], "1080P")
            self.assertNotIn("upgrade", spec)
            # Standard: 1080P needs a reason, and only for a detail shot.
            r, _ = self.plan(tmp, "--resolution", "1080P")
            self.assertNotEqual(r.returncode, 0)
            self.assertIn("pass --detail", r.stderr)
            r, _ = self.plan(tmp, "--detail", "--resolution", "1080P")
            self.assertNotEqual(r.returncode, 0)
            self.assertIn("--upgrade-reason", r.stderr)
            r, _ = self.plan(tmp, "--resolution", "1080P", "--upgrade-reason", "failed_attempt",
                             "--upgrade-attempt", "op-9", "--upgrade-why", "pores smeared at 768P twice")
            self.assertNotEqual(r.returncode, 0)
            self.assertIn("--detail", r.stderr)
            r, spec = self.plan(tmp, "--detail", "--resolution", "1080P", "--upgrade-reason", "failed_attempt",
                                "--upgrade-attempt", "op-9", "--upgrade-why", "pores smeared at 768P twice")
            self.assertEqual(r.returncode, 0, r.stderr)
            self.assertEqual((spec["resolution"], spec["upgrade"]["failed_attempt_id"]), ("1080P", "op-9"))
            # The customer may ask for 1080P on any shot (the server's rule); a failed check may not.
            r, spec = self.plan(tmp, "--tier", "best", "--resolution", "1080P", "--upgrade-reason", "customer_asked",
                                "--upgrade-quote", "sharper please")
            self.assertEqual(r.returncode, 0, r.stderr)
            self.assertEqual(spec["upgrade"]["query"], {"upgrade_reason": "customer_asked", "upgrade_quote": "sharper please"})

    def test_the_rest_refuse_a_first_take_made_at_another_resolution(self):
        """Switching resolution re-rolls the take, so the resolution is chosen before the first take."""
        with tempfile.TemporaryDirectory() as tmp:
            r, spec = self.plan(tmp)
            self.assertEqual(r.returncode, 0, r.stderr)
            self.assertGreater(len(spec["takes"]), 1)
            out = Path(spec["out"])
            (Path(tmp) / "character.png").write_bytes(b"\x89PNG\r\n\x1a\n" + b"0" * 64)
            spec["char"] = str(Path(tmp) / "character.png")
            first = spec["takes"][0]
            (out / ("%s-seed%d.mp4" % (first["id"], first["seed"]))).write_bytes(b"0" * 64)
            (out / "manifest.json").write_text(json.dumps({"model": spec["model"], "takes": [
                {**first, "payload": {"resolution": "1080P"}}]}))
            spec_path = out / "takes.json"
            spec_path.write_text(json.dumps(spec))
            r = run("run_takes.py", "--spec", str(spec_path))
            self.assertEqual(r.returncode, 0, r.stderr)
            self.assertIn("was made at 1080P but the spec asks for 768P", r.stdout)
            self.assertIn("--reseed %s" % first["id"], r.stdout)


if __name__ == "__main__":
    unittest.main()

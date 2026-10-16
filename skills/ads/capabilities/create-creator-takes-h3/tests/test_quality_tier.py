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
            r, quoted = self.quote(tmp, "--quality", "high", "--upgrade-reason", "failed_attempt", "--shot-scene", "1",
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
            r, quoted = self.quote(tmp, "--quality", "high", "--upgrade-reason", "customer_asked", "--shot-scene", "1",
                                   "--upgrade-quote", "make her picture as sharp as you can")
            self.assertEqual(r.returncode, 0, r.stderr)
            self.assertEqual(quoted["upgrade"]["user_quote"], "make her picture as sharp as you can")
            self.assertEqual(quoted["upgrade"]["query"], {"upgrade_reason": "customer_asked",
                                                          "upgrade_quote": "make her picture as sharp as you can"})

    def test_a_shared_still_upgrades_without_a_scene(self):
        """The server lets a shared still (cast, set) leave out shot_scene, even on a picture upgrade."""
        with tempfile.TemporaryDirectory() as tmp:
            r, quoted = self.quote(tmp, "--quality", "high", "--upgrade-reason", "failed_attempt",
                                   "--upgrade-attempt", "op-1", "--upgrade-why", "label garbled at medium")
            self.assertEqual(r.returncode, 0, r.stderr)
            self.assertNotIn("shot_scene", quoted["query"])
            r, _ = self.quote(tmp, "--shot-scene", "0")
            self.assertNotEqual(r.returncode, 0)

    def test_best_retries_a_high_picture_from_the_allowance(self):
        """#2085: a Best picture already at high that failed may retry at high as a still_retry."""
        with tempfile.TemporaryDirectory() as tmp:
            r, quoted = self.quote(tmp, "--tier", "best", "--upgrade-reason", "failed_attempt",
                                   "--upgrade-attempt", "op-7", "--upgrade-why", "extra fingers at high")
            self.assertEqual(r.returncode, 0, r.stderr)
            self.assertEqual(quoted["body"]["quality"], "high")
            self.assertEqual(quoted["upgrade"]["kind"], "still_retry")
            self.assertEqual(quoted["query"], {"upgrade_reason": "failed_attempt", "upgrade_attempt": "op-7",
                                               "upgrade_why": "extra fingers at high"})
            r, _ = self.quote(tmp, "--tier", "best", "--upgrade-reason", "failed_attempt", "--upgrade-attempt", "op-7")
            self.assertNotEqual(r.returncode, 0)

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

    def test_1080p_only_when_the_customer_asks(self):
        """16 Oct: no video above 768P unless the customer asks; never after a failed check alone."""
        with tempfile.TemporaryDirectory() as tmp:
            r, _ = self.plan(tmp, "--resolution", "1080P")
            self.assertNotEqual(r.returncode, 0)
            self.assertIn("customer's new yes", r.stderr)
            r, _ = self.plan(tmp, "--tier", "best", "--resolution", "1080P", "--upgrade-reason", "failed_attempt",
                             "--upgrade-attempt", "op-9", "--upgrade-why", "pores smeared at 768P twice")
            self.assertNotEqual(r.returncode, 0)
            self.assertIn("never a failed check alone", r.stderr)
            r, spec = self.plan(tmp, "--resolution", "1080P", "--upgrade-reason", "customer_asked",
                                "--upgrade-quote", "sharper please")
            self.assertEqual(r.returncode, 0, r.stderr)
            self.assertEqual(spec["resolution"], "1080P")
            self.assertEqual(spec["upgrade"]["query"], {"upgrade_reason": "customer_asked", "upgrade_quote": "sharper please"})

    def make_takes(self, tmp, made_at):
        """A planned spec whose takes in made_at exist on disk, recorded at the given resolutions."""
        r, spec = self.plan(tmp)
        self.assertEqual(r.returncode, 0, r.stderr)
        out = Path(spec["out"])
        (Path(tmp) / "character.png").write_bytes(b"\x89PNG\r\n\x1a\n" + b"0" * 64)
        spec["char"] = str(Path(tmp) / "character.png")
        made = []
        for t in spec["takes"]:
            if t["id"] in made_at:
                (out / ("%s-seed%d.mp4" % (t["id"], t["seed"]))).write_bytes(b"0" * 64)
                made.append({**t, "payload": {"resolution": made_at[t["id"]]}})
        (out / "manifest.json").write_text(json.dumps({"model": spec["model"], "takes": made}))
        spec_path = out / "takes.json"
        spec_path.write_text(json.dumps(spec))
        return spec, spec_path

    def test_an_upgraded_take_speaks_one_scene(self):
        """The server checks an upgrade per scene: a take over two scenes can't name its shot."""
        with tempfile.TemporaryDirectory() as tmp:
            spec, path = self.make_takes(tmp, {})
            spec["upgrade"] = {"reason": "customer_asked", "user_quote": "sharper",
                               "query": {"upgrade_reason": "customer_asked", "upgrade_quote": "sharper"}}
            spec["resolution"] = "1080P"
            spec["takes"][0]["beats"] = [1, 2]
            path.write_text(json.dumps(spec))
            r = run("run_takes.py", "--spec", str(path))
            self.assertNotEqual(r.returncode, 0)
            self.assertIn("t1 speak more than one script scene", r.stderr)
            spec["takes"][0]["beats"] = [1]
            path.write_text(json.dumps(spec))
            r = run("run_takes.py", "--spec", str(path))
            self.assertEqual(r.returncode, 0, r.stderr)

    def test_takes_made_at_another_resolution_are_refused_even_when_nothing_is_left_to_make(self):
        """Switching resolution re-rolls the take, so the resolution is chosen before the first take."""
        with tempfile.TemporaryDirectory() as tmp:
            spec, path = self.make_takes(tmp, {"t1": "1080P"})
            r = run("run_takes.py", "--spec", str(path))
            self.assertNotEqual(r.returncode, 0)
            self.assertIn("t1 were made at another resolution than the spec's 768P", r.stderr)
        with tempfile.TemporaryDirectory() as tmp:
            # Every take exists, t2 at the old resolution: refused before "nothing to generate".
            spec, path = self.make_takes(tmp, {"t1": "768P", "t2": "1080P"})
            r = run("run_takes.py", "--spec", str(path))
            self.assertNotEqual(r.returncode, 0)
            self.assertIn("t2 were made at another resolution", r.stderr)
            self.assertIn("--reseed t2", r.stderr)
        with tempfile.TemporaryDirectory() as tmp:
            spec, path = self.make_takes(tmp, {"t1": "768P", "t2": "768P"})
            r = run("run_takes.py", "--spec", str(path))
            self.assertEqual(r.returncode, 0, r.stderr)
            self.assertIn("nothing to generate", r.stdout)


class CallQueryTests(unittest.TestCase):
    """The server checks each call: the take or still names its scene and carries the upgrade fields."""

    def test_take_query_and_legacy_resolution(self):
        sys.path.insert(0, str(SCRIPTS))
        import run_takes
        spec = {"upgrade": {"query": {"upgrade_reason": "customer_asked", "upgrade_quote": "sharper"}}}
        self.assertEqual(run_takes.take_query(spec, {"beats": [3]}),
                         {"upgrade_reason": "customer_asked", "upgrade_quote": "sharper", "shot_scene": 3})
        self.assertEqual(run_takes.take_query({}, {"beats": [3, 4]}), {}, "a take over two scenes names none")
        self.assertEqual(run_takes.take_query({}, {"beats": ["hook"]}), {})
        # An older spec with no resolution and no tier was planned at 1080P and keeps it.
        self.assertEqual(run_takes.resolution({}), "1080P")
        self.assertEqual(run_takes.resolution({"quality_tier": "standard"}), "768P")
        self.assertEqual(run_takes.resolution({"resolution": "480P"}), "480P")

    def test_make_character_sends_its_scene_and_upgrade(self):
        with tempfile.TemporaryDirectory() as tmp:
            payload = Path(tmp) / "payload.json"
            r = run("make_character.py", *IDENTITY, "--out", str(Path(tmp) / "c"), "--dry-run", "--payload-out", str(payload),
                    "--shot-scene", "2", "--quality", "high", "--upgrade-reason", "failed_attempt",
                    "--upgrade-attempt", "op-4", "--upgrade-why", "the pack label came out garbled")
            self.assertEqual(r.returncode, 0, r.stderr)
            self.assertEqual(json.loads(payload.read_text())["query"],
                             {"upgrade_reason": "failed_attempt", "upgrade_attempt": "op-4",
                              "upgrade_why": "the pack label came out garbled", "shot_scene": 2})


if __name__ == "__main__":
    unittest.main()

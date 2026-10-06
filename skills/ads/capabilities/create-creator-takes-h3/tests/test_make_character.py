"""make_character.py writes a quotable payload on a dry run. Free: nothing is generated."""
import json
from pathlib import Path
import subprocess
import sys
import tempfile
import unittest

SCRIPT = Path(__file__).resolve().parents[1] / "scripts" / "make_character.py"
IDENTITY = ["--age", "34", "--gender", "woman", "--ethnicity", "South Asian",
            "--hair", "shoulder-length black hair, slightly frizzy at the crown",
            "--wardrobe", "plain charcoal crew-neck t-shirt",
            "--scene", "a lived-in home office, a full bookshelf behind her, in focus"]


def run(*args):
    return subprocess.run([sys.executable, str(SCRIPT), *args], capture_output=True, text=True)


class MakeCharacterPayloadTests(unittest.TestCase):
    def test_dry_run_writes_the_exact_payload_and_generates_nothing(self):
        with tempfile.TemporaryDirectory() as tmp:
            out = Path(tmp) / "character"
            payload_file = Path(tmp) / "quote" / "payload.json"
            r = run(*IDENTITY, "--out", str(out), "--dry-run", "--payload-out", str(payload_file))
            self.assertEqual(r.returncode, 0, r.stderr)
            quoted = json.loads(payload_file.read_text())
            self.assertEqual(quoted["model"], "fal-ai/nano-banana-pro")
            self.assertEqual(quoted["body"]["resolution"], "4K")
            self.assertEqual(quoted["body"]["aspect_ratio"], "9:16")
            self.assertIn("bokeh background", quoted["body"]["negative_prompt"])
            self.assertIn("DEEP focus", quoted["body"]["prompt"])
            self.assertEqual(quoted["body"]["prompt"], (out / "character-prompt.txt").read_text())
            self.assertFalse((out / "character.png").exists())
            self.assertIn("dry run, nothing generated", r.stdout)

    def test_seed_is_part_of_the_quoted_body(self):
        with tempfile.TemporaryDirectory() as tmp:
            payload_file = Path(tmp) / "payload.json"
            r = run(*IDENTITY, "--out", str(Path(tmp) / "c"), "--seed", "7", "--dry-run",
                    "--payload-out", str(payload_file))
            self.assertEqual(r.returncode, 0, r.stderr)
            self.assertEqual(json.loads(payload_file.read_text())["body"]["seed"], 7)

    def test_missing_identity_argument_stops_before_any_payload(self):
        with tempfile.TemporaryDirectory() as tmp:
            payload_file = Path(tmp) / "payload.json"
            without_scene = IDENTITY[:-2]
            r = run(*without_scene, "--out", str(Path(tmp) / "c"), "--dry-run",
                    "--payload-out", str(payload_file))
            self.assertNotEqual(r.returncode, 0)
            self.assertIn("--scene", r.stderr)
            self.assertFalse(payload_file.exists())


if __name__ == "__main__":
    unittest.main()

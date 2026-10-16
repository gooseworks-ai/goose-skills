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
            "--scene", "a lived-in home office, a full bookshelf behind her, in focus", "--no-voice-pair"]


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
            # Defaults: GPT Image 2, phone capture in a lived-in room, deep focus, no bokeh, no retouching.
            self.assertEqual(quoted["model"], "openai/gpt-image-2")
            self.assertEqual(quoted["body"]["image_size"], {"width": 1088, "height": 1920})
            self.assertEqual(quoted["body"]["quality"], "medium")  # Standard, the default tier
            self.assertNotIn("seed", quoted["body"])
            prompt = quoted["body"]["prompt"]
            self.assertIn("bokeh background", prompt)
            self.assertIn("DEEP focus", prompt)
            self.assertIn("lived-in room", prompt)
            self.assertIn("No retouching, no skin smoothing, no beauty filter, no cinematic grade.", prompt)
            for banned in ("dermatological", "micro-shadow", "cinematographer", "medium format"):
                self.assertNotIn(banned, prompt)
            self.assertIn("no invented scars, acne marks", prompt)
            negative = json.loads((SCRIPT.parent / "character-prompt.json").read_text())["negative_prompt"]
            self.assertEqual(prompt, (out / "character-prompt.txt").read_text() + "\n\nAvoid: " + negative)
            saved = json.loads((out / "character.json").read_text())
            self.assertEqual((saved["capture"], saved["focus"]), ("phone", "deep"))
            self.assertFalse((out / "character.png").exists())
            self.assertIn("dry run, nothing generated", r.stdout)

    def test_seed_is_part_of_the_quoted_body(self):
        with tempfile.TemporaryDirectory() as tmp:
            payload_file = Path(tmp) / "payload.json"
            r = run(*IDENTITY, "--out", str(Path(tmp) / "c"), "--seed", "7", "--dry-run",
                    "--model", "fal-ai/nano-banana-pro", "--payload-out", str(payload_file))
            self.assertEqual(r.returncode, 0, r.stderr)
            self.assertEqual(json.loads(payload_file.read_text())["body"]["seed"], 7)
            # GPT Image 2 has no seed: refused rather than silently dropped.
            r = run(*IDENTITY, "--out", str(Path(tmp) / "c2"), "--seed", "7", "--dry-run")
            self.assertNotEqual(r.returncode, 0)

    def test_phone_observer_is_a_third_person_shot_that_never_looks_at_the_lens(self):
        with tempfile.TemporaryDirectory() as tmp:
            payload_file = Path(tmp) / "payload.json"
            out = Path(tmp) / "c"
            r = run(*IDENTITY, "--capture", "phone_observer", "--out", str(out), "--dry-run",
                    "--payload-out", str(payload_file))
            self.assertEqual(r.returncode, 0, r.stderr)
            prompt = json.loads(payload_file.read_text())["body"]["prompt"]
            self.assertIn("filmed by a friend", prompt)
            self.assertIn("not looking at the lens", prompt)
            self.assertNotIn("looking into the lens", prompt)
            self.assertEqual(json.loads((out / "character.json").read_text())["recording"], "observer")

    def test_marks_only_when_the_user_chose_them(self):
        with tempfile.TemporaryDirectory() as tmp:
            r = run(*IDENTITY, "--marks", "a small mole on the left cheek", "--out", str(Path(tmp) / "c"), "--dry-run")
            self.assertNotEqual(r.returncode, 0)
            self.assertIn("--marks-approved", r.stderr)

    def test_missing_identity_argument_stops_before_any_payload(self):
        with tempfile.TemporaryDirectory() as tmp:
            payload_file = Path(tmp) / "payload.json"
            without_scene = IDENTITY[:-3] + ["--no-voice-pair"]
            r = run(*without_scene, "--out", str(Path(tmp) / "c"), "--dry-run",
                    "--payload-out", str(payload_file))
            self.assertNotEqual(r.returncode, 0)
            self.assertIn("--scene", r.stderr)
            self.assertFalse(payload_file.exists())


if __name__ == "__main__":
    unittest.main()

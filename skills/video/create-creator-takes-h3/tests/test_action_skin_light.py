"""2.5.0: an action shot is not a talking head, a skin condition the product treats is shown, and
every capture carries one light lock. Free: --dry-run only, nothing is generated."""
import json
from pathlib import Path
import subprocess
import sys
import tempfile
import unittest

SCRIPT = Path(__file__).resolve().parents[1] / "scripts" / "make_character.py"
IDENTITY = ["--age", "24", "--gender", "woman", "--ethnicity", "White",
            "--hair", "long brown hair, loosely tied back",
            "--wardrobe", "plain grey hoodie",
            "--scene", "a lived-in bathroom, a mirror and a cluttered shelf behind her, in focus", "--no-voice-pair"]
LIGHT = ("Window or lamp light from one side, so the far side of the face is a little darker; normal phone "
         "exposure, highlights not blown out, no HDR look. Matte skin with no added shine, no over-sharpening.")


def make(tmp, *args):
    out = Path(tmp) / "c"
    payload = Path(tmp) / "payload.json"
    r = subprocess.run([sys.executable, str(SCRIPT), *IDENTITY, *args, "--out", str(out), "--dry-run",
                        "--payload-out", str(payload)], capture_output=True, text=True)
    if r.returncode:
        return r, None, None, None
    body = json.loads(payload.read_text())["body"]
    prompt, _, negative = body["prompt"].partition("\n\nAvoid: ")
    return r, prompt, negative, json.loads((out / "character.json").read_text())


class ActionShotTests(unittest.TestCase):
    def test_an_action_frames_the_action_not_a_talking_head(self):
        with tempfile.TemporaryDirectory() as tmp:
            r, prompt, _, saved = make(tmp, "--action", "she presses a pimple patch onto her chin")
            self.assertEqual(r.returncode, 0, r.stderr)
            self.assertIn("framed on the action", prompt)
            self.assertIn("The action: she presses a pimple patch onto her chin.", prompt)
            self.assertIn("eyes on the task", prompt)
            self.assertIn("The hands are in use on the action and in frame", prompt)
            self.assertIn("The head occupies 25 to 40 percent of the frame", prompt)
            # None of the talking-head defaults.
            for talking in ("squared to camera", "looking into the lens", "gaze toward the lens",
                            "both hands are free", "45 to 55 percent"):
                self.assertNotIn(talking, prompt)
            self.assertEqual(saved["shot"], "action")
            self.assertIn("shot     : action", r.stdout)

    def test_phone_observer_is_an_action_shot_with_a_small_head(self):
        with tempfile.TemporaryDirectory() as tmp:
            r, prompt, _, saved = make(tmp, "--capture", "phone_observer")
            self.assertEqual(r.returncode, 0, r.stderr)
            self.assertEqual(saved["shot"], "action")
            self.assertIn("20 to 35 percent", prompt)
            self.assertNotIn("looking into the lens", prompt)
            r, _, _, _ = make(tmp, "--capture", "phone_observer", "--shot", "talking")
            self.assertNotEqual(r.returncode, 0, "phone_observer never looks at the lens")

    def test_no_action_stays_a_talking_head_and_shot_talking_keeps_it_with_an_action(self):
        with tempfile.TemporaryDirectory() as tmp:
            r, prompt, _, saved = make(tmp)
            self.assertEqual(r.returncode, 0, r.stderr)
            self.assertEqual(saved["shot"], "talking")
            self.assertIn("looking into the lens", prompt)
            self.assertIn("both hands are free", prompt)
            self.assertIn("45 to 55 percent", prompt)
        with tempfile.TemporaryDirectory() as tmp:
            r, prompt, _, saved = make(tmp, "--action", "she holds up the box", "--shot", "talking")
            self.assertEqual(r.returncode, 0, r.stderr)
            self.assertEqual(saved["shot"], "talking")
            self.assertIn("looking into the lens", prompt)
            self.assertNotIn("The action:", prompt)
            self.assertIn("While talking to the lens: she holds up the box.", prompt)
            self.assertNotIn("both hands are free", prompt)

    def test_a_given_framing_and_face_fill_win(self):
        with tempfile.TemporaryDirectory() as tmp:
            r, prompt, _, _ = make(tmp, "--action", "she stirs the pot", "--framing", "hands and pot from above",
                                   "--face-fill", "10 to 15 percent")
            self.assertEqual(r.returncode, 0, r.stderr)
            self.assertIn("hands and pot from above. The action: she stirs the pot.", prompt)
            self.assertIn("10 to 15 percent", prompt)


class SkinConditionTests(unittest.TestCase):
    def test_a_condition_the_product_treats_is_shown(self):
        with tempfile.TemporaryDirectory() as tmp:
            r, prompt, negative, saved = make(tmp, "--skin-condition", "a few small acne spots on the chin")
            self.assertEqual(r.returncode, 0, r.stderr)
            self.assertIn("The skin shows a few small acne spots on the chin, because the product treats it", prompt)
            self.assertIn("no other invented scars, moles or marks", prompt)
            self.assertNotIn("no invented scars, acne marks", prompt)
            self.assertEqual(saved["skin_condition"], "a few small acne spots on the chin")
            self.assertIn("greasy shine", negative, "a non-oily condition keeps the shine negative")

    def test_an_oily_condition_is_not_fought_by_the_light_lock_or_the_negative(self):
        with tempfile.TemporaryDirectory() as tmp:
            r, prompt, negative, _ = make(tmp, "--skin-condition", "visible blackheads on the nose, oily T-zone")
            self.assertEqual(r.returncode, 0, r.stderr)
            self.assertIn("Matte skin with no added shine beyond the stated skin condition", prompt)
            self.assertNotIn("greasy shine", negative)

    def test_no_condition_keeps_the_no_forced_marks_rule(self):
        with tempfile.TemporaryDirectory() as tmp:
            r, prompt, _, saved = make(tmp)
            self.assertEqual(r.returncode, 0, r.stderr)
            self.assertIn("no invented scars, acne marks, moles, greasy shine", prompt)
            self.assertNotIn("skin_condition", saved)
            r, _, _, _ = make(tmp, "--skin-condition", "  ")
            self.assertNotEqual(r.returncode, 0)
            self.assertIn("--skin-condition is empty", r.stderr)


class LightLockTests(unittest.TestCase):
    def test_every_capture_carries_the_light_lock(self):
        for capture in ("phone", "phone_observer"):
            with tempfile.TemporaryDirectory() as tmp:
                r, prompt, _, _ = make(tmp, "--capture", capture)
                self.assertEqual(r.returncode, 0, r.stderr)
                self.assertIn(LIGHT, prompt, capture)
                self.assertNotIn("Natural room or window light", prompt)
        with tempfile.TemporaryDirectory() as tmp:
            r, prompt, _, _ = make(tmp, "--capture", "studio")
            self.assertEqual(r.returncode, 0, r.stderr)
            self.assertIn("no HDR look. Matte skin with no added shine, no over-sharpening.", prompt)


if __name__ == "__main__":
    unittest.main()

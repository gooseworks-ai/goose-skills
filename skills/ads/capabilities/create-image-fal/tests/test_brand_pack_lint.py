"""1.3.0: a brand-pack prompt that asks for an unprinted, blank, unlabeled or back-facing pack is
refused, and a pack held on screen needs GPT Image 2 edit with the real photo as image 1. Free:
every refusal stops before any upload or paid call."""
from pathlib import Path
import subprocess
import sys
import unittest

SCRIPTS = Path(__file__).resolve().parents[1] / "scripts"
sys.path.insert(0, str(SCRIPTS))
from brand_pack_lint import FRONT, HELD_MODEL, blank_words, lint_brand_pack, with_front_line  # noqa: E402

# The 15 Oct test video's own prompts.
SACHET = ("The left hand holds an already-open cream-colored food pouch with its unprinted back facing the "
          "camera, ready to put it into a small empty waste bowl. No printed words.")
POUR = "The unprinted back of the pouch faces the camera. A small amount of dry dark lentil pieces is visible."
GOOD = "She tips the open pouch of dal into the pot of boiling water; steam rises, her eyes on the pot."


class BlankWordsTests(unittest.TestCase):
    def test_the_test_videos_prompts_are_caught(self):
        self.assertEqual({label for label, _ in blank_words(SACHET)}, {"unprinted", "no printed words", "back facing the camera"})
        self.assertIn("unprinted", {label for label, _ in blank_words(POUR)})

    def test_each_word(self):
        for text, label in [("an unlabeled box", "unlabeled"), ("an unlabelled jar", "unlabeled"),
                            ("a blank white pouch", "blank"), ("the pack is blank", "blank"),
                            ("no printed words on the box", "no printed words"), ("a bottle without a label", "no printed words"),
                            ("the back of the pack faces the camera", "back facing the camera")]:
            self.assertIn(label, {l for l, _ in blank_words(text)}, text)

    def test_ordinary_words_pass(self):
        for text in (GOOD, "a blank wall behind her", "the pack front faces the camera",
                     "no text overlays or captions", "she types on a blank screen"):
            self.assertEqual(blank_words(text), [], text)


class LintTests(unittest.TestCase):
    def test_static_refuses_blank_words_only(self):
        self.assertEqual(lint_brand_pack(GOOD, "static", "fal-ai/nano-banana/edit", []), [])
        self.assertTrue(lint_brand_pack(SACHET, "static", HELD_MODEL, []))

    def test_held_needs_gpt_image_2_edit_and_the_real_photo_first(self):
        self.assertEqual(lint_brand_pack(GOOD, "held", HELD_MODEL, None, "pack.jpg"), [])
        self.assertEqual(lint_brand_pack(GOOD, "held", HELD_MODEL, ["pack.jpg", "presenter.png"], "pack.jpg"), [])
        wrong_model = lint_brand_pack(GOOD, "held", "fal-ai/nano-banana/edit", None, "pack.jpg")
        self.assertTrue(any("openai/gpt-image-2/edit" in p for p in wrong_model))
        no_photo = lint_brand_pack(GOOD, "held", HELD_MODEL, ["presenter.png"])
        self.assertTrue(any("--product-image" in p for p in no_photo))
        second = lint_brand_pack(GOOD, "held", HELD_MODEL, ["presenter.png", "pack.jpg"], "pack.jpg")
        self.assertTrue(any("must be image 1" in p for p in second))

    def test_the_front_line_is_added_once(self):
        once = with_front_line(GOOD)
        self.assertTrue(once.endswith(FRONT))
        self.assertEqual(with_front_line(once), once)


class GenImageRefusalTests(unittest.TestCase):
    """gen_image.py refuses before resolve_images (no upload) and before fal_generate (no paid call)."""

    def run_gen(self, *args):
        return subprocess.run([sys.executable, str(SCRIPTS / "gen_image.py"), *args, "--out", "/nonexistent/x.png"],
                              capture_output=True, text=True, env={"PATH": "/usr/bin:/bin", "HOME": "/nonexistent"})

    def test_a_blank_pack_prompt_is_refused_with_nothing_sent(self):
        import json
        r = self.run_gen("--model", HELD_MODEL, "--brand-product", "held", "--product-image", "/nonexistent/pack.jpg",
                         "--payload", json.dumps({"prompt": SACHET}))
        self.assertNotEqual(r.returncode, 0)
        self.assertIn("refused, nothing sent", r.stderr)
        self.assertIn("unprinted", r.stderr)

    def test_held_without_the_photo_or_on_another_model_is_refused(self):
        import json
        r = self.run_gen("--model", HELD_MODEL, "--brand-product", "held", "--payload", json.dumps({"prompt": GOOD}))
        self.assertIn("--product-image", r.stderr)
        r = self.run_gen("--model", "fal-ai/nano-banana/edit", "--brand-product", "held", "--product-image", "x.jpg",
                         "--payload", json.dumps({"prompt": GOOD}))
        self.assertIn("openai/gpt-image-2/edit", r.stderr)
        r = self.run_gen("--model", HELD_MODEL, "--product-image", "x.jpg", "--payload", json.dumps({"prompt": GOOD}))
        self.assertIn("--product-image goes with --brand-product held", r.stderr)


if __name__ == "__main__":
    unittest.main()

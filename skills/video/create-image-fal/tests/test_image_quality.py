import pathlib
import sys
import unittest

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parents[1] / "scripts"))
from image_quality import with_quality  # noqa: E402


class ImageQualityTest(unittest.TestCase):
    def test_standard_is_medium_and_best_is_high(self):
        self.assertEqual(with_quality("openai/gpt-image-2/edit", {"prompt": "x"})["quality"], "medium")
        self.assertEqual(with_quality("openai/gpt-image-2", {"prompt": "x"}, "best")["quality"], "high")

    def test_an_explicit_quality_wins(self):
        self.assertEqual(with_quality("openai/gpt-image-2", {"prompt": "x"}, "standard", "high")["quality"], "high")
        self.assertEqual(with_quality("openai/gpt-image-2", {"prompt": "x", "quality": "high"})["quality"], "high")

    def test_conflicts_and_other_models(self):
        with self.assertRaises(SystemExit):
            with_quality("openai/gpt-image-2", {"quality": "high"}, "standard", "medium")
        with self.assertRaises(SystemExit):
            with_quality("fal-ai/nano-banana", {}, "standard", "high")
        self.assertNotIn("quality", with_quality("fal-ai/nano-banana/edit", {"prompt": "x"}))


if __name__ == "__main__":
    unittest.main()

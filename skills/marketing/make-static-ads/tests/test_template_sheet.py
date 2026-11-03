import tempfile
import unittest
from pathlib import Path

from PIL import Image

import sys
sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "scripts"))

import template_sheet


class TemplateSheetTest(unittest.TestCase):
    def setUp(self):
        self.dir = Path(tempfile.mkdtemp())
        for name, size in (("a.png", (400, 500)), ("b.png", (800, 800)), ("c.png", (1080, 1920))):
            Image.new("RGB", size, "red").save(self.dir / name)

    def test_three_tiles_same_height(self):
        out = self.dir / "sheet.jpg"
        r = template_sheet.sheet(out, [("A (chosen)", str(self.dir / "a.png")), ("B", str(self.dir / "b.png")),
                                       ("C", str(self.dir / "c.png"))], title="Ad 1")
        self.assertEqual(r["tiles"], 3)
        img = Image.open(out)
        expected_w = template_sheet.PAD + sum(round(w * template_sheet.TILE_H / h) + template_sheet.PAD
                                              for w, h in ((400, 500), (800, 800), (1080, 1920)))
        self.assertEqual(img.width, expected_w)

    def test_parse_tile_keeps_query_in_url(self):
        self.assertEqual(template_sheet.parse_tile("B: library=https://e.com/a.jpg?v=17"), ("B: library", "https://e.com/a.jpg?v=17"))

    def test_bad_tile(self):
        with self.assertRaises(ValueError):
            template_sheet.parse_tile("no-source")

    def test_cli_error_exit(self):
        self.assertEqual(template_sheet.main([str(self.dir / "o.jpg"), "bad"]), 1)


if __name__ == "__main__":
    unittest.main()

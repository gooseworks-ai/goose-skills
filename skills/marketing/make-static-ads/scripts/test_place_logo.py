import json
import tempfile
import unittest
from pathlib import Path

from PIL import Image

import place_logo


class PlaceLogoTest(unittest.TestCase):
    def setUp(self):
        self.dir = Path(tempfile.mkdtemp())
        self.render = self.dir / "render.png"
        Image.new("RGB", (1000, 1250), (200, 60, 40)).save(self.render)
        self.logo = self.dir / "logo.png"
        logo = Image.new("RGBA", (400, 100), (0, 0, 0, 0))
        logo.paste((30, 30, 30, 255), (10, 10, 390, 90))
        logo.save(self.logo)

    def test_places_in_corner_with_contrasting_plate(self):
        out = self.dir / "out.png"
        info = place_logo.place(self.render, self.logo, out, corner="br", width=0.2)
        x, y, w, h = info["box"]
        self.assertEqual(info["logo_size"], [200, 50])
        self.assertTrue(x + w <= 1000 and y + h <= 1250 and x > 500 and y > 1000)
        self.assertEqual(info["plate"], "#ffffff")
        img = Image.open(out)
        self.assertEqual(img.size, (1000, 1250))
        self.assertEqual(img.getpixel((5, 5)), (200, 60, 40))

    def test_render_is_never_overwritten(self):
        with self.assertRaises(ValueError):
            place_logo.place(self.render, self.logo, self.render)

    def test_rejects_bad_corner_and_width(self):
        with self.assertRaises(ValueError):
            place_logo.place(self.render, self.logo, self.dir / "o.png", corner="xx")
        with self.assertRaises(ValueError):
            place_logo.place(self.render, self.logo, self.dir / "o.png", width=0.9)

    def test_bare_logo_and_top_centre(self):
        info = place_logo.place(self.render, self.logo, self.dir / "o2.png", corner="tc", plate="none")
        x, y, w, h = info["box"]
        self.assertEqual(info["plate"], "none")
        self.assertEqual(x, (1000 - w) // 2)
        self.assertEqual(y, 40)


if __name__ == "__main__":
    unittest.main()

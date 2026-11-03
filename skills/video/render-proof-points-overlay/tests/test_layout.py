"""Free text/layout regressions, including the real missing star glyph on macOS."""
import importlib.util
import json
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path
from PIL import Image, ImageDraw

script = Path(__file__).resolve().parents[1] / "scripts" / "build_overlays.py"
spec = importlib.util.spec_from_file_location("overlays", script)
overlays = importlib.util.module_from_spec(spec)
spec.loader.exec_module(overlays)


class LayoutTests(unittest.TestCase):
    def test_composed_right_pill_clears_platform_controls(self):
        with tempfile.TemporaryDirectory() as tmp:
            run = Path(tmp)
            generated = run / "generated"
            output = generated / "overlays"
            output.mkdir(parents=True)
            for name in ["01-header-white.png", "02-header-orange.png", "03-check-a.png", "04-check-b.png"]:
                Image.new("RGBA", (300, 100), (255, 255, 255, 255)).save(output / name)
            config = run / "config.json"
            config.write_text(json.dumps({"duration_sec": 1, "layout": {
                "header_x": 40, "header_y": 300, "subhead_y": 440,
                "pill_rows_y": [600, 750], "reveal_times": [0, 0], "pill_right_margin": 40,
            }}))
            subprocess.run(["ffmpeg", "-v", "error", "-y", "-f", "lavfi", "-i", "color=c=gray:s=1080x1920:r=30:d=1",
                            "-c:v", "libx264", "-threads", "2", "-pix_fmt", "yuv420p", str(generated / "clip-handheld.mp4")], check=True)
            subprocess.run([sys.executable, str(script.parent / "compose_master.py"), "--config", str(config),
                            "--run-dir", str(run), "--no-music"], check=True, capture_output=True)
            frame = run / "frame.png"
            subprocess.run(["ffmpeg", "-v", "error", "-y", "-ss", "0.5", "-i", str(run / "master-final.mp4"),
                            "-frames:v", "1", str(frame)], check=True)
            with Image.open(frame) as image:
                self.assertGreater(min(image.getpixel((950, 780))[:3]), 200)
                self.assertLess(max(image.getpixel((1000, 780))[:3]), 180)

    def test_star_uses_an_available_glyph(self):
        font = overlays.load_font(54)
        for text, face in overlays.text_runs("4.9 ★", font):
            for ch in text.strip():
                if not ch.isspace():
                    self.assertNotEqual((face.getmask(ch).size, bytes(face.getmask(ch))),
                                        (face.getmask("\u0378").size, bytes(face.getmask("\u0378"))))

    def test_trailing_icon_clears_every_line_and_fits_inside_pill(self):
        font = overlays.load_font(54)
        positions = []
        def paint(image, x, y, size):
            positions.append((x, y, size))
        lines = ["A MUCH LONGER FIRST LINE", "4.9 ★"]
        pill = overlays.rounded_pill(lines, font, trailing_icon=paint, icon_line=1)
        widths = [overlays.measure(ImageDraw.Draw(Image.new("RGB", (1, 1))), text, font)[0] for text in lines]
        x, y, size = positions[0]
        self.assertGreater(x, 36 + max(widths))
        self.assertLessEqual(x + size + 36, pill.width)
        self.assertGreaterEqual(y, 0)
        self.assertLessEqual(y + size, pill.height)


if __name__ == "__main__":
    unittest.main()

"""Free regressions: run with python3 -m unittest discover -s <this folder>."""
import contextlib
import importlib.util
import io
import json
import subprocess
import shutil
import sys
import tempfile
import unittest
from pathlib import Path
from types import SimpleNamespace
from unittest.mock import patch

from PIL import Image, ImageChops

SCRIPTS = Path(__file__).resolve().parents[1] / "scripts"
sys.path.insert(0, str(SCRIPTS))
import brandkit
import build_looks
import fit_grade
import format_spec


class FinishingTests(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.run = Path(self.tmp.name)

    def tearDown(self):
        self.tmp.cleanup()

    def test_palette_long_endcard_and_portable_fonts(self):
        layer = {
            "logo": None,
            "end_card": ["A LONG APPROVED END CARD LINE THAT NEEDS TO FIT", "SECOND LINE", "THIRD LINE"],
            "palette": {"accent": "#E83F6F", "text": "#F8F6F0", "background": "#102036"},
        }
        build_looks.configure_brand_layer(layer)
        out = self.run / "end.png"
        build_looks.end_card(out, layer)
        with Image.open(out) as image:
            self.assertEqual(image.getpixel((0, 0)), (16, 32, 54))
            bounds = ImageChops.difference(image, Image.new("RGB", image.size, (16, 32, 54))).getbbox()
            self.assertGreaterEqual(bounds[0], 60)
            self.assertLessEqual(bounds[2], 1020)
            self.assertGreaterEqual(bounds[1], build_looks.SAFE_TOP)
            self.assertLessEqual(bounds[3], build_looks.SAFE_BOT)

    def test_grade_keeps_interpreter_and_explicit_run(self):
        with patch.object(fit_grade.subprocess, "run", return_value=SimpleNamespace(returncode=0)) as runner:
            fit_grade.render("in.mp4", "out.mp4", 0.02, 1, run=self.run)
        command = runner.call_args.args[0]
        self.assertEqual(command[0], sys.executable)
        self.assertEqual(command[command.index("--run") + 1], str(self.run.resolve()))

    def test_supplied_fonts_work_without_system_fallbacks(self):
        shutil.copyfile(build_looks.resolve_font("black"), self.run / "custom.ttf")
        spec = importlib.util.spec_from_file_location("looks_without_defaults", SCRIPTS / "build_looks.py")
        isolated = importlib.util.module_from_spec(spec)
        layer = {
            "logo": None, "end_card": ["CUSTOM FONT"],
            "fonts": {weight: "custom.ttf" for weight in ("black", "bold", "regular")},
        }
        # Simulate a host with no fallback fonts, while retaining a valid project font.
        with patch.object(Path, "is_file", return_value=False), patch.object(build_looks.paths, "ROOT", self.run):
            spec.loader.exec_module(isolated)
            isolated.configure_brand_layer(layer)
            isolated.end_card(self.run / "custom-end.png", layer)
            self.assertEqual(isolated.BLACK, str(self.run / "custom.ttf"))
            self.assertTrue((self.run / "custom-end.png").exists())

    def test_versioned_pouch_grammar_preserves_historical_prompt(self):
        cfg = brandkit.load("liquid-death-4828")
        cfg["product"]["noun"] = "pouch"
        cfg["product"]["phrase"] = "product pouch"
        flags = {"upright": True, "one_mic": True}
        historical = format_spec.build_prompt(cfg, **flags)
        repaired = format_spec.build_prompt(cfg, **flags, prompt_version=2)
        self.assertIn("the only the", historical)
        self.assertNotIn("the only the", repaired)
        self.assertIn("THE TOP EDGE IS NEVER SHOWN", repaired)
        self.assertEqual(format_spec.lint(repaired, **flags, prompt_version=2), [])
        self.assertEqual(format_spec.build_prompt(cfg, **flags, prompt_version=1), historical)
        cfg["shots"][1]["line"] = "Keep the only the phrase verbatim."
        self.assertIn("Keep the only the phrase verbatim.", format_spec.build_prompt(cfg, **flags, prompt_version=2))
        # The replacement guard is still load-bearing.
        self.assertTrue(format_spec.lint(repaired.replace("THE TOP EDGE IS NEVER SHOWN", ""), **flags, prompt_version=2))

    def test_versioned_non_upright_payoff_repairs_only_scaffold_articles(self):
        cfg = brandkit.load("liquid-death")
        cfg["shots"][-1]["line"] = "Keep the only the phrase verbatim."
        old = format_spec.build_prompt(cfg, one_mic=True)
        new = format_spec.build_prompt(cfg, one_mic=True, prompt_version=2)
        self.assertIn("lowers the only the can", old)
        self.assertIn("lowers only the can", new)
        self.assertNotIn("lowers the only the can", new)
        self.assertIn("Keep the only the phrase verbatim.", new)
        self.assertEqual(format_spec.lint(new, one_mic=True, prompt_version=2), [])
        self.assertEqual(format_spec.build_prompt(cfg, one_mic=True, prompt_version=1), old)

    def test_missed_falsifications_report_failure_instead_of_crashing(self):
        spec = importlib.util.spec_from_file_location("check_cut", SCRIPTS / "check-cut.py")
        gate = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(gate)
        output = io.StringIO()
        with patch.object(gate.subprocess, "run"), patch.object(gate, "graphics_span", return_value=None), \
             patch.object(gate, "check_realism", return_value=([], [], [])), \
             patch.object(gate, "cuts", return_value=[]), \
             patch("build_episode.duration", return_value=2), contextlib.redirect_stdout(output):
            result = gate.falsify(self.run / "render.mp4", self.run / "control.mp4", {})
        self.assertEqual(result, 1)
        self.assertIn("4 of 4 falsifications", output.getvalue())

    def test_zero_strength_grade_and_brand_bar_through_caption_gaps(self):
        # Entirely synthetic input; no model call, real customer or wallet involved.
        cfg = brandkit.load("liquid-death")
        cfg["brand_layer"].update({
            "logo": None, "cuts": [1.0], "ambience_gap": [0.0, 0.5],
            "captions": [[0.8, 1.0, "ANSWER", "answer", "", "Answer."]],
            "end_card": ["SYNTHETIC TEST"], "series_header": "TEST SERIES",
        })
        config = self.run / "brand.json"
        config.write_text(json.dumps(cfg))
        build_looks.resolve(self.run, str(config))
        build_looks.SRC.parent.mkdir(parents=True)
        subprocess.run(["ffmpeg", "-v", "error", "-y", "-f", "lavfi", "-i", "color=c=gray:s=1080x1920:r=30:d=2",
                        "-f", "lavfi", "-i", "sine=frequency=440:sample_rate=48000:duration=2", "-c:v", "libx264",
                        "-threads", "2", "-pix_fmt", "yuv420p", "-c:a", "aac", "-shortest", str(build_looks.SRC)], check=True)
        missing = subprocess.run([sys.executable, str(SCRIPTS / "phone_look_video.py"), str(build_looks.SRC),
                                  str(self.run / "grade.mp4"), "--run", str(self.run), "--strength", "0.5"], capture_output=True, text=True)
        self.assertNotEqual(missing.returncode, 0)
        self.assertIn("no colour reference", missing.stderr)
        build_looks.build("subway")  # default strength 0 must work without refs/ or a `python` alias
        video = build_looks.OUTDIR / f"street-{cfg['slug']}-subway.mp4"
        for time in (0.3, 0.9, 1.5):
            frame = self.run / f"frame-{time}.png"
            subprocess.run(["ffmpeg", "-v", "error", "-y", "-ss", str(time), "-i", str(video), "-frames:v", "1", str(frame)], check=True)
            with Image.open(frame) as image:
                # Left of the title: bar must exist before, during and after the caption.
                self.assertLess(max(image.getpixel((10, 330))[:3]), 60)


if __name__ == "__main__":
    unittest.main()

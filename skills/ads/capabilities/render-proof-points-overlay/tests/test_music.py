"""Free audio coverage checks and a real FFmpeg composition."""
from array import array
import hashlib
import importlib.util
import json
import math
from pathlib import Path
import subprocess
import sys
import tempfile
import unittest
import wave
from PIL import Image

SCRIPTS = Path(__file__).resolve().parents[1] / "scripts"
spec = importlib.util.spec_from_file_location("music_coverage", SCRIPTS / "music_coverage.py")
music = importlib.util.module_from_spec(spec)
spec.loader.exec_module(music)


def bed(path, seconds, silent_from=None, gap=None):
    samples = array("h")
    for i in range(round(seconds * music.RATE)):
        t = i / music.RATE
        audible = not ((silent_from is not None and t >= silent_from) or (gap and gap[0] <= t < gap[1]))
        value = sum(math.sin(2 * math.pi * frequency * t) for frequency in (220, 275, 330))
        samples.append(round(3000 * value) if audible else 0)
    if sys.byteorder != "little":
        samples.byteswap()
    with wave.open(str(path), "wb") as output:
        output.setnchannels(1)
        output.setsampwidth(2)
        output.setframerate(music.RATE)
        output.writeframes(samples.tobytes())


class MusicTests(unittest.TestCase):
    def test_missing_music_stops_before_rendering(self):
        with tempfile.TemporaryDirectory() as tmp:
            run = Path(tmp)
            config = run / "config.json"
            config.write_text(json.dumps({"layout": {}, "duration_sec": 4}))
            result = subprocess.run([sys.executable, str(SCRIPTS / "compose_master.py"),
                                     "--config", str(config), "--run-dir", str(run)],
                                    capture_output=True, text=True)
            self.assertNotEqual(result.returncode, 0)
            self.assertIn("missing music bed", result.stderr)
            self.assertFalse((run / "master-final.mp4").exists())
            self.assertFalse((run / "generated/composite-no-audio.mp4").exists())

    def test_short_bed_requires_explicit_loop(self):
        with tempfile.TemporaryDirectory() as tmp:
            source, output = Path(tmp) / "bed.wav", Path(tmp) / "checked.wav"
            bed(source, 3)
            with self.assertRaisesRegex(ValueError, "3.00s long"):
                music.prepare_music(source, output, 5)
            original = hashlib.sha256(source.read_bytes()).digest()
            result = music.prepare_music(source, output, 5, loop=True)
            self.assertTrue(result["listening_review_required"])
            self.assertTrue(result["looped"])
            self.assertIsNone(music.coverage(output, 5))
            _, rms = music.levels(output, 5)
            self.assertGreater(min(rms[:225]), music.FLOOR)
            self.assertLess(rms[-1], rms[-26] / 10)
            self.assertEqual(hashlib.sha256(source.read_bytes()).digest(), original)

    def test_silent_tail_is_detected_and_trimmed_only_when_loop_approved(self):
        with tempfile.TemporaryDirectory() as tmp:
            source, output = Path(tmp) / "bed.wav", Path(tmp) / "checked.wav"
            bed(source, 5, silent_from=3)
            with self.assertRaisesRegex(ValueError, "inaudible gap"):
                music.prepare_music(source, output, 5)
            music.prepare_music(source, output, 5, loop=True)
            self.assertIsNone(music.coverage(output, 5))

    def test_internal_dropout_is_not_repeated(self):
        with tempfile.TemporaryDirectory() as tmp:
            source = Path(tmp) / "bed.wav"
            bed(source, 5, gap=(2, 2.6))
            with self.assertRaisesRegex(ValueError, "continuous section"):
                music.prepare_music(source, Path(tmp) / "checked.wav", 7, loop=True)

    def test_silence_and_short_fragments_need_replacement(self):
        with tempfile.TemporaryDirectory() as tmp:
            source = Path(tmp) / "bed.wav"
            for duration, silent_from in [(3, 0), (1, None)]:
                bed(source, duration, silent_from=silent_from)
                with self.assertRaises(ValueError):
                    music.prepare_music(source, Path(tmp) / "checked.wav", 5, loop=True)

    def test_full_bed_keeps_duration_and_only_fades_at_end(self):
        with tempfile.TemporaryDirectory() as tmp:
            source, output = Path(tmp) / "bed.wav", Path(tmp) / "checked.wav"
            bed(source, 5)
            result = music.prepare_music(source, output, 5)
            self.assertFalse(result["looped"])
            _, rms = music.levels(output, 5)
            self.assertGreater(min(rms[:225]), 0.08)
            self.assertLess(rms[-1], 0.01)

    def test_real_master_has_music_through_end_card(self):
        with tempfile.TemporaryDirectory() as tmp:
            run = Path(tmp)
            gen = run / "generated"
            overlays = gen / "overlays"
            overlays.mkdir(parents=True)
            for name in ["01-header-white.png", "02-header-orange.png", "03-check-a.png"]:
                Image.new("RGBA", (200, 60), "white").save(overlays / name)
            config = run / "config.json"
            config.write_text(json.dumps({"duration_sec": 4, "layout": {
                "header_x": 40, "header_y": 300, "subhead_y": 440,
                "pill_rows_y": [600], "reveal_times": [0.5],
            }}))
            bed(gen / "source.wav", 3)
            subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", str(gen / "source.wav"),
                            "-c:a", "aac", str(gen / "music-bed.m4a")], check=True)
            subprocess.run(["ffmpeg", "-v", "error", "-y", "-f", "lavfi", "-i",
                            "color=c=gray:s=1080x1920:r=30:d=4", "-c:v", "libx264",
                            "-threads", "2", "-pix_fmt", "yuv420p", str(gen / "clip-handheld.mp4")], check=True)
            subprocess.run([sys.executable, str(SCRIPTS / "compose_master.py"), "--config", str(config),
                            "--run-dir", str(run), "--loop-music"], check=True, capture_output=True)
            master = run / "master-final.mp4"
            self.assertIsNone(music.coverage(master, 4))
            length, rms = music.levels(master, 4)
            self.assertGreaterEqual(length, 3.98)
            self.assertGreater(min(rms[150:175]), music.FLOOR)
            self.assertLess(rms[-1], rms[170] / 10)


if __name__ == "__main__":
    unittest.main()

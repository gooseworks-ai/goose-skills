import copy
import importlib.util
import json
import os
from pathlib import Path
import subprocess
import sys
import tempfile
import unittest

SCRIPTS = Path(__file__).resolve().parents[1] / "scripts"
sys.path.insert(0, str(SCRIPTS))
import replace_hook as render
from make_demo import make_demo
from replace_pack import replace_pack


class HookReplacementTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.temporary = tempfile.TemporaryDirectory(prefix="hook demo path spaces ")
        cls.root = Path(cls.temporary.name)
        cls.font = Path(os.environ["HOOK_TEST_FONT"]) if os.environ.get("HOOK_TEST_FONT") else None
        cls.config = make_demo(cls.root, cls.font)
        cls.hash = render.file_hash(cls.root / "original.mp4")

    @classmethod
    def tearDownClass(cls):
        cls.temporary.cleanup()

    def config_for(self, name):
        config = copy.deepcopy(self.config)
        config["output"]["path"] = name + ".mp4"
        config["captions"]["output_path"] = name + ".srt"
        return config

    def test_free_preflight_accepts_only_original_cut_without_hook_or_output(self):
        source_only = {key: self.config[key] for key in ["source", "hook_end_sec", "words"]}
        path = self.root / "source-only.json"
        path.write_text(json.dumps(source_only))
        result = subprocess.run([sys.executable, str(SCRIPTS / "replace_hook.py"), "--preflight", "--config", str(path)],
                                capture_output=True, text=True)
        self.assertEqual(result.returncode, 0, result.stderr)
        report = json.loads(result.stdout)
        self.assertEqual(report["status"], "preflight_passed")
        self.assertEqual(report["source"]["sha256"], self.hash)
        self.assertEqual(report["media_generation_cost_usd"], 0)

    def test_real_unequal_supplied_hook_preserves_every_body_frame_and_audio(self):
        manifest = render.replace(self.config_for("shorter"), self.root)
        self.assertEqual(manifest["version"], 1)
        self.assertEqual(manifest["source"]["sha256"], self.hash)
        self.assertEqual(manifest["source"]["project_id"], "demo-source-project")
        self.assertEqual(manifest["source"]["render_id"], "demo-original-v1")
        self.assertAlmostEqual(manifest["replacement_duration_sec"], 1.5, places=5)
        self.assertAlmostEqual(manifest["duration_delta_sec"], -0.9, places=5)
        self.assertAlmostEqual(manifest["output"]["duration_sec"], 6.1, delta=0.035)
        for key in ["source_unchanged", "body_video_preserved", "body_audio_preserved", "caption_timing_preserved"]:
            self.assertTrue(manifest["verification"][key], key)
        self.assertEqual(manifest["verification"]["video"]["frames"], 138)
        self.assertEqual(manifest["review"]["status"], "needs_review")
        self.assertEqual(manifest["review"]["source_sha256"], self.hash)
        self.assertEqual(manifest["review"]["output_sha256"], manifest["output"]["sha256"])
        self.assertIsNone(manifest["review"]["checked_at"])
        self.assertEqual(render.file_hash(self.root / "original.mp4"), self.hash)
        rows = render.read_captions(self.root / "shorter.srt")
        self.assertEqual([r["text"] for r in rows], ["Original body", "Original ending"])
        self.assertAlmostEqual(rows[0]["start"], 1.7)

    def test_nonframe_boundary_is_preserved_and_frame_rounding_is_disclosed(self):
        config = self.config_for("arbitrary")
        config["hook_end_sec"] = 2.413
        manifest = render.replace(config, self.root)
        self.assertEqual(manifest["body_start_sec"], 2.413)
        self.assertEqual(manifest["hook_end_sec"], 2.413)
        self.assertTrue(manifest["verification"]["body_video_preserved"])
        self.assertLess(manifest["verification"]["video"]["frame_grid_offset_sec"], 1 / 30)
        self.assertLess(manifest["verification"]["audio"]["normalized_rms_error"], 0.01)
        self.assertAlmostEqual(manifest["output"]["duration_sec"], 7 + 1.5 - 2.413, delta=0.002)

    def test_longer_hook_and_absent_source_audio_preserve_original_ending(self):
        silent = self.root / "silent-original.mp4"
        render.ffmpeg("-i", self.root / "original.mp4", "-map", "0:v", "-c", "copy", "-an", silent)
        long_hook = self.root / "long-hook.mp4"
        render.ffmpeg("-stream_loop", "2", "-i", self.root / "replacement-hook.mp4", "-t", "3.5", "-c:v", "libx264", "-pix_fmt", "yuv420p", "-an", long_hook)
        config = self.config_for("longer")
        config["source"] = {"path": str(silent)}
        config["hook"] = {"path": str(long_hook)}
        manifest = render.replace(config, self.root)
        self.assertGreater(manifest["duration_delta_sec"], 0)
        self.assertTrue(manifest["verification"]["body_audio_preserved"])
        self.assertFalse(manifest["verification"]["audio"]["source_has_audio"])
        self.assertTrue(manifest["verification"]["body_video_preserved"])

    def test_wrong_source_hash_bad_cut_word_and_overwrite_are_blocked(self):
        for name, change, expected in [
            ("hash", lambda c: c["source"].update(sha256="0" * 64), "SHA256 mismatch"),
            ("past", lambda c: c.update(hook_end_sec=8), "leave at least"),
            ("nan", lambda c: c.update(hook_end_sec=float("nan")), "finite"),
            ("word", lambda c: c.update(hook_end_sec=1), "cuts spoken word"),
            ("overwrite", lambda c: c["output"].update(path="original.mp4"), "overwrite"),
        ]:
            config = self.config_for(name)
            change(config)
            with self.assertRaisesRegex(ValueError, expected):
                render.replace(config, self.root)
        self.assertEqual(render.file_hash(self.root / "original.mp4"), self.hash)

    def test_original_audio_tail_beyond_video_is_rejected_without_dropping_it(self):
        source = self.root / "audio-tail-original.mp4"
        render.ffmpeg("-f", "lavfi", "-i", "color=c=blue:s=320x568:r=30:d=3",
                      "-f", "lavfi", "-i", "sine=frequency=330:sample_rate=48000:duration=3.3",
                      "-c:v", "libx264", "-pix_fmt", "yuv420p", "-c:a", "aac", source)
        config = self.config_for("tail-result")
        config["source"] = {"path": str(source)}
        config["hook_end_sec"] = 1.0
        config.pop("words")
        config.pop("captions")
        original_hash = render.file_hash(source)
        with self.assertRaisesRegex(ValueError, "extends beyond its final video frame"):
            render.replace(config, self.root)
        self.assertFalse((self.root / "tail-result.mp4").exists())
        self.assertEqual(render.file_hash(source), original_hash)

    def test_crossing_captions_need_measured_whole_words(self):
        rows = [{"start": 2, "end": 3, "text": "OLD NEW"}]
        with self.assertRaisesRegex(ValueError, "supply measured original words"):
            render.shift_captions(rows, 2.4, 1.5, None, 7)
        words = [{"start": 2.0, "end": 2.2, "word": "OLD"}, {"start": 2.6, "end": 2.8, "word": "NEW"}]
        shifted = render.shift_captions(rows, 2.4, 1.5, words, 7)
        self.assertEqual(shifted[0]["text"], "NEW")
        self.assertAlmostEqual(shifted[0]["start"], 1.7)

    def test_decoded_checks_reject_regraded_body_and_shifted_audio(self):
        changed = self.root / "changed-body.mp4"
        render.ffmpeg("-i", self.root / "original.mp4", "-vf", "negate", "-c:v", "libx264", "-pix_fmt", "yuv420p", "-c:a", "copy", changed)
        with tempfile.TemporaryDirectory(dir=self.root) as folder:
            work = Path(folder)
            passed, report = render.compare_video(self.root / "original.mp4", changed, 2.4, 2.4, work)
            self.assertFalse(passed)
            self.assertEqual(report["frames"], report["output_frames"])
            self.assertLess(report["minimum_psnr_db"], 45)
            passed, _ = render.compare_audio(self.root / "original.mp4", self.root / "original.mp4", 2.4, 2.417,
                                            4.6, render.probe(self.root / "original.mp4")["audio"], work)
            self.assertFalse(passed)

    def test_corrupt_hook_and_changed_word_times_do_not_produce_candidate(self):
        corrupt = self.root / "corrupt.mp4"
        corrupt.write_text("not media")
        config = self.config_for("corrupt-result")
        config["hook"] = {"path": str(corrupt)}
        with self.assertRaisesRegex(ValueError, "ffprobe failed"):
            render.replace(config, self.root)
        self.assertFalse((self.root / "corrupt-result.mp4.manifest.json").exists())
        words = self.root / "stale-words.json"
        words.write_text(json.dumps({"source_sha256": "stale", "words": []}))
        with self.assertRaisesRegex(ValueError, "original source_sha256"):
            render.read_words({"word_times": str(words)}, self.root, self.hash)

    def test_unsupported_rotation_pixel_format_and_variable_rate_fail_before_assembly(self):
        config = self.config_for("unsupported")
        original_probe, original_frames = render.probe, render.frame_times
        try:
            render.probe = lambda p: {**original_probe(p), "pix_fmt": "yuv420p10le"}
            with self.assertRaisesRegex(ValueError, "8-bit yuv420p"):
                render.replace(config, self.root)
            render.probe = original_probe
            render.frame_times = lambda p: [0, 0.02, 0.1]
            with self.assertRaisesRegex(ValueError, "variable-frame-rate"):
                render.replace(config, self.root)
        finally:
            render.probe, render.frame_times = original_probe, original_frames

    def test_preservation_gate_can_fail_and_never_publishes_failed_candidate(self):
        config = self.config_for("failed-verification")
        hashes = render.frame_hashes
        try:
            render.frame_hashes = lambda path, start: hashes(path, start) if Path(path).name == "original.mp4" else ["modified-body-frame"]
            with self.assertRaisesRegex(ValueError, "verification failed"):
                render.replace(config, self.root)
        finally:
            render.frame_hashes = hashes
        self.assertFalse((self.root / "failed-verification.mp4").exists())
        self.assertFalse((self.root / "failed-verification.mp4.manifest.json").exists())
        self.assertEqual(render.file_hash(self.root / "original.mp4"), self.hash)

    def test_pack_freezes_one_source_and_keeps_successes_when_one_hook_fails(self):
        config = copy.deepcopy(self.config)
        config["output_dir"] = "pack partial"
        config["variants"] = [{"label": "Hook A", "hook": {"path": "replacement-hook.mp4"}},
                              {"label": "Hook B", "hook": {"path": "missing.mp4"}},
                              {"label": "Hook C", "hook": {"path": "replacement-hook.mp4"}}]
        summary = replace_pack(config, self.root)
        self.assertEqual(summary["status"], "partial_failure")
        self.assertEqual([r["status"] for r in summary["variants"]], ["needs_review", "failed", "needs_review"])
        for row in [summary["variants"][0], summary["variants"][2]]:
            manifest = json.loads(Path(row["manifest_path"]).read_text())
            self.assertEqual(manifest["source"]["sha256"], self.hash)
            self.assertEqual(manifest["source"]["render_id"], "demo-original-v1")
            self.assertTrue(Path(manifest["output"]["path"]).is_file())
        self.assertFalse((self.root / "pack partial/hook-b.mp4").exists())

    @unittest.skipUnless(os.environ.get("HOOK_TEST_FONT"), "text route needs an explicitly supplied licensed font")
    def test_free_text_hook_is_kinetic_and_keeps_the_original_body(self):
        config = self.config_for("text")
        config["hook"] = {"text": "Try a better opening", "duration_sec": 2.8, "font_path": str(self.font), "background": "#16213e"}
        manifest = render.replace(config, self.root)
        self.assertEqual(manifest["hook"]["treatment"], "text")
        self.assertEqual(manifest["media_generation_cost_usd"], 0)
        self.assertTrue(manifest["verification"]["body_video_preserved"])
        self.assertTrue(manifest["verification"]["body_audio_preserved"])


if __name__ == "__main__":
    unittest.main()

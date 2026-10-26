"""Eleven v4 by default, measured words per second, and --target-wps before lip-sync. No paid calls:
the proxy and ffmpeg are mocks."""
import base64
import json
from pathlib import Path
import sys
import tempfile
import unittest
from unittest import mock

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "scripts"))
import gen_vo
from gen_vo import measure_wps, target_tempo, timestamped_tts


def alignment(text, seconds):
    step = seconds / len(text)
    return {"characters": list(text),
            "character_start_times_seconds": [round(i * step, 3) for i in range(len(text))],
            "character_end_times_seconds": [round((i + 1) * step, 3) for i in range(len(text))]}


class PaceTests(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.addCleanup(self.tmp.cleanup)
        self.out = Path(self.tmp.name) / "vo.mp3"
        self.proxy = mock.Mock()
        self.proxy.relay_mode.return_value = False
        self.proxy._cfg.return_value = ("https://example.test", "test-token", "test-agent")
        self.proxy._params.return_value = {}

    def reply(self, text, seconds):
        self.proxy.requests.post.return_value.json.return_value = {
            "audio_base64": base64.b64encode(b"audio").decode(), "alignment": alignment(text, seconds)}

    def test_measure_and_target_tempo(self):
        # 3 words over 1.5 s: 2 words a second.
        self.assertEqual(measure_wps(alignment("aaa bbb ccc", 1.5)), 2.0)
        # reference_rate.py's counting: a lone dash is not a word; a word ends at its last letter.
        self.assertEqual(measure_wps(alignment("aa \u2014 bb.", 1.0)), round(2 / 0.875, 2), "8 characters at 0.125 s: the last b ends at 0.875 s")
        self.assertEqual(target_tempo(3.2, 2.62), 1.222, "the test video: 3.20 reference, 2.62 narration")
        self.assertEqual(target_tempo(4.09, 2.54), 1.25, "capped at 1.25x")
        self.assertEqual(target_tempo(4.0, 3.7), 1.0, "within 10%")
        self.assertEqual(target_tempo(4.0, 3.5), 1.143)
        self.assertEqual(target_tempo(None, 2.0), 1.0)

    def test_a_slow_read_is_sped_up_before_lipsync_and_its_timings_scaled(self):
        self.reply("aaa bbb ccc", 1.5)
        run = mock.Mock()
        timestamped_tts("aaa bbb ccc", "voice-a", self.out, "eleven_v4", proxy=self.proxy, target_wps=2.4, run=run)
        cmd = run.call_args[0][0]
        self.assertEqual(cmd[0], "ffmpeg")
        self.assertIn("atempo=1.2", cmd)
        self.assertTrue(self.out.with_suffix(".raw.mp3").exists(), "the raw read is kept")
        prov = json.loads(self.out.with_suffix(".provenance.json").read_text())
        self.assertEqual((prov["measured_words_per_second"], prov["tempo"], prov["tempo_applied"]), (2.0, 1.2, True))
        self.assertTrue(prov["tempo_applied_before_lipsync"])
        self.assertEqual(prov["tempo_scope"], "new_narration_only")
        stamps = json.loads(self.out.with_suffix(".timestamps.json").read_text())
        self.assertAlmostEqual(stamps["character_end_times_seconds"][-1], 1.25, places=2)

    def test_a_read_within_ten_percent_and_a_tagged_read_are_left_alone(self):
        run = mock.Mock()
        self.reply("aaa bbb ccc", 1.5)
        timestamped_tts("aaa bbb ccc", "voice-a", self.out, "eleven_v4", proxy=self.proxy, target_wps=2.1, run=run)
        self.reply("[warm] aaa", 1.5)
        timestamped_tts("[warm] aaa", "voice-a", self.out, "eleven_v4", proxy=self.proxy, target_wps=6, run=run)
        run.assert_not_called()
        prov = json.loads(self.out.with_suffix(".provenance.json").read_text())
        self.assertEqual((prov["tempo"], prov["tempo_applied"]), (1.0, False))

    def test_the_default_model_is_eleven_v4_on_the_timestamped_endpoint(self):
        with mock.patch.object(gen_vo, "timestamped_tts") as tts, \
             mock.patch.object(sys, "argv", ["gen_vo.py", "--text", "Hi there.", "--voice", "v", "--out", str(self.out), "--target-wps", "3.2"]):
            self.assertEqual(gen_vo.main(), 0)
        args, kwargs = tts.call_args
        self.assertEqual(args[3], "eleven_v4")
        self.assertEqual(kwargs["target_wps"], 3.2)


if __name__ == "__main__":
    unittest.main()

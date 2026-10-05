"""Timestamped TTS uses the same billing transport and saves usable alignment."""
import base64
import json
from pathlib import Path
import sys
import tempfile
import unittest
from unittest import mock

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "scripts"))
from gen_vo import timestamped_tts


class TimestampTests(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.addCleanup(self.tmp.cleanup)
        self.out = Path(self.tmp.name) / "nested/beat-01.mp3"
        self.alignment = {"characters": ["h", "i"],
                          "character_start_times_seconds": [0, .2],
                          "character_end_times_seconds": [.2, .4]}
        self.proxy = mock.Mock()
        self.proxy.relay_mode.return_value = False
        self.proxy._cfg.return_value = ("https://example.test", "test-token", "test-agent")
        self.proxy._params.return_value = {"agent": "test-agent"}
        self.proxy.requests.post.return_value.json.return_value = {
            "audio_base64": base64.b64encode(b"test-audio").decode(), "alignment": self.alignment}

    def test_http_preserves_voice_model_settings_and_writes_caption_sidecar(self):
        settings = {"speed": .92, "stability": .4}
        timestamped_tts("hi", "voice-a", self.out, "eleven_multilingual_v2", settings, self.proxy)
        args, kwargs = self.proxy.requests.post.call_args
        self.assertEqual(args[0], "https://example.test/api/internal/elevenlabs-proxy/v1/text-to-speech/voice-a/with-timestamps")
        self.assertEqual(kwargs["json"], {"text": "hi", "model_id": "eleven_multilingual_v2", "voice_settings": settings})
        self.assertEqual(self.out.read_bytes(), b"test-audio")
        self.assertEqual(json.loads(self.out.with_suffix(".timestamps.json").read_text()), self.alignment)

    def test_relay_uses_returned_download_and_alignment(self):
        self.proxy.relay_mode.return_value = True
        self.proxy._relay.return_value = {"download_url": "https://example.test/audio", "alignment": self.alignment}
        timestamped_tts("hi", "voice-a", self.out, "eleven_multilingual_v2", proxy=self.proxy)
        self.proxy.download.assert_called_once_with("https://example.test/audio", str(self.out))
        self.proxy.requests.post.assert_not_called()
        self.assertTrue(self.out.with_suffix(".timestamps.json").exists())

    def test_missing_or_malformed_alignment_writes_no_completed_audio(self):
        for alignment in ({}, {"characters": ["h"], "character_start_times_seconds": [], "character_end_times_seconds": []}):
            self.proxy.requests.post.return_value.json.return_value = {
                "audio_base64": base64.b64encode(b"audio").decode(), "alignment": alignment}
            with self.assertRaisesRegex(RuntimeError, "no usable character timings"):
                timestamped_tts("hi", "voice-a", self.out, "eleven_multilingual_v2", proxy=self.proxy)
            self.assertFalse(self.out.exists())


if __name__ == "__main__":
    unittest.main()

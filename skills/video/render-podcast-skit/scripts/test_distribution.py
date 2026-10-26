"""Installed-package and timing contracts. No paid calls or credentials."""
import argparse
import contextlib
import io
import json
import os
from pathlib import Path
import sys
import tempfile
import unittest
from unittest import mock

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))
import build_overlays
import gen_paid
import provider_commands


class DistributionTests(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.addCleanup(self.tmp.cleanup)
        self.root = Path(self.tmp.name)
        for slug, script in provider_commands.PUBLIC.values():
            folder = self.root / slug / "scripts"
            folder.mkdir(parents=True)
            (folder / script).write_text("# installed test capability\n")
        self.env = mock.patch.dict(os.environ, {"PODCAST_SKILLS_DIR": str(self.root)})
        self.env.start()
        self.addCleanup(self.env.stop)
        self.cfg = json.loads((HERE / "config.example.json").read_text())
        self.args = argparse.Namespace(confirm=False, execute=False, only=None)
        self.beats = [{"n": 1, "who": "A", "text": "Just one measured line.",
                       "still": "host-a.png", "dur_sec": 1.0}]

    def test_installed_provider_names_resolve_without_studio(self):
        for kind, (slug, script) in provider_commands.PUBLIC.items():
            folder, resolved, public = provider_commands.resolve(kind)
            self.assertEqual(folder, self.root / slug)
            self.assertEqual(resolved, script)
            self.assertTrue(public)
        self.assertIn("gen_vo.py", provider_commands.command("voice")[1])

    def test_default_and_confirm_only_voice_steps_never_call_provider(self):
        with mock.patch.object(gen_paid.subprocess, "run") as run, contextlib.redirect_stdout(io.StringIO()):
            for confirmed in (False, True):
                self.args.confirm = confirmed
                gen_paid.step_vo(self.cfg, self.root / "run", self.beats, self.args)
            run.assert_not_called()

    def test_missing_timestamp_does_not_regenerate_completed_audio(self):
        out = self.root / "run/voiceovers"
        out.mkdir(parents=True)
        (out / "beat-01.mp3").write_bytes(b"completed-audio")
        self.args.confirm = self.args.execute = True
        with mock.patch.object(gen_paid.subprocess, "run") as run, contextlib.redirect_stdout(io.StringIO()):
            with self.assertRaisesRegex(SystemExit, "refusing to re-bill"):
                gen_paid.step_vo(self.cfg, self.root / "run", self.beats, self.args)
            run.assert_not_called()

    def test_legacy_timings_are_recovered_and_read_by_caption_builder(self):
        out = self.root / "run/voiceovers"
        out.mkdir(parents=True)
        (out / "beat-01.mp3").write_bytes(b"completed-audio")
        alignment = {"characters": list("one two"),
                     "character_start_times_seconds": [0, .1, .2, .3, .7, .8, .9],
                     "character_end_times_seconds": [.1, .2, .3, .4, .8, .9, 1.]}
        (out / "beat-01.mp3.timestamps.json").write_text(json.dumps(alignment))
        with mock.patch.object(gen_paid.subprocess, "run") as run, contextlib.redirect_stdout(io.StringIO()):
            gen_paid.step_vo(self.cfg, self.root / "run", self.beats, self.args)
            run.assert_not_called()
        self.assertTrue((out / "beat-01.timestamps.json").is_file())
        # Assert real timing differs from the uniform word-count fallback.
        beat = dict(self.beats[0], text="one two", captions=["one", "two"])
        windows = build_overlays.cue_windows(beat, self.root / "run", 0)
        self.assertEqual(windows[1][0], .7)

    def test_motion_inserts_fail_instead_of_silently_succeeding(self):
        self.cfg["edit"]["inserts"]["enabled"] = True
        with self.assertRaisesRegex(SystemExit, "not implemented"):
            gen_paid.step_inserts(self.cfg, self.root, self.beats, self.args)

    def test_lipsync_checks_both_inputs_before_any_upload(self):
        image = self.root / "still.png"
        image.write_bytes(b"image")
        proxy = mock.Mock()
        args = ["provider_commands.py", "lipsync", "--image", str(image),
                "--audio", str(self.root / "missing.mp3"), "--resolution", "720p",
                "--output", str(self.root / "clip.mp4")]
        with mock.patch.object(sys, "argv", args), mock.patch.object(provider_commands, "load_proxy", return_value=proxy):
            with self.assertRaisesRegex(RuntimeError, "Missing input"):
                provider_commands.main()
        proxy.fal_upload.assert_not_called()
        proxy.fal_generate_video.assert_not_called()

    def test_public_lipsync_uses_exact_uploaded_inputs_and_resolution(self):
        image, audio = self.root / "still.png", self.root / "voice.mp3"
        image.write_bytes(b"real-image")
        audio.write_bytes(b"real-audio")
        proxy = mock.Mock()
        proxy.fal_upload.side_effect = ["https://example.test/still", "https://example.test/audio"]
        proxy.fal_generate_video.return_value = "https://example.test/clip"
        args = ["provider_commands.py", "lipsync", "--image", str(image),
                "--audio", str(audio), "--resolution", "720p",
                "--output", str(self.root / "clip.mp4")]
        with mock.patch.object(sys, "argv", args), mock.patch.object(provider_commands, "load_proxy", return_value=proxy):
            self.assertEqual(provider_commands.main(), 0)
        proxy.fal_generate_video.assert_called_once_with("veed/fabric-1.0", {
            "image_url": "https://example.test/still", "audio_url": "https://example.test/audio", "resolution": "720p"})
        proxy.download.assert_called_once_with("https://example.test/clip", str(self.root / "clip.mp4"))

    def test_image_edit_hosts_local_reference_before_canonical_generator(self):
        proxy = mock.Mock()
        proxy.fal_upload.return_value = "https://example.test/approved-plate"
        args = ["provider_commands.py", "image", "--model", "gpt-image-2",
                "--ref-image", "plate.png", "--prompt", "same cast", "--output", "new.png"]
        with mock.patch.object(sys, "argv", args), mock.patch.object(provider_commands, "load_proxy", return_value=proxy), mock.patch.object(provider_commands.subprocess, "run") as run:
            provider_commands.main()
        call = run.call_args.args[0]
        self.assertIn(str(self.root / "create-image-gpt-image-fal/scripts/generate.py"), call)
        self.assertEqual(call[call.index("--ref-url") + 1], "https://example.test/approved-plate")
        self.assertNotIn("plate.png", call)


if __name__ == "__main__":
    unittest.main()

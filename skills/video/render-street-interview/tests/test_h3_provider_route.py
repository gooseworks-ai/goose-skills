"""Offline H3 route tests against the actual script and localhost proxy."""
import importlib.util
import json
import os
import re
from pathlib import Path
import shutil
import subprocess
import sys
import tempfile
import unittest
from PIL import Image
from urllib.parse import urlparse

SCRIPTS = Path(__file__).resolve().parents[1] / "scripts"
sys.path.insert(0, str(SCRIPTS))
import format_spec
import single_gen
import brandkit
sys.path.insert(0, str(Path(__file__).resolve().parent))
from test_single_gen_rejection import MockProxy, REF_REL, _Handler

MODEL = "minimax/h3-max/reference-to-video"

class H3RouteTests(unittest.TestCase):
    def setUp(self):
        self.tmp = Path(tempfile.mkdtemp())
        self.proxy = MockProxy()
        self.paths = []
        original = self.proxy.httpd.RequestHandlerClass
        paths = self.paths
        class RecordingHandler(original):
            def do_POST(self):
                paths.append(self.path)
                return super().do_POST()
            def do_GET(self):
                if urlparse(self.path).path == "/out.mp4" and getattr(self.server.mock, "download_failures", 0):
                    self.server.mock.download_failures -= 1
                    return self.send(503, {"error": "temporary download failure"})
                if urlparse(self.path).path.endswith("/status") and getattr(self.server.mock, "blocked", False):
                    return self.send(200, {"status": "IN_PROGRESS"})
                return super().do_GET()
        self.proxy.httpd.RequestHandlerClass = RecordingHandler
        self.root = self.tmp / "project"
        self.ref = self.root / REF_REL
        self.ref.parent.mkdir(parents=True)
        Image.new("RGB", (500, 100), "red").save(self.ref)
        self.env = {**os.environ, "GW_MEDIA_VIA": "proxy", "GW_MEDIA_PROXY_TOKEN": "local-mock-token", "GW_API_BASE": self.proxy.base,
                    "GW_CLI_LOG_DISABLED": "1", "GW_FAL_PENDING_DIR": str(self.tmp / "pending"), "GW_FAL_REJECTIONS_DIR": str(self.tmp / "rejected"), "STREET_INTERVIEW_ROOT": str(self.root),
                    "NO_PROXY": "127.0.0.1", "no_proxy": "127.0.0.1"}
        self.env.pop("GW_EXPECTED_API_ORIGIN", None)
    def tearDown(self):
        self.proxy.close()
        shutil.rmtree(self.tmp, ignore_errors=True)
    def invoke(self, *extra, seed="0"):
        return subprocess.run([sys.executable, str(SCRIPTS / "single_gen.py"), "--brand", "liquid-death", "--run", str(self.tmp / "run"),
                               "--model", MODEL, "--resolution", "1080P", "--seed", seed, *extra], env=self.env,
                              capture_output=True, text=True, timeout=60)
    def test_actual_recipe_route_uses_h3_and_finish_manifest(self):
        result = self.invoke("--yes", "--pace", "--guards")
        self.assertEqual(result.returncode, 0, result.stdout + result.stderr)
        self.assertEqual(len(self.proxy.submits), 1)
        body = self.proxy.submits[0]
        self.assertTrue(any(MODEL in p for p in self.paths))
        self.assertFalse(any("seedance" in p for p in self.paths))
        self.assertEqual(body["duration"], 12)
        self.assertEqual(body["resolution"], "1080P")
        self.assertEqual(body["seed"], 0)
        self.assertEqual(body["prompt_expansion_mode"], "disabled")
        self.assertIn("reference_image_urls", body)
        self.assertNotIn("image_urls", body)
        self.assertNotIn("generate_audio", body)
        self.assertIn("Image 1", body["prompt"])
        self.assertNotIn("@Image1", body["prompt"])
        video = self.tmp / "run/working/takes/ld-single-seed0.mp4"
        spec = importlib.util.spec_from_file_location("check_cut", SCRIPTS / "check-cut.py")
        gate = importlib.util.module_from_spec(spec);spec.loader.exec_module(gate)
        manifest = gate.find_manifest(video)
        self.assertIsNotNone(manifest)
        meta = json.loads(manifest.read_text())
        self.assertEqual(meta["model"], MODEL)
        self.assertEqual(meta["request_id"], "ok")
        self.assertEqual(meta["seed"], 0)
        self.assertTrue(meta["pace_grammar"])
        self.assertTrue(meta["guard_grammar"])
        self.assertIn("@Image1", meta["prompt"])
        self.assertEqual(format_spec.lint(meta["prompt"], pace=True, guards=True), [])
        self.assertEqual(len(format_spec.split_shots(meta["prompt"])), 8)
        self.assertIsNotNone(format_spec.location_clause(meta["prompt"]))
        with Image.open(meta["reference_files"][0]) as fitted:
            self.assertEqual(fitted.size, (500, 200))
            self.assertEqual(fitted.getpixel((0, 50)), (255, 0, 0))
        # Existing request/take is reusable, never another implicit order.
        rerun = self.invoke("--yes", "--pace", "--guards")
        self.assertNotEqual(rerun.returncode, 0)
        self.assertEqual(len(self.proxy.submits), 1)
    def test_recovery_finishes_manifest_without_new_order_or_upload(self):
        self.proxy.blocked = True
        self.env["GW_FAL_POLL_TIMEOUT_S"] = "0.01"
        first = self.invoke("--yes", "--pace", "--guards")
        self.assertNotEqual(first.returncode, 0)
        manifest = self.tmp / "run/working/takes/ld-single-seed0.json"
        pending = json.loads(manifest.read_text())
        self.assertEqual(pending["request_id"], "ok")
        self.assertEqual(pending["state"], "pending")
        self.assertEqual((len(self.proxy.submits), self.proxy.uploads), (1, 1))
        self.proxy.blocked = False
        recovered = self.invoke("--recover-request-id", "ok", "--pace", "--guards")
        self.assertEqual(recovered.returncode, 0, recovered.stdout + recovered.stderr)
        self.assertEqual((len(self.proxy.submits), self.proxy.uploads), (1, 1))
        complete = json.loads(manifest.read_text())
        self.assertEqual(complete["state"], "complete")
        self.assertEqual(complete["prompt"], pending["prompt"])
        self.assertEqual(complete["input_digest"], pending["input_digest"])
        self.assertEqual(complete["model"], MODEL)

    def test_completed_result_survives_two_download_failures_without_new_order(self):
        self.proxy.download_failures = 2
        first = self.invoke("--yes", "--pace", "--guards")
        self.assertNotEqual(first.returncode, 0)
        video = self.tmp / "run/working/takes/ld-single-seed0.mp4"
        manifest = video.with_suffix(".json")
        saved = json.loads(manifest.read_text())
        self.assertEqual(saved["state"], "download_pending")
        self.assertTrue(saved["video_url"])
        self.assertEqual(saved["provider_payload"]["resolution"], "1080P")
        self.assertFalse(video.exists())
        self.assertFalse((self.tmp / "pending/ok.json").exists())
        failed_recovery = self.invoke("--recover-request-id", "ok", "--pace", "--guards")
        self.assertNotEqual(failed_recovery.returncode, 0)
        self.assertFalse(video.exists())
        recovered = self.invoke("--recover-request-id", "ok", "--pace", "--guards")
        self.assertEqual(recovered.returncode, 0, recovered.stdout + recovered.stderr)
        self.assertTrue(video.exists())
        self.assertEqual((len(self.proxy.submits), self.proxy.uploads), (1, 1))
        complete = json.loads(manifest.read_text())
        self.assertEqual(complete["provider_payload"], saved["provider_payload"])
        self.assertEqual(complete["state"], "complete")

    def test_partial_transfer_never_looks_like_a_completed_take(self):
        from unittest.mock import patch
        dest = self.tmp / "partial.mp4"
        def broken_download(url, target):
            Path(target).write_bytes(b"PARTIAL")
            raise OSError("connection dropped during download")
        with patch.object(single_gen.urllib.request, "urlretrieve", side_effect=broken_download):
            with self.assertRaises(OSError):
                single_gen.download_take("https://example.invalid/video", dest)
        self.assertFalse(dest.exists())
        self.assertEqual(dest.with_name(dest.name + ".part").read_bytes(), b"PARTIAL")

    def test_invalid_h3_resolution_stops_before_upload(self):
        result = subprocess.run([sys.executable, str(SCRIPTS / "single_gen.py"), "--brand", "liquid-death", "--run", str(self.tmp / "run"),
                                 "--model", MODEL, "--resolution", "720p", "--yes"], env=self.env, capture_output=True, text=True)
        self.assertNotEqual(result.returncode, 0)
        self.assertEqual((self.proxy.uploads, len(self.proxy.submits)), (0, 0))
    def test_historical_provider_payload_is_unchanged(self):
        cfg = brandkit.load("liquid-death")
        prompt = format_spec.build_prompt(cfg)
        settings, field, rate = single_gen.provider_settings(format_spec.MODEL, prompt, 12, 4815)
        self.assertEqual(field, "image_urls")
        self.assertEqual(settings["prompt"], prompt)
        self.assertEqual(settings["resolution"], format_spec.RESOLUTION)
        self.assertTrue(settings["generate_audio"])
        self.assertEqual(rate, format_spec.RATE)
    def test_raw_prompt_lint_still_rejects_missing_camera_clause(self):
        cfg = brandkit.load("liquid-death")
        prompt = format_spec.build_prompt(cfg)
        broken = re.sub(re.escape(next(iter(format_spec.REQUIRED_CLAUSES))), "", prompt, flags=re.IGNORECASE)
        self.assertTrue(format_spec.lint(broken))

if __name__ == "__main__":
    unittest.main()

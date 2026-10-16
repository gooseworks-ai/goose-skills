"""QA-14: run_takes.py stops on a provider policy rejection (exit 3, reason + request id +
charge state reported and kept in manifest.json), and a re-run of the unchanged take is
refused before anything is uploaded or sent. Free: a local mock of the GooseWorks
fal-proxy, fal-storage-proxy and fal CDN, no provider call."""
import http.server
import json
import os
import pathlib
import subprocess
import sys
import tempfile
import threading
import unittest
from urllib.parse import urlparse

SCRIPT = pathlib.Path(__file__).resolve().parents[1] / "scripts" / "run_takes.py"
MODEL = "minimax/h3-max/reference-to-video"
MARK = "REAL-PERSON-REF"  # prompts carrying this are refused by the mock
LIKENESS = "The images may contain likenesses of real people"
REJECT = {"detail": [{"loc": ["body", "reference_image_urls"], "msg": LIKENESS,
                      "type": "content_policy_violation"}]}
PARTNER = {"detail": [{"msg": "partner_validation_failed", "type": "content_policy_violation"}]}
PROMPT_POLICY = {"detail": [{"msg": "This prompt contains words that violate the usage guidelines.",
                             "type": "invalid_request"}]}
NON_POLICY = {"detail": [{"loc": ["body", "reference_image_urls", 0],
                          "msg": "Failed to download the file from the given URL",
                          "type": "file_download_error"}]}


class _Handler(http.server.BaseHTTPRequestHandler):
    def log_message(self, *a):
        pass

    def send(self, status, body, headers=None):
        data = body if isinstance(body, bytes) else json.dumps(body).encode()
        self.send_response(status)
        for k, v in (headers or {}).items():
            self.send_header(k, v)
        self.send_header("content-length", str(len(data)))
        self.end_headers()
        self.wfile.write(data)

    def do_POST(self):
        n = int(self.headers.get("content-length") or 0)
        self.server.mock.handle("POST", self, self.rfile.read(n) if n else b"")

    def do_GET(self):
        self.server.mock.handle("GET", self, b"")


class MockFal:
    """fal-proxy + fal-storage-proxy + CDN on 127.0.0.1. Submits whose prompt carries MARK
    are refused with self.reject_body; others render."""

    def __init__(self):
        self.submits, self.uploads = [], []
        self.reject_body = REJECT
        self.httpd = http.server.ThreadingHTTPServer(("127.0.0.1", 0), _Handler)
        self.httpd.mock = self
        self.base = "http://127.0.0.1:%d" % self.httpd.server_port
        threading.Thread(target=self.httpd.serve_forever, daemon=True).start()

    def close(self):
        self.httpd.shutdown()
        self.httpd.server_close()

    def handle(self, method, h, raw):
        path = urlparse(h.path).path
        if path.startswith("/api/internal/fal-storage-proxy/"):
            return h.send(200, {"base_url": self.base + "/cdn", "token": "t", "token_type": "Bearer"})
        if method == "POST" and path == "/cdn/files/upload":
            self.uploads.append(raw)
            return h.send(200, {"access_url": "%s/cdn/files/u%d/%s"
                                % (self.base, len(self.uploads), h.headers.get("X-Fal-File-Name"))})
        if path.startswith("/cdn/"):
            return h.send(200, b"fake-take-mp4")
        prefix = "/api/internal/fal-proxy/"
        if not path.startswith(prefix):
            return h.send(404, {"error": "not mocked"})
        rest = path[len(prefix):]
        if method == "POST":
            payload = json.loads(raw or b"{}")
            self.submits.append({"payload": payload, "digest": h.headers.get("x-gw-input-digest")})
            if MARK in payload.get("prompt", ""):
                return h.send(422, self.reject_body,
                              {"x-fal-request-id": "req-rejected-%d" % len(self.submits)})
            q = "https://queue.fal.run/%s/requests/ok-%d" % (rest, len(self.submits))
            return h.send(200, {"request_id": "ok", "status_url": q + "/status", "response_url": q})
        if rest.endswith("/status"):
            return h.send(200, {"status": "COMPLETED"})
        return h.send(200, {"video": {"url": self.base + "/cdn/take.mp4"}})


class RunTakesRejectionTests(unittest.TestCase):
    def setUp(self):
        self.fal = MockFal()
        self.tmp = tempfile.TemporaryDirectory()
        self.home = pathlib.Path(self.tmp.name)
        (self.home / ".gooseworks").mkdir()
        (self.home / ".gooseworks" / "credentials.json").write_text(json.dumps(
            {"api_base": self.fal.base, "api_key": "test-token", "agent_id": "agent-test"}))
        self.out = self.home / "takes"
        self.out.mkdir()
        self.char = self.home / "character.png"
        self.char.write_bytes(b"creator-still-v1")
        self.prompt = self.out / "t1-prompt.txt"
        self.prompt.write_text("A creator says: this changed my mornings. " + MARK)
        self.spec = self.home / "takes.json"
        self.spec.write_text(json.dumps({
            "model": MODEL, "out": str(self.out), "char": str(self.char),
            "resolution": "768P", "aspect_ratio": "9:16",
            "takes": [{"id": "t1", "seed": 123456, "dur": 6, "covers": [0, 6], "script_sha256": "a" * 64},
                      {"id": "t2", "seed": 234567, "dur": 5, "covers": [6, 11]},
                      {"id": "t3", "seed": 345678, "dur": 5, "covers": [11, 16]}]}))
        (self.out / "t2-prompt.txt").write_text("She holds up the jar. " + MARK)
        (self.out / "t3-prompt.txt").write_text("She smiles and says: try it.")

    def tearDown(self):
        self.fal.close()
        self.tmp.cleanup()

    def run_takes(self, *args):
        env = {k: v for k, v in os.environ.items() if not k.startswith("GW_")}
        env.update(HOME=str(self.home), GW_MEDIA_VIA="proxy", GW_CLI_LOG_DISABLED="1",
                   NO_PROXY="127.0.0.1", no_proxy="127.0.0.1")
        return subprocess.run([sys.executable, str(SCRIPT), "--spec", str(self.spec), *args],
                              capture_output=True, text=True, env=env, timeout=60)

    def accepted_first_take(self):
        """Later takes need a reviewed first take (--unchained was removed): a real t1 source with a
        passing, hash-bound audio-and-picture review and the qualification for this exact configuration.
        Returns the run_takes flags that name them."""
        src = self.out / "t1-seed123456.mp4"
        subprocess.run(["ffmpeg", "-v", "error", "-y", "-f", "lavfi", "-i", "testsrc2=size=160x284:rate=24:duration=6",
                        "-f", "lavfi", "-i", "sine=frequency=300:duration=6:sample_rate=24000", "-shortest",
                        "-c:v", "libx264", "-pix_fmt", "yuv420p", "-c:a", "aac", str(src)], check=True)
        sys.path.insert(0, str(SCRIPT.parent))
        import run_takes
        spec = json.loads(self.spec.read_text())
        duration = float(subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", str(src)],
                                        capture_output=True, text=True, check=True).stdout)
        reviews = self.home / "source-reviews.json"
        reviews.write_text(json.dumps({"takes": [{
            "id": "t1", "status": "pass", "source_sha256": run_takes.file_sha256(src), "script_sha256": "a" * 64,
            "reviewer": "test reviewer", "coverage": {"video_watched": True, "audio_listened": True, "start_s": 0, "end_s": duration},
            "checks": {k: "pass" for k in ("script", "voice", "lipsync", "identity", "framing", "performance")} | {"product_action": "not_applicable"}}]}))
        qualification = self.home / "qualification.json"
        qualification.write_text(json.dumps({
            "status": "qualified", "provider": "fal", "model": MODEL, "shot_type": "talking_creator",
            "configuration_sha256": run_takes.qualification_digest(spec, src), "accepted_source_sha256": run_takes.file_sha256(src)}))
        return ["--reviews", str(reviews), "--qualification", str(qualification)]

    def manifest(self):
        return json.loads((self.out / "manifest.json").read_text())

    def test_rejection_is_reported_and_kept(self):
        r = self.run_takes("--only", "t1", "--go")
        self.assertEqual(r.returncode, 3, r.stderr)
        self.assertEqual((len(self.fal.submits), len(self.fal.uploads)), (1, 1))
        self.assertIn("SURFACE, DO NOT RETRY", r.stderr)
        self.assertIn(LIKENESS, r.stderr)
        self.assertIn("request id: req-rejected-1", r.stderr)
        self.assertIn("charge:", r.stderr)
        rej = self.manifest()["rejected"]
        self.assertEqual([x["id"] for x in rej], ["t1"])
        self.assertEqual(rej[0]["request_id"], "req-rejected-1")
        self.assertIs(rej[0]["charged"], False)
        self.assertTrue(self.fal.submits[0]["digest"])  # content digest sent with the submit

    def test_identical_rerun_sends_and_uploads_nothing(self):
        self.assertEqual(self.run_takes("--only", "t1", "--go").returncode, 3)
        r = self.run_takes("--only", "t1", "--go")
        self.assertEqual(r.returncode, 3, r.stderr)
        self.assertEqual((len(self.fal.submits), len(self.fal.uploads)), (1, 1))
        self.assertIn("already rejected", r.stderr)
        self.assertIn("req-rejected-1", r.stderr)
        dry = self.run_takes()
        self.assertEqual(dry.returncode, 0, dry.stderr)
        self.assertIn("REJECTED BEFORE: " + LIKENESS, dry.stdout)

    def test_changed_still_prompt_or_seed_is_a_new_request(self):
        self.assertEqual(self.run_takes("--only", "t1", "--go").returncode, 3)
        self.char.write_bytes(b"creator-still-v2")  # new still: sent (and refused again)
        self.assertEqual(self.run_takes("--only", "t1", "--go").returncode, 3)
        self.assertEqual(len(self.fal.submits), 2)
        self.assertNotEqual(self.fal.submits[0]["digest"], self.fal.submits[1]["digest"])
        r = self.run_takes("--only", "t1", "--go", "--reseed", "t1")  # new seed: sent
        self.assertEqual(r.returncode, 3, r.stderr)
        self.assertEqual(len(self.fal.submits), 3)
        self.prompt.write_text("A creator says: this changed my mornings.")  # new prompt: renders
        r = self.run_takes("--only", "t1", "--go")
        self.assertEqual(r.returncode, 0, r.stderr)
        self.assertEqual(len(self.fal.submits), 4)
        man = self.manifest()
        self.assertEqual(man.get("rejected"), [])
        self.assertEqual(man["takes"][0]["input_digest"], self.fal.submits[-1]["digest"])

    def test_a_recorded_take_refuses_only_itself(self):
        accepted = self.accepted_first_take()
        self.fal.reject_body = PROMPT_POLICY  # about t2's own prompt, not the still
        r = self.run_takes("--only", "t2", *accepted, "--go")
        self.assertEqual(r.returncode, 3, r.stderr)
        self.assertEqual(len(self.fal.submits), 1)
        r = self.run_takes("--only", "t2,t3", *accepted, "--go")
        self.assertEqual(r.returncode, 3, r.stderr)  # t2 refused locally, t3 still rendered
        self.assertEqual(len(self.fal.submits), 2)
        self.assertNotIn(MARK, self.fal.submits[1]["payload"]["prompt"])
        self.assertTrue((self.out / "t3-seed345678.mp4").exists())
        self.assertNotIn("not attempted", r.stderr)
        self.assertIn("(matched by input_digest)", r.stderr)
        rej = {x["id"]: x for x in self.manifest()["rejected"]}
        self.assertEqual(set(rej), {"t2"})
        self.assertTrue(rej["t2"]["from_ledger"])
        self.assertEqual(rej["t2"]["matched"], "input_digest")
        self.assertTrue(pathlib.Path(rej["t2"]["ledger_paths"][0]).exists())
        self.assertEqual([t["id"] for t in self.manifest()["takes"]], ["t3"])

    def test_a_prompt_rejection_skips_only_that_take(self):
        accepted = self.accepted_first_take()
        self.fal.reject_body = PROMPT_POLICY
        r = self.run_takes("--only", "t2,t3", *accepted, "--go")
        self.assertEqual(r.returncode, 3, r.stderr)
        self.assertEqual(len(self.fal.submits), 2)
        self.assertTrue((self.out / "t3-seed345678.mp4").exists())

    def test_a_still_rejection_stops_the_takes_that_share_the_still(self):
        accepted = self.accepted_first_take()
        for name, body in (("likeness", REJECT), ("partner_validation", PARTNER)):
            with self.subTest(name):
                self.fal.reject_body, before = body, len(self.fal.submits)
                self.char.write_bytes(b"creator-still-" + name.encode())  # a fresh request
                accepted = self.accepted_first_take()  # a new still needs its own qualification
                r = self.run_takes("--only", "t2,t3", *accepted, "--go")
                self.assertEqual(r.returncode, 3, r.stderr)
                self.assertEqual(len(self.fal.submits) - before, 1)
                self.assertIn("not sent: t3 (they use the same unchanged character still", r.stderr)
                self.assertFalse((self.out / "t3-seed345678.mp4").exists())

    def test_a_recorded_still_rejection_holds_back_every_take(self):
        accepted = self.accepted_first_take()
        self.fal.reject_body = PARTNER  # the photoreal-face refusal, recorded for t2
        self.assertEqual(self.run_takes("--only", "t2", *accepted, "--go").returncode, 3)
        # Uploads: the still and t1's voice reference (later takes carry the reviewed first take's voice).
        self.assertEqual((len(self.fal.submits), len(self.fal.uploads)), (1, 2))
        for _ in range(2):  # re-runs send nothing: not t2, and not t3 one run at a time
            r = self.run_takes("--only", "t2,t3", *accepted, "--go")
            self.assertEqual(r.returncode, 3, r.stderr)
            self.assertEqual((len(self.fal.submits), len(self.fal.uploads)), (1, 2))
            self.assertIn("not sent: t3. They use the same unchanged character still", r.stderr)
        self.char.write_bytes(b"creator-still-v2")  # a new still: a new request, so it is sent
        accepted = self.accepted_first_take()
        r = self.run_takes("--only", "t2,t3", *accepted, "--go")
        self.assertEqual(r.returncode, 3, r.stderr)
        self.assertEqual(len(self.fal.submits), 2)  # t2 sent; refused again, so t3 held back
        self.assertIn("rejected by the provider", r.stderr)
        self.fal.reject_body = PROMPT_POLICY  # the provider now objects to t2's prompt only
        self.char.write_bytes(b"creator-still-v3")
        accepted = self.accepted_first_take()
        r = self.run_takes("--only", "t2,t3", *accepted, "--go")
        self.assertEqual(r.returncode, 3, r.stderr)
        self.assertEqual(len(self.fal.submits), 4)  # t2 refused for its prompt, t3 rendered
        self.assertTrue((self.out / "t3-seed345678.mp4").exists())

    def test_non_policy_error_is_not_recorded(self):
        self.fal.reject_body = NON_POLICY
        for n in (1, 2):
            r = self.run_takes("--only", "t1", "--go")
            self.assertNotIn(r.returncode, (0, 3), r.stderr)
            self.assertIn("Failed to download the file", r.stderr)
            self.assertEqual(len(self.fal.submits), n)
        self.assertFalse((self.home / ".gooseworks" / "rejected-fal-requests").exists())


class MeasuredTakeReviewTests(unittest.TestCase):
    """Gate audit 16 Oct 2026: a take review covered by measurement is enough; no watch/listen claim."""

    def review(self, coverage, evidence=("frames at 2 fps, full resolution", "word timing against the line")):
        sys.path.insert(0, str(SCRIPT.parent))
        import content_review
        with tempfile.TemporaryDirectory() as tmp:
            take_file = pathlib.Path(tmp) / "t1.mp4"
            take_file.write_bytes(b"not decoded: the duration is passed in")
            reviews = pathlib.Path(tmp) / "source-reviews.json"
            reviews.write_text(json.dumps({"takes": [{
                "id": "t1", "status": "pass", "source_sha256": content_review.source_sha256(take_file), "script_sha256": "a" * 64,
                "reviewer": "agent (measured)", "coverage": {**coverage, "start_s": 0, "end_s": 6.0},
                "checks": {k: "pass" for k in ("script", "voice", "lipsync", "identity", "framing", "performance")} | {"product_action": "not_applicable"},
                "evidence": list(evidence)}]}))
            return content_review.require_take_review(str(reviews), {"id": "t1", "script_sha256": "a" * 64}, take_file, 6.0)

    def test_measured_coverage_passes(self):
        self.assertEqual(self.review({"motion": "measured", "audio": "measured"})["status"], "pass")
        self.assertEqual(self.review({"motion": "watched", "audio": "listened"})["status"], "pass")
        self.assertEqual(self.review({"video_watched": True, "audio_listened": True})["status"], "pass")  # the older shape
        with self.assertRaisesRegex(ValueError, "lists its evidence"):
            self.review({"motion": "measured", "audio": "measured"}, evidence=())

    def test_coverage_must_still_say_how(self):
        for coverage in ({}, {"motion": "measured"}, {"motion": "skimmed", "audio": "measured"}, {"video_watched": False, "audio_listened": True}):
            with self.assertRaisesRegex(ValueError, "how the whole take was covered"):
                self.review(coverage)


if __name__ == "__main__":
    unittest.main()

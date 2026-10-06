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
            "takes": [{"id": "t1", "seed": 123456, "dur": 6, "covers": [0, 6]}]}))

    def tearDown(self):
        self.fal.close()
        self.tmp.cleanup()

    def run_takes(self, *args):
        env = {k: v for k, v in os.environ.items() if not k.startswith("GW_")}
        env.update(HOME=str(self.home), GW_MEDIA_VIA="proxy", GW_CLI_LOG_DISABLED="1",
                   NO_PROXY="127.0.0.1", no_proxy="127.0.0.1")
        return subprocess.run([sys.executable, str(SCRIPT), "--spec", str(self.spec), *args],
                              capture_output=True, text=True, env=env, timeout=60)

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

    def test_non_policy_error_is_not_recorded(self):
        self.fal.reject_body = NON_POLICY
        for n in (1, 2):
            r = self.run_takes("--only", "t1", "--go")
            self.assertNotIn(r.returncode, (0, 3), r.stderr)
            self.assertIn("Failed to download the file", r.stderr)
            self.assertEqual(len(self.fal.submits), n)
        self.assertFalse((self.home / ".gooseworks" / "rejected-fal-requests").exists())


if __name__ == "__main__":
    unittest.main()

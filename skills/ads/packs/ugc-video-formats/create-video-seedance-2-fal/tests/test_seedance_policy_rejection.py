"""QA-14: generate.py exits 3 ("surface, do not retry") for a likeness / content-policy
rejection in every body shape, submits once, and refuses an identical re-run without a
network call. Free: a local mock of the GooseWorks fal-proxy, no provider call."""
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

SCRIPT = pathlib.Path(__file__).resolve().parents[1] / "scripts" / "generate.py"
LIKENESS = "The images may contain likenesses of real people"
MARK = "REAL-PERSON-REF"  # prompts carrying this are refused by the mock
MSG_AND_TYPE = {"detail": [{"loc": ["body", "image_urls"], "msg": LIKENESS,
                            "type": "content_policy_violation"}]}
SHAPES = {
    "type_only": {"detail": [{"loc": ["body"], "msg": "", "type": "content_policy_violation"}]},
    "msg_and_type": MSG_AND_TYPE,
    "partner_validation_msg": {"detail": [{"msg": "partner_validation_failed"}]},
    "gooseworks_wrapped": {"error": {"code": "provider_validation_failed",
                                     "message": "fal returned HTTP 422.", "provider": "fal",
                                     "status": 422, "detail": MSG_AND_TYPE}},
}
NON_POLICY = {"detail": [{"loc": ["body", "image_urls", 0],
                          "msg": "Failed to download the file from the given URL",
                          "type": "file_download_error"}]}
NSFW = {"detail": [{"msg": "NSFW content detected by the safety checker"}]}


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


class MockFalProxy:
    """The GooseWorks fal-proxy on 127.0.0.1: refuses prompts carrying MARK with
    self.reject_body, renders anything else."""

    def __init__(self):
        self.submits = []
        self.reject_body = MSG_AND_TYPE
        self.httpd = http.server.ThreadingHTTPServer(("127.0.0.1", 0), _Handler)
        self.httpd.mock = self
        self.base = "http://127.0.0.1:%d" % self.httpd.server_port
        threading.Thread(target=self.httpd.serve_forever, daemon=True).start()

    def close(self):
        self.httpd.shutdown()
        self.httpd.server_close()

    def handle(self, method, h, raw):
        path = urlparse(h.path).path
        if path.startswith("/cdn/"):
            return h.send(200, b"fake-mp4")
        prefix = "/api/internal/fal-proxy/"
        if not path.startswith(prefix):
            return h.send(404, {"error": "not mocked"})
        rest = path[len(prefix):]
        if method == "POST":
            payload = json.loads(raw or b"{}")
            self.submits.append(payload)
            if MARK in payload.get("prompt", ""):
                return h.send(422, self.reject_body,
                              {"content-type": "application/json",
                               "x-fal-request-id": "req-rejected-%d" % len(self.submits)})
            q = "https://queue.fal.run/%s/requests/ok-%d" % (rest, len(self.submits))
            return h.send(200, {"request_id": "ok", "status_url": q + "/status", "response_url": q})
        if rest.endswith("/status"):
            return h.send(200, {"status": "COMPLETED"})
        return h.send(200, {"video": {"url": self.base + "/cdn/out.mp4"}, "seed": 7})


class SeedancePolicyRejectionTests(unittest.TestCase):
    def setUp(self):
        self.proxy = MockFalProxy()
        self.tmp = tempfile.TemporaryDirectory()
        self.home = pathlib.Path(self.tmp.name)
        self.creds()

    def tearDown(self):
        self.proxy.close()
        self.tmp.cleanup()

    def creds(self):
        d = self.home / ".gooseworks"
        d.mkdir(parents=True, exist_ok=True)
        (d / "credentials.json").write_text(json.dumps(
            {"api_base": self.proxy.base, "api_key": "test-token", "agent_id": "agent-test"}))

    def run_generate(self, prompt="UGC review. " + MARK, image="https://cdn.example/creator.png",
                     extra=(), env_extra=None, home=None):
        home = home or self.home
        env = {k: v for k, v in os.environ.items() if not k.startswith("GW_")}
        env.update(HOME=str(home), GW_MEDIA_VIA="proxy", GW_CLI_LOG_DISABLED="1",
                   NO_PROXY="127.0.0.1", no_proxy="127.0.0.1")
        env.update(env_extra or {})
        out = home / "clip.mp4"
        r = subprocess.run([sys.executable, str(SCRIPT), "--prompt", prompt, "--output", str(out),
                            "--image-url", image, "--resolution", "720p", "--duration", "5",
                            *extra], capture_output=True, text=True, env=env, timeout=60)
        return r, out

    def ledger(self, home=None):
        d = (home or self.home) / ".gooseworks" / "rejected-fal-requests"
        return sorted(p.name for p in d.glob("*.json")) if d.exists() else []

    def test_every_body_shape_exits_3_after_one_submit(self):
        for name, body in SHAPES.items():
            with self.subTest(name):
                home = self.home / name
                (home / ".gooseworks").mkdir(parents=True)
                (home / ".gooseworks" / "credentials.json").write_text(
                    (self.home / ".gooseworks" / "credentials.json").read_text())
                self.proxy.reject_body, before = body, len(self.proxy.submits)
                r, out = self.run_generate(home=home)
                self.assertEqual(r.returncode, 3, r.stderr)
                self.assertEqual(len(self.proxy.submits) - before, 1)
                self.assertIn("surface, do not retry", r.stderr)
                rej = json.loads(pathlib.Path(str(out) + ".rejection.json").read_text())
                self.assertEqual(rej["exit_code"], 3)
                self.assertEqual(rej["request_id"], "req-rejected-%d" % len(self.proxy.submits))
                self.assertIs(rej["charged"], False)
                self.assertEqual(len(self.ledger(home)), 1)

    def test_identical_rerun_is_refused_without_a_submit(self):
        r1, _ = self.run_generate()
        self.assertEqual(r1.returncode, 3, r1.stderr)
        r2, out = self.run_generate()
        self.assertEqual(r2.returncode, 3, r2.stderr)
        self.assertEqual(len(self.proxy.submits), 1)
        self.assertIn("already rejected", r2.stderr)
        self.assertIn(LIKENESS, r2.stderr)
        self.assertIn("req-rejected-1", r2.stderr)
        self.assertTrue(json.loads(pathlib.Path(str(out) + ".rejection.json").read_text())["from_ledger"])

    def test_changed_inputs_submit_again(self):
        self.assertEqual(self.run_generate()[0].returncode, 3)
        r, _ = self.run_generate(image="https://cdn.example/other-creator.png")  # new image
        self.assertEqual(r.returncode, 3, r.stderr)
        r, _ = self.run_generate(extra=["--seed", "42"])  # new seed
        self.assertEqual(r.returncode, 3, r.stderr)
        self.assertEqual(len(self.proxy.submits), 3)
        r, out = self.run_generate(prompt="UGC review with an original character")  # new prompt
        self.assertEqual(r.returncode, 0, r.stderr)
        self.assertEqual(len(self.proxy.submits), 4)
        self.assertEqual(out.read_bytes(), b"fake-mp4")
        self.assertFalse(pathlib.Path(str(out) + ".rejection.json").exists())

    def test_non_policy_422_is_generic_and_not_recorded(self):
        self.proxy.reject_body = NON_POLICY
        for n in (1, 2):
            r, _ = self.run_generate()
            self.assertEqual(r.returncode, 1, r.stderr)
            self.assertIn("Failed to download the file", r.stderr)
            self.assertNotIn("surface, do not retry", r.stderr)
            self.assertEqual(len(self.proxy.submits), n)  # retrying an input error is allowed
        self.assertEqual(self.ledger(), [])

    def test_nsfw_exits_4_and_is_recorded(self):
        self.proxy.reject_body = NSFW
        r, _ = self.run_generate()
        self.assertEqual(r.returncode, 4, r.stderr)
        r, _ = self.run_generate()
        self.assertEqual(r.returncode, 4, r.stderr)
        self.assertEqual(len(self.proxy.submits), 1)

    def test_mcp_relay_wrapped_error_is_classified_and_recorded(self):
        relay = self.home / "relay"
        env = {"GW_MEDIA_VIA": "mcp", "GW_PROJECT_ID": "proj-test", "GW_RELAY_DIR": str(relay)}
        r1, _ = self.run_generate(env_extra=env)
        self.assertEqual(r1.returncode, 3, r1.stderr)  # the relay asks the agent for the call
        self.assertIn("[mcp-relay]", r1.stderr)
        req = json.loads(next(relay.glob("fal-*[0-9a-f].json")).read_text())
        self.assertIn("provider_validation_failed", req["then"])
        pathlib.Path(req["save_result_to"]).write_text(json.dumps(SHAPES["gooseworks_wrapped"]))
        r2, out = self.run_generate(env_extra=env)  # the agent saved data_post_provider's error
        self.assertEqual(r2.returncode, 3, r2.stderr)
        self.assertIn("surface, do not retry", r2.stderr)
        self.assertNotIn("[mcp-relay]", r2.stderr)
        self.assertIs(json.loads(pathlib.Path(str(out) + ".rejection.json").read_text())["charged"], False)
        pathlib.Path(req["save_result_to"]).unlink()
        r3, _ = self.run_generate(env_extra=env)  # refused from the ledger, no new MCP call
        self.assertEqual(r3.returncode, 3, r3.stderr)
        self.assertIn("already rejected", r3.stderr)
        self.assertNotIn("[mcp-relay]", r3.stderr)
        self.assertEqual(self.proxy.submits, [])


if __name__ == "__main__":
    unittest.main()

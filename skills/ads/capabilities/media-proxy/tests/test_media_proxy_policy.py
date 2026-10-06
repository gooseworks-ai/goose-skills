"""QA-14: fal policy rejections are classified in every body shape, recorded, and an
identical request is refused without a network call. Free: a local mock proxy, no provider."""
import http.server
import importlib.util
import json
import os
import pathlib
import tempfile
import threading
import unittest
from unittest import mock
from urllib.parse import urlparse

SCRIPT = pathlib.Path(__file__).resolve().parents[1] / "scripts" / "media_proxy.py"
MODEL = "bytedance/seedance-2.0/reference-to-video"
LIKENESS = "The images may contain likenesses of real people"

# The three fal 422 bodies from the QA-14 audit, plus the GooseWorks MCP wrapper
# (data_post_provider maps a provider 422 to provider_validation_failed and keeps the body).
MSG_AND_TYPE = {"detail": [{"loc": ["body", "image_urls"], "msg": LIKENESS,
                            "type": "content_policy_violation"}]}
SHAPES = {
    "type_only": ({"detail": [{"loc": ["body"], "msg": "", "type": "content_policy_violation"}]},
                  "content_policy", "content_policy_violation"),
    "msg_and_type": (MSG_AND_TYPE, "likeness", "content_policy_violation"),
    "partner_validation_msg": ({"detail": [{"msg": "partner_validation_failed"}]},
                               "partner_validation", None),
    "gooseworks_wrapped": ({"error": {"code": "provider_validation_failed",
                                      "message": "fal returned HTTP 422.", "provider": "fal",
                                      "status": 422, "detail": MSG_AND_TYPE}},
                           "likeness", "content_policy_violation"),
}
NON_POLICY = {"detail": [{"loc": ["body", "image_urls", 0],
                          "msg": "Failed to download the file from the given URL",
                          "type": "file_download_error"}]}


def load_media_proxy():
    spec = importlib.util.spec_from_file_location("media_proxy_policy_under_test", SCRIPT)
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod


class _Handler(http.server.BaseHTTPRequestHandler):
    def log_message(self, *a):
        pass

    def send(self, status, body, headers=None):
        data = body if isinstance(body, bytes) else json.dumps(body).encode()
        self.send_response(status)
        self.send_header("content-type", "application/json")
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
    """The GooseWorks fal-proxy on 127.0.0.1. decide(model, payload) -> (status, body) to
    refuse a submit, or None to accept it. status_body / result override the poll replies."""

    def __init__(self, decide):
        self.decide = decide
        self.submits = []
        self.status_body = {"status": "COMPLETED"}
        self.result = (200, {"video": {"url": "https://v3.fal.media/files/out.mp4"}, "seed": 7})
        self.httpd = http.server.ThreadingHTTPServer(("127.0.0.1", 0), _Handler)
        self.httpd.mock = self
        self.base = "http://127.0.0.1:%d" % self.httpd.server_port
        threading.Thread(target=self.httpd.serve_forever, daemon=True).start()

    def close(self):
        self.httpd.shutdown()
        self.httpd.server_close()

    def handle(self, method, h, raw):
        path = urlparse(h.path).path
        prefix = "/api/internal/fal-proxy/"
        if not path.startswith(prefix):
            return h.send(404 if path != "/api/internal/cli-logs" else 200, {})
        rest = path[len(prefix):]
        if method == "POST":
            payload = json.loads(raw or b"{}")
            self.submits.append({"model": rest, "payload": payload, "headers": dict(h.headers)})
            verdict = self.decide(rest, payload)
            if verdict is not None:
                return h.send(verdict[0], verdict[1],
                              {"x-fal-request-id": "req-rejected-%d" % len(self.submits)})
            rid = "req-ok-%d" % len(self.submits)
            q = "https://queue.fal.run/%s/requests/%s" % (rest, rid)
            return h.send(200, {"request_id": rid, "status_url": q + "/status", "response_url": q})
        if rest.endswith("/status"):
            return h.send(200, self.status_body)
        return h.send(*self.result)


class ClassifierTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.mp = load_media_proxy()

    def test_every_policy_shape_is_a_policy_rejection(self):
        for name, (body, kind, error_type) in SHAPES.items():
            with self.subTest(name):
                with self.assertRaises(self.mp.FalPolicyRejection) as cm:
                    self.mp._raise_if_fal_error(body, MODEL, http_status=422, stage="submit")
                e = cm.exception
                self.assertIsInstance(e, RuntimeError)  # old `except RuntimeError` still works
                self.assertEqual(e.kind, kind)
                self.assertEqual(e.error_type, error_type)
                self.assertIs(e.charged, False)  # explicit 4xx: the proxy releases the hold
                self.assertIn("do not retry", str(e))

    def test_msg_and_type_keeps_both(self):
        # The audit bug: msg was kept and type dropped, so this exited 1 (generic).
        with self.assertRaises(self.mp.FalPolicyRejection) as cm:
            self.mp._raise_if_fal_error(MSG_AND_TYPE, MODEL, http_status=422)
        self.assertEqual(cm.exception.reason, LIKENESS)
        self.assertIn("content_policy_violation", str(cm.exception))

    def test_wrapper_status_sets_charge_hint_and_hides_wrapper_text(self):
        body = SHAPES["gooseworks_wrapped"][0]
        with self.assertRaises(self.mp.FalPolicyRejection) as cm:
            self.mp._raise_if_fal_error(body, MODEL, stage="relay")  # status read from the body
        self.assertEqual(cm.exception.http_status, 422)
        self.assertIs(cm.exception.charged, False)
        self.assertNotIn("returned HTTP 422", cm.exception.reason)

    def test_other_body_forms(self):
        cases = {
            "detail_string": {"detail": "partner_validation_failed: rejected by the model partner"},
            "detail_dict": {"detail": {"type": "content_policy_violation", "message": "public figure"}},
            "top_level_type": {"type": "content_policy_violation"},
            "nsfw": {"detail": [{"msg": "NSFW content detected by the safety checker"}]},
        }
        for name, body in cases.items():
            with self.subTest(name):
                with self.assertRaises(self.mp.FalPolicyRejection):
                    self.mp._raise_if_fal_error(body, MODEL, http_status=422)

    def test_non_policy_error_stays_generic(self):
        with self.assertRaises(RuntimeError) as cm:
            self.mp._raise_if_fal_error(NON_POLICY, MODEL, http_status=422)
        self.assertNotIsInstance(cm.exception, self.mp.FalPolicyRejection)
        self.assertIn("Failed to download the file", str(cm.exception))
        self.assertTrue(str(cm.exception).startswith("FAL error for " + MODEL))

    def test_result_payload_is_not_an_error(self):
        self.mp._raise_if_fal_error({"video": {"url": "https://x/y.mp4"}, "seed": 1}, MODEL)
        self.mp._raise_if_fal_error({"text": "hi", "chunks": []}, "fal-ai/whisper")


class LedgerTests(unittest.TestCase):
    def setUp(self):
        self.mp = load_media_proxy()
        self.tmp = tempfile.TemporaryDirectory()
        home = pathlib.Path(self.tmp.name)
        self.rej = home / "rejected"
        self.decision = {}
        self.proxy = MockFalProxy(lambda model, payload: self.decision.get(payload.get("prompt")))
        (home / ".gooseworks").mkdir()
        (home / ".gooseworks" / "credentials.json").write_text(json.dumps(
            {"api_base": self.proxy.base, "api_key": "test-token", "agent_id": "agent-test"}))
        env = {"HOME": str(home), "GW_MEDIA_VIA": "proxy", "GW_CLI_LOG_DISABLED": "1",
               "GW_FAL_REJECTIONS_DIR": str(self.rej), "NO_PROXY": "127.0.0.1",
               "no_proxy": "127.0.0.1"}
        self.env = mock.patch.dict(os.environ, env)
        self.env.start()
        for k in ("GW_MEDIA_PROXY_TOKEN", "GW_PROJECT_ID", "GW_FAL_POLL_TIMEOUT_S"):
            os.environ.pop(k, None)
        self.mp._PENDING_DIR = home / "pending"

    def tearDown(self):
        self.env.stop()
        self.proxy.close()
        self.tmp.cleanup()

    def payload(self, prompt="likeness", url="https://cdn/a.png"):
        return {"prompt": prompt, "image_urls": [url], "duration": 5}

    def test_rejection_is_recorded_and_identical_request_refused_offline(self):
        self.decision["likeness"] = (422, MSG_AND_TYPE)
        with self.assertRaises(self.mp.FalPolicyRejection) as first:
            self.mp._fal_run(MODEL, self.payload(), poll_s=0)
        self.assertEqual(first.exception.request_id, "req-rejected-1")
        self.assertEqual(len(first.exception.ledger_paths), 1)
        self.assertEqual(len(self.proxy.submits), 1)

        for new_take in (False, True):  # a re-roll of a rejected payload is the same payload
            with self.subTest(new_take=new_take):
                with self.assertRaises(self.mp.FalPolicyRejection) as again:
                    self.mp._fal_run(MODEL, self.payload(), poll_s=0, new_take=new_take)
                self.assertTrue(again.exception.from_ledger)
                self.assertEqual(again.exception.request_id, "req-rejected-1")
                self.assertIn("already rejected", str(again.exception))
                self.assertEqual(len(self.proxy.submits), 1)  # no network call

        rec = self.mp.rejected_request(MODEL, self.payload())
        self.assertEqual(rec["reason"], LIKENESS)
        self.assertEqual(rec["request_id"], "req-rejected-1")

    def test_changed_inputs_are_sent(self):
        self.decision["likeness"] = (422, MSG_AND_TYPE)
        with self.assertRaises(self.mp.FalPolicyRejection):
            self.mp._fal_run(MODEL, self.payload(), poll_s=0)
        url = self.mp._fal_run(MODEL, self.payload(prompt="original character"), poll_s=0)
        self.assertEqual(url["video"]["url"], "https://v3.fal.media/files/out.mp4")
        with self.assertRaises(self.mp.FalPolicyRejection):  # new image: sent, refused again
            self.mp._fal_run(MODEL, self.payload(url="https://cdn/b.png"), poll_s=0)
        with self.assertRaises(self.mp.FalPolicyRejection):  # other model: sent
            self.mp._fal_run("fal-ai/other-model", self.payload(), poll_s=0)
        self.assertEqual(len(self.proxy.submits), 4)

    def test_input_digest_catches_reuploaded_urls(self):
        self.decision["likeness"] = (422, SHAPES["gooseworks_wrapped"][0])
        with self.assertRaises(self.mp.FalPolicyRejection):
            self.mp._fal_run(MODEL, self.payload(url="https://cdn/up-1.png"), poll_s=0,
                             input_digest="content-A")
        with self.assertRaises(self.mp.FalPolicyRejection) as cm:  # same content, new URL
            self.mp._fal_run(MODEL, self.payload(url="https://cdn/up-2.png"), poll_s=0,
                             input_digest="content-A")
        self.assertTrue(cm.exception.from_ledger)
        self.assertEqual(len(self.proxy.submits), 1)
        self.assertEqual(self.proxy.submits[0]["headers"].get("x-gw-input-digest"), "content-A")
        with self.assertRaises(self.mp.FalPolicyRejection) as cm:  # changed content: sent
            self.mp._fal_run(MODEL, self.payload(url="https://cdn/up-3.png"), poll_s=0,
                             input_digest="content-B")
        self.assertFalse(cm.exception.from_ledger)
        self.assertEqual(len(self.proxy.submits), 2)
        self.assertIsNone(self.mp.refuse_if_rejected(MODEL, input_digest="content-C"))

    def test_non_policy_error_is_not_recorded(self):
        self.decision["likeness"] = (422, NON_POLICY)
        for _ in range(2):
            with self.assertRaises(RuntimeError) as cm:
                self.mp._fal_run(MODEL, self.payload(), poll_s=0)
            self.assertNotIsInstance(cm.exception, self.mp.FalPolicyRejection)
        self.assertEqual(len(self.proxy.submits), 2)
        self.assertFalse(self.rej.exists() and any(self.rej.iterdir()))

    def test_failed_status_with_policy_reason(self):
        self.proxy.status_body = {"status": "FAILED", "error": LIKENESS,
                                  "error_type": "content_policy_violation"}
        with self.assertRaises(self.mp.FalPolicyRejection) as cm:
            self.mp._fal_run(MODEL, self.payload(prompt="async"), poll_s=0)
        self.assertEqual(cm.exception.stage, "status")
        self.assertIsNone(cm.exception.charged)  # rejected after acceptance: unknown
        self.assertEqual(cm.exception.request_id, "req-ok-1")
        self.assertEqual(self.mp.list_pending(), [])  # terminal, nothing to resume
        self.assertIsNotNone(self.mp.rejected_request(MODEL, self.payload(prompt="async")))

    def test_failed_status_without_policy_reason_stays_generic(self):
        self.proxy.status_body = {"status": "FAILED", "error": "downstream_service_unavailable"}
        with self.assertRaises(RuntimeError) as cm:
            self.mp._fal_run(MODEL, self.payload(prompt="infra"), poll_s=0)
        self.assertNotIsInstance(cm.exception, self.mp.FalPolicyRejection)
        self.assertIsNone(self.mp.rejected_request(MODEL, self.payload(prompt="infra")))

    def test_result_stage_422(self):
        self.proxy.result = (422, MSG_AND_TYPE)
        with self.assertRaises(self.mp.FalPolicyRejection) as cm:
            self.mp._fal_run(MODEL, self.payload(prompt="late"), poll_s=0)
        self.assertEqual(cm.exception.stage, "result")
        self.assertIs(cm.exception.charged, False)


if __name__ == "__main__":
    unittest.main()

"""QA-14 review of PR 194: single_gen.py's input digest names EVERY input by content.

media_proxy refuses a request whose input digest was rejected on policy grounds, for good. The
digest used to hash only prompt, seed, duration and the scene-ref PATH, so after one likeness
rejection a run with a different, acceptable product image was refused forever. Runs the real
single_gen.py --yes against a local mock of the GooseWorks fal-proxy + storage. Free: no
provider call. (Adapted from the reviewer's adversarial test.)"""
import http.server
import json
import os
import pathlib
import shutil
import subprocess
import sys
import tempfile
import threading
import unittest
from urllib.parse import urlparse

SKILL = pathlib.Path(__file__).resolve().parents[1]
SCRIPT = SKILL / "scripts" / "single_gen.py"
REF_REL = "clients/liquid-death/brand-assets/reference-photos/mountain-water-still-19oz-tallboy-official.png"
BAD = b"IMAGE-WITH-A-PHOTOREAL-FACE"  # the mock refuses any request carrying these bytes
GOOD = b"CLEAN-PACKSHOT-NO-PEOPLE"
LIKENESS = {"detail": [{"loc": ["body", "image_urls"], "msg": "The images may contain likenesses of real people",
                        "type": "content_policy_violation"}]}


class _Handler(http.server.BaseHTTPRequestHandler):
    def log_message(self, *a):
        pass

    def send(self, status, body, ctype="application/json"):
        data = body if isinstance(body, bytes) else json.dumps(body).encode()
        self.send_response(status)
        self.send_header("content-type", ctype)
        self.send_header("content-length", str(len(data)))
        self.end_headers()
        self.wfile.write(data)

    def do_POST(self):
        n = int(self.headers.get("content-length") or 0)
        raw = self.rfile.read(n) if n else b""
        m = self.server.mock
        path = urlparse(self.path).path
        if path.endswith("/storage/auth/token"):
            return self.send(200, {"base_url": m.base + "/cdn", "token_type": "Bearer", "token": "t"})
        if path == "/cdn/files/upload":
            m.uploads += 1
            url = "https://cdn.example/u%d.png" % m.uploads  # a NEW url for every upload
            m.url_content[url] = raw
            return self.send(200, {"access_url": url})
        prefix = "/api/internal/fal-proxy/"
        if path.startswith(prefix):
            body = json.loads(raw or b"{}")
            m.submits.append(body)
            if any(m.url_content.get(u) == BAD for u in body.get("image_urls", [])):
                return self.send(422, LIKENESS)
            q = "https://queue.fal.run/%s/requests/ok-%d" % (path[len(prefix):], len(m.submits))
            return self.send(200, {"request_id": "ok", "status_url": q + "/status", "response_url": q})
        return self.send(404, {})

    def do_GET(self):
        path = urlparse(self.path).path
        if path == "/out.mp4":
            return self.send(200, b"\x00\x00\x00\x18ftypmp42", "video/mp4")
        if path.endswith("/status"):
            return self.send(200, {"status": "COMPLETED"})
        return self.send(200, {"video": {"url": self.server.mock.base + "/out.mp4"}})


class MockProxy:
    def __init__(self):
        self.submits, self.uploads, self.url_content = [], 0, {}
        self.httpd = http.server.ThreadingHTTPServer(("127.0.0.1", 0), _Handler)
        self.httpd.mock = self
        self.base = "http://127.0.0.1:%d" % self.httpd.server_port
        threading.Thread(target=self.httpd.serve_forever, daemon=True).start()

    def close(self):
        self.httpd.shutdown()
        self.httpd.server_close()


class SingleGenRejectionTests(unittest.TestCase):
    def setUp(self):
        self.tmp = pathlib.Path(tempfile.mkdtemp())
        self.mock = MockProxy()
        home = self.tmp / "home"
        (home / ".gooseworks").mkdir(parents=True)
        (home / ".gooseworks" / "credentials.json").write_text(json.dumps(
            {"api_base": self.mock.base, "api_key": "k", "agent_id": "a"}))
        self.root = self.tmp / "root"
        self.ref = self.root / REF_REL
        self.ref.parent.mkdir(parents=True)
        self.env = {**{k: v for k, v in os.environ.items() if not k.startswith("GW_")},
                    "HOME": str(home), "GW_MEDIA_VIA": "proxy", "GW_CLI_LOG_DISABLED": "1",
                    "GW_FAL_REJECTIONS_DIR": str(self.tmp / "rejected"),
                    "STREET_INTERVIEW_ROOT": str(self.root), "NO_PROXY": "127.0.0.1",
                    "no_proxy": "127.0.0.1"}

    def tearDown(self):
        self.mock.close()
        shutil.rmtree(self.tmp, ignore_errors=True)

    def run_gen(self, *extra, brand="liquid-death", run="run"):
        return subprocess.run([sys.executable, str(SCRIPT), "--brand", brand, "--run",
                               str(self.tmp / run), "--yes", *extra],
                              env=self.env, capture_output=True, text=True, timeout=120)

    def test_identical_rejected_rerun_is_refused_before_upload(self):
        self.ref.write_bytes(BAD)
        r1 = self.run_gen()
        self.assertEqual(r1.returncode, 3, r1.stderr)
        self.assertIn("likenesses of real people", r1.stderr)
        r2 = self.run_gen()  # same bytes; the old code re-uploaded them to a NEW url
        self.assertEqual(r2.returncode, 3, r2.stderr)
        self.assertIn("already rejected", r2.stderr)
        self.assertEqual((len(self.mock.submits), self.mock.uploads), (1, 1))

    def test_changed_image_at_the_same_path_is_sent(self):
        self.ref.write_bytes(BAD)
        self.assertEqual(self.run_gen().returncode, 3)
        self.ref.write_bytes(GOOD)  # the user fixes the cause
        r2 = self.run_gen()
        self.assertEqual(r2.returncode, 0, r2.stderr)
        self.assertEqual(len(self.mock.submits), 2)

    def test_changed_image_at_a_new_path_is_sent(self):
        self.ref.write_bytes(BAD)
        self.assertEqual(self.run_gen().returncode, 3)
        other = self.ref.parent / "packshot-v2.png"
        other.write_bytes(GOOD)
        cfg = json.loads((SKILL / "brands" / "liquid-death.json").read_text())
        cfg["product"]["reference_image"] = str(other.relative_to(self.root))
        alt = self.tmp / "liquid-death-v2.json"
        alt.write_text(json.dumps(cfg))
        r2 = self.run_gen(brand=str(alt))
        self.assertEqual(r2.returncode, 0, r2.stderr)
        self.assertEqual(len(self.mock.submits), 2)

    def test_scene_reference_content_is_part_of_the_request(self):
        self.ref.write_bytes(GOOD)
        scene = self.tmp / "scene.png"
        scene.write_bytes(BAD)
        self.assertEqual(self.run_gen("--scene-ref", str(scene)).returncode, 3)
        scene.write_bytes(b"A-DIFFERENT-STREET-STILL")  # same path, new content: sent
        r2 = self.run_gen("--scene-ref", str(scene), run="run2")
        self.assertEqual(r2.returncode, 0, r2.stderr)
        self.assertEqual(len(self.mock.submits), 2)
        self.assertEqual(len(self.mock.submits[1]["image_urls"]), 2)


if __name__ == "__main__":
    unittest.main()

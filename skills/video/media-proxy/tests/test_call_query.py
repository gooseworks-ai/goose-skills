"""Custom-video quality tiers: a call's GooseWorks query (shot_scene and the upgrade fields) reaches
the proxy in both transports, and never overrides the proxy's own token or attribution. Free: the
HTTP call and the relay are stubbed, nothing is sent."""
import importlib.util
import json
import os
import pathlib
import tempfile
import unittest
from unittest import mock

SCRIPT = pathlib.Path(__file__).resolve().parents[1] / "scripts" / "media_proxy.py"
QUERY = {"shot_scene": 3, "upgrade_reason": "failed_attempt", "upgrade_attempt": "op-1",
         "upgrade_why": "label text garbled at medium", "token": "evil", "project_id": "other"}


def load():
    spec = importlib.util.spec_from_file_location("media_proxy_query", SCRIPT)
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod


class Stop(Exception):
    pass


class CallQueryTest(unittest.TestCase):
    def test_direct_proxy_sends_the_query_beside_its_own_params(self):
        mp = load()
        seen = {}

        def post(url, params=None, **kw):
            seen.update(params)
            raise Stop()

        with mock.patch.object(mp, "relay_mode", return_value=False), \
                mock.patch.object(mp, "_cfg", return_value=("https://api.example", "tok", "agent-1")), \
                mock.patch.dict(os.environ, {"GW_PROJECT_ID": "proj-1"}), \
                mock.patch.object(mp.requests, "post", side_effect=post):
            with self.assertRaises(Stop):
                mp._fal_run_once("openai/gpt-image-2/edit", {"prompt": "x", "quality": "high"}, 5, 1, False, None, QUERY)
        self.assertEqual(seen["shot_scene"], "3")
        self.assertEqual(seen["upgrade_reason"], "failed_attempt")
        self.assertEqual(seen["upgrade_attempt"], "op-1")
        self.assertEqual(seen["upgrade_why"], "label text garbled at medium")
        self.assertEqual((seen["token"], seen["agent_id"], seen["project_id"]), ("tok", "agent-1", "proj-1"))

    def test_relay_puts_the_query_in_the_data_post_args(self):
        mp = load()
        seen = {}

        def relay(kind, tool, args, then, extra=None, check=None):
            seen.update(args)
            raise Stop()

        with mock.patch.object(mp, "relay_mode", return_value=True), mock.patch.object(mp, "_relay", side_effect=relay):
            with self.assertRaises(Stop):
                mp._fal_run_once("minimax/h3-max/reference-to-video", {"prompt": "x"}, 5, 1, False, None,
                                 {"shot_scene": "2", "upgrade_reason": "customer_asked", "upgrade_quote": "sharper"})
        self.assertEqual(seen["query"], {"shot_scene": "2", "upgrade_reason": "customer_asked", "upgrade_quote": "sharper"})

    def test_no_query_sends_nothing_extra(self):
        mp = load()
        self.assertEqual(mp._call_query(None), {})
        self.assertEqual(mp._call_query({"shot_scene": None}), {})


if __name__ == "__main__":
    unittest.main()

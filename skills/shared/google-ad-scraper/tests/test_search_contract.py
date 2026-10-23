"""Recorded public actor contract; every HTTP method is mocked, no paid call."""
import importlib.util
import json
from pathlib import Path
import unittest
from unittest.mock import Mock, patch

ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location("search_google_ads", ROOT / "scripts/search_google_ads.py")
script = importlib.util.module_from_spec(spec)
spec.loader.exec_module(script)

def response(data):
    reply = Mock()
    reply.json.return_value = data
    return reply

class GoogleSearchContract(unittest.TestCase):
    def test_documented_result_limit_reaches_actor_request(self):
        contract = json.loads((ROOT / "tests/actor-input-contract.json").read_text())
        ads = [{"creativeId": "CR01614014350098432001"}]
        with patch.object(script.requests, "post", return_value=response({"data": {"id": "fixture-run"}})) as post, patch.object(script.requests, "get", side_effect=[response({"data": {"status": "SUCCEEDED", "defaultDatasetId": "fixture-dataset"}}), response(ads)]):
            self.assertEqual(script.run_ad_scraper("fixture-key", "selected.example", max_ads=23), ads)
        self.assertEqual(post.call_args.kwargs["json"], {"domain": "selected.example", contract["result_limit_field"]: 23})
        self.assertNotIn("maxItems", post.call_args.kwargs["json"])

if __name__ == "__main__":
    unittest.main()

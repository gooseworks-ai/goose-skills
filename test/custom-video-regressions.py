import importlib.util
import json
import os
from pathlib import Path
import subprocess
import sys
import tempfile
import unittest
from unittest.mock import patch

ROOT = Path(__file__).resolve().parents[1] / 'skills/ads/capabilities'
CREATOR = ROOT / 'create-creator-takes-h3/scripts'

def load(name, path):
    spec = importlib.util.spec_from_file_location(name, path)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module

class CustomVideoRegressions(unittest.TestCase):
    def test_free_character_and_take_planning_without_image(self):
        with tempfile.TemporaryDirectory() as tmp:
            out = Path(tmp)
            args = [sys.executable, str(CREATOR/'make_character.py'), '--age', '34', '--gender', 'woman', '--ethnicity', 'South Asian', '--hair', 'black hair', '--wardrobe', 'plain shirt', '--scene', 'home office', '--out', str(out/'character'), '--dry-run']
            subprocess.run(args, check=True, capture_output=True, text=True)
            self.assertTrue((out/'character/character.json').exists())
            self.assertFalse((out/'character/character.png').exists())
            (out/'beats.json').write_text(json.dumps({'beats': [{'id': 'b1', 'start': 0, 'end': 5, 'vo': 'Meet our product.'}]}))
            plan = [sys.executable, str(CREATOR/'plan_takes.py'), '--beats', str(out/'beats.json'), '--character', str(out/'character/character.json'), '--out', str(out/'takes')]
            self.assertNotEqual(subprocess.run(plan, capture_output=True).returncode, 0)
            subprocess.run(plan + ['--plan-only'], check=True, capture_output=True)
            spec = json.loads((out/'takes/takes.json').read_text())
            self.assertTrue(spec['planning_only'])
            prompt = (out/'takes/t1-prompt.txt').read_text()
            self.assertNotIn('phone propped on a stand', prompt)
            self.assertIn('No phone, camera, tripod or stand is visible', prompt)
            result = subprocess.run([sys.executable, str(CREATOR/'run_takes.py'), '--spec', str(out/'takes/takes.json'), '--only', 't1', '--go'], capture_output=True, text=True)
            self.assertNotEqual(result.returncode, 0)
            self.assertIn('planning-only spec', result.stderr)

    def test_origin_mismatch_fails_before_http(self):
        proxy = load('proxy', ROOT/'media-proxy/scripts/media_proxy.py')
        with patch.dict(os.environ, {'GW_EXPECTED_API_ORIGIN': 'https://staging.example.test', 'GW_MEDIA_PROXY_TOKEN': 'test', 'GW_API_BASE': 'https://production.example.test'}, clear=True):
            with self.assertRaisesRegex(RuntimeError, 'origins differ'):
                proxy._cfg()
        with patch.dict(os.environ, {'GW_MEDIA_VIA': 'mcp'}, clear=True), patch.object(Path, 'exists', side_effect=AssertionError('credentials inspected')):
            self.assertTrue(proxy.relay_mode())

    def test_screen_framing_preserves_full_width(self):
        sys.path.insert(0, str(ROOT/'footage-cutlist/scripts'))
        filmed = load('filmed', ROOT/'footage-cutlist/scripts/filmed.py')
        self.assertEqual(filmed.DEFAULTS['fit'], 'width')

if __name__ == '__main__':
    unittest.main()

"""The selector's route contract: support status, person-reference rule and participant limit.

Free and offline: no provider calls, no media. Run from the package folder with
`python -m unittest discover -s tests -p 'test_*.py' -v`.
"""
import json
from pathlib import Path
import subprocess
import sys
import tempfile
import unittest

SCRIPTS = Path(__file__).resolve().parents[1] / "scripts"
sys.path.insert(0, str(SCRIPTS))
from prepare_script_context import select_context

sys.path.insert(0, str(Path(__file__).resolve().parent))
from test_conversation import ref as compatible_reference


def brief(**fields):
    base = {"brand_id": "route-test", "language": "en"}
    base.update(fields)
    return base


def routes(result):
    return [alt["route"] for alt in result["alternatives"]]


class SelectorRouteTests(unittest.TestCase):
    def test_product_guess_with_a_physical_product_is_a_supported_render(self):
        result = select_context(brief(mode="product-guess", offering_type="physical",
                                      interaction_type="product-guess", participants=4), [])
        self.assertEqual(result["schema_version"], "street-script-context.v3")
        self.assertEqual(result["route"]["support"], "render")
        self.assertEqual(result["route"]["person_reference"], "forbidden")
        self.assertEqual(result["route"]["max_participants"], 4)
        self.assertEqual(result["route"]["participants"], 4)
        self.assertEqual(result["route_gaps"], [])
        self.assertEqual(result["alternatives"], [])
        self.assertNotEqual(result["status"], "unsupported-route")

    def test_single_participant_mic_only_software_is_preview_only(self):
        result = select_context(brief(mode="conversation", offering_type="digital",
                                      interaction_type="mic-only", participants=1), [])
        self.assertEqual(result["route"]["support"], "preview-only")
        self.assertEqual(result["route"]["person_reference"], "forbidden")
        self.assertEqual(result["route"]["reference_images"], [])
        self.assertEqual(result["route_gaps"], [])
        self.assertNotEqual(result["status"], "unsupported-route")

    def test_three_person_software_interview_has_no_supported_route(self):
        # The GOOSE-3909 street-interview run: digital software, three participants plus an
        # interviewer, mic-only. Conversation allows one participant; product-guess needs a
        # physical product. The right answer is to stop and offer the alternatives.
        result = select_context(brief(mode="conversation", offering_type="digital",
                                      interaction_type="mic-only", participants=3), [])
        self.assertEqual(result["status"], "unsupported-route")
        self.assertTrue(any("one participant" in gap and "3 requested" in gap
                            for gap in result["route_gaps"]), result["route_gaps"])
        self.assertIn("ugc-street-testimonial", routes(result))
        self.assertIn("custom", routes(result))
        # The reduced, single-participant conversation is offered, and says how it differs.
        mic_only = next(a for a in result["alternatives"] if a["route"] == "conversation/mic-only")
        self.assertIn("one participant", mic_only["differs"])
        self.assertIn("preview only", mic_only["differs"])
        custom = next(a for a in result["alternatives"] if a["route"] == "custom")
        self.assertIn("people in text", custom["differs"])

    def test_product_guess_for_a_digital_offering_needs_a_physical_product(self):
        result = select_context(brief(mode="product-guess", offering_type="digital",
                                      interaction_type="product-guess"), [])
        self.assertEqual(result["status"], "unsupported-route")
        self.assertTrue(any("physical product" in gap for gap in result["route_gaps"]),
                        result["route_gaps"])
        self.assertIn("conversation/mic-only", routes(result))
        self.assertNotIn("product-guess", routes(result))

    def test_existing_mode_interaction_guard_is_unchanged(self):
        result = select_context(brief(mode="conversation", offering_type="service",
                                      interaction_type="product-guess"), [])
        self.assertIn("object guessing belongs to product-guess execution", result["brief_gaps"])
        self.assertEqual(result["route_gaps"], [])
        self.assertEqual(result["status"], "needs-reference")

    def test_unsupported_route_selects_no_reference_even_when_one_fits(self):
        result = select_context(brief(mode="conversation", offering_type="service",
                                      interaction_type="mic-only", participants=3),
                                [compatible_reference()])
        self.assertEqual(result["status"], "unsupported-route")
        self.assertEqual(result["references"], [])
        # The same brief with one participant would have selected it.
        ready = select_context(brief(mode="conversation", offering_type="service",
                                     interaction_type="mic-only", participants=1),
                               [compatible_reference()])
        self.assertEqual(ready["status"], "ready-for-writing")

    def test_too_many_people_offers_the_same_route_at_its_limit(self):
        guess = select_context(brief(mode="product-guess", offering_type="physical",
                                     interaction_type="product-guess", participants=5), [])
        self.assertEqual(guess["status"], "unsupported-route")
        self.assertIn("product-guess supports up to four participants; 5 requested", guess["route_gaps"])
        self.assertEqual(guess["alternatives"][0],
                         {"route": "product-guess", "differs": "up to four participants; renders"})
        sample = select_context(brief(mode="conversation", offering_type="physical",
                                      interaction_type="product-sample", participants=3), [])
        self.assertEqual(sample["alternatives"][0]["route"], "conversation/product-sample")
        self.assertNotIn("conversation/mic-only", routes(sample))

    def test_invalid_participant_count_is_a_brief_gap_not_a_route_gap(self):
        for value in (0, True, "3", 2.5):
            with self.subTest(participants=value):
                result = select_context(brief(mode="conversation", offering_type="digital",
                                              interaction_type="mic-only", participants=value), [])
                self.assertTrue(any("participants must be a whole number" in gap
                                    for gap in result["brief_gaps"]))
                self.assertEqual(result["route_gaps"], [])
                self.assertEqual(result["status"], "needs-reference")
                self.assertIsNone(result["route"]["participants"])

    def test_cli_exits_2_and_writes_the_route_for_an_unsupported_brief(self):
        with tempfile.TemporaryDirectory() as tmp:
            path = Path(tmp) / "brief.json"
            out = Path(tmp) / "context.json"
            path.write_text(json.dumps(brief(mode="conversation", offering_type="digital",
                                             interaction_type="mic-only", participants=3)))
            run = subprocess.run([sys.executable, str(SCRIPTS / "prepare_script_context.py"),
                                  "--brief", str(path), "--out", str(out)],
                                 capture_output=True, text=True)
            self.assertEqual(run.returncode, 2, run.stderr)
            self.assertIn("unsupported-route", run.stdout)
            self.assertEqual(json.loads(out.read_text())["status"], "unsupported-route")


if __name__ == "__main__":
    unittest.main()

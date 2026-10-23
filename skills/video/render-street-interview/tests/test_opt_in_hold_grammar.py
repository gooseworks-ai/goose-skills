"""Opt-in hold and handover grammar (2026-10-06, Olipop and Graza second-brand tests).

Every flag lives in `generation` on the brand config and is off by default, so the legacy
snapshots in test_prompt_budget.py are the proof that nothing else moved."""
import copy
import hashlib
import json
import sys
import unittest
from pathlib import Path

PACKAGE = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(PACKAGE / "scripts"))

import brandkit  # noqa: E402
import format_spec  # noqa: E402


def _flags(cfg):
    g = cfg["generation"]
    return dict(pace=bool(g.get("pace_grammar")), guards=bool(g.get("guard_grammar")),
                mic=bool(g.get("mic_grammar")), plain=bool(g.get("plain_grammar")),
                answers_only=bool(g.get("answers_only")), mic_ref=bool(g.get("mic_ref_grammar")),
                can_size=bool(g.get("can_size_grammar")), can_sealed=bool(g.get("can_sealed_grammar")),
                upright=bool(g.get("upright_grammar")), one_mic=bool(g.get("one_mic_grammar")))


def _build(cfg):
    flags = _flags(cfg)
    prompt = format_spec.build_prompt(cfg, **flags, prompt_version=2)
    return prompt, format_spec.lint(prompt, **flags, prompt_version=2)


class OptInHoldGrammar(unittest.TestCase):
    def setUp(self):
        self.can = brandkit.load("olipop-ep3-a")
        self.bottle = brandkit.load("graza-ep1-b")

    def test_the_shipped_configs_lint_clean(self):
        for name in ("olipop-ep3-a", "olipop-ep3-b", "olipop-ep3-c",
                     "graza-ep1-a2", "graza-ep1-b", "graza-ep1-c"):
            with self.subTest(config=name):
                self.assertEqual(_build(brandkit.load(name))[1], [])

    def test_handover_opens_the_shot_and_the_product_clause_allows_it(self):
        prompt, _ = _build(self.can)
        self.assertIn("THE SHOT OPENS ON THE HANDOVER", prompt)
        self.assertIn("is PASSED ON CAMERA at the start of each person's first shot", prompt)
        # The clause that used to win against the handover is gone when the flag is on.
        self.assertNotIn("never the interviewer's", prompt)
        off = copy.deepcopy(self.can)
        off["generation"]["handover_grammar"] = False
        self.assertIn("never the interviewer's", _build(off)[0])
        self.assertNotIn("THE SHOT OPENS ON THE HANDOVER", _build(off)[0])

    def test_level_camera_removes_the_glance_that_tipped_the_can(self):
        prompt, _ = _build(self.can)
        self.assertNotIn("glances down and back up", prompt)
        self.assertIn("THE CAMERA IS LOW, AT CHEST HEIGHT", prompt)
        off = copy.deepcopy(self.can)
        off["generation"]["level_camera"] = False
        self.assertIn("glances down and back up", _build(off)[0])

    def test_real_hold_keeps_every_linted_needle(self):
        prompt, errors = _build(self.can)
        self.assertEqual(errors, [])
        low = prompt.lower()
        for needle in ("upright and vertical", "the lid is never shown", "never by handling",
                       "front label is turned toward the lens",
                       "closed, sealed and unopened"):
            with self.subTest(needle=needle):
                self.assertIn(needle, low)
        self.assertIn("THE INTERVIEWER IS ONE PERSON AND LOOKS THE SAME IN EVERY SHOT", prompt)

    def test_no_signage_replaces_the_distant_signs_sentence(self):
        prompt, _ = _build(self.can)
        self.assertIn("THERE ARE NO SHOPS, NO SHOP SIGNS", prompt)
        self.assertNotIn("Street signs and shopfronts are present", prompt)

    def test_a_bottle_keeps_the_natural_hold_and_its_cap_may_be_seen(self):
        prompt, errors = _build(self.bottle)
        self.assertEqual(errors, [])
        self.assertIn("THE BOTTLE IS HELD THE WAY ANYONE HOLDS A COLD DRINK", prompt)
        self.assertIn("its cap stays on top, and THE TOP EDGE IS NEVER SHOWN from above", prompt)
        self.assertNotIn("THE LID IS NEVER SHOWN", prompt)
        self.assertNotIn("ring pull", prompt)

    def test_a_payoff_that_reads_looks_at_the_side_facing_the_reader(self):
        cfg = copy.deepcopy(brandkit.load("olipop-ep3-c"))
        cfg["shots"][-1]["reads"] = True
        prompt, errors = _build(cfg)
        self.assertEqual(errors, [])
        self.assertIn("lowers only her eyes to the side of the upright can that faces her", prompt)

    def test_the_paid_prompts_are_pinned(self):
        rows = {r["config"]: r for r in json.loads(
            (PACKAGE / "tests/fixtures/prompt-snapshots.json").read_text())}
        for name in ("olipop-ep3-a", "graza-ep1-a2"):
            with self.subTest(config=name):
                prompt, _ = _build(brandkit.load(name))
                self.assertEqual(hashlib.sha256(prompt.encode()).hexdigest(), rows[name]["sha256"])


if __name__ == "__main__":
    unittest.main()

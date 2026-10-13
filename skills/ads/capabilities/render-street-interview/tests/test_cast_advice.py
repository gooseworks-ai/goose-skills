"""The cast advisory (2026-10-13): thin or copied cast descriptions bring back the same
faces in every brand's video. Advice only: it must never block a take or change a prompt.
Free: no network."""
import copy
import pathlib
import sys
import unittest

SCRIPTS = pathlib.Path(__file__).resolve().parents[1] / "scripts"
sys.path.insert(0, str(SCRIPTS))

import brandkit  # noqa: E402
import format_spec  # noqa: E402

FULL = ("a stocky Black man in his late thirties with a short greying beard and a shaved head, "
        "in a plain grey jumper, with a plain rucksack on one shoulder")
FULL_2 = ("a tall, thin South Asian woman in her sixties with a long grey plait, in a plain navy "
          "coat, with an umbrella")
THIN = "a man in his thirties, grey hoodie, with a plain rucksack"


def cfg():
    return brandkit.load("graza-ep1-a2")


class CastAdviceTests(unittest.TestCase):
    def test_a_thin_person_is_named_with_what_is_missing(self):
        notes = brandkit.cast_advice(cfg())
        self.assertTrue(any("shot 1" in n and "hair" in n and "build" in n for n in notes), notes)
        self.assertTrue(any("all-white corner" in n for n in notes), notes)

    def test_a_fully_written_cast_gets_no_advice(self):
        c = cfg()
        c["shots"][0]["subject"], c["shots"][2]["subject"] = FULL, FULL_2
        self.assertEqual(brandkit.cast_advice(c), [])

    def test_a_person_copied_from_another_brand_is_flagged(self):
        c = cfg()
        c["shots"][0]["subject"], c["shots"][2]["subject"] = FULL, FULL_2
        notes = brandkit.cast_advice(c, other_subjects=[FULL.upper()])
        self.assertEqual(len(notes), 1, notes)
        self.assertIn("another brand", notes[0])

    def test_the_same_person_twice_in_one_cast_is_flagged(self):
        c = cfg()
        c["shots"][0]["subject"] = c["shots"][2]["subject"] = FULL
        self.assertTrue(any("repeats shot 1" in n for n in brandkit.cast_advice(c)))

    def test_advice_never_blocks_validation_or_changes_the_prompt(self):
        c = cfg()
        brandkit.validate(copy.deepcopy(c))          # a thin cast still validates
        flags = dict(pace=True, guards=True, plain=True, upright=True, one_mic=True, prompt_version=2)
        before = format_spec.build_prompt(copy.deepcopy(c), **flags)
        brandkit.cast_advice(c, brandkit.other_subjects(c))
        self.assertEqual(format_spec.build_prompt(c, **flags), before)

    def test_other_subjects_leaves_out_the_brands_own_configs(self):
        c = cfg()
        own = {s["subject"] for s in c["shots"] if s.get("subject")}
        others = set(brandkit.other_subjects(c))
        self.assertTrue(others)
        self.assertIn(THIN, own)
        # another Graza config may share it, but no other BRAND's list may supply it
        self.assertNotIn(THIN, others)

    def test_a_garment_or_bag_that_draws_a_logo_is_named(self):
        c = cfg()
        c["shots"][0]["subject"] = FULL.replace("jumper", "hoodie")
        c["shots"][2]["subject"] = FULL_2.replace("an umbrella", "a plain shopping bag")
        notes = brandkit.cast_advice(c)
        self.assertTrue(any("shot 1" in n and "hoodie" in n and "logo" in n for n in notes), notes)
        self.assertTrue(any("shot 3" in n and "shopping bag" in n for n in notes), notes)

    def test_a_cape_is_not_a_cap(self):
        c = cfg()
        c["shots"][0]["subject"], c["shots"][2]["subject"] = FULL + ", capable hands", FULL_2
        self.assertEqual(brandkit.cast_advice(c), [])

    def test_conversation_mode_has_no_cast_advice(self):
        self.assertEqual(brandkit.cast_advice({"mode": "conversation", "shots": []}), [])


if __name__ == "__main__":
    unittest.main()

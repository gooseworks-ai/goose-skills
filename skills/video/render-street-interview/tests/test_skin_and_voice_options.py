"""The opt-in skin clause and voice descriptions (reported 2026-10-13: the cast reads
"way too smooth, looking AI", and nobody had reviewed the voices).

Both are DRAFT and unjudged: these tests prove only that they are opt-in, that they leave
every recorded prompt unchanged when off, and that they keep the format's own rules.
Free: no network, no provider call."""
import copy
import pathlib
import sys
import unittest

SCRIPTS = pathlib.Path(__file__).resolve().parents[1] / "scripts"
sys.path.insert(0, str(SCRIPTS))

import brandkit  # noqa: E402
import format_spec  # noqa: E402

FLAGS = dict(pace=True, guards=True, plain=True, upright=True, one_mic=True, prompt_version=2)


def cfg():
    return brandkit.load("graza-ep1-a2")


class SkinAndVoiceOptionTests(unittest.TestCase):
    def test_off_by_default_so_recorded_prompts_do_not_change(self):
        base = format_spec.build_prompt(cfg(), **FLAGS)
        self.assertNotIn("UNRETOUCHED SKIN", base)
        self.assertNotIn("VOICES:", base)
        off = cfg()
        off["generation"]["skin_grammar"] = False
        self.assertEqual(format_spec.build_prompt(off, **FLAGS), base)

    def test_skin_clause_is_added_once_and_uses_no_banned_word(self):
        c = cfg()
        c["generation"]["skin_grammar"] = True
        p = format_spec.build_prompt(c, **FLAGS)
        self.assertEqual(p.count("EVERY FACE HAS ORDINARY UNRETOUCHED SKIN"), 1)
        self.assertEqual([b for b in format_spec.BANNED_VOCAB if b in p.lower()], [])
        # It names no defect and asks for no camera style: both were paid for and rejected.
        for word in ("blotch", "eye bag", "film grain", "depth of field", "pore"):
            self.assertNotIn(word, format_spec._SKIN.lower())

    def test_skin_clause_ties_the_hands_to_the_face(self):
        # Seed 6222: the face followed the description and the hand holding the bottle did not.
        c = cfg()
        c["generation"]["skin_grammar"] = True
        p = format_spec.build_prompt(c, **FLAGS)
        self.assertIn("SAME SKIN TONE AS THEIR OWN FACE", p)
        self.assertIn("never the interviewer's", p)

    def test_voices_name_each_person_once_before_the_sound_sentence(self):
        c = cfg()
        c["interviewer_voice"] = "a quick, friendly voice in his thirties"
        c["shots"][1]["voice"] = "a low, dry voice that sounds his age"
        c["shots"][3]["voice"] = "a soft older voice, unhurried"
        p = format_spec.build_prompt(c, **FLAGS)
        self.assertIn("The interviewer, off camera, has a quick, friendly voice in his thirties.", p)
        self.assertIn("The man has a low, dry voice that sounds his age.", p)
        self.assertIn("The older woman has a soft older voice, unhurried.", p)
        self.assertLess(p.index("VOICES:"), p.index("Sound: the voices close on the microphone"))
        self.assertEqual(p.count("VOICES:"), 1)

    def test_options_keep_every_required_clause(self):
        c = cfg()
        c["generation"]["skin_grammar"] = True
        c["shots"][1]["voice"] = "a low, dry voice"
        base, new = format_spec.build_prompt(cfg(), **FLAGS), format_spec.build_prompt(c, **FLAGS)
        for needle in format_spec.REQUIRED_CLAUSES:
            if needle.lower() in base.lower():
                self.assertIn(needle.lower(), new.lower(), needle)

    def test_a_voice_that_would_read_as_dialogue_is_refused(self):
        for bad in ('says "hello" loudly', "a low voice.", "", "x" * 91):
            c = copy.deepcopy(cfg())
            c["shots"][1]["voice"] = bad
            with self.assertRaises(SystemExit, msg=repr(bad)):
                brandkit.validate(c)

    def test_a_voice_on_a_shot_with_no_person_named_is_refused(self):
        c = copy.deepcopy(cfg())
        c["shots"][1].pop("noun")
        c["shots"][1]["voice"] = "a low, dry voice"
        with self.assertRaises(SystemExit):
            brandkit.validate(c)

    def test_a_valid_voice_passes_validation(self):
        c = copy.deepcopy(cfg())
        c["interviewer_voice"] = "a quick, friendly voice in his thirties"
        c["shots"][1]["voice"] = "a low, dry voice that sounds his age"
        brandkit.validate(c)


if __name__ == "__main__":
    unittest.main()

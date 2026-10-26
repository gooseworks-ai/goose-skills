"""2.4.0: a both-hands action refuses a handheld selfie, character.json records voice_pair, and
plan_takes.py sizes takes from the reference's rate (capped at 3.2 words a second). Free: no
network, no paid call (Voice Design is only a request body here)."""
import json
from pathlib import Path
import subprocess
import sys
import tempfile
import unittest

SCRIPTS = Path(__file__).resolve().parents[1] / "scripts"
sys.path.insert(0, str(SCRIPTS))
from pair_voice import pair_voice, voice_labels  # noqa: E402
from plan_takes import both_hands  # noqa: E402

IDENTITY = ["--age", "28", "--gender", "woman", "--ethnicity", "White",
            "--hair", "long dark brown hair, tucked behind one ear",
            "--wardrobe", "plain sage-green ribbed tank top",
            "--scene", "a lived-in bedroom, a wooden dresser behind her, in focus"]
LIBRARY = {"voices": [
    {"voice_id": "zara", "name": "Zara", "gender": "Female", "age": "young", "accent": "american", "descriptive": "upbeat", "use_case": "social_media"},
    {"voice_id": "old-f", "name": "Ruth", "gender": "Female", "age": "old", "accent": "american", "descriptive": "upbeat"},
    {"voice_id": "uk-f", "name": "Imogen", "gender": "Female", "age": "young", "accent": "british", "descriptive": "upbeat"},
    {"voice_id": "calm-f", "name": "Ava", "gender": "Female", "age": "young", "accent": "american", "descriptive": "calm"},
    {"voice_id": "acct-f", "name": "Account voice", "labels": {"gender": "female", "age": "young", "accent": "american", "descriptive": "upbeat"}},
]}


def run(script, *args):
    return subprocess.run([sys.executable, str(SCRIPTS / script), *args], capture_output=True, text=True)


class BothHandsTests(unittest.TestCase):
    def test_the_words_and_feature_that_mean_both_hands(self):
        for text in ("She applies the serum", "smooths the strip flat", "presses it on", "peels it off slowly",
                     "squeezes the side of her nose", "holds the box with both hands"):
            self.assertTrue(both_hands([text]), text)
        self.assertTrue(both_hands([], ["application"]))
        self.assertTrue(both_hands([], ["precise_product_action"]), "the old name is an alias")
        self.assertIsNone(both_hands(["she waves at the camera", "talks to camera"], ["speaking_face"]))

    def test_make_character_refuses_a_selfie_for_a_both_hands_action_and_says_so(self):
        with tempfile.TemporaryDirectory() as tmp:
            out = Path(tmp) / "c"
            r = run("make_character.py", *IDENTITY, "--no-voice-pair", "--recording", "selfie",
                    "--action", "she presses the strip onto her nose with both hands", "--out", str(out), "--dry-run")
            self.assertEqual(r.returncode, 0, r.stderr)
            self.assertIn("refused selfie", r.stdout)
            saved = json.loads((out / "character.json").read_text())
            self.assertEqual(saved["recording"], "counter")
            self.assertEqual((saved["capture_decision"]["requested"], saved["capture_decision"]["used"]), ("selfie", "counter"))
            prompt = (out / "character-prompt.txt").read_text()
            self.assertIn("propped up outside the frame and nobody holds it", prompt)
            self.assertNotIn("One hand supports a phone", prompt)
            # A selfie with no both-hands action stays a selfie.
            r = run("make_character.py", *IDENTITY, "--no-voice-pair", "--recording", "selfie", "--action", "she talks to camera",
                    "--out", str(Path(tmp) / "d"), "--dry-run")
            self.assertEqual(json.loads((Path(tmp) / "d" / "character.json").read_text())["recording"], "selfie")


class VoicePairTests(unittest.TestCase):
    def test_labels_follow_the_character(self):
        self.assertEqual(voice_labels(28, "woman", "American", "upbeat"),
                         {"gender": "female", "age": "young", "accent": "american", "energy": "upbeat"})
        self.assertEqual(voice_labels(41, "man")["age"], "middle_aged")
        self.assertEqual(voice_labels(62, "non-binary person")["gender"], "neutral")

    def test_a_library_voice_must_match_gender_age_and_accent(self):
        pair = pair_voice(28, "woman", "american", "upbeat", LIBRARY["voices"], exclude=("zara",))
        self.assertEqual(pair["source"], "library")
        self.assertEqual(pair["voice_id"], "acct-f", "account voices are read from their labels map")
        self.assertEqual(pair["matched_on"], ["gender", "age", "accent", "energy"])
        # Excluding every young American woman leaves no match: a Voice Design request instead.
        none = pair_voice(28, "woman", "american", "upbeat", LIBRARY["voices"], exclude=("zara", "acct-f", "calm-f"))
        self.assertEqual(none["source"], "voice_design")

    def test_voice_design_request_uses_the_documented_fields(self):
        pair = pair_voice(28, "woman", "american", "upbeat")
        self.assertEqual(pair["request"]["method"], "POST")
        self.assertEqual(pair["request"]["path"], "/v1/text-to-voice/design")
        body = pair["request"]["body"]
        self.assertEqual(set(body), {"voice_description", "model_id", "auto_generate_text"})
        self.assertIn(body["model_id"], ("eleven_multilingual_ttv_v2", "eleven_ttv_v3"))
        self.assertIn("28-year-old woman with a natural American accent", body["voice_description"])
        self.assertEqual(pair["save"]["path"], "/v1/text-to-voice")
        self.assertEqual(set(pair["save"]["body"]), {"voice_name", "voice_description", "generated_voice_id"})
        # Preview text is sent only inside the API's 100-1000 characters; otherwise it is auto-generated.
        text = "So I tried these strips for a week, and honestly the first one shocked me. Here is what came out of my nose."
        self.assertEqual(pair_voice(28, "woman", sample_text=text)["request"]["body"]["text"], text)
        self.assertTrue(pair_voice(28, "woman", sample_text="too short")["request"]["body"]["auto_generate_text"])

    def test_make_character_records_voice_pair(self):
        with tempfile.TemporaryDirectory() as tmp:
            voices = Path(tmp) / "voices.json"
            voices.write_text(json.dumps(LIBRARY))
            out = Path(tmp) / "c"
            r = run("make_character.py", *IDENTITY, "--voice-accent", "american", "--voice-energy", "upbeat",
                    "--voices", str(voices), "--voice-exclude", "zara", "--out", str(out), "--dry-run")
            self.assertEqual(r.returncode, 0, r.stderr)
            pair = json.loads((out / "character.json").read_text())["voice_pair"]
            self.assertEqual((pair["source"], pair["voice_id"]), ("library", "acct-f"))
            out2 = Path(tmp) / "d"
            run("make_character.py", *IDENTITY, "--voice-design", "--out", str(out2), "--dry-run")
            self.assertEqual(json.loads((out2 / "character.json").read_text())["voice_pair"]["source"], "voice_design")


class PlanPaceAndCaptureTests(unittest.TestCase):
    def plan(self, tmp, beats, character, *extra):
        cut = Path(tmp) / "cut.json"
        cut.write_text(json.dumps(beats))
        ch = Path(tmp) / "character.json"
        ch.write_text(json.dumps(character))
        out = Path(tmp) / "takes"
        r = run("plan_takes.py", "--beats", str(cut), "--character", str(ch), "--out", str(out), "--plan-only", *extra)
        self.assertEqual(r.returncode, 0, r.stderr)
        return json.loads((out / "takes.json").read_text()), r, out

    CHARACTER = {"image": "character.png", "identity": "a White woman aged 28, long dark brown hair",
                 "environment": "a lived-in bedroom", "capture": "phone", "recording": "selfie"}

    def test_reference_rate_sizes_the_takes_capped_at_3_2(self):
        # 40 words over 16 s of beat time (2.5 words a second, the slow read).
        words = " ".join(["word"] * 10)
        beats = {"beats": [{"id": i, "start": 4.0 * i, "end": 4.0 * i + 3.9, "vo": words} for i in range(4)]}
        with tempfile.TemporaryDirectory() as tmp:
            by_beats, _, _ = self.plan(tmp, beats, self.CHARACTER)
            self.assertEqual(by_beats["pace"]["sized_from"], "beat_times")
            by_ref, r, _ = self.plan(tmp, beats, self.CHARACTER, "--reference-wps", "4.09")
            self.assertEqual((by_ref["pace"]["reference_wps"], by_ref["pace"]["planned_wps"], by_ref["pace"]["capped"]), (4.09, 3.2, True))
            self.assertIn("native cap", r.stderr)
            # At 3.2 words a second the 40 words need 12.5 s plus three 0.3 s pauses: one 14 s take, where the
            # slow beat times (15.9 s) needed two takes and 18 s.
            self.assertEqual([t["dur"] for t in by_ref["takes"]], [14])
            self.assertEqual(len(by_beats["takes"]), 2)
            self.assertLess(sum(t["dur"] for t in by_ref["takes"]), sum(t["dur"] for t in by_beats["takes"]))
            slow, _, _ = self.plan(tmp, beats, self.CHARACTER, "--reference-wps", "2.5")
            self.assertEqual((slow["pace"]["planned_wps"], slow["pace"]["capped"]), (2.5, False))

    def test_a_lone_dash_is_not_a_word(self):
        from plan_takes import estimated
        timed = estimated([{"id": "a", "vo": "so \u2014 this . works"}], 2.0)
        self.assertEqual(timed[0]["end"], 1.5, "three real words at 2 words a second")

    def test_both_hands_beats_refuse_phone_selfie_and_use_phone_counter(self):
        beats = {"beats": [{"id": 1, "start": 0, "end": 3, "vo": "Watch this.", "action": "she peels the strip off her nose"}]}
        with tempfile.TemporaryDirectory() as tmp:
            takes, r, out = self.plan(tmp, beats, self.CHARACTER)
            self.assertEqual(takes["take_capture"], "phone_counter")
            self.assertEqual(takes["capture_decision"]["requested"], "phone_selfie")
            self.assertIn("refused phone_selfie", r.stderr)
            prompt = (out / "t1-prompt.txt").read_text()
            self.assertIn("Nobody holds the phone", prompt)
            self.assertNotIn("handheld phone selfie", prompt)
            talk = {"beats": [{"id": 1, "start": 0, "end": 3, "vo": "Hi there.", "action": "talks to camera"}]}
            takes, _, out = self.plan(tmp, talk, self.CHARACTER)
            self.assertEqual(takes["take_capture"], "phone_selfie")
            self.assertIsNone(takes["capture_decision"]["reason"])


if __name__ == "__main__":
    unittest.main()

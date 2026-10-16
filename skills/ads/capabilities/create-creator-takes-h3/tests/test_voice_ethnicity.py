"""2.6.0: the voice fits the person's ethnicity too, and is paired with the person, never before.
On 15 Oct a 39-year-old Black American presenter got a generic American voice ("Jon"), because
pairing matched gender, age and accent only. The voices below are entries from that run's list
(GET /v1/voices through the GooseWorks MCP), trimmed. Free: no network, no paid call."""
import json
from pathlib import Path
import subprocess
import sys
import tempfile
import unittest

SCRIPTS = Path(__file__).resolve().parents[1] / "scripts"
sys.path.insert(0, str(SCRIPTS))
from pair_voice import heritage, load_voices, pair_voice  # noqa: E402

JON = {"voice_id": "jon", "name": "Jon - Conversational Voice", "category": "professional",
       "labels": {"gender": "male", "use_case": "conversational", "accent": "american", "age": "middle_aged", "descriptive": "casual"},
       "description": "A relaxed, approachable American voice, natural, clear, and easygoing."}
JULIUS = {"voice_id": "julius", "name": "Julius",
          "labels": {"gender": "male", "use_case": "social_media", "accent": "african american", "age": "young", "descriptive": "chill"},
          "description": "Julius is a conversational, authentic African American male voice with a relaxed, confident cadence."}
MILES = {"voice_id": "miles", "name": "Miles",
         "labels": {"gender": "male", "use_case": "conversational", "accent": "american", "age": "young", "descriptive": "calm"},
         "description": "Calm and friendly young African American male"}
NIGERIAN = {"voice_id": "tunde", "name": "Tunde",
            "labels": {"gender": "male", "accent": "nigerian", "age": "middle_aged", "descriptive": "warm"},
            "description": "A warm Nigerian narrator"}
INDIAN = {"voice_id": "arjun", "name": "Arjun",
          "labels": {"gender": "male", "accent": "en-indian", "age": "middle_aged", "descriptive": "warm"},
          "description": "A warm Indian voice"}
OLD = {"voice_id": "walter", "name": "Walter", "labels": {"gender": "male", "accent": "american", "age": "old"},
       "description": "A gravelly older African American storyteller"}
VOICES = [JON, JULIUS, MILES, NIGERIAN, INDIAN, OLD]


def run(script, *args):
    return subprocess.run([sys.executable, str(SCRIPTS / script), *args], capture_output=True, text=True)


PERSON = ["--age", "39", "--gender", "man", "--ethnicity", "Black American",
          "--hair", "short black hair, a close-trimmed beard", "--wardrobe", "plain navy t-shirt",
          "--scene", "a lived-in living room, a wooden shelf behind him, in focus", "--voice-accent", "american"]


class EthnicityMatchTests(unittest.TestCase):
    def test_a_black_american_man_gets_a_voice_described_as_african_american_never_jon(self):
        pair = pair_voice(39, "man", "american", None, VOICES, ethnicity="Black American")
        self.assertEqual(pair["source"], "library")
        self.assertIn(pair["voice_id"], ("julius", "miles"))
        self.assertNotEqual(pair["voice_id"], "jon")
        # Every African American male voice in the library is labelled young; 39 is within 10 years.
        self.assertIn("ethnicity", pair["matched_on"])
        self.assertIn("age_near", pair["matched_on"])
        self.assertIn("one band off", pair["note"])
        self.assertEqual(pair["wanted"]["ethnicity"], "Black American")
        self.assertEqual(pair["person"], {"age": 39, "gender": "man", "ethnicity": "Black American",
                                          "accent": "american", "energy": None})

    def test_the_heritage_can_be_in_the_accent_label_or_only_in_the_description(self):
        by_accent = pair_voice(39, "man", "american", None, [JON, JULIUS], ethnicity="African American")
        self.assertEqual(by_accent["voice_id"], "julius", "'african american' is an american accent")
        by_description = pair_voice(39, "man", "american", None, [JON, MILES], ethnicity="Black")
        self.assertEqual(by_description["voice_id"], "miles")

    def test_a_voice_described_as_another_heritage_never_fits(self):
        # A White man takes Jon, never a voice described as African American or Indian.
        self.assertEqual(pair_voice(39, "man", "american", None, VOICES, ethnicity="White")["voice_id"], "jon")
        white = pair_voice(39, "man", "american", None, [JULIUS, MILES, INDIAN], ethnicity="White")
        self.assertEqual(white["source"], "voice_design")
        # "african american" is read whole, so an African American voice is not African.
        self.assertEqual(pair_voice(40, "man", None, None, [JULIUS, MILES, NIGERIAN], ethnicity="Nigerian")["voice_id"], "tunde")
        self.assertEqual(pair_voice(40, "man", None, None, VOICES, ethnicity="Indian")["voice_id"], "arjun")

    def test_an_exact_age_band_beats_the_next_band_and_far_bands_never_fit(self):
        exact = {**MILES, "voice_id": "exact", "name": "Zed", "labels": {**MILES["labels"], "age": "middle_aged"}}
        self.assertEqual(pair_voice(39, "man", "american", None, [JULIUS, exact], ethnicity="Black American")["voice_id"], "exact")
        # 44 is 14 years from "young" and 11 from "old": neither is near enough.
        far = pair_voice(44, "man", "american", None, [JULIUS, MILES, OLD], ethnicity="Black American")
        self.assertEqual(far["source"], "voice_design")

    def test_no_fit_means_voice_design_in_the_persons_words_with_the_nearest_voices(self):
        pair = pair_voice(44, "man", "american", None, VOICES, ethnicity="Black American")
        description = pair["request"]["body"]["voice_description"]
        self.assertTrue(description.startswith("A 44-year-old Black American man with a natural American accent."))
        self.assertEqual(pair["save"]["body"]["voice_name"], "Man, 44, Black American, American")
        self.assertEqual([v["voice_id"] for v in pair["nearest"]][:2], ["julius", "miles"])
        self.assertNotIn("jon", [v["voice_id"] for v in pair["nearest"]])
        self.assertIn("GooseWorks MCP cannot run Voice Design", pair["note"])
        self.assertTrue(pair_voice(18, "woman", ethnicity="Korean")["request"]["body"]["voice_description"].startswith("An 18-year-old Korean woman"))

    def test_ethnicity_words_map_to_one_heritage(self):
        self.assertEqual(heritage("Black African American"), "black")
        self.assertEqual(heritage("Southeast Asian"), "southeast_asian")
        self.assertEqual(heritage("South Asian"), "south_asian")
        self.assertEqual(heritage("Latina"), "latino")
        self.assertIsNone(heritage("mixed"))
        # Unknown or mixed checks no heritage: any voice of the right gender and age fits.
        self.assertEqual(pair_voice(39, "man", "american", None, [JON], ethnicity="mixed")["voice_id"], "jon")


class ReviewFindingTests(unittest.TestCase):
    """Codex review of #306: each case is an input that went wrong in the first version."""

    def test_a_mixed_heritage_checks_no_heritage(self):
        self.assertIsNone(heritage("biracial Black/Latino"))
        self.assertIsNone(heritage("Black and Korean"))
        latino = {**MILES, "voice_id": "luis", "name": "Luis", "description": "Friendly young Latino male"}
        self.assertEqual(pair_voice(29, "man", None, None, [latino], ethnicity="biracial Black/Latino")["voice_id"], "luis")

    def test_a_voice_naming_two_heritages_fits_neither(self):
        both = {**JULIUS, "voice_id": "both", "description": "African American and Indian male voice"}
        self.assertEqual(pair_voice(39, "man", "american", None, [both], ethnicity="Black American")["source"], "voice_design")

    def test_broad_heritage_words_block_a_white_person(self):
        asian = {**JON, "voice_id": "asian", "name": "Ken", "description": "Warm Asian American male voice"}
        native = {**JON, "voice_id": "native", "name": "Sky", "description": "A calm Native American storyteller"}
        self.assertEqual(pair_voice(39, "man", "american", None, [asian, native], ethnicity="White")["source"], "voice_design")
        self.assertEqual(pair_voice(39, "man", "american", None, [asian], ethnicity="Korean")["voice_id"], "asian")
        self.assertEqual(pair_voice(39, "man", "american", None, [asian], ethnicity="Asian American")["voice_id"], "asian")
        self.assertEqual(heritage("Native American"), "indigenous")

    def test_ten_years_from_the_band_edge_is_near_on_both_sides(self):
        self.assertIn("age_near", pair_voice(40, "man", "american", None, [JULIUS], ethnicity="Black")["matched_on"])
        self.assertEqual(pair_voice(41, "man", "american", None, [JULIUS], ethnicity="Black")["source"], "voice_design")
        older = {**JON, "voice_id": "mid", "labels": {**JON["labels"], "age": "middle_aged"}}
        self.assertIn("age_near", pair_voice(65, "man", "american", None, [older], ethnicity="White")["matched_on"])
        self.assertIn("age_near", pair_voice(20, "man", "american", None, [older], ethnicity="White")["matched_on"])

    def test_odd_rows_are_skipped_not_fatal(self):
        odd = [None, "julius", {"voice_id": 7}, {**JULIUS, "voice_id": "n7", "name": 7},
               {**MILES, "voice_id": "nolabels", "labels": "male"}, JULIUS]
        pair = pair_voice(39, "man", "american", None, odd, ethnicity="Black American")
        self.assertIn(pair["voice_id"], ("julius", "n7"))

    def test_the_owner_can_choose_only_a_listed_nearest_voice(self):
        with tempfile.TemporaryDirectory() as tmp:
            voices = Path(tmp) / "voices.json"
            voices.write_text(json.dumps({"voices": VOICES}))
            out = Path(tmp) / "c"
            person = [a if a != "39" else "44" for a in PERSON]
            self.assertEqual(run("make_character.py", *person, "--voices", str(voices), "--out", str(out), "--dry-run").returncode, 0)
            character = out / "character.json"
            self.assertEqual(json.loads(character.read_text())["voice_pair"]["source"], "voice_design")
            r = run("pair_voice.py", "--character", str(character), "--choose", "jon")
            self.assertNotEqual(r.returncode, 0, "Jon is not a nearest voice for this person")
            r = run("pair_voice.py", "--character", str(character), "--choose", "julius")
            self.assertEqual(r.returncode, 0, r.stderr)
            pair = json.loads(character.read_text())["voice_pair"]
            self.assertEqual((pair["source"], pair["voice_id"]), ("library_nearest", "julius"))
            self.assertEqual(pair["person"]["age"], 44)
            self.assertIn("age young", pair["differs_on"])


class VoiceListShapeTests(unittest.TestCase):
    def test_every_saved_list_shape_loads(self):
        shapes = {
            "elevenlabs": {"voices": VOICES},
            "mcp_data_call_provider": {"status": "success", "provider": "elevenlabs", "path": "/v1/voices",
                                       "data": {"voices": VOICES, "total": 6}, "cost": {"credits": 0}},
            "video_formats": {"result": {"stage": "draft", "voices": [
                {"id": "julius", "name": "Julius", "gender": "male", "accent": "african american", "age": "young",
                 "description": "conversational African American", "use_case": "social_media"}], "next_cursor": None}},
        }
        with tempfile.TemporaryDirectory() as tmp:
            for name, data in shapes.items():
                path = Path(tmp) / (name + ".json")
                path.write_text(json.dumps(data))
                voices = load_voices(path)
                pair = pair_voice(39, "man", "american", None, voices, ethnicity="Black American")
                self.assertEqual((name, pair["source"]), (name, "library"))
                self.assertIn(pair["voice_id"], ("julius", "miles"))


class MakeCharacterVoiceTests(unittest.TestCase):
    def test_no_voice_list_refuses_before_anything_is_written(self):
        with tempfile.TemporaryDirectory() as tmp:
            out = Path(tmp) / "c"
            r = run("make_character.py", *PERSON, "--out", str(out), "--dry-run")
            self.assertNotEqual(r.returncode, 0)
            self.assertIn("needs a voice list", r.stderr)
            self.assertIn('data_call_provider', r.stderr)
            self.assertFalse(out.exists())
            r = run("make_character.py", *PERSON, "--no-voice-pair", "--voice-design", "--out", str(out), "--dry-run")
            self.assertNotEqual(r.returncode, 0)

    def test_make_character_pairs_by_ethnicity_and_records_the_person(self):
        with tempfile.TemporaryDirectory() as tmp:
            voices = Path(tmp) / "voices.json"
            voices.write_text(json.dumps({"data": {"voices": VOICES}}))
            out = Path(tmp) / "c"
            r = run("make_character.py", *PERSON, "--voices", str(voices), "--out", str(out), "--dry-run")
            self.assertEqual(r.returncode, 0, r.stderr)
            pair = json.loads((out / "character.json").read_text())["voice_pair"]
            self.assertIn(pair["voice_id"], ("julius", "miles"))
            self.assertIn("play it next to the still", r.stdout)
            designed = Path(tmp) / "d"
            r = run("make_character.py", *PERSON, "--voice-design", "--out", str(designed), "--dry-run")
            self.assertEqual(r.returncode, 0, r.stderr)
            body = json.loads((designed / "character.json").read_text())["voice_pair"]["request"]["body"]
            self.assertIn("39-year-old Black American man", body["voice_description"])
            silent = Path(tmp) / "s"
            r = run("make_character.py", *PERSON, "--no-voice-pair", "--out", str(silent), "--dry-run")
            self.assertEqual(r.returncode, 0, r.stderr)
            # creator-h3 takes voice_pair as an object or not at all: never null.
            self.assertNotIn("voice_pair", json.loads((silent / "character.json").read_text()))

    def test_changing_the_voice_pairs_again_with_the_rejected_one_excluded(self):
        with tempfile.TemporaryDirectory() as tmp:
            voices = Path(tmp) / "voices.json"
            voices.write_text(json.dumps({"voices": VOICES}))
            out = Path(tmp) / "c"
            self.assertEqual(run("make_character.py", *PERSON, "--voices", str(voices), "--out", str(out), "--dry-run").returncode, 0)
            character = out / "character.json"
            first = json.loads(character.read_text())["voice_pair"]["voice_id"]
            r = run("pair_voice.py", "--character", str(character), "--voices", str(voices), "--exclude", first)
            self.assertEqual(r.returncode, 0, r.stderr)
            second = json.loads(character.read_text())["voice_pair"]
            self.assertNotEqual(second["voice_id"], first)
            self.assertIn(second["voice_id"], ("julius", "miles"), "the next fitting voice, never Jon")
            self.assertEqual(second["rejected"], [first])
            # Rejecting the second too remembers both, and with none left it is Voice Design, not Jon.
            r = run("pair_voice.py", "--character", str(character), "--voices", str(voices), "--exclude", second["voice_id"])
            third = json.loads(character.read_text())["voice_pair"]
            self.assertEqual(third["source"], "voice_design")
            self.assertEqual(sorted(third["rejected"]), sorted([first, second["voice_id"]]))
            # Pairing again never works from a name: it needs the list.
            self.assertNotEqual(run("pair_voice.py", "--character", str(character)).returncode, 0)


if __name__ == "__main__":
    unittest.main()

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
from pair_voice import heritage, library_searches, load_voices, pair_voice  # noqa: E402

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
        # At 44, "old" (from 55) is 11 years off and "young" (to 29) 15: Walter first.
        self.assertEqual([v["voice_id"] for v in pair["nearest"]][:2], ["walter", "julius"])
        self.assertNotIn("jon", [v["voice_id"] for v in pair["nearest"]])
        self.assertIn("Search the shared voice library first", pair["note"])
        self.assertIn("Never change the person", pair["note"])
        self.assertEqual(pair["library_search"][0]["path"], "/v1/shared-voices")
        self.assertTrue(pair_voice(18, "woman", ethnicity="Korean")["request"]["body"]["voice_description"].startswith("An 18-year-old Korean woman"))

    def test_ethnicity_words_map_to_one_heritage(self):
        self.assertEqual(heritage("Black African American"), ("black", "black:american"))
        self.assertEqual(heritage("Southeast Asian"), ("southeast_asian", None))
        self.assertEqual(heritage("South Asian"), ("south_asian", None))
        self.assertEqual(heritage("Latina"), ("latino", None))
        self.assertEqual(heritage("Korean American"), ("east_asian", "korean"))
        self.assertEqual(heritage("White"), "white")
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
        self.assertEqual(heritage("Native American"), ("indigenous", "native_american"))

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

    def test_no_fit_without_voice_design_takes_the_first_nearest_voice_never_a_pick(self):
        with tempfile.TemporaryDirectory() as tmp:
            voices = Path(tmp) / "voices.json"
            voices.write_text(json.dumps({"voices": VOICES}))
            # The library was searched (2.8.0): every search this person needs, an empty last page each.
            library = []
            for request in library_searches("man", "Black American"):
                (Path(tmp) / request["save_as"]).write_text(json.dumps({"voices": [], "has_more": False}))
                library += ["--voices", str(Path(tmp) / request["save_as"])]
            out = Path(tmp) / "c"
            person = [a if a != "39" else "44" for a in PERSON]
            self.assertEqual(run("make_character.py", *person, "--voices", str(voices), *library,
                                 "--out", str(out), "--dry-run").returncode, 0)
            character = out / "character.json"
            first = json.loads(character.read_text())["voice_pair"]
            self.assertEqual(first["source"], "voice_design")
            self.assertNotEqual(run("pair_voice.py", "--character", str(character), "--choose", "jon").returncode, 0)
            r = run("pair_voice.py", "--character", str(character), "--accept-nearest")
            self.assertEqual(r.returncode, 0, r.stderr)
            pair = json.loads(character.read_text())["voice_pair"]
            self.assertEqual((pair["source"], pair["voice_id"]), ("library_nearest", first["nearest"][0]["voice_id"]))
            self.assertEqual(pair["person"]["age"], 44)
            self.assertTrue(pair["differs_on"])
            # Rejected: pair again with --exclude, and the next nearest comes first.
            r = run("pair_voice.py", "--character", str(character), "--voices", str(voices), "--exclude", pair["voice_id"])
            again = json.loads(character.read_text())["voice_pair"]
            self.assertEqual(again["rejected"], [pair["voice_id"]])
            self.assertNotIn(pair["voice_id"], [v["voice_id"] for v in again["nearest"]])
            # Accepting a library match is refused: it is already the pair.
            library = Path(tmp) / "l"
            run("make_character.py", *PERSON, "--voices", str(voices), "--out", str(library), "--dry-run")
            self.assertNotEqual(run("pair_voice.py", "--character", str(library / "character.json"), "--accept-nearest").returncode, 0)


class AcrossHeritageTests(unittest.TestCase):
    """Gate audit 16 Oct 2026: a person with no voice of their heritage got an empty `nearest`, and the agent
    changed the person to fit the list. Now the closest voices of the right gender come back, marked."""

    WOMEN = [{"voice_id": "ashley", "name": "Ashley", "labels": {"gender": "female", "accent": "american", "age": "middle_aged"},
              "description": "A warm African American woman"},
             {"voice_id": "lina", "name": "Lina", "labels": {"gender": "female", "accent": "latin american", "age": "young"},
              "description": "A bright Latina voice"}]

    def test_no_voice_of_her_heritage_gives_the_nearest_across_heritage_and_says_so(self):
        pair = pair_voice(32, "woman", "american", None, self.WOMEN + [JON], ethnicity="East Asian")
        self.assertEqual(pair["source"], "voice_design")
        self.assertEqual([v["voice_id"] for v in pair["nearest"]], ["ashley", "lina"])  # women only; closest age first
        self.assertTrue(all(v["differs_on"][0] == "heritage" for v in pair["nearest"]))
        self.assertIn("No voice in the lists matches this person's heritage", pair["nearest_note"])
        self.assertIn("Never change the person", pair["nearest_note"])
        self.assertEqual(pair["person"]["ethnicity"], "East Asian")  # the person never bends

    def test_a_voice_of_her_heritage_still_wins_over_the_fallback(self):
        korean = {"voice_id": "jiwoo", "name": "Jiwoo", "labels": {"gender": "female", "accent": "korean", "age": "old"},
                  "description": "A Korean grandmother's voice"}
        pair = pair_voice(32, "woman", "american", None, self.WOMEN + [korean], ethnicity="Korean")
        self.assertEqual([v["voice_id"] for v in pair["nearest"]], ["jiwoo"])
        self.assertNotIn("heritage", pair["nearest"][0]["differs_on"])
        self.assertNotIn("nearest_note", pair)

    def test_accept_nearest_across_heritage_tells_the_owner(self):
        with tempfile.TemporaryDirectory() as tmp:
            character = Path(tmp) / "character.json"
            searched = {"searched": True, "missing": [], "more": []}  # the library was searched to its last page
            pair = pair_voice(32, "woman", "american", None, self.WOMEN, ethnicity="East Asian", library=searched)
            character.write_text(json.dumps({"voice_pair": pair}))
            r = run("pair_voice.py", "--character", str(character), "--accept-nearest")
            self.assertEqual(r.returncode, 0, r.stderr)
            chosen = json.loads(character.read_text())["voice_pair"]
            self.assertEqual((chosen["source"], chosen["voice_id"]), ("library_nearest", "ashley"))
            self.assertIn("heritage", chosen["differs_on"])
            self.assertIn("No voice in the library matches this person's heritage", chosen["tell_owner"])


class SecondReviewTests(unittest.TestCase):
    """Codex review round 2 of #306."""

    def test_a_specific_heritage_never_takes_a_sibling(self):
        japanese = {**JON, "voice_id": "jp", "name": "Haru", "description": "Calm Japanese male voice"}
        korean = {**JON, "voice_id": "kr", "name": "Min", "description": "Calm Korean male voice"}
        east = {**JON, "voice_id": "ea", "name": "Lee", "description": "Friendly East Asian male voice"}
        self.assertEqual(pair_voice(40, "man", "american", None, [japanese, korean], ethnicity="Korean")["voice_id"], "kr")
        self.assertEqual(pair_voice(40, "man", "american", None, [japanese, east], ethnicity="Korean")["voice_id"], "ea")
        self.assertEqual(pair_voice(40, "man", "american", None, [japanese], ethnicity="Korean")["source"], "voice_design")
        # A general person takes any of their heritage's specific voices.
        self.assertEqual(pair_voice(40, "man", "american", None, [japanese], ethnicity="East Asian")["voice_id"], "jp")
        indian = {**INDIAN, "voice_id": "in"}
        pakistani = {**INDIAN, "voice_id": "pk", "name": "Ali", "description": "A warm Pakistani voice", "labels": {**INDIAN["labels"], "accent": "pakistani"}}
        self.assertEqual(pair_voice(40, "man", None, None, [indian, pakistani], ethnicity="Pakistani")["voice_id"], "pk")
        mexican = {**JON, "voice_id": "mx", "name": "Diego", "description": "Warm Mexican male voice"}
        colombian = {**JON, "voice_id": "co", "name": "Andres", "description": "Warm Colombian male voice"}
        self.assertEqual(pair_voice(40, "man", "american", None, [mexican, colombian], ethnicity="Colombian")["voice_id"], "co")

    def test_every_voice_word_is_a_person_word_too(self):
        # Each has a wrong-heritage voice that would win by name if the ethnicity went unrecognized.
        for ethnicity, right_words in [("Nigerian", "A warm Nigerian narrator"), ("Ghanaian", "A warm Ghanaian narrator"),
                                       ("Kenyan", "A warm Kenyan narrator"), ("Puerto Rican", "A warm Puerto Rican narrator"),
                                       ("Colombian", "A warm Colombian narrator"), ("Aboriginal", "A warm Aboriginal narrator"),
                                       ("Cantonese", "A warm Cantonese narrator")]:
            self.assertIsNotNone(heritage(ethnicity), ethnicity)
            right = {**NIGERIAN, "voice_id": "zz-right", "name": "Zed", "description": right_words,
                     "labels": {**NIGERIAN["labels"], "accent": "standard"}}
            wrong = {**INDIAN, "voice_id": "aa-wrong", "name": "Aaron"}
            self.assertEqual(pair_voice(40, "man", None, None, [wrong, right], ethnicity=ethnicity)["voice_id"], "zz-right", ethnicity)

    def test_accent_aliases_go_one_way(self):
        self.assertEqual(pair_voice(39, "man", "american", None, [JULIUS], ethnicity="Black")["voice_id"], "julius")
        self.assertEqual(pair_voice(39, "man", "african", None, [JULIUS], ethnicity="Black")["source"], "voice_design")
        english = {**JON, "voice_id": "en", "labels": {**JON["labels"], "accent": "american english"}}
        self.assertEqual(pair_voice(40, "man", "english", None, [english], ethnicity="White")["source"], "voice_design")

    def test_compound_indian_words_are_not_south_asian(self):
        """Round 3."""
        american_indian = {**JON, "voice_id": "ai", "name": "Sky", "description": "Calm American Indian male voice"}
        self.assertEqual(pair_voice(40, "man", "american", None, [american_indian], ethnicity="Native American")["voice_id"], "ai")
        self.assertEqual(pair_voice(40, "man", "american", None, [american_indian], ethnicity="Indian")["source"], "voice_design")
        west_indian = {**JON, "voice_id": "wi", "name": "Dev", "description": "Warm West Indian male voice"}
        self.assertEqual(pair_voice(40, "man", "american", None, [west_indian], ethnicity="Indian")["source"], "voice_design")
        self.assertEqual(heritage("Jamaican"), ("caribbean", "jamaican"))

    def test_two_specifics_in_one_region_are_mixed(self):
        for ethnicity in ("Korean/Japanese", "Indian-Pakistani", "Mexican and Colombian"):
            self.assertIsNone(heritage(ethnicity), ethnicity)
        latino = {**JON, "voice_id": "lat", "name": "Luis", "description": "Friendly Latino male"}
        self.assertEqual(pair_voice(40, "man", "american", None, [latino], ethnicity="Korean/Japanese")["voice_id"], "lat")

    def test_nearest_is_ordered_by_years_and_accept_takes_the_closest(self):
        aaron = {**JULIUS, "voice_id": "aaron", "name": "Aaron", "labels": {**JULIUS["labels"], "age": "young", "accent": "british"}}
        zed = {**JULIUS, "voice_id": "zed", "name": "Zed", "labels": {**JULIUS["labels"], "age": "old", "accent": "british"}}
        pair = pair_voice(44, "man", "american", None, [aaron, zed], ethnicity="Black",
                          library={"searched": True, "more": []})
        self.assertEqual([v["voice_id"] for v in pair["nearest"]], ["zed", "aaron"], "old is 11 years off, young 15")
        self.assertIn("--voices <list> --exclude <voice_id>", pair["note"])
        with tempfile.TemporaryDirectory() as tmp:
            character = Path(tmp) / "character.json"
            character.write_text(json.dumps({"image": "c.png", "identity": "x", "voice_pair": pair}))
            r = run("pair_voice.py", "--character", str(character), "--accept-nearest")
            self.assertEqual(r.returncode, 0, r.stderr)
            accepted = json.loads(character.read_text())["voice_pair"]
            self.assertEqual(accepted["voice_id"], "zed")
            self.assertIn("--voices <list> --exclude zed", accepted["note"])

    def test_siblings_under_one_parent_never_match(self):
        """Round 4."""
        voice = lambda vid, words: {**JON, "voice_id": vid, "name": vid, "description": words}
        samoan, maori = voice("samoan", "Warm Samoan male voice"), voice("maori", "Warm Maori male voice")
        self.assertEqual(pair_voice(40, "man", "american", None, [samoan, maori], ethnicity="Maori")["voice_id"], "maori")
        self.assertEqual(pair_voice(40, "man", "american", None, [samoan], ethnicity="Maori")["source"], "voice_design")
        self.assertEqual(pair_voice(40, "man", "american", None, [samoan], ethnicity="Pacific Islander")["voice_id"], "samoan")
        egyptian, arabic = voice("egyptian", "Warm Egyptian male voice"), voice("arabic", "Warm Arabic male voice")
        self.assertEqual(pair_voice(40, "man", "american", None, [egyptian], ethnicity="Lebanese")["source"], "voice_design")
        self.assertEqual(pair_voice(40, "man", "american", None, [arabic], ethnicity="Lebanese")["voice_id"], "arabic")
        self.assertEqual(pair_voice(40, "man", "american", None, [arabic], ethnicity="Persian")["source"], "voice_design")
        self.assertEqual(heritage("Lebanese Arab"), ("middle_eastern", "arab:lebanese"))
        mandarin = voice("mandarin", "Warm Mandarin male voice")
        self.assertEqual(pair_voice(40, "man", "american", None, [mandarin], ethnicity="Cantonese")["source"], "voice_design")
        self.assertEqual(pair_voice(40, "man", "american", None, [mandarin], ethnicity="Chinese")["voice_id"], "mandarin")
        chinese = voice("chinese", "Warm Chinese male voice")
        self.assertEqual(pair_voice(40, "man", "american", None, [chinese], ethnicity="Cantonese")["voice_id"], "chinese")

    def test_native_speaker_of_a_language_is_not_a_heritage(self):
        speaker = {**JON, "voice_id": "spk", "description": "A native American English speaker with a conversational tone"}
        self.assertEqual(pair_voice(40, "man", "american", None, [speaker], ethnicity="White")["voice_id"], "spk")
        self.assertEqual(pair_voice(40, "man", "american", None, [speaker], ethnicity="Native American")["source"], "voice_design")
        story = {**JON, "voice_id": "story", "description": "A calm Native American storyteller"}
        self.assertEqual(pair_voice(40, "man", "american", None, [story], ethnicity="Native American")["voice_id"], "story")

    def test_black_with_an_african_or_caribbean_heritage_is_that_heritage(self):
        """Round 5."""
        self.assertEqual(heritage("Black Nigerian"), ("african", "nigerian"))
        nigerian = {**NIGERIAN, "voice_id": "zz-ng", "name": "Zed", "labels": {**NIGERIAN["labels"], "accent": "standard"},
                    "description": "A warm Black Nigerian narrator"}
        wrong = {**INDIAN, "voice_id": "aa-in", "name": "Aaron"}
        self.assertEqual(pair_voice(40, "man", None, None, [wrong, nigerian], ethnicity="Black Nigerian")["voice_id"], "zz-ng")
        self.assertEqual(pair_voice(40, "man", None, None, [nigerian], ethnicity="Nigerian")["voice_id"], "zz-ng")
        only_black = {**NIGERIAN, "voice_id": "blk", "labels": {**NIGERIAN["labels"], "accent": "standard"}, "description": "Deep Black male voice"}
        self.assertEqual(pair_voice(40, "man", None, None, [only_black], ethnicity="Nigerian")["source"], "voice_design")
        self.assertEqual(pair_voice(40, "man", None, None, [nigerian], ethnicity="Black American")["source"], "voice_design")
        # Round 6: "African American" is its own heritage, not the broad "Black".
        both = {**nigerian, "voice_id": "both", "description": "African American and Nigerian male voice"}
        self.assertEqual(pair_voice(40, "man", None, None, [both], ethnicity="Nigerian")["source"], "voice_design")
        self.assertEqual(heritage("African American"), ("black", "black:american"))
        # Round 7.
        black_american = {**nigerian, "voice_id": "ba", "description": "Black American and Nigerian male voice"}
        self.assertEqual(pair_voice(40, "man", None, None, [black_american], ethnicity="Nigerian")["source"], "voice_design")
        for ethnicity, words in [("South Asian", "Indian and Pakistani male voice"), ("East Asian", "Korean and Japanese male voice"),
                                 ("African", "Nigerian and Kenyan male voice")]:
            two = {**nigerian, "voice_id": "two", "description": words}
            self.assertEqual(pair_voice(40, "man", None, None, [two], ethnicity=ethnicity)["source"], "voice_design", ethnicity)
        parent_child = {**nigerian, "voice_id": "pc", "description": "Chinese male voice, Mandarin"}
        self.assertEqual(pair_voice(40, "man", None, None, [parent_child], ethnicity="Chinese")["voice_id"], "pc")
        self.assertEqual(pair_voice(39, "man", "american", None, [JULIUS, MILES], ethnicity="Black American")["source"], "library")

    def test_hyphenated_mixed_words_check_no_heritage(self):
        for ethnicity in ("multi-racial Black", "bi-racial Black", "multi-ethnic Korean"):
            self.assertIsNone(heritage(ethnicity), ethnicity)
        self.assertEqual(pair_voice(40, "man", "american", None, [JON], ethnicity="bi-racial Black")["voice_id"], "jon")

    def test_round_8_white_words_afro_latino_accent_and_genre(self):
        white_sa = {**NIGERIAN, "voice_id": "wsa", "labels": {**NIGERIAN["labels"], "accent": "standard"},
                    "description": "Warm White South African male voice"}
        self.assertEqual(pair_voice(40, "man", None, None, [white_sa], ethnicity="Black South African")["source"], "voice_design")
        white = {**JON, "voice_id": "white", "description": "Warm White American male voice"}
        self.assertEqual(pair_voice(40, "man", "american", None, [white], ethnicity="White")["voice_id"], "white")
        self.assertEqual(pair_voice(40, "man", "american", None, [white], ethnicity="Black American")["source"], "voice_design")
        for ethnicity in ("Afro-Latino", "Afro Latina", "afrolatinx"):
            self.assertIsNone(heritage(ethnicity), ethnicity)
        black_accent = {**JULIUS, "voice_id": "ba", "labels": {**JULIUS["labels"], "accent": "Black American"},
                        "description": "Warm Black American male voice"}
        self.assertEqual(pair_voice(39, "man", "american", None, [black_accent], ethnicity="Black American")["voice_id"], "ba")
        metal = {**JON, "voice_id": "metal", "description": "Deep black metal vocalist, American male"}
        self.assertEqual(pair_voice(40, "man", "american", None, [metal], ethnicity="White")["voice_id"], "metal")
        self.assertEqual(pair_voice(40, "man", "american", None, [metal], ethnicity="Black American")["source"], "voice_design")

    def test_a_native_american_voice_actor_is_native_american(self):
        actor = {**JON, "voice_id": "actor", "description": "Warm Native American voice actor"}
        self.assertEqual(pair_voice(40, "man", "american", None, [actor], ethnicity="Native American")["voice_id"], "actor")
        self.assertEqual(pair_voice(40, "man", "american", None, [actor], ethnicity="White")["source"], "voice_design")
        for words in ("Warm Native American voiceover artist", "Warm native American voice-over artist"):
            vo = {**JON, "voice_id": "vo", "description": words}
            self.assertEqual(pair_voice(40, "man", "american", None, [vo], ethnicity="Native American")["voice_id"], "vo", words)
            self.assertEqual(pair_voice(40, "man", "american", None, [vo], ethnicity="White")["source"], "voice_design", words)
        generic = {**JON, "voice_id": "generic", "description": "A warm native American voice"}
        self.assertEqual(pair_voice(40, "man", "american", None, [generic], ethnicity="White")["voice_id"], "generic")
        self.assertEqual(pair_voice(40, "man", "american", None, [generic], ethnicity="Native American")["source"], "voice_design")

    def test_nearest_age_distance_matches_the_near_rule(self):
        """Round 9: 42 is 12 years from "young" (ends at 30) and 13 from "old" (starts at 55)."""
        zed = {**JULIUS, "voice_id": "zed", "name": "Zed", "labels": {**JULIUS["labels"], "age": "young"}}
        aaron = {**JULIUS, "voice_id": "aaron", "name": "Aaron", "labels": {**JULIUS["labels"], "age": "old"}}
        pair = pair_voice(42, "man", "american", None, [zed, aaron], ethnicity="Black American")
        self.assertEqual([v["voice_id"] for v in pair["nearest"]], ["zed", "aaron"])

    def test_nearest_ranks_by_age_gap_before_other_differences(self):
        young_us = {**JULIUS, "voice_id": "young-us", "name": "Aaron"}
        old_uk = {**JULIUS, "voice_id": "old-uk", "name": "Zed", "labels": {**JULIUS["labels"], "age": "old", "accent": "british"}}
        british = {**JULIUS, "voice_id": "young-uk", "name": "Bea", "labels": {**JULIUS["labels"], "accent": "british"}}
        pair = pair_voice(44, "man", "american", None, [young_us, old_uk, british], ethnicity="Black")
        self.assertEqual([v["voice_id"] for v in pair["nearest"]], ["old-uk", "young-us", "young-uk"])

    def test_make_character_survives_an_odd_name_on_the_no_fit_path(self):
        with tempfile.TemporaryDirectory() as tmp:
            odd = {**JULIUS, "voice_id": "odd", "name": 7, "labels": {**JULIUS["labels"], "accent": "british"}}
            voices = Path(tmp) / "voices.json"
            voices.write_text(json.dumps({"voices": [odd]}))
            r = run("make_character.py", *PERSON, "--voices", str(voices), "--out", str(Path(tmp) / "c"), "--dry-run")
            self.assertEqual(r.returncode, 0, r.stderr)
            self.assertIn("NO VOICE IN THE LISTS FITS", r.stdout)


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

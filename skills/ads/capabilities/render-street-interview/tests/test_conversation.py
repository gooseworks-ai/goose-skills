import copy
import json
from pathlib import Path
import subprocess
import sys
import tempfile
import unittest

SCRIPTS = Path(__file__).resolve().parents[1] / "scripts"
sys.path.insert(0, str(SCRIPTS))
import brandkit
import conversation
import format_spec
from prepare_script_context import select_context


def cfg():
    return {"mode":"conversation", "brand":"Service test", "slug":"service-test",
            "participant":"an adult business owner", "location":{"description":"a plaza outside offices", "landmarks":"trees and brick walls"},
            "question":"What kept you late?", "generation":{"seed":52,"duration":12},
            "shots":[{"kind":"question","speaker":"interviewer","line":"What kept you late?"},
                     {"kind":"answer","speaker":"participant","line":"The same report again."},
                     {"kind":"followup","speaker":"interviewer","line":"Again?"},
                     {"kind":"answer","speaker":"participant","line":"Every Friday."}]}


def ref(id="a", origin="seed"):
    return {"id":id,"origin":origin,"format":"street-interview","execution_modes":["conversation"],
            "language":"en","observed":True,"observed_scope":"video","source":"https://example.org/source",
            "commercial":True,"commercial_evidence":"Named sponsor offers relevant service help.",
            "transfer_rule":"follow the specific task with relevant help","limitations":"authorship and vocal delivery unverified",
            "allowed_offering_types":["service","digital"],"interaction_types":["mic-only"],
            "inspection":{"coverage":"complete-clip","modalities":["visual","transcript"],
                          "duration_s":12,"method":"Full timeline frames and complete transcript inspected."},
            "ad_interaction":{"edited_opening":"Question opens the published edit.",
                              "visible_setup":"Interviewer and founder outside a shop.",
                              "participant_reason":"The founder answers about their launch.",
                              "viewer_hook":"What has stopped the launch?",
                              "product_connection":"Named service helps with the supplied task.",
                              "payoff":"Specific offered help and founder reply.",
                              "unseen_setup":"Original approach and consent are not shown."},
            "speaker_turns":[{"speaker":"a","does":"asks","start":0,"end":2,"text":"What is left?"},
                             {"speaker":"b","does":"answers","start":2,"end":5,"text":"The product photos."},
                             {"speaker":"a","does":"offers relevant help","start":5,"end":12,"text":"This service can help with those."}]}


def brief():
    return {"mode":"conversation","brand_id":"service","offering_type":"service",
            "interaction_type":"mic-only","language":"en"}


def interaction_cfg(kind):
    c = cfg()
    c["interaction"] = {
        "type": kind,
        "visible_setup": "A prepared drink sits within reach." if kind == "product-sample" else
                         "Three blank cards sit on a small table.",
        "participant_reason": "The passerby volunteers for the offered comparison.",
        "props": "One plain cup with a prepared drink." if kind == "product-sample" else
                 "Three blank cards with no printed text.",
    }
    c["shots"].insert(0, {
        "kind": "action", "speaker": "participant", "line": "",
        "visual": "The participant and the table share the frame.",
        "action": "The participant takes a small sip." if kind == "product-sample" else
                  "The participant points to the middle card.",
    })
    return c


class StreetPreviewTests(unittest.TestCase):
    def test_service_needs_no_object_reference(self):
        c=cfg();brandkit.validate(c)
        self.assertIsNone(brandkit.reference_image(c))
        p=format_spec.build_prompt(c)
        self.assertEqual(format_spec.lint(p,mode="conversation"), [])
        self.assertNotIn("@Image",p)
        self.assertEqual(len(format_spec.split_shots(p)),4)
        self.assertEqual(brandkit.expected_lines(c).count(c["question"]),1)
        self.assertEqual(conversation.interaction_type(c), "mic-only")
        self.assertIn("No product, phone or screen is held or demonstrated", p)
        self.assertIn("The street behind them stays in focus and readable as a real place, never blurred "
                      "and never bokeh.", p)
        self.assertTrue(format_spec.lint(p.replace("never blurred and never bokeh", ""), mode="conversation"))

    def test_sample_and_challenge_preserve_setup_and_silent_action(self):
        for kind in ("product-sample", "concept-challenge"):
            with self.subTest(kind=kind):
                c = interaction_cfg(kind)
                brandkit.validate(c)
                p = format_spec.build_prompt(c)
                self.assertEqual(format_spec.lint(p, mode="conversation"), [])
                self.assertIsNone(brandkit.reference_image(c))
                self.assertIn(c["interaction"]["visible_setup"], p)
                self.assertIn(c["interaction"]["participant_reason"], p)
                self.assertIn(c["interaction"]["props"], p)
                shots = format_spec.split_shots(p)
                self.assertEqual(len(shots), 5)
                self.assertIn(c["shots"][0]["action"], shots[0])
                self.assertIn(c["shots"][0]["visual"], shots[0])
                self.assertIn("both voices are silent", shots[0])
                self.assertIn("Edited cold open", p)
                self.assertEqual(p.count(repr(c["question"])), 1)
                self.assertEqual(brandkit.expected_lines(c).count(c["question"]), 1)
                self.assertNotIn("@Image", p)
        self.assertIn("Samples are already prepared", format_spec.build_prompt(interaction_cfg("product-sample")))

    def test_participant_answer_and_silent_reaction_can_open_the_edit(self):
        c = cfg()
        c["shots"].insert(0, c["shots"].pop(1))
        brandkit.validate(c)
        self.assertIn(repr(c["shots"][0]["line"]), format_spec.split_shots(format_spec.build_prompt(c))[0])
        for speaker in ("participant", "interviewer"):
            c = cfg()
            c["shots"].insert(0, {"kind": "reaction", "speaker": speaker, "line": "",
                                   "visual": "A quick surprised glance."})
            brandkit.validate(c)
            self.assertIn("both voices are silent", format_spec.split_shots(format_spec.build_prompt(c))[0])

    def test_interaction_requires_type_setup_and_participant_reason(self):
        malformed = [None, "sample", {}, {"type": "unknown"}]
        for field in ("visible_setup", "participant_reason", "props"):
            for value in ("", "  ", 3):
                item = copy.deepcopy(interaction_cfg("concept-challenge")["interaction"])
                item[field] = value
                malformed.append(item)
        for field in ("visible_setup", "participant_reason"):
            item = copy.deepcopy(interaction_cfg("concept-challenge")["interaction"])
            del item[field]
            malformed.append(item)
        for item in malformed:
            with self.subTest(interaction=item):
                c = cfg(); c["interaction"] = item
                with self.assertRaises(SystemExit): brandkit.validate(c)

    def test_mic_only_cannot_request_sample_handling(self):
        for field in ("action", "visual", "manner"):
            c = cfg(); c["shots"][1][field] = "The participant holds a cup and takes a sip."
            with self.subTest(field=field), self.assertRaises(SystemExit): brandkit.validate(c)
        c = interaction_cfg("product-sample"); c["interaction"]["type"] = "mic-only"
        with self.assertRaises(SystemExit): brandkit.validate(c)

    def test_verbal_product_explanation_is_not_a_visible_product(self):
        c = cfg()
        c['shots'][2]['action'] = 'The interviewer explains the product while holding the microphone.'
        brandkit.validate(c)
        c['shots'][2]['action'] = 'The interviewer holds a product beside the microphone.'
        with self.assertRaises(SystemExit): brandkit.validate(c)

    def test_every_interaction_rejects_visible_devices_or_ui(self):
        for kind in ("mic-only", "product-sample", "concept-challenge"):
            for description in ("The participant holds a phone.", "A laptop screen shows the task.",
                                "The interviewer demonstrates the UI."):
                c = cfg() if kind == "mic-only" else interaction_cfg(kind)
                c["shots"][1]["visual"] = description
                with self.subTest(kind=kind, visual=description), self.assertRaises(SystemExit):
                    brandkit.validate(c)
        c = interaction_cfg("concept-challenge")
        c["interaction"]["visible_setup"] = "Three blank cards, no phone or screen."
        brandkit.validate(c)

    def test_action_needs_text_and_is_silent(self):
        for change in ({"line": "Try it."}, {"action": "", "visual": ""}, {"action": 3},
                       {"visual": None}, {"speaker": "bystander"}):
            c = interaction_cfg("concept-challenge"); c["shots"][0].update(change)
            with self.subTest(change=change), self.assertRaises(SystemExit): brandkit.validate(c)
        c = interaction_cfg("concept-challenge"); c["shots"][0]["speaker"] = "interviewer"
        brandkit.validate(c)
        c["shots"][0]["line"] = "  "
        self.assertIn("both voices are silent", format_spec.split_shots(format_spec.build_prompt(c))[0])

    def test_product_branch_still_requires_object(self):
        c=cfg();c['mode']='product-guess'
        with self.assertRaises(SystemExit):brandkit.validate(c)

    def test_unknown_mode_is_rejected(self):
        c=cfg();c['mode']='something-new'
        with self.assertRaises(SystemExit):brandkit.validate(c)
        self.assertTrue(format_spec.lint('x',mode='something-new'))

    def test_incompatible_product_flags_rejected(self):
        c=cfg();c['generation']['can_grammar']=True
        with self.assertRaises(SystemExit):brandkit.validate(c)
        with self.assertRaises(ValueError):format_spec.build_prompt(cfg(),can=True)

    def test_question_and_speakers_must_match(self):
        c=cfg();c['shots'][0]['line']='Different question'
        with self.assertRaises(SystemExit):brandkit.validate(c)
        c=cfg();c['shots'][2]['speaker']='participant'
        with self.assertRaises(SystemExit):brandkit.validate(c)

    def test_cold_open_keeps_the_first_question_exact_and_performed_once(self):
        c = interaction_cfg("concept-challenge"); c["shots"][1]["line"] = "A different question?"
        with self.assertRaises(SystemExit): brandkit.validate(c)
        c = interaction_cfg("concept-challenge"); c["shots"][1]["speaker"] = "participant"
        with self.assertRaises(SystemExit): brandkit.validate(c)
        c = cfg(); c["shots"][0]["kind"] = "followup"
        with self.assertRaises(SystemExit): brandkit.validate(c)
        c = cfg(); c["shots"].insert(0, {"kind": "followup", "speaker": "interviewer", "line": "Again?"})
        with self.assertRaises(SystemExit): brandkit.validate(c)
        for index in (1, 2):
            c = interaction_cfg("concept-challenge"); c["shots"][index + 1]["line"] = c["question"]
            with self.subTest(duplicate_at=index), self.assertRaises(SystemExit): brandkit.validate(c)
        for duplicate in (" WHAT  KEPT YOU LATE? ", "What kept you late? Again?"):
            c = cfg(); c["shots"][2]["line"] = duplicate
            with self.subTest(duplicate=duplicate), self.assertRaises(SystemExit): brandkit.validate(c)

    def test_silent_speaker_does_not_satisfy_two_spoken_voices(self):
        c = cfg()
        c["shots"] = [c["shots"][0], {"kind": "action", "speaker": "participant", "line": "",
                                    "action": "The participant nods."}, c["shots"][2]]
        with self.assertRaisesRegex(SystemExit, "both people must speak"): brandkit.validate(c)
        c["shots"][1]["line"] = "  "
        with self.assertRaisesRegex(SystemExit, "both people must speak"): brandkit.validate(c)

    def test_cold_open_still_obeys_duration_shot_count_and_word_budget(self):
        for duration in (5, 16, "12"):
            c = interaction_cfg("product-sample"); c["generation"]["duration"] = duration
            with self.subTest(duration=duration), self.assertRaises(SystemExit): brandkit.validate(c)
        for count in (2, 9):
            c = interaction_cfg("concept-challenge")
            c["shots"] = (c["shots"] * 2)[:count]
            with self.subTest(count=count), self.assertRaises(SystemExit): brandkit.validate(c)
        c = interaction_cfg("concept-challenge"); c["generation"]["duration"] = 15
        c["shots"][2]["line"] = "word " * 40
        with self.assertRaisesRegex(SystemExit, "words/second"): brandkit.validate(c)
        c = interaction_cfg("concept-challenge"); c["generation"]["duration"] = 12
        other_words = sum(len(s.get("line", "").split()) for i, s in enumerate(c["shots"]) if i != 2)
        c["shots"][2]["line"] = "word " * (30 - other_words)
        brandkit.validate(c)
        c["shots"][2]["line"] += "word"
        with self.assertRaisesRegex(SystemExit, "words/second"): brandkit.validate(c)

    def test_long_script_fails_before_spend(self):
        c=cfg();c['shots'][1]['line']='word '*40
        with self.assertRaises(SystemExit):brandkit.validate(c)

    def test_location_light_is_dynamic(self):
        c=cfg();c['location']['light']='late afternoon sunlight'
        self.assertIn('late afternoon sunlight',format_spec.build_prompt(c))

    def test_complete_conversation_prompt_uses_shared_length_advice(self):
        c = cfg()
        c['location']['landmarks'] = ' '.join(['brickwork'] * 1001)
        p = format_spec.build_prompt(c)
        self.assertEqual(format_spec.lint(p, mode='conversation'), [])
        self.assertTrue(format_spec.prompt_warnings(p))
        self.assertTrue(format_spec.lint(p.replace('same microphone', 'same object'),
                                        mode='conversation'))

    def test_invalid_shot_types_and_spoken_reactions_are_rejected(self):
        for malformed in ('not a shot', {'kind':'reaction','speaker':'participant','line':'Yes'},
                          {'kind':'reaction','speaker':'participant','line':32}):
            c=cfg();c['shots'].append(malformed)
            with self.assertRaises(SystemExit):brandkit.validate(c)

    def test_prompt_guards_are_load_bearing(self):
        p=format_spec.build_prompt(cfg())
        self.assertTrue(format_spec.lint(p.replace('same microphone','same object'),mode='conversation'))
        self.assertTrue(format_spec.lint(p+' @Image1',mode='conversation'))
        for kind in ("mic-only", "product-sample", "concept-challenge"):
            c = cfg() if kind == "mic-only" else interaction_cfg(kind)
            p = format_spec.build_prompt(c)
            for clause in conversation.INTERACTION_CLAUSES[kind]:
                with self.subTest(kind=kind, clause=clause):
                    self.assertTrue(format_spec.lint(p.lower().replace(clause, ""), mode="conversation"))
            self.assertTrue(format_spec.lint(p + " @Image1", mode="conversation"))

    def test_dry_run_and_paid_stop_are_real(self):
        with tempfile.TemporaryDirectory() as td:
            path=Path(td)/'config.json';path.write_text(json.dumps(cfg()))
            args=[sys.executable,str(SCRIPTS/'single_gen.py'),'--brand',str(path),'--run',td]
            dry=subprocess.run(args,capture_output=True,text=True)
            self.assertEqual(dry.returncode,0,dry.stderr)
            self.assertIn('no product reference',dry.stdout)
            paid=subprocess.run(args+['--yes'],capture_output=True,text=True)
            self.assertNotEqual(paid.returncode,0)
            self.assertIn('no paid call sent',paid.stderr)
            self.assertFalse(list(Path(td).rglob('*.mp4')))

    def test_action_variants_dry_run_and_refuse_paid_calls_and_scene_binding(self):
        for kind in ("product-sample", "concept-challenge"):
            with self.subTest(kind=kind), tempfile.TemporaryDirectory() as td:
                c = interaction_cfg(kind)
                path = Path(td) / "config.json"; path.write_text(json.dumps(c))
                args = [sys.executable, str(SCRIPTS / "single_gen.py"), "--brand", str(path), "--run", td]
                dry = subprocess.run(args, capture_output=True, text=True)
                self.assertEqual(dry.returncode, 0, dry.stderr)
                self.assertIn(f"{kind} conversation: text setup/action preview", dry.stdout)
                self.assertIn(c["shots"][0]["action"], dry.stdout)
                paid = subprocess.run(args + ["--yes"], capture_output=True, text=True)
                self.assertNotEqual(paid.returncode, 0)
                self.assertIn("no paid call sent", paid.stderr)
                bound = subprocess.run(args + ["--scene-ref", "unbound.png"], capture_output=True, text=True)
                self.assertNotEqual(bound.returncode, 0)
                self.assertIn("no scene-reference binding", bound.stderr)
                self.assertFalse(list(Path(td).rglob("*.mp4")))

    def test_user_source_selected_first_and_wrong_formats_excluded(self):
        wrong=ref('wrong');wrong['format']='podcast'
        result=select_context(brief(),[ref(),ref('user','user'),wrong])
        self.assertEqual(result['references'][0]['id'],'user')
        self.assertEqual(result['excluded'][0]['id'],'wrong')

    def test_missing_or_unobserved_references_return_research_gap(self):
        r=ref();r['observed']=False
        result=select_context(brief(),[r])
        self.assertEqual(result['status'],'needs-reference')
        self.assertTrue(result['research_queries'])

    def test_transcript_only_or_partial_source_leaves_reference_gap(self):
        r=ref();r['inspection']['modalities']=['transcript']
        result=select_context(brief(),[r])
        self.assertEqual(result['status'],'needs-reference')
        self.assertTrue(result['research_queries'])
        r=ref();r['inspection']['coverage']='partial'
        self.assertEqual(select_context(brief(),[r])['status'],'needs-reference')

    def test_service_does_not_select_product_guess_only(self):
        r=ref();r['execution_modes']=['product-guess']
        self.assertEqual(select_context(brief(),[r])['status'],'needs-reference')

    def test_editorial_source_cannot_pass_even_when_user_supplied(self):
        r=ref('user','user');r['commercial']=False
        self.assertEqual(select_context(brief(),[r])['status'],'needs-reference')

    def test_missing_setup_and_function_only_turns_cannot_pass(self):
        for mutate in (lambda r:r['ad_interaction'].pop('participant_reason'),
                       lambda r:r['speaker_turns'][1].pop('text'),
                       lambda r:r['speaker_turns'][1].update({'start':15,'end':18}),
                       lambda r:r['speaker_turns'][2].update({'start':1,'end':2}),
                       lambda r:r.update({'inspection':None}),
                       lambda r:r.update({'ad_interaction':None})):
            r=ref();mutate(r)
            self.assertEqual(select_context(brief(),[r])['status'],'needs-reference')

    def test_offering_and_visible_action_must_match(self):
        r=ref();r['allowed_offering_types']=['physical']
        self.assertEqual(select_context(brief(),[r])['status'],'needs-reference')
        r=ref();r['interaction_types']=['product-sample']
        self.assertEqual(select_context(brief(),[r])['status'],'needs-reference')

    def test_missing_interaction_brief_blocks_selection(self):
        for field in ('offering_type','interaction_type'):
            b=brief();del b[field]
            result=select_context(b,[ref()])
            self.assertEqual(result['status'],'needs-reference')
            self.assertTrue(result['brief_gaps'])

    def test_complete_project_record_replaces_seed_with_same_id(self):
        seed=ref();seed['inspection']['coverage']='partial'
        project=ref(origin='project')
        result=select_context(brief(),[seed,project])
        self.assertEqual(result['status'],'ready-for-writing')
        self.assertEqual(len(result['references']),1)
        self.assertEqual(result['references'][0]['origin'],'project')

    def test_real_library_leads_and_excluded_radio_do_not_satisfy_gate(self):
        library=json.loads((SCRIPTS.parent/'references'/'street-reference-library.json').read_text())
        result=select_context(brief(),library['references'])
        self.assertEqual(result['status'],'needs-reference')
        self.assertTrue(any('editorial' in e['reason'] or 'Operator rejected' in e['reason']
                            for e in result['excluded']))


if __name__ == '__main__':unittest.main()

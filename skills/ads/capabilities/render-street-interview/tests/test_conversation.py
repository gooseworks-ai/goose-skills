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
            "language":"en","observed":True,"observed_scope":"transcript","source":"https://example.org/source",
            "transfer_rule":"follow the unexpected answer","limitations":"delivery unobserved",
            "speaker_turns":[{"speaker":"a","does":"asks"},{"speaker":"b","does":"answers"},{"speaker":"a","does":"follows up"}]}


class StreetPreviewTests(unittest.TestCase):
    def test_service_needs_no_object_reference(self):
        c=cfg();brandkit.validate(c)
        self.assertIsNone(brandkit.reference_image(c))
        p=format_spec.build_prompt(c)
        self.assertEqual(format_spec.lint(p,mode="conversation"), [])
        self.assertNotIn("@Image",p)
        self.assertEqual(len(format_spec.split_shots(p)),4)
        self.assertEqual(brandkit.expected_lines(c).count(c["question"]),1)

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

    def test_long_script_fails_before_spend(self):
        c=cfg();c['shots'][1]['line']='word '*40
        with self.assertRaises(SystemExit):brandkit.validate(c)

    def test_location_light_is_dynamic(self):
        c=cfg();c['location']['light']='late afternoon sunlight'
        self.assertIn('late afternoon sunlight',format_spec.build_prompt(c))

    def test_invalid_shot_types_and_spoken_reactions_are_rejected(self):
        for malformed in ('not a shot', {'kind':'reaction','speaker':'participant','line':'Yes'},
                          {'kind':'reaction','speaker':'participant','line':32}):
            c=cfg();c['shots'].append(malformed)
            with self.assertRaises(SystemExit):brandkit.validate(c)

    def test_prompt_guards_are_load_bearing(self):
        p=format_spec.build_prompt(cfg())
        self.assertTrue(format_spec.lint(p.replace('same microphone','same object'),mode='conversation'))
        self.assertTrue(format_spec.lint(p+' @Image1',mode='conversation'))

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

    def test_user_source_selected_first_and_wrong_formats_excluded(self):
        wrong=ref('wrong');wrong['format']='podcast'
        result=select_context({'mode':'conversation','brand_id':'service'},[ref(),ref('user','user'),wrong])
        self.assertEqual(result['references'][0]['id'],'user')
        self.assertEqual(result['excluded'][0]['id'],'wrong')

    def test_missing_or_unobserved_references_return_research_gap(self):
        r=ref();r['observed']=False
        result=select_context({'mode':'conversation'},[r])
        self.assertEqual(result['status'],'needs-reference')
        self.assertTrue(result['research_queries'])

    def test_transcript_selection_keeps_delivery_gap_explicit(self):
        result=select_context({'mode':'conversation'},[ref()])
        self.assertEqual(result['status'],'ready-for-writing')
        self.assertTrue(result['research_queries'])

    def test_service_does_not_select_product_guess_only(self):
        r=ref();r['execution_modes']=['product-guess']
        self.assertEqual(select_context({'mode':'conversation'},[r])['status'],'needs-reference')


if __name__ == '__main__':unittest.main()

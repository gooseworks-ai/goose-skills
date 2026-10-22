"""Exercise missing-work blockers, selection binding and exact pre-quote review."""
import copy
import json
import os
from pathlib import Path
import subprocess
import sys
import tempfile
import unittest

import workflow
import compose
from test_compose import base_ad


def run_fixture():
    sources = [dict(id='s1', type='product_record', locator='brand product p1', excerpt='Machine washable wool rug.',
                    status='found', public=True, advertising_use='plain_fact', qualifiers='Cold gentle cycle'),
               dict(id='s2', type='customer_review', locator='https://brightloom.test/reviews/1', excerpt='Mud after every walk.',
                    status='found', public=True, advertising_use='customer_language', qualifiers='Hook source, not testimonial'),
               dict(id='s3', type='marketer', locator='brief message 1', excerpt='Pet owners are our customers.',
                    status='confirmed', public=True, advertising_use='marketer_reason', qualifiers='')]
    for n in range(3):
        sources.append(dict(id='ref' + str(n), type='reference', locator='https://references.test/' + str(n),
                            excerpt='Observed product-and-action treatment', status='found', public=True,
                            advertising_use='observation', qualifiers='Run length unknown'))
    reasons = []
    for n, why in enumerate(['Clean up after muddy walks', 'Care instructions visible before buying', 'Wool texture for a room']):
        reasons.append(dict(id='r' + str(n), reason=why, source_ids=['s' + str(n + 1)],
                            persona=dict(description='Pet owner', source_ids=['s2', 's3']),
                            proof=dict(description='The product can be machine washed', source_ids=['s1'], kind='demonstration',
                                       supports='Shows the cleanup capability, not a guaranteed result.'),
                            decision='selected' if n == 0 else 'rejected', why='Most relevant cleanup tension' if n == 0 else 'Less relevant to requested moment',
                            gate={k: dict(pass_=True, why='reviewed') for k in []}))
    reasons[0]['gate'] = {k: {'pass': True, 'why': why} for k, why in {
        'promise': 'Machine-washable record supports the cleanup idea.', 'proof': 'A demonstrated wash cycle shows the feature.',
        'hook': 'Three words, readable at thumbnail size.', 'message': 'Mud and the washable rug explain the event.',
        'persona': 'Muddy-walk review and marketer segment support pet owners.'}.items()}
    options = [dict(id='v1', premise='A muddy paw trail becomes the route to a washing machine.', relationship='The mess points to the supported cleanup action.', decision='selected', why='The event makes the product capability visible.'),
               dict(id='v2', premise='A rug tags along after a muddy dog.', relationship='Pet and textile share the consequence of the walk.', decision='rejected', why='Harder to show the wash feature clearly.'),
               dict(id='v3', premise='A care label opens into a doorway to the laundry.', relationship='Care instructions turn into an action.', decision='rejected', why='The label could dominate the product.')]
    direction = dict(product_truth='Machine-washable wool rug.', truth_source='s1: product record, cold gentle cycle',
                     human_situation='A pet owner returns from a muddy walk.', situation_basis='research', situation_source='s2 and s3',
                     premise=options[0]['premise'], relationship=options[0]['relationship'],
                     scene='Real rug beside the laundry, muddy paw trail pointing toward the open machine.',
                     protected_decision='The paw trail must visibly connect the real rug to the laundry.',
                     reference_role='mechanism', reference_contribution='An object points toward its next useful action.', direct_competitor=False,
                     exact_copy=['Walk. Wash. Repeat.'])
    return dict(schema_version=1, brand_id='brand_test', mode='fresh',
                selection_review=dict(reviewer='fresh critic', context='fresh', verdict='pass', findings=[], resolution='No remaining supported findings'),
                brief=dict(request='Three strong visual ideas, choose one ad about the washable rug.', count=1,
                           creative_goal='transformative', goal_basis='The request asks for competing visual ideas.'),
                coverage=[dict(kind=k, status='complete', locator='call/' + k, checked_at='2026-10-22', scope='first bounded sample',
                               examined=3, available_total=3, observations=['Recorded observation'], stopping_reason='All three records checked')
                          for k in ('brand', 'own_ads', 'history', 'customer', 'references', 'platform_scope')],
                sources=sources, reasons=reasons,
                ads=[dict(id='a1', reason_id='r0', framework='demonstration', style='editorial photo', composition='diagonal trail', awareness='solution', template_id='template_test', truth_source_ids=['s1'], situation_source_ids=['s2', 's3'],
                          creative_direction=direction, visual_options=options, selected_visual_id='v1',
                          hooks=[dict(text=t, formula=f, rank=n + 1, why=w) for n, (t, f, w) in enumerate([
                              ('Walk. Wash. Repeat.', 'sequence', 'Names the routine and action.'),
                              ('Mud happens.', 'tension', 'The feature needs more context.'),
                              ('Ready for another walk.', 'occasion', 'Less clear about washing.')])],
                          reference_options=[dict(template_id='template_test' if n == 0 else 'other' + str(n), advertiser='Brand' + str(n),
                                                  source_id='ref' + str(n), decision='selected' if n == 0 else 'rejected',
                                                  why='The action fits' if n == 0 else 'Less useful relationship') for n in range(3)])])


class WorkflowTests(unittest.TestCase):
    def assertBlocked(self, plan, fragment):
        with self.assertRaisesRegex(workflow.WorkflowError, fragment):
            workflow.validate(plan)

    def test_valid_complete_and_honest_partial(self):
        p = run_fixture()
        self.assertEqual(workflow.validate(p)['status'], 'ready')
        p['coverage'][1].update(status='partial', available_total=540, limitation='Only three cards inspected')
        self.assertBlocked(p, 'coverage_decision')
        p['coverage_decision'] = {'choice': 'proceed_with_limits', 'why': 'Research enough for these facts; no global novelty claim.'}
        result = workflow.validate(p)
        self.assertEqual(result['status'], 'partial')
        self.assertEqual(len(result['limitations']), 1)

    def test_missing_upstream_work_blocks(self):
        for field, message in [('coverage', 'coverage'), ('sources', 'sources'), ('reasons', 'reasons')]:
            with self.subTest(field=field):
                p = run_fixture(); p.pop(field)
                self.assertBlocked(p, message)
        p = run_fixture(); p['reasons'] = p['reasons'][:1]
        self.assertBlocked(p, 'twice')
        p = run_fixture(); p['ads'][0]['hooks'] = p['ads'][0]['hooks'][:1]
        self.assertBlocked(p, 'ranked hook')
        p = run_fixture(); p['reasons'][0].pop('gate')
        self.assertBlocked(p, 'scored concept')
        p = run_fixture(); p['reasons'][0]['gate']['proof']['pass'] = False
        self.assertBlocked(p, 'gate failed')

    def test_set_rejects_cosmetic_duplicates_and_missing_reference_comparison(self):
        p = run_fixture(); p['brief']['count'] = 2
        other = copy.deepcopy(p['ads'][0]); other['id'] = 'a2'; p['ads'].append(other)
        self.assertBlocked(p, 'reason/framework/style repeated')
        p = run_fixture(); p['ads'][0]['reference_options'] = p['ads'][0]['reference_options'][:1]
        self.assertBlocked(p, 'reference comparison')
        p = run_fixture(); p['ads'][0]['reference_options'][1]['advertiser'] = 'Brand0'
        self.assertBlocked(p, 'three advertisers')

    def test_review_is_required_and_same_agent_needs_unavailable_delegation(self):
        p = run_fixture(); p.pop('selection_review')
        self.assertBlocked(p, 'selection_review')
        p = run_fixture(); p['selection_review']['context'] = 'same_agent'
        self.assertBlocked(p, 'fresh critic')
        p['delegation_available'] = False
        self.assertEqual(workflow.validate(p)['status'], 'ready')
        p['selection_review']['verdict'] = 'revise'
        self.assertBlocked(p, 'resolve selection')

    def test_unknown_unusable_internal_proof_rejects(self):
        for status in ('unknown', 'guess', 'pending'):
            p = run_fixture(); p['sources'][0]['status'] = status
            self.assertBlocked(p, 'unusable evidence')
        p = run_fixture(); p['sources'][0]['public'] = False
        self.assertBlocked(p, 'internal-only')
        p = run_fixture(); p['reasons'][0]['proof']['source_ids'] = ['s2']
        self.assertBlocked(p, 'usable fact')
        p = run_fixture(); p['reasons'][0]['persona']['source_ids'] = ['missing']
        self.assertBlocked(p, 'persona')

    def test_counts_without_observations_and_language_as_fact_do_not_pass(self):
        p = run_fixture(); p['coverage'][0]['observations'] = []
        self.assertBlocked(p, 'actual observations')
        p = run_fixture(); p['ads'][0]['truth_source_ids'] = ['s2']
        self.assertBlocked(p, 'product truth needs')

    def test_visual_selection_for_transformative_but_not_forced_surrealism(self):
        p = run_fixture(); p['ads'][0]['visual_options'] = p['ads'][0]['visual_options'][:1]
        self.assertBlocked(p, 'competing visual')
        p['brief'].update(creative_goal='straightforward', goal_basis='User requested a direct demonstration')
        self.assertEqual(workflow.validate(p)['status'], 'ready')
        p['ads'][0]['creative_direction']['premise'] = 'different'
        self.assertBlocked(p, 'chosen visual')

    def test_no_text_and_nonfresh_have_explicit_scoped_paths(self):
        p = run_fixture(); a = p['ads'][0]
        a['creative_direction']['exact_copy'] = []; a['hooks'] = []; a['copy_intent'] = 'no_added_text'
        self.assertEqual(workflow.validate(p)['status'], 'ready')
        p['mode'] = 'copy'; p['reasons'] = p['reasons'][:1]; a['visual_options'] = a['visual_options'][:1]
        a['reference_options'] = a['reference_options'][:1]; p['coverage'] = p['coverage'][:1]
        self.assertBlocked(p, 'basis')
        p['basis'] = {'locator': 'approved creative c1', 'decision': 'User asked to remove campaign text'}
        p['reasons'] = []; a.pop('reason_id'); p.pop('selection_review')
        self.assertEqual(workflow.validate(p)['status'], 'ready')

    def test_composed_ad_must_match_checked_selection(self):
        p = run_fixture(); ad = base_ad()
        ad['template']['id'] = 'template_test'; ad['creative_direction'] = copy.deepcopy(p['ads'][0]['creative_direction'])
        self.assertEqual(workflow.match_ad(p, 'a1', ad)['status'], 'ready')
        ad['creative_direction']['premise'] = 'unselected shortcut'
        with self.assertRaisesRegex(workflow.WorkflowError, 'direction drift'):
            workflow.match_ad(p, 'a1', ad)

    def test_quote_binds_review_to_exact_final_and_remains_dry_run(self):
        p = run_fixture(); direction = p['ads'][0]['creative_direction']
        request = dict(brand_id='brand_test', prompt='Exact', image_urls=['https://brand.test/real.png'], ratios=['4:5'], variants=1)
        final = dict(creative_direction=direction, workflow=dict(run_sha256=workflow.digest(p), ad_id='a1'),
                     renders=[dict(prompt='Exact', image_urls=request['image_urls'], render_spec=request)])
        review = dict(final_sha256=workflow.digest(final), reviewed_by='reviewer', reviewed_at='2026-10-22',
                      claims=dict(verdict='pass', basis='Exact fact and qualifiers'), policy=dict(verdict='pass', basis='Applicable category checked'))
        out = workflow.quote(p, 'a1', final, review)
        self.assertTrue(out['dry_run_requests'][0]['dry_run'])
        final['renders'][0]['image_urls'] = ['https://brand.test/other.png']
        with self.assertRaisesRegex(workflow.WorkflowError, 'stale'):
            workflow.quote(p, 'a1', final, review)
        review['final_sha256'] = workflow.digest(final)
        with self.assertRaisesRegex(workflow.WorkflowError, 'specification drift'):
            workflow.quote(p, 'a1', final, review)

    def test_read_manifest_reuses_only_exact_verified_parts(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            prepared = dict(input_sha256='test', shared_rules='R' * 7000, ad_context='K' * 12000 + 'first ad')
            first = compose.save_prepared(prepared, str(root / 'one'))
            with self.assertRaisesRegex(compose.ComposeError, 'new per-ad'):
                compose.save_prepared(prepared, str(root / 'one'), str(root / 'one' / 'receipt.json'))
            second_input = dict(prepared, ad_context='K' * 12000 + 'different ad')
            second = compose.save_prepared(second_input, str(root / 'two'), str(root / 'one' / 'receipt.json'))
            self.assertEqual(len(second['files_to_read']), 1)
            self.assertEqual(len(second['reused_parts']), 4)
            self.assertEqual(Path(second['files_to_read'][0]['path']).read_text(), 'different ad')
            # Every current byte remains available, even when already-read parts are omitted from the read list.
            context = ''.join(Path(x['path']).read_text() for x in second['parts'] if 'ad_context' in x['path'])
            self.assertEqual(context, second_input['ad_context'])
            # Corrupted/missing previous files cannot silently authorize reuse.
            for entry in first['parts']:
                Path(entry['path']).write_text('corrupt')
            third = compose.save_prepared(second_input, str(root / 'three'), str(root / 'one' / 'receipt.json'))
            self.assertEqual(third['reused_parts'], [])
            self.assertEqual(len(third['files_to_read']), len(third['parts']))

    def test_real_cli_stops_missing_run_and_finalizes_checked_ad(self):
        script = str(Path(__file__).with_name('compose.py'))
        p = run_fixture(); ad = base_ad()
        ad['template'].update(id='template_test', brand_owned=False, source_kind='curated')
        ad['structure'] = dict(media_slot='product', blueprint_instruction='authored scene')
        ad['creative_direction'] = copy.deepcopy(p['ads'][0]['creative_direction'])
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp); ap = root / 'ad.json'; answer_path = root / 'answer.json'
            def execute():
                ap.write_text(json.dumps(ad))
                ans = dict(title='Rug cleanup', input_sha256=compose.prepare(ad)['input_sha256'], prompt='Walk. Wash. Repeat. ' + ad['creative_direction']['protected_decision'],
                           source_media='product', target_media='product', adapted_subject='rug', reference_ids=['product-1'])
                answer_path.write_text(json.dumps(ans))
                return subprocess.run([sys.executable, script, 'final', str(ap), str(answer_path)], capture_output=True, text=True)
            self.assertIn('Workflow blocked', execute().stderr)
            (root / 'run.json').write_text(json.dumps(p)); ad['workflow'] = dict(run_path='run.json', ad_id='a1', run_sha256=workflow.digest(p))
            result = execute()
            self.assertEqual(result.returncode, 0, result.stderr)
            final = json.loads(result.stdout)
            self.assertNotIn('ads_render', final['renders'][0])
            self.assertNotIn('dry_run', final['renders'][0]['render_spec'])
            self.assertEqual(final['workflow']['run_sha256'], workflow.digest(p))
            p['brief']['goal_basis'] += ' changed'
            (root / 'run.json').write_text(json.dumps(p))
            self.assertIn('Run changed', execute().stderr)


if __name__ == '__main__':
    unittest.main()

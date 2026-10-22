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
                            persona=dict(description='Pet owner', basis='research', source_ids=['s2', 's3']),
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
    plan = dict(schema_version=1, brand_id='brand_test', mode='fresh',
                selection_review=dict(reviewer='fresh critic', context='fresh', verdict='pass', findings=[], resolution='No remaining supported findings',
                                      source_assessment='s1 is first-party product authority. s2 is a customer review supporting muddy-walk behavior; s3 is the marketer segment statement. This supports a bounded washable-rug demonstration, not measured cleanup results.'),
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

    return reviewed_fixture(plan)


def reviewed_fixture(plan):
    # Test-only stand-in for the critic returning the receipt after reviewing these inputs.
    plan['selection_review']['selection_sha256'] = workflow.selection_digest(plan)
    return plan


def quote_fixture():
    plan = run_fixture()
    request = dict(brand_id='brand_test', prompt='Exact', image_urls=['https://brand.test/real.png'], ratios=['4:5'], variants=1)
    final = dict(creative_direction=plan['ads'][0]['creative_direction'],
                 workflow=dict(run_sha256=workflow.digest(plan), ad_id='a1'),
                 renders=[dict(prompt='Exact', image_urls=request['image_urls'], render_spec=request)])
    review = dict(final_sha256=workflow.digest(final), reviewed_by='reviewer', reviewed_at='2026-10-22',
                  claims=dict(verdict='pass', basis='Exact fact and qualifiers'),
                  policy=dict(verdict='pass', basis='Applicable category checked'))
    return plan, final, review


def unpublished_draft_review(review):
    review['policy'] = dict(verdict='source_unavailable', basis='Current Meta rules could not be refreshed.',
                          known_rules=dict(verdict='pass', basis='Meta personal traits, misleading content and disclosure screens checked; no category restriction applies.'),
                          unresolved_risks=[], unavailable_sources=[dict(url='https://policy.test/current', reason='HTTP 429',
                                                                       unchecked_rules='Current changes to Meta advertising rules')])
    review['unpublished_draft'] = dict(authorization_source='User message 7',
                                     authorization_quote='Generate this only as an unpublished staging draft test.', launch_hold=True)
    return review


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
        result = workflow.validate(reviewed_fixture(p))
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

    def test_independent_review_required_even_without_delegation(self):
        p = run_fixture(); p.pop('selection_review')
        self.assertBlocked(p, 'selection_review')
        p = run_fixture(); p['selection_review']['context'] = 'same_agent'
        self.assertBlocked(p, 'independent selection review')
        p['delegation_available'] = False
        self.assertBlocked(p, 'independent selection review')
        p['selection_review']['context'] = 'human'
        self.assertBlocked(p, 'critique_source')
        p['selection_review']['critique_source'] = 'Human critique in message 42: proof fits; revise the second option'
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

    def test_ordinary_fresh_request_cannot_skip_visual_comparison(self):
        p = run_fixture()
        p['brief'].update(request='Make five static ads for this rug.', count=5,
                          creative_goal='straightforward', goal_basis='Ordinary fresh ads')
        first = p['ads'][0]
        first['visual_options'] = first['visual_options'][:1]
        for n in range(1, 5):
            other = copy.deepcopy(first); other.update(id='a' + str(n + 1), framework='framework ' + str(n))
            p['ads'].append(other)
        self.assertBlocked(p, 'competing visual premises')
        p['mode'] = 'more'
        self.assertBlocked(p, 'competing visual premises')

    def test_explicit_scene_constraint_not_a_straightforward_label(self):
        p = run_fixture(); p['ads'][0]['visual_options'] = p['ads'][0]['visual_options'][:1]
        self.assertBlocked(p, 'competing visual')
        p['brief'].update(creative_goal='straightforward', goal_basis='Direct demonstration chosen by agent')
        self.assertBlocked(p, 'competing visual')
        p['brief']['execution_constraint'] = dict(kind='direct_demonstration', user_quote='Show the rug entering the washer.')
        self.assertBlocked(p, 'actual request')
        p['brief']['request'] = 'Make an ad. Show the rug entering the washer.'
        self.assertEqual(workflow.validate(reviewed_fixture(p))['status'], 'ready')
        p['brief']['execution_constraint']['kind'] = 'ordinary'
        self.assertBlocked(p, 'unknown execution constraint')
        p['brief']['execution_constraint']['kind'] = 'user_supplied_scene'
        self.assertEqual(workflow.validate(reviewed_fixture(p))['status'], 'ready')
        p['ads'][0]['creative_direction']['premise'] = 'different'
        self.assertBlocked(p, 'chosen visual')

    def test_mandatory_learnings_survive_all_optional_ranks(self):
        ad = base_ad()
        optional = [dict(kind='do', text='optional %02d' % n) for n in range(12)]
        mandatory = [dict(kind=k, text='%s rule %02d' % (k, n))
                     for n in range(12) for k in ('must', 'dont')]
        ad['learnings'] = optional + mandatory
        self.assertIn(8, compose.resolve(ad)['departures'])
        prepared = compose.prepare(ad)
        text = prepared['shared_rules'] + prepared['ad_context']
        for row in mandatory:
            self.assertIn(row['text'], text)
        for row in optional[:8]:
            self.assertIn(row['text'], text)
        for row in optional[8:]:
            self.assertNotIn(row['text'], text)
        # Rules at the front must not consume the optional allowance either.
        ad['learnings'] = mandatory + optional
        self.assertEqual(compose.learnings_block(ad), compose.learnings_block(dict(ad, learnings=optional + mandatory)))

    def test_no_text_and_nonfresh_have_explicit_scoped_paths(self):
        p = run_fixture(); a = p['ads'][0]
        a['creative_direction']['exact_copy'] = []; a['hooks'] = []; a['copy_intent'] = 'no_added_text'
        self.assertEqual(workflow.validate(reviewed_fixture(p))['status'], 'ready')
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
        p, final, review = quote_fixture()
        out = workflow.quote(p, 'a1', final, review)
        self.assertTrue(out['dry_run_requests'][0]['dry_run'])
        final['renders'][0]['image_urls'] = ['https://brand.test/other.png']
        with self.assertRaisesRegex(workflow.WorkflowError, 'stale'):
            workflow.quote(p, 'a1', final, review)
        review['final_sha256'] = workflow.digest(final)
        with self.assertRaisesRegex(workflow.WorkflowError, 'specification drift'):
            workflow.quote(p, 'a1', final, review)

    def test_unpublished_draft_keeps_unverified_policy_and_only_emits_dry_quotes(self):
        plan, final, review = quote_fixture()
        unpublished_draft_review(review)
        before = copy.deepcopy(review)
        result = workflow.quote(plan, 'a1', final, review)
        self.assertEqual(result['policy_status'], 'not_currently_verified')
        self.assertIs(result['launch_hold'], True)
        self.assertEqual(result['checked_policy_rules'], review['policy']['known_rules'])
        self.assertEqual(result['unchecked_policy_sources'], review['policy']['unavailable_sources'])
        self.assertEqual(result['unpublished_draft'], review['unpublished_draft'])
        self.assertTrue(all(r['dry_run'] is True for r in result['dry_run_requests']))
        self.assertTrue(result['limitations'])
        self.assertEqual(review, before)
        # This exceptional route still binds the exact reviewed prompts/images.
        final['renders'][0]['prompt'] = 'Changed after review'
        with self.assertRaisesRegex(workflow.WorkflowError, 'stale'):
            workflow.quote(plan, 'a1', final, review)

    def test_unpublished_draft_cannot_clear_real_risks_or_supply_its_own_authority(self):
        mutations = [
            (lambda r: r.pop('unpublished_draft'), 'unpublished_draft'),
            (lambda r: r['unpublished_draft'].pop('authorization_source'), 'authorization_source'),
            (lambda r: r['unpublished_draft'].update(authorization_quote=''), 'authorization_quote'),
            (lambda r: r['unpublished_draft'].update(launch_hold=False), 'launch hold'),
            (lambda r: r['policy'].update(unresolved_risks=['Unresolved regulated-category restriction']), 'unresolved'),
            (lambda r: r['policy'].pop('unresolved_risks'), 'unresolved'),
            (lambda r: r['policy']['known_rules'].update(verdict='flag'), 'known policy'),
            (lambda r: r['policy'].update(unavailable_sources=[]), 'inaccessible'),
            (lambda r: r['policy']['unavailable_sources'][0].pop('reason'), 'reason'),
            (lambda r: r['policy']['unavailable_sources'][0].pop('unchecked_rules'), 'unchecked_rules'),
            (lambda r: r['policy'].update(verdict='flag'), 'policy review'),
            (lambda r: r['claims'].update(verdict='flag'), 'claims review'),
        ]
        for mutate, message in mutations:
            with self.subTest(case=message):
                plan, final, review = quote_fixture()
                unpublished_draft_review(review)
                mutate(review)
                with self.assertRaisesRegex(workflow.WorkflowError, message):
                    workflow.quote(plan, 'a1', final, review)
        # An ordinary request with incomplete policy review gets no default exception.
        plan, final, review = quote_fixture()
        review['policy']['verdict'] = 'not_checked'
        with self.assertRaisesRegex(workflow.WorkflowError, 'policy review'):
            workflow.quote(plan, 'a1', final, review)

    def test_source_labels_do_not_decide_breadth_or_replace_review(self):
        plan = run_fixture()
        plan['sources'][0]['locator'] = 'https://brand.test/products/rug'
        plan['sources'][2].update(type='official_website', locator='https://brand.test/rug-care',
                                  excerpt='Machine washable wool rug; cold gentle cycle.', advertising_use='plain_fact')
        plan['reasons'][0]['source_ids'] = ['s1', 's2']
        plan['reasons'][1]['source_ids'] = ['s3']
        plan['reasons'][2]['source_ids'] = ['s1']
        plan['selection_review']['source_assessment'] = (
            's1 and s3 are the same brand’s product/care facts, not independent corroboration. '
            's2 is a buyer review supporting pet-owner behavior. These support a bounded wash-use introduction.')
        reviewed_fixture(plan)
        # Same sources, excerpts and locators; descriptive granularity cannot change the decision.
        outcomes = []
        for labels in [('record',) * 3, ('product_documentation', 'customer_review', 'official_website'),
                       ('brand_website', 'customer_review', 'brand_website')]:
            labelled = copy.deepcopy(plan)
            for source, label in zip(labelled['sources'][:3], labels):
                source['type'] = label
            # A source-record edit first needs the critic to review the changed record.
            if labels != tuple(s['type'] for s in plan['sources'][:3]):
                self.assertBlocked(labelled, 'stale')
            outcomes.append(workflow.validate(reviewed_fixture(labelled))['status'])
            labelled['selection_review'].pop('source_assessment')
            self.assertBlocked(labelled, 'source_assessment')
        self.assertEqual(outcomes, ['ready', 'ready', 'ready'])

    def test_feature_facts_and_hypothetical_audience_need_reviewed_scope_limits(self):
        plan = run_fixture()
        plan['sources'] = [s for s in plan['sources'] if s['id'] not in ('s2', 's3')]
        for reason in plan['reasons']:
            reason['source_ids'] = ['s1']
            reason['persona'].update(basis='creative_hypothesis', source_ids=['s1'])
        plan['reasons'][0]['gate']['persona']['why'] = 'Pet-owner use inferred from the feature; unvalidated audience hypothesis.'
        ad = plan['ads'][0]
        ad['creative_direction']['situation_basis'] = 'creative_hypothesis'
        ad['situation_source_ids'] = []
        # A fully examined source is not proof that this inferred audience has been validated.
        customer = next(c for c in plan['coverage'] if c['kind'] == 'customer')
        customer.update(status='complete', examined=0, available_total=0, observations=[],
                        scope='Customer bank checked; no buyer records exist.', stopping_reason='No records found')
        plan['selection_review']['source_assessment'] = (
            's1 is one first-party product source; catalogue facts do not prove buyer demand. No independent '
            'buyer insight was retrieved. Pet owners are an audience hypothesis. Machine-washability supports '
            'only the bounded product-use introduction; no typical result or validated demand is claimed.')
        reviewed_fixture(plan)
        self.assertBlocked(plan, 'coverage_decision')
        plan['coverage_decision'] = dict(choice='proceed_with_limits',
                                         why='No audience support retrieved; pet-owner use is an unvalidated hypothesis for a bounded feature introduction.')
        result = workflow.validate(reviewed_fixture(plan))
        self.assertEqual(result['status'], 'partial')
        self.assertIn('Unvalidated audience hypotheses', result['limitations'][0])
        self.assertEqual(customer['status'], 'complete')
        # A hypothesis is context, never an alternative proof kind or a usable fact.
        broken = copy.deepcopy(plan); broken['reasons'][0]['proof']['kind'] = 'creative_hypothesis'
        self.assertBlocked(broken, 'unsupported proof')
        broken = copy.deepcopy(plan); broken['reasons'][0]['proof']['source_ids'] = ['missing']
        self.assertBlocked(broken, 'proof')
        broken = copy.deepcopy(plan); broken['sources'][0]['status'] = 'unknown'
        self.assertBlocked(broken, 'unusable evidence')
        broken = copy.deepcopy(plan); broken['selection_review']['verdict'] = 'blocked'
        self.assertBlocked(broken, 'resolve selection')
        broken = copy.deepcopy(plan); broken['reasons'][0]['persona'].pop('basis')
        self.assertBlocked(broken, 'persona basis')

    def test_authored_scene_does_not_downgrade_researched_audience(self):
        plan = run_fixture()
        plan['ads'][0]['creative_direction']['situation_basis'] = 'creative_hypothesis'
        plan['ads'][0]['situation_source_ids'] = []
        plan['selection_review']['source_assessment'] += ' The specific scene is authored; the pet-owner audience remains supported by s2.'
        result = workflow.validate(reviewed_fixture(plan))
        self.assertEqual(result['status'], 'ready')
        self.assertEqual(result['limitations'], [])
        self.assertTrue(all(c['status'] == 'complete' for c in plan['coverage']))

    def test_selection_receipt_binds_reviewed_inputs_not_execution_tracking(self):
        original = run_fixture()
        # Shapes used by the actual held runs, with fictional evidence and no brand concepts.
        original.update(history_context=[dict(id='prior-use', locator='prior-batch.json', excerpt='Earlier use photo')],
                        set_decision='Keep distinct events', unsupported_gaps=[dict(reason='Unproven outcome', why='No result evidence')],
                        reference_exclusions=['Rejected fixture image'],
                        evidence_families=[dict(origin='brand', source_ids=['s1'])],
                        platforms=['Meta'], placements=['feed'], ratios=['4:5'])
        original['ads'][0].update(ratio='4:5', platforms=['Meta'], placements=['feed'],
                                  settings_basis='Current kit palette and font')
        reviewed_fixture(original)
        missing = copy.deepcopy(original); missing['selection_review'].pop('selection_sha256')
        self.assertBlocked(missing, 'stale')
        edits = [
            lambda p: p['sources'][0].update(excerpt='New product claim'),
            lambda p: p['reasons'][0]['proof'].update(supports='Different promise'),
            lambda p: p['reasons'][0]['persona'].update(description='New audience'),
            lambda p: p['ads'][0]['creative_direction'].update(scene='Different selected event'),
            lambda p: p['ads'][0]['reference_options'][0].update(why='Different contribution'),
            lambda p: p['ads'][0].update(copy={'primary_a': 'Changed copy'}),
            lambda p: p['history_context'][0].update(excerpt='Another known ad'),
            lambda p: p.update(set_decision='Replace duplicated event'),
            lambda p: p['unsupported_gaps'][0].update(why='Changed evidence gap'),
            lambda p: p['reference_exclusions'].append('Another excluded reference'),
            lambda p: p['evidence_families'][0].update(origin='Changed origin'),
            lambda p: p['ads'][0].update(ratio='9:16'),
            lambda p: p['ads'][0].update(ratios=['9:16']),
            lambda p: p['ads'][0]['platforms'].append('Google'),
            lambda p: p['ads'][0]['placements'].append('story'),
            lambda p: p['ads'][0].update(settings_basis='Different font/palette'),
            lambda p: p['platforms'].append('Google'),
            lambda p: p['placements'].append('story'),
            lambda p: p['ratios'].append('9:16'),
            lambda p: p['coverage'][0]['observations'].append('Additional source observation'),
        ]
        for edit in edits:
            with self.subTest(edit=edit):
                changed = copy.deepcopy(original); edit(changed)
                self.assertBlocked(changed, 'stale')
        tracked = copy.deepcopy(original)
        tracked.update(phase='composing', jobs=['job1'], delivery={'url': 'artifact'})
        tracked['ads'][0].update(compose={'path': 'final.json'}, job_id='job1', render_id='render1')
        tracked['selection_review'].update(reviewed_at='2026-10-23', resolution='Review metadata update')
        self.assertEqual(workflow.selection_digest(original), workflow.selection_digest(tracked))
        self.assertEqual(workflow.validate(tracked)['status'], 'ready')

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
            receipt = subprocess.run([sys.executable, str(Path(script).with_name('workflow.py')), 'selection-digest',
                                      str(root / 'run.json')], capture_output=True, text=True, check=True)
            self.assertEqual(json.loads(receipt.stdout)['selection_sha256'], p['selection_review']['selection_sha256'])
            result = execute()
            self.assertEqual(result.returncode, 0, result.stderr)
            final = json.loads(result.stdout)
            self.assertNotIn('ads_render', final['renders'][0])
            self.assertNotIn('dry_run', final['renders'][0]['render_spec'])
            self.assertEqual(final['workflow']['run_sha256'], workflow.digest(p))
            p['brief']['goal_basis'] += ' changed'
            (root / 'run.json').write_text(json.dumps(p))
            self.assertIn('selection review is missing or stale', execute().stderr)
            # Even after a fresh selection review, the old linked compose receipt is still stale.
            reviewed_fixture(p)
            (root / 'run.json').write_text(json.dumps(p))
            self.assertIn('Run changed', execute().stderr)


if __name__ == '__main__':
    unittest.main()

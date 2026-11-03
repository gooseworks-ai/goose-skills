#!/usr/bin/env python3
"""Check the saved manual fixture reports against their source evidence.

Usage: python3 tests/run-fixtures.py [--case audit|gaps|cluster|metrics|pseo|metrics-missing|metrics-traffic-only|metrics-export]
This is local evidence validation, not a fresh-agent or live-provider test.
No network, model, provider, write-back or paid call is made.
"""
import argparse
import json
from pathlib import Path

HERE = Path(__file__).resolve().parent
CASES = {'audit':'seo-audit','gaps':'keyword-gaps','cluster':'topic-cluster',
         'metrics':'seo-metrics','pseo':'pseo-plan','metrics-missing':'seo-metrics',
         'metrics-traffic-only':'seo-metrics','metrics-export':'seo-metrics'}


def check(case, fixture):
    path = HERE/'fixture-reports'/f'{case}.json'
    d = json.loads(path.read_text())
    text = d['report_markdown']
    assert d['job'] == CASES[case], (case, 'wrong branch')
    assert len(text.split()) >= 180, (case, 'no substantive report')
    assert 'fixture' in text[:300].lower(), (case, 'fixture example passed off as live evidence')
    assert 'manual fixture execution' in d['execution'], (case, 'test method missing')
    assert (path.with_suffix('.md')).read_text().strip() == text.strip(), (case, 'report differs from checked copy')
    e = d['evidence']
    domains = ['coldfield.test','brewbench.test','slowcup.test']
    if case == 'audit':
        rows = e['priorities']; observations={r['id']:r for r in fixture['audit_observations']}
        assert len(rows) == 10 and len({r['evidence_id'] for r in rows}) == 10, 'top-ten count padded or truncated'
        assert {'A1','A2','A3'} <= {r['evidence_id'] for r in rows}, 'confirmed blockers omitted'
        assert {r['evidence_id'] for r in rows[:3]} == {'A1','A2','A3'}, 'copy polish outranks access blockers'
        for row in rows:
            assert row['url'] == observations[row['evidence_id']]['url'], ('affected URL mismatches evidence', row)
        assert '18 HTML pages' in text and 'Parameter URLs were sampled' in text, 'coverage overclaim'
        assert 'Agent:' in text and 'Human:' in text and 'rollback' in text, 'handoff/effort/undo absent'
    elif case == 'gaps':
        rows=e['gaps']; rankings={r['query']:r for c in fixture['rivals'].values() for r in c['ranking_samples']}
        assert any(r['query']=='how to store cold brew coffee' and 'Create' in r['action'] for r in rows), 'verified absent topic omitted'
        assert any(r['query']=='cold brew ratio' and 'Update' in r['action'] for r in rows), 'existing ratio page treated as absent'
        assert any(r['query']=='iced coffee vs cold brew' and 'Keep' in r['action'] for r in rows), 'covered topic treated as absent'
        for row in rows:
            source=rankings[row['query']]
            assert row['rival_url']==source['url'] and row['position']==source['position'], ('unsupported ranking', row)
            assert row['verified']==(source['position'] is not None), 'page existence passed off as ranking'
        assert 'seven' in text and 'selected-query' in text and 'not a census' in text, 'sample limits absent'
    elif case == 'cluster':
        rows=e['pages']; slugs={r['slug'] for r in rows}; pillars=[r for r in rows if r['role']=='pillar']
        assert len(rows)>=6 and len(pillars)==1, 'missing pillar/supporting architecture'
        assert all(set(r['links_to'])<=slugs for r in rows), 'links leave the planned map'
        support=slugs-{pillars[0]['slug']}
        assert set(pillars[0]['links_to'])==support, 'pillar does not reach all supporting pages'
        assert all(pillars[0]['slug'] in r['links_to'] for r in rows if r['role']!='pillar'), 'supporting pages do not link back'
        ratio=next(r for r in rows if 'ratio' in r['slug']); dilution=next(r for r in rows if 'dilut' in r['slug'])
        assert ratio['intent']!=dilution['intent'] and dilution['slug'] in ratio['links_to'], 'recipe/serving intent collapsed'
        assert d['completion']=='complete' and 'no website' in text, 'basic map blocked on unnecessary inputs'
    elif case == 'pseo':
        rows=e['families']; recommended=[r for r in rows if r['recommended']]
        assert recommended and all('city' not in r['pattern'] for r in recommended), 'unsupported city set recommended'
        valid={r['model'] for r in fixture['pseo_inputs']['actual_data'] if r['fit_confirmed']}
        for family in recommended:
            assert family['fields'] and family['example_records'], 'template lacks schema or records'
            assert {r['model'] for r in family['example_records']} <= valid, 'unverified model in pilot data'
        assert set(e['pilot']['pages'])==valid and 'unknown-wide-mouth' in e['pilot']['hold'], 'pilot ignores data readiness'
        for required in ['**URL:**','**Title:**','**Meta:**','**H1:**','**Sections:**','CMS','canonical','sitemap','Publish only','PR','preview','tested_steps']:
            assert required in text, ('incomplete blueprint/handoff',required)
        assert e['pilot']['publish_prerequisites'], 'approval/data prerequisites absent'
    else:
        rows=e['metrics']
        assert rows and all(set(r['values'])==set(domains) for r in rows), 'not a three-domain comparison'
        if case=='metrics-missing':
            assert d['completion']=='incomplete' and d['remaining_prerequisites'], 'unavailable provider presented as success'
            assert all(v is None for r in rows for v in r['values'].values()), 'fabricated unavailable metric'
        elif case=='metrics-traffic-only':
            row=next(r for r in rows if r['kind']=='total_website_visits')
            expected={r['domain']:r['data']['estimated_total_monthly_visits'] for r in fixture['traffic_only_source']['responses']}
            assert row['values']==expected, 'total visits lost or mislabeled'
            assert not any(r['values'].get('coldfield.test')==5040 for r in rows), 'organic count fabricated from channel share'
            assert d['completion']=='incomplete', 'total traffic substituted for SEO metrics'
        elif case=='metrics-export':
            expected={r['domain']:r['estimated_organic_monthly_visits'] for r in fixture['connected_seo_export_case']['data']}
            assert next(r for r in rows if r['kind']=='organic_search_visits')['values']==expected, 'supplied SEO export ignored'
            assert d['completion']=='complete' and 'US, September 2026' in text, 'available report blocked or lacks scope'
        else:
            fields={'authority_score':'domain_rating','backlinks':'backlinks','referring_domains':'refdomains','search_traffic_estimate':'website_overall_search_traffic'}
            responses=fixture['managed_source']['responses']
            for kind,field in fields.items():
                expected={r['data'][0]['domain']:r['data'][0][field] for r in responses}
                assert next(r for r in rows if r['kind']==kind)['values']==expected, ('native field mapping wrong',kind)
            unknown=next(r for r in rows if r['kind']=='organic_keyword_count')
            assert all(v is None for v in unknown['values'].values()), 'sample/native missing keyword count invented'
            assert d['completion']=='partial' and 'market and traffic window absent' in text, 'native source limits omitted'
            assert 'maximum cap' in text and 'supplied response' in text, 'quote cap or actual receipt omitted'
    return f'{case}: PASS'


def main():
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--case',choices=CASES)
    args=parser.parse_args();fixture=json.loads((HERE/'fixtures/coldfield.json').read_text())
    cases=[args.case] if args.case else list(CASES)
    for case in cases: print(check(case,fixture))
    print(f'{len(cases)} evidence-checked manual fixture reports; zero external calls.')

if __name__=='__main__': main()

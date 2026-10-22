#!/usr/bin/env python3
"""Validate recorded ad decisions; never infer research, truth, approval or quality.

check run.json
quote run.json ad-id final.json review.json
The second command emits free dry-run requests, never a paid submit.
"""
import copy
import hashlib
import json
import sys
from datetime import date


class WorkflowError(ValueError):
    pass


def require(value, message):
    if not value:
        raise WorkflowError(message)


def words(value):
    return isinstance(value, str) and bool(value.strip())


def rows(value, label):
    require(isinstance(value, list) and all(isinstance(x, dict) for x in value), label + ' must be an object list')
    return value


def index(value, label):
    entries = rows(value, label)
    require(all(words(x.get('id')) for x in entries), label + ' needs IDs')
    mapped = {x['id']: x for x in entries}
    require(len(mapped) == len(entries), label + ' has duplicate IDs')
    return mapped


def fields(obj, names, label):
    require(isinstance(obj, dict), label + ' must be an object')
    for name in names:
        require(words(obj.get(name)), label + '.' + name + ' is required')


def digest(value):
    return hashlib.sha256(json.dumps(value, sort_keys=True, ensure_ascii=False).encode()).hexdigest()


def validate(plan):
    """Return partial/ready only for structurally sufficient recorded work. Raise on blockers."""
    require(isinstance(plan, dict) and plan.get('schema_version') == 1, 'run schema_version must be 1')
    fields(plan, ('brand_id', 'mode'), 'run')
    mode = plan['mode']
    require(mode in ('fresh', 'more', 'iterate', 'rotation', 'fix', 'graphic', 'copy'), 'unknown run mode')
    fresh = mode in ('fresh', 'more')
    execution_only = mode in ('fix', 'graphic', 'copy')
    brief = plan.get('brief')
    fields(brief, ('request', 'creative_goal', 'goal_basis'), 'brief')
    require(brief['creative_goal'] in ('transformative', 'straightforward'), 'choose a creative_goal from the request')
    require(type(brief.get('count')) is int and brief['count'] > 0, 'brief.count must be positive')
    constraint = brief.get('execution_constraint')
    if constraint is not None:
        fields(constraint, ('kind', 'user_quote'), 'execution_constraint')
        require(constraint['kind'] in ('direct_demonstration', 'user_supplied_scene'), 'unknown execution constraint')
        require(constraint['user_quote'] in brief['request'], 'execution constraint must quote the actual request')
    coverage = rows(plan.get('coverage'), 'coverage')
    required = {'brand', 'own_ads', 'history', 'customer', 'references', 'platform_scope'} if fresh else {'brand'}
    require(required <= {x.get('kind') for x in coverage}, 'coverage missing required source kinds: ' + ', '.join(sorted(required)))
    partial = []
    for c in coverage:
        fields(c, ('kind', 'status', 'locator', 'checked_at', 'scope', 'stopping_reason'), 'coverage')
        require(c['status'] in ('complete', 'partial', 'unavailable'), 'coverage.status must describe actual coverage')
        try:
            date.fromisoformat(c['checked_at'])
        except ValueError:
            raise WorkflowError('coverage.checked_at must be an ISO date')
        require(type(c.get('examined')) is int and c['examined'] >= 0, 'coverage.examined must be a count')
        total = c.get('available_total')
        require(total is None or (type(total) is int and total >= c['examined']), 'coverage total/count mismatch')
        observations = c.get('observations')
        require(isinstance(observations, list) and all(words(x) for x in observations), 'coverage.observations must record what was seen (or [])')
        require(c['examined'] == 0 or observations, 'examined records need actual observations')
        if c['status'] != 'complete':
            require(words(c.get('limitation')), 'partial/unavailable coverage needs its limitation')
            partial.append(c['kind'] + ': ' + c['limitation'])
        if c['status'] == 'unavailable':
            require(c['examined'] == 0, 'unavailable source cannot have examined records')
    sources = index(plan.get('sources'), 'sources')
    for s in sources.values():
        fields(s, ('type', 'locator', 'excerpt'), 'source')
        require(s.get('status') in ('confirmed', 'found'), 'unusable evidence status: ' + s['id'])
        require(s.get('public') is True, 'internal-only/pending sources cannot ground this public ad: ' + s['id'])
        require(s.get('advertising_use') in ('plain_fact', 'approved_claim', 'customer_language', 'observation', 'marketer_reason'), 'source advertising_use is required')
        require(isinstance(s.get('qualifiers'), str), 'preserve source qualifiers, even when empty')
        if s['advertising_use'] == 'approved_claim':
            require(s['status'] == 'confirmed', 'approved claim needs confirmed status')
    def evidence(ids, label):
        require(isinstance(ids, list) and ids and all(isinstance(i, str) and i in sources for i in ids), label + ' needs existing source IDs')
    candidates = index(plan.get('reasons', [] if execution_only else None), 'reasons')
    ads = index(plan.get('ads'), 'ads')
    require(len(ads) == brief['count'], 'ad count differs from brief')
    used = set() if execution_only else {a.get('reason_id') for a in ads.values()}
    require(None not in used and used <= candidates.keys(), 'each ad needs an existing reason_id')
    if fresh:
        require(len(candidates) >= 2 * len(used), 'draft at least twice the selected reasons before choosing')
        require(len({s['type'] for c in candidates.values() for i in c.get('source_ids', []) if (s := sources.get(i))}) >= 3,
                'candidate reasons need at least three recorded source types; name the gap instead of padding')
    if not fresh:
        fields(plan.get('basis'), ('locator', 'decision'), 'non-fresh basis')
    for r in candidates.values():
        fields(r, ('reason', 'decision', 'why'), 'reason')
        require(r['decision'] in ('selected', 'rejected'), 'reason.decision must be selected/rejected')
        evidence(r.get('source_ids'), 'reason')
        persona = r.get('persona')
        fields(persona, ('description',), 'persona')
        evidence(persona.get('source_ids'), 'persona')
        proof = r.get('proof')
        fields(proof, ('description', 'kind', 'supports'), 'proof')
        evidence(proof.get('source_ids'), 'proof')
        require(proof['kind'] in ('product_fact', 'approved_claim', 'demonstration', 'real_quote'), 'unsupported proof kind')
        if r['id'] in used:
            proof_sources = [sources[i] for i in proof['source_ids']]
            if proof['kind'] in ('product_fact', 'demonstration'):
                require(any(s['advertising_use'] in ('plain_fact', 'approved_claim') for s in proof_sources), 'proof needs a usable fact, not an observation or hypothesis')
            elif proof['kind'] == 'approved_claim':
                require(all(s['advertising_use'] == 'approved_claim' for s in proof_sources), 'proof is not an approved claim')
            else:
                require(all(s.get('testimonial_permission') is True for s in proof_sources), 'real quote needs permission and attribution')
            require(r['decision'] == 'selected', 'ad uses a rejected reason')
            gate = r.get('gate')
            require(isinstance(gate, dict), 'selected reason needs the scored concept gate')
            for key in ('promise', 'proof', 'hook', 'message', 'persona'):
                score = gate.get(key)
                fields(score, ('why',), 'gate.' + key)
                require(score.get('pass') is True, 'concept gate failed/missing: ' + key)
        else:
            require(r['decision'] == 'rejected', 'unused reason must record why it was rejected')
    combinations = set()
    for a in ads.values():
        if not execution_only:
            fields(a, ('framework', 'style', 'composition', 'awareness'), 'ad look/stage')
            combo = (a['reason_id'], a['framework'].casefold(), a['style'].casefold())
            require(combo not in combinations, 'same reason/framework/style repeated in the set')
            combinations.add(combo)
        direction = a.get('creative_direction')
        fields(direction, ('product_truth', 'truth_source', 'human_situation', 'situation_basis', 'premise', 'relationship',
                           'scene', 'protected_decision', 'reference_role', 'reference_contribution'), 'creative_direction')
        evidence(a.get('truth_source_ids'), 'product truth')
        require(any(sources[i]['advertising_use'] in ('plain_fact', 'approved_claim') for i in a['truth_source_ids']), 'product truth needs a usable fact, not customer language')
        require(direction['situation_basis'] in ('research', 'creative_hypothesis'), 'label situation basis honestly')
        if direction['situation_basis'] == 'research':
            evidence(a.get('situation_source_ids'), 'researched situation')
        require(type(direction.get('direct_competitor')) is bool, 'declare direct_competitor')
        require(direction['reference_role'] in ('layout', 'mechanism', 'craft'), 'unknown reference role')
        require(not direction['direct_competitor'] or direction['reference_role'] == 'layout', 'direct competitor lends layout only')
        copies = direction.get('exact_copy')
        require(isinstance(copies, list) and all(words(x) for x in copies), 'exact_copy must contain exact lines or []')
        hooks = rows(a.get('hooks'), 'hooks')
        if copies:
            require(3 <= len(hooks) <= 5 if fresh else len(hooks) >= 1, 'fresh ads need 3–5 ranked hook alternatives')
            require(sorted(h.get('rank', 0) for h in hooks) == list(range(1, len(hooks) + 1)), 'hooks need unique contiguous ranks')
            require(len({h.get('text') for h in hooks}) == len(hooks), 'hook alternatives must differ')
            for h in hooks:
                fields(h, ('text', 'formula', 'why'), 'hook')
            require(next(h['text'] for h in hooks if h['rank'] == 1) in copies, 'selected top hook must be exact campaign copy')
        else:
            require(a.get('copy_intent') == 'no_added_text' and not hooks, 'no-text ad must explicitly record no_added_text')
        options = index(a.get('visual_options'), 'visual_options')
        compare_visuals = (fresh or brief['creative_goal'] == 'transformative') and not execution_only and constraint is None
        require(len(options) >= (3 if compare_visuals else 1), 'fresh concepts need competing visual premises unless the user explicitly constrained the execution')
        require(len({v.get('premise') for v in options.values()}) == len(options), 'visual alternatives must have different premises')
        chosen = a.get('selected_visual_id')
        require(chosen in options, 'select a visual option')
        for key, v in options.items():
            fields(v, ('premise', 'relationship', 'why'), 'visual option')
            require(v.get('decision') == ('selected' if key == chosen else 'rejected'), 'record selected/rejected visual decisions')
        require(direction['premise'] == options[chosen]['premise'] and direction['relationship'] == options[chosen]['relationship'],
                'chosen visual does not match creative direction')
        refs = rows(a.get('reference_options'), 'reference_options')
        require(len(refs) >= (3 if fresh else 1), 'record reference comparison (three candidates for a fresh concept)')
        for ref in refs:
            fields(ref, ('template_id', 'advertiser', 'source_id', 'why'), 'reference option')
            require(ref['source_id'] in sources, 'reference source is missing')
            require(ref.get('decision') in ('selected', 'rejected'), 'reference decision missing')
        selected = [r for r in refs if r['decision'] == 'selected']
        require(len(selected) == 1 and selected[0]['template_id'] == a.get('template_id'), 'selected reference mismatch')
        require(len({r['advertiser'].casefold() for r in refs}) >= (3 if fresh else 1), 'fresh reference candidates need three advertisers')
    if not execution_only:
        review = plan.get('selection_review')
        fields(review, ('reviewer', 'context', 'verdict', 'resolution'), 'selection_review')
        require(review['context'] in ('fresh', 'human'), 'independent selection review required; same-agent review cannot clear this gate')
        if review['context'] == 'human':
            fields(review, ('critique_source',), 'human selection review')
        require(review['verdict'] == 'pass' and isinstance(review.get('findings'), list), 'resolve selection review before compose')
    if partial:
        fields(plan.get('coverage_decision'), ('why',), 'coverage_decision')
        require(plan['coverage_decision'].get('choice') == 'proceed_with_limits', 'resolve partial coverage before composing')
    return {'status': 'partial' if partial else 'ready', 'can_compose': True, 'limitations': partial,
            'run_sha256': digest(plan), 'ads': list(ads)}


def match_ad(plan, ad_id, ad):
    result = validate(plan)
    selected = next((a for a in plan['ads'] if a['id'] == ad_id), None)
    require(selected is not None, 'ad_id is not selected in run')
    require(plan['brand_id'] == ad.get('brand_id'), 'run/ad brand mismatch')
    require(selected['creative_direction'] == ad.get('creative_direction'), 'run/ad creative direction drift')
    require(selected['template_id'] == (ad.get('template') or {}).get('id'), 'run/ad template mismatch')
    return result


def quote(plan, ad_id, final, review):
    validate(plan)
    require(final.get('workflow', {}).get('run_sha256') == digest(plan), 'composed run is stale')
    require(final['workflow'].get('ad_id') == ad_id, 'composed ad_id mismatch')
    selected = next((a for a in plan['ads'] if a['id'] == ad_id), None)
    require(selected is not None and final.get('creative_direction') == selected['creative_direction'], 'final creative direction drift')
    require(review.get('final_sha256') == digest(final), 'claims/policy review is missing or stale for these exact prompts/images')
    fields(review, ('reviewed_by', 'reviewed_at'), 'review')
    fields(review.get('claims'), ('basis',), 'claims')
    require(review['claims'].get('verdict') == 'pass', 'claims review blocks quoting')
    policy = review.get('policy')
    fields(policy, ('basis',), 'policy')
    draft = None
    if policy.get('verdict') == 'source_unavailable':
        # A recorded declaration is review evidence, never authorization or a policy pass.
        fields(policy.get('known_rules'), ('basis',), 'policy.known_rules')
        require(policy['known_rules'].get('verdict') == 'pass', 'known policy rules must pass')
        require(policy.get('unresolved_risks') == [], 'unresolved policy/category/rights risks block quoting')
        unavailable = rows(policy.get('unavailable_sources'), 'policy.unavailable_sources')
        require(unavailable, 'record inaccessible current-policy sources')
        for source in unavailable:
            fields(source, ('url', 'reason', 'unchecked_rules'), 'unavailable policy source')
        draft = review.get('unpublished_draft')
        fields(draft, ('authorization_source', 'authorization_quote'), 'unpublished_draft')
        require(draft.get('launch_hold') is True, 'unpublished draft requires a launch hold')
    else:
        require(policy.get('verdict') == 'pass', 'policy review blocks quoting')
    requests = []
    for render in final['renders']:
        request = copy.deepcopy(render['render_spec'])
        require(request.get('brand_id') == plan['brand_id'], 'render brand drift')
        require(request.get('prompt') == render['prompt'] and request.get('image_urls') == render['image_urls'], 'render specification drift')
        require(isinstance(request.get('prompt'), str) and len(request['prompt']) <= 12000, 'render prompt exceeds the tool limit')
        request['dry_run'] = True
        requests.append(request)
    result = {'status': 'quote_ready', 'limitations': validate(plan)['limitations'], 'dry_run_requests': requests}
    if draft is not None:
        result.update(policy_status='not_currently_verified', launch_hold=True,
                      unpublished_draft=copy.deepcopy(draft),
                      checked_policy_rules=copy.deepcopy(policy['known_rules']),
                      unchecked_policy_sources=copy.deepcopy(policy['unavailable_sources']))
        result['limitations'].append('Current policy sources inaccessible: unpublished draft only; launch held')
    return result


def load(path):
    with open(path, encoding='utf-8') as f:
        return json.load(f)


def main(args):
    try:
        if len(args) == 3 and args[1] == 'check':
            result = validate(load(args[2]))
        elif len(args) == 3 and args[1] == 'digest':
            result = {'sha256': digest(load(args[2]))}
        elif len(args) == 6 and args[1] == 'quote':
            result = quote(load(args[2]), args[3], load(args[4]), load(args[5]))
        else:
            raise WorkflowError(__doc__)
        print(json.dumps(result, indent=2, ensure_ascii=False))
        return 0
    except (WorkflowError, ValueError, KeyError, TypeError, StopIteration) as e:
        print(json.dumps({'status': 'blocked', 'can_compose': False, 'reason': str(e)}))
        return 1


if __name__ == '__main__':
    sys.exit(main(sys.argv))

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const {
  APPROVAL_PHRASE,
  GOOSEWORKS_TOOLS,
  prepareDirectLaunch,
  publishDirectLaunch,
  readJson,
  selectLaunchAdapter,
} = require('../tools/meta_marketing_api');
const { getToolFiles } = require('../bin/lib/tool-files');

const ENV = {
  META_MARKETING_ACCESS_TOKEN: 'test-token-never-persist',
  META_AD_ACCOUNT_ID: 'act_123',
  META_PAGE_ID: 'page_1',
};

function basePlan(overrides = {}) {
  const plan = {
    launch_id: 'launch-test-1',
    account_id: 'act_123',
    page_id: 'page_1',
    campaign: {
      name: 'Test traffic campaign',
      objective: 'OUTCOME_TRAFFIC',
      special_ad_categories: [],
    },
    ad_set: {
      name: 'US broad',
      lifetime_budget: 2500,
      start_time: '2026-09-23T09:00:00-07:00',
      end_time: '2026-09-30T09:00:00-07:00',
      optimization_goal: 'LANDING_PAGE_VIEWS',
      billing_event: 'IMPRESSIONS',
      bid_strategy: 'LOWEST_COST_WITHOUT_CAP',
      targeting: { geo_locations: { countries: ['US'] } },
    },
    destination: { url: 'https://example.com/offer' },
    destination_review: {
      status: 'passed',
      rendered: true,
      message_match: true,
      claim_match: true,
      clear_cta: true,
    },
    policy_review: { status: 'passed', notes: [] },
    ads: [
      {
        name: 'Ad A',
        creative: {
          name: 'Creative A',
          message: 'Primary text A',
          headline: 'Headline A',
          description: 'Description A',
          call_to_action: 'LEARN_MORE',
          image_hash: 'hash-a',
        },
      },
      {
        name: 'Ad B',
        creative: {
          name: 'Creative B',
          message: 'Primary text B',
          headline: 'Headline B',
          description: 'Description B',
          call_to_action: 'LEARN_MORE',
          image_hash: 'hash-b',
        },
      },
    ],
  };
  return { ...plan, ...overrides };
}

function response(payload, status = 200, headers = {}) {
  const normalized = Object.fromEntries(
    Object.entries(headers).map(([key, value]) => [key.toLowerCase(), value]),
  );
  return {
    ok: status >= 200 && status < 300,
    status,
    headers: { get: (name) => normalized[String(name).toLowerCase()] || null },
    async json() { return payload; },
    async text() { return typeof payload === 'string' ? payload : JSON.stringify(payload); },
  };
}

function createMetaFixture(options = {}) {
  const calls = [];
  const objects = new Map();
  let creativeCount = 0;
  let adCount = 0;
  let failedAd = false;

  function bodyObject(body) {
    if (!body || typeof body.entries !== 'function') return {};
    return Object.fromEntries(body.entries());
  }

  const fetchImpl = async (urlValue, init = {}) => {
    const url = new URL(String(urlValue));
    const method = init.method || 'GET';
    if (url.hostname === 'example.com') {
      calls.push({ kind: 'destination', method, url: url.toString() });
      return response(
        '<html><body><a href="/signup">Get started</a><script>fbq("init")</script></body></html>',
        200,
        { 'content-type': 'text/html; charset=utf-8' },
      );
    }

    const graphPath = url.pathname.replace(/^\/v\d+\.\d+\//, '');
    const body = bodyObject(init.body);
    calls.push({ kind: 'graph', method, path: graphPath, body });

    if (method === 'GET' && graphPath === 'me/permissions') {
      const permissions = options.permissions || ['ads_read', 'ads_management'];
      return response({ data: permissions.map((permission) => ({ permission, status: 'granted' })) });
    }
    if (method === 'GET' && graphPath === 'act_123') {
      return response({
        id: 'act_123', account_id: '123', name: 'Test account', account_status: 1,
        currency: 'USD', timezone_name: 'America/Los_Angeles',
      });
    }
    if (method === 'GET' && graphPath === 'page_1') {
      return response({ id: 'page_1', name: 'Test Page' });
    }
    if (method === 'GET' && ['act_123/campaigns', 'act_123/adsets', 'act_123/ads'].includes(graphPath)) {
      return response({ data: [] });
    }

    if (method === 'POST' && graphPath === 'act_123/campaigns') {
      objects.set('cmp_1', {
        id: 'cmp_1', name: body.name, status: body.status,
        effective_status: body.status, objective: body.objective,
        special_ad_categories: JSON.parse(body.special_ad_categories),
      });
      return response({ id: 'cmp_1' });
    }
    if (method === 'POST' && graphPath === 'act_123/adsets') {
      objects.set('set_1', {
        id: 'set_1', name: body.name, campaign_id: body.campaign_id,
        status: body.status, effective_status: body.status,
        optimization_goal: body.optimization_goal, billing_event: body.billing_event,
        bid_strategy: body.bid_strategy, daily_budget: body.daily_budget,
        lifetime_budget: body.lifetime_budget, start_time: body.start_time,
        end_time: body.end_time, targeting: JSON.parse(body.targeting),
      });
      return response({ id: 'set_1' });
    }
    if (method === 'POST' && graphPath === 'act_123/adcreatives') {
      creativeCount += 1;
      const id = `creative_${creativeCount}`;
      objects.set(id, {
        id, name: body.name, object_story_spec: JSON.parse(body.object_story_spec),
      });
      return response({ id });
    }
    if (method === 'POST' && graphPath === 'act_123/ads') {
      adCount += 1;
      if (options.failSecondAdOnce && adCount === 2 && !failedAd) {
        failedAd = true;
        return response({ error: { code: 4, message: 'temporary rate limit' } }, 429);
      }
      const id = `ad_${adCount}`;
      const creative = JSON.parse(body.creative);
      objects.set(id, {
        id, name: body.name, adset_id: body.adset_id, status: body.status,
        effective_status: body.status, creative: { id: creative.creative_id },
      });
      return response({ id });
    }
    if (method === 'GET' && objects.has(graphPath)) return response(objects.get(graphPath));

    throw new Error(`Unhandled fixture request: ${method} ${graphPath}`);
  };

  return { calls, fetchImpl };
}

function tempState(name) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), `meta-launch-${name}-`));
  return { root, statePath: path.join(root, 'state.json') };
}

const resolver = async () => [{ address: '93.184.216.34', family: 4 }];

test('routes to the GooseWorks tool path when its complete surface is available', () => {
  assert.equal(
    selectLaunchAdapter({ availableTools: GOOSEWORKS_TOOLS, env: ENV }),
    'gooseworks',
  );
});

test('routes to the direct Meta-token path without GooseWorks tools', () => {
  assert.equal(selectLaunchAdapter({ availableTools: [], env: ENV }), 'direct_meta');
});

test('preserves planning-only fallback when no write adapter is available', () => {
  assert.equal(selectLaunchAdapter({ availableTools: [], env: {} }), 'planning_only');
});

test('fails closed on missing ads_management permission before any Meta write', async () => {
  const fixture = createMetaFixture({ permissions: ['ads_read'] });
  const temp = tempState('permissions');
  await assert.rejects(
    prepareDirectLaunch(basePlan(), {
      statePath: temp.statePath, env: ENV, fetchImpl: fixture.fetchImpl, resolver,
    }),
    (error) => error.code === 'missing_permission',
  );
  assert.equal(fixture.calls.filter((call) => call.kind === 'graph' && call.method === 'POST').length, 0);
  assert.equal(fs.existsSync(temp.statePath), false);
  fs.rmSync(temp.root, { recursive: true, force: true });
});

test('preparation and missing approval perform no Meta writes', async () => {
  const fixture = createMetaFixture();
  const temp = tempState('approval');
  const plan = basePlan();
  await prepareDirectLaunch(plan, {
    statePath: temp.statePath, env: ENV, fetchImpl: fixture.fetchImpl, resolver,
  });
  assert.equal(fixture.calls.filter((call) => call.kind === 'graph' && call.method === 'POST').length, 0);
  await assert.rejects(
    publishDirectLaunch(plan, {
      statePath: temp.statePath, env: ENV, fetchImpl: fixture.fetchImpl,
      confirmation: 'yes', confirmedBy: 'user',
    }),
    (error) => error.code === 'approval_required',
  );
  assert.equal(fixture.calls.filter((call) => call.kind === 'graph' && call.method === 'POST').length, 0);
  fs.rmSync(temp.root, { recursive: true, force: true });
});

test('creates campaign, ad set, and ads paused and verifies them through readback', async () => {
  const fixture = createMetaFixture();
  const temp = tempState('paused');
  const plan = basePlan();
  await prepareDirectLaunch(plan, {
    statePath: temp.statePath, env: ENV, fetchImpl: fixture.fetchImpl, resolver,
  });
  const state = await publishDirectLaunch(plan, {
    statePath: temp.statePath, env: ENV, fetchImpl: fixture.fetchImpl,
    confirmation: APPROVAL_PHRASE, confirmedBy: 'test-human',
  });
  assert.equal(state.status, 'completed');
  assert.equal(state.readback.campaign.status, 'PAUSED');
  assert.equal(state.readback.ad_set.status, 'PAUSED');
  assert.equal(state.readback.ads.length, 2);
  assert.ok(state.readback.ads.every((entry) => entry.ad.status === 'PAUSED'));
  const writeBodies = fixture.calls
    .filter((call) => call.kind === 'graph' && call.method === 'POST')
    .filter((call) => /\/(campaigns|adsets|ads)$/.test(`/${call.path}`));
  assert.ok(writeBodies.every((call) => call.body.status === 'PAUSED'));
  assert.equal(JSON.stringify(readJson(temp.statePath)).includes(ENV.META_MARKETING_ACCESS_TOKEN), false);
  fs.rmSync(temp.root, { recursive: true, force: true });
});

test('persists partial IDs and resumes without recreating completed objects', async () => {
  const fixture = createMetaFixture({ failSecondAdOnce: true });
  const temp = tempState('resume');
  const plan = basePlan();
  await prepareDirectLaunch(plan, {
    statePath: temp.statePath, env: ENV, fetchImpl: fixture.fetchImpl, resolver,
  });
  await assert.rejects(
    publishDirectLaunch(plan, {
      statePath: temp.statePath, env: ENV, fetchImpl: fixture.fetchImpl,
      confirmation: APPROVAL_PHRASE, confirmedBy: 'test-human',
    }),
    (error) => error.code === 'rate_limited',
  );
  const partial = readJson(temp.statePath);
  assert.equal(partial.status, 'partial');
  assert.equal(partial.objects.campaign_id, 'cmp_1');
  assert.equal(partial.objects.ad_set_id, 'set_1');
  assert.equal(partial.objects.ads[0].ad_id, 'ad_1');
  assert.ok(partial.objects.ads[1].creative_id);
  assert.equal(partial.objects.ads[1].ad_id, null);

  const resumed = await publishDirectLaunch(plan, {
    statePath: temp.statePath, env: ENV, fetchImpl: fixture.fetchImpl,
    confirmation: APPROVAL_PHRASE, confirmedBy: 'test-human',
  });
  assert.equal(resumed.status, 'completed');
  assert.equal(
    fixture.calls.filter((call) => call.method === 'POST' && call.path === 'act_123/campaigns').length,
    1,
  );
  assert.equal(
    fixture.calls.filter((call) => call.method === 'POST' && call.path === 'act_123/adsets').length,
    1,
  );
  assert.equal(
    fixture.calls.filter((call) => call.method === 'POST' && call.path === 'act_123/adcreatives').length,
    2,
  );
  fs.rmSync(temp.root, { recursive: true, force: true });
});

test('blocks policy and destination failures before Meta writes', async () => {
  const fixture = createMetaFixture();
  const policyTemp = tempState('policy');
  await assert.rejects(
    prepareDirectLaunch(basePlan({ policy_review: { status: 'blocked' } }), {
      statePath: policyTemp.statePath, env: ENV, fetchImpl: fixture.fetchImpl, resolver,
    }),
    (error) => error.code === 'policy_blocked',
  );
  const destinationTemp = tempState('destination');
  await assert.rejects(
    prepareDirectLaunch(basePlan({ destination: { url: 'http://example.com/offer' } }), {
      statePath: destinationTemp.statePath, env: ENV, fetchImpl: fixture.fetchImpl, resolver,
    }),
    (error) => error.code === 'destination_blocked',
  );
  assert.equal(fixture.calls.filter((call) => call.kind === 'graph' && call.method === 'POST').length, 0);
  fs.rmSync(policyTemp.root, { recursive: true, force: true });
  fs.rmSync(destinationTemp.root, { recursive: true, force: true });
});

test('skill metadata resolves to an adapter file that installation can copy', () => {
  const metaPath = path.resolve(
    __dirname,
    '../skills/ads/composites/launch-meta-ad-campaign/skill.meta.json',
  );
  const meta = JSON.parse(fs.readFileSync(metaPath, 'utf8'));
  assert.deepEqual(meta.requires_tools, ['meta_marketing_api']);
  assert.deepEqual(getToolFiles('meta_marketing_api'), ['tools/meta_marketing_api.js']);
  assert.equal(fs.existsSync(path.resolve(__dirname, '../tools/meta_marketing_api.js')), true);
});

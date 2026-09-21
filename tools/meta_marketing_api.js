#!/usr/bin/env node
'use strict';

/**
 * Bundled Meta Marketing API adapter for launch-meta-ad-campaign.
 *
 * The adapter deliberately has no activation operation. Campaigns, ad sets,
 * and ads are always created PAUSED. It stores only non-secret recovery state;
 * the access token is read from the environment and is never written or logged.
 */

const crypto = require('node:crypto');
const dns = require('node:dns').promises;
const fs = require('node:fs');
const net = require('node:net');
const path = require('node:path');

const GRAPH_VERSION = process.env.META_GRAPH_API_VERSION || 'v25.0';
const GRAPH_BASE = `https://graph.facebook.com/${GRAPH_VERSION}`;
const APPROVAL_PHRASE = 'APPROVE PAUSED META CAMPAIGN';
const DEFAULT_STATE_DIR = '.meta-launches';

const GOOSEWORKS_TOOLS = Object.freeze([
  'campaign_read',
  'ads_creative_read',
  'meta_status_get',
  'list_meta_entities',
  'get_meta_ad_context',
  'prepare_meta_ad_push',
  'get_meta_push_status',
]);

class AdapterError extends Error {
  constructor(code, message, options = {}) {
    super(message);
    this.name = 'AdapterError';
    this.code = code;
    this.retryable = Boolean(options.retryable);
    this.details = options.details || null;
    this.state = options.state || null;
  }
}

function nowIso() {
  return new Date().toISOString();
}

function normalizeAccountId(value) {
  const id = String(value || '').trim();
  if (!id) return '';
  return id.startsWith('act_') ? id : `act_${id}`;
}

function selectLaunchAdapter({ availableTools = [], env = process.env } = {}) {
  const tools = new Set(availableTools);
  if (GOOSEWORKS_TOOLS.every((name) => tools.has(name))) return 'gooseworks';
  const token = env.META_MARKETING_ACCESS_TOKEN || env.META_ACCESS_TOKEN;
  if (token && env.META_AD_ACCOUNT_ID) return 'direct_meta';
  return 'planning_only';
}

function stableValue(value) {
  if (Array.isArray(value)) return value.map(stableValue);
  if (!value || typeof value !== 'object') return value;
  return Object.fromEntries(
    Object.keys(value)
      .sort()
      .filter((key) => key !== 'approval')
      .map((key) => [key, stableValue(value[key])]),
  );
}

function planDigest(plan) {
  return crypto
    .createHash('sha256')
    .update(JSON.stringify(stableValue(plan)))
    .digest('hex');
}

function requireString(value, label) {
  if (typeof value !== 'string' || !value.trim()) {
    throw new AdapterError('invalid_plan', `${label} is required.`);
  }
  return value.trim();
}

function requireDate(value, label) {
  const raw = requireString(value, label);
  const parsed = new Date(raw);
  if (!Number.isFinite(parsed.getTime())) {
    throw new AdapterError('invalid_plan', `${label} must be an ISO-8601 date-time.`);
  }
  return parsed;
}

function validatePlan(plan) {
  if (!plan || typeof plan !== 'object' || Array.isArray(plan)) {
    throw new AdapterError('invalid_plan', 'The launch plan must be a JSON object.');
  }
  requireString(plan.launch_id, 'launch_id');
  requireString(plan.account_id, 'account_id');
  requireString(plan.page_id, 'page_id');
  requireString(plan.campaign?.name, 'campaign.name');
  if (plan.campaign?.objective !== 'OUTCOME_TRAFFIC') {
    throw new AdapterError(
      'unsupported_plan',
      'The bundled direct adapter currently writes only OUTCOME_TRAFFIC campaigns. Keep other objectives in planning-only mode.',
    );
  }
  const specialCategories = plan.campaign?.special_ad_categories || [];
  if (!Array.isArray(specialCategories) || specialCategories.length > 0) {
    throw new AdapterError(
      'unsupported_plan',
      'The bundled direct adapter does not write special-ad-category campaigns.',
    );
  }

  const adSet = plan.ad_set;
  requireString(adSet?.name, 'ad_set.name');
  requireString(adSet?.optimization_goal, 'ad_set.optimization_goal');
  requireString(adSet?.billing_event, 'ad_set.billing_event');
  requireString(adSet?.bid_strategy, 'ad_set.bid_strategy');
  const hasDaily = Number.isInteger(adSet?.daily_budget) && adSet.daily_budget > 0;
  const hasLifetime = Number.isInteger(adSet?.lifetime_budget) && adSet.lifetime_budget > 0;
  if (hasDaily === hasLifetime) {
    throw new AdapterError(
      'invalid_plan',
      'ad_set needs exactly one positive integer daily_budget or lifetime_budget in account minor units.',
    );
  }
  const start = requireDate(adSet.start_time, 'ad_set.start_time');
  const end = adSet.end_time ? requireDate(adSet.end_time, 'ad_set.end_time') : null;
  if (hasLifetime && !end) {
    throw new AdapterError('invalid_plan', 'A lifetime budget requires ad_set.end_time.');
  }
  if (end && end <= start) {
    throw new AdapterError('invalid_plan', 'ad_set.end_time must be after start_time.');
  }
  const countries = adSet?.targeting?.geo_locations?.countries;
  if (!Array.isArray(countries) || countries.length === 0) {
    throw new AdapterError(
      'invalid_plan',
      'ad_set.targeting.geo_locations.countries must contain at least one user-selected country.',
    );
  }

  requireString(plan.destination?.url, 'destination.url');
  const destinationReview = plan.destination_review;
  if (
    destinationReview?.status !== 'passed' ||
    destinationReview?.rendered !== true ||
    destinationReview?.message_match !== true ||
    destinationReview?.claim_match !== true ||
    destinationReview?.clear_cta !== true
  ) {
    throw new AdapterError(
      'destination_blocked',
      'Destination review must be passed and confirm a rendered page, message match, claim match, and clear CTA before preparation.',
    );
  }
  if (plan.policy_review?.status !== 'passed') {
    throw new AdapterError(
      'policy_blocked',
      'Meta policy review must pass before this plan can be prepared.',
    );
  }

  if (!Array.isArray(plan.ads) || plan.ads.length === 0) {
    throw new AdapterError('invalid_plan', 'The plan needs at least one ad.');
  }
  for (const [index, ad] of plan.ads.entries()) {
    requireString(ad?.name, `ads[${index}].name`);
    const creative = ad?.creative;
    if (!creative || typeof creative !== 'object') {
      throw new AdapterError('invalid_plan', `ads[${index}].creative is required.`);
    }
    if (creative.meta_creative_id) continue;
    requireString(creative.name, `ads[${index}].creative.name`);
    requireString(creative.message, `ads[${index}].creative.message`);
    const assetCount = [creative.image_hash, creative.image_path, creative.video_id].filter(Boolean).length;
    if (assetCount !== 1) {
      throw new AdapterError(
        'invalid_plan',
        `ads[${index}].creative needs exactly one image_hash, image_path, or video_id.`,
      );
    }
  }
  return plan;
}

function ipv4Parts(address) {
  if (net.isIP(address) !== 4) return null;
  return address.split('.').map((part) => Number(part));
}

function isPrivateIp(address) {
  const normalized = String(address || '').toLowerCase().split('%')[0];
  const v4 = ipv4Parts(normalized);
  if (v4) {
    const [a, b] = v4;
    return (
      a === 0 ||
      a === 10 ||
      a === 127 ||
      (a === 169 && b === 254) ||
      (a === 172 && b >= 16 && b <= 31) ||
      (a === 192 && b === 168) ||
      (a === 100 && b >= 64 && b <= 127) ||
      a >= 224
    );
  }
  if (net.isIP(normalized) === 6) {
    if (normalized === '::' || normalized === '::1') return true;
    if (normalized.startsWith('fc') || normalized.startsWith('fd')) return true;
    if (/^fe[89ab]/.test(normalized)) return true;
    if (normalized.startsWith('::ffff:')) {
      return isPrivateIp(normalized.slice('::ffff:'.length));
    }
  }
  return false;
}

async function assertPublicHttpsUrl(rawUrl, resolver = dns.lookup) {
  let url;
  try {
    url = new URL(rawUrl);
  } catch {
    throw new AdapterError('destination_blocked', 'Destination URL is invalid.');
  }
  if (url.protocol !== 'https:') {
    throw new AdapterError('destination_blocked', 'Destination URL must use HTTPS.');
  }
  if (url.username || url.password) {
    throw new AdapterError('destination_blocked', 'Destination URL cannot contain credentials.');
  }
  const host = url.hostname.toLowerCase().replace(/\.$/, '');
  if (!host || host === 'localhost' || host.endsWith('.localhost') || host.endsWith('.local')) {
    throw new AdapterError('destination_blocked', 'Destination URL cannot use a local host.');
  }
  if (net.isIP(host)) {
    if (isPrivateIp(host)) {
      throw new AdapterError('destination_blocked', 'Destination URL cannot use a private address.');
    }
    return url;
  }
  let resolved;
  try {
    resolved = await resolver(host, { all: true, verbatim: true });
  } catch {
    throw new AdapterError('destination_blocked', 'Destination hostname could not be resolved.');
  }
  const rows = Array.isArray(resolved) ? resolved : [resolved];
  if (rows.length === 0 || rows.some((row) => !row?.address || isPrivateIp(row.address))) {
    throw new AdapterError('destination_blocked', 'Destination hostname resolves to an unsafe address.');
  }
  return url;
}

function comparableHost(value) {
  return value.toLowerCase().replace(/^www\./, '').replace(/\.$/, '');
}

async function preflightDestination(rawUrl, options = {}) {
  const fetchImpl = options.fetchImpl || globalThis.fetch;
  const resolver = options.resolver || dns.lookup;
  if (typeof fetchImpl !== 'function') {
    throw new AdapterError('upstream_unavailable', 'This Node runtime has no fetch implementation.');
  }
  const requested = await assertPublicHttpsUrl(rawUrl, resolver);
  let current = requested;
  let response;
  const redirects = [];
  for (let index = 0; index <= 5; index += 1) {
    try {
      response = await fetchImpl(current, {
        method: 'GET',
        redirect: 'manual',
        headers: { 'user-agent': 'launch-meta-ad-campaign/1.0' },
      });
    } catch {
      throw new AdapterError('destination_blocked', 'Destination page could not be reached.');
    }
    if (response.status >= 300 && response.status < 400) {
      const location = response.headers?.get?.('location');
      if (!location) {
        throw new AdapterError('destination_blocked', 'Destination returned an incomplete redirect.');
      }
      if (index === 5) {
        throw new AdapterError('destination_blocked', 'Destination redirected too many times.');
      }
      const next = await assertPublicHttpsUrl(new URL(location, current).toString(), resolver);
      redirects.push(next.toString());
      current = next;
      continue;
    }
    break;
  }
  if (!response || !response.ok) {
    throw new AdapterError(
      'destination_blocked',
      `Destination returned HTTP ${response?.status || 'unknown'}.`,
    );
  }
  if (comparableHost(requested.hostname) !== comparableHost(current.hostname)) {
    throw new AdapterError(
      'destination_blocked',
      'Destination redirects to a different host than the approved URL.',
    );
  }
  const contentType = response.headers?.get?.('content-type') || '';
  let html = '';
  try {
    html = String(await response.text()).slice(0, 2_000_000);
  } catch {
    throw new AdapterError('destination_blocked', 'Destination body could not be read.');
  }
  const lower = html.toLowerCase();
  const ctaDetected = /(get started|learn more|sign up|buy now|book|contact|download|try|shop now)/i.test(html);
  const metaPixelDetected = lower.includes('connect.facebook.net') || lower.includes('fbq(');
  const warnings = [];
  if (contentType && !contentType.toLowerCase().includes('text/html')) {
    warnings.push(`Destination content type is ${contentType}, not HTML.`);
  }
  if (!ctaDetected) warnings.push('No obvious CTA text was detected in the fetched HTML.');
  if (!metaPixelDetected) warnings.push('No Meta Pixel marker was detected in the fetched HTML.');
  return {
    status: 'passed',
    requested_url: requested.toString(),
    final_url: current.toString(),
    redirects,
    http_status: response.status,
    cta_detected: ctaDetected,
    meta_pixel_detected: metaPixelDetected,
    warnings,
    checked_at: nowIso(),
  };
}

function graphError(payload, status, token) {
  const error = payload?.error || {};
  const code = error.code;
  const subcode = error.error_subcode;
  let kind = 'meta_rejected';
  let retryable = false;
  let summary = 'Meta rejected the request.';
  if (code === 190) {
    kind = 'invalid_token';
    summary = 'The Meta access token is invalid or expired.';
  } else if (code === 10 || code === 200 || code === 299 || subcode === 33) {
    kind = 'missing_permission';
    summary = 'The token lacks permission for this Meta object or ad account.';
  } else if (code === 17 || code === 4 || code === 32 || status === 429) {
    kind = 'rate_limited';
    retryable = true;
    summary = 'Meta is rate limiting this account.';
  } else if (status >= 500) {
    kind = 'upstream_unavailable';
    retryable = true;
    summary = 'Meta is temporarily unavailable.';
  }
  const rawDetail = error.error_user_msg || error.error_user_title || error.message || '';
  const detail = token && String(rawDetail).includes(token) ? '' : String(rawDetail).slice(0, 400);
  return new AdapterError(kind, detail ? `${summary} Meta said: ${detail}` : summary, { retryable });
}

class MetaGraphClient {
  constructor({ token, fetchImpl = globalThis.fetch, graphBase = GRAPH_BASE }) {
    this.token = requireString(token, 'Meta access token');
    this.fetchImpl = fetchImpl;
    this.graphBase = graphBase.replace(/\/$/, '');
    if (typeof fetchImpl !== 'function') {
      throw new AdapterError('upstream_unavailable', 'This Node runtime has no fetch implementation.');
    }
  }

  async request(method, graphPath, params = {}) {
    const cleanPath = String(graphPath).replace(/^\//, '');
    let url = `${this.graphBase}/${cleanPath}`;
    const init = {
      method,
      headers: { Authorization: `Bearer ${this.token}` },
    };
    if (method === 'GET') {
      const query = new URLSearchParams();
      for (const [key, value] of Object.entries(params)) {
        if (value !== undefined && value !== null) query.set(key, String(value));
      }
      const suffix = query.toString();
      if (suffix) url += `?${suffix}`;
    } else if (params instanceof FormData) {
      init.body = params;
    } else {
      const body = new URLSearchParams();
      for (const [key, value] of Object.entries(params)) {
        if (value !== undefined && value !== null) body.set(key, String(value));
      }
      init.body = body;
      init.headers['content-type'] = 'application/x-www-form-urlencoded';
    }
    let response;
    try {
      response = await this.fetchImpl(url, init);
    } catch {
      throw new AdapterError('upstream_unavailable', 'Meta could not be reached.', { retryable: true });
    }
    let payload = {};
    try {
      payload = await response.json();
    } catch {
      payload = {};
    }
    if (!response.ok || payload.error) throw graphError(payload, response.status, this.token);
    return payload;
  }

  get(graphPath, params) {
    return this.request('GET', graphPath, params);
  }

  post(graphPath, params) {
    return this.request('POST', graphPath, params);
  }

  async requireId(payload, what) {
    const id = payload?.id || payload?.hash || payload?.video_id;
    if (typeof id !== 'string' || !id) {
      throw new AdapterError('invalid_response', `Meta accepted the ${what} but returned no ID.`);
    }
    return id;
  }

  async validateAccess(accountId, pageId) {
    const permissionsPayload = await this.get('me/permissions', {
      fields: 'permission,status',
      limit: 200,
    });
    const permissions = (Array.isArray(permissionsPayload.data) ? permissionsPayload.data : [])
      .filter((row) => row?.status === 'granted' && typeof row?.permission === 'string')
      .map((row) => row.permission);
    if (!permissions.includes('ads_management')) {
      throw new AdapterError(
        'missing_permission',
        'The Meta token needs the ads_management permission before this adapter can write.',
      );
    }
    const account = await this.get(normalizeAccountId(accountId), {
      fields: 'id,account_id,name,account_status,currency,timezone_name,business',
    });
    if (!account?.id) {
      throw new AdapterError('inaccessible_account', 'The ad account is not accessible with this token.');
    }
    if (Number.isInteger(account.account_status) && account.account_status !== 1) {
      throw new AdapterError(
        'inaccessible_account',
        `The ad account is not active (account_status ${account.account_status}).`,
      );
    }
    const page = await this.get(pageId, {
      fields: 'id,name,instagram_business_account{id}',
    });
    if (!page?.id || String(page.id) !== String(pageId)) {
      throw new AdapterError('missing_permission', 'The token cannot access the selected Facebook Page.');
    }
    return { permissions, account, page };
  }

  async inspectExisting(accountId) {
    const account = normalizeAccountId(accountId);
    const [campaigns, adSets, ads] = await Promise.all([
      this.get(`${account}/campaigns`, {
        fields: 'id,name,status,effective_status,objective,stop_time,updated_time',
        limit: 100,
      }),
      this.get(`${account}/adsets`, {
        fields: 'id,name,campaign_id,status,effective_status,optimization_goal,billing_event,bid_strategy,daily_budget,lifetime_budget,start_time,end_time,targeting,updated_time',
        limit: 100,
      }),
      this.get(`${account}/ads`, {
        fields: 'id,name,adset_id,status,effective_status,creative{id,name},updated_time',
        limit: 100,
      }),
    ]);
    return {
      campaigns: Array.isArray(campaigns.data) ? campaigns.data : [],
      ad_sets: Array.isArray(adSets.data) ? adSets.data : [],
      ads: Array.isArray(ads.data) ? ads.data : [],
      inspected_at: nowIso(),
    };
  }

  async createCampaign(accountId, campaign) {
    return this.requireId(
      await this.post(`${normalizeAccountId(accountId)}/campaigns`, {
        name: campaign.name,
        objective: campaign.objective,
        special_ad_categories: JSON.stringify(campaign.special_ad_categories || []),
        status: 'PAUSED',
      }),
      'campaign',
    );
  }

  async createAdSet(accountId, campaignId, adSet) {
    return this.requireId(
      await this.post(`${normalizeAccountId(accountId)}/adsets`, {
        name: adSet.name,
        campaign_id: campaignId,
        optimization_goal: adSet.optimization_goal,
        billing_event: adSet.billing_event,
        bid_strategy: adSet.bid_strategy,
        daily_budget: adSet.daily_budget,
        lifetime_budget: adSet.lifetime_budget,
        start_time: adSet.start_time,
        end_time: adSet.end_time,
        targeting: JSON.stringify(adSet.targeting),
        status: 'PAUSED',
      }),
      'ad set',
    );
  }

  async uploadImage(accountId, imagePath) {
    const bytes = fs.readFileSync(imagePath);
    const form = new FormData();
    form.append('filename', new Blob([bytes]), path.basename(imagePath));
    const payload = await this.post(`${normalizeAccountId(accountId)}/adimages`, form);
    const image = payload?.images && Object.values(payload.images)[0];
    if (!image?.hash) {
      throw new AdapterError('invalid_response', 'Meta accepted the image but returned no image hash.');
    }
    return image.hash;
  }

  async createCreative(accountId, pageId, destinationUrl, creative, imageHash) {
    const cta = {
      type: creative.call_to_action || 'LEARN_MORE',
      value: { link: destinationUrl },
    };
    const objectStorySpec = { page_id: pageId };
    if (creative.instagram_actor_id) {
      objectStorySpec.instagram_actor_id = creative.instagram_actor_id;
    }
    if (creative.video_id) {
      objectStorySpec.video_data = {
        video_id: creative.video_id,
        message: creative.message,
        title: creative.headline,
        link_description: creative.description,
        call_to_action: cta,
        ...(creative.video_thumbnail_url ? { image_url: creative.video_thumbnail_url } : {}),
      };
    } else {
      objectStorySpec.link_data = {
        image_hash: imageHash,
        link: destinationUrl,
        message: creative.message,
        name: creative.headline,
        description: creative.description,
        call_to_action: cta,
      };
    }
    return this.requireId(
      await this.post(`${normalizeAccountId(accountId)}/adcreatives`, {
        name: creative.name,
        object_story_spec: JSON.stringify(objectStorySpec),
      }),
      'ad creative',
    );
  }

  async createAd(accountId, adSetId, creativeId, name) {
    return this.requireId(
      await this.post(`${normalizeAccountId(accountId)}/ads`, {
        name,
        adset_id: adSetId,
        creative: JSON.stringify({ creative_id: creativeId }),
        status: 'PAUSED',
      }),
      'ad',
    );
  }

  readObject(objectId, fields) {
    return this.get(objectId, { fields: fields.join(',') });
  }
}

function resolveCredentials(plan, env = process.env) {
  const token = env.META_MARKETING_ACCESS_TOKEN || env.META_ACCESS_TOKEN;
  if (!token) {
    throw new AdapterError(
      'missing_token',
      'Set META_MARKETING_ACCESS_TOKEN (or META_ACCESS_TOKEN) to use the direct adapter.',
    );
  }
  const planAccount = normalizeAccountId(plan.account_id);
  const envAccount = normalizeAccountId(env.META_AD_ACCOUNT_ID);
  if (envAccount && envAccount !== planAccount) {
    throw new AdapterError(
      'account_mismatch',
      'The plan account does not match META_AD_ACCOUNT_ID. Refusing to write to either account.',
    );
  }
  if (env.META_PAGE_ID && String(env.META_PAGE_ID) !== String(plan.page_id)) {
    throw new AdapterError(
      'page_mismatch',
      'The plan Page does not match META_PAGE_ID. Refusing to write.',
    );
  }
  return { token, accountId: planAccount, pageId: String(plan.page_id) };
}

function defaultStatePath(plan) {
  return path.join(process.cwd(), DEFAULT_STATE_DIR, `${plan.launch_id}.json`);
}

function writeJsonAtomic(filePath, value) {
  const absolute = path.resolve(filePath);
  fs.mkdirSync(path.dirname(absolute), { recursive: true });
  const temporary = `${absolute}.tmp-${process.pid}-${crypto.randomBytes(4).toString('hex')}`;
  fs.writeFileSync(temporary, `${JSON.stringify(value, null, 2)}\n`, { mode: 0o600 });
  fs.renameSync(temporary, absolute);
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function safeFailure(error) {
  if (error instanceof AdapterError) {
    return { code: error.code, message: error.message, retryable: error.retryable };
  }
  return {
    code: 'unexpected_error',
    message: error instanceof Error ? error.message : String(error),
    retryable: false,
  };
}

function stateHasCreatedObjects(state) {
  if (state?.objects?.campaign_id || state?.objects?.ad_set_id) return true;
  return (state?.objects?.ads || []).some((item) => item?.creative_id || item?.ad_id);
}

async function prepareDirectLaunch(plan, options = {}) {
  validatePlan(plan);
  const env = options.env || process.env;
  const credentials = resolveCredentials(plan, env);
  const graph = options.graphClient || new MetaGraphClient({
    token: credentials.token,
    fetchImpl: options.fetchImpl,
    graphBase: options.graphBase,
  });
  const destinationPreflight = await preflightDestination(plan.destination.url, {
    fetchImpl: options.destinationFetchImpl || options.fetchImpl,
    resolver: options.resolver,
  });
  const access = await graph.validateAccess(credentials.accountId, credentials.pageId);
  const existing = await graph.inspectExisting(credentials.accountId);
  const state = {
    schema_version: 1,
    adapter: 'direct_meta',
    launch_id: plan.launch_id,
    plan_digest: planDigest(plan),
    status: 'awaiting_approval',
    prepared_at: nowIso(),
    updated_at: nowIso(),
    account: access.account,
    page: access.page,
    granted_permissions: access.permissions,
    existing_context: existing,
    destination_preflight: destinationPreflight,
    approval: null,
    objects: { campaign_id: null, ad_set_id: null, ads: [] },
    readback: null,
    failure: null,
    next_action: 'Ask the human to approve this exact paused plan immediately before publishing.',
  };
  writeJsonAtomic(options.statePath || defaultStatePath(plan), state);
  return state;
}

function assertPaused(object, label) {
  const status = String(object?.status || object?.effective_status || '').toUpperCase();
  if (status !== 'PAUSED') {
    throw new AdapterError(
      'readback_mismatch',
      `${label} readback did not prove PAUSED status (received ${status || 'no status'}).`,
    );
  }
}

function assertEqual(actual, expected, label) {
  if (actual === undefined || actual === null || String(actual) !== String(expected)) {
    throw new AdapterError(
      'readback_mismatch',
      `${label} readback did not match the approved plan.`,
    );
  }
}

function assertDateEqual(actual, expected, label) {
  const actualTime = new Date(actual).getTime();
  const expectedTime = new Date(expected).getTime();
  if (!Number.isFinite(actualTime) || actualTime !== expectedTime) {
    throw new AdapterError(
      'readback_mismatch',
      `${label} readback did not match the approved plan.`,
    );
  }
}

function comparisonValue(value) {
  if (Array.isArray(value)) {
    const normalized = value.map(comparisonValue);
    return normalized.every((item) => ['string', 'number', 'boolean'].includes(typeof item))
      ? normalized.sort()
      : normalized;
  }
  if (!value || typeof value !== 'object') return value;
  return Object.fromEntries(
    Object.keys(value).sort().map((key) => [key, comparisonValue(value[key])]),
  );
}

function assertJsonEqual(actual, expected, label) {
  if (JSON.stringify(comparisonValue(actual)) !== JSON.stringify(comparisonValue(expected))) {
    throw new AdapterError(
      'readback_mismatch',
      `${label} readback did not match the approved plan.`,
    );
  }
}

function verifyCreativeReadback(creative, creativePlan, plan, label) {
  if (!creative?.id) {
    throw new AdapterError('readback_mismatch', `${label} readback returned no creative ID.`);
  }
  if (creativePlan.name) assertEqual(creative.name, creativePlan.name, `${label} name`);
  const story = creative.object_story_spec;
  if (!story || typeof story !== 'object') {
    throw new AdapterError(
      'readback_mismatch',
      `${label} readback returned no object_story_spec to verify Page and destination.`,
    );
  }
  assertEqual(story.page_id, plan.page_id, `${label} Page`);
  if (creativePlan.instagram_actor_id) {
    assertEqual(story.instagram_actor_id, creativePlan.instagram_actor_id, `${label} Instagram identity`);
  }
  const data = story.link_data || story.video_data;
  if (!data || typeof data !== 'object') {
    throw new AdapterError('readback_mismatch', `${label} readback returned no link or video data.`);
  }
  const destination = data.link || data.call_to_action?.value?.link;
  assertEqual(destination, plan.destination.url, `${label} destination`);
  if (creativePlan.message) assertEqual(data.message, creativePlan.message, `${label} message`);
  if (creativePlan.headline) {
    assertEqual(data.name || data.title, creativePlan.headline, `${label} headline`);
  }
  if (creativePlan.description) {
    assertEqual(
      data.description || data.link_description,
      creativePlan.description,
      `${label} description`,
    );
  }
  if (!creativePlan.meta_creative_id || creativePlan.call_to_action) {
    assertEqual(
      data.call_to_action?.type,
      creativePlan.call_to_action || 'LEARN_MORE',
      `${label} CTA`,
    );
  }
  if (creativePlan.image_hash) assertEqual(data.image_hash, creativePlan.image_hash, `${label} image`);
  if (creativePlan.video_id) assertEqual(data.video_id, creativePlan.video_id, `${label} video`);
}

async function verifyRecoveryState(graph, plan, state) {
  if (state.objects.campaign_id) {
    const campaign = await graph.readObject(state.objects.campaign_id, [
      'id', 'name', 'status', 'effective_status', 'objective',
    ]);
    assertPaused(campaign, 'Recovered campaign');
    assertEqual(campaign.name, plan.campaign.name, 'Recovered campaign name');
    assertEqual(campaign.objective, plan.campaign.objective, 'Recovered campaign objective');
  }
  if (state.objects.ad_set_id) {
    const adSet = await graph.readObject(state.objects.ad_set_id, [
      'id', 'name', 'campaign_id', 'status', 'effective_status',
    ]);
    assertPaused(adSet, 'Recovered ad set');
    assertEqual(adSet.name, plan.ad_set.name, 'Recovered ad set name');
    assertEqual(adSet.campaign_id, state.objects.campaign_id, 'Recovered ad set campaign');
  }
  for (const [index, object] of (state.objects.ads || []).entries()) {
    if (!object?.ad_id) continue;
    const ad = await graph.readObject(object.ad_id, [
      'id', 'name', 'adset_id', 'status', 'effective_status', 'creative{id}',
    ]);
    assertPaused(ad, `Recovered ad ${index + 1}`);
    assertEqual(ad.name, plan.ads[index].name, `Recovered ad ${index + 1} name`);
    assertEqual(ad.adset_id, state.objects.ad_set_id, `Recovered ad ${index + 1} ad set`);
    assertEqual(ad.creative?.id, object.creative_id, `Recovered ad ${index + 1} creative`);
  }
}

async function readBackLaunch(graph, plan, state) {
  const campaign = await graph.readObject(state.objects.campaign_id, [
    'id', 'name', 'status', 'effective_status', 'objective', 'special_ad_categories',
  ]);
  assertPaused(campaign, 'Campaign');
  assertEqual(campaign.name, plan.campaign.name, 'Campaign name');
  assertEqual(campaign.objective, plan.campaign.objective, 'Campaign objective');
  assertJsonEqual(
    campaign.special_ad_categories || [],
    plan.campaign.special_ad_categories || [],
    'Campaign special-ad categories',
  );

  const adSet = await graph.readObject(state.objects.ad_set_id, [
    'id', 'name', 'campaign_id', 'status', 'effective_status', 'optimization_goal',
    'billing_event', 'bid_strategy', 'daily_budget', 'lifetime_budget', 'start_time',
    'end_time', 'targeting',
  ]);
  assertPaused(adSet, 'Ad set');
  assertEqual(adSet.name, plan.ad_set.name, 'Ad set name');
  assertEqual(adSet.campaign_id, state.objects.campaign_id, 'Ad set campaign');
  assertEqual(adSet.optimization_goal, plan.ad_set.optimization_goal, 'Optimization goal');
  assertEqual(adSet.billing_event, plan.ad_set.billing_event, 'Billing event');
  assertEqual(adSet.bid_strategy, plan.ad_set.bid_strategy, 'Bid strategy');
  if (plan.ad_set.daily_budget) assertEqual(adSet.daily_budget, plan.ad_set.daily_budget, 'Daily budget');
  if (plan.ad_set.lifetime_budget) assertEqual(adSet.lifetime_budget, plan.ad_set.lifetime_budget, 'Lifetime budget');
  assertDateEqual(adSet.start_time, plan.ad_set.start_time, 'Start time');
  if (plan.ad_set.end_time) assertDateEqual(adSet.end_time, plan.ad_set.end_time, 'End time');
  assertJsonEqual(adSet.targeting, plan.ad_set.targeting, 'Audience targeting');

  const ads = [];
  for (const [index, adPlan] of plan.ads.entries()) {
    const object = state.objects.ads[index];
    if (!object?.creative_id || !object?.ad_id) {
      throw new AdapterError('readback_mismatch', `Ad ${index + 1} has incomplete recovery state.`);
    }
    const creative = await graph.readObject(object.creative_id, [
      'id', 'name', 'object_story_spec',
    ]);
    const ad = await graph.readObject(object.ad_id, [
      'id', 'name', 'adset_id', 'status', 'effective_status', 'creative{id}',
    ]);
    verifyCreativeReadback(creative, adPlan.creative, plan, `Creative ${index + 1}`);
    assertPaused(ad, `Ad ${index + 1}`);
    assertEqual(ad.name, adPlan.name, `Ad ${index + 1} name`);
    assertEqual(ad.adset_id, state.objects.ad_set_id, `Ad ${index + 1} ad set`);
    assertEqual(ad.creative?.id, object.creative_id, `Ad ${index + 1} creative`);
    ads.push({ creative, ad });
  }
  return { campaign, ad_set: adSet, ads, verified_at: nowIso() };
}

async function publishDirectLaunch(plan, options = {}) {
  validatePlan(plan);
  if (options.confirmation !== APPROVAL_PHRASE) {
    throw new AdapterError(
      'approval_required',
      `No Meta write was attempted. Re-run only after the human explicitly confirms: ${APPROVAL_PHRASE}`,
    );
  }
  const confirmedBy = requireString(options.confirmedBy, 'confirmedBy');
  const statePath = options.statePath || defaultStatePath(plan);
  let state;
  try {
    state = readJson(statePath);
  } catch {
    throw new AdapterError(
      'missing_state',
      'Prepare the plan first so inspection and destination checks are persisted before approval.',
    );
  }
  if (state.adapter !== 'direct_meta' || state.launch_id !== plan.launch_id) {
    throw new AdapterError('state_mismatch', 'Recovery state belongs to a different launch.');
  }
  if (state.plan_digest !== planDigest(plan)) {
    throw new AdapterError(
      'plan_changed',
      'The plan changed after preparation. Prepare and approve the revised plan again.',
    );
  }
  if (state.status === 'completed') return state;
  if (!['awaiting_approval', 'partial', 'failed'].includes(state.status)) {
    throw new AdapterError('state_mismatch', `Launch state ${state.status} cannot be published.`);
  }

  const env = options.env || process.env;
  const credentials = resolveCredentials(plan, env);
  const graph = options.graphClient || new MetaGraphClient({
    token: credentials.token,
    fetchImpl: options.fetchImpl,
    graphBase: options.graphBase,
  });
  state.approval = {
    mechanism: 'explicit_user_confirmation',
    confirmed_by: confirmedBy,
    confirmation: APPROVAL_PHRASE,
    confirmed_at: nowIso(),
    plan_digest: state.plan_digest,
  };
  state.status = 'publishing';
  state.failure = null;
  state.next_action = null;
  state.updated_at = nowIso();
  writeJsonAtomic(statePath, state);

  try {
    await graph.validateAccess(credentials.accountId, credentials.pageId);
    await verifyRecoveryState(graph, plan, state);
    if (!state.objects.campaign_id) {
      state.objects.campaign_id = await graph.createCampaign(credentials.accountId, plan.campaign);
      state.updated_at = nowIso();
      writeJsonAtomic(statePath, state);
    }
    if (!state.objects.ad_set_id) {
      state.objects.ad_set_id = await graph.createAdSet(
        credentials.accountId,
        state.objects.campaign_id,
        plan.ad_set,
      );
      state.updated_at = nowIso();
      writeJsonAtomic(statePath, state);
    }

    for (const [index, adPlan] of plan.ads.entries()) {
      const current = state.objects.ads[index] || { index, creative_id: null, ad_id: null };
      state.objects.ads[index] = current;
      if (!current.creative_id) {
        if (adPlan.creative.meta_creative_id) {
          current.creative_id = String(adPlan.creative.meta_creative_id);
        } else {
          let imageHash = adPlan.creative.image_hash || current.image_hash;
          if (!imageHash && adPlan.creative.image_path) {
            imageHash = await graph.uploadImage(credentials.accountId, adPlan.creative.image_path);
            current.image_hash = imageHash;
            state.updated_at = nowIso();
            writeJsonAtomic(statePath, state);
          }
          current.creative_id = await graph.createCreative(
            credentials.accountId,
            credentials.pageId,
            plan.destination.url,
            adPlan.creative,
            imageHash,
          );
        }
        state.updated_at = nowIso();
        writeJsonAtomic(statePath, state);
      }
      if (!current.ad_id) {
        current.ad_id = await graph.createAd(
          credentials.accountId,
          state.objects.ad_set_id,
          current.creative_id,
          adPlan.name,
        );
        state.updated_at = nowIso();
        writeJsonAtomic(statePath, state);
      }
    }

    state.readback = await readBackLaunch(graph, plan, state);
    state.status = 'completed';
    state.completed_at = nowIso();
    state.updated_at = nowIso();
    state.next_action = 'Review the paused objects in Meta Ads Manager. Do not activate automatically.';
    writeJsonAtomic(statePath, state);
    return state;
  } catch (error) {
    state.status = stateHasCreatedObjects(state) ? 'partial' : 'failed';
    state.failure = safeFailure(error);
    state.updated_at = nowIso();
    state.next_action = stateHasCreatedObjects(state)
      ? 'Review the recorded IDs in Meta, keep them paused, fix the reported cause, then explicitly approve a resume.'
      : 'Fix the reported cause, prepare again if the plan changed, then obtain explicit approval before retrying.';
    writeJsonAtomic(statePath, state);
    if (error instanceof AdapterError) error.state = state;
    throw error;
  }
}

function parseArgs(argv) {
  const result = { _: [] };
  for (let index = 0; index < argv.length; index += 1) {
    const value = argv[index];
    if (!value.startsWith('--')) {
      result._.push(value);
      continue;
    }
    const key = value.slice(2).replace(/-/g, '_');
    const next = argv[index + 1];
    if (next && !next.startsWith('--')) {
      result[key] = next;
      index += 1;
    } else {
      result[key] = true;
    }
  }
  return result;
}

function printJson(value) {
  process.stdout.write(`${JSON.stringify(value, null, 2)}\n`);
}

async function cli(argv = process.argv.slice(2)) {
  const args = parseArgs(argv);
  const command = args._[0];
  if (command === 'route') {
    const availableTools = String(args.tools || '').split(',').map((item) => item.trim()).filter(Boolean);
    printJson({ adapter: selectLaunchAdapter({ availableTools }) });
    return;
  }
  if (command === 'status') {
    printJson(readJson(requireString(args.state, '--state')));
    return;
  }
  if (!['prepare', 'publish'].includes(command)) {
    throw new AdapterError(
      'usage',
      'Usage: meta_marketing_api.js route | prepare --plan plan.json --state state.json | publish --plan plan.json --state state.json --confirm "APPROVE PAUSED META CAMPAIGN" --confirmed-by "user" | status --state state.json',
    );
  }
  const plan = readJson(requireString(args.plan, '--plan'));
  const statePath = args.state || defaultStatePath(plan);
  const result = command === 'prepare'
    ? await prepareDirectLaunch(plan, { statePath })
    : await publishDirectLaunch(plan, {
      statePath,
      confirmation: args.confirm,
      confirmedBy: args.confirmed_by,
    });
  printJson(result);
}

if (require.main === module) {
  cli().catch((error) => {
    const failure = safeFailure(error);
    if (error?.state) failure.state = error.state;
    process.stderr.write(`${JSON.stringify(failure, null, 2)}\n`);
    process.exitCode = 1;
  });
}

module.exports = {
  APPROVAL_PHRASE,
  AdapterError,
  GOOSEWORKS_TOOLS,
  MetaGraphClient,
  assertPublicHttpsUrl,
  defaultStatePath,
  isPrivateIp,
  normalizeAccountId,
  planDigest,
  preflightDestination,
  prepareDirectLaunch,
  publishDirectLaunch,
  readJson,
  selectLaunchAdapter,
  validatePlan,
  writeJsonAtomic,
};

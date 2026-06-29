#!/usr/bin/env node
'use strict';

/**
 * Capture REAL Meta Ads data into an eval fixture (record → snapshot).
 *
 * Uses the `meta` CLI (Meta Marketing API). Pulls campaigns + ad sets + per-ad-set
 * insights (incl. quality/engagement/conversion rankings), flattens them into the
 * same campaign-export.csv shape the meta-ads-analyzer eval expects, and writes the
 * raw API responses + a provenance.json so the snapshot is traceable.
 *
 * The frozen snapshot is then replayed by test/eval-harness.js — deterministic,
 * no token needed at eval time. Fixtures are gitignored (real account data).
 *
 * Prereqs:
 *   export ACCESS_TOKEN=<meta-graph-api-token>
 *   export AD_ACCOUNT_ID=act_XXXXXXXXXX     (or pass --account act_XXXXXXXXXX)
 *
 * Usage:
 *   node test/capture-fixture.js --skill meta-ads-analyzer --account act_123 [--date-preset last_30d]
 */

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const SKILLS_DIR = path.join(ROOT, 'skills');
const META_BIN = process.env.META_BIN || 'meta';

// ── args ─────────────────────────────────────────────────────────────────────
const args = process.argv.slice(2);
const getArg = (n) => {
  const eq = args.find((a) => a.startsWith(`--${n}=`));
  if (eq) return eq.split('=')[1];
  const i = args.indexOf(`--${n}`);
  return i !== -1 && args[i + 1] && !args[i + 1].startsWith('--') ? args[i + 1] : null;
};
const skill = getArg('skill') || 'meta-ads-analyzer';
const account = getArg('account') || process.env.AD_ACCOUNT_ID;
const datePreset = getArg('date-preset') || 'last_30d';
const limit = getArg('limit') || '50';

// ── preflight ────────────────────────────────────────────────────────────────
function meta(jsonArgs, { allowEmpty = false } = {}) {
  // The CLI scopes by the AD_ACCOUNT_ID env var; --ad-account-id is positional to `ads`.
  const full = ['-o', 'json', ...jsonArgs];
  const res = spawnSync(META_BIN, full, { encoding: 'utf8', timeout: 120000, env: { ...process.env, AD_ACCOUNT_ID: account } });
  if (res.error) throw new Error(`meta CLI failed (${res.error.message}). Is it installed/on PATH?`);
  if (res.status !== 0) throw new Error(`meta ${jsonArgs.join(' ')} → exit ${res.status}\n${res.stderr || res.stdout}`);
  const out = (res.stdout || '').trim();
  if (!out && allowEmpty) return [];
  try { return JSON.parse(out); } catch { throw new Error(`meta ${jsonArgs.join(' ')} returned non-JSON:\n${out.slice(0, 400)}`); }
}

if (!process.env.ACCESS_TOKEN) {
  console.error('✗ Not authenticated. The `meta` CLI needs a token:\n' +
    '    export ACCESS_TOKEN=<your-meta-graph-api-token>\n' +
    '    export AD_ACCOUNT_ID=act_XXXXXXXXXX   (or pass --account)\n' +
    'Then re-run. Check with: meta auth status');
  process.exit(1);
}
if (!account) {
  console.error('✗ No ad account. Pass --account act_XXXX or set AD_ACCOUNT_ID.');
  process.exit(1);
}

// ── locate the skill's eval/fixtures dir ─────────────────────────────────────
function findEvalDir(slug) {
  let hit = null;
  (function walk(dir) {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      if (hit || e.name.startsWith('.') || e.name === 'node_modules') continue;
      const full = path.join(dir, e.name);
      if (e.isDirectory()) walk(full);
      else if (e.name === 'eval.json' && path.basename(path.dirname(full)) === 'eval') {
        try { if (JSON.parse(fs.readFileSync(full, 'utf8')).skill === slug) hit = path.dirname(full); } catch {}
      }
    }
  })(SKILLS_DIR);
  return hit;
}
const evalDir = findEvalDir(skill);
if (!evalDir) { console.error(`✗ No eval.json found for skill "${skill}".`); process.exit(1); }

const stamp = new Date().toISOString().replace(/[:.]/g, '-');
const capDir = path.join(evalDir, 'fixtures', 'captured', stamp);
const rawDir = path.join(capDir, 'raw');
fs.mkdirSync(rawDir, { recursive: true });

// ── pull ─────────────────────────────────────────────────────────────────────
const FIELDS = [
  'spend', 'impressions', 'reach', 'frequency', 'cpm', 'clicks', 'ctr', 'cpc',
  'actions', 'cost_per_action_type', 'purchase_roas', 'outbound_clicks_ctr',
  'quality_ranking', 'engagement_rate_ranking', 'conversion_rate_ranking',
].join(',');

console.log(`Capturing real data for ${account} (${datePreset})…`);
const campaigns = meta(['ads', 'campaign', 'list', '--limit', limit], { allowEmpty: true });
fs.writeFileSync(path.join(rawDir, 'campaigns.json'), JSON.stringify(campaigns, null, 2));

// id -> { name, objective } so ad-set rows show real names, not numeric ids.
const campList = Array.isArray(campaigns) ? campaigns : campaigns.data || [];
const campMap = Object.fromEntries(campList.map((c) => [String(c.id), { name: c.name || c.id, objective: c.objective || '' }]));

// Detect the primary conversion generically (account may be purchase, lead-gen, traffic…).
const CONVERSION_PRIORITY = [
  { match: 'purchase', label: 'Purchases' },
  { match: 'complete_registration', label: 'Registrations' },
  { match: 'lead', label: 'Leads' },
  { match: 'initiate_checkout', label: 'Checkouts' },
  { match: 'landing_page_view', label: 'Landing page views' },
  { match: 'link_click', label: 'Link clicks' },
];
function primaryConversion(rec) {
  const actions = rec.actions || [];
  const costs = rec.cost_per_action_type || [];
  for (const { match, label } of CONVERSION_PRIORITY) {
    const a = actions.find((x) => x.action_type.includes(match));
    if (a) {
      const cost = costs.find((x) => x.action_type === a.action_type)?.value;
      return { label, count: a.value, cost: cost ?? '' };
    }
  }
  return { label: '', count: '', cost: '' };
}

const adsets = meta(['ads', 'adset', 'list', '--limit', limit], { allowEmpty: true });
fs.writeFileSync(path.join(rawDir, 'adsets.json'), JSON.stringify(adsets, null, 2));

const adsetList = Array.isArray(adsets) ? adsets : adsets.data || [];
console.log(`  ${campaigns.length || (campaigns.data || []).length} campaigns, ${adsetList.length} ad sets — fetching insights per ad set…`);

const rows = [];
for (const as of adsetList) {
  const id = as.id || as.adset_id;
  if (!id) continue;
  let ins;
  try {
    ins = meta(['ads', 'insights', 'get', '--adset-id', String(id), '--date-preset', datePreset, '--fields', FIELDS], { allowEmpty: true });
  } catch (e) {
    console.warn(`  ! insights failed for adset ${id}: ${e.message.split('\n')[0]}`);
    continue;
  }
  fs.writeFileSync(path.join(rawDir, `insights-${id}.json`), JSON.stringify(ins, null, 2));
  const rec = (Array.isArray(ins) ? ins[0] : (ins.data || [])[0]) || {};
  const camp = campMap[String(as.campaign_id)] || {};
  const conv = primaryConversion(rec);
  rows.push({
    'Campaign name': camp.name || as.campaign_id || '',
    'Objective': camp.objective || '',
    'Ad set name': as.name || '',
    'Delivery status': as.effective_status || as.status || '',
    'Amount spent': rec.spend ?? '',
    'Impressions': rec.impressions ?? '',
    'Reach': rec.reach ?? '',
    'Frequency': rec.frequency ?? '',
    'CPM': rec.cpm ?? '',
    'Clicks (all)': rec.clicks ?? '',
    'CTR (all)': rec.ctr ?? '',
    'Result type': conv.label,
    'Results': conv.count,
    'Cost per result': conv.cost,
    'Purchase ROAS': (rec.purchase_roas || [])[0]?.value ?? '',
    'Quality ranking': rec.quality_ranking ?? '',
    'Engagement rate ranking': rec.engagement_rate_ranking ?? '',
    'Conversion rate ranking': rec.conversion_rate_ranking ?? '',
  });
}

// ── write CSV + provenance ───────────────────────────────────────────────────
const cols = Object.keys(rows[0] || { note: 'no data' });
const csv = [cols.join(','), ...rows.map((r) => cols.map((c) => String(r[c]).replace(/,/g, ' ')).join(','))].join('\n') + '\n';
fs.writeFileSync(path.join(capDir, 'campaign-export.csv'), csv);

fs.writeFileSync(path.join(capDir, 'provenance.json'), JSON.stringify({
  skill, account, datePreset, fields: FIELDS,
  capturedAt: new Date().toISOString(),
  metaCliVersion: (spawnSync(META_BIN, ['--version'], { encoding: 'utf8' }).stdout || '').trim(),
  adSetCount: rows.length,
  note: 'Real Meta Marketing API snapshot. Gitignored. Replayed deterministically by the eval harness.',
}, null, 2) + '\n');

// Point the existing case at this real snapshot (fixtures are gitignored).
const activeCsv = path.join(evalDir, 'fixtures', 'campaign-export.csv');
fs.copyFileSync(path.join(capDir, 'campaign-export.csv'), activeCsv);

console.log(`\n✓ Captured ${rows.length} ad sets → ${path.relative(ROOT, capDir)}/`);
console.log(`  raw API responses: ${path.relative(ROOT, rawDir)}/`);
console.log(`  active fixture updated: ${path.relative(ROOT, activeCsv)}`);
console.log(`\nNow run the eval on real data:`);
console.log(`  node test/eval-harness.js --skill ${skill} --case csv-fixture-happy-path`);

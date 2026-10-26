// Brand-state isolation for evals: snapshot the staging brand before an arm, then remove or restore
// everything the arm changed, so the next arm starts from the same state. Plus a one-time cleanup
// of work left by earlier runs (dry run by default). All calls are free GooseWorks reads/deletes.
//
// What can be undone, and how:
//   workspace files (brand coworker + default workspace)  new → file_delete · changed → file_write(old content)
//   media (brand documents and any other new asset)       new → media_update { delete }
//   learnings (brand facts)                               new → brand_update facts [{ id, delete }]
//   campaigns                                             new → campaign_archive (no hard delete exists)
//   automations                                           new → automation_delete
//   onboarding profile, coworker notes (user_context)     changed → brand_update back to the old values
// What cannot be undone through the tools (reported as "flagged", never silently ignored):
//   competitor rows (removal needs the customer's click on a card), inspiration saves (no delete tool),
//   edits to a campaign that existed before the arm (no restore), pending kit/knowledge proposals.
import { StagingMcp } from './mcp.mjs';

// Never touched: workspace plumbing and video work that has nothing to do with marketing evals.
const PROTECTED_ROOT = new Set(['.claude', 'agent-config', 'video-projects', 'video-scripts', 'skills', 'CLAUDE.md', '.env', 'FILE_ORGANIZATION.md']);
// Folders the marketing playbooks write (AGENTS §8), plus what baseline agents used. One-time cleanup is limited to these.
const MARKETING_DIRS = ['brand', 'research', 'creators', 'social', 'content', 'search', 'lifecycle', 'ads', 'reports', 'plans', 'market-research', 'brands', 'gooseworks-reports', 'drafts'];
const ONBOARDING_FIELDS = ['role', 'ad_spend', 'creative_maker', 'ad_manager', 'goals', 'platforms', 'platform_other', 'discovery_source', 'discovery_other'];
const MAX_RESTORE_FILES = 300;

const r = (x) => x?.result ?? x;

export async function connectBrand(brandSlug = 'gooseworks') {
  const mcp = await new StagingMcp().connect();
  const list = r(await mcp.call('brand_read', {})).items ?? [];
  const brand = list.find((b) => b.slug === brandSlug || b.name.toLowerCase() === brandSlug.toLowerCase());
  if (!brand) throw new Error(`Staging brand "${brandSlug}" not found (have: ${list.map((b) => b.slug).join(', ')})`);
  const who = r(await mcp.call('account_whoami', {}));
  const scopes = [...new Set([brand.coworker_agent_id, who.default_agent_id].filter(Boolean))];
  const scopeNames = { [brand.coworker_agent_id]: 'brand workspace', [who.default_agent_id]: 'default workspace' };
  return { mcp, brand: { id: brand.id, name: brand.name, slug: brand.slug, coworker_agent_id: brand.coworker_agent_id }, scopes, scopeNames };
}

async function walkFiles(mcp, agentId, dir = '', out = {}) {
  const res = r(await mcp.call('file_list', { scope: { type: 'agent', agent_id: agentId }, ...(dir ? { path: dir } : {}) }));
  for (const e of res.entries ?? []) {
    if (!dir && PROTECTED_ROOT.has(e.name)) continue;
    if (e.type === 'directory') await walkFiles(mcp, agentId, e.path, out);
    else out[e.path] = { size: e.size ?? null, modified: e.modified ?? null };
  }
  return out;
}

async function pages(fetchPage, max = 20) {
  const items = [];
  let cursor;
  for (let i = 0; i < max; i++) {
    const res = r(await fetchPage(cursor));
    const got = res.items ?? res.automations ?? [];
    items.push(...got);
    cursor = res.next_cursor;
    if (!cursor || !got.length) break;
  }
  return items;
}

/** Everything an arm could change, in one object. withContents: also keep marketing-file text for restore. */
export async function snapshot(ctx, { withContents = true } = {}) {
  const { mcp, brand, scopes } = ctx;
  const snap = { taken_at: new Date().toISOString(), brand, scopeNames: ctx.scopeNames, files: {}, contents: {} };
  for (const agentId of scopes) {
    snap.files[agentId] = await walkFiles(mcp, agentId);
    if (withContents) {
      const paths = Object.keys(snap.files[agentId]).filter((p) => MARKETING_DIRS.includes(p.split('/')[0]) || !p.includes('/'));
      if (paths.length <= MAX_RESTORE_FILES) {
        snap.contents[agentId] = {};
        for (const p of paths) {
          try {
            const f = r(await mcp.call('file_read', { scope: { type: 'agent', agent_id: agentId }, path: p }));
            if (typeof f.content === 'string' && !f.is_base64) snap.contents[agentId][p] = f.content;
          } catch { /* unreadable: it can still be deleted, not restored */ }
        }
      } else snap.contents[agentId] = null; // too many to keep; changed files will be flagged instead
    }
  }
  snap.media = (await pages((cursor) => mcp.call('media_list', { brand_id: brand.id, limit: 100, ...(cursor ? { cursor } : {}) })))
    .map((m) => ({ id: m.id, kind: m.kind, title: m.title, tags: m.tags, created_at: m.created_at }));
  const learn = r(await mcp.call('brand_read', { brand_id: brand.id, sections: ['learnings', 'onboarding'], detail: 'full' }));
  snap.learnings = (learn.learnings ?? []).map((l) => ({ id: l.id, kind: l.kind, text: String(l.text ?? '').slice(0, 160), created_at: l.created_at ?? null }));
  snap.onboarding = learn.onboarding?.profile ?? null;
  snap.first_task = learn.onboarding?.first_task ?? null;
  const who = r(await mcp.call('account_whoami', {}));
  snap.user_context = who.user_context ?? null;
  snap.credits = who.credits?.available_credits ?? null; // staging credits, to catch any spend during an arm
  snap.campaigns = (r(await mcp.call('campaign_read', { brand_id: brand.id })).campaigns ?? [])
    .map((c) => ({ id: c.id, name: c.name, status: c.status, created_at: c.created_at ?? null, updated_at: c.updated_at ?? null }));
  snap.competitors = (r(await mcp.call('competitor_read', { brand_id: brand.id })).competitors ?? [])
    .map((c) => ({ id: c.id, name: c.name, domain: c.domain, created_at: c.created_at ?? null }));
  snap.automations = (r(await mcp.call('automation_list', { brand_id: brand.id })).automations ?? []).map((a) => ({ id: a.id, name: a.name ?? a.title ?? '' }));
  snap.inspiration = (await pages((cursor) => mcp.call('social_inspiration_library', { brand_id: brand.id, ...(cursor ? { cursor } : {}) }), 10))
    .map((i) => ({ id: i.id, url: i.post?.url, saved_at: i.metadata?.saved_at ?? null }));
  return snap;
}

const byId = (arr) => new Map((arr ?? []).map((x) => [x.id, x]));
const same = (a, b) => JSON.stringify(a ?? null) === JSON.stringify(b ?? null);

/** What to do to return from `after` to `before`. */
export function planReset(before, after) {
  const actions = [];
  for (const [agentId, files] of Object.entries(after.files)) {
    const old = before.files[agentId] ?? {};
    for (const [p, meta] of Object.entries(files)) {
      if (!old[p]) actions.push({ kind: 'file', op: 'delete', scope: agentId, path: p, label: `new file ${after.scopeNames?.[agentId] ?? ''}: ${p}` });
      else if (!same(old[p], meta)) {
        const content = before.contents?.[agentId]?.[p];
        actions.push(content !== undefined
          ? { kind: 'file', op: 'restore', scope: agentId, path: p, content, label: `changed file ${p} → old content` }
          : { kind: 'file', op: 'flag', scope: agentId, path: p, label: `changed file ${p} (old content not kept)` });
      }
    }
    for (const p of Object.keys(old)) {
      if (!files[p]) {
        const content = before.contents?.[agentId]?.[p];
        actions.push(content !== undefined
          ? { kind: 'file', op: 'restore', scope: agentId, path: p, content, label: `deleted file ${p} → put back` }
          : { kind: 'file', op: 'flag', scope: agentId, path: p, label: `deleted file ${p} (content not kept)` });
      }
    }
  }
  const oldMedia = byId(before.media);
  for (const m of after.media) if (!oldMedia.has(m.id)) actions.push({ kind: 'media', op: 'delete', id: m.id, label: `new ${m.kind} "${m.title}"` });
  const oldLearn = byId(before.learnings);
  for (const l of after.learnings) if (!oldLearn.has(l.id)) actions.push({ kind: 'learning', op: 'delete', id: l.id, label: `new learning [${l.kind}] ${l.text}` });
  const afterLearn = byId(after.learnings);
  for (const l of before.learnings) if (!afterLearn.has(l.id)) actions.push({ kind: 'learning', op: 'flag', id: l.id, label: `learning removed or retired by the arm: ${l.text}` });
  const oldCamp = byId(before.campaigns);
  for (const c of after.campaigns) {
    const o = oldCamp.get(c.id);
    if (!o) actions.push({ kind: 'campaign', op: 'archive', id: c.id, label: `new campaign "${c.name}"` });
    else if (!same(o.updated_at, c.updated_at) || o.status !== c.status) actions.push({ kind: 'campaign', op: 'flag', id: c.id, label: `existing campaign "${c.name}" was edited (no restore tool)` });
  }
  const oldComp = byId(before.competitors);
  for (const c of after.competitors) if (!oldComp.has(c.id)) actions.push({ kind: 'competitor', op: 'flag', id: c.id, label: `new competitor "${c.name}" (removal needs a click on a card)` });
  const oldAuto = byId(before.automations);
  for (const a of after.automations) if (!oldAuto.has(a.id)) actions.push({ kind: 'automation', op: 'delete', id: a.id, label: `new automation "${a.name}"` });
  const oldInsp = byId(before.inspiration);
  for (const i of after.inspiration) if (!oldInsp.has(i.id)) actions.push({ kind: 'inspiration', op: 'flag', id: i.id, label: `new inspiration save ${i.url} (no delete tool)` });
  if (!same(before.onboarding, after.onboarding) || !same(before.first_task, after.first_task)) actions.push({ kind: 'onboarding', op: 'restore', value: { profile: before.onboarding, first_task: before.first_task }, label: 'onboarding profile changed → old values' });
  if (!same(before.user_context, after.user_context)) actions.push({ kind: 'user_context', op: 'restore', value: before.user_context, label: 'coworker notes about the customer changed → old values' });
  return actions;
}

/**
 * One-time cleanup: everything marketing-related created on or after `since` (ISO date).
 * Files only inside the marketing folders; media only documents; learnings, campaigns, automations by date.
 */
export function planSince(snap, since) {
  const t = Date.parse(since);
  const after = (iso) => iso && Date.parse(iso) >= t;
  const actions = [];
  for (const [agentId, files] of Object.entries(snap.files)) {
    for (const [p, meta] of Object.entries(files)) {
      if (!MARKETING_DIRS.includes(p.split('/')[0])) continue;
      if (after(meta.modified)) actions.push({ kind: 'file', op: 'delete', scope: agentId, path: p, label: `${snap.scopeNames?.[agentId] ?? agentId}: ${p} (${meta.modified?.slice(0, 10)})` });
    }
  }
  for (const m of snap.media) if (m.kind === 'document' && after(m.created_at)) actions.push({ kind: 'media', op: 'delete', id: m.id, label: `document "${m.title}" (${m.created_at?.slice(0, 10)})` });
  for (const l of snap.learnings) if (after(l.created_at)) actions.push({ kind: 'learning', op: 'delete', id: l.id, label: `learning [${l.kind}] ${l.text}` });
  for (const c of snap.campaigns) if (after(c.created_at ?? c.updated_at)) actions.push({ kind: 'campaign', op: 'archive', id: c.id, label: `campaign "${c.name}" (${(c.created_at ?? c.updated_at)?.slice(0, 10)})` });
  for (const a of snap.automations) actions.push({ kind: 'automation', op: 'flag', id: a.id, label: `automation "${a.name}" (check by hand)` });
  for (const c of snap.competitors) if (after(c.created_at)) actions.push({ kind: 'competitor', op: 'flag', id: c.id, label: `competitor "${c.name}" added ${c.created_at?.slice(0, 10)} (removal needs a click on a card)` });
  for (const i of snap.inspiration) if (after(i.saved_at)) actions.push({ kind: 'inspiration', op: 'flag', id: i.id, label: `inspiration save ${i.url} (${i.saved_at?.slice(0, 10)}; no delete tool)` });
  return actions;
}

/**
 * Keep only the undo actions this arm's own tool calls explain, so work by other people on the shared
 * staging brand during the arm is left alone (flagged instead). `haystack` = the arm's tool inputs and results.
 */
export function attributeToArm(actions, haystack) {
  const has = (s) => !!s && haystack.includes(s);
  return actions.map((a) => {
    if (a.op === 'flag') return a;
    const mine =
      a.kind === 'file' ? has(a.path) :
      a.kind === 'media' ? has(a.id) || has(a.label.match(/"(.+)"/)?.[1]) :
      a.kind === 'learning' ? has(a.id) || has(a.label.replace(/^new learning \[[^\]]*\] /, '').slice(0, 60)) :
      a.kind === 'campaign' ? has(a.id) || has(a.label.match(/"(.+)"/)?.[1]) :
      a.kind === 'automation' ? has(a.id) :
      a.kind === 'onboarding' ? has('onboarding') :
      a.kind === 'user_context' ? has('user_context') : false;
    return mine ? a : { ...a, op: 'flag', label: `not traced to this arm, left alone: ${a.label}` };
  });
}

/** Apply a plan. Flags are recorded, not acted on. Returns the plan with a result per action. */
export async function applyPlan(ctx, actions) {
  const { mcp, brand } = ctx;
  const out = [];
  // Files: delete children before parents is not needed (file_delete is per path); restore after deletes.
  for (const a of actions) {
    const rec = { kind: a.kind, op: a.op, id: a.id, path: a.path, label: a.label };
    try {
      if (a.op === 'flag') rec.result = 'flagged';
      else if (a.kind === 'file' && a.op === 'delete') { await mcp.call('file_delete', { scope: { type: 'agent', agent_id: a.scope }, path: a.path }); rec.result = 'deleted'; }
      else if (a.kind === 'file' && a.op === 'restore') { await mcp.call('file_write', { scope: { type: 'agent', agent_id: a.scope }, path: a.path, content: a.content }); rec.result = 'restored'; }
      else if (a.kind === 'media') { await mcp.call('media_update', { brand_id: brand.id, media_id: a.id, patch: { delete: true } }); rec.result = 'deleted'; }
      else if (a.kind === 'learning') { await mcp.call('brand_update', { brand_id: brand.id, patch: { facts: [{ id: a.id, delete: true }] } }); rec.result = 'deleted'; }
      else if (a.kind === 'campaign') { await mcp.call('campaign_archive', { campaign_id: a.id }); rec.result = 'archived'; }
      else if (a.kind === 'automation') { await mcp.call('automation_delete', { brand_id: brand.id, automation_id: a.id }); rec.result = 'deleted'; }
      else if (a.kind === 'onboarding') {
        const p = a.value.profile ?? {};
        const onboarding = Object.fromEntries(ONBOARDING_FIELDS.map((k) => [k, p[k] ?? (k === 'goals' || k === 'platforms' ? [] : null)]));
        onboarding.first_task = a.value.first_task ?? null;
        await mcp.call('brand_update', { brand_id: brand.id, patch: { onboarding } });
        rec.result = 'restored';
      } else if (a.kind === 'user_context') {
        const v = a.value ?? {};
        await mcp.call('brand_update', { user_context: { company_website: v.company_website ?? null, role: v.role ?? null, use_cases: v.use_cases ?? null, goals: v.goals ?? null, context_md: v.context_md ?? null } });
        rec.result = 'restored';
      } else rec.result = 'skipped';
    } catch (e) {
      rec.result = 'error';
      rec.error = String(e.message).slice(0, 300);
    }
    out.push(rec);
  }
  return out;
}

export function describePlan(actions) {
  const groups = {};
  for (const a of actions) (groups[`${a.kind} · ${a.op}`] ??= []).push(a.label);
  return Object.entries(groups).map(([k, labels]) => `${k} (${labels.length})\n${labels.map((l) => `  - ${l}`).join('\n')}`).join('\n');
}

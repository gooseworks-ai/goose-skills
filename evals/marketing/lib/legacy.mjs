// The legacy arm: install the OLD goose-skills a user would have used for this job (legacy/mapping.json),
// plus their requires_skills, copied from goose-skills `skills/` into the workspace's .claude/skills/.
// Also: which keys each old skill needs, and which key failures showed up in a finished run.
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { execFileSync } from 'node:child_process';
import { EVALS_DIR, REPO_ROOT } from './files.mjs';

const CURRENT_ROOT = REPO_ROOT;
export let GOOSE_SKILLS_DIR = process.env.GOOSE_SKILLS_DIR || CURRENT_ROOT;
let materialized = false;
function ensureLegacyRoot() {
  if (materialized || process.env.GOOSE_SKILLS_DIR) return;
  const manifest = JSON.parse(fs.readFileSync(path.join(CURRENT_ROOT, 'retired-skills.json'), 'utf8'));
  if (!/^[a-f0-9]{40}$/.test(manifest.legacy_revision)) throw new Error('Invalid legacy source revision');
  const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'goose-skills-legacy-'));
  try {
    const archive = execFileSync('git', ['archive', manifest.legacy_revision, 'skills', 'tools', 'skills-index.json'], { cwd: CURRENT_ROOT, maxBuffer: 128 * 1024 * 1024 });
    execFileSync('tar', ['-xf', '-', '-C', temp], { input: archive });
    GOOSE_SKILLS_DIR = temp;
    materialized = true;
  } catch (error) {
    fs.rmSync(temp, { recursive: true, force: true });
    throw new Error(`Cannot read pinned legacy skills. Set GOOSE_SKILLS_DIR to a checkout of ${manifest.legacy_revision}.`, { cause: error });
  }
}

// Env vars old skills read. GOOSEWORKS_API_KEY/_BASE come from the CLI login (~/.gooseworks/credentials.json),
// which the eval's sandbox home points at the STAGING profile. Everything else is a vendor key a normal user lacks.
const KEY_RE = /\b(APIFY_API_TOKEN|GOOSEWORKS_API_KEY|GOOSEWORKS_API_BASE|SCRAPECREATORS_API_KEY|GOOSE_AEO_[A-Z_]+|APOLLO_API_KEY|META_ACCESS_TOKEN|AHREFS_API_TOKEN|SEMRUSH_API_KEY|SIMILARWEB_API_KEY|FAL_KEY|OPENAI_API_KEY|FIRECRAWL_API_KEY)\b/g;
export const KEYS_FROM_CLI_LOGIN = new Set(['GOOSEWORKS_API_KEY', 'GOOSEWORKS_API_BASE']);
// Keys a skill mentions but can do without (it says so itself).
export const OPTIONAL_KEYS = { SCRAPECREATORS_API_KEY: 'falls back to the GooseWorks data proxy (paid; blocked in evals)', FAL_KEY: 'only brand-research\'s optional image step' };
const isHardKey = (k) => !KEYS_FROM_CLI_LOGIN.has(k) && !(k in OPTIONAL_KEYS);

export function loadMapping() {
  return JSON.parse(fs.readFileSync(path.join(EVALS_DIR, 'legacy', 'mapping.json'), 'utf8'));
}

function loadIndex() {
  ensureLegacyRoot();
  const f = path.join(GOOSE_SKILLS_DIR, 'skills-index.json');
  if (!fs.existsSync(f)) throw new Error(`No skills-index.json in ${GOOSE_SKILLS_DIR} (set GOOSE_SKILLS_DIR to a goose-skills checkout of the legacy_revision in retired-skills.json)`);
  return new Map(JSON.parse(fs.readFileSync(f, 'utf8')).skills.map((s) => [s.slug, s]));
}

function filesUnder(dir) {
  const out = [];
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) out.push(...filesUnder(p)); else out.push(p);
  }
  return out;
}

function keysNeeded(dir) {
  const keys = new Set();
  for (const f of filesUnder(dir)) {
    if (fs.statSync(f).size > 2_000_000) continue;
    for (const m of fs.readFileSync(f, 'utf8').matchAll(KEY_RE)) keys.add(m[1]);
  }
  return [...keys].sort();
}

/** The old skills for a playbook: the picks plus their requires_skills, transitively. */
export function resolveLegacy(slug) {
  const mapping = loadMapping().playbooks[slug];
  if (!mapping) throw new Error(`legacy/mapping.json has no entry for ${slug}`);
  const index = loadIndex();
  const picks = mapping.map((m) => m.slug);
  const out = [];
  const missing = [];
  const seen = new Set();
  const queue = picks.map((s) => ({ slug: s, via: null }));
  while (queue.length) {
    const { slug: s, via } = queue.shift();
    if (seen.has(s)) continue;
    seen.add(s);
    const e = index.get(s);
    if (!e) { missing.push({ slug: s, via }); continue; }
    const dir = path.join(GOOSE_SKILLS_DIR, e.path);
    if (!fs.existsSync(path.join(dir, 'SKILL.md'))) { missing.push({ slug: s, via, reason: `no SKILL.md at ${e.path}` }); continue; }
    out.push({ slug: s, path: e.path, picked: picks.includes(s), required_by: via, keys_needed: keysNeeded(dir) });
    for (const r of e.metadata?.requires_skills ?? []) queue.push({ slug: r, via: s });
  }
  return { installed: out, missing };
}

/** Copy the old skills into <workspace>/.claude/skills/<slug>. Returns the manifest written to .claude/legacy-skills.json. */
export function installLegacy(slug, workspace) {
  const { installed, missing } = resolveLegacy(slug);
  const skillsDir = path.join(workspace, '.claude', 'skills');
  fs.mkdirSync(skillsDir, { recursive: true });
  for (const s of installed) fs.cpSync(path.join(GOOSE_SKILLS_DIR, s.path), path.join(skillsDir, s.slug), { recursive: true, dereference: true });
  const vendorKeys = [...new Set(installed.flatMap((s) => s.keys_needed).filter(isHardKey))].sort();
  const optional = [...new Set(installed.flatMap((s) => s.keys_needed).filter((k) => k in OPTIONAL_KEYS))].map((k) => `${k}: ${OPTIONAL_KEYS[k]}`);
  const manifest = {
    playbook: slug, source: GOOSE_SKILLS_DIR, installed, missing,
    keys: {
      from_cli_login: ['GOOSEWORKS_API_KEY', 'GOOSEWORKS_API_BASE'].filter((k) => installed.some((s) => s.keys_needed.includes(k))),
      missing_vendor_keys: vendorKeys,
      optional_keys: optional,
      skills_needing_missing_keys: installed.filter((s) => s.keys_needed.some(isHardKey)).map((s) => `${s.slug}: ${s.keys_needed.filter(isHardKey).join(', ')}`),
    },
  };
  fs.writeFileSync(path.join(workspace, '.claude', 'legacy-skills.json'), JSON.stringify(manifest, null, 2));
  return manifest;
}

const FAIL_RE = /(APIFY_API_TOKEN|GOOSEWORKS_API_KEY|SCRAPECREATORS_API_KEY|GOOSE_AEO_[A-Z_]+|APOLLO_API_KEY|META_ACCESS_TOKEN|FAL_KEY|AHREFS_API_TOKEN|SEMRUSH_API_KEY|SIMILARWEB_API_KEY)[^\n]{0,80}(not set|missing|required|unset|empty)|(not set|missing|required|set )[^\n]{0,40}(APIFY_API_TOKEN|GOOSEWORKS_API_KEY|SCRAPECREATORS_API_KEY|GOOSE_AEO_|APOLLO_API_KEY|META_ACCESS_TOKEN|FAL_KEY)|\b401\b|unauthori[sz]ed|invalid api key|credentials\.json[^\n]{0,40}(not found|no such)|gooseworks login/i;

/**
 * Scan a finished run's tool traffic for failures caused by missing keys or logins, and attribute each
 * to the old skill whose folder the command touched (or the last old skill loaded).
 */
export function keyFailures(turnEvents, installedSlugs) {
  const names = new Set(installedSlugs);
  const calls = new Map();
  const out = [];
  let lastSkill = null;
  for (const e of turnEvents) {
    for (const c of e.message?.content ?? []) {
      if (e.type === 'assistant' && c.type === 'tool_use') {
        calls.set(c.id, c);
        if (c.name === 'Skill' && names.has(c.input?.skill)) lastSkill = c.input.skill;
        const m = JSON.stringify(c.input ?? {}).match(/\.claude\/skills\/([a-z0-9-]+)\//);
        if (m && names.has(m[1])) lastSkill = m[1];
      }
      if (e.type === 'user' && c.type === 'tool_result') {
        const text = typeof c.content === 'string' ? c.content : (c.content ?? []).map((x) => x.text ?? '').join(' ');
        const call = calls.get(c.tool_use_id);
        if (call?.name !== 'Bash') continue; // only real command output, not skill text the agent read
        const hit = text.match(FAIL_RE);
        if (!hit) continue;
        const m = JSON.stringify(call?.input ?? {}).match(/\.claude\/skills\/([a-z0-9-]+)\//);
        const skill = m && names.has(m[1]) ? m[1] : lastSkill;
        out.push({ skill: skill ?? 'unknown', tool: call?.name ?? '?', evidence: text.slice(Math.max(0, hit.index - 80), hit.index + 160).replace(/\s+/g, ' ') });
      }
    }
  }
  return out;
}

// Reading the marketing-agent skill set and the eval definition files.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const EVALS_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const MA_DIR = path.resolve(EVALS_DIR, '..'); // marketing-agent/

export const SKILLS_DIR = path.join(MA_DIR, 'skills');

/**
 * Every skill the catalog publishes (marketing-agent/skills/<slug>/, flat by slug): the 14 playbooks,
 * their steps, the shared steps and the two foundation skills. A folder whose skill.meta.json says
 * "catalog": false (the marketing-agent router) and unreleased/ are never listed.
 * Each entry: { slug, tier ('playbook' | 'atom' | 'foundation'), dir, name, description }.
 */
export function listSkills({ tiers } = {}) {
  const out = [];
  for (const slug of fs.readdirSync(SKILLS_DIR).sort()) {
    const dir = path.join(SKILLS_DIR, slug);
    const file = path.join(dir, 'SKILL.md');
    const metaFile = path.join(dir, 'skill.meta.json');
    if (!fs.existsSync(file) || !fs.existsSync(metaFile)) continue;
    const meta = JSON.parse(fs.readFileSync(metaFile, 'utf8'));
    if (meta.catalog === false) continue;
    if (tiers && !tiers.includes(meta.tier)) continue;
    const fm = readFrontmatter(fs.readFileSync(file, 'utf8'));
    out.push({ slug, tier: meta.tier, dir, name: fm.name || slug, description: fm.description || '' });
  }
  return out;
}

/** Kept in a skill folder for its builders and not published (scripts/build-index.js). */
export const BUILDER_FILES = new Set(['critique.md']);

/** Minimal frontmatter reader: `key: value` and folded `key: >-` blocks. Enough for our SKILL.md files. */
export function readFrontmatter(text) {
  const m = text.match(/^---\n([\s\S]*?)\n---/);
  if (!m) return {};
  const lines = m[1].split('\n');
  const out = {};
  for (let i = 0; i < lines.length; i++) {
    const kv = lines[i].match(/^([A-Za-z_-]+):\s*(.*)$/);
    if (!kv) continue;
    const [, key, rest] = kv;
    if (/^[>|]-?$/.test(rest.trim())) {
      const block = [];
      while (i + 1 < lines.length && (/^\s+/.test(lines[i + 1]) || lines[i + 1] === '')) block.push(lines[++i].trim());
      out[key] = block.join(' ').replace(/\s+/g, ' ').trim();
    } else {
      out[key] = rest.replace(/^["']|["']$/g, '').trim();
    }
  }
  return out;
}

export function readJsonl(file) {
  return fs.readFileSync(file, 'utf8').split('\n').filter((l) => l.trim()).map((l) => JSON.parse(l));
}

/** Split a Markdown file into { '<heading>': body } by `## ` headings. */
export function sections(md) {
  const out = {};
  let cur = '_preamble';
  out[cur] = '';
  for (const line of md.split('\n')) {
    const h = line.match(/^##\s+(.+?)\s*$/);
    if (h) { cur = h[1]; out[cur] = ''; continue; }
    out[cur] += line + '\n';
  }
  for (const k of Object.keys(out)) out[k] = out[k].trim();
  return out;
}

/**
 * scenario.md → { text, ask, maxTurns, requiresReport }.
 * `requires_report: false` (default true) marks jobs whose deliverable is a chat answer, not a document.
 * The opening ask is the first ```text fence under "## Opening ask".
 */
export function loadScenario(slug) {
  const file = path.join(EVALS_DIR, 'playbooks', slug, 'scenario.md');
  const text = fs.readFileSync(file, 'utf8');
  const sec = sections(text);
  const askSec = sec['Opening ask'];
  if (!askSec) throw new Error(`${file}: missing "## Opening ask"`);
  const fence = askSec.match(/```(?:text)?\n([\s\S]*?)\n```/);
  const ask = (fence ? fence[1] : askSec).trim();
  const mt = text.match(/max_turns:\s*(\d+)/);
  const rr = text.match(/requires_report:\s*(true|false)/);
  return { file, text, ask, maxTurns: mt ? Number(mt[1]) : 8, requiresReport: rr ? rr[1] === 'true' : true };
}

/**
 * rubric.md → [{ id, tier, text }].
 * Criteria are bullet lines `- **M1** — text`. Tier comes from the id prefix:
 * M = must, S = should, E = expert (from marketer review; E lines marked "(must)" count as must).
 */
export function loadRubric(slug) {
  const file = path.join(EVALS_DIR, 'playbooks', slug, 'rubric.md');
  const text = fs.readFileSync(file, 'utf8');
  const criteria = [];
  for (const line of text.split('\n')) {
    const m = line.match(/^\s*-\s+\*\*([MSE]\d+)\*\*\s*[—–-]\s*(.+)$/);
    if (!m) continue;
    const [, id, body] = m;
    let tier = id[0] === 'M' ? 'must' : id[0] === 'S' ? 'should' : 'expert';
    if (tier === 'expert' && /\(must\)/i.test(body)) tier = 'must';
    criteria.push({ id, tier, text: body.trim() });
  }
  if (!criteria.length) throw new Error(`${file}: no criteria found (expected lines like "- **M1** — …")`);
  return { file, text, criteria };
}

export function listPlaybookEvals() {
  const dir = path.join(EVALS_DIR, 'playbooks');
  return fs.readdirSync(dir).filter((d) => fs.existsSync(path.join(dir, d, 'scenario.md'))).sort();
}

export function today() {
  return new Date().toISOString().slice(0, 10);
}

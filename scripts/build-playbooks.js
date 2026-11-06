#!/usr/bin/env node
'use strict';

/**
 * Builds playbooks/playbooks-index.json from playbooks/*.md and playbooks/tools.yaml.
 * gooseworks-app's push-playbooks-to-cms.cjs reads that index (gooseworks.ai/playbooks).
 *
 *   node scripts/build-playbooks.js          write the index
 *   node scripts/build-playbooks.js --check  fail if the index is stale or a playbook is invalid
 *
 * Each playbook is one markdown file whose YAML frontmatter holds every field;
 * the file name must equal its slug. The body is ignored today (room for prose later).
 */

const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

const ROOT = path.resolve(__dirname, '..');
const DIR = path.join(ROOT, 'playbooks');
const OUT = path.join(DIR, 'playbooks-index.json');
const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
// Static route segments and tool-hub prefixes on gooseworks.ai/playbooks.
const RESERVED = /^(?:md|tools|llms-txt|tool-.*|tools-.*)$/;
const DATE = /^\d{4}-\d{2}-\d{2}$/;
const KINDS = ['leak', 'play'];
const OUTCOMES = {
  stop: { name: 'Stop losing money', sub: 'Waste and broken things, caught early' },
  get: { name: 'Get more customers', sub: 'Ads that find buyers for less' },
  convert: { name: 'Convert more visitors', sub: 'More of the traffic you pay for turns into orders' },
  more: { name: 'Make more from every customer', sub: 'Bigger orders and more repeat buys' },
  keep: { name: 'Keep more of each sale', sub: 'Margin, returns and discounts' },
};
const BANNED = /\b(game[- ]?changer|game[- ]?changing|unlock|leverage|supercharge|revolutionary|gooseworks)\b/i;

function words(s) {
  return String(s || '').trim().split(/\s+/).filter(Boolean).length;
}

function parse(file) {
  const text = fs.readFileSync(file, 'utf8');
  const m = text.match(/^---\n([\s\S]*?)\n---\n?/);
  if (!m) throw new Error(`${path.basename(file)}: no frontmatter`);
  return yaml.load(m[1]);
}

function validate(p, file, tools) {
  const e = [];
  const name = path.basename(file, '.md');
  const need = ['slug', 'kind', 'outcome', 'title', 'seo_title', 'meta_description', 'hook', 'answer', 'ask', 'then', 'example', 'check', 'cadence'];
  for (const f of need) if (typeof p[f] !== 'string' || !p[f].trim()) e.push(`missing ${f}`);
  if (p.slug !== name) e.push(`slug "${p.slug}" must equal file name "${name}"`);
  if (!SLUG.test(p.slug || '')) e.push('slug must be lowercase-hyphen');
  if (RESERVED.test(p.slug || '')) e.push('slug is reserved (md, tools, llms-txt, tool-*, tools-*)');
  // Quote it in YAML: an unquoted date parses to a Date and breaks --check across time zones.
  if (p.updated !== undefined && !(typeof p.updated === 'string' && DATE.test(p.updated))) e.push('updated must be a quoted "YYYY-MM-DD" string');
  if (!KINDS.includes(p.kind)) e.push(`kind must be ${KINDS.join('|')}`);
  if (!OUTCOMES[p.outcome]) e.push(`outcome must be ${Object.keys(OUTCOMES).join('|')}`);
  if (!Array.isArray(p.tools) || !p.tools.length) e.push('tools must be a non-empty list');
  else for (const t of p.tools) if (!tools[t]) e.push(`unknown tool ${t} (add it to tools.yaml)`);
  if ((p.seo_title || '').length > 65) e.push('seo_title over 65 chars');
  if ((p.meta_description || '').length > 165) e.push('meta_description over 165 chars');
  const w = words(p.answer);
  if (w < 35 || w > 70) e.push(`answer is ${w} words (want 40-60)`);
  if (!Array.isArray(p.steps) || p.steps.length < 3 || p.steps.length > 8) e.push('steps: 3-8 items');
  if (!Array.isArray(p.faq) || p.faq.length < 2) e.push('faq: 2+ items');
  else for (const f of p.faq) if (!f || !f.q || !f.a) e.push('faq items need q and a');
  const all = JSON.stringify(p);
  const hit = all.match(BANNED);
  if (hit) e.push(`banned word "${hit[0]}"`);
  return e.map((x) => `${name}.md: ${x}`);
}

function build() {
  const tools = yaml.load(fs.readFileSync(path.join(DIR, 'tools.yaml'), 'utf8'));
  const files = fs.readdirSync(DIR).filter((f) => f.endsWith('.md') && f !== 'README.md').sort();
  const errors = [];
  const playbooks = [];
  for (const f of files) {
    const file = path.join(DIR, f);
    let p;
    try {
      p = parse(file);
    } catch (err) {
      errors.push(err.message);
      continue;
    }
    errors.push(...validate(p, file, tools));
    playbooks.push(p);
  }
  const slugs = new Set(playbooks.map((p) => p.slug));
  for (const p of playbooks) for (const r of p.related || []) if (!slugs.has(r)) errors.push(`${p.slug}.md: related "${r}" is not a playbook`);
  for (const [k, t] of Object.entries(tools)) {
    if (!t.name || !SLUG.test(t.slug || '')) errors.push(`tools.yaml ${k}: needs name and slug`);
    if (t.hub && (!t.intro || !t.connect)) errors.push(`tools.yaml ${k}: hub needs intro and connect`);
  }
  // Stable order: start-here first, then leaks before plays, then by outcome order, then title.
  const oOrder = Object.keys(OUTCOMES);
  playbooks.sort((a, b) =>
    Number(Boolean(b.start)) - Number(Boolean(a.start)) ||
    KINDS.indexOf(a.kind) - KINDS.indexOf(b.kind) ||
    oOrder.indexOf(a.outcome) - oOrder.indexOf(b.outcome) ||
    // Plain code-point order: localeCompare differs between machines and breaks --check.
    (a.slug < b.slug ? -1 : a.slug > b.slug ? 1 : 0));
  const index = {
    version: 1,
    note: 'Generated by scripts/build-playbooks.js from playbooks/*.md and playbooks/tools.yaml. Do not edit by hand.',
    outcomes: OUTCOMES,
    tools,
    playbooks: playbooks.map((p) => ({
      id: p.id || p.slug,
      slug: p.slug,
      kind: p.kind,
      outcome: p.outcome,
      start: Boolean(p.start),
      title: p.title,
      seo_title: p.seo_title,
      meta_description: p.meta_description,
      hook: p.hook,
      answer: p.answer,
      tools: p.tools,
      ask: p.ask,
      then: p.then,
      steps: p.steps,
      example: p.example,
      check: p.check,
      cadence: p.cadence,
      faq: p.faq,
      related: p.related || [],
      updated: p.updated || null,
    })),
  };
  return { errors, json: `${JSON.stringify(index, null, 2)}\n` };
}

function main() {
  const { errors, json } = build();
  if (errors.length) {
    console.error(`Playbooks invalid:\n  ${errors.join('\n  ')}`);
    process.exit(1);
  }
  if (process.argv.includes('--check')) {
    const current = fs.existsSync(OUT) ? fs.readFileSync(OUT, 'utf8') : '';
    if (current !== json) {
      console.error('playbooks/playbooks-index.json is stale: run node scripts/build-playbooks.js');
      process.exit(1);
    }
    console.log('playbooks index up to date');
    return;
  }
  fs.writeFileSync(OUT, json);
  console.log(`wrote ${path.relative(ROOT, OUT)} (${JSON.parse(json).playbooks.length} playbooks)`);
}

if (require.main === module) main();
module.exports = { build };

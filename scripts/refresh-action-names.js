#!/usr/bin/env node
'use strict';

/**
 * Rebuilds scripts/lib/action-names.json from a gooseworks-app checkout, so
 * the tool-name check reads the same names the customer server lists.
 *
 *   node scripts/refresh-action-names.js --app ../gooseworks-app [--ref origin/main]
 *   node scripts/refresh-action-names.js --app ../gooseworks-app --check   (exit 1 on drift)
 *
 * It reads, at the given ref (default origin/main, what production runs):
 *   - lib/customer-tool-catalog.snapshot.json            -> actions (the listed tools)
 *   - lib/tool-contracts.ts PUBLIC_TOOL_REPLACEMENTS,
 *     lib/public-tool-calls.ts, lib/brand-knowledge-tool-names.ts,
 *     lib/tool-operation-replacements.ts, mcp-server/tool-tiers.ts
 *     COWORKER_TOOL_REPLACEMENTS and the alias defs       -> renamed (old name -> listed name)
 *   - mcp-tools/v2/live.ts RETIRED_TOOLS, tool-contracts REMOVED -> removed
 * Every renamed entry is followed to a listed name; one that ends on an
 * unlisted name is treated as removed.
 */

const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const OUT = path.join(__dirname, 'lib', 'action-names.json');
const API = 'apps/api/src';
const LIB = `${API}/app-mcp-server/lib`;

function args() {
  const out = { ref: 'origin/main', check: false };
  const argv = process.argv.slice(2);
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--app') out.app = argv[++i];
    else if (argv[i] === '--ref') out.ref = argv[++i];
    else if (argv[i] === '--check') out.check = true;
  }
  out.app = out.app || process.env.GOOSEWORKS_APP_DIR;
  if (!out.app) throw new Error('pass --app <gooseworks-app checkout> or set GOOSEWORKS_APP_DIR');
  return out;
}

const show = (app, ref, file) => execFileSync('git', ['-C', app, 'show', `${ref}:${file}`], { encoding: 'utf8' });

/** The `{ ... }` or `[ ... ]` body that follows `export const NAME`. */
function body(text, name) {
  const start = text.search(new RegExp(`export const ${name}\\b`));
  if (start < 0) throw new Error(`${name} not found`);
  const open = text.slice(start).search(/[{[]/) + start;
  let depth = 0;
  for (let i = open; i < text.length; i++) {
    if ('{['.includes(text[i])) depth++;
    if ('}]'.includes(text[i]) && --depth === 0) return text.slice(open, i + 1);
  }
  throw new Error(`${name} has no end`);
}

const pairs = (text) => Object.fromEntries([...text.matchAll(/^\s*([a-z][a-z0-9_]*):\s*"([a-z][a-z0-9_]*)"/gm)].map((m) => [m[1], m[2]]));
const strings = (text) => [...text.matchAll(/"([a-z][a-z0-9_]*)"/g)].map((m) => m[1]);

function main() {
  const { app, ref, check } = args();
  const snapshot = JSON.parse(show(app, ref, `${LIB}/customer-tool-catalog.snapshot.json`));
  const list = Array.isArray(snapshot) ? snapshot : snapshot.tools;
  const actions = [...new Set(list.map((t) => (typeof t === 'string' ? t : t.name)))].sort();
  const listed = new Set(actions);

  const edges = {};
  const add = (from, to) => { if (!listed.has(from) && !edges[from]) edges[from] = to; };
  for (const [from, to] of Object.entries(pairs(body(show(app, ref, `${LIB}/public-tool-calls.ts`), 'PUBLIC_TOOL_CALL_RENAMES')))) add(from, [to]);
  for (const [from, to] of Object.entries(pairs(body(show(app, ref, `${LIB}/brand-knowledge-tool-names.ts`), 'BRAND_KNOWLEDGE_TOOL_RENAMES')))) add(from, [to]);
  for (const [from, to] of Object.entries(pairs(body(show(app, ref, `${LIB}/tool-contracts.ts`), 'PUBLIC_TOOL_REPLACEMENTS')))) add(from, [to]);
  const operations = body(show(app, ref, `${LIB}/tool-operation-replacements.ts`), 'TOOL_OPERATION_REPLACEMENTS');
  for (const m of operations.matchAll(/([a-z][a-z0-9_]*):\s*\[([^\]]*)\]/g)) add(m[1], strings(m[2]));
  const setup = body(show(app, ref, `${LIB}/brand-setup-operations.ts`), 'BRAND_SETUP_TOOL_ACTIONS');
  add('brand_setup', Object.keys(pairs(setup)));
  for (const [from, to] of Object.entries(pairs(body(show(app, ref, `${API}/mcp-server/tool-tiers.ts`), 'COWORKER_TOOL_REPLACEMENTS')))) add(from, [to]);
  const defs = `${API}/app-mcp-server/mcp-tools/aliases/defs`;
  for (const file of execFileSync('git', ['-C', app, 'ls-tree', '--name-only', ref, `${defs}/`], { encoding: 'utf8' }).split('\n').filter(Boolean)) {
    for (const m of show(app, ref, file).matchAll(/^ {2}([a-z][a-z0-9_]*):\s*\{\s*target:\s*"([a-z][a-z0-9_]*)"/gm)) add(m[1], [m[2]]);
  }

  const retired = strings(body(show(app, ref, `${API}/app-mcp-server/mcp-tools/v2/live.ts`), 'RETIRED_TOOLS'));
  const removedMap = Object.keys(pairs(body(show(app, ref, `${LIB}/tool-contracts.ts`), 'REMOVED').replace(/:\s*\n\s*"/g, ': "')));

  /** Follow an old name to listed names; null when the chain ends unlisted. */
  function resolve(name, seen = new Set()) {
    if (listed.has(name)) return [name];
    if (seen.has(name) || !edges[name]) return null;
    seen.add(name);
    const out = edges[name].flatMap((next) => resolve(next, new Set(seen)) ?? []);
    return out.length ? [...new Set(out)] : null;
  }

  // The server's own "Renamed:" note (renamed-tools-instructions.ts) names one setup step for these two.
  edges.brand_onboarding = ['brand_setup_status'];
  edges.brand_create = ['brand_setup_create'];

  const renamed = {};
  const removed = new Set([...retired, ...removedMap]);
  for (const name of Object.keys(edges).sort()) {
    const to = resolve(name);
    if (to) renamed[name] = to.join(' / ');
    else removed.add(name);
  }

  const previous = fs.existsSync(OUT) ? JSON.parse(fs.readFileSync(OUT, 'utf8')) : {};
  // Names that were never server tools (planned v2 renames that did not ship) stay removed.
  for (const name of previous.removed ?? []) if (!listed.has(name) && !renamed[name]) removed.add(name);
  const notTools = previous.not_tools ?? {};

  const sha = execFileSync('git', ['-C', app, 'rev-parse', '--short', ref], { encoding: 'utf8' }).trim();
  const next = {
    $comment: previous.$comment,
    source_repo: 'gooseworks-app',
    source_ref: `${ref} @ ${sha}`,
    captured: new Date().toISOString().slice(0, 10),
    actions,
    renamed,
    removed: [...removed].filter((n) => !listed.has(n) && !notTools[n]).sort(),
    other_tools: previous.other_tools ?? {},
    not_tools: notTools,
  };

  if (check) {
    const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
    const drift = ['actions', 'renamed', 'removed'].filter((k) => !same(previous[k], next[k]));
    if (drift.length) {
      console.error(`action-names.json is out of date with ${ref} (${drift.join(', ')}). Run: node scripts/refresh-action-names.js --app <dir> --ref ${ref}`);
      process.exit(1);
    }
    console.log(`action-names.json matches ${ref} @ ${sha}: ${actions.length} listed, ${Object.keys(renamed).length} renamed, ${next.removed.length} removed`);
    return;
  }
  fs.writeFileSync(OUT, `${JSON.stringify(next, null, 2)}\n`);
  console.log(`wrote ${path.relative(process.cwd(), OUT)}: ${actions.length} listed, ${Object.keys(renamed).length} renamed, ${next.removed.length} removed`);
}

main();

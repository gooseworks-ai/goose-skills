#!/usr/bin/env node
'use strict';

/**
 * Part versions and the parts index (GV-29 for parts; part interface,
 * section 6).
 *
 *   node scripts/check-parts.js [--base <ref>]
 *
 * Errors:
 *   - parts/index.json differs from what build-parts-index.js writes;
 *   - a branch edits or deletes a file in a version folder that is already
 *     published on the base (a published version never changes);
 *   - a branch changes parts/<id>/src/ without adding a new version folder
 *     for that part;
 *   - parts/withdrawn.json is not a list of { id, version, reason } naming
 *     indexed versions;
 *   - parts/layers.json names a slot other than brand, captions, sound or
 *     check, or a version that is not indexed or is withdrawn;
 *   - part.no_billing_helper: any file of a part (source or published) is,
 *     imports or contains the billing helper (media_proxy, its proxy routes,
 *     its token or credentials file). A part orders paid pieces only through
 *     ctx.line.order, over the private line; it never carries its own billing.
 */

const fs = require('fs');
const path = require('path');
const lib = require('./lib/atoms');
const { buildIndex, render, SEMVER } = require('./build-parts-index');

const { ROOT } = lib;
const SLOTS = new Set(['brand', 'captions', 'sound', 'check']);
const PART_ID = /^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/;
const SKIP_DIRS = new Set(['node_modules', '.git', '__pycache__']);

// The billing helper by name, by import, or by what only it knows: the
// GooseWorks media proxy routes, its sandbox token and the CLI credentials.
const BILLING_FILE = /^media[_-]proxy(?:\.|$)/i;
const BILLING_TEXT = [
  /\bfrom\s+media_proxy\s+import\b/,
  /\bimport\s+media_proxy\b/,
  /\b(?:require|import)\s*\(\s*['"`][^'"`]*media[_-]proxy[^'"`]*['"`]\s*\)/,
  /\bfrom\s+['"`][^'"`]*media[_-]proxy[^'"`]*['"`]/,
  /\/api\/internal\/(?:fal|fal-storage|elevenlabs|openai)-proxy\b/,
  /\bGW_MEDIA_PROXY_TOKEN\b/,
  /\.gooseworks\/credentials\.json/,
];

/** part.no_billing_helper findings for every file under parts/<id>/. */
function billingHelperFindings(root) {
  const findings = [];
  const partsDir = path.join(root, 'parts');
  if (!fs.existsSync(partsDir)) return findings;
  const walk = (rel) => {
    for (const entry of fs.readdirSync(path.join(root, rel), { withFileTypes: true })) {
      const childRel = `${rel}/${entry.name}`;
      if (entry.isDirectory()) {
        if (!SKIP_DIRS.has(entry.name)) walk(childRel);
        continue;
      }
      if (!entry.isFile()) continue;
      if (BILLING_FILE.test(entry.name)) {
        findings.push(`part.no_billing_helper: ${childRel} is a copy of the billing helper; a part orders paid pieces only through ctx.line.order`);
        continue;
      }
      const bytes = fs.readFileSync(path.join(root, childRel));
      if (bytes.subarray(0, 8000).includes(0)) continue; // binary asset
      bytes
        .toString('utf8')
        .split(/\r?\n/)
        .forEach((line, i) => {
          if (BILLING_TEXT.some((re) => re.test(line))) {
            findings.push(
              `part.no_billing_helper: ${childRel}:${i + 1} uses the billing helper; a part orders paid pieces only through ctx.line.order`,
            );
          }
        });
    }
  };
  for (const id of fs.readdirSync(partsDir).sort()) {
    if (PART_ID.test(id) && fs.statSync(path.join(partsDir, id)).isDirectory()) walk(`parts/${id}`);
  }
  return findings;
}

function readJson(rel, fallback) {
  const abs = path.join(ROOT, rel);
  if (!fs.existsSync(abs)) return fallback;
  return JSON.parse(fs.readFileSync(abs, 'utf8'));
}

function parseArgs(argv) {
  const args = { base: null };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--base') args.base = argv[++i];
    else if (a.startsWith('--base=')) args.base = a.slice(7);
    else throw new Error(`unknown argument ${a}`);
  }
  return args;
}

function run(argv) {
  const args = parseArgs(argv);
  const errors = [];

  let entries = [];
  try {
    entries = buildIndex(ROOT);
  } catch (err) {
    errors.push(err.message);
  }
  const committed = path.join(ROOT, 'parts', 'index.json');
  const current = fs.existsSync(committed) ? fs.readFileSync(committed, 'utf8') : null;
  if (!errors.length && current !== render(entries)) {
    errors.push('parts/index.json is out of date; run node scripts/build-parts-index.js and commit it');
  }
  const indexed = new Set(entries.map((e) => `${e.id}@${e.version}`));
  errors.push(...billingHelperFindings(ROOT));

  const withdrawn = readJson('parts/withdrawn.json', []);
  const withdrawnKeys = new Set();
  if (!Array.isArray(withdrawn)) {
    errors.push('parts/withdrawn.json must be a list');
  } else {
    for (const w of withdrawn) {
      const ok = w && typeof w.id === 'string' && typeof w.version === 'string' && typeof w.reason === 'string' && w.reason.trim();
      if (!ok) {
        errors.push(`parts/withdrawn.json: each entry needs id, version and a reason (${JSON.stringify(w)})`);
        continue;
      }
      if (!indexed.has(`${w.id}@${w.version}`)) errors.push(`parts/withdrawn.json: ${w.id}@${w.version} is not a published version`);
      withdrawnKeys.add(`${w.id}@${w.version}`);
    }
  }

  const layers = readJson('parts/layers.json', null);
  if (layers !== null) {
    for (const [slot, ref] of Object.entries(layers)) {
      if (!SLOTS.has(slot)) {
        errors.push(`parts/layers.json: unknown slot ${slot}`);
        continue;
      }
      const key = ref && `${ref.id}@${ref.version}`;
      if (!ref || !indexed.has(key)) errors.push(`parts/layers.json: ${slot} names ${key || 'nothing'}, which is not a published version`);
      else if (withdrawnKeys.has(key)) errors.push(`parts/layers.json: ${slot} names withdrawn ${key}`);
    }
  }

  const base = lib.resolveBase(ROOT, args.base);
  if (base) {
    const changed = [...lib.changedFiles(ROOT, base)].filter((p) => p.startsWith('parts/'));
    const baseVersions = new Set();
    for (const p of lib.listFilesAt(ROOT, base, 'parts')) {
      const m = p.match(/^parts\/([^/]+)\/([^/]+)\//);
      if (m && SEMVER.test(m[2])) baseVersions.add(`${m[1]}@${m[2]}`);
    }
    const added = new Set(
      entries.map((e) => `${e.id}@${e.version}`).filter((key) => !baseVersions.has(key)),
    );
    const srcChanged = new Set();
    for (const p of changed) {
      const m = p.match(/^parts\/([^/]+)\/([^/]+)\//);
      if (!m) continue;
      const [, id, folder] = m;
      if (SEMVER.test(folder) && baseVersions.has(`${id}@${folder}`)) {
        errors.push(`${p}: ${id}@${folder} is published and frozen; put the change in a new version folder`);
      }
      if (folder === 'src') srcChanged.add(id);
    }
    for (const id of srcChanged) {
      if (![...added].some((key) => key.startsWith(`${id}@`))) {
        errors.push(`parts/${id}/src changed without a new version folder for ${id}`);
      }
    }
  }
  return { errors: [...new Set(errors)], entries, base };
}

if (require.main === module) {
  let result;
  try {
    result = run(process.argv.slice(2));
  } catch (err) {
    console.error(`check-parts: ${err.message}`);
    process.exit(2);
  }
  for (const e of result.errors) {
    console.error(`error ${e}`);
    if (process.env.GITHUB_ACTIONS) console.log(`::error::${e}`);
  }
  console.log(
    `Parts: ${result.entries.length} published versions, ${result.errors.length} errors${
      result.base ? `, compared with ${result.base.slice(0, 9)}` : ''
    }.`,
  );
  process.exit(result.errors.length ? 1 : 0);
}

module.exports = { run };

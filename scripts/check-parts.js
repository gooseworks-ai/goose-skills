#!/usr/bin/env node
'use strict';

/**
 * Part versions and the parts index (GV-29 for parts; part interface,
 * section 6).
 *
 *   node scripts/check-parts.js [--base <ref>] [--direct]
 *
 * --direct compares with <ref> itself instead of its merge base with HEAD
 * (CI: a pull request's base tip, or the tip a push replaced).
 *
 * Errors:
 *   - a part version build-parts-index.js refuses (manifest schema, files,
 *     symlinks), or parts/index.json differs from what it writes;
 *   - a branch edits or deletes a file in a version folder that is already
 *     published on the base (a published version never changes);
 *   - a branch changes parts/<id>/src/ without adding a new version folder
 *     for that part;
 *   - parts/index.json, withdrawn.json or layers.json is missing or does not
 *     fit its schema ({interface: 1, parts}, {interface: 1, withdrawn},
 *     {interface: 1, order, layers});
 *   - withdrawn.json names a version that was never published;
 *   - layers.json fills a slot with a version that is not published, is
 *     withdrawn, or is not a layer part for that slot;
 *   - part.no_billing_helper: any file of a part (source or published) is,
 *     imports or contains the billing helper (media_proxy, its proxy routes,
 *     its token or credentials file). A part orders paid pieces only through
 *     ctx.line.order, over the private line; it never carries its own billing.
 */

const fs = require('fs');
const path = require('path');
const lib = require('./lib/atoms');
const { buildIndex, render, readSchema, SEMVER } = require('./build-parts-index');
const { validate } = require('./lib/json-schema');

const { ROOT } = lib;
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

function readJson(rel) {
  const abs = path.join(ROOT, rel);
  if (!fs.existsSync(abs)) return { missing: true };
  try {
    return { value: JSON.parse(fs.readFileSync(abs, 'utf8')) };
  } catch (err) {
    return { error: `${rel} is not valid JSON: ${err.message}` };
  }
}

/** A registry file checked against its schema; null when it is missing or broken (errors pushed). */
function registryFile(rel, schemaName, errors) {
  const read = readJson(rel);
  if (read.missing) {
    errors.push(`${rel} is missing`);
    return null;
  }
  if (read.error) {
    errors.push(read.error);
    return null;
  }
  const problems = validate(readSchema(schemaName), read.value);
  if (problems.length) {
    errors.push(`${rel} does not fit ${schemaName}: ${problems.slice(0, 5).join('; ')}`);
    return null;
  }
  return read.value;
}

function parseArgs(argv) {
  const args = { base: null, direct: false };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--direct') args.direct = true;
    else if (a === '--base') args.base = argv[++i];
    else if (a.startsWith('--base=')) args.base = a.slice(7);
    else throw new Error(`unknown argument ${a}`);
  }
  return args;
}

// parts/<id>/<folder>, with or without a path below it: a symlinked version
// folder is one blob at parts/<id>/<x.y.z> in git.
const PART_PATH = /^parts\/([^/]+)\/([^/]+)(?:\/|$)/;

function run(argv) {
  const args = parseArgs(argv);
  const errors = [];

  let index = { interface: 1, parts: [] };
  let built = false;
  try {
    index = buildIndex(ROOT);
    built = true;
  } catch (err) {
    errors.push(err.message);
  }
  const entries = index.parts;
  const committed = registryFile('parts/index.json', 'parts-index.schema.json', errors);
  if (built && committed !== null) {
    const current = fs.readFileSync(path.join(ROOT, 'parts', 'index.json'), 'utf8');
    if (current !== render(index)) {
      errors.push('parts/index.json is out of date; run node scripts/build-parts-index.js and commit it');
    }
  }
  const byKey = new Map(entries.map((e) => [`${e.id}@${e.version}`, e]));
  errors.push(...billingHelperFindings(ROOT));

  const withdrawnKeys = new Set();
  const withdrawn = registryFile('parts/withdrawn.json', 'parts-withdrawn.schema.json', errors);
  for (const w of withdrawn ? withdrawn.withdrawn : []) {
    const key = `${w.id}@${w.version}`;
    if (!byKey.has(key)) errors.push(`parts/withdrawn.json: ${key} is not a published version`);
    withdrawnKeys.add(key);
  }

  const layers = registryFile('parts/layers.json', 'parts-layers.schema.json', errors);
  for (const [slot, ref] of Object.entries(layers ? layers.layers : {})) {
    const key = `${ref.id}@${ref.version}`;
    const entry = byKey.get(key);
    if (!entry) errors.push(`parts/layers.json: ${slot} names ${key}, which is not a published version`);
    else if (withdrawnKeys.has(key)) errors.push(`parts/layers.json: ${slot} names withdrawn ${key}`);
    else if (entry.layer !== slot) errors.push(`parts/layers.json: ${slot} names ${key}, whose part.json layer is ${entry.layer || 'not set'}`);
  }

  const base = lib.resolveBase(ROOT, args.base, { direct: args.direct });
  if (base) {
    const changed = [...lib.changedFiles(ROOT, base)].filter((p) => p.startsWith('parts/'));
    const baseVersions = new Set();
    for (const p of lib.listFilesAt(ROOT, base, 'parts')) {
      const m = p.match(PART_PATH);
      if (m && SEMVER.test(m[2])) baseVersions.add(`${m[1]}@${m[2]}`);
    }
    const added = [...byKey.keys()].filter((key) => !baseVersions.has(key));
    const srcChanged = new Set();
    for (const p of changed) {
      const m = p.match(PART_PATH);
      if (!m) continue;
      const [, id, folder] = m;
      if (SEMVER.test(folder) && baseVersions.has(`${id}@${folder}`)) {
        errors.push(`${p}: ${id}@${folder} is published and frozen; put the change in a new version folder`);
      }
      if (folder === 'src') srcChanged.add(id);
    }
    for (const id of srcChanged) {
      if (!added.some((key) => key.startsWith(`${id}@`))) {
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

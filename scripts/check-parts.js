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
 *     check, or a version that is not indexed or is withdrawn.
 */

const fs = require('fs');
const path = require('path');
const lib = require('./lib/atoms');
const { buildIndex, render, SEMVER } = require('./build-parts-index');

const { ROOT } = lib;
const SLOTS = new Set(['brand', 'captions', 'sound', 'check']);

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

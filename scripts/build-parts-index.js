#!/usr/bin/env node
'use strict';

/**
 * Build parts/index.json from the published part versions on disk.
 *
 *   node scripts/build-parts-index.js
 *
 * A published part version is a real folder parts/<id>/<x.y.z>/ holding its
 * part.json, part.mjs and assets (part interface, section 6). The index is
 *   { "interface": 1, "parts": [ entry, ... ] }
 * with one entry per version: what the kit loader, the studio sync and the
 * server's lock builder read (kind, layer slot, kit range, needs, cost,
 * determinism, the folder, the models the line may let it order) and a
 * sha256 for every file in the folder, part.json included.
 *
 * Refused, so nothing unpublishable reaches the index:
 *   - a part.json that does not fit the part manifest schema
 *     (parts/_contract/part-manifest.schema.json), whose inputs or outputs are
 *     not valid JSON Schemas themselves, or whose id and version are not its
 *     folder's;
 *   - a folder whose files differ from part.json's `files` (part.mjs always
 *     among them);
 *   - a symlink anywhere in a published version (the folder itself, or a file
 *     or folder inside it): a frozen version must be real files, or its bytes
 *     could change without its folder changing.
 * The written index is checked against schemas/parts-index.schema.json.
 * CI rebuilds it and fails when the committed file differs
 * (scripts/check-parts.js).
 */

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const { validate, schemaProblems } = require('./lib/json-schema');

const ROOT = process.env.GOOSE_SKILLS_ROOT
  ? path.resolve(process.env.GOOSE_SKILLS_ROOT)
  : path.resolve(__dirname, '..');
const SCHEMAS = path.resolve(__dirname, '..', 'schemas');
const SEMVER = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/;
const PART_ID = /^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/;

function readSchema(name) {
  return JSON.parse(fs.readFileSync(path.join(SCHEMAS, name), 'utf8'));
}

/** The part manifest schema: the parts contract copy, the one source the part lint reads too. */
function manifestSchema(root) {
  const contract = path.join(root, 'parts', '_contract', 'part-manifest.schema.json');
  if (!fs.existsSync(contract)) throw new Error('parts/_contract/part-manifest.schema.json is missing');
  return JSON.parse(fs.readFileSync(contract, 'utf8'));
}

function lstat(p) {
  try {
    return fs.lstatSync(p);
  } catch {
    return null;
  }
}

function compareVersions(a, b) {
  const pa = a.split('.').map(Number);
  const pb = b.split('.').map(Number);
  return pa[0] - pb[0] || pa[1] - pb[1] || pa[2] - pb[2];
}

/** Files in a published version folder, relative and sorted; throws on a symlink. */
function filesIn(dir, label) {
  const out = [];
  const walk = (rel) => {
    for (const entry of fs.readdirSync(path.join(dir, rel), { withFileTypes: true })) {
      const childRel = rel ? `${rel}/${entry.name}` : entry.name;
      if (entry.isSymbolicLink()) {
        throw new Error(`${label}/${childRel} is a symlink; a published version holds real files only`);
      }
      if (entry.isDirectory()) walk(childRel);
      else if (entry.isFile() && entry.name !== '.DS_Store') out.push(childRel);
    }
  };
  walk('');
  return out.sort();
}

/** [{ id, version, dir }] for every published version folder; throws on a symlinked one. */
function listVersions(root = ROOT) {
  const partsDir = path.join(root, 'parts');
  const top = lstat(partsDir);
  if (!top || !top.isDirectory()) return [];
  const versions = [];
  for (const id of fs.readdirSync(partsDir).sort()) {
    if (!PART_ID.test(id)) continue;
    const idStat = lstat(path.join(partsDir, id));
    if (idStat.isSymbolicLink()) throw new Error(`parts/${id} is a symlink; a part is a real folder`);
    if (!idStat.isDirectory()) continue;
    const names = fs.readdirSync(path.join(partsDir, id)).filter((v) => SEMVER.test(v)).sort(compareVersions);
    for (const version of names) {
      const dir = `parts/${id}/${version}`;
      const st = lstat(path.join(root, dir));
      if (st.isSymbolicLink()) throw new Error(`${dir} is a symlink; a published version is a real folder`);
      if (st.isDirectory()) versions.push({ id, version, dir });
    }
  }
  return versions;
}

/** The index entries, or throws on the first version that cannot be published. */
function buildEntries(root = ROOT) {
  const versions = listVersions(root);
  const schema = versions.length ? manifestSchema(root) : null;
  const entries = [];
  for (const { id, version, dir } of versions) {
    const abs = path.join(root, dir);
    const onDisk = filesIn(abs, dir);
    if (!onDisk.includes('part.json')) throw new Error(`${dir} has no part.json`);
    let manifest;
    try {
      manifest = JSON.parse(fs.readFileSync(path.join(abs, 'part.json'), 'utf8'));
    } catch (err) {
      throw new Error(`${dir}/part.json is not valid JSON: ${err.message}`);
    }
    const problems = validate(schema, manifest);
    if (problems.length) {
      throw new Error(`${dir}/part.json does not fit the part manifest schema: ${problems.slice(0, 5).join('; ')}`);
    }
    for (const side of ['inputs', 'outputs']) {
      const declared = schemaProblems(manifest[side], side);
      if (declared.length) {
        throw new Error(`${dir}/part.json ${side} is not a valid JSON Schema: ${declared.slice(0, 5).join('; ')}`);
      }
    }
    if (manifest.id !== id || manifest.version !== version) {
      throw new Error(`${dir}/part.json says ${manifest.id}@${manifest.version}; the folder says ${id}@${version}`);
    }
    const listed = [...new Set(['part.json', ...manifest.files])].sort();
    const missing = listed.filter((f) => !onDisk.includes(f));
    const extra = onDisk.filter((f) => !listed.includes(f));
    if (missing.length || extra.length) {
      throw new Error(
        `${dir}: part.json files must match the folder (missing: ${missing.join(', ') || 'none'}; not listed: ${extra.join(', ') || 'none'})`,
      );
    }
    const files = {};
    for (const rel of listed) {
      files[rel] = crypto.createHash('sha256').update(fs.readFileSync(path.join(abs, rel))).digest('hex');
    }
    entries.push({
      id,
      version,
      interface: manifest.interface,
      kind: manifest.kind,
      ...(manifest.layer !== undefined ? { layer: manifest.layer } : {}),
      kit: manifest.kit,
      needs: manifest.needs,
      cost: manifest.cost,
      determinism: manifest.determinism,
      path: dir,
      files,
      models: manifest.needs.models,
    });
  }
  return entries;
}

/** The whole index object, checked against its schema. */
function buildIndex(root = ROOT) {
  const index = { interface: 1, parts: buildEntries(root) };
  const problems = validate(readSchema('parts-index.schema.json'), index);
  if (problems.length) throw new Error(`the built index does not fit its schema: ${problems.slice(0, 5).join('; ')}`);
  return index;
}

function render(index) {
  return `${JSON.stringify(index, null, 2)}\n`;
}

if (require.main === module) {
  try {
    const index = buildIndex();
    fs.mkdirSync(path.join(ROOT, 'parts'), { recursive: true });
    fs.writeFileSync(path.join(ROOT, 'parts', 'index.json'), render(index));
    console.log(`Wrote parts/index.json with ${index.parts.length} part versions.`);
  } catch (err) {
    console.error(`build-parts-index: ${err.message}`);
    process.exit(1);
  }
}

module.exports = { buildIndex, listVersions, render, readSchema, SEMVER };

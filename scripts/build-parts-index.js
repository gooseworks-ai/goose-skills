#!/usr/bin/env node
'use strict';

/**
 * Build parts/index.json from the published part versions on disk.
 *
 *   node scripts/build-parts-index.js
 *
 * A published part version is a folder parts/<id>/<x.y.z>/ holding its
 * part.json, part.mjs and assets (part interface, section 6). The index
 * lists every one with what the kit, the style validator and the server's
 * lock need: kind, layer slot, kit range, needs, cost, determinism and a
 * sha256 for every file in the folder (part.json included). CI rebuilds it
 * and fails when the committed file differs (scripts/check-parts.js).
 */

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const ROOT = process.env.GOOSE_SKILLS_ROOT
  ? path.resolve(process.env.GOOSE_SKILLS_ROOT)
  : path.resolve(__dirname, '..');
const PARTS = path.join(ROOT, 'parts');
const SEMVER = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/;
const PART_ID = /^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/;

function isDir(p) {
  try {
    return fs.statSync(p).isDirectory();
  } catch {
    return false;
  }
}

function semverKey(v) {
  return v.split('.').map(Number);
}

function filesIn(dir) {
  const out = [];
  const walk = (rel) => {
    for (const entry of fs.readdirSync(path.join(dir, rel), { withFileTypes: true })) {
      const childRel = rel ? `${rel}/${entry.name}` : entry.name;
      if (entry.isDirectory()) walk(childRel);
      else if (entry.isFile() && entry.name !== '.DS_Store') out.push(childRel);
    }
  };
  walk('');
  return out.sort();
}

/** [{ id, version, dir }] for every published version folder. */
function listVersions(root = ROOT) {
  const partsDir = path.join(root, 'parts');
  if (!isDir(partsDir)) return [];
  const versions = [];
  for (const id of fs.readdirSync(partsDir).sort()) {
    if (!PART_ID.test(id) || !isDir(path.join(partsDir, id))) continue;
    for (const version of fs.readdirSync(path.join(partsDir, id))) {
      if (SEMVER.test(version) && isDir(path.join(partsDir, id, version))) {
        versions.push({ id, version, dir: `parts/${id}/${version}` });
      }
    }
  }
  return versions;
}

/** The index entries, or throws on a folder whose part.json does not match it. */
function buildIndex(root = ROOT) {
  const entries = [];
  for (const { id, version, dir } of listVersions(root)) {
    const abs = path.join(root, dir);
    const manifestPath = path.join(abs, 'part.json');
    if (!fs.existsSync(manifestPath)) throw new Error(`${dir} has no part.json`);
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    if (manifest.id !== id || manifest.version !== version) {
      throw new Error(`${dir}/part.json says ${manifest.id}@${manifest.version}; the folder says ${id}@${version}`);
    }
    const files = {};
    for (const rel of filesIn(abs)) {
      files[rel] = crypto.createHash('sha256').update(fs.readFileSync(path.join(abs, rel))).digest('hex');
    }
    const listed = Array.isArray(manifest.files) ? [...manifest.files, 'part.json'] : null;
    if (listed) {
      const missing = listed.filter((f) => !(f in files));
      const extra = Object.keys(files).filter((f) => !listed.includes(f));
      if (missing.length || extra.length) {
        throw new Error(
          `${dir}: part.json files must match the folder (missing: ${missing.join(', ') || 'none'}; not listed: ${extra.join(', ') || 'none'})`,
        );
      }
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
    });
  }
  return entries.sort((a, b) => {
    if (a.id !== b.id) return a.id < b.id ? -1 : 1;
    const ka = semverKey(a.version);
    const kb = semverKey(b.version);
    for (let i = 0; i < 3; i++) if (ka[i] !== kb[i]) return ka[i] - kb[i];
    return 0;
  });
}

function render(entries) {
  return `${JSON.stringify(entries, null, 2)}\n`;
}

if (require.main === module) {
  try {
    const entries = buildIndex();
    fs.mkdirSync(PARTS, { recursive: true });
    fs.writeFileSync(path.join(PARTS, 'index.json'), render(entries));
    console.log(`Wrote parts/index.json with ${entries.length} part versions.`);
  } catch (err) {
    console.error(`build-parts-index: ${err.message}`);
    process.exit(1);
  }
}

module.exports = { buildIndex, listVersions, render, SEMVER };

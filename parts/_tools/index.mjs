#!/usr/bin/env node
// Writes or checks parts/index.json: one entry per published part version,
// with the sha256 of every file in its frozen folder (part.json included),
// its kind, kit range and the models it may order. Our server builds each
// video's PartsLock from this file, layers.json and withdrawn.json.
//
//   node parts/_tools/index.mjs           rewrite parts/index.json
//   node parts/_tools/index.mjs --check   fail when it is out of date
import { createHash } from 'node:crypto';
import { existsSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const PARTS = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const SEMVER = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/;

function compareVersions(a, b) {
  const pa = a.split('.').map(Number);
  const pb = b.split('.').map(Number);
  return pa[0] - pb[0] || pa[1] - pb[1] || pa[2] - pb[2];
}

/** Every published version folder: [{ id, version, dir }]. */
export function versionFolders(partsRoot = PARTS) {
  const out = [];
  for (const id of readdirSync(partsRoot).sort()) {
    const dir = join(partsRoot, id);
    if (id.startsWith('_') || !statSync(dir).isDirectory()) continue;
    for (const version of readdirSync(dir).filter((v) => SEMVER.test(v)).sort(compareVersions)) {
      if (existsSync(join(dir, version, 'part.json'))) out.push({ id, version, dir: join(dir, version) });
    }
  }
  return out;
}

function sha256File(path) {
  return createHash('sha256').update(readFileSync(path)).digest('hex');
}

/**
 * The index entry for one version folder, from its part.json: what the kit,
 * the style validator and the server's lock read (kind, layer slot, kit range,
 * needs, cost, determinism, the models the line may let it order) and a
 * sha256 for every file in the folder, part.json included.
 */
export function indexEntry(folder) {
  const manifest = JSON.parse(readFileSync(join(folder.dir, 'part.json'), 'utf8'));
  const files = {};
  for (const rel of ['part.json', ...(manifest.files || [])].sort()) {
    const abs = join(folder.dir, rel);
    files[rel] = existsSync(abs) ? sha256File(abs) : null;
  }
  return {
    id: manifest.id,
    version: manifest.version,
    interface: manifest.interface,
    kind: manifest.kind,
    ...(manifest.layer !== undefined ? { layer: manifest.layer } : {}),
    kit: manifest.kit,
    needs: manifest.needs,
    cost: manifest.cost,
    determinism: manifest.determinism,
    path: `parts/${folder.id}/${folder.version}`,
    files,
    models: (manifest.needs && manifest.needs.models) || [],
  };
}

export function buildIndex(partsRoot = PARTS) {
  return { interface: 1, parts: versionFolders(partsRoot).map(indexEntry) };
}

export function indexText(partsRoot = PARTS) {
  return `${JSON.stringify(buildIndex(partsRoot), null, 2)}\n`;
}

function main(argv) {
  const target = join(PARTS, 'index.json');
  const want = indexText();
  if (argv[0] === '--check') {
    const have = existsSync(target) ? readFileSync(target, 'utf8') : '';
    if (have !== want) {
      console.error('parts/index.json is out of date: run node parts/_tools/index.mjs');
      process.exitCode = 1;
    }
    return;
  }
  writeFileSync(target, want);
  console.log(`wrote parts/index.json (${buildIndex().parts.length} versions)`);
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main(process.argv.slice(2));

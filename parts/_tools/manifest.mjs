#!/usr/bin/env node
// Writes a part's part.json from parts/<id>/src/manifest.mjs, which builds it
// from the shared fragments in parts/_tools/schemas.mjs (so every layer takes
// exactly the same inputs). Parts whose src has no manifest.mjs keep a
// hand-written part.json.
//
//   node parts/_tools/manifest.mjs <part-id> <version>
import { existsSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const PARTS = resolve(dirname(fileURLToPath(import.meta.url)), '..');

/** The part.json text for a part's src/manifest.mjs, or null when it has none. */
export async function manifestText(id) {
  const src = join(PARTS, id, 'src', 'manifest.mjs');
  if (!existsSync(src)) return null;
  const { manifest } = await import(pathToFileURL(src).href);
  return `${JSON.stringify(manifest, null, 2)}\n`;
}

async function main([id, version]) {
  const text = await manifestText(id);
  if (!text) throw new Error(`${id} has no src/manifest.mjs`);
  const manifest = JSON.parse(text);
  if (manifest.version !== version) throw new Error(`src/manifest.mjs says ${manifest.version}, not ${version}`);
  writeFileSync(join(PARTS, id, version, 'part.json'), text);
  console.log(`wrote ${id}/${version}/part.json`);
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) await main(process.argv.slice(2));

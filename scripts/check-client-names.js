#!/usr/bin/env node
'use strict';

/**
 * Client-name guard: no real client, brand or person name in any tracked text
 * file of this public repo.
 *
 *   node scripts/check-client-names.js
 *
 * The names are kept only as SHA-256 digests (scripts/lib/client-name-hashes.json),
 * the same way render-podcast-skit/scripts/gates.py keeps its brand list, so this
 * repo never spells them out. Each line is lower-cased and split into words
 * ([a-z0-9]+); every run of 1..n words, joined with one space, is hashed and
 * looked up. So a name matches as whole words only (the fictional canary
 * "gwcanaryclient" never matches inside "xgwcanaryclient"), in any case, and
 * across "-", "/", "." or "_" ("gw-canary-client", "clients/gw/canary/client",
 * "gwcanaryclient.com").
 *
 * Skipped, an accepted risk (owner decision D4, 24 Oct 2026):
 *   - frozen part versions, parts/<id>/<x.y.z>/: they are immutable, and
 *     approved videos pin them, so a fix means a new part version;
 *   - parts/_lib/: it is copied into every frozen part version when one is
 *     cut, so it changes only with new part versions too.
 *   - parts/<id>/src/: the newest frozen version is built from it byte for
 *     byte, so it too changes only with a new part version.
 * Part tests and everything else are scanned. When a part gets a new version,
 * clean its src/ and _lib/ text first.
 *
 * GOOSE_SKILLS_ROOT points the scan at another checkout (tests).
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { execFileSync } = require('child_process');

const ROOT = process.env.GOOSE_SKILLS_ROOT
  ? path.resolve(process.env.GOOSE_SKILLS_ROOT)
  : path.resolve(__dirname, '..');
const HASHES = path.join(__dirname, 'lib', 'client-name-hashes.json');

const SKIP = [
  /^parts\/[^/]+\/\d+\.\d+\.\d+\//, // frozen part versions
  /^parts\/_lib\//, // bundled into frozen part versions
  /^parts\/[^/]+\/src\//, // the build source of the newest frozen version; changes only with a new version
];
const MAX_BYTES = 8 * 1024 * 1024;

function sha256(text) {
  return crypto.createHash('sha256').update(text).digest('hex');
}

function loadHashes({ canaries = false } = {}) {
  const doc = JSON.parse(fs.readFileSync(HASHES, 'utf8'));
  const list = [...doc.hashes, ...(canaries ? doc.canaries || [] : [])];
  return { wanted: new Set(list.map((h) => h.sha256)), sizes: [...new Set(list.map((h) => h.words))].sort((a, b) => a - b) };
}

/** Hits in one text: [{ line, text }] where text is the matched words as written. */
function scanText(text, { wanted, sizes }) {
  const hits = [];
  const lines = text.split('\n');
  for (let i = 0; i < lines.length; i++) {
    const original = lines[i];
    const words = [...original.toLowerCase().matchAll(/[a-z0-9]+/g)];
    for (let start = 0; start < words.length; start++) {
      for (const n of sizes) {
        if (start + n > words.length) break;
        const run = words.slice(start, start + n);
        if (!wanted.has(sha256(run.map((m) => m[0]).join(' ')))) continue;
        const from = run[0].index;
        const to = run[n - 1].index + run[n - 1][0].length;
        hits.push({ line: i + 1, text: original.slice(from, to) });
      }
    }
  }
  return hits;
}

function trackedFiles() {
  return execFileSync('git', ['ls-files', '-z'], { cwd: ROOT, encoding: 'utf8', maxBuffer: 256 * 1024 * 1024 })
    .split('\0')
    .filter(Boolean);
}

function run({ canaries = false } = {}) {
  const hashes = loadHashes({ canaries });
  const hits = [];
  let scanned = 0;
  for (const rel of trackedFiles()) {
    if (SKIP.some((re) => re.test(rel))) continue;
    const abs = path.join(ROOT, rel);
    let buf;
    try {
      if (fs.statSync(abs).size > MAX_BYTES) continue;
      buf = fs.readFileSync(abs);
    } catch {
      continue; // deleted in the working tree
    }
    if (buf.subarray(0, 8192).includes(0)) continue; // binary
    scanned++;
    for (const hit of scanText(buf.toString('utf8'), hashes)) hits.push({ file: rel, ...hit });
  }
  return { hits, scanned };
}

if (require.main === module) {
  const { hits, scanned } = run({ canaries: process.argv.includes('--with-canaries') });
  for (const h of hits) {
    console.error(`${h.file}:${h.line}: a real client or person name ("${h.text}")`);
    if (process.env.GITHUB_ACTIONS) console.log(`::error file=${h.file},line=${h.line}::a real client or person name; use a fictional one`);
  }
  if (hits.length) {
    console.error(`\nClient-name guard failed: ${hits.length} hit(s) in ${new Set(hits.map((h) => h.file)).size} file(s). Use a fictional name.`);
    process.exit(1);
  }
  console.log(`Client-name guard passed: ${scanned} text files, no real client or person names.`);
}

module.exports = { scanText, loadHashes, run, sha256 };

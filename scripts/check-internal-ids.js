#!/usr/bin/env node
'use strict';

/**
 * No internal ticket ids in what the catalog publishes.
 *
 *   node scripts/check-internal-ids.js   (run after build-index.js)
 *
 * Reads every file skills-index.json publishes (each skill's and each
 * collection's `files`) and fails on a Linear-style ticket id from the
 * GooseWorks trackers (GOOSE-123, GV-29, QA-60, ENG-…, GW-…, LAB-…, OPS-…).
 * A reader outside the team cannot open them, and they date fast: say what
 * the rule is, not which ticket made it.
 *
 * Out of scope: this repo's tooling (scripts/, test/, .github/) and docs are
 * not published, so they may cite the ticket a rule came from. ALLOW lists
 * any published file that must keep one, with the reason.
 *
 * GOOSE_SKILLS_ROOT points the check at another checkout (tests).
 */

const fs = require('fs');
const path = require('path');

const ROOT = process.env.GOOSE_SKILLS_ROOT
  ? path.resolve(process.env.GOOSE_SKILLS_ROOT)
  : path.resolve(__dirname, '..');

// The GooseWorks Linear team keys. Uppercase ids that are not tickets (UTF-8,
// SHA-256, ISO-8601, STEP-3) are not matched.
const TEAMS = ['GOOSE', 'GV', 'QA', 'ENG', 'GW', 'LAB', 'OPS'];
const TICKET = new RegExp(`(?<![A-Za-z0-9_-])(?:${TEAMS.join('|')})-\\d+(?![A-Za-z0-9_])`, 'g');

// Published paths (or folder prefixes ending in "/") allowed to keep an id: { path: reason }.
const ALLOW = {
  'scripts/': 'repo tooling, never published (listed so a broader scan keeps it out)',
};

const MAX_BYTES = 8 * 1024 * 1024;

function allowed(file) {
  return Object.keys(ALLOW).some((p) => (p.endsWith('/') ? file.startsWith(p) : file === p));
}

function run() {
  const index = JSON.parse(fs.readFileSync(path.join(ROOT, 'skills-index.json'), 'utf8'));
  const files = new Set();
  for (const entry of [...(index.skills || []), ...(index.collections || [])]) for (const f of entry.files || []) files.add(f);
  const hits = [];
  let scanned = 0;
  for (const rel of [...files].sort()) {
    if (allowed(rel)) continue;
    const abs = path.join(ROOT, rel);
    let buf;
    try {
      if (fs.statSync(abs).size > MAX_BYTES) continue;
      buf = fs.readFileSync(abs);
    } catch {
      continue;
    }
    if (buf.subarray(0, 8192).includes(0)) continue; // binary
    scanned++;
    buf
      .toString('utf8')
      .split('\n')
      .forEach((line, i) => {
        for (const m of line.matchAll(TICKET)) hits.push({ file: rel, line: i + 1, id: m[0] });
      });
  }
  return { hits, scanned };
}

if (require.main === module) {
  const { hits, scanned } = run();
  for (const h of hits) {
    console.error(`${h.file}:${h.line}: internal ticket id ${h.id}`);
    if (process.env.GITHUB_ACTIONS) console.log(`::error file=${h.file},line=${h.line}::internal ticket id ${h.id}; say what the rule is instead`);
  }
  if (hits.length) {
    console.error(`\nInternal ticket ids: ${hits.length} in ${new Set(hits.map((h) => h.file)).size} published file(s). Say what the rule is, not which ticket made it.`);
    process.exit(1);
  }
  console.log(`Internal ticket ids: none in ${scanned} published text files.`);
}

module.exports = { run, TICKET };

#!/usr/bin/env node
'use strict';

/**
 * Fail a test run that skipped anything or ran nothing.
 *
 *   node scripts/require-all-tests-ran.js <log>
 *
 * Reads the summary node --test prints at the end of <log> (the spec
 * reporter's "ℹ tests 233" lines or the TAP reporter's "# tests 233") and
 * exits 1 when no summary is found, no test ran, or any test was skipped or
 * left as todo. CI uses it for the part tests, whose media and browser tests
 * skip themselves when a tool is missing: a job that passes by skipping
 * proves nothing.
 */

const fs = require('fs');

function summary(text) {
  const counts = {};
  for (const m of text.matchAll(/^(?:ℹ|#) (tests|pass|fail|skipped|todo|cancelled) (\d+)\s*$/gm)) {
    counts[m[1]] = Number(m[2]);
  }
  return counts;
}

function problems(counts) {
  if (counts.tests === undefined) return ['no test summary found'];
  const out = [];
  if (counts.tests === 0) out.push('no tests ran');
  if (counts.skipped) out.push(`${counts.skipped} skipped`);
  if (counts.todo) out.push(`${counts.todo} left as todo`);
  return out;
}

if (require.main === module) {
  const file = process.argv[2];
  if (!file) {
    console.error('usage: require-all-tests-ran.js <log>');
    process.exit(2);
  }
  const counts = summary(fs.readFileSync(file, 'utf8'));
  const found = problems(counts);
  if (found.length) {
    console.error(`Every test must run: ${found.join(', ')}.`);
    if (process.env.GITHUB_ACTIONS) console.log(`::error::Every test must run: ${found.join(', ')}.`);
    process.exit(1);
  }
  console.log(`All ${counts.tests} tests ran; none skipped.`);
}

module.exports = { summary, problems };

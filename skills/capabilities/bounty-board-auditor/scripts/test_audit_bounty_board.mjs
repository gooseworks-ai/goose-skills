#!/usr/bin/env node

import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const skillDir = path.resolve(scriptDir, '..');
const scriptPath = path.join(scriptDir, 'audit_bounty_board.mjs');
const samplePath = path.join(skillDir, 'examples', 'sample-listings.md');

const output = execFileSync(
  process.execPath,
  [scriptPath, '--input', samplePath, '--offline'],
  { encoding: 'utf8' },
);
const selfTestOutput = execFileSync(
  process.execPath,
  [scriptPath, '--input', samplePath, '--self-test'],
  { encoding: 'utf8' },
);

assert.match(output, /^# Bounty Board Audit/m);
assert.match(output, /Audited 4 GitHub issue listings\./);
assert.match(output, /storybookjs\/storybook#12641/);
assert.match(output, /rodrigompy\/bugb#1/);
assert.match(output, /jaseg\/python-mpv#61/);
assert.match(output, /jbilcke-hf\/clapper#5/);
assert.equal((output.match(/needs-reconfirmation/g) || []).length, 8);
assert.doesNotMatch(output, /closed-on-github|repo-archived|withdrawn|active/);
assert.match(selfTestOutput, /classification self-test passed/);

console.log('bounty-board-auditor offline smoke test passed');

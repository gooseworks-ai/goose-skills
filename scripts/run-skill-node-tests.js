#!/usr/bin/env node
'use strict';

/**
 * Runs the Node tests that live inside skill folders, so a skill's own test
 * runs in CI without anyone editing a list.
 *
 *   node scripts/run-skill-node-tests.js   (part of npm test)
 *
 * Found: skills/<family>/<slug>/tests/**\/*.test.js and *.test.mjs. They must
 * run offline with Node alone. A test that needs a browser is named otherwise
 * (render-imessage-chat's tests/test_*.js) and runs in its own CI job.
 *
 * GOOSE_SKILLS_ROOT points it at another checkout (tests).
 */

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const ROOT = process.env.GOOSE_SKILLS_ROOT
  ? path.resolve(process.env.GOOSE_SKILLS_ROOT)
  : path.resolve(__dirname, '..');
const SKIP = new Set(['node_modules', '.git', '__pycache__', '.tmp']);
const TEST_FILE = /\.test\.(js|mjs)$/;

function walk(dir, out) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const abs = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (!SKIP.has(entry.name)) walk(abs, out);
    } else if (TEST_FILE.test(entry.name)) out.push(abs);
  }
  return out;
}

function findTests(root = ROOT) {
  const found = [];
  const skills = path.join(root, 'skills');
  if (!fs.existsSync(skills)) return found;
  for (const family of fs.readdirSync(skills).sort()) {
    const familyDir = path.join(skills, family);
    if (!fs.statSync(familyDir).isDirectory()) continue;
    for (const slug of fs.readdirSync(familyDir).sort()) {
      const tests = path.join(familyDir, slug, 'tests');
      if (fs.existsSync(tests) && fs.statSync(tests).isDirectory()) walk(tests, found);
    }
  }
  return found.sort();
}

if (require.main === module) {
  const files = findTests();
  if (!files.length) {
    console.log('Skill Node tests: none in skills/*/*/tests/ (name them *.test.js or *.test.mjs to run here).');
    process.exit(0);
  }
  console.log(`Skill Node tests: ${files.length} file(s)\n${files.map((f) => `  ${path.relative(ROOT, f)}`).join('\n')}`);
  const res = spawnSync(process.execPath, ['--test', ...files], { cwd: ROOT, stdio: 'inherit' });
  process.exit(res.status === null ? 1 : res.status);
}

module.exports = { findTests };

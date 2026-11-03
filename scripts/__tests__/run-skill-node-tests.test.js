'use strict';

// run-skill-node-tests.js finds *.test.js / *.test.mjs in skill tests/ folders
// and fails when one fails.

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const SCRIPT = path.resolve(__dirname, '..', 'run-skill-node-tests.js');

function fixture(files) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'gs-skill-tests-'));
  for (const [rel, text] of Object.entries(files)) {
    fs.mkdirSync(path.dirname(path.join(root, rel)), { recursive: true });
    fs.writeFileSync(path.join(root, rel), text);
  }
  return root;
}

function runIn(root) {
  const env = { ...process.env, GOOSE_SKILLS_ROOT: root };
  delete env.NODE_TEST_CONTEXT; // let the child run its own test runner
  const res = spawnSync(process.execPath, [SCRIPT], { env, encoding: 'utf8' });
  return { code: res.status, out: `${res.stdout}${res.stderr}` };
}

const PASS = "require('node:test')('ok', () => {});\n";
const FAIL = "require('node:test')('broken', () => { throw new Error('boom'); });\n";

test('finds tests at any depth of a skill tests/ folder, in every family, and runs them', () => {
  const root = fixture({
    'skills/marketing/plan-launch/tests/plan.test.js': PASS,
    'skills/video/clip/tests/unit/clip.test.mjs': "import test from 'node:test';\ntest('ok', () => {});\n",
    'skills/video/chat/tests/test_chat.js': FAIL, // a browser test: another job runs it
    'skills/video/chat/scripts/helper.test.js': FAIL, // not in tests/
    'skills/video/chat/tests/node_modules/dep/x.test.js': FAIL,
  });
  const res = runIn(root);
  assert.equal(res.code, 0, res.out);
  assert.match(res.out, /Skill Node tests: 2 file\(s\)/);
  assert.match(res.out, /skills\/marketing\/plan-launch\/tests\/plan\.test\.js/);
  assert.match(res.out, /skills\/video\/clip\/tests\/unit\/clip\.test\.mjs/);
});

test('a failing skill test fails the run', () => {
  const res = runIn(fixture({ 'skills/shared/notes/tests/notes.test.js': FAIL }));
  assert.equal(res.code, 1, res.out);
});

test('no skill tests is not an error', () => {
  const res = runIn(fixture({ 'skills/marketing/plan-launch/SKILL.md': '# x\n' }));
  assert.equal(res.code, 0, res.out);
  assert.match(res.out, /none in skills\/\*\/\*\/tests\//);
});

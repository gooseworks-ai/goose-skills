'use strict';

// check-internal-ids.js against a fixture index: ticket ids in published files fail.

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const SCRIPT = path.resolve(__dirname, '..', 'check-internal-ids.js');

function fixture(files, { unpublished = {} } = {}) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'gs-ids-'));
  const write = (rel, text) => {
    fs.mkdirSync(path.dirname(path.join(root, rel)), { recursive: true });
    fs.writeFileSync(path.join(root, rel), text);
  };
  for (const [rel, text] of Object.entries({ ...files, ...unpublished })) write(rel, text);
  write('skills-index.json', JSON.stringify({ skills: [{ slug: 'clip', path: 'skills/video/clip', files: Object.keys(files) }], collections: [] }));
  return root;
}

function check(root) {
  const res = spawnSync(process.execPath, [SCRIPT], { env: { ...process.env, GOOSE_SKILLS_ROOT: root, GITHUB_ACTIONS: '' }, encoding: 'utf8' });
  return { code: res.status, out: `${res.stdout}${res.stderr}` };
}

test('a ticket id in any published file fails, with file and line', () => {
  const root = fixture({
    'skills/video/clip/SKILL.md': '# clip\nKeep the hook short (GOOSE-4014).\n',
    'skills/video/clip/scripts/run.py': '# fixed in GV-29 and QA-60\n',
  });
  const res = check(root);
  assert.equal(res.code, 1, res.out);
  assert.match(res.out, /skills\/video\/clip\/SKILL\.md:2: internal ticket id GOOSE-4014/);
  assert.match(res.out, /skills\/video\/clip\/scripts\/run\.py:1: internal ticket id GV-29/);
  assert.match(res.out, /run\.py:1: internal ticket id QA-60/);
});

test('uppercase ids that are not tickets pass, and unpublished files are not read', () => {
  const root = fixture(
    { 'skills/video/clip/SKILL.md': '# clip\nUTF-8 text, SHA-256 digests, ISO-8601 dates, STEP-3, MY-GOOSE-12, GOOSE-12a.\n' },
    { unpublished: { 'scripts/check.js': '// GV-29\n', 'skills/video/clip/tests/notes.md': 'GOOSE-1\n' } },
  );
  const res = check(root);
  assert.equal(res.code, 0, res.out);
  assert.match(res.out, /none in 1 published text files/);
});

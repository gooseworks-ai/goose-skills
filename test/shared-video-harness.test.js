const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { createHash } = require('node:crypto');

const root = path.join(__dirname, '..', 'skills', 'ads', 'playbooks', 'video-production-harness');
const read = rel => fs.readFileSync(path.join(root, rel), 'utf8');
const hash = data => createHash('sha256').update(data).digest('hex');

test('generated production package matches its published provenance', () => {
  const release = JSON.parse(read('release.json'));
  assert.equal(release.schema_version, 1);
  assert.equal(release.slug, 'video-production-harness');
  assert.match(release.source_commit, /^[0-9a-f]{40}$/);
  assert.match(release.source_hash, /^[0-9a-f]{64}$/);
  for (const [rel, expected] of Object.entries(release.files)) {
    assert.equal(path.isAbsolute(rel), false);
    assert.equal(rel.split('/').includes('..'), false);
    const data = fs.readFileSync(path.join(root, rel));
    assert.equal(hash(data), expected.sha256, rel);
    assert.equal(data.length, expected.bytes, rel);
  }
  for (const [rel, source] of Object.entries(release.source_files)) {
    assert.equal(hash(fs.readFileSync(path.join(root, rel))), source.sha256, rel);
  }
});

test('shared package includes complete production steps and actual local helpers', () => {
  for (const step of ['orchestrator', 'capabilities', 'preflight-audit', 'brainstorm', 'create-design-brief', 'lock-script', 'create-storyboard', 'lock-character', 'create-clips', 'edit-clip', 'edit-video', 'review-video', 'polish', 'promote', 'auto-refine', 'auto-fix-from-review-notes', 'wrap-session']) {
    assert.ok(read(`${step}.md`).trim(), step);
  }
  assert.match(read('SKILL.md'), /orchestrator\.md/);
  assert.match(read('scripts/assemble.py'), /def assemble\(/);
  assert.ok(read('scripts/qc_evidence.py').includes('ffmpeg'));
  assert.equal(fs.existsSync(path.join(root, 'bindings')), false);
  const release = JSON.parse(read('release.json'));
  for (const rel of Object.keys(release.source_files)) {
    assert.doesNotMatch(read(rel), /mcp__\w+|\.control-plane|coworkers\/|\/Users\/|GOOSEWORKS_[A-Z_]+/i, rel);
  }
});

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const {
  parseInstallOptions,
  renderCursorRule,
  placeForCodex,
  placeForCursor,
} = require('../bin/lib/targets');

test('parseInstallOptions uses claude target by default', () => {
  const parsed = parseInstallOptions(['google-ad-scraper']);
  assert.equal(parsed.slug, 'google-ad-scraper');
  assert.equal(parsed.target, 'claude');
});

test('parseInstallOptions accepts explicit codex target', () => {
  const parsed = parseInstallOptions(['google-ad-scraper', '--codex']);
  assert.equal(parsed.target, 'codex');
});

test('parseInstallOptions rejects multiple target flags', () => {
  assert.throws(
    () => parseInstallOptions(['google-ad-scraper', '--codex', '--cursor']),
    /Only one target flag/
  );
});

test('parseInstallOptions requires project-dir for cursor target', () => {
  assert.throws(
    () => parseInstallOptions(['google-ad-scraper', '--cursor']),
    /requires --project-dir/
  );
});

test('parseInstallOptions rejects unknown flags', () => {
  assert.throws(
    () => parseInstallOptions(['google-ad-scraper', '--unknown']),
    /Unknown option/
  );
});

test('renderCursorRule wraps skill content for cursor rules', () => {
  const output = renderCursorRule('google-ad-scraper', '# Skill heading');
  assert.match(output, /^---\ndescription:/);
  assert.match(output, /Always apply this rule/);
  assert.match(output, /# Skill heading/);
});

test('placeForCodex copies skill dir to codex path', () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'goose-skills-test-'));
  const sourceDir = path.join(tmp, 'claude', 'skills', 'google-ad-scraper');
  const codexRoot = path.join(tmp, '.codex', 'skills');
  fs.mkdirSync(sourceDir, { recursive: true });
  fs.writeFileSync(path.join(sourceDir, 'SKILL.md'), '# skill');

  const destination = placeForCodex(sourceDir, codexRoot);
  assert.equal(destination, path.join(codexRoot, 'google-ad-scraper'));
  assert.ok(fs.existsSync(path.join(destination, 'SKILL.md')));
});

test('placeForCodex fails when destination already exists', () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'goose-skills-test-'));
  const sourceDir = path.join(tmp, 'claude', 'skills', 'google-ad-scraper');
  const codexRoot = path.join(tmp, '.codex', 'skills');
  const destination = path.join(codexRoot, 'google-ad-scraper');
  fs.mkdirSync(sourceDir, { recursive: true });
  fs.writeFileSync(path.join(sourceDir, 'SKILL.md'), '# skill');
  fs.mkdirSync(destination, { recursive: true });

  assert.throws(() => placeForCodex(sourceDir, codexRoot), /already exists/);
});

test('placeForCursor writes rule file in project directory', () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'goose-skills-test-'));
  const sourceDir = path.join(tmp, 'claude', 'skills', 'google-ad-scraper');
  const projectDir = path.join(tmp, 'project');
  fs.mkdirSync(sourceDir, { recursive: true });
  fs.mkdirSync(projectDir, { recursive: true });
  fs.writeFileSync(path.join(sourceDir, 'SKILL.md'), '# skill body');

  const rulePath = placeForCursor(sourceDir, projectDir);
  assert.equal(
    rulePath,
    path.join(projectDir, '.cursor', 'rules', 'goose-google-ad-scraper.mdc')
  );
  const contents = fs.readFileSync(rulePath, 'utf8');
  assert.match(contents, /# skill body/);
});


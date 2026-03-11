/**
 * Integration test for the install flow using real local skill files.
 * Bypasses network by loading the local skills-index.json and reading
 * skill files directly from the repo.
 */

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const { placeForClaude } = require('../bin/lib/targets');

const ROOT = path.resolve(__dirname, '..');
const INDEX = require('../skills-index.json');

function getSkill(slug) {
  return INDEX.skills.find((s) => s.slug === slug);
}

function simulateInstall(slug, claudeRoot) {
  const skill = getSkill(slug);
  assert.ok(skill, `Skill "${slug}" not found in index`);

  // Simulate downloading files by copying from the local repo
  const installDir = path.join(claudeRoot, slug);
  fs.mkdirSync(installDir, { recursive: true });

  for (const filePath of skill.files) {
    const src = path.join(ROOT, filePath);
    const dest = path.join(installDir, path.relative(skill.path, filePath));
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    if (fs.existsSync(src)) {
      fs.copyFileSync(src, dest);
    }
  }

  // Place skill for Claude Code (the feature under test)
  return placeForClaude(installDir, claudeRoot);
}

test('install email-drafting places SKILL.md at ~/.claude/skills/email-drafting.md', () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'goose-skills-install-'));
  const claudeRoot = path.join(tmp, '.claude', 'skills');

  const destPath = simulateInstall('email-drafting', claudeRoot);

  assert.equal(destPath, path.join(claudeRoot, 'email-drafting.md'));
  assert.ok(fs.existsSync(destPath), 'skill file should exist');

  const content = fs.readFileSync(destPath, 'utf8');
  assert.match(content, /# Email Drafting/, 'should contain skill heading');
  assert.match(content, /cold email/i, 'should contain skill content');
});

test('install email-drafting: index description is not bare ">"', () => {
  const skill = getSkill('email-drafting');
  assert.ok(skill, 'skill should be in index');
  assert.notEqual(skill.description, '>', 'description should not be bare YAML scalar indicator');
  assert.ok(skill.description.length > 10, 'description should be a real string');
});

test('install apollo-lead-finder: index description is not bare ">"', () => {
  const skill = getSkill('apollo-lead-finder');
  assert.ok(skill, 'skill should be in index');
  assert.notEqual(skill.description, '>');
  assert.ok(skill.description.length > 10);
});

test('no skills have bare ">" description in index', () => {
  const bad = INDEX.skills.filter((s) => s.description === '>');
  assert.deepEqual(bad.map((s) => s.slug), [], 'all skills should have real descriptions');
});

test('install email-drafting: installed file matches source SKILL.md', () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'goose-skills-install-'));
  const claudeRoot = path.join(tmp, '.claude', 'skills');

  const destPath = simulateInstall('email-drafting', claudeRoot);
  const srcPath = path.join(ROOT, 'skills/capabilities/email-drafting/SKILL.md');

  const installed = fs.readFileSync(destPath, 'utf8');
  const source = fs.readFileSync(srcPath, 'utf8');
  assert.equal(installed, source, 'installed file should match source SKILL.md');
});

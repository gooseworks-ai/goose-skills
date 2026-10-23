const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { execFileSync } = require('node:child_process');

const VALIDATE = path.resolve(__dirname, '..', 'validate-skills.js');
const REPO_ROOT = path.resolve(__dirname, '..', '..');

// Layout: skills/<family>/<slug>/ (see build-index.js).
function makeFixtureRoot() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'gs-validate-'));
  // Schemas are looked up under ROOT — symlink the real schemas dir so we
  // don't have to copy/maintain a fixture schema.
  fs.symlinkSync(path.join(REPO_ROOT, 'schemas'), path.join(root, 'schemas'));
  return root;
}

function writeSkill(root, family, slug, frontmatter, meta) {
  const dir = path.join(root, 'skills', family, slug);
  fs.mkdirSync(dir, { recursive: true });
  const fm = Object.entries(frontmatter)
    .map(([k, v]) => `${k}: ${typeof v === 'string' ? v : JSON.stringify(v)}`)
    .join('\n');
  fs.writeFileSync(path.join(dir, 'SKILL.md'), `---\n${fm}\n---\n\n# ${slug}\nBody.\n`);
  fs.writeFileSync(path.join(dir, 'skill.meta.json'), JSON.stringify(meta, null, 2));
}

function writeIndex(root, skills) {
  fs.writeFileSync(
    path.join(root, 'skills-index.json'),
    JSON.stringify({ version: '1.4.0', generated: '2026-10-23', skills, packs: [] }, null, 2),
  );
}

function runValidate(root) {
  return execFileSync('node', [VALIDATE], {
    env: { ...process.env, GOOSE_SKILLS_ROOT: root },
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  });
}

const baseMeta = (slug, extra = {}) => ({
  slug,
  category: 'capabilities',
  tags: ['ads'],
  installation: {
    base_command: `npx goose-skills install ${slug}`,
    supports: ['claude', 'cursor', 'codex'],
  },
  ...extra,
});

function withRoot(fn) {
  const root = makeFixtureRoot();
  try {
    fn(root);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
}

test('PASSES when every skill folder is a top-level skills[] entry', () => withRoot((root) => {
  writeSkill(root, 'video', 'watch', { name: 'watch', description: 'Watch a video.' }, baseMeta('watch'));
  writeIndex(root, [{ slug: 'watch', category: 'capabilities', path: 'skills/video/watch' }]);
  assert.match(runValidate(root), /Skill validation passed for 1 skills/);
}));

test('FAILS when a skill folder is missing from top-level skills[] (only nested in packs[] counts as missing)', () => withRoot((root) => {
  writeSkill(root, 'video', 'watch', { name: 'watch', description: 'x' }, baseMeta('watch'));
  writeSkill(root, 'video', 'mix-master', { name: 'mix-master', description: 'x' }, baseMeta('mix-master'));
  writeIndex(root, [{ slug: 'watch', category: 'capabilities', path: 'skills/video/watch' }]);
  assert.throws(() => runValidate(root), /missing from top-level idx\.skills\[\][\s\S]*skills\/video\/mix-master/);
}));

test('FAILS on a folder under skills/ that is not a family', () => withRoot((root) => {
  writeSkill(root, 'video', 'watch', { name: 'watch', description: 'x' }, baseMeta('watch'));
  fs.mkdirSync(path.join(root, 'skills', 'ads', 'capabilities'), { recursive: true });
  writeIndex(root, [{ slug: 'watch', category: 'capabilities', path: 'skills/video/watch' }]);
  assert.throws(() => runValidate(root), /Unknown folder skills\/ads/);
}));

test('FAILS on a description over the 1,024-character Agent Skills limit', () => withRoot((root) => {
  writeSkill(root, 'video', 'watch', { name: 'watch', description: 'x'.repeat(1025) }, baseMeta('watch'));
  writeIndex(root, [{ slug: 'watch', category: 'capabilities', path: 'skills/video/watch' }]);
  assert.throws(() => runValidate(root), /description over 1024 characters/);
}));

test('FAILS when a shared skill has no domain, or requires a skill that does not exist', () => withRoot((root) => {
  writeSkill(root, 'shared', 'brand-research', { name: 'brand-research', description: 'x' }, baseMeta('brand-research', { requires_skills: ['ghost'] }));
  writeIndex(root, [{ slug: 'brand-research', category: 'capabilities', path: 'skills/shared/brand-research' }]);
  assert.throws(() => runValidate(root), /domain required[\s\S]*requires unknown skill "ghost"/);
}));

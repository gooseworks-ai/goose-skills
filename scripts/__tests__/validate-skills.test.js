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
  version: '1.0.0',
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

test('FAILS when a skill folder is missing from top-level skills[]', () => withRoot((root) => {
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

const indexFor = (root, family, slug) => writeIndex(root, [{ slug, category: 'capabilities', path: `skills/${family}/${slug}` }]);

test('FAILS on an install command that names a pack, or any command but the skill\'s own', () => withRoot((root) => {
  writeSkill(root, 'video', 'watch', { name: 'watch', description: 'x' }, baseMeta('watch', { installation: { base_command: 'npx goose-skills install video-ad-formats/watch', supports: ['claude'] } }));
  indexFor(root, 'video', 'watch');
  assert.throws(() => runValidate(root), /installation\.base_command: does not match[\s\S]*must be "npx goose-skills install watch"/);
}));

test('FAILS on a meta field the schema does not define, and on a missing version', () => withRoot((root) => {
  const meta = baseMeta('watch', { visibility: 'dependency' });
  delete meta.version;
  writeSkill(root, 'video', 'watch', { name: 'watch', description: 'x' }, meta);
  indexFor(root, 'video', 'watch');
  assert.throws(() => runValidate(root), /version is required[\s\S]*visibility: is not an allowed field/);
}));

test('FAILS when SKILL.md frontmatter repeats a category or version that differs from the meta', () => withRoot((root) => {
  writeSkill(root, 'video', 'watch', { name: 'watch', description: 'x', category: 'video', version: '2.0.0' }, baseMeta('watch'));
  indexFor(root, 'video', 'watch');
  assert.throws(() => runValidate(root), /version in SKILL\.md \(2\.0\.0\) and skill\.meta\.json \(1\.0\.0\) differ[\s\S]*category in SKILL\.md \(video\)/);
}));

test('a generated package (release.json) waits for its generator on version and frontmatter', () => withRoot((root) => {
  const meta = baseMeta('harness', { category: 'playbooks' });
  delete meta.version;
  writeSkill(root, 'video', 'harness', { name: 'harness', description: 'x', category: 'video', version: '3.1.0' }, meta);
  fs.writeFileSync(path.join(root, 'skills', 'video', 'harness', 'release.json'), '{}');
  indexFor(root, 'video', 'harness');
  assert.match(runValidate(root), /passed for 1 skills/);
}));

test('FAILS when a family-only domain is used outside its family', () => withRoot((root) => {
  writeSkill(root, 'shared', 'brand-research', { name: 'brand-research', description: 'x' }, baseMeta('brand-research', { domain: 'marketing-agent' }));
  indexFor(root, 'shared', 'brand-research');
  assert.throws(() => runValidate(root), /domain "marketing-agent" is only for skills\/marketing\//);
}));

test('FAILS when requires_tools names a file tool instead of a program', () => withRoot((root) => {
  writeSkill(root, 'video', 'watch', { name: 'watch', description: 'x' }, baseMeta('watch', { requires_tools: ['meta_marketing_api'] }));
  indexFor(root, 'video', 'watch');
  assert.throws(() => runValidate(root), /requires_tools\[0\]: does not match/);
}));

test('the real catalog passes', () => {
  assert.match(execFileSync('node', [VALIDATE], { encoding: 'utf8' }), /Skill validation passed/);
});

test('FAILS when a skill folder carries a builder note (critique.md or server-needs.md)', () => withRoot((root) => {
  writeSkill(root, 'video', 'watch', { name: 'watch', description: 'Watch a video.' }, baseMeta('watch', { version: '1.0.0' }));
  fs.writeFileSync(path.join(root, 'skills', 'video', 'watch', 'critique.md'), 'notes');
  writeIndex(root, [{ slug: 'watch', category: 'capabilities', path: 'skills/video/watch' }]);
  assert.throws(() => runValidate(root), /critique\.md is a builder note/);
}));

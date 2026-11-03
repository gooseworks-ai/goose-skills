const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { execFileSync } = require('node:child_process');

const BUILD_INDEX = path.resolve(__dirname, '..', 'build-index.js');

// Layout: skills/<family>/<slug>/ with family ∈ marketing | video | shared | entry.
function makeFixtureRoot() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'gs-build-index-'));
}

function writeSkill(root, family, slug, frontmatter, meta, extra = {}) {
  const dir = path.join(root, 'skills', family, slug);
  fs.mkdirSync(dir, { recursive: true });
  const fm = Object.entries(frontmatter)
    .map(([k, v]) => `${k}: ${typeof v === 'string' ? v : JSON.stringify(v)}`)
    .join('\n');
  fs.writeFileSync(path.join(dir, 'SKILL.md'), `---\n${fm}\n---\n\n# ${slug}\nBody.\n`);
  fs.writeFileSync(path.join(dir, 'skill.meta.json'), JSON.stringify(meta, null, 2));
  for (const [file, body] of Object.entries(extra)) {
    fs.mkdirSync(path.dirname(path.join(dir, file)), { recursive: true });
    fs.writeFileSync(path.join(dir, file), body);
  }
}

// Every skills/shared/ skill must be declared in retired-skills.json (retained or current_shared).
function writeRetirements(root, manifest) {
  fs.writeFileSync(path.join(root, 'retired-skills.json'), JSON.stringify({ retired: [], retained: [], current_shared: [], ...manifest }, null, 2));
}
const current = (...slugs) => ({ current_shared: slugs.map((slug) => ({ slug, reason: 'Used across families.' })) });

function writeCollection(root, collectionSlug, collectionMeta) {
  const dir = path.join(root, 'collections', collectionSlug);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'collection.meta.json'), JSON.stringify(collectionMeta, null, 2));
}

function runBuild(root) {
  return execFileSync('node', [BUILD_INDEX], {
    env: { ...process.env, GOOSE_SKILLS_ROOT: root },
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  });
}

function readIndex(root) {
  return JSON.parse(fs.readFileSync(path.join(root, 'skills-index.json'), 'utf8'));
}

const baseMeta = (slug, category, extra = {}) => ({
  slug,
  category,
  tags: ['ads'],
  ...extra,
});

test('category and domain come from skill.meta.json or the family, never the folder', () => {
  const root = makeFixtureRoot();
  writeSkill(root, 'video', 'render-offer-ad', { name: 'render-offer-ad', description: 'Render.' }, baseMeta('render-offer-ad', 'capabilities'));
  writeSkill(root, 'shared', 'brand-research', { name: 'brand-research', description: 'Research.' }, baseMeta('brand-research', 'composites', { domain: 'ads' }));
  writeRetirements(root, current('brand-research'));
  runBuild(root);
  const idx = readIndex(root);
  const render = idx.skills.find((s) => s.slug === 'render-offer-ad');
  assert.equal(render.path, 'skills/video/render-offer-ad');
  assert.equal(render.category, 'capabilities');
  assert.equal(render.domain, 'ads', 'video skills default to the ads domain');
  const research = idx.skills.find((s) => s.slug === 'brand-research');
  assert.equal(research.path, 'skills/shared/brand-research');
  assert.equal(research.category, 'composites');
  assert.equal(research.domain, 'ads');
  fs.rmSync(root, { recursive: true, force: true });
});

test('a shared skill without a domain fails the build', () => {
  const root = makeFixtureRoot();
  writeSkill(root, 'shared', 'no-domain', { name: 'no-domain', description: 'x' }, baseMeta('no-domain', 'capabilities'));
  assert.throws(() => runBuild(root), /needs a "domain"/);
  fs.rmSync(root, { recursive: true, force: true });
});

test('the same slug in two families fails the build', () => {
  const root = makeFixtureRoot();
  writeSkill(root, 'video', 'watch', { name: 'watch', description: 'x' }, baseMeta('watch', 'capabilities'));
  writeSkill(root, 'shared', 'watch', { name: 'watch', description: 'x' }, baseMeta('watch', 'capabilities', { domain: 'ads' }));
  assert.throws(() => runBuild(root), /slugs must be unique/);
  fs.rmSync(root, { recursive: true, force: true });
});

test('every skill installs by its own slug: no packs', () => {
  const root = makeFixtureRoot();
  writeSkill(root, 'video', 'mix-master', { name: 'mix-master', description: 'Mix.' }, baseMeta('mix-master', 'capabilities', { version: '1.2.0', requires_skills: ['caption-burn'] }));
  writeSkill(root, 'video', 'caption-burn', { name: 'caption-burn', description: 'Burn.' }, baseMeta('caption-burn', 'capabilities'));
  runBuild(root);
  const idx = readIndex(root);
  assert.deepEqual(idx.skills.map((s) => s.slug), ['caption-burn', 'mix-master']);
  const member = idx.skills.find((s) => s.slug === 'mix-master');
  assert.equal(member.version, '1.2.0');
  assert.deepEqual(member.metadata.requires_skills, ['caption-burn'], 'the meta is published as written');
  assert.deepEqual(idx.packs, [], 'the key stays, empty, for older CLIs');
  fs.rmSync(root, { recursive: true, force: true });
});

test('a leftover packs/ folder is ignored', () => {
  const root = makeFixtureRoot();
  writeSkill(root, 'video', 'watch', { name: 'watch', description: 'x' }, baseMeta('watch', 'capabilities'));
  fs.mkdirSync(path.join(root, 'packs'), { recursive: true });
  fs.writeFileSync(path.join(root, 'packs', 'old.json'), JSON.stringify({ slug: 'old', skills: ['watch'] }));
  runBuild(root);
  const idx = readIndex(root);
  assert.deepEqual(idx.packs, []);
  assert.equal(idx.skills.find((s) => s.slug === 'watch').metadata.pack, undefined);
  fs.rmSync(root, { recursive: true, force: true });
});

test('a shared skill must be declared in retired-skills.json', () => {
  const root = makeFixtureRoot();
  writeSkill(root, 'shared', 'brand-research', { name: 'brand-research', description: 'x' }, baseMeta('brand-research', 'composites', { domain: 'ads' }));
  writeRetirements(root, {});
  assert.throws(() => runBuild(root), /add it to retired-skills\.json retained/);
  fs.rmSync(root, { recursive: true, force: true });
});

test('tests/ folders are never published, in any family and at any depth', () => {
  const root = makeFixtureRoot();
  writeSkill(root, 'video', 'watch', { name: 'watch', description: 'Watch.' }, baseMeta('watch', 'capabilities'), {
    'tests/test_watch.py': 'test',
    'contract/tests/test_contract.py': 'test',
    'contract/validate.py': 'code',
    'scripts/watch.py': 'code',
  });
  runBuild(root);
  const entry = readIndex(root).skills.find((s) => s.slug === 'watch');
  assert.deepEqual(entry.files.sort(), [
    'skills/video/watch/SKILL.md',
    'skills/video/watch/contract/validate.py',
    'skills/video/watch/scripts/watch.py',
    'skills/video/watch/skill.meta.json',
  ]);
  fs.rmSync(root, { recursive: true, force: true });
});

test('handles a tree with no packs', () => {
  const root = makeFixtureRoot();
  writeSkill(root, 'video', 'watch', { name: 'watch', description: 'Watch.' }, baseMeta('watch', 'capabilities'));
  runBuild(root);
  const idx = readIndex(root);
  assert.equal(idx.skills.length, 1);
  assert.deepEqual(idx.packs, []);
  fs.rmSync(root, { recursive: true, force: true });
});

test('builds collection membership from skill metadata without making a pack', () => {
  const root = makeFixtureRoot();
  writeSkill(
    root,
    'marketing',
    'research-audience',
    { name: 'research-audience', description: 'Research an audience.' },
    { ...baseMeta('research-audience', 'playbooks'), collections: ['brand-growth'], collection_stage: 'research' },
  );
  writeCollection(root, 'brand-growth', {
    slug: 'brand-growth',
    name: 'Brand Growth',
    headline: 'Put your AI agent on the growth team.',
    description: 'A curated growth collection.',
    installable: false,
    stages: [{ slug: 'research', name: 'Research', description: 'Find evidence.' }],
  });
  runBuild(root);
  const idx = readIndex(root);
  const collection = idx.collections.find(({ slug }) => slug === 'brand-growth');
  assert.ok(collection);
  assert.equal(collection.installable, false);
  assert.deepEqual(collection.files, ['collections/brand-growth/collection.meta.json']);
  assert.deepEqual(collection.skills.map(({ slug, path: p }) => [slug, p]), [['research-audience', 'skills/marketing/research-audience']]);
  assert.equal(collection.skills[0].stage, 'research');
  assert.equal(idx.packs.some(({ slug }) => slug === 'brand-growth'), false);
  fs.rmSync(root, { recursive: true, force: true });
});

test('throws when a skill references an undefined collection', () => {
  const root = makeFixtureRoot();
  writeSkill(
    root,
    'marketing',
    'research-audience',
    { name: 'research-audience', description: 'Research an audience.' },
    { ...baseMeta('research-audience', 'playbooks'), collections: ['missing-collection'], collection_stage: 'research' },
  );
  assert.throws(() => runBuild(root), /references unknown collection "missing-collection"/);
  fs.rmSync(root, { recursive: true, force: true });
});

test('marketing skills: folded descriptions, builder files and hand tests left out', () => {
  const root = makeFixtureRoot();
  writeSkill(
    root,
    'marketing',
    'research-market',
    { name: 'research-market', description: '>-\n  First line of the\n  description.', version: '0.2.0' },
    {
      slug: 'research-market', category: 'playbooks', tier: 'playbook', version: '0.2.0', tags: ['research'],
      requires_skills: ['claims-gate'],
    },
    {
      'tests/test-by-hand.md': 'hand test',
      'references/report-format.md': 'shape',
    },
  );
  runBuild(root);
  const idx = readIndex(root);
  const entry = idx.skills.find((s) => s.slug === 'research-market');
  assert.ok(entry, 'the playbook is indexed');
  assert.equal(entry.domain, 'marketing-agent');
  assert.equal(entry.category, 'playbooks');
  assert.equal(entry.path, 'skills/marketing/research-market');
  assert.equal(entry.version, '0.2.0');
  assert.equal(entry.description, 'First line of the description.');
  assert.deepEqual(entry.metadata.requires_skills, ['claims-gate']);
  assert.deepEqual(entry.files.sort(), [
    'skills/marketing/research-market/SKILL.md',
    'skills/marketing/research-market/references/report-format.md',
    'skills/marketing/research-market/skill.meta.json',
  ]);
  fs.rmSync(root, { recursive: true, force: true });
});

test('video and shared cards publish folded and literal descriptions instead of YAML markers', () => {
  const root = makeFixtureRoot();
  writeSkill(root, 'shared', 'folded-card', { name: 'folded-card', description: '>\n  Compare tools\n  with evidence.' }, baseMeta('folded-card', 'composites', { domain: 'ads' }));
  writeSkill(root, 'video', 'literal-card', { name: 'literal-card', description: '|-\n  First line.\n  Second line.' }, baseMeta('literal-card', 'capabilities'));
  writeRetirements(root, current('folded-card'));
  runBuild(root);
  const index = readIndex(root);
  assert.equal(index.skills.find((skill) => skill.slug === 'folded-card').description, 'Compare tools with evidence.');
  assert.equal(index.skills.find((skill) => skill.slug === 'literal-card').description, 'First line.\nSecond line.');
  fs.rmSync(root, { recursive: true, force: true });
});

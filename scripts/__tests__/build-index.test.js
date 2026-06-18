const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { execFileSync } = require('node:child_process');

const BUILD_INDEX = path.resolve(__dirname, '..', 'build-index.js');

// Post-reorg layout is skills/<domain>/<level>/<slug>. The build script is
// domain-agnostic, so the fixtures just live under one domain folder.
const DOMAIN = 'lead-generation';

function makeFixtureRoot() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'gs-build-index-'));
  fs.mkdirSync(path.join(root, 'skills', DOMAIN, 'capabilities'), { recursive: true });
  fs.mkdirSync(path.join(root, 'skills', DOMAIN, 'composites'), { recursive: true });
  fs.mkdirSync(path.join(root, 'skills', DOMAIN, 'packs'), { recursive: true });
  return root;
}

function writeSkill(root, category, slug, frontmatter, meta) {
  const dir = path.join(root, 'skills', DOMAIN, category, slug);
  fs.mkdirSync(dir, { recursive: true });
  const fm = Object.entries(frontmatter)
    .map(([k, v]) => `${k}: ${typeof v === 'string' ? v : JSON.stringify(v)}`)
    .join('\n');
  fs.writeFileSync(
    path.join(dir, 'SKILL.md'),
    `---\n${fm}\n---\n\n# ${slug}\nBody.\n`,
  );
  fs.writeFileSync(path.join(dir, 'skill.meta.json'), JSON.stringify(meta, null, 2));
}

function writePackSubSkill(root, packSlug, slug, frontmatter) {
  const dir = path.join(root, 'skills', DOMAIN, 'packs', packSlug, slug);
  fs.mkdirSync(dir, { recursive: true });
  const fm = Object.entries(frontmatter)
    .map(([k, v]) => `${k}: ${typeof v === 'string' ? v : JSON.stringify(v)}`)
    .join('\n');
  fs.writeFileSync(
    path.join(dir, 'SKILL.md'),
    `---\n${fm}\n---\n\n# ${slug}\nBody.\n`,
  );
}

function writePack(root, packSlug, packMeta) {
  const dir = path.join(root, 'skills', DOMAIN, 'packs', packSlug);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'pack.meta.json'), JSON.stringify(packMeta, null, 2));
}

function runBuild(root) {
  return execFileSync('node', [BUILD_INDEX], {
    env: { ...process.env, GOOSE_SKILLS_ROOT: root },
    encoding: 'utf8',
  });
}

function readIndex(root) {
  return JSON.parse(fs.readFileSync(path.join(root, 'skills-index.json'), 'utf8'));
}

const baseMeta = (slug, category, tags = ['monitoring']) => ({
  slug,
  category,
  tags,
  installation: {
    base_command: `npx goose-skills install ${slug}`,
    supports: ['claude', 'cursor', 'codex'],
  },
});

test('promotes pack-only sub-skills into top-level skills[]', () => {
  const root = makeFixtureRoot();
  writeSkill(
    root,
    'capabilities',
    'twitter-scraper',
    { name: 'twitter-scraper', description: 'Scrape twitter.' },
    baseMeta('twitter-scraper', 'capabilities'),
  );
  writePack(root, 'lead-pack', {
    slug: 'lead-pack',
    name: 'Lead Pack',
    tags: ['lead-generation'],
    skills: ['lead-discovery', 'lead-signals'],
    registry_skills: ['twitter-scraper'],
  });
  writePackSubSkill(root, 'lead-pack', 'lead-discovery', {
    name: 'lead-discovery',
    description: 'Orchestrator.',
  });
  writePackSubSkill(root, 'lead-pack', 'lead-signals', {
    name: 'lead-signals',
    description: 'Signals.',
  });

  runBuild(root);
  const idx = readIndex(root);

  const topSlugs = idx.skills.map((s) => s.slug).sort();
  assert.deepEqual(
    topSlugs,
    ['lead-discovery', 'lead-signals', 'twitter-scraper'],
    'top-level should have capability + 2 promoted pack sub-skills (NOT registry-source)',
  );

  const promoted = idx.skills.find((s) => s.slug === 'lead-discovery');
  assert.equal(promoted.metadata.pack, 'lead-pack', 'promoted entry carries pack marker');
  assert.equal(promoted.category, 'capabilities', 'promoted entry has active category');
  assert.equal(
    promoted.metadata.installation.base_command,
    'npx goose-skills install lead-pack',
    'install command points at the parent pack',
  );

  // Registry-source sub-skills should NOT be duplicated top-level
  const twitterCount = idx.skills.filter((s) => s.slug === 'twitter-scraper').length;
  assert.equal(twitterCount, 1, 'registry sub-skills are not duplicated top-level');

  // Pack still has all its sub-skills nested (including registry)
  const pack = idx.packs.find((p) => p.slug === 'lead-pack');
  const packSubSlugs = pack.skills.map((s) => s.slug).sort();
  assert.deepEqual(packSubSlugs, ['lead-discovery', 'lead-signals', 'twitter-scraper']);

  fs.rmSync(root, { recursive: true, force: true });
});

test('throws when a pack-only sub-skill slug collides with a top-level skill', () => {
  const root = makeFixtureRoot();
  writeSkill(
    root,
    'capabilities',
    'lead-discovery',
    { name: 'lead-discovery', description: 'Top-level.' },
    baseMeta('lead-discovery', 'capabilities'),
  );
  writePack(root, 'lead-pack', {
    slug: 'lead-pack',
    name: 'Lead Pack',
    tags: ['lead-generation'],
    skills: ['lead-discovery'],
  });
  writePackSubSkill(root, 'lead-pack', 'lead-discovery', {
    name: 'lead-discovery',
    description: 'Pack copy.',
  });

  assert.throws(
    () => runBuild(root),
    /collides with a top-level registry skill/,
    'must throw on slug collision between pack sub-skill and registry skill',
  );

  fs.rmSync(root, { recursive: true, force: true });
});

test('throws when the same pack-only sub-skill slug appears in two packs', () => {
  const root = makeFixtureRoot();
  writePack(root, 'pack-a', {
    slug: 'pack-a',
    name: 'Pack A',
    tags: ['lead-generation'],
    skills: ['shared-sub'],
  });
  writePackSubSkill(root, 'pack-a', 'shared-sub', {
    name: 'shared-sub',
    description: 'From pack A.',
  });
  writePack(root, 'pack-b', {
    slug: 'pack-b',
    name: 'Pack B',
    tags: ['lead-generation'],
    skills: ['shared-sub'],
  });
  writePackSubSkill(root, 'pack-b', 'shared-sub', {
    name: 'shared-sub',
    description: 'From pack B.',
  });

  assert.throws(
    () => runBuild(root),
    /appears in multiple packs/,
    'must throw when the same pack-only slug exists in two packs (downstream upsert by slug would silently overwrite)',
  );

  fs.rmSync(root, { recursive: true, force: true });
});

test('handles tree with no packs', () => {
  const root = makeFixtureRoot();
  writeSkill(
    root,
    'capabilities',
    'twitter-scraper',
    { name: 'twitter-scraper', description: 'Scrape twitter.' },
    baseMeta('twitter-scraper', 'capabilities'),
  );
  writeSkill(
    root,
    'composites',
    'competitor-intel',
    { name: 'competitor-intel', description: 'Track competitors.' },
    baseMeta('competitor-intel', 'composites'),
  );

  runBuild(root);
  const idx = readIndex(root);

  assert.equal(idx.skills.length, 2);
  assert.deepEqual(idx.packs, [], 'empty packs[] when no packs on disk');
  // No promoted entries — none have metadata.pack
  const withPack = idx.skills.filter((s) => s.metadata && s.metadata.pack);
  assert.equal(withPack.length, 0);

  fs.rmSync(root, { recursive: true, force: true });
});

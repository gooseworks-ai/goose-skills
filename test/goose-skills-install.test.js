// npx goose-skills install, run against a stubbed fetch: no network.

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const { installSkill, resolvePackages } = require('../bin/lib/install');

const RAW = 'https://raw.example/goose-skills/main';
// Every byte value, including ones that are not valid UTF-8.
const BINARY = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x00, 0xff, 0xfe, 0x80, 0xc3, 0x28, ...Array.from({ length: 256 }, (_, i) => i)]);

function skill(slug, family, files, metadata = {}) {
  const dir = `skills/${family}/${slug}`;
  return {
    slug,
    name: slug,
    path: dir,
    files: ['SKILL.md', ...files].map((f) => `${dir}/${f}`),
    metadata: { slug, ...metadata },
  };
}

const INDEX = {
  skills: [
    skill('write-script', 'video', ['references/judge.md'], { requires_skills: ['angle-miner', 'watch'] }),
    skill('angle-miner', 'shared', [], { requires_skills: ['comment-mining', 'competitor-intel'] }),
    skill('competitor-intel', 'shared', [], { requires_skills: ['scrapecreators', 'transcripts'] }),
    skill('comment-mining', 'shared', [], { requires_skills: ['scrapecreators'] }),
    skill('scrapecreators', 'shared', []),
    skill('transcripts', 'shared', []),
    skill('watch', 'video', []),
    skill('render-chat', 'video', ['assets/sent.png', 'scripts/render.py'], { requires_tools: ['python3', 'ffmpeg'] }),
    skill('launch-meta', 'shared', ['tools/meta_marketing_api.js']),
    skill('cycle-a', 'shared', [], { requires_skills: ['cycle-b'] }),
    skill('cycle-b', 'shared', [], { requires_skills: ['cycle-a'] }),
    skill('broken', 'shared', [], { requires_skills: ['not-in-catalog'] }),
  ],
  retired_skills: [
    { slug: 'video-ad-formats', replacement: null, reason: 'Install the skills one by one.' },
    { slug: 'old-script', replacement: 'write-script', reason: 'Renamed.' },
  ],
};

function stubFetch(index = INDEX) {
  const requested = [];
  const fetch = async (url) => {
    requested.push(url);
    const rel = url.slice(RAW.length + 1);
    if (rel === 'skills-index.json') return Buffer.from(JSON.stringify(index));
    if (rel.endsWith('.png')) return BINARY;
    if (index.skills.some((s) => s.files.includes(rel))) return Buffer.from(`content of ${rel}\n`);
    throw new Error(`HTTP 404 for ${url}`);
  };
  return { fetch, requested };
}

function run(slug, extra = {}) {
  const home = fs.mkdtempSync(path.join(os.tmpdir(), 'goose-skills-install-'));
  const { fetch, requested } = stubFetch(extra.index);
  const lines = [];
  const options = { slug, target: 'claude', projectDir: null, ...extra.options };
  const deps = { fetch, rawBase: RAW, home, log: (l) => lines.push(l), error: (l) => lines.push(l) };
  if (extra.before) extra.before(home);
  return { home, requested, lines, skillsRoot: path.join(home, '.claude', 'skills'), promise: installSkill(options, deps) };
}

test('installs requires_skills recursively, dependencies first, each once', async () => {
  const r = run('write-script');
  const result = await r.promise;
  assert.deepEqual(result.installed, [
    'scrapecreators', 'comment-mining', 'transcripts', 'competitor-intel', 'angle-miner', 'watch', 'write-script',
  ]);
  for (const slug of result.installed) {
    assert.ok(fs.existsSync(path.join(r.skillsRoot, slug, 'SKILL.md')), `${slug} installed`);
  }
  assert.equal(
    fs.readFileSync(path.join(r.skillsRoot, 'write-script', 'references', 'judge.md'), 'utf8'),
    'content of skills/video/write-script/references/judge.md\n',
  );
  // scrapecreators is needed twice but fetched once.
  assert.equal(r.requested.filter((u) => u.endsWith('scrapecreators/SKILL.md')).length, 1);
  assert.equal(result.failed, 0);
});

test('a dependency that is already installed is kept, and its own dependencies still install', async () => {
  const r = run('angle-miner', {
    before: (home) => {
      const dir = path.join(home, '.claude', 'skills', 'competitor-intel');
      fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(path.join(dir, 'SKILL.md'), 'mine');
    },
  });
  const result = await r.promise;
  assert.deepEqual(result.skipped, ['competitor-intel']);
  assert.equal(fs.readFileSync(path.join(r.skillsRoot, 'competitor-intel', 'SKILL.md'), 'utf8'), 'mine');
  assert.ok(fs.existsSync(path.join(r.skillsRoot, 'transcripts', 'SKILL.md')));
});

test('a dependency cycle installs each skill once and terminates', async () => {
  const result = await run('cycle-a').promise;
  assert.deepEqual(result.installed, ['cycle-b', 'cycle-a']);
});

test('a dependency missing from the catalog fails before any file is written', async () => {
  const r = run('broken');
  await assert.rejects(r.promise, /requires "not-in-catalog", which is not in the catalog/);
  assert.deepEqual(r.requested, [`${RAW}/skills-index.json`]);
  assert.equal(fs.existsSync(r.skillsRoot), false);
});

test('binary files are written byte for byte', async () => {
  const r = run('render-chat');
  await r.promise;
  assert.ok(BINARY.equals(fs.readFileSync(path.join(r.skillsRoot, 'render-chat', 'assets', 'sent.png'))));
});

test('requires_tools names programs to have, not files to download', async () => {
  const r = run('render-chat');
  await r.promise;
  assert.ok(r.requested.every((u) => !/\/(python3|ffmpeg)$/.test(u)));
  assert.ok(r.lines.some((l) => /Programs it runs.*python3, ffmpeg/.test(l)));
});

test('a file in the skill folder, such as tools/, installs inside the skill', async () => {
  const r = run('launch-meta');
  await r.promise;
  assert.ok(fs.existsSync(path.join(r.skillsRoot, 'launch-meta', 'tools', 'meta_marketing_api.js')));
});

test('a retired skill points at its replacement, or explains why it went', async () => {
  await assert.rejects(run('old-script').promise, /retired\. Use "write-script" instead: npx goose-skills install write-script/);
  await assert.rejects(run('video-ad-formats').promise, /removed from the catalog\. Install the skills one by one\./);
});

test('an unknown slug returns null', async () => {
  assert.equal(await run('nope').promise, null);
});

test('the Claude Code hint names the skills folder, not a copied SKILL.md', async () => {
  const r = run('watch');
  await r.promise;
  const text = r.lines.join('\n');
  assert.doesNotMatch(text, /cp -r|\.claude\/skills\/watch\.md/);
  assert.match(text, new RegExp(`Claude Code loads skills from ${r.skillsRoot.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`));
});

test('--codex places the skill and each dependency in ~/.codex/skills', async () => {
  const r = run('comment-mining', { options: { target: 'codex' } });
  await r.promise;
  for (const slug of ['scrapecreators', 'comment-mining']) {
    assert.ok(fs.existsSync(path.join(r.home, '.codex', 'skills', slug, 'SKILL.md')), slug);
  }
});

test('a file that fails to download is counted', async () => {
  const index = structuredClone(INDEX);
  index.skills.find((s) => s.slug === 'watch').files.push('skills/video/watch/missing.md');
  const { fetch } = stubFetch(index);
  const home = fs.mkdtempSync(path.join(os.tmpdir(), 'goose-skills-install-'));
  const missing = async (url) => (url.endsWith('missing.md') ? Promise.reject(new Error('HTTP 404')) : fetch(url));
  const result = await installSkill(
    { slug: 'watch', target: 'claude', projectDir: null },
    { fetch: missing, rawBase: RAW, home, log: () => {}, error: () => {} },
  );
  assert.equal(result.failed, 1);
});

test('resolvePackages rejects a package path outside its own slug folder', () => {
  const index = { skills: [{ slug: 'x', path: 'skills/shared/../x', files: [] }] };
  assert.throws(() => resolvePackages(index, 'x'), /Invalid package path/);
});

// ── upgrades ──────────────────────────────────────────────────────────────

function withVersion(index, slug, version) {
  const copy = structuredClone(index);
  const entry = copy.skills.find((s) => s.slug === slug);
  entry.version = version;
  entry.metadata.version = version;
  return copy;
}

function preinstall(home, slug, { meta, skill = 'old copy' } = {}) {
  const dir = path.join(home, '.claude', 'skills', slug);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'SKILL.md'), skill);
  if (meta) fs.writeFileSync(path.join(dir, 'skill.meta.json'), JSON.stringify(meta));
  return dir;
}

test('a dependency installed at an older version is upgraded', async () => {
  const r = run('comment-mining', {
    index: withVersion(INDEX, 'scrapecreators', '1.2.0'),
    before: (home) => preinstall(home, 'scrapecreators', { meta: { slug: 'scrapecreators', version: '1.1.9' } }),
  });
  const result = await r.promise;
  assert.deepEqual(result.upgraded, ['scrapecreators']);
  assert.deepEqual(result.skipped, []);
  assert.ok(result.installed.includes('scrapecreators'));
  assert.equal(fs.readFileSync(path.join(r.skillsRoot, 'scrapecreators', 'SKILL.md'), 'utf8'), 'content of skills/shared/scrapecreators/SKILL.md\n');
  assert.ok(r.lines.some((l) => /scrapecreators 1\.1\.9 → 1\.2\.0, upgrading/.test(l)));
});

test('a dependency at the same or a newer version is kept; the frontmatter version counts when there is no meta', async () => {
  const same = run('comment-mining', {
    index: withVersion(INDEX, 'scrapecreators', '1.2.0'),
    before: (home) => preinstall(home, 'scrapecreators', { meta: { version: '1.2.0' } }),
  });
  assert.deepEqual((await same.promise).skipped, ['scrapecreators']);

  const newer = run('comment-mining', {
    index: withVersion(INDEX, 'scrapecreators', '1.2.0'),
    before: (home) => preinstall(home, 'scrapecreators', { skill: '---\nname: scrapecreators\nversion: 1.10.0\n---\n' }),
  });
  const result = await newer.promise;
  assert.deepEqual(result.skipped, ['scrapecreators']);
  assert.equal(fs.readFileSync(path.join(newer.skillsRoot, 'scrapecreators', 'SKILL.md'), 'utf8'), '---\nname: scrapecreators\nversion: 1.10.0\n---\n');
});

test('an installed copy with no version is upgraded when the catalog has one', async () => {
  const r = run('comment-mining', {
    index: withVersion(INDEX, 'scrapecreators', '1.0.0'),
    before: (home) => preinstall(home, 'scrapecreators'),
  });
  assert.deepEqual((await r.promise).upgraded, ['scrapecreators']);
});

// ── info ──────────────────────────────────────────────────────────────────

const { describeSkill } = require('../bin/lib/info');

test('info shows the skills a skill requires and the programs it runs', () => {
  const index = withVersion(INDEX, 'write-script', '2.1.0');
  const { ok, lines } = describeSkill(index, 'write-script', { repo: 'gooseworks-ai/goose-skills', branch: 'main' });
  assert.equal(ok, true);
  const text = lines.join('\n');
  assert.match(text, /Version: 2\.1\.0/);
  assert.match(text, /Requires skills: angle-miner, watch \(installed with it\)/);
  assert.match(text, /GitHub: https:\/\/github\.com\/gooseworks-ai\/goose-skills\/tree\/main\/skills\/video\/write-script/);
  assert.match(describeSkill(INDEX, 'watch').lines.join('\n'), /Requires skills: none/);
  assert.match(describeSkill(INDEX, 'render-chat').lines.join('\n'), /Programs it runs: python3, ffmpeg/);
});

test('info explains a retired slug: its replacement, or why it went', () => {
  const renamed = describeSkill(INDEX, 'old-script');
  assert.equal(renamed.ok, true);
  assert.deepEqual(renamed.lines, [
    'old-script was retired. Use write-script instead.',
    'Why: Renamed.',
    'Install: npx goose-skills install write-script',
  ]);
  const removed = describeSkill(INDEX, 'video-ad-formats');
  assert.deepEqual(removed.lines, [
    'video-ad-formats was removed from the catalog, with no replacement.',
    'Why: Install the skills one by one.',
  ]);
});

test('info on an unknown slug is not ok', () => {
  const res = describeSkill(INDEX, 'nope');
  assert.equal(res.ok, false);
  assert.match(res.lines[0], /Skill "nope" not found/);
});

test('the CLI prints info from the index it fetches (stubbed network)', () => {
  const { spawnSync } = require('node:child_process');
  const indexFile = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'goose-skills-info-')), 'skills-index.json');
  fs.writeFileSync(indexFile, JSON.stringify(INDEX));
  const cli = (slug) => spawnSync(process.execPath, ['-r', path.join(__dirname, 'fixtures', 'cli', 'stub-https.js'), path.join(__dirname, '..', 'bin', 'goose-skills.js'), 'info', slug], {
    env: { ...process.env, GOOSE_SKILLS_STUB_INDEX: indexFile },
    encoding: 'utf8',
  });
  const info = cli('angle-miner');
  assert.equal(info.status, 0, info.stderr);
  assert.match(info.stdout, /Requires skills: comment-mining, competitor-intel \(installed with it\)/);
  const retired = cli('old-script');
  assert.equal(retired.status, 0, retired.stderr);
  assert.match(retired.stdout, /old-script was retired\. Use write-script instead\./);
  const unknown = cli('nope');
  assert.equal(unknown.status, 1);
  assert.match(unknown.stderr, /Skill "nope" not found/);
});

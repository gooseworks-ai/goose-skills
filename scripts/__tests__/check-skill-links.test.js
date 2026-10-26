'use strict';

// check-skill-links.js against small fixture repos (an index, the skill files,
// and docs), run as CI runs it.

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const SCRIPT = path.resolve(__dirname, '..', 'check-skill-links.js');

/**
 * skills: { slug: { family, files: { rel: text }, metadata } }; extra: { repoPath: text }.
 * Writes the files and a skills-index.json that lists them.
 */
function fixture(skills, extra = {}) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'gs-links-'));
  const write = (rel, text) => {
    fs.mkdirSync(path.dirname(path.join(root, rel)), { recursive: true });
    fs.writeFileSync(path.join(root, rel), text);
  };
  const entries = [];
  for (const [slug, { family = 'marketing', files = {}, metadata = {} }] of Object.entries(skills)) {
    const dir = `skills/${family}/${slug}`;
    const all = { 'SKILL.md': `# ${slug}\n`, ...files };
    for (const [rel, text] of Object.entries(all)) write(`${dir}/${rel}`, text);
    entries.push({ slug, path: dir, files: Object.keys(all).map((f) => `${dir}/${f}`), metadata: { slug, ...metadata } });
  }
  write('skills-index.json', JSON.stringify({ skills: entries }));
  for (const [rel, text] of Object.entries(extra)) write(rel, text);
  return root;
}

function check(root) {
  const res = spawnSync(process.execPath, [SCRIPT], { env: { ...process.env, GOOSE_SKILLS_ROOT: root }, encoding: 'utf8' });
  return { code: res.status, out: `${res.stdout}${res.stderr}` };
}

test('passes when every reference resolves and names a listed dependency', () => {
  const root = fixture({
    'plan-launch': {
      files: { 'SKILL.md': 'Read [the brief](references/brief.md) and `../research-market/SKILL.md`; use the `research-market` skill.\n', 'references/brief.md': 'Brief.\n' },
      metadata: { requires_skills: ['research-market'] },
    },
    'research-market': {},
  }, { 'docs/README.md': 'See [the playbook](../skills/marketing/plan-launch/SKILL.md).\n' });
  const res = check(root);
  assert.equal(res.code, 0, res.out);
  assert.match(res.out, /2 skills, 2 references, 0 broken; 1 skill names, all known; 1 docs, 1 links, 0 broken/);
});

test('a reference that does not resolve in the installed layout fails', () => {
  const root = fixture({ 'plan-launch': { files: { 'SKILL.md': 'See [notes](references/missing.md).\n' } } });
  const res = check(root);
  assert.equal(res.code, 1, res.out);
  assert.match(res.out, /plan-launch\/SKILL\.md: "references\/missing\.md" does not resolve in the installed layout/);
});

test('a reference into a skill that is not in requires_skills fails', () => {
  const root = fixture({
    'plan-launch': { files: { 'SKILL.md': 'Then `../research-market/SKILL.md`.\n' }, metadata: { requires_skills: [] } },
    'research-market': {},
  });
  const res = check(root);
  assert.equal(res.code, 1, res.out);
  assert.match(res.out, /refers to the research-market skill, which is not in requires_skills/);
});

test('an old-layout path fails', () => {
  const root = fixture({ 'plan-launch': { files: { 'SKILL.md': 'Read ATOM.md first.\n' } } });
  const res = check(root);
  assert.equal(res.code, 1, res.out);
  assert.match(res.out, /old-layout path "ATOM\.md"/);
});

test('requires_skills must be flat (a skill lists what its dependencies need)', () => {
  const root = fixture({
    'write-script': { family: 'video', metadata: { requires_skills: ['angle-miner'] } },
    'angle-miner': { family: 'shared', metadata: { requires_skills: ['comment-mining'] } },
    'comment-mining': { family: 'shared' },
  });
  const res = check(root);
  assert.equal(res.code, 1, res.out);
  assert.match(res.out, /write-script: requires_skills is not flat; also list comment-mining/);
});

test('a skill named in prose that is in no catalog fails; known names pass', () => {
  const root = fixture(
    {
      'render-music-video': {
        family: 'video',
        files: {
          'SKILL.md': [
            'Captions: run the sync-captions-to-music atom.',
            'Then `create-video-made-up` and `transcribe-audio-fal`.',
            'Retired names, recipes, parts and shipped step files are fine: the `old-captions` skill,',
            '`create-demo-video-from-refs`, the `video-kling` part, `create-clips`, the `render-music-video` skill.',
            'Ordinary words in backticks are not skill names: `gpt-image-2`, `keep-history`.',
            '',
          ].join('\n'),
          'create-clips.md': 'A step.\n',
        },
      },
    },
    {
      'retired-skills.json': JSON.stringify({ retired: [{ slug: 'old-captions', replacement: null, reason: 'Gone.' }] }),
      'test/fixtures/entry-lint/video-recipe-slugs.json': JSON.stringify({ recipes: ['create-demo-video-from-refs'] }),
      'parts/video-kling/index.json': '{}',
    },
  );
  const res = check(root);
  assert.equal(res.code, 1, res.out);
  const named = res.out.split('\n').filter((l) => /names a skill/.test(l));
  assert.deepEqual(
    named.map((l) => l.match(/names a skill "([^"]+)"/)[1]).sort(),
    ['create-video-made-up', 'sync-captions-to-music', 'transcribe-audio-fal'],
  );
  assert.match(res.out, /render-music-video\/SKILL\.md:1: names a skill "sync-captions-to-music"/);
});

test('a broken relative link in docs/, drafts/, evals/ or a top-level doc fails; code blocks and URLs are skipped', () => {
  const root = fixture({ 'plan-launch': {} }, {
    'README.md': 'See [contributing](CONTRIBUTING.md) and [site](https://gooseworks.ai).\n',
    'CONTRIBUTING.md': 'Back to [the readme](./README.md#top).\n',
    'docs/marketing/README.md': 'The [missing guide](GUIDE.md).\n\n```md\n[example](not-a-file.md)\n```\n',
    'drafts/marketing/README.md': 'Drafted from [the playbook](/skills/marketing/plan-launch/SKILL.md).\n',
    'evals/marketing/README.md': 'Cases: [routing](routing/cases.jsonl).\n',
  });
  const res = check(root);
  assert.equal(res.code, 1, res.out);
  const broken = res.out.split('\n').filter((l) => /does not resolve in the repo/.test(l));
  assert.deepEqual(broken.map((l) => l.replace(/^- /, '')).sort(), [
    'docs/marketing/README.md: link "GUIDE.md" does not resolve in the repo',
    'evals/marketing/README.md: link "routing/cases.jsonl" does not resolve in the repo',
  ]);
});

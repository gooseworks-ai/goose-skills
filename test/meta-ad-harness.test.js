// Structural checks for the Meta ad harness skills. Each one is published with a shared block
// that is maintained byte-for-byte in a second copy, adapter references around it, and
// dependencies installed through requires_skills. These tests catch the ways that goes wrong
// without anyone noticing: a lost marker, a dead link, a missing dependency, an app-only
// reference, or a contract that no longer validates its own example.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const ROOT = path.resolve(__dirname, '..');

const HARNESS = {
  'meta-ad-manager': 'skills/ads/playbooks/meta-ad-manager',
  'ad-management-intake': 'skills/ads/composites/ad-management-intake',
  'ads-north-star-strategy': 'skills/ads/composites/ads-north-star-strategy',
  'answer-ads-questions': 'skills/ads/capabilities/answer-ads-questions',
};

// Blocks that must appear exactly once, by file.
const BLOCKS = [
  ['skills/ads/playbooks/meta-ad-manager/SKILL.md', 'meta-ad-manager'],
  ['skills/ads/playbooks/meta-ad-manager/contract/RULES.md', 'harness-contract'],
  ['skills/ads/composites/ad-management-intake/SKILL.md', 'ad-management-intake'],
  ['skills/ads/composites/ads-north-star-strategy/SKILL.md', 'ads-north-star-strategy'],
  ['skills/ads/capabilities/answer-ads-questions/SKILL.md', 'answer-ads-questions'],
];

// Couplings a public skill must not carry (mirrors the publisher's lint).
const COUPLING = [
  /mcp__\w+/,
  /\b(?:app|api)\.(?:staging\.)?gooseworks\.ai/,
  /media[- ]proxy|\/bweb\/|queue\.fal\.run/,
  /localhost:\d+|127\.0\.0\.1:\d+/,
  /GOOSEWORKS_\w+/,
  /gooseworks-app|goose-skills-ops|content-goose|goose-lab|coworkers\//,
  /\/Users\/\w+/,
  /\bGOOSE-\d+/,
];

function walk(dir) {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === '__pycache__') continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(full));
    else out.push(full);
  }
  return out;
}

function read(rel) {
  return fs.readFileSync(path.join(ROOT, rel), 'utf8');
}

test('the harness skills are all present', () => {
  for (const [slug, dir] of Object.entries(HARNESS)) {
    assert.ok(fs.existsSync(path.join(ROOT, dir, 'SKILL.md')), `${slug}: SKILL.md`);
    assert.ok(fs.existsSync(path.join(ROOT, dir, 'skill.meta.json')), `${slug}: skill.meta.json`);
  }
});

test('each shared block appears exactly once and is not empty', () => {
  for (const [rel, name] of BLOCKS) {
    const text = read(rel);
    const start = `<!-- shared:${name} start -->`;
    const end = `<!-- shared:${name} end -->`;
    assert.equal(text.split(start).length - 1, 1, `${rel}: one start marker for ${name}`);
    assert.equal(text.split(end).length - 1, 1, `${rel}: one end marker for ${name}`);
    const body = text.slice(text.indexOf(start) + start.length, text.indexOf(end));
    assert.ok(body.trim().split('\n').length > 20, `${rel}: ${name} block has content`);
  }
});

test('every relative link in the harness skills resolves', () => {
  let checked = 0;
  for (const dir of Object.values(HARNESS)) {
    for (const file of walk(path.join(ROOT, dir)).filter((f) => f.endsWith('.md'))) {
      const text = fs.readFileSync(file, 'utf8');
      for (const match of text.matchAll(/\]\(([^)\s]+)\)/g)) {
        const target = match[1];
        if (/^[a-z]+:/i.test(target) || target.startsWith('#')) continue;
        const resolved = path.resolve(path.dirname(file), target.split('#')[0]);
        assert.ok(fs.existsSync(resolved), `${path.relative(ROOT, file)} links to missing ${target}`);
        checked += 1;
      }
    }
  }
  assert.ok(checked >= 10, `expected to check at least 10 links, checked ${checked}`);
});

test('requires_skills name skills that exist in the index', () => {
  const index = JSON.parse(read('skills-index.json'));
  const slugs = new Set(index.skills.map((s) => s.slug));
  for (const [slug, dir] of Object.entries(HARNESS)) {
    const meta = JSON.parse(read(`${dir}/skill.meta.json`));
    assert.ok(Array.isArray(meta.requires_skills) && meta.requires_skills.length > 0, `${slug}: requires_skills`);
    for (const dep of meta.requires_skills) {
      assert.ok(slugs.has(dep), `${slug} requires ${dep}, which is not in skills-index.json`);
    }
    const entry = index.skills.find((s) => s.slug === slug);
    assert.ok(entry && entry.files.length >= 5, `${slug}: indexed with its files`);
  }
  const manager = JSON.parse(read(`${HARNESS['meta-ad-manager']}/skill.meta.json`));
  for (const slug of Object.keys(HARNESS).filter((s) => s !== 'meta-ad-manager')) {
    assert.ok(manager.requires_skills.includes(slug), `meta-ad-manager installs ${slug}`);
  }
});

test('no harness file carries an app-only reference', () => {
  let scanned = 0;
  for (const dir of Object.values(HARNESS)) {
    for (const file of walk(path.join(ROOT, dir))) {
      const lines = fs.readFileSync(file, 'utf8').split('\n');
      lines.forEach((line, i) => {
        for (const pattern of COUPLING) {
          assert.ok(!pattern.test(line), `${path.relative(ROOT, file)}:${i + 1} matches ${pattern}`);
        }
      });
      scanned += 1;
    }
  }
  assert.ok(scanned >= 30, `expected to scan at least 30 files, scanned ${scanned}`);
});

test('the bundled contract validates its own example', (t) => {
  const contract = path.join(ROOT, HARNESS['meta-ad-manager'], 'contract');
  const probe = spawnSync('python3', ['--version']);
  if (probe.error) {
    t.skip('python3 is not available');
    return;
  }
  const run = spawnSync('python3', ['validate.py', 'examples/sample-brand/ads'], { cwd: contract, encoding: 'utf8' });
  assert.equal(run.status, 0, run.stdout + run.stderr);
});

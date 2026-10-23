const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { validateRetirements } = require('../scripts/lib/retirements');
const index = require('../skills-index.json');
const manifest = require('../retired-skills.json');

test('retirement map preserves retained jobs and every active dependency', () => {
  assert.deepEqual(validateRetirements(manifest, index.skills), index.retired_skills);
  // Every old skill outside skills/video and skills/marketing is either retired or
  // retained with the user that still needs it and the change that frees it.
  const shared = index.skills.filter(s => s.path.startsWith('skills/shared/')).map(s => s.slug).sort();
  assert.deepEqual(manifest.retained.map(s => s.slug).sort(), shared);
  for (const entry of manifest.retained) assert.ok(entry.reason && entry.remove_when, entry.slug);
  for (const slug of ['meta-ad-manager', 'goose-graphics', 'brand-research', 'remix-graphic-ad-from-reference']) {
    assert.ok(shared.includes(slug), `${slug} is still used and must stay`);
  }
  const removed = manifest.retired.find(s => s.slug === 'weather');
  assert.equal(removed.replacement, null, 'a removed utility may have no replacement');
  assert.ok(removed.reason);
});
test('rejects active old names, missing replacements, and required retired skills', () => {
  const retired = [{ slug: 'old', replacement: 'new', reason: 'Replaced' }];
  assert.throws(() => validateRetirements({ retired }, [{ slug: 'old' }, { slug: 'new' }]));
  assert.throws(() => validateRetirements({ retired }, []));
  assert.throws(() => validateRetirements({ retired }, [{ slug: 'new', metadata: { requires_skills: ['old'] } }]));
  assert.doesNotThrow(() => validateRetirements({ retired: [{ slug: 'old', replacement: null, reason: 'Removed' }] }, [{ slug: 'new' }]));
  assert.throws(() => validateRetirements({ retired: [{ slug: 'old', replacement: null }] }, [{ slug: 'new' }]));
  assert.throws(() => validateRetirements({ retained: [{ slug: 'new', reason: 'Used' }] }, [{ slug: 'new' }]), /remove_when/);
});

test('retired skill instructions are deleted rather than kept in an archive', () => {
  const root = path.resolve(__dirname, '..');
  const retired = new Set(manifest.retired.map(skill => skill.slug));
  const remaining = [];
  for (const relative of ['skills', 'archive']) {
    const folder = path.join(root, relative);
    if (!fs.existsSync(folder)) continue;
    for (const file of fs.readdirSync(folder, { recursive: true })) {
      const parts = file.split(path.sep);
      if (parts.at(-1) === 'SKILL.md' && parts.some(part => retired.has(part))) {
        remaining.push(path.join(relative, file));
      }
    }
  }
  assert.deepEqual(remaining, [], 'Git history preserves retired instructions; working copies must be removed');
});

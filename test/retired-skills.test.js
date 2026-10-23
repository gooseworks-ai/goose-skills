const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { validateRetirements } = require('../scripts/lib/retirements');
const index = require('../skills-index.json');
const manifest = require('../retired-skills.json');

test('retirement map preserves retained jobs and every active dependency', () => {
  assert.deepEqual(validateRetirements(manifest, index.skills), index.retired_skills);
  assert.equal(manifest.retired.length, 12);
  assert.equal(manifest.retained.length, 179);
  assert.ok(index.skills.some(s => s.slug === 'video-clipper'));
  assert.ok(index.skills.some(s => s.slug === 'cold-email-outreach'));
  assert.ok(index.skills.some(s => s.slug === 'comprehensive-enrichment'));
});
test('rejects active old names, missing replacements, and required retired skills', () => {
  const retired = [{ slug: 'old', replacement: 'new', reason: 'Replaced' }];
  assert.throws(() => validateRetirements({ retired }, [{ slug: 'old' }, { slug: 'new' }]));
  assert.throws(() => validateRetirements({ retired }, []));
  assert.throws(() => validateRetirements({ retired }, [{ slug: 'new', metadata: { requires_skills: ['old'] } }]));
});

test('retired skill instructions are deleted rather than kept in an archive', () => {
  const root = path.resolve(__dirname, '..');
  const retired = new Set(manifest.retired.map(skill => skill.slug));
  const remaining = [];
  for (const relative of ['skills', 'marketing-agent/skills', 'archive']) {
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

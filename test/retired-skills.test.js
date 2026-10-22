const { test } = require('node:test');
const assert = require('node:assert/strict');
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

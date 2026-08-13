const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const index = JSON.parse(
  fs.readFileSync(path.join(__dirname, '..', 'skills-index.json'), 'utf8'),
);
const skillsBySlug = new Map(index.skills.map((skill) => [skill.slug, skill]));

test('new Brand Growth workflows are indexed in the intended stages', () => {
  const expected = {
    'audience-research': 'research',
    'creator-profile-teardown': 'analyze',
    'content-repurposing': 'create',
    'transcript-intelligence': 'analyze',
  };

  for (const [slug, stage] of Object.entries(expected)) {
    const skill = skillsBySlug.get(slug);
    assert.ok(skill, `${slug} should be present in skills-index.json`);
    assert.ok(
      skill.metadata.collections.includes('brand-growth'),
      `${slug} should belong to the Brand Growth collection`,
    );
    assert.equal(skill.metadata.collection_stage, stage);
  }
});

test('every indexed skill dependency resolves to another indexed skill', () => {
  for (const skill of index.skills) {
    for (const dependency of skill.metadata?.requires_skills || []) {
      assert.ok(
        skillsBySlug.has(dependency),
        `${skill.slug} requires missing skill ${dependency}`,
      );
    }
  }
});

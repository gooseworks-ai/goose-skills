const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const index = JSON.parse(
  fs.readFileSync(path.join(__dirname, '..', 'skills-index.json'), 'utf8'),
);
const skillsBySlug = new Map(index.skills.map((skill) => [skill.slug, skill]));

test('Brand Growth has first-class, non-installable collection metadata', () => {
  const collection = index.collections.find(({ slug }) => slug === 'brand-growth');

  assert.ok(collection, 'Brand Growth should be present in skills-index.json');
  assert.equal(collection.type, 'collection');
  assert.equal(collection.installable, false);
  assert.equal(collection.metadata.entry.command, '/gooseworks');
  assert.equal(collection.metadata.entry.onboarding_command, '/gooseworks onboard me');
  assert.deepEqual(
    collection.metadata.growth_loop,
    ['research', 'create', 'run', 'measure', 'improve'],
  );

  const indexedMembers = index.skills
    .filter((skill) => skill.metadata?.collections?.includes('brand-growth'))
    .map(({ slug }) => slug)
    .sort();
  assert.deepEqual(
    collection.skills.map(({ slug }) => slug).sort(),
    indexedMembers,
    'collection membership should be derived from skill metadata',
  );
});

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

test('content repurposing has a terminal-free path and never requires FFmpeg', () => {
  const content = fs.readFileSync(
    path.join(
      __dirname,
      '..',
      'skills/content/composites/content-repurposing/SKILL.md',
    ),
    'utf8',
  );

  assert.match(content, /Transcript or text supplied.*fully terminal-free/i);
  assert.match(content, /Do not require FFmpeg or a local terminal/i);
  assert.match(content, /call_data_provider/i);
  assert.match(content, /request pasted captions or a transcript/i);
});

test('ScrapeCreators skills describe operations without assuming the CLI', () => {
  const dependencyPath = path.join(
    __dirname,
    '..',
    'skills/social/capabilities/scrapecreators-api/SKILL.md',
  );
  const dependency = fs.readFileSync(dependencyPath, 'utf8');

  assert.match(dependency, /Runtime selection/i);
  assert.match(dependency, /call_data_provider/i);
  assert.match(dependency, /GooseWorks CLI available/i);
  assert.match(dependency, /User-owned ScrapeCreators key/i);
  assert.doesNotMatch(
    dependency,
    /(?:npx\s+)?gooseworks call scrapecreators/i,
  );

  const dependents = index.skills.filter((skill) =>
    skill.metadata?.requires_skills?.includes('scrapecreators-api'),
  );
  assert.ok(dependents.length > 0, 'expected ScrapeCreators-dependent skills');

  for (const skill of dependents) {
    const content = fs.readFileSync(
      path.join(__dirname, '..', skill.path, 'SKILL.md'),
      'utf8',
    );
    assert.doesNotMatch(
      content,
      /(?:npx\s+)?gooseworks call scrapecreators/i,
      `${skill.slug} should not assume the GooseWorks CLI`,
    );
  }

  const operationSkills = [
    'competitor-ad-intelligence',
    'find-twitter-influencers',
    'gtm-enrichment-smart',
    'instagram-scraper',
    'linkedin-scraper',
    'social-listening',
    'tiktok-search',
    'twitter-profile-lookup',
  ];
  for (const slug of operationSkills) {
    const skill = skillsBySlug.get(slug);
    assert.ok(skill, `${slug} should be indexed`);
    const content = fs.readFileSync(
      path.join(__dirname, '..', skill.path, 'SKILL.md'),
      'utf8',
    );
    assert.match(
      content,
      /provider:\s*scrapecreators/i,
      `${slug} should preserve the provider operation`,
    );
  }
});

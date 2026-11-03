/**
 * Routing drift guard for the Brand Growth collection.
 *
 * GooseWorks routing has ONE source: skills/entry/gooseworks/routes.json. From
 * it, scripts/build-router.js writes the route tables in the gooseworks router
 * (skills/entry/gooseworks/SKILL.md) and collections/brand-growth/routes.json.
 * Collection membership lives in each skill's skill.meta.json. These tests
 * fail when the route table and the membership name different skills.
 */
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const repoRoot = path.join(__dirname, '..');
const routes = JSON.parse(
  fs.readFileSync(path.join(repoRoot, 'collections/brand-growth/routes.json'), 'utf8'),
);
const meta = JSON.parse(
  fs.readFileSync(path.join(repoRoot, 'collections/brand-growth/collection.meta.json'), 'utf8'),
);
const index = JSON.parse(fs.readFileSync(path.join(repoRoot, 'skills-index.json'), 'utf8'));

const SOURCE = routes.source.file;
const FIX = `Update ${SOURCE} (the single source), then run \`node scripts/build-router.js && npm run build:index\`.`;

test('the collection points at the single routing source instead of declaring its own', () => {
  assert.equal(meta.routes.$ref, './routes.json');
  assert.equal(meta.routes.source_file, routes.source.file);
  assert.equal(routes.source.file, 'skills/entry/gooseworks/routes.json');
});

test('routes.json is internally consistent (skills list matches the route table)', () => {
  const fromTable = [
    ...new Set(routes.brand_growth_routes.flatMap((r) => r.skills)),
  ]
    .filter((slug) => !routes.entry_skills.includes(slug))
    .sort();
  assert.deepEqual(routes.brand_growth_skills, fromTable, `routes.json is stale. ${FIX}`);
});

test('every routed Brand Growth skill exists in this repo', () => {
  const bySlug = new Map(index.skills.map((s) => [s.slug, s]));
  const missing = routes.brand_growth_skills.filter((slug) => !bySlug.has(slug));
  assert.deepEqual(
    missing,
    [],
    `${SOURCE} routes to ${missing.join(', ')}, which goose-skills does not publish. ` +
      `Either add the skill here or drop the route there.`,
  );
});

test('routed Brand Growth skills and collection membership are the same set', () => {
  const members = index.skills
    .filter((s) => s.metadata?.collections?.includes('brand-growth'))
    .map((s) => s.slug)
    .sort();

  const notRouted = members.filter((s) => !routes.brand_growth_skills.includes(s));
  const notMember = routes.brand_growth_skills.filter((s) => !members.includes(s));

  assert.deepEqual(
    notRouted,
    [],
    `${notRouted.join(', ')} claim \`collections: ["brand-growth"]\` but no route in ${SOURCE} ` +
      `names them, so the router will never send work their way. ${FIX}`,
  );
  assert.deepEqual(
    notMember,
    [],
    `${SOURCE} routes Brand Growth work to ${notMember.join(', ')}, but they are not members of ` +
      `the collection. Add \`"brand-growth"\` to their skill.meta.json \`collections\`, then ` +
      `\`npm run build:index\`.`,
  );
});

test('entry skills are published from skills/entry and are not collection members', () => {
  const bySlug = new Map(index.skills.map((s) => [s.slug, s]));
  for (const slug of routes.entry_skills) {
    const skill = bySlug.get(slug);
    assert.ok(skill, `${slug} is an entry skill but is not in the catalog`);
    assert.ok(skill.path.startsWith('skills/entry/'), `${slug} must live in skills/entry/`);
    assert.equal(
      skill.metadata?.collections?.includes('brand-growth') ?? false,
      false,
      `${slug} is an entry point into the collection, not a member of it.`,
    );
  }
});

test('the retired formats.json / formats.meta.json stay retired (GOOSE-3192)', () => {
  for (const file of ['formats.json', 'formats.meta.json']) {
    assert.equal(
      fs.existsSync(path.join(repoRoot, file)),
      false,
      `${file} was retired — ad/video formats come from the app's content_formats registry. ` +
        `Do not reintroduce a second format table.`,
    );
  }
});

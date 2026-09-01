/**
 * GOOSE-3190 — routing drift guard for the Brand Growth collection.
 *
 * Routing used to be declared in three hand-synced places:
 *   1. `gooseworks/src/skills/routes.ts` — now the SINGLE SOURCE,
 *   2. `gooseworks-app/backend/src/app-mcp-server/lib/ads-skill.ts`,
 *   3. this repo's `collections/brand-growth`.
 *
 * This repo no longer declares routing of its own: `collections/brand-growth/
 * routes.json` is a derived mirror of the source, and collection membership
 * lives in each skill's `skill.meta.json`. These tests fail when the mirror and
 * the membership name different skills — i.e. when one routing source knows
 * about a skill the others don't.
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

const SOURCE = `${routes.source.repo}/${routes.source.file}`;
const FIX = `Update ${SOURCE} (the single source), re-run \`npm run generate:skills\` there, copy the result into collections/brand-growth/routes.json, then \`npm run build:index\` here.`;

test('the collection points at the single routing source instead of declaring its own', () => {
  assert.equal(meta.routes.$ref, './routes.json');
  assert.equal(meta.routes.source_repo, routes.source.repo);
  assert.equal(meta.routes.source_file, routes.source.file);
  assert.ok(routes.source.raw_url.endsWith('/skills/routes.json'));
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

test('entry skills are vendored by the CLI, not published as collection members', () => {
  const bySlug = new Map(index.skills.map((s) => [s.slug, s]));
  for (const slug of routes.entry_skills) {
    assert.equal(
      bySlug.has(slug),
      false,
      `${slug} is a CLI-vendored entry skill; it must not also be published here as a catalog ` +
        `skill (that is exactly the duplicate-contract problem the single source exists to prevent).`,
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

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const { pathToFileURL } = require('node:url');
const yaml = require('js-yaml');

const skill = path.resolve(__dirname, '..');
const root = path.resolve(skill, '../../../..');
const readJson = (file) => JSON.parse(fs.readFileSync(file, 'utf8'));
const text = fs.readFileSync(path.join(skill, 'SKILL.md'), 'utf8');
const meta = readJson(path.join(skill, 'skill.meta.json'));
const index = readJson(path.join(root, 'skills-index.json'));

test('catalog distribution includes the skill and every linked reference', () => {
  const frontmatter = text.match(/^---\n([\s\S]*?)\n---\n/);
  assert.ok(frontmatter);
  const parsed = yaml.load(frontmatter[1]);
  assert.match(frontmatter[1], /^description: [^>|\n][^\n]+$/m);
  const entries = index.skills.filter((entry) => entry.slug === meta.slug);
  assert.equal(entries.length, 1);
  const [entry] = entries;
  assert.equal(entry.description, parsed.description);
  assert.equal(entry.version, meta.version);
  assert.deepEqual(meta.installation.supports, ['claude', 'cursor', 'codex']);
  assert.deepEqual(meta.requires_skills, []);
  assert.ok(entry.files.includes(`${entry.path}/SKILL.md`));
  for (const [, ref] of text.matchAll(/\]\((references\/[^)]+)\)/g)) {
    assert.ok(fs.existsSync(path.join(skill, ref)), `Missing ${ref}`);
    assert.ok(entry.files.includes(`${entry.path}/${ref}`), `Reference not distributed: ${ref}`);
  }
});

test('runtime skill prose avoids the catalog WAF triggers', () => {
  const body = text.split('---\n').slice(2).join('---\n');
  for (const pattern of [
    /\$[A-Za-z_{]/,
    /(?:^|\s)(?:~\/|\/(?:Users|home|tmp|workspace|etc)\/)/m,
    /`[^`\n]+`/,
    /https?:\/\/(?:github\.com|raw\.githubusercontent\.com|gitlab\.com)/i,
    /\b(?:node_modules|npm\s+(?:install|ci)|npx|pip\s+install)\b/,
  ]) assert.doesNotMatch(body, pattern);
});

test('the catalog and CLI mirror route to one catalog skill', () => {
  const mirror = readJson(path.join(root, 'collections/brand-growth/routes.json'));
  assert.ok(meta.collections.includes('brand-growth'));
  assert.equal(meta.collection_stage, 'create');
  assert.equal(mirror.brand_growth_routes.filter((route) => route.skills.includes(meta.slug)).length, 1);
  assert.ok(mirror.brand_growth_skills.includes(meta.slug));
  assert.ok(!mirror.entry_skills.includes(meta.slug));
});

test('eval cases are consumable by the existing harness', () => {
  const evaluation = readJson(path.join(skill, 'eval/eval.json'));
  const schema = readJson(path.resolve(skill, 'eval', evaluation.$schema));
  assert.equal(evaluation.skill, meta.slug);
  // The skill can mutate state even though these scenarios are offline replays.
  assert.equal(evaluation.safety.mutatesExternalState, true);
  const kinds = schema.properties.cases.items.properties.assertions.items.properties.type.enum;
  assert.equal(new Set(evaluation.cases.map((c) => c.name)).size, evaluation.cases.length);
  for (const c of evaluation.cases) {
    assert.ok(c.prompt && c.rubric, c.name);
    for (const fixture of c.fixtures) assert.ok(fs.existsSync(path.join(skill, 'eval', fixture)));
    for (const assertion of c.assertions) assert.ok(kinds.includes(assertion.type), assertion.type);
  }
});

// Optional cross-repo contract check. No copied Zod implementation or guessed schemas.
// The API checkout supplies its own tsx and zod; it is read-only throughout.
test('example requests conform to the actual frozen action schemas', {
  skip: !process.env.GOOSEWORKS_APP_DIR && 'Set GOOSEWORKS_APP_DIR to a pages-contract checkout',
}, () => {
  const api = path.join(process.env.GOOSEWORKS_APP_DIR, 'apps/api');
  const schemaUrl = pathToFileURL(path.join(api, 'src/app-mcp-server/mcp-tools/pages/schemas.ts')).href;
  const fixtures = readJson(path.join(__dirname, 'requests.json'));
  const code = `
    import { readFileSync } from 'node:fs';
    import * as imported from ${JSON.stringify(schemaUrl)};
    const schemas = imported.default ?? imported;
    for (const c of JSON.parse(readFileSync(0, 'utf8'))) {
      const result = schemas[c.schema].safeParse(c.input);
      if (result.success !== c.valid) throw new Error(c.name + ': ' + JSON.stringify(result));
    }
  `;
  const result = spawnSync(process.execPath, ['--import', 'tsx', '--input-type=module', '-e', code], {
    cwd: api, input: JSON.stringify(fixtures), encoding: 'utf8', timeout: 30000,
  });
  assert.equal(result.status, 0, result.error?.message || result.stderr);
});

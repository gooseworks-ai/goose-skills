'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('path');
const { execFileSync } = require('child_process');
const { lintText } = require('../check-tool-names');
const NAMES = require('../lib/action-names.json');

const names = (text, options) => lintText(text, options).map((p) => p.name);

test('a listed tool passes, in prose and prefixed', () => {
  assert.deepEqual(names('Call `brand_read`, then gooseworks:video_production and mcp__gooseworks__file_url.'), []);
});

test('a hidden name fails and the message names the listed tool', () => {
  const [problem] = lintText('Start with brain_map.');
  assert.equal(problem.name, 'brain_map');
  assert.match(problem.why, /brand_knowledge_browse/);
  assert.deepEqual(names('Then call video_make.'), ['video_make']);
});

test('a removed name fails in code too', () => {
  assert.deepEqual(names('client.call("video_project_upsert")', { prose: false }), ['video_project_upsert']);
});

test('an invented tool fails when prefixed or phrased as a call', () => {
  assert.deepEqual(names('Use gooseworks:totally_fake_tool.'), ['totally_fake_tool']);
  assert.deepEqual(names('Then call `totally_fake_tool` once.'), ['totally_fake_tool']);
  assert.deepEqual(names('The totally_fake_tool tool returns a list.'), ['totally_fake_tool']);
});

test('the reviewer\'s probes fail: capital Call, function form, use/run, a table cell, any GooseWorks server prefix', () => {
  assert.deepEqual(names('Call `brand_fetch_everything` first.'), ['brand_fetch_everything']);
  assert.deepEqual(names('Then brand_fetch_everything({brand_id}).'), ['brand_fetch_everything']);
  assert.deepEqual(names('Run `brand_fetch_everything` once.'), ['brand_fetch_everything']);
  assert.deepEqual(names('| Read | `brand_fetch_everything` | free |'), ['brand_fetch_everything']);
  assert.deepEqual(names('Use mcp__claude_ai_GooseWorks__brand_fetch_everything.'), ['brand_fetch_everything']);
  assert.deepEqual(names('Use mcp__GooseWorks__brand_fetch_everything.'), ['brand_fetch_everything']);
  assert.deepEqual(names('Call `whoami`.'), ['whoami']);
});

test('script functions and fields are not tools', () => {
  assert.deepEqual(names('Call `load_fal_key()` first.'), []);
  assert.deepEqual(names('Use `parse_brief_json` to read it.'), []);
  assert.deepEqual(names('| `request_id` | the job |'), []);
});

test('another server\'s tool passes only when other_tools gives its reason', () => {
  const [other] = Object.keys(NAMES.other_tools);
  assert.deepEqual(names(`Call \`${other}\` first.`), []);
});

test('"call x" in code is a function call, not a tool', () => {
  assert.deepEqual(names('# never re-call fal_generate here', { prose: false }), []);
});

test('the name lists do not overlap', () => {
  const listed = new Set(NAMES.actions);
  for (const name of Object.keys(NAMES.renamed)) assert.ok(!listed.has(name), `${name} is listed and renamed`);
  for (const name of NAMES.removed) assert.ok(!listed.has(name) && !NAMES.renamed[name], `${name} is listed or renamed and removed`);
  for (const to of Object.values(NAMES.renamed)) {
    for (const name of to.split(' / ')) assert.ok(listed.has(name), `renamed target ${name} is not listed`);
  }
});

// Opt-in, like the recipe snapshot test: GOOSEWORKS_APP_DIR=<gooseworks-app checkout>.
test('action-names.json matches gooseworks-app', { skip: !process.env.GOOSEWORKS_APP_DIR && 'set GOOSEWORKS_APP_DIR to compare with gooseworks-app' }, () => {
  const ref = (NAMES.source_ref || 'origin/dev').split(' @ ')[0];
  execFileSync('node', [path.join(__dirname, '..', 'refresh-action-names.js'), '--app', process.env.GOOSEWORKS_APP_DIR, '--ref', ref, '--check'], { stdio: 'inherit' });
});

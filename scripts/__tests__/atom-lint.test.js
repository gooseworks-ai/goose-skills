'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { makeRepo, commitAll, run } = require('./atom-checks.helpers');

const SKILL = path.join('skills', 'ads', 'capabilities', 'clip-maker', 'SKILL.md');
const clean = '# clip-maker\n\nWrite the prompt as one shot with one camera move.\n';

function branchAdds(text) {
  const { root, base } = makeRepo({ 'clip-maker': { skill: clean } });
  fs.appendFileSync(path.join(root, SKILL), text);
  commitAll(root);
  return run('atom-lint.js', root, ['--base', base]);
}

test('a clean change to an atom passes', () => {
  const res = branchAdds('Keep the subject centred.\n');
  assert.equal(res.code, 0, res.out);
});

test('fails when a touched atom gains a dollar amount', () => {
  const res = branchAdds('Each clip costs about $3.\n');
  assert.equal(res.code, 1, res.out);
  assert.match(res.out, /error money\.credits_only: .*SKILL\.md:4 "\$3"/);
});

test('fails when a touched atom names a removed action', () => {
  const res = branchAdds('When the clip is done, call submit_render with its link.\n');
  assert.equal(res.code, 1, res.out);
  assert.match(res.out, /error action\.real_names_only: .*"submit_render"/);
});

test('fails when a removed action shows up in an atom script', () => {
  const { root, base } = makeRepo({ 'clip-maker': { skill: clean } });
  fs.writeFileSync(path.join(root, path.dirname(SKILL), 'relay.py'), 'TOOL = "data_post_provider"\n');
  commitAll(root);
  const res = run('atom-lint.js', root, ['--base', base]);
  assert.equal(res.code, 1, res.out);
  assert.match(res.out, /error action\.real_names_only: .*relay\.py:1 "data_post_provider"/);
});

test('fails when a touched atom gains an install line', () => {
  const res = branchAdds('First run npm install in the scripts folder.\n');
  assert.equal(res.code, 1, res.out);
  assert.match(res.out, /error setup\.no_install: .*"npm install"/);
});

test('old debt in an untouched atom only warns', () => {
  const { root, base } = makeRepo({
    'clip-maker': { skill: clean },
    'old-atom': { skill: '# old-atom\n\nEach take costs $3. Run npm install first.\n' },
  });
  fs.appendFileSync(path.join(root, SKILL), 'Keep the subject centred.\n');
  commitAll(root);
  const res = run('atom-lint.js', root, ['--base', base]);
  assert.equal(res.code, 0, res.out);
  assert.match(res.out, /warning money\.credits_only: .*old-atom\/SKILL\.md:3 "\$3"/);
  assert.match(res.out, /warning setup\.no_install: .*old-atom\/SKILL\.md:3 "npm install"/);
});

test('old debt in a touched atom warns, while debt the branch adds fails', () => {
  const { root, base } = makeRepo({ 'clip-maker': { skill: `${clean}Each take costs $3.\n` } });
  fs.appendFileSync(path.join(root, SKILL), 'Keep the subject centred.\n');
  commitAll(root);
  const kept = run('atom-lint.js', root, ['--base', base]);
  assert.equal(kept.code, 0, kept.out);
  assert.match(kept.out, /warning money\.credits_only: .*"\$3"/);

  fs.appendFileSync(path.join(root, SKILL), 'A retake costs $3.\n');
  commitAll(root);
  const added = run('atom-lint.js', root, ['--base', base]);
  assert.equal(added.code, 1, added.out);
});

test('--strict fails on old debt too', () => {
  const { root } = makeRepo({ 'old-atom': { skill: '# old-atom\n\nEach take costs $3.\n' } });
  const res = run('atom-lint.js', root, ['--strict']);
  assert.equal(res.code, 1, res.out);
});

test('lint_allow keeps a reviewed creative line', () => {
  const { root, base } = makeRepo({ 'clip-maker': { skill: clean } });
  fs.appendFileSync(path.join(root, SKILL), 'The mockup shows the reply bubble from ChatGPT.\n');
  fs.writeFileSync(
    path.join(root, path.dirname(SKILL), 'skill.meta.json'),
    JSON.stringify({
      slug: 'clip-maker',
      version: '1.0.0',
      lint_allow: [{ rule: 'atom.no_client_names', match: 'ChatGPT', reason: 'the mockup draws that app' }],
    }),
  );
  commitAll(root);
  const res = run('atom-lint.js', root, ['--base', base]);
  assert.equal(res.code, 0, res.out);
});

test('a base that does not resolve stops the check instead of passing it', () => {
  const { root } = makeRepo({ 'clip-maker': { skill: clean } });
  const res = run('atom-lint.js', root, ['--base', 'origin/no-such-branch']);
  assert.equal(res.code, 2, res.out);
});

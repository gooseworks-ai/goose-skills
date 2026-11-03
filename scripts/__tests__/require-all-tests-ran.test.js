'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { summary, problems } = require('../require-all-tests-ran');

test('node --test summaries', () => {
  assert.deepEqual(problems(summary('# tests 3\n# pass 3\n# skipped 0\n')), []);
  assert.deepEqual(problems(summary('ℹ tests 3\nℹ pass 2\nℹ skipped 1\n')), ['1 skipped']);
});

test('pytest summaries', () => {
  assert.deepEqual(problems(summary('...\n714 passed in 12.30s\n')), []);
  assert.deepEqual(problems(summary('======= 714 passed, 1 skipped in 12.30s =======\n')), ['1 skipped']);
  assert.deepEqual(summary('3 passed, 1 failed in 1.0s\n').fail, 1);
});

test('no summary fails', () => {
  assert.deepEqual(problems(summary('nothing here')), ['no test summary found']);
});

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { kitPieceName } from './part.mjs';

test('piece names stay unique when an id and a fallback would collide', () => {
  const used = new Set();
  const names = ['2', null, 'two', 'two'].map((id, i) => kitPieceName('line', id, i, used));
  assert.equal(new Set(names).size, names.length, names.join(', '));
  assert.deepEqual(names, ['line-2', 'line-2-2', 'line-two', 'line-4']);
  for (const n of names) assert.match(n, /^[a-z0-9][a-z0-9_-]{0,47}$/);
  // The same plan gives the same names (piece keys are stable across runs).
  const again = new Set();
  assert.deepEqual(['2', null, 'two', 'two'].map((id, i) => kitPieceName('line', id, i, again)), names);
});

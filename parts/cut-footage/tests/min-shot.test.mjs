// cut-footage 1.2.1: inserts never leave a shot under 0.4 s where a hold can avoid it.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { cutHoldShortShots } from '../src/plan.mjs';

const fps = 30;
const slot = (id, start_s, end_s, kind = 'window') => ({ scene: { id }, kind, start_s, end_s, stretched_s: 0, early_s: 0 });

test('a creator flash between two inserts is covered by holding the first', () => {
  const slots = [slot('s1', 1, 2), slot('s2', 2.2, 4)];
  const left = cutHoldShortShots(slots, { duration: 6, fps });
  assert.deepEqual(left, []);
  assert.equal(slots[0].end_s, 2.2);
  assert.ok(Math.abs(slots[0].held_s - 0.2) < 1e-9);
  assert.equal(slots[1].held_s, undefined);
});

test('a creator flash before the end is covered by the last insert', () => {
  const slots = [slot('s1', 1, 5.8)];
  cutHoldShortShots(slots, { duration: 6, fps });
  assert.equal(slots[0].end_s, 6);
});

test('a short insert is held on while the creator after it keeps 0.4 s', () => {
  const roomy = [slot('s1', 1, 1.2), slot('s2', 3, 4)];
  assert.deepEqual(cutHoldShortShots(roomy, { duration: 6, fps }), []);
  assert.ok(Math.abs(roomy[0].end_s - 1.4) < 1e-9);

  const tight = [slot('s1', 1, 1.2), slot('s2', 1.9, 3)];
  const left = cutHoldShortShots(tight, { duration: 6, fps });
  assert.ok(tight[0].end_s - tight[0].start_s >= 0.4 - 1e-9);
  assert.ok(tight[1].start_s - tight[0].end_s >= 0.4 - 1e-9);
  assert.deepEqual(left, []);
});

test('what no hold can fix is reported, and a grid is never held', () => {
  const slots = [slot('s1', 0.2, 2), slot('g', 3, 4, 'grid'), slot('s3', 4.1, 5), slot('s4', 5, 5.2)];
  const left = cutHoldShortShots(slots, { duration: 5.2, fps });
  assert.equal(slots[1].held_s, undefined);
  assert.deepEqual(left.map((l) => [l.scene_id, l.shot]), [['s1', 'creator before'], ['g', 'creator after'], ['s4', 'insert']]);
});

test('holds keep every start where it was', () => {
  const slots = [slot('s1', 1, 2), slot('s2', 2.1, 2.3), slot('s3', 3, 4)];
  cutHoldShortShots(slots, { duration: 6, fps });
  assert.deepEqual(slots.map((s) => s.start_s), [1, 2.1, 3]);
});

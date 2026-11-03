// `reuses_pieces_of` in part.json lets an approved video move to this version and keep the pieces it
// already bought (the server reuses them by their request digest). That is only honest when this
// version orders exactly the same pieces as every version it names, so this test runs each of them
// on the part's fixtures (parts/<id>/tests/pieces.fixture.mjs) and compares every paid request:
// piece, provider, path and body, files as their sha256. It also checks the new version returns
// everything the old one did, so the steps after it still get their inputs.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { PARTS_ROOT, hasFfmpeg } from './kit-harness.mjs';
import { PIECES_FIXTURE, declaredReuses, inputsDir, pieceBodies, piecesFixture } from './piece-bodies.mjs';

const ffmpeg = await hasFfmpeg();
const declared = declaredReuses();
const manifestOf = (id, version) => JSON.parse(readFileSync(join(PARTS_ROOT, id, version, 'part.json'), 'utf8'));
const parts = (v) => v.split('.').map(Number);
const older = (a, b) => {
  const [x, y] = [parts(a), parts(b)];
  return x[0] - y[0] || x[1] - y[1] || x[2] - y[2];
};

test('each declaration names older published versions of the same major, with the same models and kit range, and has fixtures', () => {
  for (const { id, version, reuses } of declared) {
    const where = `${id} ${version} reuses_pieces_of`;
    assert.ok(Array.isArray(reuses) && reuses.length > 0, `${where} must list versions`);
    const now = manifestOf(id, version);
    for (const old of reuses) {
      assert.ok(existsSync(join(PARTS_ROOT, id, old, 'part.json')), `${where} names ${old}, which is not published`);
      assert.ok(older(old, version) < 0, `${where} names ${old}, which is not older`);
      assert.equal(parts(old)[0], parts(version)[0], `${where} names ${old}, from another major`);
      const then = manifestOf(id, old);
      assert.deepEqual(now.needs.models, then.needs.models, `${where} names ${old}, which orders other models`);
      assert.equal(now.kit, then.kit, `${where} names ${old}, which runs on another kit range`);
    }
    assert.ok(existsSync(join(PARTS_ROOT, id, PIECES_FIXTURE)), `${id} declares reuses_pieces_of, so it needs ${PIECES_FIXTURE}`);
  }
});

for (const { id, version, reuses } of declared) {
  test(`${id} ${version} orders exactly the pieces ${reuses.join(', ')} ordered`, { skip: !ffmpeg && 'ffmpeg is not installed' }, async () => {
    const cases = await piecesFixture(id);
    assert.ok(cases?.length, `${id}/${PIECES_FIXTURE} must export cases`);
    for (const kase of cases) {
      const inputs = await kase.inputs(inputsDir(id, kase.name));
      const now = await pieceBodies(id, version, kase, inputs);
      assert.ok(now.orders.length > 0, `${kase.name}: ${version} ordered nothing, so the case proves nothing`);
      for (const old of reuses) {
        const then = await pieceBodies(id, old, kase, inputs);
        assert.deepEqual(now.orders, then.orders, `${kase.name}: ${version} orders other pieces than ${old}`);
        for (const key of Object.keys(then.outputs)) assert.ok(key in now.outputs, `${kase.name}: ${version} no longer returns ${key}`);
      }
    }
  });
}

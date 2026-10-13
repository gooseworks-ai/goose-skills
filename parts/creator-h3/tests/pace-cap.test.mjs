// creator-h3 1.2.3: takes are never planned faster than H3 speaks (3.2 words a second).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadNewest, hasFfmpeg, makeCtx } from '../../_tools/kit-harness.mjs';
import { sample } from './fixture.mjs';

const { dir, mod, manifest } = await loadNewest('creator-h3');
const skip = !(await hasFfmpeg()) && 'ffmpeg is not installed';

async function takesAt(wps) {
  const { ctx, orders } = makeCtx({ partDir: dir, line: sample.line });
  await mod.run({ ...(await sample.inputs(ctx.workDir)), words_per_second: wps }, ctx);
  return orders.map((o) => [o.body.duration, o.body.prompt]);
}

test('a style asking for more than 3.2 words a second gets 3.2 words a second', { skip }, async () => {
  assert.deepEqual(await takesAt(3.9), await takesAt(3.2));
});

test('the measured pace band is published with the part', () => {
  assert.deepEqual(manifest['x-speech-rate'], { words_per_second: { low: 2.3, high: 3.2 }, plans_at_most: 3.2 });
});

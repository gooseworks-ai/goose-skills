import { test } from 'node:test';
import assert from 'node:assert/strict';
import { hasFfmpeg, loadNewest, makeCtx } from '../../_tools/kit-harness.mjs';
import { sample } from './fixture.mjs';

const { dir, mod } = await loadNewest('lipsync-veed');
const skip = !(await hasFfmpeg()) && 'ffmpeg is not installed';

async function resolutions(extra) {
  const { ctx, orders } = makeCtx({ partDir: dir, line: sample.line });
  const { resolution, ...inputs } = await sample.inputs(ctx.workDir);
  await mod.run({ ...inputs, ...extra }, ctx);
  return [...new Set(orders.map((o) => o.body.resolution))];
}

test('1.1.0: Standard (the default) lip-syncs at 480p and Best at 720p; an explicit resolution wins', { skip }, async () => {
  assert.deepEqual(await resolutions({}), ['480p']);
  assert.deepEqual(await resolutions({ quality_tier: 'standard' }), ['480p']);
  assert.deepEqual(await resolutions({ quality_tier: 'best' }), ['720p']);
  assert.deepEqual(await resolutions({ quality_tier: 'standard', resolution: '720p' }), ['720p']);
});

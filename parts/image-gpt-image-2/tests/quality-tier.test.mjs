import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { hasFfmpeg, loadNewest, makeCtx } from '../../_tools/kit-harness.mjs';
import { pngLine } from './fixture.mjs';

const { dir, mod } = await loadNewest('image-gpt-image-2');
const manifest = JSON.parse(readFileSync(join(dir, 'part.json'), 'utf8'));
const skip = !(await hasFfmpeg()) && 'ffmpeg is not installed';
const cast = [{ key: 'creator', name: 'Jess', look: 'woman, 28, freckles, messy bun, grey hoodie' }];

async function quality(extra) {
  const { ctx, orders } = makeCtx({ partDir: dir, line: pngLine });
  await mod.run({ cast, ...extra }, ctx);
  return orders.map((o) => o.body.quality);
}

test('1.3.0 takes quality_tier: standard or best', () => {
  assert.equal(manifest.version, '1.3.0');
  assert.deepEqual(manifest.inputs.properties.quality_tier.enum, ['standard', 'best']);
});

test('Standard (the default) draws at medium and Best at high; an explicit quality wins', { skip }, async () => {
  assert.deepEqual(await quality({}), ['medium']);
  assert.deepEqual(await quality({ quality_tier: 'best' }), ['high']);
  assert.deepEqual(await quality({ quality_tier: 'standard', quality: 'high' }), ['high']);
});

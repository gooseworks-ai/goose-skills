// creator-h3 1.6.0: every take keeps the first frame's light and exposure, matte skin, no added
// shine or sharpening halos (H3 added gloss, HDR contrast and halos to clean stills in two test
// videos), and make_character.py 2.5.0's shot and skin_condition are accepted.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { hasFfmpeg, loadNewest, loadPart, makeCtx } from '../../_tools/kit-harness.mjs';
import { reviewedInputs, sample } from './fixture.mjs';

const { dir, mod } = await loadNewest('creator-h3');
const v150 = await loadPart('creator-h3', '1.5.0');
const skip = !(await hasFfmpeg()) && 'ffmpeg is not installed';
const LOCK = "Keep the first frame's light and exposure, matte skin, no added shine or sharpening halos.";

async function firstTake(part, edit = (inputs) => inputs) {
  const { ctx, orders } = makeCtx({ partDir: part.dir, line: sample.line });
  const out = await part.mod.run(edit(await reviewedInputs(ctx.workDir)), ctx);
  return { out, orders };
}

test('every take carries the light lock, right after the real-skin line, starting on the still', { skip }, async () => {
  const { orders } = await firstTake({ dir, mod });
  const { prompt, image_url } = orders[0].body;
  assert.ok(prompt.includes(`no waxy finish or sharpening halos.\n${LOCK}\n`), prompt);
  assert.ok(image_url, 'the anchor still is the first frame the lock refers to');
});

test("make_character.py 2.5.0's shot and skin_condition are accepted", { skip }, async () => {
  const { orders } = await firstTake({ dir, mod }, (inputs) => ({ ...inputs, character: { ...inputs.character, shot: 'talking', skin_condition: 'a few small acne spots on the chin' } }));
  assert.equal(orders.length, 1);
  await assert.rejects(firstTake({ dir, mod }, (inputs) => ({ ...inputs, character: { ...inputs.character, shot: 'b-roll' } })));
});

test('1.5.0 is unchanged: no light lock, and it refuses the new character fields', { skip }, async () => {
  const { orders } = await firstTake(v150);
  assert.ok(!orders[0].body.prompt.includes(LOCK));
  await assert.rejects(firstTake(v150, (inputs) => ({ ...inputs, character: { ...inputs.character, shot: 'talking' } })));
});

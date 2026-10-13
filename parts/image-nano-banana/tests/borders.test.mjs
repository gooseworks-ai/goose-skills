// image-nano-banana 1.2.3: product photos are trimmed before they are sent, and a still with a border is
// cropped or fails the step; it is never drawn a second time.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileRef, framePixels, hasFfmpeg, loadNewest, makeCtx, probe, run } from '../../_tools/kit-harness.mjs';
import { falReply, productsInputs, sample, scenesInputs } from './fixture.mjs';

const { dir, mod } = await loadNewest('image-nano-banana');
const skip = !(await hasFfmpeg()) && 'ffmpeg is not installed';

/** Whether the picture's top row is mostly not black. */
async function topRowLit(path) {
  const px = await framePixels(path, 0, 216, 384);
  let lit = 0;
  for (let x = 0; x < 216; x++) if (Math.max(px.data[x * 3], px.data[x * 3 + 1], px.data[x * 3 + 2]) > 24) lit++;
  return lit > 216 * 0.5;
}

/** A fake line whose stills come back with black bands `pad` px high top and bottom (216x384). */
function bandedLine(pad) {
  return async (order, ctx) => {
    const name = order.results[0].name;
    const path = join(ctx.workDir, name);
    await run('ffmpeg', ['-hide_banner', '-nostdin', '-loglevel', 'error', '-y', '-f', 'lavfi', '-i', `testsrc2=size=216x${384 - 2 * pad}:duration=1`, '-vf', pad ? `pad=216:384:0:${pad}:black` : 'null', '-frames:v', '1', '-c:v', 'png', path]);
    return { json: falReply(name), files: { [name]: await fileRef(path, 'image') }, reused: false };
  };
}

test('thin bands are cropped off in the frame shape; borders keep leaves the still as drawn', { skip }, async () => {
  const work = mkdtempSync(join(tmpdir(), 'nb-'));
  const inputs = await scenesInputs(work, { anchor: 'none', pick: { tags: ['Product'] } });
  {
    const { ctx, orders } = makeCtx({ partDir: dir, workDir: join(work, 'a'), line: bandedLine(12) });
    const out = await mod.run(inputs, ctx);
    assert.equal(orders.length, 1, 'no second piece');
    const info = await probe(out.images[0].image.path);
    assert.deepEqual([info.width, info.height], [216, 384], 'cropped, then scaled back to the frame');
    assert.ok(await topRowLit(out.images[0].image.path), 'no black band left at the top');
  }
  {
    const { ctx, orders } = makeCtx({ partDir: dir, workDir: join(work, 'b'), line: bandedLine(40) });
    const out = await mod.run({ ...inputs, borders: 'keep' }, ctx);
    assert.equal(orders.length, 1);
    assert.equal((await probe(out.images[0].image.path)).height, 384);
    assert.equal(await topRowLit(out.images[0].image.path), false, 'the band is still there');
  }
});

test('a still whose letterbox is too wide to crop fails the step in plain words, with no second piece', { skip }, async () => {
  const work = mkdtempSync(join(tmpdir(), 'nb-'));
  const inputs = await scenesInputs(work, { anchor: 'none', pick: { tags: ['Product'] } });
  const { ctx, orders } = makeCtx({ partDir: dir, workDir: join(work, 'step'), line: bandedLine(40) });
  await assert.rejects(mod.run(inputs, ctx), (e) => e.code === 'output_invalid' && /The picture for scene 3 came back with a border/.test(e.message));
  assert.equal(orders.length, 1, 'never drawn a second time');
});

test('a padded product photo is sent trimmed in products mode; borders is refused in images mode', { skip }, async () => {
  const work = mkdtempSync(join(tmpdir(), 'nb-'));
  const base = await productsInputs(work);
  const padded = join(work, 'padded.png');
  await run('ffmpeg', ['-hide_banner', '-nostdin', '-loglevel', 'error', '-y', '-f', 'lavfi', '-i', 'testsrc2=size=200x300:duration=1', '-vf', 'pad=600:600:200:150:white', '-frames:v', '1', padded]);
  const photo = await fileRef(padded, 'image');
  const { ctx, orders } = makeCtx({ partDir: dir, workDir: join(work, 'step'), line: bandedLine(0) });
  await mod.run({ ...base, kinds: ['snap'], products: [{ ...base.products[0], images: [photo] }] }, ctx);
  const sent = orders[0].body.image_urls[0];
  assert.notEqual(sent.sha256, photo.sha256, 'the trimmed copy is sent');
  const info = await probe(sent.path);
  assert.ok(Math.abs(info.width - 200) <= 8 && Math.abs(info.height - 300) <= 8, `${info.width}x${info.height}`);

  const { ctx: c2, orders: o2 } = makeCtx({ partDir: dir, line: sample.line });
  await assert.rejects(mod.run({ ...(await sample.inputs(work)), borders: 'fix' }, c2), (e) => e.code === 'bad_input' && /borders works only/.test(e.message));
  assert.equal(o2.length, 0);
});

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { join } from 'node:path';
import { loadNewest, countColor, fileRef, framePixels, hasFfmpeg, loadPart, makeCtx, makeVideo, probe } from '../../_tools/kit-harness.mjs';

const { dir, mod } = await loadNewest('cut-footage');
const ffmpeg = await hasFfmpeg();
const skip = !ffmpeg && 'ffmpeg is not installed';

async function fixture(ctx) {
  const card = await fileRef(await makeVideo(join(ctx.workDir, 'card.mp4'), 7, { width: 540, height: 960, tone: 0, pattern: 'color=c=0x000000' }), 'video');
  const footage = await fileRef(await makeVideo(join(ctx.workDir, 'broll.mp4'), 30, { width: 640, height: 360, tone: 0, pattern: 'color=c=0xff0000' }), 'video');
  return { card, footage };
}

test('fills the band with the footage window sped to fit, and leaves the rest of the card alone', { skip }, async () => {
  const { ctx } = makeCtx({ partDir: dir });
  const f = await fixture(ctx);
  const out = await mod.run({ video: f.card, footage: [{ file: f.footage, asset_id: 'a1', start_ms: 0, end_ms: 28000, audio: false }], band: { x: 0, y: 336, width: 540, height: 537 }, speed: 'fill', min_speed: 3, max_speed: 8 }, ctx);
  assert.equal(out.speed, 4, '28 s of footage fills a 7 s card at 4x');
  const info = await probe(out.video.path);
  assert.ok(Math.abs(info.duration_s - 7) < 0.1);
  const px = await framePixels(out.video.path, 3, 54, 96);
  const row = (y) => [...px.data.subarray(y * 54 * 3, y * 54 * 3 + 3)];
  assert.ok(row(50)[0] > 200 && row(50)[1] < 60, 'inside the band is the red footage');
  assert.ok(row(10)[0] < 30, 'above the band is the black card');
  assert.ok(row(92)[0] < 30, 'below the band is the black card');
  assert.ok(countColor(px, [255, 0, 0], 40) > 1000);
});

test('refuses a window that would play slower or faster than the style allows', { skip }, async () => {
  const { ctx } = makeCtx({ partDir: dir });
  const f = await fixture(ctx);
  const base = { video: f.card, band: { x: 0, y: 336, width: 540, height: 536 }, speed: 'fill', min_speed: 3, max_speed: 8 };
  await assert.rejects(mod.run({ ...base, footage: [{ video: f.footage, start_ms: 0, end_ms: 14000 }] }, ctx), (e) => e.code === 'bad_input' && /2x, outside 3x to 8x/.test(e.message));
  await assert.rejects(mod.run({ ...base, footage: [{ video: f.footage, start_ms: 0, end_ms: 40000 }] }, ctx), (e) => e.code === 'bad_input' && /not inside/.test(e.message));
});

test('refuses a footage entry with no clip file', { skip }, async () => {
  const { ctx } = makeCtx({ partDir: dir });
  const f = await fixture(ctx);
  await assert.rejects(mod.run({ video: f.card, footage: [{ asset_id: 'a1', start_ms: 0, end_ms: 28000 }], band: { x: 0, y: 336, width: 540, height: 536 } }, ctx), (e) => e.code === 'bad_input');
});

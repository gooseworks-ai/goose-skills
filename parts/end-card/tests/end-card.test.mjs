import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadNewest, browserMissing, browserProviderOrNull, countColor, framePixels, hasFfmpeg, loadPart, makeCtx, probe, sampleBrand } from '../../_tools/kit-harness.mjs';

const { dir, mod } = await loadNewest('end-card');
const ready = (await hasFfmpeg()) && browserProviderOrNull();
const skip = !ready && (browserMissing() || 'ffmpeg is not installed');

test('draws the card at the size asked, with the logo file unchanged and a silent track', { skip }, async () => {
  const { ctx } = makeCtx({ partDir: dir });
  const brand = await sampleBrand(ctx.workDir);
  const out = await mod.run({ brand, width: 540, height: 960, seconds: 2 }, ctx);
  const info = await probe(out.video.path);
  assert.deepEqual([info.width, info.height, info.has_audio], [540, 960, true]);
  assert.ok(Math.abs(info.duration_s - 2) < 0.1);
  assert.deepEqual(out.timeline.end_card, { start_s: 0, end_s: 2 });
  const px = await framePixels(out.video.path, 1);
  assert.ok(countColor(px, [224, 16, 32], 24) > 200, 'the red logo is drawn in its own colour');
});

test('a logo that does not contrast with the card sits on a plate, never recoloured', { skip }, async () => {
  const { ctx } = makeCtx({ partDir: dir });
  const brand = await sampleBrand(ctx.workDir, { logoColor: '#f4f4f4', background: '#ffffff' });
  const out = await mod.run({ brand, width: 540, height: 960, seconds: 1 }, ctx);
  const px = await framePixels(out.video.path, 0.5);
  assert.ok(countColor(px, [17, 17, 17], 10) > 500, 'a dark plate is drawn behind the pale logo');
  assert.ok(countColor(px, [244, 244, 244], 3) > 200, 'the logo keeps its own pale colour');
});

test('refuses stars without approved proof text, and a card with no call to action', { skip }, async () => {
  const { ctx } = makeCtx({ partDir: dir });
  const brand = await sampleBrand(ctx.workDir);
  await assert.rejects(mod.run({ brand, width: 540, height: 960, proof: { stars: 5, text: ' ' } }, ctx), (e) => e.code === 'bad_input');
  const { cta, ...noCta } = brand;
  await assert.rejects(mod.run({ brand: noCta, width: 540, height: 960 }, ctx), (e) => e.code === 'bad_input');
});

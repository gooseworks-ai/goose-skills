import { test } from 'node:test';
import assert from 'node:assert/strict';
import { join } from 'node:path';
import { loadNewest, browserMissing, browserProviderOrNull, countColor, fileRef, framePixels, hasFfmpeg, layerInputsFor, levelDb, loadPart, makeCtx, makeVideo, probe, sampleBrand } from '../../_tools/kit-harness.mjs';

const { dir, mod } = await loadNewest('brand-layer');
const ready = (await hasFfmpeg()) && browserProviderOrNull();
const skip = !ready && (browserMissing() || 'ffmpeg is not installed');

test('appends the brand card when the style ends on one and no step drew it', { skip }, async () => {
  const { ctx } = makeCtx({ partDir: dir });
  const video = await fileRef(await makeVideo(join(ctx.workDir, 'cut.mp4'), 3, { width: 540, height: 960, tone: 440 }), 'video');
  const brand = await sampleBrand(ctx.workDir);
  const out = await mod.run(await layerInputsFor(video, { brand, expect: { end_card: true } }), ctx);
  const info = await probe(out.video.path);
  assert.ok(Math.abs(info.duration_s - 5.2) < 0.1, `3s cut + 2.5s card - 0.3s fade = ${info.duration_s}s`);
  assert.deepEqual(out.timeline.end_card, { start_s: 2.7, end_s: 5.2 });
  assert.ok(countColor(await framePixels(out.video.path, 4.5), [224, 16, 32], 24) > 200, 'the logo is on the card');
  assert.ok((await levelDb(out.video.path, 1.0, 2.0)) > -30, 'the cut keeps its sound');
  assert.equal(await levelDb(out.video.path, 3.5, 5.0), -Infinity, 'the card holds in silence');
  const { readdirSync } = await import('node:fs');
  assert.deepEqual(readdirSync(ctx.workDir).filter((f) => f !== 'tmp' && !f.startsWith('cut') && !f.startsWith('logo')).sort(), ['branded.mp4'], 'only the declared output is left beside it');
});

test('passes the cut through untouched when a step drew the card or the style has none', { skip }, async () => {
  const { ctx } = makeCtx({ partDir: dir });
  const video = await fileRef(await makeVideo(join(ctx.workDir, 'cut.mp4'), 2, { width: 540, height: 960 }), 'video');
  const drawn = await layerInputsFor(video, { expect: { end_card: true }, timeline: { end_card: { start_s: 1, end_s: 2 } } });
  assert.equal((await mod.run(drawn, ctx)).video, video);
  const none = await layerInputsFor(video, { expect: { end_card: false } });
  assert.equal((await mod.run(none, ctx)).video, video);
});

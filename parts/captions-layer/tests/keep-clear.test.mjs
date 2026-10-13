// captions-layer 1.4.0: captions keep clear of the product (timeline.keep_clear, caption_look.keep_clear).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { browserMissing, browserProviderOrNull, fileRef, hasFfmpeg, layerInputsFor, loadNewest, loadPart, makeCtx, makeVideo, sha256 } from '../../_tools/kit-harness.mjs';

const { dir, mod } = await loadNewest('captions-layer');
const ready = (await hasFfmpeg()) && browserProviderOrNull();
const skip = !ready && (browserMissing() || 'ffmpeg is not installed');
const W = 540;
const H = 960;

const said = [['Try', 0.2, 0.5], ['it', 0.6, 0.9], ['today', 1.0, 1.4], ['for', 2.1, 2.3], ['free', 2.4, 2.8]].map(([text, s, e]) => ({ text, start_s: s, end_s: e }));

async function inputsFor(ctx, { keep_clear, caption_look } = {}) {
  const video = await fileRef(await makeVideo(join(ctx.workDir, 'cut.mp4'), 3.5, { width: W, height: H, tone: 440, pattern: 'color=c=0x2060c0' }), 'video');
  return layerInputsFor(video, {
    expect: { speech: 'voiceover', captions: true, ...(caption_look ? { caption_look } : {}) },
    timeline: {
      scenes: [{ id: 's1', start_s: 0, end_s: 2 }, { id: 's2', start_s: 2, end_s: 3.5 }],
      speech: [{ scene_id: 's1', text: 'Try it today', start_s: 0.2, end_s: 1.4, words: said.slice(0, 3) }, { scene_id: 's2', text: 'for free', start_s: 2.1, end_s: 2.8, words: said.slice(3) }],
      ...(keep_clear ? { keep_clear } : {}),
    },
  });
}

const meets = (a, b) => Math.min(a.x + a.w, b.x + b.w) > Math.max(a.x, b.x) && Math.min(a.y + a.h, b.y + b.h) > Math.max(a.y, b.y);
const product = (from, to) => ({ start_s: from, end_s: to, use: 'product', box: { x: 0.2 * W, y: 0.5 * H, w: 0.6 * W, h: 0.2 * H } });

test('with no keep-clear box the cut is drawn exactly as 1.3.1 draws it', { skip }, async () => {
  const old = await loadPart('captions-layer', '1.3.1');
  const a = makeCtx({ partDir: old.dir });
  const b = makeCtx({ partDir: dir });
  const outA = await old.mod.run(await inputsFor(a.ctx), a.ctx);
  const outB = await mod.run(await inputsFor(b.ctx), b.ctx);
  assert.equal(sha256(readFileSync(outB.video.path)), sha256(readFileSync(outA.video.path)), 'the same video bytes');
  assert.equal(readFileSync(outB.captions.path, 'utf8'), readFileSync(outA.captions.path, 'utf8'));
  assert.equal(readFileSync(outB.words.path, 'utf8'), readFileSync(outA.words.path, 'utf8'));
  assert.deepEqual(outB.timeline, outA.timeline);
});

test('a product box over 0.50-0.70 of the height moves that scene\'s captions to 0.80 (inside the platform band); the other scene keeps the look\'s height', { skip }, async () => {
  const { ctx, logs } = makeCtx({ partDir: dir });
  const out = await mod.run(await inputsFor(ctx, { keep_clear: [product(2, 3.5)] }), ctx);
  const record = JSON.parse(readFileSync(out.words.path, 'utf8'));
  const s1 = record.cues.filter((c) => c.start_s < 2);
  const s2 = record.cues.filter((c) => c.start_s >= 2);
  assert.ok(s1.length && s2.length);
  for (const c of s1) assert.equal(c.y, 0.62, `${c.text} stays at the look's height`);
  for (const c of s2) {
    assert.equal(c.y, 0.8, `${c.text} moves low`);
    assert.equal(c.overlap, 0);
    assert.ok(!meets(c.box, record.keep_clear[0].box), `${c.text} clears the product`);
  }
  assert.equal(out.timeline.keep_clear, undefined, 'keep_clear stops at the captions layer');
  assert.ok(logs.some(([, m]) => /moved clear of the product/.test(m)));
});

test('boxes over every height fall back to the least overlap, with a warning', { skip }, async () => {
  const { ctx, logs } = makeCtx({ partDir: dir });
  const all = { start_s: 0, end_s: 3.5, use: 'product', box: { x: 0, y: 0.2 * H, w: W, h: 0.65 * H } };
  const out = await mod.run(await inputsFor(ctx, { keep_clear: [all] }), ctx);
  const record = JSON.parse(readFileSync(out.words.path, 'utf8'));
  assert.ok(record.cues.every((c) => c.overlap > 0));
  assert.ok(logs.some(([level, m]) => level === 'warn' && /could not be kept clear/.test(m)));
});

test("the look's keep_clear (shares of the frame) works for the whole cut", { skip }, async () => {
  const { ctx } = makeCtx({ partDir: dir });
  const out = await mod.run(await inputsFor(ctx, { caption_look: { preset: 'plate', keep_clear: [{ x: 0.2, y: 0.5, w: 0.6, h: 0.2 }] } }), ctx);
  const record = JSON.parse(readFileSync(out.words.path, 'utf8'));
  assert.ok(record.cues.every((c) => c.y === 0.8 && c.overlap === 0));
  assert.equal(record.keep_clear[0].from, 'look');
});

test('a bad look keep_clear is dropped with a warning, never refused', { skip }, async () => {
  const { ctx, logs } = makeCtx({ partDir: dir });
  const out = await mod.run(await inputsFor(ctx, { caption_look: { preset: 'plate', keep_clear: [{ x: 2, y: 0, w: 1, h: 1 }] } }), ctx);
  assert.ok(logs.some(([, m]) => /keep_clear ignored/.test(m)));
  assert.equal(JSON.parse(readFileSync(out.words.path, 'utf8')).keep_clear, undefined);
});

test('the brand layer passes keep_clear on to the captions layer', { skip }, async () => {
  const layer = await loadNewest('brand-layer');
  const { ctx } = makeCtx({ partDir: layer.dir });
  const inputs = await inputsFor(ctx, { keep_clear: [product(2, 3.5)] });
  const out = await layer.mod.run(inputs, ctx);
  assert.deepEqual(out.timeline.keep_clear, inputs.timeline.keep_clear);
});

test('a box reaching 0.75 of the height sends captions up to 0.30: 0.80 is held above the platform controls', { skip }, async () => {
  const { ctx } = makeCtx({ partDir: dir });
  const low = { start_s: 0, end_s: 3.5, use: 'product', box: { x: 0.2 * W, y: 0.55 * H, w: 0.6 * W, h: 0.2 * H } };
  const out = await mod.run(await inputsFor(ctx, { keep_clear: [low] }), ctx);
  const record = JSON.parse(readFileSync(out.words.path, 'utf8'));
  assert.ok(record.cues.every((c) => c.y === 0.3 && c.overlap === 0));
});

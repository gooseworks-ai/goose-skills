// read-labels 1.0.0: the product's large label words read in frames of the cut against the real photo.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { join } from 'node:path';
import { fileRef, hasFfmpeg, loadPart, makeCtx, makeVideo } from '../../_tools/kit-harness.mjs';
import { labelFrameTimes, labelPrompt, parseLabelReply } from '../src/part.mjs';

const ffmpeg = await hasFfmpeg();
const skip = !ffmpeg && 'ffmpeg is not installed';

const timeline = (scenes, extra = {}) => ({ duration_s: 10, width: 360, height: 640, fps: 30, scenes, speech: [], ...extra });

test('two frames per scene, a third and two thirds in, none in the end card', () => {
  const t = labelFrameTimes(timeline([{ id: 's1', start_s: 0, end_s: 3 }, { id: 's2', start_s: 3, end_s: 6 }, { id: 'card', start_s: 6, end_s: 9 }], { end_card: { start_s: 6, end_s: 9 } }), 9);
  assert.deepEqual(t, [
    { t_s: 1, scene_id: 's1' }, { t_s: 2, scene_id: 's1' },
    { t_s: 4, scene_id: 's2' }, { t_s: 5, scene_id: 's2' },
  ]);
});

test('a long cut reads at most 16 frames, spread from the first to the last', () => {
  const scenes = Array.from({ length: 20 }, (_, i) => ({ id: `s${i + 1}`, start_s: i, end_s: i + 1 }));
  const t = labelFrameTimes(timeline(scenes), 20);
  assert.equal(t.length, 16);
  assert.equal(t[0].t_s, 0.333);
  assert.equal(t.at(-1).t_s, 19.667);
});

test('the prompt names every frame by its image number and time', () => {
  const p = labelPrompt('Dal Chawal', [{ t_s: 1.5 }, { t_s: 4 }]);
  assert.match(p, /Image 1 is a photo of the real product, Dal Chawal\./);
  assert.match(p, /image 2 is the frame at 1\.5 s; image 3 is the frame at 4 s/);
  assert.match(p, /Reply with JSON only/);
});

test('the reply is read from fenced JSON; a capitals-only difference is not a misspelling', () => {
  const r = parseLabelReply('```json\n{"label_words":["CUMIN CLUB","DAL CHAWAL"],"frames":[{"image":2,"product_seen":true,"words_read":["CUMIN CLUB"],"misspelled":[{"read":"Cumin Club","should_be":"CUMIN CLUB"},{"read":"CUMlN","should_be":"CUMIN"}]}]}\n```');
  assert.deepEqual(r.label_words, ['CUMIN CLUB', 'DAL CHAWAL']);
  assert.deepEqual(r.frames[0].misspelled, [{ read: 'CUMlN', should_be: 'CUMIN' }]);
  assert.equal(parseLabelReply('I cannot see a product.'), null);
  assert.equal(parseLabelReply('{"frames": "none"}'), null);
});

async function setup(reply) {
  const { dir, mod } = await loadPart('read-labels', '1.0.0');
  const { ctx, orders } = makeCtx({ partDir: dir, line: async () => ({ json: { output: reply }, files: {} }) });
  const video = await fileRef(await makeVideo(join(ctx.workDir, 'cut.mp4'), 6, { width: 360, height: 640 }), 'video');
  return { mod, ctx, orders, video };
}

test('a clean label passes, with what was read', { skip }, async () => {
  const reply = JSON.stringify({ label_words: ['DAL CHAWAL'], frames: [{ image: 2, product_seen: true, words_read: ['DAL CHAWAL'], misspelled: [] }] });
  const { mod, ctx, orders, video } = await setup(reply);
  const image = await fileRef(await stillPng(ctx.workDir), 'image');
  const tl = timeline([{ id: 's1', start_s: 0, end_s: 3 }, { id: 's2', start_s: 3, end_s: 6 }], { duration_s: 6 });
  const out = await mod.run({ video, timeline: tl, products: [{ id: 'p1', name: 'Dal Chawal', images: [image] }] }, ctx);
  assert.equal(out.video, undefined, 'a check part never returns the video');
  assert.deepEqual(out.verdict, { pass: true, checks: [{ code: 'flag:text_legible', status: 'pass', message: 'The product label reads right in all 1 frames that show it.', found: 'DAL CHAWAL' }], reasons: [] });
  assert.equal(out.labels.mirrored, 0);
  assert.equal(out.labels.misspelled, 0);
  assert.deepEqual(out.labels.frames.map((f) => [f.t_s, f.scene_id, f.product_seen]), [[1, 's1', true], [2, 's1', false], [4, 's2', false], [5, 's2', false]]);
  assert.equal(orders.length, 1);
  assert.equal(orders[0].path, 'openrouter/router/vision');
  assert.equal(orders[0].body.model, 'anthropic/claude-sonnet-5.5');
  assert.equal(orders[0].body.reasoning, true, 'the endpoint refuses this model with reasoning off');
  assert.equal(orders[0].body.temperature, undefined);
  assert.equal(orders[0].body.image_urls.length, 5, 'the real photo, then the four frames');
  assert.equal(orders[0].body.image_urls[0].sha256, image.sha256);
});

test('a misspelled word stops the run with its time and both spellings; report mode goes on', { skip }, async () => {
  const reply = JSON.stringify({ label_words: ['Acne-Prone Skin'], frames: [{ image: 3, product_seen: true, words_read: ['Acce-Prone Skin'], misspelled: [{ read: 'Acce-Prone', should_be: 'Acne-Prone' }] }] });
  const { mod, ctx, video } = await setup(reply);
  const image = await fileRef(await stillPng(ctx.workDir), 'image');
  const tl = timeline([{ id: 's1', start_s: 0, end_s: 6 }], { duration_s: 6 });
  const inputs = { video, timeline: tl, products: [{ id: 'p1', name: 'Acne Serum', images: [image] }] };
  await assert.rejects(mod.run(inputs, ctx), (e) => e.code === 'output_invalid' && /"Acce-Prone" for "Acne-Prone" at 4 s \(scene s1\)/.test(e.message));
  const out = await mod.run({ ...inputs, on_misspelled: 'report' }, ctx);
  assert.equal(out.verdict.pass, false);
  assert.equal(out.verdict.checks[0].status, 'fail');
  assert.deepEqual(out.verdict.reasons.map((r) => [r.check, r.expected]), [['flag:text_legible', 'Acne-Prone Skin']]);
  assert.equal(out.labels.misspelled, 1);
  assert.deepEqual(out.labels.frames[1].misspelled, [{ read: 'Acce-Prone', should_be: 'Acne-Prone' }]);
});

test('a mirrored label fails even when every letter is right (a selfie camera flip)', { skip }, async () => {
  const reply = JSON.stringify({ label_words: ['DAL CHAWAL'], frames: [{ image: 2, product_seen: true, mirrored: true, words_read: ['DAL CHAWAL'], misspelled: [] }, { image: 3, product_seen: false, mirrored: true, words_read: [], misspelled: [] }] });
  const { mod, ctx, video } = await setup(reply);
  const image = await fileRef(await stillPng(ctx.workDir), 'image');
  const inputs = { video, timeline: timeline([{ id: 's1', start_s: 0, end_s: 6 }], { duration_s: 6 }), products: [{ id: 'p1', images: [image] }] };
  await assert.rejects(mod.run(inputs, ctx), (e) => e.code === 'output_invalid' && /mirrored in 1 of 2 frames read, at 2 s \(scene s1\)/.test(e.message));
  const out = await mod.run({ ...inputs, on_misspelled: 'report' }, ctx);
  assert.equal(out.verdict.checks[0].status, 'fail');
  assert.equal(out.labels.mirrored, 1, 'a frame without the product is never counted as mirrored');
});

test('no product in any frame is not_applicable, not a pass', { skip }, async () => {
  const reply = JSON.stringify({ label_words: ['DAL CHAWAL'], frames: [{ image: 2, product_seen: false, words_read: [], misspelled: [] }] });
  const { mod, ctx, video } = await setup(reply);
  const image = await fileRef(await stillPng(ctx.workDir), 'image');
  const out = await mod.run({ video, timeline: timeline([{ id: 's1', start_s: 0, end_s: 6 }], { duration_s: 6 }), products: [{ id: 'p1', images: [image] }] }, ctx);
  assert.equal(out.verdict.checks[0].status, 'not_applicable');
  assert.equal(out.verdict.pass, true);
});

test('a reply that is not the JSON asked for is a provider failure; no product photo is refused', { skip }, async () => {
  const { mod, ctx, video } = await setup('Sorry, I cannot help with that.');
  const image = await fileRef(await stillPng(ctx.workDir), 'image');
  const tl = timeline([{ id: 's1', start_s: 0, end_s: 6 }], { duration_s: 6 });
  await assert.rejects(mod.run({ video, timeline: tl, products: [{ id: 'p1', images: [image] }] }, ctx), (e) => e.code === 'provider_failed');
  await assert.rejects(mod.run({ video, timeline: tl, products: [{ id: 'p1', images: [] }] }, ctx), (e) => e.code === 'bad_input');
});

async function stillPng(dir) {
  const { run } = await import('../../_tools/kit-harness.mjs');
  const path = join(dir, 'pack.png');
  await run('ffmpeg', ['-hide_banner', '-nostdin', '-loglevel', 'error', '-y', '-f', 'lavfi', '-i', 'testsrc2=size=360x640', '-frames:v', '1', path]);
  return path;
}

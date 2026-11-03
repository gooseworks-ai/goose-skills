// creator-h3 1.3.0+: the reviewed pipeline. The first take is ordered alone and returned for an actual
// audio-and-picture review; the remaining takes follow only after it passes; assembly uses only reviewed
// sources and their reviewed word timings.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { hasFfmpeg, loadNewest, makeCtx, probe } from '../../_tools/kit-harness.mjs';
import { acceptedSource, qualificationFor, reviewedInputs, sample } from './fixture.mjs';

const { dir, mod } = await loadNewest('creator-h3');
const skip = !(await hasFfmpeg()) && 'ffmpeg is not installed';

/** Runs the three stages against the fake line: [first, remaining, assembled] outputs and every order. */
async function stages(extra = {}, review = {}) {
  const one = makeCtx({ partDir: dir, line: sample.line });
  const base = await reviewedInputs(one.ctx.workDir, extra);
  const first = await mod.run(base, one.ctx);
  const t1 = await acceptedSource(first.review_request.sources[0], { ...review, probe });
  const qualification = qualificationFor(first);
  const two = makeCtx({ partDir: dir, line: sample.line });
  const remaining = await mod.run({ ...base, accepted_sources: [t1], qualification }, two.ctx);
  const rest = [];
  for (const source of remaining.review_request.sources) rest.push(await acceptedSource(source, { ...review, probe }));
  const three = makeCtx({ partDir: dir, line: sample.line });
  const assembled = await mod.run({ ...base, accepted_sources: [t1, ...rest], qualification }, three.ctx);
  return { base, first, remaining, assembled, orders: [one.orders, two.orders, three.orders] };
}

test('the first take is ordered alone and returned pending its review; later takes follow it, and assembly orders nothing', { skip }, async () => {
  const { base, first, remaining, assembled, orders } = await stages();
  assert.equal(orders[0].length, 1, 'first_take orders one take');
  assert.equal(first.content_review_status, 'pending');
  assert.equal(first.review_request.generation_stage, 'first_take');
  assert.equal(first.review_request.sources.length, 1);
  assert.ok(orders[1].length >= 1, 'remaining_takes orders the rest');
  assert.equal(remaining.review_request.generation_stage, 'remaining_takes');
  for (const o of orders[1]) assert.equal(o.body.reference_audio_urls[0].kind, 'file', 'later takes copy the reviewed first take\'s voice');
  assert.equal(orders[2].length, 0, 'assembly reuses reviewed sources and orders nothing');
  const info = await probe(assembled.video.path);
  assert.ok(info.has_audio);
  assert.ok(Math.abs(info.duration_s - assembled.seconds) < 0.1);
  assert.equal(assembled.assembly_timeline.format, 'gooseworks-assembly-timeline/1');
  const said = assembled.timeline.speech.map((s) => s.text);
  assert.deepEqual(said, base.scenes.map((s) => s.line), 'every approved line, once and in order');
});

test('a take is never planned over 15 s, and the plan never runs faster than 3.2 words a second', { skip }, async () => {
  const one = makeCtx({ partDir: dir, line: sample.line });
  const out = await mod.run(await reviewedInputs(one.ctx.workDir, { words_per_second: 4 }), one.ctx);
  for (const o of one.orders) assert.ok(o.body.duration <= 15, `take of ${o.body.duration}s`);
  const capped = makeCtx({ partDir: dir, line: sample.line });
  const at32 = await mod.run(await reviewedInputs(capped.ctx.workDir, { words_per_second: 3.2 }), capped.ctx);
  assert.equal(out.configuration_sha256, at32.configuration_sha256, 'a faster style is planned at 3.2 words a second');
});

test('remaining takes are refused until the first take has a passing review', { skip }, async () => {
  const one = makeCtx({ partDir: dir, line: sample.line });
  const base = await reviewedInputs(one.ctx.workDir);
  await assert.rejects(mod.run({ ...base, generation_stage: 'remaining_takes' }, one.ctx), (e) => e.code === 'bad_input' && /first take/.test(e.message));
  assert.equal(one.orders.length, 0);
});

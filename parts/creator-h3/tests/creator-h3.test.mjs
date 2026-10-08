import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { hasFfmpeg, loadPart, makeCtx, probe, PARTS_ROOT } from '../../_tools/kit-harness.mjs';
import { sample, still } from './fixture.mjs';

const { dir, mod } = await loadPart('creator-h3', '1.0.0');
const ffmpeg = await hasFfmpeg();
const skip = !ffmpeg && 'ffmpeg is not installed';

test('orders the first take alone, hands its voice to the rest, and joins them into one track', { skip }, async () => {
  const { ctx, orders } = makeCtx({ partDir: dir, line: sample.line });
  const out = await mod.run(await sample.inputs(ctx.workDir), ctx);
  assert.ok(orders.length >= 2, `${orders.length} takes`);
  for (const o of orders) {
    assert.equal(o.path, '/minimax/h3-max/reference-to-video');
    assert.equal(o.body.prompt_expansion_mode, 'disabled', 'dialogue stays verbatim');
    assert.equal(o.body.reference_image_urls[0].kind, 'file', 'the still goes to the core as a file');
    assert.ok(o.body.duration >= 5 && o.body.duration <= 15);
    assert.ok(Number.isInteger(o.body.seed));
  }
  assert.equal(orders[0].body.reference_audio_urls, undefined, 'the first take invents the voice');
  for (const o of orders.slice(1)) assert.equal(o.body.reference_audio_urls[0].kind, 'file', 'later takes copy the first take\'s voice');
  // Takes split between lines: every line is in exactly one take's dialogue, in order.
  const spoken = orders.flatMap((o) => /<inhale> ([\s\S]*)<\/d>/.exec(o.body.prompt)[1].split(' <pause> '));
  assert.deepEqual(spoken, (await sample.inputs(ctx.workDir)).scenes.map((s) => s.line));
  assert.ok(orders[0].body.prompt.includes('a woman in her early 30s'), 'the person is written into every take word for word');
  const info = await probe(out.video.path);
  assert.ok(info.has_audio);
  assert.ok(Math.abs(info.duration_s - out.seconds) < 0.1);
});

test('the prompt is the atom\'s template word for word', () => {
  const py = readFileSync(join(PARTS_ROOT, '..', 'skills/ads/capabilities/create-creator-takes-h3/scripts/plan_takes.py'), 'utf8');
  const template = py.slice(py.indexOf('TEMPLATE = """') + 14, py.indexOf('"""', py.indexOf('TEMPLATE = """') + 14));
  const src = readFileSync(join(dir, 'part.mjs'), 'utf8');
  assert.ok(src.includes(JSON.stringify(template)), 'the bundled template equals plan_takes.py TEMPLATE');
});

test('refuses a creator nobody was asked about, square brackets, and more takes than the price allows', async () => {
  const { ctx, orders } = makeCtx({ partDir: dir, line: sample.line });
  const base = await sample.inputs(ctx.workDir);
  await assert.rejects(mod.run({ ...base, character: { ...base.character, identity: 'a friendly creator' } }, ctx), (e) => e.code === 'bad_input' && /no age/.test(e.message));
  await assert.rejects(mod.run({ ...base, character: { ...base.character, identity: 'someone in their 30s' } }, ctx), (e) => e.code === 'bad_input' && /no gender/.test(e.message));
  await assert.rejects(mod.run({ ...base, scenes: [{ id: 'a', line: 'hello [laughs] there' }] }, ctx), (e) => e.code === 'bad_input' && /square brackets/.test(e.message));
  await assert.rejects(mod.run({ ...base, max_seconds: 10 }, ctx), (e) => e.code === 'bad_input' && /max_seconds/.test(e.message));
  assert.equal(orders.length, 0);
});

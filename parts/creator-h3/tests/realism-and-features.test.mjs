// creator-h3 1.4.0: phone capture and deep focus by default (studio and shallow focus only when chosen),
// and the shared required_features vocabulary with the 1.3.x names as aliases.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { hasFfmpeg, loadNewest, makeCtx, probe } from '../../_tools/kit-harness.mjs';
import { acceptedSource, qualificationFor, reviewedInputs, sample } from './fixture.mjs';

const { dir, mod, manifest } = await loadNewest('creator-h3');
const skip = !(await hasFfmpeg()) && 'ffmpeg is not installed';

async function firstTake(extra = {}, drop = []) {
  const { ctx, orders } = makeCtx({ partDir: dir, line: sample.line });
  const inputs = await reviewedInputs(ctx.workDir, extra);
  for (const key of drop) delete inputs[key];
  const out = await mod.run(inputs, ctx);
  return { out, prompt: orders[0].body.prompt, inputs };
}

test('with no capture or focus given, a take is a phone recording in a lived-in room, deep focus, no bokeh, no retouching', { skip }, async () => {
  const { prompt } = await firstTake({}, ['capture']);
  assert.match(prompt, /An ordinary phone recording from a phone supported outside the frame/);
  assert.match(prompt, /real, lived-in room from <Picture 1>, never a plain backdrop or a white void/);
  assert.match(prompt, /Everything sharp, deep focus, as a phone records/);
  assert.match(prompt, /No bokeh, no portrait-mode blur, no shallow depth of field/);
  assert.match(prompt, /no retouching, no skin smoothing, no beauty filter, no cinematic grade/);
  assert.doesNotMatch(prompt, /demand universal deep focus|Background focus follows the approved reference/);
});

test('studio capture and shallow focus only when explicitly chosen', { skip }, async () => {
  const chosen = await firstTake({ capture: 'studio', focus: 'shallow' });
  assert.match(chosen.prompt, /An approved studio recording/);
  assert.match(chosen.prompt, /Shallow focus, chosen because the approved reference is shot that way/);
  const fromCharacter = await firstTake({}, ['capture']);
  const { ctx, orders } = makeCtx({ partDir: dir, line: sample.line });
  const inputs = await reviewedInputs(ctx.workDir);
  delete inputs.capture;
  await mod.run({ ...inputs, character: { ...inputs.character, recording: 'selfie' } }, ctx);
  assert.match(orders[0].body.prompt, /An ordinary handheld phone selfie/);
  assert.notEqual(fromCharacter.out.configuration_sha256, chosen.out.configuration_sha256, 'capture and focus are part of the configuration');
});

test('required_features takes the shared vocabulary; old names are aliases', { skip }, async () => {
  const shared = await firstTake({ required_features: ['physical_demo', 'product'] });
  const alias = await firstTake({ required_features: ['product_action', 'product'] });
  assert.equal(shared.out.configuration_sha256, alias.out.configuration_sha256, 'product_action is read as physical_demo');
  for (const feature of ['application', 'dispensing', 'pour', 'physical_demo', 'hands', 'stateful_demo', 'precise_product_action']) {
    const { out } = await firstTake({ required_features: [feature] });
    assert.equal(out.review_request.product_action_required, true, `${feature} is a product action`);
  }
  for (const feature of ['speaking_face', 'product', 'scale', 'readable_text']) {
    const { out } = await firstTake({ required_features: [feature] });
    assert.equal(out.review_request.product_action_required, false, `${feature} is not a product action`);
  }
  const { ctx, orders } = makeCtx({ partDir: dir, line: sample.line });
  await assert.rejects(mod.run(await reviewedInputs(ctx.workDir, { required_features: ['juggling'] }), ctx), (e) => e.code === 'bad_input');
  assert.equal(orders.length, 0);
  assert.equal(manifest.inputs.properties.required_features.maxItems, 12);
});

test('a pour feature needs a passing product_action review: not_applicable is refused', { skip }, async () => {
  const one = makeCtx({ partDir: dir, line: sample.line });
  const base = await reviewedInputs(one.ctx.workDir, { required_features: ['pour'] });
  const first = await mod.run(base, one.ctx);
  const notApplicable = await acceptedSource(first.review_request.sources[0], { probe });
  const two = makeCtx({ partDir: dir, line: sample.line });
  await assert.rejects(mod.run({ ...base, accepted_sources: [notApplicable], qualification: qualificationFor(first) }, two.ctx), (e) => e.code === 'bad_input' && /product action/.test(e.message));
  assert.equal(two.orders.length, 0);
  const passed = await acceptedSource(first.review_request.sources[0], { probe, product_action: 'pass' });
  const three = makeCtx({ partDir: dir, line: sample.line });
  const remaining = await mod.run({ ...base, accepted_sources: [passed], qualification: qualificationFor(first) }, three.ctx);
  assert.equal(remaining.review_request.generation_stage, 'remaining_takes');
});

test('the manifest states the H3 limits: 15 s takes, at most 3.2 words a second', () => {
  assert.match(manifest.summary, /15 s/);
  assert.match(manifest.summary, /3\.2 words a second/);
});

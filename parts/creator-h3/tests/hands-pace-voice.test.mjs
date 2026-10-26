// creator-h3 1.5.0: a both-hands action refuses phone_selfie (a selfie grew a third hand holding the
// phone), takes sized from the reference's rate capped at 3.2 words a second, and voice_pair passed through.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { hasFfmpeg, loadNewest, loadPart, makeCtx } from '../../_tools/kit-harness.mjs';
import { reviewedInputs, sample, words } from './fixture.mjs';

const { dir, mod } = await loadNewest('creator-h3');
const v140 = await loadPart('creator-h3', '1.4.0');
const skip = !(await hasFfmpeg()) && 'ffmpeg is not installed';

async function firstTake(extra = {}, edit = (inputs) => inputs) {
  const { ctx, orders } = makeCtx({ partDir: dir, line: sample.line });
  const inputs = edit(await reviewedInputs(ctx.workDir, extra));
  const out = await mod.run(inputs, ctx);
  return { out, orders, prompt: orders[0].body.prompt, inputs };
}

test('the both-hands words match plan_takes.py BOTH_HANDS exactly', () => {
  const py = readFileSync(join(dir, '..', '..', '..', 'skills/video/create-creator-takes-h3/scripts/plan_takes.py'), 'utf8');
  const m = /^BOTH_HANDS = (".*")$/m.exec(py);
  assert.ok(m, 'plan_takes.py defines BOTH_HANDS on one line');
  assert.equal(mod.H3_BOTH_HANDS, JSON.parse(m[1]));
  for (const text of ['she applies the serum', 'smooths it flat', 'presses the strip on', 'peels it off', 'squeezes her nose', 'holds the box with both hands']) {
    assert.ok(mod.h3BothHands([text], []), text);
  }
  assert.ok(mod.h3BothHands([], ['application']));
  assert.ok(mod.h3BothHands([], ['precise_product_action']), 'the old name is an alias of application');
  assert.equal(mod.h3BothHands(['she talks to camera'], ['speaking_face']), null);
});

test('a both-hands scene action refuses phone_selfie, uses phone_counter and says so', { skip }, async () => {
  const both = (inputs) => ({ ...inputs, scenes: inputs.scenes.map((s, i) => (i === 1 ? { ...s, picture: 'She presses the strip onto her nose with both hands' } : s)) });
  const { out, prompt } = await firstTake({ capture: 'phone_selfie' }, both);
  assert.deepEqual([out.capture_decision.requested, out.capture_decision.used], ['phone_selfie', 'phone_counter']);
  assert.match(out.capture_decision.reason, /both hands are busy/);
  assert.match(prompt, /propped up outside the frame at eye level\. Nobody holds the phone/);
  assert.doesNotMatch(prompt, /handheld phone selfie/);
  // From character.recording selfie, and from extra.action and required_features application, too.
  const fromCharacter = await firstTake({}, (inputs) => { const x = both(inputs); delete x.capture; return { ...x, character: { ...x.character, recording: 'selfie' } }; });
  assert.equal(fromCharacter.out.capture_decision.used, 'phone_counter');
  const fromExtra = await firstTake({ capture: 'phone_selfie' }, (inputs) => ({ ...inputs, scenes: inputs.scenes.map((s, i) => (i === 0 ? { ...s, extra: { action: 'peels the strip off' } } : s)) }));
  assert.equal(fromExtra.out.capture_decision.used, 'phone_counter');
  const fromFeature = await firstTake({ capture: 'phone_selfie', required_features: ['application'] });
  assert.equal(fromFeature.out.capture_decision.used, 'phone_counter');
  // A talking selfie with no both-hands action is left alone.
  const talk = await firstTake({ capture: 'phone_selfie' });
  assert.deepEqual(talk.out.capture_decision, { requested: 'phone_selfie', used: 'phone_selfie', reason: null });
  assert.match(talk.prompt, /handheld phone selfie/);
});

test('reference_words_per_second sizes the takes, capped at 3.2 words a second', { skip }, async () => {
  // Two 20-word lines: 40 words is 15.4 s at 2.6 (two takes) but 12.8 s at 3.2 (one take).
  const scenes = (inputs) => ({ ...inputs, scenes: [{ id: 'a', line: words(20) }, { id: 'b', line: words(20, 'and') }] });
  const plain = await firstTake({}, scenes);
  assert.equal(plain.out.pace.sized_from, 'default');
  assert.equal(plain.out.pace.planned_wps, 2.6);
  const ref = await firstTake({ reference_words_per_second: 4.09 }, scenes);
  assert.deepEqual(ref.out.pace, { reference_wps: 4.09, planned_wps: 3.2, capped: true, sized_from: 'reference_wps' });
  assert.equal(ref.out.review_request.sources[0].expected_lines.length, 2, 'one take holds both lines at 3.2');
  assert.equal(plain.out.review_request.sources[0].expected_lines.length, 1, 'at 2.6 the first take holds one line');
  // words_per_second still wins when given.
  const explicit = await firstTake({ reference_words_per_second: 4.09, words_per_second: 2.4 }, scenes);
  assert.equal(explicit.out.pace.sized_from, 'words_per_second');
  assert.equal(explicit.out.pace.planned_wps, 2.4);
});

test("character.json from make_character.py is accepted and its voice_pair passes through", { skip }, async () => {
  const voice_pair = { source: 'library', voice_id: 'abc123', name: 'Test', wanted: { gender: 'female', age: 'young' } };
  const { out } = await firstTake({}, (inputs) => ({ ...inputs, character: { ...inputs.character, actions: ['she talks to camera'], capture_decision: { requested: 'counter', used: 'counter', reason: null }, voice_pair } }));
  assert.deepEqual(out.voice_pair, voice_pair);
});

test('1.4.0 is unchanged: its counter prompt still says supported, and it has no capture_decision', { skip }, async () => {
  const { ctx, orders } = makeCtx({ partDir: v140.dir, line: sample.line });
  const out = await v140.mod.run(await reviewedInputs(ctx.workDir), ctx);
  assert.match(orders[0].body.prompt, /a phone supported outside the frame/);
  assert.equal(out.capture_decision, undefined);
});

test('a lone dash is not a word when takes are sized (reference_rate.py counting)', { skip }, async () => {
  const plain = await firstTake({}, (inputs) => ({ ...inputs, scenes: [{ id: 'a', line: words(30) }] }));
  const dashed = await firstTake({}, (inputs) => ({ ...inputs, scenes: [{ id: 'a', line: `${words(30)} — — — — — — — — — —` }] }));
  assert.equal(dashed.orders[0].body.duration, plain.orders[0].body.duration);
});

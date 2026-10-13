// check-layer 1.4.3: the speech check line by line. A line that lost two words in a row (or its last two)
// fails and names its scene; a script that lost three words in a row fails whatever its similarity.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { hasFfmpeg, layerInputsFor, loadNewest, makeCtx } from '../../_tools/kit-harness.mjs';
import { speechReview } from '../../_lib/speech.mjs';
import { chkLineLoss, chkScriptLoss } from '../src/lines.mjs';
import { levelledCut } from './fixture.mjs';

const { dir, mod } = await loadNewest('check-layer');
const ffmpeg = await hasFfmpeg();
const skip = !ffmpeg && 'ffmpeg is not installed';
const check = (out, code) => out.verdict.checks.find((c) => c.code === code);

const SCRIPT = [
  'Okay so this is the snack everybody keeps asking me about.',
  'Listen up, it has twelve grams of protein and almost no sugar.',
  'I keep a box in my bag and one at my desk for the afternoon slump.',
  'Grab yours today and tell me which flavour you pick first.',
];
const line = (n, spoken) => ({ scene_id: `s${n + 1}`, text: SCRIPT[n], spoken: spoken ?? SCRIPT[n], start_s: n, end_s: n + 0.9 });

test('a line that lost two words in a row names its scene', () => {
  const speech = [line(0), line(1, 'it has twelve grams of protein and almost no sugar.'), line(2), line(3)];
  assert.deepEqual(chkLineLoss(speech, []), { index: 1, scene_id: 's2', text: 'Listen up' });
});

test('a line that lost its last two words fails, one lost word does not', () => {
  const tail = [line(0), line(1), line(2), line(3, 'Grab yours today and tell me which flavour you')];
  assert.equal(chkLineLoss(tail, []).scene_id, 's4');
  const one = [line(0), line(1), line(2), line(3, 'Grab yours today and tell me which flavour you pick')];
  assert.equal(chkLineLoss(one, []), null);
  const swapped = [line(0), line(1), line(2), line(3, 'Grab yours today and tell me which flavour um')];
  assert.equal(chkLineLoss(swapped, []).scene_id, 's4', 'the last three words said as one other word lose two');
});

test('words placed with the next or previous line are not lost', () => {
  const late = [line(0), line(1, 'Listen up, it has twelve grams of protein and almost'), line(2, 'no sugar. I keep a box in my bag and one at my desk for the afternoon slump.'), line(3)];
  assert.equal(chkLineLoss(late, []), null);
  const early = [line(0, 'Okay so this is the snack everybody keeps asking me about. Listen up,'), line(1, 'it has twelve grams of protein and almost no sugar.'), line(2), line(3)];
  assert.equal(chkLineLoss(early, []), null);
});

test('lines with no scene or no heard words are not compared one by one', () => {
  assert.equal(chkLineLoss([{ text: SCRIPT[1], spoken: 'twelve grams', start_s: 0, end_s: 1 }], []), null);
  assert.equal(chkLineLoss([{ scene_id: 's1', text: SCRIPT[1], start_s: 0, end_s: 1 }], []), null);
});

test('a phrase of three words lost from the whole script fails even when the similarity clears 0.90', () => {
  const heard = SCRIPT.join(' ').replace('keep a box in', 'keep in');
  const v = speechReview(SCRIPT.join(' '), heard);
  assert.equal(v.passed, true, 'the whole-script verdict alone passes');
  assert.equal(chkScriptLoss(v), null, 'two words lost from the whole script are left to the line check');
  const lost = SCRIPT.join(' ').replace('for the afternoon slump', 'for');
  const w = speechReview(SCRIPT.join(' '), lost);
  assert.equal(w.passed, true, 'about one word in ten lost still clears the bar');
  assert.deepEqual(chkScriptLoss(w), { text: 'the afternoon slump' });
});

test('the layer fails the speech check on a line that lost a phrase, naming the scene', { skip }, async () => {
  const { ctx } = makeCtx({ partDir: dir });
  const video = await levelledCut(ctx.workDir, 'lines', 5);
  const scenes = SCRIPT.map((_, n) => ({ id: `s${n + 1}`, start_s: n * 1.2, end_s: (n + 1) * 1.2 }));
  const expect = { speech: 'on_camera', script: SCRIPT, duration_s: { min: 2, max: 10 } };
  const lost = [line(0), line(1, 'it has twelve grams of protein and almost no sugar.'), line(2), line(3)];
  const out = await mod.run(await layerInputsFor(video, { expect, timeline: { scenes, speech: lost } }), ctx);
  const c = check(out, 'speech_matches_script');
  assert.equal(c.status, 'fail');
  assert.equal(c.message, 'Scene 2 is missing the words "Listen up": they were cut where two recordings join, or never said.');
  assert.ok(c.found >= 0.9, 'the whole script alone would have passed');
  const whole = await mod.run(await layerInputsFor(video, { expect, timeline: { scenes, speech: SCRIPT.map((_, n) => line(n)) } }), ctx);
  assert.equal(check(whole, 'speech_matches_script').status, 'pass');
});

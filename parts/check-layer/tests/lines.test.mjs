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
  assert.deepEqual(chkLineLoss(speech, []), { index: 1, scene_id: 's2', line: SCRIPT[1], text: 'Listen up' });
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

test('words lost from the middle of a line count even when the next line opens with them', () => {
  // "a box" lost mid-line; the next line happens to open with the same two words.
  const mid = [
    { scene_id: 's1', text: 'I keep a box in my bag every day.', spoken: 'I keep in my bag every day.' },
    { scene_id: 's2', text: 'A box of twelve bars for the week.', spoken: 'A box of twelve bars for the week.' },
  ];
  assert.equal(chkLineLoss(mid, []).text, 'a box');
});

test('the neighbour match is whole words in order, not letters across words', () => {
  // "is it" lost from the line's end; the next line opens with "this item", which holds "isit" across words.
  const across = [
    { scene_id: 's1', text: 'Tell me what you think, is it', spoken: 'Tell me what you think,' },
    { scene_id: 's2', text: 'this item changed my mornings.', spoken: 'this item changed my mornings.' },
  ];
  assert.equal(chkLineLoss(across, []).scene_id, 's1');
});

test('a line the transcriber could not place is left to the whole script; its words in a later line are not lost', () => {
  // Line 2's numbers were heard in another form, so neither it nor line 3 was placed: line 4 holds them all.
  const lines = [
    'Okay so this is the snack everybody keeps asking me about lately.',
    'Twenty nine ninety nine for two, 3 for 45.',
    'I keep a bottle in my bag and one at my desk for the afternoon.',
    'Grab yours today and tell me which scent you pick first.',
  ];
  const speech = [
    { scene_id: 's1', text: lines[0], spoken: lines[0] },
    { scene_id: 's2', text: lines[1], spoken: '' },
    { scene_id: 's3', text: lines[2], spoken: '' },
    { scene_id: 's4', text: lines[3], spoken: `29.99 for 2, three for forty-five. ${lines[2]} ${lines[3]}` },
  ];
  assert.equal(chkLineLoss(speech, []), null);
  // The nearest heard line past an unplaced one still counts as the neighbour.
  const late = [
    { scene_id: 's1', text: lines[0], spoken: 'Okay so this is the snack everybody keeps asking me' },
    { scene_id: 's2', text: lines[1], spoken: '' },
    { scene_id: 's3', text: lines[2], spoken: `about lately. 29.99 for 2, three for forty-five. ${lines[2]}` },
  ];
  assert.equal(chkLineLoss(late, []), null);
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
  assert.equal(c.message, 'Line 2 of the script is missing the words "Listen up": they were cut where two recordings join, or never said.');
  assert.ok(c.found >= 0.9, 'the whole script alone would have passed');
  const whole = await mod.run(await layerInputsFor(video, { expect, timeline: { scenes, speech: SCRIPT.map((_, n) => line(n)) } }), ctx);
  assert.equal(check(whole, 'speech_matches_script').status, 'pass');
});

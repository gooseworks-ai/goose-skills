// transcribe-whisper 1.1.2: lines placed by one alignment that may skip heard words between lines
// (src/place.mjs), and heard words in no line returned as their own speech entries.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { hasFfmpeg, loadPart, makeCtx } from '../../_tools/kit-harness.mjs';
import { kitHeardWords } from '../../_lib/heard.mjs';
import { placeLines } from '../src/place.mjs';
import { repeatedQuestion, whisperChunk as chunk } from './fixture.mjs';

const ffmpeg = await hasFfmpeg();
const skip = !ffmpeg && 'ffmpeg is not installed';


const lines = (scenes) => scenes.filter((s) => s.line).map((s) => ({ scene_id: s.id, text: s.line }));
const heardOf = (chunks) => kitHeardWords({ chunks });
const owned = (heard, own) => (own ? heard.slice(own[0], own[1] + 1).map((w) => w.text).join(' ') : '');

test('a repeated line between two lines is skipped, not given to the last line', () => {
  const heard = heardOf(repeatedQuestion.chunks);
  const placed = placeLines(lines(repeatedQuestion.scenes), heard);
  assert.deepEqual(placed.lines.map((l) => owned(heard, l.own)), ['Who made all these ads?', 'A big agency, for sure.', 'A whole design team?', 'No way. One AI coworker made these.']);
  assert.ok(placed.lines.every((l) => l.placed));
  assert.deepEqual(placed.extras, [[5, 9]], 'the second "Who made all these ads?" is in no line');
});

test('a filler before, between and after the lines is in no line; a word heard as two stays with its line', () => {
  const heard = heardOf([
    chunk('Um', 0, 0.2), chunk('Goose', 0.4, 0.6), chunk('works', 0.6, 0.8), chunk('makes', 0.8, 1.0), chunk('ads.', 1.0, 1.3),
    chunk('like', 1.6, 1.8), chunk('you', 1.8, 1.9), chunk('know', 1.9, 2.0), chunk('Try', 2.4, 2.6), chunk('it.', 2.6, 2.8), chunk('Okay', 3.2, 3.5),
  ]);
  const placed = placeLines([{ scene_id: 'a', text: 'GooseWorks makes ads.' }, { scene_id: 'b', text: 'Try it.' }], heard);
  assert.deepEqual(placed.lines.map((l) => owned(heard, l.own)), ['Goose works makes ads.', 'Try it.']);
  assert.deepEqual(placed.extras.map(([f, t]) => owned(heard, [f, t])), ['Um', 'like you know', 'Okay']);
});

test('a line keeps its words together instead of borrowing a common word from far ahead', () => {
  const heard = heardOf([chunk('So', 0, 0.2), chunk('the', 0.2, 0.3), chunk('thing', 0.3, 0.5), chunk('is', 0.5, 0.6), chunk('done.', 0.6, 0.9), chunk('The', 1.5, 1.6), chunk('jacket', 1.6, 2.0), chunk('packs', 2.0, 2.3), chunk('small.', 2.3, 2.7)]);
  const placed = placeLines([{ scene_id: 'a', text: 'The jacket packs small.' }], heard);
  assert.deepEqual(placed.lines.map((l) => owned(heard, l.own)), ['The jacket packs small.']);
  assert.deepEqual(placed.extras.map(([f, t]) => owned(heard, [f, t])), ['So the thing is done.']);
});

test('a line not heard at all owns nothing when its neighbours own everything', () => {
  const heard = heardOf([chunk('Hello', 0, 0.3), chunk('there.', 0.3, 0.6), chunk('Bye', 1.0, 1.2), chunk('now.', 1.2, 1.4)]);
  const placed = placeLines([{ scene_id: 'a', text: 'Hello there.' }, { scene_id: 'b', text: 'Never said.' }, { scene_id: 'c', text: 'Bye now.' }], heard);
  assert.deepEqual(placed.lines.map((l) => owned(heard, l.own)), ['Hello there.', '', 'Bye now.']);
  assert.deepEqual(placed.extras, []);
});

test('the staging take: every line placed on its own words, the repeat returned as speech in no line', { skip }, async () => {
  const { dir, mod } = await loadPart('transcribe-whisper', '1.1.2');
  const { ctx } = makeCtx({ partDir: dir, line: repeatedQuestion.line });
  const out = await mod.run(await repeatedQuestion.inputs(ctx.workDir), ctx);
  assert.deepEqual(
    out.timeline.speech.map((s) => [s.scene_id ?? null, s.text, s.spoken, s.start_s, s.end_s]),
    [
      ['s1', 'Who made all these ads?', 'Who made all these ads?', 0.03, 1.19],
      [null, '', 'Who made all these ads?', 2.35, 3.47],
      ['s2', 'A big agency, for sure.', 'A big agency, for sure.', 3.85, 5.65],
      ['s4', 'A whole design team?', 'A whole design team?', 6.69, 8.97],
      ['s5', 'No way. One AI coworker made these.', 'No way. One AI coworker made these.', 9.59, 12.05],
    ],
  );
  assert.ok(!('scene_id' in out.timeline.speech[1]), 'speech in no line has no scene_id');
  assert.deepEqual(out.timeline.speech[1].words.map((w) => w.text), ['Who', 'made', 'all', 'these', 'ads?']);
});

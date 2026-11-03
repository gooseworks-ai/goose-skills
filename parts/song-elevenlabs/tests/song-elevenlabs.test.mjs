// song-elevenlabs: the paid piece through the line, the reply's words, the hook gate and the finished track.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { hasFfmpeg, loadNewest, makeCtx, probe } from '../../_tools/kit-harness.mjs';
import { musicDetailedAnswer, musicDetailedRequest } from './music-detailed-reply.mjs';
import { planSeconds, recordedInputs, sample, songLine } from './fixture.mjs';
import { storybookInputs } from './storybook.mjs';

const { dir, mod } = await loadNewest('song-elevenlabs');
const ffmpeg = await hasFfmpeg();
const skip = !ffmpeg && 'ffmpeg is not installed';
const recorded = () => structuredClone(musicDetailedAnswer.json);

/** Words for a composition plan: each section's lyric words spread evenly, the first `lead_ms` after its start. */
function wordsFor(order, { leadMs = 100, chorusLeadMs } = {}) {
  const words = [];
  let at = 0;
  for (const s of order.body.composition_plan.sections) {
    const ws = s.lines.join(' ').split(/\s+/u).filter(Boolean);
    const lead = s.section_name === 'Chorus' && chorusLeadMs != null ? chorusLeadMs : leadMs;
    const step = ws.length ? Math.floor((s.duration_ms - lead - 400) / ws.length) : 0;
    ws.forEach((w, i) => words.push({ word: w, start_ms: at + lead + i * step, end_ms: at + lead + (i + 1) * step - 30 }));
    at += s.duration_ms;
  }
  return words;
}
const replyFor = (order, options) => ({ composition_plan: order.body.composition_plan, song_metadata: { title: 'Test' }, words_timestamps: wordsFor(order, options) });

test('the recorded W0-62 reply: one song piece with the recorded request, words read from json.words_timestamps', { skip }, async () => {
  const { ctx, orders, logs } = makeCtx({ partDir: dir, line: sample.line });
  const out = await mod.run(sample.inputs(), ctx);
  assert.equal(orders.length, 1);
  assert.equal(orders[0].piece, 'song');
  assert.equal(orders[0].provider, 'elevenlabs');
  assert.equal(orders[0].path, '/v1/music/detailed', 'no query: the line refuses one');
  // The recorded request, field for field: no seed, no prompt-only fields. The one difference is the verse's
  // lines: the planner splits lines only after a sentence ends, and "Pack it small" has no full stop.
  const want = structuredClone(musicDetailedRequest);
  want.composition_plan.sections[0].lines = ['Pack it small take it all'];
  assert.deepEqual(orders[0].body, want);
  assert.deepEqual(Object.keys(orders[0].body), Object.keys(musicDetailedRequest));
  assert.deepEqual(orders[0].results, [{ pointer: '/file_url', name: 'song.mp3', media: 'audio' }]);
  // The test tone is an mp3, which the encoder pads by a few ms; the last scene runs to the track's end.
  assert.ok(Math.abs(out.seconds - 16) < 0.08, String(out.seconds));
  assert.deepEqual(out.scenes, [{ id: 's1', start_s: 0, end_s: 2.1 }, { id: 's2', start_s: 2.1, end_s: 8.2 }, { id: 's3', start_s: 8.2, end_s: out.seconds }]);
  assert.equal(out.ending_seconds, 0);
  assert.equal(out.hook_s, 8.2, 'the hook "One" lands 0.2 s after the chorus starts: inside the gate, no re-roll');
  assert.equal(out.words.length, 10);
  assert.deepEqual(out.words[7], { text: 'jacket,', start_s: 8.5, end_s: 9.1 });
  assert.deepEqual(out.speech.map((s) => [s.scene_id, s.text, s.start_s, s.end_s]), [
    ['s1', 'Pack it small', 0.42, 1.62],
    ['s2', 'take it all', 2.1, 3.3],
    ['s3', 'One jacket, every trip', 8.2, 10.6],
  ]);
  const info = await probe(out.audio.path);
  assert.ok(Math.abs(info.duration_s - out.seconds) < 0.05, `the track is ${info.duration_s} s, the spans ${out.seconds} s`);
  assert.equal(info.audio_codec, 'aac');
  assert.deepEqual(logs.filter((l) => l[0] === 'warn'), []);
});

test('refuses a plan it will not sing before ordering anything', async () => {
  const cases = [
    [(i) => { i.sections[0].scenes = [2, 2]; }, /scene 1 has a line to sing but no section/],
    [(i) => { i.form = { groups: 1 }; }, /either sections or form/],
    [(i) => { i.scenes = i.scenes.map((s) => ({ ...s, line: null })); }, /no scene has a line/],
    [(i) => { i.hook = 'Every'; }, /must start with the hook "Every"/],
    [(i) => { delete i.mood; delete i.singer; delete i.brief; }, /needs a mood, a singer or a brief/],
    [(i) => { i.max_seconds = 10; }, /longer than max_seconds 10/],
  ];
  for (const [change, pattern] of cases) {
    const inputs = recordedInputs();
    change(inputs);
    const { ctx, orders } = makeCtx({ partDir: dir, line: () => assert.fail('nothing may be ordered for a refused plan') });
    await assert.rejects(mod.run(inputs, ctx), (e) => e.code === 'bad_input' && pattern.test(e.message), String(pattern));
    assert.equal(orders.length, 0);
  }
  // Outside the input schema: a section shorter than ElevenLabs takes.
  const inputs = recordedInputs();
  inputs.sections[0].seconds = 2;
  const { ctx, orders } = makeCtx({ partDir: dir, line: () => assert.fail('nothing may be ordered') });
  await assert.rejects(mod.run(inputs, ctx), (e) => e.code === 'bad_input');
  assert.equal(orders.length, 0);
});

test('fails the piece when the song comes back with no word timings', { skip }, async () => {
  for (const json of [{ ...recorded(), words_timestamps: null }, { ...recorded(), words_timestamps: [] }, null]) {
    const { ctx, orders } = makeCtx({ partDir: dir, line: songLine(() => json) });
    await assert.rejects(mod.run(recordedInputs(), ctx), (e) => e.code === 'provider_failed' && e.retryable && /no word timings/.test(e.message));
    assert.equal(orders.length, 1);
  }
});

test('fails the piece when the sung word count differs from the lyric', { skip }, async () => {
  const json = recorded();
  json.words_timestamps.splice(4, 1);
  const { ctx, orders } = makeCtx({ partDir: dir, line: songLine(() => json) });
  await assert.rejects(mod.run(recordedInputs(), ctx), (e) => e.code === 'provider_failed' && /9 sung words and the lyric has 10/.test(e.message));
  assert.equal(orders.length, 1);
});

test('fails the piece when the reply times a word after the track ends, or a time is null', { skip }, async () => {
  const late = recorded();
  late.words_timestamps[9] = { ...late.words_timestamps[9], start_ms: 17000, end_ms: 17400 };
  const missing = recorded();
  missing.words_timestamps[0].start_ms = null;
  for (const [json, pattern] of [[late, /starts at 17 s, but the track ends at/], [missing, /sung word 1 has no start or end time/]]) {
    const { ctx, orders } = makeCtx({ partDir: dir, line: songLine(() => json) });
    await assert.rejects(mod.run(recordedInputs(), ctx), (e) => e.code === 'provider_failed' && pattern.test(e.message), String(pattern));
    assert.equal(orders.length, 1);
  }
});

test('a word sung differently is logged, not failed', { skip }, async () => {
  const json = recorded();
  json.words_timestamps[2].word = 'smile';
  const { ctx, logs } = makeCtx({ partDir: dir, line: songLine(() => json) });
  await mod.run(recordedInputs(), ctx);
  assert.ok(logs.some((l) => l[0] === 'warn' && /sung word 3 reads "smile", the lyric says "small"/.test(l[1])), JSON.stringify(logs));
});

test('hook gate: a hook sung 0.5 s off the drop orders one more song with a new seed, and keeps that one', { skip }, async () => {
  const line = songLine((order) => replyFor(order, order.piece === 'song' ? { chorusLeadMs: 500 } : {}));
  const { ctx, orders, logs } = makeCtx({ partDir: dir, line, seed: 7 });
  const inputs = storybookInputs();
  const out = await mod.run(inputs, ctx);
  assert.deepEqual(orders.map((o) => o.piece), ['song', 'song-reroll']);
  assert.equal(orders[0].body.seed, undefined, 'the first song leaves the seed to the provider');
  assert.ok(Number.isInteger(orders[1].body.seed) && orders[1].body.seed >= 0 && orders[1].body.seed < 2147483647, String(orders[1].body.seed));
  assert.deepEqual(orders[1].body.composition_plan, orders[0].body.composition_plan, 'the same song, asked again');
  assert.equal(out.hook_s, 15.1, 'from the re-roll: 0.1 s after the chorus starts');
  assert.ok(logs.some((l) => l[0] === 'warn' && /0.5 s off its section's start/.test(l[1])));
  assert.equal(out.scenes.length, 14);
  assert.equal(out.scenes[7].start_s, 15.1, 'the hook scene starts on the hook word');
  assert.deepEqual(out.speech.map((s) => s.scene_id), ['s2', 's3', 's4', 's5', 's6', 's7', 's8', 's9', 's10', 's11', 's12', 's13'], 'the ending scene is sung, not captioned');
  const lunah = out.speech.find((s) => s.scene_id === 's11');
  assert.equal(lunah.spoken, 'Loo nah takes me there.');
  assert.equal(lunah.words[0].text, 'Lunah');
  assert.equal(out.scenes[13].end_s, out.seconds);
  assert.ok(out.ending_seconds > 0 && Math.abs(out.ending_seconds - (out.seconds - out.scenes[13].start_s)) < 1e-6, String(out.ending_seconds));
});

test('hook gate: the style seed is sent, and the re-roll uses the next one', { skip }, async () => {
  const line = songLine((order) => replyFor(order, order.piece === 'song' ? { chorusLeadMs: 600 } : {}));
  const { ctx, orders } = makeCtx({ partDir: dir, line });
  await mod.run({ ...storybookInputs(), seed: 41 }, ctx);
  assert.deepEqual(orders.map((o) => o.body.seed), [41, 42]);
});

test('hook gate: a second miss fails the step after exactly two songs', { skip }, async () => {
  const line = songLine((order) => replyFor(order, { chorusLeadMs: 520 }));
  const { ctx, orders } = makeCtx({ partDir: dir, line });
  await assert.rejects(mod.run(storybookInputs(), ctx), (e) => e.code === 'output_invalid' && !e.retryable && /twice/.test(e.message));
  assert.equal(orders.length, 2);
});

test('null-line scenes: silent pictures share the time, no words, no captions; a form song is trimmed so singing starts on time', { skip }, async () => {
  const scenes = [
    { id: 'a0', line: null, extra: { group: 'counter' } },
    { id: 'a1', extra: { group: 'counter' } },
    { id: 'a2', line: 'I set the pot down on Sunday.', extra: { group: 'counter' } },
    { id: 'a3', line: '   ', extra: { group: 'counter' } },
    { id: 'a4', line: 'Onions go in first.', extra: { group: 'counter' } },
    { id: 'b0', line: null, picture: null, on_screen: null, extra: { group: 'hob' } },
    { id: 'b1', line: 'Then a splash of wine.', extra: { group: 'hob' } },
  ];
  const windows = { first_word_s: [0.7, 1.4], shot_lead_s: 0.45, snap_s: 0.3, min_hold_s: 0.3, card_after_s: 0.7 };
  // Words from 3.2 s (after the 3 s intro), 330 ms apart.
  const line = songLine((order) => {
    const ws = order.body.composition_plan.sections.flatMap((s) => s.lines).join(' ').split(' ');
    return { words_timestamps: ws.map((w, i) => ({ word: w, start_ms: 3200 + i * 330, end_ms: 3200 + i * 330 + 300 })) };
  });
  const { ctx, orders } = makeCtx({ partDir: dir, line });
  const out = await mod.run({ scenes, mood: 'warm acoustic folk', form: { intro_s: 3, outro_s: 3, groups: 2, ms_per_word: 330 }, windows }, ctx);
  assert.equal(orders.length, 1);
  assert.deepEqual(orders[0].body.composition_plan.sections.map((s) => s.section_name), ['Intro', 'Verse 1', 'Close', 'Outro']);
  const total = planSeconds(orders[0]);
  // A silent picture comes first, so the first word lands at 1.4 s: 1.8 s of the intro is trimmed.
  assert.ok(Math.abs(out.seconds - (total - 1.8)) < 0.08, `${out.seconds} s`);
  assert.equal(out.scenes.length, 7);
  assert.equal(out.scenes[2].start_s, 1.4);
  assert.equal(out.words[0].start_s, 1.4);
  assert.deepEqual(out.speech.map((s) => s.scene_id), ['a2', 'a4', 'b1']);
  for (let i = 1; i < 7; i++) assert.equal(out.scenes[i].start_s, out.scenes[i - 1].end_s, 'back to back');
  assert.ok(out.ending_seconds > 0, 'the card comes in 0.7 s after the last word');
  assert.equal(out.hook_s, undefined);
  const info = await probe(out.audio.path);
  assert.ok(Math.abs(info.duration_s - out.seconds) < 0.05, `the track is ${info.duration_s} s, the spans ${out.seconds} s`);
});

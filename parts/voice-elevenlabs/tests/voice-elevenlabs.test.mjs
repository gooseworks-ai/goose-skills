import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadNewest, hasFfmpeg, loadPart, makeCtx } from '../../_tools/kit-harness.mjs';
import { sample } from './fixture.mjs';

const { dir, mod } = await loadNewest('voice-elevenlabs');
const ffmpeg = await hasFfmpeg();

test('orders one timestamped line per spoken scene, with the brand pronunciation swapped in', { skip: !ffmpeg && 'ffmpeg is not installed' }, async () => {
  const { ctx, orders } = makeCtx({ partDir: dir, line: sample.line });
  const out = await mod.run(sample.inputs(), ctx);
  assert.equal(orders.length, 2, 'the empty line is not paid for');
  assert.deepEqual(
    orders.map((o) => [o.provider, o.path, o.body]),
    [
      ['elevenlabs', '/v1/text-to-speech/dMyQqiVXTU80dDl2eNK8/with-timestamps', { text: 'Meet drink A G one today.', model_id: 'eleven_v3' }],
      ['elevenlabs', '/v1/text-to-speech/dMyQqiVXTU80dDl2eNK8/with-timestamps', { text: 'It tastes great.', model_id: 'eleven_v3' }],
    ],
  );
  assert.deepEqual(orders.map((o) => o.piece), ['line-s1', 'line-s3']);
  // Captions keep the written name: the swapped words map back to "Drinkag1".
  assert.deepEqual(out.speech[0].words.map((w) => w.text), ['Meet', 'Drinkag1', 'today.']);
  assert.equal(out.speech[0].spoken, 'Meet drink A G one today.');
  // The second line starts after the first line's length plus the default gap.
  const first = out.speech[0].end_s - out.speech[0].start_s;
  assert.ok(Math.abs(out.speech[1].start_s - (first + 0.25)) < 0.01, `second line at ${out.speech[1].start_s}`);
  assert.ok(Math.abs(out.seconds - out.speech[1].end_s) < 0.01);
  const words = out.speech.flatMap((s) => s.words);
  for (let i = 1; i < words.length; i++) assert.ok(words[i].start_s >= words[i - 1].start_s, 'word timings run forward');
});

test('refuses to go on when a line comes back without character timings', { skip: !ffmpeg && 'ffmpeg is not installed' }, async () => {
  const { ctx } = makeCtx({
    partDir: dir,
    line: async (order, c) => ({ ...(await sample.line(order, c)), json: { alignment: { characters: ['a'], character_start_times_seconds: [] } } }),
  });
  await assert.rejects(mod.run(sample.inputs(), ctx), (e) => e.code === 'provider_failed');
});

test('refuses a plan with no line to speak, before ordering anything', async () => {
  const { ctx, orders } = makeCtx({ partDir: dir, line: sample.line });
  await assert.rejects(mod.run({ scenes: [{ id: 'a', line: '   ' }], voice_id: 'abc' }, ctx), (e) => e.code === 'bad_input');
  assert.equal(orders.length, 0);
});

// 1.1.0: null lines, cast voices, model choice, audio tags and max_seconds.

const A = 'EXAVITQu4vr4xnSDxMaL';
const B = 'TxGEqnHWrfWFTfGW9XjX';
const cast = [
  { key: 'a', name: 'Maya', look: 'woman, 34', voice_id: A, voice_settings: { stability: 0.55 }, image: null },
  { key: 'b', name: 'Theo', look: 'man, 41', voice_id: B, voice_settings: null },
];

test('a scene whose line is null, missing or empty is skipped: no piece and no span', { skip: !ffmpeg && 'ffmpeg is not installed' }, async () => {
  const { ctx, orders } = makeCtx({ partDir: dir, line: sample.line });
  const out = await mod.run(
    {
      scenes: [
        { id: 's1', line: 'First words.', on_screen: null, picture: null },
        { id: 's2', line: null, on_screen: 'Silent beat', picture: 'a shelf' },
        { id: 's3' },
        { id: 's4', line: '  ' },
        { id: 'card', line: 'Last words.', on_screen: null, picture: null },
      ],
      voice_id: A,
    },
    ctx,
  );
  assert.deepEqual(orders.map((o) => o.piece), ['line-s1', 'line-card']);
  assert.deepEqual(out.scenes.map((s) => s.id), ['s1', 'card']);
  assert.deepEqual(out.speech.map((s) => s.scene_id), ['s1', 'card']);
  assert.deepEqual(out.lines.map((l) => l.scene_id), ['s1', 'card']);
});

test('a plan of only null lines is refused before ordering anything', async () => {
  const { ctx, orders } = makeCtx({ partDir: dir, line: sample.line });
  await assert.rejects(mod.run({ scenes: [{ id: 'a', line: null }], voice_id: A }, ctx), (e) => e.code === 'bad_input');
  assert.equal(orders.length, 0);
});

test('with a cast, each speaker is spoken with their own voice and settings, and voice_id may be left out', { skip: !ffmpeg && 'ffmpeg is not installed' }, async () => {
  const { ctx, orders } = makeCtx({ partDir: dir, line: sample.line });
  const out = await mod.run(
    {
      scenes: [
        { id: 's1', line: 'So I stopped cooking.', speaker: 'a' },
        { id: 's2', line: 'Wait, really?', speaker: 'b' },
        { id: 's3', line: null, speaker: null },
      ],
      cast,
      voice_settings: { similarity_boost: 0.8, stability: 0.3 },
    },
    ctx,
  );
  assert.deepEqual(
    orders.map((o) => [o.piece, o.path, o.body]),
    [
      ['line-s1', `/v1/text-to-speech/${A}/with-timestamps`, { text: 'So I stopped cooking.', model_id: 'eleven_v3', voice_settings: { similarity_boost: 0.8, stability: 0.55 } }],
      ['line-s2', `/v1/text-to-speech/${B}/with-timestamps`, { text: 'Wait, really?', model_id: 'eleven_v3', voice_settings: { similarity_boost: 0.8, stability: 0.3 } }],
    ],
  );
  assert.deepEqual(out.scenes.map((s) => s.id), ['s1', 's2']);
});

test('a scene with no speaker uses the default voice_id; a member with no voice falls back to it too', { skip: !ffmpeg && 'ffmpeg is not installed' }, async () => {
  const { ctx, orders } = makeCtx({ partDir: dir, line: sample.line });
  await mod.run(
    {
      scenes: [
        { id: 'n1', line: 'Narrator here.' },
        { id: 'c1', line: 'Member with no voice.', speaker: 'c' },
      ],
      cast: [...cast, { key: 'c', name: 'Ana', look: 'woman', voice_id: null }],
      voice_id: 'narrator1',
    },
    ctx,
  );
  assert.deepEqual(orders.map((o) => o.path), ['/v1/text-to-speech/narrator1/with-timestamps', '/v1/text-to-speech/narrator1/with-timestamps']);
});

test('refusals happen before any piece is ordered', async () => {
  const cases = [
    ['a speaker the cast does not hold', { scenes: [{ id: 's1', line: 'Hi.', speaker: 'a' }, { id: 's2', line: 'Who?', speaker: 'zed' }], cast }],
    ['a spoken scene with no voice at all', { scenes: [{ id: 's1', line: 'Hi.', speaker: 'a' }, { id: 's2', line: 'No voice.' }], cast }],
    ['a member with no voice and no default', { scenes: [{ id: 's1', line: 'Hi.', speaker: 'c' }], cast: [{ key: 'c', voice_id: null }] }],
    ['two members with one key', { scenes: [{ id: 's1', line: 'Hi.', speaker: 'a' }], cast: [cast[0], { ...cast[1], key: 'a' }] }],
    ['a tagged line kept for eleven_multilingual_v2', { scenes: [{ id: 's1', line: '[whispers] Hi.' }], voice_id: A, model: 'eleven_multilingual_v2', tags: 'keep' }],
    ['an unknown model', { scenes: [{ id: 's1', line: 'Hi.' }], voice_id: A, model: 'eleven_turbo_v2' }],
    ['no voice_id and no cast', { scenes: [{ id: 's1', line: 'Hi.' }] }],
  ];
  for (const [what, inputs] of cases) {
    const { ctx, orders } = makeCtx({ partDir: dir, line: sample.line });
    await assert.rejects(mod.run(inputs, ctx), (e) => e.code === 'bad_input', what);
    assert.equal(orders.length, 0, what);
  }
});

test('eleven_multilingual_v2 is sent as the model and strips audio tags by default', { skip: !ffmpeg && 'ffmpeg is not installed' }, async () => {
  const { ctx, orders } = makeCtx({ partDir: dir, line: sample.line });
  const out = await mod.run({ scenes: [{ id: 's1', line: '[sighs] Dinner, done.' }], voice_id: A, model: 'eleven_multilingual_v2' }, ctx);
  assert.deepEqual(orders[0].body, { text: 'Dinner, done.', model_id: 'eleven_multilingual_v2' });
  assert.equal(out.speech[0].text, 'Dinner, done.');
  assert.equal(out.speech[0].spoken, undefined);
});

test('eleven_v3 keeps audio tags in what is sent, and captions never show them', { skip: !ffmpeg && 'ffmpeg is not installed' }, async () => {
  const { ctx, orders } = makeCtx({ partDir: dir, line: sample.line });
  const out = await mod.run(
    { scenes: [{ id: 's1', line: '[whispers] Meet Drinkag1 [laughs] today.' }], voice_id: A, pronunciations: [{ term: 'Drinkag1', say_as: 'drink A G one' }] },
    ctx,
  );
  assert.equal(orders[0].body.text, '[whispers] Meet drink A G one [laughs] today.');
  assert.equal(out.speech[0].text, 'Meet Drinkag1 today.');
  assert.equal(out.speech[0].spoken, '[whispers] Meet drink A G one [laughs] today.');
  assert.deepEqual(out.speech[0].words.map((w) => w.text), ['Meet', 'Drinkag1', 'today.']);
  const [meet, name, today] = out.speech[0].words;
  assert.ok(meet.start_s > 0, 'the opening tag is not timed as part of the first word');
  assert.ok(name.start_s >= meet.end_s && today.start_s >= name.end_s, 'words run forward');
});

test('tags: strip takes tags out of what eleven_v3 is sent', { skip: !ffmpeg && 'ffmpeg is not installed' }, async () => {
  const { ctx, orders } = makeCtx({ partDir: dir, line: sample.line });
  const out = await mod.run({ scenes: [{ id: 's1', line: 'Hello [laughs] there [sighs].' }], voice_id: A, tags: 'strip' }, ctx);
  assert.equal(orders[0].body.text, 'Hello there.');
  assert.deepEqual(out.speech[0].words.map((w) => w.text), ['Hello', 'there.']);
});

test('voiceWithoutTags keeps untagged lines exactly and tidies the spaces a tag leaves', () => {
  const cases = [
    ['plain  text, kept', 'plain  text, kept'],
    ['[excited] Hello there.', 'Hello there.'],
    ['Hello [laughs] there.', 'Hello there.'],
    ['Hello there [sighs].', 'Hello there.'],
    ['Hello [laughs], friend', 'Hello, friend'],
    ['A [x] [y] B', 'A B'],
  ];
  for (const [line, want] of cases) assert.equal(mod.voiceWithoutTags(line).text, want, line);
});

test('max_seconds refuses a read that runs too long', { skip: !ffmpeg && 'ffmpeg is not installed' }, async () => {
  const { ctx } = makeCtx({ partDir: dir, line: sample.line });
  // The fake voice speaks 0.05 s per character: two 40-character lines and a gap run about 4.25 s.
  const scenes = [{ id: 's1', line: 'x'.repeat(40) }, { id: 's2', line: 'y'.repeat(40) }];
  await assert.rejects(mod.run({ scenes, voice_id: A, max_seconds: 3 }, ctx), (e) => e.code === 'bad_input' && /max_seconds/.test(e.message + (e.detail || '')));
  const ok = makeCtx({ partDir: dir, line: sample.line });
  const out = await mod.run({ scenes, voice_id: A, max_seconds: 10 }, ok.ctx);
  assert.ok(out.seconds > 3 && out.seconds <= 10);
});

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { fakeAlignment, loadNewest, hasFfmpeg, loadPart, makeCtx } from '../../_tools/kit-harness.mjs';
import { recordedReply, sample } from './fixture.mjs';

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

// 1.1.0 part 2: join (line | sentence | one) and pace.

const near = (a, b, tol = 0.01) => Math.abs(a - b) <= tol;

test('fixture: the recorded with-timestamps reply, joined as one sentence, is split back per scene between words', { skip: !ffmpeg && 'ffmpeg is not installed' }, async () => {
  const { ctx, orders } = makeCtx({ partDir: dir, line: recordedReply.line });
  const out = await mod.run({ scenes: [{ id: 's1', line: 'Hi' }, { id: 's2', line: 'there.' }], voice_id: A, join: 'sentence' }, ctx);
  assert.equal(orders.length, 1, 'one request for the sentence');
  assert.equal(orders[0].body.text, recordedReply.text);
  assert.equal(orders[0].piece, 'line-s1');
  assert.deepEqual(out.scenes, [
    { id: 's1', start_s: 0, end_s: 0.21 },
    { id: 's2', start_s: 0.21, end_s: 0.8 },
  ]);
  assert.deepEqual(out.speech.map((s) => [s.scene_id, s.start_s, s.end_s]), [['s1', 0, 0.15], ['s2', 0.21, 0.8]]);
  assert.deepEqual(out.speech.flatMap((s) => s.words), [
    { text: 'Hi', start_s: 0, end_s: 0.15 },
    { text: 'there.', start_s: 0.21, end_s: 0.7 },
  ]);
  assert.equal(out.tempo, 1);
  assert.equal(out.words_per_second, +(2 / (0.15 + 0.59)).toFixed(2));
  // Each scene gets its own WAV cut from the joined read, so a lip-sync step can take one line.
  assert.deepEqual(out.lines.map((l) => l.scene_id), ['s1', 's2']);
  for (const [i, l] of out.lines.entries()) {
    assert.match(l.audio.path, /\.wav$/);
    const want = out.speech[i].end_s - out.speech[i].start_s;
    assert.ok(near(l.audio.duration_s, want, 0.03), `line ${i} runs ${l.audio.duration_s}, want ${want}`);
  }
});

test('join: sentence sends one request per sentence, skips null lines, and tiles the scenes with no gap inside a sentence', { skip: !ffmpeg && 'ffmpeg is not installed' }, async () => {
  const { ctx, orders } = makeCtx({ partDir: dir, line: sample.line });
  const out = await mod.run(
    {
      scenes: [
        { id: 's1', line: 'Do not' },
        { id: 's2', line: 'buy this.' },
        { id: 's3', line: 'Ever!' },
        { id: 's4', line: null, on_screen: 'beat' },
        { id: 's5', line: 'Fine' },
        { id: 's6', line: 'then.' },
      ],
      voice_id: A,
      join: 'sentence',
      gap_s: 0.2,
    },
    ctx,
  );
  assert.deepEqual(orders.map((o) => [o.piece, o.body.text]), [
    ['line-s1', 'Do not buy this.'],
    ['line-s3', 'Ever!'],
    ['line-s5', 'Fine then.'],
  ]);
  assert.deepEqual(out.scenes.map((s) => s.id), ['s1', 's2', 's3', 's5', 's6']);
  // Scenes tile: each one ends where the next starts.
  for (let i = 1; i < out.scenes.length; i++) assert.equal(out.scenes[i].start_s, out.scenes[i - 1].end_s);
  assert.equal(out.scenes.at(-1).end_s, out.seconds);
  // Inside a sentence the next scene starts on its first word; the gap goes only between requests.
  const words = Object.fromEntries(out.speech.map((s) => [s.scene_id, s.words]));
  assert.equal(out.scenes[1].start_s, words.s2[0].start_s);
  assert.ok(words.s2[0].start_s - words.s1.at(-1).end_s < 0.1, 'no gap inside the sentence');
  const firstRequest = 'Do not buy this.'.length * 0.05;
  assert.ok(near(out.scenes[2].start_s, firstRequest + 0.2), `the second request starts after the gap (${out.scenes[2].start_s})`);
  // No cut inside a word.
  const all = out.speech.flatMap((s) => s.words);
  for (const sc of out.scenes) assert.ok(!all.some((w) => w.start_s < sc.start_s && sc.start_s < w.end_s), `cut ${sc.start_s} inside a word`);
  assert.deepEqual(out.speech.map((s) => s.text), ['Do not', 'buy this.', 'Ever!', 'Fine', 'then.']);
  // A line read alone keeps the provider file; joined lines are cut to WAV.
  assert.deepEqual(out.lines.map((l) => l.audio.path.split('.').pop()), ['wav', 'wav', 'mp3', 'wav', 'wav']);
});

test('join: sentence starts a new request where the speaker changes', { skip: !ffmpeg && 'ffmpeg is not installed' }, async () => {
  const { ctx, orders } = makeCtx({ partDir: dir, line: sample.line });
  await mod.run(
    { scenes: [{ id: 's1', line: 'So I', speaker: 'a' }, { id: 's2', line: 'wait', speaker: 'b' }, { id: 's3', line: 'what?', speaker: 'b' }], cast, join: 'sentence' },
    ctx,
  );
  assert.deepEqual(orders.map((o) => [o.path, o.body.text]), [
    [`/v1/text-to-speech/${A}/with-timestamps`, 'So I'],
    [`/v1/text-to-speech/${B}/with-timestamps`, 'wait what?'],
  ]);
});

test('join: one sends the whole read once, with tags and pronunciations, and captions keep the written words', { skip: !ffmpeg && 'ffmpeg is not installed' }, async () => {
  const { ctx, orders } = makeCtx({ partDir: dir, line: sample.line });
  const out = await mod.run(
    {
      scenes: [
        { id: 'a', line: '[soft] Meet Drinkag1.' },
        { id: 'b', line: null },
        { id: 'c', line: 'It tastes great.' },
      ],
      voice_id: A,
      join: 'one',
      pronunciations: [{ term: 'Drinkag1', say_as: 'drink A G one' }],
    },
    ctx,
  );
  assert.equal(orders.length, 1);
  assert.equal(orders[0].body.text, '[soft] Meet drink A G one. It tastes great.');
  assert.deepEqual(out.speech.map((s) => s.text), ['Meet Drinkag1.', 'It tastes great.']);
  assert.deepEqual(out.speech[0].words.map((w) => w.text), ['Meet', 'Drinkag1.']);
  assert.ok(out.speech[0].words[0].start_s > 0, 'the tag is not timed as the first word');
  assert.deepEqual(out.scenes.map((s) => s.id), ['a', 'c']);
  assert.equal(out.scenes[1].start_s, out.speech[1].words[0].start_s);
});

test('a joined reply whose timings do not line up with the text fails the piece', { skip: !ffmpeg && 'ffmpeg is not installed' }, async () => {
  const { ctx } = makeCtx({
    partDir: dir,
    line: async (order, c) => {
      const r = await sample.line(order, c);
      const short = fakeAlignment(order.body.text.slice(0, -3), 1);
      return { ...r, json: { alignment: short, normalized_alignment: short } };
    },
  });
  await assert.rejects(mod.run({ scenes: [{ id: 's1', line: 'One' }, { id: 's2', line: 'two.' }], voice_id: A, join: 'sentence' }, ctx), (e) => e.code === 'provider_failed');
});

test('join and pace refusals happen before any piece is ordered', async () => {
  const cases = [
    ['join one with two voices', { scenes: [{ id: 's1', line: 'Hi.', speaker: 'a' }, { id: 's2', line: 'Yo.', speaker: 'b' }], cast, join: 'one' }],
    ['join one past the eleven_v3 request limit', { scenes: Array.from({ length: 4 }, (_, i) => ({ id: `s${i}`, line: 'x'.repeat(1000) })), voice_id: A, join: 'one' }],
    ['an unknown join', { scenes: [{ id: 's1', line: 'Hi.' }], voice_id: A, join: 'paragraph' }],
    ['a tempo above max_tempo', { scenes: [{ id: 's1', line: 'Hi.' }], voice_id: A, pace: { tempo: 1.3, max_tempo: 1.2 } }],
    ['min_wps above max_wps', { scenes: [{ id: 's1', line: 'Hi.' }], voice_id: A, pace: { min_wps: 3, max_wps: 2 } }],
    ['a tempo past 1.3', { scenes: [{ id: 's1', line: 'Hi.' }], voice_id: A, pace: { tempo: 1.5 } }],
    ['a max_tempo past 1.3', { scenes: [{ id: 's1', line: 'Hi.' }], voice_id: A, pace: { max_tempo: 1.4 } }],
  ];
  for (const [what, inputs] of cases) {
    const { ctx, orders } = makeCtx({ partDir: dir, line: sample.line });
    await assert.rejects(mod.run(inputs, ctx), (e) => e.code === 'bad_input', what);
    assert.equal(orders.length, 0, what);
  }
});

test('line mode reports tempo 1 and the read rate, and keeps each provider file as the line audio', { skip: !ffmpeg && 'ffmpeg is not installed' }, async () => {
  const { ctx } = makeCtx({ partDir: dir, line: sample.line });
  const out = await mod.run(sample.inputs(), ctx);
  assert.equal(out.tempo, 1);
  const spokenS = out.speech.reduce((t, s) => t + s.end_s - s.start_s, 0);
  assert.ok(near(out.words_per_second, 6 / spokenS, 0.01), `${out.words_per_second}`);
  assert.ok(out.lines.every((l) => l.audio.path.endsWith('.mp3')));
});

test('pace.tempo plays the read faster and scales every timing, the track and the line files', { skip: !ffmpeg && 'ffmpeg is not installed' }, async () => {
  const inputs = { scenes: [{ id: 's1', line: 'Do not' }, { id: 's2', line: 'buy this.' }, { id: 's3', line: 'Ever!' }], voice_id: A, join: 'sentence' };
  const plain = await mod.run(inputs, makeCtx({ partDir: dir, line: sample.line }).ctx);
  const { ctx } = makeCtx({ partDir: dir, line: sample.line });
  const out = await mod.run({ ...inputs, pace: { tempo: 1.25 } }, ctx);
  assert.equal(out.tempo, 1.25);
  assert.ok(near(out.seconds, plain.seconds / 1.25), `${out.seconds} vs ${plain.seconds}`);
  assert.ok(near(out.audio.duration_s, out.seconds, 0.06), `the track runs ${out.audio.duration_s}, timings say ${out.seconds}`);
  out.scenes.forEach((sc, i) => assert.ok(near(sc.start_s, plain.scenes[i].start_s / 1.25) && near(sc.end_s, plain.scenes[i].end_s / 1.25)));
  const w0 = out.speech.flatMap((s) => s.words);
  plain.speech.flatMap((s) => s.words).forEach((w, i) => assert.ok(near(w0[i].start_s, w.start_s / 1.25), `word ${i}`));
  assert.ok(near(out.words_per_second, plain.words_per_second * 1.25, 0.02));
  // Every line, even one read alone, is cut from the paced track.
  assert.ok(out.lines.every((l) => l.audio.path.endsWith('.wav')));
  const s3 = out.speech[2];
  assert.ok(near(out.lines[2].audio.duration_s, s3.end_s - s3.start_s, 0.03));
});

test('pace.min_wps speeds a slow read up to the band, no faster than max_tempo', { skip: !ffmpeg && 'ffmpeg is not installed' }, async () => {
  // The fake voice reads 0.05 s per character: "aaaa bbbb cccc." is 3 words in 0.75 s, 4 words per second.
  const scenes = [{ id: 's1', line: 'aaaa bbbb cccc.' }];
  const { ctx } = makeCtx({ partDir: dir, line: sample.line });
  const out = await mod.run({ scenes, voice_id: A, pace: { min_wps: 4.6, max_wps: 6 } }, ctx);
  assert.ok(out.tempo > 1.14 && out.tempo <= 1.16, `tempo ${out.tempo}`);
  assert.ok(out.words_per_second >= 4.6, `${out.words_per_second} words per second`);
  const slow = makeCtx({ partDir: dir, line: sample.line });
  const kept = await mod.run({ scenes, voice_id: A, pace: { min_wps: 3, max_wps: 5 } }, slow.ctx);
  assert.equal(kept.tempo, 1, 'a read inside the band is left alone');
  const fast = makeCtx({ partDir: dir, line: sample.line });
  const slowed = await mod.run({ scenes, voice_id: A, pace: { max_wps: 3.5 } }, fast.ctx);
  assert.ok(slowed.tempo < 1 && slowed.words_per_second <= 3.5, `tempo ${slowed.tempo}, ${slowed.words_per_second} wps`);
});

test('a read still outside the pace band after the tempo fit is refused', { skip: !ffmpeg && 'ffmpeg is not installed' }, async () => {
  const { ctx } = makeCtx({ partDir: dir, line: sample.line });
  await assert.rejects(
    mod.run({ scenes: [{ id: 's1', line: 'aaaa bbbb cccc.' }], voice_id: A, pace: { min_wps: 6, max_tempo: 1.2 } }, ctx),
    (e) => e.code === 'bad_input' && /min_wps/.test(e.message),
  );
});

test('max_seconds is checked on the paced read', { skip: !ffmpeg && 'ffmpeg is not installed' }, async () => {
  // Two 40-character lines and a gap run about 4.25 s before pace, about 3.54 s at tempo 1.2.
  const scenes = [{ id: 's1', line: 'x'.repeat(40) }, { id: 's2', line: 'y'.repeat(40) }];
  await assert.rejects(mod.run({ scenes, voice_id: A, max_seconds: 4 }, makeCtx({ partDir: dir, line: sample.line }).ctx), (e) => e.code === 'bad_input');
  const out = await mod.run({ scenes, voice_id: A, max_seconds: 4, pace: { tempo: 1.2 } }, makeCtx({ partDir: dir, line: sample.line }).ctx);
  assert.ok(out.seconds <= 4 && near(out.seconds, 4.25 / 1.2));
});

// Review fixes: off-screen speakers, a single over-long line, settings compared by value.

test('an off-screen speaker with no cast entry reads with the default voice_id', { skip: !ffmpeg && 'ffmpeg is not installed' }, async () => {
  const { ctx, orders } = makeCtx({ partDir: dir, line: sample.line });
  const out = await mod.run(
    {
      scenes: [
        { id: 'q1', line: 'What do you think this is?', speaker: 'interviewer' },
        { id: 'a1', line: 'A lamp?', speaker: 'a' },
      ],
      cast,
      off_screen: ['interviewer'],
      voice_id: 'narrator1',
    },
    ctx,
  );
  assert.deepEqual(orders.map((o) => o.path), ['/v1/text-to-speech/narrator1/with-timestamps', `/v1/text-to-speech/${A}/with-timestamps`]);
  assert.deepEqual(out.scenes.map((s) => s.id), ['q1', 'a1']);
});

test('off-screen and over-long refusals happen before any piece is ordered', async () => {
  const cases = [
    ['an off-screen speaker with no default voice', { scenes: [{ id: 'q1', line: 'Hi?', speaker: 'interviewer' }], cast, off_screen: ['interviewer'] }],
    ['an off-screen key that is also a cast key', { scenes: [{ id: 's1', line: 'Hi.', speaker: 'a' }], cast, off_screen: ['a'], voice_id: A }],
    ['a speaker in neither the cast nor off_screen', { scenes: [{ id: 's1', line: 'Hi.', speaker: 'zed' }], cast, off_screen: ['interviewer'], voice_id: A }],
    [
      'one line that pronunciations push past the eleven_v3 limit',
      { scenes: [{ id: 's1', line: 'GW '.repeat(300).trim() }], voice_id: A, pronunciations: [{ term: 'GW', say_as: 'goose works goose works' }] },
    ],
    [
      'one line past the limit in join: line mode, after the first request',
      { scenes: [{ id: 's1', line: 'Hi.' }, { id: 's2', line: 'GW '.repeat(300).trim() }], voice_id: A, pronunciations: [{ term: 'GW', say_as: 'goose works goose works' }] },
    ],
  ];
  for (const [what, inputs] of cases) {
    const { ctx, orders } = makeCtx({ partDir: dir, line: sample.line });
    await assert.rejects(mod.run(inputs, ctx), (e) => e.code === 'bad_input', what);
    assert.equal(orders.length, 0, what);
  }
});

test('join: one treats the same voice settings in another key order as one voice', { skip: !ffmpeg && 'ffmpeg is not installed' }, async () => {
  const { ctx, orders } = makeCtx({ partDir: dir, line: sample.line });
  await mod.run(
    {
      scenes: [{ id: 's1', line: 'So I', speaker: 'x' }, { id: 's2', line: 'stopped.' }],
      cast: [{ key: 'x', voice_id: A, voice_settings: { similarity_boost: 0.8, stability: 0.3 } }],
      voice_id: A,
      voice_settings: { stability: 0.3, similarity_boost: 0.8 },
      join: 'one',
    },
    ctx,
  );
  assert.deepEqual(orders.map((o) => o.body.text), ['So I stopped.']);
});

test('a joined reply of the right length but other characters fails the piece instead of being sliced', { skip: !ffmpeg && 'ffmpeg is not installed' }, async () => {
  const { ctx } = makeCtx({
    partDir: dir,
    line: async (order, c) => {
      const r = await sample.line(order, c);
      // Same length as "One two." but the space moved, so fixed offsets would misplace the cut.
      const shifted = fakeAlignment('On etwo.', 1);
      assert.equal(shifted.characters.length, [...order.body.text].length);
      return { ...r, json: { alignment: shifted, normalized_alignment: shifted } };
    },
  });
  await assert.rejects(mod.run({ scenes: [{ id: 's1', line: 'One' }, { id: 's2', line: 'two.' }], voice_id: A, join: 'sentence' }, ctx), (e) => e.code === 'provider_failed');
});

test('eleven_multilingual_v2 with tags: keep and no tagged line is allowed (nothing to misread)', { skip: !ffmpeg && 'ffmpeg is not installed' }, async () => {
  const { ctx, orders } = makeCtx({ partDir: dir, line: sample.line });
  await mod.run({ scenes: [{ id: 's1', line: 'Hello there.' }], voice_id: A, model: 'eleven_multilingual_v2', tags: 'keep' }, ctx);
  assert.deepEqual(orders.map((o) => [o.body.model_id, o.body.text]), [['eleven_multilingual_v2', 'Hello there.']]);
});

test('a tempo fitted to min_wps is not refused when the reported rate rounds below it', { skip: !ffmpeg && 'ffmpeg is not installed' }, async () => {
  const scenes = [{ id: 's1', line: 'aaaa bbbb cccc.' }];
  const plain = makeCtx({ partDir: dir, line: sample.line });
  const base = await mod.run({ scenes, voice_id: A }, plain.ctx);
  const raw = 3 / base.speech.reduce((t, s) => t + (s.end_s - s.start_s), 0);
  // A band edge with a third decimal of 1: the paced rate lands in [m, m + 0.004], which rounds to 2 decimals below m.
  const m = Math.floor(raw * 1.15 * 100) / 100 + 0.001;
  const { ctx } = makeCtx({ partDir: dir, line: sample.line });
  const out = await mod.run({ scenes, voice_id: A, pace: { min_wps: m } }, ctx);
  assert.ok(out.tempo > 1 && out.tempo <= 1.25, `tempo ${out.tempo}`);
  assert.ok(Math.abs(out.words_per_second - m) < 0.01, `${out.words_per_second} words per second, band edge ${m}`);
});

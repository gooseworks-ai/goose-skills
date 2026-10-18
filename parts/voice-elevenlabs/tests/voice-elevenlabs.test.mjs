import { test } from 'node:test';
import assert from 'node:assert/strict';
import { canonicalJson, fakeAlignment, loadNewest, hasFfmpeg, loadPart, makeCtx, probe, run } from '../../_tools/kit-harness.mjs';
import { recordedReply, sample } from './fixture.mjs';

const { dir, mod } = await loadNewest('voice-elevenlabs');
// 1.1.0 fitted a tempo to pace.min_wps; 1.2.x never stretches a read to a rate target.
const v110 = await loadPart('voice-elevenlabs', '1.1.0');
// 1.2.1 defaulted to eleven_v3 and had no target pace.
const v121 = await loadPart('voice-elevenlabs', '1.2.1');
// 1.3.0 had no lead_s; with lead_s 0 or absent the newest version must give exactly what 1.3.0 gave.
const v130 = await loadPart('voice-elevenlabs', '1.3.0');
const ffmpeg = await hasFfmpeg();

/**
 * Runs a read once (pending: tagged reads need a reviewed alignment), then again with a reviewed alignment for
 * every request: the tag-free spoken text, its words starting `lead` seconds in (where the tag was performed).
 */
async function reviewedRun(inputs, lead = 0.3) {
  const first = makeCtx({ partDir: dir, line: sample.line });
  const pending = await mod.run(inputs, first.ctx);
  assert.equal(pending.timing_status, 'requires_reviewed_alignment');
  const reviewed = [];
  for (const source of pending.sources) {
    const seconds = (await probe(source.audio.path)).duration_s;
    const chars = [...source.spoken_text];
    const step = (seconds - lead) / chars.length;
    reviewed.push({
      piece: source.piece, source_sha256: source.audio.sha256, status: 'pass', audio_listened: true, reviewer: 'test listener', method: 'forced_alignment',
      alignment: {
        characters: chars,
        character_start_times_seconds: chars.map((_, i) => +(lead + i * step).toFixed(3)),
        character_end_times_seconds: chars.map((_, i) => +(lead + (i + 1) * step).toFixed(3)),
      },
      coverage: { start_s: 0, end_s: seconds },
    });
  }
  const second = makeCtx({ partDir: dir, line: sample.line });
  const out = await mod.run({ ...inputs, reviewed_alignments: reviewed }, second.ctx);
  return { out, orders: second.orders, pending };
}

test('orders one timestamped line per spoken scene, with the brand pronunciation swapped in', { skip: !ffmpeg && 'ffmpeg is not installed' }, async () => {
  const { ctx, orders } = makeCtx({ partDir: dir, line: sample.line });
  const out = await mod.run(sample.inputs(), ctx);
  assert.equal(orders.length, 2, 'the empty line is not paid for');
  assert.deepEqual(
    orders.map((o) => [o.provider, o.path, o.body]),
    [
      ['elevenlabs', '/v1/text-to-speech/dMyQqiVXTU80dDl2eNK8/with-timestamps', { text: 'Meet drink A G one today.', model_id: 'eleven_v4' }],
      ['elevenlabs', '/v1/text-to-speech/dMyQqiVXTU80dDl2eNK8/with-timestamps', { text: 'It tastes great.', model_id: 'eleven_v4' }],
    ],
  );
  assert.deepEqual(orders.map((o) => o.piece), ['line-s1', 'line-s3']);
  // Captions keep the written name: the swapped words map back to "Drinkag1".
  assert.deepEqual(out.speech[0].words.map((w) => w.text), ['Meet', 'Drinkag1', 'today.']);
  assert.equal(out.speech[0].spoken, 'Meet drink A G one today.');
  // The second line starts after the first line's length plus the default gap (0.08 s since 1.2.0; each line ends a sentence).
  const first = out.speech[0].end_s - out.speech[0].start_s;
  assert.ok(Math.abs(out.speech[1].start_s - (first + 0.08)) < 0.01, `second line at ${out.speech[1].start_s}`);
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
      ['line-s1', `/v1/text-to-speech/${A}/with-timestamps`, { text: 'So I stopped cooking.', model_id: 'eleven_v4', voice_settings: { similarity_boost: 0.8, stability: 0.55 } }],
      ['line-s2', `/v1/text-to-speech/${B}/with-timestamps`, { text: 'Wait, really?', model_id: 'eleven_v4', voice_settings: { similarity_boost: 0.8, stability: 0.3 } }],
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
  // A tagged read is timed only from a reviewed alignment of its tag-free speech.
  const { out, orders } = await reviewedRun({ scenes: [{ id: 's1', line: '[whispers] Meet Drinkag1 [laughs] today.' }], voice_id: A, model: 'eleven_v3', pronunciations: [{ term: 'Drinkag1', say_as: 'drink A G one' }] });
  assert.equal(orders[0].body.text, '[whispers] Meet drink A G one [laughs] today.');
  assert.equal(out.speech[0].text, 'Meet Drinkag1 today.');
  assert.equal(out.speech[0].spoken, 'Meet drink A G one today.');
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
  const { out, orders } = await reviewedRun({
    scenes: [
      { id: 'a', line: '[soft] Meet Drinkag1.' },
      { id: 'b', line: null },
      { id: 'c', line: 'It tastes great.' },
    ],
    voice_id: A,
    join: 'one',
    pronunciations: [{ term: 'Drinkag1', say_as: 'drink A G one' }],
  });
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
    ['join one past the eleven_v3 request limit', { scenes: Array.from({ length: 4 }, (_, i) => ({ id: `s${i}`, line: 'x'.repeat(1000) })), voice_id: A, model: 'eleven_v3', join: 'one' }],
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

test('1.1.0: pace.min_wps speeds a slow read up to the band, no faster than max_tempo', { skip: !ffmpeg && 'ffmpeg is not installed' }, async () => {
  const { dir, mod } = v110;
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

test('the newest version never stretches a read to pace.min_wps: a slow read is refused, tempo stays 1', { skip: !ffmpeg && 'ffmpeg is not installed' }, async () => {
  const scenes = [{ id: 's1', line: 'aaaa bbbb cccc.' }];
  await assert.rejects(mod.run({ scenes, voice_id: A, pace: { min_wps: 4.6, max_wps: 6 } }, makeCtx({ partDir: dir, line: sample.line }).ctx), (e) => e.code === 'bad_input' && /min_wps/.test(e.message));
  const kept = await mod.run({ scenes, voice_id: A, pace: { min_wps: 3, max_wps: 5 } }, makeCtx({ partDir: dir, line: sample.line }).ctx);
  assert.equal(kept.tempo, 1);
});

test('a read still outside the pace band after the tempo fit is refused', { skip: !ffmpeg && 'ffmpeg is not installed' }, async () => {
  const { ctx } = makeCtx({ partDir: dir, line: sample.line });
  await assert.rejects(
    mod.run({ scenes: [{ id: 's1', line: 'aaaa bbbb cccc.' }], voice_id: A, pace: { min_wps: 6, max_tempo: 1.2 } }, ctx),
    (e) => e.code === 'bad_input' && /min_wps/.test(e.message),
  );
});

test('max_seconds is checked on the paced read', { skip: !ffmpeg && 'ffmpeg is not installed' }, async () => {
  // Two 40-character lines read alone with a 0.25 s gap run about 4.25 s before pace, about 3.54 s at tempo 1.2.
  const scenes = [{ id: 's1', line: 'x'.repeat(40) }, { id: 's2', line: 'y'.repeat(40) }];
  const read = { scenes, voice_id: A, join: 'line', gap_s: 0.25, max_seconds: 4 };
  await assert.rejects(mod.run(read, makeCtx({ partDir: dir, line: sample.line }).ctx), (e) => e.code === 'bad_input');
  const out = await mod.run({ ...read, pace: { tempo: 1.2 } }, makeCtx({ partDir: dir, line: sample.line }).ctx);
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
      { scenes: [{ id: 's1', line: 'GW '.repeat(300).trim() }], voice_id: A, model: 'eleven_v3', pronunciations: [{ term: 'GW', say_as: 'goose works goose works' }] },
    ],
    [
      'one line past the limit in join: line mode, after the first request',
      { scenes: [{ id: 's1', line: 'Hi.' }, { id: 's2', line: 'GW '.repeat(300).trim() }], voice_id: A, model: 'eleven_v3', pronunciations: [{ term: 'GW', say_as: 'goose works goose works' }] },
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

test('1.1.0: a tempo fitted to min_wps is not refused when the reported rate rounds below it', { skip: !ffmpeg && 'ffmpeg is not installed' }, async () => {
  const { dir, mod } = v110;
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

// 1.2.1: the whole read when a tagged read waits for review, and Eleven v4 with no support gate.

test('a tagged read with no reviewed alignment returns the whole read as one pending track, not its first request', { skip: !ffmpeg && 'ffmpeg is not installed' }, async () => {
  const { ctx, orders } = makeCtx({ partDir: dir, line: sample.line });
  const out = await mod.run({ scenes: [{ id: 's1', line: '[warm] First sentence here.' }, { id: 's2', line: 'And a second one.' }, { id: 's3', line: 'Then a third, much longer sentence to end.' }], voice_id: A }, ctx);
  assert.equal(orders.length, 3, 'join: sentence sends one request per sentence');
  assert.equal(out.content_review_status, 'pending');
  assert.equal(out.timing_status, 'requires_reviewed_alignment');
  assert.deepEqual(out.speech, []);
  assert.equal(out.sources.length, 3);
  assert.notEqual(out.audio.sha256, out.sources[0].audio.sha256, 'the audio is not the first request alone');
  let expected = 0;
  for (const [i, source] of out.sources.entries()) expected += (await probe(source.audio.path)).duration_s + (i + 1 < out.sources.length ? 0.08 : 0);
  const heard = (await probe(out.audio.path)).duration_s;
  assert.ok(Math.abs(heard - expected) < 0.06, `pending track ${heard}s, every request with gaps ${expected}s`);
  assert.ok(Math.abs(out.seconds - expected) < 0.01);
});

for (const model of ['eleven_v4', 'eleven_v4_turbo']) {
  test(`${model} is ordered as listed, with no model_support evidence`, { skip: !ffmpeg && 'ffmpeg is not installed' }, async () => {
    const { ctx, orders } = makeCtx({ partDir: dir, line: sample.line });
    const out = await mod.run({ scenes: [{ id: 's1', line: 'Hello there.' }], voice_id: A, model }, ctx);
    assert.deepEqual(orders.map((o) => o.body), [{ text: 'Hello there.', model_id: model }]);
    assert.equal(out.provenance.model, model);
    // An older caller that still sends model_support is not refused.
    const old = makeCtx({ partDir: dir, line: sample.line });
    await mod.run({ scenes: [{ id: 's1', line: 'Hello there.' }], voice_id: A, model, model_support: { provider: 'elevenlabs', model, endpoint: '/v1/text-to-speech/{voice_id}/with-timestamps', status: 'verified', evidence: 'x', quote_id: 'q' } }, old.ctx);
  });
}

// 1.3.0: Eleven v4 by default, measured words per second per line, and pace.target_wps.

test('the default model is eleven_v4; 1.2.1 still defaults to eleven_v3', { skip: !ffmpeg && 'ffmpeg is not installed' }, async () => {
  const { ctx, orders } = makeCtx({ partDir: dir, line: sample.line });
  const out = await mod.run({ scenes: [{ id: 's1', line: 'Hello there.' }], voice_id: A }, ctx);
  assert.equal(orders[0].body.model_id, 'eleven_v4');
  assert.equal(out.provenance.model, 'eleven_v4');
  const old = makeCtx({ partDir: v121.dir, line: sample.line });
  await v121.mod.run({ scenes: [{ id: 's1', line: 'Hello there.' }], voice_id: A }, old.ctx);
  assert.equal(old.orders[0].body.model_id, 'eleven_v3');
});

test('every line reports its measured words per second from the timestamps', { skip: !ffmpeg && 'ffmpeg is not installed' }, async () => {
  const { ctx } = makeCtx({ partDir: dir, line: sample.line });
  // The fake voice reads 0.05 s per character, with an even alignment.
  const out = await mod.run({ scenes: [{ id: 's1', line: 'aaaa bbbb cccc.' }, { id: 's2', line: 'dd ee.' }], voice_id: A, join: 'line' }, ctx);
  assert.equal(out.lines.length, 2);
  // "aaaa bbbb cccc." is 15 characters over 0.75 s: 3 words from 0 to the last c's end at 0.70 s.
  // "dd ee." is 6 characters over 0.5 s: 2 words from 0 to the last e's end at 0.417 s.
  assert.deepEqual(out.lines.map((l) => l.measured_words_per_second), [+(3 / 0.7).toFixed(2), +(2 / (5 * (0.5 / 6))).toFixed(2)]);
  for (const line of out.lines) assert.equal(line.words_per_second, line.measured_words_per_second, 'no tempo: delivered equals measured');
  assert.ok(near(out.measured_words_per_second, 5 / (0.7 + 5 * (0.5 / 6)), 0.01), 'heard words over the summed line spans');
  assert.deepEqual([out.pace_report.tempo, out.pace_report.tempo_applied, out.pace_report.target_wps], [1, false, null]);
});

test('heard words are counted as reference_rate.py counts them: punctuation alone is no word, a word ends at its last letter', () => {
  const align = (text, step = 0.1) => ({ characters: [...text], character_start_times_seconds: [...text].map((_, i) => i * step), character_end_times_seconds: [...text].map((_, i) => (i + 1) * step) });
  // reference_rate.py's own case: "Hi there, friend." is 3 words ending at the d (1.6 s), not the full stop.
  const hi = mod.heardRate(align('Hi there, friend.'));
  assert.equal(hi.words, 3);
  assert.ok(near(hi.span_s, 1.6, 1e-9));
  assert.equal(mod.heardRate(align('Wait — what?')).words, 2, 'a lone dash is not a word');
  assert.deepEqual(mod.heardRate(align('...')), { words: 0, span_s: 0 });
});

test('pace.target_wps speeds a read more than 10 % below the target, before lip-sync, and reports it', { skip: !ffmpeg && 'ffmpeg is not installed' }, async () => {
  // "aaaa bbbb cccc." is 3 heard words from 0 to 0.70 s: about 4.29 words a second as performed.
  const scenes = [{ id: 's1', line: 'aaaa bbbb cccc.' }];
  const plain = await mod.run({ scenes, voice_id: A }, makeCtx({ partDir: dir, line: sample.line }).ctx);
  const { ctx } = makeCtx({ partDir: dir, line: sample.line });
  const out = await mod.run({ scenes, voice_id: A, pace: { target_wps: 5 } }, ctx);
  // About 5 / 4.29 = 1.167 (the heard rate follows the fake alignment).
  const want = Math.ceil((5 / out.pace_report.measured_wps) * 1000) / 1000;
  assert.ok(out.tempo > 1 && out.tempo <= 1.25 && near(out.tempo, want, 0.01), `tempo ${out.tempo}, want about ${want}`);
  assert.ok(near(out.measured_words_per_second, plain.measured_words_per_second, 0.01), 'measured before the tempo');
  assert.ok(near(out.pace_report.delivered_wps, 5, 0.02), `delivered ${out.pace_report.delivered_wps}`);
  assert.ok(near(out.seconds, plain.seconds / out.tempo, 0.01));
  assert.ok(near(out.audio.duration_s, out.seconds, 0.06), 'the track itself is sped up');
  assert.ok(near(out.lines[0].measured_words_per_second * out.tempo, out.lines[0].words_per_second, 0.05));
  assert.equal(out.pace_report.tempo_applied, true);
  assert.equal(out.pace_report.tempo_applied_before_lipsync, true);
  assert.equal(out.pace_report.target_wps, 5);
  assert.match(out.pace_report.note, /more than 10 % below/);
  assert.equal(out.provenance.tempo_scope, 'new_narration_only');
});

test('pace.target_wps leaves a read within 10 % alone, caps the speed-up at 1.25x and says when it is still slow', { skip: !ffmpeg && 'ffmpeg is not installed' }, async () => {
  const scenes = [{ id: 's1', line: 'aaaa bbbb cccc.' }];
  const close = await mod.run({ scenes, voice_id: A, pace: { target_wps: 4.1 } }, makeCtx({ partDir: dir, line: sample.line }).ctx);
  assert.equal(close.tempo, 1, 'about 4 words a second is within 10 % of 4.1');
  assert.equal(close.pace_report.tempo_applied, false);
  // The test video: the reference spoke 3.20 words a second (270 words in 84.45 s), the narration 2.62.
  const far = await mod.run({ scenes, voice_id: A, pace: { target_wps: 6.5 } }, makeCtx({ partDir: dir, line: sample.line }).ctx);
  assert.equal(far.tempo, 1.25);
  assert.match(far.pace_report.note, /Still slow/);
  const capped = await mod.run({ scenes, voice_id: A, pace: { target_wps: 6.5, max_tempo: 1.1 } }, makeCtx({ partDir: dir, line: sample.line }).ctx);
  assert.equal(capped.tempo, 1.1, 'a lower max_tempo wins');
  assert.equal(mod.targetTempo({ target_wps: 3.2 }, 2.62), 1.222);
  assert.equal(mod.targetTempo({ target_wps: 4.09 }, 2.54), 1.25, 'capped at 1.25x');
  assert.equal(mod.targetTempo({ target_wps: 4 }, 3.7), 1, '3.7 is within 10 % of 4');
  assert.equal(mod.targetTempo({ target_wps: 4 }, 3.5), 1.143);
});

test('pace.target_wps with pace.tempo is refused before anything is ordered', async () => {
  const { ctx, orders } = makeCtx({ partDir: dir, line: sample.line });
  await assert.rejects(mod.run({ scenes: [{ id: 's1', line: 'Hi.' }], voice_id: A, pace: { target_wps: 4, tempo: 1.1 } }, ctx), (e) => e.code === 'bad_input' && /target_wps/.test(e.message));
  assert.equal(orders.length, 0);
});

test('a tagged read waiting for review is not paced: pace_report says it was not measured', { skip: !ffmpeg && 'ffmpeg is not installed' }, async () => {
  const { ctx } = makeCtx({ partDir: dir, line: sample.line });
  const out = await mod.run({ scenes: [{ id: 's1', line: '[warm] aaaa bbbb cccc.' }], voice_id: A, pace: { target_wps: 6 } }, ctx);
  assert.equal(out.timing_status, 'requires_reviewed_alignment');
  assert.equal(out.tempo, 1);
  assert.equal(out.pace_report.tempo_applied, false);
  assert.match(out.pace_report.note, /not measured/);
});

// 1.4.0: lead_s, silence before the first line with every timing moved later by it.

/** Where the stretch of silence at the very start of a track ends, measured on the file (0 when it opens on sound). */
async function leadingSilence(path) {
  const { stderr } = await run('ffmpeg', ['-hide_banner', '-nostdin', '-i', path, '-af', 'silencedetect=noise=-50dB:d=0.02', '-f', 'null', '-']);
  const start = /silence_start:\s*(-?[\d.]+)/.exec(stderr);
  const end = /silence_end:\s*([\d.]+)/.exec(stderr);
  if (!start || Math.abs(Number(start[1])) > 0.005 || !end) return 0;
  return Number(end[1]);
}

const leadReads = [
  [
    'line mode, each line keeps its own file',
    { scenes: [{ id: 's1', line: 'Meet Drinkag1 today.' }, { id: 's2', line: '' }, { id: 's3', line: 'It tastes great.' }], voice_id: A, join: 'line', pronunciations: [{ term: 'Drinkag1', say_as: 'drink A G one' }] },
  ],
  ['join: sentence, lines cut from a joined read', { scenes: [{ id: 's1', line: 'Do not' }, { id: 's2', line: 'buy this.' }, { id: 's3', line: 'Ever!' }], voice_id: A, join: 'sentence', gap_s: 0.2 }],
  ['join: one with pace.target_wps', { scenes: [{ id: 's1', line: 'aaaa bbbb' }, { id: 's2', line: 'cccc.' }], voice_id: A, join: 'one', pace: { target_wps: 5 } }],
];

for (const [what, inputs] of leadReads) {
  test(`lead_s 0 or absent gives byte for byte what 1.3.0 gave: ${what}`, { skip: !ffmpeg && 'ffmpeg is not installed' }, async () => {
    const old = makeCtx({ partDir: v130.dir, line: sample.line });
    const was = await v130.mod.run(inputs, old.ctx);
    for (const extra of [{}, { lead_s: 0 }]) {
      const now = makeCtx({ partDir: dir, line: sample.line });
      const out = await mod.run({ ...inputs, ...extra }, now.ctx);
      assert.deepEqual(now.orders.map((o) => [o.piece, o.path, o.body]), old.orders.map((o) => [o.piece, o.path, o.body]), 'the same requests');
      // canonicalJson reduces every file to its media and sha256, so this compares every audio file's bytes too.
      assert.equal(canonicalJson(out), canonicalJson(was), `outputs with ${JSON.stringify(extra)}`);
      assert.equal(out.audio.sha256, was.audio.sha256, 'the voice track is byte-identical');
      assert.equal(out.provenance.lead_s, undefined);
    }
  });

  test(`lead_s puts exactly that much silence first and moves every timing later by it: ${what}`, { skip: !ffmpeg && 'ffmpeg is not installed' }, async () => {
    const lead = 0.4;
    const before = makeCtx({ partDir: dir, line: sample.line });
    const plain = await mod.run(inputs, before.ctx);
    const now = makeCtx({ partDir: dir, line: sample.line });
    const out = await mod.run({ ...inputs, lead_s: lead }, now.ctx);
    // The same paid requests: the lead-in is made locally and never reaches the provider.
    assert.deepEqual(now.orders.map((o) => [o.piece, o.body]), before.orders.map((o) => [o.piece, o.body]));
    // The audio, measured on the file: it opens on lead_s of silence and runs lead_s longer.
    assert.equal(await leadingSilence(plain.audio.path), 0, 'without a lead the read starts at once');
    const heardLead = await leadingSilence(out.audio.path);
    assert.ok(near(heardLead, lead, 0.01), `the track opens on ${heardLead} s of silence, want ${lead}`);
    const [a, b] = [await probe(plain.audio.path), await probe(out.audio.path)];
    assert.ok(near(b.duration_s - a.duration_s, lead, 0.03), `the track runs ${b.duration_s - a.duration_s} s longer`);
    assert.ok(near(out.seconds, plain.seconds + lead, 0.0011), `seconds ${out.seconds} vs ${plain.seconds}`);
    // timeline.speech and every word move later by exactly lead_s.
    assert.equal(out.speech.length, plain.speech.length);
    out.speech.forEach((s, i) => {
      const p = plain.speech[i];
      assert.equal(s.text, p.text);
      assert.ok(near(s.start_s, p.start_s + lead, 0.0011) && near(s.end_s, p.end_s + lead, 0.0011), `speech ${i}`);
      assert.equal(s.words.length, p.words.length);
      s.words.forEach((w, k) => assert.ok(near(w.start_s, p.words[k].start_s + lead, 0.0011) && near(w.end_s, p.words[k].end_s + lead, 0.0011), `word ${i}.${k}`));
    });
    assert.ok(out.speech[0].words[0].start_s >= lead - 1e-9, 'no word starts inside the lead-in');
    // Scene spans move later too; the first still starts at 0, so the spans tile the whole track.
    assert.equal(out.scenes[0].start_s, 0);
    out.scenes.forEach((sc, i) => {
      if (i > 0) assert.ok(near(sc.start_s, plain.scenes[i].start_s + lead, 0.0011), `scene ${i} start`);
      assert.ok(near(sc.end_s, plain.scenes[i].end_s + lead, 0.0011), `scene ${i} end`);
      if (i > 0) assert.equal(sc.start_s, out.scenes[i - 1].end_s, 'scenes tile');
    });
    assert.equal(out.scenes.at(-1).end_s, out.seconds);
    // Each line file still holds just its line: the lead is only on the joined track.
    out.lines.forEach((l, i) => assert.equal(l.audio.sha256, plain.lines[i].audio.sha256, `line ${i} audio unchanged`));
    // Silence is not speech: the rates and tempo are unchanged.
    assert.equal(out.words_per_second, plain.words_per_second);
    assert.equal(out.measured_words_per_second, plain.measured_words_per_second);
    assert.equal(out.tempo, plain.tempo);
    assert.equal(out.provenance.lead_s, lead);
  });
}

test('lead_s outside 0 to 2 s is refused before anything is ordered', async () => {
  for (const lead_s of [-0.1, 2.5, '0.4']) {
    const { ctx, orders } = makeCtx({ partDir: dir, line: sample.line });
    await assert.rejects(mod.run({ scenes: [{ id: 's1', line: 'Hi.' }], voice_id: A, lead_s }, ctx), (e) => e.code === 'bad_input', String(lead_s));
    assert.equal(orders.length, 0);
  }
});

test('lead_s counts toward max_seconds, since the track runs that much longer', { skip: !ffmpeg && 'ffmpeg is not installed' }, async () => {
  // One 40-character line runs 2 s.
  const scenes = [{ id: 's1', line: 'x'.repeat(40) }];
  await mod.run({ scenes, voice_id: A, max_seconds: 2.2 }, makeCtx({ partDir: dir, line: sample.line }).ctx);
  await assert.rejects(mod.run({ scenes, voice_id: A, max_seconds: 2.2, lead_s: 0.4 }, makeCtx({ partDir: dir, line: sample.line }).ctx), (e) => e.code === 'bad_input' && /max_seconds/.test(e.message));
});

test('a tagged read waiting for review gets the same lead-in on its pending track', { skip: !ffmpeg && 'ffmpeg is not installed' }, async () => {
  const inputs = { scenes: [{ id: 's1', line: '[warm] First sentence here.' }, { id: 's2', line: 'And a second one.' }], voice_id: A };
  const plain = await mod.run(inputs, makeCtx({ partDir: dir, line: sample.line }).ctx);
  const out = await mod.run({ ...inputs, lead_s: 0.5 }, makeCtx({ partDir: dir, line: sample.line }).ctx);
  assert.equal(out.timing_status, 'requires_reviewed_alignment');
  assert.ok(near(out.seconds, plain.seconds + 0.5, 0.0011));
  assert.ok(near(await leadingSilence(out.audio.path), 0.5, 0.01));
  assert.equal(out.provenance.lead_s, 0.5);
});

// song-elevenlabs: matching the sung words to the lyric, and timing pictures to the singing.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { songCompositionPlan } from '../src/plan.mjs';
import { songAlignWords, songTimeline, SONG_HOOK_TOLERANCE_S } from '../src/snap.mjs';
import { musicDetailedAnswer } from './music-detailed-reply.mjs';
import { storybookInputs } from './storybook.mjs';

const near = (a, b, eps = 1e-6) => Math.abs(a - b) <= eps;

/** Fake word timings: each section's words spread evenly inside it, the first 100 ms after its start. */
function sungBySection(plan, { shiftSection = {} } = {}) {
  const words = [];
  for (const [k, s] of plan.sections.entries()) {
    if (!s.sent) continue;
    const count = s.sent[1] - s.sent[0] + 1;
    const step = Math.floor((s.duration_ms - 600) / count);
    for (let i = 0; i < count; i++) {
      const start = s.start_ms + 100 + i * step + (shiftSection[k] || 0);
      words.push({ word: plan.words.sent[s.sent[0] + i].text, start_ms: start, end_ms: start + step - 40 });
    }
  }
  return words;
}

test('the W0-62 reply fixture: ten sung words match the lyric, punctuation and case ignored', () => {
  const p = songCompositionPlan({
    scenes: [{ id: 's1', line: 'Pack it small' }, { id: 's2', line: 'take it all' }, { id: 's3', line: 'One jacket, every trip' }],
    sections: [{ name: 'Verse', seconds: 8, scenes: [1, 2] }, { name: 'Chorus', seconds: 8, scenes: [3, 3] }],
  });
  const a = songAlignWords(p.words, musicDetailedAnswer.json.words_timestamps);
  assert.equal(a.sent.length, 10);
  assert.deepEqual(a.mismatches, []);
  assert.deepEqual(a.written[7], { text: 'jacket,', scene_index: 2, start_s: 8.5, end_s: 9.1 });
  const tl = songTimeline({ scenes: [{ id: 's1', line: 'Pack it small' }, { id: 's2', line: 'take it all' }, { id: 's3', line: 'One jacket, every trip' }], plan: p, aligned: a, duration_s: 16 });
  assert.deepEqual(tl.scenes, [{ id: 's1', start_s: 0, end_s: 2.1 }, { id: 's2', start_s: 2.1, end_s: 8.2 }, { id: 's3', start_s: 8.2, end_s: 16 }]);
  assert.deepEqual(tl.speech[2], {
    scene_id: 's3', text: 'One jacket, every trip', start_s: 8.2, end_s: 10.6,
    words: [{ text: 'One', start_s: 8.2, end_s: 8.5 }, { text: 'jacket,', start_s: 8.5, end_s: 9.1 }, { text: 'every', start_s: 9.3, end_s: 9.7 }, { text: 'trip', start_s: 9.7, end_s: 10.6 }],
  });
});

test('fails the piece when the song has no word timings', () => {
  const p = songCompositionPlan(storybookInputs());
  for (const words of [[], null, undefined]) {
    assert.throws(() => songAlignWords(p.words, words), (e) => e.code === 'provider_failed' && /no word timings/.test(e.message));
  }
});

test('fails the piece when the sung word count differs from the lyric', () => {
  const p = songCompositionPlan(storybookInputs());
  const words = sungBySection(p);
  assert.throws(() => songAlignWords(p.words, words.slice(1)), (e) => e.code === 'provider_failed' && /50 sung words and the lyric has 51/.test(e.message));
});

test('reports, without failing, sung words that read differently from the lyric', () => {
  const p = songCompositionPlan(storybookInputs());
  const words = sungBySection(p);
  words[3] = { ...words[3], word: 'scream' };
  const a = songAlignWords(p.words, words);
  assert.deepEqual(a.mismatches, [{ index: 3, sung: 'scream', lyric: 'screen' }]);
});

test('storybook: sung scenes start on their first word, the intro holds to the singing, the ending scene runs to the end', () => {
  const inputs = storybookInputs();
  const p = songCompositionPlan(inputs);
  const a = songAlignWords(p.words, sungBySection(p));
  const tl = songTimeline({ scenes: inputs.scenes, plan: p, aligned: a, duration_s: 28.2 });
  assert.equal(tl.trim_s, 0);
  assert.equal(tl.pad_s, 0);
  assert.equal(tl.seconds, 28.2);
  assert.equal(tl.scenes.length, 14);
  assert.deepEqual(tl.scenes[0], { id: 's1', start_s: 0, end_s: 3.1 });
  for (let i = 1; i < 14; i++) {
    assert.equal(tl.scenes[i].start_s, tl.scenes[i - 1].end_s, 'back to back');
    const s = p.words.sung.find((x) => x.index === i);
    assert.equal(tl.scenes[i].start_s, a.sent[s.sent[0]].start_s, `scene ${i + 1} starts on its first sung word`);
  }
  assert.equal(tl.scenes[13].end_s, 28.2);
  assert.equal(tl.card_at_s, tl.scenes[13].start_s);
  assert.ok(near(tl.ending_seconds, 28.2 - tl.scenes[13].start_s), String(tl.ending_seconds));
  // Captions: the 12 sung scenes before the end card; the end card's words are sung but not captioned.
  assert.deepEqual(tl.speech.map((s) => s.scene_id), ['s2', 's3', 's4', 's5', 's6', 's7', 's8', 's9', 's10', 's11', 's12', 's13']);
  const loona = tl.speech.find((s) => s.scene_id === 's11');
  assert.equal(loona.text, 'Loona takes me there.');
  assert.equal(loona.spoken, 'Loo nah takes me there.');
  assert.equal(loona.words[0].text, 'Loona');
  const loo = p.words.written.findIndex((w) => w.text === 'Loona');
  const [first, second] = p.words.written[loo].sent;
  assert.equal(loona.words[0].start_s, a.sent[first].start_s);
  assert.equal(loona.words[0].end_s, a.sent[second].end_s, 'the written brand spans both sung syllables');
  assert.equal(tl.speech.find((s) => s.scene_id === 's2').spoken, undefined, 'spoken only when it differs');
  assert.equal(tl.words.length, 49);
  // The hook lands 0.1 s after the chorus starts at 15 s: inside the gate.
  assert.equal(tl.hook_s, 15.1);
  assert.deepEqual(tl.hook, { target_s: 15, off_s: 0.1, ok: true });
  assert.deepEqual(tl.warnings, []);
});

test('storybook: a hook sung off the chorus drop fails the gate', () => {
  const inputs = storybookInputs();
  const p = songCompositionPlan(inputs);
  const a = songAlignWords(p.words, sungBySection(p, { shiftSection: { 3: 400 } }));
  const tl = songTimeline({ scenes: inputs.scenes, plan: p, aligned: a, duration_s: 28 });
  assert.equal(tl.hook.ok, false);
  assert.ok(near(tl.hook.off_s, 0.5));
  assert.ok(tl.hook.off_s > SONG_HOOK_TOLERANCE_S);
});

// The stop-motion film's shape (MASTER-PLAN-v2 §5.23): groups of pictures on one camera, most of them silent.
const stopScenes = [
  { id: 'a0', line: null, extra: { group: 'counter' } },
  { id: 'a1', line: null, extra: { group: 'counter' } },
  { id: 'a2', line: 'I set the pot down on Sunday.', extra: { group: 'counter' } },
  { id: 'a3', line: null, extra: { group: 'counter' } },
  { id: 'a4', line: 'Onions go in first.', extra: { group: 'counter' } },
  { id: 'b0', line: null, extra: { group: 'hob' } },
  { id: 'b1', line: 'Then a splash of wine.', extra: { group: 'hob' } },
  { id: 'b2', line: null, extra: { group: 'hob' } },
  { id: 'b3', line: null, extra: { group: 'hob' } },
  { id: 'c0', line: null, extra: { group: 'table' } },
  { id: 'c1', line: 'We eat when it is dark.', extra: { group: 'table' } },
];
const stopWindows = { first_word_s: [0.7, 1.4], shot_lead_s: 0.45, snap_s: 0.3, min_hold_s: 0.3, card_after_s: 0.7 };
/** Sung words 330 ms apart, 300 ms long, 500 ms between sentences, from `startMs`. */
function sungSentences(plan, startMs) {
  const words = [];
  let at = startMs;
  plan.words.sent.forEach((w, i) => {
    words.push({ word: w.text, start_ms: at, end_ms: at + 300 });
    at += /[.!?]$/.test(w.text) ? 800 : 330;
    if (i === plan.words.sent.length - 1) at = 0;
  });
  return words;
}

test('stop motion: the intro is trimmed so singing starts at 1.4 s; pictures snap to words, plates lead their sentence, the card follows the last word', () => {
  const p = songCompositionPlan({ scenes: stopScenes, mood: 'warm acoustic folk', form: { intro_s: 3, outro_s: 3, groups: 3, ms_per_word: 330 } });
  const a = songAlignWords(p.words, sungSentences(p, 3200));
  const tl = songTimeline({ scenes: stopScenes, plan: p, aligned: a, duration_s: 15, windows: stopWindows });
  // A silent picture comes before the first sung one, so the first word lands at 1.4 s: 1.8 s of intro trimmed.
  assert.equal(tl.trim_s, 1.8);
  assert.equal(tl.pad_s, 0);
  assert.equal(tl.seconds, 13.2);
  assert.deepEqual(tl.scenes.map((s) => [s.id, s.start_s, s.end_s]), [
    ['a0', 0, 0.7],
    ['a1', 0.7, 1.4], // halfway to the first word
    ['a2', 1.4, 2.72], // on "I"
    ['a3', 2.72, 4.18], // spread to 2.79, snapped to "on" at 2.72
    ['a4', 4.18, 5.52], // on "Onions"
    ['b0', 5.52, 5.97], // the hob's plate, 0.45 s before "Then"
    ['b1', 5.97, 6.63], // on "Then"
    ['b2', 6.63, 6.96], // snapped to "of"
    ['b3', 6.96, 7.64], // snapped to "wine."
    ['c0', 7.64, 8.09], // the table's plate, 0.45 s before "We" (after "wine." ends at 7.59)
    ['c1', 8.09, 10.74], // on "We", to the card: the last word ends at 10.04, + 0.7 s
  ]);
  assert.equal(tl.card_at_s, 10.74);
  assert.equal(tl.ending_seconds, 2.46);
  assert.deepEqual(tl.speech.map((s) => [s.scene_id, s.start_s, s.end_s]), [['a2', 1.4, 3.68], ['a4', 4.18, 5.47], ['b1', 5.97, 7.59], ['c1', 8.09, 10.04]]);
  // 11 pictures in 10.74 s is under the recipe's 1.1 changes a second: a warning, not a failure.
  assert.deepEqual(tl.warnings, ['scene 11 holds 2.65 s: it reads as a freeze', '1.02 picture changes a second; under 1.1']);
});

test('stop motion: singing on the second picture lands the first word at 0.7 s, padding a voice that enters at once', () => {
  const scenes = [{ id: 'p', line: null }, { id: 'q', line: 'Here it is.' }, { id: 'r', line: null }];
  const p = songCompositionPlan({ scenes, form: { intro_s: 0, outro_s: 3, groups: 1 } });
  const a = songAlignWords(p.words, [{ word: 'Here', start_ms: 300, end_ms: 600 }, { word: 'it', start_ms: 630, end_ms: 900 }, { word: 'is.', start_ms: 930, end_ms: 1500 }]);
  const tl = songTimeline({ scenes, plan: p, aligned: a, duration_s: 5, windows: stopWindows });
  assert.equal(tl.pad_s, 0.4);
  assert.equal(tl.trim_s, 0);
  assert.equal(tl.seconds, 5.4);
  assert.equal(tl.scenes[1].start_s, 0.7);
  // The silent last picture goes halfway between "Here" and the card (1.9 + 0.7 = 2.6). No word starts
  // within 0.3 s of 1.65 ("is." at 1.33 is 0.32 away), so it cuts on the time itself.
  assert.deepEqual(tl.scenes.map((s) => [s.start_s, s.end_s]), [[0, 0.7], [0.7, 1.65], [1.65, 2.6]]);
});

test('stop motion: pictures crowded between two words share the time evenly and warn', () => {
  const scenes = [{ id: 'z', line: null }, { id: 'a', line: 'Go.' }, { id: 'b', line: null }, { id: 'c', line: null }, { id: 'd', line: 'Now.' }];
  const p = songCompositionPlan({ scenes, form: { intro_s: 0, outro_s: 0, groups: 1 } });
  const a = songAlignWords(p.words, [{ word: 'Go.', start_ms: 700, end_ms: 900 }, { word: 'Now.', start_ms: 1200, end_ms: 1500 }]);
  const tl = songTimeline({ scenes, plan: p, aligned: a, duration_s: 3, windows: { min_hold_s: 0.3 } });
  assert.deepEqual(tl.scenes.map((s) => [s.start_s, s.end_s]), [[0, 0.7], [0.7, 0.867], [0.867, 1.033], [1.033, 1.2], [1.2, 3]]);
  assert.ok(tl.warnings.some((w) => /scenes 3 to 4 have less than 0.3 s/.test(w)), JSON.stringify(tl.warnings));
});

test('a silent picture keeps min_hold_s: a word too soon or too late is not snapped to', () => {
  const scenes = [{ id: 'z', line: null }, { id: 'a', line: 'One two three four.' }, { id: 'b', line: null }, { id: 'c', line: 'Five.' }];
  const p = songCompositionPlan({ scenes, form: { intro_s: 0, outro_s: 0, groups: 1 } });
  // b goes halfway between "One" (1.0) and "Five." (2.2): 1.6. "two" (1.29) is within snap_s 0.4 but under
  // 0.3 s after "One"; "three" (1.92) is within it but under 0.3 s before "Five.". So b cuts at 1.6.
  const a = songAlignWords(p.words, [
    { word: 'One', start_ms: 1000, end_ms: 1100 }, { word: 'two', start_ms: 1290, end_ms: 1500 },
    { word: 'three', start_ms: 1920, end_ms: 2100 }, { word: 'four.', start_ms: 2120, end_ms: 2180 },
    { word: 'Five.', start_ms: 2200, end_ms: 2500 },
  ]);
  const tl = songTimeline({ scenes, plan: p, aligned: a, duration_s: 3, windows: { snap_s: 0.4, min_hold_s: 0.3 } });
  assert.deepEqual(tl.scenes.map((s) => [s.id, s.start_s, s.end_s]), [['z', 0, 1], ['a', 1, 1.6], ['b', 1.6, 2.2], ['c', 2.2, 3]]);
});

test('a free picture never snaps past the next plate', () => {
  const scenes = [
    { id: 'a', line: 'Sing one line here now.', extra: { group: 'x' } },
    { id: 'b1', line: null, extra: { group: 'x' } },
    { id: 'b2', line: null, extra: { group: 'x' } },
    { id: 'c', line: null, extra: { group: 'y' } },
    { id: 'd', line: 'Next.', extra: { group: 'y' } },
  ];
  const p = songCompositionPlan({ scenes, form: { intro_s: 0, outro_s: 0, groups: 1 } });
  // d sings at 4.0, so the plate c wants 3.55. b1 and b2 spread to 1.183 and 2.367 between 0 and 3.55.
  // b1 snaps to "one" (0.8). "line" (3.3) is within snap_s of b2 but under 0.3 s before the plate, so b2
  // stays on its time and the plate keeps its 0.45 s lead.
  const a = songAlignWords(p.words, [
    { word: 'Sing', start_ms: 500, end_ms: 700 }, { word: 'one', start_ms: 800, end_ms: 1000 },
    { word: 'line', start_ms: 3300, end_ms: 3400 }, { word: 'here', start_ms: 3420, end_ms: 3480 },
    { word: 'now.', start_ms: 3490, end_ms: 3500 }, { word: 'Next.', start_ms: 4000, end_ms: 4400 },
  ]);
  const tl = songTimeline({ scenes, plan: p, aligned: a, duration_s: 5, windows: { snap_s: 1, min_hold_s: 0.3, shot_lead_s: 0.45 } });
  assert.deepEqual(tl.scenes.map((s) => [s.id, s.start_s]), [['a', 0], ['b1', 0.8], ['b2', 2.367], ['c', 3.55], ['d', 4]]);
});

// song-elevenlabs: the pure planner (lyric, composition plan, refusals before any spend).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { songCompositionPlan, songStyles, SONG_MODEL } from '../src/plan.mjs';
import { songSplitLines, songWordPlan } from '../src/lyric.mjs';
import { musicDetailedRequest } from './music-detailed-reply.mjs';
import { storybookInputs } from './storybook.mjs';

test('sections: a composition plan in the music_v1 shape, lines split after each sentence', () => {
  const p = songCompositionPlan(storybookInputs());
  assert.equal(SONG_MODEL, 'music_v1');
  // Same keys, in the same order, as the W0-62 request fixture's composition plan.
  assert.deepEqual(Object.keys(p.composition_plan), Object.keys(musicDetailedRequest.composition_plan));
  assert.deepEqual(Object.keys(p.composition_plan.sections[0]), Object.keys(musicDetailedRequest.composition_plan.sections[0]));
  assert.deepEqual(p.composition_plan.positive_global_styles, ['dreamy synth lullaby', 'calm', 'soft breathy female lead', 'lead vocal up front', 'no artist names']);
  assert.deepEqual(p.composition_plan.negative_global_styles, ['metal', 'rap']);
  assert.deepEqual(p.composition_plan.sections.map((s) => [s.section_name, s.duration_ms]), [
    ['Intro', 3000], ['Verse', 7000], ['Pre-Chorus', 5000], ['Chorus', 8000], ['Outro', 5000],
  ]);
  assert.deepEqual(p.composition_plan.sections.map((s) => s.lines), [
    [],
    ['Another night, the screen is glowing bright.', 'I scroll and scroll.'],
    ['Endless feeds and the night just slows.', 'Then I close my eyes.'],
    ['Fall into the dream.', 'Paper moon above me.', 'Stars stitched in seams.', 'Loo nah takes me there.'],
    ['Every night I land somewhere soft.', 'Fall asleep with Loo nah.'],
  ]);
  assert.deepEqual(p.composition_plan.sections[0].positive_local_styles, ['instrumental', 'soft pads']);
  assert.deepEqual(p.composition_plan.sections[3].positive_local_styles, ['atmospheric drop', 'dreamy hook on the word fall']);
  assert.equal(p.total_ms, 28000);
  assert.deepEqual(p.sections.map((s) => s.start_ms), [0, 3000, 10000, 15000, 23000]);
  // The brand is sung as two words, so the lyric has 51 sung words for 49 written ones.
  assert.equal(p.lyric_words, 51);
  assert.equal(p.words.written.length, 49);
  assert.deepEqual(p.hook, { scene_index: 7, section: 3, target_ms: 15000 });
  assert.equal(p.ending_scenes, 1);
  assert.deepEqual(p.warnings, []);
});

test('form: an instrumental intro and outro around the sentences in three groups, timed by word count', () => {
  const scenes = [
    { id: 'a0', line: null, extra: { group: 'counter' } },
    { id: 'a1', extra: { group: 'counter' } },
    { id: 'a2', line: 'I set the pot down on Sunday.', extra: { group: 'counter' } },
    { id: 'a3', line: '   ', extra: { group: 'counter' } },
    { id: 'a4', line: 'Onions go in first.', extra: { group: 'counter' } },
    { id: 'b0', line: null, extra: { group: 'hob' } },
    { id: 'b1', line: 'Then a splash of wine.', extra: { group: 'hob' } },
    { id: 'c0', line: null, extra: { group: 'table' } },
    { id: 'c1', line: 'We eat when it is dark.', extra: { group: 'table' } },
  ];
  const p = songCompositionPlan({ scenes, mood: 'warm acoustic folk', form: { intro_s: 3, outro_s: 3, groups: 3, ms_per_word: 330 } });
  assert.deepEqual(p.composition_plan.sections.map((s) => [s.section_name, s.duration_ms, s.lines]), [
    ['Intro', 3000, []],
    ['Verse 1', 3000, ['I set the pot down on Sunday.']], // 7 x 330 + 500 = 2810, raised to min_section_s 3
    ['Verse 2', 3000, ['Onions go in first.']],
    ['Close', 4130, ['Then a splash of wine.', 'We eat when it is dark.']], // 11 x 330 + 500
    ['Outro', 3000, []],
  ]);
  assert.deepEqual(p.composition_plan.sections[0].negative_local_styles, ['vocals', 'singing', 'humming']);
  assert.equal(p.total_ms, 16130);
  assert.equal(p.lyric_words, 22);
  assert.deepEqual(p.sections.map((s) => s.sent), [null, [0, 6], [7, 10], [11, 21], null]);
  assert.equal(p.hook, null);
});

test('form: no intro or outro when their length is 0; one group is a single verse', () => {
  const p = songCompositionPlan({ scenes: [{ id: 'x', line: 'One line. Two lines.' }], form: { intro_s: 0, outro_s: 0, groups: 1 } });
  assert.deepEqual(p.composition_plan.sections.map((s) => [s.section_name, s.lines]), [['Verse', ['One line.', 'Two lines.']]]);
});

test('null, missing and blank lines are silent pictures: no words, no section lines', () => {
  const w = songWordPlan([{ id: 'a', line: null }, { id: 'b' }, { id: 'c', line: ' \n ' }, { id: 'd', line: ' Sing  it ' }], []);
  assert.deepEqual(w.sung.map((s) => [s.index, s.id, s.text]), [[3, 'd', 'Sing it']]);
  assert.equal(w.sent.length, 2);
});

test('pronunciations: the singer gets the say_as spelling, and every sung word maps back to the written word', () => {
  const w = songWordPlan([{ id: 'a', line: 'Meet Drinkag1 today.' }], [{ term: 'drinkag1', say_as: 'drink A G one' }]);
  assert.equal(w.sung[0].spoken, 'Meet drink A G one today.');
  assert.deepEqual(w.sent.map((s) => [s.text, s.written]), [['Meet', [0]], ['drink', [1]], ['A', [1]], ['G', [1]], ['one', [1]], ['today.', [2]]]);
  assert.deepEqual(w.written.map((x) => [x.text, x.sent]), [['Meet', [0]], ['Drinkag1', [1, 2, 3, 4]], ['today.', [5]]]);
});

test('a line over 200 characters is split at a comma, never losing a word', () => {
  const long = `${'word '.repeat(30).trim()}, ${'more '.repeat(20).trim()} end.`;
  const lines = songSplitLines(long);
  assert.ok(lines.length === 2 && lines.every((l) => l.length <= 200), JSON.stringify(lines));
  assert.equal(lines.join(' '), long);
  assert.ok(lines[0].endsWith(','));
});

test('styles: strings split at commas and semicolons, lists kept, repeats dropped, at most 50', () => {
  assert.deepEqual(songStyles('a, b; c', ['d, e', 'A'], null, '  '), ['a', 'b', 'c', 'd, e']);
  assert.equal(songStyles(Array.from({ length: 60 }, (_, i) => `s${i}`)).length, 50);
});

const refuses = (mutate, pattern) => () => {
  const inputs = storybookInputs();
  mutate(inputs);
  assert.throws(() => songCompositionPlan(inputs), (e) => e.code === 'bad_input' && e.song === true && pattern.test(e.message));
};

test('refuses a plan with nothing to sing', refuses((i) => { i.scenes = i.scenes.map((s) => ({ ...s, line: null })); }, /no scene has a line/));
test('refuses no scenes at all', refuses((i) => { i.scenes = []; }, /no scenes/));
test('refuses both sections and form', refuses((i) => { i.form = {}; }, /either sections or form/));
test('refuses neither sections nor form', refuses((i) => { delete i.sections; }, /either sections or form/));
test('refuses a sung scene no section sings', refuses((i) => { i.sections[4].scenes = [12, 13]; }, /scene 14 has a line to sing but no section/));
test('refuses sections that overlap', refuses((i) => { i.sections[2].scenes = [4, 7]; }, /already sings/));
test('refuses a section past the last scene', refuses((i) => { i.sections[4].scenes = [12, 15]; }, /plan has 14 scenes/));
test('refuses a section under 3 s', refuses((i) => { i.sections[0].seconds = 2; }, /3 to 120 s/));
test('refuses a section with no name', refuses((i) => { i.sections[1].name = ' '; }, /name of 1 to 100/));
test('refuses a hook scene that does not start with the hook', refuses((i) => { i.hook = 'Drift'; }, /must start with the hook "Drift"/));
test('refuses a hook with no hook scene', refuses((i) => { delete i.hook_scene; }, /hook needs hook_scene/));
test('refuses a silent hook scene', refuses((i) => { i.hook_scene = 1; }, /has no line/));
test('refuses a hook scene that does not open its section', refuses((i) => { i.hook = 'Paper'; i.hook_scene = 9; }, /must open a section/));
test('refuses ending_scenes that cover every scene', refuses((i) => { i.ending_scenes = 14; }, /ending_scenes/));
test('refuses a song longer than max_seconds', refuses((i) => { i.max_seconds = 25; }, /longer than max_seconds 25/));
test('refuses a section with more than 30 lines', refuses((i) => {
  i.scenes = [{ id: 'x', line: Array.from({ length: 31 }, (_, k) => `Line ${k}.`).join(' ') }];
  i.sections = [{ name: 'Verse', seconds: 60, scenes: [1, 1] }];
  delete i.hook; delete i.hook_scene; i.ending_scenes = 0;
}, /31 lines/));
test('refuses a form group longer than 120 s', () => {
  assert.throws(
    () => songCompositionPlan({ scenes: [{ id: 'x', line: 'la '.repeat(400).trim() + '.' }], form: { groups: 1 } }),
    (e) => e.code === 'bad_input' && /at most 120 s/.test(e.message),
  );
});

test('warns, without refusing, when a section packs its words too tightly', () => {
  const p = songCompositionPlan({ scenes: [{ id: 'x', line: 'one two three four five six seven eight nine ten eleven twelve thirteen.' }], sections: [{ name: 'Verse', seconds: 3, scenes: [1, 1] }] });
  assert.match(p.warnings[0], /will rush/);
});

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { KIT_CLIP_DEFAULT_MOTION, kitClipAllowed, kitClipEach, kitClipJobs, kitClipMayFallBack, kitClipSeconds, kitClipSlots, kitClipTemplate, kitClipWindow } from './scene-clips.mjs';
import { KitPromptGap } from './prompt.mjs';

const img = (id) => ({ kind: 'file', path: `/tmp/${id}.png`, sha256: id.padEnd(64, '0'), bytes: 1, media: 'image', mime: 'image/png' });
const jobs = (...ids) => ids.map((id) => ({ id }));

test('slots: a voiced scene runs to the next one; scenes with no span share the one before; leading ones join the first', () => {
  const slots = kitClipSlots(jobs('a', 'b', 'c', 'd', 'e'), [
    { id: 'b', start_s: 0.5, end_s: 2 },
    { id: 'd', start_s: 3, end_s: 5 },
  ]);
  // a + b + c share 0..3 (the first group starts at 0); d + e share 3..5.25 (end + tail).
  assert.deepEqual([...slots.entries()], [['a', 1], ['b', 1], ['c', 1], ['d', 1.125], ['e', 1.125]]);
});

test('slots: the last made scene runs to a later span it does not make (the end card scene)', () => {
  const slots = kitClipSlots(jobs('s1', 's2'), [
    { id: 's1', start_s: 0, end_s: 2 },
    { id: 's2', start_s: 2.4, end_s: 6 },
    { id: 'card', start_s: 7, end_s: 9 },
  ]);
  assert.deepEqual([...slots.values()], [2.4, 4.6]);
});

test('slots refuse spans named twice, spans that end before they start, and spans that name no scene', () => {
  assert.throws(() => kitClipSlots(jobs('a'), [{ id: 'a', start_s: 0, end_s: 1 }, { id: 'a', start_s: 1, end_s: 2 }]), /twice/);
  assert.throws(() => kitClipSlots(jobs('a'), [{ id: 'a', start_s: 2, end_s: 1 }]), /ends before it starts/);
  assert.throws(() => kitClipSlots(jobs('a'), [{ id: 'b', start_s: 0, end_s: 1 }]), /no picked scene has a span/);
});

test('seconds: ceil(need + 0.2) rounded up to an allowed length inside min_s..max_s', () => {
  const v3 = [3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15];
  assert.deepEqual(kitClipSeconds(1.3, v3), { seconds: 3, short: false });
  assert.deepEqual(kitClipSeconds(3.8, v3), { seconds: 4, short: false });
  assert.deepEqual(kitClipSeconds(3.81, v3), { seconds: 5, short: false });
  assert.deepEqual(kitClipSeconds(4.8, [5, 10]), { seconds: 5, short: false });
  assert.deepEqual(kitClipSeconds(4.81, [5, 10]), { seconds: 10, short: false });
  assert.deepEqual(kitClipSeconds(8.5, v3, { max_s: 5 }), { seconds: 5, short: true });
  assert.deepEqual(kitClipSeconds(1, v3, { min_s: 6 }), { seconds: 6, short: false });
  assert.deepEqual(kitClipSeconds(5, [5, 10], { exact: true }), { seconds: 5, short: false }, 'an asked length gets no margin');
  assert.deepEqual(kitClipSeconds(12, [5, 10], { exact: true }), { seconds: 10, short: true });
  assert.throws(() => kitClipAllowed([5, 10], { min_s: 6, max_s: 9 }), /no clip length between 6 and 9/);
  assert.throws(() => kitClipAllowed([5, 10], { min_s: 9, max_s: 6 }), /min_s 9 is over max_s 6/);
});

test('keep window: from the start or the end; the whole clip when it is short enough', () => {
  assert.deepEqual(kitClipWindow(5.04, { seconds: 2.3, anchor: 'end' }), { in_s: 5.04 - 2.3, seconds: 2.3 });
  assert.deepEqual(kitClipWindow(5, { seconds: 2.3, anchor: 'start' }), { in_s: 0, seconds: 2.3 });
  assert.deepEqual(kitClipWindow(2, { seconds: 2.3, anchor: 'end' }), { in_s: 0, seconds: 2 });
});

test('fallback: a refusal always, a failure or timeout only on the last attempt, never a stop or an over-quote', () => {
  const e = (code) => Object.assign(new Error(code), { code });
  assert.equal(kitClipMayFallBack(e('provider_rejected'), { last_attempt: false }), true);
  assert.equal(kitClipMayFallBack(e('provider_failed'), { last_attempt: false }), false);
  assert.equal(kitClipMayFallBack(e('provider_failed'), { last_attempt: true }), true);
  assert.equal(kitClipMayFallBack(e('timeout'), { last_attempt: true }), true);
  for (const code of ['stopped', 'over_quote', 'bad_input', 'output_invalid']) assert.equal(kitClipMayFallBack(e(code), { last_attempt: true }), false, code);
});

test('jobs: scenes mode picks scenes, finds each still by scene id and fills the motion text', () => {
  const tpl = kitClipTemplate({ version: 1, motion: '{picture}. Slow push-in' });
  const scenes = [
    { id: 's1', line: 'Hi.', picture: 'A jar' },
    { id: 's2', line: null, on_screen: null, picture: null },
    { id: 'end', line: 'Bye.', picture: null },
  ];
  assert.throws(() => kitClipJobs(tpl, { stills: [{ id: 's1', image: img('a') }, { id: 's2', image: img('b') }], scenes, skip_last: 1 }), /scene s2 needs \{picture\}/);
  const loose = kitClipTemplate(null);
  assert.equal(loose.motion, KIT_CLIP_DEFAULT_MOTION);
  const out = kitClipJobs(loose, { stills: [{ id: 's1', image: img('a') }, { id: 's2', image: img('b') }], scenes, skip_last: 1 });
  assert.deepEqual(out.map((j) => [j.id, j.index, j.still.sha256[0], j.prompt]), [
    ['s1', 0, 'a', 'A jar. Subtle, natural motion. Steady camera, no zoom, no morphing, no new objects, no text'],
    ['s2', 1, 'b', 'Subtle, natural motion. Steady camera, no zoom, no morphing, no new objects, no text'],
  ]);
  assert.throws(() => kitClipJobs(loose, { stills: [{ id: 's1', image: img('a') }], scenes }), /scene s2 has no still/);
});

test('jobs: images mode makes one clip per still, filling an anchor still as its cast member speaking', () => {
  const tpl = kitClipTemplate({ version: 1, templates: { hook: '{speaker.name}: {answers.reaction}' } });
  const out = kitClipJobs(tpl, { mode: 'images', stills: [{ id: 'a', image: img('a') }], cast: [{ key: 'a', name: 'Jess' }], answers: { reaction: 'gasps' }, use: 'hook' });
  assert.deepEqual(out.map((j) => [j.id, j.prompt]), [['a', 'Jess: gasps']]);
  assert.throws(() => kitClipJobs(tpl, { mode: 'images', stills: [{ id: 'a', image: img('a') }], cast: [{ key: 'a', name: 'Jess' }], use: 'hook' }), KitPromptGap);
});

test('each: keeps the order, runs a few at a time and starts nothing after a failure', async () => {
  let running = 0;
  let most = 0;
  const out = await kitClipEach([1, 2, 3, 4, 5, 6], async (n) => {
    running++;
    most = Math.max(most, running);
    await new Promise((r) => setTimeout(r, 5 * (7 - n)));
    running--;
    return n * 10;
  }, 3);
  assert.deepEqual(out, [10, 20, 30, 40, 50, 60]);
  assert.equal(most, 3);
  const started = [];
  await assert.rejects(kitClipEach([1, 2, 3, 4], async (n) => {
    started.push(n);
    if (n === 1) throw new Error('boom');
    await new Promise((r) => setTimeout(r, 20));
  }, 1), /boom/);
  assert.deepEqual(started, [1]);
});

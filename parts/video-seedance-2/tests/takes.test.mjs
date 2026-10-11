// video-seedance-2 1.2.0: the take and takes modes.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { hasFfmpeg, loadNewest, loadPart, makeCtx, probe } from '../../_tools/kit-harness.mjs';
import { sdTakeFaceOffScreen, sdTakeGroups, sdTakeWindows, sdTakeWords, SD_OFF_SCREEN_TAGS } from '../src/takes.mjs';
import { REF_FIELDS, falLine, heroInputs, photo, sample, streetInputs, ugcInputs, ugcScenes, writeTemplate, ugcTemplate } from './fixture.mjs';

const { dir, mod, manifest } = await loadNewest('video-seedance-2');
const ffmpeg = await hasFfmpeg();
const skip = !ffmpeg && 'ffmpeg is not installed';
const REF = 'bytedance/seedance-2.0/reference-to-video';
const work = () => mkdtempSync(join(tmpdir(), 'sd-take-'));
const ctxFor = (inputs, line = falLine) => makeCtx({ partDir: dir, line, seed: inputs.seed ?? null });
const refused = (e) => e.code === 'bad_input';

test('the newest version is 1.2.0 and declares the take outputs', () => {
  assert.equal(manifest.version, '1.2.0');
  assert.deepEqual(manifest.inputs.properties.mode.enum, ['reference', 'image_to_video', 'take', 'takes']);
  for (const key of ['takes', 'timeline', 'seconds']) assert.ok(manifest.outputs.properties[key], key);
  assert.deepEqual(manifest.outputs.required, ['clips', 'video'], 'the 1.1.0 outputs stay required, nothing new is');
});

test('beat windows: sized from the words, stretched to the take, edges on half seconds', () => {
  const w = sdTakeWindows([8, 0, 5, 5], 15, 2.5, 'take t1');
  assert.deepEqual(w.map((x) => [x.start, x.end]), [[0, 5.5], [5.5, 7.5], [7.5, 11.5], [11.5, 15]]);
  for (const x of sdTakeWindows([1, 1, 1, 1, 1, 1, 1, 1], 6, 4, 't')) assert.ok(x.end - x.start >= 0.5, 'every beat is at least half a second');
  assert.throws(() => sdTakeWindows([30], 12, 2.5, 'take t1'), /take t1's beats need 12\.5 s at 2\.5 words a second, more than its 12 s/);
  assert.equal(sdTakeWords('Okay, Glowpop  just arrived — and I love it.'), 8, 'a dash is not a word');
});

test('takes split by extra.take, or evenly in plan order', () => {
  const s = (id, take) => ({ scene: { id, extra: take == null ? null : { take } }, index: 0 });
  assert.deepEqual(sdTakeGroups([s('a'), s('b'), s('c'), s('d'), s('e')], 2).map((g) => g.map((p) => p.scene.id)), [['a', 'b', 'c'], ['d', 'e']]);
  assert.deepEqual(sdTakeGroups([s('a', 1), s('b', 2), s('c', 2)], 2).map((g) => g.map((p) => p.scene.id)), [['a'], ['b', 'c']]);
  assert.throws(() => sdTakeGroups([s('a', 1), s('b')], 2), /on every picked scene, or on none/);
  assert.throws(() => sdTakeGroups([s('a', 2), s('b', 1)], 2), /goes back to take 1/);
  assert.throws(() => sdTakeGroups([s('a', 1), s('b', 1)], 2), /take 2 has no scene/);
  assert.throws(() => sdTakeGroups([s('a')], 2), /2 takes need at least 2 scenes/);
});

test('face off screen: by tag or by the picture\'s words', () => {
  assert.equal(sdTakeFaceOffScreen({ picture: 'Rear camera: the can toward the lens' }, SD_OFF_SCREEN_TAGS), true);
  assert.equal(sdTakeFaceOffScreen({ picture: 'Macro: her hand on the grip' }, SD_OFF_SCREEN_TAGS), true);
  assert.equal(sdTakeFaceOffScreen({ picture: 'she turns the can, face out of frame' }, SD_OFF_SCREEN_TAGS), true);
  assert.equal(sdTakeFaceOffScreen({ picture: 'x', extra: { shot: 'hands' } }, SD_OFF_SCREEN_TAGS), true);
  assert.equal(sdTakeFaceOffScreen({ picture: 'Selfie: she holds the can beside her face' }, SD_OFF_SCREEN_TAGS), false);
  assert.equal(sdTakeFaceOffScreen({ picture: 'Close-up: her face and the can' }, SD_OFF_SCREEN_TAGS), false, 'a close-up may be a face');
});

test('fixture: ugc-product take mode orders one 15 s take with timed beats, dialogue and the creator then the product', { skip }, async () => {
  const w = work();
  const inputs = await ugcInputs(w);
  const { ctx, orders } = ctxFor(inputs);
  const out = await mod.run(inputs, ctx);
  assert.equal(orders.length, 1, 'one take is one paid piece');
  const { path, piece, body, results } = orders[0];
  assert.equal(path, REF);
  assert.equal(piece, 'take-t1');
  assert.equal(results[0].pointer, '/json/video/url');
  for (const key of Object.keys(body)) assert.ok(REF_FIELDS.includes(key) || key === 'seed', `${key} is a field of the recorded reference-to-video request`);
  assert.deepEqual(body.image_urls, [inputs.cast[0].image, inputs.products[0].images[0]], '@Image1 the creator, @Image2 the product');
  assert.equal(body.duration, 15);
  assert.equal(body.resolution, '720p');
  assert.equal(body.generate_audio, true);
  const p = body.prompt;
  assert.match(p, /^Vertical 9:16 selfie-style UGC review of Glowpop, shot on a phone in a sunny kitchen, warm tone\. Use @Image1 as the exact creator identity and @Image2 as the exact single Glowpop\. Beat 1 \(0-5\.5s\): Selfie: Maya holds the can beside her face\. Maya says: "Okay, Glow pop just arrived and I love it\."/);
  assert.match(p, /Beat 2 \(5\.5-7\.5s\): Rear camera, face off-screen: she turns the can toward the lens\. Beat 3 \(7\.5-11\.5s\)/, 'the silent beat (a null line) has no dialogue');
  assert.match(p, /Beat 4 \(11\.5-15s\): Selfie: the can held up beside her face\. Maya says: "Yeah, this is the one\."/);
  assert.match(p, /no morph\. Avoid: invented text, product redesign$/);
  assert.doesNotMatch(p, /Try Glowpop|[{}]/, 'the end card scene is skipped and no placeholder is left');
  assert.equal(out.takes.length, 1);
  assert.equal(out.video, out.takes[0].video, 'one take is the video as it came back');
  assert.deepEqual(out.clips, out.takes);
  assert.equal(out.timeline.speech.length, 0, 'speech is left to one transcription');
  assert.deepEqual(out.timeline.scenes.map((s) => s.id), ['s1', 's2', 's3', 's4']);
  assert.deepEqual(out.timeline.scenes.map((s) => [s.start_s, s.end_s]), [[0, 5.5], [5.5, 7.5], [7.5, 11.5], [11.5, 15]]);
  assert.equal(out.timeline.duration_s, 15);
  assert.equal(out.seconds, 15);
  assert.equal(out.timeline.width, 192);
});

test('take mode refuses before ordering: too many beats, too many words, a line on an off-screen beat, a banned phrase, a missing answer', { skip }, async () => {
  const w = work();
  const scenes = ugcScenes();
  const cases = [
    [{ skip_last: 0, scenes: scenes.map((s) => ({ ...s, picture: s.picture || 'the can on the counter' })) }, /take t1 has 5 scenes; a take holds at most 4 beats/],
    [{ max_words: 10 }, /take t1 has 18 spoken words, more than 10 for 15 s/],
    [{ seconds: 6, max_words: 40 }, /take t1's beats need 10\.2 s .* more than its 6 s/],
    [{ scenes: scenes.map((s) => (s.id === 's2' ? { ...s, line: 'Look at that colour.' } : s)) }, /scene s2 has a line, but its picture keeps the face off screen/],
    [{ scenes: scenes.map((s) => (s.id === 's3' ? { ...s, picture: 'she says it all in one continuous breath' } : s)) }, /scene s3 uses the banned phrase "one continuous breath"/],
    [{ answers: { setting: 'a kitchen' } }, /take t1 needs \{answers\.tone\}/],
    [{ cast: [], products: [{ id: 'glow', name: 'Glowpop', images: [] }] }, /take t1 has no reference image/],
    [{ clips: [{ id: 'a', prompt: 'x', seconds: 5 }] }, /clips are for modes reference and image_to_video/],
    [{ chain: { crop: 'bottom_45' } }, /chain works only in mode takes/],
    [{ takes: { count: 2 } }, /takes works only in mode takes/],
    [{ scenes: undefined }, /mode take needs scenes/],
  ];
  for (const [extra, why] of cases) {
    const inputs = await ugcInputs(w, extra);
    for (const k of Object.keys(inputs)) if (inputs[k] === undefined) delete inputs[k];
    const { ctx, orders } = ctxFor(inputs);
    await assert.rejects(mod.run(inputs, ctx), (e) => refused(e) && why.test(e.message), String(why));
    assert.equal(orders.length, 0, 'nothing is ordered, so nothing is billed');
  }
});

test('take inputs are refused in the clip modes', { skip }, async () => {
  const w = work();
  for (const [key, value] of [['takes', { count: 2 }], ['words_per_second', 2], ['off_screen_lines', 'voiceover'], ['pronunciations', []]]) {
    const inputs = { ...(await sample.inputs(w)), [key]: value };
    const { ctx, orders } = ctxFor(inputs, sample.line);
    await assert.rejects(mod.run(inputs, ctx), (e) => refused(e) && new RegExp(`${key} works only in mode`).test(e.message), key);
    assert.equal(orders.length, 0);
  }
});

test('off_screen_lines voiceover writes the off-screen line as voice-over; a template that places {line} gets no extra dialogue', { skip }, async () => {
  const w = work();
  const scenes = ugcScenes().map((s) => (s.id === 's2' ? { ...s, line: 'Look at that colour.' } : s));
  let inputs = await ugcInputs(w, { scenes, off_screen_lines: 'voiceover' });
  let run = ctxFor(inputs);
  await mod.run(inputs, run.ctx);
  assert.match(run.orders[0].body.prompt, /toward the lens\. Voice-over from Maya, lips not on screen: "Look at that colour\."/);

  const tpl = { ...ugcTemplate, scene: '{picture}, saying "{line?}"' };
  inputs = await ugcInputs(w, { template: await writeTemplate(w, tpl, 'line.prompt.json') });
  run = ctxFor(inputs);
  await mod.run(inputs, run.ctx);
  const p = run.orders[0].body.prompt;
  assert.match(p, /Beat 1 \(0-5\.5s\): Selfie: Maya holds the can beside her face, saying "Okay, Glow pop just arrived and I love it\."/);
  assert.doesNotMatch(p, /Maya says:/);
});

test('fixture: street-interview takes mode orders three chained takes in order and joins them into one video and timeline', { skip }, async () => {
  const w = work();
  const inputs = await streetInputs(w);
  const { ctx, orders } = ctxFor(inputs);
  const out = await mod.run(inputs, ctx);
  assert.deepEqual(orders.map((o) => o.piece), ['take-t1', 'take-t2', 'take-t3'], 'chained takes run in order');
  const can = inputs.products[0].images[0];
  assert.deepEqual(orders[0].body.image_urls, [can], 'take 1 has only the plan references');
  const still = orders[1].body.image_urls[1];
  assert.deepEqual(orders[1].body.image_urls, [can, still]);
  assert.deepEqual(orders[2].body.image_urls, [can, still], 'every later take gets the same still as @Image2');
  assert.equal(still.media, 'image');
  const info = await probe(still.path);
  assert.deepEqual([info.width, info.height], [192, 86], 'the bottom 45% of a 192x192 frame, even height');
  assert.match(orders[0].body.prompt, /^Raw vertical street-interview footage on one corner: a busy corner in Lower Manhattan\. Only the interviewer holds the microphone\. The interviewer hands the can over and asks the question once, off camera\. Beat 1 \(0-3s\): Same street corner\. Handover: a man in a grey coat takes the can\. The interviewer says: "What do you think this is\?" Beat 2 \(3-5s\)/);
  assert.match(orders[1].body.prompt, /ANSWERS ONLY: nobody asks the question again\. Same microphone as @Image2\. Beat 1 \(0-3s\): .*The woman says: "Is it a candle\?" Beat 2 \(3-5s\): Same street corner\. She shrugs and hands it back\. Close voices/);
  assert.match(orders[2].body.prompt, /ANSWERS ONLY.*The older man says: "Oh, it is sparkling water\."/);
  for (const o of orders) assert.equal(o.body.duration, 5);
  assert.deepEqual(out.takes.map((t) => [t.id, t.seconds]), [['t1', 5], ['t2', 5], ['t3', 5]]);
  assert.notEqual(out.video.path, out.takes[0].video.path, 'the takes are joined into a new video');
  const joined = await probe(out.video.path);
  assert.ok(Math.abs(joined.duration_s - 15) < 0.15, `joined length ${joined.duration_s}`);
  assert.equal(joined.has_audio, true, 'the native audio is kept');
  assert.deepEqual(out.timeline.scenes.map((s) => s.id), ['q', 'a1', 'a2', 'a3', 'a4']);
  const t = out.timeline.scenes;
  assert.ok(Math.abs(t[2].start_s - 5) < 0.1 && Math.abs(t[4].start_s - 10) < 0.1, 'each take\'s beats start at its place in the joined video');
  for (let i = 1; i < t.length; i++) assert.ok(t[i].start_s >= t[i - 1].end_s - 1e-6 && t[i].end_s > t[i].start_s, 'scenes are in order and never overlap');
  assert.equal(t.at(-1).end_s, out.timeline.duration_s);
  assert.deepEqual(out.timeline.speech, []);
  assert.equal(out.seconds, out.timeline.duration_s);
});

test('takes mode: evenly split without chain, a later key falls back to first, and the take refusals', { skip }, async () => {
  const w = work();
  const scenes = (await streetInputs(w)).scenes.map(({ extra, ...s }) => s);
  let inputs = await streetInputs(w, { scenes, takes: { count: 2 }, seconds: 8, chain: undefined, template: await writeTemplate(w, { version: 1, templates: { first: 'Street corner {answers.corner}.' }, refs: ['product'] }, 'one.prompt.json') });
  delete inputs.chain;
  const { ctx, orders } = ctxFor(inputs);
  const out = await mod.run(inputs, ctx);
  assert.equal(orders.length, 2);
  assert.deepEqual(orders[1].body.image_urls, [inputs.products[0].images[0]], 'no chain, no still');
  assert.match(orders[1].body.prompt, /^Street corner a busy corner in Lower Manhattan\. Beat 1/, 'with no later text, later takes use the first');
  assert.deepEqual(out.timeline.scenes.map((s) => s.id), ['q', 'a1', 'a2', 'a3', 'a4']);

  const cases = [
    [{ takes: { count: 3, first: 'opening' } }, /takes\.first names templates\.opening/],
    [{ takes: { count: 4 }, scenes: scenes.slice(0, 3).map((s) => ({ ...s, extra: null })) }, /4 takes need at least 4 scenes; 3 are picked/],
    [{ scenes: (await streetInputs(w)).scenes.map((s) => (s.id === 'a3' ? { ...s, extra: null } : s)) }, /set extra\.take on every picked scene, or on none/],
    [{ off_screen_lines: 'refuse' }, /off_screen_lines works only in mode take/],
  ];
  for (const [extra, why] of cases) {
    inputs = await streetInputs(w, extra);
    const run = ctxFor(inputs);
    await assert.rejects(mod.run(inputs, run.ctx), (e) => refused(e) && why.test(e.message), String(why));
    assert.equal(run.orders.length, 0);
  }
});

test('a take that comes back without its native audio fails', { skip }, async () => {
  const w = work();
  const inputs = await ugcInputs(w);
  const { ctx } = ctxFor(inputs, (o, c) => falLine({ ...o, body: { ...o.body, generate_audio: false } }, c));
  await assert.rejects(mod.run(inputs, ctx), (e) => e.code === 'provider_failed' && /take-t1 came back without its native audio/.test(e.message));
});

test('the same take inputs order the same piece; a new seed re-rolls it', { skip }, async () => {
  const w = work();
  const seen = [];
  for (const seed of [1, 1, 2]) {
    const inputs = await ugcInputs(w, { seed });
    const { ctx, orders } = ctxFor(inputs);
    await mod.run(inputs, ctx);
    seen.push(orders[0].body);
  }
  assert.equal(seen[0].prompt, seen[1].prompt);
  assert.equal(seen[0].seed, seen[1].seed);
  assert.notEqual(seen[0].seed, seen[2].seed);
});

test('1.1.0 inputs order the same pieces with the same bodies in 1.2.0', { skip }, async () => {
  const w = work();
  const maya = await photo(w, 'maya.png');
  const scenesInputs = {
    template: await writeTemplate(w, { version: 1, motion: '{picture}. {line?}', refs: ['anchor'] }, 'm.prompt.json'),
    cast: [{ key: 'a', name: 'Maya', image: maya }],
    scenes: [{ id: 's1', line: 'Hi.', picture: 'Maya waves', speaker: 'a' }],
    seconds: 5,
  };
  let runs = 0;
  for (const make of [() => heroInputs(w), async () => structuredClone(scenesInputs)]) {
    const seen = [];
    for (const version of ['1.1.0', '1.2.0']) {
      const part = await loadPart('video-seedance-2', version);
      const inputs = await make();
      const { ctx, orders } = makeCtx({ partDir: part.dir, line: falLine, seed: inputs.seed ?? null, workDir: join(w, `${version}-${++runs}`) });
      await part.mod.run(inputs, ctx);
      seen.push(JSON.stringify(orders.map((o) => ({ piece: o.piece, path: o.path, body: o.body }))));
    }
    assert.equal(seen[0], seen[1]);
  }
});

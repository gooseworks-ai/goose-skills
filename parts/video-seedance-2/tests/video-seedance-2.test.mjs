import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadNewest, hasFfmpeg, loadPart, makeCtx } from '../../_tools/kit-harness.mjs';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { I2V_DURATIONS, I2V_FIELDS, falAnswer, falLine, heroInputs, heroTemplate, photo, sample, writeTemplate } from './fixture.mjs';

const { dir, mod } = await loadNewest('video-seedance-2');
const ffmpeg = await hasFfmpeg();

test("sends the atom's payload with an integer duration and the references as files", { skip: !ffmpeg && 'ffmpeg is not installed' }, async () => {
  const { ctx, orders } = makeCtx({ partDir: dir, line: sample.line });
  const out = await mod.run(await sample.inputs(ctx.workDir), ctx);
  assert.equal(orders.length, 1);
  const { path, body } = orders[0];
  assert.equal(path, 'bytedance/seedance-2.0/reference-to-video');
  assert.deepEqual(Object.keys(body).sort(), ['aspect_ratio', 'duration', 'generate_audio', 'image_urls', 'prompt', 'resolution', 'seed']);
  assert.equal(body.duration, 5);
  assert.ok(Number.isInteger(body.duration), 'a string duration is refused by the model');
  assert.equal(body.image_urls[0].kind, 'file');
  assert.equal(body.generate_audio, true);
  assert.equal(out.clips[0].id, 'hook');
});

test('a clip that should have native audio and comes back silent fails', { skip: !ffmpeg && 'ffmpeg is not installed' }, async () => {
  const { ctx } = makeCtx({ partDir: dir, line: (o, c) => sample.line({ ...o, body: { ...o.body, generate_audio: false } }, c) });
  await assert.rejects(mod.run(await sample.inputs(ctx.workDir), ctx), (e) => e.code === 'provider_failed');
});

// ---- 1.1.0 ----

const skip = !ffmpeg && 'ffmpeg is not installed';
const I2V = 'bytedance/seedance-2.0/image-to-video';
const work = () => mkdtempSync(join(tmpdir(), 'sd-'));
// The kit binds the step's seed input into ctx.seed; the harness takes it as `seed`.
const ctxFor = (inputs, line = falLine, extra = {}) => makeCtx({ partDir: dir, line, seed: inputs.seed ?? null, ...extra });
const refused = (e) => e.code === 'bad_input';

test('a 1.0.1 clip list orders the same pieces with the same bodies in 1.0.1 and 1.1.0', { skip }, async () => {
  const w = work();
  const inputs = await sample.inputs(w);
  // Braces in a 1.0.1 prompt are text, not placeholders: with no fill input they go as written.
  inputs.clips[0].prompt += ' A {camera} shot.';
  const seen = [];
  for (const version of ['1.0.1', '1.1.0']) {
    const part = await loadPart('video-seedance-2', version);
    const { ctx, orders } = makeCtx({ partDir: part.dir, line: sample.line, workDir: join(w, version) });
    const out = await part.mod.run(structuredClone(inputs), ctx);
    seen.push(JSON.stringify(orders.map((o) => ({ piece: o.piece, path: o.path, body: o.body }))));
    assert.equal(out.clips[0].id, 'hook', version);
  }
  assert.equal(seen[0], seen[1], 'same pieces, so a saved 1.0.1 clip is reused, never billed again');
});

test('fixture: product-hypermotion runs one image-to-video clip from the product photo and fills the template', { skip }, async () => {
  const w = work();
  const inputs = await heroInputs(w);
  const { ctx, orders } = ctxFor(inputs);
  const out = await mod.run(inputs, ctx);
  assert.equal(orders.length, 1);
  const { path, piece, body } = orders[0];
  assert.equal(path, I2V);
  assert.equal(piece, 'clip-hero');
  for (const key of Object.keys(body)) assert.ok(I2V_FIELDS.includes(key) || key === 'seed', `${key} is a field of the recorded image-to-video request`);
  assert.deepEqual(body.image_url, inputs.products[0].images[0], 'the start frame is the real product photo, as a file');
  assert.deepEqual(body.end_image_url, body.image_url, 'end_image "start" lands back on the product');
  assert.ok(I2V_DURATIONS.includes(body.duration), 'duration is one of fal\'s string values');
  assert.equal(body.duration, '15');
  assert.equal(body.resolution, '1080p');
  assert.equal(body.aspect_ratio, '1:1');
  assert.equal(body.generate_audio, false);
  assert.ok(Number.isInteger(body.seed));
  assert.match(body.prompt, /^STYLE ANCHOR: hypermotion product film\. SUBJECT: Morning Mist Green Tea in a misty bamboo forest, explosive energy, golden backlight\./);
  assert.match(body.prompt, /slow-motion tea leaves in the air/);
  assert.match(body.prompt, /no text overlays, no hands\. Avoid: morphing label, extra products$/);
  assert.doesNotMatch(body.prompt, /[{}]/);
  assert.deepEqual(out.clips.map((c) => [c.id, c.seconds]), [['hero', 15]]);
  assert.equal(out.video, out.clips[0].video, 'the top-level video is the first clip');
  assert.equal(falAnswer.json.video.url.startsWith('https://'), true, 'the recorded answer has the video at /json/video/url');
});

test('refuses before ordering: a missing answer, an unknown placeholder, a prompt over 12,000 characters', { skip }, async () => {
  const w = work();
  const cases = [
    [await heroInputs(w, { answers: { energy: 'calm', environment: 'a kitchen', lighting: 'soft' } }), /clip hero needs \{answers\.physics\}/],
    [await heroInputs(w, { template: undefined, clips: [{ id: 'hero', seconds: 5, start_image: 'product', prompt: '{product.name} spins, {Answers.energy}' }] }), /unknown placeholder \{Answers\.energy\}/],
    [await heroInputs(w, { clips: [{ id: 'hero', seconds: 5, start_image: 'product', prompt: `${'slow orbit, '.repeat(990)}{answers.environment}` }] }), /over 12000/],
  ];
  for (const [inputs, why] of cases) {
    if (inputs.template === undefined) delete inputs.template;
    const { ctx, orders } = ctxFor(inputs);
    await assert.rejects(mod.run(inputs, ctx), (e) => refused(e) && why.test(e.message));
    assert.equal(orders.length, 0, 'nothing is ordered, so nothing is billed');
  }
});

test('refuses the wrong frame inputs for each mode, a product start with no photo, and scene-only keys with clips', { skip }, async () => {
  const w = work();
  const ref = await photo(w, 'person.png');
  const cases = [
    [{ mode: 'image_to_video', clips: [{ id: 'a', prompt: 'x', seconds: 5, references: [ref] }] }, /references are for mode reference/],
    [{ mode: 'image_to_video', clips: [{ id: 'a', prompt: 'x', seconds: 5 }] }, /clip a needs a start_image/],
    [{ mode: 'image_to_video', products: [{ id: 'p', name: 'Jar', images: [] }], clips: [{ id: 'a', prompt: 'x', seconds: 5, start_image: 'product' }] }, /no product has a photo/],
    [{ clips: [{ id: 'a', prompt: 'x', seconds: 5, references: [ref], start_image: ref }] }, /need mode image_to_video/],
    [{ clips: [{ id: 'a', prompt: 'x', seconds: 5, references: [ref], end_image: 'start' }] }, /need mode image_to_video/],
    [{ clips: [{ id: 'a', prompt: 'x', seconds: 5 }] }, /clip a has no reference image/],
    [{ clips: [{ id: 'a', seconds: 5, references: [ref] }] }, /clip a needs a prompt/],
    [{ clips: [{ id: 'a', prompt: 'x', seconds: 5, references: [ref] }], skip_last: 1 }, /skip_last works only without clips/],
    [{ resolution: '720p' }, /give clips, or scenes/],
  ];
  for (const [inputs, why] of cases) {
    const { ctx, orders } = ctxFor(inputs);
    await assert.rejects(mod.run(inputs, ctx), (e) => refused(e) && why.test(e.message), String(why));
    assert.equal(orders.length, 0);
  }
});

test('seed: the same seed orders the same piece; a new seed re-rolls it', { skip }, async () => {
  const w = work();
  const bodies = [];
  for (const seed of [1, 1, 2]) {
    const inputs = await heroInputs(w, { seed });
    const { ctx, orders } = ctxFor(inputs);
    await mod.run(inputs, ctx);
    bodies.push(orders[0].body.seed);
  }
  assert.equal(bodies[0], bodies[1]);
  assert.notEqual(bodies[0], bodies[2]);
});

test('scenes mode: one clip per picked scene, keyed by scene id, references from the plan; a null line is fine', { skip }, async () => {
  const w = work();
  const maya = await photo(w, 'maya.png');
  const jar = await photo(w, 'jar.png');
  const inputs = {
    template: await writeTemplate(w, { version: 1, motion: '{picture}. {line?}', suffix: 'handheld selfie, 9:16', refs: ['anchor', 'product'] }),
    cast: [{ key: 'a', name: 'Maya', look: 'curly hair', image: maya }],
    products: [{ id: 'jar', name: 'Garden Jar', images: [jar] }],
    scenes: [
      { id: 's1', line: 'This jar changed my mornings.', on_screen: null, picture: 'Maya holds the Garden Jar to camera', speaker: 'a' },
      { id: 's2', line: null, on_screen: null, picture: 'Close on the Garden Jar label, Maya turns it slowly' },
      { id: 'end', line: null, on_screen: 'Try it', picture: null },
    ],
    skip_last: 1,
    seconds: 6,
    resolution: '720p',
    generate_audio: true,
  };
  const { ctx, orders } = ctxFor(inputs, sample.line);
  const out = await mod.run(inputs, ctx);
  assert.deepEqual(orders.map((o) => o.piece), ['clip-s1', 'clip-s2']);
  assert.equal(orders[0].path, 'bytedance/seedance-2.0/reference-to-video');
  assert.deepEqual(orders[0].body.image_urls, [maya, jar], 'the speaker first, then the named product photo');
  assert.deepEqual(orders[1].body.image_urls, [maya, jar], 'Maya is named in the picture');
  assert.equal(orders[0].body.prompt, 'Maya holds the Garden Jar to camera. This jar changed my mornings. handheld selfie, 9:16');
  assert.equal(orders[1].body.prompt, 'Close on the Garden Jar label, Maya turns it slowly. handheld selfie, 9:16', 'the null line leaves nothing behind');
  assert.equal(orders[0].body.duration, 6);
  assert.deepEqual(out.clips.map((c) => c.id), ['s1', 's2']);
  assert.equal(out.video, out.clips[0].video);
});

test('a hand-built clip with no prompt takes templates.<id>, and a clip named after a scene fills {picture}', { skip }, async () => {
  const w = work();
  const tpl = { ...heroTemplate, templates: { ...heroTemplate.templates, payoff: '{picture}, {product.name} hero' } };
  const inputs = await heroInputs(w, {
    template: await writeTemplate(w, tpl, 'payoff.prompt.json'),
    scenes: [{ id: 'payoff', line: null, picture: 'the pouch lands on moss' }],
    clips: [{ id: 'payoff', seconds: 4, start_image: 'product' }],
  });
  const { ctx, orders } = ctxFor(inputs);
  await mod.run(inputs, ctx);
  assert.match(orders[0].body.prompt, /STYLE ANCHOR: hypermotion product film\. the pouch lands on moss, Morning Mist Green Tea hero\./);
  assert.equal(orders[0].body.end_image_url, undefined, 'no end frame unless asked');
});

test('start_image product: the product the scene names, even when the template refs leave products out', { skip }, async () => {
  const w = work();
  const tea = await photo(w, 'tea.png');
  const jar = await photo(w, 'jar2.png');
  const inputs = {
    mode: 'image_to_video',
    template: await writeTemplate(w, { version: 1, motion: '{picture}, slow orbit', refs: ['scene_image'] }, 'named.prompt.json'),
    products: [{ id: 'tea', name: 'Morning Mist Green Tea', images: [tea] }, { id: 'jar', name: 'Garden Jar', images: [jar] }],
    scenes: [{ id: 'jar-shot', picture: 'The Garden Jar spins on a marble plinth' }],
    clips: [{ id: 'jar-shot', seconds: 5, start_image: 'product' }],
    generate_audio: false,
  };
  const { ctx, orders } = ctxFor(inputs);
  await mod.run(inputs, ctx);
  assert.deepEqual(orders[0].body.image_url, jar, 'the named product, not the first one');
});

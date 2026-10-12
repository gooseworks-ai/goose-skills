import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileRef, hasFfmpeg, loadNewest, makeCtx, probe, run } from '../../_tools/kit-harness.mjs';
import { kitSchemaErrors } from '../../_lib/schema.mjs';
import { h3SceneProviderPrompt } from '../src/provider.mjs';
import { h3SceneTakeDuration, h3SceneTakeGroups, h3SceneTakeWindows } from '../src/takes.mjs';
import { nativeLine, photo, sample, streetInputs, template, ugcInputs } from './fixture.mjs';

const { dir, manifest, mod } = await loadNewest('video-h3max');
const ffmpeg = await hasFfmpeg();
const skip = !ffmpeg && 'ffmpeg is not installed';
const work = () => mkdtempSync(join(tmpdir(), 'h3-scene-'));
const ctxFor = (inputs, line = nativeLine()) => makeCtx({ partDir: dir, line, seed: inputs.seed ?? null });
const refused = (e) => e.code === 'bad_input';
const schema = JSON.parse(readFileSync(new URL('./h3max-input.schema.json', import.meta.url), 'utf8'));

function transport(body) {
  return JSON.parse(JSON.stringify(body, (_, v) => v && v.kind === 'file' ? `https://fixture.invalid/${v.sha256}` : v));
}

function providerContract(body) {
  assert.deepEqual(Object.keys(body).filter((key) => !(key in schema.properties)), [], 'only H3 fields are sent');
  assert.deepEqual(kitSchemaErrors(schema, transport(body), 'fal body'), [], 'body fits the recorded official schema');
  assert.equal(typeof body.duration, 'number');
  assert.equal(body.prompt_expansion_mode, 'disabled', 'approved dialogue is not expanded');
  assert.equal('generate_audio' in body, false, 'H3 does not accept this field');
  assert.equal('image_urls' in body, false, 'Seedance reference field is not sent');
}

test('new part declares only H3 Max and preserves the scene recipe output contract', () => {
  assert.equal(manifest.id, 'video-h3max');
  assert.equal(manifest.version, '1.0.0');
  assert.deepEqual(manifest.needs.models, [{ provider: 'fal', model: 'minimax/h3-max/reference-to-video' }]);
  assert.deepEqual(manifest.inputs.properties.mode.enum, ['reference', 'image_to_video', 'take', 'takes']);
  assert.deepEqual(manifest.inputs.properties.resolution.enum, ['480P', '768P', '1080P']);
  for (const key of ['clips', 'video', 'takes', 'seconds', 'timeline']) assert.ok(manifest.outputs.properties[key], key);
});

test('provider prompt translates only image tokens, checks their files, and rejects unsupported modalities', () => {
  assert.equal(h3SceneProviderPrompt('Use @Image1 and @Image2. Contact foo@Image1.com. A {camera} angle.', 2, 'clip a'), 'Use Image 1 and Image 2. Contact foo@Image1.com. A {camera} angle.');
  for (const text of ['Use @Image0.', 'Use @Image3.', 'Use Image 3.']) assert.throws(() => h3SceneProviderPrompt(text, 2, 'clip a'), /clip a names Image/);
  for (const text of ['Use @ImageX.', 'Use @Image1-x.', 'Use @Image.']) assert.throws(() => h3SceneProviderPrompt(text, 2, 'clip a'), /unknown image reference/);
  for (const text of ['Use @Video1.', 'Use Audio 1.']) assert.throws(() => h3SceneProviderPrompt(text, 2, 'clip a'), /accepts image references only/);
});

test('reference clip keeps native audio and sends numeric duration with H3 references', { skip }, async () => {
  const w = work();
  const inputs = await sample.inputs(w);
  inputs.clips[0].prompt = 'Use @Image1. A {camera} shot. She says "It fits my morning."';
  const { ctx, orders } = ctxFor(inputs);
  const out = await mod.run(inputs, ctx);
  assert.equal(orders.length, 1);
  const { body } = orders[0];
  providerContract(body);
  assert.deepEqual(body.reference_image_urls, inputs.clips[0].references);
  assert.equal(body.duration, 5);
  assert.equal(body.resolution, '768P');
  assert.equal(body.aspect_ratio, '9:16');
  assert.match(body.prompt, /^Use Image 1\. A \{camera\} shot/);
  assert.equal(out.clips[0].id, 'hook');
  assert.equal(out.video.path, join(ctx.workDir, 'clip-hook.mp4'));
  assert.equal((await probe(out.video.path)).has_audio, true);
});

test('start/end-frame clip fills its template and strips provider sound locally', { skip }, async () => {
  const w = work();
  const product = await photo(w, 'tea.png');
  const inputs = {
    mode: 'image_to_video',
    template: await template(w, { version: 1, templates: { hero: 'Image 1 is {product.name}. Orbit in {answers.place}.' }, suffix: 'No spoken words, no text.' }),
    products: [{ id: 'tea', name: 'Morning Mist', images: [product] }],
    answers: { place: 'a bamboo forest' },
    clips: [{ id: 'hero', seconds: 15, start_image: 'product', end_image: 'start' }],
    generate_audio: false,
    resolution: '1080P',
    aspect_ratio: '1:1',
  };
  const { ctx, orders } = ctxFor(inputs);
  const out = await mod.run(inputs, ctx);
  const body = orders[0].body;
  providerContract(body);
  assert.deepEqual([body.image_url.width, body.image_url.height], [1080, 1080]);
  assert.deepEqual(body.end_image_url, body.image_url);
  assert.deepEqual(body.reference_image_urls, [body.image_url], 'the fitted first frame is also reference Image 1');
  assert.equal(body.duration, 15);
  assert.match(body.prompt, /^Image 1 is Morning Mist\. Orbit in a bamboo forest/);
  assert.equal((await probe(join(ctx.workDir, 'clip-hero.mp4'))).has_audio, true, 'fixture really returned sound');
  assert.equal((await probe(out.video.path)).has_audio, false, 'part removed it');
  assert.equal(out.video.path.endsWith('clip-hero-silent.mp4'), true);
});

test('per-clip sound option overrides the top-level option', { skip }, async () => {
  const w = work();
  const image = await photo(w);
  const inputs = { generate_audio: false, clips: [{ id: 'keep', prompt: 'Image 1 waves.', references: [image], seconds: 4, generate_audio: true }, { id: 'drop', prompt: 'Image 1 waves.', references: [image], seconds: 4 }] };
  const { ctx, orders } = ctxFor(inputs);
  const out = await mod.run(inputs, ctx);
  orders.forEach((o) => providerContract(o.body));
  assert.equal((await probe(out.clips[0].video.path)).has_audio, true);
  assert.equal((await probe(out.clips[1].video.path)).has_audio, false);
});

test('a wide product photo is contained in the requested square canvas without losing its edges', { skip }, async () => {
  const w = work();
  const path = join(w, 'wide-product.png');
  await run('ffmpeg', ['-hide_banner', '-nostdin', '-y', '-f', 'lavfi', '-i', 'color=c=red:size=640x160:duration=1', '-vf', 'drawbox=x=0:y=0:w=20:h=ih:color=white:t=fill,drawbox=x=620:y=0:w=20:h=ih:color=white:t=fill', '-frames:v', '1', path]);
  const original = await fileRef(path, 'image');
  const inputs = { mode: 'image_to_video', clips: [{ id: 'hero', prompt: 'Image 1 turns gently, with the exact product label.', start_image: original, end_image: 'start', seconds: 4 }], resolution: '768P', aspect_ratio: '1:1', generate_audio: false };
  const { ctx, orders } = ctxFor(inputs);
  await mod.run(inputs, ctx);
  const start = orders[0].body.image_url;
  assert.deepEqual([start.width, start.height], [768, 768]);
  assert.deepEqual(orders[0].body.end_image_url, start, 'start/end share one fitted asset and hash');
  assert.notEqual(start.sha256, original.sha256);
  const { stdoutBuffer } = await run('ffmpeg', ['-hide_banner', '-nostdin', '-i', start.path, '-frames:v', '1', '-pix_fmt', 'rgb24', '-f', 'rawvideo', '-']);
  const pixel = (x, y) => [...stdoutBuffer.subarray((y * 768 + x) * 3, (y * 768 + x) * 3 + 3)];
  assert.ok(pixel(384, 10).every((v) => v < 10), 'top padding is black');
  assert.ok(pixel(10, 384).every((v) => v > 240), 'left product marker remains visible');
  assert.ok(pixel(757, 384).every((v) => v > 240), 'right product marker remains visible');
  const centre = pixel(384, 384);
  assert.ok(centre[0] > 230 && centre[1] < 25 && centre[2] < 25, 'product interior remains intact');

  // Fitting is deterministic for the same input; no hidden timestamp or random asset name affects the hash.
  const second = ctxFor(inputs);
  await mod.run(inputs, second.ctx);
  assert.equal(second.orders[0].body.image_url.sha256, start.sha256);
});

test('adaptive frames keep the original start canvas and fit a different last frame to it', { skip }, async () => {
  const w = work();
  const start = await photo(w, 'start.png');
  const path = join(w, 'end.png');
  await run('ffmpeg', ['-hide_banner', '-nostdin', '-y', '-f', 'lavfi', '-i', 'color=c=blue:size=320x160:duration=1', '-frames:v', '1', path]);
  const end = await fileRef(path, 'image');
  const inputs = { mode: 'image_to_video', aspect_ratio: 'adaptive', clips: [{ prompt: 'Image 1 moves.', start_image: start, end_image: end, seconds: 4 }] };
  const { ctx, orders } = ctxFor(inputs);
  await mod.run(inputs, ctx);
  assert.deepEqual(orders[0].body.image_url, start);
  assert.deepEqual([orders[0].body.end_image_url.width, orders[0].body.end_image_url.height], [160, 160]);
});

test('wide reference photos are padded into H3 limits and a wide chain crop stays valid', { skip }, async () => {
  const w = work();
  const path = join(w, 'wide-reference.png');
  await run('ffmpeg', ['-hide_banner', '-nostdin', '-y', '-f', 'lavfi', '-i', 'color=c=red:size=640x160:duration=1', '-frames:v', '1', path]);
  const image = await fileRef(path, 'image');
  const inputs = { clips: [{ prompt: 'Image 1 stays true to the product.', references: [image], seconds: 4 }] };
  const { ctx, orders } = ctxFor(inputs);
  await mod.run(inputs, ctx);
  const fitted = orders[0].body.reference_image_urls[0];
  assert.deepEqual([fitted.width, fitted.height], [640, 256], 'reference padding preserves the original width and full photo');
  assert.ok(fitted.width / fitted.height <= 2.5);

  const street = await streetInputs(w, { aspect_ratio: '21:9', products: [{ id: 'can', name: 'the can', images: [image] }] });
  const chained = ctxFor(street, nativeLine({ size: '336x144' }));
  await mod.run(street, chained.ctx);
  const still = chained.orders[1].body.reference_image_urls[1];
  assert.ok(still.width / still.height <= 2.5 && still.width / still.height >= 0.4, 'cropped chain still is also a supported reference shape');
  assert.equal(still.width, 336, 'the crop is padded, never cropped again');
  const productRef = chained.orders[0].body.reference_image_urls[0];
  assert.notEqual(still.path, productRef.path, 'chain fitting cannot overwrite a prepared product reference');
  assert.equal((await fileRef(productRef.path, 'image')).sha256, productRef.sha256);
});

test('scene clips keep the template reference order and per-tag override', { skip }, async () => {
  const w = work();
  const creator = await photo(w, 'maya.png');
  const product = await photo(w, 'can.png');
  const inputs = {
    template: await template(w, { version: 1, motion: '{picture}.', refs: ['product', 'anchor'], by_tag: { selfie: { refs: ['anchor', 'product'] } } }),
    scenes: [{ id: 'wide', picture: 'Maya holds Glowpop', speaker: 'maya' }, { id: 'selfie', picture: 'Selfie: Maya holds Glowpop', speaker: 'maya' }],
    cast: [{ key: 'maya', name: 'Maya', image: creator }],
    products: [{ id: 'glow', name: 'Glowpop', images: [product] }],
    seconds: 4,
  };
  const { ctx, orders } = ctxFor(inputs);
  const out = await mod.run(inputs, ctx);
  assert.deepEqual(out.clips.map((c) => c.id), ['wide', 'selfie']);
  assert.deepEqual(orders[0].body.reference_image_urls, [product, creator]);
  assert.deepEqual(orders[1].body.reference_image_urls, [creator, product]);
});

test('all clip prompts and references are checked before the first order', { skip }, async () => {
  const w = work();
  const image = await photo(w);
  const cases = [
    [{ clips: [{ id: 'a', prompt: 'Image 1 waves.', references: [image], seconds: 4 }, { id: 'b', prompt: '@Image2 waves.', references: [image], seconds: 4 }] }, /clip b names Image 2/],
    [{ template: await template(w, { version: 1, motion: '{answers.missing} {picture}', refs: ['anchor'] }), cast: [{ key: 'maya', name: 'Maya', image }], scenes: [{ id: 'a', picture: 'Maya waves', speaker: 'maya' }] }, /needs \{answers.missing\}/],
    [{ mode: 'reference', clips: [{ prompt: '{Answers.typo}', references: [image], seconds: 4 }] }, /unknown placeholder/],
    [{ clips: [{ prompt: 'x'.repeat(12001), references: [image], seconds: 4 }] }, /longer than 12000|over 12000/],
    [{ clips: [{ prompt: 'Wave.', references: Array(10).fill(image), seconds: 4 }] }, /more than 9/],
    [{ mode: 'image_to_video', clips: [{ prompt: 'Wave.', references: [image], seconds: 4 }] }, /references are for mode reference/],
    [{ mode: 'reference', clips: [{ prompt: 'Wave.', start_image: image, seconds: 4 }] }, /need mode image_to_video/],
    [{ mode: 'reference', clips: [{ prompt: 'Wave.', references: [image], seconds: 4 }], pick: 'first' }, /works only without clips/],
    [{ clips: [{ prompt: 'Wave.', references: [image], seconds: 4 }], resolution: '720p' }, /must be one of/],
    [{ mode: 'talk', scenes: [{ id: 'a' }] }, /must be one of/],
    [{ reference_video_urls: [image] }, /not allowed|unknown|additional/],
  ];
  for (const [inputs, why] of cases) {
    const { ctx, orders } = ctxFor(inputs);
    await assert.rejects(mod.run(inputs, ctx), (e) => refused(e) && why.test(e.message), String(why));
    assert.equal(orders.length, 0);
  }
});

test('an explicit product reference cannot vanish while cast references remain', { skip }, async () => {
  const w = work();
  const maya = await photo(w, 'maya.png');
  const first = await photo(w, 'first.png');
  const second = await photo(w, 'second.png');
  const products = [{ id: 'first', name: 'Morning Mist', images: [first] }, { id: 'second', name: 'Evening Tea', images: [second] }];
  const base = {
    template: await template(w, { version: 1, motion: '{picture}', scene: '{picture}', refs: ['anchor', 'product'] }),
    cast: [{ key: 'maya', name: 'Maya', image: maya }],
    products,
    scenes: [{ id: 'a', picture: 'Maya holds the product', speaker: 'maya' }],
    seconds: 5,
  };
  for (const mode of ['reference', 'take']) {
    const inputs = { ...base, mode };
    const { ctx, orders } = ctxFor(inputs);
    await assert.rejects(mod.run(inputs, ctx), (e) => refused(e) && /requests a product reference, but no matching product has a photo/.test(e.message));
    assert.equal(orders.length, 0);
  }
  const inputs = { ...base, scenes: [{ id: 'a', picture: 'Maya holds Evening Tea', speaker: 'maya' }] };
  const { ctx, orders } = ctxFor(inputs);
  await mod.run(inputs, ctx);
  assert.deepEqual(orders[0].body.reference_image_urls, [maya, second], 'naming the real product resolves it for free');

  const explicit = { template: base.template, cast: base.cast, products, scenes: base.scenes, clips: [{ id: 'a', prompt: 'Maya holds the product in Image 2.', references: [maya, second], seconds: 5 }] };
  const fixed = ctxFor(explicit);
  await mod.run(explicit, fixed.ctx);
  assert.deepEqual(fixed.orders[0].body.reference_image_urls, [maya, second], 'explicit references override inferred plan references');
});

test('one take preserves pronunciations and timed scene beats, retimed to the provider overrun', { skip }, async () => {
  const w = work();
  const inputs = await ugcInputs(w);
  const { ctx, orders } = ctxFor(inputs, nativeLine({ overrun: 0.5 }));
  const out = await mod.run(inputs, ctx);
  assert.equal(orders.length, 1);
  providerContract(orders[0].body);
  assert.deepEqual(orders[0].body.reference_image_urls, [inputs.cast[0].image, inputs.products[0].images[0]]);
  assert.match(orders[0].body.prompt, /Use Image 1 as Maya and Image 2 as the exact product/);
  assert.match(orders[0].body.prompt, /Maya says: "Okay, Glow pop just arrived and I love it\."/);
  assert.doesNotMatch(orders[0].body.prompt, /Try Glowpop|@Image/);
  assert.deepEqual(out.timeline.scenes.map((s) => s.id), ['s1', 's2', 's3', 's4']);
  assert.ok(Math.abs(out.seconds - 15.5) < 0.1);
  assert.equal(out.timeline.scenes.at(-1).end_s, out.seconds);
  assert.ok(out.timeline.scenes[0].end_s > 6, 'estimated beat windows scale with the real clip length');
  assert.deepEqual(out.timeline.speech, []);
  assert.deepEqual(out.clips, out.takes);
  assert.equal((await probe(out.video.path)).has_audio, true);
});

test('two speakers remain in one native take without the single-creator constraint', { skip }, async () => {
  const w = work();
  const maya = await photo(w, 'maya.png');
  const tom = await photo(w, 'tom.png');
  const inputs = {
    mode: 'take',
    template: await template(w, { version: 1, prefix: 'A two-person scene: Image 1 is Maya and Image 2 is Tom. Keep their voices distinct.', scene: '{picture}', refs: ['anchor'] }),
    cast: [{ key: 'maya', name: 'Maya', image: maya }, { key: 'tom', name: 'Tom', image: tom }],
    scenes: [{ id: 'q', speaker: 'maya', picture: 'Maya faces Tom', line: 'Did you see this?' }, { id: 'a', speaker: 'tom', picture: 'Tom turns to Maya', line: 'Yes, it looks good.' }],
    seconds: 5,
  };
  const { ctx, orders } = ctxFor(inputs);
  const out = await mod.run(inputs, ctx);
  assert.deepEqual(orders[0].body.reference_image_urls, [maya, tom]);
  assert.match(orders[0].body.prompt, /Maya says: "Did you see this\?"/);
  assert.match(orders[0].body.prompt, /Tom says: "Yes, it looks good\."/);
  assert.doesNotMatch(orders[0].body.prompt, /no second voice|one voice/);
  assert.equal((await probe(out.video.path)).has_audio, true);
});

test('street takes chain a cropped still, ask once, keep both voices, and join a measured timeline', { skip }, async () => {
  const w = work();
  const inputs = await streetInputs(w);
  const { ctx, orders } = ctxFor(inputs, nativeLine({ overrun: 0.5 }));
  const out = await mod.run(inputs, ctx);
  assert.deepEqual(orders.map((o) => o.piece), ['take-t1', 'take-t2', 'take-t3']);
  orders.forEach((o) => providerContract(o.body));
  const product = inputs.products[0].images[0];
  const still = orders[1].body.reference_image_urls[1];
  assert.deepEqual(orders[0].body.reference_image_urls, [product]);
  assert.deepEqual(orders[1].body.reference_image_urls, [product, still]);
  assert.deepEqual(orders[2].body.reference_image_urls, [product, still]);
  const info = await probe(still.path);
  assert.deepEqual([info.width, info.height], [192, 86]);
  assert.match(orders[0].body.prompt, /The interviewer says: "What do you think this is\?"/);
  assert.match(orders[0].body.prompt, /The man says: "Some kind of paint\?"/);
  assert.match(orders[1].body.prompt, /ANSWERS ONLY.*Same microphone as Image 2/);
  assert.doesNotMatch(orders[1].body.prompt, /What do you think this is/);
  assert.ok(Math.abs(out.seconds - 16.5) < 0.15);
  assert.deepEqual(out.timeline.scenes.map((s) => s.id), ['q', 'a1', 'a2', 'a3', 'a4']);
  assert.ok(Math.abs(out.timeline.scenes[2].start_s - 5.5) < 0.1);
  assert.ok(Math.abs(out.timeline.scenes[4].start_s - 11) < 0.1);
  assert.equal(out.timeline.scenes.at(-1).end_s, out.seconds);
  assert.equal((await probe(out.video.path)).has_audio, true);
});

test('silent takes drop every returned audio track and keep the joined scene timeline', { skip }, async () => {
  const w = work();
  const inputs = await streetInputs(w, { generate_audio: false });
  const { ctx } = ctxFor(inputs);
  const out = await mod.run(inputs, ctx);
  for (const t of out.takes) assert.equal((await probe(t.video.path)).has_audio, false);
  assert.equal((await probe(out.video.path)).has_audio, false);
  assert.equal(out.timeline.scenes.at(-1).end_s, out.seconds);
});

test('all take gaps, mode mismatches, reference errors, and word limits refuse for free', { skip }, async () => {
  const w = work();
  const normal = await ugcInputs(w);
  const street = await streetInputs(w);
  const cases = [
    [{ ...normal, max_words: 10 }, /more than 10/],
    [{ ...normal, skip_last: 0, scenes: normal.scenes.map((s) => ({ ...s, picture: s.picture || 'The can on a counter' })) }, /at most 4 beats/],
    [{ ...normal, scenes: normal.scenes.map((s) => s.id === 's2' ? { ...s, line: 'Look at the colour.' } : s) }, /face off screen/],
    [{ ...normal, chain: { crop: 'bottom_45' } }, /chain works only in mode takes/],
    [{ ...normal, takes: { count: 2 } }, /takes works only in mode takes/],
    [{ ...normal, cast: [], products: normal.products.map((p) => ({ ...p, images: [] })) }, /requests a product reference|no reference image/],
    [{ ...street, takes: { count: 1 }, scenes: street.scenes.slice(0, 2) }, /chain needs at least two takes/],
    [{ ...street, template: await template(w, { version: 1, templates: { first: 'A street interview', later: 'Use @Image3.' }, refs: ['product'] }, 'bad-reference.prompt.json') }, /take t2 names Image 3/],
    [{ ...street, scenes: street.scenes.map((s) => s.id === 'a3' ? { ...s, extra: null } : s) }, /set extra.take on every/],
    [{ ...street, off_screen_lines: 'refuse' }, /works only in mode take/],
  ];
  for (const [inputs, why] of cases) {
    const { ctx, orders } = ctxFor(inputs);
    await assert.rejects(mod.run(inputs, ctx), (e) => refused(e) && why.test(e.message), String(why));
    assert.equal(orders.length, 0, 'no partial paid run before a later take error');
  }
});

test('native dialogue cannot silently accept a provider clip missing audio', { skip }, async () => {
  const w = work();
  for (const inputs of [await sample.inputs(w), await ugcInputs(w)]) {
    const { ctx, orders } = ctxFor(inputs, nativeLine({ audio: false }));
    await assert.rejects(mod.run(inputs, ctx), (e) => e.code === 'provider_failed' && /without its native audio/.test(e.message));
    assert.equal(orders.length, 1);
  }
});

test('a provider answer without a downloaded video fails explicitly', { skip }, async () => {
  const inputs = await sample.inputs(work());
  const { ctx } = ctxFor(inputs, async () => ({ files: {} }));
  await assert.rejects(mod.run(inputs, ctx), (e) => e.code === 'provider_failed' && /no video/.test(e.message));
});

test('seed binding is stable for the same inputs and changes only with a new seed', { skip }, async () => {
  const w = work();
  const base = await sample.inputs(w);
  const bodies = [];
  for (const seed of [1, 1, 2]) {
    const inputs = { ...base, seed };
    const { ctx, orders } = ctxFor(inputs);
    await mod.run(inputs, ctx);
    bodies.push(orders[0].body);
  }
  assert.deepEqual(bodies[0], bodies[1]);
  assert.notEqual(bodies[0].seed, bodies[2].seed);
  assert.equal(bodies[0].prompt, bodies[2].prompt);
});

test('beat windows and take groups retain authored planning limits', () => {
  assert.deepEqual(h3SceneTakeWindows([8, 0, 5, 5], 15, 2.5, 'take t1').map((w) => [w.start, w.end]), [[0, 5.5], [5.5, 7.5], [7.5, 11.5], [11.5, 15]]);
  assert.throws(() => h3SceneTakeWindows([30], 12, 2.5, 'take t1'), /more than its 12 s/);
  for (const seconds of [4, 10, 15]) assert.equal(h3SceneTakeDuration(seconds), seconds);
  for (const seconds of [3, 4.5, 16, '5', null]) assert.throws(() => h3SceneTakeDuration(seconds), /whole seconds from 4 to 15/);
  const picked = ['a', 'b', 'c'].map((id, index) => ({ scene: { id }, index }));
  assert.deepEqual(h3SceneTakeGroups(picked, 2).map((g) => g.map((p) => p.scene.id)), [['a', 'b'], ['c']]);
});

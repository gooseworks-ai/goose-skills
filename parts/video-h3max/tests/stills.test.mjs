// Mode stills: a picture step's scene stills moved by H3 Max, timed to the voice
// (as video-veo-3's scenes mode). Local fixtures only; nothing is paid for.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileRef, hasFfmpeg, loadNewest, loadPart, makeCtx, run } from '../../_tools/kit-harness.mjs';
import { kitSchemaErrors } from '../../_lib/schema.mjs';
import { h3SceneStillCanvas } from '../src/frames.mjs';
import { nativeLine, template } from './fixture.mjs';

const { dir, manifest, mod } = await loadNewest('video-h3max');
const skip = !(await hasFfmpeg()) && 'ffmpeg is not installed';
const work = () => mkdtempSync(join(tmpdir(), 'h3-stills-'));
const byPiece = (orders) => Object.fromEntries(orders.map((o) => [o.piece, o]));
const schema = JSON.parse(readFileSync(new URL('./h3max-input.schema.json', import.meta.url), 'utf8'));
const failWith = (code) => {
  const e = new Error(code);
  e.code = code;
  return e;
};

function transport(body) {
  return JSON.parse(JSON.stringify(body, (_, v) => v && v.kind === 'file' ? `https://fixture.invalid/${v.sha256}` : v));
}

async function still(workDir, name, { size = '90x160', color = null } = {}) {
  const path = join(workDir, name);
  const source = color ? `color=c=${color}:size=${size}:duration=1` : `testsrc2=size=${size}:duration=1`;
  await run('ffmpeg', ['-hide_banner', '-nostdin', '-y', '-f', 'lavfi', '-i', source, '-frames:v', '1', '-c:v', 'png', path]);
  return fileRef(path, 'image');
}

/**
 * A creator-montage plan: s2 has no line (it shares s1's time), s5 is the end
 * card (skipped). Voice spans: s1 0-1.1, s3 1.3-2.4, s4 2.6-9.1, s5 9.4-11.0.
 */
async function stillsInputs(workDir, extra = {}) {
  const stills = [];
  for (const id of ['s1', 's2', 's3', 's4']) stills.push({ id, image: await still(workDir, `${id}.png`) });
  return {
    mode: 'stills',
    stills,
    template: await template(workDir, {
      version: 1,
      prefix: 'Vertical 9:16 UGC phone footage, natural daylight',
      motion: '{picture}. Handheld phone video at real-time speed. The person does not talk',
      by_tag: { Product: { motion: '{picture}. The {product.name} keeps its exact pack, colours and label' } },
      negative: 'talking, text, captions, watermark',
      banned: ['reveal'],
    }, 'motion.prompt.json'),
    products: [{ id: 'p1', name: 'Bioma Probiotic' }],
    scenes: [
      { id: 's1', line: 'Do not buy this.', picture: 'Look 1: MCU, she lifts the jar and squints at it' },
      { id: 's2', line: null, picture: 'Cutaway: a crowded supplement aisle' },
      { id: 's3', line: 'Unless you hate bloating.', picture: 'Product: Bioma Probiotic on a bathroom shelf' },
      { id: 's4', line: 'Three weeks in and I feel lighter every single morning.', picture: 'Look 2: MS, she laughs and spins toward the window' },
      { id: 's5', line: 'Link below.', on_screen: 'Link below', picture: null },
    ],
    spans: [
      { id: 's1', start_s: 0, end_s: 1.1 },
      { id: 's3', start_s: 1.3, end_s: 2.4 },
      { id: 's4', start_s: 2.6, end_s: 9.1 },
      { id: 's5', start_s: 9.4, end_s: 11.0 },
    ],
    skip_last: 1,
    resolution: '1080P',
    aspect_ratio: '9:16',
    generate_audio: false,
    seed: 4015,
    ...extra,
  };
}

test('mode stills (1.1.0) and broll (1.2.0) are inputs, and a clip may be a fallen-back still', () => {
  assert.equal(manifest.version, '1.3.0');
  assert.deepEqual(manifest.inputs.properties.mode.enum, ['reference', 'image_to_video', 'take', 'takes', 'stills']);
  for (const key of ['stills', 'spans', 'min_s', 'max_s', 'max_total_s', 'fallback', 'require_scene_tags', 'require_product_refs', 'product_reference_evidence', 'broll']) {
    assert.ok(manifest.inputs.properties[key], key);
  }
  assert.deepEqual(manifest.outputs.required, ['clips']);
  assert.deepEqual(manifest.outputs.properties.clips.items.required, ['id', 'seconds']);
  assert.ok(manifest.outputs.properties.clips.items.properties.image);
});

test('still canvases are an exact published aspect with even sides at every resolution', () => {
  const source = { width: 1088, height: 1920 };
  // 1.3.0: 768P by default in both tiers; 1080P only when asked for.
  assert.deepEqual(h3SceneStillCanvas({}, source), { width: 774, height: 1376 });
  assert.deepEqual(h3SceneStillCanvas({ quality_tier: 'best' }, source), { width: 774, height: 1376 });
  assert.deepEqual(h3SceneStillCanvas({ resolution: '1080P' }, source), { width: 1080, height: 1920 });
  assert.deepEqual(h3SceneStillCanvas({ resolution: '768P' }, source), { width: 774, height: 1376 });
  assert.deepEqual(h3SceneStillCanvas({ resolution: '480P' }, source), { width: 486, height: 864 });
  assert.deepEqual(h3SceneStillCanvas({ aspect_ratio: '16:9', resolution: '1080P' }, source), { width: 1920, height: 1080 });
  assert.deepEqual(h3SceneStillCanvas({ aspect_ratio: '1:1', resolution: '768P' }, source), { width: 768, height: 768 });
  assert.deepEqual(h3SceneStillCanvas({ aspect_ratio: 'adaptive' }, source), source);
  for (const resolution of ['480P', '768P', '1080P']) {
    const c = h3SceneStillCanvas({ resolution }, source);
    assert.equal(c.width * 16, c.height * 9, `${resolution} is exactly 9:16`);
    assert.equal(c.width % 2 + c.height % 2, 0, `${resolution} has even sides`);
  }
});

test('mode stills makes one clip per picked scene from its still, timed to the voice spans', { skip }, async () => {
  const w = work();
  const inputs = await stillsInputs(w);
  const { ctx, orders } = makeCtx({ partDir: dir, workDir: join(w, 'step'), line: nativeLine(), seed: inputs.seed });
  const out = await mod.run(inputs, ctx);
  const o = byPiece(orders);
  assert.deepEqual(Object.keys(o).sort(), ['clip-s1', 'clip-s2', 'clip-s3', 'clip-s4'], 'the end card scene s5 is skipped');
  for (const x of orders) {
    assert.equal(x.provider, 'fal');
    assert.equal(x.path, 'minimax/h3-max/reference-to-video');
    assert.deepEqual(Object.keys(x.body).sort(), ['aspect_ratio', 'duration', 'image_url', 'prompt', 'prompt_expansion_mode', 'reference_image_urls', 'resolution', 'seed']);
    assert.deepEqual(Object.keys(x.body).filter((key) => !(key in schema.properties)), [], 'only H3 fields are sent');
    assert.deepEqual(kitSchemaErrors(schema, transport(x.body), 'fal body'), [], 'body fits the recorded official schema');
    assert.equal(typeof x.body.duration, 'number');
    assert.equal(x.body.resolution, '1080P');
    assert.equal(x.body.prompt_expansion_mode, 'disabled');
    assert.equal('generate_audio' in x.body, false, 'H3 does not accept this field');
    assert.equal(x.body.image_url.kind, 'file', 'the still goes to the core as a file, never a link');
    assert.deepEqual([x.body.image_url.width, x.body.image_url.height], [1080, 1920], 'fitted to an exact 9:16 canvas');
    assert.deepEqual(x.body.reference_image_urls, [x.body.image_url], 'the first frame is the only reference');
    assert.deepEqual(x.results, [{ pointer: '/json/video/url', name: `${x.piece}.mp4`, media: 'video' }]);
  }
  // s1 + s2 (no line) share 0..1.3: 0.65 + 0.2 -> 1 -> 4 (H3's shortest). s3 1.3..2.6 -> 4. s4 2.6..9.4: 6.8 + 0.2 = 7 -> 7.
  assert.deepEqual(orders.map((x) => [x.piece, x.body.duration]).sort(), [['clip-s1', 4], ['clip-s2', 4], ['clip-s3', 4], ['clip-s4', 7]]);
  assert.equal(new Set(orders.map((x) => x.body.seed)).size, 4, 'each scene gets its own seed');
  assert.match(o['clip-s1'].body.prompt, /^Vertical 9:16 UGC phone footage, natural daylight\. .*she lifts the jar and squints at it\. Handheld phone video at real-time speed\. The person does not talk.*Avoid: talking, text, captions, watermark$/s);
  assert.match(o['clip-s3'].body.prompt, /The Bioma Probiotic keeps its exact pack, colours and label/);
  assert.deepEqual(out.clips.map((c) => c.id), ['s1', 's2', 's3', 's4']);
  assert.ok(out.clips.every((c) => c.video && !c.image));
  assert.ok(Math.abs(out.clips[3].seconds - 7) < 0.2, 'seconds is the measured length');
  for (const c of out.clips) assert.equal((await ctx.tools.probe(c.video.path)).has_audio, false, 'native sound is stripped for narration');
  assert.equal(out.video.sha256, out.clips[0].video.sha256, 'video is the first clip');
});

test('a still of another shape is cover-fitted: no black bars reach H3', { skip }, async () => {
  const w = work();
  const base = await stillsInputs(w);
  const red = await still(w, 'wide.png', { size: '1088x1920', color: 'red' });
  const inputs = { ...base, stills: base.stills.map((s) => ({ ...s, image: red })) };
  const { ctx, orders } = makeCtx({ partDir: dir, workDir: join(w, 'step'), line: nativeLine(), seed: inputs.seed });
  await mod.run(inputs, ctx);
  const frame = orders[0].body.image_url;
  assert.deepEqual([frame.width, frame.height], [1080, 1920]);
  assert.equal(new Set(orders.map((x) => x.body.image_url.sha256)).size, 1, 'one shared still is fitted once');
  const { stdoutBuffer } = await run('ffmpeg', ['-hide_banner', '-nostdin', '-i', frame.path, '-frames:v', '1', '-vf', 'scale=54:96', '-pix_fmt', 'rgb24', '-f', 'rawvideo', '-']);
  for (const [x, y] of [[27, 0], [27, 95], [0, 48], [53, 48]]) {
    const [r, g, b] = stdoutBuffer.subarray((y * 54 + x) * 3, (y * 54 + x) * 3 + 3);
    assert.ok(r > 200 && g < 60 && b < 60, `edge pixel ${x},${y} is the still, not a bar`);
  }
});

test('mode stills makes up to 40 clips, beyond the 12-clip cap of the other scene modes', { skip }, async () => {
  const w = work();
  const red = await still(w, 'red.png');
  const ids = Array.from({ length: 30 }, (_, i) => `s${i + 1}`);
  const inputs = {
    mode: 'stills',
    stills: ids.map((id) => ({ id, image: red })),
    scenes: ids.map((id) => ({ id, line: 'One short line.', picture: `Look 1: MCU, she turns ${id}` })),
    spans: ids.map((id, i) => ({ id, start_s: i * 1.2, end_s: i * 1.2 + 1 })),
    generate_audio: false,
    max_total_s: 128,
  };
  const { ctx, orders } = makeCtx({ partDir: dir, workDir: join(w, 'step'), line: nativeLine() });
  const out = await mod.run(inputs, ctx);
  assert.equal(orders.length, 30);
  assert.equal(out.clips.length, 30);
  assert.ok(orders.every((x) => x.body.duration === 4), 'short cuts are made at the 4 s minimum');
});

test('mode stills refusals: every problem is bad_input before any piece is ordered', { skip }, async () => {
  const w = work();
  const one = await still(w, 'x.png');
  const cases = [
    ['a template banned phrase', async () => {
      const i = await stillsInputs(w);
      i.scenes[0] = { ...i.scenes[0], picture: 'Look 1: the outfit reveal by the mirror' };
      return i;
    }, /scene s1 uses the banned phrase "reveal"/],
    ['a picked scene with no still', async () => ({ ...(await stillsInputs(w)), skip_last: 0 }), /scene s5 has no still/],
    ['no stills', async () => {
      const i = await stillsInputs(w);
      delete i.stills;
      return i;
    }, /mode stills needs stills/],
    ['no scenes', async () => ({ mode: 'stills', stills: [{ id: 'a', image: one }] }), /mode stills needs scenes/],
    ['a clip list', async () => ({ ...(await stillsInputs(w)), clips: [{ seconds: 4, prompt: 'x' }] }), /clips are for modes reference and image_to_video/],
    ['spans and seconds together', async () => ({ ...(await stillsInputs(w)), seconds: 4 }), /spans or seconds, not both/],
    ['min_s over max_s', async () => ({ ...(await stillsInputs(w)), min_s: 8, max_s: 5 }), /min_s 8 is over max_s 5/],
    ['spans that name no picked scene', async () => ({ ...(await stillsInputs(w)), spans: [{ id: 'zz', start_s: 0, end_s: 1 }] }), /no picked scene has a span/],
    ['clips longer together than max_total_s', async () => ({ ...(await stillsInputs(w)), max_total_s: 16 }), /the 4 clips come to 19 s, over max_total_s 16/],
    ['an unknown placeholder', async () => ({ ...(await stillsInputs(w)), template: await template(w, { version: 1, motion: '{picture}. {Answers.energy}' }, 'typo.prompt.json') }), /unknown placeholder \{Answers\.energy\}/],
    ['a prompt naming a second image', async () => ({ ...(await stillsInputs(w)), template: await template(w, { version: 1, motion: '{picture}. Keep @Image2 exact' }, 'img2.prompt.json') }), /names Image 2, but has 1 reference image/],
    ['stills-only input in another mode', async () => ({ mode: 'image_to_video', clips: [{ seconds: 4, prompt: 'x', start_image: one }], fallback: 'still' }), /fallback works only in mode stills/],
    ['take-only input in mode stills', async () => ({ ...(await stillsInputs(w)), off_screen_lines: 'voiceover' }), /off_screen_lines works only in mode take/],
    ['a clip length under 4 s', async () => ({ ...(await stillsInputs(w)), min_s: 3 }), /min_s/],
  ];
  for (const [what, make, message] of cases) {
    const { ctx, orders } = makeCtx({ partDir: dir, line: () => assert.fail(`${what}: nothing may be ordered`) });
    await assert.rejects(mod.run(await make(), ctx), (e) => e.code === 'bad_input' && message.test(e.message), what);
    assert.equal(orders.length, 0, what);
  }
});

test('mode stills fallback: a refused clip becomes its still; a plain failure only on the last attempt', { skip }, async () => {
  const w = work();
  const inputs = await stillsInputs(w, { fallback: 'still' });
  const line = nativeLine();
  const refuseS2 = (order, ctx) => (order.piece === 'clip-s2' ? Promise.reject(failWith('provider_rejected')) : line(order, ctx));
  const one = makeCtx({ partDir: dir, workDir: join(w, 'a'), line: refuseS2 });
  const out = await mod.run(inputs, one.ctx);
  assert.deepEqual(out.clips.map((c) => [c.id, Boolean(c.video), Boolean(c.image)]), [['s1', true, false], ['s2', false, true], ['s3', true, false], ['s4', true, false]]);
  assert.equal(out.clips[1].image.sha256, inputs.stills[1].image.sha256, 'the original still, not the fitted frame');
  assert.equal(out.clips[1].seconds, 4);
  assert.ok(one.logs.some(([level, m]) => level === 'warn' && /clip-s2 became its still: provider_rejected/.test(m)));

  const failS1 = (order, ctx) => (order.piece === 'clip-s1' ? Promise.reject(failWith('provider_failed')) : line(order, ctx));
  const first = makeCtx({ partDir: dir, workDir: join(w, 'b'), line: failS1, attempt: 1 });
  await assert.rejects(mod.run(inputs, first.ctx), (e) => e.code === 'provider_failed', 'attempt 1 fails so the core retries');
  const last = makeCtx({ partDir: dir, workDir: join(w, 'c'), line: failS1, attempt: 2 });
  const out2 = await mod.run(inputs, last.ctx);
  assert.ok(out2.clips[0].image && !out2.clips[0].video);
  assert.equal(out2.video, undefined, 'no video output when the first clip is a still');

  const plain = makeCtx({ partDir: dir, workDir: join(w, 'd'), line: refuseS2 });
  await assert.rejects(mod.run({ ...inputs, fallback: 'fail' }, plain.ctx), (e) => e.code === 'provider_rejected', 'fallback fail keeps the refusal');
  const quote = makeCtx({ partDir: dir, workDir: join(w, 'e'), line: () => Promise.reject(failWith('over_quote')), attempt: 2 });
  await assert.rejects(mod.run(inputs, quote.ctx), (e) => e.code === 'over_quote', 'an over-quote never falls back');
});

test('mode stills fallback never masks a stop', { skip }, async () => {
  const w = work();
  const inputs = await stillsInputs(w, { fallback: 'still' });
  const line = nativeLine();
  let made;
  made = makeCtx({
    partDir: dir,
    workDir: join(w, 'step'),
    attempt: 2,
    line: (order, ctx) => {
      if (order.piece !== 'clip-s1') return line(order, ctx);
      made.abort();
      return Promise.reject(failWith('provider_rejected'));
    },
  });
  await assert.rejects(mod.run(inputs, made.ctx), (e) => e.code === 'stopped');
  assert.ok(!made.logs.some(([level, m]) => level === 'warn' && /became its still/.test(m)), 'no clip fell back to its still');
});

test('mode stills keeps native sound when asked, and fails a clip that comes back without it', { skip }, async () => {
  const w = work();
  const inputs = await stillsInputs(w, { generate_audio: true });
  const kept = makeCtx({ partDir: dir, workDir: join(w, 'a'), line: nativeLine() });
  const out = await mod.run(inputs, kept.ctx);
  assert.equal((await kept.ctx.tools.probe(out.clips[0].video.path)).has_audio, true);
  const mute = makeCtx({ partDir: dir, workDir: join(w, 'b'), line: nativeLine({ audio: false }) });
  await assert.rejects(mod.run(inputs, mute.ctx), (e) => e.code === 'provider_failed' && /without its native audio/.test(e.message));
});

test('the seed is stable for the same inputs and changes the clips with a new seed', { skip }, async () => {
  const w = work();
  const inputs = await stillsInputs(w);
  const seeds = async (seed, sub) => {
    const { ctx, orders } = makeCtx({ partDir: dir, workDir: join(w, sub), line: nativeLine(), seed });
    await mod.run({ ...inputs, seed }, ctx);
    return orders.map((x) => [x.piece, x.body.seed]).sort();
  };
  const a = await seeds(4015, 'a');
  assert.deepEqual(await seeds(4015, 'b'), a);
  assert.notDeepEqual(await seeds(4016, 'c'), a);
});

// The creator montage's guard: a product scene's clip may start only on a still
// whose actual GPT Image 2 request carried the real product photo.
test('mode stills binds product evidence from the real picture step, and refuses it missing or changed', { skip }, async () => {
  const gpt = await loadNewest('image-gpt-image-2');
  const { pngLine, scenesInputs, writeTemplate } = await import('../../image-gpt-image-2/tests/fixture.mjs');
  const w = work();
  const tpl = { version: 1, scene: '{picture}', motion: '{picture}. The camera moves right.', refs: ['anchor'], by_tag: {
    'Look 1': { refs: ['anchor'] }, Product: { scene: '{product.name}: {picture}', motion: '{picture}. {product.name} rotates.', refs: ['product'] },
  } };
  const inputs = await scenesInputs(w, {});
  inputs.scenes = [{ id: 's4', picture: 'Product: ECU rotates the product on a tabletop.', speaker: 'a', extra: { shot: 'Product' } }];
  inputs.skip_last = 0;
  inputs.template = await writeTemplate(w, tpl);
  inputs.require_scene_tags = true;
  inputs.require_product_refs = true;
  const producer = makeCtx({ partDir: gpt.dir, workDir: join(w, 'stills'), line: pngLine });
  const out = await gpt.mod.run(inputs, producer.ctx);
  const clipInputs = (evidence) => ({ mode: 'stills', stills: out.images, scenes: inputs.scenes, products: inputs.products,
    template: inputs.template, seconds: 4, generate_audio: false,
    require_scene_tags: true, require_product_refs: true, product_reference_evidence: evidence });

  const consumer = makeCtx({ partDir: dir, workDir: join(w, 'clips'), line: nativeLine() });
  await mod.run(clipInputs(out.product_reference_evidence), consumer.ctx);
  assert.equal(consumer.orders.length, 1);
  assert.match(consumer.orders[0].body.prompt, /rotates/);

  for (const evidence of [[], [{ ...out.product_reference_evidence[0], scene_id: 's7' }],
    [{ ...out.product_reference_evidence[0], request_image_sha256: ['f'.repeat(64)] }]]) {
    const refused = makeCtx({ partDir: dir, workDir: join(w, `clips-${Math.random()}`), line: () => assert.fail('nothing may be ordered') });
    await assert.rejects(mod.run(clipInputs(evidence), refused.ctx), (e) => e.code === 'bad_input' && /evidence/.test(e.message));
    assert.equal(refused.orders.length, 0);
  }
});

// 1.2.0: the light lock, and silent creator B-roll with one named physical action per scene.
const LOCK = "Keep the first frame's light and exposure, matte skin, no added shine or sharpening halos.";
const v110 = await loadPart('video-h3max', '1.1.0');

/** stillsInputs as B-roll: every picked scene names one physical action. */
async function brollInputs(workDir, extra = {}) {
  const base = await stillsInputs(workDir);
  const actions = { s1: 'she lifts the jar and unscrews the lid', s2: 'a hand takes a jar off the shelf', s3: 'she sets the jar down on the shelf', s4: 'she presses the patch onto her chin' };
  delete base.generate_audio;
  return { ...base, broll: true, scenes: base.scenes.map((s) => (actions[s.id] ? { ...s, extra: { action: actions[s.id] } } : s)), ...extra };
}

test('mode stills: every clip keeps the first frame\'s light, once, before the Avoid list; 1.1.0 has no lock', { skip }, async () => {
  const w = work();
  const inputs = await stillsInputs(w);
  const { ctx, orders } = makeCtx({ partDir: dir, workDir: join(w, 'step'), line: nativeLine(), seed: inputs.seed });
  await mod.run(inputs, ctx);
  for (const x of orders) {
    assert.ok(x.body.prompt.includes(`${LOCK} Avoid: talking`), x.body.prompt);
    assert.equal(x.body.prompt.split(LOCK).length, 2, 'the lock is added once');
  }
  const old = makeCtx({ partDir: v110.dir, workDir: join(w, 'old'), line: nativeLine(), seed: inputs.seed });
  await v110.mod.run(await stillsInputs(w), old.ctx);
  assert.ok(old.orders.every((x) => !x.body.prompt.includes(LOCK)));
});

test('image_to_video clips get the light lock; reference clips are unchanged', { skip }, async () => {
  const w = work();
  const start = await still(w, 'start.png', { size: '1080x1920' });
  const i2v = makeCtx({ partDir: dir, workDir: join(w, 'a'), line: nativeLine() });
  await mod.run({ mode: 'image_to_video', clips: [{ prompt: 'Image 1 moves.', start_image: start, seconds: 4 }] }, i2v.ctx);
  assert.equal(i2v.orders[0].body.prompt, `Image 1 moves. ${LOCK}`);
  const ref = makeCtx({ partDir: dir, workDir: join(w, 'b'), line: nativeLine() });
  await mod.run({ clips: [{ prompt: 'Image 1 waves.', references: [start], seconds: 4 }] }, ref.ctx);
  assert.equal(ref.orders[0].body.prompt, 'Image 1 waves.');
});

test('broll: each clip pairs "nobody speaks, lips closed" with its named action, silently', { skip }, async () => {
  const w = work();
  const inputs = await brollInputs(w);
  const { ctx, orders } = makeCtx({ partDir: dir, workDir: join(w, 'step'), line: nativeLine(), seed: inputs.seed });
  const out = await mod.run(inputs, ctx);
  const o = byPiece(orders);
  assert.match(o['clip-s4'].body.prompt, /Nobody speaks, lips closed, while she presses the patch onto her chin\. Keep the first frame's light/);
  assert.match(o['clip-s2'].body.prompt, /Nobody speaks, lips closed, while a hand takes a jar off the shelf\./);
  for (const x of orders) assert.doesNotMatch(x.body.prompt, /hands? still|minimal movement/i);
  for (const c of out.clips) assert.equal((await ctx.tools.probe(c.video.path)).has_audio, false, 'B-roll is silent by default');
});

test('broll refusals: no action, a head-only action, still hands, sound on, or another mode', { skip }, async () => {
  const w = work();
  const one = await still(w, 'x.png');
  const withAction = async (id, action) => {
    const i = await brollInputs(w);
    i.scenes = i.scenes.map((s) => (s.id === id ? { ...s, extra: action === undefined ? {} : { action } } : s));
    return i;
  };
  const cases = [
    ['a scene with no action', () => withAction('s3'), /scene s3 is B-roll and needs extra\.action/],
    ['a head turn and a smile', () => withAction('s1', 'she turns her head and smiles'), /only moves the head or eyes/],
    ['a look in the mirror', () => withAction('s4', 'she looks at the mirror'), /only moves the head or eyes/],
    ['an action asking for still hands', () => withAction('s2', 'keep hands still'), /asks for still hands/],
    ['a motion text asking for still hands', async () => ({ ...(await brollInputs(w)), template: await template(w, { version: 1, motion: '{picture}. Keep hands still, camera stationary' }, 'still.prompt.json') }), /its prompt says "Keep hands still"/],
    ['no hand touches the face', async () => ({ ...(await brollInputs(w)), template: await template(w, { version: 1, motion: '{picture}. No hand touches the face' }, 'touch.prompt.json') }), /its prompt says "No hand touches"/],
    ['sound on', async () => ({ ...(await brollInputs(w)), generate_audio: true }), /broll clips are silent/],
    ['broll in another mode', async () => ({ mode: 'image_to_video', clips: [{ seconds: 4, prompt: 'x', start_image: one }], broll: true }), /broll works only in mode stills/],
  ];
  for (const [what, make, message] of cases) {
    const { ctx, orders } = makeCtx({ partDir: dir, line: () => assert.fail(`${what}: nothing may be ordered`) });
    await assert.rejects(mod.run(await make(), ctx), (e) => e.code === 'bad_input' && message.test(e.message), what);
    assert.equal(orders.length, 0, what);
  }
});

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileRef, hasFfmpeg, loadNewest, makeCtx, probe, run } from '../../_tools/kit-harness.mjs';
import { clipLine, makeStill, scenesInputs, template, writeTemplate } from './fixture.mjs';

const { dir, mod } = await loadNewest('video-kling');
const skip = !(await hasFfmpeg()) && 'ffmpeg is not installed';
const V21 = 'fal-ai/kling-video/v2.1/standard/image-to-video';
const V25 = 'fal-ai/kling-video/v2.5-turbo/pro/image-to-video';
const V3 = 'fal-ai/kling-video/v3/standard/image-to-video';
const work = () => mkdtempSync(join(tmpdir(), 'kling-'));
const byPiece = (orders) => Object.fromEntries(orders.map((o) => [o.piece, o]));
const failWith = (code) => {
  const e = new Error(code);
  e.code = code;
  return e;
};

test('fixture: v3 scenes mode makes one silent clip per picked scene, timed to the voice spans', { skip }, async () => {
  const w = work();
  const inputs = await scenesInputs(w);
  const { ctx, orders } = makeCtx({ partDir: dir, workDir: join(w, 'step'), line: clipLine });
  const out = await mod.run(inputs, ctx);
  const o = byPiece(orders);
  assert.deepEqual(Object.keys(o).sort(), ['clip-s1', 'clip-s2', 'clip-s3'], 'the end card scene s4 is skipped');
  for (const x of orders) {
    assert.equal(x.provider, 'fal');
    assert.equal(x.path, V3);
    assert.deepEqual(Object.keys(x.body).sort(), ['duration', 'generate_audio', 'negative_prompt', 'prompt', 'start_image_url'], 'v3 names its image start_image_url');
    assert.equal(x.body.generate_audio, false, 'v3 makes sound unless told not to');
    assert.equal(typeof x.body.duration, 'string', "fal's duration is a string enum");
    assert.equal(x.body.start_image_url.kind, 'file', 'the still goes to the core as a file, never a link');
    assert.deepEqual(x.results, [{ pointer: '/json/video/url', name: `${x.piece}.mp4`, media: 'video' }]);
  }
  // s1 + s2 (no line) share 0..2.6 s: 1.3 s each, + 0.2, ceil 2, min_s 3 -> 3. s3 runs 2.6..7.3 (the card's span): 4.7 + 0.2 -> 5.
  assert.equal(o['clip-s1'].body.duration, '3');
  assert.equal(o['clip-s2'].body.duration, '3');
  assert.equal(o['clip-s3'].body.duration, '5');
  assert.equal(o['clip-s1'].body.start_image_url.sha256, inputs.stills[0].image.sha256);
  assert.equal(o['clip-s1'].body.prompt, 'stylised 3D, soft light. glossy 3D, subsurface skin. Maya at the stove, tired. Subtle motion, no zoom, no morph');
  assert.equal(o['clip-s1'].body.negative_prompt, 'text, watermark, extra fingers');
  assert.deepEqual(out.clips.map((c) => c.id), ['s1', 's2', 's3']);
  assert.ok(out.clips.every((c) => c.video && !c.image));
  assert.ok(Math.abs(out.clips[2].seconds - 5) < 0.2);
  assert.equal(out.video.sha256, out.clips[0].video.sha256, 'video is the first clip');
});

test('null lines: scenes whose line, on_screen and picture are all null are accepted and share the scene before', { skip }, async () => {
  const w = work();
  const inputs = await scenesInputs(w, { template: undefined, look: undefined });
  delete inputs.template;
  delete inputs.look;
  inputs.scenes = [
    { id: 's1', line: 'One line.', on_screen: null, picture: null },
    { id: 's2', line: null, on_screen: null, picture: null },
    { id: 's3', line: null, on_screen: null, picture: null },
    { id: 's4', line: null, on_screen: null, picture: null },
  ];
  inputs.spans = [{ id: 's1', start_s: 0, end_s: 11.5 }];
  inputs.max_s = 15;
  const { ctx, orders } = makeCtx({ partDir: dir, workDir: join(w, 'step'), line: clipLine });
  const out = await mod.run(inputs, ctx);
  // s1..s3 share 0..11.75 s (end + tail 0.25): 3.92 s each + 0.2 -> 5.
  assert.deepEqual(orders.map((x) => [x.piece, x.body.duration]), [['clip-s1', '5'], ['clip-s2', '5'], ['clip-s3', '5']]);
  assert.match(orders[0].body.prompt, /^Subtle, natural motion\. Steady camera/, 'with no template and no picture the prompt is the default motion line');
  assert.equal(orders[0].body.negative_prompt, undefined, 'no negative: the model keeps its own');
  assert.equal(out.clips.length, 3);
});

test('a scene on screen longer than max_s gets the longest allowed clip and the step says so', { skip }, async () => {
  const w = work();
  const inputs = await scenesInputs(w, { max_s: 5, min_s: undefined });
  delete inputs.min_s;
  inputs.spans = [{ id: 's1', start_s: 0, end_s: 1 }, { id: 's3', start_s: 1.2, end_s: 9.5 }];
  const { ctx, orders, logs } = makeCtx({ partDir: dir, workDir: join(w, 'step'), line: clipLine });
  await mod.run(inputs, ctx);
  const o = byPiece(orders);
  // s1 + s2 share 0..1.2: 0.6 + 0.2 -> 1 -> 3 (v3's shortest). s3: 1.2..9.75 = 8.55 -> over max_s 5 -> 5.
  assert.equal(o['clip-s1'].body.duration, '3');
  assert.equal(o['clip-s3'].body.duration, '5');
  assert.ok(logs.some(([, m]) => /scene s3 is on screen 8\.55 s; its clip is the longest allowed, 5 s/.test(m)));
});

test('v2.1 images mode: image_url, "5" | "10" s, cfg and negative as given, no sound field', { skip }, async () => {
  const w = work();
  const still = await makeStill(join(w, 'key.png'));
  const inputs = {
    model: V21,
    mode: 'images',
    stills: [{ id: 's1', image: still }],
    scenes: [{ id: 's1', line: null, picture: 'A hand holds the jar up to a window' }],
    template: await writeTemplate(w, { version: 1, motion: '{picture}. Subtle breathing handheld motion, label stays sharp' }),
    seconds: 7,
    negative_prompt: 'warped label, extra fingers',
    cfg_scale: 0.5,
  };
  const { ctx, orders } = makeCtx({ partDir: dir, workDir: join(w, 'step'), line: clipLine });
  const out = await mod.run(inputs, ctx);
  assert.equal(orders.length, 1);
  const { path, body, piece } = orders[0];
  assert.equal(path, V21);
  assert.equal(piece, 'clip-s1');
  assert.deepEqual(Object.keys(body).sort(), ['cfg_scale', 'duration', 'image_url', 'negative_prompt', 'prompt']);
  assert.equal(body.duration, '10', '7 s rounds up to the next length v2.1 makes');
  assert.equal(body.prompt, 'A hand holds the jar up to a window. Subtle breathing handheld motion, label stays sharp');
  assert.equal(body.negative_prompt, 'warped label, extra fingers');
  assert.equal(body.cfg_scale, 0.5);
  assert.ok(Math.abs(out.clips[0].seconds - 10) < 0.2);
});

test('v2.1 images mode from a cast anchor: the hook text, then keep the last 2.3 s (1.0.0 ran this on v2.5)', { skip }, async () => {
  const w = work();
  const anchor = await makeStill(join(w, 'a.png'));
  const inputs = {
    model: V21,
    stills: [{ id: 'a', image: anchor }],
    cast: [{ key: 'a', name: 'Jess', look: 'woman, 28' }],
    answers: { reaction: 'jaw drops, then a grin' },
    template: await writeTemplate(w),
    use: 'hook',
    seconds: 5,
    keep: { seconds: 2.3, anchor: 'end' },
  };
  const { ctx, orders } = makeCtx({ partDir: dir, workDir: join(w, 'step'), line: clipLine });
  const out = await mod.run(inputs, ctx);
  assert.equal(orders[0].path, V21);
  assert.equal(orders[0].body.duration, '5');
  assert.match(orders[0].body.prompt, /Jess reacts: jaw drops, then a grin\. Phone selfie/);
  assert.equal(out.clips[0].seconds, 2.3);
  const info = await probe(out.video.path);
  assert.ok(Math.abs(info.duration_s - 2.3) < 0.15, `kept ${info.duration_s} s`);
  assert.equal(info.has_audio, false);
  assert.equal(out.video.sha256, out.clips[0].video.sha256);
});

test('refusals: every problem is bad_input before any piece is ordered', { skip }, async () => {
  const w = work();
  const still = await makeStill(join(w, 'x.png'));
  const cases = [
    ['a template placeholder the plan cannot fill', async () => ({ model: V21, stills: [{ id: 'a', image: still }], template: await writeTemplate(w), use: 'hook', cast: [{ key: 'a', name: 'Jess' }] }), /needs \{answers\.reaction\}/],
    ['a picked scene with no still', async () => ({ ...(await scenesInputs(w)), skip_last: 0 }), /scene s4 has no still/],
    ['keep longer than the clip', async () => ({ model: V21, stills: [{ id: 'a', image: still }], seconds: 5, keep: { seconds: 6, anchor: 'end' } }), /keep 6 s is longer than clip a/],
    ['a length the model cannot make', async () => ({ model: V21, stills: [{ id: 'a', image: still }], seconds: 12 }), /seconds 12 is longer than the longest clip/],
    ['min_s over max_s', async () => ({ model: V3, stills: [{ id: 'a', image: still }], min_s: 8, max_s: 4 }), /min_s 8 is over max_s 4/],
    ['no length v2.1 makes inside min_s..max_s', async () => ({ model: V21, stills: [{ id: 'a', image: still }], min_s: 6, max_s: 9 }), /no clip length between 6 and 9/],
    ['spans in images mode', async () => ({ model: V21, mode: 'images', stills: [{ id: 'a', image: still }], spans: [{ id: 'a', start_s: 0, end_s: 1 }] }), /spans works only in scenes mode/],
    ['spans and seconds together', async () => ({ ...(await scenesInputs(w)), seconds: 5 }), /spans or seconds, not both/],
    ['scenes mode without scenes', async () => ({ model: V21, mode: 'scenes', stills: [{ id: 'a', image: still }] }), /scenes mode needs scenes/],
    ['two stills with one id', async () => ({ model: V21, stills: [{ id: 'a', image: still }, { id: 'a', image: still }] }), /two stills have the id a/],
    ['a prompt over 2,500 characters', async () => ({ model: V21, mode: 'images', stills: [{ id: 'a', image: still }], scenes: [{ id: 'a', picture: 'a jar' }], template: await writeTemplate(w, { version: 1, motion: `{picture}. ${'slow drift '.repeat(250)}` }, 'long.prompt.json') }), /prompt is over 2500 characters/],
    ['spans that name no picked scene', async () => ({ ...(await scenesInputs(w)), spans: [{ id: 'zz', start_s: 0, end_s: 1 }] }), /no picked scene has a span/],
    ['a look the template does not have', async () => ({ ...(await scenesInputs(w)), look: 'anime' }), /needs \{look\}: "anime"/],
    ['an unknown template text', async () => ({ model: V21, stills: [{ id: 'a', image: still }], template: await writeTemplate(w), use: 'later' }), /no "later" text/],
  ];
  for (const [what, make, message] of cases) {
    const { ctx, orders } = makeCtx({ partDir: dir, line: () => assert.fail(`${what}: nothing may be ordered`) });
    await assert.rejects(mod.run(await make(), ctx), (e) => e.code === 'bad_input' && message.test(e.message), what);
    assert.equal(orders.length, 0, what);
  }
});

test('fallback still: a refused clip becomes its still; a plain failure only on the last attempt', { skip }, async () => {
  const w = work();
  const inputs = await scenesInputs(w, { fallback: 'still' });
  const refuseS2 = (order, ctx) => (order.piece === 'clip-s2' ? Promise.reject(failWith('provider_rejected')) : clipLine(order, ctx));
  const one = makeCtx({ partDir: dir, workDir: join(w, 'a'), line: refuseS2 });
  const out = await mod.run(inputs, one.ctx);
  assert.deepEqual(out.clips.map((c) => [c.id, Boolean(c.video), Boolean(c.image)]), [['s1', true, false], ['s2', false, true], ['s3', true, false]]);
  assert.equal(out.clips[1].image.sha256, inputs.stills[1].image.sha256);
  assert.equal(out.clips[1].seconds, 3);
  assert.ok(one.logs.some(([level, m]) => level === 'warn' && /clip-s2 became its still: provider_rejected/.test(m)));

  const failS1 = (order, ctx) => (order.piece === 'clip-s1' ? Promise.reject(failWith('provider_failed')) : clipLine(order, ctx));
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

test('fallback still never masks a stop: a refusal that lands after the abort fails the step as stopped', { skip }, async () => {
  const w = work();
  const inputs = await scenesInputs(w, { fallback: 'still' });
  let made;
  made = makeCtx({
    partDir: dir,
    workDir: join(w, 'step'),
    attempt: 2,
    line: (order, ctx) => {
      if (order.piece !== 'clip-s1') return clipLine(order, ctx);
      made.abort();
      return Promise.reject(failWith('provider_rejected'));
    },
  });
  await assert.rejects(mod.run(inputs, made.ctx), (e) => e.code === 'stopped');
  assert.ok(!made.logs.some(([level, m]) => level === 'warn' && /became its still/.test(m)), 'no clip fell back to its still');
});

test('a reply with no video file fails the piece', { skip }, async () => {
  const w = work();
  const inputs = await scenesInputs(w);
  const { ctx } = makeCtx({ partDir: dir, workDir: join(w, 'step'), line: async () => ({ json: {}, files: {}, reused: false }) });
  await assert.rejects(mod.run(inputs, ctx), (e) => e.code === 'provider_failed');
});

test('a reply with sound but no picture fails the piece, or becomes its still on the last attempt', { skip }, async () => {
  const w = work();
  const inputs = await scenesInputs(w, { fallback: 'still' });
  const soundOnly = async (order, ctx) => {
    if (order.piece !== 'clip-s2') return clipLine(order, ctx);
    const name = order.results[0].name;
    const path = join(ctx.workDir, name);
    await run('ffmpeg', ['-hide_banner', '-nostdin', '-y', '-f', 'lavfi', '-i', 'anullsrc=r=44100:cl=mono', '-t', '1', '-c:a', 'aac', path]);
    return { json: {}, files: { [name]: await fileRef(path, 'video') }, reused: false };
  };
  const first = makeCtx({ partDir: dir, workDir: join(w, 'a'), line: soundOnly, attempt: 1 });
  await assert.rejects(mod.run(inputs, first.ctx), (e) => e.code === 'provider_failed' && /no picture/.test(e.message));
  const last = makeCtx({ partDir: dir, workDir: join(w, 'b'), line: soundOnly, attempt: 2 });
  const out = await mod.run(inputs, last.ctx);
  assert.ok(out.clips[1].image && !out.clips[1].video);
});

test('the template fixture is a valid version 1 template', async () => {
  const { kitTemplateProblems } = await import('../../_lib/prompt.mjs');
  assert.deepEqual(kitTemplateProblems(template), []);
});

test('1.1.0 withdraws Kling 2.5 Turbo: refused before anything is ordered, and not listed', async () => {
  const w = work();
  const { ctx, orders } = makeCtx({ partDir: dir, workDir: join(w, 'step'), line: clipLine });
  await assert.rejects(mod.run({ model: V25, stills: [{ id: 'a', image: { kind: 'file', path: join(w, 'a.png'), media: 'image', sha256: '0'.repeat(64) } }] }, ctx), (e) => e.code === 'bad_input');
  assert.equal(orders.length, 0);
  const { manifest } = await loadNewest('video-kling');
  assert.ok(!manifest.needs.models.some((m) => m.model === V25));
  assert.ok(!manifest.inputs.properties.model.enum.includes(V25));
});

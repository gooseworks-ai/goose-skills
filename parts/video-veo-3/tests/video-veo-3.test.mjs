import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileRef, hasFfmpeg, loadNewest, makeCtx, probe, run } from '../../_tools/kit-harness.mjs';
import { clipLine, falReply, makeStill, scenesInputs, template, writeTemplate } from './fixture.mjs';

const { dir, mod } = await loadNewest('video-veo-3');
const skip = !(await hasFfmpeg()) && 'ffmpeg is not installed';
const V31 = 'fal-ai/veo3.1/image-to-video';
const V31_FAST = 'fal-ai/veo3.1/fast/image-to-video';
const V3 = 'fal-ai/veo3/image-to-video';
const V3_FAST = 'fal-ai/veo3/fast/image-to-video';
const work = () => mkdtempSync(join(tmpdir(), 'veo-'));
const byPiece = (orders) => Object.fromEntries(orders.map((o) => [o.piece, o]));
const failWith = (code) => {
  const e = new Error(code);
  e.code = code;
  return e;
};

// The recorded W0-62 contracts for the four Veo models (trimmed from the fal OpenAPI).
const CONTRACT = JSON.parse(readFileSync(new URL('./contract.json', import.meta.url), 'utf8')).models;

test('fixture: veo3.1 scenes mode makes one silent clip per picked scene, timed to the voice spans', { skip }, async () => {
  const w = work();
  const inputs = await scenesInputs(w);
  const { ctx, orders } = makeCtx({ partDir: dir, workDir: join(w, 'step'), line: clipLine });
  const out = await mod.run(inputs, ctx);
  const o = byPiece(orders);
  assert.deepEqual(Object.keys(o).sort(), ['clip-s1', 'clip-s2', 'clip-s3', 'clip-s4'], 'the end card scene s5 is skipped');
  for (const x of orders) {
    assert.equal(x.provider, 'fal');
    assert.equal(x.path, V31);
    assert.deepEqual(Object.keys(x.body).sort(), ['duration', 'generate_audio', 'image_url', 'negative_prompt', 'prompt', 'resolution', 'seed']);
    assert.equal(x.body.generate_audio, false, 'Veo makes sound unless told not to');
    assert.equal(x.body.resolution, '1080p');
    assert.match(x.body.duration, /^[468]s$/, "fal's duration is \"4s\" | \"6s\" | \"8s\"");
    assert.equal(x.body.image_url.kind, 'file', 'the still goes to the core as a file, never a link');
    assert.deepEqual(x.results, [{ pointer: '/json/video/url', name: `${x.piece}.mp4`, media: 'video' }]);
  }
  // s1 + s2 (no line) share 0..1.3: 0.65 + 0.2 -> 1 -> 4 (Veo's shortest). s3 1.3..2.6 -> 4. s4 2.6..9.4 (the card's span): 6.8 + 0.2 = 7 -> 8.
  assert.deepEqual(orders.map((x) => [x.piece, x.body.duration]).sort(), [['clip-s1', '4s'], ['clip-s2', '4s'], ['clip-s3', '4s'], ['clip-s4', '8s']]);
  assert.deepEqual([o['clip-s1'].body.seed, o['clip-s2'].body.seed, o['clip-s3'].body.seed, o['clip-s4'].body.seed], [40, 41, 42, 43], 'each scene gets its own seed');
  assert.equal(o['clip-s1'].body.image_url.sha256, inputs.stills[0].image.sha256);
  assert.match(o['clip-s1'].body.prompt, /^Vertical 9:16 UGC phone footage, natural daylight\. .*she lifts the jar and squints at it\. Handheld phone camera drifts in a small arc$/);
  assert.equal(o['clip-s2'].body.prompt, 'Vertical 9:16 UGC phone footage, natural daylight. a crowded supplement aisle. Black and white, the camera pushes in 4 inches over 2 seconds');
  assert.equal(o['clip-s3'].body.prompt, 'Vertical 9:16 UGC phone footage, natural daylight. Bioma Probiotic on a bathroom shelf. A hand turns Bioma Probiotic toward the lens, the label sharp');
  assert.equal(o['clip-s1'].body.negative_prompt, 'text, captions, watermark, extra fingers, extra limbs');
  assert.deepEqual(out.clips.map((c) => c.id), ['s1', 's2', 's3', 's4']);
  assert.ok(out.clips.every((c) => c.video && !c.image));
  assert.ok(Math.abs(out.clips[3].seconds - 8) < 0.2);
  assert.equal(out.video.sha256, out.clips[0].video.sha256, 'video is the first clip');
});

test('fixture: every model\'s request fits its recorded W0-62 contract, and the answer is read at its pointer', { skip }, async () => {
  const manifest = JSON.parse(readFileSync(join(dir, 'part.json'), 'utf8'));
  assert.deepEqual(Object.keys(CONTRACT).sort(), [V3_FAST, V3, V31_FAST, V31].sort());
  for (const [model, c] of Object.entries(CONTRACT)) {
    assert.equal(manifest.cost.rates_usd[model], c.unit_price_usd_per_s, `${model}'s documented rate is fal's list price`);
    const w = work();
    const inputs = await scenesInputs(w, { model, aspect_ratio: '9:16', resolution: '720p' });
    const { ctx, orders } = makeCtx({ partDir: dir, workDir: join(w, 'step'), line: clipLine });
    await mod.run(inputs, ctx);
    assert.equal(orders.length, 4);
    for (const x of orders) {
      assert.equal(x.path, model);
      for (const key of c.required) assert.ok(key in x.body, `${model}: ${key} is required by fal`);
      for (const [key, value] of Object.entries(x.body)) {
        assert.ok(key in c.fields, `${model}: ${key} is an input`);
        if (c.fields[key].enum) assert.ok(c.fields[key].enum.includes(value), `${model}: ${key} ${value} is one of ${c.fields[key].enum}`);
      }
      assert.equal(x.results[0].pointer, c.pointer);
    }
    // The fake line answers in the recorded shape, apart from the url.
    assert.deepEqual(Object.keys(falReply('x.mp4').video).sort(), Object.keys(c.answer.json.video).sort());
  }
});

test('null lines: scenes whose line, on_screen and picture are all null are accepted and share the scene before', { skip }, async () => {
  const w = work();
  const inputs = await scenesInputs(w);
  delete inputs.template;
  delete inputs.seed;
  inputs.scenes = [
    { id: 's1', line: 'One line.', on_screen: null, picture: null },
    { id: 's2', line: null, on_screen: null, picture: null },
    { id: 's3', line: null, on_screen: null, picture: null },
    { id: 's4', line: null, on_screen: null, picture: null },
    { id: 's5', line: null, on_screen: null, picture: null },
  ];
  inputs.spans = [{ id: 's1', start_s: 0, end_s: 13.5 }];
  const { ctx, orders } = makeCtx({ partDir: dir, workDir: join(w, 'step'), line: clipLine });
  const out = await mod.run(inputs, ctx);
  // s1..s4 share 0..13.75 s (end + tail 0.25): 3.44 s each + 0.2 -> 4 -> 4s.
  assert.deepEqual(orders.map((x) => [x.piece, x.body.duration]).sort(), [['clip-s1', '4s'], ['clip-s2', '4s'], ['clip-s3', '4s'], ['clip-s4', '4s']]);
  assert.match(orders[0].body.prompt, /^The camera drifts a little handheld/, 'with no template and no picture the prompt is the verb-led default motion line');
  assert.equal(orders[0].body.negative_prompt, undefined, 'no negative: the model keeps its own');
  assert.equal(orders[0].body.seed, undefined, 'no seed: the model picks');
  assert.equal(out.clips.length, 4);
});

test('a scene on screen longer than max_s gets the longest allowed clip and the step says so', { skip }, async () => {
  const w = work();
  const inputs = await scenesInputs(w, { max_s: 6 });
  const { ctx, orders, logs } = makeCtx({ partDir: dir, workDir: join(w, 'step'), line: clipLine });
  await mod.run(inputs, ctx);
  assert.equal(byPiece(orders)['clip-s4'].body.duration, '6s');
  assert.ok(logs.some(([, m]) => /scene s4 is on screen 6\.80 s; its clip is the longest allowed, 6 s/.test(m)));
});

test('images mode on the fast models: "6s" from 5 s, aspect ratio as given, no seed, keep the last 2.5 s', { skip }, async () => {
  for (const model of [V31_FAST, V3, V3_FAST]) {
    const w = work();
    const still = await makeStill(join(w, 'key.png'));
    const inputs = {
      model,
      mode: 'images',
      stills: [{ id: 'k1', image: still }],
      scenes: [{ id: 'k1', line: null, picture: 'A hand lifts the jar up to a window' }],
      template: await writeTemplate(w, { version: 1, motion: '{picture}. The label catches the light' }),
      seconds: 5,
      resolution: '720p',
      aspect_ratio: '9:16',
      negative_prompt: 'warped label',
      keep: { seconds: 2.5, anchor: 'end' },
    };
    const { ctx, orders } = makeCtx({ partDir: dir, workDir: join(w, 'step'), line: clipLine });
    const out = await mod.run(inputs, ctx);
    assert.equal(orders.length, 1);
    const { path, body, piece } = orders[0];
    assert.equal(path, model);
    assert.equal(piece, 'clip-k1');
    assert.deepEqual(Object.keys(body).sort(), ['aspect_ratio', 'duration', 'generate_audio', 'image_url', 'negative_prompt', 'prompt', 'resolution']);
    assert.equal(body.duration, '6s', '5 s rounds up to the next length Veo makes');
    assert.equal(body.aspect_ratio, '9:16');
    assert.equal(body.resolution, '720p');
    assert.equal(body.prompt, 'A hand lifts the jar up to a window. The label catches the light');
    assert.equal(out.clips[0].seconds, 2.5);
    const info = await probe(out.video.path);
    assert.ok(Math.abs(info.duration_s - 2.5) < 0.15, `kept ${info.duration_s} s`);
    assert.equal(info.has_audio, false);
  }
});

test('still-shot words refuse before anything is ordered; static_words allow lets them through', { skip }, async () => {
  const w = work();
  for (const [picture, word] of [
    ['Look 1: MCU, she remains in pose by the mirror', 'remains'],
    ['Look 2: the hem STAYS still while she smiles', 'stays'],
    ['Product: Bioma Probiotic, a slow push-in', 'slow'],
    ['Look 1: she holds the jar, steady framing', 'steady'],
  ]) {
    const inputs = await scenesInputs(w);
    inputs.scenes[3] = { ...inputs.scenes[3], picture };
    const { ctx, orders } = makeCtx({ partDir: dir, line: () => assert.fail('nothing may be ordered') });
    await assert.rejects(mod.run(inputs, ctx), (e) => e.code === 'bad_input' && e.message.includes(`clip s4's prompt says "${word}"`), picture);
    assert.equal(orders.length, 0);
  }
  const inputs = await scenesInputs(w, { static_words: 'allow' });
  inputs.scenes[3] = { ...inputs.scenes[3], picture: 'Look 2: she remains by the window' };
  const { ctx, orders } = makeCtx({ partDir: dir, workDir: join(w, 'allow'), line: clipLine });
  await mod.run(inputs, ctx);
  assert.match(byPiece(orders)['clip-s4'].body.prompt, /she remains by the window/);
  // Words that only contain a still-shot word are fine ("slower" is not "slow", "restless" is not "rests").
  const ok = await scenesInputs(w);
  ok.scenes[3] = { ...ok.scenes[3], picture: 'Look 2: she grows restless and walks faster, never slower' };
  const run2 = makeCtx({ partDir: dir, workDir: join(w, 'ok'), line: clipLine });
  await mod.run(ok, run2.ctx);
  assert.equal(run2.orders.length, 4);
});

test('refusals: every problem is bad_input before any piece is ordered', { skip }, async () => {
  const w = work();
  const still = await makeStill(join(w, 'x.png'));
  const one = { model: V31, stills: [{ id: 'a', image: still }] };
  const cases = [
    ['a template banned phrase', async () => {
      const i = await scenesInputs(w);
      i.scenes[0] = { ...i.scenes[0], picture: 'Look 1: the outfit reveal by the mirror' };
      return i;
    }, /scene s1 uses the banned phrase "reveal"/],
    ['a template placeholder the plan cannot fill', async () => ({ ...one, template: await writeTemplate(w, { version: 1, motion: '{answers.energy}. A hand turns the jar' }, 'gap.prompt.json') }), /needs \{answers\.energy\}/],
    ['a picked scene with no still', async () => ({ ...(await scenesInputs(w)), skip_last: 0 }), /scene s5 has no still/],
    ['keep longer than the clip', async () => ({ ...one, seconds: 4, keep: { seconds: 5, anchor: 'end' } }), /keep 5 s is longer than clip a/],
    ['min_s over max_s', async () => ({ ...one, min_s: 8, max_s: 4 }), /min_s 8 is over max_s 4/],
    ['no length Veo makes inside min_s..max_s', async () => ({ ...one, min_s: 4.5, max_s: 5.5 }), /no clip length between 4\.5 and 5\.5/],
    ['spans in images mode', async () => ({ ...one, mode: 'images', spans: [{ id: 'a', start_s: 0, end_s: 1 }] }), /spans works only in scenes mode/],
    ['spans and seconds together', async () => ({ ...(await scenesInputs(w)), seconds: 4 }), /spans or seconds, not both/],
    ['scenes mode without scenes', async () => ({ ...one, mode: 'scenes' }), /scenes mode needs scenes/],
    ['two stills with one id', async () => ({ ...one, stills: [{ id: 'a', image: still }, { id: 'a', image: still }] }), /two stills have the id a/],
    ['spanned scenes out of the spans\' order', async () => {
      const i = await scenesInputs(w);
      return { ...i, spans: [{ id: 's1', start_s: 0, end_s: 1.1 }, { id: 's3', start_s: 2.6, end_s: 3 }, { id: 's4', start_s: 1.3, end_s: 2.4 }] };
    }, /scene s4 starts at or before scene s3/],
    ['two picked scenes with one id', async () => {
      const i = await scenesInputs(w);
      return { ...i, scenes: [i.scenes[0], { ...i.scenes[2], id: 's1' }, i.scenes[4]], spans: [{ id: 's1', start_s: 0, end_s: 1 }] };
    }, /two scenes have the id s1/],
    ['spans that name no picked scene', async () => ({ ...(await scenesInputs(w)), spans: [{ id: 'zz', start_s: 0, end_s: 1 }] }), /no picked scene has a span/],
    ['clips longer together than max_total_s', async () => ({ ...(await scenesInputs(w)), max_total_s: 16 }), /the 4 clips come to 20 s, over max_total_s 16/],
    ['an unknown template text', async () => ({ ...one, template: await writeTemplate(w), use: 'later' }), /no "later" text/],
    ['generate_audio true', async () => ({ ...one, generate_audio: true }), /generate_audio/],
    ['a 4k resolution', async () => ({ ...one, resolution: '4k' }), /resolution/],
    ['a model this part does not list', async () => ({ ...one, model: 'fal-ai/veo2/image-to-video' }), /model/],
    ['a clip length over 8 s', async () => ({ ...one, seconds: 10 }), /seconds/],
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
  assert.deepEqual(out.clips.map((c) => [c.id, Boolean(c.video), Boolean(c.image)]), [['s1', true, false], ['s2', false, true], ['s3', true, false], ['s4', true, false]]);
  assert.equal(out.clips[1].image.sha256, inputs.stills[1].image.sha256);
  assert.equal(out.clips[1].seconds, 4);
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

test('clip timing: a scene runs only to the next span, even one pick leaves out', { skip }, async () => {
  const w = work();
  const base = await scenesInputs(w);
  // s3 has no picture, so with_picture leaves it out; s1 + s2 must stop at s3's span (1.3 s), not run to s4's (12.2 s).
  const scenes = base.scenes.map((sc) => (sc.id === 's3' ? { ...sc, picture: null } : sc));
  const spans = [{ id: 's1', start_s: 0, end_s: 1 }, { id: 's3', start_s: 1.3, end_s: 12 }, { id: 's4', start_s: 12.2, end_s: 13 }, { id: 's5', start_s: 13.5, end_s: 15 }];
  const { ctx, orders } = makeCtx({ partDir: dir, workDir: join(w, 'step'), line: clipLine });
  await mod.run({ ...base, scenes, spans, pick: 'with_picture' }, ctx);
  // s1 + s2 share 0..1.3: 0.65 + 0.2 -> 1 -> 4 s (was 0..12.2 -> 8 s). s4 12.2..13.5 -> 4 s.
  assert.deepEqual(orders.map((x) => [x.piece, x.body.duration]).sort(), [['clip-s1', '4s'], ['clip-s2', '4s'], ['clip-s4', '4s']]);
});

test('clip timing: after a hook made elsewhere (skip_first), the first made scene starts at its own span', { skip }, async () => {
  const w = work();
  const base = await scenesInputs(w);
  const spans = [{ id: 's1', start_s: 0, end_s: 8 }, { id: 's3', start_s: 8.2, end_s: 9 }, { id: 's4', start_s: 9.2, end_s: 10 }, { id: 's5', start_s: 10.5, end_s: 11 }];
  const { ctx, orders } = makeCtx({ partDir: dir, workDir: join(w, 'step'), line: clipLine });
  await mod.run({ ...base, spans, skip_first: 1 }, ctx);
  // s2 (no line) shares the hook's 0..8.2 with it: 4.1 + 0.2 -> 5 -> 6 s. s3 8.2..9.2 -> 4 s (was 0..9.2 shared with s2 -> 6 s). s4 9.2..10.5 -> 4 s.
  assert.deepEqual(orders.map((x) => [x.piece, x.body.duration]).sort(), [['clip-s2', '6s'], ['clip-s3', '4s'], ['clip-s4', '4s']]);
});

test('a reply with no video file fails the piece', { skip }, async () => {
  const w = work();
  const inputs = await scenesInputs(w);
  const { ctx } = makeCtx({ partDir: dir, workDir: join(w, 'step'), line: async () => ({ json: {}, files: {}, reused: false }) });
  await assert.rejects(mod.run(inputs, ctx), (e) => e.code === 'provider_failed');
});

test('the template fixture is a valid version 1 template', async () => {
  const { kitTemplateProblems } = await import('../../_lib/prompt.mjs');
  assert.deepEqual(kitTemplateProblems(template), []);
});

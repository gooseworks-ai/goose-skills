// creator-h3 1.2.0: measured joins and the silent clips mode, against fake
// takes whose voice (a tone) starts and stops at known times, and the
// recorded H3 request contract.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { loadPart, hasFfmpeg, makeCtx, fileRef, probe, run } from '../../_tools/kit-harness.mjs';
import { H3_REPLY, castInputs, sample, still, words } from './fixture.mjs';

const { dir, mod } = await loadPart('creator-h3', '1.2.0');
const old = await loadPart('creator-h3', '1.1.0');
const ffmpeg = await hasFfmpeg();
const skip = !ffmpeg && 'ffmpeg is not installed';
const FPS = 30;
const snap = (s) => Math.ceil((s - 1e-8) * FPS) / FPS;
const near = (a, b, tol, what) => assert.ok(Math.abs(a - b) <= tol, `${what}: ${a} is not within ${tol} of ${b}`);

/**
 * A fake private line: each take is a moving picture `extra` seconds longer than
 * asked for, with a tone for the voice from `lead` for `voice(d)` seconds (no
 * tone at all when voice is 0), mono like H3.
 */
function toneLine({ lead: leadDefault = 0.2, voice = () => 1.5, extra = 0, leads = {} } = {}) {
  return async (order, ctx) => {
    const name = order.results[0].name;
    const path = join(ctx.workDir, name);
    const d = order.body.duration + extra;
    const v = voice(d);
    const lead = leads[order.piece] ?? leadDefault;
    const audio = v > 0 ? ['-f', 'lavfi', '-i', `sine=frequency=300:duration=${v}:sample_rate=48000`, '-filter_complex', `[1:a]adelay=${Math.round(lead * 1000)}:all=1,apad[a]`] : ['-f', 'lavfi', '-i', 'anullsrc=r=48000:cl=mono', '-filter_complex', '[1:a]anull[a]'];
    await run('ffmpeg', ['-hide_banner', '-nostdin', '-y', '-f', 'lavfi', '-i', `testsrc2=size=360x640:rate=24:duration=${d}`, ...audio, '-map', '0:v', '-map', '[a]', '-c:v', 'libx264', '-preset', 'ultrafast', '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-ac', '1', '-t', String(d), path]);
    return { json: structuredClone(H3_REPLY.answer.json), files: { [name]: await fileRef(path, 'video') }, reused: false };
  };
}

/** The silences ffmpeg hears in a file: [{start, end}]. */
async function silences(path) {
  const { stderr } = await run('ffmpeg', ['-hide_banner', '-nostdin', '-v', 'info', '-i', path, '-af', 'silencedetect=noise=-35dB:d=0.05', '-f', 'null', '-']);
  const starts = [...String(stderr).matchAll(/silence_start: (-?[0-9.]+)/g)].map((m) => Number(m[1]));
  const ends = [...String(stderr).matchAll(/silence_end: ([0-9.]+)/g)].map((m) => Number(m[1]));
  return starts.map((start, i) => ({ start, end: ends[i] }));
}

test('measured join: the next take\'s first word comes 0.25 s after the last word, and the reel ends 0.6 s after the final word', { skip }, async () => {
  const { ctx, orders } = makeCtx({ partDir: dir, line: toneLine() });
  const out = await mod.run(await sample.inputs(ctx.workDir), ctx);
  assert.ok(orders.length >= 2, `${orders.length} takes`);
  // Every take speaks from 0.2 s to 1.7 s; the first is at 0, so the second starts at 1.7 + 0.25 - 0.2.
  assert.equal(out.takes[0].start_s, 0);
  out.takes.slice(1).forEach((t, k) => {
    const prevWordEnd = out.takes[k].start_s + 1.7;
    assert.equal(t.joins_s, t.start_s);
    near(t.joins_s, prevWordEnd + 0.05, 1 / FPS + 0.01, `take ${t.id} join`);
  });
  near(out.seconds, out.takes.at(-1).start_s + 1.7 + 0.6, 1 / FPS + 0.01, 'reel length');
  // On the reel, the gap between one take's voice and the next is about 0.25 s.
  const gaps = (await silences(out.video.path)).filter((s) => s.start > 0.1 && s.end != null && s.end < out.seconds - 0.05);
  assert.equal(gaps.length, out.takes.length - 1, JSON.stringify(gaps));
  for (const g of gaps) near(g.end - g.start, 0.25, 0.06, 'gap between takes');
  const info = await probe(out.video.path);
  near(info.duration_s, out.seconds, 0.1, 'file length');
  // Line spans sit on each take's measured speech.
  for (const t of out.takes) {
    for (const s of out.timeline.speech.filter((x) => t.scene_ids.includes(x.scene_id))) {
      assert.ok(s.start_s >= t.start_s + 0.2 - 0.002 && s.end_s <= t.start_s + 1.7 + 0.002, `${s.scene_id} inside take ${t.id}'s speech`);
    }
  }
  out.timeline.scenes.forEach((s, i, all) => {
    assert.ok(s.end_s > s.start_s);
    if (i) assert.equal(s.start_s, all[i - 1].end_s);
  });
});

test('join planned keeps 1.1.0\'s schedule exactly', { skip }, async () => {
  const a = makeCtx({ partDir: dir, line: toneLine() });
  const planned = await mod.run({ ...(await sample.inputs(a.ctx.workDir)), join: 'planned' }, a.ctx);
  const b = makeCtx({ partDir: old.dir, line: toneLine() });
  const before = await old.mod.run(await sample.inputs(b.ctx.workDir), b.ctx);
  assert.deepEqual(planned.takes.map((t) => [t.start_s, t.scene_ids]), before.takes.map((t) => [t.start_s, t.scene_ids]));
  assert.equal(planned.seconds, before.seconds);
  assert.deepEqual(planned.timeline.speech, before.timeline.speech);
});

test('measured join: a voice that runs to the end of its take holds the last frame briefly to reach the join', { skip }, async () => {
  const { ctx } = makeCtx({ partDir: dir, line: toneLine({ lead: 0.2, voice: (d) => d - 0.2 }) });
  const out = await mod.run(await sample.inputs(ctx.workDir), ctx);
  const info = await probe(out.video.path);
  near(info.duration_s, out.seconds, 0.1, 'file length');
  // No trailing silence: the take's last word is its end, so the next take joins just after it.
  const first = (await probe(out.takes[0].video.path)).duration_s;
  near(out.takes[1].joins_s, +snap(first + 0.05).toFixed(3), 0.04, 'join after a voice that fills its take');
});

test('measured join: a take with no speech fails as provider_failed', { skip }, async () => {
  const { ctx } = makeCtx({ partDir: dir, line: toneLine({ voice: () => 0 }) });
  await assert.rejects(mod.run(await sample.inputs(ctx.workDir), ctx), (e) => e.code === 'provider_failed' && /no speech/.test(e.message));
});

test('talk mode: null line, on_screen and picture are accepted and skipped', { skip }, async () => {
  const { ctx, orders } = makeCtx({ partDir: dir, line: toneLine() });
  const base = await castInputs(ctx.workDir);
  const scenes = [{ id: 'open', line: null, on_screen: null, picture: null }, ...base.scenes.slice(0, 2), { id: 'card', line: null, on_screen: null, picture: null }];
  const out = await mod.run({ ...base, scenes }, ctx);
  assert.equal(orders.length, 1);
  assert.deepEqual(out.takes[0].scene_ids, ['s1', 's2']);
  assert.deepEqual(out.timeline.scenes.map((s) => s.id), ['s1', 's2']);
});

test('measured join with split_before cutaways: takes start at cutaways, and the cutaway scene covers each join', { skip }, async () => {
  const { ctx, orders } = makeCtx({ partDir: dir, line: toneLine() });
  const base = await castInputs(ctx.workDir);
  const shot = await still(ctx.workDir);
  const scenes = [
    { id: 's1', line: words(8), speaker: 'maya', extra: { shot: 'creator' } },
    { id: 's2', line: words(8, 'then'), speaker: 'maya', image: shot, extra: { shot: 'still' } },
    { id: 's3', line: words(20, 'honestly'), speaker: 'maya', extra: { shot: 'creator' } },
    { id: 's4', line: words(10, 'and'), speaker: 'maya', extra: { shot: 'footage' } },
    { id: 'cta', line: null, speaker: null, extra: { shot: 'card' } },
  ];
  const out = await mod.run({ ...base, pronunciations: [], scenes, split_before: 'cutaways' }, ctx);
  assert.equal(orders.length, 3);
  assert.deepEqual(out.takes.map((t) => t.scene_ids), [['s1'], ['s2', 's3'], ['s4']]);
  for (const t of out.takes.slice(1)) {
    const scene = out.timeline.scenes.find((s) => s.id === t.scene_ids[0]);
    assert.ok(scene.start_s <= t.joins_s, `${scene.id} is on screen before its join`);
  }
  out.timeline.scenes.forEach((s, i, all) => {
    assert.ok(s.end_s > s.start_s);
    if (i) assert.equal(s.start_s, all[i - 1].end_s);
  });
});

// W0-21's review scenarios (a one-word first take, then a late speech onset in the next take), which
// 1.1.0's join floors fixed. A take's voice runs to 1 s before its end, so the voice fills the take.
async function floorInputs(workDir, { wps = 2.6, longLine = false } = {}) {
  const base = await castInputs(workDir);
  const shot = await still(workDir);
  const scenes = longLine
    ? [
        { id: 's1', line: 'Honestly.', speaker: 'maya', extra: { shot: 'creator' } },
        { id: 's2', line: words(54, 'then'), speaker: 'maya', image: shot, extra: { shot: 'still' } },
        { id: 'cta', line: null, speaker: null, extra: { shot: 'card' } },
      ]
    : [
        { id: 's1', line: 'Honestly.', speaker: 'maya', extra: { shot: 'creator' } },
        { id: 's2', line: words(8, 'then'), speaker: 'maya', image: shot, extra: { shot: 'still' } },
        { id: 's3', line: words(27, 'honestly'), speaker: 'maya', extra: { shot: 'creator' } },
        { id: 'cta', line: null, speaker: null, extra: { shot: 'card' } },
      ];
  return { ...base, pronunciations: [], scenes, footage: [], split_before: 'cutaways', words_per_second: wps };
}
const lateTone = () => toneLine({ voice: (d) => d - 1, leads: { 'take-t2': 0.6 } });

function assertCovered(out) {
  for (const t of out.takes.slice(1)) {
    const scene = out.timeline.scenes.find((s) => s.id === t.scene_ids[0]);
    assert.ok(scene.start_s <= t.joins_s, `${scene.id} starts at ${scene.start_s}s, at or before the join at ${t.joins_s}s`);
    assert.ok(t.joins_s >= 0.2, `the join at ${t.joins_s}s is floored past the reel start`);
  }
  out.timeline.scenes.forEach((s, i, all) => {
    assert.ok(s.start_s >= 0 && s.end_s > s.start_s, `${s.id} has a positive span`);
    if (i) assert.equal(s.start_s, all[i - 1].end_s);
  });
}

for (const opts of [{}, { wps: 3.9, longLine: true }]) {
  const what = opts.longLine ? 'a late onset at 3.9 words a second' : 'a one-word first take';
  test(`join planned equals 1.1.0 after ${what} (the join floors)`, { skip }, async () => {
    const a = makeCtx({ partDir: dir, line: lateTone() });
    const planned = await mod.run({ ...(await floorInputs(a.ctx.workDir, opts)), join: 'planned' }, a.ctx);
    const b = makeCtx({ partDir: old.dir, line: lateTone() });
    const before = await old.mod.run(await floorInputs(b.ctx.workDir, opts), b.ctx);
    assert.deepEqual(planned.takes.map((t) => [t.start_s, t.joins_s, t.scene_ids]), before.takes.map((t) => [t.start_s, t.joins_s, t.scene_ids]));
    assert.equal(planned.seconds, before.seconds);
    assert.deepEqual(planned.timeline, before.timeline);
    assertCovered(planned);
  });

  test(`measured join after ${what}: the cutaway still covers every join, and spans stay in order`, { skip }, async () => {
    const { ctx } = makeCtx({ partDir: dir, line: lateTone() });
    const out = await mod.run(await floorInputs(ctx.workDir, opts), ctx);
    assert.equal(out.takes.length, 2);
    assertCovered(out);
    // The first take's last word is said before the dissolve into the second take ends.
    const s1 = out.timeline.speech.find((s) => s.scene_id === 's1');
    assert.ok(s1.end_s <= out.takes[1].joins_s + 0.1 + 1e-6, `s1 ends at ${s1.end_s}s, by the dissolve end`);
  });
}

// Day in the life: a spoken hook, three Moment scenes with no line, and an end card.
async function clipInputs(workDir, extra = {}) {
  const frames = {};
  for (const id of ['m1', 'm2', 'm3']) {
    const path = join(workDir, `key-${id}.png`);
    await run('ffmpeg', ['-hide_banner', '-nostdin', '-y', '-f', 'lavfi', '-i', `testsrc2=size=360x640:duration=1`, '-frames:v', '1', path]);
    frames[id] = await fileRef(path, 'image');
  }
  return {
    mode: 'clips',
    scenes: [
      { id: 'hook', line: 'Three matcha flavors, one week.', on_screen: null, picture: 'Hook: she holds up three tins' },
      { id: 'm1', line: null, on_screen: 'Monday: Ceremonial', picture: 'Moment: she whisks the ceremonial matcha in a bowl' },
      { id: 'm2', line: null, on_screen: null, picture: 'Moment: she pours iced strawberry matcha over ice' },
      { id: 'm3', line: null, on_screen: null, picture: 'Moment: she sips the vanilla matcha by the window' },
      { id: 'end', line: null, on_screen: 'Shop now', picture: null },
    ],
    images: [
      { id: 'm1', image: frames.m1 },
      { id: 'm2', image: frames.m2 },
      { id: 'm3', image: frames.m3 },
    ],
    pick: { tags: ['Moment'] },
    seconds: 5,
    resolution: '768P',
    max_seconds: 15,
    ...extra,
  };
}

test('fixture: every clip fits the recorded H3 request, and the reply is read at the recorded pointer', { skip }, async () => {
  const { ctx, orders } = makeCtx({ partDir: dir, line: toneLine({ extra: 0.5 }) });
  const out = await mod.run(await clipInputs(ctx.workDir), ctx);
  assert.equal(orders.length, 3);
  const req = H3_REPLY.request;
  for (const o of orders) {
    assert.equal(o.provider, 'fal');
    assert.equal(o.path, 'minimax/h3-max/reference-to-video');
    for (const f of req.required) assert.ok(o.body[f] != null, `${f} is sent`);
    for (const f of Object.keys(o.body)) assert.ok(req.fields.includes(f), `${f} is a field fal accepts`);
    assert.equal(o.body.prompt_expansion_mode, 'disabled');
    assert.equal(typeof o.body.duration, 'number');
    assert.ok(o.body.duration >= req.duration[0] && o.body.duration <= req.duration[1]);
    assert.ok(req.resolution.includes(o.body.resolution));
    assert.ok(req.aspect_ratio.includes(o.body.aspect_ratio));
    assert.ok(o.body.reference_image_urls.length <= req.max_references);
    assert.equal(o.body.reference_audio_urls, undefined, 'no voice in a silent clip');
    assert.deepEqual(o.results.map((r) => r.pointer), [H3_REPLY.pointer]);
  }
  assert.ok(out.clips.length === 3 && out.video);
});

test('clips mode: a silent 5 s clip per picked Moment, opening on its keyframe, named by scene id', { skip }, async () => {
  const { ctx, orders } = makeCtx({ partDir: dir, line: toneLine({ extra: 0.5 }) });
  const inputs = await clipInputs(ctx.workDir);
  const out = await mod.run(inputs, ctx);
  assert.deepEqual(orders.map((o) => o.piece).sort(), ['clip-m1', 'clip-m2', 'clip-m3']);
  for (const o of orders) {
    const id = o.piece.slice('clip-'.length);
    const key = inputs.images.find((i) => i.id === id).image;
    assert.equal(o.body.image_url.path, key.path, 'the clip opens on its own keyframe');
    assert.deepEqual(o.body.reference_image_urls.map((f) => f.path), [key.path], 'the default template adds no other picture');
    assert.equal(o.body.duration, 5);
    assert.equal(o.body.resolution, '768P');
    assert.ok(!/Moment:/.test(o.body.prompt), 'the picked tag is dropped from {picture}');
    assert.ok(/Nobody talks/.test(o.body.prompt));
  }
  assert.ok(orders.find((o) => o.piece === 'clip-m2').body.prompt.includes('she pours iced strawberry matcha over ice'));
  assert.deepEqual(out.clips.map((c) => c.id), ['m1', 'm2', 'm3'], 'clips keep the plan order');
  for (const c of out.clips) {
    const info = await probe(c.video.path);
    assert.equal(info.has_audio, false, `${c.id} is silent`);
    assert.ok(info.has_video);
    near(c.seconds, 5, 0.1, `${c.id} is cut to 5 s`);
  }
  assert.equal(out.video.path, out.clips[0].video.path);
  near(out.seconds, out.clips.reduce((a, c) => a + c.seconds, 0), 0.01, 'seconds adds the clips up');
  assert.equal(out.timeline, undefined);
  assert.equal(out.takes, undefined);
});

test('clips mode: a clip H3 returns short is held on its last frame to the seconds asked for', { skip }, async () => {
  const { ctx } = makeCtx({ partDir: dir, line: toneLine({ extra: -0.6 }) });
  const out = await mod.run(await clipInputs(ctx.workDir), ctx);
  for (const c of out.clips) {
    const info = await probe(c.video.path);
    assert.equal(info.has_audio, false, `${c.id} is silent`);
    near(info.duration_s, 5, 0.1, `${c.id} file is held to 5 s`);
    near(c.seconds, 5, 0.1, `${c.id} reports 5 s`);
  }
});

test('clips mode: the style template fills the prompt, and its refs add the named product after the keyframe', { skip }, async () => {
  const { ctx, orders } = makeCtx({ partDir: dir, line: toneLine() });
  const tplPath = join(ctx.workDir, 'moment.prompt.json');
  writeFileSync(tplPath, JSON.stringify({
    version: 1,
    looks: { phonecam: 'phone camera, warm window light' },
    motion: '{look}. {picture}. {product.name} stays sharp, label unchanged. Mood: {answers.mood}. No talking.',
    refs: ['product'],
  }));
  const photo = await still(ctx.workDir);
  const inputs = await clipInputs(ctx.workDir, {
    template: await fileRef(tplPath, 'json'),
    look: 'phonecam',
    answers: { mood: 'calm' },
    products: [{ id: 'p1', name: 'Strawberry Matcha', images: [photo] }],
    pick: { tags: ['moment'] },
    seconds: 4,
  });
  const out = await mod.run(inputs, ctx);
  assert.equal(out.clips.length, 3);
  const o = orders.find((x) => x.piece === 'clip-m2');
  assert.equal(o.body.prompt, 'phone camera, warm window light. she pours iced strawberry matcha over ice. Strawberry Matcha stays sharp, label unchanged. Mood: calm. No talking.');
  assert.deepEqual(o.body.reference_image_urls.map((f) => f.path), [inputs.images[1].image.path, photo.path], 'keyframe, then the product photo');
  assert.equal(o.body.duration, 4);
});

test('clips mode refusals happen before any order', async () => {
  const { ctx, orders } = makeCtx({ partDir: dir, line: toneLine() });
  const base = ffmpeg ? await clipInputs(ctx.workDir) : null;
  if (!base) return;
  const refuse = (inputs, re) => assert.rejects(mod.run(inputs, ctx), (e) => e.code === 'bad_input' && re.test(e.message), String(re));
  await refuse({ ...base, images: base.images.slice(0, 2) }, /scene m3 has no keyframe in images/);
  const { images: _drop, ...noImages } = base;
  await refuse(noImages, /clips mode needs images/);
  await refuse({ ...base, max_seconds: 10 }, /3 clips of 5s need 15s, more than max_seconds 10/);
  await refuse({ ...base, pick: { tags: ['Unboxing'] } }, /no scene is picked/);
  await refuse({ ...base, delivery: 'fast' }, /delivery works only in talk mode/);
  await refuse({ ...base, join: 'planned' }, /join works only in talk mode/);
  await refuse({ ...base, scenes: base.scenes.map((s) => (s.id === 'm2' ? { ...s, picture: null, extra: { shot: 'Moment' } } : s)) }, /scene m2 needs \{picture\}/);
  const tplPath = join(ctx.workDir, 'gap.prompt.json');
  writeFileSync(tplPath, JSON.stringify({ version: 1, motion: '{picture}. Mood: {answers.mood}.' }));
  await refuse({ ...base, template: await fileRef(tplPath, 'json') }, /needs \{answers\.mood\}/);
  writeFileSync(tplPath, JSON.stringify({ version: 1, scene: '{picture}' }));
  await refuse({ ...base, template: await fileRef(tplPath, 'json') }, /no "motion" text/);
  // Clips-only inputs are refused in talk mode.
  const talk = await sample.inputs(ctx.workDir);
  await refuse({ ...talk, images: base.images }, /images works only in clips mode/);
  await refuse({ ...talk, pick: 'all' }, /pick works only in clips mode/);
  assert.equal(orders.length, 0, 'nothing was ordered');
});

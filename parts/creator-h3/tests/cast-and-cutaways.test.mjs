// creator-h3 1.1.0: the creator from the cast, delivery, pronunciations,
// split_before cutaways and joins_s, against the recorded H3 reply. The same
// suite runs against 1.2.0 with join: planned, which must keep 1.1.0's
// schedule and every review fix (cutaway starts, spoken cutaways, join floors).
import { test as nodeTest } from 'node:test';
import assert from 'node:assert/strict';
import { join } from 'node:path';
import { loadPart, hasFfmpeg, makeCtx, fileRef, run } from '../../_tools/kit-harness.mjs';
import { H3_REPLY, castInputs, recordedLine, sample, still, words } from './fixture.mjs';

const ffmpeg = await hasFfmpeg();
const skip = !ffmpeg && 'ffmpeg is not installed';
const said = (o) => /<inhale> ([\s\S]*)<\/d>/.exec(o.body.prompt)[1].split(' <pause> ');
const at = (obj, pointer) => pointer.split('/').slice(1).reduce((v, k) => (v == null ? v : v[k]), obj);

const VARIANTS = [
  { version: '1.1.0', extra: {} },
  { version: '1.2.0', extra: { join: 'planned' } },
  { version: '1.2.1', extra: { join: 'planned' } },
];

for (const { version, extra } of VARIANTS) {
  const loaded = await loadPart('creator-h3', version);
  const dir = loaded.dir;
  // Every run gets the variant's extra inputs (1.2.0: join planned).
  const mod = { run: (inputs, ctx) => loaded.mod.run({ ...inputs, ...extra }, ctx) };
  const label = Object.keys(extra).length ? `${version} ${JSON.stringify(extra)}` : version;
  const test = (name, ...rest) => nodeTest(`[${label}] ${name}`, ...rest);

  test('fixture: every take fits the recorded H3 request, and the reply is read at the recorded pointer', { skip }, async () => {
    const { ctx, orders } = makeCtx({ partDir: dir, line: recordedLine });
    const out = await mod.run(await castInputs(ctx.workDir), ctx);
    assert.ok(orders.length >= 1);
    const req = H3_REPLY.request;
    for (const o of orders) {
      assert.equal(o.provider, 'fal');
      assert.equal(o.path, 'minimax/h3-max/reference-to-video');
      for (const f of req.required) assert.ok(o.body[f] != null, `${f} is sent`);
      for (const f of Object.keys(o.body)) assert.ok(req.fields.includes(f), `${f} is a field fal accepts`);
      assert.ok(req.prompt_expansion_mode.includes(o.body.prompt_expansion_mode));
      assert.equal(typeof o.body.duration, 'number', 'duration is a number, not a string');
      assert.ok(o.body.duration >= req.duration[0] && o.body.duration <= req.duration[1]);
      assert.ok(req.resolution.includes(o.body.resolution), 'resolution is upper case');
      assert.ok(req.aspect_ratio.includes(o.body.aspect_ratio));
      const refs = ['reference_image_urls', 'reference_video_urls', 'reference_audio_urls'].reduce((n, k) => n + (o.body[k] || []).length, 0);
      assert.ok(refs <= req.max_references);
      assert.deepEqual(o.results.map((r) => r.pointer), [H3_REPLY.pointer]);
      assert.equal(typeof at(H3_REPLY.answer, H3_REPLY.pointer), 'string', 'the recorded reply has a url at the pointer');
    }
    assert.ok(out.video && out.seconds > 0);
  });

  test('the creator is the speaker\'s cast member, with pronunciations in the dialogue only and the given delivery', { skip }, async () => {
    const { ctx, orders } = makeCtx({ partDir: dir, line: recordedLine });
    const inputs = await castInputs(ctx.workDir, { delivery: 'fast and excited, like telling a friend' });
    const out = await mod.run(inputs, ctx);
    assert.equal(orders.length, 1);
    const o = orders[0];
    assert.equal(o.body.reference_image_urls[0].path, inputs.cast[1].image.path, 'Maya\'s picture, not Theo\'s');
    assert.ok(o.body.prompt.includes('a 34-year-old woman, curly dark hair, olive overshirt'), 'identity from age, gender and look');
    assert.ok(o.body.prompt.includes('a bright kitchen with a kettle'), 'environment from the member');
    assert.ok(o.body.prompt.includes('HOW THEY SPEAK: fast and excited, like telling a friend'), 'delivery input wins over the member\'s');
    assert.ok(!o.body.prompt.includes('calm and dry'));
    assert.deepEqual(said(o), ['I switched to Fern hill for my mornings.', 'Fern hill tastes like a walk in the rain.']);
    assert.ok(!o.body.prompt.includes('Fernhill'), 'the written brand name is never sent to H3');
    assert.deepEqual(out.timeline.speech.map((s) => s.text), ['I switched to Fernhill for my mornings.', 'Fernhill tastes like a walk in the rain.'], 'the timeline keeps the written words');
    assert.equal(out.timeline.speech[0].spoken, 'I switched to Fern hill for my mornings.');
    assert.deepEqual(out.timeline.scenes.map((s) => s.id), ['s1', 's2'], 'the silent end card scene has no span');
    assert.equal(out.takes[0].joins_s, undefined, 'the first take has no join');
  });

  test('with no speaker the creator is the first member with a picture; the member\'s own delivery is used', { skip }, async () => {
    const { ctx, orders } = makeCtx({ partDir: dir, line: recordedLine });
    const base = await castInputs(ctx.workDir);
    await mod.run({ ...base, scenes: base.scenes.map((s) => ({ ...s, speaker: null })) }, ctx);
    assert.ok(orders[0].body.prompt.includes('HOW THEY SPEAK: calm and dry'));
    assert.equal(orders[0].body.reference_image_urls[0].path, base.cast[1].image.path);
  });

  test('null line, on_screen and picture: the scene is accepted and skipped', { skip }, async () => {
    const { ctx, orders } = makeCtx({ partDir: dir, line: recordedLine });
    const base = await castInputs(ctx.workDir);
    const scenes = [{ id: 'open', line: null, on_screen: null, picture: null }, ...base.scenes.slice(0, 2), { id: 'card', line: null }];
    const out = await mod.run({ ...base, scenes }, ctx);
    assert.equal(orders.length, 1);
    assert.deepEqual(out.takes[0].scene_ids, ['s1', 's2']);
  });

  // s1 creator, s2 a scene image, s3 creator, s4 a footage scene (extra.shot). At 2.6 words a second:
  // split_before none splits before s3 (on camera); cutaways starts takes only at s2 and s4.
  async function cutawayInputs(workDir, extra = {}) {
    const base = await castInputs(workDir);
    const screenshot = await still(workDir);
    return {
      ...base,
      pronunciations: [],
      scenes: [
        { id: 's1', line: words(8), speaker: 'maya', extra: { shot: 'creator' } },
        { id: 's2', line: words(8, 'then'), speaker: 'maya', image: screenshot, extra: { shot: 'still' } },
        { id: 's3', line: words(20, 'honestly'), speaker: 'maya', extra: { shot: 'creator' } },
        { id: 's4', line: words(10, 'and'), speaker: 'maya', extra: { shot: 'footage' } },
        { id: 'cta', line: null, speaker: null, extra: { shot: 'card' } },
      ],
      footage: [{ asset_id: 'fx-screen-recording-40s', start_ms: 0, end_ms: 4000, audio: false, scene_id: 's4' }],
      ...extra,
    };
  }

  test('split_before none keeps 1.0.2 splitting; cutaways starts every later take at a cutaway and reports joins_s', { skip }, async () => {
    const none = makeCtx({ partDir: dir, line: recordedLine });
    const plain = await mod.run(await cutawayInputs(none.ctx.workDir), none.ctx);
    assert.deepEqual(plain.takes.map((t) => t.scene_ids), [['s1', 's2'], ['s3', 's4']], 'greedy: the s2 to s3 join is on camera');

    const cut = makeCtx({ partDir: dir, line: recordedLine });
    const out = await mod.run(await cutawayInputs(cut.ctx.workDir, { split_before: 'cutaways' }), cut.ctx);
    assert.deepEqual(out.takes.map((t) => t.scene_ids), [['s1'], ['s2', 's3'], ['s4']]);
    assert.equal(cut.orders.length, 3);
    assert.deepEqual(cut.orders.map((o) => o.piece), ['take-t1', 'take-t2', 'take-t3']);
    assert.equal(out.takes[0].joins_s, undefined);
    for (const t of out.takes.slice(1)) {
      assert.equal(typeof t.joins_s, 'number');
      assert.equal(t.joins_s, t.start_s, 'the dissolve into this take starts at its start');
      assert.ok(t.joins_s > 0 && t.joins_s < out.seconds);
    }
    // The scene a later take begins on starts before its line, toward the join.
    for (const t of out.takes.slice(1)) {
      const scene = out.timeline.scenes.find((s) => s.id === t.scene_ids[0]);
      const line = out.timeline.speech.find((s) => s.scene_id === t.scene_ids[0]);
      assert.ok(scene.start_s < line.start_s, `${scene.id} starts before its line`);
      assert.ok(scene.start_s <= t.joins_s, `${scene.id} starts at or before the join at ${t.joins_s}s, so its insert covers the dissolve`);
    }
    // Scenes still tile in order.
    out.timeline.scenes.forEach((s, i, all) => {
      assert.ok(s.end_s > s.start_s);
      if (i) assert.equal(s.start_s, all[i - 1].end_s);
    });
  });

  test('refusals before any order: a long on-camera run, an unknown or second speaker, no picture, cast with character, no creator', async () => {
    const { ctx, orders } = makeCtx({ partDir: dir, line: recordedLine });
    const base = await cutawayInputs(ctx.workDir, { split_before: 'cutaways' });
    // Without the s2 image and shot the s1 to s3 run needs two takes, with no cutaway for the join.
    const noCut = base.scenes.map((s) => (s.id === 's2' ? { id: 's2', line: s.line, speaker: 'maya', extra: { shot: 'creator' } } : s));
    await assert.rejects(mod.run({ ...base, scenes: noCut }, ctx), (e) => e.code === 'bad_input' && /s1 to s3 are one on-camera run/.test(e.message) && /no cutaway/.test(e.message));
    // A footage entry alone makes s2 a cutaway again.
    const viaFootage = { ...base, scenes: noCut, footage: [...base.footage, { asset_id: 'fx-b', start_ms: 0, end_ms: 2000, audio: false, scene_id: 's2' }], max_seconds: 5 };
    await assert.rejects(mod.run(viaFootage, ctx), (e) => e.code === 'bad_input' && /max_seconds/.test(e.message), 'past the split check, stopped only by the price');
    // A silent cutaway does not count: it has no span on the timeline to cover a join on the creator scene after it.
    const silentCut = [noCut[0], { id: 'b', line: null, image: base.scenes[1].image, extra: { shot: 'still' } }, ...noCut.slice(1)];
    await assert.rejects(mod.run({ ...base, scenes: silentCut }, ctx), (e) => e.code === 'bad_input' && /s1 to s3 are one on-camera run/.test(e.message));

    const cast = await castInputs(ctx.workDir);
    const speaker = (k) => cast.scenes.map((s, i) => (i === 1 ? { ...s, speaker: k } : s));
    await assert.rejects(mod.run({ ...cast, scenes: speaker('zoe') }, ctx), (e) => e.code === 'bad_input' && /speaker "zoe" is not in the cast/.test(e.message));
    await assert.rejects(mod.run({ ...cast, scenes: speaker('theo') }, ctx), (e) => e.code === 'bad_input' && /2 speakers/.test(e.message));
    await assert.rejects(mod.run({ ...cast, scenes: cast.scenes.map((s) => ({ ...s, speaker: s.line ? 'theo' : null })) }, ctx), (e) => e.code === 'bad_input' && /cast member theo has no picture/.test(e.message));
    await assert.rejects(mod.run({ ...cast, cast: [cast.cast[0]], scenes: cast.scenes.map((s) => ({ ...s, speaker: null })) }, ctx), (e) => e.code === 'bad_input' && /no cast member has a picture/.test(e.message));
    await assert.rejects(mod.run({ ...cast, character: { image: cast.cast[1].image, identity: 'a woman in her 30s' } }, ctx), (e) => e.code === 'bad_input' && /not both/.test(e.message));
    await assert.rejects(mod.run({ ...cast, cast: [] }, ctx), (e) => e.code === 'bad_input' && /no creator/.test(e.message));
    const ageless = cast.cast.map((m) => (m.key === 'maya' ? { ...m, age: null } : m));
    await assert.rejects(mod.run({ ...cast, cast: ageless }, ctx), (e) => e.code === 'bad_input' && /cast member maya identity states no age/.test(e.message));
    assert.equal(orders.length, 0, 'nothing was ordered');
  });

  // The fake line with a chosen speech onset per take (sample.line starts every voice at 0.2 s).
  const lateLine = (onsets) => async (order, ctx) => {
    const name = order.results[0].name;
    const path = join(ctx.workDir, name);
    const d = order.body.duration;
    const ms = Math.round((onsets[order.piece] ?? 0.2) * 1000);
    await run('ffmpeg', ['-hide_banner', '-nostdin', '-y', '-f', 'lavfi', '-i', `testsrc2=size=360x640:rate=24:duration=${d}`, '-f', 'lavfi', '-i', `sine=frequency=300:duration=${d - 1}:sample_rate=48000`, '-filter_complex', `[1:a]adelay=${ms}:all=1,apad[a]`, '-map', '0:v', '-map', '[a]', '-c:v', 'libx264', '-preset', 'ultrafast', '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-ac', '1', '-t', String(d), path]);
    return { json: structuredClone(H3_REPLY.answer.json), files: { [name]: await fileRef(path, 'video') }, reused: false };
  };

  test('a join right after a one-word first take: the cutaway scene still starts at or before it, and spans stay in order', { skip }, async () => {
    const { ctx } = makeCtx({ partDir: dir, line: lateLine({ 'take-t2': 0.6 }) });
    const base = await cutawayInputs(ctx.workDir, { split_before: 'cutaways' });
    const scenes = [
      { id: 's1', line: 'Honestly.', speaker: 'maya', extra: { shot: 'creator' } },
      { ...base.scenes[1] },
      { id: 's3', line: words(27, 'honestly'), speaker: 'maya', extra: { shot: 'creator' } },
      base.scenes.at(-1),
    ];
    const out = await mod.run({ ...base, scenes, footage: [] }, ctx);
    assert.deepEqual(out.takes.map((t) => t.scene_ids), [['s1'], ['s2', 's3']]);
    const join = out.takes[1].joins_s;
    const s2 = out.timeline.scenes.find((s) => s.id === 's2');
    assert.ok(s2.start_s <= join, `s2 starts at ${s2.start_s}s, at or before the join at ${join}s`);
    out.timeline.scenes.forEach((s, i, all) => {
      assert.ok(s.start_s >= 0 && s.end_s > s.start_s, `${s.id} has a positive span`);
      if (i) assert.equal(s.start_s, all[i - 1].end_s);
    });
  });

  test('a late onset that would put the join at the reel start: the join is floored, both takes join, and the cutaway still covers it (3.9 words a second)', { skip }, async () => {
    const { ctx } = makeCtx({ partDir: dir, line: lateLine({ 'take-t2': 0.6 }) });
    const base = await cutawayInputs(ctx.workDir, { split_before: 'cutaways', words_per_second: 3.9 });
    const scenes = [
      { id: 's1', line: 'Honestly.', speaker: 'maya', extra: { shot: 'creator' } },
      { ...base.scenes[1], line: words(54, 'then') },
      base.scenes.at(-1),
    ];
    const out = await mod.run({ ...base, scenes, footage: [] }, ctx);
    assert.deepEqual(out.takes.map((t) => t.scene_ids), [['s1'], ['s2']]);
    const join = out.takes[1].joins_s;
    assert.ok(join >= 0.2, `the join at ${join}s is floored past the reel start`);
    // The first take's audio is cut at the end of the dissolve: its word must be said by then.
    const s1Speech = out.timeline.speech.find((s) => s.scene_id === 's1');
    assert.ok(s1Speech.end_s <= join + 0.1 + 1e-6, `s1's word ends at ${s1Speech.end_s}s, by the dissolve end at ${join + 0.1}s`);
    const s2 = out.timeline.scenes.find((s) => s.id === 's2');
    assert.ok(s2.start_s <= join, `s2 starts at ${s2.start_s}s, at or before the join at ${join}s`);
    out.timeline.scenes.forEach((s, i, all) => {
      assert.ok(s.start_s >= 0 && s.end_s > s.start_s, `${s.id} has a positive span`);
      if (i) assert.equal(s.start_s, all[i - 1].end_s);
    });
  });

  test('legacy character inputs build the same first-take prompt, seed and duration as 1.0.2, whatever the delivery', async () => {
    const old = await loadPart('creator-h3', '1.0.2');
    const firstOrder = async (part, partDir, delivery) => {
      let seen = null;
      const { ctx } = makeCtx({ partDir, line: async (order) => { seen = order; throw new Error('stop after the first order'); } });
      const inputs = await sample.inputs(ctx.workDir);
      if (delivery !== undefined) inputs.character = { ...inputs.character, delivery };
      await assert.rejects(part.run(inputs, ctx));
      assert.ok(seen, 'a take was ordered');
      return { piece: seen.piece, prompt: seen.body.prompt, seed: seen.body.seed, duration: seen.body.duration };
    };
    for (const delivery of [undefined, '', '   ', '  calm,\n  warm and slow  ']) {
      assert.deepEqual(await firstOrder(mod, dir, delivery), await firstOrder(old.mod, old.dir, delivery), `delivery ${JSON.stringify(delivery)}`);
    }
  });
}

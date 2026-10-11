import { test } from 'node:test';
import assert from 'node:assert/strict';
import { hasFfmpeg, loadNewest, makeCtx, probe } from '../../_tools/kit-harness.mjs';
import { ANSWER, POINTER, face, lineAudio, sample, veedClip } from './fixture.mjs';

const { dir, mod } = await loadNewest('lipsync-veed');
const ffmpeg = await hasFfmpeg();
const skip = !ffmpeg && 'ffmpeg is not installed';

function at(obj, pointer) {
  return pointer.split('/').slice(1).reduce((o, k) => (o == null ? undefined : o[k]), obj);
}

test('the fixture answer is the recorded veed reply, and the part reads its video at the pointer', () => {
  assert.equal(typeof at(ANSWER, POINTER), 'string');
  assert.match(at(ANSWER, POINTER), /^https:\/\//);
});

test('one piece per spoken line on its speaker\'s face, then one silent idle clip per face', { skip }, async () => {
  const { ctx, orders } = makeCtx({ partDir: dir, line: sample.line });
  const inputs = await sample.inputs(ctx.workDir);
  const out = await mod.run(inputs, ctx);
  assert.deepEqual(orders.map((o) => o.piece), ['clip-s1', 'clip-s2', 'clip-s4', 'idle-a', 'idle-b']);
  for (const o of orders) {
    assert.equal(o.provider, 'fal');
    assert.equal(o.path, 'veed/fabric-1.0', 'the path is the listed model, verbatim');
    assert.deepEqual(Object.keys(o.body).sort(), ['audio_url', 'image_url', 'resolution'], 'exactly the three inputs fal requires');
    assert.equal(o.body.resolution, '720p');
    assert.equal(o.body.image_url.kind, 'file', 'the face goes to the core as a file');
    assert.equal(o.body.audio_url.kind, 'file', 'the audio goes to the core as a file');
    assert.deepEqual(o.results, [{ pointer: '/json/video/url', name: `${o.piece}.mp4`, media: 'video' }]);
  }
  const faceSha = Object.fromEntries(inputs.faces.map((f) => [f.key, f.image.sha256]));
  const lineSha = Object.fromEntries(inputs.lines.map((l) => [l.scene_id, l.audio.sha256]));
  assert.equal(orders[0].body.image_url.sha256, faceSha.a);
  assert.equal(orders[1].body.image_url.sha256, faceSha.b);
  assert.equal(orders[2].body.image_url.sha256, faceSha.a);
  assert.equal(orders[0].body.audio_url.sha256, lineSha.s1);
  assert.equal(orders[1].body.audio_url.sha256, lineSha.s2);
  assert.equal(orders[2].body.audio_url.sha256, lineSha.s4);
  assert.equal(orders[3].body.image_url.sha256, faceSha.a);
  assert.equal(orders[4].body.image_url.sha256, faceSha.b);
  assert.equal(orders[3].body.audio_url.sha256, orders[4].body.audio_url.sha256, 'both idle clips share one silence');
  assert.ok(Math.abs(orders[3].body.audio_url.duration_s - 2) < 0.05, 'idle_seconds of silence');

  assert.deepEqual(out.clips.map((c) => c.id), ['s1', 's2', 's4'], 'the null-line scene has no clip');
  assert.deepEqual(out.idle.map((c) => c.key), ['a', 'b']);
  for (const c of out.clips) {
    const want = inputs.lines.find((l) => l.scene_id === c.id).audio.duration_s;
    assert.ok(Math.abs(c.seconds - want) < 0.1, `${c.id}: ${c.seconds}s for ${want}s of audio`);
    const info = await probe(c.video.path);
    assert.ok(info.has_video && info.has_audio);
  }
  for (const c of out.idle) assert.ok(Math.abs(c.seconds - 2) < 0.1);
});

test('a null line is skipped whoever speaks it, and no idle clips are made when idle_seconds is 0', { skip }, async () => {
  const { ctx, orders } = makeCtx({ partDir: dir, line: sample.line });
  const base = await sample.inputs(ctx.workDir);
  const scenes = [
    { id: 'intro', line: null, on_screen: null, picture: null },
    { id: 's2', line: 'Wait, completely?', speaker: 'b' },
    { id: 'beat', line: '   ', speaker: 'nobody' },
    { id: 'card', line: null, speaker: 'nobody', on_screen: 'Try it', picture: null },
  ];
  const lines = base.lines.filter((l) => l.scene_id === 's2');
  const out = await mod.run({ ...base, scenes, lines, idle_seconds: 0, max_seconds: 1 }, ctx);
  assert.deepEqual(orders.map((o) => o.piece), ['clip-s2']);
  assert.deepEqual(out.clips.map((c) => c.id), ['s2']);
  assert.deepEqual(out.idle, []);
});

test('with one face, scenes need no speaker; a scene with no id is its position; 480p is passed through', { skip }, async () => {
  const { ctx, orders } = makeCtx({ partDir: dir, line: sample.line });
  const solo = await face(ctx.workDir, 'host', '0x80c060');
  const lines = [await lineAudio(ctx.workDir, '1', 0.8, 400), await lineAudio(ctx.workDir, 'b2', 0.8, 600)];
  const out = await mod.run({ scenes: [{ line: 'Hello there.' }, { id: 'b2', line: 'And again.' }], lines, faces: [solo], resolution: '480p', max_seconds: 5 }, ctx);
  assert.deepEqual(orders.map((o) => o.piece), ['clip-1', 'clip-b2']);
  for (const o of orders) assert.equal(o.body.resolution, '480p');
  assert.deepEqual(out.clips.map((c) => c.id), ['1', 'b2']);
});

test('refuses a missing face or audio, a line for an unknown scene, duplicate scene ids, an unnamed speaker among several faces, duplicate keys, nothing to do, and more than max_seconds, before ordering anything', { skip }, async () => {
  const { ctx, orders } = makeCtx({ partDir: dir, line: sample.line });
  const base = await sample.inputs(ctx.workDir);
  const only = (id) => base.lines.filter((l) => l.scene_id === id);
  const refused = (inputs, re) => assert.rejects(mod.run(inputs, ctx), (e) => e.code === 'bad_input' && re.test(e.message), String(re));
  await refused({ ...base, scenes: [{ id: 's1', line: 'Hi.', speaker: 'c' }], lines: only('s1') }, /spoken by "c", who has no face/);
  await refused({ ...base, scenes: [{ id: 's1', line: 'Hi.' }], lines: only('s1') }, /no speaker, and there is more than one face/);
  await refused({ ...base, scenes: [{ id: 'zz', line: 'Hi.', speaker: 'a' }], lines: [] }, /scene zz has a line but no audio/);
  await refused({ ...base, faces: [base.faces[0], { ...base.faces[1], key: 'a' }] }, /two faces have the key "a"/);
  await refused({ ...base, lines: [...base.lines, base.lines[0]] }, /two lines are for scene s1/);
  await refused({ ...base, scenes: [...base.scenes, { id: 's1', line: 'Again.', speaker: 'b' }] }, /two scenes have the id s1/);
  await refused({ ...base, scenes: [{ id: '2', line: 'Hi.', speaker: 'a' }, { line: 'Yes.', speaker: 'b' }], lines: [] }, /two scenes have the id 2/);
  await refused({ ...base, scenes: base.scenes.filter((s) => s.id !== 's4') }, /lines has audio for scene s4, which is not in scenes/);
  await refused({ ...base, scenes: [{ id: 'x', line: null }], lines: [], idle_seconds: 0 }, /nothing|no scene has a line/);
  // 1.6 + 0.9 + 1.8 = 4.3 s of lines plus 2 faces x 2 s idle = 8.3 s.
  await refused({ ...base, max_seconds: 8 }, /need 8\.\d+s of lipsync, more than max_seconds 8/);
  await refused({ ...base, resolution: '1080p' }, /resolution/);
  await refused({ ...base, idle_seconds: 20 }, /idle_seconds/);
  assert.equal(orders.length, 0);
});

test('a clip far from its audio\'s length, or with no video, fails as provider_failed', { skip }, async () => {
  const short = makeCtx({ partDir: dir, line: (o, c) => veedClip(o, c, { short_s: 1.2 }) });
  await assert.rejects(mod.run(await sample.inputs(short.ctx.workDir), short.ctx), (e) => e.code === 'provider_failed' && /clip-s1 is/.test(e.message));
  assert.equal(short.orders.length, 1, 'stops at the first broken clip');
  const empty = makeCtx({ partDir: dir, line: () => ({ ...structuredClone(ANSWER), files: {}, reused: false }) });
  await assert.rejects(mod.run(await sample.inputs(empty.ctx.workDir), empty.ctx), (e) => e.code === 'provider_failed' && /no video for clip-s1/.test(e.message));
});

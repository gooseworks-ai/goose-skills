// dialogue-cut 1.0.0 on real media: plain, split and dynamic edits of stand-in
// lipsync clips (one solid colour per host) over a fixed voice track; a silent
// scene; the end card and its logo box; the grade; refusals; and the pure
// helpers behind the self-checks, the drift check and the size rule.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { join } from 'node:path';
import { countColor, fileRef, framePixels, hasFfmpeg, levelDb, loadNewest, makeCtx, makeTone, makeVideo, probe, run } from '../../_tools/kit-harness.mjs';
import { DCUT_MAX_BYTES, dcutChoosePlan, dcutClipRatio, dcutDrift, dcutMapZone, dcutProjectedBytes, dcutRateCap, dcutSceneTimes } from '../src/render.mjs';
import { dialoguePlan, dialoguePlanProblems, dialogueSettings } from '../src/plan.mjs';
import { PYTHON_PLANS } from './fixture.mjs';

const { dir, mod } = await loadNewest('dialogue-cut');
const ffmpeg = await hasFfmpeg();
const skip = !ffmpeg && 'ffmpeg is not installed';
const W = 360;
const H = 640;
const GAP = 0.12;
const COLOURS = { a: ['red', [255, 0, 0]], b: ['blue', [0, 0, 255]] };
const IDLE = { a: ['0x800000', [128, 0, 0]], b: ['0x000080', [0, 0, 128]] };
const GREEN = [0, 128, 0];
const YELLOW = [255, 255, 0];

async function solid(ctx, name, colour, seconds, size = '180x320') {
  const [w, h] = size.split('x').map(Number);
  return fileRef(await makeVideo(join(ctx.workDir, name), seconds, { width: w, height: h, fps: 25, tone: 0, pattern: `color=c=${colour}` }), 'video');
}

async function stillOf(ctx, name, colour) {
  const path = join(ctx.workDir, name);
  await run('ffmpeg', ['-hide_banner', '-nostdin', '-loglevel', 'error', '-y', '-f', 'lavfi', '-i', `color=c=${colour}:s=200x200:d=1`, '-frames:v', '1', path]);
  return fileRef(path, 'image');
}

/**
 * A dialogue the way voice-elevenlabs 1.1.0 and lipsync-veed 1.0.0 hand it on:
 * lines [id, speaker, seconds, extra?] read back to back with GAP after each
 * (but the last), spans running to the next line, speech per line, a voice
 * track as long as the read, and one clip per line `short` seconds shorter
 * than its line (Veed returns clips a hair short).
 */
async function dialogue(ctx, lines, { short = 0.02, idle = false } = {}) {
  const scenes = [];
  const spans = [];
  const speech = [];
  const clips = [];
  let at = 0;
  for (const [i, [id, speaker, seconds, extra]] of lines.entries()) {
    scenes.push({ id, line: `Line ${id} said by ${speaker}.`, speaker, on_screen: null, picture: null, ...(extra ? { extra } : {}) });
    const hold = i + 1 < lines.length ? GAP : 0;
    spans.push({ id, start_s: +at.toFixed(3), end_s: +(at + seconds + hold).toFixed(3) });
    speech.push({ scene_id: id, text: `Line ${id}.`, start_s: +at.toFixed(3), end_s: +(at + seconds).toFixed(3) });
    clips.push({ id, video: await solid(ctx, `clip-${id}.mp4`, COLOURS[speaker][0], +(seconds - short).toFixed(3)), seconds: +(seconds - short).toFixed(3) });
    at += seconds + hold;
  }
  const voice = await fileRef(await makeTone(join(ctx.workDir, 'voice.m4a'), +at.toFixed(3), { freq: 330, codec: ['-c:a', 'aac'] }), 'audio');
  const out = { scenes, spans, speech, clips, voice, cast: [{ key: 'a' }, { key: 'b' }] };
  if (idle) out.idle = [{ key: 'a', video: await solid(ctx, 'idle-a.mp4', IDLE.a[0], 6), seconds: 6 }, { key: 'b', video: await solid(ctx, 'idle-b.mp4', IDLE.b[0], 6), seconds: 6 }];
  return out;
}

/** The share of a frame region near a colour: 'full', 'top' (rows 6-31%, inside any seam from 0.37) or 'bottom' (rows 69-94%, below any seam up to 0.62). */
async function share(path, at, rgb, region = 'full') {
  const px = await framePixels(path, at, 36, 64);
  const [r0, r1] = { full: [0, 64], top: [4, 20], bottom: [44, 60] }[region];
  const data = px.data.subarray(r0 * 36 * 3, r1 * 36 * 3);
  return countColor({ data }, rgb, 40) / ((r1 - r0) * 36);
}
const mid = (c) => (c.start_s + c.end_s) / 2;

test('plain: one full-frame picture per line from its own clip, frame-exact on the voice, speech passed through', { skip }, async () => {
  const { ctx } = makeCtx({ partDir: dir });
  const d = await dialogue(ctx, [['s1', 'a', 1.2], ['s2', 'b', 0.9], ['s3', 'a', 1.0], ['s4', 'b', 1.1]]);
  const out = await mod.run({ ...d, mode: 'plain', width: W, height: H }, ctx);
  // 4.2 s of lines and three 0.12 s gaps = 4.56 s = 137 frames at 30 fps
  assert.equal(out.seconds, 4.567);
  assert.equal(out.seed, 4201);
  assert.deepEqual(out.cuts.map((c) => [c.scene_id, c.mode, c.show]), [['s1', 'single', 'a'], ['s2', 'single', 'b'], ['s3', 'single', 'a'], ['s4', 'single', 'b']]);
  assert.deepEqual(out.timeline.scenes.map((s) => [s.id, s.start_s, s.end_s]), [['s1', 0, 1.333], ['s2', 1.333, 2.333], ['s3', 2.333, 3.467], ['s4', 3.467, 4.567]]);
  assert.deepEqual(out.timeline.speech, d.speech);
  assert.equal(out.timeline.end_card, undefined);
  for (const c of out.cuts) assert.ok((await share(out.video.path, mid(c), COLOURS[c.show][1])) > 0.9, `${c.scene_id} shows ${c.show}`);
  const info = await probe(out.video.path);
  assert.equal(info.width, W);
  assert.equal(info.height, H);
  assert.ok(info.has_audio);
  assert.ok(Math.abs(info.duration_s - 4.567) < 0.05, `the cut is ${info.duration_s} s`);
  assert.ok((await levelDb(out.video.path, 0.2, 4.3, 330)) > -30, 'the voice is the sound');
});

test('split: speaker over the idle listener, a full-frame payoff, the end card with its logo box; a silent scene is skipped', { skip }, async () => {
  const { ctx } = makeCtx({ partDir: dir });
  const d = await dialogue(ctx, [['s1', 'a', 1.3], ['s2', 'b', 1.1], ['s3', 'a', 1.2], ['s4', 'b', 1.0], ['s5', 'a', 1.2], ['s6', 'b', 1.3]], { idle: true });
  // A beat with no line (critic #9): no span, no clip, no picture of its own.
  d.scenes.splice(3, 0, { id: 'pause', line: null, speaker: null, on_screen: null, picture: null });
  // A span and a speech entry for it (from some other timing producer) still give it no picture and no caption.
  d.spans.push({ id: 'pause', start_s: d.spans[2].end_s - 0.05, end_s: d.spans[2].end_s - 0.01 });
  d.spans.sort((x, y) => x.start_s - y.start_s);
  d.speech.push({ scene_id: 'pause', text: 'ghost', start_s: 0.1, end_s: 0.2 });
  const card = await solid(ctx, 'card.mp4', 'yellow', 1, '720x1280');
  const out = await mod.run({
    ...d,
    mode: 'split',
    ending: card,
    ending_timeline: { duration_s: 1, width: 720, height: 1280, fps: 30, scenes: [], speech: [], safe_zones: [{ use: 'logo', x: 200, y: 500, w: 320, h: 120 }] },
    width: W,
    height: H,
  }, ctx);
  assert.ok(!out.timeline.scenes.some((s) => s.id === 'pause'), 'the silent scene has no picture');
  assert.ok(!out.timeline.speech.some((e) => e.scene_id === 'pause'), 'the silent scene has no speech');
  const splits = out.cuts.filter((c) => c.mode === 'split');
  assert.ok(splits.length >= 4, `${splits.length} splits`);
  for (const c of splits) {
    const listener = c.show === 'a' ? 'b' : 'a';
    assert.ok((await share(out.video.path, mid(c), COLOURS[c.show][1], 'top')) > 0.9, `${c.scene_id}: ${c.show} on top`);
    assert.ok((await share(out.video.path, mid(c), IDLE[listener][1], 'bottom')) > 0.9, `${c.scene_id}: ${listener}'s idle clip below`);
  }
  const last = out.cuts.at(-1);
  assert.equal(last.scene_id, 's6');
  assert.equal(last.mode, 'single', 'the payoff line is one full-frame single');
  assert.ok((await share(out.video.path, mid(last), COLOURS.b[1])) > 0.9);
  // the card follows the dialogue: 7.1 s of lines + five 0.12 s gaps = 7.7 s (231 frames), then 30 frames
  const dlg = last.end_s;
  assert.equal(dlg, 7.7);
  assert.deepEqual(out.timeline.end_card, { start_s: 7.7, end_s: 8.7 });
  assert.equal(out.seconds, 8.7);
  assert.ok((await share(out.video.path, 8.2, YELLOW)) > 0.9, 'the end card');
  assert.deepEqual(out.timeline.safe_zones, [{ use: 'logo', x: 100, y: 250, w: 160, h: 60 }]);
  const info = await probe(out.video.path);
  assert.ok(Math.abs(info.duration_s - 8.7) < 0.05);
});

test('dynamic: cuts inside lines, reactions from the listener\'s own clip, reframes, a product panel; the plan passes its checks', { skip }, async () => {
  const { ctx, logs } = makeCtx({ partDir: dir });
  const golden = PYTHON_PLANS.find((p) => p.name === 'example/dynamic/seed 4201');
  const lines = golden.beats.map((b, i) => [`s${b.n}`, b.who.toLowerCase(), +(b.dur_sec - (i + 1 < golden.beats.length ? GAP : 0)).toFixed(3)]);
  const d = await dialogue(ctx, lines);
  const products = [{ id: 'jar', name: 'The jar', images: [await stillOf(ctx, 'jar.png', '0x008000')] }];
  const out = await mod.run({ ...d, mode: 'dynamic', products, width: W, height: H }, ctx);
  assert.equal(out.seed, 4201);
  assert.ok(out.cuts.length > lines.length, 'cuts inside lines');
  for (const c of out.cuts) assert.ok(c.end_s - c.start_s >= 0.49 && c.end_s - c.start_s <= 1.92, `${c.scene_id} cut ${c.start_s}-${c.end_s}`);
  for (let i = 1; i < out.cuts.length; i++) assert.equal(out.cuts[i].start_s, out.cuts[i - 1].end_s, 'the cuts tile the output');
  const reactions = out.cuts.filter((c) => c.mode === 'reaction');
  assert.ok(reactions.length, 'at least one reaction cut');
  for (const c of reactions) {
    const speaker = lines.find((l) => l[0] === c.scene_id)[1];
    assert.notEqual(c.show, speaker);
    assert.ok((await share(out.video.path, mid(c), COLOURS[c.show][1])) > 0.9, `reaction in ${c.scene_id} shows ${c.show}`);
  }
  const product = out.cuts.find((c) => c.mode === 'split' && c.framing.endsWith(':product'));
  assert.ok(product, 'a split with the product below');
  assert.ok((await share(out.video.path, mid(product), GREEN, 'bottom')) > 0.9, 'the product photo is the lower panel');
  assert.ok(new Set(out.cuts.map((c) => c.framing)).size >= 6, 'reframes');
  const drift = logs.find((l) => l[1] === 'speaker changes checked against the render');
  assert.ok(drift && drift[2].judged > 0 && Math.abs(drift[2].worst_s) <= 0.1, `drift ${JSON.stringify(drift && drift[2])}`);
});

test('the grade renders on the dialogue only and the encode carries the grain bitrate cap', { skip }, async () => {
  const { ctx } = makeCtx({ partDir: dir });
  const d = await dialogue(ctx, [['s1', 'a', 1.0], ['s2', 'b', 1.0]]);
  // a picture with mid tones and colour in it, where the lift and the saturation show
  for (const c of d.clips) c.video = await fileRef(await makeVideo(join(ctx.workDir, `pattern-${c.id}.mp4`), c.seconds, { width: 180, height: 320, fps: 25, tone: 0 }), 'video');
  const card = await solid(ctx, 'card.mp4', 'yellow', 1, '360x640');
  const out = await mod.run({ ...d, grade: 'warm-lift-grain', ending: card, width: W, height: H }, ctx);
  const { ctx: ctx2 } = makeCtx({ partDir: dir });
  const flat = await mod.run({ ...d, ending: card, width: W, height: H }, ctx2);
  const diff = (x, y) => x.data.reduce((s, v, i) => s + Math.abs(v - y.data[i]), 0) / x.data.length;
  const at = (path, t) => framePixels(path, t, 36, 64);
  assert.ok(diff(await at(out.video.path, 0.3), await at(flat.video.path, 0.3)) > 2, 'the dialogue is graded');
  assert.ok(diff(await at(out.video.path, 0.3), await at(out.video.path, 0.6)) > 0.3, 'the grain moves from frame to frame');
  assert.ok(diff(await at(out.video.path, out.seconds - 0.3), await at(flat.video.path, flat.seconds - 0.3)) < 1, 'the end card is not graded');
  assert.deepEqual(dcutRateCap('warm-lift-grain'), ['-maxrate', '8M', '-bufsize', '16M']);
  assert.deepEqual(dcutRateCap('none'), ['-maxrate', '16M', '-bufsize', '32M']);
});

test('refuses what it cannot cut, before drawing anything', { skip }, async () => {
  const { ctx } = makeCtx({ partDir: dir });
  const d = await dialogue(ctx, [['s1', 'a', 1.0], ['s2', 'b', 1.0], ['s3', 'a', 1.0]]);
  const refused = async (inputs, re) => {
    const { ctx: c2 } = makeCtx({ partDir: dir });
    await assert.rejects(mod.run({ width: W, height: H, ...inputs }, c2), (e) => e.code === 'bad_input' && re.test(e.message), String(re));
  };
  await refused({ ...d, scenes: d.scenes.map((s) => (s.id === 's2' ? { ...s, speaker: 'c' } : s)) }, /speaker "c" is not one of the hosts/);
  await refused({ ...d, spans: d.spans.filter((s) => s.id !== 's3') }, /s3 has a line but no span/);
  await refused({ ...d, clips: d.clips.filter((c) => c.id !== 's2') }, /s2 has a line but no clip/);
  await refused({ ...d, mode: 'split' }, /idle clip/);
  await refused({ ...d, cast: [{ key: 'a' }, { key: 'b' }, { key: 'c' }] }, /exactly two hosts; the cast has 3/);
  const { cast, ...noCast } = d;
  await refused({ ...noCast, scenes: d.scenes.map((s) => ({ ...s, speaker: 'a' })) }, /exactly two hosts; the lines have 1 speaker/);
  await refused({ ...d, seams: [0.9] }, /seams/);
  await refused({ ...d, mode: 'montage' }, /mode/);
  // dynamic with a host who never speaks, no idle clip and no picture: a reaction has nothing to show
  await refused({ ...d, scenes: d.scenes.map((s) => ({ ...s, speaker: 'a' })), mode: 'dynamic', bottom_sources: ['listener'] }, /speaks no line|picture/);
});

test('dcutChoosePlan: a plan that misses the framing band moves to the next seed; a missing picture is not a seed problem', () => {
  // one-sided/dynamic fails framing_biggest_share at seed 4201 in the recipe too (A:wide takes 21% of cuts)
  const c = PYTHON_PLANS.find((p) => p.name === 'one-sided/dynamic/seed 4201');
  assert.ok(c.expect.gates.includes('framing_biggest_share'));
  let t = 0;
  const beats = c.beats.map((b) => {
    const beat = { n: b.n, id: `s${b.n}`, who: b.who, start_s: t, end_s: t + b.dur_sec, dur_s: b.dur_sec, span_start_s: t, span_end_s: t + b.dur_sec, split: b.split, payoff: b.payoff };
    t += b.dur_sec;
    return beat;
  });
  const got = dcutChoosePlan(beats, ['A', 'B'], 'dynamic', { seed: 4201 }, { products: 1, end_card_s: 3.5 });
  assert.deepEqual(got.problems, []);
  assert.ok(got.seed > 4201, `seed ${got.seed}`);
  assert.equal(got.plan.seed, got.seed);
  const again = dcutChoosePlan(beats, ['A', 'B'], 'dynamic', { seed: 4201 }, { products: 1, end_card_s: 3.5 });
  assert.deepEqual(again.plan, got.plan, 'the walk is deterministic');
  const settings = dialogueSettings('dynamic', { seed: got.seed });
  assert.deepEqual(dialoguePlanProblems(dialoguePlan(beats, ['A', 'B'], settings, { products: 1, end_card_s: 3.5 }), beats, ['A', 'B'], settings, { products: 1 }), []);
  // a host who speaks no line, listener clips only, no product: every seed fails split_bottom_assets, so it stops at once
  const mono = beats.map((b) => ({ ...b, who: 'A' }));
  const bad = dcutChoosePlan(mono, ['A', 'B'], 'dynamic', { bottom_sources: ['listener'] }, { products: 0, end_card_s: 3.5 });
  assert.ok(bad.input && bad.tried === 1, JSON.stringify({ input: bad.input, tried: bad.tried }));
  assert.ok(bad.problems.some((p) => p.startsWith('split_bottom_assets')));
});

test('dcutDrift judges the speaker changes the detector saw, and only those', () => {
  assert.deepEqual(dcutDrift([1, 2, 3], [1.02, 2.06, 3.1]), { judged: 3, unseen: 0, worst_s: 0.1, bad: [] });
  const r = dcutDrift([1, 2, 4], [1.02, 2.3, 5]);
  assert.equal(r.judged, 2);
  assert.equal(r.unseen, 1, 'nothing near 4 s: not judged');
  assert.equal(r.bad.length, 1);
  assert.match(r.bad[0], /planned 2.00 s, the picture changed at 2.30 s \(\+0.30 s\)/);
  assert.deepEqual(dcutDrift([1], []), { judged: 0, unseen: 1, worst_s: 0, bad: [] });
  const text = '[Parsed_metadata_2 @ 0x1] frame:3   pts:120  pts_time:1.0\n[Parsed_metadata_2 @ 0x1] lavfi.scene_score=0.91\nframe:7 pts:280 pts_time:2.3333\nlavfi.scene_score=0.5\n';
  assert.deepEqual(dcutSceneTimes(text), [1, 2.3333]);
});

test('dcutClipRatio stretches a clip a hair short of its line and leaves a real mismatch alone', () => {
  assert.equal(dcutClipRatio(1.98, 2.0).stretched, true);
  assert.ok(Math.abs(dcutClipRatio(1.98, 2.0).ratio - 2 / 1.98) < 1e-9);
  assert.deepEqual(dcutClipRatio(1.5, 2.0), { ratio: 1, stretched: false });
  assert.deepEqual(dcutClipRatio(2.0, 2.0), { ratio: 1, stretched: false });
});

test('the size rule: a cut that could pass 180 MB is caught before encoding', () => {
  assert.ok(dcutProjectedBytes(60, 'none') < DCUT_MAX_BYTES);
  assert.ok(dcutProjectedBytes(100, 'none') > DCUT_MAX_BYTES);
  assert.ok(dcutProjectedBytes(150, 'warm-lift-grain') < DCUT_MAX_BYTES);
  assert.ok(dcutProjectedBytes(190, 'warm-lift-grain') > DCUT_MAX_BYTES);
});

test('dcutMapZone moves a logo box onto a smaller or cropped frame', () => {
  assert.deepEqual(dcutMapZone({ use: 'logo', x: 200, y: 500, w: 320, h: 120 }, 720, 1280, 360, 640), { use: 'logo', x: 100, y: 250, w: 160, h: 60 });
  assert.equal(dcutMapZone({ use: 'logo', x: 0, y: 0, w: 10, h: 10 }, 1920, 1080, 1080, 1920), null, 'a box cropped away is dropped');
});

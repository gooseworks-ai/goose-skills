// speech-recut end to end with the local ffmpeg: a made-up two-shot take with two spoken lines and
// dead air, re-cut and rendered at 30 fps; the sound and the timeline checked against the plan; the
// refusals. Runs the source (src/part.mjs) against its manifest (src/manifest.mjs), written to a
// scratch folder as part.json the way a version folder holds it.
import { test, before } from 'node:test';
import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileRef, framePixels, hasFfmpeg, levelDb, makeCtx, probe, run as runTool } from '../../_tools/kit-harness.mjs';
import { manifest } from '../src/manifest.mjs';
import { RECUT_MAX_BYTES, recutCheckSize, recutPictureCuts, run } from '../src/part.mjs';

const dir = mkdtempSync(join(tmpdir(), 'speech-recut-test-'));
const partDir = join(dir, 'part');
let take;
let mute;
let street;
let skip = false;

const w = (text, start, end) => ({ text, start_s: start, end_s: end });
const SCENES = [
  { id: 'q', line: 'What is in the can?', speaker: 'interviewer' },
  { id: 'a', line: 'Beer obviously', speaker: 'man' },
];
const SPEECH = [
  { scene_id: 'q', text: 'What is in the can?', spoken: 'What is in the can?', start_s: 0.5, end_s: 1.0, words: [w('What', 0.5, 0.6), w('is', 0.62, 0.7), w('in', 0.72, 0.8), w('the', 0.82, 0.9), w('can?', 0.92, 1.0)] },
  { scene_id: 'a', text: 'Beer obviously', spoken: 'Beer obviously', start_s: 3.0, end_s: 3.5, words: [w('Beer', 3.0, 3.2), w('obviously', 3.25, 3.5)] },
];
const TIMELINE = {
  duration_s: 4.5,
  width: 360,
  height: 640,
  fps: 24,
  scenes: [
    { id: 'q', start_s: 0, end_s: 2.0 },
    { id: 'a', start_s: 2.0, end_s: 4.5 },
  ],
  speech: [],
  safe_zones: [{ use: 'captions', x: 0, y: 400, w: 360, h: 120 }],
};

before(async () => {
  if (!(await hasFfmpeg())) {
    skip = true;
    return;
  }
  mkdirSync(partDir, { recursive: true });
  writeFileSync(join(partDir, 'part.json'), JSON.stringify(manifest, null, 2));
  // Shot 1 (0-2 s) then shot 2 (2-4.5 s), 24 fps like Seedance; a tone only where the words are.
  const path = join(dir, 'take.mp4');
  await runTool('ffmpeg', [
    '-hide_banner', '-nostdin', '-loglevel', 'error', '-y',
    '-f', 'lavfi', '-i', 'testsrc2=size=360x640:rate=24:duration=2',
    '-f', 'lavfi', '-i', 'smptebars=size=360x640:rate=24:duration=2.5',
    '-f', 'lavfi', '-i', 'sine=frequency=440:sample_rate=48000:duration=4.5',
    '-filter_complex', "[0:v][1:v]concat=n=2:v=1:a=0[v];[2:a]volume='if(between(t,0.5,1.0)+between(t,3.0,3.5),1,0)':eval=frame[a]",
    '-map', '[v]', '-map', '[a]', '-c:v', 'libx264', '-preset', 'ultrafast', '-pix_fmt', 'yuv420p', '-c:a', 'aac', path,
  ]);
  take = await fileRef(path, 'video');
  const mutePath = join(dir, 'mute.mp4');
  await runTool('ffmpeg', ['-hide_banner', '-nostdin', '-loglevel', 'error', '-y', '-i', path, '-an', '-c:v', 'copy', mutePath]);
  mute = await fileRef(mutePath, 'video');
  // The same picture over a street: white noise at about -45 dB under everything, with a lull about
  // 14 dB quieter at 1.5-2.6 s (dead air the cut removes), and the two lines on top.
  const streetPath = join(dir, 'street.mp4');
  await runTool('ffmpeg', [
    '-hide_banner', '-nostdin', '-loglevel', 'error', '-y',
    '-i', path,
    '-f', 'lavfi', '-i', 'anoisesrc=color=white:amplitude=0.01:sample_rate=48000:duration=4.5:seed=7',
    '-filter_complex', "[1:a]volume='if(between(t,1.5,2.6),0.2,1)':eval=frame[n];[0:a][n]amix=inputs=2:duration=first:normalize=0[a]",
    '-map', '0:v', '-map', '[a]', '-c:v', 'copy', '-c:a', 'aac', '-b:a', '192k', streetPath,
  ]);
  street = await fileRef(streetPath, 'video');
});

function ctxFor() {
  return makeCtx({ partDir, manifest });
}

const inputsFor = (extra = {}) => ({ video: take, timeline: TIMELINE, speech: SPEECH, scenes: SCENES, ...extra });

test('finds the take\'s own picture cut', async (t) => {
  if (skip) return t.skip('no ffmpeg');
  const { ctx } = ctxFor();
  const cuts = await recutPictureCuts(ctx, take);
  assert.equal(cuts.length, 1, `cuts ${cuts}`);
  assert.ok(Math.abs(cuts[0] - 2.0) <= 1 / 24 + 1e-6, `cut at ${cuts[0]}`);
});

test('re-cuts the take: dead air out, words kept, 30 fps, timeline re-timed', async (t) => {
  if (skip) return t.skip('no ffmpeg');
  const { ctx, logs } = ctxFor();
  const out = await run(inputsFor(), ctx);
  const info = await probe(out.video.path);
  assert.ok(info.has_audio && info.has_video);
  assert.ok(Math.abs(info.fps - 30) < 0.01, `fps ${info.fps}`);
  assert.equal(info.width, 360);
  assert.ok(Math.abs(info.duration_s - out.seconds) <= 0.1, `file ${info.duration_s}s vs plan ${out.seconds}s`);
  assert.ok(out.seconds > 1.9 && out.seconds < 2.2, `about 2.0 s left of 4.5 s, got ${out.seconds}`);
  assert.equal(out.timeline.fps, 30);
  assert.deepEqual(out.timeline.scenes.map((s) => s.id), ['q', 'a']);
  assert.deepEqual(out.timeline.safe_zones, TIMELINE.safe_zones);
  assert.deepEqual(out.cuts.map((c) => c.kind), ['head', 'dead_air', 'tail']);
  // The dead-air join takes in the picture cut at 2.0 s: the answer's scene starts at the join.
  const dead = out.cuts.find((c) => c.kind === 'dead_air');
  assert.ok(Math.abs(out.timeline.scenes[1].start_s - dead.at_s) < 1e-3, 'scene a starts at the join');
  // Sound: loud on every re-timed line, silent in the kept pause.
  // (lavfi's sine is at 1/8 of full scale, so a line is about -21 dB in the take itself.)
  for (const [k, e] of out.timeline.speech.entries()) {
    const was = await levelDb(take.path, SPEECH[k].start_s + 0.03, SPEECH[k].end_s - 0.03, 440);
    const lvl = await levelDb(out.video.path, e.start_s + 0.03, e.end_s - 0.03, 440);
    assert.ok(was > -30 && Math.abs(lvl - was) < 1.5, `line ${e.scene_id} at ${e.start_s}-${e.end_s} is ${lvl} dB, ${was} dB in the take`);
  }
  const q = out.timeline.speech[0];
  const a = out.timeline.speech[1];
  assert.ok(Math.abs(a.start_s - q.end_s - 0.25) <= 1 / 24 + 1e-3, `kept pause ${a.start_s - q.end_s}`);
  const gap = await levelDb(out.video.path, q.end_s + 0.06, a.start_s - 0.06);
  assert.ok(gap < -50, `the kept pause is ${gap} dB`);
  assert.ok(logs.some(([lvl, msg]) => lvl === 'info' && msg === 'speech-recut plan'));
});

test('a scene with a null line passes and its span is kept', async (t) => {
  if (skip) return t.skip('no ffmpeg');
  const { ctx } = ctxFor();
  const scenes = [SCENES[0], { id: 'beat', line: null, picture: 'He weighs the can' }, SCENES[1]];
  const timeline = {
    ...TIMELINE,
    scenes: [
      { id: 'q', start_s: 0, end_s: 1.4 },
      { id: 'beat', start_s: 1.4, end_s: 2.6 },
      { id: 'a', start_s: 2.6, end_s: 4.5 },
    ],
  };
  const out = await run(inputsFor({ scenes, timeline }), ctx);
  const beat = out.timeline.scenes.find((s) => s.id === 'beat');
  assert.ok(beat && Math.abs(beat.end_s - beat.start_s - 1.2) < 1e-3, JSON.stringify(out.timeline.scenes));
});

test('room tone: the bed is cut from the take\'s quietest speech-free window and laid under the whole edit', async (t) => {
  if (skip) return t.skip('no ffmpeg');
  const plain = await run(inputsFor({ video: street }), ctxFor().ctx);
  const { ctx, logs } = ctxFor();
  const out = await run(inputsFor({ video: street, room_tone: { from: 'quiet_window', gain_db: 12 } }), ctx);
  const found = logs.find(([lvl, msg]) => lvl === 'info' && msg === 'speech-recut room tone');
  assert.ok(found, 'the room-tone window is logged');
  const win = found[2];
  // In the lull, which the cut removes: sampled from the ORIGINAL take, and clear of both lines.
  assert.ok(win.start_s >= 1.5 - 0.05 && win.end_s <= 2.6 + 0.05, `window ${JSON.stringify(win)}`);
  assert.ok(win.end_s - win.start_s >= 0.4 - 1e-9);
  assert.ok(win.level_db < -50, `the lull is quiet: ${win.level_db} dB`);
  assert.equal(out.seconds, plain.seconds, 'the bed changes no timing');
  assert.deepEqual(out.timeline, plain.timeline);
  // The bed raises the air in the kept pause (about +2 dB at +12 dB on a lull 14 dB under the street)...
  const q = out.timeline.speech[0];
  const a = out.timeline.speech[1];
  const air = async (file) => levelDb(file, q.end_s + 0.06, a.start_s - 0.06);
  const lift = (await air(out.video.path)) - (await air(plain.video.path));
  assert.ok(lift > 0.8 && lift < 4.5, `the pause is ${lift.toFixed(2)} dB louder with the bed`);
  // ...and leaves the lines where they were.
  for (const e of out.timeline.speech) {
    const withBed = await levelDb(out.video.path, e.start_s + 0.03, e.end_s - 0.03, 440);
    const without = await levelDb(plain.video.path, e.start_s + 0.03, e.end_s - 0.03, 440);
    assert.ok(Math.abs(withBed - without) < 0.5, `line ${e.scene_id}: ${withBed} vs ${without} dB`);
  }
});

test('room tone: a take with no air between its lines gets no bed and a warning, never a guessed window', async (t) => {
  if (skip) return t.skip('no ffmpeg');
  const { ctx, logs } = ctxFor();
  const out = await run(inputsFor({ room_tone: { from: 'quiet_window' } }), ctx);
  assert.ok(out.seconds > 0);
  assert.ok(logs.some(([lvl, msg]) => lvl === 'warn' && /no room-tone bed/.test(msg)));
  assert.ok(!logs.some(([, msg]) => msg === 'speech-recut room tone'));
});

test('grade street-light lifts the blacks; the final encode carries the bitrate cap', async (t) => {
  if (skip) return t.skip('no ffmpeg');
  const plain = await run(inputsFor(), ctxFor().ctx);
  const { ctx } = ctxFor();
  const calls = [];
  const exec = ctx.tools.exec;
  ctx.tools.exec = (bin, args, options) => {
    calls.push(args);
    return exec(bin, args, options);
  };
  const out = await run(inputsFor({ grade: 'street-light' }), ctx);
  assert.equal(out.seconds, plain.seconds);
  const final = calls.find((a) => a.at(-1).endsWith('recut.mp4'));
  assert.ok(final, 'the final encode ran');
  const i = final.indexOf('-maxrate');
  assert.ok(i > 0 && final[i + 1] === '16M' && final[final.indexOf('-bufsize') + 1] === '32M', 'maxrate 16M, bufsize 32M');
  assert.ok(final.join(' ').includes('curves=all=0/0.03'), 'the grade is in the graph');
  // The darkest 1% of a frame of the bars shot (it has true black) sits higher once graded:
  // generated blacks lifted toward the real-footage band.
  const at = out.timeline.scenes[1].start_s + 0.2;
  const dark = async (file) => {
    const px = await framePixels(file, at);
    const luma = [];
    for (let k = 0; k < px.data.length; k += 3) luma.push((px.data[k] + px.data[k + 1] + px.data[k + 2]) / 3);
    luma.sort((x, y) => x - y);
    return luma[Math.floor(luma.length * 0.01)];
  };
  const before = await dark(plain.video.path);
  const after = await dark(out.video.path);
  assert.ok(after - before >= 4, `1st-percentile level ${before} -> ${after}`);
});

test('size rule: a finished video over 180 MB is refused as output_invalid', () => {
  const { ctx } = ctxFor();
  assert.equal(RECUT_MAX_BYTES, 180 * 1024 * 1024);
  const small = { kind: 'file', path: '/x.mp4', bytes: 1000 };
  assert.equal(recutCheckSize(ctx, small), small);
  assert.throws(() => recutCheckSize(ctx, { ...small, bytes: RECUT_MAX_BYTES + 1 }), (e) => e.code === 'output_invalid' && /over the 180\.0 MB/.test(e.message));
});

test('refuses: a line with no heard words, no sound, no timed words, a bad room tone or grade', async (t) => {
  if (skip) return t.skip('no ffmpeg');
  const refuse = async (inputs, re) => {
    const { ctx } = ctxFor();
    await assert.rejects(run(inputs, ctx), (e) => e.code === 'bad_input' && re.test(e.message));
  };
  await refuse(inputsFor({ speech: [SPEECH[0]] }), /scene a's line has no heard words/);
  await refuse(inputsFor({ video: mute }), /no sound/);
  await refuse(inputsFor({ speech: SPEECH.map(({ words, ...e }) => e) }), /no timed words/);
  await refuse(inputsFor({ room_tone: { from: 'loudest_window' } }), /room_tone/);
  await refuse(inputsFor({ grade: 'cinematic' }), /grade/);
  await refuse(inputsFor({ max_gap_s: 0.01 }), /max_gap_s/);
});

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileRef, hasFfmpeg, layerInputsFor, loadPart, makeCtx, makeVideo, run } from '../../_tools/kit-harness.mjs';
import { levelledCut, sample } from './fixture.mjs';

const { dir, mod } = await loadPart('check-layer', '1.0.0');
const ffmpeg = await hasFfmpeg();
const skip = !ffmpeg && 'ffmpeg is not installed';
const status = (out) => Object.fromEntries(out.verdict.checks.map((c) => [c.code, c.status]));

test('a cut that fits the style passes every check, and the check never changes it', { skip }, async () => {
  const { ctx, orders } = makeCtx({ partDir: dir, line: sample.line });
  const video = await levelledCut(ctx.workDir, 'good', 5);
  const words = join(ctx.workDir, 'words.json');
  writeFileSync(words, JSON.stringify({ words: [], cues: [{ text: 'Shop now', start_s: 1, end_s: 5 }] }));
  const inputs = await layerInputsFor(video, {
    expect: { duration_s: { min: 4, max: 8 }, speech: 'voiceover', captions: true, end_card: true, script: ['Shop the new range now.'] },
    timeline: { end_card: { start_s: 3, end_s: 5 }, speech: [{ text: 'Shop the new range now.', start_s: 0.5, end_s: 2 }] },
  });
  inputs.words = await fileRef(words, 'json');
  const out = await mod.run(inputs, ctx);
  assert.equal(out.verdict.pass, true, JSON.stringify(out.verdict.reasons));
  assert.deepEqual(status(out), { plays: 'pass', length: 'pass', size: 'pass', sound: 'pass', captions: 'pass', black_frames: 'pass', frozen_frames: 'pass', end_card: 'pass', speech_matches_script: 'pass' });
  assert.deepEqual(out.verdict.reasons, []);
  assert.equal(orders.length, 0, 'a voiceover is compared with its own lines, nothing is transcribed');
  assert.deepEqual(Object.keys(out), ['verdict']);
});

test("fails the server's checks with the server's reasons shape and a fix for the sound", { skip }, async () => {
  const { ctx } = makeCtx({ partDir: dir });
  const quiet = join(ctx.workDir, 'quiet.mp4');
  await makeVideo(quiet, 3, { width: 640, height: 640, tone: 440 });
  const q = join(ctx.workDir, 'quieter.mp4');
  await run('ffmpeg', ['-hide_banner', '-nostdin', '-y', '-i', quiet, '-c:v', 'copy', '-af', 'volume=-30dB', '-c:a', 'aac', q]);
  const inputs = await layerInputsFor(await fileRef(q, 'video'), { expect: { duration_s: { min: 6, max: 10 }, captions: true, sound: true } });
  const out = await mod.run(inputs, ctx);
  assert.equal(out.verdict.pass, false);
  const byCheck = Object.fromEntries(out.verdict.reasons.map((r) => [r.check, r]));
  assert.deepEqual(Object.keys(byCheck).sort(), ['captions', 'length', 'size', 'sound']);
  assert.equal(byCheck.length.message, 'The video is too short.');
  assert.equal(byCheck.size.found, '640x640');
  assert.equal(byCheck.sound.message, 'The sound is too quiet.');
  assert.equal(byCheck.captions.message, 'The captions are missing.');
  for (const r of out.verdict.reasons) for (const k of Object.keys(r)) assert.ok(['check', 'message', 'expected', 'found'].includes(k));
  assert.deepEqual(out.verdict.checks.find((c) => c.code === 'sound').fix, { slot: 'sound' });
});

test('catches black frames, a still opening and a missing end card', { skip }, async () => {
  const { ctx } = makeCtx({ partDir: dir });
  const video = await levelledCut(ctx.workDir, 'black', 4, { pattern: 'color=c=black' });
  const out = await mod.run(await layerInputsFor(video, { expect: { end_card: true } }), ctx);
  const s = status(out);
  assert.equal(s.black_frames, 'fail');
  assert.equal(s.frozen_frames, 'fail');
  assert.equal(s.end_card, 'fail');
  assert.deepEqual(out.verdict.checks.find((c) => c.code === 'end_card').fix, { slot: 'brand' });
});

test('on-camera speech is transcribed and a changed number fails against the script', { skip }, async () => {
  const { ctx, orders } = makeCtx({ partDir: dir, line: sample.line });
  const out = await mod.run(await sample.inputs(ctx.workDir), ctx);
  assert.equal(orders.length, 1);
  assert.equal(orders[0].path, '/fal-ai/whisper');
  assert.equal(status(out).speech_matches_script, 'fail');
  assert.equal(out.verdict.pass, false);
});

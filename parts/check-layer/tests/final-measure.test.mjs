// check-layer 1.6.0: the final measurements (gooseworks-final-measure/1). They fail on a custom,
// source-linked edit and warn on a template video; the thresholds are the contract's, with the
// 15 Oct amendments (start 1.5 s / end 3.0 s allowance, 2.0 s mid-video freeze, 80 Hz-8 kHz tones,
// intentional silence, end-card freeze up to 3.0 s).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { join } from 'node:path';
import { fileRef, hasFfmpeg, layerInputsFor, loadNewest, makeCtx, run } from '../../_tools/kit-harness.mjs';
import { fmAllowed, fmApprovedCallback, fmDhash, fmHamming, fmQuietRuns, fmTone, fmZeroRuns } from '../src/final-measure.mjs';

const { dir, mod } = await loadNewest('check-layer');
const skip = !(await hasFfmpeg()) && 'ffmpeg is not installed';
const W = 720;
const H = 1280;

/** A cut from pieces [{ seconds, video, audio }] (lavfi sources), 30 fps, 48 kHz stereo AAC. */
async function cut(workDir, name, pieces) {
  const args = ['-hide_banner', '-nostdin', '-loglevel', 'error', '-y'];
  const chains = [];
  pieces.forEach((p, i) => {
    args.push('-f', 'lavfi', '-t', String(p.seconds), '-i', `${p.video}=size=${W}x${H}:rate=30`);
    args.push('-f', 'lavfi', '-t', String(p.seconds), '-i', `${p.audio}`);
    chains.push(`[${2 * i}:v]format=yuv420p,setsar=1[v${i}];[${2 * i + 1}:a]aformat=sample_rates=48000:channel_layouts=stereo[a${i}]`);
  });
  const joined = pieces.map((_, i) => `[v${i}][a${i}]`).join('');
  const out = join(workDir, `${name}.mp4`);
  await run('ffmpeg', [...args, '-filter_complex', `${chains.join(';')};${joined}concat=n=${pieces.length}:v=1:a=1[v][a]`, '-map', '[v]', '-map', '[a]', '-c:v', 'libx264', '-preset', 'ultrafast', '-pix_fmt', 'yuv420p', '-c:a', 'aac', out]);
  return fileRef(out, 'video');
}

const NOISE = 'anoisesrc=color=pink:amplitude=0.25:sample_rate=48000:seed=7';
const SILENT = 'anullsrc=r=48000:cl=stereo';
const SINE = 'sine=frequency=440:sample_rate=48000';
const MOVING = 'testsrc2';

/** A minimal linked assembly_timeline (the kit validates the full shape). */
function assembly(durationMs, extra = {}) {
  return { format: 'gooseworks-assembly-timeline/1', duration_ms: durationMs, speech_mode: 'narration', soundtrack_modes: ['music'], segments: [], audio_cues: [], pauses: [], required_cue_ids: [], visual_overrides: [], ...extra };
}

async function measure(video, { linked = null, expect = {}, scenes } = {}) {
  const { ctx } = makeCtx({ partDir: dir });
  const timeline = { ...(scenes ? { scenes } : {}), ...(linked ? { assembly_timeline: linked } : {}) };
  const inputs = await layerInputsFor(video, { expect: { duration_s: { min: 1, max: 60 }, speech: 'none', captions: false, end_card: false, music: true, ...expect }, timeline });
  const out = await mod.run(inputs, ctx);
  const by = Object.fromEntries(out.verdict.checks.map((c) => [c.code, c]));
  const fm = Object.fromEntries(out.final_measure.checks.map((c) => [c.id, c]));
  return { out, by, fm };
}

test('pure helpers: zero and quiet runs, allowances, dHash distance', () => {
  const rate = 1000;
  const s = new Float32Array(5000).fill(0.2);
  s.fill(0, 1000, 2600);
  assert.deepEqual(fmZeroRuns(s, rate, 1.0), [[1, 2.6]]);
  assert.deepEqual(fmQuietRuns(s, rate, 0.1, -45, 1.0), [[1, 2.6]]);
  assert.equal(fmAllowed([0, 1.4], 10, 1.0), true, 'up to 1.5 s at the start');
  assert.equal(fmAllowed([0, 1.6], 10, 1.0), false);
  assert.equal(fmAllowed([7.2, 10], 10, 1.0), true, 'up to 3.0 s at the end');
  assert.equal(fmAllowed([6.8, 10], 10, 1.0), false);
  assert.equal(fmAllowed([4, 5.9], 10, 2.0), true, 'a mid-video freeze up to 2.0 s');
  assert.equal(fmAllowed([4, 6.1], 10, 2.0), false);
  const frame = { data: Uint8Array.from({ length: 72 }, (_, i) => (i * 37) % 251) };
  const a = fmDhash(frame);
  assert.equal(a.bits.length, 64);
  assert.equal(fmHamming(a.bits, a.bits), 0);
});

test('tone_only analyses 80 Hz to 8 kHz: a steady sine fails, a sub-bass line under noise does not', () => {
  const rate = 16000;
  const sine = Float32Array.from({ length: rate * 6 }, (_, i) => 0.5 * Math.sin((2 * Math.PI * 440 * i) / rate));
  assert.ok(fmTone(sine, rate).steady_share > 0.5);
  let seed = 1;
  const rand = () => ((seed = (seed * 16807) % 2147483647) / 2147483647) - 0.5;
  const bass = Float32Array.from({ length: rate * 6 }, (_, i) => 0.6 * Math.sin((2 * Math.PI * 47 * i) / rate) + 0.3 * rand());
  assert.ok(fmTone(bass, rate).steady_share <= 0.5, 'a steady 47 Hz bass line is below the band');
});

test('a custom edit fails a sine soundtrack; a template video only warns', { skip }, async () => {
  const video = await cut(makeCtx({ partDir: dir }).ctx.workDir, 'sine', [{ seconds: 6, video: MOVING, audio: SINE }]);
  const custom = await measure(video, { linked: assembly(6000) });
  assert.equal(custom.by.tone_only.status, 'fail');
  assert.equal(custom.out.verdict.pass, false);
  assert.equal(custom.fm.tone_only.result, 'fail');
  const template = await measure(video);
  assert.equal(template.by.tone_only.status, 'warn');
  assert.match(template.by.tone_only.message, /template videos/);
  const forced = await measure(video, { expect: { final_measure: 'block' } });
  assert.equal(forced.by.tone_only.status, 'fail', 'expect.final_measure: block fails a template video too');
});

test('digital silence mid-video fails; a silent tail up to 3.0 s and a silent start up to 1.5 s pass', { skip }, async () => {
  const w = makeCtx({ partDir: dir }).ctx.workDir;
  const gap = await cut(w, 'gap', [{ seconds: 3, video: MOVING, audio: NOISE }, { seconds: 2, video: MOVING, audio: SILENT }, { seconds: 3, video: MOVING, audio: NOISE }]);
  const g = await measure(gap, { linked: assembly(8000) });
  assert.equal(g.by.digital_silence.status, 'fail');
  assert.equal(g.by.unplanned_silence.status, 'fail');
  assert.ok(g.fm.digital_silence.intervals_ms.length >= 1);
  const edges = await cut(w, 'edges', [{ seconds: 1.2, video: MOVING, audio: SILENT }, { seconds: 4, video: MOVING, audio: NOISE }, { seconds: 2.6, video: MOVING, audio: SILENT }]);
  const e = await measure(edges, { linked: assembly(7800) });
  assert.equal(e.by.digital_silence.status, 'pass', e.by.digital_silence.message);
  assert.equal(e.by.unplanned_silence.status, 'pass', e.by.unplanned_silence.message);
});

test('an approved intentional-silence contract makes the silence checks not_applicable', { skip }, async () => {
  const video = await cut(makeCtx({ partDir: dir }).ctx.workDir, 'silent', [{ seconds: 5, video: MOVING, audio: SILENT }]);
  const quiet = await measure(video, { linked: assembly(5000, { speech_mode: 'none', soundtrack_modes: ['intentional_silence'] }) });
  assert.equal(quiet.by.digital_silence.status, 'not_applicable');
  assert.equal(quiet.by.unplanned_silence.status, 'not_applicable');
  const unchosen = await measure(video, { linked: assembly(5000) });
  assert.equal(unchosen.by.digital_silence.status, 'fail');
});

test('a mid-video freeze over 2.0 s fails unless planned; an end-card hold up to 3.0 s passes', { skip }, async () => {
  const w = makeCtx({ partDir: dir }).ctx.workDir;
  const frozen = await cut(w, 'frozen', [{ seconds: 3, video: MOVING, audio: NOISE }, { seconds: 2.6, video: 'smptebars', audio: NOISE }, { seconds: 3, video: MOVING, audio: NOISE }]);
  const f = await measure(frozen, { linked: assembly(8600) });
  assert.equal(f.by.frozen_picture.status, 'fail');
  const planned = await measure(frozen, { linked: assembly(8600, { visual_overrides: [{ kind: 'freeze', start_ms: 2900, end_ms: 5700, reason: 'held', source: {} }] }) });
  assert.equal(planned.by.planned_freeze_too_long.status, 'fail', 'a 2.8 s planned freeze mid-video is over the 1.5 s cap');
  assert.equal(planned.by.frozen_picture.status, 'fail', 'an over-long planned freeze does not cover the measured one');
  const card = await cut(w, 'card', [{ seconds: 5, video: MOVING, audio: NOISE }, { seconds: 2.8, video: 'smptebars', audio: NOISE }]);
  const c = await measure(card, { linked: assembly(7800, { visual_overrides: [{ kind: 'freeze', start_ms: 5000, end_ms: 7800, reason: 'end card', source: {} }] }) });
  assert.equal(c.by.frozen_picture.status, 'pass', c.by.frozen_picture.message);
  assert.equal(c.by.planned_freeze_too_long.status, 'pass');
});

test('a repeated shot fails unless the later one names an approved callback (1.8.0: callback: alone never clears it)', { skip }, async () => {
  const w = makeCtx({ partDir: dir }).ctx.workDir;
  const video = await cut(w, 'repeat', [
    { seconds: 1.8, video: 'smptebars', audio: NOISE },
    { seconds: 1.8, video: MOVING, audio: NOISE },
    { seconds: 1.8, video: 'smptebars', audio: NOISE },
  ]);
  const seg = (id, start, end, asset, intent) => ({ id, scene_id: id, start_ms: start, end_ms: end, video: { asset_id: asset, sha256: 'a'.repeat(64), in_ms: 0, out_ms: end - start, speed: 1 }, speech_mode: 'none', depicts_speech: false, native_audio: 'muted', ...(intent ? { intent } : {}) });
  const segments = [seg('a', 0, 1800, 'bars'), seg('b', 1800, 3600, 'moving'), seg('c', 3600, 5400, 'bars-again')];
  const r = await measure(video, { linked: assembly(5400, { segments }) });
  assert.equal(r.by.repeated_shot.status, 'fail', r.by.repeated_shot.found);
  const marked = { linked: assembly(5400, { segments: [segments[0], segments[1], seg('c', 3600, 5400, 'bars-again', 'callback: opening card, seen again')] }) };
  // The 15 Oct run's escape hatch: relabel the repeat after the check fails. It still fails.
  const alone = await measure(video, marked);
  assert.equal(alone.by.repeated_shot.status, 'fail');
  assert.match(alone.by.repeated_shot.found, /names no callback in the approved creative contract/);
  const other = await measure(video, { ...marked, expect: { approved_callbacks: ['the hook'] } });
  assert.equal(other.by.repeated_shot.status, 'fail', 'a name the contract does not list');
  const approved = await measure(video, { ...marked, expect: { approved_callbacks: ['Opening card'] } });
  assert.equal(approved.by.repeated_shot.status, 'pass', approved.by.repeated_shot.found);
});

test('fmApprovedCallback: the whole name or its first words, case-insensitive; nothing without a list', () => {
  assert.equal(fmApprovedCallback('callback: opening card', ['Opening card']), true);
  assert.equal(fmApprovedCallback('callback: opening card, seen again', ['opening card']), true);
  assert.equal(fmApprovedCallback('callback: opening cardboard', ['opening card']), false);
  assert.equal(fmApprovedCallback('callback: opening card', undefined), false);
  assert.equal(fmApprovedCallback('callback:', ['']), false);
  assert.equal(fmApprovedCallback('the opening card', ['the opening card']), false, 'not marked callback:');
});

test('planned pauses over 1.5 s, or over 10 % of the video, fail', { skip }, async () => {
  const video = await cut(makeCtx({ partDir: dir }).ctx.workDir, 'pauses', [{ seconds: 8, video: MOVING, audio: NOISE }]);
  const long = await measure(video, { linked: assembly(8000, { pauses: [{ start_ms: 2000, end_ms: 3700, scope: 'speech', reason: 'beat' }] }) });
  assert.equal(long.by.planned_pause_too_long.status, 'fail');
  const many = await measure(video, { linked: assembly(8000, { pauses: [{ start_ms: 1000, end_ms: 1500, scope: 'speech', reason: 'a' }, { start_ms: 3000, end_ms: 3500, scope: 'speech', reason: 'b' }] }) });
  assert.equal(many.by.planned_pause_too_long.status, 'fail', '1.0 s of pauses in 8 s is over 10 %');
  const fine = await measure(video, { linked: assembly(8000, { pauses: [{ start_ms: 1000, end_ms: 1400, scope: 'speech', reason: 'a' }] }) });
  assert.equal(fine.by.planned_pause_too_long.status, 'pass');
});

// check-layer 1.4.0 style flags: captions_cross_cuts, min_shot, ambience_floor, cut_contrast and
// distinct_adjacent_shots.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileRef, hasFfmpeg, layerInputsFor, loadNewest, makeCtx, run } from '../../_tools/kit-harness.mjs';
import { chkCueAcrossCut, chkFloorWindows, chkShortForFloor, chkJudgeAmbience, chkMeanDb, chkPercentile, chkSceneOpenings, chkShortShot, chkShotSound, chkShots, chkSpeechSpans } from '../src/shots.mjs';
import { levelledCut } from './fixture.mjs';

const { dir, mod, manifest } = await loadNewest('check-layer');
const ffmpeg = await hasFfmpeg();
const skip = !ffmpeg && 'ffmpeg is not installed';
const status = (out) => Object.fromEntries(out.verdict.checks.map((c) => [c.code, c.status]));
const check = (out, code) => out.verdict.checks.find((c) => c.code === code);
const ENC = ['-c:v', 'libx264', '-preset', 'ultrafast', '-pix_fmt', 'yuv420p', '-r', '30'];

/** Pictures (lavfi sources, `seconds` each) joined with hard cuts, over a 440 Hz tone levelled to -14 LUFS. */
async function joined(workDir, name, sources, seconds) {
  const out = join(workDir, `${name}.mp4`);
  const total = sources.length * seconds;
  const args = ['-hide_banner', '-nostdin', '-loglevel', 'error', '-y'];
  for (const src of sources) args.push('-f', 'lavfi', '-i', `${src}${src.includes('=') ? ':' : '='}size=720x1280:rate=30:duration=${seconds}`);
  args.push('-f', 'lavfi', '-i', `sine=frequency=440:duration=${total}:sample_rate=48000`);
  const v = sources.map((_, i) => `[${i}:v]`).join('');
  args.push('-filter_complex', `${v}concat=n=${sources.length}:v=1:a=0[v];[${sources.length}:a]loudnorm=I=-14:TP=-1.5:LRA=11[a]`, '-map', '[v]', '-map', '[a]', ...ENC, '-c:a', 'aac', '-ar', '48000', out);
  await run('ffmpeg', args);
  return fileRef(out, 'video');
}

/**
 * A 4 s picture whose sound is a 200 Hz room tone at `floorDb` (RMS, dB full scale; null for digital
 * silence) and, from 1 to 2 s, a 1 kHz "voice" at `speechDb`.
 */
async function roomTone(workDir, name, floorDb, speechDb) {
  const out = join(workDir, `${name}.mov`);
  // A sine of amplitude 1/8 has an RMS of -21 dB full scale.
  const tone = floorDb === null ? 'volume=0' : `volume=${floorDb + 21}dB`;
  await run('ffmpeg', [
    '-hide_banner', '-nostdin', '-loglevel', 'error', '-y',
    '-f', 'lavfi', '-i', 'testsrc2=size=720x1280:rate=30:duration=4',
    '-f', 'lavfi', '-i', 'sine=frequency=200:duration=4:sample_rate=48000',
    '-f', 'lavfi', '-i', 'sine=frequency=1000:duration=4:sample_rate=48000',
    '-filter_complex', `[1:a]${tone}[f];[2:a]volume=${speechDb + 21}dB,volume=0:enable='not(between(t,1,2))'[s];[f][s]amix=inputs=2:normalize=0[a]`,
    '-map', '0:v', '-map', '[a]', ...ENC, '-c:a', 'pcm_s16le', '-ar', '48000', out,
  ]);
  return fileRef(out, 'video');
}

async function withCues(ctx, inputs, cues) {
  const path = join(ctx.workDir, `words-${Math.random().toString(36).slice(2)}.json`);
  writeFileSync(path, JSON.stringify({ words: [], cues }));
  return { ...inputs, words: await fileRef(path, 'json') };
}

test('1.4.2 is the newest check layer and stays free with no network', () => {
  assert.equal(manifest.version, '1.4.2');
  assert.deepEqual([manifest.needs.network, manifest.needs.models, manifest.cost.basis], [false, [], 'free']);
});

test('refuses inputs outside the layer schema (a scene with no id, an unknown timeline key)', async () => {
  const { ctx } = makeCtx({ partDir: dir });
  const base = {
    video: { path: join(ctx.workDir, 'none.mp4') },
    timeline: { duration_s: 5, width: 720, height: 1280, fps: 30, scenes: [], speech: [] },
    brand: { name: 'Sample Goods', colors: {}, fonts: {}, pronunciations: [] },
    expect: { aspect: '9:16', width: 720, height: 1280, duration_s: { min: 1, max: 10 }, speech: 'none', captions: false, end_card: false, qc_flags: ['min_shot', 'ambience_floor'] },
  };
  await assert.rejects(mod.run({ ...base, timeline: { ...base.timeline, scenes: [{ start_s: 0, end_s: 2 }] } }, ctx), (e) => e.code === 'bad_input' && /id/.test(e.message));
  await assert.rejects(mod.run({ ...base, timeline: { ...base.timeline, shots: [] } }, ctx), (e) => e.code === 'bad_input' && /shots/.test(e.message));
  await assert.rejects(mod.run({ ...base, expect: { ...base.expect, qc_flags: 'min_shot' } }, ctx), (e) => e.code === 'bad_input' && /qc_flags/.test(e.message));
});

test('the shot maths: shots, the shortest shot, cues across cuts, room tone per shot', () => {
  const scenes = [{ id: 'a', start_s: 0, end_s: 2 }, { id: 'b', start_s: 2, end_s: 2.3 }, { id: 'c', start_s: 2.3, end_s: 6 }];
  assert.deepEqual(chkShots(scenes, 5), [[0, 2], [2, 2.3], [2.3, 5]], 'shots run cut to cut and stop at the body end');
  assert.deepEqual(chkShots([], 4), [[0, 4]], 'no scenes: the body is one shot');
  assert.deepEqual(chkShots(scenes, 0), []);
  assert.deepEqual(chkShortShot(chkShots(scenes, 5)), { start_s: 2, end_s: 2.3, seconds: 2.3 - 2 });
  assert.equal(chkShortShot([[0, 0.4], [0.4, 1]]), null, 'exactly 0.4 s is long enough');
  assert.equal(chkShortShot([[0, 2], [2, 2.2]]).end_s, 2.2, 'a short last shot before the end card counts');
  assert.deepEqual(chkShots([{ id: 'a', start_s: 0, end_s: 3.97 }, { id: 'b', start_s: 3.97, end_s: 4 }], 4), [[0, 3.97], [3.97, 4]], 'a one-frame flash at the end of the body is a shot');
  assert.equal(chkShortShot(chkShots([{ id: 'a', start_s: 0.03, end_s: 4 }], 4)).seconds, 0.03, 'and so is one at its start');
  assert.deepEqual(chkShots([{ id: 'a', start_s: 0.01, end_s: 3.99 }, { id: 'b', start_s: 3.99, end_s: 4 }], 4), [[0, 4]], 'a start within 0.02 s of an edge is frame rounding');

  const cue = (start_s, end_s) => ({ text: 'x', start_s, end_s });
  assert.equal(chkCueAcrossCut([cue(0.5, 2.1), cue(1.9, 4)], [2]), null, '0.15 s past a cut either side is allowed');
  assert.deepEqual(chkCueAcrossCut([cue(0.5, 1.9), cue(1.8, 2.5)], [2]), { cue: cue(1.8, 2.5), t: 2 });
  assert.equal(chkCueAcrossCut([cue(2, 3)], [2]), null, 'a cue that starts on the cut is inside its shot');

  assert.equal(chkPercentile([], 0.1), null);
  assert.equal(chkPercentile([5, 1, 3, 2, 4, 6, 7, 8, 9, 10], 0.1), 1);
  assert.equal(chkPercentile([5, 1, 3, 2, 4, 6, 7, 8, 9, 10, 11], 0.1), 2);
  assert.ok(Math.abs(chkMeanDb([-20, -20]) + 20) < 1e-9);
  assert.ok(Math.abs(chkMeanDb([-20, -Infinity]) + 20 + 10 * Math.log10(2)) < 1e-9, 'silence adds no power');
  assert.equal(chkMeanDb([-Infinity]), -Infinity);

  assert.deepEqual(chkFloorWindows([0, 0.12]), [[0, 0.12]], 'a shot too short for one window away from its edges is one window');
  assert.ok(chkShortForFloor([0, 0.12]) && !chkShortForFloor([0, 0.15]));
  assert.deepEqual(chkFloorWindows([1, 1]), []);
  assert.equal(chkFloorWindows([1, 2]).length, 18);
  assert.deepEqual(chkSpeechSpans([{ text: 'a b', start_s: 0, end_s: 2, words: [{ text: 'a', start_s: 0.2, end_s: 0.5 }, { text: 'b', start_s: 1, end_s: 1.5 }] }, { text: 'c', start_s: 3, end_s: 4 }]), [[0.2, 0.5], [1, 1.5], [3, 4]]);
  // Quiet windows at -45, speech windows at -20: the floor is read from the quiet ones.
  const windows = Array.from({ length: 20 }, (_, i) => [i * 0.05, i * 0.05 + 0.05]);
  const levels = windows.map(([a]) => (a >= 0.5 ? -20 : -45));
  const sound = chkShotSound(windows, levels, [[0.5, 1]]);
  assert.equal(sound.floor, -45);
  assert.ok(Math.abs(sound.speech + 20) < 1e-9);
  // Speech over the whole shot: the floor falls back to every window.
  assert.equal(chkShotSound(windows, levels, [[0, 1]]).floor, -45);
  assert.equal(chkShotSound(windows, levels, []).speech, null);

  const shot = [[0, 1]];
  assert.equal(chkJudgeAmbience(shot, [{ floor: -42, speech: -20 }]), null);
  assert.equal(chkJudgeAmbience(shot, [{ floor: -Infinity, speech: null }]).problem, 'silent');
  assert.equal(chkJudgeAmbience(shot, [{ floor: -60, speech: null }]).problem, 'low');
  assert.equal(chkJudgeAmbience(shot, [{ floor: -25, speech: -10 }]).problem, 'high');
  assert.equal(chkJudgeAmbience(shot, [{ floor: -40, speech: -36 }]).problem, 'speech');
  assert.equal(chkJudgeAmbience(shot, [{ floor: -40, speech: null }]), null, 'a shot nobody speaks in is judged on the band only');
  assert.equal(chkJudgeAmbience(shot, [{ floor: null, speech: null }]), null, 'a shot with no windows is not judged');
  const short = [[0, 1], [1, 1.1]];
  assert.equal(chkJudgeAmbience(short, [{ floor: -42, speech: null }, { floor: -Infinity, speech: null }]).problem, 'silent', 'a short shot that drops to silence fails');
  assert.equal(chkJudgeAmbience(short, [{ floor: -42, speech: null }, { floor: -20, speech: -20 }]), null, 'a short shot under speech is judged only for silence');

  assert.deepEqual(chkSceneOpenings([{ id: 'b', start_s: 2, end_s: 4 }, { id: 'a', start_s: 0, end_s: 2 }, { id: 'card', start_s: 4, end_s: 5 }], 4), [{ id: 'a', at: 0.05 }, { id: 'b', at: 2.05 }]);
  assert.deepEqual(chkSceneOpenings([{ id: 'a', start_s: 0, end_s: 0.06 }], 4), [{ id: 'a', at: 0.03 }], 'a very short scene is read in its middle');
});

test('captions_cross_cuts: a caption cue that runs across a cut, or on into the end card, warns', { skip }, async () => {
  const { ctx } = makeCtx({ partDir: dir });
  const video = await levelledCut(ctx.workDir, 'cues', 5);
  const timeline = { scenes: [{ id: 'a', start_s: 0, end_s: 2.5 }, { id: 'b', start_s: 2.5, end_s: 4 }], end_card: { start_s: 4, end_s: 5 } };
  const base = await layerInputsFor(video, { expect: { captions: true, speech: 'voiceover', qc_flags: ['captions_cross_cuts'] }, timeline });
  const inside = await mod.run(await withCues(ctx, base, [{ text: 'Shop the', start_s: 0.5, end_s: 2.6 }, { text: 'new range', start_s: 2.4, end_s: 3.9 }]), ctx);
  assert.equal(status(inside)['flag:captions_cross_cuts'], 'pass', JSON.stringify(check(inside, 'flag:captions_cross_cuts')));
  const across = await mod.run(await withCues(ctx, base, [{ text: 'Shop the new', start_s: 2, end_s: 3 }]), ctx);
  assert.equal(status(across)['flag:captions_cross_cuts'], 'warn');
  assert.match(check(across, 'flag:captions_cross_cuts').message, /"Shop the new".*2\.50/);
  assert.ok(!across.verdict.reasons.some((r) => r.check === 'flag:captions_cross_cuts'), 'a warning is not a failure');
  const intoCard = await mod.run(await withCues(ctx, base, [{ text: 'now', start_s: 3, end_s: 4.6 }]), ctx);
  assert.equal(status(intoCard)['flag:captions_cross_cuts'], 'warn', 'the end card starts a new shot');
  const none = await mod.run(base, ctx);
  assert.equal(status(none)['flag:captions_cross_cuts'], 'not_applicable', 'no captions to judge');
  // retained_body: the join between the new opening and the kept video is a cut even when no scene starts there.
  const gap = { scenes: [{ id: 'hook', start_s: 0, end_s: 2 }, { id: 'kept', start_s: 2.4, end_s: 5 }] };
  const hooked = await layerInputsFor(video, { expect: { captions: true, speech: 'voiceover', qc_flags: ['retained_body', 'captions_cross_cuts'] }, timeline: gap });
  const overJoin = await mod.run(await withCues(ctx, hooked, [{ text: 'and more', start_s: 1.5, end_s: 2.5 }]), ctx);
  assert.equal(status(overJoin)['flag:captions_cross_cuts'], 'warn', JSON.stringify(check(overJoin, 'flag:captions_cross_cuts')));
  assert.match(check(overJoin, 'flag:captions_cross_cuts').message, /2\.00/);
  const beforeJoin = await mod.run(await withCues(ctx, hooked, [{ text: 'and more', start_s: 0.5, end_s: 1.9 }]), ctx);
  assert.equal(status(beforeJoin)['flag:captions_cross_cuts'], 'pass', JSON.stringify(check(beforeJoin, 'flag:captions_cross_cuts')));
});

test('min_shot: a shot under 0.4 s warns; the shortest shot is reported', { skip }, async () => {
  const { ctx } = makeCtx({ partDir: dir });
  const video = await levelledCut(ctx.workDir, 'shots', 5);
  const expect = { qc_flags: ['min_shot'] };
  const short = await mod.run(await layerInputsFor(video, { expect, timeline: { scenes: [{ id: 'a', start_s: 0, end_s: 2 }, { id: 'b', start_s: 2, end_s: 2.3 }, { id: 'c', start_s: 2.3, end_s: 5 }] } }), ctx);
  assert.equal(status(short)['flag:min_shot'], 'warn');
  assert.equal(check(short, 'flag:min_shot').found, 0.3);
  assert.equal(short.verdict.pass, true, JSON.stringify(short.verdict.reasons));
  const fine = await mod.run(await layerInputsFor(video, { expect, timeline: { scenes: [{ id: 'a', start_s: 0, end_s: 2 }, { id: 'b', start_s: 2, end_s: 2.5 }, { id: 'c', start_s: 2.5, end_s: 5 }] } }), ctx);
  assert.equal(status(fine)['flag:min_shot'], 'pass');
  assert.equal(check(fine, 'flag:min_shot').found, 0.5);
  // A shot cut short by the end card counts; the card itself is not a shot.
  const beforeCard = await mod.run(await layerInputsFor(video, { expect, timeline: { scenes: [{ id: 'a', start_s: 0, end_s: 3.8 }, { id: 'b', start_s: 3.8, end_s: 4 }], end_card: { start_s: 4, end_s: 5 } } }), ctx);
  assert.equal(status(beforeCard)['flag:min_shot'], 'warn');
  const none = await mod.run(await layerInputsFor(video, { expect }), ctx);
  assert.equal(status(none)['flag:min_shot'], 'not_applicable');
});

test('ambience_floor: room tone in its band under every shot, clear of the speech; out of it warns', { skip }, async () => {
  const { ctx } = makeCtx({ partDir: dir });
  const w = ctx.workDir;
  const timeline = { scenes: [{ id: 'a', start_s: 0, end_s: 2 }, { id: 'b', start_s: 2, end_s: 4 }], speech: [{ text: 'hello there', start_s: 1, end_s: 2 }] };
  const expect = { speech: 'voiceover', duration_s: { min: 1, max: 10 }, qc_flags: ['ambience_floor'] };
  const judge = async (name, floorDb, speechDb) => mod.run(await layerInputsFor(await roomTone(w, name, floorDb, speechDb), { expect, timeline }), ctx);
  const good = await judge('good', -42, -20);
  assert.equal(status(good)['flag:ambience_floor'], 'pass', JSON.stringify(check(good, 'flag:ambience_floor')));
  assert.ok(Math.abs(check(good, 'flag:ambience_floor').found + 42) < 1.5, String(check(good, 'flag:ambience_floor').found));
  const silent = await judge('silent', null, -20);
  assert.equal(status(silent)['flag:ambience_floor'], 'warn');
  assert.equal(check(silent, 'flag:ambience_floor').found, 'silent');
  const low = await judge('low', -60, -20);
  assert.equal(status(low)['flag:ambience_floor'], 'warn');
  assert.match(check(low, 'flag:ambience_floor').message, /too quiet/);
  const loud = await judge('loud', -26, -10);
  assert.equal(status(loud)['flag:ambience_floor'], 'warn');
  assert.match(check(loud, 'flag:ambience_floor').message, /too loud/);
  const close = await judge('close', -40, -37);
  assert.equal(status(close)['flag:ambience_floor'], 'warn');
  assert.match(check(close, 'flag:ambience_floor').message, /does not stand out/);
  for (const out of [silent, low, loud, close]) assert.ok(!out.verdict.reasons.some((r) => r.check === 'flag:ambience_floor'));
});

test('cut_contrast: a cut that barely or only a little changes the picture warns; a clear one passes', { skip }, async () => {
  const { ctx } = makeCtx({ partDir: dir });
  const w = ctx.workDir;
  const expect = { qc_flags: ['cut_contrast'] };
  const timeline = { scenes: [{ id: 'a', start_s: 0, end_s: 2 }, { id: 'b', start_s: 2, end_s: 4 }] };
  const clear = await mod.run(await layerInputsFor(await joined(w, 'clear', ['testsrc2', 'color=c=red'], 2), { expect, timeline }), ctx);
  assert.equal(status(clear)['flag:cut_contrast'], 'pass', JSON.stringify(check(clear, 'flag:cut_contrast')));
  const same = await mod.run(await layerInputsFor(await joined(w, 'same', ['color=c=0x606060', 'color=c=0x606060'], 2), { expect, timeline }), ctx);
  assert.equal(status(same)['flag:cut_contrast'], 'warn');
  assert.match(check(same, 'flag:cut_contrast').message, /2\.00 seconds.*jump/);
  const small = await mod.run(await layerInputsFor(await joined(w, 'small', ['color=c=0x606060', 'color=c=0x7c7c7c'], 2), { expect, timeline }), ctx);
  assert.equal(status(small)['flag:cut_contrast'], 'warn', JSON.stringify(check(small, 'flag:cut_contrast')));
  // (The still colours fail frozen_frames; the warning itself is not a reason.)
  assert.ok(!small.verdict.reasons.some((r) => r.check === 'flag:cut_contrast'), 'a warning does not fail the video');
  assert.ok(check(small, 'flag:cut_contrast').found >= 25 && check(small, 'flag:cut_contrast').found < 32);
  const none = await mod.run(await layerInputsFor(await joined(w, 'one', ['testsrc2'], 2), { expect }), ctx);
  assert.equal(status(none)['flag:cut_contrast'], 'not_applicable');
});

test('distinct_adjacent_shots: two scenes in a row that open on the same picture warn', { skip }, async () => {
  const { ctx } = makeCtx({ partDir: dir });
  const w = ctx.workDir;
  const expect = { qc_flags: ['distinct_adjacent_shots'] };
  const timeline = { scenes: [{ id: 'look-1', start_s: 0, end_s: 2 }, { id: 'look-2', start_s: 2, end_s: 4 }] };
  const twice = await mod.run(await layerInputsFor(await joined(w, 'twice', ['testsrc2', 'testsrc2'], 2), { expect, timeline }), ctx);
  assert.equal(status(twice)['flag:distinct_adjacent_shots'], 'warn', JSON.stringify(check(twice, 'flag:distinct_adjacent_shots')));
  assert.match(check(twice, 'flag:distinct_adjacent_shots').message, /look-1 and look-2/);
  const distinct = await mod.run(await layerInputsFor(await joined(w, 'distinct', ['testsrc2', 'color=c=red'], 2), { expect, timeline }), ctx);
  assert.equal(status(distinct)['flag:distinct_adjacent_shots'], 'pass', JSON.stringify(check(distinct, 'flag:distinct_adjacent_shots')));
  const one = await mod.run(await layerInputsFor(await joined(w, 'single', ['testsrc2'], 2), { expect, timeline: { scenes: [{ id: 'a', start_s: 0, end_s: 2 }] } }), ctx);
  assert.equal(status(one)['flag:distinct_adjacent_shots'], 'not_applicable');
});

test('retained_body: the 1.4.0 flags judge only the new opening', { skip }, async () => {
  const { ctx } = makeCtx({ partDir: dir });
  const video = await joined(ctx.workDir, 'kept', ['testsrc2', 'testsrc2', 'testsrc2'], 2);
  // The kept body repeats one clip with a 0.2 s shot in it; only the opening (0 to 2 s) is judged.
  const timeline = { scenes: [{ id: 'hook', start_s: 0, end_s: 2 }, { id: 'kept-1', start_s: 2, end_s: 4 }, { id: 'kept-2', start_s: 4, end_s: 4.2 }, { id: 'kept-3', start_s: 4.2, end_s: 6 }] };
  const out = await mod.run(await layerInputsFor(video, { expect: { qc_flags: ['retained_body', 'min_shot', 'distinct_adjacent_shots', 'cut_contrast'] }, timeline }), ctx);
  const s = status(out);
  assert.equal(s['flag:retained_body'], 'pass');
  assert.equal(s['flag:min_shot'], 'pass', JSON.stringify(check(out, 'flag:min_shot')));
  assert.equal(s['flag:distinct_adjacent_shots'], 'not_applicable', 'one scene inside the opening');
  assert.equal(s['flag:cut_contrast'], 'not_applicable', 'no cut inside the opening');
  assert.equal(out.verdict.pass, true, JSON.stringify(out.verdict.reasons));
  // Judged as a whole video, the same cut warns on them.
  const whole = await mod.run(await layerInputsFor(video, { expect: { qc_flags: ['min_shot', 'distinct_adjacent_shots', 'cut_contrast'] }, timeline }), ctx);
  assert.deepEqual([status(whole)['flag:min_shot'], status(whole)['flag:distinct_adjacent_shots']], ['warn', 'warn']);
});

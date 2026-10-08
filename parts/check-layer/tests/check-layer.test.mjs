import { test } from 'node:test';
import assert from 'node:assert/strict';
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { browserMissing, browserProviderOrNull, loadNewest, fileRef, hasFfmpeg, layerInputsFor, loadPart, makeCtx, makeLogo, makeTone, makeVideo, run, sampleBrand } from '../../_tools/kit-harness.mjs';
import { levelledCut } from './fixture.mjs';

const { dir, mod } = await loadNewest('check-layer');
const ffmpeg = await hasFfmpeg();
const skip = !ffmpeg && 'ffmpeg is not installed';
const status = (out) => Object.fromEntries(out.verdict.checks.map((c) => [c.code, c.status]));

test('a cut that fits the style passes every check, and the check never changes it', { skip }, async () => {
  const { ctx } = makeCtx({ partDir: dir });
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
  assert.deepEqual(status(out), { plays: 'pass', length: 'pass', size: 'pass', sound: 'pass', captions: 'pass', black_frames: 'pass', frozen_frames: 'pass', end_card: 'pass', captions_safe_zone: 'not_applicable', logo: 'not_applicable', speech_matches_script: 'pass' });
  assert.deepEqual(out.verdict.reasons, []);
  assert.deepEqual(Object.keys(out), ['verdict']);
});

test("fails the server's checks with the server's reasons shape and a fix for the sound", { skip }, async () => {
  const { ctx } = makeCtx({ partDir: dir });
  const quiet = join(ctx.workDir, 'quiet.mp4');
  await makeVideo(quiet, 3, { width: 640, height: 640, tone: 440 });
  const q = join(ctx.workDir, 'quieter.mp4');
  await run('ffmpeg', ['-hide_banner', '-nostdin', '-loglevel', 'error', '-y', '-i', quiet, '-c:v', 'copy', '-af', 'volume=-30dB', '-c:a', 'aac', q]);
  const inputs = await layerInputsFor(await fileRef(q, 'video'), { expect: { duration_s: { min: 6, max: 10 }, captions: true } });
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

test('catches black frames, a still opening and an end card that does not end the video', { skip }, async () => {
  const { ctx } = makeCtx({ partDir: dir });
  const video = await levelledCut(ctx.workDir, 'black', 4, { pattern: 'color=c=black' });
  const out = await mod.run(await layerInputsFor(video, { expect: { end_card: true }, timeline: { end_card: { start_s: 1, end_s: 2 } } }), ctx);
  const s = status(out);
  assert.equal(s.black_frames, 'fail');
  assert.equal(s.frozen_frames, 'fail');
  assert.equal(s.end_card, 'fail');
  assert.deepEqual(out.verdict.checks.find((c) => c.code === 'end_card').fix, { slot: 'brand' });
  const unmarked = await mod.run(await layerInputsFor(video, { expect: { end_card: true } }), ctx);
  assert.equal(status(unmarked).end_card, 'fail', 'an end card the style needs but no step marked fails');
  assert.equal(unmarked.verdict.pass, false);
});

test('on-camera speech is checked from the transcript in the timeline; untranscribed speech fails; nothing is ordered', { skip }, async () => {
  const { ctx } = makeCtx({ partDir: dir });
  assert.equal(ctx.line, undefined, 'the check layer has no private line');
  const video = await levelledCut(ctx.workDir, 'on-camera', 4);
  const expect = { speech: 'on_camera', script: ['Try it for 30 days.'], duration_s: { min: 2, max: 10 } };
  const said = (spoken) => ({ speech: [{ scene_id: 's1', text: 'Try it for 30 days.', ...(spoken === undefined ? {} : { spoken }), start_s: 0.2, end_s: 2 }] });
  const wrong = await mod.run(await layerInputsFor(video, { expect, timeline: said('Try it for 13 days.') }), ctx);
  assert.equal(status(wrong).speech_matches_script, 'fail', 'a changed number fails');
  const right = await mod.run(await layerInputsFor(video, { expect, timeline: said('try it for thirty days') }), ctx);
  assert.equal(status(right).speech_matches_script, 'pass', 'the same speech written differently passes');
  const untranscribed = await mod.run(await layerInputsFor(video, { expect, timeline: said(undefined) }), ctx);
  assert.equal(status(untranscribed).speech_matches_script, 'fail', 'on-camera speech with no transcript cannot pass');
  const { manifest } = await loadNewest('check-layer');
  assert.deepEqual([manifest.needs.network, manifest.needs.models, manifest.cost.basis], [false, [], 'free']);
});

test('a silent cut with no speech planned (no music chosen) is not failed for sound; with speech it is', { skip }, async () => {
  const { ctx } = makeCtx({ partDir: dir });
  const pic = join(ctx.workDir, 'pic.mp4');
  await makeVideo(pic, 5, { width: 720, height: 1280, tone: 0 });
  const silent = join(ctx.workDir, 'silent.mp4');
  await run('ffmpeg', ['-hide_banner', '-nostdin', '-loglevel', 'error', '-y', '-i', pic, '-f', 'lavfi', '-t', '5', '-i', 'anullsrc=channel_layout=stereo:sample_rate=48000', '-c:v', 'copy', '-c:a', 'aac', '-shortest', silent]);
  const video = await fileRef(silent, 'video');
  const quiet = await mod.run(await layerInputsFor(video, { expect: { speech: 'none' } }), ctx);
  assert.equal(status(quiet).sound, 'not_applicable');
  assert.equal(quiet.verdict.pass, true, JSON.stringify(quiet.verdict.reasons));
  const spoken = await mod.run(await layerInputsFor(video, { expect: { speech: 'voiceover' } }), ctx);
  assert.equal(status(spoken).sound, 'fail');
});

test('captions outside the safe zone, or in the platform bands, fail', { skip }, async () => {
  const { ctx } = makeCtx({ partDir: dir });
  const video = await levelledCut(ctx.workDir, 'cap', 5);
  const words = join(ctx.workDir, 'words.json');
  const inside = { text: 'Shop now', start_s: 1, end_s: 5, box: { x: 300, y: 700, w: 120, h: 40 } };
  const inBottomBand = { text: 'Shop now', start_s: 1, end_s: 5, box: { x: 300, y: 1100, w: 120, h: 40 } };
  for (const [cue, want] of [[inside, 'pass'], [inBottomBand, 'fail']]) {
    writeFileSync(words, JSON.stringify({ words: [], cues: [cue] }));
    const inputs = await layerInputsFor(video, { expect: { captions: true, speech: 'voiceover' } });
    inputs.words = await fileRef(words, 'json');
    assert.equal(status(await mod.run(inputs, ctx)).captions_safe_zone, want, JSON.stringify(cue.box));
  }
});

const withBrowser = ffmpeg && browserProviderOrNull();
test("the brand's own logo is found on the end card and another is not; the style's measurable flags count", { skip: !withBrowser && (browserMissing() || 'ffmpeg is not installed') }, async () => {
  const { ctx } = makeCtx({ partDir: dir });
  const w = ctx.workDir;
  const brand = await sampleBrand(w);
  const ec = await loadNewest('end-card');
  const card = await ec.mod.run({ brand, width: 720, height: 1280, seconds: 2 }, makeCtx({ partDir: ec.dir }).ctx);
  const body = join(w, 'body.mp4');
  await run('ffmpeg', ['-hide_banner', '-nostdin', '-loglevel', 'error', '-y', '-f', 'lavfi', '-i', 'testsrc2=size=720x1280:rate=30:duration=3', '-f', 'lavfi', '-i', 'sine=frequency=440:duration=3', '-c:v', 'libx264', '-preset', 'ultrafast', '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-shortest', body]);
  const cut = join(w, 'cut.mp4');
  await run('ffmpeg', ['-hide_banner', '-nostdin', '-loglevel', 'error', '-y', '-i', body, '-i', card.video.path, '-filter_complex', '[0:v][0:a][1:v][1:a]concat=n=2:v=1:a=1[v][a]', '-map', '[v]', '-map', '[a]', '-c:v', 'libx264', '-preset', 'ultrafast', '-pix_fmt', 'yuv420p', '-c:a', 'aac', cut]);
  const video = await fileRef(cut, 'video');
  const expect = { end_card: true, qc_flags: ['logo_visible', 'footage_moves', 'text_legible'] };
  const timeline = { end_card: { start_s: 3, end_s: 5 } };
  const right = await mod.run(await layerInputsFor(video, { brand, expect, timeline }), ctx);
  assert.equal(status(right).logo, 'pass');
  assert.equal(status(right)['flag:logo_visible'], 'pass');
  assert.equal(status(right)['flag:footage_moves'], 'pass');
  assert.equal(status(right)['flag:text_legible'], 'not_applicable', 'a flag that needs eyes is reported as not checked');
  const other = await fileRef(await makeLogo(join(w, 'other.png'), '#20a040', 300, 300), 'image');
  const wrong = await mod.run(await layerInputsFor(video, { brand: { ...brand, logo: other }, expect, timeline }), ctx);
  assert.equal(status(wrong).logo, 'fail');
  assert.equal(wrong.verdict.pass, false);
  // logo_visible is checked on its own flag, even when the style does not end on a card.
  const noCard = await mod.run(await layerInputsFor(video, { brand, expect: { end_card: false, qc_flags: ['logo_visible'] } }), ctx);
  assert.equal(status(noCard)['flag:logo_visible'], 'pass');
  assert.equal(status(noCard).logo, 'not_applicable');
  const elsewhere = await mod.run(await layerInputsFor(video, { brand: { ...brand, logo: other }, expect: { end_card: false, qc_flags: ['logo_visible'] } }), ctx);
  assert.equal(status(elsewhere)['flag:logo_visible'], 'fail');
  // logo_visible looks across the whole video, not only a marked end card: a logo shown earlier in its zone counts.
  const early = join(w, 'early.mp4');
  await run('ffmpeg', ['-hide_banner', '-nostdin', '-loglevel', 'error', '-y', '-i', card.video.path, '-i', body, '-filter_complex', '[0:v][0:a][1:v][1:a]concat=n=2:v=1:a=1[v][a]', '-map', '[v]', '-map', '[a]', '-c:v', 'libx264', '-preset', 'ultrafast', '-pix_fmt', 'yuv420p', '-c:a', 'aac', early]);
  const earlyCut = await fileRef(early, 'video');
  const markedLater = await mod.run(await layerInputsFor(earlyCut, { brand, expect: { end_card: false, qc_flags: ['logo_visible'] }, timeline: { end_card: { start_s: 4, end_s: 5 } } }), ctx);
  assert.equal(status(markedLater)['flag:logo_visible'], 'pass', 'the logo shown at the start is visible');
  // A declared logo zone bounds where the match may sit.
  const top = { use: 'logo', x: 0, y: 0, w: 720, h: 200 };
  const middle = { use: 'logo', x: 0, y: 200, w: 720, h: 700 };
  const outOfZone = await mod.run(await layerInputsFor(video, { brand, expect, timeline: { ...timeline, safe_zones: [top] } }), ctx);
  assert.equal(status(outOfZone).logo, 'fail', 'the logo is not in the top zone');
  const inZone = await mod.run(await layerInputsFor(video, { brand, expect, timeline: { ...timeline, safe_zones: [middle] } }), ctx);
  assert.equal(status(inZone).logo, 'pass');
  // A still picture fails footage_moves.
  const still = await levelledCut(w, 'still', 5, { pattern: 'color=c=0x808080' });
  const dead = await mod.run(await layerInputsFor(still, { expect: { qc_flags: ['footage_moves'] } }), ctx);
  assert.equal(status(dead)['flag:footage_moves'], 'fail');
});

test('sounds_match_messages: a sound when each message appears', { skip }, async () => {
  const { ctx } = makeCtx({ partDir: dir });
  const w = ctx.workDir;
  await makeTone(join(w, 'pop.wav'), 0.15, { freq: 1200 });
  const pic = join(w, 'pic.mp4');
  await makeVideo(pic, 6, { width: 720, height: 1280, tone: 0 });
  const withPops = join(w, 'pops.mp4');
  await run('ffmpeg', ['-hide_banner', '-nostdin', '-loglevel', 'error', '-y', '-i', pic, '-i', join(w, 'pop.wav'), '-filter_complex', '[1:a]asplit=2[a][b];[a]adelay=1000:all=1[p1];[b]adelay=3000:all=1[p2];[p1][p2]amix=inputs=2:normalize=0,apad=whole_dur=6,atrim=0:6[o]', '-map', '0:v', '-map', '[o]', '-c:v', 'copy', '-c:a', 'aac', '-t', '6', withPops]);
  const video = await fileRef(withPops, 'video');
  const expect = { qc_flags: ['sounds_match_messages'] };
  const good = await mod.run(await layerInputsFor(video, { expect, timeline: { scenes: [{ id: 'a', start_s: 1, end_s: 3 }, { id: 'b', start_s: 3, end_s: 6 }] } }), ctx);
  assert.equal(status(good)['flag:sounds_match_messages'], 'pass');
  const missing = await mod.run(await layerInputsFor(video, { expect, timeline: { scenes: [{ id: 'a', start_s: 1, end_s: 3 }, { id: 'b', start_s: 3, end_s: 4.5 }, { id: 'c', start_s: 4.5, end_s: 6 }] } }), ctx);
  assert.equal(status(missing)['flag:sounds_match_messages'], 'fail');
});

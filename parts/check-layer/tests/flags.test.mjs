// check-layer 1.3.0 style flags: text_led, read_rate, cuts_between_words, cut_rate and retained_body.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileRef, hasFfmpeg, layerInputsFor, loadNewest, makeCtx, run } from '../../_tools/kit-harness.mjs';
import { chkBlankSpans, chkCutInsideWord, chkCuts, chkJudgeBlank, chkReadRate } from '../src/flags.mjs';
import { levelledCut } from './fixture.mjs';

const { dir, mod, manifest } = await loadNewest('check-layer');
const ffmpeg = await hasFfmpeg();
const skip = !ffmpeg && 'ffmpeg is not installed';
const status = (out) => Object.fromEntries(out.verdict.checks.map((c) => [c.code, c.status]));
const check = (out, code) => out.verdict.checks.find((c) => c.code === code);

/** A silent 720x1280 cut on black with a white "text" bar shown only where `enable` is true (an ffmpeg expression). */
async function textOnBlack(workDir, name, seconds, enable) {
  const out = join(workDir, `${name}.mp4`);
  const draw = enable ? `,drawbox=x=210:y=620:w=300:h=30:color=white:t=fill:enable='${enable}'` : '';
  await run('ffmpeg', ['-hide_banner', '-nostdin', '-loglevel', 'error', '-y', '-f', 'lavfi', '-i', `color=c=black:size=720x1280:rate=30:duration=${seconds}${draw}`, '-c:v', 'libx264', '-preset', 'ultrafast', '-pix_fmt', 'yuv420p', out]);
  return fileRef(out, 'video');
}

test('1.3.0 is the newest check layer and stays free with no network', () => {
  assert.equal(manifest.version, '1.3.0');
  assert.deepEqual([manifest.needs.network, manifest.needs.models, manifest.cost.basis], [false, [], 'free']);
});

test('refuses inputs outside the layer schema', async () => {
  const { ctx } = makeCtx({ partDir: dir });
  const video = { path: join(ctx.workDir, 'none.mp4') };
  const base = {
    video,
    timeline: { duration_s: 5, width: 720, height: 1280, fps: 30, scenes: [], speech: [] },
    brand: { name: 'Sample Goods', colors: {}, fonts: {}, pronunciations: [] },
    expect: { aspect: '9:16', width: 720, height: 1280, duration_s: { min: 1, max: 10 }, speech: 'none', captions: false, end_card: false, qc_flags: ['text_led'] },
  };
  await assert.rejects(mod.run({ ...base, timeline: { ...base.timeline, hook: { start_s: 0, end_s: 2 } } }, ctx), (e) => e.code === 'bad_input' && /hook/.test(e.message));
  const { expect: _drop, ...noExpect } = base;
  await assert.rejects(mod.run(noExpect, ctx), (e) => e.code === 'bad_input' && /expect/.test(e.message));
  await assert.rejects(mod.run({ ...base, timeline: { ...base.timeline, speech: [{ start_s: 0, end_s: 1 }] } }, ctx), (e) => e.code === 'bad_input' && /text/.test(e.message));
});

test('the flag maths: read rate, cuts, cuts inside words, blank spans', () => {
  // Word timings win over counting the text; entries that start after `until` are left out.
  const speech = [
    { text: 'one two three four five', start_s: 0, end_s: 2 },
    { text: 'ignored text', start_s: 2, end_s: 3, words: [{ text: 'a', start_s: 2, end_s: 2.4 }, { text: 'b', start_s: 2.5, end_s: 3 }, { text: 'c', start_s: 2.6, end_s: 3 }] },
    { text: 'later words here', start_s: 10, end_s: 11 },
  ];
  assert.deepEqual(chkReadRate(speech, 5), { words: 8, seconds: 3, wps: 8 / 3 });
  assert.equal(chkReadRate([], 5), null);
  assert.equal(chkReadRate([{ text: '', start_s: 0, end_s: 1 }]), null);
  // `spoken` is what was said.
  assert.equal(chkReadRate([{ text: 'a b', spoken: 'a b c d', start_s: 0, end_s: 2 }]).wps, 2);
  // Scene starts after 0 and before the body's end, once each.
  assert.deepEqual(chkCuts([{ start_s: 0 }, { start_s: 1.5 }, { start_s: 1.5 }, { start_s: 3 }, { start_s: 9.98 }, { start_s: 12 }], 10), [1.5, 3]);
  const words = [{ text: 'hello', start_s: 1.0, end_s: 1.6 }, { text: 'there', start_s: 1.7, end_s: 2.2 }];
  assert.equal(chkCutInsideWord([1.65], words), null, 'a cut in the gap is between words');
  assert.equal(chkCutInsideWord([1.6], words), null, 'a cut on a word edge is not inside it');
  assert.equal(chkCutInsideWord([1.605], words), null, 'a cut within 0.01 s of an edge is on the edge');
  assert.deepEqual(chkCutInsideWord([1.65, 2.0], words), { t: 2.0, word: words[1] });
  // Blank stretches and their bounds: 0.3 s at the edges, 1.0 s between beats, under 25 % in all.
  const flags = (s) => [...s].map((c) => c === '#');
  assert.deepEqual(chkBlankSpans(flags('##..###..#')), [[0, 0.2], [0.4, 0.7], [0.9, 1]]);
  const okBeat = chkJudgeBlank(chkBlankSpans(flags('##' + '.'.repeat(20) + '#'.repeat(8) + '.'.repeat(20))), 50);
  assert.equal(okBeat.span, null);
  assert.equal(+okBeat.share.toFixed(2), 0.2);
  const longOpening = chkJudgeBlank(chkBlankSpans(flags('####' + '.'.repeat(46))), 50);
  assert.equal(longOpening.span.where, 'at the opening');
  const longBeat = chkJudgeBlank(chkBlankSpans(flags('.'.repeat(10) + '#'.repeat(11) + '.'.repeat(29))), 50);
  assert.equal(longBeat.span.where, 'between text beats');
  assert.equal(longBeat.span.limit, 1);
  assert.equal(chkJudgeBlank(chkBlankSpans(flags('#'.repeat(20))), 20).whole, true);
});

test('text_led: a dark beat with text on it is not black; blank stretches and blank share are bounded', { skip }, async () => {
  const { ctx } = makeCtx({ partDir: dir });
  const w = ctx.workDir;
  // Text 0-2 s and 2.5-5 s on black: a 0.5 s blank beat between them.
  const beats = await textOnBlack(w, 'beats', 5, 'lt(t,2)+gte(t,2.5)');
  const plain = await mod.run(await layerInputsFor(beats, { expect: { speech: 'none' } }), ctx);
  assert.equal(status(plain).black_frames, 'fail', 'without the flag, a small text on black reads as black');
  const led = await mod.run(await layerInputsFor(beats, { expect: { speech: 'none', qc_flags: ['text_led'] } }), ctx);
  assert.equal(status(led).black_frames, 'pass', JSON.stringify(check(led, 'black_frames')));
  assert.equal(status(led)['flag:text_led'], 'pass');
  assert.ok(Math.abs(check(led, 'flag:text_led').found - 0.1) < 0.03, `blank share ${check(led, 'flag:text_led').found}`);
  // A 1.5 s blank beat between two text beats is too long.
  const gap = await textOnBlack(w, 'gap', 5, 'lt(t,1.5)+gte(t,3)');
  const longGap = await mod.run(await layerInputsFor(gap, { expect: { speech: 'none', qc_flags: ['text_led'] } }), ctx);
  assert.equal(status(longGap).black_frames, 'fail');
  assert.match(check(longGap, 'black_frames').message, /between text beats/);
  assert.equal(status(longGap)['flag:text_led'], 'fail', '1.5 s of 5 s is over a quarter blank');
  // A blank opening over 0.3 s fails, and a wholly blank video fails the flag.
  const late = await textOnBlack(w, 'late', 5, 'gte(t,0.8)');
  assert.equal(status(await mod.run(await layerInputsFor(late, { expect: { speech: 'none', qc_flags: ['text_led'] } }), ctx)).black_frames, 'fail');
  const empty = await textOnBlack(w, 'empty', 3, null);
  const blank = await mod.run(await layerInputsFor(empty, { expect: { speech: 'none', qc_flags: ['text_led'] } }), ctx);
  assert.equal(status(blank)['flag:text_led'], 'fail');
  assert.match(check(blank, 'flag:text_led').message, /whole video is blank/);
  assert.equal(blank.verdict.pass, false);
});

test('read_rate, cuts_between_words and cut_rate are measured from the timeline', { skip }, async () => {
  const { ctx } = makeCtx({ partDir: dir });
  const video = await levelledCut(ctx.workDir, 'paced', 10);
  const qc = ['read_rate', 'cuts_between_words', 'cut_rate'];
  const word = (text, start_s, end_s) => ({ text, start_s, end_s });
  // 12 words over 5 s of speech (2.4 a second); scene cuts at 2, 4 and 6 over an 8 s body, then the end card.
  const speech = [
    { scene_id: 'a', text: 'Dinner is ready in ten minutes flat', start_s: 0.2, end_s: 2.7, words: [word('Dinner', 0.2, 0.5), word('is', 0.55, 0.7), word('ready', 0.75, 1.1), word('in', 1.15, 1.3), word('ten', 1.35, 1.6), word('minutes', 1.65, 1.95), word('flat', 2.05, 2.7)] },
    { scene_id: 'b', text: 'No prep and no mess', start_s: 4.1, end_s: 6.6, words: [word('No', 4.1, 4.4), word('prep', 4.5, 4.9), word('and', 5.0, 5.3), word('no', 5.4, 5.7), word('mess', 5.8, 6.6)] },
  ];
  const scenes = [0, 2, 4, 6].map((s, i) => ({ id: 'abcd'[i], start_s: s, end_s: s + 2 }));
  const timeline = { scenes, speech, end_card: { start_s: 8, end_s: 10 } };
  const out = await mod.run(await layerInputsFor(video, { expect: { speech: 'voiceover', qc_flags: qc }, timeline }), ctx);
  const s = status(out);
  assert.equal(s['flag:read_rate'], 'pass', JSON.stringify(check(out, 'flag:read_rate')));
  assert.equal(check(out, 'flag:read_rate').found, 2.4);
  assert.equal(s['flag:cuts_between_words'], 'fail', 'the cut at 6 s falls inside "mess"');
  assert.match(check(out, 'flag:cuts_between_words').message, /6\.00 seconds .*"mess"/);
  assert.equal(s['flag:cut_rate'], 'fail', '3 cuts over an 8 s body is 0.375 a second');
  // Cuts moved to the word gaps, one more scene, and a slower read.
  const gaps = [0, 1.6, 3, 4.45, 6.8].map((t, i, all) => ({ id: `s${i}`, start_s: t, end_s: all[i + 1] || 8 }));
  const slow = [{ ...speech[0], end_s: 4.5 }];
  const fixed = await mod.run(await layerInputsFor(video, { expect: { speech: 'voiceover', qc_flags: qc }, timeline: { scenes: gaps, speech, end_card: { start_s: 8, end_s: 10 } } }), ctx);
  assert.equal(status(fixed)['flag:cuts_between_words'], 'pass', JSON.stringify(check(fixed, 'flag:cuts_between_words')));
  assert.equal(status(fixed)['flag:cut_rate'], 'pass', JSON.stringify(check(fixed, 'flag:cut_rate')));
  const tooSlow = await mod.run(await layerInputsFor(video, { expect: { speech: 'voiceover', qc_flags: ['read_rate'] }, timeline: { scenes: gaps, speech: slow } }), ctx);
  assert.equal(status(tooSlow)['flag:read_rate'], 'fail');
  assert.match(check(tooSlow, 'flag:read_rate').message, /too slowly/);
  // No speech and no word timings: not applicable.
  const none = await mod.run(await layerInputsFor(video, { expect: { qc_flags: qc }, timeline: { scenes } }), ctx);
  assert.equal(status(none)['flag:read_rate'], 'not_applicable');
  assert.equal(status(none)['flag:cuts_between_words'], 'not_applicable');
  // Word timings from the captions layer's words when the speech entries carry none.
  const record = join(ctx.workDir, 'words.json');
  writeFileSync(record, JSON.stringify({ cues: [], words: [word('flat', 1.9, 2.3)] }));
  const inputs = await layerInputsFor(video, { expect: { qc_flags: ['cuts_between_words'] }, timeline: { scenes } });
  inputs.words = await fileRef(record, 'json');
  const fromCaptions = await mod.run(inputs, ctx);
  assert.equal(status(fromCaptions)['flag:cuts_between_words'], 'fail');
  // Mixed timings: one entry has words, the other only its text. The captions layer's words cover both,
  // so the cut at 6 s inside "mess" is still caught.
  const { words: _dropped, ...noWords } = speech[1];
  const mixed = [speech[0], noWords];
  const mixedInputs = await layerInputsFor(video, { expect: { speech: 'voiceover', qc_flags: ['cuts_between_words'] }, timeline: { scenes, speech: mixed } });
  const allWords = join(ctx.workDir, 'all-words.json');
  writeFileSync(allWords, JSON.stringify({ cues: [], words: [...speech[0].words, ...speech[1].words] }));
  mixedInputs.words = await fileRef(allWords, 'json');
  const mixedOut = await mod.run(mixedInputs, ctx);
  assert.equal(status(mixedOut)['flag:cuts_between_words'], 'fail', JSON.stringify(check(mixedOut, 'flag:cuts_between_words')));
  assert.match(check(mixedOut, 'flag:cuts_between_words').message, /"mess"/);
});

test('flags this version does not measure stay not_applicable and never fail the video', { skip }, async () => {
  const { ctx } = makeCtx({ partDir: dir });
  const video = await levelledCut(ctx.workDir, 'later', 4);
  const out = await mod.run(await layerInputsFor(video, { expect: { speech: 'voiceover', qc_flags: ['captions_cross_cuts', 'min_shot', 'text_legible', 'cut_rate', 'future-flag', 'Some Flag'] } }), ctx);
  const s = status(out);
  for (const f of ['captions_cross_cuts', 'min_shot', 'text_legible', 'future-flag', 'Some Flag']) assert.equal(s[`flag:${f}`], 'not_applicable', f);
  assert.equal(check(out, 'flag:text_legible').found, 'needs eyes; not checked by machine');
  assert.equal(check(out, 'flag:min_shot').found, 'not measured by this check layer');
  assert.equal(s['flag:cut_rate'], 'not_applicable', 'no scenes in the timeline');
  assert.equal(out.verdict.pass, true, JSON.stringify(out.verdict.reasons));
});

test('retained_body: content checks run only inside the new opening; the kept body is not judged', { skip }, async () => {
  const { ctx } = makeCtx({ partDir: dir });
  const w = ctx.workDir;
  // A moving 2 s opening spliced onto a kept body that is black and frozen for 6 s.
  const hook = join(w, 'hook.mp4');
  await run('ffmpeg', ['-hide_banner', '-nostdin', '-loglevel', 'error', '-y', '-f', 'lavfi', '-i', 'testsrc2=size=720x1280:rate=30:duration=2', '-f', 'lavfi', '-i', 'sine=frequency=440:duration=2:sample_rate=48000', '-c:v', 'libx264', '-preset', 'ultrafast', '-pix_fmt', 'yuv420p', '-c:a', 'aac', hook]);
  const body = join(w, 'body.mp4');
  await run('ffmpeg', ['-hide_banner', '-nostdin', '-loglevel', 'error', '-y', '-f', 'lavfi', '-i', 'color=c=black:size=720x1280:rate=30:duration=6', '-f', 'lavfi', '-i', 'sine=frequency=440:duration=6:sample_rate=48000', '-c:v', 'libx264', '-preset', 'ultrafast', '-pix_fmt', 'yuv420p', '-c:a', 'aac', body]);
  const spliced = join(w, 'spliced.mp4');
  await run('ffmpeg', ['-hide_banner', '-nostdin', '-loglevel', 'error', '-y', '-i', hook, '-i', body, '-filter_complex', '[0:v][0:a][1:v][1:a]concat=n=2:v=1:a=1[v][c];[c]loudnorm=I=-14:TP=-1.5:LRA=11[a]', '-map', '[v]', '-map', '[a]', '-c:v', 'libx264', '-preset', 'ultrafast', '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-ar', '48000', spliced]);
  const video = await fileRef(spliced, 'video');
  const scenes = [{ id: 'hook', start_s: 0, end_s: 2 }, { id: 'body', start_s: 2, end_s: 8 }];
  // The kept body's speech differs from the plan's lines: with retained_body it is not compared.
  const timeline = { scenes, speech: [{ text: 'Something the old ad said', start_s: 3, end_s: 5 }] };
  const expect = { speech: 'voiceover', script: ['A brand new line'], duration_s: { min: 4, max: 12 } };
  const judged = await mod.run(await layerInputsFor(video, { expect, timeline }), ctx);
  assert.equal(status(judged).black_frames, 'fail', 'without the flag the kept body is judged');
  assert.equal(status(judged).speech_matches_script, 'fail');
  const kept = await mod.run(await layerInputsFor(video, { expect: { ...expect, qc_flags: ['retained_body'] }, timeline }), ctx);
  const s = status(kept);
  assert.equal(s.black_frames, 'pass');
  assert.equal(s.frozen_frames, 'pass');
  assert.equal(s.speech_matches_script, 'not_applicable');
  assert.equal(s['flag:retained_body'], 'pass');
  assert.match(String(check(kept, 'flag:retained_body').found), /^checked 0-2\.00 s; 2\.00-\d+\.\d\d s kept/);
  assert.equal(s.length, 'pass', "the server's checks still cover the whole video");
  assert.equal(kept.verdict.pass, true, JSON.stringify(kept.verdict.reasons));
  // The new opening itself is still checked: a black opening fails.
  const blackHook = await mod.run(await layerInputsFor(video, { expect: { ...expect, qc_flags: ['retained_body'] }, timeline: { ...timeline, scenes: [{ id: 'hook', start_s: 0, end_s: 4 }, { id: 'body', start_s: 4, end_s: 8 }] } }), ctx);
  assert.equal(status(blackHook).black_frames, 'fail');
  // With no opening marked, nothing can be told apart: the flag fails and the content checks are not run.
  const unmarked = await mod.run(await layerInputsFor(video, { expect: { ...expect, qc_flags: ['retained_body'] }, timeline: { scenes: [], speech: timeline.speech } }), ctx);
  assert.equal(status(unmarked)['flag:retained_body'], 'fail');
  assert.equal(status(unmarked).black_frames, 'not_applicable');
  assert.equal(unmarked.verdict.pass, false);
  // A first scene that does not start the video, or that covers the whole cut, is not a marked opening.
  for (const first of [{ start_s: 3, end_s: 4 }, { start_s: 9, end_s: 10 }, { start_s: 0, end_s: 30 }]) {
    const bad = await mod.run(await layerInputsFor(video, { expect: { ...expect, qc_flags: ['retained_body'] }, timeline: { ...timeline, scenes: [{ id: 'hook', ...first }, { id: 'body', start_s: 4, end_s: 8 }] } }), ctx);
    assert.equal(status(bad)['flag:retained_body'], 'fail', JSON.stringify(first));
    assert.equal(status(bad).black_frames, 'not_applicable', JSON.stringify(first));
  }
  // Speech in the opening is compared with the opening's line only, not the whole script.
  const hookSpeech = { scenes, speech: [{ text: 'A brand new line', start_s: 0.2, end_s: 1.8 }, timeline.speech[0]] };
  const spoken = await mod.run(await layerInputsFor(video, { expect: { ...expect, script: ['A brand new line', 'The old body line'], qc_flags: ['retained_body'] }, timeline: hookSpeech }), ctx);
  assert.equal(status(spoken).speech_matches_script, 'pass', JSON.stringify(check(spoken, 'speech_matches_script')));
});

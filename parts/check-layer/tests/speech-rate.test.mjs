// check-layer 1.7.0: speech_rate_vs_reference, counted as goose-studio's reference_rate.py counts words.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { hasFfmpeg, layerInputsFor, loadNewest, loadPart, makeCtx } from '../../_tools/kit-harness.mjs';
import { levelledCut } from './fixture.mjs';

const { dir, mod } = await loadNewest('check-layer');
const v160 = await loadPart('check-layer', '1.6.0');
const skip = !(await hasFfmpeg()) && 'ffmpeg is not installed';

/** n words spread evenly at `wps`, from `start`. */
function timed(n, wps, start = 0) {
  return Array.from({ length: n }, (_, i) => ({ text: `w${i}`, start_s: +(start + i / wps).toFixed(3), end_s: +(start + (i + 0.8) / wps).toFixed(3) }));
}

test("whisper tokens join into words, markers and punctuation are dropped (reference_rate.py's own case)", async () => {
  const { chkRateWords, chkRate } = await import('../src/speech-rate.mjs');
  const tokens = [['', 0, 0.15], ['[_BEG_]', 0, 0], [' Here', 0.15, 0.24], ["'s", 0.24, 0.36], [' why', 0.36, 0.54], [' black', 0.54, 0.87], ['head', 0.87, 1.16], [' fails', 1.16, 1.5], ['.', 1.5, 1.6]]
    .map(([text, start_s, end_s]) => ({ text, start_s, end_s }));
  assert.deepEqual(chkRateWords(tokens).map((w) => w.text), ["Here's", 'why', 'blackhead', 'fails.']);
  assert.deepEqual(chkRate(tokens), { words: 4, span_s: 1.45, wps: 2.759 });
  // A plain word list (no leading spaces) is not joined; a lone dash is not a word.
  assert.deepEqual(chkRate([{ text: 'a', start_s: 1, end_s: 1.2 }, { word: 'b', start: 1.5, end: 2 }, { text: '—', start_s: 2, end_s: 2.1 }]), { words: 2, span_s: 1, wps: 2 });
});

test('speech_rate_vs_reference fails more than 15 % below the reference, passes within it, and is not_applicable without both lists', { skip }, async () => {
  const run = async (expect) => {
    const { ctx } = makeCtx({ partDir: dir });
    const video = await levelledCut(ctx.workDir, 'cut', 5);
    const inputs = await layerInputsFor(video, { expect: { duration_s: { min: 4, max: 8 }, ...expect } });
    const out = await mod.run(inputs, ctx);
    return out.verdict.checks.find((c) => c.code === 'speech_rate_vs_reference');
  };
  // The test video: the reference 3.20 words a second, the narration 2.62 (82 %).
  const slow = await run({ reference_words: timed(40, 3.2), final_words: timed(40, 2.62) });
  assert.equal(slow.status, 'fail');
  assert.match(slow.message, /more than 15 % slower/);
  const close = await run({ reference_words: timed(40, 3.2), final_words: timed(40, 2.9) });
  assert.equal(close.status, 'pass');
  assert.equal((await run({ reference_words: timed(40, 3.2) })).status, 'not_applicable');
  assert.equal((await run({})).status, 'not_applicable');
});

test('1.6.0 is unchanged: it has no speech_rate_vs_reference check', { skip }, async () => {
  const { ctx } = makeCtx({ partDir: v160.dir });
  const video = await levelledCut(ctx.workDir, 'cut', 5);
  const out = await v160.mod.run(await layerInputsFor(video, { expect: { duration_s: { min: 4, max: 8 } } }), ctx);
  assert.ok(!out.verdict.checks.some((c) => c.code === 'speech_rate_vs_reference'));
});

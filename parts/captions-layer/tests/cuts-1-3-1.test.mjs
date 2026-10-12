// Regression: final scene starts are the actual shot cuts; a caption hold and regrouping must respect them.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { browserMissing, browserProviderOrNull, fileRef, hasFfmpeg, layerInputsFor, loadPart, makeCtx, makeVideo } from '../../_tools/kit-harness.mjs';
const current = await loadPart('captions-layer', '1.3.1');
const old = await loadPart('captions-layer', '1.3.0');
const skip = !((await hasFfmpeg()) && browserProviderOrNull()) && (browserMissing() || 'ffmpeg missing');
const timed = (list) => list.map(([text, start_s, end_s]) => ({ text, start_s, end_s }));
async function run(part, timeline, flags = [], look = { preset: 'plate' }, seconds = 6) {
  const { ctx, orders } = makeCtx({ partDir: part.dir });
  const video = await fileRef(await makeVideo(join(ctx.workDir, 'cut.mp4'), seconds, { width: 540, height: 960, tone: 440 }), 'video');
  const inputs = await layerInputsFor(video, { expect: { speech: 'on_camera', captions: true, qc_flags: flags, caption_look: look }, timeline });
  const out = await part.mod.run(inputs, ctx);
  assert.equal(orders.length, 0, 'timed words must need no provider call');
  return { out, record: JSON.parse(readFileSync(out.words.path, 'utf8')) };
}
const street = {
  scenes: [{ id: 's1', start_s: 0, end_s: 2.833 }, { id: 's2', start_s: 2.833, end_s: 4.8 }, { id: 's3', start_s: 4.625, end_s: 6 }],
  speech: [
    { scene_id: 's2', text: 'Coffee? Maybe coffee.', start_s: 2.958, end_s: 4.383, words: timed([['Coffee?', 2.958, 3.383], ['Maybe', 3.458, 3.883], ['coffee.', 3.958, 4.383]]) },
    { scene_id: 's3', text: 'Protein powder.', start_s: 5.0, end_s: 5.5, words: timed([['Protein', 5.0, 5.2], ['powder.', 5.25, 5.5]]) },
  ],
};
test('Street coffee hold stops at the next final scene start, not the speech or previous-scene end', { skip }, async () => {
  const { record } = await run(current, street, ['captions_cross_cuts']);
  const coffee = record.cues.find((c) => c.text === 'Maybe coffee.');
  assert.ok(coffee, JSON.stringify(record.cues));
  assert.equal(coffee.start_s, 3.458);
  assert.equal(coffee.end_s, 4.625);
  assert.ok(record.cues.every((c) => !(c.start_s < 4.625 && c.end_s > 4.625)), 'no cue crosses the actual final cut');
});
test('without captions_cross_cuts, caption timings, words, WebVTT and video bytes match immutable 1.3.0', { skip }, async () => {
  const a = await run(old, street);
  const b = await run(current, street);
  assert.equal(a.record.cues.find((c) => c.text === 'Maybe coffee.').end_s, 4.883);
  assert.deepEqual(b.record, a.record);
  assert.deepEqual(readFileSync(b.out.captions.path), readFileSync(a.out.captions.path));
  const sha = (p) => createHash('sha256').update(readFileSync(p)).digest('hex');
  assert.equal(sha(b.out.video.path), sha(a.out.video.path));
});
test('every preset groups tokens within shots, including cross-line sentence and brand-name regrouping', { skip }, async () => {
  const timeline = {
    scenes: [{ id: 'a', start_s: 0, end_s: 1.2 }, { id: 'b', start_s: 1.2, end_s: 3 }],
    speech: [
      { text: 'Try Sample', start_s: 0.2, end_s: 1.0, words: timed([['Try', 0.2, 0.4], ['Sample', 0.7, 1.0]]) },
      { text: 'Goods today.', start_s: 1.25, end_s: 2.0, words: timed([['Goods', 1.25, 1.5], ['today.', 1.6, 2.0]]) },
    ],
  };
  for (const preset of ['plate', 'stroke', 'karaoke', 'pill', 'serif-word', 'sentence']) {
    const { record } = await run(current, timeline, ['captions_cross_cuts'], { preset, max_words: 5, highlight: ['brand'] }, 3);
    assert.ok(record.cues.every((c) => !(c.start_s < 1.2 && c.end_s > 1.2)), preset);
    assert.ok(!record.cues.some((c) => /Sample/i.test(c.text) && /Goods/i.test(c.text)), `${preset}: a brand or sentence cannot regroup across shots`);
    assert.ok(record.cues.some((c) => /Sample/i.test(c.text)) && record.cues.some((c) => /Goods/i.test(c.text)), 'all lexical words survive');
  }
});
test('the last caption hold stops at a later silent shot instead of extending to the final frame', { skip }, async () => {
  const { record } = await run(current, { scenes: [{ id: 'a', start_s: 0, end_s: 1.5 }, { id: 'silent', start_s: 1.5, end_s: 3 }], speech: [{ text: 'Done.', start_s: 0.2, end_s: 0.5, words: timed([['Done.', 0.2, 0.5]]) }] }, ['captions_cross_cuts'], { preset: 'karaoke' }, 3);
  assert.equal(record.cues.at(-1).end_s, 1.5);
});

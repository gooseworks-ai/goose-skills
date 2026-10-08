import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { browserProviderOrNull, countColor, fileRef, framePixels, hasFfmpeg, layerInputsFor, loadPart, makeCtx, makeVideo, probe } from '../../_tools/kit-harness.mjs';
import { sample } from './fixture.mjs';

const { dir, mod } = await loadPart('captions-layer', '1.0.0');
const ready = (await hasFfmpeg()) && browserProviderOrNull();
const skip = !ready && 'ffmpeg or the browser is not installed';

function cuesOf(vtt) {
  return vtt.split(/\n\n+/).filter((b) => b.includes('-->')).map((b) => {
    const lines = b.split('\n');
    const at = lines.findIndex((l) => l.includes('-->'));
    const [a, z] = lines[at].split(' --> ');
    const sec = (s) => s.split(':').reduce((acc, v) => acc * 60 + Number(v), 0);
    return { start: sec(a), end: sec(z), text: lines.slice(at + 1).filter(Boolean).join(' ') };
  });
}

test('captions follow the word timings at the line\'s pace, a lone last word joins the one before, the last holds to the end', { skip }, async () => {
  const { ctx, orders } = makeCtx({ partDir: dir });
  const video = await fileRef(await makeVideo(join(ctx.workDir, 'cut.mp4'), 4, { width: 540, height: 960, tone: 440, pattern: 'color=c=0x2060c0' }), 'video');
  const words = [['Try', 0.2, 0.5], ['Drinkag1', 0.6, 1.2], ['today', 1.3, 1.7], ['for', 2.0, 2.2], ['free', 2.3, 2.6]].map(([text, s, e]) => ({ text, start_s: s, end_s: e }));
  const inputs = await layerInputsFor(video, {
    expect: { speech: 'voiceover', captions: true },
    timeline: { speech: [{ scene_id: 's1', text: 'Try Drinkag1 today for free', spoken: 'Try drink A G one today for free', start_s: 0.2, end_s: 2.6, words }] },
  });
  const out = await mod.run(inputs, ctx);
  assert.equal(orders.length, 0, 'nothing is transcribed when the timeline has word timings');
  const cues = cuesOf(readFileSync(out.captions.path, 'utf8'));
  assert.ok(readFileSync(out.captions.path, 'utf8').startsWith('WEBVTT'));
  assert.deepEqual(cues.map((c) => c.text), ['Try', 'Drinkag1', 'today', 'for free'], 'the written name, not the spoken one');
  assert.ok(Math.abs(cues[0].start - 0.2) < 0.01);
  assert.ok(Math.abs(cues.at(-1).end - (await probe(video.path)).duration_s) < 0.05, 'the last caption holds to the end');
  // A plate is drawn while a caption shows and nothing before the first word.
  const plate = [58, 58, 60];
  assert.ok(countColor(await framePixels(out.video.path, 1.0), plate, 30) > 100, 'a caption plate at 1.0s');
  assert.equal(countColor(await framePixels(out.video.path, 0.05), plate, 30), 0, 'no caption before the first word');
});

test('with no word timings it transcribes the cut and keeps the written words', { skip }, async () => {
  const { ctx, orders } = makeCtx({ partDir: dir, line: sample.line });
  const out = await mod.run(await sample.inputs(ctx.workDir), ctx);
  assert.equal(orders.length, 1);
  assert.equal(orders[0].path, '/fal-ai/whisper');
  assert.equal(orders[0].body.audio_url.kind, 'file', 'the audio goes to the core as a file');
  const cues = cuesOf(readFileSync(out.captions.path, 'utf8'));
  assert.deepEqual(cues.map((c) => c.text).join(' '), 'Meet two hundred happy customers');
  const record = JSON.parse(readFileSync(out.words.path, 'utf8'));
  assert.equal(record.cues.length, cues.length);
});

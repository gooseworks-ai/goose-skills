// captions-layer 1.3.0: the pill, serif-word and sentence looks, the bundled serif and rounded fonts, and a
// refusal with a 1.3.0 look.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { loadNewest, browserMissing, browserProviderOrNull, countColor, fileRef, framePixels, hasFfmpeg, layerInputsFor, makeCtx, makeVideo } from '../../_tools/kit-harness.mjs';

const { dir, mod } = await loadNewest('captions-layer');
const ready = (await hasFfmpeg()) && browserProviderOrNull();
const skip = !ready && (browserMissing() || 'ffmpeg is not installed');
const PLATE = [58, 58, 60];
const CREAM = [251, 243, 226];
const UPCOMING = [163, 157, 146];
const YELLOW = [255, 212, 0];
const SENTENCE_WHITE = [255, 253, 248];

const timed = (list) => list.map(([text, s, e]) => ({ text, start_s: s, end_s: e }));
const vttTexts = (path) =>
  readFileSync(path, 'utf8')
    .split(/\n\n+/)
    .filter((b) => b.includes('-->'))
    .map((b) => b.split('\n').slice(2).filter(Boolean).join(' '));

async function cut(ctx, seconds = 3) {
  return fileRef(await makeVideo(join(ctx.workDir, 'cut.mp4'), seconds, { width: 540, height: 960, tone: 440, pattern: 'color=c=0x2060c0' }), 'video');
}

const frame = (out, at) => framePixels(out.video.path, at, 540, 960);

test('the newest captions layer is 1.3.0 and ships its three fonts with their licenses', () => {
  const part = JSON.parse(readFileSync(join(dir, 'part.json'), 'utf8'));
  assert.equal(part.version, '1.3.0');
  for (const f of ['Montserrat-Bold.ttf', 'Montserrat-OFL.txt', 'PTSerif-Bold.ttf', 'PTSerif-OFL.txt', 'TitanOne-Regular.ttf', 'TitanOne-OFL.txt']) {
    assert.ok(part.files.includes(`assets/fonts/${f}`), f);
  }
  for (const f of ['PTSerif-OFL.txt', 'TitanOne-OFL.txt']) assert.match(readFileSync(join(dir, 'assets', 'fonts', f), 'utf8'), /SIL Open Font License, Version 1\.1/);
});

test('pill: about three lower-case words on a cream pill, the brand name keeps its case, upcoming words grey', { skip }, async () => {
  const { ctx, logs } = makeCtx({ partDir: dir });
  const video = await cut(ctx, 3);
  const words = timed([['Try', 0.2, 0.4], ['Sample', 0.5, 0.7], ['Goods', 0.75, 0.95], ['TODAY', 1.0, 1.3], ['for', 1.4, 1.5], ['free', 1.6, 2.0]]);
  const inputs = await layerInputsFor(video, {
    expect: { speech: 'voiceover', captions: true, caption_look: { preset: 'pill' } },
    timeline: { speech: [{ text: 'Try Sample Goods TODAY for free', start_s: 0.2, end_s: 2.0, words }] },
  });
  const out = await mod.run(inputs, ctx);
  assert.deepEqual(vttTexts(out.captions.path), ['try Sample Goods', 'today for free']);
  const record = JSON.parse(readFileSync(out.words.path, 'utf8'));
  assert.equal(record.look.preset, 'pill');
  assert.equal(record.look.case, 'lower');
  assert.equal(record.look.max_words, 3);
  assert.ok(Math.abs(record.cues[0].box.y + record.cues[0].box.h / 2 - 0.7 * 960) < 2, `centred at 0.70 (${JSON.stringify(record.cues[0].box)})`);
  const early = await frame(out, 0.3);
  const late = await frame(out, 0.9);
  assert.ok(countColor(early, CREAM, 12) > 2000 && countColor(late, CREAM, 12) > 2000, 'a cream pill is drawn');
  assert.ok(countColor(late, PLATE, 12) < 300, 'no grey plate (only anti-aliased letter edges come near its grey)');
  const greyEarly = countColor(early, UPCOMING, 10);
  const greyLate = countColor(late, UPCOMING, 10);
  assert.ok(greyEarly > 3 * Math.max(1, greyLate), `the words still to come are grey, then dark once said (${greyEarly} -> ${greyLate})`);
  assert.ok(!logs.some((l) => l[0] === 'warn'), JSON.stringify(logs));
});

test('serif-word: one word at a time, the brand name kept whole, quoted and highlighted; no plate', { skip }, async () => {
  const { ctx } = makeCtx({ partDir: dir });
  const video = await cut(ctx, 3);
  const words = timed([['Try', 0.2, 0.5], ['Drink', 0.6, 0.8], ['AG1,', 0.85, 1.2], ['today.', 1.3, 1.8]]);
  const inputs = await layerInputsFor(video, {
    brand: { name: 'Drink AG1', colors: {}, fonts: {}, pronunciations: [] },
    expect: { speech: 'voiceover', captions: true, caption_look: { preset: 'serif-word', highlight: ['brand'] } },
    timeline: { speech: [{ text: 'Try Drink AG1, today.', start_s: 0.2, end_s: 1.8, words }] },
  });
  const out = await mod.run(inputs, ctx);
  assert.deepEqual(vttTexts(out.captions.path), ['Try', '“Drink AG1”', 'today.']);
  const record = JSON.parse(readFileSync(out.words.path, 'utf8'));
  assert.equal(record.look.max_words, 1);
  for (const c of record.cues) assert.ok(Math.abs(c.box.y + c.box.h / 2 - 0.75 * 960) < 2, `${c.text} centred at 0.75 (${JSON.stringify(c.box)})`);
  const brandFrame = await frame(out, 1.0);
  assert.ok(countColor(brandFrame, YELLOW, 40) > 30, 'the brand is drawn in the highlight colour');
  const plain = await frame(out, 0.3);
  assert.equal(countColor(plain, YELLOW, 40), 0, 'a plain word is not highlighted');
  assert.ok(countColor(plain, [255, 255, 255], 30) > 50, 'white words');
  assert.ok(countColor(plain, [0, 0, 0], 20) > 50, 'a black outline');
  assert.ok(countColor(plain, PLATE, 12) < 300, 'no plate (only anti-aliased outline edges come near its grey)');
});

test('serif-word ignores a larger max_words with a warning, and keeps an unhighlighted brand name whole and unquoted', { skip }, async () => {
  const { ctx, logs } = makeCtx({ partDir: dir });
  const video = await cut(ctx, 3);
  const words = timed([['Try', 0.2, 0.5], ['Drink', 0.6, 0.8], ['AG1', 0.85, 1.2], ['today', 1.3, 1.8]]);
  const inputs = await layerInputsFor(video, {
    brand: { name: 'Drink AG1', colors: {}, fonts: {}, pronunciations: [] },
    expect: { speech: 'voiceover', captions: true, caption_look: { preset: 'serif-word', max_words: 3 } },
    timeline: { speech: [{ text: 'Try Drink AG1 today', start_s: 0.2, end_s: 1.8, words }] },
  });
  const out = await mod.run(inputs, ctx);
  assert.deepEqual(vttTexts(out.captions.path), ['Try', 'Drink AG1', 'today']);
  assert.ok(logs.some((l) => l[0] === 'warn' && String(l[1]).includes('one word at a time')), JSON.stringify(logs));
  assert.equal(countColor(await frame(out, 1.0), YELLOW, 40), 0, 'not highlighted without highlight: [brand]');
});

test('sentence: one sentence per caption across lines, words revealed as said and kept, bottom-anchored, stops at the end card', { skip }, async () => {
  const { ctx, logs } = makeCtx({ partDir: dir });
  const video = await cut(ctx, 4);
  const inputs = await layerInputsFor(video, {
    expect: { speech: 'voiceover', captions: true, end_card: true, caption_look: { preset: 'sentence' } },
    timeline: {
      scenes: [{ id: 'a', start_s: 0, end_s: 1.05 }, { id: 'b', start_s: 1.05, end_s: 2.3 }, { id: 'c', start_s: 2.3, end_s: 3.5 }],
      speech: [
        { scene_id: 'a', text: 'We pack the', start_s: 0.2, end_s: 1.0, words: timed([['We', 0.2, 0.4], ['pack', 0.45, 0.7], ['the', 0.75, 1.0]]) },
        { scene_id: 'b', text: 'little bag at night.', start_s: 1.1, end_s: 2.1, words: timed([['little', 1.1, 1.3], ['bag', 1.35, 1.5], ['at', 1.55, 1.7], ['night.', 1.75, 2.1]]) },
        { scene_id: 'c', text: 'Done.', start_s: 2.4, end_s: 2.8, words: timed([['Done.', 2.4, 2.8]]) },
      ],
      end_card: { start_s: 3.5, end_s: 4.0 },
    },
  });
  const out = await mod.run(inputs, ctx);
  assert.deepEqual(vttTexts(out.captions.path), ['We pack the little bag at night.', 'Done.']);
  const record = JSON.parse(readFileSync(out.words.path, 'utf8'));
  const [first, second] = record.cues;
  assert.ok(Math.abs(first.end_s - second.start_s) < 1e-3, 'a sentence stays up until the next one starts');
  assert.ok(Math.abs(second.end_s - 3.5) < 1e-3, `the last sentence stops at the end card (${second.end_s})`);
  const zone = out.timeline.safe_zones.find((z) => z.use === 'captions');
  for (const c of record.cues) {
    assert.ok(c.box.y >= zone.y - 0.5 && c.box.y + c.box.h <= zone.y + zone.h + 0.5, `${c.text} inside the band`);
    assert.ok(c.box.y + c.box.h > 0.77 * 960, `${c.text} sits low (bottom ${c.box.y + c.box.h})`);
  }
  assert.ok(Math.abs(first.box.y + first.box.h - (second.box.y + second.box.h)) < 1, 'both sentences share one bottom line');
  assert.ok(first.box.h > second.box.h, 'the longer sentence grows upward');
  const one = countColor(await frame(out, 0.3), SENTENCE_WHITE, 12);
  const three = countColor(await frame(out, 0.9), SENTENCE_WHITE, 12);
  const all = countColor(await frame(out, 2.2), SENTENCE_WHITE, 12);
  assert.ok(one > 20 && three > one * 1.5 && all > three * 1.5, `words appear as they are said and stay (${one}, ${three}, ${all})`);
  assert.ok(countColor(await frame(out, 2.2), [18, 14, 10], 14) > 50, 'a dark outline');
  assert.equal(countColor(await frame(out, 3.7), SENTENCE_WHITE, 12), 0, 'nothing on the end card');
  assert.ok(!logs.some((l) => l[0] === 'warn'), JSON.stringify(logs));
});

test('sentence: a sentence longer than max_words is split into near-equal parts', { skip }, async () => {
  const { ctx } = makeCtx({ partDir: dir });
  const video = await cut(ctx, 3);
  const list = ['one', 'two', 'three', 'four', 'five', 'six', 'seven.'].map((t, i) => [t, 0.2 + i * 0.3, 0.45 + i * 0.3]);
  const inputs = await layerInputsFor(video, {
    expect: { speech: 'voiceover', captions: true, caption_look: { preset: 'sentence', max_words: 4 } },
    timeline: { speech: [{ text: list.map((w) => w[0]).join(' '), start_s: 0.2, end_s: 2.25, words: timed(list) }] },
  });
  const out = await mod.run(inputs, ctx);
  assert.deepEqual(vttTexts(out.captions.path), ['one two three four', 'five six seven.']);
});

test('the serif and rounded fonts are drawn for any preset, with no warning', { skip }, async () => {
  const widths = {};
  for (const font of ['sans_bold', 'serif', 'rounded']) {
    const { ctx, logs } = makeCtx({ partDir: dir });
    const video = await cut(ctx, 2);
    const inputs = await layerInputsFor(video, {
      expect: { speech: 'voiceover', captions: true, caption_look: { preset: 'stroke', font } },
      timeline: { speech: [{ text: 'Wonderful mornings', start_s: 0.2, end_s: 1.2, words: timed([['Wonderful', 0.2, 0.7], ['mornings', 0.75, 1.2]]) }] },
    });
    const out = await mod.run(inputs, ctx);
    assert.ok(!logs.some((l) => l[0] === 'warn'), `${font}: ${JSON.stringify(logs)}`);
    widths[font] = JSON.parse(readFileSync(out.words.path, 'utf8')).cues[0].box.w;
  }
  assert.equal(new Set(Object.values(widths).map((w) => Math.round(w))).size, 3, `three different faces: ${JSON.stringify(widths)}`);
});

test('refusal: a caption zone too small for a sentence caption is refused', { skip }, async () => {
  const { ctx } = makeCtx({ partDir: dir });
  const video = await cut(ctx, 2);
  const inputs = await layerInputsFor(video, {
    expect: { speech: 'voiceover', captions: true, caption_look: { preset: 'sentence' } },
    timeline: { speech: [{ text: 'Try it.', start_s: 0.2, end_s: 0.9, words: timed([['Try', 0.2, 0.5], ['it.', 0.6, 0.9]]) }], safe_zones: [{ use: 'captions', x: 100, y: 500, w: 300, h: 20 }] },
  });
  await assert.rejects(mod.run(inputs, ctx), (e) => e.code === 'bad_input' && /too small/.test(e.message));
});

test('pill with case upper upper-cases the brand name too', { skip }, async () => {
  const { ctx } = makeCtx({ partDir: dir });
  const video = await cut(ctx, 2);
  const words = timed([['Try', 0.2, 0.4], ['Sample', 0.5, 0.7], ['Goods', 0.75, 0.95]]);
  const inputs = await layerInputsFor(video, {
    expect: { speech: 'voiceover', captions: true, caption_look: { preset: 'pill', case: 'upper' } },
    timeline: { speech: [{ text: 'Try Sample Goods', start_s: 0.2, end_s: 0.95, words }] },
  });
  const out = await mod.run(inputs, ctx);
  assert.deepEqual(vttTexts(out.captions.path), ['TRY SAMPLE GOODS']);
});

test('serif-word and sentence never show a caption or word that is only punctuation', { skip }, async () => {
  const words = timed([['Wait', 0.2, 0.5], ['—', 0.5, 0.55], ['really', 0.6, 0.9], ['', 0.9, 0.9], ['?', 0.9, 0.95], ['"', 1.0, 1.0], ['Yes."', 1.0, 1.4]]);
  const runs = { 'serif-word': ['Wait —', 'really?', '"Yes."'], sentence: ['Wait — really?', '"Yes."'] };
  for (const [preset, want] of Object.entries(runs)) {
    const { ctx } = makeCtx({ partDir: dir });
    const video = await cut(ctx, 2);
    const inputs = await layerInputsFor(video, {
      expect: { speech: 'voiceover', captions: true, caption_look: { preset } },
      timeline: { speech: [{ text: 'Wait — really? "Yes."', start_s: 0.2, end_s: 1.4, words }] },
    });
    const out = await mod.run(inputs, ctx);
    assert.deepEqual(vttTexts(out.captions.path), want, preset);
  }
});

test('sentence: overlapping lines are kept in line order, never interleaved word by word', { skip }, async () => {
  const { ctx } = makeCtx({ partDir: dir });
  const video = await cut(ctx, 3);
  const inputs = await layerInputsFor(video, {
    expect: { speech: 'voiceover', captions: true, caption_look: { preset: 'sentence' } },
    timeline: {
      speech: [
        { text: 'Pack it tonight.', start_s: 0.2, end_s: 1.2, words: timed([['Pack', 0.2, 0.5], ['it', 0.6, 0.8], ['tonight.', 0.9, 1.2]]) },
        { text: 'Sure thing.', start_s: 0.55, end_s: 1.5, words: timed([['Sure', 0.55, 0.85], ['thing.', 1.25, 1.5]]) },
      ],
    },
  });
  const out = await mod.run(inputs, ctx);
  assert.deepEqual(vttTexts(out.captions.path), ['Pack it tonight.', 'Sure thing.']);
});

test('serif-word: a closing single quote or a mark after the last word stays on the word before it, never lost', { skip }, async () => {
  const { ctx } = makeCtx({ partDir: dir });
  const video = await cut(ctx, 2);
  const words = timed([["'Hello", 0.2, 0.5], ["'", 0.5, 0.5], ['there', 0.6, 0.9], ['(', 0.9, 0.9]]);
  const inputs = await layerInputsFor(video, {
    expect: { speech: 'voiceover', captions: true, caption_look: { preset: 'serif-word' } },
    timeline: { speech: [{ text: "'Hello ' there (", start_s: 0.2, end_s: 0.9, words }] },
  });
  const out = await mod.run(inputs, ctx);
  assert.deepEqual(vttTexts(out.captions.path), ["'Hello'", 'there(']);
});

// captions-layer (since 1.2.0): the end-card stop, the caption look (plate, stroke, karaoke), the fallback for a
// look this version does not know, the bitrate cap and the size refusal.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, truncateSync } from 'node:fs';
import { join } from 'node:path';
import { loadNewest, browserMissing, browserProviderOrNull, countColor, fileRef, framePixels, hasFfmpeg, layerInputsFor, makeCtx, makeVideo } from '../../_tools/kit-harness.mjs';

const { dir, mod } = await loadNewest('captions-layer');
const ready = (await hasFfmpeg()) && browserProviderOrNull();
const skip = !ready && (browserMissing() || 'ffmpeg is not installed');
const PLATE = [58, 58, 60];
const YELLOW = [255, 212, 0];

function cuesOf(vtt) {
  return vtt.split(/\n\n+/).filter((b) => b.includes('-->')).map((b) => {
    const lines = b.split('\n');
    const at = lines.findIndex((l) => l.includes('-->'));
    const [a, z] = lines[at].split(' --> ');
    const sec = (s) => s.split(':').reduce((acc, v) => acc * 60 + Number(v), 0);
    return { start: sec(a), end: sec(z), text: lines.slice(at + 1).filter(Boolean).join(' ') };
  });
}

const timed = (list) => list.map(([text, s, e]) => ({ text, start_s: s, end_s: e }));

async function cut(ctx, seconds = 4) {
  return fileRef(await makeVideo(join(ctx.workDir, 'cut.mp4'), seconds, { width: 540, height: 960, tone: 440, pattern: 'color=c=0x2060c0' }), 'video');
}

/** The share of plate-grey pixels inside a caption box (a plate fills the gaps between letters). */
function plateShare(px, box) {
  let n = 0;
  let all = 0;
  for (let y = Math.ceil(box.y); y < box.y + box.h; y++) {
    for (let x = Math.ceil(box.x); x < box.x + box.w; x++) {
      const i = (y * px.width + x) * 3;
      all++;
      if (Math.abs(px.data[i] - PLATE[0]) <= 30 && Math.abs(px.data[i + 1] - PLATE[1]) <= 30 && Math.abs(px.data[i + 2] - PLATE[2]) <= 30) n++;
    }
  }
  return n / all;
}

/** The mean x of pixels near `rgb` in a full-size frame, or null when there are none. */
async function centroidX(path, at, rgb, tol = 40) {
  const px = await framePixels(path, at, 540, 960);
  let sum = 0;
  let n = 0;
  for (let i = 0; i < px.data.length; i += 3) {
    if (Math.abs(px.data[i] - rgb[0]) <= tol && Math.abs(px.data[i + 1] - rgb[1]) <= tol && Math.abs(px.data[i + 2] - rgb[2]) <= tol) {
      sum += (i / 3) % 540;
      n++;
    }
  }
  return n ? sum / n : null;
}

test('no caption is drawn inside the end card; the held caption stops where it starts', { skip }, async () => {
  const { ctx } = makeCtx({ partDir: dir });
  const video = await cut(ctx, 4);
  const words = timed([['Try', 0.2, 0.5], ['it', 0.6, 0.9], ['today', 1.0, 1.6]]);
  const card = timed([['Shop', 3.2, 3.5], ['now', 3.5, 3.8]]);
  const inputs = await layerInputsFor(video, {
    expect: { speech: 'voiceover', captions: true, end_card: true },
    timeline: {
      speech: [
        { scene_id: 's1', text: 'Try it today', start_s: 0.2, end_s: 1.6, words },
        { scene_id: 'card', text: 'Shop now', start_s: 3.2, end_s: 3.8, words: card },
      ],
      end_card: { start_s: 3.0, end_s: 4.0 },
    },
  });
  const out = await mod.run(inputs, ctx);
  const cues = cuesOf(readFileSync(out.captions.path, 'utf8'));
  assert.ok(!cues.some((c) => /Shop|now/.test(c.text)), `no end-card words in ${JSON.stringify(cues)}`);
  assert.ok(Math.abs(cues.at(-1).end - 3.0) < 0.01, `the last caption stops at the end card, not ${cues.at(-1).end}`);
  assert.ok(cues.every((c) => c.end <= 3.0 + 1e-3));
  assert.ok(countColor(await framePixels(out.video.path, 2.7), PLATE, 30) > 100, 'the last caption holds up to the end card');
  assert.equal(countColor(await framePixels(out.video.path, 3.5), PLATE, 30), 0, 'nothing drawn on the end card');
});

test('stroke: up to five outlined words, no plate, the brand name in the highlight colour', { skip }, async () => {
  const { ctx } = makeCtx({ partDir: dir });
  const video = await cut(ctx, 3);
  const words = timed([['Try', 0.2, 0.4], ['Drinkqx9', 0.5, 0.9], ['today', 1.0, 1.3], ['for', 1.4, 1.5], ['free.', 1.6, 2.0], ['Seriously', 2.1, 2.6]]);
  const inputs = await layerInputsFor(video, {
    brand: { name: 'DrinkQX9', colors: {}, fonts: {}, pronunciations: [] },
    expect: { speech: 'voiceover', captions: true, caption_look: { preset: 'stroke', highlight: ['brand'] } },
    timeline: { speech: [{ text: 'Try Drinkqx9 today for free. Seriously', start_s: 0.2, end_s: 2.6, words }] },
  });
  const out = await mod.run(inputs, ctx);
  const cues = cuesOf(readFileSync(out.captions.path, 'utf8'));
  assert.deepEqual(cues.map((c) => c.text), ['Try Drinkqx9 today for free.', 'Seriously'], 'a phrase ends at its full stop');
  const frame = await framePixels(out.video.path, 1.0, 540, 960);
  const record = JSON.parse(readFileSync(out.words.path, 'utf8'));
  assert.ok(plateShare(frame, record.cues[0].box) < 0.05, 'no plate behind the words');
  assert.ok(countColor(frame, YELLOW, 40) > 30, 'the brand word is drawn in the highlight colour');
  assert.ok(countColor(frame, [255, 255, 255], 30) > 100, 'white words');
  assert.ok(countColor(frame, [0, 0, 0], 20) > 100, 'a black outline');
  assert.equal(record.look.preset, 'stroke');
  const zone = out.timeline.safe_zones.find((z) => z.use === 'captions');
  for (const c of record.cues) assert.ok(c.box.x >= zone.x - 0.5 && c.box.x + c.box.w <= zone.x + zone.w + 0.5 && c.box.y >= zone.y - 0.5 && c.box.y + c.box.h <= zone.y + zone.h + 0.5, `${c.text} inside the band`);
});

test('karaoke: the spoken word takes the highlight colour and moves along the group', { skip }, async () => {
  const { ctx } = makeCtx({ partDir: dir });
  const video = await cut(ctx, 3);
  const words = timed([['one', 0.2, 0.6], ['two', 0.7, 1.1], ['three', 1.2, 1.6], ['four', 1.7, 2.1]]);
  const inputs = await layerInputsFor(video, {
    brand: { name: 'Sample Goods', colors: { primary: '#FF0000' }, fonts: {}, pronunciations: [] },
    expect: { speech: 'voiceover', captions: true, caption_look: { preset: 'karaoke', highlight_color: '#FFE800', case: 'upper', y: 0.75 } },
    timeline: { speech: [{ text: 'one two three four', start_s: 0.2, end_s: 2.1, words }] },
  });
  const out = await mod.run(inputs, ctx);
  const cues = cuesOf(readFileSync(out.captions.path, 'utf8'));
  assert.deepEqual(cues.map((c) => c.text), ['ONE TWO THREE FOUR'], 'one group, upper case, as drawn');
  const first = await centroidX(out.video.path, 0.4, [255, 232, 0]);
  const third = await centroidX(out.video.path, 1.4, [255, 232, 0]);
  assert.ok(first !== null && third !== null, 'the spoken word is highlighted');
  assert.ok(third > first + 40, `the highlight moves right (${first} -> ${third})`);
  assert.equal(await centroidX(out.video.path, 1.4, [255, 0, 0], 30), null, 'an explicit highlight colour wins over the brand primary');
  const record = JSON.parse(readFileSync(out.words.path, 'utf8'));
  const box = record.cues[0].box;
  assert.ok(Math.abs(box.y + box.h / 2 - 0.75 * 960) < 2, `centred at 0.75 of the height (${JSON.stringify(box)})`);
});

test('an unknown preset falls back to plate with a warning, and bad look values are dropped, never refused', { skip }, async () => {
  for (const look of [{ preset: 'sparkle' }, { preset: 'neon-glow', max_words: 20, y: 2, highlight_color: 'red', case: 'shout', font: 'comic' }]) {
    const { ctx, logs } = makeCtx({ partDir: dir });
    const video = await cut(ctx, 3);
    const words = timed([['Try', 0.2, 0.5], ['it', 0.6, 0.9], ['today', 1.0, 1.6]]);
    const inputs = await layerInputsFor(video, {
      expect: { speech: 'voiceover', captions: true, caption_look: look },
      timeline: { speech: [{ text: 'Try it today', start_s: 0.2, end_s: 1.6, words }] },
    });
    const out = await mod.run(inputs, ctx);
    const warns = logs.filter((l) => l[0] === 'warn').map((l) => l[1]);
    assert.ok(warns.some((m) => m.includes(look.preset) && m.includes('plate')), `a warning names ${look.preset}: ${JSON.stringify(warns)}`);
    if (look.max_words) assert.ok(warns.length >= 6, `each bad value is named: ${JSON.stringify(warns)}`);
    const record = JSON.parse(readFileSync(out.words.path, 'utf8'));
    assert.equal(record.look.preset, 'plate');
    assert.ok(record.cues.every((c) => c.text.split(' ').length <= 3), 'plate groups');
    assert.ok(plateShare(await framePixels(out.video.path, 1.0, 540, 960), record.cues.find((c) => c.start_s <= 1.0 && 1.0 < c.end_s).box) > 0.3, 'a plate is drawn');
  }
});

test('skip_first_scene leaves the first scene uncaptioned; case applies to the drawn words and the WebVTT', { skip }, async () => {
  const { ctx } = makeCtx({ partDir: dir });
  const video = await cut(ctx, 3);
  const inputs = await layerInputsFor(video, {
    expect: { speech: 'voiceover', captions: true, caption_look: { skip_first_scene: true, case: 'lower' } },
    timeline: {
      scenes: [{ id: 'hook', start_s: 0, end_s: 1.2 }, { id: 'body', start_s: 1.2, end_s: 3 }],
      speech: [
        { scene_id: 'hook', text: 'Stop Scrolling', start_s: 0.2, end_s: 1.0, words: timed([['Stop', 0.2, 0.5], ['Scrolling', 0.6, 1.0]]) },
        { scene_id: 'body', text: 'Buy It', start_s: 1.4, end_s: 2.0, words: timed([['Buy', 1.4, 1.6], ['It', 1.7, 2.0]]) },
      ],
    },
  });
  const out = await mod.run(inputs, ctx);
  const cues = cuesOf(readFileSync(out.captions.path, 'utf8'));
  assert.deepEqual(cues.map((c) => c.text), ['buy it']);
  assert.equal(countColor(await framePixels(out.video.path, 0.6), PLATE, 30), 0, 'nothing on the first scene');
});

test('refusals: a caption zone too small for a caption, and a result over 180 MB; the encode is capped at 16 Mbit/s', { skip }, async () => {
  {
    const { ctx } = makeCtx({ partDir: dir });
    const video = await cut(ctx, 2);
    const inputs = await layerInputsFor(video, {
      expect: { speech: 'voiceover', captions: true },
      timeline: { speech: [{ text: 'Try it', start_s: 0.2, end_s: 0.9, words: timed([['Try', 0.2, 0.5], ['it', 0.6, 0.9]]) }], safe_zones: [{ use: 'captions', x: 100, y: 500, w: 300, h: 10 }] },
    });
    await assert.rejects(mod.run(inputs, ctx), (e) => e.code === 'bad_input' && /too small/.test(e.message));
  }
  {
    const { ctx } = makeCtx({ partDir: dir });
    const exec = ctx.tools.exec;
    const calls = [];
    ctx.tools.exec = async (bin, args, options) => {
      const res = await exec(bin, args, options);
      calls.push(args);
      // Stand in for a huge encode: grow the result past the limit after ffmpeg wrote it.
      if (bin === 'ffmpeg' && String(args.at(-1)).endsWith('captioned.mp4')) truncateSync(args.at(-1), 181 * 1000 * 1000);
      return res;
    };
    const video = await cut(ctx, 2);
    const inputs = await layerInputsFor(video, {
      expect: { speech: 'voiceover', captions: true },
      timeline: { speech: [{ text: 'Try it', start_s: 0.2, end_s: 0.9, words: timed([['Try', 0.2, 0.5], ['it', 0.6, 0.9]]) }] },
    });
    await assert.rejects(mod.run(inputs, ctx), (e) => e.code === 'output_invalid' && /180 MB/.test(e.message));
    const encode = calls.find((a) => String(a.at(-1)).endsWith('captioned.mp4'));
    const at = encode.indexOf('-maxrate');
    assert.ok(at > encode.indexOf('libx264'), 'the cap follows the h264-master preset');
    assert.deepEqual(encode.slice(at, at + 4), ['-maxrate', '16M', '-bufsize', '32M']);
  }
});

test('the caption track stops for good at the end card: words spoken after the card are not captioned', { skip }, async () => {
  const { ctx } = makeCtx({ partDir: dir });
  const video = await cut(ctx, 4);
  const inputs = await layerInputsFor(video, {
    expect: { speech: 'voiceover', captions: true, end_card: true },
    timeline: {
      speech: [
        { scene_id: 's1', text: 'Try it today', start_s: 0.2, end_s: 1.6, words: timed([['Try', 0.2, 0.5], ['it', 0.6, 0.9], ['today', 1.0, 1.6]]) },
        { scene_id: 's2', text: 'Bye now', start_s: 3.3, end_s: 3.8, words: timed([['Bye', 3.3, 3.5], ['now', 3.5, 3.8]]) },
      ],
      end_card: { start_s: 2.5, end_s: 3.1 },
    },
  });
  const out = await mod.run(inputs, ctx);
  const cues = cuesOf(readFileSync(out.captions.path, 'utf8'));
  assert.ok(!cues.some((c) => /Bye|now/.test(c.text)), `no words after the end card in ${JSON.stringify(cues)}`);
  assert.ok(cues.every((c) => c.end <= 2.5 + 1e-3), `every caption ends by the card: ${JSON.stringify(cues)}`);
  assert.equal(countColor(await framePixels(out.video.path, 3.6), PLATE, 30), 0, 'nothing drawn after the end card');
});

test('outlined presets show at most five words even when max_words asks for more', { skip }, async () => {
  for (const preset of ['stroke', 'karaoke']) {
    const { ctx, logs } = makeCtx({ partDir: dir });
    const video = await cut(ctx, 3);
    const list = ['one', 'two', 'three', 'four', 'five', 'six', 'seven'].map((t, i) => [t, 0.2 + i * 0.3, 0.45 + i * 0.3]);
    const inputs = await layerInputsFor(video, {
      expect: { speech: 'voiceover', captions: true, caption_look: { preset, max_words: 8 } },
      timeline: { speech: [{ text: list.map((w) => w[0]).join(' '), start_s: 0.2, end_s: 2.25, words: timed(list) }] },
    });
    const out = await mod.run(inputs, ctx);
    const record = JSON.parse(readFileSync(out.words.path, 'utf8'));
    assert.equal(record.look.max_words, 5);
    assert.ok(record.cues.every((c) => c.text.split(' ').length <= 5), `${preset}: ${JSON.stringify(record.cues.map((c) => c.text))}`);
    assert.ok(logs.some((l) => l[0] === 'warn' && String(l[1]).includes('max_words')), 'the cut is logged');
  }
});

test('skip_first_scene also drops untagged words inside the first scene and never starts a caption before it ends', { skip }, async () => {
  const { ctx } = makeCtx({ partDir: dir });
  const video = await cut(ctx, 3);
  const inputs = await layerInputsFor(video, {
    expect: { speech: 'voiceover', captions: true, caption_look: { skip_first_scene: true } },
    timeline: {
      scenes: [{ id: 'hook', start_s: 0, end_s: 1.2 }, { id: 'body', start_s: 1.2, end_s: 3 }],
      speech: [
        { scene_id: 'hook', text: 'Stop', start_s: 0.2, end_s: 0.5, words: timed([['Stop', 0.2, 0.5]]) },
        { text: 'Wait', start_s: 0.6, end_s: 0.9, words: timed([['Wait', 0.6, 0.9]]) },
        { scene_id: 'body', text: 'Buy it', start_s: 1.1, end_s: 2.0, words: timed([['Buy', 1.1, 1.5], ['it', 1.6, 2.0]]) },
      ],
    },
  });
  const out = await mod.run(inputs, ctx);
  const cues = cuesOf(readFileSync(out.captions.path, 'utf8'));
  assert.ok(!cues.some((c) => /Stop|Wait/.test(c.text)), JSON.stringify(cues));
  assert.ok(cues.length && cues.every((c) => c.start >= 1.2 - 1e-3), `no caption starts inside the first scene: ${JSON.stringify(cues)}`);
});

test('when every word falls on the end card or the skipped first scene, the cut comes back uncaptioned, not refused', { skip }, async () => {
  const { ctx, logs } = makeCtx({ partDir: dir });
  const video = await cut(ctx, 3);
  const inputs = await layerInputsFor(video, {
    expect: { speech: 'voiceover', captions: true, end_card: true, caption_look: { skip_first_scene: true } },
    timeline: {
      scenes: [{ id: 'hook', start_s: 0, end_s: 1.2 }, { id: 'card', start_s: 1.2, end_s: 3 }],
      speech: [
        { scene_id: 'hook', text: 'Stop', start_s: 0.2, end_s: 0.5, words: timed([['Stop', 0.2, 0.5]]) },
        { scene_id: 'card', text: 'Shop now', start_s: 1.5, end_s: 2.0, words: timed([['Shop', 1.5, 1.7], ['now', 1.7, 2.0]]) },
      ],
      end_card: { start_s: 1.2, end_s: 3.0 },
    },
  });
  const out = await mod.run(inputs, ctx);
  assert.deepEqual(cuesOf(readFileSync(out.captions.path, 'utf8')), []);
  assert.deepEqual(JSON.parse(readFileSync(out.words.path, 'utf8')).cues, []);
  assert.equal(countColor(await framePixels(out.video.path, 0.4), PLATE, 30), 0);
  assert.ok(logs.some((l) => l[0] === 'warn' && String(l[1]).includes('no captions drawn')));
});

test('a plate max_words the look sets is a hard limit; a long brand name is still highlighted', { skip }, async () => {
  {
    const { ctx } = makeCtx({ partDir: dir });
    const video = await cut(ctx, 3);
    const inputs = await layerInputsFor(video, {
      expect: { speech: 'voiceover', captions: true, caption_look: { preset: 'plate', max_words: 1 } },
      timeline: { speech: [{ text: 'Try it today', start_s: 0.2, end_s: 0.8, words: timed([['Try', 0.2, 0.4], ['it', 0.4, 0.6], ['today', 0.6, 0.8]]) }] },
    });
    const out = await mod.run(inputs, ctx);
    const record = JSON.parse(readFileSync(out.words.path, 'utf8'));
    assert.deepEqual(record.cues.map((c) => c.text), ['Try', 'it', 'today']);
  }
  {
    const { ctx } = makeCtx({ partDir: dir });
    const video = await cut(ctx, 3);
    const name = 'The Very Long Name Of This Brand Company';
    const list = name.split(' ').map((t, i) => [t, 0.2 + i * 0.25, 0.4 + i * 0.25]);
    const inputs = await layerInputsFor(video, {
      brand: { name, colors: {}, fonts: {}, pronunciations: [] },
      expect: { speech: 'voiceover', captions: true, caption_look: { preset: 'stroke', highlight: ['brand'] } },
      timeline: { speech: [{ text: name, start_s: 0.2, end_s: 2.15, words: timed(list) }] },
    });
    const out = await mod.run(inputs, ctx);
    assert.ok(countColor(await framePixels(out.video.path, 1.9, 540, 960), YELLOW, 40) > 30, 'an eight-word brand name takes the highlight colour');
  }
});

test('an outlined caption that wraps in a short caption band shrinks to stay inside it', { skip }, async () => {
  const { ctx } = makeCtx({ partDir: dir });
  const video = await cut(ctx, 3);
  const list = ['Absolutely', 'everyone', 'deserves', 'wonderful', 'coffee'].map((t, i) => [t, 0.2 + i * 0.3, 0.45 + i * 0.3]);
  const inputs = await layerInputsFor(video, {
    expect: { speech: 'voiceover', captions: true, caption_look: { preset: 'stroke' } },
    timeline: { speech: [{ text: list.map((w) => w[0]).join(' '), start_s: 0.2, end_s: 1.65, words: timed(list) }], safe_zones: [{ use: 'captions', x: 120, y: 600, w: 300, h: 50 }] },
  });
  const out = await mod.run(inputs, ctx);
  const record = JSON.parse(readFileSync(out.words.path, 'utf8'));
  const zone = out.timeline.safe_zones.find((z) => z.use === 'captions');
  for (const c of record.cues) assert.ok(c.box.y >= zone.y - 0.5 && c.box.y + c.box.h <= zone.y + zone.h + 0.5, `${c.text} ${JSON.stringify(c.box)} inside ${JSON.stringify(zone)}`);
});

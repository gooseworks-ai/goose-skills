// captions-layer 1.6.0: a new shot never opens on the last shot's caption (two voiceover ads on
// 2026-10-15 showed the old caption on the first frame of the new shot), and a label low in the frame
// with a face high in it sends the captions to the middle.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { browserMissing, browserProviderOrNull, fileRef, hasFfmpeg, layerInputsFor, loadNewest, makeCtx, makeVideo } from '../../_tools/kit-harness.mjs';

const { dir, mod } = await loadNewest('captions-layer');
const ready = (await hasFfmpeg()) && browserProviderOrNull();
const skip = !ready && (browserMissing() || 'ffmpeg is not installed');

const w = (text, start_s, end_s) => ({ text, start_s, end_s });
const cue = (words, start_s, end_s) => ({ words, start_s, end_s });

test('a caption held over a cut stops on it, and the next one starts on it', () => {
  // an olive-oil ad, s9 to s10: "from that year's harvest." held on to 18.933, the cut is at 18.900
  // (the frame at or before "It's" at 18.933).
  const cues = [cue([w('harvest.', 18.1, 18.6)], 17.168, 18.933), cue([w("It's", 18.933, 19.1)], 18.933, 21.66)];
  mod.holdsStopAtCuts(cues, [17.167, 18.9, 21.633]);
  assert.equal(cues[0].end_s, 18.9);
  assert.equal(cues[1].start_s, 18.9);
});

test('a caption whose words run across the cut, a cut nothing is held over, and a late next word are left alone', () => {
  const across = [cue([w('a', 1.5, 1.8), w('b', 2.05, 2.3)], 1.5, 2.6), cue([w('c', 2.6, 2.9)], 2.6, 3.0)];
  mod.holdsStopAtCuts(across, [2.0]);
  assert.deepEqual([across[0].end_s, across[1].start_s], [2.6, 2.6]);
  const gap = [cue([w('a', 1.0, 1.4)], 1.0, 1.9), cue([w('b', 2.1, 2.4)], 2.1, 2.4)];
  mod.holdsStopAtCuts(gap, [2.0]);
  assert.deepEqual([gap[0].end_s, gap[1].start_s], [1.9, 2.1]);
  // held over the cut, but the next word comes 0.6 s later (a street answer's held caption): as 1.5.0
  const late = [cue([w('a', 1.0, 1.7)], 1.0, 2.2), cue([w('b', 2.6, 2.9)], 2.6, 2.9)];
  mod.holdsStopAtCuts(late, [2.0]);
  assert.deepEqual([late[0].end_s, late[1].start_s], [2.2, 2.6]);
});

test('drawn: the frame on the cut shows the new shot\'s caption, not the old one', { skip }, async () => {
  const { ctx } = makeCtx({ partDir: dir });
  // Part paths are POSIX; on a Windows checkout a drive-less path reads the same file.
  const posix = (r) => ({ ...r, path: r.path.replace(/^[A-Za-z]:/, '').replace(/\\/g, '/') });
  const file = ctx.file;
  ctx.file = async (...a) => posix(await file(...a));
  const video = posix(await fileRef(await makeVideo(join(ctx.workDir, 'cut.mp4'), 3.5, { width: 540, height: 960, tone: 440, pattern: 'color=c=0x2060c0' }), 'video'));
  // The cut is at 2.000; "for" starts 2.030, one frame later at 30 fps.
  const said = [w('Try', 0.2, 0.5), w('it', 0.6, 0.9), w('today', 1.5, 1.9), w('for', 2.03, 2.3), w('free', 2.4, 2.8)];
  const inputs = await layerInputsFor(video, {
    expect: { speech: 'voiceover', captions: true, caption_look: { preset: 'karaoke', max_words: 5 } },
    timeline: {
      scenes: [{ id: 's1', start_s: 0, end_s: 2 }, { id: 's2', start_s: 2, end_s: 3.5 }],
      speech: [{ scene_id: 's1', text: 'Try it today', start_s: 0.2, end_s: 1.9, words: said.slice(0, 3) }, { scene_id: 's2', text: 'for free', start_s: 2.03, end_s: 2.8, words: said.slice(3) }],
    },
  });
  const out = await mod.run(inputs, ctx);
  const record = JSON.parse(readFileSync(out.words.path, 'utf8'));
  const first = record.cues.find((c) => /today/.test(c.text));
  const second = record.cues.find((c) => /for free/.test(c.text));
  assert.equal(first.end_s, 2, 'the held caption stops on the cut');
  assert.equal(second.start_s, 2, 'the next caption starts on the cut');
});

test('a label low in the frame and a face high in it: the captions go to the middle (0.45)', { skip }, async () => {
  const { ctx } = makeCtx({ partDir: dir });
  const posix = (r) => ({ ...r, path: r.path.replace(/^[A-Za-z]:/, '').split(String.fromCharCode(92)).join('/') });
  const file = ctx.file;
  ctx.file = async (...a) => posix(await file(...a));
  const W = 540;
  const H = 960;
  const video = posix(await fileRef(await makeVideo(join(ctx.workDir, 'cut.mp4'), 2.5, { width: W, height: H, tone: 440, pattern: 'color=c=0x2060c0' }), 'video'));
  const said = [w('and', 0.2, 0.4), w('stop', 0.45, 0.8), w('guessing', 0.85, 1.3)];
  const box = (y0, y1) => ({ start_s: 0, end_s: 2.5, use: 'product', box: { x: 0.25 * W, y: y0 * H, w: 0.5 * W, h: (y1 - y0) * H } });
  const inputs = await layerInputsFor(video, {
    expect: { speech: 'voiceover', captions: true, caption_look: { preset: 'karaoke', max_words: 5, y: 0.82 } },
    timeline: {
      scenes: [{ id: 's16', start_s: 0, end_s: 2.5 }],
      speech: [{ scene_id: 's16', text: 'and stop guessing', start_s: 0.2, end_s: 1.3, words: said }],
      // a knee sleeve ad, s16: the sleeve's label on the knee, the man's face above it
      keep_clear: [box(0.55, 0.75), box(0.18, 0.36)],
    },
  });
  const record = JSON.parse(readFileSync((await mod.run(inputs, ctx)).words.path, 'utf8'));
  for (const c of record.cues) {
    assert.equal(c.y, 0.45, c.text);
    assert.equal(c.overlap, 0);
  }
});

// assemble 1.3.0: a still's keep_clear (where the product is) comes out as timeline.keep_clear on the cut, so
// the captions layer keeps off the label (two product ads on 2026-10-15 had captions on the label).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { join } from 'node:path';
import { fileRef, hasFfmpeg, loadNewest, makeCtx, run } from '../../_tools/kit-harness.mjs';
import { assembleMapKeepClear } from '../src/cuts.mjs';

const { dir, mod } = await loadNewest('assemble');
const skip = !(await hasFfmpeg()) && 'ffmpeg is not installed';
// Part paths are POSIX; on a Windows checkout a drive-less path reads the same file.
const posix = (r) => ({ ...r, path: r.path.replace(/^[A-Za-z]:/, '').replace(/\\/g, '/') });

test('a box on a 9:16 still lands on the same place of a 9:16 cut, grown by the push', () => {
  // the lower middle of the picture, no push: the same shares of the 1080x1920 cut
  assert.deepEqual(assembleMapKeepClear({ x: 0.25, y: 0.5, w: 0.5, h: 0.3 }, 1080, 1920, 1080, 1920, 'cover', 1), { x: 270, y: 960, w: 540, h: 576 });
  // a 5 % centred push carries the bottom edge down and the sides out: the box covers both ends of the push
  const b = assembleMapKeepClear({ x: 0.25, y: 0.5, w: 0.5, h: 0.3 }, 1080, 1920, 1080, 1920, 'cover', 1.05);
  assert.deepEqual(b, { x: 256, y: 960, w: 568, h: 605 });
  // a square still covered onto 9:16 is cropped at the sides: a box in the cropped part is gone
  assert.equal(assembleMapKeepClear({ x: 0, y: 0.4, w: 0.15, h: 0.2 }, 1000, 1000, 1080, 1920, 'cover', 1), null);
});

test('drawn: each still\'s boxes come back in timeline.keep_clear for its span; a still without them adds none', { skip }, async () => {
  const { ctx } = makeCtx({ partDir: dir });
  const file = ctx.file;
  ctx.file = async (...a) => posix(await file(...a));
  const still = async (name, color) => {
    const path = join(ctx.workDir, name);
    await run('ffmpeg', ['-hide_banner', '-nostdin', '-loglevel', 'error', '-y', '-f', 'lavfi', '-i', `color=c=${color}:s=360x640:d=1`, '-frames:v', '1', path]);
    return posix(await fileRef(path, 'image'));
  };
  const out = await mod.run(
    {
      clips: [
        { id: 's1', image: await still('a.png', 'red') },
        { id: 's2', image: await still('b.png', 'blue'), keep_clear: [{ x: 0.3, y: 0.45, w: 0.4, h: 0.4 }] },
      ],
      width: 360,
      height: 640,
      fps: 30,
      spans: [{ id: 's1', start_s: 0, end_s: 1.0 }, { id: 's2', start_s: 1.02, end_s: 2.0 }],
      tail_s: 0.25,
      motion: { stills: 'ken_burns', to: 1.05 },
    },
    ctx,
  );
  const tl = out.timeline;
  assert.equal(tl.keep_clear.length, 1);
  const k = tl.keep_clear[0];
  assert.equal(k.scene_id, 's2');
  assert.equal(k.use, 'product');
  assert.equal(k.start_s, tl.scenes[1].start_s);
  assert.equal(k.end_s, tl.scenes[1].end_s);
  assert.ok(k.box.y <= 0.45 * 640 && k.box.y + k.box.h >= 0.85 * 640, JSON.stringify(k.box));
});

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { kitMediaLength } from './length.mjs';
import { PARTS_ROOT, fileRef, hasFfmpeg, makeCtx, run } from '../_tools/kit-harness.mjs';

const skip = !(await hasFfmpeg()) && 'ffmpeg is not installed';

// A streaming recording: written to a pipe, so the muxer cannot go back and write a duration.
async function streamingWebm(dir) {
  const { stdoutBuffer } = await run('ffmpeg', ['-hide_banner', '-nostdin', '-loglevel', 'error', '-f', 'lavfi', '-i', 'testsrc2=size=320x240:rate=30:duration=4', '-f', 'lavfi', '-i', 'sine=d=4', '-c:v', 'libvpx', '-b:v', '300k', '-c:a', 'libopus', '-f', 'webm', 'pipe:1']);
  const path = join(dir, 'stream.webm');
  writeFileSync(path, stdoutBuffer);
  return path;
}

test('a streaming WebM with no container length is measured from its packets', { skip }, async () => {
  const { ctx } = makeCtx({ partDir: join(PARTS_ROOT, 'cut-footage', '1.0.2') });
  const ref = await fileRef(await streamingWebm(ctx.workDir), 'video');
  assert.equal(ref.duration_s, undefined, 'the fixture has no container length');
  const seconds = await kitMediaLength(ctx, ref);
  assert.ok(Math.abs(seconds - 4) < 0.1, `measured ${seconds} s`);
});

test('a recording cut off halfway is refused as damaged, not measured short', { skip }, async () => {
  const { ctx } = makeCtx({ partDir: join(PARTS_ROOT, 'cut-footage', '1.0.2') });
  const whole = readFileSync(await streamingWebm(ctx.workDir));
  const half = join(ctx.workDir, 'half.webm');
  writeFileSync(half, whole.subarray(0, Math.floor(whole.length / 2)));
  await assert.rejects(kitMediaLength(ctx, await fileRef(half, 'video')), (e) => e.code === 'bad_input' && /damaged or incomplete/.test(e.message));
});

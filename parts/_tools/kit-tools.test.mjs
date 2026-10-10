import { test } from 'node:test';
import assert from 'node:assert/strict';
import { hasFfmpeg, kitToolsReport } from './kit-harness.mjs';

const skip = !(await hasFfmpeg()) && 'ffmpeg is not installed';

test('the part tests name the ffmpeg and ffprobe they run on', { skip }, async (t) => {
  const r = await kitToolsReport();
  t.diagnostic(`kit-harness tools: ffmpeg ${r.version} at ${r.ffmpeg}, ffprobe at ${r.ffprobe} (from ${r.source === 'kit' ? 'the kit build' : r.source})`);
  assert.ok(r.version, 'the selected ffmpeg runs');
});

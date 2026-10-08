// Cuts for the check layer's tests, levelled to -14 LUFS as the sound layer leaves them.
import { join } from 'node:path';
import { fileRef, makeVideo, run } from '../../_tools/kit-harness.mjs';

export async function levelledCut(dir, name, seconds, { width = 720, height = 1280, pattern = 'testsrc2' } = {}) {
  const raw = join(dir, `${name}-raw.mp4`);
  await makeVideo(raw, seconds, { width, height, tone: 440, pattern });
  const out = join(dir, `${name}.mp4`);
  await run('ffmpeg', ['-hide_banner', '-nostdin', '-loglevel', 'error', '-y', '-i', raw, '-c:v', 'copy', '-af', 'loudnorm=I=-14:TP=-1.5:LRA=11', '-c:a', 'aac', '-ar', '48000', out]);
  return fileRef(out, 'video');
}

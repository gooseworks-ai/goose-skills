// An on-camera cut whose transcript says a different number than the script;
// the fake line answers the transcription with fal Whisper's shape.
import { join } from 'node:path';
import { fileRef, layerInputsFor, makeVideo, run } from '../../_tools/kit-harness.mjs';

export async function levelledCut(dir, name, seconds, { width = 720, height = 1280, pattern = 'testsrc2' } = {}) {
  const raw = join(dir, `${name}-raw.mp4`);
  await makeVideo(raw, seconds, { width, height, tone: 440, pattern });
  const out = join(dir, `${name}.mp4`);
  await run('ffmpeg', ['-hide_banner', '-nostdin', '-y', '-i', raw, '-c:v', 'copy', '-af', 'loudnorm=I=-14:TP=-1.5:LRA=11', '-c:a', 'aac', '-ar', '48000', out]);
  return fileRef(out, 'video');
}

export const sample = {
  async inputs(workDir) {
    const video = await levelledCut(workDir, 'on-camera', 4);
    return layerInputsFor(video, { expect: { speech: 'on_camera', script: ['Try it for 30 days.'], duration_s: { min: 2, max: 10 } } });
  },
  async line() {
    return { json: { text: ' Try it for 13 days.', chunks: [] }, files: {}, reused: false };
  },
};

// A fake private line for lipsync-veed. The answer is the recorded veed/fabric-1.0
// reply (GOOSE-4015 W0-62 contracts, replies/veed--fabric-1.0.json `answer`): fal's
// output verbatim, read at /json/video/url. The clip is the face's picture for the
// audio's length, a few milliseconds short as Veed returns them, with that audio.
import { join } from 'node:path';
import { fileRef, makeTone, run } from '../../_tools/kit-harness.mjs';

export const ANSWER = {
  json: {
    video: {
      url: 'https://v3b.fal.media/files/b/fixture/clip.mp4',
      content_type: 'video/mp4',
      file_name: 'clip.mp4',
      file_size: 4404019,
    },
  },
};
export const POINTER = '/json/video/url';

export async function face(dir, key, color) {
  const path = join(dir, `face-${key}.png`);
  await run('ffmpeg', ['-hide_banner', '-nostdin', '-loglevel', 'error', '-y', '-f', 'lavfi', '-i', `color=c=${color}:size=360x640:duration=1`, '-frames:v', '1', path]);
  return { key, image: await fileRef(path, 'image') };
}

export async function lineAudio(dir, sceneId, seconds, freq) {
  const path = join(dir, `line-${sceneId}.wav`);
  await makeTone(path, seconds, { freq });
  return { scene_id: sceneId, audio: await fileRef(path, 'audio') };
}

/** Veed's clip for one order: `short_s` under the audio's length (Veed's usual 2 to 35 ms). */
export async function veedClip(order, ctx, { short_s = 0.02 } = {}) {
  const name = order.results[0].name;
  const path = join(ctx.workDir, name);
  const seconds = Math.max(0.2, order.body.audio_url.duration_s - short_s);
  const size = order.body.resolution === '480p' ? '480x854' : '720x1280';
  await run('ffmpeg', [
    '-hide_banner', '-nostdin', '-loglevel', 'error', '-y',
    '-loop', '1', '-framerate', '25', '-i', order.body.image_url.path,
    '-i', order.body.audio_url.path,
    '-vf', `scale=${size},format=yuv420p`, '-t', String(seconds),
    '-c:v', 'libx264', '-preset', 'ultrafast', '-c:a', 'aac', '-shortest', path,
  ]);
  return { ...structuredClone(ANSWER), files: { [name]: await fileRef(path, 'video') }, reused: false };
}

export const sample = {
  async inputs(workDir) {
    return {
      scenes: [
        { id: 's1', line: 'So I stopped cooking on weeknights.', speaker: 'a', on_screen: null, picture: null },
        { id: 's2', line: 'Wait, completely?', speaker: 'b', on_screen: null, picture: null },
        { id: 's3', line: null, speaker: null, on_screen: 'End card', picture: null },
        { id: 's4', line: 'Completely. It changed my evenings.', speaker: 'a', on_screen: null, picture: null },
      ],
      lines: [await lineAudio(workDir, 's1', 1.6, 300), await lineAudio(workDir, 's2', 0.9, 500), await lineAudio(workDir, 's4', 1.8, 300)],
      faces: [await face(workDir, 'a', '0xd08040'), await face(workDir, 'b', '0x4080d0')],
      resolution: '720p',
      idle_seconds: 2,
      max_seconds: 10,
    };
  },
  line: (order, ctx) => veedClip(order, ctx),
};

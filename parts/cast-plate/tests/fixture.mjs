// A fake private line for cast-plate. The reply is fal's recorded answer for
// openai/gpt-image-2 (W0-62, scratchpad contracts/replies/openai--gpt-image-2.json
// "answer", identical for /edit): {json: {images: [{url, content_type,
// file_name, file_size, width, height}]}}, read at /json/images/0/url. The
// picture itself is drawn locally: by default a test pattern at the size asked
// for; `paint` gives a left-red, right-blue plate so tests can see where the
// singles were cut.
import { join } from 'node:path';
import { fileRef, run } from '../../_tools/kit-harness.mjs';

export const RECORDED_ANSWER = {
  json: {
    images: [
      {
        url: 'https://v3b.fal.media/files/b/fixture/still.png',
        content_type: 'image/png',
        file_name: 'still.png',
        file_size: 1834512,
        width: 1088,
        height: 1920,
      },
    ],
  },
};
export const RECORDED_POINTER = '/json/images/0/url';

/** A PNG at w x h: 'pattern' (testsrc2), 'halves' (left red, right blue) or 'flat' (one grey). */
export async function plateFile(path, w, h, paint = 'pattern') {
  let args;
  if (paint === 'halves') {
    const half = Math.floor(w / 2);
    args = ['-f', 'lavfi', '-i', `color=c=red:s=${half}x${h}:d=1`, '-f', 'lavfi', '-i', `color=c=blue:s=${w - half}x${h}:d=1`, '-filter_complex', '[0:v][1:v]hstack=inputs=2'];
  } else if (paint === 'flat') {
    args = ['-f', 'lavfi', '-i', `color=c=gray:s=${w}x${h}:d=1`];
  } else {
    args = ['-f', 'lavfi', '-i', `testsrc2=size=${w}x${h}:duration=1`];
  }
  await run('ffmpeg', ['-hide_banner', '-nostdin', '-loglevel', 'error', '-y', ...args, '-frames:v', '1', path]);
  return path;
}

export async function personStill(dir, name = 'person.png') {
  const path = join(dir, name);
  await run('ffmpeg', ['-hide_banner', '-nostdin', '-loglevel', 'error', '-y', '-f', 'lavfi', '-i', 'testsrc2=size=512x512:duration=1', '-frames:v', '1', path]);
  return fileRef(path, 'image');
}

/** A fake line answering with the recorded reply; the picture is `size` (default: the size asked for) painted `paint`. */
export function fakeLine({ paint = 'pattern', size } = {}) {
  return async (order, ctx) => {
    const name = order.results[0].name;
    const want = size || order.body.image_size;
    const path = await plateFile(join(ctx.workDir, `reply-${name}`), want.width, want.height, paint);
    const json = structuredClone(RECORDED_ANSWER.json);
    json.images[0].width = want.width;
    json.images[0].height = want.height;
    return { json, files: { [name]: await fileRef(path, 'image') }, reused: false };
  };
}

export const sample = {
  async inputs() {
    return {
      cast: [
        { key: 'a', name: 'Maya', look: 'woman, 34, curly dark hair, olive overshirt', gender: 'female', age: 34, role: 'host', voice_id: 'EXAVITQu4vr4xnSDxMaL' },
        { key: 'b', name: 'Theo', look: 'man, 41, close-cropped grey beard, navy crewneck', gender: 'male', age: 41, role: 'guest', voice_id: 'TxGEqnHWrfWFTfGW9XjX' },
      ],
      room: 'a treated office corner with walnut slat panels and a monstera',
      layout: 'two_shot',
      size: '2304x1296',
      quality: 'high',
    };
  },
  line: fakeLine(),
};

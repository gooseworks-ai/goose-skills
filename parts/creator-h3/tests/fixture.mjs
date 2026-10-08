// A fake private line for creator-h3: each take comes back as a moving
// picture with a tone for the voice, starting after a short silence.
import { join } from 'node:path';
import { fileRef, run } from '../../_tools/kit-harness.mjs';

export async function still(dir) {
  const path = join(dir, 'creator.png');
  await run('ffmpeg', ['-hide_banner', '-nostdin', '-y', '-f', 'lavfi', '-i', 'testsrc2=size=360x640:duration=1', '-frames:v', '1', path]);
  return fileRef(path, 'image');
}

export const sample = {
  async inputs(workDir) {
    return {
      scenes: [
        { id: 's1', line: 'I tried this for a month and here is what happened to my sleep.' },
        { id: 's2', line: 'The first week felt the same, honestly nothing changed at all for me.' },
        { id: 's3', line: 'Then the second week I started waking up before my alarm.' },
        { id: 's4', line: 'Now I would not go back. Link below if you want to try it.' },
      ],
      character: { image: await still(workDir), identity: 'a woman in her early 30s, shoulder-length black hair, grey t-shirt', environment: 'a lived-in home office with a bookshelf' },
      resolution: '768P',
      max_seconds: 40,
    };
  },
  async line(order, ctx) {
    const name = order.results[0].name;
    const path = join(ctx.workDir, name);
    const d = order.body.duration;
    await run('ffmpeg', ['-hide_banner', '-nostdin', '-y', '-f', 'lavfi', '-i', `testsrc2=size=360x640:rate=24:duration=${d}`, '-f', 'lavfi', '-i', `sine=frequency=300:duration=${d - 0.4}:sample_rate=48000`, '-filter_complex', '[1:a]adelay=200:all=1,apad[a]', '-map', '0:v', '-map', '[a]', '-c:v', 'libx264', '-preset', 'ultrafast', '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-ac', '1', '-t', String(d), path]);
    return { json: { video: { url: 'https://fal.media/x.mp4' } }, files: { [name]: await fileRef(path, 'video') }, reused: false };
  },
};

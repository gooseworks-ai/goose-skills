// A fake private line for video-seedance-2: each clip comes back with a tone for its native voice.
import { join } from 'node:path';
import { fileRef, run } from '../../_tools/kit-harness.mjs';
import { still } from '../../creator-h3/tests/fixture.mjs';

export const sample = {
  async inputs(workDir) {
    const person = await still(workDir);
    return { clips: [{ id: 'hook', prompt: 'SCENE 1 (0-4s) WIDE HOOK: she holds the bottle and says "this changed my mornings".', references: [person], seconds: 5 }], resolution: '720p' };
  },
  async line(order, ctx) {
    const name = order.results[0].name;
    const path = join(ctx.workDir, name);
    const d = order.body.duration;
    const args = ['-hide_banner', '-nostdin', '-y', '-f', 'lavfi', '-i', `testsrc2=size=360x640:rate=24:duration=${d}`];
    if (order.body.generate_audio) args.push('-f', 'lavfi', '-i', `sine=frequency=300:duration=${d}`, '-c:a', 'aac');
    args.push('-c:v', 'libx264', '-preset', 'ultrafast', '-pix_fmt', 'yuv420p', '-shortest', path);
    await run('ffmpeg', args);
    return { json: { video: { url: 'https://fal.media/c.mp4' }, seed: 1 }, files: { [name]: await fileRef(path, 'video') }, reused: false };
  },
};

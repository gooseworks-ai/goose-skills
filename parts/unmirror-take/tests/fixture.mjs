// A sample run for parts.test.mjs: a 6 s take, one product photo, and a reply that finds the take the right way round.
import { join } from 'node:path';
import { fileRef, makeVideo, run } from '../../_tools/kit-harness.mjs';

export const sample = {
  async inputs(workDir) {
    const video = await fileRef(await makeVideo(join(workDir, 'take.mp4'), 6, { width: 360, height: 640 }), 'video');
    const photo = join(workDir, 'pack.png');
    await run('ffmpeg', ['-hide_banner', '-nostdin', '-loglevel', 'error', '-y', '-f', 'lavfi', '-i', 'testsrc2=size=360x640', '-frames:v', '1', photo]);
    return {
      video,
      timeline: { duration_s: 6, width: 360, height: 640, fps: 30, scenes: [{ id: 's1', start_s: 0, end_s: 6 }], speech: [] },
      products: [{ id: 'p1', name: 'Dal Chawal', images: [await fileRef(photo, 'image')] }],
    };
  },
  line: async () => ({
    json: { output: JSON.stringify({ frames: [2, 3, 4, 5].map((image) => ({ image, product_seen: true, mirrored: false })) }) },
    files: {},
  }),
};

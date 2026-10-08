// A fake private line for music-elevenlabs: the bed comes back as a tone of
// the ordered length.
import { join } from 'node:path';
import { fileRef, makeTone } from '../../_tools/kit-harness.mjs';

export const sample = {
  inputs: () => ({ mood: 'warm-lofi', brief: 'Instrumental bed for a calm browse, no vocals.', seconds: 6 }),
  async line(order, ctx) {
    const path = join(ctx.workDir, order.results[0].name);
    await makeTone(path, order.body.music_length_ms / 1000, { freq: 220, codec: ['-c:a', 'libmp3lame'] });
    return { json: null, files: { [order.results[0].name]: await fileRef(path, 'audio') }, reused: false };
  },
};

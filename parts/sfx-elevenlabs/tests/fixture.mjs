// A fake private line for sfx-elevenlabs: each effect comes back a little longer than asked.
import { join } from 'node:path';
import { fileRef, makeTone } from '../../_tools/kit-harness.mjs';

export const sample = {
  inputs: () => ({ effects: [{ id: 'whoosh', prompt: 'a quick soft whoosh', seconds: 1 }, { prompt: 'a bright pop', seconds: 0.5, prompt_influence: 0.6 }] }),
  async line(order, ctx) {
    const path = join(ctx.workDir, order.results[0].name);
    await makeTone(path, order.body.duration_seconds + 0.4, { freq: 880, codec: ['-c:a', 'libmp3lame'] });
    return { json: null, files: { [order.results[0].name]: await fileRef(path, 'audio') }, reused: false };
  },
};

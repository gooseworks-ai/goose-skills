// A fake private line for voice-elevenlabs: each ordered line comes back as a
// tone whose length follows the text, with an even character alignment.
import { join } from 'node:path';
import { fakeAlignment, fileRef, makeTone } from '../../_tools/kit-harness.mjs';

export const sample = {
  inputs: () => ({
    scenes: [
      { id: 's1', line: 'Meet Drinkag1 today.', on_screen: 'Hello', picture: 'a glass' },
      { id: 's2', line: '' },
      { id: 's3', line: 'It tastes great.' },
    ],
    voice_id: 'dMyQqiVXTU80dDl2eNK8',
    pronunciations: [{ term: 'Drinkag1', say_as: 'drink A G one' }],
  }),
  async line(order, ctx) {
    const seconds = Math.max(0.5, order.body.text.length * 0.05);
    const name = order.results[0].name;
    const path = join(ctx.workDir, name);
    await makeTone(path, seconds, { codec: ['-c:a', 'libmp3lame'] });
    return {
      json: { alignment: fakeAlignment(order.body.text, seconds) },
      files: { [name]: await fileRef(path, 'audio') },
      reused: false,
    };
  },
};

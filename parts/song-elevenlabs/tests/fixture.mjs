// A fake private line for song-elevenlabs, built from the recorded W0-62 reply
// (tests/music-detailed-reply.mjs): the line answers {json, file_url}, the kit
// downloads /file_url, and the part reads the words from json.words_timestamps.
// The audio is a tone as long as the composition plan.
import { join } from 'node:path';
import { fileRef, makeTone } from '../../_tools/kit-harness.mjs';
import { musicDetailedAnswer } from './music-detailed-reply.mjs';

/** Plan inputs whose composition plan is exactly the recorded request's. */
export const recordedInputs = () => ({
  scenes: [
    { id: 's1', line: 'Pack it small', picture: 'a folded jacket' },
    { id: 's2', line: 'take it all' },
    { id: 's3', line: 'One jacket, every trip' },
  ],
  mood: 'upbeat pop',
  singer: 'female vocal',
  brief: 'bright synths',
  avoid: ['metal'],
  sections: [
    { name: 'Verse', seconds: 8, scenes: [1, 2], styles: ['light drums'] },
    { name: 'Chorus', seconds: 8, scenes: [3, 3], styles: ['big drums'] },
  ],
  hook: 'One',
  hook_scene: 3,
});

/** The plan's length in seconds, from an order's composition plan. */
export function planSeconds(order) {
  return order.body.composition_plan.sections.reduce((s, x) => s + x.duration_ms, 0) / 1000;
}

/** A fake line: `json(order)` is the reply's JSON part; the audio is a tone of the plan's length. */
export function songLine(json, { seconds } = {}) {
  return async (order, ctx) => {
    const name = order.results[0].name;
    const path = join(ctx.workDir, name);
    await makeTone(path, seconds ?? planSeconds(order), { freq: 330, codec: ['-c:a', 'libmp3lame'] });
    return { json: await json(order), files: { [name]: await fileRef(path, 'audio') }, reused: false };
  };
}

export const sample = {
  inputs: recordedInputs,
  line: songLine(() => structuredClone(musicDetailedAnswer.json)),
};

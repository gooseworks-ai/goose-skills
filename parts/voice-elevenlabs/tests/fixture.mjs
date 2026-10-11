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

// The line's recorded answer for POST /v1/text-to-speech/{voice_id}/with-timestamps (GOOSE-4015 contract
// replies, elevenlabs-tts-with-timestamps.json): the line drops audio_base64, keeps both alignments as
// `json` and stores the mp3 as a line file (`file_url`). Its text is "Hi there.".
export const recordedReply = {
  text: 'Hi there.',
  seconds: 0.8,
  json: {
    alignment: {
      characters: ['H', 'i', ' ', 't', 'h', 'e', 'r', 'e', '.'],
      character_start_times_seconds: [0.0, 0.07, 0.15, 0.21, 0.28, 0.35, 0.41, 0.48, 0.55],
      character_end_times_seconds: [0.07, 0.15, 0.21, 0.28, 0.35, 0.41, 0.48, 0.55, 0.7],
    },
    normalized_alignment: {
      characters: ['H', 'i', ' ', 't', 'h', 'e', 'r', 'e', '.'],
      character_start_times_seconds: [0.0, 0.07, 0.15, 0.21, 0.28, 0.35, 0.41, 0.48, 0.55],
      character_end_times_seconds: [0.07, 0.15, 0.21, 0.28, 0.35, 0.41, 0.48, 0.55, 0.7],
    },
  },
  async line(order, ctx) {
    const name = order.results[0].name;
    const path = join(ctx.workDir, name);
    await makeTone(path, recordedReply.seconds, { codec: ['-c:a', 'libmp3lame'] });
    return { json: structuredClone(recordedReply.json), files: { [name]: await fileRef(path, 'audio') }, reused: false };
  },
};

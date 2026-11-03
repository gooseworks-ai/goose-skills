// A cut with a tone for speech; the fake line answers with fal Whisper's word
// chunks, where "two hundred" is heard as "200" and "thirty" as "13".
import { join } from 'node:path';
import { fileRef, makeVideo } from '../../_tools/kit-harness.mjs';

const chunk = (text, s, e) => ({ text, timestamp: [s, e] });

export const sample = {
  async inputs(workDir) {
    const video = await fileRef(await makeVideo(join(workDir, 'take.mp4'), 5, { width: 360, height: 640, tone: 300 }), 'video');
    return {
      video,
      scenes: [
        { id: 's1', line: 'Meet two hundred happy customers.' },
        { id: 's2', line: '' },
        { id: 's3', line: 'Try it for thirty days.' },
      ],
    };
  },
  async line() {
    return {
      json: {
        chunks: [
          chunk('Meet', 0.2, 0.5), chunk('200', 0.6, 1.2), chunk('happy', 1.3, 1.7), chunk('customers.', 1.8, 2.4),
          chunk('Try', 2.8, 3.0), chunk('it', 3.0, 3.1), chunk('for', 3.1, 3.3), chunk('13', 3.3, 3.8), chunk('days.', 3.8, 4.2),
        ],
      },
      files: {},
      reused: false,
    };
  },
};

/** A Whisper word chunk as fal writes it, with a leading space. */
export const whisperChunk = (text, s, e) => ({ text: ` ${text}`, timestamp: [s, e] });

/** The staging take of 13 Oct 2026 (video 8d36c372): Whisper's reply, word for word, with the question said twice. */
export const repeatedQuestion = {
  scenes: [
    { id: 's1', line: 'Who made all these ads?' },
    { id: 's2', line: 'A big agency, for sure.' },
    { id: 's3', line: null },
    { id: 's4', line: 'A whole design team?' },
    { id: 's5', line: 'No way. One AI coworker made these.' },
  ],
  chunks: [
    whisperChunk('Who', 0.03, 0.13), whisperChunk('made', 0.13, 0.37), whisperChunk('all', 0.37, 0.55), whisperChunk('these', 0.55, 0.73), whisperChunk('ads?', 0.73, 1.19),
    whisperChunk('Who', 2.35, 2.53), whisperChunk('made', 2.53, 2.75), whisperChunk('all', 2.75, 2.91), whisperChunk('these', 2.91, 3.09), whisperChunk('ads?', 3.09, 3.47),
    whisperChunk('A', 3.85, 4.03), whisperChunk('big', 4.03, 4.29), whisperChunk('agency,', 4.29, 4.85), whisperChunk('for', 4.85, 5.13), whisperChunk('sure.', 5.13, 5.65),
    whisperChunk('A', 6.69, 6.83), whisperChunk('whole', 6.83, 7.15), whisperChunk('design', 7.15, 7.61), whisperChunk('team?', 7.61, 8.97),
    whisperChunk('No', 9.59, 9.83), whisperChunk('way.', 9.83, 10.19), whisperChunk('One', 10.55, 10.77), whisperChunk('AI', 10.77, 11.13), whisperChunk('coworker', 11.13, 11.55), whisperChunk('made', 11.55, 11.79), whisperChunk('these.', 11.79, 12.05),
  ],
  async inputs(dir) {
    const video = await fileRef(await makeVideo(join(dir, 'take.mp4'), 12.3, { width: 360, height: 640, tone: 300 }), 'video');
    return { video, scenes: this.scenes };
  },
  async line() {
    return { json: { chunks: repeatedQuestion.chunks }, files: {}, reused: false };
  },
};
repeatedQuestion.inputs = repeatedQuestion.inputs.bind(repeatedQuestion);

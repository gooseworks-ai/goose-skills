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

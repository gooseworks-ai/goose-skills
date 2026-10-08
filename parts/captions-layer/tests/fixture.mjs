// A cut whose timeline has speech with no word timings, so the captions
// layer transcribes it; the fake line answers with fal Whisper's word chunks.
import { join } from 'node:path';
import { fileRef, layerInputsFor, makeVideo } from '../../_tools/kit-harness.mjs';

export const sample = {
  async inputs(workDir) {
    const video = await fileRef(await makeVideo(join(workDir, 'cut.mp4'), 4, { width: 540, height: 960, tone: 440 }), 'video');
    return layerInputsFor(video, {
      expect: { speech: 'voiceover', captions: true },
      timeline: { speech: [{ scene_id: 's1', text: 'Meet two hundred happy customers', start_s: 0.2, end_s: 2.6 }] },
    });
  },
  async line(order) {
    // Whisper writes "two hundred" as "200": the caption keeps the written words.
    const chunk = (text, s, e) => ({ text, timestamp: [s, e] });
    return {
      json: { chunks: [chunk('Meet', 0.2, 0.5), chunk('200', 0.6, 1.2), chunk('happy', 1.3, 1.8), chunk('customers', 1.9, 2.6)] },
      files: {},
      reused: false,
      order,
    };
  },
};

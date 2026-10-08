import { file, timeline } from '../../_tools/schemas.mjs';

const MODEL = 'fal-ai/whisper';

export const manifest = {
  $schema: '../../_contract/part-manifest.schema.json',
  interface: 1,
  id: 'transcribe-whisper',
  version: '1.0.0',
  kind: 'caption',
  title: 'Transcribe speech (Whisper)',
  summary: "Transcribes a cut's speech with fal Whisper word timings and places each approved line on what was heard, for captions and the check layer.",
  runtime: 'node',
  entry: 'part.mjs',
  files: ['README.md', 'part.mjs'],
  kit: '>=1.0.0 <2.0.0',
  needs: { browser: false, ffmpeg: { encoders: ['aac'] }, network: true, models: [{ provider: 'fal', model: MODEL }], disk_mb: 50 },
  inputs: {
    type: 'object',
    additionalProperties: false,
    required: ['video'],
    properties: {
      video: { description: 'The cut whose speech to transcribe (it passes through unchanged).', ...file('video') },
      scenes: {
        description: 'plan.scenes: each non-empty line is placed on the heard words.',
        type: 'array',
        maxItems: 40,
        items: { type: 'object', required: [], properties: { id: { type: ['string', 'integer', 'null'] }, line: { type: ['string', 'null'], maxLength: 2000 } } },
      },
      timeline: { description: "The cut's timeline from an earlier step; its scenes, end card and safe zones are kept.", ...timeline },
      language: { description: 'Default en.', type: 'string', pattern: '^[a-z]{2}$' },
    },
  },
  outputs: {
    type: 'object',
    additionalProperties: false,
    required: ['video', 'timeline', 'transcript'],
    properties: { video: file('video'), timeline, transcript: { type: 'string' } },
  },
  cost: { basis: 'per_unit', unit: 'call', rates_usd: { [MODEL]: 0.02 } },
  determinism: 'provider',
  timing: { typical_s: 20, timeout_s: 600 },
  retry: { transient: 1 },
  replaces: [],
};

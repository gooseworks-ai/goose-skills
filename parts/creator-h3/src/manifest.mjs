import { file, timeline } from '../../_tools/schemas.mjs';

const MODEL = 'minimax/h3-max/reference-to-video';

export const manifest = {
  $schema: '../../_contract/part-manifest.schema.json',
  interface: 1,
  id: 'creator-h3',
  version: '1.0.0',
  kind: 'generate_video',
  title: 'Talking creator (H3)',
  summary: 'An AI creator saying the approved lines to camera as one track: H3 takes split between lines, the first take\'s voice passed to the rest, joined with short dissolves.',
  runtime: 'node',
  entry: 'part.mjs',
  files: ['README.md', 'part.mjs'],
  kit: '>=1.0.0 <2.0.0',
  needs: {
    browser: false,
    ffmpeg: { filters: ['silencedetect', 'tpad', 'trim', 'setpts', 'fps', 'settb', 'setsar', 'format', 'xfade', 'concat', 'aresample', 'pan', 'aformat', 'adelay', 'apad', 'atrim', 'asetpts', 'acrossfade'], encoders: ['libx264', 'aac', 'pcm_s16le'] },
    network: true,
    models: [{ provider: 'fal', model: MODEL }],
    disk_mb: 1500,
  },
  inputs: {
    type: 'object',
    additionalProperties: false,
    required: ['scenes', 'character', 'max_seconds'],
    properties: {
      scenes: {
        description: 'plan.scenes in order; every non-empty line is said, in order.',
        type: 'array',
        minItems: 1,
        maxItems: 30,
        items: { type: 'object', properties: { id: { type: ['string', 'integer', 'null'] }, line: { type: ['string', 'null'], maxLength: 600 } } },
      },
      character: {
        description: 'The approved creator: the still, and who they are and where, in the words that made the still (age and gender stated). Never a default person.',
        type: 'object',
        additionalProperties: false,
        required: ['image', 'identity'],
        properties: {
          image: file('image', ['image/png', 'image/jpeg', 'image/webp']),
          identity: { type: 'string', minLength: 1, maxLength: 1000 },
          environment: { type: 'string', maxLength: 1000 },
          delivery: { type: 'string', maxLength: 600 },
        },
      },
      mannerism: { description: 'Optional muted motion reference (rights cleared, 2 to 15 s).', ...file('video') },
      resolution: { description: 'Default 1080P.', enum: ['480P', '768P', '1080P'] },
      aspect_ratio: { description: 'Default 9:16.', enum: ['21:9', '16:9', '4:3', '1:1', '3:4', '9:16'] },
      words_per_second: { description: 'Speaking rate used to split lines into takes. Default 2.6.', type: 'number', minimum: 1.5, maximum: 4 },
      max_seconds: { description: 'The most seconds of takes this step may order (the price is read from it); more is refused.', type: 'number', minimum: 5, maximum: 120 },
      seed: { description: 'Reshuffles every take\'s seed (a new take is a new price).', type: 'integer', minimum: 0 },
    },
  },
  outputs: {
    type: 'object',
    additionalProperties: false,
    required: ['video', 'seconds', 'timeline', 'takes'],
    properties: {
      video: file('video'),
      seconds: { type: 'number', exclusiveMinimum: 0 },
      timeline,
      takes: {
        type: 'array',
        items: {
          type: 'object',
          additionalProperties: false,
          required: ['id', 'video', 'start_s', 'scene_ids'],
          properties: { id: { type: 'string' }, video: file('video'), start_s: { type: 'number', minimum: 0 }, scene_ids: { type: 'array', items: { type: 'string' } } },
        },
      },
    },
  },
  cost: { basis: 'per_unit', unit: 'second', measure: { from: '/max_seconds', as: 'value' }, rates_usd: { [MODEL]: 0.4 } },
  determinism: 'provider',
  timing: { typical_s: 600, timeout_s: 3600 },
  retry: { transient: 1 },
  replaces: ['create-creator-takes-h3'],
};

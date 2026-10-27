import { file, timeline } from '../../_tools/schemas.mjs';

const ENDPOINT = 'openrouter/router/vision';

const product = {
  type: 'object',
  required: ['id'],
  properties: {
    id: { type: 'string', minLength: 1 },
    name: { type: ['string', 'null'], maxLength: 2000 },
    images: { type: 'array', maxItems: 20, items: file('image') },
  },
};

export const manifest = {
  $schema: '../../_contract/part-manifest.schema.json',
  interface: 1,
  id: 'unmirror-take',
  version: '1.0.1',
  kind: 'compose',
  title: 'Flip a mirrored selfie take',
  summary: "Checks a selfie take against the real product photo with a vision model and flips it left to right when the product's text is mirrored in most frames, so a front-camera mirror never ships. Otherwise the take passes through.",
  runtime: 'node',
  entry: 'part.mjs',
  files: ['README.md', 'part.mjs'],
  kit: '>=1.0.0 <2.0.0',
  needs: { browser: false, ffmpeg: { encoders: ['mjpeg', 'libx264'], filters: ['hflip'] }, network: true, models: [{ provider: 'fal', model: ENDPOINT }], disk_mb: 400 },
  inputs: {
    type: 'object',
    additionalProperties: false,
    required: ['video', 'timeline', 'products'],
    properties: {
      video: { description: 'The take to check. Returned as it is, or flipped left to right when it is mirrored.', ...file('video') },
      timeline: { description: "The take's timeline: passed through unchanged (a flip moves nothing in time). Its end card, if any, is left out of the frames read.", ...timeline },
      products: { description: 'plan.products: the first with a photo is the real label to compare against.', type: 'array', minItems: 1, maxItems: 12, items: product },
      frames: { description: 'Frames read, spread evenly over the take. Default 4.', type: 'integer', minimum: 2, maximum: 8 },
    },
  },
  outputs: {
    type: 'object',
    additionalProperties: false,
    required: ['video', 'timeline', 'mirror'],
    properties: {
      video: file('video'),
      timeline,
      mirror: {
        type: 'object',
        additionalProperties: false,
        required: ['model', 'flipped', 'seen', 'mirrored', 'frames'],
        properties: {
          model: { type: 'string' },
          flipped: { type: 'boolean' },
          seen: { type: 'integer', minimum: 0 },
          mirrored: { type: 'integer', minimum: 0 },
          frames: {
            type: 'array',
            maxItems: 8,
            items: {
              type: 'object',
              additionalProperties: false,
              required: ['t_s', 'product_seen', 'mirrored'],
              properties: { t_s: { type: 'number', minimum: 0 }, product_seen: { type: 'boolean' }, mirrored: { type: 'boolean' } },
            },
          },
        },
      },
    },
  },
  // Billed by tokens: the photo and 4 frames to anthropic/claude-sonnet-5.5 were about 16k tokens, 0.035 USD.
  cost: { basis: 'per_unit', unit: 'call', rates_usd: { [ENDPOINT]: 0.05 } },
  determinism: 'provider',
  timing: { typical_s: 60, timeout_s: 600 },
  retry: { transient: 1 },
  replaces: [],
};

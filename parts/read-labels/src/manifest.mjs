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

const words = { type: 'array', maxItems: 60, items: { type: 'string', maxLength: 200 } };

export const manifest = {
  $schema: '../../_contract/part-manifest.schema.json',
  interface: 1,
  id: 'read-labels',
  version: '1.0.0',
  kind: 'check',
  title: 'Read the product label in a cut',
  summary: "Reads the large words on the product in frames of a cut against the real product photo, with a vision model, and stops the run when one is clearly misspelled, so a garbled label is never called ready.",
  runtime: 'node',
  entry: 'part.mjs',
  files: ['README.md', 'part.mjs'],
  kit: '>=1.0.0 <2.0.0',
  needs: { browser: false, ffmpeg: { encoders: ['mjpeg'] }, network: true, models: [{ provider: 'fal', model: ENDPOINT }], disk_mb: 50 },
  inputs: {
    type: 'object',
    additionalProperties: false,
    required: ['video', 'timeline', 'products'],
    properties: {
      video: { description: 'The cut whose label to read. A check part: the cut is never changed or returned.', ...file('video') },
      timeline: { description: "The cut's timeline: two frames are read per scene, the end card left out, at most 16.", ...timeline },
      products: { description: "plan.products: the first with a photo is the real label to compare against.", type: 'array', minItems: 1, maxItems: 12, items: product },
      on_misspelled: {
        description: 'fail (default): a clearly misspelled word on the label stops the run with its frame time and both spellings. report: return what was read and go on.',
        enum: ['fail', 'report'],
      },
    },
  },
  outputs: {
    type: 'object',
    additionalProperties: false,
    required: ['verdict', 'labels'],
    properties: {
      verdict: {
        description: "One check, flag:text_legible, in the check layer's verdict shape: pass, fail (a misspelled word) or not_applicable (the product not seen).",
        type: 'object',
        additionalProperties: false,
        required: ['pass', 'checks', 'reasons'],
        properties: {
          pass: { type: 'boolean' },
          checks: {
            type: 'array',
            maxItems: 1,
            items: {
              type: 'object',
              additionalProperties: false,
              required: ['code', 'status'],
              properties: {
                code: { const: 'flag:text_legible' },
                status: { enum: ['pass', 'fail', 'not_applicable'] },
                message: { type: 'string' },
                found: { type: ['string', 'null'] },
              },
            },
          },
          reasons: {
            type: 'array',
            items: {
              type: 'object',
              additionalProperties: false,
              required: ['check', 'message'],
              properties: { check: { type: 'string' }, message: { type: 'string' }, expected: { type: 'string' }, found: { type: 'string' } },
            },
          },
        },
      },
      labels: {
        type: 'object',
        additionalProperties: false,
        required: ['model', 'label_words', 'frames', 'misspelled'],
        properties: {
          model: { type: 'string' },
          label_words: words,
          misspelled: { type: 'integer', minimum: 0 },
          frames: {
            type: 'array',
            maxItems: 16,
            items: {
              type: 'object',
              additionalProperties: false,
              required: ['t_s', 'scene_id', 'product_seen', 'words_read', 'misspelled'],
              properties: {
                t_s: { type: 'number', minimum: 0 },
                scene_id: { type: ['string', 'null'] },
                product_seen: { type: 'boolean' },
                words_read: words,
                misspelled: {
                  type: 'array',
                  maxItems: 60,
                  items: {
                    type: 'object',
                    additionalProperties: false,
                    required: ['read', 'should_be'],
                    properties: { read: { type: 'string', maxLength: 200 }, should_be: { type: 'string', maxLength: 200 } },
                  },
                },
              },
            },
          },
        },
      },
    },
  },
  // Billed by tokens: the photo and up to 16 frames to anthropic/claude-sonnet-5.5 are about 30k tokens in.
  cost: { basis: 'per_unit', unit: 'call', rates_usd: { [ENDPOINT]: 0.08 } },
  determinism: 'provider',
  timing: { typical_s: 40, timeout_s: 600 },
  retry: { transient: 1 },
  replaces: [],
};

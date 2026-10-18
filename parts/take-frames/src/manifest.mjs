import { file } from '../../_tools/schemas.mjs';

const EDIT = 'openai/gpt-image-2/edit';
const SIZES = ['1024x1792', '1088x1920'];
const QUALITIES = ['medium', 'high'];
const imageOrNull = { anyOf: [{ type: 'null' }, file('image')] };

export const manifest = {
  $schema: '../../_contract/part-manifest.schema.json',
  interface: 1,
  id: 'take-frames',
  version: '1.0.0',
  kind: 'generate_image',
  title: 'Take frames (GPT Image 2)',
  summary: 'The first and last frame of a creator take, from the cast picture and the real product photo: the product held high beside the face, clear of the caption band, then the same photo with the use done (a cap open).',
  runtime: 'node',
  entry: 'part.mjs',
  files: ['README.md', 'part.mjs'],
  kit: '>=1.0.0 <2.0.0',
  needs: {
    browser: false,
    ffmpeg: { filters: [], encoders: ['png'] },
    network: true,
    models: [{ provider: 'fal', model: EDIT }],
    disk_mb: 100,
  },
  inputs: {
    type: 'object',
    additionalProperties: false,
    required: ['cast', 'products', 'scenes'],
    properties: {
      cast: {
        description: 'The plan cast after the anchor step: the first member with an image is the creator in both frames (their look fills {look}).',
        type: 'array',
        minItems: 1,
        items: {
          type: 'object',
          required: ['key'],
          properties: {
            key: { type: 'string', pattern: '^[a-z][a-z0-9_]{0,23}$' },
            name: { type: ['string', 'null'], maxLength: 40 },
            look: { type: ['string', 'null'], maxLength: 600 },
            image: imageOrNull,
          },
        },
      },
      products: {
        description: 'The plan products: the first with a photo is the product in both frames, sent as a reference so its shape, colours and label are copied, not redrawn.',
        type: 'array',
        minItems: 1,
        items: { type: 'object', required: ['id'], properties: { id: { type: 'string', minLength: 1 }, name: { type: ['string', 'null'], maxLength: 2000 }, images: { type: 'array', maxItems: 20, items: file('image') } } },
      },
      scenes: {
        description: 'The plan scenes. The last scene tagged with one of use_tags is the use: its extra.after (what the product looks like once used: "the lime green flip cap is open") is the only change in the last frame, and its extra.before (optional: "the cap is closed") is said in the first.',
        type: 'array',
        minItems: 1,
        maxItems: 40,
        items: { type: 'object', required: ['id'], properties: { id: { type: 'string', minLength: 1, maxLength: 64 }, extra: { type: ['object', 'null'] } } },
      },
      use_tags: { description: 'The scene tags (extra.shot or a leading "Tag:", compared without case or spacing) that mark the use. Default ["use"].', type: 'array', minItems: 1, maxItems: 10, uniqueItems: true, items: { type: 'string', minLength: 1, maxLength: 40 } },
      template: { description: 'A JSON file with "first" and "last" prompt texts, to replace the defaults. Placeholders: {look}, {name}, {product.name}, {before}, {after}.', ...file('json') },
      size: { description: 'Both frames\' size in pixels, width x height. Default 1088x1920 (vertical 9:16).', enum: SIZES },
      quality: { description: 'GPT Image 2 quality. Default high.', enum: QUALITIES },
    },
  },
  outputs: {
    type: 'object',
    additionalProperties: false,
    required: ['first_frame', 'last_frame', 'frames'],
    properties: {
      first_frame: { description: 'The take\'s first frame: the creator holding the product high beside the face, before the use. Every take of a two-take review starts on it (video-h3max 1.5.0 first_frame).', ...file('image') },
      last_frame: { description: 'The first frame with the use done and nothing else changed. The last take ends on it (video-h3max 1.5.0 last_frame).', ...file('image') },
      frames: { description: 'Both frames in order, id first and last.', type: 'array', items: { type: 'object', additionalProperties: false, required: ['id', 'image'], properties: { id: { enum: ['first', 'last'] }, image: file('image') } } },
    },
  },
  // One call is always two GPT Image 2 edits (0.19 USD each, as image-gpt-image-2 and cast-plate quote them).
  cost: { basis: 'per_unit', unit: 'call', rates_usd: { [EDIT]: 0.38 } },
  determinism: 'provider',
  timing: { typical_s: 180, timeout_s: 1200 },
  retry: { transient: 1 },
  replaces: [],
};

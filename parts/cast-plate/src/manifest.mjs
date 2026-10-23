import { file } from '../../_tools/schemas.mjs';

const TEXT = 'openai/gpt-image-2';
const EDIT = 'openai/gpt-image-2/edit';

// A plan cast member (CastMember). Other plan fields pass through and are ignored.
const member = {
  type: 'object',
  required: ['key'],
  properties: {
    key: { type: 'string', pattern: '^[a-z][a-z0-9_]{0,23}$' },
    name: { type: ['string', 'null'], maxLength: 40 },
    look: { description: 'Age, gender, build, hair, clothes. Needed when the member has no image; two drawn members may not share a look.', type: ['string', 'null'], maxLength: 600 },
    image: { description: 'The member\'s picture: sent to /edit as a reference so the plate keeps this face (a picture other than PNG, JPEG or WebP is turned into a PNG first).', anyOf: [{ type: 'null' }, file('image')] },
  },
};

// Where one single sits on the plate, in 0..1 of it (the crops output's items).
const crop = {
  type: 'object',
  additionalProperties: false,
  required: ['key', 'x', 'y', 'w', 'h'],
  properties: { key: { type: 'string' }, x: { type: 'number', minimum: 0, maximum: 1 }, y: { type: 'number', minimum: 0, maximum: 1 }, w: { type: 'number', minimum: 0, maximum: 1 }, h: { type: 'number', minimum: 0, maximum: 1 } },
};

export const manifest = {
  $schema: '../../_contract/part-manifest.schema.json',
  interface: 1,
  id: 'cast-plate',
  version: '1.1.1',
  kind: 'generate_image',
  title: 'Cast plate (GPT Image 2)',
  summary: 'One wide picture of two or three cast members in one room from GPT Image 2 on fal, plus one full-height single per person cut from it at a fixed seat, so every shot shares one set.',
  runtime: 'node',
  entry: 'part.mjs',
  files: ['README.md', 'part.mjs'],
  kit: '>=1.0.0 <2.0.0',
  needs: {
    browser: false,
    ffmpeg: { filters: ['crop', 'scale', 'setsar'], encoders: ['png'] },
    network: true,
    models: [
      { provider: 'fal', model: TEXT },
      { provider: 'fal', model: EDIT },
    ],
    disk_mb: 100,
  },
  inputs: {
    type: 'object',
    additionalProperties: false,
    required: ['cast', 'room'],
    properties: {
      cast: { description: 'plan.cast: the people on the plate, seated left to right in this order.', type: 'array', minItems: 2, maxItems: 3, items: member },
      room: { description: 'The room they sit in (a declared plan answer, e.g. plan.answers.room).', type: 'string', minLength: 1, maxLength: 600 },
      layout: { description: 'two_shot: faces at 30% and 70% of the width. three_shot: 20%, 50%, 80%. Default: by the cast\'s size. The cast must fill every seat.', enum: ['two_shot', 'three_shot'] },
      size: { description: 'WIDTHxHEIGHT, landscape, both multiples of 16 (gpt-image-2 limits). Default 2304x1296, whose singles are 728x1296.', type: 'string', pattern: '^[0-9]{3,4}x[0-9]{3,4}$' },
      quality: { description: 'Default high.', enum: ['low', 'medium', 'high'] },
      model: { description: `Default: ${EDIT} when any cast member has an image, else ${TEXT}. Any other pairing is refused.`, enum: [TEXT, EDIT] },
      template: { description: 'A style prompt template (frames/<name>.prompt.json, version 1; parts/_lib/prompt.mjs). templates.plate replaces the built-in plate text; {cast_looks} is the seating, {answers.room} the room.', ...file('json') },
      answers: { description: 'plan.answers, for {answers.KEY} placeholders in the template.', type: ['object', 'null'] },
      brand: { description: 'The brand, for {brand.FIELD} placeholders in the template.', type: ['object', 'null'] },
      plate: { description: 'A plate already made (a preview approved before the yes): used as is and nothing is ordered, so room, size, quality, model and template are not used. Its singles are cut at crops, else at the layout\'s seats (then it must be landscape).', anyOf: [{ type: 'null' }, file('image')] },
      crops: { description: 'With plate only: where each single sits, in 0..1 of the plate, one per cast member in seat order, keys matching (the crops output). Given back as is.', anyOf: [{ type: 'null' }, { type: 'array', minItems: 2, maxItems: 3, items: crop }] },
    },
  },
  outputs: {
    type: 'object',
    additionalProperties: false,
    required: ['plate', 'singles', 'crops', 'layout', 'prompt'],
    properties: {
      plate: { description: 'The wide picture at exactly `size`.', ...file('image') },
      singles: {
        description: 'One full-height 9:16 slice per member, key = the cast key, in seat order.',
        type: 'array',
        items: { type: 'object', additionalProperties: false, required: ['key', 'image'], properties: { key: { type: 'string' }, image: file('image') } },
      },
      crops: {
        description: 'Where each single sits on the plate, in 0..1 of the plate.',
        type: 'array',
        items: crop,
      },
      layout: { enum: ['two_shot', 'three_shot'] },
      prompt: { description: 'The prompt sent, for review; empty when the plate was given.', type: 'string' },
    },
  },
  cost: { basis: 'per_unit', unit: 'call', rates_usd: { [TEXT]: 0.19, [EDIT]: 0.19 }, model_from: '/model' },
  determinism: 'provider',
  timing: { typical_s: 90, timeout_s: 900 },
  retry: { transient: 1 },
};

import { file, pronunciations, timeline } from '../../_tools/schemas.mjs';

const MODEL = 'minimax/h3-max/reference-to-video';
const PICTURE = ['image/png', 'image/jpeg', 'image/webp'];
const textOrNull = (max) => ({ type: ['string', 'null'], maxLength: max });
const imageOrNull = { anyOf: [{ type: 'null' }, file('image')] };

// A plan scene (PlanScene). Only lines are said; a scene with no line (an end
// card, a silent beat) is a normal scene. Other plan fields pass through.
const scene = {
  type: 'object',
  properties: {
    id: { type: ['string', 'integer', 'null'] },
    line: textOrNull(600),
    on_screen: textOrNull(2000),
    picture: textOrNull(2000),
    image: { description: 'A picture the plan shows for this scene: the scene is a cutaway.', ...imageOrNull },
    speaker: { description: 'A cast key: the creator is this member.', ...textOrNull(24) },
    extra: { description: 'Style fields; extra.shot other than "creator" makes the scene a cutaway.', type: ['object', 'null'] },
  },
};

// A plan cast member (CastMember), after the kit turned its image into a file.
const member = {
  type: 'object',
  required: ['key'],
  properties: {
    key: { type: 'string', pattern: '^[a-z][a-z0-9_]{0,23}$' },
    name: textOrNull(40),
    look: { description: 'Age, gender, build, hair, wardrobe: the words that made the picture.', ...textOrNull(600) },
    gender: { enum: ['female', 'male', 'nonbinary', null] },
    age: { type: ['integer', 'null'], minimum: 18, maximum: 90 },
    environment: textOrNull(300),
    delivery: textOrNull(300),
    image: { description: 'The member\'s picture (an anchor step fills it). Needed for the creator.', ...imageOrNull },
  },
};

// A plan footage entry (PlanFootage): only scene_id is read, to find the cutaways.
const footageEntry = {
  type: 'object',
  properties: { scene_id: textOrNull(64) },
};

export const manifest = {
  $schema: '../../_contract/part-manifest.schema.json',
  interface: 1,
  id: 'creator-h3',
  version: '1.1.0',
  kind: 'generate_video',
  title: 'Talking creator (H3)',
  summary: 'An AI creator (from the plan cast or a character) saying the approved lines to camera as one track: H3 takes split between lines or only at cutaways, the first take\'s voice passed to the rest, joined with short dissolves.',
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
    required: ['scenes', 'max_seconds'],
    properties: {
      scenes: {
        description: 'plan.scenes in order; every non-empty line is said, in order. A scene with no line is skipped.',
        type: 'array',
        minItems: 1,
        maxItems: 40,
        items: scene,
      },
      cast: {
        description: 'plan.cast (or an anchor step\'s cast): the creator is the member the spoken scenes name as speaker, else the first member with a picture. Give cast or character, not both.',
        type: 'array',
        maxItems: 10,
        items: member,
      },
      character: {
        description: 'The approved creator, when there is no cast: the still, and who they are and where, in the words that made the still (age and gender stated). Never a default person.',
        type: 'object',
        additionalProperties: false,
        required: ['image', 'identity'],
        properties: {
          image: file('image', PICTURE),
          identity: { type: 'string', minLength: 1, maxLength: 1000 },
          environment: { type: 'string', maxLength: 1000 },
          delivery: { type: 'string', maxLength: 600 },
        },
      },
      delivery: { description: 'How they speak (plan.answers.delivery). Wins over the member\'s and the character\'s own delivery.', ...textOrNull(600) },
      pronunciations: { description: 'brand.pronunciations: each term is said as its say_as. The timeline keeps the written words.', ...pronunciations },
      split_before: {
        description: 'none (default): takes split between any two lines. cutaways: a take may start only at a spoken cutaway scene (extra.shot not "creator", a footage entry for the scene, or a scene image), so the join can hide under it; an on-camera run longer than one take is refused.',
        enum: ['none', 'cutaways'],
      },
      footage: { description: 'plan.footage: an entry\'s scene_id makes that scene a cutaway.', type: 'array', maxItems: 20, items: footageEntry },
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
          properties: {
            id: { type: 'string' },
            video: file('video'),
            start_s: { type: 'number', minimum: 0 },
            scene_ids: { type: 'array', items: { type: 'string' } },
            joins_s: { description: 'Every take after the first: the reel second its 0.10 s dissolve from the previous take starts.', type: 'number', minimum: 0 },
          },
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

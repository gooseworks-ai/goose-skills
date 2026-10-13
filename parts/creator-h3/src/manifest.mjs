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
    picture: { description: 'What the scene shows. clips mode: fills {picture}; a leading "Tag:" (or extra.shot) is the scene\'s tag for pick and the template\'s by_tag.', anyOf: [{ type: 'null' }, { type: 'string', maxLength: 2000 }, file('image')] },
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

// A plan product (PlanProduct), for {product.name} and product references in clips mode.
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
  id: 'creator-h3',
  version: '1.2.1',
  kind: 'generate_video',
  title: 'Talking creator (H3)',
  summary: 'An AI creator (plan cast or a character) saying the approved lines to camera as one track: H3 takes joined on their measured speech with short dissolves, one voice. Or silent H3 clips, one per picked scene, from its keyframe.',
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
      mode: { description: 'talk (default): the creator says the lines as one track. clips: a silent clip per picked scene, opening on its keyframe from images.', enum: ['talk', 'clips'] },
      scenes: {
        description: 'plan.scenes in order. talk: every non-empty line is said, in order; a scene with no line is skipped. clips: the scenes to pick from.',
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
      join: { description: 'talk: measured (default) places each later take so its first word comes 0.25 s after the previous take\'s measured last word, and ends the reel 0.6 s after the last word; each line\'s span ends on the silence heard after it inside its take, where one is in reach. planned keeps 1.1.0\'s estimated schedule.', enum: ['measured', 'planned'] },
      images: {
        description: 'clips: the keyframes by scene id (step.<keyframes>.images). Each picked scene\'s clip opens on its keyframe.',
        type: 'array',
        minItems: 1,
        maxItems: 40,
        items: {
          type: 'object',
          additionalProperties: false,
          required: ['id', 'image'],
          properties: { id: { type: 'string', minLength: 1, maxLength: 64 }, image: file('image', PICTURE) },
        },
      },
      template: { description: 'clips: the style\'s prompt template (frames/<name>.prompt.json, version 1; see parts/_lib/prompt.mjs). Its motion text (or the text use names) is each clip\'s prompt; its refs add cast and product pictures after the keyframe. Default: a plain silent-motion text from the scene\'s picture.', ...file('json') },
      use: { description: 'clips: which template text is the prompt: motion (default) or a key of the template\'s templates.', type: 'string', pattern: '^[a-z][a-z0-9_]{0,39}$' },
      look: { description: 'clips: the art style, a key of the template\'s looks (a declared plan answer), filling {look}.', type: ['string', 'null'], maxLength: 200 },
      answers: { description: 'clips: plan.answers, for {answers.KEY} placeholders.', type: ['object', 'null'] },
      brand: { description: 'clips: the brand, for {brand.FIELD} placeholders.', type: ['object', 'null'] },
      products: { description: 'clips: plan.products, for {product.name} and product references.', type: 'array', maxItems: 12, items: product },
      pick: {
        description: 'clips: which scenes get a clip: all (default), first, with_picture, or {tags: [...]}. A picked tag is dropped from {picture}.',
        anyOf: [
          { enum: ['all', 'first', 'with_picture'] },
          { type: 'object', additionalProperties: false, required: ['tags'], properties: { tags: { type: 'array', minItems: 1, maxItems: 12, items: { type: 'string', minLength: 1, maxLength: 40 } } } },
        ],
      },
      skip_first: { description: 'clips: scenes left out at the start of the plan.', type: 'integer', minimum: 0, maximum: 40 },
      skip_last: { description: 'clips: scenes left out at the end of the plan (an end card scene).', type: 'integer', minimum: 0, maximum: 40 },
      seconds: { description: 'clips: every clip\'s length. Default 5.', type: 'number', minimum: 1, maximum: 15 },
      mannerism: { description: 'Optional muted motion reference (rights cleared, 2 to 15 s).', ...file('video') },
      resolution: { description: 'Default 1080P.', enum: ['480P', '768P', '1080P'] },
      aspect_ratio: { description: 'Default 9:16.', enum: ['21:9', '16:9', '4:3', '1:1', '3:4', '9:16'] },
      words_per_second: { description: 'Speaking rate used to split lines into takes. Default 2.6.', type: 'number', minimum: 1.5, maximum: 4 },
      max_seconds: { description: 'The most seconds of takes (or clips) this step may order (the price is read from it); more is refused.', type: 'number', minimum: 5, maximum: 120 },
      seed: { description: 'Reshuffles every take\'s seed (a new take is a new price).', type: 'integer', minimum: 0 },
    },
  },
  outputs: {
    type: 'object',
    additionalProperties: false,
    required: ['video', 'seconds'],
    properties: {
      video: { description: 'talk: the creator track. clips: the first clip.', ...file('video') },
      seconds: { description: 'talk: the reel\'s length. clips: the clips\' lengths added up.', type: 'number', exclusiveMinimum: 0 },
      timeline,
      clips: {
        description: 'clips: one silent clip per picked scene, id = the scene id.',
        type: 'array',
        items: {
          type: 'object',
          additionalProperties: false,
          required: ['id', 'video', 'seconds'],
          properties: { id: { type: 'string' }, video: file('video'), seconds: { type: 'number', exclusiveMinimum: 0 } },
        },
      },
      takes: {
        description: 'talk: the takes, in order.',
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
            joins_s: { description: 'Every take after the first: the reel second its 0.10 s dissolve from the previous take starts (measured: just after the previous take\'s last word).', type: 'number', minimum: 0 },
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

import { file } from '../../_tools/schemas.mjs';

const TEXT = 'openai/gpt-image-2';
const EDIT = 'openai/gpt-image-2/edit';
// Every size is valid for fal's image_size {width, height}: both sides a
// multiple of 16, longest side at most 3840, ratio at most 3:1, 655,360 to
// 8,294,400 pixels (recorded 2026-10-12).
const SIZES = ['1024x1024', '1024x1792', '1088x1920', '2304x1296'];
const QUALITIES = ['low', 'medium', 'high'];
const PICTURE = ['image/png', 'image/jpeg', 'image/webp'];
const textOrNull = (max) => ({ type: ['string', 'null'], maxLength: max });
const imageOrNull = { anyOf: [{ type: 'null' }, file('image')] };

// A plan scene (PlanScene). Nothing but id is required: a scene with no line (an
// end card, a silent beat) is a normal scene. Other plan fields pass through.
const scene = {
  type: 'object',
  required: ['id'],
  properties: {
    id: { type: 'string', minLength: 1, maxLength: 64 },
    line: textOrNull(2000),
    on_screen: textOrNull(2000),
    picture: { description: 'What the still shows. A leading "Tag:" (or extra.shot) picks the template\'s by_tag rule.', anyOf: [{ type: 'null' }, { type: 'string', maxLength: 2000 }, file('image')] },
    image: { description: 'A picture the customer gave for this scene: sent as a reference when the template\'s refs ask for scene_image.', ...imageOrNull },
    speaker: { type: ['string', 'null'], maxLength: 24 },
    extra: { type: ['object', 'null'] },
  },
};

// A plan cast member (CastMember). Other fields pass through to the cast output.
const member = {
  type: 'object',
  required: ['key'],
  properties: {
    key: { type: 'string', pattern: '^[a-z][a-z0-9_]{0,23}$' },
    name: { type: ['string', 'null'], maxLength: 40 },
    look: { type: ['string', 'null'], maxLength: 600 },
    image: { description: 'The member\'s picture: used as is, never drawn again.', ...imageOrNull },
  },
};

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
  id: 'image-gpt-image-2',
  version: '1.0.0',
  kind: 'generate_image',
  title: 'Stills (GPT Image 2)',
  summary: 'Makes or edits photoreal stills with OpenAI GPT Image 2 on fal, one piece per image: a hand-built list, one still per plan scene from a prompt template with cast anchors and product photos, or just the cast portraits.',
  runtime: 'node',
  entry: 'part.mjs',
  files: ['README.md', 'part.mjs'],
  kit: '>=1.0.0 <2.0.0',
  needs: {
    browser: false,
    ffmpeg: { filters: ['scale', 'setsar', 'format', 'hstack'], encoders: ['png'] },
    network: true,
    models: [
      { provider: 'fal', model: TEXT },
      { provider: 'fal', model: EDIT },
    ],
    disk_mb: 300,
  },
  inputs: {
    type: 'object',
    additionalProperties: false,
    required: [],
    properties: {
      model: {
        description: 'The most the step may use. openai/gpt-image-2/edit (default): a piece with reference pictures goes to /edit, a piece with none is drawn from the prompt alone. openai/gpt-image-2: prompt alone only, so references are refused (images mode) or not sent (scenes mode).',
        enum: [TEXT, EDIT],
      },
      mode: {
        description: 'images: the hand-built images list. scenes: one still per picked scene. cast: only the cast portraits (anchors). Default: scenes when scenes is given, else images when images is given, else cast.',
        enum: ['images', 'scenes', 'cast'],
      },
      size: { description: 'Every still\'s size in pixels, width x height. Default 1088x1920 (vertical 9:16).', enum: SIZES },
      cast_size: { description: 'The anchors\' size. Default: size.', enum: SIZES },
      quality: { description: 'GPT Image 2 quality. Default high.', enum: QUALITIES },
      images: {
        description: 'images mode: one still per entry.',
        type: 'array',
        minItems: 1,
        maxItems: 24,
        items: {
          type: 'object',
          additionalProperties: false,
          required: ['prompt'],
          properties: {
            id: { type: 'string', pattern: '^[a-z0-9][a-z0-9_-]{0,39}$' },
            prompt: { type: 'string', minLength: 2, maxLength: 5000 },
            references: { type: 'array', maxItems: 10, items: file('image', PICTURE) },
          },
        },
      },
      scenes: { description: 'scenes mode: plan.scenes. Outputs are keyed by scene id.', type: 'array', minItems: 1, maxItems: 40, items: scene },
      template: { description: 'The style\'s prompt template (frames/<name>.prompt.json, version 1; see parts/_lib/prompt.mjs). Without one a scene\'s prompt is its picture text and an anchor is a plain photo portrait.', ...file('json') },
      look: { description: 'The art style: a key of the template\'s looks (a declared plan answer), filling {look}.', type: ['string', 'null'], maxLength: 200 },
      answers: { description: 'plan.answers, for {answers.KEY} placeholders.', type: ['object', 'null'] },
      brand: { description: 'The brand, for {brand.FIELD} placeholders.', type: ['object', 'null'] },
      cast: { description: 'plan.cast. A scene names a member by speaker or by name in its picture or line. In cast mode every member without an image gets a portrait.', type: 'array', maxItems: 10, items: member },
      products: { description: 'plan.products. A scene names a product as phone-chat does; its first photo is a reference.', type: 'array', maxItems: 12, items: product },
      pick: {
        description: 'Which scenes get a still: all (default), first, with_picture, or {tags: [...]}.',
        anyOf: [
          { enum: ['all', 'first', 'with_picture'] },
          { type: 'object', additionalProperties: false, required: ['tags'], properties: { tags: { type: 'array', minItems: 1, maxItems: 12, items: { type: 'string', minLength: 1, maxLength: 40 } } } },
        ],
      },
      skip_first: { description: 'Scenes left out at the start of the plan.', type: 'integer', minimum: 0, maximum: 40 },
      skip_last: { description: 'Scenes left out at the end of the plan (an end card scene).', type: 'integer', minimum: 0, maximum: 40 },
      anchor: {
        description: 'scenes mode. none (default): members with an image are still sent. cast: draw a portrait (an anchor) for every named member without an image, first, and send it with each scene that names them. first_scene: the first still is a reference for every later one. cast and first_scene need /edit.',
        enum: ['none', 'cast', 'first_scene'],
      },
      style_refs: { description: 'The style\'s own reference pictures, sent last with every scene and anchor. Needs /edit.', type: 'array', maxItems: 4, items: file('image', PICTURE) },
      multi_ref: {
        description: 'How a scene that names several members sends their anchors: strip (default) tiles all of them into one picture; list sends up to 3 separate pictures.',
        enum: ['list', 'strip'],
      },
    },
  },
  outputs: {
    type: 'object',
    additionalProperties: false,
    required: ['images'],
    properties: {
      images: {
        description: 'One still per entry (images mode) or per picked scene, id = the scene id (scenes mode). Empty in cast mode.',
        type: 'array',
        items: { type: 'object', additionalProperties: false, required: ['id', 'image'], properties: { id: { type: 'string' }, image: file('image') } },
      },
      scenes: { description: 'scenes mode: every input scene, image = its still when it got one.', type: 'array', items: { type: 'object', required: ['id'], properties: { id: { type: 'string' }, image: imageOrNull } } },
      cast: { description: 'scenes and cast modes: every cast member, image = its anchor or its own image (empty without a cast).', type: 'array', items: { type: 'object', required: ['key'], properties: { key: { type: 'string' }, image: imageOrNull } } },
      anchors: { description: 'scenes mode: the members some scene sent; cast mode: every member with a picture. id = the member key.', type: 'array', items: { type: 'object', additionalProperties: false, required: ['id', 'image'], properties: { id: { type: 'string' }, image: file('image') } } },
    },
  },
  cost: {
    basis: 'per_unit',
    unit: 'image',
    measure: { from: '/images/*', as: 'count' },
    rates_usd: { [TEXT]: 0.19, [EDIT]: 0.19 },
    model_from: '/model',
  },
  determinism: 'provider',
  timing: { typical_s: 90, timeout_s: 2400 },
  retry: { transient: 1 },
  replaces: [],
};

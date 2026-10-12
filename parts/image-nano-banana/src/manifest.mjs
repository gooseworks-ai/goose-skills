import { file } from '../../_tools/schemas.mjs';

const TEXT = 'fal-ai/nano-banana';
const EDIT = 'fal-ai/nano-banana/edit';
const ASPECTS = ['21:9', '16:9', '3:2', '4:3', '5:4', '1:1', '4:5', '3:4', '2:3', '9:16'];
const PICTURE = ['image/png', 'image/jpeg', 'image/webp'];
const KINDS = ['snap', 'angled'];
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
    image_locked: { description: 'scenes mode: true makes image this scene\'s final still, used as is with nothing ordered (a preview already approved). Needs image.', type: 'boolean' },
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
  id: 'image-nano-banana',
  version: '1.2.1',
  kind: 'generate_image',
  title: 'Stills (Nano Banana)',
  summary: 'Makes or edits stills with Nano Banana on fal, one piece per image: a hand-built list, one still per plan scene from a prompt template, or snap and angled edits of each product\'s own photo.',
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
    disk_mb: 200,
  },
  inputs: {
    type: 'object',
    additionalProperties: false,
    required: ['model'],
    properties: {
      model: {
        description: 'fal-ai/nano-banana for a prompt alone, fal-ai/nano-banana/edit with reference images. In scenes mode, /edit sends each scene\'s references and a scene with none is drawn by the prompt-only model.',
        enum: [TEXT, EDIT],
      },
      mode: { description: 'images: the hand-built images list (the 1.0.1 behaviour). scenes: one still per picked scene. products: one edit of each product\'s first photo per kind (needs /edit). Default: scenes when scenes is given, else images.', enum: ['images', 'scenes', 'products'] },
      kinds: {
        description: 'products mode: the stills made for every product, in order. snap: the whole product on a plain textured surface, soft key light from the upper left. angled: the product turned 15-20 degrees to a three-quarter view, floating over warm white with a soft shadow. Default [snap]. The template\'s by_tag rule of the same name (Snap, Angled) replaces the built-in text.',
        type: 'array',
        minItems: 1,
        maxItems: 2,
        uniqueItems: true,
        items: { enum: KINDS },
      },
      aspect_ratio: { enum: ASPECTS },
      seed: { description: 'Sent with every piece; a new seed is a new piece.', type: 'integer', minimum: 0, maximum: 2147483647 },
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
            prompt: { type: 'string', minLength: 1, maxLength: 5000 },
            references: { type: 'array', maxItems: 10, items: file('image', PICTURE) },
          },
        },
      },
      scenes: { description: 'scenes mode: plan.scenes. Outputs are keyed by scene id.', type: 'array', minItems: 1, maxItems: 40, items: scene },
      template: { description: 'The style\'s prompt template (frames/<name>.prompt.json, version 1; see parts/_lib/prompt.mjs). Without one a scene\'s prompt is its picture text. products mode reads its by_tag Snap and Angled rules (scene, prefix, suffix, negative) plus the top-level prefix, suffix and negative; {picture} and {product.name} are the product\'s name.', ...file('json') },
      look: { description: 'The art style: a key of the template\'s looks (a declared plan answer), filling {look}.', type: ['string', 'null'], maxLength: 200 },
      answers: { description: 'plan.answers, for {answers.KEY} placeholders.', type: ['object', 'null'] },
      brand: { description: 'The brand, for {brand.FIELD} placeholders.', type: ['object', 'null'] },
      cast: { description: 'plan.cast. A scene names a member by speaker or by name in its picture or line.', type: 'array', maxItems: 10, items: member },
      products: { description: 'plan.products. scenes mode: a scene names a product as phone-chat does; its first photo is a reference. products mode: every product gets one still per kind, edited from its first photo (the only reference).', type: 'array', maxItems: 12, items: product },
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
        description: 'none (default): members with an image are still sent. cast: draw a portrait (an anchor) for every named member without an image, first, and send it with each scene that names them. first_scene: the first still is a reference for every later one. cast and first_scene need /edit.',
        enum: ['none', 'cast', 'first_scene'],
      },
      cast_aspect_ratio: { description: 'The anchors\' aspect. Default 1:1.', enum: ASPECTS },
      style_refs: { description: 'The style\'s own reference pictures (a line-art sample), sent last with every scene and anchor. Needs /edit.', type: 'array', maxItems: 4, items: file('image', PICTURE) },
      multi_ref: {
        description: 'How a scene that names several members sends their anchors: strip (default) tiles all of them into one picture, which keeps each silhouette; list sends up to 3 separate pictures.',
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
        description: 'One still per entry (images mode), per picked scene with id = the scene id (scenes mode), or per product and kind with id = "<product id>-<kind>" (products mode), products in order, kinds in order within each.',
        type: 'array',
        items: { type: 'object', additionalProperties: false, required: ['id', 'image'], properties: { id: { type: 'string' }, image: file('image') } },
      },
      scenes: { description: 'scenes mode: every input scene, image = its still when it got one.', type: 'array', items: { type: 'object', required: ['id'], properties: { id: { type: 'string' }, image: imageOrNull } } },
      cast: { description: 'scenes mode: every cast member, image = its anchor or its own image (empty without a cast).', type: 'array', items: { type: 'object', required: ['key'], properties: { key: { type: 'string' }, image: imageOrNull } } },
      anchors: { description: 'scenes mode: the members some scene sent, id = the member key (empty without a cast).', type: 'array', items: { type: 'object', additionalProperties: false, required: ['id', 'image'], properties: { id: { type: 'string' }, image: file('image') } } },
    },
  },
  cost: {
    basis: 'per_unit',
    unit: 'image',
    measure: { from: '/images/*', as: 'count' },
    rates_usd: { [TEXT]: 0.039, [EDIT]: 0.039 },
    model_from: '/model',
  },
  determinism: 'provider',
  timing: { typical_s: 60, timeout_s: 1800 },
  retry: { transient: 1 },
  replaces: [],
};

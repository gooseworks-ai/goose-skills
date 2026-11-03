import { file, sceneSpan } from '../../_tools/schemas.mjs';

const V31 = 'fal-ai/veo3.1/image-to-video';
const V31_FAST = 'fal-ai/veo3.1/fast/image-to-video';
const V3 = 'fal-ai/veo3/image-to-video';
const V3_FAST = 'fal-ai/veo3/fast/image-to-video';
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
    picture: { description: 'What the scene shows: one verb-led action. A leading "Tag:" (or extra.shot) picks the template\'s by_tag rule.', anyOf: [{ type: 'null' }, { type: 'string', maxLength: 2000 }, file('image')] },
    image: imageOrNull,
    speaker: { type: ['string', 'null'], maxLength: 24 },
    extra: { type: ['object', 'null'] },
  },
};

// A plan cast member (CastMember), for {speaker.name}, {speaker.look} and {cast_looks}.
const member = {
  type: 'object',
  required: ['key'],
  properties: {
    key: { type: 'string', pattern: '^[a-z][a-z0-9_]{0,23}$' },
    name: { type: ['string', 'null'], maxLength: 40 },
    look: { type: ['string', 'null'], maxLength: 600 },
    image: imageOrNull,
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

const clipSeconds = { type: 'number', exclusiveMinimum: 0, maximum: 8 };

export const manifest = {
  $schema: '../../_contract/part-manifest.schema.json',
  interface: 1,
  id: 'video-veo-3',
  version: '1.0.2',
  kind: 'generate_video',
  title: 'Moving stills (Veo 3 image-to-video)',
  summary: 'Turns stills into short silent clips with Google Veo 3 / 3.1 image-to-video on fal, one piece per clip. Warning: fal retires this endpoint on 17 Nov 2026.',
  runtime: 'node',
  entry: 'part.mjs',
  files: ['README.md', 'part.mjs'],
  kit: '>=1.0.0 <2.0.0',
  needs: {
    browser: false,
    ffmpeg: true,
    network: true,
    models: [
      { provider: 'fal', model: V31 },
      { provider: 'fal', model: V31_FAST },
      { provider: 'fal', model: V3 },
      { provider: 'fal', model: V3_FAST },
    ],
    disk_mb: 1200,
  },
  inputs: {
    type: 'object',
    additionalProperties: false,
    required: ['model', 'stills'],
    properties: {
      product_reference_evidence: {
        type: 'array', maxItems: 40, items: {
          type: 'object', additionalProperties: false,
          required: ['version', 'scene_id', 'image_sha256', 'product_photos', 'request_image_sha256', 'model', 'piece', 'digest'],
          properties: {
            version: { const: 1 }, scene_id: { type: 'string', minLength: 1, maxLength: 64 },
            image_sha256: { type: 'string', pattern: '^[0-9a-f]{64}$' },
            product_photos: { type: 'array', maxItems: 12, items: { type: 'object', additionalProperties: false, required: ['id', 'sha256'], properties: { id: { type: 'string', minLength: 1 }, sha256: { type: 'string', pattern: '^[0-9a-f]{64}$' } } } },
            request_image_sha256: { type: 'array', maxItems: 10, items: { type: 'string', pattern: '^[0-9a-f]{64}$' } },
            model: { type: 'string' }, piece: { type: 'string', minLength: 1 }, digest: { type: 'string', pattern: '^[0-9a-f]{64}$' },
          },
        },
      },

      require_scene_tags: { description: 'Opt in to strict by_tag routing: reject missing, unknown, malformed or contradictory scene tags before any provider order. scenes mode only.', type: 'boolean' },
      require_product_refs: { description: 'Opt in to requiring the current real product photo in each product scene’s still request and binding its request evidence to the exact motion start frame. scenes mode only.', type: 'boolean' },

      model: {
        description: 'The Veo image-to-video model. All four make 4, 6 or 8 s clips. veo3.1 is the default choice for people (skin and fabric hold); the fast variants cost less.',
        enum: [V31, V31_FAST, V3, V3_FAST],
      },
      mode: { description: 'scenes: one clip per picked plan scene, its still found by scene id. images: one clip per still. Default: scenes when scenes is given, else images.', enum: ['scenes', 'images'] },
      stills: {
        description: 'The pictures to move, keyed by scene id (step.<stills>.images) or cast key (step.<stills>.anchors). Veo crops a picture that is not 9:16 or 16:9.',
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
      scenes: { description: 'plan.scenes. scenes mode: the scenes to move. images mode: fills each still\'s prompt from the scene with its id.', type: 'array', minItems: 1, maxItems: 40, items: scene },
      template: { description: 'The style\'s prompt template (frames/<name>.prompt.json, version 1; see parts/_lib/prompt.mjs). Its motion text (or the text `use` names) is each clip\'s prompt; its negative is the negative prompt; its banned phrases refuse a prompt.', ...file('json') },
      use: { description: 'Which template text is the prompt: motion (default) or a key of the template\'s templates ("hook").', type: 'string', pattern: '^[a-z][a-z0-9_]{0,39}$' },
      look: { description: 'The art style: a key of the template\'s looks (a declared plan answer), filling {look}.', type: ['string', 'null'], maxLength: 200 },
      answers: { description: 'plan.answers, for {answers.KEY} placeholders.', type: ['object', 'null'] },
      brand: { description: 'The brand, for {brand.FIELD} placeholders.', type: ['object', 'null'] },
      cast: { description: 'plan.cast, for {speaker.name}, {speaker.look} and {cast_looks}.', type: 'array', maxItems: 10, items: member },
      products: { description: 'plan.products, for {product.name}.', type: 'array', maxItems: 12, items: product },
      pick: {
        description: 'scenes mode: which scenes move: all (default), first, with_picture, or {tags: [...]}.',
        anyOf: [
          { enum: ['all', 'first', 'with_picture'] },
          { type: 'object', additionalProperties: false, required: ['tags'], properties: { tags: { type: 'array', minItems: 1, maxItems: 12, items: { type: 'string', minLength: 1, maxLength: 40 } } } },
        ],
      },
      skip_first: { description: 'scenes mode: scenes left out at the start of the plan.', type: 'integer', minimum: 0, maximum: 40 },
      skip_last: { description: 'scenes mode: scenes left out at the end of the plan (an end card scene).', type: 'integer', minimum: 0, maximum: 40 },
      spans: {
        description: "scenes mode: where each scene's line is in the voice or song (step.<voice>.scenes). Each clip is long enough for its scene's time on screen (a scene with no line shares the one before it) plus 0.2 s, rounded up to 4, 6 or 8 s.",
        type: 'array',
        minItems: 1,
        maxItems: 60,
        items: sceneSpan,
      },
      seconds: { description: 'Without spans: every clip\'s length, rounded up to 4, 6 or 8 s. Default 4.', ...clipSeconds },
      min_s: { description: 'The shortest clip to make.', ...clipSeconds },
      max_s: { description: 'The longest clip to make. A scene on screen longer than this gets the longest clip, and assemble holds its last frame.', ...clipSeconds },
      max_total_s: { description: 'A price guard: refuse the step, before anything is ordered, when all its clips together would be longer than this many seconds.', type: 'number', exclusiveMinimum: 0, maximum: 320 },
      resolution: { description: 'The clips\' resolution. Default 1080p.', enum: ['720p', '1080p'] },
      aspect_ratio: { description: 'The clips\' shape. Default: the model\'s (auto, from the still).', enum: ['auto', '9:16', '16:9'] },
      generate_audio: { description: 'Always false: the clips are silent (the voice and music come from other steps). Veo makes sound unless told not to, so the part always says no.', enum: [false] },
      seed: { description: 'A base seed. Each clip gets seed + its scene\'s index, so neighbouring scenes never share one. Default: none (the model picks).', type: 'integer', minimum: 0, maximum: 2147483000 },
      negative_prompt: { description: 'What the clips must not show. Default: the template\'s negative, else none.', type: 'string', minLength: 1, maxLength: 5000 },
      static_words: {
        description: 'refuse (default): a prompt with a word that tells Veo the shot is still (remain, remains, stay, stays, rests, unchanged, steady, holds, subtle, slow, gentle, smooth and their -ly forms, static, motionless) refuses the step before anything is ordered, because Veo often answers such prompts with no video. allow: no check.',
        enum: ['refuse', 'allow'],
      },
      keep: {
        description: 'Keep only this many seconds of every clip, from its start or its end.',
        type: 'object',
        additionalProperties: false,
        required: ['seconds', 'anchor'],
        properties: { seconds: clipSeconds, anchor: { enum: ['start', 'end'] } },
      },
      fallback: {
        description: 'What a clip the provider refuses or fails becomes: fail (default) fails the step; still hands back its still for that scene (assemble shows it). A plain failure falls back only on the step\'s last attempt.',
        enum: ['fail', 'still'],
      },
    },
  },
  outputs: {
    type: 'object',
    additionalProperties: false,
    required: ['clips'],
    properties: {
      clips: {
        description: 'One per clip, id = the scene id (scenes mode) or the still id (images mode): a silent video, or the still when it fell back.',
        type: 'array',
        items: {
          type: 'object',
          additionalProperties: false,
          required: ['id', 'seconds'],
          properties: { id: { type: 'string' }, video: file('video'), image: file('image'), seconds: { type: 'number', exclusiveMinimum: 0 } },
        },
      },
      video: { description: 'The first clip\'s video (absent when the first clip fell back to its still).', ...file('video') },
    },
  },
  cost: {
    basis: 'per_unit',
    unit: 'second',
    rates_usd: { [V31]: 0.4, [V31_FAST]: 0.15, [V3]: 0.4, [V3_FAST]: 0.15 },
    model_from: '/model',
  },
  determinism: 'provider',
  timing: { typical_s: 420, timeout_s: 3600 },
  retry: { transient: 1 },
  replaces: [],
  // Dated provider notice (fix-forward contract section 5). Kept until a bake-off picks the replacement.
  'x-provider-retirement': { date: '2026-11-17', notice: 'fal retires this endpoint on 17 Nov 2026.', added: '2026-10-15' },
};

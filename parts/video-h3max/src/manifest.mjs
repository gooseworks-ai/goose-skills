import { file, pronunciations, timeline } from '../../_tools/schemas.mjs';

const MODEL = 'minimax/h3-max/reference-to-video';
const PICTURE = ['image/png', 'image/jpeg', 'image/webp'];
const PROMPT_MAX = 12000;
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
    picture: { description: 'What the clip shows. A leading "Tag:" (or extra.shot) picks the template\'s by_tag rule.', anyOf: [{ type: 'null' }, { type: 'string', maxLength: 2000 }, file('image')] },
    image: { description: 'A picture the customer gave for this scene: a reference (or the start frame) when the template\'s refs ask for scene_image.', ...imageOrNull },
    speaker: { type: ['string', 'null'], maxLength: 24 },
    extra: { type: ['object', 'null'] },
  },
};

// A plan cast member (CastMember). Other fields pass through.
const member = {
  type: 'object',
  required: ['key'],
  properties: {
    key: { type: 'string', pattern: '^[a-z][a-z0-9_]{0,23}$' },
    name: { type: ['string', 'null'], maxLength: 40 },
    look: { type: ['string', 'null'], maxLength: 600 },
    image: { description: 'The member\'s picture: sent as a reference when a clip names them.', ...imageOrNull },
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
  id: 'video-h3max',
  version: '1.0.0',
  kind: 'generate_video',
  title: 'Scene clips with native audio (H3 Max)',
  summary: 'H3 Max scene clips with native dialogue, including multiple speakers. Reference or fitted first/last-frame clips, plan-backed templates, and timed takes with a measured timeline. Silent requests remove sound locally.',
  runtime: 'node',
  entry: 'part.mjs',
  files: ['README.md', 'part.mjs'],
  kit: '>=1.0.0 <2.0.0',
  needs: {
    browser: false,
    ffmpeg: true,
    network: true,
    models: [
      { provider: 'fal', model: MODEL },
    ],
    disk_mb: 1500,
  },
  inputs: {
    type: 'object',
    additionalProperties: false,
    required: [],
    properties: {
      mode: {
        description: `Every mode uses ${MODEL}. reference (default): a clip from up to 9 images. image_to_video: a clip starting on the given first frame and optionally ending on the last frame. take: up to 4 picked scenes as timed beats in one clip. takes: takes.count takes of up to 8 scenes each, joined into one video.`,
        enum: ['reference', 'image_to_video', 'take', 'takes'],
        default: 'reference',
      },
      clips: {
        description: 'The hand-built clip list. Without it, give scenes: one clip per picked scene.',
        type: 'array',
        minItems: 1,
        maxItems: 12,
        items: {
          type: 'object',
          additionalProperties: false,
          required: ['seconds'],
          properties: {
            id: { type: 'string', pattern: '^[a-z0-9][a-z0-9_-]{0,39}$' },
            prompt: {
              description: 'The structured clip prompt (framing, action, dialogue). It may use the template placeholders ({answers.KEY}, {product.name}, {brand.name}, ...). Without it the template\'s templates.<clip id>, else its motion, else its scene text is used.',
              type: 'string',
              minLength: 1,
              maxLength: PROMPT_MAX,
            },
            references: {
              description: 'reference mode: reference images in order (the first is Image 1; authored @Image1 tokens are translated): the person, the product, the setting. Never AI-generated video. Without them the template\'s refs pick them from the plan.',
              type: 'array',
              minItems: 1,
              maxItems: 9,
              items: file('image', PICTURE),
            },
            start_image: {
              description: 'image_to_video mode: the first frame. "product" is the first photo of the product the clip names (else the first product with a photo). Without it the template\'s refs pick one: the scene\'s picture, a product photo, a cast member\'s picture.',
              anyOf: [{ enum: ['product'] }, file('image', PICTURE)],
            },
            end_image: {
              description: 'image_to_video mode: the last frame. "start" lands the clip back on its start frame.',
              anyOf: [{ enum: ['start'] }, file('image', PICTURE)],
            },
            seconds: { description: 'Whole seconds, 4 to 15.', type: 'integer', minimum: 4, maximum: 15 },
            generate_audio: { description: 'Keep native sound (true); false strips it locally after generation.', type: 'boolean' },
          },
        },
      },
      seconds: { description: 'scenes mode: every clip\'s length in whole seconds, 4 to 15. Default 5. Modes take and takes: every take\'s length. Default 15.', type: 'integer', minimum: 4, maximum: 15 },
      resolution: { description: 'H3 native resolution labels. Default 1080P; 768P is the middle option.', enum: ['480P', '768P', '1080P'] },
      aspect_ratio: { description: 'Default 9:16. adaptive follows the reference canvas.', enum: ['adaptive', '9:16', '16:9', '1:1', '4:3', '3:4', '21:9'] },
      generate_audio: { description: 'Keep native lip-synced voice and room sound (default true). false strips sound locally; no unsupported generate_audio flag is sent to H3.', type: 'boolean' },
      seed: { description: 'Mixed into every clip\'s seed (a style binds plan.answers.take): a new seed is a new piece, so a fix that changes it re-rolls the clips.', type: 'integer', minimum: 0, maximum: 2147483647 },
      scenes: { description: 'plan.scenes. Without clips: one clip per picked scene (max 12), keyed by scene id. With clips: a clip whose id is a scene id fills {picture}, {line} and {on_screen} from that scene.', type: 'array', minItems: 1, maxItems: 40, items: scene },
      template: { description: 'The style\'s prompt template (frames/<name>.prompt.json, version 1; see parts/_lib/prompt.mjs). Its prefix and suffix wrap every clip prompt; its negative is added as "Avoid: ...".', ...file('json') },
      look: { description: 'A key of the template\'s looks (a declared plan answer), filling {look}.', type: ['string', 'null'], maxLength: 200 },
      answers: { description: 'plan.answers, for {answers.KEY} placeholders.', type: ['object', 'null'] },
      brand: { description: 'The brand, for {brand.FIELD} placeholders.', type: ['object', 'null'] },
      cast: { description: 'plan.cast. A scene names a member by speaker or by name in its picture or line.', type: 'array', maxItems: 10, items: member },
      products: { description: 'plan.products, for {product.name}, start_image "product" and product references.', type: 'array', maxItems: 12, items: product },
      pick: {
        description: 'scenes mode: which scenes get a clip: all (default), first, with_picture, or {tags: [...]}.',
        anyOf: [
          { enum: ['all', 'first', 'with_picture'] },
          { type: 'object', additionalProperties: false, required: ['tags'], properties: { tags: { type: 'array', minItems: 1, maxItems: 12, items: { type: 'string', minLength: 1, maxLength: 40 } } } },
        ],
      },
      skip_first: { description: 'scenes mode: scenes left out at the start of the plan.', type: 'integer', minimum: 0, maximum: 40 },
      skip_last: { description: 'scenes mode: scenes left out at the end of the plan (an end card scene).', type: 'integer', minimum: 0, maximum: 40 },
      takes: {
        description: 'mode takes: how many takes (scenes split by scene.extra.take, else evenly in order) and the template keys for the text of take 1 (first, default "first") and of later takes (later, default "later", else first\'s).',
        type: 'object',
        additionalProperties: false,
        properties: {
          count: { type: 'integer', minimum: 1, maximum: 4 },
          first: { type: 'string', pattern: '^[a-z][a-z0-9_]{0,39}$' },
          later: { type: 'string', pattern: '^[a-z][a-z0-9_]{0,39}$' },
        },
      },
      chain: {
        description: 'mode takes: a still of take 1 (one frame at at_s, default 0.5, cropped to the bottom 45% so no face is in it) is added after the plan references of every later take; takes then run in order.',
        type: 'object',
        additionalProperties: false,
        required: ['crop'],
        properties: { crop: { enum: ['bottom_45'] }, at_s: { type: 'number', minimum: 0, maximum: 15 } },
      },
      words_per_second: { description: 'Modes take and takes: the speaking rate a beat\'s window is sized from. Default 2.5.', type: 'number', minimum: 1, maximum: 4 },
      max_words: { description: 'Modes take and takes: the most spoken words in one take. Default seconds x words_per_second.', type: 'integer', minimum: 1, maximum: 80 },
      pronunciations: { description: 'Modes take and takes: brand terms written as their spoken form in the dialogue (brand.pronunciations). Default the brand\'s.', ...pronunciations },
      off_screen_lines: { description: 'mode take: a line on a beat that keeps the face off screen (a rear-camera, macro or hands shot) is refused (default) or written as voice-over.', enum: ['refuse', 'voiceover'] },
      off_screen_tags: { description: 'mode take: the scene tags (extra.shot or a leading "Tag:") that keep the face off screen. Default rear, rear-camera, rear-cam, back-camera, macro, hands, off-screen, cutaway, b-roll, broll; a picture that says "face off-screen", "rear camera" or "no face" counts too.', type: 'array', maxItems: 20, items: { type: 'string', minLength: 1, maxLength: 40 } },
    },
  },
  outputs: {
    type: 'object',
    additionalProperties: false,
    required: ['clips', 'video'],
    properties: {
      clips: {
        description: 'One clip per entry (clips) or per picked scene, id = the scene id (scenes); in modes take and takes, one per take (the same as takes).',
        type: 'array',
        items: {
          type: 'object',
          additionalProperties: false,
          required: ['id', 'video', 'seconds'],
          properties: { id: { type: 'string' }, video: file('video'), seconds: { type: 'integer', minimum: 4, maximum: 15 } },
        },
      },
      video: { description: 'The first clip\'s video, for one-clip styles (step.<id>.video). Modes take and takes: every take joined in order with hard cuts.', ...file('video') },
      takes: {
        description: 'Modes take and takes: one per take in order, id t1, t2, ...',
        type: 'array',
        items: {
          type: 'object',
          additionalProperties: false,
          required: ['id', 'video', 'seconds'],
          properties: { id: { type: 'string' }, video: file('video'), seconds: { type: 'integer', minimum: 4, maximum: 15 } },
        },
      },
      seconds: { description: 'Modes take and takes: the joined video\'s length.', type: 'number', exclusiveMinimum: 0 },
      timeline: { description: 'Modes take and takes: the joined video\'s timeline. scenes are the plan scene ids at their beat windows (estimated); speech is empty, so transcribe the video once.', ...timeline },
    },
  },
  // Documentation only: each style supplies the actual quote measure for its clips or takes.
  cost: {
    basis: 'per_unit',
    unit: 'second',
    measure: { from: '/clips/*/seconds', as: 'sum' },
    rates_usd: { [MODEL]: 0.16 },
  },
  determinism: 'provider',
  timing: { typical_s: 240, timeout_s: 3600 },
  retry: { transient: 1 },
};

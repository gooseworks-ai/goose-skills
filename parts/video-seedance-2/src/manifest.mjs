import { file, pronunciations, timeline } from '../../_tools/schemas.mjs';

const REF = 'bytedance/seedance-2.0/reference-to-video';
const I2V = 'bytedance/seedance-2.0/image-to-video';
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
  id: 'video-seedance-2',
  version: '1.3.0',
  kind: 'generate_video',
  title: 'Clips with native audio (Seedance 2)',
  summary: 'Seedance 2.0 clips on fal with native voice: from reference images or a start frame, prompts from a template; or whole takes written from plan scenes as timed beats, joined into one video with a timeline.',
  runtime: 'node',
  entry: 'part.mjs',
  files: ['README.md', 'part.mjs'],
  kit: '>=1.0.0 <2.0.0',
  needs: {
    browser: false,
    ffmpeg: true,
    network: true,
    models: [
      { provider: 'fal', model: REF },
      { provider: 'fal', model: I2V },
    ],
    disk_mb: 1500,
  },
  inputs: {
    type: 'object',
    additionalProperties: false,
    required: [],
    properties: {
      mode: {
        description: `reference (default): ${REF}, each clip from up to 9 reference images. image_to_video: ${I2V}, each clip from a start frame (and an optional end frame). take: one ${REF} take whose prompt holds up to 4 picked scenes as time-windowed beats. takes: takes.count takes of up to 8 scenes each, joined into one video.`,
        enum: ['reference', 'image_to_video', 'take', 'takes'],
        default: 'reference',
      },
      clips: {
        description: 'The hand-built clip list (the 1.0.1 behaviour). Without it, give scenes: one clip per picked scene.',
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
              description: 'reference mode: reference images in order (the first is @Image1): the person, the product, the setting. Never AI-generated video. Without them the template\'s refs pick them from the plan.',
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
            generate_audio: { type: 'boolean' },
          },
        },
      },
      seconds: { description: 'scenes mode: every clip\'s length in whole seconds, 4 to 15. Default 5. Modes take and takes: every take\'s length. Default 15.', type: 'integer', minimum: 4, maximum: 15 },
      resolution: { description: 'Default 720p (16 Oct 2026: no video above 720p unless the customer asks; send 1080p explicitly then).', enum: ['480p', '720p', '1080p'] },
      aspect_ratio: { description: 'Default 9:16.', enum: ['9:16', '16:9', '1:1', '4:3', '3:4', '21:9'] },
      generate_audio: { description: 'Native lip-synced voice and room sound. Default true.', type: 'boolean' },
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
  // Documentation only (critic #17): the quote is the style's own cost block. Both models are
  // metered in tokens (width x height x fps x seconds / 1024 at USD 0.014 per 1000); 0.68/s is
  // the 1080p 9:16 figure. model_from points at mode: reference, take, takes -> REF; image_to_video -> I2V.
  // Modes take and takes bill seconds x the number of takes (no clips input to sum).
  cost: {
    basis: 'per_unit',
    unit: 'second',
    measure: { from: '/clips/*/seconds', as: 'sum' },
    rates_usd: { [REF]: 0.68, [I2V]: 0.68 },
    model_from: '/mode',
  },
  determinism: 'provider',
  timing: { typical_s: 240, timeout_s: 3600 },
  retry: { transient: 1 },
  replaces: ['create-video-seedance-2-fal'],
};

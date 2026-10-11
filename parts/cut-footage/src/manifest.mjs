import { file, timeline } from '../../_tools/schemas.mjs';

const textOrNull = (max) => ({ type: ['string', 'null'], maxLength: max });
const box = { type: 'array', minItems: 4, maxItems: 4, items: { type: 'number', minimum: 0, maximum: 1 } };
const speedLimit = (dflt) => ({ description: `The slowest or fastest allowed speed. Default ${dflt}.`, type: 'number', minimum: 0.25, maximum: 16 });

// A plan scene (PlanScene). Nothing but id is required: a scene with no line
// (an end card, a silent beat) is a normal scene. Other plan fields pass through.
const scene = {
  type: 'object',
  required: ['id'],
  properties: {
    id: { type: 'string', minLength: 1, maxLength: 64 },
    line: textOrNull(2000),
    on_screen: textOrNull(2000),
    picture: { anyOf: [{ type: 'null' }, { type: 'string', maxLength: 2000 }, file('image')] },
    image: { description: 'A picture the customer gave for this scene: held still when the scene has no footage entry.', anyOf: [{ type: 'null' }, file('image')] },
    speaker: { type: ['string', 'null'], maxLength: 24 },
    extra: { type: ['object', 'null'] },
  },
};

// A plan footage entry (PlanFootage). Other plan fields pass through.
const footageEntry = {
  type: 'object',
  anyOf: [{ required: ['file'] }, { required: ['video'] }],
  properties: {
    file: { description: 'The clip (a video), or a still for kind "image".', anyOf: [file('video'), file('image')] },
    video: file('video'),
    asset_id: { type: 'string' },
    start_ms: { type: ['integer', 'null'], minimum: 0 },
    end_ms: { type: ['integer', 'null'], minimum: 1 },
    audio: { type: ['boolean', 'null'] },
    scene_id: { description: 'scenes and inserts modes: the plan scene this entry plays in.', type: ['string', 'null'], maxLength: 64 },
    crop: { description: 'The source region shown: [x0, y0, x1, y1] in fractions of the source.', anyOf: [{ type: 'null' }, box] },
    mask: { description: 'Boxes blurred in the source before the crop (an email, a customer name).', anyOf: [{ type: 'null' }, { type: 'array', maxItems: 8, items: box }] },
    fit: { description: 'This entry\'s fit, over the step\'s.', enum: ['width', 'cover', 'height', null] },
    kind: { enum: ['video', 'image', 'render', null] },
  },
};

export const manifest = {
  $schema: '../../_contract/part-manifest.schema.json',
  interface: 1,
  id: 'cut-footage',
  version: '1.1.0',
  kind: 'compose',
  title: 'Cut footage into a video',
  summary: "Cuts the brand's own footage into a video: a window in a band, one beat per plan scene with dissolves, or full-frame inserts over a talking track that hide its take joins; plain or as a screen filmed by a phone.",
  runtime: 'node',
  entry: 'part.mjs',
  files: ['README.md', 'part.mjs'],
  kit: '>=1.0.0 <2.0.0',
  needs: {
    browser: false,
    ffmpeg: {
      filters: [
        'setpts', 'fps', 'scale', 'crop', 'pad', 'setsar', 'tpad', 'trim', 'overlay', 'format', 'atempo', 'atrim', 'aresample', 'aformat',
        'settb', 'xfade', 'concat', 'null', 'split', 'gblur', 'perspective', 'color', 'geq', 'loop', 'blend', 'noise',
      ],
      encoders: ['libx264', 'aac'],
    },
    network: false,
    models: [],
    disk_mb: 800,
  },
  inputs: {
    type: 'object',
    additionalProperties: false,
    required: ['footage'],
    properties: {
      mode: {
        description: 'band (the 1.0.2 behaviour): one window in a band of video. scenes: one full-frame beat per plan scene. inserts: full-frame inserts over a talking track. Default: band without scenes; with scenes, inserts when video is given, else scenes.',
        enum: ['band', 'scenes', 'inserts'],
      },
      video: { description: 'band: the picture the footage goes under (an html-frames card that leaves the band free). inserts: the talking track; its sound is kept.', ...file('video') },
      footage: {
        description: 'plan.footage. band: the first entry is used. scenes and inserts: entries are matched to scenes by scene_id (one per scene). Each carries its clip as file (video is accepted too); start_ms and end_ms are the window (default: the whole clip). An image file (kind "image") is held still.',
        type: 'array',
        minItems: 1,
        maxItems: 20,
        items: footageEntry,
      },
      band: {
        description: 'band: where the footage goes, in the video\'s pixels.',
        type: 'object',
        additionalProperties: false,
        required: ['x', 'y', 'width', 'height'],
        properties: {
          x: { type: 'integer', minimum: 0 },
          y: { type: 'integer', minimum: 0 },
          width: { type: 'integer', minimum: 2 },
          height: { type: 'integer', minimum: 2 },
        },
      },
      scenes: { description: 'scenes and inserts: plan.scenes, in order.', type: 'array', minItems: 1, maxItems: 40, items: scene },
      lead: {
        description: 'scenes: a clip that plays as the first scene when that scene has no footage or image (a creator hook, a cold open), at its own length.',
        type: 'object',
        additionalProperties: false,
        required: ['video'],
        properties: { video: file('video') },
      },
      timeline: { description: 'inserts: the talking track\'s timeline; scenes are placed at its scene times, and it is passed through.', ...timeline },
      joins: {
        description: 'inserts: step.<creator>.takes. Every take start after the first must sit under an insert; an insert ending up to 1 s before one is stretched to end 0.15 s after it, else an insert starting up to 1 s after one starts 0.15 s before it (never before 0 or into the previous insert), and a join no insert reaches is refused.',
        type: 'array',
        maxItems: 40,
        items: { type: 'object', required: ['start_s'], properties: { id: { type: 'string' }, start_s: { type: 'number', minimum: 0 }, scene_ids: { type: 'array', items: { type: 'string' } } } },
      },
      look: { description: 'scenes and inserts: plain (default) fits the footage; screen frames it as a screen filmed by a phone.', enum: ['plain', 'screen'] },
      screen: {
        description: 'look "screen": the style\'s constants (parts/_lib/screen-look.mjs): rot, alternate_rot (odd footage beats), keystone, fill, fit (width | height), drift, bezel, room, moire, vignette, grain.',
        type: 'object',
      },
      fit: { description: 'band: cover (default) or width. scenes and inserts, plain look: cover (default), width or height; screen look: width or height (over screen.fit). A footage entry\'s own fit wins.', enum: ['cover', 'width', 'height'] },
      transition: {
        description: 'scenes: dissolves between beats. Each beat but the last plays dissolve_frames longer, so the total length holds.',
        type: 'object',
        additionalProperties: false,
        properties: { dissolve_frames: { type: 'integer', minimum: 0, maximum: 30 } },
      },
      scene_seconds: {
        description: 'scenes: a window\'s beat length is its own length (at 1x, or at a fixed speed) clamped to min to max; the speed that fits it must stay inside min_speed to max_speed.',
        type: 'object',
        additionalProperties: false,
        properties: { min: { type: 'number', minimum: 0.2, maximum: 30 }, max: { type: 'number', minimum: 0.2, maximum: 30 } },
      },
      still_seconds: { description: 'scenes: how long a still beat lasts. Default scene_seconds.max, else 2.5.', type: 'number', minimum: 0.2, maximum: 30 },
      speed: { description: '"fill" (default): the window fills its slot exactly; or a fixed playback speed.', anyOf: [{ const: 'fill' }, { type: 'number', minimum: 0.25, maximum: 16 }] },
      min_speed: speedLimit('1 in band mode, 0.5 in scenes and inserts'),
      max_speed: speedLimit('8 in band mode, 2 in scenes and inserts'),
      order: { description: 'scenes and inserts: forward (default) refuses a window that goes back in its recording; any allows it. Two windows on the same part of a recording are always refused.', enum: ['forward', 'any'] },
      width: { description: 'scenes: the frame width. Default 1080.', type: 'integer', minimum: 16, maximum: 4096 },
      height: { description: 'scenes: the frame height. Default 1920.', type: 'integer', minimum: 16, maximum: 4096 },
      fps: { description: 'scenes: frames per second. Default 30.', type: 'integer', minimum: 10, maximum: 60 },
      audio: { description: "band: keep the footage's own sound, sped by the same factor. Default false: the video's own sound is kept.", type: 'boolean' },
    },
  },
  outputs: {
    type: 'object',
    additionalProperties: false,
    required: ['video', 'seconds'],
    properties: {
      video: file('video'),
      seconds: { type: 'number', exclusiveMinimum: 0 },
      speed: { description: 'band: the footage\'s speed.', type: 'number', exclusiveMinimum: 0 },
      timeline: { description: 'scenes: the plan\'s scene ids at their real times. inserts: the talking track\'s timeline, passed through.', ...timeline },
      windows: {
        description: 'scenes and inserts: where each footage or still beat sits in the output, and its speed.',
        type: 'array',
        items: {
          type: 'object',
          additionalProperties: false,
          required: ['scene_id', 'start_s', 'end_s', 'speed'],
          properties: { scene_id: { type: 'string' }, start_s: { type: 'number', minimum: 0 }, end_s: { type: 'number', minimum: 0 }, speed: { type: 'number', exclusiveMinimum: 0 } },
        },
      },
    },
  },
  cost: { basis: 'free' },
  determinism: 'pure',
  timing: { typical_s: 60, timeout_s: 1200 },
  retry: { transient: 1 },
  replaces: [],
};

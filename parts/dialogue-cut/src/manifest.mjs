import { file, sceneSpan, speechEntry, timeline } from '../../_tools/schemas.mjs';

const textOrNull = { type: ['string', 'null'] };
const rect = {
  type: 'object',
  additionalProperties: false,
  required: ['x', 'y', 'w', 'h'],
  properties: {
    x: { type: 'number', minimum: 0, maximum: 1 },
    y: { type: 'number', minimum: 0, maximum: 1 },
    w: { type: 'number', exclusiveMinimum: 0, maximum: 1 },
    h: { type: 'number', exclusiveMinimum: 0, maximum: 1 },
  },
};

export const manifest = {
  $schema: '../../_contract/part-manifest.schema.json',
  interface: 1,
  id: 'dialogue-cut',
  version: '1.0.1',
  kind: 'compose',
  title: 'Dialogue cut (two hosts)',
  summary: 'Re-cuts one lipsync clip per line over a fixed two-host voice track, free and seeded: plain, split (speaker over the idle listener) or dynamic (reactions, reframes, moving seams, a product panel), self-checked before and after the render.',
  runtime: 'node',
  entry: 'part.mjs',
  files: ['README.md', 'part.mjs'],
  kit: '>=1.0.0 <2.0.0',
  needs: {
    browser: false,
    ffmpeg: {
      filters: ['setpts', 'fps', 'tpad', 'trim', 'settb', 'format', 'setsar', 'scale', 'crop', 'pad', 'vstack', 'concat', 'null', 'anull', 'curves', 'eq', 'noise', 'select', 'metadata', 'aresample', 'aformat', 'apad', 'atrim', 'asetpts', 'anullsrc'],
      encoders: ['libx264', 'aac'],
    },
    network: false,
    models: [],
    disk_mb: 800,
  },
  inputs: {
    type: 'object',
    additionalProperties: false,
    required: ['scenes', 'clips', 'voice', 'spans'],
    properties: {
      scenes: {
        description:
          "plan.scenes in order. A scene with a line is one beat, shown from its speaker's lipsync clip; a scene with a null line and no span is skipped. extra.split asks for a split on that line, extra.payoff marks the payoff line. Other scene fields are ignored.",
        type: 'array',
        minItems: 1,
        maxItems: 40,
        items: {
          type: 'object',
          properties: {
            id: { type: ['string', 'integer'] },
            line: { ...textOrNull, maxLength: 1000 },
            speaker: { description: 'A host key (a cast key).', ...textOrNull, maxLength: 24 },
            extra: { type: ['object', 'null'] },
          },
        },
      },
      cast: {
        description: "plan.cast: exactly two hosts. Without it the hosts are the two speakers. A member's image stands in for them listening when they speak no line and have no idle clip.",
        type: 'array',
        maxItems: 10,
        items: {
          type: 'object',
          required: ['key'],
          properties: { key: { type: 'string', pattern: '^[a-z][a-z0-9_]{0,23}$' }, image: { anyOf: [{ type: 'null' }, file('image')] } },
        },
      },
      clips: {
        description: "One lipsync clip per spoken scene (step.<lipsync>.clips), matched by scene id. Each clip's frame 0 is where its line starts in the voice.",
        type: 'array',
        minItems: 1,
        maxItems: 40,
        items: {
          type: 'object',
          additionalProperties: false,
          required: ['id', 'video'],
          properties: { id: { type: 'string', maxLength: 64 }, video: file('video'), seconds: { type: 'number', exclusiveMinimum: 0 } },
        },
      },
      idle: {
        description: "A silent listening clip per host (step.<lipsync>.idle), by cast key. Split mode shows the listener from it; it loops.",
        type: 'array',
        maxItems: 10,
        items: {
          type: 'object',
          additionalProperties: false,
          required: ['key', 'video'],
          properties: { key: { type: 'string', maxLength: 24 }, video: file('video'), seconds: { type: 'number', exclusiveMinimum: 0 } },
        },
      },
      voice: { ...file('audio'), description: 'The whole voice track (step.<voice>.audio). It is the clock: the picture is cut over it and it never moves.' },
      spans: {
        description: "Where each spoken scene's line is in the voice (step.<voice>.scenes). A line runs to the next line's start; the last runs to the end of the voice.",
        type: 'array',
        minItems: 1,
        maxItems: 40,
        items: sceneSpan,
      },
      speech: {
        description: "The voice's speech with word times (step.<voice>.speech): copied into the timeline, so captions need no transcription, and each line's length is what its clip is stretched to (within 5%).",
        type: 'array',
        items: speechEntry,
      },
      mode: {
        description: 'plain (default): one full-frame picture per line. split: the speaker over the idle listener on every line, then a full-frame payoff. dynamic: cuts inside a line, listener reactions, five reframes, splits on a cadence with seams 0.62 / 0.37 / 0.5, the listener or a product below, a payoff single.',
        enum: ['plain', 'split', 'dynamic'],
      },
      seed: {
        description: 'The edit seed (default 4201). Same seed and lines, same edit. When a plan misses a cut check, the next seeds are tried in turn and the one used is returned.',
        type: 'integer',
        minimum: 0,
        maximum: 1000000,
      },
      crops: {
        description: 'Reframes as normalised rects on the clip, replacing the defaults: wide (whole frame), mid, tight, mid_left, tight_right.',
        type: 'object',
        additionalProperties: false,
        required: [],
        properties: { wide: rect, mid: rect, tight: rect, mid_left: rect, tight_right: rect },
      },
      seams: {
        description: "Split seams as the top panel's share of the height (split default [0.5]; dynamic [0.62, 0.37, 0.5]).",
        type: 'array',
        minItems: 1,
        maxItems: 4,
        items: { type: 'number', exclusiveMinimum: 0.2, exclusiveMaximum: 0.8 },
      },
      bottom_sources: {
        description: "What a split's lower panel may show: the listener and/or a product's first photo (dynamic default both; split listener only).",
        type: 'array',
        minItems: 1,
        maxItems: 2,
        uniqueItems: true,
        items: { enum: ['listener', 'product'] },
      },
      listener_source: {
        description: "Where a split's listener comes from: idle (split default; their idle clip) or clip (dynamic default; their nearest line's clip, muted).",
        enum: ['clip', 'idle'],
      },
      products: {
        description: 'plan.products: the first photo of each, in turn, for a product lower panel. Products with no photo are skipped.',
        type: 'array',
        maxItems: 12,
        items: { type: 'object', required: ['id'], properties: { id: { type: 'string', minLength: 1 }, name: textOrNull, images: { type: 'array', maxItems: 20, items: file('image') } } },
      },
      payoff: { description: "last (split and dynamic default): one full-frame single on the payoff line, when the piece was split earlier. none: no payoff.", enum: ['last', 'none'] },
      grade: {
        description: 'A finish on the dialogue picture (never the end card). warm-lift-grain: blacks lifted, colour pushed, fine grain; caps the encode at 8 Mbps.',
        enum: ['none', 'warm-lift-grain'],
      },
      head: { description: 'Where a cover crop sits vertically: 0 keeps the top, 0.5 centres. Default 0.25 (keeps a head in frame).', type: 'number', minimum: 0, maximum: 1 },
      ending: { ...file('video'), description: 'The end card (step.<card>.video), joined after the dialogue with its own sound or silence. Absent: no card.' },
      ending_timeline: { ...timeline, description: "The end card's timeline: its logo safe zone is moved onto the cut." },
      width: { description: 'Default 1080.', type: 'integer', minimum: 16, maximum: 4096 },
      height: { description: 'Default 1920.', type: 'integer', minimum: 16, maximum: 4096 },
      fps: { description: 'Default 30.', type: 'integer', minimum: 10, maximum: 60 },
    },
  },
  outputs: {
    type: 'object',
    additionalProperties: false,
    required: ['video', 'seconds', 'timeline', 'cuts', 'seed'],
    properties: {
      video: file('video'),
      seconds: { type: 'number', exclusiveMinimum: 0 },
      timeline,
      cuts: {
        description: 'The edit as rendered: each cut on its real output times, what it shows and its framing.',
        type: 'array',
        items: {
          type: 'object',
          additionalProperties: false,
          required: ['scene_id', 'start_s', 'end_s', 'mode', 'show', 'framing'],
          properties: {
            scene_id: { type: 'string' },
            start_s: { type: 'number', minimum: 0 },
            end_s: { type: 'number', minimum: 0 },
            mode: { enum: ['single', 'reaction', 'split'] },
            show: { type: 'string' },
            framing: textOrNull,
          },
        },
      },
      seed: { description: 'The seed the edit used.', type: 'integer', minimum: 0 },
    },
  },
  cost: { basis: 'free' },
  determinism: 'pure',
  timing: { typical_s: 120, timeout_s: 1800 },
  retry: { transient: 1 },
  replaces: ['render-podcast-skit'],
};

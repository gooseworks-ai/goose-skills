import { file, sceneSpan, speechEntry, timeline, timelineWithKeepClear } from '../../_tools/schemas.mjs';

const textOrNull = (max) => ({ type: ['string', 'null'], maxLength: max });

// A plan scene (as the generation parts take it). Other fields pass through.
const assembleScene = {
  type: 'object',
  required: ['id'],
  properties: {
    id: { type: 'string', minLength: 1, maxLength: 64 },
    line: textOrNull(2000),
    on_screen: textOrNull(2000),
    picture: { anyOf: [{ type: 'null' }, { type: 'string', maxLength: 2000 }, file('image')] },
    speaker: { type: ['string', 'null'], maxLength: 24 },
    extra: { type: ['object', 'null'] },
  },
};

// A plan product. Other fields pass through.
const assembleProduct = {
  type: 'object',
  required: ['id'],
  properties: { id: { type: 'string', minLength: 1 }, name: { type: ['string', 'null'], maxLength: 2000 } },
};

// One picture or clip of a step's list output (images [{id, image}], clips [{id, video|image, seconds}]).
const assembleSourceItem = {
  type: 'object',
  required: ['id'],
  properties: { id: { type: 'string', minLength: 1 }, image: file('image'), video: file('video'), seconds: { type: 'number', minimum: 0 } },
};

const speed = { type: 'number', minimum: 0.5, maximum: 2 };

// One shot of a recipe.
const assembleShot = {
  type: 'object',
  additionalProperties: false,
  required: ['kind', 'source'],
  properties: {
    kind: {
      description:
        "still: a picture (of: scene, by this scene's id; named_product, the product the scene names, with variant; first). clip: this scene's clip from a list. video: one video source (a card). montage: one frame of each clip used so far from the source (else all of them), seconds each. freeze: one frame of a clip held (pick last or first used, or this scene's).",
      enum: ['still', 'clip', 'video', 'montage', 'freeze'],
    },
    source: { description: 'A key of sources.', type: 'string', minLength: 1, maxLength: 40 },
    of: { enum: ['scene', 'named_product', 'first'] },
    variant: { description: 'still of named_product: the picture id is "<product id>-<variant>" (e.g. snap).', type: 'string', pattern: '^[A-Za-z0-9_-]{1,24}$' },
    seconds: { description: 'How long the shot runs (montage: each frame). Not used by the fill shot.', type: 'number', exclusiveMinimum: 0, maximum: 30 },
    fill: { description: 'This shot takes what the others leave of the scene. At most one per recipe; default the last.', type: 'boolean' },
    zoom: { description: 'A centred push (or pull) from the first scale to the second over the shot. Stills, freezes and montage frames.', type: 'array', minItems: 2, maxItems: 2, items: { type: 'number', minimum: 1, maximum: 1.5 } },
    mark: { description: 'Adds {kind: mark, at_s: the shot start} to the marks output.', type: 'string', pattern: '^[A-Za-z0-9_-]{1,40}$' },
    skip_first: { description: 'Leave this shot out of the first scene with this tag (its still was the hook).', type: 'boolean' },
    in_s: { description: 'clip and video: where in the clip the shot starts. Default 0.', type: 'number', minimum: 0 },
    speed: { ...speed, description: 'clip and video: a fixed speed (sound follows with clip_audio keep).' },
    min_speed: { ...speed, description: 'clip and video without speed: the slowest it may play to fill its time (default 1, or max_speed when that is below 1); shorter still, it holds its last frame.' },
    max_speed: { ...speed, description: 'clip and video without speed: the fastest it may play to fit its time (default 1, or min_speed when that is above 1); longer still, it is cut. Refused below min_speed.' },
    pick: { description: 'freeze: last (default) or first clip used so far from the source (the source\'s own last or first clip when none is used yet), or this scene\'s clip.', enum: ['last', 'first', 'scene'] },
    at: { description: 'montage and freeze: where in each clip\'s used part the frame is, 0 to 1. Default 0.5.', type: 'number', minimum: 0, maximum: 1 },
    max: { description: 'montage: at most this many frames.', type: 'integer', minimum: 1, maximum: 12 },
    transition: { description: 'montage: cut (default), fade or hlslice between frames.', enum: ['cut', 'fade', 'hlslice'] },
    transition_s: { description: 'montage: the transition length. Default 0.1.', type: 'number', minimum: 0, maximum: 1 },
  },
};

export const manifest = {
  $schema: '../../_contract/part-manifest.schema.json',
  interface: 1,
  id: 'assemble',
  version: '1.3.0',
  kind: 'compose',
  title: 'Assemble scenes',
  summary: 'Joins clips and stills into one cut at one size and frame rate, frame exact: timed to a voice or song, built from shot recipes per scene tag, with cuts kept between words, marks for sounds, an end card, Ken Burns and grain looks.',
  runtime: 'node',
  entry: 'part.mjs',
  files: ['README.md', 'part.mjs'],
  kit: '>=1.0.0 <2.0.0',
  needs: {
    browser: false,
    ffmpeg: {
      filters: ['fps', 'scale', 'crop', 'pad', 'setsar', 'tpad', 'trim', 'setpts', 'format', 'concat', 'aresample', 'aformat', 'apad', 'atrim', 'anullsrc', 'zoompan', 'eq', 'hqdn3d', 'noise', 'xfade', 'settb', 'null', 'atempo'],
      encoders: ['libx264', 'aac'],
    },
    network: false,
    models: [],
    disk_mb: 800,
  },
  inputs: {
    type: 'object',
    additionalProperties: false,
    required: ['width', 'height'],
    properties: {
      clips: {
        description: 'The pictures in order. Give clips, or shots with sources and scenes; not both.',
        type: 'array',
        minItems: 1,
        maxItems: 60,
        items: {
          type: 'object',
          additionalProperties: false,
          properties: {
            id: { type: 'string', maxLength: 64 },
            video: file('video'),
            image: file('image'),
            in_s: { description: 'Where the cut starts in its clip. Default 0.', type: 'number', minimum: 0 },
            seconds: { description: 'Length of the cut. Default: the rest of the clip. Required for a still.', type: 'number', exclusiveMinimum: 0, maximum: 300 },
            keep_clear: {
              description: "Where the product is in this still, as shares of the picture (0 to 1). Each box is moved onto the cut the way fit and the Ken Burns push move the picture, and added to timeline.keep_clear for the clip's span, so captions-layer >= 1.4.0 keeps the captions off it. Use only when the style's captions layer is on.",
              type: 'array',
              maxItems: 8,
              items: {
                type: 'object',
                additionalProperties: false,
                required: ['x', 'y', 'w', 'h'],
                properties: { x: { type: 'number', minimum: 0, maximum: 1 }, y: { type: 'number', minimum: 0, maximum: 1 }, w: { type: 'number', exclusiveMinimum: 0, maximum: 1 }, h: { type: 'number', exclusiveMinimum: 0, maximum: 1 } },
              },
            },
          },
        },
      },
      width: { type: 'integer', minimum: 16, maximum: 4096 },
      height: { type: 'integer', minimum: 16, maximum: 4096 },
      fps: { description: 'Default 30.', type: 'integer', minimum: 10, maximum: 60 },
      fit: { description: 'cover crops to fill (default); contain pads.', enum: ['cover', 'contain'] },
      background: { description: 'Pad colour for contain. Default black.', type: 'string', pattern: '^(#[0-9A-Fa-f]{6}|black|white)$' },
      clip_audio: { description: "drop (default) or keep each clip's own sound, with silence under stills and the end card.", enum: ['drop', 'keep'] },
      spans: {
        description:
          "Where each scene's line is in the voice or song (step.<voice>.scenes), matched to clips by id. Each clip then starts on its span's start (the first at 0) and runs to the next one; the last runs to its span's end plus tail_s. A clip's seconds is not used.",
        type: 'array',
        minItems: 1,
        maxItems: 60,
        items: sceneSpan,
      },
      silent: {
        description:
          'With spans: what a clip with no span (a scene with no line) gets. share_previous (default) splits the voiced clip before it evenly; fixed gives it seconds (default 1) of that clip.',
        type: 'object',
        additionalProperties: false,
        required: ['mode'],
        properties: {
          mode: { enum: ['share_previous', 'fixed'] },
          seconds: { type: 'number', exclusiveMinimum: 0, maximum: 10 },
        },
      },
      speech: { description: "Copied into the output timeline (held to its length), so captions need no transcription.", type: 'array', items: speechEntry },
      timeline: {
        ...timeline,
        description:
          "The clips' own timeline. Without spans the clips are already cut: its scenes, speech and safe zones are kept (scenes and zones moved onto the cut). With spans only its speech is used, when speech is not given.",
      },
      ending: { ...file('video'), description: 'The end card, joined with a hard cut and marked as timeline.end_card. Never graded.' },
      ending_timeline: { ...timeline, description: "The end card's timeline: its logo safe zone is moved onto the cut and kept." },
      ending_fills: {
        description: "after (default): the card follows the last cut. last_span (needs spans): the card takes the last span's place, from its start to its end plus tail_s, never shorter than the card.",
        enum: ['last_span', 'after'],
      },
      tail_s: { description: 'With spans: how long the last picture holds after its span ends. Default 0.25.', type: 'number', minimum: 0, maximum: 5 },
      motion: {
        description: "stills: ken_burns pushes every still slowly in, centred, from 1.0 to `to` (default 1.05) over its cut. Clips and the end card never move.",
        type: 'object',
        additionalProperties: false,
        required: [],
        properties: { stills: { enum: ['none', 'ken_burns'] }, to: { type: 'number', minimum: 1, maximum: 1.5 } },
      },
      scenes: {
        description: "plan.scenes in order. With shots, each scene's tag (extra.shot, else a leading \"Tag:\" in its picture) picks its recipe, and its picture or line names its product. Also read by card_from {tag}.",
        type: 'array',
        minItems: 1,
        maxItems: 60,
        items: assembleScene,
      },
      products: { description: 'plan.products: a still of a named_product is the picture with id "<product id>-<variant>" (or "<product id>").', type: 'array', maxItems: 12, items: assembleProduct },
      sources: {
        description:
          "What the shots draw from, each bound whole from a step: a list of pictures or clips by id (step.<id>.images, step.<id>.clips), or one video or picture (step.<id>.video, such as a card).",
        type: 'object',
        minProperties: 1,
        maxProperties: 12,
        additionalProperties: {
          anyOf: [{ type: 'array', maxItems: 60, items: assembleSourceItem }, file('video'), file('image')],
        },
      },
      shots: {
        description:
          "A recipe per scene tag (\"*\" catches the rest): the shots that fill each scene's span, in order. The shot with fill (else the last) takes what the others' seconds leave; when they leave it under 0.5 s (snap.min_shot_s), they are squeezed. Needs scenes and spans. A scene whose tag has no recipe is refused.",
        type: 'object',
        minProperties: 1,
        maxProperties: 16,
        additionalProperties: { type: 'array', minItems: 1, maxItems: 6, items: assembleShot },
      },
      snap: {
        description: 'Moves a cut that lands inside a word (speech words) to the frame before the word starts or after it ends, whichever is nearer, when that is at most max_shift_s (default 0.4) away and both shots keep min_shot_s (default 0.55).',
        type: 'object',
        additionalProperties: false,
        properties: { max_shift_s: { type: 'number', minimum: 0, maximum: 1 }, min_shot_s: { type: 'number', minimum: 0.1, maximum: 3 } },
      },
      card_from: {
        description:
          "Starts the card span (timeline.end_card, where captions never run) at a scene before the end card: the first scene with this tag (needs scenes; no such scene leaves the card span as it is), or the scene with this id. The card span runs to the end and is never graded.",
        anyOf: [
          { type: 'object', additionalProperties: false, required: ['tag'], properties: { tag: { type: 'string', minLength: 1, maxLength: 40 } } },
          { type: 'object', additionalProperties: false, required: ['scene_id'], properties: { scene_id: { type: 'string', minLength: 1, maxLength: 64 } } },
        ],
      },
      grade: {
        description: "A finish on every body cut (never the end card or the card_from span). phone-grain: slight contrast, less colour, fine moving grain. phonecam: a 720p phone softness with grain. Grain looks cap the encode at 8 Mbps.",
        enum: ['none', 'phone-grain', 'phonecam'],
      },
    },
  },
  outputs: {
    type: 'object',
    additionalProperties: false,
    required: ['video', 'seconds', 'timeline'],
    properties: {
      video: file('video'),
      seconds: { type: 'number', exclusiveMinimum: 0 },
      timeline: timelineWithKeepClear,
      marks: {
        description: "Where a shot with a mark starts (audio-mix plays the mark's sound there). Empty when no shot has one.",
        type: 'array',
        items: {
          type: 'object',
          additionalProperties: false,
          required: ['kind', 'at_s'],
          properties: { kind: { type: 'string', minLength: 1, maxLength: 40 }, at_s: { type: 'number', minimum: 0 } },
        },
      },
    },
  },
  cost: { basis: 'free' },
  determinism: 'pure',
  timing: { typical_s: 30, timeout_s: 1200 },
  retry: { transient: 1 },
  replaces: ['stitch-videos-ffmpeg'],
};

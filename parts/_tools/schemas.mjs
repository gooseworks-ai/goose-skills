// Shared JSON Schema fragments for part manifests: the FileRef, the Timeline,
// the brand kit and the output expectation (parts/_contract/part-interface.d.ts),
// and the fixed layer inputs and outputs every layer part takes and returns.
// Used to write and check part.json files; parts never import this.

export const file = (media, mime) => ({ type: 'object', 'x-kit-file': mime ? { media, mime } : { media } });

const span = {
  type: 'object',
  additionalProperties: false,
  required: ['start_s', 'end_s'],
  properties: { start_s: { type: 'number', minimum: 0 }, end_s: { type: 'number', minimum: 0 } },
};

export const word = {
  type: 'object',
  additionalProperties: false,
  required: ['text', 'start_s', 'end_s'],
  properties: { text: { type: 'string' }, start_s: { type: 'number', minimum: 0 }, end_s: { type: 'number', minimum: 0 } },
};

export const speechEntry = {
  type: 'object',
  additionalProperties: false,
  required: ['text', 'start_s', 'end_s'],
  properties: {
    scene_id: { type: 'string' },
    text: { type: 'string' },
    spoken: { type: 'string' },
    start_s: { type: 'number', minimum: 0 },
    end_s: { type: 'number', minimum: 0 },
    words: { type: 'array', items: word },
  },
};

export const sceneSpan = {
  type: 'object',
  additionalProperties: false,
  required: ['id', 'start_s', 'end_s'],
  properties: { id: { type: 'string' }, start_s: { type: 'number', minimum: 0 }, end_s: { type: 'number', minimum: 0 } },
};

export const timeline = {
  type: 'object',
  additionalProperties: false,
  required: ['duration_s', 'width', 'height', 'fps', 'scenes', 'speech'],
  properties: {
    duration_s: { type: 'number', exclusiveMinimum: 0 },
    width: { type: 'integer', minimum: 1 },
    height: { type: 'integer', minimum: 1 },
    fps: { type: 'number', exclusiveMinimum: 0 },
    scenes: { type: 'array', items: sceneSpan },
    speech: { type: 'array', items: speechEntry },
    end_card: span,
    safe_zones: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['use', 'x', 'y', 'w', 'h'],
        properties: {
          use: { enum: ['captions', 'logo'] },
          x: { type: 'number' },
          y: { type: 'number' },
          w: { type: 'number', minimum: 0 },
          h: { type: 'number', minimum: 0 },
        },
      },
    },
  },
};

export const colors = {
  type: 'object',
  properties: {
    primary: { type: 'string', maxLength: 64 },
    secondary: { type: 'string', maxLength: 64 },
    background: { type: 'string', maxLength: 64 },
    text: { type: 'string', maxLength: 64 },
    palette: { type: 'array', maxItems: 12, items: { type: 'string', maxLength: 64 } },
  },
};

export const fonts = {
  type: 'object',
  properties: { heading: file('font'), body: file('font') },
};

export const pronunciations = {
  type: 'array',
  maxItems: 50,
  items: {
    type: 'object',
    required: ['term', 'say_as'],
    properties: { term: { type: 'string', minLength: 1, maxLength: 100 }, say_as: { type: 'string', minLength: 1, maxLength: 200 } },
  },
};

export const cta = {
  type: 'object',
  required: ['text'],
  properties: { text: { type: 'string', minLength: 1, maxLength: 80 }, url: { type: 'string', maxLength: 200 } },
};

export const brand = {
  type: 'object',
  required: ['name', 'colors', 'fonts', 'pronunciations'],
  properties: {
    name: { type: 'string', minLength: 1, maxLength: 120 },
    logo: file('image'),
    colors,
    fonts,
    pronunciations,
    cta,
  },
};

export const expect = {
  type: 'object',
  required: ['aspect', 'width', 'height', 'duration_s', 'speech', 'captions', 'end_card', 'qc_flags'],
  properties: {
    aspect: { enum: ['9:16', '1:1', '4:5', '16:9'] },
    width: { type: 'integer', minimum: 1 },
    height: { type: 'integer', minimum: 1 },
    duration_s: {
      type: 'object',
      required: ['min', 'max'],
      properties: { min: { type: 'number', minimum: 0 }, max: { type: 'number', exclusiveMinimum: 0 } },
    },
    speech: { enum: ['none', 'voiceover', 'on_camera'] },
    captions: { type: 'boolean' },
    end_card: { type: 'boolean' },
    qc_flags: { type: 'array', items: { type: 'string', maxLength: 60 } },
    script: { type: 'array', items: { type: 'string', maxLength: 2000 } },
  },
};

/** What the core passes to every layer part (LayerInputs). */
export const layerInputs = {
  type: 'object',
  additionalProperties: false,
  required: ['video', 'timeline', 'brand', 'expect'],
  properties: {
    video: file('video'),
    timeline,
    brand,
    expect,
    words: file('json'),
  },
};

/**
 * Areas captions must stay off, in pixels, while they show (Timeline.keep_clear): a product a step knows it
 * drew there. Only parts that read or pass it on accept it: brand-layer >= 1.0.2 passes it through and
 * captions-layer >= 1.4.0 reads it and drops it from its own output, so the later layers never see it.
 */
export const keepClear = {
  type: 'array',
  maxItems: 200,
  items: {
    type: 'object',
    additionalProperties: false,
    required: ['start_s', 'end_s', 'use', 'box'],
    properties: {
      scene_id: { type: 'string' },
      start_s: { type: 'number', minimum: 0 },
      end_s: { type: 'number', minimum: 0 },
      use: { enum: ['product'] },
      box: {
        type: 'object',
        additionalProperties: false,
        required: ['x', 'y', 'w', 'h'],
        properties: { x: { type: 'number' }, y: { type: 'number' }, w: { type: 'number', minimum: 0 }, h: { type: 'number', minimum: 0 } },
      },
    },
  },
};

/** The timeline with keep_clear, for the layers that take it. */
export const timelineWithKeepClear = { ...timeline, properties: { ...timeline.properties, keep_clear: keepClear } };

/** layerInputs whose timeline may carry keep_clear. */
export const layerInputsWithKeepClear = { ...layerInputs, properties: { ...layerInputs.properties, timeline: timelineWithKeepClear } };

/** What brand, captions and sound layers return (LayerOutputs). */
export const layerOutputs = (extra = {}, required = []) => ({
  type: 'object',
  additionalProperties: false,
  required: ['video', 'timeline', ...required],
  properties: { video: file('video'), timeline, ...extra },
});

/**
 * The source-linked edit (gooseworks-assembly-timeline/1) a layer may read and hand back on its timeline.
 * The kit passes it only to parts whose timeline schema declares it (check-layer >= 1.6.0, sound-layer
 * >= 1.1.0, captions-layer >= 1.5.0); the kit validates it, this schema only admits it.
 */
export const assemblyTimeline = { type: 'object', description: 'gooseworks-assembly-timeline/1: the source-linked edit. Validated by the kit; a layer reads it and returns it, updated when it adds cues.' };

/** The timeline with the linked assembly_timeline, for the layers that declare it. */
export const timelineWithAssembly = { ...timeline, properties: { ...timeline.properties, assembly_timeline: assemblyTimeline } };

/** The timeline with keep_clear and the linked assembly_timeline (captions-layer >= 1.5.0). */
export const timelineWithKeepClearAndAssembly = { ...timeline, properties: { ...timeline.properties, keep_clear: keepClear, assembly_timeline: assemblyTimeline } };

/** layerInputs whose timeline may carry the linked assembly_timeline. */
export const layerInputsWithAssembly = { ...layerInputs, properties: { ...layerInputs.properties, timeline: timelineWithAssembly } };

/** layerInputs whose timeline may carry keep_clear and the linked assembly_timeline (captions-layer >= 1.5.0). */
export const layerInputsWithKeepClearAndAssembly = { ...layerInputs, properties: { ...layerInputs.properties, timeline: timelineWithKeepClearAndAssembly } };

/** layerOutputs whose timeline may carry the linked assembly_timeline back. */
export const layerOutputsWithAssembly = (extra = {}, required = []) => ({
  ...layerOutputs(extra, required),
  properties: { video: file('video'), timeline: timelineWithAssembly, ...extra },
});

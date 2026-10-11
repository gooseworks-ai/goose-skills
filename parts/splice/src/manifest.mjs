import { file, timeline } from '../../_tools/schemas.mjs';

const footageEntry = {
  type: 'object',
  anyOf: [{ required: ['file'] }, { required: ['video'] }],
  properties: {
    file: file('video'),
    video: file('video'),
    asset_id: { type: 'string' },
    kind: { description: 'video (default), render or image. The body must be video or render; an image entry is refused.', enum: ['video', 'render', 'image', null] },
    start_ms: { description: 'Body: where the old opening ends (the cut). Hook clip: where its window starts. Default 0.', type: ['integer', 'null'], minimum: 0 },
    end_ms: { description: 'Body: null or at or past its last frame (the body always runs to the end). Hook clip: where its window ends. Default: the end of the clip.', type: ['integer', 'null'], minimum: 1 },
    audio: { description: "Hook clip: false lays silence under it; otherwise its own sound is kept. Ignored for the body, whose sound is always kept.", type: ['boolean', 'null'] },
  },
};

export const manifest = {
  $schema: '../../_contract/part-manifest.schema.json',
  interface: 1,
  id: 'splice',
  version: '1.0.0',
  kind: 'compose',
  title: 'Splice a new opening onto a kept body',
  summary: 'Puts a new opening in front of a finished ad and keeps everything after the cut frame for frame: the body is stream-copied when it can be, and every kept frame and the kept sound are checked against the original.',
  runtime: 'node',
  entry: 'part.mjs',
  files: ['README.md', 'part.mjs'],
  kit: '>=1.0.0 <2.0.0',
  needs: {
    browser: false,
    ffmpeg: {
      filters: ['fps', 'scale', 'pad', 'setsar', 'setparams', 'format', 'tpad', 'trim', 'setpts', 'concat', 'psnr', 'aresample', 'aformat', 'asetpts', 'apad', 'atrim', 'anullsrc'],
      encoders: ['libx264', 'aac'],
    },
    network: false,
    models: [],
    disk_mb: 1500,
  },
  inputs: {
    type: 'object',
    additionalProperties: false,
    required: ['footage'],
    properties: {
      hook: { description: 'The new opening (for example an html-frames card). Optional when footage[0] is the hook clip; never both.', ...file('video') },
      hook_timeline: { description: "The opening's own timeline. Only its speech is used: copied into the output timeline (it lies inside the opening).", ...timeline },
      footage: {
        description: 'plan.footage. The LAST entry is the body: the finished ad (kind render or video), kept from start_ms (the cut) to its end. With no hook input, a first entry is the hook clip, cut to its window. At most two entries.',
        type: 'array',
        minItems: 1,
        maxItems: 20,
        items: footageEntry,
      },
      body_timeline: { description: "The source ad's own timeline, when known (a style-made render). Its end_card is shifted into the output timeline.", ...timeline },
      match: { description: "body (the only mode): the opening is converted to the body's size, frame rate, pixel format, sample rate and channel layout, fitted inside the frame with black bars.", const: 'body' },
      keep: {
        description:
          "body (the only mode): the body's picture is stream-copied when it is H.264 yuv420p and the cut lands on a keyframe; otherwise the whole cut is re-encoded at CRF 12 or lower under the 16 Mbit/s cap. The body's sound is re-encoded (AAC 256k) at its own sample rate and layout and checked.",
        const: 'body',
      },
      checks: {
        type: 'object',
        additionalProperties: false,
        properties: {
          psnr_min: { description: 'Lowest allowed PSNR of any kept frame, in dB. Default 45.', type: 'number', minimum: 30, maximum: 100 },
          audio_nrmse_max: { description: 'Highest allowed normalised RMS error of the kept sound. Default 0.08.', type: 'number', minimum: 0, maximum: 0.5 },
          audio_corr_min: { description: 'Lowest allowed correlation of the kept sound. Default 0.99.', type: 'number', minimum: 0.5, maximum: 1 },
        },
      },
      max_mb: { description: 'Refuse an output projected or measured over this many MB (10^6 bytes). Default and highest 180.', type: 'number', exclusiveMinimum: 0, maximum: 180 },
    },
  },
  outputs: {
    type: 'object',
    additionalProperties: false,
    required: ['video', 'seconds', 'timeline', 'retained'],
    properties: {
      video: file('video'),
      seconds: { type: 'number', exclusiveMinimum: 0 },
      timeline,
      retained: {
        description: 'Where the kept body sits in the output, and how closely it matches the original.',
        type: 'object',
        additionalProperties: false,
        required: ['start_s', 'end_s', 'cut_s', 'frames', 'exact_frames', 'psnr_min', 'audio_nrmse', 'audio_corr', 'copied', 'source_sha256'],
        properties: {
          start_s: { type: 'number', minimum: 0 },
          end_s: { type: 'number', exclusiveMinimum: 0 },
          cut_s: { description: "The source time of the first kept frame (the cut snapped to the frame at or after start_ms).", type: 'number', minimum: 0 },
          frames: { description: 'Kept frames, compared one by one in order.', type: 'integer', minimum: 1 },
          exact_frames: { description: 'Kept frames that decode bit-identical to the original.', type: 'integer', minimum: 0 },
          psnr_min: { description: 'The lowest per-frame PSNR in dB; identical frames count as 100.', type: 'number', minimum: 0 },
          audio_nrmse: { description: 'Null when the source has no sound (the kept span is then checked for silence).', type: ['number', 'null'], minimum: 0 },
          audio_corr: { type: ['number', 'null'] },
          copied: { description: "True when the body's picture was stream-copied, not re-encoded.", type: 'boolean' },
          source_sha256: { type: 'string', pattern: '^[0-9a-f]{64}$' },
        },
      },
    },
  },
  cost: { basis: 'free' },
  determinism: 'pure',
  timing: { typical_s: 30, timeout_s: 1200 },
  retry: { transient: 1 },
  replaces: ['render-hook-replacement'],
};

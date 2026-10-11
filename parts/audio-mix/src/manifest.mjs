import { file } from '../../_tools/schemas.mjs';

export const manifest = {
  $schema: '../../_contract/part-manifest.schema.json',
  interface: 1,
  id: 'audio-mix',
  version: '1.1.0',
  kind: 'mix',
  title: 'Audio mix',
  summary: 'Lays voice, a ducked music bed, timed sound effects, sounds at the cut\'s marks and a room tone under the picture in one pass, balanced and peak-limited.',
  runtime: 'node',
  entry: 'part.mjs',
  files: ['README.md', 'part.mjs'],
  kit: '>=1.0.0 <2.0.0',
  needs: {
    browser: false,
    ffmpeg: { filters: ['ebur128', 'sidechaincompress', 'amix', 'alimiter', 'adelay', 'afade', 'apad', 'atrim', 'aresample', 'aformat', 'asplit', 'anoisesrc', 'highpass', 'lowpass', 'equalizer', 'acompressor', 'tremolo'], encoders: ['aac'] },
    network: false,
    models: [],
    disk_mb: 200,
  },
  inputs: {
    type: 'object',
    additionalProperties: false,
    required: ['video'],
    properties: {
      video: file('video'),
      voice: file('audio'),
      voice_start_s: { type: 'number', minimum: 0, maximum: 300 },
      voice_lufs: { description: 'Voice level before mixing. Default -16 LUFS.', type: 'number', minimum: -30, maximum: -8 },
      music: file('audio'),
      music_start_s: { type: 'number', minimum: 0, maximum: 300 },
      music_lufs: { description: 'Bed level between voice lines, before ducking. Default -24 LUFS.', type: 'number', minimum: -40, maximum: -8 },
      music_fade_in_s: { type: 'number', minimum: 0, maximum: 10 },
      fade_out_seconds: { description: "Fade at the bed's tail. Default 1 s.", type: 'number', minimum: 0, maximum: 10 },
      duck: {
        description: "The bed ducks under the voice, or with no voice under the picture's own sound. Default: on when there is a voice. true for the default ducking, false for none, or the settings.",
        anyOf: [
          { type: 'boolean' },
          {
            type: 'object',
            additionalProperties: false,
            properties: {
              threshold: { type: 'number', exclusiveMinimum: 0, maximum: 1 },
              ratio: { type: 'number', minimum: 1, maximum: 20 },
              attack_ms: { type: 'number', minimum: 0.01, maximum: 2000 },
              release_ms: { type: 'number', minimum: 0.01, maximum: 9000 },
            },
          },
        ],
      },
      sfx: {
        description: 'Sound effects placed on the timeline. gain is linear (default 1); max_s cuts a cue so it cannot mask the next.',
        type: 'array',
        maxItems: 200,
        items: {
          type: 'object',
          additionalProperties: false,
          required: ['audio', 'at_s'],
          properties: {
            audio: file('audio'),
            at_s: { type: 'number', minimum: 0, maximum: 300 },
            gain: { type: 'number', minimum: 0, maximum: 4 },
            max_s: { type: 'number', exclusiveMinimum: 0, maximum: 60 },
          },
        },
      },
      effects: { description: "A whole effects track laid from 0, not ducked (for example phone-chat's sfx).", ...file('audio') },
      effects_gain: { description: 'Linear gain of the effects track. Default 1.', type: 'number', minimum: 0, maximum: 4 },
      keep_video_audio: { description: "Keep the picture's own sound (never ducked). Default: kept when the picture has sound.", type: 'boolean' },
      video_audio_db: { type: 'number', minimum: -40, maximum: 20 },
      room_tone: {
        description:
          'A synthesized noise bed under the whole video (end card included), at an absolute level laid after the voice is levelled. Brown noise, 90-2600 Hz at -27 dB sits near -46 LUFS: a quiet room.',
        type: 'object',
        additionalProperties: false,
        required: ['gain_db'],
        properties: {
          color: { description: 'Default brown.', enum: ['brown', 'pink'] },
          gain_db: { description: 'Level of the band-limited noise, in dB from full scale.', type: 'number', minimum: -60, maximum: -12 },
          highpass_hz: { description: 'Default 90 Hz.', type: 'number', minimum: 20, maximum: 2000 },
          lowpass_hz: { description: 'Default 2600 Hz.', type: 'number', minimum: 200, maximum: 16000 },
        },
      },
      marks: {
        description:
          "Moments the cut marked (an edit step's marks output, bound whole). Each mark whose kind names a mark_sounds id plays that sound at at_s + mark_offset_s; other kinds are ignored, and a mark past the end is dropped.",
        type: 'array',
        maxItems: 200,
        items: {
          type: 'object',
          required: ['kind', 'at_s'],
          properties: {
            kind: { type: 'string', minLength: 1, maxLength: 40 },
            at_s: { type: 'number', minimum: 0, maximum: 300 },
          },
        },
      },
      mark_sounds: {
        description: "The sound for each mark kind, matched by id (a sound step's effects output, bound whole, e.g. sfx-elevenlabs effects).",
        type: 'array',
        maxItems: 20,
        items: {
          type: 'object',
          required: ['id', 'audio'],
          properties: {
            id: { type: 'string', minLength: 1, maxLength: 40 },
            audio: file('audio'),
          },
        },
      },
      mark_offset_s: { description: 'Shift from each mark to its sound. Default 0. A sound pulled before 0 plays from that point into it; one that would end before 0 is dropped.', type: 'number', minimum: -2, maximum: 2 },
      mark_gain: { description: 'Linear gain of every mark sound. Default 1.', type: 'number', minimum: 0, maximum: 4 },
      mark_max_s: { description: 'Cuts each mark sound (with a 60 ms fade) so it cannot mask the next.', type: 'number', exclusiveMinimum: 0, maximum: 10 },
      outdoor: {
        description:
          "Outdoor mic realism: the speech (the voice, or with no voice the picture's own sound) gets a 110 Hz-7.4 kHz band, a presence lift and a 3:1 compressor, and a slowly moving street ambience goes under it (room_tone's settings when given, else brown noise below 1500 Hz at -27 dB).",
        type: 'boolean',
      },
    },
  },
  outputs: {
    type: 'object',
    additionalProperties: false,
    required: ['video', 'seconds'],
    properties: { video: file('video'), seconds: { type: 'number', exclusiveMinimum: 0 } },
  },
  cost: { basis: 'free' },
  determinism: 'pure',
  timing: { typical_s: 10, timeout_s: 600 },
  retry: { transient: 1 },
  replaces: ['mix-master'],
};

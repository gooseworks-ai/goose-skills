import { expect, layerInputsWithAssembly } from '../../_tools/schemas.mjs';

const fix = {
  type: 'object',
  additionalProperties: false,
  properties: { slot: { enum: ['brand', 'captions', 'sound', 'check'] }, step: { type: 'string' }, inputs: { type: 'object' } },
};

export const manifest = {
  $schema: '../../_contract/part-manifest.schema.json',
  interface: 1,
  id: 'check-layer',
  version: '1.6.0',
  kind: 'check',
  layer: 'check',
  title: 'Check layer',
  summary: "Checks the finished cut without changing it: the server's five checks, the final measurements (silence, tones, frozen picture, repeated shots), the end card, the logo, speech against the script and style flags.",
  runtime: 'node',
  entry: 'part.mjs',
  files: ['README.md', 'part.mjs'],
  kit: '>=1.0.0 <2.0.0',
  needs: { browser: false, ffmpeg: { filters: ['ebur128', 'freezedetect', 'blackdetect', 'scale', 'format', 'fps', 'crop', 'aresample'], encoders: ['pcm_s16le', 'pcm_f32le', 'rawvideo'] }, network: false, models: [], disk_mb: 100 },
  inputs: {
    ...layerInputsWithAssembly,
    properties: {
      ...layerInputsWithAssembly.properties,
      expect: {
        ...expect,
        properties: {
          ...expect.properties,
          final_measure: { enum: ['block', 'warn'], description: 'The final measurements fail (block) or warn. Default: block when the timeline links an assembly_timeline (a custom, source-linked edit), warn otherwise (template videos, for one release).' },
          reference_frozen_share: { type: 'number', minimum: 0, maximum: 1, description: "The reference's measured frozen share, when known: still-image share is then allowed up to max(40 %, it + 15 points)." },
        },
      },
    },
  },
  outputs: {
    type: 'object',
    additionalProperties: false,
    required: ['verdict'],
    properties: {
      final_measure: {
        type: 'object',
        description: 'gooseworks-final-measure/1: what the server stores as quality_report.final_measure, measured here first. The server re-measures the uploaded bytes and is the authority.',
        required: ['format', 'output_sha256', 'measured_duration_ms', 'checks', 'thresholds'],
        properties: {
          format: { const: 'gooseworks-final-measure/1' },
          output_sha256: { type: 'string' },
          measured_duration_ms: { type: 'integer', minimum: 0 },
          checks: { type: 'array', items: { type: 'object', required: ['id', 'result', 'detail', 'intervals_ms'], properties: { id: { type: 'string' }, result: { enum: ['pass', 'fail', 'not_applicable'] }, detail: { type: 'string' }, intervals_ms: { type: 'array', items: { type: 'array', items: { type: 'integer' } } } } } },
          thresholds: { type: 'object' },
        },
      },
      verdict: {
        type: 'object',
        additionalProperties: false,
        required: ['pass', 'checks', 'reasons'],
        properties: {
          pass: { type: 'boolean' },
          checks: {
            type: 'array',
            items: {
              type: 'object',
              additionalProperties: false,
              required: ['code', 'status'],
              properties: {
                code: { type: 'string', pattern: '^(plays|length|size|sound|captions|black_frames|frozen_frames|captions_safe_zone|speech_matches_script|end_card|logo|logo_resolution|digital_silence|tone_only|unplanned_silence|planned_pause_too_long|frozen_picture|planned_freeze_too_long|repeated_shot|flag:[\\s\\S]*)$', description: 'flag:<name> for each style qc_flag, any name the input allows (a flag this version does not know is reported not_applicable).' },
                status: {
                  description: 'warn: measured, but not counted against the video: a taste check outside its range (length, still or held pictures, motion, pacing, shots, cuts, room tone, a sparse text-led cut, loudness the sound layer did not level, a caption across the join into a retained body), a small logo file, or a logo looked for on the whole frame with no box declared for it and no brand layer to fix it. What could not be measured, is broken or missing, or breaks an earlier part\'s promise (loudness off on a levelled cut, a caption across a scene cut or into the end card) fails.',
                  enum: ['pass', 'fail', 'warn', 'not_applicable'],
                },
                message: { description: 'Plain words for a failed or warned check, with no file paths or step names.', type: 'string' },
                found: { type: ['string', 'number', 'boolean', 'null'] },
                expected: { type: 'string' },
                fix,
              },
            },
          },
          reasons: {
            description: "Failed checks in the server's reasons shape ({check, message, expected?, found?}). Messages are for logs; the customer's words come from the rulebook.",
            type: 'array',
            items: {
              type: 'object',
              additionalProperties: false,
              required: ['check', 'message'],
              properties: { check: { type: 'string' }, message: { type: 'string' }, expected: { type: 'string' }, found: { type: 'string' } },
            },
          },
        },
      },
    },
  },
  cost: { basis: 'free' },
  determinism: 'pure',
  timing: { typical_s: 20, timeout_s: 900 },
  retry: { transient: 1 },
  replaces: ['review-finished-ad', 'review-ugc-render'],
};

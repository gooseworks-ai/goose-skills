import { layerInputs } from '../../_tools/schemas.mjs';

const fix = {
  type: 'object',
  additionalProperties: false,
  properties: { slot: { enum: ['brand', 'captions', 'sound', 'check'] }, step: { type: 'string' }, inputs: { type: 'object' } },
};

export const manifest = {
  $schema: '../../_contract/part-manifest.schema.json',
  interface: 1,
  id: 'check-layer',
  version: '1.1.2',
  kind: 'check',
  layer: 'check',
  title: 'Check layer',
  summary: "Checks the finished cut without changing it: the server's five checks with its limits, then black and frozen frames, the end card and speech against the script.",
  runtime: 'node',
  entry: 'part.mjs',
  files: ['README.md', 'part.mjs'],
  kit: '>=1.0.0 <2.0.0',
  needs: { browser: false, ffmpeg: { filters: ['ebur128', 'freezedetect', 'blackdetect', 'scale', 'format'], encoders: ['pcm_s16le'] }, network: false, models: [], disk_mb: 100 },
  inputs: layerInputs,
  outputs: {
    type: 'object',
    additionalProperties: false,
    required: ['verdict'],
    properties: {
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
                code: { type: 'string', pattern: '^(plays|length|size|sound|captions|black_frames|frozen_frames|captions_safe_zone|speech_matches_script|end_card|logo|flag:[a-z0-9_]+)$' },
                status: { enum: ['pass', 'fail', 'not_applicable'] },
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

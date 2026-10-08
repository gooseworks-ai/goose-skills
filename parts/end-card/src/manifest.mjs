import { brand, file, timeline } from '../../_tools/schemas.mjs';
import { cardInputs } from '../../_tools/card-schema.mjs';

export const manifest = {
  $schema: '../../_contract/part-manifest.schema.json',
  interface: 1,
  id: 'end-card',
  version: '1.0.1',
  kind: 'end_card',
  title: 'Brand end card',
  summary: "Draws the brand end card (logo as-is, brand colours and fonts, proof, benefits, call to action) as a clip of the style's size.",
  runtime: 'node',
  entry: 'part.mjs',
  files: ['README.md', 'assets/fonts/Montserrat-Bold.ttf', 'part.mjs'],
  kit: '>=1.0.0 <2.0.0',
  needs: { browser: true, ffmpeg: { filters: ['scale', 'setsar', 'format', 'anullsrc'], encoders: ['libx264', 'aac'] }, network: false, models: [], disk_mb: 50 },
  inputs: {
    type: 'object',
    additionalProperties: false,
    required: ['brand', 'width', 'height'],
    properties: {
      brand,
      width: { type: 'integer', minimum: 320, maximum: 4096 },
      height: { type: 'integer', minimum: 320, maximum: 4096 },
      fps: { description: 'Default 30.', type: 'integer', minimum: 10, maximum: 60 },
      seconds: { description: 'How long the card holds. Default 2.5.', type: 'number', minimum: 0.5, maximum: 10 },
      ...cardInputs,
    },
  },
  outputs: {
    type: 'object',
    additionalProperties: false,
    required: ['video', 'seconds', 'timeline'],
    properties: { video: file('video'), seconds: { type: 'number', exclusiveMinimum: 0 }, timeline },
  },
  cost: { basis: 'free' },
  determinism: 'pure',
  timing: { typical_s: 8, timeout_s: 180 },
  retry: { transient: 1 },
  replaces: [],
};

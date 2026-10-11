import { brand, file, timeline } from '../../_tools/schemas.mjs';
import { cardInputs } from '../../_tools/card-schema.mjs';

// 1.1.0 adds layouts. cardInputs is shared, so its changes for this part are made here.
const hex = { type: 'string', pattern: '^#[0-9A-Fa-f]{6}$' };

export const manifest = {
  $schema: '../../_contract/part-manifest.schema.json',
  interface: 1,
  id: 'end-card',
  version: '1.1.0',
  kind: 'end_card',
  title: 'Brand end card',
  summary: "Draws the brand end card (logo as-is, brand colours and fonts) in one of five layouts as a clip of the style's size, or nothing with layout none.",
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
      layout: {
        description:
          'classic (default, the 1.0.1 card): logo, proof, benefits, CTA pill, URL. brandkit: logo, wordmark, rule, tagline (headline), rows, CTA pill, URL. editorial: type only, left aligned, no logo, CTA optional. stack: logo over URL. statement: logo over 1 to 3 rows, CTA optional, no URL unless url_text is given. none: no card, and no outputs.',
        enum: ['classic', 'brandkit', 'editorial', 'stack', 'statement', 'none'],
      },
      cta_text: { ...cardInputs.cta_text, description: "Approved call to action. Default: the brand's (classic and brandkit need one). editorial and statement show it only when given." },
      rows: {
        description: "1 to 3 approved lines (brandkit, editorial, statement), as a list or one ' | '-joined text answer. Each up to 60 characters.",
        type: ['array', 'string'],
        maxItems: 3,
        maxLength: 200,
        items: { type: 'string', maxLength: 60 },
      },
      accent: { description: 'Rule, editorial CTA and statement rows after the first. Default: the brand primary (else secondary) when it reads on the card, else the text colour.', ...hex },
    },
  },
  outputs: {
    description: 'Nothing with layout none; otherwise all three.',
    required: [],
    type: 'object',
    additionalProperties: false,
    properties: { video: file('video'), seconds: { type: 'number', exclusiveMinimum: 0 }, timeline },
  },
  cost: { basis: 'free' },
  determinism: 'pure',
  timing: { typical_s: 8, timeout_s: 180 },
  retry: { transient: 1 },
  replaces: [],
};

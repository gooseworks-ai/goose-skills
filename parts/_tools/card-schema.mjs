// The end card's style choices, shared by the end-card part's manifest.
import { file } from './schemas.mjs';
import { KIT_CARD_ICON_NAMES } from '../_lib/end-card.mjs';

const hex = { type: 'string', pattern: '^#[0-9A-Fa-f]{6}$' };

export const cardInputs = {
  background: { description: 'Card background. Default: brand background, else white.', ...hex },
  foreground: { description: 'Text colour. Default: brand text colour, else black or white for contrast.', ...hex },
  cta_background: { description: 'Call-to-action pill. Default: brand primary colour.', ...hex },
  cta_text: { description: "Approved call to action. Default: the brand's.", type: 'string', minLength: 1, maxLength: 60 },
  url_text: { description: "Default: the brand's URL; empty hides it.", type: 'string', maxLength: 80 },
  headline: { description: 'Approved headline above the proof row.', type: 'string', maxLength: 80 },
  proof: {
    description: 'Stars need approved proof text; 0 stars hides the row.',
    type: 'object',
    additionalProperties: false,
    required: ['stars', 'text'],
    properties: { stars: { type: 'integer', minimum: 0, maximum: 5 }, text: { type: 'string', maxLength: 80 } },
  },
  benefits: {
    type: 'array',
    maxItems: 3,
    items: {
      type: 'object',
      additionalProperties: false,
      required: ['label'],
      properties: { label: { type: 'string', minLength: 1, maxLength: 40 }, icon: { enum: KIT_CARD_ICON_NAMES } },
    },
  },
  footnote: { description: 'Legal line, kept inside the feed-crop safe zone.', type: 'string', maxLength: 200 },
  image: { description: 'Approved complete end-card artwork; replaces the drawn card.', ...file('image', ['image/png', 'image/jpeg', 'image/webp']) },
};

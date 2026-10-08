// end-card: the brand end card as a clip, for styles that draw the card in
// their own timeline (so the music can run under it). The same renderer sits
// inside the brand layer, which appends the card when no step drew one.
import { kitCheckInputs, kitCheckOutputs } from '../../_lib/part.mjs';
import { kitRenderEndCard } from '../../_lib/end-card.mjs';

export async function run(inputs, ctx) {
  const manifest = await kitCheckInputs(ctx, inputs);
  const { width, height } = inputs;
  const fps = inputs.fps ?? 30;
  const seconds = inputs.seconds ?? 2.5;
  if (width % 2 || height % 2) throw ctx.error('bad_input', 'width and height must be even');
  const card = {
    background: inputs.background,
    foreground: inputs.foreground,
    cta_background: inputs.cta_background,
    cta_text: inputs.cta_text,
    url_text: inputs.url_text,
    headline: inputs.headline,
    proof: inputs.proof,
    benefits: inputs.benefits,
    footnote: inputs.footnote,
    image: inputs.image,
  };
  const video = await kitRenderEndCard(ctx, { brand: inputs.brand, card, width, height, fps, seconds });
  ctx.progress({ done: 1, total: 1 });
  const timeline = { duration_s: seconds, width, height, fps, scenes: [{ id: 'end-card', start_s: 0, end_s: seconds }], speech: [], end_card: { start_s: 0, end_s: seconds } };
  return kitCheckOutputs(ctx, manifest, { video, seconds, timeline });
}

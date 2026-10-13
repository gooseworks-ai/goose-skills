// end-card: the brand end card as a clip, for styles that draw the card in
// their own timeline (so the music can run under it). The same renderer sits
// inside the brand layer, which appends the card when no step drew one.
// 1.1.1: the logo is fitted to the card (_lib/end-card.mjs kitCardFitLogo) in
// every layout that draws it, and its box goes on the timeline as safe_zones logo.
import { kitCheckInputs, kitCheckOutputs } from '../../_lib/part.mjs';
import { kitRenderEndCard } from '../../_lib/end-card.mjs';
import { cardRenderLayout, cardSafeBrand, cardSafeFile } from './layouts.mjs';

export async function run(inputs, ctx) {
  const manifest = await kitCheckInputs(ctx, inputs);
  const { width, height } = inputs;
  const fps = inputs.fps ?? 30;
  const seconds = inputs.seconds ?? 2.5;
  if (width % 2 || height % 2) throw ctx.error('bad_input', 'width and height must be even');
  const layout = inputs.layout ?? 'classic';
  // layout none (a style's "no card" answer): no card and no outputs, so the
  // kit leaves out every step input bound to them (the skip-blank pattern).
  if (layout === 'none') {
    ctx.log.info('layout none: no end card');
    ctx.progress({ done: 1, total: 1 });
    return kitCheckOutputs(ctx, manifest, {});
  }
  if (layout === 'classic') {
    const extra = ['rows', 'accent'].filter((k) => inputs[k] !== undefined);
    if (extra.length) throw ctx.error('bad_input', `layout classic does not draw ${extra.join(', ')}`);
  }
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
    image: cardSafeFile(inputs.image),
    rows: inputs.rows,
    accent: inputs.accent,
  };
  // File MIME types reach the page inside data: URIs; keep them to a plain type/subtype for every layout.
  const brand = cardSafeBrand(inputs.brand);
  const drawn =
    layout === 'classic'
      ? await kitRenderEndCard(ctx, { brand, card, width, height, fps, seconds })
      : await cardRenderLayout(ctx, { layout, brand, card, width, height, fps, seconds });
  const video = drawn.video;
  ctx.progress({ done: 1, total: 1 });
  const timeline = { duration_s: seconds, width, height, fps, scenes: [{ id: 'end-card', start_s: 0, end_s: seconds }], speech: [], end_card: { start_s: 0, end_s: seconds } };
  // Where the logo is, so the final check looks for it there (assemble carries it onto the cut).
  if (drawn.logo) timeline.safe_zones = [drawn.logo];
  return kitCheckOutputs(ctx, manifest, { video, seconds, timeline });
}

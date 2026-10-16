// Standard or Best, the price the customer picks at script approval (custom videos, 16 Oct 2026).
// The tier sets a paid part's default picture quality or resolution. An explicit quality or
// resolution input still wins, for the whole step. Without a tier the part uses Standard, the
// default price. No video above 768P unless the customer asks.
//
//   standard: GPT Image 2 medium, Fabric lip-sync 480p, H3 768P.
//   best:     GPT Image 2 high,   Fabric lip-sync 720p, H3 768P.
//
// H3 is 768P in both tiers: fal makes H3 "1080P" from a native 768P take plus a refinement pass,
// and the finished video is scaled to 1080x1920 with ffmpeg (lanczos) at no cost.
export const KIT_TIERS = ['standard', 'best'];

const KIT_TIER_DEFAULTS = {
  standard: { image_quality: 'medium', lipsync_resolution: '480p', h3_resolution: '768P' },
  best: { image_quality: 'high', lipsync_resolution: '720p', h3_resolution: '768P' },
};

/** The tier's default for one setting: image_quality, lipsync_resolution or h3_resolution. */
export function kitTierDefault(inputs, setting) {
  const tier = KIT_TIER_DEFAULTS[inputs?.quality_tier ?? 'standard'];
  if (!tier) throw new Error(`quality_tier must be one of ${KIT_TIERS.join(', ')}`);
  if (!(setting in tier)) throw new Error(`no tier default for ${setting}`);
  return tier[setting];
}

// The size rule (critic #38): a finished video over 200 MB is refused on
// upload after everything was paid for, so splice projects its output's size
// before it encodes and measures it after, against a 180 MB ceiling.

export const SPLICE_MAX_MB = 180;
/** The final encode's bitrate cap (§4.12): -maxrate 16M -bufsize 32M. */
export const SPLICE_MAXRATE_BPS = 16e6;
export const SPLICE_AUDIO_BPS = 256e3;

/**
 * The projected output size in bytes. copy: the kept picture's own packet bytes plus the opening at
 * the cap. encode: the whole cut at the lower of the cap and three times the original's picture
 * rate (CRF 12 against a typical CRF 18 master), with at least 4 Mbit/s. Sound and 2 % container
 * overhead on top.
 */
export function spliceProjectedBytes({ mode, seconds, hook_s, kept_bytes, body_s }) {
  const audio = (seconds * SPLICE_AUDIO_BPS) / 8;
  let picture;
  if (mode === 'copy') picture = (hook_s * SPLICE_MAXRATE_BPS) / 8 + kept_bytes;
  else {
    const source_bps = body_s > 0 ? (kept_bytes * 8) / body_s : SPLICE_MAXRATE_BPS;
    picture = (seconds * Math.min(SPLICE_MAXRATE_BPS, Math.max(3 * source_bps, 4e6))) / 8;
  }
  return Math.ceil((picture + audio) * 1.02);
}

/** A plain refusal when `bytes` passes `max_mb`, else null. */
export function spliceSizeProblem(bytes, max_mb, { projected = false } = {}) {
  if (bytes <= max_mb * 1e6) return null;
  const mb = (bytes / 1e6).toFixed(1);
  return projected
    ? `the finished video would be about ${mb} MB, over the ${max_mb} MB limit; use a shorter original or a lower-bitrate copy of it`
    : `the finished video is ${mb} MB, over the ${max_mb} MB limit`;
}

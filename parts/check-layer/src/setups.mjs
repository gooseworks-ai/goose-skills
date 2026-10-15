// setup_count_vs_reference (check-layer 1.8.0): how many distinct setups the final cut has,
// against the reference's. A setup is a new person, room, framing or action from a separately
// made take; cuts inside one take, punch-ins and repeats are the same setup. A 15 Oct test video
// had 4 setups in 47.6 s against about 10 in the reference: two faces cut back and forth.
//
// Counted from shot keyframes, the way the harness's planned check counts them: each shot of the
// linked timeline (consecutive segments of one source merged, else the timeline's scenes) that
// lasts at least 0.5 s gives one keyframe at its middle; a flat frame (a black or one-colour card)
// is skipped. Each keyframe is a 64-bit dHash of a 9x8 gray frame (final-measure's fmDhash), and
// keyframes within 10 bits of each other join one setup (single linkage). The check fails when
// the final has more than 30 % fewer setups than expect.reference_setups, the reference's count
// made the same way; without it the check is not_applicable.
// Every top-level name starts with `chkSetup` (the bundle inlines this module beside the others).
import { kitGrayFrame } from '../../_lib/frames.mjs';
import { fmDhash, fmHamming, fmShots } from './final-measure.mjs';

export const CHK_SETUP_THRESHOLDS = { min_shot_s: 0.5, max_hamming: 10, flat_stddev: 4, max_shortfall: 0.3 };

/** The number of setups in a list of dHash bit strings: single-linkage clusters within `maxHamming` bits. */
export function chkSetupClusters(bits, maxHamming = CHK_SETUP_THRESHOLDS.max_hamming) {
  const parent = bits.map((_, i) => i);
  const root = (i) => {
    while (parent[i] !== i) {
      parent[i] = parent[parent[i]];
      i = parent[i];
    }
    return i;
  };
  for (let j = 0; j < bits.length; j++) {
    for (let i = 0; i < j; i++) {
      if (fmHamming(bits[i], bits[j]) <= maxHamming) parent[root(j)] = root(i);
    }
  }
  return new Set(bits.map((_, i) => root(i))).size;
}

/** The verdict for a final count against the reference's: {status, expected, found, message?}. */
export function chkSetupVerdict(finalSetups, referenceSetups, shots, th = CHK_SETUP_THRESHOLDS) {
  const floor = referenceSetups * (1 - th.max_shortfall);
  const expected = `at least ${Math.ceil(floor - 1e-9)} setups (no more than ${Math.round(th.max_shortfall * 100)} % below the reference's ${referenceSetups})`;
  const found = `${finalSetups} setups from ${shots} shots`;
  if (finalSetups + 1e-9 >= floor) return { status: 'pass', expected, found };
  return {
    status: 'fail',
    expected,
    found,
    message: `The video has ${finalSetups} distinct setups against the reference's ${referenceSetups}: it cuts between too few people, rooms or framings. Plan the shots from the reference's cut list and make new coverage; punch-ins and repeats of one take are not new setups.`,
  };
}

/** setup_count_vs_reference for the cut at `path` (duration `d`). */
export async function chkSetupCount(ctx, path, d, { assembly, timeline, expect }, th = CHK_SETUP_THRESHOLDS) {
  const reference = expect && Number.isInteger(expect.reference_setups) ? expect.reference_setups : null;
  if (reference === null) return { status: 'not_applicable', found: 'no reference setup count (expect.reference_setups)' };
  const shots = fmShots(assembly, timeline || {}).filter((s) => s.end_s - s.start_s >= th.min_shot_s);
  const bits = [];
  for (const shot of shots) {
    const frame = await kitGrayFrame(ctx, path, Math.min(d - 0.05, (shot.start_s + shot.end_s) / 2), 9, 8);
    const h = fmDhash(frame);
    if (h.sd >= th.flat_stddev) bits.push(h.bits);
  }
  if (!bits.length) return { status: 'not_applicable', found: 'no shot of at least 0.5 s with a picture to compare' };
  return chkSetupVerdict(chkSetupClusters(bits, th.max_hamming), reference, bits.length, th);
}

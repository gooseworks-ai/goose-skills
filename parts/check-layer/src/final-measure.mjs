// check-layer 1.6.0: the final measurements (gooseworks-final-measure/1, fix-forward
// contract section 1, with its 15 Oct amendments and calibration). The server runs
// the same checks on the uploaded bytes and is the authority; here they give the kit
// the same answer before upload. Measured from the file, never from a declaration:
//   digital_silence    whole-track peak under -60 dBFS, or exact-zero samples over 1.0 s
//   tone_only          over 80 % of the 80 Hz-8 kHz energy in 3 or fewer narrow peaks,
//                      holding for over half the video (sine "music", drones)
//   unplanned_silence  quieter than -45 dBFS (100 ms RMS) for over 1.0 s, no allowed pause
//   frozen_picture     a freezedetect run (noise 0.003) over 2.0 s mid-video that no planned
//                      freeze covers, or frozen time over max(40 %, reference + 15 points)
//   repeated_shot      two shots over 1 s, not next to each other, whose middle frames' 64-bit
//                      dHash differ by 6 bits or fewer, unless the later one's intent is callback:
//   planned_pause_too_long / planned_freeze_too_long  the linked timeline's own pauses and freezes
// Silence and frozen picture are allowed for 1.5 s at the start and 3.0 s at the end (the end
// card). An approved intentional_silence contract makes the two silence checks not_applicable.
// Every top-level name starts with `fm` (the bundle inlines this module beside the others).
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { kitFfmpeg } from '../../_lib/part.mjs';
import { kitGrayFrame } from '../../_lib/frames.mjs';

export const FM_FORMAT = 'gooseworks-final-measure/1';
export const FM_THRESHOLDS = {
  allowance_s: { start: 1.5, end: 3.0 },
  digital_silence: { peak_dbfs: -60, zero_run_s: 1.0 },
  tone_only: { fft_points: 4096, window_s: 0.5, band_hz: [80, 8000], max_peaks: 3, peak_half_width_bins: 2, energy_share: 0.8, steady_share: 0.5 },
  unplanned_silence: { rms_dbfs: -45, window_s: 0.1, run_s: 1.0 },
  planned_pause_too_long: { pause_s: 1.5, total_share: 0.1 },
  frozen_picture: { noise: 0.003, mid_run_s: 2.0, share: 0.4, share_over_reference: 0.15 },
  planned_freeze_too_long: { freeze_s: 1.5, end_freeze_s: 3.0 },
  repeated_shot: { min_shot_s: 1.0, max_hamming: 6, flat_stddev: 4 },
};
// 16 kHz mono: 8 kHz is the top of the tone band, and a minute is under 4 MB of samples.
const FM_RATE = 16000;
const FM_EDGE_S = 0.05;
const FM_COVER_S = 0.1;
const FM_NUM = '-?\\d+(?:\\.\\d+)?(?:e-?\\d+)?';

const fmDb = (x) => (x > 0 ? 20 * Math.log10(x) : -Infinity);
const fmRound = (x) => Math.round(x * 1000);

/** The cut's audio as 16 kHz mono floats, or null when it has no audio track. */
export async function fmSamples(ctx, video, hasAudio) {
  if (!hasAudio) return null;
  const path = join(ctx.tmpDir, 'final-measure.f32');
  await kitFfmpeg(ctx, ['-nostats', '-i', video, '-map', '0:a:0', '-ac', '1', '-ar', String(FM_RATE), '-c:a', 'pcm_f32le', '-f', 'f32le', path]);
  const buf = await readFile(path);
  return new Float32Array(new Uint8Array(buf).buffer, 0, Math.floor(buf.length / 4));
}

/** Runs of exactly zero samples at least `minS` long: [[start_s, end_s]]. */
export function fmZeroRuns(samples, rate, minS) {
  const out = [];
  let start = -1;
  for (let i = 0; i <= samples.length; i++) {
    const zero = i < samples.length && samples[i] === 0;
    if (zero && start < 0) start = i;
    if (!zero && start >= 0) {
      if ((i - start) / rate >= minS) out.push([start / rate, i / rate]);
      start = -1;
    }
  }
  return out;
}

/** Runs of `winS` windows whose RMS is under `dbfs`, at least `minS` long: [[start_s, end_s]]. */
export function fmQuietRuns(samples, rate, winS, dbfs, minS) {
  const step = Math.max(1, Math.round(winS * rate));
  const out = [];
  let start = -1;
  const windows = Math.ceil(samples.length / step);
  for (let w = 0; w <= windows; w++) {
    let quiet = false;
    if (w < windows) {
      let sum = 0;
      const from = w * step;
      const to = Math.min(samples.length, from + step);
      for (let i = from; i < to; i++) sum += samples[i] * samples[i];
      quiet = fmDb(Math.sqrt(sum / Math.max(1, to - from))) < dbfs;
    }
    if (quiet && start < 0) start = w;
    if (!quiet && start >= 0) {
      const s = (start * step) / rate;
      const e = Math.min(samples.length, w * step) / rate;
      if (e - s > minS) out.push([s, e]);
      start = -1;
    }
  }
  return out;
}

/**
 * Whether a measured span is allowed by its place: one touching the start may last the start allowance
 * (1.5 s), one touching the end the end allowance (3.0 s, the end card), any other `midMax`.
 */
export function fmAllowed([s, e], duration, midMax, allowance = FM_THRESHOLDS.allowance_s) {
  const len = e - s;
  const atStart = s <= FM_EDGE_S;
  const atEnd = e >= duration - FM_EDGE_S;
  if (atStart && len <= allowance.start) return true;
  if (atEnd && len <= allowance.end) return true;
  return !atStart && !atEnd && len <= midMax;
}

/** True when `[s, e]` lies inside one of `planned` ([[start_s, end_s]]), within 0.1 s. */
export function fmCovered([s, e], planned) {
  return planned.some(([ps, pe]) => s >= ps - FM_COVER_S && e <= pe + FM_COVER_S);
}

/** In-place iterative radix-2 FFT over re/im (length a power of two). */
function fmFft(re, im) {
  const n = re.length;
  for (let i = 1, j = 0; i < n; i++) {
    let bit = n >> 1;
    for (; j & bit; bit >>= 1) j ^= bit;
    j ^= bit;
    if (i < j) {
      [re[i], re[j]] = [re[j], re[i]];
      [im[i], im[j]] = [im[j], im[i]];
    }
  }
  for (let len = 2; len <= n; len <<= 1) {
    const ang = (-2 * Math.PI) / len;
    const wr = Math.cos(ang);
    const wi = Math.sin(ang);
    for (let i = 0; i < n; i += len) {
      let cr = 1;
      let ci = 0;
      for (let k = 0; k < len / 2; k++) {
        const a = i + k;
        const b = a + len / 2;
        const tr = re[b] * cr - im[b] * ci;
        const ti = re[b] * ci + im[b] * cr;
        re[b] = re[a] - tr;
        im[b] = im[a] - ti;
        re[a] += tr;
        im[a] += ti;
        const nr = cr * wr - ci * wi;
        ci = cr * wi + ci * wr;
        cr = nr;
      }
    }
  }
}

/**
 * tone_only: each 0.5 s window's 4096-point spectrum (Hann), 80 Hz to 8 kHz only. A window is tonal when its
 * 3 strongest narrow peaks (each +/-2 bins) hold over 80 % of its band energy. The video fails when tonal
 * windows sharing one dominant peak (+/-2 bins) cover over half its length. Near-silent windows are skipped.
 */
export function fmTone(samples, rate, th = FM_THRESHOLDS.tone_only) {
  const n = th.fft_points;
  const hop = Math.round(th.window_s * rate);
  const lo = Math.ceil((th.band_hz[0] * n) / rate);
  const hi = Math.min(n / 2 - 1, Math.floor((th.band_hz[1] * n) / rate));
  const hann = new Float64Array(n).map((_, i) => 0.5 - 0.5 * Math.cos((2 * Math.PI * i) / (n - 1)));
  const windows = [];
  for (let from = 0; from + Math.min(n, hop) <= samples.length; from += hop) {
    const center = Math.max(0, Math.min(samples.length - n, from + Math.floor((hop - n) / 2)));
    const re = new Float64Array(n);
    const im = new Float64Array(n);
    let sumSq = 0;
    for (let i = 0; i < n && center + i < samples.length; i++) {
      const v = samples[center + i];
      sumSq += v * v;
      re[i] = v * hann[i];
    }
    if (fmDb(Math.sqrt(sumSq / n)) < -60) {
      windows.push(null);
      continue;
    }
    fmFft(re, im);
    const power = new Float64Array(hi + 1);
    let total = 0;
    for (let k = lo; k <= hi; k++) {
      power[k] = re[k] * re[k] + im[k] * im[k];
      total += power[k];
    }
    if (!(total > 0)) {
      windows.push(null);
      continue;
    }
    const peaks = [];
    let held = 0;
    for (let p = 0; p < th.max_peaks; p++) {
      let best = -1;
      for (let k = lo; k <= hi; k++) if (power[k] > 0 && (best < 0 || power[k] > power[best])) best = k;
      if (best < 0) break;
      for (let k = Math.max(lo, best - th.peak_half_width_bins); k <= Math.min(hi, best + th.peak_half_width_bins); k++) {
        held += power[k];
        power[k] = 0;
      }
      peaks.push(best);
    }
    windows.push({ tonal: held / total > th.energy_share, share: held / total, top: peaks[0] });
  }
  if (!windows.length) return { steady_share: 0, hz: null, windows: 0 };
  const counts = new Map();
  for (const w of windows) if (w && w.tonal) counts.set(w.top, (counts.get(w.top) || 0) + 1);
  let bestBin = null;
  let bestCount = 0;
  for (const bin of counts.keys()) {
    let c = 0;
    for (const [other, k] of counts) if (Math.abs(other - bin) <= th.peak_half_width_bins) c += k;
    if (c > bestCount) {
      bestCount = c;
      bestBin = bin;
    }
  }
  return { steady_share: bestCount / windows.length, hz: bestBin === null ? null : +((bestBin * rate) / n).toFixed(1), windows: windows.length };
}

/** freezedetect (noise 0.003, 1.0 s) spans of the picture, from one decode of a small copy. */
export async function fmFreezes(ctx, video, duration, th = FM_THRESHOLDS.frozen_picture) {
  const { stderr } = await kitFfmpeg(ctx, ['-nostats', '-i', video, '-an', '-vf', `scale=270:-2,freezedetect=n=${th.noise}:d=1.0`, '-f', 'null', '-']);
  const out = [];
  let start = null;
  for (const line of String(stderr).split('\n')) {
    const s = new RegExp(`freeze_start:\\s*(${FM_NUM})`).exec(line);
    if (s) start = Number(s[1]);
    const e = new RegExp(`freeze_end:\\s*(${FM_NUM})`).exec(line);
    if (e && start !== null) {
      out.push([start, Number(e[1])]);
      start = null;
    }
  }
  if (start !== null) out.push([start, duration]);
  return out;
}

/** A 64-bit dHash of a 9x8 gray frame, as a bit string, and the frame's spread (stddev). */
export function fmDhash(frame) {
  let bits = '';
  for (let y = 0; y < 8; y++) for (let x = 0; x < 8; x++) bits += frame.data[y * 9 + x] > frame.data[y * 9 + x + 1] ? '1' : '0';
  const values = [...frame.data];
  const mean = values.reduce((a, v) => a + v, 0) / values.length;
  const sd = Math.sqrt(values.reduce((a, v) => a + (v - mean) ** 2, 0) / values.length);
  return { bits, sd };
}

export function fmHamming(a, b) {
  let d = 0;
  for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) d++;
  return d;
}

/**
 * The shots to compare: the linked timeline's segments, consecutive segments of one source merged into one
 * shot, else the timeline's scenes. A shot that depicts speech is a new performance, not a reused shot, and
 * is not compared.
 */
export function fmShots(assembly, timeline) {
  if (assembly && Array.isArray(assembly.segments) && assembly.segments.length) {
    const shots = [];
    for (const seg of [...assembly.segments].sort((a, b) => a.start_ms - b.start_ms)) {
      const last = shots.at(-1);
      const source = seg.video && seg.video.asset_id;
      if (last && last.source === source && Math.abs(last.end_s - seg.start_ms / 1000) < 0.05) {
        last.end_s = seg.end_ms / 1000;
        last.speech = last.speech && seg.depicts_speech === true;
        continue;
      }
      shots.push({ id: seg.id, source, start_s: seg.start_ms / 1000, end_s: seg.end_ms / 1000, intent: typeof seg.intent === 'string' ? seg.intent : '', speech: seg.depicts_speech === true });
    }
    return shots;
  }
  return (timeline.scenes || []).map((sc) => ({ id: sc.id, source: null, start_s: sc.start_s, end_s: sc.end_s, intent: '', speech: false }));
}

/** [[start_s, end_s]] of the linked timeline's planned freezes and pauses, with their lengths judged. */
export function fmPlanned(assembly) {
  const freezes = [];
  const pauses = [];
  if (!assembly) return { freezes, pauses, duration_s: null };
  for (const o of assembly.visual_overrides || []) if (o && o.kind === 'freeze') freezes.push([o.start_ms / 1000, o.end_ms / 1000]);
  for (const p of assembly.pauses || []) if (p) pauses.push([p.start_ms / 1000, p.end_ms / 1000]);
  return { freezes, pauses, duration_s: Number.isFinite(assembly.duration_ms) ? assembly.duration_ms / 1000 : null };
}

/** The approved contract chose silence: speech_mode none with only intentional_silence. */
export function fmSilentByChoice(assembly, expect) {
  if (assembly) return assembly.speech_mode === 'none' && Array.isArray(assembly.soundtrack_modes) && assembly.soundtrack_modes.length === 1 && assembly.soundtrack_modes[0] === 'intentional_silence';
  return expect.speech === 'none' && expect.music !== true && expect.voice !== true;
}

const fmIntervals = (spans) => spans.map(([s, e]) => [fmRound(s), fmRound(e)]);

/**
 * Every final measurement: [{ id, result, detail, intervals_ms }]. `media` has the measured duration,
 * whether there is an audio track, the cut's path and size. `opts.referenceFrozenShare` (0 to 1) widens the
 * still-image share when the reference is known.
 */
export async function fmMeasure(ctx, media, { timeline, expect, assembly }) {
  const th = FM_THRESHOLDS;
  const d = media.duration_s;
  const results = [];
  const put = (id, result, detail, spans = []) => results.push({ id, result, detail, intervals_ms: fmIntervals(spans) });
  const planned = fmPlanned(assembly);
  const silentByChoice = fmSilentByChoice(assembly, expect);
  const samples = await fmSamples(ctx, media.path, media.has_audio);

  // digital_silence
  if (silentByChoice) put('digital_silence', 'not_applicable', 'the approved contract is intentional silence');
  else if (!samples || !samples.length) put('digital_silence', 'fail', 'the video has no sound track', [[0, d]]);
  else {
    let peak = 0;
    for (let i = 0; i < samples.length; i++) peak = Math.max(peak, Math.abs(samples[i]));
    const zeros = fmZeroRuns(samples, FM_RATE, th.digital_silence.zero_run_s).filter((span) => !fmAllowed(span, d, th.digital_silence.zero_run_s) && !fmCovered(span, planned.pauses));
    if (fmDb(peak) < th.digital_silence.peak_dbfs) put('digital_silence', 'fail', `the whole track peaks at ${fmDb(peak) === -Infinity ? 'digital zero' : `${fmDb(peak).toFixed(1)} dBFS`}`, [[0, d]]);
    else if (zeros.length) put('digital_silence', 'fail', `exact digital silence for ${(zeros[0][1] - zeros[0][0]).toFixed(1)} s from ${zeros[0][0].toFixed(1)} s`, zeros);
    else put('digital_silence', 'pass', `peak ${fmDb(peak).toFixed(1)} dBFS`);
  }

  // tone_only
  if (!samples || !samples.length) put('tone_only', 'not_applicable', 'no sound track');
  else {
    const tone = fmTone(samples, FM_RATE);
    if (tone.steady_share > th.tone_only.steady_share) put('tone_only', 'fail', `a steady tone near ${tone.hz} Hz holds ${(tone.steady_share * 100).toFixed(0)} % of the video: sine or drone "music", not a soundtrack`, [[0, d]]);
    else put('tone_only', 'pass', `steady-tone share ${(tone.steady_share * 100).toFixed(0)} %`);
  }

  // unplanned_silence
  if (silentByChoice) put('unplanned_silence', 'not_applicable', 'the approved contract is intentional silence');
  else if (!samples || !samples.length) put('unplanned_silence', 'not_applicable', 'no sound track (see digital_silence)');
  else {
    const allowedPauses = planned.pauses.filter(([s, e]) => e - s <= th.planned_pause_too_long.pause_s);
    const quiet = fmQuietRuns(samples, FM_RATE, th.unplanned_silence.window_s, th.unplanned_silence.rms_dbfs, th.unplanned_silence.run_s).filter((span) => !fmAllowed(span, d, th.unplanned_silence.run_s) && !fmCovered(span, allowedPauses));
    if (quiet.length) put('unplanned_silence', 'fail', `the sound drops below ${th.unplanned_silence.rms_dbfs} dBFS for ${(quiet[0][1] - quiet[0][0]).toFixed(1)} s from ${quiet[0][0].toFixed(1)} s with no planned pause`, quiet);
    else put('unplanned_silence', 'pass', 'no unplanned silence over 1.0 s');
  }

  // planned_pause_too_long
  if (!assembly) put('planned_pause_too_long', 'not_applicable', 'no linked timeline');
  else {
    const long = planned.pauses.filter(([s, e]) => e - s > th.planned_pause_too_long.pause_s);
    const total = planned.pauses.reduce((a, [s, e]) => a + Math.max(0, e - s), 0);
    if (long.length) put('planned_pause_too_long', 'fail', `a planned pause of ${(long[0][1] - long[0][0]).toFixed(1)} s (at most ${th.planned_pause_too_long.pause_s} s)`, long);
    else if (d > 0 && total / d > th.planned_pause_too_long.total_share) put('planned_pause_too_long', 'fail', `planned pauses add up to ${((total / d) * 100).toFixed(0)} % of the video (at most 10 %)`, planned.pauses);
    else put('planned_pause_too_long', 'pass', `${total.toFixed(2)} s of planned pauses`);
  }

  // planned_freeze_too_long: a freeze ending at the end (the end card) may last 3.0 s.
  if (!assembly) put('planned_freeze_too_long', 'not_applicable', 'no linked timeline');
  else {
    const end = planned.duration_s ?? d;
    const long = planned.freezes.filter(([s, e]) => e - s > (e >= end - 0.001 ? th.planned_freeze_too_long.end_freeze_s : th.planned_freeze_too_long.freeze_s));
    if (long.length) put('planned_freeze_too_long', 'fail', `a planned freeze of ${(long[0][1] - long[0][0]).toFixed(1)} s`, long);
    else put('planned_freeze_too_long', 'pass', `${planned.freezes.length} planned freezes within their caps`);
  }

  // frozen_picture
  const freezes = await fmFreezes(ctx, media.path, d);
  const allowedFreezes = planned.freezes.filter(([s, e]) => e - s <= (e >= (planned.duration_s ?? d) - 0.001 ? th.planned_freeze_too_long.end_freeze_s : th.planned_freeze_too_long.freeze_s));
  const unplanned = freezes.filter((span) => !fmAllowed(span, d, th.frozen_picture.mid_run_s) && !fmCovered(span, allowedFreezes));
  const frozen = freezes.reduce((a, [s, e]) => a + Math.max(0, e - s), 0);
  const ref = Number.isFinite(expect.reference_frozen_share) ? expect.reference_frozen_share : null;
  const shareLimit = ref === null ? th.frozen_picture.share : Math.max(th.frozen_picture.share, ref + th.frozen_picture.share_over_reference);
  if (unplanned.length) {
    const [s, e] = unplanned[0];
    put('frozen_picture', 'fail', `the picture is frozen for ${(e - s).toFixed(1)} s from ${s.toFixed(1)} s with no planned freeze`, unplanned);
  } else if (d > 0 && frozen / d > shareLimit) put('frozen_picture', 'fail', `the picture is still for ${((frozen / d) * 100).toFixed(0)} % of the video (at most ${(shareLimit * 100).toFixed(0)} %)`, freezes);
  else put('frozen_picture', 'pass', `${frozen.toFixed(1)} s frozen in all`);

  // repeated_shot
  const shots = fmShots(assembly, timeline).filter((s) => s.end_s - s.start_s > th.repeated_shot.min_shot_s && !s.speech);
  const hashed = [];
  for (const shot of shots) {
    const frame = await kitGrayFrame(ctx, media.path, Math.min(d - 0.05, (shot.start_s + shot.end_s) / 2), 9, 8);
    const h = fmDhash(frame);
    // A flat card (black, one colour) has no picture to repeat; black frames are checked on their own.
    if (h.sd >= th.repeated_shot.flat_stddev) hashed.push({ ...shot, bits: h.bits });
  }
  const order = shots.map((s) => s.id);
  let repeat = null;
  for (let j = 0; j < hashed.length && !repeat; j++) {
    for (let i = 0; i < j && !repeat; i++) {
      if (Math.abs(order.indexOf(hashed[j].id) - order.indexOf(hashed[i].id)) <= 1) continue;
      if (hashed[j].intent.startsWith('callback:')) continue;
      const dist = fmHamming(hashed[i].bits, hashed[j].bits);
      if (dist <= th.repeated_shot.max_hamming) repeat = { a: hashed[i], b: hashed[j], dist };
    }
  }
  if (!shots.length) put('repeated_shot', 'not_applicable', 'no shot over 1 s to compare');
  else if (repeat) put('repeated_shot', 'fail', `the shot at ${repeat.b.start_s.toFixed(1)} s repeats the one at ${repeat.a.start_s.toFixed(1)} s (dHash distance ${repeat.dist}); mark an intended repeat with intent callback:`, [[repeat.a.start_s, repeat.a.end_s], [repeat.b.start_s, repeat.b.end_s]]);
  else put('repeated_shot', 'pass', `${hashed.length} shots compared`);

  return results;
}

/** The stored shape (quality_report.final_measure). */
export function fmRecord(video, durationS, checks) {
  return { format: FM_FORMAT, output_sha256: video.sha256, measured_duration_ms: fmRound(durationS), checks, thresholds: FM_THRESHOLDS };
}

/** Plain words for a failed or warned measurement. */
export function fmMessage(c, block) {
  const what = {
    digital_silence: 'The sound goes digitally silent',
    tone_only: 'The soundtrack is a steady tone',
    unplanned_silence: 'The sound drops out',
    planned_pause_too_long: 'A planned pause is too long',
    frozen_picture: 'The picture freezes',
    planned_freeze_too_long: 'A planned freeze is too long',
    repeated_shot: 'A shot is repeated',
  }[c.id] || 'A final measurement failed';
  return `${what}: ${c.detail}.${block ? '' : ' (A warning for template videos in this release.)'}`;
}


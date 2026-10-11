// The preservation checks, ported from replace_hook.py compare_video and
// compare_audio: every kept frame is decoded from the original and from the
// output and compared one by one in order (an exact hash match, else PSNR),
// and the kept sound is compared at the same sample positions (normalised RMS
// error and correlation; a silent original must stay silent).
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { kitFfmpeg, kitNum } from '../../_lib/part.mjs';

/**
 * One md5 per decoded frame of `path`'s picture, from frame `from` on. No filter runs (frames are
 * skipped here, not by trim), so a mid-stream change of colour tags cannot restart a frame count.
 */
export async function spliceFrameHashes(ctx, path, from) {
  const { stdout } = await kitFfmpeg(ctx, ['-v', 'error', '-i', path, '-map', '0:v:0', '-an', '-fps_mode', 'passthrough', '-f', 'framemd5', '-']);
  return String(stdout || '')
    .split('\n')
    .filter((line) => line.trim() && !line.startsWith('#'))
    .map((line) => line.split(',').at(-1).trim())
    .slice(from);
}

/** Per-frame PSNR (dB, identical frames as 100) of output frames from `outFrom` against source frames from `srcFrom`, paired by index. */
export async function splicePsnr(ctx, src, srcFrom, out, outFrom) {
  const index = 'setpts=N/(30*TB)';
  const graph = `[0:v]trim=start_frame=${srcFrom},${index}[s];[1:v]trim=start_frame=${outFrom},${index}[o];[s][o]psnr=stats_file=-:shortest=1[v]`;
  const { stdout } = await kitFfmpeg(ctx, ['-v', 'error', '-reinit_filter', '0', '-i', src, '-reinit_filter', '0', '-i', out, '-filter_complex', graph, '-map', '[v]', '-an', '-f', 'null', '-']);
  const scores = [];
  for (const m of String(stdout || '').matchAll(/psnr_avg:(\S+)/g)) {
    const v = Number(m[1]);
    scores.push(Number.isFinite(v) ? Math.min(v, 100) : 100);
  }
  return scores;
}

/** Compares the kept picture. Returns {frames, output_frames, exact, psnr_min, passed}. */
export async function spliceCompareVideo(ctx, { src, k, out, n, expected, psnr_min }) {
  const want = await spliceFrameHashes(ctx, src, k);
  const got = await spliceFrameHashes(ctx, out, n);
  let exact = 0;
  for (let i = 0; i < Math.min(want.length, got.length); i++) if (want[i] === got[i]) exact++;
  const counts = want.length === expected && got.length === expected;
  let low = exact === expected && counts ? 100 : 0;
  if (counts && exact < expected) {
    const scores = await splicePsnr(ctx, src, k, out, n);
    low = scores.length === expected ? Math.min(...scores) : 0;
  }
  return { frames: want.length, output_frames: got.length, exact, psnr_min: +low.toFixed(3), passed: counts && low >= psnr_min };
}

/** Normalised RMS error and correlation of two equal-length sample runs; `quiet` when the original is (nearly) silent. */
export function spliceAudioStats(x, y) {
  if (x.length !== y.length) return { samples: 0, nrmse: Infinity, corr: 0, quiet: false, error: 'the kept sound has a different number of samples' };
  let xx = 0;
  let yy = 0;
  let xy = 0;
  let err = 0;
  for (let i = 0; i < x.length; i++) {
    const u = x[i];
    const v = y[i];
    xx += u * u;
    yy += v * v;
    xy += u * v;
    err += (u - v) * (u - v);
  }
  const count = x.length;
  if (!count) return { samples: 0, nrmse: Infinity, corr: 0, quiet: false, error: 'the kept sound is empty' };
  const quiet = xx <= count * 1e-8;
  const nrmse = Math.sqrt(err / Math.max(xx, 1e-12));
  const corr = xx > 1e-12 && yy > 1e-12 ? xy / Math.sqrt(xx * yy) : err < count * 1e-8 ? 1 : 0;
  return { samples: count, nrmse, corr, quiet, mean_square_error: err / count };
}

/** Root mean square of a sample run. */
export function spliceRms(x) {
  let s = 0;
  for (let i = 0; i < x.length; i++) s += x[i] * x[i];
  return Math.sqrt(s / Math.max(x.length, 1));
}

async function spliceReadF32(path) {
  const buf = await readFile(path);
  return new Float32Array(buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.length - (buf.length % 4)));
}

async function spliceSamples(ctx, path, start_s, seconds, rate, channels, name) {
  const file = join(ctx.tmpDir, name);
  await kitFfmpeg(ctx, [
    '-v', 'error', '-i', path, '-map', '0:a:0', '-vn',
    '-af', `atrim=start=${kitNum(start_s, 9)}:end=${kitNum(start_s + seconds, 9)},asetpts=PTS-STARTPTS,apad,atrim=duration=${kitNum(seconds, 9)}`,
    '-ar', String(rate), '-ac', String(channels), '-f', 'f32le', file,
  ]);
  return spliceReadF32(file);
}

/**
 * Compares the kept sound: the original from t0 against the output from start_s, both `seconds` long.
 * A silent original (no audio stream) needs the output's kept span to stay silent (RMS <= 0.0001).
 */
export async function spliceCompareAudio(ctx, { src, t0, out, start_s, seconds, source_audio, output_has_audio, nrmse_max, corr_min }) {
  if (!source_audio) {
    if (!output_has_audio) return { nrmse: null, corr: null, passed: true };
    const kept = await spliceSamples(ctx, out, start_s, seconds, 48000, 1, 'output-body-silence.f32');
    const rms = spliceRms(kept);
    return { nrmse: null, corr: null, rms, passed: rms <= 0.0001 };
  }
  const { sample_rate: rate, channels } = source_audio;
  const x = await spliceSamples(ctx, src, t0, seconds, rate, channels, 'source-body.f32');
  const y = await spliceSamples(ctx, out, start_s, seconds, rate, channels, 'output-body.f32');
  const s = spliceAudioStats(x, y);
  if (s.error) return { nrmse: null, corr: null, passed: false, error: s.error };
  // A (nearly) silent original has no level to normalise by: it passes when the output stays as quiet.
  const passed = s.quiet ? s.mean_square_error <= 1e-8 : s.nrmse <= nrmse_max && s.corr >= corr_min;
  const nrmse = s.quiet ? (passed ? 0 : 1) : Math.min(s.nrmse, 1e6);
  const corr = Number.isFinite(s.corr) ? s.corr : 0;
  return { nrmse: +nrmse.toFixed(6), corr: +corr.toFixed(6), passed };
}

// What splice reads from a media file before it touches anything, and the
// source rules it refuses on. A port of preflight_source and probe from the
// render-hook-replacement atom (replace_hook.py): the body must be a clean,
// constant-frame-rate, square-pixel 8-bit yuv420p file whose streams start at
// zero and whose sound does not run past its last frame, or the kept body
// could not be proven untouched.
import { createHash } from 'node:crypto';
import { createReadStream } from 'node:fs';
import { open } from 'node:fs/promises';

/** A frame rate fraction ("30000/1001") as a number, or 0. */
export function spliceRate(text) {
  const [n, d] = String(text || '').split('/').map(Number);
  if (!Number.isFinite(n) || !(d || d === undefined)) return 0;
  const v = d === undefined ? n : n / d;
  return Number.isFinite(v) && v > 0 ? v : 0;
}

function spliceRotation(stream) {
  for (const s of stream.side_data_list || []) if (s && s.rotation !== undefined) return Number(s.rotation) || 0;
  return Number(stream.tags && stream.tags.rotate) || 0;
}

/** ffprobe's streams and format, reduced to what splice needs. */
export async function spliceProbe(ctx, path) {
  const { stdout } = await ctx.tools.exec('ffprobe', ['-v', 'error', '-print_format', 'json', '-show_format', '-show_streams', path]);
  const data = JSON.parse(stdout || '{}');
  const streams = data.streams || [];
  const v = streams.find((s) => s.codec_type === 'video');
  const a = streams.find((s) => s.codec_type === 'audio');
  const format = data.format || {};
  const fpsText = v && (v.avg_frame_rate && v.avg_frame_rate !== '0/0' ? v.avg_frame_rate : v.r_frame_rate);
  return {
    format_name: String(format.format_name || ''),
    duration_s: Number(format.duration) || 0,
    video: v
      ? {
          codec: v.codec_name,
          width: v.width,
          height: v.height,
          pix_fmt: v.pix_fmt,
          sar: v.sample_aspect_ratio,
          rotation: spliceRotation(v),
          fps_text: fpsText,
          fps: spliceRate(fpsText),
          start_s: Number(v.start_time) || 0,
          color: { range: v.color_range, primaries: v.color_primaries, trc: v.color_transfer, space: v.color_space },
        }
      : null,
    audio: a
      ? {
          codec: a.codec_name,
          sample_rate: Number(a.sample_rate) || 0,
          channels: Number(a.channels) || 0,
          layout: a.channel_layout || { 1: 'mono', 2: 'stereo' }[Number(a.channels)] || null,
          start_s: Number(a.start_time) || 0,
          duration_s: Number(a.duration) || Number(format.duration) || 0,
        }
      : null,
  };
}

const SPLICE_COLOR_NAMES = /^(tv|pc|bt709|bt470m|bt470bg|smpte170m|smpte240m|bt2020|bt2020nc|bt2020c|smpte2084|arib-std-b67|iec61966-2-1)$/;

/**
 * The setparams filter that tags a picture with the body's colour properties (range, primaries,
 * transfer, matrix), or '' when the body names none. Tags only: no pixel is converted. Without it a
 * hook and body with different tags make ffmpeg rebuild its filters mid-stream, and the output
 * would carry two sets of colour tags.
 */
export function spliceColorTags(color) {
  const c = color || {};
  const pick = (v) => (typeof v === 'string' && SPLICE_COLOR_NAMES.test(v) ? v : null);
  const parts = [];
  if (pick(c.range)) parts.push(`range=${c.range}`);
  if (pick(c.primaries)) parts.push(`color_primaries=${c.primaries}`);
  if (pick(c.trc)) parts.push(`color_trc=${c.trc}`);
  if (pick(c.space)) parts.push(`colorspace=${c.space}`);
  return parts.length ? `setparams=${parts.join(':')}` : '';
}

/** The first video stream's packets in presentation order: [{t, key, size}]. Discarded packets are left out. */
export async function splicePackets(ctx, path) {
  const { stdout } = await ctx.tools.exec('ffprobe', ['-v', 'error', '-select_streams', 'v:0', '-show_entries', 'packet=pts_time,flags,size', '-print_format', 'json', path]);
  const packets = (JSON.parse(stdout || '{}').packets || [])
    .filter((p) => p.pts_time !== undefined && p.pts_time !== 'N/A' && !String(p.flags || '').includes('D'))
    .map((p) => ({ t: Number(p.pts_time), key: String(p.flags || '').startsWith('K'), size: Number(p.size) || 0 }))
    .filter((p) => Number.isFinite(p.t));
  packets.sort((x, y) => x.t - y.t);
  return packets;
}

/** True when the file is a Git LFS pointer, not media. */
export async function spliceIsLfsPointer(path) {
  const handle = await open(path, 'r');
  try {
    const buf = Buffer.alloc(80);
    const { bytesRead } = await handle.read(buf, 0, 80, 0);
    return buf.subarray(0, bytesRead).toString('latin1').startsWith('version https://git-lfs.github.com/spec/');
  } finally {
    await handle.close();
  }
}

/** The file's sha256, streamed. */
export function spliceSha256(path) {
  return new Promise((resolve, reject) => {
    const hash = createHash('sha256');
    createReadStream(path)
      .on('data', (b) => hash.update(b))
      .on('error', reject)
      .on('end', () => resolve(hash.digest('hex')));
  });
}

/**
 * The source rules (replace_hook.py preflight_source), on a probe and its packets. Returns
 * {problem} in plain words, or the body facts: fps, the kept frames (from index k, the first
 * frame at or after cut_s), where the picture ends, whether the cut lands on a keyframe and
 * how many bytes the kept picture holds.
 */
export function spliceSourceFacts(info, packets, { cut_s, end_s = null }) {
  const v = info.video;
  if (!v) return { problem: 'the original ad has no picture' };
  if (v.pix_fmt !== 'yuv420p') return { problem: `the original ad is ${v.pix_fmt || 'an unknown pixel format'}, not 8-bit yuv420p; make a normalised copy of it first` };
  if (v.sar && !['1:1', '0:1', 'N/A'].includes(v.sar)) return { problem: `the original ad has non-square pixels (${v.sar}); make a normalised copy of it first` };
  if (Math.round(v.rotation) % 360 !== 0) return { problem: `the original ad is stored rotated (${v.rotation} degrees); make a normalised copy of it first` };
  if (v.width % 2 || v.height % 2) return { problem: `the original ad is ${v.width}x${v.height}; its width and height must be even` };
  if (!(v.fps > 0)) return { problem: 'the original ad has no frame rate' };
  const audio = info.audio;
  if (Math.abs(v.start_s) > 0.001 || (audio && Math.abs(audio.start_s) > 0.025)) {
    return { problem: 'the original ad\'s picture or sound does not start at zero; make a normalised copy of it first' };
  }
  if (audio && !audio.layout) return { problem: 'the original ad\'s sound has no channel layout' };
  if (audio && !(audio.sample_rate > 0)) return { problem: 'the original ad\'s sound has no sample rate' };
  const times = packets.map((p) => p.t);
  if (times.length < 2) return { problem: 'the original ad has fewer than two frames' };
  const frame_s = 1 / v.fps;
  for (let i = 1; i < times.length; i++) {
    if (Math.abs(times[i] - times[i - 1] - frame_s) > 0.001) {
      return { problem: `the original ad has a variable frame rate (a ${((times[i] - times[i - 1]) * 1000).toFixed(1)} ms frame at ${times[i - 1].toFixed(3)}s); make a constant-frame-rate copy of it first` };
    }
  }
  const video_end_s = times.at(-1) + frame_s;
  // An AAC encoder pads its last frame, so up to one AAC frame (1024 samples) past the picture is padding, not sound to keep.
  const pad_s = audio && audio.codec === 'aac' ? 1024 / audio.sample_rate : 0;
  const audio_end_s = audio ? audio.start_s + audio.duration_s : video_end_s;
  if (Math.max(audio_end_s, info.duration_s) > video_end_s + 0.002 + pad_s) {
    return { problem: `the original ad's sound runs ${(Math.max(audio_end_s, info.duration_s) - video_end_s).toFixed(3)}s past its last frame; make a copy that holds the last frame to the end of its sound first` };
  }
  if (!(cut_s >= 0)) return { problem: 'the cut must be at or after 0' };
  if (cut_s >= times.at(-1)) return { problem: `the cut at ${cut_s.toFixed(3)}s leaves no complete frame of the original ad (its last frame starts at ${times.at(-1).toFixed(3)}s)` };
  if (end_s !== null && end_s < video_end_s - frame_s - 0.002) {
    return { problem: `the original ad is kept to its end, but its window ends at ${end_s.toFixed(3)}s, before its last frame at ${times.at(-1).toFixed(3)}s` };
  }
  const k = times.findIndex((t) => t >= cut_s - 1e-7);
  const kept = packets.slice(k);
  return {
    fps: v.fps,
    fps_text: v.fps_text,
    color: v.color,
    width: v.width,
    height: v.height,
    k,
    t0: times[k],
    frames: kept.length,
    body_s: kept.length / v.fps,
    video_end_s,
    key_at_cut: packets[k].key,
    kept_bytes: kept.reduce((sum, p) => sum + p.size, 0),
    copyable: v.codec === 'h264' && /\b(mov|mp4)\b/.test(info.format_name.replace(/,/g, ' ')) && packets[k].key,
  };
}

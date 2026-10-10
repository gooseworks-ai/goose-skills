// The length of a customer's media file, for parts that take one as it was uploaded. A streaming WebM or
// Matroska file (a browser or screen recording) plays but has no container duration, so the core's probe
// gives none: this falls back to the streams' own durations or DURATION tags, then the last packet's end.
import { kitDuration } from './part.mjs';

function kitClockSeconds(tag) {
  const m = /^(\d+):(\d{2}):(\d{2}(?:\.\d+)?)$/.exec(String(tag || '').trim());
  return m ? Number(m[1]) * 3600 + Number(m[2]) * 60 + Number(m[3]) : NaN;
}

/** Media length in seconds: kitDuration, else the streams' durations or tags, else the last packet's end. */
export async function kitMediaLength(ctx, file) {
  try {
    return await kitDuration(ctx, file);
  } catch (e) {
    if (e.code !== 'tool_failed') throw e;
  }
  const { stdout } = await ctx.tools.exec('ffprobe', ['-v', 'error', '-print_format', 'json', '-show_entries', 'stream=duration:stream_tags=DURATION', file.path]);
  const streams = JSON.parse(stdout).streams || [];
  const declared = streams.map((s) => Math.max(Number(s.duration) || 0, kitClockSeconds(s.tags && (s.tags.DURATION || s.tags.duration)) || 0));
  if (Math.max(0, ...declared) > 0) return Math.max(...declared);
  const packets = await ctx.tools.exec('ffprobe', ['-v', 'error', '-show_entries', 'packet=pts_time,duration_time', '-of', 'csv=p=0', file.path]);
  let end = 0;
  for (const line of packets.stdout.split('\n')) {
    const [pts, d] = line.split(',').map(Number);
    if (Number.isFinite(pts)) end = Math.max(end, pts + (Number.isFinite(d) ? d : 0));
  }
  if (!(end > 0)) throw ctx.error('tool_failed', `no length for ${file.path}`);
  return end;
}

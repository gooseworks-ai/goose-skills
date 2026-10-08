// cut-footage: lays a clip of the brand's own footage into a band of a video,
// the cut from footage-cutlist's render and render-logo-equation-card's
// compose: the plan's window of the footage, cover-fitted (or fitted by
// width) into the band, sped so the window fills the video (speed "fill",
// refused outside min_speed to max_speed) or played at a fixed speed, under
// the video everywhere outside the band. The picture above and below the band
// is the video's own (an html-frames card that leaves the band free).
import { join } from 'node:path';
import { kitCheckInputs, kitCheckOutputs, kitDuration, kitFfmpeg, kitNum } from '../../_lib/part.mjs';

export async function run(inputs, ctx) {
  const manifest = await kitCheckInputs(ctx, inputs);
  const first = inputs.footage[0];
  const clip = { ...first, video: first.file || first.video };
  const info = await ctx.tools.probe(inputs.video.path);
  const W = info.width;
  const H = info.height;
  const fps = info.fps || 30;
  const dur = await kitDuration(ctx, inputs.video);
  const band = inputs.band;
  if (band.x + band.width > W || band.y + band.height > H) throw ctx.error('bad_input', `the band ${band.width}x${band.height} at ${band.x},${band.y} is outside the ${W}x${H} video`);
  const length = await kitDuration(ctx, clip.video);
  const from = (clip.start_ms ?? 0) / 1000;
  const to = clip.end_ms == null ? length : clip.end_ms / 1000;
  if (!(to > from) || to > length + 0.05) throw ctx.error('bad_input', `the footage window ${kitNum(from, 2)}-${kitNum(to, 2)}s is not inside the ${kitNum(length, 2)}s clip`);
  let speed;
  if (inputs.speed === 'fill' || inputs.speed === undefined) {
    speed = (to - from) / dur;
    const min = inputs.min_speed ?? 1;
    const max = inputs.max_speed ?? 8;
    if (speed < min - 1e-6 || speed > max + 1e-6) {
      throw ctx.error('bad_input', `filling ${kitNum(dur, 2)}s from a ${kitNum(to - from, 2)}s window needs ${kitNum(speed, 2)}x, outside ${min}x to ${max}x`);
    }
  } else {
    speed = inputs.speed;
    if ((to - from) / speed + 0.05 < dur) throw ctx.error('bad_input', `at ${speed}x the ${kitNum(to - from, 2)}s window lasts ${kitNum((to - from) / speed, 2)}s, less than the ${kitNum(dur, 2)}s video`);
  }
  const fit =
    inputs.fit === 'width'
      ? `scale=${band.width}:-2:flags=lanczos,crop=${band.width}:min(ih\\,${band.height}):0:(ih-min(ih\\,${band.height}))/2,pad=${band.width}:${band.height}:0:(oh-ih)/2:color=black`
      : `scale=${band.width}:${band.height}:force_original_aspect_ratio=increase:flags=lanczos,crop=${band.width}:${band.height}`;
  const need = dur * speed + 0.3;
  const graph = [
    `[1:v]setpts=(PTS-STARTPTS)/${kitNum(speed, 6)},fps=${fps},${fit},setsar=1,tpad=stop_mode=clone:stop_duration=0.2,trim=duration=${kitNum(dur)}[band]`,
    `[0:v][band]overlay=${band.x}:${band.y}:eof_action=pass,format=yuv420p[v]`,
  ];
  const map = ['-map', '[v]'];
  if (inputs.audio) {
    const fInfo = await ctx.tools.probe(clip.video.path);
    if (!fInfo.has_audio) throw ctx.error('bad_input', 'audio is on but the footage has no sound');
    graph.push(`[1:a]atempo=${kitNum(Math.min(2, speed), 4)},atrim=0:${kitNum(dur)},asetpts=PTS-STARTPTS,aresample=48000[a]`);
    map.push('-map', '[a]', ...ctx.tools.encodeArgs('aac'));
  } else if (info.has_audio) map.push('-map', '0:a', '-c:a', 'copy');
  await kitFfmpeg(ctx, [
    '-i',
    inputs.video.path,
    '-ss',
    kitNum(from),
    '-t',
    kitNum(Math.min(need, to - from + 0.3)),
    '-i',
    clip.video.path,
    '-filter_complex',
    graph.join(';'),
    ...map,
    ...ctx.tools.encodeArgs('h264-master'),
    '-t',
    kitNum(dur),
    join(ctx.workDir, 'footage.mp4'),
  ]);
  const video = await ctx.file('footage.mp4', 'video');
  ctx.log.info('footage laid into the band', { speed: +speed.toFixed(3), window_s: +(to - from).toFixed(3) });
  return kitCheckOutputs(ctx, manifest, { video, seconds: +dur.toFixed(3), speed: +speed.toFixed(4) });
}

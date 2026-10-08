// assemble: joins scene clips and stills into one cut, in order. Today's
// stitch-videos-ffmpeg montage assembler: every cut is scaled to one size
// (cover crops to fill, contain pads), one frame rate, square pixels and
// yuv420p, held on its last frame when a hair short, cut to an exact frame
// count, and hard-cut through the concat filter (never the concat demuxer,
// which drops audio and adds black frames at joins). Captions and loudness
// are the layers' jobs, not this step's.
import { join } from 'node:path';
import { kitCheckInputs, kitCheckOutputs, kitDuration, kitFfmpeg, kitNum } from '../../_lib/part.mjs';

const SHORT_TOLERANCE_S = 0.1;

function fitChain(w, h, fit, background) {
  const square = "scale='trunc(iw*sar/2)*2':'trunc(ih/2)*2'";
  if (fit === 'contain') {
    return `${square},scale=${w}:${h}:force_original_aspect_ratio=decrease,pad=${w}:${h}:(ow-iw)/2:(oh-ih)/2:color=${background},setsar=1`;
  }
  return `${square},scale=${w}:${h}:force_original_aspect_ratio=increase,crop=${w}:${h},setsar=1`;
}

export async function run(inputs, ctx) {
  const manifest = await kitCheckInputs(ctx, inputs);
  const { width: w, height: h } = inputs;
  const fps = inputs.fps ?? 30;
  const fit = inputs.fit ?? 'cover';
  const background = inputs.background ?? 'black';
  if (w % 2 || h % 2) throw ctx.error('bad_input', 'width and height must be even');
  const keepAudio = inputs.clip_audio === 'keep';
  const args = [];
  const graph = [];
  const scenes = [];
  let at = 0;
  for (const [k, clip] of inputs.clips.entries()) {
    const media = clip.video || clip.image;
    if (!!clip.video === !!clip.image) throw ctx.error('bad_input', `clips[${k}] needs exactly one of video or image`);
    const start = clip.in_s ?? 0;
    let seconds;
    if (clip.image) {
      if (!clip.seconds) throw ctx.error('bad_input', `clips[${k}] is a still and needs seconds`);
      seconds = clip.seconds;
    } else {
      const length = await kitDuration(ctx, media);
      seconds = clip.seconds ?? length - start;
      if (start + seconds > length + SHORT_TOLERANCE_S) {
        throw ctx.error('bad_input', `clips[${k}] needs ${kitNum(start + seconds, 2)}s of a ${kitNum(length, 2)}s clip`);
      }
    }
    const frames = Math.round(seconds * fps);
    if (frames < 1) throw ctx.error('bad_input', `clips[${k}] is shorter than one frame`);
    const exact = frames / fps;
    if (clip.image) args.push('-loop', '1', '-framerate', String(fps), '-t', kitNum(exact + 2 / fps), '-i', media.path);
    else args.push('-ss', kitNum(start), '-t', kitNum(seconds + 0.5), '-i', media.path);
    graph.push(
      `[${k}:v]fps=${fps},${fitChain(w, h, fit, background)},tpad=stop_mode=clone:stop_duration=${kitNum(SHORT_TOLERANCE_S + 2 / fps, 4)},` +
        `trim=end_frame=${frames},setpts=PTS-STARTPTS,format=yuv420p[v${k}]`,
    );
    if (keepAudio) {
      const info = clip.video ? await ctx.tools.probe(media.path) : { has_audio: false };
      graph.push(
        info.has_audio
          ? `[${k}:a]aresample=48000:async=1:first_pts=0,aformat=sample_fmts=fltp:sample_rates=48000:channel_layouts=stereo,apad,atrim=0:${kitNum(exact)},asetpts=PTS-STARTPTS[a${k}]`
          : `anullsrc=channel_layout=stereo:sample_rate=48000,atrim=0:${kitNum(exact)},asetpts=PTS-STARTPTS[a${k}]`,
      );
    }
    const id = clip.id ?? String(k + 1);
    scenes.push({ id, start_s: +at.toFixed(3), end_s: +(at + exact).toFixed(3) });
    at += exact;
  }
  const pads = inputs.clips.map((_, k) => (keepAudio ? `[v${k}][a${k}]` : `[v${k}]`)).join('');
  graph.push(`${pads}concat=n=${inputs.clips.length}:v=1:a=${keepAudio ? 1 : 0}${keepAudio ? '[vout][aout]' : '[vout]'}`);
  const out = ['-filter_complex', graph.join(';'), '-map', '[vout]'];
  if (keepAudio) out.push('-map', '[aout]', ...ctx.tools.encodeArgs('aac'));
  out.push(...ctx.tools.encodeArgs('h264-master'), '-r', String(fps), join(ctx.workDir, 'assembled.mp4'));
  await kitFfmpeg(ctx, [...args, ...out]);
  const video = await ctx.file('assembled.mp4', 'video');
  const got = await ctx.tools.probe(video.path);
  if (!Number.isFinite(got.duration_s) || Math.abs(got.duration_s - at) > 1.5 / fps) {
    throw ctx.error('output_invalid', `the cut is ${got.duration_s}s, expected ${kitNum(at, 3)}s`);
  }
  const timeline = { duration_s: +at.toFixed(3), width: w, height: h, fps, scenes, speech: [] };
  return kitCheckOutputs(ctx, manifest, { video, seconds: +at.toFixed(3), timeline });
}

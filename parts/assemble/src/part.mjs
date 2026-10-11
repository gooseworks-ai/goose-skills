// assemble: joins scene clips and stills into one cut, in order. Today's
// stitch-videos-ffmpeg montage assembler: every cut is scaled to one size
// (cover crops to fill, contain pads), one frame rate, square pixels and
// yuv420p, held on its last frame when a hair short, cut to an exact frame
// count, and hard-cut through the concat filter (never the concat demuxer,
// which drops audio and adds black frames at joins). Captions and loudness
// are the layers' jobs, not this step's.
//
// 1.1.0 adds, all optional: pictures timed to a voice or song (spans, silent,
// tail_s), the voice's speech or a whole timeline passed through, an end card
// joined after the cut or over the last span, a slow push on stills, two grain
// looks, and the size rule: a bitrate cap on the final encode and a refusal
// of any cut over 180 MB.
import { join } from 'node:path';
import { kitCheckInputs, kitCheckOutputs, kitFfmpeg, kitNum } from '../../_lib/part.mjs';
import { kitMediaLength } from '../../_lib/length.mjs';
import { ASSEMBLE_MAX_BYTES, assembleClampScenes, assembleClampSpeech, assembleFit, assembleGradeChain, assembleIsCutProblem, assembleKenBurns, assembleMapZone, assembleRateCap, assembleSpanCuts } from './cuts.mjs';

const SHORT_TOLERANCE_S = 0.1;

const t3 = (frames, fps) => +(frames / fps).toFixed(3);

/** The cuts as 1.0.2 makes them: each clip's own in_s and seconds, a still needing seconds. */
async function listedCuts(inputs, ctx, fps) {
  const cuts = [];
  let at = 0;
  for (const [k, clip] of inputs.clips.entries()) {
    const media = clip.video || clip.image;
    const start = clip.in_s ?? 0;
    let seconds;
    if (clip.image) {
      if (!clip.seconds) throw ctx.error('bad_input', `clips[${k}] is a still and needs seconds`);
      seconds = clip.seconds;
    } else {
      const length = await kitMediaLength(ctx, media);
      seconds = clip.seconds ?? length - start;
      if (start + seconds > length + SHORT_TOLERANCE_S) {
        throw ctx.error('bad_input', `clips[${k}] needs ${kitNum(start + seconds, 2)}s of a ${kitNum(length, 2)}s clip`);
      }
    }
    const frames = Math.round(seconds * fps);
    if (frames < 1) throw ctx.error('bad_input', `clips[${k}] is shorter than one frame`);
    cuts.push({ index: k, id: clip.id ?? String(k + 1), start_f: at, frames, hold_s: 0 });
    at += frames;
  }
  return { cuts, total_f: at };
}

export async function run(inputs, ctx) {
  const manifest = await kitCheckInputs(ctx, inputs);
  const { width: w, height: h } = inputs;
  const fps = inputs.fps ?? 30;
  const fit = inputs.fit ?? 'cover';
  const background = inputs.background ?? 'black';
  if (w % 2 || h % 2) throw ctx.error('bad_input', 'width and height must be even');
  const keepAudio = inputs.clip_audio === 'keep';
  const grade = inputs.grade ?? 'none';
  const kenBurns = !!inputs.motion && inputs.motion.stills === 'ken_burns';
  const zoomTo = (inputs.motion && inputs.motion.to) ?? 1.05;
  const fills = inputs.ending_fills ?? 'after';
  const tail = inputs.tail_s ?? 0.25;
  for (const [k, clip] of inputs.clips.entries()) {
    if (!!clip.video === !!clip.image) throw ctx.error('bad_input', `clips[${k}] needs exactly one of video or image`);
  }
  if (fills === 'last_span' && inputs.ending && !inputs.spans) throw ctx.error('bad_input', 'ending_fills last_span needs spans: the card takes the last span\'s place');

  const ending = inputs.ending || null;
  const endingSeconds = ending ? await kitMediaLength(ctx, ending) : 0;
  const endingFrames = ending ? Math.round(endingSeconds * fps) : 0;
  if (ending && endingFrames < 1) throw ctx.error('bad_input', 'the end card is shorter than one frame');

  // Where every cut goes.
  let plan;
  if (inputs.spans) {
    let spans = inputs.spans;
    let until = 0;
    if (fills === 'last_span' && !ending) {
      // No card was drawn (an end-card step can return nothing): a card scene with no clip is held over by the cut before it.
      const latest = spans.reduce((a, b) => (b.start_s > a.start_s ? b : a));
      if (!inputs.clips.some((c) => c.id === latest.id)) {
        spans = spans.filter((s) => s !== latest);
        until = latest.end_s + tail;
        ctx.log.info('no end card: the last span is held by the cut before it', { scene: latest.id });
      }
    }
    try {
      plan = assembleSpanCuts(inputs.clips, spans, {
        fps,
        tail_s: tail,
        silent: inputs.silent,
        card: ending ? { fills, frames: endingFrames } : null,
        until_s: until,
      });
    } catch (e) {
      if (assembleIsCutProblem(e)) throw ctx.error('bad_input', e.message);
      throw e;
    }
    // A clip shorter than its cut holds its last frame; one that starts past its own end is refused.
    for (const cut of plan.cuts) {
      const clip = inputs.clips[cut.index];
      cut.hold_s = 0;
      if (clip.video) {
        const length = await kitMediaLength(ctx, clip.video);
        const avail = length - (clip.in_s ?? 0);
        if (avail <= 0) throw ctx.error('bad_input', `clips[${cut.index}] starts at ${kitNum(clip.in_s, 2)}s of a ${kitNum(length, 2)}s clip`);
        cut.hold_s = Math.max(0, cut.frames / fps - avail);
      }
    }
  } else {
    plan = await listedCuts(inputs, ctx, fps);
    if (ending) plan.card = { id: null, start_f: plan.total_f, frames: endingFrames };
    if (ending) plan.total_f += endingFrames;
  }
  if (plan.card) plan.card.hold_s = Math.max(0, plan.card.frames / fps - endingSeconds);

  // One input and one chain per cut, then the end card, joined by the concat filter.
  const gradeChain = assembleGradeChain(grade, w, h);
  const args = [];
  const graph = [];
  const pieces = plan.cuts.map((cut) => ({ ...cut, clip: inputs.clips[cut.index], body: true }));
  if (plan.card) pieces.push({ ...plan.card, clip: { video: ending }, body: false });
  for (const [k, p] of pieces.entries()) {
    const media = p.clip.video || p.clip.image;
    const exact = p.frames / fps;
    if (p.clip.image) args.push('-loop', '1', '-framerate', String(fps), '-t', kitNum(exact + 2 / fps), '-i', media.path);
    else args.push('-ss', kitNum(p.clip.in_s ?? 0), '-t', kitNum(exact + 0.5), '-i', media.path);
    const look = p.clip.image && kenBurns ? assembleKenBurns(w, h, fps, p.frames, zoomTo, fit, background) : `fps=${fps},${assembleFit(w, h, fit, background)}`;
    const finish = p.body && gradeChain ? `,${gradeChain}` : '';
    graph.push(
      `[${k}:v]${look},tpad=stop_mode=clone:stop_duration=${kitNum(p.hold_s + SHORT_TOLERANCE_S + 2 / fps, 4)},` +
        `trim=end_frame=${p.frames},setpts=PTS-STARTPTS${finish},format=yuv420p[v${k}]`,
    );
    if (keepAudio) {
      const info = p.clip.video ? await ctx.tools.probe(media.path) : { has_audio: false };
      graph.push(
        info.has_audio
          ? `[${k}:a]aresample=48000:async=1:first_pts=0,aformat=sample_fmts=fltp:sample_rates=48000:channel_layouts=stereo,apad,atrim=0:${kitNum(exact)},asetpts=PTS-STARTPTS[a${k}]`
          : `anullsrc=channel_layout=stereo:sample_rate=48000,atrim=0:${kitNum(exact)},asetpts=PTS-STARTPTS[a${k}]`,
      );
    }
  }
  const pads = pieces.map((_, k) => (keepAudio ? `[v${k}][a${k}]` : `[v${k}]`)).join('');
  graph.push(`${pads}concat=n=${pieces.length}:v=1:a=${keepAudio ? 1 : 0}${keepAudio ? '[vout][aout]' : '[vout]'}`);
  const out = ['-filter_complex', graph.join(';'), '-map', '[vout]'];
  if (keepAudio) out.push('-map', '[aout]', ...ctx.tools.encodeArgs('aac'));
  out.push(...ctx.tools.encodeArgs('h264-master'), ...assembleRateCap(grade), '-r', String(fps), join(ctx.workDir, 'assembled.mp4'));
  await kitFfmpeg(ctx, [...args, ...out]);
  const video = await ctx.file('assembled.mp4', 'video');
  if (video.bytes > ASSEMBLE_MAX_BYTES) {
    const mb = (n) => Math.round(n / (1024 * 1024));
    throw ctx.error('output_invalid', `the cut is ${mb(video.bytes)} MB, over the ${mb(ASSEMBLE_MAX_BYTES)} MB a finished video may be; make it shorter or drop the grain look`);
  }
  const total = plan.total_f / fps;
  const got = await ctx.tools.probe(video.path);
  if (!Number.isFinite(got.duration_s) || Math.abs(got.duration_s - total) > 1.5 / fps) {
    throw ctx.error('output_invalid', `the cut is ${got.duration_s}s, expected ${kitNum(total, 3)}s`);
  }

  // The timeline: scenes by cut (or the clips' own timeline), speech passed through, the end card and its logo box.
  const seconds = t3(plan.total_f, fps);
  const bodyEnd = plan.card ? t3(plan.card.start_f, fps) : seconds;
  let scenes;
  let zones = [];
  if (!inputs.spans && inputs.timeline) {
    const tl = inputs.timeline;
    scenes = assembleClampScenes(tl.scenes, bodyEnd);
    const scale = (tl.width !== w || tl.height !== h) && tl.width > 0 && tl.height > 0;
    for (const z of tl.safe_zones || []) {
      const moved = scale ? assembleMapZone(z, tl.width, tl.height, w, h, fit) : { ...z };
      if (moved) zones.push(moved);
    }
  } else {
    scenes = plan.cuts.map((c) => ({ id: c.id, start_s: t3(c.start_f, fps), end_s: t3(c.start_f + c.frames, fps) }));
  }
  if (plan.card && plan.card.id) scenes.push({ id: plan.card.id, start_s: bodyEnd, end_s: seconds });
  const speech = assembleClampSpeech(inputs.speech ?? (inputs.timeline ? inputs.timeline.speech : []), seconds);
  const timeline = { duration_s: seconds, width: w, height: h, fps, scenes, speech };
  if (plan.card) {
    timeline.end_card = { start_s: bodyEnd, end_s: seconds };
    const et = inputs.ending_timeline;
    const logo = et && (et.safe_zones || []).find((z) => z.use === 'logo');
    const moved = logo ? assembleMapZone(logo, et.width, et.height, w, h, fit) : null;
    if (moved) zones = [...zones.filter((z) => z.use !== 'logo'), moved];
  }
  if (zones.length) timeline.safe_zones = zones;
  return kitCheckOutputs(ctx, manifest, { video, seconds, timeline });
}

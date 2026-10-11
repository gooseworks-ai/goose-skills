// splice: a new opening on a kept body. The last footage entry is a finished
// ad; everything from the cut (its start_ms, snapped to the first frame at or
// after it) to its end is kept: the picture frame for frame, the sound at the
// same sample positions and level. The opening (a hook video, or a first
// footage entry cut to its window) is converted to the body's size, frame
// rate, pixel format and sound format, and hard-cut in front.
//
// The body's picture is stream-copied when it is H.264 in an MP4 and the cut
// lands on a keyframe; otherwise the whole cut is re-encoded at CRF 12 or lower
// under the 16 Mbit/s cap. Either way every kept frame and the kept sound are
// checked against the original (a port of render-hook-replacement's
// replace_hook.py), and a failed check or an output over the size limit is
// refused before anything is uploaded. Captions, loudness and end cards are
// deliberately not touched: the body already has its own.
import { stat, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { kitCheckInputs, kitCheckOutputs, kitFfmpeg, kitNum } from '../../_lib/part.mjs';
import { kitMediaLength } from '../../_lib/length.mjs';
import { spliceColorTags, spliceIsLfsPointer, splicePackets, spliceProbe, spliceSha256, spliceSourceFacts } from './source.mjs';
import { spliceCompareAudio, spliceCompareVideo } from './checks.mjs';
import { SPLICE_MAX_MB, spliceProjectedBytes, spliceSizeProblem } from './size.mjs';

const SPLICE_MAX_HOOK_S = 60;

/** The final picture encode: the kit's master preset at CRF 12 or lower, High profile, under the §4.12 cap. */
export function spliceVideoArgs(ctx) {
  const args = ctx.tools.encodeArgs('h264-master');
  const i = args.indexOf('-crf');
  if (i >= 0) args[i + 1] = String(Math.min(Number(args[i + 1]), 12));
  else args.push('-crf', '12');
  return [...args, '-profile:v', 'high', '-maxrate', '16M', '-bufsize', '32M'];
}

/** The final sound encode: the kit's AAC preset at 256k and the target's own sample rate. */
export function spliceAudioArgs(ctx, rate) {
  const args = ctx.tools.encodeArgs('aac');
  const set = (flag, value) => {
    const i = args.indexOf(flag);
    if (i >= 0) args[i + 1] = value;
    else args.push(flag, value);
  };
  set('-b:a', '256k');
  set('-ar', String(rate));
  return args;
}

function spliceHookChain(facts, frames) {
  const { width: w, height: h } = facts;
  const square = "scale='trunc(iw*sar/2)*2':'trunc(ih/2)*2'";
  const tags = spliceColorTags(facts.color);
  return (
    `fps=${facts.fps_text},${square},scale=${w}:${h}:force_original_aspect_ratio=decrease,pad=${w}:${h}:(ow-iw)/2:(oh-ih)/2:color=black,setsar=1,format=yuv420p,${tags ? `${tags},` : ''}` +
    `tpad=stop_mode=clone:stop_duration=${kitNum(0.1 + 2 / facts.fps, 4)},trim=end_frame=${frames},setpts=PTS-STARTPTS`
  );
}

function spliceHookInput(hook, hook_s) {
  const args = [];
  if (hook.start_s > 0) args.push('-ss', kitNum(hook.start_s));
  args.push('-t', kitNum(hook_s + 0.5), '-i', hook.file.path);
  return args;
}

/** The sound graph: the opening's own sound (or silence), then the body's from t0, both in the target format. */
function spliceAudioGraph({ hookIn, hookAudio, srcIn, srcAudio, target, hook_s, t0, body_s }) {
  const fmt = `aformat=sample_fmts=fltp:sample_rates=${target.sample_rate}:channel_layouts=${target.layout}`;
  const silence = (d) => `anullsrc=r=${target.sample_rate}:cl=${target.layout},atrim=duration=${kitNum(d, 9)},${fmt}`;
  const ha = hookAudio
    ? `[${hookIn}:a]aresample=${target.sample_rate},${fmt},asetpts=PTS-STARTPTS,apad,atrim=duration=${kitNum(hook_s, 9)}[ha]`
    : `${silence(hook_s)}[ha]`;
  const ba = srcAudio
    ? `[${srcIn}:a]atrim=start=${kitNum(t0, 9)}:end=${kitNum(t0 + body_s, 9)},asetpts=PTS-STARTPTS,${fmt},apad,atrim=duration=${kitNum(body_s, 9)}[ba]`
    : `${silence(body_s)}[ba]`;
  return `${ha};${ba};[ha][ba]concat=n=2:v=0:a=1[a]`;
}

/** Re-encodes the whole cut in one pass. */
async function spliceByEncode(ctx, { hook, body, facts, frames, hook_s, hookAudio, srcAudio, target, out }) {
  const args = [...spliceHookInput(hook, hook_s), '-i', body.path];
  const graph = [`[0:v]${spliceHookChain(facts, frames)}[hv]`, `[1:v]trim=start_frame=${facts.k},setpts=PTS-STARTPTS[bv]`, '[hv][bv]concat=n=2:v=1:a=0[v]'];
  if (target) graph.push(spliceAudioGraph({ hookIn: 0, hookAudio, srcIn: 1, srcAudio, target, hook_s, t0: facts.t0, body_s: facts.body_s }));
  args.push('-filter_complex', graph.join(';'), '-map', '[v]', ...spliceVideoArgs(ctx), '-fps_mode', 'passthrough');
  if (target) args.push('-map', '[a]', ...spliceAudioArgs(ctx, target.sample_rate));
  args.push('-movflags', '+faststart', out);
  await kitFfmpeg(ctx, args);
}

/**
 * Encodes only the opening and stream-copies the body's picture after it: both go through MPEG-TS
 * (in-band parameter sets) and the concat demuxer, with the opening's exact length as its duration.
 * The sound is laid in a second pass, re-encoded, because AAC frames never land on the cut.
 */
async function spliceByCopy(ctx, { hook, body, facts, frames, hook_s, hookAudio, srcAudio, target, out }) {
  const t = (name) => join(ctx.tmpDir, name);
  await kitFfmpeg(ctx, [...spliceHookInput(hook, hook_s), '-map', '0:v:0', '-an', '-vf', spliceHookChain(facts, frames), ...spliceVideoArgs(ctx), t('hook.mp4')]);
  await kitFfmpeg(ctx, ['-i', t('hook.mp4'), '-map', '0:v:0', '-c', 'copy', '-bsf:v', 'h264_mp4toannexb', '-f', 'mpegts', t('hook.ts')]);
  // Seeking a stream copy lands on the keyframe at or before the time asked; the cut is a keyframe, so ask a quarter frame past it.
  await kitFfmpeg(ctx, ['-ss', kitNum(facts.t0 + 0.25 / facts.fps, 9), '-i', body.path, '-map', '0:v:0', '-an', '-c', 'copy', '-bsf:v', 'h264_mp4toannexb', '-f', 'mpegts', t('body.ts')]);
  await writeFile(t('list.txt'), `ffconcat version 1.0\nfile 'hook.ts'\nduration ${kitNum(hook_s, 9)}\nfile 'body.ts'\n`);
  await kitFfmpeg(ctx, ['-f', 'concat', '-i', t('list.txt'), '-map', '0:v:0', '-c', 'copy', t('picture.mp4')]);
  const args = ['-i', t('picture.mp4')];
  let next = 1;
  let hookIn = -1;
  let srcIn = -1;
  if (target && hookAudio) {
    args.push(...spliceHookInput(hook, hook_s));
    hookIn = next++;
  }
  if (target && srcAudio) {
    args.push('-i', body.path);
    srcIn = next++;
  }
  if (target) args.push('-filter_complex', spliceAudioGraph({ hookIn, hookAudio, srcIn, srcAudio, target, hook_s, t0: facts.t0, body_s: facts.body_s }));
  args.push('-map', '0:v:0', '-c:v', 'copy');
  if (target) args.push('-map', '[a]', ...spliceAudioArgs(ctx, target.sample_rate));
  args.push('-movflags', '+faststart', out);
  await kitFfmpeg(ctx, args);
}

async function spliceVerify(ctx, { out, body, facts, frames, hook_s, srcAudio, checks }) {
  const got = await ctx.tools.probe(out);
  const total = hook_s + facts.body_s;
  const duration_ok = Number.isFinite(got.duration_s) && Math.abs(got.duration_s - total) <= 1 / facts.fps + 0.002;
  const video = await spliceCompareVideo(ctx, { src: body.path, k: facts.k, out, n: frames, expected: facts.frames, psnr_min: checks.psnr_min });
  const audio = await spliceCompareAudio(ctx, {
    src: body.path, t0: facts.t0, out, start_s: hook_s, seconds: facts.body_s, source_audio: srcAudio,
    output_has_audio: !!got.has_audio, nrmse_max: checks.audio_nrmse_max, corr_min: checks.audio_corr_min,
  });
  const why = [];
  if (!duration_ok) why.push(`the cut is ${kitNum(got.duration_s || 0, 3)}s, expected ${kitNum(total, 3)}s`);
  if (!video.passed) {
    why.push(
      video.frames !== facts.frames || video.output_frames !== facts.frames
        ? `the kept picture has ${video.output_frames} frames, the original ${video.frames} from the cut (expected ${facts.frames})`
        : `a kept frame is ${video.psnr_min} dB from the original, under ${checks.psnr_min} dB`,
    );
  }
  if (!audio.passed) {
    why.push(
      audio.error ||
        (srcAudio ? `the kept sound differs from the original (error ${audio.nrmse}, correlation ${audio.corr})` : 'the original is silent after the cut, but the output is not'),
    );
  }
  return { video, audio, passed: !why.length, why };
}

const r3 = (x) => +x.toFixed(3);

export async function run(inputs, ctx) {
  const manifest = await kitCheckInputs(ctx, inputs);
  const checks = { psnr_min: 45, audio_nrmse_max: 0.08, audio_corr_min: 0.99, ...(inputs.checks || {}) };
  const max_mb = inputs.max_mb ?? SPLICE_MAX_MB;
  const footage = inputs.footage;
  if (footage.length > 2) throw ctx.error('bad_input', `footage has ${footage.length} entries; splice takes the original ad last and at most one opening clip before it`);
  const bodyEntry = footage.at(-1);
  if ((bodyEntry.kind ?? 'video') === 'image') throw ctx.error('bad_input', 'the last footage entry is the original ad; it must be a video or a finished render, not an image');
  const body = bodyEntry.file || bodyEntry.video;

  let hook;
  if (inputs.hook) {
    if (footage.length === 2) throw ctx.error('bad_input', 'there is a hook video and an opening clip in footage; give only one opening');
    hook = { file: inputs.hook, start_s: 0, end_s: null, audio: true };
  } else if (footage.length === 2) {
    const e = footage[0];
    if ((e.kind ?? 'video') === 'image') throw ctx.error('bad_input', 'the opening clip (footage[0]) is an image; splice needs a video opening');
    hook = { file: e.file || e.video, start_s: (e.start_ms ?? 0) / 1000, end_s: e.end_ms == null ? null : e.end_ms / 1000, audio: e.audio !== false };
  } else {
    throw ctx.error('bad_input', 'splice needs a new opening: a hook video, or the opening clip as the first footage entry');
  }
  for (const [what, f] of [['original ad', body], ['opening', hook.file]]) {
    if (await spliceIsLfsPointer(f.path)) throw ctx.error('bad_input', `the ${what} is a Git LFS pointer, not media; fetch the real file`);
  }

  const info = await spliceProbe(ctx, body.path);
  const packets = await splicePackets(ctx, body.path);
  const facts = spliceSourceFacts(info, packets, {
    cut_s: (bodyEntry.start_ms ?? 0) / 1000,
    end_s: bodyEntry.end_ms == null ? null : bodyEntry.end_ms / 1000,
  });
  if (facts.problem) throw ctx.error('bad_input', facts.problem);

  const hookInfo = await spliceProbe(ctx, hook.file.path);
  if (!hookInfo.video) throw ctx.error('bad_input', 'the new opening has no picture');
  const hookLength = await kitMediaLength(ctx, hook.file);
  const hookEnd = hook.end_s ?? hookLength;
  if (!(hookEnd > hook.start_s)) throw ctx.error('bad_input', 'the opening clip\'s window is empty');
  if (hookEnd > hookLength + 0.1) throw ctx.error('bad_input', `the opening clip's window ends at ${kitNum(hookEnd, 2)}s of a ${kitNum(hookLength, 2)}s clip`);
  const frames = Math.round((hookEnd - hook.start_s) * facts.fps);
  if (frames < 1) throw ctx.error('bad_input', 'the opening is shorter than one frame');
  const hook_s = frames / facts.fps;
  if (hook_s > SPLICE_MAX_HOOK_S) throw ctx.error('bad_input', `the opening is ${kitNum(hook_s, 1)}s; at most ${SPLICE_MAX_HOOK_S}s`);

  const srcAudio = info.audio;
  const hookAudio = hook.audio && hookInfo.audio && hookInfo.audio.layout && hookInfo.audio.sample_rate ? hookInfo.audio : null;
  const target = srcAudio || hookAudio;
  const total = hook_s + facts.body_s;
  const plan = { hook, body, facts, frames, hook_s, hookAudio, srcAudio, target, out: join(ctx.workDir, 'spliced.mp4') };

  const projected = {
    copy: spliceProjectedBytes({ mode: 'copy', seconds: total, hook_s, kept_bytes: facts.kept_bytes, body_s: facts.body_s }),
    encode: spliceProjectedBytes({ mode: 'encode', seconds: total, hook_s, kept_bytes: facts.kept_bytes, body_s: facts.body_s }),
  };
  let copied = false;
  let verdict = null;
  if (facts.copyable && !spliceSizeProblem(projected.copy, max_mb)) {
    ctx.progress({ fraction: 0.1 });
    await spliceByCopy(ctx, plan);
    verdict = await spliceVerify(ctx, { ...plan, checks });
    if (verdict.passed) copied = true;
    else ctx.log.warn('the stream-copied body failed its checks; re-encoding the cut', { why: verdict.why });
  } else if (!facts.key_at_cut) {
    ctx.log.info('the cut is not on a keyframe, so the cut is re-encoded', { cut_s: facts.t0 });
  }
  if (!copied) {
    const problem = spliceSizeProblem(projected.encode, max_mb, { projected: true });
    if (problem) throw ctx.error('output_invalid', problem);
    ctx.progress({ fraction: 0.5 });
    await spliceByEncode(ctx, plan);
    verdict = await spliceVerify(ctx, { ...plan, checks });
    if (!verdict.passed) throw ctx.error('output_invalid', `the kept body does not match the original: ${verdict.why.join('; ')}`);
  }

  const bytes = (await stat(plan.out)).size;
  const tooBig = spliceSizeProblem(bytes, max_mb);
  if (tooBig) throw ctx.error('output_invalid', tooBig);
  const source_sha256 = await spliceSha256(body.path);
  if (body.sha256 && body.sha256 !== source_sha256) throw ctx.error('output_invalid', 'the original ad changed while it was being spliced');
  if (hook.file.sha256 && hook.file.sha256 !== (await spliceSha256(hook.file.path))) throw ctx.error('output_invalid', 'the opening changed while it was being spliced');

  ctx.progress({ fraction: 1 });
  const video = await ctx.file('spliced.mp4', 'video');
  const timeline = {
    duration_s: r3(total),
    width: facts.width,
    height: facts.height,
    fps: facts.fps,
    scenes: [
      { id: 'hook', start_s: 0, end_s: r3(hook_s) },
      { id: 'body', start_s: r3(hook_s), end_s: r3(total) },
    ],
    speech: ((inputs.hook_timeline && inputs.hook_timeline.speech) || [])
      .filter((s) => s.start_s < hook_s)
      .map((s) => ({ ...s, end_s: Math.min(s.end_s, r3(hook_s)) })),
  };
  const card = inputs.body_timeline && inputs.body_timeline.end_card;
  if (card) {
    const shift = hook_s - facts.t0;
    const start_s = Math.max(hook_s, card.start_s + shift);
    const end_s = Math.min(total, card.end_s + shift);
    if (end_s > start_s + 0.01) timeline.end_card = { start_s: r3(start_s), end_s: r3(end_s) };
  }
  const retained = {
    start_s: r3(hook_s),
    end_s: r3(total),
    cut_s: r3(facts.t0),
    frames: facts.frames,
    exact_frames: verdict.video.exact,
    psnr_min: verdict.video.psnr_min,
    audio_nrmse: verdict.audio.nrmse,
    audio_corr: verdict.audio.corr,
    copied,
    source_sha256,
  };
  ctx.log.info('spliced', { copied, frames: facts.frames, exact_frames: retained.exact_frames, psnr_min: retained.psnr_min, audio_corr: retained.audio_corr, bytes });
  return kitCheckOutputs(ctx, manifest, { video, seconds: r3(total), timeline, retained });
}

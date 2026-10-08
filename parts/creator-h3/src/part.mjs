// creator-h3: an AI creator talking to camera, saying the approved lines, as
// one continuous track (D6: the default for scripted lines). The
// create-creator-takes-h3 atom in JavaScript: takes split between lines under
// H3's 15 s cap, each 0.6 s past its last word; the atom's prompt word for word
// with the person and room from the approved character; every take sent to
// fal's minimax/h3-max/reference-to-video with the atom's payload
// (prompt_expansion_mode disabled, so the dialogue stays verbatim); the first
// take ordered alone and its own voice handed to every later take as reference
// audio, so the takes sound like one recording; then joined with 0.10 s
// dissolves. A policy refusal is final for that take (the line says so).
import { join } from 'node:path';
import { kitCheckInputs, kitCheckOutputs, kitDuration, kitFfmpeg, kitNum, kitStopIfAborted } from '../../_lib/part.mjs';
import { H3_DEFAULT_DELIVERY, H3_MANNERISM, H3_TEMPLATE } from './prompt.mjs';

const MODEL = 'minimax/h3-max/reference-to-video';
const MAX_TAKE = 15;
const MIN_TAKE = 5;
const MAX_SPEECH = 14.2;
const TAIL = 0.6;
const XF = 0.1;
const LEAD = 0.11;
const PAD = 0.03;
const VOICE_CLIP = ['-vn', '-t', '12', '-ac', '1', '-ar', '24000'];

/** The atom's identity guards: a person nobody was asked about reads as an AI composite. */
function checkCharacter(ch) {
  const ident = String(ch.identity || '').trim();
  const low = ident.toLowerCase();
  if (!ident) return 'the character needs an identity: the person, in the words that made the image';
  if (ident.includes('...') || low.startsWith('<') || low.includes('ask the user') || low.includes('user chose')) return 'the character identity is still a placeholder; there is no default person';
  if (!/\b(\d{2}s?|teen|twenties|thirties|forties|fifties|sixties|year[- ]old)\b/.test(low)) return 'the character identity states no age';
  if (!/\b(man|woman|male|female|non[- ]binary|guy|girl|boy|lady)\b/.test(low)) return 'the character identity states no gender';
  return null;
}

/** Lines with estimated spans (words at `wps`, a short pause between lines), split greedily into takes under MAX_SPEECH. */
function planTakes(lines, wps) {
  let t = 0;
  const timed = lines.map((l) => {
    const words = l.text.split(/\s+/).filter(Boolean).length;
    const span = { ...l, start: t, end: t + words / wps };
    t = span.end + 0.3;
    return span;
  });
  const takes = [];
  let cur = [];
  for (const l of timed) {
    if (cur.length && l.end - cur[0].start > MAX_SPEECH) {
      takes.push(cur);
      cur = [];
    }
    cur.push(l);
  }
  if (cur.length) takes.push(cur);
  return takes.map((group, i) => {
    const start = group[0].start;
    const end = group.at(-1).end;
    return { id: `t${i + 1}`, lines: group, covers: [start, end], dur: Math.max(MIN_TAKE, Math.min(MAX_TAKE, Math.ceil(end - start + TAIL))) };
  });
}

function prompt(character, mannerism, dialogue) {
  return H3_TEMPLATE.replace('{identity}', character.identity.trim())
    .replace('{environment}', String(character.environment || '').trim())
    .replace('{mannerism}', mannerism ? H3_MANNERISM : '')
    .replace('{delivery}', String(character.delivery || H3_DEFAULT_DELIVERY).trim())
    .replace('{dialogue}', dialogue);
}

/** Where speech starts in a take (silence before the first word), from ffmpeg's silence detector. */
async function onset(ctx, path) {
  const { stderr } = await kitFfmpeg(ctx, ['-v', 'info', '-t', '3', '-i', path, '-af', 'silencedetect=noise=-35dB:d=0.03', '-f', 'null', '-']);
  const m = /silence_start: (-?[0-9.]+)[\s\S]*?silence_end: ([0-9.]+)/.exec(stderr);
  return m && Number(m[1]) <= 0.02 ? Number(m[2]) : 0;
}

/** join_takes.py's estimated schedule: each take placed at its planned start, joined with 0.10 s dissolves. */
function schedule(takes, end, fps) {
  const xf = Math.round(XF * fps) / fps;
  const out = takes.map((t, k) => {
    const first = t.onset || LEAD;
    const pad = k ? Math.max(0, xf + PAD - first) : 0;
    const desired = k ? Math.max(0, t.start - first - pad) : 0;
    return { ...t, start: Math.ceil((desired - 1e-8) * fps) / fps, head_pad: pad };
  });
  // With no requested end, the reel runs to the end of the last take.
  const lastTake = out.at(-1);
  let actualEnd = end == null ? Math.floor((lastTake.start + lastTake.head_pad + lastTake.duration + 1e-8) * fps) / fps : Math.ceil((end - 1e-8) * fps) / fps;
  if (out.length === 1) actualEnd = Math.min(actualEnd, Math.floor((takes[0].duration + 1e-8) * fps) / fps);
  out.forEach((t, k) => {
    t.body_end = (k + 1 < out.length ? out[k + 1].start : actualEnd) - t.start;
    t.need = t.body_end + (k + 1 < out.length ? xf : 0);
    if (t.body_end <= (k ? xf : 0)) throw new Error('takes overlap too closely to join');
    const short = t.need - t.duration - t.head_pad;
    if (short > 0.02) throw new Error(`take ${t.id} is ${t.duration.toFixed(2)}s but must run ${(t.need - t.head_pad).toFixed(2)}s to reach its join`);
    t.tail_pad = Math.max(0, short);
  });
  return { fps, xf, duration: actualEnd, takes: out };
}

async function joinTakes(ctx, plan, out) {
  const { fps, xf } = plan;
  const fc = [];
  const pieces = [];
  const audio = [];
  const n = plan.takes.length;
  const args = [];
  for (const [k, t] of plan.takes.entries()) {
    args.push('-i', t.path);
    const video = (i, start, end, label) =>
      `[${i}:v]tpad=start_duration=${kitNum(t.head_pad)}:start_mode=clone:stop_duration=${kitNum(t.tail_pad + 0.05)}:stop_mode=clone,` +
      `trim=start=${kitNum(start)}:end=${kitNum(end)},setpts=PTS-STARTPTS,fps=${fps},settb=AVTB,setsar=1,format=yuv420p[${label}]`;
    fc.push(video(k, k ? xf : 0, t.body_end, `body${k}`));
    pieces.push(`[body${k}]`);
    if (k + 1 < n) {
      fc.push(video(k, t.body_end, t.body_end + xf, `xa${k}`));
      const next = plan.takes[k + 1];
      fc.push(`[${k + 1}:v]tpad=start_duration=${kitNum(next.head_pad)}:start_mode=clone,trim=0:${kitNum(xf)},setpts=PTS-STARTPTS,fps=${fps},settb=AVTB,setsar=1,format=yuv420p[xb${k}]`);
      fc.push(`[xa${k}][xb${k}]xfade=duration=${kitNum(xf)}:offset=0[x${k}]`);
      pieces.push(`[x${k}]`);
    }
    const stereo = t.channels === 1 ? 'pan=stereo|c0=c0|c1=c0' : 'aformat=channel_layouts=stereo';
    fc.push(`[${k}:a]aresample=48000,${stereo},adelay=${kitNum(t.head_pad * 1000)}:all=1,apad,atrim=0:${kitNum(t.need)},asetpts=PTS-STARTPTS[a${k}]`);
    audio.push(`[a${k}]`);
  }
  fc.push(`${pieces.join('')}concat=n=${pieces.length}:v=1:a=0,fps=${fps},trim=duration=${kitNum(plan.duration)},setpts=PTS-STARTPTS[v]`);
  let prev = audio[0];
  for (let k = 1; k < n; k++) {
    fc.push(`${prev}${audio[k]}acrossfade=d=${kitNum(xf)}:c1=tri:c2=tri[ac${k}]`);
    prev = `[ac${k}]`;
  }
  await kitFfmpeg(ctx, [...args, '-filter_complex', fc.join(';'), '-map', '[v]', '-map', prev, '-t', kitNum(plan.duration), ...ctx.tools.encodeArgs('h264-master'), ...ctx.tools.encodeArgs('aac'), out]);
}

export async function run(inputs, ctx) {
  const manifest = await kitCheckInputs(ctx, inputs);
  const problem = checkCharacter(inputs.character);
  if (problem) throw ctx.error('bad_input', problem);
  const lines = inputs.scenes
    .map((s, i) => ({ scene_id: s.id == null ? String(i + 1) : String(s.id), text: String(s.line || '').replace(/\s+/g, ' ').trim() }))
    .filter((l) => l.text);
  if (!lines.length) throw ctx.error('bad_input', 'no scene has a line to say');
  for (const l of lines) if (/\[[^\]]*\]/.test(l.text)) throw ctx.error('bad_input', `scene ${l.scene_id} has square brackets, which H3 speaks aloud`);
  const takes = planTakes(lines, inputs.words_per_second ?? 2.6);
  for (const t of takes) if (t.covers[1] - t.covers[0] > MAX_SPEECH) throw ctx.error('bad_input', `scene ${t.lines[0].scene_id} alone runs past one take; shorten it`);
  const seconds = takes.reduce((a, t) => a + t.dur, 0);
  if (seconds > inputs.max_seconds) throw ctx.error('bad_input', `the lines need ${seconds}s of takes, more than max_seconds ${inputs.max_seconds}`);

  const resolution = inputs.resolution ?? '1080P';
  const aspect = inputs.aspect_ratio ?? '9:16';
  let voice = null;
  const made = [];
  for (const [k, t] of takes.entries()) {
    kitStopIfAborted(ctx);
    const piece = `take-${t.id}`;
    const dialogue = t.lines.map((l) => l.text).join(' <pause> ');
    const body = {
      prompt: prompt(inputs.character, !!inputs.mannerism, dialogue),
      duration: t.dur,
      resolution,
      aspect_ratio: aspect,
      seed: 300000 + (ctx.seed(piece) % 600000),
      prompt_expansion_mode: 'disabled',
      reference_image_urls: [inputs.character.image],
    };
    if (inputs.mannerism) body.reference_video_urls = [inputs.mannerism];
    if (voice) body.reference_audio_urls = [voice];
    const result = await ctx.line.order({ piece, provider: 'fal', path: `/${MODEL}`, body, results: [{ pointer: '/json/video/url', name: `${t.id}.mp4`, media: 'video' }] });
    const file = result.files[`${t.id}.mp4`];
    if (!file) throw ctx.error('provider_failed', `no video for ${piece}`);
    const info = await ctx.tools.probe(file.path);
    if (!info.has_audio) throw ctx.error('provider_failed', `${piece} came back without its voice`);
    made.push({ ...t, file, path: file.path, duration: await kitDuration(ctx, file), start: t.covers[0], onset: await onset(ctx, file.path) });
    if (k === 0 && takes.length > 1) {
      // The first take's own voice, handed to every later take (our generated voice, never a real person's).
      await kitFfmpeg(ctx, ['-i', file.path, ...VOICE_CLIP, join(ctx.tmpDir, 't1-voice.wav')]);
      voice = await ctx.file(`${ctx.tmpDir.slice(ctx.workDir.length + 1)}/t1-voice.wav`, 'audio');
    }
    ctx.progress({ done: k + 1, total: takes.length });
  }
  for (const t of made) {
    const { stdout } = await ctx.tools.exec('ffprobe', ['-v', 'error', '-select_streams', 'a:0', '-show_entries', 'stream=channels', '-of', 'csv=p=0', t.path]);
    t.channels = Number(String(stdout).trim().split(',')[0]) || 2;
  }
  let plan;
  try {
    plan = schedule(made, null, 30);
  } catch (e) {
    throw ctx.error('output_invalid', e.message);
  }
  await joinTakes(ctx, plan, join(ctx.workDir, 'creator.mp4'));
  const video = await ctx.file('creator.mp4', 'video');
  const info = await ctx.tools.probe(video.path);
  // Estimated line spans on the reel (captions and the check transcribe the real speech).
  const speech = [];
  for (const t of plan.takes) {
    const shift = t.start + t.head_pad + (t.onset || LEAD) - t.covers[0];
    for (const l of t.lines) speech.push({ scene_id: l.scene_id, text: l.text, start_s: +Math.max(0, l.start + shift).toFixed(3), end_s: +Math.min(plan.duration, l.end + shift).toFixed(3) });
  }
  const timeline = {
    duration_s: +plan.duration.toFixed(3),
    width: info.width,
    height: info.height,
    fps: 30,
    scenes: speech.map((s, i) => ({ id: s.scene_id, start_s: s.start_s, end_s: i + 1 < speech.length ? speech[i + 1].start_s : +plan.duration.toFixed(3) })),
    speech,
  };
  return kitCheckOutputs(ctx, manifest, {
    video,
    seconds: timeline.duration_s,
    timeline,
    takes: plan.takes.map((t) => ({ id: t.id, video: t.file, start_s: +t.start.toFixed(3), scene_ids: t.lines.map((l) => l.scene_id) })),
  });
}

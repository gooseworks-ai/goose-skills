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
//
// 1.1.0: the creator can come from the plan cast (the speaker's member, else the
// first member with a picture), with the identity written from the member's
// age, gender and look; `delivery` sets how they speak; brand pronunciations are
// swapped into the spoken dialogue only (the timeline keeps the written words);
// and `split_before: cutaways` lets a take start only at a cutaway scene, so
// every join can hide under footage. Each later take reports `joins_s`, the
// reel second its dissolve starts. Take pieces stay `take-t<n>`: a take covers
// several scenes, so it is never reused as one scene's piece on a fix.
import { join } from 'node:path';
import { kitCheckInputs, kitCheckOutputs, kitDuration, kitFfmpeg, kitNum, kitStopIfAborted } from '../../_lib/part.mjs';
import { kitApplySayAs } from '../../_lib/speech-map.mjs';
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
const COVER_LEAD = 0.15;
const MIN_SPAN = 0.05;
const GENDER_WORD = { female: 'woman', male: 'man', nonbinary: 'non-binary person' };

/** The atom's identity guards: a person nobody was asked about reads as an AI composite. */
function checkCharacter(ch, who = 'the character') {
  const ident = String(ch.identity || '').trim();
  const low = ident.toLowerCase();
  if (!ident) return `${who} needs an identity: the person, in the words that made the image`;
  if (ident.includes('...') || low.startsWith('<') || low.includes('ask the user') || low.includes('user chose')) return `${who} identity is still a placeholder; there is no default person`;
  if (!/\b(\d{2}s?|teen|twenties|thirties|forties|fifties|sixties|year[- ]old)\b/.test(low)) return `${who} identity states no age`;
  if (!/\b(man|woman|male|female|non[- ]binary|guy|girl|boy|lady)\b/.test(low)) return `${who} identity states no gender`;
  return null;
}

const cleanText = (v) => (typeof v === 'string' ? v.replace(/\s+/g, ' ').trim() : '');

/** A cast member's identity in the atom's words: "a 34-year-old woman, <look>". */
function memberIdentity(member) {
  const gender = GENDER_WORD[member.gender] || '';
  const age = Number.isInteger(member.age) ? member.age : null;
  let who = '';
  if (age != null && gender) who = `a ${age}-year-old ${gender}`;
  else if (gender) who = `a ${gender}`;
  else if (age != null) who = `${age} years old`;
  return [who, cleanText(member.look)].filter(Boolean).join(', ');
}

/**
 * The creator for this step: {character, who}. From the cast, the member the spoken
 * scenes name as speaker, else the first member with a picture; else `character`.
 * Returns {problem} when there is none, or the choice is unclear.
 */
function pickCreator(inputs, lines) {
  const cast = Array.isArray(inputs.cast) ? inputs.cast : [];
  if (cast.length && inputs.character) return { problem: 'give cast or character, not both' };
  if (!cast.length) {
    if (!inputs.character) return { problem: 'there is no creator: give the plan cast or a character' };
    return { character: inputs.character, who: 'the character' };
  }
  const byKey = new Map(cast.map((m) => [m.key, m]));
  const speakers = [];
  for (const l of lines) {
    if (!l.speaker) continue;
    if (!byKey.has(l.speaker)) return { problem: `scene ${l.scene_id}'s speaker "${l.speaker}" is not in the cast` };
    if (!speakers.includes(l.speaker)) speakers.push(l.speaker);
  }
  if (speakers.length > 1) return { problem: `one creator says every line, but the scenes name ${speakers.length} speakers (${speakers.join(', ')})` };
  const member = speakers.length ? byKey.get(speakers[0]) : cast.find((m) => m.image);
  if (!member) return { problem: 'no cast member has a picture; draw the creator first (an anchor step)' };
  if (!member.image) return { problem: `cast member ${member.key} has no picture; draw the creator first (an anchor step)` };
  return {
    character: { image: member.image, identity: memberIdentity(member), environment: cleanText(member.environment), delivery: cleanText(member.delivery) },
    who: `cast member ${member.key}`,
  };
}

/** Is this scene a cutaway (something other than the creator fills the screen)? */
function isCutaway(scene, id, footageScenes) {
  const shot = scene.extra && typeof scene.extra === 'object' ? scene.extra.shot : null;
  if (typeof shot === 'string' && shot.trim() && shot.trim().toLowerCase() !== 'creator') return true;
  if (footageScenes.has(id)) return true;
  return !!(scene.image && typeof scene.image === 'object');
}

/**
 * Lines with estimated spans (spoken words at `wps`, a short pause between lines),
 * split greedily into takes under MAX_SPEECH. A take may start only at a line whose
 * `split` is true (every line when nothing restricts it); the lines from one such
 * start to the next are a run that must fit one take, or {problem} is returned.
 */
function planTakes(lines, wps) {
  let t = 0;
  const timed = lines.map((l) => {
    const words = l.spoken.split(/\s+/).filter(Boolean).length;
    const span = { ...l, start: t, end: t + words / wps };
    t = span.end + 0.3;
    return span;
  });
  const runs = [];
  for (const [i, l] of timed.entries()) {
    if (i === 0 || l.split) runs.push([]);
    runs.at(-1).push(l);
  }
  for (const r of runs) {
    const span = r.at(-1).end - r[0].start;
    if (span <= MAX_SPEECH) continue;
    if (r.length === 1) return { problem: `scene ${r[0].scene_id} alone runs past one take; shorten it` };
    return {
      problem: `scenes ${r[0].scene_id} to ${r.at(-1).scene_id} are one on-camera run of about ${span.toFixed(1)}s with no cutaway to hide a take join (one take holds ${MAX_SPEECH}s); make a spoken scene between them a cutaway or cut words`,
    };
  }
  const takes = [];
  let cur = [];
  for (const r of runs) {
    if (cur.length && r.at(-1).end - cur[0].start > MAX_SPEECH) {
      takes.push(cur);
      cur = [];
    }
    cur.push(...r);
  }
  if (cur.length) takes.push(cur);
  return takes.map((group, i) => {
    const start = group[0].start;
    const end = group.at(-1).end;
    return { id: `t${i + 1}`, lines: group, covers: [start, end], dur: Math.max(MIN_TAKE, Math.min(MAX_TAKE, Math.ceil(end - start + TAIL))) };
  });
}

function prompt(character, delivery, mannerism, dialogue) {
  // Function replacers: a $ in a look or a line is never read as a replacement pattern.
  return H3_TEMPLATE.replace('{identity}', () => character.identity.trim())
    .replace('{environment}', () => String(character.environment || '').trim())
    .replace('{mannerism}', () => (mannerism ? H3_MANNERISM : ''))
    .replace('{delivery}', () => delivery)
    .replace('{dialogue}', () => dialogue);
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
  let before = 0;
  let prev = 0;
  const out = takes.map((t, k) => {
    const first = t.onset || LEAD;
    const pad = k ? Math.max(0, xf + PAD - first) : 0;
    // A late speech onset can pull a join back to the reel start. Keep every join at least two
    // dissolves after the previous take's start and MIN_SPAN per earlier line from the reel start,
    // so the previous take has a body and every earlier scene keeps a span before the join.
    const floor = k ? Math.max(prev + 2 * xf, MIN_SPAN * before + COVER_LEAD) : 0;
    const desired = k ? Math.max(floor, t.start - first - pad) : 0;
    before += t.lines ? t.lines.length : 0;
    prev = Math.ceil((desired - 1e-8) * fps) / fps;
    return { ...t, start: prev, head_pad: pad };
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
  const footageScenes = new Set((inputs.footage || []).map((f) => (f && f.scene_id != null ? String(f.scene_id) : null)).filter(Boolean));
  const cutaways = inputs.split_before === 'cutaways';
  const lines = [];
  for (const [i, s] of inputs.scenes.entries()) {
    const scene_id = s.id == null ? String(i + 1) : String(s.id);
    const written = cleanText(s.line);
    if (!written) continue;
    const spoken = cleanText(kitApplySayAs(written, inputs.pronunciations).spoken);
    // A take may start only at a spoken cutaway: a silent scene has no span on the timeline, so nothing
    // placed by scene could cover a join on the creator scene after it.
    lines.push({ scene_id, text: written, spoken, speaker: cleanText(s.speaker), split: !cutaways || isCutaway(s, scene_id, footageScenes) });
  }
  if (!lines.length) throw ctx.error('bad_input', 'no scene has a line to say');
  for (const l of lines) if (/\[[^\]]*\]/.test(l.spoken)) throw ctx.error('bad_input', `scene ${l.scene_id} has square brackets, which H3 speaks aloud`);
  const creator = pickCreator(inputs, lines);
  if (creator.problem) throw ctx.error('bad_input', creator.problem);
  const problem = checkCharacter(creator.character, creator.who);
  if (problem) throw ctx.error('bad_input', problem);
  // The character's own delivery is trimmed only, as 1.0.2 did; a cast member's was cleaned in pickCreator.
  const delivery = cleanText(inputs.delivery) || String(creator.character.delivery || '').trim() || H3_DEFAULT_DELIVERY.trim();
  const takes = planTakes(lines, inputs.words_per_second ?? 2.6);
  if (takes.problem) throw ctx.error('bad_input', takes.problem);
  const seconds = takes.reduce((a, t) => a + t.dur, 0);
  if (seconds > inputs.max_seconds) throw ctx.error('bad_input', `the lines need ${seconds}s of takes, more than max_seconds ${inputs.max_seconds}`);

  const resolution = inputs.resolution ?? '1080P';
  const aspect = inputs.aspect_ratio ?? '9:16';
  let voice = null;
  const made = [];
  for (const [k, t] of takes.entries()) {
    kitStopIfAborted(ctx);
    const piece = `take-${t.id}`;
    const dialogue = t.lines.map((l) => l.spoken).join(' <pause> ');
    const body = {
      prompt: prompt(creator.character, delivery, !!inputs.mannerism, dialogue),
      duration: t.dur,
      resolution,
      aspect_ratio: aspect,
      seed: 300000 + (ctx.seed(piece) % 600000),
      prompt_expansion_mode: 'disabled',
      reference_image_urls: [creator.character.image],
    };
    if (inputs.mannerism) body.reference_video_urls = [inputs.mannerism];
    if (voice) body.reference_audio_urls = [voice];
    const result = await ctx.line.order({ piece, provider: 'fal', path: MODEL, body, results: [{ pointer: '/json/video/url', name: `${t.id}.mp4`, media: 'video' }] });
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
    for (const l of t.lines) {
      const entry = { scene_id: l.scene_id, text: l.text, start_s: +Math.max(0, l.start + shift).toFixed(3), end_s: +Math.min(plan.duration, l.end + shift).toFixed(3) };
      if (l.spoken !== l.text) entry.spoken = l.spoken;
      speech.push(entry);
    }
  }
  // Scene spans tile the reel from each line's start. With split_before cutaways, the scene a later
  // take starts on begins COVER_LEAD before its join, so an insert on that scene covers the whole dissolve.
  const starts = speech.map((s) => s.start_s);
  if (cutaways) {
    let at = 0;
    for (const t of plan.takes.slice(1)) {
      at = speech.findIndex((s, i) => i >= at && s.scene_id === t.lines[0].scene_id);
      if (at <= 0) continue;
      // Never later than the line itself or the join. Earlier scenes give way (each keeps MIN_SPAN) so the
      // spans stay positive and in order; an earlier line's estimated end may then run past its scene's
      // end, which the heard timing retimes. schedule() keeps every join at least MIN_SPAN per earlier
      // line plus COVER_LEAD from the reel start, so the floor here never passes the join.
      starts[at] = +Math.max(MIN_SPAN * at, Math.min(starts[at], t.start - COVER_LEAD)).toFixed(3);
      for (let i = at - 1; i >= 0 && starts[i] > starts[i + 1] - MIN_SPAN; i--) starts[i] = +Math.max(MIN_SPAN * i, starts[i + 1] - MIN_SPAN).toFixed(3);
    }
  }
  const timeline = {
    duration_s: +plan.duration.toFixed(3),
    width: info.width,
    height: info.height,
    fps: 30,
    scenes: speech.map((s, i) => ({ id: s.scene_id, start_s: starts[i], end_s: i + 1 < speech.length ? starts[i + 1] : +plan.duration.toFixed(3) })),
    speech,
  };
  return kitCheckOutputs(ctx, manifest, {
    video,
    seconds: timeline.duration_s,
    timeline,
    takes: plan.takes.map((t, k) => {
      const take = { id: t.id, video: t.file, start_s: +t.start.toFixed(3), scene_ids: t.lines.map((l) => l.scene_id) };
      if (k) take.joins_s = take.start_s;
      return take;
    }),
  });
}

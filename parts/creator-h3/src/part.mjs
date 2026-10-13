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
//
// 1.2.0: measured joins (the default, `join: measured`): each take's speech is
// measured with ffmpeg's silence detector (where the first word starts, where
// the trailing silence begins), and the next take is placed so its first word
// comes 0.25 s after the previous take's last word, never inside it; the reel
// ends 0.6 s after the last word. Line spans are spread over each take's
// measured speech. `join: planned` keeps 1.1.0's schedule (each take at its
// estimated start). And `mode: clips`: a silent clip per picked scene (5 s by
// default) that opens on that scene's keyframe from `images`, with the
// prompt from the style's template (its motion text); the clip's sound is
// dropped. Clip pieces are `clip-<scene id>`.
//
// 1.2.1: measured line spans. Inside each take, the boundary between two lines
// is placed on a silence the detector heard between them (the pause H3 makes
// at <pause>), so a scene starts on its first word and ends after its last;
// 1.2.0 spread the lines' estimated lengths over the take's speech, and an
// insert placed by scene could start mid-word. A boundary with no silence in
// reach keeps 1.2.0's estimate.
import { join } from 'node:path';
import { kitCheckInputs, kitCheckOutputs, kitDuration, kitFfmpeg, kitNum, kitPieceName, kitStopIfAborted } from '../../_lib/part.mjs';
import { KitPromptGap, kitLoadTemplate, kitScenePrompts, kitTemplateFrom } from '../../_lib/prompt.mjs';
import { kitPickScenes, kitTagKey } from '../../_lib/scene-match.mjs';
import { kitApplySayAs } from '../../_lib/speech-map.mjs';
import { H3_CLIP_TEMPLATE, H3_DEFAULT_DELIVERY, H3_MANNERISM, H3_TEMPLATE } from './prompt.mjs';

const MODEL = 'minimax/h3-max/reference-to-video';
const MAX_TAKE = 15;
const MIN_TAKE = 5;
const MAX_SPEECH = 14.2;
const TAIL = 0.6;
const XF = 0.1;
const LEAD = 0.11;
/** H3 says about 3.2 words a second at most (measured takes); a faster plan packs takes it then rushes or cuts. */
const H3_PLAN_WPS = 3.2;
const PAD = 0.03;
const VOICE_CLIP = ['-vn', '-t', '12', '-ac', '1', '-ar', '24000'];
const COVER_LEAD = 0.15;
const MIN_SPAN = 0.05;
const GENDER_WORD = { female: 'woman', male: 'man', nonbinary: 'non-binary person' };
// Measured joins: the silence from one take's last word to the next take's first,
// and the most a take's last frame may be held to reach its join (a take whose voice
// runs to its very end).
const GAP = 0.25;
const MAX_HOLD = 0.5;
// Measured line spans: a silence this long inside a take's speech is between words, and one is worth
// moving a line boundary for while its length beats this share of its distance from the estimate.
const LINE_GAP_MIN = 0.12;
const LINE_GAP_REACH = 0.25;
// Clips mode.
const CLIP_SECONDS = 5;
const CLIPS_AT_ONCE = 3;
const MAX_REFS = 12;
const PROMPT_MAX = 50000;
const TALK_ONLY = ['character', 'delivery', 'pronunciations', 'split_before', 'footage', 'mannerism', 'words_per_second', 'join'];
const CLIPS_ONLY = ['images', 'template', 'use', 'look', 'answers', 'brand', 'products', 'pick', 'skip_first', 'skip_last', 'seconds'];

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

/**
 * Where speech starts and ends in a take, from ffmpeg's silence detector:
 * {onset, end}. onset is the end of a silence that opens the take (0 when the
 * voice starts at once); end is the start of the silence that runs to the end
 * of the take (the take's length when there is none). Null when no speech is heard.
 */
function speechBounds(stderr, duration) {
  const starts = [...stderr.matchAll(/silence_start: (-?[0-9.]+)/g)].map((m) => Number(m[1]));
  const ends = [...stderr.matchAll(/silence_end: ([0-9.]+)/g)].map((m) => Number(m[1]));
  const onset = starts.length && starts[0] <= 0.02 && ends.length ? ends[0] : 0;
  const last = starts.length - 1;
  const end = last >= 0 && (ends.length <= last || ends[last] >= duration - 0.05) ? Math.max(0, starts[last]) : duration;
  return end > onset + 0.05 ? { onset, end } : null;
}

/** planned: where speech starts in a take, read from its first 3 s exactly as 1.1.0 did (so the schedule is 1.1.0's). */
async function plannedOnset(ctx, path) {
  const { stderr } = await kitFfmpeg(ctx, ['-v', 'info', '-t', '3', '-i', path, '-af', 'silencedetect=noise=-35dB:d=0.03', '-f', 'null', '-']);
  const m = /silence_start: (-?[0-9.]+)[\s\S]*?silence_end: ([0-9.]+)/.exec(stderr);
  return m && Number(m[1]) <= 0.02 ? Number(m[2]) : 0;
}

/** The silences inside a take's speech (between its first word and its last), at least LINE_GAP_MIN long. */
export function speechGaps(stderr, bounds, duration) {
  const starts = [...stderr.matchAll(/silence_start: (-?[0-9.]+)/g)].map((m) => Number(m[1]));
  const ends = [...stderr.matchAll(/silence_end: ([0-9.]+)/g)].map((m) => Number(m[1]));
  return starts
    .map((start, i) => ({ start, end: i < ends.length ? ends[i] : duration }))
    .filter((g) => g.start > bounds.onset + 0.02 && g.end < bounds.end - 0.02 && g.end - g.start >= LINE_GAP_MIN);
}

async function measureSpeech(ctx, path, duration) {
  const { stderr } = await kitFfmpeg(ctx, ['-v', 'info', '-i', path, '-af', 'silencedetect=noise=-35dB:d=0.03', '-f', 'null', '-']);
  const bounds = speechBounds(String(stderr), duration);
  return bounds && { ...bounds, gaps: speechGaps(String(stderr), bounds, duration) };
}

/**
 * Where each line of one take is spoken, in take seconds: [{start, end}] per line. `estimate(x)` maps a line's
 * estimated time onto the take (1.2.0's spread); `gaps` are the silences heard inside the speech. Each boundary
 * between two lines goes on the silence that best trades its length against its distance from the estimated
 * boundary (in order, each silence used once); a boundary with no silence worth it keeps the estimate.
 */
export function lineSpans(lines, gaps, onset, end, estimate) {
  const m = lines.length;
  const est = [];
  for (let i = 0; i + 1 < m; i++) est.push(estimate((lines[i].end + lines[i + 1].start) / 2));
  const n = gaps.length;
  // best[i][j]: the most gain placing boundaries i.. on silences j..; each boundary takes one silence or none.
  const best = Array.from({ length: est.length + 1 }, () => new Array(n + 1).fill(0));
  const move = Array.from({ length: est.length + 1 }, () => new Array(n + 1).fill('boundary'));
  for (let i = est.length - 1; i >= 0; i--) {
    for (let j = n; j >= 0; j--) {
      let v = best[i + 1][j];
      let how = 'boundary';
      if (j < n && best[i][j + 1] > v + 1e-9) {
        v = best[i][j + 1];
        how = 'silence';
      }
      if (j < n) {
        const g = gaps[j];
        const gain = g.end - g.start - LINE_GAP_REACH * Math.abs((g.start + g.end) / 2 - est[i]);
        if (gain > 0 && gain + best[i + 1][j + 1] > v + 1e-9) {
          v = gain + best[i + 1][j + 1];
          how = 'use';
        }
      }
      best[i][j] = v;
      move[i][j] = how;
    }
  }
  const chosen = new Array(est.length).fill(null);
  for (let i = 0, j = 0; i < est.length; ) {
    const how = move[i][j];
    if (how === 'use') chosen[i++] = gaps[j++];
    else if (how === 'silence') j++;
    else i++;
  }
  const out = lines.map((l, i) => ({
    start: i === 0 ? onset : chosen[i - 1] ? chosen[i - 1].end : estimate(l.start),
    end: i === m - 1 ? end : chosen[i] ? chosen[i].start : estimate(l.end),
  }));
  for (let i = 0; i < m; i++) {
    if (i) out[i].start = Math.max(out[i].start, out[i - 1].end);
    out[i].end = Math.min(end, Math.max(out[i].end, out[i].start));
  }
  // A heard boundary that leaves a line with next to no time (an estimate on its other side runs past it) is
  // not trusted: the whole take keeps the estimates.
  if (out.some((x) => x.end - x.start < MIN_SPAN)) return lines.map((l) => ({ start: estimate(l.start), end: estimate(l.end) }));
  return out;
}

/**
 * The join schedule, from join_takes.py. planned: each take at its estimated
 * start (speech onset measured). measured: each later take placed so its first
 * word comes GAP after the previous take's measured last word (never sooner than
 * PAD after it), and the reel ends TAIL after the last word. Every later take
 * starts with a 0.10 s dissolve.
 */
function schedule(takes, fps, measured) {
  const xf = Math.round(XF * fps) / fps;
  const snap = (s) => Math.ceil((s - 1e-8) * fps) / fps;
  let before = 0;
  let spoken = 0;
  const out = [];
  for (const [k, t] of takes.entries()) {
    const first = measured ? t.onset : t.onset || LEAD;
    const pad = k ? Math.max(0, xf + PAD - first) : 0;
    let start = 0;
    if (k) {
      const prev = out[k - 1];
      // A late speech onset can pull a join back to the reel start or into the previous take's words.
      // Keep every join at least two dissolves after the previous take's start, MIN_SPAN per earlier line
      // from the reel start (every earlier scene keeps a span before the join), and (planned) late enough
      // that the previous take's estimated speech ends by the end of the dissolve (its audio is cut there).
      // measured places the join from the previous take's heard last word instead.
      const floor = Math.max(prev.start + 2 * xf, MIN_SPAN * before + COVER_LEAD, measured ? 0 : spoken - xf);
      let desired = t.start - first - pad;
      if (measured) {
        const said = prev.start + prev.head_pad + prev.speech_end;
        desired = Math.max(said + PAD, said + GAP - first - pad);
      }
      start = snap(Math.max(floor, desired));
    }
    before += t.lines ? t.lines.length : 0;
    // planned: this take's estimated last word on the reel (the speech entries' shift), never past its own footage.
    const words = t.covers ? t.covers[1] - t.covers[0] : 0;
    spoken = start + pad + Math.min(first + words, t.duration);
    out.push({ ...t, start, head_pad: pad });
  }
  // The reel runs to the end of the last take (measured: TAIL after its last word, within the take).
  const lastTake = out.at(-1);
  let actualEnd = Math.floor((lastTake.start + lastTake.head_pad + lastTake.duration + 1e-8) * fps) / fps;
  if (measured) actualEnd = Math.min(actualEnd, snap(lastTake.start + lastTake.head_pad + lastTake.speech_end + TAIL));
  if (out.length === 1) actualEnd = Math.min(actualEnd, Math.floor((takes[0].duration + 1e-8) * fps) / fps);
  const hold = measured ? MAX_HOLD : 0.02;
  out.forEach((t, k) => {
    t.body_end = (k + 1 < out.length ? out[k + 1].start : actualEnd) - t.start;
    t.need = t.body_end + (k + 1 < out.length ? xf : 0);
    if (t.body_end <= (k ? xf : 0)) throw new Error('takes overlap too closely to join');
    const short = t.need - t.duration - t.head_pad;
    if (short > hold) throw new Error(`take ${t.id} is ${t.duration.toFixed(2)}s but must run ${(t.need - t.head_pad).toFixed(2)}s to reach its join`);
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
  if ((inputs.mode || 'talk') === 'clips') return runClips(inputs, ctx, manifest);
  for (const key of CLIPS_ONLY) if (inputs[key] !== undefined) throw ctx.error('bad_input', `${key} works only in clips mode`);
  const measured = (inputs.join || 'measured') === 'measured';
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
  // A whitespace-only legacy delivery stays empty, exactly as 1.0.2 built the prompt.
  const delivery = cleanText(inputs.delivery) || String(creator.character.delivery || H3_DEFAULT_DELIVERY).trim();
  const takes = planTakes(lines, Math.min(inputs.words_per_second ?? 2.6, H3_PLAN_WPS));
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
    const duration = await kitDuration(ctx, file);
    if (measured) {
      const heard = await measureSpeech(ctx, file.path, duration);
      if (!heard) throw ctx.error('provider_failed', `${piece} came back with no speech to hear`);
      const said = t.lines.reduce((n, l) => n + l.spoken.split(/\s+/).filter(Boolean).length, 0);
      ctx.log.info('take pace', { take: t.id, words: said, wps: +(said / Math.max(0.1, heard.end - heard.onset)).toFixed(2) });
      made.push({ ...t, file, path: file.path, duration, start: t.covers[0], onset: heard.onset, speech_end: heard.end, gaps: heard.gaps });
    } else {
      made.push({ ...t, file, path: file.path, duration, start: t.covers[0], onset: await plannedOnset(ctx, file.path), speech_end: duration });
    }
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
    plan = schedule(made, 30, measured);
  } catch (e) {
    throw ctx.error('output_invalid', e.message);
  }
  await joinTakes(ctx, plan, join(ctx.workDir, 'creator.mp4'));
  const video = await ctx.file('creator.mp4', 'video');
  const info = await ctx.tools.probe(video.path);
  // Line spans on the reel (captions and the check transcribe the real speech). planned: the
  // estimates shifted to the take's onset. measured: each boundary between two lines on a silence heard
  // between them, else the estimates spread over the take's measured speech, from its first word to its last.
  const speech = [];
  for (const t of plan.takes) {
    const base = t.start + t.head_pad;
    const [c0, c1] = t.covers;
    const scale = measured && c1 > c0 ? (t.speech_end - t.onset) / (c1 - c0) : 1;
    const at = (x) => (measured ? base + t.onset + (x - c0) * scale : x + base + (t.onset || LEAD) - c0);
    const spans = measured ? lineSpans(t.lines, t.gaps || [], t.onset, t.speech_end, (x) => t.onset + (x - c0) * scale) : null;
    for (const [i, l] of t.lines.entries()) {
      const from = spans ? base + spans[i].start : at(l.start);
      const to = spans ? base + spans[i].end : at(l.end);
      const entry = { scene_id: l.scene_id, text: l.text, start_s: +Math.max(0, from).toFixed(3), end_s: +Math.min(plan.duration, to).toFixed(3) };
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

/** Runs `work` over `items` a few at a time, keeping their order; after one failure no lane starts another. */
async function eachAtOnce(items, work, atOnce) {
  const out = new Array(items.length);
  let next = 0;
  let failed = false;
  const lanes = Array.from({ length: Math.min(Math.max(1, atOnce), items.length) }, async () => {
    while (next < items.length && !failed) {
      const i = next++;
      try {
        out[i] = await work(items[i], i);
      } catch (err) {
        failed = true;
        throw err;
      }
    }
  });
  await Promise.all(lanes);
  return out;
}

/**
 * The template for clips mode, with an empty by_tag rule for every tag the step
 * picks by, so {picture} drops that "Tag:" lead (a picked tag is a style tag,
 * never a person). The template's own rules are kept.
 */
function clipTemplate(tpl, pick) {
  const tags = pick && typeof pick === 'object' && Array.isArray(pick.tags) ? pick.tags : [];
  const byTag = { ...(tpl.by_tag && typeof tpl.by_tag === 'object' ? tpl.by_tag : {}) };
  const have = new Set(Object.keys(byTag).map(kitTagKey));
  for (const tag of tags) if (!have.has(kitTagKey(tag))) byTag[tag] = {};
  return Object.keys(byTag).length ? { ...tpl, by_tag: byTag } : tpl;
}

/** The reference pictures for one clip: the keyframe first, then the template's refs, each file once, at most MAX_REFS. */
function clipRefs(still, refs) {
  const list = [still];
  for (const m of refs.cast) if (m && m.image) list.push(m.image);
  for (const p of refs.products) if (p && Array.isArray(p.images) && p.images[0]) list.push(p.images[0]);
  if (refs.scene_image) list.push(refs.scene_image);
  const seen = new Set();
  return list.filter((f) => {
    const key = f && (f.path || f.sha256 || f.url);
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  }).slice(0, MAX_REFS);
}

/**
 * mode clips: one silent clip per picked scene. The clip opens on the scene's
 * keyframe (images, by scene id), the prompt is the template's motion text (or
 * the text `use` names), and the provider's sound is dropped. Everything that can
 * refuse happens before the first piece is ordered.
 */
async function runClips(inputs, ctx, manifest) {
  for (const key of TALK_ONLY) if (inputs[key] !== undefined) throw ctx.error('bad_input', `${key} works only in talk mode`);
  if (!inputs.images) throw ctx.error('bad_input', 'clips mode needs images: the keyframes by scene id (step.<keyframes>.images)');
  const seconds = inputs.seconds ?? CLIP_SECONDS;
  let jobs;
  try {
    const base = inputs.template ? await kitLoadTemplate(inputs.template) : kitTemplateFrom(H3_CLIP_TEMPLATE, 'the default clip template');
    const tpl = kitTemplateFrom(clipTemplate(base, inputs.pick), 'the clip template');
    const picked = kitPickScenes(inputs.scenes, inputs.pick ?? 'all', { skip_first: inputs.skip_first, skip_last: inputs.skip_last });
    if (!picked.length) throw new Error('no scene is picked for a clip');
    jobs = kitScenePrompts(tpl, picked, { look: inputs.look, answers: inputs.answers, cast: inputs.cast, products: inputs.products, brand: inputs.brand }, { use: inputs.use || 'motion' });
  } catch (err) {
    if (ctx.signal && ctx.signal.aborted) throw ctx.error('stopped', 'the step was stopped');
    throw ctx.error('bad_input', err instanceof KitPromptGap ? err.message : String((err && err.message) || err));
  }
  const stills = new Map(inputs.images.map((i) => [i.id, i.image]));
  const ids = new Set();
  for (const job of jobs) {
    if (ids.has(job.id)) throw ctx.error('bad_input', `two picked scenes share the id ${job.id}`);
    ids.add(job.id);
    job.still = stills.get(job.id);
    if (!job.still) throw ctx.error('bad_input', `scene ${job.id} has no keyframe in images`);
    if (!job.prompt) throw ctx.error('bad_input', `clip ${job.id} has an empty prompt: give the scene a picture or the template a motion text`);
    if (job.prompt.length > PROMPT_MAX) throw ctx.error('bad_input', `clip ${job.id}'s prompt is over ${PROMPT_MAX} characters`);
  }
  const total = jobs.length * seconds;
  if (total > inputs.max_seconds) throw ctx.error('bad_input', `${jobs.length} clips of ${seconds}s need ${total}s, more than max_seconds ${inputs.max_seconds}`);

  const used = new Set();
  for (const job of jobs) job.piece = kitPieceName('clip', job.id, job.index, used);
  const resolution = inputs.resolution ?? '1080P';
  const aspect = inputs.aspect_ratio ?? '9:16';
  let done = 0;
  const clips = await eachAtOnce(jobs, async (job) => {
    kitStopIfAborted(ctx);
    const body = {
      prompt: job.prompt,
      duration: seconds,
      resolution,
      aspect_ratio: aspect,
      seed: 300000 + (ctx.seed(job.piece) % 600000),
      prompt_expansion_mode: 'disabled',
      image_url: job.still,
      reference_image_urls: clipRefs(job.still, job.refs),
    };
    const result = await ctx.line.order({ piece: job.piece, provider: 'fal', path: MODEL, body, results: [{ pointer: '/json/video/url', name: `${job.piece}.mp4`, media: 'video' }] });
    const file = result && result.files && result.files[`${job.piece}.mp4`];
    if (!file) throw ctx.error('provider_failed', `no video for ${job.piece}`);
    const info = await ctx.tools.probe(file.path);
    if (!info.has_video) throw ctx.error('provider_failed', `${job.piece} came back with no picture`);
    // The sound is dropped, and the clip is made exactly the seconds asked for: cut when H3 runs
    // over (it may run up to 0.7 s over), its last frame held when it comes back short.
    const name = `${job.piece}-silent.mp4`;
    const got = await kitDuration(ctx, file);
    const fit = got < seconds - 0.01
      ? ['-vf', `tpad=stop_mode=clone:stop_duration=${kitNum(seconds - got + 0.1, 3)}`, ...ctx.tools.encodeArgs('h264-intermediate')]
      : ['-c:v', 'copy'];
    await kitFfmpeg(ctx, ['-i', file.path, '-map', '0:v:0', '-an', '-t', kitNum(seconds, 3), ...fit, join(ctx.workDir, name)]);
    const video = await ctx.file(name, 'video');
    const length = await kitDuration(ctx, video);
    ctx.progress({ done: ++done, total: jobs.length });
    return { id: job.id, video, seconds: Number(length.toFixed(3)) };
  }, CLIPS_AT_ONCE);
  const reel = clips.reduce((a, c) => a + c.seconds, 0);
  return kitCheckOutputs(ctx, manifest, { video: clips[0].video, seconds: Number(reel.toFixed(3)), clips });
}

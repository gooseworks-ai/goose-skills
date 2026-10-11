// video-seedance-2 1.2.0: the take and takes modes. One take is one paid
// Seedance reference-to-video piece whose prompt holds several plan scenes as
// time-windowed beats ("Beat 2 (4-8s): ..."), so a creator says every line in
// one recording with native lip-synced audio.
//
//   take   one take of up to 4 picked scenes (a creator product review). A
//          beat whose picture keeps the face off screen (a rear-camera or
//          macro shot) may not carry a line: Seedance would fake a talking
//          mouth. off_screen_lines: 'voiceover' writes it as voice-over instead.
//   takes  takes.count takes (1 to 4) of up to 8 scenes each, split by
//          scene.extra.take or evenly in order. Take 1's text is the template's
//          templates[takes.first], later takes use templates[takes.later] (a
//          street interview asks its question once). chain {crop: 'bottom_45'}
//          hands a face-free still of take 1 (the bottom 45% of one frame) to
//          every later take as one more reference, so they share its street,
//          props and microphone; chained takes run in order.
//
// Takes are joined in order into one `video` with one `timeline` (critic #23):
// scenes are the plan scene ids at their beat windows, scaled to each take's
// real length; speech is empty (transcribe the joined video once). Every prompt
// is written, and every limit checked, before the first piece is ordered.
import { kitDuration, kitFfmpeg, kitNum, kitPieceName, kitStopIfAborted } from '../../_lib/part.mjs';
import { KitPromptGap, kitScenePrompt } from '../../_lib/prompt.mjs';
import { kitPickScenes, kitSceneTag, kitTagKey, kitWholeWordsRe } from '../../_lib/scene-match.mjs';
import { kitApplySayAs } from '../../_lib/speech-map.mjs';
import { join } from 'node:path';
import { statSync } from 'node:fs';

const SD_TAKE_REF = 'bytedance/seedance-2.0/reference-to-video';
// fal's schema for the reference model takes duration as a STRING enum ('auto', '4'..'15'); fal
// called directly answers 422 to an integer. The take modes send the string (the app line's fal
// proxy reads String(body.duration), so it is safe there too); modes reference and image_to_video
// keep their 1.0.1 and 1.1.0 bodies byte for byte.
const SD_TAKE_DURATIONS = ['4', '5', '6', '7', '8', '9', '10', '11', '12', '13', '14', '15'];
const SD_TAKE_PROMPT_MAX = 12000;
const SD_TAKE_MAX_REFS = 9;
const SD_TAKE_MAX_BEATS = 4;
const SD_TAKES_MAX_BEATS = 8;
const SD_TAKE_DEFAULT_SECONDS = 15;
const SD_TAKE_DEFAULT_WPS = 2.5;
// A spoken beat needs its words at words_per_second plus a breath; a silent beat holds this long.
const SD_TAKE_BREATH_S = 0.5;
const SD_TAKE_SILENT_S = 1.5;
// Beat edges are written in half seconds ("8-11.5s"), as the shipped prompts were.
const SD_TAKE_STEP_S = 0.5;
const SD_TAKE_HEAD = ' take head';
const SD_TAKE_PLACEHOLDER_LIKE = /\{[A-Za-z][A-Za-z0-9_.-]*\??\}/;
// A beat keeps the face off screen when its tag (extra.shot or a leading "Tag:") is one of these, or its picture says so.
export const SD_OFF_SCREEN_TAGS = ['rear', 'rear-camera', 'rear-cam', 'back-camera', 'macro', 'hands', 'off-screen', 'cutaway', 'b-roll', 'broll'];
const SD_OFF_SCREEN_RE =
  /\b(?:face\s+(?:is\s+|stays\s+|mostly\s+|fully\s+|kept\s+)?(?:off[- ]?screen|off[- ]?camera|out\s+of\s+(?:the\s+)?frame|not\s+(?:in\s+(?:the\s+)?frame|visible|shown))|rear[- ]camera|rear[- ]facing\s+camera|back\s+camera|no\s+face|faceless)\b/i;
// chain.crop -> the share of the frame's height kept at the bottom (below every face).
const SD_CHAIN_CROPS = { bottom_45: 0.45 };
const SD_CHAIN_DEFAULT_AT_S = 0.5;
// The size rule (MASTER-PLAN §4.12): the join caps its bitrate and refuses an output over 180 MB.
const SD_JOIN_RATE = ['-maxrate', '16M', '-bufsize', '32M'];
const SD_JOIN_MAX_BYTES = 180 * 1024 * 1024;

function sdTakeIsFile(v) {
  return v != null && typeof v === 'object' && v.kind === 'file';
}

/** Spoken words in a line (a token with a letter or digit). */
export function sdTakeWords(text) {
  return String(text == null ? '' : text)
    .split(/\s+/)
    .filter((w) => /[\p{L}\p{N}]/u.test(w)).length;
}

/** Joins prompt parts with one space after an ending mark (a closing quote after one counts), else ". ". Never rewrites a part. */
function sdTakeJoinText(parts) {
  let out = '';
  for (const p of parts.map((x) => String(x == null ? '' : x).trim()).filter(Boolean)) {
    out = !out ? p : /[.!?;:,]["\u201d']?$/.test(out) ? `${out} ${p}` : `${out}. ${p}`;
  }
  return out;
}

function sdTakeSec(x) {
  return String(Number(x.toFixed(2)));
}

/** True when the beat keeps the face off screen: its tag is in `tags`, or its picture says so. */
export function sdTakeFaceOffScreen(scene, tags) {
  const tag = kitSceneTag(scene);
  if (tag && new Set(tags.map(kitTagKey)).has(kitTagKey(tag))) return true;
  return typeof scene.picture === 'string' && SD_OFF_SCREEN_RE.test(scene.picture);
}

/**
 * Beat windows in seconds for one take: each spoken beat needs words / wps + a breath, each silent
 * beat SD_TAKE_SILENT_S; the needs are stretched to fill `seconds` and the edges put on half seconds.
 * Throws when the beats need more than the take holds.
 */
export function sdTakeWindows(words, seconds, wps, who) {
  const need = words.map((w) => (w ? w / wps + SD_TAKE_BREATH_S : SD_TAKE_SILENT_S));
  const total = need.reduce((a, b) => a + b, 0);
  if (total > seconds + 1e-9) {
    throw new Error(`${who}'s beats need ${total.toFixed(1)} s at ${wps} words a second, more than its ${seconds} s; cut words or beats`);
  }
  const scale = seconds / total;
  const edges = [0];
  let acc = 0;
  for (let i = 0; i < need.length; i++) {
    acc += need[i] * scale;
    edges.push(i === need.length - 1 ? seconds : Math.round(acc / SD_TAKE_STEP_S) * SD_TAKE_STEP_S);
  }
  for (let i = 1; i < edges.length - 1; i++) edges[i] = Math.max(edges[i], edges[i - 1] + SD_TAKE_STEP_S);
  for (let i = edges.length - 2; i > 0; i--) edges[i] = Math.min(edges[i], edges[i + 1] - SD_TAKE_STEP_S);
  return need.map((_, i) => ({ start: edges[i], end: edges[i + 1] }));
}

/**
 * The picked scenes split into takes: by scene.extra.take (1-based, in order) when any scene sets it,
 * else evenly in order (earlier takes get the extra scene). Returns [[{scene, index}], ...].
 */
export function sdTakeGroups(picked, count) {
  if (count > picked.length) throw new Error(`${count} takes need at least ${count} scenes; ${picked.length} are picked`);
  const marked = picked.filter((p) => p.scene.extra && p.scene.extra.take != null);
  if (marked.length) {
    if (marked.length !== picked.length) throw new Error('set extra.take on every picked scene, or on none');
    const groups = Array.from({ length: count }, () => []);
    let last = 1;
    for (const p of picked) {
      const t = p.scene.extra.take;
      if (!Number.isInteger(t) || t < 1 || t > count) throw new Error(`scene ${p.scene.id}: extra.take must be a whole number from 1 to ${count}`);
      if (t < last) throw new Error(`scene ${p.scene.id}: extra.take goes back to take ${t}; takes run in plan order`);
      last = t;
      groups[t - 1].push(p);
    }
    const empty = groups.findIndex((g) => !g.length);
    if (empty >= 0) throw new Error(`take ${empty + 1} has no scene`);
    return groups;
  }
  const groups = [];
  let at = 0;
  for (let k = 0; k < count; k++) {
    const size = Math.floor(picked.length / count) + (k < picked.length % count ? 1 : 0);
    groups.push(picked.slice(at, at + size));
    at += size;
  }
  return groups;
}

/** The name a dialogue clause gives the speaker: the cast member's name, the speaker key, the only member, else "They". */
function sdTakeWho(scene, cast) {
  const members = (cast || []).filter(Boolean);
  if (scene.speaker != null) {
    const m = members.find((c) => c.key === scene.speaker);
    if (m && m.name) return String(m.name).trim();
    const key = String(scene.speaker).replace(/_/g, ' ').trim();
    if (key) return `The ${key}`;
  }
  if (members.length === 1 && members[0].name) return String(members[0].name).trim();
  return 'They';
}

/** The raw text a beat is written from: templates.beat, else the scene's by_tag scene, else scene, else "{picture}". */
function sdTakeBeatText(tpl, scene) {
  if (tpl.templates && typeof tpl.templates.beat === 'string') return { use: 'beat', text: tpl.templates.beat };
  const tag = kitSceneTag(scene);
  if (tag && tpl.by_tag && typeof tpl.by_tag === 'object') {
    const key = Object.keys(tpl.by_tag).find((k) => kitTagKey(k) === kitTagKey(tag));
    const rule = key == null ? null : tpl.by_tag[key];
    if (rule && typeof rule.scene === 'string') return { use: 'scene', text: rule.scene };
  }
  return { use: 'scene', text: typeof tpl.scene === 'string' ? tpl.scene : '{picture}' };
}

function sdTakeLeftover(text, who, sceneId) {
  const left = SD_TAKE_PLACEHOLDER_LIKE.exec(text);
  if (left) throw new KitPromptGap(`${who} has an unknown placeholder ${left[0]}`, { placeholder: left[0], scene_id: sceneId });
}

/** Adds refs to the take's ordered lists without repeats. */
function sdTakeAddRefs(into, refs) {
  for (const m of refs.cast) if (!into.cast.some((c) => c.key === m.key)) into.cast.push(m);
  for (const p of refs.products) if (!into.products.some((q) => q.id === p.id)) into.products.push(p);
  if (refs.scene_image && !into.scenes.some((f) => f.sha256 === refs.scene_image.sha256 && f.path === refs.scene_image.path)) into.scenes.push(refs.scene_image);
}

/** The take's reference files in the template's refs order (anchor, product, scene_image), at most `max`. */
function sdTakeRefFiles(tpl, refs, max) {
  const kinds = Array.isArray(tpl.refs) ? tpl.refs : ['anchor', 'product', 'scene_image'];
  const out = [];
  for (const kind of kinds) {
    if (kind === 'anchor') for (const m of refs.cast) if (sdTakeIsFile(m.image)) out.push(m.image);
    if (kind === 'product') for (const p of refs.products) if (Array.isArray(p.images) && sdTakeIsFile(p.images[0])) out.push(p.images[0]);
    if (kind === 'scene_image') out.push(...refs.scenes);
  }
  return out.slice(0, max);
}

/**
 * One take's prompt and references: prefix and the take's own text (templates[head]), one line per
 * beat with its window and its dialogue, then suffix and "Avoid: <negative>". `beats` are
 * [{scene, index}] of this take. Throws (before any order) on every refusal.
 */
export function sdTakePrompt(tpl, base, { id, index, beats, head, seconds, wps, pairs, offScreen }) {
  const who = `take ${id}`;
  const windows = sdTakeWindows(beats.map((b) => sdTakeWords(b.scene.line)), seconds, wps, who);
  const beatTpl = { ...tpl, prefix: undefined, suffix: undefined, negative: undefined };
  const refs = { cast: [], products: [], scenes: [] };
  const negatives = [];
  const lines = [];
  const pictures = [];
  let speaker = null;
  const texts = [];
  for (const [n, { scene, index: at }] of beats.entries()) {
    const line = typeof scene.line === 'string' && scene.line.trim() ? scene.line.replace(/\s+/g, ' ').trim() : null;
    let voiceover = false;
    if (line && offScreen) {
      if (sdTakeFaceOffScreen(scene, offScreen.tags)) {
        if (offScreen.lines === 'refuse') {
          throw new Error(`scene ${scene.id} has a line, but its picture keeps the face off screen; move the line to a beat that shows the face`);
        }
        voiceover = true;
      }
    }
    const spoken = line ? kitApplySayAs(line, pairs).spoken : null;
    const said = { ...scene, line: spoken };
    const pick = sdTakeBeatText(tpl, scene);
    const out = kitScenePrompt(beatTpl, { ...base, scene: said, index: at }, { use: pick.use });
    sdTakeLeftover(out.prompt, `scene ${scene.id}`, scene.id);
    if (out.negative) negatives.push(out.negative);
    sdTakeAddRefs(refs, out.refs);
    let dialogue = '';
    if (spoken && !/\{line\??\}/.test(pick.text)) {
      dialogue = voiceover ? `Voice-over from ${sdTakeWho(scene, base.cast)}, lips not on screen: "${spoken}"` : `${sdTakeWho(scene, base.cast)} says: "${spoken}"`;
    }
    const w = windows[n];
    texts.push(`Beat ${n + 1} (${sdTakeSec(w.start)}-${sdTakeSec(w.end)}s): ${sdTakeJoinText([out.prompt, dialogue])}`);
    if (spoken) lines.push(spoken);
    if (typeof scene.picture === 'string' && scene.picture.trim()) pictures.push(scene.picture.trim());
    if (speaker == null && line && scene.speaker != null) speaker = scene.speaker;
  }
  // The take as one scene, for the text around the beats ({product.name}, {cast_looks}, {answers.KEY}).
  const takeScene = { id, picture: pictures.join('. '), line: lines.join(' '), on_screen: null, speaker, extra: null };
  const headText = head != null && tpl.templates && typeof tpl.templates[head] === 'string' ? tpl.templates[head] : '';
  const headTpl = { ...tpl, by_tag: undefined, suffix: undefined, negative: undefined, templates: { ...(tpl.templates || {}), [SD_TAKE_HEAD]: headText } };
  const tailTpl = { ...tpl, by_tag: undefined, prefix: undefined, templates: { ...(tpl.templates || {}), [SD_TAKE_HEAD]: '' } };
  let headOut;
  let tailOut;
  try {
    headOut = kitScenePrompt(headTpl, { ...base, scene: takeScene, index }, { use: SD_TAKE_HEAD });
    tailOut = kitScenePrompt(tailTpl, { ...base, scene: takeScene, index }, { use: SD_TAKE_HEAD });
  } catch (err) {
    if (err instanceof KitPromptGap) throw new KitPromptGap(err.message.replace(/^scene \S+/, who), err);
    throw err;
  }
  sdTakeLeftover(headOut.prompt, who, null);
  sdTakeLeftover(tailOut.prompt, who, null);
  if (tailOut.negative) negatives.unshift(tailOut.negative);
  sdTakeAddRefs(refs, tailOut.refs);

  let prompt = sdTakeJoinText([headOut.prompt, ...texts, tailOut.prompt]);
  const avoid = [...new Set(negatives.filter(Boolean))];
  if (avoid.length) prompt = sdTakeJoinText([prompt, `Avoid: ${avoid.join(', ')}`]);
  for (const phrase of Array.isArray(tpl.banned) ? tpl.banned : []) {
    const re = kitWholeWordsRe(phrase);
    if (re && re.test(prompt)) throw new KitPromptGap(`${who} uses the banned phrase "${phrase.trim()}"`, { kind: 'banned', phrase: phrase.trim() });
  }
  if (prompt.length > SD_TAKE_PROMPT_MAX) throw new Error(`${who}'s prompt is ${prompt.length} characters, over ${SD_TAKE_PROMPT_MAX}`);
  const max = Math.min(SD_TAKE_MAX_REFS, Number.isInteger(tpl.max_refs) ? tpl.max_refs : SD_TAKE_MAX_REFS);
  const files = sdTakeRefFiles(tpl, refs, max);
  return { id, prompt, refs: files, windows, scene_ids: beats.map((b) => String(b.scene.id)) };
}

/** A take's whole seconds as fal's duration enum value ('4'..'15'); anything else is refused. */
export function sdTakeDuration(seconds) {
  const value = Number.isInteger(seconds) ? String(seconds) : '';
  if (!SD_TAKE_DURATIONS.includes(value)) throw new Error(`a take lasts ${seconds} s; Seedance takes whole seconds from 4 to 15`);
  return value;
}

/** Every take job for mode take or takes, refused here before any piece is ordered. */
export function sdTakeJobs(inputs, tpl) {
  const many = inputs.mode === 'takes';
  const picked = kitPickScenes(inputs.scenes, inputs.pick, { skip_first: inputs.skip_first, skip_last: inputs.skip_last });
  if (!picked.length) throw new Error('no scene is picked for the take');
  const spec = inputs.takes || {};
  const count = many ? spec.count ?? 1 : 1;
  const groups = many ? sdTakeGroups(picked, count) : [picked];
  const limit = many ? SD_TAKES_MAX_BEATS : SD_TAKE_MAX_BEATS;
  const seconds = inputs.seconds ?? SD_TAKE_DEFAULT_SECONDS;
  const duration = sdTakeDuration(seconds);
  const wps = inputs.words_per_second ?? SD_TAKE_DEFAULT_WPS;
  const maxWords = inputs.max_words ?? Math.floor(seconds * wps);
  const named = (key) => tpl.templates && typeof tpl.templates[key] === 'string';
  let first = null;
  let later = null;
  if (many) {
    first = spec.first ?? 'first';
    later = spec.later ?? 'later';
    if (spec.first != null && !named(spec.first)) throw new Error(`takes.first names templates.${spec.first}, which the template does not have`);
    if (spec.later != null && !named(spec.later)) throw new Error(`takes.later names templates.${spec.later}, which the template does not have`);
    if (!named(later)) later = first;
  } else if (named('take')) {
    first = 'take';
  }
  const pairs = inputs.pronunciations ?? (inputs.brand && Array.isArray(inputs.brand.pronunciations) ? inputs.brand.pronunciations : []);
  const offScreen = many ? null : { lines: inputs.off_screen_lines ?? 'refuse', tags: inputs.off_screen_tags ?? SD_OFF_SCREEN_TAGS };
  const base = { look: inputs.look ?? null, answers: inputs.answers ?? null, brand: inputs.brand ?? null, cast: inputs.cast || [], products: inputs.products || [] };
  const jobs = [];
  for (const [k, beats] of groups.entries()) {
    const id = `t${k + 1}`;
    if (beats.length > limit) throw new Error(`take ${id} has ${beats.length} scenes; a take holds at most ${limit} beats`);
    const words = beats.reduce((a, b) => a + sdTakeWords(b.scene.line), 0);
    if (words > maxWords) throw new Error(`take ${id} has ${words} spoken words, more than ${maxWords} for ${seconds} s`);
    const job = sdTakePrompt(tpl, base, { id, index: beats[0].index, beats, head: k === 0 ? first : later, seconds, wps, pairs, offScreen });
    if (!job.refs.length) throw new Error(`take ${id} has no reference image: give cast pictures, product photos or scene pictures the template's refs can use`);
    if (inputs.chain && k > 0 && job.refs.length >= SD_TAKE_MAX_REFS) throw new Error(`take ${id} already has ${SD_TAKE_MAX_REFS} references; the chain still needs one more`);
    jobs.push({ ...job, index: k, seconds, duration });
  }
  return jobs;
}

/** The chain still: one frame of take 1 at chain.at_s, keeping only the bottom share of its height (below every face). */
async function sdTakeChainStill(ctx, take, chain) {
  const keep = SD_CHAIN_CROPS[chain.crop];
  const length = await kitDuration(ctx, take);
  const at = Math.max(0, Math.min(chain.at_s ?? SD_CHAIN_DEFAULT_AT_S, length - 0.1));
  const crop = `crop=iw:trunc(ih*${keep}/2)*2:0:ih-trunc(ih*${keep}/2)*2`;
  await kitFfmpeg(ctx, ['-ss', kitNum(at), '-i', take.path, '-frames:v', '1', '-vf', crop, join(ctx.workDir, 'chain-still.png')]);
  return ctx.file('chain-still.png', 'image');
}

/** The takes joined in order with hard cuts, at the first take's size and frame rate. */
async function sdTakeJoin(ctx, made, audio) {
  const first = made[0].info;
  const w = first.width;
  const h = first.height;
  const fps = first.fps || 24;
  const args = [];
  const fc = [];
  const pieces = [];
  for (const [k, t] of made.entries()) {
    args.push('-i', t.file.path);
    fc.push(
      `[${k}:v]scale=${w}:${h}:force_original_aspect_ratio=decrease,pad=${w}:${h}:(ow-iw)/2:(oh-ih)/2,setsar=1,fps=${kitNum(fps)},` +
        `trim=duration=${kitNum(t.length)},setpts=PTS-STARTPTS,format=yuv420p[v${k}]`,
    );
    pieces.push(`[v${k}]`);
    if (audio) {
      fc.push(`[${k}:a]aresample=48000,aformat=channel_layouts=stereo,apad,atrim=0:${kitNum(t.length)},asetpts=PTS-STARTPTS[a${k}]`);
      pieces.push(`[a${k}]`);
    }
  }
  fc.push(`${pieces.join('')}concat=n=${made.length}:v=1:a=${audio ? 1 : 0}${audio ? '[v][a]' : '[v]'}`);
  const out = join(ctx.workDir, 'takes.mp4');
  await kitFfmpeg(ctx, [
    ...args,
    '-filter_complex',
    fc.join(';'),
    '-map',
    '[v]',
    ...(audio ? ['-map', '[a]'] : []),
    ...ctx.tools.encodeArgs('h264-master'),
    ...SD_JOIN_RATE,
    ...(audio ? ctx.tools.encodeArgs('aac') : []),
    out,
  ]);
  const bytes = statSync(out).size;
  if (bytes > SD_JOIN_MAX_BYTES) throw ctx.error('output_invalid', `the joined takes are ${Math.round(bytes / 1048576)} MB, over 180 MB`);
  return ctx.file('takes.mp4', 'video');
}

/** Runs mode take or takes: orders each take in order, then joins them. Returns the part's outputs. */
export async function sdRunTakes(inputs, ctx, jobs) {
  const audio = inputs.generate_audio ?? true;
  const used = new Set();
  for (const j of jobs) j.piece = kitPieceName('take', j.id, j.index, used);
  const made = [];
  let still = null;
  for (const [k, j] of jobs.entries()) {
    kitStopIfAborted(ctx);
    const piece = j.piece;
    const refs = still ? [...j.refs, still] : j.refs;
    const body = {
      prompt: j.prompt,
      image_urls: refs,
      resolution: inputs.resolution ?? '1080p',
      duration: j.duration,
      aspect_ratio: inputs.aspect_ratio ?? '9:16',
      generate_audio: audio,
      seed: ctx.seed(piece) % 2147483647,
    };
    const result = await ctx.line.order({ piece, provider: 'fal', path: SD_TAKE_REF, body, results: [{ pointer: '/json/video/url', name: `${piece}.mp4`, media: 'video' }] });
    const file = result && result.files && result.files[`${piece}.mp4`];
    if (!file) throw ctx.error('provider_failed', `no video for ${piece}`);
    const info = await ctx.tools.probe(file.path);
    if (audio && !info.has_audio) throw ctx.error('provider_failed', `${piece} came back without its native audio`);
    if (!info.width || !info.height) throw ctx.error('provider_failed', `${piece} came back without a picture`);
    made.push({ job: j, file, info, length: await kitDuration(ctx, file) });
    if (k === 0 && inputs.chain && jobs.length > 1) still = await sdTakeChainStill(ctx, file, inputs.chain);
    ctx.progress({ done: k + 1, total: jobs.length });
  }
  const video = made.length === 1 ? made[0].file : await sdTakeJoin(ctx, made, audio);
  const info = made.length === 1 ? made[0].info : await ctx.tools.probe(video.path);
  const duration = made.length === 1 ? made[0].length : await kitDuration(ctx, video);
  // Beat windows were written for j.seconds; each take's real length stretches them.
  const scenes = [];
  let offset = 0;
  for (const t of made) {
    const k = t.length / t.job.seconds;
    for (const [n, w] of t.job.windows.entries()) {
      const last = n === t.job.windows.length - 1;
      scenes.push({ id: t.job.scene_ids[n], start_s: +Math.min(duration, offset + w.start * k).toFixed(3), end_s: +Math.min(duration, last ? offset + t.length : offset + w.end * k).toFixed(3) });
    }
    offset += t.length;
  }
  if (scenes.length) scenes[scenes.length - 1].end_s = +duration.toFixed(3);
  const timeline = { duration_s: +duration.toFixed(3), width: info.width, height: info.height, fps: info.fps || made[0].info.fps || 24, scenes, speech: [] };
  const takes = made.map((t) => ({ id: t.job.id, video: t.file, seconds: t.job.seconds }));
  return { clips: takes, takes, video, seconds: timeline.duration_s, timeline };
}

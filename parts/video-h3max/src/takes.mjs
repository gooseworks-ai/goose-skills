// H3 Max take planning, adapted from video-seedance-2 1.2.0. Each take holds
// timed scene beats and their speakers. Chained takes share a cropped still,
// then join into one video. Timeline scene windows scale to the measured
// provider durations; speech is left to a single downstream transcription.
import { kitDuration, kitFfmpeg, kitNum, kitPieceName, kitStopIfAborted } from '../../_lib/part.mjs';
import { KitPromptGap, kitScenePrompt } from '../../_lib/prompt.mjs';
import { kitPickScenes, kitSceneTag, kitTagKey, kitWholeWordsRe } from '../../_lib/scene-match.mjs';
import { kitApplySayAs } from '../../_lib/speech-map.mjs';
import { join } from 'node:path';
import { statSync } from 'node:fs';
import { H3SCENE_MODEL, h3SceneProviderBody, h3SceneProviderPrompt, h3SceneProviderVideo } from './provider.mjs';
import { h3ScenePrepareReferences } from './frames.mjs';

const H3SCENE_TAKE_PROMPT_MAX = 12000;
const H3SCENE_TAKE_MAX_REFS = 9;
const H3SCENE_TAKE_MAX_BEATS = 4;
const H3SCENE_TAKES_MAX_BEATS = 8;
const H3SCENE_TAKE_DEFAULT_SECONDS = 15;
const H3SCENE_TAKE_DEFAULT_WPS = 2.5;
// A spoken beat needs its words at words_per_second plus a breath; a silent beat holds this long.
const H3SCENE_TAKE_BREATH_S = 0.5;
const H3SCENE_TAKE_SILENT_S = 1.5;
// Beat edges are written in half seconds ("8-11.5s"), as the shipped prompts were.
const H3SCENE_TAKE_STEP_S = 0.5;
const H3SCENE_TAKE_HEAD = ' take head';
const H3SCENE_TAKE_PLACEHOLDER_LIKE = /\{[A-Za-z][A-Za-z0-9_.-]*\??\}/;
// A beat keeps the face off screen when its tag (extra.shot or a leading "Tag:") is one of these, or its picture says so.
export const H3SCENE_OFF_SCREEN_TAGS = ['rear', 'rear-camera', 'rear-cam', 'back-camera', 'macro', 'hands', 'off-screen', 'cutaway', 'b-roll', 'broll'];
const H3SCENE_OFF_SCREEN_RE =
  /\b(?:face\s+(?:is\s+|stays\s+|mostly\s+|fully\s+|kept\s+)?(?:off[- ]?screen|off[- ]?camera|out\s+of\s+(?:the\s+)?frame|not\s+(?:in\s+(?:the\s+)?frame|visible|shown))|rear[- ]camera|rear[- ]facing\s+camera|back\s+camera|no\s+face|faceless)\b/i;
// chain.crop -> the share of the frame's height kept at the bottom (below every face).
const H3SCENE_CHAIN_CROPS = { bottom_45: 0.45 };
const H3SCENE_CHAIN_DEFAULT_AT_S = 0.5;
// The size rule (MASTER-PLAN §4.12): the join caps its bitrate and refuses an output over 180 MB.
const H3SCENE_JOIN_RATE = ['-maxrate', '16M', '-bufsize', '32M'];
const H3SCENE_JOIN_MAX_BYTES = 180 * 1024 * 1024;

function h3SceneTakeIsFile(v) {
  return v != null && typeof v === 'object' && v.kind === 'file';
}

/** Spoken words in a line (a token with a letter or digit). */
export function h3SceneTakeWords(text) {
  return String(text == null ? '' : text)
    .split(/\s+/)
    .filter((w) => /[\p{L}\p{N}]/u.test(w)).length;
}

/** Joins prompt parts with one space after an ending mark (a closing quote after one counts), else ". ". Never rewrites a part. */
function h3SceneTakeJoinText(parts) {
  let out = '';
  for (const p of parts.map((x) => String(x == null ? '' : x).trim()).filter(Boolean)) {
    out = !out ? p : /[.!?;:,]["\u201d']?$/.test(out) ? `${out} ${p}` : `${out}. ${p}`;
  }
  return out;
}

/** A scene's line as it will be said (whitespace tidied, brand respellings applied), else null. */
function h3SceneTakeSpokenLine(scene, pairs) {
  const line = typeof scene.line === 'string' && scene.line.trim() ? scene.line.replace(/\s+/g, ' ').trim() : null;
  return line ? kitApplySayAs(line, pairs).spoken : null;
}

function h3SceneTakeSec(x) {
  return String(Number(x.toFixed(2)));
}

/** True when the beat keeps the face off screen: its tag is in `tags`, or its picture says so. */
export function h3SceneTakeFaceOffScreen(scene, tags) {
  const tag = kitSceneTag(scene);
  if (tag && new Set(tags.map(kitTagKey)).has(kitTagKey(tag))) return true;
  return typeof scene.picture === 'string' && H3SCENE_OFF_SCREEN_RE.test(scene.picture);
}

/**
 * Beat windows in seconds for one take: each spoken beat needs words / wps + a breath, each silent
 * beat H3SCENE_TAKE_SILENT_S; the needs are stretched to fill `seconds` and the edges put on half seconds.
 * Throws when the beats need more than the take holds.
 */
export function h3SceneTakeWindows(words, seconds, wps, who) {
  const need = words.map((w) => (w ? w / wps + H3SCENE_TAKE_BREATH_S : H3SCENE_TAKE_SILENT_S));
  const total = need.reduce((a, b) => a + b, 0);
  if (total > seconds + 1e-9) {
    throw new Error(`${who}'s beats need ${total.toFixed(1)} s at ${wps} words a second, more than its ${seconds} s; cut words or beats`);
  }
  const scale = seconds / total;
  const edges = [0];
  let acc = 0;
  for (let i = 0; i < need.length; i++) {
    acc += need[i] * scale;
    edges.push(i === need.length - 1 ? seconds : Math.round(acc / H3SCENE_TAKE_STEP_S) * H3SCENE_TAKE_STEP_S);
  }
  for (let i = 1; i < edges.length - 1; i++) edges[i] = Math.max(edges[i], edges[i - 1] + H3SCENE_TAKE_STEP_S);
  for (let i = edges.length - 2; i > 0; i--) edges[i] = Math.min(edges[i], edges[i + 1] - H3SCENE_TAKE_STEP_S);
  return need.map((_, i) => ({ start: edges[i], end: edges[i + 1] }));
}

/**
 * The picked scenes split into takes: by scene.extra.take (1-based, in order) when any scene sets it,
 * else evenly in order (earlier takes get the extra scene). Returns [[{scene, index}], ...].
 */
export function h3SceneTakeGroups(picked, count) {
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
function h3SceneTakeWho(scene, cast) {
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
function h3SceneTakeBeatText(tpl, scene) {
  if (tpl.templates && typeof tpl.templates.beat === 'string') return { use: 'beat', text: tpl.templates.beat };
  const tag = kitSceneTag(scene);
  if (tag && tpl.by_tag && typeof tpl.by_tag === 'object') {
    const key = Object.keys(tpl.by_tag).find((k) => kitTagKey(k) === kitTagKey(tag));
    const rule = key == null ? null : tpl.by_tag[key];
    if (rule && typeof rule.scene === 'string') return { use: 'scene', text: rule.scene };
  }
  return { use: 'scene', text: typeof tpl.scene === 'string' ? tpl.scene : '{picture}' };
}

function h3SceneTakeLeftover(text, who, sceneId) {
  const left = H3SCENE_TAKE_PLACEHOLDER_LIKE.exec(text);
  if (left) throw new KitPromptGap(`${who} has an unknown placeholder ${left[0]}`, { placeholder: left[0], scene_id: sceneId });
}

/** Adds refs to the take's ordered lists without repeats. */
function h3SceneTakeAddRefs(into, refs) {
  for (const m of refs.cast) if (!into.cast.some((c) => c.key === m.key)) into.cast.push(m);
  for (const p of refs.products) if (!into.products.some((q) => q.id === p.id)) into.products.push(p);
  if (refs.scene_image && !into.scenes.some((f) => f.sha256 === refs.scene_image.sha256 && f.path === refs.scene_image.path)) into.scenes.push(refs.scene_image);
}

/** The take's reference files in the template's refs order (anchor, product, scene_image), at most `max`. */
function h3SceneTakeRefFiles(tpl, refs, max) {
  const kinds = Array.isArray(tpl.refs) ? tpl.refs : ['anchor', 'product', 'scene_image'];
  const out = [];
  for (const kind of kinds) {
    if (kind === 'anchor') for (const m of refs.cast) if (h3SceneTakeIsFile(m.image)) out.push(m.image);
    if (kind === 'product') for (const p of refs.products) if (Array.isArray(p.images) && h3SceneTakeIsFile(p.images[0])) out.push(p.images[0]);
    if (kind === 'scene_image') out.push(...refs.scenes);
  }
  if (out.length > max) throw new Error(`the take picked ${out.length} reference images; the template allows at most ${max}`);
  return out;
}

/**
 * One take's prompt and references: prefix and the take's own text (templates[head]), one line per
 * beat with its window and its dialogue, then suffix and "Avoid: <negative>". `beats` are
 * [{scene, index}] of this take. Throws (before any order) on every refusal.
 */
export function h3SceneTakePrompt(tpl, base, { id, index, beats, head, seconds, wps, pairs, offScreen }) {
  const who = `take ${id}`;
  // Windows and word limits count the words as said, after the respellings (a term can say as several words).
  const windows = h3SceneTakeWindows(beats.map((b) => h3SceneTakeWords(h3SceneTakeSpokenLine(b.scene, pairs))), seconds, wps, who);
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
      if (h3SceneTakeFaceOffScreen(scene, offScreen.tags)) {
        if (offScreen.lines === 'refuse') {
          throw new Error(`scene ${scene.id} has a line, but its picture keeps the face off screen; move the line to a beat that shows the face`);
        }
        voiceover = true;
      }
    }
    const spoken = h3SceneTakeSpokenLine(scene, pairs);
    const said = { ...scene, line: spoken };
    const pick = h3SceneTakeBeatText(tpl, scene);
    const out = kitScenePrompt(beatTpl, { ...base, scene: said, index: at }, { use: pick.use });
    h3SceneTakeLeftover(out.prompt, `scene ${scene.id}`, scene.id);
    if (out.negative) negatives.push(out.negative);
    h3SceneTakeAddRefs(refs, out.refs);
    let dialogue = '';
    if (spoken && !/\{line\??\}/.test(pick.text)) {
      dialogue = voiceover ? `Voice-over from ${h3SceneTakeWho(scene, base.cast)}, lips not on screen: "${spoken}"` : `${h3SceneTakeWho(scene, base.cast)} says: "${spoken}"`;
    } else if (spoken && voiceover) {
      // The template placed the words itself; still say they are voice-over, so no mouth is faked on this beat.
      dialogue = `The line is voice-over from ${h3SceneTakeWho(scene, base.cast)}, lips not on screen`;
    }
    const w = windows[n];
    texts.push(`Beat ${n + 1} (${h3SceneTakeSec(w.start)}-${h3SceneTakeSec(w.end)}s): ${h3SceneTakeJoinText([out.prompt, dialogue])}`);
    if (spoken) lines.push(spoken);
    if (typeof scene.picture === 'string' && scene.picture.trim()) pictures.push(scene.picture.trim());
    if (speaker == null && line && scene.speaker != null) speaker = scene.speaker;
  }
  // The take as one scene, for the text around the beats ({product.name}, {cast_looks}, {answers.KEY}).
  const takeScene = { id, picture: pictures.join('. '), line: lines.join(' '), on_screen: null, speaker, extra: null };
  const headText = head != null && tpl.templates && typeof tpl.templates[head] === 'string' ? tpl.templates[head] : '';
  const headTpl = { ...tpl, by_tag: undefined, suffix: undefined, negative: undefined, templates: { ...(tpl.templates || {}), [H3SCENE_TAKE_HEAD]: headText } };
  const tailTpl = { ...tpl, by_tag: undefined, prefix: undefined, templates: { ...(tpl.templates || {}), [H3SCENE_TAKE_HEAD]: '' } };
  let headOut;
  let tailOut;
  try {
    headOut = kitScenePrompt(headTpl, { ...base, scene: takeScene, index }, { use: H3SCENE_TAKE_HEAD });
    tailOut = kitScenePrompt(tailTpl, { ...base, scene: takeScene, index }, { use: H3SCENE_TAKE_HEAD });
  } catch (err) {
    if (err instanceof KitPromptGap) throw new KitPromptGap(err.message.replace(/^scene \S+/, who), err);
    throw err;
  }
  h3SceneTakeLeftover(headOut.prompt, who, null);
  h3SceneTakeLeftover(tailOut.prompt, who, null);
  if (tailOut.negative) negatives.unshift(tailOut.negative);
  h3SceneTakeAddRefs(refs, headOut.refs);
  h3SceneTakeAddRefs(refs, tailOut.refs);

  let prompt = h3SceneTakeJoinText([headOut.prompt, ...texts, tailOut.prompt]);
  const avoid = [...new Set(negatives.filter(Boolean))];
  if (avoid.length) prompt = h3SceneTakeJoinText([prompt, `Avoid: ${avoid.join(', ')}`]);
  for (const phrase of Array.isArray(tpl.banned) ? tpl.banned : []) {
    const re = kitWholeWordsRe(phrase);
    if (re && re.test(prompt)) throw new KitPromptGap(`${who} uses the banned phrase "${phrase.trim()}"`, { kind: 'banned', phrase: phrase.trim() });
  }
  if (prompt.length > H3SCENE_TAKE_PROMPT_MAX) throw new Error(`${who}'s prompt is ${prompt.length} characters, over ${H3SCENE_TAKE_PROMPT_MAX}`);
  const max = Math.min(H3SCENE_TAKE_MAX_REFS, Number.isInteger(tpl.max_refs) ? tpl.max_refs : H3SCENE_TAKE_MAX_REFS);
  if (Array.isArray(tpl.refs) && tpl.refs.includes('product') && !refs.products.some((p) => Array.isArray(p.images) && h3SceneTakeIsFile(p.images[0]))) {
    throw new Error(`${who} requests a product reference, but no matching product has a photo; name the product in its picture or line and supply its photo`);
  }
  const files = h3SceneTakeRefFiles(tpl, refs, max);
  return { id, prompt, refs: files, windows, scene_ids: beats.map((b) => String(b.scene.id)) };
}

/** Whole-second takes keep the authored beat contract; H3 receives a number. */
export function h3SceneTakeDuration(seconds) {
  if (!Number.isInteger(seconds) || seconds < 4 || seconds > 15) throw new Error(`a take lasts ${seconds} s; this part takes whole seconds from 4 to 15`);
  return seconds;
}

/** Every take job for mode take or takes, refused here before any piece is ordered. */
export function h3SceneTakeJobs(inputs, tpl) {
  const many = inputs.mode === 'takes';
  const picked = kitPickScenes(inputs.scenes, inputs.pick, { skip_first: inputs.skip_first, skip_last: inputs.skip_last });
  if (!picked.length) throw new Error('no scene is picked for the take');
  const spec = inputs.takes || {};
  const count = many ? spec.count ?? 1 : 1;
  if (inputs.chain && count < 2) throw new Error('chain needs at least two takes');
  const groups = many ? h3SceneTakeGroups(picked, count) : [picked];
  const limit = many ? H3SCENE_TAKES_MAX_BEATS : H3SCENE_TAKE_MAX_BEATS;
  const seconds = inputs.seconds ?? H3SCENE_TAKE_DEFAULT_SECONDS;
  const duration = h3SceneTakeDuration(seconds);
  const wps = inputs.words_per_second ?? H3SCENE_TAKE_DEFAULT_WPS;
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
  const offScreen = many ? null : { lines: inputs.off_screen_lines ?? 'refuse', tags: inputs.off_screen_tags ?? H3SCENE_OFF_SCREEN_TAGS };
  const base = { look: inputs.look ?? null, answers: inputs.answers ?? null, brand: inputs.brand ?? null, cast: inputs.cast || [], products: inputs.products || [] };
  const jobs = [];
  for (const [k, beats] of groups.entries()) {
    const id = `t${k + 1}`;
    if (beats.length > limit) throw new Error(`take ${id} has ${beats.length} scenes; a take holds at most ${limit} beats`);
    const words = beats.reduce((a, b) => a + h3SceneTakeWords(h3SceneTakeSpokenLine(b.scene, pairs)), 0);
    if (words > maxWords) throw new Error(`take ${id} has ${words} spoken words, more than ${maxWords} for ${seconds} s`);
    const job = h3SceneTakePrompt(tpl, base, { id, index: beats[0].index, beats, head: k === 0 ? first : later, seconds, wps, pairs, offScreen });
    if (!job.refs.length) throw new Error(`take ${id} has no reference image: give cast pictures, product photos or scene pictures the template's refs can use`);
    if (inputs.chain && k > 0 && job.refs.length >= H3SCENE_TAKE_MAX_REFS) throw new Error(`take ${id} already has ${H3SCENE_TAKE_MAX_REFS} references; the chain still needs one more`);
    job.prompt = h3SceneProviderPrompt(job.prompt, job.refs.length + (inputs.chain && k > 0 ? 1 : 0), `take ${id}`);
    jobs.push({ ...job, index: k, seconds, duration });
  }
  return jobs;
}

/** The chain still: one frame of take 1 at chain.at_s, keeping only the bottom share of its height (below every face). */
async function h3SceneTakeChainStill(ctx, take, chain) {
  const keep = H3SCENE_CHAIN_CROPS[chain.crop];
  const length = await kitDuration(ctx, take);
  const at = Math.max(0, Math.min(chain.at_s ?? H3SCENE_CHAIN_DEFAULT_AT_S, length - 0.1));
  const crop = `crop=iw:trunc(ih*${keep}/2)*2:0:ih-trunc(ih*${keep}/2)*2`;
  await kitFfmpeg(ctx, ['-ss', kitNum(at), '-i', take.path, '-frames:v', '1', '-vf', crop, join(ctx.workDir, 'chain-still.png')]);
  const job = { id: 'chain still', refs: [await ctx.file('chain-still.png', 'image')] };
  await h3ScenePrepareReferences(ctx, [job]);
  return job.refs[0];
}

/** The takes joined in order with hard cuts, at the first take's size and frame rate. */
async function h3SceneTakeJoin(ctx, made, audio) {
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
    ...H3SCENE_JOIN_RATE,
    ...(audio ? ctx.tools.encodeArgs('aac') : []),
    out,
  ]);
  const bytes = statSync(out).size;
  if (bytes > H3SCENE_JOIN_MAX_BYTES) throw ctx.error('output_invalid', `the joined takes are ${Math.round(bytes / 1048576)} MB, over 180 MB`);
  return ctx.file('takes.mp4', 'video');
}

/** Runs mode take or takes: orders each take in order, then joins them. Returns the part's outputs. */
export async function h3SceneRunTakes(inputs, ctx, jobs) {
  const audio = inputs.generate_audio ?? true;
  const used = new Set();
  for (const j of jobs) j.piece = kitPieceName('take', j.id, j.index, used);
  const made = [];
  let still = null;
  for (const [k, j] of jobs.entries()) {
    kitStopIfAborted(ctx);
    const piece = j.piece;
    const refs = still ? [...j.refs, still] : j.refs;
    const body = h3SceneProviderBody(inputs, j, refs, ctx.seed(piece) % 2147483647);
    const result = await ctx.line.order({ piece, provider: 'fal', path: H3SCENE_MODEL, body, results: [{ pointer: '/json/video/url', name: `${piece}.mp4`, media: 'video' }] });
    const file = result && result.files && result.files[`${piece}.mp4`];
    if (!file) throw ctx.error('provider_failed', `no video for ${piece}`);
    const ready = await h3SceneProviderVideo(ctx, file, piece, audio);
    made.push({ job: j, file: ready.file, info: ready.info, length: await kitDuration(ctx, ready.file) });
    if (k === 0 && inputs.chain && jobs.length > 1) still = await h3SceneTakeChainStill(ctx, ready.file, inputs.chain);
    ctx.progress({ done: k + 1, total: jobs.length });
  }
  const video = made.length === 1 ? made[0].file : await h3SceneTakeJoin(ctx, made, audio);
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

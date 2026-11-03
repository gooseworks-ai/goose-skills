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
//
// 1.2.0 adds, all optional: shot recipes per scene tag (shots + sources + scenes),
// marks where a shot asks for a sound, cuts moved into the gaps between words
// (snap), and card_from, which starts the card span (no captions) at a scene
// before the end card.
import { join } from 'node:path';
import { kitCheckInputs, kitCheckOutputs, kitFfmpeg, kitNum } from '../../_lib/part.mjs';
import { kitMediaLength } from '../../_lib/length.mjs';
import { kitSceneTag, kitTagKey } from '../../_lib/scene-match.mjs';
import { ASSEMBLE_MAX_BYTES, assembleClampScenes, assembleClampSpeech, assembleFit, assembleGradeChain, assembleIsCutProblem, assembleKenBurns, assembleMapZone, assembleRateCap, assembleSpanCuts } from './cuts.mjs';
import { ASSEMBLE_MIN_FILL_S, assembleCardScene, assembleSpeedBounds, assembleMontageLengths, assembleRecipeFor, assembleSceneProduct, assembleShotLengths, assembleSnapCuts, assembleWords, assembleZoom } from './shots.mjs';

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

/** Runs a pure planner, turning its refusals into bad_input. */
function planned(ctx, fn) {
  try {
    return fn();
  } catch (e) {
    if (assembleIsCutProblem(e)) throw ctx.error('bad_input', e.message);
    throw e;
  }
}

/**
 * With spans and an end card over the last span but no card drawn: the latest span is dropped when
 * nothing would show it (`hasPicture` says whether a clip or scene recipe covers it), and the cut
 * before it holds to its end.
 */
function dropUndrawnCard(ctx, spans, fills, ending, tail, hasPicture) {
  if (fills !== 'last_span' || ending) return { spans, until: 0 };
  const latest = spans.reduce((a, b) => (b.start_s > a.start_s ? b : a));
  if (hasPicture(latest.id)) return { spans, until: 0 };
  ctx.log.info('no end card: the last span is held by the cut before it', { scene: latest.id });
  return { spans: spans.filter((s) => s !== latest), until: latest.end_s + tail };
}

/** 1.1.0's pieces: one per clip, timed by spans or by each clip's own in_s and seconds. */
async function clipPieces(inputs, ctx, fps, { ending, endingFrames, fills, tail, kenBurns, zoomTo }) {
  for (const [k, clip] of inputs.clips.entries()) {
    if (!!clip.video === !!clip.image) throw ctx.error('bad_input', `clips[${k}] needs exactly one of video or image`);
  }
  let plan;
  if (inputs.spans) {
    const { spans, until } = dropUndrawnCard(ctx, inputs.spans, fills, ending, tail, (id) => inputs.clips.some((c) => c.id === id));
    plan = planned(ctx, () => assembleSpanCuts(inputs.clips, spans, { fps, tail_s: tail, silent: inputs.silent, card: ending ? { fills, frames: endingFrames } : null, until_s: until }));
  } else {
    plan = await listedCuts(inputs, ctx, fps);
    if (ending) plan.card = { id: null, start_f: plan.total_f, frames: endingFrames };
    if (ending) plan.total_f += endingFrames;
  }
  const pieces = [];
  for (const cut of plan.cuts) {
    const clip = inputs.clips[cut.index];
    const piece = { id: cut.id, scene_id: cut.id, start_f: cut.start_f, frames: cut.frames };
    if (clip.image) Object.assign(piece, { kind: 'image', media: clip.image, zoom: kenBurns ? [1, zoomTo] : null, hold_s: 0 });
    else {
      Object.assign(piece, { kind: 'video', media: clip.video, in_s: clip.in_s ?? 0, speed: 1, hold_s: 0 });
      if (inputs.spans) {
        // A clip shorter than its cut holds its last frame; one that starts past its own end is refused.
        const length = await kitMediaLength(ctx, clip.video);
        const avail = length - piece.in_s;
        if (avail <= 0) throw ctx.error('bad_input', `clips[${cut.index}] starts at ${kitNum(clip.in_s, 2)}s of a ${kitNum(length, 2)}s clip`);
        piece.hold_s = Math.max(0, cut.frames / fps - avail);
      }
    }
    pieces.push(piece);
  }
  return { pieces, card: plan.card || null, total_f: plan.total_f };
}

const isRef = (v) => v && typeof v === 'object' && !Array.isArray(v) && typeof v.path === 'string';

/** 1.2.0's pieces: each plan scene's slot (from spans) split into the shots its tag's recipe lists. */
async function shotPieces(inputs, ctx, fps, { ending, endingFrames, fills, tail, kenBurns, zoomTo }) {
  if (inputs.clips) throw ctx.error('bad_input', 'give clips or shots, not both');
  if (!inputs.scenes) throw ctx.error('bad_input', 'shots need scenes (plan.scenes): a scene\'s tag picks its recipe');
  if (!inputs.spans) throw ctx.error('bad_input', 'shots need spans: each scene\'s shots share its span');
  const scenes = inputs.scenes;
  const sources = inputs.sources || {};
  const products = inputs.products || [];
  const ids = new Set();
  for (const s of scenes) {
    if (ids.has(String(s.id))) throw ctx.error('bad_input', `two scenes have the id "${s.id}"`);
    ids.add(String(s.id));
  }
  const recipeOf = (scene) => assembleRecipeFor(inputs.shots, scene);
  const { spans, until } = dropUndrawnCard(ctx, inputs.spans, fills, ending, tail, (id) => {
    const scene = scenes.find((s) => String(s.id) === id);
    return !!scene && !!recipeOf(scene);
  });
  const dropped = new Set(inputs.spans.filter((s) => !spans.includes(s)).map((s) => s.id));
  const list = scenes.filter((s) => !dropped.has(String(s.id))).map((s) => ({ id: String(s.id), scene: s }));
  const slots = planned(ctx, () => assembleSpanCuts(list, spans, { fps, tail_s: tail, silent: inputs.silent, card: ending ? { fills, frames: endingFrames } : null, until_s: until }));

  const sourceList = (name, where) => {
    const v = sources[name];
    if (v === undefined) throw ctx.error('bad_input', `${where} uses source "${name}", which sources does not have`);
    if (Array.isArray(v)) return v;
    if (isRef(v)) return [{ id: name, ...(v.media === 'image' ? { image: v } : { video: v }) }];
    throw ctx.error('bad_input', `${where}: source "${name}" is not a list or a file`);
  };
  const lengths = new Map();
  const lengthOf = async (ref) => {
    if (!lengths.has(ref.path)) lengths.set(ref.path, await kitMediaLength(ctx, ref));
    return lengths.get(ref.path);
  };
  const used = new Map(); // source name -> pieces cut from its clips, in order
  const seenTags = new Map(); // tag key -> scenes seen
  const pieces = [];

  for (const slot of slots.cuts) {
    const scene = list[slot.index].scene;
    const recipe = recipeOf(scene);
    if (!recipe) {
      const tag = kitSceneTag(scene);
      throw ctx.error('bad_input', `scene "${slot.id}" ${tag ? `has the tag "${tag}"` : 'has no tag'} and shots has no recipe for it (recipes: ${Object.keys(inputs.shots).join(', ')})`);
    }
    const tagKey = recipe.tag ? kitTagKey(recipe.tag) : recipe.key;
    const ordinal = seenTags.get(tagKey) ?? 0;
    seenTags.set(tagKey, ordinal + 1);
    const specs = recipe.shots.filter((s) => !(s.skip_first && ordinal === 0));
    if (!specs.length) throw ctx.error('bad_input', `scene "${slot.id}": every shot in its recipe skips the first scene`);

    const shots = [];
    for (const [i, spec] of specs.entries()) {
      const where = `scene "${slot.id}" shot ${i + 1} (${spec.kind})`;
      const shot = { spec, fixed: spec.seconds ? Math.max(1, Math.round(spec.seconds * fps)) : null, fill: !!spec.fill };
      if (!spec.speed && (spec.min_speed || spec.max_speed)) {
        const [lo, hi] = assembleSpeedBounds(spec);
        if (lo > hi) throw ctx.error('bad_input', `${where}: min_speed ${kitNum(lo, 2)} is above max_speed ${kitNum(hi, 2)}`);
      }
      const items = spec.kind === 'video' ? null : sourceList(spec.source, where);
      if (spec.kind === 'still') {
        let item;
        const of = spec.of ?? (spec.variant ? 'named_product' : 'scene');
        if (of === 'named_product') {
          const hit = assembleSceneProduct(scene, products, ordinal);
          if (!hit) throw ctx.error('bad_input', `${where}: the scene names no product and products has none at its place`);
          if (hit.how === 'order') ctx.log.warn('a scene names no product: using the product at its place', { scene: slot.id, product: hit.product.id });
          const id = spec.variant ? `${hit.product.id}-${spec.variant}` : String(hit.product.id);
          item = items.find((it) => String(it.id) === id);
          if (!item) throw ctx.error('bad_input', `${where}: source "${spec.source}" has no picture "${id}" (it has ${items.slice(0, 8).map((it) => it.id).join(', ') || 'none'})`);
        } else if (of === 'first') item = items[0];
        else item = items.find((it) => String(it.id) === slot.id);
        if (!item || !(item.image || item.video)) throw ctx.error('bad_input', `${where}: source "${spec.source}" has no picture for this scene`);
        shot.make = item.image ? { kind: 'image', media: item.image } : { kind: 'frame', media: item.video, at_s: spec.in_s ?? 0 };
      } else if (spec.kind === 'clip') {
        const item = items.find((it) => String(it.id) === slot.id);
        if (!item || !(item.video || item.image)) throw ctx.error('bad_input', `${where}: source "${spec.source}" has no clip for this scene`);
        shot.make = item.video ? { kind: 'video', media: item.video, in_s: spec.in_s ?? 0 } : { kind: 'image', media: item.image };
        shot.uses = spec.source; // a picture in a clip list counts as used too: a montage or freeze can show it
      } else if (spec.kind === 'video') {
        const v = sources[spec.source];
        if (v === undefined) throw ctx.error('bad_input', `${where} uses source "${spec.source}", which sources does not have`);
        if (!isRef(v) || v.media !== 'video') throw ctx.error('bad_input', `${where}: source "${spec.source}" is not a video`);
        shot.make = { kind: 'video', media: v, in_s: spec.in_s ?? 0 };
        if (!shot.fixed && !shot.fill) shot.fixed = Math.max(1, Math.round((await lengthOf(v) - (spec.in_s ?? 0)) * fps));
      } else if (spec.kind === 'montage') {
        let picks = [...new Set((used.get(spec.source) || []).map((p) => p.media.path))].map((path) => (used.get(spec.source) || []).find((p) => p.media.path === path));
        if (!picks.length) picks = items.filter((it) => it.video || it.image).map((it) => ({ media: it.video || it.image, in_s: 0, whole: true }));
        if (spec.max) picks = picks.slice(0, spec.max);
        if (!picks.length) throw ctx.error('bad_input', `${where}: source "${spec.source}" has no clips to take frames from`);
        const per = Math.max(1, Math.round((spec.seconds ?? 0.75) * fps));
        const overlap = (spec.transition ?? 'cut') === 'cut' ? 0 : Math.round((spec.transition_s ?? 0.1) * fps);
        shot.picks = picks;
        shot.overlap = overlap < per ? overlap : 0;
        shot.fixed = picks.length * per - (picks.length - 1) * shot.overlap;
        shot.make = { kind: 'montage' };
      } else if (spec.kind === 'freeze') {
        const mine = used.get(spec.source) || [];
        const pick = spec.pick ?? 'last';
        let from = null;
        if (pick === 'scene') {
          const item = items.find((it) => String(it.id) === slot.id && (it.video || it.image));
          from = item ? { media: item.video || item.image, in_s: 0, whole: true } : null;
        } else if (mine.length) from = pick === 'first' ? mine[0] : mine[mine.length - 1];
        else {
          // No clip from this source is cut yet: the source's own first or last clip, as a montage does.
          const all = items.filter((it) => it.video || it.image);
          const item = pick === 'first' ? all[0] : all[all.length - 1];
          from = item ? { media: item.video || item.image, in_s: 0, whole: true } : null;
          if (item) ctx.log.warn('freeze: no clip from the source is used yet, so it freezes the source\'s own clip', { scene: slot.id, clip: item.id });
        }
        if (!from) throw ctx.error('bad_input', `${where}: source "${spec.source}" has no clip to freeze`);
        shot.from = from;
        shot.make = { kind: 'frame', media: from.media };
      }
      shots.push(shot);
      // Register clip pieces now so a later montage or freeze in this cut can find them.
      if (shot.uses) {
        shot.piece = { media: shot.make.media, in_s: shot.make.in_s, speed: 1, frames: 0 };
        used.set(shot.uses, [...(used.get(shot.uses) || []), shot.piece]);
      }
    }
    const minFill = Math.round(((inputs.snap && inputs.snap.min_shot_s) || ASSEMBLE_MIN_FILL_S) * fps);
    const frames = planned(ctx, () => assembleShotLengths(shots, slot.frames, { min_fill: minFill, scene_id: slot.id }));
    let at = slot.start_f;
    shots.forEach((shot, i) => {
      const spec = shot.spec;
      const zoom = spec.zoom ? [spec.zoom[0], spec.zoom[1]] : kenBurns && (shot.make.kind === 'image' || shot.make.kind === 'frame') && spec.kind === 'still' ? [1, zoomTo] : null;
      const piece = Object.assign(shot.piece || {}, { ...shot.make, id: `${slot.id}.${i + 1}`, scene_id: slot.id, start_f: at, frames: frames[i], zoom, spec, shot });
      if (spec.mark) piece.mark = spec.mark;
      pieces.push(piece);
      at += frames[i];
    });
  }
  return { pieces, card: slots.card || null, total_f: slots.total_f, scenes: list.map((l) => l.scene) };
}

/** Sets each piece's speed, hold and frame times once its length is final (after snapping). */
async function finishPieces(ctx, pieces, fps) {
  const lengthOf = async (ref) => kitMediaLength(ctx, ref);
  const frameAt = async (src, at) => {
    if (src.media.media === 'image') return 0; // a picture has one frame
    const length = await lengthOf(src.media);
    const window = src.whole ? length - (src.in_s ?? 0) : (src.frames / fps) * (src.speed ?? 1);
    const t = (src.in_s ?? 0) + at * Math.max(0, window);
    return Math.max(0, Math.min(t, length - 2 / fps));
  };
  // Clip speeds first: a montage or freeze reads the windows they settle.
  for (const p of pieces) {
    if (p.kind !== 'video') continue;
    const spec = p.spec || {};
    const length = await lengthOf(p.media);
    const avail = length - (p.in_s ?? 0);
    if (avail <= 0) throw ctx.error('bad_input', `scene "${p.scene_id}": the clip starts at ${kitNum(p.in_s, 2)}s of a ${kitNum(length, 2)}s clip`);
    const need = p.frames / fps;
    let speed = 1;
    if (spec.speed) speed = spec.speed;
    else if (spec.min_speed || spec.max_speed) {
      const [lo, hi] = assembleSpeedBounds(spec);
      speed = Math.min(hi, Math.max(lo, avail / need));
    }
    p.speed = +speed.toFixed(4);
    p.hold_s = Math.max(0, need - avail / p.speed);
  }
  for (const p of pieces) {
    const at = (p.spec && p.spec.at) ?? 0.5;
    if (p.kind === 'frame' && p.shot && p.shot.from) p.at_s = await frameAt(p.shot.from, at);
    else if (p.kind === 'frame') p.at_s = Math.max(0, Math.min(p.at_s ?? 0, (await lengthOf(p.media)) - 2 / fps));
    if (p.kind === 'montage') {
      const { lengths, overlap } = assembleMontageLengths(p.frames, p.shot.picks.length, p.shot.overlap);
      p.overlap = overlap;
      p.transition = overlap ? p.spec.transition : 'cut';
      p.parts = [];
      for (const [i, src] of p.shot.picks.entries()) p.parts.push({ media: src.media, at_s: await frameAt(src, at), frames: lengths[i] });
    }
    // A looped still and a zoomed frame make every frame they need; an unzoomed frame is held.
    if (p.kind === 'image' || p.kind === 'montage') p.hold_s = 0;
    if (p.kind === 'frame') p.hold_s = p.zoom ? 0 : p.frames / fps;
  }
}

export async function run(inputs, ctx) {
  const manifest = await kitCheckInputs(ctx, inputs);
  const { width: w, height: h } = inputs;
  const fps = inputs.fps ?? 30;
  const fit = inputs.fit ?? 'cover';
  const background = inputs.background ?? 'black';
  if (w % 2 || h % 2) throw ctx.error('bad_input', 'width and height must be even');
  if (!inputs.clips && !inputs.shots) throw ctx.error('bad_input', 'give clips, or shots with sources');
  const keepAudio = inputs.clip_audio === 'keep';
  const grade = inputs.grade ?? 'none';
  const kenBurns = !!inputs.motion && inputs.motion.stills === 'ken_burns';
  const zoomTo = (inputs.motion && inputs.motion.to) ?? 1.05;
  const fills = inputs.ending_fills ?? 'after';
  const tail = inputs.tail_s ?? 0.25;
  if (fills === 'last_span' && inputs.ending && !inputs.spans) throw ctx.error('bad_input', 'ending_fills last_span needs spans: the card takes the last span\'s place');
  if (inputs.card_from && inputs.card_from.tag != null && !inputs.scenes) throw ctx.error('bad_input', 'card_from {tag} needs scenes (plan.scenes) to find the tag');

  const ending = inputs.ending || null;
  const endingSeconds = ending ? await kitMediaLength(ctx, ending) : 0;
  const endingFrames = ending ? Math.round(endingSeconds * fps) : 0;
  if (ending && endingFrames < 1) throw ctx.error('bad_input', 'the end card is shorter than one frame');

  // Where every cut goes.
  const opts = { ending, endingFrames, fills, tail, kenBurns, zoomTo };
  const plan = inputs.shots ? await shotPieces(inputs, ctx, fps, opts) : await clipPieces(inputs, ctx, fps, opts);
  const { pieces } = plan;
  const bodyEnd_f = plan.card ? plan.card.start_f : plan.total_f;

  // Cuts moved out of words.
  if (inputs.snap && !inputs.spans && inputs.timeline) throw ctx.error('bad_input', 'snap needs spans or shots: a timeline passed through keeps its scenes, so its cuts cannot move');
  if (inputs.snap && pieces.length > 1) {
    const words = assembleWords(inputs.speech ?? (inputs.timeline ? inputs.timeline.speech : []));
    if (!words.length) ctx.log.warn('snap: the speech has no word timings, so no cut moved');
    else {
      const cuts = pieces.slice(1).map((p) => p.start_f);
      const moved = assembleSnapCuts(cuts, words, { fps, max_shift_s: inputs.snap.max_shift_s ?? 0.4, min_shot_s: inputs.snap.min_shot_s ?? 0.55, end_f: bodyEnd_f });
      const bounds = [0, ...moved, bodyEnd_f];
      pieces.forEach((p, i) => {
        p.start_f = bounds[i];
        p.frames = bounds[i + 1] - bounds[i];
      });
      const n = moved.filter((m, i) => m !== cuts[i]).length;
      if (n) ctx.log.info('snap: cuts moved out of words', { moved: n });
    }
  }
  await finishPieces(ctx, pieces, fps);
  if (plan.card) plan.card.hold_s = Math.max(0, plan.card.frames / fps - endingSeconds);

  // The scene each cut belongs to, and where the card span starts (card_from).
  const sceneTimes = [];
  for (const p of pieces) {
    const last = sceneTimes[sceneTimes.length - 1];
    if (inputs.shots && last && last.id === p.scene_id) last.end_f = p.start_f + p.frames;
    else sceneTimes.push({ id: p.scene_id, start_f: p.start_f, end_f: p.start_f + p.frames });
  }
  let cardFrom_f = null;
  if (inputs.card_from) {
    const sceneList = inputs.scenes || sceneTimes.map((s) => ({ id: s.id }));
    const id = planned(ctx, () => assembleCardScene(inputs.card_from, sceneList));
    if (id == null) ctx.log.warn('card_from: no scene has that tag, so the card span starts at the end card', { tag: inputs.card_from.tag });
    else {
      const hit = sceneTimes.find((s) => s.id === id);
      if (hit) cardFrom_f = hit.start_f;
      else if (plan.card && plan.card.id === id) cardFrom_f = plan.card.start_f;
      else if (inputs.card_from.scene_id != null) throw ctx.error('bad_input', `card_from names scene "${id}", which has no cut`);
      else ctx.log.warn('card_from: the tagged scene has no cut', { scene: id });
    }
  }

  // One input (several for a montage) and one chain per piece, then the end card, joined by the concat filter.
  const gradeChain = assembleGradeChain(grade, w, h);
  const args = [];
  const graph = [];
  let inputCount = 0;
  const addInput = (...a) => {
    args.push(...a);
    return inputCount++;
  };
  const all = pieces.map((p) => ({ ...p, body: true, graded: cardFrom_f == null || p.start_f < cardFrom_f }));
  if (plan.card) all.push({ kind: 'video', media: ending, in_s: 0, speed: 1, start_f: plan.card.start_f, frames: plan.card.frames, hold_s: plan.card.hold_s, body: false, graded: false });
  const fitted = `fps=${fps},${assembleFit(w, h, fit, background)}`;
  const fitted2x = assembleFit(w * 2, h * 2, fit, background);
  const oneFrame = (k) => `[${k}:v]trim=end_frame=1,setpts=PTS-STARTPTS,`;
  for (const [k, p] of all.entries()) {
    const exact = p.frames / fps;
    let head;
    if (p.kind === 'image') {
      const i = addInput('-loop', '1', '-framerate', String(fps), '-t', kitNum(exact + 2 / fps), '-i', p.media.path);
      const [from, to] = p.zoom || [1, 1];
      head = `[${i}:v]` + (!p.zoom ? fitted : from === 1 ? assembleKenBurns(w, h, fps, p.frames, to, fit, background) : assembleZoom(w, h, fps, p.frames, from, to, `fps=${fps},${fitted2x}`));
    } else if (p.kind === 'frame') {
      const i = addInput('-ss', kitNum(p.at_s), '-t', kitNum(0.5), '-i', p.media.path);
      head = oneFrame(i) + (p.zoom ? assembleZoom(w, h, fps, p.frames, p.zoom[0], p.zoom[1], fitted2x, { per_input: p.frames }) : fitted);
    } else if (p.kind === 'montage') {
      const labels = p.parts.map((part, j) => {
        const i = addInput('-ss', kitNum(part.at_s), '-t', kitNum(0.5), '-i', part.media.path);
        const look = p.zoom ? assembleZoom(w, h, fps, part.frames, p.zoom[0], p.zoom[1], fitted2x, { per_input: part.frames }) : fitted;
        graph.push(`${oneFrame(i)}${look},tpad=stop_mode=clone:stop=${part.frames + 2},trim=end_frame=${part.frames},setpts=PTS-STARTPTS,settb=1/${fps}[m${k}_${j}]`);
        return `[m${k}_${j}]`;
      });
      if (labels.length === 1) graph.push(`${labels[0]}null[mj${k}]`);
      else if (!p.overlap) graph.push(`${labels.join('')}concat=n=${labels.length}:v=1:a=0[mj${k}]`);
      else {
        let acc = labels[0];
        let offset = 0;
        for (let j = 1; j < labels.length; j++) {
          offset += p.parts[j - 1].frames - p.overlap;
          const out = j === labels.length - 1 ? `[mj${k}]` : `[mx${k}_${j}]`;
          graph.push(`${acc}${labels[j]}xfade=transition=${p.transition}:duration=${kitNum(p.overlap / fps, 4)}:offset=${kitNum(offset / fps, 4)}${out}`);
          acc = out;
        }
      }
      head = `[mj${k}]null`;
    } else {
      const speed = p.speed ?? 1;
      const i = addInput('-ss', kitNum(p.in_s ?? 0), '-t', kitNum(exact * speed + 0.5), '-i', p.media.path);
      head = `[${i}:v]` + (speed !== 1 ? `setpts=(PTS-STARTPTS)/${kitNum(speed, 4)},` : '') + fitted;
      p.input = i;
    }
    const finish = p.body && p.graded && gradeChain ? `,${gradeChain}` : '';
    graph.push(
      `${head},tpad=stop_mode=clone:stop_duration=${kitNum((p.hold_s ?? 0) + SHORT_TOLERANCE_S + 2 / fps, 4)},` +
        `trim=end_frame=${p.frames},setpts=PTS-STARTPTS${finish},format=yuv420p[v${k}]`,
    );
    if (keepAudio) {
      // The end card is always silent (music and room tone are the mix layer's), even when its file has sound.
      const info = p.body && p.kind === 'video' ? await ctx.tools.probe(p.media.path) : { has_audio: false };
      const tempo = p.kind === 'video' && (p.speed ?? 1) !== 1 ? `,atempo=${kitNum(p.speed, 4)}` : '';
      graph.push(
        info.has_audio
          ? `[${p.input}:a]aresample=48000:async=1:first_pts=0${tempo},aformat=sample_fmts=fltp:sample_rates=48000:channel_layouts=stereo,apad,atrim=0:${kitNum(exact)},asetpts=PTS-STARTPTS[a${k}]`
          : `anullsrc=channel_layout=stereo:sample_rate=48000,atrim=0:${kitNum(exact)},asetpts=PTS-STARTPTS[a${k}]`,
      );
    }
  }
  const pads = all.map((_, k) => (keepAudio ? `[v${k}][a${k}]` : `[v${k}]`)).join('');
  graph.push(`${pads}concat=n=${all.length}:v=1:a=${keepAudio ? 1 : 0}${keepAudio ? '[vout][aout]' : '[vout]'}`);
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

  // The timeline: scenes by cut (or the clips' own timeline), speech passed through, the card span and its logo box.
  const seconds = t3(plan.total_f, fps);
  const bodyEnd = t3(bodyEnd_f, fps);
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
    scenes = sceneTimes.map((s) => ({ id: s.id, start_s: t3(s.start_f, fps), end_s: t3(s.end_f, fps) }));
  }
  if (plan.card && plan.card.id) scenes.push({ id: plan.card.id, start_s: bodyEnd, end_s: seconds });
  const speech = assembleClampSpeech(inputs.speech ?? (inputs.timeline ? inputs.timeline.speech : []), seconds);
  const timeline = { duration_s: seconds, width: w, height: h, fps, scenes, speech };
  if (plan.card || cardFrom_f != null) timeline.end_card = { start_s: cardFrom_f != null ? t3(cardFrom_f, fps) : bodyEnd, end_s: seconds };
  if (plan.card) {
    const et = inputs.ending_timeline;
    const logo = et && (et.safe_zones || []).find((z) => z.use === 'logo');
    const moved = logo ? assembleMapZone(logo, et.width, et.height, w, h, fit) : null;
    if (moved) zones = [...zones.filter((z) => z.use !== 'logo'), moved];
  }
  if (zones.length) timeline.safe_zones = zones;
  const marks = pieces.filter((p) => p.mark).map((p) => ({ kind: p.mark, at_s: t3(p.start_f, fps) }));
  return kitCheckOutputs(ctx, manifest, { video, seconds, timeline, marks });
}

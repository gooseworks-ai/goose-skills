// cut-footage's planning: which source each plan scene plays, how long each
// beat lasts and at what speed, which source ranges the beats use, where the
// inserts (or split beats) sit over a talking track, and which stretches of
// that track show the creator full frame. Pure functions over plain objects:
// they never run ffmpeg or read files. A problem is a CutRefusal (code
// 'bad_input') with a plain message; part.mjs turns it into ctx.error.
//
// Top-level names start with `cut` (bundled modules share one namespace).

/** A plan the part refuses, in plain words. `code` matches ctx.error's 'bad_input'. */
export class CutRefusal extends Error {
  constructor(message) {
    super(message);
    this.name = 'CutRefusal';
    this.code = 'bad_input';
  }
}

/** The largest finished video the part writes: the server refuses uploads over 200 MB (§4.12). */
export const CUT_MAX_BYTES = 180 * 1024 * 1024;
/** The final encode's video bitrate cap, in bits per second (`-maxrate 16M`). */
export const CUT_MAXRATE_BPS = 16e6;
/** An insert may stretch at most this far to cover a take join, and ends this long after it. */
export const CUT_JOIN_STRETCH_S = 1.0;
export const CUT_JOIN_AFTER_S = 0.15;

const CUT_EPS = 1e-6;

function cutFmt(v, digits = 2) {
  return Number(v).toFixed(digits).replace(/\.?0+$/, '') || '0';
}

/** The mode a call runs in: the explicit `mode`, else split with a layout, band without scenes, inserts with scenes and a talking video, else scenes. */
export function cutModeOf(inputs) {
  if (inputs.mode) return inputs.mode;
  if (inputs.layout) return 'split';
  if (!inputs.scenes) return 'band';
  return inputs.video ? 'inserts' : 'scenes';
}

// The inputs each mode reads. Anything else given is refused, so a style that
// binds an input to the wrong mode hears about it instead of losing it quietly.
const CUT_MODE_INPUTS = {
  band: ['mode', 'video', 'footage', 'band', 'fit', 'speed', 'min_speed', 'max_speed', 'audio'],
  scenes: ['mode', 'scenes', 'footage', 'lead', 'look', 'screen', 'fit', 'transition', 'scene_seconds', 'still_seconds', 'speed', 'min_speed', 'max_speed', 'order', 'width', 'height', 'fps'],
  inserts: ['mode', 'video', 'timeline', 'scenes', 'footage', 'joins', 'look', 'screen', 'fit', 'speed', 'min_speed', 'max_speed', 'order', 'grid', 'push_in', 'first_scene_look', 'card_color'],
  split: ['mode', 'video', 'timeline', 'scenes', 'footage', 'layout', 'look', 'screen', 'fit', 'speed', 'min_speed', 'max_speed', 'order', 'push_in', 'first_scene_look', 'card_color'],
};
const CUT_MODE_NEEDS = { band: ['video', 'band'], scenes: ['scenes'], inserts: ['video', 'timeline', 'scenes'], split: ['video', 'timeline', 'scenes'] };

/** Refuses inputs the mode does not read and missing inputs it needs. */
export function cutCheckMode(mode, inputs) {
  const allowed = new Set(CUT_MODE_INPUTS[mode]);
  const extra = Object.keys(inputs).filter((k) => inputs[k] !== undefined && !allowed.has(k));
  if (extra.length) throw new CutRefusal(`${mode} mode does not use ${extra.join(', ')}`);
  const missing = CUT_MODE_NEEDS[mode].filter((k) => inputs[k] == null);
  if (missing.length) throw new CutRefusal(`${mode} mode needs ${missing.join(', ')}`);
  if (inputs.look !== 'screen' && inputs.screen != null) throw new CutRefusal('screen settings are given but look is not "screen"');
}

/** The clip file of a footage entry: `file`, else `video`. */
export function cutEntryFile(entry) {
  return entry.file || entry.video || null;
}

/** True when the footage entry is a still picture (kind "image", or an image file). */
export function cutEntryIsStill(entry) {
  const f = cutEntryFile(entry);
  if (entry.kind === 'image' && f && f.media !== 'image') throw new CutRefusal(`footage ${cutEntryName(entry)} is kind image but its file is a ${f.media}`);
  return !!f && f.media === 'image';
}

function cutEntryName(entry) {
  return entry.asset_id ? `"${entry.asset_id}"` : entry.scene_id ? `for scene "${entry.scene_id}"` : '(no asset id)';
}

/** True when a plan scene is tagged as a grid beat (`extra.shot: "grid"`). */
export function cutIsGridScene(scene) {
  return !!scene && !!scene.extra && typeof scene.extra === 'object' && scene.extra.shot === 'grid';
}

/** How many cells a grid layout has. */
export const CUT_GRID_CELLS = { '2x2': 4 };

/**
 * Each scene's source, in plan order: its footage entry (matched by
 * scene_id), else its image, else (the first scene only) the lead clip.
 * Returns [{scene, index, kind: 'window' | 'still' | 'lead' | 'grid' | 'none', entry?, entries?, image?}].
 * `need` = 'all' refuses a scene with no source (scenes mode); 'any' leaves it as 'none' (inserts mode).
 * `grid` (a layout such as '2x2', inserts mode): a scene tagged `extra.shot: "grid"` takes exactly
 * that many footage entries, in plan order, as one grid beat. Without it, one entry per scene.
 */
export function cutSceneSources(scenes, footage, { lead = null, need = 'all', grid = null } = {}) {
  const ids = new Set();
  const gridIds = new Set();
  for (const s of scenes) {
    if (ids.has(s.id)) throw new CutRefusal(`scene "${s.id}" appears twice in the plan`);
    ids.add(s.id);
    if (grid && cutIsGridScene(s)) gridIds.add(s.id);
  }
  const byScene = new Map();
  const cells = new Map();
  for (const entry of footage || []) {
    if (!cutEntryFile(entry)) throw new CutRefusal(`footage ${cutEntryName(entry)} has no clip file`);
    if (entry.scene_id == null) continue;
    if (!ids.has(entry.scene_id)) throw new CutRefusal(`footage ${cutEntryName(entry)} names scene "${entry.scene_id}", which is not in the plan`);
    if (gridIds.has(entry.scene_id)) {
      cells.set(entry.scene_id, [...(cells.get(entry.scene_id) || []), entry]);
      continue;
    }
    if (byScene.has(entry.scene_id)) throw new CutRefusal(`scene "${entry.scene_id}" has more than one footage entry; this version plays one per scene (or tag it extra.shot "grid" and give grid)`);
    byScene.set(entry.scene_id, entry);
  }
  const want = grid ? CUT_GRID_CELLS[grid] : 0;
  if (grid && !want) throw new CutRefusal(`grid layout "${grid}" is not one this version draws (2x2)`);
  return scenes.map((scene, index) => {
    if (gridIds.has(scene.id)) {
      const entries = cells.get(scene.id) || [];
      if (entries.length !== want) throw new CutRefusal(`grid scene "${scene.id}" has ${entries.length} footage entries; a ${grid} grid needs exactly ${want}`);
      entries.forEach((e) => cutEntryIsStill(e));
      return { scene, index, kind: 'grid', entries };
    }
    const entry = byScene.get(scene.id);
    if (entry) return { scene, index, kind: cutEntryIsStill(entry) ? 'still' : 'window', entry };
    if (scene.image) return { scene, index, kind: 'still', image: scene.image };
    if (index === 0 && lead) return { scene, index, kind: 'lead' };
    if (need === 'all') throw new CutRefusal(`scene "${scene.id}" has no footage window, image or lead clip to show`);
    return { scene, index, kind: 'none' };
  });
}

/** The window [from, to] in seconds of a video entry inside a clip `length` seconds long. */
export function cutWindow(entry, length) {
  const from = (entry.start_ms ?? 0) / 1000;
  const to = entry.end_ms == null ? length : entry.end_ms / 1000;
  if (!(to > from) || to > length + 0.05) {
    throw new CutRefusal(`the footage window ${cutFmt(from)}-${cutFmt(to)}s of ${cutEntryName(entry)} is not inside the ${cutFmt(length)}s clip`);
  }
  return { from, to: Math.min(to, length) };
}

function cutSnap(seconds, fps) {
  return Math.max(1, Math.round(seconds * fps)) / fps;
}

/**
 * The speed a window of `windowS` source seconds plays at to last `slotS`,
 * under `speed` ('fill' or a number), refused outside min to max.
 */
export function cutSpeedFor(windowS, slotS, { speed = 'fill', min_speed, max_speed }, what) {
  if (speed === 'fill') {
    const s = windowS / slotS;
    if (s < min_speed - 0.01 || s > max_speed + 0.01) {
      throw new CutRefusal(`${what}: ${cutFmt(slotS)}s from a ${cutFmt(windowS)}s window needs ${cutFmt(s)}x, outside ${min_speed}x to ${max_speed}x`);
    }
    return s;
  }
  if (windowS / speed + 0.05 < slotS) {
    throw new CutRefusal(`${what}: at ${speed}x the ${cutFmt(windowS)}s window lasts ${cutFmt(windowS / speed)}s, less than the ${cutFmt(slotS)}s it must fill`);
  }
  return speed;
}

/**
 * Scenes mode: each beat's length and speed. `lengths` maps a window beat's
 * index to its clip length; `leadS` is the lead clip's length.
 * A window's natural length (at 1x, or at a fixed speed) is clamped to
 * scene_seconds, and the speed that fits it there must be inside min to max.
 * A still lasts still_seconds (default: scene_seconds.max, else 2.5 s).
 * Returns beats [{...source, seconds, speed, from?, to?, start_s, end_s}] and the total.
 */
export function cutPlanScenes(sources, { lengths, leadS, fps, scene_seconds, still_seconds, speed = 'fill', min_speed = 0.5, max_speed = 2, dissolve_frames = 0 }) {
  const lo = scene_seconds?.min ?? 0;
  const hi = scene_seconds?.max ?? Infinity;
  if (lo > hi) throw new CutRefusal(`scene_seconds.min ${lo} is above scene_seconds.max ${hi}`);
  const stillS = still_seconds ?? (Number.isFinite(hi) ? hi : 2.5);
  const dissolveS = dissolve_frames / fps;
  let t = 0;
  const beats = sources.map((src) => {
    const what = `scene "${src.scene.id}"`;
    let seconds;
    let sp = 1;
    let range = {};
    if (src.kind === 'window') {
      const { from, to } = cutWindow(src.entry, lengths.get(src.index));
      const natural = (to - from) / (speed === 'fill' ? 1 : speed);
      seconds = cutSnap(Math.min(hi, Math.max(lo, natural)), fps);
      sp = cutSpeedFor(to - from, seconds, { speed, min_speed, max_speed }, what);
      range = { from, to: from + seconds * sp };
    } else if (src.kind === 'still') {
      seconds = cutSnap(stillS, fps);
    } else if (src.kind === 'lead') {
      seconds = Math.floor(leadS * fps + 1e-6) / fps;
      if (seconds <= 0) throw new CutRefusal('the lead clip is shorter than one frame');
    } else {
      throw new CutRefusal(`${what} has no footage window, image or lead clip to show`);
    }
    if (dissolveS > 0 && seconds < dissolveS - CUT_EPS) throw new CutRefusal(`${what} lasts ${cutFmt(seconds)}s, shorter than the ${dissolve_frames}-frame dissolve`);
    const beat = { ...src, ...range, seconds, speed: sp, start_s: t, end_s: t + seconds };
    t += seconds;
    return beat;
  });
  return { beats, seconds: t };
}

/**
 * Refuses windows that reuse source: two beats on the same clip may not
 * overlap, and with order 'forward' a later beat may not go back in the clip.
 * Stills are never checked (critic #14). `beats` carry {entry, from, to, scene}.
 */
export function cutCheckOrder(beats, order = 'forward') {
  const last = new Map();
  for (const b of beats) {
    if (b.kind !== 'window') continue;
    const f = cutEntryFile(b.entry);
    const key = b.entry.asset_id || (f && f.sha256) || (f && f.path);
    const prev = last.get(key);
    if (prev) {
      for (const p of prev) {
        if (b.from < p.to - 0.02 && p.from < b.to - 0.02) {
          throw new CutRefusal(`scenes "${p.scene.id}" and "${b.scene.id}" show the same part of the recording (${cutFmt(Math.max(p.from, b.from))}-${cutFmt(Math.min(p.to, b.to))}s); it reads as a loop`);
        }
        if (order === 'forward' && b.from < p.from) {
          throw new CutRefusal(`scene "${b.scene.id}" goes back in the recording to ${cutFmt(b.from)}s, before scene "${p.scene.id}" at ${cutFmt(p.from)}s; the job must move forward`);
        }
      }
      prev.push(b);
    } else last.set(key, [b]);
  }
}

/**
 * Inserts mode: each insert's slot on the talking track. `inserts` are the
 * sources with a window or still; `spans` maps scene id -> {start_s, end_s}
 * from the talking track's timeline; `joins` are the take starts after the
 * first. Every join must sit under an insert, at least CUT_JOIN_AFTER_S after
 * its start and before its end:
 *   - an insert that ends at most CUT_JOIN_STRETCH_S before a join (or too
 *     close after it) is stretched to end CUT_JOIN_AFTER_S after the join,
 *     never into the next insert or past the end of the video;
 *   - else an insert that starts at most CUT_JOIN_STRETCH_S after a join (or
 *     too close before it) starts CUT_JOIN_AFTER_S before the join, never
 *     before 0 or into the previous insert. A creator step starts a new take's
 *     scene just before the join, but a timeline retimed from heard words
 *     often moves that scene's start after it.
 * Anything else is refused. Returns [{...source, start_s, end_s, stretched_s,
 * early_s}] in time order; stretched_s and early_s are the seconds added at
 * the end and at the start.
 */
export function cutPlaceInserts(inserts, spans, { joins = [], duration, fps }) {
  const slots = inserts.map((src) => {
    const span = spans.get(src.scene.id);
    if (!span) throw new CutRefusal(`scene "${src.scene.id}" has footage but no time in the talking track's timeline`);
    const start = Math.max(0, span.start_s);
    const end = Math.min(duration, span.end_s);
    if (!(end - start > 1 / fps)) throw new CutRefusal(`scene "${src.scene.id}" lasts under one frame in the talking track, too short for an insert`);
    return { ...src, start_s: start, end_s: end, stretched_s: 0, early_s: 0 };
  });
  slots.sort((a, b) => a.start_s - b.start_s);
  for (let i = 1; i < slots.length; i++) {
    if (slots[i].start_s < slots[i - 1].end_s - CUT_EPS) throw new CutRefusal(`the inserts for scenes "${slots[i - 1].scene.id}" and "${slots[i].scene.id}" overlap in time`);
  }
  // Each returns null when the slot covers the join after the move, else why it cannot.
  const stretchEnd = (slot, j) => {
    const want = j + CUT_JOIN_AFTER_S;
    if (slot.end_s >= want - CUT_EPS) return null;
    const next = slots[slots.indexOf(slot) + 1];
    const limit = Math.min(duration, next ? next.start_s : Infinity);
    if (want > limit + CUT_EPS) return `the insert for scene "${slot.scene.id}" cannot stretch over the cut between takes at ${cutFmt(j)}s: it would run past ${next ? 'the next insert' : 'the end of the video'}`;
    slot.stretched_s += want - slot.end_s;
    slot.end_s = want;
    return null;
  };
  const startEarly = (slot, j) => {
    const want = Math.max(0, j - CUT_JOIN_AFTER_S);
    if (slot.start_s <= want + CUT_EPS) return null;
    const prev = slots[slots.indexOf(slot) - 1];
    if (prev && want < prev.end_s - CUT_EPS) return `the insert for scene "${slot.scene.id}" cannot start early over the cut between takes at ${cutFmt(j)}s: it would run into the previous insert`;
    slot.early_s += slot.start_s - want;
    slot.start_s = want;
    return null;
  };
  for (const j of [...joins].sort((a, b) => a - b)) {
    // An insert the join is inside: pad whichever side is too close.
    const inside = slots.find((s) => s.start_s <= j + CUT_EPS && j <= s.end_s + CUT_EPS);
    if (inside) {
      const why = stretchEnd(inside, j) || startEarly(inside, j);
      if (why) throw new CutRefusal(why);
      continue;
    }
    // Else stretch the insert just before it, or start the one just after it early.
    const before = slots.filter((s) => s.end_s < j && j - s.end_s <= CUT_JOIN_STRETCH_S + CUT_EPS).pop();
    const after = slots.find((s) => s.start_s > j && s.start_s - j <= CUT_JOIN_STRETCH_S + CUT_EPS);
    if (!before && !after) {
      throw new CutRefusal(`a cut between takes at ${cutFmt(j)}s would show: no insert covers it (give the scene before it footage, or let an insert end or start within ${CUT_JOIN_STRETCH_S}s of it)`);
    }
    const whyBefore = before ? stretchEnd(before, j) : 'no insert ends just before it';
    if (!whyBefore) continue;
    const whyAfter = after ? startEarly(after, j) : null;
    if (after && !whyAfter) continue;
    throw new CutRefusal(before ? whyBefore : whyAfter);
  }
  for (const s of slots) {
    // A start moved early rounds down to a frame, as a stretched end rounds up, so the 0.15 s stays.
    s.start_s = s.early_s > 0 ? Math.max(0, Math.floor(s.start_s * fps + 1e-6) / fps) : Math.round(s.start_s * fps) / fps;
    s.end_s = Math.max(s.start_s + 1 / fps, Math.round(s.end_s * fps + 0.499) / fps);
    s.end_s = Math.min(s.end_s, Math.floor(duration * fps + 1e-6) / fps);
  }
  return slots;
}

/**
 * Inserts mode: the source range and speed of a window insert lasting `seconds`.
 * The window [from, to] plays at the speed that fills the slot (or the fixed
 * speed). When an insert that starts early over a take join would play too
 * slowly (or, at a fixed speed, run out of footage), its window is extended
 * earlier in the recording by what the early start added, at the speed it had
 * before, never before 0 s; the speed must still be inside min to max.
 * Returns {from, to, speed, extended_s}.
 */
export function cutInsertRange(slot, { from, to }, seconds, opts, what) {
  let first;
  try {
    const speed = cutSpeedFor(to - from, seconds, opts, what);
    return { from, to: from + seconds * speed, speed, extended_s: 0 };
  } catch (e) {
    if (!(e instanceof CutRefusal) || !(slot.early_s > 0) || !(from > 0)) throw e;
    first = e;
  }
  let before;
  try {
    before = cutSpeedFor(to - from, Math.max(1e-3, seconds - slot.early_s), opts, what);
  } catch {
    throw first;
  }
  const extended = Math.min(from, slot.early_s * before);
  const start = from - extended;
  const speed = cutSpeedFor(to - start, seconds, opts, what);
  return { from: start, to: start + seconds * speed, speed, extended_s: extended };
}

/** Refuses an encode whose capped bitrate could pass the size limit (§4.12), before any work. */
export function cutCheckProjectedSize(seconds, maxrateBps = CUT_MAXRATE_BPS) {
  const projected = (seconds * (maxrateBps + 256e3)) / 8;
  if (projected > CUT_MAX_BYTES) throw new CutRefusal(`a ${cutFmt(seconds, 1)}s video could reach ${Math.round(projected / 1048576)} MB, over the ${CUT_MAX_BYTES / 1048576} MB limit`);
}

/**
 * Split mode: each split beat's slot on the talking track. `beats` are the
 * sources with a window or still; `timelineScenes` the track's timeline scenes.
 * Beats tile with the scenes around them: a beat starts at its scene's start
 * (0 for the earliest scene) and runs to the next scene's start (the end of
 * the track for the last), so no frame of full-frame creator flashes between
 * two split beats. Times are whole frames. Returns [{...source, start_s, end_s}].
 */
export function cutSplitSlots(beats, timelineScenes, { duration, fps }) {
  const order = [...timelineScenes].map((s, i) => ({ ...s, i })).sort((a, b) => a.start_s - b.start_s || a.i - b.i);
  const last = Math.floor(duration * fps + 1e-6) / fps;
  const frame = (t) => Math.round(t * fps) / fps;
  const slots = beats.map((src) => {
    const k = order.findIndex((s) => String(s.id) === String(src.scene.id));
    if (k < 0) throw new CutRefusal(`scene "${src.scene.id}" has footage but no time in the talking track's timeline`);
    const start = k === 0 ? 0 : Math.max(0, order[k].start_s);
    const end = Math.min(duration, k + 1 < order.length ? order[k + 1].start_s : duration);
    const s = frame(start);
    const e = Math.min(frame(end), last);
    if (!(e - s >= 1 / fps - CUT_EPS)) throw new CutRefusal(`scene "${src.scene.id}" lasts under one frame in the talking track, too short for a split beat`);
    return { ...src, start_s: s, end_s: e };
  });
  slots.sort((a, b) => a.start_s - b.start_s);
  for (let i = 1; i < slots.length; i++) {
    if (slots[i].start_s < slots[i - 1].end_s - CUT_EPS) throw new CutRefusal(`the split beats for scenes "${slots[i - 1].scene.id}" and "${slots[i].scene.id}" overlap in time`);
  }
  return slots;
}

/**
 * The stretches of a talking track that show the creator full frame: the
 * gaps between covering beats (inserts or split beats), each at least one
 * frame long. Returns [{start_s, end_s}] in time order.
 */
export function cutCreatorRuns(covers, duration, fps = 30) {
  const sorted = [...covers].sort((a, b) => a.start_s - b.start_s);
  const runs = [];
  let t = 0;
  for (const c of sorted) {
    if (c.start_s - t >= 1 / fps - CUT_EPS) runs.push({ start_s: t, end_s: c.start_s });
    t = Math.max(t, c.end_s);
  }
  if (duration - t >= 1 / fps - CUT_EPS) runs.push({ start_s: t, end_s: duration });
  return runs;
}

/**
 * A grid cell's playback speed: 1x when its window is at least the slot
 * long, else slowed so it fills the slot, refused below `min_speed`.
 */
export function cutGridCellSpeed(windowS, slotS, min_speed, what) {
  if (windowS >= slotS - CUT_EPS) return 1;
  const s = windowS / slotS;
  if (s < min_speed - 0.01) throw new CutRefusal(`${what}: a ${cutFmt(windowS)}s window fills the ${cutFmt(slotS)}s grid only at ${cutFmt(s)}x, below ${min_speed}x`);
  return s;
}

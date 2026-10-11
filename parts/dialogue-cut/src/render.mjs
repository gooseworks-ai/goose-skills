// dialogue-cut render helpers: the ffmpeg graph for a cut plan from ./plan.mjs,
// the grade, the size rule, the plan choice with its self-checks, and the drift
// check on the rendered file. Pure functions except where named; the part
// (./part.mjs) runs ffmpeg. Top-level names start with `dcut` (bundle.mjs needs
// names unique across the inlined modules).
//
// Time model. The voice track is the clock: the picture is cut over it and the
// audio never moves. A beat runs from its line's start to the next line's start
// (plan.mjs dialogueBeats). A lipsync clip was driven by its line's own audio,
// so its frame 0 sits where that line starts in the voice track (the speech
// entry's start_s, else the span's). Each clip is stretched to its line's
// length when it is within 5% (Veed returns clips 2 to 35 ms short; padding
// them froze the picture at every cut in the recipe), placed at that start, and
// held on its first or last frame for any part of the beat it does not cover
// (the gap after a line). A cut then reads its window of that placed clip.
import { kitNum } from '../../_lib/part.mjs';
import { kitPanelCover, kitPanelJoin, kitPanelJoinLengths, kitPanelSplit } from '../../_lib/panels.mjs';
import { dialoguePlan, dialoguePlanProblems, dialogueSettings } from './plan.mjs';

/** The podcast recipe's operator-approved look: blacks lifted off zero, colour pushed, fine moving grain. */
export const DCUT_GRADES = Object.freeze({
  none: null,
  'warm-lift-grain': "curves=all='0/0.055 0.5/0.5 1/0.97',eq=saturation=1.60,noise=alls=5:allf=t+u",
});

/** A finished video may not pass this (the server refuses uploads over 200 MB; §4.12). */
export const DCUT_MAX_BYTES = 180 * 1024 * 1024;

/** How far a clip may be stretched to its line before it is left alone (a real mismatch, not rounding). */
export const DCUT_MAX_STRETCH = 0.05;

/** How far a speaker change in the render may land from the plan (three frames at 30 fps). */
export const DCUT_DRIFT_S = 0.1;

// Self-check ids that the inputs cause (a missing picture), not the edit: no other seed fixes them.
const DCUT_INPUT_CHECKS = new Set(['split_bottom_assets']);

/** The final-encode bitrate cap (§4.12): grain looks 8 Mbps, everything else 16 Mbps. */
export function dcutRateCap(grade) {
  return grade && grade !== 'none' ? ['-maxrate', '8M', '-bufsize', '16M'] : ['-maxrate', '16M', '-bufsize', '32M'];
}

/** Bytes the capped encode can reach over `seconds` (video cap plus the AAC track), for the refusal before encoding. */
export function dcutProjectedBytes(seconds, grade) {
  const videoBits = grade && grade !== 'none' ? 8e6 : 16e6;
  return Math.ceil((seconds * (videoBits + 256e3)) / 8);
}

/**
 * The setpts factor that stretches a clip of `clipS` to its line of `lineS`,
 * or 1 when they differ by more than DCUT_MAX_STRETCH (left alone and reported).
 */
export function dcutClipRatio(clipS, lineS) {
  if (!(clipS > 0) || !(lineS > 0)) return { ratio: 1, stretched: false };
  const r = lineS / clipS;
  if (Math.abs(r - 1) > DCUT_MAX_STRETCH) return { ratio: 1, stretched: false };
  return { ratio: r, stretched: Math.abs(r - 1) > 1e-6 };
}

/**
 * The plan, checked. Tries `seed`, then seed+1 ... seed+tries-1, and keeps the
 * first plan with no self-check problem: a framing band or a balance check
 * that one seed misses is free to fix, and the walk is deterministic, so the
 * same inputs always give the same edit. A problem the inputs cause (no
 * picture for the lower panel) is returned at once, since no seed fixes it.
 * Returns {plan, settings, seed, problems}; problems is [] on a pass, else the
 * first seed's list.
 */
export function dcutChoosePlan(beats, hosts, mode, overrides, { products = 0, end_card_s = 0, tries = 12 } = {}) {
  const seed0 = overrides.seed ?? dialogueSettings(mode).seed;
  let first = null;
  for (let k = 0; k < tries; k++) {
    const settings = dialogueSettings(mode, { ...overrides, seed: seed0 + k });
    const plan = dialoguePlan(beats, hosts, settings, { products, end_card_s });
    const problems = dialoguePlanProblems(plan, beats, hosts, settings, { products });
    if (!problems.length) return { plan, settings, seed: seed0 + k, problems: [], tried: k + 1 };
    if (!first) first = { plan, settings, seed: seed0, problems, tried: k + 1 };
    if (problems.some((p) => DCUT_INPUT_CHECKS.has(p.split(':')[0]))) return { ...first, input: true };
  }
  return { ...first, tried: tries };
}

/** The output times of every cut: frame-exact from the running total, so rounding never drifts. */
export function dcutCutTimes(cuts, fps) {
  const j = kitPanelJoinLengths(
    cuts.map((c) => c.end_s - c.start_s),
    { fps },
  );
  return { starts: j.starts, lengths: j.lengths, total_s: j.total_s, frames: j.frames };
}

/** Output times where the picture changes from one host to the other (the cut's `show`). */
export function dcutSpeakerChanges(cuts, starts) {
  const out = [];
  for (let i = 1; i < cuts.length; i++) if (cuts[i].show !== cuts[i - 1].show) out.push(starts[i]);
  return out;
}

/**
 * Drift: every planned speaker change matched to the nearest change the
 * scene detector saw. A change seen within `window_s` that lands more than
 * `tol_s` away is drift. One not seen at all is not judged (a detector miss on
 * one plate is not drift); the count is returned so the part can log it.
 */
export function dcutDrift(planned, seen, { tol_s = DCUT_DRIFT_S, window_s = 0.5 } = {}) {
  let worst = 0;
  let judged = 0;
  const bad = [];
  for (const want of planned) {
    if (!seen.length) break;
    const got = seen.reduce((a, b) => (Math.abs(b - want) < Math.abs(a - want) ? b : a));
    const off = got - want;
    if (Math.abs(off) > window_s) continue;
    judged += 1;
    if (Math.abs(off) > Math.abs(worst)) worst = off;
    if (Math.abs(off) > tol_s + 1e-9) bad.push(`planned ${want.toFixed(2)} s, the picture changed at ${got.toFixed(2)} s (${off >= 0 ? '+' : ''}${off.toFixed(2)} s)`);
  }
  return { judged, unseen: planned.length - judged, worst_s: +worst.toFixed(3), bad };
}

/** Scene-change times from ffmpeg's `select=gt(scene,x),metadata=print` output. */
export function dcutSceneTimes(text) {
  const out = [];
  let cur = null;
  for (const line of String(text || '').split('\n')) {
    const t = /pts_time:([0-9.]+)/.exec(line);
    if (t) cur = Number(t[1]);
    else if (cur !== null && /scene_score=/.test(line)) {
      out.push(cur);
      cur = null;
    }
  }
  return out;
}

/** Speech held to the dialogue: entries that start inside it, their ends and words clamped. */
export function dcutClampSpeech(speech, untilS) {
  const out = [];
  for (const e of speech || []) {
    if (!(e.start_s < untilS)) continue;
    const x = { ...e, end_s: Math.min(e.end_s, untilS) };
    if (e.words) x.words = e.words.filter((w) => w.start_s < untilS).map((w) => ({ ...w, end_s: Math.min(w.end_s, untilS) }));
    out.push(x);
  }
  return out;
}

/** A safe zone from a picture of ew x eh moved onto w x h the way a cover scale moves it; null when it leaves the frame. */
export function dcutMapZone(z, ew, eh, w, h) {
  if (!(ew > 0 && eh > 0)) return null;
  const s = Math.max(w / ew, h / eh);
  const ox = (ew * s - w) / 2;
  const oy = (eh * s - h) / 2;
  const x0 = Math.max(0, z.x * s - ox);
  const y0 = Math.max(0, z.y * s - oy);
  const x1 = Math.min(w, (z.x + z.w) * s - ox);
  const y1 = Math.min(h, (z.y + z.h) * s - oy);
  if (x1 <= x0 || y1 <= y0) return null;
  const r = (v) => Math.round(v);
  return { use: z.use, x: r(x0), y: r(y0), w: r(x1 - x0), h: r(y1 - y0) };
}

/**
 * The whole ffmpeg job for a plan. `src` describes the files:
 *   clips:    Map scene id -> {path, length_s, ratio, line_start_s}
 *   beats:    Map scene id -> beat (start_s, ...)
 *   idle:     Map host -> {path, length_s}
 *   stills:   Map host -> {path}          (a cast picture, for a listener with no clip)
 *   products: [{path}]
 *   voice:    {path}
 *   ending:   {path, frames, has_audio} | null
 * Options: width, height, fps, head (vertical crop bias), grade (a DCUT_GRADES key).
 * Returns {args, graph, times}; args are the input arguments, graph the filter
 * graph whose outputs are [vout] and [aout].
 */
export function dcutGraph(plan, src, { width, height, fps, head = 0.25, grade = 'none' }) {
  const cuts = plan.cuts;
  const times = dcutCutTimes(cuts, fps);
  const args = [];
  const graph = [];
  let n = 0;
  const input = (...a) => {
    args.push(...a);
    return n++;
  };
  const margin = 0.5;

  // A clip placed on its beat and read from `start` (beat-local seconds) for `len` seconds.
  const placed = (sceneId, start, len, out) => {
    const c = src.clips.get(sceneId);
    const beat = src.beats.get(sceneId);
    const i = input('-i', c.path);
    const pre = c.line_start_s - beat.start_s;
    const from = pre >= 0 ? start : start - pre;
    const shown = Math.max(0, pre) + c.length_s * c.ratio;
    const tail = Math.max(0, from + len - shown) + 1;
    const pad = `tpad=${pre > 1e-6 ? `start_mode=clone:start_duration=${kitNum(pre)}:` : ''}stop_mode=clone:stop_duration=${kitNum(tail)}`;
    graph.push(
      `[${i}:v]setpts=${kitNum(c.ratio)}*(PTS-STARTPTS),fps=${fps},${pad},` + `trim=start=${kitNum(from)}:duration=${kitNum(len + margin)},setpts=PTS-STARTPTS[${out}]`,
    );
  };
  // A host's idle (listening) clip from `start`, looped as long as it needs.
  const idle = (host, start, len, out) => {
    const c = src.idle.get(host);
    const i = input('-stream_loop', '-1', '-t', kitNum(start + len + 1), '-i', c.path);
    graph.push(`[${i}:v]setpts=PTS-STARTPTS,fps=${fps},trim=start=${kitNum(start)}:duration=${kitNum(len + margin)},setpts=PTS-STARTPTS[${out}]`);
  };
  const still = (path, len, out) => {
    const i = input('-loop', '1', '-framerate', String(fps), '-t', kitNum(len + 1), '-i', path);
    graph.push(`[${i}:v]setpts=PTS-STARTPTS,fps=${fps},format=yuv420p[${out}]`);
  };
  // The listener on their own, for a reaction with no clip of theirs: the idle clip, else their picture.
  const listenerAlone = (host, k, len, out) => {
    const c = src.idle.get(host);
    if (c) {
      const span = Math.max(0, c.length_s - len);
      return idle(host, span > 0.05 ? +((k * 1.73) % span).toFixed(3) : 0, len, out);
    }
    return still(src.stills.get(host).path, len, out);
  };

  const segs = [];
  cuts.forEach((c, k) => {
    const len = times.lengths[k];
    const beat = src.beats.get(c.scene_id);
    // The speaker reads the window that lines up with the voice: the cut's real output start, not the planned one.
    const own = times.starts[k] - beat.start_s;
    const raw = `c${k}`;
    if (c.mode === 'single') placed(c.clip_scene, own, len, raw);
    else if (c.mode === 'reaction') {
      if (c.clip_scene) placed(c.clip_scene, c.src_start_s, len, raw);
      else listenerAlone(c.show, k, len, raw);
    } else if (c.mode === 'split') {
      placed(c.clip_scene, own, len, `${raw}t`);
      const low = `${raw}b`;
      let lowHead = head;
      if (c.bottom === 'product') {
        still(src.products[c.product].path, len, low);
        lowHead = 0.5;
      } else if (c.listener_source === 'idle') idle(c.listener, c.bottom_start_s || 0, len, low);
      else placed(c.listener_clip_scene, c.bottom_start_s || 0, len, low);
      const { filters } = kitPanelSplit({ top: `${raw}t`, bottom: low, out: `s${k}`, width, height, seam: c.seam, top_look: { head, crop: c.crop }, bottom_look: { head: lowHead } });
      graph.push(...filters);
      segs.push(`s${k}`);
      return;
    } else throw new Error(`dialogue-cut: cut ${k} has no mode a render knows (${c.mode})`);
    graph.push(...kitPanelCover({ src: raw, out: `s${k}`, w: width, h: height, head, crop: c.crop }));
    segs.push(`s${k}`);
  });

  const join = kitPanelJoin({ inputs: segs, out: 'body', spans: cuts.map((c) => c.end_s - c.start_s), fps });
  graph.push(...join.filters);
  const look = DCUT_GRADES[grade] || null;
  graph.push(`[body]${look ? `${look},` : ''}format=yuv420p,setsar=1[bodyg]`);

  const dialogue = times.total_s;
  const vi = input('-i', src.voice.path);
  const aformat = 'aresample=48000,aformat=sample_fmts=fltp:sample_rates=48000:channel_layouts=stereo';
  graph.push(`[${vi}:a]${aformat},apad,atrim=0:${kitNum(dialogue)},asetpts=PTS-STARTPTS[adlg]`);

  let total = dialogue;
  if (src.ending) {
    const e = src.ending;
    const ei = input('-i', e.path);
    const es = e.frames / fps;
    total += es;
    graph.push(
      `[${ei}:v]setpts=PTS-STARTPTS,fps=${fps},scale=${width}:${height}:force_original_aspect_ratio=increase,crop=${width}:${height},setsar=1,` +
        `tpad=stop_mode=clone:stop_duration=1,trim=end_frame=${e.frames},setpts=PTS-STARTPTS,settb=AVTB,format=yuv420p[endv]`,
    );
    graph.push(
      e.has_audio
        ? `[${ei}:a]${aformat},apad,atrim=0:${kitNum(es)},asetpts=PTS-STARTPTS[aend]`
        : `anullsrc=channel_layout=stereo:sample_rate=48000,atrim=0:${kitNum(es)},asetpts=PTS-STARTPTS[aend]`,
    );
    graph.push('[bodyg][endv]concat=n=2:v=1:a=0[vout]');
    graph.push('[adlg][aend]concat=n=2:v=0:a=1[aout]');
  } else {
    graph.push('[bodyg]null[vout]');
    graph.push('[adlg]anull[aout]');
  }
  return { args, graph, times, dialogue_s: dialogue, total_s: total };
}

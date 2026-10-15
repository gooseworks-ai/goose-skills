// assemble's pure helpers: where each cut starts and ends when the cut follows a voice or song
// (spans), how a safe zone moves when a picture is scaled onto the cut, the grade presets and the
// final-encode size rule. No ffmpeg here, so the tests can check the arithmetic directly.
// Every top-level name starts with `assemble` (bundled modules share one namespace).

/** The largest finished cut the part hands on: the line refuses uploads over 200 MB. */
export const ASSEMBLE_MAX_BYTES = 180 * 1024 * 1024;

/** The shortest picture a voiced scene keeps when silent scenes take fixed time from it. */
export const ASSEMBLE_MIN_VOICED_S = 0.4;

const assembleGrainGrades = new Set(['phone-grain', 'phonecam']);

/**
 * The bitrate cap for the final encode (GOOSE-4015 size rule): grain looks 8 Mbps, everything else
 * 16 Mbps. CRF 18 on temporal grain runs near 50 Mbps, which passes the upload limit in 30 s.
 */
export function assembleRateCap(grade) {
  return assembleGrainGrades.has(grade) ? ['-maxrate', '8M', '-bufsize', '16M'] : ['-maxrate', '16M', '-bufsize', '32M'];
}

/**
 * The filter chain a grade adds to each body cut (never to the end card), or '' for none.
 * phone-grain: a slight contrast lift, a little less colour, light denoise, then fine moving grain.
 * phonecam: down to a 720 short side, moving grain, back up: a phone camera's softness.
 */
export function assembleGradeChain(grade, w, h) {
  if (grade === 'phone-grain') return 'eq=contrast=1.06:saturation=0.93,hqdn3d=1.5:1.5:3:3,noise=alls=9:allf=t+u';
  if (grade === 'phonecam') {
    const short = Math.min(w, h);
    if (short <= 720) return 'noise=alls=8:allf=t';
    const k = 720 / short;
    const even = (v) => Math.max(2, Math.round((v * k) / 2) * 2);
    return `scale=${even(w)}:${even(h)}:flags=bicubic,noise=alls=8:allf=t,scale=${w}:${h}:flags=bicubic,setsar=1`;
  }
  return '';
}

/** Scales a picture to w x h: cover crops to fill, contain pads with `background`. Square pixels. */
export function assembleFit(w, h, fit, background) {
  const square = "scale='trunc(iw*sar/2)*2':'trunc(ih/2)*2'";
  if (fit === 'contain') {
    return `${square},scale=${w}:${h}:force_original_aspect_ratio=decrease,pad=${w}:${h}:(ow-iw)/2:(oh-ih)/2:color=${background},setsar=1`;
  }
  return `${square},scale=${w}:${h}:force_original_aspect_ratio=increase,crop=${w}:${h},setsar=1`;
}

/**
 * A still with a slow centred push from 1.0 to `to` over its `frames`: fitted at twice the size first,
 * so the zoom never resamples the edges and the steps stay under half a pixel.
 */
export function assembleKenBurns(w, h, fps, frames, to, fit, background) {
  const last = Math.max(1, frames - 1);
  const step = (to - 1) / last;
  const z = `'min(1+${step.toFixed(8)}*on,${to})'`;
  return `fps=${fps},${assembleFit(w * 2, h * 2, fit, background)},zoompan=z=${z}:x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=1:s=${w}x${h}:fps=${fps},setsar=1`;
}

/**
 * A safe zone drawn on a sw x sh picture, moved onto the w x h cut the way `fit` scales it (centred).
 * Null when less than 4 px of it is left on the cut.
 */
export function assembleMapZone(zone, sw, sh, w, h, fit) {
  if (!zone || !(sw > 0 && sh > 0)) return null;
  const k = fit === 'contain' ? Math.min(w / sw, h / sh) : Math.max(w / sw, h / sh);
  const [ox, oy] = [(sw * k - w) / 2, (sh * k - h) / 2];
  const x0 = Math.max(0, Math.floor(zone.x * k - ox));
  const y0 = Math.max(0, Math.floor(zone.y * k - oy));
  const x1 = Math.min(w, Math.ceil((zone.x + zone.w) * k - ox));
  const y1 = Math.min(h, Math.ceil((zone.y + zone.h) * k - oy));
  return x1 - x0 >= 4 && y1 - y0 >= 4 ? { use: zone.use, x: x0, y: y0, w: x1 - x0, h: y1 - y0 } : null;
}

/**
 * 1.2.1: a box on a sw x sh still (shares of the picture) as it shows on the w x h cut: moved the way `fit`
 * places the still, then grown to cover where a centred push from 1 to `zoomTo` carries it, clamped to the
 * frame. Null when less than 4 px of it is on the cut.
 */
export function assembleMapKeepClear(box, sw, sh, w, h, fit, zoomTo) {
  const z = assembleMapZone({ use: 'product', x: box.x * sw, y: box.y * sh, w: box.w * sw, h: box.h * sh }, sw, sh, w, h, fit);
  if (!z) return null;
  const k = Math.max(1, zoomTo || 1);
  const at = (v, c) => c + (v - c) * k;
  const x0 = Math.max(0, Math.min(z.x, at(z.x, w / 2)));
  const y0 = Math.max(0, Math.min(z.y, at(z.y, h / 2)));
  const x1 = Math.min(w, Math.max(z.x + z.w, at(z.x + z.w, w / 2)));
  const y1 = Math.min(h, Math.max(z.y + z.h, at(z.y + z.h, h / 2)));
  return { x: Math.floor(x0), y: Math.floor(y0), w: Math.ceil(x1) - Math.floor(x0), h: Math.ceil(y1) - Math.floor(y0) };
}

/** Speech entries and words that start before `total`, with ends held to it. */
export function assembleClampSpeech(speech, total) {
  const end = (v) => Math.min(v, total);
  return (speech || [])
    .filter((s) => s.start_s < total)
    .map((s) => {
      const out = { ...s, end_s: end(s.end_s) };
      if (Array.isArray(s.words)) out.words = s.words.filter((wd) => wd.start_s < total).map((wd) => ({ ...wd, end_s: end(wd.end_s) }));
      return out;
    });
}

/** Scenes that start before `total`, with ends held to it. */
export function assembleClampScenes(scenes, total) {
  return (scenes || []).filter((s) => s.start_s < total).map((s) => ({ ...s, end_s: Math.min(s.end_s, total) }));
}

class AssembleCutProblem extends Error {}

/** True when `e` is a refusal from assembleSpanCuts (the part turns it into bad_input). */
export function assembleIsCutProblem(e) {
  return e instanceof AssembleCutProblem;
}

export function assembleNo(message) {
  return new AssembleCutProblem(message);
}

/**
 * Where every cut goes when the pictures follow a voice or a song.
 *
 * - A clip whose id has a span starts on the frame at or before its span's start (so a cut never lands
 *   inside the line's first word) and runs to the next voiced clip's start. The first starts at 0; the last
 *   runs to its span's end plus `tail_s`.
 * - A clip with no span (a scene with no line) is silent. `share_previous` splits the voiced clip's
 *   time evenly with the silent clips after it (silent clips before the first voiced one share with it);
 *   `fixed` gives each silent clip `seconds`, taken from the voiced clip it shares with.
 * - `card.fills = 'last_span'`: the end card takes the last span's place, from its start to its end plus
 *   `tail_s`, and never shorter than the card itself. A clip with the card's id is not used.
 *   `'after'`: the card follows the last cut.
 *
 * @param {Array<{id?: string}>} clips  in plan order
 * @param {Array<{id: string, start_s: number, end_s: number}>} spans
 * `until_s` (optional) holds the last cut to at least that time (a dropped card span's end plus tail).
 *
 * @param {{fps: number, tail_s: number, silent: {mode: string, seconds?: number}, card: null | {fills: string, frames: number}, until_s?: number}} options
 * @returns {{cuts: Array<{index: number, id: string, start_f: number, frames: number, voiced: boolean}>,
 *            card: null | {id: string | null, start_f: number, frames: number}, total_f: number}}
 */
export function assembleSpanCuts(clips, spans, { fps, tail_s, silent, card, until_s }) {
  const at = (s) => Math.floor(s * fps + 1e-6);
  const byId = new Map();
  for (const s of spans) {
    if (byId.has(s.id)) throw assembleNo(`spans name scene "${s.id}" twice`);
    if (s.end_s < s.start_s) throw assembleNo(`span "${s.id}" ends before it starts`);
    byId.set(s.id, s);
  }
  const seen = new Set();
  clips.forEach((c, k) => {
    if (typeof c.id !== 'string' || !c.id) throw assembleNo(`clips[${k}] needs an id to be matched to a span`);
    if (seen.has(c.id)) throw assembleNo(`two clips have the id "${c.id}"`);
    seen.add(c.id);
  });

  // The end card's span: the latest span, when the card fills it.
  let cardSpan = null;
  if (card && card.fills === 'last_span') {
    cardSpan = spans.reduce((a, b) => (b.start_s > a.start_s ? b : a));
    const k = clips.findIndex((c) => c.id === cardSpan.id);
    if (k >= 0 && k < clips.length - 1) {
      throw assembleNo(`scene "${cardSpan.id}" is the end card's (the last span), but clips come after it`);
    }
  }
  const body = clips.map((c, index) => ({ index, id: c.id, span: byId.get(c.id) })).filter((c) => !cardSpan || c.id !== cardSpan.id);
  const voiced = body.filter((c) => c.span);
  if (!voiced.length) throw assembleNo('no clip matches a span: the clip ids must be the scene ids the spans name');
  for (const s of spans) {
    if (s === cardSpan) continue;
    if (!body.some((c) => c.id === s.id)) throw assembleNo(`span "${s.id}" has no clip`);
  }
  for (let i = 1; i < voiced.length; i++) {
    if (at(voiced[i].span.start_s) <= at(voiced[i - 1].span.start_s)) {
      throw assembleNo(`scene "${voiced[i].id}" starts at or before scene "${voiced[i - 1].id}": the clips must be in the spans' order and at least a frame apart`);
    }
  }
  const lastVoiced = voiced[voiced.length - 1];
  let bodyEnd;
  if (cardSpan) {
    bodyEnd = at(cardSpan.start_s);
    if (bodyEnd <= at(lastVoiced.span.start_s)) throw assembleNo(`the end card's scene "${cardSpan.id}" starts before scene "${lastVoiced.id}"`);
  } else {
    bodyEnd = Math.round((Math.max(lastVoiced.span.end_s + tail_s, until_s || 0)) * fps);
    if (bodyEnd <= at(lastVoiced.span.start_s)) bodyEnd = at(lastVoiced.span.start_s) + 1;
  }

  // Groups: one voiced clip with the silent clips after it; silent clips before the first voiced one join it.
  const groups = [];
  const lead = [];
  for (const c of body) {
    if (c.span) groups.push({ voiced: c, members: groups.length ? [c] : [...lead, c] });
    else if (groups.length) groups[groups.length - 1].members.push(c);
    else lead.push(c);
  }
  const mode = (silent && silent.mode) || 'share_previous';
  const fixedFrames = Math.max(1, Math.round(((silent && silent.seconds) || 1) * fps));
  const cuts = [];
  groups.forEach((g, gi) => {
    const start = gi === 0 ? 0 : at(g.voiced.span.start_s);
    const end = gi + 1 < groups.length ? at(groups[gi + 1].voiced.span.start_s) : bodyEnd;
    const total = end - start;
    const n = g.members.length;
    let lengths;
    if (n === 1) lengths = [total];
    else if (mode === 'fixed') {
      const keep = total - fixedFrames * (n - 1);
      const floor = Math.round(ASSEMBLE_MIN_VOICED_S * fps);
      if (keep < floor) {
        throw assembleNo(`scene "${g.voiced.id}" would keep ${(keep / fps).toFixed(2)} s after ${n - 1} silent scene(s) take ${(fixedFrames / fps).toFixed(2)} s each; it needs at least ${ASSEMBLE_MIN_VOICED_S} s`);
      }
      lengths = g.members.map((m) => (m === g.voiced ? keep : fixedFrames));
    } else {
      if (total < n) throw assembleNo(`scene "${g.voiced.id}" is too short to share with ${n - 1} silent scene(s)`);
      const base = Math.floor(total / n);
      const extra = total - base * n;
      lengths = g.members.map((_, i) => base + (i < extra ? 1 : 0));
    }
    let f = start;
    g.members.forEach((m, i) => {
      cuts.push({ index: m.index, id: m.id, start_f: f, frames: lengths[i], voiced: m === g.voiced });
      f += lengths[i];
    });
  });

  let cardCut = null;
  if (card) {
    if (cardSpan) {
      const want = Math.round((cardSpan.end_s + tail_s) * fps) - bodyEnd;
      cardCut = { id: cardSpan.id, start_f: bodyEnd, frames: Math.max(want, card.frames) };
    } else cardCut = { id: null, start_f: bodyEnd, frames: card.frames };
  }
  return { cuts, card: cardCut, total_f: bodyEnd + (cardCut ? cardCut.frames : 0) };
}

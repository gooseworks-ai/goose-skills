// The "filmed screen" look, ported from footage-cutlist `scripts/filmed.py`
// (ScreenLook): footage framed as a screen photographed at close range, with a
// thin bezel, the dark room around it, faint moire, a vignette, grain and a
// slow two-sine handheld drift. Pure builders: they return ffmpeg filter-graph
// text and numbers, and never run ffmpeg, read files or touch ctx. A part that
// uses the look (cut-footage 1.1.0 `look: "screen"`) probes its source, calls
// kitScreenGraph and runs the graph with kitFfmpeg.
//
// The geometry is CONSTRUCTED, not generated (filmed.py's header has the
// reasons). The style constants, in `screen`:
//   rot            degrees, -1.5 to 1.5. A flat 0 reads as a pasted screenshot;
//                  past about 1 degree it reads as a wonky camera.
//   alternate_rot  optional; used instead of `rot` on odd beats (index 1, 3, ...).
//   keystone       0 to 0.04: how much narrower the far (top) edge is. ~0.007 for
//                  an insert over a creator, ~0.024 for a full walkthrough.
//   fill           0.3 to 1: how much of the box the screen fills. Zoom out, never in.
//   fit            'width' fits a whole panel by width (room above and below);
//                  'height' fills the box height (up to 1.3x the box width).
//   drift          0 to 3: the handheld drift's strength (1 = filmed.py's).
//   bezel          0 to 0.05: the bezel's width as a fraction of the screen.
//   room           the room colour: [r, g, b] or '#rrggbb'.
//   moire          0 to 0.05: the moire's amplitude (filmed.py: 0.016).
//   vignette       0 to 0.5: how much darker the corners are (filmed.py: 0.30).
//   grain          0 to 20: ffmpeg noise strength of the per-frame grain.
// Per beat, beside the constants: `crop` [x0, y0, x1, y1] (fractions of the
// source) picks the region shown, and `masks` (the same boxes) are blurred in
// the SOURCE before the crop, so an email in a sidebar stays hidden whatever
// the crop does.
//
// The look is built in three passes of one graph:
//   1. page: masks, crop, scale to the fitted size, the bezel as a border, then
//      a transparent canvas and one `perspective` (sense=destination,
//      eval=frame) that places it on the keystoned, rotated quad. The drift is
//      a translation of the quad, so it is the same corners plus two sines of
//      the frame number.
//   2. room: the page laid over a solid room colour.
//   3. lens: vignette x moire is one static picture (computed once by geq on a
//      single frame, then looped) multiplied into the luma; then grain.
// Differences from filmed.py: the moire and vignette are applied over the whole
// frame (filmed.py masks the moire to the screen; on a room of (7,7,9) the
// difference is below one code value), they scale luma only, and the grain is
// ffmpeg's seeded noise rather than four numpy frames.
//
// Exports (every top-level name starts with `kitScreen` / `KIT_SCREEN_`):
//   KIT_SCREEN_DEFAULTS                       filmed.py's DEFAULTS plus moire/vignette/grain
//   kitScreenProblems(screen) -> string[]     unknown keys and out-of-range values
//   kitScreenParams(screen) -> params         defaults filled; throws KitScreenRefusal
//   kitScreenBoxProblems(box, what) -> string[]
//   kitScreenRot(params, index) -> degrees    alternate_rot on odd beats
//   kitScreenFit(box, page, params) -> {width, height}
//   kitScreenQuad(box, size, params, rot) -> [[x, y] x4]   TL, TR, BR, BL around the box centre, at t = 0
//   kitScreenDrift(box, params, seed) -> {ax, ay, fx, fy, px, py}   x(t) = ax*sin(2*PI*fx*t + px)
//   kitScreenDriftAt(drift, t) -> [dx, dy]
//   kitScreenHomography(src4, dst4) -> number[9]   maps src points onto dst points
//   kitScreenProject(h, [x, y]) -> [x, y]
//   kitScreenLensExpr(box, params) -> string      the geq luma expression of the static lens picture
//   kitScreenGraph(options) -> {graph, page, canvas, quad, rot, drift}
//   class KitScreenRefusal extends Error          bad params or sizes (code 'bad_input')
import { kitNum } from './part.mjs';

export const KIT_SCREEN_DEFAULTS = Object.freeze({
  rot: -0.8,
  keystone: 0.012,
  fill: 0.86,
  fit: 'width',
  bezel: 0.012,
  drift: 1.0,
  room: [7, 7, 9],
  moire: 0.016,
  vignette: 0.3,
  grain: 4,
});

const KIT_SCREEN_RANGES = {
  rot: [-1.5, 1.5],
  alternate_rot: [-1.5, 1.5],
  keystone: [0, 0.04],
  fill: [0.3, 1],
  drift: [0, 3],
  bezel: [0, 0.05],
  moire: [0, 0.05],
  vignette: [0, 0.5],
  grain: [0, 20],
};

const KIT_SCREEN_KEYS = new Set([...Object.keys(KIT_SCREEN_RANGES), 'fit', 'room']);
const KIT_SCREEN_BEZEL_RGB = '0x0E0E11';
const KIT_SCREEN_HEX = /^#[0-9a-fA-F]{6}$/;

/** A screen-look input the builders refuse. `code` matches ctx.error's 'bad_input'. */
export class KitScreenRefusal extends Error {
  constructor(message) {
    super(message);
    this.name = 'KitScreenRefusal';
    this.code = 'bad_input';
  }
}

function kitScreenIsNum(v) {
  return typeof v === 'number' && Number.isFinite(v);
}

/** Problems with a `screen` object: unknown keys and out-of-range values. Empty when it is fine. */
export function kitScreenProblems(screen) {
  if (screen == null) return [];
  if (typeof screen !== 'object' || Array.isArray(screen)) return ['screen must be an object'];
  const out = [];
  for (const key of Object.keys(screen)) {
    if (!KIT_SCREEN_KEYS.has(key)) out.push(`screen.${key} is not a screen-look setting`);
  }
  for (const [key, [lo, hi]] of Object.entries(KIT_SCREEN_RANGES)) {
    const v = screen[key];
    if (v === undefined) continue;
    if (!kitScreenIsNum(v)) out.push(`screen.${key} must be a number`);
    else if (v < lo || v > hi) out.push(`screen.${key} ${v} is outside ${lo} to ${hi}`);
  }
  if (screen.fit !== undefined && screen.fit !== 'width' && screen.fit !== 'height') out.push(`screen.fit must be 'width' or 'height'`);
  const room = screen.room;
  if (room !== undefined) {
    const rgbOk = Array.isArray(room) && room.length === 3 && room.every((c) => Number.isInteger(c) && c >= 0 && c <= 255);
    if (!rgbOk && !(typeof room === 'string' && KIT_SCREEN_HEX.test(room))) out.push(`screen.room must be [r, g, b] (0-255) or '#rrggbb'`);
  }
  return out;
}

/** The screen settings with filmed.py's defaults filled in. Throws KitScreenRefusal listing every problem. */
export function kitScreenParams(screen) {
  const problems = kitScreenProblems(screen);
  if (problems.length) throw new KitScreenRefusal(`the screen look is refused: ${problems.join('; ')}`);
  return { ...KIT_SCREEN_DEFAULTS, ...(screen || {}) };
}

/** Problems with a crop or mask box [x0, y0, x1, y1] in fractions of the source. */
export function kitScreenBoxProblems(box, what = 'box') {
  if (!Array.isArray(box) || box.length !== 4 || !box.every(kitScreenIsNum)) return [`${what} must be [x0, y0, x1, y1]`];
  const [x0, y0, x1, y1] = box;
  if (Math.min(x0, y0, x1, y1) < 0 || Math.max(x0, y0, x1, y1) > 1) return [`${what} must be fractions from 0 to 1`];
  if (!(x1 > x0 && y1 > y0)) return [`${what} must have x1 > x0 and y1 > y0`];
  return [];
}

/** The beat's angle: `alternate_rot` on odd beats when it is set, else `rot`. */
export function kitScreenRot(params, index = 0) {
  return params.alternate_rot !== undefined && index % 2 === 1 ? params.alternate_rot : params.rot;
}

function kitScreenEven(n) {
  return Math.max(2, 2 * Math.round(n / 2));
}

/**
 * The size the page is scaled to inside a box (filmed.py render's fit block), rounded to even pixels.
 * `page` is the source region after the crop.
 */
export function kitScreenFit(box, page, params) {
  const { width: W, height: H } = box;
  const ar = page.height / page.width;
  let tw;
  let th;
  if (params.fit === 'width') {
    tw = W * params.fill;
    th = tw * ar;
    if (th > H * 0.98) {
      th = H * 0.98;
      tw = th / ar;
    }
  } else {
    th = H * params.fill;
    tw = th / ar;
    if (tw > W * 1.3) {
      tw = W * 1.3;
      th = tw * ar;
    }
  }
  return { width: kitScreenEven(tw), height: kitScreenEven(th) };
}

/**
 * The screen's corners at t = 0 in box pixels: TL, TR, BR, BL. The far edge is
 * narrowed by `keystone`, then the quad turns by `rot` degrees about the box centre.
 */
export function kitScreenQuad(box, size, params, rot = params.rot) {
  const cx = box.width / 2;
  const cy = box.height / 2;
  const tw = size.width;
  const th = size.height;
  const kk = params.keystone * tw;
  const quad = [
    [cx - tw / 2 + kk, cy - th / 2],
    [cx + tw / 2, cy - th / 2 + kk * 0.35],
    [cx + tw / 2 - kk * 0.3, cy + th / 2],
    [cx - tw / 2, cy + th / 2 - kk * 0.25],
  ];
  const r = (rot * Math.PI) / 180;
  const cos = Math.cos(r);
  const sin = Math.sin(r);
  return quad.map(([qx, qy]) => [(qx - cx) * cos - (qy - cy) * sin + cx, (qx - cx) * sin + (qy - cy) * cos + cy]);
}

/** The handheld drift: two slow sines, phased by the seed (filmed.py ph1, ph2). */
export function kitScreenDrift(box, params, seed = 0) {
  const s = Math.abs(Math.trunc(seed));
  return {
    ax: params.drift * 0.006 * box.width,
    ay: params.drift * 0.004 * box.height,
    fx: 0.09,
    fy: 0.15,
    px: 1.1 + (s % 7) * 0.7,
    py: 2.3 + (s % 5) * 1.3,
  };
}

/** The drift's offset in pixels `t` seconds into the beat. */
export function kitScreenDriftAt(drift, t) {
  return [drift.ax * Math.sin(2 * Math.PI * drift.fx * t + drift.px), drift.ay * Math.sin(2 * Math.PI * drift.fy * t + drift.py)];
}

/** The projective map taking the four `src` points onto the four `dst` points (filmed.py _coeffs, the other way). */
export function kitScreenHomography(src, dst) {
  const rows = [];
  for (let i = 0; i < 4; i++) {
    const [x, y] = src[i];
    const [u, v] = dst[i];
    rows.push([x, y, 1, 0, 0, 0, -u * x, -u * y, u]);
    rows.push([0, 0, 0, x, y, 1, -v * x, -v * y, v]);
  }
  for (let c = 0; c < 8; c++) {
    let pivot = c;
    for (let r = c + 1; r < 8; r++) if (Math.abs(rows[r][c]) > Math.abs(rows[pivot][c])) pivot = r;
    if (Math.abs(rows[pivot][c]) < 1e-12) throw new KitScreenRefusal('the screen corners are degenerate');
    [rows[c], rows[pivot]] = [rows[pivot], rows[c]];
    for (let r = 0; r < 8; r++) {
      if (r === c) continue;
      const f = rows[r][c] / rows[c][c];
      for (let k = c; k < 9; k++) rows[r][k] -= f * rows[c][k];
    }
  }
  return [...rows.map((row, i) => row[8] / row[i]), 1];
}

/** A point through a homography. */
export function kitScreenProject(h, [x, y]) {
  const w = h[6] * x + h[7] * y + h[8];
  return [(h[0] * x + h[1] * y + h[2]) / w, (h[3] * x + h[4] * y + h[5]) / w];
}

/**
 * The geq luma expression of the static lens picture, 255 x vignette x moire
 * (filmed.py's self.vig and self.moire), normalised so its brightest value is 255.
 */
export function kitScreenLensExpr(box, params) {
  const { width: W, height: H } = box;
  const n = (v) => kitNum(v, 9);
  const A = params.moire;
  const period = 3.1;
  const ang = 0.3;
  const u = `(X*${n(Math.cos(ang))}+Y*${n(Math.sin(ang))}+${n(0.8 * period)}*sin(Y*${n((2 * Math.PI) / (H * 0.7))}))`;
  const env = `(0.5+0.5*abs(sin(Y*${n((2 * Math.PI) / (H * 0.9))})))`;
  const moire = A > 0 ? `(1+${n(A)}*${env}*sin(${u}*${n((2 * Math.PI) / period)}))/${n(1 + A)}` : '1';
  // filmed.py: clip(1 - 0.16 * rr^2.2, 0.70, 1), with 0.16 and 0.70 scaled from its 0.30 corner drop.
  const V = params.vignette;
  const rr = `hypot((X-${n(W / 2)})/${n(W / 2)},(Y-${n(H / 2)})/${n(H / 2)})`;
  const vig = V > 0 ? `clip(1-${n((0.16 * V) / 0.3)}*pow(${rr},2.2),${n(1 - V)},1)` : '1';
  return `255*${vig}*${moire}`;
}

function kitScreenRgb(room) {
  if (typeof room === 'string') return `0x${room.slice(1).toUpperCase()}`;
  return `0x${room.map((c) => c.toString(16).padStart(2, '0')).join('').toUpperCase()}`;
}

function kitScreenLabel(s) {
  if (typeof s !== 'string' || !/^[A-Za-z0-9_:.-]+$/.test(s)) throw new KitScreenRefusal(`screen graph label ${JSON.stringify(s)} is not a plain name`);
  return s;
}

/**
 * The filter graph that turns the stream `[input]` (the source, PTS from 0, at
 * `fps`) into `[output]`: a box.width x box.height yuv444p picture of the source
 * filmed as a screen.
 *
 *   options = {
 *     input, output,           // pad labels, without brackets
 *     box: {width, height, fps},
 *     source: {width, height}, // the source's own size (probe it)
 *     screen,                  // the style's settings (checked by kitScreenParams)
 *     crop, masks,             // optional per-beat boxes (fractions of the source)
 *     index, seed,             // the beat's index (alternate_rot) and the drift's phase seed
 *     id,                      // prefix of internal labels, unique per graph (default: output)
 *   }
 * Returns {graph (';'-joined filter chains), page {width, height} (the scaled
 * screen), canvas {width, height} (the working canvas), quad (corners at t = 0
 * in box pixels), rot, drift}.
 */
export function kitScreenGraph(options) {
  const { box, source, crop, masks = [], index = 0 } = options || {};
  const input = kitScreenLabel(options && options.input);
  const output = kitScreenLabel(options && options.output);
  const id = kitScreenLabel(options.id ?? output);
  const problems = [];
  for (const [what, o] of [['box', box], ['source', source]]) {
    if (!o || !Number.isInteger(o.width) || !Number.isInteger(o.height) || o.width < 16 || o.height < 16) problems.push(`${what} must have whole width and height of at least 16 pixels`);
  }
  if (box && box.width % 2 + box.height % 2) problems.push('box width and height must be even');
  if (!box || !kitScreenIsNum(box.fps) || box.fps <= 0 || box.fps > 120) problems.push('box.fps must be a number from 0 to 120');
  if (crop != null) problems.push(...kitScreenBoxProblems(crop, 'crop'));
  if (!Array.isArray(masks)) problems.push('masks must be a list of boxes');
  else masks.forEach((m, i) => problems.push(...kitScreenBoxProblems(m, `masks[${i}]`)));
  if (!Number.isInteger(index) || index < 0) problems.push('index must be a whole number from 0');
  if (options.seed !== undefined && !Number.isInteger(options.seed)) problems.push('seed must be a whole number');
  problems.push(...kitScreenProblems(options.screen));
  if (problems.length) throw new KitScreenRefusal(`the screen look is refused: ${problems.join('; ')}`);

  const params = kitScreenParams(options.screen);
  const seed = options.seed ?? index;
  const W = box.width;
  const H = box.height;
  const fps = kitNum(box.fps);
  const sw = source.width;
  const sh = source.height;
  const n = (v) => kitNum(v, 3);
  const chains = [];

  // 1. Masks in source pixels, before the crop.
  let head = `[${input}]format=yuva444p`;
  masks.forEach((m, i) => {
    const x = Math.floor(sw * m[0]);
    const y = Math.floor(sh * m[1]);
    const w = Math.max(2, Math.floor(sw * m[2]) - x);
    const h = Math.max(2, Math.floor(sh * m[3]) - y);
    chains.push(`${head},split=2[${id}_m${i}a][${id}_m${i}b]`);
    chains.push(`[${id}_m${i}b]crop=${w}:${h}:${x}:${y},gblur=sigma=14[${id}_m${i}c]`);
    // format=yuv444 keeps the page 4:4:4 (overlay's default is 4:2:0), so the crop below is exact.
    head = `[${id}_m${i}a][${id}_m${i}c]overlay=${x}:${y}:format=yuv444`;
  });
  const [x0, y0, x1, y1] = crop || [0, 0, 1, 1];
  const cx = Math.floor(sw * x0);
  const cy = Math.floor(sh * y0);
  const cw = Math.max(2, Math.floor(sw * x1) - cx);
  const ch = Math.max(2, Math.floor(sh * y1) - cy);
  const page = kitScreenFit(box, { width: cw, height: ch }, params);
  const bx = Math.round((params.bezel * page.width) / 2);
  const by = Math.round((params.bezel * page.height) / 2);
  // The working canvas holds the whole bezelled page (fit 'height' may be wider than
  // the box), centred on the box centre so the final crop is a whole-pixel centre crop.
  const CW = W + 2 * Math.max(0, Math.ceil((page.width + 2 * bx + 8 - W) / 2));
  const CH = H + 2 * Math.max(0, Math.ceil((page.height + 2 * by + 8 - H) / 2));
  const ox = Math.floor((CW - page.width) / 2);
  const oy = Math.floor((CH - page.height) / 2);
  const rot = kitScreenRot(params, index);
  const quad = kitScreenQuad(box, page, params, rot);
  const shift = [(CW - W) / 2, (CH - H) / 2];
  const dst = quad.map(([x, y]) => [x + shift[0], y + shift[1]]);
  const hom = kitScreenHomography(
    [
      [ox, oy],
      [ox + page.width, oy],
      [ox + page.width, oy + page.height],
      [ox, oy + page.height],
    ],
    dst,
  );
  // perspective's corners are the INPUT canvas's: top left, top right, bottom left, bottom right.
  const corners = [
    [0, 0],
    [CW, 0],
    [0, CH],
    [CW, CH],
  ].map((p) => kitScreenProject(hom, p));
  const drift = kitScreenDrift(box, params, seed);
  const sx = drift.ax > 0 ? `+${n(drift.ax)}*sin(in/${fps}*${kitNum(2 * Math.PI * drift.fx, 9)}+${kitNum(drift.px, 9)})` : '';
  const sy = drift.ay > 0 ? `+${n(drift.ay)}*sin(in/${fps}*${kitNum(2 * Math.PI * drift.fy, 9)}+${kitNum(drift.py, 9)})` : '';
  const persp = corners.map(([x, y], i) => `x${i}=${n(x)}${sx}:y${i}=${n(y)}${sy}`).join(':');
  let pageChain = `${head}`;
  if (crop) pageChain += `,crop=${cw}:${ch}:${cx}:${cy}`;
  pageChain += `,scale=${page.width}:${page.height}:flags=lanczos,setsar=1`;
  if (bx || by) pageChain += `,pad=${page.width + 2 * bx}:${page.height + 2 * by}:${bx}:${by}:color=${KIT_SCREEN_BEZEL_RGB}`;
  pageChain += `,pad=${CW}:${CH}:${ox - bx}:${oy - by}:color=black@0`;
  pageChain += `,perspective=${persp}:sense=destination:eval=frame:interpolation=cubic[${id}_page]`;
  chains.push(pageChain);

  // 2. The room.
  chains.push(`color=c=${kitScreenRgb(params.room)}:s=${CW}x${CH}:r=${fps},format=yuv444p[${id}_room]`);
  let lit = `[${id}_room][${id}_page]overlay=0:0:shortest=1:format=yuv444`;
  if (CW !== W || CH !== H) lit += `,crop=${W}:${H}:${shift[0]}:${shift[1]}`;

  // 3. The lens: one static vignette x moire picture multiplied into the luma, then grain.
  if (params.vignette > 0 || params.moire > 0) {
    chains.push(`${lit}[${id}_lit]`);
    chains.push(`color=c=black:s=${W}x${H}:r=${fps}:d=1,format=yuv444p,trim=end_frame=1,geq=lum='${kitScreenLensExpr(box, params)}':cb=128:cr=128,loop=loop=-1:size=1[${id}_lens]`);
    lit = `[${id}_lit][${id}_lens]blend=c0_mode=multiply:shortest=1`;
  }
  if (params.grain > 0) {
    const g = Math.round(params.grain);
    const c = Math.round(params.grain / 2);
    // noise's all_seed takes 0 to INT_MAX: fold any whole seed (negative or huge) into that range.
    const noiseSeed = ((Math.abs(seed) % 2147483647) * 7919 + 17) % 2147483647;
    lit += `,noise=c0s=${g}:c0f=t:c1s=${c}:c1f=t:c2s=${c}:c2f=t:all_seed=${noiseSeed}`;
  }
  chains.push(`${lit},setsar=1[${output}]`);
  return { graph: chains.join(';'), page, canvas: { width: CW, height: CH }, quad, rot, drift };
}

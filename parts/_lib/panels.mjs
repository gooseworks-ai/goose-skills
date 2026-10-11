// Panel layouts as ffmpeg filter-graph text: two pictures stacked on a seam
// (a split screen), a cover crop that keeps a head in frame, a crop rect per
// panel, a fit-inside with a letterbox, a divider bar on the seam, and the
// join between segments (a hard cut or a dissolve that keeps every cut on its
// span edge). Pure functions: they build strings and never run ffmpeg.
// Bundled into parts; every top-level name starts with `kit` (bundle.mjs).
//
// Used by cut-footage 1.2.0 (split mode, grid cells) and dialogue-cut 1.0.0
// (speaker over listener or product, reframes, seams per cut).
//
// Labels: builders take bare pad names ("top", "1:v", "seg3") and wrap them
// in [ ]. Every builder returns an array of filter chains; join a whole graph
// with ';' and pass it to -filter_complex.
//
// Sizes: every width, height and offset that reaches a crop, pad or vstack
// is even, because a yuv420p plane cut at an odd row is not chroma-aligned.
// Refusals throw KitPanelError (code 'bad_input'); a part turns it into
// ctx.error('bad_input', err.message).
//
// Exports:
//   KitPanelError                                  error with code 'bad_input'
//   kitPanelEven(n)                                nearest even integer, at least 2
//   kitPanelSeamRows(height, seam, {gap_px})       -> {top_h, gap_px, bottom_h, seam_y}
//   kitPanelRect(rect)                             {x,y,w,h} or [x0,y0,x1,y1] -> {x,y,w,h} (checked)
//   kitPanelCrop(rect)                             -> 'crop=...' or '' (full frame)
//   kitPanelCover({src,out,w,h,head,focus_x,zoom,crop})      -> [chain]
//   kitPanelFit({src,out,w,h,bg,crop})             -> [chains]  whole picture inside w x h, letterboxed
//   kitPanelDim({src,out,dim})                     -> [chain]   the dimmed listener look
//   kitPanelVstack({top,bottom,out,width,height,top_h,gap_px,gap_color})   -> [chains]
//   kitPanelSplit({top,bottom,out,width,height,seam,gap_px,gap_color,top_look,bottom_look})  -> {filters, rows}
//   kitPanelDivider({seam_y,px,color,enable})      -> 'drawbox=...' (append to a chain)
//   kitPanelEnable(windows)                        -> "between(t,a,b)+..." or '0'
//   kitPanelJoinLengths(spans, {fps, transition, dissolve_s})  -> {lengths, starts, dissolve_s, total_s}
//   kitPanelJoin({inputs,out,spans,fps,transition,dissolve_s}) -> {filters, lengths, total_s}

/** A refusal from a panel builder: the inputs describe a layout that cannot be drawn. */
export class KitPanelError extends Error {
  constructor(message) {
    super(message);
    this.name = 'KitPanelError';
    this.code = 'bad_input';
  }
}

const KIT_PANEL_LABEL_RE = /^[A-Za-z0-9_:.]+$/;
const KIT_PANEL_HEX_RE = /^#[0-9A-Fa-f]{6}$/;

function kitPanelRefuse(message) {
  throw new KitPanelError(message);
}

function kitPanelLabel(name, what) {
  if (typeof name !== 'string' || !KIT_PANEL_LABEL_RE.test(name)) kitPanelRefuse(`${what}: "${name}" is not a pad label (letters, digits, _ : .)`);
  return `[${name}]`;
}

function kitPanelFinite(value, what, lo, hi) {
  if (typeof value !== 'number' || !Number.isFinite(value)) kitPanelRefuse(`${what} must be a number`);
  if (value < lo || value > hi) kitPanelRefuse(`${what} must be between ${lo} and ${hi} (got ${value})`);
  return value;
}

function kitPanelSize(value, what) {
  if (!Number.isInteger(value) || value < 2 || value % 2) kitPanelRefuse(`${what} must be an even whole number of pixels, 2 or more (got ${value})`);
  return value;
}

/** A number for a filter string: fixed precision, no trailing zeros. */
function kitPanelNum(value, digits = 6) {
  return Number(value).toFixed(digits).replace(/\.?0+$/, '') || '0';
}

/** `#RRGGBB` as ffmpeg's 0xRRGGBB, or a refusal. */
function kitPanelColor(hex, what) {
  if (typeof hex !== 'string' || !KIT_PANEL_HEX_RE.test(hex)) kitPanelRefuse(`${what} must be a #RRGGBB colour (got ${JSON.stringify(hex)})`);
  return `0x${hex.slice(1).toUpperCase()}`;
}

/** The nearest even whole number, never below 2. */
export function kitPanelEven(n) {
  if (typeof n !== 'number' || !Number.isFinite(n)) kitPanelRefuse('a size must be a number');
  return Math.max(2, Math.round(n / 2) * 2);
}

/**
 * The rows of a two-panel stack. `seam` is a ratio of the usable height
 * (0 < seam < 1: 0.62 makes a big top panel) or a pixel row (an integer of 2
 * or more: 768 puts the seam 768 px from the top). The gap is drawn under the
 * top panel, so the seam is exact: top_h + gap_px + bottom_h = height.
 * seam_y is the middle of the gap (where a divider bar centres).
 */
export function kitPanelSeamRows(height, seam, { gap_px = 0 } = {}) {
  kitPanelSize(height, 'height');
  if (!Number.isInteger(gap_px) || gap_px < 0 || gap_px % 2) kitPanelRefuse(`gap_px must be an even whole number, 0 or more (got ${gap_px})`);
  const usable = height - gap_px;
  if (usable < 4) kitPanelRefuse(`gap_px ${gap_px} leaves no room for two panels in ${height} px`);
  if (typeof seam !== 'number' || !Number.isFinite(seam) || seam <= 0) kitPanelRefuse(`seam must be a ratio between 0 and 1 or a pixel row (got ${seam})`);
  let top;
  if (seam < 1) top = Math.round((usable * seam) / 2) * 2;
  else {
    if (!Number.isInteger(seam)) kitPanelRefuse(`a pixel seam must be a whole number (got ${seam})`);
    if (seam >= height) kitPanelRefuse(`seam row ${seam} is outside the ${height} px frame`);
    top = Math.round((seam - gap_px / 2) / 2) * 2;
  }
  if (top < 2 || top > usable - 2) kitPanelRefuse(`seam ${seam} leaves a panel under 2 px (height ${height}, gap ${gap_px})`);
  return { top_h: top, gap_px, bottom_h: usable - top, seam_y: top + gap_px / 2 };
}

/**
 * A normalised crop rect, checked: {x, y, w, h} (fractions of the source) or
 * a box [x0, y0, x1, y1]. Refused when it leaves the frame or is empty.
 */
export function kitPanelRect(rect) {
  let r = rect;
  if (Array.isArray(rect)) {
    if (rect.length !== 4) kitPanelRefuse('a crop box is [x0, y0, x1, y1]');
    const [x0, y0, x1, y1] = rect;
    r = { x: x0, y: y0, w: x1 - x0, h: y1 - y0 };
  }
  if (!r || typeof r !== 'object') kitPanelRefuse('a crop rect is {x, y, w, h} or [x0, y0, x1, y1]');
  const x = r.x ?? 0;
  const y = r.y ?? 0;
  const w = r.w ?? 1;
  const h = r.h ?? 1;
  for (const [k, v] of Object.entries({ x, y, w, h })) {
    if (typeof v !== 'number' || !Number.isFinite(v)) kitPanelRefuse(`crop ${k} must be a number`);
  }
  if (w <= 0 || h <= 0) kitPanelRefuse(`crop rect is empty (w ${w}, h ${h})`);
  if (x < 0 || y < 0 || x + w > 1 + 1e-6 || y + h > 1 + 1e-6) kitPanelRefuse(`crop rect ${JSON.stringify({ x, y, w, h })} leaves the frame`);
  return { x, y, w: Math.min(w, 1 - x), h: Math.min(h, 1 - y) };
}

/**
 * The crop filter for a normalised rect on the source, every term even, or ''
 * when the rect is the whole frame (or absent).
 */
export function kitPanelCrop(rect) {
  if (rect == null) return '';
  const { x, y, w, h } = kitPanelRect(rect);
  if (w >= 0.9999 && h >= 0.9999 && x <= 1e-9 && y <= 1e-9) return '';
  const e = (dim, v) => `2*floor(${dim}*${kitPanelNum(v)}/2)`;
  return `crop=${e('iw', w)}:${e('ih', h)}:${e('iw', x)}:${e('ih', y)}`;
}

/**
 * Scale `src` to cover w x h (times zoom, to push in) and crop it to w x h.
 * `head` is where the crop sits vertically (0 keeps the top, 0.5 centres,
 * 0.30 keeps a talking head in the upper third); `focus_x` the same across.
 * The crop is computed from the source's real size inside ffmpeg (iw, ih),
 * never a hard-coded height. `crop` is an optional source rect applied first
 * (a reframe).
 */
export function kitPanelCover({ src, out, w, h, head = 0.5, focus_x = 0.5, zoom = 1, crop = null }) {
  kitPanelSize(w, 'w');
  kitPanelSize(h, 'h');
  kitPanelFinite(head, 'head', 0, 1);
  kitPanelFinite(focus_x, 'focus_x', 0, 1);
  kitPanelFinite(zoom, 'zoom', 1, 2);
  const pre = kitPanelCrop(crop);
  const sw = kitPanelEven(w * zoom);
  const sh = kitPanelEven(h * zoom);
  return [
    `${kitPanelLabel(src, 'src')}${pre ? `${pre},` : ''}scale=${sw}:${sh}:force_original_aspect_ratio=increase:flags=lanczos,` +
      `crop=${w}:${h}:(iw-${w})*${kitPanelNum(focus_x, 4)}:(ih-${h})*${kitPanelNum(head, 4)},setsar=1${kitPanelLabel(out, 'out')}`,
  ];
}

/**
 * The whole picture inside w x h, never cropped (footage with copy in it),
 * on a letterbox: bg '#RRGGBB' pads with that colour; bg 'blur' fills with a
 * darkened, blurred cover of the same frame. `crop` is an optional source
 * rect applied first. (A part that wants 'auto' samples the corner colour and
 * passes it as a hex.)
 */
export function kitPanelFit({ src, out, w, h, bg = '#000000', crop = null }) {
  kitPanelSize(w, 'w');
  kitPanelSize(h, 'h');
  const pre = kitPanelCrop(crop);
  const inL = kitPanelLabel(src, 'src');
  const outL = kitPanelLabel(out, 'out');
  const contain = `scale=${w}:${h}:force_original_aspect_ratio=decrease:force_divisible_by=2:flags=lanczos`;
  if (bg === 'blur') {
    const base = String(out).replace(/[^A-Za-z0-9_]/g, '_');
    return [
      `${inL}${pre ? `${pre},` : ''}split=2[${base}_bgsrc][${base}_fgsrc]`,
      `[${base}_bgsrc]scale=${w}:${h}:force_original_aspect_ratio=increase,crop=${w}:${h},gblur=sigma=30,eq=brightness=-0.15,setsar=1[${base}_bg]`,
      `[${base}_fgsrc]${contain},setsar=1[${base}_fg]`,
      `[${base}_bg][${base}_fg]overlay=(W-w)/2:(H-h)/2,setsar=1${outL}`,
    ];
  }
  const color = kitPanelColor(bg, 'bg');
  return [`${inL}${pre ? `${pre},` : ''}${contain},pad=${w}:${h}:(ow-iw)/2:(oh-ih)/2:${color},setsar=1${outL}`];
}

/** The listener look: saturation and brightness pulled down by `dim` (1 = unchanged). */
export function kitPanelDim({ src, out, dim }) {
  kitPanelFinite(dim, 'dim', 0, 1);
  if (dim === 1) return [`${kitPanelLabel(src, 'src')}null${kitPanelLabel(out, 'out')}`];
  return [`${kitPanelLabel(src, 'src')}eq=saturation=${kitPanelNum(dim, 3)}:brightness=${kitPanelNum(-(1 - dim) * 0.25, 3)}${kitPanelLabel(out, 'out')}`];
}

/**
 * Stack two panels already sized to width x top_h and width x bottom_h. The
 * gap (gap_color, default black) pads the top panel, and the result is padded
 * or cut to the full frame, so a rounding difference can never change the
 * frame size. The stack ends with the shorter panel.
 */
export function kitPanelVstack({ top, bottom, out, width, height, top_h, gap_px = 0, gap_color = '#000000' }) {
  kitPanelSize(width, 'width');
  kitPanelSize(height, 'height');
  kitPanelSize(top_h, 'top_h');
  if (!Number.isInteger(gap_px) || gap_px < 0 || gap_px % 2) kitPanelRefuse(`gap_px must be an even whole number, 0 or more (got ${gap_px})`);
  if (top_h + gap_px > height - 2) kitPanelRefuse(`top_h ${top_h} + gap ${gap_px} leaves no bottom panel in ${height} px`);
  const color = kitPanelColor(gap_color, 'gap_color');
  const base = String(out).replace(/[^A-Za-z0-9_]/g, '_');
  const chains = [];
  let topL = kitPanelLabel(top, 'top');
  if (gap_px) {
    chains.push(`${topL}pad=${width}:${top_h + gap_px}:0:0:${color}[${base}_topg]`);
    topL = `[${base}_topg]`;
  }
  // shortest=1: vstack otherwise runs as long as its LONGER panel, and a panel one
  // frame over pushes every later cut late (the podcast compose measured 0.1 s).
  chains.push(
    `${topL}${kitPanelLabel(bottom, 'bottom')}vstack=inputs=2:shortest=1,` +
      `pad=w=${width}:h='max(ih,${height})':x=0:y=0:color=black,crop=${width}:${height}:0:0,setsar=1${kitPanelLabel(out, 'out')}`,
  );
  return chains;
}

/**
 * A whole split: each source sized into its panel by its own look, then
 * stacked on the seam. A look is {fit: 'cover', head, focus_x, zoom, crop}
 * (the default) or {fit: 'contain', bg, crop}, plus an optional dim (0-1).
 * Returns the chains and the rows (kitPanelSeamRows) so a part can place a
 * divider bar or a caption zone on the seam.
 */
export function kitPanelSplit({ top, bottom, out, width, height, seam, gap_px = 0, gap_color = '#000000', top_look = {}, bottom_look = {} }) {
  kitPanelSize(width, 'width');
  const rows = kitPanelSeamRows(height, seam, { gap_px });
  const base = String(out).replace(/[^A-Za-z0-9_]/g, '_');
  const filters = [];
  const panel = (src, look, h, name) => {
    const fit = look.fit ?? 'cover';
    const sized = look.dim != null && look.dim !== 1 ? `${base}_${name}_s` : `${base}_${name}`;
    if (fit === 'cover') {
      filters.push(...kitPanelCover({ src, out: sized, w: width, h, head: look.head ?? 0.5, focus_x: look.focus_x ?? 0.5, zoom: look.zoom ?? 1, crop: look.crop ?? null }));
    } else if (fit === 'contain' || fit === 'width') {
      filters.push(...kitPanelFit({ src, out: sized, w: width, h, bg: look.bg ?? '#000000', crop: look.crop ?? null }));
    } else kitPanelRefuse(`${name} look fit must be cover or contain (got ${JSON.stringify(fit)})`);
    if (sized !== `${base}_${name}`) filters.push(...kitPanelDim({ src: sized, out: `${base}_${name}`, dim: look.dim }));
    return `${base}_${name}`;
  };
  const t = panel(top, top_look, rows.top_h, 'top');
  const b = panel(bottom, bottom_look, rows.bottom_h, 'bottom');
  filters.push(...kitPanelVstack({ top: t, bottom: b, out, width, height, top_h: rows.top_h, gap_px, gap_color }));
  return { filters, rows };
}

/** The ffmpeg enable expression for a list of [start_s, end_s] windows ('0' when there are none). */
export function kitPanelEnable(windows) {
  if (!Array.isArray(windows)) kitPanelRefuse('windows must be a list of [start_s, end_s]');
  const parts = [];
  for (const win of windows) {
    if (!Array.isArray(win) || win.length !== 2 || !win.every((v) => typeof v === 'number' && Number.isFinite(v))) kitPanelRefuse('a window is [start_s, end_s]');
    const [s, e] = win;
    if (e <= s) kitPanelRefuse(`window [${s}, ${e}] ends before it starts`);
    parts.push(`between(t,${kitPanelNum(s, 3)},${kitPanelNum(Math.max(s, e - 0.001), 3)})`);
  }
  return parts.join('+') || '0';
}

/**
 * A brand-colour bar centred on the seam row, `px` tall (even), drawn only
 * while `enable` is true (an expression from kitPanelEnable; omit for always).
 * Append it to a chain: `${chain},${kitPanelDivider(...)}`.
 */
export function kitPanelDivider({ seam_y, px = 4, color, enable = null }) {
  if (!Number.isInteger(px) || px < 2 || px % 2) kitPanelRefuse(`divider px must be an even whole number, 2 or more (got ${px})`);
  if (!Number.isInteger(seam_y) || seam_y < px / 2) kitPanelRefuse(`divider seam_y must be a whole pixel row of at least ${px / 2} (got ${seam_y})`);
  const c = kitPanelColor(color, 'divider color');
  const when = enable == null ? '' : `:enable='${enable}'`;
  return `drawbox=x=0:y=${seam_y - px / 2}:w=iw:h=${px}:color=${c}@1:t=fill${when}`;
}

/**
 * Frame-exact segment lengths for a join. `spans` are the seconds each
 * segment shows on the timeline; the boundaries are rounded to whole frames
 * from the running total, so rounding never drifts. A dissolve rides on the
 * outgoing segment's tail: every segment but the last is trimmed one dissolve
 * longer, and the incoming segment starts fading in exactly on its span edge,
 * so cut times and the total length match a hard cut.
 */
export function kitPanelJoinLengths(spans, { fps = 30, transition = 'cut', dissolve_s = 0 } = {}) {
  if (!Array.isArray(spans) || !spans.length) kitPanelRefuse('a join needs at least one span');
  if (!Number.isInteger(fps) || fps < 1 || fps > 120) kitPanelRefuse(`fps must be a whole number from 1 to 120 (got ${fps})`);
  if (transition !== 'cut' && transition !== 'dissolve') kitPanelRefuse(`transition must be cut or dissolve (got ${JSON.stringify(transition)})`);
  const edges = [0];
  let run = 0;
  for (const [i, s] of spans.entries()) {
    if (typeof s !== 'number' || !Number.isFinite(s) || s <= 0) kitPanelRefuse(`span ${i} must be a positive number of seconds (got ${s})`);
    run += s;
    edges.push(Math.round(run * fps));
  }
  const frames = spans.map((_, i) => edges[i + 1] - edges[i]);
  frames.forEach((f, i) => {
    if (f < 1) kitPanelRefuse(`span ${i} (${spans[i]} s) is shorter than one frame at ${fps} fps`);
  });
  let d = 0;
  if (transition === 'dissolve' && spans.length > 1) {
    if (typeof dissolve_s !== 'number' || !Number.isFinite(dissolve_s) || dissolve_s <= 0) kitPanelRefuse(`a dissolve needs dissolve_s > 0 (got ${dissolve_s})`);
    d = Math.max(1, Math.round(dissolve_s * fps));
    frames.forEach((f, i) => {
      if (f < d) kitPanelRefuse(`span ${i} (${f} frames) is shorter than the ${d}-frame dissolve`);
    });
  }
  const lengths = frames.map((f, i) => (f + (i < frames.length - 1 ? d : 0)) / fps);
  const starts = edges.slice(0, -1).map((e) => e / fps);
  return { lengths, starts, frames, dissolve_s: d / fps, total_s: edges.at(-1) / fps };
}

/**
 * Join segments in order. Each input is trimmed to its frame-exact length
 * (kitPanelJoinLengths) and normalised (fps, timebase, yuv420p), so inputs
 * must run at least that long; they must share one frame size. 'cut' is one
 * concat; 'dissolve' is a chain of xfade, each starting on its span edge.
 * Video only: the audio of a compose follows its own timeline.
 */
export function kitPanelJoin({ inputs, out, spans, fps = 30, transition = 'cut', dissolve_s = 0 }) {
  if (!Array.isArray(inputs) || !inputs.length) kitPanelRefuse('a join needs at least one input');
  if (!Array.isArray(spans) || spans.length !== inputs.length) kitPanelRefuse(`a join needs one span per input (${inputs.length} inputs, ${Array.isArray(spans) ? spans.length : 0} spans)`);
  const plan = kitPanelJoinLengths(spans, { fps, transition, dissolve_s });
  const base = String(out).replace(/[^A-Za-z0-9_]/g, '_');
  const outL = kitPanelLabel(out, 'out');
  const filters = inputs.map(
    (name, i) => `${kitPanelLabel(name, `inputs[${i}]`)}trim=duration=${kitPanelNum(plan.lengths[i])},setpts=PTS-STARTPTS,fps=${fps},settb=AVTB,format=yuv420p,setsar=1[${base}_j${i}]`,
  );
  if (inputs.length === 1) filters.push(`[${base}_j0]null${outL}`);
  else if (transition === 'cut' || plan.dissolve_s === 0) {
    filters.push(`${inputs.map((_, i) => `[${base}_j${i}]`).join('')}concat=n=${inputs.length}:v=1:a=0${outL}`);
  } else {
    let acc = `[${base}_j0]`;
    for (let i = 1; i < inputs.length; i++) {
      const to = i === inputs.length - 1 ? outL : `[${base}_x${i}]`;
      filters.push(`${acc}[${base}_j${i}]xfade=transition=fade:duration=${kitPanelNum(plan.dissolve_s)}:offset=${kitPanelNum(plan.starts[i])}${to}`);
      acc = to;
    }
  }
  return { filters, lengths: plan.lengths, starts: plan.starts, total_s: plan.total_s };
}

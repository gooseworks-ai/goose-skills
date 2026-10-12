// The notification-cascade skin: render-imessage-cascade as one frame-stepped
// page. A phone lies face-up on a desk (the plate photo, cover-fitted, with the
// atom's slow Ken-Burns push-in) while authentic iMessage notification banners
// (green Messages icon, warm translucent greige fill, soft dark shadow, title,
// body, "now" and the brand handle) spring in at the BOTTOM, one per
// notification, and push the stack UP; the grouped "Show less / X" pill rides
// above the stack; the X clears it (swipe up and fade); an optional resolution
// banner then holds. The end card is another part.
// Geometry is the atom's contract at 1080x1920 (banner 810 wide at SIDE 135,
// 176 tall for one body line and 44 more per line, rows 38 apart, the newest
// banner's bottom at 1436), scaled uniformly to the canvas. Each banner is as
// tall as its own body, which wraps to four lines at most, measured with the
// supplied KitText font (a word wider than the banner breaks between its
// characters; a name too long for its line is cut with an ellipsis, as iOS
// does). When the pile would reach the top band, the oldest banners fold into a
// stack behind the newer ones (iOS's stacked look: slivers peeking above), so
// every message arrives readable at the bottom. Copy is refused only when even
// that cannot fit, saying what to shorten; the type never shrinks. Movie time
// drives every pixel: seek(ms) draws the state at that time from one event timeline.
// Pure: no imports; every top-level name starts with `nc`/`NC_`.

const NC_PACING = {
  first_arrival_seconds: 1.6,
  arrival_every_seconds: 2,
  clear_after_seconds: 1.6,
  resolution_hold_seconds: 1.5,
  ending_after_seconds: 0.7,
};
// layout.py's timing rules: arrivals at least 0.7 s apart, the last one held a
// second before the clear, the resolution held at least 1.5 s; the ending hold
// keeps the last state on screen at least 0.5 s.
const NC_PACING_MIN = {
  first_arrival_seconds: 0,
  arrival_every_seconds: 0.7,
  clear_after_seconds: 1,
  resolution_hold_seconds: 1.5,
  ending_after_seconds: 0.5,
};
const NC_PACING_MAX = {
  first_arrival_seconds: 10,
  arrival_every_seconds: 10,
  clear_after_seconds: 10,
  resolution_hold_seconds: 10,
  ending_after_seconds: 5,
};
const NC_RESOLUTION_AFTER = 0.7; // layout.py: the resolution arrives 0.7 s after the clear

// build_assets.py + compose.py geometry, in 1080x1920 px.
const NC_GEO = {
  W: 1080,
  H: 1920,
  BODY_W: 810,
  BANNER_H: 176, // one body line; each extra line adds LINE_STEP
  LINE_STEP: 44,
  MAX_LINES: 4, // iOS shows at most four body lines in a banner
  ROW_GAP: 38, // pitch = banner height + 38 (214 for one line)
  BOTTOM: 1436, // the newest banner's bottom edge, just above the phone
  RADIUS: 40,
  ICON: 100,
  ICON_INSET: 24,
  TEXT_X: 148, // icon inset + icon + 24
  TEXT_RIGHT: 26, // the text column ends 26 px inside the banner (TEXT_RIGHT 919)
  NOW_ROOM: 95, // the title stops short of "now"
  TITLE_Y: 34,
  BODY_Y: 84,
  NOW_Y: 30,
  HANDLE_UP: 42, // the handle's top, up from the banner's bottom
  TITLE_PX: 38,
  BODY_PX: 36,
  META_PX: 25,
  PILL_H: 72,
  PILL_ABOVE: 24, // the pill's bottom sits 24 px above the top banner
  PILL_PX: 31,
  X_SIZE: 72,
  X_GAP: 18,
  TOP_ROOM: 34, // the pill's top stays this far below the top band (layout.py: 220 + 34)
  SLIVER: 18, // a folded banner peeks this far above the one in front of it
  SLIVERS: 2, // folded banners deeper than this hide behind the second sliver
  SLIVER_SCALE: 0.06, // each sliver is this much narrower than the banner in front
  SLIVER_DIM: 0.12, // and this much fainter
  TUCK: 4, // a sliver is cut this far below the front banner's top edge, under its rounded corners
};
// compose.py's motion: push = 1 - e^(-7 dt), spring = 60 e^(-9 dt), clear = 560 (1 - e^(-12 dt)),
// fades 0.35 s in and 0.4 s out (0.3 s for the resolution), the plate's 0.5 s fade from
// black and its zoompan push-in of 0.00026 per frame at 30 fps, capped at 1.13.
const NC_MOTION = {
  push_rate: 7,
  spring_px: 60,
  spring_rate: 9,
  clear_px: 560,
  clear_rate: 12,
  fade_in: 0.35,
  fade_out: 0.4,
  res_fade: 0.3,
  plate_fade: 0.5,
  zoom_per_s: 0.0078,
  zoom_max: 1.13,
};
const NC_POP = 'pop.wav';
const NC_SWOOSH = 'swoosh.wav';
// The pop is a short click (its peak 16 dB over its first quarter second), so at 0.8 it sat under any bed
// and levelling the cut cut it down further. It is driven into a -7 dBFS limit, which shaves the click to a
// dense pop heard over the bed; the swoosh is raised to about -8 dBFS.
const NC_POP_GAIN = 4;
const NC_POP_LIMIT_DB = -7;
const NC_SWOOSH_GAIN = 0.8;

const NC_ID = { type: 'string', pattern: '^[A-Za-z0-9_-]{1,40}$' };
const NC_BANNER = {
  type: 'object',
  additionalProperties: false,
  required: ['id', 'title', 'body'],
  properties: {
    id: NC_ID,
    title: { type: 'string', minLength: 1, maxLength: 40, pattern: '\\S' },
    body: { type: 'string', minLength: 1, maxLength: 400, pattern: '\\S' },
  },
};

export const NC_THREAD_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['handle', 'notifications', 'plate'],
  properties: {
    handle: { type: 'string', minLength: 1, maxLength: 30, pattern: '\\S' },
    notifications: { type: 'array', minItems: 1, maxItems: 6, items: NC_BANNER },
    resolution: { oneOf: [{ type: 'null' }, NC_BANNER] },
    plate: { type: 'string', pattern: '^[a-z0-9][a-z0-9_-]{0,39}$' },
    pacing: {
      type: 'object',
      additionalProperties: false,
      properties: Object.fromEntries(
        Object.keys(NC_PACING).map((k) => [k, { type: 'number', minimum: NC_PACING_MIN[k], maximum: NC_PACING_MAX[k] }]),
      ),
    },
  },
};

// Fallback advance widths in em, used only when the KitText font cannot be read
// from env.font_css: the widest of Inter and Montserrat Light/Bold (regular,
// semibold, italic) as Chromium lays them out, rounded up.
const NC_EM_GROUPS = [
  [' ', 0.29],
  ['il.,:;\'!’j', 0.31],
  ['frtI()[]{}/\\-1|', 0.45],
  ['"*“”J?zs_', 0.57],
  ['m', 1.07],
  ['w', 0.93],
  ['W', 1.17],
  ['M', 0.96],
  ['@', 1.04],
  ['%', 0.91],
  ['—', 1],
  ['…', 0.8],
];
const NC_EMOJI_EM = 1.3;
// Drawn from the emoji font whatever the text font holds: emoji presentation, VS16 and keycaps (1️⃣ is "1" + U+FE0F + U+20E3).
const NC_EMOJI_RE = /\p{Emoji_Presentation}|\p{Regional_Indicator}|\u{FE0F}|\u{20E3}/u;
const NC_BOLD_WIDEN = 1.06; // a semibold title against the font's default (regular) advances
const NC_FIT_SLACK = 1.02;

function ncEsc(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function ncFallbackEm(ch) {
  for (const [chars, em] of NC_EM_GROUPS) if (chars.includes(ch)) return em;
  const cp = ch.codePointAt(0);
  if (/[A-Z]/.test(ch)) return 0.85;
  if (cp < 0x80) return 0.72;
  if ((cp >= 0x2e80 && cp <= 0x9fff) || (cp >= 0xac00 && cp <= 0xd7af) || (cp >= 0xf900 && cp <= 0xfaff) || (cp >= 0xff00 && cp <= 0xffef)) return 1;
  return 0.8;
}

/** The base64 bytes of the KitText face in env.font_css, or null. */
function ncKitTextData(css) {
  for (const block of String(css || '').match(/@font-face\s*\{[^}]*\}/g) || []) {
    if (!/font-family\s*:\s*['"]?KitText['"]?\s*[;}]/.test(block)) continue;
    const m = /url\(\s*['"]?data:[^,'")]*;base64,([A-Za-z0-9+/=\s]+)['"]?\s*\)/.exec(block);
    return m ? m[1] : null;
  }
  return null;
}

/**
 * Advance widths (em) from a TrueType/OpenType font: cp -> em, or null when the
 * font has no glyph for cp. Reads head, hhea, hmtx and a Unicode cmap (format
 * 12 or 4). Returns null for anything it cannot read (woff, woff2, a collection).
 */
function ncFontAdvances(b64) {
  const bin = atob(b64.replace(/\s+/g, ''));
  const size = bin.length;
  const u16 = (i) => {
    if (i < 0 || i + 2 > size) throw new Error('font out of range');
    return (bin.charCodeAt(i) << 8) | bin.charCodeAt(i + 1);
  };
  const i16 = (i) => {
    const v = u16(i);
    return v & 0x8000 ? v - 0x10000 : v;
  };
  const u32 = (i) => u16(i) * 65536 + u16(i + 2);
  const tag = u32(0);
  if (tag !== 0x00010000 && tag !== 0x74727565 && tag !== 0x4f54544f) return null;
  const tables = {};
  for (let i = 0, n = u16(4); i < n; i++) tables[bin.slice(12 + 16 * i, 16 + 16 * i)] = u32(12 + 16 * i + 8);
  for (const t of ['head', 'hhea', 'hmtx', 'cmap']) if (!(t in tables)) return null;
  const upm = u16(tables.head + 18);
  const metrics = u16(tables.hhea + 34);
  if (!upm || !metrics) return null;
  const cmap = tables.cmap;
  let f4 = null;
  let f12 = null;
  for (let i = 0, n = u16(cmap + 2); i < n; i++) {
    const rec = cmap + 4 + 8 * i;
    const platform = u16(rec);
    const encoding = u16(rec + 2);
    if (!(platform === 0 || (platform === 3 && (encoding === 1 || encoding === 10)))) continue;
    const at = cmap + u32(rec + 4);
    const format = u16(at);
    if (format === 12 && f12 === null) f12 = at;
    if (format === 4 && f4 === null) f4 = at;
  }
  if (f12 === null && f4 === null) return null;
  const glyph = (cp) => {
    if (f12 !== null) {
      for (let g = 0, n = u32(f12 + 12); g < n; g++) {
        const at = f12 + 16 + 12 * g;
        const start = u32(at);
        if (cp < start) return 0;
        if (cp <= u32(at + 4)) return u32(at + 8) + (cp - start);
      }
      return 0;
    }
    if (cp > 0xffff) return 0;
    const segs = u16(f4 + 6) / 2;
    const ends = f4 + 14;
    const starts = ends + 2 * segs + 2;
    const deltas = starts + 2 * segs;
    const ranges = deltas + 2 * segs;
    for (let s = 0; s < segs; s++) {
      if (cp > u16(ends + 2 * s)) continue;
      const start = u16(starts + 2 * s);
      if (cp < start) return 0;
      const ro = u16(ranges + 2 * s);
      if (!ro) return (cp + i16(deltas + 2 * s)) & 0xffff;
      const g = u16(ranges + 2 * s + ro + 2 * (cp - start));
      return g ? (g + i16(deltas + 2 * s)) & 0xffff : 0;
    }
    return 0;
  };
  const cache = new Map();
  return (cp) => {
    if (!cache.has(cp)) {
      const g = glyph(cp);
      cache.set(cp, g ? u16(tables.hmtx + 4 * Math.min(g, metrics - 1)) / upm : null);
    }
    return cache.get(cp);
  };
}

/** measure(text, px, weight) -> px: the supplied font's advances, else the fallback table. */
function ncMeasurer(fontCss) {
  let advance = null;
  const data = ncKitTextData(fontCss);
  if (data) {
    try {
      advance = ncFontAdvances(data);
    } catch {
      advance = null;
    }
  }
  const segmenter = new Intl.Segmenter(undefined, { granularity: 'grapheme' });
  return (text, px, weight) => {
    let em = 0;
    for (const { segment } of segmenter.segment(text)) {
      const cp = segment.codePointAt(0);
      if (NC_EMOJI_RE.test(segment)) {
        em += NC_EMOJI_EM;
        continue;
      }
      const own = advance && [...segment].length === 1 ? advance(cp) : null;
      if (own !== null) em += own * (weight >= 600 ? NC_BOLD_WIDEN : 1);
      else if (/\p{Extended_Pictographic}/u.test(segment)) em += NC_EMOJI_EM;
      else em += (advance && advance(cp)) || ncFallbackEm(String.fromCodePoint(cp));
    }
    return em * px * NC_FIT_SLACK;
  };
}

function ncGraphemes(text) {
  return [...new Intl.Segmenter(undefined, { granularity: 'grapheme' }).segment(String(text))].map((s) => s.segment);
}

/** Copy quoted in a warning or refusal, cut short. */
function ncQuote(text, max = 24) {
  const g = ncGraphemes(text);
  return g.length > max ? `${g.slice(0, max).join('')}…` : String(text);
}

/**
 * layout.py's wrap, whole words per line; a word wider than the banner breaks between its characters
 * (starting a line of its own), as iOS breaks it. Returns { lines, broken }: broken lists those words.
 */
function ncWrap(text, width, measure) {
  const lines = [''];
  const broken = [];
  for (const word of String(text).trim().split(/\s+/)) {
    const last = lines[lines.length - 1];
    if (measure(word) <= width) {
      const candidate = last ? `${last} ${word}` : word;
      if (measure(candidate) <= width) lines[lines.length - 1] = candidate;
      else lines.push(word);
      continue;
    }
    broken.push(word);
    if (last) lines.push('');
    for (const ch of ncGraphemes(word)) {
      const cur = lines[lines.length - 1];
      if (cur && measure(cur + ch) > width) lines.push(ch);
      else lines[lines.length - 1] = cur + ch;
    }
  }
  return { lines, broken };
}

/** One line of copy: whole when it fits, else cut with an ellipsis as iOS cuts a long name. */
function ncFitLine(text, width, measure) {
  if (measure(text) <= width) return { text, cut: false };
  const g = ncGraphemes(text);
  let n = g.length - 1;
  while (n > 1 && measure(`${g.slice(0, n).join('').trimEnd()}…`) > width) n--;
  return { text: `${g.slice(0, n).join('').trimEnd()}…`, cut: true };
}

function ncValidate(thread, env) {
  const { width, height, fps } = env;
  if (!Number.isInteger(width) || !Number.isInteger(height) || width % 2 || height % 2 || width < 320 || height < 320) {
    throw new Error('env.width and env.height must be even whole numbers, at least 320.');
  }
  if (!Number.isInteger(fps) || fps < 1) throw new Error('env.fps must be a positive whole number.');
  if (env.timing != null && (typeof env.timing !== 'object' || Object.keys(env.timing).length)) {
    throw new Error('The notification cascade takes its pacing from thread.pacing; leave env.timing empty.');
  }
  const ids = new Set();
  for (const n of [...thread.notifications, ...(thread.resolution ? [thread.resolution] : [])]) {
    if (ids.has(n.id)) throw new Error(`Every notification and the resolution need a unique id; ${n.id} is used twice.`);
    ids.add(n.id);
  }
  if (!(env.images || {})[thread.plate]) throw new Error(`The plate image ${thread.plate} was not supplied.`);
}

function ncPacing(thread) {
  const P = { ...NC_PACING };
  for (const [key, value] of Object.entries(thread.pacing || {})) {
    if (!(key in NC_PACING)) throw new Error(`Unknown notification-cascade pacing ${key}.`);
    if (!Number.isFinite(value) || value < NC_PACING_MIN[key] || value > NC_PACING_MAX[key]) {
      throw new Error(`pacing.${key} must be a number from ${NC_PACING_MIN[key]} to ${NC_PACING_MAX[key]} seconds.`);
    }
    P[key] = value;
  }
  return P;
}

function ncTimeline(thread, P, fps) {
  const snap = (t) => Math.ceil((t - 1e-8) * fps) / fps;
  const arrivals = thread.notifications.map((_, i) => snap(P.first_arrival_seconds + i * P.arrival_every_seconds));
  const clear = snap(arrivals[arrivals.length - 1] + P.clear_after_seconds);
  const events = thread.notifications.map((n, i) => ({ t: arrivals[i], kind: 'arrive', id: n.id }));
  events.push({ t: clear, kind: 'clear' });
  let resolution = null;
  let last = clear;
  if (thread.resolution) {
    resolution = snap(clear + NC_RESOLUTION_AFTER);
    events.push({ t: resolution, kind: 'resolve', id: thread.resolution.id });
    last = snap(resolution + P.resolution_hold_seconds);
  }
  return { events, arrivals, clear, resolution, total: snap(last + P.ending_after_seconds) };
}

function ncList(ids) {
  return ids.length === 1 ? ids[0] : `${ids.slice(0, -1).join(', ')} and ${ids[ids.length - 1]}`;
}

/**
 * The banners' measured lines and heights, the stack's place on the canvas (layout.py's geometry) and
 * folded[m]: how many of the oldest banners are folded into the stack once notification m has arrived
 * (the fewest that let the pile and its pill fit below the top band). warnings say what was fitted.
 */
function ncLayout(thread, env) {
  const G = NC_GEO;
  const { width: W, height: H } = env;
  const u = Math.min(W / G.W, H / G.H);
  const measure = ncMeasurer(env.font_css);
  const column = G.BODY_W - G.TEXT_X - G.TEXT_RIGHT;
  const warnings = [];
  const handle = ncFitLine(thread.handle.trim(), column, (s) => measure(s, G.META_PX, 400));
  if (handle.cut) warnings.push(`The brand name on the banners is cut to "${handle.text}" to fit.`);
  const heightOf = (lines) => (G.BANNER_H + G.LINE_STEP * (lines - 1)) * u;
  const all = [...thread.notifications, ...(thread.resolution ? [thread.resolution] : [])];
  const banners = all.map((n) => {
    const title = ncFitLine(n.title.trim(), column - G.NOW_ROOM, (s) => measure(s, G.TITLE_PX, 600));
    if (title.cut) warnings.push(`The name on ${n.id} is cut to "${title.text}" to fit beside "now".`);
    const { lines, broken } = ncWrap(n.body, column, (s) => measure(s, G.BODY_PX, 400));
    if (lines.length > G.MAX_LINES) {
      const over = ncGraphemes(lines.slice(G.MAX_LINES).join(' ')).length + 1;
      throw new Error(`The body of ${n.id} needs ${lines.length} lines; a banner shows at most ${G.MAX_LINES}. Cut about ${over} characters from it.`);
    }
    for (const word of broken) warnings.push(`The word "${ncQuote(word)}" in ${n.id} is wider than the banner, so it breaks across lines.`);
    if (lines.length > 2) warnings.push(`The body of ${n.id} wraps to ${lines.length} lines, so its banner is taller.`);
    return { id: n.id, title: title.text, lines, h: heightOf(lines.length) };
  });
  const bottom = (H * G.BOTTOM) / G.H;
  let left = W / 2 - (G.BODY_W / 2) * u;
  const safe = env.safe_area || null;
  if (safe) {
    const right = W - (safe.right || 0);
    if (left + G.BODY_W * u > right) left = right - G.BODY_W * u;
    if (left < (safe.left || 0)) throw new Error('The banners do not fit between the safe area\'s side bands.');
    if (bottom > H - (safe.bottom || 0)) throw new Error('The newest banner would sit in the safe area\'s bottom band.');
  }
  const limit = ((safe && safe.top) || 0) + G.TOP_ROOM * u - 1e-6;
  const pill = (G.PILL_ABOVE + G.PILL_H) * u;
  const stack = banners.slice(0, thread.notifications.length);
  // The pill's top once notification m is in, with the c oldest folded to slivers behind banner c.
  const pillTop = (m, c) => {
    let h = Math.min(c, G.SLIVERS) * G.SLIVER * u + (m - c) * G.ROW_GAP * u;
    for (let j = c; j <= m; j++) h += stack[j].h;
    return bottom - h - pill;
  };
  const where = safe ? ' below the safe area\'s top band' : '';
  const folded = [];
  let c = 0;
  for (let m = 0; m < stack.length; m++) {
    while (c < m && pillTop(m, c) < limit) c++;
    if (pillTop(m, c) < limit) {
      const b = stack[m];
      const slivers = Math.min(m, G.SLIVERS) * G.SLIVER * u;
      let fits = b.lines.length - 1;
      while (fits >= 1 && bottom - heightOf(fits) - slivers - pill < limit) fits--;
      if (fits < 1) throw new Error(`No notification banner fits above the phone${where} on this canvas.`);
      throw new Error(
        `The body of ${b.id} takes ${b.lines.length} lines, which do not fit above the phone${where} even with the older banners folded into a stack; shorten it to ${fits} line${fits === 1 ? '' : 's'}.`,
      );
    }
    if (c > (folded[m - 1] || 0)) {
      const ids = stack.slice(folded[m - 1] || 0, c).map((x) => x.id);
      warnings.push(`When ${stack[m].id} arrives, ${ncList(ids)} fold${ids.length === 1 ? 's' : ''} into a stack behind the newer banners, so the pile fits above the phone.`);
    }
    folded.push(c);
  }
  return { u, left, bottom, gap: G.ROW_GAP * u, banners, handle: handle.text, folded, warnings };
}

function ncIcon(id) {
  return (
    `<svg class="nc-icon" viewBox="0 0 100 100" aria-hidden="true"><defs><linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1">` +
    '<stop offset="0" stop-color="#63E85C"/><stop offset="1" stop-color="#1CC73E"/></linearGradient></defs>' +
    `<rect width="100" height="100" rx="23.5" fill="url(#${id})"/>` +
    '<ellipse cx="50" cy="47" rx="31" ry="26" fill="#fff"/><path d="M30.5 60.5C30 67 27 72.5 21.5 76.5C29.5 77 37 74 42.5 69.5Z" fill="#fff"/></svg>'
  );
}

function ncBannerHtml(b, i, handle, L, cls) {
  const G = NC_GEO;
  const lines = b.lines.map((line, k) => `<div class="nc-t nc-line" style="top:${ncPx((G.BODY_Y + G.LINE_STEP * k + 0.1 * G.BODY_PX) * L.u)}">${ncEsc(line)}</div>`).join('');
  return (
    `<div class="nc-row ${cls}" data-nc="${ncEsc(b.id)}" style="height:${ncPx(b.h)}"><i class="nc-sh"></i><i class="nc-fill"></i><div class="nc-in">${ncIcon(`nc-g${i}`)}` +
    `<div class="nc-t nc-title">${ncEsc(b.title)}</div><div class="nc-t nc-now">now</div>${lines}<div class="nc-t nc-handle">${ncEsc(handle)}</div></div></div>`
  );
}

function ncPx(v) {
  return `${+v.toFixed(3)}px`;
}

function ncCss(env, L) {
  const G = NC_GEO;
  const { width: W, height: H } = env;
  const s = (v) => ncPx(v * L.u);
  const shadow = 'rgba(30,22,16,0.47)';
  return `${env.font_css || ''}
html, body { margin: 0; padding: 0; width: ${W}px; height: ${H}px; overflow: hidden; background: #000; }
body { position: relative; font-family: KitText, KitEmoji, sans-serif; font-optical-sizing: none; -webkit-font-smoothing: antialiased; }
i { font-style: normal; }
.nc-plate { position: absolute; left: 0; top: 0; width: ${W}px; height: ${H}px; object-fit: cover; object-position: 50% 50%; transform-origin: 50% 50%; opacity: 0; }
.nc-row, .nc-pill-row { position: absolute; left: ${ncPx(L.left)}; top: 0; width: ${s(G.BODY_W)}; visibility: hidden; opacity: 0; }
.nc-row { transform-origin: 50% 0; }
.nc-in { position: absolute; left: 0; top: 0; width: 100%; height: 100%; }
.nc-sh { position: absolute; display: block; }
.nc-fill { position: absolute; display: block; left: 0; top: 0; width: 100%; height: 100%; }
.nc-row > .nc-sh { left: ${s(-4)}; top: ${s(-2)}; width: ${s(G.BODY_W + 8)}; height: calc(100% + ${s(12)}); border-radius: ${s(G.RADIUS + 4)}; background: ${shadow}; filter: blur(${s(26)}); }
.nc-row > .nc-fill { border-radius: ${s(G.RADIUS)}; background: rgba(246,228,219,0.804); }
.nc-icon { position: absolute; display: block; left: ${s(G.ICON_INSET)}; top: calc(50% - ${s(G.ICON / 2)}); width: ${s(G.ICON)}; height: ${s(G.ICON)}; }
.nc-t { position: absolute; white-space: nowrap; line-height: 1; }
.nc-title { left: ${s(G.TEXT_X)}; top: ${s(G.TITLE_Y + 0.1 * G.TITLE_PX)}; font-size: ${s(G.TITLE_PX)}; font-weight: 600; color: rgb(20,20,22); }
.nc-now { right: ${s(G.TEXT_RIGHT)}; top: ${s(G.NOW_Y + 0.1 * G.META_PX)}; font-size: ${s(G.META_PX)}; color: rgb(140,138,140); }
.nc-line { left: ${s(G.TEXT_X)}; font-size: ${s(G.BODY_PX)}; color: rgb(70,68,72); }
.nc-handle { right: ${s(G.TEXT_RIGHT)}; top: calc(100% - ${s(G.HANDLE_UP - 0.1 * G.META_PX)}); font-size: ${s(G.META_PX)}; font-style: italic; color: rgb(150,146,146); }
.nc-pill-row { height: ${s(G.PILL_H)}; display: flex; justify-content: flex-end; gap: ${s(G.X_GAP)}; }
.nc-pill, .nc-x { position: relative; flex: none; height: ${s(G.PILL_H)}; }
.nc-pill { box-sizing: border-box; padding: 0 ${s(56)} 0 ${s(52)}; display: flex; align-items: center; }
.nc-x { width: ${s(G.X_SIZE)}; }
.nc-pill > .nc-sh, .nc-x > .nc-sh { left: ${s(-2)}; top: 0; right: ${s(-2)}; bottom: ${s(-8)}; background: rgba(30,22,16,0.43); filter: blur(${s(20)}); }
.nc-pill > .nc-sh, .nc-pill > .nc-fill { border-radius: ${s(G.PILL_H / 2 + 2)}; }
.nc-x > .nc-sh, .nc-x > .nc-fill, .nc-press { border-radius: 50%; }
.nc-pill > .nc-fill, .nc-x > .nc-fill { background: rgba(247,244,240,0.824); }
.nc-chev { position: absolute; display: block; left: ${s(18)}; top: ${s(27)}; width: ${s(28)}; height: ${s(18)}; }
.nc-label { position: relative; font-size: ${s(G.PILL_PX)}; line-height: 1; white-space: nowrap; color: rgb(70,68,72); }
.nc-press { position: absolute; display: block; left: 0; top: 0; width: 100%; height: 100%; background: rgba(60,54,48,0.2); opacity: 0; }
.nc-xmark { position: absolute; display: block; left: 0; top: 0; width: 100%; height: 100%; }
`;
}

// The in-page driver: compose.py's overlay expressions, evaluated at seek time. Tops are worked out from
// the newest banner up: each banner sits one gap above the next (pushed up as that one arrives), or, once
// folded, a sliver above it, narrower, fainter, its words faded and cut under the banner in front.
const NC_DRIVER = String.raw`(() => {
  const D = NC_PAGE;
  const M = D.motion;
  const R = D.rows;
  const plate = document.querySelector('.nc-plate');
  const rows = [...document.querySelectorAll('.nc-row.nc-stack')];
  const inner = rows.map((row) => row.querySelector('.nc-in'));
  const res = document.querySelector('.nc-row.nc-resolution');
  const pill = document.querySelector('.nc-pill-row');
  const xbtn = document.querySelector('.nc-x');
  const press = document.querySelector('.nc-press');
  const clamp = (v) => Math.max(0, Math.min(1, v));
  const push = (t, a) => (a === null ? 0 : 1 - Math.exp(-M.push_rate * Math.max(0, t - a)));
  const spring = (t, a) => M.spring_px * Math.exp(-M.spring_rate * Math.max(0, t - a));
  const lift = (t) => M.clear_px * (1 - Math.exp(-M.clear_rate * Math.max(0, t - D.clear)));
  const fadeIn = (t, a, d) => (t < a ? 0 : clamp((t - a) / d));
  const place = (el, y, alpha, scale) => {
    el.style.visibility = alpha > 0 ? 'visible' : 'hidden';
    el.style.opacity = String(alpha);
    el.style.transform = 'translate3d(0,' + y.toFixed(3) + 'px,0)' + (scale === undefined ? '' : ' scale(' + scale.toFixed(5) + ')');
  };
  const fold = (t, k) => (k < R.length ? push(t, R[k].s) : 0);
  const draw = (t) => {
    plate.style.opacity = String(clamp(t / M.plate_fade));
    plate.style.transform = 'scale(' + Math.min(1 + M.zoom_per_s * t, M.zoom_max).toFixed(6) + ')';
    const out = t < D.clear ? 1 : 1 - clamp((t - D.clear) / M.fade_out);
    const up = lift(t) * D.u;
    const n = R.length;
    const top = new Array(n);
    top[n - 1] = D.bottom - R[n - 1].h;
    for (let k = n - 2; k >= 0; k--) {
      const next = R[k + 1];
      const open = top[k + 1] + next.h - (next.h + D.gap) * push(t, next.a) - R[k].h;
      const tucked = top[k + 1] - D.sliver * (1 - fold(t, k + 2));
      top[k] = open + (tucked - open) * fold(t, k);
    }
    const shown = top.map((y, k) => y + spring(t, R[k].a) * D.u);
    rows.forEach((row, k) => {
      const e = fold(t, k);
      const depth = e + fold(t, k + 1);
      const scale = 1 - D.sliver_scale * depth;
      place(row, shown[k] - up, fadeIn(t, R[k].a, M.fade_in) * out * (1 - fold(t, k + 2)) * (1 - D.sliver_dim * depth), e > 0 ? scale : undefined);
      inner[k].style.opacity = String(1 - e);
      const cut = e > 0 && k + 1 < n ? R[k].h - (shown[k + 1] + D.tuck - shown[k]) / scale : -1;
      row.style.clipPath = cut > 0 ? 'inset(-400px -400px ' + cut.toFixed(3) + 'px -400px)' : 'none';
    });
    place(pill, top[0] - D.pill_gap - up, fadeIn(t, R[0].a, M.fade_in) * out);
    // The X is pressed just before the stack swipes away.
    const p = clamp((t - (D.clear - 0.2)) / 0.3);
    const bump = p > 0 && p < 1 ? Math.sin(Math.PI * p) : 0;
    xbtn.style.transform = 'scale(' + (1 - 0.08 * bump).toFixed(4) + ')';
    press.style.opacity = bump.toFixed(4);
    if (res) place(res, D.bottom - D.res_h + spring(t, D.resolution) * D.u, fadeIn(t, D.resolution, M.res_fade));
  };
  window.seek = (ms) => draw(ms / 1000);
  draw(0);
})();`;

/**
 * The notification-cascade page for `thread`: { html, events, total_s, cues, stats, warnings }.
 * `env` = { width, height, fps, theme, safe_area, assets, font_css, images, timing }.
 */
export function ncBuild(thread, env) {
  ncValidate(thread, env);
  const P = ncPacing(thread);
  const L = ncLayout(thread, env);
  const { events, arrivals, clear, resolution, total } = ncTimeline(thread, P, env.fps);
  const G = NC_GEO;
  const n = thread.notifications.length;
  const stack = L.banners.slice(0, n).map((b, i) => ncBannerHtml(b, i, L.handle, L, 'nc-stack')).join('\n');
  const res = thread.resolution ? ncBannerHtml(L.banners[n], n, L.handle, L, 'nc-resolution') : '';
  const pill =
    '<div class="nc-pill-row"><div class="nc-pill"><i class="nc-sh"></i><i class="nc-fill"></i>' +
    '<svg class="nc-chev" viewBox="-14 -9 28 18" aria-hidden="true"><polyline points="-11,-6 0,6 11,-6" fill="none" stroke="rgb(90,88,90)" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/></svg>' +
    '<span class="nc-label">Show less</span></div>' +
    '<div class="nc-x"><i class="nc-sh"></i><i class="nc-fill"></i><i class="nc-press"></i>' +
    '<svg class="nc-xmark" viewBox="0 0 72 72" aria-hidden="true"><path d="M20 20L52 52M20 52L52 20" stroke="rgb(90,88,90)" stroke-width="6" stroke-linecap="round"/></svg></div></div>';
  // A banner folds as the notification that needs its room arrives, with that one's push.
  const foldAt = L.banners.slice(0, n).map((_, k) => {
    const m = L.folded.findIndex((c) => c > k);
    return m < 0 ? null : arrivals[m];
  });
  const page = {
    u: L.u,
    bottom: L.bottom,
    gap: L.gap,
    rows: L.banners.slice(0, n).map((b, k) => ({ h: b.h, a: arrivals[k], s: foldAt[k] })),
    res_h: thread.resolution ? L.banners[n].h : 0,
    sliver: G.SLIVER * L.u,
    sliver_scale: G.SLIVER_SCALE,
    sliver_dim: G.SLIVER_DIM,
    tuck: G.TUCK * L.u,
    pill_gap: (G.PILL_ABOVE + G.PILL_H) * L.u,
    clear,
    resolution,
    motion: NC_MOTION,
  };
  const json = (v) => JSON.stringify(v).replace(/</g, '\\u003c');
  const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=${env.width}, height=${env.height}"><style>${ncCss(env, L)}</style></head>
<body>
<img class="nc-plate" src="${ncEsc(env.images[thread.plate])}" alt="" decoding="sync">
${stack}
${pill}
${res}
<script>const NC_PAGE=${json(page)};
${NC_DRIVER}</script>
</body></html>`;

  // One pop per arrival and one for the resolution, on the first frame that shows
  // the banner; one swoosh on the first frame of the clear (compose.py's cues).
  const onFrame = (t) => Math.ceil((t + 1 / env.fps - 1e-8) * env.fps) / env.fps;
  const cues = events.map((e) =>
    e.kind === 'clear' ? { t: onFrame(e.t), sound: NC_SWOOSH, gain: NC_SWOOSH_GAIN } : { t: onFrame(e.t), sound: NC_POP, gain: NC_POP_GAIN, limit_db: NC_POP_LIMIT_DB },
  );
  const banners = [...thread.notifications, ...(thread.resolution ? [thread.resolution] : [])];
  const stats = {
    messages: banners.length,
    words: banners.reduce((n, b) => n + String(b.body || '').trim().split(/\s+/u).filter(Boolean).length, 0),
    photos: 0,
  };
  return { html, events, total_s: total, cues, stats, warnings: L.warnings };
}

// phone-chat skin: chatgpt (prefix cg).
//
// Ports render-chatgpt-chat (its in-page driver and deriveSFX cue rules) and the
// create-chatgpt-mockup page it bundles (generate.js, templates/chat.css,
// templates/icons.js) into one frame-stepped page. The old recorder played a
// hand-written timeline live and screen-recorded it; here the timeline is derived
// from the thread, and window.seek(ms) rebuilds the whole picture from movie time:
// typing, the one-beat send tap (bubble pops, keyboard slides down, header icons
// swap), the single gray loading dot, the word-by-word answer and the auto-scroll.
//
// Light mode only, like the mockup. Pure module: no imports, no clocks, no I/O.

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const CG_STAGE_W = 750; // the mockup's screen width in CSS px (chat.css .stage)
const CG_MIN_STAGE_H = 1100; // shortest screen that still shows keyboard, composer and some chat
const CG_CONV_TOP = 118; // status bar (56) + header (62): only for build-time fit checks
const CG_KB_LIFT = 498; // composer offset while the keyboard is up (chat.css)
const CG_MIN_CHAT_H = 160; // chat that must stay visible above the composer while typing
const CG_SAFE_GAP = 8; // output px between the newest content and a platform band
const CG_MAX_TOTAL_S = 120;
const CG_TICK_EVERY = 12; // deriveSFX: one stream-tick every 12 streamed words
const CG_ICON_KEYS = ['personPlus', 'dottedCircle', 'edit', 'more'];
const CG_ICON_NAMES = [
  'hamburger', 'chevronDown', 'chevronRight', 'personPlus', 'dottedCircle', 'editPencil', 'moreDots',
  'plus', 'mic', 'sendArrow', 'thumbsUp', 'thumbsDown', 'signal', 'wifi', 'battery', 'moonDND',
  'stopSquare', 'kbdShift', 'kbdBackspace', 'kbdReturn', 'kbdGlobe', 'kbdMic', 'kbdEmoji',
];

// Pacing, in seconds unless named otherwise. Defaults reproduce the atom's
// config.example.json timeline: keyboard up at 0, typing from 0.5 (47 chars in
// 2.6 s), send at 3.3, dot 3.65 to 4.2, answer from 4.25 at 7 words a second.
const CG_TIMING = {
  start: 0, // first keyboard-show
  keyboard_lead: 0.5, // keyboard-show to typing start
  type_cps: 18, // composer typing speed, characters per second
  min_type: 1,
  max_type: 4,
  send_hold: 0.2, // full question rests in the composer before the tap
  dot_delay: 0.35, // send tap to loading dot (or to the answer when there is no dot)
  dot_hold: 0.55, // the dot is on screen this long, then the answer replaces it
  stream_delay: 0.05, // answer row appears, then its first word
  stream_wps: 7, // streamed words per second
  done_delay: 0.05, // last word to response-done
  next_turn_gap: 1, // answer finished to the next keyboard-show
  scroll_ms: 300, // auto-scroll glide
  tail_hold: 1.5, // the last state holds this long (at least 0.5)
};

// deriveSFX cue rules, plus a sound when the answer replaces the dot; never one when the dot shows. The
// files peak at -20 to -24 dBFS: keys, ticks and the finish sit near -20 dBFS, the send and the answer near
// -7 dBFS, so each message is heard over a -24 LUFS bed and the bed's ducking triggers.
const CG_CUES = {
  key: ['key-tap.wav', 1.33],
  send: ['send-tap.wav', 5],
  'answer-show': ['response-done.wav', 4.5],
  'stream-tick': ['stream-tick.wav', 1.6],
  'stream-done': ['response-done.wav', 1.4],
};

// ---------------------------------------------------------------------------
// Thread schema
// ---------------------------------------------------------------------------

const CG_ID_SCHEMA = { type: 'string', pattern: '^[A-Za-z0-9][A-Za-z0-9_-]{0,63}$' };
const CG_ICON_LIST_SCHEMA = { type: 'array', items: { type: 'string', enum: CG_ICON_KEYS }, maxItems: 3 };

export const CHATGPT_THREAD_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['messages'],
  properties: {
    status_bar: {
      type: 'object',
      additionalProperties: false,
      properties: {
        time: { type: 'string', pattern: '^[0-9]{1,2}:[0-9]{2}$' },
        dnd: { type: 'boolean' },
      },
    },
    header: {
      type: 'object',
      additionalProperties: false,
      properties: {
        style: { type: 'string', enum: ['model-tag', 'title-only', 'plain-title'] },
        title: { type: 'string', minLength: 1, maxLength: 32 },
        model: { type: 'string', minLength: 1, maxLength: 8 },
        right_icons: CG_ICON_LIST_SCHEMA,
        right_icons_alt: CG_ICON_LIST_SCHEMA,
      },
    },
    keyboard: {
      type: 'object',
      additionalProperties: false,
      properties: {
        suggestions: {
          type: 'array',
          items: { type: 'string', minLength: 1, maxLength: 14 },
          minItems: 3,
          maxItems: 3,
        },
        shift: { type: 'string', enum: ['lower', 'upper'] },
        letters_row1: { type: 'string', pattern: '^[a-z]{1,12}$' },
        letters_row2: { type: 'string', pattern: '^[a-z]{1,11}$' },
        letters_row3: { type: 'string', pattern: '^[a-z]{1,9}$' },
      },
    },
    messages: {
      type: 'array',
      minItems: 1,
      maxItems: 24,
      items: {
        oneOf: [
          {
            type: 'object',
            additionalProperties: false,
            required: ['type', 'id', 'text'],
            properties: {
              type: { const: 'user-text' },
              id: CG_ID_SCHEMA,
              text: { type: 'string', minLength: 1, maxLength: 280, pattern: '^[^\\r\\n]+$' },
            },
          },
          {
            type: 'object',
            additionalProperties: false,
            required: ['type', 'id', 'image'],
            properties: {
              type: { const: 'user-image' },
              id: CG_ID_SCHEMA,
              image: { type: 'string', pattern: '^[A-Za-z0-9][A-Za-z0-9_.-]{0,63}$' },
              aspect: { type: 'string', enum: ['square', 'natural'] },
            },
          },
          {
            type: 'object',
            additionalProperties: false,
            required: ['type', 'id'],
            properties: {
              type: { const: 'loading-dot' },
              id: CG_ID_SCHEMA,
            },
          },
          {
            type: 'object',
            additionalProperties: false,
            required: ['type', 'id', 'text'],
            properties: {
              type: { const: 'assistant' },
              id: CG_ID_SCHEMA,
              text: { type: 'string', minLength: 1, maxLength: 2400 },
              title: { type: 'string', minLength: 1, maxLength: 60 },
              feedback: { type: 'boolean' },
              stream: { type: 'boolean' },
            },
          },
        ],
      },
    },
    composer: {
      type: 'object',
      additionalProperties: false,
      properties: {
        placeholder: { type: 'string', minLength: 1, maxLength: 40 },
        chip: {
          type: 'object',
          additionalProperties: false,
          required: ['name'],
          properties: { name: { type: 'string', minLength: 1, maxLength: 24 } },
        },
      },
    },
    sfx: { type: 'boolean' },
  },
};

// ---------------------------------------------------------------------------
// Small helpers
// ---------------------------------------------------------------------------

function cgEscape(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function cgGraphemes(text) {
  return [...new Intl.Segmenter('en', { granularity: 'grapheme' }).segment(String(text))].map((s) => s.segment);
}

// Index of the first grapheme of every word (one key-tap per word, as deriveSFX).
function cgWordStarts(g) {
  const starts = [];
  for (let i = 0; i < g.length; i++) {
    if (/\S/u.test(g[i]) && (i === 0 || !/\S/u.test(g[i - 1]))) starts.push(i);
  }
  return starts;
}

// Characters shown in the composer `elapsed` seconds after typing starts.
// Serialized into the page, so the page and the build share one rule.
function cgTypedCount(n, dur, elapsed) {
  if (!(elapsed > 0)) return 0;
  return Math.min(n, Math.floor((elapsed * n) / dur + 1e-6));
}

function cgClamp(x, lo, hi) {
  return Math.min(hi, Math.max(lo, x));
}

function cgAsset(env, name) {
  const text = env.assets && env.assets[name];
  if (typeof text !== 'string' || !text.length) {
    throw new Error(`The chatgpt skin needs its ${name} asset in env.assets.`);
  }
  return text;
}

// icons.js is the atom's CommonJS icon table, shipped byte for byte. Read the
// backtick strings out of it instead of running it.
function cgIcons(src) {
  const icons = {};
  const re = /^\s*([A-Za-z][A-Za-z0-9]*)\s*:\s*`([^`]*)`/gm;
  let m;
  while ((m = re.exec(src))) icons[m[1]] = m[2];
  for (const name of CG_ICON_NAMES) {
    if (!icons[name]) throw new Error(`The chatgpt icons.js asset has no ${name} icon.`);
  }
  return icons;
}

// The copied chat.css names system fonts and runs CSS animations. Drop its
// comments and point every font stack at the kit fonts; animations are switched
// off by a later rule because seek() draws every frame itself.
function cgStyles(raw) {
  return raw
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/font-family\s*:[^;}]*/g, 'font-family: KitText, KitEmoji, sans-serif');
}

// ---------------------------------------------------------------------------
// Assistant markdown (ported from generate.js)
// ---------------------------------------------------------------------------

function cgInline(s) {
  let out = cgEscape(s);
  out = out.replace(/\[\[icon:(.+?)\]\]/g, (_, ico) => `<span class="icon-prefix">${ico}</span>`);
  out = out.replace(/\[\[cite:(.+?)\]\]/g, (_, c) => `<span class="cite">${c}</span>`);
  out = out.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  out = out.replace(/(^|[^*])\*([^*\n]+)\*(?!\*)/g, '$1<em>$2</em>');
  return out;
}

function cgMarkdown(src) {
  const lines = String(src).replace(/\r\n/g, '\n').split('\n');
  const out = [];
  let buf = [];
  let inList = false;
  let inOrdered = false;
  const flushParagraph = () => {
    if (!buf.length) return;
    const joined = buf
      .map((l) => cgInline(l))
      .join('<br>')
      .replace(/^(<br>)+|(<br>)+$/g, '');
    if (joined) out.push(`<p>${joined}</p>`);
    buf = [];
  };
  const flushList = () => {
    if (inList) {
      out.push('</ul>');
      inList = false;
    }
    if (inOrdered) {
      out.push('</ol>');
      inOrdered = false;
    }
  };
  for (const raw of lines) {
    const line = raw.replace(/\s+$/, '');
    if (!line.trim()) {
      flushParagraph();
      flushList();
      continue;
    }
    if (/^---+\s*$/.test(line)) {
      flushParagraph();
      flushList();
      out.push('<hr>');
      continue;
    }
    const h = /^(#{1,3})\s+(.*)$/.exec(line);
    if (h) {
      flushParagraph();
      flushList();
      out.push(`<h${h[1].length}>${cgInline(h[2])}</h${h[1].length}>`);
      continue;
    }
    const li = /^[*-]\s+(.*)$/.exec(line);
    if (li) {
      flushParagraph();
      if (inOrdered) {
        out.push('</ol>');
        inOrdered = false;
      }
      if (!inList) {
        out.push('<ul>');
        inList = true;
      }
      out.push(`<li>${cgInline(li[1])}</li>`);
      continue;
    }
    const oli = /^(\d+)\.\s+(.*)$/.exec(line);
    if (oli) {
      flushParagraph();
      if (inList) {
        out.push('</ul>');
        inList = false;
      }
      if (!inOrdered) {
        out.push('<ol>');
        inOrdered = true;
      }
      out.push(`<li>${cgInline(oli[2])}</li>`);
      continue;
    }
    const sec = /^\*\*(.+?)\*\*:?\s*$/.exec(line);
    if (sec) {
      flushParagraph();
      flushList();
      out.push(`<p class="section-title">${cgInline(sec[1])}</p>`);
      continue;
    }
    buf.push(line);
  }
  flushParagraph();
  flushList();
  return out.join('\n');
}

// List markers are painted by the browser and cannot be hidden word by word, so a
// streamed answer turns lists into divs whose items start with a literal "• ".
function cgInlineBullets(html) {
  return html
    .replace(/<ul[^>]*>/g, '<div class="md-list">')
    .replace(/<\/ul>/g, '</div>')
    .replace(/<ol[^>]*>/g, '<div class="md-list ordered">')
    .replace(/<\/ol>/g, '</div>')
    .replace(/<li>/g, '<div class="md-li">• ')
    .replace(/<\/li>/g, '</div>');
}

// Wrap every visible word in <span class="word">. A citation pill or a rule has
// its own paint, so it gets data-f = the index of the word it arrives with.
function cgWrapWords(html, counter) {
  const out = [];
  let i = 0;
  while (i < html.length) {
    if (html[i] === '<') {
      const end = html.indexOf('>', i);
      if (end === -1) {
        out.push(html.slice(i));
        break;
      }
      let tag = html.slice(i, end + 1);
      if (/^<hr\b/.test(tag) || /^<span class="cite"/.test(tag)) tag = tag.replace(/^<(\w+)/, `<$1 data-f="${counter.n}"`);
      out.push(tag);
      i = end + 1;
      continue;
    }
    const next = html.indexOf('<', i);
    const run = next === -1 ? html.slice(i) : html.slice(i, next);
    for (const tok of run.split(/(\s+)/)) {
      if (!tok) continue;
      if (/^\s+$/.test(tok)) out.push(tok);
      else {
        out.push(`<span class="word">${tok}</span>`);
        counter.n += 1;
      }
    }
    i = next === -1 ? html.length : next;
  }
  return out.join('');
}

// ---------------------------------------------------------------------------
// Screen parts (ported from generate.js)
// ---------------------------------------------------------------------------

function cgStatusBar(thread, I) {
  const sb = thread.status_bar || {};
  return `<div class="status-bar"><div class="time">${cgEscape(sb.time || '9:41')} ${sb.dnd === true ? I.moonDND : ''}</div><div class="right-cluster">${I.signal}${I.wifi}${I.battery}</div></div>`;
}

function cgHeaderParts(thread) {
  const h = thread.header || {};
  const style = h.style || 'model-tag';
  return {
    style,
    title: h.title || 'ChatGPT',
    model: h.model || '',
    right: h.right_icons || (style === 'title-only' ? ['edit'] : ['personPlus', 'dottedCircle']),
    alt: h.right_icons_alt || null,
  };
}

function cgHeader(thread, I) {
  const h = cgHeaderParts(thread);
  let center;
  if (h.style === 'title-only') {
    center = `<div class="center"><span>${cgEscape(h.title)}</span><span class="chev-right">${I.chevronRight}</span></div>`;
  } else if (h.style === 'plain-title') {
    center = `<div class="center"><span>${cgEscape(h.title)}</span></div>`;
  } else {
    const tag = h.model ? `<span class="model-tag">${cgEscape(h.model)}</span>` : '';
    center = `<div class="center"><span>${cgEscape(h.title)}</span>${tag}<span class="chev-down">${I.chevronDown}</span></div>`;
  }
  const map = { personPlus: I.personPlus, dottedCircle: I.dottedCircle, edit: I.editPencil, more: I.moreDots };
  const cluster = (keys) => keys.map((k) => map[k] || '').join('');
  const right = h.alt
    ? `<div class="right" data-active="primary"><div class="cluster primary" data-cluster="primary">${cluster(h.right)}</div><div class="cluster alt" data-cluster="alt">${cluster(h.alt)}</div></div>`
    : `<div class="right">${cluster(h.right)}</div>`;
  return `<div class="gpt-header ${h.style === 'title-only' ? 'title-center' : ''}"><div class="left"><div class="hamburger">${I.hamburger}</div></div>${center}${right}</div>`;
}

function cgComposer(thread, I) {
  const c = thread.composer || {};
  const placeholder = c.placeholder || 'Ask anything';
  const input = `<div class="input"><span class="placeholder">${cgEscape(placeholder)}</span><span class="composer-text" style="display:none"></span><span class="caret" style="display:none"></span></div>`;
  const sendBtn = `<div class="send-btn"><span class="cg-arrow">${I.sendArrow}</span><span class="cg-stop" style="display:none">${I.stopSquare}</span></div>`;
  if (c.chip) {
    return `<div class="composer-wrap"><div class="composer with-chip"><div class="gpt-chip"><span>${cgEscape(c.chip.name)}</span><span class="x">×</span></div><div class="input-row"><div class="plus-btn">${I.plus}</div>${input}<div class="mic-btn">${I.mic}</div>${sendBtn}</div></div></div>`;
  }
  return `<div class="composer-wrap"><div class="composer"><div class="plus-btn">${I.plus}</div>${input}<div class="mic-btn">${I.mic}</div>${sendBtn}</div></div>`;
}

function cgKeyboard(thread, I) {
  const kb = thread.keyboard || {};
  const upper = kb.shift === 'upper';
  const key = (c) => `<div class="kbd-key">${cgEscape(upper ? c.toUpperCase() : c)}</div>`;
  const r1 = (kb.letters_row1 || 'qwertyuiop').split('').map(key).join('');
  const r2 = (kb.letters_row2 || 'asdfghjkl').split('').map(key).join('');
  const r3 = (kb.letters_row3 || 'zxcvbnm').split('').map(key).join('');
  const sug = (kb.suggestions || ['I', 'The', "I'm"]).map((s) => `<div class="kbd-suggestion">${cgEscape(s)}</div>`).join('');
  return `<div class="kbd" data-state="hidden"><div class="kbd-suggestions">${sug}</div><div class="kbd-row">${r1}</div><div class="kbd-row kbd-row--abc">${r2}</div><div class="kbd-row kbd-row--zxc"><div class="kbd-key kbd-key--wide">${I.kbdShift}</div>${r3}<div class="kbd-key kbd-key--wide">${I.kbdBackspace}</div></div><div class="kbd-bottom"><div class="kbd-key kbd-key--num">123</div><div class="kbd-key kbd-key--emoji">${I.kbdEmoji}</div><div class="kbd-key kbd-key--space">space</div><div class="kbd-key kbd-key--return">${I.kbdReturn}</div></div><div class="kbd-footer">${I.kbdGlobe}${I.kbdMic}</div></div>`;
}

// One assistant row. A loading dot that precedes it is drawn inside it, at the
// spot the first line will take, so the answer replaces the dot in place.
function cgAssistant(m, dot, I) {
  const stream = m.stream !== false;
  const counter = { n: 0 };
  let title = m.title ? `<div class="title-row"><span class="title-text">${cgEscape(m.title)}</span></div>` : '';
  let body = cgMarkdown(m.text);
  if (stream) {
    if (title) title = cgWrapWords(title, counter);
    body = cgWrapWords(cgInlineBullets(body), counter);
  } else {
    cgWrapWords(title + body, counter);
  }
  const dotHTML = dot ? `<div class="row loading-dot cg-dot" data-anim-id="${cgEscape(dot.id)}"><div class="dot"></div></div>` : '';
  const feedback = m.feedback === false ? '' : `<div class="feedback">${I.thumbsUp}${I.thumbsDown}</div>`;
  const html = `<div class="row assistant" data-anim-id="${cgEscape(m.id)}">${dotHTML}${title}<div class="assistant-body${stream ? ' streaming-body' : ''}">${body}</div>${feedback}</div>`;
  return { html, words: counter.n, stream };
}

// ---------------------------------------------------------------------------
// Checks the schema cannot express
// ---------------------------------------------------------------------------

function cgCheckEnv(env) {
  if (!env || typeof env !== 'object') throw new Error('The chatgpt skin needs an env object.');
  const { width, height, fps } = env;
  if (!Number.isInteger(width) || !Number.isInteger(height) || width % 2 || height % 2 || width < 320 || height < 568) {
    throw new Error('env.width and env.height must be even whole numbers, at least 320 by 568.');
  }
  if (!Number.isInteger(fps) || fps < 1 || fps > 120) throw new Error('env.fps must be a whole number from 1 to 120.');
}

function cgTimingFrom(overrides) {
  const T = { ...CG_TIMING };
  if (overrides != null) {
    if (typeof overrides !== 'object' || Array.isArray(overrides)) throw new Error('env.timing must be an object of named pacing values.');
    for (const [key, value] of Object.entries(overrides)) {
      if (!(key in CG_TIMING)) throw new Error(`env.timing.${key} is not a chatgpt pacing value; use one of ${Object.keys(CG_TIMING).join(', ')}.`);
      if (typeof value !== 'number' || !Number.isFinite(value) || value < 0) throw new Error(`env.timing.${key} must be a finite number of zero or more.`);
      T[key] = value;
    }
  }
  if (!(T.type_cps > 0) || !(T.stream_wps > 0) || !(T.scroll_ms > 0) || !(T.min_type > 0)) {
    throw new Error('env.timing.type_cps, stream_wps, scroll_ms and min_type must be above zero.');
  }
  if (T.max_type < T.min_type) throw new Error('env.timing.max_type must not be below min_type.');
  if (T.tail_hold < 0.5) throw new Error('env.timing.tail_hold must be at least 0.5 seconds so the last state holds.');
  return T;
}

// Fill the canvas width-wise with the 750 px wide screen, scaled uniformly; the
// screen gets as tall as the canvas allows. A canvas too short for that keeps a
// 1100 px tall screen and pads the sides with the chat's white.
function cgLayout(env) {
  const W = env.width;
  const H = env.height;
  const z = Math.min(W / CG_STAGE_W, H / CG_MIN_STAGE_H);
  const sh = H / z;
  const left = (W - CG_STAGE_W * z) / 2;
  const pad = { left: 32, right: 32 };
  let safe = null;
  const sa = env.safe_area;
  if (sa != null) {
    if (typeof sa !== 'object' || Array.isArray(sa)) throw new Error('env.safe_area must be null or {top, bottom, left, right} in output pixels.');
    for (const k of ['top', 'bottom', 'left', 'right']) {
      if (typeof sa[k] !== 'number' || !Number.isFinite(sa[k]) || sa[k] < 0) throw new Error(`env.safe_area.${k} must be a number of zero or more output pixels.`);
    }
    const gap = CG_SAFE_GAP / z;
    safe = { top: sa.top / z, bottom: (H - sa.bottom) / z, gap };
    pad.left = Math.max(32, (sa.left - left) / z + gap);
    pad.right = Math.max(32, CG_STAGE_W - (W - sa.right - left) / z + gap);
    if (CG_STAGE_W - pad.left - pad.right < 360) throw new Error('env.safe_area leaves the chat too narrow; the side bands must leave at least half the screen.');
    const top = CG_CONV_TOP + Math.max(10, safe.top + gap - CG_CONV_TOP);
    if (safe.bottom - gap - top < 240) throw new Error('env.safe_area leaves too little height for the chat between the top and bottom bands.');
  }
  return { z, sh, left, pad, safe };
}

function cgCheckThread(thread, env, layout) {
  const msgs = thread.messages;
  const seen = new Set();
  for (const m of msgs) {
    if (seen.has(m.id)) throw new Error(`Message id "${m.id}" is used twice; every message needs its own id.`);
    seen.add(m.id);
  }
  if (msgs[0].type !== 'user-text' && msgs[0].type !== 'user-image') {
    throw new Error('The chat must open with the user: make the first message a user-text or user-image.');
  }
  if (!msgs.some((m) => m.type === 'user-text')) throw new Error('Supply at least one user-text message to type and send.');
  msgs.forEach((m, i) => {
    const prev = msgs[i - 1];
    const next = msgs[i + 1];
    if (m.type === 'user-image') {
      if (!next || next.type !== 'user-text') throw new Error(`User image "${m.id}" must be followed by the user-text message it is sent with.`);
      const src = env.images && env.images[m.image];
      if (typeof src !== 'string' || !src.startsWith('data:image/')) throw new Error(`Image key "${m.image}" in message "${m.id}" is missing from env.images.`);
    }
    if (m.type === 'user-text') {
      if (!/\S/u.test(m.text)) throw new Error(`User message "${m.id}" has no visible text.`);
      if (next && next.type !== 'assistant' && next.type !== 'loading-dot') {
        throw new Error(`User message "${m.id}" must be answered before the user sends again; put an assistant message after it.`);
      }
    }
    if (m.type === 'loading-dot' && (!next || next.type !== 'assistant')) {
      throw new Error(`Loading dot "${m.id}" must come right before the assistant message it stands in for.`);
    }
    if (m.type === 'assistant') {
      const askedBy = prev && prev.type === 'loading-dot' ? msgs[i - 2] : prev;
      if (!askedBy || askedBy.type !== 'user-text') throw new Error(`Assistant message "${m.id}" must answer a user-text message (optionally after one loading dot).`);
    }
  });

  // Header: the centre label sits between the hamburger and the right icons.
  const h = cgHeaderParts(thread);
  const em = 22 * 0.6;
  const chevron = h.style === 'model-tag' ? 22 : h.style === 'title-only' ? 17 : 0;
  const label = cgGraphemes(h.title).length * em + (h.style === 'model-tag' && h.model ? 10 + cgGraphemes(h.model).length * em : 0) + chevron;
  const icons = Math.max(h.right.length, h.alt ? h.alt.length : 0);
  const room = CG_STAGE_W - 64 - 30 - (icons ? icons * 30 + (icons - 1) * 18 : 0) - 32;
  if (label > room) throw new Error('header.title is too long to fit between the header icons; shorten it, drop header.model or use fewer right icons.');

  // Composer: the typed question grows the pill upward over the chat while the keyboard is up.
  const perLine = 472 / (28 * 0.55);
  const chip = thread.composer && thread.composer.chip ? 46 : 0;
  const room2 = layout.sh - CG_KB_LIFT - CG_CONV_TOP - CG_MIN_CHAT_H - 44 - chip;
  const maxLines = Math.max(1, Math.floor((room2 - 30) / 36.4));
  for (const m of msgs) {
    if (m.type !== 'user-text') continue;
    const lines = Math.ceil(cgGraphemes(m.text).length / perLine);
    if (lines > maxLines) {
      throw new Error(`User message "${m.id}" is too long to type in the composer on a ${env.width}x${env.height} canvas; keep it under about ${Math.floor(maxLines * perLine)} characters.`);
    }
  }
}

// ---------------------------------------------------------------------------
// The page runtime. Serialized into the document; it may only use the DOM and
// the plan handed to it. Everything on screen is a function of seek(ms).
// ---------------------------------------------------------------------------

function cgRuntime(P) {
  var Z = P.z;
  var EPS = 0.0005; // an integer-millisecond seek still lands on its frame's events
  var D = P.scroll_ms / 1000;
  function q(sel, root) {
    return (root || document).querySelector(sel);
  }
  var stage = q('.stage');
  var conv = q('.conversation');
  var content = q('.cg-content');
  var wrap = q('.composer-wrap');
  var kb = q('.kbd');
  var input = q('.composer .input');
  var ph = q('.placeholder', input);
  var ct = q('.composer-text', input);
  var caret = q('.caret', input);
  var send = q('.composer .send-btn');
  var arrow = q('.cg-arrow', send);
  var stop = q('.cg-stop', send);
  var right = q('.gpt-header .right');
  var cPri = q('.cluster.primary', right);
  var cAlt = q('.cluster.alt', right);
  var el = {};
  var tagged = document.querySelectorAll('[data-anim-id]');
  for (var a = 0; a < tagged.length; a++) el[tagged[a].getAttribute('data-anim-id')] = tagged[a];
  var rows = document.querySelectorAll('.cg-content > .row');
  var dots = document.querySelectorAll('.cg-dot');
  var answers = [];
  for (var b = 0; b < P.items.length; b++) {
    var item = P.items[b];
    if (item.k !== 'answer') continue;
    var row = el[item.id];
    answers.push({ it: item, row: row, words: row.querySelectorAll('.word'), follow: row.querySelectorAll('[data-f]'), fb: q('.feedback', row) });
  }

  function bezier(x1, y1, x2, y2) {
    return function (x) {
      if (x <= 0) return 0;
      if (x >= 1) return 1;
      var lo = 0;
      var hi = 1;
      var s = x;
      for (var i = 0; i < 32; i++) {
        s = (lo + hi) / 2;
        var xs = 3 * (1 - s) * (1 - s) * s * x1 + 3 * (1 - s) * s * s * x2 + s * s * s;
        if (xs < x) lo = s;
        else hi = s;
      }
      return 3 * (1 - s) * (1 - s) * s * y1 + 3 * (1 - s) * s * s * y2 + s * s * s;
    };
  }
  var KB = bezier(0.3, 0, 0.2, 1); // .kbd transition
  var POP = bezier(0.2, 0.7, 0.2, 1); // gpt-pop and the send-tap pulse
  var OUT = bezier(0, 0, 0.58, 1); // ease-out: word fade, header cross-fade
  var INOUT = bezier(0.42, 0, 0.58, 1); // dot pulse
  function c01(x) {
    return x < 0 ? 0 : x > 1 ? 1 : x;
  }
  function glide(p) {
    p = c01(p);
    return 0.5 - 0.5 * Math.cos(Math.PI * p);
  }
  function kbAt(seg, time) {
    return seg ? seg.from + (seg.to - seg.from) * KB(c01((time - seg.t) / 0.28)) : 0;
  }
  function scrollAt(seg, time) {
    return seg ? seg.from + (seg.to - seg.from) * glide((time - seg.t) / D) : 0;
  }
  // gpt-pop: 0% {opacity 0; scale .92; translateY 6px} 60% {opacity 1} 100% {scale 1}
  function pop(node, p, origin) {
    node.style.visibility = 'visible';
    if (p >= 1) {
      node.style.opacity = '';
      node.style.transform = '';
      return;
    }
    var e = POP(c01(p));
    node.style.opacity = String(POP(c01(p / 0.6)));
    node.style.transform = 'scale(' + (0.92 + 0.08 * e) + ') translateY(' + 6 * (1 - e) + 'px)';
    node.style.transformOrigin = origin;
  }
  // Moving parts land on whole output pixels, so their edges raster the same way
  // whichever frame came before.
  function px(v) {
    return Math.round(v * Z) / Z;
  }
  function fade(now, at) {
    return now < at ? 0 : OUT(c01((now - at) / 0.22));
  }
  // Steady states are written the same way whatever the seek order: hidden at 0,
  // no inline opacity at 1.
  function alpha(node, o) {
    node.style.visibility = o <= 0 ? 'hidden' : '';
    node.style.opacity = o > 0 && o < 1 ? String(o) : '';
  }

  function draw(ms) {
    var now = ms / 1000 + EPS;
    var i;
    // Repaint the whole screen on every frame (an invisible background swap by
    // frame parity), so no frame reuses raster tiles left by the frame before.
    stage.style.backgroundImage = Math.round((ms * P.fps) / 1000) % 2 ? 'linear-gradient(transparent, transparent)' : 'none';
    for (i = 0; i < rows.length; i++) {
      rows[i].style.visibility = 'hidden';
      rows[i].style.opacity = '';
      rows[i].style.transform = '';
    }
    for (i = 0; i < dots.length; i++) {
      dots[i].style.visibility = 'hidden';
      dots[i].style.transform = '';
    }

    var kseg = null;
    var text = '';
    var caretAt = 0;
    var pulseAt = null;
    var swapAt = null;
    var lastSend = null;
    var answered = false;
    var shown = [];
    var steps = [];
    for (i = 0; i < P.items.length; i++) {
      var it = P.items[i];
      if (it.t > now) continue;
      if (it.k === 'kb') {
        kseg = { t: it.t, from: kbAt(kseg, it.t), to: it.v };
      } else if (it.k === 'type') {
        text = it.g.slice(0, cgTypedCount(it.g.length, it.dur, now - it.t)).join('');
        caretAt = it.t + it.dur / it.g.length;
      } else if (it.k === 'send') {
        text = '';
        pulseAt = it.t;
        lastSend = it;
        if (it.swap && swapAt === null) swapAt = it.t;
        if (it.img) shown.push([el[it.img], it.t, 0.22, '100% 100%']);
        shown.push([el[it.id], it.t, 0.22, '100% 100%']);
        steps.push([it.t, el[it.id]]);
      } else if (it.k === 'dot') {
        if (now < it.until) shown.push([el[it.id], it.t, 0.22, '0% 0%', 1]);
        steps.push([it.t, el[it.id]]);
      } else if (it.k === 'answer') {
        if (now >= it.done) answered = true;
      }
    }

    // Layout first: keyboard, composer, chat window. Then measure, then paint.
    var kbp = kbAt(kseg, now);
    wrap.style.bottom = px(P.kb_lift * kbp) + 'px';
    ph.style.display = text ? 'none' : '';
    ct.style.display = text ? '' : 'none';
    ct.textContent = text;
    caret.style.display = text ? '' : 'none';
    caret.style.opacity = Math.floor((now - caretAt) / 0.525) % 2 ? '0' : '1';

    var convTop = conv.offsetTop;
    if (P.safe) content.style.paddingTop = Math.max(10, P.safe.top + P.safe.gap - convTop) + 'px';
    var visBottom = wrap.offsetTop;
    if (P.safe) visBottom = Math.min(visBottom, P.safe.bottom - P.safe.gap);
    var visH = Math.max(0, visBottom - convTop);
    conv.style.height = visH + 'px';
    // The keyboard slides by layout, not by a transform: Chromium rasters a
    // transformed layer differently after it has moved, which breaks seek order.
    kb.style.bottom = px(-(1 - kbp) * kb.offsetHeight) + 'px';

    for (var n = 0; n < answers.length; n++) {
      var A = answers[n];
      if (A.it.t > now) continue;
      if (!A.it.stream) {
        steps.push([A.it.t, A.row]);
        continue;
      }
      for (var w = 0; w < A.words.length; w++) {
        var tw = A.it.s + w / A.it.wps;
        if (tw > now) break;
        steps.push([tw, A.words[w]]);
      }
      if (A.it.done <= now) steps.push([A.it.done, A.row]);
    }
    steps.sort(function (x, y) {
      return x[0] - y[0];
    });
    var base = content.getBoundingClientRect().top;
    var seg = null;
    var reach = 0;
    for (i = 0; i < steps.length; i++) {
      var bottom = (steps[i][1].getBoundingClientRect().bottom - base) / Z;
      if (bottom <= reach + 0.5) continue;
      seg = { t: steps[i][0], from: scrollAt(seg, steps[i][0]), to: bottom };
      reach = bottom;
    }
    var scroll = Math.max(0, scrollAt(seg, now) + P.pad_bottom - visH);
    scroll = px(scroll);
    content.style.transform = scroll ? 'translateY(' + -scroll + 'px)' : '';

    for (i = 0; i < shown.length; i++) {
      var s = shown[i];
      pop(s[0], (now - s[1]) / s[2], s[3]);
      if (s[4]) {
        var ph2 = ((now - s[1]) % 1.1) / 1.1;
        var u = ph2 < 0.5 ? INOUT(ph2 / 0.5) : 1 - INOUT((ph2 - 0.5) / 0.5);
        var dotEl = s[0].firstChild;
        dotEl.style.opacity = String(0.45 + 0.55 * u);
        dotEl.style.transform = 'scale(' + (0.92 + 0.12 * u) + ')';
      }
    }
    for (n = 0; n < answers.length; n++) {
      var R = answers[n];
      var on = R.it.t <= now;
      if (on) pop(R.row, (now - R.it.t) / 0.28, '0% 0%');
      if (!R.it.stream) continue;
      var op = [];
      for (w = 0; w < R.words.length; w++) {
        var o = on ? fade(now, R.it.s + w / R.it.wps) : 0;
        op.push(o);
        alpha(R.words[w], o);
        R.words[w].style.filter = o > 0 && o < 1 ? 'blur(' + 2 * (1 - o) + 'px)' : '';
      }
      for (w = 0; w < R.follow.length; w++) {
        var f = +R.follow[w].getAttribute('data-f');
        alpha(R.follow[w], f < op.length ? op[f] : on ? fade(now, R.it.done) : 0);
      }
      if (R.fb) alpha(R.fb, on ? fade(now, R.it.done) : 0);
    }

    if (cAlt) {
      var x = swapAt === null ? 0 : OUT(c01((now - swapAt) / 0.22));
      right.setAttribute('data-active', x >= 1 ? 'alt' : 'primary');
      alpha(cPri, x <= 0 ? 1 : 1 - x);
      alpha(cAlt, x >= 1 ? 1 : x);
      if (x <= 0) cAlt.style.visibility = 'hidden';
      if (x >= 1) cPri.style.visibility = 'hidden';
    }
    var state = text ? 'active' : lastSend && now < lastSend.busy ? 'streaming' : answered ? 'active' : '';
    send.classList.toggle('active', state === 'active');
    send.classList.toggle('streaming', state === 'streaming');
    arrow.style.display = state === 'streaming' ? 'none' : '';
    stop.style.display = state === 'streaming' ? '' : 'none';
    var press = pulseAt === null ? 1 : 0.86 + 0.14 * POP(c01((now - pulseAt) / 0.14));
    send.style.transform = press >= 1 ? '' : 'scale(' + press + ')';
  }

  window.seek = function (ms) {
    draw(Number(ms) || 0);
  };
  window.seek(0);
}

// ---------------------------------------------------------------------------
// Build
// ---------------------------------------------------------------------------

export function chatgptBuild(thread, env) {
  cgCheckEnv(env);
  const T = cgTimingFrom(env.timing);
  const I = cgIcons(cgAsset(env, 'icons.js'));
  const css = cgStyles(cgAsset(env, 'chat.css'));
  const layout = cgLayout(env);
  cgCheckThread(thread, env, layout);

  const fps = env.fps;
  const snap = (t) => Math.ceil((t - 1e-8) * fps) / fps;
  const msgs = thread.messages;
  const header = cgHeaderParts(thread);

  // Rows, in thread order. A loading dot renders inside the answer after it.
  const rowsHTML = [];
  const words = {};
  msgs.forEach((m, i) => {
    if (m.type === 'user-text') {
      rowsHTML.push(`<div class="row user" data-anim-id="${cgEscape(m.id)}"><div class="bubble">${cgEscape(m.text)}</div></div>`);
    } else if (m.type === 'user-image') {
      const cls = m.aspect === 'square' ? 'attachment square' : 'attachment';
      rowsHTML.push(`<div class="row user-image" data-anim-id="${cgEscape(m.id)}"><div class="${cls}"><img src="${cgEscape(env.images[m.image])}" alt=""></div></div>`);
    } else if (m.type === 'assistant') {
      const prev = msgs[i - 1];
      const a = cgAssistant(m, prev && prev.type === 'loading-dot' ? prev : null, I);
      if (a.words < 1) throw new Error(`Assistant message "${m.id}" has no words to show.`);
      words[m.id] = a;
      rowsHTML.push(a.html);
    }
  });

  // Timeline: the in-page plan (items) and the reported events, from one walk.
  const items = [];
  const events = [];
  const ev = (t, kind, id) => events.push(id == null ? { t, kind } : { t, kind, id });
  let t = T.start;
  let swapped = false;
  let lastSend = null;
  msgs.forEach((m, i) => {
    if (m.type === 'user-text') {
      const img = i > 0 && msgs[i - 1].type === 'user-image' ? msgs[i - 1].id : null;
      const kbShow = snap(t);
      items.push({ k: 'kb', t: kbShow, v: 1 });
      ev(kbShow, 'keyboard-show');
      const g = cgGraphemes(m.text);
      const dur = cgClamp(g.length / T.type_cps, T.min_type, T.max_type);
      const typeAt = snap(kbShow + T.keyboard_lead);
      items.push({ k: 'type', t: typeAt, dur, g });
      ev(typeAt, 'type-start', m.id);
      for (const c of cgWordStarts(g)) ev(snap(typeAt + ((c + 1) * dur) / g.length), 'key', m.id);
      const sendAt = snap(typeAt + dur + T.send_hold);
      const swap = !swapped && !!header.alt;
      swapped = swapped || swap;
      lastSend = { k: 'send', t: sendAt, id: m.id, img, swap, busy: sendAt };
      items.push(lastSend);
      items.push({ k: 'kb', t: sendAt, v: 0 });
      ev(sendAt, 'send', m.id);
      if (img) ev(sendAt, 'pop', img);
      ev(sendAt, 'pop', m.id);
      ev(sendAt, 'keyboard-hide');
      if (swap) ev(sendAt, 'header-swap');
      t = sendAt + T.dot_delay;
    } else if (m.type === 'loading-dot') {
      const show = snap(t);
      const hide = snap(show + T.dot_hold);
      items.push({ k: 'dot', t: show, until: hide, id: m.id });
      ev(show, 'dot-show', m.id);
      ev(hide, 'dot-hide', m.id);
      t = hide;
    } else if (m.type === 'assistant') {
      const a = words[m.id];
      const popAt = snap(t);
      const s = a.stream ? snap(popAt + T.stream_delay) : popAt;
      const done = snap(s + a.words / T.stream_wps + (a.stream ? T.done_delay : 0));
      items.push({ k: 'answer', t: popAt, id: m.id, stream: a.stream, s, wps: T.stream_wps, n: a.words, done });
      lastSend.busy = a.stream ? done : popAt;
      ev(popAt, 'pop', m.id);
      ev(popAt, 'answer-show', m.id);
      if (a.stream) {
        ev(s, 'stream-start', m.id);
        for (let w = CG_TICK_EVERY; w < a.words; w += CG_TICK_EVERY) ev(snap(s + w / T.stream_wps), 'stream-tick', m.id);
        ev(done, 'stream-done', m.id);
      } else {
        ev(done, 'answer-done', m.id);
      }
      t = done + T.next_turn_gap;
    }
  });
  events.sort((x, y) => x.t - y.t);
  const total_s = snap(events[events.length - 1].t + T.tail_hold);
  const stats = {
    messages: msgs.filter((m) => m.type === 'user-text' || m.type === 'user-image' || m.type === 'assistant').length,
    // The answers' words as the page streams them (they set the answer's time). The question is not
    // counted: it is typed by its characters.
    words: msgs.reduce((n, m) => n + (m.type === 'assistant' ? words[m.id].words : 0), 0),
    photos: msgs.filter((m) => m.type === 'user-image').length,
  };
  if (total_s > CG_MAX_TOTAL_S) {
    throw new Error(`The chat runs ${total_s.toFixed(1)} s; keep it under ${CG_MAX_TOTAL_S} s by shortening the answers or raising timing.stream_wps.`);
  }

  const cues =
    thread.sfx === false
      ? []
      : events.filter((e) => CG_CUES[e.kind]).map((e) => ({ t: e.t, sound: CG_CUES[e.kind][0], gain: CG_CUES[e.kind][1] }));

  const plan = {
    z: layout.z,
    fps,
    kb_lift: CG_KB_LIFT,
    pad_bottom: 32,
    scroll_ms: T.scroll_ms,
    safe: layout.safe,
    items,
  };
  const W = env.width;
  const H = env.height;
  const page = `
html, body { margin: 0; padding: 0; width: ${W}px; height: ${H}px; overflow: hidden; background: #FFFFFF; }
body { position: relative; }
.stage { position: absolute; left: ${layout.left / layout.z}px; top: 0; margin: 0; width: ${CG_STAGE_W}px; height: ${layout.sh}px; zoom: ${layout.z}; }
.stage, .stage * { animation: none !important; transition: none !important; }
.status-bar, .gpt-header { flex: 0 0 auto; }
.conversation { flex: 0 0 auto; display: block; padding: 0; gap: 0; height: 0; overflow: hidden; }
.cg-content { display: flex; flex-direction: column; gap: 22px; padding: 10px ${layout.pad.right}px 32px ${layout.pad.left}px; }
.composer-wrap { position: absolute; left: 0; right: 0; bottom: 0; z-index: 4; }
.kbd[data-state] { transform: none; bottom: -100%; }
.row.assistant { position: relative; }
.row.user .bubble, .row.assistant .assistant-body { overflow-wrap: anywhere; }
.row.user-image .attachment img { max-height: 560px; object-fit: cover; }
.row.loading-dot.cg-dot { position: absolute; left: 0; top: 6px; margin: 0; }
.cg-arrow, .cg-stop { display: inline-flex; }
.gpt-header .right[data-active] .cluster.alt { top: 0; transform: none; }
`;
  const planJSON = JSON.stringify(plan).replace(/</g, '\\u003c').split(String.fromCharCode(0x2028)).join('\\u2028').split(String.fromCharCode(0x2029)).join('\\u2029');
  const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=${W}, height=${H}">
<style>${env.font_css || ''}</style>
<style>${css}</style>
<style>${page}</style>
</head>
<body>
<div class="stage">${cgStatusBar(thread, I)}${cgHeader(thread, I)}<div class="conversation"><div class="cg-content">${rowsHTML.join('')}</div></div>${cgComposer(thread, I)}${cgKeyboard(thread, I)}</div>
<script type="application/json" id="cg-plan">${planJSON}</script>
<script>
${String(cgTypedCount)}
(${String(cgRuntime)})(JSON.parse(document.getElementById('cg-plan').textContent));
</script>
</body></html>
`;
  return { html, events, total_s, cues, stats };
}

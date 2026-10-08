// apple-notes skin for the phone-chat part.
//
// Port of render-apple-notes-chat (record-notes.js) and create-apple-notes-mockup
// (generate.js, templates/note.css, templates/icons.js). The note opens on its
// title with a blinking caret and the keyboard up; each line types one
// character at a time with a key pop, a darker space and return key and a human
// rhythm; between lines the return key goes down, then the caret blinks for the
// line's pre-pause; the note eases up so the caret never sits under the
// keyboard; it ends on the finished list. Checklist rows, images and dividers
// from the mockup can be part of the note too.
//
// Today's recorder screenshotted one PNG per state. This page instead derives
// the whole picture from movie time in window.seek(ms). Layout is the
// mockup's own: a 1180 px wide phone screen, scaled uniformly onto the canvas.
// Apple Notes is silent, so there are no cues.

const NOTES_BASE_W = 1180;
const NOTES_BASE_H = 2098;
const NOTES_KBD_H = 1100;
const NOTES_PILL_OVERLAP = 40;
const NOTES_CARET_MARGIN = 70;
const NOTES_SCROLL_EXTRA = 40;
const NOTES_TOOLBAR_BOTTOM = 298;
const NOTES_NOTE_TOP = 360;
const NOTES_NOTE_SIDE = 66;
const NOTES_BODY_LINE = 80;
const NOTES_SAFE_GAP = 8;
const NOTES_FONT = 'KitText, KitEmoji, sans-serif';

const notesTextSchema = { type: 'string', minLength: 1, maxLength: 80, pattern: '^[^\\u2013\\u2014\\r\\n]*$' };
const notesTypeSeconds = { type: 'number', minimum: 0.05, maximum: 20 };
const notesPauseSeconds = { type: 'number', minimum: 0, maximum: 10 };
const notesLettersRow = { type: 'string', pattern: '^[a-z]{1,12}$' };

export const NOTES_THREAD_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['title', 'lines'],
  properties: {
    title: { type: 'string', minLength: 1, maxLength: 60, pattern: '^[^\\r\\n]*$' },
    lines: {
      type: 'array',
      minItems: 1,
      maxItems: 30,
      items: {
        oneOf: [
          {
            type: 'object',
            additionalProperties: false,
            required: ['text', 'type_seconds'],
            properties: {
              type: { const: 'paragraph' },
              text: notesTextSchema,
              type_seconds: notesTypeSeconds,
              pre_pause_seconds: notesPauseSeconds,
            },
          },
          {
            type: 'object',
            additionalProperties: false,
            required: ['type', 'text', 'type_seconds'],
            properties: {
              type: { const: 'check' },
              text: notesTextSchema,
              type_seconds: notesTypeSeconds,
              pre_pause_seconds: notesPauseSeconds,
              checked: { type: 'boolean' },
            },
          },
          {
            type: 'object',
            additionalProperties: false,
            required: ['type', 'image'],
            properties: {
              type: { const: 'image' },
              image: { type: 'string', minLength: 1, maxLength: 64, pattern: '^[A-Za-z0-9][A-Za-z0-9_.-]*$' },
              caption: notesTextSchema,
              pre_pause_seconds: notesPauseSeconds,
            },
          },
          {
            type: 'object',
            additionalProperties: false,
            required: ['type'],
            properties: {
              type: { const: 'divider' },
              pre_pause_seconds: notesPauseSeconds,
            },
          },
        ],
      },
    },
    post_hold_seconds: { type: 'number', minimum: 0.5, maximum: 10 },
    status_bar: {
      type: 'object',
      additionalProperties: false,
      properties: {
        time: { type: 'string', pattern: '^[0-9]{1,2}:[0-9]{2}$' },
        battery_pct: { type: 'integer', minimum: 0, maximum: 100 },
        battery_low: { type: 'boolean' },
        show_focus_glyph: { type: 'boolean' },
      },
    },
    keyboard_state: {
      type: 'object',
      additionalProperties: false,
      properties: {
        suggestions: { type: 'array', maxItems: 3, items: { type: 'string', minLength: 1, maxLength: 16 } },
        shift: { enum: ['lower', 'upper'] },
        letters_row1: notesLettersRow,
        letters_row2: notesLettersRow,
        letters_row3: notesLettersRow,
      },
    },
  },
};

// Pacing constants, all overridable through env.timing.
const notesTimingDefaults = {
  // Blink before the first line, when thread.lines[0].pre_pause_seconds is unset.
  first_pre_pause_s: 1.0,
  // Blink before every later line, when its pre_pause_seconds is unset.
  pre_pause_s: 0.6,
  // How long the return key shows pressed.
  return_s: 0.08,
  // Final hold, when thread.post_hold_seconds is unset (never under 0.5 s).
  post_hold_s: 1.4,
  // iOS caret blink half-period.
  blink_s: 0.53,
  // The ease that lifts the note above the keyboard (7 frames at 30 fps).
  scroll_s: 7 / 30,
  // Beat after a checklist row ticks itself.
  tick_hold_s: 0.4,
  // Slower keystroke after a space or punctuation.
  pause_factor: 1.35,
};

const notesIconNames = [
  'backChevron', 'undo', 'share', 'more', 'done', 'signal', 'wifi', 'focusBed',
  'formatAa', 'formatChecklist', 'formatTable', 'formatAttach', 'formatPen', 'formatAi',
  'globe', 'mic', 'shift', 'backspace', 'returnArrow',
];

const notesCheckSvg =
  '<svg viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12 L10 17 L19 7"/></svg>';

function notesEsc(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

// iOS Smart Punctuation as generate.js applies it to the title and suggestions.
function notesSmartFull(s) {
  return String(s)
    .replace(/---/g, '—')
    .replace(/--/g, '–')
    .replace(/\.\.\./g, '…')
    .replace(/(^|[\s(\[{<—–])"/g, '$1“')
    .replace(/"/g, '”')
    .replace(/(^|[\s(\[{<—–])'/g, '$1‘')
    .replace(/'/g, '’');
}

function notesSnap(t, fps) {
  const v = Math.ceil((t - 1e-8) * fps) / fps;
  return v === 0 ? 0 : v;
}

function notesGraphemes(text) {
  return [...new Intl.Segmenter(undefined, { granularity: 'grapheme' }).segment(text)].map((s) => s.segment);
}

function notesTiming(overrides) {
  const out = { ...notesTimingDefaults };
  if (overrides === undefined || overrides === null) return out;
  if (typeof overrides !== 'object' || Array.isArray(overrides)) {
    throw new Error('The timing overrides must be an object of named pacing constants.');
  }
  for (const [key, value] of Object.entries(overrides)) {
    if (!Object.prototype.hasOwnProperty.call(notesTimingDefaults, key)) {
      throw new Error(`The Apple Notes skin has no pacing constant named ${key}.`);
    }
    if (typeof value !== 'number' || !Number.isFinite(value) || value < 0) {
      throw new Error(`The pacing constant ${key} must be a finite number, zero or more.`);
    }
    out[key] = value;
  }
  return out;
}

function notesCanvas(env) {
  for (const key of ['width', 'height', 'fps']) {
    const v = env[key];
    if (typeof v !== 'number' || !Number.isFinite(v) || v <= 0) {
      throw new Error(`The canvas ${key} must be a positive number.`);
    }
  }
  const { width, height } = env;
  let scale = width / NOTES_BASE_W;
  if (height / scale < NOTES_BASE_H - 1) scale = height / NOTES_BASE_H;
  const W = width / scale;
  const H = height / scale;
  let left = NOTES_NOTE_SIDE;
  let right = NOTES_NOTE_SIDE;
  let top = NOTES_NOTE_TOP;
  let limit = H - NOTES_KBD_H - NOTES_PILL_OVERLAP - NOTES_CARET_MARGIN;
  let zoneTop = 0;
  const safe = env.safe_area;
  if (safe !== undefined && safe !== null) {
    if (typeof safe !== 'object' || Array.isArray(safe)) {
      throw new Error('The safe area must be null or an object of top, bottom, left and right bands.');
    }
    const band = {};
    for (const key of Object.keys(safe)) {
      if (!['top', 'bottom', 'left', 'right'].includes(key)) {
        throw new Error(`The safe area has an unknown band ${key}; use top, bottom, left or right.`);
      }
    }
    for (const key of ['top', 'bottom', 'left', 'right']) {
      const v = safe[key] === undefined ? 0 : safe[key];
      if (typeof v !== 'number' || !Number.isFinite(v) || v < 0) {
        throw new Error(`The safe area band ${key} must be a non-negative number of output pixels.`);
      }
      band[key] = v;
    }
    const gap = NOTES_SAFE_GAP / scale;
    zoneTop = band.top / scale + gap;
    left = Math.max(left, band.left / scale + gap);
    right = Math.max(right, band.right / scale + gap);
    top = Math.max(top, zoneTop);
    limit = Math.min(limit, (height - band.bottom) / scale - gap);
  }
  if (W - left - right < W / 2) {
    throw new Error('The safe area leaves the note too narrow a column for its text.');
  }
  if (limit - NOTES_SCROLL_EXTRA - NOTES_BODY_LINE < Math.max(NOTES_TOOLBAR_BOTTOM, zoneTop)) {
    throw new Error('The canvas and safe area leave no room for the newest note line between the toolbar and the keyboard.');
  }
  return { width, height, scale, W, H, left, right, top, limit };
}

function notesIcons(text) {
  if (typeof text !== 'string') throw new Error('The Apple Notes skin needs its icons.js asset.');
  const icons = {};
  const re = /^\s*([A-Za-z][A-Za-z0-9]*):\s*`([^`]*)`/gm;
  let m;
  while ((m = re.exec(text))) icons[m[1]] = m[2];
  for (const name of notesIconNames) {
    if (!icons[name]) throw new Error(`The Apple Notes icons asset has no ${name} icon.`);
  }
  const battery = /battery:[\s\S]*?return\s*`([^`]*)`/.exec(text);
  if (!battery || !battery[1].includes('${innerW}') || !battery[1].includes('${fillColor}')) {
    throw new Error('The Apple Notes icons asset has no battery icon template.');
  }
  icons.formatAa = icons.formatAa.replace(/font-family="[^"]*"/g, 'font-family="KitText, sans-serif"');
  return { icons, battery: battery[1] };
}

function notesBattery(template, pct, low) {
  const innerW = Math.max(2, Math.round((pct / 100) * 46));
  return template.split('${innerW}').join(String(innerW)).split('${fillColor}').join(low ? '#FF3B30' : '#000');
}

function notesCss(text) {
  if (typeof text !== 'string') throw new Error('The Apple Notes skin needs its note.css asset.');
  return text
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/font-family\s*:[^;}]*/g, `font-family: ${NOTES_FONT}`)
    .replace(/url\(\s*"data:image\/svg\+xml[^"]*"\s*\)/g, 'none')
    .replace(/url\(\s*'data:image\/svg\+xml[^']*'\s*\)/g, 'none');
}

// Pixel size from the image header; the page also lays out with the loaded size.
function notesImageSize(uri, key) {
  const m = /^data:image\/[A-Za-z0-9.+-]+;base64,([A-Za-z0-9+/=\s]+)$/.exec(typeof uri === 'string' ? uri : '');
  if (!m) throw new Error(`The image ${key} must be a base64 image data URI.`);
  let bin;
  try {
    bin = atob(m[1].replace(/\s+/g, ''));
  } catch {
    throw new Error(`The image ${key} is not valid base64.`);
  }
  const b = (i) => bin.charCodeAt(i) & 0xff;
  const be16 = (i) => (b(i) << 8) | b(i + 1);
  const le16 = (i) => b(i) | (b(i + 1) << 8);
  const be32 = (i) => b(i) * 16777216 + (b(i + 1) << 16) + (b(i + 2) << 8) + b(i + 3);
  const le24 = (i) => b(i) | (b(i + 1) << 8) | (b(i + 2) << 16);
  let size = null;
  if (bin.length >= 24 && bin.startsWith('\x89PNG\r\n\x1a\n') && bin.slice(12, 16) === 'IHDR') {
    size = { w: be32(16), h: be32(20) };
  } else if (bin.length >= 10 && /^GIF8[79]a/.test(bin.slice(0, 6))) {
    size = { w: le16(6), h: le16(8) };
  } else if (bin.length >= 30 && bin.slice(0, 4) === 'RIFF' && bin.slice(8, 12) === 'WEBP') {
    const chunk = bin.slice(12, 16);
    if (chunk === 'VP8X') size = { w: le24(24) + 1, h: le24(27) + 1 };
    else if (chunk === 'VP8 ') size = { w: le16(26) & 0x3fff, h: le16(28) & 0x3fff };
    else if (chunk === 'VP8L') {
      const n = (b(21) | (b(22) << 8) | (b(23) << 16) | (b(24) << 24)) >>> 0;
      size = { w: (n & 0x3fff) + 1, h: ((n >>> 14) & 0x3fff) + 1 };
    }
  } else if (bin.length >= 4 && b(0) === 0xff && b(1) === 0xd8) {
    let i = 2;
    while (i + 9 < bin.length) {
      if (b(i) !== 0xff) break;
      const marker = b(i + 1);
      if (marker === 0xff) { i += 1; continue; }
      if (marker === 0x01 || (marker >= 0xd0 && marker <= 0xd8)) { i += 2; continue; }
      if (marker >= 0xc0 && marker <= 0xcf && marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc) {
        size = { w: be16(i + 7), h: be16(i + 5) };
        break;
      }
      i += 2 + be16(i + 2);
    }
  }
  if (!size || !(size.w > 0) || !(size.h > 0)) {
    throw new Error(`The image ${key} must be a PNG, JPEG, GIF or WebP picture.`);
  }
  return size;
}

function notesKind(line) {
  if (!line) return null;
  if (line.type === 'check' || line.type === 'image' || line.type === 'divider') return line.type;
  return 'p';
}

function notesIsText(line) {
  const k = notesKind(line);
  return k === 'p' || k === 'check';
}

// The whole movie as blocks with show/hide times, keystrokes, blink holds and
// events, in raw seconds (snapped later). Mirrors record-notes.js step by step.
function notesPlan(thread, timing) {
  const lines = thread.lines;
  const blocks = [];
  const presses = [];
  const holds = [];
  const events = [{ t: 0, kind: 'open' }];
  const add = (kind, show, extra) => {
    const block = { kind, show, hide: null, chars: [], times: [], tick: null, ...extra };
    blocks.push(block);
    return block;
  };
  const caretKind = (line) => (notesIsText(line) ? notesKind(line) : 'p');
  let t = 0;
  let cur = null;
  lines.forEach((line, li) => {
    const id = `line-${li + 1}`;
    const kind = notesKind(line);
    if (li === 0) cur = add(caretKind(line), 0);
    else if (notesIsText(lines[li - 1])) {
      cur = add(caretKind(line), t);
      presses.push({ t, end: t + timing.return_s, key: '\n' });
      events.push({ t, kind: 'return', id });
      t += timing.return_s;
    }
    const pre = line.pre_pause_seconds ?? (li === 0 ? timing.first_pre_pause_s : timing.pre_pause_s);
    holds.push({ t, end: t + pre });
    t += pre;
    if (kind === 'p' || kind === 'check') {
      const chars = notesGraphemes(line.text);
      const per = line.type_seconds / chars.length;
      chars.forEach((c, ci) => {
        const jitter = /[\s.,→]/.test(c) ? timing.pause_factor : 0.8 + ((ci * 37) % 10) / 25;
        const d = per * jitter;
        cur.chars.push(c);
        cur.times.push(t);
        presses.push({ t, end: t + d, key: c });
        if (ci === 0) events.push({ t, kind: 'type', id });
        if (ci === chars.length - 1) events.push({ t, kind: 'typed', id });
        t += d;
      });
      if (kind === 'check' && line.checked) {
        cur.tick = t;
        events.push({ t, kind: 'tick', id });
        holds.push({ t, end: t + timing.tick_hold_s });
        t += timing.tick_hold_s;
      }
    } else {
      cur.hide = t;
      add(kind, t, kind === 'image' ? { image: line.image, caption: line.caption ?? null } : {});
      cur = add(caretKind(lines[li + 1]), t);
      events.push({ t, kind: 'insert', id });
    }
  });
  return { blocks, presses, holds, events, end: t };
}

function notesStatusBar(sb, icons, batteryTemplate) {
  const time = sb.time || '9:41';
  const pct = sb.battery_pct ?? 87;
  const focus = sb.show_focus_glyph ?? false;
  return `
    <div class="status-bar">
      <div class="status-time">
        <span>${notesEsc(time)}</span>
        ${focus ? `<span class="focus-glyph">${icons.focusBed}</span>` : ''}
      </div>
      <div class="status-right">
        ${icons.signal}
        ${icons.wifi}
        ${notesBattery(batteryTemplate, pct, !!sb.battery_low)}
      </div>
    </div>`;
}

function notesToolbar(icons) {
  return `
    <div class="toolbar">
      <div class="toolbar-pill toolbar-back">${icons.backChevron}</div>
      <div class="toolbar-right">
        <div class="toolbar-actions">
          ${icons.undo}
          ${icons.share}
          ${icons.more}
        </div>
        <div class="toolbar-done">${icons.done}</div>
      </div>
    </div>`;
}

function notesKeyboard(kb, icons) {
  const sug = kb.suggestions || ['see', 'go', 'do'];
  const r1 = (kb.letters_row1 || 'qwertyuiop').split('');
  const r2 = (kb.letters_row2 || 'asdfghjkl').split('');
  const r3 = (kb.letters_row3 || 'zxcvbnm').split('');
  const ltr = (c) => (kb.shift === 'upper' ? c.toUpperCase() : c);
  const keys = (row) => row.map((c) => `<div class="kbd-key">${ltr(c)}</div>`).join('');
  return `
    <div class="kbd">
      <div class="kbd-format">
        <div>${icons.formatAa}</div>
        <div>${icons.formatChecklist}</div>
        <div>${icons.formatTable}</div>
        <div>${icons.formatAttach}</div>
        <div>${icons.formatPen}</div>
        <div>${icons.formatAi}</div>
      </div>
      <div class="kbd-base">
        <div class="kbd-suggestions">
          ${sug.map((s) => `<div class="kbd-suggestion">${notesEsc(notesSmartFull(s))}</div>`).join('')}
        </div>
        <div class="kbd-row">${keys(r1)}</div>
        <div class="kbd-row kbd-row--abc">${keys(r2)}</div>
        <div class="kbd-row kbd-row--zxc">
          <div class="kbd-key kbd-key--wide">${icons.shift}</div>
          ${keys(r3)}
          <div class="kbd-key kbd-key--wide">${icons.backspace}</div>
        </div>
        <div class="kbd-bottom">
          <div class="kbd-key kbd-key--num">123</div>
          <div class="kbd-key kbd-key--emoji">☻</div>
          <div class="kbd-key kbd-key--space">space</div>
          <div class="kbd-key kbd-key--return">${icons.returnArrow}</div>
        </div>
        <div class="kbd-footer">
          ${icons.globe}
          ${icons.mic}
        </div>
      </div>
    </div>`;
}

function notesBodyHtml(blocks, images, sizes) {
  const out = [];
  let group = -1;
  let inGroup = false;
  blocks.forEach((b, i) => {
    if (b.kind !== 'check' && inGroup) {
      out.push('</div>');
      inGroup = false;
    }
    if (b.kind === 'p') out.push(`<p class="note-paragraph" data-nb="${i}" style="display:none"></p>`);
    else if (b.kind === 'check') {
      if (!inGroup) {
        group += 1;
        out.push(`<div class="note-checklist" data-ng="${group}" style="display:none">`);
        inGroup = true;
      }
      out.push(`<div class="note-check" data-nb="${i}" style="display:none"><div class="note-check-box">${notesCheckSvg}</div><div class="note-check-text"></div></div>`);
    } else if (b.kind === 'image') {
      const size = sizes[b.image];
      const cap = b.caption ? `<div class="note-image-caption">${notesEsc(b.caption)}</div>` : '';
      out.push(`<div data-nb="${i}" style="display:none"><img class="note-image" src="${notesEsc(images[b.image])}" width="${size.w}" height="${size.h}" decoding="sync" alt="">${cap}</div>`);
    } else if (b.kind === 'divider') out.push(`<hr class="note-divider" data-nb="${i}" style="display:none">`);
  });
  if (inGroup) out.push('</div>');
  return out.join('\n');
}

// Runs in the page, never in Node. Everything on screen is a pure function of
// the movie time passed to window.seek; the only layout-dependent part (when
// the note scrolls) is measured from the page's own layout and cached until
// the fonts or images it was measured with change.
function notesPageScript() {
  const D = JSON.parse(document.getElementById('notes-data').textContent);
  const EPS = 1e-6;
  const screen = document.querySelector('.screen');
  const note = document.querySelector('.note');
  const els = D.blocks.map((b, i) => document.querySelector('[data-nb="' + i + '"]'));
  const holders = D.blocks.map((b, i) => (b.kind === 'check' ? els[i].querySelector('.note-check-text') : els[i]));
  const groups = [...document.querySelectorAll('[data-ng]')].map((g) => ({ el: g, kids: [...g.querySelectorAll('[data-nb]')] }));
  const letters = [...document.querySelectorAll('.kbd-row .kbd-key')].filter((k) => !k.children.length && k.textContent.length === 1);
  const base = letters.map((k) => k.textContent.toLowerCase());
  const space = document.querySelector('.kbd-key--space');
  const ret = document.querySelector('.kbd-key--return');
  const probe = document.querySelector('.notes-probe');
  const pop = document.createElement('div');
  pop.className = 'key-pop';
  pop.style.display = 'none';
  screen.appendChild(pop);
  const smart = (s) => s.replace(/(^|[\s(\[{<])"/g, '$1“').replace(/"/g, '”')
    .replace(/(^|[\s(\[{<])'/g, '$1‘').replace(/'/g, '’');
  const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const ease = (p) => 1 - Math.pow(1 - Math.max(0, Math.min(1, p)), 3);
  const reached = (t, now) => t !== null && t <= now + EPS;
  const isText = (b) => b.kind === 'p' || b.kind === 'check';

  const layout = (now, caretOn) => {
    let caret = -1;
    D.blocks.forEach((b, i) => {
      const shown = reached(b.show, now) && !reached(b.hide, now);
      els[i].style.display = shown ? '' : 'none';
      if (shown && isText(b)) caret = i;
    });
    for (const g of groups) g.el.style.display = g.kids.some((k) => k.style.display !== 'none') ? '' : 'none';
    D.blocks.forEach((b, i) => {
      if (!isText(b)) return;
      let n = 0;
      while (n < b.times.length && reached(b.times[n], now)) n++;
      const cursor = i === caret ? '<span class="cursor' + (caretOn ? '' : ' off') + '"></span>' : '';
      holders[i].innerHTML = esc(smart(b.chars.slice(0, n).join(''))) + cursor;
      if (b.kind === 'check') {
        const done = reached(b.tick, now);
        els[i].querySelector('.note-check-box').classList.toggle('note-check-box--checked', done);
        holders[i].classList.toggle('note-check-text--done', done);
      }
    });
    return caret;
  };

  let sched = null;
  let keyRects = [];
  let stamp = '';
  const fingerprint = () => {
    const r = probe.getBoundingClientRect();
    const imgs = [...document.images].map((im) => (im.complete ? 1 : 0) + ':' + im.naturalWidth + 'x' + im.naturalHeight).join(',');
    return [document.fonts ? document.fonts.status : '', r.width, r.height, imgs].join('|');
  };
  const schedule = () => {
    const fp = fingerprint();
    if (sched && fp === stamp) return sched;
    note.style.transform = 'none';
    const sr = screen.getBoundingClientRect();
    keyRects = letters.map((k) => {
      const r = k.getBoundingClientRect();
      return { left: (r.left - sr.left) / D.scale, bottom: (r.bottom - sr.top) / D.scale, width: r.width / D.scale, height: r.height / D.scale };
    });
    const times = new Set([0]);
    for (const b of D.blocks) {
      times.add(b.show);
      if (b.hide !== null) times.add(b.hide);
      for (const t of b.times) times.add(t);
    }
    const out = [];
    let target = 0;
    for (const t of [...times].sort((a, b) => a - b)) {
      const ci = layout(t, true);
      if (ci < 0) continue;
      const cur = holders[ci].querySelector('.cursor');
      const bottom = (cur.getBoundingClientRect().bottom - sr.top) / D.scale;
      if (bottom - target > D.limit + EPS) {
        target = bottom - D.limit + D.extra;
        out.push({ t, to: target, dur: t === 0 ? 0 : D.scroll_s });
      }
    }
    sched = out;
    stamp = fingerprint();
    return out;
  };
  const scrollAt = (now) => {
    const at = (s, time) => (s.dur > 0 ? s.from + (s.to - s.from) * ease((time - s.t) / s.dur) : s.to);
    let seg = { t: 0, from: 0, to: 0, dur: 0 };
    for (const s of schedule()) {
      if (s.t > now + EPS) break;
      seg = { t: s.t, from: at(seg, s.t), to: s.to, dur: s.dur };
    }
    return at(seg, now);
  };

  let last = 0;
  window.seek = (ms) => {
    last = ms;
    const now = Math.max(0, Number(ms) || 0) / 1000;
    const y = scrollAt(now);
    let hold = null;
    for (const h of D.holds) if (reached(h.t, now) && !reached(h.end, now)) hold = h;
    const caretOn = !hold || !(D.blink > 0) || Math.floor((now - hold.t + EPS) / D.blink) % 2 === 0;
    layout(now, caretOn);
    note.style.transform = 'translateY(' + -y + 'px)';
    let press = null;
    for (const p of D.presses) if (reached(p.t, now) && !reached(p.end, now)) press = p;
    const key = press ? press.key : null;
    const upper = D.shift === 'upper' || (key !== null && /^[A-Z]$/.test(key));
    letters.forEach((k, i) => {
      const c = upper ? base[i].toUpperCase() : base[i];
      if (k.textContent !== c) k.textContent = c;
    });
    if (space) space.classList.toggle('down', key === ' ');
    if (ret) ret.classList.toggle('down', key === '\n');
    const hit = key !== null && /^[a-z]$/i.test(key) ? base.indexOf(key.toLowerCase()) : -1;
    if (hit >= 0) {
      const r = keyRects[hit];
      const pw = r.width * 1.55;
      const ph = r.height * 1.9;
      pop.style.left = r.left + r.width / 2 - pw / 2 + 'px';
      pop.style.top = r.bottom - ph + 'px';
      pop.style.width = pw + 'px';
      pop.style.height = ph + 'px';
      pop.textContent = key;
      pop.style.display = '';
    } else pop.style.display = 'none';
  };
  window.seek(0);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => window.seek(last));
}

/**
 * Builds the Apple Notes page for one thread.
 * thread: valid against NOTES_THREAD_SCHEMA.
 * env: { width, height, fps, theme, safe_area, assets, font_css, images, timing }.
 * Returns { html, events, total_s, cues }.
 */
export function notesBuild(thread, env) {
  if (!env || typeof env !== 'object') throw new Error('The Apple Notes skin needs a render environment.');
  const timing = notesTiming(env.timing);
  const canvas = notesCanvas(env);
  const fps = env.fps;
  const assets = env.assets || {};
  const { icons, battery } = notesIcons(assets['icons.js']);
  const css = notesCss(assets['note.css']);
  const fontCss = typeof env.font_css === 'string' ? env.font_css : '';
  if (/<\/style/i.test(fontCss)) throw new Error('The font CSS must not close its style element.');

  const images = env.images || {};
  const sizes = {};
  thread.lines.forEach((line, li) => {
    if (notesKind(line) !== 'image') return;
    if (!Object.prototype.hasOwnProperty.call(images, line.image)) {
      throw new Error(`Line ${li + 1} shows the image ${line.image}, which is not among the provided images.`);
    }
    sizes[line.image] = notesImageSize(images[line.image], line.image);
  });

  const plan = notesPlan(thread, timing);
  const snap = (t) => (t === null ? null : notesSnap(t, fps));
  const postHold = Math.max(0.5, thread.post_hold_seconds ?? timing.post_hold_s);
  const doneAt = snap(plan.end);
  const total = notesSnap(doneAt + postHold, fps);
  const events = plan.events.map((e) => ({ ...e, t: snap(e.t) }));
  events.push({ t: doneAt, kind: 'done' });
  events.sort((a, b) => a.t - b.t);
  const holds = plan.holds.map((h) => ({ t: snap(h.t), end: snap(h.end) }));
  holds.push({ t: doneAt, end: null });

  const kb = thread.keyboard_state || { suggestions: ['I', 'The', 'My'], shift: 'lower' };
  const sb = thread.status_bar || { time: '9:41', battery_pct: 72 };
  const data = {
    scale: canvas.scale,
    limit: canvas.limit,
    extra: NOTES_SCROLL_EXTRA,
    blink: timing.blink_s,
    scroll_s: timing.scroll_s,
    shift: kb.shift === 'upper' ? 'upper' : 'lower',
    blocks: plan.blocks.map((b) => ({
      kind: b.kind,
      show: snap(b.show),
      hide: snap(b.hide),
      chars: b.chars,
      times: b.times.map(snap),
      tick: snap(b.tick),
    })),
    presses: plan.presses.map((p) => ({ t: snap(p.t), end: snap(p.end), key: p.key })),
    holds,
  };

  const probeText = [thread.title, ...thread.lines.map((l) => l.text || l.caption || '')].join(' ');
  const overrides = `
html, body { width: ${canvas.width}px !important; height: ${canvas.height}px !important; overflow: hidden !important; margin: 0; background: #ffffff; }
.screen { width: ${canvas.W}px !important; height: ${canvas.H}px !important; transform: scale(${canvas.scale}); transform-origin: 0 0; }
.note { top: ${canvas.top}px; left: ${canvas.left}px; right: ${canvas.right}px; transition: none; will-change: transform; }
.note-body .cursor.off { opacity: 0; }
.key-pop { position: absolute; z-index: 30; background: #fff; border-radius: 22px;
  box-shadow: 0 4px 14px rgba(0,0,0,.28); display: flex; align-items: flex-start;
  justify-content: center; font: 400 96px ${NOTES_FONT}; color: #1c1c1e; padding-top: 26px; }
.kbd-key.down { background: #abafb8 !important; }
.note-check-box > svg { display: none; position: absolute; inset: 0; margin: auto; width: 60%; height: 60%; }
.note-check-box--checked > svg { display: block; }
.notes-probe { position: absolute; left: 0; top: 0; visibility: hidden; white-space: pre; pointer-events: none; z-index: -1; }
.notes-probe .t { font-weight: 700; font-size: 104px; }
.notes-probe .b { font-weight: 400; font-size: 58px; }
`;
  const json = JSON.stringify(data).replace(/</g, '\\u003c');
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>Apple Notes</title>
<style>${fontCss}</style>
<style>${css}${overrides}</style>
</head>
<body>
<div class="screen">
  ${notesStatusBar(sb, icons, battery)}
  ${notesToolbar(icons)}
  <div class="note">
    <h1 class="note-title">${notesEsc(notesSmartFull(thread.title))}</h1>
    <div class="note-body">
${notesBodyHtml(plan.blocks, images, sizes)}
    </div>
  </div>
  ${notesKeyboard(kb, icons)}
  <div class="notes-probe" aria-hidden="true"><span class="t">${notesEsc(notesSmartFull(thread.title))}</span><span class="b">${notesEsc(probeText)} “”‘’</span></div>
</div>
<script type="application/json" id="notes-data">${json}</script>
<script>(${notesPageScript.toString()})();</script>
</body>
</html>
`;
  return { html, events, total_s: total, cues: [] };
}

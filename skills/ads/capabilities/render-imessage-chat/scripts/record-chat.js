#!/usr/bin/env node
/**
 * record-chat.js — render an iMessage CHAT-REVEAL video ad as a single
 * continuous Playwright recording, from DATA (a thread + style config). This is
 * the generalized, data-driven version of the hand-tuned per-client recorders
 * (e.g. Wonderbly Concept E) — the format is a template, not a per-brand script.
 *
 * What it fixes (QA GOOSE-2481, the recurring iMessage defects):
 *   1. The product/link renders as a REAL iMessage URL-preview rich link — image
 *      with only top-rounded corners flush against a gray meta card (bold title +
 *      domain subtitle + chevron). NOT a bare image with a distorted caption
 *      floating centered below it (the old default `.attachment-meta` style).
 *   2. Text never bleeds out of a bubble — the timeline is derived per message and
 *      the AUTHORING rule (enforced in the recipe) is to split any long line into
 *      multiple short bubbles, each of which fits. This renderer just honors the
 *      thread it's given; keep messages short.
 *   3. A clean single continuous timeline (no per-scene reloads / flicker).
 *
 * Output: <out-dir>/master-chat.mp4  +  <out-dir>/master-chat.sfx.json
 *
 * Usage:
 *   npm install                       # once, in this scripts/ folder (Playwright)
 *   node record-chat.js --config config.json [--out-dir .]
 *
 * config.json shape (see config.example.json):
 *   {
 *     "thread":   { ...iMessage thread JSON (participants + messages) },  // or "thread_path"
 *     "theme":    "dark" | "light",            // the user's theme choice; falls back to "dark"
 *     "background_image": "assets/bg.jpg",     // optional flat-lay behind the phone
 *     "width": 1080, "height": 1920, "zoom": 2.10,   // output geometry (defaults)
 *     "timing": { ...optional per-kind overrides }   // see TIMING below
 *   }
 * Relative paths in config (thread_path, background_image, message attachment `src`)
 * resolve against the config file's directory.
 */

const fs = require('fs');
const path = require('path');
const os = require('os');
const { execSync } = require('child_process');
const { chromium } = require('playwright');
const { renderHTML } = require('./mockup/generate.js');

// ── args ────────────────────────────────────────────────────────────────────
function parseArgs(argv) {
  const a = { config: 'config.json', outDir: '.' };
  for (let i = 2; i < argv.length; i++) {
    if (argv[i] === '--config') a.config = argv[++i];
    else if (argv[i] === '--out-dir') a.outDir = argv[++i];
  }
  return a;
}

// ── timing defaults (seconds) — believable thumb-typing pacing ────────────────
const TIMING = {
  start: 0.40,        // first beat
  received_gap: 0.75, // dwell after a received bubble before the next beat
  emoji_gap: 0.55,    // shorter dwell after an emoji-only reaction
  typing_dwell: 1.00, // how long the "…" indicator shows before it swaps to text
  self_pre: 0.30,     // pause before the composer starts typing a sent message
  send_hold: 0.10,    // beat between the composer finishing and the bubble popping
  attach_dwell: 3.60, // let a rich-link / image attachment LAND
  tail_hold: 1.00,    // breathing room at the end before the crossfade to end card
  char_per_sec: 15,   // composer typing speed (chars/sec)
  min_type: 0.50,     // clamp composer typing duration
  max_type: 2.00,
  scroll_ms: 300,     // smooth auto-scroll duration after each beat
  tapback_gap: 0.70,  // dwell after a tapback reaction lands
};

function isEmojiOnly(text) {
  if (!text) return false;
  const s = text.trim();
  if (!s) return false;
  const re = /^(\p{Extended_Pictographic}|\p{Emoji_Presentation}|️|‍|\s)+$/u;
  return re.test(s) && [...new Intl.Segmenter('en', { granularity: 'grapheme' }).segment(s.replace(/\s/g, ''))].length <= 3; // iMessage: 1-3 emoji alone render large
}

// ── build the animation timeline from the thread (one source of truth) ────────
// Rules that mirror a real iMessage exchange:
//   • Received text: pops in on the LEFT (optionally after a "…" typing bubble
//     authored immediately before it from the same sender → typing-swap).
//   • Sent ("self") text: the COMPOSER types it out, then the blue bubble pops on
//     the right + "Delivered". You never see your OWN typing dots, so a self
//     `typing` message is left hidden.
//   • Attachment: pops + a long dwell so a rich-link/image can land.
function buildTimeline(thread, T) {
  const selfIds = new Set((thread.participants || []).filter(p => p.self).map(p => p.id));
  const isSelf = from => selfIds.has(from);
  const msgs = thread.messages || [];
  const TL = [];
  const scrollAfter = t => TL.push({ t: +(t + 0.10).toFixed(2), kind: 'scroll', dur: T.scroll_ms });
  let t = T.start;
  let pendingTyping = null; // { id, from } — a received "…" awaiting its text

  for (let i = 0; i < msgs.length; i++) {
    const m = msgs[i];
    if (m.type === 'typing') {
      if (isSelf(m.from)) continue; // never show your own typing dots — stays hidden
      TL.push({ t: +t.toFixed(2), kind: 'typing-pop', id: m.id });
      scrollAfter(t);
      pendingTyping = { id: m.id, from: m.from };
      t += T.typing_dwell;
      continue;
    }
    if (m.type === 'text') {
      const emoji = isEmojiOnly(m.text);
      if (isSelf(m.from)) {
        t += T.self_pre;
        const dur = Math.min(T.max_type, Math.max(T.min_type, (m.text || '').length / T.char_per_sec));
        TL.push({ t: +t.toFixed(2), kind: 'composer', text: m.text, dur: +dur.toFixed(2) });
        const sendT = t + dur + T.send_hold;
        TL.push({ t: +sendT.toFixed(2), kind: 'pop', id: m.id, sfx: 'send' });
        TL.push({ t: +sendT.toFixed(2), kind: 'composer-clear' });
        scrollAfter(sendT);
        t = sendT + (emoji ? T.emoji_gap : T.received_gap);
      } else {
        if (pendingTyping && pendingTyping.from === m.from) {
          TL.push({ t: +t.toFixed(2), kind: 'typing-swap', id: pendingTyping.id, toId: m.id, sfx: 'receive' });
          pendingTyping = null;
        } else {
          TL.push({ t: +t.toFixed(2), kind: 'pop', id: m.id, sfx: 'receive' });
        }
        scrollAfter(t);
        t += emoji ? T.emoji_gap : T.received_gap;
      }
    } else if (m.type === 'attachment') {
      TL.push({ t: +t.toFixed(2), kind: 'pop', id: m.id, sfx: isSelf(m.from) ? 'send' : 'receive' });
      scrollAfter(t);
      t += T.attach_dwell;
    } else if (m.type === 'tapback') {
      // A reaction lands on an earlier bubble (iOS "tapback"); soft receive sound if it's theirs.
      TL.push({ t: +t.toFixed(2), kind: 'tapback', target: m.target, emoji: m.emoji, self: isSelf(m.from),
                ...(isSelf(m.from) ? {} : { sfx: 'receive', soft: true }) });
      t += T.tapback_gap;
    }
  }
  const total = +(t + T.tail_hold).toFixed(2);
  return { timeline: TL, total };
}

// ── inline local assets as data URIs so setContent has no file deps ───────────
function dataURI(file) {
  const buf = fs.readFileSync(file);
  const ext = path.extname(file).slice(1).toLowerCase();
  const mime = (ext === 'jpg' || ext === 'jpeg') ? 'image/jpeg' : `image/${ext}`;
  return `data:${mime};base64,${buf.toString('base64')}`;
}

function inlineAttachments(thread, baseDir) {
  for (const m of thread.messages || []) {
    if (m.type === 'attachment' && m.src && !m.src.startsWith('data:')) {
      m.src = dataURI(path.resolve(baseDir, m.src));
    }
  }
  return thread;
}

// ── injected style: geometry + background + the rich-link attachment fix ──────
// This is the load-bearing look. The rich-link block turns the mockup's default
// (image + centered caption floating below) into a real iMessage URL preview:
// image with top-rounded corners flush on a gray meta card (bold title + domain
// + chevron). Theme-aware so it reads on dark and light.
function injectedStyle({ zoom, logicalH, theme, bgCss }) {
  const dark = theme !== 'light';
  const metaBg = dark ? '#2c2c2e' : '#e9e9eb';
  const metaTitle = dark ? '#ffffff' : '#000000';
  const metaSub = dark ? '#98989d' : '#6b6b70';
  const chevron = dark ? '#8e8e93' : '#8e8e93';
  const statusColor = dark ? '#fff' : '#000';
  return `
  <style>
    html { zoom: ${zoom}; scroll-behavior: auto; height: ${logicalH}px; }
    body.framed { padding: 0; margin: 0; height: ${logicalH}px; min-height: ${logicalH}px;
      ${bgCss} }
    body.framed .stage { height: 100%; min-height: 100%; }
    body.framed .status-bar { color: ${statusColor}; }
    ${dark ? '' : `body.framed .conv-header .left, body.framed .conv-header .right,
    body.framed .conv-header .left .back-btn, body.framed .conv-header .right .facetime-btn { color: #000; }
    body.framed .conv-header .left .badge-pill, body.framed .conv-header .center .name-pill { background: #E9E9EB; color: #000; }`}
    body.framed .conv-header { min-height: 66px; }
    body.framed .conv-header .center { transform: translate(-50%, -50%); }
    body.framed .conv-header .center .avatar { width: 42px; height: 42px; font-size: 17px; }
    body.framed .conv-header .center .name-pill { font-size: 13px; }
    body.framed .conversation { flex: 1; overflow: hidden;
      justify-content: flex-start; /* iOS: a short thread sits under the header; auto-scroll follows once it fills */ padding: 6px 14px 10px; }

    /* ---- URL-preview rich-link card (the iMsg #1 fix) ---- */
    body.framed .row.attachment { gap: 0; }
    body.framed .row.attachment .attachment-card {
      max-width: 62%; width: 62%; border-radius: 16px 16px 0 0; overflow: hidden; background: ${dark ? '#3a3a3c' : '#f2f2f7'}; /* a cut-out PNG sits on the card, like a real preview */
    }
    body.framed .row.attachment .attachment-card img { max-height: none; display: block; }
    body.framed .row.attachment .attachment-meta {
      max-width: 62%; width: 62%; box-sizing: border-box;
      background: ${metaBg}; border-radius: 0 0 16px 16px;
      padding: 10px 32px 10px 12px; margin-top: 0; text-align: left;
      position: relative; line-height: 1.25;
    }
    body.framed .row.attachment .attachment-meta .title {
      font-size: 13px; font-weight: 600; color: ${metaTitle}; letter-spacing: -0.1px;
    }
    body.framed .row.attachment .attachment-meta .subtitle {
      font-size: 11px; font-weight: 400; color: ${metaSub}; margin-top: 3px; letter-spacing: 0;
    }
    body.framed .row.attachment .attachment-meta::after {
      content: '\\203A'; position: absolute; right: 12px; top: 50%; transform: translateY(-50%);
      font-size: 22px; font-weight: 300; color: ${chevron}; line-height: 1;
    }
    img.ae { width: 1.2em; height: 1.2em; vertical-align: -0.22em; display: inline-block; }
    /* iOS tapback: a round reaction bubble sitting mostly ABOVE the reacted message, on its
       outer top corner (left on your blue bubbles, right on theirs), with a two-dot tail
       pointing down at the message. Theirs is grey, yours is blue. */
    /* Caret sits right after the last typed character, even when the text wraps. */
    .keyboard .input.has-text .caret { display: none; }
    .keyboard .input [data-composer-text]::after { content: ''; display: inline-block; width: 2px; height: 1.15em;
      margin-left: 1px; vertical-align: -0.2em; background: #0a84ff; animation: caret-blink 1s step-end infinite; }
    .tapback { position: absolute; top: -34px; width: 38px; height: 38px; border-radius: 50%;
      display: flex; align-items: center; justify-content: center; z-index: 3;
      box-shadow: 0 0 0 2.5px ${dark ? '#000' : '#fff'};
      animation: bubble-grow 240ms cubic-bezier(0.2,0.8,0.2,1.15) both; }
    .tapback.on-sent { left: -24px; transform-origin: 70% 90%; }
    .tapback.on-received { right: -24px; transform-origin: 30% 90%; }
    .tapback::before, .tapback::after { content: ''; position: absolute; border-radius: 50%;
      background: inherit; box-shadow: 0 0 0 2px ${dark ? '#000' : '#fff'}; }
    .tapback.on-sent::before { width: 9px; height: 9px; right: -1px; bottom: -2px; }
    .tapback.on-sent::after  { width: 4.5px; height: 4.5px; right: -6px; bottom: -7px; }
    .tapback.on-received::before { width: 9px; height: 9px; left: -1px; bottom: -2px; }
    .tapback.on-received::after  { width: 4.5px; height: 4.5px; left: -6px; bottom: -7px; }
    .tapback.theirs { background: ${dark ? '#3a3a3c' : '#e9e9eb'}; }
    .tapback.mine { background: #0a84ff; }
    .tapback img.ae { width: 21px; height: 21px; vertical-align: 0; position: relative; z-index: 1; }
  </style>`;
}

// ── the driver: paced by the timeline, runs inside the recorded page ──────────
function makeDriverScript(timeline, emojiMap = {}) {
  return `
  <script>
  (() => {
    const TIMELINE = ${JSON.stringify(timeline)};
    const EMOJI = ${JSON.stringify(emojiMap)};
    const SEG = new Intl.Segmenter('en', { granularity: 'grapheme' });
    function emojiNode(g) {
      if (!EMOJI[g]) return document.createTextNode(g);
      const img = document.createElement('img');
      img.className = 'ae'; img.alt = g; img.src = EMOJI[g];
      return img;
    }
    function emojify(root) {
      const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
      const nodes = []; while (walker.nextNode()) nodes.push(walker.currentNode);
      for (const n of nodes) {
        const parts = [...SEG.segment(n.nodeValue)].map(x => x.segment);
        if (!parts.some(g => EMOJI[g])) continue;
        const frag = document.createDocumentFragment();
        for (const g of parts) frag.appendChild(emojiNode(g));
        n.replaceWith(frag);
      }
    }
    document.querySelectorAll('.bubble').forEach(emojify);
    const sleep = ms => new Promise(r => setTimeout(r, ms));
    function findRow(id) { return document.querySelector('[data-anim-id="' + id + '"]'); }
    function scroller() { return document.querySelector('.conversation'); }

    const SEND_SVG = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M12 19 V5 M5 12 L12 5 L19 12"/></svg>';
    const MIC_SVG = '<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 14a3 3 0 0 0 3-3V6a3 3 0 0 0-6 0v5a3 3 0 0 0 3 3z"/><path d="M19 11a1 1 0 0 0-2 0 5 5 0 0 1-10 0 1 1 0 0 0-2 0 7 7 0 0 0 6 6.92V20H8a1 1 0 0 0 0 2h8a1 1 0 0 0 0-2h-3v-2.08A7 7 0 0 0 19 11z"/></svg>';

    function popBubble(row) {
      if (!row) return;
      row.removeAttribute('data-pending');
      const b = row.classList.contains('bubble') ? row : row.querySelector('.bubble');
      if (b) { b.classList.remove('pop-pending'); void b.offsetWidth; b.classList.add('pop-now'); }
      const id = row.getAttribute('data-anim-id');
      if (id) {
        const cap = document.querySelector('.delivered-caption[data-cap-id="' + id + '"]');
        if (cap) {
          // Real iMessage shows "Delivered" only under the most recent sent message.
          document.querySelectorAll('.delivered-caption.pop-now').forEach(c => { if (c !== cap) c.style.display = 'none'; });
          cap.removeAttribute('data-pending'); cap.classList.remove('pop-pending'); cap.classList.add('pop-now');
        }
      }
      if (row.classList.contains('row') && row.classList.contains('pop-pending')) {
        row.classList.remove('pop-pending'); row.classList.add('pop-now');
      }
    }

    function swapTyping(typId, textId) {
      const typRow = findRow(typId);
      const textRow = findRow(textId);
      if (!typRow || !textRow) return;
      typRow.style.display = 'none';
      popBubble(textRow);
    }

    function addTapback(ev) {
      const row = findRow(ev.target);
      const b = row && (row.classList.contains('bubble') ? row : row.querySelector('.bubble, .attachment-card'));
      if (!b) return;
      const onSent = row.classList.contains('sent');
      const tb = document.createElement('div');
      tb.className = 'tapback ' + (ev.self ? 'mine' : 'theirs') + (onSent ? ' on-sent' : ' on-received');
      tb.appendChild(emojiNode(ev.emoji));
      b.style.position = 'relative';
      row.style.marginTop = '36px';  // the message steps down to make room, as in Messages
      b.appendChild(tb);
    }

    function smoothScroll(durMs) {
      const sc = scroller();
      if (!sc) return;
      const target = sc.scrollHeight - sc.clientHeight;
      const start = sc.scrollTop;
      if (target <= start + 2) return;
      const t0 = performance.now();
      function tick(t) {
        const p = Math.min(1, (t - t0) / durMs);
        const ease = 1 - Math.pow(1 - p, 3);
        sc.scrollTop = start + (target - start) * ease;
        if (p < 1) requestAnimationFrame(tick);
      }
      requestAnimationFrame(tick);
    }

    function composerSpan() {
      const input = document.querySelector('.keyboard .input');
      if (!input) return null;
      if (!input.querySelector('[data-composer-text]')) {
        input.classList.add('has-text');
        input.innerHTML = '<span class="composer-text" data-composer-text></span>'
          + '<span class="caret"></span>'
          + '<span class="send-btn">' + SEND_SVG + '</span>';
      }
      return input.querySelector('[data-composer-text]');
    }

    async function typeComposer(text, durSec) {
      const span = composerSpan();
      if (!span) return;
      span.textContent = '';
      span.dataset.expect = text;
      // Keystrokes on an absolute schedule that finishes at 90% of the window, with a
      // seeded human rhythm. Cumulative random sleeps used to overrun the send, so a
      // message could leave the composer half typed.
      const graphemes = [...SEG.segment(text)].map(x => x.segment);
      let seed = text.length * 7919;
      const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
      const w = graphemes.map(() => 0.7 + rnd() * 0.6), total = w.reduce((a, b) => a + b, 0);
      const start = performance.now(), span_ms = durSec * 1000 * 0.9;
      let acc = 0;
      for (let i = 0; i < graphemes.length; i++) {
        const due = start + (acc / total) * span_ms; acc += w[i];
        const wait = due - performance.now(); if (wait > 0) await sleep(wait);
        if (!span.isConnected) return;
        span.appendChild(emojiNode(graphemes[i]));
      }
    }

    function clearComposer() {
      const input = document.querySelector('.keyboard .input');
      if (!input) return;
      input.classList.remove('has-text');
      input.innerHTML = '<span class="placeholder">iMessage</span><span class="mic">' + MIC_SVG + '</span>';
    }

    async function run() {
      // Sync marker: the curtain is visible from load until now. The recorder finds the
      // first frame without it and trims there, so video t=0 is exactly this moment.
      const curtain = document.getElementById('__sync');
      if (curtain) curtain.remove();
      const t0 = performance.now();
      for (const ev of TIMELINE) {
        const target = t0 + ev.t * 1000;
        const wait = target - performance.now();
        if (wait > 0) await sleep(wait);
        switch (ev.kind) {
          case 'pop':            popBubble(findRow(ev.id)); break;
          case 'typing-pop':     popBubble(findRow(ev.id)); break;
          case 'typing-swap':    swapTyping(ev.id, ev.toId); break;
          case 'composer':       typeComposer(ev.text, ev.dur); break;
          case 'composer-clear': {
            // What was typed must be exactly what is sent.
            const sp = document.querySelector('[data-composer-text]');
            if (sp && sp.dataset.expect != null) {
              const shown = [...sp.childNodes].map(n => n.nodeType === 3 ? n.nodeValue : (n.alt || '')).join('');
              if (shown !== sp.dataset.expect) (window.__typedMismatch = window.__typedMismatch || []).push([sp.dataset.expect, shown]);
            }
            clearComposer(); break;
          }
          case 'scroll':         smoothScroll(ev.dur); break;
          case 'tapback':        addTapback(ev); break;
          case 'noop':           break;
        }
      }
    }

    const sync = document.createElement('div');
    sync.id = '__sync';
    sync.style.cssText = 'position:fixed;inset:0;background:#ff00ff;z-index:2147483647';
    document.body.appendChild(sync);
    window.__driverReady = true;
    window.__startDriver = run;
  })();
  </script>`;
}

// First frame (at 100 fps) whose centre is no longer the magenta sync curtain.
function findSyncFrame(videoPath) {
  const FPS = 100;
  const buf = execSync(`ffmpeg -v error -i "${videoPath}" -vf "fps=${FPS},scale=4:4" -f rawvideo -pix_fmt rgb24 -`,
    { maxBuffer: 1 << 28 });
  const px = 4 * 4 * 3;
  let seen = false;
  for (let f = 0; f * px < buf.length; f++) {
    const o = f * px + (2 * 4 + 2) * 3;
    const magenta = buf[o] > 200 && buf[o + 1] < 70 && buf[o + 2] > 200;
    if (magenta) seen = true;
    else if (seen) return f / FPS;
  }
  return null;
}

// ── Apple Color Emoji ─────────────────────────────────────────────────────────
// Chromium on Windows/Linux draws Segoe/Noto emoji, an instant "fake" tell. Swap every
// emoji in the thread for Apple's glyph (emoji-datasource-apple PNGs), inlined so the
// page has no network dependency while recording. Cached on disk between runs.
const EMOJI_CDN = 'https://cdn.jsdelivr.net/npm/emoji-datasource-apple@15.1.2/img/apple/64/';
const isPictographic = g => /\p{Extended_Pictographic}|\p{Regional_Indicator}/u.test(g);
async function appleEmojiMap(texts) {
  const seg = new Intl.Segmenter('en', { granularity: 'grapheme' });
  const cacheDir = path.join(os.tmpdir(), 'imsg-apple-emoji');
  fs.mkdirSync(cacheDir, { recursive: true });
  const map = {};
  for (const t of texts) for (const { segment: g } of seg.segment(t || '')) {
    if (map[g] || !isPictographic(g)) continue;
    const full = [...g].map(c => c.codePointAt(0).toString(16)).join('-');
    const names = [full, full.replace(/-fe0f/g, '')];
    for (const n of names) {
      const file = path.join(cacheDir, n + '.png');
      if (!fs.existsSync(file)) {
        const r = await fetch(EMOJI_CDN + n + '.png');
        if (!r.ok) continue;
        fs.writeFileSync(file, Buffer.from(await r.arrayBuffer()));
      }
      map[g] = dataURI(file);
      break;
    }
    if (!map[g]) console.warn(`emoji  ${g} (${full}): no Apple glyph found, system font used`);
  }
  return map;
}

function snapCuesToPicture(cues, mp4) {
  const W = 135, H = 240, FPS = 30;
  const top = Math.round(H * 0.10), bot = Math.round(H * 0.86);   // chat area, not the composer
  const buf = execSync(`ffmpeg -v error -i "${mp4}" -vf "scale=${W}:${H},format=gray" -f rawvideo -`, { maxBuffer: 1 << 30 });
  const n = Math.floor(buf.length / (W * H));
  const diff = new Float64Array(n);
  for (let f = 1; f < n; f++) {
    // Count pixels that changed visibly: a small grey bubble on white moves few levels on
    // average but flips a clear block of pixels.
    let cnt = 0;
    for (let y = top; y < bot; y++) { const o = y * W, a = f * W * H + o, b = (f - 1) * W * H + o;
      for (let x = 0; x < W; x++) if (Math.abs(buf[a + x] - buf[b + x]) > 12) cnt++; }
    diff[f] = cnt;
  }
  const lags = [];
  const out = cues.map(c => {
    const f0 = Math.max(1, Math.round((c.t - 0.05) * FPS)), f1 = Math.min(n - 1, Math.round((c.t + 0.9) * FPS));
    for (let f = f0; f <= f1; f++) if (diff[f] >= 25) {
      const seen = f / FPS - 1 / FPS / 2;          // change first visible between frames f-1 and f
      lags.push(Math.round((seen - c.t) * 1000));
      return { ...c, t: +Math.max(c.t - 0.05, seen).toFixed(3), planned: c.t };
    }
    lags.push(null);
    return c;                                      // nothing detected: keep the planned time
  });
  const found = lags.filter(x => x != null);
  console.log(`sfx  → snapped ${found.length}/${cues.length} cues to the picture; capture lag ${Math.min(...found)}..${Math.max(...found)} ms`);
  // A real-time capture can stall under CPU load and bunch bubbles together. The pacing is
  // the story, so a bubble more than 250 ms off its plan (or not found) means record again.
  const worst = Math.max(...found.map(Math.abs));
  if (found.length < cues.length || worst > 250) {
    console.error(`CAPTURE STALLED: ${cues.length - found.length} cue(s) not seen, worst drift ${worst} ms; re-record.`);
    process.exit(4);
  }
  return out;
}

function buildCueList(timeline) {
  const cues = [];
  for (const ev of timeline) if (ev.sfx) cues.push({ t: ev.t, name: ev.sfx, soft: !!ev.soft });
  return cues;
}

async function main() {
  const args = parseArgs(process.argv);
  const configPath = path.resolve(args.config);
  const cfgDir = path.dirname(configPath);
  const cfg = JSON.parse(fs.readFileSync(configPath, 'utf-8'));

  const OUT_W = cfg.width || 1080;
  const OUT_H = cfg.height || 1920;
  const ZOOM = cfg.zoom || 2.10;
  const theme = cfg.theme === 'light' ? 'light' : 'dark';
  const T = { ...TIMING, ...(cfg.timing || {}) };

  // Load the thread (inline or from a path relative to the config).
  const thread = cfg.thread
    ? JSON.parse(JSON.stringify(cfg.thread))
    : JSON.parse(fs.readFileSync(path.resolve(cfgDir, cfg.thread_path), 'utf-8'));
  thread.theme = theme; // config theme wins
  inlineAttachments(thread, cfgDir);

  // ── authoring guards: fail before recording, not after a bad render ──
  const selfIds = new Set((thread.participants || []).filter(p => p.self).map(p => p.id));
  const problems = [];
  const ids = new Set();
  for (const m of thread.messages || []) {
    if (m.id) { if (ids.has(m.id)) problems.push(`duplicate id ${m.id}`); ids.add(m.id); }
    if (m.text && /[—–]/.test(m.text)) problems.push(`${m.id}: em/en dash in "${m.text}" (nobody texts those)`);
    if (m.type === 'typing' && selfIds.has(m.from)) problems.push(`${m.id}: self typing dots (you never see your own)`);
    if (m.type === 'attachment') {
      if (!m.src) problems.push(`${m.id}: attachment has no src`);
      else if (!m.src.startsWith('data:') && fs.statSync(path.resolve(cfgDir, m.src)).size < 2048)
        problems.push(`${m.id}: ${m.src} is under 2 KB (a git-LFS pointer?)`);
    }
    // Real iMessage marks every sent message Delivered; the driver shows only the newest.
    if (selfIds.has(m.from) && (m.type === 'text' || m.type === 'attachment') && m.delivered !== false) m.delivered = true;
  }
  // Grammar and punctuation: iPhones auto-capitalise and add apostrophes, so correct text is
  // also the realistic text. Fails the render with the exact message and fix.
  const SLANG = { u: 'you', ur: 'your', im: "I'm", dont: "don't", cant: "can't", wont: "won't",
    thats: "that's", whats: "what's", isnt: "isn't", doesnt: "doesn't", didnt: "didn't", ive: "I've",
    youre: "you're", theyre: "they're", tmrw: 'tomorrow', rn: 'right now', ok: 'okay' };
  const ENDS = /([.!?…]|\p{Extended_Pictographic}\uFE0F?|\))$/u;
  const ids2 = new Set((thread.messages || []).map(m => m.id));
  let prevContinues = false;
  for (const m of thread.messages || []) {
    const afterSplit = prevContinues; if (m.type === 'text') prevContinues = !!m.continues;
    if (m.type === 'tapback' && !ids2.has(m.target)) problems.push(`${m.id}: tapback target ${m.target} not found`);
    if (m.type !== 'text' || !m.text || isEmojiOnly(m.text) || m.allow_casual) continue;
    const txt = m.text.trim();
    const first = txt.replace(/^[^\p{L}\p{N}]+/u, '');
    if (!afterSplit && first && /^\p{Ll}/u.test(first) && !/^(iPhone|iMessage|iOS|eBay|iPad)\b/.test(first))
      problems.push(`${m.id}: starts lowercase ("${txt}")`);
    // `continues: true` = the first half of a sentence sent as two bubbles (real texting).
    if (!m.continues && !ENDS.test(txt)) problems.push(`${m.id}: no end punctuation ("${txt}")`);
    for (const w of txt.toLowerCase().match(/[a-z']+/g) || [])
      if (SLANG[w.replace(/'/g, '')] && !w.includes("'") && w !== 'ok') problems.push(`${m.id}: "${w}" -> "${SLANG[w]}"`);
    if (/\bi\b/.test(txt)) problems.push(`${m.id}: lowercase "i"`);
    if (/\s[,.!?]/.test(txt) || /,(?=\S)/.test(txt)) problems.push(`${m.id}: spacing around punctuation ("${txt}")`);
    // Smart Punctuation is on by default on iOS: straight quotes render curly.
    m.text = txt.replace(/(\w)'(\w)/g, '$1\u2019$2').replace(/'/g, '\u2019');
  }
  const nMsgs = (thread.messages || []).filter(m => m.type === 'text' || m.type === 'attachment').length;
  if (problems.length) { console.error('THREAD REJECTED: ' + problems.join(' | ')); process.exit(2); }
  if (nMsgs > 16) console.warn(`warn: ${nMsgs} messages; the format reads best at 10-16 (runtime grows ~1.6 s each)`);

  // Everything starts hidden; the driver pops each piece in on cue.
  for (const m of thread.messages || []) {
    if (m.type === 'text' || m.type === 'typing' || m.type === 'attachment') m.popState = 'pending';
  }
  thread.composer = { text: '' };
  // The status-bar clock matches the conversation ("Today 2:14 AM" -> 2:14), unless set.
  if (!thread.status_time) {
    const ts = (thread.messages || []).find(m => m.type === 'timestamp');
    const hit = ts && /(\d{1,2}:\d{2})/.exec(`${ts.light || ''} ${ts.label || ''}`);
    thread.status_time = hit ? hit[1] : '9:41';
  }

  const { timeline, total } = buildTimeline(thread, T);

  // Background behind the phone: a flat-lay if provided, else a neutral gradient.
  let bgCss;
  if (cfg.background_image) {
    bgCss = `background: url('${dataURI(path.resolve(cfgDir, cfg.background_image))}') center/cover no-repeat;`;
  } else if (theme === 'light') {
    bgCss = `background: radial-gradient(120% 120% at 50% 0%, #f3efe9 0%, #e7e1d7 60%, #d8cfc2 100%);`;
  } else {
    bgCss = `background: radial-gradient(120% 120% at 50% 0%, #2a2a2e 0%, #1a1a1d 55%, #0d0d0f 100%);`;
  }

  const logicalH = Math.round(OUT_H / ZOOM);
  let html = renderHTML(thread, { mode: 'with-iphone-frame' });
  html = html.replace('</head>', injectedStyle({ zoom: ZOOM, logicalH, theme, bgCss }) + '\n</head>');
  html = html.replace('</body>', makeDriverScript(timeline, await appleEmojiMap((thread.messages || []).map(m => m.text || m.emoji || ''))) + '\n</body>');

  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'imessage-chat-'));
  const browser = await chromium.launch();
  // Measure the paint offset: recordVideo starts at newContext(), but the shell
  // paints ~500ms later. We -ss that delta so MP4 t=0 == TIMELINE t=0.
  const ctxCreateTime = Date.now();
  const ctx = await browser.newContext({
    viewport: { width: OUT_W, height: OUT_H },
    deviceScaleFactor: 1,
    recordVideo: { dir: tmpDir, size: { width: OUT_W, height: OUT_H } },
  });
  const page = await ctx.newPage();
  await page.setContent(html, { waitUntil: 'load' });
  await page.waitForFunction(() => window.__driverReady === true, { timeout: 5000 });
  const paintOffsetSec = (Date.now() - ctxCreateTime) / 1000;
  // Hold the sync curtain long enough for the screencast to capture it (it only emits
  // frames on change, so a curtain that lives a few ms never reaches the video).
  // Text-bleed guard: measure every bubble with everything temporarily visible.
  const bleed = await page.evaluate(() => {
    const out = [];
    document.querySelectorAll('.bubble').forEach(b => {
      const row = b.closest('[data-anim-id]');
      const was = row && row.getAttribute('data-pending');
      if (row) row.removeAttribute('data-pending');
      // Compare the TEXT box with the bubble box (scrollWidth also counts the tail pseudo-element).
      const r = document.createRange(); r.selectNodeContents(b);
      const t = r.getBoundingClientRect(), bb = b.getBoundingClientRect();
      const screen = (b.closest('.screen, .iphone, .phone') || document.body).getBoundingClientRect();
      if (t.width && (t.right > bb.right + 1 || t.left < bb.left - 1 || bb.right > screen.right + 1 || bb.left < screen.left - 1))
        out.push((row && row.getAttribute('data-anim-id')) || b.textContent.slice(0, 30));
      if (row && was) row.setAttribute('data-pending', was);
    });
    return out;
  });
  if (bleed.length) { console.error('TEXT BLEED in: ' + bleed.join(', ') + ' (split the line into two bubbles)'); process.exit(3); }
  // Make sure the curtain has actually been painted (two animation frames), then hold it
  // long enough for the screencast to emit frames of it.
  await page.evaluate(() => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r))));
  await page.waitForTimeout(1000);
  await page.evaluate(() => window.__startDriver());
  await page.waitForTimeout(total * 1000);
  const typed = await page.evaluate(() => window.__typedMismatch || []);
  if (typed.length) {
    console.error('TYPED != SENT: ' + typed.map(([want, got]) => `"${got}" was on screen when "${want}" sent`).join(' | '));
    process.exit(6);
  }
  const videoPath = await page.video().path();
  await ctx.close();
  await browser.close();

  const outDir = path.resolve(args.outDir);
  fs.mkdirSync(outDir, { recursive: true });
  const outMp4 = path.join(outDir, 'master-chat.mp4');
  const syncSec = findSyncFrame(videoPath);
  if (syncSec == null) {
    console.error('SYNC MARKER NOT FOUND in the raw capture; refusing to guess (sounds would drift).');
    process.exit(4);
  }
  const startSec = syncSec;
  execSync(
    `ffmpeg -y -ss ${startSec.toFixed(3)} -i "${videoPath}" -t ${total} -r 30 ` +
    `-vf "scale=${OUT_W}:${OUT_H}" -c:v libx264 -pix_fmt yuv420p -movflags +faststart "${outMp4}"`,
    { stdio: 'pipe' }
  );
  // Snap every sound to the frame where its bubble/reaction ACTUALLY appears in the recording.
  // The page fires on time, but the screencast can deliver a small change (a tapback) late,
  // so the timeline alone is not what the viewer sees.
  const cues = snapCuesToPicture(buildCueList(timeline), outMp4);
  fs.writeFileSync(outMp4.replace(/\.mp4$/, '.timeline.json'), JSON.stringify(timeline, null, 1));
  fs.writeFileSync(outMp4.replace(/\.mp4$/, '.sfx.json'), JSON.stringify(cues, null, 2));
  if (process.env.IMSG_KEEP_RAW) console.log(`raw  → ${videoPath}`); else fs.rmSync(tmpDir, { recursive: true, force: true });

  console.log(syncSec != null
    ? `sync: curtain dropped at ${syncSec.toFixed(3)}s in the raw capture (trimmed there)`
    : `sync: marker NOT found, fell back to paint offset ${paintOffsetSec.toFixed(3)}s (SFX may drift)`);
  console.log(`mp4  → ${path.relative(process.cwd(), outMp4)}`);
  console.log(`sfx  → ${cues.length} cues`);
  console.log(`duration → ${total}s`);
}

main().catch(e => { console.error(e); process.exit(1); });

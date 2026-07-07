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
 *     "theme":    "dark" | "light",            // default "dark"
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
};

function isEmojiOnly(text) {
  if (!text) return false;
  const s = text.trim();
  if (!s) return false;
  const re = /^(\p{Extended_Pictographic}|\p{Emoji_Presentation}|️|‍|\s)+$/u;
  return re.test(s) && [...s.replace(/\s/g, '')].length <= 6;
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
    body.framed .conv-header { min-height: 66px; }
    body.framed .conv-header .center { transform: translate(-50%, -50%); }
    body.framed .conv-header .center .avatar { width: 42px; height: 42px; font-size: 17px; }
    body.framed .conv-header .center .name-pill { font-size: 13px; }
    body.framed .conversation { flex: 1; overflow: hidden;
      justify-content: flex-end; padding: 6px 14px 10px; }

    /* ---- URL-preview rich-link card (the iMsg #1 fix) ---- */
    body.framed .row.attachment { gap: 0; }
    body.framed .row.attachment .attachment-card {
      max-width: 62%; border-radius: 16px 16px 0 0; overflow: hidden; background: transparent;
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
  </style>`;
}

// ── the driver: paced by the timeline, runs inside the recorded page ──────────
function makeDriverScript(timeline) {
  return `
  <script>
  (() => {
    const TIMELINE = ${JSON.stringify(timeline)};
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
        if (cap) { cap.removeAttribute('data-pending'); cap.classList.remove('pop-pending'); cap.classList.add('pop-now'); }
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
      const perChar = (durSec * 1000) / Math.max(1, text.length);
      for (const ch of text) {
        span.textContent += ch;
        await sleep(perChar * (0.7 + Math.random() * 0.6));
      }
    }

    function clearComposer() {
      const input = document.querySelector('.keyboard .input');
      if (!input) return;
      input.classList.remove('has-text');
      input.innerHTML = '<span class="placeholder">iMessage</span><span class="mic">' + MIC_SVG + '</span>';
    }

    async function run() {
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
          case 'composer-clear': clearComposer(); break;
          case 'scroll':         smoothScroll(ev.dur); break;
          case 'noop':           break;
        }
      }
    }

    window.__driverReady = true;
    window.__startDriver = run;
  })();
  </script>`;
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

  // Everything starts hidden; the driver pops each piece in on cue.
  for (const m of thread.messages || []) {
    if (m.type === 'text' || m.type === 'typing' || m.type === 'attachment') m.popState = 'pending';
  }
  thread.composer = { text: '' };

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
  html = html.replace('</body>', makeDriverScript(timeline) + '\n</body>');

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
  await page.evaluate(() => window.__startDriver());
  await page.waitForTimeout(total * 1000);
  const videoPath = await page.video().path();
  await ctx.close();
  await browser.close();

  const outDir = path.resolve(args.outDir);
  fs.mkdirSync(outDir, { recursive: true });
  const outMp4 = path.join(outDir, 'master-chat.mp4');
  execSync(
    `ffmpeg -y -ss ${paintOffsetSec.toFixed(3)} -i "${videoPath}" -t ${total} -r 30 ` +
    `-vf "scale=${OUT_W}:${OUT_H}" -c:v libx264 -pix_fmt yuv420p -movflags +faststart "${outMp4}"`,
    { stdio: 'pipe' }
  );
  const cues = buildCueList(timeline);
  fs.writeFileSync(outMp4.replace(/\.mp4$/, '.sfx.json'), JSON.stringify(cues, null, 2));
  fs.rmSync(tmpDir, { recursive: true, force: true });

  console.log(`paint offset: ${paintOffsetSec.toFixed(3)}s (trimmed from MP4 head)`);
  console.log(`mp4  → ${path.relative(process.cwd(), outMp4)}`);
  console.log(`sfx  → ${cues.length} cues`);
  console.log(`duration → ${total}s`);
}

main().catch(e => { console.error(e); process.exit(1); });

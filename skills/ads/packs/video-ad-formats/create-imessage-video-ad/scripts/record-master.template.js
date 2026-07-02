#!/usr/bin/env node
/**
 * record-master.js — record the FULL 22-second iMessage chat as a single
 * continuous Playwright video (no per-scene reloading). Replaces the
 * scene-by-scene approach in build-scenes.js for the master pass.
 *
 * Why: per-scene recording forced a page reload every 2-4s, which caused
 *   - micro-flicker at every cut
 *   - "scrolling" had to be faked by dropping older bubbles between scenes
 *   - SFX cues raced the page-load event
 *
 * One continuous timeline + smooth auto-scroll fixes all three.
 *
 * Output:
 *   ./master-chat.mp4    (raw 720x1280 30fps, no audio)
 *   ./master-chat.sfx.json  (deterministic cue list)
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { chromium } = require('playwright');
// The create-imessage-mockup skill provides the framed-chat renderer (generate.js).
// In the local/BYOA flow it's a SIBLING skill, not a fixed repo path — resolve it
// from MOCKUP_DIR (point it at wherever you fetched/installed create-imessage-mockup;
// run with NODE_PATH=$MOCKUP_DIR/node_modules so Playwright resolves too). Falls back
// to a sibling `create-imessage-mockup/` dir next to this script.
const MOCKUP_DIR =
  process.env.MOCKUP_DIR || path.resolve(__dirname, 'create-imessage-mockup');
const { renderHTML } = require(path.join(MOCKUP_DIR, 'generate.js'));

const VIEW_W = 720;
const VIEW_H = 1280;

// Inline image attachments as data: URIs (same helper as build-scenes.js).
function inlineAttachments(thread, baseDir) {
  for (const m of thread.messages || []) {
    if (m.type === 'attachment' && m.src && !m.src.startsWith('data:')) {
      const abs = path.resolve(baseDir, m.src);
      const buf = fs.readFileSync(abs);
      const ext = path.extname(abs).slice(1).toLowerCase();
      const mime = ext === 'jpg' ? 'image/jpeg' : `image/${ext}`;
      m.src = `data:${mime};base64,${buf.toString('base64')}`;
    }
  }
  return thread;
}

// =============================================================================
// TIMELINE — one source of truth for both recording and SFX cue generation.
// Each event is { t: <seconds>, kind: <type>, data: ... }. Emitted in order.
//
// kinds:
//   'pop'         — pop in a message bubble already in the DOM (by id)
//   'typing-pop'  — pop in a typing-dots bubble (placeholder for upcoming msg)
//   'typing-swap' — replace a typing bubble in-place with the actual text bubble
//   'composer'    — type characters into the composer over `dur` seconds
//   'composer-clear' — wipe composer (e.g. after send)
//   'scroll'      — smooth-scroll conversation to bottom over `dur` ms
// =============================================================================

const TIMELINE = [
  { t: 0.40,  kind: 'pop',          id: 'm01-attach', sfx: null },
  { t: 1.10,  kind: 'pop',          id: 'm02-yo',     sfx: 'send' },
  { t: 1.20,  kind: 'scroll',       dur: 350 },

  { t: 1.95,  kind: 'typing-pop',   id: 'm03-typ',    sfx: null },
  { t: 2.05,  kind: 'scroll',       dur: 280 },
  { t: 2.85,  kind: 'typing-swap',  id: 'm03-typ', toId: 'm04-no',    sfx: 'receive' },
  { t: 2.95,  kind: 'scroll',       dur: 250 },
  { t: 3.30,  kind: 'pop',          id: 'm05-app',    sfx: 'receive' },
  { t: 3.40,  kind: 'scroll',       dur: 220 },

  { t: 4.05,  kind: 'pop',          id: 'm06-yeah',   sfx: 'send' },
  { t: 4.15,  kind: 'scroll',       dur: 250 },

  { t: 4.85,  kind: 'typing-pop',   id: 'm07-typ',    sfx: null },
  { t: 4.95,  kind: 'scroll',       dur: 250 },
  { t: 5.70,  kind: 'typing-swap',  id: 'm07-typ', toId: 'm08-what',  sfx: 'receive' },
  { t: 5.80,  kind: 'scroll',       dur: 250 },

  { t: 6.40,  kind: 'composer',     text: 'cat', dur: 0.30 },
  { t: 6.85,  kind: 'pop',          id: 'm09-cb',     sfx: 'send' },
  { t: 6.85,  kind: 'composer-clear' },
  { t: 6.95,  kind: 'scroll',       dur: 250 },

  { t: 7.55,  kind: 'composer',     text: 'you can build your own', dur: 1.50 },
  { t: 9.20,  kind: 'pop',          id: 'm10-build',  sfx: 'send' },
  { t: 9.20,  kind: 'composer-clear' },
  { t: 9.30,  kind: 'scroll',       dur: 300 },

  { t: 10.05, kind: 'composer',     text: 'then u can', dur: 0.60 },
  { t: 10.85, kind: 'pop',          id: 'm11-ship',   sfx: 'send' },
  { t: 10.85, kind: 'composer-clear' },
  { t: 10.95, kind: 'scroll',       dur: 300 },

  { t: 11.65, kind: 'typing-pop',   id: 'm12-typ',    sfx: null },
  { t: 11.75, kind: 'scroll',       dur: 250 },
  { t: 12.65, kind: 'typing-swap',  id: 'm12-typ', toId: 'm13-ins',   sfx: 'receive' },
  { t: 12.75, kind: 'scroll',       dur: 250 },

  { t: 13.55, kind: 'composer',     text: 'ya use code FREEPA', dur: 1.40 },
  { t: 15.10, kind: 'pop',          id: 'm14-code',   sfx: 'send' },
  { t: 15.10, kind: 'composer-clear' },
  { t: 15.20, kind: 'scroll',       dur: 350 },

  { t: 15.95, kind: 'pop',          id: 'm15-bet',    sfx: 'receive' },
  { t: 16.05, kind: 'scroll',       dur: 250 },

  // Tail: hold for a beat before cutting to the end card.
  { t: 17.00, kind: 'noop' },
];

const TOTAL_DURATION = 17.4; // seconds; end-card is appended downstream

// =============================================================================
// Build the static HTML (full thread, all messages with pop-pending classes).
// Then inject the driver script that walks TIMELINE in real time.
// =============================================================================

function buildFullThread() {
  const fullPath = path.join(__dirname, '..', 'threads', 'full-thread.json');
  const thread = JSON.parse(fs.readFileSync(fullPath, 'utf-8'));
  inlineAttachments(thread, path.dirname(fullPath));
  // Mark every message except the first attachment as pop-pending. The driver
  // unhides them on schedule. The first attachment is also pop-pending (for
  // the 0.4s entrance fade) but conceptually paired with m02-yo as the hook.
  for (const m of thread.messages) {
    if (m.type === 'text' || m.type === 'typing' || m.type === 'attachment') {
      m.popState = 'pending';
    }
  }
  thread.composer = { text: '' };
  return thread;
}

function makeDriverScript() {
  // Embedded as a string so we can inject directly into the page.
  return `
  <script>
  (() => {
    const TIMELINE = ${JSON.stringify(TIMELINE)};
    const sleep = ms => new Promise(r => setTimeout(r, ms));
    function findRow(id) { return document.querySelector('[data-anim-id="' + id + '"]'); }

    function popBubble(row) {
      if (!row) return;
      // Bring the row back into layout (was display:none via data-pending).
      row.removeAttribute('data-pending');
      const b = row.classList.contains('bubble') ? row : row.querySelector('.bubble');
      if (b) {
        b.classList.remove('pop-pending');
        void b.offsetWidth;
        b.classList.add('pop-now');
      }
      // Reveal the matching Delivered caption (sits next to the row).
      const id = row.getAttribute('data-anim-id');
      if (id) {
        const cap = document.querySelector('.delivered-caption[data-cap-id="' + id + '"]');
        if (cap) {
          cap.removeAttribute('data-pending');
          cap.classList.remove('pop-pending');
          cap.classList.add('pop-now');
        }
      }
      // attachment row carries pop-pending on the row itself
      if (row.classList.contains('row') && row.classList.contains('pop-pending')) {
        row.classList.remove('pop-pending');
        row.classList.add('pop-now');
      }
    }

    // Replace a typing-dots bubble with the actual text bubble (in place).
    function swapTyping(typId, textId) {
      const typRow = findRow(typId);
      const textRow = findRow(textId);
      if (!typRow || !textRow) return;
      typRow.style.display = 'none';
      popBubble(textRow);
    }

    function smoothScroll(durMs) {
      const conv = document.querySelector('.conversation');
      if (!conv) return;
      // Use the body/window scroll since stage is the scroll container in our layout.
      const scroller = document.scrollingElement || document.documentElement;
      const target = scroller.scrollHeight - scroller.clientHeight;
      const start = scroller.scrollTop;
      if (target <= start + 2) return;
      const t0 = performance.now();
      function tick(t) {
        const p = Math.min(1, (t - t0) / durMs);
        const ease = 1 - Math.pow(1 - p, 3);
        scroller.scrollTop = start + (target - start) * ease;
        if (p < 1) requestAnimationFrame(tick);
      }
      requestAnimationFrame(tick);
    }

    async function typeComposer(text, durSec) {
      const span = document.querySelector('[data-composer-text]');
      const input = document.querySelector('.keyboard .input');
      if (!span || !input) return;
      input.classList.add('has-text');
      span.textContent = '';
      const perChar = (durSec * 1000) / Math.max(1, text.length);
      for (const ch of text) {
        span.textContent += ch;
        await sleep(perChar * (0.7 + Math.random() * 0.6));
      }
    }

    function clearComposer() {
      const span = document.querySelector('[data-composer-text]');
      const input = document.querySelector('.keyboard .input');
      if (span) span.textContent = '';
      if (input) input.classList.remove('has-text');
    }

    async function run() {
      const t0 = performance.now();
      for (const ev of TIMELINE) {
        const target = t0 + ev.t * 1000;
        const wait = target - performance.now();
        if (wait > 0) await sleep(wait);
        switch (ev.kind) {
          case 'pop':          popBubble(findRow(ev.id)); break;
          case 'typing-pop':   popBubble(findRow(ev.id)); break;
          case 'typing-swap':  swapTyping(ev.id, ev.toId); break;
          case 'composer':     typeComposer(ev.text, ev.dur); break;
          case 'composer-clear': clearComposer(); break;
          case 'scroll':       smoothScroll(ev.dur); break;
          case 'noop':         break;
        }
      }
    }

    // Mark window as ready when the document has loaded so the recorder can
    // start its real-time clock at the right moment.
    window.__driverReady = true;
    window.__startDriver = run;
  })();
  </script>`;
}

// =============================================================================
// Compute SFX cue list from the TIMELINE (deterministic — no race).
// =============================================================================

function buildCueList() {
  const cues = [];
  for (const ev of TIMELINE) {
    if (ev.sfx) cues.push({ t: ev.t, name: ev.sfx, soft: !!ev.soft });
  }
  return cues;
}

// =============================================================================
// Main
// =============================================================================

async function main() {
  const tmpDir = fs.mkdtempSync(path.join(require('os').tmpdir(), 'imessage-master-'));
  const thread = buildFullThread();
  const html = renderHTML(thread, { mode: 'with-keyboard' });
  const driverHtml = html.replace('</body>', makeDriverScript() + '\n</body>');

  // Pin the keyboard so it doesn't scroll out of view as the conversation grows.
  // Do this with an extra <style> tag rather than touching the shared CSS.
  const styleOverride = `
    <style>
      /* Master-recording layout: keyboard fixed bottom, conversation scrolls. */
      body.theme-dark .stage { min-height: 100vh; padding-bottom: 80px; }
      body.theme-dark .keyboard {
        position: fixed; left: 0; right: 0; bottom: 0; z-index: 50;
        background: #000; padding: 10px 12px 14px;
      }
      body.theme-dark .conv-header {
        position: fixed; left: 0; right: 0; top: 0; z-index: 40;
        background: rgba(0,0,0,0.75); backdrop-filter: blur(20px);
        /* Tall enough to contain the avatar(44) + 2px gap + name-pill(~22) stack
           without the avatar getting clipped above the viewport top.
           See SKILL.md > Failure modes > "Receiver avatar clipped at top". */
        min-height: 110px; padding-top: 14px; padding-bottom: 10px;
      }
      body.theme-dark .conv-header .center {
        top: 14px;
        transform: translateX(-50%);  /* anchor from top, not transform centroid */
      }
      body.theme-dark .conv-header .center .avatar {
        width: 44px; height: 44px; font-size: 18px;
      }
      body.theme-dark .conv-header .center .name-pill { font-size: 13px; padding: 2px 8px; }
      body.theme-dark .conv-header .left, body.theme-dark .conv-header .right {
        align-self: flex-start; padding-top: 6px;
      }
      body.theme-dark .conversation { padding-top: 124px; }
      /* Pre-render scroll: no jump, just glide. */
      html { scroll-behavior: auto; }
    </style>
  `;
  const finalHtml = driverHtml.replace('</head>', styleOverride + '\n</head>');

  const browser = await chromium.launch();
  const ctx = await browser.newContext({
    viewport: { width: VIEW_W, height: VIEW_H },
    deviceScaleFactor: 1,
    recordVideo: { dir: tmpDir, size: { width: VIEW_W, height: VIEW_H } },
  });
  const page = await ctx.newPage();
  await page.setContent(finalHtml, { waitUntil: 'load' });
  await page.waitForFunction(() => window.__driverReady === true, { timeout: 5000 });
  // Kick off the timeline NOW; the page-video has already started.
  await page.evaluate(() => window.__startDriver());
  await page.waitForTimeout(TOTAL_DURATION * 1000);
  const videoPath = await page.video().path();
  await ctx.close();
  await browser.close();

  // Convert webm → mp4 at 30fps yuv420p.
  const outMp4 = path.join(__dirname, 'master-chat.mp4');
  execSync(
    `ffmpeg -y -i "${videoPath}" -t ${TOTAL_DURATION} -r 30 ` +
    `-vf "scale=${VIEW_W}:${VIEW_H}" -c:v libx264 -pix_fmt yuv420p -movflags +faststart "${outMp4}"`,
    { stdio: 'pipe' }
  );
  fs.writeFileSync(outMp4.replace(/\.mp4$/, '.sfx.json'), JSON.stringify(buildCueList(), null, 2));
  fs.rmSync(tmpDir, { recursive: true, force: true });
  console.log(`mp4  → ${path.relative(process.cwd(), outMp4)}`);
  console.log(`sfx  → ${buildCueList().length} cues`);
}

main().catch(e => { console.error(e); process.exit(1); });

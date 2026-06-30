#!/usr/bin/env node
/**
 * record-master.js — one-shot Playwright recording of a ChatGPT chat animation.
 *
 * Reads a thread.json + timeline.json, renders the chatgpt-mockup HTML once
 * with everything pre-pending, mounts the keyboard, walks the timeline on
 * requestAnimationFrame inside the page, and records the whole thing as a
 * single continuous video. Also writes a deterministic SFX cue list that
 * stitch.sh consumes.
 *
 * Run from the project root:
 *   NODE_PATH=<repo>/skills/atoms/messaging/create-chatgpt-mockup/node_modules \
 *     node clips/record-master.js
 */

const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

// Walk up from __dirname until we find skills/atoms/messaging/create-chatgpt-mockup.
// Works regardless of whether this file lives in
//   <repo>/clients/<brand>/ads/<video-N>/clips/  (canonical project layout)
// or
//   <repo>/skills/molecules/create-chatgpt-video-ad/examples/<smoke>/clips/  (skill smoke test).
function findAtom(start, atomRel) {
  let dir = start;
  for (let i = 0; i < 12; i++) {
    const candidate = path.join(dir, 'skills/atoms/messaging', atomRel);
    if (fs.existsSync(path.join(candidate, 'generate.js'))) return candidate;
    const parent = path.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  throw new Error(`Could not locate skills/atoms/messaging/${atomRel} from ${start}`);
}
const CHATGPT_MOCKUP = findAtom(__dirname, 'create-chatgpt-mockup');
const { renderHTML } = require(path.join(CHATGPT_MOCKUP, 'generate'));

// ---------------------------------------------------------------------------
// Locate the project (this script is copied into <project>/clips/)
// ---------------------------------------------------------------------------

const PROJECT_DIR = path.resolve(__dirname, '..');
const THREAD_PATH = path.join(PROJECT_DIR, 'thread.json');
const TIMELINE_PATH = path.join(PROJECT_DIR, 'timeline.json');
const OUT_DIR = path.join(PROJECT_DIR, 'clips');
const OUT_VIDEO = path.join(OUT_DIR, 'master-chat.mp4');
const OUT_SFX = path.join(OUT_DIR, 'master-chat.sfx.json');

const VIEWPORT = { width: 750, height: 1624 };  // modern iPhone Pro ~9:19.5
const DEVICE_SCALE = 2;          // 1500×3248 PNG would be heavy as video; 2x is enough
const FPS = 30;

// ---------------------------------------------------------------------------
// Load thread + timeline
// ---------------------------------------------------------------------------

if (!fs.existsSync(THREAD_PATH)) { console.error(`Missing thread.json at ${THREAD_PATH}`); process.exit(1); }
if (!fs.existsSync(TIMELINE_PATH)) { console.error(`Missing timeline.json at ${TIMELINE_PATH}`); process.exit(1); }

const thread = JSON.parse(fs.readFileSync(THREAD_PATH, 'utf-8'));
const timeline = JSON.parse(fs.readFileSync(TIMELINE_PATH, 'utf-8'));

// Force every message that isn't already 'now' into the 'pending' state, so
// the page renders with all bubbles hidden. The driver pops them.
for (const m of (thread.messages || [])) {
  if (!m.popState) m.popState = 'pending';
}

// Default keyboard state to hidden if a `keyboard` block is present.
if (thread.keyboard && !thread.keyboard.state) thread.keyboard.state = 'hidden';

// ---------------------------------------------------------------------------
// Derive the deterministic SFX cue list from the timeline
// ---------------------------------------------------------------------------

function deriveSFX(timeline) {
  const cues = [];
  for (const ev of timeline) {
    if (ev.kind === 'send-tap') {
      cues.push({ t: ev.t, sfx: 'send-tap' });
    } else if (ev.kind === 'composer-type') {
      // One key-tap per word boundary (space) — quieter than per-char.
      const text = ev.text || '';
      const dur = ev.dur_sec || 1;
      const words = text.split(/\s+/).filter(Boolean);
      const perWord = dur / Math.max(words.length, 1);
      let consumed = 0;
      // Tap on the first char of each word
      for (let i = 0; i < words.length; i++) {
        cues.push({ t: +(ev.t + i * perWord).toFixed(3), sfx: 'key-tap' });
        consumed += words[i].length;
      }
    } else if (ev.kind === 'stream-words') {
      // Stream-tick every 12 words; response-done at end.
      const wps = ev.wps || 7;
      const dur = ev.dur_sec || 6;
      const totalWords = Math.round(wps * dur);
      const perWord = 1 / wps;
      for (let i = 12; i < totalWords; i += 12) {
        cues.push({ t: +(ev.t + i * perWord).toFixed(3), sfx: 'stream-tick' });
      }
      cues.push({ t: +(ev.t + dur + 0.05).toFixed(3), sfx: 'response-done' });
    }
  }
  cues.sort((a, b) => a.t - b.t);
  return cues;
}

// ---------------------------------------------------------------------------
// Style override for animation mode (the atom's css has the building blocks
// but we want a slightly tweaked composer-up offset when the keyboard is
// shown — done here so we don't have to edit the atom for project-specific
// tuning).
// ---------------------------------------------------------------------------

const styleOverride = `
  /* Soft fade on assistant pop so it doesn't snap when streaming begins. */
  .row.assistant.pop-now { animation-duration: 280ms; }
`;

// ---------------------------------------------------------------------------
// The driver — runs INSIDE the page on requestAnimationFrame
// ---------------------------------------------------------------------------

function driverFnSource() {
  // This function is serialized into the page. Keep it self-contained, no
  // require()s. The TIMELINE is injected as window.__TIMELINE__.
  return function runDriver() {
    const TL = window.__TIMELINE__ || [];
    const t0 = performance.now();
    const stage = document.querySelector('.stage');
    const composerInput = document.querySelector('.composer .input');
    const sendBtn = document.querySelector('.composer .send-btn');
    const header = document.querySelector('.gpt-header .right');
    const kb = document.querySelector('.kbd');

    function setComposerText(text) {
      if (!composerInput) return;
      const ct = composerInput.querySelector('.composer-text');
      const ph = composerInput.querySelector('.placeholder');
      if (ph) ph.style.display = text ? 'none' : '';
      if (ct) {
        ct.textContent = text;
        ct.style.display = text ? '' : 'none';
      } else if (text) {
        const span = document.createElement('span');
        span.className = 'composer-text';
        span.textContent = text;
        composerInput.insertBefore(span, composerInput.firstChild);
      }
      // Ensure caret exists when there's text
      let caret = composerInput.querySelector('.caret');
      if (text && !caret) {
        caret = document.createElement('span');
        caret.className = 'caret';
        composerInput.appendChild(caret);
      } else if (!text && caret) {
        caret.remove();
      }
      // Send button activates when there's text
      if (sendBtn) {
        sendBtn.classList.toggle('active', !!text);
      }
    }

    function setSendState(state) {
      if (!sendBtn) return;
      sendBtn.classList.remove('active', 'streaming');
      if (state === 'active' || state === 'streaming') {
        sendBtn.classList.add(state);
      }
      // Swap icon when streaming/active
      const arrow = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M12 19 V5 M5 12 L12 5 L19 12"/></svg>`;
      const stop = `<svg width="18" height="18" viewBox="0 0 14 14" fill="#FFFFFF"><rect x="2" y="2" width="10" height="10" rx="1.5"/></svg>`;
      sendBtn.innerHTML = state === 'streaming' ? stop : arrow;
    }

    function popRow(id) {
      const row = document.querySelector(`[data-anim-id="${id}"]`);
      if (!row) return;
      row.removeAttribute('data-pending');
      row.classList.add('pop-now');
    }
    function hideRow(id) {
      const row = document.querySelector(`[data-anim-id="${id}"]`);
      if (!row) return;
      row.setAttribute('data-pending', '1');
      row.classList.remove('pop-now');
    }

    function streamWords(id, dur_sec, wps, startedAt) {
      const row = document.querySelector(`[data-anim-id="${id}"]`);
      if (!row) return null;
      const words = Array.from(row.querySelectorAll('.word[data-stream="0"]'));
      const total = words.length;
      const totalDurMs = dur_sec * 1000;
      // Pre-compute reveal times: linear with a slight ease so the start
      // doesn't feel mechanical. (Real ChatGPT varies a touch.)
      const revealAt = words.map((_, i) => (i / total) * totalDurMs);
      return { row, words, revealAt, startedAt, total, done: 0 };
    }

    function smoothScrollTo(targetY, dur_ms) {
      const start = window.scrollY;
      const delta = targetY - start;
      const t0scroll = performance.now();
      function step(now) {
        const p = Math.min(1, (now - t0scroll) / dur_ms);
        const ease = 0.5 - 0.5 * Math.cos(Math.PI * p);
        window.scrollTo(0, start + delta * ease);
        if (p < 1) requestAnimationFrame(step);
      }
      requestAnimationFrame(step);
    }

    // Composer typing — schedules per-char appearance
    const typingJobs = [];
    function startTyping(text, dur_sec, startedAt) {
      typingJobs.push({ text, dur_sec, startedAt, lastIdx: 0 });
    }

    const streamJobs = [];
    let cursor = 0;

    function tick(now) {
      const t = (now - t0) / 1000;

      // Run scheduled events
      while (cursor < TL.length && TL[cursor].t <= t) {
        const ev = TL[cursor++];
        switch (ev.kind) {
          case 'composer-type':
            startTyping(ev.text, ev.dur_sec || 2, now);
            break;
          case 'composer-clear':
            setComposerText('');
            break;
          case 'send-tap': {
            if (sendBtn) {
              sendBtn.style.transformOrigin = 'center';
              sendBtn.animate(
                [{ transform: 'scale(0.86)' }, { transform: 'scale(1.0)' }],
                { duration: 140, easing: 'cubic-bezier(0.2,0.7,0.2,1)' }
              );
            }
            break;
          }
          case 'pop':
            popRow(ev.target);
            break;
          case 'header-swap':
            if (header) header.setAttribute('data-active', ev.value || 'alt');
            break;
          case 'keyboard-show':
            if (kb) kb.setAttribute('data-state', 'shown');
            if (stage) stage.setAttribute('data-keyboard-shown', '1');
            break;
          case 'keyboard-hide':
            if (kb) kb.setAttribute('data-state', 'hidden');
            if (stage) stage.removeAttribute('data-keyboard-shown');
            break;
          case 'loading-dot-show':
            popRow(ev.target);
            break;
          case 'loading-dot-hide':
            hideRow(ev.target);
            break;
          case 'send-state':
            setSendState(ev.value);
            break;
          case 'stream-words': {
            const j = streamWords(ev.target, ev.dur_sec || 6, ev.wps || 7, now);
            if (j) streamJobs.push(j);
            break;
          }
          case 'scroll-to': {
            const row = document.querySelector(`[data-anim-id="${ev.target}"]`);
            if (row) {
              const rect = row.getBoundingClientRect();
              const bottomMargin = 200; // leave room above the composer
              const targetY = window.scrollY + rect.bottom - (window.innerHeight - bottomMargin);
              smoothScrollTo(Math.max(0, targetY), ev.dur_ms || 250);
            }
            break;
          }
        }
      }

      // Drive any active typing jobs
      for (const job of typingJobs) {
        const elapsed = (now - job.startedAt) / 1000;
        const targetIdx = Math.min(job.text.length, Math.floor((elapsed / job.dur_sec) * job.text.length));
        if (targetIdx !== job.lastIdx) {
          setComposerText(job.text.slice(0, targetIdx));
          job.lastIdx = targetIdx;
        }
      }

      // Drive any active streaming jobs
      for (const job of streamJobs) {
        const elapsed = now - job.startedAt;
        while (job.done < job.total && job.revealAt[job.done] <= elapsed) {
          job.words[job.done].setAttribute('data-stream', '1');
          job.done++;
        }
        // Once 80% revealed, kick a scroll-to so the rest stays in view
        if (job.done === Math.floor(job.total * 0.5) && !job.midScroll) {
          job.midScroll = true;
          const rect = job.row.getBoundingClientRect();
          const targetY = window.scrollY + rect.bottom - (window.innerHeight - 200);
          smoothScrollTo(Math.max(0, targetY), 350);
        }
      }

      // Tell the host page we're past the last event + a 1.2s tail
      const lastT = TL.length ? TL[TL.length - 1].t : 0;
      if (t > lastT + 1.5) {
        window.__DONE__ = true;
        return;
      }

      requestAnimationFrame(tick);
    }

    requestAnimationFrame(tick);
  };
}

// ---------------------------------------------------------------------------
// Recording orchestration
// ---------------------------------------------------------------------------

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });

  // 1) Write an empty SFX cue list. The molecule currently ships silent —
  // the wavs in assets/sfx/ are retained for future use, but no cues fire.
  // (Remove this block and uncomment the deriveSFX call to re-enable.)
  fs.writeFileSync(OUT_SFX, JSON.stringify({ cues: [] }, null, 2));
  console.log(`SFX cues  → ${OUT_SFX} (0 cues — molecule ships silent)`);

  // 2) Generate the page HTML
  let html = renderHTML(thread);
  // Inject the style override + the timeline + the driver bootstrap
  const lastT = timeline.length ? timeline[timeline.length - 1].t : 0;
  const totalDurMs = Math.round((lastT + 1.6) * 1000);
  const driverFn = `(${driverFnSource().toString()})();`;
  html = html.replace(
    '</head>',
    `<style>${styleOverride}</style>
<script>window.__TIMELINE__ = ${JSON.stringify(timeline)};
window.__DONE__ = false;
window.__START_DRIVER__ = function () { ${driverFn} };
</script></head>`
  );

  const pagePath = path.join(OUT_DIR, 'master-chat.page.html');
  fs.writeFileSync(pagePath, html);
  console.log(`Page HTML → ${pagePath}`);

  // 3) Boot Playwright with screen recording enabled
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({
    viewport: VIEWPORT,
    deviceScaleFactor: DEVICE_SCALE,
    recordVideo: {
      dir: OUT_DIR,
      size: { width: VIEWPORT.width, height: VIEWPORT.height },
    },
  });
  const page = await ctx.newPage();
  await page.goto(`file://${pagePath}`, { waitUntil: 'load' });
  await page.waitForTimeout(300);

  // 4) Boot the driver from the host side (page-side listener is unreliable
  // because the load event has already fired by the time goto resolves).
  await page.evaluate(() => window.__START_DRIVER__ && window.__START_DRIVER__());

  // 5) Wait for the driver to flag done
  await page.waitForFunction(() => window.__DONE__ === true, { timeout: totalDurMs + 5000, polling: 100 });

  // 5) Close everything to flush the recording
  const video = page.video();
  await page.close();
  await ctx.close();
  await browser.close();
  if (!video) { console.error('No video recorded'); process.exit(1); }
  const raw = await video.path();

  // 6) Convert to h.264 mp4 at 30fps (Playwright writes webm by default)
  const { execSync } = require('child_process');
  execSync(
    `ffmpeg -y -i "${raw}" -r ${FPS} -c:v libx264 -pix_fmt yuv420p -movflags +faststart -an "${OUT_VIDEO}"`,
    { stdio: 'inherit' }
  );
  // Clean up the raw webm
  fs.unlinkSync(raw);
  console.log(`\n✓ ${OUT_VIDEO}`);
}

main().catch(err => {
  console.error('Record failed:', err.message);
  console.error(err.stack);
  process.exit(1);
});

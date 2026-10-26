#!/usr/bin/env node
/**
 * record-chat.js — one-shot Playwright recording of a ChatGPT chat-reveal
 * animation, as a single continuous MP4. The ChatGPT sibling of
 * render-imessage-chat's record-chat.js.
 *
 * Renders the bundled create-chatgpt-mockup HTML once with every message
 * pre-pending, mounts the iOS keyboard, then walks a timeline on
 * requestAnimationFrame INSIDE the page (user types in the composer → tap send
 * → keyboard slides down + header cluster swaps in one beat → one gray loading
 * dot → assistant answer streams in word-by-word). The whole thing is captured
 * as ONE Playwright recording — never scene-by-scene (every reload flickers).
 *
 * Portable: everything it needs (the chatgpt-mockup generator + templates) is
 * bundled under ./mockup, so it runs unchanged from a fetched
 * /tmp/gooseworks-scripts/render-chatgpt-chat/scripts/ checkout. No repo-relative
 * or /Users paths.
 *
 * Output: <out-dir>/master-chat.mp4  +  <out-dir>/master-chat.sfx.json
 *
 * Usage:
 *   npm install                       # once, in this scripts/ folder (Playwright)
 *   node record-chat.js --config config.json [--out-dir .]
 *
 * config.json shape (see config.example.json):
 *   {
 *     "thread":   { ...chatgpt thread JSON },   // or "thread_path"
 *     "timeline": [ ...timeline events ],       // or "timeline_path"
 *     "sfx":   true,                            // derive subliminal SFX cues (default true)
 *     "width": 750, "height": 1624              // output geometry (defaults — modern iPhone Pro ~9:19.5)
 *   }
 * Relative *_path values resolve against the config file's directory.
 */

const fs = require('fs');
const path = require('path');
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

// ── deterministic SFX cue list (subliminal — see SKILL.md "SFX are felt") ─────
// One key-tap per word while typing, send-tap on the tap, stream-tick every 12
// words while streaming, response-done after the last word. Levels are applied
// per-name in stitch.sh; there is NEVER a cue on the loading dot.
function deriveSFX(timeline) {
  const cues = [];
  for (const ev of timeline) {
    if (ev.kind === 'send-tap') {
      cues.push({ t: +ev.t.toFixed(3), name: 'send-tap' });
    } else if (ev.kind === 'composer-type') {
      const words = String(ev.text || '').split(/\s+/).filter(Boolean);
      const dur = ev.dur_sec || 1;
      const perWord = dur / Math.max(words.length, 1);
      for (let i = 0; i < words.length; i++) {
        cues.push({ t: +(ev.t + i * perWord).toFixed(3), name: 'key-tap' });
      }
    } else if (ev.kind === 'stream-words') {
      const wps = ev.wps || 7;
      const dur = ev.dur_sec || 6;
      const totalWords = Math.round(wps * dur);
      const perWord = 1 / wps;
      for (let i = 12; i < totalWords; i += 12) {
        cues.push({ t: +(ev.t + i * perWord).toFixed(3), name: 'stream-tick' });
      }
      cues.push({ t: +(ev.t + dur + 0.05).toFixed(3), name: 'response-done' });
    }
  }
  cues.sort((a, b) => a.t - b.t);
  return cues;
}

// ── the driver — runs INSIDE the page on requestAnimationFrame ────────────────
// Serialized into the page; keep it self-contained (no require()s). The
// timeline is injected as window.__TIMELINE__.
function driverFnSource() {
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
      let caret = composerInput.querySelector('.caret');
      if (text && !caret) {
        caret = document.createElement('span');
        caret.className = 'caret';
        composerInput.appendChild(caret);
      } else if (!text && caret) {
        caret.remove();
      }
      if (sendBtn) sendBtn.classList.toggle('active', !!text);
    }

    function setSendState(state) {
      if (!sendBtn) return;
      sendBtn.classList.remove('active', 'streaming');
      if (state === 'active' || state === 'streaming') sendBtn.classList.add(state);
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

    const typingJobs = [];
    function startTyping(text, dur_sec, startedAt) {
      typingJobs.push({ text, dur_sec, startedAt, lastIdx: 0 });
    }

    const streamJobs = [];
    let cursor = 0;

    function tick(now) {
      const t = (now - t0) / 1000;

      while (cursor < TL.length && TL[cursor].t <= t) {
        const ev = TL[cursor++];
        switch (ev.kind) {
          case 'composer-type':
            startTyping(ev.text, ev.dur_sec || 2, now);
            break;
          case 'composer-clear':
            setComposerText('');
            break;
          case 'send-tap':
            if (sendBtn) {
              sendBtn.style.transformOrigin = 'center';
              sendBtn.animate(
                [{ transform: 'scale(0.86)' }, { transform: 'scale(1.0)' }],
                { duration: 140, easing: 'cubic-bezier(0.2,0.7,0.2,1)' }
              );
            }
            break;
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
              const bottomMargin = 200;
              const targetY = window.scrollY + rect.bottom - (window.innerHeight - bottomMargin);
              smoothScrollTo(Math.max(0, targetY), ev.dur_ms || 250);
            }
            break;
          }
        }
      }

      for (const job of typingJobs) {
        const elapsed = (now - job.startedAt) / 1000;
        const targetIdx = Math.min(job.text.length, Math.floor((elapsed / job.dur_sec) * job.text.length));
        if (targetIdx !== job.lastIdx) {
          setComposerText(job.text.slice(0, targetIdx));
          job.lastIdx = targetIdx;
        }
      }

      for (const job of streamJobs) {
        const elapsed = now - job.startedAt;
        while (job.done < job.total && job.revealAt[job.done] <= elapsed) {
          job.words[job.done].setAttribute('data-stream', '1');
          job.done++;
        }
        if (job.done === Math.floor(job.total * 0.5) && !job.midScroll) {
          job.midScroll = true;
          const rect = job.row.getBoundingClientRect();
          const targetY = window.scrollY + rect.bottom - (window.innerHeight - 200);
          smoothScrollTo(Math.max(0, targetY), 350);
        }
      }

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

// ── main ──────────────────────────────────────────────────────────────────────
const styleOverride = `
  /* Soft fade on assistant pop so it doesn't snap when streaming begins. */
  .row.assistant.pop-now { animation-duration: 280ms; }
`;

async function main() {
  const args = parseArgs(process.argv);
  const configPath = path.resolve(args.config);
  const cfgDir = path.dirname(configPath);
  const cfg = JSON.parse(fs.readFileSync(configPath, 'utf-8'));

  const resolveMaybe = (inline, rel) => {
    if (inline != null) return inline;
    if (rel) return JSON.parse(fs.readFileSync(path.resolve(cfgDir, rel), 'utf-8'));
    return null;
  };
  const thread = resolveMaybe(cfg.thread, cfg.thread_path);
  const timeline = resolveMaybe(cfg.timeline, cfg.timeline_path);
  if (!thread || !Array.isArray(timeline)) {
    console.error('config must supply `thread` (+ `timeline`) inline or via *_path');
    process.exit(1);
  }

  // Force every non-'now' message into 'pending' so the page renders hidden.
  for (const m of (thread.messages || [])) {
    if (!m.popState) m.popState = 'pending';
  }
  // Keyboard defaults to hidden if present (the timeline slides it up).
  if (thread.keyboard && !thread.keyboard.state) thread.keyboard.state = 'hidden';

  const VIEWPORT = { width: cfg.width || 750, height: cfg.height || 1624 };
  const DEVICE_SCALE = 2;
  const FPS = 30;

  const outDir = path.resolve(args.outDir);
  fs.mkdirSync(outDir, { recursive: true });
  const OUT_VIDEO = path.join(outDir, 'master-chat.mp4');
  const OUT_SFX = path.join(outDir, 'master-chat.sfx.json');
  const OUT_PAGE = path.join(outDir, 'master-chat.page.html');

  // 1) SFX cue list. Default: derive the subliminal cues from the timeline.
  //    Set `"sfx": false` in config to ship the chat silent.
  const cues = cfg.sfx === false ? [] : deriveSFX(timeline);
  fs.writeFileSync(OUT_SFX, JSON.stringify({ cues }, null, 2));
  console.log(`SFX cues  → ${OUT_SFX} (${cues.length} cues${cfg.sfx === false ? ' — silent' : ''})`);

  // 2) Render the page HTML once, inject the timeline + driver.
  let html = renderHTML(thread);
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
  fs.writeFileSync(OUT_PAGE, html);
  console.log(`Page HTML → ${OUT_PAGE}`);

  // 3) Boot Playwright with screen recording enabled.
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({
    viewport: VIEWPORT,
    deviceScaleFactor: DEVICE_SCALE,
    recordVideo: { dir: outDir, size: { width: VIEWPORT.width, height: VIEWPORT.height } },
  });
  const page = await ctx.newPage();
  await page.goto(`file://${OUT_PAGE}`, { waitUntil: 'load' });
  await page.waitForTimeout(300);

  // 4) Boot the driver from the host side (the load event fired before goto resolved).
  await page.evaluate(() => window.__START_DRIVER__ && window.__START_DRIVER__());

  // 5) Wait for the driver to flag done, then flush the recording.
  await page.waitForFunction(() => window.__DONE__ === true, { timeout: totalDurMs + 5000, polling: 100 });
  const video = page.video();
  await page.close();
  await ctx.close();
  await browser.close();
  if (!video) { console.error('No video recorded'); process.exit(1); }
  const raw = await video.path();

  // 6) Transcode Playwright's webm → h.264 mp4 at 30fps, silent.
  execSync(
    `ffmpeg -y -i "${raw}" -r ${FPS} -c:v libx264 -pix_fmt yuv420p -movflags +faststart -an "${OUT_VIDEO}"`,
    { stdio: 'inherit' }
  );
  fs.unlinkSync(raw);
  console.log(`\n✓ ${OUT_VIDEO}`);
}

main().catch(err => {
  console.error('Record failed:', err.message);
  console.error(err.stack);
  process.exit(1);
});

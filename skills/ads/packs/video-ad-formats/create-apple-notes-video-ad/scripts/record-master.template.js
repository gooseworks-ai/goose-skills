#!/usr/bin/env node
/**
 * record-master.js — record the Apple Notes typing animation as a single
 * continuous Playwright video (no per-scene reloads).
 *
 * Architecture mirrors create-imessage-video-ad's record-master template:
 *   - render the FULL note HTML once (atom: create-apple-notes-mockup)
 *   - pre-render pre_typed_body as visible paragraphs at t=0
 *   - pre-render typed_body paragraphs with data-pending="1" (display:none)
 *     so they reveal one character at a time
 *   - driver script walks a precomputed TIMING_TABLE on requestAnimationFrame
 *     and appends one character at a time; the yellow cursor follows
 *   - SFX cue list is computed deterministically from the same table
 *     (no per-keystroke timing race with setContent's load event)
 *
 * Output (next to this script):
 *   ./master-typing.mp4       (1180×2556 30fps, no audio)
 *   ./master-typing.sfx.json  (deterministic cue list, one entry per keystroke)
 *
 * Usage:
 *   NODE_PATH=<repo>/skills/atoms/messaging/create-apple-notes-mockup/node_modules \
 *     node clips/record-master.js
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { chromium } = require('playwright');


// Path to the create-apple-notes-mockup atom's generate.js.
//
// First try a standard ad layout (<brand>/ads/video-NN-<slug>/clips/record-master.js
// → up 4 to repo root). If that fails, walk up looking for the skills/ tree.
function resolveAtomGenerate() {
  const rel = '../../../../skills/atoms/messaging/create-apple-notes-mockup/generate.js';
  const stdGuess = path.resolve(__dirname, rel);
  if (fs.existsSync(stdGuess)) return stdGuess;
  let dir = __dirname;
  for (let hop = 0; hop < 8; hop++) {
    const cand = path.join(dir, 'skills/atoms/messaging/create-apple-notes-mockup/generate.js');
    if (fs.existsSync(cand)) return cand;
    const parent = path.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  throw new Error('cannot locate create-apple-notes-mockup/generate.js — set the relative path manually in record-master.js');
}
const { generateHtml } = require(resolveAtomGenerate());

// Canvas dimensions. 1180×2100 is a 9:16-ish ratio (close to 1080×1920 exactly)
// so the molecule produces social-ready video natively without any vertical
// crop. The keyboard's `bottom: 0` anchors to this shorter canvas, moving the
// whole keyboard up by ~460px vs the iPhone's true 19.5:9 screen.
const VIEW_W = 1180;
const VIEW_H = 2100;
const FPS = 30;

// =============================================================================
// Read the canonical spec from the ad folder's note.json.
// =============================================================================

function loadSpec() {
  const specPath = path.join(__dirname, '..', 'notes', 'note.json');
  return JSON.parse(fs.readFileSync(specPath, 'utf-8'));
}

// =============================================================================
// Build the timing table.
// One entry per character to be typed in the typed_body. Times are absolute
// seconds from t=0. The driver and the SFX builder both walk this same table.
//
// Per-character cadence comes from a seeded LCG so the same spec always
// produces the same audio cue list. Avg = type_seconds / chars. Jitter is
// ±35% so the typing feels human.
// =============================================================================

function seededRng(seed) {
  let s = (seed >>> 0) || 1;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return (s & 0x7fffffff) / 0x7fffffff;
  };
}

function buildTimingTable(spec) {
  const rng = seededRng(0xa5b1c2d3);
  const events = [];
  let t = 0.30; // small lead-in before any typing starts (~9 frames)
  spec.typed_body.forEach((para, pi) => {
    t += para.pre_pause_seconds || 0.6;
    const text = String(para.text || '');
    const n = Math.max(1, text.length);
    const avg = (para.type_seconds || (n * 0.07)) / n;
    let i = 0;
    while (i < text.length) {
      // Jittered per-char step: avg * (0.65 .. 1.35).
      const step = avg * (0.65 + rng() * 0.70);
      t += step;
      const ch = text[i];
      // Classify the keystroke for SFX selection.
      let kind = 'letter';
      if (ch === ' ') kind = 'space';
      else if (ch === '.' || ch === ',' || ch === '?' || ch === '!' || ch === "'") kind = 'punct';
      events.push({ t: +t.toFixed(4), pid: `tp${pi}`, idx: i, ch, kind, kind_evt: 'type' });
      i += 1;
    }
    // After last char of a paragraph, fire a "return" beat unless this is the
    // last paragraph (cursor stays parked at the end of the final paragraph).
    if (pi < spec.typed_body.length - 1) {
      t += 0.18;
      events.push({ t: +t.toFixed(4), pid: `tp${pi}`, kind: 'return', kind_evt: 'return' });
    }
  });
  const total = t + (spec.post_hold_seconds || 1.0);
  return { events, total };
}

// =============================================================================
// Build the initial HTML state.
// pre_typed_body paragraphs render with their text visible at t=0.
// typed_body paragraphs render with an empty visible text node + a
// data-target-text attribute holding the full string; the driver fills them in.
// The yellow cursor is positioned at the end of the currently-active paragraph.
// =============================================================================

function buildInitialSpec(spec) {
  // Compose the spec passed to the atom's generateHtml().
  const body = [];
  for (const p of (spec.pre_typed_body || [])) {
    body.push({ type: 'paragraph', text: p.text || '' });
  }
  // Each typed paragraph starts empty. The driver fills it in.
  spec.typed_body.forEach((p, i) => {
    body.push({
      type: 'paragraph',
      text: '',
      _typed_pid: `tp${i}`,
      _typed_target: p.text,
      _typed_underline: p.autocorrect_underline || [],
    });
  });
  return {
    title: spec.title || 'Hello',
    body,
    cursor: 'end',
    autocorrect_underline: [],
    status_bar: spec.status_bar || { time: '9:41' },
    show_keyboard: true,
    keyboard_state: spec.keyboard_state || { suggestions: ['See', 'Let', 'I'], shift: 'upper' },
    with_iphone_frame: false,
  };
}

// =============================================================================
// Post-process the generated HTML: tag the typed paragraphs with their pid
// + target text so the driver can find and fill them. We do this by finding
// the placeholder paragraphs (last N) and rewriting them with our attributes.
//
// We use a small marker character (U+2063 invisible separator) we slipped
// in via _typed_pid to identify which paragraphs were the typed ones.
// Simpler: we just count from the end of the body, since pre_typed comes first.
// =============================================================================

function tagTypedParagraphs(html, spec) {
  // Regex-walk all .note-paragraph nodes and add data attributes to the last N.
  const typed = spec.typed_body || [];
  // Split the HTML into all <p class="note-paragraph">...</p> nodes, then
  // identify the last `typed.length` and rewrite them.
  const re = /<p class="note-paragraph">([\s\S]*?)<\/p>/g;
  const matches = [];
  let m;
  while ((m = re.exec(html))) {
    matches.push({ start: m.index, end: re.lastIndex, raw: m[0], inner: m[1] });
  }
  const N = typed.length;
  if (matches.length < N) {
    throw new Error(`expected ≥${N} body paragraphs but found ${matches.length}`);
  }
  // Walk from the end and rewrite. Apply edits in reverse so offsets stay valid.
  const typedTail = matches.slice(matches.length - N);
  let out = html;
  for (let i = typedTail.length - 1; i >= 0; i--) {
    const node = typedTail[i];
    const t = typed[i];
    const pid = `tp${i}`;
    // Replace the paragraph with one that has data-typed-pid + data-target-text
    // and starts with an empty span the driver appends to.
    const targetEsc = (t.text || '')
      .replace(/&/g, '&amp;')
      .replace(/"/g, '&quot;');
    const replacement =
      `<p class="note-paragraph" data-typed-pid="${pid}" data-target-text="${targetEsc}" data-pending-newline="${i < N - 1 ? '1' : '0'}">` +
      `<span class="typed"></span>` +
      `<span class="cursor" data-cursor-for="${pid}" style="display:none"></span>` +
      `</p>`;
    out = out.slice(0, node.start) + replacement + out.slice(node.end);
  }
  // Also drop the existing cursor that was added at end of last pre_typed by
  // the atom (cursor: "end"). The driver will manage cursor visibility.
  out = out.replace(/<span class="cursor"><\/span>/g, '');
  return out;
}

// =============================================================================
// Build the driver script that the page runs.
// =============================================================================

function makeDriverScript(timing) {
  return `
  <script>
  (() => {
    const EVENTS = ${JSON.stringify(timing.events)};
    const TOTAL = ${timing.total};
    const sleep = ms => new Promise(r => setTimeout(r, ms));

    function paragraph(pid) {
      return document.querySelector('p.note-paragraph[data-typed-pid="' + pid + '"]');
    }

    function showCursorOn(pid) {
      document.querySelectorAll('span.cursor').forEach(c => c.style.display = 'none');
      const p = paragraph(pid);
      if (!p) return;
      const c = p.querySelector('span.cursor[data-cursor-for="' + pid + '"]');
      if (c) c.style.display = 'inline-block';
    }

    function appendChar(pid, ch) {
      const p = paragraph(pid);
      if (!p) return;
      const typed = p.querySelector('span.typed');
      typed.textContent += ch;
    }

    // Auto-scroll: if the active cursor drops below the keyboard's top edge
    // (with a small buffer), shift the .note container up smoothly so the
    // cursor stays visible. Same behaviour iOS Notes does when typing into a
    // long note with the keyboard up.
    function scrollIfNeeded(pid) {
      const note = document.querySelector('.note');
      if (!note) return;
      const cursor = paragraph(pid) && paragraph(pid).querySelector('span.cursor[data-cursor-for="' + pid + '"]');
      if (!cursor || cursor.style.display === 'none') return;
      const kbdTopEl = document.querySelector('.kbd-format') || document.querySelector('.kbd');
      if (!kbdTopEl) return;
      const kbdTop = kbdTopEl.getBoundingClientRect().top;
      const cursorBottom = cursor.getBoundingClientRect().bottom;
      const buffer = 90; // px in viewport
      if (cursorBottom + buffer > kbdTop) {
        const overflow = cursorBottom + buffer - kbdTop;
        const cur = parseFloat(note.dataset.shift || '0');
        const newShift = cur - overflow;
        note.dataset.shift = String(newShift);
        note.style.transition = 'transform 380ms cubic-bezier(0.22, 0.61, 0.36, 1)';
        note.style.transform = 'translateY(' + newShift + 'px)';
      }
    }

    // Replace the typed text span's contents with the full text plus
    // autocorrect underlines for the matching words (case-sensitive,
    // mid-typing flag — applied while the user types).
    function applyUnderline(pid, words) {
      if (!words || !words.length) return;
      const p = paragraph(pid);
      if (!p) return;
      const span = p.querySelector('span.typed');
      let s = span.textContent;
      // Wrap each whole-word match with a <u class="spell"> tag.
      for (const w of words) {
        const re = new RegExp('\\\\b(' + w.replace(/[.*+?^\${}()|[\\]\\\\]/g, '\\\\$&') + ')\\\\b', 'g');
        s = s.replace(re, '<u class="spell">$1</u>');
      }
      span.innerHTML = s;
    }

    async function run() {
      const t0 = performance.now();
      // Reveal the cursor on the first typed paragraph immediately.
      if (EVENTS.length) showCursorOn(EVENTS[0].pid);
      let lastUnderlinedPid = null;
      for (const ev of EVENTS) {
        const target = t0 + ev.t * 1000;
        const wait = target - performance.now();
        if (wait > 0) await sleep(wait);
        if (ev.kind_evt === 'type') {
          appendChar(ev.pid, ev.ch);
          showCursorOn(ev.pid);
          scrollIfNeeded(ev.pid);
        } else if (ev.kind_evt === 'return') {
          // Apply autocorrect underlines for the paragraph that just finished.
          const finishedPid = ev.pid;
          const finishedWords = (window.__underlineMap || {})[finishedPid] || [];
          if (finishedWords.length) applyUnderline(finishedPid, finishedWords);
          // Carriage return: move cursor to the next paragraph if it exists.
          const idx = parseInt(ev.pid.slice(2), 10);
          const nextPid = 'tp' + (idx + 1);
          const next = paragraph(nextPid);
          if (next) {
            showCursorOn(nextPid);
            scrollIfNeeded(nextPid);
          }
        }
      }
      // After typing finishes, finalize autocorrect underlines on every typed
      // paragraph so the static end-state matches what the atom would produce.
      const paras = document.querySelectorAll('p.note-paragraph[data-typed-pid]');
      paras.forEach(p => {
        const pid = p.getAttribute('data-typed-pid');
        const words = (window.__underlineMap || {})[pid] || [];
        if (words.length) applyUnderline(pid, words);
      });
    }

    window.__driverReady = true;
    window.__startDriver = run;
  })();
  </script>`;
}

// =============================================================================
// Build the per-paragraph autocorrect map (injected as window.__underlineMap).
// =============================================================================

function makeUnderlineMapScript(spec) {
  const map = {};
  spec.typed_body.forEach((p, i) => {
    map[`tp${i}`] = p.autocorrect_underline || [];
  });
  return `<script>window.__underlineMap = ${JSON.stringify(map)};</script>`;
}

// =============================================================================
// Build the SFX cue list from the same timing table the driver uses.
// =============================================================================

function buildCueList(timing) {
  return timing.events.map(ev => ({
    t: ev.t,
    name: ev.kind_evt === 'return'
      ? 'kb-return'
      : (ev.kind === 'space' ? 'kb-space' : 'kb-tick'),
    soft: false,
  }));
}

// =============================================================================
// Main.
// =============================================================================

async function main() {
  const tmpDir = fs.mkdtempSync(path.join(require('os').tmpdir(), 'apple-notes-master-'));
  const spec = loadSpec();
  const timing = buildTimingTable(spec);
  const initial = buildInitialSpec(spec);
  let html = generateHtml(initial);
  html = tagTypedParagraphs(html, spec);
  // Inject driver + underline map.
  const driverHtml = html
    .replace('</body>',
      makeUnderlineMapScript(spec) + '\n' +
      makeDriverScript(timing) + '\n</body>');

  // Per-recording tweaks. The atom's CSS hardcodes html/body/.screen at 2556px
  // (iPhone's true 19.5:9). We're recording at a shorter 9:16-ish canvas so
  // the keyboard sits higher and the social export needs no crop.
  const styleOverride = `
    <style>
      html, body, .screen { height: ${VIEW_H}px !important; }
      /* Make sure the typed cursor blinks aren't shown — the driver controls
         which cursor is visible, and we keep it solid for screen-recording feel. */
      span.cursor { animation: none; opacity: 1; }
      /* Empty typed paragraphs should still occupy paragraph-gap height so the
         note grows naturally as characters arrive. */
      p.note-paragraph[data-typed-pid] { min-height: 1.38em; }
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
  await page.evaluate(() => window.__startDriver());
  await page.waitForTimeout(timing.total * 1000 + 200);
  const videoPath = await page.video().path();
  await ctx.close();
  await browser.close();

  // Convert webm → mp4 at the chosen fps + native iPhone dimensions.
  const outMp4 = path.join(__dirname, 'master-typing.mp4');
  execSync(
    `ffmpeg -y -i "${videoPath}" -t ${timing.total} -r ${FPS} ` +
    `-vf "scale=${VIEW_W}:${VIEW_H}" -c:v libx264 -pix_fmt yuv420p -movflags +faststart "${outMp4}"`,
    { stdio: 'pipe' }
  );
  fs.writeFileSync(outMp4.replace(/\.mp4$/, '.sfx.json'), JSON.stringify(buildCueList(timing), null, 2));
  fs.rmSync(tmpDir, { recursive: true, force: true });
  console.log(`mp4  → ${path.relative(process.cwd(), outMp4)}`);
  console.log(`sfx  → ${buildCueList(timing).length} cues`);
  console.log(`dur  → ${timing.total.toFixed(2)}s`);
}

main().catch(e => { console.error(e); process.exit(1); });

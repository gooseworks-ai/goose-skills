#!/usr/bin/env node
// record-notes.js — fake an iPhone Apple Notes screen recording of a list being
// typed, one character at a time. Drives the bundled create-apple-notes-mockup
// HTML frame by frame: one PNG per visual state, each held for its own duration,
// then encoded to a 1080x1920 30fps silent MP4.
//
// usage: node record-notes.js --config config.json --out-dir <work> [--still-only]
//   config.note = { title, lines:[{ text, type_seconds, pre_pause_seconds }],
//                   post_hold_seconds, finish_hold_seconds, status_bar, keyboard_state }
// writes: <work>/notes.mp4 (+ frames/, frames.txt, base.html)
//         --still-only: <work>/note-hook.png + note-still.png + note-finish.png (free review stills)

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const { generateHtml } = require('./mockup/generate.js');
const { chromium } = require('playwright');

const W = 1180, H = 2098;                  // 9:16 crop of the 1180-wide phone screen
const DPR = 1080 / W;                      // screenshots land at 1080x1920
const BLINK = 0.53;                        // iOS caret blink half-period (s)
const VISIBLE_BOTTOM = H - 1100 - 40 - 70; // keyboard top - format pill - margin

function arg(name) {
  const i = process.argv.indexOf(name);
  return i > -1 ? process.argv[i + 1] : undefined;
}

function validate(note) {
  const errs = [];
  if (!note || typeof note !== 'object') return ['config.note is missing'];
  if (!note.title || typeof note.title !== 'string') errs.push('note.title is required');
  if (!Array.isArray(note.lines) || !note.lines.length) errs.push('note.lines needs at least one line');
  (note.lines || []).forEach((l, i) => {
    if (!l.text || typeof l.text !== 'string') errs.push(`note.lines[${i}].text is required`);
    if (!(l.type_seconds > 0)) errs.push(`note.lines[${i}].type_seconds must be > 0`);
    if (/[—–]/.test(l.text || '')) errs.push(`note.lines[${i}] has an em/en dash; people don't type those in Notes`);
    if ((l.text || '').length > 80) errs.push(`note.lines[${i}] is over 80 characters; split it`);
  });
  return errs;
}

async function main() {
  const cfgPath = arg('--config');
  const outArg = arg('--out-dir');
  if (!cfgPath || !outArg) {
    console.error('usage: node record-notes.js --config config.json --out-dir <work> [--still-only]');
    process.exit(2);
  }
  const outDir = path.resolve(outArg);
  const stillOnly = process.argv.includes('--still-only');
  const spec = JSON.parse(fs.readFileSync(path.resolve(cfgPath), 'utf8')).note;
  const errs = validate(spec);
  if (errs.length) {
    console.error('config.note is invalid:\n  - ' + errs.join('\n  - '));
    process.exit(1);
  }
  fs.mkdirSync(outDir, { recursive: true });
  const framesDir = path.join(outDir, 'frames');
  fs.rmSync(framesDir, { recursive: true, force: true });
  fs.mkdirSync(framesDir, { recursive: true });

  const base = {
    title: spec.title, body: [], cursor: null, show_keyboard: true,
    status_bar: spec.status_bar || { time: '9:41', battery_pct: 72 },
    keyboard_state: spec.keyboard_state || { suggestions: ['I', 'The', 'My'], shift: 'lower' },
  };
  let html = generateHtml(base);
  html = html.replace('</style>', `
    html, body, .screen { height: ${H}px !important; }
    .note { transition: none; will-change: transform; }
    .note-body .cursor.off { opacity: 0; }
    .key-pop { position:absolute; z-index:30; background:#fff; border-radius:22px;
      box-shadow:0 4px 14px rgba(0,0,0,.28); display:flex; align-items:flex-start;
      justify-content:center; font: 400 96px -apple-system, "SF Pro Display", sans-serif;
      color:#1c1c1e; padding-top:26px; }
    .kbd-key.down { background:#abafb8 !important; }
  </style>`);
  const htmlPath = path.join(outDir, 'base.html');
  fs.writeFileSync(htmlPath, html);

  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: DPR });
  const page = await ctx.newPage();
  await page.goto('file://' + htmlPath, { waitUntil: 'networkidle' });
  await page.waitForTimeout(200);

  // In-page helpers: redraw the note body, the caret, the keyboard casing and the
  // key-press pop for the character just typed.
  await page.evaluate(() => {
    const smart = s => s.replace(/(^|[\s(\[{<])"/g, '$1“').replace(/"/g, '”')
      .replace(/(^|[\s(\[{<])'/g, '$1‘').replace(/'/g, '’');
    const esc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    window.__render = (paras, cursorOn, pressed, upper) => {
      const body = document.querySelector('.note-body');
      body.innerHTML = paras.map((t, i) => {
        const cur = i === paras.length - 1 ? `<span class="cursor${cursorOn ? '' : ' off'}"></span>` : '';
        return `<p class="note-paragraph">${esc(smart(t))}${cur}</p>`;
      }).join('');
      document.querySelectorAll('.kbd-row .kbd-key').forEach(k => {
        if (k.children.length) return;
        const c = k.textContent;
        if (c.length === 1) k.textContent = upper ? c.toUpperCase() : c.toLowerCase();
      });
      document.querySelectorAll('.key-pop').forEach(n => n.remove());
      document.querySelectorAll('.kbd-key.down').forEach(n => n.classList.remove('down'));
      if (pressed === ' ') {
        document.querySelector('.kbd-key--space')?.classList.add('down');
      } else if (pressed && /[a-z]/i.test(pressed)) {
        const key = [...document.querySelectorAll('.kbd-row .kbd-key')]
          .find(k => k.textContent.toLowerCase() === pressed.toLowerCase());
        if (key) {
          const r = key.getBoundingClientRect();
          const pop = document.createElement('div');
          pop.className = 'key-pop';
          const pw = r.width * 1.55, ph = r.height * 1.9;
          pop.style.left = (r.left + r.width / 2 - pw / 2) + 'px';
          pop.style.top = (r.bottom - ph) + 'px';
          pop.style.width = pw + 'px'; pop.style.height = ph + 'px';
          pop.textContent = pressed;
          document.querySelector('.screen').appendChild(pop);
        }
      } else if (pressed === '\n') {
        document.querySelector('.kbd-key--return')?.classList.add('down');
      }
      const cur = body.querySelector('.cursor');
      return cur ? cur.getBoundingClientRect().bottom : 0;
    };
    window.__scroll = y => { document.querySelector('.note').style.transform = `translateY(${-y}px)`; };
    // Done: the keyboard drops away (k = 0 up, 1 gone) and the Done button goes with it.
    window.__dismiss = k => {
      const kbd = document.querySelector('.kbd');
      kbd.style.transform = `translateY(${k * (kbd.getBoundingClientRect().height + 80)}px)`;
      const done = document.querySelector('.toolbar-done');
      if (done) done.style.opacity = String(1 - k);
    };
    // How far the note must stay scrolled for its last line to clear the screen bottom.
    window.__restScroll = (screenH) => {
      const last = document.querySelector('.note-body').lastElementChild;
      const y = parseFloat((document.querySelector('.note').style.transform.match(/-?[\d.]+/) || [0])[0]) || 0;
      return Math.max(0, (last ? last.getBoundingClientRect().bottom : 0) + y - (screenH - 160));
    };
  });

  const timeline = []; // { file, dur }
  let idx = 0, scroll = 0;
  const shot = async (dur) => {
    const f = path.join(framesDir, `f${String(idx++).padStart(5, '0')}.png`);
    await page.screenshot({ path: f });
    timeline.push({ file: f, dur });
  };
  const render = (paras, cursorOn, pressed, upper) =>
    page.evaluate(([p, c, k, u]) => window.__render(p, c, k, u), [paras, cursorOn, pressed || null, !!upper]);
  // Ease the note up so the caret stays above the keyboard.
  const ensureVisible = async (bottom, paras) => {
    if (bottom <= VISIBLE_BOTTOM) return;
    const target = scroll + (bottom - VISIBLE_BOTTOM) + 40;
    const from = scroll, steps = 7;
    for (let s = 1; s <= steps; s++) {
      const t = s / steps, e = 1 - Math.pow(1 - t, 3);
      scroll = from + (target - from) * e;
      await page.evaluate(y => window.__scroll(y), scroll);
      await render(paras, true, null, false);
      await shot(1 / 30);
    }
  };
  // Idle: the caret blinks.
  const hold = async (paras, secs) => {
    let t = 0, on = true;
    while (t < secs - 1e-6) {
      const d = Math.min(BLINK, secs - t);
      await render(paras, on, null, false);
      await shot(d);
      t += d; on = !on;
    }
  };

  // Finish on the whole list. With the keyboard up there is room for the title and
  // about three lines, so by the last line the title and the first lines have
  // scrolled away and the viewer never sees the list in one piece. The writer
  // taps Done: the keyboard drops, the note settles back and holds.
  const finishHold = spec.finish_hold_seconds ?? 2.0;   // 0 keeps the old ending
  const finish = async (paras, record) => {
    if (!(finishHold > 0)) return;
    await render(paras, false, null, false);            // no caret once editing ends
    const rest = await page.evaluate(h => window.__restScroll(h), H);
    const from = scroll, steps = 10;
    for (let s = record ? 1 : steps; s <= steps; s++) {
      const t = s / steps, e = 1 - Math.pow(1 - t, 3);
      scroll = from + (rest - from) * e;
      await page.evaluate(([y, k]) => { window.__scroll(y); window.__dismiss(k); }, [scroll, e]);
      if (record) await shot(1 / 30);
    }
    if (record) await shot(finishHold);
  };

  if (stillOnly) {
    const all = spec.lines.map(l => l.text);
    const b = await render(all, true, null, false);
    const over = b - VISIBLE_BOTTOM;
    if (over > 0) { scroll = over + 40; await page.evaluate(y => window.__scroll(y), scroll); }
    await render(all, true, null, false);
    await page.screenshot({ path: path.join(outDir, 'note-still.png') });
    if (finishHold > 0) {
      await finish(all, false);
      await page.screenshot({ path: path.join(outDir, 'note-finish.png') });
      await page.evaluate(() => window.__dismiss(0));
    }
    await page.evaluate(() => window.__scroll(0));
    await render([''], true, null, false);
    await page.screenshot({ path: path.join(outDir, 'note-hook.png') });
    await browser.close();
    fs.rmSync(framesDir, { recursive: true, force: true });
    console.log(JSON.stringify({ hook: path.join(outDir, 'note-hook.png'), still: path.join(outDir, 'note-still.png'),
      finish: finishHold > 0 ? path.join(outDir, 'note-finish.png') : null }));
    return;
  }

  const paras = [''];
  let b = await render(paras, true, null, false);
  await hold(paras, spec.lines[0].pre_pause_seconds ?? 1.0);

  for (let li = 0; li < spec.lines.length; li++) {
    const line = spec.lines[li];
    if (li > 0) {
      // Return key → new empty paragraph, then a short "thinking" pause.
      paras.push('');
      b = await render(paras, true, '\n', false);
      await shot(0.08);
      await ensureVisible(b, paras);
      await hold(paras, line.pre_pause_seconds ?? 0.6);
    }
    const chars = [...line.text];
    const per = line.type_seconds / chars.length;
    for (let ci = 0; ci < chars.length; ci++) {
      const c = chars[ci];
      paras[paras.length - 1] += c;
      const upper = /[A-Z]/.test(c);
      // Human rhythm: slower after spaces and punctuation, small deterministic jitter.
      const jitter = /[\s.,→]/.test(c) ? 1.35 : (0.8 + ((ci * 37) % 10) / 25);
      b = await render(paras, true, c, upper);
      await shot(per * jitter);
      if (b > VISIBLE_BOTTOM) await ensureVisible(b, paras);
    }
  }
  await render(paras, true, null, false);
  await hold(paras, spec.post_hold_seconds ?? 1.4);
  await finish(paras, true);
  await browser.close();

  const list = timeline.map(t => `file '${t.file}'\nduration ${t.dur.toFixed(4)}`).join('\n')
    + `\nfile '${timeline[timeline.length - 1].file}'\n`;
  const listPath = path.join(outDir, 'frames.txt');
  fs.writeFileSync(listPath, list);
  const total = timeline.reduce((a, t) => a + t.dur, 0);
  const out = path.join(outDir, 'notes.mp4');
  execFileSync('ffmpeg', ['-v', 'error', '-y', '-f', 'concat', '-safe', '0', '-i', listPath,
    '-vf', 'scale=1080:1920:flags=lanczos,fps=30,format=yuv420p', '-c:v', 'libx264', '-crf', '16',
    '-preset', 'medium', '-t', total.toFixed(3), out]);
  console.log(JSON.stringify({ out, frames: timeline.length, seconds: +total.toFixed(2) }));
}

main().catch(e => { console.error(e); process.exit(1); });

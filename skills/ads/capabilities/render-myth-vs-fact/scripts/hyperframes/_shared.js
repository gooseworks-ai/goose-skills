// render-myth-vs-fact — shared helpers + renderer init for hyperframes.
// Ported (generalized, brand-neutral) from the validated Clinikally "acne myths" run.
//
// Each beat's HTML calls initRenderer(duration, renderFn) at the end of its <script>.
// initRenderer wires up window.renderAt(t) for the headless renderer (render_beats.py
// drives it frame-by-frame) AND a preview auto-loop for in-browser viewing. The
// auto-loop yields whenever renderAt(t) is called externally.
//
// The whole point: animation is a PURE FUNCTION of beat-local time. NO setTimeout, NO
// CSS keyframes — so Playwright can seek any frame deterministically and the render is
// frame-exact + reproducible.

const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
const lerp = (a, b, t) => a + (b - a) * t;
const easeOut = (t) => 1 - Math.pow(1 - t, 3);
const easeInOut = (t) => t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;

// Spring scale: starts 0.4, overshoots 1.08 at 0.55, settles 1.0 at 1.0.
// The ~15% overshoot is why every beat sizes its text to fit the 88% safe area at the
// PEAK of the overshoot, not at rest.
function springScale(t) {
  if (t <= 0) return 0.4;
  if (t >= 1) return 1.0;
  if (t < 0.55) {
    const u = t / 0.55;
    return 0.4 + (1.08 - 0.4) * easeOut(u);
  } else {
    const u = (t - 0.55) / 0.45;
    return 1.08 - 0.08 * easeOut(u);
  }
}

// Stagger word-reveals over a span: given an array of elements and a `starts` array of
// absolute (beat-local) times, set opacity + translateY. Used for FACT clause chains and
// staggered proof pills.
function revealWords(els, starts, t, dur = 0.24, yOffset = 28) {
  els.forEach((el, i) => {
    const u = clamp((t - starts[i]) / dur, 0, 1);
    const e = easeOut(u);
    el.style.opacity = e;
    el.style.transform = `translateY(${(1 - e) * yOffset}px)`;
  });
}

// Time-window helpers: eased / linear progress over [start, end].
function tw(t, start, end) {
  if (end <= start) return t >= start ? 1 : 0;
  return easeOut(clamp((t - start) / (end - start), 0, 1));
}
function tw_lin(t, start, end) {
  if (end <= start) return t >= start ? 1 : 0;
  return clamp((t - start) / (end - start), 0, 1);
}

// Single-bar strikethrough wipe L->R (scale a left-anchored bar's X over [start,end]).
// For MULTI-LINE myths use buildLineStrikes + strikeLines instead (a single fixed-Y rule
// reads as an underline the moment the headline wraps).
function strikeWipe(el, t, start, end) {
  const p = tw_lin(t, start, end);
  el.style.transform = `scaleX(${p})`;
  el.style.opacity = p > 0 ? 1 : 0;
}

// Per-line strikethrough (the signature MYTH mechanic). Headlines wrap to N visual lines,
// so a single fixed-Y bar reads as an underline on line 1 and floats above line 2. This
// measures the actual rendered line boxes (one rect per visual line via
// Range.getClientRects, deduped) and lays one red bar per line at that line's vertical
// MIDDLE, so the rule crosses the words on EVERY wrapped line. Bars are appended once into
// `host` (an element overlaying the text, e.g. the .myth-line itself, position:relative).
// The whole set wipes L->R as one continuous sweep over [start,end], proportional to total
// ink width so the wipe speed reads identically on 1- or 2-line myths.
function buildLineStrikes(textEl, host, opts) {
  opts = opts || {};
  const color = opts.color || getComputedStyle(document.documentElement)
    .getPropertyValue('--myth-strike').trim() || '#C0392B';
  const thickness = opts.thickness || 10;
  const radius = opts.radius || 6;
  // Clear any prior bars (idempotent across re-measures).
  Array.from(host.querySelectorAll('.line-strike')).forEach((b) => b.remove());
  const range = document.createRange();
  range.selectNodeContents(textEl);
  const hostBox = host.getBoundingClientRect();
  // Dedup rects to one per visual line (selectNodeContents can emit dupes).
  const rects = Array.from(range.getClientRects()).filter((r) => r.width > 2 && r.height > 2);
  const lines = [];
  rects.forEach((r) => {
    const hit = lines.find((l) => Math.abs(l.top - r.top) < r.height * 0.5);
    if (hit) {
      hit.left = Math.min(hit.left, r.left);
      hit.right = Math.max(hit.right, r.right);
      hit.bottom = Math.max(hit.bottom, r.bottom);
    } else {
      lines.push({ top: r.top, bottom: r.bottom, left: r.left, right: r.right });
    }
  });
  lines.sort((a, b) => a.top - b.top);
  const bars = [];
  let totalW = 0;
  lines.forEach((l) => { totalW += (l.right - l.left); });
  let acc = 0;
  lines.forEach((l) => {
    const w = l.right - l.left;
    const bar = document.createElement('span');
    bar.className = 'line-strike';
    bar.style.position = 'absolute';
    bar.style.left = (l.left - hostBox.left) + 'px';
    // vertical middle of THIS line, centered on the bar thickness
    bar.style.top = (((l.top + l.bottom) / 2) - hostBox.top - thickness / 2) + 'px';
    bar.style.width = w + 'px';
    bar.style.height = thickness + 'px';
    bar.style.background = color;
    bar.style.borderRadius = radius + 'px';
    bar.style.transformOrigin = 'left center';
    bar.style.transform = 'scaleX(0)';
    bar.style.opacity = '0';
    bar.style.pointerEvents = 'none';
    host.appendChild(bar);
    bars.push({ el: bar, frac0: acc / totalW, frac1: (acc + w) / totalW });
    acc += w;
  });
  return bars;
}

// Drive a set of per-line strike bars built by buildLineStrikes as one continuous L->R
// sweep over [start,end]. Each bar fills proportional to its share of total ink.
function strikeLines(bars, t, start, end) {
  const p = tw_lin(t, start, end);
  bars.forEach((b) => {
    let local;
    if (p <= b.frac0) local = 0;
    else if (p >= b.frac1) local = 1;
    else local = (p - b.frac0) / Math.max(1e-6, b.frac1 - b.frac0);
    b.el.style.transform = `scaleX(${local})`;
    b.el.style.opacity = local > 0 ? 1 : 0;
  });
}

// Pop-in with spring overshoot: returns {opacity, transform} for scale+fade.
function popIn(t, start, end, fromY) {
  const p = clamp((t - start) / Math.max(0.0001, end - start), 0, 1);
  const s = springScale(p);
  const y = fromY ? (1 - easeOut(p)) * fromY : 0;
  return { opacity: clamp(p * 2, 0, 1), transform: `translateY(${y}px) scale(${s})` };
}

// ---------------------------------------------------------------------------
// Config injection. render_beats.py injects the per-beat spec + palette as a global
// `window.BEAT` before calling renderAt(t). A beat HTML reads window.BEAT to fill its
// copy + timing, so ONE template renders any myth/fact pair. In-browser preview falls
// back to whatever <script id="beat-spec"> the file ships with.
// ---------------------------------------------------------------------------
function loadBeatSpec() {
  if (window.BEAT) return window.BEAT;
  const tag = document.getElementById('beat-spec');
  if (tag) { try { return JSON.parse(tag.textContent); } catch (e) {} }
  return {};
}

function applyPalette(pal) {
  if (!pal) return;
  const root = document.documentElement;
  const map = {
    bg: '--bg', myth_strike: '--myth-strike', fact_accent: '--fact-accent',
    headline_ink: '--headline-ink', accent: '--accent',
  };
  Object.keys(map).forEach((k) => { if (pal[k]) root.style.setProperty(map[k], pal[k]); });
}

// Initialize the renderer. Beat HTMLs call this once with their duration + render fn.
function initRenderer(duration, renderFn) {
  const _internal = renderFn;
  let lastExternalCallTime = 0;

  window.renderAt = function (t) {
    lastExternalCallTime = performance.now();
    _internal(t);
  };

  const LOOP_PAUSE = 0.6;
  let autoStart = null;
  function tick(now) {
    if (now - lastExternalCallTime > 400) {
      if (autoStart === null) autoStart = now;
      const elapsed = ((now - autoStart) / 1000) % (duration + LOOP_PAUSE);
      const tt = Math.min(elapsed, duration);
      _internal(tt);
    }
    requestAnimationFrame(tick);
  }
  _internal(0);
  requestAnimationFrame(tick);
}

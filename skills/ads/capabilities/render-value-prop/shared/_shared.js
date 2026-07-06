// Gradient Editorial — shared helpers + deterministic renderer init for hyperframes.
//
// Per molecule rule (Decision Rule 3): animation is a pure function of beat-local time
// `t` in seconds. Never CSS keyframes, never setTimeout. Every beat HTML ends its script
// with initRenderer(duration, renderFn) so:
//   (a) Playwright can drive window.renderAt(t) at 1/25s steps for production rendering
//   (b) the same HTML auto-loops in a browser tab for preview review
//
// Ported from everself-hb/working/doctor-christopher-avatar/working/hyperframes-v4/_shared.js

const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
const lerp = (a, b, t) => a + (b - a) * t;
const easeOut = (t) => 1 - Math.pow(1 - t, 3);
const easeInOut = (t) => t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;

// Spring scale: starts 0.4, overshoots 1.08 at 0.55, settles 1.0 at 1.0
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

// Stagger word-reveals over a span: given an array of word elements and a starts array
// of absolute times, set opacity and translateY.
function revealWords(els, starts, t, dur = 0.24, yOffset = 28) {
  els.forEach((el, i) => {
    const u = clamp((t - starts[i]) / dur, 0, 1);
    const e = easeOut(u);
    el.style.opacity = e;
    el.style.transform = `translateY(${(1 - e) * yOffset}px)`;
  });
}

// Time-window helper: returns eased progress over [start, end].
function tw(t, start, end) {
  if (end <= start) return t >= start ? 1 : 0;
  return easeOut(clamp((t - start) / (end - start), 0, 1));
}

function tw_lin(t, start, end) {
  if (end <= start) return t >= start ? 1 : 0;
  return clamp((t - start) / (end - start), 0, 1);
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

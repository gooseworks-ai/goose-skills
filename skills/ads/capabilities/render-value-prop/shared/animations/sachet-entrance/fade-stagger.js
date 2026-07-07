// sachet-entrance/fade-stagger.js
// Calm fade + slide-up, staggered. Validated on Som Sleep v5 (sleep_wellness preset).
//
// Contract: animate(t, elements, params?) → void
//   t        — beat-local time in seconds (driven by initRenderer in _shared.js)
//   elements — NodeList or Array of sachet <img> elements
//   params   — { delay_per_ms?: 70, duration_ms?: 500, offset_y_px?: 60 }

(function (root) {
  function animateSachets(t, elements, params) {
    params = params || {};
    const delayPer = (params.delay_per_ms ?? 70) / 1000;
    const duration = (params.duration_ms ?? 500) / 1000;
    const offsetY  = params.offset_y_px ?? 60;

    elements.forEach(function (el, i) {
      const start = 0.10 + i * delayPer;
      const u = tw_lin(t, start, start + duration);
      const e = easeOut(u);
      el.style.opacity = e;
      el.style.transform = `translateY(${(1 - e) * offsetY}px) scale(${0.96 + 0.04 * e})`;
    });
  }
  root.animateSachets_fadeStagger = animateSachets;
})(window);

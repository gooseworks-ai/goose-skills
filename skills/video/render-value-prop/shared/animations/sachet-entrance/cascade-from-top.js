// sachet-entrance/cascade-from-top.js
// Sachets fall in from above with gravity easing. Sophisticated.
// STATUS: scaffolded.
//
// Contract: animate(t, elements, params?) → void
//   params: { drop_distance_px?: 200, duration_ms?: 700, stagger_ms?: 80 }

(function (root) {
  function animateSachets(t, elements, params) {
    params = params || {};
    const drop     = params.drop_distance_px ?? 200;
    const duration = (params.duration_ms ?? 700) / 1000;
    const stagger  = (params.stagger_ms ?? 80) / 1000;

    elements.forEach(function (el, i) {
      const start = 0.10 + i * stagger;
      const u = tw_lin(t, start, start + duration);
      // Gravity-ish curve — slow start, fast settle
      const e = u < 1 ? Math.pow(u, 2.2) : 1;
      const baseTx = el.dataset.baseTx || "";
      el.style.opacity = e;
      el.style.transform = `${baseTx} translateY(${(1 - e) * -drop}px)`;
    });
  }
  root.animateSachets_cascadeFromTop = animateSachets;
})(window);

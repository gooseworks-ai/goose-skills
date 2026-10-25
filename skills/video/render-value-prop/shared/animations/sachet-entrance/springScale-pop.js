// sachet-entrance/springScale-pop.js
// Sachets scale 0.4 → 1.08 → 1.0 with elastic overshoot. Punchy.
// STATUS: scaffolded — not yet validated on a real brand run.
//
// Contract: animate(t, elements, params?) → void
//   params: { duration_ms?: 600, stagger_ms?: 100 }

(function (root) {
  function animateSachets(t, elements, params) {
    params = params || {};
    const duration = (params.duration_ms ?? 600) / 1000;
    const stagger  = (params.stagger_ms ?? 100) / 1000;

    elements.forEach(function (el, i) {
      const start = 0.10 + i * stagger;
      const u = tw_lin(t, start, start + duration);
      const baseTx = el.dataset.baseTx || "";
      const s = u < 1 ? springScale(u) : 1.0;
      el.style.opacity = easeOut(u);
      el.style.transform = `${baseTx} scale(${s})`;
    });
  }
  root.animateSachets_springScalePop = animateSachets;
})(window);

// sachet-entrance/slide-in-lateral.js
// Sachets enter from screen edges, alternating left/right per index. Active.
// For sport_active / energy_cpg / tech_active brand registers.
//
// Contract: animate(t, elements, params?) → void
//   params: { duration_ms?: 450, offset_x_px?: 320 }
//
// Index parity drives direction:
//   even idx → enters from left (translateX -offset → 0)
//   odd idx  → enters from right (translateX +offset → 0)
// Staggered 50ms apart.

(function (root) {
  function animateSachets(t, elements, params) {
    params = params || {};
    const duration = (params.duration_ms ?? 450) / 1000;
    const offsetX  = params.offset_x_px ?? 320;
    const staggerS = 0.05;

    elements.forEach(function (el, i) {
      const start = 0.08 + i * staggerS;
      const u = tw_lin(t, start, start + duration);
      const e = easeOut(u);
      const dir = i % 2 === 0 ? -1 : +1;   // even=left, odd=right
      // Preserve any centering transform via translateX override
      const baseTx = el.dataset.baseTx || "";
      el.style.opacity = e;
      el.style.transform = `${baseTx} translateX(${dir * (1 - e) * offsetX}px) scale(${0.94 + 0.06 * e})`;
    });
  }
  root.animateSachets_slideInLateral = animateSachets;
})(window);

// sachet-entrance/tilt-fan.js
// Sachets fan out from stacked center with slight rotation per index. Luxurious.
// STATUS: scaffolded.
//
// Contract: animate(t, elements, params?) → void
//   params: { fan_angle_deg?: 8, duration_ms?: 700 }
//
// Index drives rotation: relative to center, sachets tilt outward.

(function (root) {
  function animateSachets(t, elements, params) {
    params = params || {};
    const fanAngle = params.fan_angle_deg ?? 8;
    const duration = (params.duration_ms ?? 700) / 1000;
    const n = elements.length;
    const center = (n - 1) / 2;

    elements.forEach(function (el, i) {
      const start = 0.10 + i * 0.05;
      const u = tw_lin(t, start, start + duration);
      const e = easeOut(u);
      const baseTx = el.dataset.baseTx || "";
      const offsetFromCenter = i - center;
      const finalRot = offsetFromCenter * fanAngle;
      const rot = finalRot * e;
      el.style.opacity = e;
      el.style.transform = `${baseTx} rotate(${rot}deg) scale(${0.94 + 0.06 * e})`;
    });
  }
  root.animateSachets_tiltFan = animateSachets;
})(window);

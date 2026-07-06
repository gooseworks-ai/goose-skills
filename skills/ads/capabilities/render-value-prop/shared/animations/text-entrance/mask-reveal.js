// text-entrance/mask-reveal.js
// Text reveals behind a moving curtain mask. Sophisticated.
// STATUS: scaffolded.
//
// IMPLEMENTATION NOTE: Uses CSS clip-path with inset() animated by t.
// The headline element needs `overflow:hidden` and the .h-display child gets the clip.

(function (root) {
  function animateText(t, elements, params) {
    if (elements.eyebrow) elements.eyebrow.style.opacity = easeOut(tw_lin(t, 0.05, 0.30));
    if (elements.rule) {
      const u = tw_lin(t, 0.10, 0.35);
      const e = easeOut(u);
      elements.rule.style.opacity = e;
      elements.rule.style.transform = `scaleX(${0.4 + 0.6 * e})`;
    }
    if (elements.headline) {
      const u = tw_lin(t, 0.25, 0.85);
      const e = easeOut(u);
      // Reveal from left → right via clip-path inset
      const cutRight = (1 - e) * 100;
      elements.headline.style.opacity = 1;
      elements.headline.style.clipPath = `inset(0 ${cutRight}% 0 0)`;
    }
    if (elements.sub) {
      const u = tw_lin(t, 0.75, 1.05);
      elements.sub.style.opacity = easeOut(u);
    }
  }
  root.animateText_maskReveal = animateText;
})(window);

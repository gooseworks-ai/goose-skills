// text-entrance/fade-stagger.js
// Eyebrow → rule scaleX → headline translateY → sub fade. Staggered.
// Validated on Som Sleep v5 (sleep_wellness preset).
//
// Contract: animate(t, elements, params?) → void
//   elements: { eyebrow, rule, headline, sub } — getElementById refs
//   params:   none required

(function (root) {
  function animateText(t, elements, params) {
    // Eyebrow
    if (elements.eyebrow) {
      const u = tw_lin(t, 0.10, 0.45);
      elements.eyebrow.style.opacity = easeOut(u);
    }
    // Accent rule (scaleX from 0.3 → 1.0)
    if (elements.rule) {
      const u = tw_lin(t, 0.20, 0.55);
      const e = easeOut(u);
      elements.rule.style.opacity = e;
      elements.rule.style.transform = `scaleX(${0.3 + 0.7 * e})`;
    }
    // Headline (translateY 28 → 0)
    if (elements.headline) {
      const u = tw_lin(t, 0.30, 0.75);
      const e = easeOut(u);
      elements.headline.style.opacity = e;
      elements.headline.style.transform = `translateY(${(1 - e) * 28}px)`;
    }
    // Sub-sentence (translateY 16 → 0)
    if (elements.sub) {
      const u = tw_lin(t, 0.45, 0.90);
      const e = easeOut(u);
      elements.sub.style.opacity = e;
      elements.sub.style.transform = `translateY(${(1 - e) * 16}px)`;
    }
  }
  root.animateText_fadeStagger = animateText;
})(window);

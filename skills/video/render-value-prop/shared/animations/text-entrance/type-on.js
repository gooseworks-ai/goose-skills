// text-entrance/type-on.js
// Headline characters appear letter-by-letter. Tech feel.
// STATUS: scaffolded — not yet validated.
//
// REQUIREMENT: headline must be split into <span class="char"> per character.
//
// Contract: animate(t, elements, params?) → void
//   params: { char_stagger_ms?: 30, char_duration_ms?: 120 }

(function (root) {
  function animateText(t, elements, params) {
    params = params || {};
    const stagger = (params.char_stagger_ms ?? 30) / 1000;
    const dur     = (params.char_duration_ms ?? 120) / 1000;

    if (elements.eyebrow) elements.eyebrow.style.opacity = easeOut(tw_lin(t, 0.05, 0.30));
    if (elements.rule) {
      const u = tw_lin(t, 0.10, 0.35);
      const e = easeOut(u);
      elements.rule.style.opacity = e;
      elements.rule.style.transform = `scaleX(${0.4 + 0.6 * e})`;
    }
    if (elements.headline) {
      const chars = elements.headline.querySelectorAll('.char');
      const baseStart = 0.30;
      chars.forEach(function (c, i) {
        const start = baseStart + i * stagger;
        const u = tw_lin(t, start, start + dur);
        c.style.opacity = easeOut(u);
      });
    }
    if (elements.sub) {
      const u = tw_lin(t, 0.85, 1.15);
      elements.sub.style.opacity = easeOut(u);
    }
  }
  root.animateText_typeOn = animateText;
})(window);

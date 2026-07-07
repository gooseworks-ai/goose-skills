// text-entrance/word-by-word.js
// Each headline word fades + translates individually, 80ms staggered.
// Punchy / sport-active register.
//
// REQUIREMENT: headline must be split into <span class="word"> per word at build time.
// The build script should pre-process headline text:
//   "NSF Certified for Sport." →
//   <span class="word">NSF</span> <span class="word">Certified</span> ...
//
// Contract: animate(t, elements, params?) → void
//   elements: { eyebrow, rule, headline, sub } — headline contains .word children
//   params:   { word_stagger_ms?: 80, word_duration_ms?: 350 }

(function (root) {
  function animateText(t, elements, params) {
    params = params || {};
    const wordStagger = (params.word_stagger_ms ?? 80) / 1000;
    const wordDur     = (params.word_duration_ms ?? 350) / 1000;

    // Eyebrow + rule fade in fast
    if (elements.eyebrow) {
      const u = tw_lin(t, 0.05, 0.30);
      elements.eyebrow.style.opacity = easeOut(u);
    }
    if (elements.rule) {
      const u = tw_lin(t, 0.10, 0.35);
      const e = easeOut(u);
      elements.rule.style.opacity = e;
      elements.rule.style.transform = `scaleX(${0.4 + 0.6 * e})`;
    }
    // Headline: per-word stagger
    if (elements.headline) {
      const words = elements.headline.querySelectorAll('.word');
      const baseStart = 0.25;
      words.forEach(function (w, i) {
        const start = baseStart + i * wordStagger;
        const u = tw_lin(t, start, start + wordDur);
        const e = easeOut(u);
        w.style.opacity = e;
        w.style.transform = `translateY(${(1 - e) * 24}px)`;
      });
    }
    // Sub
    if (elements.sub) {
      const u = tw_lin(t, 0.65, 1.05);
      const e = easeOut(u);
      elements.sub.style.opacity = e;
      elements.sub.style.transform = `translateY(${(1 - e) * 14}px)`;
    }
  }
  root.animateText_wordByWord = animateText;
})(window);

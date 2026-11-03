// Deterministic frame renderer scaffold for pick-05.
// Same contract as pick-01: initRenderer(duration_s, renderFn). Pure-function-of-time motion.

(function () {
  let _duration = 0;
  let _renderFn = null;

  window.initRenderer = function (durationSeconds, renderFn) {
    _duration = durationSeconds;
    _renderFn = renderFn;
    renderFn(0);
    window.__driverReady = true;
  };

  window.renderAt = function (t) {
    if (!_renderFn) return;
    if (t < 0) t = 0;
    if (t > _duration) t = _duration;
    _renderFn(t);
  };

  window.clamp01 = function (x) { return Math.max(0, Math.min(1, x)); };
  window.tw = function (t, t0, t1) {
    if (t <= t0) return 0;
    if (t >= t1) return 1;
    return (t - t0) / (t1 - t0);
  };
  window.easeOut = function (x) { return 1 - Math.pow(1 - x, 3); };
  window.easeOutBack = function (x, s) {
    s = s || 1.70158;
    return 1 + (s + 1) * Math.pow(x - 1, 3) + s * Math.pow(x - 1, 2);
  };
})();

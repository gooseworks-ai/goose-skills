# Smoke Test

build_card.py --config config.json --out hyperframe.html ; render.py --config config.json --html hyperframe.html --out master-silent.mp4 — 1080x1920 scrolling 2-row grid, deterministic, $0.

Pass when:
- the scripts run to a valid 1080x1920 mp4 at the config fps/duration;
- the middle grid scrolls horizontally over the clip (not a static hold), tiles are edge-faded, and `<video>` tiles play (real-time playback, no seek hang);
- header wordmark/headline/sub and the %-OFF / code / CTA type tiles stay pixel-crisp DOM;
- no paid provider host is called from this capability (clips + music are separate media capabilities).

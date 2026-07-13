# Smoke Test

build_composition.py --config config.json --output hyperframe.html ; render_seekable_hyperframe.py hyperframe.html master-silent.mp4 <duration> --fps 30 --width 1280 --height 720 — dark stage, N-panel comparison grid, deterministic, $0.

Pass when:
- build_composition.py validates every cell path + the column count (2-4) and prints the total duration; render_seekable_hyperframe.py runs to a valid mp4 at the config canvas/fps/duration;
- per beat: the monospace prompt fades in centered and is fully readable before the panels enter, then docks to the top strip; the 2-4 labeled panels stagger in with the correct label under each column (same order every beat); the end card has NO stats line;
- video cells advance (sample two frames ≥0.5s apart inside one hold — the clip is frame-seeked, not a frozen first frame);
- all state is computed in renderAt(t) (no CSS animation-delay), so scrubbing never traps a pre-state;
- no paid provider host is called from this capability (cell images/clips + music are separate media capabilities).

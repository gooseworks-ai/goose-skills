# Smoke Test

build_start_frames.py --config config.json --run-dir <run> ; render_endcard.py --config config.json --run-dir <run> ; build_master.py --config config.json --run-dir <run> — 1080x1920, deterministic, $0.

Pass when each script runs to a valid output: build_start_frames writes one start frame PNG per beat (flat cover centered on the tabletop plate), render_endcard writes end-card.mp4 (brand HTML, static dwell), and build_master writes master-final.mp4 (speed + hard-cut concat of the beats + end card, music muxed). No paid provider calls are made — all three steps are FREE (PIL + Playwright + FFmpeg).

# Smoke Test

fetch_icons.py --run-dir <run> ; build_overlays.py --config config.json --out-dir <run>/generated/overlays ; compose_master.py --config config.json --run-dir <run> --no-music — deterministic, $0.

Pass when:
- `fetch_icons.py` lands medal.png / finger-down.png / check.png in `<run>/assets/icons`.
- `build_overlays.py` emits `01-header-white.png`, `02-header-orange.png`, and one `NN-check-*.png` per proof point into `generated/overlays`.
- `compose_master.py` produces a valid 1080x1920 `master-final.mp4` with the headers always on and the proof pills revealing in the L->R->L->R cascade.
- No paid provider call is made (this capability is FREE and deterministic).

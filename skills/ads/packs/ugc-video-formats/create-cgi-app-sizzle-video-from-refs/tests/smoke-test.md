# Smoke Test

Goal: prove `create-cgi-app-sizzle-video-from-refs` assembles a master. The generative
steps (CGI plates, Kling clips, VO, music) are PAID; the assembly (screen composites via
PIL, Ken-Burns fallback clips, end card, captions, concat, 1.15x speed) is free. The smoke
test validates the free assembly on placeholder inputs → $0.

Steps:
1. Read `SKILL.md` and `scripts/PIPELINE.md`.
2. Confirm `scripts/config.example.json` parses and carries 5–6 `beats`, each with `screen`,
   `burst_out`, `kling_motion`, `kenburns_fallback`, and `vo`; plus `studio_look`, `cgi_plate`,
   `end_card`, `voiceover`, `music`, `finalize.speed == 1.15`.
3. Free assembly path (no paid gen): drop N placeholder 9:16 clips (any color clips at the
   beat windows) named per `config.beats` + a static end-card PNG, then run the Ken-Burns +
   concat + 1.15x finalize from `build_v2_clips.py` (fallback) → `master-final.mp4`.
4. Probe: 1080×1920, H.264, `duration ≈ (Σ beat windows + end_card.dwell) / 1.15` (±0.3s;
   ~22.6s for the MasterClass example). With music: an `aac` audio stream present.
5. For the FULL paid path (`gen_plates.py` → `composite_screens.py` → `gen_clips.py` →
   VO → music → mix), run only with FAL + ElevenLabs keys behind an explicit spend gate.

Pass/fail: pass when the assembled MP4 is 1080×1920 at the expected duration with N+1
hard-cut segments (beats + end card) and the on-screen UI is a real screenshot composite
(no AI UI). Gate any paid gen behind explicit approval.

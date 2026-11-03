# Smoke Test

Free, local. With two square icons, a real b-roll clip and a card.json:

1. `render_card.py card.json --out-dir work` writes two 1080x672 plates. It REFUSES: `integration_confirmed` false; "partner", "official" or "#1" in the copy; a comment-bait CTA; a dash; 3 steps; a line that overflows.
2. `compose.py --broll clip.mp4 --cards work --out ad.mp4 --speed 4` writes a 7.00s 1080x1920 file.
3. `measure_motion.py ad.mp4 --cta-at 2.0` exits 0: motion mean >= 1.5, the CTA strip dark at 1.9s and lit at 2.0s.

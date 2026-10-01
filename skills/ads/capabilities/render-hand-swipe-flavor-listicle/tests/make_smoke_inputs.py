#!/usr/bin/env python3
"""Make FREE synthetic inputs for the render-hand-swipe-flavor-listicle smoke test.

Writes into DIR:
  hand-greenscreen.mp4   2s 720x1280 clip: a skin-toned "hand" (palm + raised finger) on a
                         muddy, uneven green that sweeps right-to-left (stands in for the
                         create-video-fal clip; no paid call)
  can-1..5.png           transparent "can" cutouts with a printed label
  endcard.png            1080x1920 end card
  music.wav              8s sine bed
  config.json            a render config wired to the files above

Usage: python3 make_smoke_inputs.py DIR
"""
import json
import subprocess
import sys
from pathlib import Path

from PIL import Image, ImageDraw

out = Path(sys.argv[1] if len(sys.argv) > 1 else "hand-swipe-smoke").resolve()
out.mkdir(parents=True, exist_ok=True)

# --- green-screen hand clip: PIL frames -> ffmpeg -------------------------------
CW, CH, FPS, SEC = 720, 1280, 30, 2
frames = out / "_frames"
frames.mkdir(exist_ok=True)
for i in range(FPS * SEC):
    t = i / (FPS * SEC - 1)
    im = Image.new("RGB", (CW, CH))
    px = ImageDraw.Draw(im)
    for y in range(0, CH, 8):  # uneven, muddy green (brightness gradient) like an AI green screen
        g = int(150 + 70 * y / CH)
        px.rectangle([0, y, CW, y + 8], fill=(40 + y // 64, g, 35))
    cx = int(CW * 0.75 - CW * 0.5 * t)  # sweeps right -> left
    skin = (224, 172, 140)
    px.rounded_rectangle([cx - 130, 820, cx + 130, CH + 40], 60, fill=skin)       # back of hand
    px.rounded_rectangle([cx - 28, 470, cx + 28, 860], 28, fill=skin)            # index finger UP
    px.ellipse([cx - 22, 480, cx + 22, 530], fill=(236, 190, 165))               # nail
    # realistic green spill on skin: greener than the skin, but red still dominant -> must stay OPAQUE
    px.rectangle([cx - 130, 1000, cx + 130, 1010], fill=(205, 190, 150))
    im.save(frames / f"f{i:04d}.png")
subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-framerate", str(FPS), "-i", str(frames / "f%04d.png"),
                "-c:v", "libx264", "-pix_fmt", "yuv420p", str(out / "hand-greenscreen.mp4")], check=True)
for f in frames.iterdir():
    f.unlink()
frames.rmdir()

# --- can cutouts -----------------------------------------------------------------
cols = ["#2FA84F", "#F47B20", "#7A3FA0", "#16A8A0", "#E01B2E"]
flavors = []
for i, c in enumerate(cols, 1):
    im = Image.new("RGBA", (400, 900), (0, 0, 0, 0))
    dr = ImageDraw.Draw(im)
    dr.rounded_rectangle([40, 40, 360, 860], 50, fill=(235, 235, 240, 255), outline=(60, 60, 60, 255), width=6)
    dr.rectangle([60, 300, 340, 600], fill=c)
    dr.text((200, 450), f"FLAVOR {i}", fill="white", anchor="mm", font_size=48)
    p = out / f"can-{i}.png"
    im.save(p)
    flavors.append({"bg": c, "can": p.name})

end = Image.new("RGB", (1080, 1920), "#111111")
ImageDraw.Draw(end).text((540, 960), "END CARD", fill="white", anchor="mm", font_size=110)
end.save(out / "endcard.png")

subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-f", "lavfi", "-i", "sine=frequency=330:duration=8",
                "-ac", "2", str(out / "music.wav")], check=True)

cfg = {
    "width": 1080, "height": 1920, "fps": 30, "target_duration_sec": 7.5,
    "title": "5 Flavors of Smoke Test", "title_font": None,
    "title_size": 110, "title_y": 200, "can_height": 950, "can_center_y": 940,
    "slide": {"direction": "right-to-left", "frames": 12},
    "flavors": flavors,
    "hand_clip": "hand-greenscreen.mp4",
    "hand": {"trim_start": 0.0, "trim_end": 1.0, "speed": 1.0, "scale": 0.45, "green_margin": 1.12},
    "end_card": "endcard.png", "end_card_hold_frames": 60,
    "music": {"path": "music.wav", "trim_intro_sec": 0.5, "volume": 1.0},
    "output": "smoke-out.mp4",
}
(out / "config.json").write_text(json.dumps(cfg, indent=2))
print(f"WROTE smoke inputs -> {out}")

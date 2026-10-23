#!/usr/bin/env python3
"""compose_carousel.py — the AirDrop product-carousel render engine.

Takes the two rendered card PNGs (green page + magenta preview window, from
build_card.py + a headless-Chrome screenshot) and a list of product images, and
produces the finished vertical video:

  * green-key the card  -> the card's alpha (drop shadow synthesized in PIL)
  * detect the magenta window -> fill it with each product (cover), in sequence
  * blurred, darkened per-product backdrop with a slow push-in
  * card springs up (iOS ease-out-back), holds; preview cycles the products;
    lands on --final-image with an Accept tap-highlight
  * synth audio: whoosh on entry, chime on land, soft tick per swap, tap pop
  * encode h264 + aac via ffmpeg

Deterministic — no generative video, so the UI text stays crisp. Requires
numpy, Pillow, and ffmpeg on PATH.

Example:
  python3 compose_carousel.py \
    --chrome chrome-green.png --chrome-pressed chrome-green-pressed.png \
    --images "a.png,b.png,c.png" --final-image lineup.jpg \
    --out out.mp4
"""
import argparse, os, shutil, subprocess, sys, wave
import numpy as np
from PIL import Image, ImageFilter, ImageEnhance


def key_green(path, W, H):
    """Green screen (#00e000) -> alpha. Returns HxWx4 uint8; magenta window stays opaque."""
    im = np.asarray(Image.open(path).convert("RGB").resize((W, H), Image.LANCZOS)).astype(np.int16)
    r, g, b = im[..., 0], im[..., 1], im[..., 2]
    greenness = g - np.maximum(r, b)
    alpha = np.clip((120 - greenness) / 60.0, 0, 1)
    alpha = (alpha * 255).astype(np.uint8)
    rgb = im.copy()                       # green despill on partially-keyed edge pixels
    spill = (greenness > 0) & (alpha < 255)
    rgb[..., 1] = np.where(spill, np.minimum(g, np.maximum(r, b)), g)
    return np.dstack([rgb.astype(np.uint8), alpha])


def window_mask(chrome):
    """Magenta (#ff00ff) preview-window mask + its bounding box."""
    r, g, b, a = (chrome[..., i].astype(int) for i in range(4))
    mag = (r > 165) & (g < 115) & (b > 165) & (a > 128)
    ys, xs = np.where(mag)
    if len(xs) == 0:
        sys.exit("ERROR: no magenta preview window found in the card PNG.")
    return mag, (xs.min(), ys.min(), xs.max(), ys.max())


def fill_card(chrome, mask, bbox, prod_path):
    """Copy of the card with the magenta window filled by the product (cover-crop)."""
    x0, y0, x1, y1 = bbox
    ww, wh = x1 - x0 + 1, y1 - y0 + 1
    card = chrome.copy()
    p = Image.open(prod_path).convert("RGB")
    sc = max(ww / p.width, wh / p.height)
    p2 = p.resize((int(p.width * sc) + 1, int(p.height * sc) + 1), Image.LANCZOS)
    cx, cy = (p2.width - ww) // 2, (p2.height - wh) // 2
    crop = np.asarray(p2.crop((cx, cy, cx + ww, cy + wh)))
    region = card[y0:y1 + 1, x0:x1 + 1, :3]
    m = mask[y0:y1 + 1, x0:x1 + 1]
    region[m] = crop[m]
    card[y0:y1 + 1, x0:x1 + 1, :3] = region
    return card


def make_bg(path, BW, BH):
    im = Image.open(path).convert("RGB")
    sc = max(BW / im.width, BH / im.height)
    im2 = im.resize((int(im.width * sc) + 1, int(im.height * sc) + 1), Image.LANCZOS)
    l, t = (im2.width - BW) // 2, (im2.height - BH) // 2
    bg = im2.crop((l, t, l + BW, t + BH)).filter(ImageFilter.GaussianBlur(26))
    bg = ImageEnhance.Brightness(bg).enhance(0.5)
    return ImageEnhance.Color(bg).enhance(1.08)


def ease_out_back(x):
    c1 = 1.70158; c3 = c1 + 1
    return 1 + c3 * ((x - 1) ** 3) + c1 * ((x - 1) ** 2)


def synth_audio(path, dur, swaps, tap_t, sr=44100):
    n = int(dur * sr); buf = np.zeros(n)
    def tone(freq, t0, d, amp, decay):
        i0 = int(t0 * sr); L = int(d * sr); tt = np.arange(L) / sr
        seg = amp * np.sin(2 * np.pi * freq * tt) * np.exp(-tt / decay)
        e = min(i0 + L, n); buf[i0:e] += seg[:e - i0]
    def whoosh(t0, d, amp):
        i0 = int(t0 * sr); L = int(d * sr); tt = np.arange(L) / sr
        env = np.sin(np.pi * np.clip(tt / d, 0, 1)) ** 2
        seg = amp * np.random.RandomState(1).randn(L) * env
        seg = np.convolve(seg, np.ones(80) / 80, mode="same")
        e = min(i0 + L, n); buf[i0:e] += seg[:e - i0]
    whoosh(0.05, 0.55, 0.10)
    tone(1319, 0.70, 0.7, 0.34, 0.34); tone(1976, 0.70, 0.6, 0.16, 0.28); tone(2637, 0.70, 0.4, 0.07, 0.2)
    for st in swaps:
        tone(2650, st, 0.05, 0.14, 0.02); tone(3500, st, 0.035, 0.06, 0.015)
    if tap_t is not None:
        tone(2400, tap_t, 0.05, 0.16, 0.02); tone(760, tap_t + 0.02, 0.16, 0.12, 0.09); tone(1140, tap_t + 0.02, 0.16, 0.07, 0.09)
    buf = buf / (np.max(np.abs(buf)) or 1.0) * 0.85
    st = np.clip(np.stack([buf, buf], 1), -1, 1)
    with wave.open(path, "wb") as w:
        w.setnchannels(2); w.setsampwidth(2); w.setframerate(sr)
        w.writeframes((st * 32767).astype("<i2").tobytes())


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--chrome", required=True)
    ap.add_argument("--chrome-pressed", default="")
    ap.add_argument("--images", default="", help="comma-separated ordered product image paths")
    ap.add_argument("--images-dir", default="", help="dir of product images (sorted) if --images omitted")
    ap.add_argument("--final-image", required=True, help="the payoff image held at the end")
    ap.add_argument("--out", required=True)
    ap.add_argument("--per", type=float, default=0.34, help="seconds per carousel image")
    ap.add_argument("--first-hold", type=float, default=1.00, help="first image hold (covers slide-in)")
    ap.add_argument("--final-hold", type=float, default=2.10)
    ap.add_argument("--slide", type=float, default=0.72)
    ap.add_argument("--fps", type=int, default=30)
    ap.add_argument("--width", type=int, default=1080)
    ap.add_argument("--height", type=int, default=1920)
    ap.add_argument("--no-audio", action="store_true")
    a = ap.parse_args()
    W, H, FPS = a.width, a.height, a.fps

    imgs = [s for s in a.images.split(",") if s] if a.images else \
        sorted(os.path.join(a.images_dir, f) for f in os.listdir(a.images_dir)
               if f.lower().endswith((".png", ".jpg", ".jpeg", ".webp")))
    if not imgs:
        sys.exit("ERROR: no product images (pass --images or --images-dir).")
    seq = [(imgs[0], a.first_hold)] + [(p, a.per) for p in imgs[1:]] + [(a.final_image, a.final_hold)]

    dur = sum(s for _, s in seq); N = int(round(dur * FPS))
    bounds, acc = [], 0.0
    for _, s in seq:
        bounds.append((acc, acc + s)); acc += s
    swaps = [b[0] for b in bounds[1:]]

    chrome = key_green(a.chrome, W, H)
    chrome_p = key_green(a.chrome_pressed, W, H) if a.chrome_pressed else chrome
    mask, bbox = window_mask(chrome)
    variants = [fill_card(chrome, mask, bbox, p) for p, _ in seq]
    if a.chrome_pressed:
        mask_p, bbox_p = window_mask(chrome_p)
        final_pressed = fill_card(chrome_p, mask_p, bbox_p, a.final_image)
    else:
        final_pressed = variants[-1]
    BW, BH = int(W * 1.1), int(H * 1.1)
    bgs = [make_bg(p, BW, BH) for p, _ in seq]

    al = chrome[..., 3]
    sh = np.zeros((H, W, 4), np.uint8); sh[..., 3] = (al * 0.5).astype(np.uint8)
    shadow = Image.fromarray(sh, "RGBA").filter(ImageFilter.GaussianBlur(38))

    frames = os.path.join(os.path.dirname(a.out) or ".", ".carousel_frames")
    if os.path.exists(frames):
        shutil.rmtree(frames)
    os.makedirs(frames)

    tap_a, tap_b = dur - 0.92, dur - 0.60
    def img_at(t):
        for i, (lo, hi) in enumerate(bounds):
            if lo <= t < hi:
                return i
        return len(seq) - 1
    for f in range(N):
        t = f / FPS; idx = img_at(t)
        k = 1.0 + 0.05 * (t / dur); zw, zh = int(BW * k), int(BH * k)
        fr = bgs[idx].resize((zw, zh), Image.LANCZOS)
        cxx, cyy = (zw - W) // 2, (zh - H) // 2
        fr = fr.crop((cxx, cyy, cxx + W, cyy + H)).convert("RGBA")
        p = ease_out_back(t / a.slide) if t < a.slide else 1.0
        yoff = int(round((1.0 - p) * H))
        tap = a.chrome_pressed and idx == len(seq) - 1 and tap_a <= t <= tap_b
        dy = 3 if tap else 0
        arr = final_pressed if tap else variants[idx]
        a_mul = min(t / 0.33, 1.0)
        shp = shadow
        if a_mul < 1.0:
            sa = np.asarray(shadow).copy(); sa[..., 3] = (sa[..., 3] * a_mul).astype(np.uint8)
            shp = Image.fromarray(sa, "RGBA")
        fr.alpha_composite(shp, (0, yoff + 22 + dy))
        lay = arr
        if a_mul < 1.0:
            lay = arr.copy(); lay[..., 3] = (lay[..., 3] * a_mul).astype(np.uint8)
        fr.alpha_composite(Image.fromarray(lay, "RGBA"), (0, yoff + dy))
        fr.convert("RGB").save(f"{frames}/f{f:04d}.png")

    silent = a.out + ".silent.mp4"
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-framerate", str(FPS),
                    "-i", f"{frames}/f%04d.png", "-c:v", "libx264", "-pix_fmt", "yuv420p",
                    "-crf", "18", "-movflags", "+faststart", silent], check=True)
    if a.no_audio:
        shutil.move(silent, a.out)
    else:
        aud = a.out + ".aud.wav"
        synth_audio(aud, dur, swaps, (tap_a + 0.05) if a.chrome_pressed else None)
        subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", silent, "-i", aud,
                        "-map", "0:v:0", "-map", "1:a:0", "-c:v", "copy", "-c:a", "aac",
                        "-b:a", "192k", "-shortest", a.out], check=True)
        os.remove(silent); os.remove(aud)
    shutil.rmtree(frames)
    print(f"wrote {a.out}  ({dur:.2f}s, {N} frames, {len(imgs)} images + final)")


if __name__ == "__main__":
    main()

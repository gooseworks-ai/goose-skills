"""The "filmed screen" look: footage framed as a screen photographed at close range, with a
thin bezel, the room falling away behind it, faint moire, vignette, grain and a slow
handheld drift. Used for screen inserts and screen walkthroughs (beat `look: "screen"`).

Geometry is CONSTRUCTED, not generated. Generated "blank screen" plates came back with the
monitor rotated to portrait or a hand and phone in shot; four parameters build it instead,
repeatably per beat:

  rot       degrees. Keep between -1.5 and 0: bigger angles were measured off a reference
            but read as a wonky camera and were rejected; alternating the angle between
            beats made it worse. Not exactly 0 either: a flat plate reads as a pasted
            screenshot, not a filmed screen.
  keystone  how much narrower the far edge is. ~0.007 for an insert over a creator,
            ~0.024 for a full walkthrough. 0.026 already reads as a deliberate tilt.
  fill      how much of the box the screen fills. Zoom OUT (~0.80); never in.
  fit       "height" fills the box height (source region near the box's aspect);
            "width" fits a complete UI panel by width and lets the dark room fill above
            and below. Forcing a wide panel into a tall box slices its edges.

The source region comes from the beat's `crop` [x0,y0,x1,y1] (fractions). `mask` boxes are
blurred in the SOURCE before cropping (an email in a sidebar), so they stay put whatever
the crop does.

Motion is generated, not held: the drift is two slow sines, so a settled page still moves
like a hand holding a phone.
"""
import math

import numpy as np
from PIL import Image, ImageDraw, ImageFilter

DEFAULTS = {"rot": -0.8, "keystone": 0.012, "fill": 0.86, "fit": "width", "bezel": 0.012,
            "drift": 1.0, "room": [7, 7, 9]}


def _coeffs(dst, src):
    m = []
    for (x, y), (u, v) in zip(dst, src):
        m.append([x, y, 1, 0, 0, 0, -u * x, -u * y])
        m.append([0, 0, 0, x, y, 1, -v * x, -v * y])
    return np.linalg.solve(np.array(m, float), np.array(sum(map(list, src), []), float))


class ScreenLook:
    def __init__(self, W, H, params=None, seed=0):
        p = dict(DEFAULTS, **(params or {}))
        self.W, self.H, self.p, self.seed = W, H, p, seed
        yy, xx = np.mgrid[0:H, 0:W].astype(np.float32)
        ang, period = 0.30, 3.1
        u = xx * math.cos(ang) + yy * math.sin(ang) + 0.8 * period * np.sin(yy * (2 * math.pi / (H * 0.7)))
        env = 0.5 + 0.5 * np.abs(np.sin(yy * (2 * math.pi / (H * 0.9))))
        self.moire = (1.0 + 0.016 * env * np.sin(u * (2 * math.pi / period)))[..., None]
        rr = np.hypot((xx - W / 2) / (W / 2), (yy - H / 2) / (H / 2))
        self.vig = np.clip(1.0 - 0.16 * rr ** 2.2, 0.70, 1.0)[..., None]
        rs = np.random.RandomState(seed)
        self.grain = [(rs.normal(0, 2.4, (H, W, 1)) + rs.normal(0, 1.2, (H, W, 3))).astype(np.float32)
                      for _ in range(4)]
        self.ph1 = 1.1 + (seed % 7) * 0.7
        self.ph2 = 2.3 + (seed % 5) * 1.3

    def _page(self, src, crop, masks):
        sw, sh = src.size
        if masks:
            src = src.copy()
            for mx0, my0, mx1, my1 in masks:
                box = (int(sw * mx0), int(sh * my0), int(sw * mx1), int(sh * my1))
                src.paste(src.crop(box).filter(ImageFilter.GaussianBlur(14)), box)
        x0, y0, x1, y1 = crop or (0, 0, 1, 1)
        return src.crop((int(sw * x0), int(sh * y0), int(sw * x1), int(sh * y1)))

    def render(self, src, t, k, crop=None, masks=None):
        """One frame: `src` PIL image, `t` seconds into the beat, `k` frame index."""
        W, H, p = self.W, self.H, self.p
        page = self._page(src, crop, masks)
        if p["fit"] == "width":
            tw = int(W * p["fill"])
            th = int(tw * page.height / page.width)
            if th > H * 0.98:
                th = int(H * 0.98)
                tw = int(th * page.width / page.height)
        else:
            th = int(H * p["fill"])
            tw = int(th * page.width / page.height)
            if tw > W * 1.30:
                tw = int(W * 1.30)
                th = int(tw * page.height / page.width)
        page = page.resize((max(2, tw), max(2, th)), Image.LANCZOS)
        dr = p["drift"]
        cx = W / 2 + dr * 0.006 * W * math.sin(2 * math.pi * 0.09 * t + self.ph1)
        cy = H / 2 + dr * 0.004 * H * math.sin(2 * math.pi * 0.15 * t + self.ph2)
        kk = p["keystone"] * tw
        quad = [(cx - tw / 2 + kk, cy - th / 2), (cx + tw / 2, cy - th / 2 + kk * 0.35),
                (cx + tw / 2 - kk * 0.30, cy + th / 2), (cx - tw / 2, cy + th / 2 - kk * 0.25)]
        r = math.radians(p["rot"])
        quad = [((qx - cx) * math.cos(r) - (qy - cy) * math.sin(r) + cx,
                 (qx - cx) * math.sin(r) + (qy - cy) * math.cos(r) + cy) for qx, qy in quad]
        warped = page.transform((W, H), Image.PERSPECTIVE,
                                _coeffs(quad, [(0, 0), (tw, 0), (tw, th), (0, th)]), Image.BICUBIC)
        room = tuple(p["room"])
        layer = Image.new("RGB", (W, H), room)
        bez = Image.new("L", (W, H), 0)
        ImageDraw.Draw(bez).polygon([(int(qx + (qx - cx) * p["bezel"]), int(qy + (qy - cy) * p["bezel"]))
                                     for qx, qy in quad], fill=255)
        layer.paste(Image.new("RGB", (W, H), (14, 14, 17)), (0, 0), bez)
        mask = Image.new("L", (W, H), 0)
        ImageDraw.Draw(mask).polygon([tuple(map(int, q)) for q in quad], fill=255)
        layer.paste(warped, (0, 0), mask)
        arr = np.asarray(layer).astype(np.float32)
        m = np.asarray(mask).astype(np.float32)[..., None] / 255.0
        arr *= self.moire * m + (1 - m)
        arr *= self.vig
        arr += self.grain[k % len(self.grain)]
        return Image.fromarray(np.clip(arr, 0, 255).astype(np.uint8))

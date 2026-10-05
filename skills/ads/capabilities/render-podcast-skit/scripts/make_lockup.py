#!/usr/bin/env python3
"""Draw the corner lockup from the brand block. Free.

    make_lockup.py --config config.json --run-dir <run>

WHY THIS EXISTS
`brand.lockup_file` has to be a real file on disk or `gate_frame_brand_asset`
refuses the run, and for the first three brands that file was drawn by hand in
a throwaway script each time. Three is the point at which it stops being a
one-off.

WHAT IT DOES NOT DO
It does not invent a logo. It sets the brand's own name in the brand's own
`display_font`, which is the same thing the editorial end card does, so the
frame mark and the end card are one brand. A client with a real lockup supplies
it and this is skipped: if `brand.lockup_file` already exists, nothing is
overwritten unless `--force`.

The rule that brand type is never drawn by a GENERATOR is about image models
garbling lettering. Exact type from a real font is not that.
"""
from __future__ import annotations

import argparse
import pathlib
import sys

from PIL import Image, ImageDraw, ImageFont

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
import config_io  # noqa: E402


def hex_rgba(s, alpha=240):
    s = (s or "#FFFFFF").lstrip("#")
    return tuple(int(s[i:i + 2], 16) for i in (0, 2, 4)) + (alpha,)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--config", required=True)
    config_io.add_arg(ap)
    ap.add_argument("--run-dir", required=True)
    ap.add_argument("--size", type=int, default=42)
    ap.add_argument("--force", action="store_true")
    a = ap.parse_args()

    cfg = config_io.load(a.config, a.preset)
    br = cfg.get("brand") or {}
    run = pathlib.Path(a.run_dir)
    rel = br.get("lockup_file") or (cfg.get("edit", {})
                                    .get("frame_brand", {}).get("lockup_file"))
    if not rel:
        sys.exit("[err] no brand.lockup_file in the config; nothing to draw")
    out = run / rel
    if out.exists() and not a.force:
        print(f"  {out} already exists; left alone (--force to redraw)")
        return 0

    name = br.get("name") or cfg["brand_name"]
    face = br.get("display_font")
    if not face or not pathlib.Path(face).exists():
        sys.exit(f"[err] brand.display_font is missing or not on disk: {face!r}. "
                 f"The lockup is set in the brand's own face, so there has to "
                 f"be one.")
    font = ImageFont.truetype(face, a.size)
    ink = hex_rgba(br.get("ink_hex"), 240)

    probe = ImageDraw.Draw(Image.new("RGBA", (8, 8)))
    w = int(probe.textlength(name, font=font)) + 24
    h = int(a.size * 1.75)
    img = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    bb = d.textbbox((0, 0), name, font=font)
    x = (w - (bb[2] - bb[0])) // 2 - bb[0]
    y = (h - (bb[3] - bb[1])) // 2 - bb[1]
    # a soft drop so the mark holds on a light wall as well as a dark one
    d.text((x + 1, y + 2), name, font=font, fill=(0, 0, 0, 120))
    d.text((x, y), name, font=font, fill=ink)

    out.parent.mkdir(parents=True, exist_ok=True)
    img.save(out)
    print(f"  {name} set in {pathlib.Path(face).name} -> {out} ({w}x{h})")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

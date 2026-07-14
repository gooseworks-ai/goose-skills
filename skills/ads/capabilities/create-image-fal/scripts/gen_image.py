#!/usr/bin/env python3
"""Generate/edit an image via any FAL image model (nano-banana, gpt-image, flux, ...),
ROUTED THROUGH THE PROXY (bills the Ads agent). image_urls entries must be PUBLIC urls.

  gen_image.py --model fal-ai/nano-banana/edit \
      --payload '{"prompt":"...","image_urls":["https://..."],"aspect_ratio":"9:16"}' \
      --out keyframe.png

The FAL result codec is NOT guaranteed to match the requested extension (Seedream, for
one, returns a JPEG). We sniff the downloaded bytes and, if they disagree with the
extension, transcode to match — so `--out foo.png` is always really a PNG and a strict
downstream consumer (or a file-type check) never trips.
"""
import argparse, json, os
from media_proxy import fal_generate, download

_MAGIC = [
    (b"\x89PNG\r\n\x1a\n", "png"),
    (b"\xff\xd8\xff", "jpeg"),
    (b"GIF8", "gif"),
]


def _sniff(path):
    with open(path, "rb") as f:
        head = f.read(16)
    if head[:4] == b"RIFF" and head[8:12] == b"WEBP":
        return "webp"
    for magic, name in _MAGIC:
        if head.startswith(magic):
            return name
    return None


def _reconcile_extension(path):
    """Return a note. Transcode the file in place if its bytes don't match its extension."""
    actual = _sniff(path)
    requested = os.path.splitext(path)[1].lower().lstrip(".")
    requested = {"jpg": "jpeg"}.get(requested, requested)
    if not actual or not requested or actual == requested:
        return None
    try:
        from PIL import Image
        img = Image.open(path)
        if requested == "jpeg":
            img.convert("RGB").save(path, "JPEG", quality=95)
        elif requested == "png":
            img.save(path, "PNG")
        elif requested == "webp":
            img.save(path, "WEBP", quality=95)
        else:
            return f"WARNING: bytes are {actual} but extension is .{requested} (no transcoder for it)"
        return f"transcoded {actual} -> {requested} to match extension"
    except Exception as e:  # PIL missing or decode failure — don't fail the render, just warn
        return f"WARNING: bytes are {actual} but extension is .{requested} (transcode unavailable: {e})"


ap = argparse.ArgumentParser()
ap.add_argument("--model", required=True)
ap.add_argument("--payload", required=True, help="JSON string, or @path to a JSON file")
ap.add_argument("--out", required=True)
a = ap.parse_args()
payload = json.load(open(a.payload[1:])) if a.payload.startswith("@") else json.loads(a.payload)
url = fal_generate(a.model, payload)
download(url, a.out)
note = _reconcile_extension(a.out)
result = {"image_url": url, "out": a.out}
if note:
    result["note"] = note
print(json.dumps(result))

#!/usr/bin/env python3
"""Generate/edit an image via any FAL image model (nano-banana, gpt-image, flux, ...),
ROUTED THROUGH THE PROXY (bills the Ads agent). image_urls entries must be PUBLIC urls.

  gen_image.py --model fal-ai/nano-banana/edit \
      --payload '{"prompt":"...","image_urls":["https://..."],"aspect_ratio":"9:16"}' \
      --out keyframe.png

  # an edit of local files: each --image is a public url, or a local file that is put
  # on the fal CDN first (free, through the GooseWorks storage proxy)
  gen_image.py --model fal-ai/nano-banana/edit --image product.png --image scene.jpg \
      --payload '{"prompt":"Place the product on the counter; keep everything else unchanged"}' \
      --out edit.png

  # the brand's own product held or used on screen: GPT Image 2 edit, the real product photo
  # as image 1 with its front to the camera; a blank-pack prompt is refused before any call
  gen_image.py --model openai/gpt-image-2/edit --brand-product held --product-image pack-front.jpg \
      --image presenter.png --payload '{"prompt":"She tips the pouch into the pot..."}' --out pour.png

The FAL result codec is NOT guaranteed to match the requested extension (Seedream, for
one, returns a JPEG). We sniff the downloaded bytes and, if they disagree with the
extension, transcode to match — so `--out foo.png` is always really a PNG and a strict
downstream consumer (or a file-type check) never trips.
"""
import argparse, json, os
from brand_pack_lint import lint_brand_pack, with_front_line
from media_proxy import fal_generate, fal_upload, download

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


def resolve_images(images, upload):
    """Public urls pass through; a local file is uploaded with `upload` and its url used."""
    urls = []
    for item in images:
        if item.startswith(("https://", "http://", "data:")):
            urls.append(item)
        elif os.path.isfile(item):
            urls.append(upload(item))
        else:
            raise SystemExit(f"--image {item!r} is neither a url nor a file")
    return urls


ap = argparse.ArgumentParser()
ap.add_argument("--model", required=True)
ap.add_argument("--payload", required=True, help="JSON string, or @path to a JSON file")
ap.add_argument("--image", action="append", default=[],
                help="Input image for an edit: a public url or a local file (repeatable, in order)")
ap.add_argument("--out", required=True)
ap.add_argument("--brand-product", choices=["static", "held"], default=None,
                help="the picture shows the brand's own product: static (on a surface) or held (held, opened, "
                     "poured or used on screen). A blank-pack prompt is refused; held needs openai/gpt-image-2/edit "
                     "and --product-image")
ap.add_argument("--product-image", default=None,
                help="the real product photo (url or local file), sent as image 1 with --brand-product held")
a = ap.parse_args()
payload = json.load(open(a.payload[1:])) if a.payload.startswith("@") else json.loads(a.payload)
if a.product_image and a.brand_product != "held":
    raise SystemExit("--product-image goes with --brand-product held")
if a.brand_product:
    # Checked before anything is uploaded or paid for.
    problems = lint_brand_pack(payload.get("prompt", ""), a.brand_product, a.model, None, a.product_image)
    if problems:
        raise SystemExit("refused, nothing sent:\n- " + "\n- ".join(problems))
    if a.brand_product == "held":
        payload["prompt"] = with_front_line(payload.get("prompt", ""))
images = ([a.product_image] if a.product_image else []) + a.image
if images:
    resolved = resolve_images(images, fal_upload)
    if a.product_image:  # the real product photo is image 1
        payload["image_urls"] = resolved[:1] + list(payload.get("image_urls") or []) + resolved[1:]
    else:
        payload["image_urls"] = list(payload.get("image_urls") or []) + resolved
url = fal_generate(a.model, payload)
download(url, a.out)
note = _reconcile_extension(a.out)
result = {"image_url": url, "out": a.out}
if note:
    result["note"] = note
print(json.dumps(result))

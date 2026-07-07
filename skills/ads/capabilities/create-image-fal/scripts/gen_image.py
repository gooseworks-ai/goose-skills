#!/usr/bin/env python3
"""Generate/edit an image via any FAL image model (nano-banana, gpt-image, flux, ...),
ROUTED THROUGH THE PROXY (bills the Ads agent). image_urls entries must be PUBLIC urls.

  gen_image.py --model fal-ai/nano-banana/edit \
      --payload '{"prompt":"...","image_urls":["https://..."],"aspect_ratio":"9:16"}' \
      --out keyframe.png
"""
import argparse, json
from media_proxy import fal_generate, download

ap = argparse.ArgumentParser()
ap.add_argument("--model", required=True)
ap.add_argument("--payload", required=True, help="JSON string, or @path to a JSON file")
ap.add_argument("--out", required=True)
a = ap.parse_args()
payload = json.load(open(a.payload[1:])) if a.payload.startswith("@") else json.loads(a.payload)
url = fal_generate(a.model, payload)
download(url, a.out)
print(json.dumps({"image_url": url, "out": a.out}))

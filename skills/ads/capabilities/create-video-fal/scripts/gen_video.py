#!/usr/bin/env python3
"""Image-to-video (or t2v) via any FAL video model, ROUTED THROUGH THE PROXY (bills the
Ads agent). image_url must be a PUBLIC url (orchestrator hosts local frames via MCP
get_upload_url -> get_download_url). Model + params come from the template recipe.

  gen_video.py --model fal-ai/kling-video/v2.1/standard/image-to-video \
      --payload '{"prompt":"...","image_url":"https://...","duration":"10","cfg_scale":0.5}' \
      --out clip.mp4
"""
import argparse, json
from media_proxy import fal_generate_video, download

ap = argparse.ArgumentParser()
ap.add_argument("--model", required=True)
ap.add_argument("--payload", required=True, help="JSON string, or @path to a JSON file")
ap.add_argument("--out", required=True)
a = ap.parse_args()
payload = json.load(open(a.payload[1:])) if a.payload.startswith("@") else json.loads(a.payload)
url = fal_generate_video(a.model, payload)
download(url, a.out)
print(json.dumps({"video_url": url, "out": a.out}))

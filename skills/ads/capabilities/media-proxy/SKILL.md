---
name: media-proxy
description: Shared helper that routes ALL paid media generation (FAL image/video, ElevenLabs music) through the GooseWorks proxies so every call bills the Ads agent — never a provider SDK's default host. Host-swaps the FAL queue URLs, loads the agent token from ~/.gooseworks/credentials.json, and returns the result CDN URL. Every video-ad media capability imports this; templates never call a provider directly.
status: active
---

# media-proxy

The foundation capability for paid media in the video-ad pipeline. It fixes the
auth-path conflict where engine scripts called FAL/ElevenLabs **directly** (billing
the wrong account): all paid calls now go through
`<api_base>/api/internal/{fal-proxy,elevenlabs-proxy}` with `?token=&agent_id=`, which
**bills the Ads agent**.

## Use it

```python
from media_proxy import fal_generate, fal_generate_video, eleven_music, download

# image (nano-banana / gpt-image / etc.) — inputs must be PUBLIC urls
img = fal_generate("fal-ai/nano-banana/edit",
                   {"prompt": p, "image_urls": [product_url], "aspect_ratio": "9:16"})
# video i2v (kling / seedance / veo)
vid = fal_generate_video("fal-ai/kling-video/v2.1/standard/image-to-video",
                         {"prompt": p, "image_url": keyframe_url, "duration": "10"})
# music bed
eleven_music(prompt, 10500, "music.mp3", force_instrumental=True)
```

## Contracts (load-bearing)

- **Bills the Ads agent** — `?token=&agent_id=` from `~/.gooseworks/credentials.json`
  (the CLI writes it; run `gooseworks login` if missing).
- **Host-swap the FAL queue URLs** — submit returns `status_url`/`response_url` on
  `queue.fal.run`; the helper rewrites them to the proxy base (keeps the path). Never
  poll `queue.fal.run` directly (401 + burns credits).
- **FAL inputs that are local files must be PUBLIC urls.** The orchestrator hosts a
  local image/audio via the MCP `get_upload_url` → `get_download_url` presigned URL and
  passes THAT url in. This module does not do MCP uploads (prefer the presigned url;
  `fal-storage-proxy` may 404).
- **Only the final `*.fal.media` url is a real public URL** — everything else is behind
  the proxy.

## Related
- Used by `create-image-fal`, `create-video-fal`, `create-music-elevenlabs`.
- The `goose-video` orchestrator hosts local inputs (MCP upload → presign) before calling these.

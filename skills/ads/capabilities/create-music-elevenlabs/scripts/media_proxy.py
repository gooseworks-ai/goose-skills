#!/usr/bin/env python3
"""Route paid media generation (FAL + ElevenLabs) through the GooseWorks proxies so
every call BILLS THE ADS AGENT — never call a provider SDK's default host (your token
isn't a FAL/ElevenLabs token → 401).

Base = <api_base>/api/internal/<proxy>, with ?token=&agent_id= (+ &project_id= when
GW_PROJECT_ID is set, so spend attributes to the ad project) on every request.
FAL submit returns status_url/response_url on the REAL host (queue.fal.run); we
host-swap them to the proxy base (keep the path) or polling 401s forever and burns
credits. Credentials load from ~/.gooseworks/credentials.json (the CLI writes it).

This is the shared helper every media capability imports. Import it, don't reinvent.

  from media_proxy import fal_generate, fal_generate_video, eleven_music

FAL inputs that are local files (a product image, an audio track) must be a PUBLIC
URL — the orchestrator hosts them via the MCP `get_upload_url` → `get_download_url`
presigned URL and passes that URL in; this module does NOT do MCP uploads.
"""
import json
import os
import pathlib
import time
import urllib.request
from urllib.parse import urlparse

import requests


def _cfg():
    p = pathlib.Path(os.path.expanduser("~/.gooseworks/credentials.json"))
    c = json.loads(p.read_text())
    return c["api_base"].rstrip("/"), c["api_key"], c.get("agent_id")


def _params(tok, agent):
    p = {"token": tok}
    if agent:
        p["agent_id"] = agent
    # Attribute this generation's credits to the ad project so per-project spend shows in
    # the app. The goose-video orchestrator sets GW_PROJECT_ID = the project being rendered.
    pid = os.environ.get("GW_PROJECT_ID")
    if pid:
        p["project_id"] = pid
    return p


_FAL_RESULT_KEYS = ("images", "videos", "video", "audio", "image", "output",
                    "status_url", "status", "seed", "url")


def _raise_if_fal_error(resp, model_path):
    """FAL/proxy errors come back as a dict carrying `detail`/`error`/`message` and NO
    result payload. Surface the real reason (content-policy block, 'path not found',
    NSFW, quota) instead of letting a downstream ["images"][0] raise a cryptic KeyError."""
    if not isinstance(resp, dict):
        raise RuntimeError(f"FAL returned a non-object response for {model_path}: {str(resp)[:400]}")
    if any(k in resp for k in _FAL_RESULT_KEYS):
        return
    for key in ("detail", "error", "message"):
        if resp.get(key):
            msg = resp[key]
            if isinstance(msg, list):
                msg = "; ".join(
                    str(m.get("msg") or m.get("message") or m) if isinstance(m, dict) else str(m)
                    for m in msg)
            elif isinstance(msg, dict):
                msg = msg.get("message") or msg.get("detail") or json.dumps(msg)
            raise RuntimeError(f"FAL error for {model_path}: {msg}")


def _fal_run(model_path, payload, timeout_s=600, poll_s=3):
    """Submit a FAL job through the proxy, poll to completion, return the raw result
    dict. `model_path` e.g. 'fal-ai/kling-video/v2.1/standard/image-to-video'."""
    api_base, tok, agent = _cfg()
    base = api_base + "/api/internal/fal-proxy"
    params = _params(tok, agent)
    sub = requests.post(f"{base}/{model_path}", params=params, json=payload, timeout=120).json()
    _raise_if_fal_error(sub, model_path)
    if "status_url" not in sub:  # some models return a result synchronously
        return sub
    to_proxy = lambda u: base + urlparse(u).path
    status_url, response_url = to_proxy(sub["status_url"]), to_proxy(sub["response_url"])
    deadline = time.time() + timeout_s
    while time.time() < deadline:
        st = requests.get(status_url, params=params, timeout=60).json()
        s = st.get("status")
        if s == "COMPLETED":
            out = requests.get(response_url, params=params, timeout=120).json()
            _raise_if_fal_error(out, model_path)
            return out
        if s in ("FAILED", "ERROR"):
            raise RuntimeError(f"FAL failed: {st}")
        time.sleep(poll_s)
    raise TimeoutError(f"FAL polling exceeded {timeout_s}s for {model_path}")


def fal_generate(model_path, payload, **kw):
    """Image models → returns the first result image URL (public *.fal.media CDN)."""
    r = _fal_run(model_path, payload, **kw)
    imgs = r.get("images") if isinstance(r, dict) else None
    if not imgs:
        raise RuntimeError(f"FAL returned no image for {model_path}: {str(r)[:400]}")
    return imgs[0]["url"]


def fal_generate_video(model_path, payload, **kw):
    """Video (i2v/t2v) models → returns the result video URL."""
    r = _fal_run(model_path, payload, **kw)
    url = (r.get("video") or {}).get("url") if isinstance(r, dict) else None
    if not url:
        vids = r.get("videos") if isinstance(r, dict) else None
        url = vids[0]["url"] if vids else None
    if not url:
        raise RuntimeError(f"FAL returned no video for {model_path}: {str(r)[:400]}")
    return url


def eleven_music(prompt, music_length_ms, out_path, force_instrumental=True, timeout_s=180):
    """ElevenLabs Music through the proxy → writes the mp3 to out_path, returns it."""
    api_base, tok, agent = _cfg()
    url = api_base + "/api/internal/elevenlabs-proxy/v1/music"
    r = requests.post(url, params=_params(tok, agent), timeout=timeout_s,
                      json={"prompt": prompt, "music_length_ms": int(music_length_ms),
                            "force_instrumental": force_instrumental})
    r.raise_for_status()
    pathlib.Path(out_path).write_bytes(r.content)
    return out_path


def download(url, out_path):
    """Fetch a public result URL to disk."""
    urllib.request.urlretrieve(url, out_path)
    return out_path


def eleven_tts(text, voice_id, out_path, model_id="eleven_v3", timeout_s=180):
    """ElevenLabs text-to-speech (VO) through the proxy → writes mp3 to out_path."""
    api_base, tok, agent = _cfg()
    url = api_base + f"/api/internal/elevenlabs-proxy/v1/text-to-speech/{voice_id}"
    r = requests.post(url, params=_params(tok, agent), timeout=timeout_s,
                      json={"text": text, "model_id": model_id})
    r.raise_for_status()
    pathlib.Path(out_path).write_bytes(r.content)
    return out_path

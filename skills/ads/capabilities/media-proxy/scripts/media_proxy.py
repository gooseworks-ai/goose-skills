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


def _fal_run(model_path, payload, timeout_s=600, poll_s=3):
    """Submit a FAL job through the proxy, poll to completion, return the raw result
    dict. `model_path` e.g. 'fal-ai/kling-video/v2.1/standard/image-to-video'."""
    api_base, tok, agent = _cfg()
    base = api_base + "/api/internal/fal-proxy"
    params = _params(tok, agent)
    sub = requests.post(f"{base}/{model_path}", params=params, json=payload, timeout=120).json()
    if "status_url" not in sub:  # some models return a result synchronously
        return sub
    to_proxy = lambda u: base + urlparse(u).path
    status_url, response_url = to_proxy(sub["status_url"]), to_proxy(sub["response_url"])
    deadline = time.time() + timeout_s
    while time.time() < deadline:
        st = requests.get(status_url, params=params, timeout=60).json()
        s = st.get("status")
        if s == "COMPLETED":
            return requests.get(response_url, params=params, timeout=120).json()
        if s in ("FAILED", "ERROR"):
            raise RuntimeError(f"FAL failed: {st}")
        time.sleep(poll_s)
    raise TimeoutError(f"FAL polling exceeded {timeout_s}s for {model_path}")


def fal_generate(model_path, payload, **kw):
    """Image models → returns the first result image URL (public *.fal.media CDN)."""
    return _fal_run(model_path, payload, **kw)["images"][0]["url"]


def fal_generate_video(model_path, payload, **kw):
    """Video (i2v/t2v) models → returns the result video URL."""
    r = _fal_run(model_path, payload, **kw)
    return (r.get("video") or {}).get("url") or r["videos"][0]["url"]


def fal_whisper(audio_url, language="en", **kw):
    """fal-ai/whisper (word-level) through the proxy → [{text, start, end}, ...].

    `audio_url` MUST be a PUBLIC url (this module does not upload) — the orchestrator
    hosts the local VO via MCP `get_upload_url` → `get_download_url` and passes that
    presigned url in. Proxy-routed, so it bills the Ads agent (never a raw FAL_KEY)."""
    r = _fal_run("fal-ai/whisper", {"audio_url": audio_url, "task": "transcribe",
                                    "language": language, "chunk_level": "word"}, **kw)
    words = []
    for ch in r.get("chunks", []):
        ts = ch.get("timestamp") or [None, None]
        words.append({"text": (ch.get("text") or "").strip(), "start": ts[0], "end": ts[1]})
    return words


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

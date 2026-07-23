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

Every paid call is auto-logged to the app for diagnostics (GOOSE-2862) — successes
as a `generation` trail, failures as an `api_failure` with the error + prompt — so a
local skill run isn't a black box. Import `gw_log(...)` to log your own steps/issues
and `run_id()` to read the current run id. Best-effort; never breaks a render.

FAL inputs that are local files (a product image, an audio track) must be a PUBLIC
URL — the orchestrator hosts them via the MCP `get_upload_url` → `get_download_url`
presigned URL and passes that URL in; this module does NOT do MCP uploads.
"""
import json
import os
import pathlib
import time
import urllib.request
import uuid
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


# ── CLI/skill run diagnostics (GOOSE-2862) ───────────────────────────────────
# A skill running in a LOCAL agent (Claude Code, Cursor, …) is otherwise a black
# box. `gw_log` POSTs a diagnostic event to the app (`/api/internal/cli-logs`,
# same creds as the media proxies) so the team can see what happened — and, when
# a paid call FAILS, exactly why. Every media capability imports this module, so
# instrumenting here covers video, static images, and audio in one place.
#
# Best-effort by contract: a logging failure (bad creds, offline backend, slow
# endpoint) must NEVER break a render — every path swallows its own errors. Set
# GW_CLI_LOG_DISABLED=1 to turn it off. The agent can also log richer, non-media
# events itself via the `log_cli_event` MCP tool; both land in the same table.
_RUN_ID = os.environ.get("GW_RUN_ID") or f"run-{uuid.uuid4().hex[:12]}"


def run_id():
    """This run's id — env GW_RUN_ID if the orchestrator set one, else a stable
    per-process id. Groups every event (agent-logged + auto-logged) from one run."""
    return _RUN_ID


def gw_log(message, event_type="info", level="info", *, skill=None, provider=None,
           model=None, duration_ms=None, details=None):
    """Record one diagnostic event for this run. Fire-and-forget; never raises.

    event_type: info | step | generation | api_failure | error | blocker |
                missing_input | confusion
    """
    if os.environ.get("GW_CLI_LOG_DISABLED"):
        return
    try:
        api_base, tok, agent = _cfg()
    except Exception:
        return  # no creds → nothing to attribute the event to
    body = {"run_id": _RUN_ID, "message": str(message)[:4000],
            "event_type": event_type, "level": level, "source": "cli"}
    skill = skill or os.environ.get("GW_SKILL")
    if skill:
        body["skill"] = skill
    if provider:
        body["provider"] = provider
    if model:
        body["model"] = model
    if duration_ms is not None:
        body["duration_ms"] = int(duration_ms)
    if details is not None:
        body["details"] = details
    try:
        requests.post(api_base + "/api/internal/cli-logs",
                      params=_params(tok, agent), json=body, timeout=5)
    except Exception:
        pass  # diagnostics must never break a render


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


# ── Crash-resume: persist submitted jobs + poll through backend outages ──────
# A FAL submit BILLS immediately, but the local backend (:5999) can blip mid-render
# (a ~4-min Seedance take outlives a flaky proxy). Two protections so a blip never
# loses a paid render or forces a double-billing re-submit:
#   1. persist {request_id, status_url, response_url} at submit → resume_fal() can
#      re-attach by request-id later (never re-submits).
#   2. the poll loop RETRIES the same URL through connection-refused / timeout blips
#      instead of crashing.
_PENDING_DIR = pathlib.Path(os.path.expanduser("~/.gooseworks/pending-fal-jobs"))
_TRANSIENT = (requests.ConnectionError, requests.Timeout,
              requests.exceptions.ChunkedEncodingError)


def _pending_path(request_id):
    return _PENDING_DIR / f"{request_id}.json"


def _persist_pending(model_path, request_id, status_url, response_url):
    if not request_id:
        return
    try:  # best-effort — never block a render on bookkeeping
        _PENDING_DIR.mkdir(parents=True, exist_ok=True)
        _pending_path(request_id).write_text(json.dumps({
            "model_path": model_path, "request_id": request_id,
            "status_url": status_url, "response_url": response_url,
            "project_id": os.environ.get("GW_PROJECT_ID"), "ts": int(time.time()),
        }))
    except OSError:
        pass


def _clear_pending(request_id):
    try:
        _pending_path(request_id).unlink()
    except OSError:
        pass


def _poll_get(url, params, deadline, what):
    """GET that RE-ATTACHES through transient backend outages until the deadline —
    a proxy blip must not kill an already-submitted+billed job."""
    last = None
    while time.time() < deadline:
        try:
            return requests.get(url, params=params, timeout=60)
        except _TRANSIENT as e:
            last = e
            time.sleep(3)  # backend is down/reconnecting — keep re-attaching
    raise TimeoutError(f"FAL {what} unreachable through the outage: {last}")


def _poll_to_result(model_path, status_url, response_url, params, timeout_s, poll_s):
    deadline = time.time() + timeout_s
    while time.time() < deadline:
        st = _poll_get(status_url, params, deadline, "status").json()
        s = st.get("status")
        if s == "COMPLETED":
            out = _poll_get(response_url, params, deadline, "result").json()
            _raise_if_fal_error(out, model_path)
            return out
        if s in ("FAILED", "ERROR"):
            raise RuntimeError(f"FAL failed: {st}")
        time.sleep(poll_s)
    raise TimeoutError(f"FAL polling exceeded {timeout_s}s for {model_path}")


def _fal_run(model_path, payload, timeout_s=600, poll_s=3):
    """Submit a FAL job through the proxy, poll to completion (surviving backend blips),
    return the raw result dict. `model_path` e.g. 'fal-ai/kling-video/.../image-to-video'."""
    api_base, tok, agent = _cfg()
    base = api_base + "/api/internal/fal-proxy"
    params = _params(tok, agent)
    t0 = time.time()
    prompt = payload.get("prompt") if isinstance(payload, dict) else None
    try:
        sub = requests.post(f"{base}/{model_path}", params=params, json=payload, timeout=120).json()
        _raise_if_fal_error(sub, model_path)
        if "status_url" not in sub:  # some models return a result synchronously
            gw_log(f"FAL {model_path} completed (sync)", "generation", provider="fal",
                   model=model_path, duration_ms=(time.time() - t0) * 1000)
            return sub
        to_proxy = lambda u: base + urlparse(u).path
        status_url, response_url = to_proxy(sub["status_url"]), to_proxy(sub["response_url"])
        request_id = sub.get("request_id") or urlparse(sub["response_url"]).path.rstrip("/").rsplit("/", 1)[-1]
        _persist_pending(model_path, request_id, status_url, response_url)
        result = _poll_to_result(model_path, status_url, response_url, params, timeout_s, poll_s)
        _clear_pending(request_id)
        gw_log(f"FAL {model_path} completed", "generation", provider="fal",
               model=model_path, duration_ms=(time.time() - t0) * 1000,
               details={"request_id": request_id})
        return result
    except Exception as e:
        # Auto-log the failure so a stuck/broken model is visible upstream, then
        # re-raise unchanged (the caller's error handling is untouched).
        gw_log(f"FAL {model_path} failed: {e}", "api_failure", level="error",
               provider="fal", model=model_path, duration_ms=(time.time() - t0) * 1000,
               details={"prompt": (str(prompt)[:1000] if prompt else None),
                        "payload_keys": sorted(payload.keys()) if isinstance(payload, dict) else None,
                        "error": str(e)[:2000]})
        raise


def resume_fal(request_id, timeout_s=600, poll_s=3):
    """Re-attach to an already-submitted FAL job by request-id (after a mid-poll backend
    crash) using the pending record persisted at submit. NEVER re-submits → can't
    double-bill. Returns the raw result dict; clears the pending record on success."""
    rec = json.loads(_pending_path(request_id).read_text())
    _, tok, agent = _cfg()
    params = _params(tok, agent)
    result = _poll_to_result(rec["model_path"], rec["status_url"], rec["response_url"],
                             params, timeout_s, poll_s)
    _clear_pending(request_id)
    return result


def list_pending():
    """Submitted-but-not-yet-finished FAL jobs (resume candidates after a crash)."""
    if not _PENDING_DIR.exists():
        return []
    out = []
    for p in sorted(_PENDING_DIR.glob("*.json")):
        try:
            out.append(json.loads(p.read_text()))
        except (OSError, json.JSONDecodeError):
            pass
    return out


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
    t0 = time.time()
    try:
        r = requests.post(url, params=_params(tok, agent), timeout=timeout_s,
                          json={"prompt": prompt, "music_length_ms": int(music_length_ms),
                                "force_instrumental": force_instrumental})
        r.raise_for_status()
    except Exception as e:
        gw_log(f"ElevenLabs music failed: {e}", "api_failure", level="error",
               provider="elevenlabs", model="music", duration_ms=(time.time() - t0) * 1000,
               details={"prompt": str(prompt)[:500], "error": str(e)[:2000],
                        "status": getattr(getattr(e, "response", None), "status_code", None)})
        raise
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
    t0 = time.time()
    try:
        r = requests.post(url, params=_params(tok, agent), timeout=timeout_s,
                          json={"text": text, "model_id": model_id})
        r.raise_for_status()
    except Exception as e:
        gw_log(f"ElevenLabs TTS failed: {e}", "api_failure", level="error",
               provider="elevenlabs", model=model_id, duration_ms=(time.time() - t0) * 1000,
               details={"voice_id": voice_id, "text": str(text)[:500], "error": str(e)[:2000],
                        "status": getattr(getattr(e, "response", None), "status_code", None)})
        raise
    pathlib.Path(out_path).write_bytes(r.content)
    return out_path

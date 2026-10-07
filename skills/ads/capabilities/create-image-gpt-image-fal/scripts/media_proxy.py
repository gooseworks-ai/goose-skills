#!/usr/bin/env python3
"""Route paid media generation (FAL + ElevenLabs) through the GooseWorks proxies so
every call BILLS THE ADS AGENT — never call a provider SDK's default host (your token
isn't a FAL/ElevenLabs token → 401).

Base = <api_base>/api/internal/<proxy>, with ?token=&agent_id= (+ &project_id= when
GW_PROJECT_ID is set, so spend attributes to the ad project) on every request.
FAL submit returns status_url/response_url on the REAL host (queue.fal.run); we
host-swap them to the proxy base (keep the path) or polling 401s forever and burns
credits. Credentials: in a GooseWorks cloud sandbox (coworker chat) the backend injects
GW_MEDIA_PROXY_TOKEN (a per-session token that already binds agent/org/user) + GW_API_BASE
— those win. Otherwise (a local CLI run) they load from ~/.gooseworks/credentials.json.

This is the shared helper every media capability imports. Import it, don't reinvent.

  from media_proxy import fal_generate, fal_generate_video, eleven_music

Every paid call is auto-logged to the app for diagnostics (GOOSE-2862) — successes
as a `generation` trail, failures as an `api_failure` with the error + prompt — so a
local skill run isn't a black box. Import `gw_log(...)` to log your own steps/issues
and `run_id()` to read the current run id. Best-effort; never breaks a render.

`input_digest(model, args)` names the exact inputs of a generation (GOOSE-3731):
pass it with the MCP `media_upload` of the result (plus an `ingredient_key`), so a
resumed run reuses the saved file only when the digest still matches. Pass the SAME
digest to the FAL submit (`fal_generate(..., input_digest=d)`) so a resumed run that
re-submits the job (inputs re-uploaded -> new URLs) re-attaches to it instead of
paying twice (GOOSE-3729).

FAL inputs that are local files (a product image, an audio track) must be a PUBLIC
URL — `fal_upload(path)` puts a local file on the fal CDN through the fal-storage-proxy
(free) and returns that URL; the MCP `get_upload_url` → `get_download_url` presigned URL
also works.

MCP RELAY (no credentials at all). A session that only has the GooseWorks MCP connector
(no GW_MEDIA_PROXY_TOKEN and no ~/.gooseworks/credentials.json) cannot call the proxies
over HTTP. Then (or when GW_MEDIA_VIA=mcp) every paid call is RELAYED through the agent:
the script writes the exact MCP tool call to working/mcp-requests/<kind>-<hash>.json and
exits with code 3; the agent makes it (data_post_provider [+ job_get] for fal/ElevenLabs,
media_upload for a local file), saves the result JSON where the request says, and
re-runs the same command. Same server proxy, same price, billed to GW_PROJECT_ID.
GW_MEDIA_VIA=proxy forces the HTTP path.
"""
import hashlib
import json
import os
import pathlib
import sys
import time
import urllib.request
import uuid
from urllib.parse import urlparse

import requests


_CREDS_PATH = "~/.gooseworks/credentials.json"


def _base_from_proxy_url(url):
    """'https://api.x/api/internal/fal-proxy' → 'https://api.x' (None if not a proxy URL)."""
    if not url:
        return None
    u = url.rstrip("/")
    i = u.find("/api/internal/")
    return u[:i] if i > 0 else None


def _checked_origin(base):
    expected = os.environ.get("GW_EXPECTED_API_ORIGIN")
    if expected and base.rstrip("/") != expected.rstrip("/"):
        raise RuntimeError("Selected connection and HTTP proxy origins differ. Set GW_MEDIA_VIA=mcp; do not switch credentials or environments.")
    return base.rstrip("/")


def _cfg():
    """(api_base, token, agent_id).

    Cloud sandbox: GW_MEDIA_PROXY_TOKEN is a per-chat-session proxy token minted by the
    backend — it already carries the billing agent/org/user, so agent_id is None (the
    proxy ignores ?agent_id= for agent-scoped tokens). api_base = GW_API_BASE, else
    derived from GW_FAL_PROXY_URL. Local CLI: ~/.gooseworks/credentials.json."""
    env_tok = os.environ.get("GW_MEDIA_PROXY_TOKEN")
    if env_tok:
        base = (os.environ.get("GW_API_BASE")
                or _base_from_proxy_url(os.environ.get("GW_FAL_PROXY_URL"))
                or _base_from_proxy_url(os.environ.get("GW_ELEVENLABS_PROXY_URL")))
        if base:
            return _checked_origin(base), env_tok, None
    p = pathlib.Path(os.path.expanduser(_CREDS_PATH))
    if not p.exists():
        raise RuntimeError(
            "No GooseWorks credentials: set GW_MEDIA_PROXY_TOKEN + GW_API_BASE (cloud "
            f"sandbox) or log in with the GooseWorks CLI (writes {_CREDS_PATH}).")
    c = json.loads(p.read_text())
    return _checked_origin(c["api_base"]), c["api_key"], c.get("agent_id")


RELAY_EXIT = 3


def relay_mode():
    """True when paid calls must go through the agent's MCP tools instead of HTTP: no
    sandbox proxy token and no CLI credentials (or GW_MEDIA_VIA=mcp)."""
    v = os.environ.get("GW_MEDIA_VIA", "").strip().lower()
    if v == "mcp":
        return True
    if v in ("proxy", "http", "cli"):
        return False
    if os.environ.get("GW_MEDIA_PROXY_TOKEN"):
        return False
    if os.environ.get("GW_EXPECTED_API_ORIGIN"):
        return True  # Connected origin is authoritative; do not inspect CLI credentials.
    return not pathlib.Path(os.path.expanduser(_CREDS_PATH)).exists()


def _relay(kind, tool, args, then, extra=None):
    """Return the saved result of this exact MCP call, or write the call and exit(3)."""
    pid = os.environ.get("GW_PROJECT_ID")
    if tool.startswith("data_"):
        if not pid:
            raise SystemExit("GW_PROJECT_ID is not set. Every paid call names the video project so its "
                             "cost is recorded on it: export GW_PROJECT_ID=<project_id> and re-run.")
        args = dict(args, project_id=pid)
    key = hashlib.sha256(json.dumps({"tool": tool, "args": args}, sort_keys=True).encode()).hexdigest()[:16]
    d = pathlib.Path(os.environ.get("GW_RELAY_DIR", "working/mcp-requests"))
    d.mkdir(parents=True, exist_ok=True)
    req, res = d / f"{kind}-{key}.json", d / f"{kind}-{key}.result.json"
    if res.exists():
        return json.loads(res.read_text())
    if isinstance(args.get("body"), dict) and len(json.dumps(args["body"])) > 8000:
        body_file = d / f"{kind}-{key}.body.json"
        body_file.write_text(json.dumps(args["body"], ensure_ascii=False))
        extra = dict(extra or {}, body_file=str(body_file), body_file_mime="application/json",
                     compact_call={"tool": tool, "args": {k: v for k, v in args.items() if k != "body"},
                                   "add": {"body_asset_id": "<confirmed JSON upload media.id>"}})
    req.write_text(json.dumps({"tool": tool, "args": args, **(extra or {}), "then": then,
                               "save_result_to": str(res)}, indent=1, ensure_ascii=False))
    print("\n[mcp-relay] %s needs an MCP tool call (no GooseWorks credentials on this machine):\n"
          "  1. call %s with the args in %s\n  2. %s\n  3. save that JSON to %s\n"
          "  4. re-run this same command\n" % (kind, tool, req, then, res), file=sys.stderr)
    sys.exit(RELAY_EXIT)


def _params(tok, agent, project_id=None):
    p = {"token": tok}
    if agent:
        p["agent_id"] = agent
    # Attribute this generation's credits to the ad project so per-project spend shows in
    # the app. The goose-video orchestrator (or the cloud sandbox env) sets GW_PROJECT_ID
    # = the project being rendered. An explicit project_id (a resumed job's) wins.
    pid = project_id or os.environ.get("GW_PROJECT_ID")
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


def input_digest(model, args):
    """Stable id of one generation's inputs (GOOSE-3731).

    sha256 of the canonical JSON ``{"model": model, "args": args}`` (sorted keys, no
    whitespace, UTF-8), first 32 hex chars. Same model + same args -> same digest on any
    machine, so a resumed run can tell a saved ingredient is still valid.

    Hash what DETERMINES the output, and only that: the model path and the exact
    payload/params you send (prompt, voice_id, model_id, seed, duration, aspect...).
    Replace inputs that change between runs without changing the result - a
    presigned or proxy URL of an input file - with something stable (that input's
    own ingredient_key + input_digest) before hashing, or the digest never matches.
    """
    canonical = json.dumps({"model": model, "args": args}, sort_keys=True,
                           separators=(",", ":"), ensure_ascii=False)
    return hashlib.sha256(canonical.encode("utf-8")).hexdigest()[:32]


def gw_log(message, event_type="info", level="info", *, skill=None, provider=None,
           model=None, duration_ms=None, details=None):
    """Record one diagnostic event for this run. Fire-and-forget; never raises.

    event_type: info | step | generation | api_failure | error | blocker |
                missing_input | confusion
    """
    if os.environ.get("GW_CLI_LOG_DISABLED") or relay_mode():
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


# ── Poll timeouts: NEVER resubmit (GOOSE-3729) ────────────────────────────────
# A poll timeout does NOT mean the job failed — fal keeps rendering (a veed/fabric
# lipsync once finished at 626s, 26s after a 600s poller gave up; the retry paid
# for a second identical job). So a timeout raises FalPollTimeout carrying the
# request_id: re-attach with resume_fal(request_id), never re-call fal_generate*.
# Video/lipsync/audio-driven models get a long default; images keep a short one.
# (The proxy also dedupes an identical submit within 30 min as a back-stop.)
IMAGE_POLL_TIMEOUT_S = 600
VIDEO_POLL_TIMEOUT_S = 1800
_SLOW_MODEL_HINTS = (
    "video", "lipsync", "lip-sync", "fabric", "omnihuman", "sync-lipsync", "avatar",
    "talking", "kling", "seedance", "veo", "wan", "hailuo", "minimax", "pixverse",
    "luma", "runway", "ltx", "hunyuan", "sora", "music", "audio",
)


def default_poll_timeout(model_path):
    """Seconds to poll before giving up (NOT resubmitting): long for video/lipsync,
    short for images. Env GW_FAL_POLL_TIMEOUT_S overrides both."""
    env = os.environ.get("GW_FAL_POLL_TIMEOUT_S")
    if env:
        try:
            return max(1, int(float(env)))
        except ValueError:
            pass
    mp = (model_path or "").lower()
    return VIDEO_POLL_TIMEOUT_S if any(h in mp for h in _SLOW_MODEL_HINTS) else IMAGE_POLL_TIMEOUT_S


class FalPollTimeout(TimeoutError):
    """The job is still (probably) running on fal — we only stopped waiting.
    DO NOT resubmit: that starts, and pays for, a second identical job.
    Re-attach with resume_fal(e.request_id) (or resume.py --request-id <id>)."""

    def __init__(self, model_path, request_id, timeout_s, last_status=None):
        self.model_path = model_path
        self.request_id = request_id
        self.timeout_s = timeout_s
        self.last_status = last_status
        super().__init__(
            f"FAL job {request_id} ({model_path}) still not finished after {timeout_s}s "
            f"(last status: {last_status or 'unknown'}). It is still running and already "
            f"paid for — DO NOT resubmit (that pays for a second job). Re-attach with "
            f"resume_fal({request_id!r}) or `resume.py --request-id {request_id}`.")


def _poll_to_result(model_path, status_url, response_url, params, timeout_s, poll_s,
                    request_id=None):
    deadline = time.time() + timeout_s
    last = None
    try:
        while time.time() < deadline:
            st = _poll_get(status_url, params, deadline, "status").json()
            s = st.get("status")
            last = s or last
            if s == "COMPLETED":
                out = _poll_get(response_url, params, deadline, "result").json()
                _raise_if_fal_error(out, model_path)
                return out
            if s in ("FAILED", "ERROR"):
                raise RuntimeError(f"FAL failed: {st}")
            time.sleep(poll_s)
    except FalPollTimeout:
        raise
    except TimeoutError as e:  # poll deadline hit during a backend outage
        last = f"{last or 'unknown'}; {e}"
    rid = request_id or urlparse(response_url).path.rstrip("/").rsplit("/", 1)[-1]
    raise FalPollTimeout(model_path, rid, timeout_s, last)


def _fal_run(model_path, payload, timeout_s=None, poll_s=3, new_take=False,
             input_digest=None):
    """Submit a FAL job through the proxy, poll to completion (surviving backend blips),
    return the raw result dict. `model_path` e.g. 'fal-ai/kling-video/.../image-to-video'.

    timeout_s: seconds to POLL (default: default_poll_timeout(model_path)). On timeout
    raises FalPollTimeout(request_id=...) — it never resubmits; resume with resume_fal.
    new_take: True = deliberately start a NEW job even if an identical submit is already
    running (a re-roll of the same prompt). Default False: the proxy returns the running
    job for an identical submit within 30 min instead of paying for a second one.
    input_digest: a STABLE id of this job's inputs (use input_digest(model, args) over
    ingredient keys / saved media ids, never expiring URLs). Sent as x-gw-input-digest;
    the proxy then dedupes on (agent, model, digest) for 24 h instead of on the exact
    body, so a resumed run with re-uploaded inputs re-attaches to the job it already
    paid for. If that job's result has expired upstream the poll fails: retry with
    new_take=True."""
    if relay_mode():
        args = {"provider": "fal", "path": model_path, "body": payload}
        if input_digest:
            args["idempotency_key"] = input_digest
        return _relay("fal", "data_post_provider", args,
                      "poll job_get { job_id } from the reply until status is complete; the result is "
                      "job_get's result.output (fal's JSON with the media URLs)")
    if timeout_s is None:
        timeout_s = default_poll_timeout(model_path)
    api_base, tok, agent = _cfg()
    base = api_base + "/api/internal/fal-proxy"
    params = _params(tok, agent)
    headers = {}
    if new_take:
        headers["x-gw-no-dedupe"] = "1"
    if input_digest:
        headers["x-gw-input-digest"] = str(input_digest)
    t0 = time.time()
    prompt = payload.get("prompt") if isinstance(payload, dict) else None
    try:
        sub_resp = requests.post(f"{base}/{model_path}", params=params, json=payload,
                                 headers=headers or None, timeout=120)
        sub = sub_resp.json()
        if sub_resp.headers.get("x-gw-deduped") == "1":
            gw_log(f"FAL {model_path}: identical submit already running — re-attached to "
                   f"{sub.get('request_id')} (no new job, no new charge)", "info",
                   provider="fal", model=model_path, details={"request_id": sub.get("request_id")})
        _raise_if_fal_error(sub, model_path)
        if "status_url" not in sub:  # some models return a result synchronously
            gw_log(f"FAL {model_path} completed (sync)", "generation", provider="fal",
                   model=model_path, duration_ms=(time.time() - t0) * 1000)
            return sub
        to_proxy = lambda u: base + urlparse(u).path
        status_url, response_url = to_proxy(sub["status_url"]), to_proxy(sub["response_url"])
        request_id = sub.get("request_id") or urlparse(sub["response_url"]).path.rstrip("/").rsplit("/", 1)[-1]
        _persist_pending(model_path, request_id, status_url, response_url)
        result = _poll_to_result(model_path, status_url, response_url, params, timeout_s,
                                 poll_s, request_id=request_id)
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


def resume_fal(request_id, timeout_s=None, poll_s=3):
    """Re-attach to an already-submitted FAL job by request-id (after a mid-poll backend
    crash or a FalPollTimeout) using the pending record persisted at submit. NEVER
    re-submits → can't double-bill. Returns the raw result dict; clears the pending
    record on success. Raises FalPollTimeout again if it still isn't done."""
    rec = json.loads(_pending_path(request_id).read_text())
    if timeout_s is None:
        timeout_s = default_poll_timeout(rec.get("model_path"))
    _, tok, agent = _cfg()
    # Bill the resumed result to the project it was SUBMITTED for, not whatever
    # GW_PROJECT_ID this (possibly different) process has.
    params = _params(tok, agent, project_id=rec.get("project_id"))
    result = _poll_to_result(rec["model_path"], rec["status_url"], rec["response_url"],
                             params, timeout_s, poll_s, request_id=request_id)
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
    """Image models → returns the first result image URL (public *.fal.media CDN).
    kw: timeout_s, poll_s, new_take, input_digest (see _fal_run). A poll timeout raises
    FalPollTimeout — resume it with resume_fal(e.request_id), never call this again."""
    r = _fal_run(model_path, payload, **kw)
    imgs = r.get("images") if isinstance(r, dict) else None
    if not imgs:
        raise RuntimeError(f"FAL returned no image for {model_path}: {str(r)[:400]}")
    return imgs[0]["url"]


def fal_generate_video(model_path, payload, **kw):
    """Video (i2v/t2v/lipsync) models → returns the result video URL. Polls up to
    VIDEO_POLL_TIMEOUT_S by default; on timeout raises FalPollTimeout (resume, don't
    resubmit). Pass new_take=True only for a deliberate re-roll of the same input.
    Pass input_digest= for any clip you save as an ingredient (see _fal_run)."""
    kw.setdefault("timeout_s", default_poll_timeout(model_path)
                  if os.environ.get("GW_FAL_POLL_TIMEOUT_S") else VIDEO_POLL_TIMEOUT_S)
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
    if relay_mode():
        r = _relay("elevenlabs", "data_post_provider",
                   {"provider": "elevenlabs", "path": "/v1/music", "body": {"prompt": prompt, "music_length_ms": int(music_length_ms), "force_instrumental": force_instrumental}},
                   "the result is the tool's JSON reply (it carries download_url)")
        return download(r["download_url"], out_path)
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


def fal_upload(path, content_type=None):
    """Upload a LOCAL file to the fal CDN through the GooseWorks fal-storage-proxy and
    return its public https url (v3b.fal.media/...). Free: storage calls are not billed.

    Use it for any fal input that is a local file (a character still, a take's audio used
    as a voice reference, a reel's audio for Whisper). The proxy swaps in the managed key
    for the short-lived storage token; the upload itself goes straight to the CDN host."""
    if relay_mode():
        import mimetypes
        p = pathlib.Path(path).resolve()
        mime = content_type or mimetypes.guess_type(p.name)[0] or "application/octet-stream"
        kind = mime.split("/")[0] if mime.split("/")[0] in ("image", "audio", "video") else "document"
        r = _relay("upload", "media_upload",
                   {"brand_id": os.environ.get("GW_BRAND_ID", "<brand_id>"), "scope": "video_project",
                    "scope_id": os.environ.get("GW_PROJECT_ID", "<project_id>"), "kind": kind,
                    "source": {"type": "bytes", "filename": p.name, "content_base64": "<base64 of local_file>"}},
                   "the result is {\"url\": <the uploaded media's url>} (an https url fal can fetch). Over ~8 MB, "
                   "use source {type: file, filename} + PUT the bytes + media_confirm instead",
                   extra={"local_file": str(p), "bytes": p.stat().st_size, "mime": mime})
        return r["url"]
    import mimetypes
    api_base, tok, agent = _cfg()
    p = pathlib.Path(path)
    ctype = content_type or mimetypes.guess_type(p.name)[0] or "application/octet-stream"
    r = requests.post(api_base + "/api/internal/fal-storage-proxy/storage/auth/token",
                      params={**_params(tok, agent), "storage_type": "fal-cdn-v3"},
                      json={}, timeout=60)
    r.raise_for_status()
    t = r.json()
    with open(p, "rb") as f:
        up = requests.post(t["base_url"].rstrip("/") + "/files/upload", data=f, timeout=600,
                           headers={"Authorization": f"{t['token_type']} {t['token']}",
                                    "Content-Type": ctype, "X-Fal-File-Name": p.name})
    up.raise_for_status()
    url = up.json().get("access_url")
    if not url:
        raise RuntimeError(f"fal upload returned no url for {p.name}: {up.text[:300]}")
    return url


def download(url, out_path):
    """Fetch a public result URL to disk."""
    urllib.request.urlretrieve(url, out_path)
    return out_path


def eleven_tts(text, voice_id, out_path, model_id="eleven_v3", timeout_s=180):
    """ElevenLabs text-to-speech (VO) through the proxy → writes mp3 to out_path."""
    if relay_mode():
        r = _relay("elevenlabs", "data_post_provider",
                   {"provider": "elevenlabs", "path": "/v1/text-to-speech/%s" % voice_id, "body": {"text": text, "model_id": model_id}},
                   "the result is the tool's JSON reply (it carries download_url)")
        return download(r["download_url"], out_path)
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

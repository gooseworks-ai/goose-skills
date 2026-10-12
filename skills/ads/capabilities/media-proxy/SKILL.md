---
name: media-proxy
description: Shared helper that routes ALL paid media generation (FAL image/video, ElevenLabs music) through the GooseWorks proxies so every call bills the Ads agent — never a provider SDK's default host. Host-swaps the FAL queue URLs, loads the agent token from the sandbox env (GW_MEDIA_PROXY_TOKEN) or ~/.gooseworks/credentials.json, and returns the result CDN URL. Every video-ad media capability imports this; templates never call a provider directly.
status: active
version: "2.0.3"
updated: 2026-10-06
---

# media-proxy

The foundation capability for paid media in the video-ad pipeline. It fixes the
auth-path conflict where engine scripts called FAL/ElevenLabs **directly** (billing
the wrong account): all paid calls now go through
`<api_base>/api/internal/{fal-proxy,elevenlabs-proxy}` with `?token=&agent_id=`, which
**bills the Ads agent**.

## Crash-resume (never lose / double-bill a paid render)

A FAL submit BILLS immediately, but the local backend can blip during a multi-minute
render. Two built-in protections (automatic for every capability that imports this):
- **Poll-through-outage** — `_fal_run`'s poll loop re-attaches to the same status/result
  URL through `connection refused` / timeout blips instead of crashing.
- **Persist + resume** — each submit's `request_id` + poll URLs are written to
  `~/.gooseworks/pending-fal-jobs/`. If the poller still dies, **re-attach instead of
  re-firing** (re-firing double-bills): `resume_fal(request_id)` in Python, or the CLI:

  ```bash
  resume.py --list                              # resumable (submitted, unfinished) jobs
  resume.py --request-id <id> --out final.mp4   # poll to completion + download
  ```
  `resume_fal` NEVER re-submits, so it can't double-charge.
- **Poll timeout never resubmits (GOOSE-3729)** — polling gives up after
  `default_poll_timeout(model)`: **1800s for video / lipsync / audio-driven models**,
  600s for images (`GW_FAL_POLL_TIMEOUT_S` overrides; `timeout_s=` per call). A timeout
  raises `FalPollTimeout` carrying `.request_id` + `.model_path` — the job is still
  running and already paid for. **Re-attach with `resume_fal(e.request_id)`; never call
  `fal_generate*` again for it** (a veed/fabric lipsync once finished 26s after a 600s
  poller quit, and the retry paid for a second identical job).
- **Proxy dedupe back-stop** — the fal proxy returns the already-running job for an
  identical submit (same agent + model + body) within 30 min, so an accidental
  resubmit re-attaches instead of paying twice (response header `x-gw-deduped: 1`).
  For a **deliberate re-roll** of the same input (want a new take), pass
  `new_take=True` (`fal_generate(..., new_take=True)` / `fal_generate_video(...)`),
  which sends `x-gw-no-dedupe: 1` (raw HTTP callers: that header or `?dedupe=0`).
- **Pass `input_digest=` for any piece you save as an ingredient, so a resumed run
  never pays twice.** The body-match dedupe above breaks after a sandbox restart: the
  resumed run re-uploads its inputs (voiceover, stills) and gets NEW urls, so the body
  differs. `fal_generate*(..., input_digest=d)` sends `x-gw-input-digest: d`; the proxy
  then dedupes on (agent + model + digest) for **24 h** and returns the job you already
  paid for. Use the same stable digest you save with `media_upload` (see below). If
  that job's result has since expired at fal, the poll fails: retry once with
  `new_take=True`.

## Policy rejections are final: surface, do not retry (QA-14)

When fal refuses a request on policy grounds, `_fal_run` (and so `fal_generate*`) raises
**`FalPolicyRejection`**, a `RuntimeError` subclass, so old `except RuntimeError` handlers
still work. Policy grounds means a likeness of a real person ("likenesses of real people",
"real person", "public figure"), `content_policy_violation`, `partner_validation_failed`, or
NSFW / safety checker.

- **Every body shape is read.** fal's `detail` as a list of `{msg, type, loc, ctx}`, a dict
  or a string; a top-level `type`/`code`/`error`; the GooseWorks MCP wrapper
  `{"error": {"code": "provider_validation_failed", "status": 422, "detail": <fal body>}}`;
  and a failed `job_get` reply `{"status": "failed", "error": "fal returned HTTP 422 for the
  result.", "result": {"detail": <fal body>}}` (fal reports most failed generations as
  COMPLETED plus a 422 on the result). Before this, a body with both `msg` and `type` kept
  the message and lost the type, so the rejection looked like a generic error.
- **When it counts as policy.** An explicit policy code (`content_policy_violation`,
  `partner_validation_failed`, `content_blocked`) at any status, or a policy phrase
  (likeness, public figure, usage guidelines, risk control, moderation, blocked for safety,
  NSFW, flagged by the safety checker) on an explicit 4xx that is not 408 or 429. Input
  errors such as "Could not detect a real person's face" or "enable_safety_checker cannot be
  disabled" are not policy. A rejection on a 5xx, 408 or 429 is surfaced but **never
  recorded**.
- **What it carries:** `reason` (the provider's words), `kind` (`likeness` |
  `partner_validation` | `content_policy` | `nsfw`), `error_type`, `request_id`,
  `http_status`, `stage`, `charged` and `charge_note`. `charged` is `False` for an explicit
  provider 4xx: the GooseWorks proxy debits only a successful response and releases the
  hold on a 4xx (read from the proxy code, not yet confirmed on a real rejection). It is
  `None` (unknown) for a job that failed after it was accepted.
- **The exact request is recorded** in `~/.gooseworks/rejected-fal-requests/<key>.json`,
  next to `pending-fal-jobs/` (`GW_FAL_REJECTIONS_DIR` overrides). The key is a digest of
  the model plus the canonical JSON payload (sorted keys), and also of `input_digest` when
  one is passed.
- **An identical request is refused before any network call**, with the same exception
  and `from_ledger=True`: "surface, do not retry: this exact request was already rejected
  by the provider for ...; change the inputs (image, prompt, model) to try again".
  `new_take=True` does **not** bypass it: a re-roll of a rejected payload is still the same
  payload. Any change to the prompt, an image, the seed or the model is a new request and
  is sent.
- **Inputs re-uploaded each run get new URLs**, so the payload digest never matches twice.
  Pass `input_digest=` over the inputs' content, as `create-creator-takes-h3/run_takes.py`
  and `render-street-interview/single_gen.py` do. The ledger then matches on that too.
  `refuse_if_rejected(model, input_digest=d)` checks before you upload anything.
- **A caller's `input_digest` is a permanent refusal key.** It must cover EVERY input that is
  sent: the prompt, every setting (duration, resolution, aspect ratio, audio, seed) and the
  content of every input file. Simplest: `input_digest(model, payload)` over the real payload
  with each uploaded URL replaced by `{"sha256": <file hash>}`. Leave an input out and a run
  that changed only that input (a new, acceptable image) is refused.
- **Exit code:** scripts exit with `POLICY_EXIT` (3). The MCP relay also exits 3; the relay
  prints `[mcp-relay]`, a rejection prints "surface, do not retry".
- Non-policy errors (an unreadable image URL, a bad duration) stay a plain `RuntimeError`
  with the provider's message and type, and are never recorded.
- **Every refusal names its record**: the ledger file and whether it matched the exact
  payload or the caller's `input_digest`.
- **Clearing a record is a user-approved action.** Only when the user explicitly approves,
  e.g. because the provider changed its policy:

  ```bash
  python3 media_proxy.py rejections        # list recorded rejections (key, model, reason, request id)
  python3 media_proxy.py forget <key>      # clear one record (all its keys); USER-APPROVED ONLY
  ```
  `forget_rejection(key)` does the same in Python. It only ever deletes ledger records: it
  takes the 32-hex key (or that record's filename or path inside the ledger directory) and
  refuses anything else, such as another `.json` file or a file without a `keys` field.
  Agents never clear a record on their own to get a retry through.

## Use it

```python
from media_proxy import fal_generate, fal_generate_video, eleven_music, download

# image (nano-banana / gpt-image / etc.) — inputs must be PUBLIC urls
img = fal_generate("fal-ai/nano-banana/edit",
                   {"prompt": p, "image_urls": [product_url], "aspect_ratio": "9:16"})
# video i2v (kling / seedance / veo)
vid = fal_generate_video("fal-ai/kling-video/v3/pro/image-to-video",
                         {"prompt": p, "image_url": keyframe_url, "duration": "10"})
# music bed
eleven_music(prompt, 10500, "music.mp3", force_instrumental=True)
```

## Save-as-you-go digest (GOOSE-3731)

`input_digest(model, args)` = sha256 of the canonical JSON `{"model", "args"}` (sorted
keys, no whitespace), first 32 hex chars. Pass it with the MCP `media_upload` of the
result (plus an `ingredient_key` such as `vo/scene-03`); on a resume, `media_list
{ ingredient_key }` returns the saved file and its digest, and the file is reused only
when the digest of the args you would send now is the same.

```python
from media_proxy import input_digest, eleven_tts, fal_generate_video
args = {"text": line, "voice_id": vid, "model_id": "eleven_v3"}
digest = input_digest("elevenlabs/tts", args)

# FAL job: hash the STABLE identities of its inputs, not their urls, and send the
# same digest with the submit so a resumed run re-attaches instead of re-paying.
lip_digest = input_digest("veed/fabric-1.0", {"image": "still/scene-03:" + still_digest,
                                              "audio": "vo/scene-03:" + digest})
clip = fal_generate_video("veed/fabric-1.0", {"image_url": still_url, "audio_url": vo_url},
                          input_digest=lip_digest)
```

Hash only what determines the output. Swap any expiring input URL (presigned / proxy)
for that input's own ingredient_key + digest first, or the digest never matches.

## Contracts (load-bearing)

- **Bills the Ads agent** — `?token=&agent_id=` from `~/.gooseworks/credentials.json`
  (written by the GooseWorks CLI). In a GooseWorks cloud sandbox
  (coworker chat) the env wins instead: `GW_MEDIA_PROXY_TOKEN` (a per-session token that
  already binds agent/org/user) + `GW_API_BASE`; `GW_PROJECT_ID` attributes spend.
- **Host-swap the FAL queue URLs** — submit returns `status_url`/`response_url` on
  `queue.fal.run`; the helper rewrites them to the proxy base (keeps the path). Never
  poll `queue.fal.run` directly (401 + burns credits).
- **FAL inputs that are local files must be PUBLIC urls.** The orchestrator hosts a
  local image/audio with the MCP `media_upload` (its returned url) and
  passes THAT url in, or call `fal_upload(path)`, which puts the file on the fal CDN
  through the fal-storage-proxy (free, verified 2026-09-28) and returns its public url.
- **Only the final `*.fal.media` url is a real public URL** — everything else is behind
  the proxy.

## No credentials at all? The MCP relay

A session that only has the GooseWorks MCP connector (a chat app, or a terminal where
the GooseWorks CLI is not signed in) has neither `GW_MEDIA_PROXY_TOKEN` (the cloud sandbox's)
nor `~/.gooseworks/credentials.json`, so scripts cannot reach the proxies over HTTP. A
connected terminal session can also hold CLI credentials for a different environment; set
`GW_MEDIA_VIA=mcp` before running its media helpers so the selected connector stays
authoritative. Either way every paid call is **relayed through the agent**:

1. The script writes the exact MCP tool call to `working/mcp-requests/<kind>-<hash>.json`
   and exits with code **3**, printing what to do.
2. The agent makes that call through the connector:
   - fal → `data_post { provider: "fal", path: <model>, body, project_id }`, then
     `job_get { job_id }` until `complete`; save `result.output` (fal's JSON).
   - ElevenLabs → `data_post { provider: "elevenlabs", ... }`; save the reply
     (it carries `download_url`).
   - A local file → `media_upload { scope: "video_project", ... }` with the bytes of
     `local_file`; save `{ "url": <its url> }`.
3. It saves that JSON to `save_result_to` and **re-runs the same command**. The script finds
   the result and continues; the next paid call relays the same way.
4. If `data_post` returns a `provider_validation_failed` error, or `job_get`
   returns `status: failed`, the agent saves that error JSON (the whole `job_get` reply) as
   the result instead. The script then reports it: a policy rejection raises
   `FalPolicyRejection` and is recorded, like the HTTP path. Any saved error is moved aside
   to `<name>.error.json`, so a re-run makes the call again instead of re-reading it (the
   ledger still refuses a recorded policy rejection).

Set `GW_PROJECT_ID` (required: every call is billed to that video project, the same
attribution the HTTP proxy records) and `GW_BRAND_ID` (for uploads). The MCP tools bill
through the same server proxy code, so price and project attribution are identical.
`GW_MEDIA_VIA=mcp` forces the relay (e.g. the CLI login points at another environment);
`GW_MEDIA_VIA=proxy` forces HTTP.

## Large request bodies without prompt copying

The relay writes a `.body.json` file for request bodies over 8 KB and adds `body_file` plus
`compact_call` to its request record. When `data_post` advertises `body_asset_id`, hand that
file over instead of its contents:

1. `media_upload` with scope `video_project`, scope_id `GW_PROJECT_ID`, path
   `working/mcp-requests/<filename>.body.json`, kind `reference` and source
   `{type: file, filename: <filename>, content_type: application/json}`. It returns the
   `media` row and an `upload` block.
2. PUT the file to `upload.url` with `upload.method` and `upload.required_headers`
   (`curl -X PUT -T <file> "<upload.url>"`).
3. Finish the upload. With the current actions `media_upload` finishes it itself once the
   PUT lands; a connector that still exposes a separate confirm action needs that call
   after the PUT, and `media.status` stays `pending` until then. Only a finished upload's
   `media.id` is accepted.
4. Send the compact call with that `media.id` as `body_asset_id` and omit `body`.

A connector whose `media_upload` takes source `bytes` (base64 inline, up to about 8 MB)
finishes in step 1 with no PUT; use it when the body file fits. The backend loads that
exact file and applies the same secret, approval and billing checks. Do not paste its
prompt into chat.

Older connectors without `body_asset_id` use the original args record. Read the exact JSON
into the host's tool runner; never retype prompts or reconstruct them from memory.

For a connected terminal run, set `GW_MEDIA_VIA=mcp`, `GW_PROJECT_ID` and `GW_BRAND_ID`
before running any media scripts. Record the public API origin from `account_whoami` in
`GW_EXPECTED_API_ORIGIN`. Do not inspect CLI credential files to identify the connected
environment. Automatic diagnostics also skip HTTP credentials while relay mode is active.

## Related
- Used by `create-image-fal`, `create-video-fal`, `create-music-elevenlabs`.
- The `goose-video` orchestrator hosts local inputs (MCP upload → presign) before calling these.

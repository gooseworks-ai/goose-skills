#!/usr/bin/env python3
"""Narrator voiceover WITH word timings, through the GooseWorks ElevenLabs proxy.

    python gen-voice.py --project <dir>          # dry run: prints what it would send and the cost
    python gen-voice.py --project <dir> --yes    # the paid call

Reads  <project>/beats.json    `vo` (the spoken script) and `voice` {id, model, settings, seed}
Writes <project>/voice/vo.mp3 and <project>/voice/words.json (the clock every anchor resolves
       against), plus voice/take-<n>.json recording exactly what was sent.

Why it exists: the whiteboard pins every mark to a word, so it needs word-level timings with the
audio. `create-vo-elevenlabs` returns audio only, and calling the speech provider directly skips
the proxy's billing and attribution. This calls the proxy's `/with-timestamps` route instead
(the MCP `data_post_provider` route in relay mode, which returns `alignment` too).

DO NOT REGENERATE IT once the layout is solved: a new read silently moves every mark. The seed is
pinned and recorded, and an identical payload is refused rather than paid for twice.
"""
import argparse
import base64
import hashlib
import json
import pathlib
import sys

import media_proxy

sys.stdout.reconfigure(encoding="utf-8", errors="replace")

ap = argparse.ArgumentParser()
ap.add_argument("--project", required=True, type=pathlib.Path)
ap.add_argument("--yes", action="store_true", help="actually make the paid call")
A = ap.parse_args()

P = A.project.resolve()
EP = json.loads((P / "beats.json").read_text(encoding="utf-8"))
V = EP.get("voice") or {}
if "vo" not in EP:
    sys.exit(f'{P / "beats.json"} has no "vo". Put the spoken script there, and a "voice" block '
             f'{{id, model, settings, seed}}. The schema is beats.example.json.')
TEXT = EP["vo"].strip()
if "—" in TEXT or "–" in TEXT:
    sys.exit("the VO has an em or en dash. Not allowed in VO lines.")
if not V.get("id"):
    sys.exit("beats.json has no voice.id. Pick the narrator before paying for a read.")

MODEL = V.get("model", "eleven_v3")
SETTINGS = V.get("settings", {"stability": 0.40, "similarity_boost": 0.75, "style": 0.05,
                              "use_speaker_boost": True})
SEED = int(V.get("seed", 1))
PER_1K = 0.30   # USD per 1k characters at the overage rate; plan credit is cheaper

body = {"text": TEXT, "model_id": MODEL, "voice_settings": SETTINGS, "seed": SEED}
digest = hashlib.sha1(json.dumps(body, sort_keys=True).encode()).hexdigest()[:10]
n_words = len(TEXT.split())
print("voice %s | model %s | seed %d | payload %s" % (V["id"], MODEL, SEED, digest))
print("%d chars, %d words, ~%.1fs at 2.6 wps | cost at most $%.2f"
      % (len(TEXT), n_words, n_words / 2.6, len(TEXT) / 1000 * PER_1K))

OUT = P / "voice"
OUT.mkdir(parents=True, exist_ok=True)
for prev in sorted(OUT.glob("take-*.json")):
    if json.loads(prev.read_text(encoding="utf-8")).get("payload") == digest:
        sys.exit("take %s already used this exact payload and seed; it would reproduce the same "
                 "read. Change the seed or the script instead of paying twice." % prev.stem)
if not A.yes:
    sys.exit("dry run. Nothing sent. Re-run with --yes once the cost is approved.")

path = "/v1/text-to-speech/%s/with-timestamps" % V["id"]
if media_proxy.relay_mode():
    # The MCP tool saves the audio in the project and returns a download url plus `alignment`.
    r = media_proxy._relay("elevenlabs", "data_post_provider",
                           {"provider": "elevenlabs", "path": path, "body": body},
                           "the result is the tool's JSON reply (download_url + alignment)")
    media_proxy.download(r["download_url"], str(OUT / "vo.mp3"))
    res = r
else:
    import requests
    api_base, tok, agent = media_proxy._cfg()
    resp = requests.post(api_base + "/api/internal/elevenlabs-proxy" + path,
                         params=media_proxy._params(tok, agent), json=body, timeout=300)
    if resp.status_code >= 400:
        sys.exit("ElevenLabs proxy %s: %s" % (resp.status_code, resp.text[:400]))
    res = resp.json()
    (OUT / "vo.mp3").write_bytes(base64.b64decode(res["audio_base64"]))

al = res.get("alignment") or res.get("normalized_alignment") or {}
words, cur, s0, prev_e = [], "", None, 0.0
for ch, cs, ce in zip(al.get("characters", []), al.get("character_start_times_seconds", []),
                      al.get("character_end_times_seconds", [])):
    if ch.strip() == "":
        if cur:
            words.append({"w": cur, "s": round(s0, 3), "e": round(prev_e, 3)})
            cur = ""
    else:
        if not cur:
            s0 = cs
        cur += ch
        prev_e = ce
if cur:
    words.append({"w": cur, "s": round(s0, 3), "e": round(prev_e, 3)})
if not words:
    sys.exit("no alignment came back, so no mark can be pinned to a word. Do not render.")

(OUT / "words.json").write_text(json.dumps({"words": words}, indent=1), encoding="utf-8")
n = len(list(OUT.glob("take-*.json"))) + 1
(OUT / ("take-%d.json" % n)).write_text(json.dumps(
    {"take": n, "payload": digest, "voice": V["id"], "model": MODEL, "seed": SEED,
     "settings": SETTINGS, "chars": len(TEXT), "text": TEXT, "via": "gooseworks-proxy"},
    indent=1), encoding="utf-8")
print("wrote voice/vo.mp3 and voice/words.json (%d words), take %d" % (len(words), n))

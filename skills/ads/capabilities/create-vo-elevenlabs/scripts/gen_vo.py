#!/usr/bin/env python3
"""ElevenLabs voiceover (TTS) ROUTED THROUGH THE PROXY (bills the Ads agent). Voice +
text from the template recipe. gen_vo.py --text "..." --voice dMyQqiVXTU80dDl2eNK8 --out vo.mp3

Brand pronunciations: --say-as "Drinkag1=drink A G one" (repeatable) or
--rules working/brand-rules.json (its `pronunciations: [{term, say_as}]`) swaps each
term for how it is SAID before the text is spoken. Captions keep the written term."""
import argparse
import base64
import json
import pathlib
import re


def apply_say_as(text, pairs):
    """Replace each written term with its spoken form (whole word, any case), in ONE
    pass so a spoken form is never rewritten again by a shorter term."""
    if not pairs:
        return text
    lookup = {term.lower(): spoken for term, spoken in pairs}
    alternation = "|".join(re.escape(t) for t in sorted(lookup, key=len, reverse=True))
    pattern = re.compile(r"(?<![\w])(" + alternation + r")(?![\w])", re.IGNORECASE)
    return pattern.sub(lambda m: lookup[m.group(1).lower()], text)


def load_pairs(say_as, rules_path):
    pairs = []
    for item in say_as or []:
        term, _, spoken = item.partition("=")
        if term.strip() and spoken.strip():
            pairs.append((term.strip(), spoken.strip()))
    if rules_path:
        with open(rules_path) as fh:
            for p in json.load(fh).get("pronunciations", []):
                if p.get("term") and p.get("say_as"):
                    pairs.append((p["term"], p["say_as"]))
    return pairs


def timestamped_tts(text, voice, out, model, settings=None, proxy=None):
    """Keep character timings beside the audio, using the existing transport."""
    if proxy is None:
        import media_proxy as proxy
    body = {"text": text, "model_id": model}
    if settings is not None:
        body["voice_settings"] = settings
    endpoint = f"/v1/text-to-speech/{voice}/with-timestamps"
    if proxy.relay_mode():
        result = proxy._relay("elevenlabs", "data_post",
                              {"provider": "elevenlabs", "path": endpoint, "body": body},
                              "the tool's JSON reply must include alignment and download_url")
    else:
        api, token, agent = proxy._cfg()
        response = proxy.requests.post(api + "/api/internal/elevenlabs-proxy" + endpoint,
                                       params=proxy._params(token, agent), json=body, timeout=300)
        response.raise_for_status()
        result = response.json()
    alignment = result.get("normalized_alignment") or result.get("alignment") or {}
    keys = ("characters", "character_start_times_seconds", "character_end_times_seconds")
    counts = [len(alignment.get(k) or []) for k in keys]
    if not counts[0] or len(set(counts)) != 1:
        raise RuntimeError("ElevenLabs returned no usable character timings; do not render guessed captions.")
    target = pathlib.Path(out)
    target.parent.mkdir(parents=True, exist_ok=True)
    if result.get("audio_base64"):
        audio = base64.b64decode(result["audio_base64"], validate=True)
        if not audio:
            raise RuntimeError("ElevenLabs returned empty audio")
        target.write_bytes(audio)
    elif result.get("download_url"):
        proxy.download(result["download_url"], str(target))
    else:
        raise RuntimeError("ElevenLabs returned no audio")
    target.with_suffix(".timestamps.json").write_text(json.dumps(alignment, indent=1), encoding="utf-8")
    return str(target)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--text", required=True)
    ap.add_argument("--voice", "--voice-id", required=True)
    ap.add_argument("--model", default="eleven_v3")
    ap.add_argument("--out", "--output", required=True)
    ap.add_argument("--with-timestamps", action="store_true")
    ap.add_argument("--settings", help="voice_settings as JSON; requires --with-timestamps")
    ap.add_argument("--say-as", action="append", help='"Term=how it is said" (repeatable)')
    ap.add_argument("--rules", help="brand-rules.json with a pronunciations list")
    ap.add_argument("--dry-run", action="store_true", help="print the spoken plan without generating audio")
    a = ap.parse_args()
    if not a.text.strip():
        ap.error("--text is empty; refusing to pay for silence")
    if a.settings and not a.with_timestamps:
        ap.error("--settings requires --with-timestamps")
    settings = json.loads(a.settings) if a.settings else None
    if settings is not None and not isinstance(settings, dict):
        ap.error("--settings must be a JSON object")
    spoken = apply_say_as(a.text, load_pairs(a.say_as, a.rules))
    if spoken != a.text:
        print(f"spoken text: {spoken}")
    if a.dry_run:
        print(spoken)
        return 0
    if a.with_timestamps:
        timestamped_tts(spoken, a.voice, a.out, a.model, settings)
    else:
        from media_proxy import eleven_tts
        eleven_tts(spoken, a.voice, a.out, a.model)
    print(a.out)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

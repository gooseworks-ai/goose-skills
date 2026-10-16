#!/usr/bin/env python3
"""ElevenLabs voiceover (TTS) ROUTED THROUGH THE PROXY (bills the Ads agent). Voice +
text from the template recipe. gen_vo.py --text "..." --voice dMyQqiVXTU80dDl2eNK8 --out vo.mp3

Brand pronunciations: --say-as "Drinkag1=drink A G one" (repeatable) or
--rules working/brand-rules.json (its `pronunciations: [{term, say_as}]`) swaps each
term for how it is SAID before the text is spoken. Captions keep the written term.

Eleven v4 is the default model (it always uses the timestamped endpoint). A timestamped read
reports its measured words per second. --target-wps (usually the reference's measured rate)
speeds a read more than 10% below it, by at most 1.25x, before any lip-sync step, and scales
the timestamps to match. Only this new narration is retimed, never a lip-synced or native
talking clip."""
import argparse
import base64
import json
import hashlib
import pathlib
import math
import re
import shutil
import subprocess

MODELS = ("eleven_v3", "eleven_multilingual_v2", "eleven_v4", "eleven_v4_turbo")
DEFAULT_MODEL = "eleven_v4"
V4_MODELS = ("eleven_v4", "eleven_v4_turbo")
# --target-wps: a read more than TARGET_SLACK below the target is sped up, never past MAX_TEMPO.
TARGET_SLACK = 0.1
MAX_TEMPO = 1.25


def measure_wps(alignment):
    """Heard words per second from a character alignment, counted as goose-studio's reference_rate.py
    counts one: a run of characters between spaces holding a letter or digit is a word (a lone dash or
    full stop is not), ending at its last letter or digit; first word's start to last word's end."""
    found, current = [], None
    for c, s0, e0 in zip(alignment.get("characters") or [], alignment.get("character_start_times_seconds") or [],
                         alignment.get("character_end_times_seconds") or []):
        if c.isspace():
            current = None
        elif current is None:
            current = [c, s0, e0]
            found.append(current)
        else:
            current[0] += c
            current[2] = e0 if re.search(r"\w", c) else current[2]
    words = [w for w in found if re.search(r"\w", w[0])]
    if len(words) < 2 or words[-1][2] <= words[0][1]:
        return 0.0
    return round(len(words) / (words[-1][2] - words[0][1]), 2)


def target_tempo(target_wps, measured_wps):
    """1 unless the read is more than 10% below the target, else target/measured, at most 1.25."""
    if not target_wps or not measured_wps or measured_wps >= target_wps * (1 - TARGET_SLACK) - 1e-9:
        return 1.0
    return min(MAX_TEMPO, math.ceil(target_wps / measured_wps * 1000) / 1000)


def apply_tempo(path, tempo, alignment, run=subprocess.run):
    """Speed the new narration at `path` by `tempo` (ffmpeg atempo), keep the raw read beside it as
    <stem>.raw.mp3, and return the alignment with every time divided by `tempo`."""
    target = pathlib.Path(path)
    raw = target.with_suffix(".raw.mp3")
    shutil.copyfile(target, raw)
    run(["ffmpeg", "-y", "-v", "error", "-i", str(raw), "-filter:a", "atempo=%s" % tempo,
         "-c:a", "libmp3lame", "-q:a", "2", str(target)], check=True)
    scaled = dict(alignment)
    for key in ("character_start_times_seconds", "character_end_times_seconds"):
        scaled[key] = [round(t / tempo, 3) for t in alignment.get(key) or []]
    return scaled


def voice_payload_problem(text, model, settings=None, support=None):
    # Eleven v4 and v4 Turbo are generally available: `support` is accepted and ignored.
    if model not in MODELS:
        return "choose an explicitly supported speech model"
    if model != "eleven_multilingual_v2" and re.search(r"<\/?[a-z][^>]*>", text, re.I):
        return "Eleven v3/v4 do not support SSML; use delivery tags and punctuation"
    if model == "eleven_multilingual_v2" and re.search(r"\[[^\]]*\]", text):
        return "audio tags require Eleven v3/v4; v2 may read them aloud"
    if model in ("eleven_v4", "eleven_v4_turbo"):
        unsupported = set(settings or {}) - {"stability", "similarity_boost"}
        if unsupported:
            return "V4 supports Stability and Similarity only; remove " + ", ".join(sorted(unsupported))
    if model == "eleven_v3" and "speed" in (settings or {}):
        return "V3 has no supported Speed setting; direct and review the actual performance"
    return None


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


def timestamped_tts(text, voice, out, model, settings=None, proxy=None, model_support=None,
                    target_wps=None, run=subprocess.run):
    """Keep character timings beside the audio, using the existing transport. With target_wps,
    a read more than 10% below it is sped up (at most 1.25x) before any lip-sync step."""
    problem = voice_payload_problem(text, model, settings, model_support)
    if problem:
        raise ValueError(problem)
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
    tagged = bool(re.search(r"\[[^\]]*\]", text))
    measured = measure_wps(alignment)
    # A tagged read's provider timings can time unspoken tags, so it is measured but never paced.
    tempo = 1.0 if tagged else target_tempo(target_wps, measured)
    if tempo != 1.0:
        alignment = apply_tempo(target, tempo, alignment, run)
        print("pace: measured %.2f words/s, more than 10%% below the target %.2f; sped up %.3fx "
              "before any lip-sync (raw read kept as %s)" % (measured, target_wps, tempo, target.with_suffix(".raw.mp3").name))
    elif target_wps and tagged:
        print("pace: a tagged read is not paced from provider timings; time it from a reviewed alignment first")
    elif target_wps:
        print("pace: measured %.2f words/s, within 10%% of the target %.2f; left as performed" % (measured, target_wps))
    target.with_suffix(".timestamps.json").write_text(json.dumps(alignment, indent=1), encoding="utf-8")
    target.with_suffix(".provenance.json").write_text(json.dumps({
        "source_sha256": hashlib.sha256(target.read_bytes()).hexdigest(),
        "model": model, "voice_id": voice, "speech_mode": "narration",
        "content_review_status": "pending", "timing_method": "provider_character_alignment",
        "timing_status": "requires_reviewed_alignment" if re.search(r"\[[^\]]*\]", text) else "provider_alignment",
        "timing_is_content_review": False,
        "measured_words_per_second": measured,
        "words_per_second": round(measured * tempo, 2),
        "target_wps": target_wps, "tempo": tempo, "tempo_applied": tempo != 1.0,
        "tempo_applied_before_lipsync": True, "tempo_scope": "new_narration_only",
    }, indent=2), encoding="utf-8")
    return str(target)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--text", required=True)
    ap.add_argument("--voice", "--voice-id", required=True)
    ap.add_argument("--model", default=DEFAULT_MODEL, choices=MODELS,
                    help="default eleven_v4 (timestamped); eleven_v3 only when the plan locked it")
    ap.add_argument("--model-support", help="ignored: Eleven v4 and v4 Turbo are generally available (kept so older commands still parse)")
    ap.add_argument("--tag", action="append", help="Eleven v3/v4 delivery cue, e.g. content or curious; never portable to H3")
    ap.add_argument("--out", "--output", required=True)
    ap.add_argument("--with-timestamps", action="store_true")
    ap.add_argument("--target-wps", type=float, help="the reference's measured words per second; a read more than "
                    "10%% below it is sped up, at most 1.25x, before any lip-sync (needs timestamps)")
    ap.add_argument("--settings", help="voice_settings as JSON; requires --with-timestamps")
    ap.add_argument("--say-as", action="append", help='"Term=how it is said" (repeatable)')
    ap.add_argument("--rules", help="brand-rules.json with a pronunciations list")
    ap.add_argument("--dry-run", action="store_true", help="print the spoken plan without generating audio")
    a = ap.parse_args()
    if not a.text.strip():
        ap.error("--text is empty; refusing to pay for silence")
    if a.settings and not (a.with_timestamps or a.model in V4_MODELS):
        ap.error("--settings requires --with-timestamps")
    settings = json.loads(a.settings) if a.settings else None
    if settings is not None and not isinstance(settings, dict):
        ap.error("--settings must be a JSON object")
    spoken = apply_say_as(a.text, load_pairs(a.say_as, a.rules))
    if a.tag:
        if any(not tag.strip() or re.search(r"[\[\]<>\n]", tag) for tag in a.tag):
            ap.error("--tag must be a plain delivery cue without markup")
        spoken = " ".join("[%s]" % tag.strip() for tag in a.tag) + " " + spoken
    if spoken != a.text:
        print(f"spoken text: {spoken}")
    if a.dry_run:
        print(spoken)
        return 0
    support = json.loads(pathlib.Path(a.model_support).read_text()) if a.model_support else None
    problem = voice_payload_problem(spoken, a.model, settings, support)
    if problem:
        ap.error(problem)
    if a.model in V4_MODELS and not a.with_timestamps:
        # The V4 route is verified on the timestamped endpoint only, so V4 always uses it.
        print("note: %s uses the timestamped endpoint; timings are saved beside the audio" % a.model)
        a.with_timestamps = True
    if a.target_wps is not None and (a.target_wps <= 0 or not a.with_timestamps):
        ap.error("--target-wps needs a positive rate and a timestamped read (the pace is measured from the timestamps)")
    if a.with_timestamps:
        timestamped_tts(spoken, a.voice, a.out, a.model, settings, model_support=support, target_wps=a.target_wps)
    else:
        from media_proxy import eleven_tts
        eleven_tts(spoken, a.voice, a.out, a.model)
    print(a.out)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

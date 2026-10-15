#!/usr/bin/env python3
"""Pair a voice with the on-screen character. Free, no network.

From the same descriptors that made the character still (age, gender, accent, energy),
return either:

- a matched ElevenLabs voice from a voice list the caller saved (GET /v1/shared-voices,
  the voice library, or GET /v2/voices, the account's voices), matched by labels:
  gender and age must match, accent must match when one is given, energy is a bonus; or
- an ElevenLabs Voice Design request (POST /v1/text-to-voice/design, text-to-voice from a
  description), plus the follow-up that saves the chosen preview (POST /v1/text-to-voice).

    pair_voice.py --age 28 --gender woman --accent american --energy upbeat \
        [--voices voices.json] [--exclude <voice_id> ...] [--sample-text "..."] [--out voice_pair.json]

A narrator picked separately from the presenter, and reused across brands, gave a test
video the wrong voice for its character. make_character.py calls this and records the
result as `voice_pair` in character.json. Voice Design is a paid call: quote it before
running it, and listen to the previews before saving one. Field names follow the
ElevenLabs API reference (text-to-voice/design and text-to-voice/create, checked 2026-10-15).
"""
import argparse
import json
import pathlib
import sys

# The ElevenLabs library's age labels by the character's age (one line each: creator-h3 checks they match).
AGE_BANDS = [[0, 30, "young"], [30, 55, "middle_aged"], [55, 200, "old"]]
GENDER_LABEL = {"woman": "female", "female": "female", "girl": "female", "lady": "female", "man": "male", "male": "male", "guy": "male", "boy": "male", "non-binary person": "neutral", "nonbinary": "neutral", "non-binary": "neutral"}
GENDER_WORD = {"female": "woman", "male": "man", "neutral": "non-binary person"}
DESIGN_MODEL = "eleven_ttv_v3"
DESCRIPTION = "A {age}-year-old {gender_word}{accent_part}. Speaking voice: {energy}, natural and conversational, like a real person talking to a friend in a phone video. Clear and close to the microphone, not an announcer, not breathy, no radio polish."
DESIGN_TEXT_MIN = 100
DESIGN_TEXT_MAX = 1000
DEFAULT_ENERGY = "warm, easy"


def age_label(age):
    for lo, hi, label in AGE_BANDS:
        if lo <= age < hi:
            return label
    return AGE_BANDS[-1][2]


def gender_label(gender):
    key = (gender or "").strip().lower()
    if key not in GENDER_LABEL:
        raise SystemExit("gender %r has no voice label; use woman, man or non-binary person" % gender)
    return GENDER_LABEL[key]


def norm(value):
    return (value or "").strip().lower().replace("-", "_").replace(" ", "_")


def voice_labels(age, gender, accent=None, energy=None):
    """The labels a matching voice must carry: gender and age always, accent and energy when given."""
    labels = {"gender": gender_label(gender), "age": age_label(int(age))}
    if accent and accent.strip():
        labels["accent"] = norm(accent)
    labels["energy"] = (energy or DEFAULT_ENERGY).strip()
    return labels


def voice_record(voice):
    """One voice from either list: the library puts labels at the top level, the account in `labels`."""
    labels = {k: norm(v) for k, v in (voice.get("labels") or {}).items() if isinstance(v, str)}
    for key in ("gender", "age", "accent", "descriptive", "use_case"):
        if isinstance(voice.get(key), str) and voice[key].strip():
            labels[key] = norm(voice[key])
    return labels


def match_library(voices, wanted, exclude=()):
    """The best voice whose gender and age (and accent, when wanted) match, or None.
    Energy words found in the voice's descriptive label or description add to the score."""
    energy_words = [w for w in norm(wanted.get("energy")).replace(",", "_").split("_") if len(w) > 2]
    best = None
    for voice in voices or []:
        vid = voice.get("voice_id")
        if not vid or vid in exclude:
            continue
        labels = voice_record(voice)
        if labels.get("gender") != wanted["gender"] or labels.get("age") != wanted["age"]:
            continue
        if wanted.get("accent") and labels.get("accent") != wanted["accent"]:
            continue
        said = norm(labels.get("descriptive", "") + " " + (voice.get("description") or ""))
        energy_hits = sum(1 for w in energy_words if w in said)
        score = 2 * energy_hits + (1 if labels.get("use_case") in ("social_media", "conversational") else 0)
        key = (-score, (voice.get("name") or ""), vid)
        if best is None or key < best[0]:
            matched = ["gender", "age"] + (["accent"] if wanted.get("accent") else []) + (["energy"] if energy_hits else [])
            best = (key, {"source": "library", "voice_id": vid, "name": voice.get("name"), "labels": labels,
                          "public_owner_id": voice.get("public_owner_id"), "matched_on": matched})
    return best[1] if best else None


def design_request(age, gender, accent=None, energy=None, sample_text=None):
    """The Voice Design request for this character, and the call that saves the chosen preview."""
    g = gender_label(gender)
    description = DESCRIPTION.format(age=int(age), gender_word=GENDER_WORD[g],
                                     accent_part=(" with a natural %s accent" % accent.strip().title()) if accent and accent.strip() else "",
                                     energy=(energy or DEFAULT_ENERGY).strip())
    body = {"voice_description": description, "model_id": DESIGN_MODEL}
    text = (sample_text or "").strip()
    if DESIGN_TEXT_MIN <= len(text) <= DESIGN_TEXT_MAX:
        body["text"] = text
    else:
        body["auto_generate_text"] = True
    return {
        "request": {"method": "POST", "path": "/v1/text-to-voice/design", "body": body},
        "save": {"method": "POST", "path": "/v1/text-to-voice",
                 "body": {"voice_name": "%s, %d%s" % (GENDER_WORD[g].capitalize(), int(age), (", " + accent.strip().title()) if accent and accent.strip() else ""),
                          "voice_description": description,
                          "generated_voice_id": "<generated_voice_id of the preview you chose after listening>"}},
    }


def pair_voice(age, gender, accent=None, energy=None, voices=None, exclude=(), sample_text=None):
    """voice_pair for character.json: a library match when the list has one, else a Voice Design request."""
    wanted = voice_labels(age, gender, accent, energy)
    match = match_library(voices, wanted, exclude) if voices else None
    if match:
        match["wanted"] = wanted
        match["note"] = "matched by labels; listen to it against the still before any paid voice step"
        return match
    pair = {"source": "voice_design", "wanted": wanted}
    pair.update(design_request(age, gender, accent, energy, sample_text))
    pair["note"] = ("no saved voice matches %s; Voice Design is a paid call: quote it, listen to the previews, then save one"
                    % ", ".join("%s %s" % (k, v) for k, v in wanted.items() if k != "energy")) if voices else \
                   "no voice list given; Voice Design is a paid call: quote it, listen to the previews, then save one"
    return pair


def load_voices(path):
    data = json.loads(pathlib.Path(path).read_text(encoding="utf-8"))
    return data.get("voices", data) if isinstance(data, dict) else data


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--age", type=int, required=True)
    ap.add_argument("--gender", required=True)
    ap.add_argument("--accent", help="e.g. american, british; matched exactly when given")
    ap.add_argument("--energy", help="how they sound, e.g. upbeat, calm, warm")
    ap.add_argument("--voices", help="a saved GET /v1/shared-voices or GET /v2/voices reply")
    ap.add_argument("--exclude", action="append", default=[], help="a voice_id not to reuse (e.g. another brand's narrator)")
    ap.add_argument("--sample-text", help="100-1000 characters for the design previews; else auto-generated")
    ap.add_argument("--out", type=pathlib.Path)
    a = ap.parse_args()
    pair = pair_voice(a.age, a.gender, a.accent, a.energy, load_voices(a.voices) if a.voices else None,
                      tuple(a.exclude), a.sample_text)
    text = json.dumps(pair, indent=1)
    if a.out:
        a.out.parent.mkdir(parents=True, exist_ok=True)
        a.out.write_text(text, encoding="utf-8")
    print(text)
    return 0


if __name__ == "__main__":
    sys.exit(main())

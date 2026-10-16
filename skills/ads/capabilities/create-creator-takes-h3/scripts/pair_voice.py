#!/usr/bin/env python3
"""Pair a voice with the on-screen character. Free, no network.

From the same descriptors that made the character still (age, gender, ethnicity, accent,
energy), return either:

- a matched ElevenLabs voice from a voice list the caller saved (GET /v1/voices or
  GET /v2/voices, the account's voices; GET /v1/shared-voices, the voice library; or the
  GooseWorks MCP's data_call_provider reply for GET /v1/voices), matched by labels and
  description: gender must match; the voice must be described as the character's heritage
  and never as another one; age must match, or be the next band when the character is
  within 10 years of it; accent must match when one is given; energy is a bonus; or
- an ElevenLabs Voice Design request (POST /v1/text-to-voice/design, text-to-voice from a
  description), plus the follow-up that saves the chosen preview (POST /v1/text-to-voice),
  and the `nearest` voices in the list to play while that is quoted.

    pair_voice.py --age 39 --gender man --ethnicity "Black American" --accent american \
        --voices voices.json [--exclude <voice_id> ...] [--sample-text "..."] [--out voice_pair.json]
    pair_voice.py --character work/character/character.json --voices voices.json --exclude <rejected id>
    pair_voice.py --character work/character/character.json --choose <a voice_id from voice_pair.nearest>

A narrator picked separately from the presenter, and reused across brands, gave a test
video the wrong voice for its character; a 39-year-old Black American presenter then got a
generic American voice, because ethnicity was never matched. make_character.py calls this
and records the result as `voice_pair` in character.json. To change the voice later, run
this with --character and --exclude for the rejected voice: never hand-pick from the list.
Voice Design is a paid call: quote it before running it, and listen to the previews before
saving one. Field names follow the ElevenLabs API reference (text-to-voice/design and
text-to-voice/create, checked 2026-10-15).
"""
import argparse
import json
import pathlib
import re
import sys

# The ElevenLabs library's age labels by the character's age (one line each: creator-h3 checks they match).
AGE_BANDS = [[0, 30, "young"], [30, 55, "middle_aged"], [55, 200, "old"]]
GENDER_LABEL = {"woman": "female", "female": "female", "girl": "female", "lady": "female", "man": "male", "male": "male", "guy": "male", "boy": "male", "non-binary person": "neutral", "nonbinary": "neutral", "non-binary": "neutral"}
GENDER_WORD = {"female": "woman", "male": "man", "neutral": "non-binary person"}
DESIGN_MODEL = "eleven_ttv_v3"
DESCRIPTION = "{article} {age}-year-old {gender_word}{accent_part}. Speaking voice: {energy}, natural and conversational, like a real person talking to a friend in a phone video. Clear and close to the microphone, not an announcer, not breathy, no radio polish."
DESIGN_TEXT_MIN = 100
DESIGN_TEXT_MAX = 1000
DEFAULT_ENERGY = "warm, easy"
# A voice one age band off still fits when the character is this close to the band's edge: the
# library labels every African American male voice "young", and the presenter was 39.
NEAR_YEARS = 10

# The words a voice's accent label, description or name use for a heritage. Voice lists mark it
# there, not in a label of its own: Julius is "accent: african american", Miles is "accent:
# american" described as "young African American male".
HERITAGE_WORDS = {
    "black": ("african american", "black"),
    "african": ("african", "nigerian", "ghanaian", "kenyan", "south african"),
    "south_asian": ("south asian", "indian", "desi", "pakistani", "bangladeshi", "sri lankan", "hindi"),
    "east_asian": ("east asian", "chinese", "japanese", "korean", "mandarin", "cantonese"),
    "southeast_asian": ("southeast asian", "filipino", "filipina", "vietnamese", "thai", "indonesian", "malaysian"),
    "latino": ("latino", "latina", "latinx", "hispanic", "mexican", "latin american", "puerto rican", "colombian"),
    "middle_eastern": ("middle eastern", "arab", "arabic", "persian", "iranian", "lebanese"),
    # Broad words: "Asian" alone fits an East or Southeast Asian person; both block a White one.
    "asian": ("asian american", "asian"),
    "indigenous": ("native american", "indigenous", "first nations", "pacific islander", "polynesian",
                   "native hawaiian", "aboriginal"),
    "white": (),  # no word marks it: a White character takes a voice described as no other heritage
}
# The character's ethnicity (make_character.py --ethnicity) to one of the heritages above, first
# match wins, so "Black African American" is black and "Southeast Asian" is not East Asian.
ETHNICITY_HERITAGE = [
    ("african american", "black"), ("black", "black"), ("south african", "african"), ("african", "african"),
    ("southeast asian", "southeast_asian"), ("filipin", "southeast_asian"), ("vietnamese", "southeast_asian"),
    ("thai", "southeast_asian"), ("indonesian", "southeast_asian"), ("malaysian", "southeast_asian"),
    ("south asian", "south_asian"), ("indian", "south_asian"), ("pakistani", "south_asian"),
    ("bangladeshi", "south_asian"), ("sri lankan", "south_asian"),
    ("east asian", "east_asian"), ("chinese", "east_asian"), ("japanese", "east_asian"), ("korean", "east_asian"),
    ("hispanic", "latino"), ("latin", "latino"), ("mexican", "latino"),
    ("middle eastern", "middle_eastern"), ("arab", "middle_eastern"), ("persian", "middle_eastern"),
    ("iranian", "middle_eastern"), ("lebanese", "middle_eastern"),
    ("native american", "indigenous"), ("indigenous", "indigenous"), ("first nations", "indigenous"),
    ("pacific islander", "indigenous"), ("polynesian", "indigenous"), ("native hawaiian", "indigenous"),
    ("asian", "asian"),
    ("white", "white"), ("caucasian", "white"), ("european", "white"),
]
# A mixed heritage checks nothing: "biracial Black/Latino" fits neither one heritage's voices only.
MIXED = re.compile(r"\b(mixed|biracial|multiracial|multiethnic|multi racial|multi ethnic)\b")
# A generic "Asian" voice fits these; an "Asian" person takes a voice named any of them.
ASIAN = {"asian", "east_asian", "southeast_asian"}
MCP_NO_DESIGN = ("The GooseWorks MCP cannot run Voice Design (its ElevenLabs calls are speech, music and "
                 "GET /v1/voices): play the `nearest` voices next to the still, record the owner's pick with "
                 "--character --choose <voice_id>, and never use a voice that is not in voice_pair.")


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


def heritage(ethnicity):
    """The heritage a voice must be described as, for the character's ethnicity; None when unknown or
    mixed (a mixed word, or words for two heritages, as in "biracial Black/Latino")."""
    text = " ".join(re.sub(r"[-_/,&+]", " ", (ethnicity or "").lower()).split())
    if MIXED.search(text):
        return None
    groups = []
    for word, group in ETHNICITY_HERITAGE:
        if re.search(r"\b" + word, text):
            groups.append(group)
            text = re.sub(r"\b" + word + r"\w*", " ", text)
    return groups[0] if len(set(groups)) == 1 else None


def voice_labels(age, gender, accent=None, energy=None, ethnicity=None):
    """The labels a matching voice must carry: gender and age always, accent, ethnicity and energy when given."""
    labels = {"gender": gender_label(gender), "age": age_label(int(age))}
    if accent and accent.strip():
        labels["accent"] = norm(accent)
    if ethnicity and ethnicity.strip():
        labels["ethnicity"] = ethnicity.strip()
    labels["energy"] = (energy or DEFAULT_ENERGY).strip()
    return labels


def voice_id(voice):
    """ElevenLabs lists say voice_id; GooseWorks' video_formats voice rows say id. None for a row that isn't a voice."""
    if not isinstance(voice, dict):
        return None
    vid = voice.get("voice_id") or voice.get("id")
    return vid if isinstance(vid, str) and vid.strip() else None


def text_of(value):
    return value if isinstance(value, str) else ""


def raw_labels(voice):
    return voice.get("labels") if isinstance(voice.get("labels"), dict) else {}


def voice_record(voice):
    """One voice from either list: the library puts labels at the top level, the account in `labels`."""
    labels = {k: norm(v) for k, v in raw_labels(voice).items() if isinstance(v, str)}
    for key in ("gender", "age", "accent", "descriptive", "use_case"):
        if isinstance(voice.get(key), str) and voice[key].strip():
            labels[key] = norm(voice[key])
    return labels


def voice_heritages(voice, labels):
    """Every heritage the voice's accent, descriptive label, description or name names. Longest
    phrase first, and each found phrase is removed, so "african american" never also reads as "african"."""
    text = " ".join(re.sub(r"[-_/,.()|]", " ", " ".join(
        [labels.get("accent", ""), labels.get("descriptive", ""), text_of(voice.get("description")),
         text_of(raw_labels(voice).get("description")), text_of(voice.get("name"))]).lower()).split())
    found = set()
    for word, group in sorted(((w, g) for g, ws in HERITAGE_WORDS.items() for w in ws), key=lambda x: -len(x[0])):
        pattern = r"\b%s\b" % re.escape(word)
        if re.search(pattern, text):
            found.add(group)
            text = re.sub(pattern, " ", text)
    return found


def age_fit(age, label):
    """'exact' when the voice's age label is the character's band, 'near' when it is the next band
    and the character is within NEAR_YEARS of that band's edge, else None."""
    if label == age_label(age):
        return "exact"
    for lo, hi, band in AGE_BANDS:
        if band == label and (0 < lo - age <= NEAR_YEARS or 0 <= age - hi <= NEAR_YEARS):
            return "near"
    return None


def accent_fits(wanted, label):
    """The voice's accent is the wanted one, or names it: 'african_american' is an american accent."""
    return bool(label) and (label == wanted or set(wanted.split("_")) <= set(label.split("_")))


def heritage_fits(group, found):
    """A known heritage must be the only one named on the voice; a generic "Asian" voice fits an East
    or Southeast Asian person. A White character takes a voice that names no heritage. Unknown or
    mixed checks nothing."""
    if group is None:
        return True
    if not HERITAGE_WORDS.get(group):
        return not found
    if group == "asian":
        return bool(found) and found <= ASIAN
    return found == {group} or (group in ASIAN and found == {"asian"})


def match_library(voices, wanted, exclude=(), age=None):
    """The best voice whose gender, heritage, age and accent (when wanted) fit, or None. An exact age
    band beats the next band; energy words found in the voice's descriptive label or description,
    and a social or conversational use, add to the score."""
    energy_words = [w for w in norm(wanted.get("energy")).replace(",", "_").split("_") if len(w) > 2]
    group = heritage(wanted.get("ethnicity"))
    age = age if age is not None else {"young": 25, "middle_aged": 40, "old": 65}[wanted["age"]]
    best = None
    for voice in voices or []:
        vid = voice_id(voice)
        if not vid or vid in exclude:
            continue
        labels = voice_record(voice)
        if labels.get("gender") != wanted["gender"]:
            continue
        fit = age_fit(age, labels.get("age"))
        if not fit or not heritage_fits(group, voice_heritages(voice, labels)):
            continue
        if wanted.get("accent") and not accent_fits(wanted["accent"], labels.get("accent")):
            continue
        said = norm(labels.get("descriptive", "") + " " + text_of(voice.get("description")))
        energy_hits = sum(1 for w in energy_words if w in said)
        score = 2 * energy_hits + (1 if labels.get("use_case") in ("social_media", "conversational") else 0)
        key = (0 if fit == "exact" else 1, -score, text_of(voice.get("name")), vid)
        if best is None or key < best[0]:
            matched = (["gender"] + (["ethnicity"] if group else []) + (["age"] if fit == "exact" else ["age_near"])
                       + (["accent"] if wanted.get("accent") else []) + (["energy"] if energy_hits else []))
            best = (key, {"source": "library", "voice_id": vid, "name": voice.get("name"), "labels": labels,
                          "public_owner_id": voice.get("public_owner_id"), "preview_url": voice.get("preview_url"),
                          "matched_on": matched})
    return best[1] if best else None


def nearest(voices, wanted, exclude=(), age=None, limit=3):
    """Up to `limit` voices of the right gender and heritage, closest age first, each with what differs:
    something real to play next to the still while a Voice Design voice is quoted."""
    group = heritage(wanted.get("ethnicity"))
    order = [band for _, _, band in AGE_BANDS]
    rows = []
    for voice in voices or []:
        vid = voice_id(voice)
        if not vid or vid in exclude:
            continue
        labels = voice_record(voice)
        if labels.get("gender") != wanted["gender"] or not heritage_fits(group, voice_heritages(voice, labels)):
            continue
        differs = []
        fit = age_fit(age, labels.get("age")) if age is not None else None
        if fit != "exact":
            differs.append("age %s" % (labels.get("age") or "unlabelled"))
        if wanted.get("accent") and not accent_fits(wanted["accent"], labels.get("accent")):
            differs.append("accent %s" % (labels.get("accent") or "unlabelled"))
        gap = abs(order.index(labels["age"]) - order.index(wanted["age"])) if labels.get("age") in order else 9
        rows.append(((len(differs), gap, text_of(voice.get("name")), vid),
                     {"voice_id": vid, "name": voice.get("name"), "labels": labels,
                      "preview_url": voice.get("preview_url"), "differs_on": differs}))
    return [row for _, row in sorted(rows, key=lambda r: r[0])[:limit]]


def design_request(age, gender, accent=None, energy=None, sample_text=None, ethnicity=None):
    """The Voice Design request for this character, and the call that saves the chosen preview."""
    g = gender_label(gender)
    eth = (ethnicity or "").strip()
    description = DESCRIPTION.format(article="An" if int(age) in (8, 11, 18) or 80 <= int(age) < 90 else "A",
                                     age=int(age), gender_word=(eth + " " if eth else "") + GENDER_WORD[g],
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
                 "body": {"voice_name": "%s, %d%s%s" % (GENDER_WORD[g].capitalize(), int(age), (", " + eth) if eth else "",
                                                       (", " + accent.strip().title()) if accent and accent.strip() else ""),
                          "voice_description": description,
                          "generated_voice_id": "<generated_voice_id of the preview you chose after listening>"}},
    }


def pair_voice(age, gender, accent=None, energy=None, voices=None, exclude=(), sample_text=None, ethnicity=None):
    """voice_pair for character.json: a library match when the list has one, else a Voice Design request
    with the nearest voices in the list. `person` keeps the inputs and `rejected` the excluded voices,
    so pair_voice.py --character can pair again after a voice is turned down."""
    wanted = voice_labels(age, gender, accent, energy, ethnicity)
    person = {"age": int(age), "gender": gender, "ethnicity": (ethnicity or "").strip() or None,
              "accent": accent, "energy": energy}
    rejected = sorted(set(exclude))
    match = match_library(voices, wanted, exclude, int(age)) if voices else None
    if match:
        match.update({"wanted": wanted, "person": person, "rejected": rejected})
        match["note"] = ("matched by labels and description; play it next to the still and approve the two together "
                         "before any paid voice step" + (". Its age label is one band off: listen for it"
                                                        if "age_near" in match["matched_on"] else ""))
        return match
    pair = {"source": "voice_design", "wanted": wanted, "person": person, "rejected": rejected}
    pair.update(design_request(age, gender, accent, energy, sample_text, ethnicity))
    if voices:
        pair["nearest"] = nearest(voices, wanted, exclude, int(age))
    pair["note"] = ("no saved voice fits %s; Voice Design is a paid call: quote it, listen to the previews, then save one. %s"
                    % (", ".join("%s %s" % (k, v) for k, v in wanted.items() if k != "energy"), MCP_NO_DESIGN)) if voices else \
                   "no voice list given; Voice Design is a paid call: quote it, listen to the previews, then save one"
    return pair


def load_voices(path):
    """A saved voice list: ElevenLabs' {"voices": [...]}, the GooseWorks MCP's data_call_provider reply
    ({"data": {"voices": [...]}}), a video_formats reply ({"result": {"voices": [...]}}) or a bare list."""
    data = json.loads(pathlib.Path(path).read_text(encoding="utf-8"))
    for key in ("data", "result"):
        if isinstance(data, dict) and isinstance(data.get(key), dict) and "voices" in data[key]:
            data = data[key]
    return data.get("voices", data) if isinstance(data, dict) else data


def repair_character(path, voices, exclude=(), sample_text=None):
    """Pair again for a saved character.json: its own person, every voice already rejected plus
    `exclude`, written back as voice_pair. How a voice is changed after it is turned down."""
    record = json.loads(path.read_text(encoding="utf-8"))
    old = record.get("voice_pair") or {}
    person = old.get("person")
    if not person:
        raise SystemExit("%s has no voice_pair.person (made before make_character.py 2.6.0): run make_character.py "
                         "--dry-run again with the same person to record it" % path)
    rejected = tuple(sorted(set(old.get("rejected") or []) | set(exclude)))
    pair = pair_voice(person["age"], person["gender"], person.get("accent"), person.get("energy"), voices,
                      rejected, sample_text, person.get("ethnicity"))
    record["voice_pair"] = pair
    path.write_text(json.dumps(record, indent=1), encoding="utf-8")
    return pair


def choose_nearest(path, chosen):
    """Record the owner's pick from the saved voice_pair's `nearest` voices, after they heard it beside
    the still, when no voice fits fully and Voice Design can't run. Only a listed nearest voice."""
    record = json.loads(path.read_text(encoding="utf-8"))
    old = record.get("voice_pair") or {}
    row = next((v for v in old.get("nearest") or [] if v.get("voice_id") == chosen), None)
    if old.get("source") != "voice_design" or row is None:
        listed = ", ".join(v.get("voice_id") or "?" for v in old.get("nearest") or []) or "none"
        raise SystemExit("--choose takes a voice_id from this character's voice_pair.nearest (%s); pair again "
                         "with --exclude instead" % listed)
    pair = {"source": "library_nearest", "voice_id": row["voice_id"], "name": row.get("name"), "labels": row.get("labels"),
            "preview_url": row.get("preview_url"), "differs_on": row.get("differs_on") or [],
            "wanted": old.get("wanted"), "person": old.get("person"), "rejected": old.get("rejected") or [],
            "note": "the owner chose this nearest voice after hearing it beside the still; it differs on %s"
                    % (", ".join(row.get("differs_on") or []) or "nothing")}
    record["voice_pair"] = pair
    path.write_text(json.dumps(record, indent=1), encoding="utf-8")
    return pair


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--character", type=pathlib.Path,
                    help="a make_character.py character.json: pair again for its person and write voice_pair back")
    ap.add_argument("--age", type=int)
    ap.add_argument("--gender")
    ap.add_argument("--ethnicity", help="as make_character.py --ethnicity, e.g. 'Black American'; matched on the "
                                        "voice's accent, description and name, and said in the Voice Design description")
    ap.add_argument("--accent", help="e.g. american, british; an 'african american' accent counts as american")
    ap.add_argument("--energy", help="how they sound, e.g. upbeat, calm, warm")
    ap.add_argument("--voices", help="a saved GET /v1/voices, GET /v2/voices or GET /v1/shared-voices reply, or the "
                                     "GooseWorks MCP's data_call_provider reply for GET /v1/voices")
    ap.add_argument("--exclude", action="append", default=[], help="a voice_id not to use: a rejected voice, or another brand's narrator")
    ap.add_argument("--sample-text", help="100-1000 characters for the design previews; else auto-generated")
    ap.add_argument("--choose", help="with --character: the owner's pick from voice_pair.nearest, after hearing it beside the still")
    ap.add_argument("--out", type=pathlib.Path)
    a = ap.parse_args()
    voices = load_voices(a.voices) if a.voices else None
    if a.choose:
        if not a.character:
            raise SystemExit("--choose needs --character")
        pair = choose_nearest(a.character, a.choose)
    elif a.character:
        if not voices:
            raise SystemExit("--character needs --voices: pairing again picks from a voice list, never by hand")
        pair = repair_character(a.character, voices, tuple(a.exclude), a.sample_text)
    else:
        if a.age is None or not a.gender:
            raise SystemExit("--age and --gender are required (or --character)")
        pair = pair_voice(a.age, a.gender, a.accent, a.energy, voices, tuple(a.exclude), a.sample_text, a.ethnicity)
    text = json.dumps(pair, indent=1)
    if a.out:
        a.out.parent.mkdir(parents=True, exist_ok=True)
        a.out.write_text(text, encoding="utf-8")
    print(text)
    return 0


if __name__ == "__main__":
    sys.exit(main())

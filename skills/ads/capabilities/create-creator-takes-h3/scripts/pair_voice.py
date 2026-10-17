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
    pair_voice.py --character work/character/character.json --accept-nearest   # no fit, no Voice Design

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

# One table for the person's --ethnicity and for the words a voice's accent label, description or
# name use (voice lists mark heritage there, not in a label of its own: Julius is "accent: african
# american", Miles is "accent: american" described as "young African American male"). Each word is
# (heritage, specific): a specific one fits only itself or its heritage's general words, never a
# sibling (a Korean person never takes a voice described as Japanese). Longest phrase first, and a
# found phrase is removed, so "african american" never also reads as "african".
HERITAGE_ALIASES = [
    ("african american", "black", "black:american"), ("afro american", "black", "black:american"),
    ("black american", "black", "black:american"), ("black", "black", None),
    ("african", "african", None), ("nigerian", "african", "nigerian"), ("ghanaian", "african", "ghanaian"),
    ("kenyan", "african", "kenyan"), ("south african", "african", "south_african"),
    ("ethiopian", "african", "ethiopian"), ("somali", "african", "somali"),
    ("south asian", "south_asian", None), ("desi", "south_asian", None), ("indian", "south_asian", "indian"),
    ("hindi", "south_asian", "indian"), ("pakistani", "south_asian", "pakistani"), ("urdu", "south_asian", "pakistani"),
    ("bangladeshi", "south_asian", "bangladeshi"), ("bengali", "south_asian", "bangladeshi"),
    ("sri lankan", "south_asian", "sri_lankan"),
    ("east asian", "east_asian", None), ("chinese", "east_asian", "chinese"),
    ("mandarin", "east_asian", "chinese:mandarin"), ("cantonese", "east_asian", "chinese:cantonese"), ("taiwanese", "east_asian", "taiwanese"),
    ("japanese", "east_asian", "japanese"), ("korean", "east_asian", "korean"),
    ("southeast asian", "southeast_asian", None), ("filipino", "southeast_asian", "filipino"),
    ("filipina", "southeast_asian", "filipino"), ("tagalog", "southeast_asian", "filipino"),
    ("vietnamese", "southeast_asian", "vietnamese"), ("thai", "southeast_asian", "thai"),
    ("indonesian", "southeast_asian", "indonesian"), ("malaysian", "southeast_asian", "malaysian"),
    ("latino", "latino", None), ("latina", "latino", None), ("latinx", "latino", None), ("hispanic", "latino", None),
    ("latin american", "latino", None), ("mexican", "latino", "mexican"), ("puerto rican", "latino", "puerto_rican"),
    ("colombian", "latino", "colombian"), ("cuban", "latino", "cuban"), ("dominican", "latino", "dominican"),
    ("middle eastern", "middle_eastern", None), ("arab", "middle_eastern", "arab"), ("arabic", "middle_eastern", "arab"),
    ("lebanese", "middle_eastern", "arab:lebanese"), ("egyptian", "middle_eastern", "arab:egyptian"), ("persian", "middle_eastern", "persian"),
    ("iranian", "middle_eastern", "persian"), ("farsi", "middle_eastern", "persian"), ("turkish", "middle_eastern", "turkish"),
    ("indigenous", "indigenous", None), ("native american", "indigenous", "native_american"),
    ("american indian", "indigenous", "native_american"),
    ("west indian", "caribbean", None), ("caribbean", "caribbean", None), ("jamaican", "caribbean", "jamaican"),
    ("trinidadian", "caribbean", "trinidadian"), ("haitian", "caribbean", "haitian"),
    ("first nations", "indigenous", "native_american"), ("pacific islander", "indigenous", "pacific"),
    ("polynesian", "indigenous", "pacific"), ("native hawaiian", "indigenous", "pacific:hawaiian"),
    ("samoan", "indigenous", "pacific:samoan"), ("maori", "indigenous", "pacific:maori"),
    ("aboriginal", "indigenous", "aboriginal"),
    # Broad: "Asian" alone fits an East or Southeast Asian person; it blocks a White one.
    ("asian american", "asian", None), ("asian", "asian", None),
]
# A specific with a parent ("arab:lebanese") fits its parent ("arab": an Arabic voice for a Lebanese
# person) but never a sibling ("arab:egyptian"); a Chinese voice fits a Cantonese person, a Mandarin one doesn't.
# "native American" in "a native American English speaker" is about the language, not heritage.
LANGUAGE_NATIVE = re.compile(r"\bnative (?=(american|british|english|australian|canadian)( english)? (speaker|accent|english|voice\b(?! (actor|actress|artist|talent|over))))")
# A White person takes a voice that names no other heritage; a voice described with these words
# fits only a White person ("White South African" is not a Black South African's voice).
WHITE_WORDS = ("white", "caucasian", "european")
# Words that look like heritage but name something else.
NOT_HERITAGE = re.compile(r"\bblack metal\b")
# A mixed heritage checks nothing: "biracial Black/Latino" is not one heritage's voices only.
MIXED = re.compile(r"\b(mixed|bi[- ]?racial|multi[- ]?racial|multi[- ]?ethnic|afro[- ]?latin\w*)\b")
ASIAN = {"asian", "east_asian", "southeast_asian"}
# "Black" also describes African and Caribbean people: "Black Nigerian" is Nigerian, and a voice
# described as "Black Nigerian" fits them, but a voice described only as "Black" does not.
BLACK_ALSO = {"african", "caribbean"}
# Accent labels that count as the wanted accent, one way only: an "african american" accent is
# american; an "american" accent is never "african".
ACCENT_ALIASES = {
    "american": {"african_american", "black_american", "afro_american", "us_southern", "us_midwest", "new_york", "general_american", "standard_american"},
    "indian": {"en_indian"},
}
# The person is never changed to fit a voice: on 16 Oct an agent made the presenter Black American because the
# account list had no East Asian woman. Search the library, then design one.
NEVER_BEND = "Never change the person (heritage, age or gender) to fit a voice list."
MCP_NO_DESIGN = ("Search the shared voice library first (library_search: free GET /v1/shared-voices calls through "
                 "the GooseWorks MCP's data_call_provider, each reply saved) and pair again with every list "
                 "(--voices account.json --voices library-1.json ...). Only when no list fits, quote and run the Voice "
                 "Design request through data_post_provider, play its previews beside the still, and save the chosen "
                 "one with the `save` call. When the owner turns a voice down, pair again with --character --voices <list> "
                 "--exclude <voice_id>. " + NEVER_BEND + " Never use a voice that is not in voice_pair.")

LIBRARY_DONE = ("The voice library was searched to its end and nothing fits: quote and run the Voice Design request "
                "through data_post_provider, play its previews beside the still, save the chosen one with the `save` "
                "call and record it with --character --designed <voice_id>. When the owner turns a voice down, pair "
                "again with --character --voices <list> --exclude <voice_id>. " + NEVER_BEND)
LIBRARY_MORE = ("Nothing fits yet, and the searches in library_next_page have more: run each request as given (its "
                "query has the next `page`), save the reply as its `save_as`, and pair again with every list before "
                "any Voice Design. " + NEVER_BEND)

# Library search words per heritage: the shared library's search reads names and descriptions, which
# say "African American", "Latina", "Indian" or "Asian-American", not the broad group's name.
LIBRARY_SEARCH_WORDS = {
    "black": ["african american", "black"], "african": ["african"], "caribbean": ["caribbean", "jamaican"],
    "south_asian": ["indian", "south asian"], "east_asian": ["asian", "chinese"], "southeast_asian": ["asian", "filipino"],
    "asian": ["asian"], "latino": ["latina", "hispanic"], "middle_eastern": ["arab", "middle eastern"],
    "indigenous": ["native american"],
}


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


def words_in(text):
    """Every (heritage, specific) the text names, longest phrase first, each found phrase removed."""
    text = LANGUAGE_NATIVE.sub("", " ".join(re.sub(r"[-_/,.()|&+]", " ", text.lower()).split()))
    text = NOT_HERITAGE.sub(" ", text)
    found = set()
    for word, group, specific in sorted(HERITAGE_ALIASES, key=lambda row: -len(row[0])):
        pattern = r"\b%s\b" % re.escape(word)
        if re.search(pattern, text):
            found.add((group, specific))
            text = re.sub(pattern, " ", text)
    return found, text


def heritage(ethnicity):
    """The person's heritage as (heritage, specific), "white", or None when unknown or mixed (a mixed
    word, or words for two heritages, as in "biracial Black/Latino")."""
    if MIXED.search((ethnicity or "").lower()):
        return None
    found, rest = words_in(ethnicity or "")
    white = any(re.search(r"\b%s\b" % w, rest) for w in WHITE_WORDS)
    groups = {g for g, _ in found}
    if ("black" in groups and len(groups - {"black"}) == 1 and (groups - {"black"}) <= BLACK_ALSO
            and all(sp is None for g, sp in found if g == "black")):
        found = {(g, sp) for g, sp in found if g != "black"}  # "Black Nigerian" is Nigerian
        groups = {g for g, _ in found}
    if len(groups) > 1 and "asian" in groups and len(groups - {"asian"}) == 1 and (groups - {"asian"}) <= ASIAN:
        found = {(g, sp) for g, sp in found if g != "asian"}  # "Asian (Korean)" is Korean
        groups = {g for g, _ in found}
    if white:
        return "white" if not found else None
    if len(groups) != 1:
        return None
    specifics = {sp for _, sp in found if sp}
    specifics = {sp for sp in specifics if not any(other.startswith(sp + ":") for other in specifics)}  # "Lebanese Arab"
    if len(specifics) > 1:
        return None  # "Korean/Japanese" is mixed, not "East Asian"
    return (groups.pop(), specifics.pop() if specifics else None)


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
    """Every (heritage, specific) the voice's accent, descriptive label, description or name names,
    with ("white", None) when it says White."""
    found, rest = words_in(" ".join([labels.get("accent", ""), labels.get("descriptive", ""), text_of(voice.get("description")),
                                     text_of(raw_labels(voice).get("description")), text_of(voice.get("name"))]))
    if any(re.search(r"\b%s\b" % w, rest) for w in WHITE_WORDS):
        found.add(("white", None))
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


def years_from_band(age, label):
    """How many years the age is from the voice's age band (0 inside it); far when unlabelled."""
    for lo, hi, band in AGE_BANDS:
        if band == label:
            return 0 if age is None or lo <= age < hi else (lo - age if age < lo else age - hi)
    return 999


def accent_fits(wanted, label):
    """The voice's accent is the wanted one, or one ACCENT_ALIASES counts as it."""
    return bool(label) and (label == wanted or label in ACCENT_ALIASES.get(wanted, ()))


def specific_fits(a, b):
    """Two specifics fit when either is general (None), they are the same, or one is the other's parent."""
    return a is None or b is None or a == b or b.startswith(a + ":") or a.startswith(b + ":")


def marker_fits(person, marker):
    group, specific = person
    m_group, m_specific = marker
    if m_group == group:
        return specific_fits(m_specific, specific)
    return (m_group == "asian" and group in ASIAN) or (group == "asian" and m_group in ASIAN)


def heritage_fits(person, found):
    """Every heritage named on the voice fits the person's, and at least one is named; a specific one
    fits only itself or its heritage's general words. A White person takes a voice that names none.
    Unknown or mixed checks nothing."""
    if person is None:
        return True
    if person == "white":
        return found <= {("white", None)}
    specifics = [sp for _, sp in found if sp]
    if any(not specific_fits(a, b) for i, a in enumerate(specifics) for b in specifics[i + 1:]):
        return False  # "Indian and Pakistani" names two heritages; it fits neither, not even "South Asian"
    own = [m for m in found if marker_fits(person, m)]
    also = [m for m in found if m == ("black", None) and person[0] in BLACK_ALSO]
    return bool(own) and len(own) + len(also) == len(found)


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
            best = (key, {"source": "library", "voice_id": vid, "name": text_of(voice.get("name")) or None, "labels": labels,
                          "public_owner_id": voice.get("public_owner_id"), "preview_url": voice.get("preview_url"),
                          "matched_on": matched})
    return best[1] if best else None


def nearest(voices, wanted, exclude=(), age=None, limit=3):
    """Up to `limit` voices of the right gender and heritage, closest age first, each with what differs:
    something real to play next to the still while a Voice Design voice is quoted. When the lists hold
    no voice of the person's heritage, the closest voices of the right gender from any heritage come
    back instead, each marked `heritage` in differs_on, so the owner is told rather than left with
    nothing. The person never changes to fit a voice."""
    group = heritage(wanted.get("ethnicity"))
    rows = _nearest_rows(voices, wanted, exclude, age, group, across=False)
    if not rows:
        rows = _nearest_rows(voices, wanted, exclude, age, group, across=True)
    return [row for _, row in sorted(rows, key=lambda r: r[0])[:limit]]


def _nearest_rows(voices, wanted, exclude, age, group, across):
    rows = []
    for voice in voices or []:
        vid = voice_id(voice)
        if not vid or vid in exclude:
            continue
        labels = voice_record(voice)
        if labels.get("gender") != wanted["gender"]:
            continue
        if not across and not heritage_fits(group, voice_heritages(voice, labels)):
            continue
        differs = ["heritage"] if across else []
        fit = age_fit(age, labels.get("age")) if age is not None else None
        if fit != "exact":
            differs.append("age %s" % (labels.get("age") or "unlabelled"))
        if wanted.get("accent") and not accent_fits(wanted["accent"], labels.get("accent")):
            differs.append("accent %s" % (labels.get("accent") or "unlabelled"))
        gap = years_from_band(age, labels.get("age"))
        rows.append(((gap, len(differs), text_of(voice.get("name")), vid),
                     {"voice_id": vid, "name": text_of(voice.get("name")) or None, "labels": labels,
                      "preview_url": voice.get("preview_url"), "differs_on": differs}))
    return rows


def library_searches(gender, ethnicity=None, language="en"):
    """The free GET /v1/shared-voices calls that find this person's voices in the shared library, most
    specific first ("korean", then "asian"). Its voices speak through text-to-speech without being added."""
    g = gender_label(gender)
    person = heritage(ethnicity)
    words = []
    if isinstance(person, tuple):
        group, specific = person
        # "black:american" names the group's American branch; "american" alone would match almost every voice.
        if specific and specific.split(":")[-1] != "american":
            words.append(specific.split(":")[-1].replace("_", " "))
        # With a specific heritage, only the group's general words: a Korean person never searches "chinese".
        words += [w for w in LIBRARY_SEARCH_WORDS.get(group, [])
                  if not specific or all(specific_fits(sp, specific) for _, sp in words_in(w)[0])]
        if group == "latino" and g == "male":
            words = ["latino" if w == "latina" else w for w in words]
    seen, queries = set(), []
    for word in words or [None]:
        if word in seen:
            continue
        seen.add(word)
        query = {"gender": g if g != "neutral" else None, "language": language, "page_size": 100, "page": 0}
        if word:
            query["search"] = word
        query = {k: v for k, v in query.items() if v is not None}
        queries.append({"provider": "elevenlabs", "path": "/v1/shared-voices", "query": query,
                        "save_as": library_file(query)})
    return queries[:3]


LIBRARY_FILE = re.compile(r"library-(?P<key>[a-z0-9-]+)-p(?P<page>\d+)\.json$")


def library_key(query):
    """One search's identity without its page: gender, language and search word, so two searches never share a file."""
    parts = [query.get("gender") or "any", query.get("language") or "any", query.get("search") or "all"]
    return "-".join(re.sub(r"[^a-z0-9]+", "-", str(p).lower()).strip("-") or "x" for p in parts)


def library_file(query):
    """The file a library search's reply is saved as: its whole query and its page, so paging reads only the last page."""
    return "library-%s-p%d.json" % (library_key(query), int(query.get("page") or 0))


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


def library_status(paths, gender, ethnicity=None):
    """Whether every library search this person needs (library_searches) was run to its last page, read from the
    saved replies' save_as names and has_more (so an empty search counts). Searches never run come back in
    `missing`, and a search whose last saved page has more comes back in `more` as its next request, whole.
    {"searched": bool, "missing": [request], "more": [request]}"""
    last = {}
    for path in paths or []:
        named = LIBRARY_FILE.search(pathlib.Path(path).name)
        if not named:
            continue
        data = _unwrap(json.loads(pathlib.Path(path).read_text(encoding="utf-8")))
        if not (isinstance(data, dict) and "has_more" in data):
            continue
        page = int(named.group("page"))
        if page >= last.get(named.group("key"), (-1, False))[0]:
            last[named.group("key")] = (page, bool(data.get("has_more")))
    missing, more = [], []
    for request in library_searches(gender, ethnicity):
        seen = last.get(library_key(request["query"]))
        if seen is None:
            missing.append(request)
        elif seen[1]:
            query = {**request["query"], "page": seen[0] + 1}
            more.append({**request, "query": query, "save_as": library_file(query)})
    return {"searched": not missing and not more, "missing": missing, "more": more}


def pair_voice(age, gender, accent=None, energy=None, voices=None, exclude=(), sample_text=None, ethnicity=None,
               library=None):
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
    if library is None or isinstance(library, (list, tuple)):
        library = library_status(library, gender, ethnicity)
    searched = library["searched"]
    pair = {"source": "voice_design", "wanted": wanted, "person": person, "rejected": rejected,
            "library_searched": bool(searched)}
    if library.get("missing"):
        pair["library_search"] = library["missing"]
    elif not searched and not library.get("more"):
        pair["library_search"] = library_searches(gender, ethnicity)
    if library.get("more"):
        pair["library_next_page"] = library["more"]
    pair.update(design_request(age, gender, accent, energy, sample_text, ethnicity))
    if voices:
        pair["nearest"] = nearest(voices, wanted, exclude, int(age))
        if pair["nearest"] and "heritage" in pair["nearest"][0]["differs_on"]:
            pair["nearest_note"] = ("No voice in the lists matches this person's heritage; `nearest` holds the closest "
                                    "voices of the right gender from other heritages. Tell the owner so in one line. " + NEVER_BEND)
    pair["note"] = ("no saved voice fits %s; Voice Design is a paid call: quote it, listen to the previews, then save one. %s"
                    % (", ".join("%s %s" % (k, v) for k, v in wanted.items() if k != "energy"),
                       LIBRARY_DONE if searched else LIBRARY_MORE if library.get("more") and not pair.get("library_search")
                       else MCP_NO_DESIGN)) \
        if (voices or searched) else \
                   ("no voice list given; search the library (library_search) before Voice Design, a paid call: quote it, "
                    "listen to the previews, then save one. " + NEVER_BEND)
    return pair


def load_voice_lists(paths):
    """Every saved list (the account's and each library search), merged; a voice listed twice counts once."""
    merged, seen = [], set()
    for path in paths or []:
        for voice in load_voices(path) or []:
            vid = voice_id(voice)
            if vid and vid not in seen:
                seen.add(vid)
                merged.append(voice)
    return merged


def _unwrap(data):
    # The MCP reply as a host saves it can be {"result": {"data": {"voices": [...]}}}: unwrap until the list.
    for _ in range(3):
        if not isinstance(data, dict) or "voices" in data:
            break
        inner = next((data[k] for k in ("result", "data") if isinstance(data.get(k), dict)), None)
        if inner is None:
            break
        data = inner
    return data


def load_voices(path):
    """A saved voice list: ElevenLabs' {"voices": [...]}, the GooseWorks MCP's data_call_provider reply
    ({"data": {"voices": [...]}}), a video_formats reply ({"result": {"voices": [...]}}) or a bare list."""
    data = _unwrap(json.loads(pathlib.Path(path).read_text(encoding="utf-8")))
    return data.get("voices", data) if isinstance(data, dict) else data


def repair_character(path, voices, exclude=(), sample_text=None, library_paths=None):
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
                      rejected, sample_text, person.get("ethnicity"), list(library_paths or []))
    record["voice_pair"] = pair
    path.write_text(json.dumps(record, indent=1), encoding="utf-8")
    return pair


def library_pending(old):
    """A pair still waiting on the library: no voice is designed or accepted before it is searched. Only an explicit
    library_searched marker counts, so a pair made before 2.8.0 (no marker) is searched first too."""
    if old.get("library_searched") is not True:
        raise SystemExit("search the voice library first (voice_pair.library_search or library_next_page), then pair "
                         "again with every list: --character ... --voices ... ")


def record_designed(path, voice_id, name=None):
    """After Voice Design: the saved voice (POST /v1/text-to-voice's voice_id) becomes the pair, so every later
    step reads its id from voice_pair."""
    record = json.loads(path.read_text(encoding="utf-8"))
    old = record.get("voice_pair") or {}
    library_pending(old)
    if old.get("source") != "voice_design":
        raise SystemExit("--designed records a saved Voice Design voice; this voice_pair is source %r" % old.get("source"))
    pair = {"source": "voice_design_saved", "voice_id": voice_id, "name": name, "wanted": old.get("wanted"),
            "person": old.get("person"), "rejected": old.get("rejected") or [], "request": old.get("request"),
            "note": "designed for this person and saved; play it beside the still and approve the two together"}
    record["voice_pair"] = pair
    path.write_text(json.dumps(record, indent=1), encoding="utf-8")
    return pair


def accept_nearest(path, library_unavailable=False):
    """When no voice fits fully, take the first `nearest` voice (the closest of the right gender and heritage,
    or across heritage when none shares it: `tell_owner` says so) as the pair: where Voice Design can't run,
    or when the owner picks this free voice instead of a designed one. Nobody picks from the list: the owner
    hears it beside the still and accepts it, or it is rejected and pairing runs again with --exclude."""
    record = json.loads(path.read_text(encoding="utf-8"))
    old = record.get("voice_pair") or {}
    if not library_unavailable:
        library_pending(old)
    rows = old.get("nearest") or []
    if old.get("source") != "voice_design" or not rows:
        raise SystemExit("--accept-nearest needs a voice_design voice_pair with `nearest` voices; this one has %s"
                         % ("none" if old.get("source") == "voice_design" else "source %r" % old.get("source")))
    row = rows[0]
    differs = row.get("differs_on") or []
    pair = {"source": "library_nearest", "voice_id": row["voice_id"], "name": row.get("name"), "labels": row.get("labels"),
            "preview_url": row.get("preview_url"), "differs_on": differs,
            "wanted": old.get("wanted"), "person": old.get("person"), "rejected": old.get("rejected") or [],
            "note": "the closest voice in the list (no voice fits fully; taken instead of Voice Design); it differs on %s. "
                    "Play it beside the still; if the owner rejects it, pair again with --character --voices <list> --exclude %s"
                    % (", ".join(differs) or "nothing", row["voice_id"])}
    if "heritage" in differs:
        pair["tell_owner"] = ("No voice in the library matches this person's heritage, so this is the closest one. "
                              "Play it beside the still. " + NEVER_BEND)
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
    ap.add_argument("--voices", action="append", default=[],
                    help="a saved GET /v1/voices, GET /v2/voices or GET /v1/shared-voices reply, or the GooseWorks MCP's "
                         "data_call_provider reply for one (repeatable: the account list and each library_search reply)")
    ap.add_argument("--library-searches", action="store_true",
                    help="print the free GET /v1/shared-voices calls for --gender and --ethnicity, and stop")
    ap.add_argument("--exclude", action="append", default=[], help="a voice_id not to use: a rejected voice, or another brand's narrator")
    ap.add_argument("--sample-text", help="100-1000 characters for the design previews; else auto-generated")
    ap.add_argument("--designed", metavar="VOICE_ID",
                    help="with --character: record the voice_id POST /v1/text-to-voice returned as the pair")
    ap.add_argument("--designed-name", help="with --designed: the saved voice's name")
    ap.add_argument("--library-unavailable", action="store_true",
                    help="with --accept-nearest: the host can't search the voice library (a GooseWorks server without "
                         "/v1/shared-voices answers unsupported_provider_endpoint); only with the owner's yes")
    ap.add_argument("--accept-nearest", action="store_true",
                    help="with --character: take the first voice_pair.nearest voice as the pair, when Voice Design can't run or the owner picks this free voice")
    ap.add_argument("--out", type=pathlib.Path)
    a = ap.parse_args()
    if a.library_searches:
        if not a.gender:
            raise SystemExit("--library-searches needs --gender (and --ethnicity)")
        print(json.dumps(library_searches(a.gender, a.ethnicity), indent=1))
        return 0
    voices = load_voice_lists(a.voices) if a.voices else None
    if a.designed:
        if not a.character:
            raise SystemExit("--designed needs --character")
        pair = record_designed(a.character, a.designed.strip(), a.designed_name)
    elif a.accept_nearest:
        if not a.character:
            raise SystemExit("--accept-nearest needs --character")
        pair = accept_nearest(a.character, a.library_unavailable)
    elif a.character:
        if not a.voices:
            raise SystemExit("--character needs --voices: pairing again picks from a voice list, never by hand")
        pair = repair_character(a.character, voices, tuple(a.exclude), a.sample_text, a.voices)
    else:
        if a.age is None or not a.gender:
            raise SystemExit("--age and --gender are required (or --character)")
        pair = pair_voice(a.age, a.gender, a.accent, a.energy, voices, tuple(a.exclude), a.sample_text, a.ethnicity,
                          list(a.voices))
    text = json.dumps(pair, indent=1)
    if a.out:
        a.out.parent.mkdir(parents=True, exist_ok=True)
        a.out.write_text(text, encoding="utf-8")
    print(text)
    return 0


if __name__ == "__main__":
    sys.exit(main())

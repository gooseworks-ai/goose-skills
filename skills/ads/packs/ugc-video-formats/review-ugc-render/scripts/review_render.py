#!/usr/bin/env python3
"""Pre-publish review gate for UGC video renders.

Transcribes a finished render's AUDIO with Whisper, word-diffs the transcript
against the approved spoken script, and gates pinning the final render
(video_project_upsert patch.final_render_id). This catches the failure mode
where Seedance mis-voices a word in the generated audio (e.g. the approved line
"human-vetted" is spoken as "human witted") — a defect the render carries in its
audio, which an eyeball `/watch` QC routinely misses and which a caption pass
then faithfully bakes in.

It is the runnable, gating counterpart to the content-goose
`coworkers/video/atoms/review/review-transcript-integrity` atom.

Usage:
    review_render.py --video working/final.mp4 --script-file working/approved-script.txt
    review_render.py --video final.mp4 --script "Okay, real talk..." --expect-music
    review_render.py --video final.mp4 --script-file s.txt \
        --brand-term "AG1" --alias "AG1=A G one" --pronunciations working/pronunciations.json

Exit codes:
    0  PASS  — safe to pin the final render (video_project_upsert patch.final_render_id)
    2  FAIL  — do NOT pin it; fix (usually re-roll a new seed) and re-run
    3  ERROR — could not run the check (no transcription backend / bad input)

Bounded equivalence. Before the diff, the script and the transcript are put in
one canonical spoken form, so correct speech that is merely WRITTEN differently
is not a defect:
  - numbers: digits == number words ("49" == "forty-nine", "105" == "one hundred
    and five", "2,500" == "two thousand five hundred", "2.5" == "two point five",
    "2026" == "twenty twenty six")
  - units after a quantity: "5mg" == "five milligrams", "30%" == "thirty
    percent", "$49" == "forty nine dollars" (a unit word NOT after a quantity is
    left alone, so a brand "MG" never becomes "milligrams")
  - URLs: "example.com" == "example dot com"; a leading "www." is optional
  - contractions: "don't" == "do not", "can't" == "cannot" == "can not"
  - fused/split words: "braxleybands" == "braxley bands" (exact concatenation of
    2-3 words only, never fuzzy; letters spelled one by one are NOT fused)
  - confirmed spoken aliases (--alias / --pronunciations): "AG1" == "A G one"
Always a HIGH failure: a different, added or dropped number, unit or negation;
a brand name not heard as approved (named by --brand-term or a confirmed
pronunciation); a similar-looking word swapped 1:1 ("vetted" → "witted").
Other dropped or extra words are medium/low: they lower the similarity, and the
gate fails only when it falls below --min-ratio (0.90). Brand words are never
removed from the diff.

The word-alignment + verdict logic is a pure function (`review_transcript`)
so it is unit-tested without needing audio or a network call.
"""
from __future__ import annotations

import argparse
import json
import os
import re
import shutil
import subprocess
import sys
import tempfile
import unicodedata
from dataclasses import dataclass, field, asdict
from difflib import SequenceMatcher

# ── Tunables ────────────────────────────────────────────────────────────────
DEFAULT_MIN_RATIO = 0.90      # transcript↔script token similarity to pass
SILENCE_MEAN_DB = -45.0       # quieter mean volume than this ⇒ effectively silent
# A substitution between two short, similarly-spelled words is almost always a
# mis-voicing (vetted→witted, Hume→Hune), not a paraphrase. Flag it HIGH.
MISVOICE_MAX_LEN_DELTA = 3
MISVOICE_MIN_CHAR_SIM = 0.5
# Spoken form vs brand spelling made only of declared --brand-term words ("ak mee" vs
# "acme" = 0.67) must at least look this alike to be accepted.
BRAND_SWAP_MIN_CHAR_SIM = 0.6


def _char_sim(a: str, b: str) -> float:
    return SequenceMatcher(None, a, b).ratio()


# ── Canonical spoken form ───────────────────────────────────────────────────
# Every rule below is bounded and deterministic. Each canonical token remembers
# the original words it came from so the report can quote what was written/heard.

class _Tok:
    __slots__ = ("text", "orig", "src", "unit")

    def __init__(self, text: str, orig: str, src: object, unit: bool = False):
        self.text = text    # canonical token
        self.orig = orig    # original wording it came from (for the report)
        self.src = src      # identity of the source word (dedupes the report)
        self.unit = unit    # a unit word that follows a quantity ("5 [milligrams]")

    def spelled(self) -> str | None:
        """'one' for a 1 that was written as the word "one" (lets every one == everyone)."""
        w = self.orig.lower()
        return w if w.isalpha() and w in _NUMBER_WORDS and self.text != w else None

    def __repr__(self) -> str:  # pragma: no cover - debugging aid
        return f"_Tok({self.text!r}, {self.orig!r})"


def _merge(toks: list[_Tok], text: str) -> _Tok:
    return _Tok(text, _orig_text(toks), object())


def _orig_text(toks: list[_Tok]) -> str:
    parts, last = [], None
    for t in toks:
        if t.src is not last:
            parts.append(t.orig)
            last = t.src
    return " ".join(parts)


_SMALL = {w: i for i, w in enumerate(
    "zero one two three four five six seven eight nine ten eleven twelve thirteen "
    "fourteen fifteen sixteen seventeen eighteen nineteen".split())}
_TENS = {w: 10 * (i + 2) for i, w in enumerate(
    "twenty thirty forty fifty sixty seventy eighty ninety".split())}
# "second" is left out on purpose: "one second" is a duration far more often than an ordinal.
_ORD_SMALL = {"first": 1, "third": 3, "fourth": 4, "fifth": 5, "sixth": 6, "seventh": 7,
              "eighth": 8, "ninth": 9, "tenth": 10, "eleventh": 11, "twelfth": 12,
              "thirteenth": 13, "fourteenth": 14, "fifteenth": 15, "sixteenth": 16,
              "seventeenth": 17, "eighteenth": 18, "nineteenth": 19}
_ORD_TENS = {w: 10 * (i + 2) for i, w in enumerate(
    "twentieth thirtieth fortieth fiftieth sixtieth seventieth eightieth ninetieth".split())}
_NUMBER_WORDS = set(_SMALL) | set(_TENS) | set(_ORD_SMALL) | set(_ORD_TENS) | {"hundred", "thousand"}
_A_COUNTS = ("hundred", "thousand", "million", "billion")   # "a million" == "one million"
_MULTIPLIERS = {"hundred": 100, "thousand": 1000, "k": 1000, "million": 10 ** 6, "billion": 10 ** 9}

# Unit spellings → one canonical word. Applied ONLY right after a quantity.
_UNIT_WORDS = {
    "mg": "milligrams", "milligram": "milligrams", "milligrams": "milligrams",
    "mcg": "micrograms", "µg": "micrograms", "ug": "micrograms",
    "microgram": "micrograms", "micrograms": "micrograms",
    "g": "grams", "gram": "grams", "grams": "grams",
    "kg": "kilograms", "kgs": "kilograms", "kilo": "kilograms", "kilos": "kilograms",
    "kilogram": "kilograms", "kilograms": "kilograms",
    "ml": "milliliters", "milliliter": "milliliters", "milliliters": "milliliters",
    "millilitre": "milliliters", "millilitres": "milliliters",
    "l": "liters", "liter": "liters", "liters": "liters", "litre": "liters", "litres": "liters",
    "oz": "ounces", "ounce": "ounces", "ounces": "ounces",
    "lb": "pounds", "lbs": "pounds", "pound": "pounds", "pounds": "pounds",
    "percent": "percent", "pct": "percent",
    "dollar": "dollars", "dollars": "dollars", "usd": "dollars",
    "cent": "cents", "cents": "cents", "euro": "euros", "euros": "euros",
    "hr": "hours", "hrs": "hours", "hour": "hours", "hours": "hours",
    "min": "minutes", "mins": "minutes", "minute": "minutes", "minutes": "minutes",
    "sec": "seconds", "secs": "seconds", "second": "seconds", "seconds": "seconds",
    "cal": "calories", "calorie": "calories", "calories": "calories",
    "day": "days", "days": "days", "week": "weeks", "weeks": "weeks",
    "month": "months", "months": "months", "year": "years", "years": "years",
    "x": "times", "times": "times",
}
_CURRENCY = {"$": "dollars", "£": "pounds", "€": "euros"}

# Negations an alias's spoken form may not add ("no"/"nor" are allowed as syllables: "no-mad").
_ALIAS_FORBIDDEN = frozenset({"not", "never", "without", "none", "nothing", "nobody"})
_NEGATIONS = frozenset({"not", "no", "never", "nothing", "nobody", "none", "nowhere",
                        "neither", "nor", "without"})

# Contractions. Ambiguous apostrophe-less spellings (cant, wont, ill, well, were,
# shell, hell, id, shed) are deliberately NOT expanded.
_APOS_CONTRACTIONS = {"can't": ["can", "not"], "won't": ["will", "not"],
                      "shan't": ["shall", "not"], "i'm": ["i", "am"], "let's": ["let", "us"]}
_BARE_CONTRACTIONS = {
    "dont": ["do", "not"], "doesnt": ["does", "not"], "didnt": ["did", "not"],
    "isnt": ["is", "not"], "arent": ["are", "not"], "wasnt": ["was", "not"],
    "werent": ["were", "not"], "havent": ["have", "not"], "hasnt": ["has", "not"],
    "hadnt": ["had", "not"], "wouldnt": ["would", "not"], "shouldnt": ["should", "not"],
    "couldnt": ["could", "not"], "mustnt": ["must", "not"], "neednt": ["need", "not"],
    "cannot": ["can", "not"], "im": ["i", "am"], "youre": ["you", "are"],
    "theyre": ["they", "are"], "ive": ["i", "have"], "youve": ["you", "have"],
    "weve": ["we", "have"], "theyve": ["they", "have"], "youll": ["you", "will"],
    "theyll": ["they", "will"], "itll": ["it", "will"], "thatll": ["that", "will"],
    "youd": ["you", "would"], "theyd": ["they", "would"],
    # "its" and "it's" sound the same; Whisper and script writers swap them.
    "its": ["it", "is"], "thats": ["that", "is"], "whats": ["what", "is"],
    "theres": ["there", "is"], "heres": ["here", "is"],
}
_S_IS = frozenset({"it", "that", "there", "here", "what", "who", "where", "when", "why", "how",
                   "he", "she", "everyone", "everything", "nothing", "someone", "something", "this"})
_APOS_SUFFIX = (("n't", "not"), ("'re", "are"), ("'ve", "have"), ("'ll", "will"),
                ("'d", "would"), ("'m", "am"))

_APOSTROPHES = str.maketrans({"’": "'", "‘": "'", "ʼ": "'", "`": "'"})
_DASHES_RE = re.compile(r"[‐-―−]")
_EDGE_CHARS = "\"'()[]{}<>«»,;:!?….*_~|"
_DOMAIN_RE = re.compile(r"^(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z]{2,}(?:/\S*)?$")
_INITIALISM_RE = re.compile(r"^[a-z](?:\.[a-z])+$")           # a.g  p.m  u.s.a
_ORDINAL_RE = re.compile(r"^(\d+)(?:st|nd|rd|th)$")
_CURRENCY_RE = re.compile(r"^([$£€])(\d{1,3}(?:,\d{3})+|\d+)(?:\.(\d{1,2}))?(k)?$")
_RUN_RE = re.compile(r"\d+(?:[.,]\d+)*|[^\W\d_]+")
_INT_RE = re.compile(r"\d+")
_QUANTITY_RE = re.compile(r"\d+(?:st|nd|rd|th)?")


def _ordinal(n: int) -> str:
    if 10 <= n % 100 <= 20:
        return f"{n}th"
    return f"{n}{ {1: 'st', 2: 'nd', 3: 'rd'}.get(n % 10, 'th') }"


def _is_int(text: str) -> bool:
    return bool(_INT_RE.fullmatch(text))


def _digit_run(run: str) -> list[str]:
    """'1,000' → ['1000']; '2.5' → ['2', 'point', '5']; '1,2' → ['1', '2']."""
    if "," in run:
        if re.fullmatch(r"\d{1,3}(?:,\d{3})+(?:\.\d+)?", run):
            run = run.replace(",", "")
        else:
            return [x for part in run.split(",") for x in _digit_run(part) if x]
    if "." in run:
        out = []
        for k, part in enumerate(run.split(".")):
            if k:
                out.append("point")
            out.append(part)
        return out
    return [run]


def _runs(piece: str) -> list[str]:
    out = []
    for run in _RUN_RE.findall(piece):
        out.extend(_digit_run(run) if run[0].isdigit() else [run])
    return out


def _piece_words(p: str) -> list[str]:
    """Canonical words for one hyphen-free piece of a written word (lowercase)."""
    p = p.strip(_EDGE_CHARS + ".")
    if not p:
        return []
    m = _CURRENCY_RE.match(p)
    if m:
        sym, whole, cents, k = m.groups()
        whole = whole.replace(",", "")
        unit = _CURRENCY[sym]
        if k:
            return [str(int(whole) * 1000), unit]
        if cents and int(whole) == 0 and sym == "$":
            return [str(int(cents.ljust(2, "0"))), "cents"]
        words = [whole, unit]
        if cents and int(cents.ljust(2, "0")):
            words.append(cents.ljust(2, "0"))
        return words
    if p[0] in _CURRENCY:
        return _piece_words(p[1:]) + [_CURRENCY[p[0]]]
    if p.endswith("%"):
        return _piece_words(p[:-1]) + ["percent"]
    if p[0] == "@":
        return ["at"] + _piece_words(p[1:])
    if p[0] == "#":
        rest = _piece_words(p[1:])
        return (["number"] if rest and rest[0][0].isdigit() else ["hashtag"]) + rest
    m = _ORDINAL_RE.match(p)
    if m:
        return [_ordinal(int(m.group(1)))]
    if _INITIALISM_RE.match(p):
        return [p.replace(".", "")]
    if "'" in p:
        if p in _APOS_CONTRACTIONS:
            return list(_APOS_CONTRACTIONS[p])
        for suffix, word in _APOS_SUFFIX:
            if p.endswith(suffix) and len(p) > len(suffix):
                return _runs(p[: -len(suffix)]) + [word]
        if p.endswith("'s") and p[:-2] in _S_IS:
            return [p[:-2], "is"]
        # possessive / plural possessive / o'clock / y'all: the apostrophe is silent
        p = p.replace("'", "")
    if p in _BARE_CONTRACTIONS:
        return list(_BARE_CONTRACTIONS[p])
    return _runs(p)


def _raw_tokens(text: str) -> list[_Tok]:
    """Split written text into canonical word tokens (before cross-word rules)."""
    text = unicodedata.normalize("NFKD", text or "")
    text = "".join(c for c in text if not unicodedata.combining(c))
    text = _DASHES_RE.sub("-", text.translate(_APOSTROPHES))
    text = text.replace("&", " and ").replace("+", " plus ")
    out: list[_Tok] = []
    chunks = text.split()
    for ci, chunk in enumerate(chunks):
        # "No. 1" / "No.1" is "number one", not a negation
        bare = chunk.strip(_EDGE_CHARS)
        m = re.fullmatch(r"[Nn][Oo]\.(\d[\d,]*)", bare)
        if m:
            src = object()
            out.extend(_Tok(w, bare, src) for w in ["number"] + _piece_words(m.group(1)))
            continue
        if re.fullmatch(r"[Nn][Oo]\.", chunk.strip(_EDGE_CHARS.replace(".", "").replace("…", ""))) and \
                ci + 1 < len(chunks) and \
                chunks[ci + 1].lstrip(_EDGE_CHARS)[:1].isdigit():
            out.append(_Tok("number", bare, object()))
            continue
        orig = chunk.strip(_EDGE_CHARS + ".")
        if not orig:
            continue
        low = orig.lower()
        low_url = re.sub(r"^https?://", "", low)
        if _DOMAIN_RE.match(low_url):
            src = object()
            host, _, path = low_url.partition("/")
            labels = host.split(".")
            if labels[0] == "www" and len(labels) > 2:
                labels = labels[1:]
            words: list[str] = []
            for k, label in enumerate(labels):
                if k:
                    words.append("dot")
                words.extend(_runs(label))
            for seg in path.split("/") if path else []:
                if seg:
                    words.append("slash")
                    words.extend(_runs(seg))
            out.extend(_Tok(w, orig, src) for w in words)
            continue
        if _CURRENCY_RE.match(low):
            src = object()
            out.extend(_Tok(w, orig, src) for w in _piece_words(low))
            continue
        for piece in orig.split("-"):
            src = object()
            out.extend(_Tok(w, piece, src) for w in _piece_words(piece.lower()))
    return out


def _parse_below100(w: list[str], i: int):
    x, n = w[i], len(w)
    if x in _SMALL:
        return _SMALL[x], i + 1, False
    if x in _ORD_SMALL:
        return _ORD_SMALL[x], i + 1, True
    if x in _ORD_TENS:
        return _ORD_TENS[x], i + 1, True
    if x in _TENS:
        v = _TENS[x]
        if i + 1 < n:
            y = w[i + 1]
            if y in _SMALL and 1 <= _SMALL[y] <= 9:
                return v + _SMALL[y], i + 2, False
            if y in _ORD_SMALL and _ORD_SMALL[y] <= 9:
                return v + _ORD_SMALL[y], i + 2, True
        return v, i + 1, False
    return None


def _parse_below1000(w: list[str], i: int):
    n = len(w)
    if w[i] == "a" and i + 1 < n and w[i + 1] in _A_COUNTS:
        v, j, o = 1, i + 1, False
    elif w[i] == "hundred":
        v, j, o = 1, i, False
    else:
        r = _parse_below100(w, i)
        if r is None:
            return None
        v, j, o = r
    if not o and j < n and w[j] == "hundred" and 1 <= v < 100:
        v *= 100
        j += 1
        k = j + 1 if (j + 1 < n and w[j] == "and" and _parse_below100(w, j + 1)) else j
        r = _parse_below100(w, k) if k < n else None
        if r:
            v, j, o = v + r[0], r[1], r[2]
    return v, j, o


def _parse_number(w: list[str], i: int):
    """(value, next_index, is_ordinal) for a spelled number starting at w[i], else None."""
    n = len(w)
    if w[i] == "thousand":
        v, j, o = 1, i, False
    else:
        r = _parse_below1000(w, i)
        if r is None:
            return None
        v, j, o = r
    if not o and j < n and w[j] == "thousand" and v < 1000:
        v *= 1000
        j += 1
        k = j + 1 if (j + 1 < n and w[j] == "and" and _parse_below1000(w, j + 1)) else j
        r = _parse_below1000(w, k) if k < n else None
        if r:
            v, j, o = v + r[0], r[1], r[2]
    return v, j, o


def _spell_numbers(toks: list[_Tok]) -> list[_Tok]:
    w = [t.text for t in toks]
    out: list[_Tok] = []
    i = 0
    while i < len(toks):
        x = w[i]
        start = x in _NUMBER_WORDS or (x == "a" and i + 1 < len(w) and w[i + 1] in _A_COUNTS)
        if x in ("hundred", "thousand") and out and _is_int(out[-1].text):
            start = False   # "5 hundred" → the multiplier pass makes 500
        r = _parse_number(w, i) if start else None
        if r:
            v, j, o = r
            out.append(_merge(toks[i:j], _ordinal(v) if o else str(v)))
            i = j
        else:
            out.append(toks[i])
            i += 1
    return out


def _decimals_and_multipliers(toks: list[_Tok]) -> list[_Tok]:
    out: list[_Tok] = []
    i, n = 0, len(toks)
    while i < n:
        t = toks[i]
        prev = out[-1].text if out else ""
        # "nine point nine nine" → 9 point 99 (fraction digits read one by one)
        if t.text == "point" and _is_int(prev):
            j = i + 1
            while j < n and re.fullmatch(r"\d", toks[j].text):
                j += 1
            out.append(t)
            if j - (i + 1) >= 2:
                out.append(_merge(toks[i + 1:j], "".join(x.text for x in toks[i + 1:j])))
                i = j
            else:
                i += 1
            continue
        nxt = toks[i + 1].text if i + 1 < n else ""
        if _is_int(t.text) and prev != "point":
            # "one and a half" → 1 point 5
            if [x.text for x in toks[i + 1:i + 4]] == ["and", "a", "half"]:
                src = object()
                orig = _orig_text(toks[i:i + 4])
                out.extend([_Tok(t.text, orig, src), _Tok("point", orig, src), _Tok("5", orig, src)])
                i += 4
                continue
            # "5 hundred" / "10k" / "ten thousand" / "1 million" → one integer
            if nxt in _MULTIPLIERS:
                out.append(_merge(toks[i:i + 2], str(int(t.text) * _MULTIPLIERS[nxt])))
                i += 2
                continue
        out.append(t)
        i += 1
    return out


def _units(toks: list[_Tok]) -> list[_Tok]:
    out: list[_Tok] = []
    for t in toks:
        if t.text in _UNIT_WORDS and out and _is_int(out[-1].text):
            t = _Tok(_UNIT_WORDS[t.text], t.orig, t.src, unit=True)
        out.append(t)
    # money: "N dollars (and) M cents" → N dollars M  (matches "$N.MM")
    res: list[_Tok] = []
    i = 0
    while i < len(out):
        t = out[i]
        res.append(t)
        if t.text == "dollars" and len(res) > 1 and _is_int(res[-2].text):
            rest = [x.text for x in out[i + 1:i + 4]]
            if len(rest) >= 3 and rest[0] == "and" and _is_int(rest[1]) and rest[2] == "cents":
                res.append(_merge(out[i + 1:i + 4], rest[1]))
                i += 4
                continue
            if len(rest) >= 2 and _is_int(rest[0]) and rest[1] == "cents":
                res.append(_merge(out[i + 1:i + 3], rest[0]))
                i += 3
                continue
        i += 1
    return res


def _context_fixes(toks: list[_Tok]) -> list[_Tok]:
    out: list[_Tok] = []
    n = len(toks)
    i = 0
    while i < n:
        t = toks[i]
        # "it's been" → it HAS been
        if t.text == "is" and t.orig.translate(_APOSTROPHES).lower().endswith("'s") and \
                i + 1 < n and toks[i + 1].text in ("been", "got", "gotten"):
            t = _Tok("has", t.orig, t.src)
        # spelled letters next to "dot": "w w w dot" → www dot, "dot a i" → dot ai
        if len(t.text) == 1 and t.text.isalpha():
            j = i
            while j < n and len(toks[j].text) == 1 and toks[j].text.isalpha():
                j += 1
            before = out[-1].text if out else ""
            after = toks[j].text if j < n else ""
            if j - i >= 2 and "dot" in (before, after):
                out.append(_merge(toks[i:j], "".join(x.text for x in toks[i:j])))
                i = j
                continue
        out.append(t)
        i += 1
    # a leading "www dot" in front of a domain ("www dot example dot com") is optional
    res: list[_Tok] = []
    i = 0
    while i < len(out):
        if out[i].text == "www" and [x.text for x in out[i + 1:i + 4:2]] == ["dot", "dot"]:
            i += 2
            continue
        res.append(out[i])
        i += 1
    return res


def _base_tokens(text: str) -> list[_Tok]:
    toks = _raw_tokens(text)
    toks = _spell_numbers(toks)
    toks = _decimals_and_multipliers(toks)
    toks = _units(toks)
    return _context_fixes(toks)


def _protected(toks: list[_Tok]) -> list[str]:
    """Quantities, units (after a quantity) and negations — what an alias may never rewrite."""
    return [t.text for t in toks if _QUANTITY_RE.fullmatch(t.text) or t.unit or t.text in _NEGATIONS]


def _alias_pairs(aliases) -> list[tuple[str, str]]:
    if not aliases:
        return []
    if isinstance(aliases, dict):
        pairs = []
        for term, forms in aliases.items():
            for form in ([forms] if isinstance(forms, str) else list(forms or [])):
                pairs.append((term, form))
        return pairs
    pairs = []
    for item in aliases:
        if isinstance(item, dict):
            pairs.append((item.get("term"), item.get("say_as")))
        else:
            term, form = item
            pairs.append((term, form))
    return pairs


def build_aliases(aliases) -> list[tuple[tuple[str, ...], tuple[str, ...]]]:
    """Validate confirmed spoken aliases and compile them to (spoken-form, term) token rules.

    `aliases`: {term: say_as | [say_as, ...]}, [(term, say_as), ...] or
    [{"term", "say_as"}, ...] (the read_pronunciations.py `pronunciations` list).
    An alias may respell a name, digits and number-like syllables included ("AG1" said
    "A G one", "Tenzing" said "ten-zing"). It is refused when the written term has a
    number, unit or negation the spoken form changes ("AG1" = "A G two"), or when the
    spoken form is nothing but numbers, units or negations ("Decagon" = "five").
    Raises ValueError on a bad alias."""
    rules: dict[tuple[str, ...], tuple[str, ...]] = {}
    for term, form in _alias_pairs(aliases):
        if not isinstance(term, str) or not isinstance(form, str) or not term.strip() or not form.strip():
            raise ValueError("each alias needs a written term and a confirmed spoken form")
        term_t, form_t = _base_tokens(term), _base_tokens(form)
        term_w, form_w = tuple(t.text for t in term_t), tuple(t.text for t in form_t)
        if not term_w or not form_w:
            raise ValueError(f'alias "{term}" = "{form}" has no words to match')
        term_p, form_p = _protected(term_t), _protected(form_t)
        if term_p and term_p != form_p:
            raise ValueError(f'alias "{term}" = "{form}" would change a number, unit or negation; '
                             "an alias may only respell a name")
        if not term_p and any(w in _ALIAS_FORBIDDEN for w in form_w):
            raise ValueError(f'alias "{term}" = "{form}": the spoken form adds a negation; '
                             "an alias may only respell a name")
        if not term_p and len(form_p) == len(form_w):
            raise ValueError(f'alias "{term}" = "{form}": the spoken form is only numbers, units or '
                             "negations; an alias may only respell a name")
        candidates = {form_w}
        if len(form_w) > 1 and all(w.isalpha() for w in form_w):
            candidates.add(("".join(form_w),))   # "goose works" also heard as "gooseworks"
        for cand in candidates:
            if cand == term_w:
                continue
            if cand in rules and rules[cand] != term_w:
                raise ValueError(f'spoken form "{" ".join(cand)}" is confirmed for two different terms')
            rules[cand] = term_w
    return sorted(rules.items(), key=lambda kv: -len(kv[0]))


def _apply_aliases(toks: list[_Tok], rules) -> list[_Tok]:
    if not rules:
        return toks
    texts = [t.text for t in toks]
    out: list[_Tok] = []
    i = 0
    while i < len(toks):
        for form, term in rules:
            if tuple(texts[i:i + len(form)]) == form:
                orig, src = _orig_text(toks[i:i + len(form)]), object()
                out.extend(_Tok(w, orig, src) for w in term)
                i += len(form)
                break
        else:
            out.append(toks[i])
            i += 1
    return out


def canonical_tokens(text: str, aliases=None) -> list[_Tok]:
    """Canonical spoken-form tokens (with their original wording) for `text`."""
    return _apply_aliases(_base_tokens(text), build_aliases(aliases))


def tokenize(text: str, aliases=None) -> list[str]:
    """Canonical spoken-form word tokens. 'human-vetted!' → [human, vetted]; '5mg' → [5, milligrams]."""
    return [t.text for t in canonical_tokens(text, aliases)]


def _fusable(parts: list[str], whole: str) -> bool:
    if all(p.isalpha() for p in parts):
        # Letters spelled one by one ("a g") are NOT a fused word — that needs a confirmed alias.
        # A join may not swallow a negation: "no table" is not "notable" ("no thing" is "nothing").
        return (not all(len(p) == 1 for p in parts)
                and sum(p in _NEGATIONS for p in parts) == (whole in _NEGATIONS))
    if len(parts) == 2 and all(p.isdigit() for p in parts):
        # years and prices read in pairs: "twenty twenty six" = 2026, "two forty-nine" = 249
        return bool(re.fullmatch(r"[1-9]\d?", parts[0]) and re.fullmatch(r"[1-9]\d", parts[1]))
    return False


def _fuse(toks: list[_Tok], other: set[str]) -> list[_Tok]:
    """Join 2-3 consecutive tokens whose exact concatenation is a token on the other side.
    A number written as a word joins by its spelling: "every one" == "everyone"."""
    out: list[_Tok] = []
    i = 0
    while i < len(toks):
        for k in (3, 2):
            if i + k > len(toks):
                continue
            window = toks[i:i + k]
            joined = None
            canon = [t.text for t in window]
            spelled = [t.spelled() or t.text for t in window]
            for parts in (canon, spelled):
                whole = "".join(parts)
                if whole not in other or not _fusable(parts, whole):
                    continue
                # "two forty-nine" == 249, but written digits never join: "2 20-minute" is not 220
                if all(p.isdigit() for p in parts) and not all(t.orig[:1].isalpha() for t in window):
                    continue
                # a number word joins a word only with parts of 2+ letters: "g one" is not "gone"
                if parts is spelled and parts != canon and any(len(p) < 2 for p in parts):
                    continue
                joined = whole
                break
            if joined:
                out.append(_merge(window, joined))
                i += k
                break
        else:
            out.append(toks[i])
            i += 1
    return out


def _brand_positions(s_texts: list[str], brand_seqs: list[tuple[str, ...]]) -> set[int]:
    pos: set[int] = set()
    for seq in brand_seqs:
        L = len(seq)
        for i in range(len(s_texts) - L + 1):
            if tuple(s_texts[i:i + L]) == seq:
                pos.update(range(i, i + L))
        if L == 1 and seq[0].isalpha():
            # brand written split in the script: "Braxley Bands" for --brand-term Braxleybands
            for k in (2, 3):
                for i in range(len(s_texts) - k + 1):
                    if "".join(s_texts[i:i + k]) == seq[0]:
                        pos.update(range(i, i + k))
    return pos


@dataclass
class Issue:
    kind: str                 # substitution | dropped | inserted | silent | no_script | caption_*
    severity: str             # high | medium | low
    script_words: list[str] = field(default_factory=list)   # canonical tokens
    heard_words: list[str] = field(default_factory=list)    # canonical tokens
    note: str = ""
    script_text: str = ""     # original wording in the approved script
    heard_text: str = ""      # original wording in the transcript


@dataclass
class Verdict:
    passed: bool
    ratio: float
    issues: list[Issue] = field(default_factory=list)
    silent: bool = False
    music_present: bool | None = None
    script_tokens: int = 0
    transcript_tokens: int = 0
    brand_terms: list[str] = field(default_factory=list)
    aliases: list[dict] = field(default_factory=list)

    def to_dict(self) -> dict:
        return asdict(self)


_CURRENCY_WORDS = frozenset({"dollars", "euros", "pounds"})   # "$9.99" read "nine ninety-nine"; cents still count


def _classify(tag: str, sw_t: list[_Tok], hw_t: list[_Tok], brand_hit: bool,
              declared: set[str]) -> tuple[str, str, bool]:
    """(severity, note, equivalent) for one differing span of the alignment."""
    sw, hw = [x.text for x in sw_t], [x.text for x in hw_t]
    if sum(w in _NEGATIONS for w in sw) != sum(w in _NEGATIONS for w in hw):
        return "high", "negation changed (not/never/no/without added or lost) — the claim flips", False
    sq = [w for w in sw if _QUANTITY_RE.fullmatch(w)]
    hq = [w for w in hw if _QUANTITY_RE.fullmatch(w)]
    if sq != hq:
        return "high", "number differs from the approved script — a number is never a benign paraphrase", False
    # Units count only right after a quantity. Any unit added, dropped or changed is HIGH,
    # except a dropped/added dollars/euros/pounds alone ("$9.99" read "nine ninety-nine").
    su = [x.text for x in sw_t if x.unit]
    hu = [x.text for x in hw_t if x.unit]
    if su != hu and ((su and hu) or [u for u in su + hu if u not in _CURRENCY_WORDS]):
        return "high", "unit differs from the approved script (added, dropped or changed)", False
    # Backward compatibility with callers that pass --brand-term for the brand AND for each
    # word of its spoken form: a span of ONLY declared, alphabetic brand-term words on BOTH
    # sides that also sound alike (script "ak mee" vs heard "Acme") is the same brand.
    # Different declared names ("Hims" vs "Hers", "Body Pod" vs "Band") still fail.
    if tag == "replace" and declared and all(w in declared and w.isalpha() for w in sw + hw) \
            and _char_sim("".join(sw), "".join(hw)) >= BRAND_SWAP_MIN_CHAR_SIM:
        return "low", "declared brand terms on both sides (spoken form vs brand spelling) — accepted", True
    if brand_hit:
        return "high", ("brand name not heard as approved (mis-voiced or dropped) — re-roll; if the audio is "
                        "right and only the spelling differs, confirm the spoken form and pass it as an alias"), False
    if tag == "replace":
        if len(sw) == 1 and len(hw) == 1:
            a, b = sw[0], hw[0]
            if abs(len(a) - len(b)) <= MISVOICE_MAX_LEN_DELTA and _char_sim(a, b) >= MISVOICE_MIN_CHAR_SIM:
                return "high", (f'audio likely mis-voices "{a}" as "{b}" (re-roll a new seed; if it is a '
                                "brand token, spell it phonetically in the SPOKEN LINE)"), False
        return "medium", "spoken word differs from the approved script", False
    if tag == "delete":
        return "medium", "approved words not heard in the render", False
    # Extra heard words are often benign (filler / whisper tail); low severity.
    return "low", "extra words heard that are not in the script", False


def _term_seqs(terms: list[str], rules) -> list[tuple[str, ...]]:
    seqs = []
    for term in terms:
        seq = tuple(x.text for x in _apply_aliases(_base_tokens(term), rules))
        if seq:
            seqs.append(seq)
            if len(seq) > 1 and all(w.isalpha() for w in seq):
                seqs.append(("".join(seq),))
    return seqs


def review_transcript(script: str, transcript: str, min_ratio: float = DEFAULT_MIN_RATIO,
                      brand_terms: list[str] | None = None, aliases=None) -> Verdict:
    """Pure verdict from approved script vs heard transcript. No I/O.

    brand_terms: brand names. They are NEVER removed from the diff; a brand word not
        heard as approved is a HIGH failure. Fused/split spellings are equal, and a span
        made only of declared brand-term tokens on both sides is accepted.
    aliases: confirmed spoken forms, e.g. {"AG1": "A G one"} or the read_pronunciations
        `pronunciations` list. Raises ValueError on a bad alias (see build_aliases)."""
    rules = build_aliases(aliases)
    pairs = _alias_pairs(aliases)
    s_toks = _apply_aliases(_base_tokens(script), rules)
    t_toks = _apply_aliases(_base_tokens(transcript), rules)
    if any(x.text == "2nd" for x in s_toks):
        # the script writes the ordinal "2nd", so a plain "second" is that ordinal
        s_toks, t_toks = ([_Tok("2nd", x.orig, x.src) if x.text == "second" else x for x in toks]
                          for toks in (s_toks, t_toks))
    s_set, t_set = {t.text for t in s_toks}, {t.text for t in t_toks}
    s_toks, t_toks = _fuse(s_toks, t_set), _fuse(t_toks, s_set)
    s = [t.text for t in s_toks]
    t = [x.text for x in t_toks]

    brand_pos = _brand_positions(s, _term_seqs(list(brand_terms or []) + [a for a, _ in pairs], rules))
    declared = {w for seq in _term_seqs(list(brand_terms or []), rules) for w in seq}

    v = Verdict(passed=False, ratio=0.0, script_tokens=len(s), transcript_tokens=len(t),
                brand_terms=list(brand_terms or []),
                aliases=[{"term": a, "say_as": b} for a, b in pairs])

    if not s:
        # No script to compare against — cannot gate on drift, treat as advisory pass.
        v.passed = True
        v.ratio = 1.0
        v.issues.append(Issue("no_script", "low", note="no approved script supplied; drift check skipped"))
        return v

    matcher = SequenceMatcher(None, s, t, autojunk=False)
    matched = 2 * sum(b.size for b in matcher.get_matching_blocks())

    kinds = {"replace": "substitution", "delete": "dropped", "insert": "inserted"}
    for tag, i1, i2, j1, j2 in matcher.get_opcodes():
        if tag == "equal":
            continue
        brand_hit = bool(brand_pos.intersection(range(i1, i2)))
        severity, note, equivalent = _classify(tag, s_toks[i1:i2], t_toks[j1:j2], brand_hit, declared)
        if equivalent:
            matched += (i2 - i1) + (j2 - j1)
        v.issues.append(Issue(kinds[tag], severity, s[i1:i2], t[j1:j2], note,
                              script_text=_orig_text(s_toks[i1:i2]),
                              heard_text=_orig_text(t_toks[j1:j2])))

    v.ratio = matched / (len(s) + len(t))
    has_high = any(i.severity == "high" for i in v.issues)
    v.passed = (v.ratio >= min_ratio) and not has_high
    return v


# ── Confirmed pronunciations ────────────────────────────────────────────────
def parse_alias_arg(arg: str) -> tuple[str, str]:
    """'AG1=A G one' → ('AG1', 'A G one')."""
    term, sep, form = (arg or "").partition("=")
    if not sep or not term.strip() or not form.strip():
        raise ValueError(f'--alias must look like "TERM=SPOKEN FORM", got: {arg!r}')
    return term.strip(), form.strip()


def load_pronunciations(path: str) -> list[tuple[str, str]]:
    """Read create-vo-elevenlabs' read_pronunciations.py output:
    {"brand_id", "basis", "pronunciations": [{"term", "say_as", "fact_id"}]} (a bare list also works)."""
    with open(path, encoding="utf-8") as fh:
        data = json.load(fh)
    rows = data.get("pronunciations") if isinstance(data, dict) else data
    if not isinstance(rows, list):
        raise ValueError(f"{path}: expected a JSON object with a 'pronunciations' list")
    pairs = []
    for row in rows:
        if not isinstance(row, dict) or not isinstance(row.get("term"), str) or not isinstance(row.get("say_as"), str):
            raise ValueError(f"{path}: every pronunciation needs a 'term' and a 'say_as'")
        pairs.append((row["term"], row["say_as"]))
    return pairs


# ── Audio / transcription I/O ───────────────────────────────────────────────
def _run(cmd: list[str], **kw) -> subprocess.CompletedProcess:
    return subprocess.run(cmd, capture_output=True, text=True, **kw)


def extract_audio(video: str, out_mp3: str) -> None:
    cp = _run(["ffmpeg", "-y", "-i", video, "-vn", "-ac", "1", "-ar", "16000",
               "-acodec", "libmp3lame", out_mp3])
    if cp.returncode != 0 or not os.path.exists(out_mp3):
        raise RuntimeError(f"ffmpeg audio extract failed: {cp.stderr[-500:]}")


def mean_volume_db(audio: str) -> float:
    cp = _run(["ffmpeg", "-hide_banner", "-i", audio, "-af", "volumedetect", "-f", "null", "-"])
    m = re.search(r"mean_volume:\s*(-?\d+(?:\.\d+)?)\s*dB", cp.stderr)
    return float(m.group(1)) if m else 0.0


def _gw_creds():
    """(api_base, token, agent_id) or None. Cloud sandbox: the per-session
    GW_MEDIA_PROXY_TOKEN (already binds the billing agent → agent_id None) +
    GW_API_BASE (or derived from GW_FAL_PROXY_URL). Else the CLI credentials."""
    env_tok = os.environ.get("GW_MEDIA_PROXY_TOKEN")
    if env_tok:
        base = os.environ.get("GW_API_BASE")
        if not base:
            fal = (os.environ.get("GW_FAL_PROXY_URL") or "").rstrip("/")
            i = fal.find("/api/internal/")
            base = fal[:i] if i > 0 else None
        if base:
            return base.rstrip("/"), env_tok, None
    p = os.path.expanduser("~/.gooseworks/credentials.json")
    if not os.path.exists(p):
        return None
    try:
        c = json.load(open(p))
        return c["api_base"].rstrip("/"), c["api_key"], c.get("agent_id")
    except (json.JSONDecodeError, KeyError, OSError):
        return None


def _transcribe_gw_whisper_proxy(audio: str) -> str | None:
    """GooseWorks whisper-proxy (bills the Ads agent). The proxy authenticates the
    session token via `?token=` OR Bearer, but a USER-scoped `cal_` token has no
    pinned agent, so `?agent_id=` is REQUIRED or the billable call 403s — this is
    exactly why plain `Authorization: Bearer` alone returned 403 before."""
    creds = _gw_creds()
    if not creds:
        return None
    api_base, token, agent = creds
    url = f"{api_base}/api/internal/whisper-proxy/v1/audio/transcriptions"
    query = f"token={token}"
    if agent:
        query += f"&agent_id={agent}"
    pid = os.environ.get("GW_PROJECT_ID")
    if pid:
        query += f"&project_id={pid}"
    cp = _run([
        "curl", "-sS", "--fail-with-body", f"{url}?{query}",
        "-F", f"file=@{audio}", "-F", "model=whisper-1", "-F", "response_format=json",
    ])
    if cp.returncode == 0:
        try:
            return json.loads(cp.stdout)["text"].strip()
        except (json.JSONDecodeError, KeyError):
            return None
    return None


def transcribe(audio: str) -> str:
    """Whisper transcript. GooseWorks whisper-proxy (native, no OpenAI key needed) →
    direct OpenAI (OPENAI_API_KEY, honoring OPENAI_BASE_URL + OPENAI_PROXY_QUERY) →
    local `whisper` CLI."""
    heard = _transcribe_gw_whisper_proxy(audio)
    if heard is not None:
        return heard
    api_key = os.environ.get("OPENAI_API_KEY")
    if api_key:
        base = os.environ.get("OPENAI_BASE_URL", "https://api.openai.com/v1").rstrip("/")
        # A proxy that authenticates by query string (token/agent_id) can be reached by
        # setting OPENAI_PROXY_QUERY="token=…&agent_id=…"; harmless against real OpenAI.
        q = os.environ.get("OPENAI_PROXY_QUERY", "").lstrip("?")
        endpoint = f"{base}/audio/transcriptions" + (f"?{q}" if q else "")
        cp = _run([
            "curl", "-sS", "--fail-with-body", endpoint,
            "-H", f"Authorization: Bearer {api_key}",
            "-F", f"file=@{audio}",
            "-F", "model=whisper-1",
            "-F", "response_format=json",
        ])
        if cp.returncode == 0:
            try:
                return json.loads(cp.stdout)["text"].strip()
            except (json.JSONDecodeError, KeyError):
                pass  # fall through to local
    if shutil.which("whisper"):
        with tempfile.TemporaryDirectory() as td:
            cp = _run(["whisper", audio, "--model", "base", "--output_format", "txt",
                       "--output_dir", td, "--fp16", "False"])
            if cp.returncode == 0:
                stem = os.path.splitext(os.path.basename(audio))[0]
                txt = os.path.join(td, f"{stem}.txt")
                if os.path.exists(txt):
                    with open(txt) as fh:
                        return fh.read().strip()
    raise RuntimeError(
        "no transcription backend available: sign in with the gooseworks CLI (writes "
        "~/.gooseworks/credentials.json → whisper-proxy is used automatically), or set "
        "OPENAI_API_KEY (optionally OPENAI_BASE_URL + OPENAI_PROXY_QUERY), or install the "
        "`whisper` CLI"
    )


# ── Caption-file checks (deterministic) ─────────────────────────────────────
_SRT_CUE_RE = re.compile(r"^\s*\d+\s*$")
# A cue text should start with a letter, digit, quote, or opening bracket — never a
# comma/period/semicolon/colon. A leading ",text" is the classic caption-split defect.
_STRAY_LEADING_RE = re.compile(r'^\s*[,.;:!?)\]}]')


def parse_srt_cues(srt_path: str) -> list[str]:
    """Return the text of each SRT cue (blank-line-separated blocks; drop index +
    timestamp lines). Tolerant of CRLF and missing trailing newline."""
    blocks = re.split(r"\n\s*\n", open(srt_path, encoding="utf-8-sig").read().replace("\r\n", "\n"))
    cues = []
    for b in blocks:
        lines = [ln for ln in b.split("\n") if ln.strip()]
        text = [ln for ln in lines if not _SRT_CUE_RE.match(ln) and "-->" not in ln]
        if text:
            cues.append(" ".join(text).strip())
    return cues


def check_caption_srt(srt_path: str) -> list[Issue]:
    """Deterministic caption-text defects (the transcript diff can't see these):
    stray leading punctuation (the ",word" split defect) and empty cues. NOTE:
    on-screen caption POSITION (bottom vs centered) is baked into pixels by VEED and
    is NOT checkable from the SRT — that stays a visual `/watch` gate item."""
    issues: list[Issue] = []
    cues = parse_srt_cues(srt_path)
    for cue in cues:
        if _STRAY_LEADING_RE.match(cue):
            issues.append(Issue("caption_punct", "high", heard_words=[cue[:40]],
                                note=f'caption cue starts with stray punctuation: "{cue[:40]}" '
                                     "(a leading comma/period is a caption-split defect — fix the SRT)"))
    if not cues:
        issues.append(Issue("caption_empty", "medium", note=f"no caption cues parsed from {srt_path}"))
    return issues


# ── Reporting ───────────────────────────────────────────────────────────────
def _quote(text: str, words: list[str]) -> str:
    return '"' + (text or " ".join(words)) + '"'


def render_report(v: Verdict) -> str:
    lines = []
    status = "PASS ✅" if v.passed else "FAIL ❌"
    lines.append(f"Pre-publish review: {status}  (transcript↔script similarity {v.ratio:.2f})")
    lines.append(f"  script tokens={v.script_tokens}  heard tokens={v.transcript_tokens}")
    if v.brand_terms:
        lines.append("  brand terms (a mismatch is HIGH): " + ", ".join(v.brand_terms))
    if v.aliases:
        lines.append("  confirmed spoken forms: " + "; ".join(f'{a["term"]} = {a["say_as"]}' for a in v.aliases))
    if v.silent:
        lines.append("  ⚠ audio is effectively silent")
    if v.music_present is False:
        lines.append("  ⚠ expected a music bed but none detected")
    if not v.issues:
        lines.append("  no transcript drift.")
    for i in v.issues:
        if i.kind == "substitution":
            lines.append(f"  [{i.severity}] said {_quote(i.heard_text, i.heard_words)} where script has "
                         f"{_quote(i.script_text, i.script_words)} — {i.note}")
        elif i.kind == "dropped":
            lines.append(f"  [{i.severity}] dropped {_quote(i.script_text, i.script_words)} — {i.note}")
        elif i.kind == "inserted":
            lines.append(f"  [{i.severity}] extra {_quote(i.heard_text, i.heard_words)} — {i.note}")
        else:
            lines.append(f"  [{i.severity}] {i.note}")
    if not v.passed:
        lines.append("  → Do NOT pin this render as final (video_project_upsert patch.final_render_id). "
                     "Fix (usually re-roll a new seed for an audio defect), then re-run this gate.")
    return "\n".join(lines)


def ffmpeg_available() -> bool:
    return bool(shutil.which("ffmpeg"))


def main(argv: list[str] | None = None) -> int:
    ap = argparse.ArgumentParser(description="Pre-publish review gate for a UGC video render.")
    ap.add_argument("--video", required=True, help="path to the rendered master mp4")
    g = ap.add_mutually_exclusive_group()
    g.add_argument("--script", help="approved spoken script text")
    g.add_argument("--script-file", help="path to a file with the approved spoken script")
    ap.add_argument("--min-ratio", type=float, default=DEFAULT_MIN_RATIO)
    ap.add_argument("--brand-term", action="append", default=[], dest="brand_terms",
                    help="brand name (repeatable). Brand words are NEVER removed from the diff: a brand "
                         "word not heard as approved is a HIGH failure; fused/split spellings "
                         "(braxleybands = braxley bands) count as equal.")
    ap.add_argument("--alias", action="append", default=[], dest="aliases",
                    help='confirmed spoken form, "TERM=SPOKEN" (repeatable), e.g. --alias "AG1=A G one". '
                         "Only pass forms the user confirmed; never infer one from the transcript.")
    ap.add_argument("--pronunciations",
                    help="confirmed pronunciations the voice-over used: read_pronunciations.py output or "
                         "brand-rules.json (create-vo-elevenlabs). Each {term, say_as} becomes an alias and "
                         "its term a brand term; an entry that cannot be used is skipped with a warning.")
    ap.add_argument("--captions-srt",
                    help="optional SRT to check for caption-text defects (stray leading punctuation, "
                         "empty cues). Caption POSITION stays a visual /watch item.")
    ap.add_argument("--expect-music", action="store_true",
                    help="advisory: warn if the render appears to have no music bed")
    ap.add_argument("--json", dest="json_out", help="write the machine verdict here")
    args = ap.parse_args(argv)

    if not os.path.exists(args.video):
        print(f"ERROR: video not found: {args.video}", file=sys.stderr)
        return 3
    if not ffmpeg_available():
        print("ERROR: ffmpeg not on PATH", file=sys.stderr)
        return 3

    script = ""
    if args.script:
        script = args.script
    elif args.script_file:
        if not os.path.exists(args.script_file):
            print(f"ERROR: script file not found: {args.script_file}", file=sys.stderr)
            return 3
        with open(args.script_file) as fh:
            script = fh.read()

    # Validate confirmed aliases BEFORE any (paid) transcription call. --alias is strict
    # (exit 3); a saved pronunciation that cannot be used is skipped with a warning.
    try:
        aliases = [parse_alias_arg(a) for a in args.aliases]
        build_aliases(aliases)
        if args.pronunciations:
            if not os.path.isfile(args.pronunciations):
                raise ValueError(f"pronunciations file not found or not a file: {args.pronunciations}")
            for term, say_as in load_pronunciations(args.pronunciations):
                try:
                    build_aliases(aliases + [(term, say_as)])
                except ValueError as e:
                    print(f"WARNING: skipping pronunciation {term!r} = {say_as!r}: {e}", file=sys.stderr)
                    continue
                aliases.append((term, say_as))
    except (ValueError, OSError) as e:   # JSONDecodeError and UnicodeDecodeError are ValueErrors
        print(f"ERROR: {e}", file=sys.stderr)
        return 3

    try:
        with tempfile.TemporaryDirectory() as td:
            audio = os.path.join(td, "audio.mp3")
            extract_audio(args.video, audio)
            silent = mean_volume_db(audio) <= SILENCE_MEAN_DB
            transcript = "" if silent else transcribe(audio)
            v = review_transcript(script, transcript, args.min_ratio,
                                  brand_terms=args.brand_terms, aliases=aliases)
            v.silent = silent
            if silent:
                v.passed = False
                v.issues.insert(0, Issue("silent", "high", note="render audio is effectively silent"))
            if args.captions_srt:
                if not os.path.exists(args.captions_srt):
                    print(f"ERROR: captions SRT not found: {args.captions_srt}", file=sys.stderr)
                    return 3
                cap_issues = check_caption_srt(args.captions_srt)
                v.issues.extend(cap_issues)
                if any(i.severity == "high" for i in cap_issues):
                    v.passed = False
    except RuntimeError as e:
        print(f"ERROR: {e}", file=sys.stderr)
        return 3

    print(render_report(v))
    if args.json_out:
        with open(args.json_out, "w") as fh:
            json.dump(v.to_dict(), fh, indent=2)
    return 0 if v.passed else 2


if __name__ == "__main__":
    raise SystemExit(main())

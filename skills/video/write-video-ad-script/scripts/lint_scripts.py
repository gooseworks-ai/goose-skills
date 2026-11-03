#!/usr/bin/env python3
"""Rule check for video ad script candidates, run before anyone reads them.

Catches what a machine can decide, so the human and the critic model spend their
attention on taste:

  errors (exit 2)  a line over the format's word budget, a missing beat, beats out of
                   the format's order, something spoken after the CTA, a dead opener
                   ("Introducing…", "Have you ever…"), a phrase the brand quoted as
                   banned, no customer quote behind a concept, a quote id that is not
                   in the bank, a set where some concepts share an angle type and
                   others do not (E_SAME_ANGLE, a set error)
  warnings         a line that looks like a banned brand claim (a human decides), AI
                   tells ("it's not X, it's Y", dash habits), ad-speak ("game-changer",
                   "look at that", W_AD_SPEAK), clipped fragments or steps read aloud
                   across scenes (W_FRAGMENT_CHAIN, W_STEPS_ALOUD), a mood opener
                   ("Tonight, I want…", W_MOOD_OPENER), stiff
                   spoken lines, long sentences, numbers no fact or quote backs, the
                   brand name in the first line, a concept that never uses its buyers'
                   words, softer openers, duplicate hooks / families, two concepts that
                   open with the same three words (W_SIMILAR_OPENING), a "Tired of A, B
                   and C" opener, a body that stacks features, a spoken opening with no
                   on-screen words, an opening picture that shares nothing with its hook,
                   on-screen words too long to read, an angle type not on the list

No network, no keys, standard library only. Run it from the folder that holds working/.

  lint_scripts.py --candidates working/script/candidates.json \
      [--shape working/script/shape.json] [--rules working/brand-rules.json] \
      [--customer-words working/script/customer-words.json] \
      [--out working/script/lint.json] [--report-only]

--report-only: the lines are the user's own words. Report, never fail (exit 0), and skip
the customer-quote checks (their lines don't cite quotes).
Exit 0 = no errors, 2 = errors to fix, 1 = unreadable input.
"""
import argparse
import json
import math
import pathlib
import re
import sys

from prepare_angle_context import validate_bank

DEFAULT_WPS = 3.0          # spoken words per second when the shape gives none
ON_SCREEN_MAX_WORDS = 8    # a text card the viewer must read at a glance
OVER_BUDGET = 1.15         # tolerance before a line is "too long to say in time"
UNDER_BUDGET = 0.5         # below this a spoken beat drags
LONG_SENTENCE = 20         # spoken words in one sentence
SPOKEN_KINDS = {"spoken", "bubble", "lyric"}  # said, typed or sung: read as speech
OPENER_KINDS = {"spoken", "on_screen"}        # where an ad-style opener reads as an ad

ON_SCREEN_LINE_MAX = 13    # on-screen words a viewer reads in one beat
ON_SCREEN_HOOK_MAX = 8     # on-screen words in the opening beat
FEATURE_STACK_MIN = 3      # distinct features in the body that make it a spec sheet
# The same list the app uses for script candidates; each concept takes a different one.
ANGLE_TYPES = ("story", "curiosity", "identity", "desire", "problem_fix", "demo", "how_it_works",
               "old_vs_new", "proof", "offer", "objection", "news")

WORD_RE = re.compile(r"[A-Za-z0-9][A-Za-z0-9'’]*")
CUE_RE = re.compile(r"\[[^\]]*\]|\([^)]*\)")  # [pause] / (laughs): delivery cues, not words

STOPWORDS = set("""
a an the and or but so if then of to in on at for from by with as is are was were be been being
i me my we our you your he she it its they them their this that these those there here do does did
not no just really very can could will would should have has had am im i'm it's its that's what
who how why when where which all any some more most much many one ones up out about into over
than too also only even get got go going like
""".split())

# Openers that read as an ad in the first second: an error on a spoken or on-screen hook.
HARD_OPENERS = [
    r"in a world", r"introducing\b", r"say goodbye to", r"picture this", r"are you tired of",
    r"tired of[^.!]*\?", r"have you ever", r"what if i told you", r"ladies and gentlemen",
    r"calling all", r"hey guys", r"hi guys", r"hey everyone", r"welcome back", r"stop scrolling",
    r"are you (still )?struggling", r"do you (ever )?struggle",
    r"imagine (a world|if|never|having|waking|a life)", r"meet (the|our) ",
]
# Openers that are usually an ad but can be a real line ("Looking for my glasses at 3am"):
# a warning, the agent judges.
SOFT_OPENERS = [r"did you know", r"looking for (a|an|the) ", r"struggling with", r"attention\s*[:!,.]",
                r"meet\b", r"imagine\b"]
HARD_OPENER_RE = re.compile(r"^\W*(%s)" % "|".join(HARD_OPENERS), re.I)
SOFT_OPENER_RE = re.compile(r"^\W*(%s)" % "|".join(SOFT_OPENERS), re.I)
# "Tired of A, B and C": a list of pains instead of one moment.
TIRED_OF_LIST_RE = re.compile(r"^\W*tired of [^,]+, [^,]+,? and ", re.I)
QUESTION_OPENER_RE = re.compile(r"^\W*(do|does|are|is|have|has|ever|can|what|why|how|who|want)\b", re.I)

AI_TELLS = [
    (r"\b(it's|this is|that's|this isn't|it isn't)\s+not\s+(just\s+)?(about\s+)?[^.?!]{1,50}?[,;—–-]+\s*(it's|this is|that's)\b",
     "\"it's not X, it's Y\": just say Y"),
    (r"\bnot just\b[^.?!]{1,50}\bbut\b", "\"not just X but Y\": just say the thing"),
    (r"\bhere's the (thing|kicker|truth|secret|deal|catch)\b", "drumroll before the point: cut it"),
]
AI_TELL_RES = [(re.compile(p, re.I), why) for p, why in AI_TELLS]

# Sound like a person (references/voice.md). Ad-speak in any spoken, hook or on-screen text:
# the voice rules' list, then the older AI-vocabulary list, so one code covers both.
AD_SPEAK_RE = re.compile(
    r"\b(game[- ]?changer|elevate[sd]?|say goodbye to|meet your new|it's not just|isn't just|"
    r"that's the (evening|night|morning|day) i wanted|look at (that|those)|this is what i'm craving|"
    r"indulgent|mouthwatering|irresistible|effortless(ly)?|level up|transform your|"
    r"revolutionary|next[- ]level|unlock(s|ed)?|seamless(ly)?|transformative|"
    r"supercharge[sd]?|empower(s|ed|ing)?|must[- ]have|look no further|in today's|whether you're|"
    r"designed to|crafted|curated|boost your|to the next level|it's that simple|you deserve|"
    r"holistic|cutting[- ]edge|one[- ]stop|all[- ]in[- ]one solution|take control of)\b", re.I)
# Narrating the picture: a spoken sentence that starts by pointing at the screen.
NARRATE_RE = re.compile(r"^\W*(look at|check out|here's the|see that|see how)\b", re.I)
# A mood or craving instead of a hook (scene 1, or a hook alternative).
MOOD_OPENER_RES = [re.compile(p, re.I) for p in (
    r"^(tonight|today|this (morning|evening|week))?,? ?i(?: (?:want|need|crave|am craving)|'m craving)\b",
    r"^craving\b", r"^(in the mood for|need something)\b", r"^(want|need) .*\?$",
    # A status update ("It's a work night and I'm…", "Home late and…") is a mood too.
    r"^(it'?s|it is) (a |another )?[\w-]+ (night|morning|evening|day|afternoon)\b",
    r"^(home late|just got home|got home|back home)\b", r"^(so )?(here i am|me,? )")]
# Formats that cannot put words over beat 1: none at all, or text only on the end card.
NO_BEAT1_TEXT = ("none", "end_card")
FRAGMENT_MAX_WORDS = 5     # a spoken sentence this short is a fragment
CHAIN_MIN = 3              # this many fragments (or read-aloud steps) in a row
STEP_VERBS = {"boil", "cook", "add", "stir", "heat", "pour", "mix", "remove", "turn", "open", "serve",
              "put", "place", "fold", "spread", "shake", "blend", "chop", "cut", "microwave", "bake"}
GENERIC_WORDS = {"really", "very", "amazing", "incredible", "literally", "simply", "actually",
                 "basically", "best-in-class", "world-class", "awesome", "perfect"}
STIFF_RE = re.compile(
    r"\b(do not|does not|did not|cannot|can not|will not|would not|should not|is not|are not|"
    r"was not|it is|i am|you are|we are|they are|that is|i will|you will|let us)\b", re.I)
# A list of three or more short phrases ending in "and": "the cap, the strap and the lid".
PHRASE = r"[A-Za-z0-9'-]+(?: [A-Za-z0-9'-]+){0,2}"
FEATURE_LIST_RE = re.compile(r"\b(?:%s, )+%s,? (?:and|&) [A-Za-z0-9'-]+" % (PHRASE, PHRASE), re.I)
TRICOLON_RE = re.compile(r"\b([A-Za-z'-]+), ([A-Za-z'-]+),? and ([A-Za-z'-]+)\b")
NUMBER_RE = re.compile(r"[$£€]?\d[\d,.]*\s?(%|x\b|k\b|m\b)?", re.I)
NEVER_LEAD_RE = re.compile(
    r"^\W*(never|don't|do not|avoid|no)\s+(say(ing)?|claim(ing)?|imply(ing)?|mention(ing)?|use|using|"
    r"call(ing)? it|promise|suggest(ing)?|state)?\s*(or\s+imply\s*)?(the word\s+)?(that\s+)?", re.I)
# A quoted phrase in a rule. A straight or curly single quote only counts when no letter
# touches its outer side, so the apostrophes in "don't" and "it's" are never quote marks.
QUOTED_RE = re.compile(
    r"[\"“”]([^\"“”]{1,80})[\"“”]|(?<![A-Za-z])['‘]([^'‘’\"]{1,80}?)['’](?![A-Za-z])")
VISUAL_RULE_RE = re.compile(
    r"\b(colou?rs?|logo|font|background|image|photo|picture|visual|frame|camera|shot|red|blue|green|"
    r"black|white|pink|yellow|purple|orange|top-left|top-right|layout)\b", re.I)
SPEECH_RULE_RE = re.compile(r"\b(say|claim|mention|imply|promise|call|word|words|state|suggest)\b", re.I)


def plain(text):
    """Curly apostrophes to straight ones, so every rule sees one spelling."""
    return (text or "").replace("’", "'").replace("‘", "'")


def words(text):
    return WORD_RE.findall(CUE_RE.sub(" ", plain(text)))


def norm_words(text):
    return [w.lower() for w in words(text)]


def stem(w):
    w = w.lower()
    for suf in ("ing", "es", "ed", "s"):
        if len(w) > len(suf) + 2 and w.endswith(suf):
            w = w[: -len(suf)]
            break
    if len(w) > 3 and w.endswith("e"):
        w = w[:-1]
    return w


def content_words(text):
    return [w for w in norm_words(text) if w not in STOPWORDS]


def sentences(text):
    parts = re.split(r"(?<=[.!?])\s+|\n+", CUE_RE.sub(" ", plain(text)).strip())
    return [p for p in parts if p.strip()]


def first_sentence(text):
    s = sentences(text)
    return s[0] if s else ""


def ngrams(ws, n=3):
    return {tuple(ws[i:i + n]) for i in range(len(ws) - n + 1)}


def text_of(x):
    return (x or {}).get("text") or "" if isinstance(x, dict) else ""


def on_screen_of(beat):
    value = (beat or {}).get("on_screen") if isinstance(beat, dict) else None
    return value if isinstance(value, str) else ""


def stems(text):
    return {stem(w) for w in content_words(text)}


def list_items(text):
    """The most items in one "A, B and C" list in this text (0 when there is none)."""
    best = 0
    for m in FEATURE_LIST_RE.finditer(plain(text)):
        flat = re.sub(r",\s*(?:and|&)\s", " and ", m.group(0), flags=re.I)
        best = max(best, flat.count(",") + 2)
    return best


def features_named(text, fact_texts, names=()):
    """Distinct product facts the text names: two of a fact's content words (or its only one).
    Brand and product names are not features: a fact matched only by them does not count."""
    drop = set().union(*(stems(n) for n in names)) if names else set()
    have = stems(text) - drop
    count = 0
    for fact in fact_texts:
        want = stems(fact) - drop
        if want and len(want & have) >= min(2, len(want)):
            count += 1
    return count


TOKEN_RE = re.compile(r"[A-Za-z0-9][A-Za-z0-9'-]*")  # "wake-ups" stays one token


def tokens(text):
    return [t.strip("-") for t in TOKEN_RE.findall(CUE_RE.sub(" ", plain(text)).lower())]


def opening_tokens(concept, ignore):
    """The opening beat's content words in order: its line (or its on-screen words when it
    has no line), without stopwords and without the ignored brand, product and angle words."""
    beats = [b for b in concept.get("beats") or [] if isinstance(b, dict)]
    if not beats:
        return []
    line = text_of(beats[0]) or on_screen_of(beats[0])
    return [t for t in tokens(line) if t and t not in STOPWORDS and t not in ignore]


def spoken_sentences(beats, kinds):
    """[(first scene, last scene, sentence)] over the spoken beats, in order. A beat that
    does not end on . ! ? or … carries its sentence into the next spoken beat."""
    out, carry, start = [], "", None
    for i, b in enumerate(beats):
        text = CUE_RE.sub(" ", plain(text_of(b))).strip()
        if kinds[i] != "spoken" or not text:
            continue
        parts = [p.strip() for p in re.split(r"(?<=[.!?…])\s+|\n+", text) if p.strip()]
        for k, part in enumerate(parts):
            if carry:
                part, first = carry + " " + part, start
                carry = ""
            else:
                first = i
            if k == len(parts) - 1 and not re.search(r"[.!?…][\"'”)\]]*$", part):
                carry, start = part, first
            else:
                out.append((first, i, part))
    if carry:
        out.append((start, len(beats) - 1, carry))
    return out


def runs(items, test):
    """Maximal runs of CHAIN_MIN or more consecutive items that pass the test."""
    found, cur = [], []
    for item in items + [None]:
        if item is not None and test(item):
            cur.append(item)
            continue
        if len(cur) >= CHAIN_MIN:
            found.append(cur)
        cur = []
    return found


def scenes(a, b):
    return (f"Scenes {a + 1}-{b + 1} read" if a != b else f"Scene {a + 1} reads")


def is_mood(text):
    first = re.sub(r"^\W+", "", first_sentence(text)).strip()
    return any(r.search(first) for r in MOOD_OPENER_RES)


def quoted(found):
    """Each phrase once, as first written: 'look at those', 'irresistible'."""
    first = {}
    for h in found:
        first.setdefault(h.lower(), h)
    return "', '".join(first.values())


def voice_checks(beats, kinds, hooks, silent):
    """The sound-human checks (references/voice.md) as [(code, msg, beat id)]."""
    out = []
    ids = [b.get("id") or f"beat {i + 1}" for i, b in enumerate(beats)]
    said = [] if silent else spoken_sentences(beats, kinds)
    for run in runs(said, lambda s: 0 < len(words(s[2])) <= FRAGMENT_MAX_WORDS):
        out.append(("W_FRAGMENT_CHAIN", f"{scenes(run[0][0], run[-1][1])} as clipped fragments; "
                    "join them into sentences a person would say.", ids[run[0][0]]))
    for run in runs(said, lambda s: (norm_words(s[2]) or [""])[0] in STEP_VERBS):
        out.append(("W_STEPS_ALOUD", f"{scenes(run[0][0], run[-1][1])} steps aloud; show them on screen "
                    "and say what they mean for the viewer.", ids[run[0][0]]))
    if beats:
        opening = (text_of(beats[0]) if not silent and kinds[0] == "spoken"
                   else on_screen_of(beats[0]) or (text_of(beats[0]) if kinds[0] == "on_screen" else ""))
        labels = [(opening, ids[0])] + [(text_of(h), "hook " + str(h.get("id", "?"))) for h in hooks]
        for text, label in labels:
            if text and is_mood(text):
                out.append(("W_MOOD_OPENER", "Scene 1 states a mood; open on a confession, a surprise, "
                            "a specific moment or an opinion instead.", label))
    hits = {}
    for i, b in enumerate(beats):
        for text in (text_of(b), on_screen_of(b)):
            hits.setdefault(i, []).extend(m.group(0) for m in AD_SPEAK_RE.finditer(plain(text)))
    for first, _, sentence in said:
        m = NARRATE_RE.search(sentence)
        if m and not any(h.lower().startswith(m.group(1).lower()) for h in hits.get(first, [])):
            hits.setdefault(first, []).append(m.group(1))
    for i, found in sorted(hits.items()):
        if found:
            out.append(("W_AD_SPEAK", f"Scene {i + 1} uses ad-speak ('{quoted(found)}'); say it the way a customer would.", ids[i]))
    for h in hooks:
        found = [m.group(0) for m in AD_SPEAK_RE.finditer(plain(text_of(h)))]
        m = None if silent else NARRATE_RE.search(first_sentence(text_of(h)))
        if m and not any(f.lower().startswith(m.group(1).lower()) for f in found):
            found.append(m.group(1))
        if found:
            out.append(("W_AD_SPEAK", f"Hook {h.get('id', '?')} uses ad-speak ('{quoted(found)}'); say it the way a customer would.",
                        "hook " + str(h.get("id", "?"))))
    return out


def shared_run(a, b, n=3):
    """True when two word lists share a run of n words in the same order."""
    return bool(ngrams(a, n) & ngrams(b, n))


def load_json(path, required=False):
    if not path:
        return None
    p = pathlib.Path(path)
    if not p.exists():
        if required:
            raise SystemExit(f"not found: {path}")
        return None
    try:
        return json.loads(p.read_text())
    except json.JSONDecodeError as e:
        print(f"{path} is not valid JSON: {e}", file=sys.stderr)
        sys.exit(1)


def never_say_checks(rules):
    """[(kind, needle, label)] from brand-rules never_say.
    'phrase' (a term the rule quotes): the phrase, in any word form, is an error.
    'claim' (the rule's wording): when every content word lands in one sentence (short
    rules) or 75%+ of them do (long rules) it is a WARNING, because "Never claim it works
    overnight" must not block "I work overnights in the ER". A paraphrase of a banned
    claim is still banned, so the agent reads every one of these warnings.
    Visual rules ("never use red", "logo top-left") are skipped: they are not about words."""
    out = []
    for item in (rules or {}).get("never_say", []) or []:
        text = plain(item.get("text") if isinstance(item, dict) else str(item or ""))
        if not text.strip():
            continue
        if VISUAL_RULE_RE.search(text) and not SPEECH_RULE_RE.search(text):
            continue
        for a, b in QUOTED_RE.findall(text):
            ph = norm_words(a or b)
            if ph:
                out.append(("phrase", ph, text))
        claim = text.split(":", 1)[1] if ":" in text else text
        claim = NEVER_LEAD_RE.sub("", claim.strip())
        cw = sorted({stem(w) for w in norm_words(claim) if w not in STOPWORDS})
        if cw:
            out.append(("claim", cw, text))
    return out


def forms(w):
    """The word and its regular inflections. Quoted banned phrases match on these, never
    on stems: a stem collides ("fat" vs "fate", "cut" vs "cute") and these are errors."""
    out = {w, w + "s", w + "es", w + "ed", w + "d", w + "ing", w + "ly", w + "er", w + "est"}
    if w.endswith("e"):
        out |= {w[:-1] + "ing", w[:-1] + "y"}
    if w.endswith("y") and len(w) > 2:
        out |= {w[:-1] + "ies", w[:-1] + "ied", w[:-1] + "ily"}
    if len(w) >= 3 and w[-1] not in "aeiouwxy" and w[-2] in "aeiou" and w[-3] not in "aeiou":
        out |= {w + w[-1] + "ing", w + w[-1] + "ed", w + w[-1] + "er", w + w[-1] + "y"}
    return out


def has_phrase(text_words, phrase):
    """True when the quoted phrase appears, each word in any regular form."""
    wanted = [forms(p) for p in phrase]
    n = len(wanted)
    return any(all(text_words[i + k] in wanted[k] for k in range(n))
               for i in range(len(text_words) - n + 1))


def allowed_numbers(rules, quotes_text):
    blob = " ".join(quotes_text)
    for p in (rules or {}).get("products", []) or []:
        blob += " " + " ".join(str(f) for f in p.get("facts", []) or [])
        blob += " " + str(p.get("name", ""))
    for m in (rules or {}).get("must_say", []) or []:
        blob += " " + (m.get("text", "") if isinstance(m, dict) else str(m))
    return {re.sub(r"[^\d.]", "", n.group(0)).rstrip(".") for n in NUMBER_RE.finditer(blob)}


def beat_budget(shape_beat, wps):
    kind = shape_beat.get("kind", "spoken")
    if kind == "visual":
        return None, kind
    if shape_beat.get("max_words") is not None:
        return int(shape_beat["max_words"]), kind
    if kind == "on_screen":
        return ON_SCREEN_MAX_WORDS, kind
    if shape_beat.get("seconds"):
        return max(1, round(float(shape_beat["seconds"]) * wps)), kind
    return None, kind


def dialogue_mode(shape):
    """Recognize conversation formats, not chat bubbles or single-host ad reads."""
    shape = shape or {}
    explicit = shape.get("dialogue_mode")
    if explicit in ("podcast", "street-interview"):
        return explicit
    name = re.sub(r"[^a-z0-9]+", " ", str(shape.get("format", "")).lower())
    if "podcast" in name:
        speakers = {b.get("speaker") for b in shape.get("beats") or []
                    if isinstance(b, dict) and b.get("kind", "spoken") == "spoken" and b.get("speaker")}
        if len(speakers) == 1:
            return None
        return "podcast"
    if re.search(r"street.*interview|man on the street|vox pop", name):
        return "street-interview"
    return None


def complete_street_reference(ref):
    """Coverage/provenance gate only; recorded observations still need human review."""
    inspection, situation = ref.get("inspection"), ref.get("ad_interaction")
    if (ref.get("commercial") is not True or not ref.get("commercial_evidence")
            or ref.get("use_status") in ("excluded", "rejected")
            or not isinstance(inspection, dict) or not isinstance(situation, dict)):
        return False
    duration = inspection.get("duration_s")
    fields = ("edited_opening", "visible_setup", "participant_reason", "viewer_hook",
              "product_connection", "payoff", "unseen_setup")
    if (inspection.get("coverage") != "complete-clip" or not inspection.get("method")
            or not {"visual", "transcript"}.issubset(inspection.get("modalities", []))
            or not isinstance(duration, (int, float)) or isinstance(duration, bool) or duration <= 0
            or not all(isinstance(situation.get(k), str) and situation[k].strip() for k in fields)
            or not ref.get("limitations") or not ref.get("allowed_offering_types")
            or not ref.get("interaction_types")):
        return False
    previous_start = -1
    for turn in ref.get("speaker_turns", []):
        start, end = turn.get("start"), turn.get("end")
        if (not isinstance(start, (int, float)) or not isinstance(end, (int, float))
                or isinstance(start, bool) or isinstance(end, bool)
                or not 0 <= start < end <= duration + .5 or start < previous_start
                or not isinstance(turn.get("text"), str) or not turn["text"].strip()):
            return False
        previous_start = start
    return True


def observed_dialogue_references(references, mode):
    """Validate provenance and observed turn structure, not whether copy sounds human."""
    if isinstance(references, dict):
        # The street selector emits a context envelope; saved legacy records may
        # instead be a list or a single record. Preserve their contents unchanged.
        references = references.get("references", [references] if references.get("id") else [])
    if not isinstance(references, list):
        return []
    return [r for r in references or [] if isinstance(r, dict)
            and r.get("id") and r.get("observed") is True and r.get("dialogue_mode") == mode
            and (r.get("url") or r.get("source"))
            and r.get("observed_scope") in ("transcript", "audio", "video")
            and r.get("transfer_rule")
            and isinstance(r.get("speaker_turns"), list) and len(r["speaker_turns"]) >= 3
            and all(isinstance(t, dict) and t.get("speaker") and t.get("does")
                    for t in r["speaker_turns"])
            and len({t["speaker"] for t in r["speaker_turns"]}) >= 2
            and (mode != "street-interview" or complete_street_reference(r))]


def timing_number(value, label, minimum=0):
    if isinstance(value, bool) or not isinstance(value, (int, float)) or not math.isfinite(value) or value < minimum:
        raise ValueError(f"{label} must be a finite number >= {minimum}")
    return float(value)


def has_timing_profile(beat, shape):
    return any(key in beat or key in shape for key in
               ("pacing_source", "speech_seconds", "pause_seconds", "delivery_guidance")) or "words_per_second" in beat


def spoken_timing(beat, shape, references=None):
    """Resolve this run's target separately from recipe limits and observed guidance.

    Legacy shapes remain estimates. A reference's brisk read is not evidence that
    the selected engine can reproduce it. No input script or recipe is rewritten.
    """
    rate = timing_number(beat.get("words_per_second", shape.get("words_per_second", DEFAULT_WPS)),
                         "words_per_second", 0.01)
    seconds = timing_number(beat["seconds"], "seconds") if "seconds" in beat else None
    pause = timing_number(beat.get("pause_seconds", 0), "pause_seconds")
    if seconds is None and ("pause_seconds" in beat or "speech_seconds" in beat):
        raise ValueError("speech/pause windows require the beat's seconds")
    if seconds is not None and pause > seconds:
        raise ValueError("pause_seconds exceeds the beat's seconds")
    window = timing_number(beat["speech_seconds"], "speech_seconds") if "speech_seconds" in beat else (
        seconds - pause if seconds is not None else None)
    if seconds is not None and window + pause > seconds + 1e-9:
        raise ValueError("speech_seconds plus pause_seconds exceeds the beat's seconds")
    source = beat.get("pacing_source", shape.get("pacing_source"))
    if source is None:
        source = {"kind": "legacy" if "words_per_second" in shape or "words_per_second" in beat else "fallback",
                  "detail": "Unverified planning rate; no measured delivery provenance supplied."}
    if not isinstance(source, dict) or source.get("kind") not in ("recipe", "reference", "brief", "fallback", "legacy") or not source.get("detail"):
        raise ValueError("pacing_source needs kind and detail")
    if source["kind"] == "reference":
        ref = next((r for r in references or [] if isinstance(r, dict) and r.get("id") == source.get("reference_id")), None)
        if not ref or not (ref.get("url") or ref.get("source")) or ref.get("observed") is not True or ref.get("observed_scope") not in ("audio", "video"):
            raise ValueError("reference pacing needs an observed audio/video record in references.json")
    target = round(window * rate) if window is not None else None
    limit = beat.get("max_words")
    if limit is not None:
        timing_number(limit, "max_words")
        if int(limit) != limit:
            raise ValueError("max_words must be an integer")
    # A successful render is a baseline, not a hard engine ceiling.
    guidance = beat.get("delivery_guidance", shape.get("delivery_guidance"))
    if guidance is not None:
        if not isinstance(guidance, dict) or guidance.get("basis") not in ("recipe_estimate", "observed_render") or not guidance.get("detail"):
            raise ValueError("delivery_guidance needs words_per_second, basis and detail")
        timing_number(guidance.get("words_per_second"), "delivery_guidance.words_per_second", 0.01)
    budget = min(target, limit) if target is not None and limit is not None else (
        limit if limit is not None else target)
    if limit is not None and not has_timing_profile(beat, shape):
        budget = limit  # preserve the legacy explicit max_words override
    return {"seconds": seconds, "speech_seconds": window, "words_per_second": rate,
            "target_words": target, "word_budget": budget, "max_words": limit,
            "pacing_source": source, "delivery_guidance": guidance}


def budget_tolerance(beat, shape, strict):
    profiled_speech = beat.get("kind", "spoken") == "spoken" and has_timing_profile(beat, shape)
    return 1.0 if strict and (profiled_speech or beat.get("max_words") is not None) else OVER_BUDGET


def lint(cands, shape=None, rules=None, bank=None, report_only=False, context=None, strict=False, references=None):
    if isinstance(cands, list):
        cands = {"concepts": cands}
    shape = shape or {}
    wps = shape.get("words_per_second", DEFAULT_WPS)
    shape_beats = [b for b in shape.get("beats") or [] if isinstance(b, dict)]
    by_id = {b["id"]: b for b in shape_beats if b.get("id")}
    hook_beat = shape_beats[0] if shape_beats else None
    hook_kind = (hook_beat or {}).get("kind", "spoken")
    cta_id = shape.get("cta_beat")
    brand = plain((rules or {}).get("name") or "").strip()
    # Match the brand as stored: "Calm" must not fire on "I couldn't calm down".
    brand_re = (re.compile(r"\b%s\b" % re.escape(brand), 0 if brand != brand.lower() else re.I)
                if brand else None)
    bank_quotes = {q["id"]: q for q in (bank or {}).get("quotes", []) or []
                   if isinstance(q, dict) and q.get("id")}
    nsay = never_say_checks(rules)

    report = {"ok": True, "concepts": [], "set_errors": [], "set_warnings": [], "input_errors": []}
    if strict and not shape_beats:
        report["input_errors"].append("the selected recipe's shape is required")
    if strict and not report_only and not context:
        report["input_errors"].append("a validated angle-context is required for generated scripts")
    if strict and not report_only and shape.get("requires_creative_brief") and not (context or {}).get("creative_brief"):
        report["input_errors"].append("this run requires a sourced creative_brief in angle-context")
    mode = dialogue_mode(shape)
    dialogue_refs = observed_dialogue_references(references, mode) if mode else []
    if strict and not report_only and mode and not dialogue_refs:
        report["input_errors"].append("generated dialogue needs an observed same-format reference; street ads need a complete commercial interaction with words and actions")
    if not cands.get("concepts"):
        report["input_errors"].append("no script concepts to check")
    angles, evidence, facts = {}, {}, {}
    if context:
        context_errors = validate_bank(context)
        report["input_errors"].extend(context_errors)
        if context_errors:
            report["ok"] = False
            return report
        angles = {a["id"]: a for a in context.get("angles", []) if isinstance(a, dict) and a.get("id")}
        for group in ("facts", "quotes", "references"):
            evidence.update({e["id"]: e for e in context.get(group, [])
                             if isinstance(e, dict) and e.get("id")})
        if not bank_quotes:
            bank_quotes = {q["id"]: q for q in context.get("quotes", [])}
        facts = {f["id"]: f for f in context.get("facts", []) if isinstance(f, dict) and f.get("id")}
        for key in ("brand_id", "product_id", "template_id"):
            if not context.get(key) or cands.get(key) != context.get(key):
                report["input_errors"].append(f"candidate {key} must match angle-context")
        if shape.get("template_id") != context.get("template_id"):
            report["input_errors"].append("shape template_id must match angle-context")
    if strict and not report_only and shape.get("requires_visuals") is not True:
        report["input_errors"].append("generated scripts require a per-beat visual contract")
    if report["input_errors"]:
        report["ok"] = False
    try:
        wps = timing_number(wps, "words_per_second", 0.01)
        for i, beat in enumerate(shape_beats):
            if beat.get("kind", "spoken") == "spoken":
                spoken_timing(beat, shape, references)
            elif "seconds" in beat:
                timing_number(beat["seconds"], f"beat {i} seconds")
        if "total_seconds" in shape:
            timing_number(shape["total_seconds"], "total_seconds")
    except ValueError as exc:
        report["input_errors"].append(str(exc))
        report["ok"] = False
        return report
    all_hooks, concepts_seen = [], []

    for c in cands.get("concepts", []) or []:
        if not isinstance(c, dict):
            continue
        cid = c.get("id", "?")
        errs, warns = [], []

        def err(code, msg, beat=None):
            errs.append({"code": code, "beat": beat, "msg": msg})

        def warn(code, msg, beat=None):
            warns.append({"code": code, "beat": beat, "msg": msg})

        beats = [b for b in c.get("beats") or [] if isinstance(b, dict)]
        hooks = [h for h in c.get("hooks") or [] if isinstance(h, dict)]
        full_text = " ".join(text_of(b) for b in beats)
        everything = plain(full_text + " " + " ".join(text_of(h) for h in hooks))
        brief = (context or {}).get("creative_brief") or {}
        if brief and not report_only:
            normalized = " ".join(everything.casefold().split())
            for decision in brief.get("prior_decisions", []):
                rejected = " ".join(decision.get("avoid_phrase", "").casefold().split())
                if rejected and re.search(r"(?<!\w)" + re.escape(rejected) + r"(?!\w)", normalized):
                    err("E_PRIOR_REJECTION", f"script repeats a retrieved rejection: {decision['avoid_phrase']}")
            for locked in brief.get("locked_copy", []):
                if locked["text"] not in full_text:
                    err("E_LOCKED_COPY", "preserve the user's exact locked copy; resolve conflicts in review")
        if strict and not report_only and mode:
            if c.get("reference_id") not in {r["id"] for r in dialogue_refs}:
                err("E_DIALOGUE_REFERENCE", "cite the observed conversation reference used for this execution")
        if not beats or any(not text_of(b).strip() and not by_id.get(b.get("id"), {}).get("optional")
                            and by_id.get(b.get("id"), {}).get("kind") != "visual" for b in beats):
            err("E_EMPTY_SCRIPT", "required beats need usable text")
        if context and not report_only:
            angle = angles.get(c.get("angle_id"))
            if not angle:
                err("E_ANGLE_ID", "concept must cite an angle from the selected context")
            elif c.get("angle") != angle.get("angle"):
                err("E_ANGLE_CHANGED", "the selected angle was changed; vary execution inside it")
            if angle and angle.get("blocking_issues"):
                err("E_ANGLE_BLOCKED", "the selected angle has unresolved essential evidence or production blockers")
            if angle and context.get("template_id") not in angle.get("compatible_template_ids", []):
                err("E_TEMPLATE_FIT", "the selected angle has not been validated for this template")
            if not c.get("evidence_ids"):
                err("E_NO_EVIDENCE", "concept needs source ids, not necessarily a customer quote")
            for eid in c.get("evidence_ids", []):
                if eid not in evidence:
                    err("E_EVIDENCE_ID", f"unknown evidence id {eid}")
            if "claims" not in c or not isinstance(c["claims"], list):
                err("E_CLAIM_LEDGER", "declare the product claims as a list, empty when there are none")
            for claim in c.get("claims", []):
                if not isinstance(claim, dict):
                    err("E_CLAIM_SOURCE", "claims must be records with text and fact_ids")
                    continue
                if not claim.get("fact_ids") or any(fid not in facts for fid in claim.get("fact_ids", [])):
                    err("E_CLAIM_SOURCE", "product claims need current facts for this product; reviews are not substantiation")

        # Customer words behind the concept (not for the user's own lines)
        cited = []
        if not report_only:
            qids = c.get("quote_ids") or []
            if bank_quotes:
                if not qids and not context:
                    err("E_NO_QUOTE", "no customer quote behind this concept: build it on what buyers said")
                for q in qids:
                    if q not in bank_quotes:
                        err("E_BAD_QUOTE_ID", f"quote id {q} is not in the customer-words bank")
                    else:
                        cited.append(bank_quotes[q].get("text") or "")
            elif not context:
                warn("W_NO_CUSTOMER_WORDS", "no customer-words bank: this script is not built on buyers' words")
            if cited:
                mine = ngrams(norm_words(everything))
                theirs = set().union(*(ngrams(norm_words(t)) for t in cited))
                shared = {g for g in mine & theirs if any(w not in STOPWORDS for w in g)}
                if not shared:
                    warn("W_NOT_THEIR_WORDS", "never uses a phrase from the quotes it cites: borrow their wording")

        # Shape: beats present, in the format's order, nothing spoken after the CTA.
        # slot[i] is the exact shape beat concept beat i fills (a shape may repeat ids).
        slot = {}
        if shape_beats:
            have = [b.get("id") for b in beats]
            for b in beats:
                if b.get("id") not in by_id:
                    (err if strict else warn)("E_BEAT_UNKNOWN" if strict else "W_BEAT_UNKNOWN",
                                              f"beat '{b.get('id')}' is not in the format's shape", b.get("id"))
            pos = -1
            for i, b in enumerate(beats):
                nxt = next((j for j in range(pos + 1, len(shape_beats))
                            if shape_beats[j].get("id") == b.get("id")), None)
                if nxt is None and b.get("id") in by_id:
                    err("E_BEAT_ORDER", "beats are not in the format's order: " + " > ".join(str(i) for i in have))
                    break
                if nxt is not None:
                    pos = nxt
                    slot[i] = shape_beats[nxt]
            used = {id(sb) for sb in slot.values()}
            for sb in shape_beats:
                if id(sb) not in used and not sb.get("optional"):
                    err("E_BEAT_MISSING", f"required slot '{sb.get('id')}' from the format is missing", sb.get("id"))
        if cta_id and cta_id in [b.get("id") for b in beats]:
            at = [b.get("id") for b in beats].index(cta_id)
            after = [b for b in beats[at + 1:]
                     if by_id.get(b.get("id"), {}).get("kind", b.get("kind", "spoken")) in SPOKEN_KINDS
                     and text_of(b).strip()]
            if after:
                err("E_CTA_NOT_LAST", f"'{after[0].get('id')}' is said after the CTA: end on the CTA",
                    after[0].get("id"))

        # Beats occupy ordered, sequential windows. An omitted optional beat
        # reserves no time; repeated ids retain the distinct slots chosen above.
        if shape.get("total_seconds") is not None:
            selected_seconds = sum(sb.get("seconds", 0) for sb in slot.values())
            if selected_seconds > shape["total_seconds"] + 1e-9:
                err("E_TIMELINE", f"selected beats need {selected_seconds:g}s but the ad has {shape['total_seconds']:g}s; fit speech, pauses and silent beats inside the runtime")

        # Word budgets and how each line reads out loud
        words_by_beat, total, timings, spoken_budgets = {}, 0, [], []
        unshaped_spoken_words = 0
        for i, b in enumerate(beats):
            bid, text = b.get("id"), text_of(b)
            n = len(words(text))
            words_by_beat[bid] = n
            sb = slot.get(i) or by_id.get(bid)
            budget, kind = beat_budget(sb, wps) if sb else (None, b.get("kind", "spoken"))
            if sb and sb.get("speaker") and b.get("speaker") != sb["speaker"] and strict:
                err("E_SPEAKER", f"this beat must belong to {sb['speaker']}", bid)
            if sb and sb.get("max_chars") and len(text) > sb["max_chars"]:
                err("E_CHAR_BUDGET", "line exceeds the recipe's character limit", bid)
            if sb and sb.get("max_lines") and len(text.splitlines()) > sb["max_lines"]:
                err("E_LINE_BUDGET", "line exceeds the recipe's line limit", bid)
            if strict and shape.get("requires_visuals"):
                visual = b.get("visual")
                if not isinstance(visual, dict) or not visual.get("description") or not visual.get("mode"):
                    err("E_VISUAL", "each beat needs a visual description and production mode", bid)
                else:
                    if visual["mode"] not in shape.get("allowed_visual_modes", ["existing", "generate", "text"]):
                        err("E_VISUAL_MODE", "this recipe cannot make the proposed visual", bid)
                    available = set(shape.get("available_asset_ids", []))
                    if visual["mode"] == "existing" and not visual.get("asset_ids"):
                        err("E_ASSET", "existing footage needs an actual asset id", bid)
                    for asset in visual.get("asset_ids", []):
                        if asset not in available:
                            err("E_ASSET", f"visual refers to unavailable asset {asset}", bid)
            timing = spoken_timing(sb, shape, references) if sb and kind == "spoken" else None
            if timing:
                budget = timing["word_budget"]
                timings.append({"slot": i, "id": bid, "speaker": sb.get("speaker"), "words": n, **timing,
                                "required_words_per_second": round(n / timing["speech_seconds"], 3) if timing["speech_seconds"] else None,
                                "estimated_speech_seconds": round(n / timing["words_per_second"], 3)})
                guidance = timing["delivery_guidance"]
                if guidance and timing["words_per_second"] > guidance["words_per_second"]:
                    warn("W_PACING_EXPERIMENT", "desired cadence exceeds delivery guidance; validate the rendered read before promising it fits", bid)
                if timing["max_words"] is not None and timing["target_words"] is not None and timing["target_words"] > timing["max_words"]:
                    warn("W_PACING_LIMIT", "desired cadence does not override the recipe's explicit word limit", bid)
            if kind == "spoken":
                total += n
                spoken_budgets.append(budget)
                if timing is None:
                    unshaped_spoken_words += n
            if budget is not None:
                tolerance = budget_tolerance(sb or {}, shape, strict)
                if n > budget * tolerance:
                    err("E_BUDGET", f"{n} words against a {budget}-word plan: tighten wording, extend supported timing or evaluate a faster read; preserve proof and CTA", bid)
                elif kind == "spoken" and n < budget * UNDER_BUDGET:
                    warn("W_UNDER_BUDGET", f"{n} words against a {budget}-word plan: confirm the read or intentional silence; do not add filler", bid)
            if kind in SPOKEN_KINDS:
                for s in sentences(text):
                    if len(words(s)) > LONG_SENTENCE:
                        warn("W_LONG_SENTENCE", f"{len(words(s))}-word sentence: nobody says that in one breath", bid)
                m = STIFF_RE.search(plain(text))
                if m:
                    warn("W_STIFF", f"\"{m.group(0)}\": write it the way people talk (contractions)", bid)
            gen = [w for w in norm_words(text) if w in GENERIC_WORDS]
            if len(gen) >= 2:
                warn("W_GENERIC", f"filler words {sorted(set(gen))}: say the specific thing", bid)
            limit = ON_SCREEN_HOOK_MAX if i == 0 else ON_SCREEN_LINE_MAX
            if len(words(on_screen_of(b))) > limit:
                warn("W_ON_SCREEN_LONG", f"{len(words(on_screen_of(b)))} on-screen words: keep it to {limit} so it can be read in time", bid)
        if spoken_budgets and all(budget is not None for budget in spoken_budgets):
            cap = sum(spoken_budgets)
            if total > cap * max(budget_tolerance(sb, shape, strict) for sb in shape_beats if sb.get("kind", "spoken") == "spoken"):
                err("E_BUDGET", f"{total} spoken words against a {cap}-word plan for spoken windows; silent visuals and end cards add no speech time")
        elif not shape_beats and shape.get("total_seconds") and total:
            cap = float(shape["total_seconds"]) * wps
            if total > cap * OVER_BUDGET:
                err("E_BUDGET", f"{total} spoken words in a {shape['total_seconds']}s ad (about {round(cap)} fit)")

        if shape.get("total_seconds") is not None and (timings or unshaped_spoken_words):
            # Keep an overall estimate when legacy explicit limits override a
            # short window or a beat has no duration. Use each beat's own rate;
            # unmatched spoken copy still consumes time at the shape fallback rate.
            reserved = sum((row["seconds"] or 0) - (row["speech_seconds"] or 0) for row in timings)
            reserved += sum(sb.get("seconds", 0) for sb in slot.values() if sb.get("kind", "spoken") != "spoken")
            read_seconds = sum(row["words"] / row["words_per_second"] for row in timings) + unshaped_spoken_words / wps
            rounding = sum(0.5 / row["words_per_second"] for row in timings)
            tolerance = 1.0 if strict else OVER_BUDGET
            if reserved + read_seconds > shape["total_seconds"] * tolerance + rounding:
                err("E_TIMELINE", f"planned reads and reserved silence need about {reserved + read_seconds:.2f}s but the ad has {shape['total_seconds']:g}s; preserve the runtime and each beat's cadence")

        # The opening beat: words on screen, and a picture that shows what the hook says
        if beats:
            opening = beats[0]
            oid = opening.get("id") or "first beat"
            if (hook_kind == "spoken" and text_of(opening).strip() and not on_screen_of(opening).strip()
                    and shape.get("words_on_screen") not in NO_BEAT1_TEXT
                    and c.get("words_on_screen") not in NO_BEAT1_TEXT):
                warn("W_BEAT1_NO_TEXT", "the opening is spoken but has no on-screen words: most people watch muted; add 8 or fewer words that say the hook", oid)
            picture = opening["visual"].get("description") if isinstance(opening.get("visual"), dict) else ""
            picture = picture if isinstance(picture, str) else ""
            hook_stems = stems(text_of(opening) + " " + on_screen_of(opening))
            if picture and hook_stems and stems(picture) and not (stems(picture) & hook_stems):
                warn("W_PICTURE_HOOK_MISMATCH", "the first picture shares nothing with the hook: open on what the line says", oid)

        # The body: one demo or proof, at most two features
        if len(beats) >= 3:
            fact_texts = [str(f) for p in (rules or {}).get("products", []) or [] for f in p.get("facts", []) or []]
            fact_texts += [str(f.get("text", "")) for f in facts.values()]
            body = [text_of(b) + " " + on_screen_of(b) for b in beats[1:-1]]
            names = [brand] + [str(p.get("name", "")) for p in (rules or {}).get("products", []) or [] if isinstance(p, dict)]
            stack = max([features_named(" ".join(body), list(dict.fromkeys(fact_texts)), names)] + [list_items(t) for t in body])
            if stack >= FEATURE_STACK_MIN:
                warn("W_FEATURE_STACK", f"the body lists {stack} features: show one proof or demo and keep two at most, each turned into what it does for the viewer")

        if "angle_type" in c and c.get("angle_type") not in ANGLE_TYPES:
            warn("W_ANGLE_TYPE", f"angle_type {c.get('angle_type')!r} is not one of: {', '.join(ANGLE_TYPES)}")
        elif strict and not report_only and "angle_type" not in c:
            warn("W_ANGLE_TYPE", "declare the concept's angle_type so the set can be checked for sameness")

        # Hooks: each alternative must open cleanly and fit the first beat
        hook_budget = (spoken_timing(hook_beat, shape, references)["word_budget"] if hook_kind == "spoken"
                       else beat_budget(hook_beat, wps)[0]) if hook_beat else None
        lines = [("hook " + str(h.get("id", "?")), text_of(h), True) for h in hooks]
        if beats:
            lines.append((beats[0].get("id") or "first beat", text_of(beats[0]), False))
        for label, text, alternative in lines:
            first = first_sentence(text)
            if hook_kind in OPENER_KINDS:
                if HARD_OPENER_RE.search(first):
                    err("E_DEAD_OPENER", f"\"{first[:60]}\" is a dead opener: open on the pain, the claim or the moment", label)
                elif TIRED_OF_LIST_RE.search(first):
                    warn("W_TIRED_OF_LIST", f"\"{first[:60]}\" lists pains: open on one concrete moment instead", label)
                elif SOFT_OPENER_RE.search(first):
                    warn("W_SOFT_OPENER", f"\"{first[:60]}\" usually reads as an ad: keep it only if it is a real line", label)
                elif first.rstrip().endswith("?") and QUESTION_OPENER_RE.search(first):
                    warn("W_QUESTION_HOOK", "a question hook delays the claim: keep it only if it is specific and answered fast", label)
            if brand_re and brand_re.search(first) and not shape.get("brand_early"):
                warn("W_BRAND_FIRST", "brand name in the first line: earn attention before you introduce the brand", label)
            if alternative and hook_budget is not None and len(words(text)) > hook_budget * budget_tolerance(hook_beat, shape, strict):
                err("E_BUDGET", f"hook is {len(words(text))} words, the opening beat fits about {hook_budget}", label)
        fams = [h.get("family") for h in hooks if h.get("family")]
        if len(fams) != len(set(fams)):
            warn("W_SAME_FAMILY", "two hooks share a family: make each hook a different kind of opening")
        concepts_seen.append(c)
        all_hooks += [(cid, h.get("id"), text_of(h)) for h in hooks]

        # AI tells and dash habits across everything this concept says
        for rx, why in AI_TELL_RES:
            for m in rx.finditer(everything):
                if not AD_SPEAK_RE.search(m.group(0)):   # W_AD_SPEAK already names it
                    warn("W_AI_TELL", f"\"{m.group(0)[:50]}\": {why}")
        # Sound like a person: fragments, steps read aloud, a mood opener, ad-speak.
        kinds = [(slot.get(i) or by_id.get(b.get("id")) or b).get("kind", "spoken") for i, b in enumerate(beats)]
        silent = shape.get("speech") == "none" or not any(
            k == "spoken" and text_of(b).strip() for k, b in zip(kinds, beats))
        for code, msg, at in voice_checks(beats, kinds, hooks, silent):
            warn(code, msg, at)
        dashes = everything.count("—") + everything.count(" – ")
        if dashes >= 2:
            warn("W_AI_TELL", f"{dashes} long dashes: a dash habit reads machine-written; use full stops")
        t = TRICOLON_RE.search(plain(full_text))
        if t:
            warn("W_TRICOLON", f"\"{t.group(0)}\": a list of three is often padding; name one or two real things")

        # Brand rules: never say, and numbers no fact or quote backs
        text_words = norm_words(everything)
        for kind, needle, label in nsay:
            if kind == "phrase":
                if has_phrase(text_words, needle):
                    err("E_NEVER_SAY", f"breaks a brand rule: {label}")
                continue
            short = len(needle) <= 3
            for s in sentences(everything):
                sw = {stem(w) for w in content_words(s)}
                hit = sum(1 for w in needle if w in sw) / len(needle)
                if (short and hit == 1) or (not short and hit >= 0.75):
                    warn("W_NEVER_SAY", f"\"{s[:60]}\" may break a brand rule ({label}): rewrite it unless it clearly means something else")
                    break
        # The shared research handoff is also a fact source. A value need not be
        # copied into legacy brand rules merely to avoid an unsourced warning.
        allowed = allowed_numbers(rules, cited + [str(f.get("text", "")) for f in facts.values()])
        for m in NUMBER_RE.finditer(CUE_RE.sub(" ", everything)):
            n = re.sub(r"[^\d.]", "", m.group(0)).rstrip(".")
            if n and n not in allowed:
                warn("W_UNSOURCED_NUMBER", f"\"{m.group(0).strip()}\" is not in the product facts or quotes: make sure it is true")

        report["concepts"].append({"id": cid, "words": words_by_beat, "spoken_words": total, "timing": timings,
                                   "errors": errs, "warnings": warns})
        if errs:
            report["ok"] = False

    # Across the set (next to W_SAME_FAMILY for hooks). An open angle gives every concept
    # its own angle type; a selected angle keeps one type for every execution. Only a mix
    # (some shared, some not) is E_SAME_ANGLE. A user's own variants are only reported.
    types = [c.get("angle_type") for c in concepts_seen if isinstance(c.get("angle_type"), str) and c.get("angle_type")]
    repeated = sorted({t for t in types if types.count(t) > 1})
    if repeated and len(set(types)) > 1:
        ids = [c.get("id", "?") for c in concepts_seen if c.get("angle_type") in repeated]
        finding = {"code": "E_SAME_ANGLE" if not report_only else "W_SAME_ANGLE",
                   "msg": f"concepts {', '.join(map(str, ids))} repeat the angle type {', '.join(repeated)} while others differ: "
                          "give every concept its own type, or keep one type for executions of a selected angle"}
        report["set_warnings" if report_only else "set_errors"].append(finding)
    # Openings that share three content words in order, after the brand, product and
    # angle words every execution may reuse are set aside: advice, not an error.
    ignore = set(tokens(brand))
    for p in (rules or {}).get("products", []) or []:
        if isinstance(p, dict):
            ignore |= set(tokens(str(p.get("name", ""))))
    for c in concepts_seen:
        ignore |= set(tokens(str(c.get("angle") or "")))
        selected = angles.get(c.get("angle_id")) if isinstance(c.get("angle_id"), str) else None
        ignore |= set(tokens(str((selected or {}).get("angle") or "")))
    for i in range(len(concepts_seen)):
        for j in range(i + 1, len(concepts_seen)):
            a, b = concepts_seen[i], concepts_seen[j]
            if shared_run(opening_tokens(a, ignore), opening_tokens(b, ignore)):
                report["set_warnings"].append({
                    "code": "W_SIMILAR_OPENING",
                    "msg": f"concepts {a.get('id', '?')} and {b.get('id', '?')} open with the same words: give each its own opening"})
    if report["set_errors"]:
        report["ok"] = False

    # Across the set: hooks that are really the same line
    for i in range(len(all_hooks)):
        for j in range(i + 1, len(all_hooks)):
            a, b = set(content_words(all_hooks[i][2])), set(content_words(all_hooks[j][2]))
            if a and b and len(a & b) / len(a | b) >= 0.6:
                report["set_warnings"].append({
                    "code": "W_DUP_HOOK",
                    "msg": f"hooks {all_hooks[i][0]}/{all_hooks[i][1]} and {all_hooks[j][0]}/{all_hooks[j][1]} say the same thing"})
    return report


def print_report(rep):
    for msg in rep.get("input_errors", []):
        print(f"  FIX  input: {msg}")
    for c in rep["concepts"]:
        state = "OK" if not c["errors"] else f"{len(c['errors'])} to fix"
        print(f"\n[{c['id']}] {state} · {c['spoken_words']} spoken words · per beat {c['words']}")
        for e in c["errors"]:
            print(f"  FIX  {e['code']}{' @' + e['beat'] if e.get('beat') else ''}: {e['msg']}")
        for w in c["warnings"]:
            print(f"  look {w['code']}{' @' + w['beat'] if w.get('beat') else ''}: {w['msg']}")
    for e in rep.get("set_errors", []):
        print(f"\n  FIX  {e['code']}: {e['msg']}")
    for w in rep["set_warnings"]:
        print(f"\n  look {w['code']}: {w['msg']}")
    print("\nPASS" if rep["ok"] else "\nFIX the errors above, then run this again")


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--candidates", required=True)
    ap.add_argument("--shape")
    ap.add_argument("--rules")
    ap.add_argument("--customer-words")
    ap.add_argument("--angle-context")
    ap.add_argument("--references", help="observed persuasion, dialogue and pacing provenance")
    ap.add_argument("--strict", action="store_true", help="require research/recipe contracts and enforce explicit profiled budgets")
    ap.add_argument("--out", default="working/script/lint.json")
    ap.add_argument("--report-only", action="store_true",
                    help="the lines are the user's own words: report, never fail")
    a = ap.parse_args()
    cands = load_json(a.candidates, required=True)
    if not isinstance(cands, (dict, list)):
        print(f"{a.candidates} must hold an object with a concepts list", file=sys.stderr)
        sys.exit(1)
    rep = lint(cands, load_json(a.shape), load_json(a.rules), load_json(a.customer_words),
               report_only=a.report_only, context=load_json(a.angle_context), strict=a.strict,
               references=load_json(a.references))
    out = pathlib.Path(a.out)
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(json.dumps(rep, indent=1, ensure_ascii=False))
    print_report(rep)
    if a.report_only:
        sys.exit(0)
    sys.exit(0 if rep["ok"] else 2)


if __name__ == "__main__":
    main()

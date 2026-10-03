#!/usr/bin/env python3
"""Rule check for video ad script candidates, run before anyone reads them.

Catches what a machine can decide, so the human and the critic model spend their
attention on taste:

  errors (exit 2)  a line over the format's word budget, a missing beat, beats out of
                   the format's order, something spoken after the CTA, a dead opener
                   ("Introducing…", "Have you ever…"), a phrase the brand quoted as
                   banned, no customer quote behind a concept, a quote id that is not
                   in the bank
  warnings         a line that looks like a banned brand claim (a human decides), AI
                   tells ("it's not X, it's Y", "game-changer", dash habits), stiff
                   spoken lines, long sentences, numbers no fact or quote backs, the
                   brand name in the first line, a concept that never uses its buyers'
                   words, softer openers, duplicate hooks / families

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

DEFAULT_WPS = 3.0          # spoken words per second when the shape gives none
ON_SCREEN_MAX_WORDS = 8    # a text card the viewer must read at a glance
OVER_BUDGET = 1.15         # tolerance before a line is "too long to say in time"
UNDER_BUDGET = 0.5         # below this a spoken beat drags
LONG_SENTENCE = 20         # spoken words in one sentence
SPOKEN_KINDS = {"spoken", "bubble", "lyric"}  # said, typed or sung: read as speech
OPENER_KINDS = {"spoken", "on_screen"}        # where an ad-style opener reads as an ad

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
QUESTION_OPENER_RE = re.compile(r"^\W*(do|does|are|is|have|has|ever|can|what|why|how|who|want)\b", re.I)

AI_TELLS = [
    (r"\b(it's|this is|that's|this isn't|it isn't)\s+not\s+(just\s+)?(about\s+)?[^.?!]{1,50}?[,;—–-]+\s*(it's|this is|that's)\b",
     "\"it's not X, it's Y\": just say Y"),
    (r"\bnot just\b[^.?!]{1,50}\bbut\b", "\"not just X but Y\": just say the thing"),
    (r"\bhere's the (thing|kicker|truth|secret|deal|catch)\b", "drumroll before the point: cut it"),
    (r"\b(game[- ]?changer|revolutionary|next[- ]level|elevate[sd]?|unlock(s|ed)?|seamless(ly)?|"
     r"effortless(ly)?|transformative|supercharge[sd]?|empower(s|ed|ing)?|must[- ]have|"
     r"look no further|level up|in today's|whether you're|designed to|crafted|curated|"
     r"boost your|to the next level|it's that simple|you deserve|holistic|cutting[- ]edge|"
     r"one[- ]stop|all[- ]in[- ]one solution|take control of)\b",
     "ad-speak or AI vocabulary: use the plain word the buyer would say"),
]
AI_TELL_RES = [(re.compile(p, re.I), why) for p, why in AI_TELLS]
GENERIC_WORDS = {"really", "very", "amazing", "incredible", "literally", "simply", "actually",
                 "basically", "best-in-class", "world-class", "awesome", "perfect"}
STIFF_RE = re.compile(
    r"\b(do not|does not|did not|cannot|can not|will not|would not|should not|is not|are not|"
    r"was not|it is|i am|you are|we are|they are|that is|i will|you will|let us)\b", re.I)
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
    if shape_beat.get("max_words") is not None:
        return int(shape_beat["max_words"]), kind
    if kind == "on_screen":
        return ON_SCREEN_MAX_WORDS, kind
    if shape_beat.get("seconds"):
        return max(1, round(float(shape_beat["seconds"]) * wps)), kind
    return None, kind


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


def lint(cands, shape=None, rules=None, bank=None, report_only=False, references=None, strict=False):
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

    report = {"ok": True, "concepts": [], "set_warnings": [], "input_errors": []}
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
    all_hooks = []

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

        # Customer words behind the concept (not for the user's own lines)
        cited = []
        if not report_only:
            qids = c.get("quote_ids") or []
            if bank_quotes:
                if not qids:
                    err("E_NO_QUOTE", "no customer quote behind this concept: build it on what buyers said")
                for q in qids:
                    if q not in bank_quotes:
                        err("E_BAD_QUOTE_ID", f"quote id {q} is not in the customer-words bank")
                    else:
                        cited.append(bank_quotes[q].get("text") or "")
            else:
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
            for sb in shape_beats:
                if sb.get("id") not in have and not sb.get("optional"):
                    err("E_BEAT_MISSING", f"beat '{sb.get('id')}' from the format is missing", sb.get("id"))
            for b in beats:
                if b.get("id") not in by_id:
                    warn("W_BEAT_UNKNOWN", f"beat '{b.get('id')}' is not in the format's shape", b.get("id"))
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
        for i, b in enumerate(beats):
            bid, text = b.get("id"), text_of(b)
            n = len(words(text))
            words_by_beat[bid] = n
            sb = slot.get(i) or by_id.get(bid)
            budget, kind = beat_budget(sb, wps) if sb else (None, b.get("kind", "spoken"))
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
        if spoken_budgets and all(budget is not None for budget in spoken_budgets):
            cap = sum(spoken_budgets)
            if total > cap * max(budget_tolerance(sb, shape, strict) for sb in shape_beats if sb.get("kind", "spoken") == "spoken"):
                err("E_BUDGET", f"{total} spoken words against a {cap}-word plan for spoken windows; silent visuals and end cards add no speech time")
        elif not shape_beats and shape.get("total_seconds") and total:
            cap = float(shape["total_seconds"]) * wps
            if total > cap * OVER_BUDGET:
                err("E_BUDGET", f"{total} spoken words in a {shape['total_seconds']}s ad (about {round(cap)} fit)")

        if shape.get("total_seconds") is not None and timings:
            # Keep an overall estimate when legacy explicit limits override a
            # short window or a beat has no duration. Use each beat's own rate.
            reserved = sum((row["seconds"] or 0) - (row["speech_seconds"] or 0) for row in timings)
            reserved += sum(sb.get("seconds", 0) for sb in slot.values() if sb.get("kind", "spoken") != "spoken")
            read_seconds = sum(row["words"] / row["words_per_second"] for row in timings)
            rounding = sum(0.5 / row["words_per_second"] for row in timings)
            tolerance = 1.0 if strict else OVER_BUDGET
            if reserved + read_seconds > shape["total_seconds"] * tolerance + rounding:
                err("E_TIMELINE", f"planned reads and reserved silence need about {reserved + read_seconds:.2f}s but the ad has {shape['total_seconds']:g}s; preserve the runtime and each beat's cadence")

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
                elif SOFT_OPENER_RE.search(first):
                    warn("W_SOFT_OPENER", f"\"{first[:60]}\" usually reads as an ad: keep it only if it is a real line", label)
                elif first.rstrip().endswith("?") and QUESTION_OPENER_RE.search(first):
                    warn("W_QUESTION_HOOK", "a question hook delays the claim: keep it only if it is specific and answered fast", label)
            if brand_re and brand_re.search(first):
                warn("W_BRAND_FIRST", "brand name in the first line: earn attention before you introduce the brand", label)
            if alternative and hook_budget is not None and len(words(text)) > hook_budget * budget_tolerance(hook_beat, shape, strict):
                err("E_BUDGET", f"hook is {len(words(text))} words, the opening beat fits about {hook_budget}", label)
        fams = [h.get("family") for h in hooks if h.get("family")]
        if len(fams) != len(set(fams)):
            warn("W_SAME_FAMILY", "two hooks share a family: make each hook a different kind of opening")
        all_hooks += [(cid, h.get("id"), text_of(h)) for h in hooks]

        # AI tells and dash habits across everything this concept says
        for rx, why in AI_TELL_RES:
            for m in rx.finditer(everything):
                warn("W_AI_TELL", f"\"{m.group(0)[:50]}\": {why}")
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
        allowed = allowed_numbers(rules, cited)
        for m in NUMBER_RE.finditer(CUE_RE.sub(" ", everything)):
            n = re.sub(r"[^\d.]", "", m.group(0)).rstrip(".")
            if n and n not in allowed:
                warn("W_UNSOURCED_NUMBER", f"\"{m.group(0).strip()}\" is not in the product facts or quotes: make sure it is true")

        report["concepts"].append({"id": cid, "words": words_by_beat, "spoken_words": total, "timing": timings,
                                   "errors": errs, "warnings": warns})
        if errs:
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
    for message in rep.get("input_errors", []):
        print(f"  FIX input: {message}")
    for c in rep["concepts"]:
        state = "OK" if not c["errors"] else f"{len(c['errors'])} to fix"
        print(f"\n[{c['id']}] {state} · {c['spoken_words']} spoken words · per beat {c['words']}")
        for e in c["errors"]:
            print(f"  FIX  {e['code']}{' @' + e['beat'] if e.get('beat') else ''}: {e['msg']}")
        for w in c["warnings"]:
            print(f"  look {w['code']}{' @' + w['beat'] if w.get('beat') else ''}: {w['msg']}")
    for w in rep["set_warnings"]:
        print(f"\n  look {w['code']}: {w['msg']}")
    print("\nPASS" if rep["ok"] else "\nFIX the errors above, then run this again")


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--candidates", required=True)
    ap.add_argument("--shape")
    ap.add_argument("--rules")
    ap.add_argument("--customer-words")
    ap.add_argument("--references", help="observed audio/video reference records for pacing provenance")
    ap.add_argument("--strict", action="store_true", help="enforce explicit limits and profiled speech budgets exactly")
    ap.add_argument("--out", default="working/script/lint.json")
    ap.add_argument("--report-only", action="store_true",
                    help="the lines are the user's own words: report, never fail")
    a = ap.parse_args()
    cands = load_json(a.candidates, required=True)
    if not isinstance(cands, (dict, list)):
        print(f"{a.candidates} must hold an object with a concepts list", file=sys.stderr)
        sys.exit(1)
    rep = lint(cands, load_json(a.shape), load_json(a.rules), load_json(a.customer_words),
               report_only=a.report_only, references=load_json(a.references), strict=a.strict)
    out = pathlib.Path(a.out)
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(json.dumps(rep, indent=1, ensure_ascii=False))
    print_report(rep)
    if a.report_only:
        sys.exit(0)
    sys.exit(0 if rep["ok"] else 2)


if __name__ == "__main__":
    main()

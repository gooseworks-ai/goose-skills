#!/usr/bin/env python3
"""Falsifiable gates for the podcast-skit engine.

Every gate is a pure function: it takes data and returns a list of failure
strings. Empty list means pass. No gate reads the network and no gate spends.

The contract each gate signs, enforced by `selftest.py`:
  * it PASSES on the good fixture, AND
  * it FAILS on a named mutation of that fixture.
A gate that cannot be made to fail is not a gate, it is a comment, and
selftest.py rejects it.

Usage as a CLI:
    gates.py --config config.json [--script script.json] [--beats beats.json]
             [--cutplan cutplan.json] [--overlays <dir>] [--master out.mp4]
             [--recipe ../recipe.json]
Exit 0 = all applicable gates pass, 1 = at least one failure.
"""
from __future__ import annotations

import argparse
import hashlib
import json
import pathlib
import re
import subprocess
import sys
import sys as _sys, pathlib as _pl
_sys.path.insert(0, str(_pl.Path(__file__).resolve().parent))
import config_io  # noqa: E402

# Captions and key content must sit inside this band on a 1080x1920 canvas.
SAFE_TOP = 285
SAFE_BOTTOM = 1635

# Words that describe a narrative arc. A recipe carries implementation detail
# only; the arc belongs to whoever writes the script for a given brand.
NARRATIVE_WORDS = [
    "skeptic", "sceptic", "believer", "skeptic-to-convert", "doubter",
    "convert arc", "the mismatch is the joke",
]

# Real client names that must never survive into a shipped example config.
# Extend, never shrink.
REAL_BRAND_TOKENS = [
    "ladder", "joinladder", "brittney", "brad", "ramp", "dutch", "mindtrip",
    "hume health", "hume-health", "closefly", "alitu", "dibsbeauty",
    "masterclass", "lululemon", "liquid death", "som sleep", "ag1",
    "kolkata chai",
]

ACRONYM_ALLOW = {"I", "A", "OK", "TV"}
# built from codepoints so no literal dash character lives in the repo
EM_DASHES = (chr(0x2014), chr(0x2013))

ARCS_JSON = pathlib.Path(__file__).resolve().parent / "arcs.json"

# ---------------------------------------------------------------- direction
# The recipe supplies no arc. It supplies a MENU (scripts/arcs.json, eight arcs
# each observed in a real reference) and this refusal. The three shapes below
# are the ones a script author defaults to when handed no direction, and all
# three are measured ABSENCES in references/REFERENCES.md:
#   * doubter and convert: in none of nine clips across five shows
#   * announcing the format: in none; our demo does it in its first two seconds
#   * a feature list: in none; wf-telly comes closest and every spec there is
#     an answer to a question somebody just asked
DOUBTER_PATTERNS = [
    r"\bskeptic", r"\bsceptic", r"\bdoubter", r"\bdoubting\b", r"\bbeliever\b",
    r"\bconverts?\b", r"\bconverted\b", r"\bunconvinced\b", r"\bnon.?believer",
    r"\bwon (?:me|him|her|them) over\b", r"\bsold me\b", r"\b(?:i'm|i am) sold\b",
    r"\bprove it\b", r"\btold you so\b", r"\byeah,? right\b",
    r"\b(?:did ?n[o']t|didn't|do ?n[o']t|don't) (?:believe|buy) (?:it|that|this)\b",
    r"\btoo good to be true\b", r"\bchanged my mind\b", r"\bi was wrong\b",
    r"\bnow i (?:get|see) it\b",
]
# Said in the opening line, any of these tells the viewer what they are watching
# before the content has earned a second of attention.
FORMAT_ANNOUNCE_PATTERNS = [
    r"\bad.?read", r"\bsponsor", r"\bthis episode\b", r"\btoday'?s episode\b",
    r"\bthe pod\b", r"\bpodcast\b", r"\bwelcome back\b", r"\bwelcome to\b",
    r"\bbrought to you by\b", r"\bon the show\b", r"\bmic check\b",
    r"\bpartner(?:ed|ing)? with\b", r"\badvert", r"\bcommercial\b",
]


def _fail(out, gate, msg):
    out.append(f"{gate}: {msg}")


# --------------------------------------------------------------- script gates
def gate_script(script: dict, cfg: dict) -> list[str]:
    """Line-level script rules. Everything here is measurable from the text."""
    out: list[str] = []
    limits = cfg.get("script_limits", {})
    max_words = int(limits.get("max_words_per_line", 10))
    host_keys = set(cfg["hosts"].keys())
    seen = set()

    lines = script.get("lines")
    if not isinstance(lines, list) or not lines:
        _fail(out, "script_nonempty", "script.lines is missing or empty")
        return out

    for ln in lines:
        i = ln.get("n")
        if i in seen:
            _fail(out, "script_unique_n", f"duplicate line number {i}")
        seen.add(i)
        who = ln.get("who")
        text = ln.get("text", "")

        if who not in host_keys:
            _fail(out, "script_who_is_a_host",
                  f"line {i}: who={who!r} is not one of {sorted(host_keys)}")

        n_words = len(text.split())
        if n_words > max_words:
            _fail(out, "script_line_word_cap",
                  f"line {i}: {n_words} words > {max_words}")

        for tok in re.findall(r"\b[A-Z]{2,}\b", text):
            if tok not in ACRONYM_ALLOW:
                _fail(out, "script_no_acronyms",
                      f"line {i}: {tok!r} will be read letter by letter")

        if any(d in text for d in EM_DASHES):
            _fail(out, "script_no_em_dash",
                  f"line {i}: em dash in VO text; use '...' or a full stop")

        if re.search(r"\d", text):
            _fail(out, "script_numbers_as_words",
                  f"line {i}: digits in VO text; spell them "
                  f"('nine at night', not '9pm')")

    return out


def gate_captions_text(script: dict, cfg: dict) -> list[str]:
    out: list[str] = []
    cap_max = int(cfg["captions"].get("max_words_per_cue", 5))
    for ln in script.get("lines", []):
        cap = ln.get("caption")
        if cap is None:
            continue
        if any(d in cap for d in EM_DASHES):
            _fail(out, "caption_no_em_dash", f"line {ln.get('n')}: em dash")
        if len(cap.split()) > cap_max:
            _fail(out, "caption_word_cap",
                  f"line {ln.get('n')}: caption {len(cap.split())} words "
                  f"> {cap_max}")
    return out


def load_arcs(path: pathlib.Path | None = None) -> dict:
    return json.loads((path or ARCS_JSON).read_text(encoding="utf-8"))


def _norm_arc(s: str) -> str:
    return re.sub(r"[^a-z0-9]+", "_", str(s).strip().lower()).strip("_")


def _is_spec_line(text: str, brand: str) -> bool:
    """A line that states what the product does, with nobody asking.

    Two measurable shapes, both lifted off the shipped demo's own failure:
      * a present-tense third-person product predicate ("It picks the meals",
        "The app counts the reps", "Fernwick builds the list"), or
      * a bare enumeration of four or more items in one line ("coaches,
        pilates, yoga, a timer, a rep counter").
    A line containing a question mark is never a spec line: in the references a
    spec is allowed, it just has to be an ANSWER.
    """
    if "?" in text:
        return False
    subj = r"(?:it|the app|the tool|this app|this thing"
    if brand:
        subj += r"|" + re.escape(brand)
    subj += r")"
    if re.search(rf"\b{subj}\s+(?:also\s+|just\s+|even\s+)?[a-z]+s\b", text, re.I):
        return True
    if text.count(",") >= 3:
        return True
    return False


def gate_script_direction(script: dict, cfg: dict,
                          arcs: dict | None = None) -> list[str]:
    """Refuse the script the recipe's silence used to produce.

    The recipe deliberately carries no narrative (gate_recipe_carries_no_narrative
    proves it), and that is correct. The defect was the other half: nothing was
    put in its place, so every run defaulted to comedy with a doubter. This gate
    is the other half. It supplies no story either; it requires the author to
    pick one of the eight REAL arcs in scripts/arcs.json and it refuses three
    named shapes that appear in none of the nine measured references.
    """
    out: list[str] = []
    arcs = arcs if arcs is not None else load_arcs()
    ids = [a["id"] for a in arcs["arcs"]]

    # 1. an arc must be declared, and it must be one of the eight real ones
    declared = script.get("arc")
    if not declared or _norm_arc(declared) not in ids:
        _fail(out, "script_arc_declared",
              f"script.arc is {declared!r}; pick ONE id from scripts/arcs.json "
              f"({', '.join(ids)}). The recipe supplies no arc on purpose, but "
              f"a script that declares none defaults to comedy with a doubter")

    lines = script.get("lines", []) or []
    brand = str(cfg.get("brand_name", "") or "")

    # 2. not the doubter-and-convert shape, in the arc label or in the dialogue
    hay = [("arc", str(declared or ""))] + \
          [(f"line {ln.get('n')}", str(ln.get("text", ""))) for ln in lines]
    for where, text in hay:
        for pat in DOUBTER_PATTERNS:
            m = re.search(pat, text, re.I)
            if m:
                _fail(out, "script_no_doubter_arc",
                      f"{where}: {m.group(0)!r} is the doubter-and-convert "
                      f"shape, which appears in NONE of the nine references "
                      f"(references/REFERENCES.md, 'Arc'). Pick a real arc "
                      f"from scripts/arcs.json")
                break

    # 3. the opening line must not announce the format
    if lines:
        first = min(lines, key=lambda l: l.get("n", 0))
        ftext = str(first.get("text", ""))
        for pat in FORMAT_ANNOUNCE_PATTERNS:
            m = re.search(pat, ftext, re.I)
            if m:
                _fail(out, "script_no_format_announcement",
                      f"opening line {first.get('n')} says {m.group(0)!r}, "
                      f"which tells the viewer it is an ad before anything has "
                      f"happened. No reference announces what it is; brand the "
                      f"FRAME instead (edit.frame_brand)")
                break

    # 4. no feature list: a spec has to be an answer to a question
    ordered = sorted(lines, key=lambda l: l.get("n", 0))
    run: list[dict] = []
    for i, ln in enumerate(ordered):
        text = str(ln.get("text", ""))
        prev_q = "?" in str(ordered[i - 1].get("text", "")) if i else False
        if text.count(",") >= 3 and not prev_q:
            _fail(out, "script_feature_list",
                  f"line {ln.get('n')} enumerates "
                  f"{text.count(',') + 1} features in one line with nobody "
                  f"asking; no reference reads a feature list")
        if _is_spec_line(text, brand):
            if not run and prev_q:
                continue          # the run is answering a question: allowed
            run.append(ln)
        else:
            run = []
        if len(run) >= 3:
            ns = ", ".join(str(r.get("n")) for r in run)
            _fail(out, "script_feature_list",
                  f"lines {ns} are {len(run)} consecutive product-spec lines "
                  f"with no question asked; in the references every spec is an "
                  f"ANSWER (wf-telly), never a list")
            run = []
    return out


# --------------------------------------------------------------- config gates
def gate_audio_matches_plan(run: pathlib.Path, beats: dict) -> list[str]:
    """Every beat's mp3 must be saying that beat's line.

    The voiceover is generated against whatever `beats.json` is on disk at the
    time. Edit the script afterwards in a way that changes the SPLIT, and the
    plan renumbers while the audio does not: Coppice lost an ellipsis, line 7
    stopped splitting in two, and beats 7 to 15 all shifted by one. Fourteen
    correct mp3s, a correct plan, and eight of them on the wrong face.

    Nothing else catches it. Every count matches, every file exists, every
    duration is real. It only shows up as the wrong voice saying the wrong
    line, after the lipsync is paid for.

    ElevenLabs returns the character alignment next to each mp3, so the words
    actually spoken are on disk and free to check.
    """
    out: list[str] = []
    missing = 0
    for b in beats["beats"]:
        ts = run / "voiceovers" / f"beat-{b['n']:02d}.mp3.timestamps.json"
        if not ts.exists():
            missing += 1
            continue
        try:
            j = json.loads(ts.read_text(encoding="utf-8"))
        except (ValueError, OSError):
            _fail(out, "audio_matches_plan",
                  f"beat {b['n']}: alignment file is unreadable")
            continue
        said = "".join(j.get("characters") or []).strip()
        if said and said != b["text"].strip():
            _fail(out, "audio_matches_plan",
                  f"beat {b['n']} says {said[:44]!r} but the plan says "
                  f"{b['text'][:44]!r}. The script changed after the voiceover was generated. Re-plan, then re-generate.")
    n = len(beats["beats"])
    if missing == n:
        return out            # no voiceover yet; nothing to check
    if missing:
        _fail(out, "audio_matches_plan",
              f"{missing} of {n} beats have no alignment file next to their "
              f"mp3, so what they say cannot be checked")
    extra = sorted(p.name for p in (run / "voiceovers").glob("beat-*.mp3")
                   if int(p.stem.split("-")[1]) > n)
    if extra:
        _fail(out, "audio_matches_plan",
              f"{len(extra)} mp3(s) past the end of a {n}-beat plan "
              f"({extra[0]} ..). The plan shrank after generation.")
    return out

def gate_script_hold(script: dict) -> list[str]:
    """A held line continues the PREVIOUS line's shot, so the host must match.

    `hold` exists so two consecutive lines by one person share a single shot
    instead of being cut between, which is the difference between cutting on
    the speaker and cutting on every beat. Across a speaker change there is
    nothing to hold, and the first line of a script has nothing before it.

    plan_beats refuses both too, but it refuses at plan time, after the
    script has been written and possibly after a voiceover has been paid for
    against the old beat numbering. This refuses while it is still free.
    """
    out: list[str] = []
    prev = None
    for ln in script.get("lines", []):
        if ln.get("hold"):
            if prev is None:
                _fail(out, "script_hold",
                      f"line {ln.get('n')} is the first line and is marked "
                      f"hold; there is no shot before it to hold")
            elif prev.get("who") != ln.get("who"):
                _fail(out, "script_hold",
                      f"line {ln.get('n')} is marked hold but follows host "
                      f"{prev.get('who')}, not {ln.get('who')}. A hold "
                      f"continues one person's shot.")
        prev = ln
    return out


def gate_config_shape(cfg: dict) -> list[str]:
    """Refuse a config that other gates cannot safely walk.

    This one runs FIRST and stops the run on failure, because the gates that
    follow index into hosts without checking. A free-text note parked inside
    `hosts` as a sibling of A and B produced
    AttributeError: 'str' object has no attribute 'get' from eight different
    scripts, which reads as the engine being broken rather than the config
    being wrong. Notes belong at the TOP level, where nothing iterates.
    """
    out: list[str] = []
    hosts = cfg.get("hosts")
    if not isinstance(hosts, dict) or not hosts:
        _fail(out, "shape_hosts_block",
              f"`hosts` is {type(hosts).__name__}, not a non-empty object")
        return out
    bad = sorted(k for k, v in hosts.items() if not isinstance(v, dict))
    if bad:
        _fail(out, "shape_hosts_are_hosts",
              f"hosts.{'/'.join(bad)}: not a host object. Notes and comments "
              f"go at the top level of the config, never inside a collection "
              f"something iterates over.")
    return out


def gate_cast(cfg: dict) -> list[str]:
    out: list[str] = []
    hosts = cfg.get("hosts", {})
    if len(hosts) != 2:
        _fail(out, "cast_two_hosts", f"{len(hosts)} hosts declared, need 2")
    ids = [h.get("voice_id") for h in hosts.values()]
    if len(set(ids)) != len(ids):
        _fail(out, "cast_distinct_voices",
              f"both hosts share voice_id {ids[0]!r}")
    for k, h in hosts.items():
        if not h.get("voice_id") or str(h["voice_id"]).startswith("<"):
            _fail(out, "cast_voice_id_bound",
                  f"host {k}: voice_id is unbound ({h.get('voice_id')!r})")
    return out


def gate_stills_resolve(cfg: dict, script: dict) -> list[str]:
    """Every still a line points at must be a declared base or variant, and
    must belong to the host who speaks that line."""
    out: list[str] = []
    ch = cfg["characters"]
    owner = {b["file"]: b["who"] for b in ch["bases"]}
    for v in ch["expression_variants"]:
        owner[v["out_name"]] = v["who"]
    for ln in script.get("lines", []):
        st = ln.get("still")
        if st is None:
            continue
        if st not in owner:
            _fail(out, "still_resolves",
                  f"line {ln.get('n')}: still {st!r} is not declared")
        elif owner[st] != ln.get("who"):
            _fail(out, "still_belongs_to_speaker",
                  f"line {ln.get('n')}: still {st!r} belongs to "
                  f"{owner[st]}, line is {ln.get('who')}")
    return out


def gate_still_pool_depth(cfg: dict) -> list[str]:
    """Multicut cuts the picture inside a beat, so each host needs at least two
    DISTINCT PICTURES to cut between, or the plan repeats a frame and reads as
    a freeze.

    It used to count source files. That is the wrong unit now: edit.framing
    reframes each cut at compose time, and the recipe already treats a reframe
    as a different picture, which is how plan_cuts counts framing variety and
    how the measured band in references/REFERENCES.md is derived. A run built
    from one locked plate per host, with singles cropped out of it for free,
    has one FILE per host and as many pictures as there are framings.

    So the count is files x framings, and the gate still fails for a host with
    one file when framing is off or carries fewer than two sizes, which is the
    case the original check was written for.
    """
    out: list[str] = []
    if not cfg.get("edit", {}).get("multicut", {}).get("enabled"):
        return out
    ch = cfg["characters"]
    per = {b["who"]: 0 for b in ch["bases"]}
    for b in ch["bases"]:
        per[b["who"]] = per.get(b["who"], 0) + 1
    for v in ch.get("expression_variants", []):
        per[v["who"]] = per.get(v["who"], 0) + 1

    fr = cfg.get("edit", {}).get("framing") or {}
    sizes = len(fr.get("sizes") or [])
    for who, n in sorted(per.items()):
        pictures = n * max(sizes, 1)
        if pictures < 2:
            _fail(out, "still_pool_depth",
                  f"host {who}: {n} still(s) x {sizes or 'no'} framing(s) = "
                  f"{pictures} distinct picture(s); multicut needs >= 2. Add a "
                  f"second still for this host, or give edit.framing at least "
                  f"two sizes so a cut has somewhere to go.")
    return out


def gate_no_real_brand(cfg: dict) -> list[str]:
    """An example config must never name a real client."""
    out: list[str] = []
    blob = json.dumps(cfg, ensure_ascii=False).lower()
    for tok in REAL_BRAND_TOKENS:
        if tok in blob:
            _fail(out, "no_real_brand",
                  f"real client token {tok!r} appears in the config")
    return out


def gate_no_unbound_placeholders(cfg: dict) -> list[str]:
    out: list[str] = []
    for m in set(re.findall(r"<[a-z0-9_\-]+>", json.dumps(cfg))):
        _fail(out, "no_unbound_placeholders", f"{m} was never bound")
    return out


def gate_recipe_carries_no_narrative(recipe_text: str) -> list[str]:
    """A recipe is implementation detail. The arc is the operator's."""
    out: list[str] = []
    low = recipe_text.lower()
    for w in NARRATIVE_WORDS:
        if w in low:
            _fail(out, "recipe_no_narrative",
                  f"narrative word {w!r} is baked into the recipe")
    return out


def gate_recipe_has_no_script_fixture(recipe: dict) -> list[str]:
    """The script must be a parameter, not a fixture shipped in the recipe."""
    out: list[str] = []
    cfg = recipe.get("config", {})
    for key in ("scenes", "lines", "script"):
        v = cfg.get(key)
        if isinstance(v, list) and v:
            _fail(out, "recipe_no_script_fixture",
                  f"recipe.config.{key} ships {len(v)} fixed lines; the "
                  f"script must come from the run's script.json")
    return out


# ------------------------------------------------------------- cut plan gates
def plain_mode(cfg: dict) -> bool:
    """True when the dynamic layer is switched off in the config.

    The multicut, the split screen and the framing dimension are one feature
    set, and five gates measure how dynamic the result is: max cut length, no
    repeated still on adjacent cuts, no repeated framing on adjacent cuts,
    framings per 10s, and biggest-framing share. With multicut and split both
    disabled the piece is one full-frame picture per beat on purpose, and all
    five report failures for doing exactly what was asked.

    They are skipped in that mode rather than loosened, so they keep their
    numbers and keep biting the moment the dynamic layer is switched back on.
    The runner prints which gates were skipped and why, so a plain cut is a
    visible decision and not a quiet pass.
    """
    e = cfg.get("edit", {})
    return not (e.get("multicut", {}).get("enabled")
                or e.get("split_screen", {}).get("enabled"))


def gate_cutplan(plan: dict, beats: dict, cfg: dict) -> list[str]:
    out: list[str] = []
    cuts = plan.get("cuts", [])
    if not cuts:
        _fail(out, "cutplan_nonempty", "no cuts planned")
        return out

    dur = {b["n"]: b["dur_sec"] for b in beats["beats"]}
    hosts = set(cfg["hosts"].keys())

    # 1. the picture edit must cover the audio exactly, beat by beat
    per_beat: dict[int, float] = {}
    for c in cuts:
        per_beat[c["beat"]] = per_beat.get(c["beat"], 0.0) + (c["end"] - c["start"])
    for n, want in dur.items():
        got = per_beat.get(n, 0.0)
        if abs(got - want) > 0.012:
            _fail(out, "cutplan_covers_vo",
                  f"beat {n}: picture covers {got:.3f}s of {want:.3f}s of VO")

    # 2. cuts inside a beat must tile it with no gap and no overlap
    for n in dur:
        bc = sorted((c for c in cuts if c["beat"] == n), key=lambda c: c["start"])
        for a, b in zip(bc, bc[1:]):
            if abs(a["end"] - b["start"]) > 1e-6:
                _fail(out, "cutplan_tiles_beat",
                      f"beat {n}: gap/overlap at {a['end']:.3f} -> "
                      f"{b['start']:.3f}")

    # 3. no cut shorter than the floor (reads as a flicker, not a cut)
    floor = float(cfg["edit"]["multicut"].get("min_cut_sec", 0.5))
    for c in cuts:
        if (c["end"] - c["start"]) < floor - 1e-6:
            _fail(out, "cutplan_min_cut",
                  f"beat {c['beat']} cut {c['idx']}: "
                  f"{c['end'] - c['start']:.3f}s < {floor}s floor")

    # 4. a split-screen cut must actually show two DIFFERENT hosts -- unless its
    #    lower panel deliberately carries something else (a product still), in
    #    which case it must not be claiming a host down there either
    for c in cuts:
        if c["mode"] != "split":
            continue
        if c.get("listener") == c.get("speaker"):
            _fail(out, "split_two_distinct_hosts",
                  f"beat {c['beat']}: split-screen shows {c['speaker']} twice")
        elif c.get("bottom", "listener") == "listener":
            if c.get("listener") not in hosts:
                _fail(out, "split_two_distinct_hosts",
                      f"beat {c['beat']}: listener {c.get('listener')!r} is "
                      f"not a host")
        elif c.get("listener") is not None:
            _fail(out, "split_two_distinct_hosts",
                  f"beat {c['beat']}: lower panel is {c['bottom']!r} but the "
                  f"cut still names listener {c['listener']!r}")

    # 5. a cut that shows the speaker must be lipsynced; a cut that does not
    #    show the speaker full-frame must not claim to be
    for c in cuts:
        if c["mode"] == "single" and c["source"] != "clip":
            _fail(out, "speaker_cut_is_lipsynced",
                  f"beat {c['beat']} cut {c['idx']}: a full-frame speaking cut "
                  f"uses source {c['source']!r}, so the mouth would not track")
        if c["mode"] == "reaction" and c.get("show") == c.get("speaker"):
            _fail(out, "reaction_cut_shows_listener",
                  f"beat {c['beat']} cut {c['idx']}: reaction cut shows the "
                  f"speaker, not the listener")

    # 6 and 7 measure the DYNAMIC edit: a ceiling on how long one shot
    # may run, and a ban on the same plate at the same framing twice in
    # a row. Both are meaningless with the dynamic layer switched off,
    # where one full-frame picture per beat is the whole point. Checks 1
    # to 5 above, which are correctness and not style, always run.
    if plain_mode(cfg):
        return out

    # 6. the edit must not sit on one shot for the whole piece
    max_run = float(cfg["edit"]["multicut"].get("max_cut_sec", 2.0))
    for c in cuts:
        if (c["end"] - c["start"]) > max_run + 1e-6:
            _fail(out, "cutplan_max_cut",
                  f"beat {c['beat']} cut {c['idx']}: "
                  f"{c['end'] - c['start']:.3f}s > {max_run}s ceiling")

    # 7. variety: the same still must not run two cuts back to back AT THE SAME
    #    FRAMING. The same plate at a different crop is not a freeze, it is
    #    reference technique 13 (reframe the same person between consecutive
    #    cuts, wf-apple 39s to 52s), so the framing has to be part of the test
    #    or this gate forbids the fix for the gap it was written to catch.
    for a, b in zip(cuts, cuts[1:]):
        if a.get("still") and a.get("still") == b.get("still") \
                and a["mode"] == b["mode"] == "single" \
                and a.get("framing") == b.get("framing"):
            _fail(out, "cutplan_no_repeat_still",
                  f"cuts {a['beat']}.{a['idx']} and {b['beat']}.{b['idx']} "
                  f"both hold {a['still']!r} at framing {a.get('framing')!r}; "
                  f"that reads as a freeze, not a cut")
    return out


# --------------------------------------------------------- framing variety gate
def gate_split_balance(plan: dict, cfg: dict) -> list[str]:
    """Both hosts must get the split, not just one of them.

    Speakers alternate A/B/A/B and the planner alternates split/single to avoid
    repeating a pattern. Two alternations in lockstep PHASE-LOCK: one brand came
    out 7 of 7 splits on host A and 7 of 7 singles on host B, so B sat in the
    lower panel for the whole episode and was never once the speaker in a
    split. A viewer described it as "the listener is listening in the same way
    throughout", which is the symptom, not the cause.

    Nothing else catches it. Every count matches, every clip is correct, the
    drift is zero and the framings are varied. It is only visible if you ask
    WHO is on top.

    plan_cuts.py balances these now; this gate is here so the balance cannot
    silently regress. The ceiling is 75%: with an odd number of splits a 4/3
    split is 57% and fine, while 7/0 and 6/1 are not.
    """
    out: list[str] = []
    ss = cfg.get("edit", {}).get("split_screen", {})
    if not ss.get("enabled"):
        return out
    splits = [c for c in plan.get("cuts", []) if c.get("mode") == "split"]
    if len(splits) < 4:
        return out        # too few to call it a pattern rather than chance
    by_host: dict[str, int] = {}
    for c in splits:
        who = c.get("show") or c.get("speaker")
        if who:
            by_host[who] = by_host.get(who, 0) + 1
    if len(by_host) < 2:
        _fail(out, "split_balance",
              f"all {len(splits)} split cuts put the same host on top "
              f"({list(by_host) or 'none'}); the other host is never the "
              f"speaker in a split and sits in the lower panel all episode")
        return out
    top, n = max(by_host.items(), key=lambda kv: kv[1])
    share = n / len(splits)
    if share > 0.75 + 1e-9:
        _fail(out, "split_balance",
              f"host {top} speaks in {n} of {len(splits)} split cuts "
              f"({share*100:.0f}%), over the 75% ceiling. Speaker alternation "
              f"and split alternation phase-lock; plan_cuts balances them, so "
              f"this is a regression.")
    return out


def gate_framing_variety(plan: dict, cfg: dict) -> list[str]:
    """The one axis this format measured OUT of band, gated from the plan.

    references/REFERENCES.md measures six real published podcast clips on three
    shows: 14 to 30 distinct framings each, 2.94 to 7.06 per 10 seconds, and no
    single framing taking more than 17% of the shots. The shipped demo measured
    2 framings, 0.41 per 10s, with one framing on 50% of its shots, and that was
    the ONLY axis out of band -- median shot, cuts per second, duration, detail,
    LUFS and true peak were all already inside the reference spread.

    This runs on `cutplan.json`, so it fails before a single frame is rendered
    and before any paid call. It is a plan check by design: the render check is
    `bench_podcast.py` on the finished file, which needs footage.

    Runtime denominator is dialogue + end card, i.e. the whole deliverable,
    which is what the reference bench measured over. The end card is not counted
    as a framing, so the ratio this gate computes is the conservative one.
    """
    if plain_mode(cfg):
        return []   # see plain_mode: this gate measures a dynamic edit
    out: list[str] = []
    cuts = plan.get("cuts", [])
    if not cuts:
        _fail(out, "framing_declared", "no cuts planned")
        return out


    bands = cfg.get("edit", {}).get("framing", {}).get("bands", {})
    lo = float(bands.get("per_10s_min", 2.9))
    hi = float(bands.get("per_10s_max", 7.1))
    cap = float(bands.get("max_share", 0.17))
    # The REAL band over all nine references is wider at both ends, and the
    # enforced band is deliberately the tighter one. Recorded here so nobody
    # "fixes" a failure by loosening the gate to the real numbers without
    # reading why.
    rlo = float(bands.get("real_per_10s_min", 1.9))
    rcap = float(bands.get("real_max_share", 0.35))
    why = (f"The real band over nine references is {rlo} to {hi} per 10s with "
           f"a {rcap * 100:.0f}% ceiling. This gate is deliberately tighter "
           f"({lo} to {hi}, {cap * 100:.0f}%) because the wider band is held "
           f"open by ONE technique: nh-mama's persistent three-panel stack "
           f"with every host live on screen, which scores 1.95 and 35% by "
           f"never needing to cut. This recipe cannot build that layout yet, "
           f"so the wider band would admit a pass we cannot produce. Loosen "
           f"this gate only together with the layout, not instead of it.")

    naked = [f"{c['beat']}.{c['idx']}" for c in cuts if not c.get("framing")]
    if naked:
        _fail(out, "framing_declared",
              f"{len(naked)} of {len(cuts)} cuts carry no framing "
              f"({', '.join(naked[:5])}); a segment kind without a framing is "
              f"how two pictures came out of four kinds")
        return out

    # a crop that leaves the plate renders as a black edge or an ffmpeg error
    for c in cuts:
        cr = c.get("crop") or {}
        x, y, w, h = (float(cr.get(k, -1)) for k in ("x", "y", "w", "h"))
        if not (0.0 <= x and 0.0 <= y and 0.0 < w <= 1.0 and 0.0 < h <= 1.0
                and x + w <= 1.0 + 1e-9 and y + h <= 1.0 + 1e-9):
            _fail(out, "framing_crop_in_frame",
                  f"cut {c['beat']}.{c['idx']} framing {c['framing']!r} crops "
                  f"x={x} y={y} w={w} h={h}, which leaves the source plate")

    total = float(plan.get("dialogue_sec", 0.0)) + \
        float(plan.get("end_card_sec", 0.0))
    if total <= 0:
        _fail(out, "framing_declared", "plan declares no runtime to measure over")
        return out

    use: dict[str, int] = {}
    for c in cuts:
        use[c["framing"]] = use.get(c["framing"], 0) + 1

    per10 = len(use) / total * 10.0
    if per10 < lo - 1e-9 or per10 > hi + 1e-9:
        _fail(out, "framing_variety_per_10s",
              f"{len(use)} distinct framings over {total:.2f}s is "
              f"{per10:.2f} per 10s, outside the enforced band {lo} to {hi}. "
              + why)

    big, bign = max(use.items(), key=lambda kv: (kv[1], kv[0]))
    share = bign / len(cuts)
    if share > cap + 1e-9:
        _fail(out, "framing_biggest_share",
              f"framing {big!r} takes {bign} of {len(cuts)} cuts "
              f"({share * 100:.1f}%), over the enforced ceiling of "
              f"{cap * 100:.0f}%. " + why)

    for a, b in zip(cuts, cuts[1:]):
        if a.get("framing") == b.get("framing"):
            _fail(out, "framing_no_repeat_adjacent",
                  f"cuts {a['beat']}.{a['idx']} and {b['beat']}.{b['idx']} both "
                  f"use framing {a['framing']!r}; consecutive cuts must reframe")
    return out


MALE_WORDS = ("a man", "man in his", " his ", " he ", " him ")
FEMALE_WORDS = ("a woman", "woman in her", " her ", " she ")


def gate_grade_keeps_colour(cfg: dict, probe: pathlib.Path = None) -> list[str]:
    """A grade chain must not silently strip chroma.

    Written after a grade built with maskedmerge and a gray-format mask came
    back fully greyscale and was RECOMMENDED, because the scorer measuring it
    only read the luma plane. A three-channel claim was being judged on one
    channel's worth of data. The chain is run here against a synthetic colour
    bar and the chroma of the result is compared with the chroma of the input.

    Costs one ffmpeg call on a 64x64 source and runs in the free preview.
    """
    out: list[str] = []
    g = (cfg.get("edit", {}).get("grade") or {})
    if not g.get("enabled") or not g.get("chain"):
        return out

    def chroma(args):
        r = subprocess.run(args, capture_output=True)
        if r.returncode != 0 or len(r.stdout) < 64 * 64 * 3 // 2:
            return None
        buf = r.stdout
        n = 64 * 64
        cs = (64 // 2) * (64 // 2)
        U = buf[n:n + cs]
        V = buf[n + cs:n + 2 * cs]
        if not U or not V:
            return None
        return sum(abs(u - 128) + abs(v - 128) for u, v in zip(U, V)) / len(U)

    src = "testsrc2=s=64x64:d=1"
    before = chroma(["ffmpeg", "-v", "error", "-f", "lavfi", "-i", src,
                     "-frames:v", "1", "-vf", "format=yuv420p",
                     "-f", "rawvideo", "-"])
    after = chroma(["ffmpeg", "-v", "error", "-f", "lavfi", "-i", src,
                    "-frames:v", "1", "-vf", f"{g['chain']},format=yuv420p",
                    "-f", "rawvideo", "-"])
    if before is None:
        return out                      # cannot measure; the missing-asset gates still bite
    if after is None:
        _fail(out, "grade_colour",
              f"edit.grade.chain does not run: ffmpeg rejected "
              f"{g['chain'][:70]!r}")
        return out
    if after < before * 0.5:
        _fail(out, "grade_colour",
              f"edit.grade.chain cuts chroma from {before:.1f} to {after:.1f}, "
              f"more than half. A chain that greys the picture passes any "
              f"luma-only check, which is exactly how a greyscale grade got "
              f"recommended once. Common cause: maskedmerge with a "
              f"format=gray mask, which forces the whole chain to gray.")
    return out


def gate_captions_no_overlap(overlays: dict, cfg: dict) -> list[str]:
    """No two caption cues may be on screen at the same time.

    compose_master draws every cue with its own between(t,w0,w1) overlay, so
    two cues whose windows overlap are BOTH drawn and the text doubles up on
    the frame. captions.min_dur_sec was pushing a cue's end past the next
    cue's start: fifteen of twenty-eight pairs overlapped by up to 0.37s in a
    shipped render, and it reads as the captions being corrupted rather than
    as a timing bug, which is why it survived a watch.
    """
    out: list[str] = []
    cues = overlays.get("cues") or []
    if len(cues) < 2:
        return out
    cues = sorted(cues, key=lambda c: c["w0"])
    for a, b in zip(cues, cues[1:]):
        if b["w0"] < a["w1"] - 1e-9:
            _fail(out, "captions_overlap",
                  f"{a['text'][:28]!r} runs to {a['w1']:.3f}s but "
                  f"{b['text'][:28]!r} starts at {b['w0']:.3f}s, so both are "
                  f"drawn for {a['w1'] - b['w0']:.3f}s and the text doubles up")
    return out


def gate_one_config(scripts_dir: pathlib.Path) -> list[str]:
    """scripts/ must hold exactly one config file.

    This recipe briefly carried three. They differed in 23 of 143 keys across
    four unrelated concerns, nothing recorded which was authoritative for
    which key, and every fix landed in one and silently missed the others: a
    480p engine and a stale voice list both outlived their fixes that way.
    Variants are presets inside the one file now, which config_io.py applies
    and validates. This gate is what stops the second file reappearing.
    """
    out: list[str] = []
    found = sorted(p.name for p in scripts_dir.glob("config*.json"))
    if len(found) > 1:
        _fail(out, "one_config",
              f"scripts/ holds {len(found)} config files ({', '.join(found)}). "
              f"Variants belong in the `presets` block of a single config, "
              f"applied with --preset, not in a second file that drifts.")
    return out


def gate_singles_are_two_people(cfg: dict, run_dir: pathlib.Path) -> list[str]:
    """The two singles cropped from the plate must not be the same picture.

    The plate prompt asks for two distinct people and negates twins, but
    nothing verified it, and nothing verified the two crop centres point at
    different hosts either. Both failures look identical downstream: you pay
    for seventeen lipsync clips of one person having a conversation with
    himself.

    Separation measured on the demo plate: two real people 50.3, the same
    crop twice 0.0, the same person reframed 28.7. The threshold is set LOW,
    at 12, so it fires only on the unambiguous case. The reframed-same-person
    case sits in the middle and is NOT claimed: two hosts in one room share a
    light and a wall, so a tighter threshold would start failing real pairs.
    The measured distance is printed either way, so the middle ground is a
    judgement a person makes with a number in front of them.
    """
    out: list[str] = []
    ch = cfg["characters"]
    files = [run_dir / "stills" / b["file"] for b in ch["bases"]]
    files = [f for f in files if f.exists()]
    if len(files) < 2:
        return out                      # stills_resolve owns the missing case

    def sig(path, w=48):
        r = subprocess.run(["ffmpeg", "-v", "error", "-i", str(path), "-vf",
                            f"scale={w}:{w},format=gray", "-f", "rawvideo", "-"],
                           capture_output=True)
        return list(r.stdout[:w * w])

    a, b = sig(files[0]), sig(files[1])
    if len(a) != len(b) or not a:
        return out
    d = sum(abs(x - y) for x, y in zip(a, b)) / len(a)
    print(f"  [singles] {files[0].name} vs {files[1].name}: distance {d:.1f} "
          f"(two real people measured 50.3; identical is 0.0)")
    if d < 12.0:
        _fail(out, "singles_two_people",
              f"{files[0].name} and {files[1].name} are nearly the same picture "
              f"(distance {d:.1f}). Either the plate came back as twins or both "
              f"crop centres point at the same host. Do not pay for lipsync.")
    return out


def gate_script_matches_brand(script: dict, cfg: dict) -> list[str]:
    """The script must be about the brand the config is for.

    A config for one company and a script for another passed all eighteen
    gates: a bike-maintenance subscription shipping a podcast that said a meal
    planner's name out loud, four times. Every gate was checking the script
    against ITSELF, or the config against itself, and nothing checked the two
    agreed. It is the cheapest possible mistake to make when a new brand is
    started by copying the last one, which is exactly what HOW_TO tells you to
    do.
    """
    out: list[str] = []
    cfg_brand = str(cfg.get("brand_name", "")).strip()
    sc_brand = str(script.get("brand", "")).strip()
    if not cfg_brand:
        _fail(out, "script_brand_match", "config has no brand_name")
        return out
    if not sc_brand:
        _fail(out, "script_brand_match",
              f"script declares no brand; the config is for {cfg_brand!r}")
    elif sc_brand.casefold() != cfg_brand.casefold():
        _fail(out, "script_brand_match",
              f"the script is for {sc_brand!r} and the config is for "
              f"{cfg_brand!r}. One of them was copied from another brand.")

    spoken = " ".join(str(l.get("text", "")) for l in script.get("lines", []))
    low = spoken.casefold()
    if sc_brand and sc_brand.casefold() != cfg_brand.casefold()             and sc_brand.casefold() in low:
        _fail(out, "script_brand_match",
              f"a spoken line says {sc_brand!r}, which is not this config's "
              f"brand. The audience would hear another company's name.")
    return out


def gate_host_voice_gender(cfg: dict) -> list[str]:
    """Every host's voice_gender must agree with the person in appearance.

    The first real render of the demo gave the host written as a man the voice
    "Brittney" and the host written as a woman the voice "Brad", and nothing
    objected, because until appearance existed the config related a voice to a
    NAME and a stance and never to a body. Thirty seconds of finished video
    came back with both voices on the wrong person.

    This is a config-side lint on purpose. It needs no network call, so it runs
    in the free preview, before a single character is sent to a TTS endpoint.
    """
    out: list[str] = []
    for who, h in (cfg.get("hosts") or {}).items():
        app = (h.get("appearance") or "").lower()
        vg = (h.get("voice_gender") or "").strip().lower()
        name = h.get("name", who)
        if not app:
            continue  # gen_paid refuses on this separately, before any spend
        if not vg:
            _fail(out, "host_voice_gender",
                  f"host {who} ({name}) has an appearance but no "
                  f"voice_gender. Record the gender of the voice you picked "
                  f"next to its id so a mismatch is visible in the file.")
            continue
        if vg not in ("male", "female", "neutral"):
            _fail(out, "host_voice_gender",
                  f"host {who} ({name}) voice_gender is {vg!r}; expected "
                  f"male, female or neutral, as ElevenLabs labels them")
            continue
        if vg == "neutral":
            continue
        reads_male = any(w in app for w in MALE_WORDS)
        reads_female = any(w in app for w in FEMALE_WORDS)
        if reads_male and reads_female:
            _fail(out, "host_voice_gender",
                  f"host {who} ({name}) appearance reads as both; rewrite it "
                  f"so the person is unambiguous, then this check can hold")
        elif reads_male and vg != "male":
            _fail(out, "host_voice_gender",
                  f"host {who} ({name}) is written as a man and the voice "
                  f"{h.get('voice_name') or h.get('voice_id')} is {vg}")
        elif reads_female and vg != "female":
            _fail(out, "host_voice_gender",
                  f"host {who} ({name}) is written as a woman and the voice "
                  f"{h.get('voice_name') or h.get('voice_id')} is {vg}")
    return out


NARRATOR_ARCS = ("story_with_corroborators", "narrated_case_file",
                 "read_and_react")


def gate_script_turn_structure(script: dict) -> list[str]:
    """A narrator arc must be WRITTEN as one, not just declared as one.

    The demo declared story_with_corroborators, whose engine is "one host
    tells a true story, the others interject", and then wrote strict
    A/B/A/B for fourteen lines with a fifty-fifty word split. Perfect
    alternation at equal length is setup-and-payoff, which is the rhythm of
    the doubter-and-convert shape the recipe already refuses by name. A
    viewer called the finished render "still the skeptic and believer one"
    and was right about the shape while every existing gate passed, because
    the gates read the declared arc and the forbidden words and never the
    turn-taking.

    Two measurements, both on the script, both free:
      * the narrator must hold the floor somewhere, so at least one run of
        two or more consecutive lines;
      * the split must not be even, so the narrator carries at least 60% of
        the words.
    """
    out: list[str] = []
    arc = (script.get("arc") or "").strip()
    lines = script.get("lines") or []
    if arc not in NARRATOR_ARCS or len(lines) < 4:
        return out

    whos = [ln.get("who") for ln in lines]
    longest = best = 1
    for a, b in zip(whos, whos[1:]):
        longest = longest + 1 if a == b else 1
        best = max(best, longest)
    if best < 2:
        _fail(out, "script_turn_structure",
              f"arc {arc!r} is a narrator arc but the script alternates every "
              f"single line, {len(lines)} of {len(lines)}. Nobody holds the "
              f"floor, so it reads as setup and payoff. Give the narrator a "
              f"run of two or three lines.")

    words: dict = {}
    for ln in lines:
        words[ln.get("who")] = words.get(ln.get("who"), 0) + len(
            str(ln.get("text", "")).split())
    total = sum(words.values()) or 1
    share = max(words.values()) / total
    if share < 0.60:
        top = max(words, key=words.get)
        _fail(out, "script_turn_structure",
              f"arc {arc!r} is a narrator arc but the words are split "
              f"{share:.0%} / {1 - share:.0%}. The narrator ({top}) should "
              f"carry at least 60%. An even split is a two-hander, not "
              f"somebody telling a story while the other interjects.")
    return out


def gate_split_bottom_assets(plan: dict, cfg: dict,
                             run_dir: pathlib.Path) -> list[str]:
    """A split whose lower panel carries a product still needs that still to
    exist. Checked on the plan so it fails before the paid steps, not inside
    the one ffmpeg call at the end of the run."""
    out: list[str] = []
    kinds = {c.get("bottom") for c in plan.get("cuts", [])
             if c.get("mode") == "split"}
    kinds.discard("listener")
    kinds.discard(None)
    if not kinds:
        return out
    rel = cfg.get("edit", {}).get("split_screen", {}).get("product_still")
    if not rel:
        _fail(out, "split_bottom_asset",
              f"the plan uses split bottom panel(s) {sorted(kinds)} but "
              f"edit.split_screen.product_still is not set")
        return out
    p = run_dir / rel
    if not p.exists():
        _fail(out, "split_bottom_asset",
              f"the plan puts a product still in {len(kinds)} split "
              f"bottom panel kind(s) but {p} is missing")
        return out
    flat = _flat_image(p)
    if flat is not None:
        _fail(out, "split_bottom_asset",
              f"{p} exists but is a flat colour (stddev {flat:.2f} over the "
              f"luma plane). A $0-preview placeholder passes an existence "
              f"check and renders as a dead rectangle over a third of the "
              f"frame. Supply a real product still or set "
              f"edit.split_screen.bottom_sources to ['listener'] only.")
    return out


def _flat_image(path: pathlib.Path, threshold: float = 2.0):
    """Luma stddev, or None when the image is not flat or cannot be measured.

    Why this exists: the Fernwick demo shipped a solid brown 1080x1920 PNG as
    its product still. It passed the existence check and put a dead rectangle
    on screen twice, each time over a third of the frame for about 1.5s, in a
    render that otherwise read as a real podcast. An existence check is not a
    picture check.

    Decoding failure returns None, which passes. That is deliberate and it is
    the one fail-open here: a gate that cannot read the file should not block
    a run over its own ffmpeg, and the missing-file case above already fails
    closed.
    """
    try:
        r = subprocess.run(
            ["ffmpeg", "-v", "error", "-i", str(path), "-vf",
             "scale=64:64,format=gray", "-f", "rawvideo", "-"],
            capture_output=True, timeout=60)
        if r.returncode != 0 or len(r.stdout) < 64 * 64:
            return None
    except (OSError, subprocess.SubprocessError):
        return None
    px = list(r.stdout[:64 * 64])
    mean = sum(px) / len(px)
    sd = (sum((v - mean) ** 2 for v in px) / len(px)) ** 0.5
    return sd if sd < threshold else None


def gate_plate_locked(cfg: dict, run_dir: pathlib.Path) -> list[str]:
    """A locked plate must still be the plate that was locked.

    The stills engine takes no seed. Four re-rolls of this format produced
    four different casts and four different rooms, and the approved cast only
    came back because the approved plate was handed to the next generation as
    a reference. So once a plate is approved it is the base, and anything that
    silently replaces it loses the people.

    `characters.plate_locked_sha256` is the approval. When it is set, the
    plate has to be on disk and has to hash to it. An operator who genuinely
    wants a new plate clears the field, which is a deliberate act and leaves
    a diff.
    """
    out: list[str] = []
    ch = cfg.get("characters") or {}
    want = ch.get("plate_locked_sha256")
    if not want:
        return out
    rel = ch.get("plate_file") or "plate.png"
    f = run_dir / "stills" / rel
    if not f.exists():
        _fail(out, "plate_locked",
              f"characters.plate_locked_sha256 is set but {f} is gone. The "
              f"locked plate is the cast; regenerating it does not bring "
              f"those people back.")
        return out
    got = hashlib.sha256(f.read_bytes()).hexdigest()
    if got != want:
        _fail(out, "plate_locked",
              f"{rel} no longer matches the locked hash "
              f"({got[:12]} vs {want[:12]}). Something replaced the approved "
              f"plate. Restore it, or clear plate_locked_sha256 on purpose "
              f"and re-approve the cast.")
    return out


def gate_frame_brand_asset(cfg: dict, run_dir: pathlib.Path) -> list[str]:
    """Brand the frame, not the dialogue.

    Seven sponsor-tagged New Heights shorts were transcribed end to end: the
    brand is a persistent corner lockup in every one and is spoken in none
    (references/REFERENCES.md, 'The sponsor-read finding'). `edit.frame_brand`
    is how this recipe expresses that lockup. The file is operator-supplied and
    composited, never drawn by a generator, so if it is declared it has to be
    on disk before the run spends anything.
    """
    out: list[str] = []
    fb = cfg.get("edit", {}).get("frame_brand", {})
    if not fb.get("enabled"):
        return out
    # same precedence as compose_master: the brand block wins
    rel = (cfg.get("brand") or {}).get("lockup_file") or fb.get("lockup_file")
    if not rel:
        _fail(out, "frame_brand_asset",
              "edit.frame_brand.enabled is true but lockup_file is not set")
        return out
    p = run_dir / rel
    if not p.exists():
        _fail(out, "frame_brand_asset",
              f"edit.frame_brand declares a persistent corner lockup but {p} "
              f"is missing; supply the brand's real lockup or disable it")
    return out


# ------------------------------------------------------------ artefact gates
def gate_real_binaries(paths: list[pathlib.Path]) -> list[str]:
    """A git-LFS pointer is ~130 bytes of text and silently fails every
    downstream call. Check the bytes, not the filename."""
    out: list[str] = []
    for p in paths:
        if not p.exists():
            _fail(out, "asset_exists", f"{p} is missing")
            continue
        head = p.open("rb").read(64)
        if head.startswith(b"version https://git-lfs"):
            _fail(out, "asset_not_lfs_pointer",
                  f"{p.name} is an un-hydrated LFS pointer "
                  f"({p.stat().st_size} bytes); git lfs pull it")
        elif p.stat().st_size < 1024:
            _fail(out, "asset_not_lfs_pointer",
                  f"{p.name} is {p.stat().st_size} bytes, too small to be real")
    return out


def gate_caption_safe_zone(overlay_dir: pathlib.Path, cfg: dict) -> list[str]:
    """Measure the rendered PNG's ink, not the configured anchor."""
    from PIL import Image  # local import: keeps the module importable without PIL

    out: list[str] = []
    pngs = sorted(overlay_dir.glob("cap-*.png"))
    if not pngs:
        _fail(out, "caption_overlays_exist", f"no cap-*.png in {overlay_dir}")
        return out
    for p in pngs:
        alpha = Image.open(p).getchannel("A")
        bbox = alpha.getbbox()
        if bbox is None:
            _fail(out, "caption_has_ink", f"{p.name} is fully transparent")
            continue
        left, top, right, bottom = bbox
        if top < SAFE_TOP or bottom > SAFE_BOTTOM:
            _fail(out, "caption_safe_zone",
                  f"{p.name} ink y={top}..{bottom}, outside "
                  f"{SAFE_TOP}..{SAFE_BOTTOM}")
        # A bbox cannot report ink that fell OUTSIDE the canvas -- PIL clips it.
        # So detect the clipping instead: ink touching the first or last column
        # means the line was wider than the frame and got cut off.
        W = cfg["width"]
        edge = alpha.crop((0, 0, 1, cfg["height"])).getbbox() or \
            alpha.crop((W - 1, 0, W, cfg["height"])).getbbox()
        if edge is not None:
            _fail(out, "caption_in_frame",
                  f"{p.name} ink reaches the frame edge (x={left}..{right} of "
                  f"{W}); the line was clipped, so words are missing")
    return out


def _probe(path: pathlib.Path) -> dict:
    r = subprocess.run(
        ["ffprobe", "-v", "error", "-print_format", "json",
         "-show_streams", "-show_format", str(path)],
        capture_output=True, text=True, check=True)
    return json.loads(r.stdout)


def gate_render_no_drift(master: pathlib.Path, plan: dict, beats: dict,
                         cfg: dict, tol: float = 0.10) -> list[str]:
    """Every speaker change in the RENDER must land where the plan put it.

    The lipsync engine returns each clip a few milliseconds shorter than the
    audio that drove it. Concatenated over seventeen beats that became 0.34s
    of picture running ahead of sound, growing monotonically: +0.04, +0.05,
    +0.14 ... +0.32. It reads as the cuts being abrupt, and it was found by a
    person watching, not by any check. compose_master.fit() retimes each clip
    to its beat and the offsets went to 0.000s, but nothing asserted that, so
    a future change to the compose chain could bring it back silently.

    The planned times are rebuilt the way compose builds them: each cut
    quantised to a whole frame, summed. Then ffmpeg's scene detector finds
    the real changes, and each SPEAKER change -- the big ones, where the
    picture goes from one host to the other -- is matched to the nearest.

    Only speaker changes are checked. A cut between two framings of the same
    host is a small scene-score change that the detector does not reliably
    see, and a gate that depends on seeing it would be flaky. Drift is
    cumulative, so if it exists at all it shows up on these.

    tol is 0.10s, three frames at 30fps: loose enough for detector jitter,
    far tighter than the 0.34s that shipped.
    """
    out: list[str] = []
    cuts = plan.get("cuts") or []
    rows = beats.get("beats") if isinstance(beats, dict) else beats
    if not cuts or not rows or not master.exists():
        return out
    fps = float(cfg.get("fps", 30))
    who_of = {b["n"]: b.get("who") for b in rows}

    def qd(sec):
        return max(1, int(round(float(sec) * fps))) / fps

    planned, tt, prev = [], 0.0, None
    for c in cuts:
        who = who_of.get(c.get("beat"))
        if prev is not None and who != prev:
            planned.append(tt)
        prev = who
        tt += qd(c["end"] - c["start"])
    if not planned:
        return out

    # Refuse to judge the $0 preview, by NAME, not by guessing from the
    # picture. compose_master --no-paid writes master-preview.mp4 and the real
    # render is master.mp4; check_framing_render already relies on the same
    # convention. A preview is flat colour blocks, so the detector does find
    # changes, they are just its own block transitions and have nothing to do
    # with where a speaker changes.
    #
    # This was first written as a detail threshold, and that was wrong: it made
    # the gate's behaviour depend on how photographic a render happened to be,
    # and it sent me tuning a synthetic test fixture until it looked "real
    # enough" to the heuristic, which is fitting the test to the code.
    if master.name.endswith("-preview.mp4"):
        print("  [drift] NOT ASSESSED: master-preview.mp4 is the $0 preview, "
              "whose picture is flat colour and carries no speaker changes")
        return out

    r = subprocess.run(["ffmpeg", "-v", "error", "-i", str(master), "-vf",
                        "select='gt(scene,0.2)',metadata=print:file=-",
                        "-fps_mode", "vfr", "-f", "null", "-"],
                       capture_output=True, text=True)
    seen, cur = [], None
    for line in r.stdout.splitlines():
        if "pts_time:" in line:
            cur = float(line.split("pts_time:")[1].split()[0])
        elif "scene_score=" in line and cur is not None:
            seen.append(cur)
    if not seen:
        # Not a failure. The $0 preview is flat colour with no scene changes
        # to find, and a detector that sees nothing cannot tell us whether
        # the picture drifted. Report it, do not claim it.
        print("  [drift] no picture changes detected; NOT ASSESSED "
              "(flat-colour preview, or a genuinely static render)")
        return out

    worst, bad = 0.0, []
    for want in planned:
        got = min(seen, key=lambda s: abs(s - want))
        off = got - want
        if abs(off) > abs(worst):
            worst = off
        if abs(off) > tol:
            bad.append(f"planned {want:.2f}s, picture changed at {got:.2f}s "
                       f"({off:+.2f}s)")
    print(f"  [drift] {len(planned)} speaker change(s), worst offset "
          f"{worst:+.3f}s ({abs(worst) * fps:.1f} frames)")
    if bad:
        _fail(out, "render_drift",
              f"the picture does not land where the plan put it, worst "
              f"{worst:+.2f}s. This is how audio and video came apart before: "
              f"clips return shorter than their audio and concat accumulates "
              f"it. " + "; ".join(bad[:4]))
    return out


def gate_master(master: pathlib.Path, plan: dict, cfg: dict) -> list[str]:
    """Measure the RENDER. Never infer the master from the inputs."""
    out: list[str] = []
    if not master.exists():
        _fail(out, "master_exists", f"{master} is missing")
        return out
    info = _probe(master)
    v = next((s for s in info["streams"] if s["codec_type"] == "video"), None)
    a = next((s for s in info["streams"] if s["codec_type"] == "audio"), None)
    if v is None:
        _fail(out, "master_has_video", "no video stream")
    else:
        if (v["width"], v["height"]) != (cfg["width"], cfg["height"]):
            _fail(out, "master_canvas",
                  f"{v['width']}x{v['height']}, want "
                  f"{cfg['width']}x{cfg['height']}")
    if a is None:
        _fail(out, "master_has_audio", "no audio stream (concat demuxer ate it?)")

    want = plan["dialogue_sec"] + plan["end_card_sec"]
    got = float(info["format"]["duration"])
    if abs(got - want) > 0.30:
        _fail(out, "master_duration",
              f"{got:.2f}s measured, {want:.2f}s planned "
              f"(dialogue {plan['dialogue_sec']:.2f} + end card "
              f"{plan['end_card_sec']:.2f})")
    return out


# ------------------------------------------------------------------------ CLI
def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--config", required=True)
    config_io.add_arg(ap)
    ap.add_argument("--script")
    ap.add_argument("--beats")
    ap.add_argument("--cutplan")
    ap.add_argument("--overlays")
    ap.add_argument("--master")
    ap.add_argument("--recipe")
    ap.add_argument("--assets", nargs="*", default=[])
    a = ap.parse_args()

    L = lambda p: json.loads(pathlib.Path(p).read_text(encoding="utf-8"))
    cfg = config_io.load(a.config, a.preset)
    fails: list[str] = []
    ran: list[str] = []
    skipped: list[str] = []

    # First, and fatal: every later gate indexes into `hosts` without
    # checking its shape, so a malformed one has to stop the run here rather
    # than surface as a traceback from gate nine.
    shape = gate_config_shape(cfg)
    if shape:
        print(f"[gates] {len(shape)} failure(s)")
        return 1

    fails += gate_cast(cfg); ran.append("cast")
    if a.beats:
        _b = L(a.beats)
        _run = pathlib.Path(a.beats).parent
        fails += gate_audio_matches_plan(_run, _b)
        ran.append("audio_matches_plan")
    fails += gate_no_real_brand(cfg); ran.append("no_real_brand")
    fails += gate_no_unbound_placeholders(cfg); ran.append("placeholders")
    fails += gate_still_pool_depth(cfg); ran.append("still_pool_depth")
    fails += gate_host_voice_gender(cfg); ran.append("host_voice_gender")
    fails += gate_one_config(pathlib.Path(__file__).resolve().parent)
    ran.append("one_config")
    fails += gate_grade_keeps_colour(cfg); ran.append("grade_colour")
    if a.overlays:
        fails += gate_captions_no_overlap(
            json.loads((pathlib.Path(a.overlays) / "captions.json")
                       .read_text(encoding="utf-8")), cfg)
        ran.append("captions_overlap")

    if a.script:
        sc = L(a.script)
        fails += gate_script(sc, cfg)
        fails += gate_captions_text(sc, cfg)
        fails += gate_stills_resolve(cfg, sc)
        fails += gate_script_direction(sc, cfg)
        fails += gate_script_matches_brand(sc, cfg)
        fails += gate_script_turn_structure(sc)
        fails += gate_script_hold(sc)
        ran += ["script", "captions_text", "stills_resolve", "script_direction",
                "script_brand_match",
                "script_turn_structure", "script_hold"]
    if a.cutplan and a.beats:
        fails += gate_cutplan(L(a.cutplan), L(a.beats), cfg); ran.append("cutplan")
    if a.cutplan:
        plan = L(a.cutplan)
        # multicut off, NOT plain_mode: `split` is a second LAYOUT, not a
        # second rate of cutting, so it has the same four framings and the
        # same inability to reach the band. plain_mode() is false for split,
        # which is why checking it here silently un-skipped the gate for the
        # split preset and failed three passing brands.
        if not cfg.get("edit", {}).get("multicut", {}).get("enabled", True):
            # plain_mode's docstring promises "The runner prints which gates
            # were skipped and why, so a plain cut is a visible decision and
            # not a quiet pass." It did not. The gate returned [] from its
            # first line and the runner listed it under `ran`, so a cold
            # operator read "0 failure(s)" on a cut the planner had already
            # measured at 0.53 framings per 10s against a 2.9 floor.
            skipped.append("framing_variety: multicut is off, a declared calm "
                           "edit. This gate measures a dynamic one.")
        else:
            fails += gate_framing_variety(plan, cfg)
        # the run directory is where the cut plan lives, which is where
        # compose_master.py resolves the split's product still from
        fails += gate_singles_are_two_people(cfg, pathlib.Path(a.cutplan).parent)
        ran.append("singles_two_people")
        fails += gate_split_balance(plan, cfg)
        ran.append("split_balance")
        fails += gate_split_bottom_assets(plan, cfg,
                                          pathlib.Path(a.cutplan).parent)
        fails += gate_frame_brand_asset(cfg, pathlib.Path(a.cutplan).parent)
        fails += gate_plate_locked(cfg, pathlib.Path(a.cutplan).parent); ran.append("plate_locked")
        ran += ["split_bottom_assets", "frame_brand_asset"]
        if cfg.get("edit", {}).get("multicut", {}).get("enabled", True):
            ran.append("framing_variety")
    if a.overlays:
        fails += gate_caption_safe_zone(pathlib.Path(a.overlays), cfg)
        ran.append("caption_safe_zone")
    if a.assets:
        fails += gate_real_binaries([pathlib.Path(p) for p in a.assets])
        ran.append("real_binaries")
    if a.master and a.cutplan:
        fails += gate_master(pathlib.Path(a.master), L(a.cutplan), cfg)
        if a.beats:
            fails += gate_render_no_drift(pathlib.Path(a.master),
                                          L(a.cutplan), L(a.beats), cfg)
            ran.append("render_drift")
        ran.append("master")
    if a.recipe:
        rp = pathlib.Path(a.recipe)
        fails += gate_recipe_carries_no_narrative(rp.read_text(encoding="utf-8"))
        fails += gate_recipe_has_no_script_fixture(L(a.recipe))
        ran.append("recipe")

    print(f"[gates] ran: {', '.join(ran)}")
    for s in skipped:
        print(f"[gates] SKIPPED {s}")
    for f in fails:
        print(f"  FAIL {f}")
    print(f"[gates] {len(fails)} failure(s)")
    return 1 if fails else 0


if __name__ == "__main__":
    sys.exit(main())

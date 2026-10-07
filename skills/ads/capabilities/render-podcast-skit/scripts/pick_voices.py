#!/usr/bin/env python3
"""Propose an ElevenLabs voice for each host, matched to what they look like.

    pick_voices.py --config config.json            # propose, change nothing
    pick_voices.py --config config.json --write    # write the picks into it

WHY THIS EXISTS
`hosts.<X>.voice_id` was a bare id somebody pasted in, and nothing related it
to the person. The first real render shipped a man reading in a young woman's
voice, and `gate_host_voice_gender` was added to catch that -- but a gate can
only refuse, it cannot choose. This chooses.

HOW IT PICKS
It reads the account's own voice library, which is the only set of voices that
can actually be used without someone adding one first, and scores each against
the host's `appearance`:

  * gender must match the gendered noun in appearance, or the voice is out;
  * age bracket, if the appearance gives one, is worth more than anything else;
  * an accent named in the appearance is worth matching. Only an ACCENT the
    appearance actually names: it deliberately does not guess an accent from
    where somebody looks like they are from, because that is not a thing a
    face tells you. Write the accent in the appearance if it matters;
  * a voice whose name or labels say conversational, podcast, natural or real
    is preferred over one that says narration, character or customer service.

It PROPOSES. The operator confirms, because a voice is a casting decision and
the labels are only a starting point: two voices with identical labels do not
sound alike. `--write` records `voice_name` and `voice_gender` next to the id
so the choice is legible in the config and `gate_host_voice_gender` can check
it offline, with no network call, before any paid step.
"""
from __future__ import annotations

import argparse
import json
import os
import pathlib
import re
import sys
from urllib import error, request

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
import config_io  # noqa: E402

AGES = {"young": ("twenties", "early thirties", "young", "20s", "30s"),
        "middle_aged": ("thirties", "forties", "fifties", "middle", "40s", "50s"),
        "old": ("sixties", "seventies", "older", "elderly", "60s", "70s")}
GOOD = ("conversational", "podcast", "natural", "real", "warm", "friendly",
        "engaging", "storyteller", "casual")
BAD = ("narration", "narrator", "character", "customer", "call center",
       "collections", "recovery", "meditation", "trailer", "announcer")
MALE = ("a man", "man in his", " his ", " he ")
FEMALE = ("a woman", "woman in her", " her ", " she ")


def key():
    for v in ("ELEVENLABS_API_KEY", "ELEVEN_API_KEY"):
        if os.environ.get(v):
            return os.environ[v]
    for parent in pathlib.Path(__file__).resolve().parents:
        env = parent / ".env"
        if not env.exists():
            continue
        for line in env.read_text(encoding="utf-8").splitlines():
            if line.split("=", 1)[0].strip() in ("ELEVENLABS_API_KEY", "ELEVEN_API_KEY"):
                val = line.split("=", 1)[1].strip().strip('"').strip("'")
                if val:
                    return val
    sys.exit("[err] no ELEVENLABS_API_KEY in the environment or any .env up the tree")


def library(tok):
    req = request.Request("https://api.elevenlabs.io/v1/voices?page_size=100",
                          headers={"xi-api-key": tok})
    try:
        return json.loads(request.urlopen(req, timeout=90).read())["voices"]
    except error.HTTPError as e:
        sys.exit(f"[err] voice library: HTTP {e.code} {e.read()[:200].decode('utf-8','replace')}")


def wanted_gender(app: str):
    low = app.lower()
    m, f = any(w in low for w in MALE), any(w in low for w in FEMALE)
    if m and not f:
        return "male"
    if f and not m:
        return "female"
    return None


def score(v, app: str):
    lab = v.get("labels") or {}
    text = f"{v.get('name','')} {' '.join(str(x) for x in lab.values())}".lower()
    low = app.lower()
    s = 0
    for bracket, words in AGES.items():
        if any(w in low for w in words):
            s += 40 if lab.get("age") == bracket else -10
            break
    acc = (lab.get("accent") or "").lower()
    if acc and acc.split()[0] in low:
        s += 25
    s += 8 * sum(1 for g in GOOD if g in text)
    s -= 12 * sum(1 for b in BAD if b in text)
    return s


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--config", required=True)
    config_io.add_arg(ap)
    ap.add_argument("--write", action="store_true",
                    help="write the top pick into the config for each host")
    ap.add_argument("--top", type=int, default=4)
    ap.add_argument("--library", type=pathlib.Path, help="exported {voices:[...]} JSON; no account key needed")
    ap.add_argument("--exclude", action="append", default=[],
                    help="voice id already used elsewhere. Repeatable. The "
                         "picker always returns the top-scored voice, so three "
                         "brands run back to back got the same two people and "
                         "would have sounded like one show.")
    a = ap.parse_args()

    cfg = config_io.load(a.config, a.preset)
    voices = json.loads(a.library.read_text(encoding="utf-8"))["voices"] if a.library else library(key())
    print(f"{len(voices)} voices on the account\n")

    picks = {}
    for who in sorted(cfg["hosts"]):
        h = cfg["hosts"][who]
        app = (h.get("appearance") or "").strip()
        if not app:
            sys.exit(f"[err] hosts.{who} has no 'appearance'; nothing to match against")
        want = wanted_gender(app)
        if not want:
            sys.exit(f"[err] hosts.{who} appearance does not read clearly as a man "
                     f"or a woman, so a voice cannot be matched to it: {app[:60]!r}")
        pool = [v for v in voices
                if (v.get("labels") or {}).get("gender") == want
                and v["voice_id"] not in a.exclude]
        if not pool:
            sys.exit(f"[err] no {want} voice on the account")
        ranked = sorted(pool, key=lambda v: -score(v, app))
        print(f"host {who} ({h.get('name', who)}) - {app[:62]}")
        print(f"   wants a {want} voice; {len(pool)} available")
        for v in ranked[:a.top]:
            lab = v.get("labels") or {}
            mark = "->" if v is ranked[0] else "  "
            print(f"   {mark} {v['voice_id']}  {v.get('name','')[:44]:44} "
                  f"{lab.get('age','?'):12} {lab.get('accent','?'):10} "
                  f"score {score(v, app)}")
        picks[who] = ranked[0]
        a.exclude.append(ranked[0]["voice_id"])   # never both hosts the same
        print()

    if not a.write:
        print("Proposed only. Re-run with --write to record them, and listen "
              "before you pay for seventeen beats: labels are a starting point, "
              "two voices with the same labels do not sound alike.")
        return 0

    p = pathlib.Path(a.config)
    raw = json.loads(p.read_text(encoding="utf-8"))
    for who, v in picks.items():
        lab = v.get("labels") or {}
        raw["hosts"][who]["voice_id"] = v["voice_id"]
        raw["hosts"][who]["voice_name"] = v.get("name", "")
        raw["hosts"][who]["voice_gender"] = lab.get("gender", "")
    p.write_text(json.dumps(raw, indent=2), encoding="utf-8")
    print(f"written into {p.name}. Run gates.py to confirm "
          f"gate_host_voice_gender is happy, then listen to one beat.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

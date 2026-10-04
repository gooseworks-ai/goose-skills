#!/usr/bin/env python3
"""ElevenLabs voiceover (TTS) ROUTED THROUGH THE PROXY (bills the Ads agent). Voice +
text from the template recipe. gen_vo.py --text "..." --voice dMyQqiVXTU80dDl2eNK8 --out vo.mp3

Brand pronunciations: --say-as "Drinkag1=drink A G one" (repeatable) or
--rules working/brand-rules.json (its `pronunciations: [{term, say_as}]`) swaps each
term for how it is SAID before the text is spoken. Captions keep the written term."""
import argparse
import json
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


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("--text", required=True)
    ap.add_argument("--voice", required=True)
    ap.add_argument("--model", default="eleven_v3")
    ap.add_argument("--out", required=True)
    ap.add_argument("--say-as", action="append", help='"Term=how it is said" (repeatable)')
    ap.add_argument("--rules", help="brand-rules.json with a pronunciations list")
    ap.add_argument("--dry-run", action="store_true", help="print the spoken plan without generating audio")
    a = ap.parse_args()

    spoken = apply_say_as(a.text, load_pairs(a.say_as, a.rules))
    if spoken != a.text:
        print(f"spoken text: {spoken}")
    if a.dry_run:
        print(spoken)
        raise SystemExit(0)
    from media_proxy import eleven_tts
    eleven_tts(spoken, a.voice, a.out, a.model)
    print(a.out)

#!/usr/bin/env python3
"""Words per second from word-timed transcripts: whisper.cpp JSON, ElevenLabs alignment
or {words:[{text,start_s,end_s}]}. Span: first word start to last word end; several
files (one per line) add up.

  reference_rate.py REF.json --target-s 30           rate and script_words
  reference_rate.py L1.json L2.json --against REF.json   exit 1 when over 10% slower
"""
import argparse
import json
import re
import sys

SLOW_LIMIT, MAX_TEMPO = 0.90, 1.25


def _counted(text):
    return bool(re.search(r"\w", text))


def words_from(data):
    if isinstance(data, dict) and isinstance(data.get("transcription"), list):
        found = []
        for token in data["transcription"]:
            text, span = str(token.get("text", "")), token.get("offsets") or {}
            if not text.strip() or re.fullmatch(r"\s*\[.*\]\s*", text):
                continue
            start, end = span["from"] / 1000, span["to"] / 1000
            pieces = text.split()
            if found and not text[0].isspace():
                found[-1] = (found[-1][0] + pieces.pop(0), found[-1][1], end)
            found += [(piece, start, end) for piece in pieces]
        return [w for w in found if _counted(w[0])]
    if isinstance(data, dict):
        data = data.get("alignment") or data.get("normalized_alignment") or data
    if isinstance(data, dict) and isinstance(data.get("characters"), list):
        found, current = [], None
        for char, start, end in zip(data["characters"], data["character_start_times_seconds"],
                                    data["character_end_times_seconds"]):
            if char.isspace():
                current = None
            elif current is None:
                current = [char, start, end]
                found.append(current)
            else:
                current[0] += char
                current[2] = end if _counted(char) else current[2]
        return [tuple(w) for w in found if _counted(w[0])]
    if isinstance(data, dict):
        data = data.get("words")
    if isinstance(data, list):
        return [(str(w.get("text", w.get("word", ""))), float(w.get("start_s", w.get("start"))),
                 float(w.get("end_s", w.get("end")))) for w in data
                if isinstance(w, dict) and _counted(str(w.get("text", w.get("word", ""))))]
    raise ValueError("Unknown transcript shape")


def speech_rate(words):
    if len(words) < 2:
        return len(words), 0.0, None
    span = words[-1][2] - words[0][1]
    return len(words), round(span, 3), round(len(words) / span, 3) if span > 0 else None


def measure(paths):
    count, seconds, files = 0, 0.0, []
    for path in paths:
        with open(path) as handle:
            n, span, wps = speech_rate(words_from(json.load(handle)))
        files.append({"file": str(path), "words": n, "speech_s": span, "words_per_second": wps})
        count, seconds = count + n, seconds + span
    return {"words": count, "speech_s": round(seconds, 3),
            "words_per_second": round(count / seconds, 3) if seconds > 0 else None, "files": files}


def main():
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("transcripts", nargs="+")
    parser.add_argument("--target-s", type=float)
    parser.add_argument("--against")
    args = parser.parse_args()
    report = measure(args.transcripts)
    if not report["words_per_second"]:
        print(json.dumps(report), file=sys.stderr)
        sys.exit("No measurable speech: need at least two timed words")
    if args.target_s:
        report["script_words"] = round(report["words_per_second"] * args.target_s)
    status = 0
    if args.against:
        reference = measure([args.against])["words_per_second"]
        ratio = report["words_per_second"] / reference
        tempo = round(reference / report["words_per_second"], 3)
        report.update(reference_words_per_second=reference, ratio=round(ratio, 3), slow=ratio < SLOW_LIMIT)
        if report["slow"]:
            status = 1
            report["fix"] = (f"apply tempo {tempo} to the narration before lip-sync" if tempo <= MAX_TEMPO
                             else f"needs tempo {tempo} (over {MAX_TEMPO}): regenerate with eleven_v4 or tighter words")
    print(json.dumps(report, indent=2))
    sys.exit(status)


if __name__ == "__main__":
    main()

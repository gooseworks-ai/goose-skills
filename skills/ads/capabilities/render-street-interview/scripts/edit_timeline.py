#!/usr/bin/env python3
"""One source-span map for a recut's captions, shot boundaries and source room tone.

Word times must be measured on the original source. A boundary through a spoken
word is an invalid edit, not permission to print or discard a partial word.
"""
import json
import hashlib
import math
from pathlib import Path

EPS = 0.001


def file_hash(path):
    digest = hashlib.sha256()
    with Path(path).open("rb") as source:
        for chunk in iter(lambda: source.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def load_map(path):
    path = Path(path).resolve()
    data = json.loads(path.read_text(encoding="utf-8"))
    for field in ("source_duration", "output_duration"):
        if not isinstance(data.get(field), (int, float)) or not math.isfinite(data[field]) or data[field] <= 0:
            raise ValueError(f"edit map needs a positive finite {field}")
    if not data.get("segments"):
        raise ValueError("edit map contains no source spans")
    previous = 0.0
    for segment in data["segments"]:
        s, e, a, b = (segment.get(k) for k in ("src_start", "src_end", "out_start", "out_end"))
        if any(not isinstance(v, (int, float)) or not math.isfinite(v) for v in (s, e, a, b)):
            raise ValueError("edit map has an invalid span")
        if not (0 <= s < e <= data["source_duration"] + EPS and a < b):
            raise ValueError("edit map span is outside its source/output")
        if abs(a - previous) > EPS:
            raise ValueError("edit map output spans must be contiguous and start at zero")
        # Measured encode durations can differ by a frame; speed changes need a different map.
        if abs((b - a) - (e - s)) > 0.1:
            raise ValueError("edit map does not describe normal-speed source spans")
        previous = b
    if abs(previous - data["output_duration"]) > EPS:
        raise ValueError("edit map output duration does not match its spans")
    for key in ("source", "output"):
        value = data.get(key)
        if not value and key == "output":
            value = str(path).removesuffix(".plan.json") + ".mp4"
        if not isinstance(value, str) or not value:
            raise ValueError(f"edit map needs {key}")
        candidate = Path(value)
        if not candidate.is_absolute():
            candidate = path.parent / candidate
        data[key] = str(candidate.resolve())
        if data.get(key + "_sha256") and file_hash(data[key]) != data[key + "_sha256"]:
            raise ValueError(f"edit map {key} changed; rebuild from this source rather than reuse stale timings")
    data["_path"] = str(path)
    return data


def load_words(path, source):
    data = json.loads(Path(path).read_text(encoding="utf-8"))
    if not isinstance(data, dict) or Path(data.get("source", "")).resolve() != Path(source).resolve():
        raise ValueError("word timings must name this edit map's original source")
    if data.get("source_sha256") and data["source_sha256"] != file_hash(source):
        raise ValueError("original source changed; measure its word times again")
    words = data.get("words")
    if not isinstance(words, list) or not words:
        raise ValueError("no measured source word timings")
    previous = -1.0
    for s, e, text in words:
        if not all(isinstance(v, (int, float)) and math.isfinite(v) for v in (s, e)) or not (0 <= s < e):
            raise ValueError("invalid source word timing")
        if s < previous or not isinstance(text, str) or not text.strip():
            raise ValueError("source words must be ordered and nonempty")
        previous = s
    return words


def cuts_after_edit(cuts, plan):
    result = []
    previous = None
    for segment in plan["segments"]:
        s, e, a, b = (segment[k] for k in ("src_start", "src_end", "out_start", "out_end"))
        if previous is not None and abs(s - previous) > EPS:
            result.append(a)
        result.extend(a + c - s for c in cuts if s < c < e and a + c - s < b)
        previous = e
    return sorted(set(round(c, 6) for c in result if EPS < c < plan["output_duration"] - EPS))


def captions_after_edit(rows, plan, words=None):
    if words is not None:
        for ws, we, word in words:
            if we > plan["source_duration"] + EPS:
                raise ValueError("word timing is outside the original source")
            for segment in plan["segments"]:
                s, e = segment["src_start"], segment["src_end"]
                if we <= s + EPS or ws >= e - EPS:
                    continue
                if ws < s - EPS or we > e + EPS:
                    raise ValueError(f"edit boundary cuts spoken word {word!r} at {ws:.3f}-{we:.3f}; widen the source span")
    result = []
    for segment in plan["segments"]:
        s, e, a, b = (segment[k] for k in ("src_start", "src_end", "out_start", "out_end"))
        for start, end, text, style, job, sentence in rows:
            left, right = max(start, s), min(end, e)
            if right <= left + EPS:
                continue
            clipped = start < s - EPS or end > e + EPS
            if style != "title" and words is not None:
                line = [w for w in words if start <= (w[0] + w[1]) / 2 < end]
                if not line:
                    raise ValueError("caption source span contains no measured words; correct the source schedule or transcription")
                kept = []
                for ws, we, word in line:
                    if we <= s + EPS or ws >= e - EPS:
                        continue
                    if ws < s - EPS or we > e + EPS:
                        raise ValueError(f"edit boundary cuts spoken word {word!r} at {ws:.3f}-{we:.3f}; widen the source span")
                    kept.append((ws, we, word))
                if not kept:
                    continue
                left, right = max(left, kept[0][0]), min(right, kept[-1][1] + 0.1)
                if len(kept) != len(line):
                    sentence = " ".join(w[2] for w in kept)
                    text = sentence.upper()
            elif style != "title" and clipped:
                raise ValueError("partial caption span needs measured original word timings; supply --word-times")
            out_start, out_end = a + left - s, min(b, a + right - s)
            if out_end > out_start + EPS:
                result.append((out_start, out_end, text, style, job, sentence))
    return sorted(result, key=lambda row: row[0])


def measure_words(source, cfg):
    # Reuse the existing episode's local transcription and spelling alignment.
    # Imports stay lazy: fixtures and complete-span maps need no Whisper install.
    import brandkit
    from build_episode import word_times, spell_from_script
    words, _heard = word_times(Path(source))
    words, problems = spell_from_script(words, " ".join([cfg["question"]] + brandkit.spoken_lines(cfg)))
    for problem in problems:
        print(f"CAPTION SOURCE: {problem}")
    if not words:
        raise ValueError("local transcription returned no measured source words")
    return words


if __name__ == "__main__":
    import argparse
    import brandkit
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--source", type=Path, required=True)
    parser.add_argument("--brand", required=True)
    parser.add_argument("--word-times", type=Path, required=True, help="output measured word-times JSON, free local Whisper")
    args = parser.parse_args()
    words = measure_words(args.source.resolve(), brandkit.load(args.brand))
    args.word_times.parent.mkdir(parents=True, exist_ok=True)
    args.word_times.write_text(json.dumps({"source": str(args.source.resolve()), "source_sha256": file_hash(args.source), "words": words}, indent=2) + "\n", encoding="utf-8")

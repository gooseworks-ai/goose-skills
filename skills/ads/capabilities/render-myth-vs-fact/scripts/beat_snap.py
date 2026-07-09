#!/usr/bin/env python3
"""beat_snap.py — align beat boundaries to VO word onsets (Whisper) + emit words-flat.

VO-FIRST is the whole design: render the VO, transcribe it to word-level timestamps, then
re-snap every beat boundary to the nearest word ONSET so a beat's on-screen turn lands
exactly when the VO says it. This ports the re-snap step from the Clinikally run.

Two outputs, written into the work dir:
  - whisper/words-flat.json : [{text, start, end}, ...] (what compose.py's captions read)
  - beat-manifest.json      : the config beats with re-snapped start/end/duration.

Whisper is fetched via FAL (fal-ai/whisper, chunk_level=word). If FAL is unavailable (no
FAL_KEY / no network), pass --no-whisper to fall back to the DURATIONS ALREADY IN CONFIG
(cumulative, un-snapped) so the pipeline still runs end-to-end offline. On-card text is the
source of truth, so brand-name homophones in the transcript are fine.

Usage:
  beat_snap.py --config config.json --work-dir /path/to/work [--vo vo.mp3] [--no-whisper]

ENV: FAL_KEY (alias FAL_API_KEY) when Whisper is used.
"""
import argparse, json, os
from pathlib import Path


def transcribe_fal(vo_path):
    import fal_client
    if "FAL_KEY" not in os.environ and "FAL_API_KEY" in os.environ:
        os.environ["FAL_KEY"] = os.environ["FAL_API_KEY"]
    url = fal_client.upload_file(str(vo_path))
    res = fal_client.subscribe("fal-ai/whisper", arguments={
        "audio_url": url, "task": "transcribe", "language": "en", "chunk_level": "word"})
    words = []
    for ch in res.get("chunks", []):
        ts = ch.get("timestamp") or [None, None]
        words.append({"text": ch.get("text", "").strip(), "start": ts[0], "end": ts[1]})
    return words


def ffprobe_dur(path):
    import subprocess
    r = subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration",
                        "-of", "csv=p=0", str(path)], capture_output=True, text=True)
    return float(r.stdout.strip())


def nearest_onset(t, words, tol=0.6):
    """Snap `t` to the closest word start within `tol` seconds; else return t unchanged."""
    best, bd = t, tol
    for w in words:
        if w.get("start") is None:
            continue
        d = abs(w["start"] - t)
        if d < bd:
            best, bd = w["start"], d
    return best


def main():
    ap = argparse.ArgumentParser(description="Snap beats to VO word onsets.")
    ap.add_argument("--config", required=True)
    ap.add_argument("--work-dir", required=True)
    ap.add_argument("--vo", help="VO mp3 (defaults to config.vo)")
    ap.add_argument("--no-whisper", action="store_true",
                    help="skip FAL; keep config durations (offline fallback)")
    a = ap.parse_args()

    cfg = json.load(open(a.config))
    work = Path(a.work_dir)
    (work / "whisper").mkdir(parents=True, exist_ok=True)
    beats = cfg["beats"]
    vo = a.vo or cfg.get("vo")

    words = []
    if not a.no_whisper and vo and os.path.exists(vo):
        print(f"[whisper] transcribing {vo}")
        words = transcribe_fal(vo)
        print(f"[whisper] {len(words)} words: " + " ".join(w["text"] for w in words)[:200])
    else:
        print("[whisper] skipped — using config beat durations un-snapped")

    (work / "whisper" / "words-flat.json").write_text(json.dumps(words, indent=2))

    # Re-snap: walk cumulative starts; snap each boundary to the nearest word onset.
    out_beats, t = [], 0.0
    for i, b in enumerate(beats):
        start = nearest_onset(t, words) if words else t
        dur = float(b["duration"])
        end = start + dur
        # snap the NEXT boundary too, so the beat can flex to the onset that follows.
        if words and i + 1 < len(beats):
            nb = nearest_onset(t + dur, words)
            if nb > start + 0.4:  # keep a sane minimum beat length
                end = nb
        nb_out = dict(b)
        nb_out["start"] = round(start, 3)
        nb_out["end"] = round(end, 3)
        nb_out["duration"] = round(end - start, 3)
        out_beats.append(nb_out)
        t = end

    manifest = dict(cfg)
    manifest["beats"] = out_beats
    manifest["total_duration_s"] = round(t, 3)
    (work / "beat-manifest.json").write_text(json.dumps(manifest, indent=2))
    print(f"[manifest] {len(out_beats)} beats, total {t:.2f}s -> {work/'beat-manifest.json'}")


if __name__ == "__main__":
    main()

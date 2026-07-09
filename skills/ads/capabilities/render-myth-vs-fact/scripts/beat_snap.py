#!/usr/bin/env python3
"""beat_snap.py — align beat boundaries to VO word onsets (Whisper) + emit words-flat.

VO-FIRST is the whole design: render the VO, transcribe it to word-level timestamps, then
re-snap every beat boundary to the nearest word ONSET so a beat's on-screen turn lands
exactly when the VO says it. This ports the re-snap step from the Clinikally run.

Two outputs, written into the work dir:
  - whisper/words-flat.json : [{text, start, end}, ...] (what compose.py's captions read)
  - beat-manifest.json      : the config beats with re-snapped start/end/duration.

Whisper word-timestamps come from fal-ai/whisper (chunk_level=word). Prefer the
PROXY-ROUTED path so the call bills the Ads agent (never a raw FAL_KEY): the orchestrator
hosts the rendered VO via MCP `get_upload_url` → `get_download_url` and passes the presigned
url as `--vo-url` (transcribed through `media_proxy.fal_whisper`). Already have the words?
pass `--words-file words.json` and beat_snap skips transcription entirely. Legacy: a raw
`FAL_KEY` in the env still works via `fal_client`. Fully offline: `--no-whisper` keeps the
config durations un-snapped (NOTE: no words ⇒ no karaoke captions). On-card text is the
source of truth, so brand-name homophones in the transcript are fine.

Usage:
  beat_snap.py --config config.json --work-dir DIR --vo-url <presigned-url>   # proxy (preferred)
  beat_snap.py --config config.json --work-dir DIR --words-file words.json    # pre-fetched
  beat_snap.py --config config.json --work-dir DIR --vo vo.mp3                 # legacy FAL_KEY
  beat_snap.py --config config.json --work-dir DIR --no-whisper               # offline

ENV: GW_PROJECT_ID (attributes proxy spend to the ad project); FAL_KEY only for the legacy path.
"""
import argparse, json, os
from pathlib import Path


def transcribe_proxy(vo_url):
    """Proxy-routed Whisper (bills the Ads agent). Needs media_proxy.py on sys.path —
    the orchestrator fetches it with the create-vo-elevenlabs / media-proxy capability."""
    from media_proxy import fal_whisper
    return fal_whisper(vo_url)


def transcribe_fal(vo_path):
    """Legacy: a raw FAL_KEY in the env (NOT proxy-routed — does not bill the Ads agent)."""
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
    ap.add_argument("--vo", help="VO mp3 (defaults to config.vo) — legacy raw-FAL_KEY path")
    ap.add_argument("--vo-url", help="presigned PUBLIC url of the rendered VO → proxy Whisper (preferred)")
    ap.add_argument("--words-file", help="pre-fetched words-flat.json → skip transcription")
    ap.add_argument("--no-whisper", action="store_true",
                    help="skip transcription; keep config durations (offline; NO captions)")
    a = ap.parse_args()

    cfg = json.load(open(a.config))
    work = Path(a.work_dir)
    (work / "whisper").mkdir(parents=True, exist_ok=True)
    beats = cfg["beats"]
    vo = a.vo or cfg.get("vo")

    words = []
    if a.words_file:
        words = json.load(open(a.words_file))
        print(f"[whisper] loaded {len(words)} words from {a.words_file}")
    elif a.no_whisper:
        print("[whisper] skipped — using config beat durations un-snapped")
    elif a.vo_url:
        print("[whisper] transcribing via proxy (bills the Ads agent)")
        words = transcribe_proxy(a.vo_url)
        print(f"[whisper] {len(words)} words: " + " ".join(w["text"] for w in words)[:200])
    elif vo and os.path.exists(vo) and ("FAL_KEY" in os.environ or "FAL_API_KEY" in os.environ):
        print(f"[whisper] transcribing {vo} via legacy FAL_KEY (not proxy-billed)")
        words = transcribe_fal(vo)
        print(f"[whisper] {len(words)} words: " + " ".join(w["text"] for w in words)[:200])
    else:
        print("[whisper] no --vo-url / --words-file / FAL_KEY — durations un-snapped, no captions")

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

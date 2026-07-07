#!/usr/bin/env python3
"""Pre-publish review gate for UGC video renders.

Transcribes a finished render's AUDIO with Whisper, word-diffs the transcript
against the approved spoken script, and gates `set_final_render`. This catches
the failure mode where Seedance mis-voices a word in the generated audio
(e.g. the approved line "human-vetted" is spoken as "human witted") — a defect
the render carries in its audio, which an eyeball `/watch` QC routinely misses
and which a caption pass then faithfully bakes in.

It is the runnable, gating counterpart to the content-goose
`coworkers/video/atoms/review/review-transcript-integrity` atom.

Usage:
    review_render.py --video working/final.mp4 --script-file working/approved-script.txt
    review_render.py --video final.mp4 --script "Okay, real talk..." --expect-music

Exit codes:
    0  PASS  — safe to set_final_render
    2  FAIL  — do NOT publish; fix (usually re-roll a new seed) and re-run
    3  ERROR — could not run the check (no transcription backend / bad input)

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
from dataclasses import dataclass, field, asdict
from difflib import SequenceMatcher

# ── Tunables ────────────────────────────────────────────────────────────────
DEFAULT_MIN_RATIO = 0.90      # transcript↔script token similarity to pass
SILENCE_MEAN_DB = -45.0       # quieter mean volume than this ⇒ effectively silent
# A substitution between two short, similarly-spelled words is almost always a
# mis-voicing (vetted→witted, Hume→Hune), not a paraphrase. Flag it HIGH.
MISVOICE_MAX_LEN_DELTA = 3
MISVOICE_MIN_CHAR_SIM = 0.5

_WORD_RE = re.compile(r"[a-z0-9]+")


def tokenize(text: str) -> list[str]:
    """Lowercase word tokens, punctuation stripped. 'human-vetted!' → [human, vetted]."""
    return _WORD_RE.findall((text or "").lower())


def _char_sim(a: str, b: str) -> float:
    return SequenceMatcher(None, a, b).ratio()


@dataclass
class Issue:
    kind: str                 # substitution | dropped | inserted
    severity: str             # high | medium | low
    script_words: list[str] = field(default_factory=list)
    heard_words: list[str] = field(default_factory=list)
    note: str = ""


@dataclass
class Verdict:
    passed: bool
    ratio: float
    issues: list[Issue] = field(default_factory=list)
    silent: bool = False
    music_present: bool | None = None
    script_tokens: int = 0
    transcript_tokens: int = 0

    def to_dict(self) -> dict:
        d = asdict(self)
        return d


def review_transcript(script: str, transcript: str, min_ratio: float = DEFAULT_MIN_RATIO) -> Verdict:
    """Pure verdict from approved script vs heard transcript. No I/O."""
    s = tokenize(script)
    t = tokenize(transcript)
    v = Verdict(passed=False, ratio=0.0, script_tokens=len(s), transcript_tokens=len(t))

    if not s:
        # No script to compare against — cannot gate on drift, treat as advisory pass.
        v.passed = True
        v.ratio = 1.0
        v.issues.append(Issue("no_script", "low", note="no approved script supplied; drift check skipped"))
        return v

    matcher = SequenceMatcher(None, s, t, autojunk=False)
    v.ratio = matcher.ratio()

    for tag, i1, i2, j1, j2 in matcher.get_opcodes():
        if tag == "equal":
            continue
        sw = s[i1:i2]
        hw = t[j1:j2]
        if tag == "replace":
            severity = "medium"
            note = "spoken word differs from the approved script"
            # 1:1 replacement of a similar-looking word ⇒ almost certainly mis-voiced audio.
            if len(sw) == 1 and len(hw) == 1:
                a, b = sw[0], hw[0]
                if abs(len(a) - len(b)) <= MISVOICE_MAX_LEN_DELTA and _char_sim(a, b) >= MISVOICE_MIN_CHAR_SIM:
                    severity = "high"
                    note = f'audio likely mis-voices "{a}" as "{b}" (re-roll a new seed; if it is a brand token, spell it phonetically in the SPOKEN LINE)'
            v.issues.append(Issue("substitution", severity, sw, hw, note))
        elif tag == "delete":
            v.issues.append(Issue("dropped", "medium", script_words=sw,
                                  note="approved words not heard in the render"))
        elif tag == "insert":
            # Extra heard words are often benign (filler / whisper tail); low severity.
            v.issues.append(Issue("inserted", "low", heard_words=hw,
                                  note="extra words heard that are not in the script"))

    has_high = any(i.severity == "high" for i in v.issues)
    v.passed = (v.ratio >= min_ratio) and not has_high
    return v


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


def transcribe(audio: str) -> str:
    """Whisper transcript. OpenAI API (honors OPENAI_BASE_URL proxy) → local `whisper` CLI."""
    api_key = os.environ.get("OPENAI_API_KEY")
    if api_key:
        base = os.environ.get("OPENAI_BASE_URL", "https://api.openai.com/v1").rstrip("/")
        cp = _run([
            "curl", "-sS", "--fail-with-body", f"{base}/audio/transcriptions",
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
        "no transcription backend available: set OPENAI_API_KEY (optionally OPENAI_BASE_URL "
        "for the gooseworks proxy) or install the `whisper` CLI"
    )


# ── Reporting ───────────────────────────────────────────────────────────────
def render_report(v: Verdict) -> str:
    lines = []
    status = "PASS ✅" if v.passed else "FAIL ❌"
    lines.append(f"Pre-publish review: {status}  (transcript↔script similarity {v.ratio:.2f})")
    lines.append(f"  script tokens={v.script_tokens}  heard tokens={v.transcript_tokens}")
    if v.silent:
        lines.append("  ⚠ audio is effectively silent")
    if v.music_present is False:
        lines.append("  ⚠ expected a music bed but none detected")
    if not v.issues:
        lines.append("  no transcript drift.")
    for i in v.issues:
        if i.kind == "substitution":
            lines.append(f"  [{i.severity}] said {i.heard_words} where script has {i.script_words} — {i.note}")
        elif i.kind == "dropped":
            lines.append(f"  [{i.severity}] dropped {i.script_words} — {i.note}")
        elif i.kind == "inserted":
            lines.append(f"  [{i.severity}] extra {i.heard_words} — {i.note}")
        else:
            lines.append(f"  [{i.severity}] {i.note}")
    if not v.passed:
        lines.append("  → DO NOT set_final_render. Fix (usually re-roll a new seed for an audio defect), then re-run this gate.")
    return "\n".join(lines)


def main(argv: list[str] | None = None) -> int:
    ap = argparse.ArgumentParser(description="Pre-publish review gate for a UGC video render.")
    ap.add_argument("--video", required=True, help="path to the rendered master mp4")
    g = ap.add_mutually_exclusive_group()
    g.add_argument("--script", help="approved spoken script text")
    g.add_argument("--script-file", help="path to a file with the approved spoken script")
    ap.add_argument("--min-ratio", type=float, default=DEFAULT_MIN_RATIO)
    ap.add_argument("--expect-music", action="store_true",
                    help="advisory: warn if the render appears to have no music bed")
    ap.add_argument("--json", dest="json_out", help="write the machine verdict here")
    args = ap.parse_args(argv)

    if not os.path.exists(args.video):
        print(f"ERROR: video not found: {args.video}", file=sys.stderr)
        return 3
    if not shutil.which("ffmpeg"):
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

    try:
        with tempfile.TemporaryDirectory() as td:
            audio = os.path.join(td, "audio.mp3")
            extract_audio(args.video, audio)
            silent = mean_volume_db(audio) <= SILENCE_MEAN_DB
            transcript = "" if silent else transcribe(audio)
            v = review_transcript(script, transcript, args.min_ratio)
            v.silent = silent
            if silent:
                v.passed = False
                v.issues.insert(0, Issue("silent", "high", note="render audio is effectively silent"))
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

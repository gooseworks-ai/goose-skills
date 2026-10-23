#!/usr/bin/env python3
"""Trim a source video into named clips at exact time windows, via ffmpeg.

The trim mode of stitch-videos-ffmpeg (it replaces the studio's trim-video-clips).
Each clip is re-encoded (not stream-copied): with re-encoding, ffmpeg decodes from
the keyframe before the input seek and drops the frames before `start`, so cuts
land frame-accurately on the requested boundaries.

Usage:
    trim_clips.py --source SRC.mp4 --clips clips.json --output-dir DIR
                  [--crf 18] [--overwrite]

clips.json is a JSON array of clip specs. Each spec needs `name` plus either
`end` or `duration`:

    [
      {"name": "hook-laptop-close", "start": 0,      "end": 2.6},
      {"name": "mac-mini-glow",     "start": "00:03", "duration": 5},
      {"name": "endcard",           "start": 90.0,   "end": "01:34.4"}
    ]

`start` / `end` accept seconds (number) or a timecode string
("SS", "MM:SS", "HH:MM:SS", optional ".ms").
"""
from __future__ import annotations

import argparse
import json
import subprocess
import sys
import time
import uuid
from pathlib import Path


def parse_time(value) -> float:
    """Parse seconds (number) or a 'HH:MM:SS.ms' / 'MM:SS' / 'SS' string to float seconds."""
    if isinstance(value, (int, float)):
        return float(value)
    s = str(value).strip()
    if not s:
        raise ValueError("empty time value")
    parts = s.split(":")
    try:
        parts = [float(p) for p in parts]
    except ValueError as e:
        raise ValueError(f"bad time value: {value!r}") from e
    if len(parts) == 1:
        return parts[0]
    if len(parts) == 2:
        return parts[0] * 60 + parts[1]
    if len(parts) == 3:
        return parts[0] * 3600 + parts[1] * 60 + parts[2]
    raise ValueError(f"bad time value: {value!r}")


def probe_duration(path: Path):
    """The clip's real duration in seconds from ffprobe, or None when it cannot be read."""
    proc = subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration",
                           "-of", "default=nw=1:nk=1", str(path)], capture_output=True, text=True)
    try:
        return round(float(proc.stdout.strip()), 3)
    except ValueError:
        return None


def slugify(name: str) -> str:
    safe = "".join(c if c.isalnum() or c in "-_" else "-" for c in name.strip().lower())
    while "--" in safe:
        safe = safe.replace("--", "-")
    return safe.strip("-") or "clip"


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--source", required=True, type=Path, help="Source video file.")
    ap.add_argument("--clips", required=True, type=Path, help="JSON array of clip specs.")
    ap.add_argument("--output-dir", required=True, type=Path, help="Destination folder for clips.")
    ap.add_argument("--crf", type=int, default=18, help="x264 quality (lower = better, default 18).")
    ap.add_argument("--overwrite", action="store_true",
                    help="Re-cut clips even if the output file already exists.")
    args = ap.parse_args()

    run_id = time.strftime("%Y%m%dT%H%M%SZ", time.gmtime()) + "-" + uuid.uuid4().hex[:6]
    started = time.time()
    warnings: list[str] = []
    errors: list[str] = []
    output_files: list[str] = []

    if not args.source.exists():
        sys.exit(f"ERROR: source video not found: {args.source}")
    try:
        specs = json.loads(args.clips.read_text())
    except Exception as e:
        sys.exit(f"ERROR: could not read clips JSON {args.clips}: {e}")
    if not isinstance(specs, list) or not specs:
        sys.exit("ERROR: clips JSON must be a non-empty array of clip specs.")

    args.output_dir.mkdir(parents=True, exist_ok=True)
    clip_records: list[dict] = []

    for i, spec in enumerate(specs):
        name = spec.get("name") or f"clip-{i + 1:02d}"
        slug = slugify(name)
        out = args.output_dir / f"{slug}.mp4"
        try:
            start = parse_time(spec["start"])
            if "duration" in spec and spec["duration"] is not None:
                dur = float(parse_time(spec["duration"]))
            elif "end" in spec and spec["end"] is not None:
                dur = parse_time(spec["end"]) - start
            else:
                raise ValueError("clip needs `end` or `duration`")
            if dur <= 0:
                raise ValueError(f"non-positive duration ({dur:.3f}s)")
        except Exception as e:
            errors.append(f"{slug}: bad spec — {e}")
            print(f"[trim] SKIP {slug}: bad spec — {e}", flush=True)
            continue

        if out.exists() and not args.overwrite:
            warnings.append(f"{slug}: already exists, skipped (use --overwrite to re-cut)")
            print(f"[trim] skip {out.name} (exists)", flush=True)
            output_files.append(str(out))
            clip_records.append({"name": slug, "file": str(out), "start": start,
                                  "duration": round(dur, 3), "status": "exists"})
            continue

        cmd = [
            "ffmpeg", "-y", "-ss", f"{start:.3f}", "-i", str(args.source),
            "-t", f"{dur:.3f}",
            "-c:v", "libx264", "-crf", str(args.crf), "-preset", "fast",
            "-pix_fmt", "yuv420p", "-c:a", "aac", "-b:a", "192k",
            str(out),
        ]
        print(f"[trim] cut {out.name}  ({start:.2f}s +{dur:.2f}s)", flush=True)
        proc = subprocess.run(cmd, capture_output=True, text=True)
        if proc.returncode != 0 or not out.exists() or out.stat().st_size == 0:
            tail = proc.stderr.strip().splitlines()[-3:]
            errors.append(f"{slug}: ffmpeg failed — {' / '.join(tail)}")
            print(f"[trim] FAIL {slug}", flush=True)
            continue
        actual = probe_duration(out)
        if actual is not None and actual < dur - 0.05:
            warnings.append(f"{slug}: asked for {dur:.3f}s, got {actual:.3f}s "
                            "(the window runs past the end of the source)")
        output_files.append(str(out))
        clip_records.append({"name": slug, "file": str(out), "start": start,
                              "duration": round(dur, 3), "status": "cut",
                              "actual_duration": actual, "bytes": out.stat().st_size})

    status = "pass" if output_files and not errors else ("fail" if errors and not output_files else
             ("needs human review" if errors else "pass"))
    manifest = {
        "skill_name": "stitch-videos-ffmpeg",
        "mode": "trim",
        "run_id": run_id,
        "input_path": str(args.source),
        "output_files": output_files,
        "provider": "ffmpeg",
        "model_or_tool": "ffmpeg libx264",
        "created_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "duration_seconds": round(time.time() - started, 1),
        "status": status,
        "clips": clip_records,
        "warnings": warnings,
        "errors": errors,
    }
    manifest_path = args.output_dir / "manifest.json"
    manifest_path.write_text(json.dumps(manifest, indent=2))
    print(f"[trim] {len(output_files)} clip(s) → {args.output_dir}  | status={status}", flush=True)
    print(f"[trim] manifest: {manifest_path}", flush=True)
    return 0 if status != "fail" else 1


if __name__ == "__main__":
    sys.exit(main())

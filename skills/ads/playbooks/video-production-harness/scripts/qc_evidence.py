#!/usr/bin/env python3
"""Collect actual video/audio evidence. Never declare creative quality approved."""
import argparse
from fractions import Fraction
import hashlib
import json
import math
from pathlib import Path
import re
import shutil
import subprocess


def command(args, timeout=300):
    return subprocess.run(args, check=True, capture_output=True, text=True, timeout=timeout)


def sampled_frame_timestamps(log, count):
    """Trace the frames selected by fps; do not infer source times from slot numbers."""
    time_base = None
    source = None
    converted = {}
    selected = []
    for line in log.splitlines():
        if "[showinfo@qc_source " in line:
            match = re.search(r"config in time_base:\s*(\d+/\d+)", line)
            if match:
                measured = Fraction(match[1])
                if measured <= 0 or (time_base is not None and measured != time_base):
                    raise ValueError("Cannot verify changing video timestamp time base")
                time_base = measured
            match = re.search(r"\bn:\s*(\d+)\s+pts:\s*(-?\d+)\s", line)
            if match and time_base is not None:
                pts = int(match[2])
                source = {
                    "source_frame_n": int(match[1]), "source_pts": pts,
                    "source_pts_s": float(pts * time_base),
                }
        elif "[fps@qc_sampling " in line:
            match = re.search(r"Read frame with in pts (-?\d+), out pts (-?\d+)", line)
            if match:
                if source is None or source["source_pts"] != int(match[1]):
                    raise ValueError("Cannot verify decoded source frame timestamp")
                # fps drops older frames in a rounded-PTS bucket before writing
                # the newest one. A repeated write retains that same source PTS.
                converted[int(match[2])] = source
            match = re.search(r"Writing frame with pts (-?\d+) to pts (-?\d+)", line)
            if match:
                if int(match[1]) not in converted:
                    raise ValueError("Cannot verify sampled source frame timestamp")
                selected.append({**converted[int(match[1])], "sample_output_pts_s": int(match[2]) / 2})
    if time_base is None or len(selected) != count:
        raise ValueError("Cannot verify every sampled frame timestamp; unsupported FFmpeg trace")
    return str(time_base), selected


def collect(video, destination):
    for tool in ("ffmpeg", "ffprobe"):
        if not shutil.which(tool):
            raise ValueError(f"Required local capability unavailable: {tool}")
    video = Path(video).resolve()
    if not video.is_file():
        raise ValueError("Supply a real local video file")
    destination = Path(destination).resolve()
    if destination.exists() and any(destination.iterdir()):
        raise ValueError("Use a fresh evidence directory; preserve previous review evidence")
    probe = json.loads(command(["ffprobe", "-v", "error", "-show_streams", "-show_format", "-of", "json", str(video)]).stdout)
    streams = probe.get("streams", [])
    visual = next((s for s in streams if s.get("codec_type") == "video"), None)
    if visual is None:
        raise ValueError("Input has no video stream")
    duration = float(visual.get("duration") or probe.get("format", {}).get("duration", 0))
    if not math.isfinite(duration) or not 0 < duration <= 180.1:
        raise ValueError("Video duration must be known and between zero and180 seconds")
    destination.mkdir(parents=True, exist_ok=True)
    frames = destination / "frames"
    frames.mkdir()
    extraction = command(["ffmpeg", "-nostdin", "-v", "debug", "-i", str(video), "-an", "-vf", "showinfo@qc_source=checksum=0,fps@qc_sampling=2,scale=720:-2", "-frames:v", "361", "-q:v", "3", str(frames / "%04d.jpg")])
    images = sorted(frames.glob("*.jpg"))
    if not images:
        raise ValueError("No reviewable frames were extracted")
    source_time_base, timestamps = sampled_frame_timestamps(extraction.stderr, len(images))
    audio = None
    loudness = None
    tail_diagnostics = None
    if any(s.get("codec_type") == "audio" for s in streams):
        audio = destination / "audio.wav"
        command(["ffmpeg", "-nostdin", "-v", "error", "-i", str(video), "-vn", "-ac", "1", "-ar", "16000", "-c:a", "pcm_s16le", str(audio)])
        analysis = command(["ffmpeg", "-nostdin", "-hide_banner", "-i", str(video), "-vn", "-af", "loudnorm=I=-14:TP=-1:LRA=11:print_format=json", "-f", "null", "-"])
        start = analysis.stderr.rfind("{")
        loudness = json.JSONDecoder().raw_decode(analysis.stderr[start:])[0] if start >= 0 else {"unavailable": True}
        tail_diagnostics = command(["ffmpeg", "-nostdin", "-hide_banner", "-ss", str(max(0, duration - 0.1)), "-i", str(video), "-vn", "-af", "volumedetect", "-f", "null", "-"]).stderr
    digest = hashlib.sha256()
    with video.open("rb") as stream:
        for chunk in iter(lambda: stream.read(1024 * 1024), b""):
            digest.update(chunk)
    report = {
        "video": str(video), "sha256": digest.hexdigest(), "duration_s": duration,
        "probe": probe, "frame_sample_fps": 2,
        "source_time_base": source_time_base,
        "frame_timestamp_basis": "sample_center_s is a nominal review-slot center, not the extracted frame time. source_pts_s is the decoded source PTS before fps resampling, with FFmpeg's normal input timestamp handling. sample_output_pts_s is the resampled output PTS. Exact timed claims still require independent seek/frame verification.",
        "frames": [{"path": str(frame), "sample_center_s": (index + 0.5) / 2, **timestamps[index]} for index, frame in enumerate(images)],
        "audio": str(audio) if audio else None,
        "loudness_measurements": loudness, "last_100ms_volume_log": tail_diagnostics,
        "quality_status": "requires_visual_and_audio_review",
        "remaining_review": ["Read frames across the complete cut and inspect motion/transitions", "Listen and obtain actual transcript/word timings when speech is present", "Compare exact locked copy, brand/product, identity/world, captions and delivery plan", "Extract and verify every timestamped visual claim"],
    }
    (destination / "evidence.json").write_text(json.dumps(report, indent=2) + "\n")
    return report


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("video")
    parser.add_argument("destination")
    args = parser.parse_args()
    print(json.dumps(collect(args.video, args.destination)))


if __name__ == "__main__":
    main()

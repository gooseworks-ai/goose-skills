#!/usr/bin/env python3
"""Collect actual video/audio evidence. Never declare creative quality approved."""
import argparse
import hashlib
import json
import math
from pathlib import Path
import shutil
import subprocess


def command(args, timeout=300):
    return subprocess.run(args, check=True, capture_output=True, text=True, timeout=timeout)


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
    command(["ffmpeg", "-nostdin", "-v", "error", "-i", str(video), "-an", "-vf", "fps=2,scale=720:-2", "-frames:v", "361", "-q:v", "3", str(frames / "%04d.jpg")])
    images = sorted(frames.glob("*.jpg"))
    if not images:
        raise ValueError("No reviewable frames were extracted")
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
        "frames": [{"path": str(frame), "sample_center_s": (index + 0.5) / 2} for index, frame in enumerate(images)],
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

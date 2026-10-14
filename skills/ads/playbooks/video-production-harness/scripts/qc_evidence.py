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
from array import array
import sys
import wave

from assembly_timeline import normalize_timeline


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


def audio_activity(audio, duration):
    """Whole-cut measurements, not a listening verdict or speech recognizer."""
    with wave.open(str(audio), 'rb') as handle:
        rate = handle.getframerate()
        samples = array('h', handle.readframes(handle.getnframes()))
        if sys.byteorder != 'little':
            samples.byteswap()
    samples = samples[:max(0, math.ceil(duration * rate))]
    windows = []
    stride = max(1, round(rate * 0.1))
    for start in range(0, len(samples), stride):
        values = samples[start:start + stride]
        rms = math.sqrt(sum(value * value for value in values) / len(values)) / 32768
        windows.append({'start_s': start / rate, 'end_s': min(duration, (start + len(values)) / rate),
                        'rms_dbfs': 20 * math.log10(rms) if rms else None,
                        'near_silent': rms < 10 ** (-45 / 20)})
    return windows


def silence_intervals(log, duration):
    intervals, opened = [], None
    for match in re.finditer(r'silence_(start|end):\s*([0-9.]+)', log):
        point = min(duration, float(match[2]))
        if match[1] == 'start':
            opened = point
        elif opened is not None:
            intervals.append({'start_s': opened, 'end_s': point}); opened = None
    if opened is not None:
        intervals.append({'start_s': opened, 'end_s': duration})
    return intervals


def collect(video, destination, timeline_path=None, words_path=None):
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
    activity = []
    near_silence = []
    if any(s.get("codec_type") == "audio" for s in streams):
        audio = destination / "audio.wav"
        command(["ffmpeg", "-nostdin", "-v", "error", "-i", str(video), "-vn", "-ac", "1", "-ar", "16000", "-c:a", "pcm_s16le", str(audio)])
        analysis = command(["ffmpeg", "-nostdin", "-hide_banner", "-i", str(video), "-vn", "-af", "loudnorm=I=-14:TP=-1:LRA=11:print_format=json", "-f", "null", "-"])
        start = analysis.stderr.rfind("{")
        loudness = json.JSONDecoder().raw_decode(analysis.stderr[start:])[0] if start >= 0 else {"unavailable": True}
        tail_diagnostics = command(["ffmpeg", "-nostdin", "-hide_banner", "-ss", str(max(0, duration - 0.1)), "-i", str(video), "-vn", "-af", "volumedetect", "-f", "null", "-"]).stderr
        activity = audio_activity(audio, duration)
        silence_log = command(['ffmpeg', '-nostdin', '-hide_banner', '-i', str(video), '-vn', '-af', 'silencedetect=noise=-45dB:d=0.25', '-f', 'null', '-']).stderr
        near_silence = silence_intervals(silence_log, duration)
    digest = hashlib.sha256()
    with video.open("rb") as stream:
        for chunk in iter(lambda: stream.read(1024 * 1024), b""):
            digest.update(chunk)
    final_sha = digest.hexdigest()
    supplied = json.loads(Path(timeline_path).read_text()) if timeline_path else None
    timeline = supplied.get('assembly_timeline', supplied) if isinstance(supplied, dict) else None
    assembly = normalize_timeline(timeline)
    if isinstance(supplied, dict) and supplied.get('output_sha256') not in (None, final_sha):
        assembly['status'] = 'invalid'; assembly['issues'].append('Assembly receipt refers to different final bytes')
    cuts = sorted({s[key] / 1000 for s in (assembly.get('timeline') or {}).get('segments', []) for key in ('start_ms', 'end_ms') if 0 < s[key] / 1000 < duration})
    cut_windows = [{'start_s':max(0,t-0.35),'end_s':min(duration,t+0.35),'cut_s':t} for t in cuts]
    words = json.loads(Path(words_path).read_text()) if words_path else None
    cut_words = {'status':'incomplete','issues':['Final-hash-bound measured word timestamps were not supplied'],'cuts_inside_words':[]}
    if isinstance(words, dict) and words.get('output_sha256') == final_sha and isinstance(words.get('words'), list):
        cut_words = {'status':'measured','issues':[],'cuts_inside_words':[]}
        for word in words['words']:
            start, end = word.get('start_s', word.get('start')), word.get('end_s', word.get('end'))
            if not isinstance(start,(int,float)) or not isinstance(end,(int,float)) or not math.isfinite(start) or not math.isfinite(end) or not 0 <= start < end <= duration:
                cut_words['issues'].append('A word timestamp is invalid; check recognition against the actual audio'); continue
            for cut in cuts:
                if start < cut < end:
                    cut_words['cuts_inside_words'].append({'cut_s':cut,'word':word.get('text', word.get('word')),'start_s':start,'end_s':end})
    expected_pauses = (assembly.get('timeline') or {}).get('pauses', [])
    unplanned_quiet = [gap for gap in near_silence if not any(p['start_ms']/1000 <= gap['start_s'] + 0.05 and p['end_ms']/1000 >= gap['end_s'] - 0.05 for p in expected_pauses)]
    report = {
        "video": str(video), "sha256": final_sha, "duration_s": duration,
        "probe": probe, "frame_sample_fps": 2,
        "source_time_base": source_time_base,
        "frame_timestamp_basis": "sample_center_s is a nominal review-slot center, not the extracted frame time. source_pts_s is the decoded source PTS before fps resampling, with FFmpeg's normal input timestamp handling. sample_output_pts_s is the resampled output PTS. Exact timed claims still require independent seek/frame verification.",
        "frames": [{"path": str(frame), "sample_center_s": (index + 0.5) / 2, **timestamps[index]} for index, frame in enumerate(images)],
        "audio": str(audio) if audio else None,
        "loudness_measurements": loudness, "last_100ms_volume_log": tail_diagnostics,
        "audio_activity_100ms": activity, "near_silence_intervals": near_silence,
        "activity_threshold_dbfs": -45, "unplanned_quiet_candidates": unplanned_quiet,
        "assembly_evidence": assembly, "cut_context_windows": cut_windows, "cut_word_comparison": cut_words,
        "review_capability": {"audio_perception": False, "motion_perception": False},
        "content_review_status": "incomplete",
        "quality_status": "requires_visual_and_audio_review",
        "remaining_review": ["Play the complete exact final at normal speed with actual sound and moving picture", "Inspect every join, quiet candidate and ending; listen to isolated speech and the final mix", "Compare recognized words with actual audio and approved copy; ASR may hallucinate in silence", "Verify product/actions, identity, captions and destination readability", "Bind actual reviewer capability, complete coverage and unresolved notes to this final hash and timeline revision"],
    }
    (destination / "evidence.json").write_text(json.dumps(report, indent=2) + "\n")
    return report


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("video")
    parser.add_argument("destination")
    parser.add_argument('--timeline', help='Source-linked timeline JSON or assembler receipt for these bytes')
    parser.add_argument('--words', help='JSON {output_sha256,words:[{text,start_s,end_s}]} measured from this final')
    args = parser.parse_args()
    print(json.dumps(collect(args.video, args.destination, args.timeline, args.words)))


if __name__ == "__main__":
    main()

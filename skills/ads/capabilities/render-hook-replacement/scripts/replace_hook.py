#!/usr/bin/env python3
"""Free, deterministic opening replacement. The original file is never edited.

Word/caption guards follow the source-span rules in render-street-interview's
edit_timeline.py, without its episode, transcription or provider dependencies.
"""
import argparse
import array
import hashlib
import json
import math
import os
from pathlib import Path
import re
import subprocess
import sys
import tempfile


def run(args, *, binary=False):
    result = subprocess.run([str(a) for a in args], stdout=subprocess.PIPE,
                            stderr=subprocess.PIPE, check=False)
    if result.returncode:
        raise ValueError(f"{Path(args[0]).name} failed: {result.stderr.decode(errors='replace')[-3000:]}")
    return result.stdout if binary else result.stdout.decode()


def ffmpeg(*args):
    return run(["ffmpeg", "-hide_banner", "-loglevel", "error", "-nostdin", "-y", *args])


def file_hash(path):
    digest = hashlib.sha256()
    with Path(path).open("rb") as stream:
        for chunk in iter(lambda: stream.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def number(value, name, *, positive=False):
    if isinstance(value, bool) or not isinstance(value, (int, float)) or not math.isfinite(value):
        raise ValueError(f"{name} must be a finite number")
    if value < 0 or (positive and value <= 0):
        raise ValueError(f"{name} must be {'positive' if positive else 'nonnegative'}")
    return float(value)


def resolve(base, value, name):
    if not isinstance(value, str) or not value.strip():
        raise ValueError(f"{name} needs a local path")
    path = Path(value).expanduser()
    return (path if path.is_absolute() else base / path).resolve()


def probe(path):
    if not path.is_file() or path.stat().st_size == 0:
        raise ValueError(f"media missing or empty: {path}")
    with path.open("rb") as stream:
        prefix = stream.read(80)
    if prefix.startswith(b"version https://git-lfs.github.com/spec/"):
        raise ValueError(f"media is a Git LFS pointer; fetch the actual file: {path}")
    data = json.loads(run(["ffprobe", "-v", "error", "-show_streams", "-show_format", "-of", "json", path]))
    video = next((s for s in data["streams"] if s["codec_type"] == "video"), None)
    if video is None:
        raise ValueError(f"media has no video stream: {path}")
    audio = next((s for s in data["streams"] if s["codec_type"] == "audio"), None)
    num, den = video["avg_frame_rate"].split("/")
    fps = float(num) / float(den) if float(den) else 0
    duration = float(video.get("duration") or data["format"]["duration"])
    if fps <= 0 or duration <= 0:
        raise ValueError(f"media needs positive video duration and frame rate: {path}")
    return {"duration_sec": duration, "container_duration_sec": float(data["format"]["duration"]), "width": video["width"], "height": video["height"],
            "fps": fps, "fps_fraction": video["avg_frame_rate"], "pix_fmt": video["pix_fmt"],
            "sar": video.get("sample_aspect_ratio", "1:1"),
            "rotation": next((s.get("rotation", 0) for s in video.get("side_data_list", [])
                              if "rotation" in s), 0),
            "video_start_sec": float(video.get("start_time", 0)),
            "audio": {"sample_rate": int(audio["sample_rate"]), "channels": audio["channels"],
                      "channel_layout": audio.get("channel_layout") or {1: "mono", 2: "stereo"}.get(audio["channels"]),
                      "start_sec": float(audio.get("start_time", 0)),
                      "duration_sec": float(audio.get("duration") or data["format"]["duration"])} if audio else None}


def frame_times(path):
    data = json.loads(run(["ffprobe", "-v", "error", "-select_streams", "v:0", "-show_frames",
                          "-show_entries", "frame=best_effort_timestamp_time", "-of", "json", path]))
    return [float(f["best_effort_timestamp_time"]) for f in data["frames"]]


def read_words(config, base, source_hash):
    words = config.get("words")
    if config.get("word_times"):
        bound = json.loads(resolve(base, config["word_times"], "word_times").read_text())
        if not isinstance(bound, dict) or bound.get("source_sha256") != source_hash:
            raise ValueError("word_times must contain this original source_sha256; measure again")
        words = bound.get("words")
    if words is None:
        return None
    if not isinstance(words, list) or not words:
        raise ValueError("words must be a nonempty list of measured original word timings")
    result, previous = [], -1
    for word in words:
        if isinstance(word, (list, tuple)) and len(word) == 3:
            word = {"start": word[0], "end": word[1], "word": word[2]}
        if not isinstance(word, dict):
            raise ValueError("each measured word needs start, end and word/text")
        start, end = number(word.get("start"), "word.start"), number(word.get("end"), "word.end")
        text = word.get("word", word.get("text"))
        if start >= end or start < previous or not isinstance(text, str) or not text.strip():
            raise ValueError("measured words must be ordered, nonempty and have start < end")
        result.append({"start": start, "end": end, "word": text})
        previous = start
    return result


def guard_words(words, cut, duration):
    for word in words or []:
        if word["end"] > duration + 0.001:
            raise ValueError("measured word is outside original video duration")
        if word["start"] + 0.001 < cut < word["end"] - 0.001:
            raise ValueError(f"hook boundary cuts spoken word {word['word']!r} at "
                             f"{word['start']:.3f}–{word['end']:.3f}; choose a silence/word boundary")


def srt_seconds(text):
    h, m, s = text.strip().replace(",", ".").split(":")
    return int(h) * 3600 + int(m) * 60 + float(s)


def read_captions(path):
    if path.suffix.lower() == ".json":
        data = json.loads(path.read_text())
        rows = data.get("cues", data.get("captions")) if isinstance(data, dict) else data
        if not isinstance(rows, list):
            raise ValueError("caption JSON must be an array or {cues:[...]} with start, end, text")
        return rows
    if path.suffix.lower() != ".srt":
        raise ValueError("separate captions must be SRT or timed JSON; ASS/VTT need an explicit adapter")
    rows = []
    for block in re.split(r"\n\s*\n", path.read_text(encoding="utf-8-sig").strip()):
        lines = block.splitlines()
        timing = next((i for i, line in enumerate(lines) if " --> " in line), None)
        if timing is None:
            raise ValueError("invalid SRT cue: missing timing")
        left, right = lines[timing].split(" --> ")
        rows.append({"start": srt_seconds(left), "end": srt_seconds(right),
                     "text": "\n".join(lines[timing + 1:])})
    return rows


def shift_captions(rows, cut, replacement, words, duration):
    result = []
    for original in rows:
        row = dict(original)
        start, end = number(row.get("start"), "caption.start"), number(row.get("end"), "caption.end")
        if start >= end or end > duration + 0.05 or not isinstance(row.get("text"), str):
            raise ValueError("invalid separate caption interval/text")
        if end <= cut + 0.001:
            continue
        if start < cut - 0.001:
            if not words:
                raise ValueError("caption crosses hook boundary; supply measured original words or change the boundary")
            inside = [w for w in words if start <= (w["start"] + w["end"]) / 2 < end]
            kept = [w for w in inside if w["start"] >= cut - 0.001]
            if not inside:
                raise ValueError("caption crossing boundary contains no measured words")
            if not kept:
                continue
            start = max(cut, kept[0]["start"])
            row["text"] = " ".join(w["word"] for w in kept)
        row.update(start=round(start - cut + replacement, 6), end=round(end - cut + replacement, 6))
        result.append(row)
    return result


def srt_stamp(value):
    milliseconds = round(value * 1000)
    h, remainder = divmod(milliseconds, 3600000)
    m, remainder = divmod(remainder, 60000)
    s, ms = divmod(remainder, 1000)
    return f"{h:02d}:{m:02d}:{s:02d},{ms:03d}"


def write_captions(path, rows):
    path.parent.mkdir(parents=True, exist_ok=True)
    if path.suffix.lower() == ".srt":
        path.write_text("\n\n".join(f"{i + 1}\n{srt_stamp(r['start'])} --> {srt_stamp(r['end'])}\n{r['text']}"
                                   for i, r in enumerate(rows)) + "\n", encoding="utf-8")
    else:
        path.write_text(json.dumps({"cues": rows}, indent=2) + "\n", encoding="utf-8")


def frame_hashes(path, start):
    result = run(["ffmpeg", "-v", "error", "-nostdin", "-i", path, "-map", "0:v:0", "-an",
                  "-vf", f"trim=start={start:.9f},setpts=PTS-STARTPTS", "-fps_mode", "passthrough",
                  "-f", "framemd5", "-"])
    return [line.rsplit(",", 1)[-1].strip() for line in result.splitlines() if line and not line.startswith("#")]


def compare_video(source, output, cut, replacement, work):
    expected, actual = frame_hashes(source, cut), frame_hashes(output, replacement)
    stats = work / "retained-body-psnr.txt"
    filters = (f"[0:v]trim=start={cut:.9f},setpts=PTS-STARTPTS[s];"
               f"[1:v]trim=start={replacement:.9f},setpts=PTS-STARTPTS[o];"
               f"[s][o]psnr=stats_file='{filter_path(stats)}':shortest=1[v]")
    ffmpeg("-i", source, "-i", output, "-filter_complex", filters, "-map", "[v]", "-an", "-f", "null", "-")
    scores = [float(value) for value in re.findall(r"psnr_avg:([0-9.inf]+)", stats.read_text())]
    minimum = min(scores) if scores else 0
    exact = sum(a == b for a, b in zip(expected, actual))
    passed = bool(expected) and len(expected) == len(actual) == len(scores) and minimum >= 45
    return passed, {"method": "every retained decoded frame: count/order plus per-frame PSNR", "frames": len(expected),
                    "output_frames": len(actual), "compared_frames": len(scores), "exact_decoded_frames": exact,
                    "minimum_psnr_db": minimum if math.isfinite(minimum) else "infinite", "required_minimum_psnr_db": 45,
                    "encoder": "libx264 High yuv420p CRF 12", "note": "Browser-compatible high-quality encode. Compressed bytes and some pixels differ within measured tolerance; no content/order/crop/grade/speed change."}


def compare_audio(source, output, cut, replacement, duration, audio, work):
    if audio is None:
        output_audio = probe(output)["audio"]
        if output_audio:
            silence = work / "silent-body.f32"
            ffmpeg("-i", output, "-map", "0:a:0", "-vn", "-af", f"atrim=start={replacement:.9f},asetpts=PTS-STARTPTS",
                   "-f", "f32le", silence)
            samples = array.array("f")
            samples.frombytes(silence.read_bytes())
            rms = math.sqrt(sum(s * s for s in samples) / max(len(samples), 1))
            return rms <= 0.0001, {"source_has_audio": False, "retained_body_rms": rms,
                                  "max_retained_body_rms": 0.0001, "note": "Original body has no audio; silence retained after any hook audio."}
        return True, {"source_has_audio": False, "note": "Original body has no audio stream and output has no audio stream."}
    paths = [work / "source-body.f32", work / "output-body.f32"]
    for path, start, destination in zip([source, output], [cut, replacement], paths):
        ffmpeg("-i", path, "-map", "0:a:0", "-vn", "-af",
               f"atrim=start={start:.9f}:end={start + duration:.9f},asetpts=PTS-STARTPTS,apad,atrim=duration={duration:.9f}",
               "-ar", audio["sample_rate"], "-ac", audio["channels"], "-f", "f32le", destination)
    count, xx, yy, xy, error = 0, 0.0, 0.0, 0.0, 0.0
    with paths[0].open("rb") as left, paths[1].open("rb") as right:
        while True:
            a, b = left.read(4 * 65536), right.read(4 * 65536)
            if not a and not b:
                break
            if len(a) != len(b):
                return False, {"error": "retained audio sample count differs"}
            x, y = array.array("f"), array.array("f")
            x.frombytes(a)
            y.frombytes(b)
            for u, v in zip(x, y):
                xx += u * u
                yy += v * v
                xy += u * v
                error += (u - v) ** 2
            count += len(x)
    if not count:
        return False, {"error": "retained audio is empty"}
    nrmse = math.sqrt(error / max(xx, 1e-12))
    correlation = xy / math.sqrt(xx * yy) if xx > 1e-12 and yy > 1e-12 else (1.0 if error < count * 1e-8 else 0.0)
    passed = (nrmse <= 0.08 and correlation >= 0.99) if xx > count * 1e-8 else error / count <= 1e-8
    return passed, {"source_has_audio": True, "samples": count, "normalized_rms_error": nrmse,
                    "correlation": correlation, "max_normalized_rms_error": 0.08, "min_correlation": 0.99,
                    "codec": "aac 256k", "note": "Same sample positions, no speed change, gain, crossfade or music replacement. Lossy encode tolerance; compressed bytes differ."}


def filter_path(path):
    return str(path).replace("\\", "\\\\").replace(":", "\\:").replace("'", "'\\''")


def text_layer(text, font_path, width, height, foreground, output, *, at_bottom=False):
    try:
        from PIL import Image, ImageDraw, ImageFont
    except ImportError:
        raise ValueError("text treatment needs Pillow; install with python3 -m pip install Pillow")
    layer = Image.new("RGBA", (width, height), (0, 0, 0, 0))
    draw = ImageDraw.Draw(layer)
    font = ImageFont.truetype(str(font_path), round(width * (0.055 if at_bottom else 0.072)))
    lines = []
    for paragraph in text.splitlines():
        current = ""
        for word in paragraph.split():
            candidate = (current + " " + word).strip()
            if draw.textlength(candidate, font=font) > width * 0.8 and current:
                lines.append(current)
                current = word
            else:
                current = candidate
        lines.append(current)
    wrapped = "\n".join(lines)
    bounds = draw.multiline_textbbox((0, 0), wrapped, font=font, align="center", spacing=8)
    if bounds[2] - bounds[0] > width * 0.9 or bounds[3] - bounds[1] > height * 0.7:
        raise ValueError("hook text does not fit safe area; shorten copy or add line breaks")
    x = (width - (bounds[2] - bounds[0])) / 2 - bounds[0]
    y = height * 0.82 if at_bottom else (height - (bounds[3] - bounds[1])) / 2 - bounds[1]
    draw.multiline_text((x, y), wrapped, font=font, fill=foreground, align="center", spacing=8,
                        stroke_width=1, stroke_fill="#000000" if at_bottom else foreground)
    layer.save(output)
    return output


def text_hook(hook, source, base, work):
    text = hook.get("text")
    if not isinstance(text, str) or not text.strip() or len(text) > 180:
        raise ValueError("text hook needs 1–180 characters; use short, approved hook copy")
    font = resolve(base, hook.get("font_path"), "hook.font_path")
    if not font.is_file():
        raise ValueError("text hook needs an existing licensed font_path")
    duration = number(hook.get("duration_sec"), "hook.duration_sec", positive=True)
    colors = [hook.get("background", "#14213d"), hook.get("foreground", "#ffffff")]
    if any(not isinstance(c, str) or not re.fullmatch(r"#[0-9a-fA-F]{6}", c) for c in colors):
        raise ValueError("text hook colors must be #RRGGBB")
    layer, output = work / "hook-text.png", work / "text-hook.mkv"
    text_layer(text, font, source["width"], source["height"], colors[1], layer)
    ffmpeg("-f", "lavfi", "-i", f"color=c={colors[0]}:s={source['width']}x{source['height']}:r={source['fps_fraction']}:d={duration}",
           "-loop", "1", "-framerate", source["fps_fraction"], "-i", layer,
           "-filter_complex", "[1:v]fade=t=in:d=0.18:alpha=1[text];[0:v][text]overlay=x=0:y='30*(1-min(t/0.3,1))':shortest=1,format=yuv420p[v]",
           "-map", "[v]", "-t", duration, "-an", "-c:v", "libx264", "-crf", "0", "-preset", "fast", output)
    return output


def replace(config, base):
    if not isinstance(config, dict) or not isinstance(config.get("source"), dict) or not isinstance(config.get("hook"), dict):
        raise ValueError("config needs source and hook objects")
    output_config = config.get("output")
    if isinstance(output_config, str):
        output_config = {"path": output_config}
    if not isinstance(output_config, dict):
        raise ValueError("config needs output:{path}")
    source = resolve(base, config["source"].get("path"), "source.path")
    output = resolve(base, output_config.get("path"), "output.path")
    manifest_path = resolve(base, output_config.get("manifest_path", str(output) + ".manifest.json"), "output.manifest_path")
    hook = config["hook"]
    hook_path = resolve(base, hook["path"], "hook.path") if hook.get("path") else None
    if output in [source, hook_path] or manifest_path in [source, hook_path, output]:
        raise ValueError("output/manifest must not overwrite an input or each other")
    if output.exists() or manifest_path.exists():
        raise ValueError("output already exists; use a new version path")
    if output.suffix.lower() != ".mp4":
        raise ValueError("output.path must end in .mp4")
    source_hash = file_hash(source)
    if config["source"].get("sha256") and config["source"]["sha256"] != source_hash:
        raise ValueError("source SHA256 mismatch; selected original changed")
    info = probe(source)
    if info["pix_fmt"] != "yuv420p" or info["sar"] not in ["1:1", "0:1", "N/A"] or info["rotation"]:
        raise ValueError("original must be unrotated square-pixel 8-bit yuv420p; normalize an explicit source version first")
    if abs(info["video_start_sec"]) > 0.001 or (info["audio"] and abs(info["audio"]["start_sec"]) > 0.025):
        raise ValueError("original streams have nonzero start offsets; normalize an explicit source version first")
    times = frame_times(source)
    if len(times) < 2 or any(abs((b - a) - 1 / info["fps"]) > 0.001 for a, b in zip(times, times[1:])):
        raise ValueError("original is variable-frame-rate; normalize an explicit source version before replacement")
    video_end = times[-1] + 1 / info["fps"]
    audio_end = info["audio"]["start_sec"] + info["audio"]["duration_sec"] if info["audio"] else video_end
    if max(audio_end, info["container_duration_sec"]) > video_end + 0.002:
        raise ValueError("original audio/container extends beyond its final video frame; create an explicitly reviewed source version with a last-frame hold before replacement, so no original audio tail is dropped")
    cut = number(config.get("hook_end_sec"), "hook_end_sec", positive=True)
    if cut >= times[-1]:
        raise ValueError("hook_end_sec must leave at least one complete original body frame")
    words = read_words(config, base, source_hash)
    guard_words(words, cut, info["duration_sec"])
    first_frame = next(t for t in times if t >= cut - 1e-7)
    captions = config.get("captions")
    caption_path, caption_output, rows = None, None, None
    if captions:
        if not isinstance(captions, dict):
            raise ValueError("captions must be {path,output_path?}")
        caption_path = resolve(base, captions.get("path"), "captions.path")
        caption_output = resolve(base, captions.get("output_path", str(output.with_suffix(caption_path.suffix))), "captions.output_path")
        if caption_output in [source, hook_path, caption_path, output, manifest_path] or caption_output.exists():
            raise ValueError("shifted caption output must be a new path, separate from inputs/video/manifest")
        rows = read_captions(caption_path)
        shift_captions(rows, cut, 0, words, info["duration_sec"])  # preflight before encoding
    if bool(hook_path) == bool(hook.get("text")):
        raise ValueError("hook needs exactly one of path or text")
    hook_hash = file_hash(hook_path) if hook_path else None
    if hook_path:
        probe(hook_path)
    output.parent.mkdir(parents=True, exist_ok=True)
    manifest_path.parent.mkdir(parents=True, exist_ok=True)
    with tempfile.TemporaryDirectory(prefix="hook-replacement-", dir=output.parent) as temporary:
        work = Path(temporary)
        original_hook = hook_path or text_hook(hook, info, base, work)
        hook_info = probe(original_hook)
        normalized = work / "normalized-hook.mkv"
        vf = (f"fps={info['fps_fraction']},scale={info['width']}:{info['height']}:force_original_aspect_ratio=decrease,"
              f"pad={info['width']}:{info['height']}:(ow-iw)/2:(oh-ih)/2,setsar=1,format=yuv420p,setpts=PTS-STARTPTS")
        ffmpeg("-i", original_hook, "-an", "-vf", vf, "-c:v", "libx264", "-crf", "0", "-preset", "fast", normalized)
        hook_duration = len(frame_times(normalized)) / info["fps"]
        body_frames = len([t for t in times if t >= cut - 1e-7])
        expected_duration = hook_duration + info["duration_sec"] - cut
        filters = [f"[0:v]setpts=PTS-STARTPTS[hv]", f"[1:v]trim=start={cut:.9f},setpts=PTS-STARTPTS[bv]",
                   "[hv][bv]concat=n=2:v=1:a=0[v]"]
        args = ["-i", normalized, "-i", source]
        audio = info["audio"]
        target_audio = audio or hook_info["audio"]
        if target_audio:
            rate, layout = target_audio["sample_rate"], target_audio["channel_layout"]
            if not layout:
                raise ValueError("unknown channel layout; supply mono/stereo or a defined original layout")
            if hook_info["audio"]:
                args += ["-i", original_hook]
                filters.append(f"[2:a]aresample={rate},aformat=channel_layouts={layout},asetpts=PTS-STARTPTS,apad,atrim=duration={hook_duration:.9f}[ha]")
            else:
                filters.append(f"anullsrc=r={rate}:cl={layout},atrim=duration={hook_duration:.9f}[ha]")
            # Keep the complete source audio tail, including a subframe remainder.
            # The final original video frame remains displayed while that tail ends.
            body_duration = info["duration_sec"] - cut
            if audio:
                filters.append(f"[1:a]atrim=start={cut:.9f}:end={info['duration_sec']:.9f},asetpts=PTS-STARTPTS,apad,atrim=duration={body_duration:.9f}[ba]")
            else:
                filters.append(f"anullsrc=r={rate}:cl={layout},atrim=duration={body_duration:.9f}[ba]")
            filters.append("[ha][ba]concat=n=2:v=0:a=1[a]")
        candidate = work / "candidate.mp4"
        args += ["-filter_complex", ";".join(filters), "-map", "[v]", "-c:v", "libx264", "-crf", "12", "-profile:v", "high", "-preset", "fast", "-pix_fmt", "yuv420p", "-fps_mode", "passthrough"]
        if target_audio:
            args += ["-map", "[a]", "-c:a", "aac", "-b:a", "256k", "-ar", target_audio["sample_rate"]]
        args += ["-movflags", "+faststart", candidate]
        ffmpeg(*args)
        rendered = probe(candidate)
        video_pass, video_detail = compare_video(source, candidate, cut, hook_duration, work)
        audio_pass, audio_detail = compare_audio(source, candidate, cut, hook_duration, info["duration_sec"] - cut, audio, work)
        unchanged = file_hash(source) == source_hash and (not hook_path or file_hash(hook_path) == hook_hash)
        duration_pass = abs(rendered["container_duration_sec"] - expected_duration) <= 1 / info["fps"] + 0.002
        if not (video_pass and audio_pass and unchanged and duration_pass):
            raise ValueError(f"retained-body verification failed; original untouched: video={video_pass}, audio={audio_pass}, source={unchanged}, duration={duration_pass}; audio detail={audio_detail}")
        shifted = shift_captions(rows, cut, hook_duration, words, info["duration_sec"]) if rows is not None else None
        if shifted is not None:
            write_captions(caption_output, shifted)
        output_hash = file_hash(candidate)
        manifest = {"version": 1, "status": "needs_review", "source": {"path": str(source), "sha256": source_hash,
                    "project_id": config["source"].get("project_id"), "render_id": config["source"].get("render_id"), "probe": info},
                    "hook": {"path": str(hook_path) if hook_path else None, "sha256": hook_hash, "treatment": "supplied-clip" if hook_path else "text", "text": hook.get("text"), "source_duration_sec": hook_info["duration_sec"]},
                    "hook_end_sec": cut, "body_start_sec": cut, "replacement_duration_sec": hook_duration,
                    "new_body_start_sec": hook_duration, "duration_delta_sec": round(hook_duration - cut, 9),
                    "output": {"path": str(output), "sha256": output_hash, "duration_sec": rendered["container_duration_sec"], "video_duration_sec": rendered["duration_sec"]},
                    "captions": {"path": str(caption_output) if caption_output else None, "source_path": str(caption_path) if caption_path else None,
                                 "source_sha256": file_hash(caption_path) if caption_path else None, "retained_cues": len(shifted) if shifted is not None else None,
                                 "burned_in": "preserved in original body frames, not reburned"},
                    "verification": {"source_unchanged": unchanged, "body_video_preserved": video_pass, "body_audio_preserved": audio_pass,
                                     "caption_timing_preserved": True, "duration_matches": duration_pass,
                                     "video": {**video_detail, "first_kept_source_frame_sec": first_frame,
                                               "frame_grid_offset_sec": round(first_frame - cut, 9)},
                                     "audio": audio_detail, "word_boundary": "checked against supplied measured words" if words else "not measured; agent must review speech at join"},
                    "review": {"status": "needs_review", "source_sha256": source_hash, "output_sha256": output_hash,
                               "checked_at": None, "required": ["watch complete finished video", "listen to join and entire retained body", "check caption/text/brand facts", "compare ending with selected original"]},
                    "media_generation_cost_usd": 0}
        os.replace(candidate, output)
        manifest_path.write_text(json.dumps(manifest, indent=2) + "\n", encoding="utf-8")
        return manifest


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--config", type=Path, required=True)
    args = parser.parse_args()
    try:
        path = args.config.resolve()
        result = replace(json.loads(path.read_text()), path.parent)
        print(json.dumps({"status": result["status"], "output": result["output"], "verification": result["verification"]}, indent=2))
    except (ValueError, OSError, KeyError, TypeError, json.JSONDecodeError) as error:
        print(f"Hook replacement blocked: {error}", file=sys.stderr)
        return 2
    return 0


if __name__ == "__main__":
    sys.exit(main())

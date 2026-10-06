#!/usr/bin/env python3
"""Free, deterministic montage assembly with ffmpeg.

EDL -> normalized hard-cut concat -> burned captions -> VO over a ducked music bed.
Needs python3 (stdlib) and ffmpeg/ffprobe. Pillow is optional: it draws the captions when
the local ffmpeg has no libass (Homebrew's default ffmpeg has none). No network, no keys,
no provider calls.

Subcommands (each prints a one-line JSON summary on stdout):

  edl       check a spec and resolve it to edl.json (every file probed with ffprobe)
  assemble  normalize each EDL segment (size, fps, square pixels, yuv420p) and hard-cut
            them together in order with the filter_complex concat filter
  captions  burn an SRT, a JSON cue list, or word timings (one cue per N words) into a video
  mix       lay a VO over the video and an optional music bed that ducks under the VO
            (sidechain compression), then master to -14 LUFS / -1 dBTP (two-pass loudnorm)
  run       edl -> assemble -> captions -> mix from one spec; writes manifest.json

    montage.py edl      --spec spec.json --out edl.json
    montage.py assemble --edl edl.json --out body.mp4
    montage.py captions --video body.mp4 --srt captions.srt --out captioned.mp4
    montage.py mix      --video captioned.mp4 --vo vo.mp3 --music bed.mp3 --out final.mp4
    montage.py run      --spec spec.json --out final.mp4 [--workdir work/]

Times are seconds (number) or a timecode string ("SS", "MM:SS", "HH:MM:SS", optional
".ms"). See ../SKILL.md for the spec format.

Exit codes: 0 ok, 1 ffmpeg failed, 2 bad spec or arguments, 3 missing tool (ffmpeg,
ffprobe, or a caption renderer).
"""
from __future__ import annotations

import argparse
import json
import math
import re
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path

DEFAULT_W, DEFAULT_H, DEFAULT_FPS = 1080, 1920, 30
# A video clip may run up to this much short of its window; its last frame is held.
SHORT_TOLERANCE_S = 0.1
IMAGE_FORMATS = {"png_pipe", "jpeg_pipe", "webp_pipe", "bmp_pipe", "tiff_pipe", "image2"}
PAN_SUPERSAMPLE = 2  # zoompan works on whole pixels; a 2x source keeps slow pans smooth

MIX_DEFAULTS = {
    "vo": None,
    "vo_start": 0.0,
    "vo_lufs": -16.0,         # VO stage level (same internal target as mix-master)
    "music": None,
    "music_start": 0.0,       # where the bed enters on the timeline
    "music_lufs": -24.0,      # bed level between VO lines, before ducking
    "music_fade_in": 0.0,
    "music_fade_out": 1.0,
    "duck_threshold": 0.02,   # sidechain key level (linear) above which the bed ducks
    "duck_ratio": 20.0,       # ffmpeg caps sidechaincompress at 20:1
    "duck_attack": 20.0,      # ms
    "duck_release": 400.0,    # ms
    "target_lufs": -14.0,     # master loudness; None skips the final loudnorm
    "target_tp": -1.0,
    "target_lra": 11.0,
    "keep_video_audio": False,
    "video_audio_db": 0.0,
}

CAPTION_DEFAULTS = {
    "renderer": "auto",       # auto | pil | libass
    "font": None,             # TTF/OTF path (Pillow); GW_CAPTION_FONT env also works
    "font_name": "Arial",     # family name (libass)
    "font_size": None,        # px; default 4.5% of the frame height
    "color": "#FFFFFF",
    "outline_color": "#000000",
    "outline": None,          # px; default 8% of the font size
    "y": 0.72,                # centre of the caption block, fraction of the height
    "max_width": 0.86,        # fraction of the width before a line wraps
}

FONT_CANDIDATES = [
    "/System/Library/Fonts/Supplemental/Arial Bold.ttf",
    "/Library/Fonts/Arial Bold.ttf",
    "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
    "/usr/share/fonts/dejavu/DejaVuSans-Bold.ttf",
    "/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf",
    "/usr/share/fonts/liberation-sans/LiberationSans-Bold.ttf",
    r"C:\Windows\Fonts\arialbd.ttf",
]


class SpecError(Exception):
    exit_code = 2


class ToolError(Exception):
    exit_code = 3


class FFmpegError(Exception):
    exit_code = 1


# ---------------------------------------------------------------- shared helpers

def need_tools(*tools):
    for tool in tools:
        if not shutil.which(tool):
            raise ToolError(f"{tool} not found on PATH (macOS: brew install ffmpeg; Debian/Ubuntu: apt install ffmpeg)")


def run_ff(cmd, cwd=None):
    proc = subprocess.run([str(c) for c in cmd], capture_output=True, text=True, cwd=cwd)
    if proc.returncode != 0:
        tail = "\n".join(proc.stderr.strip().splitlines()[-12:])
        raise FFmpegError(f"{Path(str(cmd[0])).name} failed (exit {proc.returncode}):\n{tail}")
    return proc


def ffmpeg_cmd():
    return ["ffmpeg", "-y", "-hide_banner", "-nostdin", "-loglevel", "error"]


def parse_time(value) -> float:
    """Seconds (number) or 'HH:MM:SS.ms' / 'MM:SS' / 'SS' to float seconds."""
    if isinstance(value, bool):
        raise ValueError(f"bad time value: {value!r}")
    if isinstance(value, (int, float)):
        return float(value)
    s = str(value).strip()
    if not s:
        raise ValueError("empty time value")
    try:
        parts = [float(p) for p in s.split(":")]
    except ValueError as e:
        raise ValueError(f"bad time value: {value!r}") from e
    if len(parts) == 1:
        return parts[0]
    if len(parts) == 2:
        return parts[0] * 60 + parts[1]
    if len(parts) == 3:
        return parts[0] * 3600 + parts[1] * 60 + parts[2]
    raise ValueError(f"bad time value: {value!r}")


def _num(value):
    try:
        f = float(value)
    except (TypeError, ValueError):
        return None
    return f if math.isfinite(f) else None


def _rate(value):
    if not value or value in ("0/0", "0/1"):
        return None
    if "/" in str(value):
        n, d = str(value).split("/", 1)
        return float(n) / float(d) if float(d) else None
    return _num(value)


def probe(path) -> dict:
    out = run_ff(["ffprobe", "-v", "error", "-show_entries",
                  "format=duration,format_name:stream=codec_type,codec_name,width,height,"
                  "avg_frame_rate,r_frame_rate,sample_aspect_ratio,duration,pix_fmt",
                  "-of", "json", str(path)]).stdout
    data = json.loads(out or "{}")
    fmt = data.get("format", {})
    streams = data.get("streams", [])
    video = next((s for s in streams if s.get("codec_type") == "video"), None)
    audio = next((s for s in streams if s.get("codec_type") == "audio"), None)
    duration = _num((video or {}).get("duration")) or _num((audio or {}).get("duration")) or _num(fmt.get("duration"))
    return {
        "kind": "image" if fmt.get("format_name") in IMAGE_FORMATS else "video",
        "has_video": video is not None,
        "has_audio": audio is not None,
        "duration": duration,
        "width": (video or {}).get("width"),
        "height": (video or {}).get("height"),
        "fps": _rate((video or {}).get("avg_frame_rate")) or _rate((video or {}).get("r_frame_rate")),
        "sample_aspect_ratio": (video or {}).get("sample_aspect_ratio"),
        "pix_fmt": (video or {}).get("pix_fmt"),
    }


def load_json(path: Path):
    try:
        return json.loads(Path(path).read_text(encoding="utf-8"))
    except FileNotFoundError:
        raise SpecError(f"file not found: {path}")
    except json.JSONDecodeError as e:
        raise SpecError(f"invalid JSON in {path}: {e}")


def resolve_path(value, base: Path) -> Path:
    p = Path(str(value)).expanduser()
    return p if p.is_absolute() else (base / p)


WORD_SHAPES = ("[{text|word, start, end}], {words: [...]}, {segments: [{words: [...]}]}, "
               "or {chunks: [{text, timestamp: [start, end]}]}")


def load_words(path: Path) -> list:
    """Word timings in any of the shapes transcribers write, as [{text, start, end}] by start.

    Accepts a flat list; {"words": [...]} (OpenAI/ElevenLabs, `word` or `text` key);
    Whisper's {"segments": [{"words": [...]}]} (goose-studio transcribe-audio-fal); and fal's
    {"chunks": [{"text", "timestamp": [start, end]}]}. Skips entries with no time and
    ElevenLabs `spacing` entries, and strips the leading space Whisper puts on each word.
    """
    data = load_json(path)
    entries = None
    if isinstance(data, list):
        entries = data
    elif isinstance(data, dict):
        if isinstance(data.get("words"), list):
            entries = data["words"]
        elif isinstance(data.get("segments"), list):
            entries = [w for seg in data["segments"] if isinstance(seg, dict) for w in (seg.get("words") or [])]
        elif isinstance(data.get("chunks"), list):
            entries = data["chunks"]
    if entries is None:
        raise SpecError(f"{path}: no word timings found; expected {WORD_SHAPES}")
    out = []
    for i, w in enumerate(entries):
        if not isinstance(w, dict) or w.get("type") == "spacing":
            continue
        text = w.get("text") if w.get("text") is not None else w.get("word")
        start, end = w.get("start"), w.get("end")
        if isinstance(w.get("timestamp"), (list, tuple)) and len(w["timestamp"]) == 2:
            start, end = w["timestamp"]
        start, end = _num(start), _num(end)
        if text is None or start is None or end is None or not str(text).strip():
            continue
        out.append({"text": str(text).strip(), "start": start, "end": max(end, start)})
    if not out:
        raise SpecError(f"{path}: no timed words found; expected {WORD_SHAPES}")
    return sorted(out, key=lambda w: w["start"])


def summary(obj):
    print(json.dumps(obj, ensure_ascii=False))
    return 0


# ---------------------------------------------------------------- edl

def _check_pan(pan, where):
    if not isinstance(pan, dict):
        raise SpecError(f"{where}: pan must be an object with from/to")
    out = {}
    for key in ("from", "to"):
        end = pan.get(key, {}) or {}
        if not isinstance(end, dict):
            raise SpecError(f"{where}: pan.{key} must be {{x, y, zoom}}")
        x, y, z = (_num(end.get("x", 0.5)), _num(end.get("y", 0.5)), _num(end.get("zoom", 1.0)))
        if x is None or y is None or z is None or not (0 <= x <= 1 and 0 <= y <= 1) or z < 1:
            raise SpecError(f"{where}: pan.{key} needs x and y in 0..1 and zoom >= 1")
        out[key] = {"x": x, "y": y, "zoom": z}
    return out


def resolve_spec(spec: dict, base: Path, strict: bool = False) -> dict:
    """Check a montage spec and return the resolved EDL (absolute paths, probed sources,
    exact frame counts on the output timeline)."""
    if not isinstance(spec, dict):
        raise SpecError("spec must be a JSON object")
    output = dict(spec.get("output") or {})
    for key in ("width", "height", "fps", "fit"):
        if key in spec and key not in output:
            output[key] = spec[key]
    try:
        width = int(output.get("width", DEFAULT_W))
        height = int(output.get("height", DEFAULT_H))
        fps = float(output.get("fps", DEFAULT_FPS))
    except (TypeError, ValueError):
        raise SpecError("width, height and fps must be numbers")
    fit = output.get("fit", "cover")
    if width <= 0 or height <= 0 or width % 2 or height % 2:
        raise SpecError(f"output size must be positive and even (yuv420p): got {width}x{height}")
    if fps <= 0:
        raise SpecError("fps must be positive")
    if fit not in ("cover", "contain"):
        raise SpecError("fit must be 'cover' (crop to fill) or 'contain' (pad)")
    fps = int(fps) if float(fps).is_integer() else fps

    clips = spec.get("clips")
    if not isinstance(clips, list) or not clips:
        raise SpecError("spec.clips must be a non-empty list")

    words, bounds = None, None
    if spec.get("words"):
        words = load_words(resolve_path(spec["words"], base))
        # Cut points: 0 for the first cut (covers the VO lead-in), each later word's start,
        # and the last word's end. word_range [i, j] spans bounds[i] .. bounds[j + 1].
        bounds = [0.0] + [w["start"] for w in words[1:]] + [words[-1]["end"]]

    errors, warnings, segments = [], [], []
    for i, clip in enumerate(clips):
        if not isinstance(clip, dict):
            errors.append(f"clips[{i}]: must be an object")
            continue
        label = clip.get("label")
        where = f"clips[{i}]" + (f" ({label})" if label else "")
        if not clip.get("file"):
            errors.append(f"{where}: file is required")
            continue
        path = resolve_path(clip["file"], base).resolve()
        if not path.is_file():
            errors.append(f"{where}: file not found: {clip['file']}")
            continue
        try:
            info = probe(path)
        except FFmpegError as e:
            errors.append(f"{where}: ffprobe cannot read {clip['file']}: {e}")
            continue
        if not info["has_video"]:
            errors.append(f"{where}: {clip['file']} has no video stream")
            continue
        kind = info["kind"]
        try:
            src_in = parse_time(clip.get("in", 0))
            window = None
            if "word_range" in clip:
                if bounds is None:
                    raise ValueError("word_range needs a top-level \"words\" file")
                rng = clip["word_range"]
                if (not isinstance(rng, list) or len(rng) != 2 or not all(isinstance(n, int) and not isinstance(n, bool) for n in rng)
                        or not 0 <= rng[0] <= rng[1] < len(words)):
                    raise ValueError(f"word_range must be [first, last] word indexes within 0..{len(words) - 1}")
                window = (bounds[rng[0]], bounds[rng[1] + 1])
                dur = window[1] - window[0]
            elif "t_in" in clip or "t_out" in clip:
                if "t_in" not in clip or "t_out" not in clip:
                    raise ValueError("t_in and t_out go together")
                window = (parse_time(clip["t_in"]), parse_time(clip["t_out"]))
                dur = window[1] - window[0]
            elif clip.get("out") is not None:
                dur = parse_time(clip["out"]) - src_in
            elif clip.get("duration") is not None:
                dur = parse_time(clip["duration"])
            elif kind == "image":
                raise ValueError("a still image needs duration (or a t_in/t_out window or word_range)")
            else:
                if info["duration"] is None:
                    raise ValueError("ffprobe reports no duration; give out or duration")
                dur = info["duration"] - src_in
        except ValueError as e:
            errors.append(f"{where}: {e}")
            continue
        if src_in < 0 or dur <= 0:
            errors.append(f"{where}: in must be >= 0 and the cut must be longer than 0s (got in={src_in}, duration={dur:.3f})")
            continue
        if kind == "video":
            src_dur = info["duration"]
            if src_dur is None:
                errors.append(f"{where}: ffprobe reports no duration for {clip['file']}")
                continue
            if src_in >= src_dur:
                errors.append(f"{where}: in={src_in}s is past the end of the clip ({src_dur:.3f}s)")
                continue
            short = src_in + dur - src_dur
            if short > SHORT_TOLERANCE_S:
                errors.append(f"{where}: needs {src_in:.3f}s + {dur:.3f}s but {clip['file']} is only {src_dur:.3f}s long")
                continue
            if short > 1e-3:
                warnings.append(f"{where}: clip is {short:.3f}s short of its cut; its last frame is held")
        pan = None
        if clip.get("pan") is not None:
            if kind != "image":
                errors.append(f"{where}: pan works on still images only")
                continue
            try:
                pan = _check_pan(clip["pan"], where)
            except SpecError as e:
                errors.append(str(e))
                continue
        segments.append({
            "index": len(segments), "label": label, "file": str(path), "kind": kind,
            "in": round(src_in, 6), "duration": round(dur, 6), "window": window, "pan": pan,
            "has_audio": info["has_audio"],
            "source": {k: info[k] for k in ("duration", "width", "height", "fps", "sample_aspect_ratio")},
        })
    if errors:
        raise SpecError("spec has errors:\n  " + "\n  ".join(errors))

    t = 0.0
    for seg in segments:
        seg["timeline_start"] = round(t, 6)
        if seg["window"] and abs(seg["window"][0] - t) > 1.0 / fps + 1e-6:
            what = "gap" if seg["window"][0] > t else "overlap"
            warnings.append(f"segment {seg['index']}: its window starts at {seg['window'][0]:.3f}s but it plays at "
                            f"{t:.3f}s ({what} of {abs(seg['window'][0] - t):.3f}s)")
        f0 = round(t * fps)
        t += seg["duration"]
        seg["timeline_end"] = round(t, 6)
        seg["frames"] = round(t * fps) - f0
        if seg["window"]:
            seg["window"] = [round(v, 6) for v in seg["window"]]
        if seg["frames"] < 1:
            raise SpecError(f"segment {seg['index']} ({seg['duration']:.4f}s) is shorter than one frame at {fps} fps")
    if strict and warnings:
        raise SpecError("--strict: spec has warnings:\n  " + "\n  ".join(warnings))
    total_frames = round(t * fps)
    return {
        "version": 1, "width": width, "height": height, "fps": fps, "fit": fit,
        "total_frames": total_frames, "total_duration": round(total_frames / fps, 6),
        "segments": segments, "warnings": warnings,
    }


def load_edl(path: Path, strict=False) -> dict:
    data = load_json(path)
    if isinstance(data, dict) and "segments" in data:
        return data
    return resolve_spec(data, Path(path).resolve().parent, strict)


# ---------------------------------------------------------------- assemble

def _fit_chain(w, h, fit):
    square = "scale='trunc(iw*sar/2)*2':'trunc(ih/2)*2'"
    if fit == "contain":
        return (f"{square},scale={w}:{h}:force_original_aspect_ratio=decrease,"
                f"pad={w}:{h}:(ow-iw)/2:(oh-ih)/2:color=black,setsar=1")
    return f"{square},scale={w}:{h}:force_original_aspect_ratio=increase,crop={w}:{h},setsar=1"


def _pan_chain(seg, w, h, fps):
    """Zoom/pan across a still, cover-fitted to the output aspect first."""
    k = PAN_SUPERSAMPLE
    n = max(seg["frames"] - 1, 1)
    a, b = seg["pan"]["from"], seg["pan"]["to"]
    p = f"(on/{n})"
    z = f"({a['zoom']}+({b['zoom'] - a['zoom']})*{p})"
    cx = f"({a['x']}+({b['x'] - a['x']})*{p})"
    cy = f"({a['y']}+({b['y'] - a['y']})*{p})"
    x = f"max(0,min(iw-iw/zoom,{cx}*iw-iw/zoom/2))"
    y = f"max(0,min(ih-ih/zoom,{cy}*ih-ih/zoom/2))"
    return (f"{_fit_chain(w * k, h * k, 'cover')},"
            f"zoompan=z='{z}':x='{x}':y='{y}':d=1:s={w}x{h}:fps={fps},setsar=1")


def assemble(edl: dict, out: Path, crf=18, preset="fast", clip_audio="drop") -> dict:
    need_tools("ffmpeg", "ffprobe")
    w, h, fps, fit = edl["width"], edl["height"], edl["fps"], edl.get("fit", "cover")
    segs = edl["segments"]
    if not segs:
        raise SpecError("EDL has no segments")
    keep_audio = clip_audio == "keep"
    cmd, graph = ffmpeg_cmd(), []
    for k, seg in enumerate(segs):
        n = int(seg["frames"])
        exact = n / fps
        if seg["kind"] == "image":
            cmd += ["-loop", "1", "-framerate", str(fps), "-t", f"{exact + 2.0 / fps:.6f}", "-i", seg["file"]]
            chain = _pan_chain(seg, w, h, fps) if seg.get("pan") else f"fps={fps},{_fit_chain(w, h, fit)}"
        else:
            # Input seek is frame-accurate when transcoding; -t bounds the decode.
            cmd += ["-ss", f"{seg['in']:.6f}", "-t", f"{seg['duration'] + 0.5:.6f}", "-i", seg["file"]]
            chain = f"fps={fps},{_fit_chain(w, h, fit)}"
        # Hold the last frame for clips a hair short, then cut to an exact frame count.
        chain += (f",tpad=stop_mode=clone:stop_duration={SHORT_TOLERANCE_S + 2.0 / fps:.4f},"
                  f"trim=end_frame={n},setpts=PTS-STARTPTS,format=yuv420p")
        graph.append(f"[{k}:v]{chain}[v{k}]")
        if keep_audio:
            if seg.get("has_audio"):
                # async + first_pts=0 anchors the audio to the cut's start (the seek point), padding
                # or trimming as needed; resetting to the first decoded sample instead shifts AAC
                # audio one frame (~21 ms) early when the cut starts at 0.
                graph.append(f"[{k}:a]aresample=48000:async=1:first_pts=0,aformat=sample_fmts=fltp:sample_rates=48000:"
                             f"channel_layouts=stereo,apad,atrim=0:{exact:.6f},asetpts=PTS-STARTPTS[a{k}]")
            else:
                graph.append(f"anullsrc=channel_layout=stereo:sample_rate=48000,atrim=0:{exact:.6f},"
                             f"asetpts=PTS-STARTPTS[a{k}]")
    # Hard cuts through the concat FILTER, never the -f concat demuxer: the demuxer drops
    # audio when a clip comes out a few ms short of its window.
    pads = "".join(f"[v{k}][a{k}]" if keep_audio else f"[v{k}]" for k in range(len(segs)))
    graph.append(f"{pads}concat=n={len(segs)}:v=1:a={1 if keep_audio else 0}" + ("[vout][aout]" if keep_audio else "[vout]"))
    out = Path(out)
    out.parent.mkdir(parents=True, exist_ok=True)
    cmd += ["-filter_complex", ";".join(graph), "-map", "[vout]"]
    if keep_audio:
        cmd += ["-map", "[aout]", "-c:a", "aac", "-b:a", "192k", "-ar", "48000"]
    cmd += ["-c:v", "libx264", "-preset", preset, "-crf", str(crf), "-pix_fmt", "yuv420p",
            "-r", str(fps), "-movflags", "+faststart", str(out)]
    run_ff(cmd)
    got = probe(out)
    warn = []
    if got["duration"] is None or abs(got["duration"] - edl["total_duration"]) > 1.5 / fps:
        warn.append(f"output is {got['duration']}s, expected {edl['total_duration']}s")
    return {"step": "assemble", "out": str(out), "segments": len(segs), "duration": got["duration"],
            "expected_duration": edl["total_duration"], "width": got["width"], "height": got["height"],
            "fps": got["fps"], "clip_audio": clip_audio, "warnings": warn}


# ---------------------------------------------------------------- captions

def _srt_time(s):
    m = re.match(r"^\s*(\d+):(\d{1,2}):(\d{1,2})(?:[,.](\d{1,3}))?\s*$", s)
    if not m:
        raise SpecError(f"bad SRT time: {s!r}")
    hh, mm, ss, ms = m.groups()
    return int(hh) * 3600 + int(mm) * 60 + int(ss) + (int(ms.ljust(3, "0")) / 1000 if ms else 0)


def parse_srt(text: str) -> list:
    text = text.lstrip("\ufeff").replace("\r\n", "\n").replace("\r", "\n")
    cues = []
    for block in re.split(r"\n\s*\n", text.strip("\n")):
        lines = block.split("\n")
        idx = next((i for i, line in enumerate(lines) if "-->" in line), None)
        if idx is None:
            continue
        start, end = (part.split()[0] if part.split() else "" for part in lines[idx].split("-->", 1))
        body = "\n".join(lines[idx + 1:]).rstrip("\n")
        if body:
            cues.append({"start": _srt_time(start), "end": _srt_time(end), "text": body})
    if not cues:
        raise SpecError("SRT has no cues")
    return cues


def _respell(word: str, table: dict) -> str:
    m = re.match(r"^(\W*)(.*?)(\W*)$", word, re.S)
    lead, core, tail = m.groups()
    for wrong, right in table.items():
        if core.lower() == str(wrong).lower():
            return lead + str(right) + tail
    return word


def cues_from_words(words: list, per: int = 1, respell: dict | None = None, max_gap: float = 0.4) -> list:
    """One cue per `per` words; a cue holds until the next one unless the pause is long."""
    if per < 1:
        raise SpecError("per must be >= 1")
    groups = [words[i:i + per] for i in range(0, len(words), per)]
    cues = []
    for g, group in enumerate(groups):
        text = " ".join(_respell(w["text"].strip(), respell or {}) for w in group)
        end = group[-1]["end"]
        if g + 1 < len(groups):
            nxt = groups[g + 1][0]["start"]
            if nxt - end <= max_gap:
                end = nxt
        cues.append({"start": group[0]["start"], "end": end, "text": text})
    return cues


def load_cues(opts: dict, base: Path) -> list:
    if opts.get("srt"):
        cues = parse_srt(resolve_path(opts["srt"], base).read_text(encoding="utf-8"))
    elif opts.get("cues") is not None:
        raw = opts["cues"]
        if not isinstance(raw, list):
            raw = load_json(resolve_path(raw, base))
        cues = []
        for i, c in enumerate(raw):
            try:
                cues.append({"start": parse_time(c["start"]), "end": parse_time(c["end"]), "text": str(c["text"])})
            except (KeyError, TypeError, ValueError):
                raise SpecError(f"cue {i} needs start, end and text")
    elif opts.get("words"):
        respell = opts.get("respell") or {}
        if isinstance(respell, str):
            p = resolve_path(respell, base)
            respell = load_json(p) if p.is_file() else json.loads(respell)
        cues = cues_from_words(load_words(resolve_path(opts["words"], base)), int(opts.get("per") or 1), respell)
    else:
        raise SpecError("captions need one of srt, cues or words")
    cues = sorted((c for c in cues if c["text"].strip()), key=lambda c: c["start"])
    for c in cues:
        if c["end"] <= c["start"]:
            raise SpecError(f"cue {c['text']!r} ends before it starts ({c['start']} -> {c['end']})")
    for a, b in zip(cues, cues[1:]):
        if b["start"] < a["end"]:
            a["end"] = b["start"]  # overlapping cues: the later one wins
    return [c for c in cues if c["end"] > c["start"]]


def _has_filter(name: str) -> bool:
    out = subprocess.run(["ffmpeg", "-hide_banner", "-filters"], capture_output=True, text=True).stdout
    return any(len(line.split()) > 1 and line.split()[1] == name for line in out.splitlines())


def pick_renderer(pref: str = "auto") -> str:
    """Pillow draws the same captions on every machine; libass is the no-Pillow route."""
    if pref in ("auto", "pil"):
        try:
            import PIL  # noqa: F401
            return "pil"
        except ImportError:
            if pref == "pil":
                raise ToolError("Pillow is not installed: python3 -m pip install pillow")
    if pref in ("auto", "libass"):
        if _has_filter("ass"):
            return "libass"
        if pref == "libass":
            raise ToolError("this ffmpeg has no libass (no 'ass' filter); use --renderer pil")
    if pref not in ("auto", "pil", "libass"):
        raise SpecError(f"unknown renderer {pref!r} (auto | pil | libass)")
    raise ToolError("no caption renderer: install Pillow (python3 -m pip install pillow) "
                    "or use an ffmpeg built with libass")


def _rgba(color: str):
    c = str(color).lstrip("#")
    if not re.fullmatch(r"[0-9a-fA-F]{6}([0-9a-fA-F]{2})?", c):
        raise SpecError(f"bad colour {color!r}: use #RRGGBB or #RRGGBBAA")
    vals = [int(c[i:i + 2], 16) for i in range(0, len(c), 2)]
    return tuple(vals + [255] if len(vals) == 3 else vals)


def _font(style, size):
    from PIL import ImageFont
    import os
    for cand in (style.get("font"), os.environ.get("GW_CAPTION_FONT"), *FONT_CANDIDATES):
        if cand and Path(cand).is_file():
            return ImageFont.truetype(str(cand), size)
    if style.get("font"):
        raise SpecError(f"font not found: {style['font']}")
    try:
        return ImageFont.load_default(size=size)  # Pillow >= 10.1 ships a scalable default
    except TypeError:
        return ImageFont.load_default()


def _wrap(draw, text, font, max_w, stroke):
    lines = []
    for para in text.split("\n"):
        words, cur = para.split(" "), ""
        for word in words:
            trial = word if not cur else cur + " " + word
            if cur and draw.textlength(trial, font=font) + 2 * stroke > max_w:
                lines.append(cur)
                cur = word
            else:
                cur = trial
        lines.append(cur)
    return lines


def _render_pil(cues, w, h, style, tmp: Path):
    from PIL import Image, ImageDraw
    size = int(style["font_size"])
    stroke = int(style["outline"])
    font = _font(style, size)
    fill, edge = _rgba(style["color"]), _rgba(style["outline_color"])
    margin = round(0.05 * h)
    blank = tmp / "blank.png"
    Image.new("RGBA", (w, h), (0, 0, 0, 0)).save(blank)
    files = []
    for i, cue in enumerate(cues):
        img = Image.new("RGBA", (w, h), (0, 0, 0, 0))
        draw = ImageDraw.Draw(img)
        lines = _wrap(draw, cue["text"], font, style["max_width"] * w, stroke)
        lh = round(size * 1.18)
        top = min(max(style["y"] * h - lh * len(lines) / 2, margin), h - margin - lh * len(lines))
        for j, line in enumerate(lines):
            lw = draw.textlength(line, font=font)
            draw.text(((w - lw) / 2, top + j * lh), line, font=font, fill=fill,
                      stroke_width=stroke, stroke_fill=edge)
        path = tmp / f"cue_{i:04d}.png"
        img.save(path)
        files.append(path)
    return blank, files


def _caption_track(cues, files, blank, duration, tmp: Path, exact: bool = True) -> Path:
    """An ffconcat slideshow of full-frame RGBA stills: blank between cues. This is an image
    track for one overlay, not a clip concat, so the demuxer's audio caveat does not apply.
    `option framerate 1000` puts the stills on a 1 ms grid; without it the image demuxer's
    default 25 fps snaps cue times to 1/25 s, a frame late on 30 fps video."""
    def q(p):
        return "'" + str(p).replace("'", "'\\''") + "'"
    entries, t = [], 0.0
    for cue, f in zip(cues, files):
        start, end = max(cue["start"], 0.0), min(cue["end"], duration)
        if end <= start:
            continue
        if start > t:
            entries.append((blank, start - t))
        entries.append((f, end - start))
        t = end
    entries.append((blank, max(duration - t, 1.0)))
    opt = ["option framerate 1000"] if exact else []
    lines = ["ffconcat version 1.0"]
    for f, d in entries:
        lines += [f"file {q(f)}", *opt, f"duration {d:.6f}"]
    lines += [f"file {q(blank)}", *opt]  # the last duration only counts if a file follows it
    track = tmp / "captions.ffconcat"
    track.write_text("\n".join(lines) + "\n", encoding="utf-8")
    return track


def _ass_time(t):
    cs = int(round(t * 100))
    return f"{cs // 360000}:{cs // 6000 % 60:02d}:{cs // 100 % 60:02d}.{cs % 100:02d}"


def _ass_colour(color):
    r, g, b, a = _rgba(color)
    return f"&H{255 - a:02X}{b:02X}{g:02X}{r:02X}"


def _write_ass(cues, w, h, style, path: Path):
    y = round(style["y"] * h)
    side = round((1 - style["max_width"]) / 2 * w)
    head = [
        "[Script Info]", "ScriptType: v4.00+", f"PlayResX: {w}", f"PlayResY: {h}", "WrapStyle: 0",
        "ScaledBorderAndShadow: yes", "",
        "[V4+ Styles]",
        "Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, "
        "Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, "
        "Alignment, MarginL, MarginR, MarginV, Encoding",
        f"Style: Default,{style['font_name']},{int(style['font_size'])},{_ass_colour(style['color'])},&H000000FF,"
        f"{_ass_colour(style['outline_color'])},&H00000000,-1,0,0,0,100,100,0,0,1,{int(style['outline'])},0,5,"
        f"{side},{side},0,1", "",
        "[Events]", "Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text",
    ]
    for c in cues:
        text = c["text"].replace("\\", "\\\u2060").replace("{", "\\{").replace("}", "\\}").replace("\n", "\\N")
        head.append(f"Dialogue: 0,{_ass_time(c['start'])},{_ass_time(c['end'])},Default,,0,0,0,,"
                    f"{{\\pos({w // 2},{y})}}{text}")
    path.write_text("\n".join(head) + "\n", encoding="utf-8")


def burn_captions(video: Path, out: Path, cues: list, style: dict, crf=18, preset="fast") -> dict:
    need_tools("ffmpeg", "ffprobe")
    info = probe(video)
    w, h, duration = info["width"], info["height"], info["duration"]
    if not w or not h or not duration:
        raise SpecError(f"cannot read size/duration of {video}")
    style = {**CAPTION_DEFAULTS, **{k: v for k, v in style.items() if v is not None}}
    style["font_size"] = style["font_size"] or round(0.045 * h)
    style["outline"] = style["outline"] if style["outline"] is not None else max(1, round(0.08 * style["font_size"]))
    renderer = pick_renderer(style["renderer"])
    out = Path(out)
    out.parent.mkdir(parents=True, exist_ok=True)
    video = Path(video).resolve()
    warnings = []
    with tempfile.TemporaryDirectory(prefix="montage-captions-") as td:
        tmp = Path(td)
        tail = ["-map", "0:a?", "-c:a", "copy", "-c:v", "libx264", "-preset", preset, "-crf", str(crf),
                "-pix_fmt", "yuv420p", "-movflags", "+faststart", str(out.resolve())]
        if renderer == "pil":
            blank, files = _render_pil(cues, w, h, style, tmp)

            def overlay_cmd(exact):
                track = _caption_track(cues, files, blank, duration, tmp, exact)
                return ffmpeg_cmd() + ["-i", str(video), "-f", "concat", "-safe", "0", "-i", str(track),
                                       "-filter_complex",
                                       "[0:v][1:v]overlay=0:0:eof_action=pass:format=auto,format=yuv420p[v]",
                                       "-map", "[v]"] + tail
            try:
                run_ff(overlay_cmd(True), cwd=td)
            except FFmpegError as e:
                if "keyword" not in str(e) and "option" not in str(e):
                    raise
                # ffmpeg < 5 has no per-file `option` in ffconcat: fall back to the 1/25 s grid.
                run_ff(overlay_cmd(False), cwd=td)
                warnings.append("this ffmpeg is too old for exact caption timing; cue times snap to 1/25 s")
        else:
            # The ASS file is passed by bare name (cwd = tmp) so no path needs filtergraph escaping.
            _write_ass(cues, w, h, style, tmp / "captions.ass")
            run_ff(ffmpeg_cmd() + ["-i", str(video), "-filter_complex", "[0:v]ass=captions.ass,format=yuv420p[v]",
                                   "-map", "[v]"] + tail, cwd=td)
    return {"step": "captions", "out": str(out), "renderer": renderer, "cues": cues,
            "font_size": style["font_size"], "duration": probe(out)["duration"], "warnings": warnings}


# ---------------------------------------------------------------- mix

_FMT = "aresample=48000,aformat=sample_fmts=fltp:sample_rates=48000:channel_layouts=stereo"


def _loudnorm_json(stderr: str) -> dict:
    blocks = re.findall(r"\{[^{}]*\}", stderr)
    if not blocks:
        raise FFmpegError("loudnorm printed no measurement")
    return json.loads(blocks[-1])


def measure_loudness(path: Path, prefix: str = "", target=(-14.0, -1.0, 11.0)) -> dict:
    i, tp, lra = target
    proc = run_ff(["ffmpeg", "-hide_banner", "-nostdin", "-i", str(path), "-vn", "-af",
                   f"{prefix}loudnorm=I={i}:TP={tp}:LRA={lra}:print_format=json", "-f", "null", "-"])
    return _loudnorm_json(proc.stderr)


def _gain_to(target_lufs, measured, what, warnings):
    lufs = _num(measured.get("input_i"))
    if lufs is None or lufs < -70:
        warnings.append(f"{what} is silent; left at its own level")
        return 0.0
    return round(target_lufs - lufs, 3)


def mix(video: Path, out: Path, opts: dict) -> dict:
    need_tools("ffmpeg", "ffprobe")
    o = {**MIX_DEFAULTS, **{k: v for k, v in opts.items() if v is not None or k == "target_lufs"}}
    if isinstance(o["target_lufs"], str):
        o["target_lufs"] = None if o["target_lufs"].lower() in ("off", "none", "") else float(o["target_lufs"])
    if not o["vo"] and not o["music"]:
        raise SpecError("mix needs --vo, --music, or both")
    info = probe(video)
    dur = info["duration"]
    if not dur:
        raise SpecError(f"cannot read the duration of {video}")
    warnings, gains = [], {}
    cmd, graph, inputs = ffmpeg_cmd() + ["-i", str(video)], [], 1
    vo_label = music_label = orig_label = None

    if o["vo"]:
        vo = Path(o["vo"])
        vinfo = probe(vo)
        if not vinfo["has_audio"]:
            raise SpecError(f"VO has no audio stream: {vo}")
        start = float(o["vo_start"])
        overrun = start + (vinfo["duration"] or 0) - dur
        if overrun > 0.05:
            warnings.append(f"VO runs {overrun:.2f}s past the end of the video and is cut; lengthen the EDL")
        gains["vo_db"] = _gain_to(float(o["vo_lufs"]), measure_loudness(vo, _FMT + ","), "VO", warnings)
        cmd += ["-i", str(vo)]
        graph.append(f"[{inputs}:a]{_FMT},volume={gains['vo_db']}dB,adelay={round(start * 1000)}:all=1,"
                     f"apad,atrim=0:{dur:.6f},asetpts=PTS-STARTPTS" + ("[vo]" if not o["music"] else ",asplit=2[vo][key]"))
        vo_label, inputs = "[vo]", inputs + 1

    if o["music"]:
        music = Path(o["music"])
        minfo = probe(music)
        if not minfo["has_audio"]:
            raise SpecError(f"music has no audio stream: {music}")
        start = float(o["music_start"])
        need = max(dur - start, 0.0)
        if need <= 0:
            raise SpecError("music_start is past the end of the video")
        gains["music_db"] = _gain_to(float(o["music_lufs"]), measure_loudness(music, _FMT + ","), "music", warnings)
        if (minfo["duration"] or 0) < need:
            cmd += ["-stream_loop", "-1"]
            warnings.append(f"music bed ({minfo['duration']:.2f}s) is shorter than {need:.2f}s; it loops")
        cmd += ["-i", str(music)]
        chain = f"[{inputs}:a]{_FMT},volume={gains['music_db']}dB,atrim=0:{need:.6f},asetpts=PTS-STARTPTS"
        if float(o["music_fade_in"]) > 0:
            chain += f",afade=t=in:d={float(o['music_fade_in']):.3f}"
        chain += f",adelay={round(start * 1000)}:all=1,apad,atrim=0:{dur:.6f}"
        fade_out = min(float(o["music_fade_out"]), dur)
        if fade_out > 0:
            chain += f",afade=t=out:st={dur - fade_out:.6f}:d={fade_out:.3f}"
        graph.append(chain + "[bed]")
        if o["vo"]:
            ratio = min(float(o["duck_ratio"]), 20.0)
            if float(o["duck_ratio"]) > 20:
                warnings.append("duck_ratio capped at 20 (ffmpeg's sidechaincompress maximum)")
            graph.append(f"[bed][key]sidechaincompress=threshold={float(o['duck_threshold'])}:ratio={ratio}:"
                         f"attack={float(o['duck_attack'])}:release={float(o['duck_release'])}[music]")
        else:
            graph.append("[bed]anull[music]")
        music_label, inputs = "[music]", inputs + 1

    if o["keep_video_audio"]:
        if not info["has_audio"]:
            warnings.append("keep_video_audio: the video has no audio track")
        else:
            graph.append(f"[0:a]{_FMT},volume={float(o['video_audio_db'])}dB,apad,atrim=0:{dur:.6f}[orig]")
            orig_label = "[orig]"

    labels = [x for x in (vo_label, music_label, orig_label) if x]
    if len(labels) > 1:
        graph.append(f"{''.join(labels)}amix=inputs={len(labels)}:duration=first:normalize=0[mix]")
    else:
        graph.append(f"{labels[0]}anull[mix]")

    out = Path(out)
    out.parent.mkdir(parents=True, exist_ok=True)
    loud = {}
    with tempfile.TemporaryDirectory(prefix="montage-mix-") as td:
        wav = Path(td) / "mix.wav"
        run_ff(cmd + ["-filter_complex", ";".join(graph), "-map", "[mix]", "-c:a", "pcm_f32le", str(wav)])
        final = ffmpeg_cmd() + ["-i", str(video), "-i", str(wav)]
        if o["target_lufs"] is not None:
            i, tp, lra = float(o["target_lufs"]), float(o["target_tp"]), float(o["target_lra"])
            m = measure_loudness(wav, "", (i, tp, lra))
            loud["mix_before"] = _num(m.get("input_i"))
            af = (f"loudnorm=I={i}:TP={tp}:LRA={lra}:measured_I={m['input_i']}:measured_TP={m['input_tp']}:"
                  f"measured_LRA={m['input_lra']}:measured_thresh={m['input_thresh']}:offset={m['target_offset']}:"
                  f"linear=true,aresample=48000")
        else:
            af = "aresample=48000"
        final += ["-filter_complex", f"[1:a]{af}[a]", "-map", "0:v", "-map", "[a]", "-c:v", "copy",
                  "-c:a", "aac", "-b:a", "192k", "-ar", "48000", "-t", f"{dur:.6f}",
                  "-movflags", "+faststart", str(out)]
        run_ff(final)
    m = measure_loudness(out)
    loud.update({"output_i": _num(m.get("input_i")), "output_tp": _num(m.get("input_tp"))})
    return {"step": "mix", "out": str(out), "duration": probe(out)["duration"], "gains_db": gains,
            "loudness": loud, "ducking": None if not (o["vo"] and o["music"]) else {
                "threshold": float(o["duck_threshold"]), "ratio": min(float(o["duck_ratio"]), 20.0),
                "attack_ms": float(o["duck_attack"]), "release_ms": float(o["duck_release"])},
            "warnings": warnings}


# ---------------------------------------------------------------- CLI

def _mix_opts_from_args(a) -> dict:
    target = None if str(a.target_lufs).lower() in ("off", "none") else float(a.target_lufs)
    return {"vo": a.vo, "vo_start": a.vo_start, "vo_lufs": a.vo_lufs, "music": a.music,
            "music_start": a.music_start, "music_lufs": a.music_lufs, "music_fade_in": a.music_fade_in,
            "music_fade_out": a.music_fade_out, "duck_threshold": a.duck_threshold, "duck_ratio": a.duck_ratio,
            "duck_attack": a.duck_attack, "duck_release": a.duck_release, "target_lufs": target,
            "target_tp": a.target_tp, "keep_video_audio": a.keep_video_audio, "video_audio_db": a.video_audio_db}


def _caption_style_from_args(a) -> dict:
    return {"renderer": a.renderer, "font": a.font, "font_name": a.font_name, "font_size": a.font_size,
            "color": a.color, "outline_color": a.outline_color, "outline": a.outline, "y": a.y,
            "max_width": a.max_width}


def cmd_edl(a):
    need_tools("ffprobe")
    spec_path = Path(a.spec)
    edl = resolve_spec(load_json(spec_path), spec_path.resolve().parent, a.strict)
    Path(a.out).parent.mkdir(parents=True, exist_ok=True)
    Path(a.out).write_text(json.dumps(edl, indent=1, ensure_ascii=False) + "\n", encoding="utf-8")
    return summary({"step": "edl", "out": str(a.out), "segments": len(edl["segments"]),
                    "total_duration": edl["total_duration"], "total_frames": edl["total_frames"],
                    "warnings": edl["warnings"]})


def cmd_assemble(a):
    need_tools("ffprobe")
    return summary(assemble(load_edl(Path(a.edl), a.strict), Path(a.out), a.crf, a.preset, a.clip_audio))


def cmd_captions(a):
    base = Path.cwd()
    opts = {"srt": a.srt, "cues": a.cues, "words": a.words, "per": a.per, "respell": a.respell}
    return summary(burn_captions(Path(a.video), Path(a.out), load_cues(opts, base), _caption_style_from_args(a),
                                 a.crf, a.preset))


def cmd_mix(a):
    return summary(mix(Path(a.video), Path(a.out), _mix_opts_from_args(a)))


def cmd_run(a):
    need_tools("ffmpeg", "ffprobe")
    spec_path = Path(a.spec)
    base = spec_path.resolve().parent
    spec = load_json(spec_path)
    out = Path(a.out)
    work = Path(a.workdir) if a.workdir else out.parent / f"{out.stem}.work"
    work.mkdir(parents=True, exist_ok=True)
    edl = resolve_spec(spec, base, a.strict)
    (work / "edl.json").write_text(json.dumps(edl, indent=1, ensure_ascii=False) + "\n", encoding="utf-8")
    steps = [{"step": "edl", "out": str(work / "edl.json"), "warnings": edl["warnings"]}]
    current = work / "body.mp4"
    steps.append(assemble(edl, current, a.crf, a.preset, spec.get("clip_audio", "drop")))
    cap = spec.get("captions")
    if cap:
        if not isinstance(cap, dict):
            raise SpecError("spec.captions must be an object")
        style = {k: cap.get(k) for k in CAPTION_DEFAULTS}
        style.update(cap.get("style") or {})
        captioned = work / "captioned.mp4"
        steps.append(burn_captions(current, captioned, load_cues(cap, base), style, a.crf, a.preset))
        current = captioned
    audio = spec.get("audio")
    if audio:
        if not isinstance(audio, dict):
            raise SpecError("spec.audio must be an object")
        opts = {k: audio[k] for k in MIX_DEFAULTS if k in audio}
        for key in ("vo", "music"):
            if opts.get(key):
                opts[key] = str(resolve_path(opts[key], base))
        steps.append(mix(current, out, opts))
    else:
        out.parent.mkdir(parents=True, exist_ok=True)
        shutil.copyfile(current, out)
    final = probe(out)
    manifest = {"skill_name": "stitch-videos-ffmpeg", "tool": "montage.py run", "status": "pass",
                "spec": str(spec_path.resolve()), "output": str(out.resolve()), "provider": "ffmpeg (local, free)",
                "duration": final["duration"], "width": final["width"], "height": final["height"],
                "fps": final["fps"], "has_audio": final["has_audio"], "steps": steps,
                "warnings": [w for s in steps for w in s.get("warnings", [])]}
    (work / "manifest.json").write_text(json.dumps(manifest, indent=1, ensure_ascii=False) + "\n", encoding="utf-8")
    return summary({"step": "run", "out": str(out), "manifest": str(work / "manifest.json"),
                    "duration": final["duration"], "warnings": manifest["warnings"]})


def build_parser():
    ap = argparse.ArgumentParser(prog="montage.py", description=__doc__.split("\n\n")[0],
                                 formatter_class=argparse.RawDescriptionHelpFormatter)
    sub = ap.add_subparsers(dest="cmd", required=True)

    def encode_args(p):
        p.add_argument("--crf", type=int, default=18, help="x264 quality (lower = better, default 18)")
        p.add_argument("--preset", default="fast", help="x264 preset (default fast)")

    p = sub.add_parser("edl", help="check a spec and write the resolved edl.json")
    p.add_argument("--spec", required=True)
    p.add_argument("--out", required=True)
    p.add_argument("--strict", action="store_true", help="fail on warnings (gaps, short clips)")
    p.set_defaults(func=cmd_edl)

    p = sub.add_parser("assemble", help="normalize and hard-cut the EDL segments into one video")
    p.add_argument("--edl", required=True, help="edl.json from the edl step, or a spec (resolved on the fly)")
    p.add_argument("--out", required=True)
    p.add_argument("--clip-audio", choices=["drop", "keep"], default="drop",
                   help="drop the clips' own audio (default) or keep it, with silence for stills")
    p.add_argument("--strict", action="store_true")
    encode_args(p)
    p.set_defaults(func=cmd_assemble)

    p = sub.add_parser("captions", help="burn captions (exact text) into a video")
    p.add_argument("--video", required=True)
    p.add_argument("--out", required=True)
    src = p.add_mutually_exclusive_group(required=True)
    src.add_argument("--srt", help="SRT file")
    src.add_argument("--cues", help="JSON list of {start, end, text}")
    src.add_argument("--words", help="word timings [{text, start, end}] -> one cue per --per words")
    p.add_argument("--per", type=int, default=1, help="words per cue with --words (default 1)")
    p.add_argument("--respell", help="with --words: JSON map or file of heard -> locked spellings")
    p.add_argument("--renderer", default="auto", choices=["auto", "pil", "libass"])
    p.add_argument("--font", help="TTF/OTF path (Pillow renderer)")
    p.add_argument("--font-name", default=CAPTION_DEFAULTS["font_name"], help="font family (libass renderer)")
    p.add_argument("--font-size", type=int, help="px (default 4.5%% of the frame height)")
    p.add_argument("--color", default=CAPTION_DEFAULTS["color"])
    p.add_argument("--outline-color", default=CAPTION_DEFAULTS["outline_color"])
    p.add_argument("--outline", type=int, help="outline px (default 8%% of the font size)")
    p.add_argument("--y", type=float, default=CAPTION_DEFAULTS["y"], help="caption centre, fraction of height")
    p.add_argument("--max-width", type=float, default=CAPTION_DEFAULTS["max_width"])
    encode_args(p)
    p.set_defaults(func=cmd_captions)

    p = sub.add_parser("mix", help="VO over the video with a music bed ducked under it")
    p.add_argument("--video", required=True)
    p.add_argument("--out", required=True)
    p.add_argument("--vo")
    p.add_argument("--vo-start", type=float, default=MIX_DEFAULTS["vo_start"])
    p.add_argument("--vo-lufs", type=float, default=MIX_DEFAULTS["vo_lufs"])
    p.add_argument("--music")
    p.add_argument("--music-start", type=float, default=MIX_DEFAULTS["music_start"])
    p.add_argument("--music-lufs", type=float, default=MIX_DEFAULTS["music_lufs"])
    p.add_argument("--music-fade-in", type=float, default=MIX_DEFAULTS["music_fade_in"])
    p.add_argument("--music-fade-out", type=float, default=MIX_DEFAULTS["music_fade_out"])
    p.add_argument("--duck-threshold", type=float, default=MIX_DEFAULTS["duck_threshold"])
    p.add_argument("--duck-ratio", type=float, default=MIX_DEFAULTS["duck_ratio"])
    p.add_argument("--duck-attack", type=float, default=MIX_DEFAULTS["duck_attack"], help="ms")
    p.add_argument("--duck-release", type=float, default=MIX_DEFAULTS["duck_release"], help="ms")
    p.add_argument("--target-lufs", default=str(MIX_DEFAULTS["target_lufs"]), help="master loudness, or 'off'")
    p.add_argument("--target-tp", type=float, default=MIX_DEFAULTS["target_tp"])
    p.add_argument("--keep-video-audio", action="store_true", help="mix the video's own audio in too")
    p.add_argument("--video-audio-db", type=float, default=MIX_DEFAULTS["video_audio_db"])
    p.set_defaults(func=cmd_mix)

    p = sub.add_parser("run", help="edl -> assemble -> captions -> mix from one spec")
    p.add_argument("--spec", required=True)
    p.add_argument("--out", required=True)
    p.add_argument("--workdir", help="intermediates + manifest.json (default <out>.work/)")
    p.add_argument("--strict", action="store_true")
    encode_args(p)
    p.set_defaults(func=cmd_run)
    return ap


def main(argv=None):
    args = build_parser().parse_args(argv)
    try:
        return args.func(args)
    except (SpecError, ToolError, FFmpegError) as e:
        print(f"error: {e}", file=sys.stderr)
        return e.exit_code


if __name__ == "__main__":
    sys.exit(main())

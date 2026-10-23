"""Synthetic-clip fixture test for scripts/montage.py (free: local ffmpeg only, no network).

Run: python3 -m pytest skills/ads/packs/video-ad-formats/stitch-videos-ffmpeg/tests -q

Every input is generated here with ffmpeg lavfi (testsrc, smptebars, sine) at a tiny size,
so each assertion names the behaviour it proves: exact EDL length, normalized format,
captions on the right frames with exact text, and a music bed that ducks under the VO.
"""
import importlib.util
import json
import re
import shutil
import subprocess
import sys
from pathlib import Path

import pytest

SCRIPT = Path(__file__).resolve().parent.parent / "scripts" / "montage.py"
W, H, FPS = 270, 480, 30

pytestmark = pytest.mark.skipif(not (shutil.which("ffmpeg") and shutil.which("ffprobe")),
                                reason="ffmpeg/ffprobe not installed")


def ff(*args):
    subprocess.run(["ffmpeg", "-y", "-hide_banner", "-loglevel", "error", *map(str, args)], check=True)


def montage(*args, ok=True):
    proc = subprocess.run([sys.executable, str(SCRIPT), *map(str, args)], capture_output=True, text=True)
    if ok:
        assert proc.returncode == 0, proc.stderr
        return json.loads(proc.stdout.strip().splitlines()[-1])
    return proc


def streams(path):
    out = subprocess.run(["ffprobe", "-v", "error", "-count_frames", "-show_entries",
                          "stream=codec_type,codec_name,width,height,r_frame_rate,sample_aspect_ratio,pix_fmt,"
                          "nb_read_frames,duration", "-of", "json", str(path)],
                         capture_output=True, text=True, check=True).stdout
    found = {}
    for s in json.loads(out)["streams"]:
        found.setdefault(s["codec_type"], s)
    return found


def band_level(path, start, end, band):
    """Mean level (dB) of one frequency band in a time window: the 200 Hz music bed or the 2 kHz VO."""
    filt = "lowpass=f=500," * 3 if band == "music" else "highpass=f=1000," * 3
    err = subprocess.run(["ffmpeg", "-hide_banner", "-nostdin", "-i", str(path), "-vn", "-af",
                          f"atrim=start={start}:end={end},{filt}volumedetect", "-f", "null", "-"],
                         capture_output=True, text=True).stderr
    return float(re.search(r"mean_volume: (-?[\d.]+) dB", err).group(1))


def gray_rows(path, t, y0, y1):
    raw = subprocess.run(["ffmpeg", "-hide_banner", "-loglevel", "error", "-ss", f"{t}", "-i", str(path),
                          "-frames:v", "1", "-f", "rawvideo", "-pix_fmt", "gray", "-"],
                         capture_output=True, check=True).stdout
    return raw[y0 * W:y1 * W]


def band_frames(path):
    """Every frame's caption band (rows 0.62-0.82 of the height) as gray bytes."""
    y0, y1 = int(0.62 * H), int(0.82 * H)
    raw = subprocess.run(["ffmpeg", "-hide_banner", "-loglevel", "error", "-i", str(path), "-vf",
                          f"crop={W}:{y1 - y0}:0:{y0}", "-f", "rawvideo", "-pix_fmt", "gray", "-"],
                         capture_output=True, check=True).stdout
    size = W * (y1 - y0)
    return [raw[i:i + size] for i in range(0, len(raw), size)]


def load_module():
    spec = importlib.util.spec_from_file_location("stitch_montage", SCRIPT)
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod


def caption_diff(a, b, t):
    """Mean absolute luma difference in the caption band (rows around y=0.72) at time t."""
    y0, y1 = int(0.62 * H), int(0.82 * H)
    pa, pb = gray_rows(a, t, y0, y1), gray_rows(b, t, y0, y1)
    return sum(abs(x - y) for x, y in zip(pa, pb)) / len(pa)


def caption_renderer():
    try:
        import PIL  # noqa: F401
        return "pil"
    except ImportError:
        filters = subprocess.run(["ffmpeg", "-hide_banner", "-filters"], capture_output=True, text=True).stdout
        return "libass" if re.search(r"^\s*\S+\s+ass\s", filters, re.M) else None


@pytest.fixture(scope="module")
def fx(tmp_path_factory):
    d = tmp_path_factory.mktemp("montage")
    # Three clips that disagree on size, fps and pixel shape, one with its own audio.
    ff("-f", "lavfi", "-i", "testsrc=size=320x240:rate=25:duration=2", "-c:v", "libx264", "-preset", "ultrafast",
       "-pix_fmt", "yuv420p", d / "a.mp4")
    ff("-f", "lavfi", "-i", "testsrc2=size=240x426:rate=30:duration=2", "-f", "lavfi", "-i",
       "sine=frequency=440:duration=2:sample_rate=48000", "-c:v", "libx264", "-preset", "ultrafast",
       "-pix_fmt", "yuv420p", "-c:a", "aac", "-shortest", d / "b.mp4")
    ff("-f", "lavfi", "-i", "smptebars=size=200x200:rate=24:duration=1.5", "-vf", "setsar=4/3", "-c:v", "libx264",
       "-preset", "ultrafast", "-pix_fmt", "yuv420p", d / "c.mp4")
    ff("-f", "lavfi", "-i", "testsrc=size=540x960", "-frames:v", "1", d / "card.png")
    # VO = a 2 kHz tone, music bed = a 200 Hz tone (shorter than the video, so it loops).
    ff("-f", "lavfi", "-i", "sine=frequency=2000:duration=1.5:sample_rate=44100", "-ac", "1", d / "vo.wav")
    ff("-f", "lavfi", "-i", "sine=frequency=200:duration=3:sample_rate=44100", "-ac", "2", d / "music.wav")
    (d / "cues.srt").write_text("1\n00:00:00,500 --> 00:00:01,500\nHELLO MONTAGE\n\n"
                                "2\n00:00:03,000 --> 00:00:04,000\nSecond cue, exact text!\n", encoding="utf-8")
    (d / "words.json").write_text(json.dumps([
        {"text": "Do", "start": 0.05, "end": 0.30}, {"text": "not", "start": 0.35, "end": 0.60},
        {"text": "buy", "start": 0.62, "end": 0.90}, {"text": "symbiotic,", "start": 1.20, "end": 1.80},
        {"text": "really.", "start": 2.00, "end": 2.60}]), encoding="utf-8")
    # The same words as goose-studio's transcribe-audio-fal writes them: Whisper's nested
    # segments, `word` keys with a leading space.
    (d / "vo.whisper.json").write_text(json.dumps({"text": " Do not buy symbiotic, really.", "segments": [
        {"id": 0, "start": 0.05, "end": 2.6, "text": "Do not buy symbiotic, really.", "words": [
            {"word": " Do", "start": 0.05, "end": 0.30}, {"word": " not", "start": 0.35, "end": 0.60},
            {"word": " buy", "start": 0.62, "end": 0.90}, {"word": " symbiotic,", "start": 1.20, "end": 1.80},
            {"word": " really.", "start": 2.00, "end": 2.60}]}], "language": "en"}), encoding="utf-8")
    spec = {
        "output": {"width": W, "height": H, "fps": FPS},
        "clips": [
            {"file": "a.mp4", "label": "hook", "in": 0.5, "out": 1.5},
            {"file": "b.mp4", "label": "feature", "in": "00:00.0", "duration": 1.0},
            {"file": "c.mp4", "label": "b-roll"},
            {"file": "card.png", "label": "end-card", "duration": 1.0,
             "pan": {"from": {"zoom": 1}, "to": {"x": 0.5, "y": 0.3, "zoom": 1.5}}},
        ],
    }
    (d / "spec.json").write_text(json.dumps(spec), encoding="utf-8")
    edl = montage("edl", "--spec", d / "spec.json", "--out", d / "edl.json")
    body = montage("assemble", "--edl", d / "edl.json", "--out", d / "body.mp4", "--preset", "ultrafast")
    return {"dir": d, "spec": spec, "edl": edl, "body": body}


def test_edl_resolves_lengths_and_frames(fx):
    edl = json.loads((fx["dir"] / "edl.json").read_text())
    assert [s["label"] for s in edl["segments"]] == ["hook", "feature", "b-roll", "end-card"]
    assert [s["duration"] for s in edl["segments"]] == [1.0, 1.0, 1.5, 1.0]
    assert [s["frames"] for s in edl["segments"]] == [30, 30, 45, 30]
    assert [s["timeline_start"] for s in edl["segments"]] == [0.0, 1.0, 2.0, 3.5]
    assert edl["total_duration"] == 4.5 and edl["total_frames"] == 135
    assert edl["segments"][2]["source"]["sample_aspect_ratio"] == "4:3"
    assert edl["warnings"] == []


def test_assemble_matches_edl_and_normalizes(fx):
    v = streams(fx["dir"] / "body.mp4")["video"]
    assert int(v["nb_read_frames"]) == 135                      # duration == sum of EDL segments, exactly
    assert abs(float(v["duration"]) - 4.5) <= 1.0 / FPS
    assert (v["width"], v["height"], v["r_frame_rate"]) == (W, H, f"{FPS}/1")
    assert v.get("sample_aspect_ratio", "1:1") == "1:1" and v["pix_fmt"] == "yuv420p"
    assert "audio" not in streams(fx["dir"] / "body.mp4")       # clip audio dropped by default


def test_assemble_can_keep_clip_audio(fx):
    out = fx["dir"] / "body_audio.mp4"
    montage("assemble", "--edl", fx["dir"] / "edl.json", "--out", out, "--preset", "ultrafast", "--clip-audio", "keep")
    s = streams(out)
    assert s["audio"]["codec_name"] == "aac"
    assert abs(float(s["audio"]["duration"]) - 4.5) < 0.1       # silence filled in for clips/stills without audio


def test_kept_clip_audio_stays_in_sync_from_zero(fx):
    """A cut at in=0 on an AAC clip must not pull its audio one AAC frame (~21 ms) early."""
    d = fx["dir"]
    ff("-f", "lavfi", "-i", "color=black:s=160x90:r=30:d=1.5", "-f", "lavfi", "-i",
       "aevalsrc='if(between(t,0.3,0.33),0.8*sin(2*PI*1000*t),0)':s=48000:c=mono:d=1.5",
       "-c:v", "libx264", "-preset", "ultrafast", "-pix_fmt", "yuv420p", "-c:a", "aac", "-shortest", d / "click.mp4")
    spec = {"output": {"width": W, "height": H, "fps": FPS},
            "clips": [{"file": "click.mp4", "in": 0, "duration": 1.0}, {"file": "click.mp4", "in": 0.1, "duration": 1.0}]}
    (d / "click.json").write_text(json.dumps(spec), encoding="utf-8")
    montage("assemble", "--edl", d / "click.json", "--out", d / "click_out.mp4", "--preset", "ultrafast",
            "--clip-audio", "keep")
    pcm = subprocess.run(["ffmpeg", "-hide_banner", "-loglevel", "error", "-i", str(d / "click_out.mp4"), "-ac", "1",
                          "-ar", "48000", "-f", "s16le", "-"], capture_output=True, check=True).stdout
    loud = [i for i in range(0, len(pcm) // 2) if abs(int.from_bytes(pcm[2 * i:2 * i + 2], "little", signed=True)) > 3000]
    first, second = loud[0] / 48000, next(i for i in loud if i / 48000 > 0.9) / 48000
    print(f"clicks at {first * 1000:.1f} ms and {second * 1000:.1f} ms (expected 300 and 1200)")
    assert abs(first - 0.3) < 0.005 and abs(second - 1.2) < 0.005


def test_captions_burn_exact_text_on_the_right_frames(fx):
    renderer = caption_renderer()
    if renderer is None:
        pytest.skip("no caption renderer here: Pillow is missing and this ffmpeg has no libass")
    d = fx["dir"]
    res = montage("captions", "--video", d / "body.mp4", "--srt", d / "cues.srt", "--out", d / "cap.mp4",
                  "--preset", "ultrafast")
    assert res["renderer"] == renderer
    assert [c["text"] for c in res["cues"]] == ["HELLO MONTAGE", "Second cue, exact text!"]
    assert [(c["start"], c["end"]) for c in res["cues"]] == [(0.5, 1.5), (3.0, 4.0)]
    shown1, hidden, shown2 = (caption_diff(d / "body.mp4", d / "cap.mp4", t) for t in (1.0, 2.3, 3.4))
    print(f"caption-band luma diff: cue1 {shown1:.2f}, no cue {hidden:.2f}, cue2 {shown2:.2f}")
    assert shown1 > 2.0 and shown2 > 2.0
    assert shown1 > 4 * hidden and shown2 > 4 * hidden
    assert streams(d / "cap.mp4")["video"]["nb_read_frames"] == "135"
    # Frame-exact: 0.5-1.5 s and 3.0-4.0 s at 30 fps are frames 15-44 and 90-119. (0.5 s is
    # off the image demuxer's default 1/25 s grid, which would show the cue a frame late.)
    base, cap = band_frames(d / "body.mp4"), band_frames(d / "cap.mp4")
    on = [i for i, (x, y) in enumerate(zip(base, cap)) if sum(abs(p - q) for p, q in zip(x[::3], y[::3])) / len(x[::3]) > 2.0]
    print("caption on-frames:", on[0], "-", on[-1])
    assert on == list(range(15, 45)) + list(range(90, 120))


def test_mix_ducks_music_under_vo_and_masters_loudness(fx):
    d = fx["dir"]
    video = d / "cap.mp4" if (d / "cap.mp4").exists() else d / "body.mp4"
    res = montage("mix", "--video", video, "--vo", d / "vo.wav", "--vo-start", 1.0, "--music", d / "music.wav",
                  "--out", d / "final.mp4")
    s = streams(d / "final.mp4")
    assert s["audio"]["codec_name"] == "aac" and s["video"]["codec_name"] == "h264"
    assert abs(float(s["video"]["duration"]) - 4.5) <= 1.0 / FPS
    assert abs(float(s["audio"]["duration"]) - 4.5) < 0.1
    # VO plays 1.0-2.5 s. Music measured inside the VO (after the attack) and outside it
    # (after the release, before the 1 s fade-out at 3.5 s).
    before, under, after = (band_level(d / "final.mp4", a, b, "music") for a, b in ((0.2, 0.8), (1.6, 2.4), (3.0, 3.4)))
    vo_in, vo_out = band_level(d / "final.mp4", 1.6, 2.4, "vo"), band_level(d / "final.mp4", 3.0, 3.4, "vo")
    print(f"music dB: before VO {before}, under VO {under}, after VO {after}; ducking {after - under:.1f} dB; "
          f"VO band in/out {vo_in}/{vo_out}")
    assert under <= before - 6 and under <= after - 6           # the bed ducks under the VO
    assert vo_in > vo_out + 30                                  # the VO landed at --vo-start
    assert vo_in > under + 6                                    # and sits on top of the bed
    assert abs(res["loudness"]["output_i"] - (-14)) <= 1.0      # loudness-sane master
    assert res["loudness"]["output_tp"] <= -0.5
    assert any("loops" in w for w in res["warnings"])           # short bed loops, and says so


def test_run_builds_from_word_ranges_with_respelled_captions(fx):
    d = fx["dir"]
    spec = {
        "output": {"width": W, "height": H, "fps": FPS},
        "words": "vo.whisper.json",
        "clips": [
            {"file": "a.mp4", "label": "hook", "word_range": [0, 2]},
            {"file": "b.mp4", "label": "payoff-hold", "word_range": [3, 4]},
            {"file": "card.png", "label": "end-card", "duration": 1.0},
        ],
        "captions": {"words": "vo.whisper.json", "per": 1, "respell": {"symbiotic": "synbiotic"},
                     "style": {"color": "#FFE800"}},
        "audio": {"vo": "vo.wav", "music": "music.wav", "music_start": 0.5},
    }
    (d / "run.json").write_text(json.dumps(spec), encoding="utf-8")
    if caption_renderer() is None:
        spec.pop("captions")
        (d / "run.json").write_text(json.dumps(spec), encoding="utf-8")
    res = montage("run", "--spec", d / "run.json", "--out", d / "run.mp4", "--workdir", d / "run.work",
                  "--preset", "ultrafast")
    edl = json.loads((d / "run.work" / "edl.json").read_text())
    # Cuts land on word boundaries: [0..2] = 0 -> start of word 3; [3..4] = word 3 start -> word 4 end.
    assert [s["window"] for s in edl["segments"][:2]] == [[0.0, 1.2], [1.2, 2.6]]
    assert edl["total_frames"] == 108
    manifest = json.loads((d / "run.work" / "manifest.json").read_text())
    assert manifest["status"] == "pass" and manifest["has_audio"]
    assert abs(res["duration"] - 3.6) <= 1.0 / FPS
    if "captions" in spec:
        cap = next(s for s in manifest["steps"] if s["step"] == "captions")
        assert [c["text"] for c in cap["cues"]] == ["Do", "not", "buy", "synbiotic,", "really."]


def test_edl_reports_every_bad_clip(fx):
    d = fx["dir"]
    bad = {"output": {"width": W, "height": H}, "clips": [
        {"file": "missing.mp4"},
        {"file": "a.mp4", "in": 1.0, "out": 5.0},
        {"file": "card.png"},
        {"file": "a.mp4", "pan": {"to": {"zoom": 2}}},
    ]}
    (d / "bad.json").write_text(json.dumps(bad), encoding="utf-8")
    proc = montage("edl", "--spec", d / "bad.json", "--out", d / "bad.edl.json", ok=False)
    assert proc.returncode == 2
    for needle in ("file not found: missing.mp4", "is only 2.000s long", "still image needs duration",
                   "pan works on still images only"):
        assert needle in proc.stderr
    assert not (d / "bad.edl.json").exists()


def test_edl_warns_on_window_gaps_and_strict_fails(fx):
    d = fx["dir"]
    spec = {"output": {"width": W, "height": H}, "clips": [
        {"file": "a.mp4", "t_in": 0.0, "t_out": 1.0}, {"file": "b.mp4", "t_in": 1.2, "t_out": 2.0}]}
    (d / "gap.json").write_text(json.dumps(spec), encoding="utf-8")
    res = montage("edl", "--spec", d / "gap.json", "--out", d / "gap.edl.json")
    assert len(res["warnings"]) == 1 and "gap of 0.200s" in res["warnings"][0]
    proc = montage("edl", "--spec", d / "gap.json", "--out", d / "gap.edl.json", "--strict", ok=False)
    assert proc.returncode == 2 and "--strict" in proc.stderr


def test_load_words_accepts_transcriber_shapes(tmp_path):
    mod = load_module()
    want = [{"text": "Do", "start": 0.05, "end": 0.3}, {"text": "not", "start": 0.35, "end": 0.6}]
    shapes = {
        "flat-text": [{"text": "Do", "start": 0.05, "end": 0.3}, {"text": "not", "start": 0.35, "end": 0.6}],
        "flat-word": [{"word": " Do", "start": 0.05, "end": 0.3}, {"word": " not", "start": 0.35, "end": 0.6}],
        "openai-words": {"text": "Do not", "words": [{"word": "Do", "start": 0.05, "end": 0.3},
                                                     {"word": "not", "start": 0.35, "end": 0.6}]},
        "whisper-segments": {"text": " Do not", "segments": [
            {"words": [{"word": " Do", "start": 0.05, "end": 0.3}]},
            {"words": [{"word": " not", "start": 0.35, "end": 0.6}, {"word": " um", "start": None, "end": None}]}]},
        "fal-chunks": {"text": "Do not", "chunks": [{"text": " Do", "timestamp": [0.05, 0.3]},
                                                    {"text": " not", "timestamp": [0.35, 0.6]},
                                                    {"text": " x", "timestamp": [0.7, None]}]},
        "elevenlabs": {"words": [{"text": "Do", "start": 0.05, "end": 0.3, "type": "word"},
                                 {"text": " ", "start": 0.3, "end": 0.35, "type": "spacing"},
                                 {"text": "not", "start": 0.35, "end": 0.6, "type": "word"}]},
    }
    for name, data in shapes.items():
        f = tmp_path / f"{name}.json"
        f.write_text(json.dumps(data), encoding="utf-8")
        assert mod.load_words(f) == want, name
    (tmp_path / "none.json").write_text(json.dumps({"text": "no timings"}), encoding="utf-8")
    with pytest.raises(mod.SpecError, match="no word timings"):
        mod.load_words(tmp_path / "none.json")


def test_parsers_keep_text_exact():
    mod = load_module()
    assert mod.parse_time("01:02.5") == 62.5 and mod.parse_time(3) == 3.0
    cues = mod.parse_srt("﻿1\r\n00:00:01,000 --> 00:00:02,250\r\n  Two  spaces,\r\nsecond line \r\n")
    assert cues == [{"start": 1.0, "end": 2.25, "text": "  Two  spaces,\nsecond line "}]
    words = [{"text": "Cymbiotic!", "start": 0, "end": 0.5}, {"text": "ok", "start": 1.2, "end": 1.4}]
    got = mod.cues_from_words(words, 1, {"cymbiotic": "synbiotic"})
    assert got == [{"start": 0, "end": 0.5, "text": "synbiotic!"}, {"start": 1.2, "end": 1.4, "text": "ok"}]
